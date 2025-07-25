import { createClient } from '@supabase/supabase-js';

// Add debug logging to verify values
console.log('Env vars:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(`
    Missing Supabase credentials!
    URL: ${SUPABASE_URL}
    KEY: ${SUPABASE_ANON_KEY ? '*** (present but hidden)' : 'MISSING'}
  `);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);