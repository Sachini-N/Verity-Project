import { useState } from 'react';
import { useParams } from 'react-router-dom';

const branches = [
  {
    name: 'main', status: 'Protected', commits: 52, lastActivity: '2 hrs ago', author: 'John Doe', avatar: 'JD', color: 'from-emerald-600 to-teal-700',
    recentCommits: [
      { id: 'a1b2c3', msg: 'Merge PR #42 — Final glassmorphic UI', time: '2 hrs ago', additions: 280, deletions: 40 },
      { id: 'd4e5f6', msg: 'Hotfix: auth token refresh loop', time: '1 day ago', additions: 12, deletions: 8 },
    ]
  },
  {
    name: 'feature/ui-update', status: 'Active', commits: 24, lastActivity: '5 hrs ago', author: 'Maria Garcia', avatar: 'MG', color: 'from-emerald-600 to-teal-700',
    recentCommits: [
      { id: 'g7h8i9', msg: 'Implemented Kanban board animations', time: '5 hrs ago', additions: 540, deletions: 120 },
      { id: 'j1k2l3', msg: 'Added glassmorphic card component', time: '2 days ago', additions: 200, deletions: 30 },
    ]
  },
  {
    name: 'feature/analytics', status: 'Active', commits: 18, lastActivity: '1 day ago', author: 'John Doe', avatar: 'JD', color: 'from-emerald-500 to-pink-600',
    recentCommits: [
      { id: 'm4n5o6', msg: 'Added fairness calculation algorithm', time: '1 day ago', additions: 380, deletions: 60 },
    ]
  },
  {
    name: 'fix/db-connection', status: 'Stale', commits: 5, lastActivity: '5 days ago', author: 'Alex Smith', avatar: 'AS', color: 'from-red-500 to-orange-600',
    recentCommits: [
      { id: 'p7q8r9', msg: 'Attempt to fix Prisma connection timeout', time: '5 days ago', additions: 44, deletions: 12 },
    ]
  },
];

const statusStyle: Record<string, string> = {
  'Protected': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Stale': 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
};

export default function BranchActivity() {
  const { id } = useParams();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBranch = branches.find(b => b.name === selected);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-8 border-l-4 border-l-emerald-500 flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">🌿</div>
        <div className="flex-1">
          <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Branch Activity</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Repository branch health — Project #{id}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-2xl text-center">
            <span className="block text-2xl font-black text-emerald-400">{branches.length}</span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-300/60 mt-1">Branches</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 px-6 py-3 rounded-2xl text-center">
            <span className="block text-2xl font-black text-red-400">{branches.filter(b => b.status === 'Stale').length}</span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-red-300/60 mt-1">Stale</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Branch List */}
        <div className="xl:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">All Branches</h3>
          {branches.map(branch => (
            <button
              key={branch.name}
              onClick={() => setSelected(branch.name === selected ? null : branch.name)}
              className={`w-full text-left glass-panel p-5 transition-all ${selected === branch.name ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${branch.color} flex items-center justify-center text-sm font-black text-white shadow-lg shrink-0`}>
                  {branch.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm font-mono truncate">{branch.name}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{branch.lastActivity}</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${statusStyle[branch.status]}`}>
                  {branch.status}
                </span>
              </div>
              <div className="mt-4 flex gap-4 text-xs font-bold text-slate-500">
                <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">{branch.commits} commits</span>
                <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">By {branch.author.split(' ')[0]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Branch Detail */}
        <div className="xl:col-span-2">
          {selectedBranch ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className={`glass-panel p-8 bg-gradient-to-r from-slate-900/60 to-slate-800/10 border-l-4 border-l-teal-500`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedBranch.color} flex items-center justify-center text-base font-black text-white shadow-lg`}>
                    {selectedBranch.avatar}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white font-mono">{selectedBranch.name}</h3>
                    <p className="text-sm font-bold text-slate-400">{selectedBranch.author} · {selectedBranch.lastActivity}</p>
                  </div>
                  <span className={`ml-auto text-xs font-black uppercase tracked-widest px-4 py-1.5 rounded-xl border ${statusStyle[selectedBranch.status]}`}>
                    {selectedBranch.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[['Total Commits', selectedBranch.commits, '🔀'], ['Status', selectedBranch.status, '📡'], ['Last Push', selectedBranch.lastActivity, '⏱️']].map(([label, val, icon]) => (
                    <div key={String(label)} className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-xl block mb-1">{icon}</span>
                      <p className="text-lg font-black text-white">{val}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-8">
                <h4 className="text-lg font-black text-white mb-6 border-b border-white/10 pb-4">Recent Commits on this Branch</h4>
                <div className="space-y-4">
                  {selectedBranch.recentCommits.map((commit, i) => (
                    <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-black/40 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-black text-white group-hover:text-emerald-400 transition-colors">{commit.msg}</h5>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest shrink-0 ml-4">{commit.time}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-mono text-xs text-slate-400 bg-black/40 px-3 py-1 rounded-lg border border-white/5">{commit.id}</span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">+{commit.additions}</span>
                        <span className="text-xs font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">-{commit.deletions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel h-full flex flex-col items-center justify-center p-16 text-center border-dashed">
              <span className="text-5xl mb-4">🌿</span>
              <h4 className="text-xl font-black text-white mb-2">Select a Branch</h4>
              <p className="text-sm font-bold text-slate-500">Click any branch on the left to view its recent commit history and health details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
