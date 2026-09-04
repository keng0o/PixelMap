import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../variants/map-10-top-down-material-lab.html', import.meta.url), 'utf8');

test('素材labは参考・Canvas・50%重ね合わせを原寸から同倍率で比較する', () => {
  assert.match(page, /切り抜いた参考素材/);
  assert.match(page, /Canvas primitive/);
  assert.match(page, /50%重ね合わせ/);
  assert.match(page, /image-rendering:\s*pixelated/);
  assert.match(page, /materials\.paintAsset/);
  assert.match(page, /params\.get\('asset'\)/);
  assert.match(page, /params\.get\('reference'\)/);
});

test('参考cropはqueryでだけ読み込みrepo内bitmapへ依存しない', () => {
  assert.doesNotMatch(page, /Photo-1\.jpg|reference-materials\//);
  assert.match(page, /reference\.src = referenceUrl/);
  assert.match(page, /reference\.style\.clipPath = asset\.referenceClipPath/);
  assert.match(page, /usage|ローカルQA/);
  assert.match(page, /top-down-game-materials\.js\?v=reference-material-4/);
});
