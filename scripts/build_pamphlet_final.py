"""Vimusement 2026 · the donation pamphlet (Bold Pop theme) — one A4
sheet, single continuous page, as an editable SVG.

  python scripts/build_pamphlet_final.py

Output: design/donation-pamphlet/final-bold-pop-A4.svg

One page, one job: get someone from "reading this" to "paid" in under
a minute, with nothing to fill in, tear off, or hand back.
  headline -> what last year's money did (three figures, equal weight)
  -> the 40 · 30 · 30 promise -> three trust points -> one big call to
  action: a QR straight to the Donate page, branded with the V mark so
  it reads as ours at a glance, with an impact ladder underneath it
  (amount -> what it buys) as a reading reference, not a form.

There used to be a tear-off pledge card below this — cut it. It asked
the reader to do the work (write, tear, hand over, and someone has to
collect and enter it later) that the QR already does in one scan.

Every rupee figure and percentage on the sheet uses the same number
style (Anton), so they all read as one family.
"""
import base64, html, os
import qrcode

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "design", "donation-pamphlet", "final-bold-pop-A4.svg")

W, H = 2100, 2970
M = 90
CW = W - 2 * M

INK, SOFT, MUTE, LINE = "#1A1A2E", "#4A4A5E", "#8A8AA0", "#D9D9E3"
PINK, ORANGE, TEAL, YELLOW = "#FF3E7F", "#FF8A00", "#00C2A8", "#FFD400"
BG, CARD = "#FFFFFF", "#FBF9F6"
DISPLAY, CAPS, SANS = "Anton", "Poppins", "Inter"

DONATE_URL = "https://victoriansyouth.github.io/Vimusement2k26/donate.html"
PEOPLE = [("Fredrica", "+91 90259 43235"), ("Samuel", "+91 89250 32672")]

esc = lambda s: html.escape(s, quote=True)


def text(x, y, s, size, fill, family=SANS, weight=400, anchor="start", spacing=0, extra=""):
    fam = f'&quot;{family}&quot;, sans-serif'
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
            + (f' letter-spacing="{spacing}"' if spacing else "") + extra + f'>{esc(s)}</text>')


def num(x, y, s, size, fill=INK, anchor="start"):
    """every rupee figure and percentage goes through here: one number style"""
    return text(x, y, s, size, fill, DISPLAY, 400, anchor, spacing=1)


def label(x, y, s, fill=PINK, size=20, anchor="start"):
    return text(x, y, s, size, fill, CAPS, 700, anchor, spacing=2)


def wrap(x, y, s, size, fill, max_chars, family=SANS, weight=400, line_h=None):
    words, lines, cur = s.split(" "), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) > max_chars and cur:
            lines.append(cur); cur = w
        else:
            cur = t
    if cur: lines.append(cur)
    lh = line_h or size * 1.5
    return "".join(text(x, y + i * lh, ln, size, fill, family, weight) for i, ln in enumerate(lines)), y + (len(lines) - 1) * lh


def layer(name, body):
    return f'<g id="{name}" inkscape:groupmode="layer" inkscape:label="{esc(name)}">{body}</g>'


ICON = {
    "cap": '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>',
    "heart": '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7"/>',
    "phone": '<path d="M6 3h4l1.5 5-2.5 2a12 12 0 0 0 6 6l2-2.5 5 1.5v4a2 2 0 0 1-2 2C10.6 21 3 13.4 3 5a2 2 0 0 1 2-2Z"/>',
}


def icon(key, cx, cy, size, stroke, sw=1.8):
    s = size / 24
    return (f'<g transform="translate({cx - size / 2:.1f} {cy - size / 2:.1f}) scale({s:.3f})" fill="none" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICON[key]}</g>')


def image(path, x, y, h):
    from PIL import Image
    full = os.path.join(REPO, path)
    iw, ih = Image.open(full).size
    w = h * iw / ih
    data = base64.b64encode(open(full, "rb").read()).decode()
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="data:image/png;base64,{data}"/>', w


def qr_svg(data, x, y, size, dark, logo_path=None, logo_frac=0.24):
    """A QR with, optionally, a brand mark sitting in the middle —
    ERROR_CORRECT_H tolerates the centre being covered, so it still
    scans fine. Makes the code read as "ours" before anyone even
    scans it, instead of a generic black-and-white square."""
    ec = qrcode.constants.ERROR_CORRECT_H if logo_path else qrcode.constants.ERROR_CORRECT_M
    qr = qrcode.QRCode(border=1, box_size=1, error_correction=ec)
    qr.add_data(data); qr.make(fit=True)
    m = qr.get_matrix(); cell = size / len(m)
    out = "".join(f'<rect x="{x + c*cell:.2f}" y="{y + r*cell:.2f}" width="{cell*1.02:.2f}" height="{cell*1.02:.2f}" fill="{dark}"/>'
                  for r, row in enumerate(m) for c, on in enumerate(row) if on)
    if logo_path:
        ls = size * logo_frac
        lx, ly = x + size / 2 - ls / 2, y + size / 2 - ls / 2
        pad = ls * 0.2
        out += f'<rect x="{lx - pad:.1f}" y="{ly - pad:.1f}" width="{ls + 2*pad:.1f}" height="{ls + 2*pad:.1f}" rx="14" fill="#FFFFFF"/>'
        img_tag, _ = image(logo_path, lx, ly, ls)
        out += img_tag
    return out


