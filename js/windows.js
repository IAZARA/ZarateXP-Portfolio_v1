// Window Manager Module
export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndexCounter = 100;
        this.windowsContainer = document.getElementById('windows-container');
        this.taskbarManager = null; // Se establecerá desde main.js
        this.soundManager = null; // Se establecerá desde main.js
    }
    
    init() {
        // Set up global window event handlers
        this.setupGlobalHandlers();
    }

    getTaskbarHeight() {
        const rawHeight = getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height');
        return parseInt(rawHeight, 10) || 30;
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    safeResourceUrl(value, fallback = './assets/images/hd-icons/my-computer.svg') {
        const rawValue = String(value || '').trim();
        if (!rawValue) return fallback;

        try {
            const parsed = new URL(rawValue, window.location.href);
            const allowedProtocols = new Set(['http:', 'https:', 'blob:']);
            return allowedProtocols.has(parsed.protocol) ? rawValue : fallback;
        } catch (error) {
            return fallback;
        }
    }
    
    setupGlobalHandlers() {
        // Handle window focus on click
        this.windowsContainer.addEventListener('mousedown', (e) => {
            const window = e.target.closest('.window');
            if (window) {
                const windowId = window.getAttribute('data-window-id');
                this.focusWindow(windowId);
            }
        });
    }
    
    createWindow(options) {
        const {
            id,
            title,
            icon,
            width = 600,
            height = 400,
            content = '',
            resizable = true,
            maximizable = true,
            minimizable = true,
            closable = true,
            draggable = true,
            x = null,
            y = null
        } = options;
        
        // Check if window already exists
        if (this.windows.has(id)) {
            this.focusWindow(id);
            return;
        }
        
        // Create window element
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.setAttribute('data-window-id', id);
        windowElement.setAttribute('role', 'dialog');
        windowElement.setAttribute('aria-label', String(title));
        windowElement.style.width = width + 'px';
        windowElement.style.height = height + 'px';
        
        // Position window
        if (x !== null && y !== null) {
            windowElement.style.left = x + 'px';
            windowElement.style.top = y + 'px';
        } else {
            // Center window
            windowElement.style.left = Math.max(8, (globalThis.innerWidth - width) / 2) + 'px';
            windowElement.style.top = Math.max(8, (globalThis.innerHeight - height - this.getTaskbarHeight()) / 2) + 'px';
        }
        
        const safeTitle = this.escapeHtml(title);
        const safeIcon = this.escapeHtml(this.safeResourceUrl(icon));

        // Create window chrome. Window body content comes from first-party app
        // templates and is inserted separately so dynamic chrome fields stay escaped.
        windowElement.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">
                    <img src="${safeIcon}" alt="${safeTitle}" class="title-bar-icon">
                    <span>${safeTitle}</span>
                </div>
                <div class="title-bar-controls">
                    ${minimizable ? '<button class="minimize-btn" aria-label="Minimize"></button>' : ''}
                    ${maximizable ? '<button class="maximize-btn" aria-label="Maximize"></button>' : ''}
                    ${closable ? '<button class="close-btn" aria-label="Close"></button>' : ''}
                </div>
            </div>
            <div class="window-body"></div>
        `;
        windowElement.querySelector('.window-body').innerHTML = String(content);
        
        // Add to container
        this.windowsContainer.appendChild(windowElement);
        
        // Store window data
        this.windows.set(id, {
            element: windowElement,
            title,
            icon,
            isMaximized: false,
            isMinimized: false,
            previousPosition: null,
            previousSize: null
        });
        
        // Set up window controls
        this.setupWindowControls(id);
        
        // Make window draggable
        if (draggable) {
            this.makeWindowDraggable(id);
        }
        
        // Make window resizable
        if (resizable) {
            this.makeWindowResizable(id);
        }
        
        // Focus the new window
        this.focusWindow(id);
        
        // Add to taskbar
        const taskbarManager = this.taskbarManager || window.zarateXP?.taskbarManager;
        if (taskbarManager) {
            taskbarManager.addProgram(id, title, icon);
        }
        
        // Play sound
        const soundManager = this.soundManager || window.zarateXP?.soundManager;
        if (soundManager) {
            soundManager.play('maximize');
        }
        
        // Animate window appearance
        this.animateWindowOpen(windowElement);
        
        return windowElement;
    }
    
    setupWindowControls(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        // Minimize button
        const minimizeBtn = windowElement.querySelector('.minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.minimizeWindow(windowId);
            });
        }
        
        // Maximize button
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                this.toggleMaximize(windowId);
            });
        }
        
        // Close button
        const closeBtn = windowElement.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeWindow(windowId);
            });
        }
        
        // Double click title bar to maximize
        const titleBar = windowElement.querySelector('.title-bar');
        titleBar.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.title-bar-controls')) {
                this.toggleMaximize(windowId);
            }
        });
    }
    
    makeWindowDraggable(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        const titleBar = windowElement.querySelector('.title-bar');
        
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;
        
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.title-bar-controls')) return;
            if (windowData.isMaximized) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = windowElement.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            titleBar.style.cursor = 'move';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const rect = windowElement.getBoundingClientRect();
            const minLeft = -rect.width + 80;
            const maxLeft = globalThis.innerWidth - 60;
            const maxTop = globalThis.innerHeight - this.getTaskbarHeight() - 24;
            const nextLeft = Math.min(Math.max(initialX + deltaX, minLeft), maxLeft);
            const nextTop = Math.min(Math.max(initialY + deltaY, 0), maxTop);

            windowElement.style.left = nextLeft + 'px';
            windowElement.style.top = nextTop + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            titleBar.style.cursor = '';
        });
    }
    
    makeWindowResizable(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        // Add resize handles
        const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        resizeHandles.forEach(handle => {
            const resizer = document.createElement('div');
            resizer.className = `resize-handle resize-${handle}`;
            windowElement.appendChild(resizer);
            
            this.setupResizeHandle(windowId, resizer, handle);
        });
    }
    
    setupResizeHandle(windowId, handle, direction) {
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        let startLeft = 0;
        let startTop = 0;
        
        handle.addEventListener('mousedown', (e) => {
            const windowData = this.windows.get(windowId);
            if (!windowData || windowData.isMaximized) return;
            
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const windowElement = windowData.element;
            const rect = windowElement.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left;
            startTop = rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const windowData = this.windows.get(windowId);
            if (!windowData) return;
            
            const windowElement = windowData.element;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const minWidth = 200;
            const minHeight = 150;
            const maxRight = globalThis.innerWidth - 4;
            const maxBottom = globalThis.innerHeight - this.getTaskbarHeight() - 4;
            let nextLeft = startLeft;
            let nextTop = startTop;
            let nextWidth = startWidth;
            let nextHeight = startHeight;

            if (direction.includes('e')) {
                nextWidth = Math.max(minWidth, Math.min(startWidth + deltaX, maxRight - startLeft));
            }
            if (direction.includes('w')) {
                nextLeft = Math.max(0, Math.min(startLeft + deltaX, startLeft + startWidth - minWidth));
                nextWidth = startLeft + startWidth - nextLeft;
            }
            if (direction.includes('s')) {
                nextHeight = Math.max(minHeight, Math.min(startHeight + deltaY, maxBottom - startTop));
            }
            if (direction.includes('n')) {
                nextTop = Math.max(0, Math.min(startTop + deltaY, startTop + startHeight - minHeight));
                nextHeight = startTop + startHeight - nextTop;
            }

            windowElement.style.left = `${nextLeft}px`;
            windowElement.style.top = `${nextTop}px`;
            windowElement.style.width = `${nextWidth}px`;
            windowElement.style.height = `${nextHeight}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }
    
    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        // Remove active class from all windows
        this.windows.forEach((data, id) => {
            data.element.classList.remove('active');
        });
        
        // Add active class to focused window
        windowData.element.classList.add('active');
        windowData.element.style.zIndex = ++this.zIndexCounter;
        
        this.activeWindow = windowId;
        
        // Update taskbar
        const taskbarManager = this.taskbarManager || window.zarateXP?.taskbarManager;
        if (taskbarManager) {
            taskbarManager.setActiveProgram(windowId);
        }
    }
    
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMinimized) return;
        
        windowData.isMinimized = true;
        windowData.element.classList.add('minimizing');
        window.setTimeout(() => {
            if (windowData.isMinimized) {
                windowData.element.style.display = 'none';
                windowData.element.classList.remove('minimizing');
            }
        }, 140);
        
        // If this was the active window, focus the next available window
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
            // Find next available window
            for (const [id, data] of this.windows) {
                if (id !== windowId && !data.isMinimized) {
                    this.focusWindow(id);
                    break;
                }
            }
        }
        
        // Update taskbar
        const taskbarManager = this.taskbarManager || window.zarateXP?.taskbarManager;
        if (taskbarManager) {
            taskbarManager.minimizeProgram(windowId);
        }
        
        // Play sound
        const soundManager = this.soundManager || window.zarateXP?.soundManager;
        if (soundManager) {
            soundManager.play('minimize');
        }
    }
    
    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.isMinimized) return;
        
        windowData.isMinimized = false;
        windowData.element.style.display = 'flex';
        windowData.element.classList.add('restoring');
        window.setTimeout(() => windowData.element.classList.remove('restoring'), 160);
        
        this.focusWindow(windowId);
        
        // Update taskbar
        const taskbarManager = this.taskbarManager || window.zarateXP?.taskbarManager;
        if (taskbarManager) {
            taskbarManager.restoreProgram(windowId);
        }
        
        // Play sound
        const soundManager = this.soundManager || window.zarateXP?.soundManager;
        if (soundManager) {
            soundManager.play('maximize');
        }
    }
    
    toggleMaximize(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        if (windowData.isMaximized) {
            this.unmaximizeWindow(windowId);
        } else {
            this.maximizeWindow(windowId);
        }
    }
    
    maximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        // Store current position and size
        const rect = windowElement.getBoundingClientRect();
        windowData.previousPosition = {
            left: windowElement.style.left,
            top: windowElement.style.top
        };
        windowData.previousSize = {
            width: windowElement.style.width,
            height: windowElement.style.height
        };
        
        // Maximize
        windowElement.style.left = '0';
        windowElement.style.top = '0';
        windowElement.style.width = '100%';
        windowElement.style.height = `calc(100vh - ${this.getTaskbarHeight()}px)`;
        
        windowData.isMaximized = true;
        windowElement.classList.add('maximized');
        
        // Play sound
        const soundManager = this.soundManager || window.zarateXP?.soundManager;
        if (soundManager) {
            soundManager.play('maximize');
        }
    }
    
    unmaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        // Restore previous position and size
        if (windowData.previousPosition) {
            windowElement.style.left = windowData.previousPosition.left;
            windowElement.style.top = windowData.previousPosition.top;
        }
        if (windowData.previousSize) {
            windowElement.style.width = windowData.previousSize.width;
            windowElement.style.height = windowData.previousSize.height;
        }
        
        windowData.isMaximized = false;
        windowElement.classList.remove('maximized');
    }
    
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isClosing) return;
        windowData.isClosing = true;
        
        // Animate window close
        this.animateWindowClose(windowData.element).then(() => {
            // Remove from DOM
            windowData.element.remove();
            
            // Remove from windows map
            this.windows.delete(windowId);
            
            // Remove from taskbar
            const taskbarManager = this.taskbarManager || window.zarateXP?.taskbarManager;
            if (taskbarManager) {
                taskbarManager.removeProgram(windowId);
            }
            
            // Play sound
            const soundManager = this.soundManager || window.zarateXP?.soundManager;
            if (soundManager) {
                soundManager.play('minimize');
            }

            if (this.activeWindow === windowId) {
                this.activeWindow = null;
                const nextWindow = Array.from(this.windows.entries())
                    .reverse()
                    .find(([, data]) => !data.isMinimized && !data.isClosing);
                if (nextWindow) {
                    this.focusWindow(nextWindow[0]);
                }
            }
        });
    }
    
    toggleWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        if (windowData.isMinimized) {
            this.restoreWindow(windowId);
        } else if (this.activeWindow === windowId) {
            this.minimizeWindow(windowId);
        } else {
            this.focusWindow(windowId);
        }
    }
    
    getActiveWindow() {
        const data = this.windows.get(this.activeWindow);
        return data ? { id: this.activeWindow, ...data } : null;
    }
    
    animateWindowOpen(windowElement) {
        windowElement.style.transform = 'scale(0.9)';
        windowElement.style.opacity = '0';
        
        setTimeout(() => {
            windowElement.style.transition = 'all 0.2s ease-out';
            windowElement.style.transform = 'scale(1)';
            windowElement.style.opacity = '1';
        }, 10);
    }
    
    animateWindowClose(windowElement) {
        return new Promise(resolve => {
            windowElement.style.transition = 'all 0.2s ease-in';
            windowElement.style.transform = 'scale(0.9)';
            windowElement.style.opacity = '0';
            
            setTimeout(resolve, 200);
        });
    }
}

