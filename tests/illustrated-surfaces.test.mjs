import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
globalThis.window=globalThis;
globalThis.polygonClipping=require('../assets/vendor/polygon-clipping-0.15.7.js');
await import('../assets/illustrated-landscape-geometry.js');
await import('../assets/illustrated-landscape-surfaces.js');
await import('../assets/illustrated-landscape-shadows.js');
await import('../assets/illustrated-landscape-renderer.js');
const G=globalThis.PixelMapIllustratedGeometry,S=globalThis.PixelMapIllustratedSurfaces;
const clip=globalThis.polygonClipping,Shadow=globalThis.PixelMapIllustratedShadows;
const box={left:0,top:0,right:200,bottom:200};
const view={centerX:100,centerY:100,width:200,height:200,scale:1};
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const road=(id,path,props={})=>({id,layer:'transportation',type:2,props:{class:'minor',...props},geometry:[path]});
const water=(rings)=>({id:50,layer:'water',type:3,props:{class:'river'},geometry:rings});
const compose=features=>G.compose(G.mergeFeatures(features),view);
const area=polys=>polys.reduce((sum,p)=>sum+Math.abs(G.area(p[0]))-p.slice(1).reduce((n,r)=>n+Math.abs(G.area(r)),0),0);

test('drawn roads keep their source geometry and join T/X intersections without internal ink boundaries',()=>{
 const features=[road(1,[[-100,100],[300,100]]),road(2,[[100,0],[100,100]]),road(3,[[150,0],[150,200]])];
 const original=JSON.stringify(features),scene=compose(features);
 assert.equal(JSON.stringify(features),original);
 assert.deepEqual(scene.roads.map(r=>r.geometry),features.map(r=>r.geometry));
 assert.equal(scene.roadGroups.ground.length,1);
 for(const p of [[100,100],[150,100],[99,99],[151,101]]) {
  assert.ok(G.inside(p,scene.roadGroups.ground));
  assert.ok(G.edgeDistance(p,scene.roadGroups.ground.flat())>2,'junction interiors must have no outline');
 }
 for(let x=0;x<=200;x++)assert.ok(G.inside([x,100],scene.roadGroups.ground));
});

test('width variation stays bounded and fixed bridge approaches retain their width',()=>{
 const scene=compose([road(1,[[0,80],[200,80]]),road(2,[[0,120],[200,120]],{brunnel:'bridge'})]);
 const [ground,bridge]=scene.roads;
 const edges=ground.paintPolygons.flat(2).filter(p=>p[0]>20&&p[0]<180);
 const radii=edges.map(p=>Math.abs(p[1]-80));
 assert.ok(Math.max(...radii)-Math.min(...radii)>.1,'road edges must vary visibly');
 assert.ok(radii.every(r=>r>2.7&&r<4.3));
 for(const p of bridge.paintPolygons.flat(2).filter(p=>p[0]>5&&p[0]<195))assert.equal(Math.abs(p[1]-120),3.5);
 for(const p of [[.1,76.6],[199.9,83.4]])assert.ok(G.inside(p,ground.paintPolygons));
});

test('road shape stays fixed under pan, feature order and reversed source direction',()=>{
 const source=[road(1,[[-500,35],[600,165]]),road(2,[[70,-500],[100,600]])];
 const a=compose(source),b=G.compose(G.mergeFeatures([...source].reverse().map(f=>({...f,geometry:f.geometry.map(p=>[...p].reverse())}))),{...view,centerX:124});
 const crop=[rect(20,20,160,160)];
 const left=clip.intersection(a.roadGroups.ground,crop),right=clip.intersection(b.roadGroups.ground,crop);
 assert.ok(area(clip.xor(left,right))<.01);
});

