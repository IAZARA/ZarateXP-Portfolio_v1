// Video de presentación ("Mi PC": zoom por la carrera). Se carga bajo demanda la primera vez que se abre
// (ver AppManager._loadAppMethods en js/apps.js). El video se arma en video/mi-pc con HyperFrames.
const SOURCES = {
    es: { src: 'assets/video/mi-pc-es.mp4', poster: 'assets/video/mi-pc-es.jpg' },
    en: { src: 'assets/video/mi-pc-en.mp4', poster: 'assets/video/mi-pc-en.jpg' }
};

export default function createMethods() {
    return {
        _openPresentation() {
            const locale = window.zarateXP?.i18nManager?.locale === 'en' ? 'en' : 'es';
            const { src, poster } = SOURCES[locale];
            const content = `
                <div class="xp-presentation">
                    <div class="xp-presentation-screen">
                        <video data-presentation-video controls playsinline preload="metadata" poster="${poster}" src="${src}" aria-label="Video de presentación de Ivan Agustin Zarate"></video>
                    </div>
                    <div class="xp-presentation-info">
                        <div>
                            <strong>¿Qué hay en mi PC?</strong>
                            <span>Un recorrido de 37 segundos por mi carrera: seguridad pública, datos críticos, arquitectura de IA e investigación.</span>
                        </div>
                        <button type="button" data-route-app="recruiter-route">Ver perfil</button>
                    </div>
                </div>
            `;

            let onLocaleChange = null;
            return this._createSingleInstanceWindow({
                id: 'presentation',
                title: 'Mi presentación - Ivan Agustin Zarate',
                icon: './assets/images/hd-icons/presentation.svg',
                content,
                width: 960,
                height: 630,
                onReady: (appWindow) => {
                    appWindow.querySelector('[data-route-app]')?.addEventListener('click', () => this.openApp('recruiter-route'));
                    const video = appWindow.querySelector('[data-presentation-video]');
                    onLocaleChange = (event) => {
                        const next = SOURCES[event.detail?.locale === 'en' ? 'en' : 'es'];
                        if (!video || video.getAttribute('src') === next.src) return;
                        video.pause();
                        video.poster = next.poster;
                        video.src = next.src;
                    };
                    window.addEventListener('zaratexp:localechange', onLocaleChange);
                },
                onClose: (appWindow) => {
                    appWindow.querySelector('[data-presentation-video]')?.pause();
                    if (onLocaleChange) window.removeEventListener('zaratexp:localechange', onLocaleChange);
                }
            });
        },
    };
}
