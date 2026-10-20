/**
 * VoiceOffice WhatsApp Template Management
 * 
 * WhatsApp templates are pre-approved message formats that can include:
 * - Variables ({{1}}, {{2}}, etc.)
 * - Multiple languages
 * - Media (images, documents, videos)
 * - Buttons (call-to-action, quick replies)
 */

interface CreateTemplateParams {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language?: string;
  body: string;
  header?: {
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    content?: string; // For TEXT headers
    mediaUrl?: string; // For media headers
  };
  footer?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'CALL_TO_ACTION' | 'URL';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

interface SendTemplateParams {
  to: string;
  template: string;
  language?: string;
  parameters?: string[];
  headerMedia?: {
    type: 'image' | 'video' | 'document';
    url: string;
  };
}

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  body: string;
  createdAt: string;
}

class VoiceOfficeTemplateManager {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.VOICEOFFICE_API_KEY || '';
    this.baseUrl = 'https://www.voiceoffice.co.za';
  }

  /**
   * Create a new WhatsApp template
   * Note: Templates must be approved by Meta before use (usually 24-48 hours)
   */
  async createTemplate(params: CreateTemplateParams): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('VOICEOFFICE_API_KEY not configured');
      }

      const response = await fetch(`${this.baseUrl}/v1/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: params.name,
          category: params.category,
          language: params.language || 'en_US',
          components: this.buildTemplateComponents(params),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Template creation failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<Template[]> {
    try {
      if (!this.apiKey) {
        throw new Error('VOICEOFFICE_API_KEY not configured');
      }

      const response = await fetch(`${this.baseUrl}/v1/templates`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`List templates failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List templates error:', error);
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplate(params: SendTemplateParams): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('VOICEOFFICE_API_KEY not configured');
      }

      const payload: any = {
        to: params.to,
        type: 'template',
        template: {
          name: params.template,
          language: {
            code: params.language || 'en_US',
          },
        },
      };

      // Add parameters if provided
      if (params.parameters && params.parameters.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: params.parameters.map((param) => ({
              type: 'text',
              text: param,
            })),
          },
        ];
      }

      // Add header media if provided
      if (params.headerMedia) {
        if (!payload.template.components) {
          payload.template.components = [];
        }
        payload.template.components.unshift({
          type: 'header',
          parameters: [
            {
              type: params.headerMedia.type,
              [params.headerMedia.type]: {
                link: params.headerMedia.url,
              },
            },
          ],
        });
      }

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Send template failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Send template error:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateName: string): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('VOICEOFFICE_API_KEY not configured');
      }

      const response = await fetch(
        `${this.baseUrl}/v1/templates/${templateName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Delete template failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete template error:', error);
      throw error;
    }
  }

  /**
   * Build template components for Meta's format
   */
  private buildTemplateComponents(params: CreateTemplateParams): any[] {
    const components: any[] = [];

    // Header component
    if (params.header) {
      components.push({
        type: 'HEADER',
        format: params.header.type,
        text: params.header.content,
        example: params.header.mediaUrl
          ? {
              header_handle: [params.header.mediaUrl],
            }
          : undefined,
      });
    }

    // Body component (required)
    const bodyVariables = this.extractVariables(params.body);
    components.push({
      type: 'BODY',
      text: params.body,
      example:
        bodyVariables.length > 0
          ? {
              body_text: [bodyVariables.map((v) => `Sample ${v}`)],
            }
          : undefined,
    });

    // Footer component
    if (params.footer) {
      components.push({
        type: 'FOOTER',
        text: params.footer,
      });
    }

    // Buttons component
    if (params.buttons && params.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: params.buttons.map((btn) => {
          if (btn.type === 'QUICK_REPLY') {
            return {
              type: 'QUICK_REPLY',
              text: btn.text,
            };
          } else if (btn.type === 'URL') {
            return {
              type: 'URL',
              text: btn.text,
              url: btn.url,
            };
          } else if (btn.type === 'CALL_TO_ACTION') {
            return {
              type: 'PHONE_NUMBER',
              text: btn.text,
              phone_number: btn.phoneNumber,
            };
          }
        }),
      });
    }

    return components;
  }

  /**
   * Extract variables from template body ({{1}}, {{2}}, etc.)
   */
  private extractVariables(text: string): string[] {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map((m) => m.replace(/[{}]/g, '')) : [];
  }
}

export const templateManager = new VoiceOfficeTemplateManager();

// Pre-built templates for common use cases
export const BOOKING_TEMPLATES = {
  appointmentReminder: {
    name: 'appointment_reminder',
    category: 'UTILITY' as const,
    language: 'en_US',
    body: '⏰ *Appointment Reminder*\n\nHi {{1}}! This is a reminder about your upcoming appointment.\n\n📋 *Service:* {{2}}\n📅 *Date:* {{3}}\n⏰ *Time:* {{4}}\n\nSee you soon!',
    footer: 'Reply CANCEL to cancel',
  },

  bookingConfirmation: {
    name: 'booking_confirmation',
    category: 'UTILITY' as const,
    language: 'en_US',
    body: '✅ *Booking Confirmed!*\n\nHi {{1}}! Your appointment has been confirmed.\n\n📋 *Service:* {{2}}\n📅 *Date:* {{3}}\n⏰ *Time:* {{4}}\n\nWe look forward to seeing you!',
    footer: 'Reply CANCEL to cancel',
    buttons: [
      {
        type: 'QUICK_REPLY' as const,
        text: 'View Details',
      },
      {
        type: 'QUICK_REPLY' as const,
        text: 'Reschedule',
      },
    ],
  },

  cancellationConfirmed: {
    name: 'cancellation_confirmed',
    category: 'UTILITY' as const,
    language: 'en_US',
    body: '❌ *Appointment Cancelled*\n\nHi {{1}}! Your appointment for {{2}} on {{3}} has been cancelled.\n\nWe hope to see you again soon!',
    buttons: [
      {
        type: 'QUICK_REPLY' as const,
        text: 'Book Again',
      },
    ],
  },

  followUp: {
    name: 'feedback_request',
    category: 'UTILITY' as const,
    language: 'en_US',
    body: '👋 *Thank You!*\n\nHi {{1}}! Thank you for choosing us.\n\nHow was your experience with {{2}}?\n\nYour feedback helps us improve!',
    buttons: [
      {
        type: 'QUICK_REPLY' as const,
        text: 'Excellent',
      },
      {
        type: 'QUICK_REPLY' as const,
        text: 'Good',
      },
      {
        type: 'QUICK_REPLY' as const,
        text: 'Needs Improvement',
      },
    ],
  },

  welcomeNewCustomer: {
    name: 'welcome_new_customer',
    category: 'MARKETING' as const,
    language: 'en_US',
    header: {
      type: 'TEXT' as const,
      content: 'Welcome to Our Service! 🎉',
    },
    body: 'Hi {{1}}! Welcome to our booking system.\n\nWe\'re excited to serve you. You can:\n\n• Book appointments 24/7\n• Get instant confirmations\n• Receive reminders\n• Easily reschedule\n\nJust send us a message to get started!',
    footer: 'Powered by VoiceOffice',
    buttons: [
      {
        type: 'QUICK_REPLY' as const,
        text: 'Book Now',
      },
    ],
  },
};
