import { CORE_TRANSLATIONS } from './i18n/catalog-core.js?v=zaratexp-20260712-i18n2';
import { APP_TRANSLATIONS } from './i18n/catalog-apps.js?v=zaratexp-20260713-pinball-touch1';
import { PROJECT_TRANSLATIONS } from './i18n/catalog-projects.js?v=zaratexp-20260712-i18n2';

const STORAGE_KEY = 'zarateXP.locale';
const DEFAULT_LOCALE = 'es';
const SUPPORTED_LOCALES = new Set(['es', 'en']);
const RAW_TRANSLATIONS = { ...CORE_TRANSLATIONS, ...APP_TRANSLATIONS, ...PROJECT_TRANSLATIONS };
const TRANSLATIONS = Object.freeze(Object.fromEntries(
    Object.entries(RAW_TRANSLATIONS).map(([source, target]) => [source.trim(), String(target).trim()])
));
const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'aria-description', 'title', 'data-tooltip', 'placeholder', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA']);

const normalizeLocale = (locale) => SUPPORTED_LOCALES.has(String(locale || '').toLowerCase())
    ? String(locale).toLowerCase()
    : DEFAULT_LOCALE;

export class I18nManager {
    constructor() {
        this.locale = normalizeLocale(localStorage.getItem(STORAGE_KEY));
        this.textOriginals = new WeakMap();
        this.attributeOriginals = new WeakMap();
        this.observers = new Map();
        this.eventController = new AbortController();
        this.initialized = false;
        this.nativeDialogs = null;
        this.isApplyingLocale = false;
    }

    init() {
        if (this.initialized) return this;
        this.initialized = true;
        this.wrapShadowRoots();
        this.bindLanguageControl();
        this.wrapNativeDialogs();
        this.observeRoot(document.documentElement);
        this.localizeSubtree(document.documentElement);
        this.updateDocumentState();
        this.updateLanguageControl();
        return this;
    }

    wrapShadowRoots() {
        window.__zarateXPI18nManager = this;
        if (window.__zarateXPI18nShadowWrapped) return;
        window.__zarateXPI18nShadowWrapped = true;
        const nativeAttachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function attachLocalizedShadow(init) {
            const shadowRoot = nativeAttachShadow.call(this, init);
            queueMicrotask(() => {
                const manager = window.__zarateXPI18nManager;
                manager?.observeRoot(shadowRoot);
                manager?.localizeSubtree(shadowRoot);
            });
            return shadowRoot;
        };
    }

    t(value) {
        if (value === null || value === undefined) return '';
        if (this.locale === 'es') return String(value);
        return this.translateString(String(value));
    }

    setLocale(locale, { announce = true } = {}) {
        const nextLocale = normalizeLocale(locale);
        if (nextLocale === this.locale) {
            this.closeLanguageMenu();
            return false;
        }

        const previousLocale = this.locale;
        this.locale = nextLocale;
        localStorage.setItem(STORAGE_KEY, nextLocale);
        this.isApplyingLocale = true;
        try {
            this.localizeSubtree(document.documentElement);
        } finally {
            this.isApplyingLocale = false;
        }
        this.updateDocumentState();
        this.updateLanguageControl();
        this.closeLanguageMenu();

        window.dispatchEvent(new CustomEvent('zaratexp:localechange', {
            detail: { locale: nextLocale, previousLocale }
        }));

        if (announce) {
            const status = document.querySelector('[data-language-status]');
            if (status) {
                status.textContent = nextLocale === 'en'
                    ? 'Language changed to English.'
                    : 'Idioma cambiado a español.';
            }
        }
        return true;
    }

    formatDate(value, options = {}) {
        return new Intl.DateTimeFormat(this.locale === 'en' ? 'en-US' : 'es-AR', options).format(value);
    }

    formatNumber(value, options = {}) {
        return new Intl.NumberFormat(this.locale === 'en' ? 'en-US' : 'es-AR', options).format(value);
    }

