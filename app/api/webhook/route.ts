import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { chatbot } from '@/lib/chatbot';

/**
 * VoiceOffice Webhook Handler - Production Ready
 * 
 * Handles webhook events from VoiceOffice WhatsApp Infrastructure:
 * - webhook.test: Test ping events
 * - message.received: Incoming WhatsApp messages
 * - message.status: Delivery status updates
 * - customer.connected: Customer connection events
 * 
 * Security: Verifies HMAC-SHA256 signature
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-VoiceOffice-Event, X-VoiceOffice-Timestamp, X-VoiceOffice-Signature-256',
};

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Verify HMAC signature from VoiceOffice
 */
function verifySignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    // VoiceOffice signs: timestamp + '.' + payload
    const signedPayload = `${timestamp}.${payload}`;
    
    const hmac = createHmac('sha256', secret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Extract VoiceOffice headers
    const eventType = request.headers.get('X-VoiceOffice-Event') || request.headers.get('x-voiceoffice-event');
    const timestamp = request.headers.get('X-VoiceOffice-Timestamp') || request.headers.get('x-voiceoffice-timestamp');
    const signature = request.headers.get('X-VoiceOffice-Signature-256') || request.headers.get('x-voiceoffice-signature-256');

    console.log('📨 Webhook received:', {
      event: eventType,
      timestamp,
      hasSignature: !!signature,
      payload: body
    });

    // Verify signature (if webhook secret is configured)
    const webhookSecret = process.env.VOICEOFFICE_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      const isValid = verifySignature(rawBody, timestamp, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401, headers: corsHeaders }
        );
      }
      console.log('✅ Signature verified');
    }

    // Handle different event types
    switch (eventType) {
      case 'webhook.test':
        // Test ping - just acknowledge
        console.log('🧪 Test webhook received');
        return NextResponse.json(
          { 
            success: true, 
            message: 'Webhook test received successfully',
            timestamp: new Date().toISOString()
          },
          { headers: corsHeaders }
        );

      case 'message.received':
        // Incoming WhatsApp message
        const messageData = body.data || body;
        const phone = messageData.from || messageData.phone;
        const text = messageData.text || messageData.message || messageData.body;

        if (!phone || !text) {
          console.error('❌ Missing phone or text in message.received event');
          return NextResponse.json(
            { error: 'Missing phone or text' },
            { status: 400, headers: corsHeaders }
          );
        }

        console.log(`📱 Message from ${phone}: ${text}`);

        // Process message through chatbot (non-blocking)
        chatbot.processMessage(phone, text).catch(err => {
          console.error('Chatbot processing error:', err);
        });

        // Return 200 immediately (within 3 seconds requirement)
        const processingTime = Date.now() - startTime;
        return NextResponse.json(
          { 
            success: true, 
            messageId: messageData.id,
            processingTime: `${processingTime}ms`
          },
          { headers: corsHeaders }
        );

      case 'message.status':
        // Delivery status update
        console.log('📬 Message status update:', body.data);
        return NextResponse.json(
          { success: true },
          { headers: corsHeaders }
        );

      case 'customer.connected':
        // Customer connected event
        console.log('👤 Customer connected:', body.data);
        return NextResponse.json(
          { success: true },
          { headers: corsHeaders }
        );

      default:
        // Unknown event type
        console.log('❓ Unknown event type:', eventType);
        return NextResponse.json(
          { success: true, message: 'Event received' },
          { headers: corsHeaders }
        );
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        processingTime: `${processingTime}ms`
      },
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
