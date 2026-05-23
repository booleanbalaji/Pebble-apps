import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";

const render = new Poco(screen, { rotation: 0 });

const W = render.width;
const H = render.height;

const BLACK = render.makeColor(0,   0,   0);
const WHITE = render.makeColor(255, 255, 255);
const GRAY  = render.makeColor(128, 128, 128);
const RED   = render.makeColor(220, 40,  40);

// System fonts available in the Pebble Alloy runtime
const timeFont = parseBMF(parseRLE(new Resource("Bitham-Bold-42.fnt")));
const dateFont = parseBMF(parseRLE(new Resource("Gothic-Bold-24.fnt")));
const infoFont = parseBMF(parseRLE(new Resource("Gothic-Regular-18.fnt")));

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let lastTime     = new Date();
let batteryLevel = watch.battery.level;
let connected    = watch.connected;

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(date) {
  return `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${pad(date.getDate())}`;
}

function draw(now) {
  render.begin(0, 0, W, H);
  render.fillRectangle(BLACK, 0, 0, W, H);

  // Battery % — top right
  const batStr = `${batteryLevel}%`;
  const batW   = render.getTextWidth(batStr, infoFont);
  render.drawText(batStr, infoFont, batteryLevel <= 20 ? RED : GRAY, W - batW - 6, 6);

  // Bluetooth indicator — top left, only when disconnected
  if (!connected) {
    render.drawText("BT", infoFont, RED, 6, 6);
  }

  // Vertically center time + date block
  const timeH    = timeFont.height;
  const dateH    = dateFont.height;
  const gap      = 6;
  const contentH = timeH + gap + dateH;
  let   y        = Math.round((H - contentH) / 2);

  // Time
  const timeStr = formatTime(now);
  const timeW   = render.getTextWidth(timeStr, timeFont);
  render.drawText(timeStr, timeFont, WHITE, Math.round((W - timeW) / 2), y);
  y += timeH + gap;

  // Date
  const dateStr = formatDate(now);
  const dateW   = render.getTextWidth(dateStr, dateFont);
  render.drawText(dateStr, dateFont, GRAY, Math.round((W - dateW) / 2), y);

  render.end();
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

// Boot
draw(lastTime);
