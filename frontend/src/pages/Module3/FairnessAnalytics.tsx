import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, GitCommit, Clock, Loader2, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const API = 'http://localhost:5000/api/project';

interface FairnessMember {
  userId: string;
  name: string;
  role: 'Leader' | 'Member';
  score: number;
  taskRate: number;
  gitRate: number;
  timeSync: number;
  githubProfileLinked?: boolean;
  metrics: {
    assignedTasks: number;
    doneTasks: number;
    gitCommits: number;
    weeklyReports: number;
  };
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  const text = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';


  return (
    <div className="relative w-32 h-32 mx-auto my-4">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black ${text} tabular-nums`}>{score}</span>
        <span className="text-xs font-semibold text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value}%`, transition: 'width 1s ease' }}
      />
    </div>
  );
}

export default function FairnessAnalytics() {
  const { id } = useParams();
  const location = useLocation();
  const isLecturer = location.pathname.includes('/lecturer');
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState('Project');
  const [members, setMembers] = useState<FairnessMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [githubMeta, setGithubMeta] = useState<{
    linked: boolean;
    commitsSynced: number;
    usedContributorStatsApi: boolean;
  } | null>(null);
  const [membersMissingGithub, setMembersMissingGithub] = useState<{ userId: string; name: string }[]>([]);

  const teamAvg = useMemo(() => {
    if (members.length === 0) return 0;
    return Math.round(members.reduce((s, m) => s + m.score, 0) / members.length);
  }, [members]);

  const flagged = useMemo(() => members.filter((m) => m.score < 60), [members]);

  const showGitHubSyncHint = useMemo(() => {
    if (!githubMeta?.linked) return false;
    return githubMeta.commitsSynced === 0;
  }, [githubMeta]);

  const showGitHubProfileHint = useMemo(() => {
    if (!githubMeta?.linked || githubMeta.commitsSynced === 0) return false;
    if (githubMeta.usedContributorStatsApi) return false;
    if (members.length === 0) return false;
    return members.every((m) => m.metrics.gitCommits === 0);
  }, [githubMeta, members]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/fairness/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load fairness analytics');
        }
        if (cancelled) return;
        setMembers(data.members || []);
        setProjectTitle(data.project?.title || 'Project');
        setMembersMissingGithub(Array.isArray(data.membersMissingGithub) ? data.membersMissingGithub : []);
        setGithubMeta(data.github ? {
          linked: Boolean(data.github.linked),
          commitsSynced: data.github.commitsSynced ?? 0,
          usedContributorStatsApi: Boolean(data.github.usedContributorStatsApi)
        } : null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || 'Failed to load fairness analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="animate-fade-up space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.9rem] border border-emerald-100 bg-gradient-to-br from-white via-[#f7fcfa] to-[#edf9f4] p-6 md:p-7 shadow-sm"
      >
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                {isLecturer ? 'Lecturer View' : 'Student Portal'}
              </span>
              <span className="text-slate-400 text-sm font-semibold">{projectTitle}</span>
            </div>
            <h1 className="text-4xl md:text-[2.7rem] font-black tracking-tight text-slate-900">Contribution Fairness</h1>
            <p className="text-slate-600 font-medium text-lg mt-2 max-w-4xl">
              Signal-driven fairness view combining task completion, synced GitHub activity, and weekly reporting consistency.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center min-w-[120px]">
              <div className="text-3xl font-black text-emerald-700">{teamAvg}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Team Average</div>
            </div>
            <div className={`rounded-2xl border px-6 py-5 text-center min-w-[120px] ${flagged.length > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className={`text-3xl font-black ${flagged.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{flagged.length}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Flagged</div>
            </div>
          </div>
        </div>
      </motion.section>

      {!loading && showGitHubSyncHint && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 font-semibold">
          GitHub is linked but no commits are stored yet. Open <strong>GitHub Sync</strong> for this project and run <strong>Sync Now</strong> so fairness can use commit data.
        </div>
      )}

      {!loading && showGitHubProfileHint && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <span className="font-bold text-slate-800">Git commit scores are empty.</span>{' '}
          Ensure each student’s Verity profile has their <strong>GitHub profile URL</strong> (e.g. <code className="text-xs bg-slate-50 px-1 rounded border">https://github.com/alexsmith</code>) so commits map to the right person.
          For best accuracy, set <strong>GITHUB_TOKEN</strong> on the server so GitHub contributor stats can be used.
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Calculating fairness analytics...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            No members or activity data found for this project yet.
          </p>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {members.map((m, idx) => {
            const isLow = m.score < 60;
            const isMid = m.score >= 60 && m.score < 80;
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 14, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.58, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={`relative overflow-hidden rounded-[1.5rem] border bg-white p-6 shadow-sm ${isLow ? 'border-red-200' : isMid ? 'border-amber-200' : 'border-emerald-200'}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isLow ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                <div className="flex items-center justify-between mb-2 pl-1">
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 leading-tight">{m.name}</h4>
                    <span className={`badge ${m.role === 'Leader' ? 'badge-sage' : 'badge-slate'} mt-1`}>{m.role}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge ${isLow ? 'badge-red' : isMid ? 'badge-amber' : 'badge-green'}`}>
                      {isLow ? 'At Risk' : isMid ? 'Average' : 'Strong'}
                    </span>
                    {isLecturer && m.githubProfileLinked === false && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        No GitHub URL
                      </span>
                    )}
                  </div>
                </div>

                <ScoreRing score={m.score} />

                <div className="space-y-4 mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {[
                    { label: 'Task Completion', val: m.taskRate, icon: CheckCircle, color: 'bg-emerald-500' },
                    { label: 'Git Commits', val: m.gitRate, icon: GitCommit, color: 'bg-emerald-500' },
                    { label: 'Time Consistency', val: m.timeSync, icon: Clock, color: 'bg-teal-500' },
                  ].map(row => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            {row.label}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{row.val}%</span>
                        </div>
                        <Bar value={row.val} color={row.color} />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <div className="bg-slate-50 rounded-lg border border-slate-100 px-2 py-1.5">
                    Tasks {m.metrics.doneTasks}/{m.metrics.assignedTasks}
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 px-2 py-1.5">
                    Commits {m.metrics.gitCommits}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && !error && flagged.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-red-100 border border-red-200 rounded-xl mt-0.5">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-base mb-1">Automated Fairness Finding</h3>
              <p className="text-sm text-red-700 leading-relaxed">
                The system has detected a significant contribution imbalance for{' '}
                {flagged.map(m => <strong key={m.name}>{m.name}</strong>).reduce((prev, curr) => <>{prev}, {curr}</>)}.
                {' '}Their task completion and participation rates are critically below the group baseline.
                A formal review by the assigned lecturer is recommended.
              </p>
              <div className="flex gap-3 mt-4">
                <button className="btn-danger text-sm py-2 px-4">Issue Formal Warning</button>
                <button className="btn-secondary text-sm py-2 px-4">Schedule Meeting</button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