    translateString(value) {
        const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const leading = match?.[1] || '';
        const content = match?.[2] || value;
        const trailing = match?.[3] || '';
        if (!content) return value;

        const exact = TRANSLATIONS[content];
        if (exact) return `${leading}${exact}${trailing}`;

        const dynamic = this.translateDynamic(content);
        return dynamic === content ? value : `${leading}${dynamic}${trailing}`;
    }

    translateDynamic(content) {
        const patterns = [
            [/^(\d+) elemento$/, '$1 item'],
            [/^(\d+) elementos$/, '$1 items'],
            [/^(\d+) caracteres$/, '$1 characters'],
            [/^(\d+) correctas$/, '$1 successful'],
            [/^(\d+) con error$/, '$1 with errors'],
            [/^(\d+) canceladas$/, '$1 canceled'],
            [/^Guardado (.+)$/, 'Saved $1'],
            [/^(\d+) de (\d+) etapas$/, '$1 of $2 stages'],
            [/^Etapa (\d+) de (\d+): (.+)$/, (_match, current, total, rest) => `Stage ${current} of ${total}: ${this.translateStageDescription(rest)}`],
            [/^Etapa (\d+) de (\d+), (.+)$/, (_match, current, total, rest) => `Stage ${current} of ${total}, ${this.translateStageDescription(rest)}`],
            [/^Tiempo (.+)$/, 'Time $1'],
            [/^(\d+) movimiento$/, '$1 move'],
            [/^(\d+) movimientos$/, '$1 moves'],
            [/^(\d+) mov\.$/, '$1 moves'],
            [/^(\d+) pts$/, '$1 pts'],
            [/^Mejor: (.+)$/, 'Best: $1'],
            [/^Mejor puntaje (.+)$/, 'Best score $1'],
            [/^(\d+) minas por marcar$/, '$1 mines remaining'],
            [/^(\d+) minas estimadas por marcar$/, '$1 estimated mines remaining'],
            [/^(\d+) segundos$/, '$1 seconds'],
            [/^(\d+) mina cercana$/, '$1 nearby mine'],
            [/^(\d+) minas cercanas$/, '$1 nearby mines'],
            [/^(\d+) alrededor$/, '$1 nearby'],
            [/^Bandera en fila (\d+), columna (\d+)$/, 'Flag on row $1, column $2'],
            [/^Casilla dudosa en fila (\d+), columna (\d+)$/, 'Questioned cell on row $1, column $2'],
            [/^Casilla cubierta, fila (\d+), columna (\d+)$/, 'Covered cell, row $1, column $2'],
            [/^Tablero de Buscaminas, (\d+) por (\d+), (\d+) minas$/, 'Minesweeper board, $1 by $2, $3 mines'],
            [/^Primer clic seguro en (.+)\. Las minas se muestran al perder; clic derecho o pulsacion larga marca banderas\.$/, (_match, level) => `First safe click on ${this.translateString(level)}. Mines are revealed when you lose; right-click or long-press to place flags.`],
            [/^Bandera colocada\. (\d+) minas estimadas por marcar\.$/, 'Flag placed. $1 estimated mines remaining.'],
            [/^(\d+) minas distribuidas\. Despeja todas las casillas seguras\.$/, '$1 mines placed. Clear every safe cell.'],
            [/^Esta casilla necesita (\d+) banderas alrededor; hay (\d+)\.$/, 'This cell needs $1 surrounding flags; there are $2.'],
            [/^Perdiste en (.+)\. Todas las minas estan visibles; pulsa la cara para reiniciar\.$/, 'You lost in $1. All mines are visible; press the face to restart.'],
            [/^Ganaste en (.+) - nuevo mejor tiempo\.$/, 'You won in $1 - new best time.'],
            [/^Ganaste en (.+) - record: (.+)\.$/, 'You won in $1 - record: $2.'],
            [/^Archivo local: (.+)$/, 'Local file: $1'],
            [/^Reproducir (.+) de (.+)$/, 'Play $1 by $2'],
            [/^(\d+) pistas - (.+)$/, '$1 tracks - $2'],
            [/^Cargando (.+)\.\.\.$/, 'Loading $1...'],
            [/^Reproduciendo (.+) - (.+)\.$/, 'Playing $1 - $2.'],
            [/^Pausado en (.+)\.$/, 'Paused at $1.'],
            [/^(.+) - (.+), listo para reproducir\.$/, '$1 - $2, ready to play.'],
            [/^Avance a (.+)\.$/, 'Forward to $1.'],
            [/^Retroceso a (.+)\.$/, 'Back to $1.'],
            [/^Volumen restaurado al (\d+)%\.$/, 'Volume restored to $1%.'],
            [/^Nivel (\d+)$/, 'Level $1'],
            [/^Puntaje: (.+)$/, 'Score: $1'],
            [/^Puntos: (.+)$/, 'Points: $1'],
            [/^Herramienta: (.+)$/, (_match, tool) => `Tool: ${this.translateString(tool)}`],
            [/^Tamano: (.+)px$/, 'Size: $1px'],
            [/^Color: (.+)$/, 'Color: $1'],
            [/^Vista activa: (.+)\.$/, (_match, view) => `Active view: ${this.translateString(view)}.`],
            [/^(.+): consultando\. Consultando proveedor$/, '$1: contacting. Contacting provider'],
            [/^Proveedor: (.+)$/, 'Provider: $1'],
            [/^Lluvia: (.+)$/, 'Rain: $1'],
            [/^(.+): (.+)\. Fuente: (.+)\.$/, (_match, channel, subject, source) => `${this.translateString(channel)}: ${subject}. Source: ${this.translateString(source)}.`],
            [/^Ejecución completa: (.+)\.$/, (_match, summary) => `Run complete: ${summary.split(', ').map((part) => this.translateString(part)).join(', ')}.`],
            [/^No encontramos una ciudad llamada "(.+)"\.$/, 'We could not find a city named "$1".'],
            [/^Consultando el pronóstico para (.+)\.\.\.$/, 'Fetching the forecast for $1...'],
            [/^Consultando el perfil de @(.+)\.\.\.$/, 'Fetching the profile for @$1...'],
            [/^Buscando datos públicos de (.+)\.\.\.$/, 'Searching public data for $1...'],
            [/^Clima no disponible: (.+)$/, 'Weather unavailable: $1'],
            [/^GitHub no disponible: (.+)$/, 'GitHub unavailable: $1'],
            [/^Datos públicos no disponibles: (.+)$/, 'Public data unavailable: $1'],
            [/^No encontramos datos para "(.+)"\.$/, 'We could not find data for "$1".'],
            [/^No pudimos consultar @(.+)$/, 'We could not fetch @$1'],
            [/^No pudimos buscar (.+)$/, 'We could not search for $1'],
            [/^Cancelando (.+)\.\.\.$/, 'Canceling $1...'],
            [/^(.+) cancelado\.$/, '$1 canceled.'],
            [/^Podés volver a ejecutar (.+) cuando quieras\.$/, 'You can run $1 again whenever you like.'],
            [/^Caché eliminada: (\d+) respuesta\.$/, 'Cache cleared: $1 response.'],
            [/^Caché eliminada: (\d+) respuestas\.$/, 'Cache cleared: $1 responses.'],
            [/^Actualizado (.+)$/, 'Updated $1'],
            [/^Población \((\d+)\)$/, 'Population ($1)'],
            [/^Bandera de (.+)$/, 'Flag of $1'],
            [/^Consultas de GitHub disponibles: (\d+)$/, 'Available GitHub requests: $1'],
            [/^El límite se renueva (.+)\.$/, 'The limit resets $1.'],
            [/^Última respuesta: (.+)$/, 'Last response: $1'],
            [/^La búsqueda debe tener entre 2 y (\d+) caracteres\.$/, 'The search must contain between 2 and $1 characters.'],
            [/^Consulta no ejecutada: (.+)$/, 'Request not run: $1'],
            [/^La API tardó más de (\d+) segundos\.$/, 'The API took more than $1 seconds.'],
            [/^El proveedor tiene un problema temporal \(HTTP (\d+)\)\.$/, 'The provider has a temporary problem (HTTP $1).'],
            [/^La API rechazó la consulta \(HTTP (\d+)\)\.$/, 'The API rejected the request (HTTP $1).'],
            [/^(.+) \((.+)\) seleccionada$/, (_match, name, type) => `${name} (${this.translateString(type)}) selected`],
            [/^(.+) - Detalles$/, '$1 - Details'],
            [/^Pista: (.+)$/, (_match, hint) => `Hint: ${this.translateString(hint)}`],
            [/^(.+) descubierta$/, (_match, card) => `${this.translateCardLabel(card)} revealed`],
            [/^(.+) y (\d+) cartas más seleccionada$/, (_match, card, count) => `${this.translateCardLabel(card)} and ${count} more cards selected`],
            [/^(.+) seleccionada$/, (_match, card) => `${this.translateCardLabel(card)} selected`],
            [/^(.+) seleccionada desde el descarte$/, (_match, card) => `${this.translateCardLabel(card)} selected from the waste`],
            [/^(.+) seleccionada desde la fundación$/, (_match, card) => `${this.translateCardLabel(card)} selected from the foundation`],
            [/^(.+) robada del mazo$/, (_match, card) => `${this.translateCardLabel(card)} drawn from the stock`],
            [/^La fundación de (.+) está vacía$/, (_match, suit) => `The ${this.translateString(suit)} foundation is empty`],
            [/^(.+) a la fundación\. Nueva carta descubierta$/, (_match, card) => `${this.translateCardLabel(card)} to the foundation. New card revealed`],
            [/^(.+) a la fundación$/, (_match, card) => `${this.translateCardLabel(card)} to the foundation`],
            [/^Necesitas una carta de color alternado debajo de (.+)$/, (_match, card) => `You need an alternating-color card below ${this.translateCardLabel(card)}`],
            [/^mueve (.+) a la columna (\d+) para descubrir una carta$/, (_match, card, column) => `move ${this.translateCardLabel(card)} to column ${column} to reveal a card`],
            [/^mueve (.+) del descarte a la columna (\d+)$/, (_match, card, column) => `move ${this.translateCardLabel(card)} from the waste to column ${column}`],
            [/^mueve (.+) a la columna (\d+)$/, (_match, card, column) => `move ${this.translateCardLabel(card)} to column ${column}`],
            [/^baja (.+) de la fundación a la columna (\d+)$/, (_match, card, column) => `move ${this.translateCardLabel(card)} down from the foundation to column ${column}`],
            [/^envía (.+) a la fundación de (.+)$/, (_match, card, suit) => `send ${this.translateCardLabel(card)} to the ${this.translateString(suit)} foundation`],
            [/^Auto movió (\d+) carta\. No quedan movimientos seguros inmediatos$/, 'Auto moved $1 card. No immediate safe moves remain'],
            [/^Auto movió (\d+) cartas\. No quedan movimientos seguros inmediatos$/, 'Auto moved $1 cards. No immediate safe moves remain'],
            [/^Ganaste en (.+) con (.+) puntos y (\d+) movimientos$/, 'You won in $1 with $2 points and $3 moves'],
            [/^Mazo, (\d+) cartas\. Robar una carta$/, 'Stock, $1 cards. Draw a card'],
            [/^Mazo vacío\. Reciclar (\d+) cartas del descarte$/, 'Empty stock. Recycle $1 cards from the waste'],
            [/^Descarte, carta superior (.+)$/, (_match, card) => `Waste, top card ${this.translateCardLabel(card)}`],
            [/^Fundación de (.+), carta superior (.+)$/, (_match, suit, card) => `${this.translateString(suit)} foundation, top card ${this.translateCardLabel(card)}`],
            [/^Fundación de (.+), vacía\. Comienza con el as$/, (_match, suit) => `${this.translateString(suit)} foundation, empty. Start with the ace`],
            [/^Columna (\d+), (\d+) cartas$/, 'Column $1, $2 cards'],
            [/^Columna (\d+) vacía\. Selecciona un rey y presiona Enter para moverlo aquí$/, 'Empty column $1. Select a king and press Enter to move it here'],
            [/^(.+), columna (\d+)\. Mueve un grupo de (\d+) cartas$/, (_match, card, column, count) => `${this.translateCardLabel(card)}, column ${column}. Move a group of ${count} cards`],
            [/^(.+), columna (\d+)$/, (_match, card, column) => `${this.translateCardLabel(card)}, column ${column}`],
            [/^Lanzamiento (\d+)%$/, 'Launch $1%'],
            [/^BANCO COMPLETO \+(\d+)$/, 'TARGET BANK COMPLETE +$1'],
            [/^MISIÓN COMPLETA \+(\d+)$/, 'MISSION COMPLETE +$1'],
            [/^Bola perdida\. Quedan (\d+)$/, 'Ball lost. $1 balls remaining'],
            [/^Bola perdida\. Quedan (\d+)\.$/, 'Ball lost. $1 balls remaining.'],
            [/^Misión completa\. Nivel (\d+)\. Nueva misión: (.+)\.$/, (_match, level, mission) => `Mission complete. Level ${level}. New mission: ${this.translateString(mission)}.`],
            [/^Bola extra al superar (.+) puntos\.$/, 'Extra ball after passing $1 points.'],
            [/^Fin de la partida\. Puntaje (.+)\.$/, 'Game over. Score $1.'],
            [/^(\d+) por ciento, zona de skill shot$/, '$1 percent, skill shot zone'],
            [/^(\d+) por ciento$/, '$1 percent'],
            [/^NIVEL (\d+)$/, 'LEVEL $1'],
            [/^BOLAS (\d+)$/, 'BALLS $1'],
            [/^Potencia (\d+)%$/, 'Power $1%'],
            [/^(.+): (\d+)\/(\d+)$/, (_match, mission, progress, total) => `${this.translateString(mission)}: ${progress}/${total}`],
            [/^(.+): (.+)$/, (_match, label, rest) => `${this.translateString(label)}: ${this.translateString(rest)}`],
            [/^Error: No se pudo abrir (.+)\. (.+)$/, 'Error: Could not open $1. $2'],
            [/^No se pudo abrir (.+)$/, 'Could not open $1'],
            [/^No se pudo iniciar (.+): (.+)$/, (_match, app, error) => `Could not start ${this.translateString(app)}: ${error}`],
            [/^Error al abrir (.+): (.+)$/, (_match, app, error) => `Error opening ${this.translateString(app)}: ${error}`],
            [/^Abriendo (.+)$/, 'Opening $1'],
            [/^Cargando (.+)$/, 'Loading $1'],
            [/^Buscando (.+)$/, 'Searching for $1'],
            [/^Mis Proyectos\\Desarrollo Web$/, 'My Projects\\Web Development'],
            [/^Mis Proyectos\\IA y Automatización$/, 'My Projects\\AI and Automation'],
            [/^Resultados para (.+)$/, 'Results for $1']
        ];

        for (const [pattern, replacement] of patterns) {
            if (pattern.test(content)) return content.replace(pattern, replacement);
        }
        return content;
    }

