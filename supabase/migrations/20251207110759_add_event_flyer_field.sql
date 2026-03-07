/*
  # Add Event Flyer Field

  1. Changes
    - Add `event_flyer` column to `events` table to store event image/flyer URLs
  
  2. Notes
    - Column is optional (nullable) as not all events may have flyers
    - Stores URL/path to event flyer image
    - Can be used to display event visuals in registration forms
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_flyer'
  ) THEN
    ALTER TABLE events ADD COLUMN event_flyer text;
  END IF;
END $$;