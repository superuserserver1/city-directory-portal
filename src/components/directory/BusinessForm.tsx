'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Building2, TreePine, Globe, Phone, Mail, MapPin, Link, Star } from 'lucide-react';
import type { Category, Locality, BusinessWithRelations } from '@/types';

interface BusinessFormProps {
  businessId?: string;
  onSuccess?: () => void;
  isAdmin?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function BusinessForm({ businessId, onSuccess, isAdmin = false }: BusinessFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'BUSINESS' | 'AMENITY'>('BUSINESS');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [rating, setRating] = useState('0');

  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!businessId;

  // Fetch categories and localities
  useEffect(() => {
    api.get<{ categories: Category[] }>('/api/categories')
      .then((r) => setCategories(r.categories || []))
      .catch(() => {});
    api.get<{ localities: Locality[] }>('/api/localities')
      .then((r) => setLocalities(r.localities || []))
      .catch(() => {});
  }, []);

  // Load existing business data for editing
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
      setCategoryId(b.categoryId);
      setLocalityId(b.localityId);
      setAddress(b.address || '');
      setPhone(b.phone || '');
      setEmail(b.email || '');
      setWebsite(b.website || '');
      setRating(String(b.rating || 0));
    } catch {
      toast.error('Failed to load business data');
    } finally {
      setLoadingData(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (!slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!localityId) {
      toast.error('Please select a locality');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
        type,
        description: description.trim() || undefined,
        categoryId,
        localityId,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
      };

      if (isAdmin) {
        payload.rating = parseFloat(rating) || 0;
      }

      if (isEditing) {
        await api.put(`/api/businesses/${businessId}`, payload);
        toast.success('Business updated successfully');
      } else {
        await api.post('/api/businesses', payload);
        toast.success('Business created successfully');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Business' : 'Add New Business'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update the business information below'
              : 'Fill in the details to list a new business'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-name">Business Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="biz-name"
                  placeholder="e.g. Sunrise Cafe"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-slug">Slug *</Label>
              <Input
                id="biz-slug"
                placeholder="sunrise-cafe"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-generated from name.</p>
            </div>

            {/* Type Toggle */}
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'BUSINESS' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setType('BUSINESS')}
                >
                  <Building2 className="h-4 w-4" />
                  Business
                </Button>
                <Button
                  type="button"
                  variant={type === 'AMENITY' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setType('AMENITY')}
                >
                  <TreePine className="h-4 w-4" />
                  Amenity
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-desc">Description</Label>
              <Textarea
                id="biz-desc"
                placeholder="Brief description of the business..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Category & Locality Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Locality *</Label>
                <Select value={localityId} onValueChange={setLocalityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select locality" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {localities.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="biz-address"
                  placeholder="123 Main Street, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Phone, Email, Website Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="biz-phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="biz-phone"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="biz-email"
                    type="email"
                    placeholder="info@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-website">Website</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="biz-website"
                  placeholder="https://www.business.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Rating (Admin Only) */}
            {isAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="biz-rating" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Rating (Admin)
                </Label>
                <Input
                  id="biz-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">Value between 0 and 5, step 0.1</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitting
                  ? isEditing ? 'Saving...' : 'Creating...'
                  : isEditing ? 'Save Changes' : 'Create Business'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}