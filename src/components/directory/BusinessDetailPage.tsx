'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Star, CheckCircle2, Clock,
  Package, Wrench, Send, ShieldCheck, ExternalLink,
} from 'lucide-react';
import type { BusinessWithRelations, Enquiry } from '@/types';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3 && rating - fullStars < 0.8;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={`${iconSize} fill-amber-400 text-amber-400`} />
      ))}
      {hasHalf && (
        <div className="relative" aria-hidden="true">
          <Star className={`${iconSize} text-amber-400/30`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${iconSize} fill-amber-400 text-amber-400`} />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={`${iconSize} text-amber-400/30`} />
      ))}
    </div>
  );
}

export function BusinessDetailPage() {
  const { selectedBusinessId, user, isAuthenticated, setView } = useAppStore();
  const [business, setBusiness] = useState<BusinessWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Enquiry form
  const [eqName, setEqName] = useState('');
  const [eqEmail, setEqEmail] = useState('');
  const [eqPhone, setEqPhone] = useState('');
  const [eqMessage, setEqMessage] = useState('');

  useEffect(() => {
    if (!selectedBusinessId) return;
    setLoading(true);
    api.get<{ business: BusinessWithRelations }>(`/api/businesses/${selectedBusinessId}`)
      .then((r) => setBusiness(r.business))
      .catch(() => toast.error('Failed to load business'))
      .finally(() => setLoading(false));
  }, [selectedBusinessId]);

  useEffect(() => {
    if (user) {
      setEqName(user.name);
      setEqEmail(user.email);
    }
  }, [user]);

  const canEdit = user?.role === 'ADMIN' || (user?.role === 'BUSINESS_OWNER' && business?.ownerId === user.id);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit an enquiry');
      setView('login');
      return;
    }
    if (!selectedBusinessId) return;
    setSubmitting(true);
    try {
      await api.post<Enquiry>('/api/enquiries', {
        name: eqName, email: eqEmail, phone: eqPhone, message: eqMessage, businessId: selectedBusinessId,
      });
      toast.success('Enquiry sent successfully!');
      setEqPhone('');
      setEqMessage('');
      if (user?.role === 'VISITOR') setView('visitor-dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setView('browse');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Business not found.</p>
        <Button className="mt-4" onClick={() => setView('browse')}>Browse Directory</Button>
      </div>
    );
  }

  const products = business.products?.filter((p) => p.isActive) || [];
  const productItems = products.filter((p) => p.type === 'PRODUCT');
  const serviceItems = products.filter((p) => p.type === 'SERVICE');

  return (
    <div className="animate-fade-in">
      {/* Cover */}
      <div className="gradient-hero relative h-48 sm:h-64">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/15 text-[120px] sm:text-[180px] font-black select-none">{business.name.charAt(0)}</span>
        </div>
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Main Info Card */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-card-2 flex items-center justify-center shrink-0`}>
                <span className="text-white/50 text-4xl sm:text-5xl font-black select-none">{business.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{business.name}</h1>
                  {business.isVerified && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 gap-1 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                  {business.isFeatured && (
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/20 gap-1 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                      <Star className="h-3.5 w-3.5" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className={
                    business.type === 'AMENITY' ? 'border-amber-500/30 text-amber-700 dark:text-amber-400' : 'border-primary/30 text-primary'
                  }>
                    {business.type === 'AMENITY' ? 'Amenity' : 'Business'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{business.category?.name}</Badge>
                  <Badge variant="secondary"><MapPin className="h-3 w-3 mr-1" />{business.locality?.name}</Badge>
                </div>
                {/* Star Rating Display */}
                {business.rating > 0 && (
                  <div className="flex items-center gap-2.5 mt-3">
                    <StarRating rating={business.rating} size="md" />
                    <span className="text-lg font-bold text-foreground">{business.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                )}
                {business.description && (
                  <p className="mt-3 text-muted-foreground leading-relaxed">{business.description}</p>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setView('edit-business', business.id)}>
                  Edit Business
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Sticky on desktop */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{business.address}</p>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-sm hover:text-primary transition-colors">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <a href={`mailto:${business.email}`} className="text-sm hover:text-primary transition-colors">
                      {business.email}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary shrink-0" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors flex items-center gap-1">
                      Visit Website <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Enquiry */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Quick Enquiry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEnquiry} className="space-y-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input value={eqName} onChange={(e) => setEqName(e.target.value)} required className="h-9" disabled={!isAuthenticated} />
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={eqEmail} onChange={(e) => setEqEmail(e.target.value)} required className="h-9" disabled={!isAuthenticated} />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input value={eqPhone} onChange={(e) => setEqPhone(e.target.value)} className="h-9" disabled={!isAuthenticated} />
                  </div>
                  <div>
                    <Label className="text-xs">Message *</Label>
                    <Textarea
                      value={eqMessage}
                      onChange={(e) => setEqMessage(e.target.value)}
                      required rows={3}
                      className="resize-none"
                      disabled={!isAuthenticated}
                      placeholder="I'd like to know about..."
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full" disabled={submitting || !isAuthenticated}>
                    {submitting ? 'Sending...' : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Enquiry</>}
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground text-center">
                      <button type="button" onClick={() => setView('login')} className="text-primary underline">Login</button> to send enquiry
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="products" className="gap-1.5">
                  <Package className="h-4 w-4" /> Products & Services
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-1.5">
                  <Clock className="h-4 w-4" /> About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-6">
                {products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No products or services listed yet.</p>
                  </div>
                ) : (
                  <>
                    {productItems.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" /> Products
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                          {productItems.map((p) => (
                            <Card key={p.id} className="overflow-hidden">
                              <div className={`h-28 ${getGradient(p.id)} flex items-center justify-center`}>
                                <Package className="h-10 w-10 text-white/30" />
                              </div>
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{p.name}</h4>
                                {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                                {p.price && (
                                  <p className="text-primary font-bold mt-2">{p.price}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    {serviceItems.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-primary" /> Services
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                          {serviceItems.map((s) => (
                            <Card key={s.id} className="overflow-hidden">
                              <div className={`h-28 ${getGradient(s.id)} flex items-center justify-center`}>
                                <Wrench className="h-10 w-10 text-white/30" />
                              </div>
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{s.name}</h4>
                                {s.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                                {s.price && (
                                  <p className="text-primary font-bold mt-2">{s.price}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">About {business.name}</h3>
                    {business.description ? (
                      <p className="text-muted-foreground leading-relaxed">{business.description}</p>
                    ) : (
                      <p className="text-muted-foreground">No description available yet.</p>
                    )}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium mt-0.5">{business.category?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Locality</p>
                        <p className="font-medium mt-0.5">{business.locality?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium mt-0.5">{business.type === 'AMENITY' ? 'Amenity' : 'Business'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Listed Since</p>
                        <p className="font-medium mt-0.5">{new Date(business.createdAt).toLocaleDateString()}</p>
                      </div>
                      {business.rating > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StarRating rating={business.rating} size="sm" />
                            <span className="font-medium">{business.rating.toFixed(1)} / 5.0</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="h-12" />
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