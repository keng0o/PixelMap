(function () {
  'use strict';

  window.PIXEL_ASSET_GROUPS = (window.PIXEL_ASSET_GROUPS || []);
  window.PIXEL_ASSET_GROUPS.push({
    id: 'transport',
    label: '交通・インフラ',
    description: '橋や鉄道、乗り物、港湾設備、道路設備、発電設備をまとめた交通・インフラ用ドット絵です。',
    assets: [
      {
        id: 'stone-arch-bridge',
        name: '石造アーチ橋',
        category: '交通',
        keywords: ['橋', '石橋', '川', '道路'],
        shape: 'wide-stone-bridge-two-arches',
        draw(p) {
          const c = p.c;
          p.poly([[3, 17], [34, 10], [45, 17], [14, 25]], c.outline);
          p.poly([[5, 17], [34, 12], [43, 17], [14, 23]], c.stone);
          p.line(10, 18, 38, 13, c.stoneDark, 2);
          p.line(15, 21, 42, 16, c.cream, 1);
          p.poly([[4, 20], [14, 27], [14, 38], [4, 31]], c.outline);
          p.poly([[36, 15], [45, 19], [45, 31], [36, 27]], c.outline);
          p.rect(14, 23, 22, 14, c.outline);
          p.poly([[6, 22], [12, 26], [12, 34], [6, 30]], c.stone);
          p.poly([[38, 18], [43, 20], [43, 28], [38, 26]], c.stone);
          p.rect(15, 24, 20, 11, c.stone);
          p.poly([[17, 35], [18, 29], [21, 26], [25, 26], [28, 29], [29, 35]], c.outline);
          p.poly([[19, 35], [20, 30], [22, 28], [24, 28], [27, 31], [27, 35]], c.water);
          p.line(31, 25, 34, 34, c.stoneDark, 2);
          p.line(8, 25, 11, 27, c.cream, 1);
        }
      },
      {
        id: 'timber-pier',
        name: '木の桟橋',
        category: '交通',
        keywords: ['桟橋', '船着場', '木道', '港'],
        shape: 'long-timber-pier-with-side-posts',
        draw(p) {
          const c = p.c;
          p.poly([[17, 4], [31, 8], [25, 42], [9, 36]], c.outline);
          p.poly([[19, 6], [29, 9], [23, 39], [12, 35]], c.trunk);
          p.line(17, 11, 28, 14, c.cream, 1);
          p.line(15, 17, 27, 20, c.roofDark, 2);
          p.line(14, 24, 25, 27, c.cream, 1);
          p.line(12, 31, 24, 34, c.roofDark, 2);
          p.rect(8, 12, 3, 25, c.outline);
          p.rect(9, 13, 1, 22, c.roofDark);
          p.rect(31, 10, 3, 25, c.outline);
          p.rect(32, 12, 1, 21, c.roofDark);
          p.rect(6, 10, 6, 4, c.outline);
          p.rect(7, 10, 4, 2, c.trunk);
          p.rect(30, 8, 6, 4, c.outline);
          p.rect(31, 8, 4, 2, c.trunk);
          p.line(10, 17, 31, 14, c.outline, 1);
          p.line(10, 22, 30, 20, c.outline, 1);
        }
      },
      {
        id: 'branching-railway',
        name: '分岐線路',
        category: '交通',
        keywords: ['線路', '鉄道', '分岐', 'レール'],
        shape: 'y-switch-railway-with-sleepers',
        draw(p) {
          const c = p.c;
          p.line(20, 45, 22, 22, c.outline, 3);
          p.line(31, 45, 27, 22, c.outline, 3);
          p.line(22, 22, 7, 5, c.outline, 3);
          p.line(27, 22, 19, 5, c.outline, 3);
          p.line(25, 21, 31, 5, c.outline, 3);
          p.line(28, 22, 43, 8, c.outline, 3);
          p.line(21, 44, 23, 23, c.stone, 1);
          p.line(30, 44, 26, 23, c.stone, 1);
          p.line(23, 21, 8, 5, c.stone, 1);
          p.line(26, 21, 19, 5, c.stone, 1);
          p.line(26, 21, 32, 5, c.stone, 1);
          p.line(29, 22, 43, 9, c.stone, 1);
          p.line(16, 41, 35, 41, c.trunk, 3);
          p.line(17, 35, 34, 35, c.trunk, 3);
          p.line(18, 29, 32, 29, c.trunk, 3);
          p.line(17, 22, 31, 22, c.trunk, 3);
          p.line(11, 15, 25, 12, c.trunk, 3);
          p.line(6, 8, 21, 5, c.trunk, 3);
          p.line(27, 15, 39, 18, c.trunk, 3);
          p.line(30, 8, 44, 11, c.trunk, 3);
          p.rect(23, 20, 4, 4, c.gold);
        }
      },
      {
        id: 'rail-crossing',
        name: '鉄道踏切',
        category: '交通',
        keywords: ['踏切', '線路', '遮断機', '警報機'],
        shape: 'crossbuck-gate-over-diagonal-track',
        draw(p) {
          const c = p.c;
          p.line(5, 37, 39, 8, c.outline, 4);
          p.line(11, 43, 45, 14, c.outline, 4);
          p.line(6, 36, 40, 7, c.stone, 1);
          p.line(12, 44, 46, 15, c.stone, 1);
          p.line(8, 42, 3, 35, c.trunk, 3);
          p.line(17, 36, 12, 29, c.trunk, 3);
          p.line(26, 28, 21, 21, c.trunk, 3);
          p.line(35, 20, 30, 13, c.trunk, 3);
          p.line(44, 13, 39, 6, c.trunk, 3);
          p.rect(7, 12, 5, 29, c.outline);
          p.rect(8, 14, 3, 25, c.cream);
          p.rect(8, 17, 3, 5, c.roofDark);
          p.rect(8, 27, 3, 5, c.roofDark);
          p.line(10, 17, 39, 28, c.outline, 5);
          p.line(11, 17, 38, 27, c.cream, 3);
          p.rect(17, 20, 5, 3, c.roofDark);
          p.rect(29, 24, 5, 3, c.roofDark);
          p.line(5, 5, 16, 14, c.outline, 3);
          p.line(16, 5, 5, 14, c.outline, 3);
          p.rect(6, 15, 8, 7, c.outline);
          p.dot(8, 18, c.roofLight);
          p.dot(12, 18, c.roofLight);
        }
      },
      {
        id: 'covered-station-platform',
        name: '屋根付き駅ホーム',
        category: '交通',
        keywords: ['駅', 'ホーム', '鉄道', '待合所'],
        shape: 'isometric-platform-long-canopy',
        draw(p) {
          const c = p.c;
          p.poly([[4, 30], [31, 20], [45, 27], [17, 39]], c.outline);
          p.poly([[7, 30], [31, 22], [42, 27], [17, 36]], c.stone);
          p.line(10, 32, 34, 24, c.cream, 2);
          p.poly([[8, 16], [30, 8], [42, 15], [19, 24]], c.outline);
          p.poly([[10, 16], [30, 10], [39, 15], [19, 21]], c.roof);
          p.poly([[19, 21], [39, 15], [39, 19], [19, 25]], c.roofDark);
          p.line(14, 20, 14, 31, c.outline, 3);
          p.line(35, 16, 35, 27, c.outline, 3);
          p.line(15, 20, 15, 30, c.cream, 1);
          p.line(36, 17, 36, 26, c.cream, 1);
          p.rect(22, 16, 10, 7, c.outline);
          p.rect(23, 17, 8, 5, c.wall);
          p.rect(25, 18, 4, 2, c.window);
          p.line(7, 38, 20, 43, c.outline, 3);
          p.line(20, 43, 44, 33, c.outline, 3);
        }
      },
      {
        id: 'tram-shelter',
        name: '路面電車停留所',
        category: '交通',
        keywords: ['停留所', '路面電車', '待合所', '電停'],
        shape: 'glass-shelter-with-tall-stop-pole',
        draw(p) {
          const c = p.c;
          p.poly([[5, 15], [26, 8], [37, 14], [16, 22]], c.outline);
          p.poly([[7, 15], [26, 10], [34, 14], [16, 19]], c.roof);
          p.poly([[16, 19], [34, 14], [34, 18], [16, 23]], c.roofDark);
          p.line(8, 16, 8, 36, c.outline, 3);
          p.line(33, 16, 33, 34, c.outline, 3);
          p.poly([[9, 20], [31, 15], [31, 31], [9, 36]], c.outline);
          p.poly([[11, 21], [29, 17], [29, 29], [11, 33]], c.glass);
          p.line(20, 19, 20, 32, c.outline, 2);
          p.rect(14, 27, 13, 4, c.outline);
          p.rect(16, 25, 3, 7, c.trunk);
          p.rect(24, 23, 3, 7, c.trunk);
          p.rect(39, 7, 4, 34, c.outline);
          p.rect(40, 9, 2, 30, c.stone);
          p.rect(36, 5, 10, 10, c.outline);
          p.rect(38, 7, 6, 6, c.wall);
          p.rect(40, 8, 2, 4, c.window);
          p.rect(36, 40, 10, 4, c.outline);
        }
      },
      {
        id: 'city-bus',
        name: '路線バス',
        category: '交通',
        keywords: ['バス', '車両', '道路', '公共交通'],
        shape: 'long-bus-round-nose-roof-box',
        draw(p) {
          const c = p.c;
          p.poly([[5, 16], [31, 10], [43, 17], [43, 31], [17, 39], [5, 31]], c.outline);
          p.poly([[7, 17], [31, 12], [41, 18], [16, 24]], c.wall);
          p.poly([[16, 24], [41, 18], [41, 29], [16, 36]], c.wallShade);
          p.rect(7, 18, 9, 12, c.wall);
          p.poly([[9, 18], [16, 17], [16, 23], [9, 25]], c.glass);
          p.poly([[18, 19], [25, 17], [25, 23], [18, 25]], c.window);
          p.poly([[27, 16], [33, 14], [38, 17], [31, 20]], c.window);
          p.rect(8, 27, 6, 4, c.roof);
          p.rect(19, 31, 7, 5, c.door);
          p.line(22, 30, 22, 35, c.outline, 1);
          p.rect(29, 10, 6, 3, c.outline);
          p.rect(30, 10, 4, 2, c.cream);
          p.rect(8, 31, 10, 4, c.outline);
          p.rect(34, 28, 9, 4, c.outline);
          p.rect(10, 34, 7, 5, c.outline);
          p.rect(11, 35, 5, 3, c.stoneDark);
          p.rect(34, 31, 7, 5, c.outline);
          p.rect(35, 32, 5, 3, c.stoneDark);
          p.dot(39, 26, c.gold);
        }
      },
      {
        id: 'freight-wagon',
        name: '貨物貨車',
        category: '交通',
        keywords: ['貨車', '鉄道', '貨物', '車両'],
        shape: 'short-boxcar-ribbed-sides',
        draw(p) {
          const c = p.c;
          p.poly([[5, 15], [30, 9], [43, 16], [18, 23]], c.outline);
          p.poly([[8, 15], [30, 11], [40, 16], [18, 20]], c.roofDark);
          p.poly([[6, 16], [18, 23], [18, 36], [6, 29]], c.outline);
          p.poly([[18, 23], [43, 16], [43, 30], [18, 37]], c.outline);
          p.poly([[8, 18], [16, 23], [16, 33], [8, 28]], c.roof);
          p.poly([[20, 24], [41, 19], [41, 28], [20, 34]], c.roof);
          p.poly([[26, 22], [36, 20], [36, 30], [26, 33]], c.roofDark);
          p.line(23, 23, 23, 34, c.cream, 1);
          p.line(39, 19, 39, 29, c.cream, 1);
          p.line(27, 27, 35, 25, c.gold, 2);
          p.line(27, 29, 35, 27, c.gold, 2);
          p.rect(9, 32, 12, 5, c.outline);
          p.rect(34, 29, 10, 5, c.outline);
          p.rect(10, 35, 8, 5, c.outline);
          p.rect(11, 36, 6, 3, c.stoneDark);
          p.rect(35, 32, 7, 5, c.outline);
          p.rect(36, 33, 5, 3, c.stoneDark);
          p.line(2, 31, 7, 31, c.outline, 3);
          p.line(43, 30, 47, 30, c.outline, 3);
        }
      },
      {
        id: 'island-ferry',
        name: '島めぐりフェリー',
        category: '交通',
        keywords: ['船', 'フェリー', '港', '海'],
        shape: 'double-deck-ferry-pointed-bow',
        draw(p) {
          const c = p.c;
          p.poly([[3, 28], [35, 21], [46, 27], [37, 39], [13, 42]], c.outline);
          p.poly([[6, 29], [35, 23], [43, 27], [36, 36], [14, 39]], c.wall);
          p.poly([[14, 34], [39, 29], [36, 36], [14, 39]], c.roofDark);
          p.line(8, 33, 37, 27, c.cream, 2);
          p.poly([[12, 17], [31, 13], [40, 18], [19, 23]], c.outline);
          p.poly([[14, 18], [31, 15], [37, 18], [19, 21]], c.roof);
          p.rect(15, 20, 22, 11, c.outline);
          p.poly([[17, 21], [36, 18], [36, 27], [17, 31]], c.wall);
          p.poly([[20, 21], [25, 20], [25, 25], [20, 26]], c.window);
          p.poly([[28, 19], [33, 18], [33, 23], [28, 24]], c.window);
          p.rect(24, 7, 4, 9, c.outline);
          p.rect(25, 8, 2, 7, c.stone);
          p.line(27, 8, 36, 13, c.outline, 1);
          p.line(25, 8, 18, 15, c.outline, 1);
          p.rect(22, 5, 8, 4, c.outline);
          p.rect(23, 5, 6, 2, c.roofDark);
          p.dot(40, 29, c.gold);
          p.line(8, 43, 38, 40, c.water, 2);
        }
      },
      {
        id: 'canal-lock',
        name: '運河の水門',
        category: '交通',
        keywords: ['水門', '運河', '閘門', '水路'],
        shape: 'paired-lock-gates-between-stone-piers',
        draw(p) {
          const c = p.c;
          p.poly([[3, 12], [12, 8], [17, 11], [17, 39], [8, 43], [3, 39]], c.outline);
          p.poly([[5, 13], [12, 10], [15, 12], [15, 37], [8, 40], [5, 38]], c.stone);
          p.poly([[31, 11], [39, 7], [45, 11], [45, 38], [37, 42], [31, 38]], c.outline);
          p.poly([[33, 12], [39, 9], [43, 12], [43, 36], [37, 39], [33, 37]], c.stone);
          p.poly([[15, 18], [24, 23], [24, 41], [15, 36]], c.outline);
          p.poly([[33, 17], [24, 23], [24, 41], [33, 36]], c.outline);
          p.poly([[17, 19], [23, 23], [23, 38], [17, 35]], c.trunk);
          p.poly([[31, 19], [25, 23], [25, 38], [31, 35]], c.trunk);
          p.line(18, 23, 23, 26, c.gold, 2);
          p.line(30, 23, 25, 26, c.gold, 2);
          p.line(18, 31, 23, 34, c.gold, 2);
          p.line(30, 31, 25, 34, c.gold, 2);
          p.rect(9, 5, 6, 7, c.outline);
          p.rect(10, 6, 4, 5, c.stoneDark);
          p.line(12, 6, 23, 18, c.outline, 2);
          p.rect(38, 4, 6, 6, c.outline);
          p.rect(39, 5, 4, 4, c.stoneDark);
          p.line(41, 6, 26, 19, c.outline, 2);
        }
      },
      {
        id: 'water-tower',
        name: '給水塔',
        category: '交通',
        keywords: ['給水塔', '鉄道設備', 'タンク', '水道'],
        shape: 'elevated-round-tank-four-legs',
        draw(p) {
          const c = p.c;
          p.poly([[10, 10], [24, 5], [38, 10], [24, 16]], c.outline);
          p.poly([[12, 10], [24, 7], [36, 10], [24, 13]], c.stone);
          p.rect(10, 10, 28, 11, c.outline);
          p.poly([[12, 11], [24, 14], [36, 11], [36, 18], [24, 22], [12, 18]], c.water);
          p.poly([[12, 18], [24, 22], [36, 18], [32, 25], [16, 25]], c.outline);
          p.poly([[16, 20], [24, 23], [32, 20], [30, 23], [18, 23]], c.stoneDark);
          p.line(17, 24, 12, 43, c.outline, 4);
          p.line(31, 24, 36, 43, c.outline, 4);
          p.line(22, 24, 21, 43, c.outline, 3);
          p.line(27, 24, 28, 43, c.outline, 3);
          p.line(15, 31, 33, 31, c.outline, 2);
          p.line(14, 38, 35, 38, c.outline, 2);
          p.line(13, 39, 31, 27, c.stone, 1);
          p.line(35, 39, 17, 27, c.stone, 1);
          p.rect(8, 42, 9, 3, c.outline);
          p.rect(32, 42, 9, 3, c.outline);
          p.line(39, 13, 43, 13, c.outline, 2);
          p.line(43, 13, 43, 30, c.outline, 2);
        }
      },
      {
        id: 'wind-turbine',
        name: '風力発電機',
        category: '交通',
        keywords: ['風力発電', '発電設備', '風車', '電力'],
        shape: 'three-blade-turbine-tapered-mast',
        draw(p) {
          const c = p.c;
          p.poly([[21, 18], [27, 18], [30, 44], [17, 44]], c.outline);
          p.poly([[23, 19], [25, 19], [27, 42], [20, 42]], c.stone);
          p.rect(15, 42, 16, 4, c.outline);
          p.poly([[20, 16], [22, 2], [26, 2], [27, 16]], c.outline);
          p.poly([[22, 15], [23, 4], [25, 4], [25, 16]], c.cream);
          p.poly([[27, 17], [42, 11], [45, 14], [30, 21]], c.outline);
          p.poly([[29, 18], [41, 13], [42, 14], [30, 20]], c.cream);
          p.poly([[21, 20], [10, 34], [6, 32], [18, 18]], c.outline);
          p.poly([[20, 21], [10, 31], [9, 31], [19, 19]], c.cream);
          p.rect(19, 15, 11, 9, c.outline);
          p.rect(21, 17, 7, 5, c.stone);
          p.rect(23, 18, 3, 3, c.gold);
          p.line(25, 27, 23, 39, c.stoneDark, 1);
        }
      },
      {
        id: 'micro-hydro-generator',
        name: '小水力発電所',
        category: '交通',
        keywords: ['水力発電', '発電設備', '水車', '水路'],
        shape: 'wheelhouse-with-exposed-paddle-wheel',
        draw(p) {
          const c = p.c;
          p.poly([[4, 21], [21, 14], [33, 20], [16, 28]], c.outline);
          p.poly([[7, 21], [21, 16], [30, 20], [16, 25]], c.roof);
          p.poly([[16, 25], [30, 20], [30, 34], [16, 40]], c.outline);
          p.poly([[18, 26], [28, 23], [28, 32], [18, 36]], c.wall);
          p.poly([[6, 22], [16, 28], [16, 40], [6, 34]], c.outline);
          p.poly([[8, 24], [14, 28], [14, 36], [8, 32]], c.wallShade);
          p.rect(20, 27, 5, 6, c.window);
          p.line(32, 28, 40, 28, c.outline, 3);
          p.rect(37, 20, 4, 20, c.outline);
          p.line(30, 23, 45, 37, c.outline, 3);
          p.line(45, 23, 30, 37, c.outline, 3);
          p.line(28, 30, 47, 30, c.outline, 3);
          p.line(38, 19, 38, 41, c.outline, 3);
          p.rect(35, 27, 7, 7, c.trunk);
          p.dot(38, 30, c.gold);
          p.line(4, 43, 44, 43, c.water, 3);
          p.line(1, 46, 34, 46, c.water, 2);
        }
      },
      {
        id: 'power-substation',
        name: '変電設備',
        category: '交通',
        keywords: ['変電所', '送電', '電力', 'インフラ'],
        shape: 'fenced-transformer-yard-twin-coils',
        draw(p) {
          const c = p.c;
          p.poly([[4, 29], [28, 20], [44, 28], [19, 39]], c.outline);
          p.poly([[7, 29], [28, 23], [41, 28], [19, 36]], c.stone);
          p.line(7, 20, 7, 34, c.outline, 3);
          p.line(42, 16, 42, 31, c.outline, 3);
          p.line(7, 20, 30, 12, c.outline, 2);
          p.line(30, 12, 42, 17, c.outline, 2);
          p.line(7, 25, 30, 17, c.outline, 1);
          p.line(30, 17, 42, 22, c.outline, 1);
          p.line(30, 12, 30, 28, c.outline, 2);
          p.rect(12, 20, 7, 13, c.outline);
          p.rect(14, 21, 3, 11, c.roofDark);
          p.rect(21, 17, 7, 13, c.outline);
          p.rect(23, 18, 3, 11, c.roofDark);
          p.rect(11, 16, 9, 5, c.outline);
          p.rect(12, 17, 7, 3, c.gold);
          p.rect(20, 13, 9, 5, c.outline);
          p.rect(21, 14, 7, 3, c.gold);
          p.line(15, 15, 15, 8, c.outline, 2);
          p.line(24, 12, 24, 5, c.outline, 2);
          p.rect(12, 6, 6, 3, c.cream);
          p.rect(21, 3, 6, 3, c.cream);
          p.rect(16, 36, 7, 6, c.outline);
          p.rect(18, 37, 3, 4, c.door);
        }
      },
      {
        id: 'traffic-signal',
        name: '三灯式信号機',
        category: '交通',
        keywords: ['信号機', '交差点', '道路設備', '交通安全'],
        shape: 'bent-signal-pole-three-lamp-head',
        draw(p) {
          const c = p.c;
          p.rect(8, 39, 15, 5, c.outline);
          p.rect(13, 14, 5, 27, c.outline);
          p.rect(14, 16, 3, 23, c.stone);
          p.line(16, 15, 16, 9, c.outline, 4);
          p.line(16, 9, 28, 9, c.outline, 4);
          p.rect(26, 5, 16, 24, c.outline);
          p.rect(29, 7, 10, 6, c.stoneDark);
          p.rect(29, 14, 10, 6, c.stoneDark);
          p.rect(29, 21, 10, 6, c.stoneDark);
          p.rect(32, 8, 4, 4, c.roofLight);
          p.rect(32, 15, 4, 4, c.gold);
          p.rect(32, 22, 4, 4, c.leafLight);
          p.poly([[28, 7], [24, 10], [28, 12]], c.outline);
          p.poly([[28, 14], [24, 17], [28, 19]], c.outline);
          p.poly([[28, 21], [24, 24], [28, 26]], c.outline);
          p.line(18, 32, 29, 36, c.outline, 2);
          p.rect(27, 33, 8, 7, c.outline);
          p.rect(29, 35, 4, 3, c.wall);
        }
      },
      {
        id: 'twin-streetlamp',
        name: '双灯街路灯',
        category: '交通',
        keywords: ['街路灯', '照明', '道路設備', '灯り'],
        shape: 'ornate-twin-lantern-curved-arms',
        draw(p) {
          const c = p.c;
          p.rect(17, 42, 15, 4, c.outline);
          p.rect(21, 16, 7, 28, c.outline);
          p.rect(23, 18, 3, 24, c.stoneDark);
          p.rect(19, 37, 11, 5, c.outline);
          p.rect(20, 12, 9, 6, c.outline);
          p.line(24, 14, 14, 8, c.outline, 3);
          p.line(25, 14, 35, 8, c.outline, 3);
          p.line(14, 8, 10, 12, c.outline, 3);
          p.line(35, 8, 39, 12, c.outline, 3);
          p.poly([[5, 12], [15, 12], [13, 25], [7, 25]], c.outline);
          p.poly([[7, 14], [13, 14], [12, 22], [8, 22]], c.gold);
          p.poly([[34, 12], [44, 12], [42, 25], [36, 25]], c.outline);
          p.poly([[36, 14], [42, 14], [41, 22], [37, 22]], c.gold);
          p.rect(7, 24, 6, 3, c.outline);
          p.rect(36, 24, 6, 3, c.outline);
          p.rect(8, 9, 4, 4, c.outline);
          p.rect(37, 9, 4, 4, c.outline);
          p.dot(24, 9, c.gold);
        }
      },
      {
        id: 'folding-road-barrier',
        name: '工事用バリケード',
        category: '交通',
        keywords: ['バリケード', '工事', '道路設備', '通行止め'],
        shape: 'striped-folding-a-frame-barrier',
        draw(p) {
          const c = p.c;
          p.line(10, 15, 4, 43, c.outline, 5);
          p.line(15, 16, 23, 43, c.outline, 5);
          p.line(35, 15, 27, 43, c.outline, 5);
          p.line(40, 15, 45, 43, c.outline, 5);
          p.line(11, 17, 6, 41, c.stone, 2);
          p.line(14, 18, 21, 41, c.stone, 2);
          p.line(36, 18, 29, 41, c.stone, 2);
          p.line(39, 17, 43, 41, c.stone, 2);
          p.poly([[4, 10], [43, 10], [43, 24], [4, 24]], c.outline);
          p.rect(7, 13, 33, 8, c.cream);
          p.poly([[8, 13], [15, 13], [10, 21], [7, 21]], c.roof);
          p.poly([[20, 13], [27, 13], [22, 21], [15, 21]], c.roof);
          p.poly([[32, 13], [39, 13], [34, 21], [27, 21]], c.roof);
          p.rect(7, 5, 6, 6, c.outline);
          p.rect(8, 6, 4, 4, c.gold);
          p.rect(35, 5, 6, 6, c.outline);
          p.rect(36, 6, 4, 4, c.gold);
          p.rect(1, 41, 11, 4, c.outline);
          p.rect(37, 41, 10, 4, c.outline);
        }
      },
      {
        id: 'mountain-tunnel',
        name: '山岳トンネル入口',
        category: '交通',
        keywords: ['トンネル', '道路', '山', '坑口'],
        shape: 'rocky-portal-deep-horseshoe-opening',
        draw(p) {
          const c = p.c;
          p.poly([[2, 43], [4, 22], [10, 11], [20, 5], [32, 7], [41, 17], [46, 43]], c.outline);
          p.poly([[5, 41], [7, 23], [12, 13], [21, 8], [31, 10], [38, 19], [43, 41]], c.stone);
          p.poly([[12, 42], [13, 26], [17, 18], [24, 14], [31, 18], [36, 27], [36, 42]], c.outline);
          p.poly([[16, 42], [16, 27], [20, 21], [24, 19], [28, 21], [33, 28], [33, 42]], c.stoneDark);
          p.rect(20, 20, 8, 4, c.outline);
          p.rect(22, 21, 4, 2, c.gold);
          p.poly([[18, 42], [31, 42], [28, 31], [24, 28], [20, 32]], c.outline);
          p.line(20, 39, 28, 39, c.cream, 1);
          p.line(21, 35, 27, 35, c.cream, 1);
          p.rect(7, 29, 5, 4, c.stoneDark);
          p.rect(10, 17, 6, 4, c.stoneDark);
          p.rect(31, 13, 5, 4, c.stoneDark);
          p.rect(38, 27, 5, 5, c.stoneDark);
          p.line(3, 44, 45, 44, c.outline, 3);
        }
      },
      {
        id: 'harbor-crane',
        name: '港の荷役クレーン',
        category: '交通',
        keywords: ['クレーン', '港', '荷役', '埠頭'],
        shape: 'gantry-crane-angled-boom-hanging-hook',
        draw(p) {
          const c = p.c;
          p.line(9, 42, 17, 15, c.outline, 5);
          p.line(28, 42, 20, 15, c.outline, 5);
          p.line(11, 40, 18, 17, c.gold, 2);
          p.line(26, 40, 20, 17, c.gold, 2);
          p.rect(7, 40, 9, 5, c.outline);
          p.rect(24, 40, 9, 5, c.outline);
          p.line(16, 15, 20, 4, c.outline, 5);
          p.line(19, 5, 44, 11, c.outline, 5);
          p.line(20, 7, 42, 12, c.gold, 2);
          p.line(18, 16, 41, 11, c.outline, 3);
          p.line(23, 8, 18, 16, c.outline, 2);
          p.line(29, 9, 21, 16, c.outline, 2);
          p.line(35, 10, 24, 16, c.outline, 2);
          p.rect(13, 14, 13, 10, c.outline);
          p.poly([[15, 16], [23, 16], [23, 21], [15, 21]], c.window);
          p.line(42, 12, 42, 31, c.outline, 2);
          p.line(42, 31, 38, 35, c.outline, 2);
          p.line(38, 35, 34, 31, c.outline, 2);
          p.rect(15, 27, 8, 3, c.outline);
          p.line(17, 29, 13, 38, c.outline, 2);
          p.line(21, 29, 26, 38, c.outline, 2);
        }
      },
      {
        id: 'road-drawbridge',
        name: '跳ね上げ橋',
        category: '交通',
        keywords: ['可動橋', '跳ね橋', '運河', '道路'],
        shape: 'raised-leaf-bridge-counterweight-towers',
        draw(p) {
          const c = p.c;
          p.rect(4, 10, 7, 35, c.outline);
          p.rect(6, 12, 3, 31, c.stone);
          p.rect(37, 10, 7, 35, c.outline);
          p.rect(39, 12, 3, 31, c.stone);
          p.rect(2, 7, 11, 6, c.outline);
          p.rect(35, 7, 11, 6, c.outline);
          p.poly([[10, 33], [20, 11], [25, 13], [14, 37]], c.outline);
          p.poly([[12, 32], [21, 14], [23, 15], [14, 34]], c.roofDark);
          p.poly([[38, 33], [28, 11], [23, 13], [34, 37]], c.outline);
          p.poly([[36, 32], [27, 14], [25, 15], [34, 34]], c.roofDark);
          p.line(14, 28, 21, 29, c.cream, 2);
          p.line(27, 29, 34, 28, c.cream, 2);
          p.line(8, 12, 20, 11, c.outline, 2);
          p.line(40, 12, 28, 11, c.outline, 2);
          p.line(8, 13, 13, 31, c.outline, 2);
          p.line(40, 13, 35, 31, c.outline, 2);
          p.rect(2, 42, 14, 4, c.outline);
          p.rect(32, 42, 14, 4, c.outline);
          p.line(17, 42, 31, 42, c.water, 3);
        }
      }
    ]
  });
}());
