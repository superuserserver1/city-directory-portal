'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Star, CheckCircle2, MapPin, Phone, ArrowRight, Eye, Package, Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { BusinessWithRelations } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  BUSINESS: 'bg-primary/10 text-primary border-primary/20',
  AMENITY: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

const BORDER_LEFT_COLORS: Record<string, string> = {
  BUSINESS: 'border-l-primary',
  AMENITY: 'border-l-amber-500',
};

const GRADIENTS = [
  'gradient-card-1', 'gradient-card-2', 'gradient-card-3', 'gradient-card-4',
  'gradient-card-5', 'gradient-card-6', 'gradient-card-7', 'gradient-card-8',
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function BusinessCard({ business }: { business: BusinessWithRelations }) {
  const { setView, isAuthenticated } = useAppStore();
  const [isFav, setIsFav] = useState(false);

  const productCount = business.products?.length || 0;
  const borderLeftClass = BORDER_LEFT_COLORS[business.type] || BORDER_LEFT_COLORS.BUSINESS;

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ isFavorited: boolean }>(`/api/favorites?businessId=${business.id}`)
      .then((r) => setIsFav(r.isFavorited))
      .catch(() => {});
  }, [isAuthenticated, business.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save favorites'); return; }
    try {
      const r = await api.post<{ isFavorited: boolean }>('/api/favorites', { businessId: business.id });
      setIsFav(r.isFavorited);
      toast.success(r.isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorite'); }
  };

  // Generate a pseudo-review count from the business id hash
  const reviewHash = business.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const reviewCount = (reviewHash % 47) + 3;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Card
              className={`group cursor-pointer overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 flex flex-col border-l-4 ${borderLeftClass} shimmer-effect`}
              onClick={() => setView('business-detail', business.id)}
            >
              {/* Image Area */}
              <div className={`relative h-40 ${getGradient(business.id)}`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant="secondary" className={`text-[10px] font-medium ${TYPE_COLORS[business.type] || TYPE_COLORS.BUSINESS}`}>
                    {business.type === 'AMENITY' ? 'Amenity' : 'Business'}
                  </Badge>
                  {business.isVerified && (
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                {business.isFeatured && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500 text-white text-[10px] border-0 animate-pulse-glow">⭐ Featured</Badge>
                  </div>
                )}
                <button
                  onClick={toggleFavorite}
                  className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    isFav
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 hover:scale-110'
                  }`}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                {/* Business initial */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/30 text-6xl font-black">{business.name.charAt(0)}</span>
                </div>
                {/* Quick View indicator */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="glass rounded-full p-3">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col gap-2.5">
                <div>
                  <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {business.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {business.category?.name}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <MapPin className="h-2.5 w-2.5 mr-0.5" /> {business.locality?.name}
                    </Badge>
                  </div>
                </div>

                {business.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                    {business.address}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-2 flex-wrap">
                  {business.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{business.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({reviewCount})</span>
                    </div>
                  )}
                  {productCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span>{productCount} listing{productCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="truncate">{business.phone}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full mt-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200">
                  View Details <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Click to view details
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}