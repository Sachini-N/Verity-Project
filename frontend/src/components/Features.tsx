import { BrainCircuit, FolderSync, Network, Fingerprint, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

const Features = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <section id="features" className="w-full max-w-[1400px] px-6 mx-auto lg:px-8 py-32 z-10">

            <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 mb-6 drop-shadow-sm">
                    Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">verify.</span>
                </h2>
                <p className="text-lg text-slate-500 font-medium">
                    A suite of academic tools designed to seamlessly integrate into student workflows while providing lecturers with absolute visibility powered by Aura Intelligence.
                </p>
            </div>

            {/* Asymmetrical Bento 2.0 Grid (Clarity Mode) */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >

                {/* Hero Feature 1 - Spans 2 cols */}
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
                    <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01} transitionSpeed={2500} className="h-full block">
                        <div className="relative h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] overflow-hidden group cursor-pointer hover:shadow-[0_15px_40px_-5px_rgba(129,140,248,0.1)] transition-all flex flex-col justify-between min-h-[340px]">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BrainCircuit className="w-40 h-40 text-indigo-500 drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-6 shadow-sm border border-indigo-100 group-hover:scale-105 group-hover:shadow-[0_5px_15px_-3px_rgba(99,102,241,0.3)] transition-all">
                                    <BrainCircuit strokeWidth={2.5} className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Aura Fairness Engine</h3>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                                    Proprietary rule engine detects unequal contributions, flags last-minute work, and calculates irrefutable contribution matrices in real-time.
                                </p>
                            </div>
                        </div>
                    </Tilt>
                </motion.div>

                {/* Vertical Feature 2 */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.02} transitionSpeed={2500} className="h-full block">
                        <div className="h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] hover:-translate-y-1 hover:shadow-lg transition-all group cursor-pointer flex flex-col min-h-[340px]">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl mb-auto shadow-sm border border-teal-100 self-start group-hover:rotate-12 transition-transform">
                                <FolderSync strokeWidth={2.5} className="w-6 h-6" />
                            </div>
                            <div className="mt-8">
                                <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">Native Git Sync</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Live GitHub API maps branch commits directly into specific academic milestones automatically.
                                </p>
                            </div>
                        </div>
                    </Tilt>
                </motion.div>

                {/* Vertical Feature 3 */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.02} transitionSpeed={2500} className="h-full block">
                        <div className="h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] hover:-translate-y-1 hover:shadow-lg transition-all group cursor-pointer flex flex-col min-h-[340px]">
                            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl mb-auto shadow-sm border border-sky-100 self-start group-hover:-rotate-12 transition-transform">
                                <Network strokeWidth={2.5} className="w-6 h-6" />
                            </div>
                            <div className="mt-8">
                                <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">Dynamic Groups</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Secure peering, automated invites, and auto-generation of unique grading IDs for privacy.
                                </p>
                            </div>
                        </div>
                    </Tilt>
                </motion.div>

                {/* Dark Feature 4 - Spans 2 cols (Now Light Glass) */}
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                    <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={2500} className="h-full block">
                        <div className="relative h-full p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_10px_30px_-10px_rgba(129,140,248,0.2)] overflow-hidden group cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6 min-h-[200px]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(255,255,255,0.8)_0%,_transparent_60%)] pointer-events-none" />
                            
                            <div className="relative z-10 flex-1 w-full text-left">
                                <div className="inline-flex p-3 bg-white text-indigo-500 rounded-xl mb-4 border border-indigo-100 shadow-sm">
                                    <Fingerprint strokeWidth={2.5} className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Academic Hierarchy Embedded</h3>
                                <p className="text-indigo-900/60 font-medium leading-relaxed max-w-lg">
                                    Designed strictly for university scales. Administrators can manage faculties, semesters, and thousands of modules from a bird's-eye matrix view.
                                </p>
                            </div>
                            
                            <div className="relative z-10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                {/* Abstract Graphic representation */}
                                <div className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-200 flex items-center justify-center animate-spin-slow">
                                    <div className="w-20 h-20 rounded-full bg-white border border-indigo-200 shadow-[0_4px_15px_-3px_rgba(129,140,248,0.3)] flex items-center justify-center">
                                         <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tilt>
                </motion.div>
                
                {/* Visual Filler Card */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2500} className="h-full block">
                        <div className="h-full p-8 rounded-[2rem] bg-gradient-to-br from-indigo-400 to-teal-400 border border-transparent shadow-[0_10px_30px_-5px_rgba(99,102,241,0.4)] group cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden relative hover:shadow-[0_15px_40px_-5px_rgba(99,102,241,0.5)] transition-shadow">
                             <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-0 mix-blend-overlay" />
                             <div className="relative z-10 p-4 bg-white text-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                 <Target strokeWidth={2.5} className="w-8 h-8" />
                             </div>
                             <h3 className="relative z-10 text-white font-black text-xl mt-4">Precision Scoring</h3>
                        </div>
                    </Tilt>
                </motion.div>

            </motion.div>
        </section>
    );
};

export default Features;
