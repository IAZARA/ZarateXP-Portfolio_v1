// Perfil profesional: rol, experiencia, casos, capacidades y formación. Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods({ initGitHubActivitySummary }) {
    return {
        _openRecruiterRoute() {
            const content = `
                <div class="xp-recruiter-route">
                    <aside class="xp-task-pane">
                        <section>
                            <h3>Perfil profesional</h3>
                            <p>Una vista ejecutiva de mi rol actual, experiencia verificable, casos, capacidades y formación.</p>
                        </section>
                        <section>
                            <h3>Accesos directos</h3>
                            <button type="button" data-route-app="resume">Abrir CV PDF</button>
                            <button type="button" data-route-app="certificates">Revisar certificados</button>
                            <button type="button" data-route-app="projects">Explorar proyectos</button>
                            <button type="button" data-route-app="github-activity">Ver actividad GitHub</button>
                        </section>
                        <section>
                            <h3>Rol actual</h3>
                            <p>AI Solution Architect en ACSYS, dentro de Business Engineering &amp; Innovation.</p>
                        </section>
                    </aside>
                    <main class="xp-fde-brief">
                        <header class="xp-fde-hero">
                            <div>
                                <span class="xp-fde-role">AI Solution Architect en ACSYS</span>
                                <h2>Del problema de negocio a una solución de IA.</h2>
                                <p>Trabajo en discovery, arquitectura, seguridad, PoC y handoff para convertir necesidades complejas en soluciones implementables y operables.</p>
                            </div>
                            <div class="xp-fde-identity">
                                <img class="xp-fde-portrait" src="images/foto-nuevo-usuario.jpeg" alt="Ivan Agustin Zarate" width="112" height="112">
                                <a class="xp-fde-company" href="https://www.acsyslatam.com/" target="_blank" rel="noopener" aria-label="Visitar el sitio oficial de ACSYS">
                                    <img src="assets/images/acsys-logo.svg" alt="ACSYS" width="133" height="48" data-acsys-logo="official">
                                </a>
                            </div>
                        </header>

                        <section class="xp-fde-section xp-fde-operating-model">
                            <h3>Cómo trabajo</h3>
                            <div class="xp-fde-flow" aria-label="Proceso de trabajo como AI Solution Architect">
                                <div><strong>Descubrir</strong><span>Entrevistas, contexto operativo y requerimientos.</span></div>
                                <div><strong>Diseñar</strong><span>Alcance, arquitectura, integraciones y trade-offs.</span></div>
                                <div><strong>Validar</strong><span>PoC, riesgos, seguridad y criterios de éxito.</span></div>
                                <div><strong>Acompañar</strong><span>Handoff, implementación, operación y mejora.</span></div>
                            </div>
                        </section>

                        <section class="xp-fde-section">
                            <h3>Experiencia profesional</h3>
                            <div class="xp-fde-timeline">
                                <article class="current">
                                    <time>2026 - Actualidad</time>
                                    <h4>AI Solution Architect</h4>
                                    <p>ACSYS, Business Engineering &amp; Innovation. Discovery, arquitectura de IA empresarial, RAG, identidad, seguridad, PoC y acompañamiento a preventa y delivery.</p>
                                </article>
                                <article>
                                    <time>2024 - 2026</time>
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
                                <article><h4>Discovery y arquitectura</h4><p>Problema, requerimientos, alcance, NFR, decisiones, riesgos, sizing y criterios de aceptación.</p></article>
                                <article><h4>IA empresarial y RAG</h4><p>LLM, recuperación con evidencia, agentes, evaluación, observabilidad, MLOps y modelos locales.</p></article>
                                <article><h4>Datos, identidad y seguridad</h4><p>ACL, privacidad, trazabilidad, auditoría y autorización antes de recuperar contexto.</p></article>
                                <article><h4>Implementación</h4><p>Java, Spring Boot, React, TypeScript, APIs, Git, Oracle, SQL y acompañamiento a producción.</p></article>
                            </div>
                        </section>

                        <section class="xp-fde-section xp-fde-github">
                            <div class="xp-fde-section-heading">
                                <div>
                                    <h3>Actividad técnica verificada</h3>
                                    <p>Contribuciones, días activos y constancia durante el último año, con actividad privada incluida sólo como conteos anónimos.</p>
                                </div>
                                <button type="button" data-route-app="github-activity">Abrir calendario</button>
                            </div>
                            <div class="xp-gh-summary" data-github-activity-summary role="status" aria-live="polite">
                                <div class="xp-gh-loading"><span aria-hidden="true"></span>Cargando actividad de GitHub...</div>
                            </div>
                        </section>

                        <section class="xp-fde-section xp-fde-credentials">
                            <div>
                                <h3>Formación</h3>
                                <p><strong>Analista de Sistemas</strong><br>Instituto Superior ORT Argentina, 2024-2026. Título obtenido.</p>
                                <p><strong>Licenciatura en Seguridad</strong><br>Orientación en Investigación Criminal, 2020-2025.</p>
                                <p><strong>Claude Academy / Anthropic</strong><br>Claude Code 101 y AI Capabilities and Limitations, 2026.</p>
                                <p><strong>Google AI Professional Certificate</strong><br>Certificación profesional de 7 cursos, 2026.</p>
                                <p><strong>Google Data Analytics</strong><br>Certificación profesional de 8 cursos, 2024.</p>
                                <p><strong>SAP Learning</strong><br>AI Fundamentals, Joule y SAP Sports One, 2026.</p>
                                <p><strong>Formación aplicada en ArcGIS</strong><br>6 cursos en flujos GIS, aplicaciones web, tableros, captura de datos y drones, 2025.</p>
                                <p><strong>Seguridad internacional</strong><br>ASIS International, 7 CPE, y taller especializado de UNODC.</p>
                                <button type="button" class="xp-fde-credential-link" data-route-app="certificates">Ver las 19 credenciales</button>
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
                            <div><strong>¿Querés conversar sobre una solución de IA concreta?</strong><span>Revisá mi experiencia y proyectos o escribime.</span></div>
                            <button type="button" data-route-app="contact">Contactar</button>
                        </footer>
                    </main>
                </div>
            `;

            let disposeGitHubSummary = () => {};
            return this._createSingleInstanceWindow({
                id: 'recruiter-route',
                title: 'Perfil profesional - Ivan Agustin Zarate',
                icon: './assets/images/classic-icons/profile.svg',
                content,
                width: 920,
                height: 650,
                onReady: (appWindow) => {
                    appWindow.querySelectorAll('[data-route-app]').forEach((button) => {
                        button.addEventListener('click', () => this.openApp(button.dataset.routeApp));
                    });
                    disposeGitHubSummary = initGitHubActivitySummary(appWindow.querySelector('[data-github-activity-summary]'));
                },
                onClose: () => disposeGitHubSummary()
            });
        },
    };
}
