![ZarateXP banner](assets/readme/zaratexp-banner.png)

# ZarateXP Portfolio

[![HTML5](https://img.shields.io/badge/HTML5-structure-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-interface-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)](#)
[![Portfolio](https://img.shields.io/badge/Portfolio-Windows_XP-2D7DD2?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/status-active-2EA44F?style=for-the-badge)](#)

Portfolio interactivo de Ivan Agustin Zarate, **AI Solution Architect en ACSYS**, enfocado en discovery, arquitectura de IA empresarial, RAG, seguridad, datos e implementación. La experiencia inspirada en Windows XP funciona como un escritorio navegable con perfil profesional, trayectoria verificable, casos institucionales, proyectos, automatizaciones, APIs y aplicaciones funcionales.

## Demo

- Portfolio: [GitHub Pages](https://iazara.github.io/ZarateXP-Portfolio_v1/)
- GitHub: [@IAZARA](https://github.com/IAZARA)
- LinkedIn: [ivan-agustin-zarate](https://www.linkedin.com/in/ivan-agustin-zarate/)
- ForzaTech: [forzatech.com.ar](https://forzatech.com.ar/)

## Etiquetas

`ai-solution-architecture` `acsys` `rag` `discovery` `presales` `mlops` `platforms` `data-privacy` `portfolio` `windows-xp` `java` `spring-boot` `react` `oracle` `automation`

## Que incluye

- Escritorio estilo Windows XP con pantalla de arranque y login.
- Sistema de ventanas con arrastre, foco, minimizar, maximizar, cierre animado y botones activos en taskbar.
- Menu de inicio con accesos a CV, documentos, proyectos, contacto, redes, juegos y accesorios.
- Perfil profesional con el rol actual en ACSYS, modelo de trabajo, experiencia, casos, capacidades, formación, idiomas y contacto.
- Wallpaper HD original e iconos SVG nítidos para escritorio, taskbar y ventanas.
- Visor de CV actualizado en PDF.
- Explorador bilingüe de certificados con 16 credenciales, filtros temáticos, vistas previas optimizadas, documentos originales y verificación pública de Claude Academy, Coursera y SAP Learning.
- Carpeta Mis Documentos con CV, perfil profesional, notas y accesos a proyectos.
- Explorador de proyectos con vista de iconos/lista y detalle embebido.
- Casos destacados: CUFRE, SIFEBU, CRIACO y OSINTArgy, además de ZarateXP, ForzaTech, WJPC Capitulo Argentino y sistemas full stack.
- API Center con Open-Meteo, wttr.in, GitHub REST, Countries y Banco Mundial, cache con TTL, cancelación, estados de frescura y recuperación offline.
- Actividad GitHub con resumen dentro del perfil profesional y calendario anual público actualizado diariamente por GitHub Actions, sin exponer tokens en el navegador.
- Apps retro: Winamp Pro, Paint mejorado, Buscaminas robusto, Solitario, Pinball, Bloc de notas y WordPad.
- PDF Studio para abrir PDFs locales, revisar el CV, anotar observaciones y usar File/Blob APIs.
- Panel de control para personalizar fondo, tema, iconos, efecto CRT y taskbar.
- Pipeline interactivo SDLC + MLOps: versionado, calidad de datos, CI, entrenamiento reproducible, evaluación, registry, aprobación humana, despliegue progresivo, observabilidad, drift y feedback.
- Perfil profesional actualizado con experiencia institucional, MLOps, gestión de datos sensibles, coordinación y formación.

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
- **Actividad GitHub:** snapshot verificable de contribuciones públicas, días activos, repositorios y rachas, con vista compacta y aplicación XP completa.
- **Winamp XP Pro:** reproductor de MP3 locales y loops Web Audio con playlist, visualizador Canvas, controles completos, balance y ecualizador de tres bandas.
- **PDF Studio:** visor de CV/PDF local con zoom, rotacion, descarga, impresion y notas persistentes.
- **Perfil profesional:** recorrido ejecutivo por el rol de AI Solution Architect en ACSYS, la experiencia previa, la forma de trabajo, los casos, el stack, la formación y los idiomas.
- **Buscaminas XP:** primer clic seguro, banderas, dudas, timer, dificultades y deteccion de victoria/derrota.
- **Paint XP:** herramientas de dibujo, relleno, cuentagotas, texto, formas, undo/redo y exportacion PNG.
- **Solitario y Pinball:** juegos propios estilo XP para mostrar logica de juego, estado y Canvas.
- **Mis Documentos:** CV actualizado y accesos rapidos a proyectos, perfil, notas y automatizaciones.
- **Mis Certificados:** 16 credenciales con evidencia en IA, desarrollo agéntico, Data Analytics, SAP, gestión de proyectos, ArcGIS y seguridad internacional, con enlaces verificables de Claude Academy, Coursera y SAP Learning.
- **Flujos n8n:** caso demostrativo de entrega de software e IA. n8n coordina eventos, APIs, jobs y decisiones humanas; las herramientas especializadas ejecutan CI/CD, entrenamiento, registry y serving. Incluye quality gate, rollback conceptual, drift y reentrenamiento.
- **Panel de control:** personalizacion persistente del escritorio.

### Audio del reproductor

Los dos MP3 incluidos fueron aportados por el propietario del portfolio, quien confirmó que cuenta con autorización para distribuirlos públicamente. Los derechos de las grabaciones y composiciones pertenecen a sus respectivos titulares.

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

El workflow `Actualizar actividad GitHub` consulta la API GraphQL cada día y versiona `assets/data/github-activity.json`. Para actualizarlo localmente se puede ejecutar `GH_ACTIVITY_TOKEN=... npm run update:github-activity`; el token solo se usa durante la generación y nunca llega al frontend. La actividad privada se publica únicamente como conteos diarios anónimos: no se consultan ni exponen nombres, commits o detalles de repositorios privados.

El check de performance protege la carga inicial: valida que los fondos y dialogos pesados usen WebP/lazy loading y que los iconos pequeños de la ventana de contacto no vuelvan a depender de PNGs gigantes.

Los iconos de Buscaminas y Pinball son composiciones SVG originales del portfolio; su procedencia y referencias CC0 están documentadas en [`THIRD_PARTY_ASSETS.md`](THIRD_PARTY_ASSETS.md).

## Estructura

```text
.
├── index.html
├── css/
├── js/
├── components/
├── assets/
│   ├── images/
│   ├── data/
│   ├── certificates/
│   ├── readme/
│   └── sounds/
├── images/
│   ├── icons/
│   └── sobremi/
└── Ivan_Zarate_CV.pdf
```

## CV y proyectos

El CV principal versionado es `Ivan_Zarate_CV.pdf`. La app de CV lo muestra directamente desde el PDF para evitar capturas desactualizadas.

Los certificados se conservan en su formato original dentro de `assets/certificates/originals/`. Las miniaturas WebP solo aceleran la vista previa; cada ficha mantiene acceso al documento fuente y, cuando existe, a la verificación pública del emisor.

Los proyectos con URL publica pueden mostrarse embebidos dentro del explorador. Si un navegador bloquea una vista, el detalle incluye boton para abrir el sitio en una pestana nueva.

## Autor

Ivan Agustin Zarate<br>
AI Solution Architect en ACSYS | Software, Data & AI Solutions<br>
Discovery, arquitectura de IA, RAG, seguridad, datos e implementación.<br>
[Portfolio](https://iazara.github.io/ZarateXP-Portfolio_v1/) | [github.com/IAZARA](https://github.com/IAZARA) | [forzatech.com.ar](https://forzatech.com.ar/)
