import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Github, RefreshCw, GitBranch, X, Plus, Activity, Zap, ShieldCheck, ExternalLink, Binary } from 'lucide-react';

export default function GithubIntegration() {
  const { id } = useParams();
  const INITIAL_COMMITS_VISIBLE = 6;
  const isLecturerView = typeof window !== 'undefined' && window.location.pathname.includes('/lecturer');
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAllCommits, setShowAllCommits] = useState(false);
  
  const [repoData, setRepoData] = useState<any>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [stats, setStats] = useState({ additions: 0, deletions: 0, total: 0 });

  // Link Form State
  const [linkForm, setLinkForm] = useState({ owner: '', repoName: '', url: '' });

  const parseGithubUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!match) return null;
    return { owner: match[1], repoName: match[2].replace(/\.git$/i, '') };
  };

  const fetchRepoData = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`http://localhost:5000/api/github/repo/${id}`);
      if (resp.data.success && resp.data.linked) {
        setRepoData(resp.data.repo);
        setCommits(resp.data.commits || []);
        setImpacts(resp.data.impacts || []);
        setStats({
          additions: resp.data.totalAdditions || 0,
          deletions: resp.data.totalDeletions || 0,
          total: resp.data.totalCommitsCount || 0
        });
      } else {
        setRepoData(null);
        setCommits([]);
        setImpacts([]);
        setStats({ additions: 0, deletions: 0, total: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRepoData();
  }, [id]);

  const handleSync = async () => {
    if (!id) return;
    try {
      setSyncing(true);
      const resp = await axios.post(`http://localhost:5000/api/github/sync/${id}`);
      if (resp.data.success) {
        alert(`Sync complete: Fetched ${resp.data.syncedCommits} commits across ${resp.data.branchesFetched} branches.`);
        await fetchRepoData();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to sync. Make sure GITHUB_TOKEN is set in backend or you have API limits left.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkForm.url && !linkForm.url.startsWith('https://github.com')) {
      alert('Repo URL must start with https://github.com');
      return;
    }
    try {
      const resp = await axios.post('http://localhost:5000/api/github/link', {
        projectId: id,
        ...linkForm
      });
      if (resp.data.success) {
        setShowLinkModal(false);
        setLinkForm({ owner: '', repoName: '', url: '' });
        setLoading(true);
        try {
          setSyncing(true);
          const syncResp = await axios.post(`http://localhost:5000/api/github/sync/${id}`);
          if (syncResp.data.success) {
            alert(`Repository linked. Synced ${syncResp.data.syncedCommits} commits across ${syncResp.data.branchesFetched} branches.`);
          }
        } catch (syncErr) {
          console.error(syncErr);
          alert('Repository linked, but the first sync failed. Press “Sync Now” after checking GITHUB_TOKEN and rate limits.');
        } finally {
          setSyncing(false);
        }
        await fetchRepoData();
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to link repository. Ensure owner and repo name are correct.');
    }
  };

  const colorPalettes = isLecturerView
    ? [
        { color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        { color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700' },
        { color: 'from-lime-500 to-lime-600', bg: 'bg-lime-50', text: 'text-lime-700' },
        { color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
        { color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' },
      ]
    : [
        { color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
        { color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700' },
        { color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' },
        { color: 'from-sky-500 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-700' },
        { color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700' },
      ];

  const matchedContributors = impacts.filter((i) => i.isMatched).length;
  const avgImpact = impacts.length ? Math.round(impacts.reduce((acc, i) => acc + (i.percentage || 0), 0) / impacts.length) : 0;

  const statCards = isLecturerView
    ? [
        { label: 'Total Commits', value: stats.total.toLocaleString(), icon: GitBranch, tone: 'from-emerald-500 to-emerald-600' },
        { label: 'Matched Contributors', value: matchedContributors.toString(), icon: ShieldCheck, tone: 'from-teal-500 to-teal-600' },
        { label: 'Additions', value: stats.additions.toLocaleString(), icon: Zap, tone: 'from-cyan-500 to-cyan-600' },
        { label: 'Avg Impact', value: `${avgImpact}%`, icon: Activity, tone: 'from-lime-500 to-lime-600' },
      ]
    : [
        { label: 'Total Commits', value: stats.total.toLocaleString(), icon: GitBranch, tone: 'from-indigo-500 to-indigo-600' },
        { label: 'Matched Contributors', value: matchedContributors.toString(), icon: ShieldCheck, tone: 'from-teal-500 to-teal-600' },
        { label: 'Additions', value: stats.additions.toLocaleString(), icon: Zap, tone: 'from-sky-500 to-sky-600' },
        { label: 'Avg Impact', value: `${avgImpact}%`, icon: Activity, tone: 'from-amber-500 to-amber-600' },
      ];

  const visibleCommits = showAllCommits ? commits : commits.slice(0, INITIAL_COMMITS_VISIBLE);

  if (loading && !repoData) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-sm ${isLecturerView ? 'border-emerald-100 bg-emerald-50' : 'border-indigo-100 bg-indigo-50'}`}>
            <Loader2 className={`w-8 h-8 animate-spin ${isLecturerView ? 'text-emerald-600' : 'text-indigo-600'}`} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Booting Code Signals...</p>
        </div>
      </div>
    );
  }

  if (!repoData) {
    return (
      <div className={`max-w-5xl mx-auto rounded-[2rem] border bg-white shadow-sm overflow-hidden ${isLecturerView ? 'border-emerald-100' : 'border-indigo-100'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className={`relative p-10 text-white overflow-hidden ${isLecturerView ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500' : 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-500'}`}>
            <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-16 left-8 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/25 bg-white/15 mb-5">
                <Activity className="w-3.5 h-3.5" /> Code Repo Intelligence
              </div>
              <h2 className="text-4xl font-black leading-tight tracking-tight mb-3">No Repository Linked</h2>
              <p className={`text-sm leading-relaxed max-w-md ${isLecturerView ? 'text-emerald-100' : 'text-indigo-100'}`}>
                Connect your GitHub repository to unlock real-time commit signals, branch analytics, and contribution visibility for every teammate.
              </p>
            </div>
          </div>

          <div className="p-10 flex flex-col justify-between gap-8 bg-gradient-to-br from-white to-slate-50">
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Start The Signal Feed</h3>
              <p className="text-sm text-slate-500 font-medium">
                Add repository owner and name once. Verity will auto-sync commits and map contributions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border p-4 ${isLecturerView ? 'border-emerald-100 bg-emerald-50/70' : 'border-indigo-100 bg-indigo-50/70'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isLecturerView ? 'text-emerald-500' : 'text-indigo-500'}`}>Commits</p>
                <p className={`text-2xl font-black ${isLecturerView ? 'text-emerald-700' : 'text-indigo-700'}`}>Live</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-1">Impact</p>
                <p className="text-2xl font-black text-teal-700">Mapped</p>
              </div>
            </div>

            <button onClick={() => setShowLinkModal(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold py-3.5 px-6 shadow-lg transition-all ${isLecturerView ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}>
              <Plus className="w-4 h-4" /> Link GitHub Repository
            </button>
          </div>
        </div>

        {showLinkModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
            <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border ${isLecturerView ? 'border-emerald-100' : 'border-indigo-100'}`}>
              <div className={`px-6 py-4 flex justify-between items-center text-white ${isLecturerView ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-500'}`}>
                <h3 className="font-bold">Link Repository</h3>
                <button onClick={() => setShowLinkModal(false)}><X className={`w-5 h-5 ${isLecturerView ? 'hover:text-emerald-100' : 'hover:text-indigo-100'}`} /></button>
              </div>
              <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm-semibold text-slate-700 mb-1">Owner / Organization</label>
                  <input required value={linkForm.owner} onChange={e => setLinkForm({...linkForm, owner: e.target.value})} placeholder="e.g. facebook" className="glass-input" />
                </div>
                <div>
                  <label className="block text-sm-semibold text-slate-700 mb-1">Repository Name</label>
                  <input required value={linkForm.repoName} onChange={e => setLinkForm({...linkForm, repoName: e.target.value})} placeholder="e.g. react" className="glass-input" />
                </div>
                <div>
                  <label className="block text-sm-semibold text-slate-700 mb-1">Repo URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input 
                    value={linkForm.url} 
                    onChange={e => {
                      const val = e.target.value;
                      const parsed = parseGithubUrl(val);
                      if (parsed) {
                        setLinkForm({ ...linkForm, url: val, owner: parsed.owner, repoName: parsed.repoName });
                      } else {
                        setLinkForm({ ...linkForm, url: val });
                      }
                    }} 
                    placeholder="https://github.com/owner/repo" 
                    className={`glass-input ${linkForm.url && !linkForm.url.startsWith('https://github.com') ? 'border-red-400 focus:ring-red-100 ring-2 ring-transparent' : ''}`} 
                  />
                  {linkForm.url && !linkForm.url.startsWith('https://github.com') ? (
                    <p className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                      <X className="w-3 h-3" /> Repo URL must start with https://github.com
                    </p>
                  ) : (
                    <p className="text-slate-400 text-[10px] mt-1.5 font-medium">Pasting a URL will auto-fill the fields above.</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={linkForm.url ? !linkForm.url.startsWith('https://github.com') : false}
                  className="w-full btn-primary py-3 mt-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect Repository
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className={`relative overflow-hidden rounded-[2rem] border p-8 shadow-sm ${isLecturerView ? 'border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/45' : 'border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/45'}`}>
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl ${isLecturerView ? 'bg-emerald-200/35' : 'bg-indigo-200/35'}`} />
        <div className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-5">
            <div className={`w-14 h-14 rounded-2xl bg-white border shadow-sm flex items-center justify-center shrink-0 ${isLecturerView ? 'border-emerald-100 text-emerald-600' : 'border-indigo-100 text-indigo-600'}`}>
              <Github className="w-7 h-7" />
            </div>
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-white mb-2 ${isLecturerView ? 'border-emerald-100 text-emerald-600' : 'border-indigo-100 text-indigo-600'}`}>
                <Binary className="w-3.5 h-3.5" /> Repository Signal Deck
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">{repoData.owner} / {repoData.repoName}</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">A live intelligence board for commit velocity and contributor impact.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${isLecturerView ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'}`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing Repo...' : 'Sync Now'}
            </button>
            <a
              href={repoData.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" /> Open GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white bg-gradient-to-br ${item.tone} shadow-sm`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <GitBranch className={`w-5 h-5 ${isLecturerView ? 'text-emerald-600' : 'text-indigo-600'}`} /> Commit Signal Stream
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Showing {visibleCommits.length} of {commits.length} commits with author and hash context.
              </p>
            </div>
          </div>

          <div className="relative pl-6">
            <div className={`absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b via-slate-200 to-transparent ${isLecturerView ? 'from-emerald-200' : 'from-indigo-200'}`} />

            <div className="flex flex-col gap-3">
              {commits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
                  <p className="text-slate-500 font-medium">No commits found. Try syncing the repository.</p>
                </div>
              ) : (
                visibleCommits.map((c, idx) => {
                  const style = colorPalettes[idx % colorPalettes.length];
                  return (
                    <div
                      key={c.id}
                      className={`group relative rounded-2xl border bg-white p-4 transition-all duration-200 ${hoveredCommit === c.id ? (isLecturerView ? 'border-emerald-300 shadow-md shadow-emerald-100/60' : 'border-indigo-300 shadow-md shadow-indigo-100/60') : 'border-slate-200 hover:border-slate-300'}`}
                      onMouseEnter={() => setHoveredCommit(c.id)}
                      onMouseLeave={() => setHoveredCommit(null)}
                    >
                      <div className={`absolute left-[-26px] top-6 h-4 w-4 rounded-full border-4 border-white ${style.bg}`} />

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className={`truncate text-[15px] font-bold text-slate-900 transition-colors ${isLecturerView ? 'group-hover:text-emerald-600' : 'group-hover:text-indigo-600'}`}>
                            {c.message.split('\n')[0]}
                          </h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.bg} ${style.text}`}>
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px] font-black">
                                {c.authorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                              {c.authorName}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 font-mono">
                              {c.commitHash.substring(0, 7)}
                            </span>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-bold text-slate-400">
                          {new Date(c.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {commits.length > INITIAL_COMMITS_VISIBLE && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllCommits((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${isLecturerView ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                >
                  {showAllCommits ? 'Show Less' : `View More (${commits.length - INITIAL_COMMITS_VISIBLE})`}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-400 mb-4">Code Throughput</h3>
            <div className="space-y-4">
              {[
                { label: 'Additions', value: stats.additions, color: 'bg-teal-500', text: 'text-teal-700' },
                { label: 'Deletions', value: stats.deletions, color: 'bg-amber-500', text: 'text-amber-700' },
                { label: 'Total Commits', value: stats.total, color: isLecturerView ? 'bg-emerald-500' : 'bg-indigo-500', text: isLecturerView ? 'text-emerald-700' : 'text-indigo-700' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                    <span className={`text-sm font-black ${m.text}`}>{m.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${m.color} rounded-full transition-all duration-700`}
                      style={{ width: `${m.label === 'Additions' ? Math.min(100, stats.additions / 50) : m.label === 'Deletions' ? Math.min(100, stats.deletions / 50) : Math.min(100, stats.total * 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Contributor Impact Map</h3>
            </div>

            <div className="space-y-5">
              {impacts.length === 0 ? (
                <p className="py-4 text-center text-sm font-medium text-slate-500">No impact data available yet.</p>
              ) : (
                impacts.map((impact, i) => {
                  const style = colorPalettes[i % colorPalettes.length];
                  return (
                    <div key={i} className="group">
                      <div className="mb-2 flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${impact.isMatched ? 'text-slate-900' : 'text-slate-500 italic'}`}>
                            {impact.name}
                          </span>
                          {impact.isMatched && <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />}
                        </div>
                        <span className="text-xs font-black text-slate-400">{impact.percentage}%</span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${style.color} transition-all duration-1000`} style={{ width: `${impact.percentage}%` }} />
                      </div>

                      <div className="mt-1.5 flex justify-between px-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">+{impact.additions}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">-{impact.deletions}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
