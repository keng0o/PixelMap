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

test('全52件が同じPOI Asset Contractを持ち、role・ground anchor・実測boundsに欠落がない', () => {
  assert.equal(catalog.contractVersion, 'pixelmap-poi-asset/1');
  const allowedRoles = new Set(['structure','object','marker']);
  const roleCounts = {structure:0,object:0,marker:0};
  for(const asset of catalog.assets){
    assert.equal(asset.contractVersion, catalog.contractVersion, asset.id);
    assert.ok(allowedRoles.has(asset.semanticRole), `${asset.id} semanticRole`);
    roleCounts[asset.semanticRole]++;
    assert.equal(asset.renderer, 'pixel-procedural', `${asset.id} renderer`);
    assert.equal(asset.assetPixelScale, 2, `${asset.id} scale`);
    assert.deepEqual(asset.anchor, {kind:'ground-center',x:0,y:0}, `${asset.id} anchor`);
    assert.equal(asset.boundsSource, 'measured-draw-output', `${asset.id} boundsSource`);
    for(const size of asset.sizes){
      const contract = catalog.contract(asset.id,size);
      assert.equal(contract.id, asset.id);
      assert.equal(contract.size, size);
      assert.equal(contract.semanticRole, asset.semanticRole);
      assert.deepEqual(contract.anchor, asset.anchor);
      assert.deepEqual(contract.bounds, catalog.measure(asset.id,size));
    }
  }
  assert.ok(roleCounts.structure > 0);
  assert.ok(roleCounts.object > 0);
  assert.ok(roleCounts.marker > 0);
});

test('各POIはmobile renderer向けに同じ描画矩形命令を公開する', () => {
  for(const asset of catalog.assets){
    for(const size of asset.sizes){
      const commands=catalog.commands(asset.id,size);
      assert.ok(commands.length>0,`${asset.id}:${size}`);
      assert.ok(commands.every(command =>
        Number.isFinite(command.x+command.y+command.width+command.height) &&
        command.width>0 && command.height>0 && typeof command.color==='string'),`${asset.id}:${size}`);
      assert.equal(catalog.commands(asset.id,size),commands,`${asset.id}:${size} cache`);
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

test('現行マップは重複描画辞書を持たず、新作6点を含む正本カタログだけを描く', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /const SPRITES = \{/);
  assert.match(html, /const POI_SPRITE_CATALOG = window\.PixelMapPoiSprites/);
  assert.match(html, /POI_SPRITE_CATALOG\.draw\(/);
  for(const id of inspiredIds) assert.ok(catalog.assets.some(asset => asset.id === id), id);
});

test('しろポップ10点はアセット候補に残すがマップへは接続しない', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  for(const id of popIds) assert.ok(catalog.assets.some(asset => asset.id === id), id);
  for(const id of popIds) assert.ok(!html.includes(id), `${id} はマップへ接続しない`);
  assert.match(html, /dataset\.assetTaste = 'reference'/);
  assert.doesNotMatch(html, /TEST_MODE|TEST_POP_SPRITES/);
});
