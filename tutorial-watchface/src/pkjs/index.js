import Clay from "@rebble/clay";
import clayConfig from "./config";

const clay = new Clay(clayConfig);

// WMO weather code → short description
const WEATHER_CODES = {
  0:  "Clear",
  1:  "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime Fog",
  51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  85: "Snow Showers", 86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm+Hail", 99: "Thunderstorm+Hail",
};

function cToF(c) {
  return Math.round(c * 9 / 5 + 32);
}

function fetchWeather(lat, lon, unit) {
  const url = `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&temperature_unit=${unit === "F" ? "fahrenheit" : "celsius"}` +
    `&forecast_days=1`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const cw   = data.current_weather;
      const temp = Math.round(cw.temperature);
      const desc = WEATHER_CODES[cw.weathercode] ?? "Unknown";
      watch.postMessage({ type: "WEATHER", temp, desc });
    })
    .catch(() => {
      // Silently fail — cached data stays on watch
    });
}

let pendingUnit = "C";

// Receive requests from the watch
watch.onmessage = msg => {
  if (msg.type === "WEATHER_REQUEST") {
    pendingUnit = msg.unit ?? "C";
    watch.location.onchange = position => {
      fetchWeather(position.latitude, position.longitude, pendingUnit);
      watch.location.onchange = null;
    };
  }
};

// Forward Clay settings to the watch
clay.on(Clay.EVENTS.SETTINGS_RECEIVED, () => {
  const s = clay.getSettings();
  const bgRaw   = s.BG_COLOR?.value   ?? "000000";
  const txtRaw  = s.TEXT_COLOR?.value ?? "FFFFFF";

  function hexToRgb(hex) {
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }

  watch.postMessage({
    type:       "SETTINGS",
    bgColor:    hexToRgb(bgRaw),
    textColor:  hexToRgb(txtRaw),
    showDate:   s.SHOW_DATE?.value  ?? true,
    hourFormat: parseInt(s.HOUR_FORMAT?.value ?? "12", 10),
    tempUnit:   s.TEMPERATURE_UNIT?.value ?? "C",
  });
});
