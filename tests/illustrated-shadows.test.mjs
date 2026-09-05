import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
globalThis.polygonClipping = require('../assets/vendor/polygon-clipping-0.15.7.js');
await import('../assets/illustrated-landscape-geometry.js');
await import('../assets/illustrated-landscape-shadows.js');
await import('../assets/illustrated-landscape-renderer.js');
const G = globalThis.PixelMapIllustratedGeometry, S = globalThis.PixelMapIllustratedShadows;
const crown = globalThis.PixelMapIllustratedRenderer.crownPoints;
const rect = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const building = (id, x, y, w, h, height, holes = []) => ({id, layer:'building', type:3,
  props:{class:'residential', 'roof:shape':'flat', height}, geometry:[rect(x,y,w,h), ...holes]});
const view = {centerX:70,centerY:70,width:140,height:140,scale:1,metersPerWorld:1};
const east = {direction:[1,0],altitude:Math.PI/4};
const scene = (features, viewport = view) => G.compose(G.mergeFeatures(features), viewport);
const field = (features, light = east, viewport = view) => S.build(scene(features,viewport),crown,light);
const at = (f,x,y) => S.sample(f,x,y);

test('height and solar altitude set the measured cast length; reversing light reverses the shadow', () => {
  const low = field([building(1,20,40,20,20,10)]);
  const tall = field([building(1,20,40,20,20,20)]);
  assert.equal(at(low,47,50).shadow,true);
  assert.equal(at(low,53,50).shadow,false);
  assert.equal(at(tall,53,50).shadow,true);
  assert.equal(at(tall,63,50).shadow,false);
  assert.equal(at(tall,16,50).shadow,false);
  const overhead = field([building(1,20,40,20,20,20)],{...east,altitude:Math.atan(2)});
  assert.equal(at(overhead,53,50).shadow,false);
  const west = field([building(1,20,40,20,20,10)],{...east,direction:[-1,0]});
  assert.equal(at(west,14,50).shadow,true);
  assert.equal(at(west,45,50).shadow,false);
});

test('receivers use their own heights: low roofs shade, higher roofs stay lit', () => {
  const caster = building(1,20,40,20,20,12);
  const low = field([caster,building(2,42,43,14,12,4)]);
  const high = field([caster,building(2,42,43,14,12,18)]);
  assert.equal(at(low,44,48).material,S.material.roof);
  assert.equal(at(low,44,48).shadow,true);
  assert.equal(at(low,53,48).shadow,false);
  assert.equal(at(high,44,48).shadow,false);
});

test('courtyard holes receive the wall shadow but keep a lit ground interior', () => {
  const f = field([building(1,20,20,60,60,8,[rect(35,35,30,30).reverse()])]);
  assert.equal(at(f,38,50).height,0);
  assert.equal(at(f,38,50).material,S.material.ground);
  assert.equal(at(f,38,50).shadow,true);
  assert.equal(at(f,55,50).shadow,false);
  assert.equal(at(f,55,50).height,0);
});

test('a bridge slab casts a detached water shadow and keeps its own deck lit', () => {
  const f = field([
    {id:1,layer:'water',type:3,props:{class:'river'},geometry:[rect(0,0,140,140)]},
    {id:2,layer:'transportation',type:2,props:{class:'path',brunnel:'bridge',min_height:12},geometry:[[[30,20],[30,110]]]},
  ]);
  assert.equal(at(f,30,60).material,S.material.bridge);
  assert.equal(at(f,30,60).shadow,false);
  assert.equal(at(f,35,60).material,S.material.water);
  assert.equal(at(f,35,60).shadow,false,'space below a raised bridge must not become a solid wall');
  assert.equal(at(f,41,60).shadow,true);
  assert.equal(at(f,47,60).shadow,false);
});

test('canopy volume follows the actual crown; a higher canopy casts a longer shadow', () => {
  const a = scene([]), b = scene([]);
  const tree = {key:'tree:1',seed:33,x:40,y:50,radius:8,forest:false,props:{height:10}};
  a.trees=[tree];b.trees=[{...tree,props:{height:20}}];
  const low=S.build(a,crown,east), high=S.build(b,crown,east);
  assert.equal(at(low,40,50).material,S.material.canopy);
  assert.ok(at(low,40,50).bottom>0);
  assert.equal(at(low,60,50).shadow,false);
  assert.equal(at(high,60,50).shadow,true);
  assert.equal(at(high,25,50).shadow,false);
});

test('thin bridge slabs keep their shadow at high sun angles between sampling steps', () => {
  for(const altitude of [60,68,75]) {
    const f=field([
      {id:1,layer:'water',type:3,props:{class:'river'},geometry:[rect(0,0,140,140)]},
      {id:2,layer:'transportation',type:2,props:{class:'path',brunnel:'bridge',min_height:22},geometry:[[[15,44],[115,44]]]},
    ],{altitude:altitude*Math.PI/180});
    assert.ok(f.stats.shadowPixels[S.material.water]>80,`bridge vanished at ${altitude} degrees`);
    assert.equal(at(f,80,44).shadow,false);
  }
});

test('height provenance validates units, uses floors before estimates, and bounds extreme artistic shadows', () => {
  assert.equal(S.meters('20 ft'),6.096);
  assert.equal(S.meters('12 m'),12);
  for(const value of [-8,0,'NaN','12;20','unknown','Infinity']) assert.equal(S.meters(value),null);
  const f=scene([building(1,20,20,20,20,'invalid')]), roof=f.buildings[0];
  roof.props['building:levels']=3;
  assert.equal(S.heightInfo(f,roof,'roof').source,'levels');
  delete roof.props['building:levels'];
  assert.equal(S.heightInfo(f,roof,'roof').source,'estimated');
  roof.props.height=500;
  const info=S.heightInfo(f,roof,'roof');
  assert.equal(info.source,'attribute');assert.equal(info.capped,true);
  assert.ok(info.world/Math.tan(S.lighting.altitude)<=S.lighting.maxReach+.001);
  const geographic={viewport:{geographic:true}};
  assert.ok(S.metersPerWorld(geographic,4096*2**13)>S.metersPerWorld(geographic,4096*2**12));
});

test('overlapping shadows do not accumulate and retain identical world cells after pan and source reordering', () => {
  const features=[building(1,20,40,20,20,15),building(2,24,42,20,20,14)];
  const a=field(features), b=field([...features].reverse(),east,{...view,centerX:94,centerY:81});
  for(let y=15;y<110;y++) for(let x=15;x<110;x++) assert.deepEqual(at(a,x,y),at(b,x,y));
  assert.equal(at(a,48,50).shadow,true);
  assert.ok(a.shadow.every(n=>n===0||n===1));
});

test('offscreen buildings cast into the view; tunnels never acquire deck height or cast shadows', () => {
  const f=field([building(1,-14,40,10,20,20),
    {id:3,layer:'transportation',type:2,props:{class:'rail',brunnel:'tunnel',min_height:12},geometry:[[[60,0],[60,140]]]}]);
  assert.equal(at(f,5,50).shadow,true);
  assert.equal(at(f,60,50).height,0);
  assert.equal(at(f,65,50).shadow,false);
  assert.equal(f.stats.shadowCasterCount,1);
});
