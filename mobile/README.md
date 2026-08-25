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
