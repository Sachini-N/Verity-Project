const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { fetchContributorStatsWithRetry } = require('../services/githubContributors');
const { getEngagementAnalytics } = require('../services/engagementAnalytics');
const { getIntelligenceOverview } = require('../services/intelligenceOverview');
const { notifyProjectMembers, notifyByRole } = require('../services/notificationService');

const prisma = new PrismaClient();

const toPct = (n) => Math.max(0, Math.min(100, Math.round(n)));

const extractGithubLogin = (githubUrl) => {
    if (!githubUrl) return null;
    try {
        const raw = String(githubUrl).trim();
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const seg = url.pathname.split('/').filter(Boolean);
        return seg[0] ? seg[0].toLowerCase() : null;
    } catch {
        return String(githubUrl).replace(/^@/, '').trim().toLowerCase() || null;
    }
};

const loginFromNoreplyEmail = (email) => {
    if (!email) return null;
    const lower = String(email).toLowerCase();
    if (!lower.includes('noreply.github.com')) return null;
    const plus = lower.match(/^(\d+)\+([^@]+)@users\.noreply\.github\.com$/);
    if (plus) return plus[2];
    const plain = lower.match(/^([^@]+)@users\.noreply\.github\.com$/);
    return plain ? plain[1] : null;
};

const normalizePersonKey = (s) =>
    String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const namesLikelyMatch = (authorName, memberName) => {
    const na = normalizePersonKey(authorName);
    const nb = normalizePersonKey(memberName);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const ta = na.split(' ').filter((t) => t.length > 1);
    const tb = nb.split(' ').filter((t) => t.length > 1);
    if (ta.length === 0 || tb.length === 0) return false;
    const inter = ta.filter((t) => tb.includes(t));
    if (inter.length === ta.length || inter.length === tb.length) return true;
    if (ta.length >= 2 && tb.length >= 2 && inter.length >= 2) return true;
    if (ta.length >= 2 && tb.length >= 2 && ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1]) return true;
    return false;
};

