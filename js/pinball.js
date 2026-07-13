(function () {
    'use strict';

    const STORAGE_KEY = 'zarateXP.pinball.highScore';
    const SOUND_STORAGE_KEY = 'zarateXP.pinball.muted';
    const TABLE_ASSET = './assets/images/game/pinball-table-xp-hd.png';
    const WIDTH = 520;
    const HEIGHT = 700;
    const FIXED_STEP = 1 / 180;
    const MAX_FRAME_DELTA = 0.05;
    const MAX_PHYSICS_STEPS = 10;
    const MAX_BALL_SPEED = 1580;
    const BALL_SAVE_SECONDS = 7;
    const COMBO_SECONDS = 1.85;
    const EXTRA_BALL_SCORES = [30000, 80000, 160000];
    const CONTROL_KEYS = new Set([
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown',
        'a',
        'd',
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
            this.ballSearchTriggered = false;
            this.secondsSincePlayerInput = 0;
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
            this.flipperCooldown = { left: 0, right: 0 };
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

            this.staticSegments = [
                this.segment(36, 126, 96, 44, 9, 0.9),
                this.segment(96, 44, 410, 44, 9, 0.92),
                this.segment(410, 44, 486, 122, 9, 0.9),
                this.segment(36, 126, 36, 504, 10, 0.86),
                this.segment(486, 122, 486, 642, 10, 0.86),
                this.segment(36, 504, 92, 575, 10, 0.85),
                this.segment(442, 510, 428, 574, 10, 0.85),
                this.segment(92, 575, 160, 616, 9, 0.86),
                this.segment(428, 574, 360, 616, 9, 0.86),
                this.segment(52, 662, 198, 662, 12, 0.78),
                this.segment(322, 662, 468, 662, 12, 0.78),
                this.segment(122, 514, 180, 588, 12, 1.02, 140, 'Sling izquierda'),
                this.segment(398, 514, 340, 588, 12, 1.02, 140, 'Sling derecha'),
                this.segment(442, 104, 442, 612, 7, 0.8),
                this.segment(458, 104, 488, 88, 8, 1)
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

            this.background = new Image();
            this.background.decoding = 'async';
            this.background.onload = () => {
                if (!this.destroyed) this.draw();
            };
            this.background.src = TABLE_ASSET;
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
                help.textContent = 'Mantené Espacio, S o flecha abajo para cargar. A/D o flechas controlan los flippers. W o flecha arriba mueve la mesa. P pausa, M silencia y R reinicia.';
            }

            this.root.setAttribute('aria-label', 'Pinball XP Lab');
            this.canvas.tabIndex = 0;
            this.canvas.setAttribute('role', 'application');
            this.canvas.setAttribute('aria-label', 'Mesa de Pinball XP. En táctil, usá las zonas inferiores izquierda y derecha para los flippers, y el carril derecho para lanzar.');
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
            this.leftButton?.setAttribute('aria-keyshortcuts', 'A ArrowLeft');
            this.rightButton?.setAttribute('aria-keyshortcuts', 'D ArrowRight');
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
                const token = `${source}-${event.pointerId}`;
                this.setPointerControl(control, token, false);
            };

            this.listen(button, 'pointerdown', (event) => {
                event.preventDefault();
                this.ensureAudio();
                button.setPointerCapture?.(event.pointerId);
                this.setPointerControl(control, `${source}-${event.pointerId}`, true);
            });
            this.listen(button, 'pointerup', release);
            this.listen(button, 'pointercancel', release);
            this.listen(button, 'lostpointercapture', release);
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
                    if (!this.destroyed && this.isRenderable()) this.draw();
                });
                this.resizeObserver.observe(this.canvas);
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
            event.preventDefault();
            const token = `canvas-${event.pointerId}`;

            if (pressed) {
                this.ensureAudio();
                this.focusCanvas();
                this.canvas.setPointerCapture?.(event.pointerId);
                const point = this.canvasPoint(event);
                const control = this.controlAtPoint(point);
                if (control) {
                    this.canvasPointerControls.set(event.pointerId, control);
                    this.setPointerControl(control, token, true);
                } else if (event.pointerType === 'touch' && point.y < HEIGHT * 0.48) {
                    this.nudge();
                }
                return;
            }

            const control = this.canvasPointerControls.get(event.pointerId);
            if (control) this.setPointerControl(control, token, false);
            this.canvasPointerControls.delete(event.pointerId);
        }

        controlAtPoint(point) {
            if (point.x > WIDTH * 0.84 || point.y > HEIGHT * 0.91) return 'plunger';
            if (point.y > HEIGHT * 0.68 && point.x < WIDTH * 0.47) return 'left';
            if (point.y > HEIGHT * 0.68 && point.x > WIDTH * 0.53) return 'right';
            return null;
        }

        setPointerControl(control, token, pressed) {
            const sources = this.pointerSources[control];
            if (!sources) return;
            const wasPressed = sources.size > 0;
            if (pressed) sources.add(token);
            else sources.delete(token);
            const isPressed = sources.size > 0;

            if (control === 'plunger' && wasPressed !== isPressed) {
                if (isPressed) this.beginCharge();
                else if (!this.isPlungerPressed()) this.releaseCharge();
            }
            this.updateControlStates();
        }

        clearControls(cancelCharge = false) {
            this.keys.clear();
            Object.values(this.pointerSources).forEach((sources) => sources.clear());
            this.canvasPointerControls.clear();
            if (cancelCharge && this.state === 'charging') {
                this.state = 'ready';
                this.charge = 0;
                this.chargeDirection = 1;
                this.updateHud();
            }
            this.updateControlStates();
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
            const width = rect.width || WIDTH;
            const height = rect.height || HEIGHT;
            return {
                x: ((event.clientX - rect.left) / width) * WIDTH,
                y: ((event.clientY - rect.top) / height) * HEIGHT
            };
        }

        resizeCanvas() {
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
            this.ballSearchTriggered = false;
            this.secondsSincePlayerInput = 0;
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
            this.flipperCooldown.left = 0;
            this.flipperCooldown.right = 0;
        }

        resetBall({ newBall = true } = {}) {
            this.ball = {
                x: 470,
                y: 632,
                vx: 0,
                vy: 0,
                r: 9.5,
                safeTime: 0.08,
                inLauncherLane: true
            };
            this.ballAge = 0;
            this.launchPower = 0;
            this.skillShotPending = false;
            this.ballSearchTriggered = false;
            this.secondsSincePlayerInput = 0;
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
                this.state = 'ready';
                this.charge = 0;
                this.chargeDirection = 1;
                this.updateHud();
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
            this.ball.x = 470;
            this.ball.y = 632;
            this.ball.vx = -12 - clamped * 14;
            this.ball.vy = -800 - clamped * 550;
            this.ball.safeTime = 0.08;
            this.ball.inLauncherLane = true;
            this.ballAge = 0;
            if (chargedByPlayer) this.registerPlayerInput();
            this.ballSaveAvailable = enableBallSave && !this.ballSaveUsed;
            this.launchPower = clamped;
            this.skillShotPending = true;
            this.charge = 0;
            this.chargeDirection = 1;
            this.accumulator = 0;
            this.playTone(220 + clamped * 340, 0.09, 'triangle', 0.05);
            this.showEffect(`Lanzamiento ${Math.round(clamped * 100)}%`);
            this.haptic(18);
            this.updateHud();
        }

        updateCharge(dt) {
            if (this.state === 'charging') {
                this.charge += this.chargeDirection * dt * 0.72;
                if (this.charge >= 1) {
                    this.charge = 1;
                    this.chargeDirection = -1;
                } else if (this.charge <= 0.14) {
                    this.charge = 0.14;
                    this.chargeDirection = 1;
                }
            } else if (this.charge > 0 && this.state !== 'playing') {
                this.charge = Math.max(0, this.charge - dt * 0.9);
            }
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
            const previousLeft = this.leftFlipper;
            const previousRight = this.rightFlipper;
            this.leftFlipper = this.updateFlipper(this.leftFlipper, leftPressed, dt);
            this.rightFlipper = this.updateFlipper(this.rightFlipper, rightPressed, dt);
            this.leftFlipperSpeed = (this.leftFlipper - previousLeft) / Math.max(dt, 0.001);
            this.rightFlipperSpeed = (this.rightFlipper - previousRight) / Math.max(dt, 0.001);

            this.updateCharge(dt);
            this.updateTimers(dt);

            if (this.state !== 'playing') {
                this.accumulator = 0;
                return;
            }

            this.accumulator = Math.min(this.accumulator + dt, FIXED_STEP * MAX_PHYSICS_STEPS);
            let steps = 0;
            while (this.accumulator >= FIXED_STEP && steps < MAX_PHYSICS_STEPS && this.state === 'playing') {
                this.physicsStep(FIXED_STEP, leftPressed, rightPressed);
                this.accumulator -= FIXED_STEP;
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

        updateFlipper(current, pressed, dt) {
            const target = pressed ? 1 : 0;
            const speed = pressed ? 18 : 12;
            return current + (target - current) * Math.min(1, speed * dt);
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
                if (!this.ballSearchTriggered && this.secondsSincePlayerInput >= 18) {
                    this.ballSearchTriggered = true;
                    this.showEffect('BALL SEARCH');
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
            this.ballAge += dt;
            this.secondsSincePlayerInput += dt;
            this.updatePhysicsTimers(dt);
            this.integrateBall(dt);
            this.resolveLauncherLane();
            if (!this.ball.inLauncherLane) {
                this.collideStaticSegments();
                this.collideBumpers();
                this.collideTargets();
                this.collideSpinner(dt);
                this.collideRollovers();
                this.collideFlippers(leftPressed, rightPressed);
            }
            this.clampBallVelocity();
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
            this.spinner.speed *= Math.pow(0.78, dt * 8);
            this.spinner.angle += this.spinner.speed * dt;
            this.flipperCooldown.left = Math.max(0, this.flipperCooldown.left - dt);
            this.flipperCooldown.right = Math.max(0, this.flipperCooldown.right - dt);
        }

        integrateBall(dt) {
            const ball = this.ball;
            const unattendedSeconds = Math.max(0, this.secondsSincePlayerInput - 18);
            const searchStrength = Math.min(1, unattendedSeconds / 8);
            const extraGravity = Math.min(1400, unattendedSeconds * 115);
            ball.vy += (835 + extraGravity) * dt;
            if (searchStrength > 0 && ball.y > 360 && !ball.inLauncherLane) {
                ball.vx += (WIDTH / 2 - ball.x) * searchStrength * 1.15 * dt;
            }
            ball.vx *= Math.pow(0.991, dt * 60);
            ball.vy *= Math.pow(0.995, dt * 60);
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            ball.safeTime = Math.max(0, ball.safeTime - dt);
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

            const laneLeft = 461;
            const laneRight = 479;
            if (ball.x < laneLeft) {
                ball.x = laneLeft;
                ball.vx = Math.abs(ball.vx) * 0.3;
            } else if (ball.x > laneRight) {
                ball.x = laneRight;
                ball.vx = -Math.abs(ball.vx) * 0.3;
            }

            // La compuerta es unidireccional: durante el lanzamiento la bola viaja
            // por delante de los rails visuales y se sirve dentro del playfield.
            if (ball.y <= 124 && ball.vy < 0) {
                ball.inLauncherLane = false;
                ball.x = 424;
                ball.y = 108;
                ball.vx = -255 - this.launchPower * 105;
                ball.vy = 105 + (1 - this.launchPower) * 70;
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
                if (!hit || !segment.label || segment.cooldown > 0 || hit.impact < 75) return;
                segment.cooldown = 0.16;
                this.addScore(90, segment.label, (segment.a.x + segment.b.x) / 2, (segment.a.y + segment.b.y) / 2);
                this.playTone(250, 0.035, 'triangle', 0.025);
            });
        }

        collideBumpers() {
            this.bumpers.forEach((bumper) => {
                const ballSearchActive = this.secondsSincePlayerInput >= 18;
                const hit = this.collideCircle(
                    bumper.x,
                    bumper.y,
                    bumper.r,
                    ballSearchActive ? 0.88 : 0.98,
                    ballSearchActive ? 90 : 350
                );
                if (!hit || bumper.cooldown > 0 || hit.impact < 35) return;
                bumper.cooldown = 0.18;
                this.addScore(bumper.value, 'Bumper', bumper.x, bumper.y);
                this.flash = this.motionIsReduced() ? 0 : 1;
                this.shake = this.motionIsReduced() ? 0 : 4.5;
                this.emitParticles(bumper.x, bumper.y, bumper.color, 16);
                this.playTone(610 + Math.random() * 250, 0.07, 'square', 0.043);
                this.haptic(10);
            });
        }

        collideTargets() {
            this.targets.forEach((target) => {
                const hit = this.collideCircle(target.x, target.y, target.r, 0.82, 205);
                if (!hit || target.cooldown > 0 || hit.impact < 35) return;
                target.cooldown = 0.16;
                if (!target.active) return;
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
                if (this.hasRecentPlayerInput()) {
                    this.playfieldBoost = Math.min(2, this.playfieldBoost + 0.5);
                    this.boostRemaining = 20;
                }
                const bonus = 1100 + this.level * 180;
                this.addScore(bonus, 'Lanes XP', WIDTH / 2, 112, { affectsCombo: false, useCombo: false });
                if (this.hasRecentPlayerInput()) {
                    this.showEffect('MULTI +0,5 POR 20s');
                    this.announce('Lanes XP completas. Multiplicador aumentado durante 20 segundos.');
                }
                this.updateHud();
            }
        }

        collideSpinner(dt) {
            const half = this.spinner.width / 2;
            const cos = Math.cos(this.spinner.angle);
            const sin = Math.sin(this.spinner.angle);
            const segment = this.segment(
                this.spinner.x - cos * half,
                this.spinner.y - sin * half,
                this.spinner.x + cos * half,
                this.spinner.y + sin * half,
                6,
                0.64,
                70
            );
            const hit = this.collideSegment(segment);
            if (!hit || this.spinner.cooldown > 0 || hit.impact < 28) return;
            this.spinner.cooldown = 0.105;
            this.spinner.speed += Math.min(34, 16 + hit.impact * 0.025);
            this.spinnerChain += 1;
            this.addScore(170, 'Spinner', this.spinner.x, this.spinner.y);
            this.advanceMission('spinner', this.spinner.x, this.spinner.y);
            this.playTone(700 + Math.min(260, this.spinnerChain * 22), Math.max(0.028, dt * 2), 'sine', 0.027);

            if (this.spinnerChain >= 8) {
                this.spinnerChain = 0;
                const jackpot = 3200 + this.level * 350;
                const awarded = this.addScore(jackpot, 'Spinner jackpot', this.spinner.x, this.spinner.y, { affectsCombo: false, useCombo: false });
                this.showEffect(`JACKPOT +${awarded}`);
                this.emitParticles(this.spinner.x, this.spinner.y, '#ffef6e', 24);
                this.playChord([740, 925, 1110], 0.07);
            }
        }

        collideFlippers(leftPressed, rightPressed) {
            const left = this.flipperSegment('left');
            const right = this.flipperSegment('right');
            const leftHit = this.collideSegment(left);
            const rightHit = this.collideSegment(right);

            if (leftHit && this.flipperCooldown.left === 0) {
                this.applyFlipperKick('left', leftHit, leftPressed, this.leftFlipperSpeed);
            }
            if (rightHit && this.flipperCooldown.right === 0) {
                this.applyFlipperKick('right', rightHit, rightPressed, this.rightFlipperSpeed);
            }
        }

        applyFlipperKick(side, hit, pressed, flipperSpeed) {
            const activeKick = pressed && flipperSpeed > 0.25;
            if (!activeKick) return;
            const tipFactor = 0.35 + hit.t * 0.65;
            const verticalKick = 335 + Math.min(370, flipperSpeed * 34) * tipFactor;
            const horizontalKick = 105 + 95 * tipFactor;
            this.ball.vy -= verticalKick;
            this.ball.vx += side === 'left' ? horizontalKick : -horizontalKick;
            this.flipperCooldown[side] = 0.055;
            this.playTone(205, 0.035, 'square', 0.028);
            this.haptic(7);
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

        collideCircle(cx, cy, radius, restitution, impulse) {
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
                ball.vx -= (1 + restitution) * normalVelocity * nx;
                ball.vy -= (1 + restitution) * normalVelocity * ny;
            }
            if (impact > 5 && impulse > 0) {
                ball.vx += nx * impulse;
                ball.vy += ny * impulse;
            }
            return { nx, ny, impact };
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
                ball.vx -= (1 + segment.restitution) * normalVelocity * nx;
                ball.vy -= (1 + segment.restitution) * normalVelocity * ny;
            }
            if (impact > 5 && segment.impulse > 0) {
                ball.vx += nx * segment.impulse;
                ball.vy += ny * segment.impulse;
            }
            return { nx, ny, t, impact };
        }

        advanceMission(type, x, y) {
            if (!this.hasRecentPlayerInput()) return;
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
            const shouldReconcile = !this.playerEngaged || this.secondsSincePlayerInput > 6;
            this.secondsSincePlayerInput = 0;
            this.ballSearchTriggered = false;
            if (shouldReconcile) this.markPlayerEngaged();
        }

        markPlayerEngaged() {
            this.playerEngaged = true;
            this.recordHighScore();
            this.checkExtraBall(0, this.score);
            this.updateHud();
        }

        hasRecentPlayerInput(windowSeconds = 6) {
            return this.playerEngaged && this.secondsSincePlayerInput <= windowSeconds;
        }

        playfieldMultiplier() {
            return Math.min(6, this.basePlayfieldMultiplier() + this.playfieldBoost);
        }

        addScore(points, label, x, y, options = {}) {
            if (this.tilted && options.allowTilted !== true) return 0;
            const affectsCombo = options.affectsCombo !== false && this.hasRecentPlayerInput();
            if (affectsCombo) {
                this.combo = this.comboRemaining > 0 ? Math.min(8, this.combo + 0.25) : 1;
                this.comboRemaining = COMBO_SECONDS;
            }

            const multiplier = options.multiplier != null
                ? Number(options.multiplier)
                : this.playfieldMultiplier() * (options.useCombo === false ? 1 : this.combo);
            const participationFactor = this.hasRecentPlayerInput() || options.allowUnengagedFullScore === true ? 1 : 0.25;
            const total = Math.max(0, Math.round(points * multiplier * participationFactor));
            const previousScore = this.score;
            this.score += total;
            this.recordHighScore();
            this.checkExtraBall(previousScore, this.score);
            if (options.quiet !== true) this.showFloatingText(`+${total}`, x, y, label);
            this.updateHud();
            return total;
        }

        checkExtraBall(previousScore, nextScore) {
            if (!this.hasRecentPlayerInput()) return;
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
            if (!this.hasRecentPlayerInput()) return;
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

        flipperSegment(side) {
            const isLeft = side === 'left';
            const amount = isLeft ? this.leftFlipper : this.rightFlipper;
            const pivot = isLeft ? { x: 178, y: 628 } : { x: 342, y: 628 };
            const length = 65;
            const rest = isLeft ? 0.18 : Math.PI - 0.18;
            const active = isLeft ? -0.58 : Math.PI + 0.58;
            const angle = rest + (active - rest) * amount;
            return this.segment(
                pivot.x,
                pivot.y,
                pivot.x + Math.cos(angle) * length,
                pivot.y + Math.sin(angle) * length,
                7.5,
                0.88,
                0
            );
        }

        isLeftPressed() {
            return this.keys.has('arrowleft') || this.keys.has('a') || this.pointerSources.left.size > 0;
        }

        isRightPressed() {
            return this.keys.has('arrowright') || this.keys.has('d') || this.pointerSources.right.size > 0;
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
            if (this.background.complete && this.background.naturalWidth > 0) {
                ctx.drawImage(this.background, 0, 0, WIDTH, HEIGHT);
            } else {
                const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
                gradient.addColorStop(0, '#021d64');
                gradient.addColorStop(0.52, '#0754c4');
                gradient.addColorStop(1, '#031139');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }

            ctx.fillStyle = 'rgba(2, 7, 30, 0.19)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            if (this.flash > 0 && !this.motionIsReduced()) {
                ctx.fillStyle = `rgba(136, 230, 255, ${this.flash * 0.13})`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }

            ctx.save();
            ctx.globalAlpha = 0.36;
            ctx.strokeStyle = '#b8ecff';
            ctx.lineWidth = 2;
            this.staticSegments.forEach((segment) => {
                if (segment.label) return;
                ctx.beginPath();
                ctx.moveTo(segment.a.x, segment.a.y);
                ctx.lineTo(segment.b.x, segment.b.y);
                ctx.stroke();
            });
            ctx.restore();
            this.drawPlunger(ctx);
        }

        drawPlunger(ctx) {
            const pull = 34 * (this.state === 'charging' ? this.charge : 0);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.78)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(472, 148);
            ctx.lineTo(472, 640);
            ctx.stroke();

            const knobY = 646 + pull;
            const knob = ctx.createRadialGradient(464, knobY - 8, 4, 472, knobY, 18);
            knob.addColorStop(0, '#ffffff');
            knob.addColorStop(0.45, '#46a8ff');
            knob.addColorStop(1, '#022b83');
            ctx.fillStyle = knob;
            ctx.beginPath();
            ctx.arc(472, knobY, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.charge >= 0.76 && this.charge <= 0.9 ? '#fff173' : '#d7f2ff';
            ctx.lineWidth = this.charge >= 0.76 && this.charge <= 0.9 ? 4 : 2;
            ctx.stroke();

            if (this.state === 'charging') {
                ctx.fillStyle = 'rgba(3, 18, 64, 0.82)';
                ctx.fillRect(451, 490, 42, 116);
                ctx.fillStyle = 'rgba(255, 229, 87, 0.45)';
                ctx.fillRect(455, 501, 34, 16);
                ctx.fillStyle = '#5bd6ff';
                const fillHeight = 108 * this.charge;
                ctx.fillRect(455, 602 - fillHeight, 34, fillHeight);
                ctx.strokeStyle = '#d9f7ff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(451.5, 490.5, 41, 115);
            }
            ctx.restore();
        }

        drawInteractiveLights(ctx) {
            this.bumpers.forEach((bumper) => {
                const pulse = bumper.cooldown > 0 ? Math.min(1, bumper.cooldown / 0.18) : 0;
                const radius = bumper.r + pulse * (this.motionIsReduced() ? 2 : 9);
                const gradient = ctx.createRadialGradient(bumper.x - 8, bumper.y - 10, 4, bumper.x, bumper.y, radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.35, bumper.color);
                gradient.addColorStop(1, 'rgba(0, 21, 61, 0.32)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, radius, 0, Math.PI * 2);
                ctx.fill();
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
            const left = this.flipperSegment('left');
            const right = this.flipperSegment('right');
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = 15;
            ctx.strokeStyle = this.tilted ? '#aeb7bf' : '#dff8ff';
            if (!this.motionIsReduced()) {
                ctx.shadowColor = this.tilted ? '#5b6770' : '#50c8ff';
                ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.moveTo(left.a.x, left.a.y);
            ctx.lineTo(left.b.x, left.b.y);
            ctx.moveTo(right.a.x, right.a.y);
            ctx.lineTo(right.b.x, right.b.y);
            ctx.stroke();
            ctx.lineWidth = 7;
            ctx.strokeStyle = this.tilted ? '#69737c' : '#63f564';
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.restore();
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
            const mission = this.currentMission();
            ctx.save();
            ctx.fillStyle = 'rgba(1, 18, 62, 0.83)';
            ctx.strokeStyle = 'rgba(205, 244, 255, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(102, 9, 316, 52);
            ctx.strokeRect(102.5, 9.5, 315, 51);
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 11px Tahoma, sans-serif';
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.fillText(`${this.intlLocale === 'en-US' ? 'LEVEL' : 'NIVEL'} ${this.level}`, 113, 27);
            ctx.textAlign = 'center';
            ctx.fillText(`MULTI x${this.formatMultiplier(this.playfieldMultiplier())}`, WIDTH / 2, 27);
            ctx.textAlign = 'right';
            if (this.tilted) {
                ctx.fillStyle = '#ffcf6c';
                ctx.fillText('TILT', 407, 27);
            } else if (this.ballSaveAvailable && this.state === 'playing') {
                const remaining = Math.max(0, BALL_SAVE_SECONDS - this.ballAge);
                ctx.fillStyle = '#9cff7a';
                ctx.fillText(`SAVE ${remaining.toFixed(1)}s`, 407, 27);
            } else {
                ctx.fillStyle = '#d9f7ff';
                ctx.fillText(`${this.intlLocale === 'en-US' ? 'BALLS' : 'BOLAS'} ${this.balls}`, 407, 27);
            }
            ctx.fillStyle = '#d9f7ff';
            ctx.font = '10px Tahoma, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.t(mission.name)}  ${this.missionProgress}/${mission.goal}`, WIDTH / 2, 48);
            ctx.restore();
        }

        drawEffects(ctx) {
            ctx.save();
            ctx.textAlign = 'center';
            this.effects.forEach((effect) => {
                const ratio = Math.max(0, effect.life / effect.maxLife);
                ctx.globalAlpha = Math.min(1, ratio * 1.35);
                if (effect.banner) {
                    ctx.fillStyle = 'rgba(0, 18, 63, 0.79)';
                    ctx.strokeStyle = 'rgba(210, 247, 255, 0.9)';
                    ctx.lineWidth = 2;
                    ctx.fillRect(86, effect.y - 28, 348, 56);
                    ctx.strokeRect(86.5, effect.y - 27.5, 347, 55);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '700 17px Tahoma, sans-serif';
                    ctx.fillText(effect.text, effect.x, effect.y + 6, 326);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#003c8f';
                    ctx.lineWidth = 3;
                    ctx.font = '700 16px Tahoma, sans-serif';
                    const rise = this.motionIsReduced() ? 0 : (1 - ratio) * 25;
                    const y = effect.y - rise;
                    ctx.strokeText(effect.text, effect.x, y);
                    ctx.fillText(effect.text, effect.x, y);
                    if (effect.label) {
                        ctx.font = '11px Tahoma, sans-serif';
                        ctx.fillText(effect.label, effect.x, y + 15);
                    }
                }
            });
            ctx.restore();
        }

        drawMessage(ctx) {
            let title = 'Mantené Espacio';
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
            this.background.onload = null;
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
