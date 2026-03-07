/*
  # Force PostgREST Schema Cache Reload

  This migration forces PostgREST to reload its schema cache by:
  1. Sending a notification to the pgrst channel
  2. This ensures the API recognizes all existing tables
*/

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
