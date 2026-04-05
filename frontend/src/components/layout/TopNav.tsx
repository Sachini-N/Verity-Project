import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function TopNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = [
    {
      label: 'Projects & Teams',
      items: [
        { label: 'My Projects', path: '/projects' },
        { label: 'Team Management', path: '/projects/1/team' },
        { label: 'Announcements', path: '/projects/1/announcements' },
      ]
    },
    {
      label: 'Tasks & Workflow',
      items: [
        { label: 'Kanban Board', path: '/projects/1/kanban' },
        { label: 'Sprint Planner', path: '/projects/1/sprints' },
        { label: 'Time Tracker', path: '/projects/1/time' },
      ]
    },
    {
      label: 'Engagement',
      items: [
        { label: 'Weekly Report', path: '/projects/1/reports/weekly' },
        { label: 'Engagement Analytics', path: '/projects/1/analytics/engagement' },
        { label: 'Fairness Analytics', path: '/projects/1/analytics/contribution' },
        { label: 'Lecturer Review', path: '/projects/1/lecturer/review' },
      ]
    },
    {
      label: 'Code & Files',
      items: [
        { label: 'GitHub Activity', path: '/projects/1/github' },
        { label: 'File Manager', path: '/projects/1/files' },
        { label: 'Submissions', path: '/projects/1/submissions' },
      ]
    }
  ];

  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const user = (() => {
    try { 
      const data = JSON.parse(sessionStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'SP';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="bg-emerald-900 text-white px-6 py-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase opacity-80">
          Sri Lanka Institute of Information Technology · Academic Platform
        </span>
        <div className="flex items-center gap-4 text-[11px] font-semibold opacity-70">
          <span>SE3040 · Group Project Management</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 h-14 max-w-screen-2xl mx-auto">
        <Link to="/projects" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <span className="text-emerald-900 font-black text-lg tracking-tight">Verity<span className="text-emerald-500">Sync</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 h-full">
          {navGroups.map((group) => {
            const isGroupActive = group.items.some(i => location.pathname.startsWith(i.path) && (i.path !== '/projects' || location.pathname === '/projects'));
            return (
              <div
                key={group.label}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveGroup(group.label)}
                onMouseLeave={() => setActiveGroup(null)}
              >
                <button
                  className={`flex items-center gap-1.5 px-4 h-full text-sm font-semibold transition-colors border-b-2 ${
                    isGroupActive
                      ? 'text-emerald-900 border-emerald-900'
                      : 'text-slate-600 hover:text-emerald-900 border-transparent hover:border-emerald-200'
                  }`}
                >
                  {group.label}
                  <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {activeGroup === group.label && (
                  <div className="absolute top-full left-0 mt-0 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path || (item.path !== '/projects' && location.pathname.startsWith(item.path));
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                            active ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'
                          }`}
                        >
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-900 mr-2.5 shrink-0" />}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/lecturer/dashboard" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Lecturer Portal
          </Link>

          <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-white text-xs font-black cursor-pointer">
            {initials}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1">
          {navGroups.flatMap(g => g.items).map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.path) ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <Link to="/login" className="block px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Sign Out</Link>
          </div>
        </div>
      )}
    </header>
  );
}

