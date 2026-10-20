// Visor del CV en PDF con selección de idioma. Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods({ debugLog }) {
    return {
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
                const cv = this._getCvAsset();
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
                                <img src="./assets/images/classic-icons/projects.svg" alt="Proyectos">
                                <span>Proyectos</span>
                            </button>
                            <button class="toolbar-button" id="resume-contact-btn" type="button">
                                <img src="./assets/images/classic-icons/contact.svg" alt="Contacto">
                                <span>Contacto</span>
                            </button>
                        </div>
                        <div class="resume-layout">
                            <aside class="resume-quick-pane">
                                <section>
                                    <h3>Ruta rápida</h3>
                                    <button type="button" data-resume-open="projects">Ver evidencia en proyectos</button>
                                    <button type="button" data-resume-open="api-center">Probar APIs en vivo</button>
                                    <button type="button" data-resume-open="n8n-flows">Ver ciclo SDLC + MLOps</button>
                                    <button type="button" data-resume-open="contact">Contactar</button>
                                </section>
                                <section>
                                    <h3>Lo que demuestra</h3>
                                    <p>Descubrimiento con usuarios, plataformas productivas, MLOps, datos críticos, integración, capacitación y mejora continua.</p>
                                </section>
                            </aside>
                            <div class="resume-content">
                                <object class="resume-pdf" data-localized-cv-object data="${cv.viewerUrl}" type="application/pdf">
                                    <div class="resume-fallback">
                                        <p>No se pudo mostrar el PDF en este navegador.</p>
                                        <a data-localized-cv-link href="${cv.url}" target="_blank" rel="noopener">Abrir CV actualizado</a>
                                    </div>
                                </object>
                            </div>
                        </div>
                        <div class="xp-statusbar"><span data-localized-cv-name data-no-i18n>${cv.fileName}</span><span>PDF actualizado dentro de ZarateXP</span></div>
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
                    icon: './assets/images/classic-icons/cv.svg',
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
                            const currentCv = this._getCvAsset();
                            link.href = currentCv.url;
                            link.download = currentCv.fileName;

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
                                <button type="button" data-window-close>Aceptar</button>
                            </div>
                        `,
                        width: 400,
                        height: 200,
                        autoHeight: true,
                        resizable: false
                    });
                } else {
                    alert(`Error: No se pudo abrir el CV. ${error.message}`);
                }
            }
        },
    };
}
