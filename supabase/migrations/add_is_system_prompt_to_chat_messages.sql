/*
  # Add is_system_prompt column to chat_messages table

  1. Alter chat_messages table
    - Add `is_system_prompt` (boolean, default false)
  2. Update Policies
    - Ensure existing policies still apply correctly (they should, as this is just a new column)
*/

-- Add the new column with a default value of false
ALTER TABLE chat_messages
ADD COLUMN is_system_prompt boolean DEFAULT false;

-- Create an index on is_system_prompt for faster filtering
CREATE INDEX chat_messages_is_system_prompt_idx ON chat_messages (is_system_prompt);

-- Note: Existing RLS policies on chat_messages already filter by user_id.
-- Adding this column does not inherently break those policies, as users can still only
-- see/insert/update their own rows. The filtering for display happens client-side
-- based on this new column. No policy changes are strictly necessary for basic RLS,
-- but you might consider policies that prevent users from *setting* this flag to true
-- if that's a security concern (e.g., only RLS bypass or specific roles can set it).
-- For this implementation, we assume the client sets it correctly and the filtering
-- is handled in the application logic.
