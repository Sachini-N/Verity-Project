const prisma = require('../config/prisma');
const { findMemberForCommit, extractGithubLogin } = require('../lib/githubUserMatch');

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function extractModuleTag(description) {
    const m = String(description || '').match(/\[(.*?)\]/);
    return m ? m[1].trim() : null;
}

function shortName(full) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
    }
    return full || 'Member';
}

function pctChange(cur, prev) {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
}

async function loadMemberUsers(projectId) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            members: { include: { user: true } }
        }
    });
    if (!project) return null;
    const memberUsers = project.members
        .filter((m) => m.user)
        .map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            email: (m.user.email || '').toLowerCase(),
            role: m.role,
            githubLogin: extractGithubLogin(m.user.github)
        }));
    return { project, memberUsers };
}

async function computePulseWindow(projectId, userIds, start, end) {
    if (!userIds.length) return 0;
    const taskRows = await prisma.task.findMany({
        where: { projectId },
        select: { id: true }
    });
    const taskIds = taskRows.map((t) => t.id);

    const [logins, taskUpdates, reports, commits, statusLogs] = await Promise.all([
        prisma.activityLog.count({
            where: {
                userId: { in: userIds },
                type: 'LOGIN',
                createdAt: { gte: start, lt: end }
            }
        }),
        prisma.activityLog.count({
            where: {
                userId: { in: userIds },
                projectId,
                type: 'TASK_UPDATE',
                createdAt: { gte: start, lt: end }
            }
        }),
        prisma.weeklyReport.count({
            where: { projectId, createdAt: { gte: start, lt: end } }
        }),
        prisma.githubCommit.count({
            where: {
                githubRepo: { projectId },
                date: { gte: start, lt: end }
            }
        }),
        taskIds.length
            ? prisma.taskStatusLog.count({
                  where: {
                      taskId: { in: taskIds },
                      createdAt: { gte: start, lt: end }
                  }
              })
            : Promise.resolve(0)
    ]);

    return logins + taskUpdates + statusLogs + reports * 2 + commits * 2;
}

async function peerProjectIds(moduleTag) {
    if (!moduleTag) return null;
    const rows = await prisma.project.findMany({
        where: {
            status: 'Active',
            description: { contains: `[${moduleTag}]` }
        },
        select: { id: true }
    });
    const ids = rows.map((r) => r.id);
    return ids.length ? ids : null;
}

async function rankingForPeers(peerIds, windowStart, windowEnd) {
    const tuples = await Promise.all(
        peerIds.map(async (pid) => {
            const mems = await prisma.projectMember.findMany({
                where: { projectId: pid },
                select: { userId: true }
            });
            const userIds = mems.map((m) => m.userId);
            const pulse = await computePulseWindow(pid, userIds, windowStart, windowEnd);
            return { id: pid, pulse };
        })
    );
    tuples.sort((a, b) => b.pulse - a.pulse);
    return tuples;
}

/**
 * @param {string} projectId
 */
