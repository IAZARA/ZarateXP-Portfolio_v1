#!/usr/bin/env python3
"""Genera index.html del video "Mi historia" (autobiográfico de Ivan Zarate).

python3 build.py        -> index.html con idioma por defecto "es"
python3 build.py en     -> idem con "en" por defecto (para revisar con snapshot)

Los tiempos salen de la voz de Ivan (assets/audio/voz.flac, colocada en V = 0.5 s).
"""
import json
import sys

DEFAULT_LANG = sys.argv[1] if len(sys.argv) > 1 else "es"
V = 0.5          # la voz arranca en el segundo 0.5 del video
DUR = 47.6


def f(t):
    """Tiempo de la voz -> tiempo del video."""
    return round(t + V, 3)


def T(es, en):
    return f'<span class="es">{es}</span><span class="en">{en}</span>'


# Escenas: (id, inicio, fin)
SC = {
    "home": (0.0, 4.75),
    "pfa": (4.75, 8.35),
    "min": (8.35, 13.9),
    "db": (13.9, 18.3),
    "acs": (18.3, 21.55),
    "noc": (21.55, 26.75),
    "atl": (26.75, 38.3),
    "ter": (38.3, 42.9),
    "end": (42.9, DUR),
}

# Boca: (forma, desde, hasta) en tiempo de voz
LIPS = [
    ("o", 0.20, 0.40), ("e", 0.40, 0.50), ("e", 0.56, 0.66), ("a", 0.70, 0.88), ("e", 0.88, 0.96),
    ("e", 0.96, 1.02), ("a", 1.02, 1.16), ("e", 1.16, 1.22), ("a", 1.22, 1.30), ("e", 1.30, 1.42),
    ("o", 42.83, 43.05), ("e", 43.05, 43.12), ("e", 43.14, 43.26), ("a", 43.32, 43.56), ("e", 43.56, 43.68),
    ("e", 43.70, 43.78), ("a", 43.78, 43.96), ("e", 43.96, 44.02), ("a", 44.02, 44.10), ("e", 44.10, 44.24),
]
BLINKS = [3.3, 46.3]

# Subtítulos en inglés (solo lang=en), tiempo de video
CAPS = [
    (0.6, 1.98, "I'm Iván Zárate."),
    (2.16, 4.56, "Ten years ago I joined Argentina's Federal Police."),
    (4.98, 7.98, "That's where I learned to treat data as if it were my own."),
    (8.32, 10.84, "Then, at the Ministry of National Security,"),
    (11.1, 14.08, "I built systems on critical databases,"),
    (14.5, 17.5, "where an error isn't a bug: it's a person."),
    (18.02, 21.14, "Today I'm an AI Solution Architect at ACSYS."),
    (21.32, 23.24, "And there's one question I can't let go of:"),
    (23.38, 26.2, "what happens when an AI doesn't know something… and makes it up?"),
    (26.2, 28.16, "That's why I built Atlas Urbano:"),
    (28.24, 31.76, "an agent that says “I don't have that data” instead of guessing."),
    (32.53, 35.12, "A second model reviews its answers."),
    (35.22, 37.82, "Out of 22 hard queries, it fixed 14."),
    (38.2, 42.08, "I want AI to be trustworthy where it matters most."),
    (42.84, 44.8, "I'm Iván Zárate."),
]

# Efectos: (archivo, inicio, volumen). El pico de cada archivo se midió con `hf.sh audio`.
SFX = [
    ("whoosh-short", 4.6 - 0.16, 0.45),
    ("pop", 6.02 - 0.12, 0.35),
    ("whoosh", 8.33 - 0.16, 0.5),
    ("whoosh-cinematic", 13.88 - 2.5, 0.45),
    ("glitch-1", 15.2 - 0.2, 0.22),
    ("pop", 16.24 - 0.12, 0.45),
    ("whoosh", 18.25 - 0.16, 0.45),
    ("whoosh-short", 21.5 - 0.16, 0.5),
    ("typing", 24.44 - 0.45, 0.3),
    ("glitch-1", 25.7 - 0.2, 0.25),
    ("whoosh", 26.72 - 0.16, 0.5),
    ("pop", 29.6 - 0.12, 0.45),
    ("whoosh-short", 32.53 - 0.16, 0.35),
    ("riser", 37.36 - 3.47, 0.4),
    ("impact-bass-1", 37.36 - 0.07, 0.45),
    ("whoosh", 38.28 - 0.16, 0.5),
]

MUSIC_LANE = [
    (0, 0.6), (0.45, 0.24), (21.0, 0.22), (21.6, 0.17), (26.8, 0.13), (37.2, 0.13), (37.5, 0.2),
    (38.1, 0.14), (41.7, 0.14), (42.2, 0.36), (43.1, 0.2), (44.9, 0.2), (45.5, 0.55),
]

# Tabla de registros (escena db): 12 filas enmascaradas
ROWS = []
for i in range(12):
    rid = f"{48213 + i * 137:06d}"
    juris = ["CABA", "BA", "CBA", "SFE", "MZA", "TUC"][i % 6]
    upd = f"{(i * 7) % 28 + 1:02d}/0{(i % 9) + 1}"
    ROWS.append((rid, juris, upd))

ERR_ROW = 6


