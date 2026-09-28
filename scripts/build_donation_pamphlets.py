"""Vimusement 2026 · Donation/sponsor pamphlet — 4 theme options, A4 front,
as editable SVGs (every piece of text/shape is live — opens straight into
Figma/Illustrator/Inkscape, nothing is a flattened image).

  python scripts/build_donation_pamphlets.py

Output: design/donation-pamphlet/<theme-key>-A4.svg   (210 x 297 mm, one each)

This is deliberately NOT the site's dark gold-on-emerald look — it's meant
for a general audience on a noticeboard or handed out after mass, so each
theme is its own bright, warm, distinct take. Same copy in all four so
they compare like-for-like; only the palette/type/motif changes.

Content, top to bottom:
  - headline + one-line pitch
  - "where last year's money went" (honesty before the ask)
  - "our 2026 promise" — the 40 · 30 · 30 pledge
  - "what your gift does" — three concrete amounts, in the parish's own words
  - contact: Fredrica + Samuel, each with their own WhatsApp QR
  - a perforated tear-off stub: "TORN = I'M IN" — a commitment ritual for
    sponsors AND donors alike, no tiers, no fine print
"""
import html, os
import qrcode

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(REPO, "design", "donation-pamphlet")

W, H = 2100, 2970          # 10 units/mm — A4
MARGIN = 90
STUB_H = 560
PERF_Y = H - STUB_H

FREDRICA_WA = "https://wa.me/919025943235?text=Hi%20Fredrica%2C%20I%27d%20like%20to%20know%20more%20about%20sponsoring%20or%20donating%20to%20Vimusement%202026."
SAMUEL_WA = "https://wa.me/918925032672?text=Hi%20Samuel%2C%20I%27d%20like%20to%20know%20more%20about%20sponsoring%20or%20donating%20to%20Vimusement%202026."

esc = lambda s: html.escape(s, quote=True)


def text(x, y, s, size, fill, family, weight=400, anchor="start", spacing=0, extra=""):
    # font-family names with a space (or a digit, like "Baloo 2") MUST be quoted,
    # or the browser silently drops them and falls back to a generic serif.
    fam = f'&quot;{family}&quot;, sans-serif'
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
            + (f' letter-spacing="{spacing}"' if spacing else "") + extra + f'>{esc(s)}</text>')


def wrap(x, y, s, size, fill, family, max_chars, weight=400, line_h=None, anchor="start"):
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
    "cap": '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>',
    "heart": '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/>',
    "basket": '<path d="M4 9h16l-1.5 10.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 9Z"/><path d="M8 9 9 4h6l1 5M10 13v4M14 13v4"/>',
    "book": '<path d="M4 5.5C6 4.5 9 4 12 5v14c-3-1-6-.5-8 .5V5.5Z"/><path d="M20 5.5C18 4.5 15 4 12 5v14c3-1 6-.5 8 .5V5.5Z"/>',
    "cross": '<path d="M12 4v16M6 9h12v3H6z"/>',
    "phone": '<path d="M6 3h4l1.5 5-2.5 2a12 12 0 0 0 6 6l2-2.5 5 1.5v4a2 2 0 0 1-2 2C10.6 21 3 13.4 3 5a2 2 0 0 1 2-2Z"/>',
    "wheel": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/>',
    "tent": '<path d="M12 3 3 20h18L12 3Z"/><path d="M12 3v17M7.5 11.5h9M6 20l6-9 6 9"/>',
    "sun": '<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
    "stamp_seal": '<circle cx="12" cy="12" r="8"/><path d="M9 12.5l2 2 4-4.5"/>',
}


def icon(key, cx, cy, size, stroke, sw=1.6, fill="none"):
    s = size / 24
    return (f'<g transform="translate({cx - size / 2:.1f} {cy - size / 2:.1f}) scale({s:.3f})" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICON[key]}</g>')


def qr_svg(data, x, y, size, dark):
    qr = qrcode.QRCode(border=1, box_size=1)
    qr.add_data(data); qr.make(fit=True)
    m = qr.get_matrix(); n = len(m); cell = size / n
    out = []
    for r, row in enumerate(m):
        for c, on in enumerate(row):
            if on:
                out.append(f'<rect x="{x + c*cell:.2f}" y="{y + r*cell:.2f}" width="{cell*1.02:.2f}" height="{cell*1.02:.2f}" fill="{dark}"/>')
    return "".join(out)


