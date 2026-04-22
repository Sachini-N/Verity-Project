const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { notifyProjectMembers } = require('../services/notificationService');
const { recordIntegrationCall } = require('../services/systemMetrics');

const prisma = new PrismaClient();

async function githubGet(url, config = {}) {
    const startedAt = Date.now();
    try {
        const response = await axios.get(url, config);
        recordIntegrationCall('github', {
            success: response.status < 400,
            statusCode: response.status,
            durationMs: Date.now() - startedAt
        });
        return response;
    } catch (error) {
        recordIntegrationCall('github', {
            success: false,
            statusCode: Number(error?.response?.status) || 500,
            durationMs: Date.now() - startedAt,
            error: error?.response?.data?.message || error?.message || 'GitHub request failed'
        });
        throw error;
    }
}

const getHeaders = () => {
    const headers = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Verity-Integration-Node'
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
};

// Extractor helper to get username from "https://github.com/username" or "https://github.com/user/repo"
const extractUsername = (githubUrl) => {
    if (!githubUrl) return null;
    try {
        const url = new URL(githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        return pathSegments[0] || null;
    } catch {
        return githubUrl.replace(/^@/, '');
    }
};

/** Single canonical key: "owner/repo" lowercase — enforces one GitHub repo per Verity project globally */
function normalizeRepoFullName(owner, repoName) {
    return `${String(owner).trim()}/${String(repoName).trim()}`.toLowerCase();
}

function assertProjectId(projectId, res) {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
        res.status(400).json({ success: false, message: 'Invalid project id.' });
        return false;
    }
    return true;
}

/** Parse owner/repo from full GitHub URL */
const parseGithubRepoUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim();
    const m = s.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!m) return null;
    return { owner: m[1], repoName: m[2].replace(/\.git$/i, '') };
};

/** GitHub noreply emails: id+login@users.noreply.github.com or login@users.noreply.github.com */
const loginFromNoreplyEmail = (email) => {
    if (!email || typeof email !== 'string') return null;
    const lower = email.toLowerCase();
    if (!lower.includes('noreply.github.com')) return null;
    const plus = lower.match(/^(\d+)\+([^@]+)@users\.noreply\.github\.com$/);
    if (plus) return plus[2];
    const plain = lower.match(/^([^@]+)@users\.noreply\.github\.com$/);
    return plain ? plain[1] : null;
};

/** GitHub may return 202 while contributor stats are computed — retry a few times */
async function fetchContributorStats(owner, repoName, headers) {
    for (let i = 0; i < 6; i++) {
        const statsRes = await githubGet(
            `https://api.github.com/repos/${owner}/${repoName}/stats/contributors`,
            { headers, validateStatus: () => true }
        );
        if (statsRes.status === 202) {
            await new Promise((r) => setTimeout(r, 2500));
            continue;
        }
        if (statsRes.status === 200 && Array.isArray(statsRes.data)) {
            return statsRes.data;
        }
        break;
    }
    return [];
}

/** When /stats/contributors is empty (rate limit, new repo, or no token), derive commit share from synced DB rows */
function buildImpactsFromDbCommits(dbCommits, userGithubMap, systemUsers) {
    const groups = new Map();
    for (const c of dbCommits) {
        const noreplyLogin = loginFromNoreplyEmail(c.authorEmail);
        const emailLower = (c.authorEmail || '').toLowerCase();
        const matchByGithub = noreplyLogin
            ? userGithubMap.find((u) => u.githubLogin === noreplyLogin)
            : null;
        const matchByEmail = emailLower
            ? systemUsers.find((u) => (u.email || '').toLowerCase() === emailLower)
            : null;
        const matched = matchByGithub || matchByEmail;
        const key = matched ? matched.id : (noreplyLogin || emailLower || (c.authorName || '').toLowerCase() || 'unknown');

        if (!groups.has(key)) {
            groups.set(key, {
                login: noreplyLogin || key.slice(0, 40),
                name: matched ? matched.name : c.authorName || noreplyLogin || key.slice(0, 40),
                isMatched: !!matched,
                commits: 0,
                additions: 0,
                deletions: 0
            });
        }
        groups.get(key).commits += 1;
    }
    const list = Array.from(groups.values());
    const totalCommits = list.reduce((s, g) => s + g.commits, 0);
    return list
        .map((imp) => ({
            ...imp,
            percentage: totalCommits > 0 ? Math.round((imp.commits / totalCommits) * 100) : 0
        }))
        .sort((a, b) => b.commits - a.commits);
}

