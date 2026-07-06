'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Search, SlidersHorizontal, X, MapPin, Building2, LayoutGrid, List,
  ArrowLeft, ChevronRight, CheckCircle2,
} from 'lucide-react';
import type { Category, Locality, BusinessWithRelations } from '@/types';
import { BusinessCard } from './BusinessCard';

export function BrowsePage() {
  const { selectedCategoryId, selectedLocalityId, searchQuery, setView, setView: nav } = useAppStore();
  const [businesses, setBusinesses] = useState<BusinessWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const limit = 12;

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (localSearch) params.set('search', localSearch);
      if (selectedCategoryId && selectedCategoryId !== 'all') params.set('categoryId', selectedCategoryId);
      if (selectedLocalityId && selectedLocalityId !== 'all') params.set('localityId', selectedLocalityId);
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await api.get<{ businesses: BusinessWithRelations[]; pagination: { total: number } }>(
        `/api/businesses?${params.toString()}`
      );
      setBusinesses(data.businesses || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [localSearch, selectedCategoryId, selectedLocalityId, typeFilter, page]);

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
  const hasFilters = selectedCategoryId || selectedLocalityId || typeFilter || localSearch;

  const clearFilters = () => {
    setView('browse', undefined, null, null);
    setTypeFilter('');
    setLocalSearch('');
    setPage(1);
  };

  const FiltersPanel = () => (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Type</h4>
        <div className="space-y-2">
          {['', 'BUSINESS', 'AMENITY'].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={typeFilter === t}
                onChange={() => { setTypeFilter(t); setPage(1); }}
                className="accent-primary"
              />
              <span className="text-sm">{t === '' ? 'All Types' : t === 'BUSINESS' ? 'Businesses' : 'Amenities'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Categories</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => { nav('browse', undefined, null); setPage(1); }}
            className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
              !selectedCategoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { nav('browse', undefined, cat.id); setPage(1); }}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors ${
                selectedCategoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
              }`}
            >
              {cat.name}
              <span className="text-xs text-muted-foreground">{cat._count?.businesses || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Localities */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Localities</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => { nav('browse', undefined, undefined, null); setPage(1); }}
            className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
              !selectedLocalityId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
            }`}
          >
            All Areas
          </button>
          {localities.map((loc) => (
            <button
              key={loc.id}
              onClick={() => { nav('browse', undefined, undefined, loc.id); setPage(1); }}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors ${
                selectedLocalityId === loc.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
              }`}
            >
              {loc.name}
              <span className="text-xs text-muted-foreground">{loc._count?.businesses || 0}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Top Bar */}
      <div className="bg-muted/50 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setView('home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
                <FiltersPanel />
              </DialogContent>
            </Dialog>
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
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { nav('browse', undefined, null); setPage(1); }} />
                </Badge>
              )}
              {activeLoc && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" /> {activeLoc.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { nav('browse', undefined, undefined, null); setPage(1); }} />
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

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
            : 'space-y-4'
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={viewMode === 'grid' ? 'h-72 rounded-xl' : 'h-28 rounded-xl'} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
            {businesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {businesses.map((biz) => (
              <Card
                key={biz.id}
                className="cursor-pointer hover:shadow-md transition-all group"
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