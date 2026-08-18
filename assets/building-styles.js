(function (global) {
  'use strict';

  /* =====================================================
     PixelMap 建物スタイル分類
     棟（外形リング）単位の建物情報 {高さm, 面積セル, 施設kind, カテゴリ, シード}
     から、見た目の記述子（屋根・壁・配色・アクセント・屋上マーク）を
     決定的に返す純粋モジュール。DOM非依存で node --test 可能。
     カテゴリ色は icon-patterns.js のパターン07パレットと同一。
     ===================================================== */

  const VERSION = 'building-styles/2';

  // 高さバンド: 1=切妻住宅(<10m) 2=低層陸屋根(10-30m) 3=中層(31-59m) 4=高層(60m+)
  const HEIGHT_BANDS = { gableMax:10, lowMax:31, midMax:60 };
  // 面積クラス（16pxセル換算）: S<28, bigBox 28-59, campus 60+
  const AREA_CLASSES = { bigBox:28, campus:60 };

  const CATEGORY_ACCENTS = {
    transit:'#2563eb', health:'#ef4444', civic:'#7c3aed', food:'#f59e0b',
    commerce:'#db2777', landmark:'#facc15', nature:'#16a34a', stay:'#8b5cf6',
    service:'#475569', generic:'#64748b',
  };

  /* 旧ROOFPALと同一の10配色 [屋根, 濃, ハイライト]。ページ側はこれを参照する */
  const LEGACY_ROOFPAL = [
    ['#e05038','#b03828','#f87858'],  // 0 赤い切妻
    ['#5078d8','#3858b0','#88a0f0'],  // 1 青
    ['#48a058','#357f42','#70c078'],  // 2 緑
    ['#e08038','#b06028','#f8a860'],  // 3 だいだい
    ['#8890a0','#687080','#a8b0c0'],  // 4 スレート
    ['#a07850','#805838','#c09868'],  // 5 こげ茶
    ['#707c90','#525c70','#8a96ac'],  // 6 中層ビル屋上
    ['#3c4454','#2a3040','#546078'],  // 7 高層ビル
    ['#b4b4b0','#909090','#d0d0cc'],  // 8 大型商業屋根
    ['#c8a878','#a08858','#e0c898'],  // 9 アパート
  ];
  const HOUSE_PALETTES = [0, 1, 2, 3, 4, 5, 9];   // band1住宅が使うインデックス

  /* band2低層陸屋根の3配色（コンクリ / ベージュ / 青灰） */
  const FLAT_PALETTES = [
    ['#9aa0a8','#787e88','#b8bec6'],
    ['#b8ac94','#948a74','#d4c8ac'],
    ['#8c98a8','#6c7888','#aab6c4'],
  ];

  // 棟リングキーなどの文字列から決定的なシードを得る（FNV-1a）
  function seedFromKey(key){
    let hash = 2166136261;
    for (const ch of String(key || '')){ hash ^= ch.codePointAt(0); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }

  /* 密集した棟の表示選抜。
     candidates: [{ id, key, area, cells:[[x,y],...], protected }]
     protected は互いに間引かず全件を先に採用し、それ以外は面積の大きい順で
     採用済みセルから gapCells 以内にない棟だけを残す。 */
  function selectDenseBuildings(candidates = [], { gapCells = 1 } = {}){
    const gap = Math.max(0, Math.floor(Number(gapCells) || 0));
    const normalized = candidates.map((candidate, index) => ({
      id:candidate.id ?? index,
      key:String(candidate.key ?? candidate.id ?? index),
      area:Number(candidate.area) || 0,
      cells:Array.isArray(candidate.cells) ? candidate.cells : [],
      protected:Boolean(candidate.protected),
    }));
    const acceptedCells = new Set();
    const visible = new Set();
    const cellKey = (x, y) => `${x},${y}`;
    const stamp = candidate => {
      visible.add(candidate.id);
      for (const cell of candidate.cells){
        if (!Array.isArray(cell) || cell.length < 2) continue;
        acceptedCells.add(cellKey(Number(cell[0]), Number(cell[1])));
      }
    };
    const overlapsAccepted = candidate => {
      for (const cell of candidate.cells){
        if (!Array.isArray(cell) || cell.length < 2) continue;
        const x = Number(cell[0]), y = Number(cell[1]);
        for (let dy = -gap; dy <= gap; dy++)
          for (let dx = -gap; dx <= gap; dx++)
            if (acceptedCells.has(cellKey(x + dx, y + dy))) return true;
      }
      return false;
    };
    const byKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    const protectedCandidates = normalized.filter(candidate => candidate.protected).sort(byKey);
    const ordinaryCandidates = normalized.filter(candidate => !candidate.protected)
      .sort((a, b) => b.area - a.area || byKey(a, b));

    // 保護対象は近接していても全件残し、後続の通常建物に対する占有物として扱う。
    for (const candidate of protectedCandidates) stamp(candidate);
    for (const candidate of ordinaryCandidates){
      if (!overlapsAccepted(candidate)) stamp(candidate);
    }
    return visible;
  }

  /* 入力:
       heightM   … render_height（m）
       areaCells … 棟の幾何面積（16pxセル換算・クリップ非依存）
       kind      … 'normal' | 'poi' | 'hospital' | 'convenience' | 'mixed'
       category  … リゾルバーの10カテゴリ or null
       seed      … 棟リングキー由来の整数（配色バリアント選択に使用）
     優先順: kind強制 → 高さバンド → 面積上書き。
     カテゴリは直交（accent/glyphのみ変え、シルエットは変えない）。 */
  function buildingAppearance({ heightM = 0, areaCells = 0, kind = 'normal', category = null, seed = 0 } = {}){
    const h = Number(heightM) || 0;
    const area = Number(areaCells) || 0;
    const v = ((Number(seed) || 0) % 0x7fffffff + 0x7fffffff) % 0x7fffffff;
    const areaClass = area >= AREA_CLASSES.campus ? 'campus'
      : area >= AREA_CLASSES.bigBox ? 'bigBox' : 'S';
    const facility = kind !== 'normal' && kind !== 'none';
    const accent = facility && category ? (CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.generic) : null;

    let band, roofKey, pal, wallKey, motif, styleIndex;
    if (kind === 'hospital'){
      band = 2; roofKey = 'roofBigBox'; pal = LEGACY_ROOFPAL[8]; styleIndex = 8;
      wallKey = 'low'; motif = 'hvac';
    } else if (kind === 'convenience'){
      band = 1; roofKey = 'roofGable:4'; pal = LEGACY_ROOFPAL[4]; styleIndex = 4;
      wallKey = 'low'; motif = null;
    } else if (kind === 'mixed'){
      band = 3; roofKey = 'roofMid'; pal = LEGACY_ROOFPAL[6]; styleIndex = 6;
      wallKey = 'tower'; motif = 'ac';
    } else if (h >= HEIGHT_BANDS.midMax){
      band = 4; roofKey = 'roofHigh'; pal = LEGACY_ROOFPAL[7]; styleIndex = 7;
      wallKey = 'tower'; motif = 'aviation';
    } else if (h >= HEIGHT_BANDS.lowMax){
      band = 3; roofKey = 'roofMid'; pal = LEGACY_ROOFPAL[6]; styleIndex = 6;
      wallKey = 'tower'; motif = 'ac';
    } else if (areaClass === 'campus'){
      band = 2; roofKey = 'roofCampus'; pal = LEGACY_ROOFPAL[8]; styleIndex = 8;
      wallKey = 'low'; motif = 'hvac';
    } else if (areaClass === 'bigBox'){
      band = 2; roofKey = 'roofBigBox'; pal = LEGACY_ROOFPAL[8]; styleIndex = 8;
      wallKey = 'low'; motif = 'hvac';
    } else if (h >= HEIGHT_BANDS.gableMax){
      const flat = v % FLAT_PALETTES.length;
      band = 2; roofKey = `roofFlat:${flat}`; pal = FLAT_PALETTES[flat]; styleIndex = 4;
      wallKey = 'low'; motif = 'tank';
    } else {
      const houseStyle = HOUSE_PALETTES[v % HOUSE_PALETTES.length];
      band = 1; roofKey = `roofGable:${houseStyle}`; pal = LEGACY_ROOFPAL[houseStyle]; styleIndex = houseStyle;
      wallKey = 'house'; motif = 'gable';
    }

    return {
      band,
      areaClass,
      roofKey,
      styleIndex,        // 旧bldStyle互換のフォールバック用
      pal,
      wallKey,
      isHouse:wallKey === 'house',
      accent,
      glyph:accent ? category : null,
      motif,
    };
  }

  const api = {
    VERSION,
    HEIGHT_BANDS,
    AREA_CLASSES,
    CATEGORY_ACCENTS,
    LEGACY_ROOFPAL,
    HOUSE_PALETTES,
    FLAT_PALETTES,
    seedFromKey,
    selectDenseBuildings,
    buildingAppearance,
  };
  global.PixelMapBuildingStyles = api;
})(typeof window !== 'undefined' ? window : globalThis);
