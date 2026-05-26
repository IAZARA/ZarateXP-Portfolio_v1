(function () {
    class ApiCenterApp {
        constructor(root) {
            this.root = root.querySelector('[data-api-root]');
            this.log = this.root.querySelector('[data-api-log]');
        }

        init() {
            this.root.querySelectorAll('[data-api-tab]').forEach((button) => {
                button.addEventListener('click', () => this.selectTab(button.dataset.apiTab));
            });

            this.root.querySelector('[data-weather-run]').addEventListener('click', () => this.loadWeather());
            this.root.querySelector('[data-github-run]').addEventListener('click', () => this.loadGithub());
            this.root.querySelector('[data-country-run]').addEventListener('click', () => this.loadCountry());
            this.root.querySelector('[data-api-run-all]').addEventListener('click', () => {
                this.loadWeather();
                this.loadGithub();
                this.loadCountry();
            });

            this.loadWeather();
        }

        selectTab(tabName) {
            this.root.querySelectorAll('[data-api-tab]').forEach((button) => {
                button.classList.toggle('active', button.dataset.apiTab === tabName);
            });
            this.root.querySelectorAll('[data-api-panel]').forEach((panel) => {
                panel.classList.toggle('active', panel.dataset.apiPanel === tabName);
            });
            this.setLog(`Vista activa: ${tabName}`);
        }

        async loadWeather() {
            const result = this.root.querySelector('[data-weather-result]');
            const city = this.root.querySelector('[data-weather-city]').value.trim() || 'Buenos Aires';
            result.innerHTML = this.loadingMarkup('Buscando coordenadas...');

            try {
                const geocode = await this.fetchJson(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`,
                    `weather.geo.${city.toLowerCase()}`
                );
                const place = geocode.results?.[0];
                if (!place) throw new Error(`No encontre la ciudad "${city}"`);

                result.innerHTML = this.loadingMarkup('Consultando forecast...');
                const forecast = await this.fetchJson(
                    [
                        'https://api.open-meteo.com/v1/forecast',
                        `?latitude=${place.latitude}`,
                        `&longitude=${place.longitude}`,
                        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code',
                        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                        '&timezone=auto'
                    ].join(''),
                    `weather.forecast.${place.latitude}.${place.longitude}`
                );

                const current = forecast.current;
                const daily = forecast.daily;
                result.innerHTML = `
                    <div class="xp-weather-card">
                        <div>
                            <small>Open-Meteo</small>
                            <h3>${this.escape(place.name)}, ${this.escape(place.country || '')}</h3>
                            <strong>${Math.round(current.temperature_2m)}&deg;C</strong>
                            <span>${this.weatherCode(current.weather_code)}</span>
                        </div>
                        <dl>
                            <dt>Sensacion</dt><dd>${Math.round(current.apparent_temperature)}&deg;C</dd>
                            <dt>Humedad</dt><dd>${current.relative_humidity_2m}%</dd>
                            <dt>Viento</dt><dd>${Math.round(current.wind_speed_10m)} km/h</dd>
                            <dt>Precipitacion</dt><dd>${current.precipitation} mm</dd>
                        </dl>
                    </div>
                    <div class="xp-api-cards">
                        ${daily.time.slice(0, 5).map((day, index) => `
                            <article>
                                <strong>${this.shortDate(day)}</strong>
                                <span>${Math.round(daily.temperature_2m_min[index])}&deg; / ${Math.round(daily.temperature_2m_max[index])}&deg;</span>
                                <small>Lluvia ${daily.precipitation_probability_max[index] ?? 0}%</small>
                            </article>
                        `).join('')}
                    </div>
                `;
                this.setLog(`Clima actualizado desde Open-Meteo para ${place.name}.`);
            } catch (error) {
                try {
                    result.innerHTML = this.loadingMarkup('Open-Meteo no respondio. Probando wttr.in...');
                    const wttr = await this.fetchJson(
                        `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
                        `weather.wttr.${city.toLowerCase()}`
                    );
                    result.innerHTML = this.renderWttrWeather(wttr, city, error);
                    this.setLog(`Clima actualizado desde wttr.in para ${city}. Open-Meteo respondio: ${error.message}`);
                } catch (fallbackError) {
                    result.innerHTML = this.errorMarkup(fallbackError, this.weatherFallback(city, error));
                    this.setLog(`Clima en fallback local: ${fallbackError.message}`);
                }
            }
        }

        async loadGithub() {
            const result = this.root.querySelector('[data-github-result]');
            const user = this.root.querySelector('[data-github-user]').value.trim() || 'IAZARA';
            result.innerHTML = this.loadingMarkup('Consultando GitHub REST...');

            try {
                const repos = await this.fetchJson(
                    `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=8`,
                    `github.repos.${user.toLowerCase()}`
                );
                if (!Array.isArray(repos)) throw new Error('Respuesta inesperada de GitHub');

                result.innerHTML = `
                    <div class="xp-api-summary">
                        <strong>${repos.length} repos publicos recientes</strong>
                        <span>Endpoint: /users/{user}/repos</span>
                    </div>
                    <div class="xp-github-list">
                        ${repos.map((repo) => `
                            <article>
                                <h3><a href="${repo.html_url}" target="_blank" rel="noopener">${this.escape(repo.name)}</a></h3>
                                <p>${this.escape(repo.description || 'Sin descripcion publica')}</p>
                                <footer>
                                    <span>${this.escape(repo.language || 'Stack mixto')}</span>
                                    <span>${repo.stargazers_count} stars</span>
                                    <span>${this.shortDate(repo.updated_at)}</span>
                                </footer>
                            </article>
                        `).join('')}
                    </div>
                `;
                this.setLog(`Repos cargados desde GitHub REST para @${user}.`);
            } catch (error) {
                result.innerHTML = this.errorMarkup(error, this.githubFallback(user));
                this.setLog(`GitHub en fallback: ${error.message}`);
            }
        }

        async loadCountry() {
            const result = this.root.querySelector('[data-country-result]');
            const country = this.root.querySelector('[data-country-name]').value.trim() || 'Argentina';
            result.innerHTML = this.loadingMarkup('Consultando REST Countries...');

            try {
                const countries = await this.fetchJson(
                    `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,region,population,flags,languages,currencies`,
                    `country.${country.toLowerCase()}`
                );
                const item = countries?.[0];
                if (!item) throw new Error(`No encontre datos para "${country}"`);
                const languages = Object.values(item.languages || {}).join(', ');
                const currencies = Object.values(item.currencies || {}).map((currency) => currency.name).join(', ');

                result.innerHTML = `
                    <div class="xp-country-card">
                        <img src="${item.flags?.png || ''}" alt="Bandera de ${this.escape(item.name?.common || country)}">
                        <div>
                            <small>REST Countries</small>
                            <h3>${this.escape(item.name?.common || country)}</h3>
                            <dl>
                                <dt>Capital</dt><dd>${this.escape((item.capital || ['N/A']).join(', '))}</dd>
                                <dt>Region</dt><dd>${this.escape(item.region || 'N/A')}</dd>
                                <dt>Poblacion</dt><dd>${Number(item.population || 0).toLocaleString('es-AR')}</dd>
                                <dt>Idiomas</dt><dd>${this.escape(languages || 'N/A')}</dd>
                                <dt>Moneda</dt><dd>${this.escape(currencies || 'N/A')}</dd>
                            </dl>
                        </div>
                    </div>
                `;
                this.setLog(`Datos cargados desde REST Countries para ${item.name?.common || country}.`);
            } catch (error) {
                result.innerHTML = this.errorMarkup(error, this.countryFallback(country));
                this.setLog(`REST Countries en fallback: ${error.message}`);
            }
        }

        async fetchJson(url, cacheKey) {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 8500);
            const namespacedKey = `zarateXP.apiCache.${cacheKey}`;

            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                localStorage.setItem(namespacedKey, JSON.stringify({ data, savedAt: Date.now() }));
                return data;
            } catch (error) {
                const cached = localStorage.getItem(namespacedKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    this.setLog(`Usando cache local (${this.shortDate(parsed.savedAt)}).`);
                    return parsed.data;
                }
                throw error;
            } finally {
                window.clearTimeout(timeout);
            }
        }

        loadingMarkup(message) {
            return `<div class="xp-api-loading"><span></span>${this.escape(message)}</div>`;
        }

        errorMarkup(error, fallback) {
            return `
                <div class="xp-api-error">
                    <strong>No se pudo consultar la API</strong>
                    <span>${this.escape(error.message)}</span>
                </div>
                ${fallback}
            `;
        }

        weatherFallback(city) {
            return `
                <div class="xp-weather-card fallback">
                    <div>
                        <small>Modo demo</small>
                        <h3>${this.escape(city)}</h3>
                        <strong>22&deg;C</strong>
                        <span>Datos de ejemplo</span>
                    </div>
                    <dl>
                        <dt>Estado</dt><dd>Fallback local</dd>
                        <dt>Patron</dt><dd>Fetch + cache + error state</dd>
                    </dl>
                </div>
            `;
        }

        renderWttrWeather(data, city, previousError) {
            const current = data.current_condition?.[0] || {};
            const forecast = data.weather || [];
            return `
                <div class="xp-api-summary">
                    <strong>Proveedor secundario activo</strong>
                    <span>Open-Meteo fallo: ${this.escape(previousError.message)}</span>
                    <span>Respuesta recuperada con wttr.in</span>
                </div>
                <div class="xp-weather-card">
                    <div>
                        <small>wttr.in</small>
                        <h3>${this.escape(city)}</h3>
                        <strong>${this.escape(current.temp_C || 'N/A')}&deg;C</strong>
                        <span>${this.escape(current.weatherDesc?.[0]?.value || 'Sin descripcion')}</span>
                    </div>
                    <dl>
                        <dt>Sensacion</dt><dd>${this.escape(current.FeelsLikeC || 'N/A')}&deg;C</dd>
                        <dt>Humedad</dt><dd>${this.escape(current.humidity || 'N/A')}%</dd>
                        <dt>Viento</dt><dd>${this.escape(current.windspeedKmph || 'N/A')} km/h</dd>
                        <dt>Visibilidad</dt><dd>${this.escape(current.visibility || 'N/A')} km</dd>
                    </dl>
                </div>
                <div class="xp-api-cards">
                    ${forecast.slice(0, 5).map((day) => `
                        <article>
                            <strong>${this.shortDate(day.date)}</strong>
                            <span>${this.escape(day.mintempC)}&deg; / ${this.escape(day.maxtempC)}&deg;</span>
                            <small>UV ${this.escape(day.uvIndex || 'N/A')}</small>
                        </article>
                    `).join('')}
                </div>
            `;
        }

        githubFallback(user) {
            return `
                <div class="xp-github-list">
                    <article>
                        <h3>${this.escape(user)}/portfolio-api-demo</h3>
                        <p>Fallback local para mostrar el layout si GitHub limita la consulta.</p>
                        <footer><span>JavaScript</span><span>REST</span><span>Cache</span></footer>
                    </article>
                </div>
            `;
        }

        countryFallback(country) {
            return `
                <div class="xp-country-card fallback">
                    <div>
                        <small>Modo demo</small>
                        <h3>${this.escape(country)}</h3>
                        <dl>
                            <dt>Integracion</dt><dd>REST Countries</dd>
                            <dt>Estado</dt><dd>Fallback local disponible</dd>
                        </dl>
                    </div>
                </div>
            `;
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
                61: 'Lluvia leve',
                63: 'Lluvia moderada',
                65: 'Lluvia intensa',
                80: 'Chaparrones',
                95: 'Tormenta'
            };
            return codes[code] || `Codigo ${code}`;
        }

        shortDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return String(value);
            return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(date);
        }

        setLog(message) {
            this.log.textContent = message;
        }

        escape(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    window.initApiCenterApp = function initApiCenterApp(scope = document) {
        const rootWindow = scope.querySelector?.('[data-api-root]') ? scope : document;
        const app = new ApiCenterApp(rootWindow);
        app.init();
        return app;
    };
})();
