const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create a notification for a single user.
 */
async function createNotification({ userId, type, title, message, link, metadata }) {
    try {
        if (!userId) return null;
        return await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null,
                metadata: metadata || null
            }
        });
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

module.exports = { createNotification, notifyProjectMembers, notifyByRole };
