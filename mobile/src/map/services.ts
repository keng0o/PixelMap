import { createTileCache } from '../cache/createTileCache';
import { TileRepository } from './tileRepository';

const OPENFREEMAP_TILE_URL =
  'https://tiles.openfreemap.org/planet/20260802_080001_pt/{z}/{x}/{y}.pbf';

export const tileCache = createTileCache();
export const tileRepository = new TileRepository(tileCache, {
  tileUrlTemplate: OPENFREEMAP_TILE_URL,
});
