export type TileAddress = Readonly<{
  sourceId: string;
  z: number;
  x: number;
  y: number;
}>;

const SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const MAX_ZOOM = 24;

export function normalizeTileAddress(address: TileAddress): TileAddress {
  const { sourceId, z, x, y } = address;
  if (!SOURCE_ID_PATTERN.test(sourceId)) {
    throw new Error(`Invalid tile source id: ${sourceId}`);
  }
  if (![z, x, y].every(Number.isSafeInteger) || z < 0 || z > MAX_ZOOM) {
    throw new Error(`Invalid tile coordinate: ${z}/${x}/${y}`);
  }

  const dimension = 2 ** z;
  if (y < 0 || y >= dimension) {
    throw new Error(`Tile y is outside zoom ${z}: ${y}`);
  }

  return {
    sourceId,
    z,
    x: ((x % dimension) + dimension) % dimension,
    y,
  };
}

export function tileCacheKey(address: TileAddress): string {
  const normalized = normalizeTileAddress(address);
  return `${normalized.sourceId}:${normalized.z}/${normalized.x}/${normalized.y}`;
}

export function tileFileName(address: TileAddress): string {
  const normalized = normalizeTileAddress(address);
  return `${normalized.sourceId}-${normalized.z}-${normalized.x}-${normalized.y}.pbf`;
}
