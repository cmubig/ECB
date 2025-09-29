'use client';

import { useState, useEffect } from 'react';
import { useSingleModelSurveyData } from '@/hooks/useSingleModelSurveyData';
import { SurveyQuestion } from './SurveyQuestion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { saveSurveyResponse, saveStepResponses } from '@/lib/firestore';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { SurveyResponse, StepResponse } from '@/types/survey';

interface ModelSurveyProps {
  model: string;
  country: string;
}

export function ModelSurvey({ model, country }: ModelSurveyProps) {
  const { user } = useAuth();
  const {
    currentQuestion,
    currentQuestionIndex,
    loading,
    error,
    totalQuestions,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion,
    isLastQuestion,
    initialResponseForCurrentQuestion,
  } = useSingleModelSurveyData(model, country);

  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [currentImageKey, setCurrentImageKey] = useState<string>(`question-${currentQuestion?.id || 'default'}-${Date.now()}`);

  // Update image key when question changes to force re-render
  useEffect(() => {
    if (currentQuestion?.id) {
      setCurrentImageKey(`question-${currentQuestion.id}-${Date.now()}`);
    }
  }, [currentQuestion?.id]);

  const handleNextQuestion = async (response: Omit<SurveyResponse, 'timestamp'>) => {
    if (!user?.uid) {
      toast.error('Authentication Error', { description: 'You must be logged in to submit responses.' });
      return;
    }
    setIsSubmittingResponse(true);
    try {
      // Create step responses for detailed analysis
      const imageRatings = response.imageRatings;
      if (imageRatings && currentQuestion) {
        const stepResponses: Omit<StepResponse, 'timestamp'>[] = currentQuestion.images.map((img) => {
          const rating = imageRatings[img.step];
          const stepName = img.step === 0 ? 'step0' : `step${img.step}`;
          
          return {
            uid: `${response.model}_${response.country}_${response.category}_${response.sub_category}_${response.variant}::${stepName}`,
            group_id: `${response.model}_${response.country}_${response.category}_${response.sub_category}_${response.variant}`,
            step: stepName,
            user_id: user.uid,
            model: response.model,
            country: response.country,
            category: response.category,
            sub_category: response.sub_category,
            variant: response.variant,
            prompt: response.prompt,
            editing_prompt: response.editing_prompt,
            image_url: img.url,
            prompt_alignment: rating?.promptAlignment || 3,
            cultural_representative: rating?.culturalRepresentative || 3,
            is_best: response.best_step === img.step,
            is_worst: response.worst_step === img.step,
            comments: response.comments,
            completion_time_seconds: response.completion_time_seconds,
          };
        });
        
        // Save both summary response and detailed step responses
        await Promise.all([
          saveSurveyResponse({ ...response, user_id: user.uid }),
          saveStepResponses(stepResponses)
        ]);
      } else {
        await saveSurveyResponse({ ...response, user_id: user.uid });
      }
      
      await goToNextQuestion(response);
      toast.success('Response saved!', { description: 'Moving to the next question.' });
    } catch (err) {
      console.error('Error saving response:', err);
      toast.error('Failed to save response.', { description: (err as Error).message });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-6 py-12">
        <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="text-4xl mb-4">📋</div>
            <CardTitle className="text-xl text-orange-800">
              {model.toUpperCase()} Data Not Available
            </CardTitle>
            <CardDescription className="text-orange-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-orange-700">
              This model might be coming soon! Try evaluating other models in the meantime.
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="text-center space-y-6 py-12">
        <Card className="w-full max-w-2xl mx-auto border-gray-200">
          <CardHeader>
            <div className="text-4xl mb-4">🤔</div>
            <CardTitle className="text-xl text-gray-800">
              No Questions for {country}
            </CardTitle>
            <CardDescription className="text-gray-600">
              There are no survey questions for {model.toUpperCase()} in {country} yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Try selecting a different country or check back later for more content.
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentQuestionIndex >= totalQuestions) {
    return (
      <div className="text-center space-y-6">
        <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50">
          <CardHeader>
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl text-green-800">
              {model.toUpperCase()} Survey Completed!
            </CardTitle>
            <CardDescription className="text-green-700">
              Excellent work! You&apos;ve evaluated all {totalQuestions} questions for {model.toUpperCase()} in {country}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Badge className="text-lg px-4 py-2 bg-green-600 hover:bg-green-700">
                ✓ {totalQuestions} Questions Completed
              </Badge>
            </div>
            <p className="text-sm text-green-700">
              Your evaluations will help improve cultural representation in AI image generation.
              Consider evaluating other models to contribute even more!
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-green-600 hover:bg-green-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{model.toUpperCase()} - {country}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {currentQuestionIndex + 1} / {totalQuestions}
              </Badge>
              <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Evaluate cultural representation in AI-generated images • {totalQuestions - currentQuestionIndex - 1} questions remaining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Keep going! Each evaluation helps improve AI cultural representation.</span>
              <span className="font-medium">{totalQuestions - currentQuestionIndex - 1} left</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey Question */}
      {currentQuestion && (
        <SurveyQuestion
          question={currentQuestion}
          onNext={handleNextQuestion}
          onPrevious={goToPreviousQuestion}
          isFirst={isFirstQuestion}
          isLast={isLastQuestion}
          initialResponse={initialResponseForCurrentQuestion}
          currentImageKey={currentImageKey}
        />
      )}
    </div>
  );
}
