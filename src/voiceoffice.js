import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VOICEOFFICE_API_KEY;
const PROJECT_ID = process.env.VOICEOFFICE_PROJECT_ID;
const API_URL = process.env.VOICEOFFICE_API_URL || 'https://www.voiceoffice.co.za/api/v1';

class VoiceOfficeClient {
  async makeRequest(endpoint, method = 'GET', data = null) {
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

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`VoiceOffice API Error: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      return responseData;
    } catch (error) {
      console.error('VoiceOffice API request failed:', error);
      throw error;
    }
  }

  async createBooking(bookingData) {
    return await this.makeRequest('/bookings', 'POST', bookingData);
  }

  async getBooking(bookingId) {
    return await this.makeRequest(`/bookings/${bookingId}`, 'GET');
  }

  async updateBooking(bookingId, updates) {
    return await this.makeRequest(`/bookings/${bookingId}`, 'PUT', updates);
  }

  async cancelBooking(bookingId) {
    return await this.makeRequest(`/bookings/${bookingId}/cancel`, 'POST');
  }

  async listBookings(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.makeRequest(`/bookings?${params}`, 'GET');
  }
}

export default new VoiceOfficeClient();
