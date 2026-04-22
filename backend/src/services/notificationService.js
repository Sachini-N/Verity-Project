const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIO } = require('../config/socket');

/**
 * Create a notification for a single user.
 */
async function createNotification({ userId, type, title, message, link, metadata }) {
    try {
        if (!userId) return null;
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null,
                metadata: metadata || null
            }
        });
        
        try {
            const io = getIO();
            io.to(`user_${userId}`).emit('new_notification', notification);
        } catch (e) {
            console.error('Socket emit failed:', e.message);
        }

        return notification;
    } catch (error) {
        console.error('Notification creation error:', error.message);
        return null;
    }
}

/**
 * Notify all members of a project.
 */
async function notifyProjectMembers(projectId, { type, title, message, link, metadata, excludeUserId }) {
    try {
        const members = await prisma.projectMember.findMany({
            where: { projectId },
            select: { userId: true }
        });

        const notifications = [];
        for (const member of members) {
            if (excludeUserId && member.userId === excludeUserId) continue;
            const n = await createNotification({
                userId: member.userId,
                type,
                title,
                message,
                link,
                metadata: { ...metadata, projectId }
            });
            if (n) notifications.push(n);
        }
        return notifications;
    } catch (error) {
        console.error('Notify project members error:', error.message);
        return [];
    }
}

/**
 * Notify all users with a specific role.
 */
async function notifyByRole(role, { type, title, message, link, metadata }) {
    try {
        const users = await prisma.user.findMany({
            where: { role },
            select: { id: true }
        });

        const notifications = [];
        for (const user of users) {
            const n = await createNotification({
                userId: user.id,
                type,
                title,
                message,
                link,
                metadata
            });
            if (n) notifications.push(n);
        }
        return notifications;
    } catch (error) {
        console.error('Notify by role error:', error.message);
        return [];
    }
}

/**
 * Notify target audience (All or specific module)
 */
async function notifyTargetAudience(targetAudience, { type, title, message, link, metadata, excludeUserId }) {
    try {
        let userIds = new Set();

        if (targetAudience === 'All') {
            const allUsers = await prisma.user.findMany({
                where: { role: { in: ['STUDENT', 'LECTURER'] }, status: 'Active' },
                select: { id: true }
            });
            allUsers.forEach(u => userIds.add(u.id));
        } else {
            // Target is a module code (e.g., 'SE3050')
            const moduleData = await prisma.module.findUnique({
                where: { code: targetAudience },
                include: {
                    lecturers: { select: { id: true } },
                    semester: {
                        include: {
                            users: { select: { id: true }, where: { status: 'Active' } }
                        }
                    }
                }
            });

            if (moduleData) {
                moduleData.lecturers.forEach(l => userIds.add(l.id));
                if (moduleData.semester && moduleData.semester.users) {
                    moduleData.semester.users.forEach(s => userIds.add(s.id));
                }
            }
        }

        if (excludeUserId) {
            userIds.delete(excludeUserId);
        }

        const notifications = [];
        for (const userId of userIds) {
            const n = await createNotification({
                userId,
                type,
                title,
                message,
                link,
                metadata
            });
            if (n) notifications.push(n);
        }
        return notifications;
    } catch (error) {
        console.error('Notify target audience error:', error.message);
        return [];
    }
}

module.exports = { createNotification, notifyProjectMembers, notifyByRole, notifyTargetAudience };
