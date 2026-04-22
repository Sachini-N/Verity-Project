import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Activity, BrainCircuit, Users, Target, Clock, Loader2, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

const API = 'http://localhost:5000/api/project';

type Health = {
  status: string;
  summary: string;
  targetMilestone: string;
  borderClass: string;
  badgeClass: string;
  bannerGradient: string;
};

type Metric = {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
  bar: string;
};

type Anomaly = {
  id?: string;
  severity: string;
  severityLabel: string;
  timeLabel: string;
  title: string;
  description: string;
  memberName?: string;
  isDbPersistent?: boolean;
};

type DisplayAnomaly = Anomaly & {
  mergedCount: number;
  actionText: string;
  fingerprint: string;
};

type GuidanceItem = {
  title: string;
  recommendationText: string;
};

const iconMap = {
  Target,
  Users,
  Clock,
  Activity
} as const;

const normalizePercent = (value: number) => Math.max(0, Math.min(100, Number(value) || 0));

function compactText(value: string) {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function getActionText(anomaly: Anomaly) {
  const combined = `${anomaly.title} ${anomaly.description}`.toLowerCase();

  if (combined.includes('ghost') || combined.includes('inactive') || combined.includes('no activity')) {
    return 'Meet the student within 48h and assign one measurable task with a clear due date.';
  }
  if (combined.includes('fake worker') || combined.includes('without pushing code') || combined.includes('no commit')) {
    return 'Request commit evidence for recently closed tasks and enforce task-to-commit linkage.';
  }
  if (combined.includes('burnout') || combined.includes('late night') || combined.includes('ungodly')) {
    return 'Rebalance workload immediately and reduce overnight work by redistributing urgent items.';
  }
  if (combined.includes('task inflation') || combined.includes('instantly') || combined.includes('boost stats')) {
    return 'Audit the completed tasks and split oversized items into verifiable subtasks.';
  }
  if (combined.includes('last-minute') || combined.includes('deadline') || combined.includes('panic')) {
    return 'Set a mid-week checkpoint and require incremental pushes before final deadline.';
  }
  if (anomaly.severity === 'high') {
    return 'Schedule an intervention with the group and track progress in the next review cycle.';
  }
  return 'Discuss this signal in the next review and define one corrective action with owner + due date.';
}

function buildDisplayAnomalies(items: Anomaly[]): DisplayAnomaly[] {
  const grouped = new Map<string, DisplayAnomaly>();

  items.forEach((item) => {
    const key = [
      compactText(item.title),
      compactText(item.description),
      compactText(item.memberName || ''),
      compactText(item.severity)
    ].join('|');

    const existing = grouped.get(key);
    if (existing) {
      existing.mergedCount += 1;
      if (item.id && !existing.id) {
        existing.id = item.id;
      }
      if (item.isDbPersistent) {
        existing.isDbPersistent = true;
      }
      return;
    }

    grouped.set(key, {
      ...item,
      mergedCount: 1,
      actionText: getActionText(item),
      fingerprint: key
    });
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const aScore = a.severity === 'high' ? 2 : 1;
    const bScore = b.severity === 'high' ? 2 : 1;
    if (aScore !== bScore) return bScore - aScore;
    return b.mergedCount - a.mergedCount;
  });
}

export default function GroupIntelligenceOverview() {
  const { id } = useParams();
  const ANOMALIES_PREVIEW_COUNT = 3;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());
  const [showAllAnomalies, setShowAllAnomalies] = useState(false);
  const [guidance, setGuidance] = useState<GuidanceItem[]>([]);
  const [downloadingReport, setDownloadingReport] = useState(false);

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
        const res = await fetch(`${API}/intelligence/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load intelligence overview');
        }
        if (cancelled) return;
        setHealth(data.health || null);
        setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
        setAnomalies(Array.isArray(data.anomalies) ? data.anomalies : []);
        setGuidance(Array.isArray(data.guidance) ? data.guidance : []);
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

  const handleResolve = async (flagId: string) => {
    try {
      const res = await fetch(`${API}/riskflag/${flagId}/resolve`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setAnomalies(prev => prev.filter(a => a.id !== flagId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadReport = async () => {
    if (!id || downloadingReport) return;
    try {
      setDownloadingReport(true);
      const res = await fetch(`${API}/intelligence/${id}/report.pdf`);
      if (!res.ok) {
        throw new Error('Failed to generate report PDF');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const fileMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileMatch?.[1] || `project_contribution_report_${id}.pdf`;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to download report';
      setError(message);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleDismissTemporary = (fingerprint: string) => {
    setDismissedAnomalies((prev) => {
      const next = new Set(prev);
      next.add(fingerprint);
      return next;
    });
  };

  const displayAnomalies = buildDisplayAnomalies(anomalies).filter((a) => !dismissedAnomalies.has(a.fingerprint));
  const hasMoreAnomaliesInView = displayAnomalies.length > ANOMALIES_PREVIEW_COUNT;
  const visibleAnomalies = showAllAnomalies ? displayAnomalies : displayAnomalies.slice(0, ANOMALIES_PREVIEW_COUNT);

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center animate-fade-up shadow-sm">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Running Project Intelligence Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6 text-sm font-semibold animate-fade-up">
        {error}
      </div>
    );
  }

  const statusText = String(health?.status || '').toLowerCase();
  const isRisk = statusText.includes('risk') || statusText.includes('critical');
  const isWarning = statusText.includes('warn') || statusText.includes('caution');
  const tone = isRisk
    ? {
        border: 'border-red-200',
        chip: 'bg-red-50 text-red-700 border-red-200',
        icon: 'bg-red-100 text-red-700',
        title: 'text-red-700',
        glow: 'from-red-100/50 to-transparent'
      }
    : isWarning
      ? {
          border: 'border-amber-200',
          chip: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: 'bg-amber-100 text-amber-700',
          title: 'text-amber-700',
          glow: 'from-amber-100/50 to-transparent'
        }
      : {
          border: 'border-emerald-200',
          chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: 'bg-emerald-100 text-emerald-700',
          title: 'text-emerald-700',
          glow: 'from-emerald-100/50 to-transparent'
        };

  return (
    <div className="animate-fade-up space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-[1.85rem] border ${tone.border} bg-white shadow-sm`}
      >
        <div className={`absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-b ${tone.glow} blur-3xl`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(15,23,42,0.02),transparent_45%)]" />

        <div className="relative z-10 p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className={`w-14 h-14 rounded-2xl ${tone.icon} flex items-center justify-center shrink-0`}>
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Group Intelligence
                </span>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${tone.chip}`}>
                  {health?.status || 'Unknown Status'}
                </span>
              </div>

              <h2 className="text-2xl md:text-[2rem] font-black text-slate-900 leading-tight">AI Health Assessment</h2>
              <p className="mt-2 text-slate-600 font-medium leading-relaxed max-w-4xl">
                {health?.summary || 'No summary available.'}
              </p>
              {health?.targetMilestone ? (
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Target Milestone: <span className="text-slate-700">{health.targetMilestone}</span>
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={!id || downloadingReport}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {downloadingReport ? 'Generating PDF...' : 'Download Contribution Report'}
            </button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((dim, idx) => {
          const Icon = iconMap[dim.icon as keyof typeof iconMap] || Target;
          return (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${dim.bg}`}>
                  <Icon className={`w-5 h-5 ${dim.color}`} />
                </div>
                <div className={`text-3xl font-black ${dim.color}`}>{dim.value}</div>
              </div>
              <div className="text-[13px] font-black uppercase tracking-wide text-slate-700 mb-3">{dim.label}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${dim.bar}`} style={{ width: `${normalizePercent(dim.value)}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Detected Anomalies</h3>
          </div>
          <div className="p-5 space-y-4">
            {displayAnomalies.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium text-center py-6">
                No rule-based anomalies detected from tasks, status history, or synced Git commits.
              </p>
            ) : (
              visibleAnomalies.map((a, idx) => {
                const isHigh = a.severity === 'high';
                return (
                  <div
                    key={`${a.title}-${idx}`}
                    className={`p-4 border rounded-xl relative overflow-hidden ${
                      isHigh ? 'border-red-100 bg-red-50/60' : 'border-amber-100 bg-amber-50/60'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${isHigh ? 'bg-red-500' : 'bg-emerald-500'}`}
                    />
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`badge py-0.5 ${isHigh ? 'badge-red' : 'badge-sage'}`}>
                        {a.severityLabel}
                      </span>
                      {a.mergedCount > 1 ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {a.mergedCount} similar alerts grouped
                        </span>
                      ) : null}
                      <span className="text-xs font-bold text-slate-500">{a.timeLabel}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                    <div className="mt-2 text-xs font-semibold text-slate-700 bg-white/80 border border-slate-200 rounded-lg px-2.5 py-2">
                      Next Step: {a.actionText}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDismissTemporary(a.fingerprint)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Dismiss for now
                      </button>
                      {a.isDbPersistent && a.id ? (
                        <button
                          type="button"
                          onClick={() => handleResolve(a.id!)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${
                            isHigh
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          Intervene & Resolve
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            {hasMoreAnomaliesInView ? (
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllAnomalies(prev => !prev)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {showAllAnomalies ? 'Show Less' : 'View More'}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">AI Guidance & Mitigation</h3>
          </div>
          <div className="p-5 space-y-4">
            {guidance.map((item, i) => (
              <div key={`${item.title}-${i}`} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold bg-white shrink-0 shadow-sm mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                  <p className="text-sm text-slate-600 mt-0.5">{item.recommendationText}</p>
                </div>
              </div>
            ))}
            {guidance.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium text-center py-6">No AI guidance suggestions available for this project right now.</p>
            ) : null}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Apply Automated Policy
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
