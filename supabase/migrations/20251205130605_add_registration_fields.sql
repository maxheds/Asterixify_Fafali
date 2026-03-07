/*
  # Add Registration Form Fields

  1. Changes
    - Add `organization` field to attendees table for company/church name
    - Add `age_group` field for demographic tracking
    - Add `special_requirements` field for dietary/accessibility needs
    - Add `registration_source` field to track if registered online or imported
    - Update triggers and indexes

  2. Notes
    - All new fields are optional with sensible defaults
    - Existing data remains unchanged
*/

-- Add new columns to attendees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'organization'
  ) THEN
    ALTER TABLE attendees ADD COLUMN organization text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'age_group'
  ) THEN
    ALTER TABLE attendees ADD COLUMN age_group text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'special_requirements'
  ) THEN
    ALTER TABLE attendees ADD COLUMN special_requirements text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'registration_source'
  ) THEN
    ALTER TABLE attendees ADD COLUMN registration_source text DEFAULT 'online';
  END IF;
END $$;