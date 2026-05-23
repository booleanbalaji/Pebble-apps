import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";
import Timer from "timer";

// Try to import accelerometer — gracefully absent on some builds
let Accelerometer;
try { Accelerometer = importNow("embedded:sensor/Accelerometer"); } catch (_) {}

const render = new Poco(screen, { rotation: 0 });
const W = render.width;
const H = render.height;

// Colors
const BLACK  = render.makeColor(0,   0,   0);
const WHITE  = render.makeColor(255, 255, 255);
const GRAY   = render.makeColor(140, 140, 140);
const GREEN  = render.makeColor(0,   210, 80);
const YELLOW = render.makeColor(240, 200, 0);
const RED    = render.makeColor(220, 40,  40);
const CYAN   = render.makeColor(80,  210, 255);

// Fonts
const fontSm = parseBMF(parseRLE(new Resource("Gothic-Regular-18.fnt")));
const fontMd = parseBMF(parseRLE(new Resource("Gothic-Bold-18.fnt")));
const fontHd = parseBMF(parseRLE(new Resource("Gothic-Bold-24.fnt")));

const ROW_H    = fontSm.height + 4;
const HDR_H    = fontHd.height + 6;
const MARGIN   = 6;
const DIVIDER_Y = HDR_H + 2;

// ─── Pages ───────────────────────────────────────────────────────────────────

const PAGES = ["SYSTEM", "MOTION", "INPUT"];
let page = 0;

// ─── Live state ──────────────────────────────────────────────────────────────

const startTime = Date.now();

const state = {
  // System
  battery:   watch.battery.level,
  connected: watch.connected,
  // Motion
  accelX: null, accelY: null, accelZ: null,
  accelOk: false,
  steps: null,
  // Input
  lastButton: "—",
  btnUp: false, btnSelect: false, btnDown: false, btnBack: false,
};

// ─── Accelerometer ────────────────────────────────────────────────────────────

