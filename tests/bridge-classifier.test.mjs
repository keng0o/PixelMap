import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window=globalThis;
await import('../assets/bridge-classifier.js');

const classifier=globalThis.PixelMapBridgeClassifier;
const mask=(width,height,points)=>{
  const value=new Uint8Array(width*height);
  for(const [x,y] of points) value[y*width+x]=1;
  return value;
};
const horizontal=(from,to,y)=>Array.from({length:to-from+1},(_,index)=>[from+index,y]);

test('水域と重なる道路橋を明示用途・推定交差・長さLODへ分ける',()=>{
  const width=24,height=12,points=horizontal(2,19,5);
  const [bridge]=classifier.classifyLayer({
    option:'majorRoads',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points),
    outlineMask:mask(width,height,horizontal(1,20,5)),
    waterMask:mask(width,height,horizontal(7,13,5)),
    roadMask:new Uint8Array(width*height),railMask:new Uint8Array(width*height),width,height,
  });
  assert.equal(bridge.carry,'road');
  assert.equal(bridge.crossing,'water');
  assert.equal(bridge.scale,'medium');
  assert.equal(bridge.styleKey,'largeRoadWater');
  assert.equal(bridge.confidence.crossing,'inferred');
  assert.ok(bridge.outlineCells>0);
  assert.deepEqual(bridge.evidence,[
    'bridge-option:majorRoads','outline-mask-overlap','water-mask-overlap',
  ]);
});

test('接続道路の橋端だけの重なりを道路交差へ誤分類しない',()=>{
  const width=20,height=10,points=horizontal(2,15,4);
  const [bridge]=classifier.classifyLayer({
    option:'localRoads',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points),
    outlineMask:new Uint8Array(width*height),waterMask:new Uint8Array(width*height),
    roadMask:mask(width,height,[[2,4]]),railMask:new Uint8Array(width*height),width,height,
  });
  assert.equal(bridge.crossing,'unknown');
  assert.equal(bridge.styleKey,'genericBridge');
});

test('内部の道路・鉄道重なりはmixed、鉄道橋はrailBridgeになる',()=>{
  const width=18,height=12,points=horizontal(2,15,6);
  const [roadBridge]=classifier.classifyLayer({
    option:'regionalRoads',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points),
    outlineMask:new Uint8Array(width*height),waterMask:new Uint8Array(width*height),
    roadMask:mask(width,height,[[7,6]]),railMask:mask(width,height,[[10,6]]),width,height,
  });
  assert.equal(roadBridge.crossing,'mixed');
  assert.equal(roadBridge.styleKey,'roadOverpass');

  const [railBridge]=classifier.classifyLayer({
    option:'rail',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points),
    outlineMask:new Uint8Array(width*height),waterMask:mask(width,height,[[8,6]]),
    roadMask:new Uint8Array(width*height),railMask:new Uint8Array(width*height),width,height,
  });
  assert.equal(railBridge.carry,'rail');
  assert.equal(railBridge.styleKey,'railBridge');
});

test('水域と道路が同時に重なるspanは水上橋を一次分類にする',()=>{
  const width=16,height=8,points=horizontal(1,14,4);
  const [bridge]=classifier.classifyLayer({
    option:'regionalRoads',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points),
    outlineMask:new Uint8Array(width*height),waterMask:mask(width,height,horizontal(4,10,4)),
    roadMask:mask(width,height,[[7,4]]),railMask:new Uint8Array(width*height),width,height,
  });
  assert.equal(bridge.crossing,'water');
  assert.equal(bridge.styleKey,'largeRoadWater');
  assert.ok(bridge.overlapCounts.road>0);
});

test('outlineだけのpolygon layerは運搬路コンポーネントに数えない',()=>{
  const width=10,height=10,size=width*height;
  const grids=new Map([
    ['bridge:transportationOther',mask(width,height,[[4,4],[5,4],[4,5],[5,5]])],
    ['bridge:paths',mask(width,height,[[2,5],[3,5],[4,5],[5,5],[6,5]])],
    ['waterAreas',mask(width,height,[[4,5]])],
  ]);
  const centers=new Map([
    ['bridge:paths',mask(width,height,[[2,5],[3,5],[4,5],[5,5],[6,5]])],
  ]);
  const analysis=classifier.analyzeLayers({
    grids,transportCenters:centers,bridgeOptions:['paths','transportationOther'],
    waterOptions:['waterAreas'],roadOptions:[],railOptions:[],width,height,
  });
  assert.equal(analysis.counts.total,1);
  assert.equal(analysis.descriptors[0].styleKey,'footBridge');
  assert.equal(analysis.counts.outlineMatched,1);
});

test('mask寸法の不一致を拒否する',()=>{
  assert.throws(()=>classifier.componentsForMask(new Uint8Array(3),2,2),/must match/);
  assert.throws(()=>classifier.unionMasks([new Uint8Array(3)],4),/share one size/);
});

test('現在のtileに存在しないcontext optionを安全に無視する',()=>{
  const width=6,height=4,points=horizontal(1,4,1);
  const grids=new Map([
    ['bridge:localRoads',mask(width,height,points)],
    ['localRoads',mask(width,height,points)],
  ]);
  const centers=new Map([
    ['bridge:localRoads',mask(width,height,points)],
  ]);
  const analysis=classifier.analyzeLayers({
    grids,transportCenters:centers,bridgeOptions:['localRoads'],
    waterOptions:['waterAreas','rivers'],roadOptions:['localRoads','majorRoads'],
    railOptions:['rail'],width,height,
  });
  assert.equal(analysis.counts.total,1);
  assert.equal(analysis.descriptors[0].crossing,'unknown');
});

test('橋自身の道路maskは交差扱いせず別classの道路だけを検出する',()=>{
  const width=8,height=6,bridgePoints=horizontal(1,6,2);
  const grids=new Map([
    ['bridge:localRoads',mask(width,height,bridgePoints)],
    ['localRoads',mask(width,height,bridgePoints)],
    ['majorRoads',mask(width,height,[[3,1],[3,2],[3,3]])],
  ]);
  const centers=new Map([
    ['bridge:localRoads',mask(width,height,bridgePoints)],
  ]);
  const analysis=classifier.analyzeLayers({
    grids,transportCenters:centers,bridgeOptions:['localRoads'],waterOptions:[],
    roadOptions:['localRoads','majorRoads'],railOptions:[],width,height,
  });
  assert.equal(analysis.descriptors[0].crossing,'road');
  assert.equal(analysis.descriptors[0].styleKey,'roadOverpass');
});
