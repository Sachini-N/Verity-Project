const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/notification/list?userId=xxx
router.get('/list', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId query parameter is required.' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Notification List Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
    }
});

// GET /api/notification/unread-count?userId=xxx
router.get('/unread-count', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required.' });
        }

        const count = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('Unread Count Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/notification/:id/read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking notification read.' });
    }
});

// PUT /api/notification/read-all
router.put('/read-all', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required.' });
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/notification/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
        console.error('Notification Delete Error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting notification.' });
    }
});

module.exports = router;
