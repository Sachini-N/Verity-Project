const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { createNotification, notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

// POST /api/report/create
router.post('/create', async (req, res) => {
    try {
        const { projectId, weekNumber, completed, challenges, plan, submittedBy } = req.body;
        
        let userId = submittedBy;
        if (!userId) {
            let defaultUser = await prisma.user.findFirst();
            if (!defaultUser) {
               defaultUser = await prisma.user.create({ data: { name: 'Student', email: 'test@student.lk', password: 'test', role: 'STUDENT' }});
            }
            userId = defaultUser.id;
        }

        const report = await prisma.weeklyReport.create({
            data: {
                projectId,
                weekNumber: parseInt(weekNumber) || 1,
                content: JSON.stringify({ completed, challenges, plan }),
                submittedBy: userId,
                status: 'Pending'
            }
        });

        res.status(201).json({ success: true, report });

        // Notify project members about the submitted report
        notifyProjectMembers(projectId, {
            type: 'REPORT_SUBMITTED',
            title: 'Weekly Report Submitted',
            message: `Weekly Report #${parseInt(weekNumber) || 1} has been submitted.`,
            link: `/student/projects/${projectId}/reports/weekly`,
            metadata: { reportId: report.id },
            excludeUserId: userId
        }).catch(() => {});
    } catch (error) {
        console.error("Weekly Report Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating report' });
    }
});

// GET /api/report/list/:projectId
router.get('/list/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const reports = await prisma.weeklyReport.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        // We need to fetch user details to display in LecturerReview
        const userIds = [...new Set(reports.map(r => r.submittedBy))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, indexNumber: true }
        });
        
        // Members to get their roles
        const members = await prisma.projectMember.findMany({
            where: { projectId, userId: { in: userIds } }
        });

        const enhancedReports = reports.map(r => {
            const user = users.find(u => u.id === r.submittedBy);
            const member = members.find(m => m.userId === r.submittedBy);
            
            let parsedContent = { completed: '', challenges: '', plan: '' };
            try {
                parsedContent = JSON.parse(r.content);
            } catch (e) {}

            return {
                id: r.id,
                projectId: r.projectId,
                weekNumber: r.weekNumber,
                status: r.status,
                feedback: r.feedback,
                grade: r.grade,
                createdAt: r.createdAt,
                userId: r.submittedBy,
                userName: user ? user.name : 'Unknown User',
                userIndexNumber: user ? user.indexNumber : null,
                role: member ? member.role : 'Member',
                completed: parsedContent.completed,
                challenges: parsedContent.challenges,
                plan: parsedContent.plan
            };
        });

        res.status(200).json({ success: true, reports: enhancedReports });
    } catch (error) {
        console.error("Weekly Report Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching reports' });
    }
});

// PUT /api/report/review/:id
router.put('/review/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { grade, feedback, status } = req.body;

        const report = await prisma.weeklyReport.update({
            where: { id },
            data: {
                grade,
                feedback,
                status: status || 'Reviewed'
            }
        });

        res.status(200).json({ success: true, report });

        // Notify the student who submitted it that it was reviewed
        const original = await prisma.weeklyReport.findUnique({ where: { id } });
        if (original?.submittedBy) {
            createNotification({
                userId: original.submittedBy,
                type: 'REPORT_REVIEWED',
                title: 'Report Reviewed',
                message: `Your Weekly Report has been reviewed. Grade: ${grade || 'N/A'}.`,
                link: `/student/projects/${original.projectId}/reports/weekly`,
                metadata: { reportId: id }
            }).catch(() => {});
        }
    } catch (error) {
        console.error("Weekly Report Review Error:", error);
        res.status(500).json({ success: false, message: 'Server error reviewing report' });
    }
});

module.exports = router;
