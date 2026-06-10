// Shared-game landing page: /g/knicks-vs-spurs-06-10?s=9.2
// This is where a friend lands when someone taps "Share with friends."
// generateMetadata gives the link a rich preview card in iMessage/social.

import Link from "next/link";

function parseSlug(slug = "") {
  // pattern: {team}-vs-{opp}-{MM}-{DD}
  const m = slug.match(/^(.+)-vs-(.+)-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const cap = (s) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return { team: cap(m[1]), opp: cap(m[2]), date: `${months[+m[3] - 1]} ${+m[4]}` };
}

export async function generateMetadata({ params, searchParams }) {
  const g = parseSlug(params.slug);
  const score = searchParams?.s;
  const title = g ? `${g.team} vs ${g.opp} — CourtVisual` : "CourtVisual";
  const description = g
    ? `${score ? `This game scores ${score}/10. ` : ""}${g.team} vs ${g.opp}, ${g.date}. See why it's worth going — and grab seats.`
    : "Every game, scored by what excites you.";
  return {
    title,
    description,
    openGraph: { title, description, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default function SharedGame({ params, searchParams }) {
  const g = parseSlug(params.slug);
  const score = searchParams?.s;
  const ink = "#16130F";

  return (
    <div className="g-ui" style={{ background: "#E7E3D8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div className="g-display" style={{ fontSize: 26, marginBottom: 28 }}>
          <span style={{ color: ink }}>Court</span>
          <span style={{ backgroundImage: "linear-gradient(135deg,#FFA52B,#FF5A2C 55%,#B3122A)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#FF5A2C" }}>Visual</span>
        </div>

        <div style={{ background: "#161B26", borderRadius: 22, padding: "32px 24px", boxShadow: "0 1px 2px rgba(18,20,28,0.07), 0 6px 16px rgba(18,20,28,0.10), 0 22px 48px rgba(18,20,28,0.12)" }}>
          {score && (
            <div className="g-display" style={{ fontSize: 72, lineHeight: 0.9, marginBottom: 10, backgroundImage: "linear-gradient(135deg,#FFA52B,#FF5A2C 55%,#B3122A)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#FF5A2C" }}>
              {score}
            </div>
          )}
          <div className="g-display" style={{ fontSize: 28, color: "#fff" }}>
            {g ? `${g.team.toUpperCase()} VS ${g.opp.toUpperCase()}` : "GAME ON"}
          </div>
          {g && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{g.date}</div>}
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", marginTop: 16, lineHeight: 1.5 }}>
            A friend thinks this one's worth going to.{score ? ` CourtVisual scores it ${score}/10.` : ""}
          </p>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 20, width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#FF5A2C,#B3122A)", color: "#fff", fontWeight: 700, fontSize: 14.5, textDecoration: "none", fontFamily: "'Archivo',sans-serif" }}>
            See the full ranking →
          </Link>
        </div>

        <p style={{ fontSize: 12, color: "rgba(22,19,15,0.5)", marginTop: 18 }}>
          Every game, scored by what excites you — customized for you, by you.
        </p>
      </div>
    </div>
  );
}
