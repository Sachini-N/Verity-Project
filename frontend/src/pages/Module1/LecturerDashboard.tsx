import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Bell, ClipboardList, FolderKanban, ShieldCheck } from 'lucide-react';

export default function LecturerDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lecturerName, setLecturerName] = useState('Lecturer');
  const [moduleCount, setModuleCount] = useState(0);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/project/list');
        if (response.data.success) {
          // Filter out pending groups; only show Approved/Active ones
          const activeProjects = response.data.projects.filter((p: any) => p.status === 'Active');
          
          const mapped = activeProjects.map((p: any) => ({
            id: p.id,
            title: p.title,
            health: 'On Track', // Mocked until feature built
            flags: 0, // Mocked
            reports: 'Pending' // Mocked
          }));
          setProjects(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch projects for lecturer", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchLecturerProfile = async () => {
      try {
        const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
        const localUser = stored.user || stored;
        if (!localUser?.id) return;

        const response = await axios.get(`http://localhost:5000/api/user/${localUser.id}`);
        if (response.data?.success) {
          const profile = response.data.user;
          setLecturerName(profile?.name || localUser?.name || 'Lecturer');
          setModuleCount(Array.isArray(profile?.modules) ? profile.modules.length : 0);
        }
      } catch (error) {
        console.error('Failed to fetch lecturer profile', error);
      }
    };

    fetchLecturerProfile();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const highRiskCount = projects.filter(p => p.health === 'At Risk' || p.flags > 0).length;
  const onTrackCount = projects.filter(p => p.health === 'On Track').length;
  const pendingReports = projects.filter(p => p.reports !== 'Submitted').length;
  const previewProjects = projects.slice(0, 2);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-[#f7fcfa] to-[#ecf8f4] p-8 md:p-9 shadow-sm"
      >
        <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(2,132,199,0.05),transparent_42%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-end gap-7">
          <div>
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              Lecturer Command Deck
            </div>
            <p className="text-sm font-black text-emerald-700 mt-3 tracking-wide">{greeting}, {lecturerName}</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-3">Academic Supervision Overview</h2>
            <p className="text-slate-600 font-medium text-sm mt-2 max-w-2xl">Live visibility into group momentum, pending reviews, and risk posture with a cleaner control surface for quick lecturer action.</p>
            <div className="mt-3 inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              {moduleCount} Modules Assigned
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-center min-w-[108px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</p>
              <p className="text-2xl font-black text-slate-900">{projects.length}</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-white/90 px-4 py-3 text-center min-w-[108px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">On Track</p>
              <p className="text-2xl font-black text-teal-700">{onTrackCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 text-center min-w-[108px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reports</p>
              <p className="text-2xl font-black text-amber-600">{pendingReports}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-center min-w-[108px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk</p>
              <p className="text-2xl font-black text-rose-700">{highRiskCount}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Queue</p>
          <p className="text-xl font-black text-slate-900 mt-1">{pendingReports} reports pending</p>
          <p className="text-xs text-slate-500 mt-1">Weekly report flow waiting for lecturer action.</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health Band</p>
          <p className="text-lg font-black text-emerald-700 mt-1">Stable supervision</p>
          <p className="text-xs text-slate-500 mt-1">Most groups are maintaining expected pace.</p>
        </div>
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dashboard Focus</p>
          <p className="text-lg font-black text-teal-700 mt-1">Compact monitoring mode</p>
          <p className="text-xs text-slate-500 mt-1">Detailed group workspace is now handled inside My Groups.</p>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 xl:grid-cols-5 gap-5"
      >
        <div className="xl:col-span-3 rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Quick Lecturer Actions</h3>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fast Lane</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/lecturer/projects" className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 hover:bg-emerald-100/70 transition-colors group">
              <div className="flex items-center justify-between">
                <FolderKanban className="w-5 h-5 text-emerald-700" />
                <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm font-black text-slate-800 mt-3">Open My Groups</p>
              <p className="text-xs text-slate-500 mt-1">Navigate to full group workspace.</p>
            </Link>

            <Link to="/lecturer/assignments" className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-4 hover:bg-teal-100/70 transition-colors group">
              <div className="flex items-center justify-between">
                <ClipboardList className="w-5 h-5 text-teal-700" />
                <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm font-black text-slate-800 mt-3">Review Assignments</p>
              <p className="text-xs text-slate-500 mt-1">Check submissions and grading flow.</p>
            </Link>

            <Link to="/lecturer/announcements" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 hover:bg-slate-100 transition-colors group">
              <div className="flex items-center justify-between">
                <Bell className="w-5 h-5 text-slate-700" />
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm font-black text-slate-800 mt-3">Broadcast Updates</p>
              <p className="text-xs text-slate-500 mt-1">Send module and project notices.</p>
            </Link>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-[1.7rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/45 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Group Snapshot</h3>
            <span className="text-xs font-bold text-slate-400">{projects.length} total</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 animate-pulse bg-white/70">
              Loading group snapshot...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 bg-white/70">
              No active groups right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {previewProjects.map((proj) => (
                <div key={proj.id} className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{proj.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold">
                      <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" /> {proj.health}</span>
                      <span className="inline-flex items-center gap-1 text-rose-600"><AlertTriangle className="w-3.5 h-3.5" /> {proj.flags} flags</span>
                    </div>
                  </div>
                  <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                </div>
              ))}
              <Link to="/lecturer/projects" className="inline-flex items-center gap-2 mt-2 text-xs font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-800">
                Open Full Group Projects View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
