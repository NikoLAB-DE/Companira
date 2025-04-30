import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported
import { useNavigate } from 'react-router-dom';
import { AuthError, AuthResponse, SignUpWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js';

// --- Constants ---
const SESSION_STORAGE_KEY_PREFIX = 'companira-chat-history-'; // Must match ChatContext

// --- Helper Functions ---
const getNickname = (userData: any): string => {
  // Prioritize user_metadata.name (set after signup), then user_metadata.nickname (set during signup)
  return userData?.user_metadata?.name || userData?.user_metadata?.nickname || 'User';
};

const clearChatHistoryFromStorage = (userId: string | undefined) => {
    const key = userId ? `${SESSION_STORAGE_KEY_PREFIX}${userId}` : null;
    if (key) {
        try {
            sessionStorage.removeItem(key);
            // console.log(`[AuthContext] Cleared chat history from sessionStorage for key: ${key} during logout.`);
        } catch (error) {
            console.error('[AuthContext] Error clearing chat history from sessionStorage during logout:', error);
        }
    } else {
        // console.warn("[AuthContext] Attempted to clear chat history on logout, but user ID was missing.");
    }
};


// --- Context Definition ---
interface AuthContextType {
  user: User | null;
  loading: boolean; // Global loading state (initial check, auth changes)
  signIn: (identifier: string, password: string) => Promise<AuthResponse>;
  signUp: (nickname: string, email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  error: string | null; // Context-level error state (consider removing if unused)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Global loading: true initially, false after session check/auth change
  const [error, setError] = useState<string | null>(null); // Context-level error state
  const navigate = useNavigate();

  // Effect: Check initial session and subscribe to auth changes
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const checkSession = async () => {
      // console.log("[AuthContext] Checking initial session...");
      // Keep setLoading(true) here - it was set initially
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          if (session) {
            // console.log("[AuthContext] Session found:", session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email || undefined,
              nickname: getNickname(session.user) // Use helper function
            });
          } else {
            // console.log("[AuthContext] No active session found.");
            setUser(null);
          }
          setError(null); // Clear previous errors on successful check
        }
      } catch (err: any) {
        console.error('[AuthContext] Session check error:', err.message);
        if (isMounted) {
          // Don't set the context-level error here, let components handle specific errors
          setUser(null);
        }
      } finally {
        if (isMounted) {
          // console.log("[AuthContext] Initial session check complete. Setting loading to false.");
          setLoading(false); // <--- Set loading false after initial check completes
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return; // Don't update if unmounted

        // console.log("[AuthContext] onAuthStateChange triggered. Event:", _event);
        setLoading(true); // Set loading true during state transition
        if (session && session.user) {
          // console.log("[AuthContext] Auth state changed: User logged in", session.user.id, "Nickname:", getNickname(session.user));
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            nickname: getNickname(session.user) // Use helper function
          });
        } else {
          // console.log("[AuthContext] Auth state changed: User logged out or session expired");
          setUser(null);
        }
        setError(null); // Clear context-level errors on auth change
        // console.log("[AuthContext] onAuthStateChange processing complete. Setting loading to false.");
        setLoading(false); // <--- Set loading false after processing auth change
      }
    );

    return () => {
      isMounted = false;
      // console.log("[AuthContext] Unsubscribing from onAuthStateChange.");
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // --- signUp ---
  const signUp = async (nickname: string, email: string, password: string): Promise<AuthResponse> => {
    // Note: signUp doesn't need to manage the global loading state,
    // as onAuthStateChange will handle it upon successful signup/confirmation.
    try {
      // console.log("[AuthContext] Starting signUp process for email:", email);

      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: { data: { nickname: nickname } }
      };

      // console.log("[AuthContext] Attempting to sign up user with Supabase:", email);
      const response = await supabase.auth.signUp(credentials);
      // console.log("[AuthContext] Supabase signUp response:", response);

      if (response.error) {
        console.error("[AuthContext] Supabase signUp returned an error:", response.error);
        let errorMessage = response.error.message;
        if (errorMessage.includes('User already registered')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (errorMessage.includes('Password should be at least 6 characters')) {
           errorMessage = 'Password is too short. It must be at least 6 characters long.';
        }
        return { ...response, error: { ...response.error, message: errorMessage } };
      }

      if (response.data.user) {
        const newUserId = response.data.user.id;
        // console.log(`[AuthContext] New user created: ${newUserId}. Attempting post-signup actions.`);

        // 1. Create Default Threads
        const defaultThreadTitles = ["Main Chat", "Summary", "Journal", "To-Do", "Pinned", "Analysis"];
        const defaultThreads = defaultThreadTitles.map(title => ({ user_id: newUserId, title: title }));
        try {
          // console.log(`[AuthContext] Inserting ${defaultThreads.length} default threads for user ${newUserId}...`);
          const { error: insertError } = await supabase.from('chat_threads').insert(defaultThreads);
          if (insertError) console.error(`[AuthContext] Error creating default chat threads for user ${newUserId}:`, insertError.message);
          // else console.log(`[AuthContext] Successfully created default threads for user ${newUserId}`);
        } catch (threadError: any) {
           console.error(`[AuthContext] Unexpected error during default thread creation for user ${newUserId}:`, threadError?.message || threadError);
        }

        // 2. Update user metadata 'name'
        try {
            const { error: updateError } = await supabase.auth.updateUser({ data: { name: nickname } });
            if (updateError) console.warn("[AuthContext] Supabase updateUser error (setting 'name' metadata):", updateError.message);
            // else console.log("[AuthContext] User metadata 'name' updated successfully after signup.");
        } catch (updateMetaError: any) {
             console.error(`[AuthContext] Unexpected error during user metadata update for user ${newUserId}:`, updateMetaError?.message || updateMetaError);
        }
      } else if (!response.error) {
         console.warn("[AuthContext] Supabase signUp returned no error and no user data. Unexpected.");
         return { data: { user: null, session: null }, error: { name: 'SignUpIncompleteError', message: 'Sign up process seems incomplete.' } };
      }

      return response;

    } catch (err: any) {
      console.error("[AuthContext] Caught unexpected error during signUp process:", err);
      const authError: AuthError = { name: err.name || 'SignUpCatchError', message: err.message || 'An unexpected error occurred during sign up.', status: err.status };
      return { data: { user: null, session: null }, error: authError };
    }
  };


  // --- signIn ---
  const signIn = async (identifier: string, password: string): Promise<AuthResponse> => {
    // This function *will* manage the global loading state during the attempt
    setLoading(true); // <--- Set global loading TRUE at the start of the attempt
    setError(null); // Clear previous context errors
    let response: AuthResponse | null = null; // Define response variable outside try
    try {
      const isEmail = identifier.includes('@'); // Simplified check
      if (!isEmail) {
         setLoading(false); // <--- Set global loading FALSE before returning early
         return { data: { user: null, session: null }, error: { name: 'SignInInputError', message: 'Please enter a valid email address.' } };
      }

      // console.log("[AuthContext] Attempting sign in for email:", identifier);
      response = await supabase.auth.signInWithPassword({ email: identifier, password });
      // console.log("[AuthContext] Supabase signIn response:", response);

      if (response.error) {
        console.error("[AuthContext] Supabase signIn error:", response.error.message);
        let errorMessage = response.error.message;
        if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your details and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = 'Please check your inbox to confirm your email address before logging in.';
        }
        // Return the response containing the potentially modified error
        // The finally block will handle setLoading(false)
        return {
            ...response,
            error: { ...response.error, message: errorMessage }
        };
      }

      // Successful sign-in. The onAuthStateChange listener will update the user state.
      // console.log("[AuthContext] Sign in successful for:", response.data.user?.email);
      // The finally block will handle setLoading(false)
      return response;

    } catch (err: any) {
      // Catch unexpected errors (e.g., network issues)
      console.error("[AuthContext] Caught unexpected signIn error:", err);
       const authError: AuthError = {
        name: err.name || 'SignInCatchError',
        message: err.message || 'An unexpected network or system error occurred during sign in.',
        status: err.status
      };
      // The finally block will handle setLoading(false)
      return { data: { user: null, session: null }, error: authError };
    } finally {
      // CRITICAL: Ensure global loading is set to false regardless of success/error/early return
      // console.log("[AuthContext] signIn attempt finished. Setting loading to false.");
      setLoading(false); // <--- Set global loading FALSE in finally block
    }
  };

  // --- signOut ---
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    // SignOut also manages global loading state because it triggers onAuthStateChange
    setLoading(true); // Indicate sign-out process started
    const userIdToClear = user?.id;
    // console.log(`[AuthContext] Preparing to sign out user: ${userIdToClear}`);
    let result: { error: AuthError | null } = { error: null };

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      result = { error: signOutError }; // Store result

      if (signOutError) {
        console.error("[AuthContext] Supabase signOut error:", signOutError);
      } else {
        // console.log("[AuthContext] Supabase signOut successful.");
      }

      // Clear local data associated with the user *after* successful sign out call attempt
      clearChatHistoryFromStorage(userIdToClear);

      // Navigate immediately after initiating sign out.
      // UI updates when onAuthStateChange clears user state and sets loading false.
      navigate('/');

    } catch (err: any) {
      console.error("[AuthContext] Caught unexpected signOut error:", err);
      clearChatHistoryFromStorage(userIdToClear); // Attempt cleanup even on error
      const authError: AuthError = { name: err.name || 'SignOutCatchError', message: err.message || 'An unexpected error occurred during sign out.', status: err.status };
      result = { error: authError }; // Store error result
      navigate('/'); // Ensure navigation even on error
    } finally {
        // Don't set loading false here. Let onAuthStateChange handle it
        // after the user state is confirmed null. Setting it here might cause flicker.
        // console.log("[AuthContext] signOut process initiated. Waiting for onAuthStateChange.");
    }
    return result; // Return the stored result
  };

  // --- Context Value ---
  const value = { user, loading, signIn, signUp, signOut, error };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when initial loading is complete, OR if a user is already loaded (avoids blank screen during auth state changes) */}
      {(!loading || user) ? children : <div className="flex items-center justify-center h-screen"><p>Loading Authentication...</p></div> /* Basic centered loading */}
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
