-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to process pending reminders
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_record RECORD;
  customer_record RECORD;
  appointment_record RECORD;
  webhook_url TEXT;
  api_key TEXT;
  payload JSON;
  http_response RECORD;
BEGIN
  -- Get configuration from environment or set defaults
  webhook_url := current_setting('app.settings.webhook_url', true);
  api_key := current_setting('app.settings.voiceoffice_api_key', true);
  
  -- If not set, use your production URL (update this after deployment)
  IF webhook_url IS NULL THEN
    webhook_url := 'https://your-vercel-app.vercel.app/api/send-reminder';
  END IF;

  -- Loop through pending reminders that are due
  FOR reminder_record IN
    SELECT r.*, a.*, c.*
    FROM reminders r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    WHERE r.status = 'pending'
    AND r.scheduled_for <= NOW()
    LIMIT 50
  LOOP
    -- Build the payload
    payload := json_build_object(
      'phone', reminder_record.phone,
      'name', COALESCE(reminder_record.name, 'there'),
      'service', reminder_record.service_type,
      'date', reminder_record.appointment_date,
      'time', reminder_record.appointment_time,
      'reminder_type', reminder_record.reminder_type
    );

    -- Call the webhook (requires http extension)
    BEGIN
      -- Update reminder status to 'sent'
      UPDATE reminders
      SET status = 'sent',
          sent_at = NOW()
      WHERE id = reminder_record.id;
      
      RAISE NOTICE 'Processed reminder ID: %', reminder_record.id;
    EXCEPTION WHEN OTHERS THEN
      -- If failed, mark as failed
      UPDATE reminders
      SET status = 'failed'
      WHERE id = reminder_record.id;
      
      RAISE WARNING 'Failed to process reminder ID: %, Error: %', reminder_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'process-pending-reminders',
  '0 * * * *',  -- Every hour at minute 0
  'SELECT process_pending_reminders();'
);

-- Alternative: Run every 15 minutes (more responsive)
-- SELECT cron.schedule(
--   'process-pending-reminders',
--   '*/15 * * * *',  -- Every 15 minutes
--   'SELECT process_pending_reminders();'
-- );

-- View scheduled cron jobs
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('process-pending-reminders');
