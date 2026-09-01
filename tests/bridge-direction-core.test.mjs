import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANGLES,
  GEOMETRY,
  bridgeModel,
  normalizeAngle,
  projectLocal,
  quantizeAngle,
  validateBridgeContract,
} from '../tools/bridge-direction-core.mjs';

test('方向集合と共通寸法を設計値へ固定する',()=>{
  assert.deepEqual(ANGLES,[0,15,30,45,60,75,90,105,120,135,150,165]);
  assert.deepEqual(GEOMETRY,{
    canvas:{width:96,height:96},
    anchor:{x:48,y:40},
    length:52,
    masonryWidth:22,
    roadWidth:14,
    parapetThickness:3,
    parapetHeight:4,
    wallDepth:9,
    archCount:2,
    archWidth:14,
    archHeight:7,
    abutmentLength:6,
  });
  assert.doesNotThrow(()=>validateBridgeContract({angles:ANGLES,geometry:GEOMETRY}));
});

test('局所座標は時計回りに回転し接地点を変えない',()=>{
  assert.deepEqual(projectLocal(0,10,5),{x:58,y:45});
  assert.deepEqual(projectLocal(45,10,5),{x:52,y:51});
  assert.deepEqual(projectLocal(90,10,5),{x:43,y:50});
  for(const angle of ANGLES) assert.deepEqual(projectLocal(angle,0,0),GEOMETRY.anchor);
});

test('角度を180度で正規化し15度へ時計回り側優先で量子化する',()=>{
  assert.equal(normalizeAngle(180),0);
  assert.equal(normalizeAngle(-15),165);
  assert.equal(normalizeAngle(555),15);
  assert.equal(quantizeAngle(7.49),0);
  assert.equal(quantizeAngle(7.5),15);
  assert.equal(quantizeAngle(172.49),165);
  assert.equal(quantizeAngle(172.5),0);
});

test('全方向が同一の局所部品定義を共有する',()=>{
  const reference=bridgeModel(0);
  assert.deepEqual(reference.local.archCenters,[-10,10]);
  assert.equal(reference.local.deck.length,4);
  assert.equal(reference.local.road.length,4);
  assert.equal(reference.local.parapets.length,2);
  assert.equal(reference.local.edges.length,4);
  for(const angle of ANGLES){
    const model=bridgeModel(angle);
    assert.equal(model.angle,angle);
    assert.strictEqual(model.geometry,GEOMETRY);
    assert.strictEqual(model.local,reference.local);
    assert.deepEqual(model.anchor,GEOMETRY.anchor);
  }
});

test('契約検証は重複角度・未知角度・非整数寸法・範囲外接地点を拒否する',()=>{
  assert.throws(()=>validateBridgeContract({angles:[0,0],geometry:GEOMETRY}),/重複/);
  assert.throws(()=>validateBridgeContract({angles:[0,17],geometry:GEOMETRY}),/15度刻み/);
  assert.throws(()=>validateBridgeContract({
    angles:ANGLES,
    geometry:{...GEOMETRY,length:52.5},
  }),/整数/);
  assert.throws(()=>validateBridgeContract({
    angles:ANGLES,
    geometry:{...GEOMETRY,anchor:{x:120,y:40}},
  }),/接地点/);
});
