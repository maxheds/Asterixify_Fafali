/*
  # Add Custom Form Fields and Admin Authentication

  1. Changes
    - Add `admin_password` field to events table for simple admin authentication
    - Add `custom_fields` JSONB field to events table for flexible form configurations
    - Add `form_data` JSONB field to attendees table to store custom field responses
    - Create a simple admin_settings table for global admin password

  2. Notes
    - custom_fields will store an array of field definitions
    - form_data will store the actual responses for custom fields
    - admin_settings table will have a single row with the admin password
*/

-- Create admin_settings table for global admin access
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_password text NOT NULL DEFAULT 'admin123',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default admin password
INSERT INTO admin_settings (admin_password)
SELECT 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to admin_settings (needed for login check)
CREATE POLICY "Anyone can read admin settings"
  ON admin_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update admin settings"
  ON admin_settings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add custom_fields to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE events ADD COLUMN custom_fields jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add form_data to attendees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendees' AND column_name = 'form_data'
  ) THEN
    ALTER TABLE attendees ADD COLUMN form_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;