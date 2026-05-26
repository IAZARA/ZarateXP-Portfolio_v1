import "./ClippyCharacter.js";

export class ClippyManager {
    constructor() {
        this.clippy = null;
        this.isVisible = false;
        this.welcomeShown = false;
        this.tips = [
            '<p class="welcome-text">Hola, soy el asistente de ZarateXP.</p><p class="subtitle">Abre Mis Documentos para ver el CV actualizado y los accesos clave.</p>',
            '<p class="welcome-text">Tip de portfolio</p><p class="subtitle">En Mis Proyectos puedes abrir ForzaTech, Estudio Luttini y WJPC embebidos.</p>',
            '<p class="welcome-text">APIs en vivo</p><p class="subtitle">API Center consulta clima, GitHub y datos publicos sin API key.</p>',
            '<p class="welcome-text">PDF Studio</p><p class="subtitle">Puedes abrir el CV, cargar PDFs locales y guardar notas de revision.</p>',
            '<p class="welcome-text">Automatizaciones listas</p><p class="subtitle">El icono Flujos n8n muestra un proceso visual que puedes ejecutar.</p>',
            '<p class="welcome-text">Juegos XP</p><p class="subtitle">Solitario y Pinball son implementaciones propias para mostrar logica y Canvas.</p>',
            '<p class="welcome-text">Personaliza Windows</p><p class="subtitle">En Panel de control puedes cambiar fondo, tema, iconos, CRT y taskbar.</p>'
        ];
    }

    init() {
        // No hacer nada aquí, esperamos a que se llame showWelcome
    }

    showWelcome() {
        if (this.welcomeShown) return;
        
        // Crear Clippy con mensaje de bienvenida
        this.clippy = document.createElement('clippy-character');
        this.clippy.setAttribute('no-paper', '');
        
        // Añadir al DOM
        document.body.appendChild(this.clippy);
        this.clippy.addEventListener('clippy-close', () => {
            this.isVisible = false;
            this.clippy = null;
        }, { once: true });
        this.changeMessage(this.tips[0]);
        
        // Mostrar con animación
        setTimeout(() => {
            this.clippy.classList.add('entering', 'show');
            this.isVisible = true;
        }, 500);

        // Auto-ocultar después de 8 segundos
        setTimeout(() => {
            this.hide();
        }, 8000);

        this.welcomeShown = true;
    }

    show() {
        if (!this.clippy) {
            this.welcomeShown = false;
            this.showWelcome();
            return;
        }

        this.clippy.classList.remove('hide');
        this.clippy.classList.add('show');
        this.isVisible = true;
    }

    hide() {
        if (!this.clippy) return;

        this.clippy.classList.remove('show');
        this.clippy.classList.add('hide');
        this.isVisible = false;

        // Remover del DOM después de la animación
        setTimeout(() => {
            if (this.clippy && this.clippy.parentNode) {
                this.clippy.parentNode.removeChild(this.clippy);
                this.clippy = null;
            }
        }, 800);
    }

    toggle() {
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
        this.show();
        setTimeout(() => {
            this.changeMessage(this.tips[index % this.tips.length]);
        }, 0);
    }
}
