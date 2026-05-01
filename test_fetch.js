const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY; // I need to get the ANON KEY

// Let's read from .env manually
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
}
// But .env doesn't have ANON_KEY, it only has PUBLISHABLE_KEY?
// Actually in the previous command output:
// VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Q1vGBDaIo_cH-_-U4IdWbQ_28BWviHg"
