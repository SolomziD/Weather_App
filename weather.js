/**
 * NIMBUS WEATHER APP — JavaScript
 * Vanilla ES6 modules, Fetch API, async/await
 */

// ─── WMO Weather Code Mappings ─────────────────────────────
const WMO = {
  0:  { desc: "Clear sky",             icon: "☀️",  theme: "clear-day" },
  1:  { desc: "Mainly clear",          icon: "🌤",  theme: "clear-day" },
  2:  { desc: "Partly cloudy",         icon: "⛅",  theme: "default"   },
  3:  { desc: "Overcast",              icon: "☁️",  theme: "default"   },
  45: { desc: "Foggy",                 icon: "🌫",  theme: "default"   },
  48: { desc: "Icy fog",               icon: "🌫",  theme: "default"   },
  51: { desc: "Light drizzle",         icon: "🌦",  theme: "default"   },
  53: { desc: "Moderate drizzle",      icon: "🌦",  theme: "default"   },
  55: { desc: "Heavy drizzle",         icon: "🌧",  theme: "default"   },
  61: { desc: "Light rain",            icon: "🌧",  theme: "default"   },
  63: { desc: "Moderate rain",         icon: "🌧",  theme: "default"   },
  65: { desc: "Heavy rain",            icon: "🌧",  theme: "default"   },
  71: { desc: "Light snow",            icon: "🌨",  theme: "default"   },
  73: { desc: "Moderate snow",         icon: "❄️",  theme: "default"   },
  75: { desc: "Heavy snow",            icon: "❄️",  theme: "default"   },
  77: { desc: "Snow grains",           icon: "🌨",  theme: "default"   },
  80: { desc: "Light showers",         icon: "🌦",  theme: "default"   },
  81: { desc: "Moderate showers",      icon: "🌧",  theme: "default"   },
  82: { desc: "Heavy showers",         icon: "⛈",  theme: "stormy"    },
  85: { desc: "Light snow showers",    icon: "🌨",  theme: "default"   },
  86: { desc: "Heavy snow showers",    icon: "❄️",  theme: "default"   },
  95: { desc: "Thunderstorm",          icon: "⛈",  theme: "stormy"    },
  96: { desc: "Thunderstorm w/ hail",  icon: "⛈",  theme: "stormy"    },
  99: { desc: "Thunderstorm w/ hail",  icon: "⛈",  theme: "stormy"    },
};

function wmo(code, isDay = true) {
  const entry = WMO[code] ?? { desc: "Unknown", icon: "🌡", theme: "default" };
  // Night override
  if (!isDay && (code === 0 || code === 1)) return { ...entry, icon: "🌙" };
  return entry;
}

