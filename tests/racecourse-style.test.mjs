import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('競馬場専用色はstandaloneと本番1・2・4マップへ適用する', () => {
  assert.match(html, /function isRacecourseLandmarkProps\(props = \{\}\)/);
  assert.match(html, /value === 'horse_racing' \|\| value === 'racetrack'/);
  assert.match(html, /name\.includes\('競馬場'\)/);
  assert.match(html, /const kind = isRacecourseLandmarkProps\(props\) \? 'racecourse' : 'normal'/);
});

test('全Webマップは競馬場パレットを含む建物スタイル最新版を読む', () => {
  assert.match(html, /assets\/building-styles\.js\?v=4/);
});

test('standaloneの競馬場敷地だけを暗緑の地表面とし、本番は変更しない', () => {
  assert.match(html, /function facilitySiteSurfacePalette\(kind\)/);
  assert.match(html, /!EMBEDDED && kind === 'racecourse'/);
  assert.match(html, /BUILDING_STYLES\.RACECOURSE_PALETTE/);
  assert.match(html, /facilityFootprintLayer\.bldGrid/);
  assert.match(html, /facilityFootprintLayer\.buildingKinds/);
  assert.match(html, /facilityFootprintLayer\.racecourseGrid/);
  assert.match(html, /if \(buildingKinds\[bi\] === 'racecourse'\) racecourseGrid\[index\] = 1/);
});
