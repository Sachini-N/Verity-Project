import { ArrowRight, Activity, ShieldCheck, Github, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tilt from 'react-parallax-tilt';
import { motion, type Variants } from 'framer-motion';

const Hero = () => {
    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
    };

    return (
        <section className="relative flex flex-col items-center justify-center w-full max-w-[1400px] px-6 mx-auto pt-32 pb-20 lg:px-8 z-10">

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center text-center max-w-4xl z-20"
            >
                {/* Micro-Notification */}
                <motion.div variants={fadeInUp} className="group cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 mb-8 rounded-full border border-indigo-200/50 bg-indigo-50/50 backdrop-blur-md hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-[0_0_15px_-3px_rgba(129,140,248,0.2)]">
                    <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-widest uppercase text-indigo-700">Verity Aura Intelligence</span>
                    <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    variants={fadeInUp}
                    className="text-6xl sm:text-7xl lg:text-[5.5rem] font-black tracking-tighter text-slate-800 leading-[0.95] mb-6 drop-shadow-sm"
                >
                    The standard for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-teal-500 to-sky-500 drop-shadow-sm">
                        academic fairness.
                    </span>
                </motion.h1>

                {/* Sub-headline */}
                <motion.p variants={fadeInUp} className="max-w-2xl text-[1.2rem] text-slate-500 font-medium leading-relaxed mb-10">
                    Eliminate the free-rider problem. Verity triangulates GitHub commits, time logs, and task completion into one irrefutable contribution matrix.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link to="/register" className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-indigo-600 rounded-full shadow-[0_4px_15px_-3px_rgba(79,70,229,0.4)] hover:shadow-[0_10px_25px_-3px_rgba(79,70,229,0.5)] hover:scale-105 hover:-translate-y-0.5">
                        <span className="relative z-10 flex items-center">
                            Start Building Teams
                            <ArrowRight strokeWidth={2.5} className="ml-2 w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>
                    <Link to="#demo" className="flex items-center px-8 py-4 text-base font-bold transition-all bg-white/50 backdrop-blur-xl border border-indigo-200 rounded-full text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-[0_4px_15px_-3px_rgba(129,140,248,0.2)] group focus:outline-none">
                        <span>View Matrix Demo</span>
                        <ChevronRight strokeWidth={2.5} className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform opacity-70" />
                    </Link>
                </motion.div>
            </motion.div>

            {/* Epic Glassmorphism Dashboard Mesh Backdrop Presentation */}
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.4 }}
                className="relative w-full max-w-5xl mt-24 aspect-[16/9]"
            >
                {/* Glow behind the massive tilt dashboard */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-indigo-200/50 to-teal-100/50 blur-[80px] pointer-events-none rounded-full" />
                
                <Tilt
                    tiltMaxAngleX={3}
                    tiltMaxAngleY={3}
                    perspective={2000}
                    scale={1.01}
                    transitionSpeed={2500}
                    className="w-full h-full relative z-10"
                >
                    {/* The Light Glassmorphic Dashboard Panel (Clarity Mode) */}
                    <div className="absolute inset-0 rounded-[2rem] bg-white border border-slate-100 overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_white]">
                        {/* 3D Mesh / Wave visual in background of the fake dashboard */}
                        <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_rgba(129,140,248,0.1)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_left,_rgba(45,212,191,0.1)_0%,_transparent_50%)]" />

                        {/* Top Chrome */}
                        <div className="h-12 flex items-center px-6 border-b border-slate-100 bg-slate-50 relative z-10">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            </div>
                            <div className="mx-auto px-4 py-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-white rounded border border-slate-200 shadow-sm hidden sm:block">
                                workspace.verity.edu / matrix
                            </div>
                        </div>

                        {/* Dashboard Interior */}
                        <div className="flex-1 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                            {/* Fake Sidebar / Analytics Box */}
                            <div className="hidden md:flex col-span-3 h-full rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] flex-col p-4 space-y-4">
                                <div className="h-4 w-1/2 bg-indigo-100 rounded"></div>
                                <div className="flex-1 space-y-4 pt-4">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 w-full bg-slate-200 rounded-full"></div>)}
                                </div>
                            </div>

                            {/* Center Content */}
                            <div className="col-span-1 md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-6 h-fit">
                                {/* Glowing Stat Cards */}
                                {[
                                    { k: 1, c: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', val: '248', lbl: 'Commits Mapped', icon: Github },
                                    { k: 2, c: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100', val: 'Safe', lbl: 'Risk Assessment', icon: ShieldCheck },
                                    { k: 3, c: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', val: '98%', lbl: 'Aura Health Score', icon: Activity }
                                ].map(st => (
                                    <div key={st.k} className={`col-span-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03)] p-5 md:p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all`}>
                                        <div className="flex items-center space-x-2 text-slate-500">
                                            <div className={`p-2 rounded-lg ${st.bg} ${st.border} border`}><st.icon strokeWidth={2.5} className={`w-4 h-4 ${st.c}`} /></div>
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">{st.lbl}</div>
                                        <div className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mt-1">{st.val}</div>
                                    </div>
                                ))}

                                {/* Large Graph Mock */}
                                <div className="col-span-2 md:col-span-3 h-48 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden flex flex-col justify-end">
                                    <div className="absolute top-5 left-6 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-indigo-500" /> Sprint Velocity
                                    </div>
                                    <div className="flex items-end space-x-2 w-full h-[60%] justify-between gap-1 relative z-10">
                                        {[20, 30, 45, 60, 40, 80, 55, 90, 75, 100, 65, 85].map((h, idx) => (
                                            <div key={idx} className="flex-1 bg-indigo-50 rounded-t-sm relative border-t-2 border-indigo-200" style={{ height: `${h}%` }}>
                                                <div className="absolute top-0 w-full h-1 bg-indigo-400 shadow-[0_2px_5px_rgba(129,140,248,0.5)]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tilt>
            </motion.div>
        </section>
    );
};

export default Hero;
