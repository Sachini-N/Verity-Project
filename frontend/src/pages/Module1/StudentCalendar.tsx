import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, CheckSquare, Briefcase, Clock, AlertCircle, Loader2, ChevronDown, Sparkles, Target, Layers } from 'lucide-react';

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
  'task':          { bg: 'bg-indigo-50',  border: 'border-indigo-200', text: 'text-indigo-700',  dot: 'bg-indigo-500',  icon: CheckSquare, label: 'Task Deadline' },
  'project-start': { bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-700',    dot: 'bg-teal-500',    icon: Briefcase, label: 'Project Start' },
  'project-end':   { bg: 'bg-slate-100',  border: 'border-slate-200',  text: 'text-slate-700',   dot: 'bg-slate-500',   icon: Briefcase, label: 'Project End' },
  'sprint':        { bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700',     dot: 'bg-sky-500',     icon: Clock,      label: 'Sprint' },
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
  const overdueCount = filteredEvents.filter(e => e.date < new Date() && e.status !== 'Done' && e.status !== 'Closed').length;
  const todayCount = filteredEvents.filter(e => isSameDay(e.date, today)).length;

  const stats = [
    { label: 'Assignments', count: thisMonthEvents.filter(e => e.type === 'assignment').length, color: 'from-amber-500 to-amber-600', icon: FileText },
    { label: 'Tasks',       count: thisMonthEvents.filter(e => e.type === 'task').length,       color: 'from-indigo-500 to-indigo-600', icon: CheckSquare },
    { label: 'Sprints',     count: thisMonthEvents.filter(e => e.type === 'sprint').length,     color: 'from-sky-500 to-sky-600', icon: Clock },
    { label: 'Milestones',  count: thisMonthEvents.filter(e => e.type.startsWith('project')).length, color: 'from-teal-500 to-teal-600', icon: Briefcase },
  ];

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading Calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl animate-fade-up space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/50 p-8 shadow-sm">
        <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" /> Next-Level Planner
            </div>
            <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900">
              <CalendarIcon className="h-9 w-9 text-indigo-600" /> My Calendar
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">All deadlines, tasks, sprints, and milestones in one smart timeline.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Events</option>
                <option value="assignment">Assignments</option>
                <option value="task">Tasks</option>
                <option value="sprint">Sprints</option>
                <option value="project-start">Project Starts</option>
                <option value="project-end">Project Deadlines</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900">{s.count}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            </div>
          );
        })}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-3xl font-black tracking-tight text-slate-900">{overdueCount}</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Overdue</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white shadow-sm">
            <Target className="h-5 w-5" />
          </div>
          <p className="text-3xl font-black tracking-tight text-slate-900">{todayCount}</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button onClick={goToPrev} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h2 className="min-w-[200px] text-center text-xl font-black tracking-tight text-slate-900">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button onClick={goToNext} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50">
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <button onClick={goToToday} className="rounded-xl border border-indigo-200 bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-200">
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {gridCells.map((cell, idx) => {
              const dayEvents = cell.isCurrentMonth ? eventsForDay(cell.day) : [];
              const dateObj = new Date(currentYear, currentMonth, cell.day);
              const isSelected = !!selectedDate && cell.isCurrentMonth && isSameDay(dateObj, selectedDate);
              const todayCell = cell.isCurrentMonth && isToday(dateObj);

              return (
                <div
                  key={idx}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(dateObj)}
                  className={`group relative min-h-[110px] cursor-pointer border-b border-r border-slate-100 p-2 transition-all
                    ${!cell.isCurrentMonth ? 'bg-slate-50/60' : 'bg-white hover:bg-indigo-50/20'}
                    ${isSelected ? 'z-10 ring-2 ring-indigo-500 ring-inset bg-indigo-50/40' : ''}
                  `}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
                      ${!cell.isCurrentMonth ? 'text-slate-300' : todayCell ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-700 group-hover:text-indigo-700'}
                    `}>
                      {cell.day}
                    </div>

                    {dayEvents.length > 0 && (
                      <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const cfg = typeConfig[ev.type];
                        return (
                          <div key={ev.id} className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="block text-center text-[10px] font-black text-slate-400">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                {selectedDate
                  ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                  : 'Select a Date'}
              </h3>
            </div>

            <div className="max-h-[340px] space-y-3 overflow-y-auto p-4">
              {selectedDate && selectedDayEvents.length === 0 && (
                <div className="py-8 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">No events on this day</p>
                </div>
              )}

              {selectedDayEvents.map((ev) => {
                const cfg = typeConfig[ev.type];
                const Icon = cfg.icon;
                return (
                  <div key={ev.id} className={`rounded-xl border p-3.5 transition-all hover:shadow-md ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.dot} shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${cfg.text}`}>{ev.title}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{cfg.label}</p>
                        {ev.meta && <p className="truncate text-[11px] font-semibold text-slate-400">{ev.meta}</p>}
                        {ev.status && (
                          <span className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider
                            ${ev.status === 'Done' ? 'bg-teal-50 text-teal-600 border-teal-200'
                              : ev.status === 'Closed' ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-200'}
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
                <div className="py-8 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">Click a date to view events</p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/60 to-white px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Upcoming
              </h3>
            </div>

            <div className="max-h-[350px] space-y-2.5 overflow-y-auto p-4">
              {upcomingEvents.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm font-bold text-slate-400">No upcoming events</p>
                </div>
              )}

              {upcomingEvents.map((ev) => {
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
                    className={`cursor-pointer rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${cfg.border} ${cfg.bg}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.dot} shadow-sm`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs font-bold ${cfg.text}`}>{ev.title}</p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                        </p>
                      </div>
                      {daysLeft <= 3 && daysLeft >= 0 && (
                        <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 animate-pulse">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Layers className="h-4 w-4 text-indigo-500" /> Legend
            </h3>
            <div className="space-y-2">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <div className={`h-3 w-3 rounded-full ${cfg.dot}`} />
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
