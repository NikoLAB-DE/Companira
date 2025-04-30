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
      console.log('[ProfileContext] No user logged in, setting profile to null.'); // Added log
      setProfile(null);
      setLoading(false); // Ensure loading is false if no user
      setError(null); // Clear any previous error
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`[ProfileContext] Fetching profile for user_id: ${user.id}`); // Added Context prefix

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // PGRST116 means "no rows found" for .single() - this is the case where the profile doesn't exist
          console.log('[ProfileContext] No profile found in Supabase for user.'); // Added log
          setProfile(null); // Set profile to null when not found
          setError(null); // Clear any previous error
        } else {
          // Handle other types of errors during fetch
          console.error('[ProfileContext] Supabase fetch error:', fetchError); // Added Context prefix
          setError(fetchError.message || 'Failed to load profile');
          setProfile(null); // Set profile to null on error
        }
      } else if (data) {
        // Profile found successfully
        console.log('[ProfileContext] Profile data fetched from Supabase:', data); // Added Context prefix
        // Ensure gender is valid before setting state
        if (data.gender !== 'male' && data.gender !== 'female') {
          data.gender = undefined;
        }
        // Add email from auth user to the local profile state for form display
        const fetchedProfile = { ...data, email: user.email } as Profile;
        console.log('[ProfileContext] Setting fetched profile state:', fetchedProfile); // Added Context prefix
        setProfile(fetchedProfile);
        setError(null); // Clear any previous error
      } else {
         // This case should ideally not happen if .single() is used and PGRST116 is handled,
         // but as a fallback, treat as no profile found.
         console.warn('[ProfileContext] Supabase fetch returned no data and no specific error. Treating as no profile found.');
         setProfile(null);
         setError(null);
      }
    } catch (err: any) {
      console.error('[ProfileContext] Unexpected error fetching profile:', err); // Added Context prefix
      setError(err.message || 'Failed to load profile');
      setProfile(null); // Set profile to null on unexpected error
    } finally {
      setLoading(false);
      console.log('[ProfileContext] Profile fetch complete. Loading set to false.'); // Added log
    }
  };


  useEffect(() => {
    console.log('[ProfileContext] User effect triggered. Fetching profile...'); // Added log
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Depend on user object (specifically user.id change)

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
        profileToSave.gender = null; // Use null for DB if undefined/invalid
      }

      // Ensure array fields are null if empty, not empty arrays, if DB schema prefers null
      if (profileToSave.top_goals && profileToSave.top_goals.length === 0) {
          (profileToSave as any).top_goals = null;
      }
       if (profileToSave.avoid_topics && profileToSave.avoid_topics.length === 0) {
          (profileToSave as any).avoid_topics = null;
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
         // Ensure gender is valid in returned data before setting state
         if (data.gender !== 'male' && data.gender !== 'female') {
           data.gender = undefined; // Use undefined for local state if null/invalid from DB
         }
         const profileWithEmail = { ...data, email: user.email } as Profile;
         // --- Debug Log 4: Data being set to local state ---
         console.log('[ProfileContext] Setting profile state after save:', profileWithEmail);
         setProfile(profileWithEmail);
      } else {
        // Fallback: update local state with the data we sent, plus email
        // Ensure gender is valid in sent data before setting state
         if (profileToSave.gender !== 'male' && profileToSave.gender !== 'female') {
           (profileToSave as any).gender = undefined; // Use undefined for local state
         }
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
