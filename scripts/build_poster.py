"""Vimusement 2026 · Lucky Draw poster (A4 and A3) as editable SVGs for Figma.

  python scripts/build_poster.py          # A4  → design/lucky-draw-poster/lucky-draw-poster-A4.svg
  python scripts/build_poster.py --a3     # A3  → design/lucky-draw-poster/lucky-draw-poster-A3.svg

Units: 10 per mm (the canvas is 2970 x 4200 = 297 x 420 mm). Every piece of
text is live <text> (fonts below, all free on Google Fonts and built into
Figma). Sections are named groups so they show up as layers in Figma,
Illustrator and Inkscape.

Fonts: Cinzel (the title and small caps labels), Playfair Display (names and
prices; it has the ₹ sign, Cinzel doesn't), Montserrat (info lines).
"""
import base64, html, json, math, os, random, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAW_URL = "https://victoriansyouth.github.io/Vimusement2k26/draw.html"
A4 = "--a3" not in sys.argv
# A4 is A3 halved, same proportions, so the layout carries over. For A4 the
# canvas is sized to Figma's A4 frame (595 x 842) so it imports as a true A4
# and exports to PDF at 210 x 297 mm; the smallest text is raised so nothing
# prints below ~8 pt.
OUT = os.path.join(REPO, "design", "lucky-draw-poster", "lucky-draw-poster-" + ("A4" if A4 else "A3") + ".svg")
MIN_TEXT = 40 if A4 else 0

W, H = 2970, 4200
BG, EMER, GOLD, GOLD2 = "#070B08", "#1F6B45", "#C9962E", "#DDAE4C"
CREAM, SOFT, MUTE = "#F4EEE2", "#C7D4C2", "#8FA089"
CAPS = "Cinzel, serif"
DISPLAY = "Playfair Display, Georgia, serif"
SANS = "Montserrat, Segoe UI, Arial, sans-serif"

e = lambda s: html.escape(s, quote=True)

def text(x, y, s, size, fill, family=SANS, weight=400, anchor="start", spacing=0, italic=False, extra=""):
    size = max(size, MIN_TEXT)
    return (f'<text x="{x:.0f}" y="{y:.0f}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
            + (f' letter-spacing="{spacing}"' if spacing else "")
            + (' font-style="italic"' if italic else "") + extra + f'>{e(s)}</text>')

def layer(name, body):
    safe = name.lower().replace(" ", "-")
    return f'<g id="{safe}" inkscape:groupmode="layer" inkscape:label="{e(name)}">{body}</g>'

ICON = {
    "gift": '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.2h14V12M12 8v12.2"/><path d="M12 8S10.6 3.6 8.2 4.6C6.5 5.4 7.8 8 12 8zM12 8s1.4-4.4 3.8-3.4c1.7.8.4 3.4-3.8 3.4z"/>',
}
def icon(key, cx, cy, size, stroke=GOLD2, sw=1.25):
    s = size / 24
    return (f'<g transform="translate({cx - size / 2:.1f} {cy - size / 2:.1f}) scale({s:.3f})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICON[key]}</g>')

def chip(xr, y, label="BRANDED", fs=30):
    """a dark 'BRANDED' chip whose right edge sits at xr"""
    fs = max(fs, MIN_TEXT); h = fs + 28
    w = 90 + len(label) * fs * 0.82
    x = xr - w
    return (f'<rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="{h}" rx="{h / 2}" fill="{BG}" fill-opacity=".8" stroke="{GOLD}" stroke-opacity=".8" stroke-width="2.5"/>'
            + f'<path d="M{x + 26:.0f} {y + h / 2} l10 10 l18 -20" fill="none" stroke="{GOLD2}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            + text(x + 68, y + h / 2 + fs * 0.36, label, fs, "#F3DDA0", CAPS, 700, spacing=4))

def medal(cx, cy, r, label, fs):
    """a plain gold disc with a fine ring and the place in Cinzel"""
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#foil)" stroke="#0B130E" stroke-opacity=".6" stroke-width="3"/>'
            + f'<circle cx="{cx}" cy="{cy}" r="{r - 12}" fill="none" stroke="#0B130E" stroke-opacity=".45" stroke-width="2"/>'
            + text(cx, cy + fs * .36, label, fs, BG, CAPS, 700, "middle", spacing=2))

