import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../assets/bridge-component-core.js');

test('共有APIは5度36方向・石造橋style・9サイズを公開する',()=>{
  assert.equal(core.version,'pixelmap-bridge-components/1');
  assert.deepEqual(core.angles,Array.from({length:36},(_,index)=>index*5));
  assert.deepEqual(Object.keys(core.styles),['stoneArchReference']);
  assert.equal(core.presets.length,9);
  assert.ok(Object.isFrozen(core));
  assert.ok(Object.isFrozen(core.styles.stoneArchReference));
});

test('角度を180度で正規化し時計回り側優先で5度へ量子化する',()=>{
  assert.equal(core.normalizeAngle(180),0);
  assert.equal(core.normalizeAngle(-5),175);
  assert.equal(core.normalizeAngle(545),5);
  assert.equal(core.quantizeAngle(2.49),0);
  assert.equal(core.quantizeAngle(2.5),5);
  assert.equal(core.quantizeAngle(177.49),175);
  assert.equal(core.quantizeAngle(177.5),0);
});

test('9サイズpresetは寸法契約を満たし短中長で1・2・3連になる',()=>{
  const counts=new Map();
  for(const preset of core.presets){
    const model=core.createModel({...preset,screenAngle:45,patternSeed:'preset'});
    assert.equal(model.masonryWidth>=model.roadWidth+model.style.parapetThickness*2,true);
    assert.equal(model.widthLayout.leftShoulder,model.widthLayout.rightShoulder);
    assert.equal(model.spans.reduce((sum,span)=>sum+span.width,0)+
      model.piers.reduce((sum,pier)=>sum+pier.width,0),model.usableLength);
    counts.set(model.length,model.spans.length);
  }
  assert.deepEqual(Object.fromEntries(counts),{'36':1,'52':2,'76':3});
});

test('径間と橋脚を橋中心に対して左右対称へ配置する',()=>{
  for(const length of [36,52,76,61,87]){
    const model=core.createModel({screenAngle:0,length,masonryWidth:22,roadWidth:14,patternSeed:1});
    const spans=model.spans;
    for(let index=0;index<spans.length;index++){
      const opposite=spans[spans.length-1-index];
      assert.equal(spans[index].width,opposite.width);
      assert.equal(spans[index].uMin,-opposite.uMax);
      assert.equal(spans[index].uMax,-opposite.uMin);
    }
    const piers=model.piers;
    for(let index=0;index<piers.length;index++){
      const opposite=piers[piers.length-1-index];
      assert.equal(piers[index].width,opposite.width);
      assert.equal(piers[index].uMin,-opposite.uMax);
      assert.equal(piers[index].uMax,-opposite.uMin);
    }
  }
});

test('局所部品は地図・Canvas・画面位置を持たず同じ入力で決定的である',()=>{
  const input={id:'bridge-a',screenAngle:47,length:52,masonryWidth:22,roadWidth:14,patternSeed:'a'};
  const first=core.createModel(input);
  const second=core.createModel(input);
  assert.deepEqual(first,second);
  assert.equal(first.screenAngle,45);
  assert.deepEqual(first.anchor,{x:0,y:0});
  assert.ok(first.components.some(component=>component.kind==='deck'));
  assert.ok(first.components.some(component=>component.kind==='road'));
  assert.ok(first.components.some(component=>component.kind==='parapet'));
  assert.equal('canvas' in first,false);
  assert.equal('latitude' in first,false);
  assert.equal('longitude' in first,false);
});

test('寸法・角度・styleの不正入力を構造化エラーで拒否する',()=>{
  for(const [overrides,code] of [
    [{screenAngle:Infinity},'angle'],
    [{length:21},'length'],
    [{masonryWidth:12,roadWidth:8},'width'],
    [{roadWidth:0},'roadWidth'],
    [{styleKey:'unknown'},'styleKey'],
    [{length:52.5},'integer'],
  ]){
    assert.throws(()=>core.createModel({
      screenAngle:0,length:52,masonryWidth:22,roadWidth:14,...overrides,
    }),error=>error?.name==='BridgeValidationError'&&error.issues.some(issue=>issue.code===code));
  }
});

