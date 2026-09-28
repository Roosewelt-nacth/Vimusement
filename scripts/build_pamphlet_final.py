"""Vimusement 2026 · the sponsor/donation pamphlet (Bold Pop theme) —
one A4 sheet, front side, as an editable SVG.

  python scripts/build_pamphlet_final.py

Output: design/donation-pamphlet/final-bold-pop-A4.svg

Top two-thirds: the case for giving.
  headline -> what last year's money did (three figures, equal weight)
  -> the 40 · 30 · 30 promise -> three trust points -> one call to action
  (a QR straight to the Donate page).
Bottom third, below a tear line: a pledge card on a light background (so
it can be written on in pen). Name, phone, what they'd like to do, and an
amount, where every amount says what it buys. Filled in and handed to a
volunteer, or photographed and sent on WhatsApp.

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
STUB_H = 950
PERF_Y = H - STUB_H

INK, SOFT, MUTE, LINE = "#1A1A2E", "#4A4A5E", "#8A8AA0", "#D9D9E3"
PINK, ORANGE, TEAL, YELLOW = "#FF3E7F", "#FF8A00", "#00C2A8", "#FFD400"
BG, CARD, STUB_BG = "#FFFFFF", "#FBF9F6", "#FFF9EF"
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


def qr_svg(data, x, y, size, dark):
    qr = qrcode.QRCode(border=1, box_size=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(data); qr.make(fit=True)
    m = qr.get_matrix(); cell = size / len(m)
    return "".join(f'<rect x="{x + c*cell:.2f}" y="{y + r*cell:.2f}" width="{cell*1.02:.2f}" height="{cell*1.02:.2f}" fill="{dark}"/>'
                   for r, row in enumerate(m) for c, on in enumerate(row) if on)


def box(x, y, size=26, color=INK):
    return f'<rect x="{x}" y="{y - size + 4}" width="{size}" height="{size}" rx="5" fill="#FFFFFF" stroke="{color}" stroke-width="2.4"/>'


def field(x, y, lab, x2):
    return label(x, y, lab, MUTE, 16) + f'<line x1="{x + 110}" y1="{y + 4}" x2="{x2}" y2="{y + 4}" stroke="{INK}" stroke-opacity=".45" stroke-width="2"/>'


body = []
body.append(layer("cut-guide", f'<rect x="1" y="1" width="{W-2}" height="{H-2}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1" stroke-dasharray="6 6"/>'))

# ======================= THE CASE FOR GIVING =======================
m = [f'<rect x="0" y="0" width="{W}" height="{PERF_Y}" fill="{BG}"/>',
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
m.append(f'<line x1="{M}" y1="222" x2="{W-M}" y2="222" stroke="{INK}" stroke-opacity=".12" stroke-width="2"/>')

# headline + the one true story that makes it real
m.append(text(M, 340, "Your rupee can change", 92, INK, DISPLAY, 400))
m.append(text(M, 438, "someone's year.", 92, PINK, DISPLAY, 400))
s1, s1e = wrap(M, 510, "Last year, what this parish gave kept students in school and helped pay for a heart "
               "operation. This year, one day of games, food and films can do it again.", 27, SOFT, 88, line_h=40)
m.append(s1)

# last year: three figures, equal weight, same style
y = s1e + 84
m.append(label(M, y, "LAST YEAR, YOU MADE THIS HAPPEN"))
stats = [(PINK, "₹94,300", "raised and given out, every rupee accounted for"),
         (TEAL, "₹34,300", "school fees and exam costs for students"),
         (ORANGE, "₹60,000", "medical bills, including a heart operation")]
gap = 40
sw_ = (CW - 2 * gap) / 3
for i, (c, n, t) in enumerate(stats):
    x = M + i * (sw_ + gap)
    m.append(f'<rect x="{x}" y="{y + 30}" width="{sw_}" height="8" fill="{c}"/>')
    m.append(num(x, y + 128, n, 80))
    w_, _ = wrap(x, y + 172, t, 21, SOFT, 40, line_h=30)
    m.append(w_)

# the 2026 promise
y = y + 268
m.append(label(M, y, "OUR 2026 PROMISE"))
m.append(text(M, y + 40, "Everything raised, after event costs, is split three ways, as announced before the fair.", 25, SOFT))
py = y + 80
pledge = [(PINK, "cap", "40%", "Education", "School fees, books and exam costs for children who'd otherwise drop out."),
          (TEAL, "heart", "30%", "Medical Care & Needs", "Hospital bills and essentials for families going through a hard stretch."),
          (ORANGE, "shield", "30%", "Emergency Fund", "Held in reserve and released the moment it's needed most.")]
for i, (c, ic, pct, name, desc) in enumerate(pledge):
    x = M + i * (sw_ + gap)
    m.append(f'<rect x="{x}" y="{py}" width="{sw_}" height="236" rx="16" fill="{CARD}" stroke="{c}" stroke-width="2.5"/>')
    m.append(f'<path d="M{x} {py+16} a16 16 0 0 1 16 -16 h{sw_-32} a16 16 0 0 1 16 16 v-6 h-{sw_} z" fill="{c}"/>')
    m.append(num(x + 30, py + 92, pct, 64, c))
    m.append(f'<circle cx="{x + sw_ - 78}" cy="{py + 82}" r="54" fill="{c}"/>')
    m.append(icon(ic, x + sw_ - 78, py + 82, 62, "#FFFFFF", 1.9))
    m.append(text(x + 30, py + 140, name, 24, INK, CAPS, 700))
    d_, _ = wrap(x + 30, py + 176, desc, 19, SOFT, 44, line_h=27)
    m.append(d_)

# three trust points
ty = py + 236 + 78
trust = ["No fees. You pay the parish directly by UPI.",
         "Every rupee in and out is recorded on a public ledger.",
         "Your amount is never shown. Only your name, if you like."]
for i, t in enumerate(trust):
    x = M + i * (sw_ + gap)
    m.append(f'<circle cx="{x + 38}" cy="{ty - 8}" r="38" fill="{TEAL}"/>')
    m.append(icon("check", x + 38, ty - 8, 46, "#FFFFFF", 2.6))
    t_, _ = wrap(x + 96, ty, t, 21, INK, 38, weight=600, line_h=30)
    m.append(t_)

# one call to action
cy = ty + 88
ch = 500
m.append(f'<rect x="{M}" y="{cy}" width="{CW}" height="{ch}" rx="22" fill="{INK}"/>')
m.append(label(M + 60, cy + 72, "GIVE IN UNDER A MINUTE", YELLOW, 20))
m.append(text(M + 60, cy + 158, "Scan. Pay by UPI.", 76, "#FFFFFF", DISPLAY, 400))
m.append(text(M + 60, cy + 240, "Done.", 76, YELLOW, DISPLAY, 400))
t_, t_e = wrap(M + 60, cy + 298, "No app to install. No fees. Prefer to give on paper? Fill in the pledge card below "
               "and hand it to any Victorians Youth volunteer.", 22, "#C9C9DA", 64, line_h=32)
m.append(t_)
py2 = t_e + 66
m.append(label(M + 60, py2, "TO SPONSOR, TALK TO", "#C9C9DA", 16))
for i, (who, ph) in enumerate(PEOPLE):
    x = M + 60 + i * 470
    m.append(icon("phone", x + 20, py2 + 42, 40, YELLOW))
    m.append(text(x + 58, py2 + 52, who + "  " + ph, 24, "#FFFFFF", SANS, 600))

qs = 360
qx, qy = W - M - 60 - qs, cy + 50
m.append(f'<rect x="{qx - 18}" y="{qy - 18}" width="{qs + 36}" height="{qs + 36}" rx="16" fill="#FFFFFF"/>')
m.append(qr_svg(DONATE_URL, qx, qy, qs, INK))
m.append(label(qx + qs / 2, qy + qs + 58, "SCAN TO DONATE", YELLOW, 18, "middle"))

body.append(layer("case-for-giving", "".join(m)))

# ======================= TEAR LINE =======================
p = []
for xn in (M, W - M):
    p.append(f'<circle cx="{xn}" cy="{PERF_Y}" r="22" fill="{BG}" stroke="{INK}" stroke-opacity=".25" stroke-width="2"/>')
p.append(f'<line x1="{M + 30}" y1="{PERF_Y}" x2="{W - M - 30}" y2="{PERF_Y}" stroke="{INK}" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="14 12"/>')
p.append(text(W / 2, PERF_Y - 22, "TEAR HERE, FILL IN, HAND TO A VOLUNTEER", 16, MUTE, CAPS, 700, "middle", 2))
body.append(layer("tear-line", "".join(p)))

# ======================= THE PLEDGE CARD =======================
s = [f'<rect x="0" y="{PERF_Y}" width="{W}" height="{STUB_H}" fill="{STUB_BG}"/>',
     f'<rect x="0" y="{PERF_Y}" width="{W}" height="10" fill="{PINK}"/>']
sy = PERF_Y + 60
lockup, lw2 = image("assets/img/shared/victorians.png", M, sy, 150)
s.append(lockup)
tx = M + lw2 + 44
s.append(text(tx, sy + 64, "I'M IN.", 70, INK, DISPLAY, 400))
s.append(label(tx + 250, sy + 60, "VIMUSEMENT 2026 · PLEDGE CARD", PINK, 18))
w_, _ = wrap(tx, sy + 112, "Fill this in and hand it to any Victorians Youth volunteer, or send a photo of it "
             "to Fredrica or Samuel on WhatsApp. We'll follow up within a day.", 23, SOFT, 92, line_h=33)
s.append(w_)

fy = sy + 235
s.append(field(M, fy, "NAME", M + 900))
s.append(field(M + 1000, fy, "PHONE", W - M))

cy2 = fy + 88
colB = M + 760
s.append(label(M, cy2, "I'D LIKE TO", TEAL, 18))
s.append(label(colB, cy2, "AMOUNT AND WHAT IT DOES", TEAL, 18))
ways = ["Donate", "Sponsor the fair", "Give my time on the day", "Give products or prizes"]
for i, w in enumerate(ways):
    yy = cy2 + 62 + i * 64
    s.append(box(M, yy))
    s.append(text(M + 44, yy, w, 23, INK, SANS, 600))
amounts = [("₹250", "a week of groceries for a family"),
           ("₹500", "exam fees and textbooks for a student"),
           ("₹1,000", "a term's school fees for a child"),
           ("₹5,000", "help ease the burden of a hospital bill"),
           ("₹10,000", "emergency help when it's needed most")]
for i, (a, d) in enumerate(amounts):
    yy = cy2 + 62 + i * 64
    s.append(box(colB, yy))
    s.append(num(colB + 44, yy + 2, a, 34))
    s.append(text(colB + 210, yy, d, 21, SOFT))
yy = cy2 + 62 + len(amounts) * 64
s.append(box(colB, yy))
s.append(text(colB + 44, yy, "Other", 23, INK, SANS, 600))
s.append(num(colB + 130, yy + 2, "₹", 34))
s.append(f'<line x1="{colB + 158}" y1="{yy + 4}" x2="{colB + 520}" y2="{yy + 4}" stroke="{INK}" stroke-opacity=".45" stroke-width="2"/>')

vy = yy + 84
s.append(f'<line x1="{M}" y1="{vy - 42}" x2="{W - M}" y2="{vy - 42}" stroke="{INK}" stroke-opacity=".18" stroke-width="2" stroke-dasharray="6 8"/>')
s.append(label(M, vy, "FOR VOLUNTEER USE", MUTE, 15))
s.append(field(M + 320, vy, "TAKEN BY", M + 900))
s.append(field(M + 980, vy, "DATE", M + 1380))
s.append(box(M + 1460, vy)); s.append(text(M + 1500, vy, "UPI", 20, INK, SANS, 600))
s.append(box(M + 1600, vy)); s.append(text(M + 1640, vy, "Cash", 20, INK, SANS, 600))
s.append(text(W / 2, H - 50, "Thank you. Every rupee after event costs goes to the cause.", 20, MUTE, SANS, 500, "middle",
              extra=' font-style="italic"'))
body.append(layer("pledge-card", "".join(s)))

fam_q = "&amp;".join(("family=Anton", "family=Poppins:wght@400;500;600;700", "family=Inter:wght@400;500;600;700"))
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <style>@import url('https://fonts.googleapis.com/css2?{fam_q}&amp;display=swap');text{{font-kerning:normal}}</style>
  {"".join(body)}
</svg>'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(svg)
print("wrote", OUT)
