/*
  # Fix Anonymous Role Access

  1. Problem
    - Current policies use `TO public` which doesn't include the `anon` role
    - The Supabase client uses the anon key, which has the `anon` role
    - This causes 404 errors when trying to access data

  2. Solution
    - Change all policies from `TO public` to `TO anon, authenticated`
    - This allows both anonymous users (via anon key) and authenticated users
    - Maintains the same security model but fixes access issues

  3. Tables Updated
    - events: Allow anon role to view active events
    - attendees: Allow anon role to register, view, and check in
    - check_in_history: Allow anon role to create and view records
    - admin_settings: Allow anon role to view settings
*/

-- ============================================
-- EVENTS TABLE - FIX ANON ACCESS
-- ============================================

DROP POLICY IF EXISTS "Public can view active events" ON events;

CREATE POLICY "Public can view active events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================
-- ATTENDEES TABLE - FIX ANON ACCESS
-- ============================================

DROP POLICY IF EXISTS "Public can register for events" ON attendees;
DROP POLICY IF EXISTS "Public can view attendees for active events" ON attendees;
DROP POLICY IF EXISTS "Public can check in attendees" ON attendees;

CREATE POLICY "Public can register for events"
  ON attendees FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  );

CREATE POLICY "Public can view attendees for active events"
  ON attendees FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  );

CREATE POLICY "Public can check in attendees"
  ON attendees FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  );

-- ============================================
-- CHECK-IN HISTORY TABLE - FIX ANON ACCESS
-- ============================================

DROP POLICY IF EXISTS "Public can create check-in records" ON check_in_history;
DROP POLICY IF EXISTS "Public can view check-in history for active events" ON check_in_history;

CREATE POLICY "Public can create check-in records"
  ON check_in_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  );

CREATE POLICY "Public can view check-in history for active events"
  ON check_in_history FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_id 
      AND events.is_active = true
    )
  );

-- ============================================
-- ADMIN SETTINGS TABLE - FIX ANON ACCESS
-- ============================================

DROP POLICY IF EXISTS "Public can view admin settings" ON admin_settings;

CREATE POLICY "Public can view admin settings"
  ON admin_settings FOR SELECT
  TO anon, authenticated
  USING (true);
