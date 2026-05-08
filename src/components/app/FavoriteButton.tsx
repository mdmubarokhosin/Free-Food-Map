'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  spotId: string;
  showCount?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function FavoriteButton({
  spotId,
  showCount = false,
  variant = 'ghost',
  size = 'icon',
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const isFav = isFavorite(spotId);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleFavorite(spotId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            className={cn(
              'relative overflow-hidden',
              isFav && 'text-red-500 hover:text-red-600',
              className
            )}
            aria-label={isFav ? 'পছন্দ থেকে সরান' : 'পছন্দে যোগ করুন'}
          >
            <i className={`bi ${isFav ? 'bi-heart-fill' : 'bi-heart'} text-sm transition-all duration-300 ${isAnimating && 'scale-125'}`}></i>
            {showCount && (
              <span className="ml-1 text-xs font-medium">{favoritesCount}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFav ? 'পছন্দ থেকে সরান' : 'পছন্দে যোগ করুন'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// A separate component to display favorites count
interface FavoritesCountProps {
  className?: string;
}

export function FavoritesCount({ className }: FavoritesCountProps) {
  const { favoritesCount } = useFavorites();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <i className="bi bi-heart-fill text-red-500 text-sm"></i>
      <span className="text-sm font-medium">{favoritesCount}</span>
    </div>
  );
}
