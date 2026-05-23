# Pebble Duo 2 — Watchface Apps

## Device
**Pebble 2 Duo** (hardware codename: asterix) — 1.26" e-paper display, Nordic nRF52840, ~30-day battery, running PebbleOS.

## Framework
**Alloy** — Pebble's modern JavaScript SDK powered by Moddable/XS runtime (ES2025). Runs JS natively on the watch. Supersedes Rocky.js and the C SDK for new development.

- Developer docs: https://developer.repebble.com
- Tutorial reference: https://developer.repebble.com/tutorials/alloy-watchface-tutorial/part1/ (6 parts, GitHub: `coredevices/alloy-watchface-tutorial`)
- Alloy guide: https://developer.repebble.com/guides/alloy/

## Target Platforms
| Name    | Device           | Resolution | Display |
|---------|------------------|------------|---------|
| emery   | Pebble Time 2    | 200×228    | Color   |
| gabbro  | Pebble Round 2   | 260×260    | Color (round) |

Both targets are declared in each app's `package.json` under `pebble.targetPlatforms`.

## Project Structure
```
Pebble-apps/
├── CLAUDE.md
├── tutorial-watchface/          # Full 6-part tutorial implementation
│   ├── package.json
│   └── src/
│       ├── embeddedjs/
│       │   └── main.js          # Watch-side code (Alloy/Moddable JS)
│       └── pkjs/
│           ├── index.js         # Phone-side code (weather fetch + Clay)
│           └── config.js        # Clay settings UI definition
└── minimalist-digital/          # Clean no-weather watchface
    ├── package.json
    └── src/
        └── embeddedjs/
            └── main.js          # Watch-side code only (no pkjs needed)
```

## App Summary

### tutorial-watchface
UUID: `6F568DD0-C82A-4CC0-B2F4-494971E29C1E`

Features (implementing tutorial part 6 final state):
- Digital time + date with Jersey10 BMF fonts
- Color-coded battery bar at top (green >40%, yellow 21–40%, red ≤20%)
- Red "X" indicator when phone connection is lost
- Live weather from Open-Meteo API (no API key, location-based)
- 1-hour weather cache in `watch.localStorage`; 30-minute phone refresh
- Clay settings page: °C/°F toggle, bg/text colors, 12/24hr format, date visibility
- Dependencies: `@rebble/clay ^1.0.8`

### minimalist-digital
UUID: `E94239EA-BB4F-4B7C-B0F0-303C34687819`

Features:
- Large digital time (white, centered) using system Bitham-Bold font
- Date below in gray (Gothic-Bold)
- Battery % top-right, turns red at ≤20%
- "BT" top-left in red only when disconnected
- No weather, no dependencies, no pkjs companion

## Key Alloy APIs Used
```js
// Rendering
import Poco from "commodetto/Poco";
const render = new Poco(screen, { rotation: 0 });
render.begin(0, 0, W, H); /* draw calls */ render.end();
render.fillRectangle(color, x, y, w, h);
render.drawText(str, font, color, x, y);
render.getTextWidth(str, font);
render.makeColor(r, g, b);

// Fonts
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";
const font = parseBMF(parseRLE(new Resource("FontName.fnt")));

// Events
watch.addEventListener("minutechange", date => { ... });
watch.addEventListener("batterysampled", sample => { /* sample.level */ });
watch.addEventListener("connectedstatechange", state => { /* state.connected */ });
watch.addEventListener("hourchange", date => { ... });

// State
watch.battery.level   // 0–100
watch.connected       // boolean

// Phone ↔ Watch messaging
watch.postMessage({ type: "...", ... });   // pkjs → watch (or watch → pkjs)
watch.onmessage = msg => { ... };

// Persistent storage
watch.localStorage.setItem(key, value);
watch.localStorage.getItem(key);          // returns string or null

// Location (pkjs only)
watch.location.onchange = position => { /* position.latitude, position.longitude */ };
```

## package.json Shape
```json
{
  "name": "app-name",
  "version": "1.0.0",
  "private": true,
  "dependencies": { "@rebble/clay": "^1.0.8" },
  "pebble": {
    "displayName": "Display Name",
    "uuid": "<UUID>",
    "type": "moddable",
    "sdkVersion": 3,
    "multiJs": true,
    "targetPlatforms": ["emery", "gabbro"],
    "watchapp": { "watchface": true },
    "capabilities": ["location"],
    "messageKeys": ["KEY_ONE", "KEY_TWO"],
    "media": []
  }
}
```

## Build & Install
```sh
cd tutorial-watchface   # or minimalist-digital
pebble build
pebble install --emulator emery    # test on emulator
pebble install --emulator gabbro   # test round display
# sideload .pbw to physical watch via the Pebble app
```

## Notes
- Font resource names (`Jersey10-Regular-56.fnt`, `Bitham-Bold-42.fnt`, etc.) must match the exact names provided by your installed Alloy SDK. Check `pebble.sdkVersion` in package.json and the SDK docs if build fails on font resources.
- Alloy currently officially targets `emery` and `gabbro`. The Pebble 2 Duo (asterix) may require PebbleOS ≥ 4.9.127 to run Alloy apps; check release notes at https://developer.repebble.com/sdk/changelogs/4.9.127/
- Weather API: `https://api.open-meteo.com/v1/forecast` — free, no auth, WMO weather codes.
- Clay docs: https://developer.repebble.com/guides/tools-and-resources/app-configuration/
