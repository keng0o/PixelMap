import test from 'node:test';
import assert from 'node:assert/strict';
await import('../assets/top-down-game-map.js');
await import('../assets/illustrated-landscape-map.js');
const M=globalThis.PixelMapIllustratedMap,D=globalThis.PixelMapTopDownMap;
const dimensions={width:736,height:952};
const view=D.createNavigationState({centerX:59596772.329,centerY:26462908.57,scale:1.05});
const world=(v,p)=>[v.centerX+(p.x-dimensions.width/2)/v.scale,v.centerY+(p.y-dimensions.height/2)/v.scale];
const close=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<1e-7,`${a} != ${b}`));

test('wheel zoom preserves the exact world point under an off-center cursor',()=>{
 const p={x:103,y:229},next=M.transformView(view,dimensions,p,p,2);
 assert.equal(next.scale,2.1);close(world(view,p),world(next,p));
 assert.notEqual(next.centerX,view.centerX);
 const back=M.transformView(next,dimensions,p,p,.5);
 close([back.centerX,back.centerY],[view.centerX,view.centerY]);
});
test('pinch scales about its moving midpoint and a one-finger continuation pans at the new scale',()=>{
 const from={x:140,y:280},to={x:170,y:310};
 const pinch=M.transformView(view,dimensions,from,to,1.8);
 close(world(view,from),world(pinch,to));
 const panned=M.transformView(pinch,dimensions,to,{x:200,y:350},1);
 close([panned.centerX,panned.centerY],[pinch.centerX-30/pinch.scale,pinch.centerY-40/pinch.scale]);
});
test('zoom limits preserve the anchor and repeated limit input does not drift the camera',()=>{
 const p={x:615,y:140};
 const high=M.transformView(view,dimensions,p,p,1e4),low=M.transformView(view,dimensions,p,p,1e-4);
 assert.equal(high.scale,4.2);assert.equal(low.scale,.525);
 close(world(view,p),world(high,p));close(world(view,p),world(low,p));
 assert.equal(M.transformView(high,dimensions,p,p,2),high);
 assert.equal(M.transformView(low,dimensions,p,p,.5),low);
 assert.equal(M.transformView(view,dimensions,p,p,NaN),view);
});
test('fictional fixture uses its fitted view as the zoom baseline',()=>{
 const base=844/952,v=D.createNavigationState({...view,scale:base}),p={x:195,y:422};
 assert.equal(M.transformView(v,dimensions,p,p,20,base).scale,base*4);
 assert.equal(M.transformView(v,dimensions,p,p,.01,base).scale,base*.5);
});
test('preview matrix agrees with a rerendered projection after combined zoom and translation',()=>{
 const from={x:240,y:320},to={x:290,y:300};
 const next=M.transformView(view,dimensions,from,to,1.7),painted={...view,...dimensions};
 const matrix=M.previewTransform(painted,next,dimensions);
 for(const p of [[view.centerX,view.centerY],[view.centerX+200,view.centerY-180]]) {
  const old=[(p[0]-view.centerX)*view.scale+dimensions.width/2,(p[1]-view.centerY)*view.scale+dimensions.height/2];
  const expected=[(p[0]-next.centerX)*next.scale+dimensions.width/2,(p[1]-next.centerY)*next.scale+dimensions.height/2];
  close([old[0]*matrix.scale+matrix.x,old[1]*matrix.scale+matrix.y],expected);
 }
});
test('preview keeps the camera center when viewport dimensions change',()=>{
 const matrix=M.previewTransform({...view,...dimensions},view,{width:390,height:844});
 close([dimensions.width/2*matrix.scale+matrix.x,dimensions.height/2*matrix.scale+matrix.y],[195,422]);
});
