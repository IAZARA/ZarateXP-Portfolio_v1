#!/usr/bin/env python3
"""Genera index.html: "Mi PC", zoom infinito por la carrera de Ivan Zarate en estética Windows XP.

Cada texto existe en español y en inglés (`.es` / `.en`); la variable `lang` de la composición
elige cuál se ve. Correr `python3 build.py` después de cambiar textos o tiempos.
"""

import sys
from html import escape
from pathlib import Path

# `python3 build.py en` deja el inglés como idioma por defecto (sirve para revisar con snapshot)
DEFAULT_LANG = "en" if "en" in sys.argv[1:] else "es"

W, H = 1920, 1080
DUR = 32.0

# ---------------------------------------------------------------- textos
T = {
    "hook_title": ("¿Qué hay en mi PC?", "What's on my PC?"),
    "hook_body": ("Ivan Zarate · Buenos Aires", "Ivan Zarate · Buenos Aires"),
    "mypc": ("Mi PC", "My Computer"),
    "mydocs": ("Mis documentos", "My Documents"),
    "recycle": ("Papelera de reciclaje", "Recycle Bin"),
    "menu": ("Archivo   Edición   Ver   Favoritos   Herramientas   Ayuda",
             "File   Edit   View   Favorites   Tools   Help"),
    "address": ("Dirección", "Address"),
    "go": ("Ir", "Go"),
    "details": ("Detalles", "Details"),
    "other": ("Otros sitios", "Other Places"),
    "folder_type": ("Carpeta de archivos", "File Folder"),
    "local_disk": ("Disco local", "Local Disk"),
    "hdd": ("Unidades de disco duro", "Hard Disk Drives"),
    "removable": ("Dispositivos con almacenamiento extraíble", "Devices with Removable Storage"),
    "dvd": ("Unidad de DVD (D:)", "DVD Drive (D:)"),
    "drive_used": ("10 años de datos", "10 years of data"),
    "start": ("Inicio", "start"),
    # carpetas
    "f_pfa": ("2016 Policía Federal", "2016 Federal Police"),
    "f_min": ("2024 Ministerio de Seguridad", "2024 Ministry of Security"),
    "f_acsys": ("2026 ACSYS", "2026 ACSYS"),
    "f_inv": ("Investigación", "Research"),
    "f_prog": ("Archivos de programa", "Program Files"),
    "f_dset": ("Documents and Settings", "Documents and Settings"),
    "f_win": ("WINDOWS", "WINDOWS"),
    # PFA
    "pfa_db": ("Bases de datos públicas", "Public databases"),
    "pfa_priv": ("Privacidad y resguardo", "Privacy and data protection"),
    "pfa_osint": ("Investigación digital", "Digital investigations"),
    "pfa_team": ("Coordinación de equipos", "Team coordination"),
    "pfa_t": ("Policía Federal Argentina", "Argentine Federal Police"),
    "pfa_b": ("2016-2024 · Bases de datos públicas, privacidad e investigación digital.",
              "2016-2024 · Public databases, privacy and digital investigations."),
    # Ministerio
    "min_sifebu": ("SIFEBU · búsqueda federal de personas", "SIFEBU · federal missing-persons search"),
    "min_cufre": ("CUFRE · priorización de casos", "CUFRE · case prioritization"),
    "min_criaco": ("CRIACO · análisis territorial GIS", "CRIACO · GIS territorial analysis"),
    "min_t": ("Ministerio de Seguridad Nacional", "Ministry of National Security"),
    "min_b": ("2024-2026 · Plataformas sobre bases de datos críticas, de punta a punta.",
              "2024-2026 · Platforms on critical databases, end to end."),
    # ACSYS
    "ac_disc": ("Discovery.doc", "Discovery.doc"),
    "ac_arch": ("Arquitectura de IA.vsd", "AI architecture.vsd"),
    "ac_rag": ("RAG seguro.cfg", "Secure RAG.cfg"),
    "ac_poc": ("Prueba de concepto", "Proof of concept"),
    "ac_t": ("AI Solution Architect", "AI Solution Architect"),
    "ac_b": ("ACSYS · 2026 · Del problema de negocio a una IA segura y lista para implementar.",
             "ACSYS · 2026 · From a business problem to secure AI, ready to build."),
    # Investigación
    "inv_atlas": ("Atlas Urbano", "Atlas Urbano"),
    "inv_q": ("pregunta.txt", "question.txt"),
    # Atlas
    "at_title": ("Atlas Urbano · atlas.iazarate.com", "Atlas Urbano · atlas.iazarate.com"),
    "at_q": ("¿Qué altura máxima permite esta parcela?", "What is the maximum height for this parcel?"),
    "at_draft": ("Borrador del agente", "Agent draft"),
    "at_l1": ("Uso permitido: residencial y comercial", "Permitted use: residential and commercial"),
    "at_l2a": ("Altura máxima:", "Maximum height:"),
    "at_l2b": ("38 m", "38 m"),
    "at_fake": ("inventado", "made up"),
    "at_review": ("Revisión", "Review"),
    "at_fix": ("Altura máxima: dato faltante, la fuente no lo informa", "Maximum height: missing, the source does not say"),
    "at_count_lbl": ("borradores corregidos por la revisión", "drafts corrected by the review"),
    "at_count_sub": ("en consultas complejas medidas", "in measured complex queries"),
    "at_status": ("Ejemplo ilustrativo del flujo · métrica real de Atlas Urbano",
                  "Illustrative example of the flow · real Atlas Urbano metric"),
    # Bloc de notas
    "np_title": ("pregunta.txt - Bloc de notas", "question.txt - Notepad"),
    "np_menu": ("Archivo   Edición   Formato   Ver   Ayuda", "File   Edit   Format   View   Help"),
    "np_l1": ("Mi próximo paso, seguridad de IA:", "My next step, AI safety:"),
    "np_l2": ("¿Cuándo un agente inventa", "When does an agent make things up"),
    "np_l3": ("en vez de decir que no sabe?", "instead of saying it doesn't know?"),
    # tarjeta final
    "end_begin": ("Para comenzar, hacé clic en mi nombre", "To begin, click my name"),
    "end_role": ("AI Solution Architect · ACSYS", "AI Solution Architect · ACSYS"),
    "end_research": ("Datos críticos, seguridad e IA", "Critical data, security and AI"),
    "end_url": ("iazara.github.io/ZarateXP-Portfolio_v1", "iazara.github.io/ZarateXP-Portfolio_v1"),
    "end_next": ("Investigación en seguridad de IA", "AI safety research"),
}


