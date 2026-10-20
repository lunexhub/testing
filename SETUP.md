# Setup Guide - WhatsApp Booking System

## 🎯 Complete Setup Checklist

### Step 1: Supabase Setup

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and set project name
   - Set a strong database password
   - Select region closest to your users

2. **Run Database Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy entire contents of `supabase/schema.sql`
   - Paste and click "Run"
   - Verify tables created: customers, appointments, conversations, reminders

3. **Get API Credentials**
   - Go to Settings → API
   - Copy **Project URL** (looks like: https://xxxxx.supabase.co)
   - Copy **service_role** key (NOT anon/public key)
   - Save these for .env.local

### Step 2: Update Environment Variables

1. **Copy example file**
   ```bash
   cp .env.example .env.local
   ```

2. **Update .env.local with your values:**
   ```env
   # From Supabase Settings → API
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Your actual VoiceOffice API key
   VOICEOFFICE_API_KEY=vo_live_KYlWYuaD8nqf6pUO2AghmSs3CdIRnMDy

   # Generate a random string for webhook security
   VOICEOFFICE_WEBHOOK_SECRET=your-random-secret-here-abc123

   # For local development
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Generate random string for cron endpoint
   CRON_SECRET=another-random-secret-xyz789
   ```

### Step 3: Install & Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   - Go to http://localhost:3000
   - You should see "Webhook Active" page

### Step 4: Expose Local Server (for testing)

**Option A: Using ngrok**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

**Option B: Using Cloudflare Tunnel**
```bash
# Install cloudflared
cloudflared tunnel --url http://localhost:3000
```

**Option C: Using localtunnel**
```bash
npx localtunnel --port 3000
```

Copy the public URL (e.g., https://abc123.ngrok.io)

### Step 5: Configure VoiceOffice Webhook

1. **Log in to VoiceOffice Dashboard**
   - Go to your VoiceOffice account settings

2. **Set Webhook URL**
   - Find "Webhook Settings" or "API Configuration"
   - Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/webhook`
   - Example: `https://abc123.ngrok.io/api/webhook`

3. **Test the webhook**
   - Send a WhatsApp message to your VoiceOffice number
   - Check your terminal logs for incoming webhook
   - You should see: "Webhook received: { from: '+...', message: '...' }"

### Step 6: Test the Bot

1. **Send first message**
   ```
   Hi
   ```

2. **Bot should respond**
   ```
   👋 Welcome to our booking system!
   I'm here to help you schedule an appointment.
   Let's get started! What's your name?
   ```

3. **Complete booking flow**
   - Enter your name
   - Choose service (send 1, 2, 3, or service name)
   - Enter date (today, tomorrow, or specific date)
   - Enter time (10am, 2:30pm, etc.)
   - Confirm with YES

4. **Check Supabase**
   - Go to Table Editor
   - Check `customers`, `appointments`, `conversations` tables
   - You should see your data!

### Step 7: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/whatsapp-booking.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Framework Preset: Next.js (auto-detected)

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add all variables from .env.local:
     - SUPABASE_URL
     - SUPABASE_SERVICE_KEY
     - VOICEOFFICE_API_KEY
     - VOICEOFFICE_WEBHOOK_SECRET
     - CRON_SECRET
   - Set for: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Copy your production URL (e.g., https://your-app.vercel.app)

5. **Update VoiceOffice Webhook**
   - Change webhook URL to production: `https://your-app.vercel.app/api/webhook`
   - Save changes

6. **Test Production**
   - Send WhatsApp message
   - Should work exactly like local!

### Step 8: Verify Cron Job

1. **Check Vercel Cron**
   - Go to Vercel project → Settings → Cron Jobs
   - You should see: `/api/reminders` running every hour

2. **Test manually**
   ```bash
   curl https://your-app.vercel.app/api/reminders \
     -H "Authorization: Bearer your-cron-secret"
   ```

3. **Check response**
   ```json
   {
     "message": "Reminders processed",
     "sent": 0,
     "failed": 0,
     "total": 0
   }
   ```

## 🎉 You're Done!

Your WhatsApp booking system is now live!

## 🧪 Testing Checklist

- [ ] Local server starts without errors
- [ ] Webhook receives messages
- [ ] Bot responds to first message
- [ ] Full booking flow works
- [ ] Data appears in Supabase
- [ ] Confirmation message sent
- [ ] Vercel deployment successful
- [ ] Production webhook works
- [ ] Cron job configured

## 🐛 Troubleshooting

### Bot doesn't respond

1. Check ngrok/tunnel is running
2. Check terminal logs for webhook payload
3. Verify VOICEOFFICE_API_KEY is correct
4. Check VoiceOffice webhook URL is correct

### Database errors

1. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
2. Check SQL schema ran successfully
3. Verify tables exist in Supabase dashboard

### Messages not sending

1. Check VoiceOffice API key is valid
2. Check VoiceOffice account has credits/active subscription
3. Check terminal logs for API error messages
4. Verify VoiceOffice endpoint URL is correct

### Vercel deployment fails

1. Check build logs for errors
2. Verify all environment variables are set
3. Ensure TypeScript compiles: `npm run build`
4. Check Next.js version compatibility

## 📞 Support

- VoiceOffice API issues: Contact VoiceOffice support
- Supabase issues: Check [Supabase docs](https://supabase.com/docs)
- Vercel issues: Check [Vercel docs](https://vercel.com/docs)

## 🔒 Security Reminder

- Never commit .env.local to Git
- Rotate API keys regularly
- Use webhook signature verification in production
- Implement rate limiting for production use
