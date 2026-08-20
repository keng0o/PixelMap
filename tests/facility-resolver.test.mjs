import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window=globalThis;
await import('../assets/facility-resolver.js');
await import('../assets/poi-sprites.js');

const RESOLVER = globalThis.PixelMapFacilityResolver;
const POI_ASSETS = globalThis.PixelMapPoiSprites;

/* パターン07（skyline-stack）: 4地点比較ページが固定で使う本番パターン */
const PATTERN_07 = {
  id:'07', slug:'skyline-stack', name:'高さスタック',
  marker:'tower', dot:'bar', scale:.84, gapScale:1.12, sameGapScale:1.16,
  snap:16, offset:'height-rise', drawOrder:'height', dotScale:.92,
  areaM:14, areaL:58, heightM:10, heightL:28,
  assetArea:[70], assetHeight:[16,34,70], maxAssets:4,
  priority:['transit','landmark','health','civic','stay','commerce','food','nature','service','generic'],
  palette:{ transit:'#2563eb', generic:'#64748b' },
  categoryScale:{ transit:1.08, stay:1.1, landmark:1.12 },
  multiMode:'height',
};

const EXTENT = 4096;
const DENSE_POLICY = {
  priority:'protected-area',
  protectedKinds:['station','hospital'],
  loserRepresentation:'hidden',
};