let accel = null;
if (Accelerometer) {
  try {
    accel = new Accelerometer({ sampleCount: 1 });
    accel.onreading = function () {
      state.accelX = this.x;
      state.accelY = this.y;
      state.accelZ = this.z;
      state.accelOk = true;
    };
    accel.onerror = () => { state.accelOk = false; };
    accel.start();
  } catch (_) {
    accel = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n) { return String(Math.abs(n)).padStart(4, "0"); }
function sign(n) { return n >= 0 ? "+" : "-"; }

function formatAccel(v) {
  if (v === null) return "N/A";
  return `${sign(v)}${pad2(v)} mG`;
}

function formatUptime() {
  const ms = Date.now() - startTime;
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  const h  = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function timeStr() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function dateStr() {
  const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  return `${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawHeader(title) {
  // Background strip
  render.fillRectangle(CYAN, 0, 0, W, HDR_H);

  // Page title centered
  const tw = render.getTextWidth(title, fontHd);
  render.drawText(title, fontHd, BLACK, Math.round((W - tw) / 2), 3);

  // Nav arrows
  const arrowColor = BLACK;
  if (page > 0) render.drawText("◀", fontMd, arrowColor, MARGIN, 3);
  if (page < PAGES.length - 1) render.drawText("▶", fontMd, arrowColor, W - render.getTextWidth("▶", fontMd) - MARGIN, 3);

  // Page indicator
  const indicator = `${page + 1}/${PAGES.length}`;
  const iw = render.getTextWidth(indicator, fontSm);
  render.drawText(indicator, fontSm, arrowColor, Math.round((W - iw) / 2), HDR_H - fontSm.height - 2);

  // Divider
  render.fillRectangle(GRAY, 0, DIVIDER_Y, W, 1);
}

function drawRow(label, value, valueColor, y) {
  render.drawText(label, fontSm, GRAY, MARGIN, y);
  const vw = render.getTextWidth(value, fontSm);
  render.drawText(value, fontSm, valueColor, W - vw - MARGIN, y);
}

function drawDivider(y) {
  render.fillRectangle(render.makeColor(40, 40, 40), MARGIN, y + ROW_H / 2, W - MARGIN * 2, 1);
}

// Page 1: System
function drawSystem() {
  let y = DIVIDER_Y + 6;

  // Battery with inline bar
  const batStr = `${state.battery}%`;
  const batColor = state.battery > 40 ? GREEN : state.battery > 20 ? YELLOW : RED;
  render.drawText("Battery", fontSm, GRAY, MARGIN, y);
  // Bar
  const barX = MARGIN + render.getTextWidth("Battery  ", fontSm);
  const barW = W - barX - MARGIN - render.getTextWidth(" 100%", fontSm) - 4;
  const fillW = Math.round(barW * state.battery / 100);
  render.fillRectangle(render.makeColor(50, 50, 50), barX, y + 3, barW, fontSm.height - 6);
  render.fillRectangle(batColor, barX, y + 3, fillW, fontSm.height - 6);
  const bvw = render.getTextWidth(batStr, fontSm);
  render.drawText(batStr, fontSm, batColor, W - bvw - MARGIN, y);
  y += ROW_H;

  drawRow("Bluetooth", state.connected ? "Connected" : "Offline",
          state.connected ? GREEN : RED, y);
  y += ROW_H;

  drawDivider(y - ROW_H / 2);

  drawRow("Time", timeStr(), WHITE, y);
  y += ROW_H;

  drawRow("Date", dateStr(), WHITE, y);
  y += ROW_H;

  drawDivider(y - ROW_H / 2);

  drawRow("Uptime", formatUptime(), GRAY, y);
}

// Page 2: Motion
function drawMotion() {
  let y = DIVIDER_Y + 6;

  if (state.accelOk) {
    drawRow("Accel X", formatAccel(state.accelX), WHITE, y); y += ROW_H;
    drawRow("Accel Y", formatAccel(state.accelY), WHITE, y); y += ROW_H;
    drawRow("Accel Z", formatAccel(state.accelZ), WHITE, y); y += ROW_H;
  } else {
    const msg = "Accel: N/A";
    const mw = render.getTextWidth(msg, fontMd);
    render.drawText(msg, fontMd, GRAY, Math.round((W - mw) / 2), y + ROW_H);
    y += ROW_H * 3;
  }

  drawDivider(y);
  y += 6;

  const stepsVal = (state.steps !== null) ? String(state.steps) : "N/A";
  drawRow("Steps", stepsVal, CYAN, y);
}

// Page 3: Input
function drawInput() {
  let y = DIVIDER_Y + 6;

  const lastColor = state.lastButton === "—" ? GRAY : YELLOW;
  drawRow("Last btn", state.lastButton.toUpperCase(), lastColor, y); y += ROW_H;

  drawDivider(y);
  y += 6;

  function btnRow(label, pressed) {
    drawRow(label, pressed ? "PRESSED" : "released", pressed ? YELLOW : GRAY, y);
    y += ROW_H;
  }

  btnRow("Up",     state.btnUp);
  btnRow("Select", state.btnSelect);
  btnRow("Down",   state.btnDown);
  btnRow("Back",   state.btnBack);
}

// Main draw dispatcher
function draw() {
  render.begin(0, 0, W, H);
  render.fillRectangle(BLACK, 0, 0, W, H);

  drawHeader(PAGES[page]);

  if (page === 0) drawSystem();
  else if (page === 1) drawMotion();
  else drawInput();

  render.end();
}

// ─── Sensor event listeners ───────────────────────────────────────────────────

watch.addEventListener("batterysampled", s => {
  state.battery = s.level;
  if (page === 0) draw();
});

watch.addEventListener("connectedstatechange", s => {
  state.connected = s.connected;
  if (page === 0) draw();
});

// Buttons
watch.addEventListener("click", e => {
  const btn = e.button;
  state.lastButton = btn;

  // Clear all held state on any click
  state.btnUp = state.btnSelect = state.btnDown = state.btnBack = false;

  if (btn === "up") {
    if (page > 0) { page--; }
    else { state.btnUp = true; }
  } else if (btn === "down") {
    if (page < PAGES.length - 1) { page++; }
    else { state.btnDown = true; }
  } else if (btn === "select") {
    state.btnSelect = true;
  } else if (btn === "back") {
    state.btnBack = true;
  }

  draw();
});

watch.addEventListener("longclick", e => {
  state.lastButton = `long-${e.button}`;
  draw();
});

// Try to read step count from health API if available
function pollHealth() {
  try {
    if (watch.health) state.steps = watch.health.stepCount ?? null;
  } catch (_) {}
}

// 1-second refresh timer (keeps time, uptime, and accel live)
Timer.repeat(() => {
  pollHealth();
  draw();
}, 1000);

// ─── Boot ─────────────────────────────────────────────────────────────────────

pollHealth();
draw();
