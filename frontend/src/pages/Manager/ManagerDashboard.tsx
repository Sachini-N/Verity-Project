import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BookOpen,
  CheckCircle2,
  Clock3,
  ArrowRight,
  Settings,
  Bell,
  ShieldCheck,
  Loader2,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  X,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  UserCircle2,
  CalendarDays,
} from 'lucide-react';

type GroupItem = {
  id: string;
  title: string;
  module: string;
  status: string;
  membersCount: number;
  createdAt?: string;
  leader?: string;
  leaderObj?: {
    name?: string;
    indexNumber?: string;
  };
};

type UserItem = {
  id: string;
  role: 'Student' | 'Lecturer' | 'Manager' | string;
  status: string;
};

type SystemSettings = {
  activeSemester?: string;
  maxGroupSize?: number;
  requireManagerApproval?: boolean;
};

type TimeRange = 'today' | '7d' | '30d';

type TrendPoint = {
  label: string;
  value: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const rangeConfig: Record<TimeRange, { label: string; days: number }> = {
  today: { label: 'Today', days: 1 },
  '7d': { label: '7 Days', days: 7 },
  '30d': { label: '30 Days', days: 30 },
};

function safeDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function trendMeta(current: number, prev: number) {
  const delta = current - prev;
  const deltaPct = prev <= 0 ? (current > 0 ? 100 : 0) : Math.round((delta / prev) * 100);
  return {
    delta,
    deltaPct,
    positive: delta >= 0,
  };
}

function buildSparklinePoints(items: GroupItem[], days: number): TrendPoint[] {
  const now = new Date();
  const labels: string[] = [];
  const counts = new Array(days).fill(0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * DAY_MS);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }

  items.forEach((g) => {
    const d = safeDate(g.createdAt);
    if (!d) return;
    const diff = Math.floor((now.getTime() - d.getTime()) / DAY_MS);
    if (diff < 0 || diff >= days) return;
    const idx = days - 1 - diff;
    counts[idx] += 1;
  });

  return labels.map((label, i) => ({ label, value: counts[i] }));
}

