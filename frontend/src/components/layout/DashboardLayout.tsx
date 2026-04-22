import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Shared Top Navigation (replaces old dark sidebar) */}
      <TopNav />

      {/* Main Scrollable Content Area */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
