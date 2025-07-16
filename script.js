// Global variables
let currentTrainFile = "";
let weatherUpdateInProgress = false;

// Weather integration functions
async function updateWeatherForAllDays() {
  if (weatherUpdateInProgress || !window.weatherService?.isConfigured()) return;
  
  weatherUpdateInProgress = true;
  
  try {
    const weatherUpdates = await window.weatherService.updateWeatherForItinerary(itineraryData);
    
    weatherUpdates.forEach(update => {
      const dayCard = document.getElementById(`day-${update.index}`);
      if (dayCard) {
        updateDayWeather(dayCard, update.weather, update.index);
      }
    });
    
    // Update the update button
    const updateBtn = document.querySelector('.weather-update-btn');
    if (updateBtn) {
      updateBtn.textContent = '✓ Weather Updated';
      updateBtn.disabled = true;
      setTimeout(() => {
        updateBtn.textContent = '🌤️ Update Weather';
        updateBtn.disabled = false;
      }, 3000);
    }
  } catch (error) {
    console.error('Error updating weather:', error);
  } finally {
    weatherUpdateInProgress = false;
  }
}

function updateDayWeather(dayCard, weatherData, dayIndex) {
  if (!weatherData) return;
  
  // Update the day card's weather class
  dayCard.className = dayCard.className.replace(/\b(sunny|cloudy|rainy|partly-cloudy|snowy|foggy|stormy)\b/g, '');
  dayCard.classList.add(weatherData.theme);
  
  // Update weather info in the header
  const weatherInfo = dayCard.querySelector('.weather-info');
  if (weatherInfo) {
    weatherInfo.innerHTML = `
      <div class="weather-main">
        <span class="weather-icon">${weatherData.emoji}</span>
        <span>${weatherData.temperature}°C</span>
      </div>
      <div class="weather-description">${weatherData.description}</div>
    `;
  }
  
  // Update data in the itineraryData array
  if (itineraryData[dayIndex]) {
    itineraryData[dayIndex].weather = weatherData.theme;
    itineraryData[dayIndex].weatherIcon = weatherData.emoji;
    itineraryData[dayIndex].temperature = `${weatherData.temperature}°C`;
    itineraryData[dayIndex].weatherDescription = weatherData.description;
    itineraryData[dayIndex].realTimeWeather = weatherData;
  }
}

function addWeatherUpdateButton() {
  const quickLinks = document.querySelector('.quick-links');
  if (quickLinks && window.weatherService?.isConfigured()) {
    const updateBtn = document.createElement('button');
    updateBtn.className = 'weather-update-btn';
    updateBtn.textContent = '🌤️ Update Weather';
    updateBtn.onclick = updateWeatherForAllDays;
    quickLinks.appendChild(updateBtn);
  }
}

function showApiKeyNotice() {
  if (!window.weatherService?.isConfigured()) {
    const notice = document.createElement('div');
    notice.className = 'api-key-notice';
    notice.innerHTML = `
      <strong>Real-time Weather:</strong> To enable live weather updates, please add your WeatherAPI.com API key to the weather.js file. 
      <a href="https://www.weatherapi.com/signup.aspx" target="_blank">Get a free API key here</a> (1M calls/month free).
    `;
    
    const container = document.querySelector('.container');
    const quickLinks = document.querySelector('.quick-links');
    container.insertBefore(notice, quickLinks.nextSibling);
  }
}

