'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgress, getUserResponses } from '@/lib/firestore';
import { UserProgress, SurveyResponse } from '@/types/survey';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCountryName, formatCategoryName } from '@/lib/data-processor';
import Link from 'next/link';

export default function ProgressPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadUserData = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const [userProgress, userResponses] = await Promise.all([
        getUserProgress(user.uid),
        getUserResponses(user.uid),
      ]);

      setProgress(userProgress);
      setResponses(userResponses);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user?.uid]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completionPercentage = progress 
    ? Math.round((progress.completed_questions.length / progress.total_questions) * 100)
    : 0;

  const averagePromptAlignment = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.prompt_alignment, 0) / responses.length
    : 0;

  const averageCulturalScore = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.cultural_representative, 0) / responses.length
    : 0;

  const modelCounts = responses.reduce((acc, response) => {
    acc[response.model] = (acc[response.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryCounts = responses.reduce((acc, response) => {
    acc[response.country] = (acc[response.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
              <p className="text-sm text-gray-600">Survey participation and statistics</p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Questions Completed</span>
              <span>{progress?.completed_questions.length || 0} of {progress?.total_questions || 0}</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            <p className="text-sm text-gray-600">
              {completionPercentage}% complete
            </p>
            
            {progress && progress.completed_questions.length < progress.total_questions && (
              <div className="pt-4">
                <Link href="/survey">
                  <Button>Continue Survey</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {responses.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{responses.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg. Prompt Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {averagePromptAlignment.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">out of 5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg. Cultural Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {averageCulturalScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">out of 5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Models Evaluated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {Object.keys(modelCounts).length}
                </div>
                <div className="text-sm text-gray-600">different models</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Model Distribution */}
        {Object.keys(modelCounts).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Responses by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(modelCounts).map(([model, count]) => (
                  <div key={model} className="text-center space-y-2">
                    <Badge variant="secondary" className="w-full justify-center">
                      {model}
                    </Badge>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Country Distribution */}
        {Object.keys(countryCounts).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Responses by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(countryCounts).map(([country, count]) => (
                  <div key={country} className="text-center space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      {formatCountryName(country)}
                    </Badge>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Responses */}
        {responses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.slice(0, 10).map((response, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{response.model}</Badge>
                      <Badge variant="outline">{formatCountryName(response.country)}</Badge>
                      <Badge variant="outline">{formatCategoryName(response.category)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Prompt Alignment:</span> {response.prompt_alignment}/5
                      </div>
                      <div>
                        <span className="font-medium">Cultural Score:</span> {response.cultural_representative}/5
                      </div>
                      <div>
                        <span className="font-medium">Best Step:</span> {response.best_step}
                      </div>
                      <div>
                        <span className="font-medium">Worst Step:</span> {response.worst_step}
                      </div>
                    </div>
                    {response.comments && (
                      <div className="text-sm text-gray-600 italic">
                        &ldquo;{response.comments}&rdquo;
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {response.timestamp.toLocaleDateString()} at {response.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No responses message */}
        {responses.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-lg font-semibold">No responses yet</h3>
              <p className="text-gray-600">Start the survey to see your progress and statistics here.</p>
              <Link href="/survey">
                <Button>Start Survey</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
