import { createClient } from "@supabase/supabase-js";

// Project URL + publishable (anon) key are PUBLIC and safe to ship client-side.
// Prefer env vars on Vercel; fall back to project defaults so it works out of the box.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cfnukymdgvzzshsepkpb.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_cXu-upUxQ6pKGJwKYZFFzg_fPfLdfFC";

export const supabase = createClient(url, key);