// Utility functions
function openGoogleMaps(location) {
  const url = `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
  window.open(url, '_blank');
}

function openDriveFolder(type) {
  if (folderUrls[type]) {
    window.open(folderUrls[type], '_blank');
  } else {
    alert(`Folder URL not found for: ${type}`);
  }
}

function openSpecificDocument(type, filename) {
  if (type === "train") {
    // Show modal for train tickets
    currentTrainFile = filename;
    const modal = document.getElementById("trainModal");
    modal.style.display = "flex";
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    
    // Focus the modal for accessibility
    modal.focus();
    return;
  }

  // For non-train documents, use direct links
  if (documentUrls[filename]) {
    window.open(documentUrls[filename], "_blank");
  } else {
    alert(`Document not found: ${filename}\nPlease add the Google Drive link to the documentUrls object.`);
  }
}

function openTrainTicket(person) {
  const ticketUrl = trainTicketUrls[person]?.[currentTrainFile];
  if (ticketUrl) {
    window.open(ticketUrl, "_blank");
  } else {
    alert(`Train ticket not found for ${person}: ${currentTrainFile}\nPlease add the Google Drive link.`);
  }
  closeTrainModal();
}

function closeTrainModal() {
  const modal = document.getElementById("trainModal");
  modal.style.display = "none";
  
  // Restore body scroll
  document.body.style.overflow = "auto";
  
  currentTrainFile = "";
}

function toggleDay(dayIndex) {
  const dayCard = document.getElementById(`day-${dayIndex}`);
  dayCard.classList.toggle("expanded");
}

function scrollToToday() {
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Find the closest date to today
  let closestIndex = 0;
  let closestDiff = Infinity;
  
  itineraryData.forEach((day, index) => {
    const dayDate = new Date(day.date + ", 2025");
    const diff = Math.abs(dayDate.getTime() - today.getTime());
    
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = index;
    }
  });
  
  const dayCard = document.getElementById(`day-${closestIndex}`);
  if (dayCard) {
    dayCard.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Briefly highlight the card
    dayCard.style.transform = 'scale(1.02)';
    dayCard.style.boxShadow = '0 25px 70px rgba(0, 122, 255, 0.3)';
    
    setTimeout(() => {
      dayCard.style.transform = '';
      dayCard.style.boxShadow = '';
    }, 1000);
  }
}

function getWeatherGradient(weather) {
  switch(weather) {
    case 'sunny':
      return 'linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 235, 59, 0.15) 100%)';
    case 'cloudy':
      return 'linear-gradient(135deg, rgba(158, 158, 158, 0.2) 0%, rgba(189, 189, 189, 0.15) 100%)';
    case 'rainy':
      return 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(100, 181, 246, 0.15) 100%)';
    case 'partly-cloudy':
      return 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(158, 158, 158, 0.15) 100%)';
    default:
      return 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(248, 249, 250, 0.1) 100%)';
  }
}

function renderItinerary() {
  const container = document.getElementById("itinerary");
  container.innerHTML = ''; // Clear existing content

  itineraryData.forEach((day, index) => {
    const dayCard = document.createElement("div");
    dayCard.className = `day-card ${day.type} ${day.weather}`;
    dayCard.id = `day-${index}`;
    dayCard.style.animationDelay = `${index * 0.1}s`;

    // Create location link
    const locationHtml = day.googleMapsQuery 
      ? `<span class="location-link" onclick="openGoogleMaps('${day.googleMapsQuery}')">${day.location}</span>`
      : day.location;

    // Create quick links HTML
    const quickLinksHtml = day.quickLinks
      ? `<div class="detail-section">
          <div class="detail-title">🔗 Quick Access</div>
          <div class="quick-access-links">
              ${day.quickLinks
                .map(
                  (link) =>
                    `<a href="#" class="quick-access-btn" onclick="openSpecificDocument('${link.type}', '${link.file}')">${link.text}</a>`
                )
                .join("")}
          </div>
      </div>`
      : "";

    // Create weather info HTML with enhanced details
    const weatherInfoHtml = `
      <div class="weather-info">
        <div class="weather-main">
          <span class="weather-icon">${day.weatherIcon}</span>
          <span>${day.temperature}</span>
          ${day.realTimeWeather?.maxTemp ? `<span class="weather-range">/${day.realTimeWeather.maxTemp}°C</span>` : ''}
        </div>
        ${day.weatherDescription ? `<div class="weather-description">${day.weatherDescription}</div>` : ''}
        ${day.realTimeWeather ? `<div class="weather-details">
          <div class="weather-description">Feels like ${day.realTimeWeather.feelsLike}°C</div>
          <div class="weather-description">Humidity: ${day.realTimeWeather.humidity}%</div>
          ${day.realTimeWeather.chanceOfRain > 0 ? `<div class="weather-description">Rain: ${day.realTimeWeather.chanceOfRain}%</div>` : ''}
        </div>` : ''}
      </div>
    `;

    dayCard.innerHTML = `
      <div class="day-header" onclick="toggleDay(${index})">
          <div class="day-info">
              <div class="day-date">${day.emoji} ${day.date}</div>
              <div class="day-location">${locationHtml}</div>
              ${weatherInfoHtml}
          </div>
          <div class="day-status">${day.status}</div>
          <div class="expand-icon">▼</div>
      </div>
      <div class="day-details">
          ${quickLinksHtml}
          <div class="detail-section">
              <div class="detail-title">📋 Activities</div>
              <div class="detail-content">${day.activities.replace(/\n/g, "<br>")}</div>
          </div>
          <div class="detail-section">
              <div class="detail-title">🏨 Accommodation</div>
              <div class="detail-content">${day.accommodation}</div>
          </div>
          ${day.realTimeWeather ? `<div class="detail-section">
              <div class="detail-title">🌤️ Weather Details</div>
              <div class="detail-content">
                  ${day.realTimeWeather.maxTemp ? `High: ${day.realTimeWeather.maxTemp}°C, Low: ${day.realTimeWeather.minTemp}°C<br>` : ''}
                  Wind: ${day.realTimeWeather.windSpeed} km/h ${day.realTimeWeather.windDirection || ''}<br>
                  ${day.realTimeWeather.visibility ? `Visibility: ${day.realTimeWeather.visibility} km<br>` : ''}
                  ${day.realTimeWeather.uvIndex ? `UV Index: ${day.realTimeWeather.uvIndex}<br>` : ''}
                  ${day.realTimeWeather.chanceOfRain > 0 ? `Chance of Rain: ${day.realTimeWeather.chanceOfRain}%<br>` : ''}
                  ${day.realTimeWeather.chanceOfSnow > 0 ? `Chance of Snow: ${day.realTimeWeather.chanceOfSnow}%<br>` : ''}
                  ${day.realTimeWeather.sunrise ? `Sunrise: ${day.realTimeWeather.sunrise}<br>` : ''}
                  ${day.realTimeWeather.sunset ? `Sunset: ${day.realTimeWeather.sunset}<br>` : ''}
                  Last updated: ${new Date(day.realTimeWeather.timestamp).toLocaleTimeString()}
              </div>
          </div>` : ''}
      </div>
    `;

    container.appendChild(dayCard);
  });
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
  renderItinerary();
  
  // Initialize weather features
  showApiKeyNotice();
  addWeatherUpdateButton();
  
  // Auto-update weather if API is configured
  if (window.weatherService?.isConfigured()) {
    // Add a small delay to let the page render first
    setTimeout(() => {
      updateWeatherForAllDays();
    }, 1000);
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeTrainModal();
    } else if (e.key === 'Home' || (e.ctrlKey && e.key === 'Home')) {
      scrollToToday();
    } else if (e.key === 'w' && e.ctrlKey) {
      e.preventDefault();
      updateWeatherForAllDays();
    }
  });
  
  // Close modal when clicking outside
  document.addEventListener("click", function(event) {
    const modal = document.getElementById("trainModal");
    if (event.target === modal) {
      closeTrainModal();
    }
  });
  
  // Add smooth scrolling for better UX
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Add touch support for mobile
  let touchStartY = 0;
  let touchEndY = 0;
  
  document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
  });
  
  document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });
  
  function handleSwipe() {
    const swipeDistance = touchStartY - touchEndY;
    const minSwipeDistance = 50;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe up - could add functionality here
      } else {
        // Swipe down - could add functionality here
      }
    }
  }
});

// Performance optimization: Lazy load day details
function optimizeRendering() {
  const dayCards = document.querySelectorAll('.day-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });
  
  dayCards.forEach(card => {
    observer.observe(card);
  });
}

// Initialize performance optimizations after DOM is loaded
document.addEventListener('DOMContentLoaded', optimizeRendering);

// Add search functionality
function searchItinerary(query) {
  const cards = document.querySelectorAll('.day-card');
  
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const matches = text.includes(query.toLowerCase());
    
    card.style.display = matches ? 'block' : 'none';
  });
}

// Export functions for potential external use
window.tripPlanner = {
  openGoogleMaps,
  openDriveFolder,
  openSpecificDocument,
  openTrainTicket,
  closeTrainModal,
  toggleDay,
  scrollToToday,
  searchItinerary
};