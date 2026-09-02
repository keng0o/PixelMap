import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../assets/bridge-component-core.js');

const standard={screenAngle:45,length:52,masonryWidth:22,roadWidth:14,patternSeed:'standard'};
const canonical={
  screenAngle:45,length:48,masonryWidth:28,roadWidth:18,spanCount:2,
  detailLevel:'medium',patternSeed:'canonical-map-depth',
};

function allOperations(composition){
  return [...composition.underlay,...composition.surface,...composition.overlay];
}

function isEightConnected(points){
  const keys=new Set(points.map(({x,y})=>`${x},${y}`));
  if(!keys.size) return false;
  const pending=[keys.values().next().value];
  const seen=new Set(pending);
  while(pending.length){
    const [x,y]=pending.pop().split(',').map(Number);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy) continue;
      const key=`${x+dx},${y+dy}`;
      if(keys.has(key)&&!seen.has(key)){seen.add(key);pending.push(key);}
    }
  }
  return seen.size===keys.size;
}

test('投影は地面だけを回し高さと壁深さを画面垂直へ固定する',()=>{
  const model=core.createModel(standard);
  assert.deepEqual(core.projectLocal(model,10,5),{x:4,y:11});
  assert.deepEqual(core.projectLocal(model,10,5,4),{x:4,y:7});
  assert.deepEqual(core.projectLocal(model,10,5,-9),{x:4,y:20});
  for(const angle of core.angles){
    const value=core.composeStrict({...standard,screenAngle:angle});
    assert.deepEqual(value.stats.extrusion,{parapet:{x:0,y:-5},wall:{x:0,y:12}});
  }
});

test('標準橋は透明開口・予約構造を含むV2描画命令を返す',()=>{
  const composition=core.composeStrict(standard);
  assert.ok(composition.underlay.length>100);
  assert.ok(composition.surfaceMask.length>100);
  assert.ok(composition.surface.length>100);
  assert.ok(composition.overlay.length>100);
  assert.ok(composition.openingMask.length>20);
  assert.ok(composition.reservedStructureMask.length>20);
  assert.equal(composition.stats.lod,'medium');
  assert.equal(composition.diagnostics.fallback,false);
  for(const operation of allOperations(composition)){
    assert.equal(Number.isInteger(operation.x),true);
    assert.equal(Number.isInteger(operation.y),true);
    assert.equal(Object.values(core.palette).includes(operation.color),true,operation.color);
    assert.equal(typeof operation.kind,'string');
    assert.equal(typeof operation.componentId,'string');
    assert.ok(['underlay','surface','overlay'].includes(operation.layer));
    assert.equal(operation.lod,'medium');
  }
});

test('45度基準橋は厚い2連アーチと実際に横へ張り出す支持構造を持つ',()=>{
  const composition=core.composeStrict(canonical);
  assert.equal(composition.model.spans.length,2);
  assert.ok(composition.stats.openingPixels>80);
  assert.ok(composition.stats.details.voussoirPixels>composition.stats.innerShadowPixels);
  assert.ok(composition.stats.pierProjectionPixels>0);
  assert.ok(composition.stats.abutmentProjectionPixels>0);
  assert.ok(composition.stats.details.capstoneJointPixels>0);
  assert.ok(composition.stats.details.roadPavingPixels>0);
  const kinds=new Set(allOperations(composition).map(operation=>operation.kind));
  for(const kind of [
    'pier-top','projecting-pier-front','pier-side','abutment-top','abutment-front',
    'arch-ring-outer','arch-ring-inner','terminal-post','capstone-joint',
  ]) assert.equal(kinds.has(kind),true,kind);
});

