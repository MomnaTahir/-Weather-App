/**
 * Aether Weather App — app.js
 * Uses OpenWeatherMap Current Weather API (free tier)
 *
 * ⚙️  SETUP:
 *   1. Sign up at https://openweathermap.org/api
 *   2. Copy your API key and paste it below.
 */

const API_KEY = "8e0898cd6b10ef38860a5c970d87859a"; // 🔑 Replace with your OpenWeatherMap API key
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ─── DOM References ───────────────────────────────────────────────
const cityInput    = document.getElementById("cityInput");
const searchBtn    = document.getElementById("searchBtn");
const loader       = document.getElementById("loader");
const errorBox     = document.getElementById("errorBox");
const errorMsg     = document.getElementById("errorMsg");
const weatherCard  = document.getElementById("weatherCard");
const emptyState   = document.getElementById("emptyState");

// Card elements
const cityName     = document.getElementById("cityName");
const countryName  = document.getElementById("countryName");
const dateStr      = document.getElementById("dateStr");
const timeStr      = document.getElementById("timeStr");
const tempVal      = document.getElementById("tempVal");
const weatherIcon  = document.getElementById("weatherIcon");
const conditionText = document.getElementById("conditionText");
const feelsLike    = document.getElementById("feelsLike");
const humidity     = document.getElementById("humidity");
const windSpeed    = document.getElementById("windSpeed");
const visibility   = document.getElementById("visibility");
const pressure     = document.getElementById("pressure");
const sunrise      = document.getElementById("sunrise");
const sunset       = document.getElementById("sunset");
const tempMax      = document.getElementById("tempMax");
const tempMin      = document.getElementById("tempMin");
const tempBarFill  = document.getElementById("tempBarFill");

// ─── Weather Icon Map ─────────────────────────────────────────────
const ICON_MAP = {
  "01d": "☀️", "01n": "🌙",
  "02d": "🌤", "02n": "🌤",
  "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧", "09n": "🌧",
  "10d": "🌦", "10n": "🌧",
  "11d": "⛈", "11n": "⛈",
  "13d": "❄️", "13n": "❄️",
  "50d": "🌫", "50n": "🌫",
};

// ─── State Management ─────────────────────────────────────────────
function setState(state) {
  loader.classList.add("hidden");
  errorBox.classList.add("hidden");
  weatherCard.classList.add("hidden");
  emptyState.classList.add("hidden");

  switch (state) {
    case "loading": loader.classList.remove("hidden"); break;
    case "error":   errorBox.classList.remove("hidden"); break;
    case "data":    weatherCard.classList.remove("hidden"); break;
    case "empty":   emptyState.classList.remove("hidden"); break;
  }
}

// ─── Utility Helpers ──────────────────────────────────────────────
function kelvinToCelsius(k) {
  return Math.round(k - 273.15);
}

function formatTime(unixTs, tzOffset) {
  const localMs  = (unixTs + tzOffset) * 1000;
  const d        = new Date(localMs);
  const hh       = String(d.getUTCHours()).padStart(2, "0");
  const mm       = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDate(unixTs, tzOffset) {
  const localMs = (unixTs + tzOffset) * 1000;
  const d       = new Date(localMs);
  return d.toUTCString().split(" ").slice(0, 4).join(" ");
}

function metersToKm(m) {
  return m >= 1000 ? (m / 1000).toFixed(1) + " km" : m + " m";
}

// Temperature bar — maps current temp in [min,max] to 0–100%
function calcBarWidth(current, min, max) {
  if (max === min) return 50;
  return Math.round(((current - min) / (max - min)) * 100);
}

// ─── Fetch Weather Data ───────────────────────────────────────────
async function fetchWeather(city) {
  if (!city.trim()) {
    showError("Please enter a city name.");
    return;
  }

  if (API_KEY === "YOUR_API_KEY_HERE") {
    showError("API key not set. Open app.js and add your OpenWeatherMap key.");
    return;
  }

  setState("loading");

  try {
    const url      = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        showError(`City "${city}" not found. Check spelling and try again.`);
      } else if (response.status === 401) {
        showError("Invalid API key. Please check your key in app.js.");
      } else {
        showError(`API error (${response.status}). Please try again later.`);
      }
      return;
    }

    const data = await response.json();
    renderWeather(data);

  } catch (err) {
    if (!navigator.onLine) {
      showError("No internet connection. Please check your network.");
    } else {
      showError("Failed to reach the weather service. Please try again.");
    }
    console.error("Weather fetch error:", err);
  }
}

// ─── Render Weather Data ──────────────────────────────────────────
function renderWeather(d) {
  const tzOffset = d.timezone; // seconds offset from UTC
  const nowUtc   = Math.floor(Date.now() / 1000);

  const tCurrent = kelvinToCelsius(d.main.temp);
  const tFeels   = kelvinToCelsius(d.main.feels_like);
  const tHigh    = kelvinToCelsius(d.main.temp_max);
  const tLow     = kelvinToCelsius(d.main.temp_min);

  // Location
  cityName.textContent    = d.name;
  countryName.textContent = d.sys.country;

  // Date & Time (local to the city)
  dateStr.textContent = formatDate(nowUtc, tzOffset);
  timeStr.textContent = formatTime(nowUtc, tzOffset);

  // Temperature
  tempVal.textContent = tCurrent;

  // Icon & condition
  const iconCode = d.weather[0].icon;
  weatherIcon.textContent = ICON_MAP[iconCode] || "🌡";
  conditionText.textContent = d.weather[0].description;
  feelsLike.textContent = `Feels like ${tFeels}°C`;

  // Stats
  humidity.textContent  = `${d.main.humidity}%`;
  windSpeed.textContent = `${Math.round(d.wind.speed * 3.6)} km/h`;
  visibility.textContent = metersToKm(d.visibility);
  pressure.textContent  = `${d.main.pressure} hPa`;
  sunrise.textContent   = formatTime(d.sys.sunrise, tzOffset);
  sunset.textContent    = formatTime(d.sys.sunset, tzOffset);

  // High / Low bar
  tempMax.textContent = tHigh;
  tempMin.textContent = tLow;
  const barPct = calcBarWidth(tCurrent, tLow, tHigh);
  // Trigger CSS transition on next frame
  setTimeout(() => { tempBarFill.style.width = `${barPct}%`; }, 50);

  setState("data");
}

// ─── Error Display ────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  setState("error");
}

// ─── Event Listeners ──────────────────────────────────────────────
searchBtn.addEventListener("click", () => {
  fetchWeather(cityInput.value);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchWeather(cityInput.value);
});

// Clear error when user starts typing again
cityInput.addEventListener("input", () => {
  if (!errorBox.classList.contains("hidden")) {
    setState("empty");
  }
});

// ─── Init ─────────────────────────────────────────────────────────
setState("empty");
cityInput.focus();