# ---- shared copy (identical across themes, so they compare fairly) ----
HEADLINE = "Your rupee can change someone's year."
SUBLINE = ("One day, hundreds of families through the gates — games, food and films — "
           "funding scholarships, medical help and an emergency fund, all year round.")
IMPACT_TOTAL = "₹94,300"
IMPACT_NOTE = "No names, no fuss — money that reached people who needed it, last year."
IMPACT_COLS = [("₹34,300", "school fees & exam costs"), ("₹60,000", "medical bills, incl. a heart operation")]
PLEDGE = [("cap", "40%", "Education", "School fees, books and exam costs for children who'd otherwise drop out."),
          ("heart", "30%", "Medical & needs", "Hospital bills and essentials for families going through a hard stretch."),
          ("shield", "30%", "Emergency Fund", "Held in reserve, released the moment it's needed most.")]
GIFTS = [("basket", "₹250", "a week of groceries for a family having a hard month"),
         ("book", "₹800", "exam fees and a set of textbooks for one student"),
         ("cross", "₹6,000", "a real dent in a hospital bill a family can't meet alone")]


def build(theme):
    C = theme
    C.setdefault("stub_ink", C["ink"])
    C.setdefault("stub_soft", C["soft"])
    body = []
    body.append(layer("cut-guide", f'<rect x="1" y="1" width="{W-2}" height="{H-2}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1" stroke-dasharray="6 6"/>'))

    main = [f'<rect x="0" y="0" width="{W}" height="{PERF_Y}" fill="{C["bg"]}"/>']
    main.append(C["decorate_top"](W, PERF_Y))

    # ---- header ----
    main.append(f'<circle cx="150" cy="150" r="42" fill="none" stroke="{C["a1"]}" stroke-width="5"/>')
    main.append(icon(C["mark_icon"], 150, 150, 40, C["a1"], sw=2.2))
    main.append(text(215, 140, "VIMUSEMENT", 48, C["ink"], C["display"], 700, spacing=C["hspace"]))
    main.append(text(215, 178, "2026 · Ascension Church, Aminjikkarai", 20, C["soft"], C["sans"], 500))
    main.append(text(W - MARGIN, 148, C["eyebrow"], 22, C["a2"], C["caps"], 700, anchor="end", spacing=2))
    main.append(text(W - MARGIN, 178, "25 OCTOBER 2026", 18, C["soft"], C["sans"], 600, anchor="end", spacing=1))
    main.append(f'<line x1="{MARGIN}" y1="228" x2="{W-MARGIN}" y2="228" stroke="{C["a1"]}" stroke-opacity=".45" stroke-width="2"/>')

    # ---- headline ----
    hy = 340
    hline, hy_end = wrap(MARGIN, hy, HEADLINE, 74, C["ink"], C["display"], 22, weight=700, line_h=84)
    main.append(hline)
    sy = hy_end + 60
    sline, sy_end = wrap(MARGIN, sy, SUBLINE, 25, C["soft"], C["sans"], 74, line_h=38)
    main.append(sline)

    # ---- where last year's money went ----
    y0 = sy_end + 90
    main.append(text(MARGIN, y0, "WHERE LAST YEAR'S MONEY WENT", 20, C["a2"], C["caps"], 700, spacing=2))
    box_h = 250
    main.append(f'<rect x="{MARGIN}" y="{y0+28}" width="{W-2*MARGIN}" height="{box_h}" rx="18" fill="{C["card"]}" stroke="{C["a1"]}" stroke-opacity=".55" stroke-width="2"/>')
    main.append(text(MARGIN + 40, y0 + 100, IMPACT_TOTAL, 56, C["a2"], C["display"], 700))
    main.append(text(MARGIN + 40, y0 + 132, "raised and spent last year", 19, C["soft"], C["sans"], 500))
    colx = MARGIN + 420
    for amt, label in IMPACT_COLS:
        main.append(text(colx, y0 + 92, amt, 36, C["ink"], C["display"], 700))
        w2, _ = wrap(colx, y0 + 124, label, 18, C["soft"], C["sans"], 26)
        main.append(w2)
        colx += 420
    main.append(text(MARGIN + 40, y0 + box_h - 20, IMPACT_NOTE, 18, C["soft"], C["sans"], 400, extra=' font-style="italic"'))

    # ---- our 2026 promise ----
    y1 = y0 + 28 + box_h + 90
    main.append(text(MARGIN, y1, "OUR 2026 PROMISE", 20, C["a2"], C["caps"], 700, spacing=2))
    w3, w3e = wrap(MARGIN, y1 + 34, "Every rupee we raise this year, after event costs, is split three ways — "
                   "announced up front, tracked on a public ledger anyone can check.", 24, C["soft"], C["sans"], 82, line_h=34)
    main.append(w3)
    py = w3e + 60
    colw = (W - 2 * MARGIN - 2 * 40) / 3
    cx = MARGIN
    for icn, pct, name, desc in PLEDGE:
        color = C["pledge_colors"][PLEDGE.index((icn, pct, name, desc)) % 3]
        main.append(f'<rect x="{cx}" y="{py}" width="{colw}" height="270" rx="16" fill="{C["card"]}" stroke="{color}" stroke-opacity=".6" stroke-width="2"/>')
        main.append(f'<circle cx="{cx+52}" cy="{py+58}" r="30" fill="none" stroke="{color}" stroke-width="2.2"/>')
        main.append(icon(icn, cx + 52, py + 58, 28, color, sw=1.8))
        main.append(text(cx + 100, py + 70, pct, 40, color, C["display"], 700))
        main.append(text(cx + 32, py + 125, name, 23, C["ink"], C["caps"], 700))
        w4, _ = wrap(cx + 32, py + 158, desc, 18, C["soft"], C["sans"], 33, line_h=26)
        main.append(w4)
        cx += colw + 40

    # ---- what your gift does ----
    y2 = py + 270 + 80
    main.append(text(MARGIN, y2, "WHAT YOUR GIFT DOES", 20, C["a2"], C["caps"], 700, spacing=2))
    gy = y2 + 45
    for icn, amt, desc in GIFTS:
        main.append(f'<circle cx="{MARGIN+28}" cy="{gy}" r="26" fill="{C["a1"]}" fill-opacity=".16" stroke="{C["a1"]}" stroke-width="1.8"/>')
        main.append(icon(icn, MARGIN + 28, gy, 26, C["a2"], sw=1.7))
        main.append(text(MARGIN + 72, gy - 6, amt, 28, C["ink"], C["display"], 700))
        w5, _ = wrap(MARGIN + 72, gy + 22, "gives " + desc, 19, C["soft"], C["sans"], 92)
        main.append(w5)
        gy += 82

    # ---- contact ----
    y3 = gy + 60
    main.append(f'<line x1="{MARGIN}" y1="{y3}" x2="{W-MARGIN}" y2="{y3}" stroke="{C["a1"]}" stroke-opacity=".45" stroke-width="2"/>')
    main.append(text(MARGIN, y3 + 40, "SPONSOR OR DONATE — TALK TO US", 19, C["a2"], C["caps"], 700, spacing=1.5))
    qr_size = 130
    for i, (name, wa) in enumerate([("Fredrica", FREDRICA_WA), ("Samuel", SAMUEL_WA)]):
        bx = MARGIN + i * 430
        main.append(icon("phone", bx + 20, y3 + 95, 22, C["a2"], sw=1.8))
        main.append(text(bx + 55, y3 + 92, name, 26, C["ink"], C["display"], 700))
        num = "+91 90259 43235" if name == "Fredrica" else "+91 89250 32672"
        main.append(text(bx + 55, y3 + 122, num, 20, C["soft"], C["sans"], 500))
        main.append(f'<rect x="{bx+330}" y="{y3+55}" width="{qr_size}" height="{qr_size}" fill="{C["qr_bg"]}" rx="6"/>')
        main.append(qr_svg(wa, bx + 330 + 6, y3 + 61, qr_size - 12, C["ink"]))
    body.append(layer("main-sheet", "".join(main)))

    # ---- perforation ----
    perf = []
    notch_r = 24
    for xn in (MARGIN, W - MARGIN):
        perf.append(f'<circle cx="{xn}" cy="{PERF_Y}" r="{notch_r}" fill="{C["page_behind"]}"/>')
    perf.append(f'<line x1="{MARGIN}" y1="{PERF_Y}" x2="{W-MARGIN}" y2="{PERF_Y}" stroke="{C["ink"]}" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="14 12"/>')
    perf.append(text(W / 2, PERF_Y - 16, "· · ·  tear along here once you decide  · · ·", 17, C["soft"], C["sans"], 500, anchor="middle", spacing=1))
    body.append(layer("perforation", "".join(perf)))

    # ---- stub ----
    stub = [f'<rect x="0" y="{PERF_Y}" width="{W}" height="{STUB_H}" fill="{C["stub_bg"]}"/>']
    stub.append(C["decorate_stub"](W, PERF_Y, STUB_H))
    sy0 = PERF_Y + 50
    stub.append(text(MARGIN, sy0 + 55, "TORN = I'M IN", 54, C["a2"], C["display"], 700))
    w6, _ = wrap(MARGIN, sy0 + 95, "Tear this strip off the moment you decide — to sponsor, to donate, or to help on the day. "
                 "Fill it in, photograph it, and WhatsApp it to Fredrica or Samuel above.", 24, C["stub_soft"], C["sans"], 90, line_h=32)
    stub.append(w6)
    fy = sy0 + 190
    for label in ["NAME", "I'M IN FOR   □ SPONSORING   □ DONATING   □ VOLUNTEERING"]:
        stub.append(text(MARGIN, fy, label, 15, C["stub_soft"], C["caps"], 700, spacing=1.2))
        if label == "NAME":
            stub.append(f'<line x1="{MARGIN+120}" y1="{fy}" x2="{MARGIN+680}" y2="{fy}" stroke="{C["a1"]}" stroke-opacity=".7" stroke-width="1.5"/>')
        fy += 55
    stub.append(icon(C["mark_icon"], W - MARGIN - 70, PERF_Y + STUB_H - 90, 36, C["a1"], sw=2))
    stub.append(text(W - MARGIN, PERF_Y + STUB_H - 45, "VIMUSEMENT 2026 · SPONSOR & DONOR TICKET", 15, C["stub_soft"], C["caps"], 700, anchor="end", spacing=1.2))
    body.append(layer("stub", "".join(stub)))

    fonts = {C["display"], C["caps"], C["sans"]}
    families = "|".join(sorted(fonts))
    imp = "https://fonts.googleapis.com/css2?" + "&amp;".join(
        f"family={f.replace(' ', '+')}:wght@400;500;600;700" for f in sorted(fonts)) + "&amp;display=swap"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <style>@import url('{imp}');text{{font-kerning:normal}}</style>
  {"".join(body)}