# ======================= SECTIONS =======================
# Each section is a function of its top y that returns (svg pieces, height).
# The page is laid out in two passes: measure every section, then share
# whatever height is left over equally between them, so the sheet is
# always filled edge to edge with no dead band anywhere.

def sec_headline(y):
    o = [num(M, y + 120, "Last year, ₹94,300.", 124, INK),
         num(M, y + 250, "This year, more.", 124, PINK)]
    s, se = wrap(M, y + 330, "All of it came from one day of games and food on the church grounds. "
                 "Come on 25 October, bring your family, and help us beat it.", 30, SOFT, 80, line_h=44)
    o.append(s)
    return o, se - y + 14


def sec_stats(y):
    o = [label(M, y + 22, "LAST YEAR, YOU MADE THIS HAPPEN")]
    stats = [(PINK, "₹34,300", "education for four students, two from single-parent families"),
             (TEAL, "₹60,000", "two medical cases: a heart operation and an emergency")]
    g = 60
    sw = (CW - g) / 2
    end = y
    for i, (c, n, t) in enumerate(stats):
        x = M + i * (sw + g)
        o.append(f'<rect x="{x}" y="{y + 52}" width="{sw}" height="10" fill="{c}"/>')
        o.append(num(x, y + 192, n, 124))
        w_, we = wrap(x, y + 246, t, 27, SOFT, 50, line_h=38)
        o.append(w_)
        end = max(end, we)
    return o, end - y + 12


PLEDGE = [(PINK, "cap", "40%", "Education", "School fees, books and exam costs for students who need support."),
          (TEAL, "heart", "30%", "Medical Care & Needs", "Hospital bills and essentials for families going through a hard stretch."),
          (ORANGE, "shield", "30%", "Emergency Fund", "Held in reserve and released the moment it's needed most.")]


def sec_promise(y):
    o = [label(M, y + 22, "OUR 2026 PROMISE"),
         text(M, y + 70, "Everything raised, after event costs, is split three ways, as announced before the fair.", 28, SOFT)]
    g = 40
    sw = (CW - 2 * g) / 3
    py, h = y + 112, 290
    for i, (c, ic, pct, name, desc) in enumerate(PLEDGE):
        x = M + i * (sw + g)
        o.append(f'<rect x="{x}" y="{py}" width="{sw}" height="{h}" rx="16" fill="{CARD}" stroke="{c}" stroke-width="2.5"/>')
        o.append(f'<path d="M{x} {py+16} a16 16 0 0 1 16 -16 h{sw-32} a16 16 0 0 1 16 16 v-6 h-{sw} z" fill="{c}"/>')
        o.append(num(x + 32, py + 108, pct, 80, c))
        o.append(f'<circle cx="{x + sw - 84}" cy="{py + 92}" r="60" fill="{c}"/>')
        o.append(icon(ic, x + sw - 84, py + 92, 68, "#FFFFFF", 1.9))
        o.append(text(x + 32, py + 170, name, 27, INK, CAPS, 700))
        d_, _ = wrap(x + 32, py + 212, desc, 21, SOFT, 42, line_h=30)
        o.append(d_)
    return o, 112 + h


def sec_trust(y):
    trust = ["No fees. You pay the parish directly by UPI.",
             "Every rupee in and out is recorded on a public ledger.",
             "Your amount is never shown. Only your name, if you like."]
    g = 40
    sw = (CW - 2 * g) / 3
    o = []
    for i, t in enumerate(trust):
        x = M + i * (sw + g)
        o.append(f'<circle cx="{x + 40}" cy="{y + 40}" r="40" fill="{TEAL}"/>')
        o.append(icon("check", x + 40, y + 40, 48, "#FFFFFF", 2.6))
        t_, _ = wrap(x + 102, y + 34, t, 23, INK, 34, weight=600, line_h=32)
        o.append(t_)
    return o, 90


LADDER = [("₹250", "a week of groceries"),
          ("₹500", "exam fees & textbooks"),
          ("₹1,000", "a term's school fees"),
          ("₹5,000", "eases a hospital bill"),
          ("₹10,000", "emergency help, on the spot")]


