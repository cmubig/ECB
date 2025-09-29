'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ModelSurvey } from '@/components/survey/ModelSurvey';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

function SurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, userProfile } = useAuth();

  // Get model from URL parameter, default to 'flux' if not provided
  const selectedModel = searchParams.get('model') || 'flux';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !userProfile?.selected_country) {
      router.push('/');
    }
  }, [user, loading, userProfile, router]);

  if (loading || !user || !userProfile?.selected_country) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-medium text-gray-900">
                {selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)} Survey
              </h1>
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        <ModelSurvey
          model={selectedModel}
          country={userProfile.selected_country}
        />
      </main>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <SurveyContent />
    </Suspense>
  );
}