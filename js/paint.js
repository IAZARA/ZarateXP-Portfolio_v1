(function () {
    const COLORS = [
        '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200',
        '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3',
        '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea',
        '#7092be', '#c8bfe7', '#1f2937', '#2563eb', '#16a34a', '#ef4444'
    ];
    const STORAGE_KEY = 'zarateXP.paint.draft.v1';
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const VALID_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

    class PaintApplication {
        constructor(root) {
            this.root = root;
            this.canvas = root.querySelector('#paintCanvas');
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            this.controller = new AbortController();
            this.tool = 'pencil';
            this.color = '#000000';
            this.size = 3;
            this.isDrawing = false;
            this.start = { x: 0, y: 0 };
            this.snapshot = null;
            this.history = [];
            this.future = [];
            this.pendingTextPoint = null;
            this.saveTimer = null;
        }

        init() {
            this.resetCanvas();
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.buildPalette();
            this.bindControls();
            this.restoreDraft();
            this.updateControls();
            this.updateStatus('Listo');
        }

        t(value) {
            return window.__zarateXPI18nManager?.t(value) || value;
        }

        on(target, eventName, handler, options = {}) {
            target?.addEventListener(eventName, handler, { ...options, signal: this.controller.signal });
        }

        bindControls() {
            this.root.querySelectorAll('[data-tool]').forEach((button) => {
                this.on(button, 'click', () => {
                    this.tool = button.dataset.tool;
                    this.root.querySelectorAll('[data-tool]').forEach((item) => item.classList.toggle('active', item === button));
                    this.updateStatus(`Herramienta: ${button.title || this.tool}`);
                });
            });

            const sizeInput = this.root.querySelector('[data-paint-size]');
            const sizeOutput = this.root.querySelector('[data-paint-size-output]');
            this.on(sizeInput, 'input', () => {
                this.size = Number(sizeInput.value);
                sizeOutput.value = `${this.size} px`;
                this.updateStatus(`Tamano: ${this.size}px`);
            });

            this.on(this.command('new'), 'click', () => this.showConfirmDialog());
            this.on(this.command('open'), 'click', () => this.root.querySelector('[data-paint-file]').click());
            this.on(this.command('undo'), 'click', () => this.undo());
            this.on(this.command('redo'), 'click', () => this.redo());
            this.on(this.command('download'), 'click', () => this.download());
            this.on(this.root.querySelector('[data-paint-file]'), 'change', (event) => this.importFile(event.target.files?.[0]));

            this.on(this.canvas, 'pointerdown', (event) => this.startDraw(event));
            this.on(this.canvas, 'pointermove', (event) => this.draw(event));
            this.on(this.canvas, 'pointerup', (event) => this.endDraw(event));
            this.on(this.canvas, 'pointercancel', (event) => this.endDraw(event));
            this.on(this.canvas, 'contextmenu', (event) => event.preventDefault());

            this.on(this.root.querySelector('[data-paint-text-apply]'), 'click', () => this.applyText());
            this.on(this.root.querySelector('[data-paint-text-cancel]'), 'click', () => this.closeTextDialog());
            this.on(this.root.querySelector('[data-paint-text-input]'), 'keydown', (event) => {
                if (event.key === 'Enter') this.applyText();
                if (event.key === 'Escape') this.closeTextDialog();
            });
            this.on(this.root.querySelector('[data-paint-confirm-accept]'), 'click', () => {
                this.hideConfirmDialog();
                this.clearCanvas();
            });
            this.on(this.root.querySelector('[data-paint-confirm-cancel]'), 'click', () => this.hideConfirmDialog());
            this.on(document, 'keydown', (event) => this.handleShortcut(event));
        }

        command(name) {
            return this.root.querySelector(`[data-paint-command="${name}"]`);
        }

        handleShortcut(event) {
            const paintWindow = this.root.closest('.window');
            if (paintWindow && !paintWindow.classList.contains('active')) return;
            if (!(event.ctrlKey || event.metaKey)) return;
            const key = event.key.toLowerCase();
            const actions = {
                n: () => this.showConfirmDialog(),
                o: () => this.root.querySelector('[data-paint-file]').click(),
                z: () => event.shiftKey ? this.redo() : this.undo(),
                y: () => this.redo(),
                s: () => this.download()
            };
            if (!actions[key]) return;
            event.preventDefault();
            actions[key]();
        }

        buildPalette() {
            const palette = this.root.querySelector('[data-paint-colors]');
            palette.replaceChildren();
            this.root.querySelector('[data-current-color]').style.backgroundColor = this.color;
            COLORS.forEach((color, index) => {
                const swatch = document.createElement('button');
                swatch.type = 'button';
                swatch.className = 'xp-paint-color';
                swatch.dataset.color = color;
                swatch.style.backgroundColor = color;
                swatch.title = color;
                swatch.setAttribute('aria-label', `${this.t('Color')} ${color}`);
                swatch.classList.toggle('active', index === 0);
                this.on(swatch, 'click', () => {
                    this.setColor(color);
                    palette.querySelectorAll('.xp-paint-color').forEach((item) => item.classList.toggle('active', item === swatch));
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
                x: Math.max(0, Math.min(this.canvas.width - 1, Math.round((event.clientX - rect.left) * this.canvas.width / rect.width))),
                y: Math.max(0, Math.min(this.canvas.height - 1, Math.round((event.clientY - rect.top) * this.canvas.height / rect.height)))
            };
        }

        startDraw(event) {
            event.preventDefault();
            const point = this.getPoint(event);
            this.start = point;
            if (this.tool === 'picker') {
                this.pickColor(point.x, point.y);
                return;
            }
            if (this.tool === 'text') {
                this.openTextDialog(point);
                return;
            }
            this.pushHistory();
            this.future = [];
            if (this.tool === 'fill') {
                this.fill(point.x, point.y);
                this.commit('Relleno aplicado');
                return;
            }
            this.canvas.setPointerCapture?.(event.pointerId);
            this.isDrawing = true;
            this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            if (['pencil', 'brush', 'eraser'].includes(this.tool)) this.strokeTo(point.x, point.y);
            this.updateControls();
        }

        draw(event) {
            if (!this.isDrawing) return;
            const point = this.getPoint(event);
            if (['line', 'rect', 'ellipse'].includes(this.tool)) {
                this.ctx.putImageData(this.snapshot, 0, 0);
                this.drawShape(point);
            } else {
                this.strokeTo(point.x, point.y);
            }
        }

        endDraw(event) {
            if (!this.isDrawing) return;
            if (['line', 'rect', 'ellipse'].includes(this.tool)) this.draw(event);
            this.isDrawing = false;
            this.snapshot = null;
            this.canvas.releasePointerCapture?.(event.pointerId);
            this.commit('Trazo aplicado');
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
            } else {
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        }

        drawShape(point) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.size;
            this.ctx.beginPath();
            if (this.tool === 'line') {
                this.ctx.moveTo(this.start.x, this.start.y);
                this.ctx.lineTo(point.x, point.y);
            } else if (this.tool === 'rect') {
                this.ctx.rect(this.start.x, this.start.y, point.x - this.start.x, point.y - this.start.y);
            } else if (this.tool === 'ellipse') {
                const width = point.x - this.start.x;
                const height = point.y - this.start.y;
                this.ctx.ellipse(this.start.x + width / 2, this.start.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
            }
            this.ctx.stroke();
        }

        openTextDialog(point) {
            this.pendingTextPoint = point;
            const dialog = this.root.querySelector('[data-paint-text-dialog]');
            const input = this.root.querySelector('[data-paint-text-input]');
            dialog.hidden = false;
            input.value = '';
            window.requestAnimationFrame(() => input.focus());
        }

        closeTextDialog() {
            this.root.querySelector('[data-paint-text-dialog]').hidden = true;
            this.pendingTextPoint = null;
            this.root.focus();
        }

        applyText() {
            const input = this.root.querySelector('[data-paint-text-input]');
            const text = input.value.trim();
            const point = this.pendingTextPoint;
            if (!text || !point) {
                this.closeTextDialog();
                return;
            }
            this.pushHistory();
            this.future = [];
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = this.color;
            this.ctx.font = `${Math.max(14, this.size * 6)}px Tahoma, sans-serif`;
            this.ctx.fillText(text, point.x, point.y);
            this.closeTextDialog();
            this.commit('Texto insertado');
        }

        pickColor(x, y) {
            const [r, g, b] = this.ctx.getImageData(x, y, 1, 1).data;
            this.setColor(this.rgbToHex(r, g, b));
        }

        fill(x, y) {
            const image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const target = this.getPixel(image, x, y);
            const replacement = this.hexToRgb(this.color);
            if (this.sameColor(target, replacement)) {
                this.history.pop();
                return;
            }
            const total = image.width * image.height;
            const visited = new Uint8Array(total);
            const stack = [y * image.width + x];
            visited[stack[0]] = 1;
            while (stack.length) {
                const index = stack.pop();
                const px = index % image.width;
                const py = Math.floor(index / image.width);
                if (!this.sameColor(this.getPixel(image, px, py), target)) continue;
                this.setPixel(image, px, py, replacement);
                const neighbors = [index - 1, index + 1, index - image.width, index + image.width];
                neighbors.forEach((next, direction) => {
                    if (next < 0 || next >= total || visited[next]) return;
                    if (direction === 0 && px === 0) return;
                    if (direction === 1 && px === image.width - 1) return;
                    visited[next] = 1;
                    stack.push(next);
                });
            }
            this.ctx.putImageData(image, 0, 0);
        }

        pushHistory() {
            this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            if (this.history.length > 20) this.history.shift();
        }

        undo() {
            if (!this.history.length) return;
            this.future.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.ctx.putImageData(this.history.pop(), 0, 0);
            this.commit('Deshacer');
        }

        redo() {
            if (!this.future.length) return;
            this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.ctx.putImageData(this.future.pop(), 0, 0);
            this.commit('Rehacer');
        }

        showConfirmDialog() {
            const dialog = this.root.querySelector('[data-paint-confirm-dialog]');
            dialog.hidden = false;
            window.requestAnimationFrame(() => dialog.querySelector('[data-paint-confirm-accept]').focus());
        }

        hideConfirmDialog() {
            this.root.querySelector('[data-paint-confirm-dialog]').hidden = true;
            this.root.focus();
        }

        clearCanvas() {
            this.pushHistory();
            this.future = [];
            this.resetCanvas();
            this.commit('Lienzo limpio');
        }

        resetCanvas() {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        async importFile(file) {
            const input = this.root.querySelector('[data-paint-file]');
            input.value = '';
            if (!file) return;
            if (!VALID_IMAGE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
                this.updateStatus('Formato no compatible. Usa PNG, JPEG o WebP de hasta 10 MB.');
                return;
            }
            try {
                const bitmap = await this.decodeImage(file);
                this.pushHistory();
                this.future = [];
                this.resetCanvas();
                const scale = Math.min(this.canvas.width / bitmap.width, this.canvas.height / bitmap.height, 1);
                const width = bitmap.width * scale;
                const height = bitmap.height * scale;
                this.ctx.drawImage(bitmap, (this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
                bitmap.close?.();
                if (bitmap._paintObjectUrl) URL.revokeObjectURL(bitmap._paintObjectUrl);
                this.commit('Imagen importada');
            } catch (error) {
                console.error('Paint image import failed:', error);
                this.updateStatus('No se pudo abrir la imagen.');
            }
        }

        async decodeImage(file) {
            if (typeof createImageBitmap === 'function') return createImageBitmap(file);
            const url = URL.createObjectURL(file);
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => {
                    image._paintObjectUrl = url;
                    resolve(image);
                };
                image.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Image decoding failed'));
                };
                image.src = url;
            });
        }

        download() {
            this.canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'zaratexp-paint.png';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                this.updateStatus('PNG generado');
            }, 'image/png');
        }

        scheduleDraftSave() {
            window.clearTimeout(this.saveTimer);
            this.saveTimer = window.setTimeout(() => {
                try {
                    localStorage.setItem(STORAGE_KEY, this.canvas.toDataURL('image/png'));
                } catch (error) {
                    console.warn('Paint draft could not be saved:', error);
                }
            }, 180);
        }

        restoreDraft() {
            const draft = localStorage.getItem(STORAGE_KEY);
            if (!draft?.startsWith('data:image/png')) return;
            const image = new Image();
            image.onload = () => {
                this.resetCanvas();
                this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
                this.updateStatus('Borrador restaurado');
            };
            image.src = draft;
        }

        commit(message) {
            this.updateControls();
            this.scheduleDraftSave();
            this.updateStatus(message);
        }

        updateControls() {
            this.command('undo').disabled = !this.history.length;
            this.command('redo').disabled = !this.future.length;
        }

        getPixel(image, x, y) {
            const index = (y * image.width + x) * 4;
            return { r: image.data[index], g: image.data[index + 1], b: image.data[index + 2], a: image.data[index + 3] };
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
            const value = hex.replace('#', '');
            return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16), a: 255 };
        }

        rgbToHex(r, g, b) {
            return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
        }

        updateStatus(message) {
            const status = this.root.querySelector('[data-paint-status]');
            if (status) status.textContent = this.t(message);
        }

        destroy() {
            this.controller.abort();
            window.clearTimeout(this.saveTimer);
            this.isDrawing = false;
        }
    }

    window.initPaintApp = function initPaintApp(scope = document) {
        const root = scope.querySelector?.('[data-paint-root]') || document.querySelector('[data-paint-root]');
        if (!root) return null;
        root._paintXP?.destroy();
        root._paintXP = new PaintApplication(root);
        root._paintXP.init();
        return root._paintXP;
    };

    window.destroyPaintApp = function destroyPaintApp(scope = document) {
        const root = scope.querySelector?.('[data-paint-root]') || document.querySelector('[data-paint-root]');
        root?._paintXP?.destroy();
        if (root) root._paintXP = null;
    };
})();
