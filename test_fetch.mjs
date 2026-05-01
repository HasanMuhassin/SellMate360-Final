import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
    supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
  }
}

async function test() {
  const getRes = await fetch(`${supabaseUrl}/rest/v1/payout_requests?limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!getRes.ok) {
    console.error("Failed to get:", await getRes.text());
    return;
  }
  
  const payouts = await getRes.json();
  if (payouts.length === 0) {
    console.log("No payouts");
    return;
  }
  
  const payout = payouts[0];
  console.log("Updating payout:", payout.id, "current status:", payout.status);
  
  const newStatus = payout.status === 'pending' ? 'approved' : 'pending';
  
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/payout_requests?id=eq.${payout.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ status: newStatus })
  });
  
  if (!patchRes.ok) {
    console.error("Patch failed:", await patchRes.text());
  } else {
    console.log("Patch success:", await patchRes.json());
  }
}

test();
