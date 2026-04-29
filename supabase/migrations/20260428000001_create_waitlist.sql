/*
  # Create Waitlist Table

  Stores people who register when an event is at capacity.
  Auto-promoted to attendees when a spot opens (deletion or capacity increase).
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  salutation          TEXT          DEFAULT '',
  first_name          TEXT          NOT NULL,
  last_name           TEXT          NOT NULL,
  email               TEXT          NOT NULL,
  phone               TEXT          DEFAULT '',
  gender              TEXT          DEFAULT '',
  organization        TEXT          DEFAULT '',
  age_group           TEXT          DEFAULT '',
  ticket_type         TEXT          DEFAULT 'Attendee',
  special_requirements TEXT         DEFAULT '',
  form_data           JSONB         DEFAULT '{}',
  registration_source TEXT          DEFAULT 'online',
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(event_id, email)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can join the waitlist for active events
CREATE POLICY "Public can join waitlist"
  ON waitlist FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.is_active = true
    )
  );

-- Public can view waitlist entries (needed for duplicate checks)
CREATE POLICY "Public can view waitlist"
  ON waitlist FOR SELECT
  TO public
  USING (true);

-- Authenticated admins can fully manage waitlist (promote, remove, etc.)
CREATE POLICY "Authenticated users can manage waitlist"
  ON waitlist FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
