import { Link, useLocation } from 'react-router-dom';
import { Users, ShieldAlert, Download, UploadCloud } from 'lucide-react';
import { useModule } from '../../context/ModuleContext';
import { useState, useEffect } from 'react';
import NotificationCenter from '../NotificationCenter';

const lecturerNav = [
  { label: 'My Groups', path: '/lecturer/projects', icon: Users },
  { label: 'Assignments', path: '/lecturer/assignments', icon: UploadCloud },
  { label: 'Risk Alerts', path: '/lecturer/alerts', icon: ShieldAlert },
  { label: 'Grading Export', path: '/lecturer/export', icon: Download },
];
export default function LecturerNav() {
  const location = useLocation();
  const { selectedModule, setSelectedModule } = useModule();
  const [modules, setModules] = useState<any[]>([{ id: 'ALL', name: 'All Modules' }]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const stored = localStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        const user = parsed?.user || parsed;
        const url = user?.id ? `http://localhost:5000/api/academic/modules?lecturerId=${user.id}` : 'http://localhost:5000/api/academic/modules';

        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((m: any) => ({
             id: m.code, 
             name: `${m.code} - ${m.name}`
          }));
          setModules([{ id: 'ALL', name: 'All Modules' }, ...formatted]);
        }
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      }
    };
    fetchModules();
  }, []);

  const user = (() => {
    try { 
      const data = JSON.parse(localStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'LR';

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* University Strip - distinct indigo for lecturer */}
      <div className="bg-indigo-900 text-white px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider uppercase opacity-90 hidden sm:inline-block">
          Sri Lanka Institute of Information Technology · Academic Portal
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-0.5 border border-white/10 shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-200">Context:</span>
            <select 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right center', backgroundRepeat: 'no-repeat', backgroundSize: '12px' }}
            >
              {modules.map(m => (
                <option key={m.id} value={m.id} className="text-slate-900 font-medium">{m.name}</option>
              ))}
            </select>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 px-3 py-1 rounded-full text-white shadow-sm shrink-0 ml-auto sm:ml-0">
            Lecturer Mode
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex items-center justify-between px-6 h-16 max-w-screen-2xl mx-auto">
        
        {/* Logo */}
        <Link to="/lecturer/projects" className="flex items-center gap-3 shrink-0 mr-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center shadow-md border border-amber-900">
            <span className="text-white font-black text-sm drop-shadow-sm">V</span>
          </div>
          <span className="text-indigo-900 font-black text-xl tracking-tight">Verity<span className="text-indigo-600">Sync</span></span>
        </Link>

        {/* Action-Oriented Nav Sections */}
        <nav className="hidden lg:flex items-center gap-2 h-full flex-1">
          {lecturerNav.map((item) => {
            const active = location.pathname.startsWith(item.path) && (item.path !== '/lecturer/projects' || location.pathname === '/lecturer/projects' || location.pathname.startsWith('/lecturer/projects/'));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 h-full text-sm font-bold transition-all relative ${
                  active 
                    ? 'text-indigo-900' 
                    : 'text-slate-500 hover:text-indigo-900 hover:bg-indigo-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
                {/* Active Indicator Bar */}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-900 rounded-t-full shadow-[0_-2px_8px_rgba(120,53,15,0.4)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Notification Bell + User Profile */}
        <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-200">
          <NotificationCenter />
          <Link to="/lecturer/profile" className="hidden sm:flex items-center gap-3 p-1.5 px-3 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group border border-transparent hover:border-indigo-100">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 leading-none group-hover:text-indigo-700 transition-colors">{user?.name || 'Lecturer'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-900 mt-1">Supervising Lecturer</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-900 text-sm font-black shadow-sm group-hover:scale-105 transition-transform">
              {initials}
            </div>
          </Link>
          <button 
            onClick={handleSignOut}
            className="text-xs font-bold text-slate-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

  );
}