// Add window styles
const style = document.createElement('style');
style.textContent = `
    .resize-handle {
        position: absolute;
        background: transparent;
    }
    
    .resize-n {
        top: -3px;
        left: 3px;
        right: 3px;
        height: 6px;
        cursor: n-resize;
    }
    
    .resize-ne {
        top: -3px;
        right: -3px;
        width: 6px;
        height: 6px;
        cursor: ne-resize;
    }
    
    .resize-e {
        top: 3px;
        right: -3px;
        bottom: 3px;
        width: 6px;
        cursor: e-resize;
    }
    
    .resize-se {
        bottom: -3px;
        right: -3px;
        width: 6px;
        height: 6px;
        cursor: se-resize;
    }
    
    .resize-s {
        bottom: -3px;
        left: 3px;
        right: 3px;
        height: 6px;
        cursor: s-resize;
    }
    
    .resize-sw {
        bottom: -3px;
        left: -3px;
        width: 6px;
        height: 6px;
        cursor: sw-resize;
    }
    
    .resize-w {
        top: 3px;
        left: -3px;
        bottom: 3px;
        width: 6px;
        cursor: w-resize;
    }
    
    .resize-nw {
        top: -3px;
        left: -3px;
        width: 6px;
        height: 6px;
        cursor: nw-resize;
    }
    
    .window.maximized .resize-handle {
        display: none;
    }
    
    .title-bar-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        vertical-align: middle;
    }
`;
document.head.appendChild(style);

// Legacy support
window.WindowManager = WindowManager;
