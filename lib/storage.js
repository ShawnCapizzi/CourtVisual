// On-device storage for v1 — no accounts required.
//
// The SHAPE here mirrors the eventual Supabase rows so swapping to auth later is a
// drop-in. When Supabase + auth land:
//   profile.team  -> profiles.home_team / user_teams (primary)
//   favorites     -> user_teams + a followed_players table
//   prefs         -> a user_prefs row (weights, cardStyle, accent)
// Replace load()/save() with supabase queries keyed by auth.uid(); the app code
// that calls store.load()/store.save() stays the same.
const KEY = "gamescore:v1";

function readAll() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export const store = {
  load() { return readAll(); },
  save(partial) {
    if (typeof window === "undefined") return partial;
    const next = { ...readAll(), ...partial };
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  },
};

// --- Remote sync (Supabase) ---------------------------------------------
import { supabase } from "./supabaseClient";

export async function loadRemote(userId) {
  try {
    const { data, error } = await supabase.from("user_state").select("state").eq("user_id", userId).maybeSingle();
    if (error) return null;
    return data?.state || null;
  } catch { return null; }
}
export async function saveRemote(userId, state) {
  try { await supabase.from("user_state").upsert({ user_id: userId, state, updated_at: new Date().toISOString() }); } catch {}
}
