import { SurveyItem } from '@/types/survey';
import { parseCsvLine } from './data-processor';

// Load CSV data from the actual dataset files
export async function loadCsvFromFile(filePath: string): Promise<SurveyItem[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const items: SurveyItem[] = [];
    
    lines.forEach(line => {
      const item = parseCsvLine(line);
      if (item) {
        items.push(item);
      }
    });
    
    return items;
  } catch (error) {
    console.error(`Error loading CSV from ${filePath}:`, error);
    return [];
  }
}

// Load all CSV files for all models
export async function loadAllCsvData(): Promise<SurveyItem[]> {
  const models = ['flux', 'hidream', 'nextstep', 'qwen', 'sd35'];
  const allItems: SurveyItem[] = [];
  
  for (const model of models) {
    try {
      const items = await loadCsvFromFile(`/dataset/${model}-prompt-img-path.csv`);
      allItems.push(...items);
    } catch (error) {
      console.warn(`Failed to load data for model ${model}:`, error);
    }
  }
  
  return allItems;
}

// Sample a subset of items for the survey (to avoid overwhelming users)
export function sampleSurveyItems(items: SurveyItem[], maxItems: number = 50): SurveyItem[] {
  if (items.length <= maxItems) {
    return items;
  }
  
  // Ensure we have a good distribution across models and countries
  const itemsByModel = items.reduce((acc, item) => {
    if (!acc[item.model]) acc[item.model] = [];
    acc[item.model].push(item);
    return acc;
  }, {} as Record<string, SurveyItem[]>);
  
  const sampledItems: SurveyItem[] = [];
  const itemsPerModel = Math.floor(maxItems / Object.keys(itemsByModel).length);
  
  Object.entries(itemsByModel).forEach(([model, modelItems]) => {
    // Shuffle items for this model
    const shuffled = [...modelItems].sort(() => Math.random() - 0.5);
    // Take a sample
    sampledItems.push(...shuffled.slice(0, itemsPerModel));
  });
  
  // If we still have room, add more items randomly
  const remaining = maxItems - sampledItems.length;
  if (remaining > 0) {
    const unusedItems = items.filter(item => !sampledItems.includes(item));
    const shuffledUnused = unusedItems.sort(() => Math.random() - 0.5);
    sampledItems.push(...shuffledUnused.slice(0, remaining));
  }
  
  return sampledItems.sort(() => Math.random() - 0.5); // Final shuffle
}
