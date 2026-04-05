import { useState, useEffect, useRef } from 'react';
import { Filter, Calendar, FileText, CheckCircle2, Clock, UploadCloud, ChevronDown, Loader2, X, AlertCircle } from 'lucide-react';
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
}

export default function StudentGlobalAssignments() {
  const [filterModule, setFilterModule] = useState('All');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/list`);
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const hasSubmitted = (assignment: AssignmentItem) => {
    const user = getUser();
    if (!user) return false;
    return assignment.assignmentSubmissions?.some((sub: any) => sub.studentId === user.id);
  };

  const getModuleDisplay = (ass: AssignmentItem) => {
    return ass.moduleName ? `${ass.moduleCode} - ${ass.moduleName}` : ass.moduleCode;
  };

  const uniqueModules = ['All', ...Array.from(new Set(assignments.map(a => getModuleDisplay(a))))];
  const filteredAssignments = filterModule === 'All' ? assignments : assignments.filter(a => getModuleDisplay(a) === filterModule);

  const getEffectiveStatus = (ass: AssignmentItem) => {
    if (ass.status === 'Closed') return 'Closed';
    if (new Date(ass.deadline) < new Date()) return 'Closed';
    return 'Open';
  };

  const handleSubmitClick = (assignmentId: string) => {
    pendingAssignmentRef.current = assignmentId;
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
      // 1. Upload to Supabase Storage
      const filePath = `${assignmentId}/${user.id}/${Date.now()}_${file.name}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      setUploadProgress(70);

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setUploadProgress(85);

      // 3. Track in backend
      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentId: user.id,
          fileName: file.name,
          filePath: publicUrl
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Submission tracking failed');
      }

      setUploadProgress(100);
      setToast({ type: 'success', message: data.replaced ? 'File re-submitted successfully!' : 'File submitted successfully!' });

      // Refresh assignments to update UI
      await fetchAssignments();
    } catch (err: any) {
      console.error('Upload error:', err);
      setToast({ type: 'error', message: err.message || 'Upload failed. Please try again.' });
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
      pendingAssignmentRef.current = null;
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-bold text-sm animate-fade-up ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Context */}
      <div className="page-header border-b-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-sage">Auto-Enrolled: {academicContext.year}, {academicContext.semester}</span>
          </div>
          <h1 className="page-title text-emerald-900">Global Course Assignments</h1>
          <p className="page-subtitle text-slate-500">All file submission drops published by lecturers for your enrolled modules.</p>
        </div>

        {/* Filter Panel */}
        <div className="flex items-center gap-3 relative">
          <div className="absolute left-3 top-2.5 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select 
             value={filterModule}
             onChange={(e) => setFilterModule(e.target.value)}
             className="appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
          >
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All My Modules' : m}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Assignment List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map(ass => {
              const submitted = hasSubmitted(ass);
              const effectiveStatus = getEffectiveStatus(ass);
              const isUrgent = new Date(ass.deadline).getTime() - new Date().getTime() < 86400000 * 3 && !submitted && effectiveStatus !== 'Closed';
              const isUploading = uploadingId === ass.id;
              
              return (
                <div key={ass.id} className={`card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all border-l-4 ${
                  submitted ? 'border-l-emerald-500' : isUrgent ? 'border-l-red-500' : 'border-l-emerald-500'
                }`}>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{getModuleDisplay(ass)}</span>
                      {isUrgent && <span className="badge bg-red-100/50 text-red-600 border-red-200 py-0.5 animate-pulse">Urgent!</span>}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{ass.title}</h3>
                    {ass.description && (
                      <p className="text-sm text-slate-500 font-medium mb-2 line-clamp-2">{ass.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Due {new Date(ass.deadline).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <FileText className="w-4 h-4" />
                        Accepts: {ass.format}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center md:border-l border-slate-100 md:pl-8">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 px-4 min-w-[140px]">
                        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Uploading...</span>
                      </div>
                    ) : submitted ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-600 px-4">
                         <CheckCircle2 className="w-8 h-8" />
                         <span className="text-xs font-black uppercase tracking-widest">Submitted</span>
                      </div>
                    ) : effectiveStatus === 'Closed' ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400 px-4">
                         <Clock className="w-8 h-8 opacity-50" />
                         <span className="text-xs font-black uppercase tracking-widest text-slate-400">Past Due</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleSubmitClick(ass.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 group"
                      >
                        Submit File <UploadCloud className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}

            {filteredAssignments.length === 0 && (
               <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                 <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-slate-800">No Assignments Found</h3>
                 <p className="text-slate-500 font-medium">You don't have any assignments pending for {filterModule === 'All' ? 'your enrolled modules' : filterModule}.</p>
               </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
