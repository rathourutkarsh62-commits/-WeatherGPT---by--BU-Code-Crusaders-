/**
 * WeatherGPT - Realistic Scalable SVG Weather Icons
 * Produces crisp, beautiful SVG weather icons with micro-animations
 */

const WeatherIcons = (() => {
  const getIconSvg = (conditionKey, size = 64, className = '') => {
    const key = (conditionKey || '').toLowerCase();
    
    // Sunny / Clear Day
    if (key.includes('sun') || key === 'clear') {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="14" fill="url(#sun-grad)" filter="drop-shadow(0 0 10px rgba(251, 191, 36, 0.6))"/>
          <g class="sun-rays" stroke="url(#sun-ray-grad)" stroke-width="3" stroke-linecap="round">
            <line x1="32" y1="6" x2="32" y2="12" />
            <line x1="32" y1="52" x2="32" y2="58" />
            <line x1="6" y1="32" x2="12" y2="32" />
            <line x1="52" y1="32" x2="58" y2="32" />
            <line x1="13.6" y1="13.6" x2="17.8" y2="17.8" />
            <line x1="46.2" y1="46.2" x2="50.4" y2="50.4" />
            <line x1="13.6" y1="50.4" x2="17.8" y2="46.2" />
            <line x1="46.2" y1="17.8" x2="50.4" y2="13.6" />
          </g>
          <defs>
            <linearGradient id="sun-grad" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FCD34D" />
              <stop offset="1" stop-color="#F59E0B" />
            </linearGradient>
            <linearGradient id="sun-ray-grad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FBBF24" />
              <stop offset="1" stop-color="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Clear Night
    if (key.includes('clear_night') || key.includes('night')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42 16C33 16.5 25 24 25 33.5C25 43 32.5 50 42 51C28 53 16 42 16 32C16 20 27 13 42 16Z" fill="url(#moon-grad)" filter="drop-shadow(0 0 12px rgba(165, 243, 252, 0.4))"/>
          <circle cx="48" cy="18" r="1.5" fill="#E0F2FE" opacity="0.8" class="twinkle-1"/>
          <circle cx="52" cy="30" r="1.2" fill="#E0F2FE" opacity="0.6" class="twinkle-2"/>
          <circle cx="45" cy="42" r="1" fill="#E0F2FE" opacity="0.7" class="twinkle-3"/>
          <defs>
            <linearGradient id="moon-grad" x1="16" y1="16" x2="42" y2="51" gradientUnits="userSpaceOnUse">
              <stop stop-color="#BAE6FD" />
              <stop offset="1" stop-color="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Partly Cloudy
    if (key.includes('partly') || key.includes('scattered') || key.includes('interval')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Sun peeking behind -->
          <circle cx="25" cy="25" r="11" fill="url(#pc-sun-grad)" class="pulse-sun"/>
          <g class="sun-rays-pc" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round">
            <line x1="25" y1="8" x2="25" y2="12" />
            <line x1="8" y1="25" x2="12" y2="25" />
            <line x1="13" y1="13" x2="16" y2="16" />
            <line x1="37" y1="13" x2="34" y2="16" />
          </g>
          <!-- Front Cloud -->
          <path class="float-cloud" d="M46 48H22C16.5 48 12 43.5 12 38C12 33 15.8 28.9 20.6 28.1C22.2 21.8 28 17 35 17C43 17 49.5 23 50 30.8C54 31.8 57 35.5 57 40C57 44.4 52.1 48 46 48Z" fill="url(#pc-cloud-grad)" filter="drop-shadow(0 4px 10px rgba(15, 23, 42, 0.25))"/>
          <defs>
            <linearGradient id="pc-sun-grad" x1="14" y1="14" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FCD34D" />
              <stop offset="1" stop-color="#F59E0B" />
            </linearGradient>
            <linearGradient id="pc-cloud-grad" x1="12" y1="17" x2="57" y2="48" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFFFFF" />
              <stop offset="0.7" stop-color="#E2E8F0" />
              <stop offset="1" stop-color="#CBD5E1" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Thunderstorm
    if (key.includes('thunder') || key.includes('storm')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46 38H22C16.5 38 12 33.5 12 28C12 23 15.8 18.9 20.6 18.1C22.2 11.8 28 7 35 7C43 7 49.5 13 50 20.8C54 21.8 57 25.5 57 30C57 34.4 52.1 38 46 38Z" fill="url(#storm-cloud-grad)" filter="drop-shadow(0 4px 12px rgba(15, 23, 42, 0.4))"/>
          <!-- Lightning Flash -->
          <polygon points="33,34 26,45 32,45 28,57 41,43 35,43" fill="url(#lightning-grad)" class="flash-lightning" filter="drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))"/>
          <!-- Raindrops -->
          <line x1="20" y1="42" x2="17" y2="52" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" class="drop-1"/>
          <line x1="47" y1="42" x2="44" y2="52" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" class="drop-2"/>
          <defs>
            <linearGradient id="storm-cloud-grad" x1="12" y1="7" x2="57" y2="38" gradientUnits="userSpaceOnUse">
              <stop stop-color="#64748B" />
              <stop offset="1" stop-color="#334155" />
            </linearGradient>
            <linearGradient id="lightning-grad" x1="26" y1="34" x2="41" y2="57" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FEF08A" />
              <stop offset="1" stop-color="#FACC15" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Heavy Rain / Showers
    if (key.includes('heavy_rain') || key.includes('shower') || key.includes('rain')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46 36H22C16.5 36 12 31.5 12 26C12 21 15.8 16.9 20.6 16.1C22.2 9.8 28 5 35 5C43 5 49.5 11 50 18.8C54 19.8 57 23.5 57 28C57 32.4 52.1 36 46 36Z" fill="url(#rain-cloud-grad)" filter="drop-shadow(0 4px 10px rgba(15, 23, 42, 0.3))"/>
          <!-- Animated Rain Drops -->
          <line x1="22" y1="42" x2="18" y2="54" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" class="drop-1"/>
          <line x1="32" y1="42" x2="28" y2="56" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" class="drop-2"/>
          <line x1="42" y1="42" x2="38" y2="54" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" class="drop-3"/>
          <defs>
            <linearGradient id="rain-cloud-grad" x1="12" y1="5" x2="57" y2="36" gradientUnits="userSpaceOnUse">
              <stop stop-color="#94A3B8" />
              <stop offset="1" stop-color="#475569" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Snow
    if (key.includes('snow') || key.includes('flurry')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M46 36H22C16.5 36 12 31.5 12 26C12 21 15.8 16.9 20.6 16.1C22.2 9.8 28 5 35 5C43 5 49.5 11 50 18.8C54 19.8 57 23.5 57 28C57 32.4 52.1 36 46 36Z" fill="url(#snow-cloud-grad)"/>
          <circle cx="22" cy="46" r="2.5" fill="#E0F2FE" class="snowflake-1"/>
          <circle cx="33" cy="52" r="2.5" fill="#BAE6FD" class="snowflake-2"/>
          <circle cx="44" cy="47" r="2.5" fill="#E0F2FE" class="snowflake-3"/>
          <defs>
            <linearGradient id="snow-cloud-grad" x1="12" y1="5" x2="57" y2="36" gradientUnits="userSpaceOnUse">
              <stop stop-color="#CBD5E1" />
              <stop offset="1" stop-color="#94A3B8" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Wind
    if (key.includes('wind') || key.includes('breeze')) {
      return `
        <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 24H44C47.3 24 50 21.3 50 18C50 14.7 47.3 12 44 12C40.7 12 38 14.7 38 18" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" class="wind-line-1"/>
          <path d="M8 32H48C51.3 32 54 34.7 54 38C54 41.3 51.3 44 48 44C44.7 44 42 41.3 42 38" stroke="#0284C7" stroke-width="3" stroke-linecap="round" class="wind-line-2"/>
          <path d="M16 40H32C34.2 40 36 41.8 36 44C36 46.2 34.2 48 32 48C29.8 48 28 46.2 28 44" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round" class="wind-line-3"/>
        </svg>
      `;
    }

    // Default: Cloudy / Overcast
    return `
      <svg class="weather-svg ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="float-cloud" d="M48 48H20C14.5 48 10 43.5 10 38C10 32.9 13.9 28.7 18.9 28.1C20.5 21.8 26.3 17 33.3 17C41.3 17 47.8 23 48.3 30.8C52.3 31.8 55.3 35.5 55.3 40C55.3 44.4 51.5 48 48 48Z" fill="url(#default-cloud-grad)" filter="drop-shadow(0 4px 10px rgba(15, 23, 42, 0.2))"/>
        <defs>
          <linearGradient id="default-cloud-grad" x1="10" y1="17" x2="55.3" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F1F5F9" />
            <stop offset="0.6" stop-color="#CBD5E1" />
            <stop offset="1" stop-color="#94A3B8" />
          </linearGradient>
        </defs>
      </svg>
    `;
  };

  window.WeatherIcons = {
    getIconSvg
  };
  return window.WeatherIcons;
})();

