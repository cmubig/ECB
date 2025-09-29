'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ModelsPage() {
  const router = useRouter();
  const { user, loading, userProfile } = useAuth();

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
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
              <h1 className="text-xl font-medium text-gray-900">Model Evaluations</h1>
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
        <Card className="border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Model Evaluations</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-xl text-gray-800">Coming Soon</h3>
            <p className="text-gray-600">
              Model evaluations are currently being prepared. Please check back later.
            </p>
            <Button onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
