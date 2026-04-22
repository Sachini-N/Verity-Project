const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');
const { extractGithubLogin, buildGitByUserMap } = require('../lib/githubUserMatch');
const { generateGroupProjectReportInsights } = require('./aiService');

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function toPct(numerator, denominator, fallback = 0) {
    if (!denominator || denominator <= 0) return fallback;
    return clamp(Math.round((numerator / denominator) * 100), 0, 100);
}

function pushSuspicion(list, severity, title, detail) {
    list.push({ severity, title, detail });
}

function buildFallbackInsights(projectTitle, members) {
    const top = members[0];
    const lowSignals = members.filter((m) => m.suspicionSignals.length > 0).length;

    return {
        executiveSummary: `Project "${projectTitle}" shows ${top ? `${top.name} as current top contributor` : 'no measurable contributors yet'} based on commits, task completion, reporting cadence, and activity evidence. ${lowSignals > 0 ? `${lowSignals} member(s) have suspicious or low-contribution signals that should be reviewed.` : 'No critical anomaly patterns were detected by deterministic checks.'}`,
        comparativeAnalysis: [
            `Ranking is evidence-based from commits, tasks, reports, and activity logs.`,
            `Score spread indicates whether workload is balanced across members.`,
            `Suspicion signals are generated from deterministic behavioral patterns and should be validated with context.`
        ],
        riskAssessment: members
            .filter((m) => m.suspicionSignals.length > 0)
            .slice(0, 8)
            .map((m) => `${m.name}: ${m.suspicionSignals.map((s) => s.title).join('; ')}`),
        lecturerRecommendations: [
            'Review students with medium/high suspicion levels and request evidence for completed work.',
            'Redistribute upcoming tasks when score variance is large between top and bottom contributors.',
            'Use weekly check-ins to align task board updates with real commit activity.'
        ],
        memberNarratives: members.map((m) => ({
            name: m.name,
            summary: `${m.name} completed ${m.doneTasks}/${m.assignedTasks} tasks, produced ${m.commits} commits, and submitted ${m.weeklyReports} weekly reports. ${m.suspicionSignals.length > 0 ? `Signals: ${m.suspicionSignals.map((s) => s.title).join(', ')}.` : 'No major suspicious patterns flagged.'}`
        }))
    };
}

