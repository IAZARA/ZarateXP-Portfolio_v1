(function () {
    const STORAGE_KEY = 'zarateXP.pinball.highScore';
    const TABLE_ASSET = './assets/images/game/pinball-table-xp-hd.png';
    const WIDTH = 520;
    const HEIGHT = 700;

    class PinballApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-pinball-root]');
            this.canvas = this.root.querySelector('[data-pinball-canvas]');
            this.ctx = this.canvas.getContext('2d');
            this.scoreEl = this.root.querySelector('[data-pinball-score]');
            this.highScoreEl = this.root.querySelector('[data-pinball-highscore]');
            this.ballsEl = this.root.querySelector('[data-pinball-balls]');
            this.stateEl = this.root.querySelector('[data-pinball-state]');
            this.comboEl = this.root.querySelector('[data-pinball-combo]');
            this.chargeEl = this.root.querySelector('[data-pinball-charge]');
            this.keys = new Set();
            this.pointerControls = { left: false, right: false, plunger: false };
            this.score = 0;
            this.highScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
            this.balls = 3;
            this.state = 'ready';
            this.charge = 0;
            this.combo = 1;
            this.lastHitAt = 0;
            this.flash = 0;
            this.shake = 0;
            this.particles = [];
            this.trail = [];
            this.effects = [];
            this.raf = null;
            this.lastTime = 0;
            this.destroyed = false;
            this.audio = null;

            this.background = new Image();
            this.background.onload = () => this.draw();
            this.background.src = TABLE_ASSET;

            this.bumpers = [
                { x: 180, y: 210, r: 30, value: 500, color: '#4bd2ff', cooldown: 0 },
                { x: 260, y: 170, r: 33, value: 750, color: '#6df27c', cooldown: 0 },
                { x: 342, y: 210, r: 30, value: 500, color: '#9cff44', cooldown: 0 },
                { x: 155, y: 430, r: 22, value: 350, color: '#6df27c', cooldown: 0 },
                { x: 365, y: 430, r: 22, value: 350, color: '#57c8ff', cooldown: 0 }
            ];

            this.targets = [
                { x: 230, y: 312, r: 17, value: 300, active: true },
                { x: 260, y: 360, r: 17, value: 300, active: true },
                { x: 290, y: 408, r: 17, value: 300, active: true },
                { x: 126, y: 488, r: 15, value: 450, active: true },
                { x: 394, y: 488, r: 15, value: 450, active: true }
            ];

            this.rollovers = [
                { x: 172, y: 92, r: 12, value: 250, active: true },
                { x: 260, y: 92, r: 12, value: 250, active: true },
                { x: 348, y: 92, r: 12, value: 250, active: true }
            ];

            this.staticSegments = [
                this.segment(36, 126, 96, 44, 9, 0.9),
                this.segment(96, 44, 410, 44, 9, 0.92),
                this.segment(410, 44, 486, 122, 9, 0.9),
                this.segment(36, 126, 36, 504, 10, 0.86),
                this.segment(486, 122, 486, 642, 10, 0.86),
                this.segment(36, 504, 92, 575, 10, 0.85),
                this.segment(486, 510, 428, 574, 10, 0.85),
                this.segment(92, 575, 160, 616, 9, 0.86),
                this.segment(428, 574, 360, 616, 9, 0.86),
                this.segment(52, 662, 198, 662, 12, 0.78),
                this.segment(322, 662, 468, 662, 12, 0.78),
                this.segment(122, 514, 180, 588, 12, 1.08, 180, 'Sling izquierda'),
                this.segment(398, 514, 340, 588, 12, 1.08, 180, 'Sling derecha'),
                this.segment(442, 104, 442, 612, 7, 0.8),
                this.segment(458, 104, 488, 88, 8, 1.0)
            ];

            this.spinner = {
                x: 260,
                y: 262,
                width: 62,
                angle: 0,
                speed: 0,
                cooldown: 0
            };

            this.boundKeyDown = (event) => this.handleKey(event, true);
            this.boundKeyUp = (event) => this.handleKey(event, false);
            this.boundVisibility = () => {
                if (document.hidden && this.state === 'playing') this.pause();
            };
        }

        init() {
            this.resizeCanvas();
            this.resetGame();
            this.bindControls();
            window.addEventListener('keydown', this.boundKeyDown);
            window.addEventListener('keyup', this.boundKeyUp);
            document.addEventListener('visibilitychange', this.boundVisibility);
            this.lastTime = performance.now();
            this.raf = window.requestAnimationFrame((time) => this.loop(time));
        }

        bindControls() {
            this.root.querySelector('[data-pinball-start]')?.addEventListener('click', () => this.start());
            this.root.querySelector('[data-pinball-reset]')?.addEventListener('click', () => this.resetGame());
            this.root.querySelector('[data-pinball-pause]')?.addEventListener('click', () => this.togglePause());
            this.bindPadButton('[data-pinball-left]', 'left');
            this.bindPadButton('[data-pinball-right]', 'right');
            this.bindPadButton('[data-pinball-plunger]', 'plunger');
            this.canvas.addEventListener('pointerdown', (event) => this.handleCanvasPointer(event, true));
            this.canvas.addEventListener('pointerup', (event) => this.handleCanvasPointer(event, false));
            this.canvas.addEventListener('pointercancel', (event) => this.handleCanvasPointer(event, false));
            this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
        }

        bindPadButton(selector, control) {
            const button = this.root.querySelector(selector);
            if (!button) return;
            const set = (event, pressed) => {
                event.preventDefault();
                this.pointerControls[control] = pressed;
                if (control === 'plunger') {
                    if (pressed) this.beginCharge();
                    else this.releaseCharge();
                }
            };
            button.addEventListener('pointerdown', (event) => {
                button.setPointerCapture?.(event.pointerId);
                set(event, true);
            });
            button.addEventListener('pointerup', (event) => set(event, false));
            button.addEventListener('pointercancel', (event) => set(event, false));
            button.addEventListener('lostpointercapture', () => {
                this.pointerControls[control] = false;
            });
        }

        resizeCanvas() {
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.round(WIDTH * this.dpr);
            this.canvas.height = Math.round(HEIGHT * this.dpr);
        }

        resetGame() {
            this.score = 0;
            this.balls = 3;
            this.combo = 1;
            this.charge = 0;
            this.state = 'ready';
            this.targets.forEach((target) => { target.active = true; });
            this.rollovers.forEach((rollover) => { rollover.active = true; });
            this.particles.length = 0;
            this.trail.length = 0;
            this.resetBall();
            this.showEffect('Listo para lanzar');
            this.updateHud();
        }

        resetBall() {
            this.ball = { x: 470, y: 633, vx: 0, vy: 0, r: 9.5, safeFrames: 10 };
            this.trail.length = 0;
            this.state = this.balls > 0 ? 'ready' : 'gameover';
        }

        start() {
            if (this.state === 'gameover') {
                this.resetGame();
                return;
            }
            if (this.state === 'paused') {
                this.state = 'playing';
                this.showEffect('Reanudado');
                this.updateHud();
                return;
            }
            if (this.state === 'ready' || this.state === 'charging') {
                this.launchBall(Math.max(this.charge, 0.72));
            }
        }

        pause() {
            if (this.state !== 'playing') return;
            this.state = 'paused';
            this.showEffect('Pausa');
            this.updateHud();
        }

        togglePause() {
            if (this.state === 'playing') this.pause();
            else if (this.state === 'paused') this.start();
        }

        beginCharge() {
            if (this.state !== 'ready' && this.state !== 'charging') return;
            this.state = 'charging';
        }

        releaseCharge() {
            if (this.state !== 'charging') return;
            this.launchBall(Math.max(this.charge, 0.38));
        }

        launchBall(power = 0.75) {
            this.ensureAudio();
            const clamped = Math.max(0.28, Math.min(power, 1));
            this.state = 'playing';
            this.ball.x = 470;
            this.ball.y = 632;
            this.ball.vx = -16;
            this.ball.vy = -760 - clamped * 520;
            this.ball.safeFrames = 8;
            this.charge = 0;
            this.playTone(220 + clamped * 320, 0.08, 'triangle', 0.05);
            this.showEffect('Lanzamiento ' + Math.round(clamped * 100) + '%');
            this.updateHud();
        }

        handleKey(event, isDown) {
            const key = event.key.toLowerCase();
            const controls = ['arrowleft', 'arrowright', 'a', 'd', ' ', 'arrowdown', 's', 'p', 'r'];
            if (controls.includes(key)) event.preventDefault();

            if (isDown) {
                if (event.repeat && key !== 'arrowleft' && key !== 'arrowright') return;
                this.keys.add(key);
                if (key === ' ' || key === 'arrowdown' || key === 's') this.beginCharge();
                if (key === 'p') this.togglePause();
                if (key === 'r') this.resetGame();
            } else {
                this.keys.delete(key);
                if (key === ' ' || key === 'arrowdown' || key === 's') this.releaseCharge();
            }
        }

        handleCanvasPointer(event, pressed) {
            const point = this.canvasPoint(event);
            if (pressed) this.canvas.setPointerCapture?.(event.pointerId);
            if (point.y > HEIGHT * 0.72 && point.x < WIDTH * 0.45) {
                this.pointerControls.left = pressed;
            } else if (point.y > HEIGHT * 0.72 && point.x > WIDTH * 0.55 && point.x < WIDTH * 0.84) {
                this.pointerControls.right = pressed;
            } else if (point.x > WIDTH * 0.84 || point.y > HEIGHT * 0.84) {
                this.pointerControls.plunger = pressed;
                if (pressed) this.beginCharge();
                else this.releaseCharge();
            }
        }

        canvasPoint(event) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: ((event.clientX - rect.left) / rect.width) * WIDTH,
                y: ((event.clientY - rect.top) / rect.height) * HEIGHT
            };
        }

        loop(time) {
            if (this.destroyed) return;
            const dt = Math.min(0.034, (time - this.lastTime) / 1000 || 0.016);
            this.lastTime = time;
            this.update(dt);
            this.draw();
            this.raf = window.requestAnimationFrame((next) => this.loop(next));
        }

        update(dt) {
            const leftPressed = this.isLeftPressed();
            const rightPressed = this.isRightPressed();
            this.leftFlipper = this.updateFlipper(this.leftFlipper, leftPressed, dt);
            this.rightFlipper = this.updateFlipper(this.rightFlipper, rightPressed, dt);
            this.updateCharge(dt);
            this.updateTimers(dt);

            if (this.state !== 'playing') return;

            const steps = Math.max(1, Math.ceil(dt / 0.006));
            const step = dt / steps;
            for (let i = 0; i < steps; i += 1) {
                this.integrateBall(step);
                this.resolveLauncherLane();
                this.collideStaticSegments();
                this.collideBumpers();
                this.collideTargets();
                this.collideSpinner(step);
                this.collideRollovers();
                this.collideFlippers(leftPressed, rightPressed);
                this.checkDrain();
            }

            this.trail.push({ x: this.ball.x, y: this.ball.y, alpha: 1 });
            if (this.trail.length > 16) this.trail.shift();
        }

        updateFlipper(current, pressed, dt) {
            const target = pressed ? 1 : 0;
            const speed = pressed ? 13 : 9;
            const next = current == null ? 0 : current;
            return next + (target - next) * Math.min(1, speed * dt);
        }

        updateCharge(dt) {
            if (this.state === 'charging') {
                this.charge += dt * 0.9;
                if (this.charge > 1) this.charge = 0.2;
            } else if (this.charge > 0 && this.state !== 'playing') {
                this.charge = Math.max(0, this.charge - dt * 0.8);
            }
            if (this.chargeEl) this.chargeEl.style.width = `${Math.round(this.charge * 100)}%`;
        }

        updateTimers(dt) {
            this.bumpers.forEach((bumper) => {
                bumper.cooldown = Math.max(0, bumper.cooldown - dt);
            });
            this.spinner.cooldown = Math.max(0, this.spinner.cooldown - dt);
            this.spinner.speed *= Math.pow(0.82, dt * 8);
            this.spinner.angle += this.spinner.speed * dt;
            this.flash = Math.max(0, this.flash - dt * 2.4);
            this.shake = Math.max(0, this.shake - dt * 18);
            this.effects.forEach((effect) => { effect.life -= dt; });
            this.effects = this.effects.filter((effect) => effect.life > 0);
            this.particles.forEach((particle) => {
                particle.life -= dt;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 260 * dt;
            });
            this.particles = this.particles.filter((particle) => particle.life > 0);
            this.trail.forEach((point) => { point.alpha -= dt * 3; });
            this.trail = this.trail.filter((point) => point.alpha > 0);
            if (performance.now() - this.lastHitAt > 1800) this.combo = 1;
        }

        integrateBall(dt) {
            const b = this.ball;
            b.vy += 770 * dt;
            b.vx *= Math.pow(0.994, dt * 60);
            b.vy *= Math.pow(0.997, dt * 60);
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.safeFrames > 0) b.safeFrames -= 1;
        }

        resolveLauncherLane() {
            const b = this.ball;
            if (b.x > 440 && b.y > 94) {
                if (b.x - b.r < 452) {
                    b.x = 452 + b.r;
                    b.vx = Math.abs(b.vx) * 0.35;
                }
                if (b.x + b.r > 494) {
                    b.x = 494 - b.r;
                    b.vx = -Math.abs(b.vx) * 0.55;
                }
            }

            if (b.x > 432 && b.y < 94 && b.vy < 0) {
                b.x = 430;
                b.y = 92;
                b.vx = -260 - Math.random() * 100;
                b.vy = 120;
                this.playTone(520, 0.05, 'square', 0.035);
            }
        }

        collideStaticSegments() {
            this.staticSegments.forEach((segment) => {
                if (this.collideSegment(segment)) {
                    if (segment.label) {
                        this.addScore(60, segment.label, segment.a.x * 0.5 + segment.b.x * 0.5, segment.a.y * 0.5 + segment.b.y * 0.5);
                    }
                }
            });
        }

        collideBumpers() {
            this.bumpers.forEach((bumper) => {
                const hit = this.collideCircle(bumper.x, bumper.y, bumper.r, 1.06, 470);
                if (!hit || bumper.cooldown > 0) return;
                bumper.cooldown = 0.17;
                this.addScore(bumper.value, 'Bumper', bumper.x, bumper.y);
                this.flash = 1;
                this.shake = 4;
                this.emitParticles(bumper.x, bumper.y, bumper.color, 16);
                this.playTone(620 + Math.random() * 260, 0.07, 'square', 0.045);
            });
        }

        collideTargets() {
            this.targets.forEach((target) => {
                if (!target.active) return;
                if (!this.collideCircle(target.x, target.y, target.r, 0.86, 220)) return;
                target.active = false;
                this.addScore(target.value, 'Target', target.x, target.y);
                this.emitParticles(target.x, target.y, '#9cff44', 10);
                this.playTone(360, 0.05, 'triangle', 0.035);
            });

            if (this.targets.every((target) => !target.active)) {
                this.targets.forEach((target) => { target.active = true; });
                this.addScore(2500, 'Banco completo', WIDTH / 2, 300);
                this.shake = 6;
                this.flash = 1;
            }
        }

        collideRollovers() {
            this.rollovers.forEach((rollover) => {
                if (!rollover.active) return;
                if (!this.collideCircle(rollover.x, rollover.y, rollover.r, 0.7, 160)) return;
                rollover.active = false;
                this.addScore(rollover.value, 'Lane', rollover.x, rollover.y);
            });

            if (this.rollovers.every((rollover) => !rollover.active)) {
                this.rollovers.forEach((rollover) => { rollover.active = true; });
                this.addScore(1200, 'Lanes XP', WIDTH / 2, 88);
            }
        }

        collideSpinner(dt) {
            const half = this.spinner.width / 2;
            const segment = this.segment(this.spinner.x - half, this.spinner.y, this.spinner.x + half, this.spinner.y, 6, 0.62, 80);
            if (!this.collideSegment(segment) || this.spinner.cooldown > 0) return;
            this.spinner.cooldown = 0.12;
            this.spinner.speed += 20;
            this.addScore(150, 'Spinner', this.spinner.x, this.spinner.y);
            this.playTone(740, Math.max(0.025, dt * 2), 'sine', 0.026);
        }

        collideFlippers(leftPressed, rightPressed) {
            const left = this.flipperSegment('left');
            const right = this.flipperSegment('right');
            if (this.collideSegment(left)) {
                const boost = leftPressed ? 440 : 120;
                this.ball.vx += 120;
                this.ball.vy -= boost;
                this.addScore(25, 'Flip', left.b.x, left.b.y, true);
                if (leftPressed) this.playTone(210, 0.035, 'square', 0.028);
            }
            if (this.collideSegment(right)) {
                const boost = rightPressed ? 440 : 120;
                this.ball.vx -= 120;
                this.ball.vy -= boost;
                this.addScore(25, 'Flip', right.b.x, right.b.y, true);
                if (rightPressed) this.playTone(210, 0.035, 'square', 0.028);
            }
        }

        checkDrain() {
            if (this.ball.y <= HEIGHT + 38) return;
            this.balls -= 1;
            this.combo = 1;
            this.charge = 0;
            this.updateHud();
            if (this.balls <= 0) {
                this.state = 'gameover';
                this.resetBall();
                this.state = 'gameover';
                this.commitHighScore();
                this.showEffect('Game over');
            } else {
                this.resetBall();
                this.showEffect('Bola perdida');
            }
        }

        collideCircle(cx, cy, radius, restitution, impulse) {
            const b = this.ball;
            const dx = b.x - cx;
            const dy = b.y - cy;
            const dist = Math.hypot(dx, dy) || 0.001;
            const minDist = b.r + radius;
            if (dist >= minDist) return false;

            const nx = dx / dist;
            const ny = dy / dist;
            b.x = cx + nx * minDist;
            b.y = cy + ny * minDist;
            const velocity = b.vx * nx + b.vy * ny;
            if (velocity < 0) {
                b.vx -= (1 + restitution) * velocity * nx;
                b.vy -= (1 + restitution) * velocity * ny;
            }
            b.vx += nx * impulse;
            b.vy += ny * impulse;
            return true;
        }

        collideSegment(segment) {
            const b = this.ball;
            const abx = segment.b.x - segment.a.x;
            const aby = segment.b.y - segment.a.y;
            const lengthSquared = abx * abx + aby * aby || 1;
            const t = Math.max(0, Math.min(1, ((b.x - segment.a.x) * abx + (b.y - segment.a.y) * aby) / lengthSquared));
            const closest = {
                x: segment.a.x + abx * t,
                y: segment.a.y + aby * t
            };
            const dx = b.x - closest.x;
            const dy = b.y - closest.y;
            const distance = Math.hypot(dx, dy) || 0.001;
            const minDistance = b.r + segment.thickness;
            if (distance >= minDistance) return false;

            const nx = dx / distance;
            const ny = dy / distance;
            b.x = closest.x + nx * minDistance;
            b.y = closest.y + ny * minDistance;
            const velocity = b.vx * nx + b.vy * ny;
            if (velocity < 0) {
                b.vx -= (1 + segment.restitution) * velocity * nx;
                b.vy -= (1 + segment.restitution) * velocity * ny;
            }
            b.vx += nx * segment.impulse;
            b.vy += ny * segment.impulse;
            return true;
        }

        addScore(points, label, x, y, quiet = false) {
            const now = performance.now();
            if (now - this.lastHitAt < 1400) {
                this.combo = Math.min(8, this.combo + 0.25);
            } else {
                this.combo = 1;
            }
            this.lastHitAt = now;
            const total = Math.round(points * this.combo);
            this.score += total;
            if (!quiet) this.showFloatingText(`+${total}`, x, y, label);
            this.updateHud();
        }

        commitHighScore() {
            if (this.score <= this.highScore) return;
            this.highScore = this.score;
            localStorage.setItem(STORAGE_KEY, String(this.highScore));
        }

        updateHud() {
            this.commitHighScore();
            if (this.scoreEl) this.scoreEl.textContent = this.score.toLocaleString('es-AR');
            if (this.highScoreEl) this.highScoreEl.textContent = this.highScore.toLocaleString('es-AR');
            if (this.ballsEl) this.ballsEl.textContent = String(Math.max(0, this.balls));
            if (this.comboEl) this.comboEl.textContent = `x${this.combo.toFixed(this.combo % 1 ? 2 : 0)}`;
            if (this.stateEl) this.stateEl.textContent = this.stateLabel();
            if (this.chargeEl) this.chargeEl.style.width = `${Math.round(this.charge * 100)}%`;
        }

        stateLabel() {
            const labels = {
                ready: 'Listo',
                charging: 'Cargando',
                playing: 'En juego',
                paused: 'Pausa',
                gameover: 'Game over'
            };
            return labels[this.state] || 'Listo';
        }

        showFloatingText(text, x, y, label) {
            this.effects.push({ text, label, x, y, life: 0.85, maxLife: 0.85 });
        }

        showEffect(text) {
            this.effects.push({ text, x: WIDTH / 2, y: 318, life: 1.35, maxLife: 1.35, banner: true });
        }

        emitParticles(x, y, color, count) {
            for (let i = 0; i < count; i += 1) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 250;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 0.35 + Math.random() * 0.38
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
                label
            };
        }

        flipperSegment(side) {
            const isLeft = side === 'left';
            const amount = isLeft ? this.leftFlipper || 0 : this.rightFlipper || 0;
            const pivot = isLeft ? { x: 191, y: 628 } : { x: 329, y: 628 };
            const length = 112;
            const rest = isLeft ? 0.18 : Math.PI - 0.18;
            const active = isLeft ? -0.62 : Math.PI + 0.62;
            const angle = rest + (active - rest) * amount;
            return this.segment(
                pivot.x,
                pivot.y,
                pivot.x + Math.cos(angle) * length,
                pivot.y + Math.sin(angle) * length,
                11,
                0.88,
                amount > 0.25 ? 120 : 25
            );
        }

        isLeftPressed() {
            return this.keys.has('arrowleft') || this.keys.has('a') || this.pointerControls.left;
        }

        isRightPressed() {
            return this.keys.has('arrowright') || this.keys.has('d') || this.pointerControls.right;
        }

        draw() {
            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            ctx.save();
            if (this.shake > 0) {
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
            this.drawEffects(ctx);
            if (this.state === 'ready' || this.state === 'charging' || this.state === 'paused' || this.state === 'gameover') {
                this.drawMessage(ctx);
            }
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

            ctx.fillStyle = 'rgba(2, 7, 30, 0.22)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            if (this.flash > 0) {
                ctx.fillStyle = `rgba(136, 230, 255, ${this.flash * 0.13})`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }

            ctx.save();
            ctx.globalAlpha = 0.42;
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
            const pull = 58 * (this.state === 'charging' ? this.charge : 0);
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
            ctx.strokeStyle = '#d7f2ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        drawInteractiveLights(ctx) {
            this.bumpers.forEach((bumper) => {
                const pulse = bumper.cooldown > 0 ? 1 : 0;
                const radius = bumper.r + pulse * 10;
                const gradient = ctx.createRadialGradient(bumper.x - 8, bumper.y - 10, 4, bumper.x, bumper.y, radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.35, bumper.color);
                gradient.addColorStop(1, 'rgba(0, 21, 61, 0.32)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            this.targets.forEach((target) => this.drawTarget(ctx, target, '#92ff63'));
            this.rollovers.forEach((rollover) => this.drawTarget(ctx, rollover, '#58d6ff'));
        }

        drawTarget(ctx, target, color) {
            ctx.save();
            ctx.globalAlpha = target.active ? 1 : 0.28;
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
            ctx.restore();
        }

        drawSpinner(ctx) {
            ctx.save();
            ctx.translate(this.spinner.x, this.spinner.y);
            ctx.rotate(this.spinner.angle);
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#ffef6e';
            ctx.shadowColor = '#7df9ff';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(-this.spinner.width / 2, 0);
            ctx.lineTo(this.spinner.width / 2, 0);
            ctx.stroke();
            ctx.restore();
        }

        drawFlippers(ctx) {
            const left = this.flipperSegment('left');
            const right = this.flipperSegment('right');
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = 18;
            ctx.strokeStyle = '#dff8ff';
            ctx.shadowColor = '#50c8ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(left.a.x, left.a.y);
            ctx.lineTo(left.b.x, left.b.y);
            ctx.moveTo(right.a.x, right.a.y);
            ctx.lineTo(right.b.x, right.b.y);
            ctx.stroke();
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#63f564';
            ctx.shadowBlur = 5;
            ctx.stroke();
            ctx.restore();
        }

        drawTrail(ctx) {
            ctx.save();
            this.trail.forEach((point) => {
                ctx.globalAlpha = Math.max(0, point.alpha) * 0.4;
                ctx.fillStyle = '#9ee7ff';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        drawBall(ctx) {
            const b = this.ball;
            const gradient = ctx.createRadialGradient(b.x - 4, b.y - 5, 2, b.x, b.y, b.r + 3);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.45, '#dce8ff');
            gradient.addColorStop(1, '#46556a');
            ctx.save();
            ctx.shadowColor = '#bff6ff';
            ctx.shadowBlur = 9;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        drawParticles(ctx) {
            ctx.save();
            this.particles.forEach((particle) => {
                ctx.globalAlpha = Math.max(0, particle.life / 0.7);
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2.4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        drawEffects(ctx) {
            ctx.save();
            ctx.textAlign = 'center';
            this.effects.forEach((effect) => {
                const t = effect.life / effect.maxLife;
                ctx.globalAlpha = Math.min(1, t * 1.2);
                if (effect.banner) {
                    ctx.fillStyle = 'rgba(0, 18, 63, 0.72)';
                    ctx.strokeStyle = 'rgba(210, 247, 255, 0.86)';
                    ctx.lineWidth = 2;
                    ctx.fillRect(112, effect.y - 28, 296, 56);
                    ctx.strokeRect(112.5, effect.y - 27.5, 295, 55);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '700 18px Tahoma, sans-serif';
                    ctx.fillText(effect.text, effect.x, effect.y + 6);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#003c8f';
                    ctx.lineWidth = 3;
                    ctx.font = '700 16px Tahoma, sans-serif';
                    const y = effect.y - (1 - t) * 26;
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
            const title = this.state === 'gameover'
                ? 'Game over'
                : this.state === 'paused'
                    ? 'Pausa'
                    : this.state === 'charging'
                        ? 'Solta para lanzar'
                        : 'Mantene Espacio';
            const subtitle = this.state === 'gameover'
                ? 'R o Reiniciar para otra partida'
                : 'A/D o flechas mueven los flippers';
            ctx.save();
            ctx.fillStyle = 'rgba(3, 14, 52, 0.68)';
            ctx.strokeStyle = '#d7f2ff';
            ctx.lineWidth = 2;
            ctx.fillRect(99, 274, 322, 92);
            ctx.strokeRect(99.5, 274.5, 321, 91);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '700 19px Tahoma, sans-serif';
            ctx.fillText(title, WIDTH / 2, 312);
            ctx.font = '12px Tahoma, sans-serif';
            ctx.fillText(subtitle, WIDTH / 2, 338);
            ctx.restore();
        }

        ensureAudio() {
            if (this.audio) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.audio = new AudioContext();
        }

        playTone(frequency, duration, type = 'sine', gain = 0.04) {
            if (!this.audio) return;
            const osc = this.audio.createOscillator();
            const volume = this.audio.createGain();
            osc.type = type;
            osc.frequency.value = frequency;
            volume.gain.value = gain;
            volume.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + duration);
            osc.connect(volume);
            volume.connect(this.audio.destination);
            osc.start();
            osc.stop(this.audio.currentTime + duration);
        }

        destroy() {
            this.destroyed = true;
            window.cancelAnimationFrame(this.raf);
            window.removeEventListener('keydown', this.boundKeyDown);
            window.removeEventListener('keyup', this.boundKeyUp);
            document.removeEventListener('visibilitychange', this.boundVisibility);
            this.keys.clear();
            this.pointerControls.left = false;
            this.pointerControls.right = false;
            this.pointerControls.plunger = false;
        }
    }

    window.initPinballApp = function initPinballApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-pinball-root]') ? scope : document;
        if (rootWindow._pinballApp) rootWindow._pinballApp.destroy();
        rootWindow._pinballApp = new PinballApp(rootWindow);
        rootWindow._pinballApp.init();
        return rootWindow._pinballApp;
    };

    window.destroyPinballApp = function destroyPinballApp(scope = document) {
        if (scope._pinballApp) {
            scope._pinballApp.destroy();
            scope._pinballApp = null;
        }
    };
})();