// ─── Wind direction helper ─────────────────────
function windDirection(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── UV Index label ────────────────────────────
function uvLabel(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

// ─── Format time ───────────────────────────────
function fmtTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtHour(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr + ":00");
  const h = d.getHours();
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function fmtDay(isoDate, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

// ─── DOM helpers ──────────────────────────────
const $ = (id) => document.getElementById(id);
const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };

// ─── State ────────────────────────────────────
let state = {
  unit: "celsius",
  cityName: "",
  country: "",
  lat: null,
  lon: null,
  timezone: "auto",
  data: null,
};

// ─── UI panels ────────────────────────────────
function showPanel(name) {
  ["emptyState","loadingState","errorState","weatherDashboard"].forEach(id => {
    const el = $(id);
    if (!el) return;
    if (id === name) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });
}

function setError(msg) {
  setText("errorMsg", msg);
  showPanel("errorState");
}

// ─── Apply theme based on weather code ────────
function applyTheme(code, isDay) {
  const { theme } = wmo(code, isDay);
  document.body.className = isDay ? `theme-${theme}` : "theme-night";
}

// ─── Render current weather ───────────────────
function renderCurrent(data) {
  const c = data.current;
  const d0 = data.daily;
  const isDay = c.is_day === 1;
  const { desc, icon } = wmo(c.weather_code, isDay);
  const unitLabel = state.unit === "celsius" ? "°C" : "°F";
  const windUnit  = state.unit === "celsius" ? "km/h" : "mph";
  const pressUnit = "hPa";

  applyTheme(c.weather_code, isDay);

  setText("cityName", state.cityName || "Unknown");
  setText("locationSub", state.country || "");
  setText("lastUpdated", `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);

  setText("currentIcon", icon);
  setText("currentDesc", desc);
  setText("currentTemp", `${Math.round(c.temperature_2m)}${unitLabel}`);
  setText("feelsLike", `${Math.round(c.apparent_temperature)}${unitLabel}`);
  setText("humidity", `${c.relative_humidity_2m}%`);
  setText("wind", `${Math.round(c.wind_speed_10m)} ${windUnit} ${windDirection(c.wind_direction_10m)}`);
  setText("pressure", `${Math.round(c.surface_pressure)} ${pressUnit}`);

  const uv = c.uv_index ?? 0;
  setText("uvIndex", `${uv} (${uvLabel(uv)})`);

  // Sunrise / Sunset from daily[0]
  if (d0) {
    setText("sunrise", fmtTime(d0.sunrise?.[0]));
    setText("sunset",  fmtTime(d0.sunset?.[0]));
  }
}

// ─── Render hourly ────────────────────────────
function renderHourly(data) {
  const container = $("hourlyScroll");
  if (!container) return;
  container.innerHTML = "";

  const hourly = data.hourly;
  const times  = hourly.time;
  const now    = new Date();
  const unitLabel = state.unit === "celsius" ? "°C" : "°F";

  // Show next 24 hours from current
  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i] + ":00");
    if (t >= now) { startIdx = i; break; }
  }

  const end = Math.min(startIdx + 24, times.length);
  for (let i = startIdx; i < end; i++) {
    const isDay  = data.current.is_day === 1; // simplified
    const { icon } = wmo(hourly.weather_code[i], isDay);
    const rain   = hourly.precipitation_probability?.[i];
    const item   = document.createElement("div");
    item.className = "hourly-item" + (i === startIdx ? " current-hour" : "");
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="hourly-time">${i === startIdx ? "Now" : fmtHour(times[i])}</span>
      <span class="hourly-icon" aria-hidden="true">${icon}</span>
      <span class="hourly-temp">${Math.round(hourly.temperature_2m[i])}${unitLabel}</span>
      ${rain != null ? `<span class="hourly-rain">💧${rain}%</span>` : ""}
    `;
    container.appendChild(item);
  }
}

// ─── Render daily ─────────────────────────────
function renderDaily(data) {
  const container = $("dailyList");
  if (!container) return;
  container.innerHTML = "";

  const d = data.daily;
  const unitLabel = state.unit === "celsius" ? "°C" : "°F";

  // Find global min/max for bar scaling
  const allMax = d.temperature_2m_max;
  const allMin = d.temperature_2m_min;
  const gMax   = Math.max(...allMax);
  const gMin   = Math.min(...allMin);
  const range  = gMax - gMin || 1;

  for (let i = 0; i < d.time.length; i++) {
    const { icon } = wmo(d.weather_code[i], true);
    const max  = Math.round(d.temperature_2m_max[i]);
    const min  = Math.round(d.temperature_2m_min[i]);
    const rain = d.precipitation_probability_max?.[i];

    // Bar position
    const barLeft  = ((min - gMin) / range) * 100;
    const barWidth = ((max - min) / range) * 100;

    const item = document.createElement("div");
    item.className = "daily-item" + (i === 0 ? " today" : "");
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="daily-day">${fmtDay(d.time[i], i)}</span>
      <span class="daily-icon" aria-hidden="true">${icon}</span>
      <div class="daily-bar-wrap">
        <span class="daily-min">${min}${unitLabel}</span>
        <div class="daily-bar-track" role="presentation">
          <div class="daily-bar-fill" style="margin-left:${barLeft}%;width:${barWidth}%"></div>
        </div>
        <span class="daily-max">${max}${unitLabel}</span>
      </div>
      <span class="daily-rain">${rain != null ? `💧${rain}%` : ""}</span>
    `;
    container.appendChild(item);
  }
}

// ─── Fetch & render weather ───────────────────
async function loadWeather() {
  if (!state.lat || !state.lon) return;
  showPanel("loadingState");

  try {
    const params = new URLSearchParams({
      lat: state.lat,
      lon: state.lon,
      timezone: state.timezone,
      units: state.unit,
    });
    const res = await fetch(`/api/weather?${params}`);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const data = await res.json();
    state.data = data;

    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    showPanel("weatherDashboard");
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to load weather. Please try again.");
  }
}

// ─── Geocoding / search ───────────────────────
let searchDebounce = null;
let activeSuggestionIdx = -1;

async function fetchSuggestions(query) {
  if (!query.trim()) { hideSuggestions(); return; }
  try {
    const res  = await fetch(`/api/geocode?city=${encodeURIComponent(query)}`);
    if (!res.ok) { hideSuggestions(); return; }
    const data = await res.json();
    showSuggestions(data.results || []);
  } catch { hideSuggestions(); }
}

function showSuggestions(results) {
  const list  = $("suggestionsList");
  const input = $("searchInput");
  list.innerHTML = "";
  activeSuggestionIdx = -1;

  if (!results.length) { hideSuggestions(); return; }

  results.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.setAttribute("role", "option");
    li.setAttribute("id", `suggestion-${i}`);
    li.setAttribute("aria-selected", "false");

    const sub = [r.admin1, r.country].filter(Boolean).join(", ");
    li.innerHTML = `
      <span class="suggestion-flag" aria-hidden="true">${countryFlag(r.country_code)}</span>
      <div>
        <div class="suggestion-name">${r.name}</div>
        <div class="suggestion-sub">${sub}</div>
      </div>
    `;

    li.addEventListener("click", () => selectLocation(r));
    list.appendChild(li);
  });

  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  const list  = $("suggestionsList");
  const input = $("searchInput");
  list.hidden = true;
  list.innerHTML = "";
  input.setAttribute("aria-expanded", "false");
  activeSuggestionIdx = -1;
}

function selectLocation(r) {
  state.cityName = r.name;
  state.country  = [r.admin1, r.country].filter(Boolean).join(", ");
  state.lat      = r.latitude;
  state.lon      = r.longitude;
  state.timezone = r.timezone || "auto";

  $("searchInput").value = r.name;
  hideSuggestions();
  loadWeather();
}

// Country code → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1F1E0 + c.charCodeAt(0) - 65)
  );
}

// ─── Geolocation ─────────────────────────────
async function geolocate() {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by your browser.");
    return;
  }
  const btn = $("btnGeolocate");
  btn?.classList.add("loading");
  showPanel("loadingState");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      state.lat = pos.coords.latitude;
      state.lon = pos.coords.longitude;
      state.timezone = "auto";

      // Reverse-geocode via Open-Meteo nominatim-style shortcut
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${state.lat}&lon=${state.lon}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        state.cityName = data.address?.city
          || data.address?.town
          || data.address?.village
          || data.address?.county
          || "Current location";
        state.country = data.address?.country || "";
      } catch {
        state.cityName = "Current location";
        state.country  = "";
      }

      btn?.classList.remove("loading");
      $("searchInput").value = state.cityName;
      loadWeather();
    },
    (err) => {
      btn?.classList.remove("loading");
      setError("Location access denied. Please search for a city manually.");
    }
  );
}

// ─── Event Listeners ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // Search input — debounced suggestions
  const searchInput = $("searchInput");
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    const q = e.target.value.trim();
    if (q.length < 2) { hideSuggestions(); return; }
    searchDebounce = setTimeout(() => fetchSuggestions(q), 300);
  });

  // Search input — keyboard navigation
  searchInput?.addEventListener("keydown", (e) => {
    const list  = $("suggestionsList");
    const items = list.querySelectorAll(".suggestion-item");
    if (!items.length) {
      if (e.key === "Enter") {
        const q = searchInput.value.trim();
        if (q) fetchSuggestions(q);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIdx = Math.min(activeSuggestionIdx + 1, items.length - 1);
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionIdx = Math.max(activeSuggestionIdx - 1, 0);
      updateActiveItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIdx >= 0) items[activeSuggestionIdx]?.click();
      else fetchSuggestions(searchInput.value.trim());
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  function updateActiveItem(items) {
    items.forEach((el, i) => {
      const active = i === activeSuggestionIdx;
      el.setAttribute("aria-selected", String(active));
      if (active) el.scrollIntoView({ block: "nearest" });
    });
  }

  // Close suggestions on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) hideSuggestions();
  });

  // Search button
  $("searchBtn")?.addEventListener("click", () => {
    const q = $("searchInput").value.trim();
    if (q) fetchSuggestions(q);
  });

  // Geolocate buttons
  $("btnGeolocate")?.addEventListener("click", geolocate);
  $("ctaGeolocate")?.addEventListener("click", geolocate);

  // Retry
  $("retryBtn")?.addEventListener("click", loadWeather);

  // Unit toggle
  document.querySelectorAll(".unit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.unit === state.unit) return;
      state.unit = btn.dataset.unit;
      document.querySelectorAll(".unit-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.unit === state.unit);
        b.setAttribute("aria-pressed", String(b.dataset.unit === state.unit));
      });
      if (state.lat && state.lon) loadWeather();
    });
  });
});