def t(key, cls=""):
    es, en = T[key]
    c = f' class="{cls}"' if cls else ""
    return f'<span{c}><span class="es">{escape(es)}</span><span class="en">{escape(en)}</span></span>'


# ---------------------------------------------------------------- íconos (SVG propio, viewBox 48)
SYMBOLS = """
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
 <defs>
  <linearGradient id="g-folder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#F0C04A"/></linearGradient>
  <linearGradient id="g-folder-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3CF6B"/><stop offset="1" stop-color="#D9A531"/></linearGradient>
  <linearGradient id="g-grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECEEF1"/><stop offset="1" stop-color="#BFC5CE"/></linearGradient>
  <linearGradient id="g-drive" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6F8"/><stop offset="1" stop-color="#AEB6C2"/></linearGradient>
  <linearGradient id="g-page" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E9F2"/></linearGradient>
 </defs>
 <symbol id="i-folder" viewBox="0 0 48 48">
  <path d="M3 11.5a2 2 0 0 1 2-2h12.5l3.5 4h22a2 2 0 0 1 2 2V39a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="url(#g-folder-back)" stroke="#A97B16" stroke-width="1.2"/>
  <path d="M3 19.5a2 2 0 0 1 2-2h38a2 2 0 0 1 2 2V39a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="url(#g-folder)" stroke="#A97B16" stroke-width="1.2"/>
  <path d="M5 20.5h38" stroke="#FFF6D2" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-folder-grey" viewBox="0 0 48 48">
  <path d="M3 11.5a2 2 0 0 1 2-2h12.5l3.5 4h22a2 2 0 0 1 2 2V39a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#C9CDD3" stroke="#8D939C" stroke-width="1.2"/>
  <path d="M3 19.5a2 2 0 0 1 2-2h38a2 2 0 0 1 2 2V39a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="url(#g-grey)" stroke="#8D939C" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-drive" viewBox="0 0 48 48">
  <rect x="3" y="15" width="42" height="20" rx="3" fill="url(#g-drive)" stroke="#6F7885" stroke-width="1.2"/>
  <rect x="7" y="27" width="22" height="3" rx="1" fill="#59616C"/>
  <circle cx="38" cy="28.5" r="2.4" fill="#39D353" stroke="#1F7A33" stroke-width=".8"/>
  <path d="M5 17.5h38" stroke="#FFFFFF" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-dvd" viewBox="0 0 48 48">
  <rect x="3" y="21" width="42" height="16" rx="3" fill="url(#g-drive)" stroke="#6F7885" stroke-width="1.2"/>
  <circle cx="24" cy="15" r="11" fill="#E9EDF5" stroke="#8D939C" stroke-width="1.2"/>
  <circle cx="24" cy="15" r="3" fill="#FFFFFF" stroke="#8D939C"/>
  <rect x="30" y="30" width="10" height="2.4" rx="1" fill="#59616C"/>
 </symbol>
 <symbol id="i-db" viewBox="0 0 48 48">
  <path d="M9 11v26c0 3.3 6.7 6 15 6s15-2.7 15-6V11" fill="#3D7BD8" stroke="#1D4F9E" stroke-width="1.2"/>
  <ellipse cx="24" cy="11" rx="15" ry="6" fill="#8DB6F2" stroke="#1D4F9E" stroke-width="1.2"/>
  <path d="M9 20c0 3.3 6.7 6 15 6s15-2.7 15-6M9 29c0 3.3 6.7 6 15 6s15-2.7 15-6" fill="none" stroke="#BFD6F8" stroke-width="1.4"/>
 </symbol>
 <symbol id="i-doc" viewBox="0 0 48 48">
  <path d="M10 4h20l9 9v31H10z" fill="url(#g-page)" stroke="#5B6B85" stroke-width="1.2"/>
  <path d="M30 4v9h9" fill="#D5DCE8" stroke="#5B6B85" stroke-width="1.2"/>
  <rect x="10" y="4" width="20" height="5" fill="#2B5BD7"/>
  <path d="M15 19h19M15 24h19M15 29h19M15 34h13" stroke="#7D8EAD" stroke-width="1.6"/>
 </symbol>
 <symbol id="i-lock" viewBox="0 0 48 48">
  <path d="M10 4h20l9 9v31H10z" fill="url(#g-page)" stroke="#5B6B85" stroke-width="1.2"/>
  <path d="M30 4v9h9" fill="#D5DCE8" stroke="#5B6B85" stroke-width="1.2"/>
  <path d="M19 26v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#8A6A12" stroke-width="2.4"/>
  <rect x="16.5" y="25.5" width="15" height="11" rx="2" fill="#E8B23A" stroke="#8A6A12" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-sheet" viewBox="0 0 48 48">
  <path d="M10 4h20l9 9v31H10z" fill="url(#g-page)" stroke="#4E7A55" stroke-width="1.2"/>
  <path d="M30 4v9h9" fill="#D3E6D5" stroke="#4E7A55" stroke-width="1.2"/>
  <path d="M14 18h21v20H14zM14 23h21M14 28h21M14 33h21M21 18v20M28 18v20" fill="#EAF6EC" stroke="#2E9E4F" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-diagram" viewBox="0 0 48 48">
  <path d="M10 4h20l9 9v31H10z" fill="url(#g-page)" stroke="#5B6B85" stroke-width="1.2"/>
  <path d="M30 4v9h9" fill="#D5DCE8" stroke="#5B6B85" stroke-width="1.2"/>
  <rect x="14" y="17" width="9" height="7" rx="1" fill="#F28C28"/>
  <rect x="26" y="17" width="9" height="7" rx="1" fill="#2B5BD7"/>
  <rect x="20" y="31" width="9" height="7" rx="1" fill="#2E9E4F"/>
  <path d="M18.5 24v4h12v-4M24.5 28v3" fill="none" stroke="#444" stroke-width="1.2"/>
 </symbol>
 <symbol id="i-flask" viewBox="0 0 48 48">
  <path d="M19 5h10M21 5v12L10 38a3 3 0 0 0 2.7 4.4h22.6A3 3 0 0 0 38 38L27 17V5" fill="#F4F0FB" stroke="#5E3C99" stroke-width="1.6"/>
  <path d="M14 31h20l3.6 7a2 2 0 0 1-1.8 2.9H12.2a2 2 0 0 1-1.8-2.9z" fill="#8E5BD8"/>
 </symbol>
 <symbol id="i-osint" viewBox="0 0 48 48">
  <use href="#i-folder"/>
  <circle cx="29" cy="28" r="7" fill="#DCEBFF" stroke="#1D3F7A" stroke-width="2.4"/>
  <path d="M34 33l7 7" stroke="#1D3F7A" stroke-width="3.6" stroke-linecap="round"/>
 </symbol>
 <symbol id="i-app-search" viewBox="0 0 48 48">
  <rect x="4" y="4" width="40" height="40" rx="9" fill="#2B5BD7" stroke="#163A94" stroke-width="1.2"/>
  <circle cx="20" cy="17" r="5" fill="#FFFFFF"/>
  <path d="M11 33c0-6 4-9.5 9-9.5s9 3.5 9 9.5z" fill="#FFFFFF"/>
  <circle cx="31" cy="29" r="6" fill="none" stroke="#FFD34D" stroke-width="3"/>
  <path d="M35.5 33.5l5 5" stroke="#FFD34D" stroke-width="3.4" stroke-linecap="round"/>
 </symbol>
 <symbol id="i-app-cases" viewBox="0 0 48 48">
  <rect x="4" y="4" width="40" height="40" rx="9" fill="#C0392B" stroke="#7E2219" stroke-width="1.2"/>
  <rect x="11" y="12" width="26" height="5" rx="1.5" fill="#FFFFFF"/>
  <rect x="11" y="21" width="20" height="5" rx="1.5" fill="#FFFFFF" opacity=".85"/>
  <rect x="11" y="30" width="14" height="5" rx="1.5" fill="#FFFFFF" opacity=".7"/>
  <path d="M33 22v14M33 22h7l-2 3 2 3h-7" fill="#FFD34D" stroke="#FFD34D" stroke-width="1.6" stroke-linejoin="round"/>
 </symbol>
 <symbol id="i-app-map" viewBox="0 0 48 48">
  <rect x="4" y="4" width="40" height="40" rx="9" fill="#2E9E4F" stroke="#1B6A33" stroke-width="1.2"/>
  <path d="M9 14l10-4 10 4 10-4v24l-10 4-10-4-10 4z" fill="#DFF3E4" stroke="#1B6A33" stroke-width="1.2"/>
  <path d="M19 10v24M29 14v24" stroke="#1B6A33" stroke-width="1.2"/>
  <path d="M29 30s-6-6.5-6-10.5a6 6 0 0 1 12 0C35 23.5 29 30 29 30z" fill="#D8282F" stroke="#7E1418" stroke-width="1"/>
  <circle cx="29" cy="19.5" r="2.2" fill="#FFFFFF"/>
 </symbol>
 <symbol id="i-recycle" viewBox="0 0 48 48">
  <path d="M12 14h24l-2.5 28a2 2 0 0 1-2 1.8H16.5a2 2 0 0 1-2-1.8z" fill="#DCE8F7" stroke="#5B6B85" stroke-width="1.2"/>
  <rect x="9" y="9" width="30" height="5" rx="2" fill="#BFD3EE" stroke="#5B6B85" stroke-width="1.2"/>
  <path d="M19 19l1 19M24 19v19M29 19l-1 19" stroke="#9FB4D3" stroke-width="1.6"/>
 </symbol>
 <symbol id="i-cursor" viewBox="0 0 24 36">
  <path d="M1.5 1.5v27.5l6.6-6.4 4.6 10.6 4.4-1.9-4.6-10.4h9.2z" fill="#FFFFFF" stroke="#000000" stroke-width="1.6" stroke-linejoin="round"/>
 </symbol>
 <symbol id="i-info" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="21" fill="#2B6CF2" stroke="#123E9B" stroke-width="2"/>
  <circle cx="24" cy="14" r="3.4" fill="#FFFFFF"/>
  <rect x="20.5" y="20" width="7" height="17" rx="2" fill="#FFFFFF"/>
 </symbol>
</svg>
"""