</svg>'''
    return svg


def deco_none(w, h):
    return ""


# ================= THEME 1 · FESTIVAL CARNIVAL =================
def carnival_top(w, h):
    out = []
    n = 22
    for i in range(n):
        x = i * w / (n - 1)
        col = "#C2213A" if i % 2 == 0 else "#F2A93B"
        out.append(f'<path d="M{x-24:.0f} 40 L{x:.0f} 92 L{x+24:.0f} 40 Z" fill="{col}" fill-opacity=".85"/>')
    out.append(f'<line x1="0" y1="40" x2="{w}" y2="40" stroke="#7A5C3A" stroke-width="3"/>')
    return "".join(out)


def carnival_stub(w, perf_y, stub_h):
    y = perf_y + stub_h - 70
    out = []
    shapes = [("tent", 60), ("wheel", 100), ("tent", 60)]
    x = 1500
    for icn, r in shapes:
        out.append(icon(icn, x, y, r, "#C2213A", sw=2))
        x += 130
    return "".join(out)


CARNIVAL = dict(
    key="1-festival-carnival", bg="#FFF7E8", ink="#2B1B12", soft="#5C4A3A",
    a1="#F2A93B", a2="#C2213A", card="#FFFFFF", stub_bg="#FFEFD2", qr_bg="#FFFFFF",
    page_behind="#FFF7E8", pledge_colors=["#C2213A", "#1D8A8A", "#8A4FC2"],
    display="Baloo 2", caps="Poppins", sans="Nunito", hspace=2, mark_icon="wheel",
    eyebrow="GIVE · SPONSOR · BE PART OF IT",
    decorate_top=carnival_top, decorate_stub=carnival_stub,
)

# ================= THEME 2 · SUNRISE WARMTH =================
def sunrise_top(w, h):
    cx, cy = w - 260, 260
    out = [f'<circle cx="{cx}" cy="{cy}" r="150" fill="#FFB25B" fill-opacity=".25"/>']
    for i in range(12):
        import math
        a = i * math.pi / 6
        x1, y1 = cx + 160 * math.cos(a), cy + 160 * math.sin(a)
        x2, y2 = cx + 210 * math.cos(a), cy + 210 * math.sin(a)
        out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#FF7A59" stroke-width="6" stroke-linecap="round" stroke-opacity=".5"/>')
    return "".join(out)


def sunrise_stub(w, perf_y, stub_h):
    return icon("heart", w - 300, perf_y + stub_h / 2, 90, "#FF7A59", sw=1.6, fill="#FF7A5922")


SUNRISE = dict(
    key="2-sunrise-warmth", bg="#FFF3E9", ink="#3A2A22", soft="#7A5C4E",
    a1="#FFB25B", a2="#FF7A59", card="#FFFFFF", stub_bg="#FFE7D6", qr_bg="#FFFFFF",
    page_behind="#FFF3E9", pledge_colors=["#FF7A59", "#5FB3A3", "#B385D6"],
    display="Fredoka", caps="Poppins", sans="Quicksand", hspace=1, mark_icon="sun",
    eyebrow="GIVE · SPONSOR · BE PART OF IT",
    decorate_top=sunrise_top, decorate_stub=sunrise_stub,
)

# ================= THEME 3 · BOLD POP POSTER =================
def boldpop_top(w, h):
    return (f'<rect x="0" y="0" width="{w}" height="14" fill="#FF3E7F"/>'
            f'<rect x="0" y="14" width="{w}" height="10" fill="#FFD400"/>'
            f'<rect x="0" y="24" width="{w}" height="8" fill="#00C2A8"/>')


def boldpop_stub(w, perf_y, stub_h):
    return f'<rect x="{w-360}" y="{perf_y+40}" width="260" height="{stub_h*0.5:.0f}" fill="#FFD400"/>'


BOLDPOP = dict(
    key="3-bold-pop-poster", bg="#FFFFFF", ink="#1A1A2E", soft="#4A4A5E",
    a1="#FF8A00", a2="#FF3E7F", card="#FFF7EE", stub_bg="#1A1A2E", qr_bg="#FFFFFF",
    page_behind="#FFFFFF", pledge_colors=["#FF3E7F", "#00C2A8", "#FF8A00"],
    display="Anton", caps="Poppins", sans="Inter", hspace=3, mark_icon="wheel",
    eyebrow="GIVE · SPONSOR · BE PART OF IT",
    stub_ink="#FFFFFF", stub_soft="#C9C9DA",
    decorate_top=boldpop_top, decorate_stub=boldpop_stub,
)

# ================= THEME 4 · COMMUNITY POSTCARD =================
def postcard_top(w, h):
    sy = 260
    out = [f'<rect x="{w-380}" y="{sy}" width="260" height="180" fill="none" stroke="#3B2E22" stroke-width="3" stroke-dasharray="10 6"/>']
    out.append(icon("stamp_seal", w - 250, sy + 90, 70, "#C1602E", sw=2))
    out.append(text(w - 250, sy + 150, "VIMUSEMENT", 16, "#C1602E", "Poppins", 700, anchor="middle", spacing=1))
    return "".join(out)


def postcard_stub(w, perf_y, stub_h):
    return text(w / 2, perf_y + stub_h - 40, "with love, Victorians Youth", 26, "#C1602E", "Caveat", 600, anchor="middle")


POSTCARD = dict(
    key="4-community-postcard", bg="#F4E9D8", ink="#3B2E22", soft="#6B5847",
    a1="#2F6F6B", a2="#C1602E", card="#FBF3E6", stub_bg="#EADDC4", qr_bg="#FBF3E6",
    page_behind="#F4E9D8", pledge_colors=["#C1602E", "#2F6F6B", "#8C7A2E"],
    display="Playfair Display", caps="Poppins", sans="Lora", hspace=1, mark_icon="heart",
    eyebrow="GIVE · SPONSOR · BE PART OF IT",
    decorate_top=postcard_top, decorate_stub=postcard_stub,
)

THEMES = [CARNIVAL, SUNRISE, BOLDPOP, POSTCARD]

if __name__ == "__main__":
    os.makedirs(OUTDIR, exist_ok=True)
    for th in THEMES:
        svg = build(th)
        out = os.path.join(OUTDIR, th["key"] + "-A4.svg")
        with open(out, "w", encoding="utf-8") as f:
            f.write(svg)
        print("wrote", out)
