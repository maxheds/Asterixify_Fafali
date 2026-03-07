/*
  # Cleanup Duplicate RLS Policies

  1. Issue
    - Multiple overlapping policies exist from previous migrations
    - Some old app_id-based policies are still present
    - This creates confusion and potential security gaps

  2. Solution
    - Drop ALL old policies
    - Keep only the new secure policies from previous migration
    
  3. Security
    - Final state will have clean, non-overlapping policies
    - Each table will have clear access rules
*/

-- ============================================
-- CLEAN UP EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can delete events for their app" ON events;
DROP POLICY IF EXISTS "Users can insert events for their app" ON events;
DROP POLICY IF EXISTS "Users can update events for their app" ON events;
DROP POLICY IF EXISTS "Users can view events for their app" ON events;

-- ============================================
-- CLEAN UP ADMIN_SETTINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Anyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can insert admin settings for their app" ON admin_settings;
DROP POLICY IF EXISTS "Users can update admin settings for their app" ON admin_settings;
DROP POLICY IF EXISTS "Users can view admin settings for their app" ON admin_settings;

-- ============================================
-- CLEAN UP CHECK_IN_HISTORY TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can insert check-in history for their app" ON check_in_history;
DROP POLICY IF EXISTS "Users can view check-in history for their app" ON check_in_history;
