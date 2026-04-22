import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface Reply {
  id: number;
  author: string;
  role: string;
  avatar: string;
  color: string;
  date: string;
  text: string;
}

interface Comment {
  id: number;
  author: string;
  role: string;
  avatar: string;
  color: string;
  date: string;
  text: string;
  replies: Reply[];
}

const mockComments: Comment[] = [
  {
    id: 1, author: 'Dr. Sarah Lee', role: 'Lecturer', avatar: 'SL', color: 'from-amber-500 to-orange-600',
    date: 'Oct 14, 3:15 PM', text: 'The schema normalization is well done. However, consider adding an index on the `user_id` foreign keys to improve query performance.',
    replies: [
      { id: 101, author: 'Alex Smith', role: 'Member', avatar: 'AS', color: 'from-red-500 to-orange-500', date: 'Oct 14, 4:00 PM', text: 'Thank you! I\'ll add the composite indexes in the next revision.' }
    ]
  },
  {
    id: 2, author: 'John Doe', role: 'Team Leader', avatar: 'JD', color: 'from-emerald-600 to-teal-700',
    date: 'Oct 13, 11:20 AM', text: 'The audit_log table structure looks good. Should we add a `metadata` JSONB column for extensibility?',
    replies: []
  },
];

export default function FileComments() {
  const { filename } = useParams<{ id: string, filename: string }>();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regReply, handleSubmit: handleReply, reset: resetReply } = useForm();

  const decodedFile = filename ? decodeURIComponent(filename) : 'Database Schema.sql';

  const onComment = (data: any) => {
    setComments((prev: Comment[]) => [...prev, {
      id: Date.now(), author: 'You', role: 'Member', avatar: 'ME', color: 'from-emerald-600 to-teal-700',
      date: 'Just now', text: data.comment, replies: []
    }]);
    reset();
  };

  const onReply = (data: any) => {
    setComments((prev: Comment[]) => prev.map((c: Comment) => c.id === replyTarget
      ? { ...c, replies: [...c.replies, { id: Date.now(), author: 'You', role: 'Member', avatar: 'ME', color: 'from-emerald-600 to-teal-700', date: 'Just now', text: data.reply }] }
      : c
    ));
    resetReply();
    setReplyTarget(null);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-8 border-l-4 border-l-emerald-500 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">💬</div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">File Comments</h2>
            <p className="text-xs font-black text-emerald-400 font-mono mt-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg inline-block truncate max-w-[280px]">
              {decodedFile}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/60 px-6 py-3 rounded-2xl border border-white/10 text-center">
            <span className="block text-2xl font-black text-white">{comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)}</span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Comments</span>
          </div>
          <button onClick={() => navigate(-1)} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-xl transition-colors">
            ← Back
          </button>
        </div>
      </div>

      {/* New Comment Form */}
      <div className="glass-panel p-8">
        <h3 className="text-lg font-black text-white mb-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm">✍️</span>
          Add a Comment
        </h3>
        <form onSubmit={handleSubmit(onComment)} className="space-y-4">
          <div>
            <textarea
              {...register('comment', { required: 'Comment cannot be empty', minLength: { value: 5, message: 'At least 5 characters' } })}
              className="glass-input h-28"
              placeholder="Share your thoughts, questions, or suggestions about this file..."
            />
            {errors.comment && <p className="text-red-400 text-xs font-bold mt-2">{errors.comment.message as string}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary !py-3 !px-8">Post Comment</button>
          </div>
        </form>
      </div>

      {/* Comment Thread */}
      <div className="space-y-6">
        {comments.map(comment => (
          <div key={comment.id} className="glass-panel p-8 hover:border-white/20 transition-all">
            {/* Comment Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${comment.color} flex items-center justify-center text-sm font-black text-white shadow-lg shrink-0`}>
                {comment.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-black text-white">{comment.author}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    comment.role === 'Lecturer' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>{comment.role}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-0.5">{comment.date}</p>
              </div>
            </div>

            {/* Comment Body */}
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5 mb-4">
              <p className="text-sm font-medium text-slate-200 leading-relaxed">{comment.text}</p>
            </div>

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="ml-8 space-y-4 border-l-2 border-white/5 pl-6 mb-4">
                {comment.replies.map(reply => (
                  <div key={reply.id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${reply.color} flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0`}>
                      {reply.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-black text-white text-sm">{reply.author}</p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{reply.date}</span>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-sm font-medium text-slate-300 leading-relaxed">{reply.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Button / Form */}
            {replyTarget === comment.id ? (
              <form onSubmit={handleReply(onReply)} className="ml-8 space-y-3 animate-in slide-in-from-top duration-200">
                <textarea
                  {...regReply('reply', { required: true })}
                  className="glass-input h-20 text-sm"
                  placeholder="Write a reply..."
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setReplyTarget(null)} className="px-4 py-2 text-sm font-black text-slate-400 hover:bg-white/5 rounded-xl border border-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 text-sm font-black bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-lg">
                    Reply
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setReplyTarget(comment.id)}
                className="ml-1 text-xs font-black text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2"
              >
                ↩ Reply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
