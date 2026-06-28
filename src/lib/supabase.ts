import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client only if env vars are present; otherwise use a no-op stub
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Mock client for when env vars aren't loaded yet
  supabase = {
    from: () => ({
      upsert: async () => ({ error: null }),
      select: async () => ({ data: null, error: null }),
      delete: async () => ({ error: null }),
      insert: async () => ({ error: null }),
      eq: function() { return this; },
      maybeSingle: async () => ({ data: null, error: null }),
      order: function() { return this; },
      limit: function() { return this; },
    }),
  } as unknown as SupabaseClient;
}

export { supabase };
