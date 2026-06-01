#!/usr/bin/env python3
"""
Generate 3 whitepaper PDFs from content JSON.
English-only PDFs, A4 format, with cover image support.
"""

import json
import os
import sys
from pathlib import Path

from fpdf import FPDF

# ── Config ──────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT_FILE = PROJECT_ROOT / ".openclaw-project" / "whitepapers-content.json"
OUTPUT_DIR = PROJECT_ROOT / "src" / "assets" / "files"
COVER_IMAGES_DIR = PROJECT_ROOT / ".openclaw-project" / "cover-images"

# Layout constants (mm)
PAGE_W, PAGE_H = 210, 297  # A4
MARGIN = 20
CONTENT_W = PAGE_W - 2 * MARGIN  # 170mm

# Colors (RGB)
COLOR_PRIMARY = (46, 125, 50)      # #2E7D32 green
COLOR_DARK = (30, 30, 30)
COLOR_BODY = (60, 60, 60)
COLOR_LIGHT_BG = (245, 245, 245)
COLOR_WHITE = (255, 255, 255)
COLOR_COVER_BG = (20, 30, 20)      # dark greenish for cover fallback

def sanitize_text(text):
    """Replace Unicode characters not supported by fpdf2 core fonts with ASCII equivalents."""
    replacements = {
        "\u2014": " - ",   # em dash
        "\u2013": " - ",   # en dash
        "\u2018": "'",     # left single quote
        "\u2019": "'",     # right single quote
        "\u201c": '"',     # left double quote
        "\u201d": '"',     # right double quote
        "\u2026": "...",   # ellipsis
        "\u2022": "*",     # bullet
        "\u00ae": "(R)",  # registered
        "\u2122": "(TM)", # trademark
        "\u00a0": " ",    # non-breaking space
        "\u2264": "<=",    # less-than-or-equal
        "\u2265": ">=",    # greater-than-or-equal
        "\u00b0": " deg",  # degree
        "\u00b7": "*",     # middle dot
        "\u00d7": "x",     # multiplication sign
        "\u00f7": "/",     # division sign
        "\u20ac": "EUR",   # euro
        "\u00a3": "GBP",   # pound
        "\u00a5": "JPY",   # yen
        "\u00e9": "e",     # é
        "\u00e8": "e",     # è
        "\u00ea": "e",     # ê
        "\u00e0": "a",     # à
        "\u00f1": "n",     # ñ
        "\u00fc": "ue",    # ü
        "\u00f6": "oe",    # ö
        "\u00e4": "ae",    # ä
        "\u2010": "-",     # hyphen
        "\u2011": "-",     # non-breaking hyphen
        "\u2012": "-",     # figure dash
        "\u2032": "'",     # prime
        "\u2033": '"',     # double prime
        "\u00ab": '"',     # left double angle
        "\u00bb": '"',     # right double angle
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Strip any remaining non-Latin-1 characters
    result = []
    for ch in text:
        try:
            ch.encode("latin-1")
            result.append(ch)
        except UnicodeEncodeError:
            result.append("?")
    return "".join(result)


# ── Custom PDF Class ────────────────────────────────────────────────────
class WhitepaperPDF(FPDF):
    """Custom PDF with header/footer for whitepapers."""

    def header(self):
        # Skip header on cover page (handled in cover rendering)
        pass

    def footer(self):
        if self.page_no() > 1:  # Skip footer on cover
            self.set_y(-MARGIN - 8)
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(150, 150, 150)
            self.cell(0, 8, f"{self.alias_nb_pages()}", align="C", new_x="LMARGIN", new_y="NEXT")

    def cover_page(self, title, subtitle, image_path=None):
        title = sanitize_text(title)
        subtitle = sanitize_text(subtitle)
        """Render a full-page cover with optional image background."""
        self.add_page()

        if image_path and Path(image_path).exists():
            # Use image as full-page cover background
            # fpdf2 can place images anywhere; we stretch to full page
            self.image(str(image_path), x=0, y=0, w=PAGE_W, h=PAGE_H)
            # If image is bright, use dark overlay for text readability
            self.set_fill_color(0, 0, 0)
            self.rect(0, PAGE_H * 0.55, PAGE_W, PAGE_H * 0.45, "F")
            # Semi-transparent overlay effect (fpdf2 doesn't support alpha,
            # so we just place a dark rectangle at bottom)
            text_x = MARGIN
            text_y = PAGE_H * 0.62
        else:
            # Fallback: solid dark cover with decorative bar
            self.set_fill_color(*COLOR_DARK)
            self.rect(0, 0, PAGE_W, PAGE_H, "F")
            # Accent bar
            self.set_fill_color(*COLOR_PRIMARY)
            self.rect(MARGIN, PAGE_H * 0.48, CONTENT_W, 3, "F")
            text_x = MARGIN
            text_y = PAGE_H * 0.55

        # Title
        self.set_y(text_y)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*COLOR_WHITE)
        self.multi_cell(CONTENT_W, 14, title, align="L")

        # Subtitle
        self.set_y(self.get_y() + 8)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(200, 200, 200)
        self.multi_cell(CONTENT_W, 7, subtitle, align="L")

        # Bottom branding bar
        self.set_y(PAGE_H - MARGIN - 20)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*COLOR_PRIMARY)
        self.cell(0, 8, "YuKoLi Technology", align="L")

    def section_page(self, title, body_text):
        """Render a content page with section title and body."""
        title = sanitize_text(title)
        body_text = sanitize_text(body_text)
        self.add_page()
        # Top accent line
        self.set_fill_color(*COLOR_PRIMARY)
        self.rect(MARGIN, MARGIN, 40, 3, "F")

        # Section title
        self.set_y(MARGIN + 10)
        self.set_font("Helvetica", "B", 20)
        self.set_text_color(*COLOR_DARK)
        self.multi_cell(CONTENT_W, 10, title, align="L")

        # Separator
        self.set_y(self.get_y() + 4)
        self.set_draw_color(220, 220, 220)
        self.line(MARGIN, self.get_y(), MARGIN + CONTENT_W, self.get_y())

        # Body text
        self.set_y(self.get_y() + 8)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*COLOR_BODY)
        self.multi_cell(CONTENT_W, 6.5, body_text, align="L", new_x="LMARGIN", new_y="NEXT")

    def about_page(self, about_text, cta_text):
        """Render About YuKoLi page."""
        about_text = sanitize_text(about_text)
        cta_text = sanitize_text(cta_text)
        self.add_page()

        # Light background for the page
        self.set_fill_color(*COLOR_LIGHT_BG)
        self.rect(0, 0, PAGE_W, PAGE_H, "F")

        # Header
        self.set_y(MARGIN + 15)
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*COLOR_DARK)
        self.cell(0, 12, "About YuKoLi", align="C", new_x="LMARGIN", new_y="NEXT")

        # Green accent line
        self.set_y(self.get_y() + 4)
        self.set_fill_color(*COLOR_PRIMARY)
        self.rect(PAGE_W // 2 - 20, self.get_y(), 40, 3, "F")

        # About text
        self.set_y(self.get_y() + 12)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*COLOR_BODY)
        self.multi_cell(CONTENT_W, 6.5, about_text, align="L", new_x="LMARGIN", new_y="NEXT")

        # CTA section
        self.set_y(self.get_y() + 15)
        # CTA box background
        self.set_fill_color(*COLOR_PRIMARY)
        self.rect(MARGIN, self.get_y(), CONTENT_W, 35, "F")

        self.set_y(self.get_y() + 8)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*COLOR_WHITE)
        self.cell(0, 10, "Get Started Today", align="C", new_x="LMARGIN", new_y="NEXT")

        self.set_y(self.get_y() + 2)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(220, 255, 220)
        self.multi_cell(CONTENT_W, 7, cta_text, align="C", new_x="LMARGIN", new_y="NEXT")