def table_rows():
    out = []
    for i, (rid, juris, upd) in enumerate(ROWS):
        cls = "row err" if i == ERR_ROW else "row"
        state = (f'<span class="ok">{T("Activo", "Active")}</span>'
                 f'<span class="bad">ERROR</span>') if i == ERR_ROW else f'<span class="ok">{T("Activo", "Active")}</span>'
        out.append(
            f'<div class="{cls}" id="{"db-err" if i == ERR_ROW else f"db-r{i}"}">'
            f'<span class="c-id">{rid}</span>'
            f'<span class="c-name"><i style="width:{220 + (i * 53) % 160}px"></i></span>'
            f'<span class="c-doc"><i style="width:{150 + (i * 31) % 70}px"></i></span>'
            f'<span class="c-jur">{juris}</span>'
            f'<span class="c-state">{state}</span>'
            f'<span class="c-upd">{upd}</span></div>'
        )
    return "\n".join(out)


def tiles():
    return "\n".join(
        f'<div class="tile" id="tile{i}"><svg viewBox="0 0 40 40"><path d="M11 21l6 6 12-14"/></svg></div>'
        for i in range(22)
    )


def caps_html():
    return "\n".join(
        f'<div class="cap" id="cap{i}"><span>{txt}</span></div>' for i, (_, _, txt) in enumerate(CAPS)
    )


def audio_html():
    out = [
        '<audio id="voz" class="clip" src="assets/audio/voz.flac" data-start="0.5" data-duration="45.3" '
        'data-track-index="20" data-volume="1"></audio>',
        '<audio id="musica" class="clip" src="assets/audio/musica.flac" data-start="0" '
        f'data-duration="{DUR}" data-track-index="21" data-volume="1" data-automation="'
        + json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in MUSIC_LANE]}]}).replace('"', "&quot;")
        + '"></audio>',
    ]
    for i, (name, start, vol) in enumerate(SFX):
        out.append(
            f'<audio id="sfx{i}" class="clip" src="assets/sfx/{name}.mp3" data-start="{round(max(start, 0), 3)}" '
            f'data-track-index="{22 + i % 4}" data-volume="{vol}"></audio>'
        )
    return "\n".join(out)


def clip(sid, inner, z, extra=""):
    s, e = SC[sid]
    return (f'<div id="{sid}" class="clip scene" data-start="{s}" data-duration="{round(e - s, 3)}" '
            f'data-track-index="1" style="z-index:{z}" {extra}>\n{inner}\n</div>')


def avatar(prefix):
    return f'''<div class="av" id="{prefix}-av">
  <img class="av-base" src="assets/img/avatar.png" alt="">
  <img class="av-p" id="{prefix}-ma" src="assets/img/boca_a.png" alt="">
  <img class="av-p" id="{prefix}-me" src="assets/img/boca_e.png" alt="">
  <img class="av-p" id="{prefix}-mo" src="assets/img/boca_o.png" alt="">
  <img class="av-p" id="{prefix}-eyes" src="assets/img/ojos.png" alt="">
</div>'''


def letters(word, cls):
    return "".join(f'<span class="{cls}">{ch}</span>' for ch in word)


def lower(es_title, en_title, years, light=False):
    c = " light" if light else ""
    return f'''<div class="lower{c}">
  <div class="lt-years">{years}</div>
  <div class="lt-title">{T(es_title, en_title)}</div>
</div>'''


def scene_img(src, inner_extra=""):
    return f'''<div class="cam-a"><div class="cam-b">
  <img class="plate" src="assets/img/{src}.webp" alt="">
  {inner_extra}
</div></div>'''


