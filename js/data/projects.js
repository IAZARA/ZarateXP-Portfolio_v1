const projects = [
    {
        id: 'zaratexp',
        name: 'Zárate XP',
        type: 'project',
        icon: './assets/images/hd-icons/my-computer.svg',
        detailImage: './logo_ivanxp.png',
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
        detailImage: './assets/readme/zaratexp-banner.png',
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

const folderProjectIds = {
    web: [
        'forzatech',
        'estudio-luttini',
        'cap21',
        'wjpc-capituloargentino',
        'osintargy',
        'zaratexp',
        'auto-inbox',
        'seo-evaluate',
        'cyberdetective',
        'juego-ciberseguridad',
        'radar-empleo',
        'workflow-black-box'
    ],
    ai: [
        'auto-inbox',
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
