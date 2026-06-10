# CourtVisual — merged Next.js app

The full app: team onboarding, favorites, and the themed game module (heat ring,
team colors, depth, the dashboard/editorial style switch, reactions). Preferences
persist on-device — no accounts needed for v1.

## Deploy (you've done this for your own site)
1. `npm install` then `git init && git add . && git commit -m "gamescore v1"`.
2. Push to a new GitHub repo.
3. In Vercel: Add New → Project → import the repo → Deploy. Vercel auto-detects
   Next.js; no config needed. Live URL in ~a minute.
4. Open the URL on your iPhone in **Safari** → Share → Add to Home Screen.
   The manifest + icons are wired, so it installs full-screen with a real icon.

## Local dev
    npm install
    npm run dev      # http://localhost:3000
    npm run build    # production build

## How it's organized
- `app/`                 Next App Router (layout = metadata/PWA, page = the app)
- `components/GameScoreApp.jsx`  the whole client app (flow + themed module)
- `lib/data.js`          teams + colors, sample games, scoring, color helpers
- `lib/storage.js`       on-device storage, SHAPED to swap to Supabase later
- `public/`              manifest, icons, minimal service worker

## What's next (and why this build is ready for it)
- **Live data:** add a Next API route (`app/api/games/route.js`) that calls the
  Ticketmaster Discovery API server-side (key stays secret), then replace the
  `GAMES` array in `lib/data.js` with a fetch to that route.
- **Affiliate revenue:** wrap the "Get tickets" URL builder in `GameScoreApp.jsx`
  with your Impact publisher ID.
- **Accounts (Supabase):** `lib/storage.js` already mirrors the row shapes
  (profile/team, favorites, prefs). Swap `store.load()/save()` for Supabase
  queries keyed by `auth.uid()` — the rest of the app is untouched.

## Note
Team names/colors are placeholders. For a shipped product, license official team
branding or use approximations — league IP is trademarked.

## Supabase (accounts & sync) — now wired
The app is connected to your Supabase project. Sign-in is optional: without it,
everything saves on-device; with it, team + favorites sync to the user's account.

Two setup steps:
1. **Create the table.** In Supabase → SQL Editor, paste and run
   `supabase_user_state.sql` (included). One row per user, JSON state, RLS-locked
   to the owner.
2. **Allow magic-link redirects.** In Supabase → Authentication → URL
   Configuration, set Site URL to your Vercel URL and add both your Vercel URL
   and `http://localhost:3000` to Redirect URLs. (Supabase's built-in email works
   for low-volume testing; add SMTP for production volume.)

Keys: the project URL + publishable (anon) key are public and already baked in as
fallbacks, so it works on Vercel with no config. To keep them out of code, set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel → Settings
→ Environment Variables (the `.env.local` file mirrors these for local dev).

Sign-in lives in Favorites → Account (passwordless magic link). On first sign-in,
on-device state is pushed up; after that, the cloud row is the source of truth.