async function getEngagementAnalytics(projectId) {
    const loaded = await loadMemberUsers(projectId);
    if (!loaded) return null;

    const { project, memberUsers } = loaded;
    const memberIds = memberUsers.map((m) => m.userId);
    const nMembers = Math.max(1, memberIds.length);
    const now = new Date();

    const thisWeekStart = new Date(now.getTime() - 7 * 86400000);
    const prevWeekStart = new Date(now.getTime() - 14 * 86400000);
    const prevWeekEnd = thisWeekStart;
    const fiveAgo = new Date(now.getTime() - 5 * 86400000);
    const heatStart = startOfDay(new Date(now.getTime() - 29 * 86400000));
    const heatStartMs = heatStart.getTime();

    const taskRows = await prisma.task.findMany({
        where: { projectId },
        select: { id: true }
    });
    const taskIds = taskRows.map((t) => t.id);

    const [loginsThis, loginsPrev] = await Promise.all([
        prisma.activityLog.count({
            where: {
                userId: { in: memberIds },
                type: 'LOGIN',
                createdAt: { gte: thisWeekStart }
            }
        }),
        prisma.activityLog.count({
            where: {
                userId: { in: memberIds },
                type: 'LOGIN',
                createdAt: { gte: prevWeekStart, lt: prevWeekEnd }
            }
        })
    ]);

    const loginPerMemberThis = loginsThis / nMembers;
    const loginPerMemberPrev = loginsPrev / nMembers;
    const loginTrendPct = pctChange(loginPerMemberThis, loginPerMemberPrev);

    const [taskSigThis, taskSigPrev] = await Promise.all([
        Promise.all([
            taskIds.length
                ? prisma.taskStatusLog.count({
                      where: { taskId: { in: taskIds }, createdAt: { gte: thisWeekStart } }
                  })
                : Promise.resolve(0),
            prisma.activityLog.count({
                where: {
                    userId: { in: memberIds },
                    projectId,
                    type: 'TASK_UPDATE',
                    createdAt: { gte: thisWeekStart }
                }
            })
        ]).then(([a, b]) => a + b),
        Promise.all([
            taskIds.length
                ? prisma.taskStatusLog.count({
                      where: {
                          taskId: { in: taskIds },
                          createdAt: { gte: prevWeekStart, lt: prevWeekEnd }
                      }
                  })
                : Promise.resolve(0),
            prisma.activityLog.count({
                where: {
                    userId: { in: memberIds },
                    projectId,
                    type: 'TASK_UPDATE',
                    createdAt: { gte: prevWeekStart, lt: prevWeekEnd }
                }
            })
        ]).then(([a, b]) => a + b)
    ]);

    const taskTrendDiff = taskSigThis - taskSigPrev;

    const doneTasksAll = await prisma.task.findMany({
        where: { projectId, status: { equals: 'Done', mode: 'insensitive' } },
        select: { createdAt: true, completedAt: true, updatedAt: true }
    });

    function avgCompletionHours(tasks, from, to) {
        const hrs = [];
        for (const t of tasks) {
            const end = t.completedAt || t.updatedAt;
            if (!end || end < from || end >= to) continue;
            const h = (end.getTime() - t.createdAt.getTime()) / 3600000;
            if (h >= 0 && h < 8760) hrs.push(h);
        }
        if (!hrs.length) return 0;
        return hrs.reduce((a, b) => a + b, 0) / hrs.length;
    }

    const avgHoursThis = avgCompletionHours(doneTasksAll, thisWeekStart, now);
    const avgHoursPrev = avgCompletionHours(doneTasksAll, prevWeekStart, prevWeekEnd);
    const respTrendPct =
        avgHoursPrev > 0 ? pctChange(avgHoursThis, avgHoursPrev) : avgHoursThis > 0 ? -100 : 0;

    const moduleTag = extractModuleTag(project.description);
    const peerIds = (await peerProjectIds(moduleTag)) || [projectId];
    const rankingNow = await rankingForPeers(peerIds, thisWeekStart, now);
    const rankingPrev = await rankingForPeers(peerIds, prevWeekStart, prevWeekEnd);
    const rankNow = rankingNow.findIndex((x) => x.id === projectId) + 1 || 1;
    const rankPrev = rankingPrev.findIndex((x) => x.id === projectId) + 1 || 1;
    const rankDelta = rankPrev - rankNow;
    const totalGroups = peerIds.length;

    const githubRepo = await prisma.githubRepo.findUnique({
        where: { projectId },
        select: {
            commits: {
                where: { date: { gte: fiveAgo } },
                select: { authorEmail: true, authorName: true, date: true }
            }
        }
    });

    const [logs5d, reports5d, timeLogs5d] = await Promise.all([
        prisma.activityLog.findMany({
            where: {
                createdAt: { gte: fiveAgo },
                OR: [
                    { userId: { in: memberIds }, type: 'LOGIN', projectId: null },
                    { userId: { in: memberIds }, projectId, type: 'TASK_UPDATE' }
                ]
            },
            select: { userId: true }
        }),
        prisma.weeklyReport.findMany({
            where: { projectId, createdAt: { gte: fiveAgo } },
            select: { submittedBy: true }
        }),
        prisma.timeLog.findMany({
            where: {
                createdAt: { gte: fiveAgo },
                task: { projectId }
            },
            select: { userId: true }
        })
    ]);

    const activityByUser = new Map();
    for (const id of memberIds) activityByUser.set(id, 0);
    for (const l of logs5d) {
        if (activityByUser.has(l.userId)) activityByUser.set(l.userId, activityByUser.get(l.userId) + 1);
    }
    for (const r of reports5d) {
        if (activityByUser.has(r.submittedBy)) {
            activityByUser.set(r.submittedBy, activityByUser.get(r.submittedBy) + 1);
        }
    }
    for (const tl of timeLogs5d) {
        if (activityByUser.has(tl.userId)) activityByUser.set(tl.userId, activityByUser.get(tl.userId) + 1);
    }
    if (githubRepo?.commits) {
        for (const c of githubRepo.commits) {
            const m = findMemberForCommit(c.authorEmail, c.authorName, memberUsers);
            if (m) activityByUser.set(m.userId, activityByUser.get(m.userId) + 1);
        }
    }

    const alerts = [];
    for (const u of memberUsers) {
        const c = activityByUser.get(u.userId) || 0;
        if (c === 0) {
            alerts.push({
                level: 'high',
                title: 'Inactivity Alert',
                member: shortName(u.name),
                detail: '0 recorded activity in the last 5 days.',
                color: 'red'
            });
        }
    }

    const sprint = await prisma.sprint.findFirst({
        where: { projectId },
        orderBy: { endDate: 'desc' }
    });
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    const doneRecent = await prisma.task.findMany({
        where: sprint?.id
            ? { sprintId: sprint.id, projectId, status: { equals: 'Done', mode: 'insensitive' } }
            : {
                  projectId,
                  status: { equals: 'Done', mode: 'insensitive' },
                  updatedAt: { gte: twoWeeksAgo }
              },
        select: { assigneeId: true }
    });

    const completedWithOwner = doneRecent.filter((t) => t.assigneeId);
    if (completedWithOwner.length >= 3) {
        const byAssignee = new Map();
        for (const t of completedWithOwner) {
            byAssignee.set(t.assigneeId, (byAssignee.get(t.assigneeId) || 0) + 1);
        }
        let topId = null;
        let topN = 0;
        for (const [uid, n] of byAssignee) {
            if (n > topN) {
                topN = n;
                topId = uid;
            }
        }
        const share = topN / completedWithOwner.length;
        if (share >= 0.75 && topId) {
            const topUser = memberUsers.find((x) => x.userId === topId);
            alerts.push({
                level: 'medium',
                title: 'Uneven Workload',
                member: topUser ? shortName(topUser.name) : 'Member',
                detail: `${Math.round(share * 100)}% of recent sprint tasks completed by one member.`,
                color: 'amber'
            });
        }
    }

    const [heatmapLogs, heatmapReports, heatmapTasks, heatmapTime, heatmapCommits] = await Promise.all([
        prisma.activityLog.findMany({
            where: {
                createdAt: { gte: heatStart },
                OR: [
                    { userId: { in: memberIds }, type: 'LOGIN', projectId: null },
                    { userId: { in: memberIds }, projectId, type: 'TASK_UPDATE' }
                ]
            },
            select: { createdAt: true }
        }),
        prisma.weeklyReport.findMany({
            where: { projectId, createdAt: { gte: heatStart } },
            select: { createdAt: true }
        }),
        prisma.task.findMany({
            where: { projectId, updatedAt: { gte: heatStart } },
            select: { updatedAt: true }
        }),
        prisma.timeLog.findMany({
            where: { createdAt: { gte: heatStart }, task: { projectId } },
            select: { createdAt: true, logDate: true }
        }),
        prisma.githubCommit.findMany({
            where: { githubRepo: { projectId }, date: { gte: heatStart } },
            select: { date: true }
        })
    ]);

    const dayMs = 86400000;
    const heatCounts = Array(30).fill(0);

    function addToHeat(ts) {
        const day = startOfDay(ts).getTime();
        const idx = Math.round((day - heatStartMs) / dayMs);
        if (idx >= 0 && idx < 30) heatCounts[idx] += 1;
    }

    for (const l of heatmapLogs) addToHeat(l.createdAt);
    for (const r of heatmapReports) addToHeat(r.createdAt);
    for (const t of heatmapTasks) addToHeat(t.updatedAt);
    for (const tl of heatmapTime) addToHeat(tl.logDate || tl.createdAt);
    for (const c of heatmapCommits) addToHeat(c.date);

    const maxH = Math.max(1, ...heatCounts);
    const heatLevels = heatCounts.map((c) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / maxH) * 4))));

    const moduleLabel = moduleTag ? `${moduleTag} · ${project.title}` : project.title;

    const kpis = [
        {
            key: 'loginFrequency',
            label: 'Login Frequency',
            value: loginPerMemberThis.toFixed(1),
            unit: '/ week',
            trend: `${loginTrendPct >= 0 ? '+' : ''}${loginTrendPct}%`,
            trendUp: loginTrendPct >= 0,
            color: 'emerald'
        },
        {
            key: 'taskUpdates',
            label: 'Task Updates',
            value: String(taskSigThis),
            unit: 'this week',
            trend: `${taskTrendDiff >= 0 ? '+' : ''}${taskTrendDiff}`,
            trendUp: taskTrendDiff >= 0,
            color: 'emerald'
        },
        {
            key: 'responseTime',
            label: 'Avg. Response Time',
            value: avgHoursThis > 0 ? avgHoursThis.toFixed(1) : '—',
            unit: avgHoursThis > 0 ? 'hours' : '',
            trend:
                avgHoursPrev > 0 && avgHoursThis > 0 ? `${respTrendPct <= 0 ? '' : '+'}${respTrendPct}%` : '—',
            trendUp:
                avgHoursPrev > 0 && avgHoursThis > 0 ? respTrendPct <= 0 : true,
            color: 'teal'
        },
        {
            key: 'groupRank',
            label: 'Group Rank',
            value: `#${rankNow}`,
            unit: `of ${totalGroups} groups`,
            trend: rankDelta === 0 ? '—' : `${rankDelta > 0 ? '▲' : '▼'} ${Math.abs(rankDelta)}`,
            trendUp: rankDelta >= 0,
            color: 'teal'
        }
    ];

    return {
        project: {
            id: project.id,
            title: project.title,
            subtitle: moduleLabel
        },
        kpis,
        heatmap: { levels: heatLevels },
        alerts
    };
}

module.exports = { getEngagementAnalytics };
