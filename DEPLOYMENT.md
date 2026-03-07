# Multi-App Deployment Guide

This project is configured to use **one Supabase project for multiple web apps** with complete data isolation using `app_id` separation.

## Architecture Overview

- **One Supabase Project**: All apps share the same database, auth, and API keys
- **Cost Efficiency**: You're billed for total usage, not per app
- **Data Isolation**: Apps are completely separated by `app_id` using Row Level Security (RLS)
- **Security**: RLS policies enforce strict boundaries - apps cannot access each other's data

## How It Works

### Database Structure
Every table has an `app_id` column:
```sql
events (id, app_id, name, ...)
attendees (id, app_id, event_id, ...)
check_in_history (id, app_id, ...)
admin_settings (id, app_id, ...)
```

### RLS Security
All database queries are automatically filtered by `app_id` through RLS policies. Even with the same `anon_key`, apps cannot cross-access data.

### Client Configuration
The Supabase client automatically sends the `x-app-id` header with every request:
```typescript
const supabase = createClient(url, anonKey, {
  global: {
    headers: {
      'x-app-id': appId,
    },
  },
});
```

## Deploying to Vercel

### 1. Initial Setup
```bash
npm install -g vercel
vercel login
```

### 2. Deploy Your First App
```bash
vercel
```

During setup, configure these environment variables:
```
VITE_SUPABASE_URL=https://ukkacddtgrspozzotumo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_ID=event_checkin_app
VITE_EMAILJS_SERVICE_ID=service_22havjr
VITE_EMAILJS_PUBLIC_KEY=0NSEYeRVI3yol-JvM
VITE_EMAILJS_REGISTRATION_TEMPLATE_ID=template_2t34kbz
VITE_EMAILJS_CHECKIN_TEMPLATE_ID=template_0fyprvu
```

### 3. Deploy Additional Apps
For each new app using the same Supabase project:

1. Clone or copy the project
2. Deploy with a different `VITE_APP_ID`:
```bash
vercel --env VITE_APP_ID=my_second_app
```

3. Set environment variables in Vercel Dashboard:
   - Go to Project Settings > Environment Variables
   - Use the **same** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Use a **different** `VITE_APP_ID` for each app

### Example Multi-App Setup
```
App 1: event-checkin.vercel.app
  VITE_APP_ID=event_checkin_app

App 2: conference-manager.vercel.app
  VITE_APP_ID=conference_manager

App 3: workshop-tracker.vercel.app
  VITE_APP_ID=workshop_tracker
```

All three apps:
- Connect to the same Supabase project
- Use the same `anon_key` (safe!)
- Have completely isolated data
- Share the free tier usage limits

## Environment Variables

### Required for All Apps
- `VITE_SUPABASE_URL` - Your Supabase project URL (same for all apps)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (same for all apps)
- `VITE_APP_ID` - Unique identifier for each app (different per app)

### Optional (EmailJS)
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_EMAILJS_REGISTRATION_TEMPLATE_ID`
- `VITE_EMAILJS_CHECKIN_TEMPLATE_ID`

## Setting Environment Variables in Vercel

### Option 1: Via CLI
```bash
vercel env add VITE_APP_ID production
```

### Option 2: Via Dashboard
1. Go to your project in Vercel
2. Settings > Environment Variables
3. Add each variable
4. Select environments (Production, Preview, Development)

### Option 3: Via .env.production
Create a `.env.production` file (add to .gitignore):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ID=your-unique-app-id
```

## Supabase Configuration

### Current Database Setup
Your database already has:
- `app_id` columns on all tables
- RLS policies enforcing app isolation
- Indexes for performance
- Helper function `get_app_id()` for RLS

### No Additional Setup Needed
The migration has already been applied. Each app will automatically:
- Only see its own data
- Cannot read/write other apps' data
- Operate independently within the same database

## Custom Domains (Optional)

Add custom domains in Vercel:
1. Project Settings > Domains
2. Add your domain
3. Configure DNS records

Example:
```
events.yourdomain.com → App 1 (VITE_APP_ID=events)
workshops.yourdomain.com → App 2 (VITE_APP_ID=workshops)
```

## Cost Management

### Free Tier Limits (Supabase)
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 5 GB
- Edge Functions: 500K invocations

All apps share these limits. Monitor usage in Supabase Dashboard.

### Free Tier Limits (Vercel)
- 100 GB bandwidth per month
- Unlimited projects
- Free SSL

## Monitoring

### Check App Isolation
Run this query in Supabase SQL Editor to verify separation:
```sql
SELECT app_id, COUNT(*) as count FROM events GROUP BY app_id;
SELECT app_id, COUNT(*) as count FROM attendees GROUP BY app_id;
```

### View Logs
- Vercel: Check deployment and function logs in dashboard
- Supabase: Check database logs and API analytics

## Troubleshooting

### Data Not Showing Up
- Verify `VITE_APP_ID` is set correctly
- Check browser console for the app_id value
- Confirm RLS policies are active: `SELECT * FROM pg_policies;`

### Cross-App Data Leakage
This should be impossible, but if suspected:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check policies enforce app_id
3. Test with different app_id values

### Build Errors
```bash
npm run build
```
Fix any TypeScript or build errors before deploying.

## Security Best Practices

1. Never commit `.env` files to git
2. Never use `service_role_key` in the frontend
3. Each app should have a unique `app_id`
4. Use meaningful app_id names (e.g., `company_events`, `workshop_manager`)
5. Monitor Supabase logs for suspicious activity

## Scaling

When you outgrow the free tier:
- Upgrade Supabase to Pro ($25/month) for higher limits
- All apps benefit from the upgrade
- Still more cost-effective than separate projects

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
