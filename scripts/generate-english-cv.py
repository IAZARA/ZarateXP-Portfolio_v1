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
    regular = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
    bold = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
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
            "Software Analyst &amp; Project Manager | Software, Data &amp; AI Solutions | "
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
            "Software Analyst with experience developing and implementing platforms, managing sensitive data, "
            "and coordinating projects in institutional environments. I gather user needs, translate them into "
            "technical solutions, and support integration and production rollout. My career target is a Forward "
            "Deployed Engineer role, building on this hands-on, user-facing delivery experience."
        ),
        p(
            "Experience applying MLOps concepts and AI model lifecycle practices within platforms, with a focus "
            "on data quality, privacy, traceability, deployment, and continuous improvement."
        ),
        h("PROFESSIONAL EXPERIENCE"),
        p(
            "<b>Software Analyst / Digital Platforms Project Manager</b> | National Directorate for Security "
            "Database Management, Ministry of National Security | 2024 - Present | Argentina",
            role,
        ),
        b(
            "Development and implementation of institutional platforms, from user discovery and functional "
            "definition through production rollout."
        ),
        b(
            "Integration of AI capabilities into platforms and participation in the model lifecycle: data "
            "preparation and validation, experimentation, deployment, monitoring, and iterative improvement."
        ),
        b(
            "Application of MLOps practices to organize model versions, traceability, evaluation, and operation, "
            "including neural networks and text and image models."
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
            "<b>CUFRE - Case Management and Prioritization Platform</b> | Ministry of National Security | "
            "2024 - Present<br/>CRUD platform built with Java, Spring Boot, React, Maven, and Oracle to prioritize "
            "and track critical records, with a focus on traceability and cross-team coordination."
        ),
        p(
            "<b>SIFEBU - Federal Missing Persons Search System</b> | Ministry of National Security | "
            "2024 - Present<br/>Development of a federal system with JavaScript, TypeScript, React, and Oracle, "
            "focused on information availability, protection, and quality."
        ),
        p(
            "<b>CRIACO - Territorial Analysis and GIS Platform</b> | Ministry of National Security | "
            "2024 - Present<br/>Development of a territorial analysis platform with GIS components, maps, "
            "information layers, and data visualization."
        ),
        p(
            "<b>OSINTARGY</b> | Private project | 2024 - Present<br/>Platform and training space covering OSINT "
            "tools, digital investigation, data handling, and privacy best practices for small businesses."
        ),
        h("EDUCATION"),
        p(
            "<b>Systems Analyst</b> | ORT Argentina Higher Institute | 2024 - 2026<br/>Degree awarded."
        ),
        p(
            "<b>Bachelor's Degree in Security, focus on Criminal Investigation</b> | University Institute of the "
            "Argentine Federal Police | 2020 - 2025<br/>Training in investigation, information analysis, work "
            "methodologies, and the study of complex security-related phenomena."
        ),
        p(
            "<b>Google Data Analytics Professional Certificate</b> | Google / Coursera | 2024<br/>Eight-course "
            "certificate covering data preparation, cleaning, analysis, and communication using SQL, Tableau, "
            "R, and spreadsheets."
        ),
        h("CORE SKILLS"),
        p(
            "<b>Forward Deployed Engineering target:</b> user discovery, requirements gathering, "
            "functional-to-technical translation, integration, documentation, training, and production rollout."
        ),
        p(
            "<b>AI and MLOps:</b> model lifecycle, data preparation and validation, experimentation, versioning, "
            "deployment, monitoring, and continuous improvement; neural networks, Hugging Face, QLoRA, and text "
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
            "<b>English:</b> Intermediate. Strong technical reading comprehension; experience in meetings and "
            "vendor interviews to coordinate technology acquisitions."
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
        title="Ivan Agustin Zarate - Software Analyst and Project Manager",
        author="Ivan Agustin Zarate",
        subject="English curriculum vitae",
        creator="ZarateXP Portfolio",
        pageCompression=1,
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
