const projects = [
    {
        id: 'zaratexp',
        name: 'Zárate XP',
        type: 'project',
        icon: './assets/images/hd-icons/my-computer.svg',
        detailImage: './logo_ivanxp.webp',
        description: 'Portfolio interactivo estilo Windows XP',
        url: '#',
        repositoryUrl: 'https://github.com/IAZARA/ZarateXP-Portfolio_v1',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        category: 'Portfolio',
        status: 'Activo',
        details: 'Portfolio personal desarrollado como una simulación completa de Windows XP, con escritorio interactivo, ventanas funcionales, aplicaciones integradas y contenido profesional explorable.'
    },
    {
        id: 'osintargy',
        name: 'OSINTArgy',
        type: 'project',
        icon: './assets/images/hd-icons/api.svg',
        detailImage: './osintargy.png',
        description: 'Plataforma OSINT para la comunidad hispanohablante',
        url: 'https://osintargy.online',
        repositoryUrl: 'https://github.com/IAZARA/OSINTArgy_v01',
        technologies: ['React 18', 'Node.js', 'MongoDB', 'Canvas HTML5', 'Vite'],
        category: 'OSINT Platform',
        status: 'Activo',
        details: 'Plataforma open source de inteligencia de fuentes abiertas orientada a investigaciones éticas en Argentina y Latinoamérica. Reúne visualizaciones interactivas, generación de dorks, herramientas de análisis y contenido educativo en español.'
    },
    {
        id: 'wjpc-capituloargentino',
        name: 'WJPC Capítulo Argentino',
        type: 'project',
        icon: './icono.png',
        detailImage: './icono.png',
        description: 'Sitio oficial del Capítulo Argentino William J. Perry',
        url: 'https://www.wjpc-capituloargentino.org/',
        preview: true,
        technologies: ['React 18', 'Vite', 'Tailwind CSS', 'Node.js', 'Express.js', 'Docker', 'Google Cloud Platform'],
        category: 'Institucional',
        status: 'Activo',
        details: 'Aplicación institucional full stack con sitio público, panel administrativo, gestión de noticias y eventos, autenticación JWT, almacenamiento de imágenes y despliegue serverless con CI/CD en Google Cloud Platform.'
    },
    {
        id: 'forzatech',
        name: 'ForzaTech',
        type: 'project',
        icon: './assets/images/hd-icons/projects.svg',
        detailImage: './assets/readme/zaratexp-social.jpg',
        description: 'Marketing, sistemas e IA para PYMEs en Argentina',
        url: 'https://forzatech.com.ar/',
        preview: true,
        technologies: ['Landing Page', 'Marketing Digital', 'Automatización', 'IA', 'Sistemas a medida', 'Micro-SaaS'],
        category: 'Producto / Agencia',
        status: 'Activo',
        details: 'Sitio comercial de ForzaTech, iniciativa enfocada en ayudar a PYMEs argentinas con marketing digital, sistemas a medida, automatizaciones, apps móviles, micro-SaaS y soluciones con IA para vender y operar mejor.'
    },
    {
        id: 'estudio-luttini',
        name: 'Estudio Luttini',
        type: 'project',
        icon: './assets/images/project-icons/estudio-luttini-logo.png',
        detailImage: './assets/images/project-icons/estudio-luttini-logo.png',
        description: 'Sitio institucional jurídico-contable para profesionales y empresas',
        url: 'https://www.estudioluttini.com/',
        preview: true,
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'SEO'],
        category: 'Institucional',
        status: 'Activo',
        details: 'Sitio profesional para un estudio jurídico-contable en Puerto Madero. Presenta servicios legales, contables, impositivos, societarios y de compliance para personas, profesionales, PYMEs y empresas en CABA.'
    },
    {
        id: 'cap21',
        name: 'CAP-21',
        type: 'project',
        icon: './assets/images/project-icons/cap21-logo.png',
        detailImage: './assets/images/project-icons/cap21-logo.png',
        description: 'Catálogo online de insumos profesionales para tattoo en Argentina',
        url: 'https://www.cap21.com.ar/',
        preview: true,
        technologies: ['Next.js', 'React', 'Catálogo e-commerce', 'WhatsApp'],
        category: 'E-commerce',
        status: 'Activo',
        details: 'Catálogo online de CAP-21 con máquinas, tintas, cartuchos, agujas, fuentes, mobiliario y accesorios profesionales para tatuadores en Argentina. Permite armar el pedido desde el catálogo y enviarlo directamente por WhatsApp.'
    },
    {
        id: 'auto-inbox',
        name: 'Auto-Inbox',
        type: 'project',
        icon: './assets/images/project-icons/auto-inbox-preview.png',
        detailImage: './assets/images/project-icons/auto-inbox-preview.png',
        description: 'Asistente open source de correo con IA y revisión humana',
        url: 'https://github.com/IAZARA/Auto-Inbox',
        repositoryUrl: 'https://github.com/IAZARA/Auto-Inbox',
        technologies: ['React 19', 'TypeScript', 'Vite', 'Electron', 'Gmail API', 'Google Sheets', 'IA generativa'],
        category: 'IA aplicada / Productividad',
        status: 'Open source',
        details: 'Asistente de bandeja de entrada para equipos de soporte. Clasifica correos, consulta una base de conocimiento y prepara respuestas con IA, manteniendo siempre la revisión y el envío final en manos de una persona. La aplicación de escritorio integra Gmail, Google Sheets y proveedores de IA configurables.'
    },
    {
        id: 'art-redmine',
        name: 'Agente para Redmine',
        type: 'project',
        icon: './assets/images/project-icons/art-redmine-icon.webp',
        detailImage: './assets/images/project-icons/art-redmine-icon.webp',
        showcaseImage: './assets/images/project-icons/art-redmine-banner.webp',
        showcaseAlt: 'Vista general de Agente para Redmine',
        showcaseWidth: 1693,
        showcaseHeight: 929,
        description: 'Plataforma de soporte con IA, Redmine y validación humana',
        url: 'https://github.com/IAZARA/Agente-para-Redmine',
        repositoryUrl: 'https://github.com/IAZARA/Agente-para-Redmine',
        technologies: ['Python 3.12', 'FastAPI', 'React 19', 'PostgreSQL', 'Redmine API', 'Docker', 'TOTP'],
        category: 'IA aplicada / Operaciones de soporte',
        status: 'Código abierto (MIT)',
        details: 'ART Redmine es una plataforma operativa abierta para equipos de soporte. Sincroniza tickets desde Redmine, clasifica prioridad y completitud, recupera conocimiento y redacta respuestas propuestas con IA. Mantiene la revisión humana antes de publicar y suma inteligencia de servicio sobre incidentes repetidos, calidad, brechas de conocimiento y riesgo SLA, además de roles, TOTP, auditoría, adjuntos, OCR, Kanban, métricas y despliegue con Docker y PostgreSQL.'
    },
    {
        id: 'forzatask',
        name: 'ForzaTask',
        type: 'project',
        icon: './assets/images/project-icons/forzatask-icon.webp',
        detailImage: './assets/images/project-icons/forzatask-icon.webp',
        showcaseImage: './assets/images/project-icons/forzatask-banner.webp',
        showcaseAlt: 'Identidad y capacidades de ForzaTask',
        showcaseWidth: 1440,
        showcaseHeight: 480,
        description: 'Gestión full stack de proyectos, tareas y colaboración de equipos',
        url: '#',
        repositoryUrl: 'https://github.com/IAZARA/Forzatask_Gestion_de_Tareas',
        technologies: ['React 19', 'Vite', 'Node.js', 'Express', 'MongoDB', 'Socket.IO', 'Docker', 'JWT / 2FA'],
        category: 'Software / Gestión de proyectos',
        status: 'Código abierto (MIT)',
        details: 'Plataforma autohospedable que reúne proyectos, tareas, documentos, wiki, calendario, notificaciones y reportes. Combina una SPA React con una API Express y MongoDB, permisos por rol, colaboración en tiempo real, exportación PDF y Excel, asistencia opcional con OpenAI y despliegue reproducible mediante Docker Compose.'
    },
    {
        id: 'arana-web',
        name: 'Araña Web',
        type: 'project',
        icon: './assets/images/project-icons/arana-web-icon.webp',
        detailImage: './assets/images/project-icons/arana-web-icon.webp',
        showcaseImage: './assets/images/project-icons/arana-web-pipeline.webp',
        showcaseAlt: 'Pipeline de descubrimiento, revisión y exportación de Araña Web',
        showcaseWidth: 1440,
        showcaseHeight: 811,
        description: 'Monitoreo web con extracción, IA opcional y revisión humana',
        url: '#',
        repositoryUrl: 'https://github.com/IAZARA/Arana-web',
        technologies: ['Python 3.12', 'FastAPI', 'React 18', 'SQLite', 'RSS / GDELT', 'IA configurable', 'OpenPyXL', 'pytest / Vitest'],
        category: 'IA aplicada / Monitoreo web',
        status: 'Código abierto (MIT)',
        details: 'Aplicación local que convierte consultas, RSS, fuentes guardadas y URLs manuales en una cola trazable de contenidos. Extrae y estructura información, ofrece clasificación con IA configurable o reglas locales, agrupa versiones similares, aprende de las decisiones humanas y exporta a Excel únicamente los resultados aceptados.'
    },
    {
        id: 'seo-evaluate',
        name: 'SEO Evaluate',
        type: 'project',
        icon: './assets/images/project-icons/seo-evaluate-logo.png',
        detailImage: './assets/images/project-icons/seo-evaluate-logo.png',
        description: 'Auditoría de visibilidad para buscadores y asistentes de IA',
        url: 'https://seo-evaluate.vercel.app',
        repositoryUrl: 'https://github.com/IAZARA/SEO-Evaluate',
        preview: true,
        technologies: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Cheerio'],
        category: 'SEO técnico / AI Visibility',
        status: 'Open source',
        details: 'Analiza el HTML público y robots.txt de una URL para evaluar rastreo, estructura, schema, SEO y citabilidad. Entrega un score entendible, prioridades ordenadas por impacto y recomendaciones accionables sin requerir una cuenta.'
    },
    {
        id: 'cyberdetective',
        name: 'CyberDetective Academy',
        type: 'project',
        icon: './assets/images/project-icons/cyberdetective-icon.png',
        detailImage: './assets/images/project-icons/cyberdetective-icon.png',
        description: 'Academia gamificada de investigación digital y ciberseguridad',
        url: 'https://github.com/IAZARA/cyberdetective-academy',
        repositoryUrl: 'https://github.com/IAZARA/cyberdetective-academy',
        technologies: ['React 19', 'Vite', 'Node.js', 'Express', 'PostgreSQL', 'Socket.io', 'Docker'],
        category: 'EdTech / Ciberseguridad',
        status: 'Open source',
        details: 'Plataforma de aprendizaje basada en retos para practicar investigación digital, análisis de evidencia y ciberseguridad. Incluye ejercicios con validación automática, puntos, rankings, equipos, modo conferencia y administración, con frontend y backend desplegables mediante Docker.'
    },
    {
        id: 'desanjuntar-pdf',
        name: 'DesanjuntarPDF',
        type: 'project',
        icon: './assets/images/project-icons/desanjuntar-pdf.png',
        detailImage: './assets/images/project-icons/desanjuntar-pdf.png',
        description: 'Extractor desktop de adjuntos embebidos en archivos PDF',
        url: 'https://github.com/IAZARA/DesanjuntarPDF',
        repositoryUrl: 'https://github.com/IAZARA/DesanjuntarPDF',
        technologies: ['Python', 'PyQt6', 'PyMuPDF', 'pikepdf', 'pytest', 'GitHub Actions'],
        category: 'Aplicación de escritorio',
        status: 'Open source',
        details: 'Herramienta de escritorio para detectar, separar y extraer archivos adjuntos embebidos en documentos PDF. Ofrece una interfaz gráfica con PyQt6, procesamiento con PyMuPDF y pikepdf, pruebas automatizadas y flujo de integración continua.'
    },
    {
        id: 'juego-ciberseguridad',
        name: 'CyberShield',
        type: 'project',
        icon: './assets/images/project-icons/cybershield-icon.png',
        detailImage: './assets/images/project-icons/cybershield-icon.png',
        description: 'Juego mobile-first de ciberseguridad e higiene digital',
        url: 'https://github.com/IAZARA/Juego_Ciberseguridad',
        repositoryUrl: 'https://github.com/IAZARA/Juego_Ciberseguridad',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Node.js', 'Express', 'Docker', 'i18n'],
        category: 'Juego educativo',
        status: 'Open source',
        details: 'Experiencia interactiva de siete niveles para aprender a detectar phishing, QRishing, vishing, riesgos de Wi-Fi público y malas prácticas digitales. Es una SPA mobile-first bilingüe, servida por Express y preparada para Docker.'
    },
    {
        id: 'radar-empleo',
        name: 'JobSignal',
        type: 'project',
        icon: './assets/images/project-icons/jobsignal-logo.png',
        detailImage: './assets/images/project-icons/jobsignal-logo.png',
        description: 'Radar open source para priorizar oportunidades laborales por fit',
        url: 'https://github.com/IAZARA/Radar_Empleo',
        repositoryUrl: 'https://github.com/IAZARA/Radar_Empleo',
        technologies: ['React 19', 'TypeScript', 'Vite', 'Scoring determinístico', 'localStorage'],
        category: 'HR Tech / Automatización',
        status: 'Open source',
        details: 'Convierte un flujo de búsqueda laboral en una experiencia de producto: perfil configurable, fuentes activables, shortlist ordenada por score, explicación del match y pipeline local de aplicaciones. El MVP funciona con datos demo y deja preparados adapters para fuentes reales.'
    },
    {
        id: 'workflow-black-box',
        name: 'Workflow Black Box',
        type: 'project',
        icon: './assets/images/project-icons/workflow-black-box-icon.png',
        detailImage: './assets/images/project-icons/workflow-black-box-icon.png',
        description: 'Consola de diagnóstico para automatizaciones y agentes',
        url: 'https://github.com/IAZARA/workflow-black-box',
        repositoryUrl: 'https://github.com/IAZARA/workflow-black-box',
        technologies: ['React 19', 'TypeScript', 'Vite', 'Docker', 'MCP', 'Playwright'],
        category: 'Observabilidad / Automatización',
        status: 'Open source',
        details: 'Analiza workflows exportados de n8n, Make y Zapier junto con logs de ejecución. Visualiza el recorrido, detecta riesgos y causas probables, vincula hallazgos con evidencia y genera reportes accionables. También expone el motor mediante un servidor MCP para agentes.'
    },
    {
        id: 'cufre',
        name: 'CUFRE',
        type: 'project',
        icon: './assets/images/hd-icons/control-panel.svg',
        detailImage: './assets/images/hd-icons/control-panel.svg',
        description: 'Plataforma de gestión y priorización de casos',
        url: '#',
        technologies: ['Java', 'Spring Boot', 'React', 'Maven', 'Oracle'],
        category: 'Plataforma institucional',
        status: 'En producción',
        details: 'Plataforma CRUD para priorizar y dar seguimiento a registros críticos. El trabajo abarca relevamiento con usuarios, definición funcional, coordinación entre áreas, implementación y puesta en producción, con foco en trazabilidad, privacidad y calidad del dato.'
    },
    {
        id: 'sifebu',
        name: 'SIFEBU',
        type: 'project',
        icon: './assets/images/hd-icons/projects.svg',
        detailImage: './assets/images/hd-icons/projects.svg',
        description: 'Sistema Federal de Búsqueda de Personas',
        url: '#',
        technologies: ['JavaScript', 'TypeScript', 'React', 'Oracle'],
        category: 'Sistema federal',
        status: 'En producción',
        details: 'Desarrollo de un sistema federal orientado a disponibilidad, resguardo y calidad de la información. Incluye traducción de necesidades operativas a funcionalidades, integración con datos institucionales y acompañamiento a áreas usuarias.'
    },
    {
        id: 'criaco',
        name: 'CRIACO',
        type: 'project',
        icon: './assets/images/hd-icons/api.svg',
        detailImage: './assets/images/hd-icons/api.svg',
        description: 'Plataforma de análisis territorial y GIS',
        url: '#',
        technologies: ['GIS', 'Mapas', 'Capas de datos', 'Visualización'],
        category: 'Análisis territorial',
        status: 'En producción',
        details: 'Plataforma de análisis territorial con componentes GIS, mapas, capas de información y visualización de datos. El proyecto combina contexto operativo, calidad de datos y herramientas visuales para apoyar el análisis.'
    },
    {
        id: 'sistema-enterprise-java',
        name: 'Sistema Enterprise Java',
        type: 'project',
        icon: './assets/images/hd-icons/control-panel.svg',
        detailImage: './assets/images/hd-icons/control-panel.svg',
        description: 'Aplicación full stack para gestión de expedientes',
        url: '#',
        technologies: ['Java 17', 'Spring Boot 3', 'React 18', 'TypeScript', 'Oracle Database', 'Docker'],
        category: 'Enterprise',
        status: 'Activo',
        details: 'Aplicación empresarial para gestión de expedientes y casos con backend Spring Boot, frontend React, Oracle, autenticación JWT, roles, 2FA, auditoría, dashboards, APIs de integración, contenedores Docker y configuraciones por ambiente.'
    },
    {
        id: 'n8n-workflows-atencion',
        name: 'Workflows n8n - Atención al Cliente',
        type: 'project',
        icon: './assets/images/hd-icons/n8n.svg',
        detailImage: './assets/images/hd-icons/n8n.svg',
        description: 'Automatización omnicanal de procesos de atención al cliente',
        url: '#',
        technologies: ['n8n', 'Webhook APIs', 'Gmail API', 'Slack API', 'Google Sheets API', 'WhatsApp Business API'],
        category: 'Automatización',
        status: 'Activo',
        details: 'Suite de workflows para clasificar consultas, coordinar respuestas, escalar casos complejos, enviar seguimientos, sincronizar datos y registrar métricas. Integra canales y servicios con validaciones, manejo de errores, recuperación y trazabilidad.'
    }
];

