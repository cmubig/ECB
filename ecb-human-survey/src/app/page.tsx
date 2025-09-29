'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserProfile } from '@/components/auth/UserProfile';
import { CountrySelector } from '@/components/survey/CountrySelector';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { user, loading, userProfile } = useAuth();
  const [showCountrySelection, setShowCountrySelection] = useState(false);

  useEffect(() => {
    if (user && !userProfile?.selected_country) {
      setShowCountrySelection(true);
    } else {
      setShowCountrySelection(false);
    }
  }, [user, userProfile]);

  if (loading) {
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
            <div>
              <h1 className="text-xl font-medium text-gray-900">ECB Human Survey</h1>
              <p className="text-sm text-gray-600">Cultural Image Evaluation</p>
            </div>
            {user && !showCountrySelection && (
              <div className="flex items-center space-x-3">
                {userProfile?.selected_country && (
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {userProfile.selected_country}
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCountrySelection(true)}
                  className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Change Country
                </Button>
                <UserProfile />
              </div>
            )}
            {user && showCountrySelection && <UserProfile />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {!user ? (
          // Login Screen
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-light text-gray-900">
                Cultural Image Evaluation Research
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
                Evaluate AI image generation models from diverse cultural perspectives.
              </p>
            </div>

            <div className="max-w-sm mx-auto">
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-center">Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Sign in to participate in the survey.
                  </p>
                  <LoginButton />
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Evaluate Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Rate AI-generated images on prompt alignment and cultural representation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Multiple Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Compare 5 different AI models: Flux, HiDream, NextStep, Qwen, SD3.5.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Global Perspectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Evaluate across China, India, Kenya, Korea, Nigeria, and the US.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : showCountrySelection ? (
          // Country Selection Screen
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-light text-gray-900">
                Select Your Country
              </h2>
              <p className="text-base text-gray-600 max-w-xl mx-auto">
                Choose your cultural background. You will evaluate images related to your selected country.
              </p>
            </div>

            <div className="max-w-sm mx-auto">
              <Card className="border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-center">Country Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CountrySelector onCountrySelected={() => setShowCountrySelection(false)} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
              {[
                { flag: '🇨🇳', name: 'China' },
                { flag: '🇮🇳', name: 'India' },
                { flag: '🇰🇪', name: 'Kenya' },
                { flag: '🇰🇷', name: 'Korea' },
                { flag: '🇳🇬', name: 'Nigeria' },
                { flag: '🇺🇸', name: 'United States' },
              ].map((country) => (
                <div key={country.name} className="p-3 bg-white border border-gray-200 rounded text-center">
                  <div className="text-lg mb-1">{country.flag}</div>
                  <div className="text-sm text-gray-700">{country.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Dashboard
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-light text-gray-900">
                Welcome, {user.displayName || 'Participant'}
              </h2>
              <p className="text-base text-gray-600">
                Continue evaluating images from {userProfile?.selected_country}.
              </p>
            </div>

            <ProgressDashboard country={userProfile?.selected_country || ''} />

            <Card className="border-gray-200 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Research Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    This research evaluates how well AI image generation models represent different cultures. 
                    Your perspective as someone from {userProfile?.selected_country} helps us understand 
                    cultural representation accuracy.
                  </p>

                  <div className="bg-gray-100 p-4 rounded">
                    <h4 className="font-medium text-gray-900 mb-2">Research Goals</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Assess cultural accuracy in AI-generated images</li>
                      <li>• Identify potential biases or stereotypes</li>
                      <li>• Improve future AI model development</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-xl font-light text-gray-900">5</div>
                    <div className="text-xs text-gray-600">AI Models</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-light text-gray-900">6</div>
                    <div className="text-xs text-gray-600">Countries</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-light text-gray-900">15+</div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-light text-gray-900">4</div>
                    <div className="text-xs text-gray-600">Edit Steps</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-light text-gray-900">2</div>
                    <div className="text-xs text-gray-600">Key Metrics</div>
                  </div>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Time:</strong> 10-15 minutes per model (participate in as many as you&apos;d like)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}