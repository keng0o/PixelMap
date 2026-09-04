import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');
await import('../assets/top-down-game-materials.js');
await import('../assets/top-down-game-renderer.js');

const RENDERER = globalThis.PixelMapTopDownRenderer;
const source = await readFile(new URL('../assets/top-down-game-renderer.js', import.meta.url), 'utf8');

const polygon = (layer, id, points, props = {}) => ({
  layer, id, type: 3, props, geometry: [[...points, points[0]]],
});
const line = (layer, id, points, props = {}) => ({ layer, id, type: 2, props, geometry: [points] });

const fixture = (overrides = {}) => ({
  width: 320,
  height: 240,
  viewport: { centerX: 160, centerY: 120, scale: 1 },
  features: overrides.features || [
    polygon('landcover', 1, [[0, 0], [320, 0], [320, 240], [0, 240]], { class: 'forest' }),
    polygon('water', 2, [[0, 0], [82, 0], [82, 240], [0, 240]], { class: 'river' }),
    line('transportation', 3, [[20.25, 130.5], [300.75, 112.25]], { class: 'primary' }),
    line('transportation', 4, [[130.125, 0.25], [132.875, 240.75]], { class: 'path' }),
    polygon('building', 5, [[166.2, 82.4], [236.8, 82.4], [236.8, 126.6], [166.2, 126.6]], { class: 'commercial' }),
    polygon('building', 6, [[248.5, 150.25], [285.75, 150.25], [285.75, 180.8], [248.5, 180.8]], { class: 'residential' }),
  ],
  ...overrides,
});

