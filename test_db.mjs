import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ztcgzbnuipjcifbtwzec.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Q1vGBDaIo_cH-_-U4IdWbQ_28BWviHg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data: orders } = await supabase.from('orders').select('id, created_at').limit(5);
  console.log("Orders count:", orders?.length);
  
  if (orders && orders.length > 0) {
    const { data: items } = await supabase.from('order_items').select('*').in('order_id', orders.map(o => o.id));
    console.log("Order Items mapped:", items);
  } else {
    console.log("No orders found");
  }
}

test();
