# Vimusement — annual parish fundraiser site

Static, modular website for the yearly Vimusement fair (games, food stalls, and movie
screenings on the church grounds). **No build step.** Hosts free on GitHub Pages. Designed to
be handed from one committee to the next by editing one config file per year.

---

## Project layout

```
index.html                 home page  (thin shell — content comes from config + JS)
donate.html                donation page
.nojekyll                  tells GitHub Pages to serve files as-is

assets/
  css/
    tokens.css             ← THE palette, type scale, spacing. Single source of truth.
    base.css               reset, typography, layout primitives
    components.css         buttons, nav, cards, marquee, countdown, forms, footer
    animations.css         keyframes + the data-animate scroll-reveal system
    pages/
      home.css             home-only styles
      donate.css           donate-only styles
  js/
    core.js                tiny module registry (loaded first)
    site.config.js         things that DON'T change year to year (nav, socials)
    main.js                boots everything (loaded last)
    modules/
      theme.js  dock.js  motion.js  countdown.js  marquee.js
      counters.js  render.js  donate.js  instafeed.js  crew.js
  img/
    2026/                  ← this year's photos  (see its README for the shot list)
    shared/               logo, favicon, social image

years/
  2026.config.js           ← EVERYTHING year-specific: date, venue, line-up, causes, copy
  current.js               one line — which year is "live"
```

Each JS module has **one job** and registers itself with `Vim.register(name, fn)`.
Each CSS file has **one concern**. Add a page by copying a shell + adding `pages/<name>.css`.

---

## Editing content (the common case)

Open **`years/2026.config.js`** and edit the object. That single file controls:

- event date & countdown · venue · contact email · donate link
- the marquee words · the “What’s On” cards · the three causes
- the “Get Involved” cards and their form links
- gallery images · donate-page amounts

Nothing in the HTML needs touching for a normal year. The pages read `data-*` hooks and
fill themselves in (`assets/js/modules/render.js`).

**Donate button:** set `donateUrl` in the config to a Razorpay / Cashfree Payment Page.
Until then the button shows a friendly “not live yet” message.

---

## Design system

Structural rigour is adapted from `DESIGN.md` (an Apple.com design analysis):

- **Alternating full-bleed tiles.** Sections are `.tile--a` (surface), `.tile--b`
  (parchment break) or `.tile--c` (dark). The background-colour change *is* the divider —
  no borders or shadows between sections.
- **One shadow.** `--shadow-image` is reserved for imagery resting on a surface (gallery
  photos). Chrome — cards, buttons, the dock — has none; elevation comes from surface
  colour and the dock's backdrop-blur.
- **Tight display type, 17px body, weight ladder 300 / 400 / 600 / 700** (no 500).
- **One interactive colour** (`--c-primary`). Accents are identity only, never "click me".

Every colour, font and spacing value is a CSS variable in **`assets/css/tokens.css`**,
with a matching dark-mode block. To re-skin a year, change values there and nothing else.

Palette — **“Evensong”**: warm ivory / deep-aubergine neutrals, one indigo-violet
primary (`--c-primary`), three intent accents — gold (`--c-gold`, lights/food),
rose (`--c-rose`, games/kids), teal (`--c-teal`, movies/the cause). Dark mode is the
twilight version of the same.

## Navigation — the bottom dock

Nav is a floating capsule pinned to the **bottom** of the viewport (`assets/js/modules/dock.js`,
`.dock` in `components.css`). It **minimises** — labels collapse, the capsule contracts —
while the page scrolls down, and springs back open on scroll-up, near the top/bottom, or
when scrolling stops. Below 1024px it becomes a full-width icon bar. Respects
`prefers-reduced-motion`. The `body` reserves bottom padding so content clears it.

---

## Images

Per-year folder: `assets/img/2026/` (hero photo, cause photos, logo). See its README for
sizes. Point `years/2026.config.js → images` at the files you add; missing ones show a tidy
placeholder.

**The home-page gallery shows Instagram content** — no separate library to maintain.
`images.gallery.source` in `years/2026.config.js`:

- `"reels"` *(current)* — a **poster wall**: one tall card per year (an illustrated
  fairground scene drawn in code when there's no `poster`), each opens the reel in a dark
  **lightbox**. `reels: [{ year, url, video?, poster? }]`.
  - `video` — a local `.mp4`: plays in a plain on-site player, **no Instagram**. Recommended
    (download your own reel). Overrides `url`.
  - `url` — Instagram link: plays via Instagram's embedded player in the lightbox (their
    branding; can bounce to instagram.com). Used when there's no `video`.
  - `poster` — a cover image; without one the illustrated card is drawn.
  - Code: `assets/js/modules/instafeed.js` (`fairScene()` draws the card art) / `pages/home.css`.
- `"widget"` — whole recent feed, auto-updating via a behold.so snippet in `widgetHtml`.
- `"embed"` — raw official Instagram embeds from `posts[]`.
- `"local"` — your own files in `items[]`.

Set `social.instagram` in `assets/js/site.config.js` for all modes. Both external modes are
lazy-loaded (the Instagram/widget script only runs when the gallery nears the viewport).
Logic: `assets/js/modules/instafeed.js`.

## The Crew section

