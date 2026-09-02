import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../assets/bridge-component-core.js');
const standard={screenAngle:45,length:52,masonryWidth:22,roadWidth:14,patternSeed:'cache'};

test('rendererは同じ形状を再利用し画面上のidをcache keyに含めない',()=>{
  const renderer=core.createRenderer({cacheLimit:4});
  const first=renderer.composeStrict({...standard,id:'a'});
  const second=renderer.composeStrict({...standard,id:'b'});
  assert.strictEqual(first.underlay,second.underlay);
  assert.strictEqual(first.surface,second.surface);
  assert.strictEqual(first.overlay,second.overlay);
  assert.equal(first.model.id,'a');
  assert.equal(second.model.id,'b');
  assert.deepEqual(renderer.stats(),{limit:4,size:1,hits:1,misses:1,evictions:0});
});

test('LRUは再参照を最新にし上限超過時に最古だけを破棄する',()=>{
  const renderer=core.createRenderer({cacheLimit:2});
  const a={...standard,screenAngle:0};
  const b={...standard,screenAngle:5};
  const c={...standard,screenAngle:10};
  renderer.composeStrict(a);
  renderer.composeStrict(b);
  renderer.composeStrict(a);
  renderer.composeStrict(c);
  assert.deepEqual(renderer.stats(),{limit:2,size:2,hits:1,misses:3,evictions:1});
  renderer.composeStrict(b);
  assert.deepEqual(renderer.stats(),{limit:2,size:2,hits:1,misses:4,evictions:2});
});

test('cacheの有無で描画結果を変えずinstance間で状態を共有しない',()=>{
  const one=core.createRenderer({cacheLimit:1});
  const two=core.createRenderer({cacheLimit:3});
  assert.deepEqual(one.composeStrict(standard),core.composeStrict(standard));
  assert.deepEqual(two.composeStrict(standard),core.composeStrict(standard));
  assert.deepEqual(one.stats(),{limit:1,size:1,hits:0,misses:1,evictions:0});
  assert.deepEqual(two.stats(),{limit:3,size:1,hits:0,misses:1,evictions:0});
});

test('安全APIは不正入力を平坦橋へfallbackし理由を公開する',()=>{
  const renderer=core.createRenderer();
  const fallback=renderer.composeSafe({screenAngle:Infinity,length:8,masonryWidth:5,roadWidth:9,styleKey:'unknown'});
  assert.equal(fallback.diagnostics.fallback,true);
  assert.ok(fallback.diagnostics.issues.length>=3);
  assert.equal(fallback.stats.archPixels,0);
  assert.ok(fallback.surfaceMask.length>0);
  assert.ok(fallback.surface.length>0);
  assert.ok(fallback.overlay.some(operation=>operation.kind==='outer-outline'));
});

test('配置関数は平行移動し指定viewport外だけを安全に切り捨てる',()=>{
  const composition=core.composeStrict({...standard,screenAngle:0});
  const placed=core.placeComposition(composition,20,30,{x:0,y:0,width:40,height:40});
  const all=[...placed.underlay,...placed.surface,...placed.overlay];
  assert.ok(all.length>0);
  assert.ok(all.every(operation=>operation.x>=0&&operation.y>=0&&operation.x<40&&operation.y<40));
  assert.deepEqual(placed.anchor,{x:20,y:30});
  assert.ok(placed.diagnostics.clippedPixels>0);
});