def icon(sym, size):
    if sym.startswith("img:"):
        return f'<img class="ico" src="{sym[4:]}" width="{size}" height="{size}" alt="">'
    return f'<svg class="ico" width="{size}" height="{size}" viewBox="0 0 48 48"><use href="#{sym}"/></svg>'


# ---------------------------------------------------------------- geometría de las ventanas
TB_H, MENU_H, ADDR_H = 60, 40, 64
BODY_Y = TB_H + MENU_H + ADDR_H  # 164
WIN_H = 1016
PANE_W = 420
TILE_W, TILE_X0, TILE_STEP = 270, 460, 280
ROW_Y = 600          # fila de archivos en niveles con globo
ICON = 144


def tile_xy(i, row_y=ROW_Y):
    x = TILE_X0 + i * TILE_STEP
    return x, row_y


def tile_center(i, row_y=ROW_Y):
    x, y = tile_xy(i, row_y)
    return x + TILE_W / 2, y + ICON / 2


# ---------------------------------------------------------------- tiempos (segundos)
DBL_GAP = 0.14
ZOOM_LEN = 0.55
ENTER_LEAD = 0.15     # el nivel nuevo arranca antes de que termine el zoom anterior
ENTER_LEN = 0.75
TYPE_STEP = 0.035

# niveles: (id, inicio del zoom de salida)
LEVELS = []
JS = []          # líneas del timeline
AUDIO = []       # (id, src, start, dur, vol)


def a(src, start, dur, vol):
    AUDIO.append((f"a{len(AUDIO) + 1}", src, round(start, 3), dur, vol))


SFX = {  # momento de golpe dentro de cada archivo (medido con `hyperframes audio`)
    "click": (0.073, 0.37), "whoosh": (0.162, 0.575), "whoosh-short": (0.162, 0.575),
    "pop": (0.12, 0.72), "impact-bass-1": (0.073, 2.116), "key-press": (0.076, 0.4), "typing": (0.454, 1.5),
}
FRAME = 1 / 30


def hit(name, at, vol):
    """Coloca un efecto para que su golpe caiga un cuadro después de la imagen."""
    peak, dur = SFX[name]
    a(f"assets/sfx/{name}.mp3", max(0.0, at - peak + FRAME), dur, vol)


whoosh_takes = [("whoosh", 0.55), ("whoosh-short", 0.42), ("whoosh", 0.36)]


def js(line):
    JS.append(line)


def cursor_path(sel, pts):
    """pts: lista de (t, x, y, dur). Mueve el cursor a (x, y) terminando en t."""
    first = True
    for (tt, x, y, d) in pts:
        if first:
            js(f'tl.set("{sel}", {{x:{x}, y:{y}}}, 0);')
            first = False
            continue
        js(f'tl.to("{sel}", {{x:{x}, y:{y}, duration:{d}, ease:"power2.inOut"}}, {tt - d:.3f});')


