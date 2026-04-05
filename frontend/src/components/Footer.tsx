import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = ({ theme }: { theme?: 'landing' | 'student' | 'lecturer' | 'manager' }) => {
    return (
        <footer className={`w-full ${theme === 'landing' ? 'bg-white' : 'bg-slate-50'} border-t border-slate-200 z-10 relative overflow-hidden text-slate-500 font-sans mt-auto`}>
            
            {/* Animated Trace Beam extending across the top border */}
            <motion.div 
                className="absolute top-0 left-0 h-[2px] w-1/4 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80 shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                animate={{
                    x: ["-100%", "400%"]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            <div className="max-w-[1400px] px-6 mx-auto lg:px-8 py-16">
                
                {/* Main Bento Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="flex flex-col md:col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md relative group">
                                <div className="w-4 h-4 bg-white rounded-sm rotate-45 relative z-10 shadow-sm"></div>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-800 uppercase drop-shadow-sm">
                                Verity<span className="text-indigo-500">Sync</span>
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 max-w-sm">
                            The standard for verifiable academic intelligence. Eliminating the free-rider problem with irrefutable project governance and Aura AI fairness scoring.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:shadow-sm transition-all">
                                <Twitter strokeWidth={1.5} className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-800 hover:border-slate-300 hover:shadow-sm transition-all">
                                <Github strokeWidth={1.5} className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:shadow-sm transition-all">
                                <Linkedin strokeWidth={1.5} className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-teal-500 hover:border-teal-200 hover:shadow-sm transition-all">
                                <Mail strokeWidth={1.5} className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-6 uppercase tracking-widest text-[10px]">Product</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Project Tracking</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Aura Matrix Scores</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Risk Analysis</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">GitHub Sync</a></li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-6 uppercase tracking-widest text-[10px]">Resources</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><a href="#" className="text-slate-500 hover:text-teal-600 transition-colors inline-block hover:translate-x-1 origin-left">Documentation</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-teal-600 transition-colors inline-block hover:translate-x-1 origin-left">Academic Guides</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-teal-600 transition-colors inline-block hover:translate-x-1 origin-left">Help Center</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-teal-600 transition-colors inline-block hover:translate-x-1 origin-left">API Status</a></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-6 uppercase tracking-widest text-[10px]">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">About Verity</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Privacy Policy</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Terms of Service</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors inline-block hover:translate-x-1 origin-left">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Verity Sync · SLIIT Academic Intelligence Portal
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                        {/* Status Dot */}
                        <div className="relative flex w-2 h-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full w-2 h-2 bg-teal-500"></span>
                        </div>
                        <span>Aura Network Active</span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
