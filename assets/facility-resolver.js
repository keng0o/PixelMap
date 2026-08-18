(function (global) {
  'use strict';

  /* =====================================================
     PixelMap 施設リゾルバー
     施設の icon / dot / cluster を「画面の状態」ではなく
     「地図データの属性」としてワールド座標上で決定的に確定する純粋モジュール。
     入力は (タイルデータ, パターン) のみ。ビューポート・画面サイズ・
     アクティブレイヤーには一切依存しないため、同じタイル・同じパターンなら
     世界中どこから見ても・何度計算しても同じ結果を返す。
     クライアント描画と（将来の）静的タイル生成の両方がこの1実装を共有する。

     建物の同一性について: z14 の building レイヤーは多数の棟が少数の
     マルチポリゴン feature に統合されているため、feature 単位ではなく
     「POIを含むリング＝その棟」を建物の単位として扱う
     （旧実装の4連結フラッドフィルと同じ意味論）。
     ===================================================== */

  const ALGORITHM_VERSION = 'facility-resolver/2';
  const TILE_PX = 1536;            // z14表示スケール: 1タイル = 96セル × 16px
  const CELL_PX = 16;
  const CELL_AREA = CELL_PX * CELL_PX;
  const NEAR_BUILDING_PX = 32;     // POIを建物へ紐づける最大距離（旧±2セル走査相当）
  const CLUSTER_BUCKET_PX = 64;    // 点クラスターの世界座標バケット幅
  const CLUSTER_MIN_DOTS = 4;      // バケット内がこの点数以上でクラスターへ統合
  const COLLISION_BUCKET_PX = 160; // 衝突・重複判定の最大干渉距離を覆う空間ハッシュ幅
  const RING_BUCKET_PX = 128;      // 建物リングの空間ハッシュ幅

  /* ---- 施設分類（map-02から移設した唯一の正典） ---- */
  const CLASS2SPRITE = {
    railway:'station', bus:'bus', tram:'station', ferry:'station', aerialway:'station', harbor:'station',
    shop:'shop', mall:'mall', department_store:'mall', shopping_centre:'mall', clothing_store:'shop', alcohol_shop:'shop', convenience:'grocery', bakery:'grocery', grocery:'grocery',
    restaurant:'restaurant', fast_food:'fast_food', cafe:'cafe', bar:'bar', beer:'bar', ice_cream:'cafe',
    lodging:'hotel', hotel:'hotel',
    hospital:'hospital', doctors:'hospital', dentist:'hospital', veterinary:'hospital', pharmacy:'pharmacy',
    school:'school', college:'school', university:'school', kindergarten:'school', library:'library',
    bank:'bank', atm:'bank', money:'bank',
    post:'post', police:'police', fire_station:'fire_station', town_hall:'townhall', townhall:'townhall',
    place_of_worship:'place_of_worship',
    attraction:'attraction', monument:'monument', castle:'castle', art_gallery:'gallery', museum:'museum',
    theatre:'theatre', cinema:'cinema', music:'cinema', entertainment:'cinema',
    park:'park', garden:'park', playground:'park', dog_park:'park', pitch:'park', stadium:'park', golf:'park', swimming:'park', zoo:'zoo',
    parking:'parking', fuel:'parking', charging_station:'charge_hub',
  };
  const CATEGORY_KEYS = {
    health:new Set(['hospital','doctors','dentist','veterinary','pharmacy','clinic']),
    civic:new Set(['school','college','university','kindergarten','library','bank','atm','money','post','police','fire_station','town_hall','townhall']),
    food:new Set(['restaurant','fast_food','cafe','bar','beer','ice_cream','bakery','grocery','convenience']),
    commerce:new Set(['shop','mall','department_store','shopping_centre','clothing_store','alcohol_shop']),
    landmark:new Set(['attraction','monument','castle','art_gallery','museum','theatre','cinema','music','entertainment','place_of_worship']),
    nature:new Set(['park','garden','playground','dog_park','pitch','stadium','golf','swimming','zoo']),
    stay:new Set(['lodging','hotel','hostel','motel','guest_house']),
    service:new Set(['parking','fuel','charging_station']),
  };
  const featureName = props => props['name:ja'] || props.name || null;
  const isStationProps = props => {
    const c = props.class || '', s = props.subclass || '';
    return c === 'railway' || c === 'station' || s === 'railway' || s === 'station' ||
      s === 'halt' || s === 'tram_stop';
  };
  const isHospitalProps = props => props.class === 'hospital' || props.subclass === 'hospital';
  function isProtectedProps(props, protectedKinds){
    return (protectedKinds.has('station') && isStationProps(props)) ||
      (protectedKinds.has('hospital') && isHospitalProps(props));
  }
  const poiImportance = props => {
    if (isStationProps(props)) return 0;
    const k = props.subclass || props.class || '';
    const priority = {
      town_hall:2, townhall:2, hospital:3, mall:4, school:5, university:5,
      attraction:6, museum:6, police:7, fire_station:7, park:8,
      place_of_worship:9, hotel:10, post:11, library:11, bus:12,
      restaurant:18, grocery:18, cafe:20, shop:22, parking:28,
    };
    return (priority[k] ?? 24) + Math.min(20, Number(props.rank ?? 20)) * .15;
  };
  function poiCategory(props){
    if (isStationProps(props) || ['bus','tram','ferry','aerialway','harbor'].includes(props.subclass || props.class)) return 'transit';
    const keys = [props.subclass, props.class].filter(Boolean);
    for (const [category, values] of Object.entries(CATEGORY_KEYS))
      if (keys.some(key => values.has(key))) return category;
    return 'generic';
  }
  const tierValue = size => ({ S:0, M:1, L:2 }[size] ?? 0);
  const tierFromValue = value => ['S','M','L'][Math.max(0, Math.min(2, value))];
  function patternSize(pattern, metrics, category){
    const areaTier = metrics.area >= pattern.areaL ? 2 : metrics.area >= pattern.areaM ? 1 : 0;
    const heightTier = metrics.height >= pattern.heightL ? 2 : metrics.height >= pattern.heightM ? 1 : 0;
    let tier = Math.max(areaTier, heightTier);
    const minimum = pattern.minSize?.[category];
    if (minimum) tier = Math.max(tier, tierValue(minimum));
    return tierFromValue(tier);
  }
  function patternAssetCount(pattern, metrics, category){
    if (pattern.maxAssets <= 1) return 1;
    if (pattern.multiCategories && !pattern.multiCategories.includes(category)) return 1;
    const areaCount = (pattern.assetArea || []).filter(limit => metrics.area >= limit).length;
    const heightCount = (pattern.assetHeight || []).filter(limit => metrics.height >= limit).length;
    const extra = pattern.multiMode === 'area' ? areaCount
      : pattern.multiMode === 'height' ? heightCount
        : Math.max(areaCount, heightCount);
    return Math.min(pattern.maxAssets, 1 + extra);
  }
  function stablePoiSeed(props){
    const source = `${props['name:ja'] || props.name || ''}|${props.class || ''}|${props.subclass || ''}`;
    let hash = 2166136261;
    for (const ch of source){ hash ^= ch.codePointAt(0); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
  function selectionPriorityFor(pattern, p){
    const index = pattern.priority.indexOf(p.category);
    return (index < 0 ? pattern.priority.length : index) * 100 + p.importance * 2 + p.rank * .05 - p.metrics.area * .015 - p.metrics.height * .02;
  }
  // patternOffsetのx/yは絶対ワールドpx。market-staggerの縞も世界座標に固定される。
  function patternOffsetFor(pattern, p, x, y){
    const seed = stablePoiSeed(p.props);
    const categoryIndex = Math.max(0, pattern.priority.indexOf(p.category));
    if (pattern.offset === 'market-stagger' && ['food','commerce'].includes(p.category))
      return [((Math.floor(y / 16) + categoryIndex) % 2 ? 8 : -8), 0];
    if (pattern.offset === 'transit-lane') return [p.category === 'transit' ? 0 : (categoryIndex % 3 - 1) * 5, 0];
    if (pattern.offset === 'civic-pair' && ['health','civic'].includes(p.category)) return [p.category === 'health' ? -6 : 6, -3];
    if (pattern.offset === 'micro-jitter') return [((seed % 3) - 1) * 4, ((Math.floor(seed / 3) % 3) - 1) * 4];
    if (pattern.offset === 'height-rise') return [0, -Math.min(10, Math.round(p.metrics.height / 8))];
    if (pattern.offset === 'footprint-orbit') return [((seed % 3) - 1) * Math.min(6, Math.round(p.metrics.area / 12)), 0];
    if (pattern.offset === 'category-nudge') return [(categoryIndex % 3 - 1) * 5, (Math.floor(categoryIndex / 3) % 3 - 1) * 3];
    if (pattern.offset === 'beacon-ring' && ['landmark','transit','health'].includes(p.category)) return [0, -6];
    return [0, 0];
  }
  const visualScaleFor = (pattern, category) => pattern.scale * (pattern.categoryScale?.[category] || 1);
  const visualRadiusFor = (pattern, category, assetCount) =>
    24 * visualScaleFor(pattern, category) + Math.max(0, assetCount - 1) * 8;
  function buildingPoiType(props){
    const types = [props.class, props.subclass].filter(Boolean);
    if (types.includes('hospital')) return 'hospital';
    if (types.includes('convenience')) return 'convenience';
    return 'other';
  }

  /* ---- 幾何ヘルパー（すべて絶対ワールドpx・平方距離で決定的に比較） ---- */
  function ringArea(ring){
    let sum = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
      sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
    return Math.abs(sum / 2);
  }
  function ringContains(x, y, ring){
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  }
  function segmentDist2(x, y, ax, ay, bx, by){
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx - x, qy = ay + t * dy - y;
    return qx * qx + qy * qy;
  }
  function ringDist2(x, y, ring){
    let best = Infinity;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
      best = Math.min(best, segmentDist2(x, y, ring[j][0], ring[j][1], ring[i][0], ring[i][1]));
    return best;
  }

  /* ---- タイル1枚のワールドpx変換（layersオブジェクト単位でキャッシュ） ---- */
  const conversionCache = new WeakMap();
  let tileSequence = 0;
  function convertTile(tile){
    if (tile.empty || !tile.layers) return { pois:[], rings:[] };
    const cached = conversionCache.get(tile.layers);
    if (cached) return cached;
    const { layers, baseX = 0, baseY = 0 } = tile;
    // 組ID用のタイル通し番号。値そのものは出力へ出ないため決定性に影響しない。
    const tileSeq = ++tileSequence;
    const pois = [];
    const rings = [];

    const poiLayer = layers.poi;
    if (poiLayer){
      const scale = TILE_PX / (poiLayer.extent || 4096);
      for (const f of poiLayer.features){
        if (f.type !== 1) continue;
        const points = f.geom.flat();
        if (!points.length) continue;
        let sx = 0, sy = 0;
        for (const [px, py] of points){ sx += px; sy += py; }
        const x = (sx / points.length) * scale + baseX * TILE_PX;
        const y = (sy / points.length) * scale + baseY * TILE_PX;
        const props = f.props;
        const key = `${f.id ?? ''}|${props.class ?? ''}|${props.subclass ?? ''}|` +
          `${featureName(props) ?? ''}|${Math.round(x * 8)},${Math.round(y * 8)}`;
        pois.push({ key, props, x, y });
      }
    }

    const buildingLayer = layers.building;
    if (buildingLayer){
      const scale = TILE_PX / (buildingLayer.extent || 4096);
      for (let fi = 0; fi < buildingLayer.features.length; fi++){
        const f = buildingLayer.features[fi];
        if (f.type !== 3 || !f.geom.length) continue;
        const pieceId = `${tileSeq}:${fi}`;   // 同featureのリング同士で偶奇判定するための組ID
        for (const line of f.geom){
          if (line.length < 3) continue;
          const pts = line.map(([px, py]) => [
            px * scale + baseX * TILE_PX,
            py * scale + baseY * TILE_PX,
          ]);
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const [px, py] of pts){
            if (px < minX) minX = px; if (px > maxX) maxX = px;
            if (py < minY) minY = py; if (py > maxY) maxY = py;
          }
          rings.push({
            pts, minX, minY, maxX, maxY,
            area:ringArea(pts),
            key:`r:${Math.round(minX)},${Math.round(minY)},${Math.round(maxX)},${Math.round(maxY)}`,
            pieceId,
            props:f.props,
          });
        }
      }
    }
    const converted = { pois, rings };
    conversionCache.set(tile.layers, converted);
    return converted;
  }

  /* ---- 文脈収集: 3×3タイルの POI / 建物リングを集める ---- */
  function collectContext(tileX, tileY, getTile){
    const pois = new Map();   // dedupeKey -> poi record
    const rings = [];
    const ringKeysSeen = new Set();
    for (let dy = -1; dy <= 1; dy++){
      for (let dx = -1; dx <= 1; dx++){
        const tile = getTile(tileX + dx, tileY + dy);
        if (!tile) return null;                      // 文脈が揃うまで解決しない
        const converted = convertTile(tile);
        for (const poi of converted.pois){
          if (pois.has(poi.key)) continue;           // タイル境界バッファの重複を排除
          pois.set(poi.key, { key:poi.key, props:poi.props, x:poi.x, y:poi.y });
        }
        for (const ring of converted.rings){
          // 完全に同一のリング（隣接タイルのバッファ複製）は1つに
          const seenKey = `${ring.key}|${ring.pts.length}`;
          if (ringKeysSeen.has(seenKey)) continue;
          ringKeysSeen.add(seenKey);
          rings.push(ring);
        }
      }
    }
    return { pois, rings };
  }

  /* ---- POI→棟（リング）の紐づけ ----
     含有する外形リングのうち最大面積のものを採用（穴は同featureのリングとの
     偶奇判定で除外）。含有がなければ32px以内の最近傍リング。 ---- */
  function bindPoisToRings(pois, rings){
    const index = new Map();
    const bucketKey = (bx, by) => `${bx}:${by}`;
    for (const ring of rings){
      const minBx = Math.floor((ring.minX - NEAR_BUILDING_PX) / RING_BUCKET_PX);
      const maxBx = Math.floor((ring.maxX + NEAR_BUILDING_PX) / RING_BUCKET_PX);
      const minBy = Math.floor((ring.minY - NEAR_BUILDING_PX) / RING_BUCKET_PX);
      const maxBy = Math.floor((ring.maxY + NEAR_BUILDING_PX) / RING_BUCKET_PX);
      for (let by = minBy; by <= maxBy; by++)
        for (let bx = minBx; bx <= maxBx; bx++){
          const key = bucketKey(bx, by);
          if (!index.has(key)) index.set(key, []);
          index.get(key).push(ring);
        }
    }
    const near2 = NEAR_BUILDING_PX * NEAR_BUILDING_PX;
    for (const poi of pois.values()){
      const candidates = index.get(bucketKey(
        Math.floor(poi.x / RING_BUCKET_PX), Math.floor(poi.y / RING_BUCKET_PX))) || [];
      // 同じ組（feature）のリングで偶奇を数え、穴の内側を除外する
      const parity = new Map();      // pieceId -> 含有リング数
      const containing = [];
      for (const ring of candidates){
        if (poi.x < ring.minX || poi.x > ring.maxX || poi.y < ring.minY || poi.y > ring.maxY) continue;
        if (!ringContains(poi.x, poi.y, ring.pts)) continue;
        parity.set(ring.pieceId, (parity.get(ring.pieceId) || 0) + 1);
        containing.push(ring);
      }
      let bound = null;
      for (const ring of containing){
        if (parity.get(ring.pieceId) % 2 === 0) continue;   // 穴の内側
        if (!bound || ring.area > bound.area ||
            (ring.area === bound.area && ring.key < bound.key)) bound = ring;
      }
      if (!bound){
        let bestDist2 = near2;
        for (const ring of candidates){
          if (poi.x < ring.minX - NEAR_BUILDING_PX || poi.x > ring.maxX + NEAR_BUILDING_PX ||
              poi.y < ring.minY - NEAR_BUILDING_PX || poi.y > ring.maxY + NEAR_BUILDING_PX) continue;
          const dist2 = ringDist2(poi.x, poi.y, ring.pts);
          if (dist2 > near2) continue;
          if (dist2 < bestDist2 || !bound ||
              (dist2 === bestDist2 && (ring.area > bound.area ||
                (ring.area === bound.area && ring.key < bound.key)))){
            bound = ring; bestDist2 = dist2;
          }
        }
      }
      poi.building = bound || null;
    }
  }

  /* ---- タイル1枚の施設を確定する ----
     入力:
       tileX/tileY … 確定対象の正規タイル座標
       pattern     … icon-patterns.js のパターン設定
       collisionPolicy … 任意。protected-area と hidden 表現を指定できる
       getTile(x,y) … { layers, baseX, baseY } を返す（layersの座標は
                       (タイル座標-base)*extent が加算済み）。未取得なら null、
                       世界の外など恒久的に空なら { empty:true }。
     出力: 施設リスト（このタイルにアンカーを持つものだけ）。文脈9タイルが
           揃わないうちは null を返し、呼び出し側が取得後に再試行する。 */
  function resolveTile({ tileX, tileY, pattern, getTile, collisionPolicy = null }){
    const context = collectContext(tileX, tileY, getTile);
    if (!context) return null;
    bindPoisToRings(context.pois, context.rings);
    const protectedAreaPriority = collisionPolicy?.priority === 'protected-area';
    const protectedKinds = new Set(Array.isArray(collisionPolicy?.protectedKinds)
      ? collisionPolicy.protectedKinds : []);
    const loserRepresentation = collisionPolicy?.loserRepresentation === 'hidden' ? 'hidden' : 'dot';

    /* --- 雑居ビル統合: 同じ棟のテナントを1施設へ --- */
    const groups = new Map();   // ringKey|poiKey -> { building, tenants[] }
    for (const poi of context.pois.values()){
      const key = poi.building ? poi.building.key : `poi:${poi.key}`;
      if (!groups.has(key)) groups.set(key, { building:poi.building, tenants:[] });
      groups.get(key).tenants.push(poi);
    }

    const snap = Math.max(4, Number(pattern.snap) || CELL_PX);
    const facilities = [];
    for (const [groupKey, group] of groups){
      const tenants = group.tenants
        .map(poi => ({ poi, importance:poiImportance(poi.props), rank:Number(poi.props.rank ?? 30) }))
        .sort((a, b) => a.importance - b.importance || a.rank - b.rank || (a.poi.key < b.poi.key ? -1 : 1));
      const rep = tenants[0];
      const props = rep.poi.props;
      const mixed = tenants.length > 1;
      const kind = !group.building ? 'none'
        : mixed ? 'mixed'
          : buildingPoiType(props) !== 'other' ? buildingPoiType(props) : 'poi';
      const metrics = {
        area:group.building ? group.building.area / CELL_AREA : 0,  // セル換算面積
        height:group.building ? Number(group.building.props.render_height || 0) : 0,
        kind,
      };
      const category = poiCategory(props);
      const size = patternSize(pattern, metrics, category);
      const assetCount = patternAssetCount(pattern, metrics, category);
      const idNum = Number(String(rep.poi.key).split('|')[0] || 0);
      const nameSeed = [...(featureName(props) || props.class || '')]
        .reduce((sum, ch) => sum + ch.codePointAt(0), 0);
      const facility = {
        key:groupKey,
        name:featureName(props),
        props,
        sourcePoiIds:tenants.map(t => t.poi.key),
        buildingId:group.building ? group.building.key : null,
        facilityRole:!group.building ? 'standalone' : mixed ? 'mixed_building' : 'building',
        category,
        spriteKey:CLASS2SPRITE[props.subclass] || CLASS2SPRITE[props.class] || 'generic',
        variant:Math.abs((Number.isFinite(idNum) ? idNum : 0) + nameSeed) % 3,
        importance:rep.importance,
        rank:rep.rank,
        metrics,
        size,
        assetCount,
        visualScale:visualScaleFor(pattern, category),
        collisionRadius:visualRadiusFor(pattern, category, assetCount),
      };
      if (protectedAreaPriority)
        facility.collisionProtected = tenants.some(tenant => isProtectedProps(tenant.poi.props, protectedKinds));
      facility.selectionPriority = selectionPriorityFor(pattern, facility);
      // 世界座標グリッドへスナップしてから決定的オフセットを加える
      const sx = (Math.floor(rep.poi.x / snap) + 0.5) * snap;
      const sy = (Math.floor(rep.poi.y / snap) + 0.5) * snap;
      const [ox, oy] = patternOffsetFor(pattern, facility, sx, sy);
      facility.worldX = sx + ox;
      facility.worldY = sy + oy;
      facilities.push(facility);
    }

    /* --- 世界座標上の衝突解決（重要度→rank→安定キーの全域一貫した順で貪欲配置） --- */
    const defaultCollisionOrder = (a, b) =>
      a.selectionPriority - b.selectionPriority || a.rank - b.rank || (a.key < b.key ? -1 : 1);
    facilities.sort((a, b) => {
      if (!protectedAreaPriority) return defaultCollisionOrder(a, b);
      if (Boolean(a.collisionProtected) !== Boolean(b.collisionProtected))
        return a.collisionProtected ? -1 : 1;
      // 保護施設同士は従来重要度で決め、それ以外だけ建物面積を最優先する。
      if (!a.collisionProtected && a.metrics.area !== b.metrics.area)
        return b.metrics.area - a.metrics.area;
      return defaultCollisionOrder(a, b);
    });
    const acceptedBuckets = new Map();
    const bucketOf = (x, y) => `${Math.floor(x / COLLISION_BUCKET_PX)}:${Math.floor(y / COLLISION_BUCKET_PX)}`;
    const gapScale = pattern.gapScale || 1;
    const sameGapScale = pattern.sameGapScale || 1;
    const duplicateGap2 = (112 * gapScale) ** 2;
    for (const facility of facilities){
      let reason = 'icon';
      const bx = Math.floor(facility.worldX / COLLISION_BUCKET_PX);
      const by = Math.floor(facility.worldY / COLLISION_BUCKET_PX);
      search:
      for (let dy = -1; dy <= 1; dy++){
        for (let dx = -1; dx <= 1; dx++){
          const bucket = acceptedBuckets.get(`${bx + dx}:${by + dy}`);
          if (!bucket) continue;
          for (const other of bucket){
            const ddx = other.worldX - facility.worldX;
            const ddy = other.worldY - facility.worldY;
            const dist2 = ddx * ddx + ddy * ddy;
            if (facility.name && other.name === facility.name &&
                other.spriteKey === facility.spriteKey && dist2 < duplicateGap2){
              reason = `duplicate:${other.key}`;
              break search;
            }
            const sameKind = other.spriteKey === facility.spriteKey;
            const important = isStationProps(other.props) || isStationProps(facility.props) ||
              other.size === 'L' || facility.size === 'L';
            const scale = sameKind ? sameGapScale : gapScale;
            const baseGap = important ? 86 : sameKind ? 74 : 56;
            const scaleFactor = Math.max(.62, (facility.visualScale + other.visualScale) / 2);
            const minGap = Math.max(baseGap * scale * scaleFactor,
              facility.collisionRadius + other.collisionRadius + 6);
            if (dist2 < minGap * minGap){
              reason = `collision:${other.key}`;
              break search;
            }
          }
        }
      }
      if (reason === 'icon'){
        facility.representation = 'icon';
        facility.selectionReason = 'icon';
        const key = `${bx}:${by}`;
        if (!acceptedBuckets.has(key)) acceptedBuckets.set(key, []);
        acceptedBuckets.get(key).push(facility);
      } else {
        facility.representation = loserRepresentation;
        facility.selectionReason = reason;
      }
    }

    /* --- 点クラスター統合（世界座標に固定したバケットで決定的にまとめる） --- */
    const dotBuckets = new Map();
    for (const facility of facilities){
      if (facility.representation !== 'dot') continue;
      const bx = Math.floor(facility.worldX / CLUSTER_BUCKET_PX);
      const by = Math.floor(facility.worldY / CLUSTER_BUCKET_PX);
      const key = `${bx}:${by}`;
      if (!dotBuckets.has(key)) dotBuckets.set(key, { bx, by, dots:[] });
      dotBuckets.get(key).dots.push(facility);
    }
    const clusters = [];
    for (const bucket of dotBuckets.values()){
      if (bucket.dots.length < CLUSTER_MIN_DOTS) continue;
      const clusterId = `cluster:${bucket.bx}:${bucket.by}`;
      const members = bucket.dots.slice().sort((a, b) => (a.key < b.key ? -1 : 1));
      let sx = 0, sy = 0;
      for (const member of members){
        sx += member.worldX; sy += member.worldY;
        member.representation = 'cluster-member';
        member.clusterId = clusterId;
        member.selectionReason = `clustered:${clusterId}`;
      }
      const lead = members.slice().sort((a, b) =>
        a.selectionPriority - b.selectionPriority || (a.key < b.key ? -1 : 1))[0];
      clusters.push({
        clusterId,
        bucketCenterX:(bucket.bx + 0.5) * CLUSTER_BUCKET_PX,
        bucketCenterY:(bucket.by + 0.5) * CLUSTER_BUCKET_PX,
        worldX:Math.round(sx / members.length),
        worldY:Math.round(sy / members.length),
        count:members.length,
        category:lead.category,
        memberKeys:members.map(member => member.key),
      });
    }

    /* --- このタイルにアンカーを持つものだけを出力（境界の二重計上を防ぐ） --- */
    const ownsPoint = (x, y) =>
      Math.floor(x / TILE_PX) === tileX && Math.floor(y / TILE_PX) === tileY;
    const owned = facilities
      .filter(facility => ownsPoint(facility.worldX, facility.worldY))
      .sort((a, b) => (a.key < b.key ? -1 : 1));
    const ownedClusters = clusters
      .filter(cluster => ownsPoint(cluster.bucketCenterX, cluster.bucketCenterY))
      .sort((a, b) => (a.clusterId < b.clusterId ? -1 : 1));

    return {
      tileX, tileY,
      algorithmVersion:ALGORITHM_VERSION,
      patternId:pattern.id,
      facilities:owned,
      clusters:ownedClusters,
      stats:{
        contextPois:context.pois.size,
        contextRings:context.rings.length,
        facilities:owned.length,
        icons:owned.filter(f => f.representation === 'icon').length,
        dots:owned.filter(f => f.representation === 'dot').length,
        hidden:owned.filter(f => f.representation === 'hidden').length,
        clusterMembers:owned.filter(f => f.representation === 'cluster-member').length,
        clusters:ownedClusters.length,
      },
    };
  }

  const api = {
    ALGORITHM_VERSION,
    TILE_PX,
    CLUSTER_BUCKET_PX,
    CLUSTER_MIN_DOTS,
    resolveTile,
    CLASS2SPRITE,
    isStationProps,
    isHospitalProps,
    poiImportance,
    poiCategory,
    tierValue,
    featureName,
    stablePoiSeed,
  };
  global.PixelMapFacilityResolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
