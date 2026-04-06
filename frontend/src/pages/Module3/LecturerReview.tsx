import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle, Target, MessageSquare, X, BookOpen, Loader2 } from 'lucide-react';

export default function LecturerReview() {
  const { id } = useParams();
  const IT_INDEX_PATTERN = /^IT\d{0,8}$/i;
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [reportSort, setReportSort] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`http://localhost:5000/api/report/list/${id}`);
      if (resp.data.success) {
        setReports(resp.data.reports.map((r: any) => ({
          id: r.id,
          member: r.userName,
          role: r.role,
          week: r.weekNumber,
          completed: r.completed,
          challenges: r.challenges,
          plan: r.plan,
          status: r.status,
          grade: r.grade,
          feedback: r.feedback,
          indexNumber: r.userIndexNumber,
          createdAt: r.createdAt,
          date: new Date(r.createdAt).toLocaleDateString()
        })));
      }
    } catch (e) {
      console.error('Failed to fetch reports', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReports();
  }, [id]);

  const onSubmitReview = async (data: any) => {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      await axios.put(`http://localhost:5000/api/report/review/${selectedReport.id}`, {
        grade: data.grade,
        feedback: data.feedback,
        status: 'Reviewed'
      });
      setSelectedReport(null);
      reset();
      fetchReports();
    } catch (e) {
      console.error('Failed to submit review', e);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'Pending';
    if (filter === 'reviewed') return r.status === 'Reviewed';
    return true;
  });

  const reportSearchQuery = reportSearch.trim().toUpperCase();
  const reportSearchValid = !reportSearchQuery || IT_INDEX_PATTERN.test(reportSearchQuery);
  const displayedReports = [...filteredReports]
    .filter(r => {
      if (!reportSearchQuery) return true;
      if (!reportSearchValid) return false;
      return (r.indexNumber || '').toUpperCase().startsWith(reportSearchQuery);
    })
    .sort((a, b) => {
      if (reportSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (reportSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (reportSort === 'name-asc') {
        return (a.member || '').localeCompare(b.member || '');
      }
      return (b.member || '').localeCompare(a.member || '');
    });

  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const reviewedCount = reports.filter(r => r.status === 'Reviewed').length;

  return (
    <div className="animate-fade-up space-y-8">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-sage">Lecturer Portal</span>
            <span className="text-slate-400 text-sm font-medium">SE3040 · Project #{id}</span>
          </div>
          <h1 className="page-title">Weekly Report Reviews</h1>
          <p className="page-subtitle">Review student submissions and provide constructive academic feedback.</p>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="card p-4 text-center min-w-[90px]">
            <div className="text-2xl font-black text-emerald-600">{pendingCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Pending</div>
          </div>
          <div className="card p-4 text-center min-w-[90px]">
            <div className="text-2xl font-black text-emerald-600">{reviewedCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Reviewed</div>
          </div>
          <div className="card p-4 text-center min-w-[90px]">
            <div className="text-2xl font-black text-emerald-900">{reports.length}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Total</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        {(['all', 'pending', 'reviewed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              filter === f ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={reportSearch}
          onChange={(e) => setReportSearch(e.target.value.toUpperCase())}
          placeholder="Search by IT number (e.g., IT21 or IT21000001)"
          maxLength={10}
          className="glass-input sm:flex-1"
        />
        <select
          value={reportSort}
          onChange={(e) => setReportSort(e.target.value as 'newest' | 'oldest' | 'name-asc' | 'name-desc')}
          aria-label="Sort reports"
          className="glass-input sm:w-64"
        >
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="name-asc">Sort: Student name (A-Z)</option>
          <option value="name-desc">Sort: Student name (Z-A)</option>
        </select>
      </div>

      {reportSearchQuery && !reportSearchValid && (
        <p className="text-red-600 text-sm font-semibold -mt-1">Search must start with IT and contain only digits after it (up to 8 digits), e.g., IT21 or IT21000001.</p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
           <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : displayedReports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-800">No Reports Found</h3>
          <p className="text-slate-500 font-medium mt-1">Students haven't submitted any weekly reports matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReports.map((rep, idx) => (
          <div key={rep.id} className={`card p-6 border-l-4 animate-fade-up-delay-${Math.min(idx + 1, 5)} ${rep.status === 'Pending' ? 'border-l-teal-400' : 'border-l-emerald-500'}`}>
            <div className="flex flex-col xl:flex-row gap-6">
              
              {/* Member Info */}
              <div className="flex items-center gap-4 xl:w-56 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-white text-lg font-black shadow-md">
                  {rep.member ? rep.member.charAt(0) : '?'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{rep.member}</h4>
                      <span className={`badge ${rep.role === 'Leader' ? 'badge-sage' : 'badge-slate'} mt-1`}>{rep.role}</span>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{rep.indexNumber || 'IT Number not set'}</p>
                  <p className="text-xs text-slate-400 mt-1">{rep.date}</p>
                </div>
              </div>

              {/* Report Sections */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Completed', text: rep.completed, icon: CheckCircle, color: 'emerald' },
                  { label: 'Challenges', text: rep.challenges, icon: AlertTriangle, color: 'amber' },
                  { label: 'Next Week', text: rep.plan, icon: Target, color: 'emerald' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className={`flex items-center gap-1.5 mb-2 text-${s.color}-600`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{s.text || 'Not provided'}</p>
                    </div>
                  );
                })}
              </div>

              {/* Status & Action */}
              <div className="flex xl:flex-col items-start xl:items-end justify-between xl:justify-start gap-4 xl:w-48 shrink-0">
                <span className={`badge ${rep.status === 'Reviewed' ? 'badge-green' : 'badge-amber'}`}>
                  {rep.status}
                </span>
                
                {rep.status === 'Pending' ? (
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="text-sm px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Write Review
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl xl:w-full">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Feedback Sent: {rep.grade}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{rep.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-base font-black">
                  {selectedReport.member ? selectedReport.member.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedReport.member}</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Week {selectedReport.week} — Review</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedReport(null); reset(); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Close review modal"
                disabled={submitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmitReview)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Grade / Score</label>
                <select {...register('grade', { required: 'Grade is required' })} className="glass-input">
                  <option value="">— Select a grade —</option>
                  <option value="A+">A+ (Excellent)</option>
                  <option value="A">A (Very Good)</option>
                  <option value="B+">B+ (Good)</option>
                  <option value="B">B (Satisfactory)</option>
                  <option value="C">C (Needs Improvement)</option>
                  <option value="F">F (Fail)</option>
                </select>
                {errors.grade && <p className="text-red-600 text-xs font-semibold mt-1.5">{errors.grade.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Written Feedback</label>
                <textarea
                  {...register('feedback', { required: 'Feedback is required', minLength: { value: 15, message: 'Please write at least 15 characters of feedback.' } })}
                  rows={4}
                  className="glass-input resize-none"
                  placeholder="Provide constructive, detailed feedback for this student..."
                />
                {errors.feedback && <p className="text-red-600 text-xs font-semibold mt-1.5">{errors.feedback.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Action Required?</label>
                <select {...register('action')} className="glass-input">
                  <option value="none">No action needed</option>
                  <option value="warning">Issue formal warning</option>
                  <option value="meeting">Schedule a meeting</option>
                  <option value="flag">Flag for moderation committee</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedReport(null); reset(); }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-50" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
