import test from 'node:test';
import assert from 'node:assert/strict';

import {
  blit,
  createSurface,
  drawSupercoverLine,
  fillPolygon,
  fillRect,
  hexToRgba,
  putPixel,
  scaleNearest,
} from '../tools/pixel-raster.mjs';

const pixel=(surface,x,y)=>Array.from(surface.data.slice((y*surface.width+x)*4,(y*surface.width+x)*4+4));

test('RGBA surfaceは透明で開始し範囲外描画を拒否する',()=>{
  const surface=createSurface(4,3);
  assert.equal(surface.data.length,48);
  assert.ok(surface.data.every(value=>value===0));
  putPixel(surface,1,1,'#d8d0c0');
  assert.deepEqual(pixel(surface,1,1),[216,208,192,255]);
  assert.throws(()=>putPixel(surface,-1,0,'#000000'),/範囲外/);
  assert.throws(()=>createSurface(1.5,2),/正の整数/);
});

test('矩形と整数ポリゴンをアンチエイリアスなしで塗る',()=>{
  const surface=createSurface(8,8);
  fillRect(surface,1,1,3,2,'#7a7478');
  assert.deepEqual(pixel(surface,3,2),[122,116,120,255]);
  assert.deepEqual(pixel(surface,4,2),[0,0,0,0]);
  fillPolygon(surface,[{x:2,y:3},{x:6,y:3},{x:5,y:6},{x:2,y:6}],'#aaa397');
  assert.deepEqual(pixel(surface,3,4),[170,163,151,255]);
  assert.ok(Array.from(surface.data).every((value,index)=>index%4===3 ? value===0||value===255 : true));
});

test('supercover線は端点を含み8近傍で途切れない',()=>{
  const surface=createSurface(10,8);
  const points=drawSupercoverLine(surface,{x:1,y:1},{x:8,y:4},'#2b292e');
  assert.deepEqual(points[0],{x:1,y:1});
  assert.deepEqual(points.at(-1),{x:8,y:4});
  for(let index=1;index<points.length;index++){
    assert.ok(Math.abs(points[index].x-points[index-1].x)<=1);
    assert.ok(Math.abs(points[index].y-points[index-1].y)<=1);
  }
  for(const {x,y} of points) assert.deepEqual(pixel(surface,x,y),[43,41,46,255]);
});

test('最近傍拡大とblitは元のRGBA値だけを保つ',()=>{
  const source=createSurface(2,2);
  putPixel(source,0,0,'#2b292e');
  putPixel(source,1,1,'#d8d0c0');
  const scaled=scaleNearest(source,3);
  assert.deepEqual({width:scaled.width,height:scaled.height},{width:6,height:6});
  assert.deepEqual(pixel(scaled,2,2),[43,41,46,255]);
  assert.deepEqual(pixel(scaled,4,4),[216,208,192,255]);
  const target=createSurface(8,8);
  blit(target,scaled,1,1);
  assert.deepEqual(pixel(target,5,5),[216,208,192,255]);
});

test('色変換とラスタ結果は決定的である',()=>{
  assert.deepEqual(hexToRgba('#303b46'),[48,59,70,255]);
  const render=()=>{
    const surface=createSurface(12,12);
    fillPolygon(surface,[{x:2,y:1},{x:10,y:6},{x:5,y:10}],'#6b6459');
    drawSupercoverLine(surface,{x:2,y:1},{x:5,y:10},'#2b292e');
    return surface.data;
  };
  assert.deepEqual(render(),render());
});
