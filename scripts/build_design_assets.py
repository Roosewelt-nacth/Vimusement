"""
Loose design pieces for Figma, so posters and banners can be put together by
drag-and-drop instead of copying out of the website.

  python scripts/build_design_assets.py

Writes into design/assets/:
  icons/    the site's line icons as standalone SVGs (gold strokes; recolour in Figma)
  qr/       QR codes for the main pages, drawn as squares so they stay sharp at any size
  logos/    copies of the Victorians Youth marks (dark and light)
  palette/  the Doomsday colour swatches as an SVG you can pick colours from
"""
import json, os, shutil, subprocess

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "design", "assets")
BASE = "https://victoriansyouth.github.io/Vimusement2k26/"
GOLD = "#DDAE4C"

ICONS = {
    "sofa":      '<path d="M4.5 11V8.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V11"/><path d="M2.5 13.2a2 2 0 0 1 4 0V15h11v-1.8a2 2 0 0 1 4 0V17a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"/><path d="M5.5 19v1.8M18.5 19v1.8M12 5.5V15"/>',
    "air-fryer": '<rect x="5" y="2.8" width="14" height="18.4" rx="4.2"/><circle cx="12" cy="7.6" r="1.9"/><path d="M8 12.4h8v3.8a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 16.2z"/><path d="M10.8 15h2.4"/>',
    "mixer":     '<path d="M8 2.8h8l-1.1 9H9.1z"/><path d="M16 4.6h2v4.2h-2.6"/><path d="M10.6 11.8v2.2h2.8v-2.2"/><rect x="5.8" y="14" width="12.4" height="7.2" rx="2.2"/><circle cx="12" cy="17.6" r="1.4"/>',
    "cooker":    '<path d="M4 11.5h16v5.3a4.2 4.2 0 0 1-4.2 4.2H8.2A4.2 4.2 0 0 1 4 16.8z"/><path d="M2.8 11.5h18.4"/><path d="M8.2 11.5V9.6a3.8 3.8 0 0 1 7.6 0v1.9"/><path d="M12 5.8V3.2"/><path d="M20.4 13.3h2.4"/>',
    "gift":      '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.2h14V12M12 8v12.2"/><path d="M12 8S10.6 3.6 8.2 4.6C6.5 5.4 7.8 8 12 8zM12 8s1.4-4.4 3.8-3.4c1.7.8.4 3.4-3.8 3.4z"/>',
    "ticket":    '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"/><path d="M14 6v8" stroke-dasharray="1.5 2"/>',
    "carnival-mark": '<circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.6"/><path d="M12 3v16M4 11h16M6.3 5.3l11.4 11.4M17.7 5.3 6.3 16.7"/>',
    "film":      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 8.5h4M3 12h4M3 15.5h4M17 8.5h4M17 12h4M17 15.5h4"/>',
    "heart":     '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "star":      '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"/>',
    "stall":     '<path d="M3.5 9 5 4h14l1.5 5"/><path d="M3.5 9h17v1.3a2.8 2.8 0 0 1-5.7 0 2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.7 0z"/><path d="M5 12.5V20h14v-7.5"/><path d="M10 20v-4.5h4V20"/>',
    "people":    '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>',
    "graduation-cap": '<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.8"/><path d="M22 9.5v5.5"/>',
    "map-pin":   '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.4"/>',
    "photos":    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 15 5-4 4 3 3-2 6 4"/><circle cx="9" cy="9" r="1.4"/>',
    "play":      '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
    "calendar":  '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
}
QRS = {"lucky-draw": "draw.html", "home": "", "movies": "movies.html", "donate": "donate.html",
       "stalls": "stalls.html", "programme": "programme.html"}
