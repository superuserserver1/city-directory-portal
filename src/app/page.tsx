'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/directory/Header';
import { Footer } from '@/components/directory/Footer';
import { HomePage } from '@/components/directory/HomePage';
import { BrowsePage } from '@/components/directory/BrowsePage';
import { BusinessDetailPage } from '@/components/directory/BusinessDetailPage';
import { LoginPage, RegisterPage } from '@/components/directory/AuthPages';
import { AdminDashboard } from '@/components/directory/AdminDashboard';
import { OwnerDashboard } from '@/components/directory/OwnerDashboard';
import { VisitorDashboard } from '@/components/directory/VisitorDashboard';
import { BusinessForm } from '@/components/directory/BusinessForm';
import { ProfilePage } from '@/components/directory/ProfilePage';
import { FavoritesPage } from '@/components/directory/FavoritesPage';
import { SearchResultsPage } from '@/components/directory/SearchResultsPage';
import { Toaster } from 'sonner';

function BusinessFormWrapper() {
  const { user, setView } = useAppStore();
  const isAdmin = user?.role === 'ADMIN';

  const handleSuccess = () => {
    if (isAdmin) setView('admin-dashboard');
    else setView('owner-dashboard');
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isAdmin ? setView('admin-dashboard') : setView('owner-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Button>
      </div>
      <BusinessForm isAdmin={isAdmin} onSuccess={handleSuccess} />
    </div>
  );
}

function EditBusinessWrapper() {
  const { selectedBusinessId, user, setView } = useAppStore();
  const isAdmin = user?.role === 'ADMIN';

  const handleSuccess = () => {
    if (isAdmin) setView('admin-dashboard');
    else setView('owner-dashboard');
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isAdmin ? setView('admin-dashboard') : setView('owner-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Button>
      </div>
      <BusinessForm businessId={selectedBusinessId || undefined} isAdmin={isAdmin} onSuccess={handleSuccess} />
    </div>
  );
}

function AppContent() {
  const { currentView, user, initializeAuth, loadSharedData, loadSettings } = useAppStore();

  useEffect(() => {
    initializeAuth();
    loadSharedData();
    loadSettings();
    api.get('/api/seed').catch(() => {});
  }, []);

  useEffect(() => {
    const s = useAppStore.getState();
    if (!user && ['admin-dashboard', 'owner-dashboard', 'visitor-dashboard', 'favorites'].includes(currentView)) {
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
      case 'add-business': return <BusinessFormWrapper />;
      case 'edit-business': return <EditBusinessWrapper />;
      case 'profile': return <ProfilePage />;
      case 'favorites': return <FavoritesPage />;
      case 'search-results': return <SearchResultsPage />;
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
      <AppContent />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}