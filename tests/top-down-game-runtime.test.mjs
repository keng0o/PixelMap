import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');
await import('../assets/top-down-game-renderer.js');
await import('../assets/top-down-game-map.js');

const MAP = globalThis.PixelMapTopDownMap;
const source = await readFile(new URL('../assets/top-down-game-map.js', import.meta.url), 'utf8');

const varint = value => {
  const bytes = [];
  let rest = value;
  do {
    let byte = rest & 0x7f;
    rest = Math.floor(rest / 128);
    if (rest) byte |= 0x80;
    bytes.push(byte);
  } while (rest);
  return bytes;
};
const messageField = (field, bytes) => [(field << 3) | 2, ...varint(bytes.length), ...bytes];
const stringField = (field, value) => messageField(field, [...new TextEncoder().encode(value)]);
const varintField = (field, value) => [(field << 3), ...varint(value)];

function tinyBuildingTile() {
  const value = stringField(1, 'residential');
  const geometry = [9, 0, 0, 26, 20, 0, 0, 20, 19, 0, 15];
  const feature = [
    ...varintField(1, 7),
    ...messageField(2, [0, 0]),
    ...varintField(3, 3),
    ...messageField(4, geometry),
  ];
  const layer = [
    ...stringField(1, 'building'),
    ...messageField(2, feature),
    ...stringField(3, 'class'),
    ...messageField(4, value),
    ...varintField(5, 4096),
    ...varintField(15, 2),
  ];
  return new Uint8Array(messageField(3, layer));
}

test('runtimeはz14・北上固定・必要layerだけの公開契約を持つ', () => {
  assert.equal(MAP.version, 'pixelmap-top-down-map/1');
  assert.equal(MAP.tileZoom, 14);
  assert.equal(MAP.defaultScale, 0.375);
  assert.equal(MAP.bearing, 0);
  assert.equal(MAP.bearingLocked, true);
  assert.deepEqual([...MAP.retainedLayers], [
    'landcover', 'landuse', 'park', 'water', 'waterway', 'transportation', 'building',
  ]);
});

test('MVTのlength-delimited layer・value・geometryを終端までdecodeする', () => {
  const layers = MAP.decodeTile(tinyBuildingTile());
  assert.equal(layers.building.extent, 4096);
  assert.equal(layers.building.features.length, 1);
  assert.deepEqual(layers.building.features[0], {
    id: 7,
    props: { class: 'residential' },
    type: 3,
    geom: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
  });
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

test('tileごとに再利用される同一IDは異なる地物として保ち、完全重複だけを除く', () => {
  const makeFeature = geometry => ({ layer: 'building', id: 1, type: 3, props: {}, geometry });
  const first = makeFeature([[[0, 0], [10, 0], [10, 10], [0, 0]]]);
  const second = makeFeature([[[100, 100], [110, 100], [110, 110], [100, 100]]]);
  const merged = MAP.mergeFeatures([[first], [second], [first]]);
  assert.equal(merged.length, 2);
  assert.ok(merged.some(feature => feature.geometry[0][0][0] === 0));
  assert.ok(merged.some(feature => feature.geometry[0][0][0] === 100));
});

test('rendererへ渡す地物はviewportと短いbufferへ限定する', () => {
  const inside = { layer: 'building', id: 1, type: 3, props: {}, geometry: [[[90, 90], [110, 90], [110, 110], [90, 90]]] };
  const buffered = { layer: 'building', id: 2, type: 3, props: {}, geometry: [[[150, 90], [170, 90], [170, 110], [150, 90]]] };
  const outside = { layer: 'building', id: 3, type: 3, props: {}, geometry: [[[300, 300], [320, 300], [320, 320], [300, 300]]] };
  const visible = MAP.featuresInViewport([inside, buffered, outside], {
    centerX: 100, centerY: 100, width: 100, height: 100, scale: 1, buffer: 20,
  });
  assert.deepEqual(visible.map(feature => feature.id), [1, 2]);
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

test('失敗tileだけをretryでき、成功済みcacheを維持する', async () => {
  let failing = true;
  let calls = 0;
  const store = MAP.createTileStore({
    fetchTile: async tile => {
      calls += 1;
      if (tile.worldX === 2 && failing) throw new Error('temporary');
      return [{ layer: 'building', id: tile.worldX }];
    },
  });
  store.setGeneration(1);
  const firstTile = { worldX: 1, requestX: 1, y: 3 };
  const failedTile = { worldX: 2, requestX: 2, y: 3 };
  await store.load(firstTile, 1);
  await assert.rejects(store.load(failedTile, 1), /temporary/);
  failing = false;
  await store.load(firstTile, 1);
  await store.load(failedTile, 1);
  assert.equal(calls, 3);
  assert.equal(store.cache.size, 2);
});