function toSparklinePath(points: TrendPoint[], width: number, height: number) {
  if (points.length === 0) return '';
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((p, idx) => {
      const x = idx * stepX;
      const y = height - (p.value / max) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

type SparklineCompareProps = {
  current: TrendPoint[];
  previous: TrendPoint[];
  lineColor: string;
};

function SparklineCompare({ current, previous, lineColor }: SparklineCompareProps) {
  const width = 210;
  const height = 44;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currentPath = useMemo(() => toSparklinePath(current, width, height), [current]);
  const previousPath = useMemo(() => toSparklinePath(previous, width, height), [previous]);

  const hoverPoint = hoverIndex !== null ? current[hoverIndex] : null;
  const hoverPrevPoint = hoverIndex !== null ? previous[hoverIndex] : null;

  const maxValue = useMemo(() => {
    const vals = [...current.map((p) => p.value), ...previous.map((p) => p.value)];
    return Math.max(...vals, 1);
  }, [current, previous]);

  const stepX = current.length > 1 ? width / (current.length - 1) : width;

  const handleMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (current.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const ratio = rect.width > 0 ? localX / rect.width : 0;
    const rawIndex = Math.round(ratio * (current.length - 1));
    const clamped = Math.max(0, Math.min(current.length - 1, rawIndex));
    setHoverIndex(clamped);
  };

  return (
    <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-11"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <path d={previousPath} fill="none" stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d={currentPath} fill="none" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" />
        {hoverIndex !== null && hoverPoint && (
          <>
            <line
              x1={hoverIndex * stepX}
              y1={0}
              x2={hoverIndex * stepX}
              y2={height}
              stroke="#64748b"
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverIndex * stepX}
              cy={height - (hoverPoint.value / maxValue) * height}
              r="2.8"
              fill={lineColor}
            />
          </>
        )}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400/70" /> Previous
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lineColor }} /> Current
        </span>
      </div>

      {hoverPoint && (
        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-900 flex items-center justify-between gap-2">
          <span>{hoverPoint.label}</span>
          <span className="text-slate-700">
            Prev: <span className="text-slate-900">{hoverPrevPoint?.value ?? 0}</span>
          </span>
          <span>
            Curr: <span>{hoverPoint.value}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({});

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [actionLoading, setActionLoading] = useState<'Approved' | 'Rejected' | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [groupsRes, usersRes, modulesRes, settingsRes] = await Promise.allSettled([
          fetch('http://localhost:5000/api/project/manager/groups'),
          fetch('http://localhost:5000/api/user/manager/users'),
          fetch('http://localhost:5000/api/academic/modules'),
          fetch('http://localhost:5000/api/system/settings'),
        ]);

        if (groupsRes.status === 'fulfilled') {
          const data = await groupsRes.value.json();
          if (data?.success && Array.isArray(data.groups)) setGroups(data.groups);
        }

        if (usersRes.status === 'fulfilled') {
          const data = await usersRes.value.json();
          if (data?.success && Array.isArray(data.users)) setUsers(data.users);
        }

        if (modulesRes.status === 'fulfilled') {
          const data = await modulesRes.value.json();
          if (Array.isArray(data)) setModules(data);
          else if (Array.isArray(data?.modules)) setModules(data.modules);
        }

        if (settingsRes.status === 'fulfilled') {
          const data = await settingsRes.value.json();
          if (data?.success && data?.settings) setSettings(data.settings);
        }
        setLastSyncedAt(new Date());
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const intervalId = setInterval(async () => {
      try {
        const [groupsRes, usersRes, modulesRes, settingsRes] = await Promise.allSettled([
          fetch('http://localhost:5000/api/project/manager/groups'),
          fetch('http://localhost:5000/api/user/manager/users'),
          fetch('http://localhost:5000/api/academic/modules'),
          fetch('http://localhost:5000/api/system/settings'),
        ]);

        if (groupsRes.status === 'fulfilled') {
          const data = await groupsRes.value.json();
          if (data?.success && Array.isArray(data.groups)) setGroups(data.groups);
        }
        if (usersRes.status === 'fulfilled') {
          const data = await usersRes.value.json();
          if (data?.success && Array.isArray(data.users)) setUsers(data.users);
        }
        if (modulesRes.status === 'fulfilled') {
          const data = await modulesRes.value.json();
          if (Array.isArray(data)) setModules(data);
          else if (Array.isArray(data?.modules)) setModules(data.modules);
        }
        if (settingsRes.status === 'fulfilled') {
          const data = await settingsRes.value.json();
          if (data?.success && data?.settings) setSettings(data.settings);
        }
        setLastSyncedAt(new Date());
      } catch {
        // Ignore silent auto-refresh failures.
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  const now = Date.now();
  const currentWindow = useMemo(() => {
    const days = rangeConfig[timeRange].days;
    const start = timeRange === 'today'
      ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : now - days * DAY_MS;
    const end = now;
    return { start, end };
  }, [now, timeRange]);

  const previousWindow = useMemo(() => {
    const days = rangeConfig[timeRange].days;
    const duration = days * DAY_MS;
    const end = currentWindow.start;
    const start = end - duration;
    return { start, end };
  }, [currentWindow.start, timeRange]);

  const groupsInCurrentWindow = useMemo(
    () => groups.filter((g) => {
      const d = safeDate(g.createdAt);
      if (!d) return false;
      const t = d.getTime();
      return t >= currentWindow.start && t <= currentWindow.end;
    }),
    [groups, currentWindow]
  );

  const groupsInPreviousWindow = useMemo(
    () => groups.filter((g) => {
      const d = safeDate(g.createdAt);
      if (!d) return false;
      const t = d.getTime();
      return t >= previousWindow.start && t <= previousWindow.end;
    }),
    [groups, previousWindow]
  );

  const scopedGroups = useMemo(
    () => (timeRange === '30d' ? groups : groupsInCurrentWindow),
    [groups, groupsInCurrentWindow, timeRange]
  );

  const metrics = useMemo(() => {
    const totalGroups = scopedGroups.length;
    const pendingGroups = scopedGroups.filter((g) => g.status === 'Pending').length;
    const activeGroups = scopedGroups.filter((g) => g.status === 'Active').length;
    const rejectedGroups = scopedGroups.filter((g) => g.status === 'Rejected').length;

    const totalUsers = users.length;
    const students = users.filter((u) => u.role === 'Student').length;
    const lecturers = users.filter((u) => u.role === 'Lecturer').length;
    const managers = users.filter((u) => u.role === 'Manager').length;

    const activeUsers = users.filter((u) => u.status === 'Active').length;
    const suspendedUsers = users.filter((u) => u.status !== 'Active').length;

    const avgMembersPerGroup = totalGroups ? Math.round((groups.reduce((acc, g) => acc + (g.membersCount || 0), 0) / totalGroups) * 10) / 10 : 0;

    return {
      totalGroups,
      pendingGroups,
      activeGroups,
      rejectedGroups,
      totalUsers,
      students,
      lecturers,
      managers,
      activeUsers,
      suspendedUsers,
      avgMembersPerGroup,
    };
  }, [scopedGroups, users]);

  const moduleDistribution = useMemo(() => {
    const map = new Map<string, number>();
    scopedGroups.forEach((g) => {
      const key = g.module || 'Unspecified';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [scopedGroups]);

  const pendingQueue = useMemo(
    () => scopedGroups.filter((g) => g.status === 'Pending').slice(0, 5),
    [scopedGroups]
  );

  const trends = useMemo(() => {
    const currentCreated = groupsInCurrentWindow.length;
    const previousCreated = groupsInPreviousWindow.length;

    const currentApproved = groupsInCurrentWindow.filter((g) => g.status === 'Active').length;
    const previousApproved = groupsInPreviousWindow.filter((g) => g.status === 'Active').length;

    const currentRejectedRate = currentCreated > 0
      ? Math.round((groupsInCurrentWindow.filter((g) => g.status === 'Rejected').length / currentCreated) * 100)
      : 0;
    const previousRejectedRate = previousCreated > 0
      ? Math.round((groupsInPreviousWindow.filter((g) => g.status === 'Rejected').length / previousCreated) * 100)
      : 0;

    return {
      created: { value: currentCreated, ...trendMeta(currentCreated, previousCreated) },
      approved: { value: currentApproved, ...trendMeta(currentApproved, previousApproved) },
      rejectedRate: {
        value: currentRejectedRate,
        ...trendMeta(previousRejectedRate, currentRejectedRate),
      },
    };
  }, [groupsInCurrentWindow, groupsInPreviousWindow]);

  const sparklineSeries = useMemo(() => {
    const days = rangeConfig[timeRange].days;
    const current = buildSparklinePoints(groupsInCurrentWindow, days);
    const previous = buildSparklinePoints(groupsInPreviousWindow, days);
    return { current, previous };
  }, [groupsInCurrentWindow, groupsInPreviousWindow, timeRange]);

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return 'Not synced yet';
    const diffMs = Date.now() - lastSyncedAt.getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  }, [lastSyncedAt]);

  const completionPercent = metrics.totalGroups
    ? Math.round((metrics.activeGroups / metrics.totalGroups) * 100)
    : 0;

  const handleApprovalAction = async (status: 'Approved' | 'Rejected') => {
    if (!selectedGroup) return;
    setActionLoading(status);
    try {
      const res = await fetch(`http://localhost:5000/api/project/manager/approvals/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update approval.');

      const nextStatus = status === 'Approved' ? 'Active' : 'Rejected';
      setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? { ...g, status: nextStatus } : g)));
      setActionMessage(`Group "${selectedGroup.title}" marked as ${nextStatus}.`);
      setSelectedGroup(null);
    } catch (e: any) {
      setActionMessage(e?.message || 'Unable to process approval action.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="animate-fade-up max-w-7xl mx-auto space-y-8 px-6 pb-12">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-blue-100 bg-gradient-to-br from-[#eef4ff] via-white to-[#ebfbf7] p-7 md:p-9 shadow-[0_14px_42px_-18px_rgba(30,64,175,0.25)]">
        <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 mb-3">
              <LayoutDashboard className="w-3.5 h-3.5" /> Manager Command Center
            </div>
            <h1 className="text-4xl md:text-[2.9rem] font-black tracking-tight text-slate-900 leading-tight">Manager Dashboard</h1>
            <p className="mt-2 text-sm md:text-base font-medium text-slate-600 max-w-2xl">
              Real-time governance across approvals, users, modules, and platform rules. Everything needed to run Verity operations from one cockpit.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
              {(Object.keys(rangeConfig) as TimeRange[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                    timeRange === key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {rangeConfig[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto sm:min-w-[340px]">
            <button
              onClick={() => setAutoRefresh((prev) => !prev)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm text-left"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Auto Refresh</p>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-black ${autoRefresh ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {autoRefresh ? 'Enabled' : 'Paused'}
                </span>
                {autoRefresh ? <PauseCircle className="w-4 h-4 text-emerald-600" /> : <PlayCircle className="w-4 h-4 text-slate-500" />}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Last sync: {lastSyncedLabel}
              </p>
            </button>
            <Link to="/manager/approvals" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 hover:bg-blue-50 transition-colors shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Queue</p>
              <p className="mt-1 text-2xl font-black text-blue-700">{metrics.pendingGroups}</p>
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Loading manager intelligence...</p>
        </div>
      ) : (
        <>
          {actionMessage && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-800 flex items-start justify-between gap-3">
              <span>{actionMessage}</span>
              <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'New Registrations',
                value: trends.created.value,
                meta: trends.created,
                tone: 'from-blue-600 to-indigo-600',
                lineColor: '#2563eb',
              },
              {
                label: 'Approved In Window',
                value: trends.approved.value,
                meta: trends.approved,
                tone: 'from-teal-500 to-cyan-600',
                lineColor: '#0d9488',
              },
              {
                label: 'Rejection Risk %',
                value: `${trends.rejectedRate.value}%`,
                meta: trends.rejectedRate,
                tone: 'from-amber-500 to-orange-600',
                lineColor: '#f59e0b',
              },
            ].map((item) => {
              return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white bg-gradient-to-br ${item.tone}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{item.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">{item.label}</p>
                <SparklineCompare current={sparklineSeries.current} previous={sparklineSeries.previous} lineColor={item.lineColor} />
                <div className={`inline-flex items-center gap-1 text-xs font-bold ${item.meta.positive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {item.meta.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {item.meta.delta >= 0 ? '+' : ''}{item.meta.delta} ({item.meta.deltaPct >= 0 ? '+' : ''}{item.meta.deltaPct}%) vs prev window
                </div>
              </div>
            );
            })}
          </section>

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Groups', value: metrics.totalGroups, icon: ClipboardCheck, tone: 'from-blue-600 to-blue-700' },
              { label: 'Pending', value: metrics.pendingGroups, icon: Clock3, tone: 'from-amber-500 to-orange-600' },
              { label: 'Active', value: metrics.activeGroups, icon: CheckCircle2, tone: 'from-teal-500 to-cyan-600' },
              { label: 'Users', value: metrics.totalUsers, icon: Users, tone: 'from-slate-700 to-slate-800' },
              { label: 'Modules', value: modules.length, icon: BookOpen, tone: 'from-indigo-500 to-indigo-700' },
              { label: 'Avg Members', value: metrics.avgMembersPerGroup, icon: Activity, tone: 'from-sky-500 to-blue-600' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br ${item.tone}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{item.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Approval Pipeline</h2>
                  <p className="text-sm text-slate-500 font-medium">Latest groups waiting for manager decisions.</p>
                </div>
                <Link to="/manager/approvals" className="text-xs font-black uppercase tracking-wider text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
                  Open Queue <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Activation Ratio</span>
                  <span className="text-sm font-black text-blue-700">{completionPercent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercent}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {pendingQueue.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <ShieldCheck className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No pending approvals right now.</p>
                  </div>
                ) : (
                  pendingQueue.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.module} • {item.membersCount} members</p>
                        {item.createdAt && (
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Submitted {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedGroup(item)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-1">User Control Matrix</h2>
              <p className="text-sm text-slate-500 font-medium mb-5">Role distribution and account health.</p>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'Students', value: metrics.students, color: 'bg-blue-500' },
                  { label: 'Lecturers', value: metrics.lecturers, color: 'bg-teal-500' },
                  { label: 'Managers', value: metrics.managers, color: 'bg-indigo-600' },
                ].map((row) => {
                  const pct = metrics.totalUsers ? Math.round((row.value / metrics.totalUsers) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                        <span>{row.label}</span>
                        <span>{row.value} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-center">
                  <p className="text-xl font-black text-emerald-700">{metrics.activeUsers}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700/80">Active Accounts</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-center">
                  <p className="text-xl font-black text-rose-700">{metrics.suspendedUsers}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-700/80">Suspended</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Module Workload Heat</h2>
                  <p className="text-sm text-slate-500 font-medium">Most active modules by group registrations.</p>
                </div>
                <Link to="/manager/modules" className="text-xs font-black uppercase tracking-wider text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
                  Manage Modules <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {moduleDistribution.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    No module-group workload data available yet.
                  </div>
                ) : (
                  moduleDistribution.map((mod, idx) => {
                    const max = Math.max(...moduleDistribution.map((m) => m.count), 1);
                    const width = Math.max(10, Math.round((mod.count / max) * 100));
                    return (
                      <div key={mod.name} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-bold text-slate-800 truncate pr-3">{mod.name}</p>
                          <p className="text-xs font-black text-slate-600">{mod.count} groups</p>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-1">Control Actions</h2>
              <p className="text-sm text-slate-500 font-medium mb-5">Fast admin operations.</p>

              <div className="space-y-2.5 mb-6">
                <Link to="/manager/users" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center justify-between">
                  User Directory <Users className="w-4 h-4 text-blue-600" />
                </Link>
                <Link to="/manager/groups" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center justify-between">
                  Group Overrides <ClipboardCheck className="w-4 h-4 text-blue-600" />
                </Link>
                <Link to="/manager/announcements" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center justify-between">
                  Announcements <Bell className="w-4 h-4 text-blue-600" />
                </Link>
                <Link to="/manager/usage" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center justify-between">
                  Usage Center <Activity className="w-4 h-4 text-blue-600" />
                </Link>
                <Link to="/manager/settings" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-colors inline-flex items-center justify-between">
                  Platform Settings <Settings className="w-4 h-4 text-blue-600" />
                </Link>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">System Policy</p>
                <div className="text-sm font-semibold text-slate-700 space-y-1.5">
                  <p>Require Approval: <span className="font-black text-blue-700">{settings.requireManagerApproval ? 'Enabled' : 'Disabled'}</span></p>
                  <p>Max Group Size: <span className="font-black text-blue-700">{settings.maxGroupSize ?? 'Not Set'}</span></p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {selectedGroup && (
        <div className="fixed inset-0 z-[110] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-blue-100 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Pending Approval</p>
                <h3 className="text-lg font-black mt-0.5">{selectedGroup.title}</h3>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Module</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedGroup.module}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Members</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedGroup.membersCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Group Leader</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 inline-flex items-center gap-1.5">
                    <UserCircle2 className="w-4 h-4 text-blue-600" />
                    {selectedGroup.leaderObj?.name || selectedGroup.leader || 'Not Available'}
                  </p>
                  {selectedGroup.leaderObj?.indexNumber && (
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedGroup.leaderObj.indexNumber}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Submitted Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 inline-flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    {selectedGroup.createdAt ? new Date(selectedGroup.createdAt).toLocaleString() : 'Not Available'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Decide whether to activate this group immediately or reject the registration.
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
                <button
                  onClick={() => handleApprovalAction('Rejected')}
                  disabled={actionLoading !== null}
                  className="rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
                >
                  {actionLoading === 'Rejected' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprovalAction('Approved')}
                  disabled={actionLoading !== null}
                  className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
                >
                  {actionLoading === 'Approved' ? 'Approving...' : 'Approve & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
