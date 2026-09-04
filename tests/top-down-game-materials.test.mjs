import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-materials.js');

const MATERIALS = globalThis.PixelMapTopDownMaterials;
const source = await readFile(new URL('../assets/top-down-game-materials.js', import.meta.url), 'utf8');

test('参考画像1から実測した建物と樹冠を独立したCanvas素材として公開する', () => {
  assert.equal(MATERIALS.version, 'pixelmap-top-down-materials/6');
  assert.deepEqual(Object.keys(MATERIALS.catalog), [
    'building-blue-gable-01',
    'building-blue-hipped-02',
    'building-blue-longhouse-03',
    'building-harbor-workshop-04',
    'building-blue-weathered-05',
    'road-sandy-local-06',
    'water-open-ripples-06',
    'tree-round-crown-01',
    'tree-dark-crown-03',
    'tree-multi-crown-04',
    'tree-underbrush-cluster-05',
    'tree-small-crown-02',
  ]);
  assert.deepEqual(MATERIALS.catalog['building-blue-gable-01'].nativeSize, [50, 32]);
  assert.deepEqual(MATERIALS.catalog['building-blue-hipped-02'].nativeSize, [72, 64]);
  assert.deepEqual(MATERIALS.catalog['building-blue-longhouse-03'].nativeSize, [60, 50]);
  assert.deepEqual(MATERIALS.catalog['building-harbor-workshop-04'].nativeSize, [78, 78]);
  assert.deepEqual(MATERIALS.catalog['building-blue-weathered-05'].nativeSize, [58, 52]);
  assert.deepEqual(MATERIALS.catalog['road-sandy-local-06'].nativeSize, [104, 60]);
  assert.deepEqual(MATERIALS.catalog['water-open-ripples-06'].nativeSize, [120, 90]);
  assert.deepEqual(MATERIALS.catalog['tree-round-crown-01'].nativeSize, [48, 48]);
  assert.deepEqual(MATERIALS.catalog['tree-dark-crown-03'].nativeSize, [52, 50]);
  assert.deepEqual(MATERIALS.catalog['tree-multi-crown-04'].nativeSize, [76, 76]);
  assert.deepEqual(MATERIALS.catalog['tree-underbrush-cluster-05'].nativeSize, [54, 46]);
  assert.deepEqual(MATERIALS.catalog['tree-small-crown-02'].nativeSize, [48, 48]);
  assert.equal(MATERIALS.catalog['building-blue-gable-01'].source.crop.x, 584);
  assert.equal(MATERIALS.catalog['building-blue-gable-01'].source.crop.y, 702);
  assert.deepEqual(MATERIALS.catalog['building-blue-hipped-02'].source.crop,
    { x: 510, y: 592, width: 72, height: 64 });
  assert.deepEqual(MATERIALS.catalog['building-blue-longhouse-03'].source.crop,
    { x: 728, y: 490, width: 60, height: 50 });
  assert.deepEqual(MATERIALS.catalog['building-harbor-workshop-04'].source.crop,
    { x: 500, y: 855, width: 78, height: 78 });
  assert.deepEqual(MATERIALS.catalog['building-blue-weathered-05'].source.crop,
    { x: 726, y: 500, width: 58, height: 52 });
  assert.deepEqual(MATERIALS.catalog['road-sandy-local-06'].source.crop,
    { x: 690, y: 445, width: 104, height: 60 });
  assert.deepEqual(MATERIALS.catalog['water-open-ripples-06'].source.crop,
    { x: 720, y: 850, width: 120, height: 90 });
  assert.equal(MATERIALS.catalog['tree-round-crown-01'].source.crop.x, 590);
  assert.equal(MATERIALS.catalog['tree-round-crown-01'].source.crop.y, 110);
  assert.deepEqual(MATERIALS.catalog['tree-dark-crown-03'].source.crop,
    { x: 528, y: 342, width: 52, height: 50 });
  assert.deepEqual(MATERIALS.catalog['tree-multi-crown-04'].source.crop,
    { x: 100, y: 378, width: 76, height: 76 });
  assert.deepEqual(MATERIALS.catalog['tree-underbrush-cluster-05'].source.crop,
    { x: 207, y: 594, width: 54, height: 46 });
  assert.deepEqual(MATERIALS.catalog['tree-small-crown-02'].source.crop,
    { x: 270, y: 344, width: 48, height: 48 });
  assert.ok(Object.values(MATERIALS.catalog).every(asset => asset.source.reference === 'Photo 1.jpg'));
  assert.ok(Object.values(MATERIALS.catalog).every(asset => asset.referenceClipPath));
  assert.deepEqual(MATERIALS.catalog['building-blue-gable-01'].fitBounds,
    { minX: 12, minY: 2, maxX: 50, maxY: 25 });
  assert.deepEqual(MATERIALS.catalog['tree-round-crown-01'].center, [24, 29]);
});

