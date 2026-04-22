import { useEffect, useMemo, useState } from 'react';
import { Activity, Cloud, RefreshCw, Server, ShieldAlert, Wifi, Clock3, ArrowUpRight } from 'lucide-react';

type MetricsResponse = {
  generatedAt?: string;
  system?: {
    uptimeSeconds?: number;
    platform?: string;
    nodeVersion?: string;
    memory?: {
      usedMb?: number;
      totalMb?: number;
      freeMb?: number;
    };
  };
  settings?: Record<string, any>;
  counts?: {
    users?: number;
    activeUsers?: number;
    roleCounts?: Record<string, number>;
    semesters?: number;
    modules?: number;
    projects?: number;
    projectStatusCounts?: Record<string, number>;
    assignments?: number;
    notifications?: number;
    notificationReadCounts?: Record<string, number>;
    storageFootprint?: {
      trackedSubmissions?: number;
      assignmentFiles?: number;
      projectFiles?: number;
      configuredQuotaMb?: number | null;
      configuredWarningMb?: number | null;
    };
  };
  usage?: {
    totalRequests?: number;
    requestsLast15Minutes?: number;
    requestsLastHour?: number;
    requestsLast24Hours?: number;
    errorCountLast24Hours?: number;
    errorRateLast24Hours?: number;
    averageDurationMs?: number;
    slowRequests?: number;
    statusCounts?: Record<string, number>;
    topRoutes?: Array<{ route: string; count: number }>;
    recentRequests?: Array<{ method: string; path: string; statusCode: number; durationMs: number; timestamp: string }>;
    trend24h?: Array<{ label: string; value: number }>;
    trend15m?: Array<{ label: string; value: number }>;
  };
  integrations?: Record<string, {
    name: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    unit: string;
    healthy: boolean;
    details?: {
      total?: number;
      success?: number;
      failed?: number;
      used24h?: number;
      errors24h?: number;
      avgDurationMs?: number;
      lastCalledAt?: string | null;
      trend24h?: Array<{ label: string; value: number }>;
    } | null;
    trend24h?: Array<{ label: string; value: number }>;
  }>;
  modulesBySemester?: Array<{ label: string; value: number }>;
  limitSnapshot?: {
    activeSemester?: string;
    maxGroupSize?: number;
    requireManagerApproval?: boolean;
    moduleOverrides?: number;
    archivedModuleCodes?: number;
  };
};

const REFRESH_MS = 15000;

