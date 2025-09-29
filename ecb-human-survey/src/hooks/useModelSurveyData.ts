'use client';

import { useState, useEffect } from 'react';
import { SurveyItem, SurveyQuestion } from '@/types/survey';
import { parseCsvLine, createSurveyQuestion, shuffleArray } from '@/lib/data-processor';

export function useModelSurveyData(selectedCountry?: string) {
  const [questionsByModel, setQuestionsByModel] = useState<Record<string, SurveyQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCountry) return;
    
    const loadSurveyData = async () => {
      try {
        setLoading(true);
        
        const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
        const questionsByModelTemp: Record<string, SurveyQuestion[]> = {};
        
        for (const model of models) {
          try {
            const response = await fetch(`/dataset/${model}/prompt-img-path.csv`);
            if (response.ok) {
              const csvText = await response.text();
              const lines = csvText.trim().split('\n');
              const items: SurveyItem[] = [];
              
              lines.forEach(line => {
                const item = parseCsvLine(line);
                // Filter by selected country
                if (item && item.country === selectedCountry) {
                  items.push(item);
                }
              });
              
              // Shuffle and create questions for this model
              const shuffledItems = shuffleArray(items);
              const questions = shuffledItems.map((item, index) => 
                createSurveyQuestion(item, index, shuffledItems.length)
              );
              
              questionsByModelTemp[model] = questions;
            }
          } catch (err) {
            console.warn(`Failed to load CSV for model ${model}:`, err);
            questionsByModelTemp[model] = [];
          }
        }

        setQuestionsByModel(questionsByModelTemp);
        setError(null);
      } catch (err) {
        console.error('Error loading survey data:', err);
        setError('Failed to load survey data');
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [selectedCountry]);

  const getTotalQuestions = () => {
    return Object.values(questionsByModel).reduce((total, questions) => total + questions.length, 0);
  };

  const getQuestionsForModel = (model: string) => {
    return questionsByModel[model] || [];
  };

  return {
    questionsByModel,
    loading,
    error,
    totalQuestions: getTotalQuestions(),
    getQuestionsForModel,
  };
}
