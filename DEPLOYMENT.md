# Deployment Guide - Vercel

## Quick Deploy

Your app is already linked to Vercel. Just add environment variables and deploy.

## 1. Add Environment Variables in Vercel

Go to: https://vercel.com/lunexhubs-projects/testing/settings/environment-variables

Add these variables for **Production**, **Preview**, and **Development**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
VOICEOFFICE_API_KEY=your-voiceoffice-api-key
VOICEOFFICE_WEBHOOK_SECRET=your-random-webhook-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Get your actual values from:**
- SUPABASE_URL: Supabase Dashboard → Settings → API → Project URL
- SUPABASE_SERVICE_KEY: Supabase Dashboard → Settings → API → service_role key
- VOICEOFFICE_API_KEY: Your VoiceOffice API key
- VOICEOFFICE_WEBHOOK_SECRET: Any random string you create
- NEXT_PUBLIC_APP_URL: Your Vercel deployment URL

## 2. Deploy via CLI

```bash
vercel --prod
```

Or just push to GitHub - Vercel auto-deploys!

## 3. Get Your Production URL

After deployment, you'll get a URL like:
```
https://testing-abc123.vercel.app
```

Or check your Vercel dashboard.

## 4. Update VoiceOffice Webhook

Go to VoiceOffice → Developer → Webhook Configuration

Update webhook URL to:
```
https://your-production-url.vercel.app/api/webhook
```

Check these events:
- ✅ message.received
- ✅ message.status
- ✅ customer.connected

## 5. Test the Webhook

Click "Send Test Ping" in VoiceOffice.

You should see:
- ✅ Status 200 OK
- ✅ Response: `{"success": true, "message": "Webhook test received successfully"}`

## 6. Test with Real WhatsApp Message

Send a message to your VoiceOffice WhatsApp number:
```
Hi
```

The bot should respond with the welcome message!

## 7. Check Logs

View logs in Vercel dashboard:
```
https://vercel.com/lunexhubs-projects/testing/logs
```

Look for:
```
📨 Webhook received
📱 Message from +27...
```

## 8. Set Up Supabase Cron (Optional)

For automated reminders, follow: `supabase/CRON-SETUP.md`

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify Supabase URL and key are correct
- Check build logs in Vercel

### Webhook Returns 401
- Verify VOICEOFFICE_WEBHOOK_SECRET matches
- Check VoiceOffice signature is being sent

### Webhook Returns 500
- Check Vercel function logs
- Verify Supabase connection
- Check VoiceOffice API key is valid

### Bot Doesn't Respond
- Check chatbot.processMessage() logs
- Verify Supabase tables exist
- Check VoiceOffice API key has permissions

## Environment Variable Checklist

- [ ] SUPABASE_URL (from Supabase dashboard)
- [ ] SUPABASE_SERVICE_KEY (service_role key, NOT anon key)
- [ ] VOICEOFFICE_API_KEY (from VoiceOffice dashboard)
- [ ] VOICEOFFICE_WEBHOOK_SECRET (secret you created)
- [ ] NEXT_PUBLIC_APP_URL (your Vercel production URL)

## Security Notes

1. **Never commit .env.local** - already in .gitignore
2. **Use service_role key** - anon key won't work
3. **Keep webhook secret secure** - verify signatures in production
4. **Rotate keys regularly** - update in Vercel settings

## Success Indicators

✅ Build completes successfully  
✅ Webhook test returns 200 OK  
✅ Bot responds to WhatsApp messages  
✅ Data appears in Supabase tables  
✅ No errors in Vercel logs  

## Next Steps

1. Test full booking flow end-to-end
2. Set up Supabase cron for reminders
3. Monitor webhook deliveries in VoiceOffice
4. Check appointment data in Supabase
5. Test cancellation and edge cases

---

**Need help?** Check Vercel logs and VoiceOffice webhook delivery status!
