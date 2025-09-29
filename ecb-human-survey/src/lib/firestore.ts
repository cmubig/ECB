import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SurveyResponse, UserProgress, SurveyStats, UserProfile, StepResponse, AttributionResponse } from '@/types/survey';

// Collections
const RESPONSES_COLLECTION = 'survey_responses';
const STEP_RESPONSES_COLLECTION = 'step_responses'; // New collection for individual step responses
const PROGRESS_COLLECTION = 'user_progress';
const STATS_COLLECTION = 'survey_stats';
const PROFILES_COLLECTION = 'user_profiles';
const ATTRIBUTION_RESPONSES_COLLECTION = 'attribution_responses';

export async function saveSurveyResponse(response: Omit<SurveyResponse, 'timestamp'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), {
      ...response,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving survey response:', error);
    throw error;
  }
}

// Save individual step responses (for detailed analysis like cultural_metrics_summary.csv)
export async function saveStepResponses(stepResponses: Omit<StepResponse, 'timestamp'>[]): Promise<void> {
  try {
    const batch = stepResponses.map(stepResponse =>
      addDoc(collection(db, STEP_RESPONSES_COLLECTION), {
        ...stepResponse,
        timestamp: serverTimestamp(),
      })
    );

    await Promise.all(batch);
  } catch (error) {
    console.error('Error saving step responses:', error);
    throw error;
  }
}

export async function saveAttributionResponse(response: Omit<AttributionResponse, 'timestamp' | 'completion_time_seconds'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ATTRIBUTION_RESPONSES_COLLECTION), {
      ...response,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving attribution response:', error);
    throw error;
  }
}

export async function getAttributionResponses(userId?: string, country?: string): Promise<AttributionResponse[]> {
  try {
    let q = query(collection(db, ATTRIBUTION_RESPONSES_COLLECTION));

    if (userId) {
      q = query(q, where('user_id', '==', userId));
    }
    if (country) {
      q = query(q, where('country', '==', country));
    }

    q = query(q, orderBy('timestamp', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        question_id: data.question_id,
        user_id: data.user_id,
        country: data.country,
        base_image: data.base_image,
        step_responses: data.step_responses,
        comments: data.comments,
        timestamp: data.timestamp?.toDate() || new Date(),
        completion_time_seconds: data.completion_time_seconds,
      } as AttributionResponse;
    });
  } catch (error) {
    console.error('Error getting attribution responses:', error);
    throw error;
  }
}

// Get step responses for analysis
export async function getStepResponses(userId?: string, model?: string): Promise<StepResponse[]> {
  try {
    let q = query(collection(db, STEP_RESPONSES_COLLECTION));
    
    if (userId) {
      q = query(q, where('user_id', '==', userId));
    }
    if (model) {
      q = query(q, where('model', '==', model));
    }
    
    q = query(q, orderBy('timestamp', 'desc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: data.uid,
        group_id: data.group_id,
        step: data.step,
        user_id: data.user_id,
        model: data.model,
        country: data.country,
        category: data.category,
        sub_category: data.sub_category,
        variant: data.variant,
        prompt: data.prompt,
        editing_prompt: data.editing_prompt,
        image_url: data.image_url,
        image_quality: data.image_quality,
        cultural_representative: data.cultural_representative,
        is_best: data.is_best,
        is_worst: data.is_worst,
        comments: data.comments,
        timestamp: data.timestamp?.toDate() || new Date(),
        completion_time_seconds: data.completion_time_seconds,
      } as StepResponse;
    });
  } catch (error) {
    console.error('Error getting step responses:', error);
    throw error;
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const docRef = doc(db, PROGRESS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        started_at: data.started_at?.toDate() || new Date(),
        last_updated: data.last_updated?.toDate() || new Date(),
      } as UserProgress;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

export async function updateUserProgress(progress: UserProgress): Promise<void> {
  try {
    const docRef = doc(db, PROGRESS_COLLECTION, progress.user_id);
    await updateDoc(docRef, {
      ...progress,
      last_updated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

export async function createUserProgress(progress: Omit<UserProgress, 'started_at' | 'last_updated'>): Promise<void> {
  try {
    const docRef = doc(db, PROGRESS_COLLECTION, progress.user_id);
    await setDoc(docRef, {
      ...progress,
      started_at: serverTimestamp(),
      last_updated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user progress:', error);
    throw error;
  }
}

export async function getUserResponses(userId: string): Promise<SurveyResponse[]> {
  try {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('user_id', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as SurveyResponse[];
  } catch (error) {
    console.error('Error getting user responses:', error);
    throw error;
  }
}

export async function getResponsesByModel(model: string, limitCount: number = 100): Promise<SurveyResponse[]> {
  try {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('model', '==', model),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as SurveyResponse[];
  } catch (error) {
    console.error('Error getting responses by model:', error);
    throw error;
  }
}

export async function getSurveyStats(): Promise<SurveyStats | null> {
  try {
    const docRef = doc(db, STATS_COLLECTION, 'global');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SurveyStats;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting survey stats:', error);
    throw error;
  }
}

export async function updateSurveyStats(stats: SurveyStats): Promise<void> {
  try {
    const docRef = doc(db, STATS_COLLECTION, 'global');
    await updateDoc(docRef, stats as unknown as Record<string, number | string | Record<string, number>>);
  } catch (error) {
    console.error('Error updating survey stats:', error);
    throw error;
  }
}

export async function hasUserCompletedQuestion(userId: string, questionId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('user_id', '==', userId),
      where('question_id', '==', questionId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if user completed question:', error);
    throw error;
  }
}

// User Profile functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        created_at: data.created_at?.toDate() || new Date(),
        last_updated: data.last_updated?.toDate() || new Date(),
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function createUserProfile(profile: Omit<UserProfile, 'created_at' | 'last_updated'>): Promise<void> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, profile.user_id);
    await setDoc(docRef, {
      ...profile,
      created_at: serverTimestamp(),
      last_updated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile> & { user_id: string }): Promise<void> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, profile.user_id);
    await updateDoc(docRef, {
      ...profile,
      last_updated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
