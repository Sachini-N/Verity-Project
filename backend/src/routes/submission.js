const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { notifyProjectMembers } = require('../services/notificationService');

const prisma = new PrismaClient();

const uploadsRoot = path.resolve(__dirname, '../../uploads/project-docs');
if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = String(req.body.projectId || '').trim();
        if (!projectId) {
            return cb(new Error('projectId is required'));
        }

        const projectDir = path.join(uploadsRoot, projectId);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        cb(null, projectDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${safeOriginal}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

const MILESTONE_META = {
    proposal: { key: 'proposal', label: 'Project Proposal', expectedWeek: 1 },
    progress1: { key: 'progress1', label: 'Progress Report 1', expectedWeek: 5 },
    progress2: { key: 'progress2', label: 'Progress Report 2', expectedWeek: 10 },
    final: { key: 'final', label: 'Final Report', expectedWeek: 14 }
};

function resolveMilestone(milestoneRaw) {
    const key = String(milestoneRaw || '').trim().toLowerCase();
    if (!key || !MILESTONE_META[key]) return null;
    return MILESTONE_META[key];
}

function getMetadataFromFilePath(filePathValue) {
    const raw = String(filePathValue || '');
    const pick = (label) => {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = raw.match(new RegExp(`${escaped}:\\s*([^|]+)`, 'i'));
        return match?.[1] ? String(match[1]).trim() : null;
    };

    const milestoneKey = pick('MilestoneKey');
    const expectedWeekRaw = pick('ExpectedWeek');
    const expectedWeek = expectedWeekRaw ? Number(expectedWeekRaw) : null;

    return {
        branch: pick('Branch'),
        notes: pick('Notes'),
        milestone: pick('Milestone'),
        milestoneKey,
        expectedWeek: Number.isFinite(expectedWeek) ? expectedWeek : null,
        storedPath: pick('Stored')
    };
}

function isPdfFile(file) {
    if (!file || !file.originalname) return false;
    return String(file.originalname).toLowerCase().endsWith('.pdf');
}

function resolveUploaderFromRequest(rawUser) {
    if (!rawUser) return null;
    const parsed = String(rawUser).trim();
    return parsed || null;
}

async function resolveUploaderId(uploaderId) {
    let resolvedUploaderId = resolveUploaderFromRequest(uploaderId);

    if (resolvedUploaderId) {
        const uploader = await prisma.user.findUnique({ where: { id: resolvedUploaderId } });
        if (!uploader) {
            throw new Error('INVALID_UPLOADER');
        }
        return resolvedUploaderId;
    }

    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
        defaultUser = await prisma.user.create({
            data: {
                name: 'Student',
                email: `student.${Date.now()}@verity.local`,
                password: 'test',
                role: 'STUDENT'
            }
        });
    }

    return defaultUser.id;
}

// POST /api/submission/create
router.post('/create', async (req, res) => {
    try {
        const {
            projectId,
            milestone,
            branch,
            notes,
            documentName,
            filePath,
            uploaderId,
            status
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const resolvedMilestone = resolveMilestone(milestone);
        if (!resolvedMilestone) {
            return res.status(400).json({
                success: false,
                message: 'Invalid milestone. Use one of: proposal, progress1, progress2, final.'
            });
        }

        const normalizedName = String(documentName || resolvedMilestone.label).trim();
        
        // Find default uploader
        let resolvedUploaderId;
        try {
            resolvedUploaderId = await resolveUploaderId(uploaderId);
        } catch (e) {
            if (e && e.message === 'INVALID_UPLOADER') {
                return res.status(400).json({ success: false, message: 'Invalid uploaderId' });
            }
            throw e;
        }

        const safeBranch = String(branch || 'main').trim();
        const safeNotes = String(notes || '').trim();
        const resolvedPath = String(filePath || '').trim() ||
            `Milestone: ${resolvedMilestone.label} | MilestoneKey: ${resolvedMilestone.key} | ExpectedWeek: ${resolvedMilestone.expectedWeek} | Branch: ${safeBranch} | Notes: ${safeNotes || 'N/A'}`;

        const submission = await prisma.submission.create({
            data: {
                projectId,
                uploaderId: resolvedUploaderId,
                originalName: normalizedName,
                filePath: resolvedPath,
                status: String(status || 'Submitted')
            }
        });

        res.status(201).json({ success: true, submission });

        // Notify project members about new submission
        notifyProjectMembers(projectId, {
            type: 'SUBMISSION_CREATED',
            title: 'New Submission',
            message: `A new submission "${normalizedName}" has been created.`,
            link: `/student/projects/${projectId}/submissions`,
            metadata: { submissionId: submission.id }
        }).catch(() => {});
    } catch (error) {
        console.error("Submission Error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return res.status(400).json({ success: false, message: 'Invalid projectId or uploaderId' });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Referenced record not found' });
            }
        }

        res.status(500).json({ success: false, message: 'Server error creating submission' });
    }
});

