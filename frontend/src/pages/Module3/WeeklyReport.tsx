import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle, Target, Send, Clock, MessageSquare, User, Sparkles, BarChart3, ClipboardCheck, ShieldCheck } from 'lucide-react';

type FormData = {
  completed: string;
  challenges: string;
  plan: string;
};

// We will fetch history dynamically from the backend

export default function WeeklyReport() {
  const { id } = useParams();
  const MAX_FIELD_LENGTH = 300;
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>();
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const completedValue = watch('completed') || '';
  const challengesValue = watch('challenges') || '';
  const planValue = watch('plan') || '';

  const getCounterColorClass = (length: number) => {
    if (length >= MAX_FIELD_LENGTH) return 'text-red-600';
    if (length >= 280) return 'text-amber-600';
    return 'text-slate-500';
  };

  const fetchReports = async () => {
    try {
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const user = parsed?.user || parsed;

      const resp = await axios.get(`http://localhost:5000/api/report/list/${id}`);
      if (resp.data.success) {
        // Filter reports to only show the currently logged in student's reports
        const myReports = resp.data.reports.filter((r: any) => user ? r.userId === user.id : true);

        setHistory(myReports.map((r: any) => ({
          week: r.weekNumber,
          status: r.status,
          feedback: r.feedback,
          grade: r.grade,
          date: new Date(r.createdAt).toLocaleDateString(),
          lecturer: 'Lecturer Review' // Hardcoded for demo
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) fetchReports();
  }, [id]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const user = parsed?.user || parsed;

      await axios.post('http://localhost:5000/api/report/create', {
        projectId: id,
        weekNumber: history.length + 1,
        completed: data.completed,
        challenges: data.challenges,
        plan: data.plan,
        submittedBy: user?.id
      });
      setSubmitted(true);
      reset();
      fetchReports();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (e) {
      console.error('Submission failed', e);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const reviewedCount = history.filter((rep) => rep.status === 'Reviewed').length;
  const pendingCount = history.length - reviewedCount;
  const currentWeek = history.length + 1;

  return (
    <div className="animate-fade-up max-w-7xl mx-auto space-y-7 pb-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/45 p-8 shadow-sm">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-indigo-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" /> Weekly Signal Board
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Weekly Progress Report</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">Document contributions, blockers, and execution plan with clear weekly evidence.</p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white/90 px-5 py-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Cycle</div>
            <div className="mt-1 text-3xl font-black text-indigo-700">Week {currentWeek}</div>
            <div className="text-xs text-slate-400 mt-1">Auto-calculated from your report history</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: history.length, icon: BarChart3, tone: 'from-indigo-500 to-indigo-600' },
          { label: 'Reviewed', value: reviewedCount, icon: ClipboardCheck, tone: 'from-teal-500 to-teal-600' },
          { label: 'Pending', value: pendingCount, icon: Clock, tone: 'from-amber-500 to-amber-600' },
          { label: 'Current Week', value: currentWeek, icon: ShieldCheck, tone: 'from-sky-500 to-sky-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Send className="w-4 h-4 text-indigo-600" />
            </div>
            Submit This Week's Report
          </h2>

          {submitted && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 shadow-sm">
              <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-teal-800">Report Submitted Successfully</p>
                <p className="text-xs text-teal-600 mt-0.5">Your lecturer will review and provide feedback shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                Completed Work
              </label>
              <textarea
                {...register('completed', {
                  required: 'Please describe your completed work.',
                  minLength: { value: 10, message: 'Provide at least 10 characters.' },
                  maxLength: { value: MAX_FIELD_LENGTH, message: `Maximum ${MAX_FIELD_LENGTH} characters allowed.` }
                })}
                rows={4}
                maxLength={MAX_FIELD_LENGTH}
                className="glass-input resize-none"
                placeholder="Describe the tasks, features, or deliverables you completed this week..."
              />
              <p className={`text-xs mt-1.5 ${getCounterColorClass(completedValue.length)}`}>{completedValue.length}/{MAX_FIELD_LENGTH} characters</p>
              {errors.completed && (
                <p className="text-red-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.completed.message}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Challenges Faced
              </label>
              <textarea
                {...register('challenges', {
                  required: 'Please mention any challenges or blockers.',
                  maxLength: { value: MAX_FIELD_LENGTH, message: `Maximum ${MAX_FIELD_LENGTH} characters allowed.` }
                })}
                rows={3}
                maxLength={MAX_FIELD_LENGTH}
                className="glass-input resize-none"
                placeholder="Describe any blockers, delays, or technical difficulties..."
              />
              <p className={`text-xs mt-1.5 ${getCounterColorClass(challengesValue.length)}`}>{challengesValue.length}/{MAX_FIELD_LENGTH} characters</p>
              {errors.challenges && (
                <p className="text-red-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.challenges.message}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-teal-500" />
                Next Week's Plan
              </label>
              <textarea
                {...register('plan', {
                  required: "Please outline your plan for next week.",
                  maxLength: { value: MAX_FIELD_LENGTH, message: `Maximum ${MAX_FIELD_LENGTH} characters allowed.` }
                })}
                rows={3}
                maxLength={MAX_FIELD_LENGTH}
                className="glass-input resize-none"
                placeholder="List the key tasks and goals you plan to accomplish next week..."
              />
              <p className={`text-xs mt-1.5 ${getCounterColorClass(planValue.length)}`}>{planValue.length}/{MAX_FIELD_LENGTH} characters</p>
              {errors.plan && (
                <p className="text-red-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.plan.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button disabled={loading} type="submit" className="btn-primary px-8 py-3 disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            Submission History
          </h2>

          {history.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-500">No reports yet. Submit your first weekly report.</p>
            </div>
          )}

          {history.map((rep, idx) => (
            <div key={idx} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-indigo-500 to-teal-500" />
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-900">Week {rep.week} Report</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{rep.date}</p>
                </div>
                <span className={`badge ${rep.status === 'Reviewed' ? 'badge-green' : 'badge-amber'}`}>
                  {rep.status}
                </span>
              </div>

              {rep.feedback ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Lecturer Feedback</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{rep.feedback}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">{rep.lecturer}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 font-medium bg-amber-50 rounded-lg px-3 py-2 mt-3 border border-amber-100">
                  Awaiting lecturer review...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
