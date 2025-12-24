import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32">
        <Outlet />
      </main>
    </div>
  );
}
