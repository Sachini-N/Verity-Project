import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';

const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 text-slate-800 overflow-hidden flex flex-col">
            
            {/* Soft Ambient Corner Blurs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40 z-0" />
            <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Micro Dot-Grid Texture */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative z-50">
                <Navbar />
            </div>

            <main className="relative z-10 flex flex-col items-center w-full flex-grow">
                <Hero />
                <Features />
                
                {/* Fluid Clarity CTA Section underneath features */}
                <section className="relative w-full py-32 mt-10 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(129,140,248,0.15)_0%,_transparent_70%)]" />
                    <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px] border-t border-slate-100" />
                    <div className="relative z-10 text-center max-w-4xl px-6">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-6 drop-shadow-sm">
                            Ready for Next-Level Insight?
                        </h2>
                        <p className="text-lg text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
                            Join thousands of educators leveraging Verity's Aura Intelligence to completely eliminate the free-rider problem.
                        </p>
                        <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                             <a href="/register" className="px-8 py-4 bg-indigo-600 border border-indigo-500 text-white rounded-full font-bold shadow-[0_4px_15px_-3px_rgba(79,70,229,0.4)] hover:shadow-[0_10px_25px_-3px_rgba(79,70,229,0.5)] transition-all hover:scale-105">
                                 Start Building Teams
                             </a>
                             <a href="/login" className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-indigo-200 text-indigo-700 rounded-full font-bold shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                 Sign In Workspace
                             </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer theme="landing" />
        </div>
    );
};

export default LandingPage;