const projectEvidence = {
    zaratexp: {
        featured: true,
        role: { es: 'Diseño de producto, arquitectura frontend, implementación, QA y despliegue.', en: 'Product design, frontend architecture, implementation, QA and deployment.' },
        problem: { es: 'Un CV tradicional no mostraba la amplitud técnica, de producto y de gestión del perfil.', en: 'A traditional resume did not demonstrate the profile\'s technical, product and management breadth.' },
        solution: { es: 'Construí un portfolio explorable inspirado en Windows XP, con aplicaciones reales, estado persistente, accesibilidad, responsive design y despliegue continuo.', en: 'I built an explorable Windows XP-inspired portfolio with real applications, persistent state, accessibility, responsive design and continuous deployment.' },
        evidence: { es: ['Repositorio público y GitHub Pages', 'Pruebas automatizadas y smoke tests con Playwright', 'Aplicaciones Canvas, File API, Web Audio y APIs públicas'], en: ['Public repository and GitHub Pages', 'Automated checks and Playwright smoke tests', 'Canvas, File API, Web Audio and public API applications'] }
    },
    osintargy: {
        featured: true,
        role: { es: 'Producto, experiencia de usuario, frontend, backend y despliegue de la plataforma.', en: 'Product, user experience, frontend, backend and platform deployment.' },
        problem: { es: 'Las herramientas OSINT en español estaban dispersas y resultaban difíciles de abordar para nuevos usuarios.', en: 'Spanish-language OSINT tools were fragmented and difficult for new users to approach.' },
        solution: { es: 'Centralicé utilidades, visualizaciones y contenidos educativos en una plataforma orientada a investigaciones éticas.', en: 'I centralized utilities, visualizations and educational content in a platform focused on ethical investigations.' },
        evidence: { es: ['Plataforma pública en producción', 'Repositorio open source', 'Visualizaciones, generador de dorks y recursos educativos'], en: ['Public production platform', 'Open-source repository', 'Visualizations, dork generator and educational resources'] }
    },
    'wjpc-capituloargentino': {
        role: { es: 'Implementación full stack, panel administrativo, seguridad y despliegue cloud.', en: 'Full-stack implementation, admin panel, security and cloud deployment.' },
        problem: { es: 'La organización necesitaba presencia institucional y autonomía para gestionar noticias y eventos.', en: 'The organization needed an institutional presence and autonomy to manage news and events.' },
        solution: { es: 'Desarrollé un sitio público con administración autenticada, almacenamiento de imágenes y CI/CD en Google Cloud.', en: 'I developed a public site with authenticated administration, image storage and CI/CD on Google Cloud.' },
        evidence: { es: ['Sitio institucional publicado', 'Panel administrativo y autenticación JWT', 'Despliegue serverless con Docker y Google Cloud'], en: ['Published institutional site', 'Admin panel and JWT authentication', 'Serverless deployment with Docker and Google Cloud'] }
    },
    forzatech: {
        role: { es: 'Definición de producto, propuesta de servicios y experiencia comercial.', en: 'Product definition, service offering and commercial experience.' },
        problem: { es: 'Las PYMEs necesitan entender rápidamente qué soluciones digitales pueden mejorar su operación.', en: 'Small and midsize businesses need to quickly understand which digital solutions can improve operations.' },
        solution: { es: 'Organicé sistemas, automatización, marketing e IA en una oferta clara y orientada a necesidades concretas.', en: 'I organized systems, automation, marketing and AI into a clear offering focused on concrete needs.' },
        evidence: { es: ['Sitio comercial publicado', 'Oferta de sistemas a medida y automatización', 'Canales de conversión y contacto directo'], en: ['Published commercial site', 'Custom systems and automation offering', 'Conversion paths and direct contact'] }
    },
    'estudio-luttini': {
        role: { es: 'Diseño responsive, implementación frontend, SEO y publicación.', en: 'Responsive design, frontend implementation, SEO and publishing.' },
        problem: { es: 'El estudio necesitaba comunicar servicios jurídicos y contables complejos con claridad y confianza.', en: 'The firm needed to communicate complex legal and accounting services with clarity and trust.' },
        solution: { es: 'Desarrollé una presencia institucional responsive con jerarquía de contenidos y contacto directo.', en: 'I developed a responsive institutional presence with clear content hierarchy and direct contact.' },
        evidence: { es: ['Sitio público activo', 'Contenido organizado por áreas de servicio', 'Responsive design y SEO técnico básico'], en: ['Active public site', 'Content organized by service areas', 'Responsive design and foundational technical SEO'] }
    },
    cap21: {
        role: { es: 'Arquitectura de catálogo, implementación frontend e integración comercial.', en: 'Catalog architecture, frontend implementation and commercial integration.' },
        problem: { es: 'El negocio necesitaba exhibir un catálogo amplio y convertir consultas en pedidos sin sumar fricción.', en: 'The business needed to present a broad catalog and turn inquiries into orders without adding friction.' },
        solution: { es: 'Implementé un catálogo responsive que permite seleccionar productos y continuar el pedido por WhatsApp.', en: 'I implemented a responsive catalog that lets customers select products and continue the order through WhatsApp.' },
        evidence: { es: ['Catálogo público en producción', 'Navegación por categorías', 'Flujo de pedido conectado con WhatsApp'], en: ['Public production catalog', 'Category-based navigation', 'Ordering flow connected to WhatsApp'] }
    },
    'auto-inbox': {
        featured: true,
        role: { es: 'Diseño de producto, arquitectura de integraciones e implementación de escritorio.', en: 'Product design, integration architecture and desktop implementation.' },
        problem: { es: 'Los equipos de soporte repiten clasificación y redacción, pero no deben perder control sobre el envío.', en: 'Support teams repeat classification and drafting work but must retain control over sending.' },
        solution: { es: 'Construí un asistente que clasifica correos, consulta conocimiento y prepara borradores con revisión humana obligatoria.', en: 'I built an assistant that classifies email, retrieves knowledge and prepares drafts with mandatory human review.' },
        evidence: { es: ['Repositorio open source', 'Integraciones Gmail API y Google Sheets', 'Proveedores de IA configurables y human-in-the-loop'], en: ['Open-source repository', 'Gmail API and Google Sheets integrations', 'Configurable AI providers and human-in-the-loop workflow'] }
    },
    'art-redmine': {
        featured: true,
        role: { es: 'Diseño de producto, arquitectura full stack, integración Redmine, seguridad y despliegue.', en: 'Product design, full-stack architecture, Redmine integration, security and deployment.' },
        problem: { es: 'Los equipos de soporte necesitan reunir contexto, priorizar y redactar respuestas sin perder control, trazabilidad ni criterio humano.', en: 'Support teams need to gather context, prioritize and draft replies without losing control, traceability or human judgment.' },
        solution: { es: 'Construí una plataforma que sincroniza Redmine, recupera conocimiento, propone respuestas y exige validación humana antes de publicar.', en: 'I built a platform that synchronizes Redmine, retrieves knowledge, proposes replies and requires human validation before publishing.' },
        evidence: { es: ['Repositorio abierto con licencia MIT y documentación técnica', 'FastAPI, React, PostgreSQL y Docker', 'Inteligencia de servicio, roles, TOTP, auditoría, OCR e integración Redmine'], en: ['Open repository with an MIT license and technical documentation', 'FastAPI, React, PostgreSQL and Docker', 'Service intelligence, roles, TOTP, auditing, OCR and Redmine integration'] }
    },
    forzatask: {
        featured: true,
        role: { es: 'Diseño y desarrollo full stack, colaboración en tiempo real, seguridad y publicación open source.', en: 'Full-stack product design and development, real-time collaboration, security and open-source release.' },
        problem: { es: 'La coordinación fragmentada entre tableros, documentos, calendario y reportes dificulta sostener una visión operativa compartida.', en: 'Fragmented boards, documents, calendars and reports make it difficult for teams to maintain a shared operational view.' },
        solution: { es: 'Unifiqué esos flujos en una SPA React y una API Express con MongoDB, permisos, tiempo real y despliegue reproducible mediante Docker.', en: 'I consolidated those workflows into a React SPA and Express API with MongoDB, permissions, real-time collaboration and reproducible Docker deployment.' },
        evidence: { es: ['Kanban, tareas, documentos, wiki, calendario y reportes PDF/Excel', 'React, Express, MongoDB, Socket.IO, Nginx y Docker Compose', 'JWT, 2FA, rate limiting, pruebas automatizadas y CI verificada'], en: ['Kanban, tasks, documents, versioned wiki, calendar and PDF/Excel reporting', 'React, Express, MongoDB, Socket.IO, Nginx and Docker Compose', 'JWT, 2FA, rate limiting, automated tests and verified CI'] }
    },
    'arana-web': {
        featured: true,
        role: { es: 'Diseño y desarrollo full stack, pipeline de extracción, IA configurable, seguridad y experiencia de revisión.', en: 'Full-stack product design and development, extraction pipeline, configurable AI, security and review experience.' },
        problem: { es: 'Monitorear temas entre buscadores, feeds y sitios produce duplicados, trabajo repetitivo y decisiones difíciles de auditar.', en: 'Tracking topics across search engines, feeds and websites creates duplicates, repetitive work and decisions that are difficult to audit.' },
        solution: { es: 'Construí una cola human-in-the-loop que unifica descubrimiento, extracción y clasificación, conserva las fuentes, aprende de decisiones y exporta solo contenido validado.', en: 'I built a human-in-the-loop queue that unifies discovery, extraction and classification, preserves sources, learns from decisions and exports validated content only.' },
        evidence: { es: ['Pipeline multi-fuente con URLs, RSS, Google News y GDELT', 'FastAPI, React, SQLite, clasificación configurable y exportación Excel', 'Protección SSRF, redacción de secretos, pruebas automatizadas y CI verificada'], en: ['Multi-source pipeline for direct URLs, RSS, Google News and GDELT', 'FastAPI, React, SQLite, configurable classification and Excel export', 'SSRF protection, secret redaction, automated tests and verified CI'] }
    },
    'seo-evaluate': {
        role: { es: 'Producto, análisis técnico, frontend y motor de auditoría.', en: 'Product, technical analysis, frontend and audit engine.' },
        problem: { es: 'Las auditorías SEO suelen ser opacas y no contemplan cómo los asistentes de IA interpretan un sitio.', en: 'SEO audits are often opaque and do not address how AI assistants interpret a site.' },
        solution: { es: 'Desarrollé una auditoría sin registro que transforma HTML y robots.txt en prioridades explicadas y accionables.', en: 'I developed a no-signup audit that turns HTML and robots.txt into explained, actionable priorities.' },
        evidence: { es: ['Aplicación pública desplegada', 'Repositorio open source', 'Análisis de schema, rastreo, SEO y citabilidad'], en: ['Deployed public application', 'Open-source repository', 'Schema, crawlability, SEO and citability analysis'] }
    },
    cyberdetective: {
        role: { es: 'Arquitectura full stack y diseño de una experiencia educativa gamificada.', en: 'Full-stack architecture and design of a gamified learning experience.' },
        problem: { es: 'Practicar investigación digital requiere entornos guiados, evidencia verificable y feedback inmediato.', en: 'Practicing digital investigation requires guided environments, verifiable evidence and immediate feedback.' },
        solution: { es: 'Diseñé una academia por retos con validación automática, equipos, rankings y administración.', en: 'I designed a challenge-based academy with automatic validation, teams, rankings and administration.' },
        evidence: { es: ['Repositorio open source', 'Frontend y backend dockerizados', 'Retos, rankings, equipos y modo conferencia'], en: ['Open-source repository', 'Dockerized frontend and backend', 'Challenges, rankings, teams and conference mode'] }
    },
    'desanjuntar-pdf': {
        role: { es: 'Diseño de herramienta, aplicación desktop y automatización de pruebas.', en: 'Tool design, desktop application and test automation.' },
        problem: { es: 'Extraer adjuntos embebidos en PDFs requiere herramientas técnicas poco accesibles para usuarios finales.', en: 'Extracting embedded PDF attachments requires technical tools that are not accessible to most users.' },
        solution: { es: 'Construí una aplicación gráfica que detecta y extrae adjuntos con validaciones y manejo seguro de archivos.', en: 'I built a graphical application that detects and extracts attachments with validation and safe file handling.' },
        evidence: { es: ['Repositorio open source', 'Interfaz PyQt6', 'pytest e integración continua'], en: ['Open-source repository', 'PyQt6 interface', 'pytest and continuous integration'] }
    },
    'juego-ciberseguridad': {
        role: { es: 'Diseño educativo, experiencia mobile-first e implementación full stack liviana.', en: 'Learning design, mobile-first experience and lightweight full-stack implementation.' },
        problem: { es: 'La higiene digital se aprende mejor mediante decisiones concretas que con contenido exclusivamente teórico.', en: 'Digital hygiene is learned more effectively through concrete decisions than theory alone.' },
        solution: { es: 'Creé una experiencia bilingüe de siete niveles sobre amenazas cotidianas y buenas prácticas.', en: 'I created a bilingual seven-level experience about everyday threats and good practices.' },
        evidence: { es: ['Repositorio open source', 'Siete niveles interactivos', 'Experiencia bilingüe mobile-first y Docker'], en: ['Open-source repository', 'Seven interactive levels', 'Bilingual mobile-first experience and Docker'] }
    },
    'radar-empleo': {
        role: { es: 'Diseño de producto, modelo de scoring e implementación frontend.', en: 'Product design, scoring model and frontend implementation.' },
        problem: { es: 'Las búsquedas laborales dispersan información y dificultan priorizar oportunidades por encaje real.', en: 'Job searches fragment information and make it difficult to prioritize opportunities by actual fit.' },
        solution: { es: 'Diseñé un radar que explica el match, ordena oportunidades y mantiene un pipeline local de postulaciones.', en: 'I designed a radar that explains match quality, ranks opportunities and keeps a local application pipeline.' },
        evidence: { es: ['Repositorio open source', 'Scoring determinístico explicable', 'Shortlist y pipeline persistidos localmente'], en: ['Open-source repository', 'Explainable deterministic scoring', 'Locally persisted shortlist and pipeline'] }
    },
    'workflow-black-box': {
        featured: true,
        role: { es: 'Producto, motor de diagnóstico, experiencia de análisis e integración MCP.', en: 'Product, diagnostic engine, analysis experience and MCP integration.' },
        problem: { es: 'Los fallos en automatizaciones distribuidas son difíciles de explicar cuando logs y configuración están separados.', en: 'Failures in distributed automations are difficult to explain when logs and configuration are separated.' },
        solution: { es: 'Construí una consola que relaciona workflows, ejecuciones, riesgos, causas probables y evidencia accionable.', en: 'I built a console that connects workflows, executions, risks, likely causes and actionable evidence.' },
        evidence: { es: ['Repositorio open source', 'Soporte para n8n, Make y Zapier', 'Servidor MCP y pruebas Playwright'], en: ['Open-source repository', 'Support for n8n, Make and Zapier', 'MCP server and Playwright tests'] }
    },
    cufre: {
        featured: true,
        role: { es: 'Relevamiento, definición funcional, coordinación técnica, implementación y puesta en producción.', en: 'Discovery, functional definition, technical coordination, implementation and production rollout.' },
        problem: { es: 'Las áreas usuarias necesitaban priorizar registros críticos y mantener trazabilidad sobre su seguimiento.', en: 'User teams needed to prioritize critical records and preserve traceability throughout follow-up.' },
        solution: { es: 'Participé de punta a punta en una plataforma CRUD con controles de privacidad, calidad del dato y operación institucional.', en: 'I contributed end to end to a CRUD platform with privacy, data quality and institutional operation controls.' },
        evidence: { es: ['Caso institucional en producción', 'Stack Java, Spring Boot, React y Oracle', 'Trabajo directo con usuarios y áreas técnicas'], en: ['Institutional case in production', 'Java, Spring Boot, React and Oracle stack', 'Direct work with users and technical teams'] }
    },
    sifebu: {
        role: { es: 'Descubrimiento con usuarios, traducción funcional e integración de datos institucionales.', en: 'User discovery, functional translation and institutional data integration.' },
        problem: { es: 'Un sistema federal requiere disponibilidad, resguardo y criterios compartidos de calidad de información.', en: 'A federal system requires availability, protection and shared information quality criteria.' },
        solution: { es: 'Acompañé la definición y construcción de funcionalidades conectando necesidades operativas, datos y equipos técnicos.', en: 'I supported feature definition and delivery by connecting operational needs, data and technical teams.' },
        evidence: { es: ['Caso institucional en producción', 'Integración con datos institucionales', 'Acompañamiento a áreas usuarias'], en: ['Institutional case in production', 'Institutional data integration', 'Support for user teams'] }
    },
    criaco: {
        role: { es: 'Análisis funcional, modelado de capas y experiencia de visualización territorial.', en: 'Functional analysis, layer modeling and territorial visualization experience.' },
        problem: { es: 'El análisis territorial requiere combinar contexto operativo con múltiples capas de información.', en: 'Territorial analysis requires combining operational context with multiple information layers.' },
        solution: { es: 'Contribuí a una plataforma GIS que organiza mapas, capas y visualizaciones para apoyar el análisis.', en: 'I contributed to a GIS platform that organizes maps, layers and visualizations to support analysis.' },
        evidence: { es: ['Caso institucional en producción', 'Mapas y capas de datos', 'Visualización orientada a decisiones operativas'], en: ['Institutional case in production', 'Maps and data layers', 'Visualization focused on operational decisions'] }
    },
    'sistema-enterprise-java': {
        role: { es: 'Arquitectura full stack, seguridad, APIs y configuración de despliegue.', en: 'Full-stack architecture, security, APIs and deployment configuration.' },
        problem: { es: 'La gestión de expedientes sensibles necesita permisos, auditoría e integraciones confiables.', en: 'Sensitive case management requires permissions, auditing and reliable integrations.' },
        solution: { es: 'Implementé una arquitectura Java y React con Oracle, JWT, roles, 2FA, auditoría y contenedores.', en: 'I implemented a Java and React architecture with Oracle, JWT, roles, 2FA, auditing and containers.' },
        evidence: { es: ['Arquitectura Java 17 y Spring Boot 3', 'Seguridad por roles, 2FA y auditoría', 'APIs, dashboards y Docker'], en: ['Java 17 and Spring Boot 3 architecture', 'Role-based security, 2FA and auditing', 'APIs, dashboards and Docker'] }
    },
    'n8n-workflows-atencion': {
        role: { es: 'Diseño de procesos, integraciones, manejo de errores y observabilidad.', en: 'Process design, integrations, error handling and observability.' },
        problem: { es: 'La atención omnicanal pierde trazabilidad cuando cada canal y registro se opera por separado.', en: 'Omnichannel support loses traceability when each channel and record is operated separately.' },
        solution: { es: 'Diseñé workflows que clasifican, escalan, sincronizan y registran consultas con recuperación ante fallos.', en: 'I designed workflows that classify, escalate, synchronize and record inquiries with failure recovery.' },
        evidence: { es: ['Integraciones Gmail, Slack, Sheets y WhatsApp', 'Validaciones y manejo de errores', 'Trazabilidad y registro de métricas'], en: ['Gmail, Slack, Sheets and WhatsApp integrations', 'Validation and error handling', 'Traceability and metric recording'] }
    }
};

for (const project of projects) {
    Object.assign(project, projectEvidence[project.id] || {});
}

const folderProjectIds = {
    featured: ['zaratexp', 'osintargy', 'forzatask', 'arana-web', 'auto-inbox', 'art-redmine', 'workflow-black-box', 'cufre'],
    web: [
        'forzatech',
        'estudio-luttini',
        'cap21',
        'wjpc-capituloargentino',
        'osintargy',
        'zaratexp',
        'auto-inbox',
        'art-redmine',
        'forzatask',
        'arana-web',
        'seo-evaluate',
        'cyberdetective',
        'juego-ciberseguridad',
        'radar-empleo',
        'workflow-black-box'
    ],
    ai: [
        'auto-inbox',
        'art-redmine',
        'arana-web',
        'seo-evaluate',
        'cyberdetective',
        'osintargy',
        'radar-empleo',
        'workflow-black-box',
        'n8n-workflows-atencion'
    ]
};

export function getProjectsData(folder) {
    if (folder === 'root') return projects;

    const ids = folderProjectIds[folder];
    if (!ids) return [];

    const projectById = new Map(projects.map((project) => [project.id, project]));
    return ids.map((id) => projectById.get(id)).filter(Boolean);
}