/** Lowercase alphanumeric only — compares "Sachini-N" to "sachinin". */
function stripGithubHandle(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * When Git shows "Shehan" but the Verity profile has github.com/SSMShehan — match handle ⊃ display name.
 * Only attributes when best match is unambiguous (single strongest score).
 */
function githubHandleFuzzyMatchAuthor(authorName, authorEmail, memberUsers) {
    const noreply = loginFromNoreplyEmail(String(authorEmail || ''));
    const nameStrip = stripGithubHandle(authorName);
    const tokens = normalizePersonKey(authorName)
        .split(' ')
        .filter((t) => t.length >= 3);

    const scored = [];
    for (const u of memberUsers) {
        if (!u.githubLogin) continue;
        const gl = stripGithubHandle(u.githubLogin);
        if (!gl || gl.length < 2) continue;
        let confidence = 0;
        if (noreply && stripGithubHandle(noreply) === gl) confidence = 100;
        else if (nameStrip.length >= 4 && gl.includes(nameStrip)) confidence = 85;
        else if (nameStrip.length >= 4 && nameStrip.includes(gl)) confidence = 75;
        else {
            for (const tok of tokens) {
                if (tok.length >= 4 && gl.includes(tok)) {
                    confidence = 65;
                    break;
                }
            }
        }
        if (confidence > 0) scored.push({ u, confidence });
    }
    if (scored.length === 0) return null;
    scored.sort((a, b) => b.confidence - a.confidence);
    if (scored.length === 1) return scored[0].u;
    if (scored[0].confidence > (scored[1]?.confidence || 0)) return scored[0].u;
    return null;
}

/** Strict match: school email, noreply login, real name overlap. */
function findMemberForCommitStrict(authorEmail, authorName, memberUsers) {
    const email = String(authorEmail || '').toLowerCase().trim();
    const name = String(authorName || '').trim();
    const noreply = loginFromNoreplyEmail(email);

    for (const u of memberUsers) {
        if (u.email && email && u.email === email) return u;
    }
    for (const u of memberUsers) {
        if (u.githubLogin && noreply && u.githubLogin === noreply.toLowerCase()) return u;
    }
    const local = email.includes('@') ? email.split('@')[0] : '';
    for (const u of memberUsers) {
        const ul = (u.email || '').split('@')[0].toLowerCase();
        if (local && ul && local === ul) return u;
        if (local && u.githubLogin && local.toLowerCase() === u.githubLogin) return u;
        if (noreply && u.githubLogin && noreply.toLowerCase() === u.githubLogin) return u;
    }
    for (const u of memberUsers) {
        if (namesLikelyMatch(name, u.name)) return u;
    }
    return null;
}

function findMemberForCommit(authorEmail, authorName, memberUsers) {
    return findMemberForCommitStrict(authorEmail, authorName, memberUsers)
        || githubHandleFuzzyMatchAuthor(authorName, authorEmail, memberUsers);
}

function mapStatsLoginToMember(login, memberUsers) {
    const lgRaw = String(login || '').toLowerCase().trim();
    if (!lgRaw) return null;
    const lg = stripGithubHandle(login);

    const exact = memberUsers.filter((m) => m.githubLogin && m.githubLogin === lgRaw);
    if (exact.length === 1) return exact[0];

    const stripMatch = memberUsers.filter((m) => m.githubLogin && stripGithubHandle(m.githubLogin) === lg);
    if (stripMatch.length === 1) return stripMatch[0];

    const substr = memberUsers.filter((m) => {
        if (!m.githubLogin) return false;
        const ms = stripGithubHandle(m.githubLogin);
        return ms.length >= 4 && lg.length >= 4 && (lg.includes(ms) || ms.includes(lg));
    });
    if (substr.length === 1) return substr[0];

    let u = memberUsers.find((m) => (m.email || '').split('@')[0].toLowerCase() === lgRaw);
    if (u) return u;

    const compact = (s) => normalizePersonKey(s).replace(/\s+/g, '');
    u = memberUsers.find(
        (m) => normalizePersonKey(m.name).replace(/\s+/g, '-') === lgRaw
            || compact(m.name) === lg.replace(/-/g, '')
    );
    return u || null;
}

/**
 * Git commit totals per member: prefer GitHub stats API; augment with DB commit rows when unmapped.
 */
async function buildGitByUserMap(memberUsers, githubRepo) {
    const gitByUser = new Map();
    memberUsers.forEach((u) => gitByUser.set(u.userId, 0));

    if (!githubRepo) {
        return { gitByUser, usedGithubStats: false, commits: [] };
    }

    const commits = githubRepo.commits || [];
    let usedGithubStats = false;

    if (githubRepo.owner && githubRepo.repoName) {
        try {
            const stats = await fetchContributorStatsWithRetry(githubRepo.owner, githubRepo.repoName);
            if (Array.isArray(stats) && stats.length > 0) {
                usedGithubStats = true;
                for (const stat of stats) {
                    const login = stat.author?.login;
                    const total = typeof stat.total === 'number' ? stat.total : 0;
                    const u = mapStatsLoginToMember(login, memberUsers);
                    if (u && total > 0) {
                        gitByUser.set(u.userId, total);
                    }
                }
            }
        } catch (e) {
            console.error('GitHub stats/contributors failed:', e.message);
        }
    }

    for (const c of commits) {
        const matched = findMemberForCommit(c.authorEmail, c.authorName, memberUsers);
        if (!matched) continue;
        const prev = gitByUser.get(matched.userId) || 0;
        if (usedGithubStats && prev > 0) continue;
        gitByUser.set(matched.userId, prev + 1);
    }

    return { gitByUser, usedGithubStats, commits };
}

// POST /api/project/create
router.post('/create', async (req, res) => {
    try {
        const { module, title, members, abstract } = req.body;
        
        // 0. Server-side validation
        if (!title || title.length < 5 || title.length > 100) {
            return res.status(400).json({ success: false, message: 'Project Title must be between 5 and 100 characters.' });
        }

        const itFormat = /^IT\d{8}$/i;
        if (members && Array.isArray(members)) {
            for (const m of members) {
                if (!itFormat.test(m)) {
                    return res.status(400).json({ success: false, message: `Invalid IT Number format: ${m}. Must start with IT followed by 8 digits.` });
                }
            }
        }

        // 1. Resolve users from the provided IT numbers
        // The submitted members are IT numbers like ['IT21012345', 'IT21056789']
        // We also need to map the current logged-in user as the LEADER. For this endpoint without auth middleware yet, we'll assume the request has a 'leaderIndex' or we just pick the first member as leader.
        // Wait, the frontend doesn't send the leader's ID. Let's just create the members.
        
        const allMemberIndexes = [...(members || [])];
        // We'll optionally find these users in the DB. If they don't exist, we'll create placeholders so the relation works.
        const resolvedUsers = [];
        for (const indexNum of allMemberIndexes) {
            let user = await prisma.user.findUnique({ where: { indexNumber: indexNum } });
            if (!user) {
                // Create a dummy user for the demo
                user = await prisma.user.create({
                    data: {
                        name: `Student ${indexNum}`,
                        email: `${indexNum.toLowerCase()}@my.sliit.lk`,
                        password: 'hashed_dummy_password', // Mock
                        indexNumber: indexNum,
                        role: 'STUDENT'
                    }
                });
            }
            resolvedUsers.push(user);
        }

        // Check system settings for approval requirement
        const setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } });
        const requireApproval = setting?.data?.requireManagerApproval !== false; // defaults to true if not set
        const initialStatus = requireApproval ? 'Pending' : 'Active';

        // 2. Create the Project
        const newProject = await prisma.project.create({
            data: {
                title: title,
                description: `[${module}] ${abstract}`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 days
                status: initialStatus,
                members: {
                    create: resolvedUsers.map((u, idx) => ({
                        userId: u.id,
                        role: idx === 0 ? 'LEADER' : 'MEMBER' // Make the first one we process the leader
                    }))
                }
            },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });

        // Notify managers about new group registration
        notifyByRole('MANAGER', {
            type: 'PROJECT_CREATED',
            title: 'New Group Registration',
            message: `A new group "${title}" has been submitted for approval.`,
            link: '/manager/approvals',
            metadata: { projectId: newProject.id }
        }).catch(() => {});

        // Notify all members they've been added
        notifyProjectMembers(newProject.id, {
            type: 'MEMBER_ADDED',
            title: 'Added to Project',
            message: `You have been added to the project "${title}".`,
            link: `/student/projects/${newProject.id}`,
            metadata: {}
        }).catch(() => {});

        res.status(201).json({ success: true, project: newProject });
    } catch (error) {
        console.error("Project Create Error:", error);
        res.status(500).json({ success: false, message: 'Server error creating project', error: error.message });
    }
});

