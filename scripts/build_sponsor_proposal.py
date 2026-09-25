# One-off script: builds the 2-page sponsorship proposal PDF.
# Run: python scripts/build_sponsor_proposal.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    HRFlowable, KeepTogether
)
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.pdfbase.ttfonts import TTFont
import os

# ---- brand palette (matches the site's tokens.css, light theme) ----
CRIMSON = colors.HexColor("#C2213A")
GOLD    = colors.HexColor("#D9703C")
INK     = colors.HexColor("#23161A")
INK_SOFT = colors.HexColor("#5C4148")
CREAM   = colors.HexColor("#FBF6F1")
LINE    = colors.HexColor("#E7D8D2")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

styles = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=9.5,
        textColor=GOLD, tracking=1.2, spaceAfter=4, leading=12),
    "h1": ParagraphStyle("h1", fontName="Times-Bold", fontSize=30, textColor=INK,
        leading=34, spaceAfter=2),
    "h2": ParagraphStyle("h2", fontName="Times-Bold", fontSize=17, textColor=INK,
        leading=21, spaceBefore=14, spaceAfter=8),
    "sub": ParagraphStyle("sub", fontName="Helvetica", fontSize=12.5, textColor=INK_SOFT,
        leading=17, spaceAfter=10),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10.2, textColor=INK,
        leading=14.5),
    "bodySoft": ParagraphStyle("bodySoft", fontName="Helvetica", fontSize=10.2,
        textColor=INK_SOFT, leading=14.5),
    "meta": ParagraphStyle("meta", fontName="Helvetica-Bold", fontSize=10.2,
        textColor=INK, leading=15),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=10.5,
        textColor=INK, leading=15, spaceAfter=7, leftIndent=14, bulletIndent=0),
    "tierName": ParagraphStyle("tierName", fontName="Times-Bold", fontSize=13.5,
        textColor=INK, leading=16),
    "tierAmount": ParagraphStyle("tierAmount", fontName="Helvetica-Bold", fontSize=11,
        textColor=CRIMSON, leading=14),
    "tierBenefit": ParagraphStyle("tierBenefit", fontName="Helvetica", fontSize=9.7,
        textColor=INK_SOFT, leading=13.5),
    "footer": ParagraphStyle("footer", fontName="Helvetica", fontSize=8.3,
        textColor=INK_SOFT, leading=11, alignment=TA_CENTER),
    "contactLabel": ParagraphStyle("contactLabel", fontName="Helvetica-Bold", fontSize=9,
        textColor=GOLD, leading=12),
    "contactValue": ParagraphStyle("contactValue", fontName="Helvetica-Bold", fontSize=13,
        textColor=INK, leading=17),
}

def rule(color=LINE, thickness=1, space_before=10, space_after=10):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                       spaceBefore=space_before, spaceAfter=space_after)

def bullet_item(text):
    return Paragraph("&bull;&nbsp;&nbsp;" + text, styles["bullet"])

story = []

# ============== PAGE 1 — THE EVENT ==============
logo_path = "assets/img/shared/victorians-mark.png"
if os.path.exists(logo_path):
    logo = Image(logo_path, width=13*mm, height=13*mm*(515/575))
else:
    logo = Spacer(1, 1)

head_table = Table(
    [[logo, Paragraph("AN INITIATIVE OF VICTORIANS YOUTH", styles["eyebrow"])]],
    colWidths=[16*mm, None]
)
head_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("TOPPADDING", (0,0), (-1,-1), 0),
    ("BOTTOMPADDING", (0,0), (-1,-1), 0),
]))
story.append(head_table)
story.append(Spacer(1, 10*mm))

story.append(Paragraph("VIMUSEMENT 2026", styles["h1"]))
story.append(Paragraph("A Community Fundraising Carnival", styles["sub"]))
story.append(rule(color=CRIMSON, thickness=1.4, space_before=4, space_after=14))

detail_rows = [
    [Paragraph("WHERE", styles["contactLabel"]), Paragraph("Ascension Church, Metha Nagar, Aminjikkarai, Chennai", styles["body"])],
    [Paragraph("WHO", styles["contactLabel"]), Paragraph("Families and young people from right across the neighbourhood — hundreds through the gates in one day", styles["body"])],
    [Paragraph("PURPOSE", styles["contactLabel"]), Paragraph("Scholarships, a medical-emergency fund, and hardship support for neighbours in need — 100% of what's raised, after costs, goes to the cause", styles["body"])],
]
detail_table = Table(detail_rows, colWidths=[26*mm, None])
detail_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ("LEFTPADDING", (0,0), (0,-1), 0),
]))
story.append(detail_table)

story.append(Spacer(1, 4*mm))
story.append(Paragraph("Why partner with us", styles["h2"]))
why_points = [
    "A local, built-in crowd — no footfall to chase, just show up and be seen",
    "A family + youth audience, right around Aminjikkarai",
    "Real on-ground brand visibility: posters, banners, stalls",
    "Social media exposure across our event pages",
    "MC and stage announcements naming your brand",
    "Product sampling or distribution to the crowd",
    "Brand activation space, if you want to bring one",
]
for p in why_points:
    story.append(bullet_item(p))

