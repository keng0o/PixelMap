import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/building-styles.js';
import '../assets/icon-patterns.js';

const STYLES = globalThis.PixelMapBuildingStyles;
const appearance = input => STYLES.buildingAppearance(input);
const dense = (candidates, gapCells = 1) => STYLES.selectDenseBuildings(candidates, { gapCells });

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
  assert.equal(appearance({ heightM:31 }).heightM, 31);
});

test('高さの2.5D持ち上げ量は平方根で圧縮し、上限を持つ', () => {
  assert.equal(STYLES.heightRiseLogicalPixels(0), 0);
  assert.equal(STYLES.heightRiseLogicalPixels(-3), 0);
  assert.equal(STYLES.heightRiseLogicalPixels(10), 4);
  assert.equal(STYLES.heightRiseLogicalPixels(30), 7);
  assert.equal(STYLES.heightRiseLogicalPixels(60), 10);
  assert.equal(STYLES.heightRiseLogicalPixels(100), 13);
  assert.equal(STYLES.heightRiseLogicalPixels(300), 18);
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

test('kind強制: 競馬場・病院・コンビニ・雑居ビル', () => {
  const racecourse = appearance({ heightM:0, areaCells:100, kind:'racecourse' });
  assert.equal(racecourse.roofKey, 'roofCampus');
  assert.deepEqual(racecourse.pal, STYLES.RACECOURSE_PALETTE);
  assert.deepEqual(STYLES.RACECOURSE_PALETTE, ['#315c3b','#1f3f29','#4f7d58']);
  assert.equal(racecourse.wallKey, 'low');
  assert.equal(racecourse.motif, null);
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

test('密集建物: 1セル以内では面積が大きい棟だけを残す', () => {
  const visible = dense([
    { id:'small', key:'small', area:4, cells:[[1, 1]] },
    { id:'large', key:'large', area:20, cells:[[2, 1]] },
  ]);
  assert.deepEqual([...visible], ['large']);
});

test('密集建物: 斜め1セルは競合し、2セル以上離れれば両方残す', () => {
  const diagonal = dense([
    { id:'a', key:'a', area:10, cells:[[0, 0]] },
    { id:'b', key:'b', area:5, cells:[[1, 1]] },
  ]);
  assert.deepEqual([...diagonal], ['a']);
  const separated = dense([
    { id:'a', key:'a', area:10, cells:[[0, 0]] },
    { id:'b', key:'b', area:5, cells:[[2, 0]] },
  ]);
  assert.deepEqual([...separated], ['a', 'b']);
});

test('密集建物: 同面積は安定キー順、保護建物は小さくても残る', () => {
  const tied = dense([
    { id:'z', key:'z', area:10, cells:[[0, 0]] },
    { id:'a', key:'a', area:10, cells:[[1, 0]] },
  ]);
  assert.deepEqual([...tied], ['a']);
  const protectedVisible = dense([
    { id:'station', key:'station', area:1, cells:[[0, 0]], protected:true },
    { id:'large', key:'large', area:100, cells:[[1, 0]] },
  ]);
  assert.deepEqual([...protectedVisible], ['station']);
});

test('密集建物: 保護建物同士は近接していても共存する', () => {
  const visible = dense([
    { id:'station', key:'station', area:1, cells:[[0, 0]], protected:true },
    { id:'hospital', key:'hospital', area:1, cells:[[1, 0]], protected:true },
  ]);
  assert.deepEqual([...visible], ['hospital', 'station']);
});

test('カテゴリ色はicon-patternsのパターン07パレットと同一', () => {
  const pattern07 = globalThis.PixelMapIconPatterns.find(p => p.id === '07');
  assert.deepEqual(STYLES.CATEGORY_ACCENTS, pattern07.palette);
});