// POST /api/github/link
router.post('/link', async (req, res) => {
    try {
        console.log("POST /api/github/link Body:", req.body);
        let { projectId, owner, repoName, url } = req.body;

        projectId = projectId?.trim();
        owner = owner?.trim();
        repoName = repoName?.trim();
        url = url?.trim();

        if (url) {
            const parsed = parseGithubRepoUrl(url);
            if (parsed) {
                // Prioritize the URL contents if they differ from manual fields
                owner = parsed.owner;
                repoName = parsed.repoName;
            }
        }

        if (url && !url.startsWith('https://github.com')) {
            return res.status(400).json({ success: false, message: 'Repo URL must start with https://github.com' });
        }

        if (!projectId || !owner || !repoName) {
            return res.status(400).json({
                success: false,
                message: 'projectId, owner, and repoName are required (or paste a full https://github.com/owner/repo URL).'
            });
        }

        try {
            await githubGet(`https://api.github.com/repos/${owner}/${repoName}`, { headers: getHeaders() });
        } catch (e) {
            console.error('GitHub API Verification Error:', e.message, e.response?.data);
            return res.status(404).json({ success: false, message: `Repository not found or API Limit Reached: ${e.message}` });
        }

        const repoFullName = normalizeRepoFullName(owner, repoName);
        const canonicalUrl = url || `https://github.com/${owner}/${repoName}`;

        const taken = await prisma.githubRepo.findUnique({ where: { repoFullName } });
        if (taken && taken.projectId !== projectId) {
            const otherProject = await prisma.project.findUnique({
                where: { id: taken.projectId },
                select: { title: true }
            });
            return res.status(409).json({
                success: false,
                message: `This GitHub repository is already linked to another project (${otherProject?.title || 'another group'}). Each repo can only be connected to one Verity project.`
            });
        }

        const existing = await prisma.githubRepo.findUnique({ where: { projectId } });
        let repo;
        if (existing) {
            repo = await prisma.githubRepo.update({
                where: { id: existing.id },
                data: { owner, repoName, url: canonicalUrl, repoFullName }
            });
        } else {
            repo = await prisma.githubRepo.create({
                data: {
                    projectId,
                    owner,
                    repoName,
                    url: canonicalUrl,
                    repoFullName
                }
            });
        }

        res.status(200).json({ success: true, repo });

        // Notify project members about repo link
        notifyProjectMembers(projectId, {
            type: 'GITHUB_LINKED',
            title: 'GitHub Repo Linked',
            message: `GitHub repository ${owner}/${repoName} has been linked to your project.`,
            link: `/student/projects/${projectId}/github`,
            metadata: {}
        }).catch(() => {});
    } catch (error) {
        console.error('Github Link Error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'This GitHub repository is already linked to another project.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error linking repo', error: error.message });
    }
});

// POST /api/github/sync/:projectId
router.post('/sync/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!assertProjectId(projectId, res)) return;

        const repo = await prisma.githubRepo.findUnique({ where: { projectId } });

        if (!repo) {
            return res.status(404).json({ success: false, message: 'No GitHub repository linked to this project' });
        }

        const { owner, repoName, id: githubRepoId } = repo;
        const headers = getHeaders();

        // 1. Fetch Branches
        let branches = [];
        try {
            const branchRes = await githubGet(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
                headers,
                params: { per_page: 100 }
            });
            branches = branchRes.data.map(b => b.name);
        } catch (e) {
            console.error("Failed to fetch branches:", e.message);
        }

        // 2. Fetch Commits from all branches
        const uniqueCommits = new Map();
        let targetBranches = branches.length > 0 ? branches : ['main', 'master'];
        targetBranches = [...new Set(targetBranches)];
        
        for (const branch of targetBranches) {
            try {
                const commitsRes = await githubGet(`https://api.github.com/repos/${owner}/${repoName}/commits`, {
                    headers,
                    params: { sha: branch, per_page: 50 }
                });
                
                commitsRes.data.forEach(c => {
                    uniqueCommits.set(c.sha, {
                        hash: c.sha,
                        authorName: c.commit.author.name || 'Unknown',
                        authorEmail: c.commit.author.email || 'unknown@none.com',
                        message: c.commit.message,
                        date: new Date(c.commit.author.date),
                        branch // mark which branch it was fetched from first
                    });
                });
            } catch (e) {
                console.error(`Failed to fetch commits for branch ${branch}:`, e.message);
            }
        }

        // 3. Save unique commits to Database
        let newCommits = 0;
        const commitsArray = Array.from(uniqueCommits.values());
        for (const c of commitsArray) {
            try {
                const existing = await prisma.githubCommit.findUnique({
                    where: { commitHash: c.hash }
                });
                if (existing) {
                    if (existing.githubRepoId === githubRepoId) {
                        await prisma.githubCommit.update({
                            where: { commitHash: c.hash },
                            data: {
                                authorName: c.authorName,
                                authorEmail: c.authorEmail,
                                message: c.message,
                                date: c.date
                            }
                        });
                    }
                    continue;
                }
                await prisma.githubCommit.create({
                    data: {
                        githubRepoId,
                        commitHash: c.hash,
                        authorName: c.authorName,
                        authorEmail: c.authorEmail,
                        message: c.message,
                        date: c.date
                    }
                });
                newCommits++;
            } catch (err) {
                console.error('Commit save error:', err.message);
            }
        }

        // We no longer strictly need to save contributor stats to the DB right here 
        // because we can fetch it live in GET /repo for total accuracy, but caching is better.
        // Actually, for simplicity and perfect accuracy, let's keep GET /repo doing the calculation.

        res.status(200).json({
            success: true,
            message: 'Synced successfully',
            syncedCommits: commitsArray.length,
            newCommits,
            branchesFetched: targetBranches.length
        });

        // Notify project members if new commits were found
        if (newCommits > 0) {
            notifyProjectMembers(projectId, {
                type: 'GITHUB_SYNCED',
                title: 'New Commits Synced',
                message: `${newCommits} new commit${newCommits > 1 ? 's' : ''} synced from GitHub.`,
                link: `/student/projects/${projectId}/github`,
                metadata: { newCommits }
            }).catch(() => {});
        }
    } catch (error) {
        console.error("Github Sync Error:", error);
        res.status(500).json({ success: false, message: 'Server error syncing repo', error: error.message });
    }
});

