import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, User, LayoutGrid, Calendar, ShieldAlert, Search, Plus, FolderTree, CheckCircle2 } from 'lucide-react';

const PRESET_STORAGE_KEY = 'manager-modules-filter-presets-v1';

export default function ManagerModules() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('all');
  const [selectedSemesterId, setSelectedSemesterId] = useState('all');
  const [moduleSearch, setModuleSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [moduleDetails, setModuleDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [archivedModuleCodes, setArchivedModuleCodes] = useState<string[]>([]);
  const [userDirectory, setUserDirectory] = useState<any[]>([]);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newYearId, setNewYearId] = useState('');
  const [newSemesterId, setNewSemesterId] = useState('');

  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editYearId, setEditYearId] = useState('');
  const [editSemesterId, setEditSemesterId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignLecturerId, setAssignLecturerId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');

  const [presetName, setPresetName] = useState('');
  const [filterPresets, setFilterPresets] = useState<any[]>([]);

  useEffect(() => {
    fetchHierarchy();
    fetchContext();

    try {
      const raw = localStorage.getItem(PRESET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFilterPresets(parsed);
      }
    } catch {
      // ignore invalid local storage presets
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(filterPresets));
  }, [filterPresets]);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/academic/years');
      const data = await res.json();
      setHierarchy(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContext = async () => {
    try {
      const [settingsRes, groupsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/system/settings'),
        fetch('http://localhost:5000/api/project/manager/groups'),
        fetch('http://localhost:5000/api/user/manager/users'),
      ]);
      const settingsData = await settingsRes.json();
      const groupsData = await groupsRes.json();
      const usersData = await usersRes.json();

      if (settingsData?.success && settingsData.settings) {
        setArchivedModuleCodes(Array.isArray(settingsData.settings.archivedModuleCodes)
          ? settingsData.settings.archivedModuleCodes.map((x: any) => String(x).toUpperCase())
          : []);
      }

      if (groupsData?.success && Array.isArray(groupsData.groups)) {
        setGroups(groupsData.groups);
      }

      if (usersData?.success && Array.isArray(usersData.users)) {
        setUserDirectory(usersData.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModuleDetails = async (id: string) => {
    setLoadingDetails(true);
    setModuleDetails(null);
    try {
      const res = await fetch(`http://localhost:5000/api/academic/modules/${id}`);
      const data = await res.json();
      setModuleDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleModuleClick = (module: any) => {
    setSelectedModule(module);
    fetchModuleDetails(module.id);
  };

  useEffect(() => {
    if (!selectedModule) return;
    setEditCode(String(selectedModule.code || ''));
    setEditName(String(selectedModule.name || ''));
    setEditYearId(String(selectedModule.yearId || ''));
    setEditSemesterId(String(selectedModule.semesterId || ''));
  }, [selectedModule]);

  const flatModules = useMemo(() => {
    const rows: Array<any> = [];
    hierarchy.forEach((year: any) => {
      year.semesters?.forEach((semester: any) => {
        semester.modules?.forEach((module: any) => {
          rows.push({
            ...module,
            yearId: year.id,
            yearName: year.name,
            semesterId: semester.id,
            semesterName: semester.name,
            semesterStudentCount: semester?._count?.users || 0,
            lecturerCount: module?._count?.lecturers || 0,
            isArchived: archivedModuleCodes.includes(String(module.code || '').toUpperCase()),
          });
        });
      });
    });
    return rows;
  }, [archivedModuleCodes, hierarchy]);

  const activeGroupCountByCode = useMemo(() => {
    const map = new Map<string, number>();
    groups
      .filter((g: any) => String(g.status).toLowerCase() === 'active')
      .forEach((g: any) => {
        const raw = String(g.module || '').toUpperCase();
        const extracted = raw.match(/[A-Z]{2,5}\d{3,5}/)?.[0] || raw;
        map.set(extracted, (map.get(extracted) || 0) + 1);
      });
    return map;
  }, [groups]);

  const studentUsers = useMemo(
    () => userDirectory.filter((u: any) => String(u.role).toLowerCase() === 'student'),
    [userDirectory]
  );

  const lecturerUsers = useMemo(
    () => userDirectory.filter((u: any) => String(u.role).toLowerCase() === 'lecturer'),
    [userDirectory]
  );

  const semestersForSelectedYear = useMemo(() => {
    if (selectedYearId === 'all') {
      return hierarchy.flatMap((y: any) => y.semesters || []);
    }
    const yr = hierarchy.find((y: any) => y.id === selectedYearId);
    return yr?.semesters || [];
  }, [hierarchy, selectedYearId]);

  const filteredModules = useMemo(() => {
    return flatModules.filter((mod: any) => {
      const matchesYear = selectedYearId === 'all' || mod.yearId === selectedYearId;
      const matchesSem = selectedSemesterId === 'all' || mod.semesterId === selectedSemesterId;
      const q = moduleSearch.trim().toLowerCase();
      const matchesSearch = !q || mod.code.toLowerCase().includes(q) || mod.name.toLowerCase().includes(q);
      const matchesArchive = includeArchived || !mod.isArchived;
      return matchesYear && matchesSem && matchesSearch && matchesArchive;
    });
  }, [flatModules, includeArchived, moduleSearch, selectedSemesterId, selectedYearId]);

  const groupedModules = useMemo(() => {
    const map = new Map<string, { yearName: string; semesterName: string; modules: any[] }>();
    filteredModules.forEach((mod: any) => {
      const key = `${mod.yearId}-${mod.semesterId}`;
      if (!map.has(key)) {
        map.set(key, { yearName: mod.yearName, semesterName: mod.semesterName, modules: [] });
      }
      map.get(key)?.modules.push(mod);
    });
    return Array.from(map.values()).sort((a, b) => `${a.yearName}-${a.semesterName}`.localeCompare(`${b.yearName}-${b.semesterName}`));
  }, [filteredModules]);

  const semestersForNewYear = useMemo(() => {
    const year = hierarchy.find((y: any) => y.id === newYearId);
    return year?.semesters || [];
  }, [hierarchy, newYearId]);

  useEffect(() => {
    if (hierarchy.length > 0 && !newYearId) {
      const firstYear = hierarchy[0];
      setNewYearId(firstYear.id);
      const firstSemester = firstYear.semesters?.[0];
      if (firstSemester) setNewSemesterId(firstSemester.id);
    }
  }, [hierarchy, newYearId]);

  useEffect(() => {
    if (!newYearId) return;
    const semesters = hierarchy.find((y: any) => y.id === newYearId)?.semesters || [];
    if (!semesters.some((s: any) => s.id === newSemesterId)) {
      setNewSemesterId(semesters[0]?.id || '');
    }
  }, [hierarchy, newSemesterId, newYearId]);

  useEffect(() => {
    if (selectedYearId !== 'all') {
      const semesters = hierarchy.find((y: any) => y.id === selectedYearId)?.semesters || [];
      if (!semesters.some((s: any) => s.id === selectedSemesterId)) {
        setSelectedSemesterId('all');
      }
    }
  }, [hierarchy, selectedSemesterId, selectedYearId]);

  const handleCreateModule = async () => {
    setCreateMsg(null);
    if (!newCode.trim() || !newName.trim() || !newSemesterId) {
      setCreateMsg('Module code, name, and semester are required.');
      return;
    }

    setSavingModule(true);
    try {
      const res = await fetch('http://localhost:5000/api/academic/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          semesterId: newSemesterId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setCreateMsg(data?.message || 'Failed to create module.');
        return;
      }

      setCreateMsg(`Module ${data.module?.code || newCode.toUpperCase()} created successfully.`);
      setNewCode('');
      setNewName('');
      await fetchHierarchy();
      await fetchContext();
    } catch (err) {
      console.error(err);
      setCreateMsg('Error while creating module.');
    } finally {
      setSavingModule(false);
    }
  };

  const semestersForEditYear = useMemo(() => {
    const year = hierarchy.find((y: any) => y.id === editYearId);
    return year?.semesters || [];
  }, [editYearId, hierarchy]);

  const saveModuleQuickAction = async () => {
    if (!selectedModule) return;
    setActionMsg(null);
    setSavingEdit(true);
    try {
      const res = await fetch(`http://localhost:5000/api/academic/modules/${selectedModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCode.trim().toUpperCase(),
          name: editName.trim(),
          semesterId: editSemesterId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setActionMsg(data?.message || 'Failed to update module.');
        return;
      }

      setActionMsg('Module updated successfully.');
      await fetchHierarchy();
      await fetchContext();

      const refreshed = flatModules.find((m: any) => m.id === selectedModule.id);
      if (refreshed) setSelectedModule(refreshed);
      fetchModuleDetails(selectedModule.id);
    } catch (err) {
      console.error(err);
      setActionMsg('Error while updating module.');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleArchiveModule = async () => {
    if (!selectedModule) return;
    const nextArchived = !selectedModule.isArchived;
    setActionMsg(null);
    try {
      const res = await fetch(`http://localhost:5000/api/academic/modules/${selectedModule.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: nextArchived }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setActionMsg(data?.message || 'Failed to update archive status.');
        return;
      }

      setActionMsg(nextArchived ? 'Module archived.' : 'Module restored to active registry.');
      await fetchContext();
      await fetchHierarchy();
      fetchModuleDetails(selectedModule.id);
    } catch (err) {
      console.error(err);
      setActionMsg('Error while updating archive status.');
    }
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const next = [
      {
        id: `${Date.now()}`,
        name,
        selectedYearId,
        selectedSemesterId,
        moduleSearch,
        includeArchived,
      },
      ...filterPresets,
    ].slice(0, 8);

    setFilterPresets(next);
    setPresetName('');
  };

  const applyPreset = (preset: any) => {
    setSelectedYearId(preset.selectedYearId || 'all');
    setSelectedSemesterId(preset.selectedSemesterId || 'all');
    setModuleSearch(preset.moduleSearch || '');
    setIncludeArchived(Boolean(preset.includeArchived));
  };

  const deletePreset = (id: string) => {
    setFilterPresets((prev) => prev.filter((p: any) => p.id !== id));
  };

  const applyAssignmentUpdate = async (payload: any) => {
    if (!selectedModule) return;
    setSavingAssignments(true);
    setActionMsg(null);
    try {
      const res = await fetch(`http://localhost:5000/api/academic/modules/${selectedModule.id}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setActionMsg(data?.message || 'Failed to update assignments.');
        return;
      }

      setActionMsg('Assignments updated successfully.');
      setAssignLecturerId('');
      setAssignStudentId('');
      await fetchModuleDetails(selectedModule.id);
      await fetchHierarchy();
      await fetchContext();
    } catch (err) {
      console.error(err);
      setActionMsg('Error while updating assignments.');
    } finally {
      setSavingAssignments(false);
    }
  };

  return (
    <div className="animate-fade-up max-w-[96rem] mx-auto space-y-8 px-6">
      <div className="page-header role-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title role-title">Module Command Deck</h1>
          <p className="page-subtitle text-slate-500">Create modules in the correct semester and filter large catalogs by year, semester, and search instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 inline-flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-700" /> Register New Module
                </h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">Create a module under a specific academic year and semester.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Module Code</label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="IT4080"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Module Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Distributed Systems"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Academic Year</label>
                <select
                  value={newYearId}
                  onChange={(e) => setNewYearId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {hierarchy.map((year: any) => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Semester</label>
                <select
                  value={newSemesterId}
                  onChange={(e) => setNewSemesterId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {semestersForNewYear.map((sem: any) => (
                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={handleCreateModule}
                disabled={savingModule}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-3 font-black disabled:opacity-60"
              >
                <Plus className="w-4 h-4" /> {savingModule ? 'Creating...' : 'Create Module'}
              </button>
              {createMsg && (
                <p className={`text-sm font-bold inline-flex items-center gap-2 ${createMsg.toLowerCase().includes('success') ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {createMsg.toLowerCase().includes('success') && <CheckCircle2 className="w-4 h-4" />}
                  {createMsg}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
              <div className="flex-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Search Modules</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search by code or module name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Year</label>
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="w-full md:w-44 px-3 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                  >
                    <option value="all">All Years</option>
                    {hierarchy.map((year: any) => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Semester</label>
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="w-full md:w-44 px-3 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                  >
                    <option value="all">All Semesters</option>
                    {semestersForSelectedYear.map((sem: any) => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="includeArchived"
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeArchived" className="text-xs font-bold text-slate-600">Include archived modules</label>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name (e.g., Year 3 S1)"
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  />
                  <button
                    onClick={saveCurrentPreset}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-black"
                  >
                    Save Preset
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {filterPresets.map((preset: any) => (
                    <div key={preset.id} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-1">
                      <button onClick={() => applyPreset(preset)} className="text-[11px] font-black text-slate-700">{preset.name}</button>
                      <button onClick={() => deletePreset(preset.id)} className="text-[11px] font-black text-rose-600">x</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 inline-flex items-center gap-2">
                <FolderTree className="w-4 h-4" /> Categorized Registry
              </h3>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                {filteredModules.length} module(s)
              </span>
            </div>

            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
              {groupedModules.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold">
                  No modules found for current filters.
                </div>
              ) : (
                groupedModules.map((group, idx) => (
                  <div key={`${group.yearName}-${group.semesterName}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-800">{group.yearName} - {group.semesterName}</p>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{group.modules.length} Modules</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.modules.map((mod: any) => (
                        <button
                          key={mod.id}
                          onClick={() => handleModuleClick(mod)}
                          className={`p-3 rounded-xl border text-left transition-colors ${
                            selectedModule?.id === mod.id
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-black text-slate-800">{mod.code}</p>
                            {mod.isArchived && <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">Archived</span>}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5 line-clamp-2">{mod.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">Lec {mod.lecturerCount || 0}</span>
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">Stu {mod.semesterStudentCount || 0}</span>
                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">Grp {mod.activeGroupCount ?? activeGroupCountByCode.get(String(mod.code).toUpperCase()) ?? 0}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-24">
            {!selectedModule ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[400px]">
                <LayoutGrid className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-sm font-black text-slate-400 tracking-wider">NO MODULE SELECTED</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 max-w-[220px]">Select a module from the categorized registry to view details.</p>
              </div>
            ) : (
              <div className="card shadow-md animate-fade-left">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-indigo-900 to-teal-800 text-white rounded-t-3xl relative overflow-hidden">
                  <BookOpen className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4 transform -rotate-12" />
                  <span className="text-xs font-black tracking-widest text-indigo-200 uppercase block mb-1">
                    {selectedModule.yearName || '-'} • {selectedModule.semesterName || '-'}
                  </span>
                  <h2 className="text-3xl font-black mb-1">{selectedModule.code}</h2>
                  <p className="text-sm font-medium text-white/80">{selectedModule.name}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Quick Actions</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700"
                        placeholder="Module Code"
                      />
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 sm:col-span-1"
                        placeholder="Module Name"
                      />
                      <select
                        value={editYearId}
                        onChange={(e) => setEditYearId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700"
                      >
                        {hierarchy.map((year: any) => (
                          <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                      </select>
                      <select
                        value={editSemesterId}
                        onChange={(e) => setEditSemesterId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700"
                      >
                        {semestersForEditYear.map((sem: any) => (
                          <option key={sem.id} value={sem.id}>{sem.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={saveModuleQuickAction}
                        disabled={savingEdit}
                        className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-black disabled:opacity-60"
                      >
                        {savingEdit ? 'Saving...' : 'Save Edit / Move'}
                      </button>
                      <button
                        onClick={toggleArchiveModule}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-black ${selectedModule.isArchived ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
                      >
                        {selectedModule.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>

                    {actionMsg && <p className="text-xs font-bold text-slate-600">{actionMsg}</p>}
                  </div>

                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : moduleDetails ? (
                    <>
                      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-cyan-800 mb-2">Real Enrollment Snapshot</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-white border border-cyan-100 p-2">
                            <p className="text-lg font-black text-slate-800">{moduleDetails.lecturers?.length || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Lecturers</p>
                          </div>
                          <div className="rounded-lg bg-white border border-cyan-100 p-2">
                            <p className="text-lg font-black text-slate-800">{moduleDetails.semester?.users?.length || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Auto Students</p>
                          </div>
                          <div className="rounded-lg bg-white border border-cyan-100 p-2">
                            <p className="text-lg font-black text-slate-800">{moduleDetails.effectiveStudents?.length || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Effective Total</p>
                          </div>
                        </div>
                      </div>

                      {/* Lecturers */}
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <User className="w-4 h-4" /> Assigned Lecturers
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 mb-3 items-center">
                          <select
                            value={assignLecturerId}
                            onChange={(e) => setAssignLecturerId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                          >
                            <option value="">Select lecturer to add</option>
                            {lecturerUsers
                              .filter((u: any) => !(moduleDetails.lecturers || []).some((l: any) => l.id === u.dbId))
                              .map((u: any) => (
                                <option key={u.dbId} value={u.dbId}>{u.name} ({u.email})</option>
                              ))}
                          </select>
                          <button
                            onClick={() => assignLecturerId && applyAssignmentUpdate({ addLecturerIds: [assignLecturerId] })}
                            disabled={!assignLecturerId || savingAssignments}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-black disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>

                        {moduleDetails.lecturers?.length > 0 ? (
                          <div className="space-y-3">
                            {moduleDetails.lecturers.map((lec: any) => (
                              <div key={lec.id} className="flex items-center justify-between gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center font-black text-sm shrink-0">
                                    {lec.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-800 truncate">{lec.name}</div>
                                    <div className="text-xs font-medium text-slate-500 truncate">{lec.email}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => applyAssignmentUpdate({ removeLecturerIds: [lec.id] })}
                                  disabled={savingAssignments}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-black"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            No lecturers assigned yet.
                          </div>
                        )}
                      </div>

                      {/* Students */}
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Student Assignment (Auto + Manual)
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 mb-3 items-center">
                          <select
                            value={assignStudentId}
                            onChange={(e) => setAssignStudentId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                          >
                            <option value="">Select student to manually assign</option>
                            {studentUsers
                              .filter((u: any) => !(moduleDetails.effectiveStudents || []).some((s: any) => s.id === u.dbId))
                              .map((u: any) => (
                                <option key={u.dbId} value={u.dbId}>{u.id} - {u.name}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => assignStudentId && applyAssignmentUpdate({ addStudentIds: [assignStudentId] })}
                            disabled={!assignStudentId || savingAssignments}
                            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-slate-700">
                          <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-black leading-none">{moduleDetails.effectiveStudents?.length || 0}</div>
                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Effective Students</div>
                          </div>
                        </div>

                        {moduleDetails.effectiveStudents?.length > 0 && (
                          <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {moduleDetails.effectiveStudents.map((student: any) => (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div className="max-w-[150px]">
                                    <div className="text-xs font-bold text-slate-800 truncate" title={student.name}>{student.name}</div>
                                    <div className="text-[10px] font-medium text-slate-400">{student.indexNumber || 'No ID'}</div>
                                  </div>
                                </div>
                                {student.source === 'manual' ? (
                                  <button
                                    onClick={() => applyAssignmentUpdate({ removeStudentIds: [student.id] })}
                                    disabled={savingAssignments}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-black"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 border border-sky-200 rounded-full px-2 py-1">Auto</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm font-medium text-red-500 py-8">
                      Failed to load details.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
