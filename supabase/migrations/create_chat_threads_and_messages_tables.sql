/*
  # Create chat_threads and chat_messages tables

  1. New Tables
    - `chat_threads`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, foreign key to auth.users, not null)
      - `title` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `chat_messages`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `thread_id` (uuid, foreign key to chat_threads, not null)
      - `user_id` (uuid, foreign key to auth.users, not null)
      - `content` (text, not null)
      - `role` (text, not null, check 'user' or 'assistant')
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `chat_threads` and `chat_messages` tables
    - Add policies for authenticated users to manage their own threads and messages
  3. Changes
    - Renamed message content field from `message` to `content` for clarity.
*/

-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES chat_threads(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_threads
-- Authenticated users can view their own threads
CREATE POLICY "Authenticated users can view their own chat threads"
  ON chat_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own threads
CREATE POLICY "Authenticated users can insert their own chat threads"
  ON chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own threads (e.g., title)
CREATE POLICY "Authenticated users can update their own chat threads"
  ON chat_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for chat_messages
-- Authenticated users can view their own messages
CREATE POLICY "Authenticated users can view their own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert their own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own messages (if needed, e.g., editing)
-- Note: Editing chat messages is not currently a UI feature, but policy is added for completeness.
CREATE POLICY "Authenticated users can update their own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a function to create default threads on new user signup
-- This function is triggered by a Supabase Auth trigger (not defined here, user must set it up)
-- Example trigger: CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create default chat threads for the new user
  INSERT INTO public.chat_threads (user_id, title)
  VALUES
    (NEW.id, 'Main Chat'),
    (NEW.id, 'Summary'),
    (NEW.id, 'Journal'),
    (NEW.id, 'To-Do'),
    (NEW.id, 'Pinned'),
    (NEW.id, 'Analysis');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a trigger for `updated_at` on `chat_threads`
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_on_chat_threads
BEFORE UPDATE ON chat_threads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
