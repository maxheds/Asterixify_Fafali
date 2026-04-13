-- Migration: Add admin_users table for multi-user authentication
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- After running, go to the admin portal — you will be prompted to create your master account.

CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      TEXT NOT NULL DEFAULT 'default_app',
  username    TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('master', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (app_id, username)
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_users_updated_at ON public.admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow the anon role to read users for the matching app_id (needed for login lookup)
CREATE POLICY "anon can read admin_users for app"
  ON public.admin_users
  FOR SELECT
  TO anon
  USING (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  );

-- Allow the anon role to insert (first-run master account creation)
CREATE POLICY "anon can insert admin_users for app"
  ON public.admin_users
  FOR INSERT
  TO anon
  WITH CHECK (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  );

-- Allow the anon role to update (password change, activate/deactivate)
CREATE POLICY "anon can update admin_users for app"
  ON public.admin_users
  FOR UPDATE
  TO anon
  USING (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  );

-- Allow the anon role to delete (remove user)
CREATE POLICY "anon can delete admin_users for app"
  ON public.admin_users
  FOR DELETE
  TO anon
  USING (
    app_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-app-id',
      'default_app'
    )
  );
