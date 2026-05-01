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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars", supabaseUrl, supabaseKey);
  process.exit(1);
}

async function check() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/attributes?select=id,name,type,attribute_options(id,attribute_id,value,meta)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error("Fetch failed:", res.status, text);
    } else {
      const data = await res.json();
      console.log("Attributes fetch SUCCESS:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