test('rendererは固定compositorとDOM非依存のscene APIを公開する', () => {
  assert.equal(RENDERER.version, 'pixelmap-top-down-renderer/10');
  assert.deepEqual(RENDERER.compositor, [
    'ground', 'landcover', 'water', 'transport', 'bridge',
    'vegetation', 'building-shadow', 'building-roof', 'location',
  ]);
  const scene = RENDERER.buildScene(fixture());
  assert.ok(scene.commands.length > 0);
  const ranks = scene.commands.map(command => RENDERER.compositor.indexOf(command.layer));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test('水・道路・地表は複数patternと参考画像1寄りの色を使う', () => {
  const scene = RENDERER.buildScene(fixture());
  assert.ok(scene.commands.some(command => command.layer === 'water' && command.fill === '#63c4c3'));
  assert.ok(scene.commands.some(command => command.layer === 'transport' && command.stroke === '#ead9ac'));
  assert.ok(scene.commands.some(command => command.layer === 'landcover'));
  assert.ok(scene.stats.patternFamilies.water >= 1);
  assert.ok(scene.stats.patternFamilies.road >= 2);
  assert.ok(scene.stats.patternFamilies.ground >= 1);
});

test('地表の色むらと道路・水際・建物の二重手描き輪郭を描画命令に持つ', () => {
  const scene = RENDERER.buildScene(fixture());
  assert.ok(scene.commands.some(command => command.kind === 'ground-wash' && command.worldAnchored === true));
  assert.ok(scene.commands.some(command => command.kind === 'area-wash' && command.worldAnchored === true));
  assert.ok(scene.commands.some(command => command.kind === 'area-fill' && command.roughOutline === true));
  assert.ok(scene.commands.some(command => command.kind === 'water-fill' && command.roughOutline === true));
  assert.ok(scene.commands.some(command => command.kind === 'road-edge' && command.roughOutline === true));
  assert.ok(scene.commands.some(command => command.kind === 'roof-fill' && command.roughOutline === true));
  assert.ok(scene.commands.filter(command => command.roughOutline)
    .every(command => command.roughMode === 'jittered-contour'));
});

test('樹木は道路・建物回避を維持した多層の凹凸樹冠として描く', () => {
  const trees = RENDERER.buildScene(fixture()).commands.filter(command => command.kind === 'tree');
  assert.ok(trees.length > 5);
  assert.ok(trees.every(command => command.crownPrimitive === 'scalloped-layered-crown'));
  assert.ok(trees.every(command => command.handDrawn === true));
  assert.ok(trees.every(command => command.crownLayers === 3));
});

test('参考画像から再構成した建物・樹冠素材を対応patternへ接続する', () => {
  const patterns = globalThis.PixelMapTopDownPatterns.catalogs;
  assert.equal(patterns.roof.find(pattern => pattern.id === 'building-cottage-gable').referenceAsset,
    'building-blue-gable-01');
  assert.equal(patterns.tree.find(pattern => pattern.id === 'tree-light-crown').referenceAsset,
    'tree-round-crown-01');
  assert.equal(patterns.roof.find(pattern => pattern.id === 'building-hipped').referenceAsset,
    'building-blue-hipped-02');
  assert.equal(patterns.tree.find(pattern => pattern.id === 'tree-small').referenceAsset,
    'tree-small-crown-02');
  assert.equal(patterns.roof.find(pattern => pattern.id === 'building-longhouse').referenceAsset,
    'building-blue-longhouse-03');
  assert.equal(patterns.tree.find(pattern => pattern.id === 'tree-dark-crown').referenceAsset,
    'tree-dark-crown-03');
  assert.equal(patterns.roof.find(pattern => pattern.id === 'building-flat-workshop').referenceAsset,
    'building-harbor-workshop-04');
  assert.equal(patterns.tree.find(pattern => pattern.id === 'tree-multi-crown').referenceAsset,
    'tree-multi-crown-04');
  assert.equal(patterns.roof.find(pattern => pattern.id === 'building-weathered-gable').referenceAsset,
    'building-blue-weathered-05');
  assert.equal(patterns.tree.find(pattern => pattern.id === 'tree-underbrush').referenceAsset,
    'tree-underbrush-cluster-05');
  assert.match(source, /paintRoofInFrame\(ctx, 'building-blue-gable-01'/);
  assert.match(source, /paintTreeAt\(ctx, 'tree-round-crown-01'/);
  assert.match(source, /paintRoofInFrame\(ctx, 'building-blue-hipped-02'/);
  assert.match(source, /paintTreeAt\(ctx, 'tree-small-crown-02'/);
  assert.match(source, /paintRoofInFrame\(ctx, 'building-blue-longhouse-03'/);
  assert.match(source, /paintTreeAt\(ctx, 'tree-dark-crown-03'/);
  assert.match(source, /paintRoofInFrame\(ctx, 'building-harbor-workshop-04'/);
  assert.match(source, /paintTreeAt\(ctx, 'tree-multi-crown-04'/);
  assert.match(source, /paintRoofInFrame\(ctx, 'building-blue-weathered-05'/);
  assert.match(source, /paintTreeAt\(ctx, 'tree-underbrush-cluster-05'/);
});

test('参考画像から再構成した砂地道路と外海水面を実地理のpath・polygonへ接続する', () => {
  const scene = RENDERER.buildScene(fixture({ features: [
    polygon('water', 20, [[0, 0], [110, 0], [110, 240], [0, 240]], { class: 'ocean' }),
    line('transportation', 30, [[20.25, 130.5], [300.75, 112.25]], { class: 'residential' }),
  ] }));
  const road = scene.commands.find(command => command.sourceId === 30 && command.kind === 'road-texture');
  const water = scene.commands.find(command => command.sourceId === 20 && command.kind === 'water-ripples');
  assert.equal(road.referenceAsset, 'road-sandy-local-06');
  assert.equal(road.worldAnchored, true);
  assert.ok(Array.isArray(road.textureOrigin));
  assert.equal(water.referenceAsset, 'water-open-ripples-06');
  assert.equal(water.worldAnchored, true);
  assert.equal(water.sparseMotif, true);
  assert.deepEqual(water.motifSpacing, [96, 88]);
  assert.ok(Array.isArray(water.textureOrigin));
  const waterFill = scene.commands.find(command => command.sourceId === 20 && command.kind === 'water-fill');
  assert.equal(waterFill.roughOutline, false);
  assert.equal(waterFill.stroke, null);
  assert.equal(scene.commands.some(command => command.sourceId === 20 && command.kind === 'water-shore'), false);
  assert.match(source, /function paintReferenceRoadTexture/);
  assert.match(source, /function paintRoadSurfaceTexture/);
  assert.match(source, /function paintReferenceWaterMaterial/);
});

test('全道路textureは中央dashではなく道路幅内の不規則な擦れと端寄り粒としてworld固定する', () => {
  const commands = RENDERER.buildScene(fixture()).commands.filter(command => command.kind === 'road-texture');
  assert.ok(commands.length >= 2);
  assert.ok(commands.every(command => command.worldAnchored === true));
  assert.ok(commands.every(command => command.roadWidth > 0));
  assert.doesNotMatch(source, /\['road-edge', 'road-fill', 'road-texture'/);
  assert.match(source, /paintRoadSurfaceTexture\(ctx, command/);
});

test('参考屋根素材は原寸比1.65倍以内だけへ適用し大型実建物を過度に引き伸ばさない', () => {
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 28, halfV: 20 }, 'building-blue-hipped-02'), true);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 48, halfV: 34 }, 'building-blue-hipped-02'), false);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 23, halfV: 17 }, 'building-blue-longhouse-03'), true);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 48, halfV: 34 }, 'building-blue-longhouse-03'), false);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 28, halfV: 31 }, 'building-harbor-workshop-04'), true);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 56, halfV: 48 }, 'building-harbor-workshop-04'), false);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 20, halfV: 17 }, 'building-blue-weathered-05'), true);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 38, halfV: 28 }, 'building-blue-weathered-05'), false);
  assert.equal(RENDERER.shouldUseReferenceRoof({ halfU: 28, halfV: 20 }, 'missing-asset'), false);
});