// GET /api/project/list
router.get('/list', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                members: {
                    include: { user: true }
                },
                sprints: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error("Project List Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching projects' });
    }
});

// GET /api/project/fairness/:projectId
router.get('/fairness/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const memberUsers = project.members
            .filter((m) => m.user)
            .map((m) => ({
                userId: m.user.id,
                name: m.user.name,
                email: (m.user.email || '').toLowerCase(),
                role: m.role,
                githubLogin: extractGithubLogin(m.user.github)
            }));

        const [tasks, reports, githubRepo] = await Promise.all([
            prisma.task.findMany({
                where: { projectId },
                select: { id: true, assigneeId: true, status: true }
            }),
            prisma.weeklyReport.findMany({
                where: { projectId },
                select: { submittedBy: true }
            }),
            prisma.githubRepo.findUnique({
                where: { projectId },
                select: {
                    owner: true,
                    repoName: true,
                    commits: {
                        select: { authorName: true, authorEmail: true }
                    }
                }
            })
        ]);

        const taskByUser = new Map();
        const doneByUser = new Map();
        memberUsers.forEach((u) => {
            taskByUser.set(u.userId, 0);
            doneByUser.set(u.userId, 0);
        });
        for (const t of tasks) {
            if (!t.assigneeId || !taskByUser.has(t.assigneeId)) continue;
            taskByUser.set(t.assigneeId, taskByUser.get(t.assigneeId) + 1);
            if (String(t.status).toLowerCase() === 'done') {
                doneByUser.set(t.assigneeId, doneByUser.get(t.assigneeId) + 1);
            }
        }

        const reportByUser = new Map();
        memberUsers.forEach((u) => reportByUser.set(u.userId, 0));
        for (const r of reports) {
            if (reportByUser.has(r.submittedBy)) {
                reportByUser.set(r.submittedBy, reportByUser.get(r.submittedBy) + 1);
            }
        }

        const { gitByUser, usedGithubStats, commits } = await buildGitByUserMap(memberUsers, githubRepo);

        const maxGit = Math.max(0, ...Array.from(gitByUser.values()));
        const maxReports = Math.max(0, ...Array.from(reportByUser.values()));

        const members = memberUsers.map((u) => {
            const totalTasks = taskByUser.get(u.userId) || 0;
            const doneTasks = doneByUser.get(u.userId) || 0;
            const taskRate = totalTasks > 0 ? toPct((doneTasks / totalTasks) * 100) : 0;

            const gitCount = gitByUser.get(u.userId) || 0;
            const gitRate = maxGit > 0 ? toPct((gitCount / maxGit) * 100) : 0;

            const reportsCount = reportByUser.get(u.userId) || 0;
            const timeSync = maxReports > 0 ? toPct((reportsCount / maxReports) * 100) : 0;

            const score = toPct((taskRate * 0.45) + (gitRate * 0.4) + (timeSync * 0.15));

            return {
                userId: u.userId,
                name: u.name,
                role: u.role === 'LEADER' ? 'Leader' : 'Member',
                score,
                taskRate,
                gitRate,
                timeSync,
                githubProfileLinked: Boolean(u.githubLogin),
                metrics: {
                    assignedTasks: totalTasks,
                    doneTasks,
                    gitCommits: gitCount,
                    weeklyReports: reportsCount
                }
            };
        });

        const membersMissingGithub = memberUsers
            .filter((x) => !x.githubLogin)
            .map((x) => ({ userId: x.userId, name: x.name }));

        for (const m of members) {
            await prisma.contributionScore.upsert({
                where: { projectId_userId: { projectId, userId: m.userId } },
                update: {
                    score: m.score,
                    breakdown: {
                        taskRate: m.taskRate,
                        gitRate: m.gitRate,
                        timeSync: m.timeSync,
                        assignedTasks: m.metrics.assignedTasks,
                        doneTasks: m.metrics.doneTasks,
                        gitCommits: m.metrics.gitCommits,
                        weeklyReports: m.metrics.weeklyReports
                    },
                    evaluatedAt: new Date()
                },
                create: {
                    projectId,
                    userId: m.userId,
                    score: m.score,
                    breakdown: {
                        taskRate: m.taskRate,
                        gitRate: m.gitRate,
                        timeSync: m.timeSync,
                        assignedTasks: m.metrics.assignedTasks,
                        doneTasks: m.metrics.doneTasks,
                        gitCommits: m.metrics.gitCommits,
                        weeklyReports: m.metrics.weeklyReports
                    }
                }
            });
        }

        const teamAvg = members.length > 0
            ? toPct(members.reduce((sum, m) => sum + m.score, 0) / members.length)
            : 0;
        const flagged = members.filter((m) => m.score < 60).map((m) => m.name);

        res.status(200).json({
            success: true,
            project: {
                id: project.id,
                title: project.title
            },
            teamAvg,
            flaggedCount: flagged.length,
            flaggedMembers: flagged,
            members,
            membersMissingGithub,
            github: {
                linked: Boolean(githubRepo),
                owner: githubRepo?.owner || null,
                repoName: githubRepo?.repoName || null,
                commitsSynced: commits.length,
                usedContributorStatsApi: usedGithubStats
            }
        });
    } catch (error) {
        console.error('Project Fairness Error:', error);
        res.status(500).json({ success: false, message: 'Server error calculating fairness analytics' });
    }
});

