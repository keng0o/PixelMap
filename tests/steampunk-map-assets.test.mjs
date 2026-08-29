import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/steampunk-map-assets.js');

const ASSETS = globalThis.PixelMapSteampunkMapAssets;

test('強度3の機械都市素材集は大型シルエットを独立ピクセル素材として持つ', () => {
  assert.equal(ASSETS.version, 'pixelmap-steampunk-map-assets/1');
  assert.equal(ASSETS.semantic, false);
  assert.equal(ASSETS.sourceGeometryImmutable, true);
  for (const id of [
    'boiler-stack','gas-holder','gear-tower','water-tank','pipe-organ','duct-crown',
    'turbine-hall','steam-plume','pipe-bridge','valve-station','rail-gantry','cooling-outlet',
  ]) assert.ok(ASSETS.sprites[id], id);
  assert.ok(Object.keys(ASSETS.sprites).length >= 12);
});

test('全素材は単色原子セル・非意味装飾・既知palette tokenだけで構成する', () => {
  const ids = new Set();
  for (const sprite of Object.values(ASSETS.sprites)){
    assert.equal(ids.has(sprite.id), false, sprite.id);
    ids.add(sprite.id);
    assert.equal(sprite.semantic, false, sprite.id);
    assert.ok(sprite.cells.length >= 4, sprite.id);
    assert.ok(sprite.bounds.width >= 3, sprite.id);
    assert.ok(sprite.bounds.height >= 3, sprite.id);
    for (const [x, y, token] of sprite.cells){
      assert.equal(Number.isInteger(x) && Number.isInteger(y), true, `${sprite.id}: integer cell`);
      assert.equal(ASSETS.paletteTokens.includes(token), true, `${sprite.id}: ${token}`);
    }
  }
});

test('建物構成はseedで決定的になり高層・大規模ほど素材を積層する', () => {
  const low = ASSETS.compositionFor({ seed:412, band:1, areaClass:'S', kind:'normal' });
  const high = ASSETS.compositionFor({ seed:412, band:4, areaClass:'L', kind:'normal' });
  assert.deepEqual(low, ASSETS.compositionFor({ seed:412, band:1, areaClass:'S', kind:'normal' }));
  assert.ok(low.roof.length >= 1);
  assert.ok(high.roof.length >= 4);
  assert.ok(high.facade.length >= 2);
  assert.ok(high.steam.length >= 2);
  assert.ok(high.complexity > low.complexity);
  assert.equal(high.semantic, false);
});

test('宗教建物と競馬場は専用シルエットを機械素材で上書きしない', () => {
  for (const kind of ['religious_shinto','religious_buddhist','racecourse']){
    const composition = ASSETS.compositionFor({ seed:99, band:4, areaClass:'L', kind });
    assert.equal(composition.enabled, false);
    assert.deepEqual(composition.roof, []);
  }
});

test('道路・鉄道・水際は用途別の大型設備poolを持つ', () => {
  assert.deepEqual(ASSETS.corridorPools.rail, ['rail-gantry','pipe-bridge']);
  assert.equal(ASSETS.corridorPools.majorRoads.includes('pipe-bridge'), true);
  assert.equal(ASSETS.corridorPools.localRoads.includes('valve-station'), true);
  assert.deepEqual(ASSETS.surfacePools.water, ['cooling-outlet','steam-plume']);
});
