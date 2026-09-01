import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window=globalThis;
await import('../assets/bridge-classifier.js');
await import('../assets/bridge-renderer.js');

const classifier=globalThis.PixelMapBridgeClassifier;
const renderer=globalThis.PixelMapBridgeRenderer;
const mask=(width,height,points)=>{
  const value=new Uint8Array(width*height);
  for(const [x,y] of points) value[y*width+x]=1;
  return value;
};

function waterBridge(width=30,height=18){
  const points=[];
  for(let x=3;x<26;x++) for(const y of [7,8,9]) points.push([x,y]);
  return classifier.classifyLayer({
    option:'majorRoads',bridgeMask:mask(width,height,points),centerMask:mask(width,height,points.filter(([,y])=>y===8)),
    outlineMask:new Uint8Array(width*height),waterMask:mask(width,height,points),
    roadMask:new Uint8Array(width*height),railMask:new Uint8Array(width*height),width,height,
  })[0];
}

test('水上道路橋は橋面の下に壁・アーチ・橋脚を生成する',()=>{
  const width=30,height=18,descriptor=waterBridge(width,height);
  const prepared=renderer.prepare({descriptors:[descriptor],width,height});
  assert.equal(prepared.version,'pixelmap-bridge-renderer/1');
  assert.ok(prepared.stats.wallCells>0);
  assert.ok(prepared.stats.archOpenings>0);
  assert.ok(prepared.stats.pierCells>0);
  assert.ok(prepared.overlay.length>0);
  assert.ok(prepared.underlay.every(item=>item.index>=0&&item.index<width*height));
  const archRows=new Set(prepared.underlay.filter(item=>item.kind==='arch-opening')
    .map(item=>Math.floor(item.index/width)));
  assert.ok(archRows.size>=2,'アーチ開口は1本線ではなく複数rowに広がる');
});

test('同じdescriptorから常に同じ描画命令を作る',()=>{
  const width=30,height=18,descriptor=waterBridge(width,height);
  assert.deepEqual(
    renderer.prepare({descriptors:[descriptor],width,height}),
    renderer.prepare({descriptors:[descriptor],width,height}),
  );
});

test('paintは描画命令をグリッド座標へ戻す',()=>{
  const width=30,height=18,prepared=renderer.prepare({descriptors:[waterBridge(width,height)],width,height});
  const painted=[];
  renderer.paint(prepared.underlay.slice(0,3),width,(x,y,color,operation)=>painted.push({x,y,color,kind:operation.kind}));
  assert.equal(painted.length,3);
  assert.ok(painted.every(item=>Number.isInteger(item.x)&&Number.isInteger(item.y)&&item.color.startsWith('#')));
});
