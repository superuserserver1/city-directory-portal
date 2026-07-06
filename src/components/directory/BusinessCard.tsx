'use client';

import { useAppStore } from '@/store/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle2, MapPin, Phone, ArrowRight } from 'lucide-react';
import type { BusinessWithRelations } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  BUSINESS: 'bg-primary/10 text-primary border-primary/20',
  AMENITY: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
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
  const { setView } = useAppStore();

  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 flex flex-col"
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
            <Badge className="bg-amber-500 text-white text-[10px] border-0">⭐ Featured</Badge>
          </div>
        )}
        {/* Business initial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 text-6xl font-black">{business.name.charAt(0)}</span>
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

        <div className="flex items-center gap-3 mt-auto pt-2">
          {business.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{business.rating.toFixed(1)}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="truncate">{business.phone}</span>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
          View Details <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}