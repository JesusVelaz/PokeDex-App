# Pixel-Art Redesign & Single-Page Consolidation — Design Spec

**Date:** 2026-07-08
**Branch:** Visual-updates
**Status:** Approved by user

## Goal

Remove the generic "AI-styled" dark visuals (black background, decorative CSS
pokeballs, glow gradients, marketing hero) and replace them with a simple,
cohesive pixel-art overworld aesthetic modeled on a classic Pokémon
sky/clouds/sea/grass scene. Consolidate the app from three routed pages into
one single page.

## Non-Goals

- No changes to data fetching, pagination logic, team persistence
  (localStorage), or search behavior.
- No "add to team from detail panel" feature (possible follow-up).
- No new dependencies beyond a Google Font swap.

## 1. Page Structure

**Before:** Three routes via react-router (`/` landing hero, `/pokedex`
browser, `/teams` team builder).

**After:** One page, no routing.

- `App.js` renders: `SearchHeader` → Pokédex section (current `Main` content)
  → Teams section (current `TeamsPage` content).
- Delete `LandingPage.jsx` and `HeroSection.jsx`.
- Remove `react-router-dom` usage (`HashRouter`, `Routes`, `Link`,
  `useNavigate`, `useLocation`). The dependency may stay in package.json but
  nothing imports it; removal from package.json is optional cleanup.
- Nav tabs in the header ("Pokédex" / "My Teams") become smooth-scroll anchor
  links to the two sections (`#pokedex`, `#teams`) instead of route links.
- `Main.jsx` and `TeamsPage.jsx` are refactored into section components that
  no longer render their own `SearchHeader`; the single header lives in
  `App.js`. The Pokédex search stays wired to the Pokédex section's state via
  props (state lifts to `App.js` or the header renders inside the Pokédex
  section — implementation planning decides; behavior is unchanged).

## 2. Visual Theme (whole app)

### Palette (design tokens replace the dark set in style.css `:root`)

| Token | Value | Use |
|---|---|---|
| `--sky-top` | `#8FD5F5` (approx) | top of page background |
| `--sky-bottom` | `#6FBDEA` | lower sky |
| `--cloud` | `#F4EEF3` | pixel clouds |
| `--sea` | `#5B8FD9` | sea band above grass |
| `--grass-light` | `#8CC63E` | grass strip |
| `--grass-dark` | `#5CA034` | grass accents |
| `--panel` | `#FFF9EC` cream | dialog-box panels |
| `--panel-border` | `#2B2B3A` near-black | panel borders |
| `--text-primary` | `#22242E` | body text |
| `--accent-red` | `#E3350D` pokéball red | primary buttons |

Official Pokémon type colors for badges are kept unchanged.

### Page background

Full-viewport fixed backdrop recreating the reference image in layers:
- Sky gradient top-to-bottom with a few blocky pixel clouds (CSS box-shadow
  pixel clusters or a small tiled PNG).
- A thin sea band and a grass strip pinned to the bottom of the viewport;
  the existing unused `src/images/pixel-grass.png` tile is the grass texture.
- Content scrolls over the sky; the grass/sea strip stays fixed at bottom.

### Components

- **Panels/cards:** cream background, 3–4px solid dark border, square (or
  4px-stepped) corners, hard offset shadow (e.g. `4px 4px 0 rgba(...)`) —
  Pokémon dialog-box style. Replaces glassmorphism/dark cards everywhere:
  Pokémon cards, detail panel, team cards, filter toolbar, autocomplete
  dropdown, pagination controls.
- **Buttons:** flat fills (red primary, cream secondary), dark border, hard
  shadow; press state shifts the button into its shadow.
- **Typography:** "Pixelify Sans" (Google Fonts) for headings, logo, buttons,
  nav; keep Inter for body text, stats, and lists for readability. Remove
  Inter Tight.
- **Removed decor:** `.hero-bg`, `.hero-pokeball-*`, body radial-glow
  gradients and dot grid, gold drop-shadow filters, animated pokemon rings,
  hero carousel, gradient text fills.

## 3. Header, Logo, Underline

- Header: sticky light dialog-box bar (cream panel, dark bottom border).
  Contains logo, search (always visible now), and the two anchor nav tabs.
- Logo: replace the gradient/glow SVG in `PokedexLogo.jsx` with a simple flat
  pixel-style pokéball (solid red top, white bottom, dark band, no gradients)
  plus "Pokédex" wordmark in Pixelify Sans.
- Underline bug: logo anchor lacks `text-decoration: none`; fix applies to
  all header links (now plain anchors).

## 4. File-Level Impact

| File | Change |
|---|---|
| `src/App.js` | Single-page composition; remove router |
| `src/pages/LandingPage.jsx`, `src/Components/HeroSection.jsx` | Delete |
| `src/Components/Main.jsx` | Becomes Pokédex section (no own header) |
| `src/pages/TeamsPage.jsx` | Becomes Teams section (no own header) |
| `src/Components/SearchHeader.jsx` | Anchor nav, always-on search, no router imports |
| `src/Components/PokedexLogo.jsx` | Flat pixel logo |
| `src/Components/style.css` | New tokens, retheme all components, delete hero styles |
| `src/images/pixel-grass.png` | Used as grass texture |

## 5. Verification

Manual, via `npm start`:
- Browse/filter/paginate Pokémon; open detail panel; search with autocomplete.
- Create, rename, fill, and delete a team; reload page → teams persist.
- Nav tabs scroll to sections; logo has no underline; no dark-theme remnants.
- Check narrow (mobile) width and that `npm run build` succeeds
  (gh-pages deploy path).
