import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window=globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/corridor-renderer.js');
await import('../assets/layer-assets.js');

const registry=globalThis.PixelMapAssetFamilyRegistry;
const layerAssets=globalThis.PixelMapLayerAssets;

test('road・path・railはpack共通のsemantic corridor familyで解決する',()=>{
  const cases=[
    [{class:'motorway'},'road','motorway','motorways'],
    [{class:'primary'},'road','major','majorRoads'],
    [{class:'secondary'},'road','regional','regionalRoads'],
    [{class:'service'},'road','local','localRoads'],
    [{class:'footway'},'path','footpath','paths'],
    [{class:'track'},'path','track','tracks'],
    [{class:'rail'},'rail','mainline','rail'],
    [{class:'tram'},'rail','lightRail','rail'],
    [{class:'monorail'},'rail','monorail','rail'],
    [{class:'subway'},'rail','subway','subway'],
    [{class:'ferry'},'waterTransit','ferry','ferries'],
  ];
  for(const [props,familyId,variantId,assetId] of cases){
    for(const packId of Object.keys(registry.packs)){
      const resolved=registry.resolveCorridor(props,packId);
      assert.equal(resolved.familyId,familyId,`${packId}:${props.class}:family`);
      assert.equal(resolved.variantId,variantId,`${packId}:${props.class}:variant`);
      assert.equal(resolved.assetId,assetId,`${packId}:${props.class}:asset`);
      assert.equal(resolved.packId,packId);
      assert.equal(resolved.fallback,false);
    }
  }
});

test('複数属性の意味優先度は旧分類と同じで、bridge classはsubclassからfamilyを得る',()=>{
  assert.equal(registry.resolveCorridor({class:'minor',subclass:'primary'}).assetId,'majorRoads');
  assert.equal(registry.resolveCorridor({class:'rail',subclass:'transit'}).assetId,'rail');
  const bridge=registry.resolveCorridor({class:'bridge',subclass:'primary'});
  assert.equal(bridge.familyId,'road');
  assert.equal(bridge.variantId,'major');
  assert.equal(bridge.matchedType,'primary');
});

test('construction・tunnel・underground・serviceをgeometry非依存のstate modifierとして保持する',()=>{
  assert.deepEqual(
    registry.resolveCorridor({class:'primary_construction',brunnel:'tunnel',layer:-1}).modifiers,
    {bridge:false,construction:true,levelCrossing:false,tunnel:true,underground:true,service:false},
  );
  assert.equal(
    registry.resolveCorridor({class:'primary_construction',brunnel:'tunnel'}).stateAssetId,
    'roadTunnels',
  );
  assert.equal(registry.resolveCorridor({class:'footway',brunnel:'tunnel'}).stateAssetId,'pathTunnels');
  assert.equal(registry.resolveCorridor({class:'rail',brunnel:'tunnel'}).stateAssetId,'railTunnels');
  assert.equal(registry.resolveCorridor({class:'subway',brunnel:'tunnel'}).stateAssetId,'subway');
  assert.equal(registry.resolveCorridor({class:'service'}).modifiers.service,true);
  assert.equal(registry.resolveCorridor({class:'subway'}).modifiers.underground,true);
});

test('bridgeとsource level crossingも同じstate modifier契約で解決する',()=>{
  const bridge=registry.resolveCorridor({class:'bridge',subclass:'primary',brunnel:'bridge'});
  assert.equal(bridge.assetId,'majorRoads');
  assert.equal(bridge.modifiers.bridge,true);
  assert.equal(bridge.modifiers.levelCrossing,false);
  const crossing=registry.resolveCorridor({class:'level_crossing'});
  assert.equal(crossing.modifiers.levelCrossing,true);
  assert.equal(crossing.modifiers.bridge,false);
});

test('fallbackと全family assetはLayer Asset Catalogのcorridor contractへ接続する',()=>{
  const fallback=registry.resolveCorridor({class:'unknown-route'});
  assert.deepEqual({
    familyId:fallback.familyId,variantId:fallback.variantId,assetId:fallback.assetId,
    stateAssetId:fallback.stateAssetId,fallback:fallback.fallback,
  },{
    familyId:'other',variantId:'other',assetId:'transportationOther',
    stateAssetId:'transportationOther',fallback:true,
  });
  for(const packId of Object.keys(registry.packs))
    for(const assetId of registry.corridorAssetsForPack(packId))
      assert.ok(layerAssets.corridorRules[assetId],`${packId}:${assetId}`);
});

test('mapは独自class setを持たずregistryのfamily/stateを使い、診断へ集計する',async()=>{
  const map=await readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8');
  assert.doesNotMatch(map,/PATH_TRANSPORT|RAIL_TRANSPORT|AERIALWAY_TRANSPORT|normalizeTransportValue/);
  assert.match(map,/ASSET_FAMILY_REGISTRY\.resolveCorridor\(feature\.props,ACTIVE_ASSET_PACK\)/);
  assert.match(map,/binding\.assetId/);
  assert.match(map,/binding\.stateAssetId/);
  assert.match(map,/binding\.modifiers\.tunnel/);
  assert.match(map,/binding\.modifiers\.bridge/);
  assert.doesNotMatch(map,/feature\.props\.brunnel === 'bridge'|feature\.props\.class === 'bridge'/);
  assert.match(map,/CORRIDOR_RENDERER\.findMaskIntersections/);
  assert.match(map,/drawUnifiedLevelCrossings/);
  assert.match(map,/corridorFamilies:\{[\s\S]*registryVersion:ASSET_FAMILY_REGISTRY\.version/);
  for(const field of ['families','variants','assets','stateAssets','modifiers','fallbacks'])
    assert.match(map,new RegExp(`${field}:`),field);
});
