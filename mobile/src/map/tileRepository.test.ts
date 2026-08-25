import { describe, expect, it, vi } from 'vitest';

import { TileCache } from '../cache/tileCache';
import type { StoredTile, TileCacheBackend, TileCacheRecord } from '../cache/types';
import { TileRepository, type TileFetcher } from './tileRepository';

class RepositoryBackend implements TileCacheBackend {
  readonly records = new Map<string, StoredTile>();
  async initialize() {}
  async read(key: string) { return this.records.get(key) ?? null; }
  async write(key: string, fileName: string, bytes: Uint8Array, now: number) {
    const record = { key, fileUri: fileName, byteLength: bytes.byteLength, storedAt: now, lastAccessedAt: now };
    this.records.set(key, { record, bytes });
    return record;
  }
  async touch() {}
  async stats() {
    return {
      entryCount: this.records.size,
      totalBytes: [...this.records.values()].reduce((sum, item) => sum + item.record.byteLength, 0),
    };
  }
  async oldest() { return [] as TileCacheRecord[]; }
  async remove() {}
  async clear() { this.records.clear(); }
}

const address = { sourceId: 'test', z: 2, x: 5, y: 1 } as const;

function setup(now = 0, fetcher: TileFetcher = vi.fn<TileFetcher>()) {
  const backend = new RepositoryBackend();
  const cache = new TileCache(backend, {
    maxBytes: 1_000,
    trimToBytes: 800,
    maxAgeMs: 100,
    touchIntervalMs: 100,
    clock: () => now,
  });
  const repository = new TileRepository(cache, {
    tileUrlTemplate: 'https://tiles.example/{z}/{x}/{y}.pbf',
    fetcher,
  });
  return { backend, cache, repository };
}

describe('TileRepository', () => {
  it('returns a fresh disk tile without a network request', async () => {
    const fetcher = vi.fn<TileFetcher>();
    const { cache, repository } = setup(0, fetcher);
    await cache.put(address, new Uint8Array([1, 2]));
    const result = await repository.load(address);
    expect(result.source).toBe('disk-cache');
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.address.x).toBe(1);
  });

  it('fetches, validates, and stores a cache miss', async () => {
    const fetcher = vi.fn<TileFetcher>().mockResolvedValue(
      new Response(new Uint8Array([4, 5, 6]), { status: 200 }),
    );
    const { cache, repository } = setup(0, fetcher);
    const result = await repository.load(address);
    expect(result.source).toBe('network');
    expect(fetcher).toHaveBeenCalledWith('https://tiles.example/2/1/1.pbf', undefined);
    expect((await cache.get(address))?.bytes).toEqual(new Uint8Array([4, 5, 6]));
  });

  it('deduplicates simultaneous network requests for one tile', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetcher = vi.fn<TileFetcher>(() => new Promise((resolve) => { resolveResponse = resolve; }));
    const { repository } = setup(0, fetcher);
    const first = repository.load(address);
    const second = repository.load(address);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    resolveResponse?.(new Response(new Uint8Array([9]), { status: 200 }));
    expect(await first).toEqual(await second);
  });

  it.each([
    [new Response('no', { status: 503 }), 'HTTP 503'],
    [new Response(new Uint8Array(), { status: 200 }), 'empty'],
  ])('rejects invalid responses', async (response, message) => {
    const fetcher = vi.fn<TileFetcher>().mockResolvedValue(response);
    const { repository } = setup(0, fetcher);
    await expect(repository.load(address)).rejects.toThrow(message);
  });

  it('re-fetches a stale tile and forwards cancellation', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<TileFetcher>().mockResolvedValue(
      new Response(new Uint8Array([2]), { status: 200 }),
    );
    const backend = new RepositoryBackend();
    const cache = new TileCache(backend, {
      maxBytes: 1_000, trimToBytes: 800, maxAgeMs: 10, touchIntervalMs: 100,
      clock: () => 20,
    });
    backend.records.set('test:2/1/1', {
      record: { key: 'test:2/1/1', fileUri: 'old', byteLength: 1, storedAt: 0, lastAccessedAt: 0 },
      bytes: new Uint8Array([1]),
    });
    const repository = new TileRepository(cache, {
      tileUrlTemplate: 'https://tiles.example/{z}/{x}/{y}.pbf', fetcher,
    });
    await repository.load(address, controller.signal);
    expect(fetcher).toHaveBeenCalledWith('https://tiles.example/2/1/1.pbf', { signal: controller.signal });
  });

  it.each([
    ['a rejected request', new TypeError('Network request failed')],
    ['an unavailable response', new Response('unavailable', { status: 503 })],
    ['an empty response', new Response(new Uint8Array(), { status: 200 })],
  ])('falls back to a stale tile after %s', async (_case, failure) => {
    const fetcher = failure instanceof Response
      ? vi.fn<TileFetcher>().mockResolvedValue(failure)
      : vi.fn<TileFetcher>().mockRejectedValue(failure);
    const { backend, repository } = setup(200, fetcher);
    backend.records.set('test:2/1/1', {
      record: { key: 'test:2/1/1', fileUri: 'old', byteLength: 2, storedAt: 0, lastAccessedAt: 0 },
      bytes: new Uint8Array([7, 8]),
    });

    await expect(repository.load(address)).resolves.toMatchObject({
      bytes: new Uint8Array([7, 8]),
      source: 'stale-cache',
    });
  });

  it('does not hide an aborted stale refresh', async () => {
    const controller = new AbortController();
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const fetcher = vi.fn<TileFetcher>().mockRejectedValue(abortError);
    const { backend, repository } = setup(200, fetcher);
    backend.records.set('test:2/1/1', {
      record: { key: 'test:2/1/1', fileUri: 'old', byteLength: 1, storedAt: 0, lastAccessedAt: 0 },
      bytes: new Uint8Array([1]),
    });
    controller.abort();

    await expect(repository.load(address, controller.signal)).rejects.toBe(abortError);
  });

  it('still rejects a network failure when no cached tile exists', async () => {
    const failure = new TypeError('Network request failed');
    const fetcher = vi.fn<TileFetcher>().mockRejectedValue(failure);
    const { repository } = setup(200, fetcher);

    await expect(repository.load(address)).rejects.toBe(failure);
  });

  it('uses the platform fetch implementation by default', async () => {
    const platformFetch = vi.fn<TileFetcher>().mockResolvedValue(
      new Response(new Uint8Array([7]), { status: 200 }),
    );
    vi.stubGlobal('fetch', platformFetch);
    try {
      const { cache } = setup();
      const repository = new TileRepository(cache, {
        tileUrlTemplate: 'https://tiles.example/{z}/{x}/{y}.pbf',
      });
      await repository.load(address);
      expect(platformFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