def sparkles(seed, n, box, rmin, rmax, avoid=()):
    """scattered four-point gold stars; `avoid` = boxes to keep clear (x0,y0,x1,y1)"""
    rnd, out, x0, y0, x1, y1 = random.Random(seed), [], *box
    while len(out) < n:
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        if any(a <= x <= c and b <= y <= d for a, b, c, d in avoid):
            continue
        r = rnd.uniform(rmin, rmax); o = rnd.uniform(.3, .9)
        out.append(f'<path d="M{x:.0f} {y - r:.0f}Q{x:.0f} {y:.0f} {x + r:.0f} {y:.0f}Q{x:.0f} {y:.0f} {x:.0f} {y + r:.0f}Q{x:.0f} {y:.0f} {x - r:.0f} {y:.0f}Q{x:.0f} {y:.0f} {x:.0f} {y - r:.0f}Z" fill="#F3D27A" opacity="{o:.2f}"/>')
    return "".join(out)
def dots(seed, n, box):
    rnd, x0, y0, x1, y1 = random.Random(seed), *box
    return "".join(f'<circle cx="{rnd.uniform(x0, x1):.0f}" cy="{rnd.uniform(y0, y1):.0f}" r="{rnd.uniform(2, 6):.1f}" fill="#F3D27A" opacity="{rnd.uniform(.12, .5):.2f}"/>' for _ in range(n))
def bokeh(seed, n, box):
    rnd, x0, y0, x1, y1 = random.Random(seed), *box
    return "".join(f'<circle cx="{rnd.uniform(x0, x1):.0f}" cy="{rnd.uniform(y0, y1):.0f}" r="{rnd.uniform(40, 130):.0f}" fill="{rnd.choice(["#F3D27A", "#E2B654", "#4FD98C"])}" opacity="{rnd.uniform(.05, .14):.2f}" filter="url(#blur12)"/>' for _ in range(n))
def rays(cx, cy, n, length, spread):
    out = []
    for i in range(n):
        a = math.radians(90 + (i - (n - 1) / 2) * spread / (n - 1))
        w = math.radians(spread / n * .38)
        pts = [(cx, cy), (cx + length * math.cos(a - w), cy + length * math.sin(a - w)), (cx + length * math.cos(a + w), cy + length * math.sin(a + w))]
        out.append('<path d="M' + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts) + 'Z" fill="url(#ray)"/>')
    return "".join(out)
def corner(x, y, sx, sy):
    """a small gold flourish for one corner of the frame"""
    return (f'<g transform="translate({x} {y}) scale({sx} {sy})" fill="none" stroke="{GOLD2}" stroke-width="4" stroke-linecap="round">'
            f'<path d="M0 150V30Q0 0 30 0H150"/><path d="M28 190V58Q28 28 58 28H190" stroke-opacity=".45"/>'
            f'<rect x="-13" y="-13" width="26" height="26" transform="rotate(45)" fill="{GOLD2}" stroke="none"/></g>')
def rule(cx, y, half, gap=0):
    """a gold hairline with a diamond in the middle (or a gap for a label)"""
    if gap:
        return (f'<path d="M{cx - half} {y}H{cx - gap}M{cx + gap} {y}H{cx + half}" stroke="{GOLD}" stroke-opacity=".75" stroke-width="3"/>'
                + f'<rect x="{cx - gap - 9}" y="{y - 9}" width="18" height="18" transform="rotate(45 {cx - gap} {y})" fill="{GOLD2}"/>'
                + f'<rect x="{cx + gap - 9}" y="{y - 9}" width="18" height="18" transform="rotate(45 {cx + gap} {y})" fill="{GOLD2}"/>')
    return (f'<path d="M{cx - half} {y}H{cx + half}" stroke="{GOLD}" stroke-opacity=".75" stroke-width="3"/>'
            + f'<rect x="{cx - 11}" y="{y - 11}" width="22" height="22" transform="rotate(45 {cx} {y})" fill="{GOLD2}"/>')

