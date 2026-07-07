'use client';

import { useEffect, useRef, useCallback } from 'react';
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
import { InitialPageLoader, ViewTransitionLoader, BusinessDetailLoader } from '@/components/directory/PageLoader';

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

export function AppShell({ initialBusinessId, initialSlug, initialCategorySlug }: AppShellProps) {
  const currentView = useAppStore((s) => s.currentView);
  const initialAppReady = useAppStore((s) => s.initialAppReady);
  const initializeAuth = useAppStore((s) => s.initializeAuth);
  const loadSharedData = useAppStore((s) => s.loadSharedData);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const setInitialAppReady = useAppStore((s) => s.setInitialAppReady);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const prevViewRef = useRef<ViewType>(currentView);

  // Initialize app data on mount (in AppShell, not AppContent, to avoid deadlock)
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initializeAuth(),
        loadSharedData(),
        loadSettings(),
      ]);
      // Seed data silently
      api.get('/api/seed').catch(() => {});
      // Mark app as ready — this dismisses the initial page loader
      setInitialAppReady(true);
    };
    init();
  }, [initializeAuth, loadSharedData, loadSettings, setInitialAppReady]);

  // Initialize store from URL params (for direct business page access)
  useEffect(() => {
    if (initialBusinessId) {
      const store = useAppStore.getState();
      useAppStore.setState({
        currentView: 'business-detail',
        selectedBusinessId: initialBusinessId,
      });
      const urlPath = (initialCategorySlug && initialSlug) ? `/${initialCategorySlug}/${initialSlug}` : window.location.pathname;
      window.history.replaceState(
        { v: 'business-detail' as ViewType, b: initialBusinessId },
        '',
        urlPath
      );
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
        if (v !== 'business-detail') {
          document.title = 'CityDir - Your Complete City Business Directory | Find Businesses, Amenities & Services';
        }
        window.scrollTo(0, 0);
      } else {
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

  // Detect view transitions and show brief loader
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      const store = useAppStore.getState();
      store.setTransitioning(true);
      const timer = setTimeout(() => {
        store.setTransitioning(false);
      }, 350);
      prevViewRef.current = currentView;
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // Auth guard
  const user = useAppStore((s) => s.user);
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

  // Get a message for the transition loader
  const getTransitionMessage = useCallback((): string => {
    switch (currentView) {
      case 'business-detail': return 'Loading business details...';
      case 'browse': return 'Discovering businesses...';
      case 'search-results': return 'Searching...';
      case 'admin-dashboard': return 'Loading dashboard...';
      case 'owner-dashboard': return 'Loading dashboard...';
      case 'visitor-dashboard': return 'Loading dashboard...';
      case 'favorites': return 'Loading favorites...';
      case 'profile': return 'Loading profile...';
      case 'add-business': case 'edit-business': return 'Loading form...';
      default: return 'Loading...';
    }
  }, [currentView]);

  const renderView = useCallback(() => {
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
  }, [currentView]);

  // For direct business URL access before store initializes
  if (initialBusinessId && currentView !== 'business-detail') {
    return (
      <>
        <InitialPageLoader />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1"><BusinessDetailLoader /></main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Full-screen initial loader overlay — fades out when app is ready */}
      {!initialAppReady && <InitialPageLoader />}

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 relative">
          {/* View transition loader */}
          <ViewTransitionLoader
            isLoading={isTransitioning}
            message={getTransitionMessage()}
            size="lg"
          />
          {/* Actual view content — hidden behind initial loader until ready */}
          <div className={
            initialAppReady
              ? isTransitioning ? 'opacity-0 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'
              : 'opacity-0'
          }>
            {renderView()}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}