const prisma = require('../config/prisma');

const DEFAULT_SETTINGS_DATA = {
    activeSemester: 'Year 3 - Semester 1',
    maxGroupSize: 6,
    requireManagerApproval: true,
    moduleGroupSizes: {},
    archivedModuleCodes: [],
    manualModuleStudents: {}
};

function normalizeSettingsData(data) {
    const src = data && typeof data === 'object' ? data : {};
    return {
        ...DEFAULT_SETTINGS_DATA,
        ...src,
        moduleGroupSizes: src.moduleGroupSizes && typeof src.moduleGroupSizes === 'object' ? src.moduleGroupSizes : {},
        archivedModuleCodes: Array.isArray(src.archivedModuleCodes)
            ? src.archivedModuleCodes.map((x) => String(x).toUpperCase())
            : [],
        manualModuleStudents: src.manualModuleStudents && typeof src.manualModuleStudents === 'object'
            ? src.manualModuleStudents
            : {}
    };
}

async function getActiveGroupCountByModuleCode() {
    const projects = await prisma.project.findMany({
        where: { status: 'Active' },
        select: { description: true }
    });

    const map = new Map();
    projects.forEach((p) => {
        const desc = String(p.description || '').toUpperCase();
        const fromBracket = desc.match(/\[(.*?)\]/)?.[1] || '';
        const code = fromBracket.match(/[A-Z]{2,5}\d{3,5}/)?.[0] || fromBracket;
        if (!code) return;
        map.set(code, (map.get(code) || 0) + 1);
    });

    return map;
}