PALETTE = [  # name, hex, use
    ("Void black", "#070B08", "main background"), ("Deep night", "#0E1310", "page background"),
    ("Forest surface", "#182019", "cards"), ("Doom emerald", "#1F6B45", "buttons, strips"),
    ("Emerald glow", "#4FD98C", "light, sparks (screen)"), ("Regal amber", "#C9962E", "gold lines, frames"),
    ("Bright gold", "#DDAE4C", "prices, highlights"), ("Cream", "#F4EEE2", "headlines"),
    ("Mint ivory", "#EAF2E6", "text on emerald"), ("Sage", "#C7D4C2", "body text"),
    ("Muted sage", "#8FA089", "small print"), ("Deep wine", "#7A2333", "rare accent"),
]


def write(rel, text):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(text)


def qr_rows(url):
    js = ("const q=require(process.argv[1])(0,'M');q.addData(process.argv[2]);q.make();const n=q.getModuleCount(),o=[];"
          "for(let r=0;r<n;r++){let s='';for(let c=0;c<n;c++)s+=q.isDark(r,c)?'1':'0';o.push(s)}console.log(JSON.stringify(o))")
    lib = os.path.join(REPO, "assets", "vendor", "qrcode-generator.js")
    return json.loads(subprocess.run(["node", "-e", js, lib, url], capture_output=True, text=True, check=True).stdout)


if __name__ == "__main__":
    for name, body in ICONS.items():
        write(f"icons/{name}.svg",
              f'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="{GOLD}" '
              f'stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">{body}</svg>\n')
    for name, page in QRS.items():
        url = BASE + page
        rows = qr_rows(url)
        n, quiet = len(rows), 4
        size = n + 2 * quiet
        squares = "".join(f"M{c + quiet} {r + quiet}h1v1h-1z" for r, row in enumerate(rows) for c, v in enumerate(row) if v == "1")
        write(f"qr/qr-{name}.svg",
              f'<svg xmlns="http://www.w3.org/2000/svg" width="{size * 12}" height="{size * 12}" viewBox="0 0 {size} {size}" shape-rendering="crispEdges">'
              f'<!-- {url} --><rect width="{size}" height="{size}" fill="#FFFFFF"/><path d="{squares}" fill="#070B08"/></svg>\n')
    sw, sh, cols = 280, 230, 4
    rows_n = (len(PALETTE) + cols - 1) // cols
    cells = []
    for i, (name, hx, use) in enumerate(PALETTE):
        x, y = 40 + (i % cols) * (sw + 30), 90 + (i // cols) * (sh + 30)
        light = hx in ("#F4EEE2", "#EAF2E6", "#C7D4C2", "#DDAE4C", "#4FD98C", "#C9962E", "#8FA089")
        ink = "#12180F" if light else "#F4EEE2"
        cells.append(f'<g><rect x="{x}" y="{y}" width="{sw}" height="{sh}" rx="18" fill="{hx}" stroke="#2B372C"/>'
                     f'<text x="{x + 20}" y="{y + sh - 70}" font-family="Hanken Grotesk, Arial" font-size="24" font-weight="600" fill="{ink}">{name}</text>'
                     f'<text x="{x + 20}" y="{y + sh - 42}" font-family="IBM Plex Mono, Consolas, monospace" font-size="20" fill="{ink}">{hx}</text>'
                     f'<text x="{x + 20}" y="{y + sh - 16}" font-family="Hanken Grotesk, Arial" font-size="17" fill="{ink}" opacity=".8">{use}</text></g>')
    W, H = 40 + cols * (sw + 30) + 10, 90 + rows_n * (sh + 30) + 20
    write("palette/doomsday-palette.svg",
          f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#FFFFFF"/>'
          f'<text x="40" y="58" font-family="Cormorant Garamond, Georgia, serif" font-size="40" font-weight="600" fill="#12180F">Vimusement 2026 · Doomsday palette</text>'
          + "".join(cells) + "</svg>\n")
    for f in ("victorians-mark.png", "victorians-mark-light.png", "victorians.png", "victorians-light.png"):
        dst = os.path.join(OUT, "logos", f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(os.path.join(REPO, "assets", "img", "shared", f), dst)
    print("icons:", len(ICONS), "· qr:", len(QRS), "· palette: 1 · logos: 4")
