import { NextRequest, NextResponse } from 'next/server';
import { chatbot } from '@/lib/chatbot';

/**
 * Webhook endpoint for receiving WhatsApp messages from VoiceOffice
 * 
 * VoiceOffice will POST incoming messages to this endpoint
 * Expected payload structure (adjust based on VoiceOffice's actual format):
 * {
 *   from: "+1234567890",
 *   message: "Hello",
 *   messageId: "msg_123",
 *   timestamp: "2024-01-01T00:00:00Z"
 * }
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Extract phone and message (adjust field names based on VoiceOffice's format)
    const phone = body.from || body.phone || body.sender;
    const message = body.message || body.text || body.body;

    if (!phone || !message) {
      console.error('Missing phone or message in webhook payload');
      return NextResponse.json(
        { error: 'Missing phone or message' },
        { status: 400 }
      );
    }

    // Process the message through the chatbot
    await chatbot.processMessage(phone, message);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET endpoint for webhook verification (if VoiceOffice requires it)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  const verifyToken = searchParams.get('verify_token');

  // If VoiceOffice sends a verification challenge
  if (challenge && verifyToken === process.env.VOICEOFFICE_WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200, headers: corsHeaders });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' }, { headers: corsHeaders });
}
