const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MANAGER_NOTIFICATION_TYPES = new Set([
    'PROJECT_CREATED',
    'PROJECT_APPROVED',
    'PROJECT_REJECTED',
    'HIGH_RISK',
    'FAIRNESS_ALERT',
    'SUBMISSION_FLAGGED'
]);

function normalizeType(value) {
    return String(value || '').trim().toUpperCase();
}

function applyScopeFilter(notifications, scope) {
    if (normalizeType(scope) !== 'MANAGER') return notifications;
    return notifications.filter((notif) => MANAGER_NOTIFICATION_TYPES.has(normalizeType(notif.type)));
}

// GET /api/notification/list?userId=xxx
router.get('/list', async (req, res) => {
    try {
        const { userId, scope } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId query parameter is required.' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const filtered = applyScopeFilter(notifications, scope);

        res.status(200).json({ success: true, notifications: filtered });
    } catch (error) {
        console.error('Notification List Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
    }
});

// GET /api/notification/unread-count?userId=xxx
router.get('/unread-count', async (req, res) => {
    try {
        const { userId, scope } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required.' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId, isRead: false }
        });

        const count = applyScopeFilter(notifications, scope).length;

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
        const { userId, scope } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required.' });
        }

        if (normalizeType(scope) === 'MANAGER') {
            await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                    type: { in: Array.from(MANAGER_NOTIFICATION_TYPES) }
                },
                data: { isRead: true }
            });
        } else {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
        }

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
