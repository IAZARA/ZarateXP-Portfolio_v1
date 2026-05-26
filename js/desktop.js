// Desktop Manager Module
export class DesktopManager {
    constructor() {
        this.desktop = document.querySelector('.desktop');
        this.iconsContainer = document.querySelector('.desktop-icons');
        this.selectionOverlay = document.querySelector('.selection-overlay');
        this.selectedIcons = new Set();
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.iconPositionsKey = 'zarateXP.desktopIconPositions';
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

        window.addEventListener('resize', () => {
            this.applyIconPositions();
        });
    }
    
    setupIconHandlers() {
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        
        icons.forEach(icon => {
            // Click handler
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
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
                const programName = icon.getAttribute('data-program-name');
                
                if (programName && window.zarateXP?.appManager) {
                    window.zarateXP.appManager.openApp(programName);
                }
            });
            
            // Touch support for mobile devices
            let touchStartTime = 0;
            let touchTimeout;
            
            icon.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevenir comportamiento por defecto del navegador
                const now = Date.now();
                const timeSinceLastTouch = now - touchStartTime;
                
                // Si han pasado menos de 300ms desde el último toque, es un doble tap
                if (timeSinceLastTouch < 300 && timeSinceLastTouch > 0) {
                    // Doble tap - abrir programa
                    clearTimeout(touchTimeout);
                    const programName = icon.getAttribute('data-program-name');
                    
                    if (programName && window.zarateXP?.appManager) {
                        window.zarateXP.appManager.openApp(programName);
                    }
                    touchStartTime = 0;
                } else {
                    // Single tap - seleccionar icono
                    touchStartTime = now;
                    
                    // Limpiar selección anterior si no es multiselección
                    if (!e.ctrlKey && !e.metaKey) {
                        this.clearSelection();
                    }
                    
                    this.selectIcon(icon);
                    
                    // Configurar timeout para resetear el contador de toques
                    touchTimeout = setTimeout(() => {
                        touchStartTime = 0;
                    }, 300);
                }
            });
            
            this.setupIconDrag(icon);
        });
        
        // Desktop click to clear selection
        this.desktop.addEventListener('click', () => {
            this.clearSelection();
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

    getIconGridMetrics() {
        const scale = parseFloat(getComputedStyle(this.iconsContainer).getPropertyValue('--icon-scale')) || 1;
        return {
            padding: 12,
            columnWidth: Math.round(102 * scale),
            rowHeight: Math.round(102 * scale)
        };
    }

    applyIconPositions() {
        const icons = Array.from(this.iconsContainer.querySelectorAll('.desktop-icon'));
        const saved = this.readIconPositions();
        const metrics = this.getIconGridMetrics();
        const maxRows = Math.max(1, Math.floor((this.iconsContainer.clientHeight - metrics.padding) / metrics.rowHeight));

        icons.forEach((icon, index) => {
            const key = icon.dataset.programName;
            const savedPosition = saved[key];
            const defaultX = metrics.padding + Math.floor(index / maxRows) * metrics.columnWidth;
            const defaultY = metrics.padding + (index % maxRows) * metrics.rowHeight;
            const x = Number.isFinite(savedPosition?.x) ? savedPosition.x : defaultX;
            const y = Number.isFinite(savedPosition?.y) ? savedPosition.y : defaultY;
            const maxX = this.iconsContainer.clientWidth - 92;
            const maxY = this.iconsContainer.clientHeight - 96;

            icon.style.left = `${Math.min(Math.max(x, 8), Math.max(8, maxX))}px`;
            icon.style.top = `${Math.min(Math.max(y, 8), Math.max(8, maxY))}px`;
            icon.style.position = 'absolute';
        });
    }

    saveIconPositions() {
        const positions = {};
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
        let startX = 0;
        let startY = 0;
        
        this.desktop.addEventListener('mousedown', (e) => {
            if (e.target !== this.desktop && !e.target.classList.contains('desktop-icons')) return;
            if (e.button !== 0) return; // Only left click
            
            isSelecting = true;
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
        });
    }
    
    updateSelection() {
        const selectionRect = this.selectionOverlay.getBoundingClientRect();
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        
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
        this.desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // TODO: Show context menu
        });
    }
    
    animateIcons() {
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        icons.forEach((icon, index) => {
            icon.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    // Public methods
    refreshDesktop() {
        // Refresh desktop icons
        this.clearSelection();
    }
    
    changeWallpaper(imagePath) {
        this.desktop.style.backgroundImage = `url(${imagePath})`;
    }
    
    arrangeIcons() {
        const icons = this.iconsContainer.querySelectorAll('.desktop-icon');
        const metrics = this.getIconGridMetrics();
        const maxRows = Math.max(1, Math.floor((this.iconsContainer.clientHeight - metrics.padding) / metrics.rowHeight));
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
