import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CORE_TRANSLATIONS } from '../js/i18n/catalog-core.js';
import { APP_TRANSLATIONS } from '../js/i18n/catalog-apps.js';
import { PROJECT_TRANSLATIONS } from '../js/i18n/catalog-projects.js';
import { getProjectsData } from '../js/data/projects.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogs = [CORE_TRANSLATIONS, APP_TRANSLATIONS, PROJECT_TRANSLATIONS];
const entries = catalogs.flatMap((catalog) => Object.entries(catalog));
const normalized = new Map();
const errors = [];

for (const [source, target] of entries) {
    const key = source.trim();
    const value = String(target).trim();
    if (!key || !value) errors.push(`Empty i18n entry: ${JSON.stringify(source)}`);
    if (/[–—]/.test(value)) errors.push(`Unsupported dash in translation: ${key}`);
    if (normalized.has(key) && normalized.get(key) !== value) {
        errors.push(`Conflicting translation for: ${key}`);
    }
    normalized.set(key, value);
}

const requiredTranslations = new Map([
    ['Mi PC', 'My Computer'],
    ['Mostrar escritorio', 'Show Desktop'],
    ['Restaurar ventanas', 'Restore windows'],
    ['Mis Proyectos', 'My Projects'],
    ['Buscaminas', 'Minesweeper'],
    ['Mis Certificados', 'My Certificates'],
    ['Destacados FDE', 'FDE Highlights'],
    ['IA, Datos y Dev', 'AI, Data & Dev'],
    ['Claude Code 101', 'Claude Code 101'],
    ['AI Capabilities and Limitations', 'AI Capabilities and Limitations'],
    ['Fundamentos de la gestión de proyectos', 'Foundations of Project Management'],
    ['Operador de Drones en ArcGIS', 'Drone Operator in ArcGIS'],
    ['Catálogo online de insumos profesionales para tattoo en Argentina', 'Online catalog of professional tattoo supplies in Argentina'],
    ['Sitio institucional jurídico-contable para profesionales y empresas', 'Legal and accounting institutional site for professionals and businesses']
]);

for (const [source, expected] of requiredTranslations) {
    if (normalized.get(source) !== expected) errors.push(`Missing required translation: ${source}`);
}

if (normalized.size < 1000) errors.push(`Translation coverage too small: ${normalized.size}`);

const projects = getProjectsData('root');
const repositoryUrls = new Set(projects.map((project) => project.repositoryUrl).filter(Boolean));
const requiredRepositories = [
    'https://github.com/IAZARA/ZarateXP-Portfolio_v1',
    'https://github.com/IAZARA/Auto-Inbox',
    'https://github.com/IAZARA/OSINTArgy_v01',
    'https://github.com/IAZARA/SEO-Evaluate',
    'https://github.com/IAZARA/cyberdetective-academy',
    'https://github.com/IAZARA/DesanjuntarPDF',
    'https://github.com/IAZARA/Juego_Ciberseguridad',
    'https://github.com/IAZARA/Radar_Empleo',
    'https://github.com/IAZARA/workflow-black-box'
];

for (const url of requiredRepositories) {
    if (!repositoryUrls.has(url)) errors.push(`Missing public repository project: ${url}`);
}

if (projects.some((project) => /limpia/i.test(`${project.id} ${project.name}`))) {
    errors.push('Limpia-Limpia is still present');
}
if (!projects.some((project) => project.url === 'https://www.cap21.com.ar/')) {
    errors.push('CAP-21 project is missing');
}

const englishCv = path.join(root, 'Ivan_Zarate_CV_EN.pdf');
if (!fs.existsSync(englishCv) || fs.statSync(englishCv).size < 20_000) {
    errors.push('English CV PDF is missing or unexpectedly small');
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const marker of ['data-language-switcher', 'data-language-option="es"', 'data-language-option="en"', 'id="show-desktop-button"']) {
    if (!index.includes(marker)) errors.push(`Missing interface marker: ${marker}`);
}

const certificatesSource = fs.readFileSync(path.join(root, 'js/data/certificates.js'), 'utf8');
const certificateIds = [...certificatesSource.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
if (certificateIds.length !== 16 || new Set(certificateIds).size !== 16) {
    errors.push(`Certificate catalog must contain 16 unique credentials, found ${certificateIds.length}`);
}

for (const file of [
    'assets/certificates/originals/claude-code-101.jpg',
    'assets/certificates/originals/claude-ai-capabilities-limitations.jpg',
    'assets/certificates/originals/google-ai-professional-certificate.pdf',
    'assets/certificates/originals/google-project-management-foundations.pdf',
    'assets/certificates/originals/google-data-analytics-professional-certificate.pdf',
    'assets/certificates/originals/arcgis-learning-path.pdf',
    'assets/certificates/originals/arcgis-drone-operator.jpg',
    'assets/certificates/originals/sap-introducing-ai-fundamentals.png',
    'assets/certificates/originals/sap-introducing-joule.png',
    'assets/certificates/originals/sap-sports-one-medical-return-to-play.png',
    'assets/certificates/originals/asis-security-defense-virtuality.png',
    'assets/certificates/originals/unodc-online-terrorism-investigation-workshop.png'
]) {
    if (!fs.existsSync(path.join(root, file)) || fs.statSync(path.join(root, file)).size < 20_000) {
        errors.push(`Certificate evidence is missing or unexpectedly small: ${file}`);
    }
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}

console.log(`i18n and project checks passed: ${normalized.size} translations, ${projects.length} projects, ${requiredRepositories.length} public repositories`);
