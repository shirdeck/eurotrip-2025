// Weather Service Module using WeatherAPI.com
class WeatherService {
    constructor() {
      // WeatherAPI.com API key - Get this from https://www.weatherapi.com/my/
      this.apiKey = '9bd61b181b09402ea43162209251607'; // Replace with your actual API key
      this.baseUrl = 'https://api.weatherapi.com/v1';
      this.cache = new Map();
      this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }
  
    // Get weather icon emoji based on WeatherAPI condition codes
    getWeatherEmoji(conditionCode, isDay = true) {
      const iconMap = {
        // Sunny
        1000: isDay ? '☀️' : '🌙',
        // Partly cloudy
        1003: isDay ? '⛅' : '☁️',
        // Cloudy
        1006: '☁️',
        1009: '☁️',
        // Overcast
        1030: '🌫️',
        // Mist/Fog
        1135: '🌫️',
        1147: '🌫️',
        // Patchy rain possible
        1063: '🌦️',
        1180: '🌦️',
        1183: '🌦️',
        1186: '🌧️',
        1189: '🌧️',
        1192: '🌧️',
        1195: '🌧️',
        1198: '🌧️',
        1201: '🌧️',
        1240: '🌦️',
        1243: '🌧️',
        1246: '🌧️',
        // Snow
        1066: '❄️',
        1069: '❄️',
        1072: '❄️',
        1114: '❄️',
        1117: '❄️',
        1204: '❄️',
        1207: '❄️',
        1210: '❄️',
        1213: '❄️',
        1216: '❄️',
        1219: '❄️',
        1222: '❄️',
        1225: '❄️',
        1237: '❄️',
        1249: '❄️',
        1252: '❄️',
        1255: '❄️',
        1258: '❄️',
        1261: '❄️',
        1264: '❄️',
        // Thunderstorm
        1087: '⛈️',
        1273: '⛈️',
        1276: '⛈️',
        1279: '⛈️',
        1282: '⛈️'
      };
      
      return iconMap[conditionCode] || (isDay ? '☀️' : '🌙');
    }
  
