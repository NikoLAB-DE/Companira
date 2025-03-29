import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AuthError, AuthResponse, SignUpWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js'; // Import necessary types

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<AuthResponse>;
  signUp: (nickname: string, email: string, password: string) => Promise<AuthResponse>; // Email is now required, removed null option
  signOut: () => Promise<{ error: AuthError | null }>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to extract nickname
const getNickname = (userData: any): string => {
  // Prefer 'name' from metadata if it exists (for Display Name), fallback to 'nickname'
  return userData?.user_metadata?.name || userData?.user_metadata?.nickname || 'User';
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            nickname: getNickname(session.user) // Use helper function
          });
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Session check error:', err.message);
        setError(err.message || 'Failed to check session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            nickname: getNickname(session.user) // Use helper function
          });
        } else {
          setUser(null);
        }
        setError(null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- signUp ---
  const signUp = async (nickname: string, email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Sign up the user
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          // Store nickname in metadata initially as fallback/additional info
          data: {
            nickname: nickname
          }
        }
      };
      const response = await supabase.auth.signUp(credentials);

      if (response.error) {
        console.error("Supabase signUp error:", response.error);
        setError(response.error.message);
        return response; // Return the error response
      }

      // Step 2: If signup successful, update user metadata to set 'name' for Display Name
      if (response.data.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name: nickname } // Set 'name' field in user_metadata
        });

        if (updateError) {
          console.warn("Supabase updateUser error (setting name):", updateError.message);
          // Don't necessarily fail the whole process, but log the warning.
          // The user is created, just the display name might not be set immediately.
          // onAuthStateChange might pick up the initial metadata anyway.
          setError(`Signup successful, but failed to set display name: ${updateError.message}`);
        } else {
           // Successfully signed up and updated display name hint
           // The onAuthStateChange listener will handle setting the user state
           console.log("User signed up and display name updated successfully.");
        }
      }

      return response; // Return the original signUp response

    } catch (err: any) {
      console.error("Caught signUp error:", err);
      setError(err.message || 'An unexpected error occurred during sign up');
      return { data: { user: null, session: null }, error: { name: 'SignUpError', message: err.message || 'Unknown sign up error' } as AuthError };
    } finally {
      setLoading(false);
    }
  };


  // --- signIn ---
 const signIn = async (identifier: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Enforce email-only login
      const isEmail = identifier.includes('@');
      if (!isEmail) {
          throw new Error('Please log in using your email address.');
      }

      const response = await supabase.auth.signInWithPassword({
        email: identifier, // Use identifier directly as it's confirmed to be email
        password
      });

      if (response.error) {
        console.error("Supabase signIn error:", response.error);
        setError(response.error.message);
      } else if (response.data.user) {
        // User state will be set by onAuthStateChange
      }

      return response; // Return the full response object { data, error }

    } catch (err: any) {
      console.error("Caught signIn error:", err);
      setError(err.message || 'An unexpected error occurred during sign in');
      return { data: { user: null, session: null }, error: { name: 'SignInError', message: err.message || 'Unknown sign in error' } as AuthError };
    } finally {
      setLoading(false);
    }
  };


  // --- signOut ---
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("Supabase signOut error:", signOutError);
        setError(signOutError.message);
        throw signOutError;
      }
      // User state cleared by onAuthStateChange listener
      navigate('/');
      return { error: null };
    } catch (err: any) {
      console.error("Caught signOut error:", err);
      setError(err.message || 'Error signing out');
      return { error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
