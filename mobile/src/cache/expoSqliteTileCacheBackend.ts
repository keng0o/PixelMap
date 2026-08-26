import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { StoredTile, TileCacheBackend, TileCacheRecord } from './types';

type CacheRow = Readonly<{
  cache_key: string;
  file_uri: string;
  byte_length: number;
  stored_at: number;
  last_accessed_at: number;
}>;

type StatsRow = Readonly<{
  entry_count: number;
  total_bytes: number;
}>;

const CACHE_DIRECTORY_NAME = 'pixelmap-tiles-v1';
const DATABASE_NAME = 'pixelmap-tile-cache-v1.db';

function recordFromRow(row: CacheRow): TileCacheRecord {
  return {
    key: row.cache_key,
    fileUri: row.file_uri,
    byteLength: row.byte_length,
    storedAt: row.stored_at,
    lastAccessedAt: row.last_accessed_at,
  };
}

export class ExpoSqliteTileCacheBackend implements TileCacheBackend {
  private readonly directory = new Directory(Paths.cache, CACHE_DIRECTORY_NAME);
  private database: SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.database) return;
    this.directory.create({ idempotent: true, intermediates: true });
    const database = await openDatabaseAsync(DATABASE_NAME);
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS tile_cache (
        cache_key TEXT PRIMARY KEY NOT NULL,
        file_uri TEXT NOT NULL UNIQUE,
        byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
        stored_at INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS tile_cache_lru
        ON tile_cache(last_accessed_at ASC, cache_key ASC);
    `);
    this.database = database;
    await this.reconcile();
  }

  async read(key: string): Promise<StoredTile | null> {
    const database = this.requireDatabase();
    const row = await database.getFirstAsync<CacheRow>(
      'SELECT cache_key, file_uri, byte_length, stored_at, last_accessed_at FROM tile_cache WHERE cache_key = ?',
      key,
    );
    if (!row) return null;

    const file = new File(row.file_uri);
    if (!file.exists) {
      await database.runAsync('DELETE FROM tile_cache WHERE cache_key = ?', key);
      return null;
    }
    try {
      const bytes = await file.bytes();
      if (bytes.byteLength !== row.byte_length) {
        file.delete();
        await database.runAsync('DELETE FROM tile_cache WHERE cache_key = ?', key);
        return null;
      }
      return { record: recordFromRow(row), bytes };
    } catch {
      await database.runAsync('DELETE FROM tile_cache WHERE cache_key = ?', key);
      return null;
    }
  }

  async write(
    key: string,
    fileName: string,
    bytes: Uint8Array,
    now: number,
  ): Promise<TileCacheRecord> {
    const database = this.requireDatabase();
    const destination = new File(this.directory, fileName);
    const temporary = new File(this.directory, `${fileName}.${now}.tmp`);
    temporary.create({ intermediates: true, overwrite: true });
    temporary.write(bytes);
    await temporary.move(destination, { overwrite: true });

    await database.runAsync(
      `INSERT INTO tile_cache(cache_key, file_uri, byte_length, stored_at, last_accessed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         file_uri = excluded.file_uri,
         byte_length = excluded.byte_length,
         stored_at = excluded.stored_at,
         last_accessed_at = excluded.last_accessed_at`,
      key,
      destination.uri,
      bytes.byteLength,
      now,
      now,
    );
    return {
      key,
      fileUri: destination.uri,
      byteLength: bytes.byteLength,
      storedAt: now,
      lastAccessedAt: now,
    };
  }

  async touch(key: string, now: number): Promise<void> {
    await this.requireDatabase().runAsync(
      'UPDATE tile_cache SET last_accessed_at = ? WHERE cache_key = ?',
      now,
      key,
    );
  }

  async stats(): Promise<{ entryCount: number; totalBytes: number }> {
    const row = await this.requireDatabase().getFirstAsync<StatsRow>(
      'SELECT COUNT(*) AS entry_count, COALESCE(SUM(byte_length), 0) AS total_bytes FROM tile_cache',
    );
    return {
      entryCount: row?.entry_count ?? 0,
      totalBytes: row?.total_bytes ?? 0,
    };
  }

  async oldest(limit: number, excludedKeys: ReadonlySet<string>): Promise<readonly TileCacheRecord[]> {
    const rows = await this.requireDatabase().getAllAsync<CacheRow>(
      `SELECT cache_key, file_uri, byte_length, stored_at, last_accessed_at
       FROM tile_cache ORDER BY last_accessed_at ASC, cache_key ASC LIMIT ?`,
      Math.max(limit + excludedKeys.size, limit),
    );
    return rows
      .filter((row) => !excludedKeys.has(row.cache_key))
      .slice(0, limit)
      .map(recordFromRow);
  }

  async remove(records: readonly TileCacheRecord[]): Promise<void> {
    if (records.length === 0) return;
    const database = this.requireDatabase();
    await database.withTransactionAsync(async () => {
      for (const record of records) {
        await database.runAsync('DELETE FROM tile_cache WHERE cache_key = ?', record.key);
      }
    });
    for (const record of records) {
      const file = new File(record.fileUri);
      if (file.exists) file.delete();
    }
  }

  async clear(): Promise<void> {
    const database = this.requireDatabase();
    await database.execAsync('DELETE FROM tile_cache');
    if (this.directory.exists) this.directory.delete();
    this.directory.create({ idempotent: true, intermediates: true });
  }

  private requireDatabase(): SQLiteDatabase {
    if (!this.database) throw new Error('Tile cache backend is not initialized');
    return this.database;
  }

  private async reconcile(): Promise<void> {
    const database = this.requireDatabase();
    const rows = await database.getAllAsync<CacheRow>(
      'SELECT cache_key, file_uri, byte_length, stored_at, last_accessed_at FROM tile_cache',
    );
    const indexedUris = new Set(rows.map((row) => row.file_uri));
    for (const row of rows) {
      if (!new File(row.file_uri).exists) {
        await database.runAsync('DELETE FROM tile_cache WHERE cache_key = ?', row.cache_key);
      }
    }
    for (const item of this.directory.list()) {
      if (!(item instanceof File)) continue;
      if (item.name.endsWith('.tmp') || (item.name.endsWith('.pbf') && !indexedUris.has(item.uri))) {
        item.delete();
      }
    }
  }
}
