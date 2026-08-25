# PixelMap mobile

Expo/React Native implementation of the single 2px PixelMap.

## Commands

```sh
npm install
npm run check
npm run ios
npm run android
```

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
