import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported
import { useNavigate } from 'react-router-dom';
import { AuthError, AuthResponse, SignUpWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js';

// --- Constants ---
const SESSION_STORAGE_KEY_PREFIX = 'companira-chat-history-'; // Must match ChatContext

// --- Helper Functions ---
const getNickname = (userData: any): string => {
  return userData?.user_metadata?.name || userData?.user_metadata?.nickname || 'User';
};

const clearChatHistoryFromStorage = (userId: string | undefined) => {
    const key = userId ? `${SESSION_STORAGE_KEY_PREFIX}${userId}` : null;
    if (key) {
        try {
            sessionStorage.removeItem(key);
            console.log(`Cleared chat history from sessionStorage for key: ${key} during logout.`);
        } catch (error) {
            console.error('Error clearing chat history from sessionStorage during logout:', error);
        }
    } else {
        console.warn("Attempted to clear chat history on logout, but user ID was missing.");
    }
};


// --- Context Definition ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<AuthResponse>;
  signUp: (nickname: string, email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  error: string | null; // This context-level error might be less useful now
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Context-level error state
  const navigate = useNavigate();

  // Effect: Check initial session and subscribe to auth changes
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          if (session) {
            setUser({
              id: session.user.id,
              email: session.user.email || undefined,
              nickname: getNickname(session.user)
            });
          } else {
            setUser(null);
          }
          setError(null); // Clear previous errors on successful check
        }
      } catch (err: any) {
        console.error('Session check error:', err.message);
        if (isMounted) {
          // Don't set the context-level error here, let components handle specific errors
          // setError(err.message || 'Failed to check session');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return; // Don't update if unmounted

        setLoading(true); // Set loading true during state transition
        if (session && session.user) {
          console.log("Auth state changed: User logged in", session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            nickname: getNickname(session.user)
          });
        } else {
          console.log("Auth state changed: User logged out or session expired");
          setUser(null);
        }
        setError(null); // Clear context-level errors on auth change
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // --- signUp ---
  const signUp = async (nickname: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log("Starting signUp process for email:", email);
      
      // First, explicitly check if the user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing user:", checkError);
      }
      
      // Also check auth.users if possible (may require admin rights)
      const { data: existingAuthUser, error: authCheckError } = await supabase.auth.admin
        ? await supabase.auth.admin.listUsers({ filter: { email } })
        : { data: null, error: null };
        
      if (authCheckError) {
        console.error("Error checking auth users:", authCheckError);
      }
      
      // If user exists in either check, return error
      if (existingUsers || (existingAuthUser && existingAuthUser.users && existingAuthUser.users.length > 0)) {
        console.log("User already exists check: Email is already registered");
        return {
          data: { user: null, session: null },
          error: {
            name: 'UserExistsError',
            message: 'This email is already registered. Please use a different email or try logging in.',
            status: 400
          }
        };
      }

      // Alternative approach: Try to sign in with the email
      // This is a workaround since Supabase doesn't provide a direct "check if user exists" API for non-admin
      const { error: signInCheckError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_for_check_only'
      });

      // If the error message indicates the user exists but password is wrong,
      // we know the email is already registered
      if (signInCheckError && signInCheckError.message.includes('Invalid login credentials')) {
        console.log("User already exists check via sign-in: Email is already registered");
        return {
          data: { user: null, session: null },
          error: {
            name: 'UserExistsError',
            message: 'This email is already registered. Please use a different email or try logging in.',
            status: 400
          }
        };
      }

      // If we get here, either the user doesn't exist or there was a different error
      // Proceed with normal signup
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: { data: { nickname: nickname } } // Store nickname in metadata during signup
      };
      
      console.log("Attempting to sign up user with email:", email);
      const response = await supabase.auth.signUp(credentials);
      console.log("Supabase signUp response:", response);

      // If Supabase returns an error (like user exists), it will be in response.error
      if (response.error) {
        console.error("Supabase signUp returned an error:", response.error);
        
        // Enhance error message for common cases
        if (response.error.message.includes('already registered')) {
          response.error.message = 'This email is already registered. Please use a different email or try logging in.';
        }
        
        return response;
      }

      // --- START: Default Thread Creation (only if signup was successful and user exists) ---
      if (response.data.user) {
        const newUserId = response.data.user.id;
        console.log(`New user created with ID: ${newUserId}. Attempting to create default threads.`);

        const defaultThreads = [
          { user_id: newUserId, title: 'Main Chat' },
          { user_id: newUserId, title: 'Summary' },
          { user_id: newUserId, title: 'To-Do' },
          { user_id: newUserId, title: 'Journal' },
        ];

        try {
          const { error: insertError } = await supabase
            .from('chat_threads') // Ensure this matches your table name
            .insert(defaultThreads);

          if (insertError) {
            console.error(`Error creating default chat threads for user ${newUserId}:`, insertError.message);
          } else {
            console.log(`Successfully created default threads for user ${newUserId}`);
          }
        } catch (threadError: any) {
           console.error(`Unexpected error during default thread creation for user ${newUserId}:`, threadError?.message || threadError);
        }
        // --- END: Default Thread Creation ---

        // Update user metadata for display name
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name: nickname }
        });
        if (updateError) {
          console.warn("Supabase updateUser error (setting name metadata):", updateError.message);
        } else {
          console.log("User metadata 'name' updated successfully after signup.");
        }
      } else if (!response.error) {
         // This case should ideally not happen if Supabase signup worked without error
         console.warn("Supabase signUp returned no error and no user data. This is unexpected.");
         // Return a generic error response
         return {
            data: { user: null, session: null },
            error: { name: 'SignUpError', message: 'Sign up completed but no user data received.' }
         };
      }

      // Auth state change listener will update the user state eventually
      return response; // Return the successful response

    } catch (err: any) {
      // This catch block might handle network errors or unexpected issues *before* Supabase responds
      console.error("Caught unexpected error during signUp process:", err);

      // Construct a standard AuthError object
      const authError: AuthError = {
        name: err.name || 'SignUpCatchError',
        message: err.message || 'An unexpected error occurred during sign up',
        status: err.status
      };
      // Return the error in the standard AuthResponse format
      return { data: { user: null, session: null }, error: authError };
    }
  };


  // --- signIn ---
  const signIn = async (identifier: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const isEmail = identifier.includes('@');
      if (!isEmail) {
         // Return error in AuthResponse format
         return { data: { user: null, session: null }, error: { name: 'SignInInputError', message: 'Please log in using your email address.' } };
      }

      const response = await supabase.auth.signInWithPassword({ email: identifier, password });

      if (response.error) {
        console.error("Supabase signIn error:", response.error);
        // Return the response containing the error
        return response;
      }

      // Auth state change listener will update the user state
      return response;
    } catch (err: any) {
      console.error("Caught unexpected signIn error:", err);
       const authError: AuthError = {
        name: err.name || 'SignInCatchError',
        message: err.message || 'An unexpected error occurred during sign in',
        status: err.status
      };
      return { data: { user: null, session: null }, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // --- signOut ---
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    const userIdToClear = user?.id;
    console.log(`Preparing to sign out user: ${userIdToClear}`);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Supabase signOut error:", signOutError);
      }

      clearChatHistoryFromStorage(userIdToClear);
      navigate('/'); // Navigate immediately after initiating sign out

      // User state will be cleared by the onAuthStateChange listener
      return { error: signOutError };

    } catch (err: any) {
      console.error("Caught unexpected signOut error:", err);
      clearChatHistoryFromStorage(userIdToClear); // Clear even on unexpected error
      const authError: AuthError = {
        name: err.name || 'SignOutCatchError',
        message: err.message || 'Unknown sign out error',
        status: err.status
      };
      return { error: authError };
    } finally {
      // Loading state will be handled by onAuthStateChange
    }
  };

  // --- Context Value ---
  const value = { user, loading, signIn, signUp, signOut, error }; // Keep 'error' for now if needed elsewhere

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when initial loading is complete */}
      {!loading || user ? children : <div>Loading Authentication...</div> /* Or a global loading indicator */}
    </AuthContext.Provider>
  );
};

// --- Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
