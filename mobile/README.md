# PixelMap mobile

Expo SDK 54 / React Native 0.81 implementation of the single 2px PixelMap.

## Commands

```sh
npm install
npm run check
npm run start:qr
npm run ios
npm run android
```

`npm run start:qr` starts Metro on the local network and prints a fresh QR code for Expo Go. Keep that terminal running while scanning. The phone and development machine must be on the same network; use `npx expo start --tunnel` when LAN access is unavailable.

## Android APK

The `preview` EAS profile produces a signed, production-like APK that runs without a Metro development server.

```sh
npx eas-cli build --platform android --profile preview
```

After the cloud build completes, download the artifact from its EAS build page. Install it on a USB-connected device with `adb install path/to/pixelmap.apk`, or open the build URL directly on the Android device. The checked-in `.env.example` documents optional Sentry settings; monitoring and source-map upload stay disabled for this preview profile when no DSN is configured.

## Tile cache contract

- MVT tile bytes are stored under the Expo cache directory.
- SQLite stores byte size, creation time, and last-access time.
- The cache is capped at 64 MiB and trims to 48 MiB using least-recently-used order.
- Reads touch the persistent LRU clock at most once per minute per tile.
- Entries older than seven days are refreshed from the network. If that refresh fails, the stale tile remains visible and the UI reports degraded connectivity.
- Cancellation is never converted into a stale-cache success, and cache misses still surface the network error.
- A startup reconciliation removes missing rows, temporary files, and orphaned tile files.

## Layer settings contract

- The 62 detailed web controls are represented by six mobile renderer groups: nature, land use, transport, buildings, facilities, and labels.
- Preferences are versioned and persisted with `expo-sqlite/kv-store`.
- Invalid or future stored data falls back to the reviewed mobile defaults.

## POI selection contract

- A selected POI supplies a stable ID, localized name, category, coordinates, and data source to a presentation-only bottom sheet.
- The preview exposes three deterministic Kawasaki facilities as minimum 44-point-equivalent hit targets; the MVT renderer can replace that source without changing the sheet contract.

## Foreground location contract

- Location permission is requested only after the user taps the current-location control; the app does not request background access.
- Denied permission, disabled device services, and transient lookup failures each provide a Japanese recovery path.
- The real map renderer can consume the successful coordinate result to recenter without changing the permission state machine.

## Responsive layout contract

- Safe-area insets wrap the entire screen on every edge, while compact-height windows can scroll instead of clipping controls.
- Portrait phones use one column. Phone landscape and tablet widths use a centered two-column canvas with a height-limited square map.
- Window-size changes are derived from `useWindowDimensions`, so rotation and tablet split-view recalculate without stored orientation state.

## Typography contract

- UI text uses the Japanese-capable `DotGothic16` face from the Expo Google Fonts package, matching the web POC without a network font request.
- The font is embedded for standalone iOS/Android builds and also loaded from the bundled asset at runtime for Expo Go; a load error falls back to the platform font instead of blocking the map.
- DotGothic16 is distributed under the SIL Open Font License 1.1; the required notice is included in `assets/fonts/DotGothic16-OFL.txt`.

## Assistive technology contract

- Interactive map POIs expose button labels, selected state, hints, and 44-point-equivalent hit areas while decorative cells stay out of the accessibility tree.
- Layer and POI modals constrain screen-reader navigation, focus their primary heading when shown, support the iOS escape gesture, and retain Android hardware-back handling.
- Dynamic location outcomes are announced explicitly, switches expose checked state, and visual section labels do not create duplicate heading stops.

## Lifecycle refresh contract

- Returning from an inactive or background state reloads the visible tile so the map redraws from the latest cache state.
- A confirmed offline-to-online transition retries the tile load; the initial connectivity snapshot does not cause a duplicate startup request.
- Overlapping lifecycle events never start concurrent refreshes. They are coalesced into at most one sequential follow-up so a network recovery during an in-flight refresh is not lost.

## Observability contract

- Production builds enable Sentry only when `EXPO_PUBLIC_SENTRY_DSN` is present. With no DSN, the SDK is not loaded and Expo Go keeps running without a native-module dependency.
- Native/JavaScript crashes, sessions, app-start performance, and a custom visible-tile load span are captured without default PII, screenshots, view hierarchies, or failed-request contents.
- Root render failures show an accessible Japanese recovery screen instead of leaving a blank view. Retrying remounts the map subtree.
- Sentry source-map upload requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in the EAS build environment. Copy `.env.example` locally; never commit real credentials.
