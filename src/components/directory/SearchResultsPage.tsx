'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Search, Package, Building2, MapPin, TreePine, Star, MessageSquare,
  ExternalLink, ArrowLeft, Loader2, ShieldCheck, Phone, ChevronRight,
  Hash, Send, X, CheckCircle2, Briefcase,
} from 'lucide-react';

interface ProductResult {
  id: string; name: string; description?: string; price?: string; type: 'PRODUCT' | 'SERVICE';
  business: { id: string; name: string; slug: string; type: string; rating: number; isVerified: boolean; locality: { name: string }; category: { name: string } };
}
interface BusinessResult {
  id: string; name: string; slug: string; type: string; rating: number; isVerified: boolean; isFeatured: boolean;
  address?: string; phone?: string;
  category: { name: string; icon?: string }; locality: { name: string };
  _count: { products: number; reviews: number };
}
interface AmenityResult {
  id: string; name: string; slug: string; type: string; rating: number; isVerified: boolean;
  address?: string; phone?: string;
  category: { name: string; icon?: string }; locality: { name: string };
}
interface LocalityResult {
  id: string; name: string; slug: string; description?: string;
  _count: { businesses: number };
}

interface SearchResult {
  products: ProductResult[];
  businesses: BusinessResult[];
  amenities: AmenityResult[];
  localities: LocalityResult[];
  query: string;
  total: number;
}

