(function () {
    class PinballApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-pinball-root]');
            this.canvas = this.root.querySelector('[data-pinball-canvas]');
            this.ctx = this.canvas.getContext('2d');
            this.scoreEl = this.root.querySelector('[data-pinball-score]');
            this.ballsEl = this.root.querySelector('[data-pinball-balls]');
            this.keys = new Set();
            this.score = 0;
            this.balls = 3;
            this.running = false;
            this.raf = null;
            this.bumpers = [
                { x: 175, y: 210, r: 30, value: 500, color: '#ffdf4d' },
                { x: 340, y: 210, r: 30, value: 500, color: '#ff6b6b' },
                { x: 260, y: 330, r: 36, value: 800, color: '#62d5ff' },
                { x: 140, y: 430, r: 24, value: 300, color: '#9aff75' },
                { x: 380, y: 430, r: 24, value: 300, color: '#9aff75' }
            ];
            this.boundKeyDown = (event) => this.handleKey(event, true);
            this.boundKeyUp = (event) => this.handleKey(event, false);
        }

        init() {
            this.root.querySelector('[data-pinball-start]').addEventListener('click', () => this.start());
            this.root.querySelector('[data-pinball-reset]').addEventListener('click', () => this.resetGame());
            window.addEventListener('keydown', this.boundKeyDown);
            window.addEventListener('keyup', this.boundKeyUp);
            this.resetBall();
            this.draw();
        }

        start() {
            if (this.balls <= 0) {
                this.resetGame();
            }
            if (!this.running) {
                this.running = true;
                this.lastTime = performance.now();
                this.loop();
            }
            if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1) {
                this.launchBall();
            }
        }

        resetGame() {
            this.score = 0;
            this.balls = 3;
            this.running = false;
            window.cancelAnimationFrame(this.raf);
            this.resetBall();
            this.updateHud();
            this.draw();
        }

        resetBall() {
            this.ball = { x: 456, y: 604, vx: 0, vy: 0, r: 10 };
        }

        launchBall() {
            this.ball.vx = -3.4 - Math.random() * 1.6;
            this.ball.vy = -12.5;
        }

        handleKey(event, isDown) {
            const key = event.key.toLowerCase();
            if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(key)) {
                event.preventDefault();
            }
            if (isDown) {
                this.keys.add(key);
                if (key === ' ') this.start();
            } else {
                this.keys.delete(key);
            }
        }

        loop() {
            const now = performance.now();
            const delta = Math.min(32, now - this.lastTime) / 16.67;
            this.lastTime = now;
            this.update(delta);
            this.draw();
            if (this.running) this.raf = window.requestAnimationFrame(() => this.loop());
        }

        update(delta) {
            const ball = this.ball;
            ball.vy += 0.2 * delta;
            ball.x += ball.vx * delta;
            ball.y += ball.vy * delta;
            ball.vx *= 0.998;
            ball.vy *= 0.998;

            this.collideWalls();
            this.collideBumpers();
            this.collideFlippers();

            if (ball.y > this.canvas.height + 28) {
                this.balls -= 1;
                this.running = false;
                this.updateHud();
                if (this.balls <= 0) {
                    this.resetBall();
                } else {
                    this.resetBall();
                }
            }
        }

        collideWalls() {
            const b = this.ball;
            const w = this.canvas.width;
            if (b.x - b.r < 34) {
                b.x = 34 + b.r;
                b.vx = Math.abs(b.vx) * 0.92;
            }
            if (b.x + b.r > w - 34) {
                b.x = w - 34 - b.r;
                b.vx = -Math.abs(b.vx) * 0.92;
            }
            if (b.y - b.r < 28) {
                b.y = 28 + b.r;
                b.vy = Math.abs(b.vy) * 0.92;
            }

            this.collideSegment({ x: 34, y: 120 }, { x: 112, y: 42 }, 0.9);
            this.collideSegment({ x: 486, y: 120 }, { x: 408, y: 42 }, 0.9);
            this.collideSegment({ x: 34, y: 510 }, { x: 152, y: 620 }, 0.75);
            this.collideSegment({ x: 486, y: 510 }, { x: 368, y: 620 }, 0.75);
        }

        collideBumpers() {
            this.bumpers.forEach((bumper) => {
                const dx = this.ball.x - bumper.x;
                const dy = this.ball.y - bumper.y;
                const dist = Math.hypot(dx, dy);
                const minDist = this.ball.r + bumper.r;
                if (dist < minDist) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    this.ball.x = bumper.x + nx * minDist;
                    this.ball.y = bumper.y + ny * minDist;
                    const dot = this.ball.vx * nx + this.ball.vy * ny;
                    this.ball.vx = (this.ball.vx - 2 * dot * nx) * 1.08 + nx * 2.2;
                    this.ball.vy = (this.ball.vy - 2 * dot * ny) * 1.08 + ny * 2.2;
                    this.addScore(bumper.value);
                }
            });
        }

        collideFlippers() {
            const leftPressed = this.keys.has('arrowleft') || this.keys.has('a');
            const rightPressed = this.keys.has('arrowright') || this.keys.has('d');
            const left = this.flipperPoints('left', leftPressed);
            const right = this.flipperPoints('right', rightPressed);
            if (this.collideSegment(left.a, left.b, leftPressed ? 1.55 : 0.85)) this.addScore(25);
            if (this.collideSegment(right.a, right.b, rightPressed ? 1.55 : 0.85)) this.addScore(25);
        }

        collideSegment(a, b, kick = 1) {
            const ball = this.ball;
            const abx = b.x - a.x;
            const aby = b.y - a.y;
            const lengthSquared = abx * abx + aby * aby;
            const t = Math.max(0, Math.min(1, ((ball.x - a.x) * abx + (ball.y - a.y) * aby) / lengthSquared));
            const closest = { x: a.x + abx * t, y: a.y + aby * t };
            const dx = ball.x - closest.x;
            const dy = ball.y - closest.y;
            const distance = Math.hypot(dx, dy);
            const minDistance = ball.r + 8;
            if (distance > minDistance) return false;

            const nx = dx / (distance || 1);
            const ny = dy / (distance || 1);
            ball.x = closest.x + nx * minDistance;
            ball.y = closest.y + ny * minDistance;
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.92 + nx * kick;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.92 + ny * kick - Math.abs(kick) * 1.2;
            return true;
        }

        flipperPoints(side, pressed) {
            const pivot = side === 'left' ? { x: 184, y: 620 } : { x: 336, y: 620 };
            const length = 112;
            const angle = side === 'left'
                ? (pressed ? -0.62 : 0.22)
                : Math.PI - (pressed ? -0.62 : 0.22);
            return {
                a: pivot,
                b: {
                    x: pivot.x + Math.cos(angle) * length,
                    y: pivot.y + Math.sin(angle) * length
                }
            };
        }

        addScore(points) {
            this.score += points;
            this.updateHud();
        }

        updateHud() {
            this.scoreEl.textContent = this.score.toLocaleString('es-AR');
            this.ballsEl.textContent = String(this.balls);
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawTable(ctx);
            this.drawBumpers(ctx);
            this.drawFlippers(ctx);
            this.drawBall(ctx);
            if (!this.running) this.drawMessage(ctx);
        }

        drawTable(ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#15245c');
            gradient.addColorStop(0.52, '#244eb5');
            gradient.addColorStop(1, '#07133b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.strokeStyle = '#dfe7ff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(34, 120);
            ctx.lineTo(112, 42);
            ctx.lineTo(408, 42);
            ctx.lineTo(486, 120);
            ctx.lineTo(486, 510);
            ctx.lineTo(368, 620);
            ctx.moveTo(34, 120);
            ctx.lineTo(34, 510);
            ctx.lineTo(152, 620);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.16)';
            ctx.fillRect(438, 112, 34, 520);
            ctx.fillStyle = '#ffe66b';
            ctx.font = '700 24px Tahoma';
            ctx.fillText('XP', 245, 112);
            ctx.font = '12px Tahoma';
            ctx.fillText('PINBALL LAB', 211, 132);
        }

        drawBumpers(ctx) {
            this.bumpers.forEach((bumper) => {
                const gradient = ctx.createRadialGradient(bumper.x - 9, bumper.y - 9, 4, bumper.x, bumper.y, bumper.r);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.35, bumper.color);
                gradient.addColorStop(1, '#1f2a44');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
            });
        }

        drawFlippers(ctx) {
            const left = this.flipperPoints('left', this.keys.has('arrowleft') || this.keys.has('a'));
            const right = this.flipperPoints('right', this.keys.has('arrowright') || this.keys.has('d'));
            ctx.lineCap = 'round';
            ctx.lineWidth = 16;
            ctx.strokeStyle = '#ffdf4d';
            ctx.beginPath();
            ctx.moveTo(left.a.x, left.a.y);
            ctx.lineTo(left.b.x, left.b.y);
            ctx.moveTo(right.a.x, right.a.y);
            ctx.lineTo(right.b.x, right.b.y);
            ctx.stroke();
            ctx.lineCap = 'butt';
        }

        drawBall(ctx) {
            const b = this.ball;
            const gradient = ctx.createRadialGradient(b.x - 4, b.y - 4, 2, b.x, b.y, b.r);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.55, '#d9e0ef');
            gradient.addColorStop(1, '#56606f');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }

        drawMessage(ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
            ctx.fillRect(96, 268, 328, 88);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(96.5, 268.5, 327, 87);
            ctx.fillStyle = '#fff';
            ctx.font = '700 18px Tahoma';
            ctx.fillText(this.balls > 0 ? 'Presiona Iniciar o Espacio' : 'Game over - Reiniciar', 142, 310);
            ctx.font = '12px Tahoma';
            ctx.fillText('A/D o flechas controlan los flippers', 154, 334);
        }

        destroy() {
            this.running = false;
            window.cancelAnimationFrame(this.raf);
            window.removeEventListener('keydown', this.boundKeyDown);
            window.removeEventListener('keyup', this.boundKeyUp);
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
