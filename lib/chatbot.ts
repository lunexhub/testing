import { supabase } from './supabase';
import { voiceOffice } from './voiceoffice';
import { format, addDays, parse, isAfter, isBefore, startOfDay } from 'date-fns';

/**
 * Conversation states for the booking flow
 */
export enum ConversationState {
  INITIAL = 'initial',
  AWAITING_NAME = 'awaiting_name',
  AWAITING_SERVICE = 'awaiting_service',
  AWAITING_DATE = 'awaiting_date',
  AWAITING_TIME = 'awaiting_time',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
}

/**
 * Main chatbot logic handler
 */
export class BookingChatbot {
  /**
   * Process incoming WhatsApp message
   */
  async processMessage(phone: string, message: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    const normalizedMessage = message.trim().toLowerCase();

    // Handle cancel command
    if (normalizedMessage === 'cancel') {
      await this.handleCancel(normalizedPhone);
      return;
    }

    // Handle restart command
    if (normalizedMessage === 'restart' || normalizedMessage === 'start') {
      await this.resetConversation(normalizedPhone);
      await this.sendWelcomeMessage(normalizedPhone);
      return;
    }

    // Get or create customer
    const customer = await this.getOrCreateCustomer(normalizedPhone);

    // Get current conversation state
    const conversation = await this.getConversation(normalizedPhone);

    if (!conversation) {
      // Start new conversation
      await this.startNewConversation(normalizedPhone, customer.id);
      return;
    }

    // Process based on current state
    await this.handleConversationState(
      conversation,
      customer,
      normalizedMessage,
      message // Keep original for name
    );
  }

  /**
   * Handle conversation state transitions
   */
  private async handleConversationState(
    conversation: any,
    customer: any,
    normalizedMessage: string,
    originalMessage: string
  ): Promise<void> {
    const { state, context, phone } = conversation;

    switch (state) {
      case ConversationState.AWAITING_NAME:
        await this.handleNameInput(phone, customer.id, originalMessage, context);
        break;

      case ConversationState.AWAITING_SERVICE:
        await this.handleServiceInput(phone, customer.id, normalizedMessage, context);
        break;

      case ConversationState.AWAITING_DATE:
        await this.handleDateInput(phone, customer.id, normalizedMessage, context);
        break;

      case ConversationState.AWAITING_TIME:
        await this.handleTimeInput(phone, customer.id, normalizedMessage, context);
        break;

      case ConversationState.CONFIRMING:
        await this.handleConfirmation(phone, customer.id, normalizedMessage, context);
        break;

      default:
        await this.sendWelcomeMessage(phone);
        break;
    }
  }

  /**
   * Handle name input
   */
  private async handleNameInput(
    phone: string,
    customerId: string,
    name: string,
    context: any
  ): Promise<void> {
    // Update customer name
    await supabase
      .from('customers')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', customerId);

    // Update conversation context
    const updatedContext = { ...context, name };
    await this.updateConversationState(
      phone,
      ConversationState.AWAITING_SERVICE,
      updatedContext
    );

    // Ask for service
    await voiceOffice.sendMessage({
      to: phone,
      message: `Great to meet you, ${name}! 👋\n\nWhat service would you like to book?\n\n1️⃣ Haircut\n2️⃣ Consultation\n3️⃣ Styling\n4️⃣ Other\n\nJust send the number or type the service name.`,
    });
  }

  /**
   * Handle service input
   */
  private async handleServiceInput(
    phone: string,
    customerId: string,
    input: string,
    context: any
  ): Promise<void> {
    const serviceMap: Record<string, string> = {
      '1': 'Haircut',
      '2': 'Consultation',
      '3': 'Styling',
      '4': 'Other',
      'haircut': 'Haircut',
      'consultation': 'Consultation',
      'styling': 'Styling',
      'other': 'Other',
    };

    const service = serviceMap[input] || input;

    const updatedContext = { ...context, service };
    await this.updateConversationState(
      phone,
      ConversationState.AWAITING_DATE,
      updatedContext
    );

    const today = format(new Date(), 'EEEE, MMM d');
    const tomorrow = format(addDays(new Date(), 1), 'EEEE, MMM d');

    await voiceOffice.sendMessage({
      to: phone,
      message: `Perfect! ${service} it is. 📅\n\nWhen would you like to come in?\n\nYou can type:\n• "today" or "tomorrow"\n• A date like "Dec 25" or "25 Dec"\n• Or just tell me the day!\n\nExample: Today, Tomorrow, or ${tomorrow}`,
    });
  }