    translateCardLabel(value) {
        const card = String(value || '').trim();
        const match = card.match(/^(.+) de (corazones|diamantes|tréboles|picas)$/i);
        if (!match) return this.translateString(card);
        return `${this.translateString(match[1].toLowerCase())} of ${this.translateString(match[2].toLowerCase())}`;
    }

    translateStageDescription(value) {
        const [title, ...summaryParts] = String(value || '').split('. ');
        const summary = summaryParts.join('. ');
        const translatedTitle = this.translateString(title.replace(/\.$/, ''));
        if (!summary) return translatedTitle;
        return `${translatedTitle}. ${this.translateString(summary)}`;
    }

    hasTranslation(value) {
        if (!value) return false;
        const trimmed = String(value).trim();
        return Boolean(TRANSLATIONS[trimmed]) || this.translateDynamic(trimmed) !== trimmed;
    }

    localizeSubtree(root) {
        if (!root) return;
        this.walkNode(root);
    }

    walkNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            this.localizeTextNode(node);
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'TEXTAREA') {
                this.localizeAttributes(node);
                return;
            }
            if (this.shouldSkipElement(node)) return;
            this.localizeAttributes(node);
            if (node.shadowRoot) {
                this.observeRoot(node.shadowRoot);
                this.walkNode(node.shadowRoot);
            }
        }

        Array.from(node.childNodes || []).forEach((child) => this.walkNode(child));
    }

    shouldSkipElement(element) {
        if (SKIP_TAGS.has(element.tagName)) return true;
        if (element.matches?.('[data-no-i18n], [contenteditable="true"]')) return true;
        if (element.closest?.('[data-no-i18n], [contenteditable="true"]')) return true;
        return false;
    }

    localizeTextNode(node) {
        if (!node.parentElement || this.shouldSkipElement(node.parentElement)) return;
        const current = node.nodeValue || '';
        let original = this.textOriginals.get(node);

        if (original === undefined) {
            original = current;
            this.textOriginals.set(node, original);
        } else if (this.locale === 'es' && !this.isApplyingLocale && current !== original) {
            // Runtime views frequently reuse the same text node for status updates.
            // While Spanish is active, the new text becomes the source of truth so
            // the observer does not restore a stale status message.
            original = current;
            this.textOriginals.set(node, original);
        } else if (this.locale === 'en') {
            const expected = this.translateString(original);
            if (current !== expected && this.hasTranslation(current)) {
                original = current;
                this.textOriginals.set(node, original);
            }
        }

        const target = this.locale === 'en' ? this.translateString(original) : original;
        if (current !== target) node.nodeValue = target;
    }

    localizeAttributes(element) {
        if (SKIP_TAGS.has(element.tagName) && element.tagName !== 'TEXTAREA') return;
        if (element.matches?.('[data-no-i18n], [contenteditable="true"]')) return;
        if (element.closest?.('[data-no-i18n], [contenteditable="true"]')) return;

        if (element.matches?.('input[readonly][data-i18n-value]')) {
            const source = element.dataset.i18nValue || '';
            const target = this.locale === 'en' ? this.translateString(source) : source;
            if (element.value !== target) element.value = target;
        }

        let originals = this.attributeOriginals.get(element);
        if (!originals) {
            originals = new Map();
            this.attributeOriginals.set(element, originals);
        }

        TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
            if (!element.hasAttribute?.(attribute)) return;
            const current = element.getAttribute(attribute) || '';
            let original = originals.get(attribute);
            if (original === undefined) {
                original = current;
                originals.set(attribute, original);
            } else if (this.locale === 'es' && !this.isApplyingLocale && current !== original) {
                // Keep changing labels/tooltips as the Spanish source value.
                original = current;
                originals.set(attribute, original);
            } else if (this.locale === 'en') {
                const expected = this.translateString(original);
                if (current !== expected && this.hasTranslation(current)) {
                    original = current;
                    originals.set(attribute, original);
                }
            }
            const target = this.locale === 'en' ? this.translateString(original) : original;
            if (current !== target) element.setAttribute(attribute, target);
        });
    }

    observeRoot(root) {
        if (!root || this.observers.has(root)) return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    this.localizeTextNode(mutation.target);
                    return;
                }
                if (mutation.type === 'attributes') {
                    this.localizeAttributes(mutation.target);
                    return;
                }
                mutation.addedNodes.forEach((node) => this.walkNode(node));
            });
        });
        observer.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: TRANSLATABLE_ATTRIBUTES
        });
        this.observers.set(root, observer);
    }

    bindLanguageControl() {
        const switcher = document.querySelector('[data-language-switcher]');
        const trigger = switcher?.querySelector('[data-language-trigger]');
        const menu = switcher?.querySelector('[data-language-menu]');
        const options = Array.from(switcher?.querySelectorAll('[data-language-option]') || []);
        if (!switcher || !trigger || !menu || !options.length) return;

        const signal = this.eventController.signal;
        const openMenu = ({ focus = false } = {}) => {
            menu.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            const tooltip = document.querySelector('.dynamic-tooltip');
            if (tooltip) tooltip.style.display = 'none';
            trigger.removeAttribute('aria-describedby');
            if (focus) (options.find((option) => option.dataset.languageOption === this.locale) || options[0])?.focus();
        };

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (menu.hidden) openMenu();
            else this.closeLanguageMenu();
        }, { signal });
        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                openMenu({ focus: true });
            }
        }, { signal });

        options.forEach((option, index) => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                this.setLocale(option.dataset.languageOption);
                trigger.focus();
            }, { signal });
            option.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeLanguageMenu();
                    trigger.focus();
                    return;
                }
                if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                let nextIndex = index;
                if (event.key === 'ArrowDown') nextIndex = (index + 1) % options.length;
                if (event.key === 'ArrowUp') nextIndex = (index - 1 + options.length) % options.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = options.length - 1;
                options[nextIndex].focus();
            }, { signal });
        });

        document.addEventListener('click', (event) => {
            if (!switcher.contains(event.target)) this.closeLanguageMenu();
        }, { signal });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !menu.hidden) this.closeLanguageMenu();
        }, { signal });
    }

    closeLanguageMenu() {
        const menu = document.querySelector('[data-language-menu]');
        const trigger = document.querySelector('[data-language-trigger]');
        if (menu) menu.hidden = true;
        trigger?.setAttribute('aria-expanded', 'false');
    }

    updateLanguageControl() {
        const code = document.querySelector('[data-language-code]');
        const trigger = document.querySelector('[data-language-trigger]');
        if (code) code.textContent = this.locale.toUpperCase();
        if (trigger) {
            trigger.setAttribute('aria-label', this.locale === 'en' ? 'Language: English' : 'Idioma: Español');
            trigger.dataset.tooltip = this.locale === 'en' ? 'Select language' : 'Seleccionar idioma';
        }
        document.querySelectorAll('[data-language-option]').forEach((option) => {
            const selected = option.dataset.languageOption === this.locale;
            option.setAttribute('aria-checked', String(selected));
            option.classList.toggle('selected', selected);
        });
    }

    updateDocumentState() {
        document.documentElement.lang = this.locale;
        document.body.dataset.locale = this.locale;
        const ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale) ogLocale.content = this.locale === 'en' ? 'en_US' : 'es_AR';
    }

    wrapNativeDialogs() {
        if (window.__zarateXPI18nDialogsWrapped) return;
        window.__zarateXPI18nDialogsWrapped = true;
        this.nativeDialogs = {
            alert: window.alert.bind(window),
            confirm: window.confirm.bind(window),
            prompt: window.prompt.bind(window)
        };
        window.alert = (message) => this.nativeDialogs.alert(this.t(message));
        window.confirm = (message) => this.nativeDialogs.confirm(this.t(message));
        window.prompt = (message, defaultValue) => this.nativeDialogs.prompt(this.t(message), defaultValue);
    }

    destroy() {
        this.eventController.abort();
        this.observers.forEach((observer) => observer.disconnect());
        this.observers.clear();
        this.initialized = false;
    }
}

window.I18nManager = I18nManager;
