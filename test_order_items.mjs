import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data: orders } = await supabase.from('orders').select('id, created_at').limit(5);
  console.log("Orders:", orders);
  
  if (orders && orders.length > 0) {
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orders[0].id);
    console.log("Order Items for order 0:", items);
  }
}

test();
