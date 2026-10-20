-- Simpler approach: Use Supabase's built-in HTTP functions
-- This requires the http extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to send a single reminder via API
CREATE OR REPLACE FUNCTION send_reminder_via_api(
  reminder_id UUID,
  phone_number TEXT,
  customer_name TEXT,
  service_type TEXT,
  appt_date TEXT,
  appt_time TEXT,
  reminder_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  api_key TEXT;
  request_body TEXT;
  response http_response;
BEGIN
  -- Set your Vercel app URL here (update after deployment)
  api_url := 'https://your-app.vercel.app/api/send-reminder';
  api_key := current_setting('app.voiceoffice_key', true);

  -- Build JSON payload
  request_body := json_build_object(
    'phone', phone_number,
    'name', COALESCE(customer_name, 'there'),
    'service', service_type,
    'date', appt_date,
    'time', appt_time,
    'reminder_type', reminder_type
  )::text;

  -- Make HTTP POST request
  SELECT * INTO response
  FROM http_post(
    api_url,
    request_body,
    'application/json',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.supabase_key', true))
    ]
  );

  -- Check if successful
  IF response.status >= 200 AND response.status < 300 THEN
    -- Update reminder as sent
    UPDATE reminders
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = reminder_id;
    
    RETURN TRUE;
  ELSE
    -- Mark as failed
    UPDATE reminders
    SET status = 'failed'
    WHERE id = reminder_id;
    
    RAISE WARNING 'Failed to send reminder %. HTTP Status: %', reminder_id, response.status;
    RETURN FALSE;
  END IF;
END;
$$;

-- Main function to process all pending reminders
CREATE OR REPLACE FUNCTION process_all_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder RECORD;
  success_count INTEGER := 0;
BEGIN
  FOR reminder IN
    SELECT 
      r.id,
      c.phone,
      c.name,
      a.service_type,
      a.appointment_date::text,
      a.appointment_time::text,
      r.reminder_type
    FROM reminders r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    WHERE r.status = 'pending'
    AND r.scheduled_for <= NOW()
    ORDER BY r.scheduled_for ASC
    LIMIT 50
  LOOP
    IF send_reminder_via_api(
      reminder.id,
      reminder.phone,
      reminder.name,
      reminder.service_type,
      reminder.appointment_date,
      reminder.appointment_time,
      reminder.reminder_type
    ) THEN
      success_count := success_count + 1;
    END IF;
  END LOOP;

  RETURN success_count;
END;
$$;

-- Schedule to run every hour
SELECT cron.schedule(
  'hourly-reminder-check',
  '0 * * * *',
  'SELECT process_all_reminders();'
);

-- View cron jobs
SELECT * FROM cron.job;

-- Manual test (run this to test immediately)
-- SELECT process_all_reminders();

-- To remove the cron job:
-- SELECT cron.unschedule('hourly-reminder-check');
