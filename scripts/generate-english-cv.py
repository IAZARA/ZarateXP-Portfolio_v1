#!/usr/bin/env python3
"""Generate the English CV distributed with the portfolio."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Ivan_Zarate_CV_EN.pdf"


def register_fonts() -> tuple[str, str]:
    candidates = [
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        # Linux: Liberation Sans has the same metrics as Arial.
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
    ]
    for regular, bold in map(lambda pair: (Path(pair[0]), Path(pair[1])), candidates):
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("CVSans", str(regular)))
            pdfmetrics.registerFont(TTFont("CVSans-Bold", str(bold)))
            return "CVSans", "CVSans-Bold"
    return "Helvetica", "Helvetica-Bold"


def build_pdf() -> None:
    regular, bold = register_fonts()
    styles = getSampleStyleSheet()
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName=regular,
        fontSize=7.72,
        leading=9.05,
        textColor=colors.HexColor("#111111"),
        spaceAfter=1.45,
        allowWidows=0,
        allowOrphans=0,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=body,
        fontName=bold,
        fontSize=9.5,
        leading=10.4,
        spaceBefore=2.4,
        spaceAfter=1.7,
        keepWithNext=True,
    )
    role = ParagraphStyle(
        "Role",
        parent=body,
        fontSize=7.65,
        leading=8.85,
        spaceBefore=0.8,
        spaceAfter=1.2,
        keepWithNext=True,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=9.2,
        firstLineIndent=-7.4,
        bulletIndent=0,
        spaceAfter=0.55,
    )
    name = ParagraphStyle(
        "Name",
        parent=body,
        fontName=bold,
        fontSize=15.0,
        leading=16.4,
        alignment=TA_CENTER,
        spaceAfter=1.3,
    )
    title = ParagraphStyle(
        "Title",
        parent=body,
        fontName=bold,
        fontSize=8.5,
        leading=9.5,
        alignment=TA_CENTER,
        spaceAfter=1.5,
    )
    contact = ParagraphStyle(
        "Contact",
        parent=body,
        fontSize=7.75,
        leading=9.1,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#333333"),
        spaceAfter=3.3,
    )

    def p(text: str, style: ParagraphStyle = body) -> Paragraph:
        return Paragraph(text, style)

    def h(text: str) -> Paragraph:
        return p(f"<u>{text}</u>", heading)

    def b(text: str) -> Paragraph:
        return Paragraph(text, bullet, bulletText="•")

    story = [
        p("IVÁN AGUSTÍN ZARATE", name),
        p(
            "AI Solution Architect | Applied AI, Agent Evaluation &amp; Data Privacy | "
            "Java, Spring Boot, React, Oracle",
            title,
        ),
        p(
            "Monserrat, Autonomous City of Buenos Aires, Argentina | "
            "ivan.agustin.95@gmail.com | +54 11 4097 3159 | "
            '<a href="https://www.linkedin.com/in/ivan-agustin-zarate/" color="#0057b8"><u>LinkedIn</u></a> | '
            '<a href="https://github.com/IAZARA" color="#0057b8"><u>GitHub</u></a>',
            contact,
        ),
        h("PROFESSIONAL PROFILE"),
        p(
            "AI Solution Architect at ACSYS with ten years in public security, where I built institutional "
            "platforms on critical databases and worked on data protection and digital investigations. I take AI "
            "systems from user discovery to production, with a focus on evaluation, human oversight, privacy, and "
            "traceability. My next step is full-time empirical AI safety research: agent evaluation, scalable "
            "oversight, and privacy safeguards."
        ),
        h("PROFESSIONAL EXPERIENCE"),
        p(
            "<b>AI Solution Architect</b> | ACSYS - Business Engineering &amp; Innovation | 2026 - Present | "
            "Argentina",
            role,
        ),
        b(
            "Discovery, enterprise AI architecture, RAG, identity, security, and proofs of concept, supporting "
            "presales and delivery."
        ),
        b(
            "Translation of business needs into requirements, scope, architecture, decisions, and acceptance "
            "criteria, connecting presales, specialists, and delivery teams."
        ),
        p(
            "<b>Software Analyst / Digital Platforms Project Manager</b> | National Directorate for Security "
            "Database Management, Ministry of National Security | 2024 - 2026 | Argentina",
            role,
        ),
        b(
            "Development and implementation of institutional platforms, from user discovery and functional "
            "definition through production rollout."
        ),
        b(
            "Integration of AI capabilities and MLOps across the model lifecycle: data preparation and validation, "
            "experimentation, versioning, evaluation, deployment, and monitoring of neural networks and text and "
            "image models."
        ),
        b(
            "Work with critical databases, safeguarding privacy, access control, traceability, and data quality "
            "at every stage."
        ),
        b(
            "Coordination with user areas, vendors, technical teams, and cybersecurity specialists; training on "
            "data, responsible AI, and information security."
        ),
        p(
            "<b>Data, Control, and Information Management Analyst</b> | Argentine Federal Police - Public "
            "Databases Office | 2018 - 2024 | Buenos Aires",
            role,
        ),
        b(
            "Technical responsibilities involving public databases, privacy, information protection, control, "
            "and responsible use of systems."
        ),
        p(
            "<b>Team Coordinator</b> | Argentine Federal Police - Operations Area | 2016 - 2018 | Buenos Aires",
            role,
        ),
        b("Team coordination, task planning, communication under pressure, and decision-making."),
        p(
            "<b>Human Resources and Personnel Administration Assistant</b> | COTO Digital - Branch 184 | "
            "2013 - 2015 | Buenos Aires",
            role,
        ),
        b(
            "Support for payroll settlements, attendance, and personnel updates; confidential and organized "
            "management of internal documentation."
        ),
        h("SELECTED PROJECTS"),
        p(
            "<b>Atlas Urbano - Tool-using AI agent for zoning analysis</b> | Personal project | 2026 - Present"
            "<br/>Live at atlas.iazarate.com. An agent that calls public GIS and zoning APIs and must declare "
            "missing data instead of inferring it. A second-model review checks each draft against tool outputs "
            "(it corrected 14 of 22 measured complex queries); per-stage telemetry and 129 test suites."
        ),
        p(
            "<b>Human-in-the-loop AI tools</b> | Open source | 2026<br/>Auto-Inbox, Redmine Agent, and Araña "
            "Web: AI drafting that requires human validation before acting, with auditing. github.com/IAZARA"
        ),
        p(
            "<b>CUFRE - Case Management and Prioritization Platform</b> | Ministry of National Security | "
            "2024 - 2026<br/>CRUD platform built with Java, Spring Boot, React, Maven, and Oracle to prioritize "
            "and track critical records, with a focus on traceability and cross-team coordination."
        ),
        p(
            "<b>SIFEBU - Federal Missing Persons Search System</b> | Ministry of National Security | "
            "2024 - 2026<br/>Development of a federal system with JavaScript, TypeScript, React, and Oracle, "
            "focused on information availability, protection, and quality."
        ),
        p(
            "<b>CRIACO - Territorial Analysis and GIS Platform</b> | Ministry of National Security | "
            "2024 - 2026<br/>Development of a territorial analysis platform with GIS components, maps, "
            "information layers, and data visualization."
        ),
        p(
            "<b>OSINTARGY</b> | Private project | 2024 - Present<br/>Platform and training space covering OSINT "
            "tools, digital investigation, data handling, and privacy best practices for small businesses."
        ),
        h("EDUCATION"),
        p(
            "<b>Systems Analyst</b> | ORT Argentina Higher Institute | 2024 - 2026 | Degree awarded."
        ),
        p(
            "<b>Bachelor's Degree in Security, focus on Criminal Investigation</b> | University Institute of the "
            "Argentine Federal Police | 2020 - 2025 | Investigation and information analysis."
        ),
        p(
            "<b>Google AI and Google Data Analytics Professional Certificates</b> | Google / Coursera | "
            "2024 - 2026 | SQL, Tableau, R, and applied AI."
        ),
        p(
            "<b>Anthropic Academy</b> | 2026 | Claude Code 101 and AI Capabilities and Limitations."
        ),
        h("CORE SKILLS"),
        p(
            "<b>AI safety interests:</b> agent evaluation, faithfulness to tool outputs, human and model "
            "oversight, privacy harms from web-search agents, and red-teaming."
        ),
        p(
            "<b>Solution architecture:</b> user discovery, requirements, functional-to-technical translation, "
            "integration, and production rollout."
        ),
        p(
            "<b>AI and MLOps:</b> model lifecycle, evaluation, versioning, deployment, and monitoring; Hugging Face, "
            "QLoRA, neural networks, and text "
            "and image models."
        ),
        p(
            "<b>Software development:</b> Java, Spring Boot, React, JavaScript, TypeScript, Maven, APIs, Git, "
            "Oracle, SQL, and production CRUD platforms."
        ),
        p(
            "<b>Data, privacy, and security:</b> data quality, sensitive information, privacy, traceability, "
            "access control, auditing, OSINT, GIS analysis, and applied cybersecurity."
        ),
        p(
            "<b>AI tools:</b> local open-weight models, coding agents, Claude, Codex, and OpenCode, with a focus "
            "on privacy and minimizing shared data."
        ),
        h("LANGUAGES"),
        p("<b>Spanish:</b> Native."),
        p(
            "<b>English:</b> Intermediate. Strong technical reading; working meetings with technology vendors."
        ),
        Spacer(1, 0.6),
        p(
            "<b>Personal details:</b> Date of birth: August 17, 1995; current residence: Monserrat, Autonomous "
            "City of Buenos Aires."
        ),
    ]

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=10.5 * mm,
        bottomMargin=10.5 * mm,
        title="Ivan Agustin Zarate - AI Solution Architect",
        author="Ivan Agustin Zarate",
        subject="English curriculum vitae",
        creator="ZarateXP Portfolio",
        pageCompression=1,
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
