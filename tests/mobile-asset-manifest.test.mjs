import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest=JSON.parse(await readFile(
  new URL('../assets/mobile-asset-manifest.json',import.meta.url),'utf8'));
const buildSource=await readFile(new URL('../build.mjs',import.meta.url),'utf8');
const assetsHtml=await readFile(new URL('../assets.html',import.meta.url),'utf8');

test('mobile manifestはWebと同じ3契約・compositor・全アセットを公開する', () => {
  assert.equal(manifest.schema,'pixelmap-mobile-asset-manifest/1');
  assert.deepEqual(manifest.contracts,{
    poi:'pixelmap-poi-asset/1',
    corridor:'pixelmap-corridor-asset/1',
    corridorRenderer:'pixelmap-corridor-renderer/3',
  });
  assert.deepEqual(manifest.compositor,
    ['area','structure','corridor','bridge','object','marker','dot-cluster']);
  assert.equal(manifest.poiAssets.length,62);
  assert.equal(Object.keys(manifest.corridors).length,21);
  assert.equal(new Set(manifest.poiAssets.map(asset=>asset.id)).size,62);
});

test('東京ランドマーク10点はMobile JSONでも3×3論理px単色セル契約を保つ', () => {
  const tokyoIds = new Set(['tokyo_tower','tokyo_skytree','kaminarimon','tokyo_station','national_diet',
    'tokyo_metropolitan_government','shibuya_scramble','rainbow_bridge','kabukiza','tokyo_dome']);
  const tokyoAssets = manifest.poiAssets.filter(asset => tokyoIds.has(asset.id));
  assert.equal(tokyoAssets.length,10);
  for(const asset of tokyoAssets){
    assert.equal(asset.renderer,'solid-cell-grid',asset.id);
    assert.deepEqual(asset.cellGrid,{width:3,height:3,unit:'logical-pixel',fill:'solid-color'},asset.id);
    assert.ok(asset.sizes.M.rectangles.every(rect =>
      rect.width===3 && rect.height===3 && rect.x%3===0 && rect.y%3===0),asset.id);
  }
});

test('POI矩形命令はground-center相対・RGBAでbounds内に収まる', () => {
  for(const asset of manifest.poiAssets){
    assert.ok(['structure','object','marker'].includes(asset.semanticRole),asset.id);
    for(const size of asset.availableSizes){
      const entry=asset.sizes[size];
      assert.deepEqual(entry.anchor,{kind:'ground-center',x:0,y:0},`${asset.id}:${size}`);
      assert.ok(entry.rectangles.length>0,`${asset.id}:${size}`);
      for(const rect of entry.rectangles){
        assert.equal(rect.rgba.length,4,`${asset.id}:${size}`);
        assert.ok(rect.rgba.every(channel=>Number.isInteger(channel) && channel>=0 && channel<=255),
          `${asset.id}:${size}`);
        assert.ok(rect.x>=entry.bounds.left && rect.y>=entry.bounds.top,`${asset.id}:${size}`);
        assert.ok(rect.x+rect.width<=entry.bounds.right && rect.y+rect.height<=entry.bounds.bottom,
          `${asset.id}:${size}`);
      }
    }
  }
});

test('manifestはbuild時に機械生成されカタログから取得できる', () => {
  assert.match(buildSource,/generate-mobile-asset-manifest\.mjs/);
  assert.match(assetsHtml,/href="assets\/mobile-asset-manifest\.json">Mobile JSON<\/a>/);
});
