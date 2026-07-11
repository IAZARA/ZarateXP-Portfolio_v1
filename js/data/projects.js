export function getProjectsData(folder) {
    // Para la carpeta root, mostrar directamente los proyectos sin carpetas
    if (folder === 'root') {
        return [
            {
                id: 'zaratexp',
                name: 'Zárate XP',
                type: 'project',
                icon: './assets/images/hd-icons/my-computer.svg',
                detailImage: './logo_ivanxp.png',
                description: 'Portfolio interactivo estilo Windows XP',
                url: '#',
                technologies: ['HTML', 'CSS', 'JavaScript'],
                category: 'Portfolio',
                status: 'Activo',
                details: 'Portfolio personal desarrollado como una simulación completa del sistema operativo Windows XP, incluyendo escritorio interactivo, ventanas funcionales, y aplicaciones integradas.'
            },
            {
                id: 'osintargy',
                name: 'OSINTArgy',
                type: 'project',
                icon: './assets/images/hd-icons/api.svg',
                detailImage: './osintargy.png',
                description: 'Plataforma OSINT para la Comunidad Hispana',
                url: 'https://osintargy.online',
                technologies: ['React 18', 'Node.js', 'MongoDB', 'Canvas HTML5', 'Vite'],
                category: 'OSINT Platform',
                status: 'Activo',
                details: 'OSINTArgy es una plataforma integral de inteligencia de fuentes abiertas (OSINT) diseñada específicamente para democratizar el acceso a herramientas y conocimientos especializados en la comunidad hispanohablante de Argentina y Latinoamérica.'
            },
            {
                id: 'wjpc-capituloargentino',
                name: 'WJPC Capítulo Argentino',
                type: 'project',
                icon: './icono.png',
                detailImage: './icono.png',
                description: 'Sitio web oficial del Capítulo Argentino del Centro de Estudios Hemisféricos de Defensa William J. Perry',
                url: 'https://www.wjpc-capituloargentino.org/',
                preview: true,
                technologies: ['React 18', 'Vite', 'Tailwind CSS', 'Node.js', 'Express.js', 'Docker', 'Google Cloud Platform'],
                category: 'Institucional',
                status: 'Activo',
                details: 'Aplicación web completa para una organización profesional dedicada a la integración continental y el fortalecimiento de vínculos fraternales entre las naciones americanas. Incluye un sitio público institucional y un panel administrativo para gestión de contenido. Stack tecnológico: Frontend con React 18 + Vite + Tailwind CSS + React Router, Backend con Node.js + Express.js + JWT Authentication, infraestructura en Google Cloud Platform (Cloud Run, Cloud Build, Cloud Storage), contenedorización con Docker + Nginx. Características principales: Sitio público responsive con información institucional, panel de administración con CRUD para noticias y eventos, autenticación JWT con middleware de seguridad, integración con Google Cloud Storage para imágenes, despliegue serverless en Cloud Run con CI/CD, rate limiting y CSP para seguridad. Arquitectura moderna y escalable con prácticas DevOps, seguridad implementada correctamente y responsive design profesional.'
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
                icon: './assets/images/hd-icons/wordpad.svg',
                detailImage: './assets/images/hd-icons/wordpad.svg',
                description: 'Sitio institucional jurídico-contable para profesionales y empresas',
                url: 'https://www.estudioluttini.com/',
                preview: true,
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'SEO'],
                category: 'Institucional',
                status: 'Activo',
                details: 'Sitio web profesional para un estudio jurídico-contable en Puerto Madero, orientado a comunicar servicios legales, contables, impositivos, societarios y de compliance para personas, profesionales, PYMEs y empresas.'
            },
            {
                id: 'limpia-limpia',
                name: 'Limpia-Limpia',
                type: 'project',
                icon: './limpia-limpia.png',
                detailImage: './limpia-limpia.png',
                description: 'Landing Page de Servicio de Limpieza de Tapizados',
                url: '#',
                technologies: ['HTML5', 'CSS3', 'JavaScript Vanilla', 'WhatsApp Business API'],
                category: 'Landing Page',
                status: 'Próximamente',
                details: 'Sitio web profesional y responsivo para "Limpia-Limpia", servicio especializado en limpieza de tapizados, sillones y sillas. Landing page optimizada para conversión con integración directa a WhatsApp. Características principales: Diseño responsivo mobile-first con navegación adaptativa, interfaz interactiva con slider antes/después y animaciones smooth scroll, conversión optimizada con múltiples CTAs integrados con WhatsApp, UX moderna con tipografía Google Fonts (Poppins) y esquema de colores profesional. Stack tecnológico: Frontend con HTML5, CSS3 puro, JavaScript vanilla, características avanzadas con CSS Grid/Flexbox, CSS Variables, Intersection Observer API, integración con WhatsApp Business API, performance optimizada con assets optimizados y lazy loading preparado. Funcionalidades: Header con navegación sticky y hamburger menu, sección hero con CTA principal, grid de servicios (sillones, sillas, limpieza profunda), galería interactiva antes/después, proceso paso a paso (4 etapas), botón flotante de WhatsApp, footer informativo. Valor de negocio: Landing diseñada para generar leads vía WhatsApp, diseño que transmite confianza y calidad, estructura preparada para agregar más servicios, SEO Ready con meta tags y estructura semántica optimizada. Diseño con paleta cyan primario (#06b6d4) y verde secundario (#10b981), animaciones con transiciones suaves y efectos hover, responsivo con breakpoints móvil, tablet, desktop, accesibilidad con contraste adecuado y navegación por teclado.'
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
                description: 'Aplicación empresarial full-stack para gestión de expedientes con arquitectura escalable',
                url: '#',
                technologies: ['Java 17', 'Spring Boot 3.2.3', 'React 18.3.1', 'TypeScript', 'Material-UI', 'Oracle Database 21c', 'Docker', 'Nginx'],
                category: 'Enterprise',
                status: 'Activo',
                details: 'Aplicación empresarial de nivel enterprise para gestión de expedientes y casos, demostrando arquitectura full-stack escalable y robusta con cumplimiento de estándares internacionales de seguridad. Backend: Spring Boot 3.2.3 con Java 17, Oracle Database 21c, arquitectura Repository/Service pattern, migraciones Flyway, mapeo MapStruct entity-DTO, monitoreo Spring Actuator, manejo centralizado de excepciones. Frontend: React 18.3.1 con TypeScript, Material-UI para componentes, gestión de estado con Context API, hooks personalizados para lógica reutilizable, rutas protegidas con verificación de roles, lazy loading y error boundaries, service workers para funcionalidad offline. Funcionalidades clave: Sistema de gestión completa de expedientes con creación/edición de casos, gestión de personas con scoring de prioridad, carga y gestión de fotos/documentos, tracking de estados. API pública con endpoint público, codificación Base64 de fotos para fácil integración, filtrado por autorización judicial, CORS habilitado para sitios institucionales. Dashboard avanzado con estadísticas y métricas en tiempo real, charts interactivos (Recharts), mapas de calor geográficos (Leaflet), rankings por tipo, evolución temporal de casos. Seguridad enterprise: Autenticación JWT con refresh tokens, 2FA obligatorio (Google Authenticator), acceso basado en roles granular (ADMIN/USER/READ_ONLY), auditoría completa de actividades, protección de timeout de sesión, cumplimiento de normas OWASP Top 10 para seguridad en aplicaciones web, implementación de controles ISO/IEC 27001 para Sistema de Gestión de Seguridad de la Información (SGSI), incluyendo establecimiento, implementación, mantenimiento y mejora continua de políticas de seguridad. DevOps: Dockerfiles multi-stage optimizados, orquestación Docker Compose, configuraciones específicas por ambiente, scripts de deployment automatizado, health checks de contenedores. Demostración de arquitectura de nivel enterprise con seguridad robusta certificada bajo estándares internacionales, escalabilidad y API pública para integración institucional.'
            },
            {
                id: 'n8n-workflows-atencion',
                name: 'Workflows n8n - Atención al Cliente',
                type: 'project',
                icon: './assets/images/hd-icons/n8n.svg',
                detailImage: './assets/images/hd-icons/n8n.svg',
                description: 'Automatización de procesos de atención al cliente para e-commerce mediante workflows inteligentes',
                url: '#',
                technologies: ['n8n', 'Webhook APIs', 'Gmail API', 'Slack API', 'Google Sheets API', 'WhatsApp Business API', 'Telegram Bot API'],
                category: 'Automatización',
                status: 'Activo',
                details: 'Suite de workflows de automatización diseñada para optimizar procesos de atención al cliente en tiendas online y e-commerce. Workflows implementados: Gestión automática de consultas por WhatsApp con clasificación inteligente de mensajes, respuestas automáticas según tipo de consulta, escalamiento a agentes humanos para casos complejos, integración con base de datos de productos para consultas de stock y precios. Automatización de seguimiento post-venta con envío automático de emails de seguimiento después de compras, solicitud de reseñas y feedback, notificaciones de estado de envío, recordatorios de garantía y soporte técnico. Sistema de alertas y monitoreo con notificaciones en Slack para pedidos urgentes, alertas de stock bajo, reportes diarios de métricas de atención, escalamiento automático de quejas y reclamos. Sincronización de datos entre plataformas con actualización automática de inventario entre sistemas, sincronización de datos de clientes, exportación de métricas a Google Sheets, backup automático de conversaciones importantes. Gestión de tickets de soporte con creación automática de tickets desde múltiples canales (email, WhatsApp, formularios web), asignación inteligente según disponibilidad y especialización del equipo, seguimiento automático de tiempos de respuesta, cierre automático de tickets resueltos. Integración omnicanal con conexión entre WhatsApp, Telegram, email y formularios web, historial unificado de conversaciones por cliente, routing inteligente según canal de origen y tipo de consulta. Los workflows están diseñados con triggers inteligentes, validaciones de datos, manejo de errores y recuperación automática, logging detallado para auditoría y optimización. Demostración de capacidades de automatización empresarial con integración multi-plataforma y mejora significativa en tiempos de respuesta y satisfacción del cliente.'
            }
        ];
    }
    
    // Mantener el comportamiento original para otras carpetas
    const projectsData = {
        'web': [
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
                details: 'ForzaTech ayuda a PYMEs argentinas con marketing digital, sistemas a medida, automatización, apps móviles, micro-SaaS y soporte para vender y operar mejor.'
            },
            {
                id: 'estudio-luttini',
                name: 'Estudio Luttini',
                type: 'project',
                icon: './assets/images/hd-icons/wordpad.svg',
                detailImage: './assets/images/hd-icons/wordpad.svg',
                description: 'Sitio institucional jurídico-contable',
                url: 'https://www.estudioluttini.com/',
                preview: true,
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'SEO'],
                category: 'Institucional',
                status: 'Activo',
                details: 'Sitio web profesional para un estudio jurídico-contable en Puerto Madero, con foco en servicios legales, contables, impositivos, societarios y de compliance para personas, profesionales, PYMEs y empresas.'
            },
            {
                id: 'wjpc-capituloargentino',
                name: 'WJPC Capítulo Argentino',
                type: 'project',
                icon: './icono.png',
                detailImage: './icono.png',
                description: 'Sitio institucional del Capítulo Argentino William J. Perry',
                url: 'https://www.wjpc-capituloargentino.org/',
                preview: true,
                technologies: ['React 18', 'Vite', 'Tailwind CSS', 'Node.js', 'Express.js', 'Docker', 'Google Cloud Platform'],
                category: 'Institucional',
                status: 'Activo',
                details: 'Sitio público institucional con panel de administración, gestión de noticias y eventos, autenticación, despliegue serverless y arquitectura full stack preparada para operación continua.'
            },
            {
                id: 'osintargy',
                name: 'OSINTArgy',
                type: 'project',
                icon: './assets/images/hd-icons/api.svg',
                detailImage: './osintargy.png',
                description: 'Plataforma OSINT para la Comunidad Hispana',
                url: 'https://osintargy.online',
                technologies: ['React 18', 'Node.js', 'MongoDB', 'Canvas HTML5', 'Vite'],
                category: 'OSINT Platform',
                status: 'Activo',
                details: 'OSINTArgy es una plataforma integral de inteligencia de fuentes abiertas (OSINT) diseñada específicamente para democratizar el acceso a herramientas y conocimientos especializados en la comunidad hispanohablante de Argentina y Latinoamérica. Características principales: Interfaz tipo galaxia con visualización interactiva, generador avanzado de Google Dorks con 400+ dorks especializados, herramientas OSINT especializadas para email, username y análisis de archivos, componentes educativos con academia OSINT y juego detective. Stack tecnológico: React 18 + Vite, Canvas HTML5 para visualizaciones, Node.js 18+ + Express.js, MongoDB con autenticación JWT. Impacto: Democratización del conocimiento OSINT en español, enfoque educativo con propósito social.'
            },
            {
                id: 'zaratexp',
                name: 'ZarateXP Portfolio',
                type: 'project',
                icon: './assets/images/hd-icons/my-computer.svg',
                detailImage: './logo_ivanxp.png',
                description: 'Portfolio interactivo estilo Windows XP',
                url: '#',
                technologies: ['HTML', 'CSS', 'JavaScript'],
                category: 'Portfolio',
                status: 'Activo',
                details: 'Portfolio personal desarrollado como una simulación completa del sistema operativo Windows XP, incluyendo escritorio interactivo, ventanas funcionales, y aplicaciones integradas.'
            }
        ],
        'ai': []
    };

    return projectsData[folder] || [];
}