test('港湾タンク屋根は工業・倉庫系の小中規模かつ原寸比を保てる建物だけへ適用する', () => {
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 10, halfV: 9 }, 'industrial'), true);
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 10, halfV: 9 }, 'warehouse'), true);
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 10, halfV: 9 }, 'residential'), false);
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 10, halfV: 5 }, 'industrial'), false);
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 26, halfV: 20 }, 'industrial'), false);
  assert.equal(RENDERER.shouldUseHarborWorkshop({ halfU: 20, halfV: 7 }, 'industrial'), false);
});

test('傷んだ青屋根は小中規模かつ原寸の縦横比を保てる建物だけへ適用する', () => {
  assert.equal(RENDERER.shouldUseWeatheredGable({ halfU: 20, halfV: 17 }), true);
  assert.equal(RENDERER.shouldUseWeatheredGable({ halfU: 4, halfV: 3 }), false);
  assert.equal(RENDERER.shouldUseWeatheredGable({ halfU: 30, halfV: 16 }), false);
  assert.equal(RENDERER.shouldUseWeatheredGable({ halfU: 24, halfV: 8 }), false);
});

test('平屋根detailは建物種別を保持し住宅では港湾タンク素材を無効化する', () => {
  const buildings = [];
  for (let index = 0; index < 160; index += 1) {
    const x = 5 + (index % 20) * 28;
    const y = 5 + Math.floor(index / 20) * 26;
    buildings.push(polygon('building', 5000 + index, [[x, y], [x + 20, y], [x + 20, y + 18], [x, y + 18]], {
      class: index % 2 ? 'industrial' : 'residential',
    }));
  }
  const scene = RENDERER.buildScene({
    width: 600, height: 260, viewport: { centerX: 300, centerY: 130, scale: 1 }, features: buildings,
  });
  const workshops = scene.commands.filter(command => command.kind === 'roof-detail' &&
    command.patternId === 'building-flat-workshop');
  assert.ok(workshops.some(command => command.buildingUsage === 'industrial' && command.referenceDetailEligible));
  assert.ok(workshops.some(command => command.buildingUsage === 'residential' && !command.referenceDetailEligible));
});

test('建物は実polygonの屋根・手描きpixel細部・短い影だけで壁面と高さ押し出しを持たない', () => {
  const scene = RENDERER.buildScene(fixture());
  const roofs = scene.commands.filter(command => command.layer === 'building-roof');
  assert.ok(roofs.length >= 4);
  assert.ok(roofs.some(command => command.kind === 'roof-fill'));
  assert.ok(roofs.some(command => command.kind === 'roof-detail'));
  assert.ok(roofs.some(command => command.kind === 'roof-outline-rough'));
  assert.ok(roofs.filter(command => command.kind === 'roof-detail').every(command => command.hardEdge === true));
  assert.ok(roofs.filter(command => command.kind === 'roof-detail')
    .every(command => command.lightDirection === 'upper-left' && command.shadowHalf === 'lower-right'));
  assert.ok(roofs.filter(command => command.kind === 'roof-outline-rough')
    .every(command => command.handDrawn === true));
  assert.ok(scene.commands.some(command => command.layer === 'building-shadow'));
  assert.equal(scene.stats.buildingExtrusionEnabled, false);
  assert.equal(scene.stats.wallCommands, 0);
  assert.equal(scene.stats.windowCommands, 0);
  assert.ok(scene.stats.patternFamilies.roof >= 2);
  assert.equal(scene.stats.labelCount, 0);
  assert.equal(scene.stats.poiMarkerCount, 0);
});