HTML = f'''<!doctype html>
<html lang="es" data-composition-variables='[{{"id":"lang","type":"enum","label":"Idioma","default":"{DEFAULT_LANG}","options":[{{"value":"es","label":"Español"}},{{"value":"en","label":"English"}}]}}]'>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1920, height=1080">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
@font-face {{ font-family: "Anton"; src: url("assets/fonts/Anton-Regular.ttf") format("truetype"); font-weight: 400; }}
:root {{
  --navy: #0B1220; --ink: #F3F1EA; --amber: #E6BB68; --teal: #61D4C6; --red: #E5484D;
  --atlas-bg: #061012; --atlas-panel: #0B1719; --atlas-text: #F3FBFA; --atlas-muted: #8FA8A8;
  --display: "Anton", "League Gothic", sans-serif; --ui: "Inter", sans-serif;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: var(--navy); }}
html.lang-es .en, html.lang-en .es {{ display: none; }}
#root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; background: var(--navy); font-family: var(--ui); color: var(--ink); }}
.scene {{ position: absolute; inset: 0; overflow: hidden; }}
.cam-a, .cam-b {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
.plate {{ position: absolute; left: 0; top: -100px; width: 1920px; height: 1280px; }}

/* Escenario de inicio y cierre */
.stage {{ position: absolute; inset: 0; background: radial-gradient(circle at 50% 36%, rgba(230,187,104,.24) 0%, rgba(230,187,104,.08) 26%, rgba(11,18,32,0) 48%), var(--navy); }}
.av {{ position: absolute; left: 550px; top: 70px; width: 820px; height: 1230px; }}
.av img {{ position: absolute; display: block; }}
.av-base {{ left: 0; top: 0; width: 820px; height: 1230px; }}
.av-p {{ left: 304.3px; top: 240.2px; width: 256.3px; height: 272.3px; opacity: 0; }}
.name {{ position: absolute; top: 255px; font-family: var(--display); font-size: 236px; line-height: 1; letter-spacing: .01em; color: var(--ink); white-space: nowrap; }}
.name-l {{ right: 1150px; text-align: right; }}
.name-r {{ left: 1150px; }}
.name .lt {{ display: inline-block; opacity: .14; }}
#h-yl, #h-yr, #tag-inv {{ opacity: 0; }}
.year {{ position: absolute; top: 255px; font-family: var(--display); font-size: 236px; line-height: 1; color: var(--amber); }}
.role {{ position: absolute; left: 0; width: 1920px; top: 905px; text-align: center; font-size: 44px; font-weight: 700; letter-spacing: -.01em; }}
.role .w {{ display: inline-block; }}
.url {{ position: absolute; left: 0; width: 1920px; top: 975px; text-align: center; font-size: 30px; font-weight: 500; color: #AFC0C8; }}

/* Rótulo de etapa */
.lower {{ position: absolute; left: 96px; top: 742px; z-index: 1; isolation: isolate; }}
.lt-years {{ font-family: var(--display); font-size: 84px; line-height: 1; color: var(--amber); }}
.lt-title {{ margin-top: 10px; font-size: 46px; font-weight: 700; letter-spacing: -.01em; color: var(--ink); }}
.lower.light .lt-title {{ color: var(--navy); }}
.lower::before {{ content: ""; position: absolute; left: -40px; top: -30px; right: -60px; bottom: -34px; background: radial-gradient(ellipse at 30% 50%, rgba(5,9,16,.72), rgba(5,9,16,0) 72%); z-index: -1; }}
.lock {{ position: absolute; left: 1205px; top: 560px; width: 150px; height: 150px; }}
.lock path, .lock rect {{ fill: none; stroke: var(--amber); stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }}

/* Tabla de registros */
.db-world {{ position: absolute; inset: 0; background: #071116; }}
.db-cam {{ position: absolute; inset: 0; }}
.db-head, .row {{ position: absolute; left: 150px; width: 1620px; height: 78px; display: flex; align-items: center; font-size: 30px; }}
.db-head {{ top: 96px; color: #7FA3A8; font-weight: 700; font-size: 24px; letter-spacing: .08em; text-transform: uppercase; border-bottom: 2px solid rgba(97,212,198,.35); z-index: 2; background: #071116; }}
.rows {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
.row {{ border-bottom: 1px solid rgba(97,212,198,.14); color: #CFE3E4; font-family: "IBM Plex Mono", monospace; }}
.row i {{ display: inline-block; height: 18px; border-radius: 4px; background: rgba(207,227,228,.28); vertical-align: middle; }}
.c-id {{ width: 210px; padding-left: 24px; }} .c-name {{ width: 430px; }} .c-doc {{ width: 300px; }}
.c-jur {{ width: 240px; }} .c-state {{ width: 260px; font-family: var(--ui); font-weight: 700; }} .c-upd {{ width: 180px; }}
.ok {{ color: var(--teal); }} .bad {{ color: var(--red); display: none; }}
.row.err .err-bg {{ position: absolute; inset: 0; }}
#db-flash {{ position: absolute; left: 150px; width: 1620px; height: 78px; background: var(--red); opacity: 0; }}
#db-white {{ position: absolute; left: 150px; width: 1620px; height: 78px; background: #FFFFFF; opacity: 0; transform-origin: 50% 50%; }}
.big {{ position: absolute; left: 0; width: 1920px; text-align: center; font-family: var(--display); line-height: 1; }}
#bug {{ font-size: 330px; color: var(--ink); }}
#bug-strike {{ position: absolute; left: 715px; top: 205px; width: 490px; height: 26px; background: var(--red); transform-origin: 0 50%; }}
#persona {{ font-size: 330px; color: var(--amber); }}
.bigwrap {{ position: absolute; left: 0; top: 300px; width: 1920px; height: 400px; overflow: hidden; }}
.bigwrap .big {{ top: 20px; }}
.scrim {{ position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 48%, rgba(4,8,12,.86) 0%, rgba(4,8,12,.55) 45%, rgba(4,8,12,0) 75%); opacity: 0; }}

/* Pizarra ACSYS */
.board {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
.b-title {{ position: absolute; left: 730px; top: 150px; font-size: 46px; font-weight: 800; color: var(--navy); letter-spacing: -.015em; }}
.b-logo {{ position: absolute; left: 1520px; top: 136px; width: 200px; height: 72px; }}
.node {{ position: absolute; width: 250px; height: 92px; display: flex; align-items: center; justify-content: center; border: 4px solid var(--navy); border-radius: 18px; background: #FFFFFF; font-size: 32px; font-weight: 700; color: var(--navy); white-space: nowrap; }}
.node.hl {{ background: var(--navy); color: #FFFFFF; }}
.wire {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
.wire path {{ fill: none; stroke: var(--navy); stroke-width: 5; stroke-linecap: round; }}

/* Chat */
.chat {{ position: absolute; left: 96px; top: 96px; width: 880px; padding: 40px 44px 44px; border-radius: 26px; background: rgba(9,17,22,.94); border: 2px solid rgba(97,212,198,.22); transform-origin: 40% 100%; }}
.q {{ margin-left: auto; width: fit-content; max-width: 680px; padding: 22px 28px; border-radius: 22px 22px 6px 22px; background: #1D2B33; font-size: 34px; font-weight: 500; line-height: 1.3; color: #E6F0F0; }}
.a {{ margin-top: 30px; display: flex; gap: 20px; align-items: flex-start; font-size: 40px; font-weight: 600; line-height: 1.3; color: var(--ink); }}
.a .dot {{ flex: none; width: 46px; height: 46px; margin-top: 3px; border-radius: 50%; background: var(--teal); }}
.typed .ch {{ opacity: 0; }}
#n-38 {{ display: inline-block; padding: 0 6px; border-radius: 8px; }}
.tag {{ display: inline-block; margin-top: 22px; margin-left: 66px; padding: 10px 22px; border-radius: 12px; font-size: 30px; font-weight: 700; }}
.tag.red {{ background: rgba(229,72,77,.18); color: #FF8A8E; border: 2px solid var(--red); }}

/* Atlas */
.map-dim {{ position: absolute; inset: 0; background: rgba(6,16,18,.62); opacity: 0; }}
.lockup {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }}
.lk {{ position: absolute; left: 520px; top: 400px; display: flex; align-items: center; gap: 40px; transform-origin: 0 0; }}
.lk img {{ width: 150px; height: 150px; border-radius: 34px; }}
.lk-name {{ font-size: 124px; font-weight: 700; letter-spacing: -.03em; color: var(--atlas-text); }}
.lk-url {{ position: absolute; left: 0; top: 600px; width: 1920px; text-align: center; font-size: 36px; font-weight: 500; color: var(--atlas-muted); }}
.panel {{ position: absolute; left: 300px; top: 150px; width: 1320px; height: 620px; border-radius: 30px; background: var(--atlas-panel); border: 2px solid rgba(179,233,225,.16); }}
.p-q {{ position: absolute; right: 56px; top: 150px; padding: 24px 32px; border-radius: 24px 24px 6px 24px; background: #15262A; font-size: 36px; font-weight: 500; color: #E2F2F0; }}
.p-a {{ position: absolute; left: 56px; top: 290px; width: 1200px; font-size: 46px; font-weight: 600; color: var(--atlas-text); }}
.p-a .lab {{ color: var(--atlas-muted); font-weight: 500; }}
#p-38 {{ position: relative; display: inline-block; }}
#p-38-strike {{ position: absolute; left: -6px; right: -6px; top: 50%; height: 7px; margin-top: -3px; background: var(--red); transform-origin: 0 50%; }}
.chip {{ position: absolute; left: 56px; top: 400px; display: flex; align-items: center; gap: 18px; padding: 18px 28px; border-radius: 16px; background: rgba(230,187,104,.14); border: 2px solid var(--amber); font-size: 36px; font-weight: 700; color: var(--amber); }}
.chip svg {{ width: 40px; height: 40px; }}
.chip svg path, .chip svg circle {{ fill: none; stroke: var(--amber); stroke-width: 3.5; stroke-linecap: round; }}
.p-src {{ position: absolute; left: 56px; top: 530px; font-size: 30px; font-weight: 500; color: var(--atlas-muted); }}
.scan {{ position: absolute; left: 0; width: 1320px; height: 4px; top: 0; background: var(--teal); opacity: 0; }}
.scan-lab {{ position: absolute; right: 24px; top: -54px; padding: 8px 18px; border-radius: 10px; background: var(--teal); color: var(--atlas-bg); font-size: 26px; font-weight: 800; white-space: nowrap; }}
.grid {{ position: absolute; left: 150px; top: 300px; width: 680px; display: flex; flex-wrap: wrap; gap: 18px; }}
.tile {{ width: 96px; height: 96px; border-radius: 18px; border: 3px solid rgba(179,233,225,.32); background: rgba(11,23,25,.9); position: relative; }}
.tile svg {{ position: absolute; inset: 18px; width: 54px; height: 54px; opacity: 0; }}
.tile svg path {{ fill: none; stroke: var(--atlas-bg); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }}
.tile .fill {{ position: absolute; inset: -3px; border-radius: 18px; background: var(--teal); opacity: 0; }}
.count {{ position: absolute; left: 930px; top: 250px; font-family: var(--display); line-height: 1; white-space: nowrap; }}
#c-num {{ display: inline-block; width: 420px; text-align: right; font-size: 400px; color: var(--teal); }}
#c-den {{ font-size: 210px; color: var(--atlas-text); }}
.c-lab {{ position: absolute; left: 960px; top: 700px; width: 880px; font-size: 40px; font-weight: 600; line-height: 1.25; color: var(--atlas-text); }}

/* Transiciones y subtítulos */
#dip {{ position: absolute; inset: 0; background: var(--navy); opacity: 0; z-index: 90; }}
#captions {{ position: absolute; inset: 0; z-index: 100; pointer-events: none; }}
html.lang-es #captions {{ display: none; }}
.cap {{ position: absolute; left: 0; bottom: 70px; width: 1920px; text-align: center; opacity: 0; visibility: hidden; }}
.cap span {{ display: inline-block; max-width: 1500px; padding: 10px 26px 12px; border-radius: 12px; background: rgba(4,8,12,.62); font-size: 46px; font-weight: 600; line-height: 1.25; color: #FFFFFF; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1920" data-height="1080" data-motion-blur="on">

{clip("home", f"""<div class="cam-a" id="home-cam"><div class="stage"></div>
<div class="name name-l" id="h-nl">{letters("IVÁN", "lt")}</div>
<div class="name name-r" id="h-nr">{letters("ZÁRATE", "lt")}</div>
<div class="year name-l" id="h-yl">20</div>
<div class="year name-r" id="h-yr">16</div>
{avatar("h")}
</div>""", 10)}

{clip("pfa", scene_img("pfa", '''<svg class="lock" id="lock" viewBox="0 0 100 100"><rect x="22" y="44" width="56" height="44" rx="8"/><path d="M34 44V32a16 16 0 0 1 32 0v12"/><path d="M50 60v12"/></svg>''')
      + lower("Policía Federal Argentina", "Argentine Federal Police", "2016 — 2024"), 11)}

{clip("min", scene_img("ministerio") + lower("Ministerio de Seguridad Nacional", "Ministry of National Security", "2024 — 2026"), 12)}

{clip("db", f"""<div class="db-world"></div><div class="db-cam" id="db-cam">
<div class="rows" id="db-rows">
<div id="db-flash"></div>
{table_rows()}
</div>
<div class="db-head" data-layout-ignore><span class="c-id">ID</span><span class="c-name">{T("Nombre", "Name")}</span><span class="c-doc">{T("Documento", "ID number")}</span><span class="c-jur">{T("Jurisdicción", "Region")}</span><span class="c-state">{T("Estado", "Status")}</span><span class="c-upd">{T("Actualizado", "Updated")}</span></div>
</div>
<div class="scrim" id="db-scrim"></div>
<div class="bigwrap" data-layout-allow-overflow><div class="big" id="bug" data-layout-allow-overlap>BUG</div><div class="big" id="persona" data-layout-allow-overlap>{T("PERSONA", "PERSON")}</div><div id="bug-strike"></div></div>
<div id="db-white"></div>""", 13)}

{clip("acs", scene_img("acsys", f'''<div class="board">
  <div class="b-title" id="b-title">AI Solution Architect</div>
  <img class="b-logo" id="b-logo" src="assets/img/acsys-logo.svg" alt="ACSYS">
  <svg class="wire" viewBox="0 0 1920 1080"><path id="w1" d="M1010 356 H1120"/><path id="w2" d="M1010 586 H1120"/><path id="w3" d="M1350 356 C1420 356 1420 470 1470 470"/><path id="w4" d="M1350 586 C1420 586 1420 470 1470 470"/></svg>
  <div class="node" id="nd1" style="left:760px;top:310px">{T("Datos", "Data")}</div>
  <div class="node" id="nd2" style="left:760px;top:540px">{T("Identidad", "Identity")}</div>
  <div class="node" id="nd3" style="left:1120px;top:310px;width:230px">RAG</div>
  <div class="node" id="nd4" style="left:1120px;top:540px;width:230px">{T("Seguridad", "Security")}</div>
  <div class="node hl" id="nd5" style="left:1470px;top:424px;width:230px">{T("Modelo", "Model")}</div>
