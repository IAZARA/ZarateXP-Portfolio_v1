(function () {
    const STAGES = [
        {
            id: 'discovery',
            title: 'Definir problema',
            summary: 'Alinear una necesidad operativa con valor, riesgo y criterios de aceptación observables.',
            objective: 'Decidir qué problema vale la pena resolver y cómo reconocer una entrega útil.',
            input: 'Issue, contexto de usuarios y restricciones operativas.',
            orchestration: 'n8n recibe el issue, valida campos y crea un run trazable.',
            gate: 'Criterios de aceptación, riesgo y estrategia de rollback acordados.',
            evidence: 'Brief técnico, responsables y definición de terminado.',
            owner: 'Producto + ingeniería + usuario operativo',
            log: 'Issue validado. Se registran alcance, riesgo y criterios de aceptación.'
        },
        {
            id: 'versioning',
            title: 'Fijar versiones',
            summary: 'Vincular código, datos, configuración y dependencias a una misma entrega reproducible.',
            objective: 'Poder reconstruir qué cambió, quién lo aprobó y con qué insumos se ejecutó.',
            input: 'Repositorio, contrato de datos, configuración y dependencias.',
            orchestration: 'n8n reacciona al pull request y propaga commit y versión de dataset.',
            gate: 'Rama protegida, revisión y referencias de datos válidas.',
            evidence: 'Commit, dataset version y manifiesto de configuración.',
            owner: 'Ingeniería de software + datos',
            log: 'Commit, dataset y configuración quedan asociados al mismo run.'
        },
        {
            id: 'data',
            title: 'Preparar datos',
            summary: 'Validar contrato, calidad, lineage y tratamiento seguro antes de construir.',
            objective: 'Evitar que datos rotos o no autorizados lleguen al entrenamiento o a producción.',
            input: 'Dataset versionado y reglas de negocio.',
            orchestration: 'n8n dispara el job de data quality y espera su resultado.',
            gate: 'Schema, completitud, duplicados, permisos y lineage conformes.',
            evidence: 'Reporte de calidad y snapshot identificable.',
            owner: 'Data engineering + seguridad',
            log: 'El job de datos confirma contrato, calidad y lineage.'
        },
        {
            id: 'build',
            title: 'CI + entrenamiento',
            summary: 'Construir software probado y ejecutar un experimento que pueda repetirse.',
            objective: 'Generar un candidato desde código y datos conocidos, sin pasos manuales ocultos.',
            input: 'Commit aprobado, snapshot de datos y parámetros declarados.',
            orchestration: 'n8n invoca CI y training por API; los runners especializados ejecutan los jobs.',
            gate: 'Tests unitarios, integración, seguridad y ejecución reproducible aprobados.',
            evidence: 'Build, run de experimento, parámetros y lineage del candidato.',
            owner: 'Software engineering + ML engineering',
            log: 'CI completa tests y el runner registra un candidato reproducible.'
        },
        {
            id: 'validate',
            title: 'Evaluar candidato',
            summary: 'Comparar calidad técnica y utilidad de negocio antes de aceptar un cambio.',
            objective: 'Impedir que una mejora aislada degrade seguridad, segmentos o comportamiento esperado.',
            input: 'Candidato, baseline y conjunto de evaluación.',
            orchestration: 'n8n reúne resultados automáticos y prepara la revisión humana.',
            gate: 'Baseline, robustez, sesgo, seguridad y aceptación de negocio conformes.',
            evidence: 'Informe de evaluación y decisión explicable.',
            owner: 'ML engineering + dominio + riesgo',
            log: 'Evaluación técnica y de negocio supera los criterios definidos.'
        },
        {
            id: 'registry',
            title: 'Registrar artefacto',
            summary: 'Inmovilizar el candidato, su procedencia y la decisión de liberarlo.',
            objective: 'Separar un experimento prometedor de un artefacto autorizado para producción.',
            input: 'Candidato validado e informe de evaluación.',
            orchestration: 'n8n registra el artefacto y pausa el workflow para aprobación humana.',
            gate: 'Aprobación explícita con owner, evidencia y rollback identificado.',
            evidence: 'Versión de registry, firma de aprobación y artefacto inmutable.',
            owner: 'Release owner + ingeniería',
            log: 'Artefacto registrado. El workflow queda a la espera de aprobación humana.'
        },
        {
            id: 'deploy',
            title: 'Desplegar seguro',
            summary: 'Liberar de forma progresiva, comprobar salud y conservar una salida reversible.',
            objective: 'Reducir el impacto de una falla y volver a la versión estable sin improvisar.',
            input: 'Artefacto aprobado, configuración y plan de rollout.',
            orchestration: 'n8n dispara CD, espera smoke tests y notifica el resultado.',
            gate: 'Canary saludable, smoke tests aprobados y rollback disponible.',
            evidence: 'Release, resultado del despliegue y versión previa recuperable.',
            owner: 'Platform engineering + release owner',
            log: 'Despliegue progresivo saludable. Smoke tests y rollback quedan registrados.'
        },
        {
            id: 'monitor',
            title: 'Observar y aprender',
            summary: 'Conectar señales técnicas, calidad de datos y feedback con el próximo cambio.',
            objective: 'Detectar degradación, explicar incidentes y alimentar una mejora controlada.',
            input: 'Logs, trazas, errores, calidad de datos, drift y feedback operativo.',
            orchestration: 'n8n recibe alertas, crea el incidente y activa el circuito de respuesta.',
            gate: 'Alertas accionables, owner definido, runbook y umbrales revisables.',
            evidence: 'Incidente, decisión de rollback o nuevo issue de reentrenamiento.',
            owner: 'Operaciones + ML engineering + producto',
            log: 'Observabilidad activa. Producción alimenta el bucle de mejora.'
        }
    ];

    const STATE_LABELS = {
        idle: 'Pendiente',
        running: 'En curso',
        waiting: 'Espera aprobación',
        done: 'Validado',
        warning: 'Drift detectado',
        error: 'Requiere atención'
    };

    class MLOpsLifecycleApp {
        constructor(root) {
            if (!root) throw new Error('No se encontró el contenedor del pipeline MLOps');

            this.root = root;
            this.stageButtons = Array.from(root.querySelectorAll('[data-mlops-stage]'));
            this.runButton = root.querySelector('[data-mlops-run]');
            this.approveButton = root.querySelector('[data-mlops-approve]');
            this.driftButton = root.querySelector('[data-mlops-drift]');
            this.resetButton = root.querySelector('[data-mlops-reset]');
            this.progress = root.querySelector('[data-mlops-progress]');
            this.progressLabel = root.querySelector('[data-mlops-progress-label]');
            this.status = root.querySelector('[data-mlops-status]');
            this.log = root.querySelector('[data-mlops-log]');
            this.feedback = root.querySelector('[data-mlops-feedback]');
            this.eventController = new AbortController();
            this.pendingDelays = new Map();
            this.generation = 0;
            this.eventNumber = 0;
            this.selectedIndex = 0;
            this.completedCount = 0;
            this.currentIndex = -1;
            this.running = false;
            this.destroyed = false;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return this;
            if (this.stageButtons.length !== STAGES.length) {
                throw new Error(`Se esperaban ${STAGES.length} etapas y se encontraron ${this.stageButtons.length}`);
            }

            this.initialized = true;
            this.root.__mlopsLifecycleApp = this;
            this.setupAccessibility();
            this.bindControls();
            this.reset({ announce: false });
            return this;
        }

        setupAccessibility() {
            this.stageButtons.forEach((button, index) => {
                const stage = STAGES[index];
                button.setAttribute('aria-label', `Etapa ${index + 1} de ${STAGES.length}: ${stage.title}. ${stage.summary}`);
                button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
            });

            this.root.setAttribute('aria-busy', 'false');
            this.progress.setAttribute('aria-valuemin', '0');
            this.progress.setAttribute('aria-valuemax', '100');
        }

        bindControls() {
            const signal = this.eventController.signal;

            this.runButton.addEventListener('click', () => {
                this.run().catch((error) => this.fail(error));
            }, { signal });
            this.approveButton.addEventListener('click', () => {
                this.approveRelease().catch((error) => this.fail(error));
            }, { signal });
            this.driftButton.addEventListener('click', () => this.simulateDrift(), { signal });
            this.resetButton.addEventListener('click', () => this.reset(), { signal });

            this.stageButtons.forEach((button, index) => {
                button.addEventListener('click', () => this.selectStage(index), { signal });
                button.addEventListener('keydown', (event) => this.handleStageKeydown(event, index), { signal });
            });
        }

        handleStageKeydown(event, index) {
            const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();

            let nextIndex = index;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % STAGES.length;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + STAGES.length) % STAGES.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = STAGES.length - 1;

            this.selectStage(nextIndex, { focus: true });
        }

        selectStage(index, { focus = false, reveal = false } = {}) {
            const safeIndex = Math.max(0, Math.min(index, STAGES.length - 1));
            this.selectedIndex = safeIndex;
            this.stageButtons.forEach((button, buttonIndex) => {
                button.setAttribute('aria-pressed', buttonIndex === safeIndex ? 'true' : 'false');
            });
            this.renderInspector(STAGES[safeIndex]);
            if (reveal) this.revealStage(safeIndex);
            if (focus) this.stageButtons[safeIndex].focus();
        }

        revealStage(index) {
            const scroller = this.root.querySelector('.xp-mlops-flow-scroll');
            const button = this.stageButtons[index];
            if (!scroller || !button || scroller.scrollWidth <= scroller.clientWidth + 1) return;

            const scrollerRect = scroller.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            const currentCenter = buttonRect.left + (buttonRect.width / 2);
            const viewportCenter = scrollerRect.left + (scrollerRect.width / 2);
            const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const target = Math.max(0, Math.min(maxScroll, scroller.scrollLeft + currentCenter - viewportCenter));
            scroller.scrollTo({
                left: target,
                behavior: this.prefersReducedMotion() ? 'auto' : 'smooth'
            });
        }

        renderInspector(stage) {
            const fields = {
                '[data-mlops-detail-title]': stage.title,
                '[data-mlops-detail-summary]': stage.summary,
                '[data-mlops-detail-objective]': stage.objective,
                '[data-mlops-detail-input]': stage.input,
                '[data-mlops-detail-orchestration]': stage.orchestration,
                '[data-mlops-detail-gate]': stage.gate,
                '[data-mlops-detail-evidence]': stage.evidence,
                '[data-mlops-detail-owner]': stage.owner
            };

            Object.entries(fields).forEach(([selector, value]) => {
                const field = this.root.querySelector(selector);
                if (field) field.textContent = value;
            });
        }

        async run() {
            if (this.destroyed || this.running || this.root.dataset.state === 'awaiting_approval') return;

            if (this.root.dataset.state === 'completed') this.reset({ announce: false });
            const retraining = this.root.dataset.state === 'drift_detected';
            if (retraining) this.prepareRetraining();

            this.running = true;
            this.setRootState('running');
            this.updateControls();
            const generation = this.generation;
            const startIndex = retraining ? 2 : Math.max(0, this.completedCount);

            if (retraining) {
                this.addLog('Se abre un nuevo ciclo desde datos, conservando el contexto del incidente.', 'warning');
            } else {
                this.addLog('n8n crea el run y comienza a coordinar las etapas.', 'info');
            }

            for (let index = startIndex; index <= 5; index += 1) {
                const completed = await this.executeStage(index, generation);
                if (!completed) return;

                if (index === 5) {
                    this.setStageState(index, 'waiting');
                    this.completedCount = 5;
                    this.setProgress(this.completedCount);
                    this.running = false;
                    this.setRootState('awaiting_approval');
                    this.setStatus('Quality gate listo. La release espera una decisión humana.');
                    this.addLog(STAGES[index].log, 'waiting');
                    this.updateControls();
                    this.approveButton.focus({ preventScroll: true });
                    return;
                }
            }
        }

        async executeStage(index, generation) {
            if (this.destroyed || generation !== this.generation) return false;
            const stage = STAGES[index];
            this.currentIndex = index;
            this.selectStage(index, { reveal: true });
            this.setStageState(index, 'running');
            this.stageButtons[index].setAttribute('aria-current', 'step');
            this.setStatus(`${stage.title}: ${stage.summary}`);
            this.addLog(stage.log, 'running');

            const continued = await this.delay(this.prefersReducedMotion() ? 45 : 420, generation);
            this.stageButtons[index].removeAttribute('aria-current');
            if (!continued) return false;

            if (index !== 5) {
                this.setStageState(index, 'done');
                this.completedCount = Math.max(this.completedCount, index + 1);
                this.setProgress(this.completedCount);
            }
            return true;
        }

        async approveRelease() {
            if (this.destroyed || this.running || this.root.dataset.state !== 'awaiting_approval') return;

            this.running = true;
            this.setStageState(5, 'done');
            this.completedCount = 6;
            this.setProgress(this.completedCount);
            this.setRootState('deploying');
            this.setStatus('Release aprobada. n8n entrega el control al pipeline de despliegue.');
            this.addLog('Aprobación registrada con evidencia y estrategia de rollback.', 'done');
            this.updateControls();

            const generation = this.generation;
            for (let index = 6; index < STAGES.length; index += 1) {
                this.setRootState(index === 6 ? 'deploying' : 'monitoring');
                const completed = await this.executeStage(index, generation);
                if (!completed) return;
            }

            this.running = false;
            this.currentIndex = -1;
            this.setRootState('completed');
            this.setProgress(STAGES.length);
            this.setStatus('Ciclo completado. Release trazable, observable y preparada para rollback.');
            this.addLog('Ciclo completado. La observabilidad mantiene abierto el bucle de mejora.', 'done');
            this.updateControls();
        }

        simulateDrift() {
            if (this.destroyed || this.root.dataset.state !== 'completed') return;

            this.cancelPendingDelays();
            this.running = false;
            this.setRootState('drift_detected');
            this.setStageState(7, 'warning');
            this.selectStage(7, { reveal: true });
            this.feedback.classList.add('active');
            this.setStatus('Drift detectado. Se abre un incidente y se evalúa rollback o reentrenamiento.');
            this.addLog('Alerta de drift: n8n crea el incidente, notifica al owner y enlaza el runbook.', 'warning');
            this.addLog('La versión estable permanece disponible mientras se decide rollback o nuevo candidato.', 'warning');
            this.updateControls();
        }

        prepareRetraining() {
            this.cancelPendingDelays();
            this.feedback.classList.remove('active');
            this.stageButtons.forEach((button, index) => this.setStageState(index, index < 2 ? 'done' : 'idle'));
            this.completedCount = 2;
            this.currentIndex = -1;
            this.setProgress(this.completedCount);
        }

        reset({ announce = true } = {}) {
            if (this.destroyed) return;

            this.cancelPendingDelays();
            this.running = false;
            this.completedCount = 0;
            this.currentIndex = -1;
            this.eventNumber = 0;
            this.stageButtons.forEach((button) => {
                button.removeAttribute('aria-current');
                this.setStageState(this.stageButtons.indexOf(button), 'idle');
            });
            this.feedback.classList.remove('active');
            this.log.replaceChildren();
            this.setRootState('idle');
            this.setProgress(0);
            this.selectStage(0);
            this.setStatus(announce ? 'Ciclo reiniciado. No quedan ejecuciones pendientes.' : 'Listo para ejecutar el ciclo.');
            this.addLog('Caso cargado. Seleccioná una etapa o ejecutá el ciclo completo.', 'idle');
            this.updateControls();
        }

        setRootState(state) {
            this.root.dataset.state = state;
            this.root.setAttribute('aria-busy', this.running ? 'true' : 'false');
        }

        setStageState(index, state) {
            const button = this.stageButtons[index];
            if (!button) return;
            button.dataset.state = state;
            const label = button.querySelector('[data-mlops-node-state]');
            if (label) label.textContent = STATE_LABELS[state] || state;
        }

        setProgress(completedCount) {
            const safeCount = Math.max(0, Math.min(completedCount, STAGES.length));
            const value = Math.round((safeCount / STAGES.length) * 100);
            this.progress.value = value;
            this.progress.textContent = `${value}%`;
            this.progress.setAttribute('aria-valuenow', String(value));
            this.progressLabel.textContent = `${safeCount} de ${STAGES.length} etapas`;
        }

        setStatus(message) {
            this.status.textContent = message;
        }

        addLog(message, type = 'info') {
            this.eventNumber += 1;
            const item = document.createElement('li');
            item.dataset.logType = type;
            item.dataset.level = type;

            const eventId = document.createElement('span');
            eventId.className = 'xp-mlops-log-time';
            eventId.textContent = `#${String(this.eventNumber).padStart(2, '0')}`;
            const eventType = document.createElement('span');
            eventType.className = 'xp-mlops-log-stage';
            eventType.textContent = ({
                idle: 'READY',
                info: 'N8N',
                running: 'RUN',
                waiting: 'GATE',
                done: 'PASS',
                warning: 'ALERT',
                error: 'ERROR'
            })[type] || 'EVENT';
            const content = document.createElement('span');
            content.className = 'xp-mlops-log-message';
            content.textContent = message;
            item.append(eventId, eventType, content);
            this.log.appendChild(item);

            while (this.log.children.length > 7) this.log.firstElementChild?.remove();
            this.log.scrollTop = this.log.scrollHeight;
        }

        updateControls() {
            const state = this.root.dataset.state;
            this.runButton.disabled = this.running || state === 'awaiting_approval' || state === 'error';
            this.approveButton.disabled = state !== 'awaiting_approval';
            this.driftButton.disabled = state !== 'completed';

            if (state === 'drift_detected') this.runButton.textContent = '↻ Reentrenar desde datos';
            else if (state === 'completed') this.runButton.textContent = '↻ Ejecutar de nuevo';
            else this.runButton.textContent = '▶ Ejecutar ciclo';
        }

        prefersReducedMotion() {
            return document.body.classList.contains('xp-no-animations')
                || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        }

        delay(duration, generation) {
            return new Promise((resolve) => {
                const timeoutId = window.setTimeout(() => {
                    this.pendingDelays.delete(timeoutId);
                    resolve(!this.destroyed && generation === this.generation);
                }, duration);
                this.pendingDelays.set(timeoutId, resolve);
            });
        }

        cancelPendingDelays() {
            this.generation += 1;
            this.pendingDelays.forEach((resolve, timeoutId) => {
                window.clearTimeout(timeoutId);
                resolve(false);
            });
            this.pendingDelays.clear();
        }

        fail(error) {
            if (this.destroyed) return;
            this.cancelPendingDelays();
            this.running = false;
            this.setRootState('error');
            if (this.currentIndex >= 0) this.setStageState(this.currentIndex, 'error');
            this.setStatus('La simulación se detuvo. Reiniciá el ciclo para intentarlo otra vez.');
            this.addLog(`Error controlado: ${error?.message || 'causa no identificada'}.`, 'error');
            this.updateControls();
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.running = false;
            this.cancelPendingDelays();
            this.eventController.abort();
            this.root.setAttribute('aria-busy', 'false');
            this.root.dataset.state = 'cancelled';
            delete this.root.__mlopsLifecycleApp;
            this.initialized = false;
        }
    }

    window.initMLOpsLifecycleApp = function initMLOpsLifecycleApp(appWindow) {
        const root = appWindow?.querySelector?.('[data-mlops-root]') || appWindow;
        if (!root) throw new Error('No se pudo iniciar el pipeline MLOps');
        if (root.__mlopsLifecycleApp && !root.__mlopsLifecycleApp.destroyed) return root.__mlopsLifecycleApp;
        return new MLOpsLifecycleApp(root).init();
    };

    window.destroyMLOpsLifecycleApp = function destroyMLOpsLifecycleApp(appWindow) {
        const root = appWindow?.querySelector?.('[data-mlops-root]') || appWindow;
        root?.__mlopsLifecycleApp?.destroy();
    };
})();