test('普通建物5patternは別々のCanvas primitiveへ展開される', () => {
  const buildings = Array.from({ length: 500 }, (_, index) => {
    const column = index % 25;
    const row = Math.floor(index / 25);
    const width = index % 4 === 1 ? 26 : index % 4 === 2 ? 18 : 14;
    const height = index % 4 === 1 ? 8 : index % 4 === 2 ? 18 : 12;
    const x = 8 + column * 30;
    const y = 8 + row * 24;
    return polygon('building', index + 100, [[x, y], [x + width, y], [x + width, y + height], [x, y + height]], {
      class: index % 4 === 3 ? 'commercial' : 'residential',
    });
  });
  const scene = RENDERER.buildScene({
    width: 800,
    height: 520,
    viewport: { centerX: 400, centerY: 260, scale: 1 },
    features: buildings,
  });
  const details = scene.commands.filter(command => command.kind === 'roof-detail');
  assert.deepEqual([...new Set(details.map(command => command.patternId))].sort(), [
    'building-cottage-gable',
    'building-flat-workshop',
    'building-hipped',
    'building-longhouse',
    'building-weathered-gable',
  ]);
  assert.equal(new Set(details.map(command => command.detailPrimitive)).size, 5);
  assert.equal(scene.commands.filter(command => command.kind === 'roof-outline-rough').length,
    details.filter(command => command.detailLevel === 'full').length);
  const firstRoofKey = details[0].sourceKey;
  assert.deepEqual(scene.commands
    .filter(command => command.layer === 'building-roof' && command.sourceKey === firstRoofKey)
    .map(command => command.kind), ['roof-fill', 'roof-detail', 'roof-outline-rough']);
});

test('屋根内の手描き線は5patternすべてで最長辺方向だけを使う', () => {
  const paths = [[[12, 18], [88, 34], [82, 62], [6, 46], [12, 18]]];
  const frame = RENDERER.roofFrame(paths);
  assert.ok(frame);
  for (const pattern of globalThis.PixelMapTopDownPatterns.catalogs.roof) {
    const strokes = RENDERER.roofStrokePlan(frame, {
      patternId: pattern.id,
      seed: 4127,
      detailLevel: 'full',
    });
    assert.ok(strokes.length >= 4, `${pattern.id} should use multiple broken strokes`);
    for (const stroke of strokes) {
      const dx = stroke.to[0] - stroke.from[0];
      const dy = stroke.to[1] - stroke.from[1];
      assert.ok(Math.abs(dx * frame.u[1] - dy * frame.u[0]) < 0.000001,
        `${pattern.id} contains a line crossing the longest axis`);
    }
  }
});

test('半面影はseedでは反転せず、左上光源に対する画面右下側へ固定する', () => {
  const horizontal = RENDERER.roofFrame([[[0, 0], [60, 0], [60, 20], [0, 20], [0, 0]]]);
  const vertical = RENDERER.roofFrame([[[0, 0], [20, 0], [20, 60], [0, 60], [0, 0]]]);
  assert.equal(RENDERER.roofShadowSide(horizontal), 1);
  assert.equal(RENDERER.roofShadowSide(vertical), -1);
  const scene = RENDERER.buildScene({
    width: 120,
    height: 80,
    viewport: { centerX: 60, centerY: 40, scale: 1 },
    features: [polygon('building', 880, [[20, 20], [100, 20], [100, 58], [20, 58]], { class: 'residential' })],
  });
  const detail = scene.commands.find(command => command.kind === 'roof-detail');
  assert.ok(detail.shade);
  assert.notEqual(detail.shade, scene.commands.find(command => command.kind === 'roof-fill').fill);
  assert.equal(detail.lineDirection, 'longest-edge-only');
});

test('小建物は白い点状ノイズを避け、短辺サイズに応じて屋根細部を段階化する', () => {
  const scene = RENDERER.buildScene({
    width: 140,
    height: 80,
    viewport: { centerX: 70, centerY: 40, scale: 1 },
    features: [
      polygon('building', 701, [[8, 8], [14, 8], [14, 10], [8, 10]], { class: 'residential' }),
      polygon('building', 702, [[30, 8], [42, 8], [42, 12], [30, 12]], { class: 'residential' }),
      polygon('building', 703, [[64, 8], [86, 8], [86, 20], [64, 20]], { class: 'residential' }),
    ],
  });
  const commandsFor = id => scene.commands.filter(command => command.sourceId === id && command.layer === 'building-roof');
  assert.deepEqual(commandsFor(701).map(command => command.kind), ['roof-fill']);
  assert.deepEqual(commandsFor(702).map(command => command.kind), ['roof-fill', 'roof-detail']);
  assert.equal(commandsFor(702).find(command => command.kind === 'roof-detail').detailLevel, 'ridge');
  assert.deepEqual(commandsFor(703).map(command => command.kind), ['roof-fill', 'roof-detail', 'roof-outline-rough']);
  assert.equal(commandsFor(703).find(command => command.kind === 'roof-detail').detailLevel, 'full');
});

