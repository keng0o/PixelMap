import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
globalThis.polygonClipping = require('../assets/vendor/polygon-clipping-0.15.7.js');
await import('../assets/top-down-game-map.js');
await import('../assets/illustrated-landscape-geometry.js');
await import('../assets/illustrated-landscape-renderer.js');
await import('../assets/illustrated-landscape-fixture.js');
await import('../assets/illustrated-landscape-map.js');
const G = globalThis.PixelMapIllustratedGeometry;
const Renderer = globalThis.PixelMapIllustratedRenderer;
const Map = globalThis.PixelMapIllustratedMap;
const rect = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
const polygon = (id, layer, kind, geometry) => ({ id, layer, type: 3, props: { class: kind }, geometry });
const road = (id, geometry, props = {}) => ({ id, layer: 'transportation', type: 2, props: { class: 'minor', ...props }, geometry });
const viewport = { centerX: 100, centerY: 100, width: 200, height: 200, scale: 1 };

test('MVT fragments unite without an internal tile seam or a lost courtyard', () => {
  const left = polygon(1, 'building', 'residential', [rect(0,0,60,100), rect(20,20,20,20).reverse()]);
  const right = polygon(1, 'building', 'residential', [rect(50,0,50,100)]);
  const [building] = G.mergeFeatures([left, right, left]);
  assert.equal(building.polygons.length, 1);
  assert.equal(building.polygons[0].length, 2);
  assert.equal(G.inside([30,30], building.polygons), false);
  assert.equal(G.inside([55,50], building.polygons), true);
  assert.equal(Math.abs(G.area(building.polygons[0][0])), 10000);
});

