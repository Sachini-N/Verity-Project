import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle, Target, Send, Clock, MessageSquare, User } from 'lucide-react';

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

  return (
    <div className="animate-fade-up">
      {/* Page Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-sage">Student Portal</span>
            <span className="text-slate-400 text-sm font-medium">SE3040 · Group 07</span>
          </div>
          <h1 className="page-title">Weekly Progress Report</h1>
          <p className="page-subtitle">Document your weekly contributions, blockers, and upcoming priorities.</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Week</div>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">Week 4</div>
          <div className="text-xs text-slate-400 mt-0.5">Due: Oct 21, 2024</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 card p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            Submit This Week's Report
          </h2>

          {submitted && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Report Submitted Successfully</p>
                <p className="text-xs text-emerald-600 mt-0.5">Your lecturer will review and provide feedback shortly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
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

            <div>
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-500" />
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
              <button disabled={loading} type="submit" className="btn-primary px-8 py-3 disabled:opacity-50">
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
            </div>
            Submission History
          </h2>

          {history.map((rep, idx) => (
            <div key={idx} className="card p-5 border-l-4 border-l-emerald-900 animate-fade-up-delay-1">
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
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-900" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Lecturer Feedback</span>
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
