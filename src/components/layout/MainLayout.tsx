import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
