window.PIXEL_ASSET_GROUPS = (window.PIXEL_ASSET_GROUPS || []);

window.PIXEL_ASSET_GROUPS.push({
  id: 'homes',
  label: '住宅・小規模建築',
  description: '素朴な村や島の景観に合う、外形の異なる小さな建物のドット絵セット。',
  assets: [
    {
      id: 'home-gable-front',
      name: '正面切妻の家',
      category: '住宅',
      keywords: ['切妻', '一軒家', '村の家'],
      shape: 'gable-front-narrow-porch',
      draw(p) {
        p.rect(12, 20, 29, 20, p.c.outline);
        p.rect(14, 21, 25, 17, p.c.wall);
        p.rect(16, 34, 21, 4, p.c.wallShade);
        p.poly([[8, 21], [24, 6], [43, 21], [40, 24], [24, 11], [12, 24]], p.c.outline);
        p.poly([[12, 20], [24, 9], [40, 20], [37, 21], [24, 13], [15, 22]], p.c.roof);
        p.line(24, 10, 40, 20, p.c.roofLight, 2);
        p.rect(22, 25, 7, 14, p.c.outline);
        p.rect(24, 27, 4, 11, p.c.door);
        p.dot(27, 32, p.c.gold);
        p.rect(15, 25, 6, 7, p.c.outline);
        p.rect(17, 27, 3, 3, p.c.window);
        p.rect(32, 25, 6, 7, p.c.outline);
        p.rect(33, 27, 3, 3, p.c.glass);
        p.rect(10, 39, 32, 3, p.c.outline);
        p.rect(14, 39, 24, 1, p.c.stone);
      }
    },
    {
      id: 'home-hipped-square',
      name: '寄棟屋根の家',
      category: '住宅',
      keywords: ['寄棟', '四角', '平屋'],
      shape: 'hipped-square-wide-eaves',
      draw(p) {
        p.poly([[10, 20], [39, 20], [39, 39], [25, 44], [10, 38]], p.c.outline);
        p.poly([[12, 22], [37, 22], [37, 37], [25, 41], [12, 36]], p.c.wall);
        p.poly([[5, 18], [20, 5], [37, 8], [45, 20], [25, 29]], p.c.outline);
        p.poly([[9, 18], [21, 8], [35, 10], [41, 19], [25, 25]], p.c.roofDark);
        p.poly([[21, 8], [25, 25], [9, 18]], p.c.roof);
        p.poly([[21, 8], [35, 10], [41, 19], [25, 25]], p.c.roofLight);
        p.rect(22, 29, 7, 13, p.c.outline);
        p.rect(24, 31, 4, 10, p.c.door);
        p.rect(14, 27, 6, 6, p.c.outline);
        p.rect(16, 29, 3, 3, p.c.glass);
        p.rect(32, 26, 5, 6, p.c.outline);
        p.rect(33, 28, 3, 3, p.c.window);
        p.line(11, 36, 25, 42, p.c.wallShade, 2);
      }
    },
    {
      id: 'home-l-courtyard',
      name: 'L字中庭の家',
      category: '住宅',
      keywords: ['L字', '中庭', '角家'],
      shape: 'l-courtyard-two-wings',
      draw(p) {
        p.poly([[7, 18], [24, 18], [24, 28], [41, 28], [41, 42], [20, 42], [20, 34], [7, 34]], p.c.outline);
        p.poly([[9, 20], [22, 20], [22, 30], [39, 30], [39, 40], [22, 40], [22, 32], [9, 32]], p.c.wall);
        p.poly([[4, 18], [15, 7], [27, 18], [23, 22], [15, 13], [8, 21]], p.c.outline);
        p.poly([[8, 17], [15, 10], [24, 18], [21, 19], [15, 14], [10, 20]], p.c.roof);
        p.poly([[19, 28], [29, 18], [45, 29], [40, 33], [29, 24], [23, 31]], p.c.outline);
        p.poly([[23, 27], [29, 21], [42, 29], [39, 30], [29, 25], [25, 30]], p.c.roofDark);
        p.rect(11, 23, 5, 6, p.c.outline);
        p.rect(12, 25, 3, 3, p.c.window);
        p.rect(27, 32, 6, 9, p.c.outline);
        p.rect(29, 34, 3, 7, p.c.door);
        p.rect(34, 33, 4, 5, p.c.outline);
        p.rect(35, 34, 2, 3, p.c.glass);
        p.rect(12, 35, 8, 2, p.c.stone);
        p.rect(10, 37, 10, 2, p.c.stoneDark);
      }
    },
    {
      id: 'home-longhouse',
      name: '村の長屋',
      category: '住宅',
      keywords: ['長屋', '共同住宅', '横長'],
      shape: 'longhouse-side-ridge-three-doors',
      draw(p) {
        p.poly([[5, 20], [38, 13], [45, 20], [45, 39], [12, 45], [5, 38]], p.c.outline);
        p.poly([[8, 22], [38, 16], [42, 22], [42, 37], [13, 42], [8, 36]], p.c.wall);
        p.poly([[2, 18], [12, 8], [38, 4], [47, 17], [39, 20], [37, 10], [13, 14], [7, 22]], p.c.outline);
        p.poly([[6, 18], [13, 11], [36, 7], [43, 16], [39, 17], [36, 11], [14, 15], [9, 20]], p.c.roof);
        p.line(14, 14, 37, 9, p.c.roofLight, 2);
        p.rect(11, 26, 6, 15, p.c.outline);
        p.rect(13, 28, 3, 12, p.c.door);
        p.rect(23, 23, 6, 15, p.c.outline);
        p.rect(25, 25, 3, 12, p.c.door);
        p.rect(35, 21, 6, 14, p.c.outline);
        p.rect(37, 23, 3, 11, p.c.door);
        p.dot(15, 33, p.c.gold);
        p.dot(27, 30, p.c.gold);
        p.dot(39, 28, p.c.gold);
        p.line(7, 37, 13, 42, p.c.wallShade, 2);
      }
    },
    {
      id: 'home-tower-house',
      name: '塔屋付き住宅',
      category: '住宅',
      keywords: ['塔屋', '縦長', '見張り窓'],
      shape: 'tall-tower-house-capped-roof',
      draw(p) {
        p.rect(15, 13, 20, 31, p.c.outline);
        p.rect(18, 15, 14, 26, p.c.wall);
        p.rect(27, 16, 5, 25, p.c.wallShade);
        p.poly([[10, 14], [25, 2], [40, 14], [36, 18], [25, 8], [14, 18]], p.c.outline);
        p.poly([[15, 13], [25, 5], [36, 14], [33, 15], [25, 10], [18, 16]], p.c.roofDark);
        p.rect(20, 17, 10, 7, p.c.outline);
        p.rect(22, 19, 2, 3, p.c.glass);
        p.rect(26, 19, 2, 3, p.c.glass);
        p.rect(20, 27, 10, 6, p.c.outline);
        p.rect(22, 29, 6, 2, p.c.window);
        p.rect(21, 35, 8, 9, p.c.outline);
        p.rect(23, 37, 5, 7, p.c.door);
        p.line(17, 25, 33, 25, p.c.stoneDark, 2);
        p.line(17, 34, 33, 34, p.c.stone, 1);
        p.rect(13, 43, 24, 3, p.c.outline);
      }
    },
    {
      id: 'home-crooked-chimney',
      name: '大煙突の家',
      category: '住宅',
      keywords: ['煙突', '暖炉', '石造り'],
      shape: 'crooked-chimney-offset-cottage',
      draw(p) {
        p.rect(10, 22, 30, 19, p.c.outline);
        p.rect(13, 24, 24, 15, p.c.wall);
        p.rect(30, 24, 7, 15, p.c.wallShade);
        p.rect(31, 5, 8, 20, p.c.outline);
        p.rect(33, 7, 4, 16, p.c.stone);
        p.rect(30, 4, 10, 5, p.c.outline);
        p.rect(33, 5, 5, 2, p.c.stoneDark);
        p.poly([[6, 22], [21, 9], [43, 23], [39, 27], [21, 15], [11, 26]], p.c.outline);
        p.poly([[11, 21], [21, 12], [39, 23], [36, 24], [21, 17], [14, 24]], p.c.roof);
        p.line(20, 13, 38, 23, p.c.roofLight, 2);
        p.rect(16, 28, 6, 6, p.c.outline);
        p.rect(18, 30, 3, 3, p.c.glass);
        p.rect(27, 29, 7, 12, p.c.outline);
        p.rect(29, 31, 4, 9, p.c.door);
        p.rect(8, 40, 34, 3, p.c.outline);
      }
    },
    {
      id: 'home-split-level',
      name: '段差屋根の家',
      category: '住宅',
      keywords: ['段差屋根', '増築', '二棟'],
      shape: 'split-level-stepped-volumes',
      draw(p) {
        p.rect(5, 25, 22, 16, p.c.outline);
        p.rect(8, 27, 17, 12, p.c.wallShade);
        p.rect(22, 17, 21, 25, p.c.outline);
        p.rect(25, 19, 15, 21, p.c.wall);
        p.poly([[2, 25], [13, 15], [29, 25], [25, 29], [13, 21], [7, 29]], p.c.outline);
        p.poly([[7, 24], [13, 18], [25, 25], [23, 26], [13, 23], [10, 27]], p.c.roofDark);
        p.poly([[18, 17], [31, 5], [46, 17], [42, 21], [31, 11], [24, 21]], p.c.outline);
        p.poly([[23, 16], [31, 8], [42, 17], [39, 18], [31, 13], [27, 19]], p.c.roof);
        p.rect(10, 30, 6, 6, p.c.outline);
        p.rect(12, 32, 3, 3, p.c.window);
        p.rect(28, 23, 7, 7, p.c.outline);
        p.rect(30, 25, 4, 3, p.c.glass);
        p.rect(32, 32, 7, 10, p.c.outline);
        p.rect(34, 34, 4, 8, p.c.door);
        p.rect(4, 41, 40, 3, p.c.outline);
      }
    },
    {
      id: 'home-twin-gables',
      name: '双子切妻の家',
      category: '住宅',
      keywords: ['双子屋根', '二世帯', '連結'],
      shape: 'twin-gables-asymmetric-peaks',
      draw(p) {
        p.rect(5, 22, 37, 20, p.c.outline);
        p.rect(8, 24, 31, 16, p.c.wall);
        p.poly([[2, 22], [13, 8], [25, 22], [21, 26], [13, 15], [7, 26]], p.c.outline);
        p.poly([[7, 21], [13, 11], [21, 22], [19, 23], [13, 16], [10, 24]], p.c.roof);
        p.poly([[19, 22], [31, 4], [46, 23], [41, 27], [31, 11], [24, 27]], p.c.outline);
        p.poly([[24, 21], [31, 8], [42, 23], [39, 24], [31, 13], [27, 24]], p.c.roofDark);
        p.line(31, 8, 42, 23, p.c.roofLight, 2);
        p.rect(10, 27, 6, 6, p.c.outline);
        p.rect(12, 29, 3, 3, p.c.window);
        p.rect(27, 27, 7, 6, p.c.outline);
        p.rect(29, 29, 4, 2, p.c.glass);
        p.rect(18, 32, 8, 10, p.c.outline);
        p.rect(20, 34, 5, 8, p.c.door);
        p.line(21, 24, 21, 40, p.c.wallShade, 2);
        p.rect(4, 41, 39, 3, p.c.outline);
      }
    },
    {
      id: 'home-stilt-house',
      name: '水辺の高床家屋',
      category: '住宅',
      keywords: ['高床', '水辺', 'デッキ'],
      shape: 'stilt-house-raised-deck-ladder',
      draw(p) {
        p.rect(8, 18, 30, 19, p.c.outline);
        p.rect(11, 20, 24, 14, p.c.wall);
        p.poly([[4, 18], [20, 6], [43, 19], [38, 23], [20, 12], [9, 22]], p.c.outline);
        p.poly([[9, 17], [20, 9], [39, 19], [36, 20], [20, 14], [12, 20]], p.c.roofDark);
        p.line(20, 9, 38, 19, p.c.roofLight, 2);
        p.rect(14, 24, 6, 6, p.c.outline);
        p.rect(16, 26, 3, 3, p.c.window);
        p.rect(27, 24, 7, 11, p.c.outline);
        p.rect(29, 26, 4, 9, p.c.door);
        p.rect(5, 34, 38, 4, p.c.outline);
        p.rect(8, 35, 32, 1, p.c.trunk);
        p.rect(9, 37, 4, 9, p.c.outline);
        p.rect(10, 38, 2, 8, p.c.trunk);
        p.rect(34, 37, 4, 9, p.c.outline);
        p.rect(35, 38, 2, 8, p.c.trunk);
        p.line(23, 36, 18, 46, p.c.outline, 3);
        p.line(27, 36, 24, 46, p.c.outline, 3);
        p.line(20, 41, 25, 41, p.c.cream, 1);
      }
    },
    {
      id: 'home-round-hut',
      name: '八角形の丸屋',
      category: '住宅',
      keywords: ['八角', '円錐屋根', '小屋'],
      shape: 'octagonal-hut-conical-roof',
      draw(p) {
        p.poly([[10, 24], [17, 18], [32, 18], [40, 25], [37, 39], [30, 44], [18, 44], [9, 37]], p.c.outline);
        p.poly([[13, 26], [19, 21], [30, 21], [37, 27], [34, 37], [29, 41], [19, 41], [12, 35]], p.c.wall);
        p.poly([[5, 24], [24, 3], [44, 25], [37, 29], [24, 12], [12, 29]], p.c.outline);
        p.poly([[10, 23], [24, 7], [39, 24], [36, 25], [24, 14], [14, 26]], p.c.roof);
        p.poly([[24, 7], [39, 24], [36, 25], [24, 14]], p.c.roofLight);
        p.rect(21, 29, 8, 15, p.c.outline);
        p.rect(23, 31, 4, 11, p.c.door);
        p.dot(26, 36, p.c.gold);
        p.rect(13, 28, 6, 6, p.c.outline);
        p.rect(15, 30, 3, 3, p.c.window);
        p.rect(31, 28, 5, 6, p.c.outline);
        p.rect(32, 30, 3, 3, p.c.glass);
        p.line(12, 36, 19, 41, p.c.wallShade, 2);
      }
    },
    {
      id: 'home-gatehouse',
      name: '門くぐりの家',
      category: '住宅',
      keywords: ['門屋', 'アーチ', '路地'],
      shape: 'gatehouse-arched-passage',
      draw(p) {
        p.rect(5, 18, 38, 24, p.c.outline);
        p.rect(8, 20, 32, 20, p.c.wall);
        p.poly([[2, 18], [14, 7], [25, 14], [34, 6], [47, 19], [42, 23], [33, 12], [25, 19], [14, 13], [7, 22]], p.c.outline);
        p.poly([[7, 17], [14, 10], [25, 17], [34, 9], [43, 19], [40, 20], [34, 14], [25, 21], [14, 15], [10, 20]], p.c.roofDark);
        p.poly([[17, 42], [17, 31], [20, 27], [25, 25], [30, 27], [33, 31], [33, 42]], p.c.outline);
        p.poly([[21, 40], [21, 32], [23, 29], [25, 28], [28, 30], [30, 33], [30, 40]], p.c.shadow);
        p.rect(10, 24, 6, 6, p.c.outline);
        p.rect(12, 26, 3, 3, p.c.window);
        p.rect(35, 24, 5, 6, p.c.outline);
        p.rect(36, 26, 3, 3, p.c.glass);
        p.rect(7, 39, 11, 4, p.c.stoneDark);
        p.rect(32, 39, 11, 4, p.c.stoneDark);
      }
    },
    {
      id: 'home-wheel-cottage',
      name: '水車小屋',
      category: '住宅',
      keywords: ['水車', '川辺', '作業小屋'],
      shape: 'wheel-cottage-side-paddle',
      draw(p) {
        p.rect(14, 20, 28, 20, p.c.outline);
        p.rect(17, 22, 22, 16, p.c.wallShade);
        p.poly([[10, 20], [26, 6], [46, 21], [41, 25], [26, 12], [15, 24]], p.c.outline);
        p.poly([[15, 19], [26, 9], [42, 21], [39, 22], [26, 14], [18, 22]], p.c.roof);
        p.rect(28, 26, 7, 14, p.c.outline);
        p.rect(30, 28, 4, 11, p.c.door);
        p.rect(19, 25, 6, 6, p.c.outline);
        p.rect(21, 27, 3, 3, p.c.window);
        p.poly([[4, 27], [9, 23], [15, 24], [19, 29], [18, 37], [13, 43], [6, 41], [2, 35]], p.c.outline);
        p.poly([[7, 29], [10, 27], [14, 28], [16, 31], [15, 36], [12, 39], [8, 38], [5, 34]], p.c.trunk);
        p.line(10, 25, 11, 41, p.c.cream, 2);
        p.line(3, 34, 18, 33, p.c.cream, 2);
        p.dot(11, 33, p.c.outline);
        p.line(13, 42, 42, 42, p.c.water, 2);
        p.line(18, 45, 38, 45, p.c.water, 1);
      }
    },
    {
      id: 'home-thatch-farmhouse',
      name: '厚い茅葺きの農家',
      category: '住宅',
      keywords: ['荅葺き', '農家', '軒下'],
      shape: 'deep-thatch-farmhouse-low-walls',
      draw(p) {
        p.rect(7, 27, 35, 14, p.c.outline);
        p.rect(10, 29, 29, 10, p.c.wall);
        p.poly([[2, 27], [11, 8], [30, 5], [47, 27], [41, 32], [29, 13], [14, 16], [8, 32]], p.c.outline);
        p.poly([[7, 26], [14, 12], [28, 9], [42, 27], [39, 28], [27, 15], [16, 18], [11, 29]], p.c.roofLight);
        p.poly([[14, 12], [28, 9], [42, 27], [38, 25], [27, 15], [16, 18]], p.c.roof);
        p.line(11, 23, 38, 20, p.c.roofDark, 2);
        p.line(9, 27, 41, 27, p.c.roofDark, 2);
        p.rect(18, 30, 6, 10, p.c.outline);
        p.rect(20, 32, 3, 8, p.c.door);
        p.rect(29, 31, 7, 5, p.c.outline);
        p.rect(31, 33, 4, 2, p.c.window);
        p.rect(5, 40, 39, 3, p.c.outline);
        p.rect(9, 40, 31, 1, p.c.trunk);
        p.rect(10, 42, 3, 4, p.c.outline);
        p.rect(36, 42, 3, 4, p.c.outline);
      }
    },
    {
      id: 'home-boathouse',
      name: '桟橋付きボートハウス',
      category: '住宅',
      keywords: ['船屋', '桟橋', '湾'],
      shape: 'boathouse-slipway-long-pier',
      draw(p) {
        p.rect(6, 16, 30, 21, p.c.outline);
        p.rect(9, 18, 24, 17, p.c.wallShade);
        p.poly([[2, 16], [18, 5], [40, 17], [35, 21], [18, 11], [7, 20]], p.c.outline);
        p.poly([[7, 15], [18, 8], [36, 17], [33, 19], [18, 13], [10, 18]], p.c.roofDark);
        p.rect(13, 24, 17, 13, p.c.outline);
        p.poly([[16, 35], [16, 28], [21, 24], [27, 28], [27, 35]], p.c.shadow);
        p.line(21, 25, 21, 35, p.c.stoneDark, 1);
        p.rect(4, 37, 41, 4, p.c.outline);
        p.rect(7, 38, 35, 1, p.c.trunk);
        p.rect(37, 40, 5, 7, p.c.outline);
        p.rect(38, 41, 3, 6, p.c.trunk);
        p.line(5, 43, 32, 43, p.c.water, 2);
        p.line(10, 46, 28, 46, p.c.water, 1);
        p.rect(10, 20, 5, 5, p.c.outline);
        p.rect(11, 22, 3, 2, p.c.glass);
      }
    },
    {
      id: 'home-rowhouses',
      name: '段違いの三軒長屋',
      category: '住宅',
      keywords: ['テラスハウス', '三軒', '段差'],
      shape: 'three-rowhouses-stepped-facades',
      draw(p) {
        p.rect(4, 22, 13, 19, p.c.outline);
        p.rect(7, 24, 8, 15, p.c.wallShade);
        p.rect(16, 17, 15, 25, p.c.outline);
        p.rect(19, 19, 9, 21, p.c.wall);
        p.rect(30, 12, 14, 31, p.c.outline);
        p.rect(33, 14, 8, 27, p.c.wallShade);
        p.poly([[2, 22], [10, 13], [19, 22], [16, 25], [10, 18], [6, 25]], p.c.outline);
        p.poly([[14, 17], [23, 8], [33, 17], [30, 20], [23, 13], [18, 20]], p.c.outline);
        p.poly([[28, 12], [37, 3], [47, 12], [44, 16], [37, 8], [32, 16]], p.c.outline);
        p.poly([[6, 21], [10, 16], [16, 22], [14, 23], [10, 20], [8, 23]], p.c.roofDark);
        p.poly([[19, 16], [23, 11], [30, 17], [28, 18], [23, 15], [21, 18]], p.c.roof);
        p.poly([[33, 11], [37, 6], [44, 12], [41, 14], [37, 10], [35, 14]], p.c.roofLight);
        p.rect(9, 30, 5, 11, p.c.outline);
        p.rect(21, 28, 6, 14, p.c.outline);
        p.rect(35, 25, 6, 18, p.c.outline);
        p.rect(10, 32, 3, 9, p.c.door);
        p.rect(23, 30, 3, 11, p.c.door);
        p.rect(37, 27, 3, 14, p.c.door);
        p.line(17, 21, 17, 40, p.c.stoneDark, 1);
        p.line(31, 16, 31, 41, p.c.stoneDark, 1);
      }
    },
    {
      id: 'home-earth-shelter',
      name: '土手の半地下住宅',
      category: '住宅',
      keywords: ['半地下', '草屋根', '丘'],
      shape: 'earth-shelter-grass-mound-round-door',
      draw(p) {
        p.poly([[3, 34], [6, 21], [13, 12], [24, 8], [35, 12], [43, 21], [46, 35], [41, 41], [8, 41]], p.c.outline);
        p.poly([[7, 33], [10, 22], [16, 16], [24, 12], [33, 16], [39, 23], [42, 34], [39, 37], [10, 37]], p.c.grassDark);
        p.poly([[10, 26], [15, 17], [25, 13], [34, 18], [39, 27], [37, 30], [25, 24], [13, 31]], p.c.grass);
        p.rect(12, 31, 25, 11, p.c.outline);
        p.rect(15, 33, 19, 7, p.c.wall);
        p.poly([[18, 42], [18, 33], [21, 28], [25, 26], [30, 29], [33, 34], [33, 42]], p.c.outline);
        p.poly([[22, 40], [22, 34], [24, 31], [26, 30], [29, 33], [30, 35], [30, 40]], p.c.door);
        p.dot(28, 35, p.c.gold);
        p.rect(10, 29, 7, 6, p.c.outline);
        p.rect(12, 31, 4, 3, p.c.window);
        p.rect(35, 29, 6, 6, p.c.outline);
        p.rect(36, 31, 3, 3, p.c.glass);
        p.dot(17, 17, p.c.leafLight);
        p.dot(32, 19, p.c.leaf);
        p.rect(7, 40, 36, 3, p.c.stoneDark);
      }
    },
    {
      id: 'home-a-frame',
      name: 'Aフレームの山小屋',
      category: '住宅',
      keywords: ['Aフレーム', '山小屋', '急勾配'],
      shape: 'a-frame-full-triangle-balcony',
      draw(p) {
        p.poly([[3, 41], [23, 3], [45, 41]], p.c.outline);
        p.poly([[9, 38], [23, 9], [39, 38]], p.c.wall);
        p.poly([[3, 41], [23, 3], [26, 8], [10, 42]], p.c.roofDark);
        p.poly([[23, 3], [45, 41], [39, 38], [23, 10]], p.c.roof);
        p.line(24, 8, 41, 39, p.c.roofLight, 2);
        p.rect(17, 19, 14, 10, p.c.outline);
        p.poly([[20, 26], [20, 21], [24, 17], [28, 21], [28, 26]], p.c.glass);
        p.line(24, 18, 24, 27, p.c.outline, 2);
        p.rect(12, 29, 25, 4, p.c.outline);
        p.rect(15, 30, 19, 1, p.c.trunk);
        p.line(15, 31, 15, 36, p.c.outline, 2);
        p.line(34, 31, 34, 36, p.c.outline, 2);
        p.rect(21, 31, 8, 11, p.c.outline);
        p.rect(23, 33, 4, 9, p.c.door);
        p.rect(7, 41, 35, 4, p.c.outline);
        p.rect(12, 42, 25, 1, p.c.stone);
      }
    },
    {
      id: 'home-roof-terrace',
      name: '屋上テラスの家',
      category: '住宅',
      keywords: ['平屋根', 'テラス', '外階段'],
      shape: 'flat-roof-terrace-external-stairs',
      draw(p) {
        p.poly([[8, 14], [34, 9], [42, 15], [42, 39], [16, 44], [8, 38]], p.c.outline);
        p.poly([[11, 17], [33, 13], [39, 17], [39, 37], [17, 41], [11, 36]], p.c.wall);
        p.poly([[6, 13], [33, 8], [44, 15], [17, 21]], p.c.outline);
        p.poly([[11, 13], [32, 10], [39, 14], [17, 18]], p.c.roofLight);
        p.rect(8, 8, 3, 9, p.c.outline);
        p.rect(39, 9, 3, 8, p.c.outline);
        p.line(10, 9, 40, 9, p.c.outline, 2);
        p.line(16, 8, 16, 13, p.c.outline, 1);
        p.line(24, 7, 24, 12, p.c.outline, 1);
        p.line(32, 7, 32, 11, p.c.outline, 1);
        p.rect(27, 23, 7, 7, p.c.outline);
        p.rect(29, 25, 4, 3, p.c.glass);
        p.rect(16, 25, 7, 17, p.c.outline);
        p.rect(18, 27, 4, 14, p.c.door);
        p.line(40, 25, 46, 38, p.c.outline, 3);
        p.line(37, 31, 44, 44, p.c.outline, 3);
        p.line(39, 34, 44, 34, p.c.stone, 1);
        p.line(41, 39, 46, 39, p.c.stone, 1);
      }
    },
    {
      id: 'home-u-courtyard',
      name: 'U字囲みの家',
      category: '住宅',
      keywords: ['U字', '囲み庭', '三棟'],
      shape: 'u-courtyard-three-wings-open-front',
      draw(p) {
        p.poly([[5, 14], [17, 14], [17, 24], [32, 24], [32, 14], [44, 14], [44, 42], [32, 42], [32, 32], [17, 32], [17, 42], [5, 42]], p.c.outline);
        p.poly([[8, 17], [14, 17], [14, 27], [35, 27], [35, 17], [41, 17], [41, 39], [35, 39], [35, 29], [14, 29], [14, 39], [8, 39]], p.c.wall);
        p.poly([[2, 14], [11, 5], [21, 14], [17, 18], [11, 11], [6, 18]], p.c.outline);
        p.poly([[28, 14], [38, 4], [47, 14], [43, 18], [38, 10], [33, 18]], p.c.outline);
        p.poly([[13, 24], [24, 15], [36, 24], [32, 28], [24, 21], [18, 28]], p.c.outline);
        p.poly([[7, 13], [11, 8], [17, 14], [15, 15], [11, 13], [9, 16]], p.c.roof);
        p.poly([[33, 13], [38, 7], [44, 14], [41, 15], [38, 12], [36, 16]], p.c.roofDark);
        p.poly([[18, 23], [24, 18], [32, 24], [30, 25], [24, 22], [21, 26]], p.c.roofLight);
        p.rect(9, 27, 5, 12, p.c.outline);
        p.rect(36, 27, 5, 12, p.c.outline);
        p.rect(22, 27, 6, 6, p.c.outline);
        p.rect(24, 29, 3, 3, p.c.window);
        p.rect(18, 34, 14, 2, p.c.stone);
        p.rect(20, 38, 10, 2, p.c.grassDark);
      }
    },
    {
      id: 'home-cliff-lodge',
      name: '張り出しデッキの家',
      category: '住宅',
      keywords: ['崖', '張り出し', 'ロッジ'],
      shape: 'cantilever-lodge-deep-view-deck',
      draw(p) {
        p.rect(5, 17, 28, 20, p.c.outline);
        p.rect(8, 19, 22, 16, p.c.wallShade);
        p.poly([[2, 17], [16, 5], [38, 18], [33, 22], [16, 11], [7, 21]], p.c.outline);
        p.poly([[7, 16], [16, 8], [34, 18], [31, 20], [16, 13], [10, 19]], p.c.roof);
        p.rect(11, 23, 7, 7, p.c.outline);
        p.rect(13, 25, 4, 3, p.c.glass);
        p.rect(22, 22, 7, 14, p.c.outline);
        p.rect(24, 24, 4, 11, p.c.door);
        p.poly([[4, 35], [45, 29], [47, 34], [9, 42]], p.c.outline);
        p.poly([[9, 36], [42, 31], [43, 33], [11, 39]], p.c.trunk);
        p.line(8, 33, 8, 40, p.c.outline, 2);
        p.line(18, 33, 18, 38, p.c.outline, 2);
        p.line(29, 31, 29, 36, p.c.outline, 2);
        p.line(40, 29, 40, 34, p.c.outline, 2);
        p.line(9, 42, 13, 47, p.c.outline, 3);
        p.line(42, 35, 43, 43, p.c.outline, 3);
        p.poly([[3, 44], [12, 40], [20, 45], [15, 47], [5, 47]], p.c.stoneDark);
      }
    }
  ]
});
