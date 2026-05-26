(function () {
    class PdfStudioApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-pdf-root]');
            this.frame = this.root.querySelector('[data-pdf-frame]');
            this.status = this.root.querySelector('[data-pdf-status]');
            this.zoomLabel = this.root.querySelector('[data-pdf-zoom-label]');
            this.noteInput = this.root.querySelector('[data-pdf-note-text]');
            this.noteList = this.root.querySelector('[data-pdf-note-list]');
            this.zoom = 1;
            this.rotation = 0;
            this.fileName = 'Ivan_Zarate_CV.pdf';
            this.currentUrl = './Ivan_Zarate_CV.pdf';
            this.objectUrl = null;
            this.notes = this.readNotes();
        }

        init() {
            this.bindControls();
            this.renderNotes();
            this.applyTransform();
        }

        bindControls() {
            this.root.querySelector('[data-pdf-file]').addEventListener('change', (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                this.openFile(file);
            });

            this.root.querySelector('[data-pdf-default]').addEventListener('click', () => this.openDefault());
            this.root.querySelector('[data-pdf-download]').addEventListener('click', () => this.download());
            this.root.querySelector('[data-pdf-print]').addEventListener('click', () => this.print());
            this.root.querySelector('[data-pdf-rotate]').addEventListener('click', () => {
                this.rotation = (this.rotation + 90) % 360;
                this.applyTransform();
            });
            this.root.querySelectorAll('[data-pdf-zoom]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.zoom = Math.min(1.6, Math.max(0.65, this.zoom + Number(button.dataset.pdfZoom)));
                    this.applyTransform();
                });
            });
            this.root.querySelector('[data-pdf-add-note]').addEventListener('click', () => this.addNote());
        }

        openFile(file) {
            if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = URL.createObjectURL(file);
            this.currentUrl = this.objectUrl;
            this.fileName = file.name;
            this.frame.src = this.objectUrl;
            this.status.textContent = `Archivo local: ${file.name}`;
            this.notes = this.readNotes();
            this.renderNotes();
        }

        openDefault() {
            if (this.objectUrl) {
                URL.revokeObjectURL(this.objectUrl);
                this.objectUrl = null;
            }
            this.currentUrl = './Ivan_Zarate_CV.pdf';
            this.fileName = 'Ivan_Zarate_CV.pdf';
            this.frame.src = './Ivan_Zarate_CV.pdf#view=FitH';
            this.status.textContent = 'Ivan_Zarate_CV.pdf';
            this.notes = this.readNotes();
            this.renderNotes();
        }

        addNote() {
            const text = this.noteInput.value.trim();
            if (!text) return;
            this.notes.unshift({
                id: Date.now(),
                text,
                fileName: this.fileName,
                createdAt: new Date().toISOString()
            });
            this.noteInput.value = '';
            this.saveNotes();
            this.renderNotes();
            this.status.textContent = 'Nota guardada localmente';
        }

        renderNotes() {
            if (!this.notes.length) {
                this.noteList.innerHTML = '<li class="empty">Sin notas para este PDF.</li>';
                return;
            }
            this.noteList.innerHTML = this.notes.map((note) => `
                <li>
                    <button type="button" data-note-delete="${note.id}" aria-label="Eliminar nota">x</button>
                    <strong>${this.escape(note.fileName)}</strong>
                    <span>${this.escape(note.text)}</span>
                    <small>${new Date(note.createdAt).toLocaleString('es-AR')}</small>
                </li>
            `).join('');

            this.noteList.querySelectorAll('[data-note-delete]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.notes = this.notes.filter((note) => String(note.id) !== button.dataset.noteDelete);
                    this.saveNotes();
                    this.renderNotes();
                });
            });
        }

        saveNotes() {
            localStorage.setItem(this.notesKey(), JSON.stringify(this.notes));
        }

        readNotes() {
            try {
                return JSON.parse(localStorage.getItem(this.notesKey()) || '[]');
            } catch (error) {
                return [];
            }
        }

        notesKey() {
            return `zarateXP.pdfNotes.${this.fileName}`;
        }

        applyTransform() {
            this.zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
            this.frame.style.transform = `scale(${this.zoom}) rotate(${this.rotation}deg)`;
            this.frame.style.transformOrigin = 'top left';
            this.frame.style.width = `${100 / this.zoom}%`;
            this.frame.style.height = `${100 / this.zoom}%`;
        }

        download() {
            const link = document.createElement('a');
            link.href = this.currentUrl;
            link.download = this.fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        print() {
            try {
                this.frame.contentWindow?.focus();
                this.frame.contentWindow?.print();
            } catch (error) {
                window.open(this.currentUrl, '_blank', 'noopener');
            }
        }

        escape(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        destroy() {
            if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        }
    }

    window.initPdfStudioApp = function initPdfStudioApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-pdf-root]') ? scope : document;
        if (rootWindow._pdfStudioApp) rootWindow._pdfStudioApp.destroy();
        rootWindow._pdfStudioApp = new PdfStudioApp(rootWindow);
        rootWindow._pdfStudioApp.init();
        return rootWindow._pdfStudioApp;
    };

    window.destroyPdfStudioApp = function destroyPdfStudioApp(scope = document) {
        if (scope._pdfStudioApp) {
            scope._pdfStudioApp.destroy();
            scope._pdfStudioApp = null;
        }
    };
})();
