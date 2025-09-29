'use client';

import { useState, useEffect } from 'react';
import { SurveyItem, SurveyQuestion } from '@/types/survey';
import { parseCsvLine, createSurveyQuestion, shuffleArray } from '@/lib/data-processor';

// Sample data for each model - in production, this would come from your CSV files
const SAMPLE_CSV_DATA = {
  flux: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5
flux,china,architecture,house,general,"House in China, photorealistic.",Change the image to represent house in China.,base/flux_china_architecture_house_general.png,edit_1/flux_china_architecture_house_general_1.png,edit_2/flux_china_architecture_house_general_2.png,edit_3/flux_china_architecture_house_general_3.png,edit_4/flux_china_architecture_house_general_4.png,edit_5/flux_china_architecture_house_general_5.png
flux,india,food,main_dish,traditional,"Traditional main dish in India, photorealistic.",Change the image to represent traditional main dish in India.,base/flux_india_food_main_dish_traditional.png,edit_1/flux_india_food_main_dish_traditional_1.png,edit_2/flux_india_food_main_dish_traditional_2.png,edit_3/flux_india_food_main_dish_traditional_3.png,edit_4/flux_india_food_main_dish_traditional_4.png,edit_5/flux_india_food_main_dish_traditional_5.png`,
  
  hidream: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5
hidream,kenya,people,farmer,,"A farmer in Kenya, photorealistic.",Change the image to represent farmer in Kenya.,base/hidream_kenya_people_farmer.png,edit_1/hidream_kenya_people_farmer_1.png,edit_2/hidream_kenya_people_farmer_2.png,edit_3/hidream_kenya_people_farmer_3.png,edit_4/hidream_kenya_people_farmer_4.png,edit_5/hidream_kenya_people_farmer_5.png
hidream,korea,fashion,clothing,traditional,"Traditional clothing in Korea, photorealistic.",Change the image to represent traditional clothing in Korea.,base/hidream_korea_fashion_clothing_traditional.png,edit_1/hidream_korea_fashion_clothing_traditional_1.png,edit_2/hidream_korea_fashion_clothing_traditional_2.png,edit_3/hidream_korea_fashion_clothing_traditional_3.png,edit_4/hidream_korea_fashion_clothing_traditional_4.png,edit_5/hidream_korea_fashion_clothing_traditional_5.png`,
  
  nextstep: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5
nextstep,nigeria,art,dance,traditional,"Traditional dance in Nigeria, photorealistic.",Change the image to represent traditional dance in Nigeria.,base/nextstep_nigeria_art_dance_traditional.png,edit_1/nextstep_nigeria_art_dance_traditional_1.png,edit_2/nextstep_nigeria_art_dance_traditional_2.png,edit_3/nextstep_nigeria_art_dance_traditional_3.png,edit_4/nextstep_nigeria_art_dance_traditional_4.png,edit_5/nextstep_nigeria_art_dance_traditional_5.png
nextstep,united_states,landscape,city,,"City landscape in the United States, photorealistic.",Change the image to represent city landscape in the United States.,base/nextstep_united_states_landscape_city.png,edit_1/nextstep_united_states_landscape_city_1.png,edit_2/nextstep_united_states_landscape_city_2.png,edit_3/nextstep_united_states_landscape_city_3.png,edit_4/nextstep_united_states_landscape_city_4.png,edit_5/nextstep_united_states_landscape_city_5.png`,
  
  qwen: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5
qwenimage,china,wildlife,animal,national,"National animal in China, photorealistic.",Change the image to represent national animal in China.,base/qwenimage_china_wildlife_animal_national.png,edit_1/qwenimage_china_wildlife_animal_national_1.png,edit_2/qwenimage_china_wildlife_animal_national_2.png,edit_3/qwenimage_china_wildlife_animal_national_3.png,edit_4/qwenimage_china_wildlife_animal_national_4.png,edit_5/qwenimage_china_wildlife_animal_national_5.png
qwenimage,india,event,festival,traditional,"Traditional festival in India, photorealistic.",Change the image to represent traditional festival in India.,base/qwenimage_india_event_festival_traditional.png,edit_1/qwenimage_india_event_festival_traditional_1.png,edit_2/qwenimage_india_event_festival_traditional_2.png,edit_3/qwenimage_india_event_festival_traditional_3.png,edit_4/qwenimage_india_event_festival_traditional_4.png,edit_5/qwenimage_india_event_festival_traditional_5.png`,
  
  sd35: `model,country,category,sub_category,variant,T2I prompt,I2I prompt,base,edit_1,edit_2,edit_3,edit_4,edit_5
sd35,kenya,architecture,landmark,traditional,"Traditional landmark in Kenya, photorealistic.",Change the image to represent traditional landmark in Kenya.,base/sd35_kenya_architecture_landmark_traditional.png,edit_1/sd35_kenya_architecture_landmark_traditional_1.png,edit_2/sd35_kenya_architecture_landmark_traditional_2.png,edit_3/sd35_kenya_architecture_landmark_traditional_3.png,edit_4/sd35_kenya_architecture_landmark_traditional_4.png,edit_5/sd35_kenya_architecture_landmark_traditional_5.png
sd35,korea,food,dessert,modern,"Modern dessert in Korea, photorealistic.",Change the image to represent modern dessert in Korea.,base/sd35_korea_food_dessert_modern.png,edit_1/sd35_korea_food_dessert_modern_1.png,edit_2/sd35_korea_food_dessert_modern_2.png,edit_3/sd35_korea_food_dessert_modern_3.png,edit_4/sd35_korea_food_dessert_modern_4.png,edit_5/sd35_korea_food_dessert_modern_5.png`
};

