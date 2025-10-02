'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Info } from 'lucide-react';
import { AttributionQuestion, AttributionResponse } from '@/types/survey';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AttributionEvaluationProps {
  question: AttributionQuestion;
  onNext: (response: Omit<AttributionResponse, 'timestamp'>) => Promise<void>;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  initialResponse?: Omit<AttributionResponse, 'timestamp'>;
}

// Rating options
const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];

interface StepRating {
  step: number;
  prompt: string;
  flux_url: string;
  qwen_url: string;
  flux_prompt_alignment: number;
  flux_cultural_representation: number;
  flux_image_quality: number;
  qwen_prompt_alignment: number;
  qwen_cultural_representation: number;
  qwen_image_quality: number;
}

export function AttributionEvaluation({
  question,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  initialResponse,
}: AttributionEvaluationProps) {
  // Individual ratings for each step
  const [stepRatings, setStepRatings] = useState<Record<number, StepRating>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set(question.steps?.map(step => step.step) || []));

  // Initialize ratings for each step
  useEffect(() => {
    console.log('AttributionEvaluation initialResponse:', initialResponse);
    console.log('Question ID:', question.id);

    const initialRatings: Record<number, StepRating> = {};

    // If we have initial response, use those
    if (initialResponse && initialResponse.step_responses) {
      Object.entries(initialResponse.step_responses).forEach(([step, rating]) => {
        initialRatings[Number(step)] = rating;
      });
    } else {
      // Default ratings
      question.steps?.forEach((step) => {
        initialRatings[step.step] = {
          step: step.step,
          prompt: step.prompt,
          flux_url: step.flux_url,
          qwen_url: step.qwen_url,
          flux_prompt_alignment: 3,
          flux_cultural_representation: 3,
          flux_image_quality: 3,
          qwen_prompt_alignment: 3,
          qwen_cultural_representation: 3,
          qwen_image_quality: 3,
        };
      });
    }

    setStepRatings(initialRatings);
    setStartTime(Date.now());

    // Reset loading states for new images
    if (question.steps) {
      setLoadingImages(new Set(question.steps.map(step => step.step)));
    }
  }, [question.id, question.steps, initialResponse]);

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

  const updateStepRating = (step: number, field: 'flux_prompt_alignment' | 'flux_cultural_representation' | 'flux_image_quality' | 'qwen_prompt_alignment' | 'qwen_cultural_representation' | 'qwen_image_quality', value: number) => {
    setStepRatings(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      }
    }));
  };

  const validateResponse = () => {
    // Check if all steps have been rated for both models
    const allStepsRated = question.steps?.every(step =>
      stepRatings[step.step]?.flux_prompt_alignment !== undefined &&
      stepRatings[step.step]?.flux_cultural_representation !== undefined &&
      stepRatings[step.step]?.flux_image_quality !== undefined &&
      stepRatings[step.step]?.qwen_prompt_alignment !== undefined &&
      stepRatings[step.step]?.qwen_cultural_representation !== undefined &&
      stepRatings[step.step]?.qwen_image_quality !== undefined
    );

    if (!allStepsRated) {
      toast.error('Please rate all images for both models before submitting');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponse()) return;

    setIsSubmitting(true);
    const completionTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    const stepResponses: Record<number, {
      step: number;
      prompt: string;
      flux_url: string;
      qwen_url: string;
      flux_prompt_alignment: number;
      flux_cultural_representation: number;
      flux_image_quality: number;
      qwen_prompt_alignment: number;
      qwen_cultural_representation: number;
      qwen_image_quality: number;
    }> = {};

    question.steps?.forEach(step => {
      const rating = stepRatings[step.step];
      if (rating) {
        stepResponses[step.step] = {
          step: step.step,
          prompt: step.prompt,
          flux_url: step.flux_url,
          qwen_url: step.qwen_url,
          flux_prompt_alignment: rating.flux_prompt_alignment,
          flux_cultural_representation: rating.flux_cultural_representation,
          flux_image_quality: rating.flux_image_quality,
          qwen_prompt_alignment: rating.qwen_prompt_alignment,
          qwen_cultural_representation: rating.qwen_cultural_representation,
          qwen_image_quality: rating.qwen_image_quality,
        };
      }
    });

    const response: Omit<AttributionResponse, 'timestamp'> = {
      question_id: question.id || '',
      user_id: '', // Will be set in the handler
      country: question.country,
      base_image: question.base_image,
      step_responses: stepResponses,
      completion_time_seconds: completionTimeSeconds,
    };

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border border-gray-200 shadow-lg bg-white rounded-xl">
        {/* Header */}
        <CardHeader className="bg-white border-b border-gray-200 pb-6">
          <div className="space-y-6">
            <div className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Attribution Evaluation
              </CardTitle>
              <div className="text-lg text-gray-600 font-medium">
                {question.country}
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-3">Base Image</div>
                <div className="relative">
                  <Image
                    src={question.base_image}
                    alt="Base Image"
                    width={150}
                    height={150}
                    className="rounded-xl border-2 border-gray-200 object-contain bg-gray-50 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-3">Experiment Type</div>
                <div className="bg-gray-50 rounded-lg px-6 py-4 border border-gray-200 max-w-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      <span className="text-sm font-semibold text-gray-800">Attribute addition</span>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">
                      Evaluate how well each prompt adds cultural attributes to the base image
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          {/* Images Grid */}
          {!question.steps || question.steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No images available for this evaluation.
            </div>
          ) : (
            <div className="space-y-12">
              {question.steps.map((step) => {
                const rating = stepRatings[step.step];

                return (
                  <div key={step.step} className="space-y-6">
                    {/* Step Header */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {step.step}
                        </div>
                        <div className="text-2xl font-semibold text-gray-800">
                          Prompt {step.step}
                        </div>
                      </div>
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                            <div className="text-gray-800 leading-relaxed font-medium text-base">
                              {step.prompt}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Model Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Flux Model */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-800">FLUX.1 Kontext [dev]</h3>
                          </div>
                        </div>
                        
                        {/* Flux Image */}
                        <div className="relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.01] mb-6">
                          {loadingImages.has(step.step) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
                          )}
                          <Image
                            src={step.flux_url.trim()}
                            alt={`Flux Step ${step.step}`}
                            width={400}
                            height={400}
                            unoptimized
                            className={`w-full h-64 object-contain bg-gray-100 transition-all duration-300 ease-in-out transform ${
                              loadingImages.has(step.step)
                                ? 'opacity-0 scale-95'
                                : 'opacity-100 scale-100'
                            }`}
                            onLoad={() => handleImageLoad(step.step)}
                            onError={() => handleImageError(step.step)}
                          />
                        </div>

                        {/* Flux Ratings */}
                        <div className="space-y-6">
                          {/* Prompt Alignment Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Prompt Alignment</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How well does the image reflect the prompt?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.flux_prompt_alignment ? RATING_LABELS[rating.flux_prompt_alignment - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`flux-prompt-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.flux_prompt_alignment === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'flux_prompt_alignment', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Image Quality Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Image Quality</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How good is the overall image quality?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.flux_image_quality ? RATING_LABELS[rating.flux_image_quality - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`flux-quality-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.flux_image_quality === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'flux_image_quality', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Cultural Representation Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Cultural Representation</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How well does the image represent the culture?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.flux_cultural_representation ? RATING_LABELS[rating.flux_cultural_representation - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`flux-cultural-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.flux_cultural_representation === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'flux_cultural_representation', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Qwen Model */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-800">Qwen-Image-Edit</h3>
                          </div>
                        </div>
                        
                        {/* Qwen Image */}
                        <div className="relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.01] mb-6">
                          {loadingImages.has(step.step) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
                          )}
                          <Image
                            src={step.qwen_url.trim()}
                            alt={`Qwen Step ${step.step}`}
                            width={400}
                            height={400}
                            unoptimized
                            className={`w-full h-64 object-contain bg-gray-100 transition-all duration-300 ease-in-out transform ${
                              loadingImages.has(step.step)
                                ? 'opacity-0 scale-95'
                                : 'opacity-100 scale-100'
                            }`}
                            onLoad={() => handleImageLoad(step.step)}
                            onError={() => handleImageError(step.step)}
                          />
                        </div>

                        {/* Qwen Ratings */}
                        <div className="space-y-6">
                          {/* Prompt Alignment Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Prompt Alignment</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How well does the image reflect the prompt?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.qwen_prompt_alignment ? RATING_LABELS[rating.qwen_prompt_alignment - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`qwen-prompt-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.qwen_prompt_alignment === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'qwen_prompt_alignment', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Image Quality Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Image Quality</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How good is the overall image quality?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.qwen_image_quality ? RATING_LABELS[rating.qwen_image_quality - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`qwen-quality-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.qwen_image_quality === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'qwen_image_quality', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Cultural Representation Rating */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-semibold text-gray-800">Cultural Representation</Label>
                                <div className="relative group">
                                  <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                    How well does the image represent the culture?
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded-full border">
                                {rating?.qwen_cultural_representation ? RATING_LABELS[rating.qwen_cultural_representation - 1] : 'Fair'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {RATINGS.map((score) => (
                                <Button
                                  key={`qwen-cultural-${step.step}-${score}`}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "w-10 h-10 p-0 text-sm font-bold transition-all duration-200 rounded-lg",
                                    rating?.qwen_cultural_representation === score
                                      ? "bg-gray-800 text-white border-gray-800 shadow-md hover:bg-gray-900"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                  )}
                                  onClick={() => updateStepRating(step.step, 'qwen_cultural_representation', score)}
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst || isSubmitting}
              className="flex items-center gap-2"
            >
              
            </Button>



            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingImages.size > 0}
              className={cn(
                "flex items-center gap-3 px-8 py-4 text-lg font-semibold transition-all duration-300 rounded-lg",
                isSubmitting || loadingImages.size > 0
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-gray-900 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>{isLast ? 'Finish Evaluation' : 'Next Question'}</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
