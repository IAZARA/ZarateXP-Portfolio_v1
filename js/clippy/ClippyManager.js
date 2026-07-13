import "./ClippyCharacter.js?v=zaratexp-20260712-clippy-mobile1";

const CLIPPY_DISABLED_QUERY = '(max-width: 768px), (hover: none) and (pointer: coarse)';

export class ClippyManager {
    constructor() {
        this.clippy = null;
        this.isVisible = false;
        this.welcomeShown = false;
        this.mediaQuery = window.matchMedia(CLIPPY_DISABLED_QUERY);
        this.welcomeTimer = null;
        this.enterTimer = null;
        this.autoHideTimer = null;
        this.removeTimer = null;
        this.initialized = false;
        this.handleMediaChange = this.handleMediaChange.bind(this);
        this.tips = [
            '<p class="welcome-text">Hola, soy el asistente de ZarateXP.</p><p class="subtitle">Abre Perfil orientado a FDE para revisar experiencia, casos, capacidades y contacto.</p>',
            '<p class="welcome-text">Tip de portfolio</p><p class="subtitle">En Mis Proyectos puedes abrir ForzaTech, Estudio Luttini y WJPC embebidos.</p>',
            '<p class="welcome-text">APIs en vivo</p><p class="subtitle">API Center consulta clima, GitHub y datos publicos sin API key.</p>',
            '<p class="welcome-text">PDF Studio</p><p class="subtitle">Puedes abrir el CV, cargar PDFs locales y guardar notas de revision.</p>',
            '<p class="welcome-text">SDLC + MLOps</p><p class="subtitle">Flujos n8n explica cómo una necesidad se versiona, valida, despliega y mejora con aprobación humana y observabilidad.</p>',
            '<p class="welcome-text">Juegos XP</p><p class="subtitle">Solitario y Pinball son implementaciones propias para mostrar logica y Canvas.</p>',
            '<p class="welcome-text">Personaliza Windows</p><p class="subtitle">En Panel de control puedes cambiar fondo, tema, iconos, CRT y taskbar.</p>'
        ];
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        if (typeof this.mediaQuery.addEventListener === 'function') {
            this.mediaQuery.addEventListener('change', this.handleMediaChange);
        } else {
            this.mediaQuery.addListener(this.handleMediaChange);
        }
        if (this.isDisabled()) this.destroy();
    }

    isDisabled() {
        return this.mediaQuery.matches;
    }

    handleMediaChange(event) {
        if (event.matches) this.destroy();
    }

    clearTimers() {
        window.clearTimeout(this.welcomeTimer);
        window.clearTimeout(this.enterTimer);
        window.clearTimeout(this.autoHideTimer);
        window.clearTimeout(this.removeTimer);
        this.welcomeTimer = null;
        this.enterTimer = null;
        this.autoHideTimer = null;
        this.removeTimer = null;
    }

    removeClippy() {
        const current = this.clippy;
        this.clippy = null;
        this.isVisible = false;
        if (current?.isConnected) current.remove();
    }

    destroy() {
        this.clearTimers();
        this.removeClippy();
        this.welcomeShown = false;
    }

    scheduleAutoHide() {
        window.clearTimeout(this.autoHideTimer);
        this.autoHideTimer = window.setTimeout(() => this.hide(), 8000);
    }

    scheduleWelcome(delay = 6000) {
        if (this.isDisabled() || this.welcomeShown || this.welcomeTimer) return false;
        this.welcomeTimer = window.setTimeout(() => {
            this.welcomeTimer = null;
            if (!this.isDisabled()) this.showWelcome();
        }, delay);
        return true;
    }

    showWelcome() {
        if (this.isDisabled() || this.welcomeShown) return false;

        this.clearTimers();
        
        // Crear Clippy con mensaje de bienvenida
        const clippy = document.createElement('clippy-character');
        clippy.setAttribute('no-paper', '');
        this.clippy = clippy;
        
        // Añadir al DOM
        document.body.appendChild(clippy);
        clippy.addEventListener('clippy-close', () => {
            if (this.clippy !== clippy) return;
            this.clearTimers();
            this.removeClippy();
        }, { once: true });
        this.changeMessage(this.tips[0]);
        
        // Mostrar con animación
        this.enterTimer = window.setTimeout(() => {
            this.enterTimer = null;
            if (this.isDisabled() || this.clippy !== clippy) {
                this.destroy();
                return;
            }
            clippy.classList.add('entering', 'show');
            this.isVisible = true;
        }, 500);

        // Auto-ocultar después de 8 segundos
        this.scheduleAutoHide();

        this.welcomeShown = true;
        return true;
    }

    show() {
        if (this.isDisabled()) {
            this.destroy();
            return false;
        }

        if (!this.clippy) {
            this.welcomeShown = false;
            return this.showWelcome();
        }

        window.clearTimeout(this.removeTimer);
        this.removeTimer = null;
        this.clippy.classList.remove('hide');
        this.clippy.classList.add('show');
        this.isVisible = true;
        this.scheduleAutoHide();
        return true;
    }

    hide({ immediate = false } = {}) {
        if (!this.clippy) return;

        window.clearTimeout(this.enterTimer);
        window.clearTimeout(this.autoHideTimer);
        this.enterTimer = null;
        this.autoHideTimer = null;

        if (immediate) {
            this.removeClippy();
            return;
        }

        this.clippy.classList.remove('show');
        this.clippy.classList.add('hide');
        this.isVisible = false;

        // Remover del DOM después de la animación
        window.clearTimeout(this.removeTimer);
        this.removeTimer = window.setTimeout(() => {
            this.removeTimer = null;
            this.removeClippy();
        }, 800);
    }

    toggle() {
        if (this.isDisabled()) {
            this.destroy();
            return;
        }
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    changeMessage(message) {
        if (this.clippy) {
            this.clippy.setText(message);
        }
    }

    showTip(index = 0) {
        if (this.isDisabled() || !this.show()) return false;
        this.changeMessage(this.tips[index % this.tips.length]);
        return true;
    }
}
