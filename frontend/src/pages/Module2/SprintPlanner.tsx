import { useForm } from 'react-hook-form';

export default function SprintPlanner() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const sprints = [
    { id: 1, name: 'Sprint 1 - Foundations', start: 'Oct 12', end: 'Oct 26', progress: 80, tasks: 12 },
    { id: 2, name: 'Sprint 2 - Core UI', start: 'Oct 27', end: 'Nov 10', progress: 35, tasks: 24 }
  ];

  const onSubmit = (data: any) => {
    console.log(data);
    alert('Sprint Created!');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-1">
        <div className="glass-panel p-8 animate-in slide-in-from-left duration-500">
          <h3 className="text-2xl font-black text-white mb-6">Plan New Sprint</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <input 
                {...register('name', { required: 'Sprint name required' })}
                placeholder="Sprint Name"
                className="glass-input"
              />
              {errors.name && <p className="text-red-400 text-xs font-bold mt-2">{errors.name.message as string}</p>}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
              <input type="date" {...register('start', { required: true })} className="glass-input" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">End Date</label>
              <input type="date" {...register('end', { required: true })} className="glass-input" />
            </div>
            <button type="submit" className="w-full btn-primary mt-4">
              Launch Sprint
            </button>
          </form>
        </div>
      </div>

      <div className="xl:col-span-2 space-y-6">
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md px-2">Active Sprints Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sprints.map((sprint, i) => (
            <div key={sprint.id} className={`glass-panel p-6 flex flex-col justify-between group cursor-pointer animate-in slide-in-from-bottom duration-700 delay-${i * 100}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors drop-shadow-md">{sprint.name}</h4>
                  <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-black tracking-wider border border-white/20 text-teal-300 shadow-inner">
                    {sprint.tasks} Tasks
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-bold text-slate-300 mb-8">
                  <span className="bg-black/40 px-3 py-2 rounded-lg border border-white/10 shadow-inner">Starts: {sprint.start}</span>
                  <span className="bg-black/40 px-3 py-2 rounded-lg border border-white/10 shadow-inner">Ends: {sprint.end}</span>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between text-[10px] font-black text-teal-300 mb-2 uppercase tracking-widest">
                  <span>Sprint Progress</span>
                  <span className="text-white drop-shadow-md">{sprint.progress}%</span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-3.5 border border-white/10 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full shadow-[0_0_15px_rgba(59,130,246,0.8)] relative overflow-hidden" style={{ width: `${sprint.progress}%` }}>
                     <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
