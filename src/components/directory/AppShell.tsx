'use client';

import { useEffect } from 'react';
import { useAppStore, type ViewType } from '@/store/app-store';
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
import { Skeleton } from '@/components/ui/skeleton';

interface AppShellProps {
  initialBusinessId?: string;
  initialSlug?: string;
  initialCategorySlug?: string;
}

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

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 border-b bg-background flex items-center px-4">
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function AppShell({ initialBusinessId, initialSlug, initialCategorySlug }: AppShellProps) {
  // Derive loading state from the store's currentView instead of using useState
  // When initialBusinessId is provided, we show skeleton until the effect sets the store
  const currentView = useAppStore((s) => s.currentView);

  // Initialize store from URL params (for direct business page access)
  useEffect(() => {
    if (initialBusinessId) {
      const store = useAppStore.getState();
      useAppStore.setState({
        currentView: 'business-detail',
        selectedBusinessId: initialBusinessId,
      });
      // Replace history state with our custom state (no new entry)
      const urlPath = (initialCategorySlug && initialSlug) ? `/${initialCategorySlug}/${initialSlug}` : window.location.pathname;
      window.history.replaceState(
        { v: 'business-detail' as ViewType, b: initialBusinessId },
        '',
        urlPath
      );
      // Cache the slug
      if (initialSlug && initialCategorySlug) {
        store.cacheBusinessSlug(initialBusinessId, initialSlug, initialCategorySlug);
      }
    }
  }, [initialBusinessId, initialSlug, initialCategorySlug]);

  // Popstate listener for browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && typeof state === 'object' && 'v' in state) {
        const { v, b, c, l, q, t } = state;
        useAppStore.setState({
          currentView: (v as ViewType) || 'home',
          selectedBusinessId: b || null,
          selectedCategoryId: c || null,
          selectedLocalityId: l || null,
          searchQuery: q || '',
          searchType: t || '',
          isMobileMenuOpen: false,
        });
        // Reset title when navigating away from business detail
        if (v !== 'business-detail') {
          document.title = 'CityDir - Your Complete City Business Directory | Find Businesses, Amenities & Services';
        }
        window.scrollTo(0, 0);
      } else {
        // No custom state — go to home
        useAppStore.setState({
          currentView: 'home',
          selectedBusinessId: null,
          isMobileMenuOpen: false,
        });
        document.title = 'CityDir - Your Complete City Business Directory | Find Businesses, Amenities & Services';
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Show loading skeleton until store is initialized for business page direct access
  if (initialBusinessId && currentView !== 'business-detail') {
    return <LoadingSkeleton />;
  }

  return <AppContent />;
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