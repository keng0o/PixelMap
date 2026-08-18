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
  assert.equal(typeof catalog.draw, 'function');
  assert.equal(typeof catalog.measure, 'function');
});

test('全POIのS/M/L実寸が透明描画の外接矩形と一致する', () => {
  for(const asset of catalog.assets){
    for(const size of asset.sizes){
      const measured=catalog.measure(asset.id,size);
      assert.ok(Number.isInteger(measured.width) && measured.width>0, `${asset.id}:${size} width`);
      assert.ok(Number.isInteger(measured.height) && measured.height>0, `${asset.id}:${size} height`);
      assert.equal(measured.width,measured.right-measured.left,`${asset.id}:${size} horizontal bounds`);
      assert.equal(measured.height,measured.bottom-measured.top,`${asset.id}:${size} vertical bounds`);

      let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
      const offsetX=73,offsetY=59;
      catalog.draw({
        fillStyle:'#000000',
        fillRect(x,y,width,height){
          left=Math.min(left,Math.floor(x));top=Math.min(top,Math.floor(y));
          right=Math.max(right,Math.ceil(x+width));bottom=Math.max(bottom,Math.ceil(y+height));
        },
      },asset.id,offsetX,offsetY,size);
      assert.deepEqual(
        {left:left-offsetX,top:top-offsetY,right:right-offsetX,bottom:bottom-offsetY},
        {left:measured.left,top:measured.top,right:measured.right,bottom:measured.bottom},
        `${asset.id}:${size}`,
      );
    }
  }
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

test('しろポップ10点はテスト用マップだけに接続される', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  for(const id of popIds) assert.ok(html.includes(id), id);
  assert.match(html, /TEST_MODE \? 'pop' : 'reference'/);
  assert.match(html, /TEST_MODE && key\.startsWith\('pop_'\)/);
});
