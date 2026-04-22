const { Queue, Worker } = require('bullmq');
const redisClient = require('../config/redis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { extractTextFromUrl } = require('../services/pdfExtractor');
const { detectAIContent } = require('../services/aiDetector');
const { checkPlagiarism } = require('../services/plagiarismChecker');
const { getIO } = require('../config/socket');

const plagiarismQueue = new Queue('plagiarism-check-queue', { connection: redisClient });

// Helper to determine risk category
function getRiskCategory(aiScore, plagiarismScore) {
    const ai = aiScore != null ? Number(aiScore) : 0;
    const pl = plagiarismScore != null ? Number(plagiarismScore) : 0;
    if (ai > 80 || pl > 80) return 'High';
    if (ai > 50 || pl > 50) return 'Medium';
    return 'Low';
}

const worker = new Worker('plagiarism-check-queue', async job => {
    const { submissionId, assignmentId, fileName, filePath } = job.data;
    console.log(`Starting analysis for submission ${submissionId}`);

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

        // 1. Extract Text
        const text = await extractTextFromUrl(filePath);

        // 2. AI Check
        const { aiScore } = await detectAIContent(text);

        // 3. Plagiarism Check
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

        // 4. Update DB
        const updatedSubmission = await prisma.assignmentSubmission.update({
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

        // Notify client via Socket.io
        try {
            const io = getIO();
            io.emit('submission_analyzed', {
                submissionId,
                status: 'Completed',
                aiScore,
                plagiarismScore,
                riskCategory
            });
        } catch (e) {
            console.log('Could not emit socket event:', e.message);
        }

        console.log(`Analysis complete for submission ${submissionId}`);
    } catch (error) {
        console.error('--- Submission Check Job Error ---');
        console.error(`Submission ID: ${submissionId}`);
        console.error(`Assignment ID: ${assignmentId}`);
        console.error('Error Details:', error.stack || error.message);

        await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: { checkStatus: 'Failed' }
        });
        
        try {
            const io = getIO();
            io.emit('submission_analyzed', {
                submissionId,
                status: 'Failed'
            });
        } catch (e) {}

        throw error; // Let BullMQ handle retry mechanism if configured
    }
}, { connection: redisClient });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

const scheduleSubmissionAnalysis = async (submissionId, assignmentId, fileName, filePath) => {
    await plagiarismQueue.add('analyze-submission', {
        submissionId,
        assignmentId,
        fileName,
        filePath
    });
};

module.exports = { scheduleSubmissionAnalysis };
