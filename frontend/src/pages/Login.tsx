import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Footer from '../components/Footer';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        mode: 'onChange'
    });

    const onSubmitUser = async (formData: any) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token and user data
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data));

            // Route to the correct portal based on role
            const role = data.role || data.user?.role;
            if (role === 'lecturer' || role === 'LECTURER') {
                navigate('/lecturer/dashboard');
            } else if (role === 'manager' || role === 'MANAGER') {
                navigate('/manager/approvals');
            } else {
                navigate('/student/projects');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFCFF] relative overflow-hidden">
            {/* Background Ambient Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/50 to-emerald-50/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-emerald-50/30 to-teal-50/20 rounded-full blur-[120px] -z-10" />

            <div className="flex-1 flex items-center justify-center py-12 px-6 relative z-10">
                <Link to="/" className="absolute top-8 left-8 flex items-center space-x-2 group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 shadow-sm transition-transform group-hover:scale-105">
                        <BookOpenText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-800">VERITY</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-10"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Welcome back</h2>
                        <p className="text-slate-500 font-medium">Log in to your academic workspace.</p>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmitUser)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email address</label>
                            <input
                                type="email"
                                {...register('email', { 
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                                })}
                                className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'}`}
                                placeholder="student@demo.edu"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message as string}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'}`}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-bold">{errors.password.message as string}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 group"
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>Signing in...</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-2">
                                    <span>Sign in to Verity</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm font-medium text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
