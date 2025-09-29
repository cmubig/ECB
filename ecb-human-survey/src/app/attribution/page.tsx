'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AttributionEvaluation } from '@/components/survey/AttributionEvaluation';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAttributionSurveyData } from '@/hooks/useAttributionSurveyData';
import { saveAttributionResponse } from '@/lib/firestore';
import { toast } from 'sonner';
import { AttributionResponse } from '@/types/survey';

function AttributionContent() {
  const router = useRouter();
  const { user, loading, userProfile } = useAuth();
  const {
    currentQuestion,
    currentQuestionIndex,
    loading: dataLoading,
    error,
    totalQuestions,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion,
    isLastQuestion,
    initialResponseForCurrentQuestion,
    isCompleted,
  } = useAttributionSurveyData(userProfile?.selected_country || '');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !userProfile?.selected_country) {
      router.push('/');
    }
  }, [user, loading, userProfile, router]);

  const handleNextQuestion = async (response: Omit<AttributionResponse, 'timestamp'>) => {
    if (!user?.uid) {
      toast.error('Authentication Error', { description: 'You must be logged in to submit responses.' });
      return;
    }

    try {
      await saveAttributionResponse({ ...response, user_id: user.uid });
      await goToNextQuestion(response);
      toast.success('Response saved!', { description: 'Moving to the next question.' });
    } catch (err) {
      console.error('Error saving response:', err);
      toast.error('Failed to save response.', { description: (err as Error).message });
    }
  };

  if (loading || !user || !userProfile?.selected_country) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto" />
          <p className="text-gray-600">Loading attribution evaluation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-medium text-gray-900">Attribution Evaluation</h1>
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                  {userProfile.selected_country}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Button>
                <UserProfile />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-6 py-12">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl text-gray-800">No Attribution Questions Available</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (totalQuestions === 0 || !currentQuestion) {
    // Check if it's completed or no questions available
    if (isCompleted && totalQuestions > 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-medium text-gray-900">Attribution Evaluation</h1>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {userProfile.selected_country}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/')}
                    className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Back to Dashboard
                  </Button>
                  <UserProfile />
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl text-gray-800">Completed!</h2>
              <p className="text-gray-600">
                Attribution Evaluation for {userProfile.selected_country} has been completed successfully.
              </p>
              <div className="flex justify-center">
                <Badge className="text-lg px-4 py-2 bg-gray-600 hover:bg-gray-700">
                  ✓ All Questions Completed
                </Badge>
              </div>
              <Button onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-medium text-gray-900">Attribution Evaluation</h1>
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                  {userProfile.selected_country}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Button>
                <UserProfile />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-6 py-12">
            <div className="text-4xl mb-4">🤔</div>
            <h2 className="text-xl text-gray-800">No Questions for {userProfile.selected_country}</h2>
            <p className="text-gray-600">There are no attribution questions for {userProfile.selected_country} yet.</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (currentQuestionIndex >= totalQuestions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-medium text-gray-900">Attribution Evaluation</h1>
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                  {userProfile.selected_country}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Button>
                <UserProfile />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl text-gray-800">Attribution Evaluation Completed!</h2>
            <p className="text-gray-600">
              Excellent work! You&apos;ve evaluated all {totalQuestions} attribution questions for {userProfile.selected_country}.
            </p>
            <div className="flex justify-center">
              <Badge className="text-lg px-4 py-2 bg-gray-600 hover:bg-gray-700">
                ✓ {totalQuestions} Questions Completed
              </Badge>
            </div>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-medium text-gray-900">Attribution Evaluation</h1>
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                {userProfile.selected_country}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AttributionEvaluation
          question={currentQuestion}
          onNext={handleNextQuestion}
          onPrevious={goToPreviousQuestion}
          isFirst={isFirstQuestion}
          isLast={isLastQuestion}
          initialResponse={initialResponseForCurrentQuestion}
        />
      </main>
    </div>
  );
}

export default function AttributionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <AttributionContent />
    </Suspense>
  );
}
