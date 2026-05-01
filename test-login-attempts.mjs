import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(part => part.trim().replace(/^["']|["']$/g, '')))
);
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

async function check() {
  // Test 1: INSERT with anon key (as browser would)
  const res = await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      email: 'test-admin@sellmate360.com',
      success: true,
      failure_reason: null,
      user_agent: 'Mozilla/5.0 Test'
    })
  });
  const text = await res.text();
  console.log('INSERT Status:', res.status);
  console.log('INSERT Response:', text);

  // Test 2: SELECT to confirm table is visible
  const res2 = await fetch(`${supabaseUrl}/rest/v1/login_attempts?limit=3&order=created_at.desc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  console.log('\nSELECT Status:', res2.status);
  console.log('SELECT Response:', await res2.text());
}
check();
