export interface User {
  id: string;
  email?: string;
  nickname: string; // Added nickname here based on previous context
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

// Updated Profile interface
export interface Profile {
  user_id: string; // Changed from id to user_id to match Supabase column
  nickname: string;
  email?: string; // Keep email optional here, but enforce in form
  telegram_handle?: string;
  language?: 'EN' | 'DE' | 'UK';

  // Life Context
  current_situation?: string;
  focused_problem?: string;
  top_goals?: string[];
  other_goal?: string; // New field for custom goal

  // Assistant Setup
  persona?: string;
  tone?: string;
  gender?: 'male' | 'female'; // Removed 'neutral'
  response_length?: 'short' | 'medium' | 'long';
  content_style?: string;

  // Reminders
  reminders_enabled?: boolean;
  reminder_type?: string;
  reminder_frequency?: string;
  reminder_channel?: string;
  reminder_time?: string; // Store as string (HH:MM)

  // Additional
  avoid_topics?: string[];
  other_avoid_topic?: string; // New field for custom topic to avoid
  preferred_response_style?: string;
  emoji_preference?: 'none' | 'less' | 'more'; // New field for emoji preference

  // Deprecated/Old fields (if any, keep for potential migration if needed)
  // name?: string;
  // bio?: string;
  // preferences?: {
  //   theme?: 'light' | 'dark';
  //   notifications?: boolean;
  //   language?: string; // Old language field if different from top-level
  // };
}
