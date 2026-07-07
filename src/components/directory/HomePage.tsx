'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BusinessCard } from './BusinessCard';
import { api } from '@/lib/api';
import {
  Search,
  ArrowRight,
  Star,
  CheckCircle2,
  Building2,
  Utensils,
  Hotel,
  Hospital,
  GraduationCap,
  ShoppingBag,
  Landmark,
  Train,
  Dumbbell,
  Car,
  MapPin,
  Users,
  FolderOpen,
  Sparkles,
  ClipboardList,
  Phone,
  MessageSquareQuote,
  Quote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUp,
  TrendingUp,
  Layers,
} from 'lucide-react';
import type { BusinessWithRelations } from '@/types';

/* ───────────────────────────── Icon map ───────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Utensils,
  Hotel,
  Hospital,
  GraduationCap,
  ShoppingBag,
  Landmark,
  Train,
  Dumbbell,
  Building2,
  Car,
  MapPin,
  Star,
  CheckCircle2,
};

const CATEGORY_GRADIENTS = [
  { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-cyan-600 to-cyan-700', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-green-500 to-green-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-rose-500 to-rose-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-lime-600 to-lime-700', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-sky-500 to-sky-600', icon: 'text-white' },
  { bg: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600', icon: 'text-white' },
];

const LOCALITY_GRADIENTS = [
  'gradient-card-1',
  'gradient-card-2',
  'gradient-card-3',
  'gradient-card-4',
  'gradient-card-5',
  'gradient-card-6',
  'gradient-card-7',
  'gradient-card-8',
];

const PRODUCT_GRADIENTS = [
  'from-teal-500 to-emerald-600',
  'from-emerald-500 to-cyan-600',
  'from-cyan-600 to-teal-500',
  'from-green-500 to-teal-600',
  'from-teal-600 to-emerald-500',
  'from-emerald-600 to-green-500',
  'from-cyan-500 to-emerald-600',
  'from-teal-500 to-cyan-600',
];

/* ─────────────────────────── Static data ─────────────────────────── */
const HOW_IT_WORKS_STEPS = [
  {
    num: 1,
    title: 'Search',
    description: 'Find businesses by category, locality, or keyword across the city',
    icon: Search,
  },
  {
    num: 2,
    title: 'Compare',
    description: 'View details, products, services, ratings, and reviews side by side',
    icon: ClipboardList,
  },
  {
    num: 3,
    title: 'Connect',
    description: 'Send enquiries and chat directly with business owners instantly',
    icon: Phone,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'This directory helped me find the perfect venue for our corporate event. The enquiry system made it so easy to connect!',
    name: 'Priya Sharma',
    role: 'Event Planner',
    avatar: 'PS',
  },
  {
    quote:
      'As a small business owner, listing here has brought us dozens of new customers every month. Absolutely worth it!',
    name: 'Rajesh Kumar',
    role: 'Restaurant Owner',
    avatar: 'RK',
  },
  {
    quote:
      'I love how I can find everything from hospitals to swimming pools in one place. Super convenient for daily needs!',
    name: 'Anita Desai',
    role: 'Homemaker',
    avatar: 'AD',
  },
];

