/*
  # Fix Function Security - Immutable Search Path

  1. Security Fix
    - Recreate `update_updated_at_column` function with explicit search_path
    - This prevents potential security vulnerabilities from search_path manipulation
    - The function now has an immutable search_path set to 'public'
  
  2. Changes
    - Drop and recreate the function with SECURITY DEFINER and explicit search_path
    - Function behavior remains exactly the same, only security is improved
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate the function with explicit search_path for security
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at (if they were dropped by CASCADE)
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendees_updated_at ON attendees;
CREATE TRIGGER update_attendees_updated_at 
  BEFORE UPDATE ON attendees
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();