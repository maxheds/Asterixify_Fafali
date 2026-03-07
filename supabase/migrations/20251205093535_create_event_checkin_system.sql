/*
  # Asterixify Event Check-in System v2 - Database Schema

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique event identifier
      - `name` (text) - Event name
      - `description` (text) - Event description
      - `event_date` (date) - When the event takes place
      - `location` (text) - Event location
      - `is_active` (boolean) - Whether event is active for check-ins
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `attendees`
      - `id` (uuid, primary key) - Unique attendee identifier
      - `event_id` (uuid, foreign key) - Links to events table
      - `first_name` (text) - Attendee first name
      - `last_name` (text) - Attendee last name
      - `email` (text) - Attendee email address
      - `phone` (text, optional) - Attendee phone number
      - `ticket_type` (text, optional) - Type of ticket (VIP, General, etc.)
      - `checked_in` (boolean) - Check-in status
      - `checked_in_at` (timestamptz, nullable) - When attendee was checked in
      - `checked_in_by` (text, nullable) - Who checked them in
      - `created_at` (timestamptz) - Registration timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `check_in_history`
      - `id` (uuid, primary key) - Unique history record identifier
      - `attendee_id` (uuid, foreign key) - Links to attendees table
      - `event_id` (uuid, foreign key) - Links to events table
      - `checked_in_by` (text) - Staff member who performed check-in
      - `checked_in_at` (timestamptz) - Timestamp of check-in
      - `notes` (text, optional) - Optional notes about the check-in

  2. Security
    - Enable RLS on all tables
    - Public read access for events (anyone can view active events)
    - Public read/write access for attendees and check-ins (for check-in kiosks)
    - Note: In production, you would add authentication and restrict these policies

  3. Indexes
    - Index on attendees.event_id for fast lookups
    - Index on attendees.email for quick search
    - Index on check_in_history.attendee_id for history queries
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  location text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  ticket_type text DEFAULT 'General',
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  checked_in_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create check-in history table
CREATE TABLE IF NOT EXISTS check_in_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id uuid NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checked_in_by text NOT NULL,
  checked_in_at timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees(event_id, checked_in);
CREATE INDEX IF NOT EXISTS idx_check_in_history_attendee ON check_in_history(attendee_id);
CREATE INDEX IF NOT EXISTS idx_check_in_history_event ON check_in_history(event_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert events"
  ON events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON events FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete events"
  ON events FOR DELETE
  TO public
  USING (true);

-- RLS Policies for attendees table
CREATE POLICY "Anyone can view attendees"
  ON attendees FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert attendees"
  ON attendees FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendees"
  ON attendees FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete attendees"
  ON attendees FOR DELETE
  TO public
  USING (true);

-- RLS Policies for check_in_history table
CREATE POLICY "Anyone can view check-in history"
  ON check_in_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert check-in history"
  ON check_in_history FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();