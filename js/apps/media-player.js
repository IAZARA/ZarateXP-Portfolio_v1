// Reproductor estilo Windows Media con el video autobiográfico "Mi historia". Se carga bajo demanda
// la primera vez que se abre (ver AppManager._loadAppMethods en js/apps.js). El video se arma en
// video/mi-historia con HyperFrames; acá solo se reproduce la versión web de assets/video.
const TRACKS = [
    { id: 'es', title: 'Mi historia', detail: 'Voz en español', src: 'assets/video/mi-historia-es.mp4', poster: 'assets/video/mi-historia-es.jpg' },
    { id: 'en', title: 'My story', detail: 'Voz en español · subtítulos en inglés', src: 'assets/video/mi-historia-en.mp4', poster: 'assets/video/mi-historia-en.jpg' }
];
const DURATION_LABEL = '0:47';

const ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.4v12H6zM9.5 12L18 6v12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.6 6H18v12h-2.4zM6 6l8.5 6L6 18z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function trackForLocale(locale) {
    return TRACKS.find((track) => track.id === (locale === 'en' ? 'en' : 'es'));
}

export default function createMethods() {
    return {
        _openMediaPlayer() {
            const initial = trackForLocale(window.zarateXP?.i18nManager?.locale);
            const playlist = TRACKS.map((track) => `
                <li>
                    <button type="button" class="wmp-track" data-wmp-track="${track.id}" aria-pressed="${track.id === initial.id}">
                        <span class="wmp-track-title">${track.title}</span>
                        <span class="wmp-track-detail">${track.detail}</span>
                        <span class="wmp-track-time">${DURATION_LABEL}</span>
                    </button>
                </li>`).join('');

            const content = `
                <div class="wmp" data-wmp>
                    <div class="wmp-bar">
                        <span class="wmp-tab">Reproducción en curso</span>
                        <span class="wmp-now" data-wmp-now>${initial.title}</span>
                    </div>
                    <div class="wmp-body">
                        <div class="wmp-screen">
                            <video data-wmp-video playsinline preload="metadata" poster="${initial.poster}" src="${initial.src}" aria-label="Video autobiográfico de Ivan Agustin Zarate"></video>
                            <button type="button" class="wmp-big-play" data-wmp-big-play aria-label="Reproducir">${ICONS.play}</button>
                        </div>
                        <aside class="wmp-list" aria-label="Lista de reproducción">
                            <h3>Lista de reproducción</h3>
                            <ol>${playlist}</ol>
                            <p class="wmp-list-note">La historia en la voz de Ivan Agustin Zarate: seguridad pública, datos críticos, arquitectura de IA y Atlas Urbano.</p>
                            <button type="button" class="wmp-profile" data-route-app="recruiter-route">Ver perfil</button>
                            <p class="wmp-credit">Música: <a href="https://freesound.org/people/tyops/sounds/388321/" target="_blank" rel="noopener noreferrer">Ambient Documentary Build up</a>, de tyops (CC BY 4.0).</p>
                        </aside>
                    </div>
                    <div class="wmp-seek">
                        <input type="range" min="0" max="1000" value="0" step="1" data-wmp-seek aria-label="Posición del video">
                    </div>
                    <div class="wmp-controls">
                        <button type="button" class="wmp-btn wmp-play" data-wmp-play aria-label="Reproducir">${ICONS.play}</button>
                        <button type="button" class="wmp-btn" data-wmp-stop aria-label="Detener">${ICONS.stop}</button>
                        <button type="button" class="wmp-btn" data-wmp-prev aria-label="Anterior">${ICONS.prev}</button>
                        <button type="button" class="wmp-btn" data-wmp-next aria-label="Siguiente">${ICONS.next}</button>
                        <button type="button" class="wmp-btn" data-wmp-mute aria-label="Silenciar">${ICONS.volume}</button>
                        <input type="range" class="wmp-volume" min="0" max="100" value="90" data-wmp-volume aria-label="Volumen">
                        <span class="wmp-status"><span data-wmp-state>Listo</span> <span class="wmp-time" data-wmp-time>0:00 / ${DURATION_LABEL}</span></span>
                        <button type="button" class="wmp-btn" data-wmp-fullscreen aria-label="Pantalla completa">${ICONS.fullscreen}</button>
                    </div>
                </div>
            `;

            let cleanup = null;
            return this._createSingleInstanceWindow({
                id: 'media-player',
                title: 'Reproductor de Windows Media - Mi historia',
                icon: './assets/images/hd-icons/media-player.svg',
                content,
                width: 980,
                height: 660,
                onReady: (appWindow) => {
                    cleanup = this._bindMediaPlayer(appWindow, initial);
                },
                onClose: (appWindow) => {
                    appWindow.querySelector('[data-wmp-video]')?.pause();
                    cleanup?.();
                }
            });
        },

        _bindMediaPlayer(appWindow, initial) {
            const root = appWindow.querySelector('[data-wmp]');
            const video = root?.querySelector('[data-wmp-video]');
            if (!root || !video) return null;

            const $ = (selector) => root.querySelector(selector);
            const playButton = $('[data-wmp-play]');
            const bigPlay = $('[data-wmp-big-play]');
            const seek = $('[data-wmp-seek]');
            const volume = $('[data-wmp-volume]');
            const mute = $('[data-wmp-mute]');
            const state = $('[data-wmp-state]');
            const time = $('[data-wmp-time]');
            const now = $('[data-wmp-now]');
            let current = initial;
            let seeking = false;

            const setState = (label) => { state.dataset.state = label; state.textContent = label; };
            const render = () => {
                const playing = !video.paused && !video.ended;
                playButton.innerHTML = playing ? ICONS.pause : ICONS.play;
                playButton.setAttribute('aria-label', playing ? 'Pausa' : 'Reproducir');
                bigPlay.hidden = playing;
                root.classList.toggle('is-playing', playing);
            };
            const renderTime = () => {
                const duration = video.duration || 0;
                if (!seeking) seek.value = duration ? String(Math.round((video.currentTime / duration) * 1000)) : '0';
                seek.style.setProperty('--wmp-progress', `${Number(seek.value) / 10}%`);
                time.textContent = `${formatTime(video.currentTime)} / ${duration ? formatTime(duration) : DURATION_LABEL}`;
            };
            const renderVolume = () => {
                const silent = video.muted || video.volume === 0;
                mute.innerHTML = silent ? ICONS.muted : ICONS.volume;
                mute.setAttribute('aria-label', silent ? 'Activar sonido' : 'Silenciar');
                volume.style.setProperty('--wmp-progress', `${video.muted ? 0 : Math.round(video.volume * 100)}%`);
            };
            const select = (track, { autoplay = false } = {}) => {
                if (!track) return;
                const wasPlaying = !video.paused && !video.ended;
                current = track;
                root.querySelectorAll('[data-wmp-track]').forEach((button) => {
                    button.setAttribute('aria-pressed', String(button.dataset.wmpTrack === track.id));
                });
                now.textContent = track.title;
                if (video.getAttribute('src') !== track.src) {
                    video.pause();
                    video.poster = track.poster;
                    video.src = track.src;
                    setState('Listo');
                }
                if (autoplay || wasPlaying) video.play().catch(() => {});
                renderTime();
                render();
            };
            const toggle = () => {
                if (video.paused || video.ended) video.play().catch(() => {});
                else video.pause();
            };
            const step = (offset) => {
                const index = TRACKS.indexOf(current);
                select(TRACKS[(index + offset + TRACKS.length) % TRACKS.length], { autoplay: true });
            };

            video.volume = 0.9;
            playButton.addEventListener('click', toggle);
            bigPlay.addEventListener('click', toggle);
            video.addEventListener('click', toggle);
            $('[data-wmp-stop]').addEventListener('click', () => {
                video.pause();
                video.currentTime = 0;
                setState('Detenido');
            });
            $('[data-wmp-prev]').addEventListener('click', () => {
                if (video.currentTime > 3) video.currentTime = 0;
                else step(-1);
            });
            $('[data-wmp-next]').addEventListener('click', () => step(1));
            root.querySelectorAll('[data-wmp-track]').forEach((button) => {
                button.addEventListener('click', () => select(TRACKS.find((track) => track.id === button.dataset.wmpTrack), { autoplay: true }));
            });
            mute.addEventListener('click', () => { video.muted = !video.muted; });
            volume.addEventListener('input', () => {
                video.volume = Number(volume.value) / 100;
                video.muted = video.volume === 0;
            });
            seek.addEventListener('input', () => {
                seeking = true;
                seek.style.setProperty('--wmp-progress', `${Number(seek.value) / 10}%`);
                if (video.duration) time.textContent = `${formatTime((Number(seek.value) / 1000) * video.duration)} / ${formatTime(video.duration)}`;
            });
            seek.addEventListener('change', () => {
                if (video.duration) video.currentTime = (Number(seek.value) / 1000) * video.duration;
                seeking = false;
            });
            $('[data-wmp-fullscreen]').addEventListener('click', () => {
                const screen = $('.wmp-screen');
                if (document.fullscreenElement) document.exitFullscreen?.();
                else (screen.requestFullscreen?.() || video.webkitEnterFullscreen?.());
            });
            appWindow.querySelector('[data-route-app]')?.addEventListener('click', () => this.openApp('recruiter-route'));

            video.addEventListener('play', () => { setState('Reproduciendo'); render(); });
            video.addEventListener('pause', () => { if (!video.ended && state.dataset.state === 'Reproduciendo') setState('En pausa'); render(); });
            video.addEventListener('ended', () => { setState('Terminado'); render(); });
            video.addEventListener('waiting', () => setState('Almacenando en búfer'));
            video.addEventListener('playing', () => setState('Reproduciendo'));
            video.addEventListener('timeupdate', renderTime);
            video.addEventListener('loadedmetadata', renderTime);
            video.addEventListener('volumechange', renderVolume);

            const onLocaleChange = (event) => {
                if (video.paused) select(trackForLocale(event.detail?.locale));
            };
            window.addEventListener('zaratexp:localechange', onLocaleChange);

            render();
            renderTime();
            renderVolume();
            return () => window.removeEventListener('zaratexp:localechange', onLocaleChange);
        },
    };
}
