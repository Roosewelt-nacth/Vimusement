# Crew carousel photos — 2026

Photos for the **The Crew** section carousel on the home page.

## Naming convention

`crew-NN.jpg` — zero-padded (`crew-01`, `crew-02`, … `crew-12`) so they list in order
in a file browser and in `years/2026.config.js`.

## Adding / changing photos

1. Export to **JPEG** (phones save HEIC/HEIF, which browsers can't show — convert with
   Squoosh.app, macOS Preview → Export, or `pillow-heif`).
2. Resize to **~1400 px on the long edge**, quality ~78, and keep each file **under ~450 KB**.
3. Name it the next number (`crew-08.jpg`), drop it here.
4. Add a line to `crew.photos` in `years/2026.config.js` with a short `alt` describing it.

## Current set

| File | What it is |
|------|-----------|
| `crew-01.jpg` | Team at the parish hall |
| `crew-02.jpg` | Full group on the church steps with Father |
| `crew-03.jpg` | Feast-night stage — flower heart on the steps |
| `crew-04.jpg` | Gathered in the chapel with the Bishop |
| `crew-05.jpg` | Pilgrimage outing to the shrine |
| `crew-06.jpg` | Victorians Youth on the church steps |
| `crew-07.jpg` | The performance team before going on |

For a new year, make a sibling folder `assets/img/2027/crew/` and start again at `crew-01`.
