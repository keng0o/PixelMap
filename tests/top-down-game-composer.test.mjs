import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');
await import('../assets/top-down-game-composer.js');

const COMPOSER = globalThis.PixelMapTopDownComposer;

const polygon = (layer, id, x, y, width, height, props = {}) => ({
  layer,
  id,
  type: 3,
  props,
  geometry: [[
    [x, y], [x + width, y], [x + width, y + height], [x, y + height], [x, y],
  ]],
});

const line = (id, points, className) => ({
  layer: 'transportation', id, type: 2, props: { class: className }, geometry: [points],
});

function denseFixture() {
  const buildings = [];
  let id = 1000;
  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      buildings.push(polygon('building', id, 18 + column * 48, 28 + row * 78, 20, 15, {
        class: row % 3 === 0 ? 'commercial' : 'residential',
      }));
      id += 1;
    }
  }

  const minorRoads = Array.from({ length: 20 }, (_, index) =>
    line(2000 + index, [[10, 35 + index * 36], [380, 52 + index * 36]],
      index % 2 ? 'residential' : 'service'));

  return [
    polygon('landcover', 1, 0, 0, 390, 844, { class: 'grass' }),
    polygon('water', 2, 0, 290, 76, 210, { class: 'river' }),
    line(3, [[25, 820], [175, 610], [245, 390], [342, 45]], 'secondary'),
    line(4, [[0, 430], [390, 410]], 'primary'),
    line(5, [[35, 0], [60, 844]], 'rail'),
    ...minorRoads,
    ...buildings,
  ];
}

const input = (features = denseFixture()) => ({
  width: 390,
  height: 844,
  viewport: { centerX: 195, centerY: 422, scale: 1 },
  features,
});

test('composerは厳しい箱庭構成契約を公開する', () => {
  assert.equal(COMPOSER.version, 'pixelmap-top-down-composer/1');
  assert.equal(COMPOSER.artPixelSize, 2);
  assert.equal(COMPOSER.maxMinorRoadRatio, 0.35);
  assert.equal(COMPOSER.maxRenderedHouses, 170);
  assert.deepEqual(COMPOSER.clusterRange, [8, 24]);
  assert.deepEqual(COMPOSER.landmarkRange, [1, 3]);
});

test('密集市街地は個別建物を集落へ圧縮し、目的地と旅人を一つの主経路で結ぶ', () => {
  const composition = COMPOSER.compose(input());
  assert.equal(composition.stats.sourceBuildingCount, 80);
  assert.ok(composition.stats.renderedHouseCount <= 170);
  assert.ok(composition.stats.renderedHouseCount < composition.stats.sourceBuildingCount);
  assert.ok(composition.stats.settlementClusterCount >= 8);
  assert.ok(composition.stats.settlementClusterCount <= 24);
  assert.ok(composition.stats.landmarkCount >= 1);
  assert.ok(composition.stats.landmarkCount <= 3);
  assert.equal(composition.stats.storyRouteCount, 1);
  assert.equal(composition.stats.travelerCount, 1);
  assert.ok(composition.stats.routeSpanY > 300);
  assert.ok(composition.stats.travelerX >= 28 && composition.stats.travelerX <= 362);
  assert.ok(composition.stats.travelerY >= 36 && composition.stats.travelerY <= 808);
  assert.ok(composition.stats.landmarkX >= 38 && composition.stats.landmarkX <= 338);
  assert.ok(composition.stats.landmarkY >= 36 && composition.stats.landmarkY <= 774);
  assert.ok(composition.storyRoute.paths.flat().length >= 2);
  assert.ok(Number.isFinite(composition.traveler.x));
  assert.ok(Number.isFinite(composition.traveler.y));
  assert.ok(composition.settlements.every(item => item.x % 2 === 0 && item.y % 2 === 0));
});

test('主要交通・鉄道・水域は全件残し、生活道路だけを35%以下へ整理する', () => {
  const composition = COMPOSER.compose(input());
  assert.equal(composition.stats.sourceMajorRoadCount, 3);
  assert.equal(composition.stats.retainedMajorRoadCount, 3);
  assert.equal(composition.stats.sourceWaterCount, 1);
  assert.equal(composition.stats.retainedWaterCount, 1);
  assert.equal(composition.stats.sourceMinorRoadCount, 20);
  assert.ok(composition.stats.retainedMinorRoadCount / composition.stats.sourceMinorRoadCount <= 0.35);
  assert.ok(composition.renderFeatures.some(feature => feature.id === composition.storyRoute.sourceId));
});

test('構図は入力順や再実行に依存せずworld位置へ固定される', () => {
  const features = denseFixture();
  const first = COMPOSER.compose(input(features));
  const second = COMPOSER.compose(input([...features].reverse()));
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(second.settlements, first.settlements);
  assert.deepEqual(second.landmarks, first.landmarks);
  assert.deepEqual(second.storyRoute, first.storyRoute);
  assert.deepEqual(second.traveler, first.traveler);
});

test('一つのMVT featureに複数棟と中庭ringがあっても外周棟ごとに数える', () => {
  const groupedBuilding = {
    layer: 'building', id: 900, type: 3, props: { class: 'residential' },
    geometry: [
      [[40, 80], [100, 80], [100, 140], [40, 140], [40, 80]],
      [[55, 95], [55, 120], [82, 120], [82, 95], [55, 95]],
      [[250, 480], [320, 480], [320, 540], [250, 540], [250, 480]],
      [[2000, 2000], [2060, 2000], [2060, 2060], [2000, 2060], [2000, 2000]],
    ],
  };
  const composition = COMPOSER.compose(input([
    line(901, [[35, 800], [120, 520], [210, 260], [300, 40]], 'secondary'),
    groupedBuilding,
  ]));
  assert.equal(composition.stats.sourceBuildingFeatureCount, 1);
  assert.equal(composition.stats.sourceBuildingCount, 2);
  assert.equal([...composition.settlements, ...composition.landmarks]
    .reduce((sum, cluster) => sum + cluster.memberCount, 0), 2);
});

test('主経路featureに離れた複数pathがあっても可視性の高い連結pathを一本だけ選ぶ', () => {
  const multiPathRoad = {
    layer: 'transportation', id: 910, type: 2, props: { class: 'secondary' },
    geometry: [
      [[30, 820], [150, 560], [240, 300], [330, 40]],
      [[20, 760], [90, 760]],
    ],
  };
  const composition = COMPOSER.compose(input([
    multiPathRoad,
    polygon('building', 911, 280, 50, 30, 22, { class: 'residential' }),
  ]));
  assert.equal(composition.storyRoute.paths.length, 1);
  assert.ok(composition.stats.routeSpanY > 600);
  assert.deepEqual(composition.storyRoute.paths[0][0], [30, 820]);
});
