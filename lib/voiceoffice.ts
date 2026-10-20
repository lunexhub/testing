/**
 * VoiceOffice WhatsApp API Client
 * Uses the REST API endpoint for sending messages
 */

interface SendMessageParams {
  to: string;
  message: string;
  type?: 'text' | 'template';
}

interface VoiceOfficeResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class VoiceOfficeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.VOICEOFFICE_API_KEY || '';
    this.baseUrl = 'https://www.voiceoffice.co.za';

    if (!this.apiKey) {
      throw new Error('VOICEOFFICE_API_KEY is not set');
    }
  }

  /**
   * Send a WhatsApp message via VoiceOffice
   */
  async sendMessage(params: SendMessageParams): Promise<VoiceOfficeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          message: params.message,
          type: params.type || 'text',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('VoiceOffice API Error:', error);
        return {
          success: false,
          error: `API returned ${response.status}: ${error}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      console.error('VoiceOffice sendMessage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(
    phone: string,
    name: string,
    service: string,
    date: string,
    time: string
  ): Promise<VoiceOfficeResponse> {
    const message = `✅ *Booking Confirmed!*\n\nHi ${name}! Your appointment has been confirmed.\n\n📋 *Service:* ${service}\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n\nWe'll send you a reminder 24 hours before your appointment.\n\nReply CANCEL to cancel this booking.`;

    return this.sendMessage({ to: phone, message });
  }

  /**
   * Send 24-hour reminder
   */
  async send24HourReminder(
    phone: string,
    name: string,
    service: string,
    date: string,
    time: string
  ): Promise<VoiceOfficeResponse> {
    const message = `⏰ *Appointment Reminder*\n\nHi ${name}! This is a reminder about your upcoming appointment.\n\n📋 *Service:* ${service}\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n\nSee you soon! Reply CANCEL if you need to cancel.`;

    return this.sendMessage({ to: phone, message });
  }

  /**
   * Send follow-up message
   */
  async sendFollowUp(
    phone: string,
    name: string,
    service: string
  ): Promise<VoiceOfficeResponse> {
    const message = `👋 *Thank You!*\n\nHi ${name}! Thank you for choosing us for your ${service}.\n\nWe'd love to hear your feedback! How was your experience?\n\nTo book another appointment, just send us a message anytime! 😊`;

    return this.sendMessage({ to: phone, message });
  }
}

export const voiceOffice = new VoiceOfficeClient();
