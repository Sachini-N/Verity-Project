import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, AlertTriangle, Users, X, UserPlus, UserMinus, Save, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

export default function ManagerGroupDirectory() {
  const location = useLocation();
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [boardTab, setBoardTab] = useState<'overview' | 'approvals' | 'registry' | 'rules'>(location.pathname.startsWith('/manager/approvals') ? 'approvals' : 'overview');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [activeSemester, setActiveSemester] = useState('Year 3 - Semester 1');
  const [maxGroupSize, setMaxGroupSize] = useState(6);
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);
  const [moduleGroupSizes, setModuleGroupSizes] = useState<Record<string, number>>({});
  const [modules, setModules] = useState<any[]>([]);
  const [savingRules, setSavingRules] = useState(false);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [addMembersList, setAddMembersList] = useState<string[]>([]);
  const [removeMembersList, setRemoveMembersList] = useState<string[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [memberViewFilter, setMemberViewFilter] = useState<'all' | 'leader' | 'member'>('all');
  
  // Searchable Dropdown state
  const [userSearchText, setUserSearchText] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
    fetchSettings();
    fetchModules();
  }, []);

  useEffect(() => {
    setBoardTab(location.pathname.startsWith('/manager/approvals') ? 'approvals' : 'overview');
  }, [location.pathname]);

  useEffect(() => {
    setSelectedPendingIds((prev) => prev.filter((id) => pendingGroups.some((group) => group.id === id)));
  }, [searchQuery, groups]);

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/project/manager/groups');
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/user/manager/users');
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users.filter((u: any) => u.role === 'Student'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/academic/modules');
      const data = await res.json();
      if (Array.isArray(data)) {
        setModules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/system/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.activeSemester) setActiveSemester(data.settings.activeSemester);
        if (data.settings.maxGroupSize !== undefined) setMaxGroupSize(data.settings.maxGroupSize);
        if (data.settings.requireManagerApproval !== undefined) setRequireManagerApproval(data.settings.requireManagerApproval);
        if (data.settings.moduleGroupSizes && typeof data.settings.moduleGroupSizes === 'object') {
          setModuleGroupSizes(data.settings.moduleGroupSizes);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingRules(true);
      const res = await fetch('http://localhost:5000/api/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSemester, maxGroupSize, requireManagerApproval, moduleGroupSizes })
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings?.moduleGroupSizes) setModuleGroupSizes(data.settings.moduleGroupSizes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRules(false);
    }
  };

  const handleApprovalAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`http://localhost:5000/api/project/manager/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) => prev.map((group) => (
          group.id === id ? { ...group, status: action === 'Approved' ? 'Active' : 'Rejected' } : group
        )));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkApprovalAction = async (action: 'Approved' | 'Rejected') => {
    if (selectedPendingIds.length === 0) return;

    try {
      await Promise.all(selectedPendingIds.map((id) => handleApprovalAction(id, action)));
      await fetchGroups();
      setSelectedPendingIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGroup = async (id: string) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to completely delete this group? All data, repositories, and documents will be permanently wiped. This action cannot be undone.")) {
      try {
        const res = await fetch(`http://localhost:5000/api/project/manager/groups/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          setGroups(groups.filter(g => g.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Modal Logic ---
  const openEditModal = (group: any) => {
    setEditingGroup({ ...group, members: [...(group.members || [])] });
    setAddMembersList([]);
    setRemoveMembersList([]);
    setSelectedUserToAdd('');
    setUserSearchText('');
    setIsUserDropdownOpen(false);
    setMemberViewFilter('all');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGroup(null);
  };

  useEffect(() => {
    if (!isEditModalOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeEditModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const handleRemoveMember = (memberId: string) => {
    if (addMembersList.includes(memberId)) {
        setAddMembersList(prev => prev.filter(id => id !== memberId));
    } else {
        setRemoveMembersList(prev => [...prev, memberId]);
    }
    setEditingGroup((prev: any) => ({
        ...prev,
        members: prev.members.filter((m: any) => m.id !== memberId)
    }));
  };

  const handleAddMember = () => {
    if (!selectedUserToAdd) return;
    const user = allUsers.find(u => u.dbId === selectedUserToAdd);
    if (!user) return;
    
    if (removeMembersList.includes(user.dbId)) {
        setRemoveMembersList(prev => prev.filter(id => id !== user.dbId));
    } else {
        setAddMembersList(prev => [...prev, user.dbId]);
    }

    setEditingGroup((prev: any) => ({
        ...prev,
        members: [...prev.members, { id: user.dbId, name: user.name, indexNumber: user.id || user.indexNumber, role: 'MEMBER' }]
    }));
    setSelectedUserToAdd('');
    setUserSearchText('');
    setIsUserDropdownOpen(false);
  };

  const saveEditGroup = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/project/manager/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingGroup.title, 
          addMembers: addMembersList, 
          removeMembers: removeMembersList 
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchGroups(); 
        closeEditModal();
      } else {
        alert("Failed to update group: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving group.");
    }
  };

  const filteredGroups = groups.filter(g => 
     g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     g.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

    const pendingGroups = filteredGroups.filter((g) => g.status === 'Pending');
    const activeGroups = filteredGroups.filter((g) => g.status === 'Active');
    const allPendingSelected = pendingGroups.length > 0 && pendingGroups.every((group) => selectedPendingIds.includes(group.id));

  // Available users to add (not already in the modal's current members list)
  const availableUsersToAdd = editingGroup 
     ? allUsers.filter(u => !editingGroup.members.some((m: any) => m.id === u.dbId))
     : [];

  const visibleMembers = editingGroup
    ? editingGroup.members.filter((member: any) => {
        if (memberViewFilter === 'leader') return member.role === 'LEADER';
        if (memberViewFilter === 'member') return member.role !== 'LEADER';
        return true;
      })
    : [];

  const stagedAddedMembers = addMembersList
    .map((id) => allUsers.find((u: any) => u.dbId === id))
    .filter(Boolean);

  const stagedRemovedMembers = removeMembersList
    .map((id) => allUsers.find((u: any) => u.dbId === id) || { dbId: id, name: 'Unknown Student', id: id })
    .filter(Boolean);

  return (
    <div className="animate-fade-up max-w-[96rem] mx-auto space-y-8 px-6">
      
      {/* Edit Modal Override */}
      {isEditModalOpen && editingGroup && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[220] bg-slate-950/60 backdrop-blur-md p-3 sm:p-6 pt-20 sm:pt-24 pb-4 flex items-start justify-center overflow-y-auto">
          <div className="w-full max-w-6xl h-[calc(100dvh-6.5rem)] max-h-[900px] rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#f5f8ff] via-[#f8fbff] to-[#eefcf8] shadow-[0_28px_70px_-30px_rgba(15,23,42,0.75)] overflow-hidden animate-fade-up mb-4">
            <div className="h-full grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="relative border-b lg:border-b-0 lg:border-r border-indigo-100/70 bg-gradient-to-b from-[#1f2a5a] via-[#1f376d] to-[#164e63] text-white p-6 overflow-y-auto">
                <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute -bottom-20 -right-16 h-52 w-52 rounded-full bg-blue-300/15 blur-3xl" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/80">Group Control Console</p>
                      <h2 className="mt-2 text-2xl font-black leading-tight">{editingGroup.title}</h2>
                    </div>
                    <button
                      onClick={closeEditModal}
                      className="h-9 w-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-cyan-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Module</p>
                      <p className="mt-1 text-sm font-black text-white">{editingGroup.module || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Current Team Size</p>
                      <p className="mt-1 text-sm font-black text-white">{editingGroup.members.length} members</p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Pending Changes</p>
                      <p className="mt-1 text-sm font-black text-white">+{addMembersList.length} add / -{removeMembersList.length} remove</p>
                    </div>
                  </div>

                  <div className="mt-auto rounded-2xl border border-cyan-200/30 bg-cyan-300/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/80">Operations Note</p>
                    <p className="mt-1 text-xs font-semibold text-cyan-50/90 leading-relaxed">
                      Leader changes and member overrides apply only after clicking Save Changes.
                    </p>
                  </div>
                </div>
              </aside>

              <div className="min-h-0 flex flex-col bg-white/70">
                <div className="px-6 sm:px-8 py-5 border-b border-slate-200/70 bg-white/70">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-indigo-700" /> Live Edit Workspace
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Update title, curate members, and push changes in one run.</p>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
                  <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-5 shadow-sm">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Group Identity</label>
                    <input
                      type="text"
                      value={editingGroup.title}
                      onChange={e => setEditingGroup({ ...editingGroup, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-2xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Member Roster ({editingGroup.members.length})</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1">Live State</span>
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                          {[
                            { key: 'all', label: 'All' },
                            { key: 'leader', label: 'Leader' },
                            { key: 'member', label: 'Members' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setMemberViewFilter(opt.key as 'all' | 'leader' | 'member')}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                                memberViewFilter === opt.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {editingGroup.members.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">No members currently assigned.</div>
                    ) : visibleMembers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">No members match this filter.</div>
                    ) : (
                      <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {visibleMembers.map((member: any) => (
                          <li key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-sm truncate flex items-center gap-2">
                                {member.name}
                                {member.role === 'LEADER' && <span className="badge badge-amber text-[10px]">LEADER</span>}
                              </p>
                              <p className="text-xs font-semibold text-slate-500 truncate">{member.indexNumber}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="shrink-0 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-black inline-flex items-center gap-1.5 transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" /> Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">Add Member To Group</label>
                    <div className="flex flex-col lg:flex-row gap-3 relative">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="Search by IT number or name..."
                          value={userSearchText}
                          onChange={(e) => {
                            setUserSearchText(e.target.value);
                            setSelectedUserToAdd('');
                            setIsUserDropdownOpen(true);
                          }}
                          onFocus={() => setIsUserDropdownOpen(true)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-300 outline-none font-semibold text-slate-700 text-sm"
                        />

                        {isUserDropdownOpen && (
                          <ul className="absolute z-[120] w-full mt-2 bg-white border border-emerald-200 rounded-2xl max-h-56 overflow-y-auto shadow-xl">
                            {availableUsersToAdd
                              .filter(u => u.name.toLowerCase().includes(userSearchText.toLowerCase()) || (u.id || '').toLowerCase().includes(userSearchText.toLowerCase()))
                              .map(u => (
                                <li
                                  key={u.dbId}
                                  onClick={() => {
                                    setSelectedUserToAdd(u.dbId);
                                    setUserSearchText(`${u.id} - ${u.name}`);
                                    setIsUserDropdownOpen(false);
                                  }}
                                  className="p-3 hover:bg-emerald-50 cursor-pointer text-sm font-semibold text-slate-700 transition-colors border-b border-slate-100 last:border-0"
                                >
                                  <span className="text-slate-400 mr-2">{u.id}</span> {u.name}
                                </li>
                              ))}
                            {availableUsersToAdd.filter(u => u.name.toLowerCase().includes(userSearchText.toLowerCase()) || (u.id || '').toLowerCase().includes(userSearchText.toLowerCase())).length === 0 && (
                              <li className="p-3 text-sm text-slate-400 font-semibold">No unmatched students found.</li>
                            )}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={handleAddMember}
                        disabled={!selectedUserToAdd}
                        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-black inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                      >
                        <UserPlus className="w-4 h-4" /> Inject Member
                      </button>
                    </div>
                  </section>
                </div>

                <div className="px-6 sm:px-8 py-4 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="w-full sm:w-auto space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Changes are staged locally until you save.</p>
                    {(stagedAddedMembers.length > 0 || stagedRemovedMembers.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {stagedAddedMembers.slice(0, 4).map((m: any) => (
                          <span key={`add-${m.dbId}`} className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                            + {m.name}
                          </span>
                        ))}
                        {stagedRemovedMembers.slice(0, 4).map((m: any) => (
                          <span key={`remove-${m.dbId}`} className="px-2 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                            - {m.name}
                          </span>
                        ))}
                        {(stagedAddedMembers.length + stagedRemovedMembers.length) > 8 && (
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            +{stagedAddedMembers.length + stagedRemovedMembers.length - 8} more changes
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={closeEditModal}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl font-black text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditGroup}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 to-cyan-600 text-white font-black inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-700/30 hover:brightness-110 transition"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* End Modal */}


      <div className="page-header role-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title role-title">Group Command Center</h1>
          <p className="page-subtitle text-slate-500">Review approvals, inspect live groups, and edit memberships from one board.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Title or Module..." 
              className="role-focus-input bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm p-3 flex flex-wrap items-center gap-2">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'approvals', label: `Approvals (${pendingGroups.length})` },
          { key: 'registry', label: `Registry (${activeGroups.length})` },
          { key: 'rules', label: 'Platform Rules' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setBoardTab(tab.key as 'overview' | 'approvals' | 'registry' | 'rules')}
            className={`px-4 py-2.5 rounded-2xl text-sm font-black transition-colors ${
              boardTab === tab.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(boardTab === 'overview' || boardTab === 'approvals') && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-indigo-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Approvals</p>
            <p className="mt-1 text-3xl font-black text-amber-600">{pendingGroups.length}</p>
          </div>
          <div className="card p-5 border-indigo-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Groups</p>
            <p className="mt-1 text-3xl font-black text-emerald-600">{activeGroups.length}</p>
          </div>
          <div className="card p-5 border-indigo-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Visible</p>
            <p className="mt-1 text-3xl font-black text-indigo-700">{filteredGroups.length}</p>
          </div>
        </section>
      )}

      {boardTab === 'rules' && (
        <section className="card p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 rounded-xl"><Settings className="w-5 h-5 text-indigo-700" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Platform Rules</h2>
              <p className="text-xs font-semibold text-slate-500">Global auto-enrollment triggers and module team-size policies.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Active Semester (Global)</label>
                <select
                  value={activeSemester}
                  onChange={(e) => setActiveSemester(e.target.value)}
                  className="role-focus-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 appearance-none"
                >
                  <option>Year 3 - Semester 1</option>
                  <option>Year 3 - Semester 2</option>
                  <option>Year 4 - Semester 1</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                  <span>Max Group Size Limit</span> <span className="text-indigo-600">{maxGroupSize} Members</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={maxGroupSize}
                  onChange={(e) => setMaxGroupSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireManagerApproval}
                    onChange={(e) => setRequireManagerApproval(e.target.checked)}
                    className="mt-1 w-4 h-4 text-teal-600 rounded border-teal-300 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-sm font-black text-teal-900 block mb-0.5">Require Manager Approval for Groups</span>
                    <span className="text-xs font-semibold text-teal-700/75">If unchecked, groups will auto-activate without waiting for Admin authorization.</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={saveSettings}
                  disabled={savingRules}
                  className="role-btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-700/20 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {savingRules ? 'Saving...' : 'Save Rules'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Module-wise Team Size Limits</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Overrides the global limit for each module code. If a module has no override, the global limit is used.</p>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {modules.map((mod) => {
                  const currentValue = moduleGroupSizes[String(mod.code).toUpperCase()] ?? maxGroupSize;
                  return (
                    <div key={mod.id || mod.code} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{mod.code}</p>
                        <p className="text-xs font-semibold text-slate-500 truncate">{mod.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={currentValue}
                          onChange={(e) => setModuleGroupSizes((prev) => ({
                            ...prev,
                            [String(mod.code).toUpperCase()]: Math.max(2, Math.min(10, Number(e.target.value) || maxGroupSize))
                          }))}
                          className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Members</span>
                      </div>
                    </div>
                  );
                })}
                {modules.length === 0 && <span className="text-sm text-slate-500 font-semibold">No modules found.</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      {(boardTab === 'overview' || boardTab === 'approvals') && (
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Pending Requests ({pendingGroups.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedPendingIds(pendingGroups.map((group) => group.id));
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                {allPendingSelected ? 'Selected All' : 'Select All'}
              </button>
              <button
                onClick={() => handleBulkApprovalAction('Approved')}
                disabled={selectedPendingIds.length === 0}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Approve Selected ({selectedPendingIds.length})
              </button>
              <button
                onClick={() => handleBulkApprovalAction('Rejected')}
                disabled={selectedPendingIds.length === 0}
                className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                Reject Selected
              </button>
              <button
                onClick={() => setBoardTab('registry')}
                className="text-sm font-black text-indigo-700 hover:text-indigo-800"
              >
                Open registry
              </button>
            </div>
          </div>

          {pendingGroups.length > 0 ? pendingGroups.map((req) => (
            <div key={req.id} className={`card p-6 border-l-4 flex flex-col xl:flex-row gap-6 xl:items-center justify-between transition-all ${selectedPendingIds.includes(req.id) ? 'border-l-indigo-600 ring-2 ring-indigo-100 shadow-md' : 'border-l-amber-500'}`}>
              <div className="shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={selectedPendingIds.includes(req.id)}
                  onChange={(e) => {
                    setSelectedPendingIds((prev) => e.target.checked
                      ? [...prev, req.id]
                      : prev.filter((id) => id !== req.id));
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="badge badge-amber uppercase tracking-widest text-[10px] font-black">{req.status} Review</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{req.id}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1 truncate">{req.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-600" /> {req.membersCount} Members</span>
                  <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-indigo-700" /> {req.module}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 min-w-[220px]">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Group Leader</div>
                <div className="font-bold text-slate-900 truncate">{req.leader}</div>
                <div className="text-sm font-medium text-slate-500">Submitted {new Date(req.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0 xl:border-l border-slate-200 pt-2 xl:pt-0 xl:pl-6">
                <button 
                  onClick={() => handleApprovalAction(req.id, 'Approved')}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleApprovalAction(req.id, 'Rejected')}
                  className="flex-1 xl:flex-none role-btn-secondary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-14 bg-white rounded-3xl border border-slate-200 border-dashed">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-700">All Caught Up!</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">There are no pending group registration requests right now.</p>
            </div>
          )}
        </section>
      )}

      {(boardTab === 'overview' || boardTab === 'registry') && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <div key={group.id} className="card p-6 border-t-4 border-t-indigo-700 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
             <div className="flex justify-between items-start mb-4">
               <span className="badge badge-slate flex items-center gap-1.5"><Users className="w-3 h-3" /> {group.membersCount} Members</span>
               {group.status === 'Flagged' ? (
                  <span className="badge bg-red-100/50 text-red-600 border-red-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</span>
               ) : (
                  <span className="badge badge-green">Active</span>
               )}
             </div>
             
             <h3 className="text-xl font-black text-slate-900 mb-1">{group.title}</h3>
             <p className="text-xs font-bold uppercase tracking-widest text-emerald-900">{group.module}</p>
             
             <div className="my-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Group Leader</p>
                <p className="font-bold text-slate-700 text-sm">{group.leader}</p>
             </div>

             <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-100">
               <button onClick={() => openEditModal(group)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm">
                 <Edit className="w-4 h-4" /> Edit Details
               </button>
               <button onClick={() => deleteGroup(group.id)} className="bg-white border border-indigo-200 hover:bg-red-50 text-indigo-700 hover:text-red-600 px-4 py-2.5 rounded-xl transition-colors shrink-0" title="Delete Group">
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold">
            No groups found matching your search.
          </div>
        )}
      </div>
      )}
    </div>
  );
}
