import { Target, CheckCircle, Github, FileText, AlertTriangle, ArrowRight, GitCommit, GitPullRequest, Timer, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

type MemberTrackingMetric = {
  engagementScore?: number;
};

type MemberTrackingItem = {
  userId: string;
  name: string;
  metrics?: MemberTrackingMetric;
};

type MemberTrackingResponse = {
  success: boolean;
  members?: MemberTrackingItem[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } }
};

export default function StudentProjectOverview() {
  const { id } = useParams();
  const [members, setMembers] = useState<MemberTrackingItem[]>([]);

  useEffect(() => {
    if (!id) {
      setMembers([]);
      return;
    }

    let active = true;

    const fetchMembers = async () => {
      try {
        const resp = await fetch(`http://localhost:5000/api/project/member-tracking/${id}`);
        if (!resp.ok) return;

        const data = (await resp.json()) as MemberTrackingResponse;
        if (!active || !data.success || !Array.isArray(data.members)) return;

        setMembers(data.members);
      } catch {
        if (active) setMembers([]);
      }
    };

    fetchMembers();

    return () => {
      active = false;
    };
  }, [id]);

  const teamPeers = useMemo(() => {
    const palette = ['text-teal-500', 'text-indigo-500', 'text-teal-500', 'text-indigo-500'];
    const source = members.length > 0
      ? members
      : [
          { userId: 'fallback-1', name: 'Team Member', metrics: { engagementScore: 0 } },
          { userId: 'fallback-2', name: 'Team Member', metrics: { engagementScore: 0 } },
          { userId: 'fallback-3', name: 'Team Member', metrics: { engagementScore: 0 } }
        ];

    return source.slice(0, 4).map((member, index) => {
      const rawScore = Number(member.metrics?.engagementScore ?? 0);
      const safeScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;

      return {
        key: member.userId || `${member.name}-${index}`,
        name: member.name || 'Unknown Student',
        score: safeScore,
        color: palette[index % palette.length]
      };
    });
  }, [members]);

  const activityUsers = useMemo(() => {
    const fallback = ['Member 1', 'Member 2', 'Member 3'];
    const names = teamPeers.map((p) => p.name);
    return {
      a: names[0] || fallback[0],
      b: names[1] || fallback[1],
      c: names[2] || names[0] || fallback[2]
    };
  }, [teamPeers]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 auto-rows-max"
    >
      
      {/* Row 1: Hero Insight & Urgent Blocker */}
      
      {/* Hero Insight Card */}
      <motion.div variants={itemVariants} className="lg:col-span-8">
        <Tilt tiltMaxAngleX={1} tiltMaxAngleY={1} scale={1.01} transitionSpeed={2500} className="h-full block">
          <div className="relative h-full p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] flex flex-col justify-between group overflow-hidden cursor-pointer min-h-[220px]">
            {/* Background Light Glows */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-50/80 to-teal-50/50 rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
               <Target className="w-48 h-48 text-indigo-500 transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6 mb-8">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100 shadow-sm group-hover:scale-110 group-hover:shadow-[0_5px_15px_-3px_rgba(13,148,136,0.3)] transition-all">
                <Target strokeWidth={2.5} className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black mb-2 tracking-tight text-slate-800">Project is on track</h2>
                <p className="text-slate-500 font-medium max-w-lg leading-relaxed text-sm md:text-base">
                  Your team is consistently meeting milestone targets. The Aura AI Engine recommends shifting focus to <span className="text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">Frontend Integration</span> tasks to maintain parallel developmental velocity.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
               <span className="text-sm font-bold text-indigo-500 tracking-wide group-hover:text-indigo-600 transition-colors uppercase">View matrix analytics</span>
               <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:shadow-[0_5px_15px_-3px_rgba(99,102,241,0.4)] group-hover:text-white transition-all duration-300">
                  <ArrowRight strokeWidth={2.5} className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-slate-400 group-hover:text-white" />
               </div>
            </div>
          </div>
        </Tilt>
      </motion.div>

      {/* Action Items Bento */}
      <motion.div variants={itemVariants} className="lg:col-span-4">
        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.02} transitionSpeed={2500} className="h-full block">
           <div className="h-full p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] flex flex-col items-center justify-center text-center group cursor-pointer hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.14)] transition-all relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 blur-3xl rounded-full" />
             
             <div className="relative z-10 p-5 bg-amber-50 text-amber-600 rounded-3xl mb-4 border border-amber-100 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-sm">
               <AlertTriangle strokeWidth={2.5} className="w-10 h-10" />
             </div>
             <div className="relative z-10 text-6xl font-black text-slate-800 mb-2 tracking-tighter">1</div>
             <div className="relative z-10 text-xs font-black text-amber-600 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full border border-amber-100 shadow-sm">Urgent Blocker</div>
          </div>
        </Tilt>
      </motion.div>


      {/* Row 2: Standard Stats & Tall Git Feed */}
      
      {/* 3 Stats Grid */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'My Open Tasks', value: 3, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
          { label: 'Unmerged PRs', value: 2, icon: GitPullRequest, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'New Files', value: 5, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
        ].map(stat => (
          <motion.div variants={itemVariants} key={stat.label} className="col-span-1">
            <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.03} transitionSpeed={2500} className="h-full block">
              <div className="h-full p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(129,140,248,0.1)] transition-all group cursor-pointer flex flex-col justify-between min-h-[200px]">
                 <div className="flex flex-col mb-4">
                   <div className={`p-4 rounded-2xl w-fit ${stat.bg} border ${stat.border} mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                     <stat.icon strokeWidth={2.5} className={`w-6 h-6 ${stat.color}`} />
                   </div>
                   <div className="text-5xl font-black text-slate-800 tracking-tighter">{stat.value}</div>
                 </div>
                 <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>

      {/* Tall Git Activity Feed */}
      <motion.div variants={itemVariants} className="lg:col-span-4 lg:row-span-2">
        <div className="h-full min-h-[400px] p-2 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative">
           {/* Header */}
           <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                    <Github className="w-5 h-5 text-indigo-500" />
                 </div>
                 <h3 className="font-bold text-slate-800">Activity Feed</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
           </div>

           {/* Scrolling List */}
           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar relative z-0">
             {[
               { user: activityUsers.a, action: 'merged PR', target: '#42 Authentication', time: '10m', type: 'merge' },
               { user: activityUsers.b, action: 'pushed commit', target: 'e4f9a2b Fix layout', time: '1h', type: 'commit' },
               { user: 'System', action: 'generated', target: 'Aura Weekly Report', time: '3h', type: 'system' },
               { user: activityUsers.c, action: 'opened issue', target: 'Dark mode bug', time: '5h', type: 'issue' },
               { user: activityUsers.b, action: 'pushed commit', target: '9c2a1ff UI refactor', time: '1d', type: 'commit' },
               { user: activityUsers.a, action: 'completed task', target: 'Setup Auth route', time: '2d', type: 'task' },
             ].map((feed, i) => (
               <div key={i} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all flex gap-4 items-start cursor-pointer">
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-white shadow-sm ${
                    feed.type === 'merge' ? 'text-indigo-500 border-indigo-100' :
                    feed.type === 'commit' ? 'text-teal-500 border-teal-100' :
                    feed.type === 'system' ? 'text-teal-500 border-teal-100' :
                    'text-slate-500 border-slate-200'
                  }`}>
                     {feed.type === 'merge' ? <GitPullRequest className="w-4 h-4" /> : 
                      feed.type === 'commit' ? <GitCommit className="w-4 h-4" /> :
                      feed.type === 'system' ? <Activity className="w-4 h-4" /> : <GitCommit className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 leading-tight">
                      <span className="font-bold text-slate-800">{feed.user}</span> {feed.action} <span className="text-indigo-600 font-mono text-xs ml-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{feed.target}</span>
                    </p>
                    <span className="text-xs font-bold text-slate-400 mt-1.5 block uppercase tracking-widest">{feed.time} ago</span>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </motion.div>


      {/* Row 3: Aura Matrix Graph */}
      <motion.div variants={itemVariants} className="lg:col-span-8">
        <Tilt tiltMaxAngleX={1} tiltMaxAngleY={1} scale={1.01} transitionSpeed={2500} className="h-full block">
          <div className="h-full min-h-[300px] p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.1)] transition-all">
            
            <div className="relative z-10 flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <Activity className="w-6 h-6 text-indigo-500" strokeWidth={2.5} /> 
                   Aura Contribution Velocity
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Last 7 Days Iteration</p>
              </div>
              <div className="flex gap-2 text-xs font-bold bg-slate-50 p-1 rounded-xl border border-slate-100">
                 <div className="px-4 py-1.5 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-100">Commits</div>
                 <div className="px-4 py-1.5 text-slate-500 hover:text-slate-700 transition-colors">Tasks</div>
              </div>
            </div>

            {/* Glowing Advanced Graph Mockup using simple HTML/CSS */}
            <div className="relative z-10 h-40 w-full flex items-end justify-between px-2 gap-3 mt-auto">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between border-y border-dashed border-slate-200 pointer-events-none">
                 <div className="w-full border-b border-dashed border-slate-200 h-1/2" />
              </div>

              {/* Stacked bars simulating metric data */}
              {[40, 60, 45, 90, 75, 100, 85, 30, 50, 70, 80, 55, 95].map((val, idx) => (
                <div key={idx} className="relative w-full rounded-t-lg bg-slate-50 overflow-hidden flex-1 group-hover:scale-y-105 transition-transform origin-bottom" style={{ height: '100%' }}>
                   <div 
                     className="absolute bottom-0 w-full rounded-t-lg bg-indigo-400 border-t-2 border-indigo-300 shadow-sm transition-all duration-500" 
                     style={{ height: `${val}%`, transitionDelay: `${idx * 20}ms` }} 
                   />
                   <div 
                     className="absolute bottom-0 w-full rounded-t-lg bg-teal-400 opacity-60 mix-blend-multiply hover:opacity-100 transition-opacity" 
                     style={{ height: `${val * 0.4}%` }} 
                   />
                </div>
              ))}
            </div>
          </div>
        </Tilt>
      </motion.div>


      {/* Row 4: Team Peers & Sprint Countdown */}
      
      {/* Team "Aura Rings" */}
      <motion.div variants={itemVariants} className="lg:col-span-6">
        <div className="h-full p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl" />
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
              <Users className="w-5 h-5 text-teal-500" />
              Team Aura Cohesion
           </h3>
           
           <div className="flex items-center justify-around relative z-10">
             {teamPeers.map((peer) => (
               <div key={peer.key} className="flex flex-col items-center group/peer cursor-pointer hover:-translate-y-1 transition-transform">
                  <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                     {/* SVG Ring */}
                     <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-sm">
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-50" />
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * peer.score) / 100} className={`${peer.color} group-hover/peer:stroke-indigo-400 transition-all duration-1000 ease-out`} strokeLinecap="round" />
                     </svg>
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-white">
                       <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${peer.name}&backgroundColor=transparent`} alt={peer.name} className="w-full h-full object-cover scale-110" />
                     </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{peer.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${peer.color} mt-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100`}>{peer.score} AF</span>
               </div>
             ))}
           </div>
        </div>
      </motion.div>

      {/* Sprint Milestone Countdown */}
      <motion.div variants={itemVariants} className="lg:col-span-6">
        <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.02} transitionSpeed={2500} className="h-full block">
          <div className="h-full p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 shadow-[0_10px_20px_-5px_rgba(129,140,248,0.1)] flex items-center justify-between group overflow-hidden relative cursor-pointer hover:shadow-[0_15px_30px_-5px_rgba(129,140,248,0.2)] transition-all">
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/60 blur-[40px] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-700" />
             
             <div className="relative z-10">
                <div className="inline-flex p-4 bg-white text-indigo-600 rounded-2xl mb-4 shadow-sm border border-white">
                  <Timer strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">Milestone Due</h3>
                <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest">Frontend Deliverables Phase 2</p>
             </div>

             <div className="flex gap-3 text-center z-10 mr-4">
                {[
                  { val: '04', lbl: 'Days' },
                  { val: '12', lbl: 'Hrs' },
                  { val: '45', lbl: 'Min' }
                ].map((time, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-16 h-20 bg-white border border-slate-100 shadow-sm rounded-[1.25rem] flex items-center justify-center text-3xl font-black text-slate-800 mb-2 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {time.val}
                    </div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">{time.lbl}</span>
                  </div>
                ))}
             </div>
          </div>
        </Tilt>
      </motion.div>

    </motion.div>
  );
}
