import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window=globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/corridor-renderer.js');
await import('../assets/layer-assets.js');

const registry=globalThis.PixelMapAssetFamilyRegistry;
const layerAssets=globalThis.PixelMapLayerAssets;

test('water・park・sportsはsource名込みのsemantic surface familyで解決する',()=>{
  const cases=[
    ['water',{class:'lake'},'waterSurface','natural','waterAreas'],
    ['water',{class:'dock'},'waterSurface','engineered','waterAreas'],
    ['water',{class:'swimming_pool'},'waterSurface','pool','waterAreas'],
    ['landcover',{class:'park'},'parkSurface','park','parks'],
    ['landuse',{class:'playground'},'parkSurface','playground','landusePlayground'],
    ['park',{class:'nature_reserve'},'parkSurface','protected','parks'],
    ['landuse',{class:'stadium'},'sportsSurface','stadium','landuseStadium'],
    ['landuse',{class:'pitch'},'sportsSurface','pitchTrack','landusePitchTrack'],
    ['landcover',{class:'golf_course'},'sportsSurface','golf','landusePitchTrack'],
  ];
  for(const [source,props,familyId,variantId,assetId] of cases){
    for(const packId of Object.keys(registry.packs)){
      const resolved=registry.resolveSurface(props,source,packId);
      assert.equal(resolved.familyId,familyId,`${packId}:${source}:${props.class}:family`);
      assert.equal(resolved.variantId,variantId,`${packId}:${source}:${props.class}:variant`);
      assert.equal(resolved.assetId,assetId,`${packId}:${source}:${props.class}:asset`);
      assert.equal(resolved.fallback,false,`${packId}:${source}:${props.class}:fallback`);
    }
  }
});

test('water surfaceとwaterway corridorは別primitiveで、未知surfaceは根拠を残す',()=>{
  const surface=registry.resolveSurface({class:'river'},'water');
  const corridor=registry.resolveSurface({class:'river'},'waterway');
  assert.equal(surface.familyId,'waterSurface');
  assert.equal(surface.assetId,'waterAreas');
  assert.deepEqual(corridor,{
    version:registry.version,packId:'legacy',sourceLayer:'waterway',
    familyId:'genericSurface',variantId:'generic',assetId:null,matchedType:null,fallback:true,
  });
  assert.equal(layerAssets.corridorRules.rivers.source,'waterway');
});

test('surface familyの全assetはLayer Asset Catalogへfamily metadata付きで接続する',()=>{
  const byId=Object.fromEntries(layerAssets.layers.map(layer=>[layer.id,layer]));
  for(const packId of Object.keys(registry.packs))
    for(const assetId of registry.surfaceAssetsForPack(packId))
      assert.ok(byId[assetId],`${packId}:${assetId}`);
  assert.deepEqual(byId.waterAreas.assetFamilyIds,['waterSurface']);
  assert.deepEqual(byId.parks.assetFamilyIds,['parkSurface']);
  assert.deepEqual(byId.landusePlayground.assetFamilyIds,['parkSurface']);
  assert.deepEqual(byId.landuseStadium.assetFamilyIds,['sportsSurface']);
  assert.deepEqual(byId.landusePitchTrack.assetFamilyIds,['sportsSurface']);
  assert.deepEqual(byId.rivers.assetFamilyIds,[]);
  assert.ok(byId.waterAreas.sourceTypes.includes('water:lake'));
  assert.ok(byId.landusePitchTrack.sourceTypes.includes('landuse:pitch'));
});

test('standalone mapだけがsurface family分類を描画へ使い、本番はlegacy分岐を維持する',async()=>{
  const map=await readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8');
  assert.match(map,/ASSET_FAMILY_REGISTRY\.resolveSurface\(feature\.props,sourceLayer,ACTIVE_ASSET_PACK\)/);
  assert.match(map,/const semanticSurfaceFeatures = STANDALONE_UNIFIED_STYLE \?/);
  assert.match(map,/if\(!STANDALONE_UNIFIED_STYLE\) return \{id:ID\.WATER,option:'waterAreas'\}/);
  assert.match(map,/surfaceBinding\(feature,'landcover'\)\.fallback/);
  assert.match(map,/surfaceBinding\(feature,'landuse'\)\.fallback/);
  assert.doesNotMatch(map,/PARK_SURFACE_CLASSES|PARK_RESERVE_CLASSES/);
  assert.match(map,/surfaceFamilies:\{[\s\S]*registryVersion:ASSET_FAMILY_REGISTRY\.version/);
  for(const field of ['families','variants','assets','fallbacks'])
    assert.match(map,new RegExp(`${field}:`),field);
});
