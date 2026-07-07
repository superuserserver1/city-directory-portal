'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ArrowLeft, MapPin, Trash2, Compass, Star } from 'lucide-react';
import type { BusinessWithRelations } from '@/types';
import { BusinessCard } from './BusinessCard';

interface FavoriteWithBusiness {
  id: string;
  createdAt: string;
  business: BusinessWithRelations;
}

export function FavoritesPage() {
  const { setView, isAuthenticated } = useAppStore();
  const [favorites, setFavorites] = useState<FavoriteWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setView('login'); return; }
    api.get<{ favorites: FavoriteWithBusiness[] }>('/api/favorites')
      .then((r) => setFavorites(r.favorites || []))
      .catch(() => toast.error('Failed to load favorites'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const removeFavorite = async (businessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/api/favorites', { businessId });
      setFavorites((prev) => prev.filter((f) => f.businessId !== businessId));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white mb-6">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Heart className="h-7 w-7 fill-red-400 text-red-400" /> My Favorites
            </h1>
          </div>
          <p className="text-white/70">Businesses and places you&apos;ve saved for later.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start exploring and tap the heart icon on any business to save it here.
            </p>
            <Button onClick={() => setView('browse')}>
              <Compass className="h-4 w-4 mr-2" /> Browse Directory
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{favorites.length} saved place{favorites.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
              {favorites.map((fav) => (
                <div key={fav.id} className="relative group">
                  <BusinessCard business={fav.business} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-12 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                    onClick={(e) => removeFavorite(fav.businessId, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}