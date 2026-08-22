const DATA_URL = './assets/data/github-activity.json?v=zaratexp-20260822-private-safe';
const MAX_SNAPSHOT_AGE_MS = 72 * 60 * 60 * 1000;
let activityPromise = null;

const COPY = {
  es: {
    loading: 'Verificando actividad de GitHub...',
    errorTitle: 'Actividad disponible en GitHub',
    errorBody: 'El calendario se ocultó porque todavía no hay una sincronización completa y verificable. Podés consultar el perfil directamente.',
    profile: 'Abrir perfil de GitHub',
    contributions: 'Contribuciones',
    activeDays: 'Días activos',
    repositories: 'Repositorios públicos',
    longestStreak: 'Mejor racha',
    days: 'días',
    latestActivity: 'Última actividad',
    busiestDay: 'Día con más actividad',
    updated: 'Datos actualizados',
    less: 'Menos',
    more: 'Más',
    contribution: 'contribución',
    contributionsPlural: 'contribuciones',
    calendarLabel: 'Calendario anual verificado de contribuciones de GitHub',
    disclosure: 'La actividad de repositorios privados se incluye únicamente como conteos anónimos. No se publican nombres, commits ni detalles.',
    automatic: 'Sincronización automática diaria y verificada.'
  },
  en: {
    loading: 'Verifying GitHub activity...',
    errorTitle: 'Activity available on GitHub',
    errorBody: 'The calendar is hidden until a complete, verifiable sync is available. You can open the profile directly.',
    profile: 'Open GitHub profile',
    contributions: 'Contributions',
    activeDays: 'Active days',
    repositories: 'Public repositories',
    longestStreak: 'Longest streak',
    days: 'days',
    latestActivity: 'Latest activity',
    busiestDay: 'Busiest day',
    updated: 'Data updated',
    less: 'Less',
    more: 'More',
    contribution: 'contribution',
    contributionsPlural: 'contributions',
    calendarLabel: 'Verified annual GitHub contribution calendar',
    disclosure: 'Private repository activity is included only as anonymous counts. Names, commits, and details are never published.',
    automatic: 'Verified automatically every day.'
  }
};

function getLocale() {
  return window.zarateXP?.i18nManager?.locale === 'en' ? 'en' : 'es';
}

function formatDate(value, locale, options = {}) {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    timeZone: 'UTC',
    ...options
  }).format(date);
}

function formatNumber(value, locale) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR').format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadActivity() {
  if (!activityPromise) {
    activityPromise = fetch(DATA_URL, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const days = Array.isArray(data?.weeks) ? data.weeks.flatMap((week) => week.days || []) : [];
        const generatedAt = Date.parse(data?.generatedAt || '');
        const snapshotAge = Date.now() - generatedAt;
        const sum = days.reduce((total, day) => total + Number(day.count || 0), 0);
        const verified = data?.schemaVersion === 3
          && data?.source?.valid === true
          && data?.source?.scope === 'authenticated-owner'
          && String(data?.source?.viewerLogin).toLowerCase() === 'iazara'
          && String(data?.profile?.username).toLowerCase() === 'iazara'
          && Array.isArray(data.weeks)
          && data.weeks.length >= 52
          && days.length >= 365
          && Number(data?.summary?.totalContributions) === sum
          && Number.isFinite(generatedAt)
          && snapshotAge >= -10 * 60 * 1000
          && snapshotAge <= MAX_SNAPSHOT_AGE_MS;
        if (!verified) {
          throw new Error('Invalid GitHub activity snapshot');
        }
        return data;
      })
      .catch((error) => {
        activityPromise = null;
        throw error;
      });
  }
  return activityPromise;
}

function getMonthSegments(weeks, locale) {
  const segments = [];
  weeks.forEach((week, index) => {
    const month = week.firstDay.slice(0, 7);
    const previous = segments.at(-1);
    if (previous?.month === month) {
      previous.span += 1;
      return;
    }
    segments.push({
      month,
      start: index + 1,
      span: 1,
      label: formatDate(`${month}-15`, locale, { month: 'short' }).replace('.', '')
    });
  });
  return segments;
}

function calendarMarkup(data, locale, { compact = false } = {}) {
  const copy = COPY[locale];
  const weeks = compact ? data.weeks.slice(-36) : data.weeks;
  const monthSegments = getMonthSegments(weeks, locale);
  const monthMarkup = monthSegments.map((segment) => `
    <span style="grid-column: ${segment.start} / span ${segment.span}">${escapeHtml(segment.label)}</span>
  `).join('');
  const dayMarkup = weeks.flatMap((week, weekIndex) => week.days.map((day) => {
    const countLabel = day.count === 1 ? copy.contribution : copy.contributionsPlural;
    const label = `${formatDate(day.date, locale, { dateStyle: 'long' })}: ${formatNumber(day.count, locale)} ${countLabel}`;
    return `<span class="xp-gh-day level-${day.level}" style="grid-column:${weekIndex + 1};grid-row:${day.weekday + 1}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></span>`;
  })).join('');

  return `
    <div class="xp-gh-calendar-scroll" tabindex="0" aria-label="${escapeHtml(copy.calendarLabel)}">
      <div class="xp-gh-calendar" style="--gh-weeks:${weeks.length}">
        <div class="xp-gh-months">${monthMarkup}</div>
        <div class="xp-gh-days" role="img" aria-label="${escapeHtml(copy.calendarLabel)}">${dayMarkup}</div>
      </div>
    </div>
  `;
}

