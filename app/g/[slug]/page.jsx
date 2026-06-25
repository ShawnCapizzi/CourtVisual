// CourtVisual share landing — /g/[slug]
// Slug shape: {teamSlug}-vs-{oppSlug}-{MM-DD}  (?s={score})
// Server-rendered so the OpenGraph unfurl (iMessage/social) is a rich score card,
// not a dead link. Resolves teams from the catalog for names + colors; degrades
// gracefully when a slug doesn't map (still shows a valid card, never throws).
import { TEAMS } from "../../../lib/data";

const CREAM = "#ECE7DB";
const STAGE = "#0A0D12";
const ORANGE = "#E1641F";

function parseSlug(slug) {
  // Two shapes:
  //   team game:        teamSlug-vs-oppSlug-MM-DD-sN.N
  //   standalone event: eventSlug-MM-DD-sN.N   (no "-vs-")
  const raw = decodeURIComponent(slug || "");
  let safe = raw, slugScore = null;
  const sm = raw.match(/^(.*)-s(\d+(?:\.\d+)?)$/);
  if (sm) { safe = sm[1]; slugScore = sm[2]; }
  if (!safe.includes("-vs-")) {
    // Standalone event: peel the trailing date, the rest is the event name.
    const dm = safe.match(/^(.*)-(\d{2}-\d{2})$/);
    return { teamSlug: dm ? dm[1] : safe, oppSlug: null, ds: dm ? dm[2] : null, slugScore, single: true };
  }
  const [teamSlug, rest] = safe.split("-vs-");
  const m = rest.match(/^(.*)-(\d{2}-\d{2})$/);
  return { teamSlug, oppSlug: m ? m[1] : rest, ds: m ? m[2] : null, slugScore, single: false };
}

const findTeam = (slug) => TEAMS.find((t) => t.slug === slug) || null;
const titleCase = (s) => (s || "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function resolve(slug, search) {
  const { teamSlug, oppSlug, ds, slugScore, single } = parseSlug(slug);
  const team = findTeam(teamSlug);
  const opp = findTeam(oppSlug);
  const teamName = team?.name || titleCase(teamSlug);
  const oppName = opp?.name || titleCase(oppSlug);
  const scoreRaw = parseFloat(slugScore != null ? slugScore : search?.s);
  const score = !isNaN(scoreRaw) ? Math.max(0, Math.min(10, scoreRaw)).toFixed(1) : null;
  const verdict = score == null ? null : +score >= 9.3 ? "Hottest ticket" : +score >= 8.5 ? "Must see" : +score >= 7 ? "Highly recommended" : +score >= 5.5 ? "Worth attending" : "On the slate";
  const dateLabel = ds ? new Date(`2026-${ds}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  // For a standalone event the "title" is just the event name (no opponent).
  const eventName = single ? teamName : null;
  return { team, opp, teamName, oppName, score, verdict, dateLabel, teamSlug, oppSlug, single, eventName };
}

export async function generateMetadata({ params, searchParams }) {
  const { teamName, oppName, score, verdict, single, eventName } = resolve(params.slug, searchParams);
  const label = single ? eventName : `${teamName} vs ${oppName}`;
  const title = `${label}${score ? ` — ${score}/10` : ""} | CourtVisual`;
  const description = score
    ? `${verdict}. CourtVisual scores this one ${score} out of 10 — see why, find where to watch, or grab tickets.`
    : `See how CourtVisual scores ${label} — where to watch, or grab tickets.`;
  const ogImage = `/g/${params.slug}/opengraph-image${score ? `?s=${score}` : "?s=0"}${searchParams?.r ? `&r=${encodeURIComponent(searchParams.r)}` : ""}`;
  return {
    title, description,
    alternates: { canonical: `/g/${params.slug}` },
    openGraph: { title, description, type: "website", images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default function SharePage({ params, searchParams }) {
  const { team, teamName, oppName, score, verdict, dateLabel } = resolve(params.slug, searchParams);
  const accent = team?.primary || ORANGE;
  const home = "https://courtvisual.com";

  return (
    <main style={{ minHeight: "100vh", background: STAGE, color: CREAM, fontFamily: "'Archivo', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <a href={home} style={{ position: "absolute", top: 22, left: 22, color: CREAM, textDecoration: "none", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>
        Court<span style={{ color: ORANGE }}>Visual</span>
      </a>

      <div style={{ width: "100%", maxWidth: 440, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,231,219,0.12)", borderRadius: 22, padding: "30px 26px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(236,231,219,0.55)", marginBottom: 16 }}>Scored on CourtVisual</div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {score != null && (
            <div style={{ flexShrink: 0, width: 92, height: 92, borderRadius: "50%", border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>
              {score}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.08, margin: 0, letterSpacing: "-0.02em" }}>{teamName}<br /><span style={{ color: "rgba(236,231,219,0.6)" }}>vs</span> {oppName}</h1>
            {(verdict || dateLabel) && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {verdict && <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: STAGE, background: accent, padding: "4px 10px", borderRadius: 7 }}>{verdict}</span>}
                {dateLabel && <span style={{ fontSize: 13, color: "rgba(236,231,219,0.6)" }}>{dateLabel}</span>}
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(236,231,219,0.75)", margin: "22px 0 24px" }}>
          CourtVisual scores every upcoming game 0&ndash;10 around what you find exciting &mdash; so you only chase the ones worth your time.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href={home} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: CREAM, color: STAGE, fontWeight: 800, fontSize: 14.5, padding: "14px", borderRadius: 12, textDecoration: "none" }}>
            Open in CourtVisual →
          </a>
          <a href={home} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: CREAM, fontWeight: 700, fontSize: 13, padding: "12px", borderRadius: 12, border: "1px solid rgba(236,231,219,0.18)", textDecoration: "none" }}>
            Where to watch &middot; or get tickets
          </a>
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: "rgba(236,231,219,0.4)", marginTop: 22, textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
        Independent. Live data from a proprietary blend of trusted feeds. The score is CourtVisual&rsquo;s own.
      </p>
    </main>
  );
}
