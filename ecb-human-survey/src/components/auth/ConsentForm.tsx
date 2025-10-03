'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ConsentFormProps {
  onConsent: (consent: boolean) => void;
}

export function ConsentForm({ onConsent }: ConsentFormProps) {
  const [ageConsent, setAgeConsent] = useState(false);
  const [readConsent, setReadConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ageConsent || !readConsent) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConsent(true);
    } catch (error) {
      console.error('Error submitting consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = ageConsent && readConsent;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Consent Form: Cultural Bias Evaluation in AI-Generated Images
          </CardTitle>
          <CardDescription className="text-gray-600">
            ECB (Evaluation Cultural Bias) Research Study Participation Agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4 text-gray-700">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You are being asked to participate in a research study on cultural bias evaluation in AI-generated images. 
                  This study is part of the ECB (Evaluation Cultural Bias) project to understand how AI models represent different cultures.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
                  <p>
                    The purpose of this study is to evaluate cultural bias in AI-generated images across different countries and cultures. 
                    We aim to understand how well AI models represent cultural diversity and identify potential biases in image generation. 
                    Any reports and presentations about the findings from this study will not include your name or any other information that could identify you.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What you will do</h3>
                  <p>
                    You will evaluate AI-generated images from 5 different models (Flux, HiDream, NextStep, Qwen, SD35) across various cultural contexts. 
                    For each image set, you will rate image quality, cultural representation, and select the best/worst images. 
                    You will also complete attribution tasks to identify which AI model generated specific images. 
                    Approximate time: ~30 minutes per model (5 models) + ~3 minutes for attribution tasks (total ~153 minutes).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Risks/Benefits</h3>
                  <p>
                    Minimal risk (similar to normal web browsing). There is no direct benefit to you; results will inform research on cultural representation in AI.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Voluntary Participation</h3>
                  <p>
                    Your participation is voluntary. You may stop at any time by closing the page. If you wish to withdraw your responses after submission, 
                    contact the research team and provide your participant ID (shown on the Thank-You page).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Confidentiality & Data</h3>
                  <p>
                    We will not collect your name or email. The system generates a random participant ID to prevent duplicate submissions. 
                    We will store your answers with that random ID and your selected country only. De-identified results may be shared publicly and in publications.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Eligibility</h3>
                  <p>You must be 18 or older to participate.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contacts</h3>
                  <p>
                    If you have questions about the research, email the study team. For questions about your rights as a research participant, 
                    contact the CMU IRB office.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="age-consent" 
                checked={ageConsent}
                onCheckedChange={(checked) => setAgeConsent(checked as boolean)}
              />
              <label htmlFor="age-consent" className="text-sm font-medium text-gray-900">
                I am 18 or older.
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="read-consent" 
                checked={readConsent}
                onCheckedChange={(checked) => setReadConsent(checked as boolean)}
              />
              <label htmlFor="read-consent" className="text-sm font-medium text-gray-900">
                I have read and agree to the consent information above.
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
