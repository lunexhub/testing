# WhatsApp Template Management

Complete guide to creating and managing WhatsApp message templates with VoiceOffice.

## What are WhatsApp Templates?

WhatsApp templates are pre-approved message formats required for:
- **Business-initiated conversations** (outside 24-hour window)
- **Marketing messages**
- **Appointment reminders**
- **Notifications**

**Key points:**
- Templates must be approved by Meta (24-48 hours)
- Can include variables for personalization
- Support buttons, media, and formatting
- Required for automated messaging at scale

## Quick Start

### 1. Access Template Dashboard

Visit: http://localhost:3000/templates

Or in production: https://your-app.vercel.app/templates

### 2. Create Your First Template

Click **"+ Create Template"** and fill in:

```
Name: appointment_reminder
Category: UTILITY
Body: Hi {{1}}! Reminder: Your {{2}} appointment is tomorrow at {{3}}.
Footer: Reply CANCEL to cancel
```

Click **"Create & Submit for Approval"**

### 3. Wait for Approval

- Check VoiceOffice dashboard for status
- Usually approved within 24-48 hours
- UTILITY templates are approved faster

### 4. Use the Template

Once approved, send via API:

```typescript
await templateManager.sendTemplate({
  to: '+27821234567',
  template: 'appointment_reminder',
  parameters: ['John', 'Haircut', '2pm'],
});
```

## Pre-built Templates

We include 5 ready-to-use templates:

### 1. Appointment Reminder
```
Name: appointment_reminder
Category: UTILITY
Variables: Name, Service, Date, Time
```

### 2. Booking Confirmation
```
Name: booking_confirmation
Category: UTILITY
Variables: Name, Service, Date, Time
Buttons: View Details, Reschedule
```

### 3. Cancellation Confirmed
```
Name: cancellation_confirmed
Category: UTILITY
Variables: Name, Service, Date
Button: Book Again
```

### 4. Feedback Request
```
Name: feedback_request
Category: UTILITY
Variables: Name, Service
Buttons: Excellent, Good, Needs Improvement
```

### 5. Welcome New Customer
```
Name: welcome_new_customer
Category: MARKETING
Variables: Name
Header: Welcome to Our Service! 🎉
Button: Book Now
```

## Setup Pre-built Templates

### Option 1: Via Script

```bash
npm install tsx
npx tsx scripts/setup-templates.ts
```

This creates all 5 templates automatically.

### Option 2: Via Dashboard

1. Go to http://localhost:3000/templates
2. Click "+ Create Template"
3. Copy template details from `lib/templates.ts`
4. Submit each one

## Template Variables

Use `{{1}}`, `{{2}}`, `{{3}}` etc. for dynamic content:

```
Hi {{1}}!                    → Hi John!
Your {{2}} on {{3}}          → Your Haircut on Dec 25
Appointment at {{4}}         → Appointment at 2pm
```

**Rules:**
- Start from {{1}} (not {{0}})
- Use sequential numbers
- Maximum 4-5 variables recommended
- Keep messages under 1024 characters

## Template Categories

### UTILITY (Recommended for booking system)
- Transactional messages
- Appointment confirmations
- Reminders
- Updates
- **Fastest approval** (usually same day)

### MARKETING
- Promotional content
- Newsletters
- Special offers
- **Requires opt-in**
- Slower approval (48+ hours)

### AUTHENTICATION
- OTP codes
- Login verification
- Password resets
- **Strict format requirements**

## API Usage

### List Templates

```typescript
const templates = await templateManager.listTemplates();
console.log(templates);
```

Or via HTTP:
```bash
curl http://localhost:3000/api/templates
```

### Create Template

```typescript
await templateManager.createTemplate({
  name: 'my_template',
  category: 'UTILITY',
  language: 'en_US',
  body: 'Hi {{1}}! Your order {{2}} is ready.',
  footer: 'Reply STOP to opt-out',
});
```

Or via HTTP:
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my_template",
    "category": "UTILITY",
    "bodyText": "Hi {{1}}! Your order {{2}} is ready."
  }'
```

### Send Template

```typescript
await templateManager.sendTemplate({
  to: '+27821234567',
  template: 'my_template',
  parameters: ['John', '#12345'],
});
```

Or via HTTP:
```bash
curl -X POST http://localhost:3000/api/templates/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+27821234567",
    "template": "my_template",
    "parameters": ["John", "#12345"]
  }'
```

### Delete Template

```typescript
await templateManager.deleteTemplate('my_template');
```

Or via HTTP:
```bash
curl -X DELETE http://localhost:3000/api/templates/my_template
```

## Advanced Features

### Headers with Media

```typescript
await templateManager.createTemplate({
  name: 'order_update',
  category: 'UTILITY',
  body: 'Your order is on the way!',
  header: {
    type: 'IMAGE',
    mediaUrl: 'https://example.com/image.jpg',
  },
});
```

### Buttons

```typescript
await templateManager.createTemplate({
  name: 'booking_request',
  category: 'UTILITY',
  body: 'Would you like to book an appointment?',
  buttons: [
    { type: 'QUICK_REPLY', text: 'Yes' },
    { type: 'QUICK_REPLY', text: 'No' },
    { type: 'URL', text: 'View Calendar', url: 'https://...' },
  ],
});
```

## Best Practices

### ✅ DO:
- Use UTILITY category for transactional messages
- Keep messages concise and clear
- Test with placeholder values
- Include opt-out instructions
- Use variables for personalization
- Check approval status regularly

### ❌ DON'T:
- Use promotional language in UTILITY templates
- Include external links in body (use buttons)
- Exceed character limits (1024 chars)
- Use special characters unnecessarily
- Send marketing without consent
- Spam customers

## Troubleshooting

### Template Rejected?

**Common reasons:**
- Marketing language in UTILITY template
- Missing opt-out instructions (marketing)
- Invalid variables or formatting
- Content violates WhatsApp policies
- Spelling/grammar errors

**Solution:** Review Meta's guidelines and resubmit with fixes.

### Template Not Sending?

**Check:**
1. Is template approved? (not PENDING)
2. Correct template name?
3. Right number of parameters?
4. Valid phone number format?
5. VoiceOffice API key configured?

### Variables Not Working?

**Ensure:**
- Parameters array matches variable count
- Variables are sequential ({{1}}, {{2}}, {{3}})
- No typos in template name
- Template is APPROVED status

## Integration with Booking System

Templates are automatically used when:

```typescript
// In lib/chatbot.ts
await voiceOffice.sendBookingConfirmation(
  phone,
  name,
  service,
  date,
  time,
  true // Enable template usage
);
```

**Fallback:** If template not approved, uses regular messages automatically.

## Cost Optimization

- **Templates:** Free to create
- **Sending:** Charged per message (check VoiceOffice pricing)
- **Tips:** Batch reminders, use templates for recurring messages

## Next Steps

1. **Create templates** via dashboard or script
2. **Wait for approval** (check VoiceOffice)
3. **Test sending** with a real number
4. **Monitor delivery** in VoiceOffice logs
5. **Integrate** with booking system

## Support

- VoiceOffice Dashboard: https://voiceoffice.co.za
- Template Guidelines: https://developers.facebook.com/docs/whatsapp/message-templates
- API Docs: Check VoiceOffice documentation

---

**Pro Tip:** Start with UTILITY templates for your booking system - they're approved fastest and cover most use cases!
