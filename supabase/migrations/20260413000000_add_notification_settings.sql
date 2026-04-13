-- Migration: Add notification_settings table
-- Run this in Supabase Dashboard → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id                      TEXT        NOT NULL DEFAULT 'default_app',
  sms_enabled                 BOOLEAN     NOT NULL DEFAULT TRUE,
  email_enabled               BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_registration_template   TEXT        NOT NULL DEFAULT 'Hi {name}, your registration for {event_name} on {date} at {location} is confirmed. See you there! - Asterixify',
  sms_checkin_template        TEXT        NOT NULL DEFAULT 'Hi {name}, you have been checked in to {event_name}. Welcome and enjoy the event! - Asterixify',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (app_id)
);

-- Auto-update updated_at (reuse the function created in the admin_users migration)
DROP TRIGGER IF EXISTS notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can manage notification_settings"
  ON public.notification_settings
  FOR ALL
  TO anon
  USING (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  )
  WITH CHECK (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  );
