import { Mail, Phone, MapPin, Github, Linkedin, Award, Book, Star, Users, Briefcase, ChevronRight, FileText, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  indexNumber?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  skills?: string;
  modules?: { id: string; code: string; name: string }[];
  semester?: {
    id?: string;
    name?: string;
    year?: { name?: string };
    modules?: { id: string; code: string; name: string }[];
  };
}

const LecturerProfile = () => {
  const localUser = (() => {
    try { 
      const data = JSON.parse(sessionStorage.getItem('user') || '{}');
      return data.user || data;
    } catch { return {}; }
  })();
  
  const [user, setUser] = useState<User>(localUser as User);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    mode: 'onChange'
  });

  // Fetch fresh data
  const fetchProfile = async () => {
    if (!localUser.id) return;
    try {
      const resp = await axios.get(`http://localhost:5000/api/user/${localUser.id}`);
      if (resp.data.success) {
        setUser(resp.data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditModal = () => {
    reset({
      name: user?.name,
      email: user?.email,
      indexNumber: user?.indexNumber || '',
      phone: user?.phone || '',
      github: user?.github || '',
      linkedin: user?.linkedin || '',
      skills: user?.skills || ''
    });
    setIsEditing(true);
  };

  const onUpdateProfile = async (data: any) => {
    setLoading(true);
    try {
      const resp = await axios.put(`http://localhost:5000/api/user/${user.id}`, {
        name: data.name,
        email: data.email,
        indexNumber: data.indexNumber,
        phone: data.phone,
        github: data.github,
        linkedin: data.linkedin,
        skills: data.skills
      });
      if (resp.data.success) {
        setUser(resp.data.user);
        setIsEditing(false);
      }
    } catch (e: AxiosError<{ message: string }>) {
      console.error("Update error", e);
      alert(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'DR';
  const name = user?.name || 'Lecturer';
  const skillList = (user?.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || ['Machine Learning', 'Software Architecture', 'Distributed Systems']);
  const assignedModules = Array.isArray(user?.modules) ? user.modules : [];
  const profileSignals = [
    { label: 'Faculty Reach', value: 'High', tone: 'from-emerald-500 to-emerald-600' },
    { label: 'Network Links', value: `${user?.github ? 1 : 0}${user?.linkedin ? '+1' : ''}`, tone: 'from-teal-500 to-cyan-500' },
    { label: 'Research Nodes', value: `${skillList.length}`, tone: 'from-lime-500 to-emerald-500' }
  ];
  
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 animate-fade-up">
      <div className="relative rounded-[2rem] border border-emerald-100 bg-white overflow-hidden shadow-sm">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -bottom-28 right-1/4 w-80 h-80 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-8 w-40 h-40 bg-teal-300/20 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <span className="text-3xl md:text-4xl font-black tracking-tight">{initials}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1">Faculty Identity Deck</p>
                    <h1 className="text-3xl md:text-4xl font-black leading-tight">{name}</h1>
                    <p className="text-xs md:text-sm text-emerald-100 font-semibold mt-1 uppercase tracking-[0.16em]">Senior Lecturer · Software Engineering Dept</p>
                    <p className="text-sm text-emerald-100/90 mt-2">SLIIT IT Faculty · ID: {user?.indexNumber || 'LEC10045'}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                  <Award className="w-4 h-4 text-emerald-200" /> Distinguished Faculty
                </div>
              </div>

              <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
                {profileSignals.map((signal) => (
                  <div key={signal.label} className="rounded-xl bg-white/10 border border-white/20 p-3 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">{signal.label}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xl font-black text-white">{signal.value}</p>
                      <div className={`h-2.5 w-10 rounded-full bg-gradient-to-r ${signal.tone}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-2 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-6 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Faculty Console</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">Shape your academic presence.</p>
                <p className="text-sm text-slate-600 mt-2 font-medium">Maintain contact links, expertise tags, and profile details for better coordination across guided groups.</p>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Last Sync</span>
                  <span className="text-sm font-bold text-slate-700">Just now</span>
                </div>
                <button onClick={openEditModal} className="w-full h-12 rounded-xl bg-emerald-700 text-white font-black uppercase tracking-wider text-xs hover:bg-emerald-800 transition">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contact & Skills */}
        <div className="space-y-8 animate-fade-up-delay-1">
          
          {/* Contact Information */}
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 relative overflow-hidden shadow-sm">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100/50 rounded-full blur-2xl" />
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
              <MapPin className="w-5 h-5 text-emerald-600" /> About & Contact
            </h3>
            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:border-emerald-200 transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                  <p className="text-slate-800 font-bold">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:border-emerald-200 transition-all">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Office Phone</p>
                  <p className="text-slate-800 font-bold">{user?.phone || 'Not Set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:border-emerald-200 transition-all">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GitHub</p>
                   {user?.github ? (
                    <a href={user.github} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 hover:underline">{user.github.replace('https://', '')}</a>
                  ) : (
                    <p className="text-slate-400 italic">Not connected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 group-hover:border-emerald-200 transition-all">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LinkedIn</p>
                  {user?.linkedin ? (
                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 hover:underline">{user.linkedin.replace('https://', '')}</a>
                  ) : (
                    <p className="text-slate-400 italic">Not connected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Skills */}
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-600" /> Research Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillList.map((skill: string) => (
                <span key={skill} className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-default transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Academics & Timeline */}
        <div className="lg:col-span-2 space-y-8 animate-fade-up-delay-2">
          
          {/* Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Groups', value: '14', icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Modules Taught', value: '3', icon: Book, color: 'text-teal-700', bg: 'bg-teal-50' },
              { label: 'Research Papers', value: '28', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Mentored Projects', value: '42', icon: Briefcase, color: 'text-lime-700', bg: 'bg-lime-50' },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 bg-white p-5 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-default shadow-sm">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 shadow-inner border border-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Academic Email</p>
              <p className="text-sm font-bold text-slate-800 truncate">{user?.email || 'Not Available'}</p>
            </div>
            <div className="rounded-2xl p-5 border border-teal-100 bg-gradient-to-r from-teal-50/70 to-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Office Phone</p>
              <p className="text-sm font-bold text-slate-800 truncate">{user?.phone || 'Not Set'}</p>
            </div>
            <div className="rounded-2xl p-5 border border-lime-100 bg-gradient-to-r from-lime-50/70 to-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Expertise</p>
              <p className="text-sm font-bold text-slate-800 truncate">{skillList.length} Focus Areas</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-100 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Book className="w-5 h-5 text-emerald-600" /> Assigned Modules
              </h3>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{assignedModules.length} Total</span>
            </div>
            <div className="p-6 bg-white">
              {assignedModules.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No modules assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {assignedModules.map((module) => (
                    <span
                      key={module.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50/70 text-emerald-700 text-xs font-black uppercase tracking-wider"
                    >
                      {module.code} - {module.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Teaching & Research Milestones
              </h3>
              <button className="text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 bg-white">
              <div className="relative border-l-2 border-emerald-100 ml-3 space-y-8">
                {[
                  { title: 'Published paper in IEEE Software Engineering', date: '3 days ago', type: 'research' },
                  { title: 'Successfully evaluated 14 IT3020 Groups', date: '2 weeks ago', type: 'academic' },
                  { title: 'Invited Keynote Speaker at TechCon 2026', date: '1 month ago', type: 'certification' },
                ].map((item, i) => (
                  <div key={i} className="relative pl-8 group">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm group-hover:scale-125 transition-transform" />
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-emerald-200 transition-all">
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative border border-emerald-100 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />
            <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition" title="Close modal">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">Edit Lecturer Profile</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">Update your details to keep faculty collaboration and mentoring records accurate.</p>
            
            <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Academic Email</label>
                <input type="email" {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /@/,
                    message: 'Email must contain @ symbol'
                  }
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Lecturer ID Number</label>
                <input {...register('indexNumber', {
                  pattern: {
                    value: /^LEC(?=.*5).*$/,
                    message: 'Must start with LEC and contain the number 5'
                  }
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" placeholder="e.g. LEC10045" />
                {errors.indexNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.indexNumber.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Office Phone</label>
                  <input {...register('phone', { 
                    pattern: {
                      value: /^(0\d{9}|\+94\d{9})$/,
                      message: 'Must start with 0 or +94 and be followed by 9 digits'
                    }
                  })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" placeholder="+94 ..." />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message as string}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">GitHub URL</label>
                  <input {...register('github', {
                    pattern: {
                      value: /^https:\/\/github\.com/,
                      message: 'Must start with https://github.com'
                    }
                  })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" placeholder="https://github.com/..." />
                  {errors.github && <p className="text-red-500 text-xs mt-1 font-bold">{errors.github.message as string}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">LinkedIn URL</label>
                <input {...register('linkedin', {
                  pattern: {
                    value: /^https:\/\/linkedin\.com\/in/,
                    message: 'Must start with https://linkedin.com/in'
                  }
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none" placeholder="https://linkedin.com/in/..." />
                {errors.linkedin && <p className="text-red-500 text-xs mt-1 font-bold">{errors.linkedin.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Research Interests <span className="text-slate-400 lowercase font-normal">(comma separated)</span></label>
                <textarea {...register('skills')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-bold text-slate-800 outline-none h-20 resize-none" placeholder="Machine Learning, Software Architecture, ..." />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-800 disabled:opacity-50 transition">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LecturerProfile;