def double_click(sel_cursor, label_sel, at):
    for k in range(2):
        tc = at + k * DBL_GAP
        js(f'tl.to("{sel_cursor} .cur", {{scale:0.88, duration:0.05, ease:"power2.out"}}, {tc:.3f});')
        js(f'tl.to("{sel_cursor} .cur", {{scale:1, duration:0.06, ease:"power2.out"}}, {tc + 0.05:.3f});')
        hit("click", tc, 0.9)
    if label_sel:
        js(f'tl.set("{label_sel}", {{backgroundColor:"#316AC5", color:"#FFFFFF"}}, {at:.3f});')


def zoom_out(level_id, cx, cy, t0):
    """El nivel se agranda alrededor del ícono hasta que el ícono llena el cuadro."""
    IR = "" if level_id == "L0" else ", immediateRender:false"  # L1+ ya tienen el tween de entrada
    js(f'tl.fromTo("#{level_id} > .cam", {{scale:1, transformOrigin:"{cx}px {cy}px"}}, '
       f'{{scale:14, duration:{ZOOM_LEN}, ease:"power3.in"{IR}}}, {t0:.3f});')
    take, vol = whoosh_takes[len([x for x in AUDIO if "whoosh" in x[1]]) % len(whoosh_takes)]
    hit(take, t0 + ZOOM_LEN - 0.05, vol)


def zoom_in(level_id, cx, cy, t_enter):
    js(f'tl.fromTo("#{level_id} > .cam", {{x:{cx - W / 2:.1f}, y:{cy - H / 2:.1f}, scale:0.07, transformOrigin:"50% 50%"}}, '
       f'{{x:0, y:0, scale:1, duration:{ENTER_LEN}, ease:"expo.out"}}, {t_enter:.3f});')


def type_chars(prefix_sel, n_es, n_en, t0, step=TYPE_STEP, sound=True):
    """Muestra caracteres uno por uno. Los spans se llaman <prefix>-es-<i> / -en-<i>."""
    for lang, n in (("es", n_es), ("en", n_en)):
        for i in range(n):
            js(f'tl.set("{prefix_sel}-{lang}-{i}", {{opacity:1}}, {t0 + i * step:.3f});')
    if sound:
        n = max(n_es, n_en)
        for k in range(0, n, 4):
            hit("key-press", t0 + k * step, 0.5)


def char_spans(prefix_id, text, lang):
    return "".join(
        f'<span id="{prefix_id}-{lang}-{i}" class="ch">{escape(c) if c != " " else "&nbsp;"}</span>'
        for i, c in enumerate(text)
    )


def typed(key, prefix_id):
    es, en = T[key]
    return (f'<span class="es">{char_spans(prefix_id, es, "es")}</span>'
            f'<span class="en">{char_spans(prefix_id, en, "en")}</span>'), len(es), len(en)


# ---------------------------------------------------------------- piezas de HTML
def balloon(bid, title_key, body_key, x, y, w, tail_x):
    return f"""
    <div id="{bid}" class="balloon" style="left:{x}px; top:{y}px; width:{w}px;">
      <svg class="tail" width="60" height="44" style="left:{tail_x}px" viewBox="0 0 60 44"><path d="M8 44 L30 2 L52 44" fill="#FFFFE1" stroke="#1A1A1A" stroke-width="2.5"/></svg>
      <div class="b-close">×</div>
      <div class="b-head">{icon("i-info", 46)}<div class="b-title">{t(title_key)}</div></div>
      <div class="b-body">{t(body_key)}</div>
    </div>"""


def file_tile(fid, sym, label_key, i, row_y=ROW_Y, dim=False, sub=None):
    x, y = tile_xy(i, row_y)
    cls = "tile dim" if dim else "tile"
    sub_html = f'<div class="t-sub">{t(sub)}</div>' if sub else ""
    return f"""
      <div id="{fid}" class="{cls}" style="left:{x - PANE_W}px; top:{y - BODY_Y}px; width:{TILE_W}px;">
        {icon(sym, ICON)}
        <div class="t-label">{t(label_key)}</div>{sub_html}
      </div>"""


def window(level_id, title_sym, title_key, path_prefix, typed_key, pane_name_key, pane_type_key, pane_date, content):
    """Ventana de Explorador maximizada. path_prefix: (es, en) ya escrito; typed_key: segmento que se tipea."""
    if typed_key:
        typed_html, n_es, n_en = typed(typed_key, f"{level_id}-p")
    else:
        typed_html, n_es, n_en = "", 0, 0
    pre_es, pre_en = path_prefix
    title_icon = icon(title_sym, 34)
    date_html = f'<div class="p-line">{escape(pane_date)}</div>' if pane_date else ""
    html = f"""
  <div id="{level_id}" class="clip level" data-start="{{start}}" data-duration="{{dur}}" data-track-index="1">
   <div class="cam">
    <div class="win">
     <div class="tb">{title_icon}<div class="tt">{t(title_key)}</div>
       <div class="tbb"><i class="b-min"></i><i class="b-max"></i><i class="b-x">×</i></div></div>
     <div class="menu">{t("menu")}</div>
     <div class="addr"><span class="addr-l">{t("address")}</span>
       <div class="field">{icon(title_sym, 30)}<span class="path"><span class="es">{escape(pre_es)}</span><span class="en">{escape(pre_en)}</span>{typed_html}</span></div>
       <div class="go">➜ {t("go")}</div></div>
     <div class="body">
      <aside class="pane">
       <div class="box"><div class="box-h">{t("details")}</div>
         <div class="box-b"><div class="p-name">{t(pane_name_key)}</div><div class="p-line">{t(pane_type_key)}</div>{date_html}</div></div>
       <div class="box"><div class="box-h">{t("other")}</div>
         <div class="box-b"><div class="p-link">{icon("img:assets/img/tango-my-computer.svg", 30)}{t("mypc")}</div>
         <div class="p-link">{icon("img:assets/img/tango-documents.svg", 30)}{t("mydocs")}</div></div></div>
      </aside>
      <main class="content">{content}</main>
     </div>
    </div>
    <!--EXTRA-->
   </div>
  </div>"""
    return html, n_es, n_en


def cursor(cid):
    return f'<div id="{cid}" class="cursor"><svg class="cur" width="44" height="66" viewBox="0 0 24 36"><use href="#i-cursor"/></svg></div>'


# ---------------------------------------------------------------- construcción de la película
parts = []
clips = {}  # level_id -> (start, end)

# ---------- L0 escritorio (cámara cerrada sobre Mi PC)
DESK_SCALE = 2.0
desk_icons = [("img:assets/img/tango-my-computer.svg", "mypc", 0), ("img:assets/img/tango-documents.svg", "mydocs", 1),
              ("i-recycle", "recycle", 2)]
DI_X, DI_Y0, DI_STEP, DI_ICON = 36, 30, 160, 96


