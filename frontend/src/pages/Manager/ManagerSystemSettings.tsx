import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function ManagerSystemSettings() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-8 px-6 pb-12">
      <div className="page-header role-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title role-title">System Configuration</h1>
          <p className="page-subtitle text-slate-500">Platform rules now live inside the Group Command Center to keep group policy in one place.</p>
        </div>
        <button onClick={() => navigate('/manager/groups')} className="role-btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-700/20 transition-all">
          <Settings className="w-4 h-4" /> Open Group Command Center
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="card p-6 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 rounded-xl"><Settings className="w-5 h-5 text-indigo-700" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Platform Rules Moved</h2>
              <p className="text-xs font-semibold text-slate-500">Use the Group Command Center for semester rules, approval policy, and module size overrides.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Single source of truth</h3>
              <p className="text-sm text-slate-600 font-medium max-w-2xl mt-1">The rules editor is now part of the group workflow so the people managing groups can also change the rules that control group behavior.</p>
            </div>
            <button onClick={() => navigate('/manager/groups')} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
              Go to Groups
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
