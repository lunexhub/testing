# WhatsApp Booking System with VoiceOffice

A production-ready WhatsApp chatbot for appointment booking, built with Next.js, Supabase, and VoiceOffice's WhatsApp Cloud API.

## 🎯 Features

- **Natural Conversation Flow**: Guided booking experience via WhatsApp
- **Service Selection**: Multiple service types (Haircut, Consultation, Styling, Custom)
- **Date & Time Booking**: Flexible date/time parsing (e.g., "today", "tomorrow", "Dec 25", "10am")
- **Instant Confirmations**: Automatic booking confirmation messages
- **24-Hour Reminders**: Automated reminders sent before appointments
- **Follow-up Messages**: Post-appointment feedback requests
- **Easy Cancellation**: Simple "CANCEL" command
- **Conversation State Management**: Persistent conversation tracking
- **Supabase Backend**: Reliable PostgreSQL database

## 🏗️ Architecture

```
WhatsApp Users
      ↓
VoiceOffice (WhatsApp Cloud API)
      ↓
Next.js API Routes (Webhook)
      ↓
Booking Chatbot Logic
      ↓
Supabase (PostgreSQL)
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account ([supabase.com](https://supabase.com))
- VoiceOffice account with WhatsApp API access
- Vercel account (for deployment)

### 2. Set Up Supabase

1. Create a new Supabase project
2. Go to SQL Editor and run `supabase/schema.sql`
3. Get your project URL and service key from Settings → API

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the values:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# VoiceOffice
VOICEOFFICE_API_KEY=vo_live_KYlWYuaD8nqf6pUO2AghmSs3CdIRnMDy
VOICEOFFICE_WEBHOOK_SECRET=your-random-secret

# Cron (for Vercel)
CRON_SECRET=your-cron-secret

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Set Up VoiceOffice Webhook

1. Expose your local server using ngrok or similar:
   ```bash
   ngrok http 3000
   ```

2. Configure VoiceOffice webhook URL:
   ```
   https://your-ngrok-url.ngrok.io/api/webhook
   ```

3. Test by sending a WhatsApp message to your VoiceOffice number

## 📦 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/whatsapp-booking.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables from `.env.local`
4. Deploy!

### 3. Configure VoiceOffice Production Webhook

Update your VoiceOffice webhook to:
```
https://your-app.vercel.app/api/webhook
```

### 4. Set Up Cron Secret

Add `CRON_SECRET` to Vercel environment variables for the reminder system.

## 💬 How It Works

### Conversation Flow

1. **Welcome**: User sends first message
2. **Name**: Bot asks for name
3. **Service**: User selects service type
4. **Date**: User provides preferred date
5. **Time**: User provides preferred time
6. **Confirmation**: Bot shows summary, user confirms
7. **Booking Complete**: Confirmation sent, reminders scheduled

### Commands

- `START` / `RESTART`: Begin new booking
- `CANCEL`: Cancel active appointment
- `YES` / `NO`: Confirmation responses

### Example Conversation

```
User: Hi
Bot: 👋 Welcome to our booking system! What's your name?

User: John
Bot: Great to meet you, John! What service would you like?
     1️⃣ Haircut
     2️⃣ Consultation
     3️⃣ Styling
     4️⃣ Other

User: 1
Bot: Perfect! Haircut it is. When would you like to come in?

User: tomorrow
Bot: Great! Wednesday, October 21, 2026. What time works for you?

User: 2pm
Bot: Perfect! Let me confirm:
     👤 Name: John
     📋 Service: Haircut
     📅 Date: Wednesday, October 21, 2026
     ⏰ Time: 14:00
     Is this correct? Reply YES to confirm.

User: yes
Bot: ✅ Booking Confirmed! [details sent]
```

## 📊 Database Schema

### Tables

- **customers**: Customer profiles (phone, name)
- **appointments**: Booking records
- **conversations**: Conversation state tracking
- **reminders**: Scheduled reminder queue

See `supabase/schema.sql` for full schema.

## 🔧 Customization

### Add New Services

Edit `lib/chatbot.ts` → `handleServiceInput()`:

```typescript
const serviceMap: Record<string, string> = {
  '1': 'Haircut',
  '2': 'Consultation',
  '3': 'New Service', // Add here
  // ...
};
```

### Modify Business Hours

Edit `lib/chatbot.ts` → `handleTimeInput()`:

```typescript
// Our hours: 9:00 AM - 6:00 PM
```

Add validation logic for allowed hours.

### Customize Messages

Edit `lib/voiceoffice.ts` to modify message templates:
- `sendBookingConfirmation()`
- `send24HourReminder()`
- `sendFollowUp()`

## 🔐 Security Notes

- **No Authentication**: This is a test implementation
- **Service Role Key**: Uses Supabase service role (bypasses RLS)
- **For Production**: Implement proper RLS policies and webhook signature verification

## 🐛 Debugging

### Check Webhook Logs

View Vercel function logs or local console for incoming webhooks:

```bash
npm run dev
# Check terminal for webhook payloads
```

### Test Reminders Manually

```bash
curl https://your-app.vercel.app/api/reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### Verify Database

Check Supabase dashboard → Table Editor to see records in real-time.

## 📱 VoiceOffice API Integration

### Send Message Example

```typescript
await voiceOffice.sendMessage({
  to: '+1234567890',
  message: 'Hello from VoiceOffice!',
});
```

### Webhook Payload (Expected)

```json
{
  "from": "+1234567890",
  "message": "Hello",
  "messageId": "msg_123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Note**: Adjust field names in `app/api/webhook/route.ts` based on VoiceOffice's actual payload structure.

## 📈 Next Steps

- [ ] Add appointment availability checking
- [ ] Implement recurring bookings
- [ ] Add admin dashboard
- [ ] Support multiple languages
- [ ] Add payment integration
- [ ] Implement queue system for high volume
- [ ] Add analytics and reporting
- [ ] Support voice notes and images

## 🤝 Contributing

This is a test project. Feel free to fork and customize!

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [VoiceOffice](https://voiceoffice.co.za/)
- [date-fns](https://date-fns.org/)

---

**Need help?** Check the logs, verify your environment variables, and ensure VoiceOffice webhook is configured correctly.
