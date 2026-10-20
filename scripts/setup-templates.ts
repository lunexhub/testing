/**
 * Setup Script: Create Pre-built Booking Templates
 * 
 * Run with: npx tsx scripts/setup-templates.ts
 * 
 * This creates common templates for the booking system:
 * - Appointment reminders
 * - Booking confirmations
 * - Cancellation notices
 * - Follow-up requests
 */

import { templateManager, BOOKING_TEMPLATES } from '../lib/templates';

async function setupTemplates() {
  console.log('🚀 Setting up WhatsApp templates...\n');

  const templatesToCreate = [
    BOOKING_TEMPLATES.appointmentReminder,
    BOOKING_TEMPLATES.bookingConfirmation,
    BOOKING_TEMPLATES.cancellationConfirmed,
    BOOKING_TEMPLATES.followUp,
    BOOKING_TEMPLATES.welcomeNewCustomer,
  ];

  for (const template of templatesToCreate) {
    try {
      console.log(`📝 Creating template: ${template.name}`);
      
      const result = await templateManager.createTemplate(template);
      
      console.log(`✅ Created: ${template.name}`);
      console.log(`   Status: Pending approval (24-48 hours)\n`);
    } catch (error) {
      console.error(`❌ Failed to create ${template.name}:`, error);
      console.log('');
    }
  }

  console.log('✨ Template setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Wait for Meta to approve templates (24-48 hours)');
  console.log('2. Check approval status in VoiceOffice dashboard');
  console.log('3. Once approved, use them in your booking system');
  console.log('\n💡 View templates at: http://localhost:3000/templates');
}

setupTemplates().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
