"""Vimusement 2026 · Sponsor pamphlet — one A4 sheet, front side, as an
editable SVG (opens straight into Figma/Illustrator/Inkscape; every piece
of text and every icon is a live element, nothing is a flattened image).

  python scripts/build_sponsor_pamphlet.py

Output: design/sponsor-pamphlet/sponsor-pamphlet-A4.svg  (210 x 297 mm)

The idea: a normal, printer-friendly A4 sheet — but a dashed perforation
line runs across the bottom, above a stub strip reading "TORN = YES".
When a business says yes, they tear that strip off on the spot as a small
signing ritual: fill in their name and the tier, photograph it, and send
it to Austin on WhatsApp to lock it in. Nothing to redeem, no logistics
for anyone to honour on the day — just a reason the sheet doesn't end up
in the bin.

The sheet also carries two honesty sections before the pitch: what last
year's money actually paid for, and this year's 40 · 30 · 30 promise —
so a prospective sponsor sees the track record before being asked for
anything.

Fonts: Cinzel (eyebrows / small caps), Playfair Display (headlines),
Montserrat (body). Same trio as the Lucky Draw posters, all free on
Google Fonts.
"""
import html, os
import qrcode

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "design", "sponsor-pamphlet", "sponsor-pamphlet-A4.svg")

# 10 units per mm — a 210 x 297mm A4 sheet
W, H = 2100, 2970
MARGIN = 90

BG, BG2, GOLD, GOLD2 = "#070B08", "#0B130E", "#C9962E", "#DDAE4C"
CREAM, SOFT, MUTE = "#F4EEE2", "#C7D4C2", "#8FA089"
EDUC, MED, EMERG = "#DDAE4C", "#4FD98C", "#E39AA8"
CAPS = "Cinzel, serif"
DISPLAY = "Playfair Display, Georgia, serif"
SANS = "Montserrat, Segoe UI, Arial, sans-serif"

WA = "https://wa.me/916379468686?text=Hi%20Austin%2C%20I%27d%20like%20to%20know%20more%20about%20sponsoring%20Vimusement%202026."
SITE = "victoriansyouth.github.io/Vimusement2k26/sponsors.html"

esc = lambda s: html.escape(s, quote=True)


def text(x, y, s, size, fill, family=SANS, weight=400, anchor="start", spacing=0, extra=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
            + (f' letter-spacing="{spacing}"' if spacing else "")
            + extra + f'>{esc(s)}</text>')


def wrap(x, y, s, size, fill, max_chars, family=SANS, weight=400, line_h=None, anchor="start"):
    """naive word-wrap by character count — fine at a fixed size/column width"""
    words = s.split(" ")
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if len(trial) > max_chars and cur:
            lines.append(cur); cur = w
        else:
            cur = trial
    if cur: lines.append(cur)
    lh = line_h or size * 1.5
    out = []
    for i, ln in enumerate(lines):
        out.append(text(x, y + i * lh, ln, size, fill, family, weight, anchor))
    return "".join(out), y + (len(lines) - 1) * lh


def layer(name, body):
    return f'<g id="{name.lower().replace(" ", "-")}" inkscape:groupmode="layer" inkscape:label="{esc(name)}">{body}</g>'


ICON = {
    "hands": '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 12V4.5a1.5 1.5 0 0 1 3 0V12M14 12V6.5a1.5 1.5 0 0 1 3 0V14c0 3.3-2.7 6-6 6s-6-2.7-6-6v-1.5a1.5 1.5 0 0 1 3 0V14"/>',
    "star": '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"/>',
    "heart": '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "cap": '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/>',
}


def icon(key, cx, cy, size, stroke=GOLD2, sw=1.5):
    s = size / 24
    return (f'<g transform="translate({cx - size / 2:.1f} {cy - size / 2:.1f}) scale({s:.3f})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICON[key]}</g>')


def v_mark(cx, cy, r, stroke=GOLD2, sw=6):
    return (f'<g stroke="{stroke}" stroke-width="{sw}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<circle cx="{cx}" cy="{cy}" r="{r}"/><circle cx="{cx}" cy="{cy}" r="{r*0.2:.1f}" fill="{stroke}" stroke="none"/>'
            f'<path d="M{cx} {cy-r*1.15:.1f}V{cy+r*1.15:.1f}M{cx-r*1.15:.1f} {cy}H{cx+r*1.15:.1f}"/>'
            f'<path d="M{cx-r*0.75:.1f} {cy-r*0.6:.1f}L{cx+r*0.75:.1f} {cy+r*0.6:.1f}M{cx+r*0.75:.1f} {cy-r*0.6:.1f}L{cx-r*0.75:.1f} {cy+r*0.6:.1f}"/></g>')


def qr_svg(data, x, y, size, dark=BG):
    qr = qrcode.QRCode(border=1, box_size=1)
    qr.add_data(data)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    cell = size / n
    out = []
    for r, row in enumerate(m):
        for c, on in enumerate(row):
            if on:
                out.append(f'<rect x="{x + c*cell:.2f}" y="{y + r*cell:.2f}" width="{cell*1.02:.2f}" height="{cell*1.02:.2f}" fill="{dark}"/>')
    return "".join(out)


