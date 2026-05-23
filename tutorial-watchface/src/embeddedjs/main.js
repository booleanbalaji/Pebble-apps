import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";

const render = new Poco(screen, { rotation: 0 });

const W = render.width;
const H = render.height;

// Colors
const BLACK  = render.makeColor(0,   0,   0);
const WHITE  = render.makeColor(255, 255, 255);
const GREEN  = render.makeColor(0,   200, 0);
const YELLOW = render.makeColor(255, 200, 0);
const RED    = render.makeColor(255, 0,   0);

// Fonts — Jersey10 BMF fonts bundled by the Alloy SDK
const timeFont   = parseBMF(parseRLE(new Resource("Jersey10-Regular-56.fnt")));
const dateFont   = parseBMF(parseRLE(new Resource("Jersey10-Regular-24.fnt")));
const statusFont = parseBMF(parseRLE(new Resource("Gothic-Regular-18.fnt")));

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// User-configurable settings (persisted in localStorage)
let settings = {
  bgColor:    BLACK,
  textColor:  WHITE,
  showDate:   true,
  hourFormat: 12,
  tempUnit:   "C",
};

function loadSettings() {
  const raw = watch.localStorage.getItem("settings");
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (saved.bgColor   != null) settings.bgColor   = saved.bgColor;
      if (saved.textColor != null) settings.textColor = saved.textColor;
      if (saved.showDate  != null) settings.showDate  = saved.showDate;
      if (saved.hourFormat != null) settings.hourFormat = saved.hourFormat;
      if (saved.tempUnit  != null) settings.tempUnit  = saved.tempUnit;
    } catch (_) {}
  }
}

function saveSettings() {
  watch.localStorage.setItem("settings", JSON.stringify({
    bgColor:    settings.bgColor,
    textColor:  settings.textColor,
    showDate:   settings.showDate,
    hourFormat: settings.hourFormat,
    tempUnit:   settings.tempUnit,
  }));
}

// Weather cache
let weather     = null;
let weatherExp  = 0;

function loadWeatherCache() {
  const raw = watch.localStorage.getItem("weather");
  if (raw) {
    try {
      const cached = JSON.parse(raw);
      if (Date.now() < cached.expiry) weather = cached.data;
    } catch (_) {}
  }
}

function saveWeatherCache(data) {
  watch.localStorage.setItem("weather", JSON.stringify({
    data:   data,
    expiry: Date.now() + 60 * 60 * 1000,
  }));
}

// Runtime state
let lastTime     = new Date();
let connected    = watch.connected;
let batteryLevel = watch.battery.level;

function formatTime(date) {
  let h = date.getHours();
  const m = date.getMinutes();
  if (settings.hourFormat === 12) {
    h = h % 12 || 12;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDate(date) {
  const day   = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const d     = String(date.getDate()).padStart(2, "0");
  return `${day} ${month} ${d}`;
}

const BATTERY_BAR_H = 6;
const BATTERY_BAR_Y = 4;
const BATTERY_BAR_MARGIN = 4;

function draw(now) {
  render.begin(0, 0, W, H);

  // Background
  render.fillRectangle(settings.bgColor, 0, 0, W, H);

  // Battery bar
  const barW = Math.round((W - BATTERY_BAR_MARGIN * 2) * batteryLevel / 100);
  const barColor = batteryLevel > 40 ? GREEN : batteryLevel > 20 ? YELLOW : RED;
  render.fillRectangle(barColor, BATTERY_BAR_MARGIN, BATTERY_BAR_Y, barW, BATTERY_BAR_H);

  // Disconnected indicator
  if (!connected) {
    const xStr = "X";
    const xW = render.getTextWidth(xStr, statusFont);
    render.drawText(xStr, statusFont, RED, W - xW - BATTERY_BAR_MARGIN, BATTERY_BAR_Y);
  }

  // Calculate total content height for vertical centering
  const timeH = timeFont.height;
  const dateH = settings.showDate ? dateFont.height + 4 : 0;
  const weatH = weather ? statusFont.height + 4 : 0;
  const contentH = timeH + dateH + weatH;

  let y = Math.round((H - contentH) / 2);

  // Time
  const timeStr = formatTime(now);
  const timeW = render.getTextWidth(timeStr, timeFont);
  render.drawText(timeStr, timeFont, settings.textColor, Math.round((W - timeW) / 2), y);
  y += timeH + 4;

  // Date
  if (settings.showDate) {
    const dateStr = formatDate(now);
    const dateW = render.getTextWidth(dateStr, dateFont);
    render.drawText(dateStr, dateFont, settings.textColor, Math.round((W - dateW) / 2), y);
    y += dateFont.height + 4;
  }

  // Weather
  if (weather) {
    const wStr = `${weather.temp}°${settings.tempUnit} ${weather.desc}`;
    const wW = render.getTextWidth(wStr, statusFont);
    render.drawText(wStr, statusFont, settings.textColor, Math.round((W - wW) / 2), y);
  }

  render.end();
}

function requestWeather() {
  watch.postMessage({ type: "WEATHER_REQUEST", unit: settings.tempUnit });
  weatherExp = Date.now() + 30 * 60 * 1000;
}

// Events
watch.addEventListener("minutechange", date => {
  lastTime = date;
  draw(date);
});

watch.addEventListener("batterysampled", sample => {
  batteryLevel = sample.level;
  draw(lastTime);
});

watch.addEventListener("connectedstatechange", state => {
  connected = state.connected;
  draw(lastTime);
});

// Refresh weather every 30 minutes on the half-hour boundary
watch.addEventListener("hourchange", date => {
  lastTime = date;
  if (Date.now() >= weatherExp) requestWeather();
  draw(date);
});

// Receive messages from pkjs
watch.onmessage = msg => {
  if (msg.type === "WEATHER") {
    weather = { temp: msg.temp, desc: msg.desc };
    saveWeatherCache(weather);
    draw(lastTime);
  } else if (msg.type === "SETTINGS") {
    if (msg.bgColor    != null) settings.bgColor    = msg.bgColor;
    if (msg.textColor  != null) settings.textColor  = msg.textColor;
    if (msg.showDate   != null) settings.showDate   = msg.showDate;
    if (msg.hourFormat != null) settings.hourFormat = msg.hourFormat;
    if (msg.tempUnit   != null) {
      const unitChanged = settings.tempUnit !== msg.tempUnit;
      settings.tempUnit = msg.tempUnit;
      if (unitChanged) requestWeather();
    }
    saveSettings();
    draw(lastTime);
  }
};

// Boot
loadSettings();
loadWeatherCache();
draw(lastTime);
requestWeather();
