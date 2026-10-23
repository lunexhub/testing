# 🚀 Quick Start Guide

## Setup in 5 Minutes!

### 1. Clone & Install (1 min)
```bash
git clone https://github.com/lunexhub/testing.git
cd testing
npm install
```

### 2. Setup Supabase Database (2 min)

**Get your Supabase credentials:**
- You have a Supabase access token (keep it secure!)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Click **SQL Editor** → **New Query**
4. Copy ALL content from `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**
6. ✅ Tables created!

**Get your API keys:**
- Go to **Settings** → **API**
- Copy:
  - Project URL
  - anon key  
  - service_role key

### 3. Configure Environment (1 min)

The `.env` file is already created with your VoiceOffice and Vercel tokens!

Just update these in `.env`:
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### 4. Test Locally (1 min)
```bash
npm start
```

Visit `http://localhost:3000` - you should see the API!

### 5. Deploy to Vercel (Auto!)

```bash
npm run deploy
```

That's it! Your booking system is now live! 🎉

---

## 📖 What's Configured?

✅ VoiceOffice API: `vo_test_Q1WRyS4BmyIYw6VcJCYcVYT3DsYrVNGN`  
✅ Project ID: `6829535f-c04f-4e11-b186-3639427682dd`  
✅ Vercel Token: Ready for deployment  
✅ Supabase Token: Ready for table creation  

---

## 🧪 Quick Test

### Create a Tenant
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Business",
    "email": "test@business.com",
    "phone": "+27123456789"
  }'
```

### Create a Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "service_type": "Consultation",
    "booking_date": "2026-10-25",
    "booking_time": "14:00"
  }'
```

---

## 📚 Full Documentation

- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **README.md** - Full API documentation
- **SETUP.md** - Complete setup guide

---

## ⚡ Features Ready to Use

- ✅ Multi-tenant booking system
- ✅ VoiceOffice integration (configured)
- ✅ WhatsApp notifications (add Meta token)
- ✅ Booking templates
- ✅ MCP server for AI agents
- ✅ Vercel deployment ready
- ✅ Supabase database ready

---

## 🆘 Need Help?

- Check `.env` has correct Supabase credentials
- Verify Supabase tables are created
- See DEPLOYMENT_GUIDE.md for troubleshooting
