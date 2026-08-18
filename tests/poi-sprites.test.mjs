import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/facility-resolver.js');
await import('../assets/poi-sprites.js');

const resolver = globalThis.PixelMapFacilityResolver;
const catalog = globalThis.PixelMapPoiSprites;
const inspiredIds = ['monument','castle','gallery','theatre','zoo','charge_hub'];

test('参照イメージを取り入れた6アセットが実際のPOI属性へ割り当てられる', () => {
  assert.equal(resolver.CLASS2SPRITE.monument, 'monument');
  assert.equal(resolver.CLASS2SPRITE.castle, 'castle');
  assert.equal(resolver.CLASS2SPRITE.art_gallery, 'gallery');
  assert.equal(resolver.CLASS2SPRITE.theatre, 'theatre');
  assert.equal(resolver.CLASS2SPRITE.zoo, 'zoo');
  assert.equal(resolver.CLASS2SPRITE.charging_station, 'charge_hub');
});

test('assets.html用カタログは32点・参照テイスト6点でマッピング欠落がない', () => {
  assert.equal(catalog.assets.length, 32);
  assert.deepEqual(catalog.assets.filter(asset => asset.inspired).map(asset => asset.id), inspiredIds);
  const assetIds = new Set(catalog.assets.map(asset => asset.id));
  for(const spriteId of Object.values(resolver.CLASS2SPRITE)) assert.ok(assetIds.has(spriteId), spriteId);
  for(const asset of catalog.assets) assert.equal(typeof asset.categoryLabel, 'string');
});

test('現行マップの描画辞書にも新作6アセットが実装されている', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  const spriteBlock = html.slice(html.indexOf('const SPRITES = {'), html.indexOf('// 施設の分類・重要度・サイズ判定'));
  for(const id of inspiredIds) assert.match(spriteBlock, new RegExp(`\\n\\s*${id}\\s*:`), id);
});