test('砂地道路素材は参考cropの淡い面・進行方向の擦れ・横断線・外縁粒を独立primitiveで持つ', () => {
  const road = MATERIALS.catalog['road-sandy-local-06'];
  assert.equal(road.family, 'road');
  assert.equal(road.orientation, 'vertical');
  assert.ok(road.washes.length >= 4);
  assert.ok(road.wearStrokes.length >= 6);
  assert.ok(road.wearStrokes.filter(stroke => stroke.axis === 'along').length >= 4);
  assert.ok(road.wearStrokes.some(stroke => stroke.axis === 'across'));
  assert.ok(road.specks.length >= 18);
  assert.ok(road.specks.some(speck => speck.edge === 'left'));
  assert.ok(road.specks.some(speck => speck.edge === 'right'));
  assert.ok(road.gravelClusters.length >= 8);
  assert.ok(road.gravelClusters.every(cluster => cluster.marks.length >= 3));
  assert.notEqual(road.palette.base, road.palette.wear);
});

test('外海水面素材は青緑の面むら・長い途切れ曲線・小さな流れ跡を独立primitiveで持つ', () => {
  const water = MATERIALS.catalog['water-open-ripples-06'];
  assert.equal(water.family, 'water');
  assert.ok(water.washes.length >= 4);
  assert.ok(water.rippleStrokes.length >= 5);
  assert.ok(water.rippleStrokes.every(stroke => stroke.points.length >= 3));
  assert.ok(water.rippleStrokes.some(stroke => stroke.parts?.length >= 2));
  assert.ok(water.currentMarks.length >= 8);
  assert.notEqual(water.palette.base, water.palette.ripple);
});

test('傷んだ青屋根素材は片面影・長辺方向だけの途切れ線・濃い汚れを別primitiveで持つ', () => {
  const building = MATERIALS.catalog['building-blue-weathered-05'];
  assert.ok(building.silhouette.length >= 6);
  assert.ok(building.facets.length >= 2);
  assert.ok(building.inkSegments.length >= 6);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.ok(building.inkSegments.filter(segment => segment.parts?.length >= 2).length >= 3);
  assert.ok(building.inkSegments.filter(segment => segment.role === 'weather-mark').length >= 2);
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(building.palette.light !== building.palette.shade);
  assert.deepEqual(building.fitBounds, { minX: 9, minY: 7, maxX: 51, maxY: 44 });
});

test('港湾平屋根素材は円形タンク・設備箱・長辺方向だけのむら線を独立primitiveで持つ', () => {
  const building = MATERIALS.catalog['building-harbor-workshop-04'];
  assert.ok(building.silhouette.length >= 7);
  assert.ok(building.facets.length >= 3);
  assert.ok(building.inkSegments.length >= 5);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.ok(building.inkSegments.filter(segment => segment.parts?.length >= 2).length >= 3);
  assert.ok(building.fixtures.some(fixture => fixture.shape === 'circle' && fixture.role === 'tank'));
  assert.ok(building.fixtures.some(fixture => fixture.shape === 'polygon' && fixture.role === 'equipment'));
  assert.equal(building.shadowHalf, 'lower-right');
  assert.deepEqual(building.fitBounds, { minX: 7, minY: 4, maxX: 65, maxY: 70 });
});

test('長い青屋根素材は斜めの六角輪郭・明暗2面・長辺方向だけの途切れ線を持つ', () => {
  const building = MATERIALS.catalog['building-blue-longhouse-03'];
  assert.equal(building.silhouette.length, 6);
  assert.equal(building.facets.length, 2);
  assert.ok(building.inkSegments.length >= 6);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.ok(building.inkSegments.filter(segment => segment.parts?.length >= 2).length >= 3);
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(building.palette.light !== building.palette.shade);
  assert.deepEqual(building.fitBounds, { minX: 6, minY: 15, maxX: 50, maxY: 47 });
});

