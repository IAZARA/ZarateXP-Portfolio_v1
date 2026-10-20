// Ventana "Sobre mí". Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods({ debugLog }) {
    return {
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
                            <span>Archivo</span>
                            <span>Edición</span>
                            <span>Ver</span>
                            <span>Herramientas</span>
                            <span>Ayuda</span>
                        </div>
                        <div class="about-me-container">
                            <header class="about-profile">
                                <img src="images/foto-nuevo-usuario.jpeg" alt="Retrato de Ivan Agustin Zarate" width="112" height="112" loading="eager" decoding="async" />
                                <div>
                                    <p class="about-kicker">AI Solution Architect en ACSYS</p>
                                    <h2>Conecto negocio, datos y tecnología.</h2>
                                    <p>Diseño soluciones empresariales de IA desde el discovery hasta una arquitectura segura, validable y lista para implementar.</p>
                                </div>
                            </header>
                            <div class="about-sections">
                                <article class="about-section">
                                    <div class="about-image">
                                        <img src="images/sobremi/fullstack-developer.webp" alt="Trabajo de descubrimiento y desarrollo de plataformas" width="136" height="136" loading="lazy" decoding="async" />
                                    </div>
                                    <div class="about-text">
                                        <h3>Arquitectura de soluciones de IA</h3>
                                        <p>En ACSYS traduzco necesidades de negocio en requerimientos, alcance, arquitectura, decisiones y criterios de aceptación. Conecto preventa, especialistas y delivery para que la solución conserve su propósito hasta la implementación.</p>
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
                                        <p><strong>Analista de Sistemas, ORT Argentina</strong> (título obtenido). Licenciatura en Seguridad con orientación en Investigación Criminal. Credenciales de Google y SAP Learning en IA, datos y soluciones empresariales, formación aplicada en ArcGIS y capacitación especializada de ASIS International y UNODC. Español nativo e inglés intermedio, con comprensión técnica y experiencia en reuniones con proveedores.</p>
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
                    icon: './assets/images/classic-icons/about.svg',
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
                        icon: './assets/images/classic-icons/about.svg',
                        content: `
                            <div style="padding: 20px; text-align: center;">
                                <img src="./assets/images/xp-small-icons/critical.png" alt="Error" width="48" height="48" style="margin-bottom: 10px;">
                                <div style="margin-bottom: 10px;"><strong>No se pudo cargar 'Sobre Mí'</strong></div>
                                <div style="margin-bottom: 20px; color: #666;">${this._escapeHtml(error.message)}</div>
                                <button type="button" data-window-close>OK</button>
                            </div>
                        `,
                        width: 400,
                        height: 200,
                        autoHeight: true,
                        resizable: false
                    });
                } else {
                    // Fallback si WindowManager no está disponible
                    alert(`Error: No se pudo abrir Sobre Mí. ${error.message}`);
                }
            }
        },
    };
}
