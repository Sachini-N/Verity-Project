const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const os = require('os');
const redisClient = require('../config/redis');
const { getRequestStats, getIntegrationStats } = require('../services/systemMetrics');

const prisma = new PrismaClient();

const defaultSettings = {
    activeSemester: 'Year 3 - Semester 1',
    maxGroupSize: 6,
    requireManagerApproval: true,
    moduleGroupSizes: {},
    archivedModuleCodes: [],
    integrationLimits: {
        gemini: process.env.GEMINI_DAILY_LIMIT ? Number(process.env.GEMINI_DAILY_LIMIT) : null,
        github: process.env.GITHUB_HOURLY_LIMIT ? Number(process.env.GITHUB_HOURLY_LIMIT) : null,
        sapling: process.env.SAPLING_DAILY_LIMIT ? Number(process.env.SAPLING_DAILY_LIMIT) : null,
        redis: process.env.REDIS_LIMIT_MB ? Number(process.env.REDIS_LIMIT_MB) : null,
        supabase: process.env.SUPABASE_STORAGE_LIMIT_MB ? Number(process.env.SUPABASE_STORAGE_LIMIT_MB) : null,
    }
};

function normalizeSettings(data) {
    const settings = { ...defaultSettings, ...(data || {}) };
    const moduleGroupSizes = settings.moduleGroupSizes && typeof settings.moduleGroupSizes === 'object'
        ? settings.moduleGroupSizes
        : {};
    const archivedModuleCodes = Array.isArray(settings.archivedModuleCodes)
        ? settings.archivedModuleCodes.map((x) => String(x).toUpperCase())
        : [];
    const integrationLimitsRaw = settings.integrationLimits && typeof settings.integrationLimits === 'object'
        ? settings.integrationLimits
        : defaultSettings.integrationLimits;
    const integrationLimits = Object.fromEntries(
        Object.entries(integrationLimitsRaw).map(([key, value]) => {
            const parsed = Number(value);
            return [String(key).toLowerCase(), Number.isFinite(parsed) && parsed >= 0 ? parsed : null];
        })
    );

    return {
        ...settings,
        moduleGroupSizes: Object.fromEntries(
            Object.entries(moduleGroupSizes).map(([key, value]) => [String(key).toUpperCase(), Number(value)])
        ),
        archivedModuleCodes,
        integrationLimits,
    };
}

async function readRedisUsageMb() {
    try {
        if (!redisClient || redisClient.status === 'end') {
            return { connected: false, usedMb: null };
        }
        const pong = await redisClient.ping();
        const infoRaw = await redisClient.info('memory');
        const line = String(infoRaw)
            .split('\n')
            .find((x) => x.startsWith('used_memory:'));
        const bytes = line ? Number(line.split(':')[1]) : NaN;
        const usedMb = Number.isFinite(bytes) ? Math.round((bytes / 1024 / 1024) * 100) / 100 : null;
        return { connected: String(pong).toUpperCase() === 'PONG', usedMb };
    } catch {
        return { connected: false, usedMb: null };
    }
}

// GET /api/system/settings
router.get('/settings', async (req, res) => {
    try {
        let setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } });
        if (!setting) {
            // Create default
            setting = await prisma.systemSetting.create({
                data: {
                    id: "GLOBAL",
                    data: defaultSettings
                }
            });
        }
        res.status(200).json({ success: true, settings: normalizeSettings(setting.data) });
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        res.status(500).json({ success: false, message: 'Server error parsing settings' });
    }
});

// PUT /api/system/settings
router.put('/settings', async (req, res) => {
    try {
        const { activeSemester, maxGroupSize, requireManagerApproval, moduleGroupSizes } = req.body;
        
        let setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } });
        const currentSettings = normalizeSettings(setting?.data || {});
        const sanitizedModuleGroupSizes = moduleGroupSizes && typeof moduleGroupSizes === 'object'
            ? Object.fromEntries(
                Object.entries(moduleGroupSizes)
                    .map(([key, value]) => [String(key).toUpperCase(), Number(value)])
                    .filter(([, value]) => Number.isFinite(value) && value >= 2)
            )
            : currentSettings.moduleGroupSizes;

        const nextSettings = normalizeSettings({
            ...currentSettings,
            activeSemester,
            maxGroupSize: Number(maxGroupSize),
            requireManagerApproval,
            moduleGroupSizes: sanitizedModuleGroupSizes
        });

        if (!setting) {
             setting = await prisma.systemSetting.create({
                 data: {
                     id: "GLOBAL",
                     data: nextSettings
                 }
             });
        } else {
             setting = await prisma.systemSetting.update({
                 where: { id: "GLOBAL" },
                 data: {
                     data: nextSettings
                 }
             });
        }

        res.status(200).json({ success: true, settings: normalizeSettings(setting.data) });
    } catch (error) {
        console.error("Update Settings Error:", error);
        res.status(500).json({ success: false, message: 'Server error updating settings' });
    }
});

