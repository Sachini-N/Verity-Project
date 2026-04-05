const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { createNotification, notifyByRole } = require('../services/notificationService');

const prisma = new PrismaClient();

const { extractTextFromUrl } = require('../services/pdfExtractor');
const { detectAIContent } = require('../services/aiDetector');
const { checkPlagiarism } = require('../services/plagiarismChecker');

// Helper to determine risk category (null AI score is ignored; plagiarism still applies)
function getRiskCategory(aiScore, plagiarismScore) {
    const ai = aiScore != null ? Number(aiScore) : 0;
    const pl = plagiarismScore != null ? Number(plagiarismScore) : 0;
    if (ai > 80 || pl > 80) return 'High';
    if (ai > 50 || pl > 50) return 'Medium';
    return 'Low';
}

function scheduleSubmissionAnalysis(submissionId, assignmentId, fileName, filePath) {
    process.nextTick(async () => {
        try {
            if (!fileName.toLowerCase().endsWith('.pdf')) {
                await prisma.assignmentSubmission.update({
                    where: { id: submissionId },
                    data: {
                        checkStatus: 'Skipped',
                        extractedText: null,
                        aiScore: null,
                        plagiarismScore: null,
                        riskCategory: null,
                        checkedAt: null
                    }
                });
                return;
            }

            await prisma.assignmentSubmission.update({
                where: { id: submissionId },
                data: { checkStatus: 'Processing' }
            });

            const text = await extractTextFromUrl(filePath);
            const { aiScore } = await detectAIContent(text);

            const existingSubmissions = await prisma.assignmentSubmission.findMany({
                where: {
                    assignmentId,
                    id: { not: submissionId },
                    extractedText: { not: null }
                },
                select: { id: true, extractedText: true }
            });

            const { plagiarismScore, matches } = checkPlagiarism(text, existingSubmissions);
            const riskCategory = getRiskCategory(aiScore, plagiarismScore);

            await prisma.assignmentSubmission.update({
                where: { id: submissionId },
                data: {
                    extractedText: text,
                    aiScore,
                    plagiarismScore,
                    riskCategory,
                    checkStatus: 'Completed',
                    checkedAt: new Date()
                }
            });

            if (matches && matches.length > 0) {
                for (const match of matches) {
                    await prisma.plagiarismMatch.create({
                        data: {
                            assignmentId,
                            submissionAId: submissionId,
                            submissionBId: match.submissionId,
                            similarityScore: match.score
                        }
                    });
                }
            }
        } catch (error) {
            console.error('--- Submission Check Error ---');
            console.error(`Submission ID: ${submissionId}`);
            console.error(`Assignment ID: ${assignmentId}`);
            console.error(`File: ${fileName}`);
            console.error('Error Details:', error.stack || error.message);
            console.error('------------------------------');

            await prisma.assignmentSubmission.update({
                where: { id: submissionId },
                data: { checkStatus: 'Failed' }
            });
        }
    });
}

// POST /api/assignment/create  — Lecturer creates an assignment
router.post('/create', async (req, res) => {
    try {
        const { title, description, moduleCode, moduleName, deadline, format, maxSizeMB, createdById } = req.body;

        if (!title || !moduleCode || !deadline || !format) {
            return res.status(400).json({ success: false, message: 'Title, module code, deadline, and format are required.' });
        }

        if (new Date(deadline) <= new Date()) {
            return res.status(400).json({ success: false, message: 'Deadline must be in the future.' });
        }

        // If no createdById provided, use the first lecturer in the DB as fallback
        let lecturerId = createdById;
        if (!lecturerId) {
            const lecturer = await prisma.user.findFirst({ where: { role: 'LECTURER' } });
            if (lecturer) {
                lecturerId = lecturer.id;
            } else {
                // Create a default lecturer for demo
                const defaultLecturer = await prisma.user.create({
                    data: { name: 'Default Lecturer', email: 'lecturer@verity.lk', password: 'hashed', role: 'LECTURER' }
                });
                lecturerId = defaultLecturer.id;
            }
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description: description || null,
                moduleCode,
                moduleName: moduleName || null,
                deadline: new Date(deadline),
                format,
                maxSizeMB: maxSizeMB || 50,
                createdById: lecturerId
            },
            include: { createdBy: { select: { id: true, name: true, email: true } } }
        });

        res.status(201).json({ success: true, assignment });

        // Notify all students about the new assignment
        notifyByRole('STUDENT', {
            type: 'ASSIGNMENT_CREATED',
            title: 'New Assignment Posted',
            message: `New assignment "${title}" for ${moduleCode}. Deadline: ${new Date(deadline).toLocaleDateString()}.`,
            link: '/student/assignments',
            metadata: { assignmentId: assignment.id }
        }).catch(() => {});
    } catch (error) {
        console.error("Assignment Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating assignment', error: error.message });
    }
});

