const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: payouts, error: getError } = await supabase
    .from('payout_requests')
    .select('*')
    .limit(1);

  if (getError) {
    console.error("Get error:", getError);
    return;
  }

  if (payouts.length === 0) {
    console.log("No payouts to test");
    return;
  }

  const payout = payouts[0];
  console.log("Testing update on payout:", payout.id, "current status:", payout.status);

  const newStatus = payout.status === 'pending' ? 'approved' : 'pending';
  
  const { data, error } = await supabase
    .from('payout_requests')
    .update({ status: newStatus })
    .eq('id', payout.id)
    .select();

  if (error) {
    console.error("Update error:", error);
  } else {
    console.log("Update success:", data);
  }
}

test();
