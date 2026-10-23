import dotenv from 'dotenv';

dotenv.config();

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_API_URL = 'https://graph.facebook.com/v18.0';

class MetaWhatsAppClient {
  async sendMessage(phoneNumber, message) {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
      console.warn('Meta credentials not configured. Skipping WhatsApp notification.');
      return { success: false, error: 'Meta credentials not configured' };
    }

    const url = `${META_API_URL}/${META_PHONE_NUMBER_ID}/messages`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Meta API Error: ${response.status} - ${JSON.stringify(data)}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Meta WhatsApp send failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmation(phoneNumber, bookingDetails) {
    const message = `🎉 Booking Confirmed!

Customer: ${bookingDetails.customer_name}
Service: ${bookingDetails.service_type}
Date: ${bookingDetails.booking_date}
Time: ${bookingDetails.booking_time}
Booking ID: ${bookingDetails.booking_id}

${bookingDetails.notes ? `Notes: ${bookingDetails.notes}` : ''}

Thank you for booking with us!`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendBookingReminder(phoneNumber, bookingDetails) {
    const message = `⏰ Booking Reminder

Hi ${bookingDetails.customer_name},

This is a reminder for your upcoming appointment:

Service: ${bookingDetails.service_type}
Date: ${bookingDetails.booking_date}
Time: ${bookingDetails.booking_time}

We look forward to seeing you!`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendBookingCancellation(phoneNumber, bookingDetails) {
    const message = `❌ Booking Cancelled

Your booking has been cancelled:

Booking ID: ${bookingDetails.booking_id}
Service: ${bookingDetails.service_type}
Date: ${bookingDetails.booking_date}
Time: ${bookingDetails.booking_time}

If you'd like to rebook, please contact us.`;

    return await this.sendMessage(phoneNumber, message);
  }
}

export default new MetaWhatsAppClient();
