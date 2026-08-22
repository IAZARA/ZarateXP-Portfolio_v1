const DRIVE_ICON = './assets/images/hd-icons/removable-drive.png';
const DRIVE_ICON_SMALL = './assets/images/xp-small-icons/removable-drive.png';
const FOLDER_ICON = './assets/images/xp-small-icons/folder-closed.png';
const COMPUTER_ICON = './assets/images/hd-icons/my-computer.svg';

const PARENT_PATH = Object.freeze({
    drive: 'computer',
    documents: 'drive',
    photos: 'drive'
});

const PATH_META = Object.freeze({
    computer: {
        address: 'Mi PC',
        heading: 'Dispositivos con almacenamiento extraíble',
        details: 'Mi PC muestra las unidades conectadas a este equipo.',
        icon: COMPUTER_ICON
    },
    drive: {
        address: 'Mi PC \\ Disco extraíble (F:)',
        heading: 'Archivos almacenados en Disco extraíble (F:)',
        details: 'Disco extraíble (F:) está listo para explorar.',
        icon: DRIVE_ICON_SMALL
    },
    documents: {
        address: 'Mi PC \\ Disco extraíble (F:) \\ Documentos',
        heading: 'Documentos',
        details: 'La carpeta Documentos está vacía.',
        icon: FOLDER_ICON
    },
    photos: {
        address: 'Mi PC \\ Disco extraíble (F:) \\ Fotos varias',
        heading: 'Fotos varias',
        details: 'La carpeta Fotos varias está vacía.',
        icon: FOLDER_ICON
    }
});

export class MyComputerController {
    constructor(root, options = {}) {
        this.root = root;
        this.options = options;
        this.driveMounted = options.driveMounted !== false;
        this.history = ['computer'];
        this.historyIndex = 0;
        this.currentPath = 'computer';
        this.selectedEntry = null;
        this.events = new AbortController();
    }

    init() {
        const signal = this.events.signal;

        this.root.addEventListener('click', (event) => this.handleClick(event), { signal });
        this.root.addEventListener('dblclick', (event) => this.handleDoubleClick(event), { signal });
        this.root.addEventListener('keydown', (event) => this.handleKeydown(event), { signal });
        this.render();
        return this;
    }

    t(value) {
        return window.zarateXP?.i18nManager?.t(value) || value;
    }