def desktop_icons(prefix):
    out = []
    for sym, key, k in desk_icons:
        out.append(f'<div id="{prefix}-{key}" class="dicon" style="left:{DI_X}px; top:{DI_Y0 + k * DI_STEP}px;">'
                   f'{icon(sym, DI_ICON)}<div class="d-label">{t(key)}</div></div>')
    return "".join(out)


# Mi PC en coordenadas del escritorio: centro del ícono
MIPC_DX, MIPC_DY = DI_X + 70, DI_Y0 + DI_ICON / 2           # 106, 78 (la etiqueta tiene 140 de ancho)
# encuadre: el ícono queda en (520, 430) de pantalla
L0_TX, L0_TY = 520 - MIPC_DX * DESK_SCALE, 430 - MIPC_DY * DESK_SCALE
L0_ICX, L0_ICY = 520, 430

parts.append(f"""
  <div id="L0" class="clip level desk" data-start="0" data-duration="{{dur}}" data-track-index="1">
   <div class="cam">
    <img class="wall" src="assets/img/wallpaper.webp" width="1920" height="1080" alt="">
    <div class="desk-inner" id="L0-inner">
      {desktop_icons("L0")}
    </div>
    {balloon("L0-b", "hook_title", "hook_body", 680, 270, 1100, 60).replace('class="balloon"', 'class="balloon hook"')}
    {cursor("L0-c")}
   </div>
  </div>""")
js(f'tl.set("#L0-inner", {{x:{L0_TX}, y:{L0_TY}, scale:{DESK_SCALE}, transformOrigin:"0px 0px"}}, 0);')
# globo apuntando a la izquierda: se gira la cola con CSS (.hook)
cursor_path("#L0-c", [(0, 1480, 860, 0), (1.45, L0_ICX + 10, L0_ICY + 10, 0.95)])
js('tl.to("#L0-b", {scale:0.2, opacity:0, duration:0.15, ease:"power2.in", transformOrigin:"0% 50%"}, 1.55);')
double_click("#L0-c", "#L0-mypc .d-label", 1.6)
T0 = 1.95
zoom_out("L0", L0_ICX, L0_ICY, T0)
clips["L0"] = (0, T0 + ZOOM_LEN)

# ---------- niveles de carpeta
LANG_PATH = {"es": "", "en": ""}


def next_level(level_id, enter_t, title_sym, title_key, prefix, typed_key, pane, content, extra=""):
    html, n_es, n_en = window(level_id, title_sym, title_key, prefix, typed_key, *pane, content)
    html = html.replace("<!--EXTRA-->", extra)
    parts.append(html)
    if typed_key:
        type_chars(f"#{level_id}-p", n_es, n_en, enter_t + 0.5)
    return n_es, n_en


def prev_icon_center():
    return None


# L1 Mi PC: disco C:
t1 = T0 + ZOOM_LEN - ENTER_LEAD                      # 2.35
zoom_in("L1", L0_ICX, L0_ICY, t1)
drive_x, drive_y = 480, 300
L1_content = f"""
      <div class="group-h" style="top:{BODY_Y + 44 - BODY_Y}px">{t("hdd")}</div>
      <div id="L1-drive" class="drive" style="left:{drive_x - PANE_W}px; top:{drive_y - BODY_Y}px;">
        {icon("i-drive", ICON)}
        <div class="drive-info"><div class="t-label big"><span>IVAN (C:)</span></div>
          <div class="bar"><div id="L1-fill" class="fill"></div></div>
          <div class="bar-l"><span>2016</span><span class="mid">{t("drive_used")}</span><span>2026</span></div></div>
      </div>
      <div class="group-h" style="top:{560 - BODY_Y}px">{t("removable")}</div>
      <div class="drive dim" style="left:{drive_x - PANE_W}px; top:{620 - BODY_Y}px;">{icon("i-dvd", ICON)}
        <div class="drive-info"><div class="t-label big">{t("dvd")}</div></div></div>
"""
next_level("L1", t1, "img:assets/img/tango-my-computer.svg", "mypc", ("Mi PC", "My Computer"), None,
           ("mypc", "local_disk", ""), L1_content, cursor("L1-c"))
js(f'tl.fromTo("#L1-fill", {{scaleX:0}}, {{scaleX:1, duration:0.9, ease:"power2.inOut", transformOrigin:"0% 50%"}}, {t1 + 0.55:.3f});')
DRIVE_CX, DRIVE_CY = drive_x + ICON / 2, drive_y + ICON / 2
cursor_path("#L1-c", [(0, 1500, 900, 0), (t1 + 1.45, DRIVE_CX + 8, DRIVE_CY + 8, 0.8)])
double_click("#L1-c", "#L1-drive .t-label", t1 + 1.55)
z1 = t1 + 1.75
zoom_out("L1", DRIVE_CX, DRIVE_CY, z1)
clips["L1"] = (t1, z1 + ZOOM_LEN)

# L2 C:\
t2 = z1 + ZOOM_LEN - ENTER_LEAD
zoom_in("L2", DRIVE_CX, DRIVE_CY, t2)
L2_row = 420
L2_content = "".join([
    file_tile("L2-prog", "i-folder-grey", "f_prog", 0, L2_row, dim=True),
    file_tile("L2-dset", "i-folder-grey", "f_dset", 1, L2_row, dim=True),
    file_tile("L2-win", "i-folder-grey", "f_win", 2, L2_row, dim=True),
    file_tile("L2-pfa", "i-folder", "f_pfa", 3, L2_row),
])
next_level("L2", t2, "i-drive", "local_disk", ("", ""), None, ("local_disk", "local_disk", "IVAN (C:)"),
           L2_content, cursor("L2-c"))
# la ruta de C:\ se escribe
parts[-1] = parts[-1].replace('<span class="path"><span class="es"></span><span class="en"></span>',
                              '<span class="path"><span>C:\\</span>')
c2x, c2y = tile_center(3, L2_row)
cursor_path("#L2-c", [(0, 900, 950, 0), (t2 + 1.0, c2x + 8, c2y + 8, 0.6)])
double_click("#L2-c", "#L2-pfa .t-label", t2 + 1.1)
z2 = t2 + 1.3
zoom_out("L2", c2x, c2y, z2)
clips["L2"] = (t2, z2 + ZOOM_LEN)


