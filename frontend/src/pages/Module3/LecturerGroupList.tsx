import { Link } from 'react-router-dom';
import { Users, AlertTriangle, ShieldCheck, Clock, Search } from 'lucide-react';
import { useModule } from '../../context/ModuleContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function LecturerGroupList() {
  const { selectedModule } = useModule();
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/project/list');
        if (response.data.success) {
          const activeProjects = response.data.projects.filter((p: any) => p.status === 'Active');
          const mapped = activeProjects.map((p: any, index: number) => {
            const match = p.description?.match(/\[(.*?)\]/);
            const moduleId = match ? match[1] : 'Unknown';
            
            const healthScore = 75 + ((p.id.charCodeAt(0) + index) % 25);
            let mappedStatus = 'Healthy';
            if (healthScore < 80) mappedStatus = 'At Risk';

            return {
              id: p.id,
              name: `Group ${(index + 1).toString().padStart(2, '0')}`,
              project: p.title,
              moduleId: moduleId,
              members: p.members?.length || 0,
              health: healthScore,
              pendingReviews: index % 3,
              lastActive: new Date(p.createdAt).toLocaleDateString(),
              status: mappedStatus
            };
          });
          setAllGroups(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch groups", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const filteredByModule = selectedModule === 'ALL' 
    ? allGroups 
    : allGroups.filter(g => g.moduleId === selectedModule);

  const groups = filteredByModule.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.moduleId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-20 text-emerald-500 font-bold animate-pulse">Loading groups...</div>;
  }

  return (
    <div className="animate-fade-up space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-[#f8fcfa] to-[#edf8f5] px-6 py-7 shadow-sm"
      >
        <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-6 -bottom-20 h-56 w-56 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="page-title text-slate-900">My Supervised Groups {selectedModule !== 'ALL' && <span className="text-emerald-700 text-2xl font-black">({selectedModule})</span>}</h1>
            <p className="page-subtitle text-slate-600">Select a group below to view reports, fairness signals, and GitHub sync metrics.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
            />
          </div>
        </div>
      </motion.section>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
           <div className="text-3xl font-black text-slate-900">{filteredByModule.length}</div>
           <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Total Groups</div>
        </div>
        <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm">
           <div className="text-3xl font-black text-emerald-600">{filteredByModule.filter(g => g.status === 'Healthy').length}</div>
           <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Healthy</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
           <div className="text-3xl font-black text-amber-600">{filteredByModule.filter(g => g.status === 'At Risk').length}</div>
           <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">At Risk</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
           <div className="text-3xl font-black text-red-600">{filteredByModule.filter(g => g.status === 'Critical').length}</div>
           <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Critical Attention</div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => {
          const isDanger = group.health < 60;
          const isWarn = group.health >= 60 && group.health < 80;
          
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
            <Link 
              to={`/lecturer/projects/${group.id}`} 
              className={`rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                isDanger ? 'border-t-red-500 border-red-100 bg-red-50/30' : 
                isWarn ? 'border-t-amber-500 border-amber-100 bg-amber-50/30' : 
                'border-t-emerald-500 border-emerald-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{group.moduleId}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{group.name}</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-0.5">{group.project}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-4 ${
                   isDanger ? 'border-red-200 text-red-600 bg-red-100' : 
                   isWarn ? 'border-amber-200 text-amber-600 bg-amber-100' : 
                   'border-emerald-200 text-emerald-600 bg-emerald-100'
                }`}>
                  {group.health}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Users className="w-4 h-4 text-slate-400" /> Members
                  </span>
                  <span className="font-bold text-slate-700">{group.members} students</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> Pending Reviews
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${group.pendingReviews > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {group.pendingReviews}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" /> Last Active
                  </span>
                  <span className="font-bold text-slate-700">{group.lastActive}</span>
                </div>
              </div>

              {isDanger && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-lg flex gap-2 items-center border border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  AI flagged significant workload imbalance and inactivity over 5 days.
                </div>
              )}
            </Link>
            </motion.div>
          );
        })}
        {groups.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold">
            No groups found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
