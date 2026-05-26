(function () {
    const COLORS = [
        '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200',
        '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3',
        '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea',
        '#7092be', '#c8bfe7', '#1f2937', '#2563eb', '#16a34a', '#ef4444'
    ];

    class PaintApplication {
        constructor(root) {
            this.root = root;
            this.canvas = root.querySelector('#paintCanvas');
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            this.tool = 'pencil';
            this.color = '#000000';
            this.size = 3;
            this.isDrawing = false;
            this.start = { x: 0, y: 0 };
            this.snapshot = null;
            this.history = [];
            this.redo = [];
            this.bound = [];
        }

        init() {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.buildPalette();
            this.bindControls();
            this.updateStatus('Listo');
        }

        bind(target, eventName, handler) {
            target.addEventListener(eventName, handler);
            this.bound.push({ target, eventName, handler });
        }

        bindControls() {
            this.root.querySelectorAll('[data-tool]').forEach((button) => {
                this.bind(button, 'click', () => {
                    this.tool = button.dataset.tool;
                    this.root.querySelectorAll('[data-tool]').forEach((item) => item.classList.remove('active'));
                    button.classList.add('active');
                    this.updateStatus(`Herramienta: ${button.title || this.tool}`);
                });
            });

            const sizeInput = this.root.querySelector('[data-paint-size]');
            this.bind(sizeInput, 'input', () => {
                this.size = Number(sizeInput.value);
                this.updateStatus(`Tamano: ${this.size}px`);
            });

            this.root.querySelector('[data-paint-command="new"]').addEventListener('click', () => this.clear());
            this.root.querySelector('[data-paint-command="undo"]').addEventListener('click', () => this.undo());
            this.root.querySelector('[data-paint-command="redo"]').addEventListener('click', () => this.redoAction());
            this.root.querySelector('[data-paint-command="download"]').addEventListener('click', () => this.download());

            this.bind(this.canvas, 'pointerdown', (event) => this.startDraw(event));
            this.bind(this.canvas, 'pointermove', (event) => this.draw(event));
            this.bind(this.canvas, 'pointerup', (event) => this.endDraw(event));
            this.bind(this.canvas, 'pointercancel', (event) => this.endDraw(event));
            this.bind(this.canvas, 'contextmenu', (event) => event.preventDefault());
        }

        buildPalette() {
            const palette = this.root.querySelector('[data-paint-colors]');
            const current = this.root.querySelector('[data-current-color]');
            current.style.backgroundColor = this.color;

            COLORS.forEach((color, index) => {
                const swatch = document.createElement('button');
                swatch.type = 'button';
                swatch.className = 'xp-paint-color';
                swatch.style.backgroundColor = color;
                swatch.title = color;
                if (index === 0) swatch.classList.add('active');
                swatch.addEventListener('click', () => {
                    this.setColor(color);
                    palette.querySelectorAll('.xp-paint-color').forEach((item) => item.classList.remove('active'));
                    swatch.classList.add('active');
                });
                palette.appendChild(swatch);
            });
        }

        setColor(color) {
            this.color = color;
            this.root.querySelector('[data-current-color]').style.backgroundColor = color;
            this.updateStatus(`Color: ${color}`);
        }

        getPoint(event) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: Math.round((event.clientX - rect.left) * (this.canvas.width / rect.width)),
                y: Math.round((event.clientY - rect.top) * (this.canvas.height / rect.height))
            };
        }

        startDraw(event) {
            event.preventDefault();
            this.canvas.setPointerCapture(event.pointerId);
            const point = this.getPoint(event);
            this.start = point;

            if (this.tool === 'picker') {
                this.pickColor(point.x, point.y);
                return;
            }

            this.pushHistory();
            this.redo = [];

            if (this.tool === 'fill') {
                this.fill(point.x, point.y);
                return;
            }

            if (this.tool === 'text') {
                this.addText(point.x, point.y);
                return;
            }

            this.isDrawing = true;
            this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            if (['pencil', 'brush', 'eraser'].includes(this.tool)) {
                this.strokeTo(point.x, point.y);
            }
        }

        draw(event) {
            if (!this.isDrawing) return;
            const point = this.getPoint(event);

            if (['line', 'rect', 'ellipse'].includes(this.tool)) {
                this.ctx.putImageData(this.snapshot, 0, 0);
                this.drawShape(point);
                return;
            }

            this.strokeTo(point.x, point.y);
        }

        endDraw(event) {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.snapshot = null;
            this.canvas.releasePointerCapture?.(event.pointerId);
            this.updateStatus('Trazo aplicado');
        }

        strokeTo(x, y) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.tool === 'eraser' ? '#ffffff' : this.color;
            this.ctx.lineWidth = this.tool === 'brush' ? this.size * 2 : this.size;

            if (this.tool === 'brush') {
                this.ctx.fillStyle = this.color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, Math.max(2, this.size), 0, Math.PI * 2);
                this.ctx.fill();
                return;
            }

            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }

        drawShape(point) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.size;
            this.ctx.beginPath();

            if (this.tool === 'line') {
                this.ctx.moveTo(this.start.x, this.start.y);
                this.ctx.lineTo(point.x, point.y);
            }

            if (this.tool === 'rect') {
                this.ctx.rect(this.start.x, this.start.y, point.x - this.start.x, point.y - this.start.y);
            }

            if (this.tool === 'ellipse') {
                const width = point.x - this.start.x;
                const height = point.y - this.start.y;
                this.ctx.ellipse(
                    this.start.x + width / 2,
                    this.start.y + height / 2,
                    Math.abs(width / 2),
                    Math.abs(height / 2),
                    0,
                    0,
                    Math.PI * 2
                );
            }

            this.ctx.stroke();
        }

        addText(x, y) {
            const text = prompt('Texto para insertar:');
            if (!text) {
                this.history.pop();
                return;
            }
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = this.color;
            this.ctx.font = `${Math.max(14, this.size * 6)}px Tahoma, sans-serif`;
            this.ctx.fillText(text, x, y);
            this.updateStatus('Texto insertado');
        }

        pickColor(x, y) {
            const [r, g, b] = this.ctx.getImageData(x, y, 1, 1).data;
            this.setColor(this.rgbToHex(r, g, b));
        }

        fill(x, y) {
            const image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const target = this.getPixel(image, x, y);
            const replacement = this.hexToRgb(this.color);

            if (this.sameColor(target, replacement)) return;

            const stack = [[x, y]];
            while (stack.length) {
                const [px, py] = stack.pop();
                if (px < 0 || py < 0 || px >= this.canvas.width || py >= this.canvas.height) continue;
                if (!this.sameColor(this.getPixel(image, px, py), target)) continue;

                this.setPixel(image, px, py, replacement);
                stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
            }

            this.ctx.putImageData(image, 0, 0);
            this.updateStatus('Relleno aplicado');
        }

        pushHistory() {
            this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            if (this.history.length > 25) this.history.shift();
        }

        undo() {
            if (!this.history.length) return;
            this.redo.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.ctx.putImageData(this.history.pop(), 0, 0);
            this.updateStatus('Deshacer');
        }

        redoAction() {
            if (!this.redo.length) return;
            this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.ctx.putImageData(this.redo.pop(), 0, 0);
            this.updateStatus('Rehacer');
        }

        clear() {
            this.pushHistory();
            this.redo = [];
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.updateStatus('Lienzo limpio');
        }

        download() {
            const link = document.createElement('a');
            link.href = this.canvas.toDataURL('image/png');
            link.download = 'zaratexp-paint.png';
            document.body.appendChild(link);
            link.click();
            link.remove();
            this.updateStatus('PNG generado');
        }

        getPixel(image, x, y) {
            const index = (y * image.width + x) * 4;
            return {
                r: image.data[index],
                g: image.data[index + 1],
                b: image.data[index + 2],
                a: image.data[index + 3]
            };
        }

        setPixel(image, x, y, color) {
            const index = (y * image.width + x) * 4;
            image.data[index] = color.r;
            image.data[index + 1] = color.g;
            image.data[index + 2] = color.b;
            image.data[index + 3] = 255;
        }

        sameColor(a, b) {
            return a.r === b.r && a.g === b.g && a.b === b.b && (a.a ?? 255) === (b.a ?? 255);
        }

        hexToRgb(hex) {
            const normalized = hex.replace('#', '');
            return {
                r: parseInt(normalized.slice(0, 2), 16),
                g: parseInt(normalized.slice(2, 4), 16),
                b: parseInt(normalized.slice(4, 6), 16),
                a: 255
            };
        }

        rgbToHex(r, g, b) {
            return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
        }

        updateStatus(message) {
            const status = this.root.querySelector('[data-paint-status]');
            if (status) status.textContent = message;
        }

        destroy() {
            this.bound.forEach(({ target, eventName, handler }) => target.removeEventListener(eventName, handler));
            this.bound = [];
        }
    }

    window.initPaintApp = function initPaintApp(scope = document) {
        const root = scope.querySelector?.('[data-paint-root]') || document.querySelector('[data-paint-root]');
        if (!root) return null;
        if (root._paintXP) root._paintXP.destroy();
        root._paintXP = new PaintApplication(root);
        root._paintXP.init();
        return root._paintXP;
    };

    window.destroyPaintApp = function destroyPaintApp(scope = document) {
        const root = scope.querySelector?.('[data-paint-root]') || document.querySelector('[data-paint-root]');
        if (root?._paintXP) {
            root._paintXP.destroy();
            root._paintXP = null;
        }
    };
})();
