/*
      # Create pinned_items table

      1. New Tables
        - `pinned_items`
          - `id` (uuid, primary key, default gen_random_uuid())
          - `user_id` (uuid, foreign key to auth.users, not null)
          - `content` (text, not null)
          - `created_at` (timestamptz, default now())
          - `updated_at` (timestamptz, default now())
      2. Security
        - Enable RLS on `pinned_items` table
        - Add policies for authenticated users to manage their own pinned items
      3. Changes
        - Modeled after the `To_Do` table structure for consistency.
    */

    -- Create pinned_items table
    CREATE TABLE IF NOT EXISTS pinned_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      content text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE pinned_items ENABLE ROW LEVEL SECURITY;

    -- Policies for pinned_items
    -- Authenticated users can view their own pinned items
    CREATE POLICY "Authenticated users can view their own pinned items"
      ON pinned_items FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    -- Authenticated users can insert their own pinned items
    CREATE POLICY "Authenticated users can insert their own pinned items"
      ON pinned_items FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    -- Authenticated users can update their own pinned items
    CREATE POLICY "Authenticated users can update their own pinned items"
      ON pinned_items FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);

    -- Authenticated users can delete their own pinned items
    CREATE POLICY "Authenticated users can delete their own pinned items"
      ON pinned_items FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);

    -- Add an index on user_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_pinned_items_user_id ON public.pinned_items USING btree (user_id);

    -- Add a trigger for `updated_at` on `pinned_items`
    -- Assuming the handle_updated_at() function already exists from the chat tables migration
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_on_pinned_items') THEN
        CREATE TRIGGER set_updated_at_on_pinned_items
        BEFORE UPDATE ON pinned_items
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
      END IF;
    END $$;
