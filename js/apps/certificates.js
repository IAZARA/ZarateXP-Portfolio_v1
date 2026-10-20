// Explorador de certificados con filtros, vistas previas y verificación. Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods({ getCertificatesData }) {
    return {
        _openCertificates() {
            const certificates = getCertificatesData();
            const featuredCount = certificates.filter((certificate) => certificate.featured).length;
            const categoryCounts = certificates.reduce((counts, certificate) => {
                counts[certificate.category] = (counts[certificate.category] || 0) + 1;
                return counts;
            }, {});
            const safe = (value) => this._escapeHtml(value);
            const certificateItems = certificates.map((certificate, index) => `
                <button
                    type="button"
                    class="xp-certificate-item${index === 0 ? ' selected' : ''}"
                    role="option"
                    aria-selected="${index === 0 ? 'true' : 'false'}"
                    data-certificate-id="${safe(certificate.id)}"
                    data-certificate-category="${safe(certificate.category)}"
                    data-certificate-featured="${certificate.featured ? 'true' : 'false'}"
                >
                    <img src="${safe(certificate.preview)}" alt="" width="92" height="71" loading="lazy" decoding="async">
                    <span class="xp-certificate-item-copy">
                        <strong>${safe(certificate.title)}</strong>
                        <span>${safe(certificate.issuer)}</span>
                        <time datetime="${safe(certificate.dateTime)}">${safe(certificate.date)}</time>
                    </span>
                </button>
            `).join('');

            const content = `
                <div class="xp-certificates-app" data-certificates-root>
                    <div class="xp-explorer-menubar">
                        <span>Archivo</span><span>Edicion</span><span>Ver</span><span>Favoritos</span><span>Ayuda</span>
                    </div>
                    <div class="xp-certificates-toolbar" role="toolbar" aria-label="Filtrar certificados">
                        <div class="xp-certificate-filters">
                            <button type="button" class="active" data-certificate-filter="all" aria-pressed="true">Todos <span>${certificates.length}</span></button>
                            <button type="button" data-certificate-filter="featured" aria-pressed="false">Destacados <span>${featuredCount}</span></button>
                            <button type="button" data-certificate-filter="ai-data" aria-pressed="false">IA, Datos y Dev <span>${categoryCounts['ai-data'] || 0}</span></button>
                            <button type="button" data-certificate-filter="management" aria-pressed="false">Gestión <span>${categoryCounts.management || 0}</span></button>
                            <button type="button" data-certificate-filter="gis" aria-pressed="false">GIS <span>${categoryCounts.gis || 0}</span></button>
                            <button type="button" data-certificate-filter="security" aria-pressed="false">Seguridad <span>${categoryCounts.security || 0}</span></button>
                        </div>
                        <strong>${certificates.length} credenciales verificadas</strong>
                    </div>
                    <div class="xp-certificates-layout">
                        <aside class="xp-certificates-index">
                            <header>
                                <img src="./assets/images/classic-icons/certificates.svg" alt="" width="48" height="48">
                                <div>
                                    <h2>Mis Certificados</h2>
                                    <p>Evidencia de aprendizaje aplicado en IA, desarrollo, datos, gestión, tecnologías geoespaciales y seguridad.</p>
                                </div>
                            </header>
                            <div class="xp-certificate-list" role="listbox" aria-label="Certificados disponibles" tabindex="0">
                                ${certificateItems}
                            </div>
                        </aside>
                        <main class="xp-certificate-detail" data-certificate-detail>
                            <figure class="xp-certificate-preview">
                                <img data-certificate-preview src="" alt="" width="792" height="612" decoding="async">
                                <figcaption data-certificate-document></figcaption>
                            </figure>
                            <article>
                                <span class="xp-certificate-category" data-certificate-category-label></span>
                                <h2 data-certificate-title></h2>
                                <p class="xp-certificate-issuer"><strong data-certificate-issuer></strong><time data-certificate-date></time></p>
                                <p class="xp-certificate-type" data-certificate-type></p>
                                <p class="xp-certificate-summary" data-certificate-summary></p>
                                <div class="xp-certificate-skills" data-certificate-skills aria-label="Competencias acreditadas"></div>
                                <div class="xp-certificate-actions">
                                    <a data-certificate-source href="#" target="_blank" rel="noopener">Ver documento original</a>
                                    <a data-certificate-verification href="#" target="_blank" rel="noopener">Verificar en Coursera</a>
                                    <a data-certificate-download href="#" download>Descargar evidencia</a>
                                </div>
                            </article>
                        </main>
                    </div>
                    <div class="xp-certificates-status" role="status" aria-live="polite">
                        <span data-certificate-status>Seleccioná una credencial para ver su evidencia.</span>
                        <span>LangChain Academy, NVIDIA, Credly, Simplilearn, Claude Academy, Anthropic, Google, Coursera, SAP Learning, Esri, ASIS y UNODC</span>
                    </div>
                </div>
            `;

            return this._createSingleInstanceWindow({
                id: 'certificates',
                title: 'Mis Certificados - Ivan Agustin Zarate',
                icon: './assets/images/classic-icons/certificates.svg',
                content,
                width: 980,
                height: 650,
                onReady: (appWindow) => {
                    const root = appWindow.querySelector('[data-certificates-root]');
                    const detail = root?.querySelector('[data-certificate-detail]');
                    const list = root?.querySelector('.xp-certificate-list');
                    if (!root || !detail || !list) return;

                    const byId = new Map(certificates.map((certificate) => [certificate.id, certificate]));
                    const categoryLabels = {
                        'ai-data': 'IA, Datos y Desarrollo',
                        management: 'Gestión de proyectos',
                        gis: 'GIS y tecnología geoespacial',
                        security: 'Seguridad y formación especializada'
                    };
                    let selectedId = certificates[0]?.id || '';

                    const selectCertificate = (id, { focus = false } = {}) => {
                        const certificate = byId.get(id);
                        if (!certificate) return;
                        selectedId = id;

                        list.querySelectorAll('[data-certificate-id]').forEach((item) => {
                            const selected = item.dataset.certificateId === id;
                            item.classList.toggle('selected', selected);
                            item.setAttribute('aria-selected', String(selected));
                            if (selected && focus) item.focus({ preventScroll: true });
                        });

                        const preview = detail.querySelector('[data-certificate-preview]');
                        preview.src = certificate.preview;
                        preview.alt = `Vista previa del certificado ${certificate.title}`;
                        detail.querySelector('[data-certificate-document]').textContent = certificate.documentLabel;
                        detail.querySelector('[data-certificate-category-label]').textContent = categoryLabels[certificate.category] || certificate.category;
                        detail.querySelector('[data-certificate-title]').textContent = certificate.title;
                        detail.querySelector('[data-certificate-issuer]').textContent = certificate.issuer;
                        const date = detail.querySelector('[data-certificate-date]');
                        date.textContent = certificate.date;
                        date.setAttribute('datetime', certificate.dateTime);
                        detail.querySelector('[data-certificate-type]').textContent = certificate.credential;
                        detail.querySelector('[data-certificate-summary]').textContent = certificate.summary;
                        detail.querySelector('[data-certificate-skills]').innerHTML = certificate.skills
                            .map((skill) => `<span>${safe(skill)}</span>`)
                            .join('');

                        const sourceLink = detail.querySelector('[data-certificate-source]');
                        sourceLink.href = certificate.source;
                        const downloadLink = detail.querySelector('[data-certificate-download]');
                        downloadLink.href = certificate.download || certificate.source.split('#')[0];
                        const verificationLink = detail.querySelector('[data-certificate-verification]');
                        if (certificate.verification) {
                            verificationLink.href = certificate.verification;
                            verificationLink.textContent = certificate.verificationLabel || 'Verificar en Coursera';
                            verificationLink.hidden = false;
                        } else {
                            verificationLink.hidden = true;
                            verificationLink.removeAttribute('href');
                        }

                        root.querySelector('[data-certificate-status]').textContent = `${certificate.title} seleccionado. Documento listo para abrir.`;
                        detail.classList.remove('is-updating');
                        void detail.offsetWidth;
                        detail.classList.add('is-updating');
                        window.zarateXP?.i18nManager?.localizeSubtree(detail);
                    };

                    const visibleItems = () => Array.from(list.querySelectorAll('[data-certificate-id]'))
                        .filter((item) => !item.hidden);

                    list.addEventListener('click', (event) => {
                        const item = event.target.closest('[data-certificate-id]');
                        if (item) selectCertificate(item.dataset.certificateId);
                    });

                    list.addEventListener('keydown', (event) => {
                        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                        const items = visibleItems();
                        if (!items.length) return;
                        event.preventDefault();
                        const currentIndex = Math.max(0, items.findIndex((item) => item.dataset.certificateId === selectedId));
                        const nextIndex = event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                                ? items.length - 1
                                : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                        selectCertificate(items[nextIndex].dataset.certificateId, { focus: true });
                    });

                    root.querySelectorAll('[data-certificate-filter]').forEach((button) => {
                        button.addEventListener('click', () => {
                            const filter = button.dataset.certificateFilter;
                            root.querySelectorAll('[data-certificate-filter]').forEach((candidate) => {
                                const active = candidate === button;
                                candidate.classList.toggle('active', active);
                                candidate.setAttribute('aria-pressed', String(active));
                            });
                            list.querySelectorAll('[data-certificate-id]').forEach((item) => {
                                item.hidden = filter !== 'all'
                                    && (filter === 'featured'
                                        ? item.dataset.certificateFeatured !== 'true'
                                        : item.dataset.certificateCategory !== filter);
                            });
                            const selectedItem = list.querySelector(`[data-certificate-id="${selectedId}"]`);
                            if (selectedItem?.hidden) {
                                const firstVisible = visibleItems()[0];
                                if (firstVisible) selectCertificate(firstVisible.dataset.certificateId);
                            }
                        });
                    });

                    selectCertificate(selectedId);
                }
            });
        },
    };
}