function metricsMarkup(data, locale, { compact = false } = {}) {
  const copy = COPY[locale];
  const metrics = [
    [copy.contributions, formatNumber(data.summary.totalContributions, locale)],
    [copy.activeDays, formatNumber(data.summary.activeDays, locale)],
    [copy.repositories, formatNumber(data.profile.publicRepositories, locale)]
  ];
  if (!compact) metrics.push([copy.longestStreak, `${formatNumber(data.summary.longestStreak, locale)} ${copy.days}`]);
  return metrics.map(([label, value]) => `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('');
}

function summaryMarkup(data, locale) {
  const copy = COPY[locale];
  const latest = data.summary.latestActiveDay;
  return `
    <div class="xp-gh-summary-metrics">${metricsMarkup(data, locale, { compact: true })}</div>
    ${calendarMarkup(data, locale, { compact: true })}
    <div class="xp-gh-summary-footer">
      <span>${escapeHtml(copy.latestActivity)}: <strong>${escapeHtml(latest ? formatDate(latest.date, locale, { dateStyle: 'medium' }) : '-')}</strong></span>
      <span>${escapeHtml(copy.updated)}: ${escapeHtml(formatDate(data.generatedAt.slice(0, 10), locale, { dateStyle: 'medium' }))}</span>
    </div>
  `;
}

function appMarkup(data, locale) {
  const copy = COPY[locale];
  const busiest = data.summary.busiestDay;
  const latest = data.summary.latestActiveDay;
  const safeProfileUrl = String(data.profile.url || '').startsWith('https://github.com/')
    ? data.profile.url
    : 'https://github.com/IAZARA';
  return `
    <header class="xp-gh-app-header">
      <img src="./assets/images/github.png" alt="" width="52" height="52">
      <div>
        <h2>${escapeHtml(data.profile.name)}</h2>
        <p>@${escapeHtml(data.profile.username)} · ${escapeHtml(copy.automatic)}</p>
      </div>
      <a href="${escapeHtml(safeProfileUrl)}" target="_blank" rel="noopener">${escapeHtml(copy.profile)}</a>
    </header>
    <section class="xp-gh-app-metrics" aria-label="GitHub metrics">${metricsMarkup(data, locale)}</section>
    <section class="xp-gh-app-calendar">
      ${calendarMarkup(data, locale)}
      <div class="xp-gh-legend" aria-hidden="true">
        <span>${escapeHtml(copy.less)}</span>
        ${[0, 1, 2, 3, 4].map((level) => `<i class="xp-gh-day level-${level}"></i>`).join('')}
        <span>${escapeHtml(copy.more)}</span>
      </div>
    </section>
    <section class="xp-gh-app-facts">
      <p><strong>${escapeHtml(copy.latestActivity)}</strong><span>${escapeHtml(latest ? `${formatDate(latest.date, locale, { dateStyle: 'long' })} · ${formatNumber(latest.count, locale)}` : '-')}</span></p>
      <p><strong>${escapeHtml(copy.busiestDay)}</strong><span>${escapeHtml(busiest ? `${formatDate(busiest.date, locale, { dateStyle: 'long' })} · ${formatNumber(busiest.count, locale)}` : '-')}</span></p>
      <p><strong>${escapeHtml(copy.updated)}</strong><span>${escapeHtml(formatDate(data.generatedAt.slice(0, 10), locale, { dateStyle: 'long' }))}</span></p>
    </section>
    <footer class="xp-gh-app-note">${escapeHtml(copy.disclosure)}</footer>
  `;
}

function initActivityView(root, { compact = false } = {}) {
  if (!root) return () => {};
  let data = null;
  let destroyed = false;
  let state = 'loading';
  const renderLoading = () => {
    const copy = COPY[getLocale()];
    root.innerHTML = `<div class="xp-gh-loading"><span aria-hidden="true"></span>${escapeHtml(copy.loading)}</div>`;
  };
  const render = () => {
    if (!data || destroyed) return;
    if (compact) root.closest('.xp-fde-github')?.removeAttribute('hidden');
    root.innerHTML = compact ? summaryMarkup(data, getLocale()) : appMarkup(data, getLocale());
  };
  const renderError = () => {
    if (compact) {
      root.closest('.xp-fde-github')?.setAttribute('hidden', '');
      root.innerHTML = '';
      return;
    }
    const copy = COPY[getLocale()];
    root.innerHTML = `
      <div class="xp-gh-error" role="alert">
        <strong>${escapeHtml(copy.errorTitle)}</strong>
        <span>${escapeHtml(copy.errorBody)}</span>
        <a href="https://github.com/IAZARA" target="_blank" rel="noopener">${escapeHtml(copy.profile)}</a>
      </div>
    `;
  };
  const handleLocaleChange = () => {
    if (state === 'ready') render();
    else if (state === 'error') renderError();
    else renderLoading();
  };
  window.addEventListener('zaratexp:localechange', handleLocaleChange);
  renderLoading();
  loadActivity().then((activity) => {
    if (destroyed) return;
    data = activity;
    state = 'ready';
    render();
  }).catch(() => {
    if (!destroyed) {
      state = 'error';
      renderError();
    }
  });
  return () => {
    destroyed = true;
    window.removeEventListener('zaratexp:localechange', handleLocaleChange);
  };
}

export function initGitHubActivitySummary(root) {
  return initActivityView(root, { compact: true });
}

export function initGitHubActivityApp(root) {
  return initActivityView(root);
}
