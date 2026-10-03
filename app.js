/**
 * WeatherGPT - Main Application Controller
 * Connects UI views, search autocomplete, unit conversions, graphs, and WeatherGPT AI
 */

const App = (() => {
  let currentView = 'home';
  let forecastTab = 'today';
  let alertsFilter = 'all';

  // Initialize the entire application
  const init = () => {
    // 1. Setup navigation event listeners
    setupNavigation();

    // 2. Setup Unit Toggle (°C / °F)
    setupUnitToggle();

    // 3. Setup Location Search & Autocomplete
    setupSearch();

    // 4. Setup Map layer controls and timeline
    setupMapControls();

    // 5. Setup Forecast view tabs
    setupForecastTabs();

    // 6. Setup Alerts filter
    setupAlertsFilters();

    // 7. Initialize WeatherGPT Chatbot
    WeatherGPT.init();

    // 8. Render default city (Lucknow)
    renderAll();

    // 9. Initialize Radar Map Engine
    setTimeout(() => {
      WeatherRadarMap.init('radar-canvas-home');
      WeatherRadarMap.init('radar-canvas-full');
    }, 150);

    // Responsive window resize chart re-renders
    window.addEventListener('resize', debounce(() => {
      renderCharts();
    }, 250));
  };

  /**
   * Navigation & View Switching
   */
  const setupNavigation = () => {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        if (view === 'weathergpt') {
          WeatherGPT.openPanel();
        } else {
          switchView(view);
        }
      });
    });

    // Mobile Hamburger Menu
    const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileCloseBtn = document.getElementById('mobile-drawer-close');
    const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');

    const toggleMobileMenu = (open) => {
      if (mobileDrawer) mobileDrawer.classList.toggle('open', open);
      if (mobileBackdrop) mobileBackdrop.classList.toggle('open', open);
    };

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleMobileMenu(true));
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => toggleMobileMenu(false));
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', () => toggleMobileMenu(false));

    // Mobile nav item clicks
    const mobileLinks = document.querySelectorAll('.mobile-nav-link[data-view]');
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        toggleMobileMenu(false);
        if (view === 'weathergpt') {
          WeatherGPT.openPanel();
        } else {
          switchView(view);
        }
      });
    });
  };

  /**
   * Switch between main application pages/views
   */
  const switchView = (viewName) => {
    currentView = viewName;

    // Update active nav link classes
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Update active view containers
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Trigger re-render of relevant charts or maps
    if (viewName === 'forecast') {
      setTimeout(() => renderForecastPage(), 100);
    } else if (viewName === 'maps') {
      setTimeout(() => {
        WeatherRadarMap.init('radar-canvas-full');
      }, 100);
    } else if (viewName === 'climate') {
      setTimeout(() => renderClimatePage(), 100);
    }
  };

  /**
   * Setup Unit Toggle (°C / °F)
   */
  const setupUnitToggle = () => {
    const toggleBtn = document.getElementById('unit-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const newUnit = WeatherDataEngine.toggleUnit();
        toggleBtn.textContent = newUnit === 'C' ? '°C / °F' : '°F / °C';
        toggleBtn.setAttribute('data-unit', newUnit);
        
        // Show subtle feedback toast
        showToast(`Temperature unit switched to °${newUnit}`);
        
        // Update all UI elements
        renderAll();
      });
    }
  };

  /**
   * Setup Search Autocomplete and Geolocation
   */
  const setupSearch = () => {
    const searchInputs = [
      document.getElementById('header-search-input'),
      document.getElementById('hero-search-input')
    ];

    searchInputs.forEach(input => {
      if (!input) return;

      const dropdownId = input.id === 'header-search-input' ? 'header-search-dropdown' : 'hero-search-dropdown';
      const dropdown = document.getElementById(dropdownId);

      input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!val) {
          if (dropdown) dropdown.classList.remove('show');
          return;
        }

        // Search local index first
        const matches = WeatherDataEngine.searchLocalCities(val);
        renderSearchDropdown(dropdown, matches, val);
      });

      input.addEventListener('focus', () => {
        const val = input.value.trim();
        if (val && dropdown) dropdown.classList.add('show');
      });

      // Close dropdown on click outside
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && (!dropdown || !dropdown.contains(e.target))) {
          if (dropdown) dropdown.classList.remove('show');
        }
      });
    });

    // "Use My Location" buttons
    const geoButtons = [
      document.getElementById('hero-my-location-btn'),
      document.getElementById('header-my-location-btn')
    ];

    geoButtons.forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', handleUseMyLocation);
    });
  };

  /**
   * Render autocomplete dropdown suggestions
   */
  const renderSearchDropdown = (dropdown, matches, query) => {
    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="search-empty-state">
          <span>Search global database for "<strong>${escapeHtml(query)}</strong>"</span>
          <button class="search-fetch-live-btn" id="btn-fetch-live-${Math.random().toString(36).substring(7)}">
            🌍 Fetch Live via Open-Meteo
          </button>
        </div>
      `;
      dropdown.classList.add('show');

      const liveBtn = dropdown.querySelector('.search-fetch-live-btn');
      if (liveBtn) {
        liveBtn.onclick = () => fetchAndSelectLiveCity(query);
      }
      return;
    }

    matches.forEach(item => {
      const cityData = WeatherDataEngine.getCityByKey(item.key);
      const tempDisplay = cityData ? WeatherDataEngine.formatTemp(cityData.current.temp) : '';
      const iconSvg = cityData ? WeatherIcons.getIconSvg(cityData.current.conditionCode, 24) : '';

      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.innerHTML = `
        <div class="search-item-info">
          <span class="search-item-name">${item.name}</span>
          <span class="search-item-sub">${item.region ? item.region + ', ' : ''}${item.country}</span>
        </div>
        <div class="search-item-temp">
          ${iconSvg}
          <span>${tempDisplay}</span>
        </div>
      `;

      row.onclick = () => {
        selectCityByKey(item.key);
        dropdown.classList.remove('show');
      };

      dropdown.appendChild(row);
    });

    dropdown.classList.add('show');
  };

  /**
   * Select a city by database key
   */
  const selectCityByKey = (key) => {
    const cityData = WeatherDataEngine.getCityByKey(key);
    if (!cityData) return;

    WeatherDataEngine.setActiveCity(cityData);
    WeatherRadarMap.updateCity(cityData.name, WeatherDataEngine.formatTemp(cityData.current.temp));
    
    // Clear search inputs
    const hInput = document.getElementById('header-search-input');
    const bInput = document.getElementById('hero-search-input');
    if (hInput) hInput.value = '';
    if (bInput) bInput.value = '';

    showToast(`Loaded weather for ${cityData.name}`);
    renderAll();
  };

  /**
   * Fetch live city using Open-Meteo Geocoding API
   */
  const fetchAndSelectLiveCity = async (cityName) => {
    showToast(`Searching global coordinates for ${cityName}...`);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        showToast(`City "${cityName}" not found. Try Lucknow or Delhi.`);
        return;
      }

      const place = data.results[0];
      showToast(`Fetching live atmosphere data for ${place.name}...`);
      
      const liveCityData = await WeatherDataEngine.fetchLiveWeather(
        place.latitude,
        place.longitude,
        place.name,
        place.admin1 || '',
        place.country || ''
      );

      if (liveCityData) {
        WeatherDataEngine.setActiveCity(liveCityData);
        WeatherRadarMap.updateCity(liveCityData.name, WeatherDataEngine.formatTemp(liveCityData.current.temp));
        showToast(`Live weather updated for ${place.name}!`);
        renderAll();
      } else {
        showToast(`Unable to load live feed. Showing cached records.`);
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err);
      showToast(`Network error. Reverting to cached cities.`);
    }
  };

  /**
   * Handle "Use My Location" Geolocation button
   */
  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    showToast('Locating your position...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=New+Delhi&count=1`;
          const liveCityData = await WeatherDataEngine.fetchLiveWeather(
            latitude,
            longitude,
            'My Current Location',
            'Local GPS',
            'Detected'
          );
          if (liveCityData) {
            WeatherDataEngine.setActiveCity(liveCityData);
            showToast('Loaded weather for your current GPS location!');
            renderAll();
          }
        } catch (e) {
          selectCityByKey('lucknow');
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        showToast('Location permission denied. Showing Lucknow, India.');
        selectCityByKey('lucknow');
      },
      { timeout: 8000 }
    );
  };

  /**
   * Setup Map Layer buttons and playback timeline
   */
  const setupMapControls = () => {
    // Map layer buttons (Radar, Rain, Temperature, Wind, Clouds)
    const layerButtons = document.querySelectorAll('.map-layer-btn');
    layerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = btn.getAttribute('data-layer');
        WeatherRadarMap.setLayer(layer);

        layerButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.map-layer-btn[data-layer="${layer}"]`).forEach(b => b.classList.add('active'));

        showToast(`Map layer: ${layer.charAt(0).toUpperCase() + layer.slice(1)}`);
      });
    });

    // Radar play/pause toggles
    const playButtons = document.querySelectorAll('.map-play-btn');
    playButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const isPlaying = WeatherRadarMap.togglePlay();
        playButtons.forEach(b => {
          b.innerHTML = isPlaying ? '⏸️ Pause' : '▶️ Play';
        });
      });
    });

    // Zoom buttons
    document.querySelectorAll('.map-zoom-in').forEach(btn => {
      btn.addEventListener('click', () => WeatherRadarMap.zoomIn());
    });
    document.querySelectorAll('.map-zoom-out').forEach(btn => {
      btn.addEventListener('click', () => WeatherRadarMap.zoomOut());
    });

    // Time slider scrubbers
    const sliders = document.querySelectorAll('.map-timeline-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        WeatherRadarMap.setTimeOffset(val);

        const label = document.getElementById('map-timeline-label');
        if (label) {
          if (val === 0) label.textContent = 'Now (Live)';
          else if (val < 0) label.textContent = `${Math.abs(val)}m ago`;
          else label.textContent = `+${val}m forecast`;
        }
      });
    });
  };

  /**
   * Setup Forecast Page Tabs (Today | Tomorrow | 7 Days)
   */
  const setupForecastTabs = () => {
    const tabs = document.querySelectorAll('.forecast-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        forecastTab = tab.getAttribute('data-tab');
        renderForecastPage();
      });
    });
  };

  /**
   * Setup Alerts Page Severity Filter
   */
  const setupAlertsFilters = () => {
    const filterBtns = document.querySelectorAll('.alert-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        alertsFilter = btn.getAttribute('data-filter');
        renderAlertsPage();
      });
    });

    // Alerts subscribe button
    const subBtn = document.getElementById('btn-subscribe-alerts');
    if (subBtn) {
      subBtn.addEventListener('click', () => {
        showToast('🔔 Weather alert push notifications enabled for this location!');
      });
    }
  };

  /**
   * Render All Page Components
   */
  const renderAll = () => {
    const city = WeatherDataEngine.getActiveCity();

    // 1. Current Weather Hero Card
    renderCurrentWeatherCard(city);

    // 2. Hourly Forecast Scroll
    renderHourlyForecast(city);

    // 3. 7-Day Forecast Section
    renderDailyForecast(city);

    // 4. 12 Weather Details Grid
    renderWeatherDetails(city);

    // 5. Active Weather Alerts Banner
    renderAlertsBanner(city);

    // 6. Header Location text
    const headerLoc = document.getElementById('nav-location-text');
    if (headerLoc) {
      headerLoc.textContent = `${city.name}, ${city.country}`;
    }

    // 7. Render charts if on Forecast or Climate page
    if (currentView === 'forecast') {
      renderForecastPage();
    } else if (currentView === 'climate') {
      renderClimatePage();
    } else if (currentView === 'alerts') {
      renderAlertsPage();
    }
  };

  /**
   * 1. Render Current Weather Hero Card
   */
  const renderCurrentWeatherCard = (city) => {
    const cur = city.current;

    // Location name
    const locElem = document.getElementById('current-city-name');
    if (locElem) {
      locElem.innerHTML = `<strong>${city.name}</strong>, <span>${city.region ? city.region + ', ' : ''}${city.country}</span>`;
    }

    // Temperature & Condition
    const tempElem = document.getElementById('current-temp-val');
    if (tempElem) {
      tempElem.textContent = WeatherDataEngine.formatTemp(cur.temp);
    }

    const condElem = document.getElementById('current-condition-text');
    if (condElem) {
      condElem.textContent = cur.condition;
    }

    // Weather Icon
    const iconContainer = document.getElementById('current-weather-icon-slot');
    if (iconContainer) {
      iconContainer.innerHTML = WeatherIcons.getIconSvg(cur.conditionCode, 110, 'hero-icon-svg');
    }

    // Quick Stats Bar
    const statsMap = {
      'stat-feels-like': WeatherDataEngine.formatTemp(cur.feelsLike),
      'stat-humidity': `${cur.humidity}%`,
      'stat-wind': `${cur.windSpeed} km/h (${cur.windDirection})`,
      'stat-visibility': `${cur.visibility} km`,
      'stat-pressure': `${cur.pressure} hPa`,
      'stat-uv': `${cur.uvIndex} (${cur.uvLevel})`,
      'stat-sunrise': cur.sunrise,
      'stat-sunset': cur.sunset
    };

    Object.keys(statsMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = statsMap[id];
    });

    // Last updated timestamp
    const updatedEl = document.getElementById('current-last-updated');
    if (updatedEl) {
      updatedEl.textContent = `Updated: ${cur.lastUpdated || 'Just now'}`;
    }
  };

  /**
   * 2. Render Horizontally Scrollable Hourly Forecast
   */
  const renderHourlyForecast = (city) => {
    const container = document.getElementById('hourly-cards-container');
    if (!container) return;

    container.innerHTML = '';
    const items = city.hourly || [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `hourly-card ${item.time === 'Now' ? 'hourly-card-now' : ''}`;
      
      const rainHtml = item.rainProb !== undefined ? `
        <div class="hourly-rain-pill">
          <span class="rain-drop-icon">💧</span>
          <span>${item.rainProb}%</span>
        </div>
      ` : '';

      card.innerHTML = `
        <span class="hourly-time">${item.time}</span>
        <div class="hourly-icon-wrap">
          ${WeatherIcons.getIconSvg(item.icon, 38)}
        </div>
        <span class="hourly-temp">${WeatherDataEngine.formatTemp(item.temp)}</span>
        ${rainHtml}
      `;

      container.appendChild(card);
    });

    // Horizontal scroll buttons
    const scrollLeftBtn = document.getElementById('hourly-scroll-left');
    const scrollRightBtn = document.getElementById('hourly-scroll-right');

    if (scrollLeftBtn && !scrollLeftBtn.hasListener) {
      scrollLeftBtn.onclick = () => container.scrollBy({ left: -260, behavior: 'smooth' });
      scrollLeftBtn.hasListener = true;
    }
    if (scrollRightBtn && !scrollRightBtn.hasListener) {
      scrollRightBtn.onclick = () => container.scrollBy({ left: 260, behavior: 'smooth' });
      scrollRightBtn.hasListener = true;
    }
  };

  /**
   * 3. Render 7-Day Daily Forecast Section
   */
  const renderDailyForecast = (city) => {
    const container = document.getElementById('daily-forecast-container');
    if (!container) return;

    container.innerHTML = '';
    const days = city.daily || [];

    // Calculate global weekly min and max for proportional temperature bars
    const allHighs = days.map(d => d.high);
    const allLows = days.map(d => d.low);
    const weekMin = Math.min(...allLows) - 2;
    const weekMax = Math.max(...allHighs) + 2;
    const weekRange = weekMax - weekMin || 1;

    days.forEach((day, idx) => {
      const card = document.createElement('div');
      card.className = `daily-row-card ${idx === 0 ? 'daily-today' : ''}`;

      // Calculate bar offsets
      const leftPct = ((day.low - weekMin) / weekRange) * 100;
      const widthPct = Math.max(15, ((day.high - day.low) / weekRange) * 100);

      card.innerHTML = `
        <div class="daily-col-day">
          <span class="daily-day-name">${day.day}</span>
          <span class="daily-date-sub">${day.date}</span>
        </div>
        <div class="daily-col-icon">
          ${WeatherIcons.getIconSvg(day.icon, 34)}
          <span class="daily-cond-label">${day.condition}</span>
        </div>
        <div class="daily-col-rain">
          ${day.rainProb > 0 ? `
            <span class="daily-rain-tag">
              <span class="rain-drop-icon">💧</span> ${day.rainProb}%
            </span>
          ` : '<span class="daily-rain-none">—</span>'}
        </div>
        <div class="daily-col-range">
          <span class="daily-temp-low">${WeatherDataEngine.formatTemp(day.low)}</span>
          <div class="daily-range-bar-track">
            <div class="daily-range-bar-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
          </div>
          <span class="daily-temp-high">${WeatherDataEngine.formatTemp(day.high)}</span>
        </div>
      `;

      container.appendChild(card);
    });
  };

  /**
   * 4. Render 12 Weather Details Cards Grid
   */
  const renderWeatherDetails = (city) => {
    const cur = city.current;

    const detailsData = [
      {
        id: 'det-temp',
        title: 'Temperature',
        value: WeatherDataEngine.formatTemp(cur.temp),
        subtext: `Day peak ${WeatherDataEngine.formatTemp(cur.temp + 3)}`,
        icon: '🌡️',
        barPct: Math.min(100, (cur.temp / 45) * 100),
        barColor: '#f59e0b'
      },
      {
        id: 'det-feels',
        title: 'Real Feel',
        value: WeatherDataEngine.formatTemp(cur.feelsLike),
        subtext: cur.feelsLike > cur.temp ? 'Feels warmer due to humidity' : 'Feels like ambient temp',
        icon: '👤',
        barPct: Math.min(100, (cur.feelsLike / 45) * 100),
        barColor: '#0ea5e9'
      },
      {
        id: 'det-humidity',
        title: 'Humidity',
        value: `${cur.humidity}%`,
        subtext: `Dew point is ${WeatherDataEngine.formatTemp(cur.dewPoint)}`,
        icon: '💧',
        barPct: cur.humidity,
        barColor: '#38bdf8'
      },
      {
        id: 'det-wind',
        title: 'Wind Speed',
        value: `${cur.windSpeed} km/h`,
        subtext: `Gusts up to ${cur.windSpeed + 8} km/h`,
        icon: '💨',
        barPct: Math.min(100, (cur.windSpeed / 60) * 100),
        barColor: '#2dd4bf'
      },
      {
        id: 'det-wind-dir',
        title: 'Wind Direction',
        value: `${cur.windDirection} (${cur.windDeg || 70}°)`,
        subtext: 'Stable gentle surface breeze',
        icon: '🧭',
        barPct: ((cur.windDeg || 70) / 360) * 100,
        barColor: '#14b8a6'
      },
      {
        id: 'det-pressure',
        title: 'Barometric Pressure',
        value: `${cur.pressure} hPa`,
        subtext: cur.pressure > 1013 ? 'High pressure system (Stable)' : 'Normal surface pressure',
        icon: '⏲️',
        barPct: Math.min(100, Math.max(0, ((cur.pressure - 980) / 50) * 100)),
        barColor: '#818cf8'
      },
      {
        id: 'det-visibility',
        title: 'Visibility',
        value: `${cur.visibility} km`,
        subtext: cur.visibility >= 8 ? 'Clear visual range' : 'Hazy conditions',
        icon: '👁️',
        barPct: Math.min(100, (cur.visibility / 10) * 100),
        barColor: '#a855f7'
      },
      {
        id: 'det-uv',
        title: 'UV Index',
        value: `${cur.uvIndex} (${cur.uvLevel})`,
        subtext: cur.uvIndex >= 6 ? 'Wear sun protection midday' : 'Low sun hazard',
        icon: '☀️',
        barPct: Math.min(100, (cur.uvIndex / 12) * 100),
        barColor: cur.uvIndex >= 6 ? '#f97316' : '#22c55e'
      },
      {
        id: 'det-dew',
        title: 'Dew Point',
        value: WeatherDataEngine.formatTemp(cur.dewPoint),
        subtext: `${cur.dewPoint > 20 ? 'Muggy and humid' : 'Comfortable dryness'}`,
        icon: '🍃',
        barPct: Math.min(100, (cur.dewPoint / 30) * 100),
        barColor: '#06b6d4'
      },
      {
        id: 'det-clouds',
        title: 'Cloud Cover',
        value: `${cur.cloudCover}%`,
        subtext: cur.condition,
        icon: '☁️',
        barPct: cur.cloudCover,
        barColor: '#94a3b8'
      },
      {
        id: 'det-precip',
        title: 'Precipitation',
        value: cur.precipitation || '0.4 mm',
        subtext: `${cur.rainProbability}% probability today`,
        icon: '🌧️',
        barPct: cur.rainProbability,
        barColor: '#0284c7'
      },
      {
        id: 'det-aqi',
        title: 'Air Quality (AQI)',
        value: `${cur.aqi} - ${cur.aqiStatus}`,
        subtext: 'PM2.5 & PM10 continuous tracking',
        icon: '🍃',
        barPct: Math.min(100, (cur.aqi / 300) * 100),
        barColor: cur.aqiColor || '#f59e0b'
      }
    ];

    const grid = document.getElementById('weather-details-grid');
    if (!grid) return;

    grid.innerHTML = '';
    detailsData.forEach(d => {
      const card = document.createElement('div');
      card.className = 'detail-metric-card';
      card.innerHTML = `
        <div class="detail-card-head">
          <span class="detail-card-icon">${d.icon}</span>
          <span class="detail-card-title">${d.title}</span>
        </div>
        <div class="detail-card-value">${d.value}</div>
        <div class="detail-bar-wrap">
          <div class="detail-bar-fill" style="width: ${d.barPct}%; background-color: ${d.barColor};"></div>
        </div>
        <div class="detail-card-sub">${d.subtext}</div>
      `;
      grid.appendChild(card);
    });
  };

  /**
   * 5. Render Active Alerts Banner on Home Page
   */
  const renderAlertsBanner = (city) => {
    const bannerContainer = document.getElementById('home-alerts-banner-wrap');
    if (!bannerContainer) return;

    const alerts = city.alerts || [];
    if (alerts.length === 0) {
      bannerContainer.innerHTML = '';
      return;
    }

    const mainAlert = alerts[0];
    bannerContainer.innerHTML = `
      <div class="home-alert-banner ${mainAlert.severityClass}">
        <div class="alert-banner-left">
          <span class="alert-banner-icon">${mainAlert.icon || '⚠️'}</span>
          <div class="alert-banner-content">
            <div class="alert-banner-title-line">
              <strong>${mainAlert.type}</strong>
              <span class="alert-badge ${mainAlert.severityClass}">${mainAlert.severity}</span>
            </div>
            <p class="alert-banner-desc">${mainAlert.description}</p>
            <span class="alert-banner-time">🕒 ${mainAlert.validTime}</span>
          </div>
        </div>
        <button class="alert-banner-action-btn" onclick="App.switchView('alerts')">
          View Safety Details →
        </button>
      </div>
    `;
  };

  /**
   * Render Forecast Page (Hourly/Daily breakdowns + 4 Interactive Charts)
   */
  const renderForecastPage = () => {
    const city = WeatherDataEngine.getActiveCity();
    const isF = WeatherDataEngine.getCurrentUnit() === 'F';

    // Summary header for forecast view
    const title = document.getElementById('forecast-view-city-title');
    if (title) {
      title.textContent = `Comprehensive Weather Forecast – ${city.name}, ${city.country}`;
    }

    // Determine data source based on tab
    let chartData = [];
    if (forecastTab === 'today') {
      chartData = city.hourly || [];
    } else if (forecastTab === 'tomorrow') {
      // Shifted hourly data for tomorrow
      chartData = (city.hourly || []).map(h => ({
        ...h,
        temp: h.temp - 1,
        rainProb: Math.min(100, (h.rainProb || 20) + 10)
      }));
    } else {
      // 7 Days
      chartData = (city.daily || []).map(d => ({
        day: d.day,
        time: d.day,
        temp: d.high,
        rainProb: d.rainProb
      }));
    }

    // Render the 4 interactive canvas charts
    WeatherCharts.renderTemperatureChart('forecast-temp-canvas', chartData, isF);
    WeatherCharts.renderPrecipitationChart('forecast-precip-canvas', chartData);
    WeatherCharts.renderWindChart('forecast-wind-canvas', chartData);
    WeatherCharts.renderHumidityChart('forecast-humidity-canvas', chartData);

    // Render detailed forecast table
    renderForecastTable(chartData);
  };

  /**
   * Render Forecast Page Data Table
   */
  const renderForecastTable = (dataPoints) => {
    const tbody = document.getElementById('forecast-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    dataPoints.forEach(pt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${pt.time || pt.day}</strong></td>
        <td>
          <div class="table-cond-cell">
            ${WeatherIcons.getIconSvg(pt.icon, 24)}
            <span>${pt.condition || 'Partly Cloudy'}</span>
          </div>
        </td>
        <td><strong>${WeatherDataEngine.formatTemp(pt.temp)}</strong></td>
        <td>
          <span class="table-rain-pill">
            💧 ${pt.rainProb !== undefined ? pt.rainProb : 20}%
          </span>
        </td>
        <td>${Math.round(pt.temp * 0.4 + 10)} km/h</td>
        <td>${Math.min(95, Math.round(50 + pt.temp * 0.7))}%</td>
      `;
      tbody.appendChild(tr);
    });
  };

  /**
   * Render Climate Information Page
   */
  const renderClimatePage = () => {
    const city = WeatherDataEngine.getActiveCity();
    const clim = city.climate;
    const isF = WeatherDataEngine.getCurrentUnit() === 'F';

    // Climate title
    const climTitle = document.getElementById('climate-city-heading');
    if (climTitle) {
      climTitle.textContent = `Long-Term Climate & Historical Statistics – ${city.name}`;
    }

    // Climate quick metric cards
    const statCards = [
      { id: 'clim-stat-temp', val: clim.avgAnnualTemp },
      { id: 'clim-stat-rain', val: clim.avgAnnualRain },
      { id: 'clim-stat-humidity', val: clim.avgHumidity }
    ];
    statCards.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) el.textContent = s.val;
    });

    // 12-Month Climate Double-Axis Chart
    WeatherCharts.renderClimateChart('climate-monthly-canvas', clim.monthlyData, isF);

    // 4 Seasons Cards
    const seasonsContainer = document.getElementById('climate-seasons-grid');
    if (seasonsContainer && clim.primarySeasons) {
      seasonsContainer.innerHTML = '';
      clim.primarySeasons.forEach(s => {
        const card = document.createElement('div');
        card.className = 'climate-season-card';
        card.innerHTML = `
          <div class="season-card-head">
            <span class="season-icon">${s.icon}</span>
            <div class="season-titles">
              <h3>${s.name}</h3>
              <span class="season-period">${s.period}</span>
            </div>
          </div>
          <div class="season-temp-range">
            <span class="temp-badge">${s.tempRange}</span>
          </div>
          <p class="season-desc">${s.desc}</p>
        `;
        seasonsContainer.appendChild(card);
      });
    }
  };

  /**
   * Render Weather Alerts Page
   */
  const renderAlertsPage = () => {
    const city = WeatherDataEngine.getActiveCity();
    const container = document.getElementById('alerts-feed-container');
    if (!container) return;

    let alerts = [...(city.alerts || [])];

    // Add historical alerts for realism
    alerts.push({
      id: 'alt-hist-1',
      type: 'Extreme Heat Warning',
      icon: '🌡️',
      severity: 'Severe',
      severityClass: 'alert-severe',
      location: `${city.name} Region`,
      validTime: 'Archived: June 14, 2026',
      description: 'Maximum surface daytime temperatures peaked at 43.5°C during intense heatwave spell.',
      instructions: 'Hydration and indoor shelter were mandated.'
    });

    alerts.push({
      id: 'alt-hist-2',
      type: 'Thunderstorm & Gusty Winds',
      icon: '🌩️',
      severity: 'Moderate',
      severityClass: 'alert-moderate',
      location: `${city.name} Municipal Zone`,
      validTime: 'Archived: August 28, 2026',
      description: 'Squall line with wind gusts reaching 65 km/h and intense lightning.',
      instructions: 'Temporary airport tarmac holds were instituted.'
    });

    // Apply severity filter
    if (alertsFilter !== 'all') {
      alerts = alerts.filter(a => a.severity.toLowerCase() === alertsFilter.toLowerCase());
    }

    container.innerHTML = '';
    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-alerts-state">
          <span class="empty-icon">✅</span>
          <h3>No Alerts Found</h3>
          <p>No active weather advisories match the selected severity filter.</p>
        </div>
      `;
      return;
    }

    alerts.forEach(a => {
      const card = document.createElement('div');
      card.className = `alert-card-full ${a.severityClass || 'alert-moderate'}`;
      card.innerHTML = `
        <div class="alert-full-head">
          <div class="alert-full-title-group">
            <span class="alert-icon-big">${a.icon}</span>
            <div>
              <h3>${a.type}</h3>
              <span class="alert-loc-tag">📍 ${a.location}</span>
            </div>
          </div>
          <span class="alert-severity-badge ${a.severityClass}">${a.severity}</span>
        </div>
        <div class="alert-full-body">
          <p class="alert-main-text">${a.description}</p>
          <div class="alert-instructions-box">
            <strong>🛡️ Recommended Safety Actions:</strong>
            <p>${a.instructions || 'Stay informed through local weather broadcasts and avoid hazardous travel.'}</p>
          </div>
        </div>
        <div class="alert-full-footer">
          <span class="alert-timestamp">🕒 ${a.validTime}</span>
          <button class="alert-share-btn" onclick="App.shareAlert('${escapeHtml(a.type)}')">
            📤 Share Warning
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  };

  /**
   * Helper toast notification system
   */
  const showToast = (message) => {
    let toast = document.getElementById('app-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast-notification';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  const shareAlert = (title) => {
    if (navigator.share) {
      navigator.share({ title: `Weather Warning: ${title}`, url: window.location.href });
    } else {
      showToast(`Alert link copied for: ${title}`);
    }
  };

  const renderCharts = () => {
    if (currentView === 'forecast') renderForecastPage();
    if (currentView === 'climate') renderClimatePage();
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const escapeHtml = (str) => {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  };

  window.App = {
    init,
    switchView,
    selectCityByKey,
    renderAll,
    shareAlert,
    showToast
  };

  return window.App;
})();

// Attach modules to window
window.WeatherGPT = WeatherGPT;
window.WeatherDataEngine = WeatherDataEngine;
window.WeatherRadarMap = WeatherRadarMap;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

