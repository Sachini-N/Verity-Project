import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  // Basic menu spanning the modules for demonstration of linkage
  const menuItems = [
    { label: 'Projects & Teams', path: '/projects', section: 'M1' },
    { label: 'Team Management', path: '/projects/1/team', section: 'M1' },
    { label: 'Task Kanban', path: '/projects/1/kanban', section: 'M2' },
    { label: 'Workload & Time', path: '/projects/1/time', section: 'M2' },
    { label: 'Fairness Analytics', path: '/projects/1/analytics', section: 'M3' },
    { label: 'Weekly Reports', path: '/projects/1/reports/weekly', section: 'M3' },
    { label: 'Technical Evidence', path: '/projects/1/github', section: 'M4' },
    { label: 'Submissions', path: '/projects/1/submissions', section: 'M4' },
  ];

  const isActive = (path: string) => {
      if (path === '/projects' && location.pathname !== '/projects') return false; 
      return location.pathname.startsWith(path);
  }

  return (
    <aside className="w-72 glass-panel m-4 mr-0 flex flex-col h-[calc(100vh-2rem)] z-20">
      {/* Brand */}
      <div className="p-8 border-b border-white/10">
        <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Verity</span>Sync
        </h1>
        <p className="text-xs font-black text-teal-300 mt-2 uppercase tracking-[0.2em] opacity-80">Intelligence Hub</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
        {menuItems.map((item, idx) => {
          const active = isActive(item.path);
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center px-4 py-3.5 rounded-2xl text-[13px] uppercase tracking-wider font-black transition-all duration-300 ${
                active 
                ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white border border-white/20 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Logout */}
      <div className="p-6 border-t border-white/10 mt-auto">
        <Link 
          to="/login"
          className="flex items-center justify-center px-4 py-4 text-xs tracking-widest uppercase font-black text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl border border-transparent hover:border-red-500/20 transition-all shadow-lg"
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
