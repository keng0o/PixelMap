import { tileCacheKey, tileFileName, type TileAddress } from './tileAddress';
import type {
  TileCacheBackend,
  TileCacheLookup,
  TileCacheOptions,
  TileCachePutResult,
  TileCacheStats,
} from './types';

const DEFAULT_EVICTION_BATCH = 64;

export class TileCache {
  private readonly clock: () => number;
  private readonly lastTouches = new Map<string, number>();
  private initialization: Promise<void> | null = null;
  private mutationTail: Promise<void> = Promise.resolve();

  constructor(
    private readonly backend: TileCacheBackend,
    private readonly options: TileCacheOptions,
  ) {
    if (!Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0) {
      throw new Error('maxBytes must be a positive integer');
    }
    if (!Number.isSafeInteger(options.trimToBytes) || options.trimToBytes < 0 ||
        options.trimToBytes > options.maxBytes) {
      throw new Error('trimToBytes must be between 0 and maxBytes');
    }
    if (options.maxAgeMs < 0 || options.touchIntervalMs < 0) {
      throw new Error('Cache time options cannot be negative');
    }
    this.clock = options.clock ?? Date.now;
  }

  initialize(): Promise<void> {
    this.initialization ??= this.backend.initialize();
    return this.initialization;
  }

  async get(address: TileAddress): Promise<TileCacheLookup | null> {
    await this.initialize();
    const key = tileCacheKey(address);
    const stored = await this.backend.read(key);
    if (!stored) return null;

    const now = this.clock();
    const lastTouch = this.lastTouches.get(key) ?? stored.record.lastAccessedAt;
    if (now - lastTouch >= this.options.touchIntervalMs) {
      await this.mutate(async () => {
        await this.backend.touch(key, now);
        this.lastTouches.set(key, now);
      });
    }

    return {
      address,
      bytes: stored.bytes,
      freshness: now - stored.record.storedAt <= this.options.maxAgeMs ? 'fresh' : 'stale',
      storedAt: stored.record.storedAt,
    };
  }

  async put(address: TileAddress, bytes: Uint8Array): Promise<TileCachePutResult> {
    await this.initialize();
    const key = tileCacheKey(address);
    if (bytes.byteLength > this.options.maxBytes) {
      return { stored: false, evictedKeys: [], reason: 'tile-exceeds-cache-budget' };
    }

    return this.mutate(async () => {
      const now = this.clock();
      await this.backend.write(key, tileFileName(address), bytes, now);
      this.lastTouches.set(key, now);
      const evictedKeys = await this.trim(key);
      return { stored: true, evictedKeys };
    });
  }

  async stats(): Promise<TileCacheStats> {
    await this.initialize();
    const stats = await this.backend.stats();
    return { ...stats, maxBytes: this.options.maxBytes };
  }

  async clear(): Promise<void> {
    await this.initialize();
    await this.mutate(async () => {
      await this.backend.clear();
      this.lastTouches.clear();
    });
  }

  private async trim(protectedKey: string): Promise<readonly string[]> {
    let { totalBytes } = await this.backend.stats();
    if (totalBytes <= this.options.maxBytes) return [];

    const evicted: string[] = [];
    const excluded = new Set([protectedKey]);
    while (totalBytes > this.options.trimToBytes) {
      const candidates = await this.backend.oldest(DEFAULT_EVICTION_BATCH, excluded);
      if (candidates.length === 0) break;

      const victims = [];
      for (const candidate of candidates) {
        victims.push(candidate);
        totalBytes -= candidate.byteLength;
        if (totalBytes <= this.options.trimToBytes) break;
      }
      await this.backend.remove(victims);
      for (const victim of victims) {
        evicted.push(victim.key);
        this.lastTouches.delete(victim.key);
        excluded.add(victim.key);
      }
    }
    return evicted;
  }

  private mutate<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.mutationTail.then(operation, operation);
    this.mutationTail = result.then(() => undefined, () => undefined);
    return result;
  }
}
