'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import {
  Menu, Search, MapPin, LogIn, UserPlus, LayoutDashboard, LogOut, ChevronDown,
  Home, Compass, FolderOpen, Map, X, Sun, Moon, Bell, User, Star, Loader2, Heart,
  Package, Building2, TreePine,
} from 'lucide-react';
import type { Category, Locality } from '@/types';

export function Header() {
  const {
    currentView, user, isAuthenticated, searchQuery,
    setView, setSearchQuery, logout, toggleMobileMenu,
  } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; type: string; rating: number; category: string; locality: string; price?: string; productType?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const doSearch = useCallback((q: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      api.get<{ products: { id: string; name: string; type: string; price: string; business: { id: string; name: string; locality: { name: string }; category: { name: string } } }[]; businesses: { id: string; name: string; type: string; rating: number; locality: { name: string }; category: { name: string } }[]; amenities: { id: string; name: string; type: string; locality: { name: string }; category: { name: string } }[]; localities: { id: string; name: string; _count: { businesses: number } }[] }>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => {
          const mapped: typeof suggestions = [];
          r.products?.slice(0, 3).forEach(p => mapped.push({ id: p.business.id, name: p.name, type: 'product', rating: 0, category: p.business.category.name, locality: p.business.locality.name, price: p.price, productType: p.type }));
          r.businesses?.slice(0, 2).forEach(b => mapped.push({ id: b.id, name: b.name, type: 'business', rating: b.rating, category: b.category.name, locality: b.locality.name }));
          r.amenities?.slice(0, 2).forEach(a => mapped.push({ id: a.id, name: a.name, type: 'amenity', rating: a.rating, category: a.category.name, locality: a.locality.name }));
          r.localities?.slice(0, 1).forEach(l => mapped.push({ id: l.id, name: l.name, type: 'locality', rating: 0, category: `${l._count.businesses} places`, locality: '' }));
          setSuggestions(mapped);
          setShowSuggestions(true);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
 if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/api/categories').then((r) => setCategories(r.categories || [])).catch(() => {});
    api.get<{ localities: Locality[] }>('/api/localities').then((r) => setLocalities(r.localities || [])).catch(() => {});
    if (isAuthenticated) {
      api.get<{ enquiries: { status: string }[] }>('/api/enquiries').then((r) => {
        const openCount = (r.enquiries || []).filter((e) => e.status === 'OPEN').length;
        setUnreadCount(openCount);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) setView('search-results');
  };

  const handleNavClick = (view: string, sub?: string) => {
    if (sub === 'categories') setView('browse', undefined, 'all');
    else if (sub === 'localities') setView('browse', undefined, undefined, 'all');
    else setView(view as 'home' | 'browse');
  };

  const isMobileMenuOpen = useAppStore((s) => s.isMobileMenuOpen);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="p-1.5 rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                City<span className="text-primary">Dir</span>
              </span>
            </button>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
                  onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
                  placeholder="Search products, services, places..."
                  className="pl-10 pr-10 h-10 bg-muted"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {searching && (
                  <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2">
                      {suggestions.map((s) => (
                        <button
                          key={`${s.type}-${s.id}`}
                          type="button"
                          onClick={() => { setShowSuggestions(false); if (s.type === 'locality') { setView('browse', undefined, undefined, s.id); } else if (s.type === 'product') { setSearchQuery(s.name); setView('search-results'); } else { setView('business-detail', s.id); } }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.type === 'product' ? (s.productType === 'SERVICE' ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-amber-100 dark:bg-amber-900/30') : s.type === 'amenity' ? 'bg-teal-100 dark:bg-teal-900/30' : s.type === 'locality' ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-primary/10'}`}>
                            {s.type === 'product' ? <Package className={`h-4 w-4 ${s.productType === 'SERVICE' ? 'text-violet-500' : 'text-amber-500'}`} /> :
                             s.type === 'amenity' ? <TreePine className="h-4 w-4 text-teal-600 dark:text-teal-400" /> :
                             s.type === 'locality' ? <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" /> :
                             <Building2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.type === 'locality' ? s.category : `${s.category} · ${s.locality}`}</p>
                          </div>
                          {s.price && <span className="text-xs font-semibold text-primary shrink-0">{s.price}</span>}
                          {s.rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{s.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowSuggestions(false); setView('search-results'); }}
                      className="w-full text-center p-2.5 text-sm text-primary hover:bg-primary/5 border-t transition-colors font-medium"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Home', view: 'home', icon: Home },
                { label: 'Categories', view: 'browse', sub: 'categories', icon: FolderOpen },
                { label: 'Localities', view: 'browse', sub: 'localities', icon: Map },
              ].map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(link.view, link.sub)}
                >
                  {link.label}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => {
                    if (user?.role === 'ADMIN') setView('admin-dashboard');
                    else if (user?.role === 'BUSINESS_OWNER') setView('owner-dashboard');
                    else setView('visitor-dashboard');
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {!isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('login')}
                  >
                    <LogIn className="h-4 w-4 mr-1.5" /> Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setView('register')}
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" /> Register
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline max-w-[100px] truncate text-sm">{user?.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'BUSINESS_OWNER' ? 'Owner' : 'Visitor'}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                    {user?.role === 'ADMIN' && (
                      <DropdownMenuItem onClick={() => setView('admin-dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    {user?.role === 'BUSINESS_OWNER' && (
                      <DropdownMenuItem onClick={() => setView('owner-dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                      </DropdownMenuItem>
                    )}
                    {user?.role === 'VISITOR' && (
                      <DropdownMenuItem onClick={() => setView('visitor-dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> My Enquiries
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setView('profile')}>
                      <User className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setView('favorites')}>
                      <Heart className="mr-2 h-4 w-4" /> My Favorites
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Mobile: Hamburger + Search */}
            <div className="flex items-center gap-2 lg:hidden">
              {mobileSearchOpen ? (
                <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-9 h-9 w-40 sm:w-56"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMobileMenu}
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={(open) => { if (!open) useAppStore.getState().closeMobileMenu(); }}>
        <SheetContent side="right" className="w-80 sm:max-w-sm p-0 overflow-y-auto">
          {isAuthenticated && user ? (
            <>
              {/* User Info */}
              <div className="gradient-hero p-6 pt-8">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{user.name}</p>
                    <p className="text-white/70 text-sm truncate">{user.email}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="mt-3 bg-white/15 text-white border-white/20 hover:bg-white/20"
                >
                  {user.role === 'ADMIN' ? '🛡️ Admin' : user.role === 'BUSINESS_OWNER' ? '💼 Business Owner' : '👤 Visitor'}
                </Badge>
              </div>

              {/* Dashboard Link */}
              <div className="px-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-primary/20 hover:bg-primary/5"
                  onClick={() => {
                    if (user.role === 'ADMIN') setView('admin-dashboard');
                    else if (user.role === 'BUSINESS_OWNER') setView('owner-dashboard');
                    else setView('visitor-dashboard');
                  }}
                >
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  {user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'BUSINESS_OWNER' ? 'My Dashboard' : 'My Enquiries'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-primary/20 hover:bg-primary/5 mt-2"
                  onClick={() => setView('favorites')}
                >
                  <Heart className="h-5 w-5 text-primary" />
                  My Favorites
                </Button>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="gradient-hero !p-6 !pb-5">
                <SheetTitle className="text-white text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> CityDir
                </SheetTitle>
                <SheetDescription className="text-white/70">Your complete city directory</SheetDescription>
              </SheetHeader>

              {/* Auth buttons */}
              <div className="px-4 pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView('login')}
                >
                  <LogIn className="h-4 w-4 mr-2" /> Login
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setView('register')}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Register
                </Button>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Navigation Links */}
          <nav className="px-2 space-y-1">
            {[
              { label: 'Home', icon: Home, action: () => handleNavClick('home') },
              { label: 'Browse All', icon: Compass, action: () => setView('browse', undefined, null, null) },
              { label: 'Categories', icon: FolderOpen, action: () => handleNavClick('browse', 'categories') },
              { label: 'Localities', icon: Map, action: () => handleNavClick('browse', 'localities') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </nav>

          <Separator className="my-4" />

          {/* Theme Toggle in Sheet */}
          <div className="px-2 mb-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
              {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <Separator className="my-4" />

          {/* Categories in Sheet */}
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setView('browse', undefined, cat.id)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Localities in Sheet */}
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Popular Areas</p>
            <div className="flex flex-wrap gap-2">
              {localities.slice(0, 4).map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setView('browse', undefined, undefined, loc.id)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer of Sheet */}
          <SheetFooter className="mt-auto border-t pt-4">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Sign in to save favorites & track enquiries
              </p>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}