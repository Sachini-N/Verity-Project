const { PrismaClient } = require('@prisma/client');
const { notifyProjectMembers, notifyTargetAudience } = require('../services/notificationService');
const { addXP } = require('../services/gamificationService');
const prisma = new PrismaClient();

const createAnnouncement = async (req, res) => {
    const { title, content, category, targetAudience, projectId, attachmentUrl } = req.body;
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
            attachmentUrl: attachmentUrl || null
        }
    });

    res.status(201).json({ success: true, announcement });

    // Reward author with XP
    addXP(authorId, 'ANNOUNCEMENT_POST').catch(() => {});

    // Trigger notification routing
    if (projectId) {
        notifyProjectMembers(projectId, {
            type: 'ANNOUNCEMENT',
            title: 'New Project Announcement',
            message: `New announcement: "${title}".`,
            link: `/student/projects/${projectId}/announcements`,
            metadata: { announcementId: announcement.id }
        }).catch(() => { });
    } else {
        notifyTargetAudience(targetAudience || 'All', {
            type: 'ANNOUNCEMENT',
            title: category === 'Urgent' ? '🚨 Urgent Announcement' : '📢 New Announcement',
            message: `New announcement: "${title}".`,
            link: '/dashboard', // Adjust as needed for global announcements
            metadata: { announcementId: announcement.id },
            excludeUserId: authorId
        }).catch(() => { });
    }
};

const getAnnouncements = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

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

    const users = await prisma.user.findMany({
        where: { id: { in: announcements.map(a => a.authorId) } },
        select: { id: true, name: true, role: true }
    });

    const totalStudents = await prisma.user.count({
        where: { role: 'STUDENT', status: 'Active' }
    });

    const enhancedAnnouncements = announcements.map(a => {
        const user = users.find(u => u.id === a.authorId);

        let readPercentage = 0;
        if (totalStudents > 0) {
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
};

const getProjectAnnouncements = async (req, res) => {
    const { projectId } = req.params;
    const announcements = await prisma.announcement.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, announcements });
};

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'MANAGER' && req.user.id !== announcement.authorId) {
        return res.status(403).json({ success: false, message: 'Permission denied to delete this announcement.' });
    }

    await prisma.announcement.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
};

const updateAnnouncement = async (req, res) => {
    const { id } = req.params;
    const { title, content, category, isPinned, attachmentUrl } = req.body;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

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
            attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : announcement.attachmentUrl
        }
    });

    res.status(200).json({ success: true, announcement: updatedAnnouncement });
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await prisma.announcementRead.upsert({
        where: { userId_announcementId: { userId, announcementId: id } },
        update: { readAt: new Date() },
        create: { userId, announcementId: id }
    });

    res.status(200).json({ success: true, message: 'Marked as read' });
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getProjectAnnouncements,
    deleteAnnouncement,
    updateAnnouncement,
    markAsRead
};
