import { getProjectsData } from './data/projects.js?v=zaratexp-20260712-release';
// --- Gestor de Aplicaciones Dinámicas para ZarateXP ---

// --- AppManager Class para compatibilidad con el sistema existente ---
const debugLog = (...args) => {
    if (window.ZARATEXP_DEBUG) console.log(...args);
};

export class AppManager {
    constructor() {
        this.apps = new Map();
        this.runningApps = new Map();
        this.scriptPromises = new Map();
        this.windowManager = null; // Se asignará en init()
        
        // Register built-in applications
        this.registerBuiltInApps();
    }
    
    init(windowManager) {
        // Guardar referencia al WindowManager
        this.windowManager = windowManager;
        
        // Cargar el script principal de Winamp una sola vez cuando se inicializa el sistema
        this.loadAppScripts();

        // Aplicar preferencias del escritorio antes de abrir ventanas
        this.applyPersonalization();
    }
    
    loadAppScripts() {
        // Las apps pesadas se cargan bajo demanda para mantener rapido el boot.
    }
    
    registerBuiltInApps() {
        const hd = './assets/images/hd-icons';

        // Registrar Mi PC
        this.registerApp({
            id: 'my-computer',
            name: 'Mi PC',
            icon: `${hd}/my-computer.svg`,
            category: 'system',
            description: 'Browse computer files and drives',
            handler: () => this._openMyComputer()
        });
        
        // Registrar Winamp
        this.registerApp({
            id: 'winamp',
            name: 'Winamp',
            icon: `${hd}/winamp.svg`,
            category: 'entertainment',
            description: 'It really whips the llama\'s ass!',
            handler: () => this._openWinamp()
        });
        
        // Registrar otras aplicaciones básicas para compatibilidad
        this.registerApp({
            id: 'about-me',
            name: 'Sobre Mí',
            icon: `${hd}/about.svg`,
            category: 'system',
            description: 'Conoce más sobre Ivan Zarate',
            handler: () => this._openAboutMe()
        });
        
        this.registerApp({
            id: 'projects',
            name: 'Mis Proyectos',
            icon: `${hd}/projects.svg`,
            category: 'documents',
            description: 'Explora mis proyectos de desarrollo',
            handler: () => this._openProjectsExplorer()
        });
        
        this.registerApp({
            id: 'resume',
            name: 'Mi CV',
            icon: `${hd}/cv.svg`,
            category: 'documents',
            description: 'Ver CV actualizado',
            handler: () => this._openResume()
        });

        this.registerApp({
            id: 'recruiter-route',
            name: 'Perfil orientado a FDE',
            icon: `${hd}/cv.svg`,
            category: 'documents',
            description: 'Experiencia, casos, capacidades y contacto en una sola ruta',
            handler: () => this._openRecruiterRoute()
        });

        this.registerApp({
            id: 'documents',
            name: 'Mis Documentos',
            icon: `${hd}/documents.svg`,
            category: 'documents',
            description: 'CV, proyectos y documentos clave',
            handler: () => this._openDocuments()
        });
        
        this.registerApp({
            id: 'contact',
            name: 'Mi Contacto',
            icon: `${hd}/contact.svg`,
            category: 'internet',
            description: 'Envíame un mensaje',
            handler: () => this._openContact()
        });
        
        // Registrar Buscaminas
        this.registerApp({
            id: 'minesweeper',
            name: 'Buscaminas',
            icon: `${hd}/minesweeper.svg?v=20260712`,
            category: 'games',
            description: 'Juego clásico de Buscaminas',
            handler: () => this._openMinesweeper()
        });
        
        // Registrar Paint
        this.registerApp({
            id: 'paint',
            name: 'Paint',
            icon: `${hd}/paint.svg`,
            category: 'accessories',
            description: 'Editor de imágenes Paint',
            handler: () => this._openPaint()
        });

        this.registerApp({
            id: 'notepad',
            name: 'Bloc de notas',
            icon: `${hd}/notepad.svg`,
            category: 'accessories',
            description: 'Notas rapidas con autoguardado local',
            handler: () => this._openNotepad()
        });

        this.registerApp({
            id: 'wordpad',
            name: 'WordPad',
            icon: `${hd}/wordpad.svg`,
            category: 'accessories',
            description: 'Editor de texto enriquecido',
            handler: () => this._openWordPad()
        });

        this.registerApp({
            id: 'n8n-flows',
            name: 'Flujos n8n',
            icon: `${hd}/n8n.svg`,
            category: 'automation',
            description: 'Automatizaciones visuales y funcionales',
            handler: () => this._openN8nFlows()
        });

        this.registerApp({
            id: 'control-panel',
            name: 'Panel de control',
            icon: `${hd}/control-panel.svg`,
            category: 'system',
            description: 'Personalizacion de ZarateXP',
            handler: () => this._openControlPanel()
        });

        this.registerApp({
            id: 'system-properties',
            name: 'Propiedades del sistema',
            icon: `${hd}/control-panel.svg`,
            category: 'system',
            description: 'Resumen XP de la plataforma, entorno y accesos clave',
            handler: () => this._openSystemProperties()
        });

        this.registerApp({
            id: 'api-center',
            name: 'API Center',
            icon: `${hd}/api.svg`,
            category: 'development',
            description: 'Integraciones en vivo con APIs publicas',
            handler: () => this._openApiCenter()
        });

        this.registerApp({
            id: 'pdf-studio',
            name: 'PDF Studio',
            icon: `${hd}/pdf-studio.svg`,
            category: 'documents',
            description: 'Abrir, revisar y anotar PDFs',
            handler: () => this._openPdfStudio()
        });

        this.registerApp({
            id: 'solitaire',
            name: 'Solitario',
            icon: `${hd}/solitaire.svg`,
            category: 'games',
            description: 'Klondike estilo Windows XP',
            handler: () => this._openSolitaire()
        });

        this.registerApp({
            id: 'pinball',
            name: 'Pinball XP',
            icon: `${hd}/pinball.svg?v=20260712`,
            category: 'games',
            description: 'Mesa de pinball canvas inspirada en XP',
            handler: () => this._openPinball()
        });
    }
    
    registerApp(appConfig) {
        this.apps.set(appConfig.id, appConfig);
    }
    
    openApp(appId) {
        const app = this.apps.get(appId);
        if (!app) {
            console.error(`App not found: ${appId}`);
            this.showError(`Application "${appId}" not found`);
            return;
        }
        
        // Check if app is already running for single-instance apps
        if (this.runningApps.has(appId) && !app.multiInstance) {
            debugLog(`App ${appId} is already running`);
            if (this.windowManager?.focusWindow) {
                this.windowManager.focusWindow(this.runningApps.get(appId) || appId);
            }
            return;
        }
        
        // Play launch sound
        if (window.zarateXP?.soundManager) {
            window.zarateXP.soundManager.play('click');
        }

        window.zarateXP?.startMenuManager?.addRecentProgram?.(appId);
        
        // Execute app handler
        try {
            const result = app.handler();
            if (result && result.windowId) {
                this.runningApps.set(appId, result.windowId);
            }
        } catch (error) {
            console.error(`Failed to launch app ${appId}:`, error);
            this.showError(`Failed to launch "${app.name}"`);
        }
    }
    
    // --- Métodos privados para aplicaciones específicas ---
    
    async _openMyComputer() {
        // Prevenir que se abra más de una ventana de "Mi PC"
        if (this.runningApps.has('my-computer')) {
            debugLog('Mi PC is already running');
            // Intentar enfocar la ventana existente si el WindowManager lo permite
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('my-computer');
            }
            return;
        }

