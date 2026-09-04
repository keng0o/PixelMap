import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../variants/map-11-illustrated-reference-material-lab.html', import.meta.url), 'utf8');

test('彩色地図素材labは参考・Canvas・50%重ね合わせを同じ原寸cropから比較する', () => {
  assert.match(page, /切り抜いた参考素材/);
  assert.match(page, /Canvas primitive/);
  assert.match(page, /50%重ね合わせ/);
  assert.match(page, /image-rendering:\s*pixelated/);
  assert.match(page, /materials\.paintAsset/);
  assert.match(page, /params\.get\('asset'\)/);
  assert.match(page, /params\.get\('reference'\)/);
  assert.match(page, /asset\.source\.crop\.x/);
  assert.match(page, /asset\.source\.crop\.y/);
  assert.match(page, /asset\.referenceClipPath/);
  assert.match(page, /data-review-sheet/);
  assert.match(page, /data-download-review/);
  assert.match(page, /download="illustrated-reference-review\.png"/);
  assert.match(page, /params\.get\('reviewSink'\)/);
  assert.match(page, /sinkUrl\.hostname === '127\.0\.0\.1'/);
  assert.match(page, /rejected-non-local/);
  assert.match(page, /fetch\(sinkUrl, \{ method: 'POST', body: blob \}\)/);
  assert.match(page, /reviewContext\.drawImage\(image, crop\.x, crop\.y, width, height/);
  assert.match(page, /document\.body\.dataset\.reviewSheet = 'ready'/);
});

test('参考画像はqueryからだけ読み込み、公開repo内bitmapへ依存しない', () => {
  assert.doesNotMatch(page, /d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa|image-1\.jpg/);
  assert.match(page, /image\.src = referenceUrl/);
  assert.match(page, /usage|ローカルQA/);
  assert.match(page, /illustrated-reference-materials\.js\?v=illustrated-reference-3/);
});
