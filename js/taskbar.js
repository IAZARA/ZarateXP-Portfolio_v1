// Taskbar Manager Module
export class TaskbarManager {
    constructor() {
        this.taskbar = document.querySelector('.taskbar');
        this.startButton = document.getElementById('start-button');
        this.showDesktopButton = document.getElementById('show-desktop-button');
        this.programsArea = document.querySelector('.taskbar-programs');
        this.systemTray = document.querySelector('.system-tray');
        this.openPrograms = new Map();
        this.desktopPeekActive = false;
        this.desktopPeekWindowIds = new Set();
    }
    
    init() {
        this.setupStartButton();
        this.setupQuickLaunch();
        this.setupSystemTray();
        this.setupTaskbarPrograms();
    }
    
    setupStartButton() {
        this.startButton.setAttribute('aria-controls', 'app-library');
        this.startButton.setAttribute('aria-expanded', 'false');
        // Helper para agregar eventos click y touch
        const addClickAndTouch = (element, handler) => {
            element.addEventListener('click', handler);
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                handler(e);
            });
        };
        
        addClickAndTouch(this.startButton, (e) => {
            e.stopPropagation();
            
            if (window.zarateXP?.startMenuManager) {
                window.zarateXP.startMenuManager.toggle();
            }
            
        });
    }

    setupQuickLaunch() {
        if (!this.showDesktopButton) return;

        this.showDesktopButton.addEventListener('click', () => this.toggleShowDesktop());
        this.syncShowDesktopButton();
    }

    toggleShowDesktop() {
        const windowManager = window.zarateXP?.windowManager;
        if (!windowManager) return;

        const entries = Array.from(windowManager.windows.entries());
        const visibleWindows = entries.filter(([, data]) => !data.isMinimized && !data.isClosing);

        if (visibleWindows.length && !this.desktopPeekActive) {
            this.desktopPeekWindowIds = new Set(visibleWindows.map(([id]) => id));
            visibleWindows.forEach(([id]) => windowManager.minimizeWindow(id));
            this.desktopPeekActive = true;
            this.syncShowDesktopButton();
            this.showNotification('Escritorio visible');
            return;
        }

        entries.forEach(([id, data]) => {
            if (data.isMinimized && this.desktopPeekWindowIds.has(id)) windowManager.restoreWindow(id);
        });
        this.desktopPeekActive = false;
        this.desktopPeekWindowIds.clear();
        this.syncShowDesktopButton();
    }

    syncShowDesktopButton() {
        if (!this.showDesktopButton) return;
        const label = this.desktopPeekActive ? 'Restaurar ventanas' : 'Mostrar escritorio';
        this.showDesktopButton.classList.toggle('active', this.desktopPeekActive);
        this.showDesktopButton.setAttribute('aria-pressed', String(this.desktopPeekActive));
        this.showDesktopButton.setAttribute('aria-label', label);
        this.showDesktopButton.dataset.tooltip = label;
        window.zarateXP?.i18nManager?.localizeSubtree(this.showDesktopButton);
        const tooltipId = this.showDesktopButton.getAttribute('aria-describedby');
        const activeTooltip = tooltipId ? document.getElementById(tooltipId) : null;
        if (activeTooltip) activeTooltip.textContent = this.showDesktopButton.dataset.tooltip;
    }
    
    setupSystemTray() {
        // Volume icon click
        const volumeIcon = this.systemTray.querySelector('.tray-network-icon');
        if (volumeIcon) {
            volumeIcon.addEventListener('click', () => {
                this.showNotification('Sonidos XP activos. Puedes cambiar efectos desde Panel de control.');
            });
        }

        const clippyIcon = this.systemTray.querySelector('.tray-clippy-icon');
        if (clippyIcon) {
            clippyIcon.addEventListener('click', () => {
                const clippyManager = window.zarateXP?.clippyManager;
                if (clippyManager?.isDisabled()) return;
                clippyManager?.showTip(Math.floor(Math.random() * 4));
            });
        }

        const removableButton = this.systemTray.querySelector('.tray-removable-button');
        if (removableButton) {
            removableButton.addEventListener('click', () => {
                window.zarateXP?.appManager?.ejectRemovableDrive?.();
            });

            window.addEventListener('zaratexp:removable-drive-ejected', () => {
                removableButton.hidden = true;
                this.showNotification(
                    'Ahora puede quitar de forma segura Disco extraíble (F:) del equipo.',
                    5000,
                    {
                        title: 'Es seguro quitar el hardware',
                        icon: './assets/images/xp-small-icons/information.png'
                    }
                );
                window.zarateXP?.soundManager?.play('information');
            });
        }
        
        // Fullscreen toggle (desktop only)
        const fullscreenIcon = this.systemTray.querySelector('.tray-fullscreen-icon');
        if (fullscreenIcon) {
            fullscreenIcon.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }
    
    setupTaskbarPrograms() {
        // Handle clicks on taskbar programs
        this.programsArea.addEventListener('click', (e) => {
            const programButton = e.target.closest('.taskbar-program');
            if (programButton) {
                const windowId = programButton.getAttribute('data-window-id');
                if (windowId && window.zarateXP?.windowManager) {
                    window.zarateXP.windowManager.toggleWindow(windowId);
                }
            }
        });
    }
    
    addProgram(windowId, title, icon) {
        // Check if program already exists
        if (this.openPrograms.has(windowId)) {
            return;
        }
        
        // Create taskbar button
        const button = document.createElement('div');
        button.className = 'taskbar-program active';
        button.setAttribute('data-window-id', windowId);
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-pressed', 'true');
        button.title = title;
        const image = document.createElement('img');
        image.src = this.safeResourceUrl(icon);
        image.alt = String(title || windowId);
        const label = document.createElement('span');
        label.textContent = String(title || windowId);
        button.append(image, label);

        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                window.zarateXP?.windowManager?.toggleWindow(windowId);
            }
        });

        button.addEventListener('auxclick', (event) => {
            if (event.button === 1) {
                window.zarateXP?.windowManager?.closeWindow(windowId);
            }
        });
        
        this.programsArea.appendChild(button);
        this.openPrograms.set(windowId, button);
        this.desktopPeekActive = false;
        this.desktopPeekWindowIds.clear();
        this.syncShowDesktopButton();
        
        // Play sound
        if (window.zarateXP?.soundManager) {
            window.zarateXP.soundManager.play('click');
        }
    }
    
    removeProgram(windowId) {
        const button = this.openPrograms.get(windowId);
        if (button) {
            button.remove();
            this.openPrograms.delete(windowId);
        }
    }
    
    setActiveProgram(windowId) {
        // Remove active class from all programs
        this.openPrograms.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        });
        
        // Add active class to specified program
        const button = this.openPrograms.get(windowId);
        if (button) {
            button.classList.add('active');
            button.classList.remove('minimized');
            button.setAttribute('aria-pressed', 'true');
        }
    }
    
    minimizeProgram(windowId) {
        const button = this.openPrograms.get(windowId);
        if (button) {
            button.classList.add('minimized');
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        }
    }
    
    restoreProgram(windowId) {
        const button = this.openPrograms.get(windowId);
        if (button) {
            button.classList.remove('minimized');
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    showNotification(message, duration = 3000, options = {}) {
        this.activeNotification?.remove();
        clearTimeout(this.notificationTimer);

        const balloon = document.createElement('div');
        balloon.className = 'notification-balloon';
        balloon.setAttribute('role', 'status');
        balloon.setAttribute('aria-live', 'polite');

        if (options.title) {
            const header = document.createElement('div');
            header.className = 'notification-balloon-header';
            if (options.icon) {
                const image = document.createElement('img');
                image.src = this.safeResourceUrl(options.icon, './assets/images/xp-small-icons/information.png');
                image.alt = '';
                header.appendChild(image);
            }
            const title = document.createElement('strong');
            title.textContent = window.zarateXP?.i18nManager?.t(options.title) || options.title;
            header.appendChild(title);
            balloon.appendChild(header);
        }

        const body = document.createElement('div');
        body.className = 'notification-balloon-body';
        body.textContent = window.zarateXP?.i18nManager?.t(message) || message;
        balloon.appendChild(body);
        
        this.systemTray.appendChild(balloon);
        this.activeNotification = balloon;
        
        this.notificationTimer = window.setTimeout(() => {
            balloon.style.opacity = '0';
            window.setTimeout(() => {
                balloon.remove();
                if (this.activeNotification === balloon) this.activeNotification = null;
            }, 300);
        }, duration);

        return balloon;
    }
    
    updateClock() {
        const clockElement = this.systemTray.querySelector('.time');
        if (clockElement) {
            const locale = window.zarateXP?.i18nManager?.locale === 'en' ? 'en-US' : 'es-AR';
            clockElement.textContent = new Date().toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    flashTaskbarButton(windowId) {
        const button = this.openPrograms.get(windowId);
        if (button && !button.classList.contains('active')) {
            button.classList.add('flashing');
            
            // Remove flashing after a few seconds
            setTimeout(() => {
                button.classList.remove('flashing');
            }, 3000);
        }
    }

    safeResourceUrl(value, fallback = './assets/images/hd-icons/my-computer.svg') {
        try {
            const parsed = new URL(String(value || ''), window.location.href);
            return ['http:', 'https:', 'blob:'].includes(parsed.protocol) ? String(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }
}

// Add CSS for flashing animation
const style = document.createElement('style');
style.textContent = `
    .taskbar-program.flashing {
        animation: taskbar-flash 0.5s ease-in-out infinite;
    }
    
    @keyframes taskbar-flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
`;
document.head.appendChild(style);

// Legacy support
window.TaskbarManager = TaskbarManager;
