import { Outlet } from 'react-router-dom';
import LecturerNav from './LecturerNav';
import { ModuleProvider } from '../../context/ModuleContext';
import Footer from '../Footer';

export default function LecturerLayout() {
  return (
    <ModuleProvider>
      <div className="theme-lecturer min-h-screen bg-gradient-to-b from-[#f6fbf8] via-[#f9fcfb] to-[#f2faf7] flex flex-col">
        <LecturerNav />
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-14">
          <Outlet />
        </main>
        <Footer theme="lecturer" />
      </div>
    </ModuleProvider>
  );
}

