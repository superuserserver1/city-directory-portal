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
  TrendingUp, Users, FolderOpen, Flame, Search as SearchIcon, ClipboardList, Phone,
  LayoutGrid, Sparkles, MapPinIcon, MessageSquareQuote, Quote,
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

const HOW_IT_WORKS_STEPS = [
  {
    num: 1,
    title: 'Search',
    description: 'Find businesses by category, locality, or keyword',
    icon: SearchIcon,
  },
  {
    num: 2,
    title: 'Compare',
    description: 'View details, products, services, and reviews',
    icon: ClipboardList,
  },
  {
    num: 3,
    title: 'Connect',
    description: 'Send enquiries and chat directly with businesses',
    icon: Phone,
  },
];

const TESTIMONIALS = [
  {
    quote: 'CityDir helped me find the perfect venue for our corporate event. The enquiry system made it so easy!',
    name: 'Priya Sharma',
    role: 'Event Planner',
  },
  {
    quote: 'As a small business owner, listing on CityDir has brought us dozens of new customers every month.',
    name: 'Rajesh Kumar',
    role: 'Restaurant Owner',
  },
  {
    quote: 'I love how I can find everything from hospitals to swimming pools in one place. Super convenient!',
    name: 'Anita Desai',
    role: 'Homemaker',
  },
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

        {/* Floating shapes */}
        <div className="absolute top-16 left-[8%] w-16 h-16 rounded-full bg-white/5 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-32 right-[12%] w-24 h-24 rounded-2xl bg-white/[0.07] animate-[float-reverse_7s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-40 left-[18%] w-10 h-10 rounded-full bg-white/10 animate-[float_4.5s_ease-in-out_infinite_1s]" />
        <div className="absolute top-48 right-[30%] w-32 h-32 rounded-full bg-white/[0.04] animate-[float-reverse_8s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-24 right-[8%] w-20 h-20 rounded-xl bg-white/[0.06] animate-[float_5.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-20 left-[45%] w-12 h-12 rounded-full bg-white/[0.08] animate-[float-reverse_6.5s_ease-in-out_infinite_0.8s]" />

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

      {/* How It Works Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" /> How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Find What You Need in 3 Steps</h2>
            <p className="mt-2 text-muted-foreground text-lg">Simple, fast, and effective</p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 max-w-4xl mx-auto">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />

            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 mb-5">
                  {step.num}
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <LayoutGrid className="h-3.5 w-3.5" /> Browse by Category
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Find What You&apos;re Looking For</h2>
            <p className="mt-2 text-muted-foreground text-lg">Explore businesses across every category</p>
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
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Star className="h-3.5 w-3.5" /> Featured Places
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Top Rated & Verified Listings</h2>
            <p className="mt-2 text-muted-foreground text-lg">Handpicked businesses trusted by the community</p>
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
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setView('browse')}>
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Searches */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium mb-4">
              <Flame className="h-3.5 w-3.5" /> Trending Searches
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What People Are Looking For</h2>
            <p className="mt-2 text-muted-foreground text-lg">Popular searches right now</p>
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
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <MapPinIcon className="h-3.5 w-3.5" /> Explore by Area
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Discover What&apos;s Near You</h2>
            <p className="mt-2 text-muted-foreground text-lg">Browse businesses by locality</p>
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

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <MessageSquareQuote className="h-3.5 w-3.5" /> What People Say
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by Our Community</h2>
            <p className="mt-2 text-muted-foreground text-lg">Real stories from real users</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="relative border-border/50 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-3" />
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.06),transparent_60%)]" />
            {/* Floating shapes in CTA */}
            <div className="absolute top-8 left-[10%] w-16 h-16 rounded-full bg-white/5 animate-[float_5s_ease-in-out_infinite]" />
            <div className="absolute bottom-8 right-[15%] w-20 h-20 rounded-xl bg-white/[0.06] animate-[float-reverse_6s_ease-in-out_infinite_0.5s]" />
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