test('アーチ開口は全描画layerから除外され背景を透過する',()=>{
  for(const angle of [0,30,45,60,135]){
    const composition=core.composeStrict({...standard,screenAngle:angle});
    const openings=new Set(composition.openingMask.map(({x,y})=>`${x},${y}`));
    assert.ok(openings.size>10,`${angle}: opening`);
    for(const operation of allOperations(composition))
      assert.equal(openings.has(`${operation.x},${operation.y}`),false,`${angle}:${operation.kind}`);
    assert.ok(composition.stats.innerShadowPixels>0,`${angle}: inner shadow`);
    assert.ok(composition.stats.pierPixels>0,`${angle}: pier`);
    assert.ok(composition.stats.capstonePixels>0,`${angle}: capstone`);
  }
});

test('全36方向と9サイズがbounds内の決定的な連続構造を作る',()=>{
  for(const angle of core.angles){
    for(const preset of core.presets){
      const input={...preset,screenAngle:angle,patternSeed:'matrix'};
      const first=core.composeStrict(input);
      const second=core.composeStrict(input);
      assert.deepEqual(first,second,`${angle}:${preset.id}`);
      assert.ok(first.bounds.width>0&&first.bounds.height>0);
      const operations=allOperations(first);
      assert.ok(operations.every(({x,y})=>x>=first.bounds.x&&y>=first.bounds.y&&
        x<first.bounds.x+first.bounds.width&&y<first.bounds.y+first.bounds.height));
      assert.equal(isEightConnected(operations.filter(operation=>operation.kind!=='shadow')),true,
        `${angle}:${preset.id} が分断`);
    }
  }
});

test('可視長辺だけにアーチが現れ90度で人工的に正面化しない',()=>{
  assert.ok(core.composeStrict({...standard,screenAngle:0}).stats.archPixels>20);
  assert.ok(core.composeStrict({...standard,screenAngle:45}).stats.archPixels>10);
  assert.equal(core.composeStrict({...standard,screenAngle:90}).stats.archPixels,0);
  assert.ok(core.composeStrict({...standard,screenAngle:135}).stats.archPixels>10);
});

test('近垂直の85度と95度は1pxの長辺sliverを端面へ統合する',()=>{
  const archPixels=angle=>core.composeStrict({...standard,screenAngle:angle}).stats.archPixels;
  assert.ok(archPixels(80)>0);
  assert.equal(archPixels(85),0);
  assert.equal(archPixels(95),0);
  assert.ok(archPixels(100)>0);
});

test('意味的LODは同じ構造を保ちながら細部を段階追加する',()=>{
  const small=core.composeStrict({...standard,detailLevel:'small'});
  const medium=core.composeStrict({...standard,detailLevel:'medium'});
  const large=core.composeStrict({...standard,detailLevel:'large'});
  assert.equal(small.stats.lod,'small');
  assert.equal(medium.stats.lod,'medium');
  assert.equal(large.stats.lod,'large');
  assert.equal(small.stats.details.masonryJointPixels,0);
  assert.equal(small.stats.details.roadPavingPixels,0);
  assert.ok(medium.stats.details.voussoirPixels>0);
  assert.ok(medium.stats.details.keystonePixels>0);
  assert.ok(large.stats.details.masonryJointPixels>medium.stats.details.masonryJointPixels);
  assert.ok(large.stats.details.roadPavingPixels>0);
  assert.deepEqual(small.model.spans,medium.model.spans);
  assert.deepEqual(medium.model.spans,large.model.spans);
  assert.ok(small.stats.exaggerationPixels>0);
  assert.ok(small.stats.maxExaggeration<=2);
});

test('0度と180度は同じ画素列になり模様seedだけが細部を変える',()=>{
  const zero=core.composeStrict({...standard,screenAngle:0,detailLevel:'large'});
  const half=core.composeStrict({...standard,screenAngle:180,detailLevel:'large'});
  assert.deepEqual(half,zero);
  const other=core.composeStrict({...standard,screenAngle:0,detailLevel:'large',patternSeed:'other'});
  assert.notDeepEqual(allOperations(other),allOperations(zero));
  assert.deepEqual(other.surfaceMask,zero.surfaceMask);
  assert.deepEqual(other.openingMask,zero.openingMask);
});
