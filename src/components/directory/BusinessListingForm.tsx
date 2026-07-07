'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Building2, TreePine, Globe, Phone, Mail, MapPin, Link, Star,
  ArrowLeft, ArrowRight, Check, ImageIcon, Clock, Share2, Package, Wrench,
  Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp,
  FileText, Info, Camera, Instagram, Facebook, Youtube, Twitter,
  MessageCircle, MapPinned, CheckCircle2, AlertCircle,
} from 'lucide-react';
import type { Category, Locality, BusinessWithRelations, BusinessHour, BusinessImage, Product } from '@/types';

interface BusinessListingFormProps {
  businessId?: string;
  onSuccess?: () => void;
  isAdmin?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STEP_INFO = [
  { label: 'Basic Info', icon: Building2 },
  { label: 'Description', icon: FileText },
  { label: 'Images', icon: Camera },
  { label: 'Social Media', icon: Share2 },
  { label: 'Hours', icon: Clock },
  { label: 'Products', icon: Package },
  { label: 'Review', icon: CheckCircle2 },
];

// ─── Form State Types ──────────────────────────────────────────

interface GalleryImage {
  tempId: string;
  url: string;
  caption: string;
}

interface ProductEntry {
  tempId: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  type: 'PRODUCT' | 'SERVICE';
  image: string;
  additionalImages: string;
}

interface HourEntry {
  day: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ─── Main Component ────────────────────────────────────────────

export function BusinessListingForm({ businessId, onSuccess, isAdmin = false }: BusinessListingFormProps) {
  const { user, categories, localities } = useAppStore();
  const isEditing = !!businessId;

  // Step
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  // Step 1 - Basic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'BUSINESS' | 'AMENITY'>('BUSINESS');
  const [categoryId, setCategoryId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2 - Description
  const [description, setDescription] = useState('');
  const [aboutUs, setAboutUs] = useState('');

  // Step 3 - Images
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Step 4 - Social Media
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');

  // Step 5 - Hours
  const [hours, setHours] = useState<HourEntry[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day: i,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: i === 0,
    }))
  );
  const [applyAllOpen, setApplyAllOpen] = useState('');
  const [applyAllClose, setApplyAllClose] = useState('');

  // Step 6 - Products
  const [products, setProducts] = useState<ProductEntry[]>([]);

  // Check for pre-filled business name intent from owner registration
  useEffect(() => {
    if (!isEditing) {
      const intent = sessionStorage.getItem('citydir_business_intent');
      if (intent) {
        setName(intent);
        setSlug(generateSlug(intent));
        sessionStorage.removeItem('citydir_business_intent');
      }
    }
  }, [isEditing]);

