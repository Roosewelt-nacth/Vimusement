"""
Build the link-preview ("Open Graph") cards, one per page.

  python scripts/build_og_cards.py

Writes assets/img/og/<page>.svg, the editable design for each card
(1200x630, Doomsday palette). Social apps (WhatsApp, Instagram,
Facebook, X) don't accept SVG in link previews, so each page's og:image
points at a JPG exported from these SVGs (assets/img/og/<page>.jpg).
Re-export after editing: open scripts/og-export.html through a local
server (see its header) and it saves the JPGs next to the SVGs.

The same PAGES table also rewrites each page's <head> share tags
(og:* and twitter:*) so the title, text and image match the card.
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "og")
BASE = "https://roosewelt-nacth.github.io/Vimusement/"

# page, eyebrow, title lines, subtitle lines, art, share title, share description
PAGES = [
    ("index", "Annual parish fundraiser", ["Vimusement 2026"],
     ["Games, food stalls, five films and a", "grand lucky draw, all for a cause."], "mark",
     "Vimusement 2026",
     "A day of games, food stalls, movie screenings and a grand lucky draw at Ascension Church, Aminjikkarai, raising scholarships and medical-emergency help. 25 October 2026."),
    ("programme", "The day", ["Programme", "and map"],
     ["What's on, when, and where", "everything is on the grounds."], "pin",
     "Programme and map · Vimusement 2026",
     "What's on at Vimusement: games, the movie line-up, and a plan of the church grounds so you know where everything is."),
    ("movies", "Movies", ["Five films.", "One big screen."],
     ["Zootopia 2 · Brand New Day · Obsession", "Sheep Detectives · Fall 2: Deadpoint"], "posters",
     "Movies · Vimusement 2026",
     "Five films on the big screen in the AV room at Ascension Church on 25 October: Zootopia 2, Brand New Day, Obsession, Sheep Detectives and Fall 2: Deadpoint."),
    ("draw", "Lucky draw", ["A ₹50 ticket.", "A sofa worth ₹12,000."],
     ["Four branded prizes worth ₹28,000,", "plus two surprises. Tickets at the church."], "sofa",
     "Lucky Draw · Vimusement 2026",
     "Win a three-seater sofa worth ₹12,000, an air fryer, a mixer, a cooker, or one of two surprise prizes. All branded. ₹50 tickets at the counter in Ascension Church, drawn live on 25 October."),
    ("donate", "Donate", ["Give to", "the cause"],
     ["Pay the parish directly by UPI.", "Zero fees, every rupee counts."], "heart",
     "Donate · Vimusement 2026",
     "Give any amount to Vimusement. 100% of what's raised after costs goes to scholarships, medical emergencies and hardship support."),
    ("cause", "The cause", ["Where the", "money goes"],
     ["₹94,300 given last year to school", "fees and medical emergencies."], "cap",
     "The Cause · Vimusement 2026",
     "Where Vimusement's money goes: scholarships, a medical-emergency fund, and hardship support for neighbours in need, decided by the parish committee."),
    ("gallery", "Gallery", ["Past years"],
     ["Reels and memories from", "Vimusement 2022 to 2025."], "photos",
     "Gallery · Vimusement 2026",
     "Recap reels from past Vimusement fairs, and the Victorians Youth crew who make it happen."),
    ("involve", "Get involved", ["Lend a hand"],
     ["Volunteer a few hours, sponsor", "the fair, or run a stall."], "people",
     "Get Involved · Vimusement 2026",
     "Volunteer a few hours, sponsor the fair, or run a stall at Vimusement, the parish fundraiser at Ascension Church, Aminjikkarai."),
    ("sponsors", "Sponsorship", ["Back Vimusement"],
     ["Community, product and prize partners.", "Your brand, in front of the parish."], "star",
     "Sponsorship · Vimusement 2026",
     "Partner with Vimusement as a community, product or prize partner, and put your brand in front of families from all around Aminjikkarai."),
    ("stalls", "Run a stall", ["Bring a stall", "to Vimusement"],
     ["Food from ₹6,000 · Craft from ₹5,500.", "Benches, lights and power included."], "stall",
     "Run a Stall · Vimusement 2026",
     "Bring a food or craft stall to Vimusement. Food and beverages from ₹6,000, craft and promotional from ₹5,500, with benches, lights and power included."),
    ("tickets", "Look it up", ["Find it", "by phone"],
     ["Lost the text? Look up your", "donation any time."], "ticket",
     "Find it by phone · Vimusement 2026",
     "Look up your Vimusement donation by phone number, any time."),
    ("credits", "Credits", ["Who built this"],
     ["The person behind the", "Vimusement 2026 website."], "code",
     "Credits · Vimusement 2026",
     "Whoever built this thing. A dossier."),
    ("reel", "Video", ["Watch the reel"],
     ["Games, food, movies and the cause,", "in under 30 seconds."], "play",
     "Video · Vimusement 2026",
     "A short animated video about Vimusement 2026: games, food, movies and the cause, in under 30 seconds."),
    # staff / hidden pages: tidy if shared, and they say nothing about how to log in
    ("counter", "For volunteers", ["Staff desk"],
     ["Cash donations, UPI confirmations", "and the AV room door."], "desk",
     "Staff desk · Vimusement 2026",
     "The Vimusement counter for parish volunteers on duty."),
    ("stage", "Lucky draw", ["Drawn live", "on stage"],
     ["Winners are called on the night,", "right after evening mass."], "star",
     "Lucky Draw · Vimusement 2026",
     "The Vimusement lucky draw is drawn live on stage on 25 October, right after evening mass."),
    ("developers", "Developers", ["How this", "site was built"],
     ["The stack, the approach, and", "who put it together."], "code",
     "Developers · Vimusement 2026",
     "How the Vimusement website was built: the stack, the approach, and who put it together."),
    ("docs/banner-reveal", "Community banner", ["Build the", "banner together"],
     ["Every tap adds a tile. When the grid", "fills, it's unveiled on the grounds."], "grid",
     "The Community Banner · Vimusement 2026",
     "Every tap adds a tile to the Vimusement community banner. When the grid fills, it's unveiled on the church grounds."),
]

GOLD, GOLD2, EMER, GLOW, CREAM, SOFT, MUTE = "#C9962E", "#DDAE4C", "#1F6B45", "#4FD98C", "#F4EEE2", "#C7D4C2", "#8FA089"

# 24x24 line icons (same drawings the site uses)
ICON = {
    "mark":   '<circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.6"/><path d="M12 3v16M4 11h16M6.3 5.3l11.4 11.4M17.7 5.3 6.3 16.7"/>',
    "pin":    '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.4"/>',
    "sofa":   '<path d="M4.5 11V8.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V11"/><path d="M2.5 13.2a2 2 0 0 1 4 0V15h11v-1.8a2 2 0 0 1 4 0V17a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"/><path d="M5.5 19v1.8M18.5 19v1.8M12 5.5V15"/>',
    "heart":  '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    "cap":    '<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.8"/><path d="M22 9.5v5.5"/>',
    "photos": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 15 5-4 4 3 3-2 6 4"/><circle cx="9" cy="9" r="1.4"/>',
    "people": '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>',
    "star":   '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"/>',
    "stall":  '<path d="M3.5 9 5 4h14l1.5 5"/><path d="M3.5 9h17v1.3a2.8 2.8 0 0 1-5.7 0 2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.7 0z"/><path d="M5 12.5V20h14v-7.5"/><path d="M10 20v-4.5h4V20"/>',
    "ticket": '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"/><path d="M14 6v8" stroke-dasharray="1.5 2"/>',
    "code":   '<path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
    "play":   '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
    "desk":   '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M7 9.5h6M7 12.5h4"/><circle cx="16.5" cy="11" r="1.6"/>',
    "grid":   '<rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><path d="M17 14v6M14 17h6"/>',
}
POSTERS = [("#7A1024", "#F0B84A"), ("#2B1B5E", "#A99BFF"), ("#0F4C45", "#62E6C3"), ("#17324F", "#FF8A3D"), ("#5E2A66", "#FFA36B")]


def esc(s):
    return html.escape(s, quote=True)


def art(key):
    cx, cy = 925, 300
    if key == "posters":   # five little poster cards, fanned
        out = []
        for i, (bg, ac) in enumerate(POSTERS):
            ang = (i - 2) * 9
            x = cx - 105 + (i - 2) * 72   # keep the fan inside the gold frame
            out.append(
                f'<g transform="rotate({ang} {x + 60} {cy + 170})">'
                f'<rect x="{x}" y="{cy - 95}" width="120" height="180" rx="10" fill="{bg}" stroke="rgba(255,255,255,.14)"/>'
                f'<circle cx="{x + 60}" cy="{cy - 30}" r="26" fill="{ac}" opacity=".85"/>'
                f'<rect x="{x + 14}" y="{cy + 40}" width="70" height="7" rx="3.5" fill="#F4EEE2" opacity=".85"/>'
                f'<rect x="{x + 14}" y="{cy + 54}" width="46" height="5" rx="2.5" fill="{ac}" opacity=".8"/></g>')
        return "".join(out)
    s = 13  # 24px icon → ~312px
    return (f'<circle cx="{cx}" cy="{cy}" r="190" fill="url(#halo)"/>'
            f'<circle cx="{cx}" cy="{cy}" r="178" fill="none" stroke="{GOLD}" stroke-opacity=".28" stroke-width="1.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="150" fill="none" stroke="{GOLD}" stroke-opacity=".12" stroke-width="1"/>'
            f'<g transform="translate({cx - 12 * s} {cy - 12 * s}) scale({s})" fill="none" stroke="{GOLD2}" stroke-width="1.15" '
            f'stroke-linecap="round" stroke-linejoin="round">{ICON[key]}</g>')


def card(p):
    page, eyebrow, title, sub, key = p[:5]
    t_size = 80 if max(len(x) for x in title) <= 16 else 68
    y0 = 262 if len(title) == 2 else 300
    title_svg = "".join(
        f'<text x="80" y="{y0 + i * (t_size + 6)}" font-family="Cormorant Garamond, Georgia, serif" font-weight="600" '
        f'font-size="{t_size}" fill="{CREAM}">{esc(line)}</text>' for i, line in enumerate(title))
    sy = y0 + (len(title) - 1) * (t_size + 6) + 62
    sub_svg = "".join(
        f'<text x="82" y="{sy + i * 38}" font-family="Hanken Grotesk, Segoe UI, sans-serif" font-size="28" fill="{SOFT}">{esc(line)}</text>'
        for i, line in enumerate(sub))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="78%" cy="45%" r="60%"><stop offset="0" stop-color="{EMER}" stop-opacity=".55"/><stop offset=".6" stop-color="{EMER}" stop-opacity=".08"/><stop offset="1" stop-color="{EMER}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{GOLD}" stop-opacity=".16"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070B08"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="26" y="26" width="1148" height="578" rx="22" fill="none" stroke="{GOLD}" stroke-opacity=".32" stroke-width="1.5"/>
  <g transform="translate(80 70) scale(1.6)" fill="none" stroke="{GOLD2}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{ICON["mark"]}</g>
  <text x="130" y="98" font-family="IBM Plex Mono, Consolas, monospace" font-size="20" letter-spacing="5" fill="{SOFT}">VIMUSEMENT 2026</text>
  <text x="82" y="{y0 - t_size - 8}" font-family="IBM Plex Mono, Consolas, monospace" font-size="19" letter-spacing="5" fill="{GOLD2}">{esc(eyebrow.upper())}</text>
  {title_svg}
  {sub_svg}
  <rect x="80" y="514" width="596" height="52" rx="26" fill="{EMER}"/>
  <text x="378" y="547" text-anchor="middle" font-family="Hanken Grotesk, Segoe UI, sans-serif" font-size="22" fill="#EAF2E6">25 Oct 2026 · Ascension Church, Aminjikkarai</text>
  {art(key)}
</svg>
'''


def slug(page):
    """image file name for a page (docs/banner-reveal → banner-reveal)"""
    return page.split("/")[-1]


def head_tags(p):
    page, *_, share_title, share_desc = p
    url = BASE + ("" if page == "index" else page + ".html")
    img = BASE + "assets/img/og/" + slug(page) + ".jpg"
    t, d = esc(share_title), esc(share_desc)
    return (
        '<!-- share preview (built by scripts/build_og_cards.py; crawlers read these, not the JS) -->\n'
        f'<meta property="og:site_name" content="Vimusement">\n'
        f'<meta property="og:title" content="{t}">\n'
        f'<meta property="og:description" content="{d}">\n'
        f'<meta property="og:type" content="website">\n'
        f'<meta property="og:url" content="{url}">\n'
        f'<meta property="og:image" content="{img}">\n'
        f'<meta property="og:image:type" content="image/jpeg">\n'
        f'<meta property="og:image:width" content="1200">\n'
        f'<meta property="og:image:height" content="630">\n'
        f'<meta property="og:image:alt" content="{t}">\n'
        f'<meta name="twitter:card" content="summary_large_image">\n'
        f'<meta name="twitter:title" content="{t}">\n'
        f'<meta name="twitter:description" content="{d}">\n'
        f'<meta name="twitter:image" content="{img}">\n'
        '<!-- /share preview -->\n')


def patch_page(p):
    page = p[0]
    path = os.path.join(ROOT, page + ".html")
    s = open(path, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    s = s.replace("\r\n", "\n")
    # drop any older share tags (index had a hand-written set), then add ours after <meta charset>
    s = re.sub(r"<!-- share preview.*?<!-- /share preview -->\n", "", s, flags=re.S)
    s = re.sub(r'^<meta (property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\n', "", s, flags=re.M)
    s = s.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + head_tags(p), 1)
    # crawlers don't run the i18n script, so the fallback <title> must be real text
    s = re.sub(r"(<title[^>]*>)([^<]*)\{year\}([^<]*</title>)", r"\g<1>\g<2>2026\g<3>", s)
    # the plain meta description is what some apps show too: keep it in step
    share_desc = esc(p[-1])
    if re.search(r'<meta name="description"', s):
        s = re.sub(r'(<meta name="description"[^>]*content=")[^"]*(")', lambda m: m.group(1) + share_desc + m.group(2), s, count=1)
    else:   # a page with no description yet gets one, right after its <title>
        s = re.sub(r"(</title>\n)", lambda m: m.group(1) + '<meta name="description" content="' + share_desc + '">\n', s, count=1)
    open(path, "w", encoding="utf-8", newline="").write(s.replace("\n", nl))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for p in PAGES:
        open(os.path.join(OUT, slug(p[0]) + ".svg"), "w", encoding="utf-8").write(card(p))
        patch_page(p)
        print("card + tags:", p[0])