def generate_pdf(whitepaper, cover_dir):
    """Generate a single whitepaper PDF. Returns the output path."""
    pdf = WhitepaperPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=MARGIN)

    wp = whitepaper
    wp_id = wp["id"]
    cover_img = cover_dir / f"{wp_id}.png"

    # ── Cover page ──
    pdf.cover_page(
        title=wp["cover_title_en"],
        subtitle=wp["cover_subtitle_en"],
        image_path=cover_img if cover_img.exists() else None,
    )

    # ── Content pages ──
    # English page titles mapped from Chinese originals
    page_title_map = {
        "functional-food-trends-2026": [
            "Global Functional Food Market: Size & Growth",
            "Beauty Collagen: In-Depth Category Analysis",
            "Gut Health & Probiotics: Category Deep Dive",
            "Weight Management & Meal Replacement",
            "Choosing Your OEM Partner: 5 Evaluation Dimensions",
        ],
        "health-beverage-odm-guide": [
            "From Concept to Formula: Custom R&D Process",
            "Compliance & Certification: One-Stop Clearance",
            "Manufacturing: Flexible Lines & Elastic Capacity",
            "Packaging & Logistics: Multi-Format + Global Delivery",
            "Quality Control: Full-Chain Management System",
            "Choosing Your Model: OEM vs ODM vs OBM",
        ],
        "coffee-innovation-report": [
            "Global Coffee & Blended Beverage Market Overview",
            "Freeze-Dry Breakthrough: -40°C vs Spray Drying",
            "Functional Coffee Innovation: Collagen/GABA/Probiotics",
            "SE Asia Case Study: Philippine Brand, 7-Day Sampling",
            "Supply Chain Optimization: Cost Reduction & Efficiency",
        ],
    }
    eng_titles = page_title_map.get(wp_id, [])
    for i, page in enumerate(wp["pages"]):
        eng_title = eng_titles[i] if i < len(eng_titles) else page["title"]
        pdf.section_page(title=eng_title, body_text=page["content_en"])

    # ── About + CTA page ──
    pdf.about_page(
        about_text=wp["about_yukoli_en"],
        cta_text=wp["cta_en"],
    )

    # ── Output ──
    output_path = OUTPUT_DIR / f"{wp_id}.pdf"
    pdf.output(str(output_path))
    return output_path


def main():
    # Load content
    if not CONTENT_FILE.exists():
        print(f"ERROR: Content file not found: {CONTENT_FILE}")
        sys.exit(1)

    with open(CONTENT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    whitepapers = data["whitepapers"]
    print(f"Loaded {len(whitepapers)} whitepapers from content file.")

    # Ensure output dir exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate PDFs
    generated = []
    for wp in whitepapers:
        print(f"  Generating: {wp['id']}...")
        out = generate_pdf(wp, COVER_IMAGES_DIR)
        size_kb = out.stat().st_size / 1024
        print(f"    → {out.name} ({size_kb:.1f} KB)")
        generated.append(out)

    print(f"\n✓ Generated {len(generated)} PDFs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
