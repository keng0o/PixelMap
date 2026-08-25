import { describe, expect, it } from 'vitest';

import { normalizeTileAddress, tileCacheKey, tileFileName, type TileAddress } from './tileAddress';
import { TileCache } from './tileCache';
import type { StoredTile, TileCacheBackend, TileCacheOptions, TileCacheRecord } from './types';

class MemoryBackend implements TileCacheBackend {
  readonly records = new Map<string, StoredTile>();
  initializeCalls = 0;
  touchCalls = 0;
  activeWrites = 0;
  maxActiveWrites = 0;
  writeDelayMs = 0;
  failNextWrite = false;

  async initialize() {
    this.initializeCalls += 1;
  }

  async read(key: string) {
    return this.records.get(key) ?? null;
  }

  async write(key: string, fileName: string, bytes: Uint8Array, now: number) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error('simulated write failure');
    }
    this.activeWrites += 1;
    this.maxActiveWrites = Math.max(this.maxActiveWrites, this.activeWrites);
    if (this.writeDelayMs) await new Promise((resolve) => setTimeout(resolve, this.writeDelayMs));
    const record: TileCacheRecord = {
      key,
      fileUri: `memory://${fileName}`,
      byteLength: bytes.byteLength,
      storedAt: now,
      lastAccessedAt: now,
    };
    this.records.set(key, { record, bytes });
    this.activeWrites -= 1;
    return record;
  }

  async touch(key: string, now: number) {
    this.touchCalls += 1;
    const stored = this.records.get(key);
    if (stored) {
      this.records.set(key, {
        ...stored,
        record: { ...stored.record, lastAccessedAt: now },
      });
    }
  }

  async stats() {
    return {
      entryCount: this.records.size,
      totalBytes: [...this.records.values()].reduce((sum, item) => sum + item.record.byteLength, 0),
    };
  }

  async oldest(limit: number, excludedKeys: ReadonlySet<string>) {
    return [...this.records.values()]
      .map((item) => item.record)
      .filter((record) => !excludedKeys.has(record.key))
      .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt || a.key.localeCompare(b.key))
      .slice(0, limit);
  }

  async remove(records: readonly TileCacheRecord[]) {
    for (const record of records) this.records.delete(record.key);
  }

  async clear() {
    this.records.clear();
  }
}

const tile = (x: number): TileAddress => ({ sourceId: 'test', z: 4, x, y: 3 });

function makeCache(
  backend: MemoryBackend,
  now: { value: number },
  options: Partial<Omit<TileCacheOptions, 'clock'>> = {},
) {
  return new TileCache(backend, {
    maxBytes: 10,
    trimToBytes: 8,
    maxAgeMs: 1_000,
    touchIntervalMs: 100,
    ...options,
    clock: () => now.value,
  });
}

describe('tile address', () => {
  it('wraps x coordinates and produces traversal-safe cache names', () => {
    expect(normalizeTileAddress(tile(-1))).toEqual({ sourceId: 'test', z: 4, x: 15, y: 3 });
    expect(tileCacheKey(tile(17))).toBe('test:4/1/3');
    expect(tileFileName(tile(17))).toBe('test-4-1-3.pbf');
  });

  it.each([
    { sourceId: '../bad', z: 4, x: 1, y: 1 },
    { sourceId: 'test', z: -1, x: 1, y: 1 },
    { sourceId: 'test', z: 25, x: 1, y: 1 },
    { sourceId: 'test', z: 4, x: 1.1, y: 1 },
    { sourceId: 'test', z: 4, x: 1, y: 16 },
  ])('rejects invalid addresses: $sourceId $z/$x/$y', (address) => {
    expect(() => normalizeTileAddress(address)).toThrow();
  });
});

