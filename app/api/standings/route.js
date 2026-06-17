// CourtVisual — standings read endpoint. Serves one league's cached standing rows from
// Supabase for the card's why-line. Read-only via the anon client (RLS allows public
// select on team_standings). Cached 30 min; the cron refreshes the table underneath.
//
// GET /api/standings?league=mlb -> { league, rows: [...], at }

import { supabase } from "../../../lib/supabaseClient";

export const revalidate = 1800;

const COLS = "team_id,team_name,abbr,context_line,division,conference,division_rank,conference_rank,league_rank,playoff_seed,playoff_status,stale,as_of";

export async function GET(request) {
  const league = (new URL(request.url).searchParams.get("league") || "").trim().toLowerCase();
  if (!league) return Response.json({ rows: [], error: "no_league" }, { status: 400 });
  try {
    const { data, error } = await supabase
      .from("team_standings")
      .select(COLS)
      .eq("league", league);
    if (error) return Response.json({ league, rows: [], error: error.message });
    return Response.json({ league, rows: data || [], at: new Date().toISOString() });
  } catch (e) {
    return Response.json({ league, rows: [], error: String(e?.message || e) });
  }
}
