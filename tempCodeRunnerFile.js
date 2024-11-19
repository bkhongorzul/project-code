const API_KEY = '5aaa6429a7f9a93680524c2b38864288';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing globe...");
  initializeGlobe();
  console.log("Attempting to get location and fetch data...");
  getLocationAndFetchData();

  document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    if (city) {
      console.log(`Searching for city: ${city}`);
      fetchCityCoordinates(city).then(coords => {
        if (coords) {
          updateGlobe(coords.lat, coords.lon, city);
          fetchAirQualityData(coords.lat, coords.lon);
        } else {
          console.error("Failed to fetch coordinates for the city.");
        }
      });
    }
  });
});

let globe;

const initializeGlobe = () => {
  try {
    const globeContainer = document.getElementById('globeViz');
    if (!globeContainer) {
      console.error("Globe container not found");
      return;
    }

    globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('#000') // Black background for better visibility
      (globeContainer);

    // Add some example markers to check if the globe is visible
    console.log("Adding initial points to globe...");
    globe
      .pointsData([
        { lat: 0, lon: 0, size: 1, color: 'yellow', label: 'Equator' },
        { lat: 37.7749, lon: -122.4194, size: 1, color: 'red', label: 'San Francisco' }
      ])
      .pointAltitude(() => 0.05)
      .pointColor(d => d.color)
      .pointLabel(d => d.label);

    // Set initial camera view to verify visibility
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
    console.log("Globe initialized successfully.");

  } catch (error) {
    console.error("Error initializing globe:", error);
  }
};

const getLocationAndFetchData = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      console.log(`Geolocation coordinates: Latitude ${lat}, Longitude ${lon}`);
      updateGlobe(lat, lon, 'Your Location');
      fetchAirQualityData(lat, lon);
    }, error => {
      console.error("Error getting geolocation:", error);
    });
  } else {
    console.warn("Geolocation is not supported by this browser.");
  }
};

const updateGlobe = (lat, lon, city) => {
  try {
    console.log(`Updating globe view to: Latitude ${lat}, Longitude ${lon}`);
    globe
      .pointOfView({ lat, lng: lon, altitude: 1.5 }, 2000)
      .pointsData([{ lat, lon, size: 1, color: 'blue', label: city }])
      .labelsData([{ lat, lon, city }])
      .labelText(d => `${d.city}: Loading AQI...`)
      .labelSize(1.5);
  } catch (error) {
    console.error("Error updating globe view:", error);
  }
};

const fetchCityCoordinates = async (city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
    if (!response.ok) {
      throw new Error('Failed to fetch city coordinates');
    }
    const data = await response.json();
    console.log("City coordinates:", data.coord);
    return {
      lat: data.coord.lat,
      lon: data.coord.lon,
    };
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    return null;
  }
};

const fetchAirQualityData = async (lat, lon) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!response.ok) {
      throw new Error('Failed to fetch air quality data');
    }
    const data = await response.json();
    console.log('Air Quality Data:', data);
    updateDashboard(data, lat, lon);
  } catch (error) {
    console.error('Error fetching air quality data:', error);
  }
};

const updateDashboard = (data, lat, lon) => {
  try {
    if (data && data.list && data.list.length > 0) {
      const aqi = data.list[0].main.aqi;
      const { pm2_5, pm10, co, no2 } = data.list[0].components;

      // Update AQI in dashboard
      const categories = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      const categoryClasses = ['aqi-good', 'aqi-moderate', 'aqi-unhealthy', 'aqi-very-unhealthy', 'aqi-hazardous'];

      const aqiCategory = categories[aqi - 1];
      document.getElementById('aqi-level').textContent = aqi;
      document.getElementById('aqi-category').textContent = `Air Quality is ${aqiCategory}`;
      document.getElementById('current-aqi').className = categoryClasses[aqi - 1];

      // Update Pollutant Table
      document.getElementById('pollutant-pm25').textContent = pm2_5 ? `${pm2_5} µg/m³` : '--';
      document.getElementById('pollutant-pm10').textContent = pm10 ? `${pm10} µg/m³` : '--';
      document.getElementById('pollutant-co').textContent = co ? `${co} ppm` : '--';
      document.getElementById('pollutant-no2').textContent = no2 ? `${no2} ppb` : '--';

      // Update Recommendations
      const recommendationsList = document.getElementById('recommendations-list');
      recommendationsList.innerHTML = ''; // Clear previous recommendations
      const recommendations = getRecommendations(aqi);
      recommendations.forEach((recommendation) => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        recommendationsList.appendChild(li);
      });

      // Update the label on the globe
      globe
        .labelsData([{ lat, lon, city: `AQI: ${aqi}` }])
        .labelText(d => `${d.city}: AQI Level - ${aqiCategory}`)
        .labelColor(() => getPollutantColor(aqi));

    } else {
      console.error('No valid air quality data available:', data);
    }
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
};

const getPollutantColor = (aqi) => {
  switch (aqi) {
    case 1: return '#4caf50'; // Good
    case 2: return '#ffeb3b'; // Fair
    case 3: return '#ff9800'; // Moderate
    case 4: return '#ff5722'; // Poor
    case 5: return '#f44336'; // Very Poor
    default: return '#fff';
  }
};

const getRecommendations = (aqi) => {
  if (aqi === 1) return ['Enjoy outdoor activities.', 'No health impacts.'];
  if (aqi === 2) return ['Sensitive groups should limit outdoor exercise.'];
  if (aqi === 3) return ['Consider reducing outdoor exercise.', 'Close windows to avoid pollution.'];
  if (aqi === 4) return ['Stay indoors.', 'Use air purifiers if possible.'];
  if (aqi === 5) return ['Avoid outdoor activities.', 'Wear a mask.'];
  return ['No recommendations available.'];
};
