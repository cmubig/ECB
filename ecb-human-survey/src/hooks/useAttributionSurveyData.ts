'use client';

import { useState, useEffect, useCallback } from 'react';
import { AttributionQuestion, AttributionResponse, UserProgress } from '@/types/survey';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgress, updateUserProgress, createUserProgress, getAttributionResponses } from '@/lib/firestore';

interface AttributionSurveyData {
  questions: AttributionQuestion[];
  currentQuestion: AttributionQuestion | null;
  currentQuestionIndex: number;
  loading: boolean;
  error: string | null;
  totalQuestions: number;
  goToNextQuestion: (response: Omit<AttributionResponse, 'timestamp'>) => Promise<void>;
  goToPreviousQuestion: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  initialResponseForCurrentQuestion?: Omit<AttributionResponse, 'timestamp'>;
  progress: UserProgress | null;
  isCompleted: boolean;
}

export function useAttributionSurveyData(selectedCountry: string): AttributionSurveyData {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AttributionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<Record<string, Omit<AttributionResponse, 'timestamp'>>>({});
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const loadSurveyData = useCallback(async () => {
    if (!user?.uid || !selectedCountry) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load CSV data for attribution prompts
      const response = await fetch('/dataset/add_attribution/prompts.csv');
      if (!response.ok) {
        throw new Error(`Failed to load attribution prompts CSV (${response.status})`);
      }
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      // Parse CSV data
      const attributionItems: AttributionQuestion[] = [];

      // Country name mapping
      const countryMapping: Record<string, string> = {
        'korea': 'korea',
        'Korea': 'korea',
        'KOREA': 'korea',
        'china': 'china',
        'China': 'china',
        'CHINA': 'china',
        'india': 'india',
        'India': 'india',
        'INDIA': 'india',
        'kenya': 'kenya',
        'Kenya': 'kenya',
        'KENYA': 'kenya',
        'nigeria': 'nigeria',
        'Nigeria': 'nigeria',
        'NIGERIA': 'nigeria',
        'united_states': 'united_states',
        'United States': 'united_states',
        'United_States': 'united_states',
        'UNITED_STATES': 'united_states',
      };
      
      const mappedCountry = countryMapping[selectedCountry] || selectedCountry.toLowerCase();
      
      // Filter lines for the selected country
      const countryLines = lines.slice(1).filter(line => {
        // Parse CSV line properly (handle commas in URLs)
        const firstCommaIndex = line.indexOf(',');
        const country = line.substring(0, firstCommaIndex).trim();
        return country.toLowerCase() === mappedCountry.toLowerCase();
      });
      
      console.log('Selected country:', selectedCountry);
      console.log('Mapped country:', mappedCountry);
      console.log('Country lines found:', countryLines.length, 'for country:', selectedCountry);
      console.log('First few lines:', lines.slice(1, 4));

      if (countryLines.length > 0) {
        // Create steps for this country
        const steps = countryLines.map((line) => {
          // Parse CSV line properly - split by comma but handle the structure correctly
          const parts = line.split(',');
          
          if (parts.length !== 5) {
            console.error('Invalid CSV line format:', line);
            console.error('Parts length:', parts.length);
            console.error('Parts:', parts);
            return null;
          }
          
          const country = parts[0].trim();
          const stepNum = parts[1].trim();
          const stepPrompt = parts[2].trim();
          const fluxFile = parts[3].trim();
          const qwenFile = parts[4].trim();
          
          console.log('Parsed line:', {
            country,
            stepNum,
            stepPrompt,
            fluxFile,
            qwenFile
          });
          
          return {
            step: parseInt(stepNum),
            prompt: stepPrompt,
            flux_url: fluxFile,
            qwen_url: qwenFile,
            label: `Step ${stepNum}`,
          };
        });
        
        console.log('Steps before filter:', steps);
        const filteredSteps = steps.filter(step => step !== null);
        console.log('Steps after filter:', filteredSteps);
        const sortedSteps = filteredSteps.sort((a, b) => a.step - b.step);
        console.log('Steps after sort:', sortedSteps);

        console.log('Steps created:', sortedSteps.length);
        console.log('Steps:', sortedSteps);
        
        if (sortedSteps.length > 0) {
          const attributionItem = {
            id: `attribution_${selectedCountry}`,
            country: selectedCountry,
            base_image: `https://ecb-pub.s3.us-east-2.amazonaws.com/add_attribution/base.png`,
            steps: sortedSteps,
            current_step: 1,
            total_steps: sortedSteps.length,
          };
          
          console.log('Attribution item created:', attributionItem);
          attributionItems.push(attributionItem);
        }
      }

      console.log('Final attributionItems length:', attributionItems.length);
      console.log('Final attributionItems:', attributionItems);
      
      if (attributionItems.length === 0) {
        console.error('No attribution items found!');
        console.error('Selected country:', selectedCountry);
        console.error('Mapped country:', mappedCountry);
        console.error('Country lines found:', countryLines.length);
        console.error('All lines:', lines.slice(1, 5));
        setError(`No attribution questions found for ${selectedCountry}.`);
        setQuestions([]);
        setLoading(false);
        return;
      }
      

      // Load user progress and responses
      let userProgress = null;
      let existingResponses: AttributionResponse[] = [];
      
      try {
        userProgress = await getUserProgress(user.uid);
      } catch (error) {
        console.warn('Could not load user progress:', error);
      }
      
      try {
        existingResponses = await getAttributionResponses(user.uid);
      } catch (error) {
        console.warn('Could not load attribution responses:', error);
      }

      const responsesMap: Record<string, Omit<AttributionResponse, 'timestamp'>> = {};
      existingResponses.forEach(res => {
        if (res.country === selectedCountry) {
          responsesMap[res.question_id] = res;
        }
      });
      
      // Always clear userResponses first to ensure fresh state
      setUserResponses({});
      
      // Use setTimeout to ensure state is cleared before setting new data
      setTimeout(() => {
        setUserResponses(responsesMap);
      }, 0);

      let initialIndex = 0;

      if (userProgress) {
        setProgress(userProgress);
        const currentQuestionIndexForCountry = userProgress.current_question_by_model?.[`attribution_${selectedCountry}`] || 0;

        console.log('User progress for attribution:', {
          currentQuestionIndexForCountry,
          attributionItemsLength: attributionItems.length,
          userProgress: userProgress
        });

        // If current question index is beyond available questions, reset to 0
        if (currentQuestionIndexForCountry >= attributionItems.length) {
          initialIndex = 0;
          // Clear the attribution progress for this country
          if (userProgress.current_question_by_model) {
            delete userProgress.current_question_by_model[`attribution_${selectedCountry}`];
            // Update the progress in the database
            updateUserProgress(userProgress);
          }
        } else {
          initialIndex = currentQuestionIndexForCountry;
        }
      }

      setQuestions(attributionItems);
      setCurrentQuestionIndex(initialIndex);
    } catch (err) {
      console.error('Error loading attribution survey data:', err);
      setError('Failed to load attribution survey data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedCountry]);

  useEffect(() => {
    loadSurveyData();
  }, [loadSurveyData]);

  const saveProgress = useCallback(async (newIndex: number, completedQuestionId?: string) => {
    if (!user?.uid) return;

    const completedForCountry = new Set(progress?.completed_by_model?.[`attribution_${selectedCountry}`] || []);
    if (completedQuestionId) {
      completedForCountry.add(completedQuestionId);
    }

    const updatedCompletedByModel = {
      ...progress?.completed_by_model,
      [`attribution_${selectedCountry}`]: Array.from(completedForCountry),
    };

    const updatedCurrentQuestionByModel = {
      ...progress?.current_question_by_model,
      [`attribution_${selectedCountry}`]: newIndex,
    };

    const newProgress: UserProgress = {
      user_id: user.uid,
      completed_questions: Array.from(new Set([...(progress?.completed_questions || []), ...(updatedCompletedByModel[`attribution_${selectedCountry}`] || [])])),
      current_question_index: newIndex,
      total_questions: questions.length,
      started_at: progress?.started_at || new Date(),
      last_updated: new Date(),
      completed_by_model: updatedCompletedByModel,
      current_question_by_model: updatedCurrentQuestionByModel,
    };

    try {
      if (progress) {
        await updateUserProgress(newProgress);
      } else {
        await createUserProgress(newProgress);
      }
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user?.uid, progress, selectedCountry, questions.length]);

  const goToNextQuestion = useCallback(async (response: Omit<AttributionResponse, 'timestamp'>) => {
    if (!user?.uid) return;

    // Update local responses state
    setUserResponses(prev => ({
      ...prev,
      [response.question_id]: response
    }));

    // Update progress
    const completedForCountry = progress?.completed_by_model?.[`attribution_${selectedCountry}`] || [];
    const isNewQuestion = !completedForCountry.includes(response.question_id);

    if (isNewQuestion) {
      await saveProgress(currentQuestionIndex + 1, response.question_id);
    } else {
      await saveProgress(currentQuestionIndex + 1);
    }

    // Move to next question in UI
    setCurrentQuestionIndex(prev => prev + 1);
  }, [user?.uid, currentQuestionIndex, saveProgress, selectedCountry, progress]);

  const goToPreviousQuestion = useCallback(() => {
    const newIndex = Math.max(0, currentQuestionIndex - 1);
    setCurrentQuestionIndex(newIndex);
    saveProgress(newIndex);
  }, [currentQuestionIndex, saveProgress]);

  const currentQuestion = questions[currentQuestionIndex];
  const initialResponseForCurrentQuestion = currentQuestion ? userResponses[currentQuestion.id] : undefined;
  
  // Check if all questions are completed - only if we have questions and responses
  const isCompleted = questions.length > 0 && 
                      Object.keys(userResponses).length > 0 && 
                      questions.every(q => userResponses[q.id]);
  
  console.log('isCompleted calculation:', {
    questionsLength: questions.length,
    userResponsesKeys: Object.keys(userResponses).length,
    userResponses: userResponses,
    isCompleted
  });

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    loading,
    error,
    totalQuestions: questions.length,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion: currentQuestionIndex === 0,
    isLastQuestion: currentQuestionIndex >= questions.length - 1,
    initialResponseForCurrentQuestion,
    progress,
    isCompleted,
  };
}
