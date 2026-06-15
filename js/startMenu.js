// Start Menu Manager Module
export class StartMenuManager {
    constructor() {
        this.startMenu = document.querySelector('.startmenu');
        this.allProgramsMenu = document.querySelector('.all-programs-menu');
        this.recentlyUsedMenu = document.querySelector('.recently-used-menu');
        this.isOpen = false;
        this.currentSubmenu = null;
    }
    
    init() {
        this.setupMenuItems();
        this.setupSubmenus();
        this.setupFooterButtons();
    }
    
    // Helper para agregar eventos de click y touch
    addClickAndTouchEvent(element, handler) {
        // Click para desktop
        element.addEventListener('click', handler);
        
        // Touch para móvil
        element.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevenir el click fantasma
            handler(e);
        });
    }
    
    setupMenuItems() {
        // Handle all menu items
        const menuItems = this.startMenu.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            if (item.classList.contains('disabled')) return;
            
            this.addClickAndTouchEvent(item, (e) => {
                e.stopPropagation();
                
                const action = item.getAttribute('data-action');
                const programName = item.getAttribute('data-program-name');
                const url = item.getAttribute('data-url');
                
                if (action === 'open-program' && programName) {
                    this.openProgram(programName);
                } else if (action === 'open-url' && url) {
                    this.openUrl(url);
                } else if (action === 'toggle-all-programs') {
                    this.toggleAllPrograms();
                } else if (action === 'toggle-recently-used') {
                    this.toggleRecentlyUsed();
                }
            });
            
            // Hover effect for submenus
            if (item.getAttribute('data-action') === 'toggle-recently-used') {
                item.addEventListener('mouseenter', () => {
                    this.showRecentlyUsed();
                });
            }
        });
        
        // All programs button
        const allProgramsBtn = document.getElementById('menu-all-programs');
        if (allProgramsBtn) {
            this.addClickAndTouchEvent(allProgramsBtn, (e) => {
                e.stopPropagation();
                this.toggleAllPrograms();
            });
        }
    }
    
    setupSubmenus() {
        // All Programs Menu
        const allProgramsItems = this.allProgramsMenu.querySelectorAll('.all-programs-item');
        allProgramsItems.forEach(item => {
            if (item.classList.contains('disabled')) return;
            
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
        
        // Recently Used Menu
        const recentlyUsedItems = this.recentlyUsedMenu.querySelectorAll('.recently-used-item');
        recentlyUsedItems.forEach(item => {
            if (item.classList.contains('disabled')) return;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                // Disabled items don't do anything
            });
        });
        
        // Hide submenus when clicking outside
        document.addEventListener('click', () => {
            this.hideAllSubmenus();
        });
        
        // Hide submenus when mouse leaves the area
        this.startMenu.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!this.isMouseOverSubmenu()) {
                    this.hideAllSubmenus();
                }
            }, 100);
        });
    }
    
    setupFooterButtons() {
        // Log off button
        const logOffBtn = document.getElementById('btn-log-off');
        if (logOffBtn) {
            logOffBtn.addEventListener('click', () => {
                this.showLogOffDialog(false); // false = logout mode
            });
        }
        
        // Shut down button
        const shutDownBtn = document.getElementById('btn-shut-down');
        if (shutDownBtn) {
            shutDownBtn.addEventListener('click', () => {
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
        this.startMenu.style.visibility = 'visible';
        this.startMenu.style.opacity = '1';
        this.startMenu.classList.add('show');
        this.isOpen = true;
        
        // Play sound
        if (window.zarateXP?.soundManager) {
            window.zarateXP.soundManager.play('click');
        }
        
        // Animate menu items
        this.animateMenuItems();
    }
    
    close() {
        this.startMenu.style.visibility = 'hidden';
        this.startMenu.style.opacity = '0';
        this.startMenu.classList.remove('show');
        this.isOpen = false;
        this.hideAllSubmenus();
    }
    
    toggleAllPrograms() {
        if (this.allProgramsMenu.style.display === 'block') {
            this.allProgramsMenu.style.display = 'none';
        } else {
            this.hideAllSubmenus();
            this.allProgramsMenu.style.display = 'block';
            this.currentSubmenu = this.allProgramsMenu;
            this.positionSubmenu(this.allProgramsMenu);
        }
    }
    
    toggleRecentlyUsed() {
        if (this.recentlyUsedMenu.style.display === 'block') {
            this.recentlyUsedMenu.style.display = 'none';
        } else {
            this.showRecentlyUsed();
        }
    }
    
    showRecentlyUsed() {
        this.hideAllSubmenus();
        this.recentlyUsedMenu.style.display = 'block';
        this.currentSubmenu = this.recentlyUsedMenu;
        
        // Position the submenu
        const menuItem = document.getElementById('menu-program4');
        if (menuItem) {
            const rect = menuItem.getBoundingClientRect();
            const menuRect = this.startMenu.getBoundingClientRect();
            this.recentlyUsedMenu.style.top = (rect.top - menuRect.top) + 'px';
        }
    }
    
    hideAllSubmenus() {
        this.allProgramsMenu.style.display = 'none';
        this.recentlyUsedMenu.style.display = 'none';
        this.currentSubmenu = null;
    }
    
    positionSubmenu(submenu) {
        // Position submenu to the right of the start menu
        const startMenuRect = this.startMenu.getBoundingClientRect();
        submenu.style.left = startMenuRect.width + 'px';
    }
    
    isMouseOverSubmenu() {
        if (!this.currentSubmenu) return false;
        
        const rect = this.currentSubmenu.getBoundingClientRect();
        const mouseX = window.mouseX || 0;
        const mouseY = window.mouseY || 0;
        
        return mouseX >= rect.left && mouseX <= rect.right &&
               mouseY >= rect.top && mouseY <= rect.bottom;
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
        if (!app || !this.recentlyUsedMenu) return;

        const list = this.recentlyUsedMenu.querySelector('.recently-used-items');
        if (!list) return;

        list.querySelectorAll('.recently-used-item.disabled').forEach((item) => item.remove());
        list.querySelector(`[data-program-name="${programName}"]`)?.remove();

        const item = document.createElement('li');
        item.className = 'recently-used-item';
        item.dataset.action = 'open-program';
        item.dataset.programName = programName;
        const icon = document.createElement('img');
        icon.src = this.safeResourceUrl(app.icon);
        icon.alt = String(app.name || programName);
        item.append(icon, document.createTextNode(String(app.name || programName)));
        this.addClickAndTouchEvent(item, (event) => {
            event.stopPropagation();
            this.openProgram(programName);
        });
        list.prepend(item);

        Array.from(list.querySelectorAll('.recently-used-item')).slice(6).forEach((itemToRemove) => itemToRemove.remove());
    }

    safeResourceUrl(value, fallback = './assets/images/hd-icons/projects.svg') {
        try {
            const parsed = new URL(String(value || ''), window.location.href);
            return ['http:', 'https:', 'blob:'].includes(parsed.protocol) ? String(value) : fallback;
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
            firstBtnImg.src = 'assets/images/restart.png';
            firstBtnImg.alt = 'Restart Icon';
            firstBtnText.textContent = 'Reiniciar';
            
            // Update second button for shutdown
            const secondBtnImg = shutdownBtn.querySelector('img');
            const secondBtnText = shutdownBtn.querySelector('span');
            secondBtnImg.src = 'assets/images/shutdown.png';
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
            firstBtnImg.src = 'assets/images/restart.png';
            firstBtnImg.alt = 'Restart Icon';
            firstBtnText.textContent = 'Reiniciar';
            
            // Update second button for logout
            const secondBtnImg = shutdownBtn.querySelector('img');
            const secondBtnText = shutdownBtn.querySelector('span');
            secondBtnImg.src = 'images/icons/logout.png';
            secondBtnImg.alt = 'Logout Icon';
            secondBtnText.textContent = 'Cerrar Sesión';
        }
        
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
            item.style.animationDelay = `${index * 0.05}s`;
        });
    }
}

// Track mouse position for submenu handling
document.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
});

// Legacy support
window.StartMenuManager = StartMenuManager;
