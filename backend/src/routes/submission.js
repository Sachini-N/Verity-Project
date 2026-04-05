const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

// POST /api/submission/create
router.post('/create', async (req, res) => {
    try {
        const { projectId, milestone, branch, notes } = req.body;
        
        // Find default uploader
        let defaultUser = await prisma.user.findFirst();
        if (!defaultUser) {
           defaultUser = await prisma.user.create({ data: { name: 'Student', email: 'test@student.lk', password: 'test', role: 'STUDENT' }});
        }

        const submission = await prisma.submission.create({
            data: {
                projectId,
                uploaderId: defaultUser.id,
                // Using schema fields creatively for branch/notes MVP
                originalName: milestone,
                filePath: `Branch: ${branch} | Notes: ${notes}`,
                status: 'Submitted'
            }
        });

        res.status(201).json({ success: true, submission });

        // Notify project members about new submission
        notifyProjectMembers(projectId, {
            type: 'SUBMISSION_CREATED',
            title: 'New Submission',
            message: `A new submission "${milestone}" has been created.`,
            link: `/student/projects/${projectId}/submissions`,
            metadata: { submissionId: submission.id }
        }).catch(() => {});
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating submission' });
    }
});

// GET /api/submission/list/:projectId
router.get('/list/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const submissions = await prisma.submission.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, submissions });
    } catch (error) {
        console.error("Submission fetch error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching submissions' });
    }
});

module.exports = router;
