import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Footer from '../components/Footer';

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
        clearErrors
    } = useForm({
        mode: 'onChange'
    });

    const [years, setYears] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
    const selectedYearId = watch('yearId');

    useEffect(() => {
        fetchYears();
        if (role === 'LECTURER') {
            fetchModules();
        }
    }, [role]);

    useEffect(() => {
        if (selectedYearId) {
            fetchSemesters(selectedYearId);
        } else {
            setSemesters([]);
        }
        setValue('semesterId', '');
    }, [selectedYearId, setValue]);

    const fetchYears = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/academic/years');
            const data = await res.json();
            if (res.ok) setYears(data);
        } catch (err) {
            console.error('Failed to fetch years', err);
        }
    };

    const fetchSemesters = async (yearId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/academic/years/${yearId}/semesters`);
            const data = await res.json();
            if (res.ok) setSemesters(data);
        } catch (err) {
            console.error('Failed to fetch semesters', err);
        }
    };

    const fetchModules = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/academic/modules');
            const data = await res.json();
            if (res.ok) setModules(data);
        } catch (err) {
            console.error('Failed to fetch modules', err);
        }
    };

    const toggleModuleSelection = (id: string) => {
        const newModules = selectedModuleIds.includes(id) 
            ? selectedModuleIds.filter(m => m !== id) 
            : [...selectedModuleIds, id];
        
        setSelectedModuleIds(newModules);
        setValue('moduleIds', newModules, { shouldValidate: role === 'LECTURER' });
    };

    const onSubmitUser = async (formData: any) => {
        if (role === 'LECTURER' && selectedModuleIds.length === 0) {
            setError('Please select at least one module to assign to your profile.');
            return;
        }

        setLoading(true);
        setError('');

        const endpoint = role === 'STUDENT' ? '/api/auth/register/student' : '/api/auth/register/lecturer';
        const payload: any = { 
            name: formData.name, 
            email: formData.email, 
            password: formData.password 
        };

        if (role === 'STUDENT') {
            payload.indexNumber = formData.indexNumber;
            payload.semesterId = formData.semesterId;
        } else {
            payload.moduleIds = selectedModuleIds;
        }

        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data));
            if (role === 'STUDENT') {
                navigate('/student/projects');
            } else {
                navigate('/lecturer/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FAFCFF] relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-emerald-100/50 to-emerald-50/20 rounded-full blur-[100px] -z-10" />

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
                    className="w-full max-w-xl bg-white/60 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-10 mt-8"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Create an account</h2>
                        <p className="text-slate-500 font-medium">Join the intelligent academic governance platform.</p>
                    </div>

                    <div className="flex p-1 mb-8 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setRole('STUDENT'); reset(); clearErrors(); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'STUDENT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRole('LECTURER'); reset(); clearErrors(); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'LECTURER' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lecturer
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmitUser)} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    {...register('name', { 
                                        required: 'Full name is required',
                                        pattern: { value: /^[a-zA-Z\s]*$/, message: 'Only letters and spaces allowed' }
                                    })} 
                                    className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium ${errors.name ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                    placeholder="John Doe" 
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message as string}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email address</label>
                                <input 
                                    type="email" 
                                    {...register('email', { 
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                    })} 
                                    className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium ${errors.email ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                    placeholder="john@uni.edu" 
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message as string}</p>}
                            </div>
                        </div>

                        {role === 'STUDENT' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Student Index / IT Number</label>
                                    <input 
                                        type="text" 
                                        {...register('indexNumber', { 
                                            required: 'IT Number is required',
                                            pattern: { value: /^IT\d{8}$/i, message: 'Must start with IT followed by 8 digits' }
                                        })} 
                                        className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium uppercase ${errors.indexNumber ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                        placeholder="IT21000000" 
                                    />
                                    {errors.indexNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.indexNumber.message as string}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Academic Year</label>
                                        <select 
                                            {...register('yearId', { required: 'Year is required' })} 
                                            className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium ${errors.yearId ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                        >
                                            <option value="">Select Year...</option>
                                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Semester</label>
                                        <select 
                                            {...register('semesterId', { required: 'Semester is required' })} 
                                            disabled={!selectedYearId} 
                                            className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium disabled:opacity-50 ${errors.semesterId ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                        >
                                            <option value="">Select Semester...</option>
                                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Assigned Modules</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border border-slate-200 rounded-xl p-3 bg-white/80">
                                    {modules.map(mod => (
                                        <label key={mod.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 font-medium"
                                                checked={selectedModuleIds.includes(mod.id)}
                                                onChange={() => toggleModuleSelection(mod.id)}
                                            />
                                            <span className="text-sm font-medium text-slate-700">{mod.code} - {mod.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                            <input 
                                type="password" 
                                {...register('password', { 
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'At least 8 characters' }
                                })} 
                                className={`w-full px-4 py-3 bg-white/80 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 font-medium transition-all ${errors.password ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'}`}
                                placeholder="••••••••" 
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-bold">{errors.password.message as string}</p>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md mt-4"
                        >
                            {loading ? <span>Creating account...</span> : <span className="flex items-center space-x-2"><span>Complete Registration</span><ArrowRight className="w-4 h-4" /></span>}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        Already have an account? <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">Sign in</Link>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
