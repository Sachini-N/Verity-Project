import { BrainCircuit, FolderSync, Network, Fingerprint, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

const Features = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.9 },
        show: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: "spring", 
                stiffness: 100, 
                damping: 20,
                duration: 0.6
            } 
        }
    };

    const iconVariants = {
        rest: { rotate: 0, scale: 1 },
        hover: { rotate: 6, scale: 1.1, transition: { duration: 0.3 } }
    };

    const floatVariants = {
        animate: { 
            y: [0, -8, 0],
            transition: { 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <section id="features" className="w-full max-w-[1400px] px-6 mx-auto lg:px-8 py-32 z-10">

            <div className="text-center mb-20 max-w-3xl mx-auto">
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-black tracking-tighter text-slate-800 mb-6 drop-shadow-sm"
                >
                    Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-600">verify.</span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-lg text-slate-600 font-medium"
                >
                    A suite of academic tools designed to seamlessly integrate into student workflows while providing lecturers with absolute visibility powered by Aura Intelligence.
                </motion.p>
            </div>

            {/* Asymmetrical Bento 2.0 Grid (Clarity Mode) */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >

                {/* Hero Feature 1 - Spans 2 cols */}
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01} transitionSpeed={2500} className="h-full block">
                            <div className="relative h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] overflow-hidden group cursor-pointer transition-all flex flex-col justify-between min-h-[340px]">
                                <motion.div 
                                    className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-15 transition-opacity"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                    <BrainCircuit className="w-40 h-40 text-indigo-500 drop-shadow-md" />
                                </motion.div>
                                
                                <div className="relative z-10">
                                    <motion.div 
                                        className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-6 shadow-sm border border-indigo-100 transition-all"
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                    >
                                        <BrainCircuit strokeWidth={2.5} className="w-8 h-8" />
                                    </motion.div>
                                    <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Aura Fairness Engine</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed max-w-sm">
                                        Proprietary rule engine detects unequal contributions, flags last-minute work, and calculates irrefutable contribution matrices in real-time.
                                    </p>
                                </div>
                                <motion.div 
                                    className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'radial-gradient(circle at top right, rgba(129,140,248,0.1), transparent)' }}
                                />
                            </div>
                        </Tilt>
                    </motion.div>
                </motion.div>

                {/* Vertical Feature 2 */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.02} transitionSpeed={2500} className="h-full block">
                            <div className="relative h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] transition-all group cursor-pointer flex flex-col min-h-[340px] hover:shadow-[0_18px_45px_-6px_rgba(20,184,166,0.2)] overflow-hidden">
                                <motion.div
                                    className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-teal-200/55 blur-3xl"
                                    animate={{ x: [0, -20, 0], y: [0, 18, 0], opacity: [0.45, 0.8, 0.45], scale: [1, 1.12, 1] }}
                                    transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <motion.div
                                    className="relative mb-auto self-start"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <motion.div
                                        className="absolute -inset-2 rounded-2xl border border-teal-300/40"
                                        animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                    />
                                    <motion.div
                                        className="p-3 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100 transition-all"
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        animate={{ rotate: [0, -6, 0, 6, 0] }}
                                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <FolderSync strokeWidth={2.5} className="w-6 h-6" />
                                    </motion.div>
                                </motion.div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">Native Git Sync</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Live GitHub API maps branch commits directly into specific academic milestones automatically.
                                    </p>
                                </div>
                                <motion.div 
                                    className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'radial-gradient(circle at top right, rgba(20,184,166,0.1), transparent)' }}
                                />
                                <motion.div
                                    className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                                    animate={{ x: ['-10%', '260%'] }}
                                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </div>
                        </Tilt>
                    </motion.div>
                </motion.div>

                {/* Vertical Feature 3 */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.02} transitionSpeed={2500} className="h-full block">
                            <div className="relative h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_white] transition-all group cursor-pointer flex flex-col min-h-[340px] hover:shadow-[0_18px_45px_-6px_rgba(14,165,233,0.2)] overflow-hidden">
                                <motion.div
                                    className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-sky-200/55 blur-3xl"
                                    animate={{ x: [0, 16, 0], y: [0, -18, 0], opacity: [0.4, 0.78, 0.4], scale: [1, 1.12, 1] }}
                                    transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <motion.div
                                    className="relative mb-auto self-start"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <motion.div
                                        className="absolute -inset-2 rounded-2xl border border-sky-300/40"
                                        animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                                        transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
                                    />
                                    <motion.div
                                        className="p-3 bg-sky-50 text-sky-600 rounded-xl shadow-sm border border-sky-100 transition-all"
                                        variants={iconVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        animate={{ rotate: [0, 6, 0, -6, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Network strokeWidth={2.5} className="w-6 h-6" />
                                    </motion.div>
                                </motion.div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">Dynamic Groups</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Secure peering, automated invites, and auto-generation of unique grading IDs for privacy.
                                    </p>
                                </div>
                                <motion.div 
                                    className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'radial-gradient(circle at top right, rgba(14,165,233,0.1), transparent)' }}
                                />
                                <motion.div
                                    className="absolute -right-1/2 top-0 h-full w-1/2 bg-gradient-to-l from-transparent via-white/35 to-transparent"
                                    animate={{ x: ['10%', '-260%'] }}
                                    transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </div>
                        </Tilt>
                    </motion.div>
                </motion.div>

                {/* Dark Feature 4 - Spans 2 cols (Now Light Glass) */}
                <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} transitionSpeed={2500} className="h-full block">
                            <div className="relative h-full p-8 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-100 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_10px_30px_-10px_rgba(129,140,248,0.2)] overflow-hidden group cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6 min-h-[200px] transition-all hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_15px_40px_-5px_rgba(129,140,248,0.3)]">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(255,255,255,0.8)_0%,_transparent_60%)] pointer-events-none" />
                                
                            
                            <div className="relative z-10 flex-1 w-full text-left">
                                <motion.div 
                                    className="inline-flex p-3 bg-white text-indigo-500 rounded-xl mb-4 border border-indigo-100 shadow-sm"
                                    variants={iconVariants}
                                    initial="rest"
                                    whileHover="hover"
                                >
                                    <Fingerprint strokeWidth={2.5} className="w-6 h-6" />
                                </motion.div>
                                <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Academic Hierarchy Embedded</h3>
                                <p className="text-indigo-900/70 font-medium leading-relaxed max-w-lg">
                                    Designed strictly for university scales. Administrators can manage faculties, semesters, and thousands of modules from a bird's-eye matrix view.
                                </p>
                            </div>
                            
                            <motion.div 
                                className="relative z-10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                                variants={floatVariants}
                                animate="animate"
                            >
                                {/* Abstract Graphic representation */}
                                <div className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-300 flex items-center justify-center">
                                    <motion.div 
                                        className="w-20 h-20 rounded-full bg-white border border-indigo-200 shadow-[0_4px_15px_-3px_rgba(129,140,248,0.4)] flex items-center justify-center"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Zap className="w-6 h-6 text-indigo-500" />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </Tilt>
                    </motion.div>
                </motion.div>
                
                {/* Visual Filler Card */}
                <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2500} className="h-full block">
                            <div className="h-full p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-teal-500 border border-transparent shadow-[0_10px_30px_-5px_rgba(99,102,241,0.4)] group cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden relative transition-all hover:shadow-[0_20px_40px_-5px_rgba(99,102,241,0.6)]">
                                <motion.div 
                                    className="absolute inset-0 bg-white/10 backdrop-blur-sm z-0 mix-blend-overlay"
                                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <motion.div 
                                    className="relative z-10 p-4 bg-white text-indigo-500 rounded-2xl shadow-lg transition-all"
                                    whileHover={{ scale: 1.2, rotate: 12 }}
                                    animate={{ 
                                        y: [0, -4, 0],
                                        transition: { duration: 3, repeat: Infinity }
                                    }}
                                >
                                    <Target strokeWidth={2.5} className="w-8 h-8" />
                                </motion.div>
                                <motion.h3 
                                    className="relative z-10 text-white font-black text-xl mt-4"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Precision Scoring
                                </motion.h3>
                            </div>
                        </Tilt>
                    </motion.div>
                </motion.div>

            </motion.div>
        </section>
    );
};

export default Features;
