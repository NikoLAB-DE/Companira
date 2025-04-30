import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import supabase client

interface AdminContextType {
  isAdmin: boolean;
  registerLogoClick: () => void;
  // No need for explicit reset function in value, handled internally
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const CLICK_THRESHOLD = 5; // Number of clicks required
const CLICK_INTERVAL = 2000; // Time window in milliseconds (2 seconds)

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const clickTimestamps = useRef<number[]>([]);
  const currentUserId = useRef<string | null>(null); // Keep track of the logged-in user ID

  // Effect to listen for Authentication changes
  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUserId.current = session?.user?.id ?? null;
      // Ensure admin is false on initial load if no session or different user
      if (!session || currentUserId.current !== session?.user?.id) {
        setIsAdmin(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUserId = session?.user?.id ?? null;
        // Reset admin state if:
        // 1. User logs out (newUserId is null)
        // 2. A different user logs in (newUserId is different from currentUserId.current)
        if (newUserId === null || (newUserId !== null && newUserId !== currentUserId.current)) {
          console.log('Auth state changed (logout or different user), resetting admin mode.');
          setIsAdmin(false);
          clickTimestamps.current = []; // Clear click history on auth change
        }
        // Update the current user ID tracker
        currentUserId.current = newUserId;
      }
    );

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // Callback to register logo clicks and toggle admin state
  const registerLogoClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter(
      timestamp => now - timestamp < CLICK_INTERVAL
    );

    if (clickTimestamps.current.length >= CLICK_THRESHOLD) {
      // Toggle admin state
      setIsAdmin(prevIsAdmin => {
        const newState = !prevIsAdmin;
        console.log(`Admin mode ${newState ? 'activated' : 'deactivated'}!`);
        return newState;
      });
      // Clear timestamps after successful toggle
      clickTimestamps.current = [];
    }
    // Optional: Log clicks for debugging
    // console.log('Logo clicked. Timestamps:', clickTimestamps.current, 'IsAdmin:', isAdmin);

  }, []); // Dependency array is empty as it uses refs and setIsAdmin

  return (
    <AdminContext.Provider value={{ isAdmin, registerLogoClick }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
