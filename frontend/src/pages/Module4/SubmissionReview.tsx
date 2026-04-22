import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, Eye, FileText, Loader2, RefreshCw, Search } from 'lucide-react';

type SubmissionData = {
  id: string;
  originalName: string;
  status: string;
  createdAt: string;
  uploader?: {
    name?: string;
    email?: string;
    indexNumber?: string;
  };
  meta?: {
    branch?: string | null;
    notes?: string | null;
    milestone?: string | null;
    milestoneKey?: string | null;
    expectedWeek?: number | null;
    storedPath?: string | null;
  };
};

export default function SubmissionReview() {
  const { id } = useParams();

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [selected, setSelected] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchSubmissions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await axios.get(`http://localhost:5000/api/submission/list/${id}`);
      const rows: SubmissionData[] = resp.data?.submissions || [];
      setSubmissions(rows);
      setSelected((current) => {
        if (current) {
          return rows.find((r) => r.id === current.id) || rows[0] || null;
        }
        return rows[0] || null;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const filtered = submissions.filter((sub) => {
    const q = search.trim().toLowerCase();
    const isApproved = String(sub.status || '').toLowerCase() === 'approved';

    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && isApproved) ||
      (statusFilter === 'pending' && !isApproved);

    if (!statusOk) return false;
    if (!q) return true;

    return (
      String(sub.meta?.milestone || '').toLowerCase().includes(q) ||
      String(sub.originalName || '').toLowerCase().includes(q) ||
      String(sub.uploader?.name || '').toLowerCase().includes(q) ||
      String(sub.uploader?.indexNumber || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = submissions.filter((s) => String(s.status || '').toLowerCase() !== 'approved').length;
  const approvedCount = submissions.length - pendingCount;

  return (
    <div className="space-y-7 animate-fade-up">
      <section className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 p-7 shadow-sm relative overflow-hidden">
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-52 h-52 rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-2">
              <FileText className="w-3.5 h-3.5" /> Lecturer Submission Desk
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Submission Review</h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">Project #{id} - proposal/progress/final milestone reports with quick PDF inspection.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-center">
              <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">Pending</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-3 text-center">
              <p className="text-2xl font-black text-emerald-700">{approvedCount}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70">Approved</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search milestone, file, student, or IT number"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key as 'all' | 'pending' | 'approved')}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest border transition-colors ${
                statusFilter === item.key
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchSubmissions}
            className="rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
        <div className="xl:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Submissions</h3>
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading submissions...</p>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm text-slate-500 font-semibold">No submissions found for current filters.</p>
            </div>
          )}

          {!loading && filtered.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selected?.id === sub.id
                  ? 'border-emerald-300 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-black text-slate-800 leading-snug">{sub.meta?.milestone || sub.originalName}</h4>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                  String(sub.status || '').toLowerCase() === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {String(sub.status || '').toLowerCase() === 'approved' ? 'Approved' : 'Pending'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2 font-semibold truncate">{sub.originalName}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">{new Date(sub.createdAt).toLocaleString()}</p>
              {sub.meta?.expectedWeek && (
                <p className="text-[11px] mt-1 font-bold text-emerald-700">Expected Week {sub.meta.expectedWeek}</p>
              )}
            </button>
          ))}
        </div>

        <div className="xl:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selected.meta?.milestone || selected.originalName}</h3>
                    <p className="text-sm font-semibold text-slate-600 mt-1">
                      Submitted by {selected.uploader?.name || 'Unknown'} {selected.uploader?.indexNumber ? `(${selected.uploader.indexNumber})` : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>

                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl border ${
                    String(selected.status || '').toLowerCase() === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selected.status || 'Submitted'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Branch</p>
                    <p className="text-sm font-bold text-slate-800">{selected.meta?.branch || 'main'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Milestone Week</p>
                    <p className="text-sm font-bold text-slate-800">{selected.meta?.expectedWeek ? `Week ${selected.meta.expectedWeek}` : 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Submission Notes</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{selected.meta?.notes || 'No additional notes provided.'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`http://localhost:5000/api/submission/view/${selected.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View PDF
                  </a>

                  <a
                    href={`http://localhost:5000/api/submission/download/${selected.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-800 text-white px-4 py-2 text-sm font-bold hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <h4 className="text-sm font-black text-emerald-800 uppercase tracking-[0.16em] mb-1">Lecturer Visibility</h4>
                <p className="text-sm font-semibold text-emerald-900/80 leading-relaxed">
                  This page is directly connected to project submissions. Once a team uploads a milestone PDF, it appears in this review panel with timing metadata and immediate preview/download access.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-black text-slate-700">Select a submission to inspect details</p>
              <p className="text-sm text-slate-500 font-semibold mt-1">You can preview the PDF and download the file from the detail card.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
