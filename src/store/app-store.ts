import { create } from 'zustand';
import type { User, Category, Locality } from '@/types';
import { api } from '@/lib/api';

export type ViewType =
  | 'home'
  | 'browse'
  | 'business-detail'
  | 'login'
  | 'register'
  | 'admin-dashboard'
  | 'owner-dashboard'
  | 'visitor-dashboard'
  | 'add-business'
  | 'edit-business'
  | 'profile';

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

  // Shared Data
  categories: Category[];
  localities: Locality[];
  sharedDataLoaded: boolean;

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

  // Shared Data
  categories: [],
  localities: [],
  sharedDataLoaded: false,

  // Actions
  setView: (view, businessId, categoryId, localityId) => {
    const clearCat = categoryId === null;
    const clearLoc = localityId === null;
    set({
      currentView: view,
      selectedBusinessId: businessId || null,
      selectedCategoryId: clearCat ? null : (categoryId || (view === 'browse' ? get().selectedCategoryId : null)),
      selectedLocalityId: clearLoc ? null : (localityId || (view === 'browse' ? get().selectedLocalityId : null)),
      isMobileMenuOpen: false,
    });
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