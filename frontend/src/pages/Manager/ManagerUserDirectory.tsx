import { useState, useEffect } from 'react';
import { Search, UserX, UserCheck, ShieldAlert, Mail } from 'lucide-react';

export default function ManagerUserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState<'Student' | 'Lecturer' | 'Manager'>('Student');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/user/manager/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user => {
    const role = String(user.role || '').toLowerCase();
    const matchesRole = role === filterRole.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const roleCounts = users.reduce(
    (acc, user) => {
      const role = String(user.role || '').toLowerCase();
      if (role === 'student') acc.Student += 1;
      if (role === 'lecturer') acc.Lecturer += 1;
      if (role === 'manager') acc.Manager += 1;
      return acc;
    },
    { Student: 0, Lecturer: 0, Manager: 0 }
  );

  const toggleStatus = async (dbId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/manager/users/${dbId}/status`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => {
          if ((u.dbId || u.id) === dbId) {
            return { ...u, status: data.user.status };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-up max-w-7xl mx-auto space-y-8 px-6">
      <div className="page-header role-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title role-title">User Directory</h1>
          <p className="page-subtitle text-slate-500">Manage users by role category. Click a role card to view only relevant accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="role-focus-input bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold"
            />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'Student' as const, label: 'Students', count: roleCounts.Student, accent: 'from-indigo-600 to-blue-600', note: 'Learner accounts' },
          { key: 'Lecturer' as const, label: 'Lecturers', count: roleCounts.Lecturer, accent: 'from-amber-500 to-orange-500', note: 'Teaching accounts' },
          { key: 'Manager' as const, label: 'Managers', count: roleCounts.Manager, accent: 'from-emerald-500 to-teal-500', note: 'Admin accounts' },
        ].map((card) => {
          const active = filterRole === card.key;
          return (
            <button
              key={card.key}
              onClick={() => setFilterRole(card.key)}
              className={`text-left rounded-2xl border p-4 transition-all ${active ? 'border-indigo-300 bg-white shadow-md ring-2 ring-indigo-100' : 'border-slate-200 bg-white/90 hover:border-slate-300 hover:shadow-sm'}`}
            >
              <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${card.accent}`}>
                {card.label}
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 leading-none">{card.count}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{card.note}</p>
            </button>
          );
        })}
      </section>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">User Identity</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Role</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.dbId || user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-sm font-semibold text-slate-500 mt-0.5">{user.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Mail className="w-4 h-4 text-slate-400" /> {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${user.role === 'Lecturer' ? 'badge-amber' : user.role === 'Manager' ? 'badge-blue' : 'badge-sage'}`}>
                      {user.role} {user.role === 'Student' && `(${user.enrolled})`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.status === 'Active' ? (
                      <span className="badge badge-green font-black">Active</span>
                    ) : (
                      <span className="badge bg-red-100/50 text-red-600 border-red-200 font-black flex items-center gap-1 justify-center">
                        <ShieldAlert className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {user.status === 'Active' ? (
                       <button onClick={() => toggleStatus(user.dbId || user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Suspend User">
                         <UserX className="w-5 h-5" />
                       </button>
                    ) : (
                       <button onClick={() => toggleStatus(user.dbId || user.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Reactivate User">
                         <UserCheck className="w-5 h-5" />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">No {filterRole.toLowerCase()} users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
