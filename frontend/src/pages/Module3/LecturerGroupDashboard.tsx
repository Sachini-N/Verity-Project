import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, FileText, PieChart, Activity, Github, Users, AlertTriangle, ClipboardCheck, RefreshCw, ChevronRight, FolderCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export default function LecturerGroupDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const [pendingReviews, setPendingReviews] = useState(0);
  const [atRiskMembers, setAtRiskMembers] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const tabs = [
    { name: 'Intelligence Overview', path: `/lecturer/projects/${id}`, icon: LayoutDashboard, exact: true },
    { name: 'Members', path: `/lecturer/projects/${id}/members`, icon: Users, exact: false },
    { name: 'Weekly Reports', path: `/lecturer/projects/${id}/reports`, icon: FileText, exact: false },
    { name: 'Submission Review', path: `/lecturer/projects/${id}/submissions/review`, icon: FolderCheck, exact: false },
    { name: 'Fairness Analytics', path: `/lecturer/projects/${id}/fairness`, icon: PieChart, exact: false },
    { name: 'Engagement', path: `/lecturer/projects/${id}/engagement`, icon: Activity, exact: false },
    { name: 'GitHub Sync', path: `/lecturer/projects/${id}/github`, icon: Github, exact: false },
  ];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchSnapshot = async () => {
      try {
        const [reportsResult, fairnessResult] = await Promise.allSettled([
          fetch(`http://localhost:5000/api/report/list/${id}`),
          fetch(`http://localhost:5000/api/project/fairness/${id}`)
        ]);

        let nextPending = 0;
        let nextAtRisk = 0;

        if (reportsResult.status === 'fulfilled' && reportsResult.value.ok) {
          const reportsData = await reportsResult.value.json();
          if (reportsData?.success && Array.isArray(reportsData.reports)) {
            nextPending = reportsData.reports.filter((r: any) => String(r.status).toLowerCase() === 'pending').length;
          }
        }

        if (fairnessResult.status === 'fulfilled' && fairnessResult.value.ok) {
          const fairnessData = await fairnessResult.value.json();
          if (fairnessData?.success && Array.isArray(fairnessData.members)) {
            nextAtRisk = fairnessData.members.filter((m: any) => Number(m.score) < 60).length;
          }
        }

        if (!cancelled) {
          setPendingReviews(nextPending);
          setAtRiskMembers(nextAtRisk);
          setLastSyncAt(new Date());
        }
      } catch {
        if (!cancelled) setLastSyncAt(new Date());
      }
    };

    fetchSnapshot();
    const intervalId = setInterval(fetchSnapshot, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return '--';
    const diffMs = Date.now() - lastSyncAt.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  }, [lastSyncAt]);

  return (
    <div className="animate-fade-up space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/70 p-7 shadow-sm"
      >
        <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100 bg-white text-emerald-700">
                Group Intelligence
              </span>
              <span className="badge badge-sage text-[10px] py-0.5">Project #{id}</span>
              <span className="badge badge-green text-[10px] py-0.5">Healthy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">E-Commerce AI Agent</h1>
            <p className="text-slate-600 font-semibold mt-2">Lecturer command workspace for members, reports, fairness, engagement, and GitHub evidence.</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white/90 px-6 py-4 text-right">
            <p className="text-3xl font-black text-emerald-700">92/100</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Health Score</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        <div className="w-full xl:w-72 shrink-0 xl:sticky xl:top-24 z-30">
          <nav className="flex flex-col gap-2 p-3 bg-white/70 backdrop-blur-2xl border border-white shadow-[0_4px_18px_-6px_rgba(15,23,42,0.08)] rounded-[2rem]">
            {tabs.map((tab) => {
              const isActive = tab.exact
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path);

              const Icon = tab.icon;

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 text-sm font-bold ${
                    isActive
                      ? 'text-emerald-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="lecturer-active-vertical-tab"
                      className="absolute inset-0 bg-white border border-emerald-100 shadow-[0_4px_12px_-5px_rgba(16,185,129,0.22)] rounded-2xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {tab.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Group Snapshot</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Pending Reviews
                  </div>
                  <span className="text-sm font-black text-emerald-700">{pendingReviews}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    At-Risk Members
                  </div>
                  <span className="text-sm font-black text-rose-600">{atRiskMembers}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    Last Sync
                  </div>
                  <span className="text-xs font-black text-slate-700">{lastSyncLabel}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/70 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-3">Quick Actions</p>
              <div className="space-y-2">
                <Link
                  to={`/lecturer/projects/${id}/submissions/review`}
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  Open Submission Review
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </Link>
                <Link
                  to={`/lecturer/projects/${id}/reports`}
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  Open Weekly Reviews
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </Link>
                <Link
                  to={`/lecturer/projects/${id}/fairness`}
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  Check Fairness Alerts
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </Link>
                <Link
                  to={`/lecturer/projects/${id}/github`}
                  className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  Sync GitHub Data
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 w-full min-w-0"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
