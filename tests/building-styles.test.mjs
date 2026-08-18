import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/building-styles.js';
import '../assets/icon-patterns.js';

const STYLES = globalThis.PixelMapBuildingStyles;
const appearance = input => STYLES.buildingAppearance(input);

test('高さバンドの閾値', () => {
  assert.equal(appearance({ heightM:0 }).band, 1);
  assert.equal(appearance({ heightM:9.9 }).band, 1);
  assert.equal(appearance({ heightM:10 }).band, 2);
  assert.equal(appearance({ heightM:30.9 }).band, 2);
  assert.equal(appearance({ heightM:31 }).band, 3);
  assert.equal(appearance({ heightM:59.9 }).band, 3);
  assert.equal(appearance({ heightM:60 }).band, 4);
  assert.equal(appearance({ heightM:60 }).roofKey, 'roofHigh');
  assert.equal(appearance({ heightM:31 }).roofKey, 'roofMid');
});

test('面積クラス: 低層の大型はbigBox/campusの屋根になる', () => {
  assert.equal(appearance({ heightM:5, areaCells:27 }).areaClass, 'S');
  assert.equal(appearance({ heightM:5, areaCells:28 }).roofKey, 'roofBigBox');
  assert.equal(appearance({ heightM:15, areaCells:30 }).roofKey, 'roofBigBox');
  assert.equal(appearance({ heightM:5, areaCells:60 }).roofKey, 'roofCampus');
  // 高さ31m以上なら面積より高さが勝つ
  assert.equal(appearance({ heightM:35, areaCells:100 }).band, 3);
  assert.equal(appearance({ heightM:35, areaCells:100 }).roofKey, 'roofMid');
});

test('低層陸屋根と切妻住宅の分岐', () => {
  const flat = appearance({ heightM:12, areaCells:6, seed:1 });
  assert.equal(flat.band, 2);
  assert.match(flat.roofKey, /^roofFlat:[0-2]$/);
  assert.equal(flat.motif, 'tank');
  const house = appearance({ heightM:4, areaCells:6, seed:1 });
  assert.equal(house.band, 1);
  assert.match(house.roofKey, /^roofGable:[0-9]$/);
  assert.equal(house.isHouse, true);
});

test('kind強制: 病院・コンビニ・雑居ビル', () => {
  const hospital = appearance({ heightM:5, areaCells:10, kind:'hospital', category:'health' });
  assert.equal(hospital.roofKey, 'roofBigBox');
  assert.equal(hospital.accent, '#ef4444');
  const convenience = appearance({ heightM:40, areaCells:4, kind:'convenience', category:'food' });
  assert.equal(convenience.roofKey, 'roofGable:4');
  assert.equal(convenience.accent, '#f59e0b');
  const mixed = appearance({ heightM:5, areaCells:10, kind:'mixed', category:'commerce' });
  assert.equal(mixed.roofKey, 'roofMid');
  assert.equal(mixed.wallKey, 'tower');
});

test('カテゴリのaccentとglyph: 10カテゴリ全部・normalはnull', () => {
  for (const [category, hex] of Object.entries(STYLES.CATEGORY_ACCENTS)){
    const desc = appearance({ heightM:5, kind:'poi', category });
    assert.equal(desc.accent, hex);
    assert.equal(desc.glyph, category);
  }
  const normal = appearance({ heightM:5, kind:'normal', category:'food' });
  assert.equal(normal.accent, null);
  assert.equal(normal.glyph, null);
});

test('決定性: 同入力→同出力、住宅の配色はシードだけで決まる', () => {
  const input = { heightM:4, areaCells:9, kind:'poi', category:'stay', seed:12345 };
  assert.deepEqual(appearance(input), appearance(input));
  const a = appearance({ heightM:4, areaCells:5, seed:777 });
  const b = appearance({ heightM:4, areaCells:20, seed:777 });
  assert.equal(a.roofKey, b.roofKey);   // 面積が変わっても（S内なら）色は変わらない
  assert.equal(STYLES.seedFromKey('r:1,2,3,4'), STYLES.seedFromKey('r:1,2,3,4'));
});

test('カテゴリ色はicon-patternsのパターン07パレットと同一', () => {
  const pattern07 = globalThis.PixelMapIconPatterns.find(p => p.id === '07');
  assert.deepEqual(STYLES.CATEGORY_ACCENTS, pattern07.palette);
});
