/*
  # Remove Unused Database Indexes

  1. Changes
    - Drop `idx_attendees_email` - Email searches use wildcard patterns (ilike) which cannot efficiently use indexes
    - Drop `idx_check_in_history_event` - No queries filter check_in_history by event_id (data is only inserted, never queried)
    - Keep `idx_attendees_event_id` - Used in 5+ critical queries across multiple components
    - Keep `idx_attendees_checked_in` - Composite index used for filtering checked-in status per event
  
  2. Performance Impact
    - Reduces index maintenance overhead during inserts/updates
    - Frees up storage space
    - No negative impact on query performance (indexes were not being used)
*/

-- Drop unused email index (wildcard ilike searches can't use indexes efficiently)
DROP INDEX IF EXISTS idx_attendees_email;

-- Drop unused check_in_history event index (table is only written to, never queried)
DROP INDEX IF EXISTS idx_check_in_history_event;