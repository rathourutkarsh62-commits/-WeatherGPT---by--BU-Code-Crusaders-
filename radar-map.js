/**
 * WeatherGPT - Interactive Radar & Atmospheric Layer Map Engine
 * Features:
 * - Dynamic Doppler Radar reflectivity animation
 * - Wind stream particle flow
 * - Temperature thermal gradient overlay
 * - Cloud satellite imagery simulation
 * - Interactive timeline playback (-2h, -1h, Now, +1h, +2h)
 * - Layer switching (Radar, Rain, Temperature, Wind, Clouds)
 * - Multi-canvas support (Home preview + Full Maps page)
 * - Zoom & Pan interaction
 */

const WeatherRadarMap = (() => {
  const registeredCanvasIds = new Set();
  let animationFrameId = null;
  let isPlaying = true;
  let activeLayer = 'radar'; // 'radar', 'rain', 'temperature', 'wind', 'clouds'
  let currentTimeOffset = 0; // -120 to +120 minutes
  let zoomLevel = 1.0;
  let panOffset = { x: 0, y: 0 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  // Wind particles system
  const particles = [];
  const PARTICLE_COUNT = 140;

  // Radar storm cells simulation data
  const stormCells = [
    { x: 0.35, y: 0.42, r: 48, intensity: 0.85, speedX: 0.04, speedY: -0.01 },
    { x: 0.48, y: 0.50, r: 75, intensity: 0.95, speedX: 0.03, speedY: -0.02 },
    { x: 0.62, y: 0.38, r: 60, intensity: 0.70, speedX: 0.05, speedY: -0.015 },
    { x: 0.28, y: 0.65, r: 40, intensity: 0.55, speedX: 0.02, speedY: -0.01 },
    { x: 0.72, y: 0.68, r: 52, intensity: 0.65, speedX: 0.04, speedY: -0.02 }
  ];

  // Key city pins relative coordinates
  const mapCities = [
    { name: 'Lucknow', x: 0.50, y: 0.46, isCurrent: true, temp: '28°C' },
    { name: 'Kanpur', x: 0.42, y: 0.54, temp: '29°C' },
    { name: 'Ayodhya', x: 0.66, y: 0.44, temp: '27°C' },
    { name: 'Varanasi', x: 0.76, y: 0.62, temp: '28°C' },
    { name: 'Prayagraj', x: 0.58, y: 0.65, temp: '29°C' },
    { name: 'Bareilly', x: 0.32, y: 0.28, temp: '27°C' },
    { name: 'Agra', x: 0.22, y: 0.42, temp: '31°C' }
  ];

  let sweepAngle = 0;

  const initParticles = (width, height) => {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.2 + Math.random() * 2.2,
        length: 8 + Math.random() * 12,
        life: Math.random() * 80,
        maxLife: 60 + Math.random() * 40
      });
    }
  };

  // Draw modern topographic map background
  const drawMapBase = (ctx, w, h) => {
    const baseGrad = ctx.createLinearGradient(0, 0, w, h);
    baseGrad.addColorStop(0, '#091528');
    baseGrad.addColorStop(0.5, '#0d1f38');
    baseGrad.addColorStop(1, '#0b192e');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.lineWidth = 1;
    const gridSpacing = 60 * zoomLevel;
    const startX = (panOffset.x % gridSpacing);
    const startY = (panOffset.y % gridSpacing);

    for (let x = startX; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = startY; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // River contours
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.strokeStyle = 'rgba(14, 165, 233, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.3);
    ctx.bezierCurveTo(w * 0.35, h * 0.35, w * 0.45, h * 0.52, w * 0.85, h * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.6);
    ctx.bezierCurveTo(w * 0.5, h * 0.58, w * 0.6, h * 0.75, w * 0.9, h * 0.82);
    ctx.stroke();

    ctx.restore();
  };

  // Draw Doppler Radar precipitation layer
  const drawRadarLayer = (ctx, w, h, timeProgress) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    const shift = (timeProgress + currentTimeOffset / 60) * 40;

    stormCells.forEach((cell, idx) => {
      const cx = (cell.x * w + shift * cell.speedX * 300) % (w * 1.2);
      const cy = (cell.y * h + shift * cell.speedY * 200) % (h * 1.2);
      const radius = cell.r * (1 + Math.sin(Date.now() * 0.002 + idx) * 0.08);

      const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');    // Red core
      radGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.75)'); // Orange
      radGrad.addColorStop(0.55, 'rgba(234, 179, 8, 0.65)'); // Yellow
      radGrad.addColorStop(0.75, 'rgba(34, 197, 94, 0.5)');  // Green
      radGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Radar station rotating sweep beam
    const sweepCenter = { x: w * 0.5, y: h * 0.46 };
    const sweepRadius = Math.max(w, h) * 0.6;
    const sweepGrad = ctx.createRadialGradient(
      sweepCenter.x, sweepCenter.y, 0,
      sweepCenter.x, sweepCenter.y, sweepRadius
    );
    sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sweepCenter.x, sweepCenter.y);
    ctx.arc(sweepCenter.x, sweepCenter.y, sweepRadius, sweepAngle - 0.35, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(sweepCenter.x, sweepCenter.y);
    ctx.lineTo(
      sweepCenter.x + Math.cos(sweepAngle) * sweepRadius,
      sweepCenter.y + Math.sin(sweepAngle) * sweepRadius
    );
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  };

  // Draw Temperature thermal contours
  const drawTemperatureLayer = (ctx, w, h) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    const temps = [
      { x: w * 0.25, y: h * 0.3, r: 160, color: 'rgba(234, 88, 12, 0.4)' },
      { x: w * 0.5, y: h * 0.45, r: 190, color: 'rgba(245, 158, 11, 0.35)' },
      { x: w * 0.75, y: h * 0.65, r: 170, color: 'rgba(14, 165, 233, 0.3)' }
    ];

    temps.forEach(t => {
      const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
      g.addColorStop(0, t.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // Draw Wind particle streamlines
  const drawWindLayer = (ctx, w, h) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    particles.forEach(p => {
      const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.length * 1.2, p.y + p.length * 0.4);
      ctx.stroke();
    });

    ctx.restore();
  };

  // Draw Satellite Cloud Cover layer
  const drawCloudsLayer = (ctx, w, h) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    const clouds = [
      { x: w * 0.3, y: h * 0.35, rx: 140, ry: 70 },
      { x: w * 0.6, y: h * 0.5, rx: 190, ry: 85 },
      { x: w * 0.45, y: h * 0.7, rx: 120, ry: 60 }
    ];

    clouds.forEach(c => {
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.rx);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      g.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // Draw City Pins & Weather Badges
  const drawCityPins = (ctx, w, h) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    mapCities.forEach(city => {
      const cx = city.x * w;
      const cy = city.y * h;

      if (city.isCurrent) {
        const pulseR = 12 + Math.sin(Date.now() * 0.005) * 4;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      ctx.font = city.isCurrent ? '700 13px Inter, sans-serif' : '500 12px Inter, sans-serif';
      const text = `${city.name} ${city.temp}`;
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + 14;
      const pillH = 22;
      const pillX = cx + 8;
      const pillY = cy - 11;

      ctx.fillStyle = city.isCurrent ? 'rgba(14, 116, 144, 0.9)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = city.isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 6) : ctx.rect(pillX, pillY, pillW, pillH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pillX + 7, pillY + pillH / 2);
    });

    ctx.restore();
  };

  let lastTime = Date.now();
  let timeProgress = 0;

  // Master render loop
  const render = () => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (isPlaying) {
      timeProgress += dt * 0.2;
      sweepAngle = (sweepAngle + 0.02) % (Math.PI * 2);

      // Update particle positions
      particles.forEach(p => {
        p.x += p.speed * 1.4;
        p.y -= p.speed * 0.45;
        p.life++;

        if (p.x > 1200 || p.y < -50 || p.life > p.maxLife) {
          p.x = Math.random() * 400 - 50;
          p.y = Math.random() * 600 + 50;
          p.life = 0;
        }
      });
    }

    registeredCanvasIds.forEach(id => {
      const cvs = document.getElementById(id);
      if (!cvs || cvs.offsetParent === null) return; // skip if hidden

      const dpr = window.devicePixelRatio || 1;
      const rect = cvs.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (cvs.width !== Math.floor(rect.width * dpr) || cvs.height !== Math.floor(rect.height * dpr)) {
        cvs.width = Math.floor(rect.width * dpr);
        cvs.height = Math.floor(rect.height * dpr);
      }

      const cCtx = cvs.getContext('2d');
      cCtx.save();
      cCtx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      cCtx.clearRect(0, 0, w, h);

      // 1. Draw base terrain & contours
      drawMapBase(cCtx, w, h);

      // 2. Draw active meteorological layer
      if (activeLayer === 'radar' || activeLayer === 'rain') {
        drawRadarLayer(cCtx, w, h, timeProgress);
      } else if (activeLayer === 'temperature') {
        drawTemperatureLayer(cCtx, w, h);
      } else if (activeLayer === 'wind') {
        drawWindLayer(cCtx, w, h);
      } else if (activeLayer === 'clouds') {
        drawCloudsLayer(cCtx, w, h);
      }

      if (activeLayer === 'radar') {
        drawWindLayer(cCtx, w, h);
      }

      // 3. Draw city pins
      drawCityPins(cCtx, w, h);

      cCtx.restore();
    });

    animationFrameId = requestAnimationFrame(render);
  };

  /**
   * Register and initialize a canvas element
   */
  const init = (canvasElementId) => {
    registeredCanvasIds.add(canvasElementId);
    const cvs = document.getElementById(canvasElementId);
    if (!cvs) return;

    if (particles.length === 0) {
      initParticles(800, 600);
    }

    if (!cvs.hasMapListeners) {
      cvs.hasMapListeners = true;

      cvs.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStart.x = e.clientX - panOffset.x;
        dragStart.y = e.clientY - panOffset.y;
        cvs.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panOffset.x = Math.max(-120, Math.min(120, e.clientX - dragStart.x));
        panOffset.y = Math.max(-80, Math.min(80, e.clientY - dragStart.y));
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
        if (cvs) cvs.style.cursor = 'grab';
      });

      cvs.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          dragStart.x = e.touches[0].clientX - panOffset.x;
          dragStart.y = e.touches[0].clientY - panOffset.y;
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        panOffset.x = Math.max(-120, Math.min(120, e.touches[0].clientX - dragStart.x));
        panOffset.y = Math.max(-80, Math.min(80, e.touches[0].clientY - dragStart.y));
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    if (!animationFrameId) {
      render();
    }
  };

  window.WeatherRadarMap = {
    init,
    setLayer: (layer) => {
      activeLayer = layer;
    },
    getActiveLayer: () => activeLayer,
    togglePlay: () => {
      isPlaying = !isPlaying;
      return isPlaying;
    },
    isPlaying: () => isPlaying,
    setTimeOffset: (minutes) => {
      currentTimeOffset = minutes;
    },
    zoomIn: () => {
      zoomLevel = Math.min(2.0, zoomLevel + 0.2);
    },
    zoomOut: () => {
      zoomLevel = Math.max(0.7, zoomLevel - 0.2);
    },
    resetView: () => {
      zoomLevel = 1.0;
      panOffset = { x: 0, y: 0 };
    },
    updateCity: (cityName, tempStr) => {
      const match = mapCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
      if (match) {
        mapCities.forEach(c => c.isCurrent = false);
        match.isCurrent = true;
        if (tempStr) match.temp = tempStr;
      } else {
        mapCities[0].name = cityName;
        if (tempStr) mapCities[0].temp = tempStr;
      }
    }
  };
  return window.WeatherRadarMap;
})();

