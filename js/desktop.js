// Desktop Manager Module
export class DesktopManager {
    constructor() {
        this.desktop = document.querySelector('.desktop');
        this.iconsContainer = document.querySelector('.desktop-icons');
        this.selectionOverlay = document.querySelector('.selection-overlay');
        this.selectedIcons = new Set();
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        // v2 invalidates the old fixed-height coordinates that left a large
        // empty band above the taskbar on taller screens.
        this.iconPositionsKey = 'zarateXP.desktopIconPositions.v2';
        this.mobileLayoutQuery = window.matchMedia('(max-width: 768px)');
        this.contextMenu = null;
        this.refreshStatus = null;
        this.refreshTimer = 0;
        this.refreshHideTimer = 0;
        this.suppressBlankClick = false;
    }
    
    init() {
        this.setupIconHandlers();
        if (this.iconsContainer.clientHeight > 0) {
            this.applyIconPositions();
        }
        this.setupSelectionBox();
        this.setupContextMenu();
        
        // Listen for desktop ready event
        window.addEventListener('desktopReady', () => {
            this.applyIconPositions();
            this.animateIcons();
        });

        let resizeFrame = 0;
        window.addEventListener('resize', () => {
            window.cancelAnimationFrame(resizeFrame);
            resizeFrame = window.requestAnimationFrame(() => this.applyIconPositions());
        });

        // --real-vh is updated on a later animation frame. Observing the actual
        // icon canvas prevents the automatic grid from keeping the old height.
        if ('ResizeObserver' in window) {
            this.layoutResizeObserver = new ResizeObserver(() => {
                window.cancelAnimationFrame(resizeFrame);
                resizeFrame = window.requestAnimationFrame(() => this.applyIconPositions());
            });
            this.layoutResizeObserver.observe(this.iconsContainer);
        }
    }
    
