import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { voiceOffice } from '@/lib/voiceoffice';

/**
 * Cron endpoint to send pending reminders
 * 
 * Set up Vercel Cron:
 * - Add to vercel.json
 * - Runs every hour to check for pending reminders
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Get pending reminders that are due
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        appointments (
          *,
          customers (*)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (error) {
      console.error('Error fetching reminders:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No pending reminders', count: 0 });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Process each reminder
    for (const reminder of reminders) {
      const appointment = reminder.appointments;
      const customer = appointment.customers;

      let result;

      if (reminder.reminder_type === '24h_before') {
        result = await voiceOffice.send24HourReminder(
          customer.phone,
          customer.name || 'there',
          appointment.service_type,
          appointment.appointment_date,
          appointment.appointment_time
        );
      } else if (reminder.reminder_type === 'follow_up') {
        result = await voiceOffice.sendFollowUp(
          customer.phone,
          customer.name || 'there',
          appointment.service_type
        );
      }

      // Update reminder status
      if (result?.success) {
        await supabase
          .from('reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', reminder.id);
        sentCount++;
      } else {
        await supabase
          .from('reminders')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: 'Reminders processed',
      sent: sentCount,
      failed: failedCount,
      total: reminders.length,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
