# Chart35 — Web Client

The public client codebase for [chart35.com](https://chart35.com), a privacy-focused fertility-cycle charting app for the Creighton Model FertilityCare™ System (CrMS).

This repository contains the **web/PWA client and the Capacitor Android wrapper**. The server-side sync and account API is intentionally kept in a private repository — see [Architecture](#architecture) below.

> **For a privacy-focused fertility app, having auditable client code matters.** Every line of code that touches your observations on your device — the end-to-end encryption, the IndexedDB storage, the chart rendering, the provider-share filtering — lives here, in the open.

## Features

- **Daily observations** — bleeding (H/M/L/VL/B), mucus stretch (0–10), mucus characteristics (C/K/L/P/G/B/Y), frequency, peak day marking, intercourse tracking, notes.
- **Auto-computed CrMS stamps** — green (dry/infertile), red (bleeding), white (fertile/mucus), yellow (infertile pattern / Base Infertile Pattern), with peak day (P) and post-peak count (1/2/3).
- **Chart view** — classic Creighton 35-column chart with cycle rows, stamps, and observation codes. Grows to fit longer cycles. Normal / Compact / Trend zoom levels.
- **Calendar view** — monthly grid with mini stamps and cycle boundaries.
- **Auto + manual cycle detection** — new cycle starts when bleeding resumes after non-bleeding days; manually mark a day as the first day of a new cycle.
- **Auto + manual peak day** — last day of peak-type mucus, with a toggle for manual override. Supports multiple peak days per cycle.
- **Manual Infertile Pattern (BIP) toggle** — mark days that match your stable baseline.
- **Export** — JSON backup and CSV chart export.
- **Optional account & sync** — sign in to back up data and access it across devices.
- **End-to-end encryption** — synced data is encrypted client-side with PBKDF2 + AES-256-GCM. The server stores encrypted blobs only; it never sees plaintext health data.
- **Provider sharing** — generate a time-limited read-only link for your FertilityCare Practitioner.
- **In-app account deletion** — wipes server-side data + local storage in one transaction.
- **Offline-capable** — full PWA with service worker; works without internet.
- **Installable** — Add to home screen (PWA) or install via the Android Capacitor wrapper.

## Architecture

This repository contains:

- **`src/`** — the TypeScript SPA (Vite + Dexie.js IndexedDB + Web Crypto API).
- **`public/`** — static assets including the privacy policy, support, and acknowledgments pages.
- **`android/`** — the Capacitor Android wrapper. Loads `https://chart35.com` in a native WebView.
- **`scripts/`** — dev utilities (e.g., headless screenshot capture).
- **`index.html`**, **`shared.html`** — SPA entry + read-only shared-chart entry.
- **`capacitor.config.ts`**, **`vite.config.ts`**, **`tsconfig.json`**, **`eslint.config.js`** — toolchain config.

The **sync server** (Node + Express + SQLite, JWT auth, transactional email, AES at-rest, server-side encryption layer on top of the client's E2E encryption) lives in a private repository and is not open-source. The client communicates with it only via HTTPS endpoints under `/api/*` documented in `src/services/`.

If you're auditing privacy claims:

- **`src/services/crypto-service.ts`** — PBKDF2 key derivation and AES-256-GCM encrypt/decrypt for E2E sync.
- **`src/services/sync-service.ts`** — what gets uploaded to the server (everything encrypted, except a small filtered "share" payload that strips the `notes` field).
- **`src/services/share-service.ts`** — provider-share-link management.
- **`src/utils/cookie-consent.ts`** — Google Analytics 4 is loaded **only after explicit opt-in** via the cookie banner. No analytics fire on first visit.

## Development

```bash
npm install
npm run dev         # Dev server with hot reload
npm run build       # Production build
npm run preview     # Preview production build
npm test            # Vitest
```

In development the dev server proxies `/api/*` to a local copy of the sync server. If you want to run the full stack locally you'll need to stand up a compatible API; otherwise the client functions fully offline and just won't allow sync.

## Capacitor / Android build

```bash
npm run build && npx cap sync android
cd android && ./gradlew bundleRelease    # signed AAB
cd android && ./gradlew assembleRelease  # signed APK
```

Signing config is read from an uncommitted `android/signing.properties` (see `android/app/build.gradle`).

## Tech Stack

- **Frontend:** Vanilla TypeScript, Vite, Dexie.js (IndexedDB), vite-plugin-pwa, Web Crypto API.
- **Android:** Capacitor 8.x, AGP 8.x, Kotlin/Java standard wrapper.
- **Hosting:** Apache reverse proxy with Let's Encrypt SSL (operated separately).

## Privacy

See [`chart35.com/privacy`](https://chart35.com/privacy) for the full policy. Short version: observations live on your device by default, and if you choose to sync they're end-to-end encrypted before they ever leave the device. The server can never read your health data; the in-app **Delete Account** button removes everything (server-side row, encrypted blobs, share-link tokens, on-device cache) in a single transaction.

## License

[GNU Affero General Public License v3.0](LICENSE).

The AGPL choice is deliberate: if you modify this codebase and run it as a network service, you must publish your modifications under the same license. This preserves the auditability of any deployed version of the app while preventing closed-source SaaS clones of the work.

The name "Chart35" / "Chart35" and the visual branding are reserved. The Creighton Model FertilityCare™ System is a trademark of FertilityCare Centers of America, used here descriptively only. This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute.

## Acknowledgments

The CrMS clinical instruction that informs every feature in this app traces back to a real FertilityCare Practitioner. See [chart35.com/acknowledgments](https://chart35.com/acknowledgments).

The codes and rules implemented here are sourced from *[The Creighton Model FertilityCare™ System: An Authentic Language of a Woman's Health and Fertility](https://openlibrary.org/isbn/9780962648540)*, Thomas W. Hilgers, M.D. (Pope Paul VI Institute Press; ISBN 978-0-9626485-4-0). It is the authoritative reference for CrMS and is highly recommended for anyone learning the method.

## Feedback

Bug reports, feature requests, and general feedback: **jacob@stephens.page**, or via **Settings → Send Feedback** in the app itself.
