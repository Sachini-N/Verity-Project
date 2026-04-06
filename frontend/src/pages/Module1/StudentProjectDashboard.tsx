import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, CheckSquare, Github, Folder, UploadCloud, Settings, Users, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectSettings from './ProjectSettings';
import XPProgressBar from '../../components/XPProgressBar';
import BadgeGrid from '../../components/BadgeGrid';

export default function StudentProjectDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    axios
      .get('http://localhost:5000/api/project/list')
      .then((r) => {
        if (cancelled || !r.data?.success || !Array.isArray(r.data.projects)) return;
        const p = r.data.projects.find((x: { id: string }) => x.id === id);
        if (p?.title) setProjectTitle(p.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tabs = [
    { name: 'Overview', path: `/student/projects/${id}`, icon: LayoutDashboard, exact: true },
    { name: 'Task Board', path: `/student/projects/${id}/kanban`, icon: CheckSquare, exact: false },
    { name: 'Weekly Reports', path: `/student/projects/${id}/reports/weekly`, icon: FileText, exact: false },
    { name: 'Code Repo', path: `/student/projects/${id}/github`, icon: Github, exact: false },
    { name: 'Drive', path: `/student/projects/${id}/files`, icon: Folder, exact: false },
    { name: 'Team Hub', path: `/student/projects/${id}/team`, icon: Users, exact: false },
    { name: 'Submissions', path: `/student/projects/${id}/submissions`, icon: UploadCloud, exact: false },
  ];

  return (
    <div className="flex flex-col h-full gap-8 relative z-10 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      {/* Hero Banner with Fluid Ocean Glass Gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] shrink-0 p-8 md:p-12 border border-white shadow-[0_4px_20px_-5px_rgba(129,140,248,0.15)] bg-gradient-to-r from-indigo-100/90 via-white to-teal-50/70 min-h-[220px] flex flex-col justify-end group"
      >
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/20" />
        <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-indigo-200/50 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute bottom-[-50%] left-[10%] w-[300px] h-[300px] bg-teal-200/40 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-indigo-500 border border-indigo-100 rounded-full shadow-sm">
                Active Project Workstream
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-2 text-slate-800">
              {projectTitle || 'Loading Project...'}
            </h1>
            <p className="text-slate-500 font-medium text-lg lg:text-xl">Project Workspace & Planning</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSettingsOpen(true)} className="px-6 py-3.5 bg-indigo-50 hover:bg-white text-indigo-600 rounded-2xl transition-all border border-indigo-100 shadow-sm hover:shadow-[0_10px_20px_-5px_rgba(129,140,248,0.3)] flex items-center gap-2 font-bold text-sm">
               <Settings className="w-5 h-5" /> Workspace Settings
             </button>
          </div>
        </div>
      </motion.div>
      
      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        {/* Sticky Vertical Sidebar */}
        <div className="w-full xl:w-64 shrink-0 xl:sticky xl:top-24 z-40 space-y-4">
          <nav className="flex flex-col gap-2 p-3 bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-[2rem]">
            {tabs.map(tab => {
              const active = tab.exact 
                ? location.pathname === tab.path 
                : location.pathname.startsWith(tab.path);
              
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative px-4 py-3.5 text-sm font-bold rounded-2xl transition-all flex items-center gap-3 ${
                    active 
                      ? 'text-indigo-700' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  {active && (
                     <motion.div
                       layoutId="dashboard-active-vertical-tab"
                       className="absolute inset-0 bg-white shadow-[0_4px_10px_-3px_rgba(129,140,248,0.15)] border border-slate-100 rounded-2xl"
                       transition={{ type: "spring", stiffness: 400, damping: 30 }}
                     />
                  )}
                  <span className="relative z-10 flex items-center gap-3 w-full">
                    <Icon strokeWidth={2.5} className={`w-5 h-5 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {tab.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Gamification Widget - XP Progress */}
          {id && <XPProgressBar userId={id} />}

          {/* Gamification Widget - Badges */}
          {id && <BadgeGrid userId={id} />}
        </div>

        {/* Dynamic Tab Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex-1 w-full min-w-0 pb-12"
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Render the Settings Modal */}
      <ProjectSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
