import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TimeTracker() {
  const { id } = useParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const resp = await axios.get(`http://localhost:5000/api/task/list/${id}`);
        if (resp.data.success) { setTasks(resp.data.tasks); }
      } catch (e) { console.error('Error fetching tasks', e); }
    };
    if (id) fetchTasks();
  }, [id]);

  const onSubmit = async (data: any) => {
    try {
      await axios.post('http://localhost:5000/api/task/log-time', {
        taskId: data.task,
        hours: data.hours
      });
      alert('Time logged successfully!');
      reset();
    } catch (e) {
      console.error('Error logging time', e);
      alert('Failed to log time');
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass-panel p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Time Tracking</h2>
          <p className="text-sm font-bold text-teal-300 mt-2 uppercase tracking-widest">Log hours to build your contribution score.</p>
        </div>
        <div className="flex gap-6">
          <div className="glass-panel bg-gradient-to-br from-emerald-900/60 to-black/40 p-5 rounded-2xl border-emerald-500/30 flex flex-col justify-center items-end shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Hours This Week</span>
            <span className="text-4xl font-black text-white drop-shadow-md">24.5<span className="text-sm text-slate-500 ml-1">hrs</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-panel p-8">
            <h3 className="text-xl font-black text-white mb-6">Log Manual Focus Time</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Select Active Task</label>
                  <select {...register('task', { required: true })} className="glass-input !py-4 font-black">
                    <option value="" className="text-slate-900 font-bold">-- Choose Task --</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id} className="text-slate-900 font-bold">{t.title}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Duration (Hours)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    {...register('hours', { 
                      required: 'Hours are required',
                      min: { value: 0.1, message: 'Must be positive' },
                      max: { value: 24, message: 'Cannot exceed 24 hours in a single log' }
                    })} 
                    placeholder="e.g. 4.5"
                    className="glass-input !py-4 text-xl"
                  />
                  {errors.hours && <p className="text-red-400 text-xs font-black mt-2 drop-shadow-md">{errors.hours.message as string}</p>}
               </div>
               <button type="submit" className="w-full btn-primary mt-6 !py-5 text-lg">Commit Time Log</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel p-8 h-full">
             <h3 className="text-xl font-black text-white mb-10">Workload Allocation Report</h3>
             
             {/* Fake Workload Chart / Summary */}
             <div className="space-y-8">
                <div className="group">
                   <div className="flex justify-between text-sm font-black text-slate-300 mb-3">
                     <span className="group-hover:text-emerald-400 transition-colors tracking-wide">Development & Coding</span>
                     <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">18 hrs</span>
                   </div>
                   <div className="w-full bg-black/50 rounded-full h-5 border border-white/5 overflow-hidden shadow-inner">
                     <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full shadow-[0_0_15px_rgba(52,211,153,0.6)] rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
                   </div>
                </div>

                <div className="group">
                   <div className="flex justify-between text-sm font-black text-slate-300 mb-3">
                     <span className="group-hover:text-amber-400 transition-colors tracking-wide">Planning & Meetings</span>
                     <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">4 hrs</span>
                   </div>
                   <div className="w-full bg-black/50 rounded-full h-5 border border-white/5 overflow-hidden shadow-inner">
                     <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full shadow-[0_0_15px_rgba(245,158,11,0.6)] rounded-full transition-all duration-1000" style={{ width: '20%' }}></div>
                   </div>
                </div>

                <div className="group">
                   <div className="flex justify-between text-sm font-black text-slate-300 mb-3">
                     <span className="group-hover:text-emerald-400 transition-colors tracking-wide">Research & Documentation</span>
                     <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">2.5 hrs</span>
                   </div>
                   <div className="w-full bg-black/50 rounded-full h-5 border border-white/5 overflow-hidden shadow-inner">
                     <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full shadow-[0_0_15px_rgba(168,85,247,0.6)] rounded-full transition-all duration-1000" style={{ width: '15%' }}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
