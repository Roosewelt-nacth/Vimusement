# Vimusement — Glassmorphism & zoom-in reference

An add-on to the core design system (`assets/css/tokens.css` + `docs`/README). Use this
when a surface should feel like frosted glass floating over imagery, and when content
should arrive with a soft zoom.

Two families:

- **`.glass`** — controls over imagery / dark tiles (dock, reel play buttons, carousel
  nav, lightbox close). White fills, white ink.
- **`.glass-panel`** — content panels on the page ground (cards, donate panels, the
  supporters wall, form fields). Translucent *surface* colour, readable dark ink, an inset
  top highlight. These work because `body::before` paints a soft ambient colour wash and
  the light tiles are ~92% opaque, so there's real colour under the blur — not grey plastic.

---

## 1 · Glass tokens

Defined in `tokens.css`, with a dark-mode variant:

| Token | Light | Role |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,.14)` | panel fill |
| `--glass-bg-strong` | `rgba(255,255,255,.24)` | hover / active fill |
| `--glass-border` | `rgba(255,255,255,.38)` | 1px hairline that catches light |
| `--glass-blur` | `blur(10px) saturate(160%)` | the `backdrop-filter` |
| `--glass-shadow` | `0 8px 30px -10px rgba(10,7,20,.45)` | soft lift |
| `--glass-ink` | `#fff` | text/icon colour on glass (glass always sits on dark imagery) |

Dark mode nudges the fills down (`.10` / `.18`) and the border to `rgba(255,255,255,.28)`.

### The `.glass` utility

```css
.glass{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  backdrop-filter:var(--glass-blur);
  -webkit-backdrop-filter:var(--glass-blur);
  box-shadow:var(--glass-shadow);
  color:var(--glass-ink);
}
.glass:hover{ background:var(--glass-bg-strong); }
```

Always ship a **fallback**: wrap the `backdrop-filter` in
`@supports (backdrop-filter: blur(1px))`. Without support, raise the plain background
opacity to ~`.6` so the control stays legible.

### Where it is used

- **Bottom dock** — the whole capsule (already).
- **Reel cards** — the centre play button and the year badge.
- **Crew carousel** — prev/next buttons, the dot bar, and the caption strip that floats
  over the photo.
- **Lightbox** — the close button.

### Where NOT to use it

- Section backgrounds, the footer, form fields, text cards on the page ground.
- Anything that needs a hard edge or high text contrast for reading.
- More than ~2 glass elements visible in one viewport — it stops feeling special.

---

## 2 · Zoom-in reveal

The scroll-reveal `zoom-in` variant (`animations.css`) now combines three things so
content *arrives* rather than just fades:

```
from : opacity 0 · scale(.9) · blur(10px)
to   : opacity 1 · scale(1)  · blur(0)
easing: var(--ease-out) · duration var(--dur-4) (~0.8s)
```

- Driven by the same `[data-animate="zoom-in"]` hook + `motion.js` IntersectionObserver.
- `data-animate-stagger` on a parent cascades children (reel wall, gallery, carousel-in).
- Respects `prefers-reduced-motion` — the global off-switch skips it entirely.
- Use it for **imagery and media blocks** (reel cards, the crew carousel, gallery tiles,
  the hero photo). Keep text blocks on the lighter `fade-up`.

### Per-image zoom on view

Every photo zooms in the moment it becomes visible:

- **Scroll-in** (reel cards, gallery tiles, the crew carousel as a block) — the
  `[data-animate="zoom-in"]` reveal above.
- **Carousel slides** — `modules/crew.js` runs a Web Animations API zoom
  (`scale(1.12) → scale(1)`, ~0.9s, `--ease-out`) on the active photo each time it comes
  into view: on first scroll-in and on every slide change. Self-disables under
  `prefers-reduced-motion` (checked in JS).

### Hover zoom

Reel cards also lift + `scale(1.02)` on hover, with `overflow:hidden` on the frame so the
art grows inside the rounded corners. Disabled under `prefers-reduced-motion`.

---

## 3 · Checklist before shipping a glass element

- [ ] It sits over a photo, gradient, or the reel scene — not the page ground.
- [ ] `backdrop-filter` has an `@supports` fallback with a higher-opacity background.
- [ ] Border is a light hairline (`--glass-border`), not a solid line.
- [ ] Text/icons use `--glass-ink` (white) and stay ≥ 4.5:1 against the blurred backdrop.
- [ ] No more than two glass surfaces share a viewport.
- [ ] Focus ring is still visible (`--c-gold` outline).
