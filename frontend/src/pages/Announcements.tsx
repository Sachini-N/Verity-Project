import { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Pin, Trash2, Pencil, Filter, Plus, X,
  Shield, Send, ToggleLeft, ToggleRight, Search, Paperclip, Eye, Download, Loader2
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../lib/supabaseClient';

/* ─── types ─── */
type TagType = 'Urgent' | 'Academic' | 'General';
type UserRole = 'student' | 'lecturer' | 'manager';

interface Announcement {
  id: string | number;
  authorId: string;
  author: string;
  role: 'Lecturer' | 'Manager' | 'Student';
  avatar: string;
  title: string;
  description: string;
  tag: TagType;
  module: string;
  timestamp: string;
  pinned: boolean;
  attachmentUrl?: string | null;
  readPercentage?: number;
}

const TAG_STYLES: Record<TagType, string> = {
  Urgent:   'bg-red-50 text-red-700 border-red-200',
  Academic: 'bg-blue-50 text-blue-700 border-blue-200',
  General:  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TAG_DOT: Record<TagType, string> = {
  Urgent:   'bg-red-500',
  Academic: 'bg-blue-500',
  General:  'bg-emerald-500',
};

const AVATAR_COLORS: Record<string, string> = {
  Lecturer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Manager:  'bg-rose-100 text-rose-700 border-rose-200',
  Student:  'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ROLE_BADGE: Record<string, string> = {
  Lecturer: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Manager:  'bg-rose-50 text-rose-600 border-rose-200',
  Student:  'bg-emerald-50 text-emerald-600 border-emerald-200',
};

/* ─── helpers ─── */
function getCurrentRole(): UserRole {
  const path = window.location.pathname;
  if (path.startsWith('/lecturer')) return 'lecturer';
  if (path.startsWith('/manager')) return 'manager';
  return 'student';
}

function getUserFromStorage() {
  try {
    const data = JSON.parse(sessionStorage.getItem('user') || '{}');
    return data.user || data;
  } catch { return {}; }
}

/* ─── sub-components ─── */

function ComposerCard({ onClose, onPostSuccess, onError }: { onClose: () => void, onPostSuccess: (announcement: Announcement) => void, onError: (msg: string) => void }) {
  const role = getCurrentRole();
  const isLecturer = role === 'lecturer';
  const [isSystemWide, setIsSystemWide] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<TagType>('General');
  const [module, setModule] = useState('All Modules');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handlePost = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') return;
    
    setIsSubmitting(true);
    try {
      const user = getUserFromStorage();
      let attachmentUrl = null;

      if (file) {
        const filePath = `announcements/${user.id || user._id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, file);
        if (uploadError) throw new Error("Upload failed: " + uploadError.message);
        
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }

      const res = await axios.post('http://localhost:5000/api/announcement', {
        title,
        content,
        category: tag,
        targetAudience: isSystemWide ? 'System' : module,
        attachmentUrl
      }, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        const newAnnouncement: Announcement = {
          id: res.data.announcement.id,
          authorId: user.id || user._id,
          author: user.name || 'Current User',
          role: role === 'lecturer' ? 'Lecturer' : 'Manager',
          avatar: (user.name || 'Current User').split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
          title: res.data.announcement.title,
          description: res.data.announcement.content,
          tag: res.data.announcement.category as TagType,
          module: res.data.announcement.targetAudience,
          timestamp: 'Just now',
          pinned: res.data.announcement.isPinned,
          attachmentUrl: res.data.announcement.attachmentUrl,
          readPercentage: 0
        };
        onPostSuccess(newAnnouncement);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to post announcement:', error);
      onError(error.message || 'Failed to post announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={`bg-white rounded-[1.75rem] border shadow-xl p-6 mb-6 ${isLecturer ? 'border-emerald-100' : 'border-indigo-100'}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-sm shadow-md ${isLecturer ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-indigo-700'}`}>
            {getUserFromStorage()?.name?.charAt(0) || 'Y'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Create Announcement</p>
            <p className="text-[11px] text-slate-400 font-semibold">Visible to all members</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Announcement title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 transition-all mb-3 text-sm ${isLecturer ? 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400' : 'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400'}`}
      />
      
      <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          placeholder="What would you like to announce?"
          className="h-32 mb-10" // added padding logic for quill interior
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors w-fit">
          <Paperclip className="w-4 h-4 text-slate-400" />
          {file ? file.name : "Attach File"}
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {file && <button onClick={() => setFile(null)} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><X className="w-4 h-4"/></button>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={tag}
            onChange={(e) => setTag(e.target.value as TagType)}
            className={`text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer ${isLecturer ? 'focus:border-emerald-400' : 'focus:border-indigo-400'}`}
          >
            <option value="Urgent">🔴 Urgent</option>
            <option value="Academic">🔵 Academic</option>
            <option value="General">🟢 General</option>
          </select>

          <select 
            value={module}
            onChange={(e) => setModule(e.target.value)}
            disabled={isSystemWide}
            className={`text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer ${isLecturer ? 'focus:border-emerald-400' : 'focus:border-indigo-400'} ${isSystemWide ? 'opacity-50 text-slate-400' : 'text-slate-600'}`}
          >
            <option value="All Modules">All Modules</option>
            <option value="SE3050">SE3050</option>
            <option value="SE3060">SE3060</option>
            <option value="IT3040">IT3040</option>
          </select>

          {role === 'manager' && (
            <button
              onClick={() => setIsSystemWide(!isSystemWide)}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
                isSystemWide
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-200'
              }`}
            >
              {isSystemWide ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <Shield className="w-3.5 h-3.5" />
              System-Wide
            </button>
          )}
        </div>

        <button 
          onClick={handlePost} 
          disabled={!title.trim() || !content.trim() || content === '<p><br></p>' || isSubmitting}
          className={`flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/10 shrink-0 ${isLecturer ? 'hover:bg-emerald-600' : 'hover:bg-indigo-600'}`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </motion.div>
  );
}


function EditComposerCard({ onClose, onEditSuccess, onError, initialData }: { onClose: () => void, onEditSuccess: (announcement: Announcement) => void, onError: (msg: string) => void, initialData: Announcement }) {
  const role = getCurrentRole();
  const isLecturer = role === 'lecturer';
  const [isSystemWide, setIsSystemWide] = useState(initialData.module === 'System');
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.description);
  const [tag, setTag] = useState<TagType>(initialData.tag);
  const [module, setModule] = useState(initialData.module);
  const [isPinned, setIsPinned] = useState(initialData.pinned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleEdit = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') return;
    setIsSubmitting(true);
    try {
      let attachmentUrl = initialData.attachmentUrl;
      const user = getUserFromStorage();

      if (file) {
        const filePath = `announcements/${user.id || user._id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, file);
        if (uploadError) throw new Error("Upload failed: " + uploadError.message);
        
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }

      const res = await axios.put(`http://localhost:5000/api/announcement/${initialData.id}`, {
        title,
        content,
        category: tag,
        targetAudience: isSystemWide ? 'System' : module,
        isPinned,
        attachmentUrl
      }, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        onEditSuccess({
          ...initialData,
          title,
          description: content,
          tag,
          module: isSystemWide ? 'System' : module,
          pinned: isPinned,
          attachmentUrl
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to edit announcement:', error);
      onError(error.message || 'Failed to edit announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={`bg-white rounded-[1.75rem] border shadow-xl p-6 mb-6 ${isLecturer ? 'border-emerald-100' : 'border-indigo-100'}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-sm shadow-md ${isLecturer ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-indigo-700'}`}>
            {getUserFromStorage()?.name?.charAt(0) || 'Y'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Edit Announcement</p>
            <p className="text-[11px] text-slate-400 font-semibold">Modifying existing post</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Announcement title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 transition-all mb-3 text-sm ${isLecturer ? 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400' : 'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400'}`}
      />

      <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          className="h-32 mb-10"
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors w-fit">
          <Paperclip className="w-4 h-4 text-slate-400" />
          {file ? file.name : (initialData.attachmentUrl ? 'Replace Attachment' : 'Attach File')}
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {file && <button onClick={() => setFile(null)} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><X className="w-4 h-4"/></button>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <select value={tag} onChange={(e) => setTag(e.target.value as TagType)} className={`text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer ${isLecturer ? 'focus:border-emerald-400' : 'focus:border-indigo-400'}`}>
            <option value="Urgent">🔴 Urgent</option>
            <option value="Academic">🔵 Academic</option>
            <option value="General">🟢 General</option>
          </select>
          <select value={module} onChange={(e) => setModule(e.target.value)} disabled={isSystemWide} className={`text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer ${isLecturer ? 'focus:border-emerald-400' : 'focus:border-indigo-400'} ${isSystemWide ? 'opacity-50 text-slate-400' : 'text-slate-600'}`}>
             <option value="All Modules">All Modules</option>
            <option value="SE3050">SE3050</option>
            <option value="SE3060">SE3060</option>
            <option value="IT3040">IT3040</option>
          </select>
          {role === 'manager' && (
            <button onClick={() => setIsSystemWide(!isSystemWide)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${isSystemWide ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-200'}`}>
              {isSystemWide ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} <Shield className="w-3.5 h-3.5" /> System-Wide
            </button>
          )}
          {role === 'manager' && (
            <button onClick={() => setIsPinned(!isPinned)} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${isPinned ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-200'}`}>
               <Pin className="w-3.5 h-3.5" /> Pinned
            </button>
          )}
        </div>
        <button onClick={handleEdit} disabled={!title.trim() || !content.trim() || isSubmitting} className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shrink-0 ${isLecturer ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}

function AnnouncementCard({
  announcement: a, index, role, currentUser, onEdit, onDelete
}: { announcement: Announcement; index: number; role: UserRole; currentUser: any; onEdit: (a: Announcement) => void; onDelete: (id: string | number) => void; }) {
  const isLecturer = role === 'lecturer';
  const canEdit = currentUser.id === a.authorId;
  const canDelete = currentUser?.role?.toUpperCase() === 'MANAGER' || currentUser.id === a.authorId;

  // Track reads natively on component mount
  useEffect(() => {
    if (role === 'student' && currentUser?.id) {
       axios.post(`http://localhost:5000/api/announcement/${a.id}/read`, {}, {
         headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
       }).catch(e => console.log('Read track omitted:', e.message));
    }
  }, [a.id, role, currentUser?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
      className={`rounded-[1.5rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${isLecturer ? 'hover:border-emerald-200' : 'hover:border-indigo-200'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${isLecturer ? 'from-emerald-500 via-emerald-400 to-teal-400' : 'from-indigo-500 via-indigo-400 to-teal-400'}`} />

      {/* Pinned indicator */}
      {a.pinned && (
        <div className="absolute -top-2.5 left-8 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
          <Pin className="w-3 h-3" />
          Pinned
        </div>
      )}

      <div className="p-6 pb-5 pl-7">
        {/* ── Card Header ── */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-sm shadow-sm ${AVATAR_COLORS[a.role]}`}>
              {a.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-800">{a.author}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_BADGE[a.role]}`}>
                  {a.role}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{a.timestamp}</span>
            </div>
          </div>

          {/* Manager / Author actions */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button onClick={() => onEdit(a)} className={`p-2 rounded-xl text-slate-400 transition-colors ${isLecturer ? 'hover:bg-emerald-50 hover:text-emerald-600' : 'hover:bg-indigo-50 hover:text-indigo-600'}`} title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(a.id)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Card Body ── */}
        <h3 className={`text-xl font-black text-slate-900 mb-3 leading-snug transition-colors ${isLecturer ? 'group-hover:text-emerald-700' : 'group-hover:text-indigo-700'}`}>
          {a.title}
        </h3>
        
        {/* Rich Text Representation */}
        <div className="ql-container ql-snow !border-none mb-4">
          <div 
            className="ql-editor text-sm text-slate-600 font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ __html: a.description }}
          />
        </div>

        {/* Attachment Payload */}
        {a.attachmentUrl && (
          <a 
            href={a.attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors mb-4"
          >
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[200px]">Attachment File</span>
            <Download className="w-3.5 h-3.5 ml-1 opacity-60" />
          </a>
        )}

        {/* ── Card Footer ── */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${TAG_STYLES[a.tag]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${TAG_DOT[a.tag]}`} />
              {a.tag}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
              {a.module}
            </span>
          </div>

          {(role === 'lecturer' || role === 'manager') && a.readPercentage !== undefined && (
            <div className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full cursor-help ${isLecturer ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-indigo-600 bg-indigo-50 border border-indigo-100'}`} title={`${a.readPercentage}% of all students have read this`}>
              <Eye className="w-3.5 h-3.5" />
              Read: {a.readPercentage}%
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Announcements() {
  const role = getCurrentRole();
  const isLecturer = role === 'lecturer';
  const [showComposer, setShowComposer] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filterModule, setFilterModule] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = useMemo(() => getUserFromStorage(), []);
  
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Pagination integration
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/announcement/${id}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      setAnnouncementsList(prev => prev.filter(a => a.id !== id));
      showToast('Announcement deleted successfully', 'success');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAnnouncementsList(prev => prev.filter(a => a.id !== id));
        showToast('Announcement had already been deleted.', 'success');
      } else {
        console.error(err);
        showToast('Failed to delete announcement.', 'error');
      }
    }
  };

  const handleEditSuccess = (updatedAnnouncement: Announcement) => {
    setAnnouncementsList(prev => prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
    showToast('Announcement edited successfully!', 'success');
  };

  const fetchAnnouncements = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsFetchingMore(true);
      else setIsLoading(true);

      const targetOffset = isLoadMore ? offset : 0;
      const res = await axios.get(`http://localhost:5000/api/announcement?limit=10&offset=${targetOffset}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        const fetched = res.data.announcements;
        if (fetched.length < 10) setHasMore(false);
        else setHasMore(true); // reset hasMore nicely
        
        if (isLoadMore) {
          setAnnouncementsList(prev => [...prev, ...fetched]);
        } else {
          setAnnouncementsList(fetched);
        }
        setOffset(targetOffset + 10);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      showToast('Failed to fetch announcements.', 'error');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Infinite Scroll Trigger Watcher
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
           fetchAnnouncements(true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isFetchingMore, offset]); // Add dependancies keeping references alive

  const handlePostSuccess = (newAnnouncement: Announcement) => {
    setAnnouncementsList(prev => [newAnnouncement, ...prev]);
    showToast('Announcement posted successfully!', 'success');
  };

  const modules = useMemo(() => {
    const set = new Set(announcementsList.map(a => a.module));
    return ['All', ...Array.from(set)];
  }, [announcementsList]);

  const filtered = useMemo(() => {
    let list = [...announcementsList];
    if (filterModule !== 'All') list = list.filter(a => a.module === filterModule);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return list;
  }, [filterModule, searchQuery, announcementsList]);

  const boardStats = useMemo(() => {
    const pinned = filtered.filter((a) => a.pinned).length;
    const urgent = filtered.filter((a) => a.tag === 'Urgent').length;
    const modulesCount = new Set(filtered.map((a) => a.module)).size;
    return { pinned, urgent, modulesCount };
  }, [filtered]);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 space-y-4"
      >
        <div className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-sm ${isLecturer ? 'border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40' : 'border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-teal-50/40'}`}>
          <div className={`absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl ${isLecturer ? 'bg-emerald-200/30' : 'bg-indigo-200/30'}`} />
          <div className="absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-teal-200/25 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isLecturer ? 'border-emerald-100 text-emerald-600' : 'border-indigo-100 text-indigo-600'}`}>
                <Megaphone className="w-3.5 h-3.5" /> Bulletin Stream
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Announcements</h1>
              <p className="text-sm text-slate-500 font-medium mt-2">A live campus feed for module updates, urgent notices, and institutional alerts.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-[320px]">
              <div className={`rounded-xl border bg-white/90 p-3 text-center ${isLecturer ? 'border-emerald-100' : 'border-indigo-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Feed</p>
                <p className={`text-xl font-black ${isLecturer ? 'text-emerald-700' : 'text-indigo-700'}`}>{filtered.length}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-white/90 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Urgent</p>
                <p className="text-xl font-black text-rose-700">{boardStats.urgent}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-white/90 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pinned</p>
                <p className="text-xl font-black text-amber-700">{boardStats.pinned}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all ${isLecturer ? 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400' : 'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400'}`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterModule}
                onChange={e => setFilterModule(e.target.value)}
                className={`w-full sm:w-auto text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none cursor-pointer ${isLecturer ? 'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400' : 'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400'}`}
              >
                {modules.map(m => (
                  <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Composer (Lecturer / Manager) ── */}
      <AnimatePresence>
        {(role === 'lecturer' || role === 'manager') && showComposer && !editingAnnouncement && (
          <ComposerCard 
            onClose={() => setShowComposer(false)} 
            onPostSuccess={handlePostSuccess} 
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
        {editingAnnouncement && (
          <EditComposerCard 
            initialData={editingAnnouncement}
            onClose={() => setEditingAnnouncement(null)} 
            onEditSuccess={handleEditSuccess} 
            onError={(msg) => showToast(msg, 'error')}
          />
        )}
      </AnimatePresence>

      {/* ── Feed ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className={`animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3 ${isLecturer ? 'border-emerald-600' : 'border-indigo-600'}`}></div>
            <h3 className="text-lg font-bold text-slate-400">Loading announcements...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-400">No announcements found.</h3>
            <p className="text-sm text-slate-400 mt-1">Try changing the module filter.</p>
          </div>
        ) : (
          <>
            {filtered.map((a, i) => (
              <AnnouncementCard 
                key={a.id} 
                announcement={a} 
                index={i} 
                role={role} 
                currentUser={currentUser}
                onEdit={(ann) => { setEditingAnnouncement(ann); setShowComposer(false); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                onDelete={handleDelete}
              />
            ))}
            
            {/* Observer Hook Loading Signal */}
            {hasMore && (
              <div ref={observerTarget} className="md:col-span-2 py-6 flex justify-center">
                <Loader2 className={`w-8 h-8 animate-spin opacity-50 ${isLecturer ? 'text-emerald-500' : 'text-indigo-500'}`} />
              </div>
            )}
            
            {!hasMore && filtered.length > 0 && (
              <p className="md:col-span-2 text-center text-slate-400 text-xs font-bold py-6">You've reached the end of the announcements.</p>
            )}
          </>
        )}
      </div>

      {/* ── FAB for Lecturer / Manager ── */}
      {(role === 'lecturer' || role === 'manager') && !showComposer && !editingAnnouncement && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
          onClick={() => setShowComposer(true)}
          className={`fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 ${isLecturer ? 'from-emerald-600 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/40' : 'from-indigo-600 to-teal-600 shadow-indigo-500/30 hover:shadow-indigo-500/40'}`}
          title="Create Announcement"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm z-50 flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
