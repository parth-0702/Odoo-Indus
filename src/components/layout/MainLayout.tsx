import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import OnboardingGate from '@/components/onboarding/OnboardingGate';

export default function MainLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4">
          <OnboardingGate />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
