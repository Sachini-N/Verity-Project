import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck, Users, Settings, BookOpen, Bell } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';

const managerNav = [
  { label: 'Approvals', path: '/manager/approvals', icon: ClipboardCheck },
  { label: 'Users', path: '/manager/users', icon: Users },
  { label: 'Groups', path: '/manager/groups', icon: Users },
  { label: 'Modules', path: '/manager/modules', icon: BookOpen },
  { label: 'Announcements', path: '/manager/announcements', icon: Bell },
  { label: 'System', path: '/manager/settings', icon: Settings },
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* University Strip - Crimson for Manager */}
      <div className="bg-rose-900 text-white px-6 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase opacity-90">
          Sri Lanka Institute of Information Technology · Administration
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 px-3 py-1 rounded-full text-white shadow-sm">
          Module Manager
        </span>
      </div>

      <div className="flex items-center justify-between px-6 h-16 max-w-screen-2xl mx-auto">
        <Link to="/manager/approvals" className="flex items-center gap-3 shrink-0 mr-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-900 to-red-700 flex items-center justify-center shadow-md border border-rose-950">
            <span className="text-white font-black text-sm drop-shadow-sm">V</span>
          </div>
          <span className="text-rose-900 font-black text-xl tracking-tight">Verity<span className="text-red-600">Sync</span></span>
        </Link>

        {/* Action-Oriented Nav Sections */}
        <nav className="hidden lg:flex items-center gap-2 h-full flex-1">
          {managerNav.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 h-full text-sm font-bold transition-all relative ${
                  active 
                    ? 'text-rose-900' 
                    : 'text-slate-500 hover:text-rose-900 hover:bg-rose-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-red-600' : 'text-slate-400'}`} />
                {item.label}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-900 rounded-t-full shadow-[0_-2px_8px_rgba(159,18,57,0.4)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Notification Bell + User Profile */}
        <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-200">
          <NotificationCenter />
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-900 mt-1">Platform Manager</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-200 flex items-center justify-center text-rose-900 text-sm font-black shadow-sm">
              {initials}
            </div>
          </div>
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
