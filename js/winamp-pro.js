(function () {
    class WinampProApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-winamp-root]');
            this.canvas = this.root.querySelector('[data-winamp-visualizer]');
            this.ctx = this.canvas.getContext('2d');
            this.playlistEl = this.root.querySelector('[data-winamp-playlist]');
            this.statusEl = this.root.querySelector('[data-winamp-status]');
            this.titleEl = this.root.querySelector('[data-winamp-title]');
            this.metaEl = this.root.querySelector('[data-winamp-meta]');
            this.timeEl = this.root.querySelector('[data-winamp-time]');
            this.seekEl = this.root.querySelector('[data-winamp-seek]');
            this.volumeEl = this.root.querySelector('[data-winamp-volume]');
            this.balanceEl = this.root.querySelector('[data-winamp-balance]');
            this.eqInputs = Array.from(this.root.querySelectorAll('[data-eq-band]'));
            this.tracks = [
                {
                    title: '01. API Weather Groove',
                    meta: 'Open-Meteo data pulse - synthetic loop',
                    duration: 42,
                    step: 0.22,
                    wave: 'sawtooth',
                    notes: [196, 247, 294, 330, 294, 247, 392, 330, 294, 247, 220, 247]
                },
                {
                    title: '02. n8n Automation Bassline',
                    meta: 'Webhook -> CRM -> Dashboard',
                    duration: 48,
                    step: 0.18,
                    wave: 'square',
                    notes: [110, 110, 165, 220, 196, 165, 147, 165, 220, 247, 220, 165]
                },
                {
                    title: '03. Full Stack Startup Screen',
                    meta: 'Frontend, backend and deploy rhythm',
                    duration: 55,
                    step: 0.2,
                    wave: 'triangle',
                    notes: [262, 330, 392, 523, 494, 392, 330, 294, 330, 392, 440, 392]
                },
                {
                    title: '04. Canvas Pinball Demo',
                    meta: 'Canvas physics showcase',
                    duration: 38,
                    step: 0.16,
                    wave: 'sine',
                    notes: [330, 392, 659, 587, 494, 440, 392, 330, 392, 494, 587, 659]
                }
            ];
            this.trackIndex = 0;
            this.position = 0;
            this.scoreTicks = 0;
            this.isPlaying = false;
            this.shuffle = false;
            this.repeat = false;
            this.activeNodes = new Set();
            this.raf = null;
            this.scheduler = null;
            this.nextNoteAt = 0;
            this.noteIndex = 0;
        }

        init() {
            this.renderPlaylist();
            this.bindControls();
            this.updateTrackLabels();
            this.drawIdle();
        }

        bindControls() {
            this.root.querySelector('[data-winamp-action="play"]').addEventListener('click', () => this.play());
            this.root.querySelector('[data-winamp-action="pause"]').addEventListener('click', () => this.pause());
            this.root.querySelector('[data-winamp-action="stop"]').addEventListener('click', () => this.stop());
            this.root.querySelector('[data-winamp-action="prev"]').addEventListener('click', () => this.previous());
            this.root.querySelector('[data-winamp-action="next"]').addEventListener('click', () => this.next());
            this.root.querySelector('[data-winamp-action="shuffle"]').addEventListener('click', (event) => {
                this.shuffle = !this.shuffle;
                event.currentTarget.classList.toggle('active', this.shuffle);
                this.setStatus(this.shuffle ? 'Shuffle activado' : 'Shuffle desactivado');
            });
            this.root.querySelector('[data-winamp-action="repeat"]').addEventListener('click', (event) => {
                this.repeat = !this.repeat;
                event.currentTarget.classList.toggle('active', this.repeat);
                this.setStatus(this.repeat ? 'Repeat activado' : 'Repeat desactivado');
            });

            this.seekEl.addEventListener('input', () => {
                this.position = (Number(this.seekEl.value) / 100) * this.currentTrack().duration;
                this.resetSchedulerPosition();
                this.updateTime();
            });
            this.volumeEl.addEventListener('input', () => this.applyMixer());
            this.balanceEl.addEventListener('input', () => this.applyMixer());
            this.eqInputs.forEach((input) => input.addEventListener('input', () => this.applyEq()));
        }

        renderPlaylist() {
            this.playlistEl.innerHTML = this.tracks.map((track, index) => `
                <li>
                    <button type="button" data-track-index="${index}">
                        <span>${track.title}</span>
                        <small>${this.formatTime(track.duration)}</small>
                    </button>
                </li>
            `).join('');

            this.playlistEl.querySelectorAll('[data-track-index]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.loadTrack(Number(button.dataset.trackIndex));
                    this.play();
                });
            });
        }

        async play() {
            await this.ensureAudio();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            if (this.isPlaying) return;

            this.isPlaying = true;
            this.startedAt = this.audioContext.currentTime - this.position;
            this.nextNoteAt = this.audioContext.currentTime;
            this.noteIndex = Math.floor(this.position / this.currentTrack().step);
            this.scheduler = window.setInterval(() => this.scheduleAhead(), 80);
            this.setStatus('Reproduciendo loop generado con Web Audio API');
            this.draw();
        }

        pause() {
            if (!this.isPlaying) return;
            this.position = Math.min(this.currentTrack().duration, this.audioContext.currentTime - this.startedAt);
            this.isPlaying = false;
            window.clearInterval(this.scheduler);
            this.scheduler = null;
            this.stopActiveNodes();
            this.setStatus('Pausado');
        }

        stop() {
            this.isPlaying = false;
            this.position = 0;
            window.clearInterval(this.scheduler);
            this.scheduler = null;
            this.stopActiveNodes();
            this.updateTime();
            this.drawIdle();
            this.setStatus('Detenido');
        }

        previous() {
            const index = this.trackIndex === 0 ? this.tracks.length - 1 : this.trackIndex - 1;
            this.loadTrack(index);
            if (this.audioContext) this.play();
        }

        next() {
            const nextIndex = this.shuffle
                ? Math.floor(Math.random() * this.tracks.length)
                : (this.trackIndex + 1) % this.tracks.length;
            this.loadTrack(nextIndex);
            if (this.audioContext) this.play();
        }

        loadTrack(index) {
            const wasPlaying = this.isPlaying;
            this.stop();
            this.trackIndex = index;
            this.updateTrackLabels();
            if (wasPlaying) this.play();
        }

        async ensureAudio() {
            if (this.audioContext) return;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.bass = this.audioContext.createBiquadFilter();
            this.bass.type = 'lowshelf';
            this.bass.frequency.value = 180;
            this.mid = this.audioContext.createBiquadFilter();
            this.mid.type = 'peaking';
            this.mid.frequency.value = 1200;
            this.mid.Q.value = 0.9;
            this.treble = this.audioContext.createBiquadFilter();
            this.treble.type = 'highshelf';
            this.treble.frequency.value = 4500;
            this.panner = this.audioContext.createStereoPanner();
            this.gain = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 128;

            this.bass.connect(this.mid);
            this.mid.connect(this.treble);
            this.treble.connect(this.panner);
            this.panner.connect(this.gain);
            this.gain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.applyMixer();
            this.applyEq();
        }

        scheduleAhead() {
            const track = this.currentTrack();
            while (this.nextNoteAt < this.audioContext.currentTime + 0.28) {
                const elapsed = this.nextNoteAt - this.startedAt;
                if (elapsed >= track.duration) {
                    this.handleTrackEnded();
                    return;
                }
                const frequency = track.notes[this.noteIndex % track.notes.length];
                this.scheduleNote(frequency, this.nextNoteAt, track.step * 0.82, track.wave);
                this.noteIndex += 1;
                this.nextNoteAt += track.step;
            }
        }

        scheduleNote(frequency, startAt, duration, wave) {
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();
            oscillator.type = wave;
            oscillator.frequency.setValueAtTime(frequency, startAt);
            noteGain.gain.setValueAtTime(0.0001, startAt);
            noteGain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

            oscillator.connect(noteGain);
            noteGain.connect(this.bass);
            oscillator.start(startAt);
            oscillator.stop(startAt + duration + 0.02);
            this.activeNodes.add(oscillator);
            oscillator.onended = () => this.activeNodes.delete(oscillator);
        }

        handleTrackEnded() {
            if (this.repeat) {
                this.loadTrack(this.trackIndex);
                this.play();
            } else {
                this.next();
            }
        }

        resetSchedulerPosition() {
            if (!this.audioContext || !this.isPlaying) return;
            this.stopActiveNodes();
            this.startedAt = this.audioContext.currentTime - this.position;
            this.nextNoteAt = this.audioContext.currentTime;
            this.noteIndex = Math.floor(this.position / this.currentTrack().step);
        }

        applyMixer() {
            if (!this.gain) return;
            this.gain.gain.value = Number(this.volumeEl.value) / 100;
            this.panner.pan.value = Number(this.balanceEl.value) / 100;
        }

        applyEq() {
            if (!this.bass) return;
            this.eqInputs.forEach((input) => {
                const value = Number(input.value);
                if (input.dataset.eqBand === 'bass') this.bass.gain.value = value;
                if (input.dataset.eqBand === 'mid') this.mid.gain.value = value;
                if (input.dataset.eqBand === 'treble') this.treble.gain.value = value;
            });
        }

        draw() {
            if (!this.isPlaying) return;
            this.updateTime();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#050708';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.analyser.getByteFrequencyData(this.frequencyData);

            const barWidth = 7;
            for (let i = 0; i < this.frequencyData.length; i += 1) {
                const value = this.frequencyData[i];
                const height = Math.max(4, (value / 255) * 92);
                const x = i * (barWidth + 1);
                const gradient = this.ctx.createLinearGradient(0, 104 - height, 0, 104);
                gradient.addColorStop(0, '#f6ff00');
                gradient.addColorStop(0.45, '#00ff66');
                gradient.addColorStop(1, '#028f2c');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, 104 - height, barWidth, height);
            }

            this.raf = window.requestAnimationFrame(() => this.draw());
        }

        drawIdle() {
            window.cancelAnimationFrame(this.raf);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#050708';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            for (let i = 0; i < 42; i += 1) {
                const height = 8 + ((i * 13) % 34);
                this.ctx.fillStyle = i % 3 === 0 ? '#00ff66' : '#1c5f25';
                this.ctx.fillRect(i * 9, 104 - height, 6, height);
            }
        }

        updateTime() {
            if (this.isPlaying && this.audioContext) {
                this.position = Math.min(this.currentTrack().duration, this.audioContext.currentTime - this.startedAt);
            }
            const duration = this.currentTrack().duration;
            this.seekEl.value = duration ? String((this.position / duration) * 100) : '0';
            this.timeEl.textContent = `${this.formatTime(this.position)} / ${this.formatTime(duration)}`;
        }

        updateTrackLabels() {
            const track = this.currentTrack();
            this.titleEl.textContent = track.title;
            this.metaEl.textContent = track.meta;
            this.playlistEl.querySelectorAll('[data-track-index]').forEach((button) => {
                button.classList.toggle('active', Number(button.dataset.trackIndex) === this.trackIndex);
            });
            this.updateTime();
        }

        currentTrack() {
            return this.tracks[this.trackIndex];
        }

        stopActiveNodes() {
            this.activeNodes.forEach((node) => {
                try {
                    node.stop();
                } catch (error) {
                    // El nodo pudo haber terminado naturalmente.
                }
            });
            this.activeNodes.clear();
        }

        setStatus(message) {
            this.statusEl.textContent = message;
        }

        formatTime(seconds) {
            const safeSeconds = Math.max(0, Math.floor(seconds || 0));
            const minutes = Math.floor(safeSeconds / 60);
            const remaining = safeSeconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
        }

        destroy() {
            this.stop();
            window.cancelAnimationFrame(this.raf);
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        }
    }

    window.initWinampProApp = function initWinampProApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-winamp-root]') ? scope : document;
        if (rootWindow._winampProApp) {
            rootWindow._winampProApp.destroy();
        }
        rootWindow._winampProApp = new WinampProApp(rootWindow);
        rootWindow._winampProApp.init();
        return rootWindow._winampProApp;
    };

    window.destroyWinampProApp = function destroyWinampProApp(scope = document) {
        if (scope._winampProApp) {
            scope._winampProApp.destroy();
            scope._winampProApp = null;
        }
    };
})();
