'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SurveyQuestion as SurveyQuestionType, SurveyResponse } from '@/types/survey';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SurveyQuestionProps {
  question: SurveyQuestionType;
  onNext: (response: Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'>) => Promise<void>;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  initialResponse?: Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'>;
  loading: boolean;
}

// Rating options
const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
const RATING_COLORS = ['bg-gray-600', 'bg-gray-500', 'bg-gray-400', 'bg-gray-700', 'bg-gray-800'];

interface ImageRating {
  step: number;
  promptAlignment: number;
  culturalRepresentative: number;
}

export function SurveyQuestion({
  question,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  initialResponse,
  loading,
}: SurveyQuestionProps) {
  // Individual ratings for each image
  const [imageRatings, setImageRatings] = useState<Record<number, ImageRating>>({});
  const [bestStep, setBestStep] = useState<number | null>(initialResponse?.best_step || null);
  const [worstStep, setWorstStep] = useState<number | null>(initialResponse?.worst_step || null);
  const [comments, setComments] = useState(initialResponse?.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set(question.images?.map(img => img.step) || []));

  // Initialize ratings for each image
  useEffect(() => {
    console.log('SurveyQuestion initialResponse:', initialResponse);
    console.log('Question ID:', question.id);
    
    const initialRatings: Record<number, ImageRating> = {};
    
    // If we have initial response with imageRatings, use those
    if (initialResponse && (initialResponse as any).imageRatings) {
      const savedRatings = (initialResponse as any).imageRatings;
      question.images?.forEach((img) => {
        initialRatings[img.step] = savedRatings[img.step] || {
          step: img.step,
          promptAlignment: 3,
          culturalRepresentative: 3,
        };
      });
    } else {
      // Default ratings
      question.images?.forEach((img) => {
        initialRatings[img.step] = {
          step: img.step,
          promptAlignment: 3,
          culturalRepresentative: 3,
        };
      });
    }
    
    setImageRatings(initialRatings);
    
    // Debug best/worst step restoration
    console.log('Restoring best_step:', initialResponse?.best_step);
    console.log('Restoring worst_step:', initialResponse?.worst_step);
    
    setBestStep(initialResponse?.best_step ?? null);
    setWorstStep(initialResponse?.worst_step ?? null);
    setComments(initialResponse?.comments || '');
    setStartTime(Date.now());
  }, [question.id, question.images, initialResponse]);

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

  const handleBestSelect = (step: number) => {
    setBestStep(step);
    if (worstStep === step) {
      setWorstStep(null);
    }
  };

  const handleWorstSelect = (step: number) => {
    setWorstStep(step);
    if (bestStep === step) {
      setBestStep(null);
    }
  };

  const updateImageRating = (step: number, field: 'promptAlignment' | 'culturalRepresentative', value: number) => {
    setImageRatings(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      }
    }));
  };

  const validateResponse = () => {
    if (bestStep === null || worstStep === null) {
      toast.error('Please select both best and worst images');
      return false;
    }
    if (bestStep === worstStep) {
      toast.error('Best and worst images must be different');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponse()) return;
    
    setIsSubmitting(true);
    const completionTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    // Calculate average scores (for backward compatibility)
    const avgPromptAlignment = Object.values(imageRatings).reduce((sum, rating) => sum + rating.promptAlignment, 0) / Object.values(imageRatings).length;
    const avgCulturalRepresentative = Object.values(imageRatings).reduce((sum, rating) => sum + rating.culturalRepresentative, 0) / Object.values(imageRatings).length;

    const response: Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'> = {
      question_id: question.id || '',
      user_id: '', // Will be set in the handler
      model: question.model || '',
      country: question.country || '',
      category: question.category || '',
      sub_category: question.sub_category || '',
      variant: question.variant || '',
      prompt: question.prompt || '',
      editing_prompt: question.editing_prompt || '',
      image_urls: question.images?.map(img => img.url) || [],
      prompt_alignment: Math.round(avgPromptAlignment),
      cultural_representative: Math.round(avgCulturalRepresentative),
      best_step: bestStep!,
      worst_step: worstStep!,
      comments,
      completion_time_seconds: completionTimeSeconds,
      // Add individual image ratings for processing
      imageRatings: imageRatings,
    } as any;

    try {
      await onNext(response);
      toast.success('Response saved!');
    } catch (error) {
      toast.error('Failed to save response');
      console.error('Error saving response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="border-gray-200 shadow-none">
        {/* Header */}
        <CardHeader className="pb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-3">
                {question.category || 'Unknown'} - {question.sub_category || 'Unknown'}
                {question.variant && ` (${question.variant})`}
              </CardTitle>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>Original Prompt:</strong> {question.prompt || 'No prompt available'}</div>
                {question.editing_prompt && (
                  <div><strong>Editing Instruction:</strong> {question.editing_prompt}</div>
                )}
              </div>
            </div>
            <Badge variant="outline" className="ml-4">
              {question.model?.toUpperCase() || 'Unknown Model'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Images Grid */}
          {!question.images || question.images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No images available for this question.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {question.images.map((img, index) => {
                const rating = imageRatings[img.step];
                
                return (
                  <div key={img.step} className="space-y-4">
                    {/* Image */}
                    <div className={cn(
                      "relative border-2 rounded-lg overflow-hidden transition-all",
                      bestStep === img.step ? "border-emerald-400 ring-4 ring-emerald-200 shadow-lg shadow-emerald-100/50" :
                      worstStep === img.step ? "border-rose-300 ring-4 ring-rose-200 shadow-lg shadow-rose-100/50" :
                      "border-gray-200"
                    )}>
                      {loadingImages.has(img.step) && (
                        <Skeleton className="absolute inset-0" />
                      )}
                      <Image
                        src={img.url}
                        alt={`Image ${index + 1}`}
                        width={300}
                        height={300}
                        className={`w-full h-48 object-cover transition-opacity duration-300 ${
                          loadingImages.has(img.step) ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => handleImageLoad(img.step)}
                        onError={() => handleImageError(img.step)}
                      />
                      
                      {/* Image number */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-white/90">
                          Image {index + 1}
                        </Badge>
                      </div>
                      
                      
                      {/* Best/Worst indicator */}
                      {bestStep === img.step && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-emerald-400 text-white text-xs border-emerald-500">
                            👍 BEST
                          </Badge>
                        </div>
                      )}
                      {worstStep === img.step && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-rose-300 text-white text-xs border-rose-400">
                            👎 WORST
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Prompt Alignment Rating */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700">Prompt Alignment</Label>
                        <span className="text-xs text-gray-500 font-medium">
                          {rating?.promptAlignment ? RATING_LABELS[rating.promptAlignment - 1] : 'Fair'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {RATINGS.map((score) => (
                          <Button
                            key={`prompt-${img.step}-${score}`}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-8 h-8 p-0 text-xs font-medium transition-all",
                              rating?.promptAlignment === score
                                ? `${RATING_COLORS[score - 1]} text-white border-transparent hover:opacity-90`
                                : "border-gray-300 text-gray-600 hover:bg-gray-50"
                            )}
                            onClick={() => updateImageRating(img.step, 'promptAlignment', score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Cultural Representation Rating */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700">Cultural Representation</Label>
                        <span className="text-xs text-gray-500 font-medium">
                          {rating?.culturalRepresentative ? RATING_LABELS[rating.culturalRepresentative - 1] : 'Fair'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {RATINGS.map((score) => (
                          <Button
                            key={`cultural-${img.step}-${score}`}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-8 h-8 p-0 text-xs font-medium transition-all",
                              rating?.culturalRepresentative === score
                                ? `${RATING_COLORS[score - 1]} text-white border-transparent hover:opacity-90`
                                : "border-gray-300 text-gray-600 hover:bg-gray-50"
                            )}
                            onClick={() => updateImageRating(img.step, 'culturalRepresentative', score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Best/Worst Selection */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-center text-gray-800">
              Which image do you like most and least?
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Best Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-medium">Best</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {question.images?.map((img, index) => (
                    <Button
                      key={`best-${img.step}`}
                      variant={bestStep === img.step ? "default" : "outline"}
                      className={cn(
                        "h-12 transition-all",
                        bestStep === img.step 
                          ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-900 shadow-md" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => handleBestSelect(img.step)}
                    >
                      Image {index + 1}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Worst Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-medium">Worst</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {question.images?.map((img, index) => (
                    <Button
                      key={`worst-${img.step}`}
                      variant={worstStep === img.step ? "default" : "outline"}
                      className={cn(
                        "h-12 transition-all",
                        worstStep === img.step 
                          ? "bg-gray-600 text-white border-gray-600 hover:bg-gray-700 shadow-md" 
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      )}
                      onClick={() => handleWorstSelect(img.step)}
                      disabled={bestStep === img.step}
                    >
                      Image {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selection Status */}
            {(bestStep !== null || worstStep !== null) && (
              <div className="text-center text-sm text-gray-600 bg-white p-3 rounded border">
                {bestStep !== null && worstStep !== null ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="text-gray-700 font-medium hover:text-gray-800 cursor-pointer transition-colors"
                  >
                    ✓ Ready to submit! Click here to continue
                  </button>
                ) : (
                  <span>Please select both best and worst images</span>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Additional Comments (Optional)</Label>
            <Textarea
              placeholder="Any specific observations about the images or cultural representation..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst || isSubmitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              <div>Rate each image individually, then select overall best and worst</div>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || bestStep === null || worstStep === null}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isLast ? 'Finish Survey' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}