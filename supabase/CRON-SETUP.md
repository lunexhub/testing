# Supabase Cron Setup for Reminders

This guide shows how to set up automated reminders using Supabase's pg_cron instead of Vercel cron.

## Benefits
- ✅ No Vercel Pro plan required
- ✅ Runs directly in your database
- ✅ More reliable for time-sensitive tasks
- ✅ Free on Supabase

## Setup Steps

### 1. Enable Required Extensions

Go to Supabase Dashboard → Database → Extensions

Enable these extensions:
- ✅ `pg_cron` - For scheduling jobs
- ✅ `http` - For making HTTP requests (optional, for HTTP method)

### 2. Choose Your Method

**Method A: Direct Database Processing (Simpler)**
- Reminders processed entirely in Supabase
- Calls your API endpoint to send WhatsApp messages

**Method B: Webhook to Your App (Alternative)**
- Cron triggers your app's API endpoint
- Your app fetches and processes reminders

### 3. Method A Setup (Recommended)

**Step 1: Run the Schema**

In Supabase SQL Editor, run `supabase/schema.sql` (if not done already)

**Step 2: Deploy Your App to Vercel**

Get your production URL (e.g., `https://your-app.vercel.app`)

**Step 3: Update the SQL File**

Edit `supabase/simple-cron.sql` line 27:
```sql
api_url := 'https://YOUR-ACTUAL-APP.vercel.app/api/send-reminder';
```

**Step 4: Run the Cron SQL**

In Supabase SQL Editor, copy and paste the entire content of `supabase/simple-cron.sql` and run it.

**Step 5: Configure Settings (Optional)**

Set your app configuration in Supabase:
```sql
-- Set configuration values (run once)
ALTER DATABASE postgres SET app.supabase_key = 'your-supabase-service-key';
ALTER DATABASE postgres SET app.voiceoffice_key = 'vo_live_KYlWYuaD8nqf6pUO2AghmSs3CdIRnMDy';
```

**Step 6: Test It**

Manually trigger to test:
```sql
SELECT process_all_reminders();
```

You should see a number returned (count of sent reminders).

**Step 7: Verify Cron Schedule**

Check your cron jobs:
```sql
SELECT * FROM cron.job;
```

You should see: `hourly-reminder-check`

### 4. Method B Setup (Alternative - Using Vercel Endpoint)

If you prefer to keep the logic in your app:

**Keep the existing `/api/reminders` route**

**In Supabase, create a simpler cron:**
```sql
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'call-reminder-endpoint',
  '0 * * * *',  -- Every hour
  $$
  SELECT http_get(
    'https://your-app.vercel.app/api/reminders',
    ARRAY[http_header('Authorization', 'Bearer your-cron-secret')]
  );
  $$
);
```

## Verify It's Working

### Check Cron Jobs
```sql
SELECT * FROM cron.job;
```

### Check Cron History
```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Check Reminder Status
```sql
SELECT 
  r.reminder_type,
  r.status,
  COUNT(*)
FROM reminders r
GROUP BY r.reminder_type, r.status;
```

## Troubleshooting

### Cron not running?
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job schedule
SELECT * FROM cron.job;

-- Check recent runs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

### HTTP requests failing?
```sql
-- Test HTTP manually
SELECT * FROM http_get('https://your-app.vercel.app/api/webhook');
```

### Change schedule frequency

**Every 15 minutes:**
```sql
SELECT cron.schedule(
  'hourly-reminder-check',
  '*/15 * * * *',
  'SELECT process_all_reminders();'
);
```

**Every 6 hours:**
```sql
SELECT cron.schedule(
  'hourly-reminder-check',
  '0 */6 * * *',
  'SELECT process_all_reminders();'
);
```

## Uninstall

To remove the cron job:
```sql
SELECT cron.unschedule('hourly-reminder-check');
```

To drop functions:
```sql
DROP FUNCTION IF EXISTS process_all_reminders();
DROP FUNCTION IF EXISTS send_reminder_via_api(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
```

## Security Notes

1. **Protect your `/api/send-reminder` endpoint** with the Authorization header check
2. **Use environment variables** in Supabase for sensitive data
3. **Rate limit** the endpoint to prevent abuse
4. **Monitor** cron job runs regularly

## Cost

- **Supabase Free Plan**: pg_cron included ✅
- **No Vercel Pro needed**: Hobby plan works fine ✅

## Next Steps

After setup:
1. Create a test appointment
2. Create a test reminder scheduled for NOW
3. Run `SELECT process_all_reminders();` manually
4. Check if WhatsApp message was sent
5. Verify reminder status changed to 'sent'
