const API_KEY = '5aaa6429a7f9a93680524c2b38864288';
let globe;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeGlobe();
  initializeCharts();

  // Handle search functionality
  document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
      clearPreviousCityData();
      fetchCityCoordinates(city).then(coords => {
        if (coords) {
          fetchAirQualityData(coords.lat, coords.lon, coords.temperature, coords.humidity, city);
        } else {
          alert("City not found.");
        }
      });
    } else {
      alert("Please enter a city name.");
    }
  });

  // Navigation buttons
  document.getElementById('navHome').addEventListener('click', () => showSection('home'));
  document.getElementById('navData').addEventListener('click', () => showSection('data'));
  document.getElementById('navRanking').addEventListener('click', fetchWorldRanking);
  document.getElementById('navAbout').addEventListener('click', () => showSection('about'));
});

// Initialize the globe with original size and settings
const initializeGlobe = () => {
  globe = Globe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundColor('#000')(document.getElementById('globeViz'));

  globe.pointOfView({ lat: 0, lng: 0, altitude: 2 });

  globe.labelsData([
    { lat: 37.5665, lng: 126.9780, name: 'Seoul' },
    { lat: 40.7128, lng: -74.0060, name: 'New York' },
    { lat: 51.5074, lng: -0.1278, name: 'London' },
  ])
    .labelLat(d => d.lat)
    .labelLng(d => d.lng)
    .labelText(d => d.name)
    .labelSize(0.5)
    .labelColor(() => 'white');
};

// Fetch city coordinates
const fetchCityCoordinates = async (city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (response.ok) {
      const data = await response.json();
      const coords = { lat: data.coord.lat, lon: data.coord.lon, temperature: data.main.temp, humidity: data.main.humidity };

      globe.pointOfView({ lat: coords.lat, lng: coords.lon, altitude: 1.5 });

      return coords;
    } else {
      alert("City not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching city coordinates:", error);
    alert("Network error. Please try again.");
    return null;
  }
};

// Fetch air quality data
const fetchAirQualityData = async (lat, lon, temperature, humidity, city) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      if (data.list && data.list[0] && data.list[0].components) {
        displayAirQualityInfo(data, temperature, humidity, city);
        updateCharts(data.list[0].components); // Pass the pollutant data correctly
      } else {
        alert("No pollutant data available for this location.");
      }
    } else {
      alert("Failed to fetch air quality data.");
    }
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    alert("Network error. Please try again.");
  }
};

// Display air quality information
const displayAirQualityInfo = (data, temperature, humidity, city) => {
  const aqi = data.list[0].main.aqi;
  const aqiQuality = getAqiQuality(aqi);

  document.getElementById('cityName').textContent = city;
  document.getElementById('aqiValue').textContent = aqi;
  document.getElementById('aqiQuality').textContent = aqiQuality;
  document.getElementById('temperature').textContent = temperature;
  document.getElementById('humidity').textContent = humidity;
  document.getElementById('cityDetails').style.display = 'block';
};

const getAqiQuality = (aqi) => {
  if (aqi === 1) return 'Good';
  if (aqi === 2) return 'Fair';
  if (aqi === 3) return 'Moderate';
  if (aqi === 4) return 'Poor';
  if (aqi === 5) return 'Very Poor';
  return 'Unknown';
};

// Initialize charts
let lineChart, barChart, doughnutChart;

const initializeCharts = () => {
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  const barCtx = document.getElementById('barChart').getContext('2d');
  const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');

  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Pollutants', data: [], borderColor: 'blue', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: true },
  });

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: { labels: ['PM2.5', 'PM10', 'NO2', 'NH3', 'SO2'], datasets: [{ label: 'Levels', data: [], backgroundColor: ['red', 'blue', 'green', 'yellow', 'purple'] }] },
    options: { responsive: true, maintainAspectRatio: true },
  });

  doughnutChart = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: { labels: ['PM2.5', 'PM10', 'NO2', 'NH3', 'SO2'], datasets: [{ data: [], backgroundColor: ['red', 'blue', 'green', 'yellow', 'purple'] }] },
    options: { responsive: true, maintainAspectRatio: true },
  });
};

const updateCharts = (components) => {
  const { pm2_5, pm10, no2, nh3, so2 } = components;

  // Ensure the pollutant data is displayed correctly on the charts
  lineChart.data.labels = ['PM2.5', 'PM10', 'NO2', 'NH3', 'SO2'];
  lineChart.data.datasets[0].data = [pm2_5, pm10, no2, nh3, so2];
  lineChart.update();

  barChart.data.datasets[0].data = [pm2_5, pm10, no2, nh3, so2];
  barChart.update();

  doughnutChart.data.datasets[0].data = [pm2_5, pm10, no2, nh3, so2];
  doughnutChart.update();
};


const clearPreviousCityData = () => {
  document.getElementById('cityDetails').style.display = 'none';
  document.getElementById('cityName').textContent = '';
  document.getElementById('aqiValue').textContent = '';
  document.getElementById('aqiQuality').textContent = '';
  document.getElementById('temperature').textContent = '';
  document.getElementById('humidity').textContent = '';
};

const showSection = (section) => {
  document.getElementById('globeViz').style.display = 'none';
  document.getElementById('dataSection').style.display = 'none';
  document.getElementById('rankingSection').style.display = 'none';
  document.getElementById('aboutSection').style.display = 'none';

  if (section === 'home') document.getElementById('globeViz').style.display = 'block';
  if (section === 'data') document.getElementById('dataSection').style.display = 'block';
  if (section === 'ranking') document.getElementById('rankingSection').style.display = 'block';
  if (section === 'about') document.getElementById('aboutSection').style.display = 'block';
};
