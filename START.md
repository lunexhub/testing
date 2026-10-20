# Quick Start - Get Running in 3 Minutes

## Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

## Step 2: Start Dev Server (in one terminal)
```bash
npm run dev
```

Wait for "Ready" message. Keep this terminal open.

## Step 3: Expose with Tunnel (in a NEW terminal)
```bash
npx localtunnel --port 3000
```

You'll see:
```
your url is: https://happy-turtle-42.loca.lt
```

## Step 4: Copy the URL
Copy the URL it gives you (e.g., `https://happy-turtle-42.loca.lt`)

## Step 5: Paste in VoiceOffice
Paste in the webhook field with `/api/webhook` at the end:
```
https://happy-turtle-42.loca.lt/api/webhook
```

## Step 6: Test!
Send a WhatsApp message to your VoiceOffice number.

Check your first terminal (where `npm run dev` is running) - you should see webhook logs!

---

## Troubleshooting

**localtunnel shows a warning page?**
Click "Continue" or add `--subdomain` flag:
```bash
npx localtunnel --port 3000 --subdomain myapp123
```

**Still not working?**
Check your first terminal for error messages.
