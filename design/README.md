# design/ · print and social pieces for Figma

Everything here is made to be dragged into Figma (File → Import, or drop the
file onto the canvas). Text stays live, shapes stay editable.

## lucky-draw-poster/

| File | Use |
|---|---|
| `lucky-draw-poster-A4.svg` | Editable design · opens as an A4 frame (595 × 842) |
| `lucky-draw-poster-A3.svg` | Editable design · opens as an A3 frame (842 × 1191) |
| `lucky-draw-poster-A4-print.pdf` / `-A3-print.pdf` | Ready to print, 300 dpi, exact paper size |
| `lucky-draw-poster-preview.jpg` | Quick look, or to share on WhatsApp |

Layers: Background, Header, Headline, Grand prize, Prizes, Surprises, Ticket,
Sponsor, Draw date, QR code, Footer. For George Enterprises' logo, replace the
gold "GE" circle in the Sponsor layer.

## assets/

| Folder | What's inside |
|---|---|
| `icons/` | The site's line icons as SVG (sofa, air fryer, mixer, cooker, gift, ticket, film, stall, heart, star…). Gold strokes; recolour in Figma. |
| `qr/` | QR codes for the home, lucky draw, movies, donate, stalls and programme pages. Keep the white border around them, and print them at least 2 cm wide. |
| `logos/` | Victorians Youth marks: `-mark` (black, for light backgrounds), `-mark-light` (cream, for dark), plus the full wordmarks. |
| `palette/` | `doomsday-palette.svg`: every colour with its hex code and what it's for. |

## Fonts

The Lucky Draw poster uses:

- Cinzel for the LUCKY DRAW title and small caps labels
- Playfair Display for prize names and prices
- Montserrat for the details

Cinzel has no ₹ sign, so keep prices in Playfair Display. The website and
other designs use Cormorant Garamond, Hanken Grotesk and IBM Plex Mono. All
of these fonts are built into Figma and free on fonts.google.com.

## Printing from Figma

Select the frame → Export → PDF. If the printer wants bleed, stretch the
Background layer 3 mm past each edge first.

## Regenerating

These files are built from code, so the posters always match the website:

```
python scripts/build_poster.py          # A4 poster SVG
python scripts/build_poster.py --a3     # A3 poster SVG
python scripts/build_design_assets.py   # icons, QR codes, logos, palette
```

Edits you make in Figma aren't written back here. Once you start designing in
Figma, treat Figma as the master copy.

## Prize photos

`lucky-draw-poster/photos/`:

- **The sofa is the real prize.**
  - `sofa-original.webp` is the photo taken at the workshop.
  - `sofa-cutout.png` is the same sofa with the background removed (transparent), for use in Figma.
  - `sofa-studio.jpg` has the sofa colour-corrected and staged on the dark emerald backdrop with a gold spotlight.
  - The poster, the website (`assets/img/2026/prizes/sofa.jpg`) and the Lucky Draw share card all use it.
- **The air fryer, mixie and cooker are Pexels stock photos**, free to use with no credit needed. Swap them for the real prizes once they're photographed. The cooker photo shows a NANDI logo.

`build_poster.py` crops these and embeds them in the SVGs.
