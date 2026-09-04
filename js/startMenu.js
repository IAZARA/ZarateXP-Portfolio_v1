// Start Menu Manager Module
export class StartMenuManager {
    constructor() {
        this.startMenu = document.querySelector('.startmenu');
        this.allProgramsMenu = document.querySelector('.all-programs-menu');
        this.isOpen = false;
        this.currentSubmenu = null;
        this.closeTimer = null;
        this.activeCategory = '';
        this.searchInput = document.getElementById('app-search-input');
    }
    
    init() {
        this.startMenu.insertBefore(this.allProgramsMenu, this.startMenu.querySelector('.start-menu-footer'));
        this.setupMenuItems();
        this.setupSubmenus();
        this.setupFooterButtons();
        this.setupKeyboardNavigation();
        this.setupAppSearch();
        this.restoreRecentPrograms();
    }
    
    prepareInteractiveItem(element, options = {}) {
        const { disabled = false, expanded = null, hasPopup = null } = options;
        // Adjacent text already names the action; don't repeat it via the icon.
        element.querySelectorAll('img').forEach((icon) => {
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
        });
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', disabled ? '-1' : '0');
        element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        if (hasPopup) element.setAttribute('aria-haspopup', hasPopup);
        if (expanded !== null) element.setAttribute('aria-expanded', String(expanded));
    }

    // Helper para agregar eventos de click, touch y teclado
    addClickAndTouchEvent(element, handler) {
        element.addEventListener('click', handler);
        // Native click also handles touch without launching when a list is scrolled.
        element.addEventListener('keydown', (e) => {
            if (element.tagName === 'BUTTON') return;
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            handler(e);
        });
    }
    
