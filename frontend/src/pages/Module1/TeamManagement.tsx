import { useState } from 'react';

export default function TeamManagement() {
  const [members] = useState([
    { id: 1, email: 'leader@student.com', role: 'Leader', functions: 'Project Management, Full Stack Development' },
    { id: 2, email: 'member@student.com', role: 'Member', functions: 'Frontend Development, UI/UX Design' },
    { id: 3, email: 'backend@student.com', role: 'Member', functions: 'Backend Development, Database Design' },
    { id: 4, email: 'qa@student.com', role: 'Member', functions: 'Quality Assurance, Testing' }
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/40 p-6 rounded-3xl shadow-sm border border-indigo-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Team Management</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">View your team members, roles, and assigned functions.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Member List */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-50/60 border-b border-indigo-100 text-xs text-slate-500 uppercase tracking-widest font-black">
              <th className="p-5">Member Email</th>
              <th className="p-5">Role</th>
              <th className="p-5">Functions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors last:border-none">
                <td className="p-5 text-slate-800 font-bold">{m.email}</td>
                <td className="p-5">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${m.role === 'Leader' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="p-5 text-slate-600 font-medium text-sm">
                  {m.functions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
