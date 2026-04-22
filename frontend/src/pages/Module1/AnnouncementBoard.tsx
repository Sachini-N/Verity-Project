import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function AnnouncementBoard() {
  const { id } = useParams(); // Project ID
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAnnouncements = async () => {
    try {
      const resp = await axios.get(`http://localhost:5000/api/announcement/${id}`);
      if (resp.data.success) {
        setAnnouncements(resp.data.announcements.map((a: any) => ({
          ...a,
           date: new Date(a.createdAt).toLocaleDateString()
        })));
      }
    } catch (e) { console.error('Error fetching announcements', e); }
  };

  useEffect(() => {
    if (id) fetchAnnouncements();
  }, [id]);

  const onPost = async (data: any) => {
    try {
      await axios.post('http://localhost:5000/api/announcement/create', {
        projectId: id,
        title: data.title,
        content: data.content
      });
      reset();
      fetchAnnouncements();
    } catch (e) { console.error('Error posting announcement', e); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Broadcast Form */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">📢 Post Announcement</h3>
          <form onSubmit={handleSubmit(onPost)} className="space-y-4">
            <div>
              <input 
                {...register('title', { required: 'Message title is required' })}
                placeholder="Announcement Title"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              {errors.title && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.title.message as string}</p>}
            </div>
            <div>
              <textarea 
                {...register('content', { required: 'Content is required' })}
                placeholder="Important message for the team..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[140px] font-medium text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              {errors.content && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.content.message as string}</p>}
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-900/10">
              Broadcast Message
            </button>
          </form>
        </div>
      </div>

      {/* Board Feed */}
      <div className="xl:col-span-2 space-y-5">
        <h2 className="text-2xl font-black text-slate-800 mb-2 px-2">Team Noticeboard</h2>
        {announcements.map(ann => (
          <div 
            key={ann.id} 
            className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-100 transition-all cursor-pointer group" 
            onClick={() => setSelectedAnnouncement(ann)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{ann.title}</h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">{ann.date}</span>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2">{ann.content}</p>
          </div>
        ))}
      </div>

      {/* Detail Modal placeholder */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-3xl w-full max-w-xl shadow-2xl relative">
            <button 
              onClick={() => setSelectedAnnouncement(null)} 
              className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full font-bold transition-colors"
            >
              ×
            </button>
            <div className="pr-12">
              <span className="text-xs font-black tracking-widest text-emerald-500 uppercase mb-2 block">Announcement</span>
              <h3 className="text-3xl font-black mb-4 text-slate-900 leading-tight">{selectedAnnouncement.title}</h3>
              <p className="text-sm font-bold text-slate-400 mb-8 border-b border-slate-100 pb-4">Posted: {selectedAnnouncement.date}</p>
              <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
