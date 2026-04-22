import { useState } from 'react';

const members = [
  { name: 'John Doe', role: 'Leader', avatar: 'JD', color: 'from-emerald-600 to-teal-700',
    tasks: { completed: 18, total: 18, rate: 100 }, commits: { count: 142, additions: 2100, deletions: 340 },
    hours: { logged: 58, target: 60 }, reports: { submitted: 3, reviewed: 3 }, score: 92, trend: '+4%' },
  { name: 'Alex Smith', role: 'Member', avatar: 'AS', color: 'from-red-500 to-orange-600',
    tasks: { completed: 4, total: 10, rate: 40 }, commits: { count: 12, additions: 180, deletions: 30 },
    hours: { logged: 14, target: 40 }, reports: { submitted: 1, reviewed: 1 }, score: 45, trend: '-12%' },
  { name: 'Maria Garcia', role: 'Member', avatar: 'MG', color: 'from-emerald-600 to-teal-700',
    tasks: { completed: 17, total: 18, rate: 94 }, commits: { count: 98, additions: 1450, deletions: 210 },
    hours: { logged: 52, target: 40 }, reports: { submitted: 3, reviewed: 3 }, score: 88, trend: '+8%' },
];

const metrics = [
  { key: 'score', label: 'AI Score', icon: '🤖', format: (m: any) => `${m.score}`, color: (v: any) => v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400' },
  { key: 'tasks', label: 'Task Rate', icon: '✅', format: (m: any) => `${m.tasks.rate}%`, color: (v: any) => v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-red-400' },
  { key: 'commits', label: 'Commits', icon: '🔀', format: (m: any) => `${m.commits.count}`, color: (v: any) => v >= 80 ? 'text-teal-400' : v >= 30 ? 'text-emerald-400' : 'text-red-400' },
  { key: 'hours', label: 'Hours Logged', icon: '⏱️', format: (m: any) => `${m.hours.logged}h`, color: (v: any) => v >= 40 ? 'text-emerald-400' : v >= 20 ? 'text-amber-400' : 'text-red-400' },
  { key: 'reports', label: 'Reports', icon: '📄', format: (m: any) => `${m.reports.submitted}/${m.reports.reviewed}`, color: (v: any) => v >= 3 ? 'text-emerald-400' : v >= 2 ? 'text-amber-400' : 'text-red-400' },
  { key: 'trend', label: 'Trend', icon: '📈', format: (m: any) => m.trend, color: (_: any, raw: any) => String(raw).startsWith('+') ? 'text-emerald-400' : 'text-red-400' },
];

type SortKey = 'score' | 'tasks' | 'commits' | 'hours';

export default function ContributionTable() {
  const [sortKey, setSortKey] = useState<SortKey>('score');


  const sorted = [...members].sort((a, b) => {
    if (sortKey === 'score') return b.score - a.score;
    if (sortKey === 'tasks') return b.tasks.rate - a.tasks.rate;
    if (sortKey === 'commits') return b.commits.count - a.commits.count;
    if (sortKey === 'hours') return b.hours.logged - a.hours.logged;
    return 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="glass-panel p-8 border-l-4 border-l-emerald-500 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">📊</div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Contribution Comparison</h2>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Side-by-side team member analytics</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['score', 'tasks', 'commits', 'hours'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
                sortKey === k
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-inner'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              Sort: {k}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Metric</th>
                {sorted.map(m => (
                  <th key={m.name} className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-sm font-black text-white shadow-lg`}>
                        {m.avatar}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm whitespace-nowrap">{m.name}</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          m.role === 'Leader' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>{m.role}</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => (
                <tr
                  key={metric.key}
                  className={`border-b border-white/5 transition-colors ${idx % 2 === 0 ? 'bg-white/2' : ''} hover:bg-white/5 cursor-pointer`}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{metric.icon}</span>
                      <span className="text-sm font-black text-slate-300 uppercase tracking-widest">{metric.label}</span>
                    </div>
                  </td>
                  {sorted.map(m => {
                    const raw = metric.key === 'score' ? m.score
                      : metric.key === 'tasks' ? m.tasks.rate
                      : metric.key === 'commits' ? m.commits.count
                      : metric.key === 'hours' ? m.hours.logged
                      : metric.key === 'reports' ? m.reports.submitted
                      : m.trend;
                    return (
                      <td key={m.name} className="p-6 text-center">
                        <span className={`text-xl font-black ${metric.color(raw, raw)} drop-shadow-sm`}>
                          {metric.format(m)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Bar Chart Row */}
              <tr className="border-b border-white/5">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Score Bar</span>
                  </div>
                </td>
                {sorted.map(m => (
                  <td key={m.name} className="p-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${m.color} transition-all duration-1000 shadow-lg`}
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-500">{m.score}/100</span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Alert */}
      {sorted.some(m => m.score < 50) && (
        <div className="glass-panel p-6 bg-red-950/10 border border-red-500/20 flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xl shrink-0">🚨</div>
          <div>
            <p className="font-black text-red-400">Low Contribution Alert</p>
            <p className="text-sm font-bold text-red-200/70 mt-0.5">
              {sorted.filter(m => m.score < 50).map(m => m.name).join(', ')} — contribution score is critically below the team average. Review recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