TIERS = [
    ("hands", "Community Partner", "Flexible", "Logo on the banners, a mention in our posts, a shout-out on stage."),
    ("star", "Product Partner", "Products / vouchers", "Give what you make or sell (food, drinks, goods) — we promote your brand in return."),
    ("heart", "Prize Partner", "Gifts / vouchers", "Sponsor a game prize; your brand is named the moment it's won."),
]

PLEDGE = [
    (EDUC, "cap", "40%", "Education", "School fees, books and exam costs for children who'd otherwise drop out."),
    (MED, "heart", "30%", "Medical & needs", "Hospital bills and essentials for families going through a hard stretch."),
    (EMERG, "shield", "30%", "Emergency Fund", "Held in reserve, released the moment it's needed most."),
]

body = []
body.append(layer("cut-guide",
    f'<rect x="1" y="1" width="{W-2}" height="{H-2}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="1" stroke-dasharray="6 6"/>'))

STUB_H = 640
PERF_Y = H - STUB_H

# ================= MAIN SHEET =================
main = [f'<rect x="0" y="0" width="{W}" height="{PERF_Y}" fill="{BG}"/>']

# ---- header ----
main.append(v_mark(150, 150, 40))
main.append(text(215, 138, "VIMUSEMENT", 46, CREAM, CAPS, 700, spacing=3))
main.append(text(215, 178, "2026 · Ascension Church, Aminjikkarai", 20, MUTE, SANS, 500, spacing=1))
main.append(text(W - MARGIN, 148, "PARTNERSHIP INVITE", 24, GOLD2, CAPS, 700, anchor="end", spacing=3))
main.append(text(W - MARGIN, 178, "25 OCTOBER 2026", 18, MUTE, SANS, 600, anchor="end", spacing=1))
main.append(f'<line x1="{MARGIN}" y1="230" x2="{W-MARGIN}" y2="230" stroke="{GOLD}" stroke-opacity=".4" stroke-width="1.5"/>')

# ---- headline ----
main.append(text(MARGIN, 340, "Be part of Vimusement 2026", 76, CREAM, DISPLAY, 700))
sub, _ = wrap(MARGIN, 400, "One day, hundreds of families through the gates, and real branding on posters, "
              "banners, and from the stage. Every gift also joins the pledge below.", 24, SOFT, 78)
main.append(sub)

# ---- last year: where the money went (honesty before the ask) ----
y0 = 500
main.append(text(MARGIN, y0, "WHERE LAST YEAR'S MONEY WENT", 20, GOLD2, CAPS, 700, spacing=2))
main.append(f'<rect x="{MARGIN}" y="{y0+30}" width="{W-2*MARGIN}" height="270" rx="14" fill="{BG2}" stroke="{GOLD}" stroke-opacity=".35" stroke-width="1.5"/>')
main.append(text(MARGIN + 40, y0 + 105, "₹94,300", 58, GOLD2, DISPLAY, 700))
main.append(text(MARGIN + 40, y0 + 140, "raised and spent last year", 20, MUTE, SANS, 500))
colx = MARGIN + 430
for amt, label in [("₹34,300", "school fees & exam costs"), ("₹60,000", "medical bills, incl. a heart operation")]:
    main.append(text(colx, y0 + 95, amt, 38, CREAM, DISPLAY, 700))
    w2, _ = wrap(colx, y0 + 128, label, 19, SOFT, 26)
    main.append(w2)
    colx += 420
main.append(text(MARGIN + 40, y0 + 250, "No names, no fuss — money that reached people who needed it.", 19, MUTE, SANS, 400, extra=' font-style="italic"'))

# ---- this year's promise ----
y1 = y0 + 360
main.append(text(MARGIN, y1, "OUR 2026 PROMISE", 20, GOLD2, CAPS, 700, spacing=2))
w3, _ = wrap(MARGIN, y1 + 32, "Every rupee we raise this year, after event costs, is split three ways — announced up "
             "front, and tracked on a public ledger anyone can check.", 24, SOFT, 82)
main.append(w3)

py = y1 + 120
colw = (W - 2 * MARGIN - 2 * 40) / 3
cx = MARGIN
for color, icn, pct, name, desc in PLEDGE:
    main.append(f'<rect x="{cx}" y="{py}" width="{colw}" height="300" rx="14" fill="{BG2}" stroke="{color}" stroke-opacity=".5" stroke-width="1.5"/>')
    main.append(f'<circle cx="{cx+50}" cy="{py+55}" r="28" fill="none" stroke="{color}" stroke-width="2"/>')
    main.append(icon(icn, cx + 50, py + 55, 26, stroke=color))
    main.append(text(cx + 95, py + 65, pct, 42, color, DISPLAY, 700))
    main.append(text(cx + 30, py + 115, name, 24, CREAM, CAPS, 700))
    w4, _ = wrap(cx + 30, py + 148, desc, 18, SOFT, 34)
    main.append(w4)
    cx += colw + 40