def sec_cta(y):
    """the one ask, and the only QR on the sheet"""
    c = []
    lx = M + 64
    c.append(label(lx, y + 88, "GIVE IN UNDER A MINUTE", YELLOW, 22))
    c.append(text(lx, y + 196, "Scan. Pay by UPI.", 100, "#FFFFFF", DISPLAY, 400))
    c.append(text(lx, y + 306, "Done.", 100, YELLOW, DISPLAY, 400))
    t_, te = wrap(lx, y + 372, "No app to install. No form to fill in. Your bank app already does the rest.",
                  27, "#C9C9DA", 42, line_h=38)
    c.append(t_)
    sy = te + 70
    c.append(label(lx, sy, "TO SPONSOR AS A BUSINESS, TALK TO", "#C9C9DA", 17))
    for i, (who, ph) in enumerate(PEOPLE):
        x = lx + i * 480
        c.append(icon("phone", x + 20, sy + 46, 42, YELLOW))
        c.append(text(x + 60, sy + 56, who, 26, "#FFFFFF", SANS, 700))
        c.append(num(x + 60 + len(who) * 16 + 18, sy + 56, ph, 28, "#FFFFFF"))

    qs = 540
    qx, qy = W - M - 64 - qs, y + 64
    c.append(f'<rect x="{qx - 22}" y="{qy - 22}" width="{qs + 44}" height="{qs + 44}" rx="20" fill="#FFFFFF"/>')
    c.append(qr_svg(DONATE_URL, qx, qy, qs, INK, logo_path="assets/img/shared/victorians-mark.png"))
    c.append(label(qx + qs / 2, qy + qs + 70, "SCAN TO DONATE", YELLOW, 22, "middle"))

    # amount -> what it buys, as something to read, not fill in
    ly = max(sy + 110, qy + qs + 120)
    c.append(f'<line x1="{lx}" y1="{ly}" x2="{W - M - 64}" y2="{ly}" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="2"/>')
    c.append(label(lx, ly + 62, "WHAT YOUR AMOUNT DOES", "#C9C9DA", 17))
    lw_ = (CW - 128) / len(LADDER)
    end = ly
    for i, (a, d) in enumerate(LADDER):
        x = lx + i * lw_
        if i:
            c.append(f'<line x1="{x - 22}" y1="{ly + 96}" x2="{x - 22}" y2="{ly + 206}" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="2"/>')
        c.append(num(x, ly + 146, a, 54, YELLOW))
        d_, de = wrap(x, ly + 188, d, 21, "#C9C9DA", 20, line_h=28)
        c.append(d_)
        end = max(end, de)
    h = end - y + 64
    return [f'<rect x="{M}" y="{y}" width="{CW}" height="{h}" rx="24" fill="{INK}"/>'] + c, h


# ======================= LAYOUT =======================
TOP, BOTTOM = 222, H - 130          # below the header rule / above the footer line
sections = [sec_headline, sec_stats, sec_promise, sec_trust, sec_cta]
heights = [f(0)[1] for f in sections]
gap = max(40, (BOTTOM - TOP - sum(heights)) / len(sections))

body = []
body.append(layer("cut-guide", f'<rect x="1" y="1" width="{W-2}" height="{H-2}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1" stroke-dasharray="6 6"/>'))

m = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>',
     f'<rect x="0" y="0" width="{W}" height="14" fill="{PINK}"/>',
     f'<rect x="0" y="14" width="{W}" height="10" fill="{YELLOW}"/>',
     f'<rect x="0" y="24" width="{W}" height="8" fill="{TEAL}"/>']

# header: the real V mark, wordmark, what + when
logo, lw = image("assets/img/shared/victorians-mark.png", M, 72, 104)
m.append(logo)
hx = M + lw + 30
m.append(text(hx, 132, "VIMUSEMENT 2026", 50, INK, DISPLAY, 400, spacing=3))
m.append(text(hx, 170, "Victorians Youth · Ascension Church, Aminjikkarai", 20, SOFT, SANS, 500))
m.append(label(W - M, 132, "GIVE · SPONSOR · BE PART OF IT", PINK, 22, "end"))
m.append(text(W - M, 170, "Sunday 25 October 2026", 20, SOFT, SANS, 600, "end"))
m.append(f'<line x1="{M}" y1="{TOP}" x2="{W-M}" y2="{TOP}" stroke="{INK}" stroke-opacity=".12" stroke-width="2"/>')

y = TOP
for f in sections:
    y += gap
    o, h = f(y)
    m.extend(o)
    y += h

body.append(layer("case-for-giving", "".join(m)))
body.append(layer("footer", text(W / 2, H - 60, "Thank you. Every rupee after event costs goes to the cause.",
                                  22, MUTE, SANS, 500, "middle", extra=' font-style="italic"')))

fam_q = "&amp;".join(("family=Anton", "family=Poppins:wght@400;500;600;700", "family=Inter:wght@400;500;600;700"))
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <style>@import url('https://fonts.googleapis.com/css2?{fam_q}&amp;display=swap');text{{font-kerning:normal}}</style>
  {"".join(body)}
</svg>'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(svg)
print("wrote", OUT)
