import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Singleton browser client â€” safe to import anywhere in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