test('adjacent forest regions share a boundary-free vegetation domain even without feature IDs', () => {
  const merged = G.mergeFeatures([
    polygon(undefined, 'landcover', 'forest', [rect(0,0,100,100)]),
    polygon(undefined, 'landcover', 'forest', [rect(100,0,100,100)]),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(G.containsDisc([100,50], 15, merged[0].polygons), true);
});

test('multi-building features cull individual exterior rings and keep independent buildings', () => {
  const feature = polygon(1, 'building', 'residential', [rect(10,10,20,20), rect(50,50,30,20), rect(10000,10000,30,30)]);
  const scene = G.compose(G.mergeFeatures([feature]), viewport);
  assert.equal(scene.buildings.length, 2);
  assert.equal(scene.stats.sourceBuildingCount, 2);
  assert.equal(new Set(scene.buildings.map(b => b.key)).size, 2);
});

test('roof shapes, holes, and all source roads survive scene composition', () => {
  const shape = polygon(7, 'building', 'residential', [rect(20,20,80,60), rect(40,35,40,25).reverse()]);
  const roads = [road(1, [[[0,10],[100,10],[200,50]]]), road(2, [[[100,10],[100,150]]]), road(3, [[[150,0],[150,200]]], {brunnel:'bridge'})];
  const scene = G.compose(G.mergeFeatures([shape, ...roads]), viewport);
  assert.equal(scene.buildings[0].polygon.length, 2);
  assert.ok(scene.buildings[0].panels.length >= 4);
  assert.equal(scene.stats.roadCount, 3);
  assert.deepEqual(scene.roads.map(r => r.geometry), roads.map(r => r.geometry));
  assert.equal(scene.stats.courtyardCount, 1);
});

test('trees fit their full eligible crown and do not occupy roads, water, buildings, or their holes', () => {
  const forest = polygon(1, 'landcover', 'forest', [rect(-100,-100,400,400), rect(150,150,50,50).reverse()]);
  const water = polygon(2, 'water', 'river', [rect(-100,80,400,25)]);
  const building = polygon(3, 'building', 'residential', [rect(25,25,35,30)]);
  const path = road(4, [[[100,-100],[100,300]]]);
  const features = G.mergeFeatures([forest, water, building, path]);
  const scene = G.compose(features, viewport);
  assert.ok(scene.trees.length > 30);
  for (const tree of scene.trees) {
    const p = [tree.x,tree.y];
    assert.ok(G.containsDisc(p, tree.radius + 1.8, features.find(f=>f.id===1).polygons));
    assert.equal(G.blocked(p, tree.radius + 2, features.filter(f=>f.id!==1)), false);
  }
});

test('placement and roof variants are stable under pan, source ordering, and changing visible multi-building subsets', () => {
  const source = [polygon(1, 'landcover', 'forest', [rect(-500,-500,1000,1000)]),
    polygon(undefined, 'building', 'residential', [rect(30,30,20,20), rect(700,700,20,20)])];
  const a = G.compose(G.mergeFeatures(source), viewport);
  const b = G.compose(G.mergeFeatures([...source].reverse()), {...viewport, centerX:120});
  const c = G.compose(G.mergeFeatures(G.featuresNear(source, {left:0,top:0,right:300,bottom:300})), viewport);
  assert.deepEqual(a.buildings.map(r=>[r.key,r.seed]), c.buildings.map(r=>[r.key,r.seed]));
  const bTrees = new globalThis.Map(b.trees.map(t=>[t.key,t]));
  for (const tree of a.trees.filter(t=> t.x > 20 && t.x < 180 && t.y > 20 && t.y < 180)) assert.deepEqual(tree, bTrees.get(tree.key));
});

test('normalization retains underground source tracks separately from surface drawing', () => {
  const layers = {transportation:{extent:4096,features:[
    {id:1,type:2,props:{class:'minor',brunnel:'tunnel'},geom:[[[0,0],[20,20]]]},
    {id:2,type:2,props:{class:'minor',brunnel:'bridge'},geom:[[[0,20],[20,0]]]},
  ]}};
  const features = Map.normalize(layers,{worldX:0,y:0});
  assert.equal(features.length,2);
  assert.equal(features.find(f=>f.id===1).props.brunnel,'tunnel');
  assert.equal(features.find(f=>f.id===2).props.brunnel,'bridge');
});

test('known flat or tall buildings use flat roof structures, independent of footprint variation', () => {
  const flat = polygon(1, 'building', 'industrial', [rect(10,10,50,30)]);
  const tall = {...polygon(2, 'building', 'residential', [rect(80,10,40,40)]), props:{class:'residential',render_height:45}};
  const scene = G.compose(G.mergeFeatures([flat,tall]),viewport);
  assert.deepEqual(scene.buildings.map(b=>b.style),['flat','flat']);
});

test('actual paint entry reports the same objects that composition produces', () => {
  const calls = [];
  const ctx = new Proxy({}, {get: (_, name) => (...args) => calls.push([name,...args]),set:()=>true});
  const scene = G.compose(G.mergeFeatures(globalThis.PixelMapIllustratedFixture.features),
    {centerX:368,centerY:476,width:736,height:952,scale:1});
  const painted = Renderer.paint(ctx, scene);
  assert.equal(painted.paintedRoofs, scene.stats.roofCount);
  assert.equal(painted.paintedTrees, scene.stats.treeCount);
  assert.equal(painted.paintedRoads, scene.stats.roadCount);
  assert.ok(calls.some(c=>c[0]==='clip' && c[1]==='evenodd'));
  for (const call of calls) for (const n of call.slice(1).filter(v=>typeof v==='number')) assert.ok(Number.isFinite(n));
});

test('fictional art-direction fixture does not place a building on open water', () => {
  const features = G.mergeFeatures(globalThis.PixelMapIllustratedFixture.features);
  const waters = features.filter(f=>f.layer==='water').flatMap(f=>f.polygons);
  for (const building of features.filter(f=>f.layer==='building')) {
    const overlap = globalThis.polygonClipping.intersection(building.polygons, waters);
    assert.equal(overlap.length,0,`building ${building.id} overlaps the river`);
  }
});

test('garden plants require mapped vegetation and retain clearances from real features', () => {
  const features = G.mergeFeatures(globalThis.PixelMapIllustratedFixture.features);
  const scene = G.compose(features,{centerX:368,centerY:476,width:736,height:952,scale:1});
  const gardens = scene.trees.filter(t=>t.garden);
  assert.ok(gardens.length>10);
  const vegetation = features.filter(f=>f.layer==='park' || ['forest','wood','grass','meadow','park','garden','recreation_ground'].includes(G.kind(f)));
  const obstacles = features.filter(f=>['building','water','waterway','transportation'].includes(f.layer) || G.kind(f)==='farmland');
  for(const tree of gardens) {
    assert.ok(vegetation.some(f=>G.containsDisc([tree.x,tree.y],tree.radius*1.07+2,f.polygons)));
    assert.equal(G.blocked([tree.x,tree.y],tree.radius*1.07+2,obstacles),false);
  }
  const bare = G.compose(G.mergeFeatures([polygon(3,'building','residential',[rect(50,50,40,30)])]),viewport);
  assert.equal(bare.trees.length,0,'unknown land must not acquire invented garden plants');
});

test('margin marks follow existing edges and keep their geographic phase under pan', () => {
  const source = [polygon(1,'landcover','grass',[rect(-300,-300,800,800)]),
    road(2,[[[100,-300],[100,500]]])];
  const features = G.mergeFeatures(source);
  const a = G.compose(features,viewport), b = G.compose(features,{...viewport,centerX:124});
  const later = new globalThis.Map(b.groundMarks.map(m=>[m.key,m]));
  const interior = a.groundMarks.filter(m=>m.x>20&&m.x<180&&m.y>20&&m.y<180);
  assert.ok(interior.length>10);
  assert.ok(interior.filter(m=>m.distance<18).length/interior.length>.65);
  for(const mark of interior) {
    assert.deepEqual(later.get(mark.key),mark);
    assert.equal(G.blocked([mark.x,mark.y],2.2,features.filter(f=>f.layer==='transportation')),false);
  }
  assert.deepEqual(a.roads[0].geometry,source[1].geometry);
});

test('the rounded fictional river still has a bridge with dry approaches and a wet crossing', () => {
  const water = G.mergeFeatures(globalThis.PixelMapIllustratedFixture.features).find(f=>f.layer==='water');
  assert.equal(G.inside([359,632],water.polygons),false);
  assert.equal(G.inside([421,609],water.polygons),false);
  assert.equal(G.inside([390,620.5],water.polygons),true);
});

test('new entry is standalone-only; normal, embedded, and existing topdown routes retain their paths', async () => {
  const source = await readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const run = (search, embedded = false) => {
    const outputs = [], self = {}, top = embedded ? {} : self;
    vm.runInNewContext(script, { URL, URLSearchParams, window:{self,top},
      location:{search,href:`https://example.test/variants/map-02-refined.html${search}`,replace:v=>outputs.push(v)} });
    return outputs;
  };
  assert.match(run('?profile=illustrated-landscape&presentation=art&lat=35&lon=139')[0], /map-12-illustrated-landscape.html\?lat=35&lon=139/);
  for(const q of ['', '?profile=illustrated-landscape', '?profile=illustrated-landscape&presentation=art&embedded=1']) assert.deepEqual(run(q),[]);
  assert.deepEqual(run('?profile=illustrated-landscape&presentation=art',true),[]);
  assert.match(run('?profile=topdown-game&presentation=art')[0],/map-09-top-down-game.html/);
  const page = await readFile(new URL('../variants/map-12-illustrated-landscape.html',import.meta.url),'utf8');
  assert.doesNotMatch(page, /data-top-down-map|top-down-game-renderer|top-down-game-patterns/);
  assert.match(page,/構成見本 · 架空の地形/);
});
