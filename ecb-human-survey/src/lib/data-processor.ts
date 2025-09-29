import { SurveyItem, SurveyQuestion, ImageStep, AttributionQuestion, AttributionStep } from '@/types/survey';

// Country name mapping from CSV format to display format
const COUNTRY_MAPPING: Record<string, string> = {
  'china': 'China',
  'india': 'India',
  'kenya': 'Kenya',
  'korea': 'Korea',
  'nigeria': 'Nigeria',
  'united_states': 'United States',
};

// Model name mapping from CSV format to display format
const MODEL_MAPPING: Record<string, string> = {
  'flux': 'flux',
  'hidream': 'hidream',
  'nextstep': 'nextstep',
  'qwenimage': 'qwen',
  'sd35': 'sd35',
};


function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Parse attribution CSV data
export function parseAttributionCSV(csvText: string): Record<string, Array<{step: number; prompt: string; flux_output_file: string; qwen_output_file: string}>> {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const data: Record<string, Array<{step: number; prompt: string; flux_output_file: string; qwen_output_file: string}>> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const country = values[0];
      if (!data[country]) {
        data[country] = [];
      }

      const step = parseInt(values[1]);
      data[country].push({
        step,
        prompt: values[2],
        flux_output_file: values[3],
        qwen_output_file: values[4],
      });
    }
  }

  return data;
}

// Create AttributionQuestion from parsed data
export function createAttributionQuestion(country: string, attributionData: Array<{step: number; prompt: string; flux_output_file: string; qwen_output_file: string}>): AttributionQuestion {
  const steps: AttributionStep[] = attributionData
    .sort((a, b) => a.step - b.step)
    .map(item => ({
      step: item.step,
      prompt: item.prompt,
      flux_url: item.flux_output_file,
      qwen_url: item.qwen_output_file,
      label: `Step ${item.step}`,
    }));

  return {
    id: `attribution-${country}`,
    country,
    base_image: 'base.png',
    steps,
    current_step: 0,
    total_steps: steps.length,
  };
}

export function parseCsvLine(line: string): SurveyItem | null {
  // Skip header line
  if (line.startsWith('model,country')) {
    return null;
  }

  const parts = parseCSVLine(line);
  if (parts.length < 12) {
    return null;
  }

  // Map country name to display format
  const countryKey = parts[1].toLowerCase();
  const country = COUNTRY_MAPPING[countryKey] || parts[1];

  // Map model name to display format
  const csvModelName = parts[0].toLowerCase();
  const displayModel = MODEL_MAPPING[csvModelName] || parts[0];

  // Clean quotes from text fields
  const cleanText = (text: string) => text.replace(/^"(.*)"$/, '$1');

  return {
    uid: `${displayModel}_${parts[1]}_${parts[2]}_${parts[3]}_${parts[4]}`,
    model: displayModel,
    country: country,
    category: parts[2],
    sub_category: parts[3],
    variant: parts[4],
    t2i_prompt: cleanText(parts[5]),
    i2i_prompt: cleanText(parts[6]),
    base_image: parts[7],
    edit_1: parts[8],
    edit_2: parts[9],
    edit_3: parts[10],
    edit_4: parts[11],
    edit_5: parts[12],
  };
}

export function createSurveyQuestion(item: SurveyItem, questionIndex: number, totalQuestions: number): SurveyQuestion {
  // Select steps 0, 1, 3, 5 (base, edit_1, edit_3, edit_5)
  const images: ImageStep[] = [
    {
      step: 0,
      image_path: item.base_image,
      url: getImageUrl(item.base_image, item.model),
      label: 'Base Image'
    },
    {
      step: 1,
      image_path: item.edit_1,
      url: getImageUrl(item.edit_1, item.model),
      label: 'Edit Step 1'
    },
    {
      step: 3,
      image_path: item.edit_3,
      url: getImageUrl(item.edit_3, item.model),
      label: 'Edit Step 3'
    },
    {
      step: 5,
      image_path: item.edit_5,
      url: getImageUrl(item.edit_5, item.model),
      label: 'Edit Step 5'
    }
  ];

  // Shuffle the images to prevent position bias
  const shuffledImages = shuffleArray(images);

  return {
    id: item.uid,
    model: item.model,
    country: item.country,
    category: item.category,
    sub_category: item.sub_category,
    variant: item.variant,
    prompt: item.t2i_prompt,
    editing_prompt: item.i2i_prompt,
    survey_item: item,
    images: shuffledImages,
    current_step: questionIndex + 1,
    total_steps: totalQuestions,
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getImageUrl(imagePath: string, model: string): string {
  // If the imagePath is already a full S3 URL, return it as is
  if (imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construct the S3 URL for the image
  return `https://ecb-pub.s3.amazonaws.com/${model}/${imagePath}`;
}

export function validateSurveyResponse(
  promptAlignment: number,
  culturalRepresentative: number,
  bestStep: number,
  worstStep: number
): string[] {
  const errors: string[] = [];

  if (promptAlignment < 1 || promptAlignment > 5) {
    errors.push('Prompt alignment score must be between 1 and 5');
  }

  if (culturalRepresentative < 1 || culturalRepresentative > 5) {
    errors.push('Cultural representative score must be between 1 and 5');
  }

  if (![0, 1, 3, 5].includes(bestStep)) {
    errors.push('Best image step must be 0, 1, 3, or 5');
  }

  if (![0, 1, 3, 5].includes(worstStep)) {
    errors.push('Worst image step must be 0, 1, 3, or 5');
  }

  if (bestStep === worstStep) {
    errors.push('Best and worst image cannot be the same');
  }

  return errors;
}

export function formatCountryName(country: string): string {
  const countryMap: Record<string, string> = {
    'china': 'China',
    'india': 'India',
    'kenya': 'Kenya',
    'korea': 'South Korea',
    'nigeria': 'Nigeria',
    'united_states': 'United States',
  };

  return countryMap[country] || country;
}

export function formatCategoryName(category: string): string {
  return category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
