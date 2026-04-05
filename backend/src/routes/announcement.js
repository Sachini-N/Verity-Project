const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

// POST /api/announcement
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, content, category, targetAudience, projectId } = req.body;
        const authorId = req.user.id;

        if (req.user.role === 'STUDENT') {
            return res.status(403).json({ message: 'Students are not allowed to post announcements' });
        }

        const announcement = await prisma.announcement.create({
            data: {
                projectId: projectId || null,
                title,
                content,
                category: category || 'General',
                targetAudience: targetAudience || 'All',
                authorId,
                attachmentUrl: req.body.attachmentUrl || null
            }
        });

        // Fetch back with author details if possible, but schema just stores authorId as String.
        // We'll return the announcement directly.
        res.status(201).json({ success: true, announcement });

        // Notify all project members about the new announcement
        notifyProjectMembers(projectId, {
            type: 'ANNOUNCEMENT',
            title: 'New Announcement',
            message: `New announcement: "${title}".`,
            link: `/student/projects/${projectId}/announcements`,
            metadata: { announcementId: announcement.id }
        }).catch(() => { });
    } catch (error) {
        console.error("Announcement Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating announcement' });
    }
});

// GET /api/announcement
// Fetch global announcements (or all visible ones)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // Fetch paginated announcements
        const announcements = await prisma.announcement.findMany({
            take: limit,
            skip: offset,
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                reads: true
            }
        });

        // Enhance with author data
        const users = await prisma.user.findMany({
            where: { id: { in: announcements.map(a => a.authorId) } },
            select: { id: true, name: true, role: true }
        });

        // Compute total active students strictly for the Read % metric
        const totalStudents = await prisma.user.count({
            where: { role: 'STUDENT', status: 'Active' }
        });

        const enhancedAnnouncements = announcements.map(a => {
            const user = users.find(u => u.id === a.authorId);

            // Compute read %
            let readPercentage = 0;
            if (totalStudents > 0) {
                // Assumes 1 read per student visually, limiting to totalStudents mathematically
                const uniqueReads = new Set(a.reads.map(r => r.userId)).size;
                readPercentage = Math.min(100, Math.round((uniqueReads / totalStudents) * 100));
            }

            return {
                id: a.id,
                authorId: a.authorId,
                author: user ? user.name : 'Unknown User',
                role: user ? (user.role === 'LECTURER' ? 'Lecturer' : user.role === 'MANAGER' ? 'Manager' : 'Student') : 'Student',
                avatar: user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U',
                title: a.title,
                description: a.content,
                tag: a.category,
                module: a.targetAudience,
                timestamp: new Date(a.createdAt).toLocaleString(),
                pinned: a.isPinned,
                attachmentUrl: a.attachmentUrl,
                readPercentage: readPercentage
            };
        });

        res.status(200).json({ success: true, announcements: enhancedAnnouncements });
    } catch (error) {
        console.error("Announcement Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching announcements' });
    }
});

// GET /api/announcement/:projectId (legacy, kept for backwards compatibility)
router.get('/:projectId', authMiddleware, async (req, res) => {
    try {
        const { projectId } = req.params;
        const announcements = await prisma.announcement.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, announcements });
    } catch (error) {
        console.error("Announcement Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching announcements' });
    }
});

// DELETE /api/announcement/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await prisma.announcement.findUnique({ where: { id } });

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Only Manager or Author can delete
        if (req.user.role !== 'MANAGER' && req.user.id !== announcement.authorId) {
            return res.status(403).json({ success: false, message: 'Permission denied to delete this announcement.' });
        }

        await prisma.announcement.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error("Announcement Delete Error:", error);
        res.status(500).json({ success: false, message: 'Server error deleting announcement' });
    }
});

// PUT /api/announcement/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, isPinned } = req.body;

        const announcement = await prisma.announcement.findUnique({ where: { id } });
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Only Author can edit
        if (req.user.id !== announcement.authorId) {
            return res.status(403).json({ success: false, message: 'Permission denied to edit this announcement.' });
        }

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id },
            data: {
                title: title !== undefined ? title : announcement.title,
                content: content !== undefined ? content : announcement.content,
                category: category !== undefined ? category : announcement.category,
                isPinned: typeof isPinned === 'boolean' ? isPinned : announcement.isPinned,
                attachmentUrl: req.body.attachmentUrl !== undefined ? req.body.attachmentUrl : announcement.attachmentUrl
            }
        });

        res.status(200).json({ success: true, announcement: updatedAnnouncement });
    } catch (error) {
        console.error("Announcement Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating announcement' });
    }
});

module.exports = router;

// POST /api/announcement/:id/read
router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const announcement = await prisma.announcement.findUnique({ where: { id } });
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Upsert logic using unique constraint
        await prisma.announcementRead.upsert({
            where: { userId_announcementId: { userId, announcementId: id } },
            update: { readAt: new Date() },
            create: { userId, announcementId: id }
        });

        res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error("Announcement Read Tracking Error:", error);
        res.status(500).json({ success: false, message: 'Server error tracking read status' });
    }
});
