const API_KEY = '5aaa6429a7f9a93680524c2b38864288';
let globe;

document.addEventListener('DOMContentLoaded', () => {
  console.log("Page loaded. Attempting to initialize the globe...");

  // Wait until external libraries are fully loaded
  window.addEventListener('load', () => {
    if (typeof Globe !== 'undefined') {
      initializeGlobe();
    } else {
      console.error("Globe library not loaded properly.");
    }
  });

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

const initializeGlobe = () => {
  try {
    const globeContainer = document.getElementById('globeViz');
    if (!globeContainer) {
      throw new Error("Globe container not found");
    }

    // Initialize the globe
    globe = Globe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundColor('rgba(0, 0, 0, 0.7)')(globeContainer); // Set semi-transparent background

    console.log("Globe initialized successfully.");
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
  } catch (error) {
    console.error("Error initializing globe:", error);
  }
};

const fetchCityCoordinates = async (city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
      throw new Error('Failed to fetch city coordinates');
    }
    const data = await response.json();
    console.log("City coordinates:", data.coord);
    return {
      lat: data.coord.lat,
      lon: data.coord.lon,
      temperature: data.main.temp,
      humidity: data.main.humidity,
    };
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    return null;
  }
};

const updateGlobe = (lat, lon, city) => {
  try {
    console.log(`Updating globe view to: Latitude ${lat}, Longitude ${lon}`);
    if (globe) {
      globe.pointOfView({ lat, lng: lon, altitude: 1.5 }, 2000);
      globe.pointsData([
        { lat, lon, size: 1, color: 'blue', label: city }
      ])
      .pointAltitude(() => 0.05)
      .pointColor(d => d.color)
      .pointLabel(d => d.label)
      .onPointClick((point) => {
        // When clicking on a city marker, show the air quality details
        fetchAirQualityData(point.lat, point.lon, point.label);
      });
    } else {
      console.error("Globe instance not initialized.");
    }
  } catch (error) {
    console.error("Error updating globe view:", error);
  }
};

const fetchAirQualityData = async (lat, lon, city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!response.ok) {
      throw new Error('Failed to fetch air quality data');
    }
    const data = await response.json();
    displayAirQualityInfo(data, city);
  } catch (error) {
    console.error('Error fetching air quality data:', error);
  }
};

const displayAirQualityInfo = (data, city) => {
  if (data && data.list && data.list.length > 0) {
    const aqi = data.list[0].main.aqi;
    const { pm2_5, pm10, co, no2, nh3, so2, voc } = data.list[0].components;

    document.getElementById('cityName').textContent = city;
    document.getElementById('aqiValue').textContent = aqi;
    document.getElementById('temperature').textContent = `${data.temperature} °C`;
    document.getElementById('humidity').textContent = `${data.humidity} %`;
    document.getElementById('pm25').textContent = pm2_5 ? `${pm2_5} µg/m³` : '--';
    document.getElementById('pm10').textContent = pm10 ? `${pm10} µg/m³` : '--';
    document.getElementById('nox').textContent = no2 ? `${no2} ppb` : '--';
    document.getElementById('nh3').textContent = nh3 ? `${nh3} ppb` : '--';
    document.getElementById('co2').textContent = '--'; // Placeholder, as CO2 data is not available from OpenWeatherMap
    document.getElementById('so2').textContent = so2 ? `${so2} ppb` : '--';
    document.getElementById('voc').textContent = voc ? `${voc} ppb` : '--';

    // Show the details section
    document.getElementById('aqi-details').style.display = 'block';
  } else {
    alert("No air quality data available.");
  }
};

function closeDetails() {
  document.getElementById('aqi-details').style.display = 'none';
}
