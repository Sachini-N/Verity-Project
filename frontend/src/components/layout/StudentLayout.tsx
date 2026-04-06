import { Outlet } from 'react-router-dom';
import StudentNav from './StudentNav';
import Footer from '../Footer';

export default function StudentLayout() {
  return (
    <div className="theme-student min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans text-slate-800 selection:bg-indigo-100">
      
      {/* Soft Dot-Grid Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Subtle Indigo/Teal Ambient Blur in Corners */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-teal-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <StudentNav />
        {/* Global default page spacing so all portal pages align consistently */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-14">
          <Outlet />
        </main>
        <Footer theme="student" />
      </div>
    </div>
  );
}
