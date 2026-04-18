import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ztcgzbnuipjcifbtwzec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Y2d6Ym51aXBqY2lmYnR3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTc5NzksImV4cCI6MjA4NTE3Mzk3OX0.0ZoWHR15eoq1lNmrEqwgtjKYM9Ydo97LMuojtOzxGfA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
