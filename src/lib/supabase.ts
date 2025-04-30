import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if the connection is working
export const checkSupabaseConnection = async () => {
  try {
    // Attempt to fetch a small amount of data from a public table or a table with RLS enabled for authenticated users
    // Using 'chat_threads' which should have RLS for authenticated users
    const { data, error } = await supabase.from('chat_threads').select('id', { head: true }).limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    // console.log('Supabase connection successful'); // Removed log
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
};

// Helper function to fetch a specific chat thread ID by user ID and title
export const fetchThreadIdByTitle = async (userId: string, title: string): Promise<string | null> => {
  // console.log(`[Supabase Lib] Fetching thread ID for user: ${userId}, title: "${title}"`); // Removed log
  try {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle(); // Use maybeSingle to handle cases where no thread is found

    if (error) {
      console.error(`[Supabase Lib] Supabase error fetching thread ID for "${title}":`, error);
      // Depending on the error, you might want to throw or return null
      // For now, let's return null on any Supabase error during fetch
      return null;
    }

    if (data) {
      // console.log(`[Supabase Lib] Thread ID found for "${title}": ${data.id}`); // Removed log
      return data.id;
    } else {
      console.warn(`[Supabase Lib] No thread found for user ${userId} with title "${title}".`);
      return null;
    }
  } catch (err: any) {
    console.error(`[Supabase Lib] Unexpected JS error fetching thread ID for "${title}":`, err);
    // Catch any unexpected JavaScript errors during the process
    return null;
  }
};
