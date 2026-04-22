import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Users, BookOpen, Bell, LogOut, Shield, Activity } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import { motion } from 'framer-motion';

const managerNav = [
  { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
  { label: 'Users', path: '/manager/users', icon: Users },
  { label: 'Groups', path: '/manager/groups', icon: Users },
  { label: 'Modules', path: '/manager/modules', icon: BookOpen },
  { label: 'Announcements', path: '/manager/announcements', icon: Bell },
  { label: 'Usage', path: '/manager/usage', icon: Activity },
];

export default function ManagerNav() {
  const location = useLocation();

  const user = (() => {
    try { 
      const data = JSON.parse(sessionStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'MG';

  const handleSignOut = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_34px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full px-3 py-2 flex items-center gap-1 sm:gap-2 transition-all max-w-[98vw]">
        <Link to="/manager/dashboard" className="flex items-center gap-2 pr-3 pl-2 border-r border-slate-200/60 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">V</span>
          </div>
          <span className="text-slate-800 font-extrabold text-sm tracking-tight hidden sm:block">Verity Manager</span>
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider">
            <Shield className="w-3 h-3" /> Admin
          </span>
        </Link>

        <div className="flex items-center gap-1 relative overflow-x-auto no-scrollbar max-w-[46vw] sm:max-w-none">
          {managerNav.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap ${
                  active ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800 hover:bg-white/45'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill-manager"
                    className="absolute inset-0 bg-white shadow-[0_2px_10px_-3px_rgba(37,99,235,0.28)] border border-blue-100 rounded-full"
                    transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="hidden lg:block tracking-wide">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 pl-3 border-l border-slate-200/60 shrink-0">
          <NotificationCenter />
          <div className="hidden sm:flex items-center gap-2.5 px-2 py-1 rounded-full bg-white/55 border border-slate-100">
            <div className="text-right leading-tight">
              <p className="text-xs font-black text-slate-800">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mt-0.5">Platform Manager</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800 text-xs font-black shadow-sm">
              {initials}
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
