(function () {
    const CACHE_PREFIX = 'zarateXP.apiCache.';
    const REQUEST_TIMEOUT = 9000;
    const CHANNELS = ['weather', 'github', 'countries'];

    const CHANNEL_CONFIG = {
        weather: {
            input: '[data-weather-city]',
            result: '[data-weather-result]',
            run: '[data-weather-run]',
            defaultLabel: 'Consultar clima',
            cancelLabel: 'Cancelar clima'
        },
        github: {
            input: '[data-github-user]',
            result: '[data-github-result]',
            run: '[data-github-run]',
            defaultLabel: 'Traer repos',
            cancelLabel: 'Cancelar GitHub'
        },
        countries: {
            input: '[data-country-name]',
            result: '[data-country-result]',
            run: '[data-country-run]',
            defaultLabel: 'Buscar país',
            cancelLabel: 'Cancelar país'
        }
    };

    class ApiCenterError extends Error {
        constructor(code, message, details = {}) {
            super(message);
            this.name = 'ApiCenterError';
            this.code = code;
            this.details = details;
        }
    }

    class ApiCenterApp {
        constructor(root) {
            if (!root) throw new Error('No se encontró el contenedor de API Center');

            this.root = root;
            this.log = root.querySelector('[data-api-log]');
            this.requests = new Map();
            this.loaded = new Set();
            this.activeTab = root.querySelector('[data-api-tab].active')?.dataset.apiTab || 'weather';
            this.eventController = new AbortController();
            this.runAllGeneration = 0;
            this.runAllActive = false;
            this.initialized = false;
        }

        get locale() {
            return window.zarateXP?.i18nManager?.locale === 'en' ? 'en' : 'es';
        }

        get intlLocale() {
            return this.locale === 'en' ? 'en-US' : 'es-AR';
        }

        init() {
            if (this.initialized) return this;
            this.initialized = true;
            this.root.__apiCenterApp = this;

            this.setupAccessibility();
            this.bindControls();
            this.renderInitialStates();
            this.selectTab(this.activeTab, { announce: false, load: false });

            Promise.resolve().then(() => {
                if (this.root.isConnected) this.loadWeather({ reason: 'initial' });
            });

            return this;
        }

        destroy() {
            this.cancelAll('destroyed');
            this.eventController.abort();
            this.root.removeAttribute('aria-busy');
            delete this.root.__apiCenterApp;
            this.initialized = false;
        }

        setupAccessibility() {
            this.root.setAttribute('aria-busy', 'false');
            this.root.dataset.apiActive = this.activeTab;

            const panels = Array.from(this.root.querySelectorAll('[data-api-panel]'));
            const tabs = Array.from(this.root.querySelectorAll('[data-api-tab]'));

            panels.forEach((panel, index) => {
                const name = panel.dataset.apiPanel;
                panel.id ||= `api-panel-${name}-${index + 1}`;
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('tabindex', '0');

                const firstTab = tabs.find((tab) => tab.dataset.apiTab === name);
                if (firstTab) {
                    firstTab.id ||= `api-tab-${name}-1`;
                    panel.setAttribute('aria-labelledby', firstTab.id);
                }
            });

            const tabCounters = new Map();
            tabs.forEach((tab) => {
                const name = tab.dataset.apiTab;
                const count = (tabCounters.get(name) || 0) + 1;
                tabCounters.set(name, count);
                tab.id ||= `api-tab-${name}-${count}`;
                tab.setAttribute('role', 'tab');

                const panel = panels.find((item) => item.dataset.apiPanel === name);
                if (panel) tab.setAttribute('aria-controls', panel.id);
            });

            new Set(tabs.map((tab) => tab.parentElement).filter(Boolean)).forEach((tabList) => {
                tabList.setAttribute('role', 'tablist');
                tabList.setAttribute('aria-label', tabList.getAttribute('aria-label') || 'Integraciones disponibles');
            });

            this.root.querySelectorAll('[data-api-tabs]').forEach((tabList) => {
                tabList.setAttribute('role', 'tablist');
                tabList.setAttribute('aria-label', tabList.getAttribute('aria-label') || 'Integraciones disponibles');
            });

            CHANNELS.forEach((channel) => {
                const config = CHANNEL_CONFIG[channel];
                const input = this.root.querySelector(config.input);
                const result = this.root.querySelector(config.result);
                if (!result) return;

                result.id ||= `api-result-${channel}`;
                result.setAttribute('role', 'region');
                result.setAttribute('aria-live', 'polite');
                result.setAttribute('aria-atomic', 'false');
                result.setAttribute('aria-busy', 'false');
                result.setAttribute('tabindex', '-1');

                if (input) {
                    input.setAttribute('aria-controls', result.id);
                    input.setAttribute('autocomplete', 'off');
                    input.setAttribute('spellcheck', 'false');
                    if (channel === 'github') input.setAttribute('autocapitalize', 'none');
                }

                this.root.querySelectorAll(config.run).forEach((button) => {
                    button.setAttribute('aria-controls', result.id);
                    button.dataset.apiOriginalLabel ||= button.textContent.trim() || config.defaultLabel;
                });
            });

            if (this.log) {
                this.log.setAttribute('role', 'status');
                this.log.setAttribute('aria-live', 'polite');
                this.log.setAttribute('aria-atomic', 'true');
            }

            this.root.querySelectorAll('[data-api-health]').forEach((node) => {
                node.setAttribute('role', 'status');
                node.dataset.apiStatus ||= 'idle';
            });
        }

        bindControls() {
            const signal = this.eventController.signal;

            this.root.querySelectorAll('[data-api-tab]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.selectTab(button.dataset.apiTab, { load: true });
                }, { signal });
                button.addEventListener('keydown', (event) => this.handleTabKeydown(event, button), { signal });
            });

            CHANNELS.forEach((channel) => {
                const config = CHANNEL_CONFIG[channel];
                this.root.querySelectorAll(config.run).forEach((button) => {
                    button.addEventListener('click', () => {
                        if (this.requests.has(channel)) {
                            this.cancelRequest(channel, 'user');
                            return;
                        }
                        this.runChannel(channel, { reason: 'button' });
                    }, { signal });
                });

                this.root.querySelectorAll(config.input).forEach((input) => {
                    input.addEventListener('keydown', (event) => {
                        if (event.key !== 'Enter' || event.isComposing) return;
                        event.preventDefault();
                        this.runChannel(channel, { reason: 'keyboard' });
                    }, { signal });
                    input.addEventListener('input', () => this.clearValidation(input), { signal });
                });
            });

            this.root.querySelectorAll('[data-api-run-all]').forEach((button) => {
                button.dataset.apiOriginalLabel ||= button.textContent.trim() || 'Ejecutar todo';
                button.addEventListener('click', () => {
                    if (this.runAllActive) {
                        this.cancelAll('user');
                        return;
                    }
                    this.runAll();
                }, { signal });
            });

            this.root.querySelectorAll('[data-api-refresh-active]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.runChannel(this.activeTab, { reason: 'refresh' });
                }, { signal });
            });

            this.root.querySelectorAll('[data-api-clear-cache]').forEach((button) => {
                button.addEventListener('click', () => this.clearCache(), { signal });
            });

            this.root.addEventListener('click', (event) => {
                const retry = event.target.closest?.('[data-api-retry]');
                if (!retry || !this.root.contains(retry)) return;
                const channel = retry.dataset.apiRetry;
                if (CHANNELS.includes(channel)) this.runChannel(channel, { reason: 'retry' });
            }, { signal });

            this.root.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.requests.has(this.activeTab)) {
                    event.preventDefault();
                    this.cancelRequest(this.activeTab, 'user');
                }
                if (event.key === 'F5' && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    this.runChannel(this.activeTab, { reason: 'refresh' });
                }
            }, { signal });

            window.addEventListener('offline', () => {
                this.setLog('Sin conexión. Las próximas consultas usarán la caché local disponible.');
            }, { signal });
            window.addEventListener('online', () => {
                this.setLog('Conexión restaurada. Presioná F5 para actualizar la vista activa.');
            }, { signal });
        }

        renderInitialStates() {
            const githubResult = this.getResult('github');
            const countryResult = this.getResult('countries');

            if (githubResult && !githubResult.textContent.trim()) {
                githubResult.innerHTML = this.emptyMarkup(
                    'GitHub listo para consultar',
                    'Ingresá un usuario o abrí esta pestaña para traer su perfil y repositorios.'
                );
            }
            if (countryResult && !countryResult.textContent.trim()) {
                countryResult.innerHTML = this.emptyMarkup(
                    'Datos públicos listos',
                    'Buscá un país para ver población, idiomas, monedas, husos horarios y superficie.'
                );
            }
        }

        handleTabKeydown(event, button) {
            const supportedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
            if (!supportedKeys.includes(event.key)) return;

            const order = Array.from(new Set(
                Array.from(this.root.querySelectorAll('[data-api-tab]'))
                    .map((tab) => tab.dataset.apiTab)
                    .filter((name) => CHANNELS.includes(name))
            ));
            if (!order.length) return;

            event.preventDefault();
            const currentIndex = Math.max(0, order.indexOf(button.dataset.apiTab));
            let nextIndex = currentIndex;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = order.length - 1;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % order.length;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + order.length) % order.length;

            const nextName = order[nextIndex];
            this.selectTab(nextName, { load: true });

            const sibling = Array.from(button.parentElement?.querySelectorAll('[data-api-tab]') || [])
                .find((tab) => tab.dataset.apiTab === nextName);
            const fallback = Array.from(this.root.querySelectorAll('[data-api-tab]'))
                .find((tab) => tab.dataset.apiTab === nextName && !tab.hidden);
            (sibling || fallback)?.focus();
        }

        selectTab(tabName, options = {}) {
            if (!CHANNELS.includes(tabName)) return;

            this.activeTab = tabName;
            this.root.dataset.apiActive = tabName;

            this.root.querySelectorAll('[data-api-tab]').forEach((button) => {
                const isActive = button.dataset.apiTab === tabName;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-selected', String(isActive));
                button.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            this.root.querySelectorAll('[data-api-panel]').forEach((panel) => {
                const isActive = panel.dataset.apiPanel === tabName;
                panel.classList.toggle('active', isActive);
                panel.hidden = !isActive;
            });

            if (options.announce !== false) {
                this.setLog(`Vista activa: ${this.channelLabel(tabName)}.`);
            }

            if (options.load && !this.loaded.has(tabName) && !this.requests.has(tabName)) {
                this.runChannel(tabName, { reason: 'tab', silent: true });
            }
        }

        runChannel(channel, options = {}) {
            if (channel === 'weather') return this.loadWeather(options);
            if (channel === 'github') return this.loadGithub(options);
            if (channel === 'countries') return this.loadCountry(options);
            return Promise.resolve({ channel, status: 'error' });
        }

        async runAll() {
            const generation = ++this.runAllGeneration;
            this.runAllActive = true;
            this.setRunAllBusy(true);
            this.setLog('Ejecutando las tres integraciones en paralelo...');

            const results = await Promise.all(CHANNELS.map((channel) => (
                this.runChannel(channel, { reason: 'all', silent: true })
            )));

            if (generation !== this.runAllGeneration) return results;

            this.runAllActive = false;
            this.setRunAllBusy(false);
            const successCount = results.filter((result) => ['success', 'partial'].includes(result.status)).length;
            const errorCount = results.filter((result) => ['error', 'validation'].includes(result.status)).length;
            const cancelledCount = results.filter((result) => result.status === 'cancelled').length;

            const summary = [`${successCount} correctas`];
            if (errorCount) summary.push(`${errorCount} con error`);
            if (cancelledCount) summary.push(`${cancelledCount} canceladas`);
            this.setLog(`Ejecución completa: ${summary.join(', ')}.`);
            return results;
        }

        async loadWeather(options = {}) {
            const channel = 'weather';
            const result = this.getResult(channel);
            const validated = this.readAndValidate(channel);
            if (!validated.ok) return this.showValidation(channel, validated);

            const city = validated.value;
            const request = this.beginRequest(channel);
            this.renderLoading(result, `Buscando ${city}...`);

            try {
                const geocode = await this.fetchJson(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=${this.locale}&format=json`,
                    `weather.geo.${this.cacheToken(city)}`,
                    {
                        signal: request.controller.signal,
                        ttlMs: 30 * 24 * 60 * 60 * 1000,
                        validate: (data) => data && typeof data === 'object' && Array.isArray(data.results)
                    }
                );
                this.assertCurrent(channel, request);

                const place = this.pickPlace(geocode.data.results, city);
                if (!place || !Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) {
                    throw new ApiCenterError('not-found', `No encontramos una ciudad llamada "${city}".`);
                }

                this.renderLoading(result, `Consultando el pronóstico para ${place.name}...`);
                const latitude = Number(place.latitude);
                const longitude = Number(place.longitude);
                const forecast = await this.fetchJson(
                    [
                        'https://api.open-meteo.com/v1/forecast',
                        `?latitude=${latitude}`,
                        `&longitude=${longitude}`,
                        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code,is_day',
                        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
                        '&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm',
                        '&forecast_days=5&timezone=auto'
                    ].join(''),
                    `weather.forecast.${latitude.toFixed(3)}.${longitude.toFixed(3)}`,
                    {
                        signal: request.controller.signal,
                        ttlMs: 10 * 60 * 1000,
                        validate: (data) => this.isValidForecast(data)
                    }
                );
                this.assertCurrent(channel, request);

                const meta = this.mergeMeta([geocode.meta, forecast.meta]);
                result.innerHTML = this.renderOpenMeteoWeather(place, forecast.data, meta);
                this.completeView(channel, meta);
                if (!options.silent) {
                    this.setLog(this.successLog('Clima', place.name, meta));
                }
                return { channel, status: 'success', source: meta.source };
            } catch (primaryError) {
                if (this.isAbort(primaryError, request)) {
                    return this.handleCancelled(channel, request, result, options);
                }

                try {
                    this.assertCurrent(channel, request);
                    this.renderLoading(result, 'Open-Meteo no respondió. Probando el proveedor secundario...');
                    const wttr = await this.fetchJson(
                        `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=${this.locale}`,
                        `weather.wttr.${this.cacheToken(city)}`,
                        {
                            signal: request.controller.signal,
                            ttlMs: 10 * 60 * 1000,
                            validate: (data) => Array.isArray(data?.current_condition) && data.current_condition.length > 0
                        }
                    );
                    this.assertCurrent(channel, request);

                    result.innerHTML = this.renderWttrWeather(wttr.data, city, primaryError, wttr.meta);
                    this.completeView(channel, wttr.meta);
                    if (!options.silent) {
                        this.setLog(this.successLog('Clima alternativo', city, wttr.meta));
                    }
                    return { channel, status: 'partial', source: wttr.meta.source };
                } catch (fallbackError) {
                    if (this.isAbort(fallbackError, request)) {
                        return this.handleCancelled(channel, request, result, options);
                    }
                    this.assertCurrent(channel, request);
                    const error = new ApiCenterError(
                        'weather-unavailable',
                        'Ninguno de los proveedores de clima está disponible en este momento.',
                        { primaryError, fallbackError }
                    );
                    result.innerHTML = this.errorMarkup(error, channel, 'No pudimos consultar el clima');
                    this.setHealth(channel, 'error', this.userMessage(error));
                    if (!options.silent) this.setLog(`Clima no disponible: ${this.userMessage(fallbackError)}`);
                    return { channel, status: 'error' };
                }
            } finally {
                this.finishRequest(channel, request);
            }
        }

        async loadGithub(options = {}) {
            const channel = 'github';
            const result = this.getResult(channel);
            const validated = this.readAndValidate(channel);
            if (!validated.ok) return this.showValidation(channel, validated);

            const user = validated.value;
            const request = this.beginRequest(channel);
            this.renderLoading(result, `Consultando el perfil de @${user}...`);

            try {
                const baseUrl = `https://api.github.com/users/${encodeURIComponent(user)}`;
                const requestOptions = {
                    signal: request.controller.signal,
                    ttlMs: 5 * 60 * 1000
                };
                const [profileResponse, reposResponse] = await Promise.allSettled([
                    this.fetchJson(baseUrl, `github.profile.${user.toLowerCase()}`, {
                        ...requestOptions,
                        validate: (data) => data && typeof data.login === 'string'
                    }),
                    this.fetchJson(
                        `${baseUrl}/repos?sort=updated&direction=desc&per_page=10&type=owner`,
                        `github.repos.${user.toLowerCase()}`,
                        { ...requestOptions, validate: Array.isArray }
                    )
                ]);
                this.assertCurrent(channel, request);

                const fulfilled = [profileResponse, reposResponse].filter((item) => item.status === 'fulfilled');
                if (!fulfilled.length) {
                    const reason = reposResponse.reason || profileResponse.reason;
                    throw reason instanceof Error ? reason : new ApiCenterError('github-unavailable', 'GitHub no respondió.');
                }

                const profile = profileResponse.status === 'fulfilled' ? profileResponse.value.data : null;
                const repos = reposResponse.status === 'fulfilled' ? reposResponse.value.data : [];
                const warnings = [];
                if (profileResponse.status === 'rejected') warnings.push('El perfil no respondió; se muestran los repositorios disponibles.');
                if (reposResponse.status === 'rejected') warnings.push('La lista de repositorios no respondió; se muestra el perfil disponible.');

                const meta = this.mergeMeta(fulfilled.map((item) => item.value.meta));
                result.innerHTML = this.renderGithub(profile, repos, user, meta, warnings);
                this.completeView(channel, meta);
                const status = warnings.length ? 'partial' : 'success';
                if (!options.silent) {
                    this.setLog(this.successLog('GitHub', `@${profile?.login || user}`, meta, warnings.length > 0));
                }
                return { channel, status, source: meta.source };
            } catch (error) {
                if (this.isAbort(error, request)) {
                    return this.handleCancelled(channel, request, result, options);
                }
                this.assertCurrent(channel, request);
                result.innerHTML = this.errorMarkup(error, channel, `No pudimos consultar @${user}`);
                this.setHealth(channel, 'error', this.userMessage(error));
                if (!options.silent) this.setLog(`GitHub no disponible: ${this.userMessage(error)}`);
                return { channel, status: 'error' };
            } finally {
                this.finishRequest(channel, request);
            }
        }

        async loadCountry(options = {}) {
            const channel = 'countries';
            const result = this.getResult(channel);
            const validated = this.readAndValidate(channel);
            if (!validated.ok) return this.showValidation(channel, validated);

            const country = validated.value;
            const request = this.beginRequest(channel);
            this.renderLoading(result, `Buscando datos públicos de ${country}...`);

            try {
                const fallback = await this.loadCountryFallback(country, request);
                this.assertCurrent(channel, request);
                if (!fallback.item) throw new ApiCenterError('not-found', `No encontramos datos para "${country}".`);

                this.setHealthProvider(channel, fallback.provider);
                result.innerHTML = this.renderCountry(fallback.item, country, fallback.meta, {
                    provider: fallback.provider
                });
                this.completeView(channel, fallback.meta);
                if (!options.silent) {
                    this.setLog(this.successLog('Fuentes públicas', fallback.item.name?.common || country, fallback.meta));
                }
                return { channel, status: 'success', source: fallback.meta.source };
            } catch (error) {
                if (this.isAbort(error, request)) {
                    return this.handleCancelled(channel, request, result, options);
                }
                this.assertCurrent(channel, request);
                result.innerHTML = this.errorMarkup(error, channel, `No pudimos buscar ${country}`);
                this.setHealth(channel, 'error', this.userMessage(error));
                if (!options.silent) this.setLog(`Datos públicos no disponibles: ${this.userMessage(error)}`);
                return { channel, status: 'error' };
            } finally {
                this.finishRequest(channel, request);
            }
        }

        async loadCountryFallback(country, request) {
            const dataset = await this.fetchJson(
                'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
                'country.fallback.mledoze',
                {
                    signal: request.controller.signal,
                    ttlMs: 30 * 24 * 60 * 60 * 1000,
                    preferFreshCache: true,
                    validate: (data) => Array.isArray(data) && data.length > 100
                }
            );
            this.assertCurrent('countries', request);

            const rawItem = this.pickCountry(dataset.data, country);
            if (!rawItem) return { item: null, meta: dataset.meta, provider: 'mledoze Countries' };

            const item = this.normalizeFallbackCountry(rawItem);
            const metas = [dataset.meta];
            if (item.cca3) {
                try {
                    const population = await this.fetchJson(
                        `https://api.worldbank.org/v2/country/${encodeURIComponent(item.cca3)}/indicator/SP.POP.TOTL?format=json&per_page=1&mrnev=1`,
                        `country.population.${item.cca3.toLowerCase()}`,
                        {
                            signal: request.controller.signal,
                            ttlMs: 30 * 24 * 60 * 60 * 1000,
                            preferFreshCache: true,
                            validate: (data) => Array.isArray(data) && Array.isArray(data[1])
                        }
                    );
                    const latest = population.data?.[1]?.find((entry) => Number.isFinite(Number(entry?.value)));
                    if (latest) {
                        item.population = Number(latest.value);
                        item._populationYear = latest.date;
                    }
                    metas.push(population.meta);
                } catch (error) {
                    if (this.isAbort(error, request)) throw error;
                    item._populationUnavailable = true;
                }
            }

            return {
                item,
                meta: this.mergeMeta(metas),
                provider: metas.length > 1 ? 'mledoze Countries + Banco Mundial' : 'mledoze Countries'
            };
        }

        normalizeFallbackCountry(item) {
            const code = String(item.cca2 || '').toLowerCase();
            const commonName = item.name?.common || item.cca3 || 'País';
            return {
                ...item,
                name: {
                    ...item.name,
                    nativeName: item.name?.native || item.name?.nativeName || {}
                },
                flags: code ? {
                    png: `https://flagcdn.com/w320/${encodeURIComponent(code)}.png`,
                    svg: `https://flagcdn.com/${encodeURIComponent(code)}.svg`
                } : {},
                maps: {
                    openStreetMaps: `https://www.openstreetmap.org/search?query=${encodeURIComponent(commonName)}`
                },
                timezones: Array.isArray(item.timezones) ? item.timezones : []
            };
        }

        beginRequest(channel) {
            const previous = this.requests.get(channel);
            if (previous) {
                previous.cancelReason = 'superseded';
                previous.controller.abort();
            }

            const request = {
                id: `${channel}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                controller: new AbortController(),
                cancelReason: null
            };
            this.requests.set(channel, request);
            this.setChannelBusy(channel, true);
            this.setHealth(channel, 'loading', 'Consultando proveedor');
            this.syncBusyState();
            return request;
        }

        finishRequest(channel, request) {
            if (this.requests.get(channel) !== request) return;
            this.requests.delete(channel);
            this.setChannelBusy(channel, false);
            this.syncBusyState();
        }

        cancelRequest(channel, reason = 'user') {
            const request = this.requests.get(channel);
            if (!request) return false;
            request.cancelReason = reason;
            request.controller.abort();
            if (reason === 'user') this.setLog(`Cancelando ${this.channelLabel(channel).toLowerCase()}...`);
            return true;
        }

        cancelAll(reason = 'user') {
            this.runAllGeneration += 1;
            this.runAllActive = false;
            this.setRunAllBusy(false);
            let cancelled = 0;
            CHANNELS.forEach((channel) => {
                if (this.cancelRequest(channel, reason)) cancelled += 1;
            });
            if (reason === 'user') {
                this.setLog(cancelled ? 'Consultas canceladas.' : 'No hay consultas activas.');
            }
        }

        assertCurrent(channel, request) {
            if (request.controller.signal.aborted || this.requests.get(channel) !== request) {
                throw this.abortError();
            }
        }

        isAbort(error, request) {
            return request?.controller.signal.aborted || error?.name === 'AbortError' || error?.code === 'aborted';
        }

        handleCancelled(channel, request, result, options) {
            if (request.cancelReason === 'user' && this.requests.get(channel) === request) {
                result.innerHTML = this.emptyMarkup(
                    'Consulta cancelada',
                    `Podés volver a ejecutar ${this.channelLabel(channel).toLowerCase()} cuando quieras.`
                );
                if (!options.silent) this.setLog(`${this.channelLabel(channel)} cancelado.`);
                this.setHealth(channel, 'idle', 'Consulta cancelada');
            }
            return { channel, status: 'cancelled' };
        }

        setChannelBusy(channel, busy) {
            const config = CHANNEL_CONFIG[channel];
            const result = this.getResult(channel);
            if (result) result.setAttribute('aria-busy', String(busy));

            this.root.querySelectorAll(config.run).forEach((button) => {
                const original = button.dataset.apiOriginalLabel || config.defaultLabel;
                button.dataset.apiBusy = busy ? 'true' : 'false';
                button.setAttribute('aria-label', busy ? `${config.cancelLabel}. Consulta en curso.` : original);
                if (!button.children.length) button.textContent = busy ? config.cancelLabel : original;
            });
        }

        setRunAllBusy(busy) {
            this.root.querySelectorAll('[data-api-run-all]').forEach((button) => {
                const original = button.dataset.apiOriginalLabel || 'Ejecutar todo';
                button.dataset.apiBusy = busy ? 'true' : 'false';
                button.setAttribute('aria-label', busy ? 'Cancelar todas las consultas' : original);
                if (!button.children.length) button.textContent = busy ? 'Cancelar todo' : original;
            });
        }

        syncBusyState() {
            const busy = this.requests.size > 0;
            this.root.setAttribute('aria-busy', String(busy));
            this.root.dataset.apiBusy = busy ? 'true' : 'false';
        }

        setHealth(channel, status, detail = '') {
            this.root.querySelectorAll(`[data-api-health="${channel}"]`).forEach((node) => {
                node.classList.remove('loading', 'success', 'cached', 'error');
                if (['loading', 'success', 'cached', 'error'].includes(status)) node.classList.add(status);
                node.dataset.apiStatus = status;
                const provider = node.textContent.trim();
                const statusLabel = {
                    idle: 'sin consultar',
                    loading: 'consultando',
                    success: 'datos en vivo',
                    cached: 'caché local',
                    error: 'error'
                }[status] || status;
                node.setAttribute('aria-label', `${provider}: ${statusLabel}${detail ? `. ${detail}` : ''}`);
                node.title = detail || statusLabel;
            });
        }

        setHealthProvider(channel, label) {
            if (!label) return;
            this.root.querySelectorAll(`[data-api-health="${channel}"]`).forEach((node) => {
                node.textContent = label;
            });
        }

        async fetchJson(url, cacheKey, options = {}) {
            const {
                signal,
                ttlMs = 5 * 60 * 1000,
                preferFreshCache = false,
                validate = () => true
            } = options;
            const namespacedKey = `${CACHE_PREFIX}${cacheKey}`;
            const cached = this.readCache(namespacedKey, ttlMs, validate);

            if (signal?.aborted) throw this.abortError();
            if (preferFreshCache && cached && !cached.stale) {
                return { data: cached.data, meta: this.cacheMeta(cached, null) };
            }
            if (typeof navigator !== 'undefined' && navigator.onLine === false && cached) {
                return {
                    data: cached.data,
                    meta: this.cacheMeta(cached, new ApiCenterError('offline', 'El dispositivo está sin conexión.'))
                };
            }

            const controller = new AbortController();
            let timedOut = false;
            const abortFromParent = () => controller.abort();
            signal?.addEventListener('abort', abortFromParent, { once: true });
            const timeout = window.setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, REQUEST_TIMEOUT);

            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                    credentials: 'omit',
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw this.httpError(response);
                }

                let data;
                try {
                    data = await response.json();
                } catch (error) {
                    throw new ApiCenterError('invalid-json', 'La API devolvió una respuesta que no es JSON válido.');
                }

                if (!validate(data)) {
                    throw new ApiCenterError('invalid-shape', 'La API devolvió datos incompletos o inesperados.');
                }
                if (signal?.aborted) throw this.abortError();

                const savedAt = Date.now();
                const cachePersisted = this.writeCache(namespacedKey, { data, savedAt, ttlMs, version: 2 });
                return {
                    data,
                    meta: {
                        source: 'network',
                        savedAt,
                        ageMs: 0,
                        stale: false,
                        ttlMs,
                        cachePersisted,
                        rateLimitRemaining: this.headerNumber(response, 'x-ratelimit-remaining'),
                        rateLimitReset: this.headerNumber(response, 'x-ratelimit-reset')
                    }
                };
            } catch (caughtError) {
                if (signal?.aborted) throw this.abortError();

                const error = timedOut
                    ? new ApiCenterError('timeout', `La API tardó más de ${Math.round(REQUEST_TIMEOUT / 1000)} segundos.`)
                    : this.normalizeFetchError(caughtError);

                if (cached) {
                    return { data: cached.data, meta: this.cacheMeta(cached, error) };
                }
                throw error;
            } finally {
                window.clearTimeout(timeout);
                signal?.removeEventListener('abort', abortFromParent);
            }
        }

        httpError(response) {
            const status = response.status;
            const remaining = this.headerNumber(response, 'x-ratelimit-remaining');
            const reset = this.headerNumber(response, 'x-ratelimit-reset');

            if (status === 404) {
                return new ApiCenterError('not-found', 'La API no encontró resultados para esta búsqueda.', { status });
            }
            if (status === 403 && remaining === 0) {
                return new ApiCenterError('rate-limit', 'GitHub alcanzó el límite temporal de consultas sin autenticación.', {
                    status,
                    reset
                });
            }
            if (status === 429) {
                return new ApiCenterError('rate-limit', 'La API recibió demasiadas consultas. Esperá unos minutos e intentá otra vez.', { status });
            }
            if (status >= 500) {
                return new ApiCenterError('server', `El proveedor tiene un problema temporal (HTTP ${status}).`, { status });
            }
            return new ApiCenterError('http', `La API rechazó la consulta (HTTP ${status}).`, { status });
        }

        normalizeFetchError(error) {
            if (error instanceof ApiCenterError) return error;
            if (error?.name === 'AbortError') return this.abortError();
            if (error instanceof TypeError) {
                return new ApiCenterError('network', 'No pudimos conectar con la API. Revisá la conexión o la política CORS.');
            }
            return new ApiCenterError('unknown', error?.message || 'Ocurrió un error inesperado al consultar la API.');
        }

        readCache(key, ttlMs, validate) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                const savedAt = Number(parsed?.savedAt);
                if (!Number.isFinite(savedAt) || !validate(parsed?.data)) {
                    localStorage.removeItem(key);
                    return null;
                }
                const resolvedTtl = Number(parsed.ttlMs) > 0 ? Number(parsed.ttlMs) : ttlMs;
                const ageMs = Math.max(0, Date.now() - savedAt);
                return {
                    data: parsed.data,
                    savedAt,
                    ttlMs: resolvedTtl,
                    ageMs,
                    stale: ageMs > resolvedTtl
                };
            } catch (error) {
                try { localStorage.removeItem(key); } catch (storageError) { /* Storage unavailable. */ }
                return null;
            }
        }

        writeCache(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                return false;
            }
        }

        cacheMeta(cached, recoveryError) {
            return {
                source: 'cache',
                savedAt: cached.savedAt,
                ageMs: cached.ageMs,
                stale: cached.stale,
                ttlMs: cached.ttlMs,
                cachePersisted: true,
                recoveryError
            };
        }

        clearCache() {
            let removed = 0;
            try {
                for (let index = localStorage.length - 1; index >= 0; index -= 1) {
                    const key = localStorage.key(index);
                    if (!key?.startsWith(CACHE_PREFIX)) continue;
                    localStorage.removeItem(key);
                    removed += 1;
                }
                this.setLog(removed
                    ? `Caché eliminada: ${removed} ${removed === 1 ? 'respuesta' : 'respuestas'}.`
                    : 'La caché de API Center ya estaba vacía.');
            } catch (error) {
                this.setLog('El navegador no permitió acceder a la caché local.');
            }
            return removed;
        }

        mergeMeta(items) {
            const valid = items.filter(Boolean);
            if (!valid.length) {
                return { source: 'network', savedAt: Date.now(), ageMs: 0, stale: false, cachePersisted: false };
            }

            const cachedItems = valid.filter((item) => item.source === 'cache');
            const source = cachedItems.length ? 'cache' : 'network';
            const relevant = cachedItems.length ? cachedItems : valid;
            const savedAt = Math.min(...relevant.map((item) => Number(item.savedAt) || Date.now()));
            const remainingValues = valid
                .map((item) => item.rateLimitRemaining)
                .filter(Number.isFinite);

            return {
                source,
                savedAt,
                ageMs: Math.max(0, Date.now() - savedAt),
                stale: relevant.some((item) => item.stale),
                ttlMs: Math.min(...relevant.map((item) => Number(item.ttlMs) || Infinity)),
                cachePersisted: valid.every((item) => item.cachePersisted !== false),
                recoveryError: relevant.find((item) => item.recoveryError)?.recoveryError,
                rateLimitRemaining: remainingValues.length ? Math.min(...remainingValues) : null,
                rateLimitReset: valid.find((item) => Number.isFinite(item.rateLimitReset))?.rateLimitReset || null
            };
        }

        renderOpenMeteoWeather(place, forecast, meta) {
            const current = forecast.current || {};
            const units = forecast.current_units || {};
            const daily = forecast.daily || {};
            const days = Array.isArray(daily.time) ? daily.time : [];
            const location = [place.name, place.admin1, place.country].filter(Boolean).join(', ');

            return `
                ${this.freshnessMarkup(meta, 'Open-Meteo')}
                <div class="xp-weather-card">
                    <div>
                        <small>${this.escape(forecast.timezone_abbreviation || forecast.timezone || 'Hora local')}</small>
                        <h3>${this.escape(location)}</h3>
                        <strong>${this.formatTemperature(current.temperature_2m)}</strong>
                        <span>${this.escape(this.weatherCode(current.weather_code))}</span>
                    </div>
                    <dl>
                        <dt>Sensación</dt><dd>${this.formatTemperature(current.apparent_temperature)}</dd>
                        <dt>Humedad</dt><dd>${this.formatMeasurement(current.relative_humidity_2m, units.relative_humidity_2m || '%')}</dd>
                        <dt>Viento</dt><dd>${this.formatMeasurement(current.wind_speed_10m, units.wind_speed_10m || 'km/h')}</dd>
                        <dt>Precipitación</dt><dd>${this.formatMeasurement(current.precipitation, units.precipitation || 'mm', 1)}</dd>
                        <dt>Observación</dt><dd>${this.escape(this.formatObservationTime(current.time, forecast.timezone))}</dd>
                    </dl>
                </div>
                ${days.length ? `
                    <div class="xp-api-cards" aria-label="Pronóstico de cinco días">
                        ${days.slice(0, 5).map((day, index) => `
                            <article>
                                <strong>${this.escape(this.shortDate(day))}</strong>
                                <span>${this.formatTemperature(daily.temperature_2m_min?.[index], false)} / ${this.formatTemperature(daily.temperature_2m_max?.[index], false)}</span>
                                <small>${this.escape(this.weatherCode(daily.weather_code?.[index]))}</small>
                                <small>Lluvia: ${this.formatMeasurement(daily.precipitation_probability_max?.[index] ?? 0, '%')}</small>
                            </article>
                        `).join('')}
                    </div>
                ` : this.emptyMarkup('Sin pronóstico diario', 'El proveedor solo devolvió las condiciones actuales.')}
            `;
        }

        renderWttrWeather(data, city, previousError, meta) {
            const current = data.current_condition?.[0] || {};
            const forecast = Array.isArray(data.weather) ? data.weather : [];
            const description = current.lang_es?.[0]?.value || current.weatherDesc?.[0]?.value || 'Sin descripción';

            return `
                ${this.freshnessMarkup(meta, 'wttr.in')}
                <div class="xp-api-summary">
                    <strong>Proveedor secundario activo</strong>
                    <span>${this.escape(this.userMessage(previousError))}</span>
                </div>
                <div class="xp-weather-card">
                    <div>
                        <small>wttr.in</small>
                        <h3>${this.escape(city)}</h3>
                        <strong>${this.formatTemperature(current.temp_C)}</strong>
                        <span>${this.escape(description)}</span>
                    </div>
                    <dl>
                        <dt>Sensación</dt><dd>${this.formatTemperature(current.FeelsLikeC)}</dd>
                        <dt>Humedad</dt><dd>${this.formatMeasurement(current.humidity, '%')}</dd>
                        <dt>Viento</dt><dd>${this.formatMeasurement(current.windspeedKmph, 'km/h')}</dd>
                        <dt>Visibilidad</dt><dd>${this.formatMeasurement(current.visibility, 'km')}</dd>
                    </dl>
                </div>
                ${forecast.length ? `
                    <div class="xp-api-cards" aria-label="Pronóstico disponible">
                        ${forecast.slice(0, 5).map((day) => `
                            <article>
                                <strong>${this.escape(this.shortDate(day.date))}</strong>
                                <span>${this.formatTemperature(day.mintempC, false)} / ${this.formatTemperature(day.maxtempC, false)}</span>
                                <small>Índice UV: ${this.escape(day.uvIndex ?? 'N/D')}</small>
                            </article>
                        `).join('')}
                    </div>
                ` : this.emptyMarkup('Sin pronóstico diario', 'wttr.in solo devolvió las condiciones actuales.')}
            `;
        }

        renderGithub(profile, repos, requestedUser, meta, warnings = []) {
            const login = profile?.login || requestedUser;
            const profileUrl = this.safeExternalUrl(profile?.html_url, `https://github.com/${encodeURIComponent(login)}`);
            const displayName = profile?.name ? `${profile.name} (@${login})` : `@${login}`;
            const publicRepos = Number.isFinite(Number(profile?.public_repos)) ? Number(profile.public_repos) : repos.length;

            return `
                ${this.freshnessMarkup(meta, 'GitHub REST')}
                ${warnings.map((warning) => `
                    <div class="xp-api-error" role="status"><strong>Resultado parcial</strong><span>${this.escape(warning)}</span></div>
                `).join('')}
                <div class="xp-api-summary">
                    <strong><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${this.escape(displayName)}</a></strong>
                    <span>${this.formatCount(publicRepos, 'repo público', 'repos públicos')}</span>
                    ${profile ? `<span>${this.formatCount(profile.followers, 'seguidor', 'seguidores')}</span>` : ''}
                    ${profile ? `<span>${this.formatCount(profile.following, 'seguido', 'seguidos')}</span>` : ''}
                    ${profile?.location ? `<span>${this.escape(profile.location)}</span>` : ''}
                    ${profile?.bio ? `<p>${this.escape(profile.bio)}</p>` : ''}
                </div>
                ${repos.length ? `
                    <div class="xp-github-list" aria-label="Repositorios recientes de ${this.escape(login)}">
                        ${repos.map((repo) => this.githubRepoMarkup(repo)).join('')}
                    </div>
                ` : this.emptyMarkup(
                    warnings.length ? 'Repositorios no disponibles' : 'Sin repositorios públicos',
                    warnings.length ? 'El perfil se cargó, pero la lista de repositorios no respondió.' : `@${login} todavía no tiene repositorios públicos.`
                )}
            `;
        }

        githubRepoMarkup(repo) {
            const repoName = String(repo?.name || 'Repositorio sin nombre');
            const repoUrl = this.safeExternalUrl(repo?.html_url, 'https://github.com/');
            const updated = this.fullDate(repo?.pushed_at || repo?.updated_at);
            const tags = [
                repo?.language || 'Stack mixto',
                this.formatCount(repo?.stargazers_count, 'estrella', 'estrellas'),
                this.formatCount(repo?.forks_count, 'fork', 'forks'),
                `Actualizado ${updated}`
            ];
            if (repo?.archived) tags.push('Archivado');

            return `
                <article>
                    <h3><a href="${repoUrl}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${this.escape(repoName)} en GitHub">${this.escape(repoName)}</a></h3>
                    <p>${this.escape(repo?.description || 'Sin descripción pública.')}</p>
                    <footer>${tags.map((tag) => `<span>${this.escape(tag)}</span>`).join('')}</footer>
                </article>
            `;
        }

        renderCountry(item, requestedCountry, meta, options = {}) {
            const name = item.name?.common || requestedCountry;
            const officialName = item.name?.official && item.name.official !== name ? item.name.official : '';
            const languages = Object.values(item.languages || {}).join(', ') || 'N/D';
            const currencies = Object.entries(item.currencies || {}).map(([code, currency]) => {
                const symbol = currency?.symbol ? ` (${currency.symbol})` : '';
                return `${code}: ${currency?.name || 'Moneda'}${symbol}`;
            }).join(', ') || 'N/D';
            const flagUrl = this.safeExternalUrl(item.flags?.svg || item.flags?.png);
            const mapUrl = this.safeExternalUrl(item.maps?.googleMaps || item.maps?.openStreetMaps);
            const population = Number(item.population || 0);
            const area = Number(item.area || 0);
            const density = area > 0 ? population / area : null;
            const provider = options.provider || 'mledoze Countries + Banco Mundial';
            const populationLabel = item._populationYear ? `Población (${item._populationYear})` : 'Población';

            return `
                ${this.freshnessMarkup(meta, provider)}
                ${options.warning ? `
                    <div class="xp-api-error" role="status">
                        <strong>Proveedor de respaldo activo</strong>
                        <span>${this.escape(options.warning)}</span>
                    </div>
                ` : ''}
                <div class="xp-country-card">
                    ${flagUrl ? `<img src="${flagUrl}" alt="Bandera de ${this.escape(name)}" loading="lazy" decoding="async">` : ''}
                    <div>
                        <small>${this.escape([item.cca2, item.cca3].filter(Boolean).join(' / ') || 'Datos abiertos')}</small>
                        <h3>${this.escape(name)}</h3>
                        ${officialName ? `<p>${this.escape(officialName)}</p>` : ''}
                        <dl>
                            <dt>Capital</dt><dd>${this.escape((item.capital || ['N/D']).join(', '))}</dd>
                            <dt>Región</dt><dd>${this.escape([item.region, item.subregion].filter(Boolean).join(', ') || 'N/D')}</dd>
                            <dt>${this.escape(populationLabel)}</dt><dd>${population ? this.escape(this.formatInteger(population)) : 'N/D'}</dd>
                            <dt>Superficie</dt><dd>${area ? `${this.escape(this.formatInteger(area))} km²` : 'N/D'}</dd>
                            <dt>Densidad</dt><dd>${density ? `${this.escape(this.formatNumber(density, 1))} hab./km²` : 'N/D'}</dd>
                            <dt>Idiomas</dt><dd>${this.escape(languages)}</dd>
                            <dt>Monedas</dt><dd>${this.escape(currencies)}</dd>
                            <dt>Husos horarios</dt><dd>${this.escape(item.timezones?.length ? item.timezones.join(', ') : 'N/D')}</dd>
                            <dt>Fronteras</dt><dd>${this.escape(item.borders?.length ? item.borders.join(', ') : 'Sin fronteras terrestres')}</dd>
                            ${mapUrl ? `<dt>Mapa</dt><dd><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">Abrir mapa</a></dd>` : ''}
                        </dl>
                    </div>
                </div>
            `;
        }

        freshnessMarkup(meta, provider) {
            const sourceLabel = meta.source === 'cache'
                ? (meta.stale ? 'Caché local desactualizada' : 'Caché local reciente')
                : 'Datos en vivo';
            const updatedLabel = meta.source === 'network' ? 'ahora' : this.relativeTime(meta.savedAt);
            const recovery = meta.recoveryError
                ? '<span>La API no respondió; conservamos la última respuesta disponible.</span>'
                : '';
            const persistence = meta.source === 'network' && meta.cachePersisted === false
                ? '<span>El navegador no permitió guardar esta respuesta.</span>'
                : '';
            const rateLimit = Number.isFinite(meta.rateLimitRemaining)
                ? `<span>Consultas de GitHub disponibles: ${this.escape(meta.rateLimitRemaining)}</span>`
                : '';

            return `
                <div class="xp-api-summary" data-api-freshness="${meta.source}" data-api-stale="${meta.stale ? 'true' : 'false'}">
                    <strong>${this.escape(sourceLabel)}</strong>
                    <span>Proveedor: ${this.escape(provider)}</span>
                    <span>Actualizado: <time datetime="${this.isoDate(meta.savedAt)}">${this.escape(updatedLabel)}</time></span>
                    ${recovery}${persistence}${rateLimit}
                </div>
            `;
        }

        loadingMarkup(message) {
            return `
                <div class="xp-api-loading" role="status"><span aria-hidden="true"></span>${this.escape(message)}</div>
                <div class="xp-api-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
            `;
        }

        emptyMarkup(title, message) {
            return `
                <div class="xp-api-empty" data-api-empty="true" role="status">
                    <div><strong>${this.escape(title)}</strong><p>${this.escape(message)}</p></div>
                </div>
            `;
        }

        errorMarkup(error, channel, title = 'No se pudo consultar la API') {
            const message = this.userMessage(error);
            let detail = '';
            if (error?.code === 'rate-limit' && Number.isFinite(error.details?.reset)) {
                detail = `<span>El límite se renueva ${this.escape(this.relativeTime(error.details.reset * 1000, true))}.</span>`;
            }
            return `
                <div class="xp-api-error" data-api-error="${this.escape(error?.code || 'unknown')}" role="alert">
                    <strong>${this.escape(title)}</strong>
                    <span>${this.escape(message)}</span>
                    ${detail}
                    <button type="button" data-api-retry="${this.escape(channel)}">Reintentar</button>
                </div>
            `;
        }

        renderLoading(result, message) {
            if (!result) return;
            result.setAttribute('aria-busy', 'true');
            result.innerHTML = this.loadingMarkup(message);
        }

        completeView(channel, meta) {
            this.loaded.add(channel);
            const result = this.getResult(channel);
            result?.setAttribute('aria-busy', 'false');
            this.setHealth(
                channel,
                meta.source === 'cache' ? 'cached' : 'success',
                meta.stale ? 'La respuesta puede estar desactualizada' : this.fullDateTime(meta.savedAt)
            );
            this.updateLastUpdated(channel, meta);
        }

        updateLastUpdated(channel, meta) {
            this.root.querySelectorAll('[data-api-last-updated]').forEach((node) => {
                const target = node.dataset.apiLastUpdated;
                if (target && target !== channel && target !== 'all') return;

                const label = meta.source === 'cache'
                    ? `Última respuesta: ${this.relativeTime(meta.savedAt)}`
                    : 'Última respuesta: ahora';
                node.textContent = label;
                node.title = this.fullDateTime(meta.savedAt);
                if (node.tagName === 'TIME') node.dateTime = this.isoDate(meta.savedAt);
                node.dataset.apiSource = meta.source;
                node.dataset.apiStale = meta.stale ? 'true' : 'false';
            });
        }

        readAndValidate(channel) {
            const input = this.root.querySelector(CHANNEL_CONFIG[channel].input);
            if (!input) return { ok: false, message: 'Falta el campo de búsqueda.', input: null };

            let value = input.value.trim().replace(/\s+/g, ' ');
            if (channel === 'github') value = this.normalizeGithubUser(value);

            if (!value) return { ok: false, message: 'Escribí un valor antes de consultar.', input };
            if (channel === 'github') {
                if (value.length > 39) return { ok: false, message: 'El usuario de GitHub puede tener hasta 39 caracteres.', input };
                if (!/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(value) || value.includes('--')) {
                    return { ok: false, message: 'Usá un usuario válido de GitHub: letras, números y guiones simples.', input };
                }
            } else {
                const maxLength = 80;
                if (value.length < 2 || value.length > maxLength) {
                    return { ok: false, message: `La búsqueda debe tener entre 2 y ${maxLength} caracteres.`, input };
                }
                const pattern = channel === 'weather'
                    ? /^[\p{L}\p{M}\d\s.'’,-]+$/u
                    : /^[\p{L}\p{M}\d\s.'’(),-]+$/u;
                if (!pattern.test(value)) {
                    return { ok: false, message: 'La búsqueda contiene caracteres no admitidos.', input };
                }
            }

            input.value = value;
            this.clearValidation(input);
            return { ok: true, value, input };
        }

        showValidation(channel, validation) {
            const result = this.getResult(channel);
            if (validation.input) {
                validation.input.setAttribute('aria-invalid', 'true');
                validation.input.setCustomValidity(validation.message);
                validation.input.focus();
            }
            if (result) {
                result.innerHTML = `
                    <div class="xp-api-error" data-api-error="validation" role="alert">
                        <strong>Revisá la búsqueda</strong>
                        <span>${this.escape(validation.message)}</span>
                    </div>
                `;
            }
            this.setHealth(channel, 'error', validation.message);
            this.setLog(`Consulta no ejecutada: ${validation.message}`);
            return Promise.resolve({ channel, status: 'validation' });
        }

        clearValidation(input) {
            input.removeAttribute('aria-invalid');
            input.setCustomValidity('');
        }

        normalizeGithubUser(value) {
            let user = value.replace(/^@/, '');
            if (/^https?:\/\//i.test(user)) {
                try {
                    const url = new URL(user);
                    if (['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
                        user = url.pathname.split('/').filter(Boolean)[0] || '';
                    }
                } catch (error) { /* Validation below provides the user-facing error. */ }
            }
            return user.replace(/^@/, '').trim();
        }

        pickPlace(results, query) {
            if (!Array.isArray(results) || !results.length) return null;
            const needle = this.normalizedText(query);
            return [...results].sort((a, b) => {
                const score = (place) => {
                    const name = this.normalizedText(place?.name);
                    if (name === needle) return 100;
                    if (name.startsWith(needle)) return 60;
                    if (name.includes(needle)) return 30;
                    return 0;
                };
                return score(b) - score(a) || Number(b.population || 0) - Number(a.population || 0);
            })[0];
        }

        pickCountry(countries, query) {
            if (!Array.isArray(countries) || !countries.length) return null;
            const needle = this.normalizedText(query);
            return [...countries].sort((a, b) => {
                const score = (country) => {
                    const candidates = [
                        country?.name?.common,
                        country?.name?.official,
                        country?.cca2,
                        country?.cca3,
                        ...Object.values(country?.name?.nativeName || country?.name?.native || {}).flatMap((name) => [name?.common, name?.official]),
                        ...(country?.altSpellings || [])
                    ].filter(Boolean).map((value) => this.normalizedText(value));
                    if (candidates.includes(needle)) return 100;
                    if (candidates.some((value) => value.startsWith(needle))) return 60;
                    if (candidates.some((value) => value.includes(needle))) return 30;
                    return 0;
                };
                return score(b) - score(a) || Number(b.population || 0) - Number(a.population || 0);
            })[0];
        }

        isValidForecast(data) {
            return Boolean(
                data &&
                typeof data === 'object' &&
                data.current &&
                Number.isFinite(Number(data.current.temperature_2m)) &&
                data.daily &&
                Array.isArray(data.daily.time)
            );
        }

        weatherCode(code) {
            const codes = {
                0: 'Cielo despejado',
                1: 'Mayormente despejado',
                2: 'Parcialmente nublado',
                3: 'Nublado',
                45: 'Niebla',
                48: 'Niebla con escarcha',
                51: 'Llovizna leve',
                53: 'Llovizna moderada',
                55: 'Llovizna intensa',
                56: 'Llovizna helada leve',
                57: 'Llovizna helada intensa',
                61: 'Lluvia leve',
                63: 'Lluvia moderada',
                65: 'Lluvia intensa',
                66: 'Lluvia helada leve',
                67: 'Lluvia helada intensa',
                71: 'Nieve leve',
                73: 'Nieve moderada',
                75: 'Nieve intensa',
                77: 'Granos de nieve',
                80: 'Chaparrones leves',
                81: 'Chaparrones moderados',
                82: 'Chaparrones intensos',
                85: 'Nevadas leves',
                86: 'Nevadas intensas',
                95: 'Tormenta',
                96: 'Tormenta con granizo leve',
                99: 'Tormenta con granizo intenso'
            };
            return codes[Number(code)] || 'Condición no informada';
        }

        userMessage(error) {
            if (!error) return 'Ocurrió un error inesperado.';
            if (error.code === 'weather-unavailable') return error.message;
            if (error.code === 'offline') return 'No hay conexión y no encontramos una copia local.';
            return error.message || 'Ocurrió un error inesperado.';
        }

        successLog(provider, subject, meta, partial = false) {
            const source = meta.source === 'cache'
                ? `caché local${meta.stale ? ' desactualizada' : ''}`
                : 'API en vivo';
            return `${provider}${partial ? ' parcial' : ''}: ${subject}. Fuente: ${source}.`;
        }

        channelLabel(channel) {
            return {
                weather: 'Clima',
                github: 'GitHub',
                countries: 'Datos públicos'
            }[channel] || channel;
        }

        getResult(channel) {
            return this.root.querySelector(CHANNEL_CONFIG[channel]?.result || '.__missing-result');
        }

        setLog(message) {
            if (this.log) this.log.textContent = message;
        }

        headerNumber(response, name) {
            const raw = response.headers?.get(name);
            if (raw === null || raw === undefined || raw === '') return null;
            const value = Number(raw);
            return Number.isFinite(value) ? value : null;
        }

        formatTemperature(value, includeUnit = true) {
            const number = Number(value);
            if (!Number.isFinite(number)) return 'N/D';
            const formatted = Math.round(number).toLocaleString(this.intlLocale);
            return `${formatted}${includeUnit ? '&deg;C' : '&deg;'}`;
        }

        formatMeasurement(value, unit, digits = 0) {
            const number = Number(value);
            if (!Number.isFinite(number)) return 'N/D';
            return `${this.escape(this.formatNumber(number, digits))} ${this.escape(unit)}`;
        }

        formatCount(value, singular, plural) {
            const number = Number(value);
            const safeNumber = Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
            return `${this.formatInteger(safeNumber)} ${safeNumber === 1 ? singular : plural}`;
        }

        formatInteger(value) {
            const number = Number(value);
            if (!Number.isFinite(number)) return 'N/D';
            return new Intl.NumberFormat(this.intlLocale, { maximumFractionDigits: 0 }).format(number);
        }

        formatNumber(value, digits = 0) {
            const number = Number(value);
            if (!Number.isFinite(number)) return 'N/D';
            return new Intl.NumberFormat(this.intlLocale, {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits
            }).format(number);
        }

        shortDate(value) {
            const raw = String(value || '');
            const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
                ? new Date(`${raw}T12:00:00`)
                : new Date(value);
            if (Number.isNaN(date.getTime())) return String(value || 'N/D');
            return new Intl.DateTimeFormat(this.intlLocale, { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
        }

        fullDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return 'sin fecha';
            return new Intl.DateTimeFormat(this.intlLocale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
        }

        fullDateTime(value) {
            const date = new Date(Number(value));
            if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
            return new Intl.DateTimeFormat(this.intlLocale, {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        }

        formatObservationTime(value, timezone) {
            if (!value) return 'N/D';
            const raw = String(value);
            const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
            const date = new Date(hasExplicitZone ? raw : `${raw}${raw.length === 16 ? ':00' : ''}Z`);
            if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ');
            try {
                return new Intl.DateTimeFormat(this.intlLocale, {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: hasExplicitZone ? (timezone || undefined) : 'UTC'
                }).format(date);
            } catch (error) {
                return String(value).replace('T', ' ');
            }
        }

        relativeTime(value, future = false) {
            const timestamp = Number(value);
            if (!Number.isFinite(timestamp)) return 'en un momento';
            const delta = timestamp - Date.now();
            const absolute = Math.abs(delta);
            let unit = 'second';
            let divisor = 1000;
            if (absolute >= 24 * 60 * 60 * 1000) {
                unit = 'day';
                divisor = 24 * 60 * 60 * 1000;
            } else if (absolute >= 60 * 60 * 1000) {
                unit = 'hour';
                divisor = 60 * 60 * 1000;
            } else if (absolute >= 60 * 1000) {
                unit = 'minute';
                divisor = 60 * 1000;
            }
            let amount = Math.round(delta / divisor);
            if (!future && amount > 0) amount = -amount;
            if (amount === 0 && !future) return 'hace unos segundos';
            try {
                return new Intl.RelativeTimeFormat(this.intlLocale, { numeric: 'auto' }).format(amount, unit);
            } catch (error) {
                return this.fullDateTime(timestamp);
            }
        }

        isoDate(value) {
            const date = new Date(Number(value));
            return Number.isNaN(date.getTime()) ? '' : date.toISOString();
        }

        cacheToken(value) {
            return this.normalizedText(value).replace(/[^a-z\d]+/g, '.').replace(/^\.|\.$/g, '') || 'default';
        }

        normalizedText(value) {
            return String(value || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();
        }

        abortError() {
            try {
                return new DOMException('Consulta cancelada', 'AbortError');
            } catch (error) {
                const abort = new Error('Consulta cancelada');
                abort.name = 'AbortError';
                return abort;
            }
        }

        escape(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        safeExternalUrl(value, fallback = '') {
            if (!String(value || '').trim()) return this.escape(fallback);
            try {
                const url = new URL(String(value || ''), window.location.href);
                if (!['http:', 'https:'].includes(url.protocol)) return this.escape(fallback);
                return this.escape(url.href);
            } catch (error) {
                return this.escape(fallback);
            }
        }
    }

    window.initApiCenterApp = function initApiCenterApp(scope = document) {
        const root = scope.matches?.('[data-api-root]')
            ? scope
            : scope.querySelector?.('[data-api-root]');
        if (!root) return null;
        if (root.__apiCenterApp) return root.__apiCenterApp;

        return new ApiCenterApp(root).init();
    };

    window.destroyApiCenterApp = function destroyApiCenterApp(scope = document) {
        const root = scope.matches?.('[data-api-root]')
            ? scope
            : scope.querySelector?.('[data-api-root]');
        if (!root?.__apiCenterApp) return false;
        root.__apiCenterApp.destroy();
        return true;
    };
})();
