'use client';

import { useAppStore } from '@/store/app-store';
import { MapPin, Phone, Mail, Heart, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const { setView, categories, localities, siteSettings } = useAppStore();
  const siteName = siteSettings?.siteName || 'CityDir';
  const cityName = siteSettings?.cityName || 'the city';
  const copyrightText = siteSettings?.copyrightText || 'CityDir';
  const footerText = siteSettings?.footerText || 'Your complete city directory. Discover businesses, amenities, and services all in one place.';
  const contactEmail = siteSettings?.contactEmail || 'info@citydir.com';
  const contactPhone = siteSettings?.contactPhone || '+91 98765 43210';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-foreground text-background/90 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                {siteName.length > 3 ? (<>{siteName.substring(0, siteName.length - 3)}<span className="text-primary">{siteName.slice(-3)}</span></>) : (<span className="text-primary">{siteName}</span>)}
              </span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed mb-4 max-w-xs">
              {footerText}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-background/50">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{contactPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-background/50">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Categories Column */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Categories</h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setView('browse', undefined, cat.id)}
                    className="text-sm text-background/55 hover:text-primary transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              {categories.length > 6 && (
                <li>
                  <button
                    onClick={() => setView('browse', undefined, null, null)}
                    className="text-sm text-primary/70 hover:text-primary transition-colors font-medium"
                  >
                    View all →
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Localities Column */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Localities</h3>
            <ul className="space-y-2.5">
              {localities.slice(0, 6).map((loc) => (
                <li key={loc.id}>
                  <button
                    onClick={() => setView('browse', undefined, undefined, loc.id)}
                    className="text-sm text-background/55 hover:text-primary transition-colors text-left"
                  >
                    {loc.name}
                  </button>
                </li>
              ))}
              {localities.length > 6 && (
                <li>
                  <button
                    onClick={() => setView('browse', undefined, null, null)}
                    className="text-sm text-primary/70 hover:text-primary transition-colors font-medium"
                  >
                    View all →
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-background/80">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => setView('home')} className="text-sm text-background/55 hover:text-primary transition-colors text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setView('browse', undefined, null, null)} className="text-sm text-background/55 hover:text-primary transition-colors text-left">
                  Browse All
                </button>
              </li>
              <li>
                <button onClick={() => setView('register')} className="text-sm text-background/55 hover:text-primary transition-colors text-left">
                  List Your Business
                </button>
              </li>
              <li>
                <button onClick={() => setView('login')} className="text-sm text-background/55 hover:text-primary transition-colors text-left">
                  Login / Register
                </button>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} {copyrightText}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-background/40 flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for {cityName}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-background/40 hover:text-background/80 hover:bg-background/10"
              onClick={scrollToTop}
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}