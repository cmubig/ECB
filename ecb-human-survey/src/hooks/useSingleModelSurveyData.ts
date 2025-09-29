'use client';

import { useState, useEffect, useCallback } from 'react';
import { SurveyQuestion, SurveyItem, SurveyResponse, UserProgress } from '@/types/survey';
import { parseCsvLine, createSurveyQuestion, shuffleArray, getImageUrl } from '@/lib/data-processor';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgress, updateUserProgress, createUserProgress, getUserResponses } from '@/lib/firestore';

// Model name mapping for CSV file names
const MODEL_TO_CSV_NAME: Record<string, string> = {
  'flux': 'flux',
  'hidream': 'hidream',
  'nextstep': 'nextstep',
  'qwen': 'qwen', // CSV file is named qwen but contains qwenimage
  'sd35': 'sd35',
};

export function useSingleModelSurveyData(selectedModel: string, selectedCountry: string) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<Record<string, Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'>>>({});
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const loadSurveyData = useCallback(async () => {
    if (!user?.uid || !selectedModel || !selectedCountry) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the correct CSV file name for the model
      const csvModelName = MODEL_TO_CSV_NAME[selectedModel] || selectedModel;
      
      // Load CSV data for the selected model
      const response = await fetch(`/dataset/${csvModelName}/prompt-img-path_s3.csv`);
      if (!response.ok) {
        if (response.status === 404) {
          setError(`No data available for ${selectedModel.toUpperCase()} model yet. Please try another model.`);
          setQuestions([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load CSV for model ${selectedModel} (${response.status})`);
      }
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      const allItems: SurveyItem[] = [];
      lines.forEach(line => {
        const item = parseCsvLine(line);
        if (item && item.model === selectedModel && item.country === selectedCountry) {
          allItems.push(item);
        }
      });

      if (allItems.length === 0) {
        setError(`No survey items found for ${selectedModel} in ${selectedCountry}.`);
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Load user progress and responses
      const userProgress = await getUserProgress(user.uid);
      const existingResponses = await getUserResponses(user.uid);

      const responsesMap: Record<string, Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'>> = {};
      existingResponses.forEach(res => {
        if (res.model === selectedModel) {
          console.log('Loading existing response:', res);
          responsesMap[res.question_id] = res;
        }
      });
      console.log('Final responsesMap:', responsesMap);
      setUserResponses(responsesMap);

      let filteredItems = allItems;
      let initialIndex = 0;

      if (userProgress) {
        setProgress(userProgress);
        const completedForModel = userProgress.completed_by_model?.[selectedModel] || [];
        const currentQuestionIndexForModel = userProgress.current_question_by_model?.[selectedModel] || 0;

        // Don't filter out completed questions - keep all questions for navigation
        filteredItems = allItems;

        // Set initial index based on current progress
        if (currentQuestionIndexForModel >= allItems.length) {
          initialIndex = allItems.length; // Indicate completion
        } else {
          initialIndex = currentQuestionIndexForModel;
        }
      }

      const surveyQuestions = filteredItems.map((item, index) =>
        createSurveyQuestion(item, index, filteredItems.length)
      );

      setQuestions(surveyQuestions);
      setCurrentQuestionIndex(initialIndex);
    } catch (err) {
      console.error('Error loading survey data:', err);
      setError('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedModel, selectedCountry]);

  useEffect(() => {
    loadSurveyData();
  }, [loadSurveyData]);

  const saveProgress = useCallback(async (newIndex: number, completedQuestionId?: string) => {
    if (!user?.uid) return;

    const completedForModel = new Set(progress?.completed_by_model?.[selectedModel] || []);
    if (completedQuestionId) {
      completedForModel.add(completedQuestionId);
    }

    const updatedCompletedByModel = {
      ...progress?.completed_by_model,
      [selectedModel]: Array.from(completedForModel),
    };

    const updatedCurrentQuestionByModel = {
      ...progress?.current_question_by_model,
      [selectedModel]: newIndex,
    };

    const newProgress: UserProgress = {
      user_id: user.uid,
      completed_questions: Array.from(new Set([...(progress?.completed_questions || []), ...(updatedCompletedByModel[selectedModel] || [])])),
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
  }, [user?.uid, progress, selectedModel, questions.length]);

  const goToNextQuestion = useCallback(async (response: Omit<SurveyResponse, 'timestamp' | 'completion_time_seconds'>) => {
    if (!user?.uid) return;

    console.log('goToNextQuestion called with response:', response);

    // Update local responses state with the full response including imageRatings
    setUserResponses(prev => {
      const updated = { ...prev, [response.question_id]: response };
      console.log('Updated userResponses:', updated);
      return updated;
    });
    
    // Only update progress if this is a new question (not already completed)
    const completedForModel = progress?.completed_by_model?.[selectedModel] || [];
    const isNewQuestion = !completedForModel.includes(response.question_id);
    
    if (isNewQuestion) {
      // Update progress in Firestore for new questions
      await saveProgress(currentQuestionIndex + 1, response.question_id);
    } else {
      // For already completed questions, just move to next without updating completion
      await saveProgress(currentQuestionIndex + 1);
    }
    
    // Move to next question in UI
    setCurrentQuestionIndex(prev => prev + 1);
  }, [user?.uid, currentQuestionIndex, saveProgress, selectedModel, progress]);

  const goToPreviousQuestion = useCallback(() => {
    const newIndex = Math.max(0, currentQuestionIndex - 1);
    setCurrentQuestionIndex(newIndex);
    saveProgress(newIndex);
  }, [currentQuestionIndex, saveProgress]);

  const currentQuestion = questions[currentQuestionIndex];
  const initialResponseForCurrentQuestion = currentQuestion ? userResponses[currentQuestion.id] : undefined;

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
  };
}
