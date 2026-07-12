(function () {
    'use strict';

    const STORAGE_KEY = 'zarateXP.winamp.preferences.v2';
    const SEEK_STEPS = 1000;

    class WinampProApp {
        constructor(windowElement) {
            this.windowElement = windowElement;
            this.root = windowElement.querySelector('[data-winamp-root]');
            if (!this.root) throw new Error('No se encontró el reproductor Winamp.');

            this.audio = this.root.querySelector('[data-winamp-audio]');
            this.canvas = this.root.querySelector('[data-winamp-visualizer]');
            this.ctx = this.canvas.getContext('2d');
            this.playlistEl = this.root.querySelector('[data-winamp-playlist]');
            this.statusEl = this.root.querySelector('[data-winamp-status]');
            this.titleEl = this.root.querySelector('[data-winamp-title]');
            this.artistEl = this.root.querySelector('[data-winamp-artist]');
            this.metaEl = this.root.querySelector('[data-winamp-meta]');
            this.counterEl = this.root.querySelector('[data-winamp-counter]');
            this.modeEl = this.root.querySelector('[data-winamp-mode]');
            this.stateEl = this.root.querySelector('[data-winamp-state]');
            this.timeEl = this.root.querySelector('[data-winamp-time]');
            this.currentTimeEl = this.root.querySelector('[data-winamp-current-time]');
            this.durationEl = this.root.querySelector('[data-winamp-duration]');
            this.remainingEl = this.root.querySelector('[data-winamp-remaining]');
            this.seekEl = this.root.querySelector('[data-winamp-seek]');
            this.volumeEl = this.root.querySelector('[data-winamp-volume]');
            this.balanceEl = this.root.querySelector('[data-winamp-balance]');
            this.volumeOutput = this.root.querySelector('[data-winamp-volume-output]');
            this.balanceOutput = this.root.querySelector('[data-winamp-balance-output]');
            this.playlistSummary = this.root.querySelector('[data-winamp-playlist-summary]');
            this.eqInputs = Array.from(this.root.querySelectorAll('[data-eq-band]'));
            this.eqOutputs = new Map(Array.from(this.root.querySelectorAll('[data-eq-output]')).map((output) => [output.dataset.eqOutput, output]));
            this.eventController = new AbortController();
            this.destroyed = false;

            this.tracks = [
                {
                    id: 'acdc-thunderstruck',
                    kind: 'media',
                    title: 'Thunderstruck',
                    artist: 'AC/DC',
                    meta: 'MP3 - 192 kbps - 44,1 kHz estéreo',
                    playlistMeta: 'AC/DC - MP3',
                    src: './assets/music/acdc-thunderstruck.mp3',
                    duration: 292.989
                },
                {
                    id: 'soda-tratame-suavemente',
                    kind: 'media',
                    title: 'Trátame suavemente (Remastered)',
                    artist: 'Soda Stereo',
                    meta: 'MP3 - 192 kbps - 44,1 kHz estéreo',
                    playlistMeta: 'Soda Stereo - MP3',
                    src: './assets/music/soda-stereo-tratame-suavemente.mp3',
                    duration: 201.979
                },
                {
                    id: 'weather-groove',
                    kind: 'synth',
                    title: 'API Weather Groove',
                    artist: 'ZarateXP Web Audio Lab',
                    meta: 'Loop sintético - Open-Meteo data pulse',
                    playlistMeta: 'Web Audio - loop',
                    duration: 42,
                    step: 0.22,
                    wave: 'sawtooth',
                    notes: [196, 247, 294, 330, 294, 247, 392, 330, 294, 247, 220, 247]
                },
                {
                    id: 'n8n-bassline',
                    kind: 'synth',
                    title: 'n8n Automation Bassline',
                    artist: 'ZarateXP Web Audio Lab',
                    meta: 'Loop sintético - Webhook, CRM y dashboard',
                    playlistMeta: 'Web Audio - loop',
                    duration: 48,
                    step: 0.18,
                    wave: 'square',
                    notes: [110, 110, 165, 220, 196, 165, 147, 165, 220, 247, 220, 165]
                },
                {
                    id: 'full-stack-screen',
                    kind: 'synth',
                    title: 'Full Stack Startup Screen',
                    artist: 'ZarateXP Web Audio Lab',
                    meta: 'Loop sintético - frontend, backend y deploy',
                    playlistMeta: 'Web Audio - loop',
                    duration: 55,
                    step: 0.2,
                    wave: 'triangle',
                    notes: [262, 330, 392, 523, 494, 392, 330, 294, 330, 392, 440, 392]
                },
                {
                    id: 'canvas-pinball',
                    kind: 'synth',
                    title: 'Canvas Pinball Demo',
                    artist: 'ZarateXP Web Audio Lab',
                    meta: 'Loop sintético - física Canvas',
                    playlistMeta: 'Web Audio - loop',
                    duration: 38,
                    step: 0.16,
                    wave: 'sine',
                    notes: [330, 392, 659, 587, 494, 440, 392, 330, 392, 494, 587, 659]
                }
            ];

            this.trackIndex = 0;
            this.position = 0;
            this.isPlaying = false;
            this.shuffle = false;
            this.repeat = false;
            this.muted = false;
            this.volumeBeforeMute = 70;
            this.activeNodes = new Set();
            this.raf = null;
            this.scheduler = null;
            this.nextNoteAt = 0;
            this.noteIndex = 0;
            this.audioContext = null;
            this.mediaSource = null;
            this.frequencyData = null;
            this.canvasWidth = 0;
            this.canvasHeight = 0;
            this.canvasRatio = 1;
            this.resizeObserver = null;
            this.motionObserver = null;
            this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
            this.displayTimer = null;
            this.lastTimeUiUpdate = 0;
            this.playRequestId = 0;
            this.isLoading = false;
        }

        init() {
            this.windowElement._winampProApp = this;
            this.root._winampProApp = this;
            this.root.tabIndex = 0;
            this.root.setAttribute('aria-label', 'Winamp XP Pro, reproductor de música');

            this.restorePreferences();
            this.updateEqLabels();
            this.renderPlaylist();
            this.bindControls();
            this.prepareTrack();
            this.updateTrackLabels();
            this.updateMixerLabels();
            this.updateToggleButtons();
            this.setupCanvas();
            this.setupMotionPreferences();
            this.setPlaybackState('READY');
            return this;
        }

        bindControls() {
            const signal = this.eventController.signal;
            const action = (name) => this.root.querySelector(`[data-winamp-action="${name}"]`);

            action('play').addEventListener('click', () => this.play(), { signal });
            action('pause').addEventListener('click', () => this.pause(), { signal });
            action('stop').addEventListener('click', () => this.stop(), { signal });
            action('prev').addEventListener('click', () => this.previous(), { signal });
            action('next').addEventListener('click', () => this.next(), { signal });
            action('shuffle').addEventListener('click', () => {
                this.shuffle = !this.shuffle;
                this.updateToggleButtons();
                this.savePreferences();
                this.setStatus(this.shuffle ? 'Reproducción aleatoria activada.' : 'Reproducción aleatoria desactivada.');
            }, { signal });
            action('repeat').addEventListener('click', () => {
                this.repeat = !this.repeat;
                this.updateToggleButtons();
                this.savePreferences();
                this.setStatus(this.repeat ? 'Repetición de canción activada.' : 'Repetición de canción desactivada.');
            }, { signal });
            action('mute').addEventListener('click', () => this.toggleMute(), { signal });
            action('eq-reset').addEventListener('click', () => this.resetEq(), { signal });

            this.seekEl.addEventListener('input', () => {
                const duration = this.currentDuration();
                this.position = duration * (Number(this.seekEl.value) / SEEK_STEPS);
                if (this.currentTrack().kind === 'media') {
                    this.setMediaPosition(this.position);
                } else {
                    this.resetSchedulerPosition();
                }
                this.updateTime();
            }, { signal });

            this.volumeEl.addEventListener('input', () => {
                const value = Number(this.volumeEl.value);
                if (value > 0) {
                    this.muted = false;
                    this.volumeBeforeMute = value;
                }
                this.applyMixer();
                this.updateMixerLabels();
                this.updateToggleButtons();
                this.savePreferences();
            }, { signal });

            this.balanceEl.addEventListener('input', () => {
                this.applyMixer();
                this.updateMixerLabels();
                this.savePreferences();
            }, { signal });

            this.eqInputs.forEach((input) => input.addEventListener('input', () => {
                this.applyEq();
                this.updateEqLabels();
                this.savePreferences();
            }, { signal }));

            this.audio.addEventListener('loadedmetadata', () => {
                if (this.destroyed || this.currentTrack().kind !== 'media') return;
                if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
                    this.currentTrack().duration = this.audio.duration;
                }
                if (this.position > 0) this.setMediaPosition(this.position);
                this.updateTime();
                this.updateTrackLabels();
            }, { signal });

            this.audio.addEventListener('ended', () => this.handleTrackEnded(), { signal });
            this.audio.addEventListener('error', () => {
                if (this.destroyed || !this.audio.getAttribute('src')) return;
                this.handlePlaybackFailure('media', 'No se pudo reproducir este archivo. Verificá que el MP3 esté disponible.');
            }, { signal });

            this.root.addEventListener('keydown', (event) => this.handleKeyboard(event), { signal });
        }

        renderPlaylist() {
            this.playlistEl.replaceChildren();
            const fragment = document.createDocumentFragment();

            this.tracks.forEach((track, index) => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                const number = document.createElement('span');
                const copy = document.createElement('span');
                const title = document.createElement('strong');
                const meta = document.createElement('small');
                const duration = document.createElement('time');

                button.type = 'button';
                button.dataset.trackIndex = String(index);
                button.title = `${track.artist} - ${track.title}`;
                button.setAttribute('aria-label', `Reproducir ${track.title} de ${track.artist}`);
                number.className = 'xp-winamp-track-number';
                number.textContent = String(index + 1).padStart(2, '0');
                copy.className = 'xp-winamp-track-copy';
                title.textContent = track.title;
                meta.textContent = track.playlistMeta;
                duration.dateTime = `PT${Math.round(track.duration)}S`;
                duration.textContent = this.formatTime(track.duration);
                copy.append(title, meta);
                button.append(number, copy, duration);
                item.appendChild(button);
                fragment.appendChild(item);
            });

            this.playlistEl.appendChild(fragment);
            this.playlistSummary.textContent = `${this.tracks.length} pistas - 2 MP3 + 4 loops`;
            this.playlistEl.querySelectorAll('[data-track-index]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.loadTrack(Number(button.dataset.trackIndex), { autoplay: true });
                }, { signal: this.eventController.signal });
            });
        }

        async play() {
            if (this.destroyed || this.isPlaying || this.isLoading) return;
            const track = this.currentTrack();
            const requestId = ++this.playRequestId;
            const trackId = track.id;
            this.isLoading = true;
            this.setPlaybackState('LOAD');
            this.setStatus(`Cargando ${track.title}...`);

            try {
                await this.ensureAudioGraph();
                if (!this.isPlayRequestActive(requestId, trackId)) return;
                if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
                if (!this.isPlayRequestActive(requestId, trackId)) return;

                if (track.kind === 'media') {
                    if (this.audio.dataset.trackId !== track.id) this.prepareTrack();
                    if (this.audio.readyState > 0 && Math.abs(this.audio.currentTime - this.position) > 0.75) {
                        this.setMediaPosition(this.position);
                    }
                    await this.audio.play();
                    if (!this.isPlayRequestActive(requestId, trackId)) {
                        if (!this.isLoading && !this.isPlaying) this.audio.pause();
                        return;
                    }
                } else {
                    this.audio.pause();
                    this.startedAt = this.audioContext.currentTime - this.position;
                    this.nextNoteAt = this.audioContext.currentTime;
                    this.noteIndex = Math.floor(this.position / track.step);
                    this.scheduler = window.setInterval(() => this.scheduleAhead(), 80);
                }

                this.isLoading = false;
                this.isPlaying = true;
                delete this.root.dataset.winampError;
                this.setPlaybackState('PLAY');
                this.setStatus(`Reproduciendo ${track.artist} - ${track.title}.`);
                this.updateTransportState();
                this.startAnimation();
            } catch (error) {
                if (!this.isPlayRequestActive(requestId, trackId)) return;
                if (error?.name === 'AbortError') {
                    this.cancelPendingPlay();
                    this.stopPlaybackWork();
                    this.setPlaybackState('READY');
                    this.setStatus('Reproducción cancelada.');
                    this.updateTransportState();
                    return;
                }
                this.handlePlaybackFailure('playback', `No se pudo iniciar la reproducción: ${error?.message || 'error desconocido'}.`);
            }
        }

        isPlayRequestActive(requestId, trackId) {
            return !this.destroyed
                && this.isLoading
                && requestId === this.playRequestId
                && this.currentTrack().id === trackId;
        }

        cancelPendingPlay() {
            this.playRequestId += 1;
            this.isLoading = false;
        }

        stopPlaybackWork() {
            this.isPlaying = false;
            this.isLoading = false;
            this.clearScheduler();
            this.stopActiveNodes();
            this.stopAnimation();
        }

        handlePlaybackFailure(kind, message) {
            this.cancelPendingPlay();
            this.audio.pause();
            this.stopPlaybackWork();
            this.setPlaybackState('ERROR');
            this.root.dataset.winampError = kind;
            this.setStatus(message);
            this.updateTime();
            this.drawIdle();
            this.updateTransportState();
        }

        pause() {
            if (!this.isPlaying && !this.isLoading) return;
            const track = this.currentTrack();
            this.cancelPendingPlay();
            if (track.kind === 'media') {
                this.position = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : this.position;
                this.audio.pause();
            } else if (this.audioContext) {
                this.position = Math.min(this.currentDuration(), this.audioContext.currentTime - this.startedAt);
            }

            this.stopPlaybackWork();
            this.updateTime();
            this.setPlaybackState('PAUSE');
            this.setStatus(`Pausado en ${this.formatTime(this.position)}.`);
            this.updateTransportState();
        }

        stop() {
            this.stopPlayback({ reset: true });
            delete this.root.dataset.winampError;
            this.setPlaybackState('STOP');
            this.setStatus('Reproducción detenida.');
        }

        stopPlayback({ reset = false, announce = false } = {}) {
            this.cancelPendingPlay();
            if (this.currentTrack().kind === 'media') this.audio.pause();
            this.stopPlaybackWork();
            if (reset) {
                this.position = 0;
                if (this.currentTrack().kind === 'media') this.setMediaPosition(0);
            }
            this.updateTime();
            this.drawIdle();
            this.updateTransportState();
            if (announce) this.setStatus('Reproducción detenida.');
        }

        previous() {
            const shouldPlay = this.isPlaying || this.isLoading;
            if (this.position > 3) {
                this.position = 0;
                if (this.currentTrack().kind === 'media') this.setMediaPosition(0);
                else this.resetSchedulerPosition();
                this.updateTime();
                this.setStatus('Volviste al inicio de la pista.');
                return;
            }
            const index = this.trackIndex === 0 ? this.tracks.length - 1 : this.trackIndex - 1;
            this.loadTrack(index, { autoplay: shouldPlay });
        }

        next({ autoplay = this.isPlaying || this.isLoading } = {}) {
            let nextIndex;
            if (this.shuffle && this.tracks.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * this.tracks.length);
                } while (nextIndex === this.trackIndex);
            } else {
                nextIndex = (this.trackIndex + 1) % this.tracks.length;
            }
            this.loadTrack(nextIndex, { autoplay });
        }

        loadTrack(index, { autoplay = false } = {}) {
            if (this.destroyed) return;
            const normalized = ((Number(index) % this.tracks.length) + this.tracks.length) % this.tracks.length;
            this.stopPlayback({ reset: true });
            this.trackIndex = normalized;
            this.position = 0;
            this.prepareTrack();
            this.updateTrackLabels();
            delete this.root.dataset.winampError;
            this.setPlaybackState('READY');
            this.setStatus(`${this.currentTrack().artist} - ${this.currentTrack().title}, listo para reproducir.`);
            if (autoplay) void this.play();
        }

        prepareTrack() {
            const track = this.currentTrack();
            if (track.kind === 'media') {
                if (this.audio.dataset.trackId !== track.id) {
                    this.audio.pause();
                    this.audio.dataset.trackId = track.id;
                    this.audio.src = track.src;
                    this.audio.load();
                }
            } else {
                this.audio.pause();
                this.audio.removeAttribute('src');
                delete this.audio.dataset.trackId;
                this.audio.load();
            }
            this.root.dataset.winampTrackKind = track.kind;
        }

        async ensureAudioGraph() {
            if (this.audioContext) return;
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) throw new Error('El navegador no ofrece Web Audio API');

            this.audioContext = new AudioContextClass();
            this.bass = this.audioContext.createBiquadFilter();
            this.bass.type = 'lowshelf';
            this.bass.frequency.value = 60;
            this.mid = this.audioContext.createBiquadFilter();
            this.mid.type = 'peaking';
            this.mid.frequency.value = 1000;
            this.mid.Q.value = 0.9;
            this.treble = this.audioContext.createBiquadFilter();
            this.treble.type = 'highshelf';
            this.treble.frequency.value = 14000;
            this.panner = typeof this.audioContext.createStereoPanner === 'function'
                ? this.audioContext.createStereoPanner()
                : null;
            this.gain = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.76;

            this.bass.connect(this.mid);
            this.mid.connect(this.treble);
            if (this.panner) {
                this.treble.connect(this.panner);
                this.panner.connect(this.gain);
            } else {
                this.treble.connect(this.gain);
            }
            this.gain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.mediaSource = this.audioContext.createMediaElementSource(this.audio);
            this.mediaSource.connect(this.bass);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.applyMixer();
            this.applyEq();
        }

        scheduleAhead() {
            if (!this.isPlaying && this.scheduler === null) return;
            const track = this.currentTrack();
            if (track.kind !== 'synth' || !this.audioContext) return;

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
            if (this.destroyed || !this.audioContext) return;
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
            if (this.destroyed) return;
            this.isPlaying = false;
            this.clearScheduler();
            this.stopActiveNodes();
            if (this.repeat) {
                this.position = 0;
                if (this.currentTrack().kind === 'media') this.setMediaPosition(0);
                this.updateTime();
                void this.play();
            } else {
                this.next({ autoplay: true });
            }
        }

        seekBy(seconds) {
            const duration = this.currentDuration();
            this.position = Math.max(0, Math.min(duration, this.position + seconds));
            if (this.currentTrack().kind === 'media') this.setMediaPosition(this.position);
            else this.resetSchedulerPosition();
            this.updateTime();
            this.setStatus(`${seconds >= 0 ? 'Avance' : 'Retroceso'} a ${this.formatTime(this.position)}.`);
        }

        setMediaPosition(seconds) {
            if (this.currentTrack().kind !== 'media') return;
            const duration = this.currentDuration();
            const value = Math.max(0, Math.min(duration, Number(seconds) || 0));
            if (this.audio.readyState > 0) {
                try {
                    this.audio.currentTime = value;
                } catch (_error) { /* Metadata can still be loading. */ }
            }
        }

        resetSchedulerPosition() {
            if (!this.audioContext || !this.isPlaying || this.currentTrack().kind !== 'synth') return;
            this.stopActiveNodes();
            this.startedAt = this.audioContext.currentTime - this.position;
            this.nextNoteAt = this.audioContext.currentTime;
            this.noteIndex = Math.floor(this.position / this.currentTrack().step);
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) {
                const currentVolume = Number(this.volumeEl.value);
                if (currentVolume > 0) this.volumeBeforeMute = currentVolume;
            } else if (Number(this.volumeEl.value) === 0) {
                this.volumeEl.value = String(this.volumeBeforeMute || 70);
            }
            this.applyMixer();
            this.updateMixerLabels();
            this.updateToggleButtons();
            this.savePreferences();
            this.setStatus(this.muted ? 'Audio silenciado.' : `Volumen restaurado al ${this.volumeEl.value}%.`);
        }

        applyMixer() {
            const volume = this.muted ? 0 : Number(this.volumeEl.value) / 100;
            if (this.gain) this.gain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
            if (this.panner) this.panner.pan.setTargetAtTime(Number(this.balanceEl.value) / 100, this.audioContext.currentTime, 0.01);
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

        updateEqLabels() {
            this.eqInputs.forEach((input) => {
                const value = Number(input.value);
                const formatted = `${value > 0 ? '+' : ''}${value} dB`;
                const output = this.eqOutputs.get(input.dataset.eqBand);
                if (output) output.textContent = formatted;
                input.setAttribute('aria-valuetext', formatted);
            });
        }

        resetEq() {
            this.eqInputs.forEach((input) => { input.value = '0'; });
            this.applyEq();
            this.updateEqLabels();
            this.savePreferences();
            this.setStatus('Ecualizador restablecido a 0 dB.');
        }

        setupMotionPreferences() {
            const restartDisplay = () => {
                if (this.isPlaying) this.startAnimation();
            };
            this.motionQuery?.addEventListener?.('change', restartDisplay, { signal: this.eventController.signal });
            if ('MutationObserver' in window) {
                this.motionObserver = new MutationObserver(restartDisplay);
                this.motionObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }
        }

        prefersReducedMotion() {
            return Boolean(this.motionQuery?.matches || document.body.classList.contains('xp-no-animations'));
        }

        setupCanvas() {
            const resize = () => {
                this.resizeCanvas();
                if (!this.isPlaying) this.drawIdle();
            };
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(resize);
                this.resizeObserver.observe(this.canvas);
            }
            window.requestAnimationFrame(resize);
        }

        resizeCanvas() {
            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, Math.round(rect.width));
            const cssHeight = Math.max(1, Math.round(rect.height));
            const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
            const nextWidth = Math.round(cssWidth * ratio);
            const nextHeight = Math.round(cssHeight * ratio);
            if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
                this.canvas.width = nextWidth;
                this.canvas.height = nextHeight;
            }
            this.canvasWidth = cssWidth;
            this.canvasHeight = cssHeight;
            this.canvasRatio = ratio;
            this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        startAnimation() {
            this.stopAnimation();
            this.lastTimeUiUpdate = 0;
            const renderReducedFrame = () => {
                if (!this.isPlaying || this.destroyed) return;
                this.updateTime();
                this.drawSpectrum();
            };

            if (this.prefersReducedMotion()) {
                renderReducedFrame();
                this.displayTimer = window.setInterval(renderReducedFrame, 500);
                return;
            }

            const frame = (timestamp) => {
                if (!this.isPlaying || this.destroyed) return;
                if (timestamp - this.lastTimeUiUpdate >= 125) {
                    this.updateTime();
                    this.lastTimeUiUpdate = timestamp;
                }
                this.drawSpectrum();
                this.raf = window.requestAnimationFrame(frame);
            };
            this.raf = window.requestAnimationFrame(frame);
        }

        stopAnimation() {
            if (this.raf !== null) window.cancelAnimationFrame(this.raf);
            this.raf = null;
            if (this.displayTimer !== null) window.clearInterval(this.displayTimer);
            this.displayTimer = null;
        }

        drawSpectrum() {
            const width = this.canvasWidth || this.canvas.clientWidth;
            const height = this.canvasHeight || this.canvas.clientHeight;
            if (!width || !height) return;
            this.drawDisplayBackground(width, height);

            const spectrumTop = Math.max(84, Math.floor(height * 0.58));
            const spectrumHeight = Math.max(18, height - spectrumTop - 7);
            const gap = 2;
            const barWidth = 4;
            const barCount = Math.max(16, Math.floor((width - 16) / (barWidth + gap)));
            const values = this.frequencyData;
            if (this.analyser && values) this.analyser.getByteFrequencyData(values);
            const gradient = this.ctx.createLinearGradient(0, spectrumTop, 0, spectrumTop + spectrumHeight);
            gradient.addColorStop(0, '#f4e75c');
            gradient.addColorStop(0.38, '#71dc62');
            gradient.addColorStop(1, '#159447');
            this.ctx.fillStyle = gradient;

            for (let index = 0; index < barCount; index += 1) {
                const dataIndex = values ? Math.min(values.length - 1, Math.floor((index / barCount) * values.length)) : 0;
                const value = values ? values[dataIndex] : 0;
                const normalized = Math.max(0.04, value / 255);
                const barHeight = Math.max(2, normalized * spectrumHeight);
                const x = 8 + index * (barWidth + gap);
                const y = spectrumTop + spectrumHeight - barHeight;
                this.ctx.fillRect(x, y, barWidth, barHeight);
            }
        }

        drawIdle() {
            const width = this.canvasWidth || this.canvas.clientWidth;
            const height = this.canvasHeight || this.canvas.clientHeight;
            if (!width || !height) return;
            this.drawDisplayBackground(width, height);
            const spectrumTop = Math.max(84, Math.floor(height * 0.58));
            const spectrumHeight = Math.max(18, height - spectrumTop - 7);
            const gap = 3;
            const barWidth = 4;
            const barCount = Math.max(12, Math.floor((width - 16) / (barWidth + gap)));
            for (let index = 0; index < barCount; index += 1) {
                const pattern = (index * 17 + this.trackIndex * 11) % 19;
                const barHeight = 2 + (pattern / 19) * spectrumHeight * 0.38;
                const x = 8 + index * (barWidth + gap);
                this.ctx.fillStyle = index % 5 === 0 ? '#668d3c' : '#234f32';
                this.ctx.fillRect(x, spectrumTop + spectrumHeight - barHeight, barWidth, barHeight);
            }
        }

        drawDisplayBackground(width, height) {
            this.ctx.clearRect(0, 0, width, height);
            const background = this.ctx.createLinearGradient(0, 0, 0, height);
            background.addColorStop(0, '#08110c');
            background.addColorStop(1, '#020604');
            this.ctx.fillStyle = background;
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.strokeStyle = 'rgba(88, 139, 86, 0.14)';
            this.ctx.lineWidth = 1;
            for (let x = 8; x < width; x += 16) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + 0.5, Math.max(80, height * 0.56));
                this.ctx.lineTo(x + 0.5, height);
                this.ctx.stroke();
            }
        }

        updateTime() {
            const track = this.currentTrack();
            if (this.isPlaying) {
                if (track.kind === 'media') {
                    if (Number.isFinite(this.audio.currentTime)) this.position = this.audio.currentTime;
                } else if (this.audioContext) {
                    this.position = Math.min(this.currentDuration(), this.audioContext.currentTime - this.startedAt);
                }
            }
            const duration = this.currentDuration();
            const safePosition = Math.max(0, Math.min(duration, this.position));
            const remaining = Math.max(0, duration - safePosition);
            this.seekEl.value = duration ? String(Math.round((safePosition / duration) * SEEK_STEPS)) : '0';
            this.currentTimeEl.textContent = this.formatTime(safePosition);
            this.durationEl.textContent = this.formatTime(duration);
            this.timeEl.textContent = this.formatTime(safePosition);
            this.remainingEl.textContent = `-${this.formatTime(remaining)}`;
        }

        updateTrackLabels() {
            const track = this.currentTrack();
            this.titleEl.textContent = track.title;
            this.titleEl.title = track.title;
            this.artistEl.textContent = track.artist;
            this.metaEl.textContent = track.meta;
            this.counterEl.textContent = `TRACK ${String(this.trackIndex + 1).padStart(2, '0')} / ${String(this.tracks.length).padStart(2, '0')}`;
            this.modeEl.textContent = track.kind === 'media' ? 'ARCHIVO LOCAL · MP3' : 'GENERADOR · WEB AUDIO';
            this.playlistEl.querySelectorAll('[data-track-index]').forEach((button) => {
                const active = Number(button.dataset.trackIndex) === this.trackIndex;
                button.classList.toggle('active', active);
                if (active) button.setAttribute('aria-current', 'true');
                else button.removeAttribute('aria-current');
            });
            this.updateTime();
            this.drawIdle();
        }

        updateMixerLabels() {
            const volume = Number(this.volumeEl.value);
            this.volumeOutput.textContent = this.muted ? 'MUTE' : `${volume}%`;
            const balance = Number(this.balanceEl.value);
            this.balanceOutput.textContent = balance === 0
                ? 'CENTRO'
                : balance < 0
                    ? `IZQ ${Math.abs(balance)}%`
                    : `DER ${balance}%`;
        }

        updateToggleButtons() {
            const shuffleButton = this.root.querySelector('[data-winamp-action="shuffle"]');
            const repeatButton = this.root.querySelector('[data-winamp-action="repeat"]');
            const muteButton = this.root.querySelector('[data-winamp-action="mute"]');
            this.setToggleState(shuffleButton, this.shuffle);
            this.setToggleState(repeatButton, this.repeat);
            this.setToggleState(muteButton, this.muted);
        }

        setToggleState(button, active) {
            if (!button) return;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        }

        updateTransportState() {
            const play = this.root.querySelector('[data-winamp-action="play"]');
            const pause = this.root.querySelector('[data-winamp-action="pause"]');
            play.classList.toggle('active', this.isPlaying);
            pause.classList.toggle('active', this.root.dataset.winampState === 'pause');
        }

        setPlaybackState(state) {
            this.stateEl.textContent = state;
            this.root.dataset.winampState = state.toLowerCase();
        }

        handleKeyboard(event) {
            if (event.target.matches('input, button, select, textarea, a')) return;
            if (event.code === 'Space') {
                event.preventDefault();
                if (this.isPlaying) this.pause();
                else void this.play();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.seekBy(5);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.seekBy(-5);
            } else if (event.key.toLowerCase() === 'm') {
                event.preventDefault();
                this.toggleMute();
            }
        }

        currentTrack() {
            return this.tracks[this.trackIndex];
        }

        currentDuration() {
            const track = this.currentTrack();
            if (track.kind === 'media' && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
                return this.audio.duration;
            }
            return Number(track.duration) || 0;
        }

        clearScheduler() {
            if (this.scheduler !== null) window.clearInterval(this.scheduler);
            this.scheduler = null;
        }

        stopActiveNodes() {
            this.activeNodes.forEach((node) => {
                try {
                    node.stop();
                } catch (_error) { /* The node may have ended naturally. */ }
            });
            this.activeNodes.clear();
        }

        setStatus(message) {
            this.statusEl.textContent = message;
        }

        formatTime(seconds) {
            const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
            const minutes = Math.floor(safeSeconds / 60);
            const remaining = safeSeconds % 60;
            return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
        }

        restorePreferences() {
            try {
                const preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                if (Number.isFinite(Number(preferences.volume))) this.volumeEl.value = String(Math.max(0, Math.min(100, Number(preferences.volume))));
                if (Number.isFinite(Number(preferences.balance))) this.balanceEl.value = String(Math.max(-100, Math.min(100, Number(preferences.balance))));
                this.shuffle = preferences.shuffle === true;
                this.repeat = preferences.repeat === true;
                this.muted = preferences.muted === true;
                this.eqInputs.forEach((input) => {
                    const value = Number(preferences.eq?.[input.dataset.eqBand]);
                    if (Number.isFinite(value)) input.value = String(Math.max(-12, Math.min(12, value)));
                });
            } catch (_error) { /* Preferences are optional. */ }
        }

        savePreferences() {
            try {
                const eq = Object.fromEntries(this.eqInputs.map((input) => [input.dataset.eqBand, Number(input.value)]));
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    volume: Number(this.volumeEl.value),
                    balance: Number(this.balanceEl.value),
                    shuffle: this.shuffle,
                    repeat: this.repeat,
                    muted: this.muted,
                    eq
                }));
            } catch (_error) { /* Storage can be disabled. */ }
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.eventController.abort();
            this.stopPlayback({ reset: true });
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
            this.motionObserver?.disconnect();
            this.motionObserver = null;
            this.audio.removeAttribute('src');
            this.audio.load();
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close().catch(() => {});
            }
            if (this.windowElement._winampProApp === this) this.windowElement._winampProApp = null;
            if (this.root._winampProApp === this) this.root._winampProApp = null;
        }
    }

    window.initWinampProApp = function initWinampProApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-winamp-root]') ? scope : document;
        rootWindow._winampProApp?.destroy();
        const app = new WinampProApp(rootWindow);
        app.init();
        rootWindow._winampProApp = app;
        return app;
    };

    window.destroyWinampProApp = function destroyWinampProApp(scope = document) {
        scope?._winampProApp?.destroy();
        if (scope) scope._winampProApp = null;
    };
})();