test('寄棟風屋根素材は張り出しを含む輪郭・3面以上の陰影・長辺線だけを持つ', () => {
  const building = MATERIALS.catalog['building-blue-hipped-02'];
  assert.ok(building.silhouette.length >= 7);
  assert.ok(building.facets.length >= 3);
  assert.ok(building.inkSegments.length >= 5);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.ok(building.inkSegments.some(segment => segment.parts?.length >= 2));
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(new Set(building.facets.map(facet => facet.role)).size >= 3);
});

test('建物素材は輪郭・明暗2面・長辺方向の途切れ線を実測primitiveで持つ', () => {
  const building = MATERIALS.catalog['building-blue-gable-01'];
  assert.equal(building.silhouette.length, 6);
  assert.equal(building.facets.length, 2);
  assert.ok(building.inkSegments.length >= 5);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(building.palette.light !== building.palette.shade);
});

test('樹冠素材は外周の重なり葉・暗部・中央ハイライトを個別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-round-crown-01'];
  assert.ok(tree.outline.length >= 12);
  assert.ok(tree.crowns.length >= 9);
  assert.ok(tree.crowns.some(crown => crown.role === 'shadow'));
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.inkMarks.length >= 5);
});

test('小型樹冠素材は明るい外葉と濃い中心部を別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-small-crown-02'];
  assert.ok(tree.outline.length >= 12);
  assert.ok(tree.crowns.length >= 8);
  assert.ok(tree.crowns.some(crown => crown.role === 'dark'));
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.crowns.filter(crown => crown.role === 'dark').length >= 4);
  assert.ok(tree.inkMarks.length >= 4);
  assert.deepEqual(tree.center, [24, 25]);
});

test('濃色樹冠素材は暗い外周葉・中央の限定的な明部・不整形外周を別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-dark-crown-03'];
  assert.ok(tree.outline.length >= 14);
  assert.ok(tree.crowns.length >= 10);
  assert.ok(tree.crowns.filter(crown => crown.role === 'dark').length >= 5);
  assert.ok(tree.crowns.filter(crown => crown.role === 'highlight').length <= 3);
  assert.ok(tree.crowns.some(crown => crown.role === 'shadow'));
  assert.ok(tree.inkMarks.length >= 6);
  assert.deepEqual(tree.center, [28, 25]);
});

test('複数樹冠素材は中央の明樹冠と上側・左側の暗樹冠を重なり順つきで持つ', () => {
  const tree = MATERIALS.catalog['tree-multi-crown-04'];
  assert.ok(tree.outline.length >= 16);
  assert.ok(tree.crowns.length >= 12);
  assert.ok(tree.crowns.filter(crown => crown.cluster === 'upper').length >= 3);
  assert.ok(tree.crowns.filter(crown => crown.cluster === 'left').length >= 3);
  assert.ok(tree.crowns.filter(crown => crown.cluster === 'center').length >= 4);
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.inkMarks.length >= 7);
  assert.deepEqual(tree.center, [38, 40]);
  assert.equal(tree.baseRadius, 36);
  assert.equal(tree.glint, false);
});

test('下草素材は低く横長の3群以上の葉塊・暗い根元・明るい上面を別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-underbrush-cluster-05'];
  assert.ok(tree.outline.length >= 16);
  assert.ok(tree.crowns.length >= 9);
  assert.ok(new Set(tree.crowns.map(crown => crown.cluster)).size >= 3);
  assert.ok(tree.crowns.some(crown => crown.role === 'shadow'));
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.inkMarks.length >= 6);
  assert.deepEqual(tree.center, [27, 27]);
  assert.equal(tree.baseRadius, 23);
  assert.deepEqual(tree.drawScale, [.87, .9]);
  assert.equal(tree.glint, false);
});

test('素材描画はbitmap貼付けや外部画像へ依存せずCanvas primitiveだけを使う', () => {
  assert.doesNotMatch(source, /drawImage\s*\(/);
  assert.doesNotMatch(source, /new\s+Image\s*\(/);
  assert.match(source, /function paintAsset/);
  assert.match(source, /function paintRoadMaterial/);
  assert.match(source, /function paintWaterMaterial/);
  assert.match(source, /function paintRoofInFrame/);
  assert.match(source, /function paintTreeAt/);
  assert.match(source, /asset\.baseRadius \|\| 18/);
});
