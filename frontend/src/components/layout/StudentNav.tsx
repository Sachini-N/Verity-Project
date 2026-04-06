import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from '../NotificationCenter';

const studentNav = [
  { label: 'Dashboard', path: '/student/projects', exact: true },
  { label: 'Projects', path: '/student/my-projects' },
  { label: 'Assignments', path: '/student/assignments' },
  { label: 'Announcements', path: '/student/announcements' },
  { label: 'Calendar', path: '/student/calendar' },
];

export default function StudentNav() {
  const location = useLocation();

  const user = (() => {
    try { 
      const data = JSON.parse(sessionStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST';
  const handleSignOut = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full px-3 py-2 flex items-center gap-1 sm:gap-2 transition-all">
        
        {/* Logo */}
        <Link to="/student/projects" className="flex items-center gap-2 pr-3 pl-2 border-r border-slate-200/60 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">V</span>
          </div>
          <span className="text-slate-800 font-extrabold text-sm tracking-tight hidden sm:block">Verity</span>
        </Link>

        {/* Dynamic Island Links */}
        <div className="flex items-center gap-1 relative overflow-x-auto no-scrollbar max-w-[50vw] sm:max-w-none">
          {studentNav.map((item) => {
            const active = item.exact 
              ? location.pathname === item.path || location.pathname === '/student/projects'
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap ${
                  active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill-nav"
                    className="absolute inset-0 bg-white shadow-[0_2px_10px_-3px_rgba(129,140,248,0.2)] border border-slate-100 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="hidden md:block tracking-wide">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: Notifications + User Actions */}
        <div className="flex items-center gap-1 pl-3 border-l border-slate-200/60 shrink-0">
          {/* Notification Bell */}
          <NotificationCenter />
          
          {/* Profile */}
          <Link to="/student/profile" className="p-2 rounded-full hover:bg-white/60 text-slate-500 hover:text-indigo-600 transition-colors">
            <User className="w-5 h-5" />
          </Link>
          
          {/* Sign Out */}
          <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
