(function () {
    const DIFFICULTIES = {
        beginner: { label: 'Principiante', rows: 9, cols: 9, mines: 10 },
        intermediate: { label: 'Intermedio', rows: 16, cols: 16, mines: 40 },
        expert: { label: 'Experto', rows: 16, cols: 30, mines: 99 }
    };

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
            this.cells = [];
            this.timerId = null;
            this.timer = 0;
            this.difficultyKey = 'beginner';
            this.boundHandlers = [];

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
                    if (button.dataset.msCommand === 'new') {
                        this.newGame(this.difficultyKey);
                    }
                    if (button.dataset.msCommand === 'help') {
                        this.setStatus('Objetivo: descubre todas las celdas sin minas. Click derecho marca banderas.');
                    }
                });
            });

            this.on(this.boardElement, 'contextmenu', (event) => event.preventDefault());
            this.on(this.boardElement, 'mousedown', (event) => {
                if (event.target.closest('.xp-cell') && this.state === 'ready') {
                    this.resetButton.textContent = ':O';
                }
            });
            this.on(document, 'mouseup', () => {
                if (this.state === 'ready') this.resetButton.textContent = ':)';
            });
        }

        on(target, eventName, handler) {
            if (!target) return;
            target.addEventListener(eventName, handler);
            this.boundHandlers.push({ target, eventName, handler });
        }

        newGame(difficultyKey) {
            const config = DIFFICULTIES[difficultyKey] || DIFFICULTIES.beginner;
            this.config = config;
            this.difficultyKey = difficultyKey in DIFFICULTIES ? difficultyKey : 'beginner';
            this.state = 'ready';
            this.firstClick = true;
            this.revealed = 0;
            this.flags = 0;
            this.timer = 0;
            this.stopTimer();

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
                button.classList.toggle('active', button.dataset.msDifficulty === this.difficultyKey);
            });

            this.resetButton.textContent = ':)';
            this.setStatus('Primer clic seguro. Click derecho para marcar.');
            this.updateCounters();
            this.renderBoard();
        }

        renderBoard() {
            const { rows, cols } = this.config;
            this.boardElement.style.setProperty('--ms-rows', rows);
            this.boardElement.style.setProperty('--ms-cols', cols);
            this.boardElement.replaceChildren();

            const fragment = document.createDocumentFragment();
            this.cells = [];

            this.board.flat().forEach((cell) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'xp-cell';
                button.dataset.row = String(cell.row);
                button.dataset.col = String(cell.col);
                button.setAttribute('role', 'gridcell');
                button.setAttribute('aria-label', `Celda ${cell.row + 1}, ${cell.col + 1}`);

                button.addEventListener('click', () => this.primaryAction(cell.row, cell.col));
                button.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    this.secondaryAction(cell.row, cell.col);
                });
                button.addEventListener('keydown', (event) => this.handleKey(event, cell.row, cell.col));

                this.cells.push(button);
                fragment.appendChild(button);
            });

            this.boardElement.appendChild(fragment);
        }

        handleKey(event, row, col) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.primaryAction(row, col);
            }
            if (event.key.toLowerCase() === 'f') {
                event.preventDefault();
                this.secondaryAction(row, col);
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
        }

        placeMines(safeRow, safeCol) {
            const safeCells = new Set(
                this.neighbors(safeRow, safeCol)
                    .concat(this.getCell(safeRow, safeCol))
                    .filter(Boolean)
                    .map((cell) => this.key(cell.row, cell.col))
            );

            const candidates = this.board
                .flat()
                .filter((cell) => !safeCells.has(this.key(cell.row, cell.col)));

            this.shuffle(candidates);
            candidates.slice(0, this.config.mines).forEach((cell) => {
                cell.mine = true;
            });

            this.board.flat().forEach((cell) => {
                if (!cell.mine) {
                    cell.neighborMines = this.neighbors(cell.row, cell.col).filter((neighbor) => neighbor.mine).length;
                }
            });
        }

        revealCell(row, col) {
            const start = this.getCell(row, col);
            if (!start || start.revealed || start.flagged) return;

            if (start.mine) {
                this.lose(start);
                return;
            }

            const queue = [start];
            while (queue.length) {
                const cell = queue.shift();
                if (!cell || cell.revealed || cell.flagged) continue;

                cell.revealed = true;
                cell.question = false;
                this.revealed += 1;

                if (cell.neighborMines === 0) {
                    this.neighbors(cell.row, cell.col).forEach((neighbor) => {
                        if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                            queue.push(neighbor);
                        }
                    });
                }
            }
        }

        revealAroundIfSatisfied(cell) {
            if (!cell.revealed || cell.neighborMines === 0) return;
            const adjacent = this.neighbors(cell.row, cell.col);
            const flagged = adjacent.filter((neighbor) => neighbor.flagged).length;
            if (flagged !== cell.neighborMines) return;

            adjacent.forEach((neighbor) => {
                if (!neighbor.flagged && !neighbor.revealed) {
                    this.revealCell(neighbor.row, neighbor.col);
                }
            });

            this.paintBoard();
            this.checkWin();
        }

        lose(hitCell) {
            this.state = 'lost';
            this.stopTimer();
            this.resetButton.textContent = 'X(';
            this.setStatus('Perdiste. Reinicia y vuelve a intentarlo.');

            this.board.flat().forEach((cell) => {
                if (cell.mine) cell.revealed = true;
            });

            this.hitCell = hitCell;
        }

        checkWin() {
            if (this.state === 'lost') return;
            const totalSafe = this.config.rows * this.config.cols - this.config.mines;
            if (this.revealed < totalSafe) return;

            this.state = 'won';
            this.stopTimer();
            this.resetButton.textContent = 'B)';

            this.board.flat().forEach((cell) => {
                if (cell.mine && !cell.flagged) {
                    cell.flagged = true;
                    this.flags += 1;
                }
            });

            this.setStatus('Ganaste. Todas las minas quedaron identificadas.');
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
            element.textContent = '';
            element.removeAttribute('data-value');
            element.setAttribute('aria-pressed', cell.revealed ? 'true' : 'false');

            if (cell.revealed) {
                element.classList.add('revealed');

                if (cell.mine) {
                    element.classList.add(cell === this.hitCell ? 'mine-hit' : 'mine-revealed');
                    element.setAttribute('aria-label', 'Mina');
                    return;
                }

                if (cell.neighborMines > 0) {
                    element.textContent = String(cell.neighborMines);
                    element.dataset.value = String(cell.neighborMines);
                    element.setAttribute('aria-label', `${cell.neighborMines} minas cercanas`);
                } else {
                    element.setAttribute('aria-label', 'Celda vacia');
                }
                return;
            }

            if (cell.flagged) {
                element.classList.add('flagged');
                element.setAttribute('aria-label', 'Celda marcada con bandera');
            } else if (cell.question) {
                element.classList.add('question');
                element.textContent = '?';
                element.setAttribute('aria-label', 'Celda dudosa');
            } else {
                element.setAttribute('aria-label', `Celda ${cell.row + 1}, ${cell.col + 1}`);
            }

            if (this.state === 'lost' && cell.flagged && !cell.mine) {
                element.classList.add('wrong-flag');
            }
        }

        updateCounters() {
            const minesLeft = this.config.mines - this.flags;
            this.mineCounter.textContent = this.formatLed(minesLeft);
            this.timerDisplay.textContent = this.formatLed(this.timer);
        }

        startTimer() {
            this.stopTimer();
            this.timerId = window.setInterval(() => {
                this.timer = Math.min(this.timer + 1, 999);
                this.updateCounters();
                if (this.timer >= 999) this.stopTimer();
            }, 1000);
        }

        stopTimer() {
            if (this.timerId) {
                window.clearInterval(this.timerId);
                this.timerId = null;
            }
        }

        setStatus(message) {
            this.statusElement.textContent = message;
        }

        formatLed(value) {
            const prefix = value < 0 ? '-' : '';
            return prefix + String(Math.abs(value)).padStart(3 - prefix.length, '0').slice(0, 3);
        }

        getCell(row, col) {
            if (row < 0 || col < 0 || row >= this.config.rows || col >= this.config.cols) return null;
            return this.board[row][col];
        }

        getCellElement(row, col) {
            return this.cells[row * this.config.cols + col];
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

        key(row, col) {
            return `${row}:${col}`;
        }

        shuffle(items) {
            for (let index = items.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
            }
        }

        destroy() {
            this.stopTimer();
            this.boundHandlers.forEach(({ target, eventName, handler }) => {
                target.removeEventListener(eventName, handler);
            });
            this.boundHandlers = [];
        }
    }

    window.initMinesweeperGame = function initMinesweeperGame(scope = document) {
        const root = scope.querySelector?.('[data-minesweeper-root]') || document.querySelector('[data-minesweeper-root]');
        if (!root) return null;
        if (root._minesweeperXP) {
            root._minesweeperXP.destroy();
        }
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
