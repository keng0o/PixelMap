window.PIXEL_ASSET_GROUPS = window.PIXEL_ASSET_GROUPS || [];

window.PIXEL_ASSET_GROUPS.push({
  id: 'landmarks',
  label: 'ランドマーク・小物',
  description: '街や公園に物語と目印を添える、輪郭の異なるランドマークとレジャー小物。',
  assets: [
    {
      id: 'landmark-torii-gate',
      name: '石鳥居',
      category: 'ランドマーク',
      keywords: ['鳥居', '神社', '門', '和風'],
      shape: 'wide_torii_double_lintel',
      draw(p) {
        const c = p.c;
        p.rect(7, 9, 34, 5, c.outline);
        p.rect(4, 6, 40, 4, c.outline);
        p.rect(7, 7, 34, 2, c.roofDark);
        p.rect(10, 10, 28, 2, c.roof);
        p.rect(11, 14, 5, 25, c.outline);
        p.rect(32, 14, 5, 25, c.outline);
        p.rect(13, 14, 2, 22, c.stone);
        p.rect(33, 14, 2, 22, c.stone);
        p.rect(9, 19, 30, 4, c.outline);
        p.rect(12, 20, 24, 2, c.stoneDark);
        p.rect(9, 38, 9, 4, c.outline);
        p.rect(30, 38, 9, 4, c.outline);
        p.rect(11, 38, 5, 2, c.stone);
        p.rect(32, 38, 5, 2, c.stone);
        p.rect(21, 14, 6, 6, c.outline);
        p.rect(22, 15, 4, 4, c.gold);
      }
    },
    {
      id: 'landmark-five-tier-pagoda',
      name: '五重塔',
      category: 'ランドマーク',
      keywords: ['五重塔', '塔', '寺', '和風'],
      shape: 'five_tier_tapered_pagoda',
      draw(p) {
        const c = p.c;
        p.line(24, 2, 24, 7, c.outline, 2);
        p.dot(24, 2, c.gold);
        p.poly([[20, 8], [24, 4], [28, 8]], c.outline);
        p.poly([[21, 8], [24, 6], [27, 8]], c.roofLight);
        p.rect(21, 8, 6, 5, c.outline);
        p.rect(22, 9, 4, 3, c.wall);
        p.poly([[15, 14], [33, 14], [29, 10], [19, 10]], c.outline);
        p.poly([[18, 13], [30, 13], [28, 11], [20, 11]], c.roof);
        p.rect(19, 14, 10, 5, c.outline);
        p.rect(21, 14, 6, 4, c.wallShade);
        p.poly([[12, 21], [36, 21], [31, 17], [17, 17]], c.outline);
        p.poly([[15, 20], [33, 20], [30, 18], [18, 18]], c.roofDark);
        p.rect(17, 21, 14, 5, c.outline);
        p.rect(19, 21, 10, 4, c.wall);
        p.poly([[9, 29], [39, 29], [33, 24], [15, 24]], c.outline);
        p.poly([[13, 28], [35, 28], [31, 25], [17, 25]], c.roof);
        p.rect(15, 29, 18, 6, c.outline);
        p.rect(18, 29, 12, 5, c.wallShade);
        p.poly([[6, 38], [42, 38], [34, 33], [14, 33]], c.outline);
        p.poly([[11, 37], [37, 37], [32, 34], [16, 34]], c.roofDark);
        p.rect(13, 38, 22, 6, c.outline);
        p.rect(16, 38, 16, 5, c.wall);
        p.rect(22, 38, 4, 6, c.door);
        p.rect(9, 44, 30, 3, c.stoneDark);
      }
    },
    {
      id: 'landmark-tiered-fountain',
      name: '二段噴水',
      category: 'ランドマーク',
      keywords: ['噴水', '水場', '広場', '公園'],
      shape: 'oval_basin_double_bowl_fountain',
      draw(p) {
        const c = p.c;
        p.poly([[5, 32], [10, 27], [38, 27], [43, 32], [43, 38], [37, 43], [11, 43], [5, 38]], c.outline);
        p.poly([[8, 32], [12, 29], [36, 29], [40, 32], [40, 36], [35, 40], [13, 40], [8, 36]], c.stone);
        p.poly([[11, 32], [15, 30], [33, 30], [37, 32], [37, 35], [33, 38], [15, 38], [11, 35]], c.water);
        p.rect(21, 19, 6, 13, c.outline);
        p.rect(23, 20, 2, 11, c.stoneDark);
        p.poly([[15, 19], [18, 16], [30, 16], [33, 19], [30, 23], [18, 23]], c.outline);
        p.poly([[19, 18], [29, 18], [29, 20], [19, 20]], c.water);
        p.rect(22, 9, 4, 8, c.outline);
        p.rect(23, 10, 2, 7, c.stone);
        p.line(24, 8, 24, 3, c.water, 2);
        p.line(22, 10, 17, 7, c.water, 2);
        p.line(26, 10, 31, 7, c.water, 2);
        p.dot(16, 6, c.water);
        p.dot(32, 6, c.water);
      }
    },
    {
      id: 'landmark-playground-swing',
      name: '二人乗りブランコ',
      category: 'ランドマーク',
      keywords: ['ブランコ', '遊具', '公園', 'レジャー'],
      shape: 'a_frame_double_swing',
      draw(p) {
        const c = p.c;
        p.line(8, 42, 15, 8, c.outline, 4);
        p.line(40, 42, 33, 8, c.outline, 4);
        p.line(10, 41, 16, 10, c.stoneDark, 2);
        p.line(38, 41, 32, 10, c.stone, 2);
        p.rect(12, 6, 24, 5, c.outline);
        p.rect(14, 7, 20, 2, c.roofLight);
        p.line(19, 11, 19, 30, c.outline, 2);
        p.line(26, 11, 26, 30, c.outline, 2);
        p.line(30, 11, 30, 30, c.outline, 2);
        p.line(35, 11, 35, 30, c.outline, 2);
        p.rect(16, 29, 13, 5, c.outline);
        p.rect(18, 29, 9, 2, c.trunk);
        p.rect(28, 29, 10, 5, c.outline);
        p.rect(30, 29, 6, 2, c.trunk);
        p.rect(5, 41, 12, 3, c.outline);
        p.rect(31, 41, 12, 3, c.outline);
        p.rect(7, 41, 8, 1, c.stone);
        p.rect(33, 41, 8, 1, c.stone);
      }
    },
    {
      id: 'landmark-tower-slide',
      name: '塔つきすべり台',
      category: 'ランドマーク',
      keywords: ['すべり台', '遊具', '塔', '公園'],
      shape: 'roofed_tower_curved_slide',
      draw(p) {
        const c = p.c;
        p.poly([[6, 12], [19, 3], [32, 12]], c.outline);
        p.poly([[10, 11], [19, 6], [28, 11]], c.roof);
        p.rect(12, 12, 15, 17, c.outline);
        p.rect(15, 14, 9, 12, c.wall);
        p.rect(17, 17, 5, 5, c.window);
        p.rect(11, 27, 17, 5, c.outline);
        p.rect(14, 28, 11, 2, c.roofLight);
        p.line(14, 31, 11, 44, c.outline, 3);
        p.line(25, 31, 28, 44, c.outline, 3);
        p.line(10, 35, 28, 35, c.outline, 2);
        p.line(9, 39, 29, 39, c.outline, 2);
        p.poly([[28, 25], [35, 25], [40, 31], [40, 36], [35, 42], [25, 42], [25, 37], [32, 37], [35, 34], [35, 32], [31, 30], [28, 30]], c.outline);
        p.poly([[30, 27], [34, 27], [38, 32], [38, 35], [34, 39], [27, 39], [27, 38], [33, 36], [36, 34], [36, 32], [33, 29], [30, 29]], c.stone);
        p.rect(8, 43, 8, 3, c.outline);
        p.rect(23, 43, 8, 3, c.outline);
      }
    },
    {
      id: 'landmark-seesaw',
      name: 'シーソー',
      category: 'ランドマーク',
      keywords: ['シーソー', '遊具', '公園', '子ども'],
      shape: 'diagonal_plank_triangle_pivot',
      draw(p) {
        const c = p.c;
        p.poly([[21, 29], [27, 29], [33, 42], [15, 42]], c.outline);
        p.poly([[23, 31], [25, 31], [29, 39], [19, 39]], c.stone);
        p.poly([[4, 28], [42, 14], [44, 19], [6, 33]], c.outline);
        p.poly([[7, 28], [40, 16], [41, 18], [8, 30]], c.roof);
        p.rect(4, 23, 4, 10, c.outline);
        p.rect(5, 24, 2, 7, c.roofDark);
        p.rect(39, 12, 4, 10, c.outline);
        p.rect(40, 14, 2, 6, c.roofDark);
        p.line(3, 34, 11, 34, c.outline, 3);
        p.line(37, 23, 45, 23, c.outline, 3);
        p.rect(12, 41, 24, 3, c.outline);
        p.rect(15, 41, 18, 1, c.stoneDark);
      }
    },
    {
      id: 'landmark-park-bench',
      name: '木陰のベンチ',
      category: 'ランドマーク',
      keywords: ['ベンチ', '休憩', '公園', '街具'],
      shape: 'slatted_bench_curved_arms',
      draw(p) {
        const c = p.c;
        p.rect(8, 13, 32, 5, c.outline);
        p.rect(10, 14, 28, 2, c.trunk);
        p.rect(8, 20, 32, 5, c.outline);
        p.rect(10, 21, 28, 2, c.roofDark);
        p.rect(7, 27, 34, 7, c.outline);
        p.rect(10, 28, 28, 3, c.trunk);
        p.rect(9, 17, 4, 11, c.outline);
        p.rect(35, 17, 4, 11, c.outline);
        p.line(7, 25, 4, 32, c.outline, 3);
        p.line(41, 25, 44, 32, c.outline, 3);
        p.rect(9, 33, 5, 10, c.outline);
        p.rect(34, 33, 5, 10, c.outline);
        p.rect(11, 34, 2, 7, c.stoneDark);
        p.rect(35, 34, 2, 7, c.stoneDark);
        p.rect(6, 42, 11, 3, c.outline);
        p.rect(31, 42, 11, 3, c.outline);
        p.dot(11, 23, c.gold);
        p.dot(37, 23, c.gold);
      }
    },
    {
      id: 'landmark-street-clock',
      name: '街角の時計',
      category: 'ランドマーク',
      keywords: ['時計', '街角', '待ち合わせ', '柱時計'],
      shape: 'round_clock_tapered_post',
      draw(p) {
        const c = p.c;
        p.poly([[17, 7], [20, 3], [28, 3], [31, 7], [34, 11], [34, 21], [30, 26], [18, 26], [14, 21], [14, 11]], c.outline);
        p.poly([[19, 8], [22, 5], [26, 5], [29, 8], [32, 12], [32, 19], [28, 23], [20, 23], [16, 19], [16, 12]], c.cream);
        p.line(24, 14, 24, 8, c.outline, 2);
        p.line(24, 14, 29, 17, c.outline, 2);
        p.dot(24, 14, c.gold);
        p.rect(21, 25, 6, 16, c.outline);
        p.rect(23, 26, 2, 14, c.stoneDark);
        p.poly([[17, 40], [31, 40], [36, 45], [12, 45]], c.outline);
        p.poly([[19, 41], [29, 41], [32, 43], [16, 43]], c.stone);
        p.poly([[19, 3], [24, 0], [29, 3]], c.outline);
        p.dot(24, 2, c.gold);
      }
    },
    {
      id: 'landmark-lighthouse',
      name: '岬の灯台',
      category: 'ランドマーク',
      keywords: ['灯台', '海', '港', '岬'],
      shape: 'tapered_lighthouse_lantern_deck',
      draw(p) {
        const c = p.c;
        p.poly([[18, 40], [30, 40], [28, 17], [20, 17]], c.outline);
        p.poly([[21, 38], [27, 38], [26, 19], [22, 19]], c.wall);
        p.rect(20, 26, 8, 5, c.roof);
        p.rect(22, 27, 4, 3, c.roofLight);
        p.rect(21, 34, 6, 6, c.outline);
        p.rect(23, 35, 2, 5, c.door);
        p.rect(15, 14, 18, 5, c.outline);
        p.rect(17, 15, 14, 2, c.stoneDark);
        p.line(15, 13, 15, 19, c.outline, 2);
        p.line(33, 13, 33, 19, c.outline, 2);
        p.rect(19, 6, 10, 9, c.outline);
        p.rect(21, 8, 6, 5, c.glass);
        p.line(24, 7, 24, 14, c.gold, 2);
        p.poly([[17, 6], [31, 6], [27, 2], [21, 2]], c.outline);
        p.poly([[20, 5], [28, 5], [26, 3], [22, 3]], c.roofDark);
        p.rect(14, 40, 20, 5, c.outline);
        p.rect(17, 40, 14, 3, c.stone);
        p.line(31, 9, 42, 6, c.gold, 2);
        p.line(17, 9, 6, 6, c.gold, 2);
      }
    },
    {
      id: 'landmark-obelisk',
      name: '広場の記念碑',
      category: 'ランドマーク',
      keywords: ['記念碑', 'オベリスク', '広場', '石碑'],
      shape: 'pointed_obelisk_stepped_plinth',
      draw(p) {
        const c = p.c;
        p.poly([[18, 11], [24, 2], [30, 11], [29, 34], [19, 34]], c.outline);
        p.poly([[21, 12], [24, 6], [26, 12], [26, 32], [21, 32]], c.stone);
        p.poly([[26, 12], [28, 11], [27, 32], [26, 32]], c.stoneDark);
        p.rect(20, 18, 7, 8, c.outline);
        p.rect(22, 20, 3, 4, c.gold);
        p.rect(15, 33, 18, 5, c.outline);
        p.rect(18, 34, 12, 2, c.stoneDark);
        p.rect(11, 38, 26, 5, c.outline);
        p.rect(14, 39, 20, 2, c.stone);
        p.rect(7, 43, 34, 4, c.outline);
        p.rect(11, 43, 26, 2, c.stoneDark);
      }
    },
    {
      id: 'landmark-gazebo',
      name: '六角あずまや',
      category: 'ランドマーク',
      keywords: ['あずまや', '東屋', '休憩所', '公園'],
      shape: 'hexagonal_gazebo_open_posts',
      draw(p) {
        const c = p.c;
        p.poly([[4, 17], [15, 7], [33, 7], [44, 17], [37, 22], [11, 22]], c.outline);
        p.poly([[8, 17], [17, 9], [31, 9], [40, 17], [35, 19], [13, 19]], c.roof);
        p.poly([[15, 7], [24, 2], [33, 7]], c.outline);
        p.poly([[19, 7], [24, 4], [29, 7]], c.roofLight);
        p.rect(10, 20, 5, 20, c.outline);
        p.rect(33, 20, 5, 20, c.outline);
        p.rect(12, 22, 2, 16, c.trunk);
        p.rect(34, 22, 2, 16, c.trunk);
        p.rect(20, 20, 4, 17, c.outline);
        p.rect(22, 22, 1, 14, c.trunk);
        p.rect(9, 31, 30, 5, c.outline);
        p.rect(13, 32, 22, 2, c.trunk);
        p.poly([[8, 39], [40, 39], [44, 43], [36, 46], [12, 46], [4, 43]], c.outline);
        p.poly([[10, 40], [38, 40], [40, 42], [35, 44], [13, 44], [8, 42]], c.stone);
      }
    },
    {
      id: 'landmark-wishing-well',
      name: '石の井戸',
      category: 'ランドマーク',
      keywords: ['井戸', '石造り', '村', '水'],
      shape: 'round_well_crank_canopy',
      draw(p) {
        const c = p.c;
        p.poly([[8, 27], [14, 22], [34, 22], [40, 27], [40, 38], [34, 44], [14, 44], [8, 38]], c.outline);
        p.poly([[11, 28], [16, 24], [32, 24], [37, 28], [37, 36], [32, 41], [16, 41], [11, 36]], c.stone);
        p.poly([[13, 29], [17, 26], [31, 26], [35, 29], [31, 33], [17, 33]], c.outline);
        p.poly([[16, 29], [19, 28], [29, 28], [32, 29], [29, 31], [19, 31]], c.water);
        p.rect(10, 10, 5, 19, c.outline);
        p.rect(33, 10, 5, 19, c.outline);
        p.rect(12, 11, 2, 16, c.trunk);
        p.rect(34, 11, 2, 16, c.trunk);
        p.line(14, 19, 34, 19, c.outline, 3);
        p.rect(21, 17, 6, 5, c.outline);
        p.rect(22, 18, 4, 3, c.trunk);
        p.line(24, 21, 24, 30, c.outline, 1);
        p.poly([[6, 10], [15, 3], [33, 3], [42, 10], [37, 14], [11, 14]], c.outline);
        p.poly([[10, 9], [17, 5], [31, 5], [38, 9], [35, 11], [13, 11]], c.roofDark);
        p.line(38, 19, 43, 19, c.outline, 2);
        p.line(43, 19, 43, 23, c.outline, 2);
      }
    },
    {
      id: 'landmark-stone-lantern',
      name: '石灯籠',
      category: 'ランドマーク',
      keywords: ['石灯籠', '庭園', '和風', '灯り'],
      shape: 'stone_lantern_broad_cap',
      draw(p) {
        const c = p.c;
        p.rect(19, 29, 10, 11, c.outline);
        p.rect(22, 30, 4, 9, c.stoneDark);
        p.poly([[15, 39], [33, 39], [38, 44], [10, 44]], c.outline);
        p.poly([[18, 40], [30, 40], [33, 42], [15, 42]], c.stone);
        p.rect(14, 17, 20, 12, c.outline);
        p.rect(17, 19, 5, 7, c.gold);
        p.rect(26, 19, 5, 7, c.gold);
        p.line(24, 18, 24, 28, c.outline, 2);
        p.poly([[7, 16], [14, 10], [34, 10], [41, 16], [35, 20], [13, 20]], c.outline);
        p.poly([[12, 15], [17, 12], [31, 12], [36, 15], [33, 17], [15, 17]], c.stone);
        p.poly([[17, 10], [24, 5], [31, 10]], c.outline);
        p.poly([[21, 9], [24, 7], [27, 9]], c.stoneDark);
        p.rect(22, 2, 4, 4, c.outline);
        p.rect(23, 2, 2, 3, c.stone);
      }
    },
    {
      id: 'landmark-founder-statue',
      name: '開拓者の像',
      category: 'ランドマーク',
      keywords: ['銅像', '像', '記念', '広場'],
      shape: 'standing_statue_raised_arm_pedestal',
      draw(p) {
        const c = p.c;
        p.poly([[20, 7], [22, 3], [27, 3], [29, 7], [27, 11], [22, 11]], c.outline);
        p.rect(22, 6, 5, 4, c.stoneDark);
        p.poly([[19, 11], [28, 11], [31, 24], [27, 28], [20, 28], [17, 24]], c.outline);
        p.poly([[21, 13], [26, 13], [28, 23], [25, 25], [21, 25], [19, 23]], c.stone);
        p.line(19, 14, 12, 5, c.outline, 4);
        p.line(13, 6, 10, 2, c.outline, 3);
        p.line(28, 14, 34, 22, c.outline, 4);
        p.line(21, 26, 18, 34, c.outline, 4);
        p.line(26, 26, 29, 34, c.outline, 4);
        p.rect(16, 33, 16, 5, c.outline);
        p.rect(18, 34, 12, 2, c.stone);
        p.rect(12, 37, 24, 7, c.outline);
        p.rect(15, 38, 18, 4, c.stoneDark);
        p.rect(19, 39, 10, 3, c.gold);
        p.rect(8, 43, 32, 4, c.outline);
        p.rect(12, 43, 24, 2, c.stone);
      }
    },
    {
      id: 'landmark-arched-footbridge',
      name: '太鼓橋',
      category: 'ランドマーク',
      keywords: ['橋', '太鼓橋', '庭園', '水辺'],
      shape: 'arched_bridge_rail_balusters',
      draw(p) {
        const c = p.c;
        p.poly([[3, 29], [9, 21], [17, 17], [31, 17], [39, 21], [45, 29], [45, 37], [39, 37], [35, 30], [30, 27], [18, 27], [13, 30], [9, 37], [3, 37]], c.outline);
        p.poly([[6, 29], [11, 23], [18, 20], [30, 20], [37, 23], [42, 29], [42, 32], [37, 29], [30, 24], [18, 24], [11, 29], [6, 32]], c.roof);
        p.line(5, 25, 11, 16, c.outline, 3);
        p.line(43, 25, 37, 16, c.outline, 3);
        p.line(10, 17, 38, 17, c.outline, 3);
        p.line(12, 18, 12, 25, c.outline, 2);
        p.line(19, 16, 19, 22, c.outline, 2);
        p.line(29, 16, 29, 22, c.outline, 2);
        p.line(36, 18, 36, 25, c.outline, 2);
        p.line(3, 38, 45, 38, c.water, 3);
        p.line(8, 42, 40, 42, c.water, 2);
        p.rect(2, 35, 9, 4, c.stoneDark);
        p.rect(37, 35, 9, 4, c.stoneDark);
      }
    },
    {
      id: 'landmark-direction-sign',
      name: '三方向の道しるべ',
      category: 'ランドマーク',
      keywords: ['道しるべ', '看板', '案内', 'ハイキング'],
      shape: 'three_arrow_signpost',
      draw(p) {
        const c = p.c;
        p.rect(21, 7, 7, 36, c.outline);
        p.rect(23, 8, 3, 33, c.trunk);
        p.poly([[5, 10], [28, 10], [28, 18], [5, 18], [1, 14]], c.outline);
        p.poly([[7, 12], [25, 12], [25, 16], [7, 16], [4, 14]], c.wall);
        p.poly([[20, 20], [43, 20], [47, 24], [43, 28], [20, 28]], c.outline);
        p.poly([[23, 22], [42, 22], [44, 24], [42, 26], [23, 26]], c.roof);
        p.poly([[7, 30], [28, 30], [28, 38], [7, 38], [3, 34]], c.outline);
        p.poly([[9, 32], [25, 32], [25, 36], [9, 36], [6, 34]], c.wallShade);
        p.line(11, 14, 20, 14, c.outline, 1);
        p.line(29, 24, 39, 24, c.outline, 1);
        p.line(11, 34, 20, 34, c.outline, 1);
        p.poly([[16, 42], [33, 42], [38, 46], [11, 46]], c.outline);
        p.poly([[19, 43], [30, 43], [33, 44], [16, 44]], c.stone);
      }
    },
    {
      id: 'landmark-campfire-ring',
      name: 'キャンプファイア',
      category: 'ランドマーク',
      keywords: ['焚き火', 'キャンプ', 'レジャー', '火'],
      shape: 'stone_fire_ring_crossed_logs',
      draw(p) {
        const c = p.c;
        p.poly([[6, 32], [12, 26], [36, 26], [42, 32], [42, 39], [36, 44], [12, 44], [6, 39]], c.outline);
        p.poly([[9, 32], [14, 28], [34, 28], [39, 32], [39, 37], [34, 41], [14, 41], [9, 37]], c.stone);
        p.poly([[13, 32], [17, 30], [31, 30], [35, 32], [35, 36], [31, 39], [17, 39], [13, 36]], c.stoneDark);
        p.line(15, 37, 34, 30, c.outline, 5);
        p.line(14, 30, 34, 38, c.outline, 5);
        p.line(16, 36, 32, 31, c.trunk, 2);
        p.line(16, 31, 32, 37, c.trunk, 2);
        p.poly([[17, 29], [14, 23], [20, 17], [20, 8], [25, 14], [30, 7], [31, 19], [35, 24], [31, 31]], c.outline);
        p.poly([[20, 28], [18, 23], [22, 19], [22, 13], [25, 18], [29, 12], [29, 21], [32, 24], [29, 29]], c.gold);
        p.poly([[23, 28], [21, 24], [25, 20], [28, 24], [27, 29]], c.cream);
      }
    },
    {
      id: 'landmark-climbing-dome',
      name: 'ジャングルジムドーム',
      category: 'ランドマーク',
      keywords: ['ジャングルジム', '遊具', 'ドーム', '公園'],
      shape: 'geodesic_climbing_dome',
      draw(p) {
        const c = p.c;
        p.line(5, 39, 24, 8, c.outline, 3);
        p.line(43, 39, 24, 8, c.outline, 3);
        p.line(5, 39, 43, 39, c.outline, 3);
        p.line(11, 29, 37, 29, c.outline, 2);
        p.line(16, 19, 32, 19, c.outline, 2);
        p.line(5, 39, 16, 19, c.stone, 1);
        p.line(16, 19, 37, 29, c.stone, 1);
        p.line(37, 29, 5, 39, c.stone, 1);
        p.line(43, 39, 32, 19, c.stone, 1);
        p.line(32, 19, 11, 29, c.stone, 1);
        p.line(11, 29, 43, 39, c.stone, 1);
        p.line(11, 29, 24, 8, c.stone, 1);
        p.line(37, 29, 24, 8, c.stone, 1);
        p.line(24, 8, 24, 39, c.outline, 2);
        p.dot(24, 8, c.gold);
        p.dot(16, 19, c.gold);
        p.dot(32, 19, c.gold);
        p.dot(11, 29, c.gold);
        p.dot(37, 29, c.gold);
        p.rect(2, 39, 9, 4, c.outline);
        p.rect(37, 39, 9, 4, c.outline);
      }
    },
    {
      id: 'landmark-merry-go-round',
      name: '回転遊具',
      category: 'ランドマーク',
      keywords: ['回転遊具', 'メリーゴーラウンド', '遊具', '公園'],
      shape: 'octagonal_spinner_radial_rails',
      draw(p) {
        const c = p.c;
        p.poly([[5, 30], [11, 23], [24, 20], [37, 23], [43, 30], [40, 38], [29, 43], [16, 43], [8, 38]], c.outline);
        p.poly([[9, 30], [14, 26], [24, 23], [34, 26], [39, 30], [37, 35], [28, 39], [17, 39], [11, 35]], c.roof);
        p.line(24, 7, 24, 34, c.outline, 4);
        p.rect(22, 6, 4, 28, c.stoneDark);
        p.line(24, 16, 10, 29, c.outline, 2);
        p.line(24, 16, 38, 29, c.outline, 2);
        p.line(24, 16, 24, 38, c.outline, 2);
        p.line(24, 16, 14, 36, c.outline, 2);
        p.line(24, 16, 34, 36, c.outline, 2);
        p.poly([[18, 7], [24, 2], [30, 7]], c.outline);
        p.poly([[21, 7], [24, 4], [27, 7]], c.gold);
        p.rect(7, 27, 7, 5, c.outline);
        p.rect(34, 27, 7, 5, c.outline);
        p.rect(20, 35, 8, 5, c.outline);
        p.rect(9, 42, 30, 4, c.outline);
        p.rect(13, 42, 22, 2, c.stone);
      }
    },
    {
      id: 'landmark-mini-windmill',
      name: '丘の風車',
      category: 'ランドマーク',
      keywords: ['風車', '丘', '村', 'ランドマーク'],
      shape: 'conical_mill_four_sails',
      draw(p) {
        const c = p.c;
        p.poly([[15, 42], [33, 42], [30, 15], [18, 15]], c.outline);
        p.poly([[18, 40], [30, 40], [28, 17], [20, 17]], c.wall);
        p.rect(21, 33, 7, 9, c.outline);
        p.rect(23, 35, 3, 7, c.door);
        p.rect(21, 22, 6, 6, c.outline);
        p.rect(23, 24, 2, 2, c.window);
        p.poly([[15, 15], [24, 6], [33, 15]], c.outline);
        p.poly([[19, 14], [24, 9], [29, 14]], c.roofDark);
        p.dot(24, 17, c.gold);
        p.line(24, 17, 10, 5, c.outline, 3);
        p.line(24, 17, 38, 5, c.outline, 3);
        p.line(24, 17, 38, 29, c.outline, 3);
        p.line(24, 17, 10, 29, c.outline, 3);
        p.poly([[8, 2], [13, 4], [17, 10], [13, 12]], c.stone);
        p.poly([[35, 2], [40, 4], [35, 12], [31, 10]], c.stone);
        p.poly([[35, 22], [40, 25], [41, 31], [37, 31]], c.stone);
        p.poly([[13, 22], [17, 25], [11, 31], [7, 29]], c.stone);
        p.rect(11, 42, 26, 4, c.outline);
        p.rect(15, 42, 18, 2, c.stoneDark);
      }
    }
  ]
});
