// Taskbar Manager Module
export class TaskbarManager {
    constructor() {
        this.taskbar = document.querySelector('.taskbar');
        this.startButton = document.getElementById('start-button');
        this.programsArea = document.querySelector('.taskbar-programs');
        this.systemTray = document.querySelector('.system-tray');
        this.openPrograms = new Map();
    }
    
    init() {
        this.setupStartButton();
        this.setupSystemTray();
        this.setupTaskbarPrograms();
    }
    
    setupStartButton() {
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
            
            // Toggle active state
            this.startButton.classList.toggle('active');
        });
        
        // Remove active state when clicking elsewhere
        document.addEventListener('click', () => {
            this.startButton.classList.remove('active');
        });
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
                window.zarateXP?.clippyManager?.showTip(Math.floor(Math.random() * 4));
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
        button.innerHTML = `
            <img src="${icon}" alt="${title}">
            <span>${title}</span>
        `;

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
    
    showNotification(message, duration = 3000) {
        // Create notification balloon
        const balloon = document.createElement('div');
        balloon.className = 'notification-balloon';
        balloon.textContent = message;
        
        // Position near system tray
        this.systemTray.appendChild(balloon);
        balloon.style.display = 'block';
        
        // Auto hide after duration
        setTimeout(() => {
            balloon.style.opacity = '0';
            setTimeout(() => {
                balloon.remove();
            }, 300);
        }, duration);
    }
    
    updateClock() {
        const clockElement = this.systemTray.querySelector('.time');
        if (clockElement) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            clockElement.textContent = `${displayHours}:${minutes} ${ampm}`;
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
    
    .notification-balloon {
        position: absolute;
        bottom: 100%;
        right: 0;
        background: #FFFFE1;
        border: 1px solid #000;
        border-radius: 5px;
        padding: 8px 12px;
        margin-bottom: 5px;
        font-size: 11px;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        display: none;
        max-width: 200px;
        opacity: 1;
        transition: opacity 0.3s;
    }
    
    .notification-balloon::after {
        content: '';
        position: absolute;
        bottom: -6px;
        right: 20px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid #FFFFE1;
    }
`;
document.head.appendChild(style);

// Legacy support
window.TaskbarManager = TaskbarManager;