  // Load existing data for editing
  const loadBusiness = useCallback(async () => {
    if (!businessId) return;
    setLoadingData(true);
    try {
      const res = await api.get<{ business: BusinessWithRelations }>(`/api/businesses/${businessId}`);
      const b = res.business;
      setName(b.name);
      setSlug(b.slug);
      setType(b.type);
      setDescription(b.description || '');
      setAboutUs(b.aboutUs || '');
      setCategoryId(b.categoryId);
      setLocalityId(b.localityId);
      setAddress(b.address || '');
      setPhone(b.phone || '');
      setEmail(b.email || '');
      setWebsite(b.website || '');
      setLogo(b.logo || '');
      setCoverImage(b.coverImage || '');
      setFacebook(b.facebook || '');
      setInstagram(b.instagram || '');
      setTwitter(b.twitter || '');
      setYoutube(b.youtube || '');
      setWhatsapp(b.whatsapp || '');
      setGoogleMaps(b.googleMaps || '');

      // Gallery images
      if (b.images && b.images.length > 0) {
        setGalleryImages(
          b.images.map((img: BusinessImage) => ({
            tempId: img.id,
            url: img.url,
            caption: img.caption || '',
          }))
        );
      }

      // Hours
      if (b.hours && b.hours.length > 0) {
        const loadedHours: HourEntry[] = Array.from({ length: 7 }, (_, i) => {
          const h = b.hours.find((bh: BusinessHour) => bh.day === i);
          return {
            day: i,
            openTime: h?.openTime || '09:00',
            closeTime: h?.closeTime || '18:00',
            isClosed: h?.isClosed ?? (i === 0),
          };
        });
        setHours(loadedHours);
      }

      // Products
      if (b.products && b.products.length > 0) {
        setProducts(
          b.products.map((p: Product) => ({
            tempId: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price || '',
            priceUnit: p.priceUnit || '',
            type: p.type,
            image: p.image || '',
            additionalImages: p.images || '',
          }))
        );
      }
    } catch {
      toast.error('Failed to load business data');
    } finally {
      setLoadingData(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  // ─── Validation ───────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!name.trim()) { toast.error('Business name is required'); return false; }
        if (!slug.trim()) { toast.error('Slug is required'); return false; }
        if (!categoryId) { toast.error('Please select a category'); return false; }
        if (!localityId) { toast.error('Please select a locality'); return false; }
        return true;
      case 1:
        return true; // Description is optional
      case 2:
        return true; // Images are optional
      case 3:
        return true; // Social media is optional
      case 4:
        return true; // Hours are optional
      case 5:
        return true; // Products are optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // ─── Submit ───────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
        type,
        description: description.trim() || undefined,
        aboutUs: aboutUs.trim() || undefined,
        categoryId,
        localityId,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        logo: logo.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        facebook: facebook.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        youtube: youtube.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        googleMaps: googleMaps.trim() || undefined,
        hours: hours.map((h) => ({
          day: h.day,
          openTime: h.isClosed ? null : h.openTime,
          closeTime: h.isClosed ? null : h.closeTime,
          isClosed: h.isClosed,
        })),
        galleryImages: galleryImages
          .filter((g) => g.url.trim())
          .map((g, i) => ({ url: g.url.trim(), caption: g.caption.trim() || undefined, order: i })),
        products: products
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            description: p.description.trim() || undefined,
            price: p.price.trim() || undefined,
            priceUnit: p.priceUnit.trim() || undefined,
            type: p.type,
            image: p.image.trim() || undefined,
            images: p.additionalImages.trim() || undefined,
          })),
      };

      if (isEditing) {
        await api.put(`/api/businesses/${businessId}`, payload);
        toast.success('Business updated successfully!');
        setSubmitted(true);
        setTimeout(() => onSuccess?.(), 1500);
      } else {
        await api.post('/api/businesses', payload);
        if (isAdmin) {
          toast.success('Business created successfully!');
          setSubmitted(true);
          setTimeout(() => onSuccess?.(), 1500);
        } else {
          setSubmitted(true);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Gallery Helpers ──────────────────────────────────────────

  const addGalleryImage = () => {
    setGalleryImages((prev) => [...prev, { tempId: `temp-${Date.now()}`, url: '', caption: '' }]);
  };

  const removeGalleryImage = (tempId: string) => {
    setGalleryImages((prev) => prev.filter((g) => g.tempId !== tempId));
  };

  const updateGalleryImage = (tempId: string, field: 'url' | 'caption', value: string) => {
    setGalleryImages((prev) => prev.map((g) => g.tempId === tempId ? { ...g, [field]: value } : g));
  };

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...galleryImages];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    setGalleryImages(newImages);
  };

  // ─── Product Helpers ──────────────────────────────────────────

  const addProduct = () => {
    setProducts((prev) => [...prev, {
      tempId: `temp-${Date.now()}`,
      name: '',
      description: '',
      price: '',
      priceUnit: '',
      type: 'PRODUCT',
      image: '',
      additionalImages: '',
    }]);
  };