</div>'''), 14)}

{clip("noc", '<div class="cam-a" id="noc-z">' + scene_img("noche") + f"""<div class="chat" id="chat">
  <div class="q" id="chat-q">{T("¿Cuál es la altura máxima permitida en Av. de Mayo 1200?", "What's the height limit at Av. de Mayo 1200?")}</div>
  <div class="a"><span class="dot"></span><span class="typed" id="typed">{T(letters("La altura máxima es de ", "ch"), letters("The height limit is ", "ch"))}<span id="n-38">{letters("38 m", "ch")}</span><span class="ch">.</span></span></div>
  <div class="tag red" id="tag-inv">{T("inventado", "made up")}</div>
</div></div>""", 15)}

{clip("atl", scene_img("mapa") + f"""<div class="map-dim" id="map-dim"></div>
<div class="panel" id="panel">
  <div class="p-q" id="p-q">{T("¿Cuál es la altura máxima permitida en Av. de Mayo 1200?", "What's the height limit at Av. de Mayo 1200?")}</div>
  <div class="p-a" id="p-a"><span class="lab">{T("Altura máxima:", "Height limit:")}</span> <span id="p-38">38 m<span id="p-38-strike"></span></span></div>
  <div class="chip" id="chip"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16"/><path d="M20 11v11M20 28v1"/></svg>{T("Dato faltante · no tengo ese dato", "Missing data · I don't have that data")}</div>
  <div class="p-src" id="p-src">{T("Fuentes consultadas: Código Urbanístico · Parcelario CABA", "Sources checked: Buenos Aires zoning code · city parcel registry")}</div>
  <div class="scan" id="scan"><div class="scan-lab">{T("Revisor · segundo modelo", "Reviewer · second model")}</div></div>
</div>
<div class="lockup"><div class="lk" id="lk"><img src="assets/img/atlas-urbano-icon.webp" alt=""><div class="lk-name">Atlas Urbano</div></div>
<div class="lk-url" id="lk-url">atlas.iazarate.com</div></div>
<div class="grid" id="grid">{tiles()}</div>
<div class="count" id="count"><span id="c-num">0</span><span id="c-den"> / 22</span></div>
<div class="c-lab" id="c-lab">{T("consultas difíciles corregidas por el revisor", "hard queries fixed by the reviewer")}</div>""", 16)}

{clip("ter", scene_img("terraza"), 17)}

{clip("end", f"""<div class="cam-a" id="end-cam"><div class="stage"></div>
<div class="name name-l" id="e-nl">{letters("IVÁN", "lt")}</div>
<div class="name name-r" id="e-nr">{letters("ZÁRATE", "lt")}</div>
{avatar("e")}
</div>
<div class="role" id="role">{T(" ".join(f'<span class="w">{w}</span>' for w in "AI Solution Architect · Investigación en seguridad de IA".split()), " ".join(f'<span class="w">{w}</span>' for w in "AI Solution Architect · AI safety research".split()))}</div>
<div class="url" id="url">iazara.github.io/ZarateXP-Portfolio_v1</div>""", 18)}

<div id="dip" class="clip" data-start="0" data-duration="{DUR}" data-track-index="2" data-layout-ignore></div>
<div id="captions" class="clip" data-start="0" data-duration="{DUR}" data-track-index="3" data-track-kind="captions">
{caps_html()}
</div>

{audio_html()}
</div>

<script>
(function () {{
  const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {{}};
  const lang = vars.lang === "en" || vars.lang === "es" ? vars.lang : "{DEFAULT_LANG}";
  document.documentElement.classList.add("lang-" + lang);
  document.documentElement.lang = lang;

  const tl = gsap.timeline({{ paused: true }});
  const q = (s) => document.querySelectorAll(s);
  const other = lang === "es" ? ".en" : ".es";
  const vis = (s) => [...q(s)].filter((el) => !el.closest(other));
  const LIPS = {json.dumps(LIPS)};
  const V = {V};
  const BLINKS = {json.dumps(BLINKS)};
  const CAPS = {json.dumps([[a, b] for a, b, _ in CAPS])};

  // ---------- Boca y parpadeo ----------
  ["h", "e"].forEach((p) => ["a", "e", "o"].forEach((m) => tl.set("#" + p + "-m" + m, {{ opacity: 0 }}, 0)));
  LIPS.forEach(([m, a, b]) => {{
    const p = a < 20 ? "h" : "e";
    tl.set("#" + p + "-m" + m, {{ opacity: 1 }}, a + V);
    tl.set("#" + p + "-m" + m, {{ opacity: 0 }}, b + V);
  }});
  BLINKS.forEach((t) => {{
    const p = t < 20 ? "h" : "e";
    tl.set("#" + p + "-eyes", {{ opacity: 1 }}, t);
    tl.set("#" + p + "-eyes", {{ opacity: 0 }}, t + 0.12);
  }});

  // ---------- 1. Inicio: "Soy Iván Zárate" ----------
  const lit = (sel, t0, gap) => q(sel).forEach((el, i) =>
    tl.fromTo(el, {{ opacity: 0.14, filter: "blur(3px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power2.out" }}, t0 + i * gap));
  lit("#h-nl .lt", {f(0.52)}, 0.09);
  lit("#h-nr .lt", {f(0.98)}, 0.075);
  tl.to(["#h-nl", "#h-nr"], {{ opacity: 0, filter: "blur(10px)", duration: 0.2, ease: "power2.in" }}, {f(1.64)});
  tl.fromTo("#h-yl", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, {f(1.88)});
  tl.fromTo("#h-yr", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, {f(1.96)});
  tl.fromTo("#home-cam", {{ scale: 1, transformOrigin: "975px 380px" }}, {{ scale: 1.9, duration: 0.45, ease: "power3.in" }}, 4.3);

  // ---------- 2. Policía Federal ----------
  tl.fromTo("#pfa .cam-a", {{ scale: 1.9, transformOrigin: "784px 216px" }}, {{ scale: 1, duration: 0.8, ease: "expo.out" }}, 4.75);
  tl.fromTo("#pfa .cam-b", {{ scale: 1, transformOrigin: "1270px 330px" }}, {{ scale: 1.05, duration: 2.4, ease: "power1.inOut" }}, 5.4);
  tl.to("#pfa .cam-b", {{ scale: 9, duration: 0.55, ease: "power3.in" }}, 7.8);
  tl.fromTo("#pfa .lower", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {f(4.48)});
  tl.to("#pfa .lower", {{ opacity: 0, filter: "blur(6px)", duration: 0.15, ease: "power2.in" }}, 7.62);
  tl.fromTo("#lock", {{ opacity: 0, scale: 0.6, transformOrigin: "50% 60%" }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }}, {f(5.48)});
  q("#lock rect, #lock path").forEach((p, i) => {{
    const len = p.getTotalLength ? (p.getTotalLength() || 200) : 200;
    tl.fromTo(p, {{ strokeDasharray: len, strokeDashoffset: len }}, {{ strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }}, {f(5.48)} + i * 0.08);
  }});

  // ---------- 3. Ministerio ----------
  tl.fromTo("#min .cam-a", {{ scale: 3.2, transformOrigin: "1175px 541px" }}, {{ scale: 1, duration: 0.95, ease: "expo.out" }}, 8.35);
  tl.fromTo("#min .cam-b", {{ scale: 1, transformOrigin: "1175px 541px" }}, {{ scale: 1.06, duration: 3.9, ease: "power1.inOut" }}, 9.3);
  tl.to("#min .cam-b", {{ scale: 7, duration: 0.55, ease: "power3.in" }}, 13.35);
  tl.fromTo("#min .lower", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {f(8.76)});
  tl.to("#min .lower", {{ opacity: 0, filter: "blur(6px)", duration: 0.15, ease: "power2.in" }}, 13.2);

  // ---------- 4. Un error no es un bug ----------
  const ROWH = 78, ROW0 = 190;
  q("#db-rows .row").forEach((r, i) => gsap.set(r, {{ top: ROW0 + i * ROWH }}));
  gsap.set("#db-flash", {{ top: ROW0 + {ERR_ROW} * ROWH }});
  tl.fromTo("#db-cam", {{ scale: 1.3, transformOrigin: "960px 540px" }}, {{ scale: 1, duration: 0.8, ease: "expo.out" }}, 13.9);
  tl.fromTo("#db-rows", {{ y: 40 }}, {{ y: -60, duration: 3.5, ease: "none" }}, 13.9);
  tl.set("#db-err .bad", {{ display: "inline" }}, {f(14.70)});
  tl.set("#db-err .ok", {{ display: "none" }}, {f(14.70)});
  tl.fromTo("#db-flash", {{ opacity: 0 }}, {{ opacity: 0.32, duration: 0.12, ease: "power2.out" }}, {f(14.70)});
  tl.fromTo("#db-err", {{ x: 0 }}, {{ x: 8, duration: 0.05, yoyo: true, repeat: 3, ease: "none" }}, {f(14.70)});
  tl.to("#db-rows .row:not(.err)", {{ opacity: 0.3, duration: 0.25, ease: "power2.out" }}, {f(14.70)});
  tl.fromTo("#db-scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, ease: "power2.out" }}, {f(15.6)});
  tl.fromTo("#bug", {{ opacity: 0, scale: 1.25, filter: "blur(12px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.16, ease: "power4.out" }}, {f(15.74)});
  tl.fromTo("#bug-strike", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.18, ease: "power3.out" }}, {f(16.06)});
  tl.fromTo(["#bug", "#bug-strike"], {{ y: 0 }}, {{ y: -400, duration: 0.14, ease: "power3.in" }}, {f(16.42)});
  tl.set("#bug-strike", {{ opacity: 0 }}, {f(16.56)});
  tl.fromTo("#persona", {{ y: 400 }}, {{ y: 0, duration: 0.18, ease: "power3.out" }}, {f(16.48)});
  tl.to(["#persona", "#db-scrim"], {{ opacity: 0, filter: "blur(8px)", duration: 0.18, ease: "power2.in" }}, 17.75);
  gsap.set("#db-white", {{ top: ROW0 + {ERR_ROW} * ROWH - 60 }});
  tl.fromTo("#db-white", {{ opacity: 0, scaleY: 1, scaleX: 1 }}, {{ opacity: 1, duration: 0.12, ease: "power2.out" }}, 17.78);
  tl.to("#db-white", {{ scaleY: 30, scaleX: 1.25, duration: 0.5, ease: "power2.inOut" }}, 17.8);

  // ---------- 5. ACSYS ----------
  tl.fromTo("#acs .cam-a", {{ scale: 2.1, transformOrigin: "1233px 454px" }}, {{ scale: 1, duration: 1.05, ease: "expo.out" }}, 18.3);
  tl.fromTo("#b-title", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {f(18.32)});
  ["#nd1", "#nd2", "#nd3", "#nd4", "#nd5"].forEach((n, i) =>
    tl.fromTo(n, {{ opacity: 0, scale: 0.85, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.4)" }}, 19.05 + [0, 0.08, 0.42, 0.5, 0.86][i]));
  ["#w1", "#w2", "#w3", "#w4"].forEach((w, i) =>
    tl.fromTo(w, {{ strokeDasharray: 200, strokeDashoffset: 200 }}, {{ strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }}, 19.3 + [0, 0.08, 0.42, 0.5][i]));
  tl.fromTo("#b-logo", {{ opacity: 0, scale: 0.8, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.5)" }}, {f(20.18)});
  tl.to("#acs .cam-b", {{ x: -700, duration: 0.22, ease: "power3.in" }}, 21.33);

  // ---------- 6. La pregunta ----------
  tl.fromTo("#noc-z > .cam-a", {{ x: 700 }}, {{ x: 0, duration: 0.45, ease: "expo.out" }}, 21.55);
  tl.fromTo("#noc-z .cam-b", {{ x: 0 }}, {{ x: -36, duration: 4.4, ease: "power1.inOut" }}, 22.0);
  tl.fromTo("#chat", {{ opacity: 0, scale: 0.7, y: 120 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "expo.out" }}, {f(21.6)});
  tl.fromTo("#chat-q", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, {f(21.9)});
  const typeIn = (els, t0, step) => els.forEach((c, i) => tl.set(c, {{ opacity: 1 }}, t0 + i * step));
  typeIn(vis("#typed .ch"), {f(23.94)}, 0.032);
  tl.to("#n-38", {{ color: "#FF8A8E", backgroundColor: "rgba(229,72,77,.22)", duration: 0.08 }}, {f(25.2)});
  tl.fromTo("#n-38", {{ x: 0 }}, {{ x: 6, duration: 0.04, yoyo: true, repeat: 5, ease: "none" }}, {f(25.2)});
  tl.fromTo("#tag-inv", {{ opacity: 0, scale: 0.7, transformOrigin: "0 50%" }}, {{ opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.6)" }}, {f(25.26)});
  tl.to("#noc-z", {{ scale: 8, transformOrigin: "ZOOM38", duration: 0.45, ease: "power3.in" }}, 26.3);

  // ---------- 7. Atlas Urbano ----------
  tl.fromTo("#atl .cam-a", {{ scale: 1.35, transformOrigin: "960px 540px" }}, {{ scale: 1, duration: 0.9, ease: "expo.out" }}, 26.75);
  tl.fromTo("#atl .cam-b", {{ rotation: 0, scale: 1, transformOrigin: "960px 540px" }}, {{ rotation: 3, scale: 1.07, duration: 11.6, ease: "none" }}, 26.75);
  tl.fromTo("#map-dim", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4, ease: "power2.out" }}, 27.2);
  tl.fromTo("#lk", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.22, ease: "power4.out" }}, {f(26.92)});
  tl.fromTo("#lk-url", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2, ease: "power2.out" }}, {f(27.2)});
  tl.to("#lk-url", {{ opacity: 0, duration: 0.12, ease: "power2.in" }}, 28.25);
  tl.to("#lk", {{ x: -150, y: -216, scale: 0.42, duration: 0.55, ease: "power3.inOut" }}, 28.3);
  tl.fromTo("#panel", {{ opacity: 0, scale: 0.96, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }}, 28.42);
  tl.fromTo("#p-q", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, 28.62);
  tl.fromTo("#p-a", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.18, ease: "power4.out" }}, 28.9);
  tl.fromTo("#p-38-strike", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.18, ease: "power3.out" }}, {f(29.04)});
  tl.to("#p-38", {{ color: "#6E8586", duration: 0.18 }}, {f(29.1)});
  tl.fromTo("#chip", {{ opacity: 0, scale: 0.8, transformOrigin: "0 50%" }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.5)" }}, {f(29.1)});
  tl.fromTo("#p-src", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, {f(30.3)});
  tl.fromTo("#scan", {{ opacity: 0, y: 110 }}, {{ opacity: 1, y: 110, duration: 0.15 }}, {f(32.03)});
  tl.to("#scan", {{ y: 580, duration: 1.1, ease: "power1.inOut" }}, {f(32.2)});
  tl.to("#scan", {{ y: 160, duration: 0.9, ease: "power1.inOut" }}, {f(33.3)});
  tl.to(["#panel", "#lk"], {{ x: "-=2000", filter: "blur(14px)", duration: 0.32, ease: "power3.in" }}, 35.0);
  tl.set(["#panel", "#lk"], {{ opacity: 0 }}, 35.33);
  q("#grid .tile").forEach((t, i) =>
    tl.fromTo(t, {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.24, ease: "back.out(1.5)" }}, 35.3 + i * 0.025));
  tl.fromTo("#count", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, 35.32);
  tl.fromTo("#c-lab", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }}, 35.5);
  const FIX = [0, 2, 3, 5, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21];
  FIX.forEach((n, i) => {{
    const t = 35.95 + i * 0.1;
    const tile = document.getElementById("tile" + n);
    const fill = document.createElement("div"); fill.className = "fill"; tile.insertBefore(fill, tile.firstChild);
    tl.fromTo(fill, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power2.out" }}, t);
    tl.fromTo(tile.querySelector("svg"), {{ opacity: 0, scale: 0.5 }}, {{ opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }}, t + 0.04);
  }});
  const counter = {{ v: 0 }};
  tl.fromTo(counter, {{ v: 0 }}, {{ v: 14, duration: 1.41, ease: "power2.out",
    onUpdate: () => {{ document.getElementById("c-num").textContent = String(Math.floor(counter.v + 1e-6)); }} }}, 35.95);
  tl.fromTo("#c-num", {{ scale: 1.12, transformOrigin: "100% 80%" }}, {{ scale: 1, duration: 0.35, ease: "expo.out" }}, 37.36);
  tl.to(["#atl .cam-a", "#grid", "#count", "#c-lab"], {{ y: 800, filter: "blur(16px)", duration: 0.24, ease: "power3.in" }}, 38.06);

  // ---------- 8. Terraza ----------
  tl.fromTo("#ter .cam-a", {{ y: -800 }}, {{ y: 0, duration: 0.5, ease: "expo.out" }}, 38.3);
  tl.fromTo("#ter .cam-b", {{ scale: 1, transformOrigin: "1318px 490px" }}, {{ scale: 1.07, duration: 4.4, ease: "power1.inOut" }}, 38.5);
  tl.fromTo("#dip", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power2.in" }}, 42.6);
  tl.to("#dip", {{ opacity: 0, duration: 0.35, ease: "power2.out" }}, 42.9);

  // ---------- 9. Cierre ----------
  tl.fromTo("#end-cam", {{ scale: 1.05, transformOrigin: "975px 380px" }}, {{ scale: 1, duration: 1.0, ease: "expo.out" }}, 42.9);
  lit("#e-nl .lt", {f(43.12)}, 0.09);
  lit("#e-nr .lt", {f(43.70)}, 0.075);
  vis("#role .w").forEach((w, i) =>
    tl.fromTo(w, {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.14, ease: "power2.out" }}, 45.0 + i * 0.07));
  tl.fromTo("#url", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power2.out" }}, 45.3);

  // ---------- Subtítulos ----------
  CAPS.forEach(([a, b], i) => {{
    const el = "#cap" + i;
    tl.set(el, {{ visibility: "visible" }}, a);
    tl.fromTo(el, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power2.out" }}, a);
    tl.to(el, {{ opacity: 0, duration: 0.12, ease: "power2.in" }}, b - 0.12);
    tl.set(el, {{ opacity: 0, visibility: "hidden" }}, b);
  }});

  window.__timelines = window.__timelines || {{}};
  window.__timelines["main"] = tl;
}})();
</script>
</body>
</html>
'''

# Punto de zoom sobre "38 m" (coordenadas medidas con snapshot)
HTML = HTML.replace("ZOOM38", "690px 330px")
HTML = "\n".join(line.rstrip() for line in HTML.splitlines()) + "\n"
open("index.html", "w").write(HTML)
print("index.html", len(HTML), "bytes, lang", DEFAULT_LANG)