def career_level(level_id, t_enter, folder_key, prefix, files, balloon_keys, next_index, pane_date, read_hold):
    """Nivel con globo + fila de archivos; la última carpeta es la siguiente parada."""
    zoom_in(level_id, *PREV[0], t_enter)
    content = "".join(file_tile(f"{level_id}-f{i}", sym, key, i, sub=sub) for i, (sym, key, sub) in enumerate(files))
    bal = balloon(f"{level_id}-b", *balloon_keys, 470 - PANE_W, 200 - BODY_Y, 1180, 120)
    next_level(level_id, t_enter, "i-folder", folder_key, prefix, folder_key,
               (folder_key, "folder_type", pane_date), content + bal, cursor(f"{level_id}-c"))
    tb = t_enter + 0.9
    js(f'tl.fromTo("#{level_id}-b", {{scale:0.6, opacity:0, transformOrigin:"{120 + 30}px 0px"}}, '
       f'{{scale:1, opacity:1, duration:0.3, ease:"back.out(1.6)"}}, {tb:.3f});')
    hit("pop", tb + 0.05, 0.8)
    t_leave = tb + read_hold
    js(f'tl.to("#{level_id}-b", {{scale:0.6, opacity:0, duration:0.15, ease:"power2.in"}}, {t_leave:.3f});')
    nx, ny = tile_center(next_index)
    cursor_path(f"#{level_id}-c", [(0, 1480, 880, 0), (t_leave + 0.05, nx + 8, ny + 8, 0.75)])
    double_click(f"#{level_id}-c", f"#{level_id}-f{next_index} .t-label", t_leave + 0.15)
    z = t_leave + 0.35
    zoom_out(level_id, nx, ny, z)
    clips[level_id] = (t_enter, z + ZOOM_LEN)
    PREV[0] = (nx, ny)
    return z + ZOOM_LEN - ENTER_LEAD


PREV = [(c2x, c2y)]
P_PFA = ("C:\\", "C:\\")
t3 = z2 + ZOOM_LEN - ENTER_LEAD
t4 = career_level("L3", t3, "f_pfa", P_PFA, [
    ("i-db", "pfa_db", None), ("i-lock", "pfa_priv", None), ("i-osint", "pfa_osint", None),
    ("i-sheet", "pfa_team", None), ("i-folder", "f_min", None)],
    ("pfa_t", "pfa_b"), 4, "2016 - 2024", 2.6)
P_MIN = ("C:\\2016 Policía Federal\\", "C:\\2016 Federal Police\\")
t5 = career_level("L4", t4, "f_min", P_MIN, [
    ("i-app-search", "min_sifebu", None), ("i-app-cases", "min_cufre", None), ("i-app-map", "min_criaco", None),
    ("i-folder", "f_acsys", None)],
    ("min_t", "min_b"), 3, "2024 - 2026", 2.6)
P_AC = (P_MIN[0] + "2024 Ministerio de Seguridad\\", P_MIN[1] + "2024 Ministry of Security\\")
t6 = career_level("L5", t5, "f_acsys", P_AC, [
    ("i-doc", "ac_disc", None), ("i-diagram", "ac_arch", None), ("i-lock", "ac_rag", None),
    ("i-flask", "ac_poc", None), ("i-folder", "f_inv", None)],
    ("ac_t", "ac_b"), 4, "2026 -", 2.4)

# ---------- L6 Investigación: Atlas y pregunta.txt
P_INV = (P_AC[0] + "2026 ACSYS\\", P_AC[1] + "2026 ACSYS\\")
zoom_in("L6", *PREV[0], t6)
L6_row = 380
L6_content = (file_tile("L6-atlas", "img:assets/img/atlas-icon.webp", "inv_atlas", 0, L6_row) +
              file_tile("L6-q", "img:assets/img/tango-notepad.svg", "inv_q", 1, L6_row))
next_level("L6", t6, "i-folder", "f_inv", P_INV, "f_inv", ("f_inv", "folder_type", "2026 -"), L6_content, cursor("L6-c"))
# el Bloc de notas tapa a propósito esta ventana mientras se escribe la pregunta
# (la marca tiene que estar en cada texto tapado: no se hereda)
parts[-1] = parts[-1].replace('<span', '<span data-layout-allow-occlusion')
ax, ay = tile_center(0, L6_row)
cursor_path("#L6-c", [(0, 1500, 900, 0), (t6 + 1.05, ax + 8, ay + 8, 0.6)])
double_click("#L6-c", "#L6-atlas .t-label", t6 + 1.15)
t_atlas = t6 + 1.35

# ---------- L7 ventana de Atlas (el ícono crece y se vuelve la ventana)
AT = t_atlas
parts.append(f"""
  <div id="L7" class="clip level" data-start="{{start}}" data-duration="{{dur}}" data-track-index="2">
   <div class="cam">
    <div class="win atlas">
     <div class="tb">{icon("img:assets/img/atlas-icon.webp", 34)}<div class="tt">{t("at_title")}</div>
       <div class="tbb"><i class="b-min"></i><i class="b-max"></i><i class="b-x">×</i></div></div>
     <div class="atlas-body">
       <div class="chat">
         <div class="q">{t("at_q")}</div>
         <div class="draft">
           <div class="d-h">{t("at_draft")}</div>
           <div class="d-line ok">✓ {t("at_l1")}</div>
           <div class="d-line" id="L7-bad"><span class="es">Altura máxima: </span><span class="en">Maximum height: </span><span class="fake" id="L7-fake">38 m<span id="L7-strike" class="strike"></span></span>
             <span class="tag" id="L7-tag">{t("at_fake")}</span></div>
           <div class="d-line fix" id="L7-fix"><span class="rev">{t("at_review")}</span> ✓ {t("at_fix")}</div>
         </div>
       </div>
       <div class="counter">
         <div class="num"><span class="digits">{''.join(f'<span class="dg" id="L7-n{n}">{n}</span>' for n in range(15))}</span><span class="of" id="L7-of">/ 22</span></div>
         <div class="c-l" id="L7-cl">{t("at_count_lbl")}</div>
         <div class="c-s" id="L7-cs">{t("at_count_sub")}</div>
       </div>
     </div>
     <div class="status">{t("at_status")}</div>
    </div>
   </div>
  </div>""")
js(f'tl.fromTo("#L7 > .cam", {{x:{ax - W / 2:.1f}, y:{ay - H / 2:.1f}, scale:0.075, transformOrigin:"50% 50%"}}, '
   f'{{x:0, y:0, scale:1, duration:0.7, ease:"expo.out"}}, {AT:.3f});')
