// CourtVisual — scheduled standings ingestion.
// Pulls ESPN standings for each league, runs the verified normalizer + formatter, and
// upserts one row per team into public.team_standings. Triggered by Vercel Cron (see
// vercel.json) with an Authorization: Bearer ${CRON_SECRET} header; also runnable by hand
// with the same header for testing. Writes use the SERVICE ROLE key (server-only).
//
// Env required (Vercel -> Settings -> Environment Variables):
//   NEXT_PUBLIC_SUPABASE_URL        (already set)
//   SUPABASE_SERVICE_ROLE_KEY       (the secret/service_role key — NEVER NEXT_PUBLIC)
//   CRON_SECRET                     (any long random string)

import { createClient } from "@supabase/supabase-js";
import { normalizeEspnStandings, standingRow } from "../../../../lib/standings-espn";
import { teamStandingLine } from "../../../../lib/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// sport = ESPN path segment + normalizer SHAPE key; lg = ESPN league slug; league = our key.
const LEAGUES = [
  { league: "mlb",  sport: "baseball",   lg: "mlb" },
  { league: "nba",  sport: "basketball", lg: "nba" },
  { league: "nhl",  sport: "hockey",     lg: "nhl" },
  { league: "nfl",  sport: "football",   lg: "nfl" },
  { league: "wnba", sport: "basketball", lg: "wnba" },
  { league: "mls",  sport: "soccer",     lg: "usa.1" },
];

const ESPN = (sport, lg) => `https://site.api.espn.com/apis/v2/sports/${sport}/${lg}/standings`;

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "missing_supabase_env" }, { status: 500 });
if (new URL(request.url).searchParams.get("debug") === "1") {
    return Response.json({
      urlHost: url ? new URL(url).host : null,
      keyLen: key ? key.length : 0,
      keyStart: key ? key.slice(0, 6) : null,
      keyIsJwt: key ? key.split(".").length === 3 : false,
    });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const results = [];

  for (const { league, sport, lg } of LEAGUES) {
    try {
      const res = await fetch(ESPN(sport, lg), {
        cache: "no-store",
        headers: { "User-Agent": "CourtVisual/1.0 (+standings-cron)" },
      });
      if (!res.ok) { results.push({ league, ok: false, error: `espn_${res.status}` }); continue; }
      const json = await res.json();

      const contexts = normalizeEspnStandings(json, sport, league);
      const rows = contexts
        .filter((c) => c.teamId)
        .map((c) => standingRow(c, teamStandingLine(league, c)?.line || null));

      if (!rows.length) { results.push({ league, ok: true, teams: 0, note: "no_entries" }); continue; }

      const { error } = await supabase
        .from("team_standings")
        .upsert(rows, { onConflict: "league,team_id" });

      if (error) { results.push({ league, ok: false, error: error.message }); continue; }
      results.push({ league, ok: true, teams: rows.length, withLine: rows.filter((r) => r.context_line).length });
    } catch (e) {
      results.push({ league, ok: false, error: String(e?.message || e) });
    }
  }

  return Response.json({ ok: results.every((r) => r.ok), at: new Date().toISOString(), results });
}