  /**
   * Handle date input
   */
  private async handleDateInput(
    phone: string,
    customerId: string,
    input: string,
    context: any
  ): Promise<void> {
    const date = this.parseDate(input);

    if (!date) {
      await voiceOffice.sendMessage({
        to: phone,
        message: `Hmm, I didn't understand that date. 🤔\n\nPlease try again:\n• "today" or "tomorrow"\n• "Dec 25" or "25 Dec"\n• Or name the day!`,
      });
      return;
    }

    // Check if date is in the past
    if (isBefore(date, startOfDay(new Date()))) {
      await voiceOffice.sendMessage({
        to: phone,
        message: `That date has passed! ⏰\n\nPlease choose a date from today onwards.`,
      });
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'EEEE, MMMM d, yyyy');

    const updatedContext = { ...context, date: formattedDate, displayDate };
    await this.updateConversationState(
      phone,
      ConversationState.AWAITING_TIME,
      updatedContext
    );

    await voiceOffice.sendMessage({
      to: phone,
      message: `Great! ${displayDate}. ⏰\n\nWhat time works for you?\n\nOur hours: 9:00 AM - 6:00 PM\n\nExamples:\n• 10am or 10:00\n• 2:30pm or 14:30\n• 3pm`,
    });
  }

  /**
   * Handle time input
   */
  private async handleTimeInput(
    phone: string,
    customerId: string,
    input: string,
    context: any
  ): Promise<void> {
    const time = this.parseTime(input);

    if (!time) {
      await voiceOffice.sendMessage({
        to: phone,
        message: `I didn't understand that time. 🕐\n\nPlease try:\n• 10am or 10:00\n• 2:30pm or 14:30\n• 3pm`,
      });
      return;
    }

    const updatedContext = { ...context, time };
    await this.updateConversationState(
      phone,
      ConversationState.CONFIRMING,
      updatedContext
    );

    // Show confirmation
    const { name, service, displayDate } = context;
    await voiceOffice.sendMessage({
      to: phone,
      message: `Perfect! Let me confirm your booking:\n\n👤 *Name:* ${name}\n📋 *Service:* ${service}\n📅 *Date:* ${displayDate}\n⏰ *Time:* ${time}\n\nIs this correct?\n\nReply *YES* to confirm or *NO* to start over.`,
    });
  }

