# CourtVisual laser system

One animation (`cv-perim`, normalized via `pathLength=100`), one token set, four placements. Drop the `laser/` folder into `components/`, import the CSS once in `app/layout.tsx`:

```tsx
import "@/components/laser/laser.css";
```

## Tokens

All colors and timing live on `:root` in `laser.css`. If these already exist in the Tailwind theme, alias them there instead of duplicating — single source of truth.

| Token | Value | Meaning |
|---|---|---|
| `--cv-ink` | `#0E0B02` | measured from THE RANKING screenshot |
| `--cv-cream` | `#E7E3D8` | measured page background |
| `--cv-orange` | `#E1641F` | laser / brand accent |
| `--cv-orange-deep` | `#C2410C` | gleam edge, small-size fallback |
| `--cv-orange-soft` | `#E6CAB3` | 20% orange flattened on cream (logo offset) |

## Usage

**H1 gleam** — add the class, nothing else:

```tsx
<h1 className="cv-gleam font-display text-...">THE RANKING</h1>
```

**Logo:**

```tsx
import CourtVisualLogo from "@/components/laser/CourtVisualLogo";
<CourtVisualLogo width={280} />
```

**No. 1 ranked card** (loop mode — the only always-on laser on the screen):

```tsx
import LaserFrame from "@/components/laser/LaserFrame";

<LaserFrame mode="loop" radius={12} className="rounded-xl">
  <GameCard game={topGame} />
</LaserFrame>
```

`radius` must equal the card's actual border-radius in px (rounded-xl = 12).

**Live badge** (faster preset):

```tsx
<LaserFrame mode="loop" radius={14} className="cv-laser-live inline-block rounded-full">
  <span className="...">LIVE</span>
</LaserFrame>
```

**Get Tickets CTA** — hover on desktop, single in-view pass on mobile:

```tsx
const isTouch = typeof window !== "undefined" && matchMedia("(hover: none)").matches;

<LaserFrame mode={isTouch ? "once" : "hover"} radius={8}>
  <button className="...">GET TICKETS</button>
</LaserFrame>
```

**Score reveal** — wrap the heat-score block in `mode="once"`; the trace fires when it scrolls into view, runs one pass, holds.

## Placement discipline (non-negotiable)

1. One loop-mode laser per screen. Only the #1 ranked card. Rank 2+ get nothing.
2. If a game is #1 AND live: one laser, the fast (`cv-laser-live`) timing.
3. Hover/once modes don't count against the limit — they're intent-triggered.
4. Vetoed surfaces: nav, footer, list cards, section headers, anything persistent next to the #1 card.

## Before shipping

- [ ] Swap `fontFamily` in `CourtVisualLogo` to the real headline token; re-measure the three VISUAL x-offsets against the actual font (do not eyeball).
- [ ] Confirm `radius` props match the real border-radius of each wrapped component.
- [ ] Logo below ~18px rendered width: use the solid two-tone mark (ink + `--cv-orange-deep`), not the laser version.
- [ ] Verify reduced-motion: every laser collapses to a static 85%-opacity orange outline; gleam collapses to solid ink.
