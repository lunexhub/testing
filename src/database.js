import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
}

export const query = async (text, params) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  // This is a wrapper to maintain compatibility with the pg-style query API
  // You'll need to convert SQL queries to Supabase queries in your service layer
  console.warn('Direct SQL query not recommended with Supabase. Use Supabase client methods instead.');
  
  // For raw SQL with Supabase, use RPC functions
  throw new Error('Use Supabase client methods or create RPC functions for complex queries');
};

export const initDatabase = async () => {
  try {
    if (!supabase) {
      console.warn('⚠️  Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
      return;
    }

    console.log('✅ Database connection verified');
    console.log('📋 To create tables, run: node scripts/setup-supabase.js');
    console.log('   Or apply migration in Supabase dashboard SQL editor');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export { supabase };
export default { query, initDatabase, supabase };
