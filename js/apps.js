// --- Gestor de Aplicaciones Dinámicas para ZarateXP ---

// --- AppManager Class para compatibilidad con el sistema existente ---

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
        // Registrar Mi PC
        this.registerApp({
            id: 'my-computer',
            name: 'Mi PC',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/My Computer.png',
            category: 'system',
            description: 'Browse computer files and drives',
            handler: () => this._openMyComputer()
        });
        
        // Registrar Winamp
        this.registerApp({
            id: 'winamp',
            name: 'Winamp',
            icon: './images/winamp.png',
            category: 'entertainment',
            description: 'It really whips the llama\'s ass!',
            handler: () => this._openWinamp()
        });
        
        // Registrar otras aplicaciones básicas para compatibilidad
        this.registerApp({
            id: 'about-me',
            name: 'Sobre Mí',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/User Accounts.png',
            category: 'system',
            description: 'Conoce más sobre Ivan Zarate',
            handler: () => this._openAboutMe()
        });
        
        this.registerApp({
            id: 'projects',
            name: 'Mis Proyectos',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Internet Explorer 6.png',
            category: 'documents',
            description: 'Explora mis proyectos de desarrollo',
            handler: () => this._openProjectsExplorer()
        });
        
        this.registerApp({
            id: 'resume',
            name: 'Mi CV',
            icon: './images/icons/pdf.png',
            category: 'documents',
            description: 'Ver CV actualizado',
            handler: () => this._openResume()
        });

        this.registerApp({
            id: 'documents',
            name: 'Mis Documentos',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/My Documents.png',
            category: 'documents',
            description: 'CV, proyectos y documentos clave',
            handler: () => this._openDocuments()
        });
        
        this.registerApp({
            id: 'contact',
            name: 'Mi Contacto',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Outlook Express.png',
            category: 'internet',
            description: 'Envíame un mensaje',
            handler: () => this._openContact()
        });
        
        // Registrar Buscaminas
        this.registerApp({
            id: 'minesweeper',
            name: 'Buscaminas',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Minesweeper.png',
            category: 'games',
            description: 'Juego clásico de Buscaminas',
            handler: () => this._openMinesweeper()
        });
        
        // Registrar Paint
        this.registerApp({
            id: 'paint',
            name: 'Paint',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Paint.png',
            category: 'accessories',
            description: 'Editor de imágenes Paint',
            handler: () => this._openPaint()
        });

        this.registerApp({
            id: 'notepad',
            name: 'Bloc de notas',
            icon: './assets/images/notepad.png',
            category: 'accessories',
            description: 'Notas rapidas con autoguardado local',
            handler: () => this._openNotepad()
        });

        this.registerApp({
            id: 'wordpad',
            name: 'WordPad',
            icon: './assets/images/document.png',
            category: 'accessories',
            description: 'Editor de texto enriquecido',
            handler: () => this._openWordPad()
        });

        this.registerApp({
            id: 'n8n-flows',
            name: 'Flujos n8n',
            icon: './N8n-logo-new.svg.png',
            category: 'automation',
            description: 'Automatizaciones visuales y funcionales',
            handler: () => this._openN8nFlows()
        });

        this.registerApp({
            id: 'control-panel',
            name: 'Panel de control',
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Control Panel.png',
            category: 'system',
            description: 'Personalizacion de ZarateXP',
            handler: () => this._openControlPanel()
        });

        this.registerApp({
            id: 'api-center',
            name: 'API Center',
            icon: './images/icons/network.png',
            category: 'development',
            description: 'Integraciones en vivo con APIs publicas',
            handler: () => this._openApiCenter()
        });

        this.registerApp({
            id: 'pdf-studio',
            name: 'PDF Studio',
            icon: './images/icons/pdf.png',
            category: 'documents',
            description: 'Abrir, revisar y anotar PDFs',
            handler: () => this._openPdfStudio()
        });

        this.registerApp({
            id: 'solitaire',
            name: 'Solitario',
            icon: './images/icons/solitaire.png',
            category: 'games',
            description: 'Klondike estilo Windows XP',
            handler: () => this._openSolitaire()
        });

        this.registerApp({
            id: 'pinball',
            name: 'Pinball XP',
            icon: './images/icons/pinball.png',
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
            console.log(`App ${appId} is already running`);
            if (this.windowManager?.focusWindow) {
                this.windowManager.focusWindow(this.runningApps.get(appId) || appId);
            }
            return;
        }
        
        // Play launch sound
        if (window.zarateXP?.soundManager) {
            window.zarateXP.soundManager.play('click');
        }
        
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
            console.log('Mi PC is already running');
            // Intentar enfocar la ventana existente si el WindowManager lo permite
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('my-computer');
            }
            return;
        }

        try {
            // 1. Esperar a que se cargue el contenido del archivo
            console.log('Loading mipc.html...');
            const response = await fetch('./mipc.html');
            if (!response.ok) {
                throw new Error(`Error al cargar mipc.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();
            
            console.log('mipc.html loaded successfully, extracting and adapting content...');

            // Extraer el contenido del window-body pero mantener la estructura necesaria para CSS
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const windowBody = doc.querySelector('.window-body');
            
            let content;
            if (windowBody) {
                // Crear un contenedor con el ID necesario para los estilos CSS
                content = `<div id="mipc-window">${windowBody.innerHTML}</div>`;
                console.log('Window body content extracted and wrapped with mipc-window ID');
            } else {
                // Fallback: usar todo el contenido si no se encuentra window-body
                content = htmlContent;
                console.log('Window body not found, using full content as fallback');
            }

            // 2. Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }

            // 3. Una vez que el contenido está listo, crear la ventana
            console.log('Creating Mi PC window with WindowManager...');
            
            const window = this.windowManager.createWindow({
                id: 'my-computer',
                title: 'Mi PC',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/My Computer.png',
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
                                console.log('Mi PC window removed, cleaning up...');
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

            console.log('Mi PC window created successfully with cleanup observer');
            return window;

        } catch (error) {
            console.error("No se pudo abrir 'Mi PC':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-mipc',
                    title: 'Error',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/My Computer.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar el componente 'Mi PC'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${error.message}</div>
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
            icon: './images/winamp.png',
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
            console.log('About Me is already running');
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
                    <div class="about-sections">
                        <div class="about-section">
                            <div class="about-image">
                                <img src="images/sobremi/fullstack-developer.png" alt="Ivan trabajando como desarrollador full stack" />
                            </div>
                            <div class="about-text">
                                <p>¡Hola! Soy <strong>Ivan Agustin Zarate</strong>, Analista en Sistemas por ORT y desarrollador <strong>Full Stack</strong>. Hoy mi foco está en construir productos web, APIs, automatizaciones y soluciones con IA que reduzcan tareas manuales, mejoren procesos y conviertan ideas en sistemas útiles.</p>
                            </div>
                        </div>

                        <div class="about-section">
                            <div class="about-image">
                                <img src="images/sobremi/ai-automation.png" alt="Ivan diseñando automatizaciones e integraciones con IA" />
                            </div>
                            <div class="about-text">
                                <p>Me especializo en <strong>automatización, IA e integración de sistemas</strong>: n8n, webhooks, APIs REST, agentes, OCR, extracción estructurada, RAG, embeddings y flujos que conectan herramientas para ahorrar tiempo real en operaciones.</p>
                            </div>
                        </div>

                        <div class="about-section">
                            <div class="about-image">
                                <img src="images/sobremi/forzatech-founder.png" alt="Ivan presentando soluciones de software a medida" />
                            </div>
                            <div class="about-text">
                                <p>También soy fundador de <strong>ForzaTech</strong>, una iniciativa orientada a sistemas a medida, automatización, IA, apps móviles y micro-SaaS para PYMEs argentinas. Mi forma de trabajar combina relevamiento claro, prototipos rápidos y foco en impacto operativo.</p>
                            </div>
                        </div>

                        <div class="about-section">
                            <div class="about-image">
                                <img src="images/sobremi/privacy-data-products.png" alt="Ivan revisando productos de datos con privacidad por diseño" />
                            </div>
                            <div class="about-text">
                                <p>En productos con datos sensibles priorizo <strong>privacidad por diseño</strong>, mínimos privilegios, permisos por rol, validaciones backend, trazabilidad y documentación. Me interesa que cada sistema sea útil, mantenible y responsable desde su arquitectura.</p>
                            </div>
                        </div>

                        <div class="about-section">
                            <div class="about-image">
                                <img src="images/sobremi/shipping-projects.png" alt="Ivan publicando proyectos full stack" />
                            </div>
                            <div class="about-text">
                                <p>Trabajo con stacks como <strong>React, Next.js, TypeScript, Tailwind, Python, FastAPI, Node.js, NestJS, Java/Spring Boot, PostgreSQL, Oracle, MongoDB, Docker y Nginx</strong>. Me gusta cerrar el circuito: diseñar, desarrollar, desplegar, medir y seguir mejorando.</p>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            `;

            // Crear la ventana usando el WindowManager
            const aboutWindow = this.windowManager.createWindow({
                id: 'about-me',
                title: 'Sobre Mí - Ivan Agustin Zarate',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/User Accounts.png',
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
                                console.log('About Me window removed, cleaning up...');
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

            console.log('About Me window created successfully');
            return aboutWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Sobre Mí':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-aboutme',
                    title: 'Error',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/User Accounts.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Sobre Mí'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${error.message}</div>
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
            console.log('Contact is already running');
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
            console.log('Loading contacto.html...');
            const response = await fetch('./components/contacto.html');
            if (!response.ok) {
                throw new Error(`Error al cargar contacto.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();

            // Crear la ventana usando el WindowManager
            const contactWindow = this.windowManager.createWindow({
                id: 'contact',
                title: 'Mi Contacto - Ivan Agustin Zarate',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Outlook Express.png',
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
                console.log('Esperando para configurar formulario de contacto...');
                // La ventana de contacto es la que acabamos de crear
                if (contactWindow) {
                    console.log('Ventana de contacto encontrada, configurando formulario...');
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
                                console.log('Contact window removed, cleaning up...');
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

            console.log('Contact window created successfully');
            return contactWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Mi Contacto':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-contact',
                    title: 'Error',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Outlook Express.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Mi Contacto'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${error.message}</div>
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
        console.log('Configurando formulario de contacto...');
        try {
            const form = contactWindow.querySelector('#contact-form');
            const sendBtn = contactWindow.querySelector('.toolbar-btn[title*="Send"]') || 
                           contactWindow.querySelector('.toolbar-btn img[src*="Email"]')?.parentElement;

            console.log('Form encontrado:', !!form);
            console.log('SendBtn encontrado:', !!sendBtn);

            if (!form) {
                console.error('No se encontró el formulario de contacto');
                return;
            }

            // Configurar envío del formulario
            const handleSubmit = async (e) => {
                console.log('handleSubmit llamado!');
                e.preventDefault();
                
                const name = form.querySelector('#contact-name').value || "Visitor from ZarateXP";
                const email = form.querySelector('#contact-email').value;
                const subject = form.querySelector('#contact-subject').value;
                const body = form.querySelector('#contact-body').value;
                
                console.log('Datos del formulario:', { name, email, subject, body });

                if (!email || !subject || !body) {
                    this._showValidationError('Por favor completa todos los campos requeridos: Email, Asunto y Mensaje');
                    return;
                }

                // Mostrar estado de envío
                this._showSendingStatus(contactWindow);

                try {
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
                    
                    console.log('Email enviado exitosamente:', response);
                    
                    // Cerrar ventana de estado de envío
                    const sendingWindow = document.querySelector('[data-window-id="sending-status"]');
                    if (sendingWindow) {
                        sendingWindow.remove();
                    }
                    
                    // Mostrar confirmación de éxito
                    this._showContactConfirmation(contactWindow);
                    
                    // Limpiar formulario
                    form.reset();
                    
                } catch (error) {
                    console.error('Error al enviar email:', error);
                    
                    // Si EmailJS no está configurado, usar método alternativo
                    if (error.message.includes('Service ID') || error.message.includes('Template ID') || error.message.includes('Public Key')) {
                        // Fallback a mailto
                        const fullMessage = `Hola Ivan,\n\nDe: ${email}\nNombre: ${name}\n\n${body}\n\n---\nEnviado desde ZarateXP Portfolio`;
                        const mailtoLink = `mailto:ivan.agustin.95@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;
                        window.open(mailtoLink, '_blank');
                        this._showMailtoFallback(contactWindow);
                    } else {
                        this._showEmailError(contactWindow, error.message);
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

            console.log('Contact form configured successfully');

        } catch (error) {
            console.error('Error configurando formulario de contacto:', error);
        }
    }

    _setupToolbarButtons(contactWindow, form) {
        try {
            // Botón "New Message" - limpiar formulario
            const newMsgBtn = contactWindow.querySelector('.toolbar-btn img[src*="Outlook"]')?.parentElement;
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
            const addressBtn = contactWindow.querySelector('.toolbar-btn img[src*="Address"]')?.parentElement;
            if (addressBtn) {
                addressBtn.addEventListener('click', () => {
                    this._showInfoDialog('Libreta de Direcciones', 'Contáctame directamente en ivan.agustin.95@gmail.com');
                });
            }

            // Botones de edición (Cut, Copy, Paste) - funcionalidad básica
            const cutBtn = contactWindow.querySelector('.toolbar-btn img[src*="Cut"]')?.parentElement;
            const copyBtn = contactWindow.querySelector('.toolbar-btn img[src*="Copy"]')?.parentElement;
            const pasteBtn = contactWindow.querySelector('.toolbar-btn img[src*="Paste"]')?.parentElement;

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
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Critical.png',
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
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Information.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 32px; color: #0066CC; margin-bottom: 10px;">ℹ️</div>
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
            console.log('Projects Explorer is already running');
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
            console.log('Loading proyectos-explorer.html...');
            const response = await fetch('./components/proyectos-explorer.html');
            if (!response.ok) {
                throw new Error(`Error al cargar proyectos-explorer.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();

            // Crear la ventana usando el WindowManager
            const projectsWindow = this.windowManager.createWindow({
                id: 'projects',
                title: 'Mis Proyectos - Explorer',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Internet Explorer 6.png',
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
                                console.log('Projects window removed, cleaning up...');
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

            console.log('Projects Explorer window created successfully');
            return projectsWindow;

        } catch (error) {
            console.error("No se pudo abrir 'Mis Proyectos':", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-projects',
                    title: 'Error',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Internet Explorer 6.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Mis Proyectos'</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${error.message}</div>
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

            console.log('Projects Explorer configured successfully');

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
                            icon.src = './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Folder Closed.png';
                        }
                    } else {
                        item.classList.add('expanded');
                        expand.textContent = '−';
                        const icon = item.querySelector('.tree-icon');
                        if (icon) {
                            icon.src = './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Folder Opened.png';
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
                <img src="./images/Windows XP High Resolution Icon Pack/Windows XP Icons/Folder Opened.png" width="32" height="32"/>
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
        // Para la carpeta root, mostrar directamente los proyectos sin carpetas
        if (folder === 'root') {
            return [
                {
                    id: 'zaratexp',
                    name: 'Zárate XP',
                    type: 'project',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/HTML.png',
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
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Search.png',
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
                    icon: './images/icons/ie.png',
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
                    icon: './assets/images/document.png',
                    detailImage: './assets/images/document.png',
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
                    id: 'sistema-enterprise-java',
                    name: 'Sistema Enterprise Java',
                    type: 'project',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Component Services.png',
                    detailImage: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Component Services.png',
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
                    icon: './N8n-logo-new.svg.png',
                    detailImage: './N8n-logo-new.svg.png',
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
                    icon: './images/icons/ie.png',
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
                    icon: './assets/images/document.png',
                    detailImage: './assets/images/document.png',
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
                    icon: '🔍',
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
                    icon: './microsoft-windosXP.png',
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

    _renderProjects(contentArea, projects, viewMode) {
        if (viewMode === 'icons') {
            this._renderIconView(contentArea, projects);
        } else {
            this._renderListView(contentArea, projects);
        }
    }

    _renderIconView(contentArea, projects) {
        const iconsHtml = projects.map(project => {
            const iconHtml = project.icon.startsWith('./') || project.icon.includes('.png') || project.icon.includes('.jpg') || project.icon.includes('.svg') 
                ? `<img src="${project.icon}" width="32" height="32" alt="${project.name}" style="object-fit: contain;"/>` 
                : project.icon;
            
            return `
                <div class="project-item" data-project-id="${project.id}" data-type="${project.type}" title="${project.description}">
                    <div class="project-icon">
                        ${iconHtml}
                    </div>
                    <div class="project-name">${project.name}</div>
                    <div class="project-details">${project.type === 'folder' ? 'Carpeta' : project.category}</div>
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
                        const iconHtml = project.icon.startsWith('./') || project.icon.includes('.png') || project.icon.includes('.jpg') || project.icon.includes('.svg') 
                            ? `<img src="${project.icon}" width="16" height="16" alt="${project.name}" style="object-fit: contain;"/>` 
                            : project.icon;
                        
                        return `
                            <div class="list-row" data-project-id="${project.id}" data-type="${project.type}">
                                <div class="list-cell">
                                    <span class="list-cell-icon">${iconHtml}</span>
                                    ${project.name}
                                </div>
                                <div class="list-cell">${project.type === 'folder' ? 'Carpeta' : 'Proyecto'}</div>
                                <div class="list-cell">${project.category || '-'}</div>
                                <div class="list-cell">${project.status || '-'}</div>
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

    _showProjectDetails(project) {
        if (this.windowManager) {
            const previewContent = project.preview && project.url && project.url !== '#'
                ? `
                    <div class="project-preview-shell">
                        <div class="project-preview-header">
                            <span>Vista previa embebida</span>
                            <button onclick="window.open('${project.url}', '_blank', 'noopener')" class="project-preview-open">Abrir en navegador</button>
                        </div>
                        <iframe
                            class="project-preview-frame"
                            src="${project.url}"
                            title="Vista previa de ${project.name}"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                `
                : '';

            const detailsContent = `
                <div style="padding: 20px; font-family: 'Tahoma', sans-serif; font-size: 11px;">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="margin-right: 16px;">
                            ${project.detailImage ?
                                `<img src="${project.detailImage}" width="64" height="64" alt="${project.name}" style="object-fit: contain;" />` :
                                (project.icon.startsWith('./') || project.icon.includes('.png') || project.icon.includes('.jpg') ?
                                    `<img src="${project.icon}" width="48" height="48" alt="${project.name}" style="object-fit: contain;" />` :
                                    `<div style="font-size: 48px;">${project.icon}</div>`
                                )
                            }
                        </div>
                        <div>
                            <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #1E4A8C;">${project.name}</h2>
                            <p style="margin: 0; color: #666; font-size: 12px;">${project.description}</p>
                        </div>
                    </div>
                    
                    <div style="border: 1px solid #ACA899; padding: 12px; background: #F0F0F0; margin-bottom: 16px;">
                        <div style="margin-bottom: 8px;"><strong>Categoría:</strong> ${project.category}</div>
                        <div style="margin-bottom: 8px;"><strong>Estado:</strong> ${project.status}</div>
                        ${project.technologies ? `<div style="margin-bottom: 8px;"><strong>Tecnologías:</strong> ${project.technologies.join(', ')}</div>` : ''}
                    </div>

                    ${previewContent}
                    
                    <div style="margin-bottom: 16px;">
                        <strong>Descripción detallada:</strong><br>
                        <div style="margin-top: 8px; line-height: 1.4; color: #333;">
                            ${project.details || project.description}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        ${project.url && project.url !== '#' ? 
                            `<button onclick="window.open('${project.url}', '_blank')" style="padding: 6px 16px; font-size: 11px;">Visitar Sitio</button>` : 
                            ''
                        }
                        <button onclick="this.closest('.window').remove()" style="padding: 6px 16px; font-size: 11px;">Cerrar</button>
                    </div>
                </div>
            `;

            this.windowManager.createWindow({
                id: `project-details-${project.id}`,
                title: `${project.name} - Detalles`,
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Properties.png',
                content: detailsContent,
                width: project.preview ? 920 : 500,
                height: project.preview ? 720 : 400,
                resizable: true,
                maximizable: Boolean(project.preview)
            });
        }
    }

    _showContactConfirmation(contactWindow) {
        // Crear ventana de confirmación
        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'contact-confirmation',
                title: 'Mensaje Enviado',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Outlook Express.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 48px; color: green; margin-bottom: 10px;">✅</div>
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
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Email.png',
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

    _showEmailError(contactWindow, errorMessage) {
        // Cerrar ventana de estado si existe
        const statusWindow = document.querySelector('[data-window-id="sending-status"]');
        if (statusWindow) statusWindow.remove();

        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'email-error',
                title: 'Error al Enviar',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Critical.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                        <div style="margin-bottom: 10px;"><strong>Error al enviar el mensaje</strong></div>
                        <div style="margin-bottom: 20px; color: #666; line-height: 1.4;">
                            ${errorMessage || 'Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente.'}
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

    _showMailtoFallback(contactWindow) {
        // Cerrar ventana de estado si existe
        const statusWindow = document.querySelector('[data-window-id="sending-status"]');
        if (statusWindow) statusWindow.remove();

        if (this.windowManager) {
            this.windowManager.createWindow({
                id: 'mailto-fallback',
                title: 'Configuración Requerida',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Information.png',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 48px; color: #0078d4; margin-bottom: 10px;">ℹ️</div>
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
        const content = `
            <div style="padding: 20px; text-align: center;">
                <h2>${appName}</h2>
                <p>Esta aplicación está en desarrollo.</p>
                <p>Próximamente estará disponible.</p>
            </div>
        `;
        
        // If window manager is available, create a window
        if (this.windowManager) {
            return this.windowManager.createWindow({
                id: `placeholder-${Date.now()}`,
                title: appName,
                content: content,
                width: 400,
                height: 300
            });
        }
    }
    
    showError(message) {
        // If window manager is available, create an error window
        if (this.windowManager) {
            const content = `
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                    <div style="margin-bottom: 20px;">${message}</div>
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
        const iconBase = './images/Windows XP High Resolution Icon Pack/Windows XP Icons';
        const content = `
            <div class="xp-documents-app">
                <div class="xp-explorer-menubar">
                    <span><u>A</u>rchivo</span><span><u>E</u>dicion</span><span><u>V</u>er</span><span><u>F</u>avoritos</span><span>A<u>y</u>uda</span>
                </div>
                <div class="xp-explorer-toolbar">
                    <button type="button" data-doc-open="my-computer"><img src="${iconBase}/Back.png" alt=""> Atras</button>
                    <button type="button" data-doc-open="projects"><img src="${iconBase}/Search.png" alt=""> Buscar proyectos</button>
                    <button type="button" data-doc-open="control-panel"><img src="${iconBase}/Control Panel.png" alt=""> Configurar</button>
                </div>
                <div class="xp-explorer-address">
                    <span>Direccion</span>
                    <div><img src="${iconBase}/My Documents.png" alt=""> C:\\Documents and Settings\\Ivan\\Mis documentos</div>
                </div>
                <div class="xp-documents-layout">
                    <aside class="xp-task-pane">
                        <section>
                            <h3>Tareas de documento</h3>
                            <button type="button" data-doc-open="resume">Abrir CV actualizado</button>
                            <button type="button" data-doc-open="pdf-studio">Revisar PDF con notas</button>
                            <button type="button" data-doc-open="projects">Ver proyectos web</button>
                            <button type="button" data-doc-open="api-center">Abrir API Center</button>
                            <button type="button" data-doc-open="n8n-flows">Ver automatizaciones n8n</button>
                        </section>
                        <section>
                            <h3>Detalles</h3>
                            <p>Portfolio orientado a roles Full Stack, automatizacion, integraciones y productos web.</p>
                        </section>
                    </aside>
                    <main class="xp-folder-grid">
                        <button type="button" class="xp-folder-item important" data-doc-open="resume">
                            <img src="${iconBase}/Document Search.png" alt="">
                            <span>Ivan_Zarate_CV.pdf</span>
                            <small>CV actualizado</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="projects">
                            <img src="${iconBase}/Folder Opened.png" alt="">
                            <span>Proyectos destacados</span>
                            <small>ForzaTech, WJPC, Luttini, ZarateXP</small>
                        </button>
                        <button type="button" class="xp-folder-item important" data-doc-open="api-center">
                            <img src="./images/icons/network.png" alt="">
                            <span>API Center.lnk</span>
                            <small>Clima, GitHub y datos publicos en vivo</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="pdf-studio">
                            <img src="./images/icons/pdf.png" alt="">
                            <span>PDF Studio.exe</span>
                            <small>File API, Blob URL y anotaciones</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="about-me">
                            <img src="${iconBase}/User Accounts.png" alt="">
                            <span>Perfil profesional</span>
                            <small>Full Stack + automatizacion</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="n8n-flows">
                            <img src="./N8n-logo-new.svg.png" alt="">
                            <span>Flujos n8n</span>
                            <small>Procesos visuales funcionales</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="notepad">
                            <img src="./assets/images/notepad.png" alt="">
                            <span>Notas de entrevista.txt</span>
                            <small>Editable localmente</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="wordpad">
                            <img src="./assets/images/document.png" alt="">
                            <span>Carta de presentacion.rtf</span>
                            <small>Editor enriquecido</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="solitaire">
                            <img src="./images/icons/solitaire.png" alt="">
                            <span>Solitario XP</span>
                            <small>Logica Klondike propia</small>
                        </button>
                        <button type="button" class="xp-folder-item" data-doc-open="pinball">
                            <img src="./images/icons/pinball.png" alt="">
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
            icon: `${iconBase}/My Documents.png`,
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

    _openNotepad() {
        const savedText = this._readLocal('zarateXP.notepad', [
            'Notas rapidas - Ivan Zarate',
            '',
            '- Perfil: Full Stack Developer / Systems Analyst',
            '- Foco: React, JavaScript, backend, automatizaciones n8n e integraciones',
            '- Portfolio: abrir Mis Proyectos y CV desde el escritorio'
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
            icon: './assets/images/notepad.png',
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
        const savedHtml = this._readLocal('zarateXP.wordpad', `
            <h2>Ivan Agustin Zarate</h2>
            <p><strong>Full Stack Developer</strong> orientado a productos web, automatizaciones e integraciones.</p>
            <p>Trabajo con frontends interactivos, APIs, dashboards, formularios, despliegues web y flujos n8n para mejorar procesos reales.</p>
        `);

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
            icon: './assets/images/document.png',
            content,
            width: 640,
            height: 500,
            onReady: (appWindow) => {
                const editor = appWindow.querySelector('.xp-wordpad-page');
                const status = appWindow.querySelector('[data-wp-status]');
                const save = () => {
                    this._saveLocal('zarateXP.wordpad', editor.innerHTML);
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
                    <img src="./N8n-logo-new.svg.png" alt="n8n">
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
            icon: './N8n-logo-new.svg.png',
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
                        <label><input type="radio" name="wallpaper" value="default" ${selected(settings.wallpaper, 'default')}> Bliss clasico</label>
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
            icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Control Panel.png',
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
                    iconScale: Number(appWindow.querySelector('input[name="iconScale"]').value)
                });
                const apply = () => {
                    this.savePersonalizationSettings(readSettings());
                    status.textContent = 'Aplicado y guardado';
                };

                appWindow.querySelectorAll('input').forEach((input) => {
                    input.addEventListener('change', apply);
                });
                appWindow.querySelector('[data-settings-apply]').addEventListener('click', apply);
                appWindow.querySelector('[data-settings-reset]').addEventListener('click', () => {
                    localStorage.removeItem('zarateXP.settings');
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
                    <p>Integraciones reales sin API key para mostrar consumo REST, estados de carga, errores y cache local.</p>
                    <button type="button" class="active" data-api-tab="weather">Clima</button>
                    <button type="button" data-api-tab="github">GitHub</button>
                    <button type="button" data-api-tab="countries">Datos publicos</button>
                    <button type="button" data-api-run-all>Ejecutar todo</button>
                </aside>
                <main class="xp-api-main">
                    <section class="xp-api-panel active" data-api-panel="weather">
                        <div class="xp-api-toolbar">
                            <label>Ciudad <input type="search" value="Buenos Aires" data-weather-city></label>
                            <button type="button" data-weather-run>Consultar clima</button>
                        </div>
                        <div class="xp-api-result xp-weather-result" data-weather-result></div>
                    </section>
                    <section class="xp-api-panel" data-api-panel="github">
                        <div class="xp-api-toolbar">
                            <label>Usuario <input type="search" value="IAZARA" data-github-user></label>
                            <button type="button" data-github-run>Traer repos</button>
                        </div>
                        <div class="xp-api-result" data-github-result></div>
                    </section>
                    <section class="xp-api-panel" data-api-panel="countries">
                        <div class="xp-api-toolbar">
                            <label>Pais <input type="search" value="Argentina" data-country-name></label>
                            <button type="button" data-country-run>Buscar pais</button>
                        </div>
                        <div class="xp-api-result" data-country-result></div>
                    </section>
                    <footer class="xp-api-log" data-api-log>Listo. Las consultas usan Open-Meteo, GitHub REST y REST Countries.</footer>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'api-center',
            title: 'API Center - Integraciones REST',
            icon: './images/icons/network.png',
            content,
            width: 820,
            height: 540,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/api-center.js', 'initApiCenterApp')
                    .then(() => window.initApiCenterApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar API Center: ${error.message}`));
            }
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
            icon: './images/icons/pdf.png',
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
                    <button type="button" data-solitaire-new>Nuevo juego</button>
                    <button type="button" data-solitaire-undo>Deshacer</button>
                    <span data-solitaire-status>Solitario listo</span>
                    <strong data-solitaire-score>0 pts</strong>
                </div>
                <div class="xp-solitaire-board">
                    <div class="xp-solitaire-top">
                        <button type="button" class="xp-card-pile stock" data-pile="stock" aria-label="Mazo"></button>
                        <button type="button" class="xp-card-pile waste" data-pile="waste" aria-label="Descarte"></button>
                        <div class="xp-foundations" data-foundations></div>
                    </div>
                    <div class="xp-tableau" data-tableau></div>
                </div>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'solitaire',
            title: 'Solitario - Klondike XP',
            icon: './images/icons/solitaire.png',
            content,
            width: 860,
            height: 610,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/solitaire.js', 'initSolitaireApp')
                    .then(() => window.initSolitaireApp?.(appWindow))
                    .catch((error) => this.showError(`No se pudo iniciar Solitario: ${error.message}`));
            }
        });
    }

    _openPinball() {
        const content = `
            <div class="xp-pinball-app" data-pinball-root>
                <aside class="xp-pinball-panel">
                    <h2>Pinball XP Lab</h2>
                    <p>Canvas 2D, colisiones simples, flippers con teclado y puntuacion en vivo.</p>
                    <button type="button" data-pinball-start>Iniciar</button>
                    <button type="button" data-pinball-reset>Reiniciar</button>
                    <dl>
                        <dt>Puntos</dt><dd data-pinball-score>0</dd>
                        <dt>Bolas</dt><dd data-pinball-balls>3</dd>
                        <dt>Control</dt><dd>Flechas o A/D + Espacio</dd>
                    </dl>
                </aside>
                <main class="xp-pinball-table-wrap">
                    <canvas width="520" height="700" data-pinball-canvas></canvas>
                </main>
            </div>
        `;

        return this._createSingleInstanceWindow({
            id: 'pinball',
            title: 'Pinball XP Lab',
            icon: './images/icons/pinball.png',
            content,
            width: 820,
            height: 650,
            onReady: (appWindow) => {
                this._loadScriptOnce('js/pinball.js', 'initPinballApp')
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
    
    async _openMinesweeper() {
        // Prevenir que se abra más de una ventana de Buscaminas
        if (this.runningApps.has('minesweeper')) {
            console.log('Minesweeper is already running');
            if (this.windowManager && this.windowManager.focusWindow) {
                this.windowManager.focusWindow('minesweeper');
            }
            return;
        }
        
        try {
            // Verificar que WindowManager esté disponible
            if (!this.windowManager) {
                throw new Error('WindowManager no está disponible');
            }
            
            // Cargar el contenido del buscaminas
            console.log('Loading minesweeper.html...');
            const response = await fetch('./minesweeper.html');
            if (!response.ok) {
                throw new Error(`Error al cargar minesweeper.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();
            
            // Crear la ventana usando el WindowManager
            const minesweeperWindow = this.windowManager.createWindow({
                id: 'minesweeper',
                title: 'Buscaminas',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Minesweeper.png',
                content: htmlContent,
                width: 330,
                height: 430,
                resizable: true,
                maximizable: false
            });
            
            // Cargar dinámicamente el script del buscaminas
            setTimeout(() => {
                const windowElement = document.querySelector('[data-window-id="minesweeper"]');
                if (windowElement) {
                    // Verificar si ya se ha cargado el script
                    if (!document.querySelector('script[src="js/minesweeper.js"]')) {
                        const script = document.createElement('script');
                        script.src = 'js/minesweeper.js';
                        script.type = 'text/javascript';
                        
                        script.onload = () => {
                            console.log('Minesweeper script loaded, initializing game...');
                            if (typeof initMinesweeperGame === 'function') {
                                try {
                                    initMinesweeperGame(windowElement);
                                    console.log('Minesweeper game initialized successfully');
                                } catch (error) {
                                    console.error('Error initializing minesweeper game:', error);
                                }
                            }
                        };
                        
                        script.onerror = (error) => {
                            console.error('Error loading minesweeper script:', error);
                        };
                        
                        document.head.appendChild(script);
                    } else {
                        console.log('Minesweeper script already loaded, initializing game...');
                        if (typeof initMinesweeperGame === 'function') {
                            try {
                                initMinesweeperGame(windowElement);
                                console.log('Minesweeper game initialized successfully');
                            } catch (error) {
                                console.error('Error initializing minesweeper game:', error);
                            }
                        }
                    }
                } else {
                    console.log('Minesweeper window element not found');
                }
            }, 300);
            
            // Configurar observer para detectar cuando se cierra la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node.dataset && node.dataset.windowId === 'minesweeper') {
                                console.log('Minesweeper window closed');
                                if (typeof destroyMinesweeperGame === 'function') {
                                    destroyMinesweeperGame(node);
                                }
                                this.closeApp('minesweeper');
                                observer.disconnect();
                            }
                        });
                    }
                });
            });
            
            // Observar cambios en el contenedor de ventanas
            if (minesweeperWindow.parentNode) {
                observer.observe(minesweeperWindow.parentNode, { childList: true });
            }
            
            // Marcar como aplicación en ejecución
            this.runningApps.set('minesweeper', 'minesweeper');
            
            console.log('Minesweeper window created successfully');
            return minesweeperWindow;
            
        } catch (error) {
            console.error('Error al abrir Buscaminas:', error);
            this.showError(`Error al abrir Buscaminas: ${error.message}`);
        }
    }

    async _openPaint() {
        // Prevenir que se abra más de una ventana de Paint
        if (this.runningApps.has('paint')) {
            console.log('Paint is already running');
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
            console.log('Loading paint.html...');
            const response = await fetch('./paint.html');
            if (!response.ok) {
                throw new Error(`Error al cargar paint.html: ${response.statusText} (${response.status})`);
            }
            const htmlContent = await response.text();
            
            // Crear la ventana usando el WindowManager
            const paintWindow = this.windowManager.createWindow({
                id: 'paint',
                title: 'Paint',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Paint.png',
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
                            console.log('Paint script loaded, initializing app...');
                            if (typeof initPaintApp === 'function') {
                                try {
                                    initPaintApp(windowElement);
                                    console.log('Paint app initialized successfully');
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
                        console.log('Paint script already loaded, initializing app...');
                        if (typeof initPaintApp === 'function') {
                            try {
                                initPaintApp(windowElement);
                                console.log('Paint app initialized successfully');
                            } catch (error) {
                                console.error('Error initializing paint app:', error);
                            }
                        }
                    }
                } else {
                    console.log('Paint window element not found');
                }
            }, 300);
            
            // Configurar observer para detectar cuando se cierra la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node.dataset && node.dataset.windowId === 'paint') {
                                console.log('Paint window closed');
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
            
            console.log('Paint window created successfully');
            return paintWindow;
            
        } catch (error) {
            console.error('Error al abrir Paint:', error);
            this.showError(`Error al abrir Paint: ${error.message}`);
        }
    }

    async _openResume() {
        // Prevenir que se abra más de una ventana de Resume
        if (this.runningApps.has('resume')) {
            console.log('Resume is already running');
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
                <div id="resume-viewer">
                    <div class="resume-toolbar">
                        <button class="toolbar-button" id="save-cv-btn">
                            <img src="./images/Windows XP High Resolution Icon Pack/Windows XP Icons/Save.png" alt="Guardar">
                            <span>Guardar</span>
                        </button>
                        <div class="toolbar-separator"></div>
                        <button class="toolbar-button" id="print-cv-btn">
                            <img src="./images/Windows XP High Resolution Icon Pack/Windows XP Icons/Print to file.png" alt="Imprimir">
                            <span>Imprimir</span>
                        </button>
                    </div>
                    <div class="resume-content">
                        <object class="resume-pdf" data="./Ivan_Zarate_CV.pdf#view=FitH" type="application/pdf">
                            <div class="resume-fallback">
                                <p>No se pudo mostrar el PDF en este navegador.</p>
                                <a href="./Ivan_Zarate_CV.pdf" target="_blank" rel="noopener">Abrir CV actualizado</a>
                            </div>
                        </object>
                    </div>
                </div>
                <style>
                    #resume-viewer {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
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
                    
                    .resume-content {
                        flex: 1;
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
                </style>
            `;

            // Crear la ventana usando el WindowManager
            const resumeWindow = this.windowManager.createWindow({
                id: 'resume',
                title: 'Mi Curriculum Vitae',
                icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Document Search.png',
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
            }, 100);

            // Configurar cleanup cuando se cierre la ventana
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.removedNodes.length > 0) {
                        mutation.removedNodes.forEach((node) => {
                            if (node === resumeWindow) {
                                console.log('Resume window removed, cleaning up...');
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

            console.log('Resume image viewer window created successfully');
            return resumeWindow;

        } catch (error) {
            console.error("No se pudo abrir el CV:", error);
            
            // Mostrar una ventana de error al usuario
            if (this.windowManager) {
                this.windowManager.createWindow({
                    id: 'error-resume',
                    title: 'Error',
                    icon: './images/Windows XP High Resolution Icon Pack/Windows XP Icons/Critical.png',
                    content: `
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; color: red; margin-bottom: 10px;">❌</div>
                            <div style="margin-bottom: 10px;"><strong>No se pudo cargar el CV</strong></div>
                            <div style="margin-bottom: 20px; color: #666;">${"$"}{error.message}</div>
                            <button onclick="this.closest('.window').remove()">Aceptar</button>
                        </div>
                    `,
                    width: 400,
                    height: 200,
                    resizable: false
                });
            } else {
                alert(`Error: No se pudo abrir el CV. ${"$"}{error.message}`);
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
            console.log('Cleaning up Buscaminas application');
            const minesweeperWindow = document.querySelector('[data-window-id="minesweeper"]');
            if (typeof destroyMinesweeperGame === 'function' && minesweeperWindow) {
                destroyMinesweeperGame(minesweeperWindow);
            }
        } else if (appId === 'paint') {
            console.log('Cleaning up Paint application');
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
            console.log('Cleaning up Mi PC application');
            // Aquí se puede añadir cleanup específico para Mi PC si es necesario
        } else if (appId === 'contact') {
            console.log('Cleaning up Contact application');
            // Limpiar cualquier event listener específico si es necesario
        }
        
        this.runningApps.delete(appId);
        console.log(`App ${appId} closed and removed from running apps`);
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