// POST /api/submission/upload  (real file upload)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { projectId, branch, notes, uploaderId, status, documentName, milestone } = req.body;
        const uploadedFile = req.file;
        const hasMilestone = String(milestone || '').trim().length > 0;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        if (!uploadedFile) {
            return res.status(400).json({ success: false, message: 'file is required' });
        }

        let resolvedMilestone = null;
        if (hasMilestone) {
            if (!isPdfFile(uploadedFile)) {
                if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
                    fs.unlinkSync(uploadedFile.path);
                }
                return res.status(400).json({ success: false, message: 'Only PDF files are allowed for project reports' });
            }

            resolvedMilestone = resolveMilestone(milestone);
            if (!resolvedMilestone) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid milestone. Use one of: proposal, progress1, progress2, final.'
                });
            }
        }

        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        let resolvedUploaderId;
        try {
            resolvedUploaderId = await resolveUploaderId(uploaderId);
        } catch (e) {
            if (e && e.message === 'INVALID_UPLOADER') {
                return res.status(400).json({ success: false, message: 'Invalid uploaderId' });
            }
            throw e;
        }

        const defaultName = resolvedMilestone
            ? `${resolvedMilestone.label} - ${uploadedFile.originalname}`
            : uploadedFile.originalname;
        const finalName = String(documentName || defaultName || '').trim() || uploadedFile.originalname;
        const relPath = path.relative(path.resolve(__dirname, '../..'), uploadedFile.path).replace(/\\/g, '/');
        const safeBranch = String(branch || 'main').trim();
        const safeNotes = String(notes || '').trim();
        const milestoneMeta = resolvedMilestone
            ? ` | Milestone: ${resolvedMilestone.label} | MilestoneKey: ${resolvedMilestone.key} | ExpectedWeek: ${resolvedMilestone.expectedWeek}`
            : '';
        const storageMeta = `Stored: ${relPath} | Size: ${uploadedFile.size} bytes${milestoneMeta} | Branch: ${safeBranch} | Notes: ${safeNotes || 'N/A'}`;

        const submission = await prisma.submission.create({
            data: {
                projectId,
                uploaderId: resolvedUploaderId,
                originalName: finalName,
                filePath: storageMeta,
                status: String(status || 'Submitted')
            }
        });

        notifyProjectMembers(projectId, {
            type: 'SUBMISSION_CREATED',
            title: 'New Submission',
            message: `A new file "${finalName}" has been uploaded.`,
            link: `/student/projects/${projectId}/files`,
            metadata: { submissionId: submission.id }
        }).catch(() => {});

        res.status(201).json({ success: true, submission });
    } catch (error) {
        console.error('Submission Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server error uploading file' });
    }
});

// GET /api/submission/list/:projectId
router.get('/list/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const submissions = await prisma.submission.findMany({
            where: { projectId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        indexNumber: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const enriched = submissions.map((submission) => {
            const parsed = getMetadataFromFilePath(submission.filePath);
            return {
                ...submission,
                meta: parsed
            };
        });

        res.status(200).json({ success: true, submissions: enriched });
    } catch (error) {
        console.error("Submission fetch error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching submissions' });
    }
});

// GET /api/submission/download/:id
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await prisma.submission.findUnique({ where: { id } });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        const match = String(submission.filePath || '').match(/Stored:\s*([^|]+)/i);
        if (!match?.[1]) {
            return res.status(400).json({ success: false, message: 'This submission has no stored file to download' });
        }

        const relativeStoredPath = match[1].trim();
        const absoluteStoredPath = path.resolve(path.resolve(__dirname, '../..'), relativeStoredPath);
        const backendRoot = path.resolve(__dirname, '../..');
        if (!absoluteStoredPath.startsWith(backendRoot)) {
            return res.status(400).json({ success: false, message: 'Invalid file path' });
        }

        if (!fs.existsSync(absoluteStoredPath)) {
            return res.status(404).json({ success: false, message: 'Stored file not found' });
        }

        return res.download(absoluteStoredPath, submission.originalName || path.basename(absoluteStoredPath));
    } catch (error) {
        console.error('Submission download error:', error);
        res.status(500).json({ success: false, message: 'Server error downloading file' });
    }
});

// GET /api/submission/view/:id
router.get('/view/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await prisma.submission.findUnique({ where: { id } });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        const match = String(submission.filePath || '').match(/Stored:\s*([^|]+)/i);
        if (!match?.[1]) {
            return res.status(400).json({ success: false, message: 'This submission has no stored file to preview' });
        }

        const relativeStoredPath = match[1].trim();
        const absoluteStoredPath = path.resolve(path.resolve(__dirname, '../..'), relativeStoredPath);
        const backendRoot = path.resolve(__dirname, '../..');
        if (!absoluteStoredPath.startsWith(backendRoot)) {
            return res.status(400).json({ success: false, message: 'Invalid file path' });
        }

        if (!fs.existsSync(absoluteStoredPath)) {
            return res.status(404).json({ success: false, message: 'Stored file not found' });
        }

        const fileName = submission.originalName || path.basename(absoluteStoredPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        return res.sendFile(absoluteStoredPath);
    } catch (error) {
        console.error('Submission view error:', error);
        res.status(500).json({ success: false, message: 'Server error viewing file' });
    }
});

// DELETE /api/submission/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await prisma.submission.findUnique({ where: { id } });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        const match = String(submission.filePath || '').match(/Stored:\s*([^|]+)/i);
        if (match?.[1]) {
            const relativeStoredPath = match[1].trim();
            const absoluteStoredPath = path.resolve(path.resolve(__dirname, '../..'), relativeStoredPath);
            const backendRoot = path.resolve(__dirname, '../..');
            if (absoluteStoredPath.startsWith(backendRoot) && fs.existsSync(absoluteStoredPath)) {
                fs.unlinkSync(absoluteStoredPath);
            }
        }

        await prisma.submission.delete({ where: { id } });

        res.status(200).json({ success: true, message: 'Submission deleted' });
    } catch (error) {
        console.error('Submission delete error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting submission' });
    }
});

module.exports = router;
