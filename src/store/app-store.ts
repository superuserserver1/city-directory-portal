import { create } from 'zustand';
import type { User, Category, Locality, SiteSettings } from '@/types';
import { api } from '@/lib/api';

export type ViewType =
  | 'home'
  | 'browse'
  | 'business-detail'
  | 'search-results'
  | 'login'
  | 'register'
  | 'admin-dashboard'
  | 'owner-dashboard'
  | 'visitor-dashboard'
  | 'add-business'
  | 'edit-business'
  | 'profile'
  | 'favorites';

interface SlugCacheEntry {
  slug: string;
  categorySlug: string;
}

interface AppState {
  // Navigation
  currentView: ViewType;
  selectedBusinessId: string | null;
  selectedCategoryId: string | null;
  selectedLocalityId: string | null;
  searchQuery: string;
  searchType: string;

  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // UI
  isMobileMenuOpen: boolean;
  isTransitioning: boolean;
  initialAppReady: boolean;

  // Shared Data
  categories: Category[];
  localities: Locality[];
  siteSettings: SiteSettings | null;
  sharedDataLoaded: boolean;

  // URL Navigation — maps businessId → { slug, categorySlug }
  businessSlugCache: Record<string, SlugCacheEntry>;

  // Actions
  setView: (view: ViewType, businessId?: string | null, categoryId?: string | null, localityId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  initializeAuth: () => Promise<void>;
  loadSharedData: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setSiteSettings: (settings: SiteSettings) => void;
  cacheBusinessSlug: (id: string, slug: string, categorySlug: string) => void;
  cacheBusinessSlugs: (entries: Array<{ id: string; slug: string; categorySlug: string }>) => void;
  setTransitioning: (v: boolean) => void;
  setInitialAppReady: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'home',
  selectedBusinessId: null,
  selectedCategoryId: null,
  selectedLocalityId: null,
  searchQuery: '',
  searchType: '',

  // Auth
  user: null,
  token: null,
  isAuthenticated: false,

  // UI
  isMobileMenuOpen: false,
  isTransitioning: false,
  initialAppReady: false,

  // Shared Data
  categories: [],
  localities: [],
  siteSettings: null,
  sharedDataLoaded: false,

  // URL Navigation
  businessSlugCache: {},

  // Actions
  setView: (view, businessId, categoryId, localityId) => {
    const clearCat = categoryId === null;
    const clearLoc = localityId === null;
    const newCategoryId = clearCat ? null : (categoryId || (view === 'browse' ? get().selectedCategoryId : null));
    const newLocalityId = clearLoc ? null : (localityId || (view === 'browse' ? get().selectedLocalityId : null));

    set({
      currentView: view,
      selectedBusinessId: businessId || null,
      selectedCategoryId: newCategoryId,
      selectedLocalityId: newLocalityId,
      isMobileMenuOpen: false,
    });

    // URL management via History API
    try {
      if (view === 'business-detail' && businessId) {
        const cached = get().businessSlugCache[businessId];
        if (cached) {
          const state = {
            v: view,
            b: businessId,
            c: newCategoryId,
            l: newLocalityId,
            q: get().searchQuery,
            t: get().searchType,
          };
          window.history.pushState(state, '', `/${cached.categorySlug}/${cached.slug}`);
        }
        // If slug not cached, BusinessDetailPage will push the URL after fetching
      } else if (view !== 'business-detail') {
        // Non-business views go to root URL — reset document title
        if (typeof document !== 'undefined') {
          document.title = 'CityDir - Your Complete City Business Directory | Find Businesses, Amenities & Services';
        }
        if (window.location.pathname !== '/') {
          const state = {
            v: view,
            b: null,
            c: newCategoryId,
            l: newLocalityId,
            q: get().searchQuery,
            t: get().searchType,
          };
          window.history.pushState(state, '', '/');
        } else {
          // Same URL but update state for back/forward navigation
          const state = {
            v: view,
            b: null,
            c: newCategoryId,
            l: newLocalityId,
            q: get().searchQuery,
            t: get().searchType,
          };
          window.history.replaceState(state, '');
        }
      }
    } catch {
      // History API not available (SSR), silently ignore
    }

    window.scrollTo(0, 0);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchType: (type) => set({ searchType: type }),

  login: (user, token) => {
    localStorage.setItem('citydir_user', JSON.stringify(user));
    localStorage.setItem('citydir_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('citydir_user');
    localStorage.removeItem('citydir_token');
    set({ user: null, token: null, isAuthenticated: false, currentView: 'home' });
    try {
      window.history.pushState({ v: 'home' }, '', '/');
    } catch { /* ignore */ }
  },

  setUser: (user) => set({ user }),

  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  loadSharedData: async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        api.get<{ categories: Category[] }>('/api/categories'),
        api.get<{ localities: Locality[] }>('/api/localities'),
      ]);
      set({ categories: catRes.categories || [], localities: locRes.localities || [], sharedDataLoaded: true });
    } catch {
      set({ sharedDataLoaded: true });
    }
  },

  loadSettings: async () => {
    try {
      const res = await api.get<{ settings: SiteSettings }>('/api/settings');
      set({ siteSettings: res.settings });
    } catch {
      // Use defaults
    }
  },

  setSiteSettings: (settings) => set({ siteSettings: settings }),

  cacheBusinessSlug: (id, slug, categorySlug) => {
    const cache = get().businessSlugCache;
    const existing = cache[id];
    if (!existing || existing.slug !== slug || existing.categorySlug !== categorySlug) {
      set({ businessSlugCache: { ...cache, [id]: { slug, categorySlug } } });
    }
  },

  cacheBusinessSlugs: (entries) => {
    const cache = { ...get().businessSlugCache };
    let changed = false;
    for (const { id, slug, categorySlug } of entries) {
      const existing = cache[id];
      if (!existing || existing.slug !== slug || existing.categorySlug !== categorySlug) {
        cache[id] = { slug, categorySlug };
        changed = true;
      }
    }
    if (changed) set({ businessSlugCache: cache });
  },

  setTransitioning: (v) => set({ isTransitioning: v }),

  setInitialAppReady: (v) => set({ initialAppReady: v }),

  initializeAuth: async () => {
    const token = localStorage.getItem('citydir_token');
    const userStr = localStorage.getItem('citydir_user');
    if (token && userStr) {
      try {
        const res = await api.get<{ user: User }>('/api/auth/me');
        set({ user: res.user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('citydir_token');
        localStorage.removeItem('citydir_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));