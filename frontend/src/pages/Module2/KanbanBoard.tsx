import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Plus, CircleDashed, PlayCircle, Eye, CheckCircle2, Sparkles, ClipboardList } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import XPToast from '../../components/XPToast';

export default function KanbanBoard() {
  const { id } = useParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const columns = ['To Do', 'In Progress', 'Review', 'Done'];
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [xpToasts, setXpToasts] = useState<Array<{ id: string; xpAmount: number; position: { x: number; y: number } }>>([]);

  const fetchTasks = async () => {
    try {
      const resp = await axios.get(`http://localhost:5000/api/task/list/${id}`);
      if (resp.data.success) {
        setTasks(resp.data.tasks.map((t: any) => ({
          ...t,
          assignee: t.assignee?.name?.substring(0, 2).toUpperCase() || 'UN'
        })));
      }
    } catch (e) { console.error("Error fetching tasks", e); }
  };

  useEffect(() => {
    if (id) fetchTasks();
  }, [id]);

  const moveTask = async (task: any, newStatus: string, event?: React.ChangeEvent<HTMLSelectElement>) => {
    const wasCompleted = task.status !== 'Done' && newStatus === 'Done';
    
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    // Trigger XP toast if moving to Done
    if (wasCompleted) {
      const rect = event?.currentTarget?.getBoundingClientRect?.() || 
                   document.querySelector(`[data-task-id="${task.id}"]`)?.getBoundingClientRect?.();
      
      const toastId = `${task.id}-${Date.now()}`;
      setXpToasts((prev) => [
        ...prev,
        {
          id: toastId,
          xpAmount: 10,
          position: {
            x: (rect?.left || window.innerWidth / 2) - 20,
            y: (rect?.top || window.innerHeight / 2) - 20,
          },
        },
      ]);
    }

    try {
      await axios.put(`http://localhost:5000/api/task/${task.id}/status`, { status: newStatus });
    } catch (e) {
      console.error("Error updating status", e);
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusCount = (status: string) => filteredTasks.filter((t) => t.status === status).length;
  const totalTasks = filteredTasks.length;
  const doneTasks = statusCount('Done');
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const highPriorityOpen = filteredTasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length;

  const columnMeta: Record<string, { icon: any; accent: string; soft: string; hint: string }> = {
    'To Do': { icon: CircleDashed, accent: 'text-slate-600', soft: 'bg-slate-100 border-slate-200', hint: 'Planned next actions' },
    'In Progress': { icon: PlayCircle, accent: 'text-indigo-600', soft: 'bg-indigo-50 border-indigo-100', hint: 'Currently being built' },
    'Review': { icon: Eye, accent: 'text-amber-600', soft: 'bg-amber-50 border-amber-100', hint: 'Waiting for validation' },
    'Done': { icon: CheckCircle2, accent: 'text-teal-600', soft: 'bg-teal-50 border-teal-100', hint: 'Ready and completed' },
  };

  const priorityClass = (priority: string) => {
    if (priority === 'High') return 'bg-red-50 text-red-600 border-red-200';
    if (priority === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-indigo-50 text-indigo-600 border-indigo-200';
  };

  return (
    <div className="h-full flex flex-col gap-6 pt-2 animate-fade-up">
      <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/50 p-8 shadow-sm">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" /> Productivity Zone
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Kanban Workflow</h2>
            <p className="mt-2 text-base font-medium text-slate-600">Plan, build, review, and ship with one clean board.</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 shadow-sm transition-all outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <Link
              to={`/student/projects/${id}/tasks/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" /> New Task
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Visible Tasks', value: totalTasks, tone: 'from-indigo-500 to-indigo-600' },
          { label: 'Completed', value: doneTasks, tone: 'from-teal-500 to-teal-600' },
          { label: 'Completion', value: `${completionRate}%`, tone: 'from-sky-500 to-sky-600' },
          { label: 'High Priority Open', value: highPriorityOpen, tone: 'from-amber-500 to-amber-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 h-1.5 w-full rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${kpi.tone}`} style={{ width: '100%' }} />
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-900">{kpi.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
          {columns.map((col) => {
            const meta = columnMeta[col];
            const Icon = meta.icon;
            const items = filteredTasks.filter((t) => t.status === col);

            return (
              <div key={col} className="w-[330px] flex-shrink-0 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.soft}`}>
                      <Icon className={`h-5 w-5 ${meta.accent}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-slate-800">{col}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{meta.hint}</p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                    {items.length}
                  </span>
                </div>

                <div className="max-h-[56vh] min-h-[240px] space-y-3 overflow-y-auto pr-1">
                  {items.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 text-center">
                      <ClipboardList className="mb-2 h-6 w-6 text-slate-300" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No tasks here yet</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">Move or create tasks to fill this lane.</p>
                    </div>
                  )}

                  {items.map((task) => (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${priorityClass(task.priority || 'Low')}`}>
                          {task.priority || 'Low'}
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-sm">
                          {task.assignee}
                        </div>
                      </div>

                      <h4 className="text-[15px] font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-600">
                        {task.title}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-500">
                        {task.description || 'No description provided for this task yet.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-100 bg-white p-8 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />
            <div className="relative z-10">
              <h3 className="mb-1 text-2xl font-black text-slate-900">{selectedTask.title}</h3>
              <p className="mb-5 text-sm font-bold text-slate-500">Assigned to: {selectedTask.assignee}</p>

              <div className="mb-5 flex items-center gap-2">
                <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${priorityClass(selectedTask.priority || 'Low')}`}>
                  {selectedTask.priority || 'Low'} Priority
                </span>
                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                  {selectedTask.status}
                </span>
              </div>

              <label className="mb-2 block px-1 text-xs font-black uppercase tracking-widest text-slate-400">Move to Status</label>
              <select
                className="mb-6 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 p-4 font-black text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                value={selectedTask.status}
                onChange={(e) => {
                  moveTask(selectedTask, e.target.value, e);
                  setSelectedTask(null);
                }}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <h4 className="mb-3 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Task Details</h4>
              <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                {selectedTask.description || 'No description provided.'}
              </div>

              <button onClick={() => setSelectedTask(null)} className="w-full rounded-xl border border-indigo-100 bg-indigo-50 py-3.5 font-bold text-indigo-700 transition-colors hover:bg-indigo-100">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XP Toast Notifications */}
      <AnimatePresence>
        {xpToasts.map((toast) => (
          <XPToast
            key={toast.id}
            xpAmount={toast.xpAmount}
            position={toast.position}
            onComplete={() =>
              setXpToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