story.append(Spacer(1, 8*mm))
quote_box = Table(
    [[Paragraph(
        "“We’re not just asking for funding — we can give your brand real visibility "
        "through our posters, social media, stage announcements and, depending on the "
        "partnership, product integration.”",
        ParagraphStyle("quote", fontName="Times-Italic", fontSize=12, textColor=INK,
                        leading=17, alignment=TA_LEFT)
    )]],
    colWidths=[PAGE_W - 2*MARGIN]
)
quote_box.setStyle(TableStyle([
    ("BOX", (0,0), (-1,-1), 0, CREAM),
    ("BACKGROUND", (0,0), (-1,-1), CREAM),
    ("LEFTPADDING", (0,0), (-1,-1), 14),
    ("RIGHTPADDING", (0,0), (-1,-1), 14),
    ("TOPPADDING", (0,0), (-1,-1), 12),
    ("BOTTOMPADDING", (0,0), (-1,-1), 12),
    ("LINEBEFORE", (0,0), (0,-1), 3, GOLD),
]))
story.append(quote_box)

story.append(Spacer(1, 12*mm))
story.append(Paragraph("Partnership options overleaf &rarr;", styles["bodySoft"]))

story.append(Table([[""]], colWidths=[1], rowHeights=[1]))  # spacer keepalive
from reportlab.platypus import PageBreak
story.append(PageBreak())

# ============== PAGE 2 — PARTNERSHIP OPTIONS ==============
story.append(head_table)
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Partnership options", styles["h1"] if False else ParagraphStyle(
    "h1b", fontName="Times-Bold", fontSize=24, textColor=INK, leading=28, spaceAfter=4)))
story.append(Paragraph("Pick a level, or tell us what works for your business", styles["sub"]))
story.append(rule(color=CRIMSON, thickness=1.4, space_before=4, space_after=16))

tiers = [
    ("Community Partner", "Rs. 10,000+",
     "Logo on event banners, a mention across our social media, and a shout-out on stage — the bigger the contribution, the bigger the billing."),
    ("Product Partner", "Products / vouchers",
     "Give what you make or sell — food, drinks, goods — and we promote your brand in return. Great for restaurants, cafés and shops."),
    ("Prize Partner", "Gifts / vouchers",
     "Sponsor a Lucky Draw or game prize — your brand gets named live on stage the moment it's won."),
]

tier_rows = []
for name, amount, benefit in tiers:
    cell = Table(
        [[Paragraph(name, styles["tierName"]), Paragraph(amount, styles["tierAmount"])],
         [Paragraph(benefit, styles["tierBenefit"]), ""]],
        colWidths=[(PAGE_W - 2*MARGIN)*0.62, (PAGE_W - 2*MARGIN)*0.38]
    )
    cell.setStyle(TableStyle([
        ("SPAN", (0,1), (1,1)),
        ("ALIGN", (1,0), (1,0), "RIGHT"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,0), 14),
        ("TOPPADDING", (0,1), (-1,1), 4),
        ("BOTTOMPADDING", (0,1), (-1,1), 14),
        ("LEFTPADDING", (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
    ]))
    box = Table([[cell]], colWidths=[PAGE_W - 2*MARGIN])
    box.setStyle(TableStyle([
        ("BOX", (0,0), (-1,-1), 1, LINE),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))
    tier_rows.append(box)
    tier_rows.append(Spacer(1, 8))

for r in tier_rows:
    story.append(r)

story.append(Spacer(1, 6*mm))
story.append(Paragraph(
    "Not sure which fits? Message us and we'll shape a package around what works for your "
    "business — a mix of the above is always an option.",
    styles["bodySoft"]))

story.append(Spacer(1, 12*mm))
contact_table = Table(
    [[Paragraph("GET IN TOUCH", styles["contactLabel"]), ""],
     [Paragraph("Austin Prince Roosewelt", styles["contactValue"]),
      Paragraph("Victorians Youth", styles["bodySoft"])],
     [Paragraph("WhatsApp: +91 63794 68686", styles["body"]),
      Paragraph("roosewelt-nacth.github.io/<br/>Vimusement/sponsors.html", styles["body"])]],
    colWidths=[(PAGE_W - 2*MARGIN)*0.55, (PAGE_W - 2*MARGIN)*0.45]
)
contact_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,0), 0),
    ("BOTTOMPADDING", (0,0), (-1,0), 8),
    ("TOPPADDING", (0,1), (-1,-1), 3),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("BACKGROUND", (0,0), (-1,-1), CREAM),
]))
contact_wrap = Table([[contact_table]], colWidths=[PAGE_W - 2*MARGIN])
contact_wrap.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), CREAM),
    ("LEFTPADDING", (0,0), (-1,-1), 16),
    ("RIGHTPADDING", (0,0), (-1,-1), 16),
    ("TOPPADDING", (0,0), (-1,-1), 14),
    ("BOTTOMPADDING", (0,0), (-1,-1), 14),
    ("LINEBEFORE", (0,0), (0,-1), 3, CRIMSON),
]))
story.append(contact_wrap)

story.append(Spacer(1, 10*mm))
story.append(rule(space_before=0, space_after=8))
story.append(Paragraph(
    "Vimusement 2026 · An annual fundraiser by the parish community, Ascension Church, Aminjikkarai.",
    styles["footer"]))

doc = SimpleDocTemplate(
    "assets/docs/Vimusement-2026-Sponsorship-Proposal.pdf",
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=MARGIN,
    title="Vimusement 2026 Sponsorship Proposal",
    author="Victorians Youth",
)
doc.build(story)
print("done")
