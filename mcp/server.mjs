import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_KEY = process.env.VOICEOFFICE_API_KEY;
const PROJECT_ID = process.env.VOICEOFFICE_PROJECT_ID;
const API_URL = process.env.VOICEOFFICE_API_URL || 'https://www.voiceoffice.co.za/api/v1';

class VoiceOfficeServer {
  constructor() {
    this.server = new Server(
      {
        name: 'voiceoffice-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_booking',
          description: 'Create a new booking in VoiceOffice',
          inputSchema: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string', description: 'Tenant ID for multi-tenancy' },
              customer_name: { type: 'string', description: 'Customer name' },
              customer_email: { type: 'string', description: 'Customer email' },
              customer_phone: { type: 'string', description: 'Customer phone number' },
              service_type: { type: 'string', description: 'Type of service to book' },
              booking_date: { type: 'string', description: 'Booking date (ISO format)' },
              booking_time: { type: 'string', description: 'Booking time (HH:MM format)' },
              notes: { type: 'string', description: 'Additional notes' }
            },
            required: ['tenant_id', 'customer_name', 'customer_email', 'service_type', 'booking_date', 'booking_time']
          }
        },
        {
          name: 'get_bookings',
          description: 'Get bookings for a tenant',
          inputSchema: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string', description: 'Tenant ID' },
              date_from: { type: 'string', description: 'Start date filter (ISO format)' },
              date_to: { type: 'string', description: 'End date filter (ISO format)' }
            },
            required: ['tenant_id']
          }
        },
        {
          name: 'create_template',
          description: 'Create a booking template',
          inputSchema: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string', description: 'Tenant ID' },
              template_name: { type: 'string', description: 'Template name' },
              service_type: { type: 'string', description: 'Service type' },
              duration_minutes: { type: 'number', description: 'Duration in minutes' },
              default_message: { type: 'string', description: 'Default booking message' }
            },
            required: ['tenant_id', 'template_name', 'service_type', 'duration_minutes']
          }
        },
        {
          name: 'get_templates',
          description: 'Get all templates for a tenant',
          inputSchema: {
            type: 'object',
            properties: {
              tenant_id: { type: 'string', description: 'Tenant ID' }
            },
            required: ['tenant_id']
          }
        },
        {
          name: 'send_meta_notification',
          description: 'Send booking notification via Meta (WhatsApp)',
          inputSchema: {
            type: 'object',
            properties: {
              phone_number: { type: 'string', description: 'WhatsApp phone number' },
              message: { type: 'string', description: 'Notification message' },
              booking_id: { type: 'string', description: 'Booking ID' }
            },
            required: ['phone_number', 'message']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'create_booking':
            return await this.createBooking(request.params.arguments);
          case 'get_bookings':
            return await this.getBookings(request.params.arguments);
          case 'create_template':
            return await this.createTemplate(request.params.arguments);
          case 'get_templates':
            return await this.getTemplates(request.params.arguments);
          case 'send_meta_notification':
            return await this.sendMetaNotification(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async makeAPIRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Project-ID': PROJECT_ID
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return responseData;
  }

  async createBooking(args) {
    const result = await this.makeAPIRequest('/bookings', 'POST', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async getBookings(args) {
    const params = new URLSearchParams({
      tenant_id: args.tenant_id,
      ...(args.date_from && { date_from: args.date_from }),
      ...(args.date_to && { date_to: args.date_to })
    });
    const result = await this.makeAPIRequest(`/bookings?${params}`, 'GET');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async createTemplate(args) {
    const result = await this.makeAPIRequest('/templates', 'POST', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async getTemplates(args) {
    const result = await this.makeAPIRequest(`/templates?tenant_id=${args.tenant_id}`, 'GET');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async sendMetaNotification(args) {
    const result = await this.makeAPIRequest('/notifications/meta', 'POST', args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('VoiceOffice MCP server running on stdio');
  }
}

const server = new VoiceOfficeServer();
server.run().catch(console.error);
