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

    prefersReducedMotion() {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
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
        const availableWidth = Math.max(200, globalThis.innerWidth - 16);
        const availableHeight = Math.max(150, globalThis.innerHeight - this.getTaskbarHeight() - 16);
        const renderedWidth = Math.min(width, availableWidth);
        const renderedHeight = Math.min(height, availableHeight);
        windowElement.style.width = renderedWidth + 'px';
        windowElement.style.height = renderedHeight + 'px';
        
        // Position window
        if (x !== null && y !== null) {
            windowElement.style.left = x + 'px';
            windowElement.style.top = y + 'px';
        } else {
            // Center window
            windowElement.style.left = Math.max(8, (globalThis.innerWidth - renderedWidth) / 2) + 'px';
            windowElement.style.top = Math.max(8, (globalThis.innerHeight - renderedHeight - this.getTaskbarHeight()) / 2) + 'px';
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
                    ${minimizable ? '<button class="minimize-btn" type="button" aria-label="Minimizar" title="Minimizar"><span class="window-control-glyph" aria-hidden="true"></span></button>' : ''}
                    ${maximizable ? '<button class="maximize-btn" type="button" aria-label="Maximizar" title="Maximizar"><span class="window-control-glyph" aria-hidden="true"></span></button>' : ''}
                    ${closable ? '<button class="close-btn" type="button" aria-label="Cerrar" title="Cerrar"><span class="window-control-glyph" aria-hidden="true"></span></button>' : ''}
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
            
            windowElement.classList.add('dragging');
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
            windowElement.classList.remove('dragging');
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
            windowElement.classList.add('resizing');
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
            const windowData = this.windows.get(windowId);
            windowData?.element.classList.remove('resizing');
            isResizing = false;
        });
    }
    
    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        const wasActive = this.activeWindow === windowId;
        
        // Remove active class from all windows
        this.windows.forEach((data, id) => {
            data.element.classList.remove('active');
        });
        
        // Add active class to focused window
        windowData.element.classList.add('active');
        windowData.element.style.zIndex = ++this.zIndexCounter;
        if (!wasActive && !this.prefersReducedMotion()) {
            windowData.element.classList.remove('focus-pulse');
            window.requestAnimationFrame(() => windowData.element.classList.add('focus-pulse'));
            window.setTimeout(() => windowData.element.classList.remove('focus-pulse'), 280);
        }
        
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
        if (this.prefersReducedMotion()) {
            windowData.element.style.display = 'none';
        } else {
            const taskbarButton = (this.taskbarManager || window.zarateXP?.taskbarManager)?.openPrograms?.get(windowId);
            const windowRect = windowData.element.getBoundingClientRect();
            const targetRect = taskbarButton?.getBoundingClientRect();
            const targetX = targetRect
                ? targetRect.left + targetRect.width / 2 - (windowRect.left + windowRect.width / 2)
                : 0;
            const targetY = targetRect
                ? targetRect.top + targetRect.height / 2 - (windowRect.top + windowRect.height / 2)
                : globalThis.innerHeight - windowRect.bottom;
            const scaleX = targetRect ? Math.max(0.12, Math.min(0.42, targetRect.width / windowRect.width)) : 0.3;
            const scaleY = targetRect ? Math.max(0.08, Math.min(0.18, targetRect.height / windowRect.height)) : 0.12;

            windowData.motionAnimation?.cancel();
            windowData.element.classList.add('minimizing');
            windowData.motionAnimation = windowData.element.animate([
                { opacity: 1, transform: 'translate(0, 0) scale(1)' },
                { opacity: 0.25, transform: `translate(${targetX}px, ${targetY}px) scale(${scaleX}, ${scaleY})` }
            ], {
                duration: 220,
                easing: 'cubic-bezier(0.4, 0, 0.7, 0.2)',
                fill: 'forwards'
            });
            windowData.motionAnimation.finished.catch(() => {}).then(() => {
                if (windowData.isMinimized) windowData.element.style.display = 'none';
                windowData.element.classList.remove('minimizing');
                windowData.motionAnimation?.cancel();
                windowData.motionAnimation = null;
            });
        }
        
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
        if (!this.prefersReducedMotion()) {
            const taskbarButton = (this.taskbarManager || window.zarateXP?.taskbarManager)?.openPrograms?.get(windowId);
            const windowRect = windowData.element.getBoundingClientRect();
            const sourceRect = taskbarButton?.getBoundingClientRect();
            const sourceX = sourceRect
                ? sourceRect.left + sourceRect.width / 2 - (windowRect.left + windowRect.width / 2)
                : 0;
            const sourceY = sourceRect
                ? sourceRect.top + sourceRect.height / 2 - (windowRect.top + windowRect.height / 2)
                : 24;
            const scaleX = sourceRect ? Math.max(0.12, Math.min(0.42, sourceRect.width / windowRect.width)) : 0.3;
            const scaleY = sourceRect ? Math.max(0.08, Math.min(0.18, sourceRect.height / windowRect.height)) : 0.12;

            windowData.motionAnimation?.cancel();
            windowData.element.classList.add('restoring');
            windowData.motionAnimation = windowData.element.animate([
                { opacity: 0.3, transform: `translate(${sourceX}px, ${sourceY}px) scale(${scaleX}, ${scaleY})` },
                { opacity: 1, transform: 'translate(0, 0) scale(1)' }
            ], {
                duration: 240,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });
            windowData.motionAnimation.finished.catch(() => {}).then(() => {
                windowData.element.classList.remove('restoring');
                windowData.motionAnimation = null;
            });
        }
        
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
        windowData.previousPosition = {
            left: windowElement.style.left,
            top: windowElement.style.top
        };
        windowData.previousSize = {
            width: windowElement.style.width,
            height: windowElement.style.height
        };
        
        const firstRect = windowElement.getBoundingClientRect();

        // Maximize
        windowElement.style.left = '0';
        windowElement.style.top = '0';
        windowElement.style.width = '100%';
        windowElement.style.height = `calc((var(--real-vh, 1vh) * 100) - ${this.getTaskbarHeight()}px)`;
        
        windowData.isMaximized = true;
        windowElement.classList.add('maximized');
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        maximizeBtn?.setAttribute('aria-label', 'Restaurar');
        maximizeBtn?.setAttribute('title', 'Restaurar');
        this.animateWindowGeometry(windowData, firstRect);
        
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
        
        const firstRect = windowElement.getBoundingClientRect();

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
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        maximizeBtn?.setAttribute('aria-label', 'Maximizar');
        maximizeBtn?.setAttribute('title', 'Maximizar');
        this.animateWindowGeometry(windowData, firstRect);
    }

    animateWindowGeometry(windowData, firstRect) {
        if (this.prefersReducedMotion()) return;
        const windowElement = windowData.element;
        const lastRect = windowElement.getBoundingClientRect();
        if (!lastRect.width || !lastRect.height) return;

        const deltaX = firstRect.left - lastRect.left;
        const deltaY = firstRect.top - lastRect.top;
        const scaleX = firstRect.width / lastRect.width;
        const scaleY = firstRect.height / lastRect.height;

        windowData.geometryAnimation?.cancel();
        windowElement.classList.add('geometry-transitioning');
        windowData.geometryAnimation = windowElement.animate([
            { transformOrigin: 'top left', transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})` },
            { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1)' }
        ], {
            duration: 230,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        windowData.geometryAnimation.finished.catch(() => {}).then(() => {
            windowElement.classList.remove('geometry-transitioning');
            windowData.geometryAnimation = null;
        });
    }
    
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isClosing) return;
        windowData.isClosing = true;
        windowData.motionAnimation?.cancel();
        windowData.geometryAnimation?.cancel();
        windowData.element.classList.remove('minimizing', 'restoring', 'geometry-transitioning');
        
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
        if (this.prefersReducedMotion()) {
            windowElement.style.transition = 'none';
            windowElement.style.transform = 'none';
            windowElement.style.opacity = '1';
            return;
        }

        windowElement.style.transition = 'none';
        windowElement.style.transform = 'translateY(14px) scale(0.94)';
        windowElement.style.opacity = '0';

        window.requestAnimationFrame(() => {
            windowElement.style.transition = 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
            windowElement.style.transform = 'translateY(0) scale(1)';
            windowElement.style.opacity = '1';
        });
    }
    
    animateWindowClose(windowElement) {
        return new Promise(resolve => {
            if (this.prefersReducedMotion()) {
                resolve();
                return;
            }

            windowElement.style.transition = 'opacity 170ms cubic-bezier(0.7, 0, 0.84, 0), transform 170ms cubic-bezier(0.7, 0, 0.84, 0)';
            windowElement.style.transformOrigin = 'center bottom';
            windowElement.style.transform = 'translateY(16px) scale(0.92)';
            windowElement.style.opacity = '0';
            
            setTimeout(resolve, 180);
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
