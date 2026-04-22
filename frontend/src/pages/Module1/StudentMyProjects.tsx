import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    FolderKanban, Plus, Search, CheckCircle2,
    Clock, AlertTriangle, GitBranch, ArrowRight,
    Crown, Target, Layers
} from 'lucide-react';

interface ProjectMember {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; indexNumber?: string };
}

interface Project {
    id: string;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    members: ProjectMember[];
    myRole: string;
    progress: number;
    totalTasks: number;
    doneTasks: number;
    hasGithub: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    Active:   { label: 'Active',   bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200', icon: CheckCircle2 },
    Pending:  { label: 'Pending',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', icon: Clock },
    Rejected: { label: 'Rejected', bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200', icon: AlertTriangle },
    Archived: { label: 'Archived', bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200', icon: Layers },
};

export default function StudentMyProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const getUserId = () => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || '{}');
            return data.user?.id || data.id || null;
        } catch { return null; }
    };

    const getUserName = () => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || '{}');
            const user = data.user || data;
            return user?.name?.split(' ')[0] || 'Student';
        } catch { return 'Student'; }
    };

    useEffect(() => {
        const fetchMyProjects = async () => {
            const userId = getUserId();
            if (!userId) { setLoading(false); return; }
            try {
                const res = await axios.get(`http://localhost:5000/api/project/my-projects/${userId}`);
                if (res.data.success) {
                    setProjects(res.data.projects);
                }
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally { setLoading(false); }
        };
        fetchMyProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const activeCount = projects.filter(p => p.status === 'Active').length;
    const pendingCount = projects.filter(p => p.status === 'Pending').length;

    const getModuleBadge = (desc: string) => {
        const match = desc?.match(/^\[(.*?)\]/);
        return match ? match[1] : 'Project';
    };

    const daysRemaining = (endDate: string) => {
        const diff = new Date(endDate).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">

            {/* ── Hero Banner ─── */}
            <div className="relative overflow-hidden w-full rounded-[2.5rem] bg-gradient-to-br from-indigo-50/80 via-white to-teal-50/40 border border-white shadow-[0_4px_24px_-6px_rgba(129,140,248,0.12)] p-10 min-h-[200px]">
                {/* Decorative */}
                <div className="absolute inset-0 backdrop-blur-[1px] bg-white/10" />
                <div className="absolute top-[-30%] right-[-5%] w-[280px] h-[280px] bg-indigo-200/30 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-40%] left-[15%] w-[200px] h-[200px] bg-teal-200/25 rounded-full blur-[60px]" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <FolderKanban className="w-4 h-4" /> My Project Workspace
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-2">
                            My Groups
                        </h1>
                        <p className="text-slate-500 font-medium text-lg max-w-md">
                            Welcome back, <span className="text-indigo-600 font-bold">{getUserName()}</span>. Manage your SLIIT group projects from here.
                        </p>
                    </div>

                    {/* Stats Capsules */}
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-5 shadow-sm text-center min-w-[100px]">
                            <div className="text-3xl font-black text-indigo-600">{activeCount}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-5 shadow-sm text-center min-w-[100px]">
                            <div className="text-3xl font-black text-amber-500">{pendingCount}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-5 shadow-sm text-center min-w-[100px]">
                            <div className="text-3xl font-black text-teal-600">{projects.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Action Bar ─── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 shadow-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        {['All', 'Active', 'Pending', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2.5 text-xs font-bold transition-all ${
                                    filterStatus === status
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Register New Group */}
                    <Link
                        to="/student/projects/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" />
                        Register New Group
                    </Link>
                </div>
            </div>

            {/* ── Projects Grid ─── */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-400 font-medium mt-4">Loading your projects...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                /* ── Empty State ─── */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-20 text-center"
                >
                    <div className="w-24 h-24 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FolderKanban className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-700 mb-2">No Projects Yet</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                        {search ? 'No projects match your search. Try different keywords.' : 'You haven\'t been added to any group projects. Register a new group to get started!'}
                    </p>
                    {!search && (
                        <Link
                            to="/student/projects/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all"
                        >
                            <Plus className="w-4 h-4" /> Register New Group
                        </Link>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project, idx) => {
                        const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['Active'];
                        const StatusIcon = statusCfg.icon;
                        const moduleBadge = getModuleBadge(project.description);
                        const days = daysRemaining(project.endDate);

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                            >
                                <Link
                                    to={`/student/projects/${project.id}`}
                                    className="group block bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_-8px_rgba(129,140,248,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Top Accent Bar */}
                                    <div className={`h-1.5 w-full ${project.status === 'Active' ? 'bg-gradient-to-r from-indigo-400 to-teal-400' : project.status === 'Pending' ? 'bg-gradient-to-r from-amber-300 to-orange-300' : 'bg-gradient-to-r from-rose-300 to-pink-300'}`} />

                                    <div className="p-6 space-y-5">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Module + Role Badges */}
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-lg border border-indigo-100">
                                                        {moduleBadge}
                                                    </span>
                                                    {project.myRole === 'LEADER' && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-amber-200">
                                                            <Crown className="w-3 h-3" /> Leader
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-2">
                                                    {project.title}
                                                </h3>
                                            </div>

                                            {/* Status Pill */}
                                            <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusCfg.label}
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                                                    <Target className="w-3.5 h-3.5 text-teal-500" />
                                                    Progress
                                                </span>
                                                <span className="font-black text-indigo-600">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${project.progress}%` }}
                                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span>{project.doneTasks}/{project.totalTasks} tasks done</span>
                                                {days > 0 && <span>{days} days remaining</span>}
                                            </div>
                                        </div>

                                        {/* Footer: Team + Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            {/* Team Avatars */}
                                            <div className="flex items-center">
                                                <div className="flex -space-x-2.5">
                                                    {project.members.slice(0, 4).map((m) => (
                                                        <div
                                                            key={m.id}
                                                            className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-700 shadow-sm"
                                                            title={m.user.name}
                                                        >
                                                            {m.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {project.members.length > 4 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                                            +{project.members.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 ml-3 uppercase tracking-wider">
                                                    {project.members.length} members
                                                </span>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex items-center gap-1.5">
                                                {project.hasGithub && (
                                                    <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-transparent hover:border-slate-200">
                                                        <GitBranch className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