    handleClick(event) {
        const action = event.target.closest('[data-mipc-action]')?.dataset.mipcAction;
        if (action) {
            if (action === 'back') this.goBack();
            if (action === 'forward') this.goForward();
            if (action === 'up') this.goUp();
            if (action === 'folders') this.toggleFolders();
            return;
        }

        const program = event.target.closest('[data-mipc-program]')?.dataset.mipcProgram;
        if (program) {
            this.options.openProgram?.(program);
            return;
        }

        if (event.target.closest('[data-mipc-eject]')) {
            this.options.ejectDrive?.();
            return;
        }

        const pathLink = event.target.closest('[data-mipc-path]')?.dataset.mipcPath;
        if (pathLink) {
            if (pathLink === 'drive' && !this.driveMounted) return;
            this.navigate(pathLink);
            return;
        }

        const item = event.target.closest('[data-mipc-entry]');
        if (!item) {
            this.clearSelection();
            return;
        }

        this.selectItem(item);
        if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 760) {
            this.openEntry(item.dataset.mipcEntry);
        }
    }

    handleDoubleClick(event) {
        const item = event.target.closest('[data-mipc-entry]');
        if (!item) return;
        event.preventDefault();
        this.openEntry(item.dataset.mipcEntry);
    }

    handleKeydown(event) {
        const item = event.target.closest('[data-mipc-entry]');
        if (!item || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        this.selectItem(item);
        this.openEntry(item.dataset.mipcEntry);
    }

    selectItem(item) {
        this.clearSelection();
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        this.selectedEntry = item.dataset.mipcEntry;
    }

    clearSelection() {
        this.root.querySelectorAll('.mipc-item.selected').forEach((item) => {
            item.classList.remove('selected');
            item.setAttribute('aria-selected', 'false');
        });
        this.selectedEntry = null;
    }

    openEntry(entry) {
        if (!entry) return;
        if (entry === 'drive' && !this.driveMounted) return;
        if (['drive', 'documents', 'photos'].includes(entry)) this.navigate(entry);
    }

    navigate(path, { fromHistory = false } = {}) {
        if (!PATH_META[path]) return;
        if (path !== 'computer' && !this.driveMounted) path = 'computer';

        if (!fromHistory) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            if (this.history[this.history.length - 1] !== path) this.history.push(path);
            this.historyIndex = this.history.length - 1;
        }

        this.currentPath = path;
        this.selectedEntry = null;
        this.render();
        this.root.querySelector('[data-mipc-content]')?.focus({ preventScroll: true });
    }

    goBack() {
        if (this.historyIndex <= 0) return;
        this.historyIndex -= 1;
        this.navigate(this.history[this.historyIndex], { fromHistory: true });
    }

    goForward() {
        if (this.historyIndex >= this.history.length - 1) return;
        this.historyIndex += 1;
        this.navigate(this.history[this.historyIndex], { fromHistory: true });
    }

    goUp() {
        const parent = PARENT_PATH[this.currentPath];
        if (parent) this.navigate(parent);
    }

    toggleFolders() {
        const collapsed = this.root.classList.toggle('sidebar-collapsed');
        const button = this.root.querySelector('[data-mipc-action="folders"]');
        button?.setAttribute('aria-pressed', String(!collapsed));
    }

    createItem({ entry, title, kind, icon }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mipc-item';
        button.dataset.mipcEntry = entry;
        button.dataset.mipcKind = kind;
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('aria-label', this.t(title));

        const image = document.createElement('img');
        image.src = icon;
        image.alt = '';
        image.draggable = false;
        const label = document.createElement('span');
        label.textContent = this.t(title);
        button.append(image, label);
        return button;
    }

    render() {
        const path = this.currentPath !== 'computer' && !this.driveMounted ? 'computer' : this.currentPath;
        this.currentPath = path;
        const meta = PATH_META[path];
        const content = this.root.querySelector('[data-mipc-content]');
        if (!content) return;

        content.replaceChildren();
        const section = document.createElement('section');
        section.className = 'mipc-content-section';
        const heading = document.createElement('h2');
        heading.className = 'mipc-section-heading';
        heading.textContent = this.t(meta.heading);
        section.appendChild(heading);

        const items = document.createElement('div');
        items.className = 'mipc-items';
        items.setAttribute('role', 'listbox');
        let count = 0;

        if (path === 'computer' && this.driveMounted) {
            items.appendChild(this.createItem({
                entry: 'drive',
                title: 'Disco extraíble (F:)',
                kind: 'drive',
                icon: DRIVE_ICON
            }));
            count = 1;
        } else if (path === 'drive' && this.driveMounted) {
            items.append(
                this.createItem({ entry: 'documents', title: 'Documentos', kind: 'folder', icon: FOLDER_ICON }),
                this.createItem({ entry: 'photos', title: 'Fotos varias', kind: 'folder', icon: FOLDER_ICON })
            );
            count = 2;
        }

        if (count) {
            section.appendChild(items);
        } else {
            const empty = document.createElement('div');
            empty.className = 'mipc-empty-state';
            const emptyInner = document.createElement('div');
            const emptyIcon = document.createElement('img');
            emptyIcon.src = path === 'computer' ? COMPUTER_ICON : FOLDER_ICON;
            emptyIcon.alt = '';
            const message = document.createElement('p');
            message.textContent = this.t(path === 'computer'
                ? 'No hay dispositivos con almacenamiento extraíble.'
                : 'Esta carpeta está vacía.');
            emptyInner.append(emptyIcon, message);
            empty.appendChild(emptyInner);
            section.appendChild(empty);
        }

        content.appendChild(section);
        this.syncChrome(meta, count);
        window.zarateXP?.i18nManager?.localizeSubtree?.(this.root);
    }

    syncChrome(meta, count) {
        const address = this.root.querySelector('[data-mipc-address]');
        const addressIcon = this.root.querySelector('[data-mipc-address-icon]');
        const details = this.root.querySelector('[data-mipc-details]');
        const status = this.root.querySelector('[data-mipc-status]');
        const back = this.root.querySelector('[data-mipc-action="back"]');
        const forward = this.root.querySelector('[data-mipc-action="forward"]');
        const up = this.root.querySelector('[data-mipc-action="up"]');

        if (address) address.textContent = this.t(meta.address);
        if (addressIcon) addressIcon.src = meta.icon;
        if (details) details.textContent = this.t(meta.details);
        if (status) status.textContent = this.t(`${count} ${count === 1 ? 'objeto' : 'objetos'}`);
        if (back) back.disabled = this.historyIndex <= 0;
        if (forward) forward.disabled = this.historyIndex >= this.history.length - 1;
        if (up) up.disabled = !PARENT_PATH[this.currentPath];

        this.root.querySelectorAll('[data-mipc-eject], [data-mipc-drive-link]').forEach((element) => {
            element.hidden = !this.driveMounted;
        });
    }

    setDriveMounted(mounted) {
        this.driveMounted = Boolean(mounted);
        if (!this.driveMounted) {
            this.history = ['computer'];
            this.historyIndex = 0;
            this.currentPath = 'computer';
        }
        this.render();
    }

    destroy() {
        this.events.abort();
    }
}

export function initMyComputerApp(root, options = {}) {
    return new MyComputerController(root, options).init();
}
