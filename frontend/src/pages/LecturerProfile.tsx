import { Mail, Phone, MapPin, Github, Linkedin, Award, Book, Star, Users, Briefcase, ChevronRight, FileText, X } from 'lucide-react';
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
  
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 animate-fade-up">
      
      {/* Hero Section */}
      <div className="relative bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden card">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-indigo-900 via-indigo-800 to-stone-700 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-20" />
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <Award className="w-4 h-4 text-indigo-300" />
            Distinguished Faculty
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="px-6 md:px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            
            {/* Avatar & Text Group */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto">
              <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-xl shadow-indigo-900/10 z-10 -mt-16 shrink-0 rotate-3 transition-transform hover:rotate-0 duration-300">
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-stone-50 rounded-xl flex items-center justify-center border border-indigo-200">
                  <span className="text-4xl font-black text-indigo-900">{initials}</span>
                </div>
              </div>
              
              <div className="text-center md:text-left mb-1 flex-1">
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">{name}</h1>
                  <span className="badge-rose px-3 py-1 text-[10px] mt-0.5">ACADEMIC STAFF</span>
                </div>
                <p className="text-sm font-bold text-indigo-700 tracking-widest uppercase mb-1 drop-shadow-sm">Senior Lecturer · Software Engineering Dept</p>
                <p className="text-sm text-slate-500 font-medium">SLIIT IT Faculty · ID: LEC10045</p>
              </div>
            </div>
            
            {/* Buttons Group */}
            <div className="flex gap-3 mb-1 shrink-0">
              <button onClick={openEditModal} className="btn-primary rounded-xl py-2 px-6 shadow-md h-11 text-sm bg-indigo-900 hover:bg-indigo-900 border-none">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contact & Skills */}
        <div className="space-y-8 animate-fade-up-delay-1">
          
          {/* Contact Information */}
          <div className="card p-6 border-transparent bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
              <MapPin className="w-5 h-5 text-indigo-600" /> Professional Details
            </h3>
            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-700 shrink-0 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                  <p className="text-slate-800 font-bold">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-700 shrink-0 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Office Phone</p>
                  <p className="text-slate-800 font-bold">{user?.phone || 'Not Set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-700 shrink-0 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GitHub</p>
                   {user?.github ? (
                    <a href={user.github} target="_blank" rel="noreferrer" className="text-indigo-700 hover:text-indigo-800 hover:underline">{user.github.replace('https://', '')}</a>
                  ) : (
                    <p className="text-slate-400 italic">Not connected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-700 shrink-0 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LinkedIn</p>
                  {user?.linkedin ? (
                    <a href={user.linkedin} target="_blank" rel="noreferrer" className="text-indigo-700 hover:text-indigo-800 hover:underline">{user.linkedin.replace('https://', '')}</a>
                  ) : (
                    <p className="text-slate-400 italic">Not connected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Skills */}
          <div className="card p-6 border-transparent">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-600" /> Research Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {(user?.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || ['Machine Learning', 'Software Architecture']).map((skill: string) => (
                <span key={skill} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 cursor-default transition-colors">
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
              { label: 'Active Groups', value: '14', icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-50' },
              { label: 'Modules Taught', value: '3', icon: Book, color: 'text-stone-600', bg: 'bg-stone-50' },
              { label: 'Research Papers', value: '28', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Mentored Projects', value: '42', icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map((stat, i) => (
              <div key={i} className="card p-5 border-transparent flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-default">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 shadow-inner`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Achievements */}
          <div className="card border-transparent overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" /> Teaching & Research Milestones
              </h3>
              <button className="text-sm font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-50/50">
              <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
                {[
                  { title: 'Published paper in IEEE Software Engineering', date: '3 days ago', type: 'research' },
                  { title: 'Successfully evaluated 14 IT3020 Groups', date: '2 weeks ago', type: 'academic' },
                  { title: 'Invited Keynote Speaker at TechCon 2026', date: '1 month ago', type: 'certification' },
                ].map((item, i) => (
                  <div key={i} className="relative pl-8 group">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-sm group-hover:scale-125 transition-transform" />
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-indigo-200 transition-all">
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
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition" title="Close modal">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">Edit Lecturer Profile</h2>
            
            <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" />
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
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Lecturer ID Number</label>
                <input {...register('indexNumber', {
                  pattern: {
                    value: /^LEC(?=.*5).*$/,
                    message: 'Must start with LEC and contain the number 5'
                  }
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" placeholder="e.g. LEC10045" />
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
                  })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" placeholder="+94 ..." />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message as string}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">GitHub URL</label>
                  <input {...register('github', {
                    pattern: {
                      value: /^https:\/\/github\.com/,
                      message: 'Must start with https://github.com'
                    }
                  })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" placeholder="https://github.com/..." />
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
                })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none" placeholder="https://linkedin.com/in/..." />
                {errors.linkedin && <p className="text-red-500 text-xs mt-1 font-bold">{errors.linkedin.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Research Interests <span className="text-slate-400 lowercase font-normal">(comma separated)</span></label>
                <textarea {...register('skills')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 outline-none h-20 resize-none" placeholder="Machine Learning, Software Architecture, ..." />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-900 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-900 disabled:opacity-50 transition">
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
