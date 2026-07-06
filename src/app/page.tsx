'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Header } from '@/components/directory/Header';
import { Footer } from '@/components/directory/Footer';
import { HomePage } from '@/components/directory/HomePage';
import { BrowsePage } from '@/components/directory/BrowsePage';
import { BusinessDetailPage } from '@/components/directory/BusinessDetailPage';
import { LoginPage, RegisterPage } from '@/components/directory/AuthPages';
import { AdminDashboard } from '@/components/directory/AdminDashboard';
import { OwnerDashboard } from '@/components/directory/OwnerDashboard';
import { VisitorDashboard } from '@/components/directory/VisitorDashboard';
import { Toaster } from 'sonner';

function AppContent() {
  const { currentView, user, initializeAuth, loadSharedData } = useAppStore();

  useEffect(() => {
    initializeAuth();
    loadSharedData();
    api.get('/api/seed').catch(() => {});
  }, []);

  useEffect(() => {
    const s = useAppStore.getState();
    if (!user && ['admin-dashboard', 'owner-dashboard', 'visitor-dashboard'].includes(currentView)) {
      s.setView('login');
    } else if (user && currentView === 'admin-dashboard' && user.role !== 'ADMIN') {
      s.setView('home');
    } else if (user && currentView === 'owner-dashboard' && user.role !== 'BUSINESS_OWNER') {
      s.setView('home');
    } else if (user && currentView === 'visitor-dashboard' && user.role !== 'VISITOR') {
      s.setView('home');
    }
  }, [currentView, user]);

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomePage />;
      case 'browse': return <BrowsePage />;
      case 'business-detail': return <BusinessDetailPage />;
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'owner-dashboard': return <OwnerDashboard />;
      case 'visitor-dashboard': return <VisitorDashboard />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{renderView()}</main>
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <>
      <AppContent />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}