# ---- tiers ----
y2 = py + 340
main.append(text(MARGIN, y2, "PICK A TIER", 20, GOLD2, CAPS, 700, spacing=2))
ty = y2 + 55
for icn, name, amount, benefit in TIERS:
    main.append(f'<circle cx="{MARGIN+30}" cy="{ty}" r="26" fill="{BG2}" stroke="{GOLD}" stroke-opacity=".6" stroke-width="2"/>')
    main.append(icon(icn, MARGIN + 30, ty, 26))
    main.append(text(MARGIN + 75, ty - 6, name, 27, GOLD2, CAPS, 700))
    main.append(text(W - MARGIN, ty - 6, amount, 20, MUTE, SANS, 500, anchor="end"))
    w5, _ = wrap(MARGIN + 75, ty + 24, benefit, 20, SOFT, 88)
    main.append(w5)
    ty += 130

# ---- contact + QR ----
y3 = ty + 90
main.append(f'<line x1="{MARGIN}" y1="{y3}" x2="{W-MARGIN}" y2="{y3}" stroke="{GOLD}" stroke-opacity=".4" stroke-width="1.5"/>')
main.append(text(MARGIN, y3 + 55, "WHATSAPP AUSTIN", 18, MUTE, CAPS, 700, spacing=2))
main.append(text(MARGIN, y3 + 92, "+91 63794 68686", 34, CREAM, SANS, 600))
main.append(text(MARGIN, y3 + 130, "or visit " + SITE, 21, GOLD2, SANS, 500))
qr_size = 150
main.append(f'<rect x="{W-MARGIN-qr_size}" y="{y3+20}" width="{qr_size}" height="{qr_size}" fill="{CREAM}"/>')
main.append(qr_svg(WA, W - MARGIN - qr_size + 6, y3 + 26, qr_size - 12, dark=BG))
main.append(text(W - MARGIN - qr_size / 2, y3 + qr_size + 35, "SCAN TO CHAT", 15, MUTE, CAPS, 700, anchor="middle", spacing=2))
main.append(text(MARGIN, y3 + qr_size + 65, "Thank you for helping make Vimusement 2026 possible.", 19, MUTE, SANS, 400, extra=' font-style="italic"'))

body.append(layer("main-sheet", "".join(main)))

# ================= PERFORATION =================
perf = []
notch_r = 24
for xn in (MARGIN, W - MARGIN):
    perf.append(f'<circle cx="{xn}" cy="{PERF_Y}" r="{notch_r}" fill="#FFFFFF"/>')
perf.append(f'<line x1="{MARGIN}" y1="{PERF_Y}" x2="{W-MARGIN}" y2="{PERF_Y}" stroke="#7A6A4A" stroke-width="3" stroke-dasharray="14 12"/>')
perf.append(text(W / 2, PERF_Y - 16, "· · ·  tear along here once you say yes  · · ·", 17, "#7A6A4A", SANS, 500, anchor="middle", spacing=1))
body.append(layer("perforation", "".join(perf)))

# ================= STUB (tear off & keep) =================
stub = [f'<rect x="0" y="{PERF_Y}" width="{W}" height="{STUB_H}" fill="{BG2}"/>']
sy = PERF_Y + 40
stub.append(text(MARGIN, sy + 60, "TORN = YES", 60, GOLD2, DISPLAY, 700))
w6, _ = wrap(MARGIN, sy + 100, "Tear this strip off the moment you decide to partner with us — no form, no waiting. "
             "Fill it in, photograph it, and send it to Austin on WhatsApp; we'll lock in your tier from there.",
             27, SOFT, 96)
stub.append(w6)

fields_y = sy + 195
for label in ["BUSINESS NAME", "TIER CHOSEN"]:
    stub.append(text(MARGIN, fields_y, label, 15, MUTE, CAPS, 700, spacing=1.5))
    stub.append(f'<line x1="{MARGIN+230}" y1="{fields_y}" x2="{MARGIN+780}" y2="{fields_y}" stroke="{GOLD}" stroke-opacity=".55" stroke-width="1.5"/>')
    fields_y += 55

stub.append(v_mark(W - MARGIN - 70, PERF_Y + STUB_H / 2 - 20, 34))
stub.append(text(W - MARGIN, PERF_Y + STUB_H / 2 + 45, "SPONSOR TICKET · VIMUSEMENT 2026", 15, MUTE, CAPS, 700, anchor="end", spacing=1.5))

body.append(layer("stub", "".join(stub)))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <style>@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&amp;family=Playfair+Display:wght@400;700&amp;family=Montserrat:wght@400;500;600;700&amp;display=swap');text{{font-kerning:normal}}</style>
  {"".join(body)}
</svg>'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(svg)
print("wrote", OUT)
