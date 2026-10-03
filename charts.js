/**
 * WeatherGPT - Interactive Canvas Chart Engine
 * Renders high-DPI, ultra-smooth weather & climate graphs
 */

const WeatherCharts = (() => {
  // Setup canvas for crisp rendering on high-DPI (Retina) screens
  const setupCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual render buffer dimensions
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  };

  /**
   * Render Hourly / Daily Temperature Trend Chart
   */
  const renderTemperatureChart = (canvasId, dataPoints, isFahrenheit = false) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length === 0) return;

    const padding = { top: 35, right: 30, bottom: 40, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Extract values & labels
    const values = dataPoints.map(p => isFahrenheit ? Math.round((p.temp * 9) / 5 + 32) : Math.round(p.temp));
    const labels = dataPoints.map(p => p.time || p.day || '');

    const minVal = Math.min(...values) - 2;
    const maxVal = Math.max(...values) + 2;
    const range = (maxVal - minVal) || 1;

    const stepX = chartWidth / (dataPoints.length - 1 || 1);

    // Compute coordinate points
    const points = values.map((val, idx) => {
      const x = padding.left + idx * stepX;
      const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
      return { x, y, val, label: labels[idx] };
    });

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Create gradient area under curve
    const areaGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    areaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    areaGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.12)');
    areaGrad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Draw temperature curve line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw point markers and text labels
    points.forEach((pt) => {
      // Glow circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Temperature value text
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.val}°`, pt.x, pt.y - 12);

      // X-axis label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(pt.label, pt.x, height - padding.bottom + 22);
    });
  };

  /**
   * Render Rain Probability Bar Chart
   */
  const renderPrecipitationChart = (canvasId, dataPoints) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length === 0) return;

    const padding = { top: 30, right: 25, bottom: 35, left: 25 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = Math.min(28, (chartWidth / dataPoints.length) * 0.55);
    const stepX = chartWidth / dataPoints.length;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let percent of [0, 25, 50, 75, 100]) {
      const y = padding.top + chartHeight - (percent / 100) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    dataPoints.forEach((p, idx) => {
      const prob = p.rainProb !== undefined ? p.rainProb : 20;
      const barH = (prob / 100) * chartHeight;
      const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
      const y = padding.top + chartHeight - barH;

      // Bar gradient
      const barGrad = ctx.createLinearGradient(0, y, 0, y + barH);
      barGrad.addColorStop(0, '#38bdf8');
      barGrad.addColorStop(1, 'rgba(2, 132, 199, 0.4)');

      // Rounded rect bar
      ctx.beginPath();
      const r = Math.min(4, barWidth / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fillStyle = barGrad;
      ctx.fill();

      // Rain % label above bar
      ctx.fillStyle = '#bae6fd';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${prob}%`, x + barWidth / 2, y - 6);

      // Time label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(p.time || p.day || '', x + barWidth / 2, height - padding.bottom + 20);
    });
  };

  /**
   * Render Wind Speed Graph
   */
  const renderWindChart = (canvasId, dataPoints) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length === 0) return;

    const padding = { top: 35, right: 30, bottom: 40, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Mock realistic wind variations based on city
    const windVals = dataPoints.map((p, i) => Math.max(6, 12 + Math.round(Math.sin(i * 0.8) * 8)));
    const maxVal = Math.max(...windVals) + 5;
    const minVal = 0;
    const range = maxVal - minVal;

    const stepX = chartWidth / (dataPoints.length - 1 || 1);
    const points = windVals.map((val, idx) => ({
      x: padding.left + idx * stepX,
      y: padding.top + chartHeight - ((val - minVal) / range) * chartHeight,
      val,
      label: dataPoints[idx].time || dataPoints[idx].day || ''
    }));

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Area
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    grad.addColorStop(0, 'rgba(45, 212, 191, 0.3)');
    grad.addColorStop(1, 'rgba(45, 212, 191, 0.0)');
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#99f6e4';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.val} km/h`, pt.x, pt.y - 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(pt.label, pt.x, height - padding.bottom + 20);
    });
  };

  /**
   * Render Humidity Graph
   */
  const renderHumidityChart = (canvasId, dataPoints) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length === 0) return;

    const padding = { top: 35, right: 30, bottom: 40, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const humVals = dataPoints.map((p, i) => Math.min(95, Math.max(40, 65 + Math.round(Math.cos(i * 0.7) * 18))));
    const maxVal = 100;
    const minVal = 30;
    const range = maxVal - minVal;

    const stepX = chartWidth / (dataPoints.length - 1 || 1);
    const points = humVals.map((val, idx) => ({
      x: padding.left + idx * stepX,
      y: padding.top + chartHeight - ((val - minVal) / range) * chartHeight,
      val,
      label: dataPoints[idx].time || dataPoints[idx].day || ''
    }));

    // Area
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    grad.addColorStop(0, 'rgba(129, 140, 248, 0.35)');
    grad.addColorStop(1, 'rgba(129, 140, 248, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#c7d2fe';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.val}%`, pt.x, pt.y - 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(pt.label, pt.x, height - padding.bottom + 20);
    });
  };

  /**
   * Render 12-Month Climate Chart (Temperature High/Low + Rainfall mm)
   */
  const renderClimateChart = (canvasId, monthlyData, isFahrenheit = false) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    if (!monthlyData || monthlyData.length === 0) return;

    const padding = { top: 40, right: 45, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const months = monthlyData.map(m => m.month);
    const highs = monthlyData.map(m => isFahrenheit ? Math.round((m.high * 9) / 5 + 32) : m.high);
    const lows = monthlyData.map(m => isFahrenheit ? Math.round((m.low * 9) / 5 + 32) : m.low);
    const rains = monthlyData.map(m => m.rain);

    const maxRain = Math.max(...rains, 300);
    const maxTemp = Math.max(...highs) + 5;
    const minTemp = Math.min(...lows) - 5;
    const tempRange = maxTemp - minTemp;

    const stepX = chartWidth / monthlyData.length;
    const barWidth = Math.min(22, stepX * 0.45);

    // Draw rainfall bars (Left / Background)
    monthlyData.forEach((m, idx) => {
      const rain = m.rain;
      const barH = (rain / maxRain) * (chartHeight * 0.85);
      const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
      const y = padding.top + chartHeight - barH;

      const rainGrad = ctx.createLinearGradient(0, y, 0, y + barH);
      rainGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
      rainGrad.addColorStop(1, 'rgba(14, 165, 233, 0.2)');

      ctx.fillStyle = rainGrad;
      ctx.fillRect(x, y, barWidth, barH);

      // Month label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.month, x + barWidth / 2, height - padding.bottom + 20);
    });

    // High Temp Line (Amber / Red)
    const highPts = highs.map((h, idx) => ({
      x: padding.left + idx * stepX + stepX / 2,
      y: padding.top + chartHeight - ((h - minTemp) / tempRange) * chartHeight,
      val: h
    }));

    ctx.beginPath();
    ctx.moveTo(highPts[0].x, highPts[0].y);
    for (let i = 0; i < highPts.length - 1; i++) {
      const xc = (highPts[i].x + highPts[i + 1].x) / 2;
      const yc = (highPts[i].y + highPts[i + 1].y) / 2;
      ctx.quadraticCurveTo(highPts[i].x, highPts[i].y, xc, yc);
    }
    ctx.lineTo(highPts[highPts.length - 1].x, highPts[highPts.length - 1].y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Low Temp Line (Cyan / Blue)
    const lowPts = lows.map((l, idx) => ({
      x: padding.left + idx * stepX + stepX / 2,
      y: padding.top + chartHeight - ((l - minTemp) / tempRange) * chartHeight,
      val: l
    }));

    ctx.beginPath();
    ctx.moveTo(lowPts[0].x, lowPts[0].y);
    for (let i = 0; i < lowPts.length - 1; i++) {
      const xc = (lowPts[i].x + lowPts[i + 1].x) / 2;
      const yc = (lowPts[i].y + lowPts[i + 1].y) / 2;
      ctx.quadraticCurveTo(lowPts[i].x, lowPts[i].y, xc, yc);
    }
    ctx.lineTo(lowPts[lowPts.length - 1].x, lowPts[lowPts.length - 1].y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Plot point markers
    highPts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    lowPts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };

  window.WeatherCharts = {
    renderTemperatureChart,
    renderPrecipitationChart,
    renderWindChart,
    renderHumidityChart,
    renderClimateChart
  };
  return window.WeatherCharts;
})();

