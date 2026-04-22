import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import ParticleNetwork from '../components/ParticleNetwork';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 text-slate-800 overflow-hidden flex flex-col">
            {/* Immersive Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <ParticleNetwork />

                {/* Top Right Indigo/Teal Glow */}
                <div
                    className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-b from-indigo-300/40 to-teal-300/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse"
                    style={{ animationDuration: '10s' }}
                />

                {/* Center Left Indigo Glow */}
                <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[60vw] rounded-full bg-gradient-to-tr from-indigo-200/35 to-sky-300/20 blur-[140px] mix-blend-multiply opacity-60" />

                {/* Bottom Center Teal Glow */}
                <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-gradient-to-t from-teal-200/40 to-indigo-200/20 blur-[120px] mix-blend-multiply opacity-50" />

                {/* Tech Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_60%,transparent_100%)] opacity-35" />
            </div>

            <div className="relative z-50">
                <Navbar />
            </div>

            <main className="relative z-10 flex flex-col items-center w-full flex-grow">
                <Hero />
                
                {/* Features Section */}
                <Features />
                
                {/* How It Works Section */}
                <section id="about" className="relative w-full py-32 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-sm border-t border-b border-slate-100" />
                    <div className="relative z-10 text-center max-w-5xl px-6">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-6 drop-shadow-sm">
                            How Verity Works
                        </h2>
                        <p className="text-lg text-slate-600 font-medium mb-16 max-w-3xl mx-auto">
                            Three simple steps to eliminate free-riders and ensure academic fairness across your institution.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { num: '01', title: 'Connect GitHub', desc: 'Link student repositories and track commits in real-time across project milestones.' },
                                { num: '02', title: 'Measure Activity', desc: 'Our Aura Engine maps commits, time logs, and task completion into contribution matrices.' },
                                { num: '03', title: 'Score Fairly', desc: 'Lecturers review irrefutable evidence of each student\'s individual contribution.' }
                            ].map((step, idx) => (
                                <div key={idx} className="relative">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                                        <div className="text-indigo-600 text-5xl font-black mb-4">{step.num}</div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-3 text-left">{step.title}</h3>
                                        <p className="text-slate-600 font-medium text-left flex-grow">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Key Benefits Section */}
                <section className="relative w-full py-32 overflow-hidden">
                    <div className="relative z-10 max-w-6xl mx-auto px-6">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-16 text-center drop-shadow-sm">
                            Why Choose Verity?
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {[
                                { title: 'Eliminate Free-Riders', desc: 'Get irrefutable proof of who did what. No more assumptions, no more complaints.' },
                                { title: 'Real-Time GitHub Sync', desc: 'Automatically map commits to academic milestones without manual intervention.' },
                                { title: 'Academic Hierarchy', desc: 'Manage faculties, semesters, modules, and students from a unified admin panel.' },
                                { title: 'Privacy Protected', desc: 'Unique grading IDs ensure student privacy while maintaining academic integrity.' }
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <CheckCircle className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{benefit.title}</h3>
                                        <p className="text-slate-600 font-medium">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section id="pricing" className="relative w-full py-32 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(129,140,248,0.15)_0%,_transparent_70%)]" />
                    <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px] border-t border-slate-100" />
                    <div className="relative z-10 text-center max-w-4xl px-6">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-6 drop-shadow-sm">
                            Ready to Transform Academic Governance?
                        </h2>
                        <p className="text-lg text-slate-600 font-medium mb-10 max-w-2xl mx-auto">
                            Join universities worldwide that have eliminated the free-rider problem. Start building fairer teams today.
                        </p>
                        <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/register" className="px-8 py-4 bg-indigo-600 border border-indigo-500 text-white rounded-full font-bold shadow-[0_4px_15px_-3px_rgba(79,70,229,0.4)] hover:shadow-[0_10px_25px_-3px_rgba(79,70,229,0.5)] transition-all hover:scale-105 flex items-center gap-2">
                                Start Building Teams
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/login" className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-indigo-200 text-indigo-700 rounded-full font-bold shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                Sign In to Workspace
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer theme="landing" />
        </div>
    );
};

export default LandingPage;
