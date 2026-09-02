import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../assets/bridge-component-core.js');

const standard={screenAngle:45,length:52,masonryWidth:22,roadWidth:14,patternSeed:'standard'};

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
    assert.deepEqual(value.stats.extrusion,{parapet:{x:0,y:-4},wall:{x:0,y:9}});
  }
});

test('標準橋はunderlay・surfaceMask・surface・overlayを部品ID付きで返す',()=>{
  const composition=core.composeStrict(standard);
  assert.ok(composition.underlay.length>100);
  assert.ok(composition.surfaceMask.length>100);
  assert.ok(composition.surface.length>100);
  assert.ok(composition.overlay.length>100);
  assert.equal(composition.diagnostics.fallback,false);
  for(const operation of allOperations(composition)){
    assert.equal(Number.isInteger(operation.x),true);
    assert.equal(Number.isInteger(operation.y),true);
    assert.equal(Object.values(core.palette).includes(operation.color),true,operation.color);
    assert.equal(typeof operation.kind,'string');
    assert.equal(typeof operation.componentId,'string');
    assert.ok(['underlay','surface','overlay'].includes(operation.layer));
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
      assert.equal(isEightConnected(operations),true,`${angle}:${preset.id} が分断`);
    }
  }
});

test('可視長辺だけにアーチが現れ90度で人工的に正面化しない',()=>{
  assert.ok(core.composeStrict({...standard,screenAngle:0}).stats.archPixels>20);
  assert.ok(core.composeStrict({...standard,screenAngle:45}).stats.archPixels>10);
  assert.equal(core.composeStrict({...standard,screenAngle:90}).stats.archPixels,0);
  assert.ok(core.composeStrict({...standard,screenAngle:135}).stats.archPixels>10);
});

test('参照橋の石積み・迫石・要石・橋脚・笠石・舗装細部を持つ',()=>{
  for(const angle of [0,5,45,135,175]){
    const details=core.composeStrict({...standard,screenAngle:angle}).stats.details;
    assert.ok(details.masonryJointPixels>=6,`${angle}: masonry`);
    assert.ok(details.voussoirPixels>=8,`${angle}: voussoir`);
    assert.ok(details.keystonePixels>=1,`${angle}: keystone`);
    assert.ok(details.pierDetailPixels>=2,`${angle}: pier`);
    assert.ok(details.capstoneJointPixels>=6,`${angle}: capstone`);
    assert.ok(details.roadPavingPixels>=12,`${angle}: road`);
  }
});

test('0度と180度は同じ画素列になり模様seedだけが細部を変える',()=>{
  const zero=core.composeStrict({...standard,screenAngle:0});
  const half=core.composeStrict({...standard,screenAngle:180});
  assert.deepEqual(half,zero);
  const other=core.composeStrict({...standard,screenAngle:0,patternSeed:'other'});
  assert.notDeepEqual(other.overlay,zero.overlay);
  assert.deepEqual(other.surfaceMask,zero.surfaceMask);
});
