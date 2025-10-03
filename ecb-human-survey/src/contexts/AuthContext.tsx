"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'sonner';
import { createUserProfile, getUserProfile, updateUserProfile } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  userProfile: { selected_country?: string; consent?: boolean } | null;
  updateUserCountry: (country: string) => Promise<void>;
  updateUserConsent: (consent: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ selected_country?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get or create user profile
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create new profile
            await createUserProfile({
              user_id: user.uid,
              email: user.email || '',
              display_name: user.displayName || '',
            });
            profile = await getUserProfile(user.uid);
          }
          
          // Ensure consent field exists for existing users
          if (profile && profile.consent === undefined) {
            await updateUserProfile({
              user_id: user.uid,
              consent: false,
            });
            profile = await getUserProfile(user.uid);
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          toast.error('Failed to load user profile');
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in', {
        description: (error as Error).message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out', {
        description: (error as Error).message,
      });
      throw error;
    }
  };

  const updateUserCountry = async (country: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await updateUserProfile({
        user_id: user.uid,
        selected_country: country,
      });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        selected_country: country,
      }));
      
    } catch (error) {
      console.error('Error updating user country:', error);
      throw error;
    }
  };

  const updateUserConsent = async (consent: boolean) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await updateUserProfile({
        user_id: user.uid,
        consent,
      });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        consent,
      }));
      
    } catch (error) {
      console.error('Error updating user consent:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    logout,
    userProfile,
    updateUserCountry,
    updateUserConsent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}