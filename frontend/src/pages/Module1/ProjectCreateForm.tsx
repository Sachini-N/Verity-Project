import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Flag, ClipboardSignature, ArrowRight, Search, X, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';


export default function ProjectCreateForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      module: '',
      title: '',
      expectedSize: 4,
      members: [] as string[],
      abstract: ''
    },
    mode: 'onChange'
  });

  const selectedModule = watch('module');
  const expectedSize = Number(watch('expectedSize'));
  const selectedMembers = watch('members');

  // Member selection states (Internal UI State only)
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/manager/users');
        const data = await res.json();
        if (data.success) {
          setAllUsers(data.users.filter((u: any) => u.role === 'Student'));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/system/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
  }, []);

  const moduleLimit = (() => {
    const code = String(selectedModule || '').toUpperCase();
    const moduleSpecific = Number(settings?.moduleGroupSizes?.[code]);
    const globalLimit = Number(settings?.maxGroupSize) || 6;
    return Number.isFinite(moduleSpecific) && moduleSpecific >= 2 ? moduleSpecific : globalLimit;
  })();

  // Filter students based on search query, excluding already selected
  const suggestedMembers = allUsers.filter(u => 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !selectedMembers.includes(u.id)
  );

  // If the user reduces the expected size, we need to slice the array so it doesn't exceed the new limit
  useEffect(() => {
    const maxTeamSize = Math.min(expectedSize, moduleLimit);
    if (selectedMembers.length > maxTeamSize - 1) {
      setValue('members', selectedMembers.slice(0, maxTeamSize - 1), { shouldValidate: true });
    }
  }, [expectedSize, moduleLimit, selectedMembers, setValue]);

  useEffect(() => {
    if (expectedSize > moduleLimit) {
      setValue('expectedSize', moduleLimit, { shouldValidate: true });
    }
  }, [expectedSize, moduleLimit, setValue]);

  const handleAddMember = (id: string) => {
    if (selectedMembers.length >= Math.min(expectedSize, moduleLimit) - 1) { // -1 because the leader is implicitly the 1st
      return; 
    }
    setValue('members', [...selectedMembers, id], { shouldValidate: true });
    setSearchQuery('');
  };

  const removeMember = (id: string) => {
    setValue('members', selectedMembers.filter(m => m !== id), { shouldValidate: true });
  };

  const onSubmitForm = async (data: any) => {
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/project/create', {
        module: data.module,
        title: data.title,
        expectedSize: data.expectedSize,
        members: data.members,
        abstract: data.abstract
      });

      if (response.data.success) {
        navigate('/student/projects');
      } else {
        setErrorMsg(response.data.message || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Project Setup Error:', error);
      setErrorMsg(error.response?.data?.message || 'Server connection failed while attempting to setup project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-up pb-12">
      
      <div className="page-header border-b-emerald-200 mb-8">
        <h1 className="page-title text-emerald-900 flex items-center gap-3">
          <ClipboardSignature className="w-8 h-8 text-emerald-600" /> Group Registration Request
        </h1>
        <p className="page-subtitle text-slate-500">Submit a request to form a new project group for a specific module. Form your team by searching and selecting their IT numbers. Once approved by the Manager, you will be initialized as the Team Leader.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-600 rounded-xl flex items-start gap-4 shadow-sm animate-fade-up">
           <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
           <div>
             <h3 className="font-bold text-rose-900 leading-tight">Registration Conflict</h3>
             <p className="text-sm font-semibold text-rose-700/80 mt-1">{errorMsg}</p>
           </div>
        </div>
      )}

      <div className="card p-8 border-t-4 border-t-emerald-500 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
               <BookOpen className="w-4 h-4 text-emerald-600" /> Target Module
            </label>
            <select 
              {...register('module', { required: 'Module is required' })}
              className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer ${errors.module ? 'border-red-400' : 'border-slate-200'}`}
            >
              <option value="">Select Enrolled Module...</option>
              <option value="IT3022">IT3022 - Software Engineering</option>
              <option value="IT3030">IT3030 - IT Project Management</option>
              <option value="CD4000">CD4000 - AI Research Frameworks</option>
            </select>
            <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
              Module team size limit: <span className="font-black text-emerald-700">{moduleLimit} members</span>.
            </p>
            {errors.module && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.module.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Flag className="w-4 h-4 text-emerald-600" /> Proposed Project Title
            </label>
            <input 
              {...register('title', { 
                  required: 'Project Title is required', 
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
              })}
              className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="e.g. Verity Web System (Max 100 chars)"
              maxLength={100}
            />
            <div className="flex justify-between mt-1.5">
              {errors.title ? (
                <p className="text-red-500 text-xs font-bold">{errors.title.message as string}</p>
              ) : (
                <div />
              )}
              <p className={`text-[10px] font-bold ${watch('title').length > 90 ? 'text-amber-500' : 'text-slate-400'}`}>
                {watch('title').length} / 100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Users className="w-4 h-4 text-emerald-600" /> Expected Team Size
              </label>
              <select 
                {...register('expectedSize')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
              >
                {Array.from({ length: Math.max(0, moduleLimit - 1) }, (_, idx) => idx + 2).map(num => (
                  <option key={num} value={num}>{num} Members</option>
                ))}
              </select>
              {expectedSize > moduleLimit && (
                <p className="text-amber-600 text-xs mt-1.5 font-bold">This module only allows up to {moduleLimit} members. The selection will be capped automatically.</p>
              )}
            </div>
            
            {/* Auto-suggest Member Selection */}
            <div className="relative">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                 Search & Add Members
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  disabled={selectedMembers.length >= expectedSize - 1}
                  className={`w-full px-10 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${searchQuery && !/^IT\d*$/i.test(searchQuery) ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder={selectedMembers.length >= expectedSize - 1 ? `Max ${expectedSize} reached` : `Type IT number (e.g. IT2380...)`}
                />
              </div>
              {searchQuery && !/^IT\d*$/i.test(searchQuery) && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">Must start with IT followed by digits</p>
              )}
              {searchQuery.length > 10 && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">IT number cannot exceed 10 characters (IT + 8 digits)</p>
              )}

              {/* Suggestions Dropdown */}
              {isFocused && searchQuery && suggestedMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-xl overflow-y-auto max-h-48 z-10">
                  {suggestedMembers.map(u => (
                    <div 
                      key={u.dbId}
                      onMouseDown={(e) => { e.preventDefault(); handleAddMember(u.id); }}
                      className="px-4 py-3 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700 border-b border-slate-50 last:border-0 transition-colors text-sm"
                    >
                      <span className="text-slate-400 mr-2">{u.id}</span> {u.name}
                    </div>
                  ))}
                </div>
              )}
              {isFocused && searchQuery && suggestedMembers.length === 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-xl z-10 px-4 py-3 text-sm text-slate-400 font-medium">
                    No unmatched students found.
                 </div>
              )}
            </div>
          </div>

          {/* Selected Members Chips */}
          <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Assembled Team ({selectedMembers.length + 1} / {expectedSize})</h4>
             <div className="flex flex-wrap gap-2">
               {/* Leader Chip */}
               <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold border border-emerald-200 flex items-center gap-2">
                 You (Leader)
               </div>
               
               {/* Added Members Chips */}
               {selectedMembers.map(id => (
                 <div key={id} className="px-3 py-1.5 bg-white text-slate-700 rounded-lg text-sm font-bold border border-slate-200 flex items-center gap-2">
                   {id}
                   <button type="button" onClick={() => removeMember(id)} className="text-slate-400 hover:text-red-500 transition-colors">
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ))}
             </div>
             <p className="text-[11px] font-bold text-amber-600 mt-4 leading-relaxed">
               * Critical Rule: A student can only be registered to ONE active group per module. If any IT number selected is already enrolled in a group for <span className="text-amber-800">{selectedModule || 'the selected module'}</span>, this request will be instantly rejected by the system.
               <br />
               * Module team size limit: {moduleLimit} total members maximum for the selected module.
             </p>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Project Abstract / Proposal Brief</label>
            <textarea 
              {...register('abstract', { 
                  required: 'Project Abstract is required',
                  minLength: { value: 50, message: 'Abstract must be at least 50 characters long to provide sufficient detail.' }
              })}
              className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl outline-none min-h-[120px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 ${errors.abstract ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Provide a short description of what your group plans to build to help the manager validate the scope..."
            ></textarea>
            {errors.abstract && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.abstract?.message as string}</p>}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading || selectedMembers.length !== Math.min(expectedSize, moduleLimit) - 1}
              className="bg-emerald-600 text-white font-black px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Validating Members...
                </>
              ) : (
                <>
                  Submit Request for Approval <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
