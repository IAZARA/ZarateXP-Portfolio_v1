(function () {
    const SUITS = ['H', 'D', 'C', 'S'];
    const SUIT_ENTITIES = { H: '&hearts;', D: '&diams;', C: '&clubs;', S: '&spades;' };
    const RED_SUITS = new Set(['H', 'D']);

    class SolitaireApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-solitaire-root]');
            this.status = this.root.querySelector('[data-solitaire-status]');
            this.scoreEl = this.root.querySelector('[data-solitaire-score]');
            this.stockEl = this.root.querySelector('[data-pile="stock"]');
            this.wasteEl = this.root.querySelector('[data-pile="waste"]');
            this.foundationsEl = this.root.querySelector('[data-foundations]');
            this.tableauEl = this.root.querySelector('[data-tableau]');
            this.history = [];
            this.selected = null;
            this.moves = 0;
        }

        init() {
            this.root.querySelector('[data-solitaire-new]').addEventListener('click', () => this.newGame());
            this.root.querySelector('[data-solitaire-undo]').addEventListener('click', () => this.undo());
            this.root.addEventListener('click', (event) => this.handleClick(event));
            this.newGame();
        }

        newGame() {
            const deck = this.shuffle(this.createDeck());
            this.stock = [];
            this.waste = [];
            this.foundations = { H: [], D: [], C: [], S: [] };
            this.tableau = Array.from({ length: 7 }, () => []);
            this.history = [];
            this.selected = null;
            this.moves = 0;

            for (let column = 0; column < 7; column += 1) {
                for (let row = 0; row <= column; row += 1) {
                    const card = deck.pop();
                    card.faceUp = row === column;
                    this.tableau[column].push(card);
                }
            }
            this.stock = deck.map((card) => ({ ...card, faceUp: false }));
            this.setStatus('Nuevo juego repartido');
            this.render();
        }

        createDeck() {
            const deck = [];
            SUITS.forEach((suit) => {
                for (let rank = 1; rank <= 13; rank += 1) {
                    deck.push({ id: `${suit}-${rank}-${crypto.randomUUID?.() || Math.random()}`, suit, rank, faceUp: false });
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
            const cardButton = event.target.closest('[data-card-id]');
            const pileButton = event.target.closest('[data-pile]');
            const foundationButton = event.target.closest('[data-foundation]');
            const tableauColumn = event.target.closest('[data-tableau-column]');

            if (cardButton) {
                this.handleCardClick(cardButton);
                return;
            }
            if (foundationButton) {
                this.handleFoundationClick(foundationButton.dataset.foundation);
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
                this.selectFoundation(button.dataset.suit);
                return;
            }

            const column = Number(button.dataset.column);
            const index = Number(button.dataset.index);
            const card = this.tableau[column][index];
            const isTop = index === this.tableau[column].length - 1;

            if (!card.faceUp && isTop) {
                this.pushHistory();
                card.faceUp = true;
                this.moves += 1;
                this.setStatus('Carta descubierta');
                this.render();
                return;
            }

            if (!card.faceUp) return;

            if (this.selected && this.selected.cardId !== card.id) {
                if (this.moveSelectedToTableau(column)) return;
            }

            this.selected = {
                type: 'tableau',
                column,
                index,
                cardId: card.id,
                cards: this.tableau[column].slice(index)
            };
            this.setStatus(`${this.cardLabel(card)} seleccionado`);
            this.render();
        }

        handleFoundationClick(suit) {
            if (!this.selected) {
                this.selectFoundation(suit);
                return;
            }
            const cards = this.selected.cards;
            if (cards.length !== 1 || cards[0].suit !== suit || !this.canMoveToFoundation(cards[0], suit)) {
                this.setStatus('Movimiento invalido para la fundacion');
                return;
            }
            this.pushHistory();
            const card = this.removeSelectedCards()[0];
            this.foundations[suit].push(card);
            this.moves += 1;
            this.selected = null;
            this.afterMove('Carta enviada a fundacion');
        }

        handleEmptyTableau(column) {
            if (!this.selected || this.tableau[column].length) return;
            if (this.selected.cards[0].rank !== 13) {
                this.setStatus('Solo un rey puede iniciar una columna vacia');
                return;
            }
            this.pushHistory();
            this.tableau[column].push(...this.removeSelectedCards());
            this.moves += 1;
            this.selected = null;
            this.afterMove('Columna iniciada con rey');
        }

        moveSelectedToTableau(column) {
            const targetPile = this.tableau[column];
            const movingCards = this.selected.cards;
            const targetCard = targetPile[targetPile.length - 1] || null;
            if (!this.canMoveToTableau(movingCards, targetCard)) {
                this.setStatus('Movimiento invalido para tableau');
                return false;
            }
            this.pushHistory();
            targetPile.push(...this.removeSelectedCards());
            this.moves += 1;
            this.selected = null;
            this.afterMove('Movimiento realizado');
            return true;
        }

        drawFromStock() {
            this.pushHistory();
            if (this.stock.length) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
                this.moves += 1;
                this.setStatus('Carta robada del mazo');
            } else if (this.waste.length) {
                this.stock = this.waste.reverse().map((card) => ({ ...card, faceUp: false }));
                this.waste = [];
                this.moves += 1;
                this.setStatus('Descarte reciclado al mazo');
            } else {
                this.setStatus('No quedan cartas en el mazo');
            }
            this.selected = null;
            this.render();
        }

        selectWaste() {
            const card = this.waste[this.waste.length - 1];
            if (!card) return;
            this.selected = { type: 'waste', cardId: card.id, cards: [card] };
            this.setStatus(`${this.cardLabel(card)} seleccionado`);
            this.render();
        }

        selectFoundation(suit) {
            const pile = this.foundations[suit];
            const card = pile[pile.length - 1];
            if (!card) return;
            this.selected = { type: 'foundation', suit, cardId: card.id, cards: [card] };
            this.setStatus(`${this.cardLabel(card)} seleccionado`);
            this.render();
        }

        removeSelectedCards() {
            if (this.selected.type === 'waste') {
                return [this.waste.pop()];
            }
            if (this.selected.type === 'foundation') {
                return [this.foundations[this.selected.suit].pop()];
            }
            return this.tableau[this.selected.column].splice(this.selected.index);
        }

        canMoveToTableau(cards, targetCard) {
            const card = cards[0];
            if (!targetCard) return card.rank === 13;
            return targetCard.faceUp
                && targetCard.rank === card.rank + 1
                && this.cardColor(targetCard) !== this.cardColor(card);
        }

        canMoveToFoundation(card, suit) {
            const pile = this.foundations[suit];
            if (!pile.length) return card.rank === 1;
            return pile[pile.length - 1].rank === card.rank - 1;
        }

        afterMove(message) {
            this.tableau.forEach((pile) => {
                const top = pile[pile.length - 1];
                if (top && !top.faceUp) top.faceUp = true;
            });
            this.setStatus(this.isWon() ? 'Ganaste el solitario' : message);
            this.render();
        }

        pushHistory() {
            this.history.push(JSON.stringify({
                stock: this.stock,
                waste: this.waste,
                foundations: this.foundations,
                tableau: this.tableau,
                moves: this.moves
            }));
            if (this.history.length > 40) this.history.shift();
        }

        undo() {
            const snapshot = this.history.pop();
            if (!snapshot) {
                this.setStatus('No hay movimientos para deshacer');
                return;
            }
            const state = JSON.parse(snapshot);
            this.stock = state.stock;
            this.waste = state.waste;
            this.foundations = state.foundations;
            this.tableau = state.tableau;
            this.moves = state.moves;
            this.selected = null;
            this.setStatus('Movimiento deshecho');
            this.render();
        }

        render() {
            this.renderStock();
            this.renderFoundations();
            this.renderTableau();
            this.scoreEl.textContent = `${this.score()} pts`;
        }

        renderStock() {
            this.stockEl.innerHTML = this.stock.length
                ? `<span class="xp-card-back">${this.stock.length}</span>`
                : '<span class="xp-card-empty">Reset</span>';
            const wasteCard = this.waste[this.waste.length - 1];
            this.wasteEl.innerHTML = wasteCard ? this.cardMarkup(wasteCard, {
                source: 'waste',
                index: this.waste.length - 1,
                asSpan: true
            }) : '<span class="xp-card-empty">Waste</span>';
        }

        renderFoundations() {
            this.foundationsEl.innerHTML = SUITS.map((suit) => {
                const top = this.foundations[suit][this.foundations[suit].length - 1];
                return `
                    <button type="button" class="xp-card-pile foundation" data-foundation="${suit}">
                        ${top ? this.cardMarkup(top, { source: 'foundation', suit, asSpan: true }) : `<span class="xp-foundation-suit ${this.cardColor({ suit })}">${SUIT_ENTITIES[suit]}</span>`}
                    </button>
                `;
            }).join('');
        }

        renderTableau() {
            this.tableauEl.innerHTML = this.tableau.map((pile, column) => `
                <div class="xp-tableau-column" data-tableau-column="${column}">
                    ${pile.map((card, index) => this.cardMarkup(card, { source: 'tableau', column, index })).join('')}
                </div>
            `).join('');
        }

        cardMarkup(card, meta) {
            const selected = this.selected?.cardId === card.id ? 'selected' : '';
            const tagName = meta.asSpan ? 'span' : 'button';
            const tagOpen = meta.asSpan ? 'span' : 'button type="button"';
            if (!card.faceUp) {
                return `<${tagOpen} class="xp-playing-card back" data-card-id="${card.id}" data-source="${meta.source}" data-column="${meta.column}" data-index="${meta.index}"></${tagName}>`;
            }
            const attrs = [
                `data-card-id="${card.id}"`,
                `data-source="${meta.source}"`,
                meta.column !== undefined ? `data-column="${meta.column}"` : '',
                meta.index !== undefined ? `data-index="${meta.index}"` : '',
                meta.suit ? `data-suit="${meta.suit}"` : ''
            ].filter(Boolean).join(' ');
            return `
                <${tagOpen} class="xp-playing-card ${this.cardColor(card)} ${selected}" ${attrs}>
                    <span>${this.rankLabel(card.rank)}</span>
                    <strong>${SUIT_ENTITIES[card.suit]}</strong>
                    <small>${this.rankLabel(card.rank)}</small>
                </${tagName}>
            `;
        }

        rankLabel(rank) {
            return { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[rank] || String(rank);
        }

        cardLabel(card) {
            return `${this.rankLabel(card.rank)}${card.suit}`;
        }

        cardColor(card) {
            return RED_SUITS.has(card.suit) ? 'red' : 'black';
        }

        score() {
            const foundationCards = SUITS.reduce((total, suit) => total + this.foundations[suit].length, 0);
            return (foundationCards * 10) + (this.moves * 2);
        }

        isWon() {
            return SUITS.every((suit) => this.foundations[suit].length === 13);
        }

        setStatus(message) {
            this.status.textContent = message;
        }
    }

    window.initSolitaireApp = function initSolitaireApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-solitaire-root]') ? scope : document;
        rootWindow._solitaireApp = new SolitaireApp(rootWindow);
        rootWindow._solitaireApp.init();
        return rootWindow._solitaireApp;
    };
})();
