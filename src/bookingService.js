import { query } from './database.js';
import voiceoffice from './voiceoffice.js';
import meta from './meta.js';
import { v4 as uuidv4 } from 'uuid';

class BookingService {
  async createTenant(tenantData) {
    const { name, email, phone } = tenantData;
    const tenantId = uuidv4();

    const result = await query(
      `INSERT INTO tenants (tenant_id, name, email, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [tenantId, name, email, phone]
    );

    return result.rows[0];
  }

  async getTenant(tenantId) {
    const result = await query(
      'SELECT * FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0];
  }

  async createTemplate(templateData) {
    const { tenant_id, template_name, service_type, duration_minutes, default_message } = templateData;

    const result = await query(
      `INSERT INTO booking_templates 
       (tenant_id, template_name, service_type, duration_minutes, default_message) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [tenant_id, template_name, service_type, duration_minutes, default_message]
    );

    return result.rows[0];
  }

  async getTemplates(tenantId) {
    const result = await query(
      'SELECT * FROM booking_templates WHERE tenant_id = $1 AND is_active = TRUE',
      [tenantId]
    );
    return result.rows;
  }

  async getTemplate(tenantId, templateName) {
    const result = await query(
      'SELECT * FROM booking_templates WHERE tenant_id = $1 AND template_name = $2 AND is_active = TRUE',
      [tenantId, templateName]
    );
    return result.rows[0];
  }

  async createBooking(bookingData) {
    const {
      tenant_id,
      customer_name,
      customer_email,
      customer_phone,
      service_type,
      booking_date,
      booking_time,
      notes,
      template_name
    } = bookingData;

    // Verify tenant exists
    const tenant = await this.getTenant(tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get template if specified
    let duration_minutes = 60; // default
    if (template_name) {
      const template = await this.getTemplate(tenant_id, template_name);
      if (template) {
        duration_minutes = template.duration_minutes;
      }
    }

    const bookingId = uuidv4();

    // Create booking in VoiceOffice
    let voiceofficeReference = null;
    try {
      const voiceofficeBooking = await voiceoffice.createBooking({
        tenant_id,
        customer_name,
        customer_email,
        customer_phone,
        service_type,
        booking_date,
        booking_time,
        duration_minutes,
        notes
      });
      voiceofficeReference = voiceofficeBooking.id || voiceofficeBooking.booking_id;
    } catch (error) {
      console.error('VoiceOffice booking creation failed:', error);
      // Continue with local booking even if VoiceOffice fails
    }

    // Create booking in local database
    const result = await query(
      `INSERT INTO bookings 
       (booking_id, tenant_id, customer_name, customer_email, customer_phone, 
        service_type, booking_date, booking_time, duration_minutes, notes, 
        voiceoffice_reference, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        bookingId,
        tenant_id,
        customer_name,
        customer_email,
        customer_phone,
        service_type,
        booking_date,
        booking_time,
        duration_minutes,
        notes,
        voiceofficeReference,
        'confirmed'
      ]
    );

    const booking = result.rows[0];

    // Send WhatsApp notification if phone number provided
    if (customer_phone) {
      try {
        const metaResult = await meta.sendBookingConfirmation(customer_phone, booking);
        if (metaResult.success) {
          await query(
            'UPDATE bookings SET meta_notification_sent = TRUE WHERE booking_id = $1',
            [bookingId]
          );
          await this.logNotification(bookingId, 'whatsapp', customer_phone, 'Booking confirmation', 'sent');
        } else {
          await this.logNotification(bookingId, 'whatsapp', customer_phone, 'Booking confirmation', 'failed', metaResult.error);
        }
      } catch (error) {
        console.error('WhatsApp notification failed:', error);
        await this.logNotification(bookingId, 'whatsapp', customer_phone, 'Booking confirmation', 'failed', error.message);
      }
    }

    return booking;
  }

  async getBookings(tenantId, filters = {}) {
    let query_text = 'SELECT * FROM bookings WHERE tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;

    if (filters.date_from) {
      query_text += ` AND booking_date >= $${paramIndex}`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to) {
      query_text += ` AND booking_date <= $${paramIndex}`;
      params.push(filters.date_to);
      paramIndex++;
    }

    if (filters.status) {
      query_text += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query_text += ' ORDER BY booking_date, booking_time';

    const result = await query(query_text, params);
    return result.rows;
  }

  async getBooking(bookingId) {
    const result = await query(
      'SELECT * FROM bookings WHERE booking_id = $1',
      [bookingId]
    );
    return result.rows[0];
  }

  async updateBooking(bookingId, updates) {
    const allowedFields = ['customer_name', 'customer_email', 'customer_phone', 'booking_date', 'booking_time', 'notes', 'status'];
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(bookingId);

    const result = await query(
      `UPDATE bookings SET ${updateFields.join(', ')} WHERE booking_id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0];
  }

  async cancelBooking(bookingId) {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Cancel in VoiceOffice if reference exists
    if (booking.voiceoffice_reference) {
      try {
        await voiceoffice.cancelBooking(booking.voiceoffice_reference);
      } catch (error) {
        console.error('VoiceOffice cancellation failed:', error);
      }
    }

    // Update local database
    const result = await query(
      `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE booking_id = $1 RETURNING *`,
      [bookingId]
    );

    const cancelledBooking = result.rows[0];

    // Send cancellation notification
    if (cancelledBooking.customer_phone) {
      try {
        await meta.sendBookingCancellation(cancelledBooking.customer_phone, cancelledBooking);
        await this.logNotification(bookingId, 'whatsapp', cancelledBooking.customer_phone, 'Booking cancellation', 'sent');
      } catch (error) {
        console.error('WhatsApp cancellation notification failed:', error);
        await this.logNotification(bookingId, 'whatsapp', cancelledBooking.customer_phone, 'Booking cancellation', 'failed', error.message);
      }
    }

    return cancelledBooking;
  }

  async logNotification(bookingId, type, recipient, message, status, errorMessage = null) {
    await query(
      `INSERT INTO notifications (booking_id, notification_type, recipient, message, status, error_message, sent_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [bookingId, type, recipient, message, status, errorMessage, status === 'sent' ? new Date() : null]
    );
  }

  async getNotifications(bookingId) {
    const result = await query(
      'SELECT * FROM notifications WHERE booking_id = $1 ORDER BY created_at DESC',
      [bookingId]
    );
    return result.rows;
  }
}

export default new BookingService();
