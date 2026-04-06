import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpenText, LogIn, UserPlus, ArrowRightToLine } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [activeSection, setActiveSection] = useState('home');

    const navLinks = [
        { id: 'features', label: 'Features', href: '#features' },
        { id: 'about', label: 'How It Works', href: '#about' },
        { id: 'pricing', label: 'Pricing', href: '#pricing' }
    ];

    const handleNavClick = (id: string) => {
        setActiveSection(id);
    };

    // Intersection Observer for auto-detecting active section on scroll
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (sectionId && navLinks.some(link => link.id === sectionId)) {
                        setActiveSection(sectionId);
                    }
                }
            });
        }, observerOptions);

        // Observe all nav sections
        navLinks.forEach((link) => {
            const element = document.getElementById(link.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            navLinks.forEach((link) => {
                const element = document.getElementById(link.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <motion.nav className="pointer-events-auto mx-auto flex w-full max-w-5xl items-center gap-1 sm:gap-2 rounded-full border border-white/80 bg-white/50 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all">
                <Link to="/" className="group flex items-center gap-2 shrink-0 border-r border-slate-200/60 pl-2 pr-3">
                    <motion.div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-400 text-white shadow-sm"
                        whileHover={{ scale: 1.05, rotate: 8 }}
                        transition={{ duration: 0.25 }}
                    >
                        <BookOpenText className="h-3.5 w-3.5" />
                    </motion.div>
                    <span className="hidden text-sm font-extrabold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600 sm:block">
                        Verity
                    </span>
                </Link>

                <div className="relative flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto no-scrollbar max-w-[50vw] sm:max-w-none">
                    {navLinks.map((link) => (
                        <motion.a
                            key={link.id}
                            href={link.href}
                            className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                activeSection === link.id ? 'text-indigo-600' : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
                            }`}
                            onClick={() => handleNavClick(link.id)}
                            onMouseEnter={() => handleNavClick(link.id)}
                        >
                            {activeSection === link.id && (
                                <motion.div
                                    layoutId="active-island-link"
                                    className="absolute inset-0 rounded-full border border-slate-100 bg-white shadow-[0_2px_10px_-3px_rgba(129,140,248,0.2)]"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{link.label}</span>
                        </motion.a>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-1 shrink-0 border-l border-slate-200/60 pl-3">
                    <motion.div whileHover={{ y: -1 }}>
                        <Link to="/login" className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
                            <LogIn className="h-4 w-4" />
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-[0.8rem] font-bold text-white shadow-[0_8px_24px_-12px_rgba(79,70,229,0.8)] transition-all hover:bg-indigo-700"
                        >
                            <UserPlus className="h-3 w-3" />
                            <span className="hidden sm:inline">Get Started</span>
                            <ArrowRightToLine className="h-3 w-3 sm:hidden" />
                        </Link>
                    </motion.div>
                </div>
            </motion.nav>
        </div>
    );
};

export default Navbar;
