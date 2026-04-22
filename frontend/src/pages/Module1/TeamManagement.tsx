import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function TeamManagement() {
  const { id } = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/project/member-tracking/${id}`);
        if (response.data.success) {
          setMembers(response.data.members);
        }
      } catch (error) {
        console.error("Failed to fetch team members", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMembers();
  }, [id]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/40 p-6 rounded-3xl shadow-sm border border-indigo-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Team Management</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">View your team members, roles, and assigned functions.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">No team members found.</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-50/60 border-b border-indigo-100 text-xs text-slate-500 uppercase tracking-widest font-black">
              <th className="p-5">Member Email</th>
              <th className="p-5">Role</th>
              <th className="p-5">Functions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any, idx: number) => (
              <tr key={m.userId || idx} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors last:border-none">
                <td className="p-5 text-slate-800 font-bold">
                  {m.email}
                  <div className="text-xs font-medium text-slate-500 mt-0.5">{m.name}</div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${m.role === 'Team Leader' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="p-5 text-slate-600 font-medium text-sm">
                  {m.functions || 'Software Engineering'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
