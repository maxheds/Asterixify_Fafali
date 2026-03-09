/*
  # Add Dashboard Access Policies
  
  This migration adds RLS policies to allow viewing all data from the Supabase dashboard.
  
  1. Changes
    - Add bypass RLS policies for postgres role (used by dashboard)
    - This allows viewing all data in the Supabase dashboard without restrictions
  
  2. Security
    - Existing policies for anon and authenticated roles remain unchanged
    - Only affects dashboard access, not application access
*/

-- Add policies to allow postgres role (dashboard) to view everything
CREATE POLICY "Dashboard can view all events"
  ON events FOR SELECT
  TO postgres
  USING (true);

CREATE POLICY "Dashboard can manage all events"
  ON events FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dashboard can view all attendees"
  ON attendees FOR SELECT
  TO postgres
  USING (true);

CREATE POLICY "Dashboard can manage all attendees"
  ON attendees FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dashboard can view all check-in history"
  ON check_in_history FOR SELECT
  TO postgres
  USING (true);

CREATE POLICY "Dashboard can manage all check-in history"
  ON check_in_history FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dashboard can view all admin settings"
  ON admin_settings FOR SELECT
  TO postgres
  USING (true);

CREATE POLICY "Dashboard can manage all admin settings"
  ON admin_settings FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);
