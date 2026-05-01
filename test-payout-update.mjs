import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v.length) acc[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: payouts } = await supabase.from('payout_requests').select('*').eq('status', 'approved').limit(1);
  if (!payouts || payouts.length === 0) {
    console.log("No approved payouts found");
    return;
  }
  
  const payout = payouts[0];
  console.log('Testing update on:', payout.id);
  
  const { data, error } = await supabase
    .from('payout_requests')
    .update({ status: 'paid', payment_reference: 'TEST-REF' })
    .eq('id', payout.id)
    .select();
    
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
