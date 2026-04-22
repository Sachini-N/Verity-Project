import { useParams, useNavigate } from 'react-router-dom';

const fileVersions = {
  'Database Schema.sql': [
    { version: 3, uploadedBy: 'Alex Smith', avatar: 'AS', date: 'Oct 15, 2:30 PM', size: '2.4 MB', changes: 'Added user_roles and project_members tables. Normalized foreign keys.', type: 'sql', tag: 'Latest' },
    { version: 2, uploadedBy: 'John Doe', avatar: 'JD', date: 'Oct 10, 11:00 AM', size: '2.1 MB', changes: 'Added sessions and audit_logs tables.', type: 'sql', tag: null },
    { version: 1, uploadedBy: 'Alex Smith', avatar: 'AS', date: 'Oct 5, 4:45 PM', size: '1.8 MB', changes: 'Initial schema with users and projects tables.', type: 'sql', tag: 'Initial' },
  ],
  'Frontend_Architecture.pdf': [
    { version: 1, uploadedBy: 'John Doe', avatar: 'JD', date: 'Oct 14, 10:15 AM', size: '1.1 MB', changes: 'Initial architecture document.', type: 'pdf', tag: 'Latest' },
  ],
  'API_Documentation.docx': [
    { version: 5, uploadedBy: 'Maria Garcia', avatar: 'MG', date: 'Oct 12, 4:45 PM', size: '540 KB', changes: 'Added WebSocket endpoints and error codes.', type: 'doc', tag: 'Latest' },
    { version: 4, uploadedBy: 'John Doe', avatar: 'JD', date: 'Oct 8, 9:30 AM', size: '510 KB', changes: 'Documented auth and user endpoints.', type: 'doc', tag: null },
    { version: 3, uploadedBy: 'Maria Garcia', avatar: 'MG', date: 'Oct 4, 2:00 PM', size: '480 KB', changes: 'Draft structure and route mapping.', type: 'doc', tag: null },
    { version: 2, uploadedBy: 'John Doe', avatar: 'JD', date: 'Sep 30, 10:00 AM', size: '400 KB', changes: 'Added initial endpoint descriptions.', type: 'doc', tag: null },
    { version: 1, uploadedBy: 'Maria Garcia', avatar: 'MG', date: 'Sep 25, 8:00 AM', size: '200 KB', changes: 'Initial API documentation scaffold.', type: 'doc', tag: 'Initial' },
  ],
};

const typeColor: Record<string, string> = {
  pdf: 'bg-red-500/20 text-red-400 border-red-500/30',
  sql: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  doc: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

const avatarColor: Record<string, string> = {
  JD: 'from-emerald-600 to-teal-700',
  AS: 'from-red-500 to-orange-600',
  MG: 'from-emerald-600 to-teal-700',
};

export default function VersionHistory() {
  const { id, filename } = useParams();
  const navigate = useNavigate();

  const decodedFile = filename ? decodeURIComponent(filename) : Object.keys(fileVersions)[0];
  const versions = fileVersions[decodedFile as keyof typeof fileVersions] || fileVersions['Database Schema.sql'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-8 border-l-4 border-l-teal-500 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-2xl shadow-inner">📁</div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Version History</h2>
            <p className="text-xs font-black text-teal-400 font-mono mt-1 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-lg inline-block truncate max-w-[300px]">
              {decodedFile}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/60 px-6 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black text-white">{versions.length}</span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Versions</span>
          </div>
          <button onClick={() => navigate(-1)} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-xl transition-colors">
            ← Back
          </button>
        </div>
      </div>

      {/* File Selector */}
      <div className="flex gap-3 flex-wrap">
        {Object.keys(fileVersions).map(fname => (
          <button
            key={fname}
            onClick={() => navigate(`/projects/${id}/files/${encodeURIComponent(fname)}/history`)}
            className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all truncate max-w-[200px] ${
              fname === decodedFile
                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            {fname}
          </button>
        ))}
      </div>

      {/* Version Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-emerald-500 to-transparent ml-0.5" />

        <div className="space-y-6">
          {versions.map((ver, idx) => (
            <div key={ver.version} className="relative flex gap-8 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Dot */}
              <div className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 font-black text-sm shadow-lg ${
                idx === 0 ? 'border-teal-500 bg-teal-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'border-slate-600 bg-slate-800 text-slate-400'
              }`}>
                {ver.version}
              </div>

              {/* Card */}
              <div className={`flex-1 glass-panel p-6 hover:border-teal-500/30 transition-all ${idx === 0 ? 'border-teal-500/20 bg-teal-950/10' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor[ver.avatar]} flex items-center justify-center text-xs font-black text-white shadow-lg`}>
                      {ver.avatar}
                    </div>
                    <div>
                      <p className="font-black text-white">{ver.uploadedBy}</p>
                      <p className="text-xs font-bold text-slate-400">{ver.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ver.tag && (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        ver.tag === 'Latest' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}>
                        {ver.tag}
                      </span>
                    )}
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${typeColor[ver.type]}`}>
                      v{ver.version}.0 · {ver.size}
                    </span>
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Changes</span>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">{ver.changes}</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="px-4 py-2 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors">
                    Download
                  </button>
                  {idx !== 0 && (
                    <button className="px-4 py-2 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors">
                      Restore this Version
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
