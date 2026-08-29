import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/world-style.js');

const STYLE = globalThis.PixelMapWorldStyles.retroJrpgZ14;
const BASELINE = globalThis.PixelMapWorldStyles.productionComparisonZ14;
const SNAPSHOT = globalThis.PixelMapWorldStyles.productionZ14Snapshot;
const INDUSTRIAL = globalThis.PixelMapWorldStyles.steampunkMegacityDayZ14;
const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('WorldStyleはz14 POCの見た目だけを一つの契約へ集約する', () => {
  assert.equal(STYLE.version, 'pixelmap-world-style/7');
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
    enabled:true,outline:'#302838',light:'#f0d788',dark:'#76543d',minimumSpacing:7,
  });
  assert.deepEqual(STYLE.compositor,
    ['area','ground-corridor','building','structure','bridge','object','marker','dot-cluster']);
});

test('水面・公園・スポーツ面は別surface family skinを持つ',()=>{
  assert.deepEqual(Object.keys(STYLE.surfaceFamilies),['waterSurface','parkSurface','sportsSurface']);
  assert.equal(STYLE.surfaceFamilies.waterSurface.primitive,'area');
  assert.deepEqual(STYLE.surfaceFamilies.waterSurface.assets,['waterAreas']);
  assert.deepEqual(STYLE.surfaceFamilies.parkSurface.assets,['parks','landusePlayground']);
  assert.deepEqual(STYLE.surfaceFamilies.sportsSurface.assets,['landuseStadium','landusePitchTrack']);
  assert.notEqual(STYLE.surfaceFamilies.parkSurface.skin,STYLE.surfaceFamilies.sportsSurface.skin);
  assert.notEqual(STYLE.surfaceFamilies.waterSurface.fill,STYLE.surfaceFamilies.sportsSurface.fill);
  assert.match(html,/WORLD_STYLE\.surfaceFamilies\.waterSurface\.fill/);
  assert.match(html,/WORLD_STYLE\.surfaceFamilies\.parkSurface\.medium/);
  assert.match(html,/WORLD_STYLE\.surfaceFamilies\.sportsSurface\.fill/);
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
  assert.match(html, /<script src="\.\.\/assets\/world-style\.js\?v=7"><\/script>/);
  assert.match(html, /const WORLD_STYLE_PROFILE = PAGE_PARAMS\.get\('profile'\) === 'reference'[\s\S]*'retroJrpgZ14' : 'productionComparisonZ14'/);
  assert.match(html, /const WORLD_STYLE_MODE = !EMBEDDED && !CELL_ONLY_MODE && !STUDY_MODE/);
  assert.match(html, /else if \(WORLD_STYLE_MODE\)\{[\s\S]*new Set\(WORLD_STYLE\.defaultLayers\)/);
  assert.match(html, /dataset\.worldStyle = WORLD_STYLE_MODE \? WORLD_STYLE\.id : 'none'/);
  assert.match(html, /dataset\.assetPack = WORLD_STYLE_MODE \? WORLD_STYLE\.assetPack : 'legacy'/);
  assert.equal(
    (html.match(/WORLD_STYLE_MODE \? WORLD_STYLE\.assetPack : 'legacy'/g) || []).length,
    3,
    'dataset・diagnostics・captureは同じtest-only assetPack guardを使う',
  );
  assert.match(html, /WORLD_STYLE_MODE \? WORLD_STYLE\.palette\.roadLocal : TEST_SKIN_PALETTE\?\.roadLocal \|\| CANONICAL_TRANSPORT_RULES\.localRoads\.fill/);
});

test('強度3のスチームパンク機械都市skinはstandalone cell専用の素材契約を持つ', () => {
  assert.equal(INDUSTRIAL.id, 'steampunk-megacity-day-z14');
  assert.equal(INDUSTRIAL.profileKind, 'standalone-test-skin');
  assert.equal(INDUSTRIAL.intensity, 3);
  assert.equal(INDUSTRIAL.assetSystem, 'pixelmap-steampunk-map-assets/1');
  assert.equal(INDUSTRIAL.sourceGeometryImmutable, true);
  assert.equal(INDUSTRIAL.tileZoom, 14);
  assert.equal(INDUSTRIAL.building.mode, 'steampunk-megacity-shape-grammar');
  assert.equal(INDUSTRIAL.building.shapeGrammar.version, 'steampunk-megacity-shape/2');
  assert.equal(INDUSTRIAL.building.shapeGrammar.sourceFootprintImmutable, true);
  assert.equal(INDUSTRIAL.building.shapeGrammar.decorationsSemantic, false);
  assert.deepEqual(INDUSTRIAL.building.shapeGrammar.roofForms.band1, ['pipe-crawl-roof','patched-boiler-roof']);
  assert.deepEqual(INDUSTRIAL.building.shapeGrammar.roofForms.band4, ['stacked-boiler-city','gear-spire-complex']);
  assert.equal(INDUSTRIAL.building.shapeGrammar.mechanicalDensity, 'maximal');
  assert.equal(INDUSTRIAL.palette.grass, '#566157');
  assert.equal(INDUSTRIAL.palette.rust, '#a84f32');
  assert.equal(INDUSTRIAL.palette.copper, '#4f8176');
  assert.equal(INDUSTRIAL.palette.steam, '#d8d4c3');
  assert.equal(INDUSTRIAL.corridor.rail.rail, '#252c2f');
  assert.equal(Object.isFrozen(INDUSTRIAL), true);
  assert.match(html, /const STANDALONE_STEAMPUNK_MEGACITY = !EMBEDDED && CELL_ONLY_MODE/);
  assert.match(html, /const ACTIVE_MAP_SKIN = STANDALONE_STEAMPUNK_MEGACITY/);
  assert.match(html, /<script src="\.\.\/assets\/steampunk-map-assets\.js\?v=1"><\/script>/);
  assert.match(html, /dataset\.mapSkin = ACTIVE_MAP_SKIN \? ACTIVE_MAP_SKIN\.id : 'legacy'/);
});

test('production比較profileは本番値を独立copyし、reference profileと分離する',()=>{
  assert.equal(BASELINE.id,'production-comparison-z14');
  assert.equal(BASELINE.profileKind,'production-copy');
  assert.equal(BASELINE.snapshotVersion,SNAPSHOT.version);
  assert.equal(BASELINE.patternId,'07');
  assert.equal(BASELINE.assetPack,'retro-jrpg-production-copy-v1');
  assert.deepEqual(BASELINE.defaultLayers,SNAPSHOT.defaultLayers);
  assert.notEqual(BASELINE.defaultLayers,SNAPSHOT.defaultLayers);
  assert.deepEqual(BASELINE.corridor,SNAPSHOT.corridor);
  assert.notEqual(BASELINE.corridor,SNAPSHOT.corridor);
  assert.deepEqual(BASELINE.surfaceFamilies,SNAPSHOT.surfaceFamilies);
  assert.notEqual(BASELINE.surfaceFamilies,SNAPSHOT.surfaceFamilies);
  assert.deepEqual(BASELINE.building.skin,SNAPSHOT.buildingSkin);
  assert.notEqual(BASELINE.building.skin,SNAPSHOT.buildingSkin);
  assert.equal(BASELINE.building.renderer,'production-cell-copy');
  assert.equal(BASELINE.building.cellSize,8);
  assert.equal(BASELINE.density.maxIcons,Infinity);
  assert.deepEqual(BASELINE.density.roleCaps,{});
  assert.deepEqual(BASELINE.symbol.minimumAssetSizeByRole,{structure:'S',object:'S',marker:'S'});
  assert.equal(BASELINE.symbol.sourceAnchored,false);
  assert.equal(BASELINE.landmarksEnabled,false);
  assert.equal(STYLE.assetPack,'retro-jrpg-reference-v1');
  assert.equal(STYLE.patternId,'01');
});

test('production比較profileの道路・鉄道・surface色はproduction snapshotと一致する',()=>{
  assert.deepEqual(BASELINE.corridor.regionalRoads,{
    width:8,edgeWidth:1,fill:'#d0d0ca',edge:'#9e9e98',center:'#f8f0d8',centerPeriod:13,centerOn:7,
  });
  assert.deepEqual(BASELINE.corridor.rail,{
    width:8,edgeWidth:0,fill:'#a8a098',pattern:'rail',rail:'#404048',tie:'#786048',railOffset:2,railThickness:2,tiePeriod:4,sourceCellWidth:8,
    bedTexture:{
      period:8,dark:'#888078',light:'#c0b8b0',
      darkPixels:[[1,2],[5,4],[3,6]],lightPixels:[[6,1],[0,5]],
    },
  });
  assert.equal(BASELINE.surfaceFamilies.waterSurface.fill,'#4890e0');
  assert.equal(BASELINE.palette.grass,'#7cbc54');
  assert.equal(BASELINE.corridorModifiers.levelCrossing.enabled,false);
});

test('production比較captureは本番と同じ最新TileJSONを読み、入力地物差を混ぜない',()=>{
  assert.match(html,/if \(!CAPTURE_MODE \|\| WORLD_STYLE\.profileKind === 'production-copy'\)/);
});
