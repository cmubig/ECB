export interface SurveyItem {
  uid: string;
  model: string;
  country: string;
  category: string;
  sub_category: string;
  variant: string;
  t2i_prompt: string;
  i2i_prompt: string;
  base_image: string;
  edit_1: string;
  edit_2: string;
  edit_3: string;
  edit_4: string;
  edit_5: string;
}

export interface ImageStep {
  step: number;
  image_path: string;
  url: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  model: string;
  country: string;
  category: string;
  sub_category: string;
  variant: string;
  prompt: string;
  editing_prompt: string;
  survey_item: SurveyItem;
  images: ImageStep[]; // step 0, 1, 3, 5
  current_step: number;
  total_steps: number;
}

export interface SurveyResponse {
  question_id: string;
  user_id: string;
  model: string;
  country: string;
  category: string;
  sub_category: string;
  variant: string;
  prompt: string;
  editing_prompt: string;
  image_urls: string[];
  image_quality: number; // 1-5
  cultural_representative: number; // 1-5
  best_step: number; // 0, 1, 3, 5
  worst_step: number; // 0, 1, 3, 5
  comments?: string;
  timestamp: Date;
  completion_time_seconds: number;
  imageRatings?: Record<number, { step: number; imageQuality: number; culturalRepresentative: number; }>; // Individual image ratings
}

// New interface for individual step responses
export interface StepResponse {
  uid: string; // e.g., "flux_china_architecture_house_general::step0"
  group_id: string; // e.g., "flux_china_architecture_house_general"
  step: string; // "step0", "step1", "step3", "step5"
  user_id: string;
  model: string;
  country: string;
  category: string;
  sub_category: string;
  variant: string;
  prompt: string;
  editing_prompt: string;
  image_url: string;
  image_quality: number; // 1-5
  cultural_representative: number; // 1-5
  is_best: boolean;
  is_worst: boolean;
  comments?: string;
  timestamp: Date;
  completion_time_seconds: number;
}

export interface UserProgress {
  user_id: string;
  completed_questions: string[];
  current_question_index: number;
  total_questions: number;
  started_at: Date;
  last_updated: Date;
  // Model-specific progress
  completed_by_model: Record<string, string[]>; // model -> completed question IDs
  current_question_by_model: Record<string, number>; // model -> current question index
}

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  selected_country?: string;
  created_at: Date;
  last_updated: Date;
}

export interface SurveyStats {
  total_responses: number;
  responses_by_model: Record<string, number>;
  responses_by_country: Record<string, number>;
  average_completion_time: number;
  unique_users: number;
}

// Attribution-based evaluation types
export interface AttributionStep {
  step: number;
  image_path: string;
  url: string;
  flux_url: string;
  qwen_url: string;
  prompt: string;
  label: string;
}

export interface AttributionQuestion {
  id: string;
  country: string;
  base_image: string;
  steps: AttributionStep[]; // step 1, 2, 3, 4, 5
  current_step: number;
  total_steps: number;
}

export interface AttributionResponse {
  question_id: string;
  user_id: string;
  country: string;
  base_image: string;
  step_responses: Record<number, {
    step: number;
    prompt: string;
    flux_url: string;
    qwen_url: string;
    flux_prompt_alignment: number; // 1-5
    flux_cultural_representation: number; // 1-5
    flux_image_quality: number; // 1-5
    qwen_prompt_alignment: number; // 1-5
    qwen_cultural_representation: number; // 1-5
    qwen_image_quality: number; // 1-5
  }>;
  comments?: string;
  timestamp: Date;
  completion_time_seconds: number;
}
