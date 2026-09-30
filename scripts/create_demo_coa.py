from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "demo"
OUTPUT.mkdir(parents=True, exist_ok=True)


def create_certificate(filename: str, lot_id: str, composition: list[tuple[str, str]], conflict: bool = False) -> None:
    path = OUTPUT / filename
    doc = SimpleDocTemplate(
        str(path), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="MaterialLoop AI Synthetic Demo Certificate",
        author="ChengFeng LAB / MaterialLoop AI"
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Kicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=colors.HexColor("#21876f"), leading=10, spaceAfter=5))
    styles.add(ParagraphStyle(name="TitleDark", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, textColor=colors.HexColor("#14201e"), leading=28, spaceAfter=4))
    styles.add(ParagraphStyle(name="SmallGray", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#65716f"), leading=11))
    story = [
        Paragraph("MATERIALLOOP AI / TEST FIXTURE", styles["Kicker"]),
        Paragraph("Synthetic Certificate of Analysis", styles["TitleDark"]),
        Paragraph("NOT FOR ENGINEERING, REGULATORY, COMMERCIAL OR PURCHASING USE", ParagraphStyle(name="Warning", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#9f3e35"), backColor=colors.HexColor("#fff0ed"), borderColor=colors.HexColor("#e9a69f"), borderWidth=0.7, borderPadding=8, leading=14, spaceBefore=8, spaceAfter=16)),
    ]

    meta = [
        ["Fixture ID", "ML-DEMO-COA-2026", "Lot ID", lot_id],
        ["Candidate alloy", "Aluminum 6061", "Physical form", "CNC machining offcuts"],
        ["Source process", "CNC milling", "Declared quantity", "500 kg"],
        ["Origin region", "Taiwan", "Issue date", "2026-09-28"],
    ]
    meta_table = Table(meta, colWidths=[31 * mm, 50 * mm, 31 * mm, 50 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e9efed")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#e9efed")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8d2d0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.extend([meta_table, Spacer(1, 9 * mm), Paragraph("DECLARED CHEMICAL COMPOSITION", styles["Kicker"])])

    rows = [["Element", "Declared mass %"]] + [[name, value] for name, value in composition]
    table = Table(rows, colWidths=[100 * mm, 62 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#14201e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8d2d0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f8f7")]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.extend([table, Spacer(1, 8 * mm)])

    if conflict:
        story.append(Paragraph("INTENTIONAL CONFLICT FIXTURE", ParagraphStyle(name="Conflict", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, textColor=colors.HexColor("#9f3e35"), spaceAfter=5)))
        story.append(Paragraph("The composition total is intentionally 102.40% and the lot ID intentionally differs from the form fixture. MaterialLoop AI must block downstream valuation, impact and matching claims.", styles["SmallGray"]))
    else:
        story.append(Paragraph("DEMO INTERPRETATION NOTE", styles["Kicker"]))
        story.append(Paragraph("This synthetic fixture supports a candidate Aluminum 6061 classification for product demonstration only. Surface contamination, mechanical properties and end-use compliance remain unverified.", styles["SmallGray"]))

    story.extend([
        Spacer(1, 12 * mm),
        Table([["Prepared by", "MaterialLoop AI Demo Generator"], ["Verification", "Synthetic / no laboratory test performed"], ["Required control", "Human approval before external use"]], colWidths=[38 * mm, 124 * mm], style=TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#65716f")),
            ("LINEABOVE", (0, 0), (-1, 0), 0.7, colors.HexColor("#c8d2d0")),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
        ]))
    ])
    doc.build(story)


create_certificate(
    "Demo_COA_Aluminum_6061_ML-A-001.pdf",
    "ML-A-001",
    [("Aluminum (Al)", "97.90%"), ("Magnesium (Mg)", "1.00%"), ("Silicon (Si)", "0.60%"), ("Copper (Cu)", "0.30%"), ("Other elements", "0.20%"), ("TOTAL", "100.00%")]
)

create_certificate(
    "Demo_COA_Conflict_ML-C-077.pdf",
    "ML-C-077",
    [("Aluminum (Al)", "98.60%"), ("Magnesium (Mg)", "1.50%"), ("Silicon (Si)", "1.10%"), ("Copper (Cu)", "0.70%"), ("Other elements", "0.50%"), ("TOTAL", "102.40%")],
    conflict=True
)
