import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, CheckSquare, Briefcase, Clock, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const API = 'http://localhost:5000/api';

// ─── Types ───────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'assignment' | 'task' | 'project-start' | 'project-end' | 'sprint';
  meta?: string;
  status?: string;
  priority?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date) {
  return isSameDay(d, new Date());
}

const typeConfig: Record<string, { bg: string; border: string; text: string; dot: string; icon: any; label: string }> = {
  'assignment':    { bg: 'bg-amber-50',   border: 'border-amber-200', text: 'text-amber-700',   dot: 'bg-amber-500',   icon: FileText,   label: 'Assignment Due' },
  'task':          { bg: 'bg-blue-50',     border: 'border-blue-200',  text: 'text-blue-700',    dot: 'bg-blue-500',    icon: CheckSquare, label: 'Task Deadline' },
  'project-start': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: Briefcase, label: 'Project Start' },
  'project-end':  { bg: 'bg-rose-50',     border: 'border-rose-200',  text: 'text-rose-700',    dot: 'bg-rose-500',    icon: Briefcase, label: 'Project End' },
  'sprint':       { bg: 'bg-violet-50',   border: 'border-violet-200', text: 'text-violet-700',  dot: 'bg-violet-500',  icon: Clock,      label: 'Sprint' },
};

// ─── Component ───────────────────────────────────────────────────────
export default function StudentCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [events, setEvents]             = useState<CalendarEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType]     = useState<string>('all');

  // ─── Get user ────────────────────────────────────────────────────
  const getUser = () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.user || parsed;
    } catch { return null; }
  };

  // ─── Fetch all events ────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const user = getUser();
      const allEvents: CalendarEvent[] = [];

      try {
        // 1) Assignment deadlines
        const assRes = await fetch(`${API}/assignment/list`);
        const assData = await assRes.json();
        if (assData.success) {
          assData.assignments.forEach((a: any) => {
            allEvents.push({
              id: `ass-${a.id}`,
              title: a.title,
              date: new Date(a.deadline),
              type: 'assignment',
              meta: a.moduleName ? `${a.moduleCode} – ${a.moduleName}` : a.moduleCode,
              status: new Date(a.deadline) < new Date() ? 'Closed' : a.status,
            });
          });
        }
      } catch (e) { console.error('Calendar: assignments fetch error', e); }

      try {
        // 2) Projects + tasks
        const projRes = await fetch(`${API}/project/list`);
        const projData = await projRes.json();
        if (projData.success) {
          const userProjects = (projData.projects || []).filter((p: any) =>
            user && p.members?.some((m: any) => m.userId === user.id)
          );

          for (const proj of userProjects) {
            // Project start/end
            allEvents.push({
              id: `proj-start-${proj.id}`,
              title: `${proj.title} – Start`,
              date: new Date(proj.startDate),
              type: 'project-start',
              meta: proj.title,
            });
            allEvents.push({
              id: `proj-end-${proj.id}`,
              title: `${proj.title} – Deadline`,
              date: new Date(proj.endDate),
              type: 'project-end',
              meta: proj.title,
            });

            // Sprints
            if (proj.sprints) {
              proj.sprints.forEach((s: any) => {
                allEvents.push({
                  id: `sprint-start-${s.id}`,
                  title: `${s.name} Start`,
                  date: new Date(s.startDate),
                  type: 'sprint',
                  meta: proj.title,
                });
                allEvents.push({
                  id: `sprint-end-${s.id}`,
                  title: `${s.name} End`,
                  date: new Date(s.endDate),
                  type: 'sprint',
                  meta: proj.title,
                });
              });
            }

            // Tasks with deadlines
            try {
              const taskRes = await fetch(`${API}/task/list/${proj.id}`);
              const taskData = await taskRes.json();
              if (taskData.success) {
                taskData.tasks.forEach((t: any) => {
                  if (t.deadline) {
                    allEvents.push({
                      id: `task-${t.id}`,
                      title: t.title,
                      date: new Date(t.deadline),
                      type: 'task',
                      meta: proj.title,
                      status: t.status,
                      priority: t.priority,
                    });
                  }
                });
              }
            } catch (e) { console.error('Calendar: tasks fetch error', e); }
          }
        }
      } catch (e) { console.error('Calendar: projects fetch error', e); }

      setEvents(allEvents);
      setLoading(false);
    };

    fetchAll();
  }, []);

  // ─── Calendar grid calculations ──────────────────────────────────
  const daysInMonth  = getDaysInMonth(currentYear, currentMonth);
  const firstDay     = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const eventsForDay = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return filteredEvents.filter(e => isSameDay(e.date, d));
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => isSameDay(e.date, selectedDate));
  }, [selectedDate, filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(e => e.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6);
  }, [filteredEvents]);

  // ─── Navigation ──────────────────────────────────────────────────
  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // ─── Build grid cells ────────────────────────────────────────────
  const gridCells: { day: number; isCurrentMonth: boolean }[] = [];
  // leading days from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    gridCells.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  // current month days
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ day: d, isCurrentMonth: true });
  }
  // trailing days
  const trailing = 42 - gridCells.length;
  for (let d = 1; d <= trailing; d++) {
    gridCells.push({ day: d, isCurrentMonth: false });
  }

  // ─── Stats ───────────────────────────────────────────────────────
  const thisMonthEvents = filteredEvents.filter(e => e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear);
  const stats = [
    { label: 'Assignments', count: thisMonthEvents.filter(e => e.type === 'assignment').length, color: 'bg-amber-500' },
    { label: 'Tasks',       count: thisMonthEvents.filter(e => e.type === 'task').length,       color: 'bg-blue-500' },
    { label: 'Sprints',     count: thisMonthEvents.filter(e => e.type === 'sprint').length,     color: 'bg-violet-500' },
    { label: 'Milestones',  count: thisMonthEvents.filter(e => e.type.startsWith('project')).length, color: 'bg-emerald-500' },
  ];

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up max-w-screen-2xl mx-auto space-y-6 pb-12">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="page-header border-b-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-sage">Academic Calendar</span>
          </div>
          <h1 className="page-title text-emerald-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-emerald-600" />
            My Calendar
          </h1>
          <p className="page-subtitle text-slate-500">All your deadlines, tasks, sprints and milestones in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <option value="all">All Events</option>
              <option value="assignment">Assignments</option>
              <option value="task">Tasks</option>
              <option value="sprint">Sprints</option>
              <option value="project-start">Project Starts</option>
              <option value="project-end">Project Deadlines</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-black text-lg">{s.count}</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">{MONTHS[currentMonth].slice(0,3)}</p>
              <p className="text-sm font-bold text-slate-700">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Calendar Grid ──────────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
            <div className="flex items-center gap-3">
              <button onClick={goToPrev} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-black text-slate-900 tracking-tight min-w-[200px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button onClick={goToNext} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <button onClick={goToToday} className="px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors border border-emerald-200">
              Today
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {gridCells.map((cell, idx) => {
              const dayEvents = cell.isCurrentMonth ? eventsForDay(cell.day) : [];
              const dateObj   = new Date(currentYear, currentMonth, cell.day);
              const isSelected = !!selectedDate && cell.isCurrentMonth && isSameDay(dateObj, selectedDate);
              const todayCell  = cell.isCurrentMonth && isToday(dateObj);

              return (
                <div
                  key={idx}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(dateObj)}
                  className={`min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-all group relative
                    ${!cell.isCurrentMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-emerald-50/30'}
                    ${isSelected ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/50 z-10' : ''}
                  `}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mx-auto mb-1
                    ${!cell.isCurrentMonth ? 'text-slate-300' : todayCell ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-700 group-hover:text-emerald-700'}
                  `}>
                    {cell.day}
                  </div>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map(ev => {
                        const cfg = typeConfig[ev.type];
                        return (
                          <div key={ev.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] font-black text-slate-400 text-center">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-6">
          {/* Selected Day Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                {selectedDate
                  ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                  : 'Select a Date'}
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
              {selectedDate && selectedDayEvents.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No events on this day</p>
                </div>
              )}
              {selectedDayEvents.map(ev => {
                const cfg = typeConfig[ev.type];
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className={`p-3.5 rounded-xl border ${cfg.border} ${cfg.bg} transition-all hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cfg.dot} flex items-center justify-center shrink-0 shadow-md`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${cfg.text} truncate`}>{ev.title}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{cfg.label}</p>
                        {ev.meta && <p className="text-[11px] font-semibold text-slate-400 truncate">{ev.meta}</p>}
                        {ev.status && (
                          <span className={`inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border
                            ${ev.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : ev.status === 'Closed' ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'}
                          `}>
                            {ev.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!selectedDate && (
                <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">Click a date to view events</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-white">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Upcoming
              </h3>
            </div>
            <div className="p-4 space-y-2.5 max-h-[350px] overflow-y-auto">
              {upcomingEvents.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-slate-400">No upcoming events</p>
                </div>
              )}
              {upcomingEvents.map(ev => {
                const cfg = typeConfig[ev.type];
                const Icon = cfg.icon;
                const daysLeft = Math.ceil((ev.date.getTime() - new Date().getTime()) / 86400000);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setCurrentMonth(ev.date.getMonth());
                      setCurrentYear(ev.date.getFullYear());
                      setSelectedDate(ev.date);
                    }}
                    className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg} cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${cfg.dot} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${cfg.text} truncate`}>{ev.title}</p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                        </p>
                      </div>
                      {daysLeft <= 3 && daysLeft >= 0 && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md animate-pulse shrink-0">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Legend</h3>
            <div className="space-y-2">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold text-slate-600">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