/* ─────────────────────────── Component ─────────────────────────── */
export function HomePage() {
  const { setView, searchQuery, setSearchQuery, categories, localities, siteSettings } =
    useAppStore();

  const city = siteSettings?.cityName || 'the City';

  // ── Data state ──
  const [featured, setFeatured] = useState<BusinessWithRelations[]>([]);
  const [stats, setStats] = useState<{
    totalBusinesses: number;
    totalLocalities: number;
    totalCategories: number;
    totalReviews: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ── Featured scroll ref ──
  const featuredRef = useRef<HTMLDivElement>(null);

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [featuredRes] = await Promise.all([
          api.get<{ businesses: BusinessWithRelations[] }>(
            '/api/businesses?isFeatured=true&limit=10',
          ),
          // Attempt to get stats — may fail for non-admin users
          api
            .get<{
              totalBusinesses: number;
              totalLocalities: number;
              totalCategories: number;
            }>('/api/stats')
            .then((data) => {
              if (!cancelled) {
                setStats({
                  totalBusinesses: data.totalBusinesses ?? 0,
                  totalLocalities: data.totalLocalities ?? 0,
                  totalCategories: data.totalCategories ?? 0,
                  totalReviews: 0,
                });
              }
            })
            .catch(() => {
              // Fall back to store counts
              if (!cancelled) {
                setStats({
                  totalBusinesses: categories.reduce(
                    (sum, c) => sum + (c._count?.businesses ?? 0),
                    0,
                  ),
                  totalLocalities: localities.length,
                  totalCategories: categories.length,
                  totalReviews: 0,
                });
              }
            }),
        ]);

        if (!cancelled) {
          setFeatured(featuredRes.businesses || []);
        }
      } catch {
        // Silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
    }, []);

  // ── Back-to-top ──
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Derived values ──
  const heroTitle = siteSettings?.heroTitle
    ? siteSettings.heroTitle.replace(/\{city\}/g, city)
    : `Discover ${city} — All in One Place`;

  const heroSubtitle = siteSettings?.heroSubtitle || siteSettings?.tagline
    ? (siteSettings.heroSubtitle || siteSettings.tagline).replace(/\{city\}/g, city)
    : `Find the best businesses, amenities, restaurants, hospitals, schools, and services in ${city}. Search by category, locality, or keyword.`;

  const heroCtaText = siteSettings?.heroCtaText
    ? siteSettings.heroCtaText.replace(/\{city\}/g, city)
    : 'Explore Now';

  const displayStats = stats ?? {
    totalBusinesses: categories.reduce((s, c) => s + (c._count?.businesses ?? 0), 0),
    totalLocalities: localities.length,
    totalCategories: categories.length,
    totalReviews: 0,
  };

  // Quick category pills (first 6 categories)
  const quickPills = categories.slice(0, 6);

  // ── Handlers ──
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setView('browse');
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (!featuredRef.current) return;
    const scrollAmount = 320;
    featuredRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="animate-fade-in">
      {/* ═══════════════════ 1. HERO SECTION ═══════════════════ */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Decorative radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

        {/* Floating shapes */}
        <div className="absolute top-16 left-[8%] w-16 h-16 rounded-full bg-white/5 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-32 right-[12%] w-24 h-24 rounded-2xl bg-white/[0.07] animate-[float-reverse_7s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-40 left-[18%] w-10 h-10 rounded-full bg-white/10 animate-[float_4.5s_ease-in-out_infinite_1s]" />
        <div className="absolute top-48 right-[30%] w-32 h-32 rounded-full bg-white/[0.04] animate-[float-reverse_8s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-24 right-[8%] w-20 h-20 rounded-xl bg-white/[0.06] animate-[float_5.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-20 left-[45%] w-12 h-12 rounded-full bg-white/[0.08] animate-[float-reverse_6.5s_ease-in-out_infinite_0.8s]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-24 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* City badge */}
            <Badge className="mb-5 bg-white/15 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 text-sm px-4 py-1.5">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Welcome to {city}
            </Badge>

            {/* Hero title with city gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight tracking-tight">
              {heroTitle.split(city).map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>
                    {part}
                    <span className="bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">
                      {city}
                    </span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-8 sm:mt-10 max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search businesses, services in ${city}...`}
                  className="flex-1 h-14 pl-12 pr-4 text-foreground bg-transparent outline-none text-base placeholder:text-muted-foreground/70"
                />
                <Button
                  type="submit"
                  className="m-1.5 h-11 px-6 rounded-xl font-semibold"
                >
                  <Search className="h-4 w-4 mr-2 sm:mr-0 sm:hidden" />
                  <span className="hidden sm:inline">{heroCtaText}</span>
                </Button>
              </div>
            </form>

            {/* Quick category pills */}
            {quickPills.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {quickPills.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSearchQuery(cat.name);
                      setView('browse', undefined, cat.id);
                    }}
                    className="text-sm text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-colors backdrop-blur-sm"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="mt-12 sm:mt-16 mx-auto max-w-3xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
              {[
                {
                  value: displayStats.totalBusinesses,
                  label: 'Businesses',
                  icon: Building2,
                },
                {
                  value: displayStats.totalLocalities,
                  label: 'Localities',
                  icon: MapPin,
                },
                {
                  value: displayStats.totalCategories,
                  label: 'Categories',
                  icon: FolderOpen,
                },
                {
                  value: displayStats.totalReviews || 'New',
                  label: 'Reviews',
                  icon: TrendingUp,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <stat.icon className="h-5 w-5 mx-auto mb-1.5 text-white/50 group-hover:text-teal-200 transition-colors" />
                  <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll down */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-down">
            <button
              onClick={() => {
                const el = document.getElementById('featured-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Scroll down"
            >
              <span className="text-xs font-medium">Explore</span>
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0,60 C360,0 720,80 1440,20 L1440,80 L0,80 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════ 2. FEATURED BUSINESSES ═══════════════════ */}
      <section id="featured-section" className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                <Star className="h-3.5 w-3.5" /> Featured
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Featured in{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {city}
                </span>
              </h2>
              <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                Top-rated places loved by the community
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex shrink-0"
              onClick={() => setView('browse')}
            >
              View All <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-[280px] sm:w-[300px] rounded-xl shrink-0" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No featured businesses yet</p>
              <p className="text-sm mt-1">Check back soon for curated listings in {city}</p>
            </div>
          ) : (
            <div className="relative group/scroll">
              {/* Left arrow */}
              <button
                onClick={() => scrollFeatured('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-muted"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Scrollable row */}
              <div
                ref={featuredRef}
                className="flex gap-5 overflow-x-auto scrollbar-thin pb-2 scroll-smooth snap-x snap-mandatory px-1"
              >
                {featured.map((biz) => (
                  <div key={biz.id} className="snap-start shrink-0 w-[280px] sm:w-[300px]">
                    <BusinessCard business={biz} />
                  </div>
                ))}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollFeatured('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-muted"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Mobile view all button */}
          <div className="mt-6 text-center sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('browse')}
            >
              View All <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. LOCALITIES SECTION ═══════════════════ */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <MapPin className="h-3.5 w-3.5" /> Areas
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Explore{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {city}
              </span>{' '}
              Areas
            </h2>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Discover businesses and services in every neighbourhood
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : localities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No localities listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {localities.map((loc, idx) => (
                <Card
                  key={loc.id}
                  className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-border/50 shimmer-effect"
                  onClick={() => setView('browse', undefined, undefined, loc.id)}
                >
                  <div
                    className={`${LOCALITY_GRADIENTS[idx % LOCALITY_GRADIENTS.length]} p-5 h-full min-h-[120px] flex flex-col justify-end relative`}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <div className="relative z-10">
                      <MapPin className="h-4 w-4 text-white/60 mb-1.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                      <p className="font-bold text-white text-base sm:text-lg leading-tight">
                        {loc.name}
                      </p>
                      <p className="text-xs sm:text-sm text-white/70 mt-0.5">
                        {loc._count?.businesses || 0} places
                      </p>
                      {loc.description && (
                        <p className="text-xs text-white/50 mt-1 line-clamp-1">
                          {loc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setView('browse')}
            >
              View All Areas <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. SERVICES SHOWCASE ═══════════════════ */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Layers className="h-3.5 w-3.5" /> Services
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Popular Services
            </h2>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Browse top service categories in {city}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {categories.map((cat, idx) => {
                const IconComp = CATEGORY_ICONS[cat.icon || 'Building2'] || Building2;
                const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
                return (
                  <Card
                    key={cat.id}
                    className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-border/50 shimmer-effect"
                    onClick={() => setView('browse', undefined, cat.id)}
                  >
                    <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                      <div
                        className={`p-2.5 sm:p-3 rounded-xl ${gradient.bg} shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <IconComp className={`h-5 w-5 sm:h-6 sm:w-6 ${gradient.icon}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat._count?.businesses || 0} providers
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ 5. PRODUCTS SPOTLIGHT ═══════════════════ */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Package className="h-3.5 w-3.5" /> Offers
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Products &amp; Offers
            </h2>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Explore products and deals across categories
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {categories.slice(0, 8).map((cat, idx) => {
                const IconComp = CATEGORY_ICONS[cat.icon || 'Building2'] || Building2;
                const grad = PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length];
                return (
                  <Card
                    key={cat.id}
                    className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-border/50"
                    onClick={() => {
                      setSearchQuery(cat.name);
                      setView('browse', undefined, cat.id);
                    }}
                  >
                    <div
                      className={`bg-gradient-to-br ${grad} p-5 sm:p-6 flex flex-col items-center justify-center text-center min-h-[140px] relative`}
                    >
                      {/* Decorative circle */}
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/5" />

                      <div className="relative z-10">
                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm mb-3 mx-auto w-fit group-hover:scale-110 transition-transform duration-200">
                          <IconComp className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-semibold text-white text-sm leading-tight">
                          Explore {cat.name} Products
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-white/20 text-white border-0 text-xs"
                        >
                          {cat._count?.businesses || 0} listings
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ 6. HOW IT WORKS ═══════════════════ */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Sparkles className="h-3.5 w-3.5" /> How It Works
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Find What You Need in {city}
            </h2>
            <p className="mt-2 text-muted-foreground text-base sm:text-lg">
              Three simple steps to connect with the best businesses
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 max-w-4xl mx-auto">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />

            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 mb-5">
                  {step.num}
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. CTA SECTION ═══════════════════ */}
      <section className="py-12 sm:py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.06),transparent_60%)]" />
            {/* Floating shapes */}
            <div className="absolute top-8 left-[10%] w-16 h-16 rounded-full bg-white/5 animate-[float_5s_ease-in-out_infinite]" />
            <div className="absolute bottom-8 right-[15%] w-20 h-20 rounded-xl bg-white/[0.06] animate-[float-reverse_6s_ease-in-out_infinite_0.5s]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                List Your Business in{' '}
                <span className="bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  {city}
                </span>
              </h2>
              <p className="mt-3 text-base sm:text-lg text-white/70 max-w-xl mx-auto">
                Reach thousands of potential customers. Add your business, amenities, products,
                and services to our growing directory.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-8 rounded-xl"
                  onClick={() => setView('owner-register')}
                >
                  Register Now
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

      {/* ═══════════════════ 8. TESTIMONIALS ═══════════════════ */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <MessageSquareQuote className="h-3.5 w-3.5" /> Testimonials
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              What People Say About Us
            </h2>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Real stories from real users in {city}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, idx) => (
              <Card
                key={t.name}
                className="relative border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gradient top border */}
                <div
                  className={`h-1 ${LOCALITY_GRADIENTS[idx % LOCALITY_GRADIENTS.length]}`}
                />
                <CardContent className="p-6">
                  {/* Decorative quote */}
                  <div className="relative mb-2">
                    <Quote className="h-14 w-14 text-primary/[0.08] absolute -top-3 -left-1" />
                    <Quote className="h-6 w-6 text-primary/15 relative z-10" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${
                        LOCALITY_GRADIENTS[(idx + 2) % LOCALITY_GRADIENTS.length]
                      } flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {t.avatar}
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

      {/* ═══════════════════ BACK TO TOP ═══════════════════ */}
      <button
        onClick={scrollToTop}
        className={`back-to-top fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 flex items-center justify-center transition-all duration-200 ${
          showBackToTop ? 'visible' : 'hidden'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}