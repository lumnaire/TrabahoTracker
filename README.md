<p align="center">
  <img src="lumnaire_logo_no_bg.png" alt="TrabahoTracker logo" width="128">
</p>

<h1 align="center">TrabahoTracker</h1>

<p align="center">
  A fully offline desktop job-application tracker that keeps your job search on track.
  <br>
  <em>Track applications. Stay consistent. Get hired.</em>
</p>

<!--
<p align="center">
  <a href="https://github.com/lumnaire/TrabahoTracker/releases"><img alt="Release" src="https://img.shields.io/github/v/release/lumnaire/TrabahoTracker?style=flat-square"></a>
  <a href="https://github.com/lumnaire/TrabahoTracker/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/lumnaire/TrabahoTracker?style=flat-square"></a>
</p>
-->

<p align="center">
  <strong>Windows</strong> · <strong>macOS</strong> · <strong>Linux</strong>
</p>

---

## What is TrabahoTracker?

TrabahoTracker is a **local-first** desktop app for managing your job search. Log every application you send, track its status, chase down the ones nobody replied to, and keep yourself consistent with daily and weekly goals — all **without an account, internet connection, or anyone watching your data**.

Everything is stored on your machine in a single local database. No cloud, no telemetry, no sign-up.

## Features

- **5 statuses, one of them automatic** — `Pending`, `Processing`, `Approved`, `Rejected`, and `No Response`. A `Pending` application that gets no reply for **7 days** is automatically flagged as `No Response` (computed on the fly — your data is never silently mutated). Moving it back to `Pending` restarts the timer.
- **Status history timeline** — every status change is recorded with a note and timestamp, visible from any application's details view.
- **Dashboard** — a time-of-day greeting, six clickable stat cards, a weekly-goal card, a today-on-track card, a weekday tracker with streaks, a 14-day activity chart, status donut, weekly performance, response rate, and your most recent applications.
- **Track page** — search across company, email, position, contact, and notes; status filter chips with live counts; sorting (date, company, last update, or status); pagination.
- **Daily & weekly goals** — default `10 applications/day` and `50/week`, both adjustable. Weeks start on **Monday**; weekends count toward your weekly total but are excluded from the daily target and never break your streak.
- **Streaks** — a Duolingo-style consistency counter with a longest-streak record. Today isn't broken until it's over.
- **Analytics** — volume (today / this week / this month / all time), status distribution, response-rate metrics, a 30-day activity chart, 6-month monthly history, weekly activity table, and consistency stats. Weekly history is **never deleted**.
- **Desktop reminders** — gentle nudges for daily goal, weekly goal, and 7-day No Response follow-ups. At most once per day, per category.
- **Backup & restore** — one-click JSON export, two-phase import (preview before applying) with an automatic safety copy of your database, and a destructive-but-confirmed reset.
- **Customizable** — light / dark / system theme, display name, launch on startup, editable goals.
- **Private by design** — no network access, no analytics, no accounts. Sandboxed renderer with a strict context-isolated IPC surface.

## Screenshots

_(Add screenshots here — for example `docs/screenshots/dashboard.png`.)_

## Tech stack

| Layer     | Technology |
| --------- | ---------- |
| Desktop   | Electron 44 |
| UI        | React 19 + TypeScript + Tailwind CSS v4 |
| Charts    | Recharts |
| State     | Zustand |
| Storage   | SQLite via [sql.js](https://sql.js.org) (WebAssembly) |
| Icons     | lucide-react |
| Build     | electron-vite 5 + electron-builder |

Storage uses `sql.js` (SQLite compiled to WebAssembly) so there is **no native compilation step** — install and run anywhere Node can.

## Requirements

- **Node.js 20+** (developed on 24)
- npm 9+
- Electron downloads a prebuilt binary during `npm install`; an internet connection is needed **only** to install dependencies and build artifacts.

## Getting started

```bash
# 1. Clone and install
git clone https://github.com/lumnaire/TrabahoTracker.git
cd TrabahoTracker
npm install

# 2. Run in development (hot reload)
npm run dev
```

> Tip: First launch shows a Welcome screen. Use **Settings → Developer data → Load sample data** (dev builds only) to explore the app with ~20 realistic applications.

## Available scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite dev server and launch Electron with hot reload |
| `npm run build` | Build the production bundle into `out/` |
| `npm run start` | Preview the built app (`electron-vite preview`) |
| `npm run typecheck` | Type-check main, preload, and renderer (`tsc --noEmit`) |
| `npm run lint` | Alias for `typecheck` |
| `npm run test` | Run the shared-logic unit tests (Node's built-in test runner) |
| `npm run dist` | Build + package an installer for the current platform |
| `npm run dist:win` | Build + package a Windows NSIS installer |

### Where does my data live?

| Platform | Path |
| -------- | ---- |
| Windows (packaged) | `%APPDATA%\TrabahoTracker\trabahotracker.sqlite` |
| Linux / macOS | `~/.config/TrabahoTracker/` and `~/Library/Application Support/TrabahoTracker/` respectively |

Keep a recent **Export Backup** for peace of mind — backups are self-contained JSON files that can be re-imported after a reset or on another machine.

## Project structure

```
├── build/                 # Installer icon (build/icon.png)
├── electron-builder.yml   # Installer configuration
├── electron.vite.config.ts
├── src/
│   ├── shared/            # Types, date/status/goal logic (used by main, preload & renderer, unit-tested)
│   ├── main/              # Electron main process: DB, services, IPC handlers, notifications
│   ├── preload/           # contextBridge API (window.trabaho)
│   └── renderer/          # React UI: pages, components, zustand stores
└── tests/                 # Unit tests for shared logic (status, dates, goals)
```

## Contributing

Pull requests are welcome. For substantial changes, please open an issue first to discuss what you'd like to do.

- Run `npm run typecheck` and `npm run test` before submitting.
- Keep the codebase offline-first: **no new network calls** for app functionality, and no analytics/telemetry.
- New shared logic (status, dates, goals) should live in `src/shared/` with matching tests in `tests/`.

## License

[MIT](LICENSE)