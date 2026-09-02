# Images — Vimusement 2026

Drop this year's photos here, then point `years/2026.config.js → images` at them.
Each year gets its own folder (`assets/img/2027/`, …) so nothing is overwritten.

## The gallery comes from Instagram

The home-page gallery is a **live Instagram feed** — you don't store those photos here.
Set it up once:

1. Go to **behold.so** (free), sign in with the parish Instagram, create a feed, copy the
   embed snippet.
2. Paste the snippet into `widgetHtml` in `years/2026.config.js` (`images.gallery`), and set
   `source: "widget"`.
3. Put the profile URL in `social.instagram` in `assets/js/site.config.js`.

After that: post to Instagram as normal — the site updates itself. (Alternatives to Behold:
lightwidget.com, snapwidget.com.) To go back to hand-picked local photos, set
`source: "local"` and list files in `items`.

## What to add (local files still needed)

| File name (suggested) | Used for | Notes |
|---|---|---|
| `hero.jpg` | Soft background behind the hero | Church grounds at dusk, or a wide past-fair crowd shot. Landscape, min 1920×1080. Optional — sits faint behind the text. |
| `crew/crew-NN.jpg` | The Crew section carousel | Team / memories photos — see `crew/README.md` for the naming + size convention. |
| `reel-2025.jpg` … | Gallery reel posters | Optional cover screenshots for each recap reel (portrait 9:16). Without them, a coloured card with the year shows. Point `reels[].poster` at each. |
| `cause-scholarship.jpg` | The Cause / Impact section | A scholarship handover or a student — **only with written consent**. |
| `cause-medical.jpg` | The Cause / Impact section | A supported family or a volunteer visit — **only with written consent**. |
| `cause-volunteers.jpg` | The Cause / Impact section | Volunteers at work — easiest to get consent for. |

## Also needed (shared, not per-year) — put in `assets/img/shared/`

| File | Used for |
|---|---|
| `logo.svg` | The Vimusement wordmark / logo (replaces the text brand in the nav) |
| `favicon.png` | Browser-tab icon, 512×512 |
| `og-default.png` | Social-share preview image, 1200×630 — shown when the link is posted to WhatsApp / Facebook |

## Formats & size

- Prefer `.jpg` for photos, `.svg` for the logo, `.png` for favicon / OG.
- Compress before committing (TinyPNG / Squoosh). Aim under 300 KB per photo.
- Keep the originals somewhere else; only the web-sized copies go in the repo.
