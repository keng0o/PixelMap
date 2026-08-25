import { normalizeTileAddress, type TileAddress } from '../cache/tileAddress';
import type { TileCache } from '../cache/tileCache';

export type TileLoadResult = Readonly<{
  address: TileAddress;
  bytes: Uint8Array;
  source: 'disk-cache' | 'network' | 'stale-cache';
}>;

export type TileFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type TileRepositoryOptions = Readonly<{
  tileUrlTemplate: string;
  fetcher?: TileFetcher;
}>;

export class TileRepository {
  private readonly fetcher: TileFetcher;
  private readonly inFlight = new Map<string, Promise<TileLoadResult>>();

  constructor(
    private readonly cache: TileCache,
    private readonly options: TileRepositoryOptions,
  ) {
    this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init));
  }

  async load(address: TileAddress, signal?: AbortSignal): Promise<TileLoadResult> {
    const normalized = normalizeTileAddress(address);
    const key = `${normalized.sourceId}:${normalized.z}/${normalized.x}/${normalized.y}`;
    const cached = await this.cache.get(normalized);
    if (cached?.freshness === 'fresh') {
      return { address: normalized, bytes: cached.bytes, source: 'disk-cache' };
    }

    const existing = this.inFlight.get(key);
    if (existing) return existing;
    const request = this.fetchAndStore(normalized, cached, signal);
    this.inFlight.set(key, request);
    try {
      return await request;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async fetchAndStore(
    address: TileAddress,
    stale: Awaited<ReturnType<TileCache['get']>>,
    signal?: AbortSignal,
  ): Promise<TileLoadResult> {
    const url = this.options.tileUrlTemplate
      .replace('{z}', String(address.z))
      .replace('{x}', String(address.x))
      .replace('{y}', String(address.y));
    let bytes: Uint8Array;
    try {
      const response = await this.fetcher(url, signal ? { signal } : undefined);
      if (!response.ok) throw new Error(`Tile request failed with HTTP ${response.status}`);
      bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0) throw new Error('Tile response was empty');
    } catch (error) {
      if (stale?.freshness === 'stale' && !isAbort(error, signal)) {
        return { address, bytes: stale.bytes, source: 'stale-cache' };
      }
      throw error;
    }
    await this.cache.put(address, bytes);
    return { address, bytes, source: 'network' };
  }
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (error instanceof Error && error.name === 'AbortError');
}