# ---------------------------------------------------------------- defs
defs = f'''<defs>
  <radialGradient id="glow" cx="50%" cy="28%" r="65%"><stop offset="0" stop-color="{EMER}" stop-opacity=".6"/><stop offset=".55" stop-color="{EMER}" stop-opacity=".12"/><stop offset="1" stop-color="{EMER}" stop-opacity="0"/></radialGradient>
  <linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B2A1F" stop-opacity=".94"/><stop offset="1" stop-color="#0A100C" stop-opacity=".94"/></linearGradient>
  <!-- gold foil: light top edge, deep amber base -->
  <linearGradient id="foil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1C1"/><stop offset=".35" stop-color="#F0C868"/><stop offset=".62" stop-color="#C9962E"/><stop offset=".78" stop-color="#E9C46A"/><stop offset="1" stop-color="#8E6418"/></linearGradient>
  <linearGradient id="foilH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E6418"/><stop offset=".5" stop-color="#F7DC8C"/><stop offset="1" stop-color="#8E6418"/></linearGradient>
  <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A8A5A"/><stop offset=".5" stop-color="#1F6B45"/><stop offset="1" stop-color="#123F29"/></linearGradient>
  <linearGradient id="stub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B8C5B"/><stop offset=".6" stop-color="#1B5E3D"/><stop offset="1" stop-color="#0F3B26"/></linearGradient>
  <radialGradient id="throne" cx="50%" cy="18%" r="42%"><stop offset="0" stop-color="#E7C067" stop-opacity=".26"/><stop offset=".5" stop-color="{GOLD}" stop-opacity=".07"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
  <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F0C868" stop-opacity=".40"/><stop offset=".45" stop-color="{GOLD}" stop-opacity=".12"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="ray" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#F3D27A" stop-opacity=".30"/><stop offset="1" stop-color="#F3D27A" stop-opacity="0"/></radialGradient>
  <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0B130E" stop-opacity=".85"/><stop offset=".3" stop-color="#0B130E" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .07"/></feComponentTransfer></filter>
  <filter id="lift" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".85"/></filter>
  <filter id="halo" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="blur12"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter>
</defs>'''

# ---------------------------------------------------------------- background
M = 190                  # every block starts and ends on this margin
bg = (f'<rect width="{W}" height="{H}" fill="{BG}"/>'
      f'<rect width="{W}" height="{H}" fill="url(#glow)"/>'
      f'<ellipse cx="{W / 2}" cy="3500" rx="1600" ry="560" fill="{EMER}" opacity=".2" filter="url(#blur40)"/>'
      + f'<g opacity=".32">{rays(W / 2, -160, 15, 2000, 70)}</g>'
      + f'<rect width="{W}" height="{H}" fill="url(#throne)"/>'
      + sparkles(7, 10, (130, 130, W - 130, 900), 10, 24, avoid=((W / 2 - 1300, 130, W / 2 + 1300, 960),))
      + dots(11, 36, (110, 110, W - 110, H - 110))
      + f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'
      + f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>'
      + f'<rect x="70" y="70" width="{W - 140}" height="{H - 140}" rx="40" fill="none" stroke="url(#foilH)" stroke-opacity=".8" stroke-width="5"/>'
      + f'<rect x="98" y="98" width="{W - 196}" height="{H - 196}" rx="28" fill="none" stroke="{GOLD}" stroke-opacity=".22" stroke-width="2"/>')

# ---------------------------------------------------------------- header + title
mark = base64.b64encode(open(os.path.join(REPO, "assets/img/shared/victorians-mark-light.png"), "rb").read()).decode()
header = (f'<image x="{W / 2 - 60}" y="160" width="120" height="107" href="data:image/png;base64,{mark}"/>'
          + text(W / 2, 345, "VIMUSEMENT 2026", 60, CREAM, CAPS, 700, "middle", spacing=18)
          + text(W / 2, 405, "AN INITIATIVE OF VICTORIANS YOUTH", 34, MUTE, SANS, 500, "middle", spacing=10))

