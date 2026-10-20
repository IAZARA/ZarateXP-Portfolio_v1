// Caso interactivo SDLC + MLOps con n8n. Se carga bajo demanda la primera vez que se abre la ventana
// (ver AppManager._loadAppMethods en js/apps.js).
export default function createMethods() {
    return {
        _openN8nFlows() {
            const content = `
                <div class="xp-mlops-app" data-mlops-root data-state="idle" aria-busy="false" aria-labelledby="mlops-pipeline-title">
                    <header class="xp-mlops-toolbar">
                        <div class="xp-mlops-brand xp-mlops-toolbar-brand">
                            <img class="xp-mlops-logo" src="./assets/images/classic-icons/n8n.svg" alt="">
                            <div>
                                <span>CASO DEMOSTRATIVO · SDLC + MLOps</span>
                                <h2>Ciclo completo de entrega</h2>
                            </div>
                        </div>
                        <span class="xp-mlops-toolbar-copy">n8n coordina · los runners especializados ejecutan</span>
                        <div class="xp-mlops-actions" aria-label="Controles del ciclo">
                            <button type="button" class="primary" data-mlops-run>▶ Ejecutar ciclo</button>
                            <button type="button" data-mlops-approve disabled>✓ Aprobar release</button>
                            <button type="button" data-mlops-drift>⚠ Simular drift</button>
                            <button type="button" data-mlops-reset>↺ Reiniciar</button>
                        </div>
                    </header>

                    <aside class="xp-mlops-brief" aria-labelledby="mlops-brief-title">
                        <p class="xp-mlops-kicker xp-mlops-eyebrow">DEL PROBLEMA A PRODUCCIÓN</p>
                        <h3 class="xp-mlops-panel-title" id="mlops-brief-title">Clasificador asistido de tickets</h3>
                        <p>Una necesidad operativa se transforma en una solución versionada, validada, desplegada y observable.</p>
                        <div class="xp-mlops-orchestrator-note xp-mlops-brief-card">
                            <strong>Qué hace n8n</strong>
                            <p>Coordina eventos, APIs, jobs y decisiones humanas. El CI/CD, el entrenamiento, el registry y el serving se ejecutan en herramientas especializadas.</p>
                        </div>
                        <dl class="xp-mlops-facts">
                            <div><dt>Entrada</dt><dd>Issue + dataset versionado</dd></div>
                            <div><dt>Salida</dt><dd>Release trazable y reversible</dd></div>
                            <div><dt>Principio</dt><dd>Evidencia antes que promesas</dd></div>
                        </dl>
                    </aside>

                    <main class="xp-mlops-canvas" aria-labelledby="mlops-pipeline-title">
                        <div class="xp-mlops-canvas-heading xp-mlops-canvas-header">
                            <div>
                                <span>WORKFLOW / ORQUESTACIÓN</span>
                                <h3 class="xp-mlops-panel-title" id="mlops-pipeline-title">Pipeline SDLC + MLOps</h3>
                            </div>
                            <div class="xp-mlops-legend xp-mlops-phase-legend" aria-label="Leyenda de estados">
                                <span><i class="idle"></i>Pendiente</span>
                                <span><i class="running"></i>En curso</span>
                                <span><i class="done"></i>Validado</span>
                            </div>
                        </div>
                        <div class="xp-mlops-flow-scroll">
                        <ol class="xp-mlops-flow xp-mlops-pipeline" data-mlops-flow aria-label="Ocho etapas del ciclo de entrega">
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="discovery" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">01</b><em class="xp-mlops-stage-code">DESCUBRIR</em></span>
                                    <strong class="xp-mlops-stage-title">Definir problema</strong>
                                    <small class="xp-mlops-stage-summary">Valor, riesgo y aceptación</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="versioning" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">02</b><em class="xp-mlops-stage-code">VERSIONAR</em></span>
                                    <strong class="xp-mlops-stage-title">Fijar versiones</strong>
                                    <small class="xp-mlops-stage-summary">Código, datos y configuración</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="data" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">03</b><em class="xp-mlops-stage-code">DATOS</em></span>
                                    <strong class="xp-mlops-stage-title">Preparar datos</strong>
                                    <small class="xp-mlops-stage-summary">Contrato, calidad y lineage</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="build" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">04</b><em class="xp-mlops-stage-code">CONSTRUIR</em></span>
                                    <strong class="xp-mlops-stage-title">CI + entrenamiento</strong>
                                    <small class="xp-mlops-stage-summary">Tests y experimento reproducible</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="validate" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">05</b><em class="xp-mlops-stage-code">VALIDAR</em></span>
                                    <strong class="xp-mlops-stage-title">Evaluar candidato</strong>
                                    <small class="xp-mlops-stage-summary">Baseline, seguridad y negocio</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="registry" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">06</b><em class="xp-mlops-stage-code">APROBAR</em></span>
                                    <strong class="xp-mlops-stage-title">Registrar artefacto</strong>
                                    <small class="xp-mlops-stage-summary">Registry y decisión humana</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="deploy" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">07</b><em class="xp-mlops-stage-code">LIBERAR</em></span>
                                    <strong class="xp-mlops-stage-title">Desplegar seguro</strong>
                                    <small class="xp-mlops-stage-summary">Canary, smoke y rollback</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                            <li>
                                <button type="button" class="xp-mlops-stage" data-mlops-stage data-stage-id="monitor" data-state="idle">
                                    <span class="xp-mlops-node-top xp-mlops-stage-head"><b class="xp-mlops-stage-index">08</b><em class="xp-mlops-stage-code">OPERAR</em></span>
                                    <strong class="xp-mlops-stage-title">Observar y aprender</strong>
                                    <small class="xp-mlops-stage-summary">Drift, KPI y feedback</small>
                                    <span class="xp-mlops-node-status xp-mlops-stage-status" data-mlops-node-state>Pendiente</span>
                                </button>
                            </li>
                        </ol>
                        </div>
                        <div class="xp-mlops-feedback" data-mlops-feedback>
                            <strong>Bucle de mejora</strong>
                            <span>Producción devuelve incidentes, feedback y nuevos datos a Descubrir y Preparar datos.</span>
                        </div>
                    </main>

                    <aside class="xp-mlops-inspector" data-mlops-inspector aria-live="polite">
                        <div class="xp-mlops-inspector-head">
                            <span class="xp-mlops-inspector-label">INSPECTOR DE ETAPA</span>
                            <h3 class="xp-mlops-panel-title" data-mlops-detail-title>Definir problema</h3>
                            <p data-mlops-detail-summary>Seleccioná una etapa para revisar cómo se controla y qué evidencia produce.</p>
                        </div>
                        <dl>
                            <div class="xp-mlops-detail"><dt>Propósito</dt><dd data-mlops-detail-objective></dd></div>
                            <div class="xp-mlops-detail"><dt>Entrada</dt><dd data-mlops-detail-input></dd></div>
                            <div class="xp-mlops-detail"><dt>Orquestación</dt><dd data-mlops-detail-orchestration></dd></div>
                            <div class="xp-mlops-detail"><dt>Quality gate</dt><dd data-mlops-detail-gate></dd></div>
                            <div class="xp-mlops-detail"><dt>Evidencia</dt><dd data-mlops-detail-evidence></dd></div>
                            <div class="xp-mlops-detail"><dt>Responsable</dt><dd data-mlops-detail-owner></dd></div>
                        </dl>
                    </aside>

                    <section class="xp-mlops-log-panel" aria-labelledby="mlops-log-title">
                        <div class="xp-mlops-log-heading xp-mlops-log-head">
                            <h3 id="mlops-log-title">Registro de orquestación</h3>
                            <span>SIMULACIÓN LOCAL · SIN DATOS REALES</span>
                        </div>
                        <ol class="xp-mlops-log" data-mlops-log role="log" aria-live="polite" aria-relevant="additions"></ol>
                    </section>

                    <footer class="xp-mlops-statusbar">
                        <div class="xp-mlops-status">
                            <span class="xp-mlops-status-dot" aria-hidden="true"></span>
                            <span data-mlops-status role="status" aria-live="polite">Listo para ejecutar el ciclo.</span>
                        </div>
                        <label class="xp-mlops-progress-wrap">
                            <span class="xp-mlops-progress-value" data-mlops-progress-label>0 de 8 etapas</span>
                            <progress class="xp-mlops-progress" data-mlops-progress value="0" max="100" aria-label="Progreso del ciclo">0%</progress>
                        </label>
                    </footer>
                </div>
            `;

            return this._createSingleInstanceWindow({
                id: 'n8n-flows',
                title: 'n8n - Pipeline SDLC + MLOps',
                icon: './assets/images/classic-icons/n8n.svg',
                content,
                width: 1120,
                height: 690,
                onReady: (appWindow) => {
                    this._loadScriptOnce('js/n8n-mlops.js?v=zaratexp-20260712-mlops1', 'initMLOpsLifecycleApp')
                        .then(() => {
                            if (!appWindow.isConnected) return;
                            window.initMLOpsLifecycleApp?.(appWindow);
                        })
                        .catch((error) => {
                            if (appWindow.isConnected) this.showError(`No se pudo iniciar el pipeline MLOps: ${error.message}`);
                        });
                },
                onClose: (appWindow) => window.destroyMLOpsLifecycleApp?.(appWindow)
            });
        },
    };
}