describe('TileCache', () => {
  it('validates cache policy options', () => {
    const backend = new MemoryBackend();
    const base = { maxBytes: 10, trimToBytes: 8, maxAgeMs: 1, touchIntervalMs: 1 };
    expect(() => new TileCache(backend, { ...base, maxBytes: 0 })).toThrow('maxBytes');
    expect(() => new TileCache(backend, { ...base, trimToBytes: 11 })).toThrow('trimToBytes');
    expect(() => new TileCache(backend, { ...base, maxAgeMs: -1 })).toThrow('cannot be negative');
  });

  it('initializes once and reports misses and empty stats', async () => {
    const backend = new MemoryBackend();
    const cache = makeCache(backend, { value: 0 });
    await Promise.all([cache.initialize(), cache.initialize(), cache.get(tile(1))]);
    expect(backend.initializeCalls).toBe(1);
    expect(await cache.get(tile(1))).toBeNull();
    expect(await cache.stats()).toEqual({ entryCount: 0, totalBytes: 0, maxBytes: 10 });
  });

  it('stores bytes and marks entries fresh or stale by age', async () => {
    const now = { value: 10 };
    const cache = makeCache(new MemoryBackend(), now);
    await cache.put(tile(1), new Uint8Array([1, 2, 3]));
    expect(await cache.get(tile(1))).toMatchObject({ freshness: 'fresh', storedAt: 10 });
    now.value = 1_011;
    expect(await cache.get(tile(1))).toMatchObject({ freshness: 'stale', storedAt: 10 });
  });

  it('throttles persistent LRU touches', async () => {
    const now = { value: 0 };
    const backend = new MemoryBackend();
    const cache = makeCache(backend, now);
    await cache.put(tile(1), new Uint8Array([1]));
    now.value = 99;
    await cache.get(tile(1));
    expect(backend.touchCalls).toBe(0);
    now.value = 100;
    await cache.get(tile(1));
    await cache.get(tile(1));
    expect(backend.touchCalls).toBe(1);
  });

  it('evicts least-recently-used entries down to the trim target', async () => {
    const now = { value: 0 };
    const backend = new MemoryBackend();
    const cache = makeCache(backend, now);
    await cache.put(tile(1), new Uint8Array(4));
    now.value = 1;
    await cache.put(tile(2), new Uint8Array(4));
    now.value = 102;
    await cache.get(tile(1));
    now.value = 103;
    const result = await cache.put(tile(3), new Uint8Array(4));
    expect(result).toEqual({ stored: true, evictedKeys: ['test:4/2/3'] });
    expect(await cache.get(tile(1))).not.toBeNull();
    expect(await cache.get(tile(2))).toBeNull();
    expect(await cache.get(tile(3))).not.toBeNull();
    expect(await cache.stats()).toMatchObject({ entryCount: 2, totalBytes: 8 });
  });

  it('never stores a single tile larger than the full budget', async () => {
    const backend = new MemoryBackend();
    const cache = makeCache(backend, { value: 0 });
    expect(await cache.put(tile(1), new Uint8Array(11))).toEqual({
      stored: false,
      evictedKeys: [],
      reason: 'tile-exceeds-cache-budget',
    });
    expect(backend.records.size).toBe(0);
  });

  it('accounts for overwrite size without duplicate entries', async () => {
    const backend = new MemoryBackend();
    const cache = makeCache(backend, { value: 0 });
    await cache.put(tile(1), new Uint8Array(3));
    await cache.put(tile(1), new Uint8Array(7));
    expect(await cache.stats()).toMatchObject({ entryCount: 1, totalBytes: 7 });
  });

  it('serializes concurrent writes and can clear all entries', async () => {
    const backend = new MemoryBackend();
    backend.writeDelayMs = 5;
    const cache = makeCache(backend, { value: 0 }, { maxBytes: 100, trimToBytes: 80 });
    await Promise.all([
      cache.put(tile(1), new Uint8Array(3)),
      cache.put(tile(2), new Uint8Array(3)),
      cache.put(tile(3), new Uint8Array(3)),
    ]);
    expect(backend.maxActiveWrites).toBe(1);
    await cache.clear();
    expect(await cache.stats()).toMatchObject({ entryCount: 0, totalBytes: 0 });
  });

  it('keeps the mutation queue usable after a failed write', async () => {
    const backend = new MemoryBackend();
    backend.failNextWrite = true;
    const cache = makeCache(backend, { value: 0 });
    await expect(cache.put(tile(1), new Uint8Array(1))).rejects.toThrow('simulated write failure');
    await expect(cache.put(tile(2), new Uint8Array(1))).resolves.toMatchObject({ stored: true });
  });
});