headline = (rule(W / 2, 480, 520)
            + text(W / 2, 745, "LUCKY DRAW", 250, "url(#foil)", CAPS, 700, "middle", spacing=24, extra=' filter="url(#lift)"')
            + f'<text x="{W / 2}" y="880" font-family="{DISPLAY}" font-size="84" font-weight="600" fill="{CREAM}" text-anchor="middle">'
              f'A <tspan fill="{GOLD2}" font-weight="700">₹50</tspan> ticket could win you a sofa worth <tspan fill="{GOLD2}" font-weight="700">₹12,000</tspan></text>'
            + rule(W / 2, 945, 520))

# ---------------------------------------------------------------- photos
# air fryer, mixie and cooker: Pexels stock photos (free to use, no attribution needed)
PHOTOS = os.path.join(REPO, "design", "lucky-draw-poster", "photos")
def photo(file, box=None, size=(1000, 667), dim=1.0):
    from io import BytesIO
    from PIL import Image, ImageEnhance
    im = Image.open(os.path.join(PHOTOS, file)).convert("RGB")
    if box:
        im = im.crop(box)
    im = im.resize(size, Image.LANCZOS)
    if dim != 1.0:
        im = ImageEnhance.Brightness(im).enhance(dim)
    buf = BytesIO(); im.save(buf, "JPEG", quality=86)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
# the sofa is the REAL prize: sofa-original.webp, cut out and staged by hand into
# sofa-studio.jpg (sofa-cutout.png is the transparent version, for Figma)
PIC = {"sofa": photo("sofa-studio.jpg", (235, 298, 3365, 2077), (1800, 1024)),
       "airfryer": photo("air-fryer-pexels-35285814.jpg"),
       "mixer": photo("mixer-pexels-6803737.jpg"),
       "cooker": photo("cooker-pexels-35041640.jpg")}