  /**
   * Handle booking confirmation
   */
  private async handleConfirmation(
    phone: string,
    customerId: string,
    input: string,
    context: any
  ): Promise<void> {
    if (input === 'yes' || input === 'y' || input === 'confirm') {
      // Create appointment
      const { name, service, date, time } = context;

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId,
          service_type: service,
          appointment_date: date,
          appointment_time: time,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        await voiceOffice.sendMessage({
          to: phone,
          message: `Sorry, something went wrong. Please try again or contact us directly.`,
        });
        return;
      }

      // Create confirmation reminder
      await supabase.from('reminders').insert({
        appointment_id: appointment.id,
        reminder_type: 'confirmation',
        scheduled_for: new Date().toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      // Send confirmation message
      await voiceOffice.sendBookingConfirmation(
        phone,
        name,
        service,
        context.displayDate,
        time
      );

      // Complete conversation
      await this.updateConversationState(phone, ConversationState.COMPLETED, {});

      // Create 24-hour reminder (simplified - in production use a queue)
      const reminderDate = new Date(date);
      reminderDate.setHours(reminderDate.getHours() - 24);

      await supabase.from('reminders').insert({
        appointment_id: appointment.id,
        reminder_type: '24h_before',
        scheduled_for: reminderDate.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    } else if (input === 'no' || input === 'n') {
      await this.resetConversation(phone);
      await voiceOffice.sendMessage({
        to: phone,
        message: `No problem! Let's start over. 😊\n\nWhat's your name?`,
      });
    } else {
      await voiceOffice.sendMessage({
        to: phone,
        message: `Please reply *YES* to confirm or *NO* to start over.`,
      });
    }
  }

  /**
   * Send welcome message and start conversation
   */
  private async sendWelcomeMessage(phone: string): Promise<void> {
    await voiceOffice.sendMessage({
      to: phone,
      message: `👋 Welcome to our booking system!\n\nI'm here to help you schedule an appointment.\n\nLet's get started! What's your name?`,
    });

    await this.updateConversationState(phone, ConversationState.AWAITING_NAME, {});
  }

  /**
   * Handle cancel command
   */
  private async handleCancel(phone: string): Promise<void> {
    // Find active appointments
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single();

    if (customer) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'confirmed')
        .order('appointment_date', { ascending: true });

      if (appointments && appointments.length > 0) {
        // Cancel the next appointment
        await supabase
          .from('appointments')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', appointments[0].id);

        await voiceOffice.sendMessage({
          to: phone,
          message: `Your appointment has been cancelled. We hope to see you again soon! 👋`,
        });
      } else {
        await voiceOffice.sendMessage({
          to: phone,
          message: `You don't have any active appointments to cancel.`,
        });
      }
    }

    await this.resetConversation(phone);
  }

  /**
   * Get or create customer
   */
  private async getOrCreateCustomer(phone: string): Promise<any> {
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) return existing;

    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return newCustomer;
  }

  /**
   * Get current conversation
   */
  private async getConversation(phone: string): Promise<any> {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('phone', phone)
      .single();

    return data;
  }

  /**
   * Start new conversation
   */
  private async startNewConversation(phone: string, customerId: string): Promise<void> {
    await supabase.from('conversations').upsert({
      customer_id: customerId,
      phone,
      state: ConversationState.AWAITING_NAME,
      context: {},
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.sendWelcomeMessage(phone);
  }

  /**
   * Update conversation state
   */
  private async updateConversationState(
    phone: string,
    state: ConversationState,
    context: any
  ): Promise<void> {
    await supabase
      .from('conversations')
      .update({
        state,
        context,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('phone', phone);
  }

  /**
   * Reset conversation
   */
  private async resetConversation(phone: string): Promise<void> {
    await supabase.from('conversations').delete().eq('phone', phone);
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Parse date from user input
   */
  private parseDate(input: string): Date | null {
    const today = new Date();
    const normalized = input.toLowerCase().trim();

    if (normalized === 'today') {
      return today;
    }

    if (normalized === 'tomorrow') {
      return addDays(today, 1);
    }

    // Try various date formats
    const formats = [
      'MMM d',
      'd MMM',
      'MMMM d',
      'd MMMM',
      'MM/dd',
      'dd/MM',
      'yyyy-MM-dd',
    ];

    for (const fmt of formats) {
      try {
        const parsed = parse(input, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
          // If no year specified, use current year
          if (!input.includes(today.getFullYear().toString())) {
            parsed.setFullYear(today.getFullYear());
          }
          return parsed;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Parse time from user input
   */
  private parseTime(input: string): string | null {
    const normalized = input.toLowerCase().trim().replace(/\s+/g, '');

    // Match patterns like: 10am, 10:30pm, 14:30, 2pm, etc.
    const patterns = [
      /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i,
      /^(\d{1,2})\s*(am|pm)$/i,
      /^(\d{1,2})$/,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] || match[2];

        if (period && period.toLowerCase() === 'pm' && hours < 12) {
          hours += 12;
        } else if (period && period.toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    return null;
  }
}

export const chatbot = new BookingChatbot();
