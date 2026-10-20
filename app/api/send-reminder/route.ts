import { NextRequest, NextResponse } from 'next/server';
import { voiceOffice } from '@/lib/voiceoffice';

/**
 * API endpoint for Supabase cron to send reminders
 * Called by Supabase pg_cron or database triggers
 */

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Supabase (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (authHeader !== `Bearer ${supabaseKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, name, service, date, time, reminder_type } = body;

    if (!phone || !reminder_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    // Send appropriate reminder based on type
    switch (reminder_type) {
      case '24h_before':
        result = await voiceOffice.send24HourReminder(
          phone,
          name || 'there',
          service,
          date,
          time
        );
        break;

      case 'follow_up':
        result = await voiceOffice.sendFollowUp(
          phone,
          name || 'there',
          service
        );
        break;

      case 'confirmation':
        result = await voiceOffice.sendBookingConfirmation(
          phone,
          name || 'there',
          service,
          date,
          time
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid reminder type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