// GET /api/system/metrics
router.get('/metrics', async (req, res) => {
    try {
        const [userTotals, semesterTotals, moduleTotals, projectTotals, assignmentTotals, assignmentSubmissionTotals, submissionTotals, notificationTotals] = await Promise.all([
            prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true }
            }),
            prisma.semester.groupBy({
                by: ['yearId'],
                _count: { _all: true }
            }),
            prisma.module.count(),
            prisma.project.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            prisma.assignment.count(),
            prisma.assignmentSubmission.count(),
            prisma.submission.count(),
            prisma.notification.groupBy({
                by: ['isRead'],
                _count: { _all: true }
            })
        ]);

        const [years, settings, activeUsers, redisUsage] = await Promise.all([
            prisma.year.findMany({ include: { semesters: true } }),
            prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } }),
            prisma.user.count({ where: { status: 'Active' } }),
            readRedisUsageMb()
        ]);

        const normalizedSettings = normalizeSettings(settings?.data || {});
        const requestStats = getRequestStats();
        const integrationStats = getIntegrationStats();

        const totalUsers = userTotals.reduce((sum, item) => sum + item._count._all, 0);
        const roleCounts = userTotals.reduce((acc, item) => {
            acc[String(item.role).toLowerCase()] = item._count._all;
            return acc;
        }, {});
        const projectStatusCounts = projectTotals.reduce((acc, item) => {
            acc[String(item.status).toLowerCase()] = item._count._all;
            return acc;
        }, {});
        const notificationReadCounts = notificationTotals.reduce((acc, item) => {
            acc[item.isRead ? 'read' : 'unread'] = item._count._all;
            return acc;
        }, {});

        const moduleCountsBySemester = years.flatMap((year) =>
            (year.semesters || []).map((semester) => ({
                year: year.name,
                semester: semester.name,
                semesterId: semester.id
            }))
        );

        const semesterLookup = new Map(moduleCountsBySemester.map((entry) => [entry.semesterId, entry]));
        const modulesBySemester = await prisma.module.groupBy({
            by: ['semesterId'],
            _count: { _all: true }
        });

        const modulesTimeline = modulesBySemester.map((item) => {
            const meta = semesterLookup.get(item.semesterId);
            return {
                label: meta ? `${meta.year} ${meta.semester}` : item.semesterId,
                value: item._count._all
            };
        });

        const storageFootprint = {
            trackedSubmissions: assignmentSubmissionTotals + submissionTotals,
            assignmentFiles: assignmentSubmissionTotals,
            projectFiles: submissionTotals,
            configuredQuotaMb: normalizedSettings.storageQuotaMb ?? null,
            configuredWarningMb: normalizedSettings.storageWarningMb ?? null
        };

        const integrationLimits = normalizedSettings.integrationLimits || defaultSettings.integrationLimits;
        const buildIntegrationCard = (name, usedValue, unit, healthy = true) => {
            const limitValue = Number.isFinite(Number(integrationLimits?.[name])) ? Number(integrationLimits[name]) : null;
            const remaining = limitValue != null ? Math.max(0, limitValue - usedValue) : null;
            return {
                name,
                used: usedValue,
                limit: limitValue,
                remaining,
                unit,
                healthy,
                details: integrationStats.services[name] || null,
                trend24h: integrationStats.services[name]?.trend24h || [],
            };
        };

        const integrations = {
            gemini: buildIntegrationCard('gemini', integrationStats.services.gemini?.used24h || 0, 'calls/day'),
            github: buildIntegrationCard('github', integrationStats.services.github?.used24h || 0, 'calls/day'),
            sapling: buildIntegrationCard('sapling', integrationStats.services.sapling?.used24h || 0, 'calls/day'),
            redis: buildIntegrationCard('redis', redisUsage.usedMb || 0, 'MB', redisUsage.connected),
            supabase: buildIntegrationCard('supabase', storageFootprint.trackedSubmissions || 0, 'tracked uploads')
        };

        res.status(200).json({
            success: true,
            metrics: {
                generatedAt: new Date().toISOString(),
                system: {
                    uptimeSeconds: Math.floor(process.uptime()),
                    platform: process.platform,
                    nodeVersion: process.version,
                    memory: {
                        usedMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
                        totalMb: Math.round(os.totalmem() / 1024 / 1024),
                        freeMb: Math.round(os.freemem() / 1024 / 1024)
                    }
                },
                settings: normalizedSettings,
                counts: {
                    users: totalUsers,
                    activeUsers,
                    roleCounts,
                    semesters: semesterTotals.reduce((sum, item) => sum + item._count._all, 0),
                    modules: moduleTotals,
                    projects: projectTotals.reduce((sum, item) => sum + item._count._all, 0),
                    projectStatusCounts,
                    assignments: assignmentTotals,
                    notifications: notificationTotals.reduce((sum, item) => sum + item._count._all, 0),
                    notificationReadCounts,
                    storageFootprint
                },
                usage: requestStats,
                integrations,
                modulesBySemester: modulesTimeline,
                limitSnapshot: {
                    activeSemester: normalizedSettings.activeSemester,
                    maxGroupSize: normalizedSettings.maxGroupSize,
                    requireManagerApproval: normalizedSettings.requireManagerApproval,
                    moduleOverrides: Object.keys(normalizedSettings.moduleGroupSizes || {}).length,
                    archivedModuleCodes: normalizedSettings.archivedModuleCodes.length
                }
            }
        });
    } catch (error) {
        console.error('Fetch Metrics Error:', error);
        res.status(500).json({ success: false, message: 'Server error loading metrics' });
    }
});

module.exports = router;