    // Get weather theme class based on condition code
    getWeatherTheme(conditionCode, isDay = true) {
      if (conditionCode === 1000) return 'sunny';
      if (conditionCode === 1003) return 'partly-cloudy';
      if ([1006, 1009].includes(conditionCode)) return 'cloudy';
      if ([1030, 1135, 1147].includes(conditionCode)) return 'foggy';
      if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(conditionCode)) return 'rainy';
      if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(conditionCode)) return 'snowy';
      if ([1087, 1273, 1276, 1279, 1282].includes(conditionCode)) return 'stormy';
      
      return 'partly-cloudy';
    }
  
    // Get current weather for a location
    async getCurrentWeather(location) {
      const cacheKey = `current_${location}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
  
      try {
        const response = await fetch(
          `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&aqi=no`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const weatherData = {
          location: `${data.location.name}, ${data.location.country}`,
          temperature: Math.round(data.current.temp_c),
          description: data.current.condition.text,
          conditionCode: data.current.condition.code,
          emoji: this.getWeatherEmoji(data.current.condition.code, data.current.is_day),
          theme: this.getWeatherTheme(data.current.condition.code, data.current.is_day),
          humidity: data.current.humidity,
          windSpeed: data.current.wind_kph,
          windDirection: data.current.wind_dir,
          feelsLike: Math.round(data.current.feelslike_c),
          visibility: data.current.vis_km,
          uvIndex: data.current.uv,
          pressure: data.current.pressure_mb,
          isDay: data.current.is_day,
          timestamp: Date.now()
        };
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: weatherData,
          timestamp: Date.now()
        });
        
        return weatherData;
      } catch (error) {
        console.error('Error fetching current weather:', error);
        return null;
      }
    }
  
    // Get weather forecast for a specific date (up to 10 days ahead)
    async getWeatherForDate(location, targetDate) {
      const cacheKey = `forecast_${location}_${targetDate}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
  
      try {
        const target = new Date(targetDate);
        const today = new Date();
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // WeatherAPI supports up to 10 days forecast
        if (diffDays > 10) {
          console.warn(`Date ${targetDate} is more than 10 days ahead, using historical/future endpoint`);
          return await this.getHistoricalWeather(location, targetDate);
        }
        
        const response = await fetch(
          `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=10&aqi=no&alerts=no`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Find the forecast for the target date
        const targetDateStr = target.toISOString().split('T')[0];
        const forecastDay = data.forecast.forecastday.find(day => day.date === targetDateStr);
        
        if (forecastDay) {
          const weatherData = {
            location: `${data.location.name}, ${data.location.country}`,
            temperature: Math.round(forecastDay.day.avgtemp_c),
            maxTemp: Math.round(forecastDay.day.maxtemp_c),
            minTemp: Math.round(forecastDay.day.mintemp_c),
            description: forecastDay.day.condition.text,
            conditionCode: forecastDay.day.condition.code,
            emoji: this.getWeatherEmoji(forecastDay.day.condition.code, true),
            theme: this.getWeatherTheme(forecastDay.day.condition.code, true),
            humidity: forecastDay.day.avghumidity,
            windSpeed: forecastDay.day.maxwind_kph,
            visibility: forecastDay.day.avgvis_km,
            uvIndex: forecastDay.day.uv,
            chanceOfRain: forecastDay.day.daily_chance_of_rain,
            chanceOfSnow: forecastDay.day.daily_chance_of_snow,
            sunrise: forecastDay.astro.sunrise,
            sunset: forecastDay.astro.sunset,
            date: new Date(forecastDay.date),
            timestamp: Date.now()
          };
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: weatherData,
            timestamp: Date.now()
          });
          
          return weatherData;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching weather forecast:', error);
        return null;
      }
    }
  
    // Get historical weather data for dates beyond 10 days
    async getHistoricalWeather(location, targetDate) {
      try {
        const response = await fetch(
          `${this.baseUrl}/history.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&dt=${targetDate}`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        const historyDay = data.forecast.forecastday[0];
        
        if (historyDay) {
          const weatherData = {
            location: `${data.location.name}, ${data.location.country}`,
            temperature: Math.round(historyDay.day.avgtemp_c),
            maxTemp: Math.round(historyDay.day.maxtemp_c),
            minTemp: Math.round(historyDay.day.mintemp_c),
            description: historyDay.day.condition.text,
            conditionCode: historyDay.day.condition.code,
            emoji: this.getWeatherEmoji(historyDay.day.condition.code, true),
            theme: this.getWeatherTheme(historyDay.day.condition.code, true),
            humidity: historyDay.day.avghumidity,
            windSpeed: historyDay.day.maxwind_kph,
            visibility: historyDay.day.avgvis_km,
            uvIndex: historyDay.day.uv,
            sunrise: historyDay.astro.sunrise,
            sunset: historyDay.astro.sunset,
            date: new Date(historyDay.date),
            timestamp: Date.now(),
            isHistorical: true
          };
          
          return weatherData;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching historical weather:', error);
        return null;
      }
    }
  
    // Batch update weather for multiple locations
    async updateWeatherForItinerary(itineraryData) {
      const promises = itineraryData.map(async (day, index) => {
        if (!day.googleMapsQuery) return null;
        
        // Extract city from the location query
        const locationParts = day.googleMapsQuery.split(',');
        const cityCountry = locationParts.length > 1 ? 
          `${locationParts[locationParts.length - 2].trim()}, ${locationParts[locationParts.length - 1].trim()}` : 
          locationParts[0].trim();
        
        try {
          // Parse the date properly
          const dayDate = new Date(day.date + ', 2025');
          const today = new Date();
          
          let weatherData;
          
          // If it's today, get current weather
          if (dayDate.toDateString() === today.toDateString()) {
            weatherData = await this.getCurrentWeather(cityCountry);
          } else {
            // Format date for WeatherAPI (YYYY-MM-DD)
            const formattedDate = dayDate.toISOString().split('T')[0];
            weatherData = await this.getWeatherForDate(cityCountry, formattedDate);
          }
          
          if (weatherData) {
            return {
              index,
              weather: weatherData
            };
          }
        } catch (error) {
          console.error(`Error updating weather for ${day.location}:`, error);
        }
        
        return null;
      });
      
      const results = await Promise.all(promises);
      return results.filter(result => result !== null);
    }
  
    // Get weather for multiple locations at once (bulk request)
    async getBulkWeather(locations) {
      const promises = locations.map(async (location) => {
        try {
          const weather = await this.getCurrentWeather(location);
          return { location, weather };
        } catch (error) {
          console.error(`Error fetching weather for ${location}:`, error);
          return { location, weather: null };
        }
      });
      
      return await Promise.all(promises);
    }
  
    // Get weather alerts for a location
    async getWeatherAlerts(location) {
      try {
        const response = await fetch(
          `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&aqi=no&alerts=yes`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.alerts?.alert || [];
      } catch (error) {
        console.error('Error fetching weather alerts:', error);
        return [];
      }
    }
  
    // Clear cache
    clearCache() {
      this.cache.clear();
    }
  
    // Get cache statistics
    getCacheStats() {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys()),
        timeout: this.cacheTimeout
      };
    }
  
    // Check if API key is configured
    isConfigured() {
      return this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE';
    }
  }
  
  // Create global weather service instance
  const weatherService = new WeatherService();
  
  // Export for use in other modules
  window.weatherService = weatherService;