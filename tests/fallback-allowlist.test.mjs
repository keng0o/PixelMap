import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window=globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/facility-resolver.js');

const registry=globalThis.PixelMapAssetFamilyRegistry;
const resolver=globalThis.PixelMapFacilityResolver;
const map=await readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8');

test('generic fallback allowlistは3 primitive別の固定列挙でwildcardを持たない',()=>{
  assert.deepEqual(Object.keys(registry.genericFallbackAllowlists),['poi','corridor','surface']);
  for(const [kind,types] of Object.entries(registry.genericFallbackAllowlists)){
    assert.ok(Object.isFrozen(types),`${kind}:frozen`);
    assert.equal(new Set(types).size,types.length,`${kind}:unique`);
    assert.ok(types.length>0,`${kind}:non-empty`);
    assert.ok(types.every(type=>type && !type.includes('*')),`${kind}:no wildcard`);
  }
  assert.equal(registry.genericFallbackAllowlists.poi.includes('unknown-new-poi'),false);
  assert.equal(registry.genericFallbackAllowlists.corridor.includes('unknown-new-route'),false);
  assert.equal(registry.genericFallbackAllowlists.surface.includes('landuse:unknown-new-surface'),false);
});

test('レビュー済みgenericはallowlisted、将来の未知typeはunexpectedとして区別する',()=>{
  const cases=[
    [registry.resolvePoi({class:'clinic'}),'clinic'],
    [registry.resolveCorridor({class:'bridge'}),'bridge'],
    [registry.resolveSurface({class:'heath'},'landcover'),'landcover:heath'],
  ];
  for(const [resolved,key] of cases){
    assert.equal(resolved.fallback,true,key);
    assert.equal(resolved.fallbackKey,key,key);
    assert.equal(resolved.fallbackAllowed,true,key);
    assert.equal(resolved.fallbackReason,'allowlisted-generic',key);
  }
  const unexpected=[
    registry.resolvePoi({class:'unknown-new-poi'}),
    registry.resolveCorridor({class:'unknown-new-route'}),
    registry.resolveSurface({class:'unknown-new-surface'},'landuse'),
  ];
  for(const resolved of unexpected){
    assert.equal(resolved.fallback,true);
    assert.equal(resolved.fallbackAllowed,false);
    assert.equal(resolved.fallbackReason,'unexpected-generic');
  }
});

test('family接続済みtypeはfallback監査対象にならずresolver metadataへ同じ契約が流れる',()=>{
  const known=registry.resolvePoi({class:'shop',subclass:'bakery'},registry.referencePack);
  assert.deepEqual({
    fallback:known.fallback,key:known.fallbackKey,allowed:known.fallbackAllowed,reason:known.fallbackReason,
  },{fallback:false,key:null,allowed:false,reason:null});
  const allowed=resolver.resolveAsset({class:'clinic'},registry.referencePack);
  assert.deepEqual({
    fallback:allowed.fallback,key:allowed.fallbackKey,allowed:allowed.fallbackAllowed,reason:allowed.fallbackReason,
  },{fallback:true,key:'clinic',allowed:true,reason:'allowlisted-generic'});
});

test('map診断はPOI・corridor・surfaceのallowlisted／unexpectedを別集計する',()=>{
  for(const field of [
    'assetAllowlistedFallbacks','assetUnexpectedFallbacks','assetUnexpectedFallbackTypes',
    'allowlistedFallbacks','unexpectedFallbacks','unexpectedFallbackTypes',
  ]) assert.match(map,new RegExp(`${field}:`),field);
  assert.match(map,/if\(STANDALONE_UNIFIED_STYLE\)\{[\s\S]*document\.documentElement\.dataset\.fallbackAudit=unexpectedFallbackTotal \? 'fail' : 'pass'/);
  assert.match(map,/assetFallbackKey:explicitLandmarkAsset \? null : assetBinding\.fallbackKey/);
  assert.match(map,/assetFallbackAllowed:explicitLandmarkAsset \? false : assetBinding\.fallbackAllowed/);
  assert.match(map,/assetFallbackReason:explicitLandmarkAsset \? 'explicit-landmark-asset' : assetBinding\.fallbackReason/);
});
