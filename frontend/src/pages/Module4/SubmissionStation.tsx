import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

type SubmissionFormData = {
  milestone: 'proposal' | 'progress1' | 'progress2' | 'final' | '';
  branch: string;
  notes: string;
  reportFile: FileList;
};

type SubmissionItem = {
  id: string;
  title: string;
  milestone: string;
  expectedWeek: number | null;
  status: string;
  date: string;
};

const milestoneOptions = [
  { value: 'proposal', label: 'Project Proposal', week: 1 },
  { value: 'progress1', label: 'Progress Report 1', week: 5 },
  { value: 'progress2', label: 'Progress Report 2', week: 10 },
  { value: 'final', label: 'Final Report', week: 14 }
] as const;

export default function SubmissionStation() {
  const { id } = useParams();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SubmissionFormData>({
    defaultValues: {
      milestone: '',
      branch: 'main',
      notes: ''
    }
  });

  const [history, setHistory] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const resp = await axios.get(`http://localhost:5000/api/submission/list/${id}`);
      if (resp.data.success) {
        setHistory((resp.data.submissions || []).map((s: any) => ({
          id: s.id,
          title: s.originalName,
          milestone: s.meta?.milestone || 'Submission',
          expectedWeek: Number.isFinite(s.meta?.expectedWeek) ? Number(s.meta.expectedWeek) : null,
          status: s.status,
          date: new Date(s.createdAt).toLocaleDateString()
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) fetchSubmissions();
  }, [id]);

  const currentMilestone = watch('milestone');
  const selectedMilestone = milestoneOptions.find((m) => m.value === currentMilestone);

  const onSubmit = async (data: SubmissionFormData) => {
    setLoading(true);
    try {
      const selectedFile = data.reportFile?.[0];
      if (!selectedFile) {
        alert('Please attach the report PDF before submitting.');
        return;
      }

      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        alert('Only PDF files are accepted for report submission.');
        return;
      }

      const formData = new FormData();
      formData.append('projectId', String(id || ''));
      formData.append('milestone', data.milestone);
      formData.append('branch', data.branch);
      formData.append('notes', data.notes);
      formData.append('documentName', selectedMilestone ? selectedMilestone.label : selectedFile.name);
      formData.append('file', selectedFile);

      await axios.post('http://localhost:5000/api/submission/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Report submitted successfully. Lecturer can now review it.');
      reset({ milestone: '', branch: 'main', notes: '' });
      fetchSubmissions();
    } catch (e) {
      console.error(e);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="xl:col-span-2 bg-white rounded-2xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight relative z-10">Compile Submission</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Milestone Target</label>
                 <select {...register('milestone', { required: true })} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium appearance-none">
                   <option value="">-- Select Milestone --</option>
                     {milestoneOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label} (Week {item.week})</option>
                     ))}
                 </select>
                   {errors.milestone && <p className="text-[11px] text-rose-500 mt-1">Milestone is required.</p>}
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Repository Branch</label>
                 <select {...register('branch', { required: true })} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium appearance-none">
                   <option value="main">main (production)</option>
                   <option value="dev">develop (staging)</option>
                 </select>
              </div>
           </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Report PDF</label>
                <input
                 type="file"
                 accept="application/pdf,.pdf"
                 {...register('reportFile', { required: true })}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 file:mr-4 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold file:px-3 file:py-2 file:rounded-lg"
                />
                {errors.reportFile && <p className="text-[11px] text-rose-500 mt-1">Please attach a PDF report.</p>}
              </div>

           <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Submission Notes</label>
              <textarea 
                {...register('notes', { required: true })}
                 className="w-full h-32 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium resize-none placeholder-slate-400" 
                placeholder="Deployment instructions, environment variables, or specific evaluator focuses..."
              ></textarea>
           </div>
           
              <div className="bg-teal-50 border border-teal-100 p-6 rounded-xl flex items-start gap-4 mt-6">
                <svg className="w-6 h-6 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                  <h4 className="font-bold text-teal-800 mb-1 text-sm">Pre-flight Checks Selected & Passed</h4>
                      <p className="text-sm text-teal-700/80 leading-relaxed max-w-lg font-medium">Scheduled report cadence: Proposal (Week 1), Progress 1 (Week 5), Progress 2 (Week 10), Final (Week 14). Upload only PDF documents for lecturer review.</p>
              </div>
           </div>

              <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3.5 font-bold text-[15px] transition-all shadow-sm shadow-indigo-200 mt-2 disabled:opacity-50">
             {loading ? 'Submitting...' : 'Submit Report PDF'}
           </button>
        </form>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Submission Core Log</h3>
          <Link to={`/lecturer/projects/${id}/submissions/review`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Lecturer Review
          </Link>
        </div>
        
        <div className="space-y-4">
          {history.map((sub, idx) => (
             <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
               <div className="flex justify-between items-start mb-5">
                 <h4 className="text-[17px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{sub.title}</h4>
                 <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    sub.status === 'Graded' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                 }`}>
                   {sub.status}
                 </span>
               </div>

               <p className="text-xs text-slate-500 mb-4 font-semibold">{sub.milestone}{sub.expectedWeek ? ` - Week ${sub.expectedWeek}` : ''}</p>
               
               <div className="flex items-end justify-between mt-auto">
                 <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Review</span>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">Pending</span>
                 </div>
                 <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{sub.date}</span>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
