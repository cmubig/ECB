'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  currentImageKey?: string;
}

export function ImageGallery({
  images,
  model,
  selectedBest,
  selectedWorst,
  onBestSelect,
  onWorstSelect,
  showSelectionMode = false,
  currentImageKey,
}: ImageGalleryProps) {
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set(images.map(img => img.step)));
  const imageKey = currentImageKey || `gallery-${Date.now()}`;

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

    // Add a small delay for smoother visual feedback
    setTimeout(() => {
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
    }, 100); // Small delay for visual feedback
  };

  const getCardClassName = (step: number) => {
    let className = "relative cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]";

    if (showSelectionMode) {
      if (selectedBest === step) {
        className += " ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/60 scale-[1.03] bg-emerald-50/30";
      } else if (selectedWorst === step) {
        className += " ring-4 ring-rose-300 shadow-2xl shadow-rose-200/60 scale-[1.03] bg-rose-50/30";
      } else {
        className += " hover:ring-2 hover:ring-blue-300 hover:shadow-lg";
      }
    }

    return className;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card
          key={`${image.step}-${imageKey}`}
          className={getCardClassName(image.step)}
          onClick={() => handleImageClick(image.step)}
        >
          <CardContent className="p-2">
            <div className="relative aspect-square mb-2 overflow-hidden rounded-lg">
              {/* Enhanced loading skeleton with shimmer effect */}
              {loadingImages.has(image.step) && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
              )}

              {/* Image with smooth transitions */}
              <Image
                key={`${image.step}-${imageKey}`}
                src={getImageUrl(image.image_path, model)}
                alt={image.label}
                fill
                unoptimized
                className={`object-cover transition-all duration-300 ease-in-out transform ${
                  loadingImages.has(image.step)
                    ? 'opacity-0 scale-95'
                    : 'opacity-100 scale-100'
                } ${
                  selectedBest === image.step || selectedWorst === image.step
                    ? 'scale-105'
                    : 'hover:scale-105'
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