test('water islands and narrow passages remain connected and no paint expands onto mapped land',()=>{
 const ring=[[0,0],[80,0],[80,49.8],[120,49.8],[120,0],[200,0],[200,100],[120,100],[120,50.2],[80,50.2],[80,100],[0,100],[0,0]];
 const island=rect(20,20,20,20).reverse(),scene=compose([water([ring,island])]),f=scene.water[0];
 assert.equal(f.paintPolygons.length,1);
 assert.equal(f.paintPolygons[0].length,2);
 assert.ok(G.inside([100,50],f.paintPolygons));
 assert.equal(G.inside([30,30],f.paintPolygons),false);
 assert.ok(area(clip.difference(f.paintPolygons,f.polygons))<1e-6);
 const later=G.compose(G.mergeFeatures([water([ring,island])]),{...view,centerX:124});
 const crop=[rect(10,10,170,80)];
 assert.ok(area(clip.xor(clip.intersection(f.paintPolygons,crop),clip.intersection(later.water[0].paintPolygons,crop)))<1e-6);
});

test('opposite banks reinforce a continuous flow direction through bends',()=>{
 const f={geometry:[[[0,0],[100,0],[160,60]],[[160,100],[100,40],[0,40]]]};
 const angle=S.flowField({water:[]},f);
 assert.ok(Math.abs(angle([30,20]))<.1);
 let prior=angle([50,20]);
 for(let x=51;x<150;x++) {
  const next=angle([x,20+Math.max(0,x-100)]);
  assert.ok(Math.abs(Math.sin(next-prior))<.04,'bank selection must not snap the current');prior=next;
 }
 assert.ok(angle([145,70])>.4);
 const path=S.flowPath([100,25],60,angle);
 assert.ok(path.every(p=>p.every(Number.isFinite)));
 for(let i=1;i<path.length;i++)assert.ok(Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1])<=4.001);
});

test('nearby mapped centerlines guide ambiguous basin flow without a direction sign flip',()=>{
 const basin={geometry:[rect(0,0,100,100)]};
 const centerline={type:2,geometry:[[[50,-100],[50,200]]]};
 const a=S.flowField({water:[centerline]},basin)([50,50]);
 const b=S.flowField({water:[{...centerline,geometry:[[[50,200],[50,-100]]]}]},basin)([50,50]);
 assert.ok(Math.abs(Math.cos(a))<.01);
 assert.ok(Math.abs(Math.sin(a-b))<.001);
});

test('shadow receivers and raised decks use the same drawn polygons as the painter',()=>{
 const scene=compose([water([rect(0,0,200,200)]),road(1,[[0,100],[200,100]],{brunnel:'bridge',height:8})]);
 // Deliberately narrower footprints prove the solver does not reconstruct a
 // separate fixed-width line and leave a displaced receiver stripe.
 scene.water[0].paintPolygons=[[rect(20,20,160,160)]];
 scene.roads[0].paintPolygons=[[rect(20,99,160,2)]];
 const field=Shadow.build(scene,globalThis.PixelMapIllustratedRenderer.crownPoints);
 assert.equal(Shadow.sample(field,10,50).material,Shadow.material.ground);
 assert.equal(Shadow.sample(field,50,50).material,Shadow.material.water);
 assert.equal(Shadow.sample(field,50,100).material,Shadow.material.bridge);
 assert.equal(Shadow.sample(field,50,102).material,Shadow.material.water);
});

test('indexed surface queries match direct polygon tests near holes, junctions and boundaries',()=>{
 const scene=compose([water([rect(0,0,180,180),rect(40,40,90,90).reverse()]),road(1,[[0,60],[150,100]])]);
 for(const f of [...scene.water,...scene.roads])for(let y=-3.3;y<190;y+=3.7)for(let x=-3.2;x<190;x+=4.3) {
  const p=[x,y],q=f.paintQuery;
  assert.equal(q.inside(p),G.inside(p,f.paintPolygons));
  assert.equal(q.containsDisc(p,2.2),G.containsDisc(p,2.2,f.paintPolygons));
 }
});
