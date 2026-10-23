import { supabase } from './database.js';
import voiceoffice from './voiceoffice.js';
import meta from './meta.js';
import { v4 as uuidv4 } from 'uuid';

class BookingService {
  async createTenant(tenantData) {
    const { name, email, phone } = tenantData;
    const tenantId = uuidv4();

    const { data, error } = await supabase
      .from('tenants')
      .insert([{ tenant_id: tenantId, name, email, phone }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTenant(tenantId) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createTemplate(templateData) {
    const { tenant_id, template_name, service_type, duration_minutes, default_message } = templateData;

    const { data, error } = await supabase
      .from('booking_templates')
      .insert([{ tenant_id, template_name, service_type, duration_minutes, default_message }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTemplates(tenantId) {
    const { data, error } = await supabase
      .from('booking_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async getTemplate(tenantId, templateName) {
    const { data, error } = await supabase
      .from('booking_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('template_name', templateName)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
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

    // Create booking in Supabase
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{
        booking_id: bookingId,
        tenant_id,
        customer_name,
        customer_email,
        customer_phone,
        service_type,
        booking_date,
        booking_time,
        duration_minutes,
        notes,
        voiceoffice_reference: voiceofficeReference,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (error) throw error;

    // Send WhatsApp notification if phone number provided
    if (customer_phone) {
      try {
        const metaResult = await meta.sendBookingConfirmation(customer_phone, booking);
        if (metaResult.success) {
          await supabase
            .from('bookings')
            .update({ meta_notification_sent: true })
            .eq('booking_id', bookingId);
          
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
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters.date_from) {
      query = query.gte('booking_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('booking_date', filters.date_to);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('booking_date').order('booking_time');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getBooking(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateBooking(bookingId, updates) {
    const allowedFields = ['customer_name', 'customer_email', 'customer_phone', 'booking_date', 'booking_time', 'notes', 'status'];
    const updateData = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
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

    // Update in Supabase
    const { data: cancelledBooking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) throw error;

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
    await supabase
      .from('notifications')
      .insert([{
        booking_id: bookingId,
        notification_type: type,
        recipient,
        message,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      }]);
  }

  async getNotifications(bookingId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default new BookingService();
