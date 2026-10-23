# Deployment Guide - Supabase & Vercel

This guide will help you deploy the VoiceOffice Booking System to Supabase and Vercel.

## 🗄️ Part 1: Setup Supabase Database

### Step 1: Get Your Supabase Credentials

You have a Supabase access token (keep it secure!)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select or create your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon/public key**: Copy the `anon` key
   - **service_role key**: Copy the `service_role` key (keep this secret!)

### Step 2: Create Database Tables

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase/migrations/001_initial_schema.sql` from this project
5. Copy ALL the SQL content
6. Paste it into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`
8. ✅ You should see "Success. No rows returned"

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Step 3: Verify Tables Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should see 4 new tables:
   - ✅ `tenants`
   - ✅ `booking_templates`
   - ✅ `bookings`
   - ✅ `notifications`

---

## ☁️ Part 2: Deploy to Vercel

### Prerequisites

- Install Vercel CLI: `npm install -g vercel`
- Your Vercel Token (get from: https://vercel.com/account/tokens)

### Step 1: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Update `.env` with your actual values:

```env
# VoiceOffice (already configured)
VOICEOFFICE_API_KEY=vo_test_Q1WRyS4BmyIYw6VcJCYcVYT3DsYrVNGN
VOICEOFFICE_PROJECT_ID=6829535f-c04f-4e11-b186-3639427682dd
VOICEOFFICE_API_URL=https://www.voiceoffice.co.za/api/v1

# Supabase (add your values from Step 1)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Meta WhatsApp (add if you have)
META_ACCESS_TOKEN=your_meta_token
META_PHONE_NUMBER_ID=your_phone_number_id

# Vercel (get from https://vercel.com/account/tokens)
VERCEL_TOKEN=your_vercel_token_here
```

### Step 2: Deploy Using Script

Run the automated deployment script:

```bash
npm run deploy-vercel
```

This will:
- Login to Vercel using your token
- Link/create the project
- Set all environment variables
- Deploy your application

### Step 3: Manual Deployment (Alternative)

If the script doesn't work, deploy manually:

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
# Go to: https://vercel.com/dashboard
# Select your project → Settings → Environment Variables
# Add each variable from your .env file
```

### Step 4: Add Environment Variables to Vercel

Either the script does this automatically, or manually add them:

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your deployed project
3. Go to **Settings** → **Environment Variables**
4. Add each variable (click **Add** for each):

| Key | Value | Environment |
|-----|-------|-------------|
| `VOICEOFFICE_API_KEY` | `vo_test_Q1WRyS4BmyIYw6VcJCYcVYT3DsYrVNGN` | Production |
| `VOICEOFFICE_PROJECT_ID` | `6829535f-c04f-4e11-b186-3639427682dd` | Production |
| `VOICEOFFICE_API_URL` | `https://www.voiceoffice.co.za/api/v1` | Production |
| `SUPABASE_URL` | Your Supabase URL | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production |
| `SUPABASE_ANON_KEY` | Your anon key | Production |
| `META_ACCESS_TOKEN` | Your Meta token (if any) | Production |
| `META_PHONE_NUMBER_ID` | Your phone number ID (if any) | Production |
| `NODE_ENV` | `production` | Production |

5. Click **Save**
6. Redeploy: `vercel --prod`

---

## ✅ Verification

### Test Your Deployment

1. **Get your Vercel URL**: e.g., `https://your-project.vercel.app`

2. **Test the health endpoint**:
```bash
curl https://your-project.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-10-23T..."
}
```

3. **Create a test tenant**:
```bash
curl -X POST https://your-project.vercel.app/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "email": "test@business.com",
    "phone": "+27123456789"
  }'
```

Should return the created tenant with a `tenant_id`.

4. **Verify in Supabase**:
   - Go to Supabase Dashboard → Table Editor → `tenants`
   - You should see your test tenant!

---

## 🔄 Continuous Deployment

After initial setup, any push to the `main` branch will automatically deploy to Vercel:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically build and deploy!

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: "Supabase client not initialized"
- **Fix**: Check your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables

### VoiceOffice API Errors

**Error**: "VoiceOffice API Error: 401"
- **Fix**: Verify your `VOICEOFFICE_API_KEY` is correct
- Check the key is set in Vercel environment variables

### Deployment Fails

**Error**: "Command failed"
- **Fix**: Make sure Vercel CLI is installed: `npm install -g vercel`
- Login manually: `vercel login`
- Try deploying manually: `vercel --prod`

### Table Not Found

**Error**: "relation 'tenants' does not exist"
- **Fix**: Run the SQL migration in Supabase dashboard (see Part 1, Step 2)

---

## 📊 Monitoring

### View Logs

**Vercel Logs**:
```bash
vercel logs
```

Or in dashboard: https://vercel.com/dashboard → Your Project → Deployments → View Function Logs

**Supabase Logs**:
- Go to Supabase Dashboard → Logs
- Filter by Database or API

---

## 🚀 Production Checklist

Before going live:

- [ ] Supabase tables created successfully
- [ ] All environment variables set in Vercel
- [ ] Test tenant creation works
- [ ] Test booking creation works
- [ ] VoiceOffice integration tested
- [ ] WhatsApp notifications configured (if using)
- [ ] Custom domain added to Vercel (optional)
- [ ] SSL certificate active
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up monitoring/alerts

---

## 🔒 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Keep `service_role` key secret** - Only use in backend
3. **Use `anon` key** for public/client-side access
4. **Enable Supabase RLS policies** for row-level security
5. **Set up Vercel authentication** if needed

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [VoiceOffice API Docs](https://www.voiceoffice.co.za/api/docs)

---

## 🆘 Support

For issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Review this deployment guide
4. Check the main README.md for API documentation
