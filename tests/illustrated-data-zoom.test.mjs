import test from 'node:test';
import assert from 'node:assert/strict';
await import('../assets/top-down-game-map.js');
await import('../assets/illustrated-landscape-map.js');
const M=globalThis.PixelMapIllustratedMap,D=globalThis.PixelMapTopDownMap;
const view={...D.lonLatToWorld(139.702,35.531),width:736,height:952,scale:1.05,buffer:512};
view.centerX=view.x;view.centerY=view.y;

test('source zoom follows map scale and clamps to the TileJSON range',()=>{
 assert.deepEqual([.5,1/Math.SQRT2,1,2,4].map(r=>M.dataZoomForScale(1.05*r)),[13,13,14,14,14]);
 assert.equal(M.dataZoomForScale(1.05*(1/Math.SQRT2)*Math.SQRT2),14);
 assert.equal(M.dataZoomForScale(1.05*4,{min:0,max:16}),16);
 assert.equal(M.dataZoomForScale(.001,{min:10,max:14}),10);
});
test('source limits honor a zoom-zero maximum and safely default when metadata is absent',()=>{
 assert.deepEqual(M.sourceZoomRange(),{min:0,max:14});
 assert.deepEqual(M.sourceZoomRange({minzoom:0,maxzoom:0}),{min:0,max:0});
 assert.deepEqual(M.sourceZoomRange({minzoom:4,maxzoom:12}),{min:4,max:12});
 assert.deepEqual(M.sourceZoomRange({minzoom:-4,maxzoom:Infinity}),{min:0,max:14});
});
test('z14 tile coverage remains byte-for-byte compatible with the previous source grid',()=>{
 assert.deepEqual(M.requiredTiles(view,14),D.requiredTiles(view));
});
test('z13 tiles cover the exact same geographic viewport as the child z14 tiles',()=>{
 const tiles=M.requiredTiles(view,13),span=8192;
 for(const child of M.requiredTiles(view,14)) assert.ok(tiles.some(t=>t.worldX===Math.floor(child.worldX/2)&&t.y===Math.floor(child.y/2)));
 for(const [x,y] of [[view.centerX-350,view.centerY-470],[view.centerX+350,view.centerY+470]]) {
  assert.ok(tiles.some(t=>x>=t.worldX*span&&x<(t.worldX+1)*span&&y>=t.y*span&&y<(t.y+1)*span));
 }
});
test('dynamic source tiles wrap longitude and clamp polar rows at their own zoom',()=>{
 for(const z of [0,13,14]) {
  const tiles=M.requiredTiles({...view,centerX:0,centerY:0},z);
  assert.ok(tiles.some(t=>t.worldX===-1&&t.requestX===2**z-1));
  assert.ok(tiles.every(t=>t.y>=0&&t.y<2**z&&t.requestX>=0&&t.requestX<2**z));
 }
 assert.notEqual(M.tileKey({z:13,worldX:1,y:2}),M.tileKey({z:14,worldX:1,y:2}));
});
const layers=(extent,geom)=>({building:{extent,features:[{id:7,type:3,props:{height:12},geom}]}});
test('the same building from parent and child tiles lands on the same z14 world coordinates',()=>{
 const parent=layers(4096,[[[2200,2400],[2300,2400],[2300,2500],[2200,2400]]]);
 const child=layers(8192,[[[608,1408],[1008,1408],[1008,1808],[608,1408]]]);
 const original=JSON.stringify(parent);
 const a=M.normalize(parent,{z:13,worldX:7275,y:3232})[0];
 const b=M.normalize(child,{z:14,worldX:14551,y:6465})[0];
 assert.deepEqual(a.geometry,b.geometry);assert.equal(a.sourceZoom,13);assert.equal(b.sourceZoom,14);
 assert.equal(a.props.height,12);assert.equal(JSON.stringify(parent),original);
});
test('lower-zoom tunnel geometry uses the same conversion and preserves the surface exclusion tag',()=>{
 const input={transportation:{extent:4096,features:[{id:8,type:2,props:{class:'minor',brunnel:'tunnel'},geom:[[[100,200],[300,400]]]}]}};
 const result=M.normalize(input,{z:13,worldX:-1,y:0});
 assert.equal(result.length,1);assert.equal(result[0].props.brunnel,'tunnel');
 assert.deepEqual(result[0].geometry,[[[-7992,400],[-7592,800]]]);
});
