// Carpeta "Mis Documentos". Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods() {
    return {
        _openDocuments() {
            const iconBase = './assets/images/xp-small-icons';
            const cv = this._getCvAsset();
            const groups = [
                {
                    id: 'profile',
                    title: 'Perfil y credenciales',
                    items: [
                        { app: 'recruiter-route', title: 'Perfil profesional.lnk', description: 'Rol actual, experiencia, capacidades y contacto', icon: './assets/images/classic-icons/profile.svg', type: 'Acceso directo', important: true },
                        { app: 'resume', title: cv.fileName, description: 'CV actualizado', icon: './assets/images/classic-icons/cv.svg', type: 'Documento PDF', important: true, localizedCv: true },
                        { app: 'certificates', title: 'Certificados verificados', description: '19 credenciales en IA, datos, desarrollo, gestión, GIS y seguridad', icon: './assets/images/classic-icons/certificates.svg', type: 'Carpeta', important: true },
                        { app: 'about-me', title: 'Sobre mi perfil', description: 'AI Solution Architect en ACSYS', icon: './assets/images/classic-icons/about.svg', type: 'Documento' }
                    ]
                },
                {
                    id: 'solutions',
                    title: 'Proyectos y soluciones',
                    items: [
                        { app: 'projects', title: 'Proyectos destacados', description: 'CUFRE, SIFEBU, CRIACO, OSINTArgy y más', icon: './assets/images/classic-icons/projects.svg', type: 'Carpeta' },
                        { app: 'api-center', title: 'API Center.lnk', description: 'Clima, GitHub y datos públicos en vivo', icon: './assets/images/classic-icons/api.svg', type: 'Acceso directo', important: true },
                        { app: 'github-activity', title: 'Actividad GitHub.lnk', description: 'Actividad anual verificada del titular', icon: './assets/images/github.png', type: 'Acceso directo', important: true },
                        { app: 'n8n-flows', title: 'Flujos n8n', description: 'Orquestación, gates, drift y feedback', icon: './assets/images/classic-icons/n8n.svg', type: 'Aplicación' },
                        { app: 'pdf-studio', title: 'PDF Studio.exe', description: 'File API, Blob URL y anotaciones', icon: './assets/images/hd-icons/pdf-studio.svg', type: 'Aplicación' }
                    ]
                },
                {
                    id: 'utilities',
                    title: 'Utilidades y demos',
                    items: [
                        { app: 'notepad', title: 'Notas de entrevista.txt', description: 'Editable localmente', icon: './assets/images/classic-icons/notepad.svg', type: 'Documento de texto' },
                        { app: 'wordpad', title: 'Carta de presentación.rtf', description: 'Editor enriquecido', icon: './assets/images/classic-icons/wordpad.svg', type: 'Documento RTF' },
                        { app: 'solitaire', title: 'Solitario XP', description: 'Lógica Klondike propia', icon: './assets/images/hd-icons/solitaire.svg', type: 'Aplicación' },
                        { app: 'pinball', title: 'Pinball XP Lab', description: 'Canvas, física y teclado', icon: './assets/images/hd-icons/pinball.svg?v=20260712', type: 'Aplicación' }
                    ]
                }
            ];
            const viewPicker = `
                <div class="xp-view-picker" data-view-picker>
                    <button type="button" class="xp-view-trigger" aria-haspopup="menu" aria-expanded="false" data-view-trigger>
                        <img src="${iconBase}/detail-view.png" alt=""><span>Vistas</span><span class="xp-view-caret" aria-hidden="true">▾</span>
                    </button>
                    <div class="xp-view-menu" role="menu" aria-label="Vistas" hidden data-view-menu>
                        <button type="button" role="menuitemradio" aria-checked="false" data-view-choice="icons"><img src="./assets/images/classic-icons/documents.svg" alt=""><span>Iconos</span></button>
                        <button type="button" role="menuitemradio" aria-checked="false" data-view-choice="list"><img src="${iconBase}/detail-view.png" alt=""><span>Lista</span></button>
                        <button type="button" role="menuitemradio" aria-checked="false" data-view-choice="details"><img src="${iconBase}/detail-view.png" alt=""><span>Detalles</span></button>
                    </div>
                </div>
            `;
            const content = `
                <div class="xp-documents-app">
                    <div class="xp-explorer-menubar">
                        <span>Archivo</span><span>Edicion</span><span>Ver</span><span>Favoritos</span><span>Ayuda</span>
                    </div>
                    <div class="xp-explorer-toolbar">
                        <button type="button" data-doc-open="my-computer"><img src="${iconBase}/back.png" alt=""><span>Atrás</span></button>
                        <button type="button" data-doc-open="projects"><img src="${iconBase}/search.png" alt=""><span>Buscar proyectos</span></button>
                        <button type="button" data-doc-open="control-panel"><img src="${iconBase}/control-panel.png" alt=""><span>Configurar</span></button>
                        ${viewPicker}
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
                                <button type="button" data-doc-open="certificates">Abrir certificados verificados</button>
                                <button type="button" data-doc-open="recruiter-route">Abrir perfil profesional</button>
                                <button type="button" data-doc-open="pdf-studio">Revisar PDF con notas</button>
                                <button type="button" data-doc-open="projects">Ver proyectos web</button>
                                <button type="button" data-doc-open="api-center">Abrir API Center</button>
                                <button type="button" data-doc-open="github-activity">Ver actividad GitHub</button>
                                <button type="button" data-doc-open="n8n-flows">Ver ciclo SDLC + MLOps</button>
                            </section>
                            <section>
                                <h3>Detalles</h3>
                                <p>AI Solution Architect en ACSYS con foco en discovery, arquitectura de IA, seguridad, datos e implementación.</p>
                            </section>
                        </aside>
                        <main class="xp-folder-grid" aria-label="Mis Documentos" data-documents-content></main>
                    </div>
                </div>
            `;

            return this._createSingleInstanceWindow({
                id: 'documents',
                title: 'Mis Documentos',
                icon: './assets/images/classic-icons/documents.svg',
                content,
                width: 760,
                height: 520,
                onReady: (appWindow) => {
                    const contentRoot = appWindow.querySelector('[data-documents-content]');
                    const safe = (value) => this._escapeHtml(value);
                    const itemMarkup = (item, className) => `
                        <button type="button" class="${className}${item.important ? ' important' : ''}" data-doc-open="${safe(item.app)}">
                            <img src="${safe(item.icon)}" alt="">
                            <span class="xp-document-copy"><strong${item.localizedCv ? ' data-localized-cv-name data-no-i18n' : ''}>${safe(item.title)}</strong><small>${safe(item.description)}</small></span>
                            <span class="xp-document-type">${safe(item.type)}</span>
                        </button>
                    `;
                    const renderDocuments = (viewMode) => {
                        if (viewMode === 'details') {
                            contentRoot.innerHTML = `
                                <div class="xp-documents-details-scroll" tabindex="0" aria-label="Detalles de Mis Documentos">
                                    <div class="xp-documents-details" role="table">
                                        <div class="xp-documents-details-header" role="row"><span role="columnheader">Nombre</span><span role="columnheader">Tipo</span><span role="columnheader">Grupo</span><span role="columnheader">Descripción</span></div>
                                        ${groups.flatMap((group) => group.items.map((item) => `
                                            <button type="button" class="xp-documents-details-row${item.important ? ' important' : ''}" role="row" data-doc-open="${safe(item.app)}">
                                                <span role="cell" class="xp-documents-details-name"><img src="${safe(item.icon)}" alt=""><strong${item.localizedCv ? ' data-localized-cv-name data-no-i18n' : ''}>${safe(item.title)}</strong></span>
                                                <span role="cell">${safe(item.type)}</span><span role="cell">${safe(group.title)}</span><span role="cell">${safe(item.description)}</span>
                                            </button>
                                        `)).join('')}
                                    </div>
                                </div>
                            `;
                        } else {
                            const rowClass = viewMode === 'icons' ? 'xp-folder-item' : 'xp-document-list-row';
                            contentRoot.innerHTML = groups.map((group) => `
                                <section class="xp-folder-group" data-document-group="${safe(group.id)}" aria-labelledby="documents-${safe(group.id)}-heading">
                                    <h2 id="documents-${safe(group.id)}-heading" class="xp-folder-group-title">${safe(group.title)}</h2>
                                    <div class="${viewMode === 'icons' ? 'xp-folder-group-grid' : 'xp-document-list'}">${group.items.map((item) => itemMarkup(item, rowClass)).join('')}</div>
                                </section>
                            `).join('');
                        }
                        contentRoot.dataset.viewMode = viewMode;
                        this._syncLocalizedCvAssets(contentRoot);
                    };
                    const initialView = this._getPreferredExplorerView('zarateXP.documents.viewMode');
                    renderDocuments(initialView);
                    this._setupViewPicker(appWindow, initialView, (viewMode) => {
                        this._saveExplorerView('zarateXP.documents.viewMode', viewMode);
                        renderDocuments(viewMode);
                    });
                    appWindow.addEventListener('click', (event) => {
                        const item = event.target.closest('[data-doc-open]');
                        if (item) this.openApp(item.dataset.docOpen);
                    });
                }
            });
        },
    };
}