// Get all Years
exports.getYears = async (req, res) => {
    try {
        const groupCountByCode = await getActiveGroupCountByModuleCode();
        const years = await prisma.year.findMany({
            include: {
                semesters: {
                    include: {
                        modules: {
                            include: {
                                _count: {
                                    select: {
                                        lecturers: true
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                users: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const enriched = years.map((year) => ({
            ...year,
            semesters: (year.semesters || []).map((semester) => ({
                ...semester,
                modules: (semester.modules || []).map((mod) => ({
                    ...mod,
                    activeGroupCount: groupCountByCode.get(String(mod.code || '').toUpperCase()) || 0
                }))
            }))
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching years', error: error.message });
    }
};

// Get Semesters by Year ID
exports.getSemestersByYear = async (req, res) => {
    try {
        const groupCountByCode = await getActiveGroupCountByModuleCode();
        const { yearId } = req.params;
        const semesters = await prisma.semester.findMany({
            where: { yearId },
            include: {
                modules: {
                    include: {
                        _count: {
                            select: {
                                lecturers: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        users: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        const enriched = semesters.map((semester) => ({
            ...semester,
            modules: (semester.modules || []).map((mod) => ({
                ...mod,
                activeGroupCount: groupCountByCode.get(String(mod.code || '').toUpperCase()) || 0
            }))
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching semesters', error: error.message });
    }
};

// Get all Modules (primarily for Lecturer registration)
exports.getAllModules = async (req, res) => {
    try {
        const { lecturerId } = req.query;
        const whereClause = lecturerId ? { lecturers: { some: { id: lecturerId } } } : {};

        const modules = await prisma.module.findMany({
            where: whereClause,
            include: {
                semester: {
                    include: {
                        year: true
                    }
                }
            },
            orderBy: { code: 'asc' }
        });
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching modules', error: error.message });
    }
};

// Create a new Module (Manager action)
exports.createModule = async (req, res) => {
    try {
        const { code, name, semesterId } = req.body;
        
        let targetSemesterId = semesterId;
        if (!targetSemesterId) {
            const firstSemester = await prisma.semester.findFirst();
            if (!firstSemester) {
                return res.status(400).json({ success: false, message: 'No semester available to map module to.' });
            }
            targetSemesterId = firstSemester.id;
        }

        const newModule = await prisma.module.create({
            data: { code, name, semesterId: targetSemesterId },
            include: { semester: { include: { year: true } } }
        });
        res.status(201).json({ success: true, module: newModule });
    } catch (error) {
        console.error("Error creating module:", error);
        res.status(500).json({ success: false, message: 'Error creating module', error: error.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, semesterId } = req.body;

        const module = await prisma.module.findUnique({ where: { id } });
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found.' });
        }

        const nextCode = String(code || module.code).trim().toUpperCase();
        const nextName = String(name || module.name).trim();
        const nextSemesterId = semesterId || module.semesterId;

        if (!nextCode || !nextName) {
            return res.status(400).json({ success: false, message: 'Module code and name are required.' });
        }

        const conflicting = await prisma.module.findFirst({
            where: {
                code: nextCode,
                NOT: { id }
            }
        });
        if (conflicting) {
            return res.status(409).json({ success: false, message: `Module code ${nextCode} already exists.` });
        }

        const updated = await prisma.module.update({
            where: { id },
            data: {
                code: nextCode,
                name: nextName,
                semesterId: nextSemesterId
            },
            include: {
                semester: {
                    include: {
                        year: true
                    }
                }
            }
        });

        // Keep module-scoped system settings keys in sync when module code changes.
        if (String(module.code).toUpperCase() !== nextCode) {
            const setting = await prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } });
            const data = normalizeSettingsData(setting?.data || {});
            const oldCode = String(module.code).toUpperCase();

            const nextModuleGroupSizes = { ...data.moduleGroupSizes };
            if (Object.prototype.hasOwnProperty.call(nextModuleGroupSizes, oldCode)) {
                nextModuleGroupSizes[nextCode] = nextModuleGroupSizes[oldCode];
                delete nextModuleGroupSizes[oldCode];
            }

            const nextManualModuleStudents = { ...data.manualModuleStudents };
            if (Object.prototype.hasOwnProperty.call(nextManualModuleStudents, oldCode)) {
                nextManualModuleStudents[nextCode] = nextManualModuleStudents[oldCode];
                delete nextManualModuleStudents[oldCode];
            }

            const nextArchived = Array.from(
                new Set(data.archivedModuleCodes.map((x) => (x === oldCode ? nextCode : x)))
            );

            const nextSettings = {
                ...data,
                moduleGroupSizes: nextModuleGroupSizes,
                manualModuleStudents: nextManualModuleStudents,
                archivedModuleCodes: nextArchived
            };

            if (!setting) {
                await prisma.systemSetting.create({
                    data: { id: 'GLOBAL', data: nextSettings }
                });
            } else {
                await prisma.systemSetting.update({
                    where: { id: 'GLOBAL' },
                    data: { data: nextSettings }
                });
            }
        }

        res.status(200).json({ success: true, module: updated });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ success: false, message: 'Error updating module', error: error.message });
    }
};

exports.archiveModule = async (req, res) => {
    try {
        const { id } = req.params;
        const archived = req.body?.archived !== false;

        const module = await prisma.module.findUnique({ where: { id }, select: { code: true } });
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found.' });
        }

        const moduleCode = String(module.code).toUpperCase();
        const setting = await prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } });
        const data = setting?.data && typeof setting.data === 'object' ? setting.data : {};
        const existing = Array.isArray(data.archivedModuleCodes)
            ? data.archivedModuleCodes.map((x) => String(x).toUpperCase())
            : [];

        const next = archived
            ? Array.from(new Set([...existing, moduleCode]))
            : existing.filter((x) => x !== moduleCode);

        const nextData = {
            activeSemester: data.activeSemester || 'Year 3 - Semester 1',
            maxGroupSize: Number(data.maxGroupSize) || 6,
            requireManagerApproval: data.requireManagerApproval !== false,
            moduleGroupSizes: data.moduleGroupSizes && typeof data.moduleGroupSizes === 'object' ? data.moduleGroupSizes : {},
            manualModuleStudents: data.manualModuleStudents && typeof data.manualModuleStudents === 'object' ? data.manualModuleStudents : {},
            ...data,
            archivedModuleCodes: next
        };

        if (!setting) {
            await prisma.systemSetting.create({
                data: {
                    id: 'GLOBAL',
                    data: nextData
                }
            });
        } else {
            await prisma.systemSetting.update({
                where: { id: 'GLOBAL' },
                data: { data: nextData }
            });
        }

        res.status(200).json({ success: true, archived, moduleCode, archivedModuleCodes: next });
    } catch (error) {
        console.error('Error archiving module:', error);
        res.status(500).json({ success: false, message: 'Error archiving module', error: error.message });
    }
};

exports.updateModuleAssignments = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            addStudentIds = [],
            removeStudentIds = [],
            addLecturerIds = [],
            removeLecturerIds = []
        } = req.body || {};

        const module = await prisma.module.findUnique({ where: { id }, select: { id: true, code: true } });
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found.' });
        }

        const moduleCode = String(module.code).toUpperCase();

        const lecturerAdd = Array.isArray(addLecturerIds) ? addLecturerIds : [];
        const lecturerRemove = Array.isArray(removeLecturerIds) ? removeLecturerIds : [];

        const validLecturerAdd = lecturerAdd.length
            ? await prisma.user.findMany({ where: { id: { in: lecturerAdd }, role: 'LECTURER' }, select: { id: true } })
            : [];
        const validLecturerRemove = lecturerRemove.length
            ? await prisma.user.findMany({ where: { id: { in: lecturerRemove }, role: 'LECTURER' }, select: { id: true } })
            : [];

        if (validLecturerAdd.length || validLecturerRemove.length) {
            await prisma.module.update({
                where: { id },
                data: {
                    lecturers: {
                        connect: validLecturerAdd.map((u) => ({ id: u.id })),
                        disconnect: validLecturerRemove.map((u) => ({ id: u.id }))
                    }
                }
            });
        }

        const studentAdd = Array.isArray(addStudentIds) ? addStudentIds : [];
        const studentRemove = Array.isArray(removeStudentIds) ? removeStudentIds : [];
        const validStudentAdd = studentAdd.length
            ? await prisma.user.findMany({ where: { id: { in: studentAdd }, role: 'STUDENT' }, select: { id: true } })
            : [];

        const setting = await prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } });
        const data = normalizeSettingsData(setting?.data || {});
        const manualMap = { ...data.manualModuleStudents };
        const currentForModule = Array.isArray(manualMap[moduleCode])
            ? manualMap[moduleCode].map((x) => String(x))
            : [];

        const set = new Set(currentForModule);
        validStudentAdd.forEach((u) => set.add(u.id));
        studentRemove.map((x) => String(x)).forEach((idToRemove) => set.delete(idToRemove));

        manualMap[moduleCode] = Array.from(set);

        const nextSettings = {
            ...data,
            manualModuleStudents: manualMap
        };

        if (!setting) {
            await prisma.systemSetting.create({
                data: { id: 'GLOBAL', data: nextSettings }
            });
        } else {
            await prisma.systemSetting.update({
                where: { id: 'GLOBAL' },
                data: { data: nextSettings }
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating module assignments:', error);
        return res.status(500).json({ success: false, message: 'Error updating module assignments', error: error.message });
    }
};

// Get Module Details (with Lecturers and Enrolled Students)
exports.getModuleDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const moduleDetails = await prisma.module.findUnique({
            where: { id },
            include: {
                lecturers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        skills: true
                    }
                },
                semester: {
                    include: {
                        users: {
                            where: { role: 'STUDENT' },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                indexNumber: true,
                                phone: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!moduleDetails) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const setting = await prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } });
        const data = normalizeSettingsData(setting?.data || {});
        const moduleCode = String(moduleDetails.code || '').toUpperCase();
        const manualIds = Array.isArray(data.manualModuleStudents[moduleCode])
            ? data.manualModuleStudents[moduleCode].map((x) => String(x))
            : [];

        const manualAssignedStudents = manualIds.length
            ? await prisma.user.findMany({
                where: {
                    id: { in: manualIds },
                    role: 'STUDENT'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    indexNumber: true,
                    phone: true
                }
            })
            : [];

        const autoStudents = moduleDetails.semester?.users || [];
        const autoIds = new Set(autoStudents.map((s) => String(s.id)));
        const effectiveStudents = [
            ...autoStudents.map((s) => ({ ...s, source: 'semester' })),
            ...manualAssignedStudents
                .filter((s) => !autoIds.has(String(s.id)))
                .map((s) => ({ ...s, source: 'manual' }))
        ];

        res.json({
            ...moduleDetails,
            manualAssignedStudents,
            effectiveStudents
        });
    } catch (error) {
        console.error("Error fetching module details:", error);
        res.status(500).json({ message: 'Error fetching module details', error: error.message });
    }
};
