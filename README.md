![ZarateXP banner](assets/readme/zaratexp-banner.png)

# ZarateXP Portfolio

[![HTML5](https://img.shields.io/badge/HTML5-structure-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-interface-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)](#)
[![Portfolio](https://img.shields.io/badge/Portfolio-Windows_XP-2D7DD2?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/status-active-2EA44F?style=for-the-badge)](#)

Portfolio interactivo de Ivan Agustin Zarate con una experiencia inspirada en Windows XP. El sitio funciona como escritorio navegable: ventanas arrastrables, menu de inicio, visor de CV actualizado, proyectos embebidos, automatizaciones n8n, integraciones con APIs publicas y aplicaciones retro funcionales.

## Demo

- Portfolio: [iazarate.com](https://iazarate.com)
- GitHub: [@IAZARA](https://github.com/IAZARA)
- LinkedIn: [ivan-agustin-zarate](https://www.linkedin.com/in/ivan-agustin-zarate/)
- ForzaTech: [forzatech.com.ar](https://forzatech.com.ar/)

## Etiquetas

`portfolio` `windows-xp` `vanilla-javascript` `frontend` `full-stack` `automation` `n8n` `rest-api` `web-audio` `canvas-games` `pdf-viewer` `interactive-ui` `minesweeper` `paint` `github-pages`

## Que incluye

- Escritorio estilo Windows XP con pantalla de arranque y login.
- Sistema de ventanas con arrastre, foco, minimizar, maximizar, cierre animado y botones activos en taskbar.
- Menu de inicio con accesos a CV, documentos, proyectos, contacto, redes, juegos y accesorios.
- Ruta Reclutador para revisar CV, proyectos, APIs, automatizaciones y contacto en pocos clicks.
- Wallpaper HD original e iconos SVG nítidos para escritorio, taskbar y ventanas.
- Visor de CV actualizado en PDF.
- Carpeta Mis Documentos con CV, perfil profesional, notas y accesos a proyectos.
- Explorador de proyectos con vista de iconos/lista y detalle embebido.
- Proyectos destacados: ZarateXP, OSINTArgy, ForzaTech, Estudio Luttini, WJPC Capitulo Argentino, automatizaciones n8n y sistemas full-stack.
- API Center con Open-Meteo, wttr.in, GitHub REST y REST Countries, cache local, loading/error states y fallback.
- Apps retro: Winamp Pro, Paint mejorado, Buscaminas robusto, Solitario, Pinball, Bloc de notas y WordPad.
- PDF Studio para abrir PDFs locales, revisar el CV, anotar observaciones y usar File/Blob APIs.
- Panel de control para personalizar fondo, tema, iconos, efecto CRT y taskbar.
- Flujos n8n visuales con simulacion funcional de ejecucion.
- Assets visuales actualizados para perfil full-stack, automatizacion y productos de datos.

## Stack

- HTML5
- CSS3 modular
- JavaScript ES modules
- Fetch API, Web Audio API, Canvas 2D, File API y localStorage
- XP.css para componentes visuales base
- EmailJS para formulario de contacto
- Assets estaticos listos para GitHub Pages

## Apps destacadas

- **API Center:** consumo REST real de clima, repositorios y datos publicos con cache, proveedor secundario y manejo de errores.
- **Winamp XP Pro:** reproductor con playlist, visualizador Canvas, ecualizador y loops generados con Web Audio.
- **PDF Studio:** visor de CV/PDF local con zoom, rotacion, descarga, impresion y notas persistentes.
- **Ruta Reclutador:** recorrido guiado para evaluar rapidamente CV, evidencia tecnica, APIs, n8n y contacto.
- **Buscaminas XP:** primer clic seguro, banderas, dudas, timer, dificultades y deteccion de victoria/derrota.
- **Paint XP:** herramientas de dibujo, relleno, cuentagotas, texto, formas, undo/redo y exportacion PNG.
- **Solitario y Pinball:** juegos propios estilo XP para mostrar logica de juego, estado y Canvas.
- **Mis Documentos:** CV actualizado y accesos rapidos a proyectos, perfil, notas y automatizaciones.
- **Flujos n8n:** canvas visual con nodos, estado de ejecucion y log funcional.
- **Panel de control:** personalizacion persistente del escritorio.

## Ejecutar localmente

```bash
git clone https://github.com/IAZARA/ZarateXP-Portfolio_v1.git
cd ZarateXP-Portfolio_v1
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

Tambien se puede abrir `index.html` directamente, aunque el servidor local evita problemas de rutas al cargar componentes.

## Calidad

```bash
npm install
npm test
npm run smoke
```

`npm test` valida sintaxis JavaScript, referencias locales de assets y checks de experiencia. `npm run smoke` levanta un servidor temporal y abre ventanas clave con Playwright.

## Estructura

```text
.
├── index.html
├── css/
├── js/
├── components/
├── assets/
│   ├── images/
│   ├── readme/
│   └── sounds/
├── images/
│   ├── icons/
│   └── sobremi/
└── Ivan_Zarate_CV.pdf
```

## CV y proyectos

El CV principal versionado es `Ivan_Zarate_CV.pdf`. La app de CV lo muestra directamente desde el PDF para evitar capturas desactualizadas.

Los proyectos con URL publica pueden mostrarse embebidos dentro del explorador. Si un navegador bloquea una vista, el detalle incluye boton para abrir el sitio en una pestana nueva.

## Autor

Ivan Agustin Zarate<br>
Full Stack Developer & Automation Integrator<br>
[iazarate.com](https://iazarate.com) | [github.com/IAZARA](https://github.com/IAZARA) | [forzatech.com.ar](https://forzatech.com.ar/)
