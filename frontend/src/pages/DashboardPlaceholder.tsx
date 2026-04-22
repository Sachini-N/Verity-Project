import { Link } from 'react-router-dom';

const DashboardPlaceholder = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Dashboard</h1>
                <p className="text-slate-600 mb-8">This module will be built in Phase 3.</p>
                <Link to="/" className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors">
                    Return Home
                </Link>
            </div>
        </div>
    );
};

export default DashboardPlaceholder;