// GET /api/project/member-tracking/:projectId
router.get('/member-tracking/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const memberUsers = project.members
            .filter((m) => m.user)
            .map((m) => ({
                userId: m.user.id,
                name: m.user.name,
                email: (m.user.email || '').toLowerCase(),
                role: m.role,
                indexNumber: m.user.indexNumber || m.user.id,
                githubLogin: extractGithubLogin(m.user.github)
            }));

        const [tasks, reports, githubRepo] = await Promise.all([
            prisma.task.findMany({
                where: { projectId },
                select: {
                    id: true,
                    assigneeId: true,
                    title: true,
                    status: true,
                    updatedAt: true
                }
            }),
            prisma.weeklyReport.findMany({
                where: { projectId },
                select: {
                    submittedBy: true,
                    weekNumber: true,
                    createdAt: true
                }
            }),
            prisma.githubRepo.findUnique({
                where: { projectId },
                select: {
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
            })
        ]);

        const taskByUser = new Map();
        const doneByUser = new Map();
        memberUsers.forEach((u) => {
            taskByUser.set(u.userId, 0);
            doneByUser.set(u.userId, 0);
        });
        for (const t of tasks) {
            if (!t.assigneeId || !taskByUser.has(t.assigneeId)) continue;
            taskByUser.set(t.assigneeId, taskByUser.get(t.assigneeId) + 1);
            if (String(t.status).toLowerCase() === 'done') {
                doneByUser.set(t.assigneeId, doneByUser.get(t.assigneeId) + 1);
            }
        }

        const reportByUser = new Map();
        memberUsers.forEach((u) => reportByUser.set(u.userId, 0));
        for (const r of reports) {
            if (reportByUser.has(r.submittedBy)) {
                reportByUser.set(r.submittedBy, reportByUser.get(r.submittedBy) + 1);
            }
        }

        const { gitByUser, commits } = await buildGitByUserMap(memberUsers, githubRepo);

        const mergeByUser = new Map();
        memberUsers.forEach((u) => mergeByUser.set(u.userId, 0));
        for (const c of commits) {
            const matched = findMemberForCommit(c.authorEmail, c.authorName, memberUsers);
            if (!matched) continue;
            if (/(merge pull request|merged pr|merge pr|^merge\b)/i.test(c.message || '')) {
                mergeByUser.set(matched.userId, (mergeByUser.get(matched.userId) || 0) + 1);
            }
        }

        const maxGit = Math.max(0, ...Array.from(gitByUser.values()));
        const maxReports = Math.max(0, ...Array.from(reportByUser.values()));

        const members = memberUsers.map((u) => {
            const assigned = taskByUser.get(u.userId) || 0;
            const done = doneByUser.get(u.userId) || 0;
            const commitsCount = gitByUser.get(u.userId) || 0;
            const docs = reportByUser.get(u.userId) || 0;
            const taskRate = assigned > 0 ? toPct((done / assigned) * 100) : 0;
            const gitRate = maxGit > 0 ? toPct((commitsCount / maxGit) * 100) : 0;
            const timeSync = maxReports > 0 ? toPct((docs / maxReports) * 100) : 0;
            const score = toPct((taskRate * 0.45) + (gitRate * 0.4) + (timeSync * 0.15));

            const latestDoneTask = tasks
                .filter((t) => t.assigneeId === u.userId && String(t.status).toLowerCase() === 'done')
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            const latestReport = reports
                .filter((r) => r.submittedBy === u.userId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const latestCommit = commits
                .filter((c) => {
                    const m = findMemberForCommit(c.authorEmail, c.authorName, memberUsers);
                    return m && m.userId === u.userId;
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            const events = [];
            if (latestDoneTask) {
                events.push({
                    at: new Date(latestDoneTask.updatedAt).getTime(),
                    text: `Completed task "${latestDoneTask.title}".`
                });
            }
            if (latestReport) {
                events.push({
                    at: new Date(latestReport.createdAt).getTime(),
                    text: `Submitted weekly report #${latestReport.weekNumber}.`
                });
            }
            if (latestCommit) {
                const shortMsg = String(latestCommit.message || '').split('\n')[0];
                events.push({
                    at: new Date(latestCommit.date).getTime(),
                    text: `Git commit: "${shortMsg}".`
                });
            }
            events.sort((a, b) => b.at - a.at);

            return {
                userId: u.userId,
                id: u.indexNumber,
                name: u.name,
                role: u.role === 'LEADER' ? 'Team Leader' : 'Member',
                email: u.email,
                githubProfileLinked: Boolean(u.githubLogin),
                status: score < 60 ? 'At Risk' : 'Healthy',
                metrics: {
                    tasksAssigned: assigned,
                    tasksCompleted: done,
                    commits: commitsCount,
                    prMerges: mergeByUser.get(u.userId) || 0,
                    docUploads: docs,
                    engagementScore: score
                },
                recentActivity: events[0]?.text || 'No recent activity recorded.'
            };
        });

        const membersMissingGithub = memberUsers
            .filter((x) => !x.githubLogin)
            .map((x) => ({ userId: x.userId, name: x.name }));

        res.status(200).json({
            success: true,
            project: {
                id: project.id,
                title: project.title
            },
            members,
            membersMissingGithub
        });
    } catch (error) {
        console.error('Member Tracking Error:', error);
        res.status(500).json({ success: false, message: 'Server error building member tracking analytics' });
    }
});

// GET /api/project/engagement/:projectId
router.get('/engagement/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = await getEngagementAnalytics(projectId);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error('Engagement analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error building engagement analytics' });
    }
});

