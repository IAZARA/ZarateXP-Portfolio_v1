(function () {
    'use strict';

    const SUITS = ['H', 'D', 'C', 'S'];
    const SUIT_ENTITIES = { H: '&hearts;', D: '&diams;', C: '&clubs;', S: '&spades;' };
    const SUIT_NAMES = { H: 'corazones', D: 'diamantes', C: 'tréboles', S: 'picas' };
    const RED_SUITS = new Set(['H', 'D']);
    const OPPOSITE_SUITS = {
        H: ['C', 'S'],
        D: ['C', 'S'],
        C: ['H', 'D'],
        S: ['H', 'D']
    };
    const STORAGE_KEY = 'zarateXP.solitaire.v2';
    const BEST_KEY = 'zarateXP.solitaire.best.v1';
    const STORAGE_VERSION = 2;
    const HISTORY_LIMIT = 80;
    const AUTO_MOVE_DELAY = 120;

    class SolitaireApp {
        constructor(scope) {
            this.windowElement = scope || document;
            this.root = this.resolveRoot(scope);

            if (!this.root) {
                throw new Error('No se encontró el contenedor de Solitario');
            }

            this.status = this.requiredElement('[data-solitaire-status]');
            this.scoreEl = this.requiredElement('[data-solitaire-score]');
            this.stockEl = this.requiredElement('[data-pile="stock"]');
            this.wasteEl = this.requiredElement('[data-pile="waste"]');
            this.foundationsEl = this.requiredElement('[data-foundations]');
            this.tableauEl = this.requiredElement('[data-tableau]');
            this.boardEl = this.root.querySelector('.xp-solitaire-board') || this.tableauEl.parentElement;

            this.history = [];
            this.selected = null;
            this.hint = null;
            this.moves = 0;
            this.scoreValue = 0;
            this.elapsedSeconds = 0;
            this.timerStartedAt = null;
            this.won = false;
            this.winBonusApplied = false;
            this.recycleCount = 0;
            this.best = { score: 0, time: null };
            this.initialized = false;
            this.destroyed = false;
            this.autoRunning = false;
            this.autoTimer = null;
            this.autoToken = 0;
            this.dragTarget = null;
            this.ignoreClickUntil = 0;
            this.lastPersistAt = 0;
            this.resumeAfterVisibility = false;

            this.boundClick = (event) => this.handleClick(event);
            this.boundDoubleClick = (event) => this.handleDoubleClick(event);
            this.boundKeyDown = (event) => this.handleKeyDown(event);
            this.boundDragStart = (event) => this.handleDragStart(event);
            this.boundDragOver = (event) => this.handleDragOver(event);
            this.boundDrop = (event) => this.handleDrop(event);
            this.boundDragEnd = () => this.handleDragEnd();
            this.boundVisibilityChange = () => this.handleVisibilityChange();
            this.boundPageHide = () => this.persistState();
            this.boundNewGame = () => this.newGame();
            this.boundUndo = () => this.undo();
            this.boundHint = () => this.showHint();
            this.boundAuto = () => this.autoComplete();
        }

        resolveRoot(scope) {
            if (scope?.matches?.('[data-solitaire-root]')) return scope;
            return scope?.querySelector?.('[data-solitaire-root]')
                || document.querySelector('[data-solitaire-root]');
        }

        requiredElement(selector) {
            const element = this.root.querySelector(selector);
            if (!element) throw new Error(`Falta el elemento ${selector}`);
            return element;
        }

        init() {
            if (this.initialized) return this;

            this.ensureOptionalControls();
            this.newButton = this.root.querySelector('[data-solitaire-new]');
            this.undoButton = this.root.querySelector('[data-solitaire-undo]');
            this.hintButton = this.root.querySelector('[data-solitaire-hint]');
            this.autoButton = this.root.querySelector('[data-solitaire-auto]');
            this.timeEl = this.root.querySelector('[data-solitaire-time]');
            this.movesEl = this.root.querySelector('[data-solitaire-moves]');
            this.bestEl = this.root.querySelector('[data-solitaire-best]');

            this.configureAccessibility();
            this.newButton?.addEventListener('click', this.boundNewGame);
            this.undoButton?.addEventListener('click', this.boundUndo);
            this.hintButton?.addEventListener('click', this.boundHint);
            this.autoButton?.addEventListener('click', this.boundAuto);
            this.root.addEventListener('click', this.boundClick);
            this.root.addEventListener('dblclick', this.boundDoubleClick);
            this.root.addEventListener('keydown', this.boundKeyDown);
            this.root.addEventListener('dragstart', this.boundDragStart);
            this.root.addEventListener('dragover', this.boundDragOver);
            this.root.addEventListener('drop', this.boundDrop);
            this.root.addEventListener('dragend', this.boundDragEnd);
            document.addEventListener('visibilitychange', this.boundVisibilityChange);
            window.addEventListener('pagehide', this.boundPageHide);

            this.best = this.loadBest();
            if (this.restoreState()) {
                this.setStatus(this.won
                    ? 'Partida completada. Inicia una nueva cuando quieras'
                    : 'Partida recuperada. Continúa donde la dejaste');
                if (!this.won && this.moves > 0) this.startTimer();
                this.render({ persist: false });
            } else {
                this.newGame({ announce: false });
            }

            this.tickInterval = window.setInterval(() => this.tick(), 1000);
            this.initialized = true;
            return this;
        }

        ensureOptionalControls() {
            const toolbar = this.root.querySelector('.xp-solitaire-toolbar');
            if (!toolbar) return;

            const status = toolbar.querySelector('[data-solitaire-status]');
            const controls = [
                ['[data-solitaire-hint]', 'data-solitaire-hint', 'Pista'],
                ['[data-solitaire-auto]', 'data-solitaire-auto', 'Auto']
            ];

            controls.forEach(([selector, attribute, label]) => {
                if (toolbar.querySelector(selector)) return;
                const button = document.createElement('button');
                button.type = 'button';
                button.setAttribute(attribute, '');
                button.dataset.solitaireGenerated = 'true';
                button.textContent = label;
                toolbar.insertBefore(button, status || null);
            });
        }

        configureAccessibility() {
            this.root.setAttribute('role', 'region');
            this.root.setAttribute('aria-label', 'Solitario Klondike. Usa Tab para recorrer cartas, Enter para seleccionar, H para pedir una pista y Control Z para deshacer');
            this.status.setAttribute('role', 'status');
            this.status.setAttribute('aria-live', 'polite');
            this.status.setAttribute('aria-atomic', 'true');
            this.boardEl?.setAttribute('role', 'group');
            this.boardEl?.setAttribute('aria-label', 'Mesa de Solitario');

            this.setButtonAccessibility(this.newButton, 'Nuevo juego', 'N');
            this.setButtonAccessibility(this.undoButton, 'Deshacer último movimiento', 'Control+Z');
            this.setButtonAccessibility(this.hintButton, 'Mostrar una pista', 'H');
            this.setButtonAccessibility(this.autoButton, 'Mover automáticamente cartas seguras a las fundaciones', 'A');
        }

        setButtonAccessibility(button, label, shortcut) {
            if (!button) return;
            button.setAttribute('aria-label', label);
            button.setAttribute('aria-keyshortcuts', shortcut);
            button.title = `${label} (${shortcut})`;
        }

        newGame(options = {}) {
            this.cancelAutoRun();
            this.stopTimer();

            const deck = this.shuffle(this.createDeck());
            this.stock = [];
            this.waste = [];
            this.foundations = { H: [], D: [], C: [], S: [] };
            this.tableau = Array.from({ length: 7 }, () => []);
            this.history = [];
            this.selected = null;
            this.hint = null;
            this.moves = 0;
            this.scoreValue = 0;
            this.elapsedSeconds = 0;
            this.won = false;
            this.winBonusApplied = false;
            this.recycleCount = 0;

            for (let column = 0; column < 7; column += 1) {
                for (let row = 0; row <= column; row += 1) {
                    const card = deck.pop();
                    card.faceUp = row === column;
                    this.tableau[column].push(card);
                }
            }

            this.stock = deck.map((card) => ({ ...card, faceUp: false }));
            this.setStatus(options.announce === false
                ? 'Solitario listo'
                : 'Nuevo juego repartido. El reloj inicia con el primer movimiento');
            this.render({ persist: true, focusToken: { pile: 'stock' } });
        }

        createDeck() {
            const deck = [];
            SUITS.forEach((suit) => {
                for (let rank = 1; rank <= 13; rank += 1) {
                    deck.push({
                        id: `${suit}-${rank}`,
                        suit,
                        rank,
                        faceUp: false
                    });
                }
            });
            return deck;
        }

        shuffle(deck) {
            const copy = [...deck];
            for (let index = copy.length - 1; index > 0; index -= 1) {
                const target = Math.floor(Math.random() * (index + 1));
                [copy[index], copy[target]] = [copy[target], copy[index]];
            }
            return copy;
        }

        handleClick(event) {
            if (Date.now() < this.ignoreClickUntil) return;
            if (event.target.closest('.xp-solitaire-toolbar')) return;

            const cardButton = event.target.closest('[data-card-id]');
            const pileButton = event.target.closest('[data-pile]');
            const foundationButton = event.target.closest('[data-foundation]');
            const tableauColumn = event.target.closest('[data-tableau-column]');

            this.cancelAutoRun();
            this.clearHint();

            if (foundationButton) {
                this.handleFoundationClick(foundationButton.dataset.foundation);
                return;
            }
            if (cardButton) {
                this.handleCardClick(cardButton);
                return;
            }
            if (pileButton?.dataset.pile === 'stock') {
                this.drawFromStock();
                return;
            }
            if (pileButton?.dataset.pile === 'waste') {
                this.selectWaste();
                return;
            }
            if (tableauColumn) {
                this.handleEmptyTableau(Number(tableauColumn.dataset.tableauColumn));
            }
        }

        handleCardClick(button) {
            const source = button.dataset.source;
            if (source === 'waste') {
                this.selectWaste();
                return;
            }

            if (source === 'foundation') {
                this.handleFoundationClick(button.dataset.suit);
                return;
            }

            const column = Number(button.dataset.column);
            const index = Number(button.dataset.index);
            const pile = this.tableau[column];
            const card = pile?.[index];
            const isTop = Boolean(card && index === pile.length - 1);

            if (!card) return;
            if (!card.faceUp) {
                if (isTop) this.flipTopCard(column);
                else this.setStatus('Esa carta todavía está cubierta');
                return;
            }

            if (!this.isValidTableauSequence(pile.slice(index))) {
                this.setStatus('La secuencia seleccionada no se puede mover');
                return;
            }

            if (this.selected) {
                if (this.selected.cardId === card.id) {
                    this.selected = null;
                    this.setStatus('Selección cancelada');
                    this.syncSelectionClasses();
                    return;
                }

                if (this.selected.type === 'tableau' && this.selected.column === column) {
                    this.selectTableau(column, index);
                    return;
                }

                this.moveSelectedToTableau(column);
                return;
            }

            this.selectTableau(column, index);
        }

        flipTopCard(column) {
            const pile = this.tableau[column];
            const card = pile?.[pile.length - 1];
            if (!card || card.faceUp) return false;

            this.beginAction();
            card.faceUp = true;
            this.moves += 1;
            this.addScore(5);
            this.selected = null;
            this.completeAction(`${this.cardLabel(card)} descubierta`, { cardId: card.id });
            return true;
        }

        selectTableau(column, index) {
            const pile = this.tableau[column];
            const card = pile?.[index];
            if (!card?.faceUp) return;

            const cards = pile.slice(index);
            if (!this.isValidTableauSequence(cards)) {
                this.setStatus('Esa secuencia no está ordenada por color alternado');
                return;
            }

            this.selected = {
                type: 'tableau',
                column,
                index,
                cardId: card.id
            };
            const suffix = cards.length > 1 ? ` y ${cards.length - 1} cartas más` : '';
            this.setStatus(`${this.cardLabel(card)}${suffix} seleccionada`);
            this.syncSelectionClasses();
        }

        handleFoundationClick(suit) {
            if (!SUITS.includes(suit)) return;

            if (!this.selected) {
                this.selectFoundation(suit);
                return;
            }

            if (this.selected.type === 'foundation' && this.selected.suit === suit) {
                this.selected = null;
                this.setStatus('Selección cancelada');
                this.syncSelectionClasses();
                return;
            }

            this.moveSelectedToFoundation(suit);
        }

        handleEmptyTableau(column) {
            if (!this.selected || this.tableau[column]?.length) return;
            this.moveSelectedToTableau(column);
        }

        moveSelectedToTableau(column) {
            if (!this.selected || !Number.isInteger(column) || !this.tableau[column]) return false;
            if (this.selected.type === 'tableau' && this.selected.column === column) {
                this.setStatus('La carta ya está en esa columna');
                return false;
            }

            const movingCards = this.getSelectedCards();
            const targetPile = this.tableau[column];
            const targetCard = targetPile[targetPile.length - 1] || null;
            if (!movingCards.length || !this.canMoveToTableau(movingCards, targetCard)) {
                this.setStatus(targetCard
                    ? `Necesitas una carta de color alternado debajo de ${this.cardLabel(targetCard)}`
                    : 'Solo un rey puede iniciar una columna vacía');
                return false;
            }

            const source = { ...this.selected };
            const movedCardId = movingCards[0].id;
            this.beginAction();
            const removedCards = this.removeSelectedCards();
            if (!removedCards.length) {
                this.history.pop();
                return false;
            }

            targetPile.push(...removedCards);
            this.moves += 1;
            if (source.type === 'waste') this.addScore(5);
            if (source.type === 'foundation') this.addScore(-15);
            const revealed = source.type === 'tableau' && this.revealExposedCard(source.column);
            this.selected = null;
            this.completeAction(revealed
                ? 'Movimiento realizado y nueva carta descubierta'
                : 'Movimiento realizado', { cardId: movedCardId });
            return true;
        }

        moveSelectedToFoundation(suit, options = {}) {
            if (!this.selected || !SUITS.includes(suit)) return false;
            const cards = this.getSelectedCards();
            const card = cards[0];

            if (cards.length !== 1 || !card || card.suit !== suit || !this.canMoveToFoundation(card, suit)) {
                this.setStatus('La fundación necesita la siguiente carta del mismo palo');
                return false;
            }

            if (this.selected.type === 'foundation') {
                this.setStatus('Esa carta ya está en una fundación');
                return false;
            }

            const source = { ...this.selected };
            this.beginAction();
            const removedCard = this.removeSelectedCards()[0];
            if (!removedCard) {
                this.history.pop();
                return false;
            }

            removedCard.faceUp = true;
            this.foundations[suit].push(removedCard);
            this.moves += 1;
            this.addScore(10);
            const revealed = source.type === 'tableau' && this.revealExposedCard(source.column);
            this.selected = null;
            this.completeAction(revealed
                ? `${this.cardLabel(removedCard)} a la fundación. Nueva carta descubierta`
                : `${this.cardLabel(removedCard)} a la fundación`,
            { foundation: suit, silentStatus: options.silentStatus });
            return true;
        }

        drawFromStock() {
            if (!this.stock.length && !this.waste.length) {
                this.setStatus('No quedan cartas en el mazo ni en el descarte');
                return false;
            }

            this.beginAction();
            if (this.stock.length) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
                this.moves += 1;
                this.selected = null;
                this.completeAction(`${this.cardLabel(card)} robada del mazo`, { pile: 'stock' });
                return true;
            }

            this.stock = [...this.waste].reverse().map((card) => ({ ...card, faceUp: false }));
            this.waste = [];
            this.recycleCount += 1;
            this.moves += 1;
            this.selected = null;
            this.completeAction('Descarte reciclado. Puedes volver a robar', { pile: 'stock' });
            return true;
        }

        selectWaste() {
            const card = this.waste[this.waste.length - 1];
            if (!card) {
                this.setStatus('El descarte está vacío');
                return;
            }

            if (this.selected?.type === 'waste' && this.selected.cardId === card.id) {
                this.selected = null;
                this.setStatus('Selección cancelada');
            } else {
                this.selected = { type: 'waste', cardId: card.id };
                this.setStatus(`${this.cardLabel(card)} seleccionada desde el descarte`);
            }
            this.syncSelectionClasses();
        }

        selectFoundation(suit) {
            const pile = this.foundations[suit];
            const card = pile?.[pile.length - 1];
            if (!card) {
                this.setStatus(`La fundación de ${SUIT_NAMES[suit]} está vacía`);
                return;
            }

            this.selected = { type: 'foundation', suit, cardId: card.id };
            this.setStatus(`${this.cardLabel(card)} seleccionada desde la fundación`);
            this.syncSelectionClasses();
        }

        getSelectedCards(selection = this.selected) {
            if (!selection) return [];

            if (selection.type === 'waste') {
                const card = this.waste[this.waste.length - 1];
                return card?.id === selection.cardId ? [card] : [];
            }

            if (selection.type === 'foundation') {
                const pile = this.foundations[selection.suit] || [];
                const card = pile[pile.length - 1];
                return card?.id === selection.cardId ? [card] : [];
            }

            if (selection.type === 'tableau') {
                const pile = this.tableau[selection.column] || [];
                const card = pile[selection.index];
                if (card?.id !== selection.cardId) return [];
                return pile.slice(selection.index);
            }

            return [];
        }

        removeSelectedCards() {
            if (!this.selected) return [];
            if (this.selected.type === 'waste') {
                const card = this.waste[this.waste.length - 1];
                return card?.id === this.selected.cardId ? [this.waste.pop()] : [];
            }
            if (this.selected.type === 'foundation') {
                const pile = this.foundations[this.selected.suit];
                const card = pile[pile.length - 1];
                return card?.id === this.selected.cardId ? [pile.pop()] : [];
            }
            if (this.selected.type === 'tableau') {
                const pile = this.tableau[this.selected.column];
                const card = pile?.[this.selected.index];
                return card?.id === this.selected.cardId ? pile.splice(this.selected.index) : [];
            }
            return [];
        }

        canMoveToTableau(cards, targetCard) {
            if (!cards.length || !cards[0].faceUp || !this.isValidTableauSequence(cards)) return false;
            if (!targetCard) return cards[0].rank === 13;
            return targetCard.faceUp
                && targetCard.rank === cards[0].rank + 1
                && this.cardColor(targetCard) !== this.cardColor(cards[0]);
        }

        isValidTableauSequence(cards) {
            if (!cards.length || cards.some((card) => !card.faceUp)) return false;
            for (let index = 1; index < cards.length; index += 1) {
                const previous = cards[index - 1];
                const current = cards[index];
                if (previous.rank !== current.rank + 1
                    || this.cardColor(previous) === this.cardColor(current)) return false;
            }
            return true;
        }

        canMoveToFoundation(card, suit = card?.suit) {
            if (!card || card.suit !== suit) return false;
            const pile = this.foundations[suit];
            if (!pile.length) return card.rank === 1;
            const top = pile[pile.length - 1];
            return top.suit === suit && top.rank === card.rank - 1;
        }

        revealExposedCard(column) {
            const pile = this.tableau[column];
            const top = pile?.[pile.length - 1];
            if (!top || top.faceUp) return false;
            top.faceUp = true;
            this.addScore(5);
            return true;
        }

        beginAction() {
            this.clearHint();
            this.startTimer();
            this.pushHistory();
        }

        completeAction(message, focusToken = {}) {
            this.clearDropHighlights();
            if (this.isWon() && !this.won) {
                this.finishWin();
            } else if (!focusToken.silentStatus) {
                this.setStatus(message);
            }
            this.render({ persist: true, focusToken });
        }

        pushHistory() {
            this.history.push(this.makeSnapshot());
            if (this.history.length > HISTORY_LIMIT) this.history.shift();
        }

        makeSnapshot() {
            return this.cloneState({
                stock: this.stock,
                waste: this.waste,
                foundations: this.foundations,
                tableau: this.tableau,
                moves: this.moves,
                scoreValue: this.scoreValue,
                recycleCount: this.recycleCount,
                won: this.won,
                winBonusApplied: this.winBonusApplied
            });
        }

        cloneState(state) {
            return JSON.parse(JSON.stringify(state));
        }

        undo() {
            this.cancelAutoRun();
            const snapshot = this.history.pop();
            if (!snapshot) {
                this.setStatus('No hay movimientos para deshacer');
                this.updateControls();
                return false;
            }

            const state = this.normalizeGameState(snapshot);
            if (!state) {
                this.history = [];
                this.setStatus('El historial no era válido y se descartó');
                this.updateControls();
                this.persistState();
                return false;
            }

            const wasRunning = Boolean(this.timerStartedAt);
            this.applyState(state);
            this.selected = null;
            this.hint = null;
            this.won = this.isWon();
            if (!this.won && (wasRunning || this.moves > 0)) this.startTimer();
            this.setStatus('Movimiento deshecho');
            this.render({ persist: true });
            return true;
        }

        handleDoubleClick(event) {
            const cardElement = event.target.closest('[data-card-id]');
            if (!cardElement || event.target.closest('[data-foundation]')) return;

            this.cancelAutoRun();
            this.clearHint();
            const selection = this.selectionFromCardElement(cardElement);
            const cards = this.getSelectedCards(selection);
            if (!selection || cards.length !== 1 || !cards[0].faceUp) {
                this.setStatus('Solo la carta superior puede ir a una fundación');
                return;
            }

            event.preventDefault();
            this.selected = selection;
            if (!this.moveSelectedToFoundation(cards[0].suit)) {
                this.selected = selection;
                this.render({ persist: false, focusToken: { cardId: cards[0].id } });
            }
        }

        selectionFromCardElement(element) {
            const source = element?.dataset.source;
            const cardId = element?.dataset.cardId;
            if (!source || !cardId) return null;

            if (source === 'waste') {
                const card = this.waste[this.waste.length - 1];
                return card?.id === cardId ? { type: 'waste', cardId } : null;
            }

            if (source === 'foundation') {
                const suit = element.dataset.suit;
                const pile = this.foundations[suit] || [];
                const card = pile[pile.length - 1];
                return card?.id === cardId ? { type: 'foundation', suit, cardId } : null;
            }

            if (source === 'tableau') {
                const column = Number(element.dataset.column);
                const index = Number(element.dataset.index);
                const pile = this.tableau[column] || [];
                const card = pile[index];
                const cards = pile.slice(index);
                if (card?.id !== cardId || !card.faceUp || !this.isValidTableauSequence(cards)) return null;
                return { type: 'tableau', column, index, cardId };
            }

            return null;
        }

        handleDragStart(event) {
            const cardElement = event.target.closest('[data-card-id]');
            const selection = this.selectionFromCardElement(cardElement);
            if (!cardElement || !selection) {
                event.preventDefault();
                return;
            }

            this.cancelAutoRun();
            this.clearHint();
            this.selected = selection;
            this.dragDropCommitted = false;
            cardElement.classList.add('dragging');
            this.syncSelectionClasses();

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', selection.cardId);
                event.dataTransfer.setData('application/x-zaratexp-solitaire', JSON.stringify(selection));
            }
        }

        handleDragOver(event) {
            if (!this.selected || !this.getSelectedCards().length) return;
            const foundation = event.target.closest('[data-foundation]');
            const column = event.target.closest('[data-tableau-column]');
            let valid = false;
            let target = null;

            if (foundation) {
                const cards = this.getSelectedCards();
                valid = cards.length === 1
                    && this.selected.type !== 'foundation'
                    && this.canMoveToFoundation(cards[0], foundation.dataset.foundation);
                target = foundation;
            } else if (column) {
                const targetColumn = Number(column.dataset.tableauColumn);
                const targetPile = this.tableau[targetColumn] || [];
                const targetCard = targetPile[targetPile.length - 1] || null;
                valid = !(this.selected.type === 'tableau' && this.selected.column === targetColumn)
                    && this.canMoveToTableau(this.getSelectedCards(), targetCard);
                target = column;
            }

            if (!valid || !target) {
                this.clearDropHighlights();
                return;
            }

            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            this.setDragTarget(target);
        }

        handleDrop(event) {
            if (!this.selected) return;
            const foundation = event.target.closest('[data-foundation]');
            const column = event.target.closest('[data-tableau-column]');
            let moved = false;

            if (foundation) {
                event.preventDefault();
                moved = this.moveSelectedToFoundation(foundation.dataset.foundation);
            } else if (column) {
                event.preventDefault();
                moved = this.moveSelectedToTableau(Number(column.dataset.tableauColumn));
            }

            this.dragDropCommitted = moved;
            if (moved) this.ignoreClickUntil = Date.now() + 250;
            this.clearDropHighlights();
        }

        handleDragEnd() {
            this.clearDropHighlights();
            this.root.querySelectorAll('.dragging').forEach((element) => element.classList.remove('dragging'));
            if (!this.dragDropCommitted && this.selected) {
                const card = this.getSelectedCards()[0];
                this.setStatus(card
                    ? `${this.cardLabel(card)} sigue seleccionada`
                    : 'Movimiento cancelado');
                this.render({ persist: false });
            }
            this.dragDropCommitted = false;
        }

        setDragTarget(element) {
            if (this.dragTarget === element) return;
            this.clearDropHighlights();
            this.dragTarget = element;
            element.classList.add('drag-target');
            element.dataset.dropAllowed = 'true';
        }

        clearDropHighlights() {
            this.root.querySelectorAll('.drag-target, [data-drop-allowed]').forEach((element) => {
                element.classList.remove('drag-target');
                delete element.dataset.dropAllowed;
            });
            this.dragTarget = null;
        }

        syncSelectionClasses() {
            this.root.querySelectorAll('[data-card-id]').forEach((element) => {
                const isSelected = this.isElementInSelection(element);
                element.classList.toggle('selected', isSelected);
                if (element.matches('button')) element.setAttribute('aria-pressed', String(isSelected));
            });
            this.wasteEl.setAttribute('aria-pressed', String(this.selected?.type === 'waste'));
            this.root.querySelectorAll('[data-foundation]').forEach((element) => {
                element.setAttribute('aria-pressed', String(
                    this.selected?.type === 'foundation' && this.selected.suit === element.dataset.foundation
                ));
            });
        }

        isElementInSelection(element) {
            if (!this.selected) return false;
            if (this.selected.type !== 'tableau') return element.dataset.cardId === this.selected.cardId;
            return element.dataset.source === 'tableau'
                && Number(element.dataset.column) === this.selected.column
                && Number(element.dataset.index) >= this.selected.index;
        }

        showHint() {
            this.cancelAutoRun();
            if (this.won) {
                this.setStatus('La partida ya está completa');
                return;
            }

            const hint = this.findHint();
            if (!hint) {
                this.selected = null;
                this.hint = null;
                this.setStatus('No quedan movimientos útiles. Prueba un nuevo juego');
                this.render({ persist: false });
                return;
            }

            this.hint = hint;
            this.selected = hint.selection || null;
            this.setStatus(`Pista: ${hint.message}`);
            this.render({ persist: false, focusToken: hint.selection ? { cardId: hint.selection.cardId } : { pile: 'stock' } });
        }

        findHint() {
            const wasteCard = this.waste[this.waste.length - 1];
            if (wasteCard && this.canMoveToFoundation(wasteCard) && this.isSafeFoundationMove(wasteCard)) {
                return this.foundationHint({ type: 'waste', cardId: wasteCard.id }, wasteCard);
            }

            for (let sourceColumn = 0; sourceColumn < this.tableau.length; sourceColumn += 1) {
                const sourcePile = this.tableau[sourceColumn];
                const firstFaceUp = sourcePile.findIndex((card) => card.faceUp);
                if (firstFaceUp <= 0) continue;
                const cards = sourcePile.slice(firstFaceUp);
                for (let targetColumn = 0; targetColumn < this.tableau.length; targetColumn += 1) {
                    if (targetColumn === sourceColumn) continue;
                    const targetPile = this.tableau[targetColumn];
                    const targetCard = targetPile[targetPile.length - 1] || null;
                    if (!this.canMoveToTableau(cards, targetCard)) continue;
                    return {
                        selection: { type: 'tableau', column: sourceColumn, index: firstFaceUp, cardId: cards[0].id },
                        targetType: 'tableau',
                        targetColumn,
                        message: `mueve ${this.cardLabel(cards[0])} a la columna ${targetColumn + 1} para descubrir una carta`
                    };
                }
            }

            for (let column = 0; column < this.tableau.length; column += 1) {
                const pile = this.tableau[column];
                const card = pile[pile.length - 1];
                if (card?.faceUp && this.canMoveToFoundation(card) && this.isSafeFoundationMove(card)) {
                    return this.foundationHint({ type: 'tableau', column, index: pile.length - 1, cardId: card.id }, card);
                }
            }

            if (wasteCard) {
                for (let targetColumn = 0; targetColumn < this.tableau.length; targetColumn += 1) {
                    const targetPile = this.tableau[targetColumn];
                    const targetCard = targetPile[targetPile.length - 1] || null;
                    if (!this.canMoveToTableau([wasteCard], targetCard)) continue;
                    return {
                        selection: { type: 'waste', cardId: wasteCard.id },
                        targetType: 'tableau',
                        targetColumn,
                        message: `mueve ${this.cardLabel(wasteCard)} del descarte a la columna ${targetColumn + 1}`
                    };
                }
            }

            for (let sourceColumn = 0; sourceColumn < this.tableau.length; sourceColumn += 1) {
                const sourcePile = this.tableau[sourceColumn];
                for (let index = 0; index < sourcePile.length; index += 1) {
                    const cards = sourcePile.slice(index);
                    if (!cards[0]?.faceUp || !this.isValidTableauSequence(cards)) continue;
                    for (let targetColumn = 0; targetColumn < this.tableau.length; targetColumn += 1) {
                        if (targetColumn === sourceColumn) continue;
                        const targetPile = this.tableau[targetColumn];
                        const targetCard = targetPile[targetPile.length - 1] || null;
                        if (!this.canMoveToTableau(cards, targetCard)) continue;
                        if (!targetCard && index === 0 && cards[0].rank === 13) continue;
                        return {
                            selection: { type: 'tableau', column: sourceColumn, index, cardId: cards[0].id },
                            targetType: 'tableau',
                            targetColumn,
                            message: `mueve ${this.cardLabel(cards[0])} a la columna ${targetColumn + 1}`
                        };
                    }
                }
            }

            const anyFoundationMove = this.findFoundationCandidate({ safeOnly: false });
            if (anyFoundationMove) return this.foundationHint(anyFoundationMove.selection, anyFoundationMove.card);

            if (this.stock.length || this.waste.length) {
                return {
                    selection: null,
                    targetType: 'stock',
                    message: this.stock.length ? 'roba una carta del mazo' : 'recicla el descarte para seguir buscando'
                };
            }

            for (const suit of SUITS) {
                const pile = this.foundations[suit];
                const card = pile[pile.length - 1];
                if (!card) continue;
                for (let targetColumn = 0; targetColumn < this.tableau.length; targetColumn += 1) {
                    const targetPile = this.tableau[targetColumn];
                    const targetCard = targetPile[targetPile.length - 1] || null;
                    if (!this.canMoveToTableau([card], targetCard)) continue;
                    return {
                        selection: { type: 'foundation', suit, cardId: card.id },
                        targetType: 'tableau',
                        targetColumn,
                        message: `baja ${this.cardLabel(card)} de la fundación a la columna ${targetColumn + 1}`
                    };
                }
            }

            return null;
        }

        foundationHint(selection, card) {
            return {
                selection,
                targetType: 'foundation',
                targetSuit: card.suit,
                message: `envía ${this.cardLabel(card)} a la fundación de ${SUIT_NAMES[card.suit]}`
            };
        }

        clearHint() {
            this.hint = null;
            this.root.querySelectorAll('.hint-source, .hint-target').forEach((element) => {
                element.classList.remove('hint-source', 'hint-target');
            });
        }

        isSafeFoundationMove(card) {
            if (card.rank <= 2) return true;
            return OPPOSITE_SUITS[card.suit].every((suit) => {
                const pile = this.foundations[suit];
                const top = pile[pile.length - 1];
                return Boolean(top && top.rank >= card.rank - 1);
            });
        }

        findFoundationCandidate(options = {}) {
            const candidates = [];
            const wasteCard = this.waste[this.waste.length - 1];
            if (wasteCard && this.canMoveToFoundation(wasteCard)) {
                candidates.push({ selection: { type: 'waste', cardId: wasteCard.id }, card: wasteCard });
            }

            this.tableau.forEach((pile, column) => {
                const card = pile[pile.length - 1];
                if (card?.faceUp && this.canMoveToFoundation(card)) {
                    candidates.push({
                        selection: { type: 'tableau', column, index: pile.length - 1, cardId: card.id },
                        card
                    });
                }
            });

            candidates.sort((left, right) => left.card.rank - right.card.rank);
            if (!options.safeOnly) return candidates[0] || null;
            return candidates.find((candidate) => this.isSafeFoundationMove(candidate.card)) || null;
        }

        autoComplete() {
            if (this.autoRunning) {
                this.cancelAutoRun('Movimiento automático detenido');
                return;
            }
            if (this.won) {
                this.setStatus('La partida ya está completa');
                return;
            }

            const isEndgame = !this.stock.length
                && !this.waste.length
                && this.tableau.every((pile) => pile.every((card) => card.faceUp));
            const firstMove = this.findFoundationCandidate({ safeOnly: !isEndgame });
            if (!firstMove) {
                this.setStatus('No hay cartas accesibles que sea seguro subir ahora. Usa Pista');
                return;
            }

            this.autoRunning = true;
            this.autoToken += 1;
            const token = this.autoToken;
            let moved = 0;
            this.setStatus('Moviendo cartas seguras a las fundaciones');
            this.updateControls();

            const step = () => {
                if (!this.autoRunning || token !== this.autoToken || this.destroyed) return;
                const endgame = !this.stock.length
                    && !this.waste.length
                    && this.tableau.every((pile) => pile.every((card) => card.faceUp));
                const candidate = this.findFoundationCandidate({ safeOnly: !endgame });
                if (!candidate) {
                    this.finishAutoRun(moved);
                    return;
                }

                this.selected = candidate.selection;
                const didMove = this.moveSelectedToFoundation(candidate.card.suit, { silentStatus: true });
                if (!didMove) {
                    this.finishAutoRun(moved);
                    return;
                }
                moved += 1;
                if (this.won) {
                    this.finishAutoRun(moved, true);
                    return;
                }

                const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                this.autoTimer = window.setTimeout(step, reduceMotion ? 0 : AUTO_MOVE_DELAY);
            };

            step();
        }

        finishAutoRun(moved, won = false) {
            this.autoRunning = false;
            this.autoTimer = null;
            this.updateControls();
            if (!won) {
                this.setStatus(moved
                    ? `Auto movió ${moved} ${moved === 1 ? 'carta' : 'cartas'}. No quedan movimientos seguros inmediatos`
                    : 'No hay movimientos automáticos disponibles');
                this.updateStats();
            }
        }

        cancelAutoRun(message = '') {
            if (this.autoTimer) window.clearTimeout(this.autoTimer);
            const wasRunning = this.autoRunning;
            this.autoTimer = null;
            this.autoRunning = false;
            this.autoToken += 1;
            if (wasRunning && message) this.setStatus(message);
            this.updateControls();
        }

        handleKeyDown(event) {
            const tagName = event.target.tagName;
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.isContentEditable) return;

            const key = event.key.toLowerCase();
            const emptyColumn = event.target.closest?.('[data-tableau-column][data-column-empty="true"]');
            if (emptyColumn && (event.key === 'Enter' || event.key === ' ' || event.code === 'Space')) {
                event.preventDefault();
                this.cancelAutoRun();
                this.clearHint();
                if (this.selected) {
                    this.handleEmptyTableau(Number(emptyColumn.dataset.tableauColumn));
                } else {
                    this.setStatus('Selecciona un rey y presiona Enter sobre esta columna vacía');
                }
                return;
            }

            const commandKey = event.ctrlKey || event.metaKey;
            if (commandKey && key === 'z') {
                event.preventDefault();
                this.undo();
                return;
            }

            if (!commandKey && !event.altKey) {
                if (key === 'n') {
                    event.preventDefault();
                    this.newGame();
                    return;
                }
                if (key === 'h') {
                    event.preventDefault();
                    this.showHint();
                    return;
                }
                if (key === 'a') {
                    event.preventDefault();
                    this.autoComplete();
                    return;
                }
                if (key === 'escape' && this.selected) {
                    event.preventDefault();
                    this.selected = null;
                    this.clearHint();
                    this.setStatus('Selección cancelada');
                    this.syncSelectionClasses();
                    return;
                }
            }

            this.handleArrowNavigation(event);
        }

        handleArrowNavigation(event) {
            const card = event.target.closest('[data-source="tableau"][data-card-id]');
            if (!card || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;

            const column = Number(card.dataset.column);
            const currentIndex = Number(card.dataset.index);
            let target = null;

            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                const direction = event.key === 'ArrowLeft' ? -1 : 1;
                let targetColumn = column + direction;
                while (targetColumn >= 0 && targetColumn < 7 && !target) {
                    const cards = [...this.tableauEl.querySelectorAll(`[data-column="${targetColumn}"][data-card-id]:not([tabindex="-1"])`)];
                    target = cards[Math.min(currentIndex, cards.length - 1)] || cards[cards.length - 1] || null;
                    targetColumn += direction;
                }
            } else {
                const cards = [...this.tableauEl.querySelectorAll(`[data-column="${column}"][data-card-id]:not([tabindex="-1"])`)];
                const position = cards.indexOf(card);
                if (event.key === 'ArrowUp') target = cards[Math.max(0, position - 1)];
                if (event.key === 'ArrowDown') target = cards[Math.min(cards.length - 1, position + 1)];
                if (event.key === 'Home') target = cards[0];
                if (event.key === 'End') target = cards[cards.length - 1];
            }

            if (target) {
                event.preventDefault();
                target.focus({ preventScroll: true });
            }
        }

        startTimer() {
            if (this.won || this.timerStartedAt) return;
            this.timerStartedAt = Date.now();
        }

        stopTimer() {
            if (!this.timerStartedAt) return;
            this.elapsedSeconds = this.getElapsedSeconds();
            this.timerStartedAt = null;
        }

        getElapsedSeconds() {
            if (!this.timerStartedAt) return Math.max(0, Math.floor(this.elapsedSeconds));
            return Math.max(0, Math.floor(this.elapsedSeconds + ((Date.now() - this.timerStartedAt) / 1000)));
        }

        formatTime(totalSeconds) {
            const seconds = Math.max(0, Math.floor(totalSeconds));
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainder = seconds % 60;
            if (hours) {
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
            }
            return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
        }

        tick() {
            if (this.destroyed) return;
            if (!this.root.isConnected) {
                this.destroy();
                return;
            }
            this.updateStats();
            if (this.timerStartedAt && Date.now() - this.lastPersistAt > 5000) this.persistState();
        }

        handleVisibilityChange() {
            if (document.hidden) {
                if (this.autoRunning) {
                    this.cancelAutoRun('Movimiento automático detenido al ocultar la pestaña');
                }
                this.resumeAfterVisibility = Boolean(this.timerStartedAt);
                this.stopTimer();
                this.persistState();
            } else if (this.resumeAfterVisibility && !this.won) {
                this.resumeAfterVisibility = false;
                this.startTimer();
                this.updateStats();
            }
        }

        addScore(points) {
            this.scoreValue = Math.max(0, this.scoreValue + points);
        }

        score() {
            return Math.max(0, Math.round(this.scoreValue));
        }

        finishWin() {
            const elapsed = this.getElapsedSeconds();
            this.stopTimer();
            this.won = true;
            if (!this.winBonusApplied) {
                const timeBonus = elapsed >= 30 ? Math.floor(700000 / elapsed) : 0;
                this.addScore(timeBonus);
                this.winBonusApplied = true;
            }
            this.recordBest();
            this.setStatus(`Ganaste en ${this.formatTime(elapsed)} con ${this.score()} puntos y ${this.moves} movimientos`);
            this.root.dataset.solitaireState = 'won';
        }

        isWon() {
            return SUITS.every((suit) => this.foundations[suit]?.length === 13);
        }

        render(options = {}) {
            const focusToken = options.focusToken || this.captureFocus();
            this.renderStock();
            this.renderFoundations();
            this.renderTableau();
            this.root.dataset.solitaireState = this.won ? 'won' : (this.moves ? 'playing' : 'ready');
            this.updateStats();
            this.updateControls();
            if (options.persist) this.persistState();
            this.restoreFocus(focusToken);
        }

        renderStock() {
            this.stockEl.innerHTML = this.stock.length
                ? `<span class="xp-card-back" aria-hidden="true">${this.stock.length}</span>`
                : `<span class="xp-card-empty" aria-hidden="true">${this.waste.length ? 'Volver' : 'Vacío'}</span>`;
            this.stockEl.setAttribute('aria-label', this.stock.length
                ? `Mazo, ${this.stock.length} cartas. Robar una carta`
                : (this.waste.length
                    ? `Mazo vacío. Reciclar ${this.waste.length} cartas del descarte`
                    : 'Mazo vacío'));
            this.stockEl.setAttribute('aria-disabled', String(!this.stock.length && !this.waste.length));
            this.stockEl.classList.toggle('hint-target', this.hint?.targetType === 'stock');

            const wasteCard = this.waste[this.waste.length - 1];
            this.wasteEl.innerHTML = wasteCard
                ? this.cardMarkup(wasteCard, { source: 'waste', index: this.waste.length - 1, asSpan: true, isTop: true })
                : '<span class="xp-card-empty" aria-hidden="true">Descarte</span>';
            this.wasteEl.setAttribute('aria-label', wasteCard
                ? `Descarte, carta superior ${this.cardLabel(wasteCard)}`
                : 'Descarte vacío');
            this.wasteEl.setAttribute('aria-disabled', String(!wasteCard));
            this.wasteEl.setAttribute('aria-pressed', String(this.selected?.type === 'waste'));
        }

        renderFoundations() {
            this.foundationsEl.innerHTML = SUITS.map((suit) => {
                const pile = this.foundations[suit];
                const top = pile[pile.length - 1];
                const hintClass = this.hint?.targetType === 'foundation' && this.hint.targetSuit === suit
                    ? ' hint-target'
                    : '';
                const label = top
                    ? `Fundación de ${SUIT_NAMES[suit]}, carta superior ${this.cardLabel(top)}`
                    : `Fundación de ${SUIT_NAMES[suit]}, vacía. Comienza con el as`;
                return `
                    <button type="button" class="xp-card-pile foundation${hintClass}" data-foundation="${suit}" aria-label="${label}" aria-pressed="${this.selected?.type === 'foundation' && this.selected.suit === suit}">
                        ${top
                            ? this.cardMarkup(top, { source: 'foundation', suit, asSpan: true, isTop: true })
                            : `<span class="xp-foundation-suit ${this.cardColor({ suit })}" aria-hidden="true">${SUIT_ENTITIES[suit]}</span>`}
                    </button>
                `;
            }).join('');
        }

        renderTableau() {
            this.tableauEl.innerHTML = this.tableau.map((pile, column) => {
                const hintClass = this.hint?.targetType === 'tableau' && this.hint.targetColumn === column
                    ? ' hint-target'
                    : '';
                const cardCount = pile.length === 1 ? '1 carta' : `${pile.length} cartas`;
                const accessibility = pile.length
                    ? `role="group" aria-label="Columna ${column + 1}, ${cardCount}"`
                    : `role="button" tabindex="0" aria-label="Columna ${column + 1} vacía. Selecciona un rey y presiona Enter para moverlo aquí"`;
                return `
                    <div class="xp-tableau-column${hintClass}" data-tableau-column="${column}" data-column-empty="${pile.length === 0}" ${accessibility}>
                        ${pile.map((card, index) => this.cardMarkup(card, {
                            source: 'tableau',
                            column,
                            index,
                            isTop: index === pile.length - 1,
                            stackSize: pile.length - index
                        })).join('')}
                    </div>
                `;
            }).join('');
        }

        cardMarkup(card, meta) {
            const isSelected = this.isCardSelected(card, meta);
            const isHintSource = this.hint?.selection?.cardId === card.id;
            const classes = [
                'xp-playing-card',
                card.faceUp ? this.cardColor(card) : 'back',
                isSelected ? 'selected' : '',
                isHintSource ? 'hint-source' : ''
            ].filter(Boolean).join(' ');
            const attrs = [
                `data-card-id="${card.id}"`,
                `data-source="${meta.source}"`,
                meta.column !== undefined ? `data-column="${meta.column}"` : '',
                meta.index !== undefined ? `data-index="${meta.index}"` : '',
                meta.suit ? `data-suit="${meta.suit}"` : '',
                meta.stackSize ? `data-stack-size="${meta.stackSize}"` : ''
            ].filter(Boolean).join(' ');

            if (meta.asSpan) {
                if (!card.faceUp) return `<span class="${classes}" ${attrs} aria-hidden="true"></span>`;
                return `
                    <span class="${classes}" ${attrs} draggable="true" aria-hidden="true">
                        <span>${this.rankLabel(card.rank)}</span>
                        <strong>${SUIT_ENTITIES[card.suit]}</strong>
                        <small>${this.rankLabel(card.rank)}</small>
                    </span>
                `;
            }

            const tabindex = !card.faceUp && !meta.isTop ? '-1' : '0';
            const label = card.faceUp
                ? this.tableauCardAriaLabel(card, meta)
                : (meta.isTop ? 'Carta boca abajo. Presiona Enter para descubrirla' : 'Carta boca abajo cubierta');
            const draggable = card.faceUp ? 'true' : 'false';
            if (!card.faceUp) {
                return `<button type="button" class="${classes}" ${attrs} tabindex="${tabindex}" draggable="false" aria-label="${label}" aria-pressed="false"></button>`;
            }

            return `
                <button type="button" class="${classes}" ${attrs} tabindex="${tabindex}" draggable="${draggable}" aria-label="${label}" aria-pressed="${isSelected}">
                    <span>${this.rankLabel(card.rank)}</span>
                    <strong>${SUIT_ENTITIES[card.suit]}</strong>
                    <small>${this.rankLabel(card.rank)}</small>
                </button>
            `;
        }

        tableauCardAriaLabel(card, meta) {
            const stackText = meta.stackSize > 1 ? `. Mueve un grupo de ${meta.stackSize} cartas` : '';
            return `${this.cardLabel(card)}, columna ${meta.column + 1}${stackText}`;
        }

        isCardSelected(card, meta) {
            if (!this.selected) return false;
            if (this.selected.type !== 'tableau') return this.selected.cardId === card.id;
            return meta.source === 'tableau'
                && meta.column === this.selected.column
                && meta.index >= this.selected.index;
        }

        updateStats() {
            const elapsed = this.getElapsedSeconds();
            const missingStats = [];
            if (!this.timeEl) missingStats.push(this.formatTime(elapsed));
            if (!this.movesEl) missingStats.push(`${this.moves} mov.`);
            this.scoreEl.textContent = [`${this.score()} pts`, ...missingStats].join(' | ');
            this.scoreEl.setAttribute('aria-label', `${this.score()} puntos`);
            this.scoreEl.title = `Puntaje clásico: fundación +10, descarte a mesa +5, descubrir +5`;

            if (this.timeEl) {
                this.timeEl.textContent = this.formatTime(elapsed);
                this.timeEl.setAttribute('aria-label', `Tiempo ${this.formatTime(elapsed)}`);
            }
            if (this.movesEl) {
                this.movesEl.textContent = `${this.moves} mov.`;
                this.movesEl.setAttribute('aria-label', this.moves === 1 ? '1 movimiento' : `${this.moves} movimientos`);
            }
            if (this.bestEl) {
                this.bestEl.textContent = this.best.score ? `Mejor: ${this.best.score}` : 'Mejor: -';
                this.bestEl.setAttribute('aria-label', this.best.score
                    ? `Mejor puntaje ${this.best.score}`
                    : 'Todavía no hay un mejor puntaje');
            }
        }

        updateControls() {
            if (this.undoButton) this.undoButton.disabled = this.history.length === 0 || this.autoRunning;
            if (this.hintButton) this.hintButton.disabled = this.won || this.autoRunning;
            if (this.autoButton) {
                this.autoButton.disabled = this.won;
                this.autoButton.setAttribute('aria-pressed', String(this.autoRunning));
                this.autoButton.textContent = this.autoRunning ? 'Detener' : 'Auto';
            }
        }

        captureFocus() {
            const active = document.activeElement;
            if (!active || !this.root.contains(active)) return null;
            const card = active.closest?.('[data-card-id]');
            if (card) return { cardId: card.dataset.cardId };
            const foundation = active.closest?.('[data-foundation]');
            if (foundation) return { foundation: foundation.dataset.foundation };
            const pile = active.closest?.('[data-pile]');
            if (pile) return { pile: pile.dataset.pile };
            return null;
        }

        restoreFocus(token) {
            if (!token) return;
            const run = () => {
                if (this.destroyed || !this.root.isConnected) return;
                let target = null;
                if (token.cardId) target = this.root.querySelector(`[data-card-id="${token.cardId}"]`);
                if (token.foundation) target = this.root.querySelector(`[data-foundation="${token.foundation}"]`);
                if (token.pile) target = this.root.querySelector(`[data-pile="${token.pile}"]`);
                const focusable = target?.matches?.('button') ? target : target?.closest?.('button');
                focusable?.focus?.({ preventScroll: true });
            };
            if (typeof queueMicrotask === 'function') queueMicrotask(run);
            else Promise.resolve().then(run);
        }

        rankLabel(rank) {
            return { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[rank] || String(rank);
        }

        rankName(rank) {
            return {
                1: 'as',
                11: 'jota',
                12: 'reina',
                13: 'rey'
            }[rank] || String(rank);
        }

        cardLabel(card) {
            return `${this.rankName(card.rank)} de ${SUIT_NAMES[card.suit]}`;
        }

        cardColor(card) {
            return RED_SUITS.has(card.suit) ? 'red' : 'black';
        }

        persistState() {
            if (!this.stock || !this.tableau || this.destroyed) return;
            const payload = {
                version: STORAGE_VERSION,
                savedAt: Date.now(),
                elapsedSeconds: this.getElapsedSeconds(),
                state: this.makeSnapshot(),
                history: this.history.slice(-HISTORY_LIMIT)
            };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                this.lastPersistAt = Date.now();
            } catch (_) {
                // El juego sigue funcionando si el navegador bloquea localStorage.
            }
        }

        restoreState() {
            let payload;
            try {
                payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            } catch (_) {
                return false;
            }

            if (!payload || payload.version !== STORAGE_VERSION) return false;
            const state = this.normalizeGameState(payload.state);
            if (!state) {
                try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Sin almacenamiento disponible. */ }
                return false;
            }

            this.applyState(state);
            this.elapsedSeconds = this.safeNumber(payload.elapsedSeconds, 0, 31536000);
            this.history = Array.isArray(payload.history)
                ? payload.history
                    .slice(-HISTORY_LIMIT)
                    .map((snapshot) => this.normalizeGameState(snapshot))
                    .filter(Boolean)
                : [];
            this.selected = null;
            this.hint = null;
            this.won = this.isWon();
            if (this.won) this.winBonusApplied = true;
            return true;
        }

        normalizeGameState(raw) {
            if (!raw || !Array.isArray(raw.stock) || !Array.isArray(raw.waste)
                || !Array.isArray(raw.tableau) || raw.tableau.length !== 7
                || !raw.foundations || typeof raw.foundations !== 'object') return null;

            const normalizeCard = (card) => {
                const suit = typeof card?.suit === 'string' ? card.suit : '';
                const rank = Number(card?.rank);
                if (!SUITS.includes(suit) || !Number.isInteger(rank) || rank < 1 || rank > 13) return null;
                return { id: `${suit}-${rank}`, suit, rank, faceUp: Boolean(card.faceUp) };
            };
            const normalizePile = (pile) => Array.isArray(pile) ? pile.map(normalizeCard) : null;

            const stock = normalizePile(raw.stock);
            const waste = normalizePile(raw.waste);
            const tableau = raw.tableau.map(normalizePile);
            const foundations = {};
            SUITS.forEach((suit) => { foundations[suit] = normalizePile(raw.foundations[suit]); });
            if (!stock || !waste || tableau.some((pile) => !pile)
                || SUITS.some((suit) => !foundations[suit])) return null;

            const allCards = [
                ...stock,
                ...waste,
                ...tableau.flat(),
                ...SUITS.flatMap((suit) => foundations[suit])
            ];
            if (allCards.length !== 52 || allCards.some((card) => !card)) return null;
            const identities = new Set(allCards.map((card) => `${card.suit}-${card.rank}`));
            if (identities.size !== 52) return null;
            if (stock.some((card) => card.faceUp) || waste.some((card) => !card.faceUp)) return null;

            for (const suit of SUITS) {
                const pile = foundations[suit];
                if (pile.some((card, index) => !card.faceUp || card.suit !== suit || card.rank !== index + 1)) return null;
            }

            for (const pile of tableau) {
                let faceUpStarted = false;
                const visible = [];
                for (const card of pile) {
                    if (card.faceUp) {
                        faceUpStarted = true;
                        visible.push(card);
                    } else if (faceUpStarted) {
                        return null;
                    }
                }
                if (visible.length && !this.isValidTableauSequence(visible)) return null;
            }

            return {
                stock,
                waste,
                foundations,
                tableau,
                moves: this.safeNumber(raw.moves, 0, 1000000),
                scoreValue: this.safeNumber(raw.scoreValue, 0, 100000000),
                recycleCount: this.safeNumber(raw.recycleCount, 0, 1000000),
                won: Boolean(raw.won),
                winBonusApplied: Boolean(raw.winBonusApplied)
            };
        }

        safeNumber(value, minimum, maximum) {
            const number = Number(value);
            if (!Number.isFinite(number)) return minimum;
            return Math.min(maximum, Math.max(minimum, Math.floor(number)));
        }

        applyState(state) {
            this.stock = state.stock;
            this.waste = state.waste;
            this.foundations = state.foundations;
            this.tableau = state.tableau;
            this.moves = state.moves;
            this.scoreValue = state.scoreValue;
            this.recycleCount = state.recycleCount;
            this.won = state.won;
            this.winBonusApplied = state.winBonusApplied;
        }

        loadBest() {
            try {
                const best = JSON.parse(localStorage.getItem(BEST_KEY) || 'null');
                return {
                    score: this.safeNumber(best?.score, 0, 100000000),
                    time: best?.time == null ? null : this.safeNumber(best.time, 0, 31536000)
                };
            } catch (_) {
                return { score: 0, time: null };
            }
        }

        recordBest() {
            const score = this.score();
            const time = this.getElapsedSeconds();
            if (score < this.best.score) return;
            if (score === this.best.score && this.best.time !== null && time >= this.best.time) return;
            this.best = { score, time };
            try {
                localStorage.setItem(BEST_KEY, JSON.stringify(this.best));
            } catch (_) {
                // El récord de esta sesión sigue visible aunque no pueda persistirse.
            }
        }

        setStatus(message) {
            this.status.textContent = message;
        }

        destroy() {
            if (this.destroyed) return;
            this.cancelAutoRun();
            this.stopTimer();
            this.persistState();
            this.destroyed = true;
            if (this.tickInterval) window.clearInterval(this.tickInterval);
            this.root.removeEventListener('click', this.boundClick);
            this.root.removeEventListener('dblclick', this.boundDoubleClick);
            this.root.removeEventListener('keydown', this.boundKeyDown);
            this.root.removeEventListener('dragstart', this.boundDragStart);
            this.root.removeEventListener('dragover', this.boundDragOver);
            this.root.removeEventListener('drop', this.boundDrop);
            this.root.removeEventListener('dragend', this.boundDragEnd);
            document.removeEventListener('visibilitychange', this.boundVisibilityChange);
            window.removeEventListener('pagehide', this.boundPageHide);
            this.newButton?.removeEventListener('click', this.boundNewGame);
            this.undoButton?.removeEventListener('click', this.boundUndo);
            this.hintButton?.removeEventListener('click', this.boundHint);
            this.autoButton?.removeEventListener('click', this.boundAuto);
            if (this.root._solitaireApp === this) delete this.root._solitaireApp;
            if (this.windowElement?._solitaireApp === this) delete this.windowElement._solitaireApp;
        }
    }

    window.initSolitaireApp = function initSolitaireApp(scope = document) {
        const root = scope?.matches?.('[data-solitaire-root]')
            ? scope
            : scope?.querySelector?.('[data-solitaire-root]') || document.querySelector('[data-solitaire-root]');
        if (!root) throw new Error('No se encontró Solitario en la ventana');

        const existing = root._solitaireApp || scope?._solitaireApp;
        existing?.destroy?.();
        const app = new SolitaireApp(scope).init();
        root._solitaireApp = app;
        if (scope && typeof scope === 'object') scope._solitaireApp = app;
        return app;
    };

    window.destroySolitaireApp = function destroySolitaireApp(scope = document) {
        const root = scope?.matches?.('[data-solitaire-root]')
            ? scope
            : scope?.querySelector?.('[data-solitaire-root]') || null;
        const app = root?._solitaireApp || scope?._solitaireApp;
        app?.destroy?.();
    };
})();