  const removeProduct = (tempId: string) => {
    setProducts((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const updateProduct = (tempId: string, field: keyof ProductEntry, value: string) => {
    setProducts((prev) => prev.map((p) => p.tempId === tempId ? { ...p, [field]: value } : p));
  };

  // ─── Hours Helpers ────────────────────────────────────────────

  const updateHour = (day: number, field: keyof HourEntry, value: string | boolean) => {
    setHours((prev) => prev.map((h) => h.day === day ? { ...h, [field]: value } : h));
  };

  const applyToAll = () => {
    if (!applyAllOpen || !applyAllClose) {
      toast.error('Set both open and close times first');
      return;
    }
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        openTime: applyAllOpen,
        closeTime: applyAllClose,
        isClosed: false,
      }))
    );
    toast.success('Applied to all days');
  };

  // ─── Summary Data ─────────────────────────────────────────────

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedLocality = localities.find((l) => l.id === localityId);

  // ─── Loading State ────────────────────────────────────────────

  if (loadingData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Submitted State ──────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 w-fit mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isEditing ? 'Business Updated!' : isAdmin ? 'Business Created!' : 'Listing Submitted!'}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {isEditing
            ? 'Your changes have been saved successfully.'
            : isAdmin
              ? 'The business has been created and is now active.'
              : 'Your listing has been submitted for review. An admin will approve it shortly. You\'ll be notified once it\'s live.'}
        </p>
        <Button onClick={() => onSuccess?.()}>Go to Dashboard</Button>
      </div>
    );
  }

  // ─── Render Steps ─────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <StepBasicInfo />;
      case 1: return <StepDescription />;
      case 2: return <StepImages />;
      case 3: return <StepSocialMedia />;
      case 4: return <StepHours />;
      case 5: return <StepProducts />;
      case 6: return <StepReview />;
      default: return null;
    }
  };

  // ─── Step Components ──────────────────────────────────────────

  function StepBasicInfo() {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="biz-name">Business Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="biz-name"
              placeholder="e.g. Sunrise Cafe"
              value={name}
              onChange={(e) => { setName(e.target.value); if (!isEditing) setSlug(generateSlug(e.target.value)); }}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-slug">Slug *</Label>
          <Input
            id="biz-slug"
            placeholder="sunrise-cafe"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={isEditing}
          />
          <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-generated from name.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Type *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'BUSINESS' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setType('BUSINESS')}
            >
              <Building2 className="h-4 w-4" /> Business
            </Button>
            <Button
              type="button"
              variant={type === 'AMENITY' ? 'default' : 'outline'}
              className="flex-1 gap-2"
              onClick={() => setType('AMENITY')}
            >
              <TreePine className="h-4 w-4" /> Amenity
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Locality *</Label>
            <Select value={localityId} onValueChange={setLocalityId}>
              <SelectTrigger><SelectValue placeholder="Select locality" /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {localities.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="biz-address" placeholder="123 Main Street, City" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="biz-phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="biz-phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="biz-email" type="email" placeholder="info@business.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-website">Website</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="biz-website" placeholder="https://www.business.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>
    );
  }

  function StepDescription() {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="biz-short-desc">Short Description</Label>
          <p className="text-xs text-muted-foreground">Brief summary shown on listing cards and search results</p>
          <Textarea
            id="biz-short-desc"
            placeholder="A cozy cafe known for its artisan coffee and fresh pastries..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={300}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-about">About Us</Label>
          <p className="text-xs text-muted-foreground">Detailed description of your business, its history, mission, and what makes it special</p>
          <Textarea
            id="biz-about"
            placeholder="Tell visitors everything about your business..."
            value={aboutUs}
            onChange={(e) => setAboutUs(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{aboutUs.length} characters</p>
        </div>
      </div>
    );
  }

  function StepImages() {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="biz-logo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> Logo URL
          </Label>
          <Input id="biz-logo" placeholder="https://example.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} />
          {logo && (
            <div className="mt-2 p-2 rounded-lg border inline-block">
              <img src={logo} alt="Logo preview" className="h-16 w-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-cover" className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" /> Cover Image URL
          </Label>
          <Input id="biz-cover" placeholder="https://example.com/cover.jpg" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
          {coverImage && (
            <div className="mt-2 rounded-lg border overflow-hidden max-w-sm">
              <img src={coverImage} alt="Cover preview" className="h-32 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" /> Gallery Images
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addGalleryImage}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Image
            </Button>
          </div>

          {galleryImages.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-xl">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No gallery images yet</p>
              <p className="text-xs text-muted-foreground/70">Click &quot;Add Image&quot; to add photos</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {galleryImages.map((img, index) => (
                <div key={img.tempId} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex flex-col gap-1 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(index, 'down')}
                      disabled={index === galleryImages.length - 1}
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <Input
                      placeholder="Image URL *"
                      value={img.url}
                      onChange={(e) => updateGalleryImage(img.tempId, 'url', e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="Caption (optional)"
                      value={img.caption}
                      onChange={(e) => updateGalleryImage(img.tempId, 'caption', e.target.value)}
                      className="h-9"
                    />
                    {img.url && (
                      <div className="rounded-lg overflow-hidden border h-20">
                        <img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removeGalleryImage(img.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function StepSocialMedia() {
    const socialFields = [
      { key: 'facebook' as const, label: 'Facebook URL', placeholder: 'https://facebook.com/yourpage', icon: Facebook, color: 'text-blue-600' },
      { key: 'instagram' as const, label: 'Instagram URL', placeholder: 'https://instagram.com/yourprofile', icon: Instagram, color: 'text-pink-600' },
      { key: 'twitter' as const, label: 'Twitter / X URL', placeholder: 'https://x.com/yourhandle', icon: Twitter, color: 'text-sky-500' },
      { key: 'youtube' as const, label: 'YouTube URL', placeholder: 'https://youtube.com/@yourchannel', icon: Youtube, color: 'text-red-600' },
    ];

    const contactFields = [
      { key: 'whatsapp' as const, label: 'WhatsApp Number', placeholder: '+91 98765 43210', icon: MessageCircle, color: 'text-emerald-600' },
      { key: 'googleMaps' as const, label: 'Google Maps Link', placeholder: 'https://maps.google.com/...', icon: MapPinned, color: 'text-red-500' },
    ];

    const getVal = (key: string) => {
      switch (key) {
        case 'facebook': return facebook;
        case 'instagram': return instagram;
        case 'twitter': return twitter;
        case 'youtube': return youtube;
        case 'whatsapp': return whatsapp;
        case 'googleMaps': return googleMaps;
        default: return '';
      }
    };

    const setVal = (key: string, val: string) => {
      switch (key) {
        case 'facebook': setFacebook(val); break;
        case 'instagram': setInstagram(val); break;
        case 'twitter': setTwitter(val); break;
        case 'youtube': setYoutube(val); break;
        case 'whatsapp': setWhatsapp(val); break;
        case 'googleMaps': setGoogleMaps(val); break;
      }
    };

    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Add your social media profiles and contact channels to help customers connect with you.
        </p>

        <div className="space-y-3">
          {socialFields.map(({ key, label, placeholder, icon: Icon, color }) => (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} /> {label}
              </Label>
              <Input
                placeholder={placeholder}
                value={getVal(key)}
                onChange={(e) => setVal(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          {contactFields.map(({ key, label, placeholder, icon: Icon, color }) => (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} /> {label}
              </Label>
              <Input
                placeholder={placeholder}
                value={getVal(key)}
                onChange={(e) => setVal(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StepHours() {
    return (
      <div className="space-y-5">
        {/* Apply to All */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Quick Fill: Apply to All Days
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="time"
                value={applyAllOpen}
                onChange={(e) => setApplyAllOpen(e.target.value)}
                className="w-32 h-9"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={applyAllClose}
                onChange={(e) => setApplyAllClose(e.target.value)}
                className="w-32 h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={applyToAll}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {hours.map((h) => (
            <div
              key={h.day}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                h.isClosed ? 'bg-muted/30 border-dashed' : 'bg-background'
              }`}
            >
              <div className="w-20 sm:w-28 shrink-0">
                <p className="text-sm font-medium">{DAY_NAMES[h.day]}</p>
                <p className="text-[11px] text-muted-foreground">{DAY_SHORT[h.day]}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={!h.isClosed}
                  onCheckedChange={(v) => updateHour(h.day, 'isClosed', !v)}
                />
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {h.isClosed ? 'Closed' : 'Open'}
                </span>
              </div>

              {!h.isClosed && (
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => updateHour(h.day, 'openTime', e.target.value)}
                    className="w-32 h-9"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => updateHour(h.day, 'closeTime', e.target.value)}
                    className="w-32 h-9"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StepProducts() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Add products and services you offer</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addProduct}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add {products.length > 0 ? 'Another' : 'Product / Service'}
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No products or services added</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add items to showcase what you offer</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {products.map((p, index) => (
              <Card key={p.tempId} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {p.type === 'SERVICE' ? (
                        <Wrench className="h-4 w-4 text-primary" />
                      ) : (
                        <Package className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">Item {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeProduct(p.tempId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        placeholder="Product or service name"
                        value={p.name}
                        onChange={(e) => updateProduct(p.tempId, 'name', e.target.value)}
                        className="h-9 mt-0.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        placeholder="Brief description..."
                        value={p.description}
                        onChange={(e) => updateProduct(p.tempId, 'description', e.target.value)}
                        className="mt-0.5 resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price</Label>
                      <Input
                        placeholder="e.g. ₹500"
                        value={p.price}
                        onChange={(e) => updateProduct(p.tempId, 'price', e.target.value)}
                        className="h-9 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price Unit</Label>
                      <Input
                        placeholder="e.g. per piece, per hour"
                        value={p.priceUnit}
                        onChange={(e) => updateProduct(p.tempId, 'priceUnit', e.target.value)}
                        className="h-9 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={p.type} onValueChange={(v) => updateProduct(p.tempId, 'type', v)}>
                        <SelectTrigger className="h-9 mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRODUCT">Product</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Image URL</Label>
                      <Input
                        placeholder="https://..."
                        value={p.image}
                        onChange={(e) => updateProduct(p.tempId, 'image', e.target.value)}
                        className="h-9 mt-0.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Additional Image URLs (comma-separated)</Label>
                      <Input
                        placeholder="url1, url2, url3"
                        value={p.additionalImages}
                        onChange={(e) => updateProduct(p.tempId, 'additionalImages', e.target.value)}
                        className="h-9 mt-0.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function StepReview() {
    const filledProducts = products.filter((p) => p.name.trim());
    const filledGallery = galleryImages.filter((g) => g.url.trim());
    const filledHours = hours.filter((h) => !h.isClosed);

    return (
      <div className="space-y-5">
        {/* Basic Info Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Basic Information
              <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(0)}>Edit</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline">{type}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{selectedCategory?.name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Locality</span><span className="font-medium">{selectedLocality?.name || '-'}</span></div>
            {address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[60%] truncate">{address}</span></div>}
            {phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>}
            {email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>}
            {website && <div className="flex justify-between"><span className="text-muted-foreground">Website</span><span className="font-medium text-primary truncate max-w-[60%]">{website}</span></div>}
          </CardContent>
        </Card>

        {/* Description Summary */}
        {(description || aboutUs) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Description
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(1)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {description && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Short Description</p>
                  <p className="leading-relaxed">{description}</p>
                </div>
              )}
              {aboutUs && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">About Us</p>
                  <p className="leading-relaxed line-clamp-4">{aboutUs}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Images Summary */}
        {(logo || coverImage || filledGallery.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Images
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(2)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex flex-wrap gap-2">
                {logo && <Badge variant="secondary" className="text-xs">Logo</Badge>}
                {coverImage && <Badge variant="secondary" className="text-xs">Cover Image</Badge>}
                {filledGallery.length > 0 && <Badge variant="secondary" className="text-xs">{filledGallery.length} Gallery Image(s)</Badge>}
              </div>
              {(logo || coverImage || filledGallery.length > 0) && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {logo && (
                    <div className="w-14 h-14 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  {coverImage && (
                    <div className="w-20 h-14 rounded-lg border overflow-hidden">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  {filledGallery.slice(0, 3).map((img) => (
                    <div key={img.tempId} className="w-14 h-14 rounded-lg border overflow-hidden">
                      <img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  ))}
                  {filledGallery.length > 3 && (
                    <div className="w-14 h-14 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{filledGallery.length - 3}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Summary */}
        {(facebook || instagram || twitter || youtube || whatsapp || googleMaps) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" /> Social Media
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(3)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {facebook && <Badge variant="secondary" className="text-xs"><Facebook className="h-3 w-3 mr-1" />Facebook</Badge>}
                {instagram && <Badge variant="secondary" className="text-xs"><Instagram className="h-3 w-3 mr-1" />Instagram</Badge>}
                {twitter && <Badge variant="secondary" className="text-xs"><Twitter className="h-3 w-3 mr-1" />Twitter/X</Badge>}
                {youtube && <Badge variant="secondary" className="text-xs"><Youtube className="h-3 w-3 mr-1" />YouTube</Badge>}
                {whatsapp && <Badge variant="secondary" className="text-xs"><MessageCircle className="h-3 w-3 mr-1" />WhatsApp</Badge>}
                {googleMaps && <Badge variant="secondary" className="text-xs"><MapPinned className="h-3 w-3 mr-1" />Google Maps</Badge>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hours Summary */}
        {filledHours.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Opening Hours
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(4)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-1">
                {hours.map((h) => (
                  <div key={h.day} className="flex justify-between py-1">
                    <span className="text-muted-foreground">{DAY_NAMES[h.day]}</span>
                    <span className="font-medium">{h.isClosed ? 'Closed' : `${formatTime(h.openTime)} - ${formatTime(h.closeTime)}`}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Summary */}
        {filledProducts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Products & Services ({filledProducts.length})
                <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setCurrentStep(5)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filledProducts.map((p, i) => (
                  <div key={p.tempId} className="flex items-center gap-2 text-sm">
                    {p.type === 'SERVICE' ? <Wrench className="h-3.5 w-3.5 text-primary shrink-0" /> : <Package className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <span className="font-medium truncate">{p.name}</span>
                    {p.price && <span className="text-primary font-semibold text-xs ml-auto shrink-0">{p.price}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Review your changes above, then click "Save Changes" to update your listing.'
              : isAdmin
                ? 'Review the details above, then click "Create Business" to add it to the directory.'
                : 'Review your listing details above. Once submitted, it will be reviewed by an admin before going live.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Time Formatter ───────────────────────────────────────────

  function formatTime(time: string): string {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  // ─── Render ───────────────────────────────────────────────────

  const progressPercent = ((currentStep + 1) / 7) * 100;
  const isLastStep = currentStep === 6;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Business Listing' : 'Create Business Listing'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update your business information step by step'
              : 'Add your business to the directory in a few easy steps'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep + 1} of 7</span>
              <span className="text-sm text-muted-foreground">{STEP_INFO[currentStep].label}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {/* Step Dots */}
            <div className="flex items-center justify-between mt-3">
              {STEP_INFO.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      // Allow clicking on completed steps or current step
                      if (isDone || isActive) setCurrentStep(i);
                    }}
                    className={`flex flex-col items-center gap-1 transition-opacity ${
                      isDone || isActive ? 'opacity-100' : 'opacity-40'
                    } ${isDone ? 'cursor-pointer' : isActive ? '' : 'cursor-default'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] hidden sm:block ${isActive ? 'font-medium text-primary' : ''}`}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="min-w-[140px]"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : isEditing ? (
                  <><Check className="h-4 w-4 mr-2" /> Save Changes</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Submit Listing</>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep} className="min-w-[120px]">
                Next <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}