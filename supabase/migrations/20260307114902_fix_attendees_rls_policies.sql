/*
  # Fix Attendees RLS Policies

  1. Changes
    - Drop overly restrictive app_id-based policies
    - Keep simple public access policies for event registration
    - Ensure anonymous users can register for events

  2. Security
    - Public INSERT access for registration
    - Public SELECT access for viewing attendees (needed for check-in)
    - Public UPDATE access for check-in functionality
    - Public DELETE access for admin operations
*/

-- Drop the restrictive app_id-based policies
DROP POLICY IF EXISTS "Users can insert attendees for their app" ON attendees;
DROP POLICY IF EXISTS "Users can view attendees for their app" ON attendees;
DROP POLICY IF EXISTS "Users can update attendees for their app" ON attendees;
DROP POLICY IF EXISTS "Users can delete attendees for their app" ON attendees;

-- Ensure the simple public policies exist
DO $$
BEGIN
  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'Anyone can insert attendees'
  ) THEN
    CREATE POLICY "Anyone can insert attendees"
      ON attendees FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'Anyone can view attendees'
  ) THEN
    CREATE POLICY "Anyone can view attendees"
      ON attendees FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'Anyone can update attendees'
  ) THEN
    CREATE POLICY "Anyone can update attendees"
      ON attendees FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attendees' 
    AND policyname = 'Anyone can delete attendees'
  ) THEN
    CREATE POLICY "Anyone can delete attendees"
      ON attendees FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
