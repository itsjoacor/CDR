// backend/src/supabase.client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!; // DEBE ser la ANON KEY, NO la service_role

/**
 * Crea un Supabase client para backend.
 * Si recibe un token de usuario, lo inyecta.
 * Si no, se comporta como cliente público.
 */
export function getSupabaseClient(token?: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