A carousel of team photos (`assets/js/modules/crew.js`): prev/next + dots + swipe + arrow
keys, gentle autoplay that pauses on hover/focus/touch/off-screen and under
`prefers-reduced-motion`. Each photo zooms in when it enters view. Photos live in
`assets/img/2026/crew/` (`crew-01.jpg` …) — see that folder's README. List them in
`crew.photos` in `years/2026.config.js` with an `alt` each.

## Money features (donations · lucky draw · movies-later)

One Apps Script (`apps-script/Code.gs`) bound to a Master sheet, one tab per feature +
a hidden `_Counters` tab for unique IDs. The `/exec` URL is `years/2026.config.js → api`
(shared). Every feature supports two channels — **UPI** (online) and **cash counter**
(`counter.html`, PIN-gated) — and both land in the same tab with a `Channel` column.

- **Lucky draw** — `draw.html` (buy online) · `#lucky-draw` teaser on the homepage ·
  the **Staff desk** (embedded on money pages + `counter.html`, `desk.js`) for cash sales ·
  `stage.html` for the **live on-stage draw** (spins to a winner, records + emails them).
  Backend generates a unique number per ticket, emails a **designed PDF ticket**.
  Modules: `draw.js`, `desk.js`, `stage.js`. Setup + checklist: **`docs/lucky-draw-setup.md`**.
- **Staff access** — `Staff` tab (`Username·Name·Role·Active·Notes`) + a shared desk key
  (`COUNTER_KEY`). Roles: `counter`, `admin` (admin also runs the draw). Every action is
  recorded under the username + a hidden `_Log` audit tab.

## Donations — zero-fee UPI

Backend = **one Google Apps Script** bound to a **Master sheet** (one tab per feature —
`Donations` first, `Movies` / `Food` later). No gateway, **no transaction fee** — donors
pay straight to the parish UPI id.

- `apps-script/Code.gs` — paste into the sheet's Apps Script, set `UPI_VPA` / `UPI_NAME`,
  add two triggers, deploy as a Web App, put the `/exec` URL in
  `years/2026.config.js → donation.api`.
- Flow: `donate.html` → `?action=pledge` (writes a Pending row + a `VIM…` reference,
  returns a `upi://pay` link) → donor pays via QR / their UPI app → `?action=ipaid` →
  a volunteer sets Status `Confirmed` in the sheet → the script **emails the donor** and
  the name joins the wall.
- `assets/vendor/qrcode-generator.js` (MIT) renders the UPI QR client-side.
- Supporters wall (`assets/js/modules/donors.js`, `#supporters` section + a panel on
  `donate.html`) scrolls **confirmed donor names only** — `?action=donors` never returns
  amounts. The sheet tracks every amount privately.
- Full setup + a 13-step verification checklist + the volunteer routine:
  **`docs/donations-setup.md`**.

## Glassmorphism & zoom-in

Frosted-glass controls (dock, reel play buttons, carousel nav/dots, lightbox close) and the
per-image zoom-in reveal are documented in **`docs/design-glassmorphism.md`** — glass tokens
live in `tokens.css` (`--glass-*`), the `.glass` utility in `components.css` (with an
`@supports` fallback), the `zoom-in` reveal in `animations.css`.

## Venue / map

`years/2026.config.js → venue` holds the name, `address`, `mapQuery` and `quote`. The
`#visit` section (`render.js`) builds an embedded Google Map (no API key — `output=embed`)
and a "Get directions" link from `mapQuery`. Set `venue.mapUrl` to override the directions
link with a specific one.

---

## Running a new year

1. `cp years/2026.config.js years/2027.config.js`
2. In the new file, change the `"2026"` key to `"2027"` and edit the content.
3. In `years/current.js`, change `["2026"]` to `["2027"]`.
4. In each HTML file, update the `<script defer src="years/2026.config.js">` line to `2027`.
5. Add `assets/img/2027/` and drop in the new photos.
6. Deploy (below). Last year stays online at its own URL as the archive.

---

## Deploy to GitHub Pages

1. Push the folder to the repo root of `main` (org: `vimusement`, repo named for the year).
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Live in ~1 minute at `https://vimusement.github.io/<repo>`.

No secrets, no Actions, no environment variables.

---

## Previewing locally

Open the pages through a tiny local server rather than double-clicking:

```bash
python -m http.server 8000
```

then visit `http://localhost:8000`. **After editing CSS/JS, hard-reload** (Ctrl/Cmd-Shift-R) —
`http.server` sends no cache headers so browsers hold on to the old files. GitHub Pages sets
a short cache (~10 min) so production is fine.

---

## Performance notes

- Multiple small CSS/JS files, all same-origin — fine over HTTP/2. No bundler needed.
- `content-visibility:auto` on below-the-fold sections.
- The hero canvas caps device-pixel-ratio at 2 and **pauses** when scrolled past or the
  tab is hidden.
- All animation respects `prefers-reduced-motion` (global off-switch in `animations.css`).
- Only external request is Google Fonts (`display=swap`).

---

## Later phases (not built yet)

`/schedule` · `/impact` · movie booking + unique entry codes · live banner-reveal counter
+ optional physical LED board · volunteer roster with QR check-in · gate scanner PWA.
See the planning blueprint for the full picture.
