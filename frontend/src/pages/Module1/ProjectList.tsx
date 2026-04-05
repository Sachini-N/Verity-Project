import { Link } from 'react-router-dom';
import { Target, Clock, AlertTriangle, ArrowRight, BrainCircuit, Users, CheckCircle, BarChart3, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/project/list');
        if (response.data.success) {
          const mapped = response.data.projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            module: p.description?.match(/^\[(.*?)\]/)?.[1] || 'IT3022 - Software Engineering',
            progress: 35, // Mock
            status: p.status
          }));
          setProjects(mapped);
        }
      } catch (error) {} finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2 relative">
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Academic Overview</h1>
         <div className="relative overflow-hidden w-full h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-100/80 via-white to-teal-50/50 border border-white shadow-[0_4px_20px_-5px_rgba(129,140,248,0.15)] flex items-center px-10">
            {/* Soft Ocean Glass internal blur */}
            <div className="absolute inset-0 backdrop-blur-[2px] bg-white/20" />
            <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-indigo-200/40 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-50%] left-[20%] w-[200px] h-[200px] bg-teal-200/30 rounded-full blur-[60px]" />
            
            <div className="relative z-10 flex w-full justify-between items-center">
               <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">University Academic Hub</div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-2">University Academic Hub Academic Clarity</h2>
                  <p className="text-slate-500 font-medium text-xl">Welcome Back, Saman!</p>
               </div>
               
               {/* Extracted Mockup Graphic */}
               <div className="hidden lg:block relative p-6 bg-white/40 backdrop-blur-xl border border-white rounded-[2rem] shadow-sm transform rotate-3">
                  <div className="text-6xl">🎓</div>
                  <div className="absolute -top-3 -right-3 text-2xl animate-pulse">✨</div>
                  <div className="absolute bottom-2 -left-4 text-xl">✨</div>
               </div>
            </div>
         </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* Wave Chart Widget */}
         <div className="col-span-1 lg:col-span-8 h-[320px] rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] p-8 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.1)] transition-all">
            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Project Progress</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Custom SVG wave animation tracking stats</p>
               </div>
               <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">↑ 10.20%</div>
            </div>
            
            {/* SVG Wave Mockup */}
            <div className="absolute bottom-0 left-0 w-full h-[60%] flex gap-0 group-hover:scale-[1.02] transition-transform origin-bottom">
               <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full text-indigo-500 opacity-20">
                  <path d="M0,150 C200,300 300,0 500,150 C700,300 800,0 1000,150 L1000,300 L0,300 Z" fill="currentColor"></path>
               </svg>
               <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full text-indigo-600 opacity-60">
                  <path d="M0,200 C300,50 400,300 700,100 C900,0 950,200 1000,200 L1000,300 L0,300 Z" fill="url(#grad1)"></path>
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
               </svg>
               {/* Data Points */}
               <div className="absolute top-[30%] left-[25%] w-3 h-3 bg-white border-2 border-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
               <div className="absolute bottom-[20%] right-[30%] w-4 h-4 bg-white border-4 border-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                 <div className="absolute w-[1px] h-[300px] bg-indigo-200 -bottom-4 left-1/2 -z-10"></div>
                 <div className="absolute whitespace-nowrap bg-indigo-600 text-white text-[10px] w-20 text-center font-bold px-2 py-1 rounded-md top-6 -left-8">Today</div>
               </div>
            </div>
         </div>

         {/* Upcoming Deadlines Widget */}
         <div className="col-span-1 lg:col-span-4 h-[320px] rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 px-2 flex items-center justify-between">
              Upcoming Deadlines
              <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">•••</span>
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
               {[
                 { id: 1, title: 'Assignment 1', sub: 'Assignments', time: '10-20', color: 'indigo' },
                 { id: 2, title: 'Assignment 2', sub: 'Assignments', time: '10-20', color: 'teal' },
                 { id: 3, title: 'Assignment 3', sub: 'Assignments', time: '15:50', color: 'amber' },
                 { id: 4, title: 'Assignment 4', sub: 'Project 4', time: '13:50', color: 'sky' }
               ].map(item => (
                 <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-transparent shadow-sm hover:border-slate-200 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className={`w-1.5 h-8 rounded-full bg-${item.color}-400`} />
                       <div>
                         <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                         <p className="text-xs text-slate-500 font-medium">{item.sub}</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 rounded-lg text-slate-600 font-mono text-xs font-bold border border-slate-100 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.time}
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* AI Recs */}
         <div className="col-span-1 lg:col-span-4 h-[220px] rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] p-6 hover:scale-[1.01] hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.1)] transition-all flex flex-col justify-between overflow-hidden relative">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Aura AI Recommendations</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-[200px]">A smart journal suggesting personalized framing learnings.</p>
            </div>
            {/* Visual Node net Graphic mock */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 opacity-80">
               <svg viewBox="0 0 100 100">
                  <circle cx="20" cy="80" r="4" fill="#818CF8" />
                  <circle cx="50" cy="50" r="8" fill="#38BDF8" className="animate-pulse" />
                  <circle cx="80" cy="70" r="5" fill="#818CF8" />
                  <circle cx="80" cy="20" r="3" fill="#38BDF8" />
                  <line x1="20" y1="80" x2="50" y2="50" stroke="#E2E8F0" strokeWidth="2" />
                  <line x1="50" y1="50" x2="80" y2="70" stroke="#E2E8F0" strokeWidth="2" />
                  <line x1="50" y1="50" x2="80" y2="20" stroke="#E2E8F0" strokeWidth="2" />
               </svg>
            </div>
         </div>

         {/* Academic Insights */}
         <div className="col-span-1 lg:col-span-8 h-[220px] rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] p-6 flex flex-col md:flex-row items-center gap-6 group hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.1)] transition-all">
             <div className="flex-1">
               <h3 className="text-lg font-bold text-slate-800 mb-2">Academic Insights</h3>
               <p className="text-xs text-slate-500 font-medium max-w-[220px] leading-relaxed mb-6">Minimalist key performance metrics with unique graphical citations.</p>
               <div className="flex gap-2">
                 <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Users className="w-5 h-5" /></div>
                 <div className="p-2 bg-teal-50 text-teal-500 rounded-xl"><Target className="w-5 h-5" /></div>
               </div>
             </div>
             
             {/* Chart Bar Mock */}
             <div className="flex-1 h-full w-full bg-slate-50 rounded-2xl flex items-end justify-around px-4 border border-slate-100 pt-10 relative">
                <div className="absolute top-3 left-4 right-4 flex justify-between text-[10px] font-bold text-slate-400">
                  <span className="px-2 py-1 bg-white rounded-md shadow-sm">38° Avg Att.</span>
                  <span className="px-2 py-1 bg-white rounded-md shadow-sm">3.33K Score</span>
                </div>
                {[40, 70, 30, 80, 50, 100, 60, 45].map((h, i) => (
                  <div key={i} className={`w-4 rounded-t-md ${i % 3 === 0 ? 'bg-teal-400' : 'bg-indigo-400'} shadow-sm origin-bottom group-hover:scale-y-110 transition-transform duration-500`} style={{ height: `${h}%` }} />
                ))}
             </div>
         </div>

         {/* Projects Quick Access */}
         <div className="col-span-1 lg:col-span-12 mt-4 space-y-4">
           <h3 className="text-xl font-bold text-slate-800 px-2 flex items-center justify-between">
              Active Projects
              <Link to="/student/projects/new" className="text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors">Start New Group</Link>
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <Link key={proj.id} to={`/student/projects/${proj.id}`} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between min-h-[160px]">
                   <div className="flex items-start justify-between mb-2">
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-lg border border-indigo-100">{proj.module}</span>
                     {proj.status === 'Pending' && <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>}
                   </div>
                   <h4 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{proj.title}</h4>
                   <div className="mt-4 flex items-center gap-3">
                     <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                     </div>
                     <span className="text-xs font-bold text-slate-500">{proj.progress}%</span>
                   </div>
                </Link>
              ))}
              {!loading && projects.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-500 font-medium">No projects available.</div>
              )}
           </div>
         </div>
         
      </div>
    </div>
  );
}
