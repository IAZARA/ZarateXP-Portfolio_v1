(function () {
    'use strict';

    const DIFFICULTIES = Object.freeze({
        beginner: Object.freeze({ label: 'Principiante', rows: 9, cols: 9, mines: 10 }),
        intermediate: Object.freeze({ label: 'Intermedio', rows: 16, cols: 16, mines: 40 }),
        expert: Object.freeze({ label: 'Experto', rows: 16, cols: 30, mines: 99 })
    });

    const STORAGE_KEY = 'zaratexp-minesweeper-preferences-v2';
    const LONG_PRESS_MS = 480;

    class MinesweeperXP {
        constructor(root) {
            this.root = root;
            this.boardElement = root.querySelector('[data-ms-board]');
            this.mineCounter = root.querySelector('[data-ms-mines]');
            this.timerDisplay = root.querySelector('[data-ms-timer]');
            this.resetButton = root.querySelector('[data-ms-reset]');
            this.statusElement = root.querySelector('[data-ms-status]');
            this.difficultyButtons = Array.from(root.querySelectorAll('[data-ms-difficulty]'));
            this.commandButtons = Array.from(root.querySelectorAll('[data-ms-command]'));

            if (!this.boardElement) {
                throw new Error('No se encontro el tablero de Buscaminas.');
            }

            this.cells = [];
            this.board = [];
            this.boundHandlers = [];
            this.timerId = null;
            this.timerStartedAt = 0;
            this.longPressId = null;
            this.longPressTriggered = false;
            this.longPressCellKey = '';
            this.lastTouchAt = 0;
            this.focusedCellIndex = 0;
            this.destroyed = false;

            const preferences = this.readPreferences();
            this.bestTimes = preferences.bestTimes;
            this.difficultyKey = DIFFICULTIES[preferences.difficulty]
                ? preferences.difficulty
                : 'beginner';

            this.attachStaticEvents();
            this.newGame(this.difficultyKey);
        }

        attachStaticEvents() {
            this.on(this.resetButton, 'click', () => this.newGame(this.difficultyKey));

            this.difficultyButtons.forEach((button) => {
                this.on(button, 'click', () => this.newGame(button.dataset.msDifficulty));
            });

            this.commandButtons.forEach((button) => {
                this.on(button, 'click', () => {
                    const command = button.dataset.msCommand;
                    if (command === 'new') this.newGame(this.difficultyKey);
                    if (command === 'help') {
                        this.setStatus('Abre todas las casillas seguras. Clic derecho, tecla F o pulsacion larga colocan una bandera. Pulsa un numero para despejar alrededor.');
                        this.focusCell(this.focusedCellIndex);
                    }
                });
            });

            this.on(this.boardElement, 'click', (event) => {
                const target = this.cellElementFromEvent(event);
                if (!target) return;

                const key = this.keyFromElement(target);
                if (this.longPressTriggered && this.longPressCellKey === key) {
                    this.longPressTriggered = false;
                    this.longPressCellKey = '';
                    event.preventDefault();
                    return;
                }

                this.longPressTriggered = false;
                this.longPressCellKey = '';
                this.rememberFocusedCell(target);
                this.primaryAction(Number(target.dataset.row), Number(target.dataset.col));
            });

            this.on(this.boardElement, 'contextmenu', (event) => {
                const target = this.cellElementFromEvent(event);
                if (!target) return;
                event.preventDefault();

                const key = this.keyFromElement(target);
                this.cancelLongPress();
                if (this.longPressTriggered && this.longPressCellKey === key) return;

                // Only touch context menus emit a synthetic click that must be
                // consumed. A mouse right-click must not swallow the next left-click.
                if (Date.now() - this.lastTouchAt < 1200) {
                    this.longPressTriggered = true;
                    this.longPressCellKey = key;
                } else {
                    this.longPressTriggered = false;
                    this.longPressCellKey = '';
                }
                this.rememberFocusedCell(target);
                this.secondaryAction(Number(target.dataset.row), Number(target.dataset.col));
            });

            this.on(this.boardElement, 'keydown', (event) => this.handleKey(event));
            this.on(this.boardElement, 'pointerdown', (event) => this.handlePointerDown(event));
            this.on(this.boardElement, 'pointerup', () => this.handlePointerEnd());
            this.on(this.boardElement, 'pointercancel', () => this.handlePointerEnd());
            this.on(this.boardElement, 'pointerleave', () => this.cancelLongPress());

            this.on(document, 'pointerup', () => {
                if (this.state === 'ready' || this.state === 'playing') {
                    this.setFace(':)');
                }
            });

            this.on(window, 'blur', () => {
                this.cancelLongPress();
                if (this.state === 'ready' || this.state === 'playing') this.setFace(':)');
            });

            this.on(document, 'visibilitychange', () => {
                if (document.visibilityState === 'visible' && this.state === 'playing') {
                    this.syncTimer();
                }
            });
        }

        on(target, eventName, handler, options) {
            if (!target) return;
            target.addEventListener(eventName, handler, options);
            this.boundHandlers.push({ target, eventName, handler, options });
        }

        newGame(difficultyKey) {
            const resolvedKey = DIFFICULTIES[difficultyKey] ? difficultyKey : 'beginner';
            const config = DIFFICULTIES[resolvedKey];

            this.cancelLongPress();
            this.stopTimer();
            this.config = config;
            this.difficultyKey = resolvedKey;
            this.state = 'ready';
            this.firstClick = true;
            this.minesPlaced = false;
            this.revealed = 0;
            this.flags = 0;
            this.timer = 0;
            this.hitCell = null;
            this.focusedCellIndex = 0;

            this.board = Array.from({ length: config.rows }, (_, row) =>
                Array.from({ length: config.cols }, (_, col) => ({
                    row,
                    col,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    question: false,
                    neighborMines: 0
                }))
            );

            this.difficultyButtons.forEach((button) => {
                const active = button.dataset.msDifficulty === this.difficultyKey;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });

            this.setFace(':)');
            this.updateCounters();
            this.renderBoard();
            this.setStatus(`Primer clic seguro en ${config.label}. Las minas se muestran al perder; clic derecho o pulsacion larga marca banderas.`);
            this.savePreferences();
        }

        renderBoard() {
            const { rows, cols } = this.config;
            this.boardElement.style.setProperty('--ms-rows', rows);
            this.boardElement.style.setProperty('--ms-cols', cols);
            this.boardElement.setAttribute('aria-rowcount', String(rows));
            this.boardElement.setAttribute('aria-colcount', String(cols));
            this.boardElement.setAttribute('aria-label', `Tablero de Buscaminas, ${rows} por ${cols}, ${this.config.mines} minas`);
            this.boardElement.replaceChildren();

            const fragment = document.createDocumentFragment();
            this.cells = [];

            this.board.flat().forEach((cell, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'xp-cell';
                button.dataset.row = String(cell.row);
                button.dataset.col = String(cell.col);
                button.setAttribute('role', 'gridcell');
                button.setAttribute('aria-rowindex', String(cell.row + 1));
                button.setAttribute('aria-colindex', String(cell.col + 1));
                button.setAttribute('aria-label', this.coveredCellLabel(cell));
                button.tabIndex = index === this.focusedCellIndex ? 0 : -1;

                this.cells.push(button);
                fragment.appendChild(button);
            });

            this.boardElement.appendChild(fragment);
        }

        handleKey(event) {
            const target = this.cellElementFromEvent(event);
            if (!target) return;

            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            const key = event.key;

            if (key === 'Enter' || key === ' ') {
                event.preventDefault();
                this.rememberFocusedCell(target);
                this.primaryAction(row, col);
                return;
            }

            if (key.toLowerCase() === 'f' || key === 'ContextMenu' || (key === 'F10' && event.shiftKey)) {
                event.preventDefault();
                this.rememberFocusedCell(target);
                this.secondaryAction(row, col);
                return;
            }

            let nextRow = row;
            let nextCol = col;
            if (key === 'ArrowUp') nextRow = Math.max(0, row - 1);
            else if (key === 'ArrowDown') nextRow = Math.min(this.config.rows - 1, row + 1);
            else if (key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
            else if (key === 'ArrowRight') nextCol = Math.min(this.config.cols - 1, col + 1);
            else if (key === 'Home') nextCol = 0;
            else if (key === 'End') nextCol = this.config.cols - 1;
            else return;

            event.preventDefault();
            this.focusCell(nextRow * this.config.cols + nextCol);
        }

        handlePointerDown(event) {
            const target = this.cellElementFromEvent(event);
            if (!target || (event.button !== 0 && event.pointerType === 'mouse')) return;

            this.rememberFocusedCell(target);
            if (this.state === 'ready' || this.state === 'playing') this.setFace(':O');

            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

            this.lastTouchAt = Date.now();
            this.cancelLongPress();
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            const key = this.key(row, col);
            this.longPressCellKey = key;
            this.longPressId = window.setTimeout(() => {
                this.longPressId = null;
                this.longPressTriggered = true;
                this.longPressCellKey = key;
                this.secondaryAction(row, col);
                if (navigator.vibrate) navigator.vibrate(24);
            }, LONG_PRESS_MS);
        }

        handlePointerEnd() {
            this.cancelLongPress();
            if (this.state === 'ready' || this.state === 'playing') this.setFace(':)');
        }

        cancelLongPress() {
            if (this.longPressId !== null) {
                window.clearTimeout(this.longPressId);
                this.longPressId = null;
            }
        }

        primaryAction(row, col) {
            if (this.state === 'lost' || this.state === 'won') return;
            const cell = this.getCell(row, col);
            if (!cell || cell.flagged) return;

            if (cell.revealed) {
                this.revealAroundIfSatisfied(cell);
                return;
            }

            if (this.firstClick) {
                this.placeMines(row, col);
                this.firstClick = false;
                this.state = 'playing';
                this.startTimer();
            }

            this.revealCell(row, col);
            this.paintBoard();
            this.checkWin();
        }

        secondaryAction(row, col) {
            if (this.state === 'lost' || this.state === 'won') return;
            const cell = this.getCell(row, col);
            if (!cell || cell.revealed) return;

            if (!cell.flagged && !cell.question) {
                cell.flagged = true;
                this.flags += 1;
            } else if (cell.flagged) {
                cell.flagged = false;
                cell.question = true;
                this.flags -= 1;
            } else {
                cell.question = false;
            }

            this.updateCounters();
            this.paintCell(cell);
            const remaining = this.config.mines - this.flags;
            this.setStatus(cell.flagged
                ? `Bandera colocada. ${Math.max(0, remaining)} minas estimadas por marcar.`
                : cell.question
                    ? 'Casilla marcada como dudosa.'
                    : 'Marca eliminada.');
        }

        placeMines(safeRow, safeCol) {
            this.board.flat().forEach((cell) => {
                cell.mine = false;
                cell.neighborMines = 0;
            });

            const clicked = this.getCell(safeRow, safeCol);
            let safeCells = new Set(
                this.neighbors(safeRow, safeCol)
                    .concat(clicked)
                    .filter(Boolean)
                    .map((cell) => this.key(cell.row, cell.col))
            );

            let candidates = this.board.flat().filter((cell) => !safeCells.has(this.key(cell.row, cell.col)));

            // Custom boards with very high mine density still keep the clicked cell safe.
            if (candidates.length < this.config.mines) {
                safeCells = new Set([this.key(safeRow, safeCol)]);
                candidates = this.board.flat().filter((cell) => !safeCells.has(this.key(cell.row, cell.col)));
            }

            this.shuffle(candidates);
            const mines = candidates.slice(0, this.config.mines);
            mines.forEach((cell) => {
                cell.mine = true;
            });

            this.board.flat().forEach((cell) => {
                if (!cell.mine) {
                    cell.neighborMines = this.neighbors(cell.row, cell.col)
                        .reduce((total, neighbor) => total + Number(neighbor.mine), 0);
                }
            });

            if (mines.length !== this.config.mines || clicked?.mine) {
                throw new Error('No se pudo generar un tablero valido de Buscaminas.');
            }

            this.minesPlaced = true;
            this.setStatus(`${this.config.mines} minas distribuidas. Despeja todas las casillas seguras.`);
        }

        revealCell(row, col) {
            const start = this.getCell(row, col);
            if (!start || start.revealed || start.flagged) return;

            if (start.mine) {
                this.lose(start);
                return;
            }

            const queue = [start];
            const queued = new Set([this.key(start.row, start.col)]);

            for (let index = 0; index < queue.length; index += 1) {
                const cell = queue[index];
                if (!cell || cell.revealed || cell.flagged || cell.mine) continue;

                cell.revealed = true;
                cell.question = false;
                this.revealed += 1;

                if (cell.neighborMines !== 0) continue;

                this.neighbors(cell.row, cell.col).forEach((neighbor) => {
                    const neighborKey = this.key(neighbor.row, neighbor.col);
                    if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine && !queued.has(neighborKey)) {
                        queued.add(neighborKey);
                        queue.push(neighbor);
                    }
                });
            }
        }

        revealAroundIfSatisfied(cell) {
            if (!cell.revealed || cell.neighborMines === 0) return;
            const adjacent = this.neighbors(cell.row, cell.col);
            const flagged = adjacent.filter((neighbor) => neighbor.flagged).length;
            if (flagged !== cell.neighborMines) {
                this.setStatus(`Esta casilla necesita ${cell.neighborMines} banderas alrededor; hay ${flagged}.`);
                return;
            }

            for (const neighbor of adjacent) {
                if (!neighbor.flagged && !neighbor.revealed) {
                    this.revealCell(neighbor.row, neighbor.col);
                    if (this.state === 'lost') break;
                }
            }

            this.paintBoard();
            this.checkWin();
        }

        lose(hitCell) {
            this.syncTimer();
            this.state = 'lost';
            this.stopTimer();
            this.hitCell = hitCell;
            this.setFace('X(');

            this.board.flat().forEach((cell) => {
                if (cell.mine) cell.revealed = true;
            });

            this.setStatus(`Perdiste en ${this.formatTimeLabel(this.timer)}. Todas las minas estan visibles; pulsa la cara para reiniciar.`);
        }

        checkWin() {
            if (this.state === 'lost' || this.state === 'won') return;
            const totalSafe = this.config.rows * this.config.cols - this.config.mines;
            if (this.revealed !== totalSafe) return;

            this.syncTimer();
            this.state = 'won';
            this.stopTimer();
            this.setFace('B)');

            this.board.flat().forEach((cell) => {
                if (cell.mine && !cell.flagged) {
                    cell.flagged = true;
                    this.flags += 1;
                }
            });

            const previousBest = this.bestTimes[this.difficultyKey];
            const isRecord = !Number.isInteger(previousBest) || this.timer < previousBest;
            if (isRecord) {
                this.bestTimes[this.difficultyKey] = this.timer;
                this.savePreferences();
            }

            this.setStatus(`Ganaste en ${this.formatTimeLabel(this.timer)}${isRecord ? ' — nuevo mejor tiempo.' : ` — record: ${this.formatTimeLabel(previousBest)}.`}`);
            this.updateCounters();
            this.paintBoard();
        }

        paintBoard() {
            this.board.flat().forEach((cell) => this.paintCell(cell));
            this.updateCounters();
        }

        paintCell(cell) {
            const element = this.getCellElement(cell.row, cell.col);
            if (!element) return;

            element.className = 'xp-cell';
            element.replaceChildren();
            element.removeAttribute('data-value');
            element.removeAttribute('data-mine');
            element.removeAttribute('title');
            element.style.removeProperty('background-color');

            if (cell.revealed) {
                element.classList.add('revealed');

                if (cell.mine) {
                    const exploded = cell === this.hitCell;
                    element.classList.add(exploded ? 'mine-hit' : 'mine-revealed', 'mine-visible');
                    element.dataset.mine = exploded ? 'hit' : 'revealed';
                    element.setAttribute('aria-label', exploded ? 'Mina detonada' : 'Mina visible');
                    element.title = exploded ? 'Mina detonada' : 'Mina';
                    this.appendMineGlyph(element);
                    return;
                }

                if (cell.neighborMines > 0) {
                    element.textContent = String(cell.neighborMines);
                    element.dataset.value = String(cell.neighborMines);
                    element.setAttribute('aria-label', `${cell.neighborMines} ${cell.neighborMines === 1 ? 'mina cercana' : 'minas cercanas'}`);
                    element.title = `${cell.neighborMines} alrededor`;
                } else {
                    element.setAttribute('aria-label', 'Casilla vacia');
                }
                return;
            }

            if (this.state === 'lost' && cell.flagged && !cell.mine) {
                element.classList.add('flagged', 'wrong-flag');
                element.setAttribute('aria-label', 'Bandera incorrecta');
                element.title = 'Aqui no habia una mina';
            } else if (cell.flagged) {
                element.classList.add('flagged');
                element.setAttribute('aria-label', `Bandera en fila ${cell.row + 1}, columna ${cell.col + 1}`);
                element.title = 'Bandera';
            } else if (cell.question) {
                element.classList.add('question');
                element.textContent = '?';
                element.setAttribute('aria-label', `Casilla dudosa en fila ${cell.row + 1}, columna ${cell.col + 1}`);
            } else {
                element.setAttribute('aria-label', this.coveredCellLabel(cell));
            }
        }

        appendMineGlyph(element) {
            // The visible glyph is intentional: it keeps mines legible even when
            // pseudo-elements, clip-path or an external icon fail to load.
            const glyph = document.createElement('span');
            glyph.textContent = '\u2739';
            glyph.setAttribute('aria-hidden', 'true');
            glyph.style.cssText = 'position:absolute;inset:0;z-index:2;display:grid;place-items:center;font:700 14px/1 Arial,sans-serif;color:#050505;text-shadow:0 1px #fff;';
            element.appendChild(glyph);
        }

        updateCounters() {
            const minesLeft = this.config.mines - this.flags;
            if (this.mineCounter) {
                this.mineCounter.textContent = this.formatLed(minesLeft);
                this.mineCounter.setAttribute('aria-label', `${minesLeft} minas por marcar`);
            }
            if (this.timerDisplay) {
                this.timerDisplay.textContent = this.formatLed(this.timer);
                this.timerDisplay.setAttribute('aria-label', `${this.timer} segundos`);
            }
        }

        startTimer() {
            this.stopTimer();
            this.timerStartedAt = Date.now() - this.timer * 1000;
            this.timerId = window.setInterval(() => this.syncTimer(), 250);
        }

        syncTimer() {
            if (this.state !== 'playing') return;
            const nextValue = Math.min(999, Math.floor((Date.now() - this.timerStartedAt) / 1000));
            if (nextValue !== this.timer) {
                this.timer = nextValue;
                this.updateCounters();
            }
            if (this.timer >= 999) this.stopTimer();
        }

        stopTimer() {
            if (this.timerId !== null) {
                window.clearInterval(this.timerId);
                this.timerId = null;
            }
        }

        setStatus(message) {
            if (this.statusElement) this.statusElement.textContent = message;
        }

        setFace(value) {
            if (this.resetButton) this.resetButton.textContent = value;
        }

        formatLed(value) {
            const normalized = Math.max(-99, Math.min(999, Math.trunc(Number(value) || 0)));
            if (normalized < 0) return `-${String(Math.abs(normalized)).padStart(2, '0')}`;
            return String(normalized).padStart(3, '0');
        }

        formatTimeLabel(value) {
            const seconds = Math.max(0, Number(value) || 0);
            return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
        }

        coveredCellLabel(cell) {
            return `Casilla cubierta, fila ${cell.row + 1}, columna ${cell.col + 1}`;
        }

        getCell(row, col) {
            if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
            if (row < 0 || col < 0 || row >= this.config.rows || col >= this.config.cols) return null;
            return this.board[row][col];
        }

        getCellElement(row, col) {
            return this.cells[row * this.config.cols + col] || null;
        }

        neighbors(row, col) {
            const results = [];
            for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
                for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
                    if (rowOffset === 0 && colOffset === 0) continue;
                    const neighbor = this.getCell(row + rowOffset, col + colOffset);
                    if (neighbor) results.push(neighbor);
                }
            }
            return results;
        }

        cellElementFromEvent(event) {
            const target = event.target instanceof Element ? event.target.closest('.xp-cell') : null;
            return target && this.boardElement.contains(target) ? target : null;
        }

        keyFromElement(element) {
            return this.key(Number(element.dataset.row), Number(element.dataset.col));
        }

        key(row, col) {
            return `${row}:${col}`;
        }

        rememberFocusedCell(element) {
            const index = Number(element.dataset.row) * this.config.cols + Number(element.dataset.col);
            this.setRovingTabIndex(index, false);
        }

        focusCell(index) {
            const normalized = Math.max(0, Math.min(this.cells.length - 1, index));
            this.setRovingTabIndex(normalized, true);
        }

        setRovingTabIndex(index, shouldFocus) {
            const previous = this.cells[this.focusedCellIndex];
            if (previous) previous.tabIndex = -1;
            this.focusedCellIndex = index;
            const next = this.cells[index];
            if (!next) return;
            next.tabIndex = 0;
            if (shouldFocus) next.focus({ preventScroll: true });
        }

        shuffle(items) {
            for (let index = items.length - 1; index > 0; index -= 1) {
                const swapIndex = this.randomInteger(index + 1);
                [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
            }
        }

        randomInteger(maxExclusive) {
            if (window.crypto?.getRandomValues && maxExclusive > 0) {
                const range = 0x100000000;
                const limit = range - (range % maxExclusive);
                const buffer = new Uint32Array(1);
                do {
                    window.crypto.getRandomValues(buffer);
                } while (buffer[0] >= limit);
                return buffer[0] % maxExclusive;
            }
            return Math.floor(Math.random() * maxExclusive);
        }

        readPreferences() {
            const fallback = { difficulty: 'beginner', bestTimes: {} };
            try {
                const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
                if (!parsed || typeof parsed !== 'object') return fallback;

                const bestTimes = {};
                Object.keys(DIFFICULTIES).forEach((key) => {
                    const value = Number(parsed.bestTimes?.[key]);
                    if (Number.isInteger(value) && value >= 0 && value <= 999) bestTimes[key] = value;
                });

                return {
                    difficulty: DIFFICULTIES[parsed.difficulty] ? parsed.difficulty : 'beginner',
                    bestTimes
                };
            } catch (_error) {
                return fallback;
            }
        }

        savePreferences() {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    difficulty: this.difficultyKey,
                    bestTimes: this.bestTimes
                }));
            } catch (_error) {
                // Storage can be disabled; the game itself remains fully usable.
            }
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.cancelLongPress();
            this.stopTimer();
            this.boundHandlers.forEach(({ target, eventName, handler, options }) => {
                target.removeEventListener(eventName, handler, options);
            });
            this.boundHandlers = [];
        }
    }

    window.initMinesweeperGame = function initMinesweeperGame(scope = document) {
        const root = scope.querySelector?.('[data-minesweeper-root]') || document.querySelector('[data-minesweeper-root]');
        if (!root) return null;
        if (root._minesweeperXP) root._minesweeperXP.destroy();
        root._minesweeperXP = new MinesweeperXP(root);
        return root._minesweeperXP;
    };

    window.destroyMinesweeperGame = function destroyMinesweeperGame(scope = document) {
        const root = scope.querySelector?.('[data-minesweeper-root]') || document.querySelector('[data-minesweeper-root]');
        if (root?._minesweeperXP) {
            root._minesweeperXP.destroy();
            root._minesweeperXP = null;
        }
    };
})();
