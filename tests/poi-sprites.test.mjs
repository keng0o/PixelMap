import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/facility-resolver.js');
await import('../assets/poi-sprites.js');

const resolver = globalThis.PixelMapFacilityResolver;
const catalog = globalThis.PixelMapPoiSprites;
const inspiredIds = ['monument','castle','gallery','theatre','zoo','charge_hub'];
const candidateIds = ['office','civic_hall','burger_stand','grand_station','owl_library',
  'university','college','wing_post','art_museum','menagerie'];
const popIds = ['pop_office','pop_townhall','pop_fastfood','pop_station','pop_library',
  'pop_university','pop_college','pop_post','pop_art_museum','pop_zoo'];

test('参照イメージを取り入れた6アセットが実際のPOI属性へ割り当てられる', () => {
  assert.equal(resolver.CLASS2SPRITE.monument, 'monument');
  assert.equal(resolver.CLASS2SPRITE.castle, 'castle');
  assert.equal(resolver.CLASS2SPRITE.art_gallery, 'gallery');
  assert.equal(resolver.CLASS2SPRITE.theatre, 'theatre');
  assert.equal(resolver.CLASS2SPRITE.zoo, 'zoo');
  assert.equal(resolver.CLASS2SPRITE.charging_station, 'charge_hub');
});

test('assets.html用カタログは52点・新テイスト26点でマッピング欠落がない', () => {
  assert.equal(catalog.assets.length, 52);
  assert.deepEqual(
    catalog.assets.filter(asset => asset.inspired).map(asset => asset.id),
    [...inspiredIds, ...candidateIds, ...popIds],
  );
  assert.deepEqual(
    catalog.assets.filter(asset => asset.taste === 'pop').map(asset => asset.id),
    popIds,
  );
  const assetIds = new Set(catalog.assets.map(asset => asset.id));
  for(const spriteId of Object.values(resolver.CLASS2SPRITE)) assert.ok(assetIds.has(spriteId), spriteId);
  for(const asset of catalog.assets) assert.equal(typeof asset.categoryLabel, 'string');
});

test('新テイスト候補20点はアセットのみで、マップのPOI属性へは未接続', () => {
  const wired = new Set(Object.values(resolver.CLASS2SPRITE));
  for(const id of [...candidateIds, ...popIds]){
    assert.ok(catalog.assets.some(asset => asset.id === id && asset.inspired), id);
    assert.ok(!wired.has(id), `${id} はCLASS2SPRITEに接続しない`);
  }
});

test('現行マップの描画辞書にも新作6アセットが実装されている', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  const spriteBlock = html.slice(html.indexOf('const SPRITES = {'), html.indexOf('// 施設の分類・重要度・サイズ判定'));
  for(const id of inspiredIds) assert.match(spriteBlock, new RegExp(`\\n\\s*${id}\\s*:`), id);
});
