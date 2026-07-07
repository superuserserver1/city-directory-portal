'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search, SlidersHorizontal, X, MapPin, Building2, LayoutGrid, List,
  ArrowLeft, ChevronRight, CheckCircle2, SearchX, RotateCcw, Home, Sparkles,
} from 'lucide-react';
import type { Category, Locality, BusinessWithRelations } from '@/types';
import { BusinessCard } from './BusinessCard';

type SortOption = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc' | 'name-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
  { value: 'rating-asc', label: 'Rating: Low to High' },
  { value: 'name-asc', label: 'Name: A-Z' },
];

export function BrowsePage() {
  const { selectedCategoryId, selectedLocalityId, searchQuery, setView, setView: nav, cacheBusinessSlugs } = useAppStore();
  const [businesses, setBusinesses] = useState<BusinessWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sheetOpen, setSheetOpen] = useState(false);
  const lastSyncedQuery = useRef('');
  const limit = 12;

  // Sync from global searchQuery when user searches from header
  useEffect(() => {
    if (searchQuery && searchQuery !== lastSyncedQuery.current) {
      lastSyncedQuery.current = searchQuery;
      setLocalSearch(searchQuery);
      setPage(1);
    }
  }, [searchQuery]);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (localSearch) params.set('search', localSearch);
      if (selectedCategoryId && selectedCategoryId !== 'all') params.set('categoryId', selectedCategoryId);
      if (selectedLocalityId && selectedLocalityId !== 'all') params.set('localityId', selectedLocalityId);
      if (typeFilter) params.set('type', typeFilter);
      if (sortBy === 'rating-desc') params.set('sortBy', 'rating');
      if (sortBy === 'rating-asc') params.set('sortBy', 'rating_asc');
      if (sortBy === 'name-asc') params.set('sortBy', 'name');
      if (sortBy === 'newest') params.set('sortBy', 'newest');
      if (sortBy === 'oldest') params.set('sortBy', 'oldest');
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await api.get<{ businesses: BusinessWithRelations[]; pagination: { total: number } }>(
        `/api/businesses?${params.toString()}`
      );
      setBusinesses(data.businesses || []);
      // Cache slugs for URL navigation
      if (data.businesses?.length) {
        cacheBusinessSlugs(data.businesses.map(b => ({ id: b.id, slug: b.slug })));
      }
      setTotal(data.pagination?.total || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [localSearch, selectedCategoryId, selectedLocalityId, typeFilter, page, sortBy]);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/api/categories').then((r) => setCategories(r.categories || [])).catch(() => {});
    api.get<{ localities: Locality[] }>('/api/localities').then((r) => setLocalities(r.localities || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const activeCat = categories.find((c) => c.id === selectedCategoryId);
  const activeLoc = localities.find((l) => l.id === selectedLocalityId);
  const totalPages = Math.ceil(total / limit);

  const activeFilterCount = [
    selectedCategoryId && selectedCategoryId !== 'all' ? 1 : 0,
    selectedLocalityId && selectedLocalityId !== 'all' ? 1 : 0,
    typeFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasFilters = selectedCategoryId || selectedLocalityId || typeFilter || localSearch;

  const clearFilters = () => {
    setView('browse', undefined, null, null);
    setTypeFilter('');
    setLocalSearch('');
    setPage(1);
    setSortBy('newest');
  };

  const handleSetTypeFilter = (t: string) => {
    setTypeFilter(t);
    setPage(1);
  };

  const handleSetCategory = (id: string | null) => {
    nav('browse', undefined, id);
    setPage(1);
  };

  const handleSetLocality = (id: string | null) => {
    nav('browse', undefined, undefined, id);
    setPage(1);
  };

  const resultStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const resultEnd = Math.min(page * limit, total);

  const FiltersPanelContent = () => (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Type</h4>
        <div className="space-y-2">
          {['', 'BUSINESS', 'AMENITY'].map((t) => (
            <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                typeFilter === t ? 'border-primary bg-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'
              }`}>
                {typeFilter === t && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
              </div>
              <span className="text-sm group-hover:text-foreground transition-colors">{t === '' ? 'All Types' : t === 'BUSINESS' ? 'Businesses' : 'Amenities'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Categories</h4>
        <div className="space-y-1">
          <button
            onClick={() => handleSetCategory(null)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
              !selectedCategoryId ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5' : 'hover:bg-muted'
            }`}
          >
            All Categories
          </button>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSetCategory(cat.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  selectedCategoryId === cat.id ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5' : 'hover:bg-muted'
                }`}
              >
                {cat.name}
                <span className="text-xs text-muted-foreground tabular-nums">{cat._count?.businesses || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Localities */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Localities</h4>
        <div className="space-y-1">
          <button
            onClick={() => handleSetLocality(null)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
              !selectedLocalityId ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5' : 'hover:bg-muted'
            }`}
          >
            All Areas
          </button>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {localities.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSetLocality(loc.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  selectedLocalityId === loc.id ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5' : 'hover:bg-muted'
                }`}
              >
                {loc.name}
                <span className="text-xs text-muted-foreground tabular-nums">{loc._count?.businesses || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Top Bar */}
      <div className="bg-muted/50 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setView('home')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to Home</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
                placeholder="Search businesses, amenities..."
                className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
            </div>
            {/* Mobile: Sheet trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6">
                  <FiltersPanelContent />
                </div>
              </SheetContent>
            </Sheet>
            {/* Desktop: Hidden here, shown in sidebar */}
            {/* View Toggle */}
            <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {localSearch && (
                <Badge variant="secondary" className="gap-1">
                  Search: &quot;{localSearch}&quot;
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setLocalSearch(''); setPage(1); }} />
                </Badge>
              )}
              {activeCat && (
                <Badge variant="secondary" className="gap-1">
                  {activeCat.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleSetCategory(null)} />
                </Badge>
              )}
              {activeLoc && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" /> {activeLoc.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleSetLocality(null)} />
                </Badge>
              )}
              {typeFilter && (
                <Badge variant="secondary" className="gap-1">
                  {typeFilter === 'BUSINESS' ? 'Businesses' : 'Amenities'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setTypeFilter(''); setPage(1); }} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Sidebar + Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-24">
              <Card className="border-border/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
                    </CardTitle>
                    {activeFilterCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                        {activeFilterCount} active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <FiltersPanelContent />
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {/* Result count + Sort */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : total > 0 ? (
                  <>Showing <span className="font-medium text-foreground">{resultStart}&ndash;{resultEnd}</span> of <span className="font-medium text-foreground">{total}</span> businesses</>
                ) : (
                  'No results found'
                )}
              </p>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={viewMode === 'grid' ? 'h-72 rounded-xl' : 'h-28 rounded-xl'} />
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <SearchX className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
                  We couldn&apos;t find any businesses matching your current filters.
                </p>
                {hasFilters && (
                  <p className="text-sm text-muted-foreground/70 mb-6">
                    Try adjusting your search terms or clearing some filters.
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  {hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Clear Filters
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setView('home')}>
                    <Home className="h-4 w-4 mr-1.5" /> Go Home
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
                {businesses.map((biz) => (
                  <BusinessCard key={biz.id} business={biz} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {businesses.map((biz) => (
                  <Card
                    key={biz.id}
                    className="cursor-pointer hover:shadow-md transition-all group shimmer-effect"
                    onClick={() => setView('business-detail', biz.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl shrink-0 flex items-center justify-center ${getGradient(biz.id)}`}>
                        <span className="text-white/40 text-2xl font-bold">{biz.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{biz.name}</h3>
                          {biz.isVerified && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{biz.category?.name}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" /> {biz.locality?.name}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {biz.type === 'AMENITY' ? 'Amenity' : 'Business'}
                          </Badge>
                        </div>
                        {biz.address && <p className="text-sm text-muted-foreground mt-1 truncate">{biz.address}</p>}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="text-muted-foreground text-sm">...</span>}
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGradient(id: string) {
  const gradients = [
    'gradient-card-1', 'gradient-card-2', 'gradient-card-3', 'gradient-card-4',
    'gradient-card-5', 'gradient-card-6', 'gradient-card-7', 'gradient-card-8',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}