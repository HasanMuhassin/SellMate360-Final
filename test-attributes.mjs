import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');

const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking attributes table...");
  const { data: attrData, error: attrError } = await supabase.from('attributes').select('*').limit(5);
  console.log("Attributes result:", JSON.stringify({ data: attrData, error: attrError }));

  console.log("Checking attribute_options table...");
  const { data: optData, error: optError } = await supabase.from('attribute_options').select('*').limit(5);
  console.log("Attribute Options result:", JSON.stringify({ data: optData, error: optError }));

  console.log("Checking product_attributes table...");
  const { data: paData, error: paError } = await supabase.from('product_attributes').select('*').limit(5);
  console.log("Product Attributes result:", JSON.stringify({ data: paData, error: paError }));
}

check();
