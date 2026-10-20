import { createClient } from '@supabase/supabase-js';

// Allow build to succeed even if env vars not set
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Database Types
export interface Customer {
  id: string;
  phone: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  phone: string;
  state: string;
  context: Record<string, any>;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  appointment_id: string;
  reminder_type: 'confirmation' | '24h_before' | 'follow_up';
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}
