/**
 * WeatherGPT - Conversational AI Assistant Engine
 * Features:
 * - Natural language weather query parsing
 * - Live context injection based on active city, current units, alerts, and forecasts
 * - Quick prompt chips and interactive action links
 * - Realistic streaming / typing animation
 * - Speech synthesis option (voice readout)
 */

const WeatherGPT = (() => {
  let isPanelOpen = false;
  let isExpanded = false;
  let isMuted = true;
  let conversationHistory = [];

  // Suggestion questions list
  const suggestedQuestions = [
    "Will it rain today?",
    "What should I wear?",
    "Is it safe to travel tomorrow?",
    "Weather tomorrow?",
    "Is there any weather alert?",
    "Give me this week's forecast",
    "Compare today's and tomorrow's weather",
    "How is the air quality?"
  ];

  /**
   * Intelligently analyze user query against current live meteorological context
   */
  const generateResponse = (userQuery) => {
    const q = userQuery.toLowerCase().trim();
    const city = WeatherDataEngine.getActiveCity();
    const cur = city.current;
    const hourly = city.hourly || [];
    const daily = city.daily || [];
    const alerts = city.alerts || [];
    const unit = WeatherDataEngine.getUnitSymbol();
    const tempNow = WeatherDataEngine.formatTemp(cur.temp);
    const feelsNow = WeatherDataEngine.formatTemp(cur.feelsLike);

    // Find peak rain hours
    const rainHours = hourly.filter(h => (h.rainProb || 0) >= 40);
    let rainWindow = "between 2 PM and 5 PM";
    if (rainHours.length > 0) {
      rainWindow = `between ${rainHours[0].time} and ${rainHours[rainHours.length - 1].time}`;
    }

    // 1. Rain prediction intent
    if (q.includes('rain') || q.includes('precipitation') || q.includes('umbrella') || q.includes('shower')) {
      const rainProb = cur.rainProbability || 60;
      if (rainProb >= 50) {
        return {
          text: `According to the current forecast for **${city.name}**, there is a **${rainProb}% chance of rain** this afternoon. The highest chance is ${rainWindow}.\n\nI recommend carrying an umbrella or light rain jacket if you are heading out after midday.`,
          actions: [
            { label: '🌧️ View Radar Map', action: 'navigate-maps' },
            { label: '📅 Hourly Timeline', action: 'scroll-hourly' }
          ]
        };
      } else if (rainProb >= 25) {
        return {
          text: `There is only a slight chance (**${rainProb}%**) of isolated showers in **${city.name}** today. Significant continuous rainfall is not expected, but keep an eye on the sky during the late afternoon.`,
          actions: [{ label: '📡 Check Radar', action: 'navigate-maps' }]
        };
      } else {
        return {
          text: `Skies look predominantly dry for **${city.name}** today with only a **${rainProb}% probability of rain**. You won't need to carry an umbrella today!`,
          actions: [{ label: '☀️ 7-Day Outlook', action: 'navigate-forecast' }]
        };
      }
    }

    // 2. Clothing / What should I wear intent
    if (q.includes('wear') || q.includes('clothes') || q.includes('outfit') || q.includes('dress') || q.includes('jacket')) {
      let advice = "";
      if (cur.temp >= 28) {
        advice = `It will be warm and ${cur.condition.toLowerCase()} today at **${tempNow}** (feels like **${feelsNow}**).\n\n• **Outfit Recommendation:** A light, breathable cotton or linen outfit will be most comfortable.\n• **Sun Protection:** Wear sunglasses and sunscreen (UV Index is **${cur.uvIndex}** - ${cur.uvLevel}).\n• **Rain Precaution:** ${cur.rainProbability >= 40 ? `Carry an umbrella as there is a ${cur.rainProbability}% chance of afternoon showers.` : 'No rain gear needed today.'}`;
      } else if (cur.temp >= 18) {
        advice = `Temperatures in **${city.name}** are pleasant around **${tempNow}**.\n\n• **Outfit Recommendation:** A comfortable t-shirt or shirt with light layers or a light cardigan for early morning/evening.\n• **Weather Condition:** ${cur.condition}, with ${cur.humidity}% humidity.`;
      } else {
        advice = `It is relatively cool in **${city.name}** at **${tempNow}**.\n\n• **Outfit Recommendation:** A warm sweater or windbreaker jacket is strongly recommended, especially with winds blowing at ${cur.windSpeed} km/h.`;
      }
      return {
        text: advice,
        actions: [{ label: '👕 View Hourly Temps', action: 'scroll-hourly' }]
      };
    }

    // 3. Travel safety intent
    if (q.includes('travel') || q.includes('safe') || q.includes('drive') || q.includes('road') || q.includes('flight') || q.includes('trip')) {
      const tomorrow = daily[1] || daily[0];
      const hasSevereAlert = alerts.some(a => a.severity === 'Severe' || a.severity === 'Extreme');
      const hasModerateAlert = alerts.some(a => a.severity === 'Moderate');

      let responseText = `Here is your travel safety assessment for **${city.name}**:\n\n`;

      if (hasSevereAlert) {
        responseText += `⚠️ **High Travel Risk:** Active severe weather warnings are in effect. Localized flooding and reduced visibility could disrupt roadways and flights. Non-essential travel should be postponed until conditions improve.`;
      } else if (hasModerateAlert || tomorrow.rainProb >= 60) {
        responseText += `⚠️ **Moderate Caution Advised:** Expect scattered thunderstorms or heavy rain showers (${tomorrow.rainProb}% probability). Low-lying roads and underpasses may experience temporary waterlogging. Visibility may drop below 4 km during intense downpours.\n\n• **Driving Advice:** Allow extra travel time, maintain safe following distance, and avoid flooded underpasses.`;
      } else {
        responseText += `✅ **Favorable Travel Conditions:** Road and flight operations in **${city.name}** are expected to run normally. Temperatures will hover around ${WeatherDataEngine.formatTemp(tomorrow.high)} with ${tomorrow.condition.toLowerCase()} skies and good surface visibility (${cur.visibility} km).`;
      }

      return {
        text: responseText,
        actions: [
          { label: '⚠️ View All Alerts', action: 'navigate-alerts' },
          { label: '🛰️ Live Radar', action: 'navigate-maps' }
        ]
      };
    }

    // 4. Weather Alerts query
    if (q.includes('alert') || q.includes('warning') || q.includes('advisory') || q.includes('hazard')) {
      if (alerts.length > 0) {
        const altList = alerts.map(a => `• **${a.type}** (${a.severity}): ${a.description}`).join('\n\n');
        return {
          text: `🚨 There are **${alerts.length} active weather advisory/warning(s)** for **${city.name}**:\n\n${altList}`,
          actions: [{ label: '⚠️ Open Alerts Center', action: 'navigate-alerts' }]
        };
      } else {
        return {
          text: `✅ **No active severe weather warnings** currently issued for **${city.name}**. Atmospheric conditions remain stable and within safe seasonal thresholds.`,
          actions: [{ label: '🔔 Check Forecast', action: 'navigate-forecast' }]
        };
      }
    }

    // 5. Compare today's and tomorrow's weather
    if (q.includes('compare') || (q.includes('today') && q.includes('tomorrow'))) {
      const today = daily[0] || {};
      const tmor = daily[1] || {};
      const tmorHigh = WeatherDataEngine.formatTemp(tmor.high);
      const tmorLow = WeatherDataEngine.formatTemp(tmor.low);
      const todayHigh = WeatherDataEngine.formatTemp(today.high);
      const todayLow = WeatherDataEngine.formatTemp(today.low);

      return {
        text: `Here is the direct comparison between **Today** and **Tomorrow** in **${city.name}**:\n\n` +
          `• **Today:** ${today.condition} | High: **${todayHigh}**, Low: **${todayLow}** | Rain: **${today.rainProb}%**\n` +
          `• **Tomorrow:** ${tmor.condition} | High: **${tmorHigh}**, Low: **${tmorLow}** | Rain: **${tmor.rainProb}%**\n\n` +
          `**Key Difference:** Tomorrow will experience ${tmor.rainProb > today.rainProb ? 'higher precipitation likelihood' : 'clearer and slightly warmer conditions'}.`,
        actions: [{ label: '📊 View Forecast Graphs', action: 'navigate-forecast' }]
      };
    }

    // 6. Tomorrow's weather intent
    if (q.includes('tomorrow')) {
      const tmor = daily[1] || daily[0];
      return {
        text: `**Tomorrow's Forecast for ${city.name}:**\n\n` +
          `• **Condition:** ${tmor.condition}\n` +
          `• **Temperatures:** High of **${WeatherDataEngine.formatTemp(tmor.high)}**, Low of **${WeatherDataEngine.formatTemp(tmor.low)}**\n` +
          `• **Precipitation Chance:** **${tmor.rainProb}%**\n\n` +
          `Overall, expect ${tmor.condition.toLowerCase()} throughout the day with moderate humidity.`,
        actions: [{ label: '📅 Detailed Breakdown', action: 'navigate-forecast' }]
      };
    }

    // 7. This week's forecast / 7-day forecast
    if (q.includes('week') || q.includes('7-day') || q.includes('7 day') || q.includes('daily')) {
      const weekSummary = daily.slice(0, 5).map(d => `• **${d.day}:** ${d.condition} (${WeatherDataEngine.formatTemp(d.high)} / ${WeatherDataEngine.formatTemp(d.low)}) — ${d.rainProb}% rain`).join('\n');
      return {
        text: `Here is the upcoming 7-day forecast trend for **${city.name}**:\n\n${weekSummary}\n\nConditions will remain predominantly ${city.current.condition.toLowerCase()} through the middle of the week.`,
        actions: [{ label: '📈 Full 7-Day Table', action: 'navigate-forecast' }]
      };
    }

    // 8. Air Quality / Pollution query
    if (q.includes('air') || q.includes('aqi') || q.includes('pollution') || q.includes('smog')) {
      return {
        text: `The current Air Quality Index (AQI) in **${city.name}** is **${cur.aqi}** (**${cur.aqiStatus}**).\n\n` +
          `• **Visibility:** ${cur.visibility} km\n` +
          `• **Health Guidance:** ${cur.aqi > 150 ? 'Sensitive individuals should limit prolonged outdoor exertion and consider wearing an N95 mask.' : 'Air quality is acceptable for outdoor recreational activities for most people.'}`,
        actions: [{ label: '💨 View Weather Details', action: 'scroll-details' }]
      };
    }

    // 9. UV Index & Sun safety
    if (q.includes('uv') || q.includes('sun') || q.includes('sunscreen')) {
      return {
        text: `The current UV Index for **${city.name}** is **${cur.uvIndex} (${cur.uvLevel})**.\n\n` +
          `• **Peak Sun Hours:** 11:30 AM to 3:30 PM\n` +
          `• **Protection:** Apply SPF 30+ sunscreen, wear protective sunglasses, and seek shade during midday hours.`,
        actions: [{ label: '☀️ Check Sun Times', action: 'scroll-details' }]
      };
    }

    // 10. Climate information query
    if (q.includes('climate') || q.includes('season') || q.includes('annual') || q.includes('average')) {
      const clim = city.climate;
      return {
        text: `**Climate Profile for ${city.name}:**\n\n` +
          `• **Average Annual Temperature:** ${clim.avgAnnualTemp}\n` +
          `• **Annual Precipitation:** ${clim.avgAnnualRain}\n` +
          `• **Average Relative Humidity:** ${clim.avgHumidity}\n\n` +
          `The region experiences four distinct seasons: Spring, Summer, Monsoon, and Winter.`,
        actions: [{ label: '🌸 Open Climate Page', action: 'navigate-climate' }]
      };
    }

    // Default intelligent conversational response
    return {
      text: `Currently in **${city.name}**, it is **${tempNow}** with **${cur.condition}**.\n\n` +
        `• **Feels Like:** ${feelsNow}\n` +
        `• **Humidity:** ${cur.humidity}%\n` +
        `• **Wind:** ${cur.windSpeed} km/h (${cur.windDirection})\n` +
        `• **Rain Probability:** ${cur.rainProbability}%\n\n` +
        `How else can I assist you with your weather, travel, or clothing plans today?`,
      actions: [
        { label: '🌧️ Will it rain today?', action: 'ask:Will it rain today?' },
        { label: '👕 What should I wear?', action: 'ask:What should I wear today?' }
      ]
    };
  };

  /**
   * Speak response aloud using Web Speech API
   */
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown symbols for speech
      const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable:', e);
    }
  };

  /**
   * Render a message to the chat feed
   */
  const appendMessage = (sender, messageObj, callback) => {
    const chatFeed = document.getElementById('chat-messages-feed');
    if (!chatFeed) return;

    const msgWrapper = document.createElement('div');
    msgWrapper.className = `chat-msg ${sender === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`;

    if (sender === 'ai') {
      const avatar = document.createElement('div');
      avatar.className = 'chat-avatar';
      avatar.innerHTML = `<span class="chat-bot-icon">☁️</span>`;
      msgWrapper.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    // Format Markdown to clean HTML
    const formattedHtml = (messageObj.text || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n• /g, '<br>• ');

    if (sender === 'ai') {
      // Typing stream effect
      bubble.innerHTML = '';
      msgWrapper.appendChild(bubble);
      chatFeed.appendChild(msgWrapper);
      chatFeed.scrollTop = chatFeed.scrollHeight;

      let charIndex = 0;
      const plainText = formattedHtml;
      const step = 8; // chars per tick for smooth swift animation

      const interval = setInterval(() => {
        charIndex += step;
        if (charIndex >= plainText.length) {
          bubble.innerHTML = plainText;
          clearInterval(interval);

          // Append action chips if any
          if (messageObj.actions && messageObj.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'chat-bubble-actions';
            messageObj.actions.forEach(act => {
              const btn = document.createElement('button');
              btn.className = 'chat-action-btn';
              btn.textContent = act.label;
              btn.onclick = () => handleAction(act.action);
              actionsContainer.appendChild(btn);
            });
            bubble.appendChild(actionsContainer);
          }

          chatFeed.scrollTop = chatFeed.scrollHeight;
          if (callback) callback();
        } else {
          bubble.innerHTML = plainText.substring(0, charIndex) + '<span class="typing-cursor">▌</span>';
          chatFeed.scrollTop = chatFeed.scrollHeight;
        }
      }, 16);

      speakText(messageObj.text);
    } else {
      bubble.textContent = messageObj.text;
      msgWrapper.appendChild(bubble);
      chatFeed.appendChild(msgWrapper);
      chatFeed.scrollTop = chatFeed.scrollHeight;
      if (callback) callback();
    }
  };

  /**
   * Handle interactive action chips
   */
  const handleAction = (actionStr) => {
    if (actionStr.startsWith('ask:')) {
      const prompt = actionStr.replace('ask:', '');
      sendMessage(prompt);
      return;
    }

    if (actionStr === 'navigate-maps') {
      if (window.App) window.App.switchView('maps');
      closePanel();
    } else if (actionStr === 'navigate-forecast') {
      if (window.App) window.App.switchView('forecast');
      closePanel();
    } else if (actionStr === 'navigate-alerts') {
      if (window.App) window.App.switchView('alerts');
      closePanel();
    } else if (actionStr === 'navigate-climate') {
      if (window.App) window.App.switchView('climate');
      closePanel();
    } else if (actionStr === 'scroll-hourly') {
      if (window.App) window.App.switchView('home');
      closePanel();
      setTimeout(() => {
        const el = document.getElementById('hourly-forecast-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } else if (actionStr === 'scroll-details') {
      if (window.App) window.App.switchView('home');
      closePanel();
      setTimeout(() => {
        const el = document.getElementById('weather-details-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  };

  /**
   * Send a user query to WeatherGPT
   */
  const sendMessage = (text) => {
    const query = text.trim();
    if (!query) return;

    // Render user bubble
    appendMessage('user', { text: query });

    // Show AI typing indicator
    const chatFeed = document.getElementById('chat-messages-feed');
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'ai-typing-indicator';
    typingIndicator.className = 'chat-msg chat-msg-ai typing-msg';
    typingIndicator.innerHTML = `
      <div class="chat-avatar"><span class="chat-bot-icon">☁️</span></div>
      <div class="chat-bubble typing-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    chatFeed.appendChild(typingIndicator);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    // Generate response with brief natural delay
    setTimeout(() => {
      const ind = document.getElementById('ai-typing-indicator');
      if (ind) ind.remove();

      const aiResponse = generateResponse(query);
      appendMessage('ai', aiResponse);
    }, 450);
  };

  /**
   * Open the WeatherGPT chat panel
   */
  const openPanel = () => {
    isPanelOpen = true;
    const panel = document.getElementById('weathergpt-chat-panel');
    const fab = document.getElementById('weathergpt-floating-btn');
    if (panel) {
      panel.classList.add('active');
      panel.setAttribute('aria-hidden', 'false');
    }
    if (fab) {
      fab.classList.add('fab-active');
    }

    // If chat is empty, introduce itself with the current city
    const chatFeed = document.getElementById('chat-messages-feed');
    if (chatFeed && chatFeed.children.length === 0) {
      const city = WeatherDataEngine.getActiveCity();
      appendMessage('ai', {
        text: `Hello! I'm **WeatherGPT**, your conversational AI weather assistant.\n\nI'm tracking live meteorological conditions for **${city.name}** (${WeatherDataEngine.formatTemp(city.current.temp)}, ${city.current.condition}).\n\nAsk me anything about today's rain probability, outfit suggestions, travel risks, or upcoming forecasts!`,
        actions: [
          { label: '🌧️ Will it rain today?', action: 'ask:Will it rain today?' },
          { label: '👕 What should I wear?', action: 'ask:What should I wear today?' },
          { label: '⚠️ Any alerts?', action: 'ask:Is there any weather alert?' }
        ]
      });
    }

    const input = document.getElementById('chat-input-field');
    if (input) setTimeout(() => input.focus(), 200);
  };

  /**
   * Close the WeatherGPT chat panel
   */
  const closePanel = () => {
    isPanelOpen = false;
    const panel = document.getElementById('weathergpt-chat-panel');
    const fab = document.getElementById('weathergpt-floating-btn');
    if (panel) {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    }
    if (fab) {
      fab.classList.remove('fab-active');
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  /**
   * Toggle expanded / full-screen mode
   */
  const toggleExpand = () => {
    isExpanded = !isExpanded;
    const panel = document.getElementById('weathergpt-chat-panel');
    if (panel) {
      panel.classList.toggle('panel-expanded', isExpanded);
    }
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    const chatFeed = document.getElementById('chat-messages-feed');
    if (chatFeed) chatFeed.innerHTML = '';
    const city = WeatherDataEngine.getActiveCity();
    appendMessage('ai', {
      text: `Chat cleared. Ready for your questions about **${city.name}** weather!`,
      actions: [
        { label: '🌧️ Rain Forecast', action: 'ask:Will it rain today?' },
        { label: '🚗 Travel Safety', action: 'ask:Is it safe to travel tomorrow?' }
      ]
    });
  };

  /**
   * Initialize event handlers
   */
  const init = () => {
    const fab = document.getElementById('weathergpt-floating-btn');
    if (fab) {
      fab.addEventListener('click', () => {
        if (isPanelOpen) closePanel();
        else openPanel();
      });
    }

    const closeBtn = document.getElementById('chat-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    const expandBtn = document.getElementById('chat-expand-btn');
    if (expandBtn) expandBtn.addEventListener('click', toggleExpand);

    const clearBtn = document.getElementById('chat-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearChat);

    const muteBtn = document.getElementById('chat-voice-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.classList.toggle('voice-active', !isMuted);
        muteBtn.title = isMuted ? 'Voice readout: OFF (Click to unmute)' : 'Voice readout: ON';
        if (isMuted && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      });
    }

    // Input submission
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-input-field');

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value;
        if (text.trim()) {
          sendMessage(text);
          input.value = '';
        }
      });
    }

    // Render suggestion chips
    const chipsContainer = document.getElementById('chat-suggestion-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      suggestedQuestions.forEach(q => {
        const chip = document.createElement('button');
        chip.className = 'chat-prompt-chip';
        chip.textContent = q;
        chip.onclick = () => {
          sendMessage(q);
        };
        chipsContainer.appendChild(chip);
      });
    }
  };

  window.WeatherGPT = {
    init,
    openPanel,
    closePanel,
    toggleExpand,
    clearChat,
    sendMessage,
    isOpen: () => isPanelOpen
  };
  return window.WeatherGPT;
})();

