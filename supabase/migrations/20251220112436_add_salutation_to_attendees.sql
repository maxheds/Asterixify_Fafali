/*
  # Add salutation field to attendees

  1. Changes
    - Add `salutation` column to `attendees` table
    - Column is optional (nullable) to maintain compatibility with existing records
    - Common values: Mr., Mrs., Ms., Dr., Prof., etc.

  2. Notes
    - Existing records will have NULL salutation by default
    - New registrations can optionally include salutation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'salutation'
  ) THEN
    ALTER TABLE attendees ADD COLUMN salutation text;
  END IF;
END $$;