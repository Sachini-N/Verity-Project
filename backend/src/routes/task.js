const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { createNotification, notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

// POST /api/task/create
router.post('/create', async (req, res) => {
    try {
        const { projectId, title, description, assigneeEmail, priority, deadline } = req.body;

        if (assigneeEmail && !/^it\d{8}@my\.sliit\.lk$/i.test(assigneeEmail)) {
            return res.status(400).json({ success: false, message: 'Assignee email must be a valid SLIIT student email (e.g. it23833098@my.sliit.lk).' });
        }

        if (deadline && new Date(deadline).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) {
            return res.status(400).json({ success: false, message: 'Deadline cannot be in the past.' });
        }

        let assigneeId = null;
        if (assigneeEmail) {
            const user = await prisma.user.findUnique({ where: { email: assigneeEmail } });
            if (user) {
                assigneeId = user.id;
            } else {
                // For MVP, create a dummy user
                const dummy = await prisma.user.create({
                    data: { name: assigneeEmail.split('@')[0], email: assigneeEmail, password: 'dummy_password', role: 'STUDENT' }
                });
                assigneeId = dummy.id;
            }
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                assigneeId,
                priority: priority || 'Medium',
                deadline: deadline ? new Date(deadline) : null,
                status: 'To Do'
            },
            include: { assignee: true }
        });

        res.status(201).json({ success: true, task });

        // Notify assignee about the new task
        if (assigneeId) {
            createNotification({
                userId: assigneeId,
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: `You have been assigned a new task: "${title}".`,
                link: `/student/projects/${projectId}/kanban`,
                metadata: { projectId, taskId: task.id }
            }).catch(() => {});
        }
    } catch (error) {
        console.error("Task Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating task' });
    }
});

// GET /api/task/list/:projectId
router.get('/list/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: { assignee: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error("Task Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching tasks' });
    }
});

// PUT /api/task/:taskId/status
router.put('/:taskId/status', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, userId } = req.body;

        const existing = await prisma.task.findUnique({ where: { id: taskId } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const isDone = String(status).toLowerCase() === 'done';
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                status,
                completedAt: isDone ? existing.completedAt || new Date() : null
            }
        });

        const actorId = userId || existing.assigneeId;
        if (String(existing.status) !== String(status)) {
            await prisma.taskStatusLog.create({
                data: {
                    taskId,
                    oldStatus: existing.status,
                    newStatus: status,
                    changedBy: actorId || 'system'
                }
            });
        }
        if (actorId) {
            await prisma.activityLog
                .create({
                    data: {
                        userId: actorId,
                        projectId: existing.projectId,
                        type: 'TASK_UPDATE',
                        details: `task:${taskId}`
                    }
                })
                .catch(() => {});
        }

        res.status(200).json({ success: true, task });

        // Notify project members about status change
        if (String(existing.status) !== String(status)) {
            notifyProjectMembers(existing.projectId, {
                type: 'TASK_STATUS_CHANGED',
                title: 'Task Status Updated',
                message: `Task "${existing.title}" moved from ${existing.status} → ${status}.`,
                link: `/student/projects/${existing.projectId}/kanban`,
                metadata: { taskId },
                excludeUserId: actorId
            }).catch(() => {});
        }
    } catch (error) {
        console.error("Task Status Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating task status' });
    }
});

// POST /api/task/log-time
router.post('/log-time', async (req, res) => {
    try {
        const { taskId, hours } = req.body;
        // Mocking user ID for now since we don't have login module fully passing JWT
        const defaultUser = await prisma.user.findFirst();
        
        if (!defaultUser) {
           return res.status(400).json({ success: false, message: "No users found" });
        }

        const log = await prisma.timeLog.create({
            data: {
                taskId,
                hours: parseFloat(hours),
                userId: defaultUser.id,
            }
        });

        res.status(201).json({ success: true, log });
    } catch (error) {
        console.error("Time Log Error:", error);
        res.status(500).json({ success: false, message: 'Server error logging time' });
    }
});

module.exports = router;
