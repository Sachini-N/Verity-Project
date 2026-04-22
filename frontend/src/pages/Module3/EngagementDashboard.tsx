import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Activity,
  LogIn,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Loader2,
  type LucideIcon
} from 'lucide-react';

const API = 'http://localhost:5000/api/project';

type Kpi = {
  key: string;
  label: string;
  value: string;
  unit: string;
  trend: string;
  trendUp: boolean;
  color: string;
};

type AlertItem = {
  level: string;
  title: string;
  member: string;
  detail: string;
  color: string;
};

const iconByKey: Record<string, LucideIcon> = {
  loginFrequency: LogIn,
  taskUpdates: Activity,
  responseTime: Clock,
  groupRank: Users
};

const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  blue: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'text-emerald-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'text-emerald-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', icon: 'text-teal-500' },
  indigo: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', icon: 'text-teal-500' }
};

const heatColors = ['bg-slate-100', 'bg-emerald-100', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-900'];

export default function EngagementDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const isLecturer = location.pathname.includes('/lecturer');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState('');
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [heatmapLevels, setHeatmapLevels] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/engagement/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load engagement analytics');
        }
        if (cancelled) return;
        setSubtitle(data.project?.subtitle || data.project?.title || '');
        setKpis(Array.isArray(data.kpis) ? data.kpis : []);
        setHeatmapLevels(Array.isArray(data.heatmap?.levels) ? data.heatmap.levels : []);
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="animate-fade-up space-y-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${isLecturer ? 'badge-sage' : 'badge-sage'}`}>
              {isLecturer ? 'Lecturer View' : 'Student Portal'}
            </span>
            {subtitle ? <span className="text-slate-400 text-sm font-medium">{subtitle}</span> : null}
          </div>
          <h1 className="page-title">Engagement Analytics</h1>
          <p className="page-subtitle">
            Track your activity levels, participation metrics, and group dynamics.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card p-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Loading engagement analytics...</p>
        </div>
      )}

      {!loading && error && (
        <div className="card p-6 border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {kpis.map((s, i) => {
              const c = colorMap[s.color] || colorMap.emerald;
              const Icon = iconByKey[s.key] || Activity;
              const showTrend = s.trend !== '—';
              return (
                <div key={s.key} className={`stat-card animate-fade-up-delay-${i + 1}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                    </div>
                    {showTrend ? (
                      <span
                        className={`flex items-center gap-1 text-xs font-bold ${s.trendUp ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {s.trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {s.trend}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">—</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {s.value}{' '}
                    {s.unit ? <span className="text-sm font-medium text-slate-400">{s.unit}</span> : null}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  30-Day Activity Heatmap
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Less</span>
                  {heatColors.map((col, j) => (
                    <div key={j} className={`w-3.5 h-3.5 rounded-sm ${col}`} />
                  ))}
                  <span>More</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {(heatmapLevels.length ? heatmapLevels : Array(30).fill(0)).map((level, i) => (
                  <div
                    key={i}
                    title={`Day ${i + 1}`}
                    className={`aspect-square rounded-md ${heatColors[Math.min(4, Math.max(0, level))]} transition-transform hover:scale-110 cursor-default`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium mt-4">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Active Alerts
              </h2>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500 text-center py-4">No anomalies detected right now.</p>
                ) : (
                  alerts.map((risk, i) => (
                    <div
                      key={`${risk.title}-${risk.member}-${i}`}
                      className={`p-4 rounded-xl border-l-4 ${
                        risk.color === 'red' ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`font-bold text-sm ${
                            risk.color === 'red' ? 'text-red-800' : 'text-emerald-800'
                          }`}
                        >
                          {risk.title}
                        </h4>
                        <span
                          className={`badge ${risk.color === 'red' ? 'badge-red' : 'badge-sage'} text-[10px] py-0.5`}
                        >
                          {risk.level === 'high' ? 'High' : 'Medium'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">{risk.member}</p>
                      <p
                        className={`text-xs leading-relaxed ${
                          risk.color === 'red' ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {risk.detail}
                      </p>
                    </div>
                  ))
                )}
                <p className="text-center text-xs text-slate-400 font-medium pt-2">
                  Rule-based signals from logins, tasks, reports, time logs, and Git (when synced)
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
