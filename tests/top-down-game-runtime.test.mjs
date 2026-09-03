import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');
await import('../assets/top-down-game-renderer.js');
await import('../assets/top-down-game-map.js');

const MAP = globalThis.PixelMapTopDownMap;
const source = await readFile(new URL('../assets/top-down-game-map.js', import.meta.url), 'utf8');

test('runtimeはz14・北上固定・必要layerだけの公開契約を持つ', () => {
  assert.equal(MAP.version, 'pixelmap-top-down-map/1');
  assert.equal(MAP.tileZoom, 14);
  assert.equal(MAP.bearing, 0);
  assert.equal(MAP.bearingLocked, true);
  assert.deepEqual([...MAP.retainedLayers], [
    'landcover', 'landuse', 'park', 'water', 'waterway', 'transportation', 'building',
  ]);
});

test('緯度経度は連続world座標へ変換され、tile境界へ量子化されない', () => {
  const world = MAP.lonLatToWorld(139.702, 35.531);
  assert.ok(Number.isFinite(world.x) && Number.isFinite(world.y));
  assert.notEqual(world.x % MAP.worldTileExtent, 0);
  assert.notEqual(world.y % MAP.worldTileExtent, 0);
  const roundtrip = MAP.worldToLonLat(world.x, world.y);
  assert.ok(Math.abs(roundtrip.longitude - 139.702) < 1e-9);
  assert.ok(Math.abs(roundtrip.latitude - 35.531) < 1e-9);
});

test('viewportに必要なtileはbuffer込みで列挙し、xをwrapしてyを範囲内へ保つ', () => {
  const tiles = MAP.requiredTiles({
    centerX: MAP.worldTileExtent * (2 ** 14 - 0.05),
    centerY: MAP.worldTileExtent * 0.05,
    width: 900,
    height: 700,
    scale: MAP.defaultScale,
    buffer: 96,
  });
  assert.ok(tiles.length > 1);
  assert.ok(tiles.every(tile => tile.requestX >= 0 && tile.requestX < 2 ** 14));
  assert.ok(tiles.every(tile => tile.y >= 0 && tile.y < 2 ** 14));
  assert.ok(tiles.some(tile => tile.requestX === 0));
});

test('tile featureは4096 world単位へ正規化され、名称・POI layerを保持しない', () => {
  const layers = {
    building: { extent: 2048, features: [{ id: 7, type: 3, props: { class: 'residential', name: '非表示' }, geom: [[[0.5, 1.25], [10.5, 1.25]]] }] },
    place: { extent: 4096, features: [{ id: 8, type: 1, props: { name: '川崎' }, geom: [[[3, 4]]] }] },
    poi: { extent: 4096, features: [{ id: 9, type: 1, props: { class: 'shop' }, geom: [[[5, 6]]] }] },
  };
  const features = MAP.normalizeTileLayers(layers, 12, 34);
  assert.equal(features.length, 1);
  assert.equal(features[0].layer, 'building');
  assert.deepEqual(features[0].geometry[0][0], [12 * 4096 + 1, 34 * 4096 + 2.5]);
  assert.equal(features[0].props.name, undefined);
});

test('drag状態はpreview後にworld centerへ反映し、方位を変えない', () => {
  const initial = MAP.createNavigationState({ centerX: 1000, centerY: 2000, scale: 0.125 });
  const started = MAP.reduceNavigation(initial, { type: 'drag-start', pointerId: 4, x: 10, y: 20 });
  const preview = MAP.reduceNavigation(started, { type: 'drag-move', pointerId: 4, x: 42, y: 4 });
  assert.deepEqual(preview.preview, { x: 32, y: -16 });
  const ended = MAP.reduceNavigation(preview, { type: 'drag-end', pointerId: 4 });
  assert.equal(ended.centerX, 744);
  assert.equal(ended.centerY, 2128);
  assert.equal(ended.bearing, 0);
  assert.equal(ended.bearingLocked, true);
  assert.equal(ended.drag, null);
});

test('現在地errorは利用者向け状態へ分け、watchPositionやstorageを使わない', () => {
  assert.match(MAP.geolocationErrorMessage({ code: 1 }), /許可/);
  assert.match(MAP.geolocationErrorMessage({ code: 2 }), /見つけられません/);
  assert.match(MAP.geolocationErrorMessage({ code: 3 }), /タイムアウト/);
  assert.doesNotMatch(source, /watchPosition|localStorage|sessionStorage|Math\.random\s*\(/);
});

test('query中心は有効なlat/lonの組だけ受理し、bearing queryを受け付けない', () => {
  assert.deepEqual(MAP.parseInitialCoordinates('?lat=35.5&lon=139.7'), { latitude: 35.5, longitude: 139.7 });
  assert.equal(MAP.parseInitialCoordinates('?lat=91&lon=139.7'), null);
  assert.equal(MAP.parseInitialCoordinates('?lat=35.5'), null);
  assert.doesNotMatch(source, /get\(['"]bearing['"]\)/);
});

test('同じtile requestは共有され、generation更新後の古い完了をcacheへ混ぜない', async () => {
  let resolveFetch;
  let calls = 0;
  const fetchTile = () => {
    calls += 1;
    return new Promise(resolve => { resolveFetch = resolve; });
  };
  const store = MAP.createTileStore({ fetchTile });
  const first = store.load({ worldX: 9, requestX: 9, y: 10 }, 1);
  const duplicate = store.load({ worldX: 9, requestX: 9, y: 10 }, 1);
  assert.equal(calls, 1);
  store.setGeneration(2);
  resolveFetch([{ layer: 'building', id: 1 }]);
  assert.equal(await first, null);
  assert.equal(await duplicate, null);
  assert.equal(store.cache.size, 0);
});
