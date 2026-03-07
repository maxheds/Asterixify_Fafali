/*
  # Add Gender Field to Attendees

  1. Changes
    - Add `gender` column to attendees table
  
  2. Notes
    - Gender field will store gender information for attendees
    - Default value is empty string to allow nullable data
*/

-- Add gender column to attendees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'gender'
  ) THEN
    ALTER TABLE attendees ADD COLUMN gender text DEFAULT '';
  END IF;
END $$;
