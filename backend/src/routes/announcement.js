const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

// POST /api/announcement/create
router.post('/create', async (req, res) => {
    try {
        const { projectId, title, content } = req.body;
        
        // Wait, authorId is required by schema:
        // authorId String
        // Since auth is mocked for now, we'll use a dummy UUID or fetch a leader's ID.
        // Let's just create a dummy or find any user to act as author.
        let defaultAuthor = await prisma.user.findFirst();
        if (!defaultAuthor) {
             defaultAuthor = await prisma.user.create({
                 data: { name: 'System Admin', email: 'admin@sliit.lk', password: 'pass', role: 'MANAGER' }
             });
        }

        const announcement = await prisma.announcement.create({
            data: {
                projectId,
                title,
                content,
                authorId: defaultAuthor.id
            }
        });

        res.status(201).json({ success: true, announcement });

        // Notify all project members about the new announcement
        notifyProjectMembers(projectId, {
            type: 'ANNOUNCEMENT',
            title: 'New Announcement',
            message: `New announcement: "${title}".`,
            link: `/student/projects/${projectId}/announcements`,
            metadata: { announcementId: announcement.id }
        }).catch(() => {});
    } catch (error) {
        console.error("Announcement Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating announcement' });
    }
});

// GET /api/announcement/:projectId
router.get('/:projectId', async (req, res) => {
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

module.exports = router;