    setupIconHandlers() {
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        
        icons.forEach(icon => {
            icon.setAttribute('role', 'button');
            icon.setAttribute('tabindex', '0');
            icon.setAttribute('aria-label', icon.textContent.trim());

            // Click handler
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (Number(icon.dataset.lastTouchOpen || 0) > Date.now() - 700) return;
                if (icon.dataset.wasDragged === 'true') {
                    icon.dataset.wasDragged = 'false';
                    return;
                }
                
                if (!e.ctrlKey && !e.metaKey) {
                    this.clearSelection();
                }
                
                this.selectIcon(icon);
            });
            
            // Double click handler
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (icon.dataset.wasDragged === 'true') return;
                this.openIcon(icon);
            });

            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openIcon(icon);
                }

                if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                    e.preventDefault();
                    const rect = icon.getBoundingClientRect();
                    this.showContextMenu(rect.left + 16, rect.top + 16, icon);
                }
            });
            
            // En pantallas táctiles un toque abre, como espera una interfaz móvil moderna.
            icon.addEventListener('touchend', (e) => {
                if (!this.isMobileLayout() && !window.matchMedia('(pointer: coarse)').matches) return;
                e.preventDefault();
                e.stopPropagation();
                this.clearSelection();
                this.selectIcon(icon);
                icon.dataset.lastTouchOpen = String(Date.now());
                this.openIcon(icon);
            });
            
            this.setupIconDrag(icon);
        });
        
        // A short click on an empty area opens the desktop actions menu. Dragging
        // still creates the familiar selection box without opening the menu.
        this.desktop.addEventListener('click', (event) => {
            if (!this.isBlankDesktopTarget(event.target)) return;
            this.clearSelection();
            if (this.suppressBlankClick) {
                this.suppressBlankClick = false;
                return;
            }

            event.stopPropagation();
            this.showContextMenu(event.clientX, event.clientY);
        });
    }
    
    setupIconDrag(icon) {
        let isDragging = false;
        let isPotentialDrag = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;
        
        icon.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            if (this.isMobileLayout()) return;
            
            isPotentialDrag = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseFloat(icon.style.left) || 0;
            initialY = parseFloat(icon.style.top) || 0;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isPotentialDrag && !isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            if (!isDragging && Math.hypot(deltaX, deltaY) < 6) return;

            if (!isDragging) {
                isDragging = true;
                icon.classList.add('dragging');
                icon.style.zIndex = '1000';
                this.clearSelection();
                this.selectIcon(icon);
            }

            e.preventDefault();

            const maxX = this.iconsContainer.clientWidth - icon.offsetWidth - 8;
            const maxY = this.iconsContainer.clientHeight - icon.offsetHeight - 8;
            const nextX = Math.min(Math.max(initialX + deltaX, 8), Math.max(8, maxX));
            const nextY = Math.min(Math.max(initialY + deltaY, 8), Math.max(8, maxY));

            icon.style.left = `${nextX}px`;
            icon.style.top = `${nextY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (!isPotentialDrag && !isDragging) return;
            isPotentialDrag = false;

            if (!isDragging) return;
            isDragging = false;
            icon.classList.remove('dragging');
            
            // Snap to grid
            const metrics = this.getIconGridMetrics();
            const currentX = parseFloat(icon.style.left) || 0;
            const currentY = parseFloat(icon.style.top) || 0;
            const snappedX = Math.round((currentX - metrics.padding) / metrics.columnWidth) * metrics.columnWidth + metrics.padding;
            const snappedY = Math.round((currentY - metrics.padding) / metrics.rowHeight) * metrics.rowHeight + metrics.padding;
            const maxX = this.iconsContainer.clientWidth - icon.offsetWidth - 8;
            const maxY = this.iconsContainer.clientHeight - icon.offsetHeight - 8;

            icon.style.left = `${Math.min(Math.max(snappedX, 8), Math.max(8, maxX))}px`;
            icon.style.top = `${Math.min(Math.max(snappedY, 8), Math.max(8, maxY))}px`;
            icon.style.zIndex = '';
            icon.dataset.wasDragged = 'true';
            window.setTimeout(() => {
                icon.dataset.wasDragged = 'false';
            }, 0);
            this.saveIconPositions();
        });
    }

    openIcon(icon) {
        const programName = icon?.getAttribute('data-program-name');
        if (programName && window.zarateXP?.appManager) {
            window.zarateXP.appManager.openApp(programName);
        }
    }

    getIconGridMetrics() {
        const scale = parseFloat(getComputedStyle(this.iconsContainer).getPropertyValue('--icon-scale')) || 1;
        const isMobile = this.isMobileLayout();
        const desktopIcons = Array.from(this.iconsContainer.querySelectorAll('.desktop-icon'));
        const measuredIconHeight = desktopIcons[0]?.offsetHeight || Math.round(92 * scale);
        const padding = 12;
        const fittingRows = Math.max(1, Math.floor((this.iconsContainer.clientHeight - (padding * 2)) / measuredIconHeight));
        const desktopRows = Math.min(5, Math.max(1, desktopIcons.length), fittingRows);
        const availableRowTravel = Math.max(0, this.iconsContainer.clientHeight - (padding * 2) - measuredIconHeight);

        return {
            padding,
            columnWidth: Math.round((isMobile ? 110 : 102) * scale),
            rowHeight: isMobile || desktopRows <= 1
                ? Math.round((isMobile ? 118 : 102) * scale)
                : availableRowTravel / (desktopRows - 1),
            desktopRows,
            measuredIconHeight
        };
    }

    isMobileLayout() {
        return this.mobileLayoutQuery.matches;
    }

    isBlankDesktopTarget(target) {
        return target === this.desktop || target === this.iconsContainer;
    }

    getLayoutIcons() {
        const icons = Array.from(this.iconsContainer.querySelectorAll('.desktop-icon'));
        if (!this.isMobileLayout()) return icons;

        return icons
            .filter((icon) => icon.dataset.mobileHome === 'true')
            .sort((left, right) => Number(left.dataset.mobileOrder) - Number(right.dataset.mobileOrder));
    }

    applyMobileIconPositions() {
        const icons = this.getLayoutIcons();
        const metrics = this.getIconGridMetrics();
        const fittingRows = Math.max(1, Math.floor((this.iconsContainer.clientHeight - metrics.padding) / metrics.rowHeight));
        const maxRows = Math.min(5, fittingRows);

        icons.forEach((icon, index) => {
            const column = Math.floor(index / maxRows);
            const row = index % maxRows;
            const maxX = this.iconsContainer.clientWidth - icon.offsetWidth - 8;
            const maxY = this.iconsContainer.clientHeight - icon.offsetHeight - 8;
            const x = metrics.padding + column * metrics.columnWidth;
            const y = metrics.padding + row * metrics.rowHeight;

            icon.style.left = `${Math.min(x, Math.max(8, maxX))}px`;
            icon.style.top = `${Math.min(y, Math.max(8, maxY))}px`;
            icon.style.position = 'absolute';
        });
    }

    applyIconPositions() {
        if (this.isMobileLayout()) {
            this.applyMobileIconPositions();
            return;
        }

        const icons = Array.from(this.iconsContainer.querySelectorAll('.desktop-icon'));
        const saved = this.readIconPositions();
        const metrics = this.getIconGridMetrics();
        const maxRows = metrics.desktopRows;
        const savedLayout = saved.__layout;

        icons.forEach((icon, index) => {
            const key = icon.dataset.programName;
            const savedPosition = saved[key];
            const defaultX = metrics.padding + Math.floor(index / maxRows) * metrics.columnWidth;
            const defaultY = metrics.padding + (index % maxRows) * metrics.rowHeight;
            const maxX = this.iconsContainer.clientWidth - icon.offsetWidth - 8;
            const maxY = this.iconsContainer.clientHeight - icon.offsetHeight - 8;
            const hasSavedPosition = Number.isFinite(savedPosition?.x) && Number.isFinite(savedPosition?.y);
            let x = hasSavedPosition ? savedPosition.x : defaultX;
            let y = hasSavedPosition ? savedPosition.y : defaultY;

            // Scale user-arranged positions when the desktop changes size so
            // their relationship with the taskbar is preserved.
            if (hasSavedPosition && Number.isFinite(savedLayout?.width) && Number.isFinite(savedLayout?.height)) {
                const previousMaxX = Math.max(8, savedLayout.width - icon.offsetWidth - 8);
                const previousMaxY = Math.max(8, savedLayout.height - icon.offsetHeight - 8);
                const xRatio = previousMaxX > 8 ? (savedPosition.x - 8) / (previousMaxX - 8) : 0;
                const yRatio = previousMaxY > 8 ? (savedPosition.y - 8) / (previousMaxY - 8) : 0;
                x = 8 + Math.min(1, Math.max(0, xRatio)) * Math.max(0, maxX - 8);
                y = 8 + Math.min(1, Math.max(0, yRatio)) * Math.max(0, maxY - 8);
            }

            icon.style.left = `${Math.min(Math.max(x, 8), Math.max(8, maxX))}px`;
            icon.style.top = `${Math.min(Math.max(y, 8), Math.max(8, maxY))}px`;
            icon.style.position = 'absolute';
        });
    }

    saveIconPositions() {
        if (this.isMobileLayout()) return;

        const positions = {
            __layout: {
                width: this.iconsContainer.clientWidth,
                height: this.iconsContainer.clientHeight
            }
        };
        this.iconsContainer.querySelectorAll('.desktop-icon').forEach((icon) => {
            positions[icon.dataset.programName] = {
                x: Math.round(parseFloat(icon.style.left) || 0),
                y: Math.round(parseFloat(icon.style.top) || 0)
            };
        });

        try {
            localStorage.setItem(this.iconPositionsKey, JSON.stringify(positions));
        } catch (error) {
            console.warn('No se pudo guardar la posicion de iconos', error);
        }
    }

    readIconPositions() {
        try {
            return JSON.parse(localStorage.getItem(this.iconPositionsKey) || '{}');
        } catch (error) {
            return {};
        }
    }
    
    setupSelectionBox() {
        let isSelecting = false;
        let selectionMoved = false;
        let startX = 0;
        let startY = 0;
        
        this.desktop.addEventListener('mousedown', (e) => {
            if (e.target !== this.desktop && !e.target.classList.contains('desktop-icons')) return;
            if (e.button !== 0) return; // Only left click
            
            isSelecting = true;
            selectionMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            
            this.selectionOverlay.style.display = 'block';
            this.selectionOverlay.style.left = startX + 'px';
            this.selectionOverlay.style.top = startY + 'px';
            this.selectionOverlay.style.width = '0';
            this.selectionOverlay.style.height = '0';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;
            
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            if (Math.hypot(width, height) >= 6) selectionMoved = true;
            
            this.selectionOverlay.style.left = left + 'px';
            this.selectionOverlay.style.top = top + 'px';
            this.selectionOverlay.style.width = width + 'px';
            this.selectionOverlay.style.height = height + 'px';
            
            // Check which icons are in the selection box
            this.updateSelection();
        });
        
        document.addEventListener('mouseup', () => {
            if (!isSelecting) return;
            
            isSelecting = false;
            this.selectionOverlay.style.display = 'none';
            if (selectionMoved) {
                this.suppressBlankClick = true;
                window.setTimeout(() => {
                    this.suppressBlankClick = false;
                }, 0);
            }
        });
    }
    
    updateSelection() {
        const selectionRect = this.selectionOverlay.getBoundingClientRect();
        const icons = this.getLayoutIcons();
        
        icons.forEach(icon => {
            const iconRect = icon.getBoundingClientRect();
            
            if (this.rectsIntersect(selectionRect, iconRect)) {
                this.selectIcon(icon);
            } else if (!this.selectedIcons.has(icon)) {
                icon.classList.remove('selected');
            }
        });
    }
    
    rectsIntersect(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    selectIcon(icon) {
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }
    
    clearSelection() {
        this.selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
        this.selectedIcons.clear();
    }
    
    setupContextMenu() {
        this.refreshStatus = document.createElement('div');
        this.refreshStatus.className = 'desktop-refresh-status';
        this.refreshStatus.setAttribute('role', 'status');
        this.refreshStatus.setAttribute('aria-live', 'polite');
        this.refreshStatus.hidden = true;
        this.refreshStatus.innerHTML = `
            <img src="./assets/images/xp-small-icons/restart.png" alt="" width="22" height="22">
            <span>Actualizando escritorio...</span>
        `;
        this.desktop.appendChild(this.refreshStatus);

        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu xp-context-menu';
        this.contextMenu.setAttribute('role', 'menu');
        this.contextMenu.setAttribute('aria-label', 'Acciones del escritorio');
        this.contextMenu.setAttribute('aria-hidden', 'true');
        this.contextMenu.innerHTML = `
            <button type="button" role="menuitem" class="context-menu-item context-menu-open" data-context-only="icon" data-context-action="open">Abrir</button>
            <div class="context-menu-separator" role="separator" data-context-only="icon"></div>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="arrange">Organizar iconos</button>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="toggle-icons"><span data-context-label="toggle-icons">Ocultar iconos del escritorio</span></button>
            <button type="button" role="menuitem" class="context-menu-item context-menu-refresh" data-context-action="refresh">Actualizar</button>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="reset-icons">Restaurar posiciones</button>
            <div class="context-menu-separator" role="separator"></div>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="documents">Mis Documentos</button>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="projects">Mis Proyectos</button>
            <div class="context-menu-separator" role="separator"></div>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="personalize">Personalizar...</button>
            <button type="button" role="menuitem" class="context-menu-item" data-context-action="properties">Propiedades</button>
        `;
        document.body.appendChild(this.contextMenu);

        this.contextMenu.addEventListener('click', (event) => {
            const item = event.target.closest('[data-context-action]');
            if (!item || item.disabled) return;
            this.runContextAction(item.dataset.contextAction, this.contextMenu.contextIcon);
            this.hideContextMenu();
        });

        this.contextMenu.addEventListener('keydown', (event) => {
            const items = Array.from(this.contextMenu.querySelectorAll('[role="menuitem"]'))
                .filter((item) => !item.hidden && !item.disabled);
            const currentIndex = items.indexOf(document.activeElement);
            let nextIndex = currentIndex;
            if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
            if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = items.length - 1;
            if (nextIndex !== currentIndex) {
                event.preventDefault();
                items[nextIndex]?.focus();
            }
        });

        this.desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const icon = e.target.closest('.desktop-icon');
            this.clearSelection();
            if (icon) {
                this.selectIcon(icon);
            }
            this.showContextMenu(e.clientX, e.clientY, icon);
        });

        this.desktop.addEventListener('keydown', (event) => {
            if (!this.isBlankDesktopTarget(event.target)) return;
            if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
            event.preventDefault();
            this.showContextMenu(18, 18, null, { focusMenu: true });
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.xp-context-menu')) this.hideContextMenu();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hideContextMenu();
        });
    }

    showContextMenu(clientX, clientY, icon = null, { focusMenu = false } = {}) {
        if (!this.contextMenu) return;
        this.contextMenu.contextIcon = icon;
        this.contextMenu.dataset.contextScope = icon ? 'icon' : 'desktop';
        this.contextMenu.querySelectorAll('[data-context-only="icon"]').forEach((item) => {
            item.hidden = !icon;
        });
        const openItem = this.contextMenu.querySelector('[data-context-action="open"]');
        openItem.disabled = !icon;
        openItem.classList.toggle('disabled', !icon);

        const toggleLabel = this.contextMenu.querySelector('[data-context-label="toggle-icons"]');
        const iconsHidden = window.zarateXP?.appManager?.getPersonalizationSettings()?.showDesktopIcons === false;
        const label = iconsHidden ? 'Mostrar iconos del escritorio' : 'Ocultar iconos del escritorio';
        toggleLabel.textContent = window.zarateXP?.i18nManager?.t(label) || label;

        this.contextMenu.style.display = 'block';
        this.contextMenu.setAttribute('aria-hidden', 'false');
        const rect = this.contextMenu.getBoundingClientRect();
        const left = Math.min(clientX, window.innerWidth - rect.width - 8);
        const top = Math.min(clientY, window.innerHeight - rect.height - 8);
        this.contextMenu.style.left = `${Math.max(4, left)}px`;
        this.contextMenu.style.top = `${Math.max(4, top)}px`;
        if (focusMenu) {
            this.contextMenu.querySelector('[role="menuitem"]:not([hidden]):not(:disabled)')?.focus();
        }
    }

    hideContextMenu() {
        if (!this.contextMenu) return;
        this.contextMenu.style.display = 'none';
        this.contextMenu.setAttribute('aria-hidden', 'true');
        this.contextMenu.contextIcon = null;
    }

    runContextAction(action, icon) {
        const appManager = window.zarateXP?.appManager;
        const openProgram = (programName) => appManager?.openApp(programName);

        if (action === 'open' && icon?.dataset.programName) openProgram(icon.dataset.programName);
        if (action === 'arrange') this.arrangeIcons();
        if (action === 'refresh') this.refreshDesktop();
        if (action === 'toggle-icons' && appManager) {
            const settings = appManager.getPersonalizationSettings();
            appManager.savePersonalizationSettings({
                ...settings,
                showDesktopIcons: settings.showDesktopIcons === false
            });
            this.clearSelection();
        }
        if (action === 'reset-icons') {
            if (!this.isMobileLayout()) localStorage.removeItem(this.iconPositionsKey);
            this.applyIconPositions();
        }
        if (action === 'documents') openProgram('documents');
        if (action === 'projects') openProgram('projects');
        if (action === 'personalize') openProgram('control-panel');
        if (action === 'properties') openProgram('system-properties');
    }
    
    animateIcons() {
        const icons = this.getLayoutIcons();
        icons.forEach((icon, index) => {
            icon.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    // Public methods
    refreshDesktop() {
        this.clearSelection();
        window.clearTimeout(this.refreshTimer);
        window.clearTimeout(this.refreshHideTimer);

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            || document.body.classList.contains('xp-no-animations');
        const duration = reduceMotion ? 80 : 520;
        const statusText = this.refreshStatus?.querySelector('span');
        if (statusText) {
            const label = 'Actualizando escritorio...';
            statusText.textContent = window.zarateXP?.i18nManager?.t(label) || label;
        }
        if (this.refreshStatus) this.refreshStatus.hidden = false;

        this.desktop.classList.remove('is-refreshing');
        void this.desktop.offsetWidth;
        this.desktop.classList.add('is-refreshing');
        this.iconsContainer.setAttribute('aria-busy', 'true');
        window.requestAnimationFrame(() => this.applyIconPositions());

        this.refreshTimer = window.setTimeout(() => {
            this.desktop.classList.remove('is-refreshing');
            this.iconsContainer.removeAttribute('aria-busy');
            if (statusText) {
                const label = 'Escritorio actualizado';
                statusText.textContent = window.zarateXP?.i18nManager?.t(label) || label;
            }
            window.dispatchEvent(new CustomEvent('zaratexp:desktoprefreshed'));
            this.refreshHideTimer = window.setTimeout(() => {
                if (this.refreshStatus) this.refreshStatus.hidden = true;
            }, reduceMotion ? 120 : 650);
        }, duration);
    }
    
    changeWallpaper(imagePath) {
        this.desktop.style.backgroundImage = `url(${imagePath})`;
    }
    
    arrangeIcons() {
        if (this.isMobileLayout()) {
            this.applyMobileIconPositions();
            return;
        }

        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        const metrics = this.getIconGridMetrics();
        const maxRows = metrics.desktopRows;
        let row = 0;
        let col = 0;
        
        icons.forEach(icon => {
            icon.style.position = 'absolute';
            icon.style.left = (metrics.padding + col * metrics.columnWidth) + 'px';
            icon.style.top = (metrics.padding + row * metrics.rowHeight) + 'px';
            
            row++;
            if (row >= maxRows) {
                row = 0;
                col++;
            }
        });
        this.saveIconPositions();
    }
}

// Legacy support
window.DesktopManager = DesktopManager;
