// Links directos: https://.../#cv abre el CV sin pasar por el arranque ni el login.
// Se aceptan alias en español e inglés y también el id interno de cada app.
const DEEP_LINK_ALIASES = {
    perfil: 'recruiter-route',
    profile: 'recruiter-route',
    cv: 'resume',
    resume: 'resume',
    curriculum: 'resume',
    proyectos: 'projects',
    projects: 'projects',
    contacto: 'contact',
    contact: 'contact',
    certificados: 'certificates',
    certificates: 'certificates',
    documentos: 'documents',
    documents: 'documents',
    'sobre-mi': 'about-me',
    about: 'about-me',
    'mi-pc': 'my-computer',
    api: 'api-center',
    n8n: 'n8n-flows',
    mlops: 'n8n-flows',
    github: 'github-activity',
    winamp: 'winamp',
    pinball: 'pinball',
    buscaminas: 'minesweeper',
    minesweeper: 'minesweeper',
    solitario: 'solitaire',
    solitaire: 'solitaire',
    paint: 'paint'
};

const DEEP_LINK_APP_IDS = new Set(Object.values(DEEP_LINK_ALIASES).concat([
    'about-me',
    'my-computer',
    'api-center',
    'n8n-flows',
    'github-activity',
    'recruiter-route',
    'notepad',
    'pdf-studio'
]));

export function resolveDeepLink(hash = window.location.hash) {
    let key;
    try {
        key = decodeURIComponent(String(hash || '').replace(/^#\/?/, '')).trim().toLowerCase();
    } catch {
        // Un fragmento mal codificado se ignora, igual que un enlace desconocido.
        return null;
    }
    if (!key) return null;
    if (Object.hasOwn(DEEP_LINK_ALIASES, key)) return DEEP_LINK_ALIASES[key];
    return DEEP_LINK_APP_IDS.has(key) ? key : null;
}