hit("whoosh-short", AT + 0.12, 0.4)
# borrador: dato inventado, revisión, corrección
tb_ = AT + 0.9
js(f'tl.fromTo("#L7-fake", {{backgroundColor:"rgba(216,40,47,0)"}}, {{backgroundColor:"rgba(216,40,47,0.28)", duration:0.2}}, {tb_:.3f});')
js(f'tl.fromTo("#L7-tag", {{opacity:0, scale:0.6}}, {{opacity:1, scale:1, duration:0.3, ease:"back.out(1.6)"}}, {tb_ + 0.1:.3f});')
hit("pop", tb_ + 0.15, 0.7)
ts = tb_ + 1.0
js(f'tl.fromTo("#L7-strike", {{scaleX:0}}, {{scaleX:1, duration:0.25, ease:"power2.out", transformOrigin:"0% 50%"}}, {ts:.3f});')
js(f'tl.to("#L7-bad", {{opacity:0.45, duration:0.2}}, {ts + 0.2:.3f});')
js(f'tl.fromTo("#L7-fix", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.2, ease:"power2.out"}}, {ts + 0.35:.3f});')
hit("click", ts + 0.35, 0.6)
# contador 0 > 14, después "/ 22"
tc0 = ts + 0.75
steps = 14
for n in range(steps + 1):
    p = n / steps
    # power2.out invertido: tiempo en que el valor alcanza n
    from math import sqrt
    tt = tc0 + 1.3 * (1 - sqrt(1 - p))
    js(f'tl.set("#L7 .dg", {{opacity:0}}, {tt:.3f}); tl.set("#L7-n{n}", {{opacity:1}}, {tt:.3f});')
T_LAND = tc0 + 1.3
js(f'tl.fromTo("#L7-of", {{opacity:0, x:-30}}, {{opacity:1, x:0, duration:0.35, ease:"expo.out"}}, {T_LAND:.3f});')
hit("impact-bass-1", T_LAND, 0.45)
js(f'tl.fromTo(["#L7-cl", "#L7-cs"], {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.15, stagger:0.08}}, {T_LAND + 0.15:.3f});')
T_ATLAS_END = T_LAND + 1.9
clips["L6"] = (t6, T_ATLAS_END)
clips["L7"] = (AT, T_ATLAS_END + 0.4)

# ---------- L8 Bloc de notas (sale del botón de la barra de tareas)
NP = T_ATLAS_END
js(f'tl.set("#L6 > .cam", {{opacity:0}}, {AT + 0.75:.3f}); tl.set("#L6 > .cam", {{opacity:1}}, {NP:.3f});')
# Atlas se minimiza hacia su botón de la barra de tareas (sin fundido), después se abre el Bloc de notas
js(f'tl.to("#L7 > .cam", {{x:-560, y:500, scale:0.06, duration:0.35, ease:"power3.in", transformOrigin:"50% 50%"}}, {NP:.3f});')
js(f'tl.set("#L7 > .cam", {{opacity:0}}, {NP + 0.35:.3f});')
hit("whoosh-short", NP + 0.3, 0.3)
np1, n1e, n1n = typed("np_l1", "np1")
np2, n2e, n2n = typed("np_l2", "np2")
np3, n3e, n3n = typed("np_l3", "np3")
parts.append(f"""
  <div id="L8" class="clip level" data-start="{{start}}" data-duration="{{dur}}" data-track-index="3" data-layout-allow-occlusion>
   <div class="cam" data-layout-allow-occlusion>
    <div class="np" data-layout-allow-occlusion>
     <div class="tb" data-layout-allow-occlusion>{icon("img:assets/img/tango-notepad.svg", 34)}<div class="tt">{t("np_title")}</div>
       <div class="tbb"><i class="b-min"></i><i class="b-max"></i><i class="b-x">×</i></div></div>
     <div class="menu">{t("np_menu")}</div>
     <div class="np-page" data-layout-allow-occlusion><div class="np-l small">{np1}</div><div class="np-l">{np2}</div><div class="np-l">{np3}</div></div>
    </div>
   </div>
  </div>""")
NP_IN = NP + 0.4
js(f'tl.fromTo("#L8 > .cam", {{x:-560, y:500, scale:0.08, transformOrigin:"50% 50%"}}, '
   f'{{x:0, y:0, scale:1, duration:0.65, ease:"expo.out"}}, {NP_IN:.3f});')
hit("whoosh-short", NP_IN + 0.1, 0.35)
ty = NP_IN + 0.6
type_chars("#np1", n1e, n1n, ty, 0.03, sound=False)
ty2 = ty + max(n1e, n1n) * 0.03 + 0.2
type_chars("#np2", n2e, n2n, ty2, 0.04, sound=False)
ty3 = ty2 + max(n2e, n2n) * 0.04 + 0.1
type_chars("#np3", n3e, n3n, ty3, 0.04, sound=False)
T_TYPED = ty3 + max(n3e, n3n) * 0.04
hit("typing", ty, 0.55)
hit("typing", ty + 1.5, 0.55)
NP_HOLD_END = T_TYPED + 1.6

# ---------- salida del zoom: todo vuelve al escritorio completo
OUT = NP_HOLD_END
js(f'tl.to(["#L8 > .cam", "#L6 > .cam"], {{scale:0.04, x:{-W / 2 + MIPC_DX:.1f}, y:{-H / 2 + MIPC_DY:.1f}, duration:0.55, ease:"power3.in", transformOrigin:"50% 50%"}}, {OUT:.3f});')
clips["L6"] = (t6, OUT + 0.55)
clips["L8"] = (NP_IN, OUT + 0.55)
parts.append(f"""
  <div id="L9" class="clip level desk" data-start="{{start}}" data-duration="{{dur}}" data-track-index="1">
   <div class="cam">
    <div class="desk-inner">
      <img class="wall" src="assets/img/wallpaper.webp" width="1920" height="1080" alt="">
      {desktop_icons("L9")}
      <div class="dicon" style="left:{DI_X}px; top:{DI_Y0 + 3 * DI_STEP}px;">{icon("img:assets/img/atlas-icon.webp", DI_ICON)}<div class="d-label">{t("inv_atlas")}</div></div>
      <div class="dicon" style="left:{DI_X}px; top:{DI_Y0 + 4 * DI_STEP}px;">{icon("img:assets/img/tango-notepad.svg", DI_ICON)}<div class="d-label">{t("inv_q")}</div></div>
    </div>
   </div>
  </div>""")
T9 = OUT + 0.3
js(f'tl.fromTo("#L9 > .cam", {{scale:14, transformOrigin:"{MIPC_DX}px {MIPC_DY}px"}}, '
   f'{{scale:1, duration:0.9, ease:"expo.out"}}, {T9:.3f});')
hit("whoosh", T9 + 0.1, 0.4)

