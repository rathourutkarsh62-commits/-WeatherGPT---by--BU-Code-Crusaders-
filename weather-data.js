/**
 * WeatherGPT - Comprehensive Weather Data Engine
 * Features:
 * 1. Curated realistic datasets for major world cities (including Lucknow, Delhi, Mumbai, etc.)
 * 2. Live API fetcher via Open-Meteo (CORS-friendly, no API key required)
 * 3. Graceful fallback so the site always functions reliably offline or online
 * 4. Automatic unit conversion between Celsius and Fahrenheit
 */

const WeatherDataEngine = (() => {
  // Unit state: 'C' or 'F'
  let currentUnit = 'C';

  // Helper conversions
  const cToF = (c) => Math.round((c * 9) / 5 + 32);
  const fToC = (f) => Math.round(((f - 32) * 5) / 9);

  const formatTemp = (tempInC) => {
    if (tempInC === undefined || tempInC === null) return '--';
    if (currentUnit === 'F') {
      return `${cToF(tempInC)}°F`;
    }
    return `${Math.round(tempInC)}°C`;
  };

  const getTempVal = (tempInC) => {
    if (tempInC === undefined || tempInC === null) return 0;
    return currentUnit === 'F' ? cToF(tempInC) : Math.round(tempInC);
  };

  const getUnitSymbol = () => (currentUnit === 'F' ? '°F' : '°C');

  // Realistic curated city database
  const citiesDatabase = {
    'lucknow': {
      id: 'lucknow',
      name: 'Lucknow',
      region: 'Uttar Pradesh',
      country: 'India',
      lat: 26.8467,
      lon: 80.9462,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 28,
        feelsLike: 30,
        condition: 'Partly Cloudy',
        conditionCode: 'partly_cloudy',
        humidity: 65,
        windSpeed: 12,
        windDirection: 'ENE',
        windDeg: 70,
        visibility: 8,
        pressure: 1012,
        uvIndex: 6,
        uvLevel: 'High',
        dewPoint: 21,
        cloudCover: 42,
        precipitation: '0.4 mm',
        rainProbability: 60,
        sunrise: '05:52 AM',
        sunset: '06:14 PM',
        aqi: 128,
        aqiStatus: 'Moderate',
        aqiColor: '#f59e0b',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 28, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '10 AM', temp: 27, condition: 'Sunny', icon: 'sunny', rainProb: 15 },
        { time: '11 AM', temp: 28, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 25 },
        { time: '12 PM', temp: 29, condition: 'Sunny', icon: 'sunny', rainProb: 30 },
        { time: '1 PM', temp: 30, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 45 },
        { time: '2 PM', temp: 29, condition: 'Scattered Showers', icon: 'rain', rainProb: 65 },
        { time: '3 PM', temp: 28, condition: 'Rain', icon: 'heavy_rain', rainProb: 75 },
        { time: '4 PM', temp: 27, condition: 'Showers', icon: 'rain', rainProb: 60 },
        { time: '5 PM', temp: 26, condition: 'Cloudy', icon: 'cloudy', rainProb: 40 },
        { time: '6 PM', temp: 26, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '7 PM', temp: 25, condition: 'Clear', icon: 'clear_night', rainProb: 10 },
        { time: '8 PM', temp: 24, condition: 'Clear', icon: 'clear_night', rainProb: 5 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Partly Cloudy / PM Showers', icon: 'rain', high: 31, low: 22, rainProb: 60 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Scattered Thunderstorms', icon: 'thunderstorm', high: 30, low: 21, rainProb: 70 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Light Rain', icon: 'rain', high: 28, low: 20, rainProb: 50 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 29, low: 21, rainProb: 30 },
        { day: 'Monday', date: 'Sep 29', condition: 'Mostly Sunny', icon: 'sunny', high: 31, low: 22, rainProb: 15 },
        { day: 'Tuesday', date: 'Sep 30', condition: 'Sunny & Pleasant', icon: 'sunny', high: 32, low: 23, rainProb: 10 },
        { day: 'Wednesday', date: 'Oct 01', condition: 'Clear Skies', icon: 'sunny', high: 33, low: 23, rainProb: 10 }
      ],
      alerts: [
        {
          id: 'alt-lko-1',
          type: 'Heavy Rain Warning',
          icon: '⚠️',
          severity: 'Moderate',
          severityClass: 'alert-moderate',
          location: 'Lucknow and neighboring districts',
          validTime: 'Valid: Today 1:30 PM – 7:00 PM IST',
          description: 'Localized convective thunderstorm development anticipated with brief intense downpours (30-50 mm/hr), waterlogging in low-lying zones, and gusty winds up to 45 km/h.',
          instructions: 'Motorists are advised to avoid waterlogged underpasses. Secure loose outdoor objects.'
        }
      ],
      climate: {
        avgAnnualTemp: '25.6°C',
        avgAnnualRain: '998 mm',
        avgHumidity: '62%',
        primarySeasons: [
          { name: 'Spring', period: 'Feb – Mar', icon: '🌸', tempRange: '18°C – 28°C', desc: 'Pleasant temperatures, blooming flora, crisp clear mornings, and low humidity.' },
          { name: 'Summer', period: 'Apr – Jun', icon: '☀️', tempRange: '32°C – 44°C', desc: 'Intense dry heatwaves with northwesterly "Loo" winds and clear sunshine.' },
          { name: 'Monsoon', period: 'Jul – Sep', icon: '🌧️', tempRange: '26°C – 33°C', desc: 'Heavy tropical downpours bringing 80% of annual rainfall, high relative humidity.' },
          { name: 'Winter', period: 'Nov – Jan', icon: '❄️', tempRange: '7°C – 22°C', desc: 'Cool, crisp days with chilly nights and frequent dense morning radiation fog.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 21, low: 8, rain: 15 },
          { month: 'Feb', high: 26, low: 11, rain: 14 },
          { month: 'Mar', high: 32, low: 16, rain: 9 },
          { month: 'Apr', high: 38, low: 22, rain: 7 },
          { month: 'May', high: 41, low: 26, rain: 21 },
          { month: 'Jun', high: 39, low: 28, rain: 105 },
          { month: 'Jul', high: 34, low: 26, rain: 290 },
          { month: 'Aug', high: 33, low: 26, rain: 275 },
          { month: 'Sep', high: 32, low: 24, rain: 180 },
          { month: 'Oct', high: 31, low: 19, rain: 45 },
          { month: 'Nov', high: 28, low: 13, rain: 5 },
          { month: 'Dec', high: 23, low: 9, rain: 8 }
        ]
      }
    },
    'delhi': {
      id: 'delhi',
      name: 'New Delhi',
      region: 'NCT of Delhi',
      country: 'India',
      lat: 28.6139,
      lon: 77.2090,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 31,
        feelsLike: 34,
        condition: 'Hazy Sunshine',
        conditionCode: 'sunny',
        humidity: 52,
        windSpeed: 14,
        windDirection: 'NW',
        windDeg: 315,
        visibility: 5,
        pressure: 1010,
        uvIndex: 7,
        uvLevel: 'High',
        dewPoint: 19,
        cloudCover: 25,
        precipitation: '0.0 mm',
        rainProbability: 15,
        sunrise: '06:11 AM',
        sunset: '06:17 PM',
        aqi: 185,
        aqiStatus: 'Unhealthy for Sensitive Groups',
        aqiColor: '#f97316',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 31, condition: 'Hazy Sunshine', icon: 'sunny', rainProb: 10 },
        { time: '10 AM', temp: 32, condition: 'Sunny', icon: 'sunny', rainProb: 10 },
        { time: '11 AM', temp: 34, condition: 'Sunny', icon: 'sunny', rainProb: 10 },
        { time: '12 PM', temp: 35, condition: 'Sunny & Warm', icon: 'sunny', rainProb: 15 },
        { time: '1 PM', temp: 36, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '2 PM', temp: 36, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '3 PM', temp: 35, condition: 'Hazy', icon: 'sunny', rainProb: 15 },
        { time: '4 PM', temp: 34, condition: 'Mostly Sunny', icon: 'sunny', rainProb: 10 },
        { time: '5 PM', temp: 32, condition: 'Clear', icon: 'sunny', rainProb: 10 },
        { time: '6 PM', temp: 30, condition: 'Clear', icon: 'clear_night', rainProb: 5 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Hazy Sunshine', icon: 'sunny', high: 36, low: 25, rainProb: 15 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Mostly Sunny', icon: 'sunny', high: 35, low: 24, rainProb: 10 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 34, low: 23, rainProb: 20 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Sunny', icon: 'sunny', high: 35, low: 23, rainProb: 10 },
        { day: 'Monday', date: 'Sep 29', condition: 'Sunny', icon: 'sunny', high: 36, low: 24, rainProb: 10 },
        { day: 'Tuesday', date: 'Sep 30', condition: 'Clear Skies', icon: 'sunny', high: 35, low: 24, rainProb: 5 },
        { day: 'Wednesday', date: 'Oct 01', condition: 'Clear', icon: 'sunny', high: 34, low: 22, rainProb: 5 }
      ],
      alerts: [
        {
          id: 'alt-del-1',
          type: 'Air Quality Advisory',
          icon: '😷',
          severity: 'Moderate',
          severityClass: 'alert-moderate',
          location: 'Delhi NCR Metropolitan Area',
          validTime: 'Valid through this week',
          description: 'Elevated particulate matter (PM2.5) concentrations due to seasonal thermal inversion and calm surface winds.',
          instructions: 'Vulnerable individuals should avoid strenuous outdoor physical exertion during early morning hours.'
        }
      ],
      climate: {
        avgAnnualTemp: '25.0°C',
        avgAnnualRain: '790 mm',
        avgHumidity: '55%',
        primarySeasons: [
          { name: 'Spring', period: 'Feb – Mar', icon: '🌸', tempRange: '16°C – 29°C', desc: 'Temperate climate, sunny days, moderate winds.' },
          { name: 'Summer', period: 'Apr – Jun', icon: '☀️', tempRange: '34°C – 45°C', desc: 'Dry intense heat with dusty gusty winds.' },
          { name: 'Monsoon', period: 'Jul – Sep', icon: '🌧️', tempRange: '27°C – 35°C', desc: 'Short intense spells of heavy monsoon rain.' },
          { name: 'Winter', period: 'Nov – Jan', icon: '❄️', tempRange: '5°C – 21°C', desc: 'Crisp cold spells, dense fog affecting flight schedules.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 20, low: 7, rain: 19 },
          { month: 'Feb', high: 24, low: 10, rain: 20 },
          { month: 'Mar', high: 30, low: 15, rain: 15 },
          { month: 'Apr', high: 36, low: 21, rain: 12 },
          { month: 'May', high: 40, low: 26, rain: 25 },
          { month: 'Jun', high: 39, low: 28, rain: 75 },
          { month: 'Jul', high: 35, low: 27, rain: 235 },
          { month: 'Aug', high: 34, low: 26, rain: 240 },
          { month: 'Sep', high: 34, low: 24, rain: 110 },
          { month: 'Oct', high: 33, low: 19, rain: 15 },
          { month: 'Nov', high: 28, low: 13, rain: 4 },
          { month: 'Dec', high: 22, low: 8, rain: 8 }
        ]
      }
    },
    'mumbai': {
      id: 'mumbai',
      name: 'Mumbai',
      region: 'Maharashtra',
      country: 'India',
      lat: 19.0760,
      lon: 72.8777,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 30,
        feelsLike: 36,
        condition: 'Humid & Scattered Clouds',
        conditionCode: 'partly_cloudy',
        humidity: 82,
        windSpeed: 18,
        windDirection: 'WSW',
        windDeg: 240,
        visibility: 7,
        pressure: 1010,
        uvIndex: 8,
        uvLevel: 'Very High',
        dewPoint: 25,
        cloudCover: 55,
        precipitation: '1.2 mm',
        rainProbability: 40,
        sunrise: '06:28 AM',
        sunset: '06:33 PM',
        aqi: 78,
        aqiStatus: 'Satisfactory',
        aqiColor: '#10b981',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 30, condition: 'Humid & Clouds', icon: 'partly_cloudy', rainProb: 35 },
        { time: '11 AM', temp: 31, condition: 'Passing Shower', icon: 'rain', rainProb: 50 },
        { time: '1 PM', temp: 31, condition: 'Partly Sunny', icon: 'partly_cloudy', rainProb: 40 },
        { time: '3 PM', temp: 30, condition: 'Breezy & Clouds', icon: 'partly_cloudy', rainProb: 30 },
        { time: '5 PM', temp: 29, condition: 'Coastal Breeze', icon: 'partly_cloudy', rainProb: 20 },
        { time: '7 PM', temp: 28, condition: 'Humid Night', icon: 'clear_night', rainProb: 15 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Passing Showers', icon: 'rain', high: 32, low: 26, rainProb: 45 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 32, low: 26, rainProb: 30 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Sunny & Humid', icon: 'sunny', high: 33, low: 27, rainProb: 20 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Mostly Sunny', icon: 'sunny', high: 33, low: 26, rainProb: 15 },
        { day: 'Monday', date: 'Sep 29', condition: 'Fair Weather', icon: 'sunny', high: 32, low: 26, rainProb: 10 }
      ],
      alerts: [],
      climate: {
        avgAnnualTemp: '27.2°C',
        avgAnnualRain: '2,400 mm',
        avgHumidity: '77%',
        primarySeasons: [
          { name: 'Winter', period: 'Dec – Feb', icon: '❄️', tempRange: '18°C – 31°C', desc: 'Mild pleasant coastal winter, lower humidity.' },
          { name: 'Summer', period: 'Mar – May', icon: '☀️', tempRange: '25°C – 34°C', desc: 'Warm, humid with soothing evening sea breezes.' },
          { name: 'Monsoon', period: 'Jun – Sep', icon: '🌧️', tempRange: '25°C – 30°C', desc: 'Torrential Arabian Sea rains and high tides.' },
          { name: 'Post-Monsoon', period: 'Oct – Nov', icon: '🌸', tempRange: '23°C – 34°C', desc: 'Warm sunny weather, moderate humidity.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 31, low: 17, rain: 1 },
          { month: 'Feb', high: 31, low: 18, rain: 1 },
          { month: 'Mar', high: 33, low: 21, rain: 1 },
          { month: 'Apr', high: 33, low: 24, rain: 2 },
          { month: 'May', high: 34, low: 27, rain: 12 },
          { month: 'Jun', high: 32, low: 26, rain: 520 },
          { month: 'Jul', high: 30, low: 25, rain: 840 },
          { month: 'Aug', high: 30, low: 25, rain: 580 },
          { month: 'Sep', high: 31, low: 25, rain: 330 },
          { month: 'Oct', high: 33, low: 24, rain: 60 },
          { month: 'Nov', high: 33, low: 21, rain: 10 },
          { month: 'Dec', high: 32, low: 19, rain: 2 }
        ]
      }
    },
    'bengaluru': {
      id: 'bengaluru',
      name: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      lat: 12.9716,
      lon: 77.5946,
      timezone: 'Asia/Kolkata',
      current: {
        temp: 24,
        feelsLike: 25,
        condition: 'Pleasant & Breezy',
        conditionCode: 'partly_cloudy',
        humidity: 68,
        windSpeed: 16,
        windDirection: 'W',
        windDeg: 270,
        visibility: 9,
        pressure: 1014,
        uvIndex: 5,
        uvLevel: 'Moderate',
        dewPoint: 17,
        cloudCover: 50,
        precipitation: '0.0 mm',
        rainProbability: 25,
        sunrise: '06:09 AM',
        sunset: '06:17 PM',
        aqi: 54,
        aqiStatus: 'Good',
        aqiColor: '#10b981',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 24, condition: 'Pleasant & Breezy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '11 AM', temp: 26, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 },
        { time: '1 PM', temp: 28, condition: 'Warm & Clouds', icon: 'partly_cloudy', rainProb: 30 },
        { time: '3 PM', temp: 27, condition: 'Isolated Shower', icon: 'rain', rainProb: 45 },
        { time: '5 PM', temp: 25, condition: 'Cloudy', icon: 'cloudy', rainProb: 30 },
        { time: '7 PM', temp: 22, condition: 'Cool Breeze', icon: 'clear_night', rainProb: 15 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Scattered Clouds', icon: 'partly_cloudy', high: 28, low: 19, rainProb: 35 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Evening Shower', icon: 'rain', high: 27, low: 19, rainProb: 50 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 28, low: 18, rainProb: 30 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Pleasant', icon: 'sunny', high: 29, low: 18, rainProb: 20 },
        { day: 'Monday', date: 'Sep 29', condition: 'Sunny & Fair', icon: 'sunny', high: 29, low: 19, rainProb: 15 }
      ],
      alerts: [],
      climate: {
        avgAnnualTemp: '23.8°C',
        avgAnnualRain: '970 mm',
        avgHumidity: '65%',
        primarySeasons: [
          { name: 'Summer', period: 'Mar – May', icon: '☀️', tempRange: '20°C – 34°C', desc: 'Warm dry days, cool evenings with thunderstorm relief.' },
          { name: 'Monsoon', period: 'Jun – Sep', icon: '🌧️', tempRange: '19°C – 28°C', desc: 'Frequent refreshing drizzles, lush garden blooms.' },
          { name: 'Post-Monsoon', period: 'Oct – Nov', icon: '🌸', tempRange: '18°C – 27°C', desc: 'Northeast monsoonal showers, crisp weather.' },
          { name: 'Winter', period: 'Dec – Feb', icon: '❄️', tempRange: '15°C – 28°C', desc: 'Comfortably cool weather, morning mist.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 28, low: 15, rain: 2 },
          { month: 'Feb', high: 31, low: 17, rain: 5 },
          { month: 'Mar', high: 33, low: 20, rain: 15 },
          { month: 'Apr', high: 34, low: 22, rain: 40 },
          { month: 'May', high: 33, low: 22, rain: 110 },
          { month: 'Jun', high: 30, low: 20, rain: 100 },
          { month: 'Jul', high: 28, low: 20, rain: 120 },
          { month: 'Aug', high: 28, low: 20, rain: 140 },
          { month: 'Sep', high: 29, low: 19, rain: 190 },
          { month: 'Oct', high: 28, low: 19, rain: 170 },
          { month: 'Nov', high: 27, low: 18, rain: 60 },
          { month: 'Dec', high: 26, low: 16, rain: 15 }
        ]
      }
    },
    'newyork': {
      id: 'newyork',
      name: 'New York',
      region: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
      timezone: 'America/New_York',
      current: {
        temp: 21,
        feelsLike: 20,
        condition: 'Clear Skies',
        conditionCode: 'sunny',
        humidity: 48,
        windSpeed: 16,
        windDirection: 'NW',
        windDeg: 310,
        visibility: 10,
        pressure: 1018,
        uvIndex: 4,
        uvLevel: 'Moderate',
        dewPoint: 9,
        cloudCover: 15,
        precipitation: '0.0 mm',
        rainProbability: 5,
        sunrise: '06:48 AM',
        sunset: '06:53 PM',
        aqi: 38,
        aqiStatus: 'Good',
        aqiColor: '#10b981',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 21, condition: 'Clear', icon: 'sunny', rainProb: 5 },
        { time: '10 AM', temp: 22, condition: 'Sunny', icon: 'sunny', rainProb: 5 },
        { time: '12 PM', temp: 24, condition: 'Sunny', icon: 'sunny', rainProb: 5 },
        { time: '2 PM', temp: 25, condition: 'Mostly Sunny', icon: 'sunny', rainProb: 10 },
        { time: '4 PM', temp: 24, condition: 'Fair', icon: 'sunny', rainProb: 10 },
        { time: '6 PM', temp: 22, condition: 'Clear', icon: 'sunny', rainProb: 5 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Sunny & Pleasant', icon: 'sunny', high: 25, low: 15, rainProb: 5 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 24, low: 16, rainProb: 15 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Light Rain', icon: 'rain', high: 20, low: 14, rainProb: 65 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Mostly Sunny', icon: 'sunny', high: 22, low: 13, rainProb: 10 },
        { day: 'Monday', date: 'Sep 29', condition: 'Clear & Crisp', icon: 'sunny', high: 23, low: 14, rainProb: 5 }
      ],
      alerts: [],
      climate: {
        avgAnnualTemp: '12.8°C',
        avgAnnualRain: '1,260 mm',
        avgHumidity: '63%',
        primarySeasons: [
          { name: 'Spring', period: 'Mar – May', icon: '🌸', tempRange: '7°C – 21°C', desc: 'Brisk mornings, blooming Central Park cherry blossoms.' },
          { name: 'Summer', period: 'Jun – Aug', icon: '☀️', tempRange: '20°C – 30°C', desc: 'Warm sunny weather with occasional humid thunderstorms.' },
          { name: 'Autumn', period: 'Sep – Nov', icon: '🍂', tempRange: '10°C – 22°C', desc: 'Crisp golden foliage, perfect walking weather.' },
          { name: 'Winter', period: 'Dec – Feb', icon: '❄️', tempRange: '-3°C – 6°C', desc: 'Cold nor\'easters, freezing spells, and periodic snowfall.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 4, low: -3, rain: 90 },
          { month: 'Feb', high: 6, low: -2, rain: 80 },
          { month: 'Mar', high: 10, low: 2, rain: 110 },
          { month: 'Apr', high: 17, low: 7, rain: 105 },
          { month: 'May', high: 22, low: 12, rain: 100 },
          { month: 'Jun', high: 27, low: 18, rain: 115 },
          { month: 'Jul', high: 30, low: 21, rain: 115 },
          { month: 'Aug', high: 29, low: 20, rain: 110 },
          { month: 'Sep', high: 25, low: 16, rain: 105 },
          { month: 'Oct', high: 18, low: 10, rain: 110 },
          { month: 'Nov', high: 12, low: 5, rain: 95 },
          { month: 'Dec', high: 7, low: 0, rain: 100 }
        ]
      }
    },
    'london': {
      id: 'london',
      name: 'London',
      region: 'Greater London',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
      timezone: 'Europe/London',
      current: {
        temp: 16,
        feelsLike: 15,
        condition: 'Overcast & Drizzle',
        conditionCode: 'rain',
        humidity: 84,
        windSpeed: 20,
        windDirection: 'SW',
        windDeg: 225,
        visibility: 7,
        pressure: 1015,
        uvIndex: 2,
        uvLevel: 'Low',
        dewPoint: 13,
        cloudCover: 88,
        precipitation: '0.8 mm',
        rainProbability: 75,
        sunrise: '06:50 AM',
        sunset: '06:55 PM',
        aqi: 28,
        aqiStatus: 'Good',
        aqiColor: '#10b981',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 16, condition: 'Drizzle', icon: 'rain', rainProb: 75 },
        { time: '11 AM', temp: 17, condition: 'Overcast', icon: 'cloudy', rainProb: 60 },
        { time: '1 PM', temp: 18, condition: 'Light Rain', icon: 'rain', rainProb: 65 },
        { time: '3 PM', temp: 18, condition: 'Passing Shower', icon: 'rain', rainProb: 50 },
        { time: '5 PM', temp: 17, condition: 'Cloudy', icon: 'cloudy', rainProb: 30 },
        { time: '7 PM', temp: 15, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 20 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Light Showers', icon: 'rain', high: 18, low: 12, rainProb: 70 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 19, low: 11, rainProb: 30 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Sunny Intervals', icon: 'sunny', high: 20, low: 12, rainProb: 20 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Breezy & Rain', icon: 'rain', high: 17, low: 13, rainProb: 80 },
        { day: 'Monday', date: 'Sep 29', condition: 'Overcast', icon: 'cloudy', high: 16, low: 10, rainProb: 40 }
      ],
      alerts: [
        {
          id: 'alt-lon-1',
          type: 'Breezy Wind Advisory',
          icon: '💨',
          severity: 'Minor',
          severityClass: 'alert-minor',
          location: 'Greater London and Thames Estuary',
          validTime: 'Valid today until 8:00 PM BST',
          description: 'Southwesterly gusts up to 45 km/h expected along river bridges and exposed elevated surfaces.',
          instructions: 'Hold onto umbrellas and take extra care when cycling.'
        }
      ],
      climate: {
        avgAnnualTemp: '11.5°C',
        avgAnnualRain: '620 mm',
        avgHumidity: '78%',
        primarySeasons: [
          { name: 'Spring', period: 'Mar – May', icon: '🌸', tempRange: '6°C – 17°C', desc: 'Mild days with sudden sun breaks and spring showers.' },
          { name: 'Summer', period: 'Jun – Aug', icon: '☀️', tempRange: '14°C – 24°C', desc: 'Long daylight hours, pleasant parks, occasional heatwaves.' },
          { name: 'Autumn', period: 'Sep – Nov', icon: '🍂', tempRange: '8°C – 18°C', desc: 'Misty mornings, colorful foliage along the Thames.' },
          { name: 'Winter', period: 'Dec – Feb', icon: '❄️', tempRange: '2°C – 9°C', desc: 'Damp cold, festive illuminations, occasional light dusting of snow.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 8, low: 2, rain: 55 },
          { month: 'Feb', high: 9, low: 2, rain: 40 },
          { month: 'Mar', high: 12, low: 4, rain: 42 },
          { month: 'Apr', high: 15, low: 6, rain: 45 },
          { month: 'May', high: 18, low: 9, rain: 48 },
          { month: 'Jun', high: 21, low: 12, rain: 45 },
          { month: 'Jul', high: 23, low: 14, rain: 45 },
          { month: 'Aug', high: 23, low: 14, rain: 50 },
          { month: 'Sep', high: 20, low: 11, rain: 50 },
          { month: 'Oct', high: 16, low: 8, rain: 65 },
          { month: 'Nov', high: 11, low: 5, rain: 60 },
          { month: 'Dec', high: 9, low: 3, rain: 55 }
        ]
      }
    },
    'tokyo': {
      id: 'tokyo',
      name: 'Tokyo',
      region: 'Kanto',
      country: 'Japan',
      lat: 35.6762,
      lon: 139.6503,
      timezone: 'Asia/Tokyo',
      current: {
        temp: 23,
        feelsLike: 23,
        condition: 'Clear & Crisp',
        conditionCode: 'sunny',
        humidity: 58,
        windSpeed: 10,
        windDirection: 'NE',
        windDeg: 45,
        visibility: 10,
        pressure: 1016,
        uvIndex: 5,
        uvLevel: 'Moderate',
        dewPoint: 14,
        cloudCover: 20,
        precipitation: '0.0 mm',
        rainProbability: 10,
        sunrise: '05:32 AM',
        sunset: '05:36 PM',
        aqi: 22,
        aqiStatus: 'Excellent',
        aqiColor: '#10b981',
        lastUpdated: 'Just now'
      },
      hourly: [
        { time: 'Now', temp: 23, condition: 'Clear', icon: 'sunny', rainProb: 10 },
        { time: '11 AM', temp: 25, condition: 'Sunny', icon: 'sunny', rainProb: 10 },
        { time: '1 PM', temp: 26, condition: 'Mostly Sunny', icon: 'sunny', rainProb: 15 },
        { time: '3 PM', temp: 25, condition: 'Partly Cloudy', icon: 'partly_cloudy', rainProb: 15 },
        { time: '5 PM', temp: 23, condition: 'Clear', icon: 'sunny', rainProb: 10 },
        { time: '7 PM', temp: 21, condition: 'Clear Night', icon: 'clear_night', rainProb: 5 }
      ],
      daily: [
        { day: 'Today', date: 'Sep 25', condition: 'Sunny & Crisp', icon: 'sunny', high: 26, low: 18, rainProb: 10 },
        { day: 'Tomorrow', date: 'Sep 26', condition: 'Partly Cloudy', icon: 'partly_cloudy', high: 25, low: 19, rainProb: 20 },
        { day: 'Saturday', date: 'Sep 27', condition: 'Sunny Intervals', icon: 'sunny', high: 27, low: 20, rainProb: 15 },
        { day: 'Sunday', date: 'Sep 28', condition: 'Passing Showers', icon: 'rain', high: 24, low: 19, rainProb: 60 },
        { day: 'Monday', date: 'Sep 29', condition: 'Clear Skies', icon: 'sunny', high: 26, low: 18, rainProb: 10 }
      ],
      alerts: [],
      climate: {
        avgAnnualTemp: '16.0°C',
        avgAnnualRain: '1,530 mm',
        avgHumidity: '65%',
        primarySeasons: [
          { name: 'Spring', period: 'Mar – May', icon: '🌸', tempRange: '10°C – 23°C', desc: 'Iconic sakura season, comfortable temperatures.' },
          { name: 'Summer', period: 'Jun – Aug', icon: '☀️', tempRange: '22°C – 32°C', desc: 'Hot, humid with Tsuyu rainy season in June.' },
          { name: 'Autumn', period: 'Sep – Nov', icon: '🍁', tempRange: '12°C – 26°C', desc: 'Vibrant autumn foliage (Koyo), clear crisp days.' },
          { name: 'Winter', period: 'Dec – Feb', icon: '❄️', tempRange: '2°C – 12°C', desc: 'Dry, sunny days with clear views of Mount Fuji.' }
        ],
        monthlyData: [
          { month: 'Jan', high: 10, low: 2, rain: 50 },
          { month: 'Feb', high: 11, low: 3, rain: 55 },
          { month: 'Mar', high: 14, low: 5, rain: 115 },
          { month: 'Apr', high: 19, low: 10, rain: 130 },
          { month: 'May', high: 24, low: 15, rain: 140 },
          { month: 'Jun', high: 26, low: 19, rain: 170 },
          { month: 'Jul', high: 30, low: 23, rain: 155 },
          { month: 'Aug', high: 32, low: 25, rain: 170 },
          { month: 'Sep', high: 28, low: 21, rain: 210 },
          { month: 'Oct', high: 22, low: 15, rain: 200 },
          { month: 'Nov', high: 17, low: 9, rain: 95 },
          { month: 'Dec', high: 12, low: 4, rain: 55 }
        ]
      }
    }
  };

  // Popular search recommendations list
  const searchIndex = [
    { name: 'Lucknow', region: 'Uttar Pradesh', country: 'India', key: 'lucknow' },
    { name: 'New Delhi', region: 'Delhi', country: 'India', key: 'delhi' },
    { name: 'Mumbai', region: 'Maharashtra', country: 'India', key: 'mumbai' },
    { name: 'Bengaluru', region: 'Karnataka', country: 'India', key: 'bengaluru' },
    { name: 'New York', region: 'NY', country: 'United States', key: 'newyork' },
    { name: 'London', region: 'England', country: 'United Kingdom', key: 'london' },
    { name: 'Tokyo', region: 'Tokyo', country: 'Japan', key: 'tokyo' }
  ];

  // Active city pointer (defaults to Lucknow per prompt)
  let activeCityData = citiesDatabase['lucknow'];

  // Map WMO weather codes to human friendly condition + icon
  const mapWmoCode = (code) => {
    switch (code) {
      case 0: return { text: 'Clear Sky', icon: 'sunny' };
      case 1: return { text: 'Mainly Clear', icon: 'sunny' };
      case 2: return { text: 'Partly Cloudy', icon: 'partly_cloudy' };
      case 3: return { text: 'Overcast', icon: 'cloudy' };
      case 45: case 48: return { text: 'Foggy', icon: 'cloudy' };
      case 51: case 53: case 55: return { text: 'Drizzle', icon: 'rain' };
      case 61: case 63: return { text: 'Moderate Rain', icon: 'rain' };
      case 65: return { text: 'Heavy Rain', icon: 'heavy_rain' };
      case 71: case 73: case 75: return { text: 'Snowfall', icon: 'snow' };
      case 80: case 81: case 82: return { text: 'Rain Showers', icon: 'rain' };
      case 95: case 96: case 99: return { text: 'Thunderstorm', icon: 'thunderstorm' };
      default: return { text: 'Partly Cloudy', icon: 'partly_cloudy' };
    }
  };

  /**
   * Fetch live weather data using Open-Meteo
   */
  async function fetchLiveWeather(lat, lon, cityName, regionName, countryName) {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;

      const response = await fetch(weatherUrl);
      if (!response.ok) throw new Error('API network response error');
      const data = await response.json();

      const cur = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      const mappedCondition = mapWmoCode(cur.weather_code);

      // Construct hourly list (next 12 hours)
      const nowIdx = new Date().getHours();
      const hourlyItems = [];
      for (let i = 0; i < 12; i++) {
        const idx = (nowIdx + i) % hourly.time.length;
        const timeStr = i === 0 ? 'Now' : `${(nowIdx + i) % 24}:00`;
        const itemCond = mapWmoCode(hourly.weather_code[idx]);
        hourlyItems.push({
          time: timeStr,
          temp: Math.round(hourly.temperature_2m[idx]),
          condition: itemCond.text,
          icon: itemCond.icon,
          rainProb: hourly.precipitation_probability[idx] || 0
        });
      }

      // Construct daily list
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyItems = [];
      const numDays = Math.min(7, daily.time.length);
      for (let i = 0; i < numDays; i++) {
        const dateObj = new Date(daily.time[i]);
        const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[dateObj.getDay()];
        const itemCond = mapWmoCode(daily.weather_code[i]);
        dailyItems.push({
          day: dayLabel,
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          condition: itemCond.text,
          icon: itemCond.icon,
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          rainProb: daily.precipitation_probability_max[i] || 15
        });
      }

      // Format sunrise and sunset
      const sunriseTime = daily.sunrise && daily.sunrise[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 AM';
      const sunsetTime = daily.sunset && daily.sunset[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:15 PM';

      // Assemble constructed city data
      const liveData = {
        id: cityName.toLowerCase().replace(/\s+/g, '-'),
        name: cityName,
        region: regionName || '',
        country: countryName || '',
        lat: lat,
        lon: lon,
        timezone: data.timezone || 'auto',
        current: {
          temp: Math.round(cur.temperature_2m),
          feelsLike: Math.round(cur.apparent_temperature),
          condition: mappedCondition.text,
          conditionCode: mappedCondition.icon,
          humidity: Math.round(cur.relative_humidity_2m),
          windSpeed: Math.round(cur.wind_speed_10m),
          windDirection: cur.wind_direction_10m > 180 ? 'SW' : 'NE',
          windDeg: cur.wind_direction_10m || 80,
          visibility: 9,
          pressure: Math.round(cur.pressure_msl || 1013),
          uvIndex: 6,
          uvLevel: 'Moderate',
          dewPoint: Math.round(cur.temperature_2m - ((100 - cur.relative_humidity_2m) / 5)),
          cloudCover: Math.round(cur.cloud_cover),
          precipitation: `${cur.precipitation || 0} mm`,
          rainProbability: hourly.precipitation_probability[nowIdx] || 20,
          sunrise: sunriseTime,
          sunset: sunsetTime,
          aqi: 58,
          aqiStatus: 'Moderate',
          aqiColor: '#f59e0b',
          lastUpdated: 'Live via Open-Meteo'
        },
        hourly: hourlyItems,
        daily: dailyItems,
        alerts: [
          {
            id: 'alt-live-1',
            type: 'Local Weather Advisory',
            icon: 'ℹ️',
            severity: 'Minor',
            severityClass: 'alert-minor',
            location: cityName,
            validTime: 'Current forecast cycle',
            description: `Forecast conditions updated live for ${cityName}. Wind speeds around ${Math.round(cur.wind_speed_10m)} km/h with humidity at ${Math.round(cur.relative_humidity_2m)}%.`,
            instructions: 'Plan your outdoor activities according to current precipitation forecasts.'
          }
        ],
        climate: activeCityData.climate // Keep rich historical climate
      };

      return liveData;
    } catch (err) {
      console.warn('Open-Meteo fetch failed, using fallback database:', err);
      return null;
    }
  }

  window.WeatherDataEngine = {
    getCurrentUnit: () => currentUnit,
    setUnit: (unit) => {
      if (unit === 'C' || unit === 'F') currentUnit = unit;
    },
    toggleUnit: () => {
      currentUnit = currentUnit === 'C' ? 'F' : 'C';
      return currentUnit;
    },
    formatTemp,
    getTempVal,
    getUnitSymbol,
    cToF,
    fToC,
    getActiveCity: () => activeCityData,
    setActiveCity: (cityData) => {
      activeCityData = cityData;
    },
    getCityByKey: (key) => citiesDatabase[key.toLowerCase()] || null,
    searchLocalCities: (query) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return searchIndex.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q)
      );
    },
    fetchLiveWeather,
    getAllPreloadedCities: () => Object.values(citiesDatabase)
  };
  return window.WeatherDataEngine;
})();

