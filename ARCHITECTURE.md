# Architecture

This document describes how the Chart35 web client is put together: the layers, the data model, the encryption and sync trust boundary, and the CrMS domain logic. It complements the high-level summary in the [README](README.md).

Chart35 is a privacy-focused fertility-cycle charting app for the Creighton Model FertilityCare System (CrMS). This repository is the **client** - the web/PWA SPA and the Capacitor Android wrapper. The sync server is a separate, private codebase; the boundary between them is described under [Sync and the trust boundary](#sync-and-the-trust-boundary).

## Design goals

- **Local-first.** Every feature works offline against on-device storage. The network is optional and only used for cross-device backup and provider sharing.
- **Auditable privacy.** Because this app handles sensitive health data, the entire client - the encryption, the IndexedDB layer, the chart rendering, the provider-share filtering - is open under AGPL so the privacy claims can be verified line by line.
- **Faithful to the method.** The auto-computed stamps and codes implement CrMS as defined in the authoritative reference, not an approximation.

## Repository layout

```
src/
├── db/            # Dexie (IndexedDB) database and TypeScript models
├── services/      # Stateful logic: auth, crypto, sync, sharing, cycles, observations, export, feedback
├── utils/         # Pure helpers: CrMS codes, stamp logic, dates, sample data, toasts, cookie consent
├── components/    # UI views (custom-element-style modules), one per screen/widget
└── styles/        # Global + per-surface CSS (chart, calendar, form, stamps)
index.html         # SPA entry
shared.html        # Read-only entry for provider-shared charts
android/           # Capacitor Android wrapper (native WebView over chart35.com)
public/            # Static pages (privacy, support, acknowledgments) and PWA assets
scripts/           # Dev utilities (e.g., headless screenshot capture)
```

The dependency direction is inward: `components` depend on `services`, `services` depend on `db` and `utils`, and `utils` depend on nothing in the app. That keeps the domain logic (`utils/stamp-logic.ts`, `utils/creighton-codes.ts`) testable in isolation - see `src/utils/__tests__`.

## Data model and local storage

`src/db/database.ts` defines a [Dexie](https://dexie.org/) (IndexedDB) database; `src/db/models.ts` holds the TypeScript types. IndexedDB is the source of truth on the device: observations, cycles, peak-day marks, and settings all live there, so the app is fully functional with no network and no account.

A daily **observation** captures the raw inputs of the method - bleeding level, mucus stretch and characteristics, frequency, intercourse, peak marking, and notes. Observations are grouped into **cycles**; a cycle boundary is detected automatically when bleeding resumes after non-bleeding days, and can also be set manually.

## CrMS domain logic

The clinical heart of the app is pure and lives in `utils/`, separate from storage and UI:

- **`utils/creighton-codes.ts`** - the vocabulary of the method: bleeding codes (H/M/L/VL/B), mucus stretch (0-10), mucus characteristics (C/K/L/P/G/B/Y), and the rules that map raw observations onto them.
- **`utils/stamp-logic.ts`** - computes the colored **stamp** for each day: green (dry/infertile), red (bleeding), white (fertile/mucus), and yellow (infertile pattern / Base Infertile Pattern), plus peak-day marking (P) and the post-peak count (1/2/3). It supports multiple peak days per cycle and a manual Base Infertile Pattern (BIP) toggle.

`services/cycle-service.ts` and `services/observation-service.ts` orchestrate these pure functions over stored data - detecting cycles, resolving the peak day (auto with manual override), and keeping derived state consistent as observations change.

Keeping this logic pure and unit-tested matters here: a wrong stamp is not a cosmetic bug, it is incorrect health information.

## Encryption and sync trust boundary

Sync is optional. When a user signs in, data is backed up and made available across devices - but the server is treated as untrusted with respect to health data.

- **`services/crypto-service.ts`** derives a key from the user's passphrase with **PBKDF2** and encrypts payloads with **AES-256-GCM** via the Web Crypto API, entirely on the device.
- **`services/sync-service.ts`** ships only ciphertext. The server stores encrypted blobs; it never receives plaintext observations.
- **`services/auth-service.ts`** handles sign-in, email verification, and password reset against the private API.

This is end-to-end encryption layered *under* whatever at-rest protection the server adds. The threat model: even a fully compromised server, or its database, yields only opaque ciphertext.

### Sync server (out of repo)

The sync server (Node + Express + SQLite, JWT auth, transactional email) is a separate private repository. The client talks to it only over HTTPS under `/api/*`, and the request/response contracts live in `src/services/`. In development, the Vite dev server proxies `/api/*` to a local copy of that server; without one, the client still runs fully offline and simply disables sync.

## Provider sharing

`services/share-service.ts` plus `shared.html` and `components/shared-chart-view.ts` implement a **time-limited, read-only** share link a user can hand to their FertilityCare Practitioner. The shared view is a separate entry point that renders a filtered, read-only chart - it does not load the full app or grant write access - and the link expires.

## UI layer

The interface is built from small, framework-free TypeScript view modules in `src/components/`, coordinated by `app-shell.ts`:

- **`chart-view.ts`** - the classic Creighton 35-column chart: cycle rows, stamps, and observation codes, growing to fit longer cycles, with Normal / Compact / Trend zoom levels.
- **`calendar-view.ts`** - a monthly grid with mini stamps and cycle boundaries.
- **`observation-form.ts`** / **`day-detail.ts`** - daily entry and inspection.
- **`settings-view.ts`**, **`system-guide-view.ts`**, and the static legal/policy views (privacy, terms, cookies, acknowledgments).

There is no UI framework dependency; views render to the DOM directly and read/write through the services layer. Styling is plain CSS split by surface in `src/styles/`.

## PWA and offline

The app is a full Progressive Web App via `vite-plugin-pwa`: a service worker caches the shell and assets so it works without a connection and can be installed to the home screen. Because storage is IndexedDB and logic is local, "offline" is the normal mode, not a degraded one.

## Android

`android/` is a [Capacitor](https://capacitorjs.com/) wrapper that hosts `https://chart35.com` in a native WebView, plus app-lifecycle hooks. Build:

```bash
npm run build && npx cap sync android
cd android && ./gradlew bundleRelease   # signed AAB
```

Signing comes from an uncommitted `android/signing.properties`.

## Build, test, and CI

- **Build:** Vite (`npm run dev`, `npm run build`, `npm run preview`).
- **Tests:** Vitest (`npm run test`), focused on the pure CrMS logic in `utils/`.
- **Lint:** ESLint + typescript-eslint (`npm run lint`).
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs install, test, build, and an advisory lint on every push.

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (no UI framework) |
| Build | Vite |
| Local storage | Dexie.js over IndexedDB |
| Encryption | Web Crypto API - PBKDF2 + AES-256-GCM |
| PWA | vite-plugin-pwa (service worker, installable) |
| Mobile | Capacitor 8.x (Android) |
| Tests | Vitest |
| License | AGPL-3.0 |

## Why AGPL

The AGPL is deliberate: anyone who modifies this client and runs it as a network service must publish their modifications under the same license. For a privacy app, that keeps every deployed version auditable and blocks closed-source SaaS clones of the work.
