import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  saveProfile: (profile: Profile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // PGRST116 means no row found, which is okay, we'll create a default one
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data) {
          // Ensure gender is valid before setting state
          if (data.gender !== 'male' && data.gender !== 'female') {
            data.gender = undefined; // Or null if your DB column allows it
          }
          setProfile(data as Profile);
        } else {
          // Create a default profile if none exists
          const defaultProfile: Profile = {
            user_id: user.id,
            nickname: user.nickname || '', // Use nickname from auth user if available
            email: user.email || '', // Use email from auth user
            language: 'EN',
            gender: undefined, // No default gender
            response_length: 'medium',
            reminders_enabled: false,
            top_goals: [],
            other_goal: '', // Default for new field
            avoid_topics: [],
            other_avoid_topic: '', // Default for new field
            emoji_preference: 'less', // Default for new field
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
          // No need to save the default profile here, let the user save it explicitly
          setProfile(defaultProfile);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const saveProfile = async (updatedProfile: Profile) => {
    if (!user) {
      setError('You must be logged in to save profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure user_id is set correctly from the authenticated user
      const profileToSave = {
        ...updatedProfile,
        user_id: user.id, // Always use the current user's ID
        email: user.email, // Always use the current user's email
      };

      // Ensure gender is valid before saving
      if (profileToSave.gender !== 'male' && profileToSave.gender !== 'female') {
        profileToSave.gender = undefined; // Or null depending on DB schema
      }

      // Remove id field if it exists from previous structures, as user_id is the primary key
      // delete (profileToSave as any).id;

      console.log('Attempting to save profile:', profileToSave);


      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileToSave, { onConflict: 'user_id' })
        .select() // Select the upserted data
        .single(); // Expect a single row back

      if (upsertError) {
        console.error('Supabase upsert error:', upsertError);
        throw upsertError;
      }

      console.log('Profile saved successfully:', data);
      setProfile(data as Profile); // Update local state with the saved data (including any db defaults/triggers)

    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      // Re-throw the error if you want calling components to handle it
      // throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, saveProfile }}>
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