function toSparklinePath(points: Array<{ value: number }>, width = 360, height = 96) {
  if (!points.length) return '';
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function formatDuration(seconds = 0) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function metricTone(value: number, warning: number, danger: number) {
  if (value >= danger) return 'text-rose-700 bg-rose-50 border-rose-200';
  if (value >= warning) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

export default function ManagerUsageLimits() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await fetch('http://localhost:5000/api/system/metrics');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        await res.text();
        if (res.status === 404) {
          throw new Error('Metrics endpoint not found. Restart backend server to load the latest routes.');
        }
        throw new Error(`Metrics API returned non-JSON response (${res.status}).`);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load metrics');
      }
      setMetrics(data.metrics);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => fetchMetrics(true), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const trend = metrics?.usage?.trend24h || [];
  const recentRequests = metrics?.usage?.recentRequests || [];
  const topRoutes = metrics?.usage?.topRoutes || [];
  const integrations = metrics?.integrations || {};
  const integrationCards = ['gemini', 'github', 'sapling', 'redis', 'supabase']
    .map((key) => integrations[key])
    .filter(Boolean) as NonNullable<MetricsResponse['integrations']>[string][];
  const storage = metrics?.counts?.storageFootprint;
  const memory = metrics?.system?.memory;
  const requestsPath = useMemo(() => toSparklinePath(trend), [trend]);

  const quotaUsedPct = storage?.configuredQuotaMb && storage.configuredQuotaMb > 0
    ? Math.min(100, Math.round(((storage.trackedSubmissions || 0) / storage.configuredQuotaMb) * 100))
    : null;

  const roles = metrics?.counts?.roleCounts || {};
  const userCount = metrics?.counts?.users || 0;
  const activeUsers = metrics?.counts?.activeUsers || 0;
  const requestCount = metrics?.usage?.requestsLast24Hours || 0;
  const errorRate = metrics?.usage?.errorRateLast24Hours || 0;
  const avgDuration = metrics?.usage?.averageDurationMs || 0;

  return (
    <div className="animate-fade-up max-w-[1600px] mx-auto space-y-8 px-6 pb-12">
      <section className="page-header role-page-header flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-[0.24em]">
            <Wifi className="w-3.5 h-3.5" /> Live platform telemetry
          </div>
          <h1 className="page-title role-title text-4xl md:text-5xl">Usage & Limits Center</h1>
          <p className="page-subtitle text-slate-500 max-w-3xl">Track API traffic, storage footprint, platform limits, and live system health in one place. Data refreshes automatically every 15 seconds while the page is open.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchMetrics(true)}
            className="role-btn-primary px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-700/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setAutoRefresh((value) => !value)}
            className={`px-5 py-3 rounded-2xl border font-bold transition-colors inline-flex items-center gap-2 ${autoRefresh ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-700'}`}
          >
            <Activity className="w-4 h-4" /> {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 font-semibold">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Requests / 24h', value: requestCount.toLocaleString(), hint: `${metrics?.usage?.requestsLast15Minutes || 0} in last 15 min`, icon: Activity, tone: 'from-blue-600 to-indigo-500' },
          { label: 'Error Rate', value: `${errorRate}%`, hint: `${metrics?.usage?.errorCountLast24Hours || 0} failed calls`, icon: ShieldAlert, tone: 'from-rose-600 to-orange-500' },
          { label: 'Active Users', value: `${activeUsers}/${userCount || 0}`, hint: `${roles.manager || 0} managers, ${roles.lecturer || 0} lecturers`, icon: Server, tone: 'from-teal-600 to-cyan-500' },
          { label: 'Tracked Storage', value: storage?.trackedSubmissions?.toLocaleString() || '0', hint: storage?.configuredQuotaMb ? `${quotaUsedPct}% of configured quota` : 'Quota not configured', icon: Cloud, tone: 'from-slate-700 to-slate-900' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-lg mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 mb-2">{item.label}</p>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</div>
              <p className="text-sm text-slate-500 font-semibold mt-2">{item.hint}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">External API Limits</h2>
            <p className="text-sm text-slate-500 font-medium">Gemini, GitHub, Sapling, Redis, and Supabase usage with used, limit, and remaining capacity.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">24h usage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {integrationCards.map((item, index) => {
            const trendPath = toSparklinePath(item.trend24h || [], 200, 52);
            const percent = item.limit && item.limit > 0 ? Math.min(100, Math.round((item.used / item.limit) * 100)) : null;
            const tone = !item.healthy
              ? 'border-rose-200 bg-rose-50/70'
              : percent != null && percent >= 90
                ? 'border-rose-200 bg-rose-50/70'
                : percent != null && percent >= 70
                  ? 'border-amber-200 bg-amber-50/70'
                  : 'border-emerald-200 bg-emerald-50/70';

            return (
              <div key={item.name} className={`rounded-2xl border p-4 ${tone}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.name}</p>
                  <span className="text-xs font-black text-slate-700">{item.unit}</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{item.used}</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">Used</p>

                <div className="mt-3 rounded-xl border border-white/80 bg-white/70 p-2">
                  <svg viewBox="0 0 200 60" className="w-full h-14">
                    <path d={`${trendPath} L 200 60 L 0 60 Z`} fill="rgba(37,99,235,0.12)" />
                    <path d={trendPath} fill="none" stroke={index % 2 === 0 ? '#2563eb' : '#0d9488'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="mt-3 space-y-1 text-xs font-semibold text-slate-700">
                  <div className="flex items-center justify-between"><span>Limit</span><span>{item.limit ?? 'Not set'}</span></div>
                  <div className="flex items-center justify-between"><span>Remaining</span><span>{item.remaining ?? 'Unknown'}</span></div>
                  <div className="flex items-center justify-between"><span>Errors (24h)</span><span>{item.details?.errors24h ?? 0}</span></div>
                </div>

                {percent != null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-1">
                      <span>Capacity</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${percent >= 90 ? 'bg-gradient-to-r from-rose-500 to-red-500' : percent >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">API Traffic Trend</h2>
              <p className="text-sm text-slate-500 font-medium">Hourly request volume for the last 24 hours.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <Clock3 className="w-4 h-4" /> {metrics?.generatedAt ? new Date(metrics.generatedAt).toLocaleTimeString() : 'Live'}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
            <svg viewBox="0 0 360 120" className="w-full h-[180px] overflow-visible">
              <defs>
                <linearGradient id="usageLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="usageFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${requestsPath} L 360 120 L 0 120 Z`} fill="url(#usageFill)" />
              <path d={requestsPath} fill="none" stroke="url(#usageLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {[
                ['Requests', requestCount.toLocaleString()],
                ['Avg Latency', `${avgDuration} ms`],
                ['Slow Calls', `${metrics?.usage?.slowRequests || 0}`],
                ['Uptime', formatDuration(metrics?.system?.uptimeSeconds || 0)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-1">{label}</p>
                  <p className="text-lg font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-2">System memory</p>
              <div className="text-2xl font-black text-slate-900">{memory?.usedMb || 0} MB</div>
              <p className="text-sm text-slate-500 font-semibold mt-1">of {memory?.totalMb || 0} MB total on {metrics?.system?.platform || 'host'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-2">Database coverage</p>
              <div className="text-2xl font-black text-slate-900">{metrics?.counts?.projects || 0} projects</div>
              <p className="text-sm text-slate-500 font-semibold mt-1">{metrics?.counts?.modules || 0} modules, {metrics?.counts?.assignments || 0} assignments</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-2">Read status</p>
              <div className="text-2xl font-black text-slate-900">{metrics?.counts?.notificationReadCounts?.read || 0}</div>
              <p className="text-sm text-slate-500 font-semibold mt-1">read notifications, {metrics?.counts?.notificationReadCounts?.unread || 0} unread</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-1">Policy Snapshot</h2>
            <p className="text-sm text-slate-500 font-medium mb-5">Current rule set driving group and module behavior.</p>

            <div className="space-y-3 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
                <span>Active semester</span>
                <span className="font-black text-indigo-700">{metrics?.limitSnapshot?.activeSemester || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
                <span>Max group size</span>
                <span className="font-black text-indigo-700">{metrics?.limitSnapshot?.maxGroupSize ?? 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
                <span>Approval gating</span>
                <span className="font-black text-indigo-700">{metrics?.limitSnapshot?.requireManagerApproval ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
                <span>Module overrides</span>
                <span className="font-black text-indigo-700">{metrics?.limitSnapshot?.moduleOverrides ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
                <span>Archived modules</span>
                <span className="font-black text-indigo-700">{metrics?.limitSnapshot?.archivedModuleCodes ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-1">Storage Footprint</h2>
            <p className="text-sm text-slate-500 font-medium mb-5">Tracked uploads and configured limits. This reflects app-side records, not hidden cloud-provider quotas.</p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
                  <span>Tracked upload records</span>
                  <span>{storage?.trackedSubmissions || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${Math.min(100, (storage?.trackedSubmissions || 0) * 6)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl border px-4 py-4 ${metricTone(quotaUsedPct || 0, 70, 90)}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70 mb-1">Configured quota</p>
                  <p className="text-2xl font-black">{storage?.configuredQuotaMb ?? '—'} MB</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-1">Warning threshold</p>
                  <p className="text-2xl font-black text-slate-900">{storage?.configuredWarningMb ?? '—'} MB</p>
                </div>
              </div>

              <div className="space-y-2 text-sm font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Assignment uploads</span>
                  <span>{storage?.assignmentFiles || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Project submissions</span>
                  <span>{storage?.projectFiles || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cloud sync state</span>
                  <span className="font-black text-emerald-700">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Top API Routes</h2>
          <p className="text-sm text-slate-500 font-medium mb-5">Most active backend endpoints in the current session.</p>

          <div className="space-y-3">
            {topRoutes.length > 0 ? topRoutes.map((item, index) => {
              const width = Math.max(12, Math.min(100, item.count * 12));
              return (
                <div key={item.route} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.route}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rank #{index + 1}</p>
                    </div>
                    <span className="text-sm font-black text-indigo-700">{item.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${index % 2 === 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 font-semibold">
                No API telemetry recorded yet. Keep the page open while the app is active to build live charts.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-1">Recent Requests</h2>
              <p className="text-sm text-slate-500 font-medium">Last API calls with response status and latency.</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-[0.18em]">
              <ArrowUpRight className="w-3.5 h-3.5" /> Real time
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Endpoint</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Latency</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length > 0 ? recentRequests.slice(0, 12).map((item) => (
                  <tr key={`${item.method}-${item.path}-${item.timestamp}`} className="border-t border-slate-100">
                    <td className="py-3 pr-4 font-black text-slate-800">{item.method}</td>
                    <td className="py-3 pr-4 font-medium text-slate-600 max-w-[220px] truncate">{item.path}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black ${item.statusCode >= 500 ? 'bg-rose-50 text-rose-700' : item.statusCode >= 400 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.statusCode}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-700">{item.durationMs} ms</td>
                    <td className="py-3 text-slate-500 font-medium">{new Date(item.timestamp).toLocaleTimeString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 font-semibold">No recent requests captured yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}