// GET /api/assignment/list  — List all assignments (for students)
router.get('/list', async (req, res) => {
    try {
        const assignments = await prisma.assignment.findMany({
            include: {
                createdBy: { select: { id: true, name: true } },
                assignmentSubmissions: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, assignments });
    } catch (error) {
        console.error("Assignment List Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching assignments' });
    }
});

// GET /api/assignment/lecturer  — List assignments by lecturer
router.get('/lecturer', async (req, res) => {
    try {
        const { createdById } = req.query;

        const where = createdById ? { createdById } : {};

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true } },
                assignmentSubmissions: {
                    include: {
                        student: { select: { id: true, name: true, indexNumber: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, assignments });
    } catch (error) {
        console.error("Lecturer Assignment List Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching lecturer assignments' });
    }
});

// GET /api/assignment/:id/results  — Lecturer gets submissions with AI/Plagiarism scores (before /:id)
router.get('/:id/results', async (req, res) => {
    try {
        const { id } = req.params;
        const submissions = await prisma.assignmentSubmission.findMany({
            where: { assignmentId: id },
            include: {
                student: { select: { id: true, name: true, indexNumber: true } }
            },
            orderBy: { submittedAt: 'desc' }
        });

        const matches = await prisma.plagiarismMatch.findMany({
            where: { assignmentId: id },
            include: {
                submissionA: { include: { student: { select: { name: true } } } },
                submissionB: { include: { student: { select: { name: true } } } }
            }
        });

        res.status(200).json({ success: true, submissions, matches });
    } catch (error) {
        console.error("Assignment Results Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching results' });
    }
});

// GET /api/assignment/:id  — Get single assignment with submissions
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true } },
                assignmentSubmissions: {
                    include: {
                        student: { select: { id: true, name: true, indexNumber: true } }
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.status(200).json({ success: true, assignment });
    } catch (error) {
        console.error("Assignment Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching assignment' });
    }
});

// PUT /api/assignment/:id  — Update assignment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, deadline, format, status, maxSizeMB } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (deadline !== undefined) {
            if (new Date(deadline) <= new Date()) {
                return res.status(400).json({ success: false, message: 'Deadline must be in the future.' });
            }
            updateData.deadline = new Date(deadline);
        }
        if (format !== undefined) updateData.format = format;
        if (status !== undefined) updateData.status = status;
        if (maxSizeMB !== undefined) updateData.maxSizeMB = maxSizeMB;

        const assignment = await prisma.assignment.update({
            where: { id },
            data: updateData,
            include: { createdBy: { select: { id: true, name: true } } }
        });

        res.status(200).json({ success: true, assignment });
    } catch (error) {
        console.error("Assignment Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating assignment' });
    }
});

// DELETE /api/assignment/:id  — Delete assignment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.assignment.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        console.error("Assignment Delete Error:", error);
        res.status(500).json({ success: false, message: 'Server error deleting assignment' });
    }
});

// POST /api/assignment/submit  — Student submits a file (Supabase URL tracked in DB)
router.post('/submit', async (req, res) => {
    try {
        const { assignmentId, studentId, fileName, filePath } = req.body;

        if (!assignmentId || !studentId || !fileName || !filePath) {
            return res.status(400).json({ success: false, message: 'assignmentId, studentId, fileName, and filePath are required.' });
        }

        // Fetch the assignment to check deadline for late detection
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        const isLate = new Date() > new Date(assignment.deadline);

        // Check for duplicate submission
        const existing = await prisma.assignmentSubmission.findFirst({
            where: { assignmentId, studentId }
        });
        if (existing) {
            await prisma.plagiarismMatch.deleteMany({
                where: {
                    OR: [{ submissionAId: existing.id }, { submissionBId: existing.id }]
                }
            });

            const updated = await prisma.assignmentSubmission.update({
                where: { id: existing.id },
                data: {
                    fileName,
                    filePath,
                    late: isLate,
                    submittedAt: new Date(),
                    checkStatus: 'Pending',
                    extractedText: null,
                    aiScore: null,
                    plagiarismScore: null,
                    riskCategory: null,
                    checkedAt: null
                }
            });

            scheduleSubmissionAnalysis(updated.id, assignmentId, fileName, filePath);
            return res.status(200).json({ success: true, submission: updated, replaced: true });
        }

        const submission = await prisma.assignmentSubmission.create({
            data: {
                assignmentId,
                studentId,
                fileName,
                filePath,
                late: isLate,
                checkStatus: 'Pending'
            }
        });

        scheduleSubmissionAnalysis(submission.id, assignmentId, fileName, filePath);

        res.status(201).json({ success: true, submission });
    } catch (error) {
        console.error("Assignment Submit Error:", error);
        res.status(500).json({ success: false, message: 'Server error submitting assignment', error: error.message });
    }
});

module.exports = router;
