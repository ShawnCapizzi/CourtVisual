// CourtVisual analytics — one tiny sink, provider-agnostic.
// Fires to GA4 (gtag) if present, Plausible if present, else no-ops.
// Safe under SSR and inside try/catch so tracking can never break the app.
// Event names are the revenue ledger: ticket_click, tickpick_click, stream_click,
// livetv_click, share_game, filter, view_mode.

export function track(name, props = {}) {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.gtag === "function") { window.gtag("event", name, props); return; }
    if (typeof window.plausible === "function") { window.plausible(name, { props }); return; }
  } catch {}
}
