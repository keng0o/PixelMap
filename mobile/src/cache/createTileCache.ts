import { ExpoSqliteTileCacheBackend } from './expoSqliteTileCacheBackend';
import { TileCache } from './tileCache';

export const TILE_CACHE_MAX_BYTES = 64 * 1024 * 1024;
export const TILE_CACHE_TRIM_TO_BYTES = 48 * 1024 * 1024;
export const TILE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createTileCache(): TileCache {
  return new TileCache(new ExpoSqliteTileCacheBackend(), {
    maxBytes: TILE_CACHE_MAX_BYTES,
    trimToBytes: TILE_CACHE_TRIM_TO_BYTES,
    maxAgeMs: TILE_CACHE_MAX_AGE_MS,
    touchIntervalMs: 60_000,
  });
}