    setupMenuItems() {
        // Handle all menu items
        const menuItems = this.startMenu.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const isDisabled = item.classList.contains('disabled');
            const action = item.getAttribute('data-action');
            this.prepareInteractiveItem(item, {
                disabled: isDisabled,
                hasPopup: action === 'open-category' ? 'menu' : null,
                expanded: action === 'open-category' ? false : null
            });
            if (action === 'open-category') item.setAttribute('aria-controls', 'programs-submenu');
            if (isDisabled) return;
            
            this.addClickAndTouchEvent(item, (e) => {
                e.stopPropagation();
                
                const programName = item.getAttribute('data-program-name');
                const url = item.getAttribute('data-url');
                
                if (action === 'open-program' && programName) {
                    this.openProgram(programName);
                } else if (action === 'open-url' && url) {
                    this.openUrl(url);
                } else if (action === 'toggle-all-programs') {
                    this.toggleAllPrograms();
                } else if (action === 'open-category') {
                    this.searchInput.value = '';
                    if (this.currentSubmenu && this.activeCategory === item.dataset.category) this.hideAllSubmenus();
                    else this.openLibrary(item.dataset.category);
                } else if (action === 'open-search') {
                    this.openSearch();
                }
            });
        });
        
        // All programs button
        const allProgramsBtn = document.getElementById('menu-all-programs');
        if (allProgramsBtn) {
            this.prepareInteractiveItem(allProgramsBtn, { hasPopup: 'menu', expanded: false });
            this.addClickAndTouchEvent(allProgramsBtn, (e) => {
                e.stopPropagation();
                this.toggleAllPrograms();
            });
        }
    }
    
    setupSubmenus() {
        // All Programs Menu
        if (!this.allProgramsMenu) return;
        const allProgramsItems = this.allProgramsMenu.querySelectorAll('.all-programs-item');
        allProgramsItems.forEach(item => {
            const isDisabled = item.classList.contains('disabled');
            this.prepareInteractiveItem(item, { disabled: isDisabled });
            if (isDisabled) return;
            
            this.addClickAndTouchEvent(item, (e) => {
                e.stopPropagation();
                
                const action = item.getAttribute('data-action');
                const programName = item.getAttribute('data-program-name');
                const url = item.getAttribute('data-url');
                
                if (action === 'open-program' && programName) {
                    this.openProgram(programName);
                } else if (action === 'open-url' && url) {
                    this.openUrl(url);
                }
            });
        });
        
        this.allProgramsMenu.querySelector('[data-library-back]').addEventListener('click', () => {
            this.searchInput.value = '';
            this.hideAllSubmenus();
            document.getElementById('menu-all-programs')?.focus();
        });
    }

    setupKeyboardNavigation() {
        const moveFocus = (event, scope, selector) => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            const items = Array.from(scope.querySelectorAll(selector)).filter((item) => {
                return item.getAttribute('aria-disabled') !== 'true' && item.offsetParent !== null;
            });
            if (!items.length) return;
            event.preventDefault();
            const current = Math.max(0, items.indexOf(document.activeElement));
            let next = current;
            if (event.key === 'ArrowDown') next = (current + 1) % items.length;
            if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = items.length - 1;
            items[next].focus();
        };

        this.startMenu?.addEventListener('keydown', (event) => {
            if (event.target.closest('.all-programs-menu') || event.target === this.searchInput) return;
            moveFocus(event, this.startMenu, '.menu-item, .all-programs-button, .footer-button');
        });
        this.allProgramsMenu?.addEventListener('keydown', (event) => {
            if (event.target === this.searchInput) return;
            moveFocus(event, this.allProgramsMenu, '.all-programs-item');
        });
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || event.ctrlKey) return;
            if (this.currentSubmenu) {
                event.preventDefault();
                this.searchInput.value = '';
                this.hideAllSubmenus();
                document.getElementById('menu-all-programs')?.focus();
            } else if (this.isOpen) {
                event.preventDefault();
                this.close();
                document.getElementById('start-button')?.focus();
            }
        });
    }
    
    setupFooterButtons() {
        // Log off button
        const logOffBtn = document.getElementById('btn-log-off');
        if (logOffBtn) {
            this.prepareInteractiveItem(logOffBtn);
            this.addClickAndTouchEvent(logOffBtn, () => {
                this.showLogOffDialog(false); // false = logout mode
            });
        }
        
        // Shut down button
        const shutDownBtn = document.getElementById('btn-shut-down');
        if (shutDownBtn) {
            this.prepareInteractiveItem(shutDownBtn);
            this.addClickAndTouchEvent(shutDownBtn, () => {
                this.showLogOffDialog(true); // true = shutdown mode
            });
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        window.clearTimeout(this.closeTimer);
        this.startMenu.style.visibility = 'visible';
        window.requestAnimationFrame(() => this.startMenu.classList.add('show'));
        this.isOpen = true;
        this.startMenu.inert = false;
        this.startMenu.setAttribute('aria-hidden', 'false');
        document.getElementById('start-button')?.setAttribute('aria-expanded', 'true');
        document.getElementById('start-button')?.classList.add('active');
        
        // Play sound
        if (window.zarateXP?.soundManager) {
            window.zarateXP.soundManager.play('click');
        }
        
        // Animate menu items
        this.animateMenuItems();
    }
    
    close() {
        if (this.startMenu.contains(document.activeElement)) document.getElementById('start-button')?.focus();
        window.clearTimeout(this.closeTimer);
        this.startMenu.classList.remove('show');
        this.isOpen = false;
        this.startMenu.inert = true;
        this.startMenu.setAttribute('aria-hidden', 'true');
        document.getElementById('start-button')?.setAttribute('aria-expanded', 'false');
        document.getElementById('start-button')?.classList.remove('active');
        this.searchInput.value = '';
        this.hideAllSubmenus();
        const delay = this.prefersReducedMotion() ? 0 : 140;
        this.closeTimer = window.setTimeout(() => {
            if (!this.isOpen) {
                this.startMenu.style.visibility = 'hidden';
            }
        }, delay);
    }
    
    toggleAllPrograms() {
        if (!this.allProgramsMenu) return;
        if (this.allProgramsMenu.classList.contains('show') && !this.activeCategory) {
            this.hideAllSubmenus();
            document.getElementById('menu-all-programs')?.focus();
        } else {
            this.openLibrary();
        }
    }

    openLibrary(category = '', focusFirst = true) {
        this.activeCategory = category;
        this.allProgramsMenu.dataset.libraryCategory = category;
        this.startMenu.classList.add('library-open');
        this.allProgramsMenu.classList.add('show');
        this.allProgramsMenu.inert = false;
        this.allProgramsMenu.setAttribute('aria-hidden', 'false');
        this.currentSubmenu = this.allProgramsMenu;
        document.getElementById('menu-all-programs')?.setAttribute('aria-expanded', 'true');
        document.getElementById('menu-games')?.setAttribute('aria-expanded', String(category === 'games'));
        const title = category === 'games' ? 'Juegos' : 'Todos los programas';
        this.allProgramsMenu.querySelector('[data-library-title]').textContent = window.zarateXP?.i18nManager?.t(title) || title;
        this.allProgramsMenu.setAttribute('aria-label', window.zarateXP?.i18nManager?.t(title) || title);
        this.filterPrograms();
        this.positionProgramsMenu();
        if (focusFirst) window.requestAnimationFrame(() => this.visibleProgramItems()[0]?.focus());
    }

    visibleProgramItems() {
        return Array.from(this.allProgramsMenu.querySelectorAll('.all-programs-item')).filter((item) => item.offsetParent !== null);
    }

    positionProgramsMenu() {
        this.allProgramsMenu.style.bottom = '';
        if (this.activeCategory !== 'games' || window.matchMedia('(max-width: 768px)').matches) return;
        const menuRect = this.startMenu.getBoundingClientRect();
        const triggerRect = document.getElementById('menu-games').getBoundingClientRect();
        this.allProgramsMenu.style.bottom = Math.max(0, menuRect.bottom - triggerRect.top - this.allProgramsMenu.offsetHeight) + 'px';
    }

    setupAppSearch() {
        this.searchInput.addEventListener('input', () => this.openLibrary('', false));
        this.searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!this.currentSubmenu) this.openLibrary('', false);
                this.visibleProgramItems()[0]?.focus();
            }
            if (event.key === 'Enter' && this.searchInput.value.trim()) {
                event.preventDefault();
                this.visibleProgramItems()[0]?.click();
            }
        });
        document.querySelector('[data-open-app-search]')?.addEventListener('click', (event) => {
            event.stopPropagation();
            this.openSearch();
        });
        window.addEventListener('zaratexp:localechange', () => {
            if (this.currentSubmenu) this.filterPrograms();
        });
        window.addEventListener('resize', () => {
            if (this.currentSubmenu) this.positionProgramsMenu();
        });
    }

    openSearch() {
        this.open();
        this.openLibrary('', false);
        this.searchInput.focus();
    }

    filterPrograms() {
        const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const query = normalize(this.searchInput.value.trim());
        let matches = 0;
        this.allProgramsMenu.querySelectorAll('[data-program-group]').forEach((group) => {
            const key = group.dataset.programGroup;
            const categoryMatches = !this.activeCategory || key === this.activeCategory;
            let visible = 0;
            group.querySelectorAll('.all-programs-item').forEach((item) => {
                const haystack = normalize(`${item.textContent} ${item.dataset.programName || ''}`);
                item.hidden = !categoryMatches || !haystack.includes(query) || (Boolean(query) && key === 'recent');
                if (!item.hidden) visible++;
            });
            group.hidden = !categoryMatches || (!visible && !(key === 'recent' && !query && !this.activeCategory));
            matches += visible;
        });
        this.allProgramsMenu.querySelector('.app-search-empty').hidden = matches > 0 || !query;
    }
    
    hideAllSubmenus() {
        if (this.allProgramsMenu?.contains(document.activeElement)) document.getElementById('menu-all-programs')?.focus();
        this.allProgramsMenu?.classList.remove('show');
        if (this.allProgramsMenu) this.allProgramsMenu.inert = true;
        this.allProgramsMenu?.setAttribute('aria-hidden', 'true');
        this.currentSubmenu = null;
        this.startMenu.classList.remove('library-open');
        this.activeCategory = '';
        document.getElementById('menu-all-programs')?.setAttribute('aria-expanded', 'false');
        document.getElementById('menu-games')?.setAttribute('aria-expanded', 'false');
    }
    
    openProgram(programName) {
        this.close();
        this.addRecentProgram(programName);
        
        if (window.zarateXP?.appManager) {
            window.zarateXP.appManager.openApp(programName);
        }
    }
    
    openUrl(url) {
        this.close();
        const safeUrl = this.safeExternalUrl(url);
        if (safeUrl) window.open(safeUrl, '_blank', 'noopener');
    }

    addRecentProgram(programName) {
        const app = window.zarateXP?.appManager?.getApp(programName);
        const list = this.allProgramsMenu?.querySelector('[data-recent-programs]');
        if (!app || !list) return;

        list.querySelectorAll('.recently-used-empty').forEach((item) => item.remove());
        list.querySelector(`[data-program-name="${programName}"]`)?.remove();

        const item = document.createElement('li');
        item.className = 'all-programs-item recently-used-item';
        item.dataset.action = 'open-program';
        item.dataset.programName = programName;
        const icon = document.createElement('img');
        icon.src = this.safeResourceUrl(app.icon);
        icon.alt = String(app.name || programName);
        item.append(icon, document.createTextNode(String(app.name || programName)));
        this.prepareInteractiveItem(item);
        this.addClickAndTouchEvent(item, (event) => {
            event.stopPropagation();
            this.openProgram(programName);
        });
        list.prepend(item);

        Array.from(list.querySelectorAll('.recently-used-item')).slice(4).forEach((itemToRemove) => itemToRemove.remove());
        try {
            localStorage.setItem('zarateXP.recentApps.v1', JSON.stringify(Array.from(list.querySelectorAll('.recently-used-item')).map((item) => item.dataset.programName)));
        } catch (error) { /* Recents stay available in memory when storage is unavailable. */ }
    }

    restoreRecentPrograms() {
        try {
            const recent = JSON.parse(localStorage.getItem('zarateXP.recentApps.v1') || '[]');
            if (Array.isArray(recent)) recent.slice(0, 4).reverse().forEach((id) => this.addRecentProgram(id));
        } catch (error) { /* Ignore malformed saved preferences. */ }
    }

    safeResourceUrl(value, fallback = './assets/images/hd-icons/projects.svg') {
        try {
            const parsed = new URL(String(value || ''), window.location.href);
            const allowedProtocol = ['http:', 'https:', 'blob:'].includes(parsed.protocol);
            const sameOrigin = parsed.origin === window.location.origin;
            return allowedProtocol && (sameOrigin || parsed.protocol === 'blob:') ? String(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    safeExternalUrl(value) {
        try {
            const parsed = new URL(String(value || ''), window.location.href);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
        } catch (error) {
            return '';
        }
    }

    prefersReducedMotion() {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    }

    loadLazyImages(scope) {
        scope?.querySelectorAll('img[data-lazy-src]').forEach((image) => {
            if (!image.getAttribute('src')) {
                image.setAttribute('src', image.dataset.lazySrc);
            }
        });
    }
    
    showLogOffDialog(isShutdown = false) {
        this.close();
        
        const dialog = document.getElementById('logoff-dialog-container');
        const headerText = document.querySelector('.logoff-dialog-header-text');
        const restartBtn = document.getElementById('logoff-restart-btn');
        const shutdownBtn = document.getElementById('logoff-shutdown-btn');
        
        // Update dialog content based on action type
        if (isShutdown) {
            headerText.textContent = 'Apagar IaZarateXP';
            // Show restart and shutdown buttons
            restartBtn.style.display = 'flex';
            shutdownBtn.style.display = 'flex';
            
            // Update first button for restart
            const firstBtnImg = restartBtn.querySelector('img');
            const firstBtnText = restartBtn.querySelector('span');
            firstBtnImg.src = 'assets/images/xp-small-icons/restart.png';
            firstBtnImg.alt = 'Restart Icon';
            firstBtnText.textContent = 'Reiniciar';
            
            // Update second button for shutdown
            const secondBtnImg = shutdownBtn.querySelector('img');
            const secondBtnText = shutdownBtn.querySelector('span');
            secondBtnImg.src = 'assets/images/xp-small-icons/shutdown.png';
            secondBtnImg.alt = 'Shutdown Icon';
            secondBtnText.textContent = 'Apagar';
        } else {
            headerText.textContent = 'Cerrar Sesión IaZarateXP';
            // Show restart and logout buttons
            restartBtn.style.display = 'flex';
            shutdownBtn.style.display = 'flex';
            
            // Update first button for restart
            const firstBtnImg = restartBtn.querySelector('img');
            const firstBtnText = restartBtn.querySelector('span');
            firstBtnImg.src = 'assets/images/xp-small-icons/restart.png';
            firstBtnImg.alt = 'Restart Icon';
            firstBtnText.textContent = 'Reiniciar';
            
            // Update second button for logout
            const secondBtnImg = shutdownBtn.querySelector('img');
            const secondBtnText = shutdownBtn.querySelector('span');
            secondBtnImg.src = 'assets/images/xp-small-icons/logout.png';
            secondBtnImg.alt = 'Logout Icon';
            secondBtnText.textContent = 'Cerrar Sesión';
        }
        
        this.loadLazyImages(dialog);
        dialog.classList.remove('logoff-dialog-hidden');
        dialog.style.display = 'flex';
        
        // Setup dialog buttons
        const cancelBtn = document.getElementById('logoff-cancel-btn');
        
        cancelBtn.onclick = () => {
            dialog.classList.add('logoff-dialog-hidden');
            dialog.style.display = 'none';
        };
        
        restartBtn.onclick = () => {
            dialog.classList.add('logoff-dialog-hidden');
            dialog.style.display = 'none';
            this.performRestart();
        };
        
        shutdownBtn.onclick = () => {
            dialog.classList.add('logoff-dialog-hidden');
            dialog.style.display = 'none';
            if (isShutdown) {
                this.performShutdown();
            } else {
                this.performLogoff();
            }
        };
    }
    
    async performShutdown() {
        // Start the shutdown process without sound first
        const shutdownPromise = window.zarateXP?.bootManager ? 
            window.zarateXP.bootManager.shutdown() : Promise.resolve();
        
        // Wait 3 seconds before playing shutdown sound
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Play shutdown sound
        if (window.zarateXP?.soundManager) {
            const shutdownSound = window.zarateXP.soundManager.play('shutdown-custom');
            if (shutdownSound) {
                await new Promise(resolve => {
                    shutdownSound.addEventListener('ended', resolve);
                    shutdownSound.addEventListener('error', resolve);
                    // Timeout después de 5 segundos si el sonido no termina
                    setTimeout(resolve, 5000);
                });
            }
        }
        
        // Wait for shutdown process to complete
        await shutdownPromise;
    }
    
    async performRestart() {
        // Start the restart process without sound first
        const restartPromise = window.zarateXP?.bootManager ? 
            window.zarateXP.bootManager.restart() : Promise.resolve();
        
        // Wait 3 seconds before playing shutdown sound
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Play shutdown sound
        if (window.zarateXP?.soundManager) {
            const shutdownSound = window.zarateXP.soundManager.play('shutdown-custom');
            if (shutdownSound) {
                await new Promise(resolve => {
                    shutdownSound.addEventListener('ended', resolve);
                    shutdownSound.addEventListener('error', resolve);
                    // Timeout después de 5 segundos si el sonido no termina
                    setTimeout(resolve, 5000);
                });
            }
        }
        
        // Wait for restart process to complete
        await restartPromise;
    }
    
    async performLogoff() {
        // Start the logoff process without sound first
        const logoffPromise = window.zarateXP?.bootManager ? 
            window.zarateXP.bootManager.logoff() : Promise.resolve();
        
        // Wait 3 seconds before playing logoff sound
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Play logoff sound
        if (window.zarateXP?.soundManager) {
            const logoffSound = window.zarateXP.soundManager.play('shutdown-custom');
            if (logoffSound) {
                await new Promise(resolve => {
                    logoffSound.addEventListener('ended', resolve);
                    logoffSound.addEventListener('error', resolve);
                    // Timeout después de 5 segundos si el sonido no termina
                    setTimeout(resolve, 5000);
                });
            }
        }
        
        // Wait for logoff process to complete
        await logoffPromise;
    }
    
    animateMenuItems() {
        const items = this.startMenu.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.03}s`;
        });
    }
}

// Legacy support
window.StartMenuManager = StartMenuManager;
