'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, ArrowRight, Star, CheckCircle2, Building2, Train, Plane, Droplets,
  TreePine, Utensils, Hotel, Hospital, GraduationCap, ShoppingBag, Landmark, Car, Dumbbell, MapPin,
  TrendingUp, Users, FolderOpen, BarChart3, Flame,
} from 'lucide-react';
import type { Category, Locality, Business, BusinessWithRelations } from '@/types';
import { api } from '@/lib/api';
import { BusinessCard } from './BusinessCard';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Utensils, Hotel, Hospital, GraduationCap, ShoppingBag, Landmark, Train, Dumbbell,
  Building2, Plane, Droplets, TreePine, Car, MapPin, Star, CheckCircle2,
};

const GRADIENT_CLASSES = [
  'gradient-card-1', 'gradient-card-2', 'gradient-card-3', 'gradient-card-4',
  'gradient-card-5', 'gradient-card-6', 'gradient-card-7', 'gradient-card-8',
];

const TRENDING_SEARCHES = [
  { term: 'Best Restaurants', icon: Utensils, searches: '2.4K' },
  { term: 'Hotels Near Me', icon: Hotel, searches: '1.8K' },
  { term: 'Hospitals & Clinics', icon: Hospital, searches: '1.5K' },
  { term: 'Schools & Colleges', icon: GraduationCap, searches: '1.2K' },
  { term: 'Gyms & Fitness', icon: Dumbbell, searches: '980' },
  { term: 'Shopping Centers', icon: ShoppingBag, searches: '870' },
  { term: 'Real Estate', icon: Landmark, searches: '760' },
  { term: 'Car Services', icon: Car, searches: '650' },
];

export function HomePage() {
  const { setView, searchQuery, setSearchQuery, categories, localities } = useAppStore();
  const [featured, setFeatured] = useState<BusinessWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<{ businesses: BusinessWithRelations[] }>('/api/businesses?isFeatured=true&limit=8')
      .then((data) => { if (!cancelled) setFeatured(data.businesses || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setView('browse');
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/15 text-white border-white/20 backdrop-blur-sm hover:bg-white/20">
              <MapPin className="h-3.5 w-3.5 mr-1.5" /> Your Complete City Guide
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Discover Your City —{' '}
              <span className="bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Find the best businesses, amenities, restaurants, hospitals, schools, and services. Search by category, locality, or keyword.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 sm:mt-10 max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses, amenities, services..."
                  className="flex-1 h-14 pl-12 pr-4 text-foreground bg-transparent outline-none text-base placeholder:text-muted-foreground/70"
                />
                <Button
                  type="submit"
                  className="m-1.5 h-11 px-6 rounded-xl font-semibold"
                >
                  <Search className="h-4 w-4 mr-2 sm:mr-0 sm:hidden" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </form>

            {/* Popular searches */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Restaurants', 'Hotels', 'Hospitals', 'Schools'].map((term) => (
                <button
                  key={term}
                  onClick={() => { setSearchQuery(term); setView('browse'); }}
                  className="text-sm text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,60 C360,0 720,80 1440,20 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 sm:py-12 -mt-2">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: '500+', label: 'Businesses', icon: Building2 },
              { value: '50+', label: 'Categories', icon: FolderOpen },
              { value: '10K+', label: 'Users', icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform duration-200">
                  <stat.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Browse by Category</h2>
            <p className="mt-2 text-muted-foreground text-lg">Find exactly what you need</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {categories.map((cat, idx) => {
                const IconComp = CATEGORY_ICONS[cat.icon || 'Building2'] || Building2;
                return (
                  <Card
                    key={cat.id}
                    className="group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-border/50"
                    onClick={() => setView('browse', undefined, cat.id)}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className={`p-3 rounded-xl text-white ${GRADIENT_CLASSES[idx % GRADIENT_CLASSES.length]}`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat._count?.businesses || 0} listings
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setView('browse', undefined, 'all')}>
              View All Categories <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Featured Places</h2>
              <p className="mt-2 text-muted-foreground text-lg">Top rated & verified listings</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" onClick={() => setView('browse')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
              {featured.map((biz) => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline" onClick={() => setView('browse')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Searches */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trending Searches</h2>
              <p className="text-sm text-muted-foreground">What people are looking for right now</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
            {TRENDING_SEARCHES.map((item) => (
              <button
                key={item.term}
                onClick={() => { setSearchQuery(item.term); setView('browse'); }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left group"
              >
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.term}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {item.searches} searches
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Localities Section */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Explore by Area</h2>
            <p className="mt-2 text-muted-foreground text-lg">Discover what&apos;s near you</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-children">
              {localities.map((loc) => (
                <Card
                  key={loc.id}
                  className="group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-border/50"
                  onClick={() => setView('browse', undefined, undefined, loc.id)}
                >
                  <div className="gradient-hero p-5 h-full flex flex-col justify-end">
                    <MapPin className="h-5 w-5 text-white/60 mb-2" />
                    <p className="font-bold text-white text-lg">{loc.name}</p>
                    <p className="text-sm text-white/70">{loc._count?.businesses || 0} places</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.06),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                List Your Business on CityDir
              </h2>
              <p className="mt-3 text-lg text-white/70 max-w-xl mx-auto">
                Reach thousands of potential customers. Add your business, amenities, products, and services to our growing directory.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-8 rounded-xl"
                  onClick={() => setView('register')}
                >
                  Register as Business Owner
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 rounded-xl"
                  onClick={() => setView('browse')}
                >
                  Browse Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}