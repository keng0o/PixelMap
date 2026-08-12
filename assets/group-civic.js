(() => {
  'use strict';

  const shadeBase = (p, x, y, w, h) => {
    p.poly([[x, y + h - 3], [x + w - 5, y + h - 3], [x + w, y + h], [x + 5, y + h]], p.c.shadow);
  };

  const windowPane = (p, x, y, w = 4, h = 5) => {
    p.rect(x - 1, y - 1, w + 2, h + 2, p.c.outline);
    p.rect(x, y, w, h, p.c.glass);
    p.line(x, y + 1, x + w - 1, y + 1, p.c.white, 1);
  };

  const door = (p, x, y, w = 5, h = 8) => {
    p.rect(x - 1, y - 1, w + 2, h + 1, p.c.outline);
    p.rect(x, y, w, h, p.c.door);
    p.dot(x + w - 2, y + Math.floor(h / 2), p.c.gold);
  };

  const roofEdge = (p, points) => {
    p.line(points[0][0], points[0][1], points[1][0], points[1][1], p.c.outline, 2);
    p.line(points[1][0], points[1][1], points[2][0], points[2][1], p.c.outline, 2);
  };

  window.PIXEL_ASSET_GROUPS = window.PIXEL_ASSET_GROUPS || [];
  window.PIXEL_ASSET_GROUPS.push({
    id: 'civic',
    label: '商業・公共施設',
    description: '町の中心と暮らしを支える、形の異なる商業・公共建築20種。',
    assets: [
      {
        id: 'civic-station-house',
        name: '駅舎',
        category: '商業・公共',
        keywords: ['駅', '鉄道', 'ホーム', '交通'],
        shape: 'long-gable-platform-clock',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 37, 42, 6);
          p.rect(5, 24, 35, 14, c.outline);
          p.rect(7, 25, 31, 11, c.wall);
          p.rect(34, 27, 4, 9, c.wallShade);
          p.poly([[3, 23], [12, 14], [34, 14], [43, 23]], c.outline);
          p.poly([[7, 22], [13, 16], [33, 16], [39, 22]], c.roof);
          p.poly([[23, 15], [34, 15], [39, 22], [28, 22]], c.roofDark);
          p.line(13, 16, 33, 16, c.roofLight, 2);
          p.rect(17, 17, 12, 6, c.outline);
          p.rect(19, 18, 8, 3, c.cream);
          windowPane(p, 9, 27, 5, 4);
          windowPane(p, 31, 27, 4, 4);
          door(p, 19, 27, 7, 9);
          p.rect(1, 36, 44, 3, c.outline);
          p.rect(3, 36, 40, 1, c.stone);
          p.line(5, 40, 42, 40, c.stoneDark, 2);
          for (let x = 7; x <= 39; x += 8) p.rect(x, 39, 2, 3, c.trunk);
        }
      },
      {
        id: 'civic-covered-market',
        name: '市場',
        category: '商業・公共',
        keywords: ['市場', 'マルシェ', '商店', '露店'],
        shape: 'sawtooth-hall-open-stalls',
        draw(p) {
          const c = p.c;
          shadeBase(p, 4, 38, 40, 5);
          p.rect(6, 22, 36, 17, c.outline);
          p.rect(8, 23, 32, 14, c.wallShade);
          p.poly([[4, 22], [11, 14], [18, 22], [25, 12], [32, 22], [39, 15], [45, 22]], c.outline);
          p.poly([[8, 21], [11, 17], [18, 24], [25, 15], [32, 24], [39, 18], [42, 21]], c.roof);
          p.poly([[18, 22], [25, 12], [25, 16], [19, 25]], c.roofLight);
          p.rect(8, 27, 32, 3, c.outline);
          for (let x = 9; x < 40; x += 8) {
            p.rect(x, 28, 4, 2, c.cream);
            p.rect(x + 4, 28, 4, 2, c.roofDark);
          }
          p.rect(9, 31, 8, 6, c.outline);
          p.rect(10, 32, 6, 4, c.leafLight);
          p.rect(20, 31, 8, 6, c.outline);
          p.rect(21, 32, 6, 4, c.gold);
          p.rect(31, 31, 8, 6, c.outline);
          p.rect(32, 32, 6, 4, c.roofLight);
          p.dot(12, 33, c.leafDark);
          p.dot(24, 34, c.cream);
          p.dot(35, 33, c.white);
        }
      },
      {
        id: 'civic-town-hall',
        name: '役所',
        category: '商業・公共',
        keywords: ['役所', '市庁舎', '行政', '広場'],
        shape: 'symmetrical-wings-central-cupola',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 39, 42, 5);
          p.rect(4, 25, 40, 14, c.outline);
          p.rect(6, 26, 36, 11, c.wall);
          p.rect(17, 20, 14, 18, c.outline);
          p.rect(19, 21, 10, 16, c.wall);
          p.poly([[2, 25], [9, 18], [17, 18], [19, 25]], c.outline);
          p.poly([[6, 24], [10, 20], [16, 20], [18, 24]], c.roofDark);
          p.poly([[29, 25], [31, 18], [39, 18], [46, 25]], c.outline);
          p.poly([[30, 24], [32, 20], [38, 20], [42, 24]], c.roof);
          p.poly([[17, 20], [24, 13], [31, 20]], c.outline);
          p.poly([[20, 19], [24, 16], [28, 19]], c.roofLight);
          p.rect(20, 9, 8, 5, c.outline);
          p.rect(22, 10, 4, 3, c.stone);
          p.line(24, 9, 24, 5, c.outline, 2);
          p.poly([[25, 5], [31, 7], [25, 9]], c.gold);
          windowPane(p, 9, 28, 4, 4);
          windowPane(p, 35, 28, 4, 4);
          door(p, 21, 28, 6, 9);
          p.rect(16, 38, 16, 2, c.stone);
          p.rect(19, 40, 10, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-clinic',
        name: '診療所',
        category: '商業・公共',
        keywords: ['診療所', '医療', '救護', '病院'],
        shape: 'l-plan-flat-roof-cross-sign',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 39, 38, 5);
          p.poly([[8, 20], [29, 20], [40, 27], [19, 27]], c.outline);
          p.poly([[10, 21], [28, 21], [37, 26], [19, 26]], c.white);
          p.rect(8, 22, 23, 16, c.outline);
          p.rect(10, 24, 19, 12, c.wall);
          p.rect(29, 27, 11, 12, c.outline);
          p.rect(30, 28, 8, 9, c.wallShade);
          p.rect(5, 25, 12, 14, c.outline);
          p.rect(7, 27, 8, 10, c.wall);
          p.rect(7, 19, 8, 8, c.outline);
          p.rect(9, 21, 4, 4, c.white);
          p.rect(10, 20, 2, 6, c.roof);
          p.rect(8, 22, 6, 2, c.roof);
          windowPane(p, 20, 27, 5, 4);
          windowPane(p, 32, 30, 4, 4);
          door(p, 9, 31, 5, 6);
          p.rect(15, 37, 25, 2, c.stoneDark);
          p.line(14, 17, 14, 11, c.outline, 2);
          p.rect(10, 8, 8, 5, c.outline);
          p.rect(12, 9, 4, 3, c.white);
          p.rect(13, 9, 2, 3, c.roof);
          p.rect(12, 10, 4, 1, c.roof);
        }
      },
      {
        id: 'civic-schoolhouse',
        name: '学校',
        category: '商業・公共',
        keywords: ['学校', '校舎', '教育', '校門'],
        shape: 'u-wing-belfry-schoolhouse',
        draw(p) {
          const c = p.c;
          shadeBase(p, 2, 39, 44, 5);
          p.rect(4, 24, 40, 15, c.outline);
          p.rect(6, 25, 36, 12, c.wall);
          p.poly([[2, 24], [10, 17], [19, 17], [22, 24]], c.outline);
          p.poly([[6, 23], [11, 19], [18, 19], [20, 23]], c.roof);
          p.poly([[26, 24], [29, 17], [38, 17], [46, 24]], c.outline);
          p.poly([[28, 23], [30, 19], [37, 19], [42, 23]], c.roofDark);
          p.rect(18, 20, 12, 18, c.outline);
          p.rect(20, 22, 8, 15, c.wallShade);
          p.poly([[17, 20], [24, 13], [31, 20]], c.outline);
          p.poly([[20, 19], [24, 16], [28, 19]], c.roofLight);
          p.rect(20, 9, 8, 5, c.outline);
          p.rect(22, 10, 4, 3, c.cream);
          p.dot(24, 11, c.outline);
          windowPane(p, 8, 27, 4, 4);
          windowPane(p, 36, 27, 4, 4);
          door(p, 21, 29, 6, 8);
          p.rect(1, 39, 8, 2, c.stoneDark);
          p.rect(39, 39, 8, 2, c.stoneDark);
          p.line(8, 36, 8, 43, c.outline, 2);
          p.line(40, 36, 40, 43, c.outline, 2);
        }
      },
      {
        id: 'civic-theatre',
        name: '劇場',
        category: '商業・公共',
        keywords: ['劇場', '舞台', '映画館', '娯楽'],
        shape: 'stepped-marquee-stage-house',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 39, 38, 5);
          p.rect(8, 16, 32, 23, c.outline);
          p.rect(10, 18, 28, 19, c.wallShade);
          p.rect(14, 12, 20, 7, c.outline);
          p.rect(16, 14, 16, 4, c.wall);
          p.rect(18, 8, 12, 6, c.outline);
          p.rect(20, 10, 8, 3, c.roof);
          p.poly([[5, 27], [43, 27], [39, 33], [9, 33]], c.outline);
          p.poly([[8, 28], [40, 28], [37, 31], [11, 31]], c.roof);
          p.line(12, 30, 36, 30, c.gold, 1);
          for (let x = 12; x <= 36; x += 6) p.dot(x, 29, c.cream);
          p.rect(12, 20, 24, 6, c.outline);
          p.rect(14, 22, 20, 2, c.roofDark);
          p.dot(17, 23, c.gold);
          p.dot(24, 23, c.gold);
          p.dot(31, 23, c.gold);
          door(p, 15, 33, 7, 5);
          door(p, 26, 33, 7, 5);
          p.rect(9, 38, 30, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-grand-hotel',
        name: 'ホテル',
        category: '商業・公共',
        keywords: ['ホテル', '宿泊', '旅館', '客室'],
        shape: 'four-storey-corner-turret-canopy',
        draw(p) {
          const c = p.c;
          shadeBase(p, 6, 41, 37, 4);
          p.rect(9, 12, 30, 29, c.outline);
          p.rect(11, 14, 26, 25, c.wall);
          p.rect(32, 14, 5, 25, c.wallShade);
          p.poly([[7, 13], [14, 7], [37, 7], [41, 13]], c.outline);
          p.poly([[11, 12], [15, 9], [36, 9], [38, 12]], c.roofDark);
          p.line(15, 9, 36, 9, c.roofLight, 2);
          p.rect(8, 17, 8, 18, c.outline);
          p.rect(10, 19, 4, 14, c.wallShade);
          p.poly([[6, 17], [12, 11], [18, 17]], c.outline);
          p.poly([[9, 16], [12, 14], [15, 16]], c.roof);
          for (let y = 16; y <= 29; y += 7) {
            windowPane(p, 20, y, 4, 4);
            windowPane(p, 29, y, 4, 4);
          }
          p.rect(15, 33, 18, 4, c.outline);
          p.rect(17, 34, 14, 2, c.roof);
          p.line(18, 37, 18, 41, c.outline, 2);
          p.line(30, 37, 30, 41, c.outline, 2);
          door(p, 21, 35, 6, 5);
          p.rect(17, 4, 15, 5, c.outline);
          p.rect(19, 5, 11, 3, c.cream);
          p.dot(21, 6, c.roofDark);
          p.dot(24, 6, c.roofDark);
          p.dot(27, 6, c.roofDark);
        }
      },
      {
        id: 'civic-workshop',
        name: '工房',
        category: '商業・公共',
        keywords: ['工房', '職人', '鍛冶', '製造'],
        shape: 'offset-shed-chimney-loading-bay',
        draw(p) {
          const c = p.c;
          shadeBase(p, 4, 39, 40, 5);
          p.rect(7, 23, 34, 16, c.outline);
          p.rect(9, 25, 30, 12, c.wallShade);
          p.poly([[5, 23], [16, 14], [35, 14], [43, 23]], c.outline);
          p.poly([[9, 22], [17, 16], [34, 16], [39, 22]], c.roofDark);
          p.poly([[9, 22], [17, 16], [17, 20], [13, 24]], c.roofLight);
          p.rect(31, 7, 7, 12, c.outline);
          p.rect(33, 9, 3, 8, c.stoneDark);
          p.rect(30, 5, 9, 4, c.outline);
          p.rect(32, 6, 5, 2, c.stone);
          p.rect(10, 28, 13, 10, c.outline);
          p.rect(12, 30, 9, 8, c.door);
          p.line(12, 33, 20, 33, c.gold, 1);
          p.line(16, 30, 16, 38, c.outline, 1);
          windowPane(p, 29, 27, 6, 4);
          p.poly([[24, 34], [39, 34], [44, 38], [29, 38]], c.outline);
          p.poly([[27, 35], [38, 35], [41, 37], [30, 37]], c.stone);
          p.rect(3, 32, 5, 5, c.outline);
          p.rect(4, 33, 3, 3, c.trunk);
          p.line(4, 33, 7, 36, c.gold, 1);
        }
      },
      {
        id: 'civic-library',
        name: '図書館',
        category: '商業・公共',
        keywords: ['図書館', '本', '資料館', '学習'],
        shape: 'pediment-column-reading-hall',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 40, 38, 4);
          p.rect(7, 21, 34, 18, c.outline);
          p.rect(9, 23, 30, 14, c.wall);
          p.poly([[4, 21], [24, 10], [44, 21]], c.outline);
          p.poly([[9, 20], [24, 13], [39, 20]], c.roofDark);
          p.poly([[13, 19], [24, 15], [35, 19]], c.roofLight);
          p.rect(9, 21, 30, 4, c.outline);
          p.rect(11, 22, 26, 2, c.stone);
          for (const x of [12, 20, 28, 36]) {
            p.rect(x, 25, 3, 12, c.outline);
            p.rect(x + 1, 26, 1, 10, c.cream);
            p.rect(x - 1, 36, 5, 2, c.stoneDark);
          }
          door(p, 22, 28, 5, 9);
          p.line(18, 27, 18, 34, c.stoneDark, 2);
          p.line(31, 27, 31, 34, c.stoneDark, 2);
          p.rect(14, 39, 20, 2, c.stone);
          p.rect(17, 41, 14, 2, c.stoneDark);
          p.rect(18, 16, 12, 4, c.outline);
          p.rect(20, 17, 8, 2, c.cream);
        }
      },
      {
        id: 'civic-fire-station',
        name: '消防署',
        category: '商業・公共',
        keywords: ['消防署', '消防車', '防災', '火の見やぐら'],
        shape: 'twin-engine-bays-watchtower',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 40, 42, 4);
          p.rect(4, 21, 29, 19, c.outline);
          p.rect(6, 23, 25, 15, c.wall);
          p.poly([[2, 21], [9, 15], [30, 15], [35, 21]], c.outline);
          p.poly([[6, 20], [10, 17], [29, 17], [32, 20]], c.roof);
          for (const x of [8, 20]) {
            p.rect(x, 26, 10, 13, c.outline);
            p.rect(x + 2, 28, 6, 11, c.door);
            p.line(x + 2, 31, x + 7, 31, c.roofLight, 1);
            p.line(x + 2, 35, x + 7, 35, c.roofLight, 1);
          }
          p.rect(34, 12, 9, 28, c.outline);
          p.rect(36, 14, 5, 24, c.wallShade);
          p.rect(32, 8, 13, 6, c.outline);
          p.rect(34, 10, 9, 2, c.roofDark);
          p.line(35, 14, 35, 5, c.outline, 2);
          p.line(42, 14, 42, 5, c.outline, 2);
          p.rect(33, 4, 11, 3, c.outline);
          p.rect(35, 5, 7, 1, c.roof);
          p.line(37, 9, 37, 38, c.stoneDark, 1);
          p.line(40, 9, 40, 38, c.stoneDark, 1);
          p.rect(2, 39, 43, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-police-box',
        name: '交番',
        category: '商業・公共',
        keywords: ['交番', '警察', '案内', '治安'],
        shape: 'compact-octagonal-corner-office',
        draw(p) {
          const c = p.c;
          shadeBase(p, 8, 39, 32, 5);
          p.poly([[10, 23], [16, 18], [34, 18], [40, 24], [37, 39], [13, 39]], c.outline);
          p.poly([[12, 24], [17, 20], [33, 20], [38, 25], [35, 37], [15, 37]], c.wall);
          p.poly([[7, 23], [15, 15], [35, 15], [43, 23], [37, 27], [13, 27]], c.outline);
          p.poly([[11, 22], [16, 17], [34, 17], [39, 22], [36, 24], [14, 24]], c.roofDark);
          p.poly([[15, 17], [25, 11], [35, 17]], c.roof);
          p.rect(21, 26, 9, 12, c.outline);
          p.rect(23, 28, 5, 10, c.door);
          windowPane(p, 14, 28, 5, 4);
          windowPane(p, 32, 27, 3, 5);
          p.rect(19, 11, 12, 4, c.outline);
          p.rect(21, 12, 8, 2, c.white);
          p.dot(23, 13, c.window);
          p.dot(27, 13, c.window);
          p.line(25, 11, 25, 7, c.outline, 2);
          p.rect(21, 5, 8, 3, c.outline);
          p.rect(23, 6, 4, 1, c.window);
          p.rect(12, 38, 26, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-post-office',
        name: '郵便局',
        category: '商業・公共',
        keywords: ['郵便局', '郵便', '手紙', '荷物'],
        shape: 'mail-hall-side-loading-porch',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 39, 38, 5);
          p.rect(8, 21, 31, 18, c.outline);
          p.rect(10, 23, 27, 14, c.wall);
          p.poly([[5, 21], [15, 13], [33, 13], [42, 21]], c.outline);
          p.poly([[9, 20], [16, 15], [32, 15], [38, 20]], c.roof);
          p.poly([[24, 15], [32, 15], [38, 20], [30, 20]], c.roofDark);
          p.rect(11, 24, 19, 7, c.outline);
          p.rect(13, 26, 15, 3, c.cream);
          p.line(13, 26, 20, 29, c.roof, 1);
          p.line(28, 26, 20, 29, c.roof, 1);
          door(p, 23, 31, 6, 7);
          windowPane(p, 13, 32, 5, 4);
          p.rect(36, 26, 8, 12, c.outline);
          p.rect(38, 28, 4, 10, c.door);
          p.line(38, 31, 41, 31, c.roofLight, 1);
          p.line(38, 35, 41, 35, c.roofLight, 1);
          p.rect(3, 29, 6, 9, c.outline);
          p.rect(5, 31, 2, 5, c.roof);
          p.rect(4, 30, 4, 2, c.roofLight);
          p.rect(7, 38, 36, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-bank',
        name: '銀行',
        category: '商業・公共',
        keywords: ['銀行', '金庫', '金融', '取引所'],
        shape: 'fortified-block-vault-annex',
        draw(p) {
          const c = p.c;
          shadeBase(p, 4, 40, 40, 4);
          p.rect(7, 18, 34, 22, c.outline);
          p.rect(9, 20, 30, 18, c.stone);
          p.rect(34, 20, 5, 18, c.stoneDark);
          p.poly([[5, 18], [12, 12], [39, 12], [43, 18]], c.outline);
          p.poly([[9, 17], [13, 14], [38, 14], [40, 17]], c.wallShade);
          p.rect(12, 20, 24, 4, c.outline);
          p.rect(14, 21, 20, 2, c.gold);
          for (const x of [12, 18, 31, 37]) {
            p.rect(x, 25, 3, 13, c.outline);
            p.rect(x + 1, 26, 1, 11, c.cream);
          }
          p.rect(21, 25, 9, 14, c.outline);
          p.rect(23, 27, 5, 12, c.door);
          p.rect(24, 29, 3, 3, c.stoneDark);
          p.dot(25, 30, c.gold);
          p.rect(15, 8, 20, 5, c.outline);
          p.rect(17, 9, 16, 3, c.stone);
          p.poly([[20, 11], [25, 7], [30, 11]], c.gold);
          p.rect(10, 39, 30, 2, c.stoneDark);
          p.rect(14, 41, 22, 2, c.stone);
        }
      },
      {
        id: 'civic-museum',
        name: '博物館',
        category: '商業・公共',
        keywords: ['博物館', '展示', '歴史', '文化'],
        shape: 'domed-rotunda-gallery-wings',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 40, 42, 4);
          p.rect(4, 25, 40, 15, c.outline);
          p.rect(6, 27, 36, 11, c.wallShade);
          p.rect(15, 19, 18, 20, c.outline);
          p.rect(17, 21, 14, 16, c.wall);
          p.poly([[13, 19], [17, 12], [31, 12], [35, 19]], c.outline);
          p.poly([[17, 18], [19, 14], [29, 14], [31, 18]], c.roof);
          p.poly([[19, 13], [21, 8], [27, 8], [30, 13]], c.outline);
          p.poly([[21, 12], [23, 10], [26, 10], [28, 12]], c.roofLight);
          p.rect(22, 5, 5, 4, c.outline);
          p.rect(23, 6, 3, 2, c.gold);
          p.poly([[2, 25], [8, 20], [15, 20], [17, 25]], c.outline);
          p.poly([[6, 24], [9, 22], [15, 22], [16, 24]], c.roofDark);
          p.poly([[31, 25], [33, 20], [40, 20], [46, 25]], c.outline);
          p.poly([[32, 24], [34, 22], [39, 22], [42, 24]], c.roofDark);
          windowPane(p, 8, 29, 4, 4);
          windowPane(p, 36, 29, 4, 4);
          door(p, 21, 29, 6, 8);
          p.rect(15, 38, 18, 2, c.stone);
          p.rect(18, 40, 12, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-bathhouse',
        name: '公衆浴場',
        category: '商業・公共',
        keywords: ['浴場', '温泉', '煙突', '湯'],
        shape: 'low-bathhouse-twin-chimneys-curtain',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 38, 42, 5);
          p.rect(5, 24, 38, 14, c.outline);
          p.rect(7, 26, 34, 10, c.wall);
          p.poly([[3, 24], [11, 17], [37, 17], [45, 24]], c.outline);
          p.poly([[7, 23], [12, 19], [36, 19], [41, 23]], c.roofDark);
          p.line(12, 19, 36, 19, c.roofLight, 2);
          p.rect(10, 8, 6, 12, c.outline);
          p.rect(12, 10, 2, 8, c.stoneDark);
          p.rect(32, 10, 6, 10, c.outline);
          p.rect(34, 12, 2, 6, c.stoneDark);
          p.rect(9, 6, 8, 4, c.outline);
          p.rect(11, 7, 4, 2, c.stone);
          p.rect(31, 8, 8, 4, c.outline);
          p.rect(33, 9, 4, 2, c.stone);
          p.rect(16, 25, 16, 5, c.outline);
          p.rect(18, 26, 12, 3, c.white);
          p.line(22, 26, 22, 29, c.window, 1);
          p.line(26, 26, 26, 29, c.roof, 1);
          door(p, 21, 30, 7, 7);
          windowPane(p, 9, 29, 4, 4);
          windowPane(p, 35, 29, 4, 4);
          p.rect(6, 37, 36, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-inn-tavern',
        name: '宿場酒場',
        category: '商業・公共',
        keywords: ['酒場', '宿屋', '食堂', '旅人'],
        shape: 'cross-gable-balcony-hanging-sign',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 40, 38, 4);
          p.rect(8, 19, 31, 21, c.outline);
          p.rect(10, 21, 27, 17, c.wall);
          p.poly([[5, 19], [15, 10], [34, 10], [42, 19]], c.outline);
          p.poly([[9, 18], [16, 12], [33, 12], [38, 18]], c.roof);
          p.poly([[24, 12], [33, 12], [38, 18], [29, 18]], c.roofDark);
          p.rect(8, 27, 31, 4, c.outline);
          p.rect(10, 28, 27, 2, c.trunk);
          p.line(12, 30, 12, 34, c.outline, 2);
          p.line(35, 30, 35, 34, c.outline, 2);
          windowPane(p, 14, 21, 5, 4);
          windowPane(p, 29, 21, 5, 4);
          door(p, 21, 31, 7, 8);
          p.rect(11, 32, 7, 5, c.outline);
          p.rect(13, 33, 3, 3, c.window);
          p.line(39, 22, 44, 22, c.outline, 2);
          p.line(43, 22, 43, 29, c.outline, 2);
          p.rect(39, 25, 8, 6, c.outline);
          p.rect(41, 27, 4, 2, c.gold);
          p.rect(9, 39, 31, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-guild-hall',
        name: 'ギルド会館',
        category: '商業・公共',
        keywords: ['ギルド', '会館', '組合', '集会所'],
        shape: 'tall-timber-hall-projecting-oriel',
        draw(p) {
          const c = p.c;
          shadeBase(p, 5, 41, 38, 4);
          p.rect(9, 15, 30, 26, c.outline);
          p.rect(11, 17, 26, 22, c.wallShade);
          p.poly([[6, 15], [16, 6], [34, 6], [42, 15]], c.outline);
          p.poly([[10, 14], [17, 8], [33, 8], [38, 14]], c.roofDark);
          p.poly([[17, 8], [25, 4], [33, 8]], c.roof);
          p.line(12, 18, 36, 38, c.trunk, 2);
          p.line(36, 18, 12, 38, c.trunk, 2);
          p.line(24, 16, 24, 40, c.trunk, 2);
          p.line(10, 27, 38, 27, c.trunk, 2);
          p.rect(15, 19, 8, 8, c.outline);
          p.rect(17, 21, 4, 4, c.glass);
          p.poly([[13, 19], [19, 15], [25, 19]], c.outline);
          p.poly([[16, 18], [19, 17], [22, 18]], c.roofLight);
          windowPane(p, 29, 19, 5, 5);
          door(p, 21, 31, 7, 8);
          p.rect(13, 37, 7, 3, c.outline);
          p.rect(15, 38, 3, 1, c.gold);
          p.rect(9, 40, 30, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-courthouse',
        name: '裁判所',
        category: '商業・公共',
        keywords: ['裁判所', '法廷', '法律', '公館'],
        shape: 'high-stair-portico-square-dome',
        draw(p) {
          const c = p.c;
          shadeBase(p, 3, 41, 42, 4);
          p.rect(6, 20, 36, 19, c.outline);
          p.rect(8, 22, 32, 15, c.wallShade);
          p.poly([[4, 20], [12, 14], [36, 14], [44, 20]], c.outline);
          p.poly([[8, 19], [13, 16], [35, 16], [40, 19]], c.stone);
          p.poly([[11, 25], [24, 17], [37, 25]], c.outline);
          p.poly([[15, 24], [24, 20], [33, 24]], c.cream);
          for (const x of [15, 21, 27, 33]) {
            p.rect(x, 25, 3, 12, c.outline);
            p.rect(x + 1, 26, 1, 10, c.wall);
          }
          door(p, 22, 28, 5, 9);
          p.rect(18, 9, 12, 6, c.outline);
          p.rect(20, 10, 8, 4, c.stone);
          p.poly([[17, 9], [21, 5], [27, 5], [31, 9]], c.outline);
          p.poly([[20, 8], [22, 7], [26, 7], [28, 8]], c.roofDark);
          p.line(24, 5, 24, 2, c.outline, 2);
          p.poly([[24, 2], [28, 4], [24, 5]], c.gold);
          p.rect(12, 37, 24, 3, c.stone);
          p.rect(9, 40, 30, 2, c.stoneDark);
          p.rect(6, 42, 36, 2, c.stone);
        }
      },
      {
        id: 'civic-observatory',
        name: '天文台',
        category: '商業・公共',
        keywords: ['天文台', '星', '研究', 'ドーム'],
        shape: 'cylindrical-dome-side-laboratory',
        draw(p) {
          const c = p.c;
          shadeBase(p, 6, 41, 37, 4);
          p.rect(8, 25, 22, 15, c.outline);
          p.rect(10, 27, 18, 11, c.wallShade);
          p.poly([[6, 25], [12, 20], [28, 20], [33, 25]], c.outline);
          p.poly([[10, 24], [13, 22], [27, 22], [30, 24]], c.roofDark);
          p.rect(25, 17, 16, 23, c.outline);
          p.rect(27, 19, 12, 19, c.wall);
          p.poly([[23, 17], [26, 10], [31, 7], [36, 8], [41, 13], [43, 17]], c.outline);
          p.poly([[27, 16], [29, 12], [33, 10], [36, 11], [39, 14], [39, 16]], c.stone);
          p.line(34, 10, 40, 16, c.stoneDark, 2);
          p.rect(35, 4, 3, 8, c.outline);
          p.line(37, 5, 43, 2, c.outline, 2);
          p.rect(42, 1, 4, 3, c.outline);
          p.dot(43, 2, c.glass);
          windowPane(p, 12, 29, 5, 4);
          door(p, 28, 30, 6, 9);
          p.rect(36, 23, 5, 6, c.outline);
          p.rect(37, 24, 3, 4, c.glass);
          p.rect(8, 39, 34, 2, c.stoneDark);
        }
      },
      {
        id: 'civic-clocktower',
        name: '時計塔',
        category: '商業・公共',
        keywords: ['時計塔', '鐘', '目印', '広場'],
        shape: 'slender-tiered-clock-belfry',
        draw(p) {
          const c = p.c;
          shadeBase(p, 11, 42, 26, 3);
          p.rect(14, 25, 20, 17, c.outline);
          p.rect(16, 27, 16, 13, c.stone);
          p.rect(18, 13, 12, 15, c.outline);
          p.rect(20, 15, 8, 11, c.wallShade);
          p.poly([[15, 13], [24, 4], [33, 13]], c.outline);
          p.poly([[19, 12], [24, 7], [29, 12]], c.roof);
          p.line(24, 5, 24, 1, c.outline, 2);
          p.dot(24, 1, c.gold);
          p.rect(19, 15, 10, 9, c.outline);
          p.rect(21, 17, 6, 5, c.cream);
          p.dot(24, 19, c.outline);
          p.line(24, 19, 24, 17, c.outline, 1);
          p.line(24, 19, 26, 20, c.outline, 1);
          p.rect(10, 30, 8, 12, c.outline);
          p.rect(12, 32, 4, 8, c.wall);
          p.rect(30, 30, 8, 12, c.outline);
          p.rect(32, 32, 4, 8, c.wallShade);
          door(p, 21, 33, 6, 8);
          p.rect(11, 41, 26, 2, c.stoneDark);
          p.rect(14, 43, 20, 2, c.stone);
        }
      }
    ]
  });
})();
