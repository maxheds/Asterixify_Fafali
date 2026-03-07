# Neon Database Setup Guide

This guide will help you set up Neon database for your multi-app event check-in system.

## Why Neon?

- Serverless Postgres database
- Generous free tier (0.5 GB storage, 191 hours compute/month)
- Works perfectly with Vercel
- Multi-app support with app_id separation

## Step 1: Create a Neon Account

1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your Database URL

1. In your Neon dashboard, go to your project
2. Click "Connection Details"
3. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 3: Set Up Database Schema

Run these SQL commands in your Neon SQL Editor:

```sql
-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default_app',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMP NOT NULL,
  location TEXT DEFAULT '',
  event_flyer TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_app_id ON events(app_id);

-- Create attendees table
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default_app',
  event_id UUID NOT NULL REFERENCES events(id),
  salutation TEXT DEFAULT '',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  ticket_type TEXT DEFAULT '',
  organization TEXT DEFAULT '',
  age_group TEXT DEFAULT '',
  special_requirements TEXT DEFAULT '',
  registration_source TEXT DEFAULT '',
  form_data JSONB DEFAULT '{}',
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,
  checked_in_by TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendees_app_id ON attendees(app_id);
CREATE INDEX idx_attendees_event_id ON attendees(event_id);

-- Create check_in_history table
CREATE TABLE check_in_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default_app',
  attendee_id UUID NOT NULL REFERENCES attendees(id),
  event_id UUID NOT NULL REFERENCES events(id),
  checked_in_by TEXT NOT NULL,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  notes TEXT DEFAULT ''
);

CREATE INDEX idx_check_in_history_app_id ON check_in_history(app_id);

-- Create admin_settings table
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default_app',
  admin_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_settings_app_id ON admin_settings(app_id);
```

## Step 4: Configure Environment Variables

### For Local Development

Add to your `.env` file:
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
VITE_APP_ID=event_checkin_app
```

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - `DATABASE_URL` = your Neon connection string
   - `VITE_APP_ID` = unique identifier for each app

## Step 5: Deploy to Vercel

```bash
vercel
```

During deployment, make sure to:
1. Set the `DATABASE_URL` environment variable
2. Set a unique `VITE_APP_ID` for each app deployment

## Multi-App Setup with Neon

### Same Database, Multiple Apps

You can deploy multiple apps using the same Neon database:

**App 1: Event Check-In**
```
VITE_APP_ID=event_checkin_app
DATABASE_URL=postgresql://...neon.tech/neondb
```

**App 2: Conference Manager**
```
VITE_APP_ID=conference_manager
DATABASE_URL=postgresql://...neon.tech/neondb
```

**App 3: Workshop Tracker**
```
VITE_APP_ID=workshop_tracker
DATABASE_URL=postgresql://...neon.tech/neondb
```

All apps:
- Share the same database
- Are completely isolated by `app_id`
- Benefit from Neon's free tier limits

## Important Notes

### Security
- Never commit `.env` files with your `DATABASE_URL`
- The connection string contains your database credentials
- Always use environment variables in Vercel

### Data Isolation
- All API routes filter by `app_id` automatically
- Apps cannot access each other's data
- Each deployment must set its own unique `VITE_APP_ID`

### Free Tier Limits
- 0.5 GB storage
- 191 hours of compute per month
- Unlimited databases per project
- 3 projects on free tier

## Troubleshooting

### Connection Issues
If you can't connect to Neon:
1. Check that `DATABASE_URL` is set in Vercel
2. Verify the connection string includes `?sslmode=require`
3. Make sure you're using the HTTP connection string (not pooled)

### Data Not Showing
1. Verify `VITE_APP_ID` matches between deployments
2. Check API routes are deployed correctly
3. Verify tables were created in Neon

### Performance
- Neon databases "sleep" after inactivity (free tier)
- First request after sleep may be slower (cold start)
- Subsequent requests are fast

## Cost Management

To stay on the free tier:
- Monitor compute hours in Neon dashboard
- Use connection pooling for efficiency
- Set up alerts for usage thresholds

## Upgrading

If you outgrow the free tier:
- Neon Pro: $19/month (higher limits)
- All apps benefit from the upgrade
- Still more cost-effective than separate databases

## API Routes Structure

Your Vercel API routes will be at:
- `/api/events` - Create, read, update events
- `/api/attendees` - Manage attendees
- `/api/check-ins` - Handle check-ins
- `/api/admin` - Admin operations

All routes automatically filter by the `app_id` query parameter.

## Support

- Neon Docs: https://neon.tech/docs
- Vercel API Routes: https://vercel.com/docs/functions/serverless-functions
- Drizzle ORM: https://orm.drizzle.team/docs
