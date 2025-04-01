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
      console.log(`Fetching profile for user_id: ${user.id}`);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // PGRST116 means no row found, which is okay, we'll create a default one locally for the form
      if (fetchError && fetchError.code !== 'PGRST116') { // Fixed: &amp;&amp; -> &&
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      if (data) {
        console.log('Profile data fetched from Supabase:', data);
        // Ensure gender is valid before setting state
        if (data.gender !== 'male' && data.gender !== 'female') { // Fixed: &amp;&amp; -> &&
          data.gender = undefined;
        }
        // Add email from auth user to the local profile state for form display
        setProfile({ ...data, email: user.email } as Profile);
      } else {
        console.log('No profile found in Supabase for user, creating default for form.');
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
        setProfile(defaultProfile);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
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

    try {
      // Prepare data for Supabase: ensure user_id is set, remove email
      const profileToSave = {
        ...updatedProfileData,
        user_id: user.id, // Ensure user_id is always the logged-in user's ID
        // email is intentionally omitted as it's not in the 'profiles' table
      };

      // Ensure gender is valid before saving
      if (profileToSave.gender !== 'male' && profileToSave.gender !== 'female') { // Fixed: &amp;&amp; -> &&
        profileToSave.gender = undefined; // Or null if your DB allows it
      }

      console.log('Attempting to upsert profile to Supabase:', profileToSave);

      // Perform the upsert operation
      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileToSave, {
          onConflict: 'user_id', // Specify the conflict target column
          // returning: 'minimal', // Deprecated, use prefer: 'minimal'
        })
        .select() // Select the upserted data to update local state
        .single(); // Expecting a single row back

      if (upsertError) {
        console.error('Supabase upsert error:', upsertError);
        throw upsertError;
      }

      console.log('Profile successfully upserted to Supabase:', data);

      // Update local state with the data returned from Supabase (including any defaults/triggers)
      // Add back the email from the auth user for local state consistency
      if (data) {
         setProfile({ ...data, email: user.email } as Profile);
      } else {
        // Fallback: update local state with the data we sent, plus email
        // This might happen if 'select()' doesn't return data as expected in some edge cases
         setProfile({ ...profileToSave, email: user.email } as Profile);
         console.warn("Supabase upsert didn't return data, updating local state with sent data.");
      }


    } catch (err: any) {
      console.error('Error saving profile to Supabase:', err);
      setError(err.message || 'Failed to save profile');
      // Optionally re-fetch profile on error? Or just show error message.
      // await fetchProfile(); // Example: Re-fetch to ensure consistency
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
