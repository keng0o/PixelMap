import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('テスト用マップはpixel=1/2だけを受け付け、1を既定値にする', () => {
  assert.match(html, /PAGE_PARAMS\.get\('pixel'\) === '2' \? 2 : 1/);
  assert.match(html, /dataset\.pixelRequestedScale = String\(REQUESTED_PIXEL_SCALE\)/);
  assert.match(html, /pixelRequestedScale:REQUESTED_PIXEL_SCALE/);
});

test('1536pxシーンを768px論理ドット面へ最近傍で確定変換する', () => {
  assert.match(html, /const SCENE_SIZE = 1536/);
  assert.match(html, /const PRESENTATION_SIZE = SCENE_SIZE \/ 2/);
  assert.match(html, /presentationCtx\.imageSmoothingEnabled = false/);
  assert.match(html, /presentationCtx\.drawImage\([\s\S]*?SCENE_SIZE, SCENE_SIZE,[\s\S]*?PRESENTATION_SIZE, PRESENTATION_SIZE/);
});

test('施設の構成ドットはテストモードだけ2シーンpxへ固定する', () => {
  assert.match(html, /const spritePixelScale = TEST_MODE \? 2 : 3 \* visualScale/);
  assert.match(html, /ctx\.scale\(spritePixelScale, spritePixelScale\)/);
});

test('本番埋め込みにはテスト用表示CSSを適用しない', () => {
  assert.match(html, /html\[data-map-mode="test"\] #map/);
  assert.doesNotMatch(html, /html\[data-map-mode="production"\][^{]*#map/);
});
