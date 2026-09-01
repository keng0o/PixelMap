import test from 'node:test';
import assert from 'node:assert/strict';

import {decodePng,encodePng} from '../tools/rgba-png.mjs';
import {createSurface,putPixel} from '../tools/pixel-raster.mjs';

test('RGBAをfilter 0 PNGへ変換して同じ画素を読み戻す',()=>{
  const surface=createSurface(2,2);
  putPixel(surface,0,0,'#2b292e');
  putPixel(surface,1,0,'#7a7478');
  putPixel(surface,0,1,'#d8d0c0');
  const png=encodePng(surface);
  assert.deepEqual(Array.from(png.subarray(0,8)),[137,80,78,71,13,10,26,10]);
  const decoded=decodePng(png);
  assert.equal(decoded.width,2);
  assert.equal(decoded.height,2);
  assert.deepEqual(decoded.data,surface.data);
});

test('同じRGBA入力は同一のPNGバイト列になる',()=>{
  const surface=createSurface(5,4);
  putPixel(surface,2,2,'#aaa397');
  assert.deepEqual(encodePng(surface),encodePng(surface));
});

test('PNG入出力は不正寸法・RGBA長・CRC破損を拒否する',()=>{
  assert.throws(()=>encodePng({width:0,height:2,data:new Uint8Array()}),/正の整数/);
  assert.throws(()=>encodePng({width:2,height:2,data:new Uint8Array(4)}),/RGBA長/);
  const png=encodePng(createSurface(2,2));
  const broken=Buffer.from(png);
  broken[20]^=0xff;
  assert.throws(()=>decodePng(broken),/CRC/);
});
