# Pixel-Art Redesign & Single-Page Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark "generic AI" theme with a bright pixel-art overworld aesthetic and consolidate the three routed pages into one single page.

**Architecture:** CRA (react-scripts 5) React 18 app. All styling lives in one file, `src/Components/style.css`, driven by CSS custom properties in `:root` — the retheme works by replacing the token values (so most components flip to the light palette at once) and then rewriting the component-level rules that hardcode dark rgba values. Routing is removed entirely; `App.js` stacks the Pokédex section and Teams section on one page.

**Tech Stack:** React 18, axios, CRA/react-scripts 5, Jest + React Testing Library, Google Fonts (Pixelify Sans + Inter).

**Spec:** `docs/superpowers/specs/2026-07-08-pixel-art-redesign-design.md`

## Global Constraints

- No new npm dependencies; `react-router-dom` gets **removed**.
- No behavior changes to data fetching, pagination, search, or team localStorage persistence.
- Official Pokémon type colors (`typeColors.js`, `.fire`/`.water`/etc. CSS vars) stay unchanged.
- Existing responsive breakpoints (1200px / 900px / 600px) keep working.
- `npm run build` must pass at the end of every task (it's the deploy path for gh-pages).
- Test command: `CI=true npx react-scripts test --watchAll=false` (bash) — takes ~30s.

## Known Pre-Existing Breakage (context for Task 1)

- The test suite **fails at head**: CRA's Jest 27 cannot resolve `react-router-dom` v7 (ESM-only package). Removing the router fixes this.
- `App.test.js` is stale beyond that: it assumes page size 25 (app default is 10) and a "go to page" spinbutton that no longer exists in `PaginationControls.jsx`. Task 1 rewrites the tests to match actual current behavior.

---

### Task 1: Single-page consolidation, router removal, test repair

**Files:**
- Modify: `src/App.js`
- Modify: `src/App.test.js`
- Modify: `src/Components/SearchHeader.jsx`
- Modify: `src/Components/Main.jsx:219` (container div)
- Modify: `src/pages/TeamsPage.jsx:1-4, 386-390` (imports + render)
- Delete: `src/pages/LandingPage.jsx`, `src/Components/HeroSection.jsx`, `src/App.css` (unused CRA boilerplate)
- Modify: `package.json` (drop react-router-dom)

**Interfaces:**
- Produces: `App` renders `<Main />` then `<TeamsPage />`; Pokédex content is `div.container#pokedex`; Teams root is `div.teams-page#teams`. `SearchHeader` no longer accepts `showSearch` and renders nav as plain `<a href="#pokedex">` / `<a href="#teams">` anchors (class `nav-tab`, no `nav-tab--active`). The logo is a plain (non-link) div — this removes the underline.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Rewrite the tests to describe the consolidated app (failing first)**

Replace the entire contents of `src/App.test.js` with:

```jsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "./App";

jest.mock("axios");

const bulbasaur = {
  id: 1,
  name: "bulbasaur",
  sprites: {
    front_default: "bulbasaur.png",
    other: {
      "official-artwork": { front_default: "bulbasaur-art.png" },
      dream_world: { front_default: null },
    },
  },
  abilities: [{ ability: { name: "overgrow" } }],
  stats: [{ stat: { name: "hp" }, base_stat: 45 }],
  height: 7,
  weight: 69,
  types: [{ type: { name: "grass" } }],
};

const pageResponse = {
  data: {
    count: 45,
    results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
  },
};

beforeEach(() => {
  window.scrollTo = jest.fn();

  axios.get.mockImplementation((url) => {
    if (url === "https://pokeapi.co/api/v2/type") {
      return Promise.resolve({
        data: { results: [{ name: "grass" }, { name: "fire" }] },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=10") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=20&limit=10") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=50") {
      return Promise.resolve(pageResponse);
    }

    if (
      url === "https://pokeapi.co/api/v2/pokemon/1/" ||
      url === "https://pokeapi.co/api/v2/pokemon/bulbasaur"
    ) {
      return Promise.resolve({ data: bulbasaur });
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("renders search, pokémon grid, filters, and teams section on one page", async () => {
  render(<App />);

  expect(screen.getByPlaceholderText(/search pokémon/i)).toBeInTheDocument();
  expect(await screen.findByText(/showing page 1 of 5/i)).toBeInTheDocument();
  expect(await screen.findByText(/bulbasaur/i)).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /filter by type/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /cards per page/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /my teams/i })).toBeInTheDocument();
});

test("navigates with the page number buttons", async () => {
  render(<App />);

  await screen.findByText(/bulbasaur/i);
  fireEvent.click(await screen.findByRole("button", { name: "3" }));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=20&limit=10"
    );
  });

  expect(await screen.findByText(/showing page 3 of 5/i)).toBeInTheDocument();
});

test("changes the cards per page selector", async () => {
  render(<App />);

  const pageSizeSelect = await screen.findByRole("combobox", { name: /cards per page/i });
  await screen.findByText(/bulbasaur/i);

  fireEvent.change(pageSizeSelect, { target: { value: "50" } });

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=0&limit=50"
    );
  });

  expect(await screen.findByText(/showing page 1 of 1/i)).toBeInTheDocument();
});
```

Notes: `Main` and `TeamsPage` both fire a `?limit=2000` names request that the mock rejects — both components swallow that error by design, so no mock is needed.

- [ ] **Step 2: Run tests, verify they fail for the right reason**

Run (bash): `CI=true npx react-scripts test --watchAll=false`
Expected: FAIL — still "Cannot find module 'react-router-dom' from 'src/App.js'" (App.js not yet rewritten).

- [ ] **Step 3: Rewrite App.js without the router**

Replace the entire contents of `src/App.js` with:

```jsx
import Main from "./Components/Main";
import TeamsPage from "./pages/TeamsPage";
import "./Components/style.css";

function App() {
  return (
    <>
      <Main />
      <TeamsPage />
    </>
  );
}

export default App;
```

- [ ] **Step 4: De-router SearchHeader, fix the underline, anchor nav**

In `src/Components/SearchHeader.jsx`:

1. Change the imports — remove react-router, remove `useLocation` usage:

```jsx
import { useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import PokedexLogo from "./PokedexLogo";
```

2. Delete the line `const { pathname } = useLocation();`

3. Remove the `showSearch = true` prop from the destructured props (the header is only rendered once now, by `Main`, always with search). Change `{showSearch && (` ... `)}` to render the search container unconditionally (drop the wrapper condition, keep the JSX inside).

4. Replace the logo block (currently `<div className="header-logo"><Link to="/"><PokedexLogo /></Link></div>`) with:

```jsx
<div className="header-logo">
  <PokedexLogo />
</div>
```

The underline came from that `<Link>` anchor having default `text-decoration`; with no anchor there is no underline.

5. Replace the `<nav className="nav-tabs">` block with anchor links (no active state — both sections are always on the page):

```jsx
<nav className="nav-tabs">
  <a href="#pokedex" className="nav-tab">Pokédex</a>
  <a href="#teams" className="nav-tab">My Teams</a>
</nav>
```

- [ ] **Step 5: Give the two sections their anchor ids**

In `src/Components/Main.jsx` line 219, change `<div className="container">` to:

```jsx
<div className="container" id="pokedex">
```

In `src/pages/TeamsPage.jsx`:
- Delete the import `import SearchHeader from "../Components/SearchHeader";`
- In the return of `TeamsPage`, delete the line `<SearchHeader showSearch={false} />`
- Change `<div className="teams-page">` to `<div className="teams-page" id="teams">`

- [ ] **Step 6: Delete dead files and the router dependency**

```bash
git rm src/pages/LandingPage.jsx src/Components/HeroSection.jsx src/App.css
npm uninstall react-router-dom
```

(`npm uninstall` updates `package.json` and `package-lock.json`; the lockfile already has uncommitted user modifications — that's expected, commit them together here.)

- [ ] **Step 7: Run tests, verify they pass**

Run (bash): `CI=true npx react-scripts test --watchAll=false`
Expected: PASS — 3 tests.

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: "Compiled successfully" (warnings acceptable).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: consolidate to a single page, remove react-router"
```

---

### Task 2: Design tokens, fonts, and pixel-scenery page background

**Files:**
- Modify: `src/Components/style.css:1-57` (imports, `:root`, reset/body) and hero style blocks (deletion)

**Interfaces:**
- Consumes: nothing.
- Produces: the token set every later task's CSS references: `--panel`, `--panel-alt`, `--panel-border`, `--red`, `--gold`, `--grass`, `--grass-dark`, `--sea`, `--sky-top`, `--sky-bottom`, `--cloud`, `--text-primary/secondary/muted`, `--border-subtle`, `--shadow-card`, `--radius-sm/md/lg/xl/pill`, `--font-heading` (Pixelify Sans), `--font-body` (Inter). Legacy names `--bg-base/--bg-surface/--bg-card/--bg-glass/--border-gold/--gold-glow` stay defined (remapped to light values) so not-yet-rethemed rules don't break between tasks.

- [ ] **Step 1: Replace the font import and design tokens**

In `src/Components/style.css`, replace line 1 (the `@import url(...)` line) with:

```css
@import url("https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap");
```

Replace the whole `:root { ... }` block (lines 3–27) with:

```css
/* ─── DESIGN TOKENS ─────────────────────────────── */
:root {
  /* pixel-art overworld palette */
  --sky-top:        #A9DEF7;
  --sky-bottom:     #6FBDEA;
  --sea:            #4A82D8;
  --cloud:          #F7F2F7;
  --grass:          #7ACB4F;
  --grass-dark:     #4FA83D;
  --panel:          #FFF9EC;
  --panel-alt:      #F3ECDB;
  --panel-border:   #2B2B3A;
  --gold:           #FFCB05;
  --red:            #E3350D;
  --red-dark:       #C42D0B;
  --text-primary:   #22242E;
  --text-secondary: #4A4E5A;
  --text-muted:     #767B88;
  --border-subtle:  rgba(43, 43, 58, 0.18);
  /* legacy aliases so untouched rules stay sane mid-retheme */
  --bg-base:        var(--sky-bottom);
  --bg-surface:     var(--panel);
  --bg-card:        var(--panel);
  --bg-glass:       rgba(255, 249, 236, 0.94);
  --border-gold:    var(--panel-border);
  --gold-glow:      transparent;
  /* pixel corners: near-square radii */
  --radius-sm:      2px;
  --radius-md:      3px;
  --radius-lg:      4px;
  --radius-xl:      4px;
  --radius-pill:    3px;
  --shadow-card:    3px 3px 0 rgba(43, 43, 58, 0.22);
  --transition:     0.15s ease;
  --transition-lg:  0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --font-heading:   'Pixelify Sans', 'Inter', sans-serif;
  --font-body:      'Inter', sans-serif;
}
```

- [ ] **Step 2: Replace the body background with the pixel scenery**

Replace the `body { ... }` block (originally lines 44–55) with:

```css
body {
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100vh;
  /* pixel sky: two repeating cloud tiles over a sky gradient */
  background-color: var(--sky-bottom);
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='16' shape-rendering='crispEdges'%3E%3Cg fill='%23F7F2F7'%3E%3Crect x='6' y='8' width='16' height='4'/%3E%3Crect x='8' y='4' width='10' height='4'/%3E%3Crect x='12' y='2' width='4' height='2'/%3E%3Crect x='24' y='11' width='6' height='2'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='16' shape-rendering='crispEdges'%3E%3Cg fill='%23F7F2F7' fill-opacity='0.8'%3E%3Crect x='4' y='9' width='12' height='3'/%3E%3Crect x='6' y='6' width='7' height='3'/%3E%3Crect x='24' y='4' width='8' height='3'/%3E%3Crect x='26' y='2' width='4' height='2'/%3E%3C/g%3E%3C/svg%3E"),
    linear-gradient(to bottom, var(--sky-top) 0%, #8ED1F4 55%, var(--sky-bottom) 100%);
  background-repeat: repeat-x, repeat-x, no-repeat;
  background-position: 40px 110px, 220px 220px, 0 0;
  background-size: 430px 128px, 340px 96px, 100% 100%;
  background-attachment: fixed;
}

/* pixel sea + grass strip pinned to the bottom of the viewport */
body::after {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 130px;
  pointer-events: none;
  z-index: -1;
  background:
    url("../images/pixel-grass.png") left bottom / 90px 90px repeat-x,
    linear-gradient(to bottom,
      rgba(255, 255, 255, 0.9) 0,
      rgba(255, 255, 255, 0.9) 3px,
      var(--sea) 3px,
      var(--sea) 100%);
}

/* anchor targets clear the sticky header */
#pokedex,
#teams {
  scroll-margin-top: 84px;
}
```

- [ ] **Step 3: Delete all hero and divider styles**

Delete these whole rule blocks from `style.css` (they styled the removed landing page):
`.hero-section`, `.hero-bg`, `.hero-pokeball`, `.hero-pokeball-1`, `.hero-pokeball-2`, `.hero-content`, `.hero-left`, `.hero-eyebrow`, `.hero-title`, `.hero-title em`, `.hero-subtitle`, `.hero-stats`, `.hero-stat-item`, `.hero-stat-number`, `.hero-stat-label`, `.hero-cta`, `.hero-right`, `.hero-pokemon-ring` (both variants), `@keyframes ring-pulse`, `.hero-pokemon-image`, `@keyframes hero-fade-in`, `@keyframes hero-float`, `.hero-pokemon-info`, `.hero-pokemon-info-name`, `.hero-pokemon-info-type`, `.hero-dots`, `.hero-dot`, `.hero-dot.active`, `.section-divider`, `.section-divider-line`, `.section-divider-text`.

Also delete the hero rules **inside media queries**:
- In `@media (max-width: 900px)`: `.hero-content`, `.hero-right`, `.hero-pokemon-image`, `.hero-pokemon-ring:nth-child(1)`, `.hero-pokemon-ring:nth-child(2)`, `.hero-pokeball-1`.
- In `@media (max-width: 600px)`: the `body { background-attachment: scroll; }` override (the scenery pseudo-element is fixed anyway), `.hero-section`, `.hero-right`, `.hero-stats`, `.section-divider`.

Do NOT delete `.btn-primary` / `.btn-secondary` (Teams uses them; restyled in Task 3).

- [ ] **Step 4: Build + eyeball**

Run: `npm run build` → Expected: compiles successfully.
Run `npm start` (or the preview tool) and confirm: sky gradient with blocky clouds, grass/sea strip at the bottom of the viewport, content readable (contrast will be rough in unthemed areas — that's expected until Tasks 3–5).

- [ ] **Step 5: Commit**

```bash
git add src/Components/style.css
git commit -m "feat: pixel-art design tokens and sky/sea/grass scenery background"
```

---

### Task 3: Header, logo, nav, search, and buttons

**Files:**
- Modify: `src/Components/PokedexLogo.jsx` (whole file)
- Modify: `src/Components/style.css` — blocks: `.app-header`, `.app-header::before`, `.app-header::after`, `.header-logo img`, `.logo-wordmark*`, `.logo-text*`, `.search-container*`, `.autocomplete-*`, `.nav-tabs`, `.nav-tab*`, `.btn-primary*`, `.btn-secondary*`

**Interfaces:**
- Consumes: tokens from Task 2 (`--panel`, `--panel-border`, `--red`, `--red-dark`, `--panel-alt`, `--gold`, `--radius-sm`, `--font-heading`).
- Produces: `.btn-primary` / `.btn-secondary` pixel button styles used by the Teams section (Task 5 relies on them unchanged).

- [ ] **Step 1: Replace the logo SVG with a flat pokéball**

Replace the entire contents of `src/Components/PokedexLogo.jsx` with:

```jsx
const PokedexLogo = () => (
  <div className="logo-wordmark">
    <svg
      width="32"
      height="32"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="17" cy="17" r="15" fill="#FFF9EC" stroke="#2B2B3A" strokeWidth="3" />
      <path d="M 2 17 A 15 15 0 0 1 32 17 Z" fill="#E3350D" stroke="#2B2B3A" strokeWidth="3" />
      <rect x="3" y="15.5" width="28" height="3" fill="#2B2B3A" />
      <circle cx="17" cy="17" r="5" fill="#FFF9EC" stroke="#2B2B3A" strokeWidth="3" />
    </svg>

    <span className="logo-text">
      Poké<em>dex</em>
    </span>
  </div>
);

export default PokedexLogo;
```

- [ ] **Step 2: Retheme the header chrome in style.css**

Replace the `.app-header`, `.app-header::before`, `.app-header::after`, and `.header-logo img` blocks with:

```css
/* ─── HEADER ─────────────────────────────────────── */
.app-header {
  position: sticky;
  top: 0;
  z-index: 200;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem 1.5rem;
  padding: 0 2.5rem;
  height: 68px;
  background: var(--panel);
  border-bottom: 3px solid var(--panel-border);
}
```

(The `::before` gold gradient line, the `::after` block, and `.header-logo img` are deleted, not replaced.)

Replace the `.logo-wordmark`, `.logo-wordmark svg`, `.logo-wordmark:hover svg`, `.logo-text`, `.logo-text em` blocks with:

```css
.logo-wordmark {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  user-select: none;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.logo-text em {
  font-style: normal;
  color: var(--red);
}
```

- [ ] **Step 3: Retheme search input, button, and autocomplete**

Replace the `.search-container input`, `.search-container input::placeholder`, `.search-container input:focus`, `.autocomplete-dropdown`, `.autocomplete-item`, `.autocomplete-item:hover/.active`, `.search-container button`, `.search-container button:hover` blocks with:

```css
.search-container input {
  width: 100%;
  height: 40px;
  padding: 0 0.9rem;
  background: #FFFFFF;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: var(--transition);
}

.search-container input::placeholder {
  color: var(--text-muted);
}

.search-container input:focus {
  box-shadow: 3px 3px 0 rgba(43, 43, 58, 0.22);
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  list-style: none;
  padding: 0.3rem 0;
  background: #FFFFFF;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  box-shadow: 4px 4px 0 rgba(43, 43, 58, 0.22);
  z-index: 300;
  overflow: hidden;
}

.autocomplete-item {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  text-transform: capitalize;
  transition: var(--transition);
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: var(--gold);
  color: var(--text-primary);
}

.search-container button {
  width: 40px;
  height: 40px;
  background: var(--red);
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.search-container button:hover {
  background: var(--red-dark);
}
```

- [ ] **Step 4: Retheme nav tabs and shared buttons**

Replace `.nav-tab`, `.nav-tab:hover`, `.nav-tab--active` (delete the `--active` block — the class is no longer rendered) with:

```css
.nav-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition);
}

.nav-tab:hover {
  border-color: var(--panel-border);
  background: var(--panel-alt);
}
```

Replace `.btn-primary`, `.btn-primary:hover`, `.btn-secondary`, `.btn-secondary:hover` with:

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  background: var(--red);
  color: #fff;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  transition: var(--transition);
  box-shadow: 3px 3px 0 rgba(43, 43, 58, 0.25);
}

.btn-primary:hover {
  background: var(--red-dark);
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(43, 43, 58, 0.25);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  background: var(--panel);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  transition: var(--transition);
  box-shadow: 3px 3px 0 rgba(43, 43, 58, 0.25);
}

.btn-secondary:hover {
  background: var(--panel-alt);
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 rgba(43, 43, 58, 0.25);
}
```

- [ ] **Step 5: Verify**

Run (bash): `CI=true npx react-scripts test --watchAll=false` → Expected: PASS (3 tests).
Run `npm start` / preview: cream header with dark border, flat pokéball logo, **no underline** under the logo, nav anchors scroll to sections.

- [ ] **Step 6: Commit**

```bash
git add src/Components/PokedexLogo.jsx src/Components/style.css
git commit -m "feat: pixel dialog-box header, flat logo, remove link underline"
```

---

### Task 4: Pokédex section retheme (toolbar, cards, pagination, detail panel)

**Files:**
- Modify: `src/Components/style.css` — blocks: `.error-banner`, `.toolbar-strip`, `.results-copy p`, `.type-filter span/select/option/focus`, `.card*`, `.sprite-placeholder`, `.pokemon-number`, `.type-badge`, `.skeleton`, `.pokeball-loader`, `.loading-text`, `.pagination-arrow`, `.page-number`, `.page-number.active`, `.page-ellipsis`, `.right-column`, `.close-button*`, `.pokemon-image-frame`, `.pokemon-detail-image`, `.right-placeholder`, `.stat-bar-container`, `.stat-bar`, and the `.right-column` override in `@media (max-width: 900px)`

**Interfaces:**
- Consumes: Task 2 tokens. Type colors: `.card` gets `--type-color` from its type class (e.g. `.grass`) — unchanged mechanism.
- Produces: nothing consumed later.

- [ ] **Step 1: Toolbar + error banner**

Replace `.error-banner` with:

```css
.error-banner {
  background: #FBDCD5;
  border-top: 2px solid var(--red);
  border-bottom: 2px solid var(--red);
  color: #8A1E06;
  padding: 0.75rem 2rem;
  text-align: center;
  font-size: 0.875rem;
  font-family: var(--font-body);
}
```

In `.toolbar-strip`, keep the layout properties and replace the skin — the block becomes:

```css
.toolbar-strip {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  background: var(--panel);
  border: 3px solid var(--panel-border);
  box-shadow: var(--shadow-card);
}
```

Change `.results-copy p` color to `var(--text-secondary)`. Change `.type-filter span` color to `var(--text-secondary)`.

Replace `.type-filter select`, `.type-filter select option`, `.type-filter select:focus` with:

```css
.type-filter select {
  width: 100%;
  padding: 0.6rem 2rem 0.6rem 0.85rem;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  background: #FFFFFF;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: var(--font-body);
  text-transform: capitalize;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%232B2B3A' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  transition: var(--transition);
}

.type-filter select option {
  background: #FFFFFF;
  color: var(--text-primary);
  text-transform: capitalize;
}

.type-filter select:focus {
  box-shadow: 2px 2px 0 rgba(43, 43, 58, 0.22);
}
```

- [ ] **Step 2: Pokémon cards**

Delete the `.card::before` and `.card::after` blocks entirely (type glow + decorative pokeball), and delete the `.card:hover::before` / `.card:hover::after` rules.

Replace `.card`, `.card:hover`, `.card img`, `.card:hover img`, `.sprite-placeholder` with:

```css
.card {
  position: relative;
  border-radius: var(--radius-md);
  border: 3px solid var(--panel-border);
  background: var(--panel);
  padding: 1rem 0.875rem 0.875rem;
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
  box-shadow: var(--shadow-card);
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--type-color, rgba(43, 43, 58, 0.35));
}

.card img {
  width: min(100%, 104px);
  height: 104px;
  object-fit: contain;
  image-rendering: pixelated;
  position: relative;
  z-index: 1;
}

.card:hover img {
  animation: pokemon-float 1.2s ease-in-out infinite;
}

.sprite-placeholder {
  width: 104px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  background: var(--panel-alt);
}
```

Change `.pokemon-number` color to `var(--text-muted)` (already is — leave), and in `.type-badge` remove the translucent fallback: change `background: rgba(255, 255, 255, 0.1);` to `background: var(--panel-alt);` and add `border: 1px solid var(--panel-border);` (per-type inline colors from `typeColors.js` still override background/text).

- [ ] **Step 3: Skeletons + loader**

Replace the `.skeleton` block's background values with light ones:

```css
.skeleton {
  border-radius: 3px;
  background: linear-gradient(90deg, #EDE6D6 25%, #F7F1E3 50%, #EDE6D6 75%);
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
```

In `.pokeball-loader`, change `border: 4px solid #3d312d;` to `border: 4px solid var(--panel-border);` and in its `::before`/`::after`, change `#3d312d` to `var(--panel-border)` (3 occurrences total). Change `.loading-text` color to `var(--text-secondary)`.

- [ ] **Step 4: Pagination**

Replace `.pagination-arrow, .page-number`, their `:hover`, `.pagination-arrow:disabled`, `.page-number.active` with:

```css
.pagination-arrow,
.page-number {
  border: 2px solid var(--panel-border);
  min-width: 42px;
  padding: 0.55rem 0.8rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--panel);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 2px 2px 0 rgba(43, 43, 58, 0.22);
}

.pagination-arrow:hover,
.page-number:hover {
  background: var(--panel-alt);
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 rgba(43, 43, 58, 0.22);
}

.pagination-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: 2px 2px 0 rgba(43, 43, 58, 0.22);
}

.page-number.active {
  background: var(--red);
  color: #fff;
}
```

Change `.page-ellipsis` color to `var(--text-secondary)`.

- [ ] **Step 5: Detail panel + stats**

Replace `.right-column`, `.close-button`, `.close-button:hover`, `.pokemon-image-frame`, `.pokemon-detail-image` with:

```css
.right-column {
  width: min(100%, 360px);
  flex-shrink: 0;
  background: var(--panel);
  border-radius: var(--radius-md);
  border: 3px solid var(--panel-border);
  box-shadow: 4px 4px 0 rgba(43, 43, 58, 0.22);
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  background: var(--panel-alt);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: var(--transition);
}

.close-button:hover {
  background: var(--red);
  color: #fff;
}

.pokemon-image-frame {
  width: 100%;
  min-height: 185px;
  margin: 0.875rem 0 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: var(--panel-alt);
  border: 2px solid var(--border-subtle);
  display: grid;
  place-items: center;
}

.pokemon-detail-image {
  width: 100%;
  max-width: 165px;
  max-height: 165px;
  object-fit: contain;
}
```

Replace `.stat-bar-container` and `.stat-bar` with:

```css
.stat-bar-container {
  height: 9px;
  background: #E7DFC9;
  border: 1px solid var(--panel-border);
  overflow: hidden;
  margin-top: 4px;
  margin-bottom: 9px;
}

.stat-bar {
  height: 100%;
  background: var(--grass-dark);
  transition: width 0.65s cubic-bezier(0.4, 0, 0.2, 1);
}
```

In the `@media (max-width: 900px)` block, replace the `.right-column` override's skin lines: `background: var(--bg-surface);` stays valid (now cream), but change `box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75);` to `box-shadow: 4px 4px 0 rgba(43, 43, 58, 0.3);` and `border: 1px solid var(--border-subtle);` to `border: 3px solid var(--panel-border);`. Remove the `backdrop-filter` lines.

- [ ] **Step 6: Verify + commit**

Run (bash): `CI=true npx react-scripts test --watchAll=false` → PASS.
Preview: cards are cream panels with dark borders and hard shadows; no pokeball watermark or glow; pagination/detail panel match.

```bash
git add src/Components/style.css
git commit -m "feat: retheme Pokédex grid, toolbar, pagination, and detail panel"
```

---

### Task 5: Teams section retheme

**Files:**
- Modify: `src/Components/style.css` — blocks: `.teams-page`, `.teams-page-subtitle`, `.teams-empty*`, `.team-card*`, `.team-action-btn*`, `.team-menu*`, `.team-rename-input`, `.team-slot*`, `.team-editor*`, `.slot-search-*`, `.slot-remove-*`

**Interfaces:**
- Consumes: Task 2 tokens; `.btn-primary` from Task 3.
- Produces: nothing consumed later.

- [ ] **Step 1: Page frame + empty state**

Change `.teams-page-subtitle` color to `var(--text-secondary)`.

Replace `.teams-empty` with:

```css
.teams-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 2rem;
  border: 3px dashed var(--panel-border);
  border-radius: var(--radius-md);
  background: var(--bg-glass);
}
```

Change `.teams-empty-title` color to `var(--text-primary)` and `.teams-empty-sub` color to `var(--text-secondary)`.

- [ ] **Step 2: Team cards + menu**

Replace `.team-card`, `.team-card:hover`, `.team-card--open` with:

```css
.team-card {
  background: var(--panel);
  border: 3px solid var(--panel-border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-card);
  transition: border-color var(--transition), box-shadow var(--transition);
  cursor: pointer;
}

.team-card:hover {
  box-shadow: 4px 4px 0 rgba(43, 43, 58, 0.3);
}

.team-card--open {
  border-color: var(--red);
  cursor: default;
}
```

Change `.team-card-count` color to `var(--text-secondary)`.

Replace `.team-action-btn`, `.team-action-btn:hover`, `.team-menu`, `.team-menu-item`, `.team-menu-item:hover`, `.team-menu-item--danger:hover`, `.team-rename-input` with:

```css
.team-action-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel-alt);
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.team-action-btn:hover {
  background: var(--gold);
}

.team-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #FFFFFF;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  box-shadow: 4px 4px 0 rgba(43, 43, 58, 0.22);
  overflow: hidden;
  z-index: 50;
  min-width: 160px;
}

.team-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.65rem 1rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition);
}

.team-menu-item:hover {
  background: var(--panel-alt);
}

.team-menu-item--danger:hover {
  background: #FBDCD5;
  color: var(--red-dark);
}

.team-rename-input {
  width: 100%;
  background: #FFFFFF;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  outline: none;
}
```

- [ ] **Step 3: Slots**

Replace `.team-slot`, `.team-slot:hover`, `.team-slot--active`, `.team-slot--filled`, `.team-slot--filled:hover`, `.team-slot-empty`, `.team-slot-name`, `.team-slot-remove` with:

```css
.team-slot {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100px;
  border-radius: var(--radius-sm);
  border: 2px dashed var(--border-subtle);
  background: var(--bg-glass);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
}

.team-slot:hover {
  border-color: var(--grass-dark);
  background: #EFF7E4;
}

.team-slot--active {
  border-color: var(--panel-border);
  border-style: solid;
  background: #FFF3C4;
}

.team-slot--filled {
  border-style: solid;
  border-color: var(--border-subtle);
  background: var(--panel-alt);
}

.team-slot--filled:hover {
  border-color: var(--red);
  background: #FBDCD5;
}

.team-slot-empty {
  font-size: 1.6rem;
  color: var(--text-muted);
  font-family: var(--font-heading);
  line-height: 1;
}

.team-slot-name {
  font-family: var(--font-heading);
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
  text-align: center;
  padding: 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.team-slot-remove {
  position: absolute;
  inset: 0;
  background: rgba(227, 53, 13, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #fff;
  font-weight: 700;
  opacity: 0;
  transition: var(--transition);
}
```

- [ ] **Step 4: Editor panels**

Change `.team-editor` border-top to `2px solid var(--border-subtle)`. Change `.team-editor-hint` color to `var(--text-secondary)`. Change `.slot-search-label` color to `var(--red)`.

Replace `.slot-search-input`, `.slot-search-input:focus`, `.slot-search-results`, `.slot-search-result`, `.slot-search-result:hover`, `.slot-search-result-name`, `.slot-remove-panel`, `.slot-remove-btn`, `.slot-remove-btn:hover` with:

```css
.slot-search-input {
  width: 100%;
  height: 42px;
  padding: 0 1rem;
  background: #FFFFFF;
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  transition: var(--transition);
}

.slot-search-input:focus {
  box-shadow: 3px 3px 0 rgba(43, 43, 58, 0.22);
}

.slot-search-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem;
  background: var(--panel-alt);
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-subtle);
  max-height: 220px;
  overflow-y: auto;
}

.slot-search-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
  border: 2px solid transparent;
  transition: var(--transition);
  width: 72px;
  text-align: center;
}

.slot-search-result:hover {
  background: #FFF3C4;
  border-color: var(--panel-border);
}

.slot-search-result-name {
  font-family: var(--font-heading);
  font-size: 0.66rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.slot-remove-panel {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: #FBDCD5;
  border: 2px solid var(--red);
  border-radius: var(--radius-sm);
}

.slot-remove-btn {
  padding: 0.5rem 1.1rem;
  background: var(--red);
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.slot-remove-btn:hover {
  background: var(--red-dark);
}
```

Also change `.slot-search-loading` color to `var(--text-secondary)`.

- [ ] **Step 5: Verify + commit**

Run (bash): `CI=true npx react-scripts test --watchAll=false` → PASS.
Preview: create a team, rename it, add a Pokémon via slot search, remove it, delete the team — everything styled as cream pixel panels, localStorage still persisting across reload.

```bash
git add src/Components/style.css
git commit -m "feat: retheme teams section in pixel dialog-box style"
```

---

### Task 6: Sweep leftovers and final verification

**Files:**
- Modify: `src/Components/style.css` (whatever the sweep finds)

**Interfaces:** consumes all prior tasks; produces the finished theme.

- [ ] **Step 1: Grep for dark-theme leftovers**

Run: `grep -n "255, 203, 5\|#07090f\|#0d1117\|#111827\|#131b2e\|rgba(255, 255, 255\|rgba(0, 0, 0" src/Components/style.css`

For each hit, replace with the pixel-palette equivalent (`var(--panel-alt)` for faint light fills, `var(--border-subtle)` for faint borders, `rgba(43, 43, 58, ...)` for shadows) or delete the rule if it belongs to a deleted component. Expected stragglers include `.summary-pill` context, focus rings, and media-query overrides.

- [ ] **Step 2: Full test + build**

Run (bash): `CI=true npx react-scripts test --watchAll=false` → PASS (3 tests).
Run: `npm run build` → "Compiled successfully".

- [ ] **Step 3: End-to-end visual verification (use the verify skill / preview tool)**

With `npm start` running: confirm sky+clouds+grass scenery; header cream with no underline; nav anchors scroll; browse/filter/paginate; open + close detail panel; search with autocomplete; team CRUD + reload persistence; then resize to 375px width — grid drops to 2 columns, header wraps, detail panel docks to bottom.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: sweep remaining dark-theme styles after pixel-art retheme"
```
