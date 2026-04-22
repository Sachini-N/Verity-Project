import { Link, useLocation } from 'react-router-dom';
import { Users, Download, UploadCloud, Bell, LogOut, User } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import { motion } from 'framer-motion';

const lecturerNav = [
  { label: 'My Groups', path: '/lecturer/projects', icon: Users },
  { label: 'Assignments', path: '/lecturer/assignments', icon: UploadCloud },
  { label: 'Announcements', path: '/lecturer/announcements', icon: Bell },
  { label: 'Grading Export', path: '/lecturer/export', icon: Download },
];
export default function LecturerNav() {
  const location = useLocation();

  const user = (() => {
    try { 
      const data = JSON.parse(sessionStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();

  const handleSignOut = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full px-3 py-2 flex items-center gap-1 sm:gap-2 transition-all max-w-[98vw]">
        <Link to="/lecturer/dashboard" className="flex items-center gap-2 pr-3 pl-2 border-r border-slate-200/60 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">V</span>
          </div>
          <span className="text-slate-800 font-extrabold text-sm tracking-tight hidden sm:block">Verity Lecturer</span>
        </Link>

        <div className="flex items-center gap-1 relative overflow-x-auto no-scrollbar max-w-[42vw] sm:max-w-none">
          {lecturerNav.map((item) => {
            const active = location.pathname.startsWith(item.path) && (item.path !== '/lecturer/projects' || location.pathname === '/lecturer/projects' || location.pathname.startsWith('/lecturer/projects/'));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-white/45'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill-lecturer"
                    className="absolute inset-0 bg-white shadow-[0_2px_10px_-3px_rgba(16,185,129,0.25)] border border-emerald-100 rounded-full"
                    transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="hidden lg:block tracking-wide">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 pl-3 border-l border-slate-200/60 shrink-0">
          <NotificationCenter />
          <Link to="/lecturer/profile" className="p-2 rounded-full hover:bg-white/60 text-slate-500 hover:text-emerald-600 transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </div>

  );
}