// GET /api/project/intelligence/:projectId
router.get('/intelligence/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = await getIntelligenceOverview(projectId);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error('Intelligence overview error:', error);
        res.status(500).json({ success: false, message: 'Server error building intelligence overview' });
    }
});

// MANAGER: GET /api/project/manager/groups (List all groups)
// Include approvals ("Pending") or "Active", etc.
router.get('/manager/groups', async (req, res) => {
    try {
        const groups = await prisma.project.findMany({
            include: {
                members: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend mapping
        const formattedGroups = groups.map(group => {
            const leader = group.members.find(m => m.role === 'LEADER')?.user;
            const moduleName = group.description.match(/\[(.*?)\]/)?.[1] || 'Unknown Module';
            return {
                id: group.id,
                title: group.title,
                module: moduleName,
                leader: leader ? `${leader.indexNumber || leader.id} (${leader.name})` : 'No Leader',
                leaderObj: leader,
                membersCount: group.members.length,
                members: group.members.map(m => ({ 
                    id: m.userId, 
                    name: m.user.name, 
                    indexNumber: m.user.indexNumber || m.user.email, 
                    role: m.role 
                })),
                status: group.status, // Active, Pending, Flagged, Rejected
                createdAt: group.createdAt
            };
        });

        res.status(200).json({ success: true, groups: formattedGroups });
    } catch (error) {
        console.error("Manager Group List Error:", error);
        res.status(500).json({ success: false, message: 'Server error retrieving groups' });
    }
});

// MANAGER: DELETE /api/project/manager/groups/:id (Delete Group)
router.delete('/manager/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Group permanently wiped.' });
    } catch (error) {
        console.error("Manager Group Delete Error:", error);
        res.status(500).json({ success: false, message: 'Server error deleting group' });
    }
});

