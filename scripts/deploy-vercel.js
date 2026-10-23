#!/usr/bin/env node
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

console.log('🚀 Deploying to Vercel and setting environment variables...\n');

// Environment variables to set
const envVars = [
  { key: 'VOICEOFFICE_API_KEY', value: process.env.VOICEOFFICE_API_KEY || 'vo_test_Q1WRyS4BmyIYw6VcJCYcVYT3DsYrVNGN' },
  { key: 'VOICEOFFICE_PROJECT_ID', value: process.env.VOICEOFFICE_PROJECT_ID || '6829535f-c04f-4e11-b186-3639427682dd' },
  { key: 'VOICEOFFICE_API_URL', value: process.env.VOICEOFFICE_API_URL || 'https://www.voiceoffice.co.za/api/v1' },
  { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
  { key: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY || '' },
  { key: 'META_ACCESS_TOKEN', value: process.env.META_ACCESS_TOKEN || '' },
  { key: 'META_PHONE_NUMBER_ID', value: process.env.META_PHONE_NUMBER_ID || '' },
  { key: 'NODE_ENV', value: 'production' },
  { key: 'PORT', value: '3000' }
];

try {
  console.log('🔐 Logging into Vercel...');
  process.env.VERCEL_TOKEN = VERCEL_TOKEN;
  
  // Link or deploy the project
  console.log('🔗 Linking project to Vercel...\n');
  
  try {
    execSync('vercel link --yes --token ' + VERCEL_TOKEN, { stdio: 'inherit' });
  } catch (e) {
    console.log('Project already linked or needs manual setup\n');
  }

  console.log('📝 Setting environment variables...\n');
  
  for (const envVar of envVars) {
    if (envVar.value) {
      console.log(`Setting ${envVar.key}...`);
      try {
        execSync(
          `vercel env add ${envVar.key} production --token ${VERCEL_TOKEN}`,
          { 
            input: envVar.value + '\n',
            stdio: ['pipe', 'inherit', 'inherit']
          }
        );
      } catch (e) {
        console.log(`  ⚠️  ${envVar.key} may already exist or failed to set`);
      }
    } else {
      console.log(`⚠️  Skipping ${envVar.key} (no value provided)`);
    }
  }

  console.log('\n✅ Environment variables setup complete!');
  console.log('\n🚀 Deploying to Vercel...\n');
  
  execSync('vercel --prod --token ' + VERCEL_TOKEN, { stdio: 'inherit' });
  
  console.log('\n✅ Deployment complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update your Supabase URL and keys in Vercel dashboard if not set');
  console.log('2. Update Meta WhatsApp credentials if needed');
  console.log('3. Run the Supabase migration (see supabase/migrations/001_initial_schema.sql)');

} catch (error) {
  console.error('❌ Deployment error:', error.message);
  console.log('\n📝 Manual Vercel setup:');
  console.log('1. Install Vercel CLI: npm i -g vercel');
  console.log('2. Login: vercel login');
  console.log('3. Deploy: vercel --prod');
  console.log('4. Set env vars in Vercel dashboard');
  process.exit(1);
}