function poiFeature(id, cls, name, x, y, rank = 10){
  return { id, type:1, props:{ class:cls, name, rank }, geom:[[[x, y]]] };
}
function buildingFeature(id, x0, y0, x1, y1, height = 0){
  return {
    id, type:3, props:{ render_height:height },
    geom:[[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
  };
}
function makeTile({ pois = [], buildings = [] } = {}){
  return {
    poi:{ extent:EXTENT, features:pois },
    building:{ extent:EXTENT, features:buildings },
  };
}

/* base=(bx,by) を指定すると、クライアントの offsetTileLayers と同じく
   (タイル座標 - base) * extent を座標へ加算した状態を再現する */
function makeGetTile(tiles, base = null){
  return (x, y) => {
    const tile = tiles.get(`${x}/${y}`);
    if (!tile) return { empty:true };
    if (!base) return { layers:tile, baseX:x, baseY:y };
    const dx = (x - base.x) * EXTENT, dy = (y - base.y) * EXTENT;
    const layers = {};
    for (const [name, layer] of Object.entries(tile)){
      layers[name] = {
        extent:layer.extent,
        features:layer.features.map(f => ({
          ...f,
          props:{ ...f.props },
          geom:f.geom.map(line => line.map(([px, py]) => [px + dx, py + dy])),
        })),
      };
    }
    return { layers, baseX:base.x, baseY:base.y };
  };
}

function resolve(tiles, tileX, tileY, base = null, collisionPolicy = null){
  return RESOLVER.resolveTile({
    tileX, tileY, pattern:PATTERN_07, getTile:makeGetTile(tiles, base), collisionPolicy,
  });
}

test('文脈9タイルが揃わないうちは null を返す', () => {
  const tiles = new Map([['10/10', makeTile()]]);
  const getTile = (x, y) => (x === 10 && y === 10) ? { layers:tiles.get('10/10'), baseX:10, baseY:10 } : null;
  assert.equal(RESOLVER.resolveTile({ tileX:10, tileY:10, pattern:PATTERN_07, getTile }), null);
});

test('決定性: 同じ入力・異なる基準タイルでも結果は完全一致する', () => {
  const tiles = new Map([['10/10', makeTile({
    pois:[
      poiFeature(1, 'railway', 'A駅', 2000, 2000),
      poiFeature(2, 'cafe', '喫茶B', 2400, 2000),
      poiFeature(3, 'shop', '店C', 2000, 2600),
    ],
    buildings:[buildingFeature(9, 2300, 1900, 2500, 2100, 40)],
  })]]);
  const first = resolve(tiles, 10, 10);
  const second = resolve(tiles, 10, 10);
  const rebased = resolve(tiles, 10, 10, { x:8, y:9 });
  assert.deepEqual(second, first);
  assert.deepEqual(rebased, first);
  assert.equal(first.algorithmVersion, RESOLVER.ALGORITHM_VERSION);
});

test('衝突解決: 重要度の低い近接施設は dot になり理由が残る', () => {
  const tiles = new Map([['10/10', makeTile({
    pois:[
      poiFeature(1, 'railway', 'A駅', 2000, 2000),
      poiFeature(2, 'cafe', '喫茶B', 2100, 2000),   // 駅から約38px
    ],
  })]]);
  const result = resolve(tiles, 10, 10);
  const station = result.facilities.find(f => f.spriteKey === 'station');
  const cafe = result.facilities.find(f => f.spriteKey === 'cafe');
  assert.equal(station.representation, 'icon');
  assert.equal(cafe.representation, 'dot');
  assert.match(cafe.selectionReason, /^collision:/);
  assert.equal(result.stats.hidden, 0);
});

test('面積優先: 保護対象でない近接施設は大きい建物が icon、小さい建物が hidden になる', () => {
  const tiles = new Map([['10/10', makeTile({
    pois:[
      poiFeature(1, 'museum', '小資料館', 1990, 2000),
      poiFeature(2, 'cafe', '大型カフェ', 2030, 2000),
    ],
    buildings:[
      buildingFeature(10, 1800, 1900, 2000, 2100),
      buildingFeature(11, 2020, 1800, 2480, 2200),
    ],
  })]]);
  const result = resolve(tiles, 10, 10, null, DENSE_POLICY);
  const small = result.facilities.find(f => f.name === '小資料館');
  const large = result.facilities.find(f => f.name === '大型カフェ');
  assert.ok(large.metrics.area > small.metrics.area);
  assert.equal(large.representation, 'icon');
  assert.equal(small.representation, 'hidden');
  assert.match(small.selectionReason, /^collision:/);
  assert.equal(result.stats.hidden, 1);
});

test('面積優先: 駅と病院は大きい一般施設より優先される', () => {
  for (const [protectedClass, protectedName] of [['railway', '保護駅'], ['hospital', '保護病院']]){
    const tiles = new Map([['10/10', makeTile({
      pois:[
        poiFeature(1, protectedClass, protectedName, 1990, 2000),
        poiFeature(2, 'cafe', '大型カフェ', 2030, 2000),
      ],
      buildings:[
        buildingFeature(10, 1800, 1900, 2000, 2100),
        buildingFeature(11, 2020, 1800, 2480, 2200),
      ],
    })]]);
    const result = resolve(tiles, 10, 10, null, DENSE_POLICY);
    const protectedFacility = result.facilities.find(f => f.name === protectedName);
    const large = result.facilities.find(f => f.name === '大型カフェ');
    assert.equal(protectedFacility.collisionProtected, true);
    assert.equal(protectedFacility.representation, 'icon');
    assert.equal(large.representation, 'hidden');
  }
});

test('面積優先: 複合施設は代表テナント以外に病院があっても保護する', () => {
  const tiles = new Map([['10/10', makeTile({
    pois:[
      poiFeature(1, 'town_hall', '複合庁舎', 1200, 1200),
      poiFeature(2, 'hospital', '庁舎内病院', 1250, 1250),
    ],
    buildings:[buildingFeature(9, 1000, 1000, 1400, 1400)],
  })]]);
  const result = resolve(tiles, 10, 10, null, DENSE_POLICY);
  assert.equal(result.facilities.length, 1);
  assert.equal(result.facilities[0].name, '複合庁舎');
  assert.equal(result.facilities[0].collisionProtected, true);
});

test('面積優先: hidden は点クラスターへ再統合しない', () => {
  const pois = [poiFeature(1, 'railway', '中央駅', 2000, 2000)];
  [1900, 1920, 1940, 1960, 1980]
    .forEach((x, i) => pois.push(poiFeature(10 + i, 'cafe', `喫茶${i}`, x, 2000)));
  const tiles = new Map([['10/10', makeTile({ pois })]]);
  const result = resolve(tiles, 10, 10, null, DENSE_POLICY);
  assert.equal(result.clusters.length, 0);
  assert.equal(result.facilities.filter(f => f.representation === 'hidden').length, 5);
  assert.equal(result.stats.hidden, 5);
  assert.equal(result.stats.clusterMembers, 0);
});

test('雑居ビル統合: 同じ建物のテナントは1施設へまとまり代表看板を持つ', () => {
  const tiles = new Map([['10/10', makeTile({
    pois:[
      poiFeature(1, 'hospital', '中央クリニック', 1200, 1200),
      poiFeature(2, 'cafe', '喫茶モカ', 1100, 1100),
    ],
    buildings:[buildingFeature(9, 1000, 1000, 1400, 1400, 40)],
  })]]);
  const result = resolve(tiles, 10, 10);
  assert.equal(result.facilities.length, 1);
  const facility = result.facilities[0];
  assert.equal(facility.facilityRole, 'mixed_building');
  assert.equal(facility.sourcePoiIds.length, 2);
  assert.equal(facility.spriteKey, 'hospital');     // 重要度の高いテナントが代表
  assert.equal(facility.metrics.kind, 'mixed');
  assert.match(facility.buildingId, /^r:/);   // 建物の単位は「棟＝リング」
  assert.ok(facility.metrics.height >= 28);          // heightL → L判定に効く
  assert.equal(facility.size, 'L');
});

test('タイル境界: 隣接タイルのどちらから見ても同じ勝敗・二重計上なし', () => {
  // 境界は abs x = 11*1536 = 16896px。駅は境界の6px左、店は約11px右。
  const station = poiFeature(1, 'railway', '境界駅', 4080, 2000);
  const shop = poiFeature(2, 'shop', '境界商店', 30, 2000);
  const tiles = new Map([
    ['10/10', makeTile({ pois:[station] })],
    // MVTのバッファを再現: 駅が隣接タイルにも重複して入る（local x = 4080-4096）
    ['11/10', makeTile({ pois:[poiFeature(1, 'railway', '境界駅', 4080 - EXTENT, 2000), shop] })],
  ]);
  const left = resolve(tiles, 10, 10);
  const right = resolve(tiles, 11, 10);
  // 駅は左タイルにのみ出力され、重複コピーは1件へ統合される
  assert.equal(left.facilities.length, 1);
  assert.equal(left.facilities[0].spriteKey, 'station');
  assert.equal(left.facilities[0].representation, 'icon');
  // 店は右タイルの所有で、境界の向こうの駅に負けて dot になる
  assert.equal(right.facilities.length, 1);
  assert.equal(right.facilities[0].spriteKey, 'shop');
  assert.equal(right.facilities[0].representation, 'dot');
  assert.match(right.facilities[0].selectionReason, /^collision:/);
});

test('クラスター統合: 同じ64pxバケットに4点以上たまると1クラスターになる', () => {
  const pois = [poiFeature(1, 'railway', '中央駅', 2000, 2000)];
  // 駅の衝突圏内（<81px）かつ同じクラスターバケットに5つの喫茶を置く
  const xs = [1900, 1920, 1940, 1960, 1980];
  xs.forEach((x, i) => pois.push(poiFeature(10 + i, 'cafe', `喫茶${i}`, x, 2000)));
  const tiles = new Map([['10/10', makeTile({ pois })]]);
  const result = resolve(tiles, 10, 10);
  assert.equal(result.clusters.length, 1);
  const cluster = result.clusters[0];
  assert.equal(cluster.count, 5);
  const members = result.facilities.filter(f => f.representation === 'cluster-member');
  assert.equal(members.length, 5);
  for (const member of members) assert.equal(member.clusterId, cluster.clusterId);
  assert.equal(result.facilities.filter(f => f.representation === 'icon').length, 1);
  assert.deepEqual(result.stats.clusters, 1);
});

test('レイヤー・画面状態は入力に存在しない（純粋性の担保）', () => {
  // resolveTile の引数はタイルデータとパターンのみで、同一入力なら
  // 何度呼んでも・どの順で呼んでも同じ JSON になる
  const tiles = new Map([['10/10', makeTile({
    pois:[poiFeature(1, 'museum', '郷土資料館', 3000, 3000)],
  })]]);
  const a = JSON.stringify(resolve(tiles, 10, 10));
  resolve(tiles, 11, 10);
  resolve(tiles, 9, 10);
  const b = JSON.stringify(resolve(tiles, 10, 10));
  assert.equal(b, a);
});

test('Asset Contractモードはsource pointを動かさずS/M/L実測boundsを衝突範囲に使う', () => {
  const sourceX=1234,sourceY=2345;
  const tiles = new Map([['10/10',makeTile({
    pois:[poiFeature(1,'school','原点学校',sourceX,sourceY)],
  })]]);
  const result=RESOLVER.resolveTile({
    tileX:10,tileY:10,pattern:PATTERN_07,getTile:makeGetTile(tiles),
    assetCatalog:POI_ASSETS,sourceAnchored:true,
  });
  const facility=result.facilities[0];
  const expectedX=10*RESOLVER.TILE_PX+sourceX*RESOLVER.TILE_PX/EXTENT;
  const expectedY=10*RESOLVER.TILE_PX+sourceY*RESOLVER.TILE_PX/EXTENT;
  assert.equal(facility.sourceWorldX,expectedX);
  assert.equal(facility.sourceWorldY,expectedY);
  assert.equal(facility.worldX,expectedX);
  assert.equal(facility.worldY,expectedY);
  assert.equal(facility.anchorMode,'source-point');
  assert.equal(facility.contractVersion,POI_ASSETS.contractVersion);
  assert.equal(facility.semanticRole,'structure');
  assert.equal(facility.assetSize,POI_ASSETS.contract('school',facility.size).size);
  assert.deepEqual(facility.assetAnchor,{kind:'ground-center',x:0,y:0});
  assert.deepEqual(facility.assetBounds,POI_ASSETS.measure('school',facility.size));
  assert.equal(facility.collisionBounds.left,facility.assetBounds.left*2-6);
  assert.equal(facility.collisionBounds.top,facility.assetBounds.top*2-6);
  assert.equal(facility.collisionBounds.right,facility.assetBounds.right*2+6);
  assert.equal(facility.collisionBounds.bottom,facility.assetBounds.bottom*2+6);
});

test('公開衝突判定はAsset Contractの実測矩形を使い座標を変更しない', () => {
  const pattern={...PATTERN_07,gapScale:.01,sameGapScale:.01};
  const geometry=RESOLVER.assetCollisionGeometry(POI_ASSETS,'school','L',pattern,'civic',1);
  const a={...geometry,worldX:100,worldY:100,spriteKey:'school',size:'L',visualScale:1,props:{class:'school'}};
  const b={...geometry,worldX:100+geometry.collisionBounds.right-geometry.collisionBounds.left-1,
    worldY:100,spriteKey:'school',size:'L',visualScale:1,props:{class:'school'}};
  assert.equal(RESOLVER.facilitiesCollide(a,b,pattern),true);
  assert.deepEqual([a.worldX,a.worldY,b.worldY],[100,100,100]);
});

test('WorldStyle密度予算はrole・category・総数を安定順で制限する', () => {
  const facilities = [
    {key:'school',representation:'icon',semanticRole:'structure',category:'civic',selectionPriority:4,rank:2,props:{class:'school'},worldX:10,worldY:20},
    {key:'station',representation:'icon',semanticRole:'marker',category:'transit',selectionPriority:1,rank:1,collisionProtected:true,props:{class:'railway'},worldX:30,worldY:40},
    {key:'landmark',representation:'icon',semanticRole:'structure',category:'landmark',selectionPriority:2,rank:1,landmarkEntityId:'l-1',props:{class:'museum'},worldX:50,worldY:60},
    {key:'shop',representation:'icon',semanticRole:'object',category:'commerce',selectionPriority:5,rank:3,props:{class:'shop'},worldX:70,worldY:80},
    {key:'cafe',representation:'icon',semanticRole:'marker',category:'food',selectionPriority:6,rank:4,props:{class:'cafe'},worldX:90,worldY:100},
    {key:'dot',representation:'dot',semanticRole:'marker',category:'generic',selectionPriority:0,rank:0,props:{class:'cafe'},worldX:110,worldY:120},
  ];
  const before = JSON.stringify(facilities);
  const result = RESOLVER.selectViewportIcons(facilities, {
    maxIcons:4,
    roleCaps:{structure:2,object:1,marker:1},
    categoryCaps:{transit:1,landmark:1,civic:1,commerce:1,food:1},
  });
  assert.deepEqual(result.selected.map(item => item.key), ['landmark','station','school','shop']);
  assert.deepEqual(result.rejected.map(item => item.key), ['cafe']);
  assert.deepEqual(result.roleCounts, {structure:2,object:1,marker:1});
  assert.deepEqual(result.categoryCounts, {landmark:1,transit:1,civic:1,commerce:1});
  assert.equal(JSON.stringify(facilities), before);
  assert.equal(Object.isFrozen(result.selected), true);
  assert.equal(Object.isFrozen(result.rejected), true);
});

test('WorldStyle密度予算は同category内でも選抜理由とkeyで決定的になる', () => {
  const facilities = [
    {key:'b',representation:'icon',semanticRole:'object',category:'commerce',selectionPriority:5,rank:2,props:{class:'shop'}},
    {key:'c',representation:'icon',semanticRole:'object',category:'commerce',selectionPriority:2,rank:8,props:{class:'shop'}},
    {key:'a',representation:'icon',semanticRole:'object',category:'commerce',selectionPriority:2,rank:8,props:{class:'shop'}},
  ];
  const policy = {maxIcons:10,roleCaps:{object:10},categoryCaps:{commerce:1}};
  const first = RESOLVER.selectViewportIcons(facilities, policy);
  const second = RESOLVER.selectViewportIcons([...facilities].reverse(), policy);
  assert.deepEqual(first.selected.map(item => item.key), ['a']);
  assert.deepEqual(second.selected.map(item => item.key), ['a']);
  assert.deepEqual(first.rejected.map(item => item.key), ['c','b']);
});
