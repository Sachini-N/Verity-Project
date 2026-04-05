import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, FileText, Calendar, Clock, UploadCloud, CheckCircle2, ArrowLeft, Download, Eye, AlertCircle, Trash2, Loader2, Search } from 'lucide-react';
import { useModule } from '../../context/ModuleContext';

const API = 'http://localhost:5000/api/assignment';

interface AssignmentData {
  id: string;
  title: string;
  description: string | null;
  moduleCode: string;
  moduleName: string | null;
  deadline: string;
  format: string;
  maxSizeMB: number;
  status: string;
  createdById: string;
  assignmentSubmissions: any[];
  createdAt: string;
}

export default function LecturerAssignments() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [allAssignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedModule } = useModule();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const user = parsed?.user || parsed;
      const url = user?.id ? `${API}/lecturer?createdById=${user.id}` : `${API}/lecturer`;
      const res = await fetch(url);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAssignments(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredByModule = selectedModule === 'ALL'
    ? allAssignments
    : allAssignments.filter(a => a.moduleCode === selectedModule);

  const assignments = filteredByModule.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.moduleCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedAssignment) {
    return <AssignmentSubmissionsView assignment={selectedAssignment} onBack={() => setSelectedAssignment(null)} />;
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="page-header border-b-indigo-200 flex sm:items-center justify-between flex-col md:flex-row gap-6">
        <div>
          <h1 className="page-title text-indigo-900">Assignments & Submissions</h1>
          <p className="page-subtitle text-slate-500">Create global file submission drops for students to upload their work.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-900 hover:bg-indigo-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all shrink-0"
          >
            <Plus className="w-5 h-5" /> New Assignment
          </button>
        </div>
      </div>

      {isCreating ? (
        <AssignmentBuilder onCancel={() => setIsCreating(false)} onSave={() => {
          setIsCreating(false);
          fetchAssignments();
        }} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-800">No Assignments Found</h3>
          <p className="text-slate-500 font-medium mt-1">Try adjusting your search or module filter, or create a new one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map(ass => (
            <div 
              key={ass.id} 
              onClick={() => setSelectedAssignment(ass)}
              className="card p-5 border-l-4 border-l-indigo-600 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-sm font-bold text-indigo-700 bg-indigo-100/50 px-2.5 py-1 rounded-lg border border-indigo-200">{ass.moduleCode}</span>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-900 transition-colors">{ass.title}</h3>
                  <span className={`badge ${ass.status === 'Active' ? 'badge-amber' : 'badge-slate'}`}>{ass.status}</span>
                </div>
                {ass.description && (
                  <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-1">{ass.description}</p>
                )}
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Due {new Date(ass.deadline).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    {ass.format}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:border-l border-slate-200 md:pl-8">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-800">{ass.assignmentSubmissions?.length || 0}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Submissions</div>
                </div>
                <button 
                  onClick={(e) => handleDelete(ass.id, e)}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-slate-400 transition-colors shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  title="Delete Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-slate-500 transition-colors shadow-sm group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentBuilder({ onCancel, onSave }: { onCancel: () => void, onSave: () => void }) {
  const { selectedModule } = useModule();
  const [submitting, setSubmitting] = useState(false);
  const [modulesList, setModulesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const stored = sessionStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        const user = parsed?.user || parsed;
        const url = user?.id ? `http://localhost:5000/api/academic/modules?lecturerId=${user.id}` : 'http://localhost:5000/api/academic/modules';

        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          setModulesList(data);
        }
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      }
    };
    fetchModules();
  }, []);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '', desc: '', deadline: '', format: 'PDF', maxMB: 50, 
      moduleCode: selectedModule === 'ALL' ? '' : selectedModule,
      moduleName: ''
    }
  });

  const selectedCode = watch('moduleCode');
  useEffect(() => {
    if (selectedCode) {
       const found = modulesList.find(m => m.code === selectedCode);
       if (found && found.name) {
          setValue('moduleName', found.name);
       }
    }
  }, [selectedCode, modulesList, setValue]);

  const onSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const user = parsed?.user || parsed;
      
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.desc || null,
          moduleCode: formData.moduleCode,
          moduleName: formData.moduleName || null,
          deadline: formData.deadline,
          format: formData.format,
          maxSizeMB: Number(formData.maxMB) || 50,
          createdById: user?.id || null
        })
      });

      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        alert(data.message || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Create assignment error:', err);
      alert('Network error creating assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border-indigo-200 shadow-xl overflow-hidden animate-fade-up">
      <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-indigo-200 text-indigo-700">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-indigo-900">Configure New Assignment File Drop</h2>
          <p className="text-sm font-medium text-indigo-800/80 mt-1">Students will see this in their submission portals instantly after publishing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Target Module</label>
              <select {...register('moduleCode', { required: 'Module is required' })} 
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 appearance-none cursor-pointer ${errors.moduleCode ? 'border-red-400' : 'border-slate-200'}`} 
              >
                <option value="">-- Select Module --</option>
                {modulesList.map(m => (
                   <option key={m.id} value={m.code}>{m.code} - {m.name}</option>
                ))}
              </select>
              {errors.moduleCode && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.moduleCode.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Module Name (Auto-filled)</label>
              <input type="text" {...register('moduleName')} 
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-semibold cursor-not-allowed focus:outline-none" 
                placeholder="Automatically mapped..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Assignment Title</label>
              <input type="text" {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Must be at least 5 characters' } })} 
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${errors.title ? 'border-red-400' : 'border-slate-200'}`} 
                placeholder="e.g. Iteration 1 Source Code & Documentation" />
              {errors.title && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.title.message as string}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Instructions (Optional)</label>
              <textarea {...register('desc', { maxLength: { value: 500, message: 'Max 500 characters' } })} 
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 font-medium h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${errors.desc ? 'border-red-400' : 'border-slate-200'}`} 
                placeholder="Upload your code as a zip. Max 50MB." />
              {errors.desc && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.desc.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Submission Deadline</label>
              <div className="relative">
                <input type="datetime-local" {...register('deadline', { 
                  required: 'Deadline is required',
                  validate: (val) => new Date(val) > new Date() || 'Deadline must be in the future'
                })} 
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full bg-slate-50 border rounded-xl px-10 py-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${errors.deadline ? 'border-red-400' : 'border-slate-200'}`} />
                <Clock className="w-5 h-5 text-amber-600 absolute left-3 top-3.5" />
              </div>
              {errors.deadline && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.deadline.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Allowed File Types</label>
              <select {...register('format', { required: 'Format is required' })} 
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${errors.format ? 'border-red-400' : 'border-slate-200'}`}
              >
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="ZIP">Archive (.zip, .rar)</option>
                <option value="DOCX, PDF">Document (.docx, .pdf)</option>
                <option value="ANY">Any File Format</option>
              </select>
              {errors.format && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.format.message as string}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-100 justify-end">
          <button type="button" onClick={onCancel} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-8 py-3 bg-indigo-900 hover:bg-indigo-900 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {submitting ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AssignmentSubmissionsView({ assignment, onBack }: { assignment: AssignmentData, onBack: () => void }) {
  const [submissions, setSubmissions] = useState<any[]>(assignment.assignmentSubmissions || []);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/${assignment.id}/results`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [assignment.id]);

  const getRiskBadge = (category: string | null) => {
    switch (category) {
      case 'High': return <span className="badge bg-red-100 text-red-700 border-red-200">High Risk</span>;
      case 'Medium': return <span className="badge bg-amber-100 text-amber-700 border-amber-200">Medium Risk</span>;
      case 'Low': return <span className="badge bg-emerald-100 text-emerald-700 border-emerald-200">Low Risk</span>;
      default: return <span className="badge badge-slate">Pending</span>;
    }
  };

  return (
    <div className="animate-fade-up max-w-6xl mx-auto space-y-6">
      
      {/* Navigation & Context */}
      <button 
        onClick={onBack}
        className="text-slate-500 hover:text-indigo-900 font-bold text-sm flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </button>

      <div className="card p-6 bg-gradient-to-br from-white to-amber-50/50 border-indigo-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-800 bg-amber-100 px-2 py-0.5 rounded shadow-sm border border-indigo-200">{assignment.moduleCode}</span>
            <span className={`badge ${assignment.status === 'Active' ? 'badge-amber' : 'badge-slate'}`}>{assignment.status}</span>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {new Date(assignment.deadline).toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-black text-indigo-900 tracking-tight">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-slate-600 font-medium mt-2">{assignment.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={fetchResults}
             disabled={loading}
             className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all"
             title="Refresh Results"
           >
             <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <div className="flex gap-4 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <div className="text-center px-4 border-r border-slate-100">
                <div className="text-2xl font-black text-emerald-600">{submissions.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
              </div>
              <div className="text-center px-4">
                <div className="text-2xl font-black text-red-600">{matches.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plagiarism Matches</div>
              </div>
           </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-black text-slate-800">Student Submissions & AI Analysis</h3>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Low Risk
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div> Med Risk
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div> High Risk
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-700">No Submissions Yet</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">Students haven't submitted any files for this assignment yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Student</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">AI Score</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Similarity</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Risk Badge</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {(sub.student?.name || 'S').split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{sub.student?.name || 'Student'}</div>
                          <div className="text-xs font-semibold text-slate-500">{sub.student?.indexNumber || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       {sub.checkStatus === 'Completed' ? (
                           sub.aiScore != null && sub.aiScore !== undefined ? (
                             <div className="flex flex-col">
                                 <div className={`text-sm font-black ${sub.aiScore > 70 ? 'text-red-600' : sub.aiScore > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                     {Number(sub.aiScore).toFixed(1)}%
                                 </div>
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">AI probability</div>
                             </div>
                           ) : (
                             <div className="flex flex-col max-w-[140px]">
                               <span className="text-xs text-slate-500 font-semibold" title="Set SAPLING_API_KEY or HUGGINGFACE_API_KEY in the backend .env file.">
                                 Not available
                               </span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase">No AI API key</span>
                             </div>
                           )
                       ) : sub.checkStatus === 'Processing' || sub.checkStatus === 'Pending' ? (
                           <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                       ) : sub.checkStatus === 'Skipped' ? (
                           <span className="text-xs text-slate-400" title="Only PDF uploads are analyzed automatically.">Skipped</span>
                       ) : (
                           <span className="text-xs text-slate-400">N/A</span>
                       )}
                    </td>
                    <td className="py-4 px-6">
                       {sub.checkStatus === 'Completed' ? (
                           <div className="flex flex-col">
                               <div className={`text-sm font-black ${(sub.plagiarismScore ?? 0) > 70 ? 'text-red-600' : (sub.plagiarismScore ?? 0) > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                   {Number(sub.plagiarismScore ?? 0).toFixed(1)}%
                               </div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase">Max similarity</div>
                           </div>
                       ) : (
                           <span className="text-xs text-slate-400">—</span>
                       )}
                    </td>
                    <td className="py-4 px-6">
                       {sub.checkStatus === 'Completed' ? getRiskBadge(sub.riskCategory)
                         : sub.checkStatus === 'Failed' ? (
                           <span className="badge bg-red-50 text-red-700 border border-red-200" title="e.g. PDF download or text extraction failed — check server logs.">Check failed</span>
                         ) : sub.checkStatus === 'Skipped' ? (
                           <span className="badge badge-slate">Skipped</span>
                         ) : sub.checkStatus === 'Processing' || sub.checkStatus === 'Pending' ? (
                           <span className="text-xs text-slate-400 italic">{sub.checkStatus}</span>
                         ) : (
                           <span className="text-xs text-slate-400 italic">{sub.checkStatus}</span>
                         )}
                    </td>
                    <td className="py-4 px-6">
                      {sub.late ? (
                        <span className="badge badge-amber py-0.5 px-2 text-[10px] border border-amber-200">Late</span>
                      ) : (
                        <span className="badge badge-green py-0.5 px-2 text-[10px] border border-emerald-200">On Time</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                            href={sub.filePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" 
                            title="Download File"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Plagiarism Matches Section */}
      {matches.length > 0 && (
          <div className="card p-6 border-red-100 bg-red-50/20">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-black text-slate-900">Detected Cross-Submission Matches</h3>
                      <p className="text-sm font-medium text-slate-500">The following pairs of students have submitted highly similar content.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any) => (
                      <div key={match.id} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student A</div>
                                  <div className="font-bold text-slate-800">{match.submissionA?.student?.name}</div>
                              </div>
                              <div className="flex flex-col items-center px-4 border-x border-slate-100">
                                  <div className={`text-xl font-black ${match.similarityScore > 85 ? 'text-red-600' : 'text-amber-600'}`}>{match.similarityScore}%</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Match</div>
                              </div>
                              <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student B</div>
                                  <div className="font-bold text-slate-800">{match.submissionB?.student?.name}</div>
                              </div>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