// GET /api/github/repo/:projectId
router.get('/repo/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!assertProjectId(projectId, res)) return;

        const repo = await prisma.githubRepo.findUnique({ where: { projectId } });

        if (!repo) {
            return res.status(200).json({ success: true, linked: false });
        }

        // 1. Get recent commits from DB (+ all for fallback analytics)
        const recentCommits = await prisma.githubCommit.findMany({
            where: { githubRepoId: repo.id },
            orderBy: { date: 'desc' },
            take: 50
        });
        const allRepoCommits = await prisma.githubCommit.findMany({
            where: { githubRepoId: repo.id }
        });

        // 2. Fetch Project Members and extract their expected GitHub aliases
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });

        const systemUsers = [];
        project?.members.forEach(m => {
            if (m.user) systemUsers.push(m.user);
        });

        // Map system users to their github logins
        const userGithubMap = systemUsers.map(user => {
            return {
                ...user,
                githubLogin: extractUsername(user.github)?.toLowerCase()
            };
        });

        // 3. Fetch contributor stats from GitHub (LOC + commit totals) when possible
        let githubStats = [];
        try {
            const headers = getHeaders();
            githubStats = await fetchContributorStats(repo.owner, repo.repoName, headers);
        } catch (e) {
            console.error('Failed to fetch advanced contributor stats:', e.message);
        }

        // 4. Build impacts: prefer GitHub stats API; fall back to synced commits in DB
        let totalAdditions = 0;
        let totalDeletions = 0;
        let totalCommits = 0;
        let finalImpacts = [];

        if (githubStats.length > 0) {
            const impactsMap = new Map();

            githubStats.forEach((stat) => {
                const login = stat.author?.login || '';
                let userAdditions = 0;
                let userDeletions = 0;
                const userCommits = stat.total;

                stat.weeks.forEach((week) => {
                    userAdditions += week.a;
                    userDeletions += week.d;
                });

                totalAdditions += userAdditions;
                totalDeletions += userDeletions;
                totalCommits += userCommits;

                const matchedUser = userGithubMap.find((u) => u.githubLogin === login.toLowerCase());
                const key = matchedUser ? matchedUser.id : login;

                if (!impactsMap.has(key)) {
                    impactsMap.set(key, {
                        login,
                        name: matchedUser ? matchedUser.name : login,
                        isMatched: !!matchedUser,
                        commits: 0,
                        additions: 0,
                        deletions: 0
                    });
                }
                const entry = impactsMap.get(key);
                entry.commits += userCommits;
                entry.additions += userAdditions;
                entry.deletions += userDeletions;
            });

            finalImpacts = Array.from(impactsMap.values())
                .map((imp) => ({
                    ...imp,
                    percentage: totalCommits > 0 ? Math.round((imp.commits / totalCommits) * 100) : 0
                }))
                .sort((a, b) => b.commits - a.commits);
        } else if (allRepoCommits.length > 0) {
            finalImpacts = buildImpactsFromDbCommits(allRepoCommits, userGithubMap, systemUsers);
            totalCommits = allRepoCommits.length;
        }

        // 5. Enhance Commits with branch info and match them to students
        const enhancedCommits = recentCommits.map(commit => {
            const noreplyLogin = loginFromNoreplyEmail(commit.authorEmail);
            const emailLower = (commit.authorEmail || '').toLowerCase();
            
            const matchByGithub = noreplyLogin
                ? userGithubMap.find((u) => u.githubLogin === noreplyLogin)
                : null;
            const matchByEmail = emailLower
                ? userGithubMap.find((u) => (u.email || '').toLowerCase() === emailLower)
                : null;
                
            const matchedUser = matchByGithub || matchByEmail;
            
            return {
                ...commit,
                isMatched: !!matchedUser,
                matchedUserName: matchedUser ? matchedUser.name : null,
                matchedUserId: matchedUser ? matchedUser.id : null
            };
        });

        res.status(200).json({
            success: true,
            linked: true,
            repo: {
                owner: repo.owner,
                repoName: repo.repoName,
                url: repo.url
            },
            totalCommitsCount: totalCommits,
            totalAdditions,
            totalDeletions,
            commits: enhancedCommits,
            impacts: finalImpacts
        });

    } catch (error) {
        console.error("Github Repo Info Error:", error);
        res.status(500).json({ success: false, message: 'Server error fetching repo details' });
    }
});

module.exports = router;