# ---------- tarjeta final: bienvenida XP
END = T9 + 1.1
parts.append(f"""
  <div id="L10" class="clip level" data-start="{{start}}" data-duration="{{dur}}" data-track-index="4">
    <div class="welcome-mid" id="L10-mid"></div>
    <div class="band top" id="L10-top"></div>
    <div class="band bottom" id="L10-bot">
      <div class="url">{t("end_url")}</div><div class="next">{t("end_next")}</div>
    </div>
    <div class="w-left" id="L10-left">
      <div class="w-big" id="L10-name">Zarate<span class="xp">XP</span></div>
      <div class="w-role" id="L10-role">{t("end_research")}</div>
      <div class="w-begin" id="L10-begin">{t("end_begin")}</div>
    </div>
    <div class="w-sep"></div>
    <div class="w-tile" id="L10-tile">
      <img class="w-av" src="assets/img/avatar.jpg" width="200" height="200" alt="">
      <div class="w-tile-t"><div class="w-tn">Ivan Zarate</div><div class="w-tr">{t("end_role")}</div></div>
    </div>
  </div>""")
js(f'tl.fromTo("#L10-top", {{yPercent:-100}}, {{yPercent:0, duration:0.45, ease:"power2.inOut"}}, {END:.3f});')
js(f'tl.fromTo("#L10-bot", {{yPercent:100}}, {{yPercent:0, duration:0.45, ease:"power2.inOut"}}, {END:.3f});')
js(f'tl.fromTo("#L10-mid", {{clipPath:"inset(50% 0% 50% 0%)"}}, {{clipPath:"inset(0% 0% 0% 0%)", duration:0.5, ease:"power2.inOut"}}, {END + 0.15:.3f});')
hit("whoosh-short", END + 0.3, 0.35)
js(f'tl.fromTo("#L10 .w-sep", {{scaleY:0}}, {{scaleY:1, duration:0.4, ease:"expo.out", transformOrigin:"50% 50%"}}, {END + 0.55:.3f});')
js(f'tl.fromTo("#L10-name", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.2, ease:"power2.out"}}, {END + 0.65:.3f});')
js(f'tl.fromTo(["#L10-role", "#L10-begin"], {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.15, stagger:0.1}}, {END + 0.85:.3f});')
js(f'tl.fromTo("#L10-tile", {{opacity:0, x:40}}, {{opacity:1, x:0, duration:0.5, ease:"expo.out"}}, {END + 0.75:.3f});')
hit("pop", END + 0.8, 0.6)
js(f'tl.fromTo("#L10 .band .url, #L10 .band .next", {{opacity:0}}, {{opacity:1, duration:0.2, stagger:0.1}}, {END + 1.0:.3f});')
clips["L9"] = (T9, END + 0.6)
clips["L10"] = (END, None)
# la duración sale del contenido: la tarjeta final queda armada y quieta ~2.2 s
DUR = round(END + 1.3 + 2.2, 1)

# ---------------------------------------------------------------- barra de tareas (fija)
task_labels = [
    ("mypc", clips["L1"][0]), ("local_disk", clips["L2"][0]), ("f_pfa", clips["L3"][0]), ("f_min", clips["L4"][0]),
    ("f_acsys", clips["L5"][0]), ("f_inv", clips["L6"][0]), ("inv_atlas", AT), ("np_title", NP_IN), (None, OUT + 0.4)]
task_html = []
for k, (key, tt) in enumerate(task_labels):
    if key is None:
        continue
    task_html.append(f'<span class="task-l" id="tk{k}">{t(key)}</span>')
    js(f'tl.set("#tk{k}", {{opacity:1}}, {tt:.3f});')
    nxt = task_labels[k + 1][1]
    js(f'tl.set("#tk{k}", {{opacity:0}}, {nxt:.3f});')
js(f'tl.set("#taskbtn", {{opacity:1}}, {clips["L1"][0]:.3f}); tl.set("#taskbtn", {{opacity:0}}, {OUT + 0.4:.3f});')
taskbar = f"""
  <div id="taskbar" class="clip" data-start="0" data-duration="{END + 0.5:.3f}" data-track-index="5">
    <div class="startbtn"><span class="flag"><i></i><i></i><i></i><i></i></span><span class="st">{t("start")}</span></div>
    <div id="taskbtn" class="taskbtn">{''.join(task_html)}</div>
    <div class="tray"><span class="tray-ico"></span>10:24</div>
  </div>"""

# ---------------------------------------------------------------- ensamblar
body = []
for p in parts:
    lid = p.split('id="', 1)[1].split('"', 1)[0]
    s, e = clips[lid]
    if lid == "L10":
        dur = DUR - s
    else:
        dur = e - s
    body.append(p.replace("{start}", f"{s:.3f}").replace("{dur}", f"{dur:.3f}"))

lanes, audio_rows = [], []
for aid, src, st, d, v in sorted(AUDIO, key=lambda x: x[2]):
    lane = next((k for k, end in enumerate(lanes) if end <= st), None)
    if lane is None:
        lanes.append(0.0)
        lane = len(lanes) - 1
    lanes[lane] = st + d
    audio_rows.append(f'  <audio id="{aid}" class="clip" src="{src}" data-start="{st}" data-duration="{d}" data-volume="{v}" data-track-index="{10 + lane}"></audio>')
audio_html = "\n".join(audio_rows)

CSS = (Path(__file__).parent / "style.css").read_text()

html = f"""<!doctype html>
<html lang="{DEFAULT_LANG}" data-lang="{DEFAULT_LANG}" data-composition-variables='[{{"id":"lang","type":"enum","label":"Idioma","default":"{DEFAULT_LANG}","options":[{{"value":"es","label":"Español"}},{{"value":"en","label":"English"}}]}}]'>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
{CSS}
</style>
</head>
<body>
{SYMBOLS}
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1920" data-height="1080" data-motion-blur="on">
{''.join(body)}
{taskbar}
{audio_html}
</div>
<script>
  (function () {{
    var vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {{}};
    document.documentElement.dataset.lang = vars.lang === "en" || vars.lang === "es" ? vars.lang : "{DEFAULT_LANG}";
    document.documentElement.lang = document.documentElement.dataset.lang;
  }})();
  window.__timelines = window.__timelines || {{}};
  const tl = gsap.timeline({{ paused: true }});
  {chr(10).join("  " + l for l in JS)}
  window.__timelines["main"] = tl;
  tl.seek(0);
</script>
</body>
</html>
"""
html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
Path(__file__).with_name("index.html").write_text(html)
print(f"index.html: {DUR}s, {len(JS)} tweens, {len(AUDIO)} sonidos, tarjeta final desde {END:.2f}s, payoff {T_LAND:.2f}s")
for k, (s, e) in clips.items():
    print(f"  {k}: {s:.2f} > {e if e is not None else DUR:.2f}")