export function useSurveyData() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        setLoading(true);
        
        // Try to load from actual CSV files first, fallback to sample data
        let allItems: SurveyItem[] = [];
        
        try {
          // Try to load from actual files
          const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
          
          for (const model of models) {
            try {
              const response = await fetch(`/dataset/${model}/prompt-img-path_s3.csv`);
              if (response.ok) {
                const csvText = await response.text();
                const lines = csvText.trim().split('\n');
                
                lines.forEach(line => {
                  const item = parseCsvLine(line);
                  if (item) {
                    allItems.push(item);
                  }
                });
              }
            } catch (err) {
              console.warn(`Failed to load CSV for model ${model}:`, err);
            }
          }
        } catch (err) {
          console.warn('Failed to load from files, using sample data:', err);
        }

        // If no items loaded from files, use sample data
        if (allItems.length === 0) {
          Object.entries(SAMPLE_CSV_DATA).forEach(([model, csvData]) => {
            const lines = csvData.trim().split('\n');
            lines.forEach(line => {
              const item = parseCsvLine(line);
              if (item) {
                allItems.push(item);
              }
            });
          });
        }

        // Shuffle the items to randomize order
        const shuffledItems = shuffleArray(allItems);
        
        // Create survey questions
        const surveyQuestions = shuffledItems.map((item, index) => 
          createSurveyQuestion(item, index, shuffledItems.length)
        );

        setQuestions(surveyQuestions);
        setError(null);
      } catch (err) {
        console.error('Error loading survey data:', err);
        setError('Failed to load survey data');
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, []);

  return {
    questions,
    loading,
    error,
    totalQuestions: questions.length,
  };
}

// Hook for loading real CSV data from files (for production)
export function useSurveyDataFromFiles() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFromFiles = async () => {
      try {
        setLoading(true);
        
        const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
        const allItems: SurveyItem[] = [];
        
        // Load CSV files for each model
        for (const model of models) {
          try {
            const response = await fetch(`/dataset/${model}/prompt-img-path_s3.csv`);
            if (response.ok) {
              const csvText = await response.text();
              const lines = csvText.trim().split('\n');
              
              lines.forEach(line => {
                const item = parseCsvLine(line);
                if (item) {
                  allItems.push(item);
                }
              });
            }
          } catch (err) {
            console.warn(`Failed to load CSV for model ${model}:`, err);
          }
        }

        if (allItems.length === 0) {
          throw new Error('No survey data found');
        }

        // Shuffle and create questions
        const shuffledItems = shuffleArray(allItems);
        const surveyQuestions = shuffledItems.map((item, index) => 
          createSurveyQuestion(item, index, shuffledItems.length)
        );

        setQuestions(surveyQuestions);
        setError(null);
      } catch (err) {
        console.error('Error loading survey data from files:', err);
        setError('Failed to load survey data from files');
      } finally {
        setLoading(false);
      }
    };

    loadFromFiles();
  }, []);

  return {
    questions,
    loading,
    error,
    totalQuestions: questions.length,
  };
}
