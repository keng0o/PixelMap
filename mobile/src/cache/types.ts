import type { TileAddress } from './tileAddress';

export type TileCacheRecord = Readonly<{
  key: string;
  fileUri: string;
  byteLength: number;
  storedAt: number;
  lastAccessedAt: number;
}>;

export type StoredTile = Readonly<{
  record: TileCacheRecord;
  bytes: Uint8Array;
}>;

export type TileCacheStats = Readonly<{
  entryCount: number;
  totalBytes: number;
  maxBytes: number;
}>;

export type TileCacheLookup = Readonly<{
  address: TileAddress;
  bytes: Uint8Array;
  freshness: 'fresh' | 'stale';
  storedAt: number;
}>;

export type TileCachePutResult = Readonly<{
  stored: boolean;
  evictedKeys: readonly string[];
  reason?: 'tile-exceeds-cache-budget';
}>;

export interface TileCacheBackend {
  initialize(): Promise<void>;
  read(key: string): Promise<StoredTile | null>;
  write(key: string, fileName: string, bytes: Uint8Array, now: number): Promise<TileCacheRecord>;
  touch(key: string, now: number): Promise<void>;
  stats(): Promise<Omit<TileCacheStats, 'maxBytes'>>;
  oldest(limit: number, excludedKeys: ReadonlySet<string>): Promise<readonly TileCacheRecord[]>;
  remove(records: readonly TileCacheRecord[]): Promise<void>;
  clear(): Promise<void>;
}

export type TileCacheOptions = Readonly<{
  maxBytes: number;
  trimToBytes: number;
  maxAgeMs: number;
  touchIntervalMs: number;
  clock?: () => number;
}>;
