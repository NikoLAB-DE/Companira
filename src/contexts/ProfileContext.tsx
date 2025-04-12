import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileContextType { 
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  saveProfileToSupabase: (profile: Omit<Profile, 'email'>) => Promise<void>; // Updated function signature
  fetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[ProfileContext] Fetching profile for user_id: ${user.id}`); // Added Context prefix
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[ProfileContext] Supabase fetch error:', fetchError); // Added Context prefix
        throw fetchError;
      }

      if (data) {
        console.log('[ProfileContext] Profile data fetched from Supabase:', data); // Added Context prefix
        if (data.gender !== 'male' && data.gender !== 'female') {
          data.gender = undefined;
        }
        // Add email from auth user to the local profile state for form display
        const fetchedProfile = { ...data, email: user.email } as Profile;
        console.log('[ProfileContext] Setting fetched profile state:', fetchedProfile); // Added Context prefix
        setProfile(fetchedProfile);
      } else {
        console.log('[ProfileContext] No profile found in Supabase for user, creating default for form.'); // Added Context prefix
        // Create a default profile locally if none exists in DB
        const defaultProfile: Profile = {
          user_id: user.id,
          nickname: user.nickname || '',
          email: user.email || '', // Use email from auth user
          language: 'EN',
          gender: undefined,
          assistant_name: '',
          response_length: 'medium',
          reminders_enabled: false,
          top_goals: [],
          other_goal: '',
          avoid_topics: [],
          other_avoid_topic: '',
          emoji_preference: 'less',
          persona: '',
          tone: '',
          content_style: '',
          current_situation: '',
          focused_problem: '',
          telegram_handle: '',
          reminder_type: '',
          reminder_frequency: '',
          reminder_channel: '',
          reminder_time: '',
          preferred_response_style: '',
        };
        console.log('[ProfileContext] Setting default profile state:', defaultProfile); // Added Context prefix
        setProfile(defaultProfile);
      }
    } catch (err: any) {
      console.error('[ProfileContext] Error fetching profile:', err); // Added Context prefix
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Function to save profile data to Supabase using upsert
  const saveProfileToSupabase = async (updatedProfileData: Omit<Profile, 'email'>) => {
    if (!user) {
      setError('You must be logged in to save profile');
      return;
    }

    setLoading(true);
    setError(null);

    // --- Debug Log 1: Data received from form ---
    console.log('[ProfileContext] saveProfileToSupabase received:', updatedProfileData);

    try {
      // Prepare data for Supabase: ensure user_id is set, remove email
      const profileToSave = {
        ...updatedProfileData,
        user_id: user.id, // Ensure user_id is always the logged-in user's ID
        // email is intentionally omitted as it's not in the 'profiles' table
      };

      // Ensure gender is valid before saving
      if (profileToSave.gender !== 'male' && profileToSave.gender !== 'female') {
        profileToSave.gender = undefined; // Or null if your DB allows it
      }

      // --- Debug Log 2: Data prepared for Supabase ---
      console.log('[ProfileContext] Attempting to upsert profile to Supabase:', profileToSave);

      // Perform the upsert operation
      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileToSave, {
          onConflict: 'user_id', // Specify the conflict target column
        })
        .select() // Select the upserted data to update local state
        .single(); // Expecting a single row back

      if (upsertError) {
        console.error('[ProfileContext] Supabase upsert error:', upsertError); // Added Context prefix
        throw upsertError;
      }

      // --- Debug Log 3: Data returned from Supabase ---
      console.log('[ProfileContext] Profile successfully upserted, Supabase returned:', data);

      // Update local state with the data returned from Supabase (including any defaults/triggers)
      // Add back the email from the auth user for local state consistency
      if (data) {
         const profileWithEmail = { ...data, email: user.email } as Profile;
         // --- Debug Log 4: Data being set to local state ---
         console.log('[ProfileContext] Setting profile state after save:', profileWithEmail);
         setProfile(profileWithEmail);
      } else {
        // Fallback: update local state with the data we sent, plus email
         const profileWithEmail = { ...profileToSave, email: user.email } as Profile;
         // --- Debug Log 5: Fallback data being set to local state ---
         console.warn("[ProfileContext] Supabase upsert didn't return data, updating local state with sent data.");
         console.log('[ProfileContext] Setting profile state after save (fallback):', profileWithEmail);
         setProfile(profileWithEmail);
      }


    } catch (err: any) {
      console.error('[ProfileContext] Error saving profile to Supabase:', err); // Added Context prefix
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, saveProfileToSupabase, fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
