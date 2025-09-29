'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageStep } from '@/types/survey';
import { getImageUrl } from '@/lib/data-processor';

interface ImageGalleryProps {
  images: ImageStep[];
  model: string;
  selectedBest?: number;
  selectedWorst?: number;
  onBestSelect?: (step: number) => void;
  onWorstSelect?: (step: number) => void;
  showSelectionMode?: boolean;
}

export function ImageGallery({
  images,
  model,
  selectedBest,
  selectedWorst,
  onBestSelect,
  onWorstSelect,
  showSelectionMode = false,
}: ImageGalleryProps) {
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set(images.map(img => img.step)));

  const handleImageLoad = (step: number) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  };

  const handleImageError = (step: number) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  };

  const handleImageClick = (step: number) => {
    if (!showSelectionMode) return;

    // If clicking on already selected best/worst, deselect it
    if (selectedBest === step && onBestSelect) {
      onBestSelect(-1);
      return;
    }
    if (selectedWorst === step && onWorstSelect) {
      onWorstSelect(-1);
      return;
    }

    // Smart selection logic
    if (selectedBest === undefined || selectedBest === -1) {
      onBestSelect?.(step);
    } else if (selectedWorst === undefined || selectedWorst === -1) {
      if (step !== selectedBest) {
        onWorstSelect?.(step);
      }
    } else {
      // Both are selected, replace the one that's not this step
      if (selectedBest !== step) {
        onBestSelect?.(step);
      } else if (selectedWorst !== step) {
        onWorstSelect?.(step);
      }
    }
  };

  const getCardClassName = (step: number) => {
    let className = "relative cursor-pointer transition-all duration-200 hover:shadow-lg";

    if (showSelectionMode) {
      if (selectedBest === step) {
        className += " ring-4 ring-emerald-400 shadow-lg shadow-emerald-200/50";
      } else if (selectedWorst === step) {
        className += " ring-4 ring-rose-300 shadow-lg shadow-rose-200/50";
      } else {
        className += " hover:ring-2 hover:ring-blue-300";
      }
    }

    return className;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card 
          key={image.step} 
          className={getCardClassName(image.step)}
          onClick={() => handleImageClick(image.step)}
        >
          <CardContent className="p-2">
            <div className="relative aspect-square mb-2">
              {loadingImages.has(image.step) && (
                <Skeleton className="absolute inset-0 rounded" />
              )}
              <Image
                src={getImageUrl(image.image_path, model)}
                alt={image.label}
                fill
                className={`object-cover rounded transition-opacity duration-300 ${
                  loadingImages.has(image.step) ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => handleImageLoad(image.step)}
                onError={() => handleImageError(image.step)}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              />
              
              {/* Selection badges */}
              {selectedBest === image.step && (
                <Badge className="absolute top-1 right-1 bg-emerald-400 text-white border-emerald-500">
                  Best
                </Badge>
              )}
              {selectedWorst === image.step && (
                <Badge className="absolute top-1 right-1 bg-rose-300 text-white border-rose-400">
                  Worst
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium">{image.label}</p>
              <p className="text-xs text-muted-foreground">Step {image.step}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