export function SearchResultsPage() {
  const { searchQuery, setSearchQuery, setView, user, isAuthenticated, cacheBusinessSlugs } = useAppStore();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState<ProductResult | null>(null);
  const [enquiryBusiness, setEnquiryBusiness] = useState<BusinessResult | null>(null);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const searchedQueryRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Skip if this exact query was already searched
    if (searchedQueryRef.current === trimmed) return;
    searchedQueryRef.current = trimmed;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await api.get<SearchResult>(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });
      setResults(res);
      // Cache business slugs for URL navigation
      const bizEntries = res.businesses?.map(b => ({ id: b.id, slug: b.slug })) || [];
      const amenEntries = res.amenities?.map(a => ({ id: a.id, slug: a.slug })) || [];
      const prodEntries = res.products?.map(p => ({ id: p.business.id, slug: p.business.slug })) || [];
      const allEntries = [...bizEntries, ...amenEntries, ...prodEntries];
      if (allEntries.length) cacheBusinessSlugs(allEntries);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error('Search failed');
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) doSearch(searchQuery);
  }, [searchQuery, doSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchedQueryRef.current = null; // Allow re-search on explicit submit
    doSearch(searchQuery);
  };

  const openEnquiry = (product?: ProductResult, business?: BusinessResult) => {
    if (!isAuthenticated) { setView('login'); toast.info('Please login to send an enquiry'); return; }
    if (product) { setEnquiryProduct(product); setEnquiryBusiness(null); }
    else if (business) { setEnquiryBusiness(business); setEnquiryProduct(null); }
    setEnquiryMsg('');
    setEnquiryOpen(true);
  };

  const handleEnquirySubmit = async () => {
    const bizId = enquiryProduct?.business.id || enquiryBusiness?.id;
    if (!bizId || !enquiryMsg.trim()) return;
    setSubmittingEnquiry(true);
    try {
      const productName = enquiryProduct ? `Regarding: ${enquiryProduct.name} (${enquiryProduct.price})` : '';
      await api.post('/api/enquiries', {
        businessId: bizId,
        message: enquiryProduct ? `${productName}\n\n${enquiryMsg}` : enquiryMsg,
      });
      toast.success('Enquiry sent successfully!');
      setEnquiryOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send enquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const getTabCount = (tab: string) => {
    if (!results) return 0;
    switch (tab) {
      case 'all': return results.total;
      case 'products': return results.products.length;
      case 'businesses': return results.businesses.length;
      case 'amenities': return results.amenities.length;
      case 'localities': return results.localities.length;
      default: return 0;
    }
  };

  const getTypeBadge = (type: 'PRODUCT' | 'SERVICE') => (
    <Badge variant="secondary" className={
      type === 'SERVICE'
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px]'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]'
    }>
      {type === 'SERVICE' ? <Briefcase className="h-3 w-3 mr-0.5" /> : <Package className="h-3 w-3 mr-0.5" />}
      {type}
    </Badge>
  );

  // ---- Renderers ----

  const renderProductCard = (p: ProductResult) => (
    <Card key={p.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center shrink-0">
            {p.type === 'SERVICE' ? <Briefcase className="h-5 w-5 text-violet-500" /> : <Package className="h-5 w-5 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
              </div>
              {p.price && (
                <Badge variant="outline" className="shrink-0 font-semibold text-xs text-primary border-primary/30">
                  {p.price}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {getTypeBadge(p.type)}
              <button
                onClick={() => setView('business-detail', p.business.id)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Building2 className="h-3 w-3" />
                {p.business.name}
              </button>
              <span className="text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 inline mr-0.5" /> {p.business.locality.name}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openEnquiry(p)}>
                <MessageSquare className="h-3 w-3" /> Enquire
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setView('business-detail', p.business.id)}>
                <ExternalLink className="h-3 w-3" /> View Business
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderBusinessCard = (b: BusinessResult) => (
    <Card key={b.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer" onClick={() => setView('business-detail', b.id)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{b.name}</p>
              {b.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
              {b.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>{b.category.name}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {b.locality.name}</span>
              {b.rating > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {b.rating.toFixed(1)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {b._count.products > 0 && <span>{b._count.products} product{b._count.products > 1 ? 's' : ''}</span>}
              {b._count.reviews > 0 && <span>{b._count.reviews} review{b._count.reviews > 1 ? 's' : ''}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {b.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>}
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEnquiry(undefined, b); }}>
              <MessageSquare className="h-3 w-3" /> Enquire
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAmenityCard = (a: AmenityResult) => (
    <Card key={a.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer" onClick={() => setView('business-detail', a.id)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
            <TreePine className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{a.name}</p>
              {a.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>{a.category.name}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {a.locality.name}</span>
            </div>
            {a.address && <p className="text-xs text-muted-foreground mt-1 truncate">{a.address}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  const renderLocalityCard = (l: LocalityResult) => (
    <Card key={l.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer" onClick={() => setView('browse', undefined, undefined, l.id)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{l.name}</p>
            {l.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{l.description}</p>}
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Building2 className="h-3 w-3 mr-1" /> {l._count.businesses} places
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );

  const renderEmpty = (icon: React.ElementType, message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted w-fit mb-3">
        <icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  const renderSkeletons = (count: number) => Array.from({ length: count }).map((_, i) => (
    <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="flex gap-3"><Skeleton className="h-11 w-11 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div></CardContent></Card>
  ));

  if (!searchQuery || searchQuery.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-center">
        <div className="p-8">
          <Search className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">Search for anything</h2>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">Find products, services, businesses, amenities, or localities across the city directory</p>
        </div>
      </div>
    );
  }

  const r = results;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      {/* Back + Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <form onSubmit={handleFormSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 bg-muted text-base"
            placeholder="Search products, services, businesses, amenities, localities..."
            autoFocus
          />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); setResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Loading */}
      {loading && <div className="space-y-3">{renderSkeletons(5)}</div>}

      {/* Results */}
      {!loading && r && (
        <>
          {/* Summary */}
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {r.total} result{r.total !== 1 ? 's' : ''} for &ldquo;{r.query}&rdquo;
            </h2>
          </div>

          {r.total === 0 ? (
            renderEmpty(Search, `No results found for "${r.query}". Try a different search term.`)
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full sm:w-auto flex h-auto flex-wrap gap-1 bg-muted/50 p-1 mb-6">
                <TabsTrigger value="all" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  All <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{r.total}</Badge>
                </TabsTrigger>
                {r.products.length > 0 && (
                  <TabsTrigger value="products" className="text-xs gap-1.5 data-[state=active]:bg-background">
                    Products & Services <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{r.products.length}</Badge>
                  </TabsTrigger>
                )}
                {r.businesses.length > 0 && (
                  <TabsTrigger value="businesses" className="text-xs gap-1.5 data-[state=active]:bg-background">
                    Businesses <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{r.businesses.length}</Badge>
                  </TabsTrigger>
                )}
                {r.amenities.length > 0 && (
                  <TabsTrigger value="amenities" className="text-xs gap-1.5 data-[state=active]:bg-background">
                    Amenities <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{r.amenities.length}</Badge>
                  </TabsTrigger>
                )}
                {r.localities.length > 0 && (
                  <TabsTrigger value="localities" className="text-xs gap-1.5 data-[state=active]:bg-background">
                    Localities <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{r.localities.length}</Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="mt-4 space-y-6">
                {r.products.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-violet-500" /> Products & Services
                      <Badge variant="secondary" className="text-[10px]">{r.products.length}</Badge>
                    </h3>
                    <div className="grid gap-3">{r.products.map(renderProductCard)}</div>
                  </section>
                )}
                {r.businesses.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-500" /> Businesses
                      <Badge variant="secondary" className="text-[10px]">{r.businesses.length}</Badge>
                    </h3>
                    <div className="grid gap-3">{r.businesses.map(renderBusinessCard)}</div>
                  </section>
                )}
                {r.amenities.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TreePine className="h-4 w-4 text-teal-500" /> Amenities
                      <Badge variant="secondary" className="text-[10px]">{r.amenities.length}</Badge>
                    </h3>
                    <div className="grid gap-3">{r.amenities.map(renderAmenityCard)}</div>
                  </section>
                )}
                {r.localities.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-500" /> Localities
                      <Badge variant="secondary" className="text-[10px]">{r.localities.length}</Badge>
                    </h3>
                    <div className="grid gap-3">{r.localities.map(renderLocalityCard)}</div>
                  </section>
                )}
              </TabsContent>

              {/* Individual tabs */}
              <TabsContent value="products" className="mt-4">
                <div className="grid gap-3">{r.products.map(renderProductCard)}</div>
                {r.products.length === 0 && renderEmpty(Package, 'No products or services found.')}
              </TabsContent>
              <TabsContent value="businesses" className="mt-4">
                <div className="grid gap-3">{r.businesses.map(renderBusinessCard)}</div>
                {r.businesses.length === 0 && renderEmpty(Building2, 'No businesses found.')}
              </TabsContent>
              <TabsContent value="amenities" className="mt-4">
                <div className="grid gap-3">{r.amenities.map(renderAmenityCard)}</div>
                {r.amenities.length === 0 && renderEmpty(TreePine, 'No amenities found.')}
              </TabsContent>
              <TabsContent value="localities" className="mt-4">
                <div className="grid gap-3">{r.localities.map(renderLocalityCard)}</div>
                {r.localities.length === 0 && renderEmpty(MapPin, 'No localities found.')}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
      <Separator className="my-8" />

      {/* Enquiry Dialog */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Send Enquiry
            </DialogTitle>
            <DialogDescription>
              {enquiryProduct && (
                <>About <strong>{enquiryProduct.name}</strong> from <strong>{enquiryProduct.business.name}</strong></>
              )}
              {enquiryBusiness && <>To <strong>{enquiryBusiness.name}</strong></>}
            </DialogDescription>
          </DialogHeader>
          {enquiryProduct && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{enquiryProduct.name}</p>
                  <p className="text-xs text-muted-foreground">{enquiryProduct.business.name} · {enquiryProduct.business.locality.name}</p>
                </div>
                <div className="text-right">
                  {enquiryProduct.price && <p className="font-semibold text-sm text-primary">{enquiryProduct.price}</p>}
                  {getTypeBadge(enquiryProduct.type)}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="enquiry-msg">Your Message *</Label>
            <Textarea
              id="enquiry-msg"
              value={enquiryMsg}
              onChange={(e) => setEnquiryMsg(e.target.value)}
              placeholder={enquiryProduct ? `I'm interested in ${enquiryProduct.name}. Please provide more details...` : 'Write your enquiry here...'}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEnquiryOpen(false)}>Cancel</Button>
            <Button onClick={handleEnquirySubmit} disabled={submittingEnquiry || !enquiryMsg.trim()} className="gap-1.5">
              {submittingEnquiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}