import { Outlet } from 'react-router-dom';
import ManagerNav from './ManagerNav';
import Footer from '../Footer';

export default function ManagerLayout() {
  return (
    <div className="theme-manager min-h-screen flex flex-col bg-gradient-to-b from-[#f3f7ff] via-[#f7fbff] to-[#f2faf8] font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#bfdbfe 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="absolute top-[-12%] right-[-10%] w-[46vw] h-[46vw] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-8%] left-[-10%] w-[42vw] h-[42vw] bg-teal-200/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1">
      <ManagerNav />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-14 relative z-0">
        <Outlet />
      </main>
      <Footer theme="manager" />
      </div>
    </div>
  );
}
