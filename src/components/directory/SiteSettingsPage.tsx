'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import {
  Settings,
  MapPin,
  Paintbrush,
  MessageSquare,
  Globe,
  Palette,
  Type,
  Megaphone,
  Phone,
  Mail,
  Link2,
  ImageIcon,
  PanelBottom,
  Loader2,
  Save,
  Clock,
} from 'lucide-react';
import type { SiteSettings } from '@/types';

const DEFAULT_SETTINGS: Omit<
  SiteSettings,
  'id' | 'updatedAt' | 'createdAt'
> = {
  cityName: '',
  siteName: 'CityDir',
  tagline: '',
  heroTitle: 'Discover {city}',
  heroSubtitle: 'Your complete guide to businesses and services in {city}',
  heroCtaText: 'Browse Directory',
  contactEmail: null,
  contactPhone: null,
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  websiteUrl: null,
  footerText: '',
  copyrightText: '',
  primaryColor: '#0d9488',
  accentColor: '#f59e0b',
  logoUrl: null,
  faviconUrl: null,
};

export function SiteSettingsPage() {
  const { setSiteSettings } = useAppStore();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ settings: SiteSettings }>('/api/settings');
        const s = res.settings;
        setForm({
          cityName: s.cityName,
          siteName: s.siteName,
          tagline: s.tagline,
          heroTitle: s.heroTitle,
          heroSubtitle: s.heroSubtitle,
          heroCtaText: s.heroCtaText,
          contactEmail: s.contactEmail,
          contactPhone: s.contactPhone,
          facebookUrl: s.facebookUrl,
          instagramUrl: s.instagramUrl,
          twitterUrl: s.twitterUrl,
          websiteUrl: s.websiteUrl,
          footerText: s.footerText,
          copyrightText: s.copyrightText,
          primaryColor: s.primaryColor,
          accentColor: s.accentColor,
          logoUrl: s.logoUrl,
          faviconUrl: s.faviconUrl,
        });
        if (s.updatedAt) setLastUpdated(s.updatedAt);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  };

  const handleSave = async () => {
    if (!form.cityName.trim()) {
      toast.error('City Name is required');
      return;
    }
    if (!form.siteName.trim()) {
      toast.error('Site Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<{ settings: SiteSettings; message: string }>(
        '/api/settings',
        {
          cityName: form.cityName,
          siteName: form.siteName,
          tagline: form.tagline || '',
          heroTitle: form.heroTitle,
          heroSubtitle: form.heroSubtitle,
          heroCtaText: form.heroCtaText,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          facebookUrl: form.facebookUrl,
          instagramUrl: form.instagramUrl,
          twitterUrl: form.twitterUrl,
          websiteUrl: form.websiteUrl,
          footerText: form.footerText || '',
          copyrightText: form.copyrightText || '',
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
          logoUrl: form.logoUrl,
          faviconUrl: form.faviconUrl,
        }
      );
      setSiteSettings(res.settings);
      setLastUpdated(res.settings.updatedAt);
      toast.success(res.message || 'Settings saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            White-label Portal Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rebrand this directory portal for any city
          </p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            Last updated:{' '}
            {new Date(lastUpdated).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Accordion Sections */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Accordion
            type="multiple"
            defaultValue={['branding']}
            className="w-full"
          >
            {/* ===== City & Branding ===== */}
            <AccordionItem value="branding" className="border-b px-4 sm:px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">
                      City &amp; Branding
                    </span>
                    <p className="text-xs text-muted-foreground font-normal hidden sm:block">
                      Core identity for your directory portal
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1">
                <div className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="cityName">
                      City Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cityName"
                      value={form.cityName}
                      onChange={(e) => updateField('cityName', e.target.value)}
                      placeholder="e.g. San Francisco"
                    />
                    <p className="text-xs text-muted-foreground">
                      The primary city this directory serves
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="siteName">
                      Site Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="siteName"
                      value={form.siteName}
                      onChange={(e) => updateField('siteName', e.target.value)}
                      placeholder="CityDir"
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed in the header and browser tab. Default:
                      &quot;CityDir&quot;
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={form.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      placeholder="e.g. The city that never sleeps"
                    />
                    <p className="text-xs text-muted-foreground">
                      A short catchy phrase shown below the site name
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="copyrightText">Copyright Text</Label>
                    <Input
                      id="copyrightText"
                      value={form.copyrightText}
                      onChange={(e) =>
                        updateField('copyrightText', e.target.value)
                      }
                      placeholder="e.g. © 2025 CityName Directory. All rights reserved."
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown in the footer copyright notice
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ===== Hero Section ===== */}
            <AccordionItem value="hero" className="border-b px-4 sm:px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Hero Section</span>
                    <p className="text-xs text-muted-foreground font-normal hidden sm:block">
                      Homepage hero banner content
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1">
                <div className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="heroTitle">
                      <span className="flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        Hero Title
                      </span>
                    </Label>
                    <Input
                      id="heroTitle"
                      value={form.heroTitle}
                      onChange={(e) => updateField('heroTitle', e.target.value)}
                      placeholder="Discover {city}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        {'{city}'}
                      </code>{' '}
                      as a placeholder for the city name
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Input
                      id="heroSubtitle"
                      value={form.heroSubtitle}
                      onChange={(e) =>
                        updateField('heroSubtitle', e.target.value)
                      }
                      placeholder="Your complete guide to businesses and services in {city}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports the{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                        {'{city}'}
                      </code>{' '}
                      placeholder
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="heroCtaText">Hero CTA Button Text</Label>
                    <Input
                      id="heroCtaText"
                      value={form.heroCtaText}
                      onChange={(e) =>
                        updateField('heroCtaText', e.target.value)
                      }
                      placeholder="Browse Directory"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text displayed on the main call-to-action button
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ===== Contact & Social ===== */}
            <AccordionItem
              value="contact-social"
              className="border-b px-4 sm:px-6"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">
                      Contact &amp; Social
                    </span>
                    <p className="text-xs text-muted-foreground font-normal hidden sm:block">
                      Contact details and social media links
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1">
                <div className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        Contact Email
                      </span>
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={form.contactEmail || ''}
                      onChange={(e) =>
                        updateField('contactEmail', e.target.value)
                      }
                      placeholder="contact@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Public contact email displayed on the site
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        Contact Phone
                      </span>
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={form.contactPhone || ''}
                      onChange={(e) =>
                        updateField('contactPhone', e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-xs text-muted-foreground">
                      Public phone number for inquiries
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="websiteUrl">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          Website URL
                        </span>
                      </Label>
                      <Input
                        id="websiteUrl"
                        value={form.websiteUrl || ''}
                        onChange={(e) =>
                          updateField('websiteUrl', e.target.value)
                        }
                        placeholder="https://www.example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="facebookUrl">
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook URL
                        </span>
                      </Label>
                      <Input
                        id="facebookUrl"
                        value={form.facebookUrl || ''}
                        onChange={(e) =>
                          updateField('facebookUrl', e.target.value)
                        }
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="instagramUrl">
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                          Instagram URL
                        </span>
                      </Label>
                      <Input
                        id="instagramUrl"
                        value={form.instagramUrl || ''}
                        onChange={(e) =>
                          updateField('instagramUrl', e.target.value)
                        }
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="twitterUrl">
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          Twitter/X URL
                        </span>
                      </Label>
                      <Input
                        id="twitterUrl"
                        value={form.twitterUrl || ''}
                        onChange={(e) =>
                          updateField('twitterUrl', e.target.value)
                        }
                        placeholder="https://x.com/yourhandle"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ===== Appearance ===== */}
            <AccordionItem value="appearance" className="border-b px-4 sm:px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Appearance</span>
                    <p className="text-xs text-muted-foreground font-normal hidden sm:block">
                      Colors, logo, and visual branding
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1">
                <div className="space-y-5 max-w-xl">
                  {/* Primary Color */}
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">
                      <span className="flex items-center gap-1.5">
                        <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
                        Primary Color
                      </span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          id="primaryColorPicker"
                          type="color"
                          value={
                            isValidHex(form.primaryColor)
                              ? form.primaryColor
                              : '#0d9488'
                          }
                          onChange={(e) =>
                            updateField('primaryColor', e.target.value)
                          }
                          className="h-10 w-10 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                      <Input
                        id="primaryColor"
                        value={form.primaryColor}
                        onChange={(e) =>
                          updateField('primaryColor', e.target.value)
                        }
                        placeholder="#0d9488"
                        className="flex-1 font-mono"
                      />
                      {isValidHex(form.primaryColor) && (
                        <div
                          className="h-10 w-16 rounded-md border border-input shrink-0 shadow-sm"
                          style={{ backgroundColor: form.primaryColor }}
                          title={form.primaryColor}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Main brand color used for buttons, links, and accents
                    </p>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1.5">
                    <Label htmlFor="accentColor">
                      <span className="flex items-center gap-1.5">
                        <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
                        Accent Color
                      </span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          id="accentColorPicker"
                          type="color"
                          value={
                            isValidHex(form.accentColor)
                              ? form.accentColor
                              : '#f59e0b'
                          }
                          onChange={(e) =>
                            updateField('accentColor', e.target.value)
                          }
                          className="h-10 w-10 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                        />
                      </div>
                      <Input
                        id="accentColor"
                        value={form.accentColor}
                        onChange={(e) =>
                          updateField('accentColor', e.target.value)
                        }
                        placeholder="#f59e0b"
                        className="flex-1 font-mono"
                      />
                      {isValidHex(form.accentColor) && (
                        <div
                          className="h-10 w-16 rounded-md border border-input shrink-0 shadow-sm"
                          style={{ backgroundColor: form.accentColor }}
                          title={form.accentColor}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Secondary highlight color for badges and highlights
                    </p>
                  </div>

                  <Separator />

                  {/* Logo URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="logoUrl">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        Logo URL
                      </span>
                    </Label>
                    <Input
                      id="logoUrl"
                      value={form.logoUrl || ''}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Direct URL to your logo image. Recommended: SVG or PNG with
                      transparent background.
                    </p>
                  </div>

                  {/* Favicon URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="faviconUrl">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        Favicon URL
                      </span>
                    </Label>
                    <Input
                      id="faviconUrl"
                      value={form.faviconUrl || ''}
                      onChange={(e) =>
                        updateField('faviconUrl', e.target.value)
                      }
                      placeholder="https://example.com/favicon.ico"
                    />
                    <p className="text-xs text-muted-foreground">
                      Favicon shown in the browser tab. Recommended: 32x32 or
                      64x64 ICO/PNG.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ===== Footer ===== */}
            <AccordionItem value="footer" className="px-4 sm:px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                    <PanelBottom className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Footer</span>
                    <p className="text-xs text-muted-foreground font-normal hidden sm:block">
                      Footer description and information
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-1">
                <div className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="footerText">Footer Description Text</Label>
                    <Input
                      id="footerText"
                      value={form.footerText}
                      onChange={(e) =>
                        updateField('footerText', e.target.value)
                      }
                      placeholder="Your trusted local business directory since 2025"
                    />
                    <p className="text-xs text-muted-foreground">
                      Descriptive text displayed in the site footer area
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !form.cityName.trim() || !form.siteName.trim()}
          className="gap-2 shadow-md min-w-[140px]"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}