async function buildReportPayload(projectId) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            indexNumber: true,
                            github: true
                        }
                    }
                }
            },
            tasks: {
                select: {
                    id: true,
                    assigneeId: true,
                    status: true,
                    priority: true,
                    title: true,
                    updatedAt: true
                }
            },
            weeklyReports: {
                select: {
                    id: true,
                    submittedBy: true,
                    weekNumber: true,
                    createdAt: true
                }
            },
            riskFlags: {
                where: { isResolved: false },
                select: {
                    id: true,
                    type: true,
                    message: true,
                    createdAt: true
                }
            },
            githubRepos: {
                select: {
                    id: true,
                    owner: true,
                    repoName: true,
                    commits: {
                        select: {
                            authorName: true,
                            authorEmail: true,
                            message: true,
                            date: true
                        }
                    }
                }
            }
        }
    });

    if (!project) return null;

    const memberUsers = project.members
        .filter((m) => m.user)
        .map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            email: (m.user.email || '').toLowerCase(),
            indexNumber: m.user.indexNumber || 'N/A',
            role: m.role,
            githubLogin: extractGithubLogin(m.user.github)
        }));

    const [doneLogs, recentActivityLogs] = await Promise.all([
        prisma.taskStatusLog.findMany({
            where: {
                task: { projectId },
                newStatus: { equals: 'Done', mode: 'insensitive' }
            },
            include: {
                task: {
                    select: {
                        assigneeId: true,
                        priority: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.activityLog.findMany({
            where: {
                userId: { in: memberUsers.map((m) => m.userId) },
                createdAt: { gte: new Date(Date.now() - 14 * 86400000) }
            },
            select: {
                userId: true,
                type: true,
                createdAt: true
            }
        })
    ]);

    const taskByUser = new Map();
    const doneByUser = new Map();
    const reportByUser = new Map();
    const activityByUser = new Map();

    memberUsers.forEach((u) => {
        taskByUser.set(u.userId, 0);
        doneByUser.set(u.userId, 0);
        reportByUser.set(u.userId, 0);
        activityByUser.set(u.userId, 0);
    });

    project.tasks.forEach((t) => {
        if (!t.assigneeId || !taskByUser.has(t.assigneeId)) return;
        taskByUser.set(t.assigneeId, (taskByUser.get(t.assigneeId) || 0) + 1);
        if (String(t.status).toLowerCase() === 'done') {
            doneByUser.set(t.assigneeId, (doneByUser.get(t.assigneeId) || 0) + 1);
        }
    });

    project.weeklyReports.forEach((r) => {
        if (!reportByUser.has(r.submittedBy)) return;
        reportByUser.set(r.submittedBy, (reportByUser.get(r.submittedBy) || 0) + 1);
    });

    recentActivityLogs.forEach((log) => {
        if (!activityByUser.has(log.userId)) return;
        activityByUser.set(log.userId, (activityByUser.get(log.userId) || 0) + 1);
    });

    const githubRepo = project.githubRepos[0] || null;
    const { gitByUser } = await buildGitByUserMap(memberUsers, githubRepo);

    const maxCommits = Math.max(1, ...memberUsers.map((u) => gitByUser.get(u.userId) || 0));
    const maxReports = Math.max(1, ...memberUsers.map((u) => reportByUser.get(u.userId) || 0));
    const maxActivity = Math.max(1, ...memberUsers.map((u) => activityByUser.get(u.userId) || 0));

    const burstByUser = new Map();
    memberUsers.forEach((u) => burstByUser.set(u.userId, 0));

    // Detect quick task bursts in a 15-minute window.
    const groupedDoneLogs = new Map();
    doneLogs.forEach((l) => {
        const uid = l.changedBy || l.task.assigneeId;
        if (!uid || !burstByUser.has(uid)) return;
        if (!groupedDoneLogs.has(uid)) groupedDoneLogs.set(uid, []);
        groupedDoneLogs.get(uid).push(new Date(l.createdAt).getTime());
    });

    groupedDoneLogs.forEach((times, uid) => {
        times.sort((a, b) => a - b);
        let left = 0;
        let best = 0;
        for (let right = 0; right < times.length; right++) {
            while (times[left] < times[right] - 15 * 60 * 1000) left += 1;
            best = Math.max(best, right - left + 1);
        }
        burstByUser.set(uid, best);
    });

    const members = memberUsers.map((u) => {
        const assignedTasks = taskByUser.get(u.userId) || 0;
        const doneTasks = doneByUser.get(u.userId) || 0;
        const commits = gitByUser.get(u.userId) || 0;
        const weeklyReports = reportByUser.get(u.userId) || 0;
        const recentActivity = activityByUser.get(u.userId) || 0;
        const burstCount = burstByUser.get(u.userId) || 0;

        const taskScore = assignedTasks > 0 ? toPct(doneTasks, assignedTasks, 0) : 50;
        const commitScore = toPct(commits, maxCommits, 0);
        const reportScore = toPct(weeklyReports, maxReports, 0);
        const activityScore = toPct(recentActivity, maxActivity, 0);

        const suspicionSignals = [];

        if (assignedTasks >= 4 && doneTasks === 0 && commits === 0) {
            pushSuspicion(suspicionSignals, 'high', 'Likely Inactive Member', 'Has multiple assigned tasks but no completed tasks and no commits.');
        }

        if (doneTasks >= 5 && commits === 0) {
            pushSuspicion(suspicionSignals, 'high', 'Task Completion Without Code Evidence', 'Completed many tasks but no commit evidence was found.');
        }

        if (burstCount >= 5) {
            pushSuspicion(suspicionSignals, 'medium', 'Rapid Task Closure Pattern', `Closed ${burstCount} tasks within a short time window.`);
        }

        if (commits > 0 && doneTasks === 0 && assignedTasks > 0) {
            pushSuspicion(suspicionSignals, 'medium', 'Code-to-Task Mismatch', 'Commit activity exists but assigned tasks are not marked done.');
        }

        const penalty = suspicionSignals.reduce((sum, s) => sum + (s.severity === 'high' ? 12 : 6), 0);

        const score = clamp(
            Math.round(taskScore * 0.4 + commitScore * 0.3 + reportScore * 0.15 + activityScore * 0.15 - penalty),
            0,
            100
        );

        return {
            ...u,
            assignedTasks,
            doneTasks,
            commits,
            weeklyReports,
            recentActivity,
            taskScore,
            commitScore,
            reportScore,
            activityScore,
            suspicionSignals,
            score
        };
    });

    const rankedMembers = [...members]
        .sort((a, b) => b.score - a.score)
        .map((m, idx) => ({ ...m, rank: idx + 1 }));

    const teamAvgScore = rankedMembers.length
        ? Math.round(rankedMembers.reduce((acc, m) => acc + m.score, 0) / rankedMembers.length)
        : 0;

    const suspiciousSignals = rankedMembers.flatMap((m) =>
        m.suspicionSignals.map((s) => ({
            memberName: m.name,
            severity: s.severity,
            title: s.title,
            detail: s.detail
        }))
    );

    let aiNarrative = await generateGroupProjectReportInsights({
        projectName: project.title,
        memberCount: rankedMembers.length,
        teamAverageScore: teamAvgScore,
        rankedMembers: rankedMembers.map((m) => ({
            name: m.name,
            role: m.role,
            score: m.score,
            assignedTasks: m.assignedTasks,
            doneTasks: m.doneTasks,
            commits: m.commits,
            weeklyReports: m.weeklyReports,
            recentActivity: m.recentActivity,
            suspicionSignals: m.suspicionSignals.map((s) => s.title)
        })),
        unresolvedProjectFlags: project.riskFlags.map((f) => f.type),
        suspiciousSignals
    });

    if (!aiNarrative) {
        aiNarrative = buildFallbackInsights(project.title, rankedMembers);
    }

    const narrativeByName = new Map(
        (aiNarrative.memberNarratives || []).map((n) => [String(n.name || '').toLowerCase(), n.summary])
    );

    const membersWithNarrative = rankedMembers.map((m) => ({
        ...m,
        aiSummary:
            narrativeByName.get(String(m.name || '').toLowerCase()) ||
            `${m.name} scored ${m.score}/100 with ${m.commits} commits and ${m.doneTasks}/${m.assignedTasks} completed tasks.`
    }));

    return {
        project: {
            id: project.id,
            title: project.title,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate
        },
        generatedAt: new Date(),
        teamStats: {
            memberCount: membersWithNarrative.length,
            taskCount: project.tasks.length,
            unresolvedRiskFlags: project.riskFlags.length,
            teamAvgScore,
            topPerformer: membersWithNarrative[0]?.name || 'N/A'
        },
        members: membersWithNarrative,
        suspiciousSignals,
        aiNarrative,
        unresolvedFlags: project.riskFlags
    };
}

function ensureSpace(doc, requiredHeight = 60) {
    if (doc.y + requiredHeight > doc.page.height - 60) {
        doc.addPage();
    }
}

function drawSectionTitle(doc, text) {
    ensureSpace(doc, 40);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text(text);
    doc.moveDown(0.2);
    const y = doc.y;
    doc.save();
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
    doc.restore();
    doc.moveDown(0.5);
}

function drawBullets(doc, items) {
    if (!Array.isArray(items) || items.length === 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text('No additional notes.');
        return;
    }

    items.forEach((item) => {
        ensureSpace(doc, 28);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('• ', { continued: true });
        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(String(item));
    });
}

function drawRankingTable(doc, members) {
    const startX = 50;
    const widths = [35, 135, 55, 85, 60, 60, 65];
    const headers = ['Rank', 'Student', 'Score', 'Tasks', 'Commits', 'Reports', 'Risk'];

    const rowHeight = 22;

    const drawHeader = () => {
        ensureSpace(doc, 30);
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155');
        headers.forEach((h, idx) => {
            doc.text(h, x, doc.y, { width: widths[idx], align: idx === 1 ? 'left' : 'center' });
            x += widths[idx];
        });
        doc.moveDown(0.4);
        const yLine = doc.y;
        doc.save();
        doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(startX, yLine).lineTo(startX + widths.reduce((a, b) => a + b, 0), yLine).stroke();
        doc.restore();
        doc.moveDown(0.2);
    };

    drawHeader();

    members.forEach((m, idx) => {
        ensureSpace(doc, rowHeight + 6);
        const y = doc.y;

        if (idx % 2 === 0) {
            doc.save();
            doc.rect(startX, y - 2, widths.reduce((a, b) => a + b, 0), rowHeight).fill('#f8fafc');
            doc.restore();
        }

        const riskLabel =
            m.suspicionSignals.length === 0
                ? 'Low'
                : m.suspicionSignals.some((s) => s.severity === 'high')
                  ? 'High'
                  : 'Medium';

        const values = [
            String(m.rank),
            `${m.name}${m.role === 'LEADER' ? ' (L)' : ''}`,
            String(m.score),
            `${m.doneTasks}/${m.assignedTasks}`,
            String(m.commits),
            String(m.weeklyReports),
            riskLabel
        ];

        let x = startX;
        values.forEach((v, colIdx) => {
            const isRisk = colIdx === 6;
            const isScore = colIdx === 2;
            const color = isRisk
                ? riskLabel === 'High'
                    ? '#dc2626'
                    : riskLabel === 'Medium'
                      ? '#d97706'
                      : '#0f766e'
                : isScore
                  ? '#1e293b'
                  : '#334155';

            doc.font(colIdx === 1 ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(9)
                .fillColor(color)
                .text(v, x, y + 4, { width: widths[colIdx], align: colIdx === 1 ? 'left' : 'center' });
            x += widths[colIdx];
        });

        doc.y = y + rowHeight;
    });

    doc.moveDown(0.5);
}

async function generateProjectContributionReportPdf(res, projectId) {
    const payload = await buildReportPayload(projectId);
    if (!payload) return null;

    const fileName = `group-contribution-report-${payload.project.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, left: 50, right: 50, bottom: 50 },
        info: {
            Title: `Group Contribution Report - ${payload.project.title}`,
            Author: 'Verity Intelligence Engine'
        }
    });

    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 120).fill('#eef2ff');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(22).text('Group Project Contribution Report', 50, 42);
    doc.fillColor('#334155').font('Helvetica').fontSize(10).text('Verity Intelligence • Lecturer View', 50, 74);
    doc.text(`Generated: ${payload.generatedAt.toLocaleString()}`, 50, 90);

    doc.moveDown(3.5);

    drawSectionTitle(doc, 'Project Snapshot');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(payload.project.title);
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Status: ${payload.project.status} | Members: ${payload.teamStats.memberCount} | Tasks: ${payload.teamStats.taskCount}`);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Team Average Score: ${payload.teamStats.teamAvgScore}/100 | Top Performer: ${payload.teamStats.topPerformer}`);
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Project Risk Flags (open): ${payload.teamStats.unresolvedRiskFlags}`);

    drawSectionTitle(doc, 'AI Executive Summary');
    doc.font('Helvetica').fontSize(10).fillColor('#334155').text(payload.aiNarrative.executiveSummary || 'No AI summary available.', {
        width: 495,
        align: 'left'
    });

    drawSectionTitle(doc, 'Ranked Member Comparison');
    drawRankingTable(doc, payload.members);

    drawSectionTitle(doc, 'Individual Contribution Summaries');
    payload.members.forEach((m) => {
        ensureSpace(doc, 90);

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`${m.rank}. ${m.name} (${m.role === 'LEADER' ? 'Leader' : 'Member'})`);
        doc.font('Helvetica').fontSize(9).fillColor('#475569').text(`Score: ${m.score}/100 | Tasks: ${m.doneTasks}/${m.assignedTasks} | Commits: ${m.commits} | Reports: ${m.weeklyReports} | Activity(14d): ${m.recentActivity}`);
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(m.aiSummary, { width: 495 });

        if (m.suspicionSignals.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#b45309').text('Flagged Signals:');
            m.suspicionSignals.forEach((s) => {
                doc.font('Helvetica').fontSize(9).fillColor('#92400e').text(`• ${s.title} - ${s.detail}`);
            });
        }

        doc.moveDown(0.4);
    });

    drawSectionTitle(doc, 'Suspicious / Low-Contribution Findings');
    if (payload.suspiciousSignals.length === 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text('No suspicious individual patterns detected by deterministic checks.');
    } else {
        payload.suspiciousSignals.slice(0, 20).forEach((s) => {
            ensureSpace(doc, 26);
            const color = s.severity === 'high' ? '#dc2626' : '#d97706';
            doc.font('Helvetica-Bold').fontSize(10).fillColor(color).text(`${s.memberName}: ${s.title}`);
            doc.font('Helvetica').fontSize(9).fillColor('#334155').text(s.detail, { width: 495 });
            doc.moveDown(0.2);
        });
    }

    drawSectionTitle(doc, 'AI Comparative Analysis');
    drawBullets(doc, payload.aiNarrative.comparativeAnalysis || []);

    drawSectionTitle(doc, 'AI Risk Assessment');
    drawBullets(doc, payload.aiNarrative.riskAssessment || []);

    drawSectionTitle(doc, 'Lecturer Recommendations');
    drawBullets(doc, payload.aiNarrative.lecturerRecommendations || []);

    if (payload.unresolvedFlags.length > 0) {
        drawSectionTitle(doc, 'Open Project Risk Flags (System)');
        payload.unresolvedFlags.forEach((f) => {
            ensureSpace(doc, 28);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#b91c1c').text(f.type);
            doc.font('Helvetica').fontSize(9).fillColor('#334155').text(f.message, { width: 495 });
            doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`Created: ${new Date(f.createdAt).toLocaleString()}`);
            doc.moveDown(0.2);
        });
    }

    doc.moveDown(0.8);
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('Generated by Verity using deterministic contribution scoring and Gemini-assisted narrative analysis.', {
        align: 'center'
    });

    doc.end();
    return payload;
}

module.exports = {
    generateProjectContributionReportPdf
};