def pic(key, x, y, w, h, rx):
    return (f'<clipPath id="clip-{key}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/></clipPath>'
            + f'<g id="photo-{key}" clip-path="url(#clip-{key})"><image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice" href="{PIC[key]}"/>'
            + f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#fadeB)"/></g>'
            + f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="none" stroke="url(#foilH)" stroke-width="4"/>')

# ---------------------------------------------------------------- grand prize
gx, gy, gw, gh = M, 1020, W - 2 * M, 800
pad = 100                                   # left inset for the text column
px, py, pw, ph = gx + gw - 1300 - 30, gy + 30, 1300, gh - 60
grand = (f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="40" fill="url(#card)" stroke="url(#foilH)" stroke-width="5" filter="url(#lift)"/>'
         + text(gx + pad, gy + 150, "GRAND PRIZE", 52, GOLD2, CAPS, 700, spacing=14)
         + text(gx + pad - 8, gy + 390, "Sofa", 250, CREAM, DISPLAY, 700)
         + text(gx + pad, gy + 490, "Three-seater", 60, SOFT, SANS, 500)
         + text(gx + pad, gy + 650, "WORTH", 42, MUTE, CAPS, 700, spacing=8)
         + text(gx + pad + 215, gy + 660, "₹12,000", 160, "url(#foil)", DISPLAY, 700)
         + f'<path d="M{gx + pad} {gy + 705}H{px - 90}" stroke="{GOLD}" stroke-opacity=".45" stroke-width="2"/>'
         + f'<text x="{gx + pad}" y="{gy + 770}" font-family="{SANS}" font-size="{max(46, MIN_TEXT)}" font-weight="500" fill="{SOFT}">Sponsored by <tspan fill="{CREAM}" font-weight="700">{e("Chellamani LLP")}</tspan></text>'
         + pic("sofa", px, py, pw, ph, 26)
         + medal(px + 120, py + 120, 88, "1ST", 58)
         + chip(px + pw - 30, py + ph - 100))

# ---------------------------------------------------------------- 2nd to 4th
prizes = ""
gap = 55; cw, ch, cy0 = (W - 2 * M - 2 * gap) / 3, 660, 1880
for i, (place, name, worth, key) in enumerate([("2ND", "Air fryer", "₹6,000", "airfryer"),
                                               ("3RD", "Mixie", "₹4,000", "mixer"),
                                               ("4TH", "Cooker", "₹3,000", "cooker")]):
    x = M + i * (cw + gap)
    mid = x + cw / 2
    ix, iy, iw, ih = round(x + 22), cy0 + 22, round(cw - 44), 390
    prizes += (f'<g id="prize-{i + 2}"><rect x="{x:.0f}" y="{cy0}" width="{cw:.0f}" height="{ch}" rx="34" fill="url(#card)" stroke="{GOLD}" stroke-opacity=".6" stroke-width="3" filter="url(#lift)"/>'
               + pic(key, ix, iy, iw, ih, 22)
               + medal(ix + 92, iy + 92, 72, place, 36)
               + chip(ix + iw - 22, iy + ih - 78, fs=28)
               + text(mid, cy0 + 520, name, 100, CREAM, DISPLAY, 700, "middle")
               + f'<text x="{mid:.0f}" y="{cy0 + 612}" font-family="{SANS}" font-size="{max(40, MIN_TEXT)}" font-weight="600" fill="{MUTE}" text-anchor="middle" letter-spacing="4">WORTH  '
                 f'<tspan font-family="{DISPLAY}" font-size="84" font-weight="700" fill="url(#foil)" letter-spacing="0">{worth}</tspan></text>'
               + '</g>')

# ---------------------------------------------------------------- surprises + more gifts
def label_rule(y, label):
    """a centred small caps heading between two gold hairlines"""
    gapw = len(label) * 42 * .5 + 50
    return (text(W / 2, y + 14, label, 42, GOLD2, CAPS, 700, "middle", spacing=12)
            + f'<path d="M{M} {y}H{W / 2 - gapw:.0f}M{W / 2 + gapw:.0f} {y}H{W - M}" stroke="{GOLD}" stroke-opacity=".6" stroke-width="2"/>')
sy = 2615
surprise = label_rule(sy, "PLUS SPECIAL SURPRISES")
st, sh = sy + 45, 210
col = (W - 2 * M) / 3
surprise += f'<rect x="{M}" y="{st}" width="{W - 2 * M}" height="{sh}" rx="34" fill="url(#card)" stroke="{GOLD}" stroke-opacity=".6" stroke-width="3"/>'
for i in range(3):
    x = M + i * col
    if i:
        surprise += f'<path d="M{x:.0f} {st + 40}V{st + sh - 40}" stroke="{GOLD}" stroke-opacity=".3" stroke-width="2"/>'
    cx = x + 130
    surprise += (f'<circle cx="{cx:.0f}" cy="{st + sh / 2}" r="70" fill="{GOLD}" fill-opacity=".12" stroke="{GOLD}" stroke-opacity=".7" stroke-width="3"/>'
                 + (text(cx, st + sh / 2 + 42, "?", 120, GOLD2, DISPLAY, 700, "middle") if i < 2
                    else icon("gift", cx, st + sh / 2, 80, stroke=GOLD2, sw=1.6))
                 + text(x + 240, st + 78, f"SURPRISE PRIZE {i + 1}" if i < 2 else "AND MORE", 34, GOLD2, CAPS, 700, spacing=5)
                 + text(x + 240, st + 140, "Mystery gift" if i < 2 else "More gifts", 68, CREAM, DISPLAY, 700)
                 + text(x + 240, st + 186, "Revealed on the night" if i < 2 else "To be won on the night", 38, SOFT, SANS, 500))

# ---------------------------------------------------------------- sponsors
# sponsor logos, embedded so the SVG stays one self-contained file
def logo(path):
    return "data:image/png;base64," + base64.b64encode(open(os.path.join(REPO, path), "rb").read()).decode()
LOGO = {"cc": (logo("assets/img/2026/sponsors/chellamani-logo.png"), 873 / 717),
        "ge": (logo("assets/img/2026/sponsors/george-enterprises-logo.png"), 963 / 265),
        "drm": (logo("assets/img/2026/sponsors/sponsor-01.png"), 161 / 151)}

spy = 2945
sponsor = label_rule(spy, "PRIZES SPONSORED BY")
def plaque(x, w, key, lh, name, what):
    y, h = spy + 45, 160
    href, ratio = LOGO[key]
    lw = lh * ratio
    tx = x + 40 + lw + 40
    return (f'<rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="{h}" rx="30" fill="url(#card)" stroke="{GOLD}" stroke-opacity=".5" stroke-width="3"/>'
            + f'<image x="{x + 40:.0f}" y="{y + (h - lh) / 2:.0f}" width="{lw:.0f}" height="{lh}" href="{href}"/>'
            + text(tx, y + 74, name, 60, CREAM, DISPLAY, 700)
            + text(tx, y + 124, what, 38, SOFT, SANS, 500))
pw2 = (W - 2 * M - gap) / 2
sponsor += (plaque(M, pw2, "cc", 124, "Chellamani LLP", "Grand prize: the sofa")
            + plaque(M + pw2 + gap, pw2, "ge", 84, "George Enterprises", "Air fryer, mixie and cooker"))

# ---------------------------------------------------------------- the ticket
ty, th, tx0, tx1, perf = 3205, 310, M, W - M, 880
nr = 34  # notch radius at the perforation
stub = (f'M{tx0 + 34} {ty}H{perf - nr}A{nr} {nr} 0 0 0 {perf + nr} {ty}H{tx1 - 34}Q{tx1} {ty} {tx1} {ty + 34}'
        f'V{ty + th - 34}Q{tx1} {ty + th} {tx1 - 34} {ty + th}H{perf + nr}A{nr} {nr} 0 0 0 {perf - nr} {ty + th}H{tx0 + 34}'
        f'Q{tx0} {ty + th} {tx0} {ty + th - 34}V{ty + 34}Q{tx0} {ty} {tx0 + 34} {ty}Z')
tr = perf + 100          # left edge of the ticket's text column
ticket = (f'<path d="{stub}" fill="url(#stub)" stroke="{GOLD}" stroke-opacity=".8" stroke-width="4" filter="url(#lift)"/>'
          + f'<line x1="{perf}" y1="{ty + nr + 16}" x2="{perf}" y2="{ty + th - nr - 16}" stroke="#FBE7A6" stroke-opacity=".55" stroke-width="4" stroke-dasharray="4 14" stroke-linecap="round"/>'
          + text((tx0 + perf) / 2, ty + 190, "₹50", 190, "url(#foil)", DISPLAY, 700, "middle")
          + text((tx0 + perf) / 2, ty + 258, "PER TICKET", 40, "#EAF2E6", CAPS, 700, "middle", spacing=10)
          + text(tr, ty + 94, "AVAILABLE AT THE", 40, "#F3DDA0", CAPS, 700, spacing=10)
          + text(tr, ty + 182, "Ticket Counter, Ascension Church", 84, "#FFFFFF", DISPLAY, 700)
          + text(tr, ty + 250, "Open every day until the fair  ·  sold at the counter only", 42, "#D8EBDD", SANS, 500))

# ---------------------------------------------------------------- the draw + QR
dy, bh = 3570, 290       # the date tile, the text and the QR card share this top and height
draw = (f'<rect x="{M}" y="{dy}" width="{bh}" height="{bh}" rx="30" fill="#0B130E" stroke="{GOLD}" stroke-opacity=".8" stroke-width="4"/>'
        + f'<path d="M{M} {dy + 30}Q{M} {dy} {M + 30} {dy}H{M + bh - 30}Q{M + bh} {dy} {M + bh} {dy + 30}V{dy + 78}H{M}Z" fill="url(#foil)"/>'
        + text(M + bh / 2, dy + 54, "OCTOBER", 40, BG, CAPS, 700, "middle", spacing=6)
        + text(M + bh / 2, dy + 196, "25", 120, CREAM, DISPLAY, 700, "middle")
        + text(M + bh / 2, dy + 262, "SUNDAY", 34, GOLD2, CAPS, 700, "middle", spacing=8)
        + text(M + bh + 80, dy + 64, "THE DRAW", 44, GOLD2, CAPS, 700, spacing=14)
        + text(M + bh + 76, dy + 176, "7:30 pm, live on stage", 104, CREAM, DISPLAY, 700)
        + text(M + bh + 80, dy + 250, "Right after evening mass", 46, SOFT, SANS, 500))

# QR, drawn as squares so it stays sharp and editable
def qr_rows(url):
    """QR modules for url, from the same MIT qrcode-generator the site uses (needs node)"""
    js = ("const q=require(process.argv[1])(0,'M');q.addData(process.argv[2]);q.make();const n=q.getModuleCount(),o=[];"
          "for(let r=0;r<n;r++){let s='';for(let c=0;c<n;c++)s+=q.isDark(r,c)?'1':'0';o.push(s)}console.log(JSON.stringify(o))")
    lib = os.path.join(REPO, "assets", "vendor", "qrcode-generator.js")
    return json.loads(subprocess.run(["node", "-e", js, lib, url], capture_output=True, text=True, check=True).stdout)
rows = qr_rows(DRAW_URL)
n = len(rows); qw = qh = bh; qx, qy = W - M - qw, dy
qs = qw - 60; mod = qs / (n + 2); qox, qoy = qx + 30, qy + 10
qr = (f'<rect x="{qx}" y="{qy}" width="{qw}" height="{qh}" rx="26" fill="#FFFFFF"/>'
      + f'<path d="' + "".join(f"M{qox + (c + 1) * mod:.2f} {qoy + (r + 1) * mod:.2f}h{mod:.2f}v{mod:.2f}h-{mod:.2f}z"
                               for r, row in enumerate(rows) for c, ch_ in enumerate(row) if ch_ == "1") + f'" fill="{BG}"/>'
      + text(qx + qw / 2, qy + qh - 14, "SCAN ME", 26, BG, SANS, 700, "middle", spacing=4))

# the event's sponsor, logo alone, centred between two gold hairlines
by_y, by_h = 3890, 140
href, ratio = LOGO["drm"]
lab = "SPONSORED BY"
lab_w = len(lab) * max(42, MIN_TEXT) * .74 + 11 * 12
by_w = lab_w + 44 + by_h * ratio
bx = W / 2 - by_w / 2
by_mid = by_y + by_h / 2
event_sponsor = (f'<path d="M{M} {by_mid}H{bx - 60:.0f}M{bx + by_w + 60:.0f} {by_mid}H{W - M}" stroke="{GOLD}" stroke-opacity=".5" stroke-width="2"/>'
                 + text(bx, by_mid + 15, lab, 42, GOLD2, CAPS, 700, spacing=12)
                 + f'<image x="{bx + lab_w + 44:.0f}" y="{by_y}" width="{by_h * ratio:.0f}" height="{by_h}" href="{href}"/>')

footer = text(W / 2, H - 122, "Every rupee raised, after costs: 40% education  ·  30% medical and other needs  ·  30% youth emergency fund",
              34, MUTE, SANS, 500, "middle")

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="{595 if A4 else 842}" height="{842 if A4 else 1191}" viewBox="0 0 {W} {H}">
<!-- Vimusement 2026 · Lucky Draw poster · {"A4 portrait, 210 x 297 mm (Figma A4 frame 595 x 842)" if A4 else "A3 portrait, 297 x 420 mm (Figma A3 frame 842 x 1191)"}.
     Fonts: Cinzel 700, Playfair Display 600/700, Montserrat 500/600/700 (Google Fonts).
     Colours: void #070B08 · emerald #1F6B45 · gold #C9962E / #DDAE4C · cream #F4EEE2 · sage #C7D4C2.
     QR code points to https://victoriansyouth.github.io/Vimusement2k26/draw.html -->
{defs}
{layer("Background", bg)}
{layer("Header", header)}
{layer("Headline", headline)}
{layer("Grand prize", grand)}
{layer("Prizes", prizes)}
{layer("Surprises", surprise)}
{layer("Sponsors", sponsor)}
{layer("Ticket", ticket)}
{layer("Draw date", draw)}
{layer("QR code", qr)}
{layer("Event sponsor", event_sponsor)}
{layer("Footer", footer)}
</svg>
'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(svg)
print("saved", OUT, len(svg) // 1024, "KB")
