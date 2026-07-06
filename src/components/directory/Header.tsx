'use client';

import { useState, useEffect } from 'react';
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
import {
  Menu, Search, MapPin, LogIn, UserPlus, LayoutDashboard, LogOut, ChevronDown,
  Home, Compass, FolderOpen, Map, X,
} from 'lucide-react';
import type { Category, Locality } from '@/types';

export function Header() {
  const {
    currentView, user, isAuthenticated, searchQuery,
    setView, setSearchQuery, logout, toggleMobileMenu,
  } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/api/categories').then((r) => setCategories(r.categories || [])).catch(() => {});
    api.get<{ localities: Locality[] }>('/api/localities').then((r) => setLocalities(r.localities || [])).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setView('browse');
  };

  const isHome = currentView === 'home';
  const isTransparent = isHome && !scrolled && !searchFocused && !mobileSearchOpen;

  const handleNavClick = (view: string, sub?: string) => {
    if (sub === 'categories') setView('browse', undefined, 'all');
    else if (sub === 'localities') setView('browse', undefined, undefined, 'all');
    else setView(view as 'home' | 'browse');
  };

  const isMobileMenuOpen = useAppStore((s) => s.isMobileMenuOpen);

  return (
    <>
      <header
        className={`sticky top-0 z-50 relative transition-all duration-300 ${
          isTransparent
            ? 'bg-transparent pointer-events-auto'
            : 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 shrink-0 pointer-events-auto relative z-10"
            >
              <div className={`p-1.5 rounded-lg ${isTransparent ? 'bg-white/20' : 'bg-primary'}`}>
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isTransparent ? 'text-white' : 'text-foreground'}`}>
                City<span className="text-primary">Dir</span>
              </span>
            </button>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 relative z-10">
              <div className="relative w-full pointer-events-auto">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isTransparent ? 'text-white/70' : 'text-muted-foreground'}`} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search businesses, amenities..."
                  className={`pl-10 pr-4 h-10 pointer-events-auto ${
                    isTransparent && !searchFocused
                      ? 'bg-white/15 border-white/25 text-white placeholder:text-white/60'
                      : 'bg-muted'
                  }`}
                />
              </div>
            </form>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 relative z-10">
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
                  className={`pointer-events-auto relative ${
                    isTransparent
                      ? 'text-white/90 hover:text-white hover:bg-white/15 focus-visible:text-white focus-visible:bg-white/20'
                      : ''
                  }`}
                >
                  {link.label}
                </Button>
              ))}

              {!isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant={isTransparent ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setView('login')}
                    className={`pointer-events-auto relative ${
                      isTransparent ? 'border-white/30 text-white hover:bg-white/15 hover:text-white' : ''
                    }`}
                  >
                    <LogIn className="h-4 w-4 mr-1.5" /> Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setView('register')}
                    className="pointer-events-auto relative"
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" /> Register
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`gap-2 pointer-events-auto relative ${isTransparent ? 'text-white' : ''}`}
                    >
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Mobile: Hamburger + Search */}
            <div className="flex items-center gap-2 lg:hidden relative z-10">
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
                    className={isTransparent ? 'text-white' : ''}
                    onClick={() => setMobileSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isTransparent ? 'text-white' : ''}
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
              { label: 'Browse All', icon: Compass, action: () => setView('browse') },
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