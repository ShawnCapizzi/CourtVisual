// CourtVisual revenue switchboard — every outbound commercial link flows through here.
// All IDs come from env vars (set in Vercel → redeploy). Missing var = plain link,
// so nothing breaks and surfaces stay honest until each program is approved.
//
// Mechanics worth remembering: a `cid=` style param on a partner's own domain is THEIR
// campaign tracking and pays nothing. A finder's fee requires the partner network's
// tracking link (Impact / FlexOffers / Rakuten / Amazon Associates) — paste those full
// links into the env vars below.
//
// NOTE: NEXT_PUBLIC_ vars are inlined at build time, so each must be referenced
// statically — never via dynamic process.env[key] lookup.

// --- Ticketmaster (Impact). Env holds your full Impact click-base, e.g.
// "https://ticketmaster.evyy.net/c/YOURID/CAMPAIGN/PROG". Event deep links are
// appended Impact-style as ?u=<encoded destination>.
const TM_IMPACT = process.env.NEXT_PUBLIC_TM_IMPACT_LINK || "";

// --- TickPick (Impact). Same pattern: full click-base; deep link via ?u=.
const TICKPICK = process.env.NEXT_PUBLIC_TICKPICK_LINK || "";

// --- Streaming partners: paste the FULL tracking URL each network gives you.
const STREAM_LINKS = {
  leaguepass: process.env.NEXT_PUBLIC_AFF_LEAGUEPASS || "",          // FlexOffers
  wnbaleaguepass: process.env.NEXT_PUBLIC_AFF_WNBA_LEAGUEPASS || "", // FlexOffers (NBA family)
  mlbtv: process.env.NEXT_PUBLIC_AFF_MLBTV || "",                    // distribution moved to ESPN in 2026 — confirm program at signup
  espnplus: process.env.NEXT_PUBLIC_AFF_ESPNPLUS || "",              // no broad public program — leave empty unless invited
  mlsseasonpass: process.env.NEXT_PUBLIC_AFF_MLS_SEASONPASS || "",   // Apple Services Performance Partners
  sundayticket: "",                                                   // YouTube — no affiliate program; stays a plain link
  dazn: process.env.NEXT_PUBLIC_AFF_DAZN || "",                      // Impact — boxing converts here
  tennischannel: process.env.NEXT_PUBLIC_AFF_TENNISCHANNEL || "",
  peacock: process.env.NEXT_PUBLIC_AFF_PEACOCK || "",                // Impact
  paramount: process.env.NEXT_PUBLIC_AFF_PARAMOUNT || "",            // Impact
  prime: process.env.NEXT_PUBLIC_AFF_PRIME || "",                    // Amazon Associates bounty
};

// --- Live-TV catchall (the "I see the network, now I need the channel" converter).
// Typically Fubo or DirecTV Stream via Impact — high CPA per signup.
const LIVETV_LABEL = process.env.NEXT_PUBLIC_AFF_LIVETV_LABEL || "";
const LIVETV_LINK = process.env.NEXT_PUBLIC_AFF_LIVETV_LINK || "";

const impactDeepLink = (base, dest) => `${base}${base.includes("?") ? "&" : "?"}u=${encodeURIComponent(dest)}`;

// Wrap a Ticketmaster event/search URL in your Impact tracking link (passthrough if unset).
export function ticketUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  return TM_IMPACT ? impactDeepLink(TM_IMPACT, rawUrl) : rawUrl;
}

// "Compare prices" secondary path — returns a tracked TickPick search URL, or null
// when the program isn't wired yet (the UI hides the link entirely in that case).
export function tickpickCompareUrl(query) {
  if (!TICKPICK) return null;
  const dest = `https://www.tickpick.com/search?q=${encodeURIComponent(query || "")}`;
  return impactDeepLink(TICKPICK, dest);
}

// Streamer link: affiliate tracking URL when wired, the honest plain URL otherwise.
export function streamUrl(key, fallbackUrl) {
  return (key && STREAM_LINKS[key]) || fallbackUrl;
}

// Live-TV signup chip ({label, url}) — only exists once the program is wired.
export function liveTvOffer() {
  return LIVETV_LABEL && LIVETV_LINK ? { label: LIVETV_LABEL, url: LIVETV_LINK } : null;
}
