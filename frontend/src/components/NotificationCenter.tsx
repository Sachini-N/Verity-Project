import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bell, X, Check, CheckCheck, Briefcase, CheckSquare, GitPullRequest, FileText, AlertTriangle, Megaphone, Upload, BrainCircuit, Github, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../lib/useSocket';

const NOTIFICATION_ICONS: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    PROJECT_CREATED:       { icon: Briefcase,     color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    PROJECT_APPROVED:      { icon: CheckSquare,   color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-100' },
    PROJECT_REJECTED:      { icon: AlertTriangle,  color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-100' },
    MEMBER_ADDED:          { icon: Briefcase,     color: 'text-sky-500',    bg: 'bg-sky-50',    border: 'border-sky-100' },
    MEMBER_REMOVED:        { icon: AlertTriangle,  color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    TASK_ASSIGNED:         { icon: CheckSquare,   color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    TASK_STATUS_CHANGED:   { icon: CheckSquare,   color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-100' },
    TASK_DEADLINE:         { icon: Clock,          color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    ANNOUNCEMENT:          { icon: Megaphone,      color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    REPORT_SUBMITTED:      { icon: FileText,       color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-100' },
    REPORT_REVIEWED:       { icon: FileText,       color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    FAIRNESS_ALERT:        { icon: AlertTriangle,  color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-100' },
    GITHUB_LINKED:         { icon: Github,         color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200' },
    GITHUB_SYNCED:         { icon: GitPullRequest,  color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-100' },
    SUBMISSION_CREATED:    { icon: Upload,          color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    ASSIGNMENT_CREATED:    { icon: FileText,       color: 'text-sky-500',    bg: 'bg-sky-50',    border: 'border-sky-100' },
    ASSIGNMENT_DEADLINE:   { icon: Clock,          color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    SUBMISSION_FLAGGED:    { icon: AlertTriangle,  color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-100' },
};

const DEFAULT_ICON_STYLE = { icon: BrainCircuit, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };

const MANAGER_NOTIFICATION_TYPES = new Set([
    'PROJECT_CREATED',
    'PROJECT_APPROVED',
    'PROJECT_REJECTED',
    'HIGH_RISK',
    'FAIRNESS_ALERT',
    'SUBMISSION_FLAGGED'
]);

type ManagerTab = 'all' | 'requests' | 'risks';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [managerTab, setManagerTab] = useState<ManagerTab>('all');
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const isLecturerView = window.location.pathname.startsWith('/lecturer');
    const isManagerView = window.location.pathname.startsWith('/manager');

    const getUserId = useCallback(() => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || '{}');
            return data.user?.id || data.id || null;
        } catch { return null; }
    }, []);

    const getUserRole = useCallback(() => {
        try {
            const data = JSON.parse(sessionStorage.getItem('user') || '{}');
            return String(data.user?.role || data.role || '').toLowerCase();
        } catch {
            return '';
        }
    }, []);

    const getScope = useCallback(() => {
        const role = getUserRole();
        if (role === 'manager') return 'manager';
        return undefined;
    }, [getUserRole]);

    const matchesScope = useCallback((notification: Notification) => {
        const scope = getScope();
        if (scope !== 'manager') return true;
        return MANAGER_NOTIFICATION_TYPES.has(String(notification.type || '').toUpperCase());
    }, [getScope]);

    const isRequestNotification = useCallback((notification: Notification) => {
        const type = String(notification.type || '').toUpperCase();
        return type === 'PROJECT_CREATED' || type === 'PROJECT_APPROVED' || type === 'PROJECT_REJECTED';
    }, []);

    const isRiskNotification = useCallback((notification: Notification) => {
        const type = String(notification.type || '').toUpperCase();
        return type === 'HIGH_RISK' || type === 'FAIRNESS_ALERT' || type === 'SUBMISSION_FLAGGED';
    }, []);

    const visibleNotifications = useMemo(() => {
        if (!isManagerView) return notifications;
        if (managerTab === 'requests') return notifications.filter(isRequestNotification);
        if (managerTab === 'risks') return notifications.filter(isRiskNotification);
        return notifications;
    }, [isManagerView, isRequestNotification, isRiskNotification, managerTab, notifications]);

    const userId = getUserId();
    const { socket, isConnected } = useSocket({ userId: userId || undefined, autoConnect: true });

    const fetchUnreadCount = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;
        try {
            const scope = getScope();
            const url = scope
                ? `http://localhost:5000/api/notification/unread-count?userId=${userId}&scope=${encodeURIComponent(scope)}`
                : `http://localhost:5000/api/notification/unread-count?userId=${userId}`;
            const res = await axios.get(url);
            if (res.data.success) setUnreadCount(res.data.count);
        } catch {}
    }, [getScope, getUserId]);

    const fetchNotifications = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;
        setLoading(true);
        try {
            const scope = getScope();
            const url = scope
                ? `http://localhost:5000/api/notification/list?userId=${userId}&scope=${encodeURIComponent(scope)}`
                : `http://localhost:5000/api/notification/list?userId=${userId}`;
            const res = await axios.get(url);
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.notifications.filter((n: Notification) => !n.isRead).length);
            }
        } catch {} finally { setLoading(false); }
    }, [getScope, getUserId]);

    // Poll every 30 seconds (fallback) and listen for Socket.io events
    useEffect(() => {
        fetchUnreadCount();
        
        // Fallback polling every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        
        // Socket.io real-time listener
        if (socket && isConnected) {
            const handleNewNotification = (notification: Notification) => {
                if (!matchesScope(notification)) return;
                setNotifications(prev => [notification, ...prev.slice(0, 49)]);
                setUnreadCount(prev => prev + 1);
            };
            socket.on('new_notification', handleNewNotification);
            return () => {
                clearInterval(interval);
                socket.off('new_notification', handleNewNotification);
            };
        }
        
        return () => clearInterval(interval);
    }, [fetchUnreadCount, isConnected, matchesScope, socket]);

    // Fetch full list when panel opens
    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const markAsRead = async (id: string) => {
        try {
            await axios.put(`http://localhost:5000/api/notification/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const markAllAsRead = async () => {
        const userId = getUserId();
        if (!userId) return;
        try {
            const scope = getScope();
            await axios.put('http://localhost:5000/api/notification/read-all', { userId, scope });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) markAsRead(notif.id);
        if (notif.link) {
            navigate(notif.link);
            setIsOpen(false);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await axios.delete(`http://localhost:5000/api/notification/${id}`);
            const removed = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-full hover:bg-white/60 text-slate-500 ${isLecturerView ? 'hover:text-emerald-600' : 'hover:text-indigo-600'} transition-all group`}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                
                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ${isLecturerView ? 'bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.45)]' : 'bg-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.5)]'}`}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pulse ring when new notifications */}
                {unreadCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full animate-ping opacity-40 pointer-events-none ${isLecturerView ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute right-0 top-full mt-3 w-[420px] max-h-[560px] bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),inset_0_1px_1px_white] flex flex-col overflow-hidden z-[999]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className={`px-2.5 py-0.5 font-black text-xs rounded-full border ${isLecturerView ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className={`p-2 rounded-xl text-slate-400 transition-all ${isLecturerView ? 'hover:bg-emerald-50 hover:text-emerald-600' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {isManagerView && (
                            <div className="px-4 pt-4 pb-2 bg-white/80 border-b border-slate-100">
                                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-1">
                                    {[
                                        { key: 'all', label: 'All' },
                                        { key: 'requests', label: 'Requests' },
                                        { key: 'risks', label: 'Risks' },
                                    ].map((tab) => {
                                        const active = managerTab === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                onClick={() => setManagerTab(tab.key as ManagerTab)}
                                                className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                                                    active
                                                        ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading && visibleNotifications.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className={`w-8 h-8 border-2 rounded-full animate-spin mx-auto ${isLecturerView ? 'border-emerald-200 border-t-emerald-500' : 'border-indigo-200 border-t-indigo-500'}`} />
                                    <p className="text-sm text-slate-400 mt-4 font-medium">Loading...</p>
                                </div>
                            )}

                            {!loading && visibleNotifications.length === 0 && (
                                <div className="py-16 text-center px-6">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Bell className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <h4 className="font-bold text-slate-700 mb-1">All Clear!</h4>
                                    <p className="text-sm text-slate-400 font-medium">
                                        {isManagerView
                                            ? 'No notifications in this category yet.'
                                            : "No notifications yet. We'll notify you when something important happens."}
                                    </p>
                                </div>
                            )}

                            {visibleNotifications.map((notif, idx) => {
                                const style = NOTIFICATION_ICONS[notif.type] || DEFAULT_ICON_STYLE;
                                const Icon = style.icon;
                                
                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`group relative px-5 py-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-slate-50/80 border-b border-slate-50 ${
                                            !notif.isRead ? (isLecturerView ? 'bg-emerald-50/35' : 'bg-indigo-50/30') : ''
                                        }`}
                                    >
                                        {/* Unread indicator */}
                                        {!notif.isRead && (
                                            <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full ${isLecturerView ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)]' : 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`} />
                                        )}
                                        
                                        {/* Icon */}
                                        <div className={`shrink-0 w-10 h-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                                            <Icon className={`w-5 h-5 ${style.color}`} strokeWidth={2} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`text-sm font-bold leading-tight ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider mt-0.5">
                                                    {timeAgo(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                                                {notif.message}
                                            </p>
                                        </div>

                                        {/* Delete/Mark read actions */}
                                        <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                    className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-300 hover:text-teal-500 transition-all"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => deleteNotification(e, notif.id)}
                                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                                                title="Delete"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
