import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabase() {
  console.log('🚀 Setting up Supabase tables...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('📊 Running migration...\n');

    // Execute the SQL
    // Note: For production, use Supabase CLI or dashboard SQL editor
    // This is a helper script
    
    console.log('⚠️  MANUAL SETUP REQUIRED:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to "SQL Editor" in the left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy the contents from: supabase/migrations/001_initial_schema.sql');
    console.log('6. Paste and click "Run"\n');
    
    console.log('Alternatively, use Supabase CLI:');
    console.log('');
    console.log('  npm install -g supabase');
    console.log('  supabase login');
    console.log('  supabase link --project-ref YOUR_PROJECT_REF');
    console.log('  supabase db push\n');

    console.log('✅ Migration file ready at: supabase/migrations/001_initial_schema.sql');
    console.log('');
    console.log('After running the migration, your tables will be created:');
    console.log('  • tenants');
    console.log('  • booking_templates');
    console.log('  • bookings');
    console.log('  • notifications');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupSupabase();