// MANAGER: PUT /api/project/manager/approvals/:id (Approve/Reject)
router.put('/manager/approvals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' ('Active') or 'Rejected'

        const dbStatus = status === 'Approved' ? 'Active' : 'Rejected';

        const updatedProject = await prisma.project.update({
            where: { id },
            data: { status: dbStatus }
        });

        // Notify all project members about approval/rejection
        const notifType = dbStatus === 'Active' ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED';
        notifyProjectMembers(id, {
            type: notifType,
            title: dbStatus === 'Active' ? 'Group Approved! 🎉' : 'Group Rejected',
            message: dbStatus === 'Active'
                ? `Your group "${updatedProject.title}" has been approved. You can now access your workspace!`
                : `Your group "${updatedProject.title}" has been rejected by the manager.`,
            link: dbStatus === 'Active' ? `/student/projects/${id}` : '/student/projects',
            metadata: {}
        }).catch(() => {});

        res.status(200).json({ success: true, project: updatedProject });
    } catch (error) {
        console.error("Manager Approval Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating approval' });
    }
});

// MANAGER: PUT /api/project/manager/groups/:id (Edit Group)
router.put('/manager/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, addMembers, removeMembers } = req.body;

        await prisma.$transaction(async (tx) => {
            if (title) {
                await tx.project.update({ where: { id }, data: { title } });
            }

            if (removeMembers && removeMembers.length > 0) {
                await tx.projectMember.deleteMany({
                    where: {
                        projectId: id,
                        userId: { in: removeMembers }
                    }
                });
            }

            if (addMembers && addMembers.length > 0) {
                const membersToCreate = addMembers.map(userId => ({
                    projectId: id,
                    userId,
                    role: 'MEMBER'
                }));
                await tx.projectMember.createMany({
                    data: membersToCreate,
                    skipDuplicates: true
                });
            }
        });

        res.status(200).json({ success: true, message: 'Group updated successfully.' });
    } catch (error) {
        console.error("Manager Group Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating group' });
    }
});

module.exports = router;
