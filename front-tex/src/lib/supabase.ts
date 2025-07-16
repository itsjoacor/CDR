

import { createClient } from '@supabase/supabase-js';

//const SUPABASE_URL = process.env.SUPABASE_URL || '';
//const SUPABASE_KEY = process.env.SUPABASE_KEY || '';


const SUPABASE_URL = "https://slknsxiuroaqyrjvsmsy.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsa25zeGl1cm9hcXlyanZzbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODk4NTUsImV4cCI6MjA2NTY2NTg1NX0.HM1yYdjVQXwH_KO2h6mdp-RVFPSycaQkb3_LlVaVaFE"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);