import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANGLES,
  GEOMETRY,
  PALETTE,
  renderBridge,
} from '../tools/bridge-direction-core.mjs';

function colors(image){
  const result=new Set();
  for(let index=0;index<image.data.length;index+=4){
    if(image.data[index+3]===0) continue;
    result.add(`#${[image.data[index],image.data[index+1],image.data[index+2]]
      .map(value=>value.toString(16).padStart(2,'0')).join('')}`);
  }
  return result;
}

test('全方向が96px透過・固定パレット・整数alphaだけを使う',()=>{
  const allowed=new Set(Object.values(PALETTE));
  for(const angle of ANGLES){
    const image=renderBridge(angle);
    assert.deepEqual({width:image.width,height:image.height},GEOMETRY.canvas);
    for(let index=0;index<image.data.length;index+=4){
      const alpha=image.data[index+3];
      assert.ok(alpha===0||alpha===255,`${angle}度に半透明alpha ${alpha}`);
    }
    for(const color of colors(image)) assert.ok(allowed.has(color),`${angle}度に未定義色 ${color}`);
    assert.ok(colors(image).has(PALETTE.road));
    assert.ok(colors(image).has(PALETTE.outline));
    assert.ok(image.meta.bounds.x>=0&&image.meta.bounds.y>=0);
    assert.ok(image.meta.bounds.x+image.meta.bounds.width<=GEOMETRY.canvas.width);
    assert.ok(image.meta.bounds.y+image.meta.bounds.height<=GEOMETRY.canvas.height);
  }
});

test('高さと深さは全方向で画面垂直に固定する',()=>{
  for(const angle of [0,45,90,135]){
    const {meta}=renderBridge(angle);
    assert.deepEqual(meta.extrusion.parapet,{x:0,y:-GEOMETRY.parapetHeight});
    assert.deepEqual(meta.extrusion.wall,{x:0,y:GEOMETRY.wallDepth});
    assert.deepEqual(meta.anchor,GEOMETRY.anchor);
  }
});

test('長辺アーチは可視面だけに現れ90度では人工的に正面化しない',()=>{
  assert.ok(renderBridge(0).meta.stats.archPixels>20);
  assert.ok(renderBridge(45).meta.stats.archPixels>10);
  assert.equal(renderBridge(90).meta.stats.archPixels,0);
  assert.ok(renderBridge(105).meta.stats.archPixels>0);
});

test('0度と180度は同じ対称モデルになり再描画も決定的である',()=>{
  const zero=renderBridge(0);
  const halfTurn=renderBridge(180);
  const repeated=renderBridge(0);
  assert.deepEqual(halfTurn.data,zero.data);
  assert.deepEqual(repeated.data,zero.data);
  assert.deepEqual(repeated.meta,zero.meta);
});

test('全方向が同じ接地点を持ち不透明画素が存在する',()=>{
  for(const angle of ANGLES){
    const image=renderBridge(angle);
    assert.deepEqual(image.meta.anchor,{x:48,y:40});
    assert.ok(image.meta.stats.opaquePixels>500,`${angle}度の橋が小さすぎます`);
    assert.ok(image.meta.visibleEdges.length>=1);
  }
});
