import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('競馬場専用色はstandalone testだけへ適用する', () => {
  assert.match(html, /function isRacecourseLandmarkProps\(props = \{\}\)/);
  assert.match(html, /value === 'horse_racing' \|\| value === 'racetrack'/);
  assert.match(html, /name\.includes\('競馬場'\)/);
  assert.match(html, /kind:!EMBEDDED && isRacecourseLandmarkProps\(props\) \? 'racecourse' : 'normal'/);
});

test('standalone testは競馬場パレットを含む建物スタイル最新版を読む', () => {
  assert.match(html, /assets\/building-styles\.js\?v=4/);
});
