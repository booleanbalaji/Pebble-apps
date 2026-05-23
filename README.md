# Pebble Duo 2 Apps

Watchface collection for the **Pebble 2 Duo** built with [Alloy](https://developer.repebble.com/guides/alloy/) — Pebble's modern JavaScript SDK powered by Moddable/XS.

---

## Apps

### Tutorial Watchface
> Follows the official 6-part Alloy watchface tutorial to completion.

- Digital time and date with Jersey10 bitmap fonts
- Battery bar with charge-level colour coding (green / yellow / red)
- Bluetooth disconnect indicator
- Live weather via [Open-Meteo](https://open-meteo.com/) (no API key required)
- 1-hour weather cache; refreshes every 30 minutes
- User settings via Clay: temperature unit, colours, 12/24-hour format, date toggle

### Minimalist Digital
> Clean, distraction-free watchface with no network calls.

- Large digital time centred on screen
- Date in muted grey below
- Battery percentage top-right (turns red at ≤ 20%)
- "BT" indicator top-left only when disconnected from phone

---

## Getting Started

**Prerequisites**
- [Pebble SDK](https://developer.repebble.com/sdk/) installed
- Node.js (for `npm install` in apps with dependencies)

**Build**
```sh
cd tutorial-watchface   # or minimalist-digital
npm install             # only needed for tutorial-watchface
pebble build
```

**Test on emulator**
```sh
pebble install --emulator emery    # Pebble Time 2  (200×228)
pebble install --emulator gabbro   # Pebble Round 2 (260×260)
```

**Install on device**
Sideload the compiled `.pbw` from the `build/` directory via the Pebble phone app.

---

## Project Structure

```
Pebble-apps/
├── tutorial-watchface/
│   ├── package.json
│   └── src/
│       ├── embeddedjs/main.js   # watch-side rendering + logic
│       └── pkjs/
│           ├── index.js         # phone-side weather fetch + Clay
│           └── config.js        # Clay settings UI
└── minimalist-digital/
    ├── package.json
    └── src/
        └── embeddedjs/main.js   # watch-side only
```

---

## Changelog

### 2026-05-23
**Initial release**
- Added `tutorial-watchface` — complete Alloy tutorial (parts 1–6) with weather, Clay settings, and localStorage caching
- Added `minimalist-digital` — no-dependency watchface with time, date, battery %, and BT indicator
- Added `CLAUDE.md` with full project context, API reference, and build notes
