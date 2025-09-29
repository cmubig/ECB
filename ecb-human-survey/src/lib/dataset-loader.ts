import { SurveyItem } from '@/types/survey';
import { parseCsvLine } from './data-processor';

// Cache for loaded CSV data to avoid repeated fetches
const csvCache: Record<string, SurveyItem[]> = {};

// Model name mapping for CSV file names
const MODEL_TO_CSV_NAME: Record<string, string> = {
  'flux': 'flux',
  'hidream': 'hidream',
  'nextstep': 'nextstep',
  'qwen': 'qwen', // CSV file is named qwen but contains qwenimage
  'sd35': 'sd35',
};

export async function loadModelData(model: string): Promise<SurveyItem[]> {
  // Return cached data if available
  if (csvCache[model]) {
    return csvCache[model];
  }

  try {
    const csvModelName = MODEL_TO_CSV_NAME[model] || model;
    const response = await fetch(`/dataset/${csvModelName}/prompt-img-path_s3.csv`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No data available for model ${model}`);
        return [];
      }
      throw new Error(`Failed to load CSV for model ${model}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    const items: SurveyItem[] = [];
    dataLines.forEach(line => {
      const item = parseCsvLine(line);
      if (item && item.model === model) {
        items.push(item);
      }
    });
    
    // Cache the results
    csvCache[model] = items;
    return items;
  } catch (error) {
    console.error(`Error loading data for model ${model}:`, error);
    return [];
  }
}

export async function getModelQuestionCounts(): Promise<Record<string, Record<string, number>>> {
  const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
  const countries = ['China', 'India', 'Kenya', 'Korea', 'Nigeria', 'United States'];
  
  const counts: Record<string, Record<string, number>> = {};
  
  // Initialize counts structure
  models.forEach(model => {
    counts[model] = {};
    countries.forEach(country => {
      counts[model][country] = 0;
    });
  });
  
  // Load data for each model and count questions by country
  await Promise.all(models.map(async (model) => {
    try {
      const items = await loadModelData(model);
      
      items.forEach(item => {
        if (countries.includes(item.country)) {
          counts[model][item.country]++;
        }
      });
    } catch (error) {
      console.error(`Error counting questions for model ${model}:`, error);
    }
  }));
  
  return counts;
}

export async function getTotalQuestionsForModel(model: string, country: string): Promise<number> {
  try {
    const items = await loadModelData(model);
    return items.filter(item => item.country === country).length;
  } catch (error) {
    console.error(`Error getting total questions for ${model} in ${country}:`, error);
    return 0;
  }
}

export async function getAllModelCounts(): Promise<Record<string, number>> {
  const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
  const counts: Record<string, number> = {};
  
  await Promise.all(models.map(async (model) => {
    try {
      const items = await loadModelData(model);
      counts[model] = items.length;
    } catch (error) {
      console.error(`Error getting count for model ${model}:`, error);
      counts[model] = 0;
    }
  }));
  
  return counts;
}