test('MVTで複数棟が一featureにまとまっても屋根patternを棟ごとに決め、中庭ringを同じ棟へ保つ', () => {
  const grouped = {
    layer: 'building', id: 30, type: 3, props: { class: 'residential' },
    geometry: [
      [[20, 20], [50, 20], [50, 42], [20, 42], [20, 20]],
      [[26, 26], [26, 34], [40, 34], [40, 26], [26, 26]],
      [[90, 60], [132, 60], [132, 92], [90, 92], [90, 60]],
    ],
  };
  const scene = RENDERER.buildScene({ ...fixture(), features: [grouped] });
  const roofs = scene.commands.filter(command => command.kind === 'roof-fill');
  assert.equal(roofs.length, 2);
  assert.equal(roofs[0].paths.length, 2);
  assert.equal(new Set(roofs.map(command => command.sourceKey)).size, 2);
});

test('同じMVT feature内でもviewport外の棟は描画命令へ展開しない', () => {
  const grouped = {
    layer: 'building', id: 31, type: 3, props: {},
    geometry: [
      [[20, 20], [50, 20], [50, 42], [20, 42], [20, 20]],
      [[2000, 2000], [2050, 2000], [2050, 2042], [2000, 2042], [2000, 2000]],
    ],
  };
  const scene = RENDERER.buildScene({ ...fixture(), features: [grouped] });
  assert.equal(scene.commands.filter(command => command.kind === 'roof-fill').length, 1);
});

test('植生は許可area内へ複数patternで置き道路・水域・建物を避ける', () => {
  const scene = RENDERER.buildScene(fixture());
  const trees = scene.commands.filter(command => command.kind === 'tree');
  assert.ok(trees.length > 5);
  assert.ok(new Set(trees.map(command => command.patternId)).size >= 3);
  for (const tree of trees) {
    assert.equal(RENDERER.pointInFeature([tree.worldX, tree.worldY], fixture().features[0]), true);
    assert.equal(RENDERER.pointInFeature([tree.worldX, tree.worldY], fixture().features[1]), false);
    assert.equal(RENDERER.pointInFeature([tree.worldX, tree.worldY], fixture().features[4]), false);
    assert.ok(RENDERER.distanceToFeature([tree.worldX, tree.worldY], fixture().features[2]) > tree.clearance);
  }
});

test('樹冠密度はworld単位ではなく表示縮尺に追従し、z14で過密化しない', () => {
  const scene = RENDERER.buildScene({
    width: 512,
    height: 512,
    viewport: { centerX: 2048, centerY: 2048, scale: 0.125 },
    features: [polygon('landcover', 20, [[0, 0], [4096, 0], [4096, 4096], [0, 4096]], { class: 'forest' })],
  });
  assert.ok(scene.stats.treeCount > 200);
  assert.ok(scene.stats.treeCount < 1600);
});

test('共通地理範囲のpattern fingerprintはviewport原点と入力順で変わらない', () => {
  const a = fixture();
  const b = fixture();
  b.features.reverse();
  b.viewport = { ...b.viewport, centerX: 164, centerY: 120 };
  const first = RENDERER.patternAssignments(a);
  const second = RENDERER.patternAssignments(b);
  assert.deepEqual(second, first);
});

test('地表と水面textureはscreenではなくworld座標へ固定される', () => {
  const original = RENDERER.buildScene(fixture());
  const moved = RENDERER.buildScene(fixture({
    viewport: { centerX: 196.25, centerY: 141.5, scale: 1 },
  }));
  for (const kind of ['area-texture', 'water-ripples']) {
    const before = original.commands.find(command => command.kind === kind);
    const after = moved.commands.find(command => command.kind === kind);
    assert.deepEqual(after.textureOrigin, [before.textureOrigin[0] - 36.25, before.textureOrigin[1] - 21.5]);
  }
});

test('地物の基準座標を論理pixelやmap cellへ量子化しない', () => {
  const scene = RENDERER.buildScene(fixture());
  const primary = scene.commands.find(command => command.sourceId === 3 && command.kind === 'road-fill');
  assert.deepEqual(primary.paths[0][0], [20.25, 130.5]);
  assert.deepEqual(primary.paths[0][1], [300.75, 112.25]);
  assert.doesNotMatch(source, /MAP_CELL|CELL_ONLY|logicalPixel|Math\.random\s*\(/);
});

test('現在地markerは名称なしでcompositor最前面へ置く', () => {
  const scene = RENDERER.buildScene({ ...fixture(), location: [160.5, 120.25] });
  const marker = scene.commands.at(-1);
  assert.equal(marker.kind, 'location-marker');
  assert.equal(marker.layer, 'location');
  assert.equal(scene.stats.labelCount, 0);
});
