import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/world-style.js');

const STYLE = globalThis.PixelMapWorldStyles.retroJrpgZ14;
const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('WorldStyleはz14 POCの見た目だけを一つの契約へ集約する', () => {
  assert.equal(STYLE.version, 'pixelmap-world-style/3');
  assert.equal(STYLE.id, 'retro-jrpg-z14');
  assert.equal(STYLE.assetPack, 'retro-jrpg-reference-v1');
  assert.equal(STYLE.tileZoom, 14);
  assert.equal(STYLE.sourceGeometryImmutable, true);
  assert.equal(STYLE.patternId, '01');
  assert.equal(Object.isFrozen(STYLE), true);
});

test('game profileは地理精度に必要なz14レイヤーを残し、調査用ノイズを既定で隠す', () => {
  for (const layer of ['grass','waterAreas','localRoads','regionalRoads','majorRoads','motorways','rail','buildings','poi','stationNames'])
    assert.equal(STYLE.defaultLayers.includes(layer), true, `${layer} should be enabled`);
  for (const layer of ['dots','poiNames','parkNames','placeNames','subway','paths'])
    assert.equal(STYLE.defaultLayers.includes(layer), false, `${layer} should be opt-in`);
  assert.equal(STYLE.density.drawDotsByDefault, false);
  assert.equal(STYLE.density.drawClustersByDefault, false);
});

test('道路・鉄道・水路は整数幅の共通corridor skinで世界観をそろえる', () => {
  for (const [id, corridor] of Object.entries(STYLE.corridor)){
    assert.equal(Number.isInteger(corridor.width), true, `${id}.width`);
    assert.equal(Number.isInteger(corridor.edgeWidth), true, `${id}.edgeWidth`);
  }
  assert.equal(STYLE.corridor.localRoads.width, 1);
  assert.equal(STYLE.corridor.rail.pattern, 'rail');
  assert.equal(STYLE.corridor.rail.width, 6);
  assert.equal(STYLE.corridor.rail.tiePeriod, 6);
  assert.deepEqual(STYLE.corridorModifiers.bridge,{minimumEdgeWidth:1,edge:'#302838'});
  assert.deepEqual(STYLE.corridorModifiers.levelCrossing,{
    outline:'#302838',light:'#f0d788',dark:'#76543d',minimumSpacing:7,
  });
  assert.deepEqual(STYLE.compositor,
    ['area','ground-corridor','building','structure','bridge','object','marker','dot-cluster']);
});

test('POI密度は施設ごとの例外ではなくrole・categoryの共通予算で管理する', () => {
  assert.equal(STYLE.density.maxIcons, 64);
  assert.deepEqual(STYLE.density.roleCaps, {structure:44,object:12,marker:8});
  assert.equal(STYLE.density.categoryCaps.transit, 6);
  assert.equal(STYLE.density.categoryCaps.generic, 2);
  assert.equal(STYLE.symbol.decorateStructures, false);
  assert.equal(STYLE.symbol.auxiliaryStructures, true);
  assert.deepEqual(STYLE.symbol.minimumAssetSizeByRole, {structure:'M',object:'S',marker:'S'});
  assert.deepEqual(STYLE.building, {
    mode:'semantic-lod',
    sourceGeometryImmutable:true,
    detailedSmallModulo:8,
    sampledMinimumArea:4,
    minimumTallDetailedArea:8,
    quietMinimumArea:2,
    quietFills:['#d8c99e','#cfbf91','#dccda5'],
  });
});

test('map-02はWorldStyleをstandalone game profileだけへ適用する', () => {
  assert.match(html, /<script src="\.\.\/assets\/world-style\.js\?v=3"><\/script>/);
  assert.match(html, /const WORLD_STYLE_MODE = !EMBEDDED && !CELL_ONLY_MODE && !STUDY_MODE/);
  assert.match(html, /else if \(WORLD_STYLE_MODE\)\{[\s\S]*new Set\(WORLD_STYLE\.defaultLayers\)/);
  assert.match(html, /dataset\.worldStyle = WORLD_STYLE_MODE \? WORLD_STYLE\.id : 'none'/);
  assert.match(html, /dataset\.assetPack = WORLD_STYLE_MODE \? WORLD_STYLE\.assetPack : 'legacy'/);
  assert.equal(
    (html.match(/WORLD_STYLE_MODE \? WORLD_STYLE\.assetPack : 'legacy'/g) || []).length,
    3,
    'dataset・diagnostics・captureは同じtest-only assetPack guardを使う',
  );
  assert.match(html, /WORLD_STYLE_MODE \? WORLD_STYLE\.palette\.roadLocal : CANONICAL_TRANSPORT_RULES\.localRoads\.fill/);
});