        try {
            // 1. Esperar a que se cargue el contenido del archivo
            debugLog('Loading mipc.html...');
            const response = await fetch('./mipc.html');
            if (!response.ok) {
                throw new Error(`Error al cargar mipc.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();
            
            debugLog('mipc.html loaded successfully, extracting and adapting content...');

            // Extraer el contenido del window-body pero mantener la estructura necesaria para CSS
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const windowBody = doc.querySelector('.window-body');
            
            let content;
            if (windowBody) {
                // Crear un contenedor con el ID necesario para los estilos CSS
                content = `<div id="mipc-window">${windowBody.innerHTML}</div>`;
                debugLog('Window body content extracted and wrapped with mipc-window ID');
            } else {
                // Fallback: usar todo el contenido si no se encuentra window-body
                content = htmlContent;
                debugLog('Window body not found, using full content as fallback');
            }

            // 2. Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // 3. Una vez que el contenido está listo, crear la ventana
            debugLog('Creating Mi PC window with WindowManager...');
            
            const window = this.windowManager.createWindow({
                id: 'my-computer',
                title: 'Mi PC',
                icon: './assets/images/hd-icons/my-computer.svg',
                content: content,
                width: 660,
                height: 500
            });

            // 4. Marcar como aplicación en ejecución
            this.runningApps.set('my-computer', 'my-computer');

            window.querySelectorAll('[data-open-program]').forEach((item) => {
                const openTarget = () => this.openApp(item.dataset.openProgram);
                item.addEventListener('click', openTarget);
                item.addEventListener('dblclick', openTarget);
            });

            // 5. Configurar cleanup cuando se cierre la ventana
            // Usar MutationObserver para detectar cuando la ventana se remueve del DOM
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === window) {
                                debugLog('Mi PC window removed, cleaning up...');
                                this.closeApp('my-computer');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (window.parentNode) {
                observer.observe(window.parentNode, { childList: true });
            }

            debugLog('Mi PC window created successfully with cleanup observer');
            return window;

        } catch (error) {
            console.error("No se pudo abrir 'Mi PC':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-mipc',
                    title: 'Error',
                    icon: './assets/images/hd-icons/my-computer.svg',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar el componente 'Mi PC'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                            <button onclick="this.closest('.window').remove()">OK</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                // Fallback si WindowManager no está disponible
                alert(`Error: No se pudo abrir Mi PC. ${error.message}`);
            }
        }
    }
    
    async _openWinamp() {
        const content = `
            <div class="xp-winamp-pro" data-winamp-root>
                <section class="xp-winamp-main">
                    <div class="xp-winamp-screen">
                        <canvas width="360" height="104" data-winamp-visualizer></canvas>
                        <div class="xp-winamp-readout">
                            <strong data-winamp-title>01. API Weather Groove</strong>
                            <span data-winamp-meta>44 kHz stereo - Web Audio API</span>
                            <small data-winamp-time>00:00 / 00:00</small>
                        </div>
                    </div>
                    <input class="xp-winamp-seek" type="range" min="0" max="100" value="0" data-winamp-seek aria-label="Progreso">
                    <div class="xp-winamp-controls">
                        <button type="button" data-winamp-action="prev">|&lt;</button>
                        <button type="button" data-winamp-action="play">&gt;</button>
                        <button type="button" data-winamp-action="pause">||</button>
                        <button type="button" data-winamp-action="stop">[]</button>
                        <button type="button" data-winamp-action="next">&gt;|</button>
                        <button type="button" data-winamp-action="shuffle">SHUF</button>
                        <button type="button" data-winamp-action="repeat">REP</button>
                        <button type="button" data-winamp-action="close">X</button>
                    </div>
                    <div class="xp-winamp-mixers">
                        <label>Vol <input type="range" min="0" max="100" value="70" data-winamp-volume></label>
                        <label>Bal <input type="range" min="-100" max="100" value="0" data-winamp-balance></label>
                    </div>
                </section>
                <section class="xp-winamp-eq">
                    <h3>Ecualizador</h3>
                    <div class="xp-eq-sliders">
                        <label>60<input type="range" min="-12" max="12" value="2" data-eq-band="bass"></label>
                        <label>1K<input type="range" min="-12" max="12" value="0" data-eq-band="mid"></label>
                        <label>14K<input type="range" min="-12" max="12" value="3" data-eq-band="treble"></label>
                    </div>
                    <p data-winamp-status>Listo para reproducir loops generados en navegador.</p>
                </section>
                <section class="xp-winamp-playlist">
                    <h3>Playlist</h3>
                    <ol data-winamp-playlist></ol>
                </section>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'winamp',
            title: 'Winamp XP Pro - Web Audio Lab',
            icon: './assets/images/hd-icons/winamp.svg',
            content,
            width: 720,
            height: 500,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/winamp-pro.js', 'initWinampProApp')
                    .then(() => window.initWinampProApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar Winamp: ${error.message}`));
            },
            onClose: (appWindow) => window.destroyWinampProApp?.(appWindow)
        });
    }

    async _openAboutMe() {
        // Prevenir que se abra más de una ventana de "Sobre Mí"
        if (this.runningApps.has('about-me')) {
            debugLog('About Me is already running');
            // Intentar enfocar la ventana existente si el WindowManager lo permite
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('about-me');
            }
            return;
        }

        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // Crear contenido de la ventana "Sobre Mí"
            const content = `
                <div id="about-me-window">
                    <div class="about-me-menu-bar">
                        <span><u>A</u>rchivo</span>
                        <span><u>E</u>dición</span>
                        <span><u>V</u>er</span>
                        <span><u>H</u>erramientas</span>
                        <span>A<u>y</u>uda</span>
                    </div>
                    <div class="about-me-container">
                        <header class="about-profile">
                            <img src="images/foto-nuevo-usuario.jpeg" alt="Retrato de Ivan Agustin Zarate" width="112" height="112" loading="eager" decoding="async" />
                            <div>
                                <p class="about-kicker">Software Analyst &amp; Project Manager</p>
                                <h2>Conecto usuarios, producto y tecnología.</h2>
                                <p>Perfil orientado a oportunidades de Forward Deployed Engineer (FDE), con experiencia en plataformas institucionales, MLOps y datos sensibles.</p>
                            </div>
                        </header>
                        <div class="about-sections">
                            <article class="about-section">
                                <div class="about-image">
                                    <img src="images/sobremi/fullstack-developer.webp" alt="Trabajo de descubrimiento y desarrollo de plataformas" width="136" height="136" loading="lazy" decoding="async" />
                                </div>
                                <div class="about-text">
                                    <h3>Capacidades alineadas con Forward Deployed Engineering</h3>
                                    <p>Relevo necesidades con usuarios, traduzco problemas operativos en definiciones funcionales y técnicas, coordino la integración y acompaño la puesta en producción. Desde 2024 trabajo como <strong>Analista en Sistemas y Project Manager de Plataformas Digitales</strong> en el Ministerio de Seguridad Nacional.</p>
                                </div>
                            </article>

                            <article class="about-section">
                                <div class="about-image">
                                    <img src="images/sobremi/ai-automation.webp" alt="Ciclo de vida de modelos y automatización" width="136" height="136" loading="lazy" decoding="async" />
                                </div>
                                <div class="about-text">
                                    <h3>IA aplicada y MLOps</h3>
                                    <p>Participo en preparación y validación de datos, experimentación, versionado, despliegue, monitoreo y mejora iterativa de modelos. Trabajo con redes neuronales, modelos de texto e imagen, <strong>Hugging Face, QLoRA, modelos locales y agentes de programación</strong>, cuidando la privacidad y la minimización de datos compartidos.</p>
                                </div>
                            </article>

                            <article class="about-section">
                                <div class="about-image">
                                    <img src="images/sobremi/privacy-data-products.webp" alt="Gestión responsable de datos críticos" width="136" height="136" loading="lazy" decoding="async" />
                                </div>
                                <div class="about-text">
                                    <h3>Datos críticos, privacidad y seguridad</h3>
                                    <p>Trabajo con calidad del dato, control de accesos, auditoría, trazabilidad, OSINT, análisis GIS y ciberseguridad aplicada. Entre 2018 y 2024 desarrollé funciones técnicas sobre bases de datos públicas en la Policía Federal Argentina, con foco en resguardo de información y uso responsable de sistemas.</p>
                                </div>
                            </article>

                            <article class="about-section">
                                <div class="about-image">
                                    <img src="images/sobremi/forzatech-founder.webp" alt="Coordinación de equipos y trabajo con usuarios" width="136" height="136" loading="lazy" decoding="async" />
                                </div>
                                <div class="about-text">
                                    <h3>Coordinación y comunicación</h3>
                                    <p>Coordino áreas usuarias, proveedores, equipos técnicos y especialistas en ciberseguridad. Antes lideré equipos operativos en la Policía Federal Argentina y trabajé en administración de personal en COTO Digital. Esa experiencia aporta planificación, criterio, comunicación bajo presión y manejo confidencial de documentación.</p>
                                </div>
                            </article>

                            <article class="about-section">
                                <div class="about-image">
                                    <img src="images/sobremi/shipping-projects.webp" alt="Implementación de sistemas productivos" width="136" height="136" loading="lazy" decoding="async" />
                                </div>
                                <div class="about-text">
                                    <h3>Construcción y entrega</h3>
                                    <p>Desarrollo sistemas con <strong>Java, Spring Boot, React, JavaScript, TypeScript, Maven, APIs, Git, Oracle y SQL</strong>. CUFRE, SIFEBU, CRIACO y OSINTArgy muestran experiencia en plataformas CRUD, información federal, GIS, investigación digital y capacitación.</p>
                                </div>
                            </article>

                            <article class="about-section about-section-education">
                                <div class="about-text">
                                    <h3>Formación e idiomas</h3>
                                    <p><strong>Analista de Sistemas, ORT Argentina</strong> (título obtenido). Licenciatura en Seguridad con orientación en Investigación Criminal. Google Data Analytics Professional Certificate, con SQL, Tableau, R y hojas de cálculo. Español nativo e inglés intermedio, con comprensión técnica y experiencia en reuniones con proveedores.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>
            `;

            // Crear la ventana usando el WindowManager
            const aboutWindow = this.windowManager.createWindow({
                id: 'about-me',
                title: 'Sobre Mí - Ivan Agustin Zarate',
                icon: './assets/images/hd-icons/about.svg',
                content: content,
                width: 700,
                height: 600,
                resizable: true,
                maximizable: true
            });

            // Marcar como aplicación en ejecución
            this.runningApps.set('about-me', 'about-me');

            // Configurar cleanup cuando se cierre la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === aboutWindow) {
                                debugLog('About Me window removed, cleaning up...');
                                this.closeApp('about-me');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (aboutWindow.parentNode) {
                observer.observe(aboutWindow.parentNode, { childList: true });
            }

            debugLog('About Me window created successfully');
            return aboutWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Sobre Mí':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-aboutme',
                    title: 'Error',
                    icon: './assets/images/hd-icons/about.svg',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Sobre Mí'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                            <button onclick="this.closest('.window').remove()">OK</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                // Fallback si WindowManager no está disponible
                alert(`Error: No se pudo abrir Sobre Mí. ${error.message}`);
            }
        }
    }

    async _openContact() {
        // Prevenir que se abra más de una ventana de "Contacto"
        if (this.runningApps.has('contact')) {
            debugLog('Contact is already running');
            // Intentar enfocar la ventana existente si el WindowManager lo permite
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('contact');
            }
            return;
        }

        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // Cargar el contenido del componente de contacto
            debugLog('Loading contacto.html...');
            const response = await fetch('./components/contacto.html');
            if (!response.ok) {
                throw new Error(`Error al cargar contacto.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();

            // Crear la ventana usando el WindowManager
            const contactWindow = this.windowManager.createWindow({
                id: 'contact',
                title: 'Mi Contacto - Ivan Agustin Zarate',
                icon: './assets/images/hd-icons/contact.svg',
                content: htmlContent,
                width: 500,
                height: 650,
                resizable: true,
                maximizable: true
            });

            // Marcar como aplicación en ejecución
            this.runningApps.set('contact', 'contact');

            // Configurar la funcionalidad del formulario
            setTimeout(() => {
                debugLog('Esperando para configurar formulario de contacto...');
                // La ventana de contacto es la que acabamos de crear
                if (contactWindow) {
                    debugLog('Ventana de contacto encontrada, configurando formulario...');
                    this._setupContactForm(contactWindow);
                } else {
                    console.error('No se encontró la ventana de contacto después del timeout');
                }
            }, 300);

            // Configurar cleanup cuando se cierre la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === contactWindow) {
                                debugLog('Contact window removed, cleaning up...');
                                this.closeApp('contact');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (contactWindow.parentNode) {
                observer.observe(contactWindow.parentNode, { childList: true });
            }

            debugLog('Contact window created successfully');
            return contactWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Mi Contacto':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-contact',
                    title: 'Error',
                    icon: './assets/images/hd-icons/contact.svg',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Mi Contacto'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                            <button onclick="this.closest('.window').remove()">OK</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                // Fallback si WindowManager no está disponible
                alert(`Error: No se pudo abrir Mi Contacto. ${error.message}`);
            }
        }
    }

    _setupContactForm(contactWindow) {
        debugLog('Configurando formulario de contacto...');
        try {
            const form = contactWindow.querySelector('#contact-form');
            const sendBtn = contactWindow.querySelector('.toolbar-btn[form="contact-form"]') ||
                           contactWindow.querySelector('.toolbar-btn[title*="Send"]') ||
                           contactWindow.querySelector('.toolbar-btn img[src*="Email"]')?.parentElement;

            debugLog('Form encontrado:', !!form);
            debugLog('SendBtn encontrado:', !!sendBtn);

            if (!form) {
                console.error('No se encontró el formulario de contacto');
                return;
            }

            // Configurar envío del formulario
            const handleSubmit = async (e) => {
                debugLog('handleSubmit llamado!');
                e.preventDefault();
                
                const name = form.querySelector('#contact-name').value || "Visitor from ZarateXP";
                const email = form.querySelector('#contact-email').value;
                const subject = form.querySelector('#contact-subject').value;
                const body = form.querySelector('#contact-body').value;
                const honeypot = form.querySelector('#contact-website')?.value.trim();
                
                debugLog('Datos del formulario:', { name, email, subject, body });

                if (honeypot) {
                    debugLog('Contacto descartado por honeypot');
                    form.reset();
                    return;
                }

                if (!email || !subject || !body) {
                    this._showValidationError('Por favor completa todos los campos requeridos: Email, Asunto y Mensaje');
                    return;
                }

                const lastSent = Number(localStorage.getItem('zarateXP.contactLastSent') || 0);
                if (Date.now() - lastSent < 60000) {
                    this._showValidationError('Espera un minuto antes de enviar otro mensaje.');
                    return;
                }

                // Mostrar estado de envío
                this._showSendingStatus(contactWindow);

                try {
                    if (!this._canUseEmailJs()) {
                        throw new Error('EmailJS deshabilitado para este dominio');
                    }

                    // Inicializar EmailJS si no está inicializado
                    if (!window.emailjs) {
                        throw new Error('EmailJS no está cargado');
                    }

                    // Configuración de EmailJS
                    const SERVICE_ID = 'service_8';
                    const TEMPLATE_ID = 'template_9q3ojjb';
                    const PUBLIC_KEY = 'OFfF3bg1HcEMdZIeF';

                    // Inicializar EmailJS con tu public key
                    emailjs.init(PUBLIC_KEY);

                    // Parámetros para el template (coincidiendo con tu configuración)
                    const templateParams = {
                        name: `${name} (${email})`,  // Combinamos nombre y email
                        message: `Asunto: ${subject}\n\n${body}`,  // Incluimos el asunto en el mensaje
                        email: email,  // Por si lo necesitas en el futuro
                        subject: subject  // Por si lo necesitas en el futuro
                    };

                    // Enviar email
                    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
                    
                    debugLog('Email enviado exitosamente:', response);
                    
                    // Cerrar ventana de estado de envío
                    const sendingWindow = document.querySelector('[data-window-id="sending-status"]');
                    if (sendingWindow) {
                        sendingWindow.remove();
                    }
                    
                    // Mostrar confirmación de éxito
                    this._showContactConfirmation(contactWindow);
                    localStorage.setItem('zarateXP.contactLastSent', String(Date.now()));
                    
                    // Limpiar formulario
                    form.reset();
                    
                } catch (error) {
                    console.error('Error al enviar email:', error);

                    const sendingWindow = document.querySelector('[data-window-id="sending-status"]');
                    if (sendingWindow) {
                        sendingWindow.remove();
                    }
                    
                    const fullMessage = `Hola Ivan,\n\nDe: ${email}\nNombre: ${name}\n\n${body}\n\n---\nEnviado desde ZarateXP Portfolio`;
                    const mailtoLink = `mailto:ivan.agustin.95@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;

                    if (error.message.includes('Service ID') || error.message.includes('Template ID') || error.message.includes('Public Key') || error.message.includes('dominio')) {
                        window.open(mailtoLink, '_blank', 'noopener');
                        this._showMailtoFallback(contactWindow);
                    } else {
                        this._showEmailError(contactWindow, error.message, mailtoLink);
                    }
                }
            };

            // Configurar eventos de envío
            form.addEventListener('submit', handleSubmit);
            
            // Configurar botón de envío en toolbar
            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSubmit(e);
                });
            }

            // Configurar funcionalidad de toolbar buttons
            this._setupToolbarButtons(contactWindow, form);

            // Enfocar el primer campo editable
            const firstInput = form.querySelector('#contact-email');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 200);
            }

            debugLog('Contact form configured successfully');

        } catch (error) {
            console.error('Error configurando formulario de contacto:', error);
        }
    }

    _canUseEmailJs() {
        const allowedHosts = new Set(['iazara.github.io', 'localhost', '127.0.0.1']);
        return allowedHosts.has(window.location.hostname);
    }

    _setupToolbarButtons(contactWindow, form) {
        try {
            // Botón "New Message" - limpiar formulario
            const newMsgBtn = contactWindow.querySelector('[data-contact-command="new"]') ||
                contactWindow.querySelector('.toolbar-btn img[src*="Outlook"]')?.parentElement;
            if (newMsgBtn) {
                newMsgBtn.addEventListener('click', () => {
                    form.reset();
                    const firstInput = form.querySelector('#contact-email');
                    if (firstInput) {
                        firstInput.focus();
                    }
                });
            }

            // Botón "Libreta de Direcciones" - acción placeholder
            const addressBtn = contactWindow.querySelector('[data-contact-command="address-book"]') ||
                contactWindow.querySelector('.toolbar-btn img[src*="Address"]')?.parentElement;
            if (addressBtn) {
                addressBtn.addEventListener('click', () => {
                    this._showInfoDialog('Libreta de Direcciones', 'Contáctame directamente en ivan.agustin.95@gmail.com');
                });
            }

            // Botones de edición (Cut, Copy, Paste) - funcionalidad básica
            const cutBtn = contactWindow.querySelector('[data-contact-command="cut"]') ||
                contactWindow.querySelector('.toolbar-btn img[src*="Cut"]')?.parentElement;
            const copyBtn = contactWindow.querySelector('[data-contact-command="copy"]') ||
                contactWindow.querySelector('.toolbar-btn img[src*="Copy"]')?.parentElement;
            const pasteBtn = contactWindow.querySelector('[data-contact-command="paste"]') ||
                contactWindow.querySelector('.toolbar-btn img[src*="Paste"]')?.parentElement;

            if (cutBtn) {
                cutBtn.addEventListener('click', () => {
                    document.execCommand('cut');
                });
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    document.execCommand('copy');
                });
            }

            if (pasteBtn) {
                pasteBtn.addEventListener('click', () => {
                    document.execCommand('paste');
                });
            }

        } catch (error) {
            console.error('Error configurando botones de toolbar:', error);
        }
    }

    _showValidationError(message) {
        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'validation-error',
                title: 'Error de Entrada',
                icon: './assets/images/xp-small-icons/critical.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 32px; color: #FF0000; margin-bottom: 10px;">⚠️</div>
                        <div style="margin-bottom: 20px; color: #000;">${message}</div>
                        <button onclick="this.closest('.window').remove()" style="padding: 6px 16px; min-width: 75px;">Aceptar</button>
                    </div>
                `,
                width: 350,
                height: 150,
                resizable: false,
                maximizable: false
            });
        } else {
            alert(message);
        }
    }

    _showInfoDialog(title, message) {
        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'info-dialog',
                title: title,
                icon: './assets/images/xp-small-icons/information.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <img src="./assets/images/xp-small-icons/information.png" alt="Informacion" width="40" height="40" style="margin-bottom: 10px;">
                        <div style="margin-bottom: 20px; color: #000;">${message}</div>
                        <button onclick="this.closest('.window').remove()" style="padding: 6px 16px; min-width: 75px;">Aceptar</button>
                    </div>
                `,
                width: 350,
                height: 150,
                resizable: false,
                maximizable: false
            });
        } else {
            alert(message);
        }
    }

    async _openProjectsExplorer() {
        // Prevenir que se abra más de una ventana de "Mis Proyectos"
        if (this.runningApps.has('projects')) {
            debugLog('Projects Explorer is already running');
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('projects');
            }
            return;
        }

        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // Cargar el contenido del componente de proyectos
            debugLog('Loading proyectos-explorer.html...');
            const response = await fetch('./components/proyectos-explorer.html');
            if (!response.ok) {
                throw new Error(`Error al cargar proyectos-explorer.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();

            // Crear la ventana usando el WindowManager
            const projectsWindow = this.windowManager.createWindow({
                id: 'projects',
                title: 'Mis Proyectos - Explorer',
                icon: './assets/images/hd-icons/projects.svg',
                content: htmlContent,
                width: 800,
                height: 600,
                resizable: true,
                maximizable: true
            });

            // Marcar como aplicación en ejecución
            this.runningApps.set('projects', 'projects');

            // Configurar la funcionalidad del explorer
            setTimeout(() => {
                this._setupProjectsExplorer(projectsWindow);
            }, 100);

            // Configurar cleanup cuando se cierre la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === projectsWindow) {
                                debugLog('Projects window removed, cleaning up...');
                                this.closeApp('projects');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (projectsWindow.parentNode) {
                observer.observe(projectsWindow.parentNode, { childList: true });
            }

            debugLog('Projects Explorer window created successfully');
            return projectsWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Mis Proyectos':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-projects',
                    title: 'Error',
                    icon: './assets/images/hd-icons/projects.svg',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Mis Proyectos'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                            <button onclick="this.closest('.window').remove()">Aceptar</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                // Fallback si WindowManager no está disponible
                alert(`Error: No se pudo abrir Mis Proyectos. ${error.message}`);
            }
        }
    }

    _setupProjectsExplorer(projectsWindow) {
        try {
            // Configurar navegación del árbol de carpetas
            this._setupTreeNavigation(projectsWindow);
            
            // Configurar botones de la toolbar
            this._setupExplorerToolbar(projectsWindow);
            
            // Configurar vista de contenido
            this._setupContentView(projectsWindow);
            
            // Cargar contenido inicial
            this._loadFolderContent(projectsWindow, 'root');

            debugLog('Projects Explorer configured successfully');

        } catch (error) {
            console.error('Error configurando Projects Explorer:', error);
        }
    }

    _setupTreeNavigation(projectsWindow) {
        const treeItems = projectsWindow.querySelectorAll('.tree-item');
        
        treeItems.forEach(item => {
            const content = item.querySelector('.tree-item-content');
            const expand = item.querySelector('.tree-expand');
            
            // Click en el contenido del item
            content.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remover selección anterior
                projectsWindow.querySelectorAll('.tree-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Seleccionar el item actual
                item.classList.add('selected');
                
                // Actualizar barra de direcciones
                const path = item.getAttribute('data-path') || 'Mis Proyectos';
                const pathInput = projectsWindow.querySelector('#current-path');
                if (pathInput) {
                    pathInput.value = path;
                }
                
                // Cargar contenido de la carpeta
                const folder = item.getAttribute('data-folder');
                this._loadFolderContent(projectsWindow, folder);
            });
            
            // Click en el botón de expandir/contraer
            if (expand) {
                expand.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (item.classList.contains('expanded')) {
                        item.classList.remove('expanded');
                        expand.textContent = '+';
                        const icon = item.querySelector('.tree-icon');
                        if (icon) {
                            icon.src = './assets/images/xp-small-icons/folder-closed.png';
                        }
                    } else {
                        item.classList.add('expanded');
                        expand.textContent = '−';
                        const icon = item.querySelector('.tree-icon');
                        if (icon) {
                            icon.src = './assets/images/xp-small-icons/folder-opened.png';
                        }
                    }
                });
            }
        });
    }

    _setupExplorerToolbar(projectsWindow) {
        // Botón de vista de íconos
        const iconViewBtn = projectsWindow.querySelector('[data-view="icons"]');
        const listViewBtn = projectsWindow.querySelector('[data-view="list"]');
        
        if (iconViewBtn) {
            iconViewBtn.addEventListener('click', () => {
                iconViewBtn.classList.add('active');
                if (listViewBtn) listViewBtn.classList.remove('active');
                this._switchView(projectsWindow, 'icons');
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                listViewBtn.classList.add('active');
                if (iconViewBtn) iconViewBtn.classList.remove('active');
                this._switchView(projectsWindow, 'list');
            });
        }

        // Botón de carpetas (toggle panel izquierdo)
        const foldersBtn = projectsWindow.querySelector('#btn-folders');
        if (foldersBtn) {
            foldersBtn.addEventListener('click', () => {
                const leftPanel = projectsWindow.querySelector('.explorer-left-panel');
                const splitter = projectsWindow.querySelector('.explorer-splitter');
                
                if (leftPanel && splitter) {
                    const isVisible = leftPanel.style.display !== 'none';
                    leftPanel.style.display = isVisible ? 'none' : 'flex';
                    splitter.style.display = isVisible ? 'none' : 'block';
                    
                    // Cambiar estado del botón
                    if (isVisible) {
                        foldersBtn.classList.remove('active');
                    } else {
                        foldersBtn.classList.add('active');
                    }
                }
            });
        }
    }

    _setupContentView(projectsWindow) {
        const contentArea = projectsWindow.querySelector('#explorer-content');
        if (!contentArea) return;

        // Configurar eventos de doble clic para abrir proyectos
        contentArea.addEventListener('dblclick', (e) => {
            const projectItem = e.target.closest('.project-item');
            if (projectItem) {
                const projectId = projectItem.getAttribute('data-project-id');
                if (projectId) {
                    this._openProjectDetails(projectsWindow, projectId);
                }
            }
        });

        // Configurar selección de elementos
        contentArea.addEventListener('click', (e) => {
            const projectItem = e.target.closest('.project-item');
            
            if (projectItem) {
                // Remover selección anterior
                contentArea.querySelectorAll('.project-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Seleccionar el item actual
                projectItem.classList.add('selected');
                
                // Actualizar barra de estado
                this._updateStatusBar(projectsWindow, projectItem);
            } else {
                // Click en área vacía, deseleccionar todo
                contentArea.querySelectorAll('.project-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                this._updateStatusBar(projectsWindow);
            }
        });
    }

    _loadFolderContent(projectsWindow, folder) {
        const contentArea = projectsWindow.querySelector('#explorer-content');
        const statusCount = projectsWindow.querySelector('#items-count');
        
        if (!contentArea) return;

        // Mostrar indicador de carga
        contentArea.innerHTML = `
            <div class="loading-message">
                <img src="./assets/images/xp-small-icons/folder-opened.png" width="32" height="32"/>
                <p>Cargando proyectos...</p>
            </div>
        `;

        // Simular carga asíncrona
        setTimeout(() => {
            const projects = this._getProjectsData(folder);
            const viewMode = projectsWindow.querySelector('.view-btn.active').getAttribute('data-view') || 'icons';
            
            this._renderProjects(contentArea, projects, viewMode);
            
            // Actualizar contador
            if (statusCount) {
                statusCount.textContent = `${projects.length} elemento${projects.length !== 1 ? 's' : ''}`;
            }
        }, 300);
    }

    _getProjectsData(folder) {
        return getProjectsData(folder);
    }

    _renderProjects(contentArea, projects, viewMode) {
        if (viewMode === 'icons') {
            this._renderIconView(contentArea, projects);
        } else {
            this._renderListView(contentArea, projects);
        }
    }

    _renderIconView(contentArea, projects) {
        const iconsHtml = projects.map(project => {
            const safeId = this._safeDomId(project.id);
            const safeType = this._escapeHtml(project.type);
            const safeName = this._escapeHtml(project.name);
            const safeDescription = this._escapeHtml(project.description);
            const safeCategory = this._escapeHtml(project.category || '-');
            const iconHtml = this._renderProjectIcon(project, 32);
            
            return `
                <div class="project-item" data-project-id="${safeId}" data-type="${safeType}" title="${safeDescription}">
                    <div class="project-icon">
                        ${iconHtml}
                    </div>
                    <div class="project-name">${safeName}</div>
                    <div class="project-details">${project.type === 'folder' ? 'Carpeta' : safeCategory}</div>
                </div>
            `;
        }).join('');

        contentArea.innerHTML = `<div class="icons-view">${iconsHtml}</div>`;
    }

    _renderListView(contentArea, projects) {
        const listHtml = `
            <div class="list-view">
                <div class="list-header">
                    <div class="list-header-row">
                        <div class="list-header-cell">Nombre</div>
                        <div class="list-header-cell">Tipo</div>
                        <div class="list-header-cell">Categoría</div>
                        <div class="list-header-cell">Estado</div>
                    </div>
                </div>
                <div class="list-body">
                    ${projects.map(project => {
                        const safeId = this._safeDomId(project.id);
                        const safeType = this._escapeHtml(project.type);
                        const safeName = this._escapeHtml(project.name);
                        const safeCategory = this._escapeHtml(project.category || '-');
                        const safeStatus = this._escapeHtml(project.status || '-');
                        const iconHtml = this._renderProjectIcon(project, 16);
                        
                        return `
                            <div class="list-row" data-project-id="${safeId}" data-type="${safeType}">
                                <div class="list-cell">
                                    <span class="list-cell-icon">${iconHtml}</span>
                                    ${safeName}
                                </div>
                                <div class="list-cell">${project.type === 'folder' ? 'Carpeta' : 'Proyecto'}</div>
                                <div class="list-cell">${safeCategory}</div>
                                <div class="list-cell">${safeStatus}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        contentArea.innerHTML = listHtml;
    }

    _switchView(projectsWindow, viewMode) {
        const contentArea = projectsWindow.querySelector('#explorer-content');
        const currentFolder = projectsWindow.querySelector('.tree-item.selected')?.getAttribute('data-folder') || 'root';
        const projects = this._getProjectsData(currentFolder);
        
        this._renderProjects(contentArea, projects, viewMode);
    }

    _updateStatusBar(projectsWindow, selectedItem = null) {
        const selectionInfo = projectsWindow.querySelector('#selection-info');
        
        if (selectedItem && selectionInfo) {
            const projectName = selectedItem.querySelector('.project-name')?.textContent || '';
            const projectType = selectedItem.getAttribute('data-type') || '';
            selectionInfo.textContent = `${projectName} (${projectType === 'folder' ? 'Carpeta' : 'Proyecto'})`;
        } else if (selectionInfo) {
            const currentPath = projectsWindow.querySelector('#current-path')?.value || 'Mis Proyectos';
            selectionInfo.textContent = currentPath;
        }
    }

    _openProjectDetails(projectsWindow, projectId) {
        const projects = this._getAllProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return;

        if (project.type === 'folder') {
            // Si es carpeta, navegar a ella
            const folderMap = {
                'web-folder': 'web',
                'ai-folder': 'ai'
            };
            
            const targetFolder = folderMap[projectId];
            if (targetFolder) {
                this._navigateToFolder(projectsWindow, targetFolder);
            }
        } else {
            // Si es proyecto, mostrar detalles
            this._showProjectDetails(project);
        }
    }

    _getAllProjects() {
        const allProjects = [];
        const folders = ['root', 'web', 'ai'];
        
        folders.forEach(folder => {
            allProjects.push(...this._getProjectsData(folder));
        });
        
        return allProjects;
    }

    _navigateToFolder(projectsWindow, folder) {
        // Seleccionar el item del árbol correspondiente
        const treeItem = projectsWindow.querySelector(`[data-folder="${folder}"]`);
        if (treeItem) {
            // Simular click en el item del árbol
            const content = treeItem.querySelector('.tree-item-content');
            if (content) {
                content.click();
            }
        }
    }

    _getProjectImpact(project) {
        const impacts = {
            zaratexp: [
                'Demuestra una experiencia completa tipo sistema operativo con ventanas, estado, taskbar y apps.',
                'Convierte el CV en una plataforma explorable sin perder accesos rapidos para reclutadores.',
                'Integra Canvas, Web Audio, File APIs, REST APIs y persistencia local en un sitio estatico.'
            ],
            osintargy: [
                'Acerca herramientas OSINT a usuarios hispanohablantes con una interfaz educativa.',
                'Combina visualizacion Canvas, busqueda, utilidades y contenido formativo en una sola plataforma.',
                'Muestra criterio de producto aplicado a seguridad, investigacion y comunidad.'
            ],
            'wjpc-capituloargentino': [
                'Resuelve presencia institucional, gestion de contenido y operacion administrativa.',
                'Incluye frontend publico, panel admin, autenticacion, almacenamiento de imagenes y despliegue cloud.',
                'Evidencia manejo de arquitectura full stack, seguridad y CI/CD.'
            ],
            forzatech: [
                'Comunica una oferta comercial concreta para PYMEs con sistemas, IA y automatizacion.',
                'Ordena servicios tecnicos en una experiencia orientada a conversion.',
                'Conecta marca personal, producto propio y capacidad de ejecucion.'
            ],
            'estudio-luttini': [
                'Traduce servicios juridico-contables complejos a una presencia web clara.',
                'Prioriza confianza, lectura rapida, SEO basico y responsive design.',
                'Muestra capacidad de adaptar tono visual a un rubro profesional.'
            ],
            'limpia-limpia': [
                'Diseña una landing de captacion directa con WhatsApp como canal principal.',
                'Incluye estructura mobile-first, CTAs, proceso, servicios y antes/despues.',
                'Evidencia foco en conversion, no solo en estetica.'
            ],
            'sistema-enterprise-java': [
                'Demuestra arquitectura enterprise con backend, frontend, base de datos y despliegue.',
                'Incluye seguridad por roles, JWT, 2FA, auditoria y controles alineados a OWASP/ISO.',
                'Muestra criterio para sistemas sensibles, dashboards y APIs de integracion.'
            ],
            'n8n-workflows-atencion': [
                'Reduce trabajo manual en atencion al cliente con flujos omnicanal.',
                'Integra WhatsApp, email, Slack, Sheets y bots con manejo de errores.',
                'Expone pensamiento de procesos, trazabilidad y mejora operativa.'
            ]
        };

        return impacts[project.id] || [
            'Evidencia ejecucion full stack con foco en producto, mantenimiento y experiencia de usuario.',
            'Muestra capacidad de conectar interfaz, datos, integraciones y despliegue.',
            'Sirve como prueba conversable para entrevistas tecnicas o comerciales.'
        ];
    }

    _showProjectDetails(project) {
        if (this.windowManager) {
            const safeUrl = this._safeExternalUrl(project.url);
            const hasUrl = Boolean(safeUrl);
            const safeProjectId = this._safeDomId(project.id);
            const safeName = this._escapeHtml(project.name);
            const safeDescription = this._escapeHtml(project.description);
            const techBadges = (project.technologies || [])
                .map((technology) => `<span class="xp-project-chip">${this._escapeHtml(technology)}</span>`)
                .join('');
            const impactItems = this._getProjectImpact(project)
                .map((impact) => `<li>${this._escapeHtml(impact)}</li>`)
                .join('');
            const previewContent = project.preview && hasUrl
                ? `
                    <div class="project-preview-shell">
                        <div class="project-preview-header">
                            <span>Vista previa embebida</span>
                            <button type="button" class="project-preview-open" data-project-open-url="${safeUrl}">Abrir en navegador</button>
                        </div>
                        <iframe
                            class="project-preview-frame"
                            src="${safeUrl}"
                            title="Vista previa de ${safeName}"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                        <div class="project-preview-fallback">
                            Si el sitio bloquea la vista embebida, usa "Abrir en navegador".
                        </div>
                    </div>
                `
                : '';

            const detailsContent = `
                <div class="xp-project-details">
                    <div class="xp-project-details-header">
                        <div class="xp-project-details-icon">
                            ${project.detailImage ?
                                `<img src="${this._escapeHtml(this._safeImageSrc(project.detailImage))}" width="64" height="64" alt="${safeName}" />` :
                                this._renderProjectIcon(project, 48)
                            }
                        </div>
                        <div>
                            <h2>${safeName}</h2>
                            <p>${safeDescription}</p>
                        </div>
                    </div>
                    
                    <div class="xp-project-facts">
                        <div><strong>Categoría:</strong> ${this._escapeHtml(project.category || 'Proyecto')}</div>
                        <div><strong>Estado:</strong> ${this._escapeHtml(project.status || 'Documentado')}</div>
                        <div><strong>Rol visible:</strong> Producto, frontend, backend, integraciones y despliegue según alcance.</div>
                        ${techBadges ? `<div class="xp-project-chips">${techBadges}</div>` : ''}
                    </div>

                    ${previewContent}

                    <div class="xp-project-impact">
                        <strong>Impacto visible:</strong>
                        <ul>${impactItems}</ul>
                    </div>
                    
                    <div class="xp-project-body">
                        <strong>Descripción detallada:</strong><br>
                        <div>
                            ${this._escapeHtml(project.details || project.description)}
                        </div>
                    </div>
                    
                    <div class="xp-project-actions">
                        ${hasUrl ?
                            `<button type="button" data-project-open-url="${safeUrl}">Visitar sitio</button>` :
                            ''
                        }
                        <button type="button" data-project-open-app="resume">Ver CV</button>
                        <button type="button" data-project-open-app="contact">Contactar</button>
                        <button type="button" data-project-close>Cerrar</button>
                    </div>
                </div>
            `;

            const detailsWindow = this.windowManager.createWindow({
                id: `project-details-${safeProjectId}`,
                title: `${project.name} - Detalles`,
                icon: './assets/images/hd-icons/projects.svg',
                content: detailsContent,
                width: project.preview ? 920 : 500,
                height: project.preview ? 720 : 400,
                resizable: true,
                maximizable: Boolean(project.preview)
            });

            detailsWindow?.querySelectorAll('[data-project-open-url]').forEach((button) => {
                button.addEventListener('click', () => window.open(button.dataset.projectOpenUrl, '_blank', 'noopener'));
            });
            detailsWindow?.querySelectorAll('[data-project-open-app]').forEach((button) => {
                button.addEventListener('click', () => this.openApp(button.dataset.projectOpenApp));
            });
            detailsWindow?.querySelector('[data-project-close]')?.addEventListener('click', () => {
                this.windowManager.closeWindow(`project-details-${safeProjectId}`);
            });
        }
    }

    _showContactConfirmation(contactWindow) {
        // Crear ventana de confirmación
        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'contact-confirmation',
                title: 'Mensaje Enviado',
                icon: './assets/images/hd-icons/contact.svg',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <img src="./assets/images/xp-small-icons/information.png" alt="Mensaje enviado" width="48" height="48" style="margin-bottom: 10px;">
                        <div style="margin-bottom: 10px;"><strong>¡Mensaje enviado exitosamente!</strong></div>
                        <div style="margin-bottom: 20px; color: #666; line-height: 1.4;">
                            Tu mensaje ha sido enviado a Ivan.<br>
                            Te responderá lo antes posible.
                        </div>
                        <button onclick="this.closest('.window').remove()" style="padding: 6px 16px;">Aceptar</button>
                    </div>
                `,
                width: 350,
                height: 200,
                resizable: false,
                maximizable: false
            });
        }
    }

    _showSendingStatus(contactWindow) {
        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'sending-status',
                title: 'Enviando Mensaje',
                icon: './assets/images/xp-small-icons/email.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <div class="loading-animation" style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #0078d4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        </div>
                        <div style="color: #666;">Enviando mensaje...</div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `,
                width: 250,
                height: 150,
                resizable: false,
                maximizable: false,
                closable: false
            });
        }
    }

    _showEmailError(contactWindow, errorMessage, mailtoLink = '') {
        // Cerrar ventana de estado si existe
        const statusWindow = document.querySelector('[data-window-id="sending-status"]');
        if (statusWindow) statusWindow.remove();

        if (this.windowManager) {
            const safeErrorMessage = this._escapeHtml(errorMessage || 'Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente.');
            this.windowManager.createWindow({
                id: 'email-error',
                title: 'Error al Enviar',
                icon: './assets/images/xp-small-icons/critical.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                        <div style="margin-bottom: 10px;"><strong>Error al enviar el mensaje</strong></div>
	                        <div style="margin-bottom: 20px; color: #666; line-height: 1.4;">
	                            ${safeErrorMessage}
	                        </div>
	                        <div style="display: flex; gap: 8px; justify-content: center;">
	                            ${mailtoLink ? `<button type="button" data-mailto-fallback="${this._escapeHtml(mailtoLink)}" style="padding: 6px 16px;">Abrir email</button>` : ''}
	                            <button onclick="this.closest('.window').remove()" style="padding: 6px 16px;">Aceptar</button>
	                        </div>
	                    </div>
	                `,
                width: 350,
                height: 200,
                resizable: false,
	                maximizable: false
	            });
                const errorWindow = document.querySelector('[data-window-id="email-error"]');
                errorWindow?.querySelector('[data-mailto-fallback]')?.addEventListener('click', (event) => {
                    window.open(event.currentTarget.dataset.mailtoFallback, '_blank', 'noopener');
                });
	        }
	    }

    _showMailtoFallback(contactWindow) {
        // Cerrar ventana de estado si existe
        const statusWindow = document.querySelector('[data-window-id="sending-status"]');
        if (statusWindow) statusWindow.remove();

        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'mailto-fallback',
                title: 'Configuración Requerida',
                icon: './assets/images/xp-small-icons/information.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <img src="./assets/images/xp-small-icons/information.png" alt="Informacion" width="48" height="48" style="margin-bottom: 10px;">
                        <div style="margin-bottom: 10px;"><strong>EmailJS no configurado</strong></div>
                        <div style="margin-bottom: 20px; color: #666; line-height: 1.4;">
                            Se abrió tu cliente de correo con el mensaje.<br>
                            Para envío automático, configura EmailJS en el código.
                        </div>
                        <button onclick="this.closest('.window').remove()" style="padding: 6px 16px;">Entendido</button>
                    </div>
                `,
                width: 400,
                height: 220,
                resizable: false,
                maximizable: false
            });
        }
    }
    
    // --- Métodos auxiliares ---

    _focusIfRunning(appId) {
        if (!this.runningApps.has(appId)) return false;
        if (this.windowManager?.focusWindow) {
            this.windowManager.focusWindow(appId);
        }
        return true;
    }

    _createSingleInstanceWindow({ id, title, icon, content, width = 600, height = 400, resizable = true, maximizable = true, onReady = null, onClose = null }) {
        if (this._focusIfRunning(id)) return null;
        if (!this.windowManager) {
            throw new Error('WindowManager no está disponible');
        }

        const appWindow = this.windowManager.createWindow({
            id,
            title,
            icon,
            content,
            width,
            height,
            resizable,
            maximizable
        });

        this.runningApps.set(id, id);
        this._observeWindowClose(appWindow, id, onClose);

        if (typeof onReady === 'function') {
            window.setTimeout(() => onReady(appWindow), 0);
        }

        return appWindow;
    }

    _loadScriptOnce(src, readyGlobal = null) {
        if (readyGlobal && window[readyGlobal]) return Promise.resolve();
        if (this.scriptPromises.has(src)) return this.scriptPromises.get(src);

        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript && readyGlobal && !window[readyGlobal]) {
            const waitForReady = new Promise((resolve, reject) => {
                const startedAt = Date.now();
                const timer = window.setInterval(() => {
                    if (window[readyGlobal]) {
                        window.clearInterval(timer);
                        resolve();
                    } else if (Date.now() - startedAt > 5000) {
                        window.clearInterval(timer);
                        reject(new Error(`Timeout cargando ${src}`));
                    }
                }, 50);
            });
            this.scriptPromises.set(src, waitForReady);
            return waitForReady;
        }

        const promise = new Promise((resolve, reject) => {
            const script = existingScript || document.createElement('script');
            script.src = src;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
            if (!existingScript) document.head.appendChild(script);
        });

        this.scriptPromises.set(src, promise);
        return promise;
    }

    _observeWindowClose(appWindow, appId, onClose = null) {
        if (!appWindow?.parentNode) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === appWindow) {
                        if (typeof onClose === 'function') onClose(node);
                        this.closeApp(appId);
                        observer.disconnect();
                    }
                });
            });
        });

        observer.observe(appWindow.parentNode, { childList: true });
    }

    _saveLocal(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`No se pudo guardar ${key}:`, error);
        }
    }

    _readLocal(key, fallback = '') {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch (error) {
            return fallback;
        }
    }

    getPersonalizationSettings() {
        const defaults = {
            wallpaper: 'default',
            accent: 'xp',
            crt: false,
            animations: true,
            compactTaskbar: false,
            iconScale: 1
        };

        try {
            return { ...defaults, ...JSON.parse(localStorage.getItem('zarateXP.settings') || '{}') };
        } catch (error) {
            return defaults;
        }
    }

    savePersonalizationSettings(settings) {
        this._saveLocal('zarateXP.settings', JSON.stringify(settings));
        this.applyPersonalization(settings);
    }

    applyPersonalization(settings = this.getPersonalizationSettings()) {
        const body = document.body;
        const desktop = document.querySelector('.desktop');
        const desktopIcons = document.querySelector('.desktop-icons');
        const crtLayers = document.querySelectorAll('.crt-effect, .crt-scanline, .crt-vignette, .crt-noise, .crt-flicker, .crt-aberration, .crt-persistence, .flicker');

        body.classList.toggle('xp-accent-olive', settings.accent === 'olive');
        body.classList.toggle('xp-accent-graphite', settings.accent === 'graphite');
        body.classList.toggle('xp-no-animations', !settings.animations);
        body.classList.toggle('xp-compact-taskbar', Boolean(settings.compactTaskbar));
        body.classList.toggle('xp-crt-enabled', Boolean(settings.crt));

        if (desktop) {
            desktop.classList.remove('wallpaper-default', 'wallpaper-night', 'wallpaper-clean');
            desktop.classList.add(`wallpaper-${settings.wallpaper || 'default'}`);
        }

        if (desktopIcons) {
            desktopIcons.style.setProperty('--icon-scale', settings.iconScale || 1);
        }

        crtLayers.forEach((layer) => {
            layer.style.display = settings.crt ? 'block' : 'none';
        });
    }
    
    showPlaceholder(appName) {
        const safeAppName = this._escapeHtml(appName);
        const content = `
            <div style="padding: 20px; text-align: center;">
                <h2>${safeAppName}</h2>
                <p>Esta aplicación está en desarrollo.</p>
                <p>Próximamente estará disponible.</p>
            </div>
        `;
        
        // If window manager is available, create a window
        if (this.windowManager) {
            return this.windowManager.createWindow({
                id: `placeholder-${Date.now()}`,
                title: String(appName),
                content: content,
                width: 400,
                height: 300
            });
        }
    }
    
    showError(message) {
        // If window manager is available, create an error window
        if (this.windowManager) {
            const safeMessage = this._escapeHtml(message);
            const content = `
                <div style="padding: 20px; text-align: center;">
                    <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                    <div style="margin-bottom: 20px;">${safeMessage}</div>
                    <button onclick="this.closest('.window').remove()">OK</button>
                </div>
            `;
            
            return this.windowManager.createWindow({
                id: `error-${Date.now()}`,
                title: 'Error',
                content: content,
                width: 300,
                height: 200,
                resizable: false
            });
        } else {
            // Fallback to alert if window manager not available
            alert(message);
        }
    }

    _openDocuments() {
        const iconBase = './assets/images/xp-small-icons';
        const content = `
            <div class="xp-documents-app">
                <div class="xp-explorer-menubar">
                    <span><u>A</u>rchivo</span><span><u>E</u>dicion</span><span><u>V</u>er</span><span><u>F</u>avoritos</span><span>A<u>y</u>uda</span>
                </div>
                <div class="xp-explorer-toolbar">
                    <button type="button" data-doc-open="my-computer"><img src="${iconBase}/back.png" alt=""> Atras</button>
                    <button type="button" data-doc-open="projects"><img src="${iconBase}/search.png" alt=""> Buscar proyectos</button>
                    <button type="button" data-doc-open="control-panel"><img src="${iconBase}/control-panel.png" alt=""> Configurar</button>
                </div>
                <div class="xp-explorer-address">
                    <span>Direccion</span>
                    <div><img src="${iconBase}/my-documents.png" alt=""> C:\\Documents and Settings\\Ivan\\Mis documentos</div>
                </div>
                <div class="xp-documents-layout">
                    <aside class="xp-task-pane">
                        <section>
                            <h3>Tareas de documento</h3>
                            <button type="button" data-doc-open="resume">Abrir CV actualizado</button>
                            <button type="button" data-doc-open="recruiter-route">Abrir perfil orientado a FDE</button>
                            <button type="button" data-doc-open="pdf-studio">Revisar PDF con notas</button>
                            <button type="button" data-doc-open="projects">Ver proyectos web</button>
                            <button type="button" data-doc-open="api-center">Abrir API Center</button>
                            <button type="button" data-doc-open="n8n-flows">Ver automatizaciones n8n</button>
                        </section>
                        <section>
                            <h3>Detalles</h3>
                            <p>Software Analyst &amp; Project Manager con portfolio orientado a oportunidades FDE, MLOps, plataformas y datos sensibles.</p>
                        </section>
                    </aside>
                    <main class="xp-folder-grid">
                        <button type="button" class="xp-folder-item important" data-doc-open="resume">
                            <img src="./assets/images/hd-icons/cv.svg" alt="">
                            <span>Ivan_Zarate_CV.pdf</span>
                            <small>CV actualizado</small>
                        </button>
                        <button type="button" class="xp-folder-item important" data-doc-open="recruiter-route">
                            <img src="./assets/images/hd-icons/cv.svg" alt="">
                            <span>Perfil orientado a FDE.lnk</span>
                            <small>Experiencia, casos, capacidades y contacto</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="projects">
                            <img src="./assets/images/hd-icons/projects.svg" alt="">
                            <span>Proyectos destacados</span>
                            <small>CUFRE, SIFEBU, CRIACO, OSINTArgy y más</small>
                        </button>
                        <button type="button" class="xp-folder-item important" data-doc-open="api-center">
                            <img src="./assets/images/hd-icons/api.svg" alt="">
                            <span>API Center.lnk</span>
                            <small>Clima, GitHub y datos publicos en vivo</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="pdf-studio">
                            <img src="./assets/images/hd-icons/pdf-studio.svg" alt="">
                            <span>PDF Studio.exe</span>
                            <small>File API, Blob URL y anotaciones</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="about-me">
                            <img src="./assets/images/hd-icons/about.svg" alt="">
                            <span>Perfil profesional</span>
                            <small>Software, Data &amp; AI + orientación FDE</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="n8n-flows">
                            <img src="./assets/images/hd-icons/n8n.svg" alt="">
                            <span>Flujos n8n</span>
                            <small>Procesos visuales funcionales</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="notepad">
                            <img src="./assets/images/hd-icons/notepad.svg" alt="">
                            <span>Notas de entrevista.txt</span>
                            <small>Editable localmente</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="wordpad">
                            <img src="./assets/images/hd-icons/wordpad.svg" alt="">
                            <span>Carta de presentacion.rtf</span>
                            <small>Editor enriquecido</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="solitaire">
                            <img src="./assets/images/hd-icons/solitaire.svg" alt="">
                            <span>Solitario XP</span>
                            <small>Logica Klondike propia</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="pinball">
                            <img src="./assets/images/hd-icons/pinball.svg?v=20260712" alt="">
                            <span>Pinball XP Lab</span>
                            <small>Canvas, fisica y teclado</small>
                        </button>
                    </main>
                </div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'documents',
            title: 'Mis Documentos',
            icon: './assets/images/hd-icons/documents.svg',
            content,
            width: 760,
            height: 520,
            onReady: (appWindow) => {
                appWindow.querySelectorAll('[data-doc-open]').forEach((item) => {
                    const openTarget = () => this.openApp(item.dataset.docOpen);
                    item.addEventListener('click', openTarget);
                    item.addEventListener('dblclick', openTarget);
                });
            }
        });
    }

    _openRecruiterRoute() {
        const content = `
            <div class="xp-recruiter-route">
                <aside class="xp-task-pane">
                    <section>
                        <h3>Perfil orientado a FDE</h3>
                        <p>Una vista ejecutiva de experiencia verificable, casos, capacidades y formación para evaluar mi encaje con oportunidades de Forward Deployed Engineer.</p>
                    </section>
                    <section>
                        <h3>Accesos directos</h3>
                        <button type="button" data-route-app="resume">Abrir CV PDF</button>
                        <button type="button" data-route-app="projects">Explorar proyectos</button>
                    </section>
                    <section>
                        <h3>Disponibilidad</h3>
                        <p>Interés actual: Forward Deployed Engineering, Solutions Engineering y plataformas con IA.</p>
                    </section>
                </aside>
                <main class="xp-fde-brief">
                    <header class="xp-fde-hero">
                        <div>
                            <span class="xp-fde-role">Software Analyst &amp; Project Manager | Software, Data &amp; AI Solutions</span>
                            <h2>Del problema en campo a una solución en producción.</h2>
                            <p>Perfil orientado a oportunidades de Forward Deployed Engineer (FDE): descubrimiento con usuarios, traducción funcional-técnica, implementación, capacitación y mejora continua.</p>
                        </div>
                        <img src="images/foto-nuevo-usuario.jpeg" alt="Ivan Agustin Zarate" width="112" height="112">
                    </header>

                    <section class="xp-fde-section xp-fde-operating-model">
                        <h3>Cómo trabajo</h3>
                        <div class="xp-fde-flow" aria-label="Proceso de trabajo alineado con Forward Deployed Engineering">
                            <div><strong>Descubrir</strong><span>Entrevistas, contexto operativo y requerimientos.</span></div>
                            <div><strong>Traducir</strong><span>Definición funcional, arquitectura y prioridades.</span></div>
                            <div><strong>Implementar</strong><span>Integración, validación y puesta en producción.</span></div>
                            <div><strong>Acompañar</strong><span>Documentación, capacitación, monitoreo y mejora.</span></div>
                        </div>
                    </section>

                    <section class="xp-fde-section">
                        <h3>Experiencia profesional</h3>
                        <div class="xp-fde-timeline">
                            <article class="current">
                                <time>2024 - Actualidad</time>
                                <h4>Analista en Sistemas / Project Manager de Plataformas Digitales</h4>
                                <p>Dirección Nacional de Gestión de Bases de Datos de Seguridad, Ministerio de Seguridad Nacional. Desarrollo e implementación de plataformas, ciclo de vida de modelos, MLOps, datos críticos y coordinación multidisciplinaria.</p>
                            </article>
                            <article>
                                <time>2018 - 2024</time>
                                <h4>Analista de Datos, Control y Gestión de Información</h4>
                                <p>Policía Federal Argentina. Bases de datos públicas, privacidad, resguardo de información y uso responsable de sistemas.</p>
                            </article>
                            <article>
                                <time>2016 - 2018</time>
                                <h4>Coordinador de Equipo</h4>
                                <p>Policía Federal Argentina. Planificación, coordinación, comunicación bajo presión y toma de decisiones.</p>
                            </article>
                            <article>
                                <time>2013 - 2015</time>
                                <h4>Auxiliar de Recursos Humanos</h4>
                                <p>COTO Digital. Gestión confidencial de documentación, asistencia y novedades de personal.</p>
                            </article>
                        </div>
                    </section>

                    <section class="xp-fde-section">
                        <div class="xp-fde-section-heading">
                            <h3>Casos relevantes</h3>
                            <button type="button" data-route-app="projects">Ver ficha técnica</button>
                        </div>
                        <div class="xp-fde-cases">
                            <article><h4>CUFRE</h4><p>Gestión y priorización de casos con Java, Spring Boot, React, Maven y Oracle.</p></article>
                            <article><h4>SIFEBU</h4><p>Sistema federal con JavaScript, TypeScript, React y Oracle, orientado a disponibilidad y calidad.</p></article>
                            <article><h4>CRIACO</h4><p>Plataforma de análisis territorial con GIS, mapas, capas y visualización de datos.</p></article>
                            <article><h4>OSINTArgy</h4><p>Investigación digital, capacitación, tratamiento de datos y privacidad para pequeñas empresas.</p></article>
                        </div>
                    </section>

                    <section class="xp-fde-section xp-fde-capabilities">
                        <h3>Capacidades aplicadas</h3>
                        <div class="xp-fde-capability-grid">
                            <article><h4>IA y MLOps</h4><p>Datos, experimentación, versionado, despliegue, monitoreo, redes neuronales, Hugging Face y QLoRA.</p></article>
                            <article><h4>Sistemas</h4><p>Java, Spring Boot, React, JavaScript, TypeScript, Maven, APIs, Git, Oracle y SQL.</p></article>
                            <article><h4>Datos y seguridad</h4><p>Calidad, privacidad, trazabilidad, control de accesos, auditoría, OSINT, GIS y ciberseguridad.</p></article>
                            <article><h4>Herramientas de IA</h4><p>Modelos locales de pesos abiertos, Claude, Codex y OpenCode con minimización de datos.</p></article>
                        </div>
                    </section>

                    <section class="xp-fde-section xp-fde-credentials">
                        <div>
                            <h3>Formación</h3>
                            <p><strong>Analista de Sistemas</strong><br>Instituto Superior ORT Argentina, 2024-2026. Título obtenido.</p>
                            <p><strong>Licenciatura en Seguridad</strong><br>Orientación en Investigación Criminal, 2020-2025.</p>
                            <p><strong>Google Data Analytics</strong><br>Certificación profesional de 8 cursos, 2024.</p>
                        </div>
                        <div>
                            <h3>Idiomas y ubicación</h3>
                            <p><strong>Español:</strong> nativo.</p>
                            <p><strong>Inglés:</strong> intermedio, lectura técnica y reuniones con proveedores.</p>
                            <p><strong>Base:</strong> Monserrat, Ciudad Autónoma de Buenos Aires, Argentina.</p>
                            <p><strong>Nacimiento:</strong> 17 de agosto de 1995.</p>
                        </div>
                    </section>

                    <footer class="xp-fde-cta">
                        <div><strong>¿Buscás a alguien que pueda entender el contexto y llevarlo a producción?</strong><span>Revisá el CV completo o conversemos.</span></div>
                        <button type="button" data-route-app="contact">Contactar</button>
                    </footer>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'recruiter-route',
            title: 'Perfil orientado a FDE - Ivan Agustin Zarate',
            icon: './assets/images/hd-icons/cv.svg',
            content,
            width: 920,
            height: 650,
            onReady: (appWindow) => {
                appWindow.querySelectorAll('[data-route-app]').forEach((button) => {
                    button.addEventListener('click', () => this.openApp(button.dataset.routeApp));
                });
            }
        });
    }

    _openSystemProperties() {
        const appsCount = this.getAllApps().length;
        const projectCount = this._getProjectsData('root').filter((item) => item.type === 'project').length;
        const viewport = `${window.innerWidth} x ${window.innerHeight}`;
        const sessionState = localStorage.getItem('zarateXP_session') === 'active' ? 'Sesion activa' : 'Login pendiente';
        const content = `
            <div class="xp-system-properties">
                <div class="xp-system-tabs">
                    <button type="button" class="active">General</button>
                    <button type="button">Hardware</button>
                    <button type="button">Avanzado</button>
                    <button type="button">Remoto</button>
                </div>
                <div class="xp-system-page">
                    <section class="xp-system-hero">
                        <img src="./assets/images/xp-small-icons/windows-xp-icon-192.png" alt="ZarateXP">
                        <div>
                            <h2>ZarateXP Professional</h2>
                            <p>FDE-Oriented Portfolio Edition</p>
                            <span>Registrado a nombre de Ivan Agustin Zarate</span>
                        </div>
                    </section>
                    <dl class="xp-system-specs">
                        <dt>Sistema</dt><dd>Windows XP-inspired desktop en HTML, CSS y JavaScript vanilla</dd>
                        <dt>Version</dt><dd>GitHub Pages / build estatico</dd>
                        <dt>Perfil</dt><dd>Software Analyst &amp; Project Manager | orientación FDE</dd>
                        <dt>Memoria</dt><dd>${appsCount} aplicaciones internas, ${projectCount} proyectos destacados</dd>
                        <dt>Resolucion actual</dt><dd>${viewport}</dd>
                        <dt>Estado</dt><dd>${sessionState}</dd>
                    </dl>
                    <div class="xp-system-actions">
                        <button type="button" data-system-open="recruiter-route">Perfil orientado a FDE</button>
                        <button type="button" data-system-open="control-panel">Panel de control</button>
                        <button type="button" data-system-open="resume">Ver CV</button>
                        <button type="button" data-system-close>Aceptar</button>
                    </div>
                </div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'system-properties',
            title: 'Propiedades del sistema',
            icon: './assets/images/hd-icons/control-panel.svg',
            content,
            width: 520,
            height: 440,
            resizable: false,
            maximizable: false,
            onReady: (appWindow) => {
                appWindow.querySelectorAll('[data-system-open]').forEach((button) => {
                    button.addEventListener('click', () => this.openApp(button.dataset.systemOpen));
                });
                appWindow.querySelector('[data-system-close]')?.addEventListener('click', () => {
                    this.windowManager.closeWindow('system-properties');
                });
            }
        });
    }

    _openNotepad() {
        const savedText = this._readLocal('zarateXP.notepad', [
            'Notas rapidas - Ivan Zarate',
            '',
            '- Titular: Software Analyst & Project Manager | Software, Data & AI Solutions | Java, Spring Boot, React, Oracle',
            '- Objetivo: oportunidades de Forward Deployed Engineer (FDE), Solutions Engineering y plataformas con IA',
            '- Foco: plataformas, MLOps, datos sensibles e integracion con usuarios',
            '- Evidencia: CUFRE, SIFEBU, CRIACO, OSINTArgy y proyectos full stack'
        ].join('\n'));

        const content = `
            <div class="xp-notepad-app">
                <div class="xp-menu-strip">
                    <button type="button" data-note-command="new">Archivo</button>
                    <button type="button" data-note-command="save">Guardar</button>
                    <button type="button" data-note-command="download">Descargar</button>
                    <button type="button" data-note-command="clear">Limpiar</button>
                </div>
                <textarea class="xp-notepad-textarea" spellcheck="false">${this._escapeHtml(savedText)}</textarea>
                <div class="xp-statusbar"><span data-note-status>Listo</span><span data-note-count>0 caracteres</span></div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'notepad',
            title: 'Bloc de notas - notas.txt',
            icon: './assets/images/hd-icons/notepad.svg',
            content,
            width: 560,
            height: 430,
            onReady: (appWindow) => {
                const textarea = appWindow.querySelector('.xp-notepad-textarea');
                const status = appWindow.querySelector('[data-note-status]');
                const count = appWindow.querySelector('[data-note-count]');
                const updateCount = () => {
                    count.textContent = `${textarea.value.length} caracteres`;
                };
                const save = () => {
                    this._saveLocal('zarateXP.notepad', textarea.value);
                    status.textContent = `Guardado ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
                };

                textarea.addEventListener('input', () => {
                    updateCount();
                    this._saveLocal('zarateXP.notepad', textarea.value);
                    status.textContent = 'Autoguardado local';
                });

                appWindow.querySelector('[data-note-command="save"]').addEventListener('click', save);
                appWindow.querySelector('[data-note-command="new"]').addEventListener('click', () => {
                    textarea.value = '';
                    save();
                    updateCount();
                });
                appWindow.querySelector('[data-note-command="clear"]').addEventListener('click', () => {
                    textarea.value = '';
                    this._saveLocal('zarateXP.notepad', '');
                    status.textContent = 'Documento limpio';
                    updateCount();
                });
                appWindow.querySelector('[data-note-command="download"]').addEventListener('click', () => {
                    this._downloadTextFile('ivan-zarate-notas.txt', textarea.value);
                    status.textContent = 'Archivo generado';
                });
                updateCount();
                textarea.focus();
            }
        });
    }

    _openWordPad() {
        const savedHtml = this._sanitizeWordPadHtml(this._readLocal('zarateXP.wordpad', `
            <h2>Ivan Agustin Zarate</h2>
            <p><strong>Software Analyst &amp; Project Manager | Software, Data &amp; AI Solutions | Java, Spring Boot, React, Oracle</strong>.</p>
            <p>Perfil orientado a oportunidades de Forward Deployed Engineer (FDE).</p>
            <p>Relevo necesidades con usuarios, las traduzco en soluciones técnicas y acompaño su integración, puesta en producción y mejora continua.</p>
            <p>Experiencia en MLOps, plataformas institucionales, datos sensibles, Java, Spring Boot, React, TypeScript, Oracle, SQL, GIS y OSINT.</p>
        `));

        const content = `
            <div class="xp-wordpad-app">
                <div class="xp-menu-strip">
                    <button type="button" data-wp-command="save">Guardar</button>
                    <button type="button" data-wp-command="download">Descargar TXT</button>
                </div>
                <div class="xp-wordpad-toolbar">
                    <button type="button" data-format="bold"><strong>B</strong></button>
                    <button type="button" data-format="italic"><em>I</em></button>
                    <button type="button" data-format="underline"><u>U</u></button>
                    <select data-format-block aria-label="Formato">
                        <option value="p">Parrafo</option>
                        <option value="h2">Titulo</option>
                        <option value="h3">Subtitulo</option>
                    </select>
                </div>
                <div class="xp-wordpad-page" contenteditable="true" spellcheck="true">${savedHtml}</div>
                <div class="xp-statusbar"><span data-wp-status>Listo</span><span>WordPad XP</span></div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'wordpad',
            title: 'WordPad - carta de presentacion.rtf',
            icon: './assets/images/hd-icons/wordpad.svg',
            content,
            width: 640,
            height: 500,
            onReady: (appWindow) => {
                const editor = appWindow.querySelector('.xp-wordpad-page');
                const status = appWindow.querySelector('[data-wp-status]');
                const save = () => {
                    const cleanHtml = this._sanitizeWordPadHtml(editor.innerHTML);
                    if (cleanHtml !== editor.innerHTML) {
                        editor.innerHTML = cleanHtml;
                    }
                    this._saveLocal('zarateXP.wordpad', cleanHtml);
                    status.textContent = 'Guardado localmente';
                };

                editor.addEventListener('input', save);
                appWindow.querySelectorAll('[data-format]').forEach((button) => {
                    button.addEventListener('click', () => {
                        document.execCommand(button.dataset.format, false, null);
                        editor.focus();
                        save();
                    });
                });
                appWindow.querySelector('[data-format-block]').addEventListener('change', (event) => {
                    document.execCommand('formatBlock', false, event.target.value);
                    editor.focus();
                    save();
                });
                appWindow.querySelector('[data-wp-command="save"]').addEventListener('click', save);
                appWindow.querySelector('[data-wp-command="download"]').addEventListener('click', () => {
                    this._downloadTextFile('ivan-zarate-presentacion.txt', editor.innerText.trim());
                    status.textContent = 'TXT generado';
                });
            }
        });
    }

    _openN8nFlows() {
        const content = `
            <div class="xp-n8n-app">
                <aside class="xp-n8n-sidebar">
                    <img src="./assets/images/hd-icons/n8n.svg" alt="n8n">
                    <h2>Automatizaciones</h2>
                    <p>Flujos visuales que conectan formularios, APIs, CRM, correo y dashboards.</p>
                    <button type="button" data-flow-run>Ejecutar demo</button>
                    <button type="button" data-flow-reset>Reiniciar</button>
                </aside>
                <main class="xp-flow-canvas" aria-label="Canvas de flujo n8n">
                    <div class="xp-flow-node" data-node="webhook" style="--x: 4%; --y: 28%;">
                        <strong>Webhook</strong><span>Formulario portfolio</span>
                    </div>
                    <div class="xp-flow-link" style="--x: 22%; --y: 39%; --w: 15%;"></div>
                    <div class="xp-flow-node" data-node="validate" style="--x: 35%; --y: 18%;">
                        <strong>Validar lead</strong><span>Datos y origen</span>
                    </div>
                    <div class="xp-flow-node" data-node="crm" style="--x: 35%; --y: 52%;">
                        <strong>CRM</strong><span>Guardar oportunidad</span>
                    </div>
                    <div class="xp-flow-link vertical" style="--x: 50%; --y: 39%; --h: 13%;"></div>
                    <div class="xp-flow-link" style="--x: 54%; --y: 29%; --w: 14%;"></div>
                    <div class="xp-flow-link" style="--x: 54%; --y: 63%; --w: 14%;"></div>
                    <div class="xp-flow-node" data-node="email" style="--x: 68%; --y: 18%;">
                        <strong>Email</strong><span>Respuesta automatica</span>
                    </div>
                    <div class="xp-flow-node" data-node="dashboard" style="--x: 68%; --y: 52%;">
                        <strong>Dashboard</strong><span>Metricas y seguimiento</span>
                    </div>
                </main>
                <footer class="xp-flow-log" data-flow-log>Listo para ejecutar.</footer>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'n8n-flows',
            title: 'n8n - Flujos de automatizacion',
            icon: './assets/images/hd-icons/n8n.svg',
            content,
            width: 780,
            height: 500,
            onReady: (appWindow) => {
                const nodes = Array.from(appWindow.querySelectorAll('.xp-flow-node'));
                const log = appWindow.querySelector('[data-flow-log]');
                const reset = () => {
                    nodes.forEach((node) => node.classList.remove('running', 'done'));
                    log.textContent = 'Listo para ejecutar.';
                };

                appWindow.querySelector('[data-flow-reset]').addEventListener('click', reset);
                appWindow.querySelector('[data-flow-run]').addEventListener('click', () => {
                    reset();
                    const messages = [
                        'Recibiendo lead desde el portfolio...',
                        'Validando datos y fuente de contacto...',
                        'Creando oportunidad en CRM...',
                        'Enviando respuesta automatica...',
                        'Actualizando dashboard de seguimiento...'
                    ];

                    nodes.forEach((node, index) => {
                        window.setTimeout(() => {
                            nodes.forEach((item) => item.classList.remove('running'));
                            node.classList.add('running');
                            log.textContent = messages[index];
                        }, index * 650);

                        window.setTimeout(() => {
                            node.classList.remove('running');
                            node.classList.add('done');
                            if (index === nodes.length - 1) {
                                log.textContent = 'Flujo completado: lead clasificado, notificado y medido.';
                            }
                        }, index * 650 + 550);
                    });
                });
            }
        });
    }

    _openControlPanel() {
        const settings = this.getPersonalizationSettings();
        const soundManager = window.zarateXP?.soundManager;
        const soundEnabled = soundManager?.enabled !== false;
        const soundVolume = Math.round((soundManager?.volume ?? 0.5) * 100);
        const checked = (value) => value ? 'checked' : '';
        const selected = (value, expected) => value === expected ? 'checked' : '';
        const content = `
            <div class="xp-control-panel-app">
                <aside class="xp-task-pane">
                    <section>
                        <h3>Panel de control</h3>
                        <p>Personaliza el escritorio, ventanas, efectos y barra de tareas.</p>
                    </section>
                    <section>
                        <button type="button" data-cp-open="documents">Mis Documentos</button>
                        <button type="button" data-cp-open="projects">Mis Proyectos</button>
                    </section>
                </aside>
                <main class="xp-settings-grid">
                    <fieldset>
                        <legend>Fondo de pantalla</legend>
                        <label><input type="radio" name="wallpaper" value="default" ${selected(settings.wallpaper, 'default')}> ZarateXP HD</label>
                        <label><input type="radio" name="wallpaper" value="night" ${selected(settings.wallpaper, 'night')}> Azul nocturno</label>
                        <label><input type="radio" name="wallpaper" value="clean" ${selected(settings.wallpaper, 'clean')}> Limpio profesional</label>
                    </fieldset>
                    <fieldset>
                        <legend>Color de sistema</legend>
                        <label><input type="radio" name="accent" value="xp" ${selected(settings.accent, 'xp')}> XP azul</label>
                        <label><input type="radio" name="accent" value="olive" ${selected(settings.accent, 'olive')}> Verde oliva</label>
                        <label><input type="radio" name="accent" value="graphite" ${selected(settings.accent, 'graphite')}> Grafito</label>
                    </fieldset>
                    <fieldset>
                        <legend>Comportamiento</legend>
                        <label><input type="checkbox" name="crt" ${checked(settings.crt)}> Efecto CRT</label>
                        <label><input type="checkbox" name="animations" ${checked(settings.animations)}> Animaciones XP</label>
                        <label><input type="checkbox" name="compactTaskbar" ${checked(settings.compactTaskbar)}> Taskbar compacta</label>
                    </fieldset>
                    <fieldset>
                        <legend>Iconos</legend>
                        <label class="xp-range-label">Escala <input type="range" name="iconScale" min="0.85" max="1.25" step="0.05" value="${settings.iconScale}"></label>
                    </fieldset>
                    <fieldset>
                        <legend>Sonidos XP</legend>
                        <label><input type="checkbox" name="soundEnabled" ${checked(soundEnabled)}> Efectos activos</label>
                        <label class="xp-range-label">Volumen <input type="range" name="soundVolume" min="0" max="100" step="5" value="${soundVolume}"></label>
                    </fieldset>
                    <div class="xp-settings-actions">
                        <button type="button" data-settings-apply>Aplicar</button>
                        <button type="button" data-settings-reset>Restaurar XP</button>
                        <span data-settings-status>Configuracion cargada</span>
                    </div>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'control-panel',
            title: 'Panel de control - Apariencia y temas',
            icon: './assets/images/hd-icons/control-panel.svg',
            content,
            width: 700,
            height: 470,
            onReady: (appWindow) => {
                const status = appWindow.querySelector('[data-settings-status]');
	                const readSettings = () => ({
	                    wallpaper: appWindow.querySelector('input[name="wallpaper"]:checked')?.value || 'default',
	                    accent: appWindow.querySelector('input[name="accent"]:checked')?.value || 'xp',
	                    crt: appWindow.querySelector('input[name="crt"]').checked,
	                    animations: appWindow.querySelector('input[name="animations"]').checked,
	                    compactTaskbar: appWindow.querySelector('input[name="compactTaskbar"]').checked,
	                    iconScale: Number(appWindow.querySelector('input[name="iconScale"]').value),
	                    soundEnabled: appWindow.querySelector('input[name="soundEnabled"]').checked,
	                    soundVolume: Number(appWindow.querySelector('input[name="soundVolume"]').value)
	                });
	                const apply = () => {
	                    const { soundEnabled: nextSoundEnabled, soundVolume: nextSoundVolume, ...visualSettings } = readSettings();
	                    this.savePersonalizationSettings(visualSettings);
	                    window.zarateXP?.soundManager?.setEnabled(nextSoundEnabled);
	                    window.zarateXP?.soundManager?.setVolume(nextSoundVolume / 100);
	                    status.textContent = 'Aplicado y guardado';
	                };

                appWindow.querySelectorAll('input').forEach((input) => {
                    input.addEventListener('change', apply);
                });
                appWindow.querySelector('[data-settings-apply]').addEventListener('click', apply);
	                appWindow.querySelector('[data-settings-reset]').addEventListener('click', () => {
	                    localStorage.removeItem('zarateXP.settings');
	                    localStorage.removeItem('zarateXP_soundPrefs');
	                    window.zarateXP?.soundManager?.setEnabled(true);
	                    window.zarateXP?.soundManager?.setVolume(0.5);
	                    this.applyPersonalization();
	                    status.textContent = 'Restaurado. Reabre esta ventana para ver los controles actualizados.';
	                });
                appWindow.querySelectorAll('[data-cp-open]').forEach((button) => {
                    button.addEventListener('click', () => this.openApp(button.dataset.cpOpen));
                });
            }
        });
    }

    _openApiCenter() {
        const content = `
            <div class="xp-api-center" data-api-root>
                <aside class="xp-api-sidebar">
                    <h2>API Center</h2>
                    <p>Laboratorio de integraciones REST con datos en vivo, cache local, cancelación y recuperación ante fallos.</p>
                    <nav class="xp-api-nav" data-api-tabs role="tablist" aria-label="Fuentes de datos">
                        <button type="button" class="active" data-api-tab="weather" role="tab" aria-selected="true">Clima</button>
                        <button type="button" data-api-tab="github" role="tab" aria-selected="false">GitHub</button>
                        <button type="button" data-api-tab="countries" role="tab" aria-selected="false">Países</button>
                    </nav>
                    <div class="xp-api-health" aria-label="Estado de proveedores">
                        <strong>Proveedores</strong>
                        <span data-api-health="weather">Open-Meteo + wttr.in</span>
                        <span data-api-health="github">GitHub REST</span>
                        <span data-api-health="countries">Countries + Banco Mundial</span>
                    </div>
                    <div class="xp-api-sidebar-actions">
                        <button type="button" data-api-refresh-active>Actualizar vista</button>
                        <button type="button" data-api-run-all>Ejecutar todo</button>
                        <button type="button" data-api-clear-cache>Limpiar cache</button>
                    </div>
                </aside>
                <main class="xp-api-main">
                    <div class="xp-api-mobile-tabs" data-api-tabs role="tablist" aria-label="Fuentes de datos">
                        <button type="button" class="active" data-api-tab="weather" role="tab" aria-selected="true">Clima</button>
                        <button type="button" data-api-tab="github" role="tab" aria-selected="false">GitHub</button>
                        <button type="button" data-api-tab="countries" role="tab" aria-selected="false">Países</button>
                    </div>
                    <div class="xp-api-mobile-actions" aria-label="Acciones de API Center">
                        <button type="button" data-api-refresh-active>Actualizar</button>
                        <button type="button" data-api-run-all>Ejecutar todo</button>
                        <button type="button" data-api-clear-cache>Limpiar cache</button>
                    </div>
                    <section class="xp-api-panel active" data-api-panel="weather" role="tabpanel" aria-label="Clima">
                        <div class="xp-api-toolbar">
                            <label for="api-weather-city">Ciudad</label>
                            <input id="api-weather-city" type="search" value="Buenos Aires" autocomplete="off" data-weather-city>
                            <button type="button" data-weather-run>Consultar clima</button>
                        </div>
                        <div class="xp-api-result xp-weather-result" data-weather-result aria-live="polite"></div>
                    </section>
                    <section class="xp-api-panel" data-api-panel="github" role="tabpanel" aria-label="GitHub">
                        <div class="xp-api-toolbar">
                            <label for="api-github-user">Usuario</label>
                            <input id="api-github-user" type="search" value="IAZARA" autocomplete="off" data-github-user>
                            <button type="button" data-github-run>Traer repos</button>
                        </div>
                        <div class="xp-api-result" data-github-result aria-live="polite"></div>
                    </section>
                    <section class="xp-api-panel" data-api-panel="countries" role="tabpanel" aria-label="Países">
                        <div class="xp-api-toolbar">
                            <label for="api-country-name">País</label>
                            <input id="api-country-name" type="search" value="Argentina" autocomplete="off" data-country-name>
                            <button type="button" data-country-run>Buscar país</button>
                        </div>
                        <div class="xp-api-result" data-country-result aria-live="polite"></div>
                    </section>
                    <footer class="xp-api-log"><span data-api-log role="status">Listo para consultar datos.</span><time data-api-last-updated>Sin actualizar</time></footer>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'api-center',
            title: 'API Center - Integraciones REST',
            icon: './assets/images/hd-icons/api.svg',
            content,
            width: 820,
            height: 540,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/api-center.js?v=zaratexp-20260712-release', 'initApiCenterApp')
                    .then(() => window.initApiCenterApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar API Center: ${error.message}`));
            },
            onClose: (appWindow) => window.destroyApiCenterApp?.(appWindow)
        });
    }

    _openPdfStudio() {
        const content = `
            <div class="xp-pdf-studio" data-pdf-root>
                <aside class="xp-pdf-sidebar">
                    <h2>PDF Studio</h2>
                    <p>Abre el CV o cualquier PDF local, agrega notas de revision y conserva el historial en el navegador.</p>
                    <label class="xp-file-button">
                        Abrir PDF local
                        <input type="file" accept="application/pdf" data-pdf-file>
                    </label>
                    <button type="button" data-pdf-default>CV actualizado</button>
                    <button type="button" data-pdf-download>Descargar PDF</button>
                    <button type="button" data-pdf-print>Imprimir</button>
                    <div class="xp-pdf-notes">
                        <h3>Notas</h3>
                        <textarea data-pdf-note-text placeholder="Ej: destacar integraciones, APIs, n8n..."></textarea>
                        <button type="button" data-pdf-add-note>Agregar nota</button>
                        <ul data-pdf-note-list></ul>
                    </div>
                </aside>
                <main class="xp-pdf-viewer">
                    <div class="xp-pdf-toolbar">
                        <button type="button" data-pdf-zoom="-0.1">-</button>
                        <span data-pdf-zoom-label>100%</span>
                        <button type="button" data-pdf-zoom="0.1">+</button>
                        <button type="button" data-pdf-rotate>Rotar</button>
                        <span data-pdf-status>Ivan_Zarate_CV.pdf</span>
                    </div>
                    <div class="xp-pdf-frame-wrap">
                        <iframe title="Visor PDF" data-pdf-frame src="./Ivan_Zarate_CV.pdf#view=FitH"></iframe>
                    </div>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'pdf-studio',
            title: 'PDF Studio - Ivan_Zarate_CV.pdf',
            icon: './assets/images/hd-icons/pdf-studio.svg',
            content,
            width: 900,
            height: 620,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/pdf-studio.js', 'initPdfStudioApp')
                    .then(() => window.initPdfStudioApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar PDF Studio: ${error.message}`));
            },
            onClose: (appWindow) => window.destroyPdfStudioApp?.(appWindow)
        });
    }

    _openSolitaire() {
        const content = `
            <div class="xp-solitaire-app" data-solitaire-root>
                <div class="xp-solitaire-toolbar">
                    <div class="xp-solitaire-actions">
                        <button type="button" data-solitaire-new>Nuevo</button>
                        <button type="button" data-solitaire-undo>Deshacer</button>
                        <button type="button" data-solitaire-hint>Pista</button>
                        <button type="button" data-solitaire-auto>Auto</button>
                    </div>
                    <span data-solitaire-status role="status">Solitario listo</span>
                    <div class="xp-solitaire-metrics" aria-label="Estadísticas de partida">
                        <strong data-solitaire-score>0 pts</strong>
                        <span data-solitaire-moves>0 mov.</span>
                        <time data-solitaire-time>00:00</time>
                        <span data-solitaire-best>Mejor: --</span>
                    </div>
                </div>
                <div class="xp-solitaire-board" aria-label="Mesa de Solitario Klondike">
                    <div class="xp-solitaire-top">
                        <button type="button" class="xp-card-pile stock" data-pile="stock" aria-label="Mazo"></button>
                        <button type="button" class="xp-card-pile waste" data-pile="waste" aria-label="Descarte"></button>
                        <div class="xp-foundations" data-foundations aria-label="Fundaciones"></div>
                    </div>
                    <div class="xp-tableau" data-tableau aria-label="Columnas del tablero"></div>
                </div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'solitaire',
            title: 'Solitario - Klondike XP',
            icon: './assets/images/hd-icons/solitaire.svg',
            content,
            width: 860,
            height: 610,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/solitaire.js?v=zaratexp-20260712-release', 'initSolitaireApp')
                    .then(() => window.initSolitaireApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar Solitario: ${error.message}`));
            },
            onClose: (appWindow) => window.destroySolitaireApp?.(appWindow)
        });
    }

    _openPinball() {
        const content = `
            <div class="xp-pinball-app" data-pinball-root>
                <aside class="xp-pinball-panel">
                    <div class="xp-pinball-brand">
                        <h2>Pinball XP Lab</h2>
                        <p>Mesa Canvas con física propia, misiones, combos y progresión arcade.</p>
                    </div>
                    <div class="xp-pinball-actions">
                        <button type="button" data-pinball-start>Iniciar / Lanzar</button>
                        <button type="button" data-pinball-pause>Pausar</button>
                        <button type="button" data-pinball-reset>Reiniciar</button>
                        <button type="button" data-pinball-sound aria-pressed="true">Sonido: Sí</button>
                        <button type="button" data-pinball-fullscreen aria-pressed="false">Pantalla completa</button>
                    </div>
                    <dl class="xp-pinball-stats">
                        <dt>Puntos</dt><dd data-pinball-score>0</dd>
                        <dt>Record</dt><dd data-pinball-highscore>0</dd>
                        <dt>Bolas</dt><dd data-pinball-balls>3</dd>
                        <dt>Estado</dt><dd data-pinball-state>Listo</dd>
                        <dt>Combo</dt><dd data-pinball-combo>x1</dd>
                        <dt>Multiplicador</dt><dd data-pinball-multiplier>x1</dd>
                        <dt>Nivel</dt><dd data-pinball-level>1</dd>
                    </dl>
                    <div class="xp-pinball-mission" aria-live="polite">
                        <strong>Misión</strong>
                        <span data-pinball-mission>Encendé los tres carriles XP</span>
                    </div>
                    <div class="xp-pinball-meter" role="progressbar" aria-label="Carga del lanzador" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                        <span data-pinball-charge></span>
                    </div>
                    <div class="xp-pinball-pad" aria-label="Controles tactiles">
                        <button type="button" data-pinball-left>A / Izq</button>
                        <button type="button" data-pinball-plunger>Espacio</button>
                        <button type="button" data-pinball-right>D / Der</button>
                    </div>
                    <p class="xp-pinball-help">Mantené Espacio o flecha abajo para cargar. A/D o flechas controlan los flippers. P pausa, R reinicia.</p>
                </aside>
                <main class="xp-pinball-table-wrap">
                    <canvas width="520" height="700" data-pinball-canvas tabindex="0" aria-label="Mesa interactiva de Pinball XP"></canvas>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'pinball',
            title: 'Pinball XP Lab',
            icon: './assets/images/hd-icons/pinball.svg?v=20260712',
            content,
            width: 900,
            height: 720,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/pinball.js?v=zaratexp-20260712-release', 'initPinballApp')
                    .then(() => window.initPinballApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar Pinball: ${error.message}`));
            },
            onClose: (appWindow) => window.destroyPinballApp?.(appWindow)
        });
    }

    _downloadTextFile(fileName, text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        link.remove();
    }

    _escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    _safeDomId(value) {
        const safeValue = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
        return safeValue || `item-${Date.now()}`;
    }

    _safeExternalUrl(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue || rawValue === '#') return '';

        try {
            const url = new URL(rawValue, window.location.href);
            return ['http:', 'https:'].includes(url.protocol) ? this._escapeHtml(url.href) : '';
        } catch (error) {
            return '';
        }
    }

    _safeImageSrc(value, fallback = './images/icons/placeholder.svg') {
        const rawValue = String(value || '').trim();
        if (!rawValue) return fallback;

        try {
            const url = new URL(rawValue, window.location.href);
            if (['http:', 'https:', 'blob:'].includes(url.protocol)) return rawValue;
        } catch (error) {
            return fallback;
        }

        return fallback;
    }

    _isImageLike(value) {
        return /\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(String(value || ''));
    }

    _renderProjectIcon(project, size) {
        const safeName = this._escapeHtml(project.name || 'Proyecto');
        if (this._isImageLike(project.icon)) {
            const safeSrc = this._escapeHtml(this._safeImageSrc(project.icon));
            return `<img src="${safeSrc}" width="${size}" height="${size}" alt="${safeName}" style="object-fit: contain;"/>`;
        }

        return this._escapeHtml(project.icon || 'Carpeta');
    }

    _sanitizeWordPadHtml(html) {
        const template = document.createElement('template');
        template.innerHTML = String(html || '');
        const allowedTags = new Set(['B', 'BR', 'DIV', 'EM', 'H2', 'H3', 'I', 'P', 'STRONG', 'U']);

        template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
        Array.from(template.content.querySelectorAll('*')).reverse().forEach((node) => {
            if (!allowedTags.has(node.tagName)) {
                node.replaceWith(document.createTextNode(node.textContent || ''));
                return;
            }

            Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name));
        });

        return template.innerHTML;
    }
    
    async _openMinesweeper() {
        if (this._focusIfRunning('minesweeper')) return null;

        try {
            const response = await fetch('./minesweeper.html');
            if (!response.ok) {
                throw new Error(`Error al cargar minesweeper.html: ${response.statusText} (${response.status})`);
            }
            const content = await response.text();

            // Evita una segunda instancia si dos aperturas coincidieron durante el fetch.
            if (this._focusIfRunning('minesweeper')) return null;

            return this._createSingleInstanceWindow({
                id: 'minesweeper',
                title: 'Buscaminas',
                icon: './assets/images/hd-icons/minesweeper.svg?v=20260712',
                content,
                width: 360,
                height: 480,
                resizable: true,
                maximizable: false,
                onReady: (appWindow) => {
                    this._loadScriptOnce('js/minesweeper.js?v=zaratexp-20260712-release', 'initMinesweeperGame')
                        .then(() => window.initMinesweeperGame?.(appWindow))
                        .catch((error) => this.showError(`No se pudo iniciar Buscaminas: ${error.message}`));
                },
                onClose: (appWindow) => window.destroyMinesweeperGame?.(appWindow)
            });
        } catch (error) {
            console.error('Error al abrir Buscaminas:', error);
            this.showError(`Error al abrir Buscaminas: ${error.message}`);
            return null;
        }
    }

    async _openPaint() {
        // Prevenir que se abra más de una ventana de Paint
        if (this.runningApps.has('paint')) {
            debugLog('Paint is already running');
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('paint');
            }
            return;
        }
        
        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }
            
            // Cargar el contenido de Paint
            debugLog('Loading paint.html...');
            const response = await fetch('./paint.html');
            if (!response.ok) {
                throw new Error(`Error al cargar paint.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();
            
            // Crear la ventana usando el WindowManager
            const paintWindow = this.windowManager.createWindow({
                id: 'paint',
                title: 'Paint',
                icon: './assets/images/hd-icons/paint.svg',
                content: htmlContent,
                width: 860,
                height: 620,
                resizable: true,
                maximizable: true
            });
            
            // Cargar dinámicamente el script de Paint
            setTimeout(() => {
                const windowElement = document.querySelector('[data-window-id="paint"]');
                if (windowElement) {
                    // Verificar si ya se ha cargado el script
                    if (!document.querySelector('script[src="js/paint.js"]')) {
                        const script = document.createElement('script');
                        script.src = 'js/paint.js';
                        script.type = 'text/javascript';
                        
                        script.onload = () => {
                            debugLog('Paint script loaded, initializing app...');
                            if (typeof initPaintApp === 'function') {
                                try {
                                    initPaintApp(windowElement);
                                    debugLog('Paint app initialized successfully');
                                } catch (error) {
                                    console.error('Error initializing paint app:', error);
                                }
                            }
                        };
                        
                        script.onerror = (error) => {
                            console.error('Error loading paint script:', error);
                        };
                        
                        document.head.appendChild(script);
                    } else {
                        debugLog('Paint script already loaded, initializing app...');
                        if (typeof initPaintApp === 'function') {
                            try {
                                initPaintApp(windowElement);
                                debugLog('Paint app initialized successfully');
                            } catch (error) {
                                console.error('Error initializing paint app:', error);
                            }
                        }
                    }
                } else {
                    debugLog('Paint window element not found');
                }
            }, 300);
            
            // Configurar observer para detectar cuando se cierra la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node.dataset && node.dataset.windowId === 'paint') {
                                debugLog('Paint window closed');
                                if (typeof destroyPaintApp === 'function') {
                                    destroyPaintApp(node);
                                }
                                this.closeApp('paint');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (paintWindow.parentNode) {
                observer.observe(paintWindow.parentNode, { childList: true });
            }
            
            // Marcar como aplicación en ejecución
            this.runningApps.set('paint', 'paint');
            
            debugLog('Paint window created successfully');
            return paintWindow;
            
        } catch (error) {
            console.error('Error al abrir Paint:', error);
            this.showError(`Error al abrir Paint: ${error.message}`);
        }
    }

    async _openResume() {
        // Prevenir que se abra más de una ventana de Resume
        if (this.runningApps.has('resume')) {
            debugLog('Resume is already running');
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('resume');
            }
            return;
        }

        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // Mostrar el PDF actualizado directamente con barra de herramientas XP
            const content = `
                <div id="resume-viewer" class="xp-resume-app">
                    <div class="resume-toolbar">
                        <button class="toolbar-button" id="save-cv-btn" type="button">
                            <img src="./assets/images/xp-small-icons/save.png" alt="Guardar">
                            <span>Guardar</span>
                        </button>
                        <button class="toolbar-button" id="print-cv-btn" type="button">
                            <img src="./assets/images/xp-small-icons/print-to-file.png" alt="Imprimir">
                            <span>Imprimir</span>
                        </button>
                        <button class="toolbar-button" id="pdf-studio-btn" type="button">
                            <img src="./assets/images/hd-icons/pdf-studio.svg" alt="PDF Studio">
                            <span>PDF Studio</span>
                        </button>
                        <div class="toolbar-separator"></div>
                        <button class="toolbar-button" id="resume-projects-btn" type="button">
                            <img src="./assets/images/hd-icons/projects.svg" alt="Proyectos">
                            <span>Proyectos</span>
                        </button>
                        <button class="toolbar-button" id="resume-contact-btn" type="button">
                            <img src="./assets/images/hd-icons/contact.svg" alt="Contacto">
                            <span>Contacto</span>
                        </button>
                    </div>
                    <div class="resume-layout">
                        <aside class="resume-quick-pane">
                            <section>
                                <h3>Ruta rápida</h3>
                                <button type="button" data-resume-open="projects">Ver evidencia en proyectos</button>
                                <button type="button" data-resume-open="api-center">Probar APIs en vivo</button>
                                <button type="button" data-resume-open="n8n-flows">Ver automatizaciones</button>
                                <button type="button" data-resume-open="contact">Contactar</button>
                            </section>
                            <section>
                                <h3>Lo que demuestra</h3>
                                <p>Descubrimiento con usuarios, plataformas productivas, MLOps, datos críticos, integración, capacitación y mejora continua.</p>
                            </section>
                        </aside>
                        <div class="resume-content">
                            <object class="resume-pdf" data="./Ivan_Zarate_CV.pdf#view=FitH" type="application/pdf">
                                <div class="resume-fallback">
                                    <p>No se pudo mostrar el PDF en este navegador.</p>
                                    <a href="./Ivan_Zarate_CV.pdf" target="_blank" rel="noopener">Abrir CV actualizado</a>
                                </div>
                            </object>
                        </div>
                    </div>
                    <div class="xp-statusbar"><span>Ivan_Zarate_CV.pdf</span><span>PDF actualizado dentro de ZarateXP</span></div>
                </div>
                <style>
                    #resume-viewer {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        min-height: 0;
                        font-family: 'Tahoma', sans-serif;
                        font-size: 11px;
                    }
                    
                    .resume-toolbar {
                        background: linear-gradient(to bottom, #fefefe 0%, #e3e3e3 100%);
                        border-bottom: 1px solid #8e8f8f;
                        padding: 3px;
                        display: flex;
                        align-items: center;
                        min-height: 26px;
                    }
                    
                    .toolbar-button {
                        background: transparent;
                        border: 1px solid transparent;
                        padding: 2px 4px;
                        margin: 0 1px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        cursor: default;
                        font-family: 'Tahoma', sans-serif;
                        font-size: 11px;
                        color: #000;
                        border-radius: 3px;
                        transition: none;
                    }
                    
                    .toolbar-button:hover {
                        border: 1px solid #0078d7;
                        background: linear-gradient(to bottom, #e5f1fb 0%, #cfe8fc 100%);
                    }
                    
                    .toolbar-button:active {
                        background: linear-gradient(to bottom, #cfe8fc 0%, #b5d3f0 100%);
                        border: 1px solid #0078d7;
                    }
                    
                    .toolbar-button img {
                        width: 16px;
                        height: 16px;
                    }
                    
                    .toolbar-separator {
                        width: 1px;
                        height: 20px;
                        background: #8e8f8f;
                        margin: 0 4px;
                    }
                    
                    .resume-layout {
                        flex: 1;
                        min-height: 0;
                        display: grid;
                        grid-template-columns: 190px minmax(0, 1fr);
                    }

                    .resume-quick-pane {
                        background: linear-gradient(#7ba0e6, #f7f9ff 42%, #d8e8ff);
                        border-right: 1px solid #7f9db9;
                        padding: 10px;
                        overflow: auto;
                    }

                    .resume-quick-pane section {
                        border: 1px solid #b7c9ee;
                        background: rgba(255,255,255,0.86);
                        margin-bottom: 10px;
                        padding: 9px;
                        border-radius: 4px;
                    }

                    .resume-quick-pane h3 {
                        margin: 0 0 8px;
                        color: #0b3d91;
                        font-size: 12px;
                    }

                    .resume-quick-pane p {
                        margin: 0;
                        line-height: 1.35;
                    }

                    .resume-quick-pane button {
                        width: 100%;
                        margin: 4px 0;
                        text-align: left;
                        font: 11px Tahoma, sans-serif;
                    }

                    .resume-content {
                        background: #f3f4f6;
                        padding: 0;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .resume-pdf {
                        width: 100%;
                        height: 100%;
                        border: 0;
                        background: white;
                    }

                    .resume-fallback {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        height: 100%;
                        color: #1f2937;
                    }

                    .resume-fallback a {
                        color: #003399;
                        font-weight: bold;
                    }

                    @media (max-width: 760px) {
                        .resume-layout {
                            grid-template-columns: 1fr;
                        }
                        .resume-quick-pane {
                            display: none;
                        }
                    }
                </style>
            `;

            // Crear la ventana usando el WindowManager
            const resumeWindow = this.windowManager.createWindow({
                id: 'resume',
                title: 'Mi Curriculum Vitae',
                icon: './assets/images/hd-icons/cv.svg',
                content: content,
                width: 700,
                height: 600,
                resizable: true,
                maximizable: true
            });

            // Marcar como aplicación en ejecución
            this.runningApps.set('resume', 'resume');
            
            // Configurar eventos de los botones
            setTimeout(() => {
                const saveBtn = resumeWindow.querySelector('#save-cv-btn');
                const printBtn = resumeWindow.querySelector('#print-cv-btn');
                const pdfStudioBtn = resumeWindow.querySelector('#pdf-studio-btn');
                const projectsBtn = resumeWindow.querySelector('#resume-projects-btn');
                const contactBtn = resumeWindow.querySelector('#resume-contact-btn');
                
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        // Crear un enlace temporal para descargar el PDF
                        const link = document.createElement('a');
                        // Usar ruta relativa al archivo PDF en la carpeta del proyecto
                        link.href = './Ivan_Zarate_CV.pdf';
                        link.download = 'Ivan_Zarate_CV.pdf';
                        
                        // Simular clic para descargar
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Reproducir sonido de clic si está disponible
                        if (this.soundManager) {
                            this.soundManager.play('click');
                        }
                    });
                }
                
                if (printBtn) {
                    printBtn.addEventListener('click', () => {
                        // Abrir diálogo de impresión
                        window.print();
                        
                        // Reproducir sonido de clic si está disponible
                        if (this.soundManager) {
                            this.soundManager.play('click');
                        }
                    });
                }

                pdfStudioBtn?.addEventListener('click', () => this.openApp('pdf-studio'));
                projectsBtn?.addEventListener('click', () => this.openApp('projects'));
                contactBtn?.addEventListener('click', () => this.openApp('contact'));
                resumeWindow.querySelectorAll('[data-resume-open]').forEach((button) => {
                    button.addEventListener('click', () => this.openApp(button.dataset.resumeOpen));
                });
            }, 100);

            // Configurar cleanup cuando se cierre la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === resumeWindow) {
                                debugLog('Resume window removed, cleaning up...');
                                this.closeApp('resume');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (resumeWindow.parentNode) {
                observer.observe(resumeWindow.parentNode, { childList: true });
            }

            debugLog('Resume image viewer window created successfully');
            return resumeWindow;

        } catch (error) {
            console.error("No se pudo abrir el CV:", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-resume',
                    title: 'Error',
                    icon: './assets/images/xp-small-icons/critical.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar el CV</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                            <button onclick="this.closest('.window').remove()">Aceptar</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                alert(`Error: No se pudo abrir el CV. ${error.message}`);
            }
        }
    }

    closeApp(appId) {
        // Cleanup específico para diferentes aplicaciones
        if (appId === 'winamp') {
            const winampWindow = document.querySelector('[data-window-id="winamp"]');
            if (typeof destroyWinampProApp === 'function' && winampWindow) {
                destroyWinampProApp(winampWindow);
            }
        } else if (appId === 'minesweeper') {
            debugLog('Cleaning up Buscaminas application');
            const minesweeperWindow = document.querySelector('[data-window-id="minesweeper"]');
            if (typeof destroyMinesweeperGame === 'function' && minesweeperWindow) {
                destroyMinesweeperGame(minesweeperWindow);
            }
        } else if (appId === 'paint') {
            debugLog('Cleaning up Paint application');
            const paintWindow = document.querySelector('[data-window-id="paint"]');
            if (typeof destroyPaintApp === 'function' && paintWindow) {
                destroyPaintApp(paintWindow);
            }
        } else if (appId === 'pdf-studio') {
            const pdfWindow = document.querySelector('[data-window-id="pdf-studio"]');
            if (typeof destroyPdfStudioApp === 'function' && pdfWindow) {
                destroyPdfStudioApp(pdfWindow);
            }
        } else if (appId === 'pinball') {
            const pinballWindow = document.querySelector('[data-window-id="pinball"]');
            if (typeof destroyPinballApp === 'function' && pinballWindow) {
                destroyPinballApp(pinballWindow);
            }
        } else if (appId === 'my-computer') {
            debugLog('Cleaning up Mi PC application');
            // Aquí se puede añadir cleanup específico para Mi PC si es necesario
        } else if (appId === 'contact') {
            debugLog('Cleaning up Contact application');
            // Limpiar cualquier event listener específico si es necesario
        }
        
        this.runningApps.delete(appId);
        debugLog(`App ${appId} closed and removed from running apps`);
    }
    
    getApp(appId) {
        return this.apps.get(appId);
    }
    
    getAllApps() {
        return Array.from(this.apps.values());
    }
}

// Legacy support
window.AppManager = AppManager;
