import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, ChevronDown, Clock, Filter, FileText, Inbox, Loader2, Lock, MessageSquare, Search, Sparkles, UploadCloud, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const API = 'http://localhost:5000/api/assignment';

interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  moduleCode: string;
  moduleName: string | null;
  deadline: string;
  format: string;
  status: string;
  assignmentSubmissions: any[];
  lateWindowDays?: number;
  lateWindowEndsAt?: string;
  effectiveStatus?: string;
}

export default function StudentGlobalAssignments() {
  const LATE_GRACE_DAYS = 3;
  const [filterModule, setFilterModule] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [pendingAssignmentTitle, setPendingAssignmentTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAssignmentRef = useRef<string | null>(null);

  const academicContext = { year: 'Year 3', semester: 'Semester 1' };

  const getUser = () => {
    try {
      const stored = sessionStorage.getItem('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.user || parsed;
    } catch {
      return null;
    }
  };

  const currentUser = getUser();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch(`${API}/list`);
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      } else {
        setLoadError(data.message || 'Unable to load assignments right now.');
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setLoadError('Unable to load assignments right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const hasSubmitted = (assignment: AssignmentItem) => {
    if (!currentUser) return false;
    return assignment.assignmentSubmissions?.some((sub: any) => sub.studentId === currentUser.id);
  };

  const getModuleDisplay = (ass: AssignmentItem) => {
    return ass.moduleName ? `${ass.moduleCode} - ${ass.moduleName}` : ass.moduleCode;
  };

  const getGraceEndAt = (ass: AssignmentItem) => {
    if (ass.lateWindowEndsAt) return new Date(ass.lateWindowEndsAt);
    const deadlineAt = new Date(ass.deadline);
    return new Date(deadlineAt.getTime() + LATE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  };

  const isInLateWindow = (ass: AssignmentItem) => {
    const now = new Date();
    const deadlineAt = new Date(ass.deadline);
    const graceEndAt = getGraceEndAt(ass);
    return now > deadlineAt && now <= graceEndAt;
  };

  const canSubmitNow = (ass: AssignmentItem) => {
    const now = new Date();
    if (ass.status === 'Closed') return false;
    return now <= getGraceEndAt(ass);
  };

  const getEffectiveStatus = (ass: AssignmentItem) => {
    if (ass.effectiveStatus) return ass.effectiveStatus;
    if (ass.status === 'Closed') return 'Closed';
    if (!canSubmitNow(ass)) return 'Closed';
    return 'Open';
  };

  const isUrgent = (ass: AssignmentItem) => {
    const dueInMs = getGraceEndAt(ass).getTime() - new Date().getTime();
    return dueInMs < 86400000 * 3 && !hasSubmitted(ass) && getEffectiveStatus(ass) !== 'Closed';
  };

  const uniqueModules = ['All', ...Array.from(new Set(assignments.map(a => getModuleDisplay(a))))];
  const filteredAssignments = filterModule === 'All' ? assignments : assignments.filter(a => getModuleDisplay(a) === filterModule);
  const visibleAssignments = filteredAssignments.filter(ass => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [ass.title, ass.description || '', ass.moduleCode, ass.moduleName || '', ass.format]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const stats = {
    open: assignments.filter(ass => getEffectiveStatus(ass) === 'Open').length,
    submitted: assignments.filter(hasSubmitted).length,
    urgent: assignments.filter(isUrgent).length,
    closed: assignments.filter(ass => getEffectiveStatus(ass) === 'Closed').length,
  };

  const displayDeadline = (deadline: string) => new Date(deadline).toLocaleString();
  const moduleLabel = filterModule === 'All' ? 'All My Modules' : filterModule;

  const handleSubmitClick = (assignment: AssignmentItem) => {
    pendingAssignmentRef.current = assignment.id;
    setPendingAssignmentTitle(assignment.title);
    setSubmissionMessage('');
    setShowSubmissionModal(true);
  };

  const openFilePickerForSubmission = () => {
    if (!pendingAssignmentRef.current) return;
    setShowSubmissionModal(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const assignmentId = pendingAssignmentRef.current;
    if (!file || !assignmentId) return;

    const user = getUser();
    if (!user?.id) {
      setToast({ type: 'error', message: 'You must be logged in to submit.' });
      return;
    }

    setUploadingId(assignmentId);
    setUploadProgress(10);

    try {
      const filePath = `${assignmentId}/${user.id}/${Date.now()}_${file.name}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      setUploadProgress(70);

      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setUploadProgress(85);

      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentId: user.id,
          fileName: file.name,
          filePath: publicUrl,
          submissionMessage,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Submission tracking failed');
      }

      setUploadProgress(100);
      setToast({ type: 'success', message: data.replaced ? 'File re-submitted successfully!' : 'File submitted successfully!' });
      await fetchAssignments();
    } catch (err: any) {
      console.error('Upload error:', err);
      setToast({ type: 'error', message: err.message || 'Upload failed. Please try again.' });
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
      setSubmissionMessage('');
      pendingAssignmentRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-up max-w-7xl mx-auto space-y-8 pb-12">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-bold shadow-2xl toast-enter ${
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-600 text-white'
            : 'border-red-500/30 bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-indigo-100 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Submission Note</p>
                <h3 className="text-lg font-black">Attach Message For Lecturer</h3>
              </div>
              <button onClick={() => setShowSubmissionModal(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment</p>
                <p className="text-sm font-bold text-slate-800 mt-1 line-clamp-2">{pendingAssignmentTitle}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" /> Optional Message
                </label>
                <textarea
                  value={submissionMessage}
                  onChange={(e) => setSubmissionMessage(e.target.value.slice(0, 1000))}
                  placeholder="Type an optional note for the lecturer (e.g., clarification, known issue, or version details)."
                  className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
                <p className="mt-1 text-[11px] font-semibold text-slate-400 text-right">{submissionMessage.length}/1000</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={openFilePickerForSubmission}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                >
                  Continue to File Upload <UploadCloud className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-6 py-7 shadow-xl shadow-slate-200/40 md:px-8 md:py-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-sage">
                <Sparkles className="h-3.5 w-3.5" />
                New student assignment hub
              </span>
              <span className="badge badge-slate">Auto-Enrolled: {academicContext.year}, {academicContext.semester}</span>
            </div>

            <div className="space-y-2">
              <h1 className="page-title text-3xl text-slate-900 md:text-4xl xl:text-[2.85rem]">
                Global Course Assignments
              </h1>
              <p className="page-subtitle max-w-3xl text-slate-600">
                All file submission drops published by lecturers for your enrolled modules, organized with clear status, urgency, and submission state.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Open', value: stats.open, tone: 'from-indigo-500 to-indigo-400', hint: 'Ready to submit' },
                { label: 'Urgent', value: stats.urgent, tone: 'from-rose-600 to-red-500', hint: 'Due soon' },
                { label: 'Submitted', value: stats.submitted, tone: 'from-emerald-600 to-green-500', hint: 'Already sent' },
                { label: 'Closed', value: stats.closed, tone: 'from-slate-600 to-slate-500', hint: 'Past deadline' },
              ].map(card => (
                <div key={card.label} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
                    <span className="text-base font-black">{card.value}</span>
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{card.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Focus mode</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Filter your work</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Search by title, module, or file format.</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Inbox className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm font-semibold text-slate-800 outline-none transition-all hover:border-indigo-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  {uniqueModules.map(m => (
                    <option key={m} value={m}>{m === 'All' ? 'All My Modules' : m}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {['All', ...uniqueModules.filter(m => m !== 'All').slice(0, 4)].map(module => (
                  <button
                    key={module}
                    type="button"
                    onClick={() => setFilterModule(module)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${filterModule === module ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {module === 'All' ? 'All modules' : module.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card animate-pulse overflow-hidden p-6">
              <div className="h-3 w-32 rounded-full bg-slate-100" />
              <div className="mt-4 h-6 w-3/4 rounded-full bg-slate-100" />
              <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="h-10 w-36 rounded-2xl bg-slate-100" />
                <div className="h-11 w-32 rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {loadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {visibleAssignments.map(ass => {
              const submitted = hasSubmitted(ass);
              const canSubmit = canSubmitNow(ass);
              const lateWindow = isInLateWindow(ass);
              const effectiveStatus = getEffectiveStatus(ass);
              const urgent = isUrgent(ass);
              const isUploading = uploadingId === ass.id;
              const accentBorder = submitted ? 'border-l-emerald-500' : urgent ? 'border-l-rose-500' : effectiveStatus === 'Closed' ? 'border-l-slate-300' : 'border-l-indigo-500';
              const statusTone = submitted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : urgent
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : effectiveStatus === 'Closed'
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200';
              const accentGlow = submitted
                ? 'from-emerald-50 via-white to-white'
                : urgent
                  ? 'from-rose-50 via-white to-white'
                  : 'from-indigo-50 via-white to-white';

              return (
                <div
                  key={ass.id}
                  className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br ${accentGlow} p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl md:p-6 ${accentBorder}`}
                >
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/60 blur-3xl" />
                  <div className="relative grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-slate bg-white/90 text-slate-700 shadow-sm">
                          {getModuleDisplay(ass)}
                        </span>
                        <span className={`badge ${statusTone}`}>
                          {submitted ? 'Submitted' : effectiveStatus === 'Closed' ? 'Closed' : 'Open'}
                        </span>
                        {lateWindow && (
                          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Late Window</span>
                        )}
                        {urgent && <span className="badge bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Due soon</span>}
                      </div>

                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">{ass.title}</h3>
                        {ass.description && (
                          <p className="mt-2 max-w-3xl line-clamp-2 text-sm font-medium leading-6 text-slate-600">{ass.description}</p>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deadline / Late Window End</p>
                            <p className="text-sm font-bold text-slate-800">{displayDeadline(ass.deadline)}</p>
                            <p className="text-[11px] text-slate-500">Until {displayDeadline(getGraceEndAt(ass).toISOString())}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Format</p>
                            <p className="text-sm font-bold text-slate-800">Accepts {ass.format}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-sm md:min-w-[240px]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Submission state</p>
                          <p className="mt-1 text-base font-black text-slate-900">
                            {submitted
                              ? (canSubmit ? 'Already sent (can replace)' : 'Already sent')
                              : effectiveStatus === 'Closed'
                                ? 'Submission locked'
                                : lateWindow
                                  ? 'Late submission period'
                                  : 'Ready to submit'}
                          </p>
                        </div>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${submitted ? 'bg-teal-100 text-teal-700' : effectiveStatus === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>
                          {submitted ? <CheckCircle2 className="h-5 w-5" /> : effectiveStatus === 'Closed' ? <Lock className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Format</p>
                          <p className="mt-1 text-sm font-black text-slate-900">{ass.format}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visibility</p>
                          <p className="mt-1 text-sm font-black text-slate-900">{effectiveStatus}</p>
                        </div>
                      </div>

                      {isUploading ? (
                        <div className="space-y-2 rounded-2xl bg-teal-50 px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-teal-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm font-black uppercase tracking-[0.2em]">Uploading</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-teal-100">
                            <div
                              className="h-full rounded-full bg-teal-600 transition-all duration-500"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : effectiveStatus === 'Closed' ? (
                        <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-4 text-slate-500">
                          <Lock className="h-5 w-5" />
                          <span className="text-sm font-black uppercase tracking-[0.2em]">Locked</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubmitClick(ass)}
                          className={`group/button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 ${submitted ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
                        >
                          {submitted ? 'Replace File' : (lateWindow ? 'Submit Late File' : 'Submit File')}
                          <UploadCloud className="h-4 w-4 transition-transform group-hover/button:-translate-y-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleAssignments.length === 0 && (
               <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/85 px-6 py-16 text-center shadow-sm">
                 <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                   <Inbox className="h-7 w-7" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight text-slate-900">No assignments match this view</h3>
                 <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
                   {searchQuery.trim()
                     ? `No results found for “${searchQuery.trim()}” in ${moduleLabel}.`
                     : `You don't have any assignments pending for ${moduleLabel}.`}
                 </p>
                 <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                   {searchQuery.trim() && (
                     <button
                       onClick={() => setSearchQuery('')}
                       className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                     >
                       Clear search
                     </button>
                   )}
                   {filterModule !== 'All' && (
                     <button
                       onClick={() => setFilterModule('All')}
                       className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                     >
                       Show all modules
                     </button>
                   )}
                 </div>
               </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
