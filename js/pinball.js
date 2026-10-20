(function () {
    'use strict';

    const STORAGE_KEY = 'zarateXP.pinball.highScore';
    const SOUND_STORAGE_KEY = 'zarateXP.pinball.muted';
    const WIDTH = 520;
    const HEIGHT = 700;
    const PLUNGER_TRAVEL = 24;
    // Pasos chicos: a velocidad máxima la bola avanza menos de su radio por paso,
    // así no atraviesa paletas ni rails aunque el navegador renderice a 30 FPS.
    const FIXED_STEP = 1 / 360;
    const MAX_FRAME_DELTA = 0.05;
    const MAX_PHYSICS_STEPS = 24;
    const MAX_BALL_SPEED = 2000;
    const GRAVITY = 960;
    const AIR_DRAG = 0.08;
    const BALL_RADIUS = 9.5;
    const LAUNCH_BASE_SPEED = 700;
    const LAUNCH_POWER_SPEED = 1000;
    const LANE_X = 470;
    const LANE_MIN_X = 459;
    const LANE_MAX_X = 472;
    const LANE_EXIT_Y = 86;
    const LANE_ARC = { x: 408, y: 122, radius: 78, thickness: 9 };
    const LAUNCH_GATE = { a: { x: 482, y: 96 }, b: { x: 446, y: 108 } };
    // Paletas: giro a velocidad angular constante, como un solenoide real.
    const FLIPPER_LENGTH = 74;
    const FLIPPER_BASE_RADIUS = 11;
    const FLIPPER_TIP_RADIUS = 6;
    const FLIPPER_REST_ANGLE = 0.52;
    const FLIPPER_UP_ANGLE = -0.42;
    const FLIPPER_SWEEP = FLIPPER_REST_ANGLE - FLIPPER_UP_ANGLE;
    const FLIPPER_UP_RATE = 18 / FLIPPER_SWEEP;
    const FLIPPER_DOWN_RATE = 13 / FLIPPER_SWEEP;
    const FLIPPER_RESTITUTION = 0.38;
    const FLIPPER_PIVOTS = { left: { x: 178, y: 628 }, right: { x: 342, y: 628 } };
    const STUCK_SPEED = 28;
    const STUCK_SECONDS = 3;
    const KICK_JITTER = 0.07;
    const RANDOM_SEED = 0x5eed1;
    const BALL_SAVE_SECONDS = 7;
    const COMBO_SECONDS = 1.85;
    const EXTRA_BALL_SCORES = [100000, 400000, 1000000];
    const CONTROL_KEYS = new Set([
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown',
        'a',
        'd',
        'z',
        '/',
        'w',
        's',
        ' ',
        'spacebar',
        'p',
        'r',
        'm',
        'f'
    ]);

    let instanceId = 0;

    // Azar reproducible: cada partida arranca con la misma semilla, así la física
    // se puede verificar en pruebas y igual se rompen los rebotes periódicos.
    function createRandom(seed) {
        let state = seed >>> 0;
        return () => {
            state = (state + 0x6d2b79f5) >>> 0;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    class PinballApp {
        constructor(windowElement, rootElement = null) {
            this.windowElement = windowElement;
            this.root = rootElement
                || (windowElement.matches?.('[data-pinball-root]') ? windowElement : windowElement.querySelector?.('[data-pinball-root]'));
            if (!this.root) throw new Error('No se encontró el contenedor de Pinball');

            this.canvas = this.root.querySelector('[data-pinball-canvas]');
            this.ctx = this.canvas?.getContext?.('2d');
            if (!this.canvas || !this.ctx) throw new Error('Canvas de Pinball no disponible');

            this.instanceId = ++instanceId;
            this.tableWrap = this.canvas.closest('.xp-pinball-table-wrap') || this.root;
            this.scoreEl = this.root.querySelector('[data-pinball-score]');
            this.highScoreEl = this.root.querySelector('[data-pinball-highscore]');
            this.ballsEl = this.root.querySelector('[data-pinball-balls]');
            this.stateEl = this.root.querySelector('[data-pinball-state]');
            this.comboEl = this.root.querySelector('[data-pinball-combo]');
            this.levelEl = this.root.querySelector('[data-pinball-level]');
            this.multiplierEl = this.root.querySelector('[data-pinball-multiplier]');
            this.missionEl = this.root.querySelector('[data-pinball-mission]');
            this.chargeEl = this.root.querySelector('[data-pinball-charge]');
            this.startButton = this.root.querySelector('[data-pinball-start]');
            this.resetButton = this.root.querySelector('[data-pinball-reset]');
            this.pauseButton = this.root.querySelector('[data-pinball-pause]');
            this.soundButton = this.root.querySelector('[data-pinball-sound]');
            this.fullscreenButton = this.root.querySelector('[data-pinball-fullscreen]');
            this.leftButton = this.root.querySelector('[data-pinball-left]');
            this.rightButton = this.root.querySelector('[data-pinball-right]');
            this.plungerButton = this.root.querySelector('[data-pinball-plunger]');

            this.abortController = new AbortController();
            this.keys = new Set();
            this.pointerSources = {
                left: new Set(),
                right: new Set(),
                plunger: new Set()
            };
            this.canvasPointerControls = new Map();
            this.canvasPlungerDrag = null;
            this.score = 0;
            this.highScore = this.readStoredNumber(STORAGE_KEY);
            this.initialHighScore = this.highScore;
            this.highScoreDirty = false;
            this.highScoreSaveDelay = 0;
            this.newRecordAnnounced = false;
            this.muted = this.readStoredBoolean(SOUND_STORAGE_KEY);
            this.balls = 3;
            this.state = 'ready';
            this.resumeState = 'playing';
            this.charge = 0;
            this.chargeDirection = 1;
            this.plungerRecoil = 0;
            this.combo = 1;
            this.comboRemaining = 0;
            this.level = 1;
            this.playfieldBoost = 0;
            this.boostRemaining = 0;
            this.missionIndex = 0;
            this.missionProgress = 0;
            this.completedMissions = 0;
            this.extraBallsAwarded = new Set();
            this.targetResetTimer = 0;
            this.rolloverResetTimer = 0;
            this.spinnerChain = 0;
            this.tiltMeter = 0;
            this.tilted = false;
            this.resetArmedUntil = 0;
            this.ballAge = 0;
            this.ballSaveAvailable = false;
            this.ballSaveUsed = false;
            this.playerEngaged = false;
            this.stuckTime = 0;
            this.random = createRandom(RANDOM_SEED);
            this.launchPower = 0;
            this.skillShotPending = false;
            this.pendingAutoLaunch = null;
            this.flash = 0;
            this.shake = 0;
            this.particles = [];
            this.trail = [];
            this.effects = [];
            this.leftFlipper = 0;
            this.rightFlipper = 0;
            this.leftFlipperSpeed = 0;
            this.rightFlipperSpeed = 0;
            this.flipperWasPressed = { left: false, right: false };
            this.raf = null;
            this.lastTime = 0;
            this.accumulator = 0;
            this.destroyed = false;
            this.audio = null;
            this.windowObserver = null;
            this.resizeObserver = null;

            this.missions = [
                { id: 'targets', name: 'Derribá los 5 targets', goal: 5, reward: 3000 },
                { id: 'lanes', name: 'Encendé las 3 lanes XP', goal: 3, reward: 4500 },
                { id: 'spinner', name: 'Golpeá el spinner 6 veces', goal: 6, reward: 6000 }
            ];

            this.bumpers = [
                { x: 180, y: 210, r: 30, value: 500, color: '#4bd2ff', cooldown: 0 },
                { x: 260, y: 170, r: 33, value: 750, color: '#6df27c', cooldown: 0 },
                { x: 342, y: 210, r: 30, value: 500, color: '#9cff44', cooldown: 0 },
                { x: 155, y: 430, r: 22, value: 350, color: '#6df27c', cooldown: 0 },
                { x: 365, y: 430, r: 22, value: 350, color: '#57c8ff', cooldown: 0 }
            ];

            this.targets = [
                { x: 230, y: 312, r: 17, value: 300, active: true, cooldown: 0 },
                { x: 260, y: 360, r: 17, value: 300, active: true, cooldown: 0 },
                { x: 290, y: 408, r: 17, value: 300, active: true, cooldown: 0 },
                { x: 126, y: 488, r: 15, value: 450, active: true, cooldown: 0 },
                { x: 394, y: 488, r: 15, value: 450, active: true, cooldown: 0 }
            ];

            this.rollovers = [
                { x: 172, y: 92, r: 13, value: 250, active: true, inside: false, letter: 'X' },
                { x: 260, y: 92, r: 13, value: 250, active: true, inside: false, letter: 'P' },
                { x: 348, y: 92, r: 13, value: 250, active: true, inside: false, letter: '!' }
            ];

            this.laneArcSegments = this.arcSegments(LANE_ARC, 0, -Math.PI / 2, 9);
            this.launchGate = this.segment(LAUNCH_GATE.a.x, LAUNCH_GATE.a.y, LAUNCH_GATE.b.x, LAUNCH_GATE.b.y, 3, 0.35);
            this.staticSegments = [
                this.segment(36, 126, 96, 44, 9, 0.75),
                this.segment(96, 44, LANE_ARC.x, 44, 9, 0.75),
                ...this.laneArcSegments,
                this.segment(36, 126, 36, 530, 10, 0.72),
                this.segment(486, 122, 486, 642, 10, 0.72),
                // Inlanes: el riel termina pegado a la base de cada paleta y deja un
                // pasillo más ancho que la bola entre el riel y el slingshot.
                this.segment(36, 530, 175, 627, 9, 0.5),
                this.segment(442, 560, 345, 627, 9, 0.5),
                this.segment(52, 662, 198, 662, 12, 0.6),
                this.segment(322, 662, 468, 662, 12, 0.6),
                this.segment(122, 514, 165, 569, 12, 0.62, 390, 'Sling izquierda'),
                this.segment(398, 514, 355, 569, 12, 0.62, 390, 'Sling derecha'),
                this.segment(442, 104, 442, 612, 7, 0.72),
                // Compuerta unidireccional: la bola sale del carril pero no vuelve a entrar.
                this.launchGate
            ];

            this.spinner = {
                x: 260,
                y: 262,
                width: 62,
                angle: 0,
                speed: 0,
                cooldown: 0
            };

            this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
            this.reducedMotion = Boolean(this.motionQuery?.matches);
            this.boundKeyDown = (event) => this.handleKey(event, true);
            this.boundKeyUp = (event) => this.handleKey(event, false);
            this.boundVisibility = () => this.handleVisibilityChange();
            this.boundWindowBlur = () => this.handleWindowBlur();
            this.boundFullscreen = () => this.updateFullscreenControl();
            this.boundMotionChange = (event) => this.handleMotionPreference(event.matches);
            this.boundResize = () => this.resizeCanvas();

            this.tableLayer = null;
        }

        get intlLocale() {
            return window.zarateXP?.i18nManager?.locale === 'en' ? 'en-US' : 'es-AR';
        }

        t(value) {
            return window.zarateXP?.i18nManager?.t(value) || String(value);
        }

        init() {
            this.setupAccessibility();
            this.resizeCanvas();
            this.resetGame({ announce: false });
            this.bindControls();
            this.observeLifecycle();
            this.lastTime = performance.now();
            this.startLoop();
            this.announce('Pinball listo. Mantené Espacio para cargar y soltá para lanzar.');
        }

        setupAccessibility() {
            const help = this.root.querySelector('.xp-pinball-help');
            const helpId = help?.id || `pinball-help-${this.instanceId}`;
            if (help) {
                help.id = helpId;
                help.textContent = 'Arrastrá el resorte hacia abajo o mantené Espacio; soltá para lanzar. Paletas: Z y /, A/D o flechas. W mueve la mesa. P pausa, M silencia y R reinicia.';
            }

            this.root.setAttribute('aria-label', 'Pinball XP Lab');
            this.canvas.tabIndex = 0;
            this.canvas.setAttribute('role', 'application');
            this.canvas.setAttribute('aria-label', 'Mesa de Pinball XP. Arrastrá hacia abajo en el carril derecho para cargar el resorte y soltá para lanzar. Las zonas inferiores accionan las paletas.');
            if (help) this.canvas.setAttribute('aria-describedby', helpId);
            this.canvas.textContent = 'Tu navegador necesita soporte para Canvas para ejecutar Pinball XP.';

            this.stateEl?.setAttribute('aria-live', 'polite');
            this.stateEl?.setAttribute('aria-atomic', 'true');
            this.missionEl?.setAttribute('aria-live', 'polite');
            this.missionEl?.setAttribute('aria-atomic', 'true');

            const meter = this.chargeEl?.parentElement;
            meter?.setAttribute('role', 'progressbar');
            meter?.setAttribute('aria-label', 'Potencia del lanzador');
            meter?.setAttribute('aria-valuemin', '0');
            meter?.setAttribute('aria-valuemax', '100');
            meter?.setAttribute('aria-valuenow', '0');

            this.startButton?.setAttribute('aria-keyshortcuts', 'Space ArrowDown S');
            this.pauseButton?.setAttribute('aria-keyshortcuts', 'P');
            this.resetButton?.setAttribute('aria-keyshortcuts', 'R');
            this.soundButton?.setAttribute('aria-keyshortcuts', 'M');
            this.fullscreenButton?.setAttribute('aria-keyshortcuts', 'F');
            this.leftButton?.setAttribute('aria-keyshortcuts', 'Z A ArrowLeft');
            this.rightButton?.setAttribute('aria-keyshortcuts', '/ D ArrowRight');
            this.plungerButton?.setAttribute('aria-keyshortcuts', 'Space ArrowDown S');

            this.liveRegion = document.createElement('span');
            this.liveRegion.dataset.pinballLive = '';
            this.liveRegion.setAttribute('role', 'status');
            this.liveRegion.setAttribute('aria-live', 'polite');
            this.liveRegion.setAttribute('aria-atomic', 'true');
            Object.assign(this.liveRegion.style, {
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: '0'
            });
            this.root.appendChild(this.liveRegion);
        }

        bindControls() {
            this.listen(this.startButton, 'click', () => {
                this.start();
                this.focusCanvas();
            });
            this.listen(this.resetButton, 'click', () => {
                this.resetGame();
                this.focusCanvas();
            });
            this.listen(this.pauseButton, 'click', () => {
                this.togglePause();
                this.focusCanvas();
            });
            this.listen(this.soundButton, 'click', () => this.toggleSound());
            this.listen(this.fullscreenButton, 'click', () => this.toggleFullscreen());

            this.bindPadButton(this.leftButton, 'left');
            this.bindPadButton(this.rightButton, 'right');
            this.bindPadButton(this.plungerButton, 'plunger');

            this.listen(this.canvas, 'pointerdown', (event) => this.handleCanvasPointer(event, true));
            this.listen(this.canvas, 'pointermove', (event) => this.handlePlungerDrag(event));
            this.listen(this.canvas, 'pointerup', (event) => this.handleCanvasPointer(event, false));
            this.listen(this.canvas, 'pointercancel', (event) => this.handleCanvasPointer(event, false));
            this.listen(this.canvas, 'lostpointercapture', (event) => this.handleCanvasPointer(event, false));
            this.listen(this.canvas, 'contextmenu', (event) => event.preventDefault());

            this.listen(window, 'keydown', this.boundKeyDown);
            this.listen(window, 'keyup', this.boundKeyUp);
            this.listen(window, 'blur', this.boundWindowBlur);
            this.listen(window, 'resize', this.boundResize, { passive: true });
            this.listen(document, 'visibilitychange', this.boundVisibility);
            this.listen(document, 'fullscreenchange', this.boundFullscreen);
            this.listen(document, 'webkitfullscreenchange', this.boundFullscreen);

            if (this.motionQuery) {
                if (typeof this.motionQuery.addEventListener === 'function') {
                    this.motionQuery.addEventListener('change', this.boundMotionChange, { signal: this.abortController.signal });
                } else {
                    this.motionQuery.addListener?.(this.boundMotionChange);
                }
            }
        }

        listen(target, type, listener, options = {}) {
            if (!target) return;
            target.addEventListener(type, listener, {
                ...options,
                signal: this.abortController.signal
            });
        }

        bindPadButton(button, control) {
            if (!button) return;
            const source = `pad-${control}`;
            const release = (event) => {
                if (event.cancelable) event.preventDefault();
                const token = `${source}-${event.pointerId}`;
                this.setPointerControl(control, token, false, event.type !== 'pointerup');
                if (event.type !== 'lostpointercapture' && button.hasPointerCapture?.(event.pointerId)) {
                    try {
                        button.releasePointerCapture(event.pointerId);
                    } catch (error) {
                        // El control ya fue liberado por el navegador.
                    }
                }
            };

            this.listen(button, 'pointerdown', (event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                this.ensureAudio();
                try {
                    button.setPointerCapture?.(event.pointerId);
                } catch (error) {
                    // El juego sigue respondiendo aunque el navegador no permita capturar el puntero.
                }
                this.setPointerControl(control, `${source}-${event.pointerId}`, true);
            });
            this.listen(button, 'pointerup', release);
            this.listen(button, 'pointercancel', release);
            this.listen(button, 'lostpointercapture', release);
            this.listen(button, 'contextmenu', (event) => event.preventDefault());
        }

        observeLifecycle() {
            if (typeof MutationObserver === 'function' && this.windowElement instanceof Element) {
                this.windowObserver = new MutationObserver(() => this.syncWindowActivity());
                this.windowObserver.observe(this.windowElement, {
                    attributes: true,
                    attributeFilter: ['class', 'style', 'aria-hidden']
                });
            }

            if (typeof ResizeObserver === 'function') {
                this.resizeObserver = new ResizeObserver(() => {
                    if (!this.destroyed && this.isRenderable()) this.resizeCanvas();
                });
                this.resizeObserver.observe(this.canvas.parentElement);
            }
        }

        syncWindowActivity() {
            if (this.destroyed) return;
            if (!this.isRenderable()) {
                this.pause('automatic');
                this.clearControls(true);
                this.stopLoop();
                return;
            }

            if (!this.isWindowActive()) {
                this.pause('automatic');
                this.clearControls(true);
                this.stopLoop();
                return;
            }
            this.startLoop();
        }

        handleVisibilityChange() {
            if (document.hidden) {
                this.pause('automatic');
                this.clearControls(true);
                this.stopLoop();
            } else if (this.isRenderable()) {
                this.startLoop();
            }
        }

        handleWindowBlur() {
            this.clearControls(true);
            this.pause('automatic');
        }

        handleMotionPreference(reduced) {
            this.reducedMotion = Boolean(reduced);
            if (this.motionIsReduced()) {
                this.shake = 0;
                this.flash = 0;
                this.particles.length = 0;
                this.trail.length = 0;
            }
            this.draw();
        }

        isWindowActive() {
            const owner = this.root.closest('.window');
            if (!owner) return true;
            return owner.classList.contains('active') && this.isRenderable();
        }

        isRenderable() {
            if (this.destroyed || document.hidden || !this.root.isConnected) return false;
            if (this.windowElement instanceof Element) {
                const style = getComputedStyle(this.windowElement);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
            }
            return this.root.getClientRects().length > 0;
        }

        shouldHandleKeyboard(event) {
            if (!this.isWindowActive() || !this.isRenderable()) return false;
            if (event.ctrlKey || event.metaKey || event.altKey) return false;
            const target = event.target;
            if (target instanceof Element && target !== this.canvas) {
                if (target.closest('button, input, textarea, select, [contenteditable="true"], a[href]')) return false;
            }
            return true;
        }

        normalizeKey(event) {
            const key = String(event.key || '').toLowerCase();
            return key === 'spacebar' ? ' ' : key;
        }

        handleKey(event, isDown) {
            const key = this.normalizeKey(event);
            if (!CONTROL_KEYS.has(key)) return;

            if (!isDown) {
                const wasDown = this.keys.delete(key);
                if (wasDown && this.isPlungerKey(key) && !this.isPlungerPressed()) this.releaseCharge();
                this.updateControlStates();
                return;
            }

            if (!this.shouldHandleKeyboard(event)) return;
            event.preventDefault();
            if (event.repeat && key !== 'arrowleft' && key !== 'arrowright' && key !== 'a' && key !== 'd') return;

            this.ensureAudio();
            this.keys.add(key);

            if (this.isPlungerKey(key)) this.beginCharge();
            if (key === 'p') this.togglePause();
            if (key === 'm') this.toggleSound();
            if (key === 'f') this.toggleFullscreen();
            if (key === 'w' || key === 'arrowup') this.nudge();
            if (key === 'r') this.handleKeyboardReset();
            this.updateControlStates();
        }

        isPlungerKey(key) {
            return key === ' ' || key === 'arrowdown' || key === 's';
        }

        handleKeyboardReset() {
            if (this.state === 'playing' && performance.now() > this.resetArmedUntil) {
                this.resetArmedUntil = performance.now() + 1500;
                this.showEffect('Presioná R otra vez para reiniciar');
                this.announce('Presioná R otra vez para reiniciar la partida.');
                return;
            }
            this.resetGame();
        }

        handleCanvasPointer(event, pressed) {
            if (pressed && event.pointerType === 'mouse' && event.button !== 0) return;
            event.preventDefault();
            const token = `canvas-${event.pointerId}`;

            if (pressed) {
                this.ensureAudio();
                this.focusCanvas();
                try {
                    this.canvas.setPointerCapture?.(event.pointerId);
                } catch (error) {
                    // La entrada sigue disponible si el navegador rechaza la captura.
                }
                const point = this.canvasPoint(event);
                const control = this.controlAtPoint(point);
                if (control) {
                    this.canvasPointerControls.set(event.pointerId, control);
                    this.setPointerControl(control, token, true);
                    if (control === 'plunger' && this.state === 'charging' && !this.canvasPlungerDrag) {
                        this.canvasPlungerDrag = {
                            pointerId: event.pointerId,
                            originY: point.y,
                            initialCharge: this.charge,
                            dragging: false
                        };
                    }
                } else if (event.pointerType === 'touch' && point.y < HEIGHT * 0.48) {
                    this.nudge();
                }
                return;
            }

            const control = this.canvasPointerControls.get(event.pointerId);
            if (control) this.setPointerControl(control, token, false, event.type !== 'pointerup');
            this.canvasPointerControls.delete(event.pointerId);
            if (this.canvasPlungerDrag?.pointerId === event.pointerId) this.canvasPlungerDrag = null;
            if (event.type !== 'lostpointercapture' && this.canvas.hasPointerCapture?.(event.pointerId)) {
                try {
                    this.canvas.releasePointerCapture(event.pointerId);
                } catch (error) {
                    // El navegador puede haber liberado el puntero antes del evento.
                }
            }
        }

        handlePlungerDrag(event) {
            const drag = this.canvasPlungerDrag;
            if (!drag || drag.pointerId !== event.pointerId || this.state !== 'charging') return;
            const distance = this.canvasPoint(event).y - drag.originY;
            if (!drag.dragging && Math.abs(distance) <= 5) return;
            event.preventDefault();
            if (!drag.dragging) drag.initialCharge = this.charge;
            drag.dragging = true;
            this.charge = Math.max(0, Math.min(1, drag.initialCharge + distance / 80));
            this.positionBallOnPlunger();
            this.updateChargeMeter();
        }

        controlAtPoint(point) {
            if (point.x > WIDTH * 0.84) return 'plunger';
            if (point.y > HEIGHT * 0.68 && point.x < WIDTH * 0.47) return 'left';
            if (point.y > HEIGHT * 0.68 && point.x > WIDTH * 0.53) return 'right';
            return null;
        }

        setPointerControl(control, token, pressed, cancelled = false) {
            const sources = this.pointerSources[control];
            if (!sources) return;
            const wasPressed = sources.size > 0;
            if (pressed) sources.add(token);
            else sources.delete(token);
            const isPressed = sources.size > 0;

            if (control === 'plunger' && wasPressed !== isPressed) {
                if (isPressed) this.beginCharge();
                else if (!this.isPlungerPressed()) {
                    if (cancelled) this.cancelCharge();
                    else this.releaseCharge();
                }
            }
            this.updateControlStates();
        }

        clearControls(cancelCharge = false) {
            this.keys.clear();
            Object.values(this.pointerSources).forEach((sources) => sources.clear());
            this.canvasPointerControls.clear();
            this.canvasPlungerDrag = null;
            if (cancelCharge) this.cancelCharge();
            this.updateControlStates();
        }

        cancelCharge() {
            if (this.state === 'charging') {
                this.state = 'ready';
                this.charge = 0;
                this.chargeDirection = 1;
                this.plungerRecoil = 0;
                this.positionBallOnPlunger();
                this.updateHud();
            }
        }

        focusCanvas() {
            try {
                this.canvas.focus({ preventScroll: true });
            } catch (error) {
                this.canvas.focus();
            }
        }

        canvasPoint(event) {
            const rect = this.canvas.getBoundingClientRect();
            const style = getComputedStyle(this.canvas);
            const borderLeft = parseFloat(style.borderLeftWidth) || 0;
            const borderTop = parseFloat(style.borderTopWidth) || 0;
            const borderX = borderLeft + (parseFloat(style.borderRightWidth) || 0);
            const borderY = borderTop + (parseFloat(style.borderBottomWidth) || 0);
            const cssWidth = parseFloat(style.width) || this.canvas.offsetWidth || WIDTH;
            const cssHeight = parseFloat(style.height) || this.canvas.offsetHeight || HEIGHT;
            const scaleX = rect.width / (cssWidth + (style.boxSizing === 'border-box' ? 0 : borderX));
            const scaleY = rect.height / (cssHeight + (style.boxSizing === 'border-box' ? 0 : borderY));
            const left = rect.left + borderLeft * scaleX;
            const top = rect.top + borderTop * scaleY;
            const width = rect.width - borderX * scaleX || WIDTH;
            const height = rect.height - borderY * scaleY || HEIGHT;
            return {
                x: ((event.clientX - left) / width) * WIDTH,
                y: ((event.clientY - top) / height) * HEIGHT
            };
        }

        plungerGeometry() {
            const fraction = this.state === 'charging' ? this.charge : this.plungerRecoil;
            const pull = PLUNGER_TRAVEL * fraction;
            return { x: 470, restBallY: 632, pull, headY: 641.5 + pull, baseY: 687, fraction };
        }

        positionBallOnPlunger() {
            if (!this.ball?.inLauncherLane || (this.state !== 'ready' && this.state !== 'charging')) return;
            const plunger = this.plungerGeometry();
            this.ball.x = plunger.x;
            this.ball.y = plunger.headY - this.ball.r;
        }

        resizeCanvas() {
            const stage = this.canvas.parentElement;
            if (stage?.clientWidth && stage?.clientHeight) {
                const stageStyle = getComputedStyle(stage);
                const canvasStyle = getComputedStyle(this.canvas);
                const borderX = (parseFloat(canvasStyle.borderLeftWidth) || 0) + (parseFloat(canvasStyle.borderRightWidth) || 0);
                const borderY = (parseFloat(canvasStyle.borderTopWidth) || 0) + (parseFloat(canvasStyle.borderBottomWidth) || 0);
                const availableWidth = stage.clientWidth - (parseFloat(stageStyle.paddingLeft) || 0) - (parseFloat(stageStyle.paddingRight) || 0) - borderX;
                const availableHeight = stage.clientHeight - (parseFloat(stageStyle.paddingTop) || 0) - (parseFloat(stageStyle.paddingBottom) || 0) - borderY;
                const fit = Math.max(0.01, Math.min(1, availableWidth / WIDTH, availableHeight / HEIGHT));
                this.canvas.style.width = `${WIDTH * fit + borderX}px`;
                this.canvas.style.height = `${HEIGHT * fit + borderY}px`;
            }
            const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
            const nextWidth = Math.round(WIDTH * nextDpr);
            const nextHeight = Math.round(HEIGHT * nextDpr);
            if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
                this.canvas.width = nextWidth;
                this.canvas.height = nextHeight;
            }
            this.dpr = nextDpr;
            if (!this.destroyed) this.draw();
        }

        resetGame({ announce = true } = {}) {
            this.clearControls(false);
            this.persistHighScore();
            this.score = 0;
            this.balls = 3;
            this.combo = 1;
            this.comboRemaining = 0;
            this.charge = 0;
            this.chargeDirection = 1;
            this.level = 1;
            this.playfieldBoost = 0;
            this.boostRemaining = 0;
            this.missionIndex = 0;
            this.missionProgress = 0;
            this.completedMissions = 0;
            this.extraBallsAwarded.clear();
            this.targetResetTimer = 0;
            this.rolloverResetTimer = 0;
            this.spinnerChain = 0;
            this.tiltMeter = 0;
            this.tilted = false;
            this.resetArmedUntil = 0;
            this.pendingAutoLaunch = null;
            this.playerEngaged = false;
            this.stuckTime = 0;
            this.random = createRandom(RANDOM_SEED);
            this.newRecordAnnounced = false;
            this.accumulator = 0;
            this.flash = 0;
            this.shake = 0;
            this.particles.length = 0;
            this.trail.length = 0;
            this.effects.length = 0;
            this.resetEntities();
            this.resetBall({ newBall: true });
            this.state = 'ready';
            this.showEffect('Listo para lanzar');
            this.updateHud();
            if (announce) this.announce('Nueva partida. Tenés 3 bolas.');
        }

        resetEntities() {
            this.bumpers.forEach((bumper) => { bumper.cooldown = 0; });
            this.targets.forEach((target) => {
                target.active = true;
                target.cooldown = 0;
            });
            this.rollovers.forEach((rollover) => {
                rollover.active = true;
                rollover.inside = false;
            });
            this.staticSegments.forEach((segment) => { segment.cooldown = 0; });
            this.spinner.angle = 0;
            this.spinner.speed = 0;
            this.spinner.cooldown = 0;
            this.leftFlipper = 0;
            this.rightFlipper = 0;
            this.leftFlipperSpeed = 0;
            this.rightFlipperSpeed = 0;
        }

        resetBall({ newBall = true } = {}) {
            this.plungerRecoil = 0;
            this.ball = {
                x: LANE_X,
                y: 632,
                vx: 0,
                vy: 0,
                r: BALL_RADIUS,
                safeTime: 0.08,
                inLauncherLane: true
            };
            this.ballAge = 0;
            this.launchPower = 0;
            this.skillShotPending = false;
            this.stuckTime = 0;
            this.trail.length = 0;
            this.tilted = false;
            this.tiltMeter = 0;
            if (newBall) {
                this.ballSaveUsed = false;
                this.ballSaveAvailable = false;
                this.playerEngaged = false;
            }
            this.rollovers.forEach((rollover) => { rollover.inside = false; });
        }

        start() {
            this.ensureAudio();
            if (this.state === 'gameover') {
                this.resetGame({ announce: false });
                this.registerPlayerInput();
                this.launchBall(0.72);
                return;
            }
            if (this.state === 'paused') {
                this.registerPlayerInput();
                this.state = this.resumeState || 'playing';
                this.lastTime = performance.now();
                this.showEffect('Reanudado');
                this.announce('Partida reanudada.');
                this.updateHud();
                return;
            }
            if (this.state === 'ready' || this.state === 'charging') {
                this.registerPlayerInput();
                this.launchBall(Math.max(this.charge, 0.72));
            }
        }

        pause(reason = 'manual') {
            if (this.state === 'charging') {
                this.cancelCharge();
                return;
            }
            if (this.state !== 'playing') return;
            this.resumeState = 'playing';
            this.state = 'paused';
            this.accumulator = 0;
            const message = reason === 'automatic' ? 'Pausa automática' : 'Pausa';
            this.showEffect(message);
            if (reason !== 'automatic') this.announce('Partida en pausa.');
            this.updateHud();
        }

        togglePause() {
            if (this.state === 'playing') this.pause('manual');
            else if (this.state === 'paused') this.start();
        }

        beginCharge() {
            if (this.state !== 'ready' && this.state !== 'charging') return;
            this.registerPlayerInput();
            this.pendingAutoLaunch = null;
            if (this.state !== 'charging') {
                this.state = 'charging';
                this.charge = Math.max(0.12, this.charge);
                this.chargeDirection = 1;
                this.plungerRecoil = 0;
                this.positionBallOnPlunger();
                this.updateHud();
            }
        }

        releaseCharge() {
            if (this.state !== 'charging') return;
            this.launchBall(Math.max(this.charge, 0.3));
        }

        launchBall(power = 0.72, { enableBallSave = true } = {}) {
            if (this.state === 'gameover' || this.balls <= 0) return;
            this.ensureAudio();
            const chargedByPlayer = this.state === 'charging' && this.charge >= 0.2;
            const clamped = Math.max(0.25, Math.min(Number(power) || 0.72, 1));
            this.state = 'playing';
            this.resumeState = 'playing';
            this.pendingAutoLaunch = null;
            this.tilted = false;
            this.ball.x = LANE_X;
            this.ball.y = 632 + clamped * PLUNGER_TRAVEL;
            this.ball.vx = 0;
            this.ball.vy = -(LAUNCH_BASE_SPEED + clamped * LAUNCH_POWER_SPEED);
            this.ball.safeTime = 0.08;
            this.ball.inLauncherLane = true;
            this.ballAge = 0;
            if (chargedByPlayer) this.registerPlayerInput();
            this.ballSaveAvailable = enableBallSave && !this.ballSaveUsed;
            this.launchPower = clamped;
            this.plungerRecoil = clamped;
            this.skillShotPending = true;
            this.charge = 0;
            this.chargeDirection = 1;
            this.accumulator = 0;
            this.playTone(220 + clamped * 340, 0.09, 'triangle', 0.05);
            this.haptic(18);
            this.updateHud();
        }

        updateCharge(dt) {
            if (this.state === 'charging') {
                if (!this.canvasPlungerDrag?.dragging) this.charge = Math.min(1, this.charge + dt * 0.72);
            } else if (this.charge > 0 && this.state !== 'playing') {
                this.charge = Math.max(0, this.charge - dt * 0.9);
            }
            this.plungerRecoil *= Math.exp(-32 * dt);
            if (this.plungerRecoil < 0.001) this.plungerRecoil = 0;
            this.positionBallOnPlunger();
            this.updateChargeMeter();
        }

        nudge() {
            if (this.state !== 'playing' || this.tilted) return;
            this.ensureAudio();
            this.registerPlayerInput();
            this.tiltMeter += 0.37;
            if (this.tiltMeter >= 1) {
                this.tilted = true;
                this.ballSaveAvailable = false;
                this.clearControls(false);
                this.shake = this.motionIsReduced() ? 0 : 9;
                this.flash = this.motionIsReduced() ? 0 : 0.7;
                this.showEffect('TILT');
                this.announce('TILT. Los flippers quedan bloqueados hasta perder la bola.');
                this.playTone(92, 0.35, 'sawtooth', 0.06);
                this.haptic([60, 40, 90]);
                this.updateHud();
                return;
            }

            const direction = this.ball.x < WIDTH / 2 ? 1 : -1;
            this.ball.vx += direction * (70 + Math.random() * 45);
            this.ball.vy -= 82;
            this.shake = this.motionIsReduced() ? 0 : 4;
            this.showFloatingText('NUDGE', this.ball.x, Math.max(70, this.ball.y - 25), 'Cuidado con el TILT');
            this.playTone(128, 0.045, 'square', 0.025);
            this.haptic(12);
        }

        startLoop() {
            if (this.destroyed || this.raf != null || !this.isRenderable()) return;
            this.lastTime = performance.now();
            this.raf = window.requestAnimationFrame((time) => this.loop(time));
        }

        stopLoop() {
            if (this.raf != null) window.cancelAnimationFrame(this.raf);
            this.raf = null;
            this.accumulator = 0;
        }

        loop(time) {
            this.raf = null;
            if (this.destroyed || !this.isRenderable()) return;
            const dt = Math.min(MAX_FRAME_DELTA, Math.max(0, (time - this.lastTime) / 1000 || 1 / 60));
            this.lastTime = time;
            this.update(dt);
            this.draw();
            this.raf = window.requestAnimationFrame((nextTime) => this.loop(nextTime));
        }

        update(dt) {
            const canFlip = !this.tilted && (this.state === 'playing' || this.state === 'ready' || this.state === 'charging');
            const leftPressed = canFlip && this.isLeftPressed();
            const rightPressed = canFlip && this.isRightPressed();
            if (this.state === 'playing' && (leftPressed || rightPressed)) this.registerPlayerInput();
            this.playFlipperEdges(leftPressed, rightPressed);

            this.updateCharge(dt);
            this.updateTimers(dt);

            if (this.state !== 'playing') {
                this.advanceFlippers(dt, leftPressed, rightPressed);
                this.accumulator = 0;
                return;
            }

            this.accumulator = Math.min(this.accumulator + dt, FIXED_STEP * MAX_PHYSICS_STEPS);
            let steps = 0;
            while (this.accumulator + 1e-10 >= FIXED_STEP && steps < MAX_PHYSICS_STEPS && this.state === 'playing') {
                this.physicsStep(FIXED_STEP, leftPressed, rightPressed);
                this.accumulator = Math.max(0, this.accumulator - FIXED_STEP);
                steps += 1;
            }

            if (!this.motionIsReduced() && this.state === 'playing') {
                const speed = Math.hypot(this.ball.vx, this.ball.vy);
                if (speed > 110) {
                    this.trail.push({ x: this.ball.x, y: this.ball.y, alpha: Math.min(1, speed / 900) });
                    if (this.trail.length > 14) this.trail.shift();
                }
            }
        }

        stepFlipper(current, pressed, dt) {
            const next = pressed ? current + FLIPPER_UP_RATE * dt : current - FLIPPER_DOWN_RATE * dt;
            return Math.max(0, Math.min(1, next));
        }

        advanceFlippers(dt, leftPressed, rightPressed) {
            const previousLeft = this.leftFlipper;
            const previousRight = this.rightFlipper;
            this.leftFlipper = this.stepFlipper(previousLeft, leftPressed, dt);
            this.rightFlipper = this.stepFlipper(previousRight, rightPressed, dt);
            this.leftFlipperSpeed = dt > 0 ? (this.leftFlipper - previousLeft) / dt : 0;
            this.rightFlipperSpeed = dt > 0 ? (this.rightFlipper - previousRight) / dt : 0;
        }

        playFlipperEdges(leftPressed, rightPressed) {
            // El "clack" acompaña al solenoide, no al contacto con la bola.
            if (leftPressed && !this.flipperWasPressed.left) this.playTone(150, 0.03, 'square', 0.022);
            if (rightPressed && !this.flipperWasPressed.right) this.playTone(160, 0.03, 'square', 0.022);
            this.flipperWasPressed.left = leftPressed;
            this.flipperWasPressed.right = rightPressed;
        }

        updateTimers(dt) {
            this.flash = Math.max(0, this.flash - dt * 2.8);
            this.shake = Math.max(0, this.shake - dt * 20);

            if (this.state === 'playing') {
                this.comboRemaining = Math.max(0, this.comboRemaining - dt);
                if (this.comboRemaining === 0 && this.combo !== 1) {
                    this.combo = 1;
                    this.updateHud();
                }
                this.tiltMeter = Math.max(0, this.tiltMeter - dt * 0.115);
                if (this.boostRemaining > 0) {
                    this.boostRemaining = Math.max(0, this.boostRemaining - dt);
                    if (this.boostRemaining === 0 && this.playfieldBoost !== 0) {
                        this.playfieldBoost = 0;
                        this.showEffect('Multiplicador normal');
                        this.updateHud();
                    }
                }
                if (this.ballSaveAvailable && this.ballAge >= BALL_SAVE_SECONDS) {
                    this.ballSaveAvailable = false;
                    this.updateHud();
                }
            }

            if (this.state === 'playing' && this.targetResetTimer > 0) {
                this.targetResetTimer = Math.max(0, this.targetResetTimer - dt);
                if (this.targetResetTimer === 0) {
                    this.targets.forEach((target) => { target.active = true; });
                }
            }
            if (this.state === 'playing' && this.rolloverResetTimer > 0) {
                this.rolloverResetTimer = Math.max(0, this.rolloverResetTimer - dt);
                if (this.rolloverResetTimer === 0) {
                    this.rollovers.forEach((rollover) => {
                        rollover.active = true;
                        rollover.inside = false;
                    });
                }
            }

            if (this.pendingAutoLaunch) {
                this.pendingAutoLaunch.delay -= dt;
                if (this.pendingAutoLaunch.delay <= 0 && this.state === 'ready') {
                    const pending = this.pendingAutoLaunch;
                    this.pendingAutoLaunch = null;
                    this.launchBall(pending.power, { enableBallSave: pending.enableBallSave });
                }
            }

            this.effects.forEach((effect) => { effect.life -= dt; });
            this.effects = this.effects.filter((effect) => effect.life > 0);

            if (!this.motionIsReduced()) {
                this.particles.forEach((particle) => {
                    particle.life -= dt;
                    particle.x += particle.vx * dt;
                    particle.y += particle.vy * dt;
                    particle.vy += 250 * dt;
                    particle.vx *= Math.pow(0.98, dt * 60);
                });
                this.particles = this.particles.filter((particle) => particle.life > 0);
                this.trail.forEach((point) => { point.alpha -= dt * 3.4; });
                this.trail = this.trail.filter((point) => point.alpha > 0);
            } else {
                this.particles.length = 0;
                this.trail.length = 0;
            }

            if (this.highScoreDirty) {
                this.highScoreSaveDelay = Math.max(0, this.highScoreSaveDelay - dt);
                if (this.highScoreSaveDelay === 0) this.persistHighScore();
            }
        }

        physicsStep(dt, leftPressed, rightPressed) {
            // Paletas y bola comparten el mismo reloj fijo, independiente de los FPS.
            this.advanceFlippers(dt, leftPressed, rightPressed);
            this.ballAge += dt;
            this.updatePhysicsTimers(dt);
            this.integrateBall(dt);
            this.resolveLauncherLane();
            if (this.state !== 'playing') return;
            if (!this.ball.inLauncherLane) {
                this.collideStaticSegments();
                this.collideBumpers();
                this.collideTargets();
                this.collideFlippers();
                this.collideSpinner(dt);
                this.collideRollovers();
            }
            this.clampBallVelocity();
            this.detectStuckBall(dt, leftPressed, rightPressed);
            this.checkDrain();
        }

        updatePhysicsTimers(dt) {
            this.bumpers.forEach((bumper) => {
                bumper.cooldown = Math.max(0, bumper.cooldown - dt);
            });
            this.targets.forEach((target) => {
                target.cooldown = Math.max(0, target.cooldown - dt);
            });
            this.staticSegments.forEach((segment) => {
                segment.cooldown = Math.max(0, segment.cooldown - dt);
            });
            this.spinner.cooldown = Math.max(0, this.spinner.cooldown - dt);
            this.spinner.speed *= Math.exp(-1.9 * dt);
            this.spinner.angle += this.spinner.speed * dt;
        }

        integrateBall(dt) {
            const ball = this.ball;
            ball.prevX = ball.x;
            ball.prevY = ball.y;
            ball.vy += GRAVITY * dt;
            const drag = Math.exp(-AIR_DRAG * dt);
            ball.vx *= drag;
            ball.vy *= drag;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            ball.safeTime = Math.max(0, (ball.safeTime || 0) - dt);
        }

        clampBallVelocity() {
            const speed = Math.hypot(this.ball.vx, this.ball.vy);
            if (speed > MAX_BALL_SPEED) {
                const scale = MAX_BALL_SPEED / speed;
                this.ball.vx *= scale;
                this.ball.vy *= scale;
            }

            if (this.ball.x < -80 || this.ball.x > WIDTH + 80 || this.ball.y < -100) {
                this.ball.x = Math.max(45, Math.min(WIDTH - 45, this.ball.x));
                this.ball.y = Math.max(50, this.ball.y);
                this.ball.vx *= -0.45;
                this.ball.vy = Math.abs(this.ball.vy) * 0.55;
            }
        }

        resolveLauncherLane() {
            const ball = this.ball;
            if (!ball.inLauncherLane) return;

            // Un lanzamiento débil vuelve al resorte: no es una bola perdida.
            if (ball.vy > 0 && ball.y >= 632) {
                this.resetBall({ newBall: false });
                this.state = 'ready';
                this.ballSaveAvailable = false;
                this.showEffect('Cargá un poco más');
                this.announce('La bola volvió al lanzador. No perdiste ninguna bola.');
                if (this.isPlungerPressed()) this.beginCharge();
                this.updateHud();
                return;
            }

            if (ball.y > LANE_ARC.y) {
                // Tramo recto: la bola sube pegada al carril.
                ball.x = Math.max(LANE_MIN_X, Math.min(LANE_MAX_X, ball.x));
                ball.vx = 0;
                return;
            }

            // Curva superior: la misma geometría que se dibuja desvía la bola
            // hacia el playfield. Al superar la compuerta deja de ser del carril.
            this.laneArcSegments.forEach((segment) => this.collideSegment(segment));
            if (ball.y < LANE_EXIT_Y) {
                ball.inLauncherLane = false;
                this.evaluateSkillShot();
                this.playTone(520, 0.05, 'square', 0.035);
            }
        }

        evaluateSkillShot() {
            if (!this.skillShotPending) return;
            this.skillShotPending = false;
            if (this.launchPower < 0.76 || this.launchPower > 0.9) return;
            const base = 1800 + this.level * 200;
            const awarded = this.addScore(base, 'Skill shot', 414, 116, { affectsCombo: false, useCombo: false });
            this.showEffect(`SKILL SHOT +${awarded}`);
            this.announce(`Skill shot. ${awarded.toLocaleString(this.intlLocale)} puntos.`);
            this.emitParticles(418, 104, '#ffe76b', 24);
            this.playChord([660, 880, 1100], 0.07);
            this.haptic([20, 25, 35]);
        }

        collideStaticSegments() {
            this.staticSegments.forEach((segment) => {
                const hit = this.collideSegment(segment);
                if (!hit || !segment.label || segment.cooldown > 0 || !hit.kicked) return;
                segment.cooldown = 0.16;
                this.addScore(90, segment.label, (segment.a.x + segment.b.x) / 2, (segment.a.y + segment.b.y) / 2);
                this.emitParticles(hit.x, hit.y, '#9cff9a', 8);
                this.playTone(250, 0.035, 'triangle', 0.025);
                this.haptic(6);
            });
        }

        collideBumpers() {
            this.bumpers.forEach((bumper) => {
                const ready = bumper.cooldown === 0;
                const hit = this.collideCircle(bumper.x, bumper.y, bumper.r, 0.55, ready ? 560 : 0);
                if (!hit || !hit.kicked) return;
                bumper.cooldown = 0.12;
                this.addScore(bumper.value, 'Bumper', bumper.x, bumper.y);
                this.flash = this.motionIsReduced() ? 0 : 1;
                this.shake = this.motionIsReduced() ? 0 : 3.5;
                this.emitParticles(bumper.x, bumper.y, bumper.color, 16);
                this.playTone(610 + ((this.bumpers.indexOf(bumper) * 97) % 250), 0.07, 'square', 0.043);
                this.haptic(10);
            });
        }

        collideTargets() {
            this.targets.forEach((target) => {
                // Un target derribado queda bajo el nivel de la mesa: no frena la bola.
                if (!target.active) return;
                const hit = this.collideCircle(target.x, target.y, target.r, 0.5, 0);
                if (!hit || target.cooldown > 0 || hit.impact < 30) return;
                target.cooldown = 0.16;
                target.active = false;
                this.addScore(target.value, 'Target', target.x, target.y);
                this.advanceMission('targets', target.x, target.y);
                this.emitParticles(target.x, target.y, '#9cff44', 11);
                this.playTone(355, 0.055, 'triangle', 0.035);
            });

            if (this.targetResetTimer === 0 && this.targets.every((target) => !target.active)) {
                this.targetResetTimer = 0.85;
                const bonus = 1400 + this.level * 200;
                const awarded = this.addScore(bonus, 'Banco completo', WIDTH / 2, 330, { affectsCombo: false, useCombo: false });
                this.showEffect(`BANCO COMPLETO +${awarded}`);
                this.shake = this.motionIsReduced() ? 0 : 6;
                this.flash = this.motionIsReduced() ? 0 : 1;
                this.playChord([440, 660, 880], 0.06);
            }
        }

        collideRollovers() {
            this.rollovers.forEach((rollover) => {
                const inside = this.overlapsCircle(rollover.x, rollover.y, rollover.r + 3);
                if (inside && !rollover.inside && rollover.active) {
                    rollover.active = false;
                    this.addScore(rollover.value, `Lane ${rollover.letter}`, rollover.x, rollover.y);
                    this.advanceMission('lanes', rollover.x, rollover.y);
                    this.emitParticles(rollover.x, rollover.y, '#58d6ff', 8);
                    this.playTone(470 + this.rollovers.indexOf(rollover) * 90, 0.05, 'sine', 0.03);
                }
                rollover.inside = inside;
            });

            if (this.rolloverResetTimer === 0 && this.rollovers.every((rollover) => !rollover.active)) {
                this.rolloverResetTimer = 0.75;
                this.playfieldBoost = Math.min(2, this.playfieldBoost + 0.5);
                this.boostRemaining = 20;
                const bonus = 1100 + this.level * 180;
                this.addScore(bonus, 'Lanes XP', WIDTH / 2, 112, { affectsCombo: false, useCombo: false });
                this.showEffect('MULTI +0,5 POR 20s');
                this.announce('Lanes XP completas. Multiplicador aumentado durante 20 segundos.');
                this.updateHud();
            }
        }

        collideSpinner(dt) {
            // El spinner es una lámina que gira: la bola lo atraviesa y lo hace girar.
            const ball = this.ball;
            const spinner = this.spinner;
            if (Math.abs(ball.x - spinner.x) > spinner.width / 2) return;
            const before = (ball.prevY ?? ball.y) - spinner.y;
            const after = ball.y - spinner.y;
            if ((before < 0) === (after < 0)) return;
            const speed = Math.abs(ball.vy);
            spinner.speed += Math.min(42, 8 + speed * 0.028) * (ball.vy < 0 ? -1 : 1);
            ball.vy *= 0.93;
            if (spinner.cooldown > 0 || speed < 60) return;
            spinner.cooldown = 0.1;
            this.spinnerChain += 1;
            this.addScore(170, 'Spinner', spinner.x, spinner.y);
            this.advanceMission('spinner', spinner.x, spinner.y);
            this.playTone(700 + Math.min(260, this.spinnerChain * 22), Math.max(0.028, dt * 8), 'sine', 0.027);

            if (this.spinnerChain >= 8) {
                this.spinnerChain = 0;
                const jackpot = 3200 + this.level * 350;
                const awarded = this.addScore(jackpot, 'Spinner jackpot', spinner.x, spinner.y, { affectsCombo: false, useCombo: false });
                this.showEffect(`JACKPOT +${awarded}`);
                this.emitParticles(spinner.x, spinner.y, '#ffef6e', 24);
                this.playChord([740, 925, 1110], 0.07);
            }
        }

        collideFlippers() {
            for (const side of ['left', 'right']) {
                const hit = this.collideFlipper(side);
                if (hit && hit.impact > 420 && hit.moving) this.haptic(7);
            }
        }

        collideFlipper(side) {
            // Cápsula ahusada que gira sobre su eje. La bola recibe la velocidad
            // real de la superficie en el punto de contacto: cerca de la punta sale
            // más rápida y el ángulo depende de dónde pegue, como en una mesa real.
            const ball = this.ball;
            const flipper = this.flipperSegment(side);
            const ax = flipper.a.x;
            const ay = flipper.a.y;
            const abx = flipper.b.x - ax;
            const aby = flipper.b.y - ay;
            const lengthSquared = abx * abx + aby * aby;
            const t = Math.max(0, Math.min(1, ((ball.x - ax) * abx + (ball.y - ay) * aby) / lengthSquared));
            const closestX = ax + abx * t;
            const closestY = ay + aby * t;
            const radius = FLIPPER_BASE_RADIUS + (FLIPPER_TIP_RADIUS - FLIPPER_BASE_RADIUS) * t;
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const distance = Math.hypot(dx, dy);
            const minDistance = ball.r + radius;
            if (distance >= minDistance) return null;

            let nx;
            let ny;
            if (distance > 0.0001) {
                nx = dx / distance;
                ny = dy / distance;
            } else {
                const length = Math.sqrt(lengthSquared);
                nx = aby / length;
                ny = -abx / length;
                if (ny > 0) {
                    nx *= -1;
                    ny *= -1;
                }
            }

            ball.x = closestX + nx * minDistance;
            ball.y = closestY + ny * minDistance;

            const flipperSpeed = side === 'left' ? this.leftFlipperSpeed : this.rightFlipperSpeed;
            const omega = (side === 'left' ? -1 : 1) * FLIPPER_SWEEP * flipperSpeed;
            const contactX = closestX + nx * radius - ax;
            const contactY = closestY + ny * radius - ay;
            const surfaceVx = -omega * contactY;
            const surfaceVy = omega * contactX;
            const relativeVx = ball.vx - surfaceVx;
            const relativeVy = ball.vy - surfaceVy;
            const normalVelocity = relativeVx * nx + relativeVy * ny;
            const impact = Math.max(0, -normalVelocity);
            if (normalVelocity < 0) {
                // Contactos suaves no rebotan: así la bola puede quedar atrapada (cradle).
                const restitution = impact < 70 ? 0 : FLIPPER_RESTITUTION;
                ball.vx -= (1 + restitution) * normalVelocity * nx;
                ball.vy -= (1 + restitution) * normalVelocity * ny;
            }
            return { t, impact, moving: Math.abs(omega) > 1 };
        }

        detectStuckBall(dt, leftPressed, rightPressed) {
            // Ball search clásico: sólo si la bola quedó quieta fuera de una paleta levantada.
            const ball = this.ball;
            const speed = Math.hypot(ball.vx, ball.vy);
            const cradled = (leftPressed || rightPressed) && ball.y > 560;
            if (speed > STUCK_SPEED || cradled || ball.inLauncherLane) {
                this.stuckTime = 0;
                return;
            }
            this.stuckTime += dt;
            if (this.stuckTime < STUCK_SECONDS) return;
            this.stuckTime = 0;
            ball.vy = -620;
            ball.vx = ball.x < WIDTH / 2 ? 170 : -170;
            this.showEffect('BALL SEARCH');
            this.playTone(160, 0.06, 'square', 0.03);
        }

        checkDrain() {
            if (this.ball.y <= HEIGHT + 26) return false;

            if (!this.tilted && this.ballSaveAvailable && !this.ballSaveUsed && this.ballAge <= BALL_SAVE_SECONDS) {
                this.ballSaveUsed = true;
                this.ballSaveAvailable = false;
                this.resetBall({ newBall: false });
                this.state = 'ready';
                this.pendingAutoLaunch = { delay: 0.8, power: 0.72, enableBallSave: false };
                this.showEffect('BOLA SALVADA');
                this.announce('Bola salvada. Relanzamiento automático.');
                this.playChord([330, 440, 660], 0.07);
                this.updateHud();
                return true;
            }

            this.balls -= 1;
            this.combo = 1;
            this.comboRemaining = 0;
            this.charge = 0;
            this.persistHighScore();
            this.tilted = false;

            if (this.balls <= 0) {
                this.balls = 0;
                this.resetBall({ newBall: false });
                this.state = 'gameover';
                this.pendingAutoLaunch = null;
                this.showEffect('Game over');
                this.announce(`Fin de la partida. Puntaje ${this.score.toLocaleString(this.intlLocale)}.`);
                this.playChord([260, 196, 130], 0.12);
            } else {
                this.resetBall({ newBall: true });
                this.state = 'ready';
                this.showEffect(`Bola perdida. Quedan ${this.balls}`);
                this.announce(`Bola perdida. Quedan ${this.balls}.`);
                this.playTone(145, 0.18, 'triangle', 0.04);
            }
            this.updateHud();
            return true;
        }

        applyKick(nx, ny, kick) {
            // Bumpers y slingshots disparan la bola con una velocidad mínima fija:
            // no suman energía sin límite si la bola rebota varias veces seguidas.
            // Unos grados de variación evitan ciclos perfectos entre dos gomas.
            const angle = (this.random() - 0.5) * 2 * KICK_JITTER;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const kx = nx * cos - ny * sin;
            const ky = nx * sin + ny * cos;
            const outgoing = this.ball.vx * kx + this.ball.vy * ky;
            if (outgoing >= kick) return;
            this.ball.vx += (kick - outgoing) * kx;
            this.ball.vy += (kick - outgoing) * ky;
        }

        collideCircle(cx, cy, radius, restitution, kick = 0) {
            const ball = this.ball;
            const dx = ball.x - cx;
            const dy = ball.y - cy;
            const distance = Math.hypot(dx, dy);
            const minDistance = ball.r + radius;
            if (distance >= minDistance) return null;

            let nx;
            let ny;
            if (distance > 0.0001) {
                nx = dx / distance;
                ny = dy / distance;
            } else {
                const speed = Math.hypot(ball.vx, ball.vy) || 1;
                nx = -ball.vx / speed;
                ny = -ball.vy / speed;
            }

            ball.x = cx + nx * minDistance;
            ball.y = cy + ny * minDistance;
            const normalVelocity = ball.vx * nx + ball.vy * ny;
            const impact = Math.max(0, -normalVelocity);
            if (normalVelocity < 0) {
                const bounce = impact < 40 ? 0 : restitution;
                ball.vx -= (1 + bounce) * normalVelocity * nx;
                ball.vy -= (1 + bounce) * normalVelocity * ny;
            }
            const kicked = kick > 0 && impact > 25;
            if (kicked) this.applyKick(nx, ny, kick);
            return { nx, ny, impact, kicked };
        }

        overlapsCircle(cx, cy, radius) {
            const dx = this.ball.x - cx;
            const dy = this.ball.y - cy;
            const minDistance = this.ball.r + radius;
            return dx * dx + dy * dy <= minDistance * minDistance;
        }

        collideSegment(segment) {
            const ball = this.ball;
            const abx = segment.b.x - segment.a.x;
            const aby = segment.b.y - segment.a.y;
            const lengthSquared = abx * abx + aby * aby || 1;
            const t = Math.max(0, Math.min(1, ((ball.x - segment.a.x) * abx + (ball.y - segment.a.y) * aby) / lengthSquared));
            const closestX = segment.a.x + abx * t;
            const closestY = segment.a.y + aby * t;
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const distance = Math.hypot(dx, dy);
            const minDistance = ball.r + segment.thickness;
            if (distance >= minDistance) return null;

            let nx;
            let ny;
            if (distance > 0.0001) {
                nx = dx / distance;
                ny = dy / distance;
            } else {
                const segmentLength = Math.hypot(abx, aby) || 1;
                nx = -aby / segmentLength;
                ny = abx / segmentLength;
                if (ball.vx * nx + ball.vy * ny > 0) {
                    nx *= -1;
                    ny *= -1;
                }
            }

            ball.x = closestX + nx * minDistance;
            ball.y = closestY + ny * minDistance;
            const normalVelocity = ball.vx * nx + ball.vy * ny;
            const impact = Math.max(0, -normalVelocity);
            if (normalVelocity < 0) {
                // Contactos rasantes no rebotan: la bola rueda por los rails sin vibrar.
                const bounce = impact < 40 ? 0 : segment.restitution;
                ball.vx -= (1 + bounce) * normalVelocity * nx;
                ball.vy -= (1 + bounce) * normalVelocity * ny;
            }
            // Los slingshots sólo patean con la cara de goma, no con sus extremos.
            const kicked = segment.impulse > 0 && impact > 60 && t > 0.06 && t < 0.94;
            if (kicked) this.applyKick(nx, ny, segment.impulse);
            return { nx, ny, t, impact, kicked, x: closestX, y: closestY };
        }

        advanceMission(type, x, y) {
            const mission = this.currentMission();
            if (mission.id !== type) return;
            this.missionProgress = Math.min(mission.goal, this.missionProgress + 1);
            this.updateHud();
            if (this.missionProgress < mission.goal) return;

            const completedMission = mission;
            const completedLevel = this.level;
            const reward = Math.round(completedMission.reward * (1 + (completedLevel - 1) * 0.2));
            this.completedMissions += 1;
            this.level = Math.min(20, this.level + 1);
            this.missionIndex = (this.missionIndex + 1) % this.missions.length;
            this.missionProgress = 0;
            this.playfieldBoost = Math.min(2, this.playfieldBoost + 0.25);
            this.boostRemaining = Math.max(this.boostRemaining, 16);
            this.prepareCurrentMission();
            this.addScore(reward, 'Misión completa', x, y, {
                affectsCombo: false,
                useCombo: false,
                multiplier: 1
            });
            this.showEffect(`MISIÓN COMPLETA +${reward}`);
            this.announce(`Misión completa. Nivel ${this.level}. Nueva misión: ${this.currentMission().name}.`);
            this.emitParticles(x, y, '#ffe76b', 28);
            this.playChord([520, 660, 820, 1040], 0.07);
            this.haptic([25, 25, 45]);
            this.updateHud();
        }

        prepareCurrentMission() {
            const mission = this.currentMission();
            if (mission.id === 'targets') {
                this.targetResetTimer = 0;
                this.targets.forEach((target) => { target.active = true; });
            } else if (mission.id === 'lanes') {
                this.rolloverResetTimer = 0;
                this.rollovers.forEach((rollover) => {
                    rollover.active = true;
                    rollover.inside = false;
                });
            } else if (mission.id === 'spinner') {
                this.spinnerChain = 0;
            }
        }

        currentMission() {
            return this.missions[this.missionIndex] || this.missions[0];
        }

        basePlayfieldMultiplier() {
            return Math.min(4, 1 + Math.floor((this.level - 1) / 2) * 0.5);
        }

        registerPlayerInput() {
            this.playerEngaged = true;
        }

        playfieldMultiplier() {
            return Math.min(6, this.basePlayfieldMultiplier() + this.playfieldBoost);
        }

        addScore(points, label, x, y, options = {}) {
            if (this.tilted && options.allowTilted !== true) return 0;
            const affectsCombo = options.affectsCombo !== false;
            if (affectsCombo) {
                this.combo = this.comboRemaining > 0 ? Math.min(8, this.combo + 0.25) : 1;
                this.comboRemaining = COMBO_SECONDS;
            }

            const multiplier = options.multiplier != null
                ? Number(options.multiplier)
                : this.playfieldMultiplier() * (options.useCombo === false ? 1 : this.combo);
            const total = Math.max(0, Math.round(points * multiplier));
            const previousScore = this.score;
            this.score += total;
            this.recordHighScore();
            this.checkExtraBall(previousScore, this.score);
            if (options.quiet !== true) this.showFloatingText(`+${total}`, x, y, label);
            this.updateHud();
            return total;
        }

        checkExtraBall(previousScore, nextScore) {
            EXTRA_BALL_SCORES.forEach((threshold) => {
                if (this.extraBallsAwarded.has(threshold) || previousScore >= threshold || nextScore < threshold) return;
                this.extraBallsAwarded.add(threshold);
                this.balls = Math.min(6, this.balls + 1);
                this.showEffect('EXTRA BALL');
                this.announce(`Bola extra al superar ${threshold.toLocaleString(this.intlLocale)} puntos.`);
                this.playChord([620, 780, 930, 1240], 0.08);
                this.haptic([30, 25, 55]);
            });
        }

        recordHighScore() {
            if (this.score <= this.highScore) return;
            this.highScore = this.score;
            this.highScoreDirty = true;
            this.highScoreSaveDelay = 1.2;
            if (!this.newRecordAnnounced && this.initialHighScore > 0 && this.score > this.initialHighScore) {
                this.newRecordAnnounced = true;
                this.showEffect('NUEVO RÉCORD');
                this.announce('Nuevo récord personal.');
            }
        }

        persistHighScore() {
            if (!this.highScoreDirty) return;
            try {
                localStorage.setItem(STORAGE_KEY, String(this.highScore));
                this.highScoreDirty = false;
                this.highScoreSaveDelay = 0;
            } catch (error) {
                this.highScoreSaveDelay = 5;
            }
        }

        readStoredNumber(key) {
            try {
                const value = Number(localStorage.getItem(key));
                return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
            } catch (error) {
                return 0;
            }
        }

        readStoredBoolean(key) {
            try {
                return localStorage.getItem(key) === 'true';
            } catch (error) {
                return false;
            }
        }

        updateHud() {
            const mission = this.currentMission();
            this.setText(this.scoreEl, this.score.toLocaleString(this.intlLocale));
            this.setText(this.highScoreEl, this.highScore.toLocaleString(this.intlLocale));
            this.setText(this.ballsEl, String(Math.max(0, this.balls)));
            this.setText(this.comboEl, `x${this.formatMultiplier(this.combo)}`);
            this.setText(this.levelEl, String(this.level));
            this.setText(this.multiplierEl, `x${this.formatMultiplier(this.playfieldMultiplier())}`);
            this.setText(this.missionEl, `${mission.name}: ${this.missionProgress}/${mission.goal}`);
            this.setText(this.stateEl, this.stateLabel());
            this.root.dataset.pinballGameState = this.tilted ? 'tilt' : this.state;
            this.root.dataset.pinballGameLevel = String(this.level);
            this.root.classList.toggle('is-muted', this.muted);
            this.updateChargeMeter();
            this.updateButtons();
            this.updateControlStates();
        }

        updateChargeMeter() {
            const percent = Math.round(this.charge * 100);
            if (this.chargeEl) {
                this.chargeEl.style.width = `${percent}%`;
                this.chargeEl.dataset.skillShot = this.charge >= 0.76 && this.charge <= 0.9 ? 'true' : 'false';
            }
            const meter = this.chargeEl?.parentElement;
            meter?.setAttribute('aria-valuenow', String(percent));
            meter?.setAttribute('aria-valuetext', this.charge >= 0.76 && this.charge <= 0.9
                ? `${percent} por ciento, zona de skill shot`
                : `${percent} por ciento`);
        }

        updateButtons() {
            if (this.startButton) {
                const labels = {
                    ready: 'Lanzar bola',
                    charging: 'Lanzar ahora',
                    playing: 'Bola en juego',
                    paused: 'Reanudar',
                    gameover: 'Nueva partida'
                };
                this.startButton.textContent = labels[this.state] || 'Lanzar bola';
                this.startButton.disabled = this.state === 'playing';
            }
            if (this.pauseButton) {
                this.pauseButton.textContent = this.state === 'paused' ? 'Reanudar' : 'Pausar';
                this.pauseButton.disabled = this.state !== 'playing' && this.state !== 'paused';
                this.pauseButton.setAttribute('aria-pressed', String(this.state === 'paused'));
            }
            if (this.soundButton) {
                this.soundButton.textContent = this.muted ? 'Sonido: no' : 'Sonido: sí';
                this.soundButton.setAttribute('aria-pressed', String(!this.muted));
                this.soundButton.title = this.muted ? 'Activar sonido (M)' : 'Silenciar (M)';
            }
            this.updateFullscreenControl();
        }

        updateControlStates() {
            const left = this.isLeftPressed();
            const right = this.isRightPressed();
            const plunger = this.isPlungerPressed();
            this.leftButton?.setAttribute('aria-pressed', String(left));
            this.rightButton?.setAttribute('aria-pressed', String(right));
            this.plungerButton?.setAttribute('aria-pressed', String(plunger));
            this.leftButton?.toggleAttribute('data-active', left);
            this.rightButton?.toggleAttribute('data-active', right);
            this.plungerButton?.toggleAttribute('data-active', plunger);
        }

        setText(element, text) {
            if (element && element.textContent !== text) element.textContent = text;
        }

        formatMultiplier(value) {
            return Number(value).toLocaleString(this.intlLocale, {
                minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
                maximumFractionDigits: 2
            });
        }

        stateLabel() {
            if (this.tilted) return 'TILT';
            const labels = {
                ready: this.pendingAutoLaunch ? 'Ball save' : 'Listo',
                charging: 'Cargando',
                playing: this.ballSaveAvailable && this.ballAge <= BALL_SAVE_SECONDS ? 'En juego + save' : 'En juego',
                paused: 'Pausa',
                gameover: 'Game over'
            };
            return labels[this.state] || 'Listo';
        }

        showFloatingText(text, x, y, label) {
            this.effects.push({ text: this.t(text), label: this.t(label), x, y, life: 0.85, maxLife: 0.85 });
            if (this.effects.length > 12) this.effects.splice(0, this.effects.length - 12);
        }

        showEffect(text) {
            this.effects.push({ text: this.t(text), x: WIDTH / 2, y: 318, life: 1.35, maxLife: 1.35, banner: true });
            if (this.effects.length > 12) this.effects.splice(0, this.effects.length - 12);
        }

        announce(text) {
            if (!this.liveRegion) return;
            this.liveRegion.textContent = '';
            window.requestAnimationFrame(() => {
                if (!this.destroyed && this.liveRegion) this.liveRegion.textContent = text;
            });
        }

        emitParticles(x, y, color, count) {
            if (this.motionIsReduced()) return;
            const available = Math.max(0, 180 - this.particles.length);
            const amount = Math.min(count, available);
            for (let i = 0; i < amount; i += 1) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 75 + Math.random() * 245;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 0.34 + Math.random() * 0.38,
                    maxLife: 0.72
                });
            }
        }

        segment(x1, y1, x2, y2, thickness = 8, restitution = 0.85, impulse = 0, label = '') {
            return {
                a: { x: x1, y: y1 },
                b: { x: x2, y: y2 },
                thickness,
                restitution,
                impulse,
                label,
                cooldown: 0
            };
        }

        arcSegments(arc, fromAngle, toAngle, count, restitution = 0.5) {
            const segments = [];
            for (let index = 0; index < count; index += 1) {
                const start = fromAngle + ((toAngle - fromAngle) * index) / count;
                const end = fromAngle + ((toAngle - fromAngle) * (index + 1)) / count;
                segments.push(this.segment(
                    arc.x + Math.cos(start) * arc.radius,
                    arc.y + Math.sin(start) * arc.radius,
                    arc.x + Math.cos(end) * arc.radius,
                    arc.y + Math.sin(end) * arc.radius,
                    arc.thickness,
                    restitution
                ));
            }
            return segments;
        }

        flipperSegment(side) {
            const isLeft = side === 'left';
            const amount = isLeft ? this.leftFlipper : this.rightFlipper;
            const pivot = FLIPPER_PIVOTS[isLeft ? 'left' : 'right'];
            const local = FLIPPER_REST_ANGLE + (FLIPPER_UP_ANGLE - FLIPPER_REST_ANGLE) * amount;
            const angle = isLeft ? local : Math.PI - local;
            return {
                a: { x: pivot.x, y: pivot.y },
                b: {
                    x: pivot.x + Math.cos(angle) * FLIPPER_LENGTH,
                    y: pivot.y + Math.sin(angle) * FLIPPER_LENGTH
                },
                angle,
                thickness: FLIPPER_BASE_RADIUS,
                baseRadius: FLIPPER_BASE_RADIUS,
                tipRadius: FLIPPER_TIP_RADIUS,
                restitution: FLIPPER_RESTITUTION,
                impulse: 0,
                label: '',
                cooldown: 0
            };
        }

        isLeftPressed() {
            return this.keys.has('arrowleft') || this.keys.has('a') || this.keys.has('z') || this.pointerSources.left.size > 0;
        }

        isRightPressed() {
            return this.keys.has('arrowright') || this.keys.has('d') || this.keys.has('/') || this.pointerSources.right.size > 0;
        }

        isPlungerPressed() {
            return this.keys.has(' ') || this.keys.has('arrowdown') || this.keys.has('s') || this.pointerSources.plunger.size > 0;
        }

        motionIsReduced() {
            return this.reducedMotion || document.body.classList.contains('xp-no-animations');
        }

        draw() {
            if (!this.ctx || !this.ball) return;
            const ctx = this.ctx;
            ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            ctx.save();
            if (this.shake > 0 && !this.motionIsReduced()) {
                ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
            }
            this.drawTable(ctx);
            // El display de la mesa va debajo de la bola: los mensajes nunca la tapan.
            this.drawPlayfieldDisplay(ctx);
            this.drawInteractiveLights(ctx);
            this.drawSpinner(ctx);
            this.drawFlippers(ctx);
            this.drawTrail(ctx);
            this.drawBall(ctx);
            this.drawParticles(ctx);
            ctx.restore();
            this.drawPlayfieldHud(ctx);
            this.drawEffects(ctx);
            if (this.state !== 'playing') this.drawMessage(ctx);
        }

        drawTable(ctx) {
            const scale = this.dpr || 1;
            // El arte comparte coordenadas con las colisiones. Se dibuja una vez
            // por resolución para no reconstruir metal y circuitos en cada frame.
            if (!this.tableLayer || this.tableLayer.width !== Math.round(WIDTH * scale)) {
                this.tableLayer = document.createElement('canvas');
                this.tableLayer.width = Math.round(WIDTH * scale);
                this.tableLayer.height = Math.round(HEIGHT * scale);
                const layerContext = this.tableLayer.getContext('2d');
                layerContext.scale(scale, scale);
                this.drawTableArtwork(layerContext);
            }
            ctx.drawImage(this.tableLayer, 0, 0, WIDTH, HEIGHT);
            if (this.flash > 0 && !this.motionIsReduced()) {
                ctx.fillStyle = `rgba(136, 230, 255, ${this.flash * 0.08})`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }
            this.drawPlunger(ctx);
        }

        drawTableArtwork(ctx) {
            ctx.save();
            const enamel = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
            enamel.addColorStop(0, '#061126');
            enamel.addColorStop(0.4, '#103365');
            enamel.addColorStop(0.72, '#082a51');
            enamel.addColorStop(1, '#040d1d');
            ctx.fillStyle = enamel;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            // Bordes del gabinete; los carriles elevados se dibujan más abajo.
            ctx.strokeStyle = '#020917';
            ctx.lineWidth = 17;
            ctx.strokeRect(13, 15, WIDTH - 26, HEIGHT - 30);
            ctx.strokeStyle = '#578296';
            ctx.lineWidth = 2;
            ctx.strokeRect(13, 15, WIDTH - 26, HEIGHT - 30);

            const centerGlow = ctx.createRadialGradient(255, 285, 25, 255, 310, 365);
            centerGlow.addColorStop(0, 'rgba(23, 121, 170, 0.28)');
            centerGlow.addColorStop(1, 'rgba(2, 15, 39, 0)');
            ctx.fillStyle = centerGlow;
            ctx.fillRect(24, 36, 470, 630);

            // Serigrafía plana, sin paletas ni obstáculos falsos en el fondo.
            ctx.lineWidth = 1;
            for (let index = 0; index < 7; index += 1) {
                const inset = index * 13;
                ctx.strokeStyle = index % 2 ? 'rgba(97, 235, 162, 0.11)' : 'rgba(89, 185, 225, 0.16)';
                for (const side of [-1, 1]) {
                    const x = 260 + side * (62 + inset);
                    ctx.beginPath();
                    ctx.moveTo(x, 148 + inset * 0.6);
                    ctx.lineTo(x, 305 + inset);
                    ctx.lineTo(x - side * 35, 348 + inset);
                    ctx.lineTo(x - side * 35, 493 + inset * 0.5);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(x - side * 35, 493 + inset * 0.5, 2.2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // La salida central queda abierta visualmente, igual que en la física.
            ctx.fillStyle = '#030915';
            ctx.beginPath();
            ctx.moveTo(206, 650);
            ctx.lineTo(314, 650);
            ctx.lineTo(301, 700);
            ctx.lineTo(219, 700);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(101, 188, 214, 0.26)';
            ctx.lineWidth = 1;
            for (let y = 668; y < 700; y += 7) {
                ctx.beginPath();
                ctx.moveTo(219, y);
                ctx.lineTo(301, y);
                ctx.stroke();
            }

            // Canal de lanzamiento y flechas impresas hacia su salida superior.
            const lane = ctx.createLinearGradient(450, 0, 483, 0);
            lane.addColorStop(0, '#061122');
            lane.addColorStop(0.5, '#193e59');
            lane.addColorStop(1, '#060f21');
            ctx.fillStyle = lane;
            ctx.fillRect(450, 123, 33, 565);
            ctx.strokeStyle = '#72c9da';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.45;
            for (let y = 165; y < 595; y += 38) {
                ctx.beginPath();
                ctx.moveTo(465, y + 5);
                ctx.lineTo(470, y);
                ctx.lineTo(475, y + 5);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // La curva del lanzador se dibuja como un arco continuo; la física usa
            // los mismos puntos repartidos en tramos cortos.
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(LANE_ARC.x, LANE_ARC.y, LANE_ARC.radius, -Math.PI / 2, 0);
            ctx.strokeStyle = '#020916';
            ctx.lineWidth = LANE_ARC.thickness * 2 + 4;
            ctx.stroke();
            const arcMetal = ctx.createLinearGradient(LANE_ARC.x, LANE_ARC.y - LANE_ARC.radius, LANE_ARC.x + LANE_ARC.radius, LANE_ARC.y);
            arcMetal.addColorStop(0, '#2b4d62');
            arcMetal.addColorStop(0.4, '#e5f7ff');
            arcMetal.addColorStop(0.7, '#8daebb');
            arcMetal.addColorStop(1, '#294759');
            ctx.strokeStyle = arcMetal;
            ctx.lineWidth = LANE_ARC.thickness * 2;
            ctx.stroke();
            ctx.strokeStyle = '#456678';
            ctx.lineWidth = 3;
            ctx.stroke();

            for (const segment of this.staticSegments) {
                if (this.laneArcSegments.includes(segment)) continue;
                const rubber = Boolean(segment.label);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(segment.a.x, segment.a.y);
                ctx.lineTo(segment.b.x, segment.b.y);
                ctx.strokeStyle = '#020916';
                ctx.lineWidth = segment.thickness * 2 + 4;
                ctx.stroke();
                const metal = ctx.createLinearGradient(segment.a.x - 8, segment.a.y - 8, segment.a.x + 12, segment.a.y + 12);
                metal.addColorStop(0, rubber ? '#183e37' : '#2b4d62');
                metal.addColorStop(0.32, rubber ? '#d0ffd1' : '#e5f7ff');
                metal.addColorStop(0.55, rubber ? '#67e98a' : '#8daebb');
                metal.addColorStop(1, rubber ? '#1d804c' : '#294759');
                ctx.strokeStyle = metal;
                ctx.lineWidth = segment.thickness * 2;
                ctx.stroke();
                ctx.strokeStyle = rubber ? '#183f3c' : '#456678';
                ctx.lineWidth = rubber ? 5 : 3;
                ctx.stroke();
            }

            for (const side of ['left', 'right']) {
                const pivot = this.flipperSegment(side).a;
                ctx.fillStyle = '#030d1d';
                ctx.beginPath();
                ctx.arc(pivot.x, pivot.y, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4d8b88';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(135, 230, 233, 0.35)';
            ctx.font = '700 27px Tahoma, sans-serif';
            ctx.fillText('XP CIRCUIT', 260, 527);
            ctx.strokeStyle = 'rgba(105, 221, 167, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(208, 556);
            ctx.lineTo(312, 556);
            ctx.stroke();
            // Tornillos del gabinete, fuera del área jugable.
            for (const [x, y] of [[13, 15], [507, 15], [13, 350], [507, 350], [13, 685], [507, 685]]) {
                ctx.fillStyle = '#adc6cf';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#233b4c';
                ctx.beginPath();
                ctx.moveTo(x - 2, y + 1);
                ctx.lineTo(x + 2, y - 1);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawPlunger(ctx) {
            const { x, headY, baseY, fraction } = this.plungerGeometry();
            const skillShot = fraction >= 0.76 && fraction <= 0.9;
            ctx.save();
            // Vástago dentro de un muelle helicoidal; la cabeza se comprime
            // junto a la bola y vuelve a su posición al soltar el lanzador.
            const shaft = ctx.createLinearGradient(x - 3, 0, x + 3, 0);
            shaft.addColorStop(0, '#3c596c');
            shaft.addColorStop(0.45, '#e7f7ff');
            shaft.addColorStop(1, '#344d5c');
            ctx.fillStyle = shaft;
            ctx.fillRect(x - 3, headY + 3, 6, baseY - headY);
            const springTop = headY + 6;
            const springBottom = baseY - 4;
            const turns = 5;
            ctx.beginPath();
            for (let step = 0; step <= turns * 20; step += 1) {
                const progress = step / (turns * 20);
                const coilX = x + Math.sin(progress * turns * Math.PI * 2) * 10;
                const coilY = springTop + (springBottom - springTop) * progress;
                if (step === 0) ctx.moveTo(coilX, coilY);
                else ctx.lineTo(coilX, coilY);
            }
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#06101e';
            ctx.stroke();
            const chrome = ctx.createLinearGradient(x - 10, 0, x + 10, 0);
            chrome.addColorStop(0, '#7898a7');
            chrome.addColorStop(0.3, '#f5fcff');
            chrome.addColorStop(0.65, '#456274');
            chrome.addColorStop(1, '#c1dce1');
            ctx.strokeStyle = chrome;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = chrome;
            ctx.fillRect(x - 13, headY, 26, 6);
            ctx.fillRect(x - 14, baseY - 4, 28, 7);
            ctx.fillStyle = skillShot ? '#ecf5a4' : '#76d8b0';
            ctx.fillRect(x - 12, headY, 24, 2);

            // Medidor fuera de la trayectoria de la bola, con zona de precisión.
            ctx.fillStyle = '#020a16';
            ctx.fillRect(499, 494, 7, 133);
            ctx.fillStyle = '#efce64';
            ctx.fillRect(499, 510, 7, 19);
            ctx.fillStyle = skillShot ? '#f1e289' : '#7de2b2';
            ctx.fillRect(500, 626 - fraction * 130, 5, fraction * 130);
            if (this.state === 'charging' || this.state === 'ready') {
                ctx.save();
                ctx.translate(507, 479);
                ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = '#bde1e5';
                ctx.font = '700 9px Tahoma, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(this.state === 'charging' ? `${Math.round(fraction * 100)}%` : 'PULL', 0, 0);
                ctx.restore();
            }
            ctx.restore();
        }

        drawInteractiveLights(ctx) {
            this.bumpers.forEach((bumper) => {
                const pulse = bumper.cooldown > 0 ? Math.min(1, bumper.cooldown / 0.18) : 0;
                ctx.save();
                if (pulse && !this.motionIsReduced()) {
                    ctx.shadowColor = bumper.color;
                    ctx.shadowBlur = 18 * pulse;
                }
                // El borde sólido tiene exactamente el radio de colisión.
                const rim = ctx.createLinearGradient(bumper.x, bumper.y - bumper.r, bumper.x, bumper.y + bumper.r);
                rim.addColorStop(0, '#ecfaff');
                rim.addColorStop(0.35, '#7e9aaa');
                rim.addColorStop(0.6, '#293f53');
                rim.addColorStop(1, '#acced5');
                ctx.fillStyle = rim;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                const cap = ctx.createRadialGradient(bumper.x - 5, bumper.y - 7, 1, bumper.x, bumper.y, bumper.r - 5);
                cap.addColorStop(0, pulse ? '#ffffff' : '#e1fff8');
                cap.addColorStop(0.4, bumper.color);
                cap.addColorStop(1, '#12495a');
                ctx.fillStyle = cap;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, bumper.r - 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(215,255,247,0.65)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, bumper.r - 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#0b3444';
                ctx.font = `700 ${bumper.r < 25 ? 9 : 11}px Tahoma, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(bumper.value), bumper.x, bumper.y + 1);
                ctx.restore();
            });

            this.targets.forEach((target, index) => this.drawTarget(ctx, target, '#92ff63', String(index + 1)));
            this.rollovers.forEach((rollover) => this.drawTarget(ctx, rollover, '#58d6ff', rollover.letter));
        }

        drawTarget(ctx, target, color, glyph = '') {
            ctx.save();
            ctx.globalAlpha = target.active ? 1 : 0.25;
            const gradient = ctx.createRadialGradient(target.x - 4, target.y - 5, 2, target.x, target.y, target.r + 5);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.45, color);
            gradient.addColorStop(1, 'rgba(4, 25, 78, 0.85)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = target.active ? '#f8fff7' : '#4b6174';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (glyph) {
                ctx.fillStyle = '#06245d';
                ctx.font = `700 ${Math.max(9, target.r * 0.85)}px Tahoma, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(glyph, target.x, target.y + 0.5);
            }
            ctx.restore();
        }

        drawSpinner(ctx) {
            ctx.save();
            ctx.translate(this.spinner.x, this.spinner.y);
            ctx.rotate(this.spinner.angle);
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#ffef6e';
            if (!this.motionIsReduced()) {
                ctx.shadowColor = '#7df9ff';
                ctx.shadowBlur = 12;
            }
            ctx.beginPath();
            ctx.moveTo(-this.spinner.width / 2, 0);
            ctx.lineTo(this.spinner.width / 2, 0);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = 'rgba(255, 239, 110, 0.82)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.spinner.x, this.spinner.y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.spinnerChain / 8));
            ctx.stroke();
            ctx.restore();
        }

        drawFlippers(ctx) {
            for (const side of ['left', 'right']) {
                const flipper = this.flipperSegment(side);
                const active = side === 'left' ? this.isLeftPressed() : this.isRightPressed();
                const { a, b, baseRadius, tipRadius } = flipper;
                const length = Math.hypot(b.x - a.x, b.y - a.y);
                // Misma cápsula ahusada que usa la física: lo que se ve es lo que golpea.
                const shape = new Path2D();
                shape.moveTo(0, -baseRadius);
                shape.lineTo(length, -tipRadius);
                shape.arc(length, 0, tipRadius, -Math.PI / 2, Math.PI / 2);
                shape.lineTo(0, baseRadius);
                shape.arc(0, 0, baseRadius, Math.PI / 2, Math.PI * 1.5);
                shape.closePath();

                ctx.save();
                ctx.translate(a.x, a.y);
                ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
                ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
                ctx.shadowBlur = 6;
                ctx.shadowOffsetY = 3;
                const body = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
                body.addColorStop(0, this.tilted ? '#9aa3ab' : '#c9e6ff');
                body.addColorStop(0.5, this.tilted ? '#d5dadf' : '#ffffff');
                body.addColorStop(1, this.tilted ? '#9aa3ab' : '#c9e6ff');
                ctx.fillStyle = body;
                ctx.fill(shape);
                ctx.shadowColor = 'transparent';
                ctx.lineWidth = 3.2;
                ctx.strokeStyle = this.tilted ? '#64727b' : active ? '#57f08f' : '#21a46a';
                ctx.stroke(shape);
                ctx.fillStyle = '#1d3a52';
                ctx.beginPath();
                ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#dbe8ed';
                ctx.beginPath();
                ctx.arc(-0.7, -0.7, 1.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        drawTrail(ctx) {
            if (this.motionIsReduced()) return;
            ctx.save();
            this.trail.forEach((point, index) => {
                ctx.globalAlpha = Math.max(0, point.alpha) * 0.34 * ((index + 1) / this.trail.length);
                ctx.fillStyle = '#9ee7ff';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4 + index * 0.18, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        drawBall(ctx) {
            const ball = this.ball;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 6, 20, 0.38)';
            ctx.beginPath();
            ctx.arc(ball.x + 3, ball.y + 4, ball.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            const gradient = ctx.createRadialGradient(ball.x - 4, ball.y - 5, 2, ball.x, ball.y, ball.r + 3);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.45, '#dce8ff');
            gradient.addColorStop(1, '#46556a');
            ctx.save();
            if (!this.motionIsReduced()) {
                ctx.shadowColor = '#bff6ff';
                ctx.shadowBlur = 8;
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        drawParticles(ctx) {
            if (this.motionIsReduced()) return;
            ctx.save();
            this.particles.forEach((particle) => {
                ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2.2, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        drawPlayfieldHud(ctx) {
            // Franja fina sobre el gabinete: no invade el recorrido de la bola.
            ctx.save();
            ctx.fillStyle = 'rgba(1, 18, 62, 0.88)';
            ctx.strokeStyle = 'rgba(205, 244, 255, 0.85)';
            ctx.lineWidth = 1;
            ctx.fillRect(102, 8, 316, 24);
            ctx.strokeRect(102.5, 8.5, 315, 23);
            ctx.font = '700 11px Tahoma, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(`${this.intlLocale === 'en-US' ? 'LEVEL' : 'NIVEL'} ${this.level}`, 112, 20.5);
            ctx.textAlign = 'center';
            ctx.fillText(`MULTI x${this.formatMultiplier(this.playfieldMultiplier())}`, WIDTH / 2, 20.5);
            ctx.textAlign = 'right';
            if (this.tilted) {
                ctx.fillStyle = '#ffcf6c';
                ctx.fillText('TILT', 408, 20.5);
            } else if (this.ballSaveAvailable && this.state === 'playing') {
                const remaining = Math.max(0, BALL_SAVE_SECONDS - this.ballAge);
                ctx.fillStyle = '#9cff7a';
                ctx.fillText(`SAVE ${remaining.toFixed(1)}s`, 408, 20.5);
            } else {
                ctx.fillStyle = '#d9f7ff';
                ctx.fillText(`${this.intlLocale === 'en-US' ? 'BALLS' : 'BOLAS'} ${this.balls}`, 408, 20.5);
            }
            ctx.restore();
        }

        drawPlayfieldDisplay(ctx) {
            // Display impreso en la mesa, entre los slingshots: misión y anuncios.
            const mission = this.currentMission();
            const banner = [...this.effects].reverse().find((effect) => effect.banner);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (banner) {
                const ratio = Math.max(0, banner.life / banner.maxLife);
                ctx.globalAlpha = Math.min(1, ratio * 1.6);
                ctx.fillStyle = '#04122f';
                ctx.strokeStyle = 'rgba(255, 231, 107, 0.85)';
                ctx.lineWidth = 1.5;
                ctx.fillRect(164, 502, 192, 44);
                ctx.strokeRect(164.5, 502.5, 191, 43);
                ctx.fillStyle = '#ffe76b';
                ctx.font = '700 14px Tahoma, sans-serif';
                ctx.fillText(banner.text, WIDTH / 2, 524, 180);
            } else {
                ctx.fillStyle = 'rgba(206, 241, 246, 0.62)';
                ctx.font = '700 9.5px Tahoma, sans-serif';
                ctx.fillText(`${this.t(mission.name)}  ${this.missionProgress}/${mission.goal}`, WIDTH / 2, 546, 150);
            }
            ctx.restore();
        }

        drawEffects(ctx) {
            ctx.save();
            ctx.textAlign = 'center';
            this.effects.forEach((effect) => {
                if (effect.banner) return;
                const ratio = Math.max(0, effect.life / effect.maxLife);
                ctx.globalAlpha = Math.min(1, ratio * 1.35);
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#003c8f';
                ctx.lineWidth = 3;
                ctx.font = '700 15px Tahoma, sans-serif';
                const rise = this.motionIsReduced() ? 0 : (1 - ratio) * 25;
                const y = effect.y - rise;
                ctx.strokeText(effect.text, effect.x, y);
                ctx.fillText(effect.text, effect.x, y);
            });
            ctx.restore();
        }

        drawMessage(ctx) {
            let title = 'Arrastrá o mantené Espacio';
            let subtitle = 'Soltá entre 76% y 90% para el skill shot';
            if (this.state === 'gameover') {
                title = 'Game over';
                subtitle = 'Iniciar o R para una nueva partida';
            } else if (this.state === 'paused') {
                title = 'Pausa';
                subtitle = 'P o Reanudar para continuar';
            } else if (this.state === 'charging') {
                title = 'Soltá para lanzar';
                subtitle = this.charge >= 0.76 && this.charge <= 0.9 ? 'Zona de SKILL SHOT' : `Potencia ${Math.round(this.charge * 100)}%`;
            } else if (this.pendingAutoLaunch) {
                title = 'Bola salvada';
                subtitle = 'Relanzamiento automático';
            }

            ctx.save();
            ctx.fillStyle = 'rgba(3, 14, 52, 0.75)';
            ctx.strokeStyle = '#d7f2ff';
            ctx.lineWidth = 2;
            ctx.fillRect(88, 274, 344, 92);
            ctx.strokeRect(88.5, 274.5, 343, 91);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '700 19px Tahoma, sans-serif';
            ctx.fillText(this.t(title), WIDTH / 2, 312, 320);
            ctx.font = '12px Tahoma, sans-serif';
            ctx.fillText(this.t(subtitle), WIDTH / 2, 338, 320);
            ctx.restore();
        }

        ensureAudio() {
            if (this.muted) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            if (!this.audio) this.audio = new AudioContext();
            if (this.audio.state === 'suspended') this.audio.resume?.().catch(() => {});
        }

        playTone(frequency, duration, type = 'sine', gain = 0.04, delay = 0) {
            if (this.muted || !this.audio || this.audio.state === 'closed') return;
            const startAt = this.audio.currentTime + Math.max(0, delay);
            const stopAt = startAt + Math.max(0.02, duration);
            const oscillator = this.audio.createOscillator();
            const volume = this.audio.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(Math.max(40, frequency), startAt);
            volume.gain.setValueAtTime(0.0001, startAt);
            volume.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), startAt + 0.006);
            volume.gain.exponentialRampToValueAtTime(0.0001, stopAt);
            oscillator.connect(volume);
            volume.connect(this.audio.destination);
            oscillator.start(startAt);
            oscillator.stop(stopAt + 0.01);
        }

        playChord(frequencies, duration = 0.08) {
            frequencies.forEach((frequency, index) => {
                this.playTone(frequency, duration, 'triangle', 0.032, index * 0.045);
            });
        }

        toggleSound() {
            this.muted = !this.muted;
            try {
                localStorage.setItem(SOUND_STORAGE_KEY, String(this.muted));
            } catch (error) {
                // El juego continúa aunque el navegador bloquee el almacenamiento.
            }
            if (!this.muted) {
                this.ensureAudio();
                this.playTone(540, 0.07, 'triangle', 0.035);
                this.announce('Sonido activado.');
            } else {
                this.announce('Sonido desactivado.');
            }
            this.updateHud();
        }

        haptic(pattern) {
            if (this.motionIsReduced() || !this.isWindowActive()) return;
            try {
                navigator.vibrate?.(pattern);
            } catch (error) {
                // La vibración es una mejora opcional.
            }
        }

        async toggleFullscreen() {
            const current = document.fullscreenElement || document.webkitFullscreenElement;
            try {
                if (current && (current === this.tableWrap || this.tableWrap.contains(current))) {
                    const exit = document.exitFullscreen || document.webkitExitFullscreen;
                    await exit?.call(document);
                } else {
                    const request = this.tableWrap.requestFullscreen || this.tableWrap.webkitRequestFullscreen;
                    if (!request) throw new Error('Pantalla completa no disponible');
                    await request.call(this.tableWrap);
                }
            } catch (error) {
                this.announce('El navegador no permitió abrir pantalla completa.');
                this.showEffect('Pantalla completa no disponible');
            }
            this.updateFullscreenControl();
        }

        updateFullscreenControl() {
            if (!this.fullscreenButton) return;
            const current = document.fullscreenElement || document.webkitFullscreenElement;
            const active = Boolean(current && (current === this.tableWrap || this.tableWrap.contains(current)));
            this.fullscreenButton.textContent = active ? 'Salir de pantalla completa' : 'Pantalla completa';
            this.fullscreenButton.setAttribute('aria-pressed', String(active));
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.persistHighScore();
            this.stopLoop();
            this.abortController.abort();
            this.windowObserver?.disconnect();
            this.resizeObserver?.disconnect();
            if (this.motionQuery && typeof this.motionQuery.removeEventListener !== 'function') {
                this.motionQuery.removeListener?.(this.boundMotionChange);
            }
            this.tableLayer = null;
            this.clearControls(false);
            this.liveRegion?.remove();
            this.liveRegion = null;
            if (this.audio && this.audio.state !== 'closed') this.audio.close?.().catch(() => {});
            this.audio = null;
        }
    }

    function resolveRoot(scope) {
        if (!scope) return null;
        if (scope.matches?.('[data-pinball-root]')) return scope;
        return scope.querySelector?.('[data-pinball-root]') || null;
    }

    window.initPinballApp = function initPinballApp(scope = document) {
        const root = resolveRoot(scope) || resolveRoot(document);
        if (!root) return null;
        const owner = root.closest('.window') || root;
        const previous = owner._pinballApp || root._pinballApp;
        previous?.destroy();
        const app = new PinballApp(owner, root);
        owner._pinballApp = app;
        root._pinballApp = app;
        app.init();
        return app;
    };

    window.destroyPinballApp = function destroyPinballApp(scope = document) {
        const root = resolveRoot(scope);
        const owner = root?.closest('.window') || scope;
        const app = scope?._pinballApp || owner?._pinballApp || root?._pinballApp;
        if (!app) return;
        app.destroy();
        if (owner) owner._pinballApp = null;
        if (root) root._pinballApp = null;
    };
})();
