const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const base=(process.env.PIXELMAP_BASE_URL||'http://127.0.0.1:8766').replace(/\/$/,'');
const output=process.env.PIXELMAP_QA_OUTPUT||'/tmp/pixelmap-roadside';
const baseline=['geometry','surfaces','renderer'].map(name=>execFileSync('git',['show',`0b1acee8134c735d3f0297727152f668c8f2e547:assets/illustrated-landscape-${name}.js`],{encoding:'utf8'}));
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1080,height:780},deviceScaleFactor:2});
  await page.goto(base+'/variants/map-12-illustrated-landscape.html?scene=fixture');
  await page.waitForFunction(()=>document.documentElement.dataset.mapReady==='1');
  const comparison=await page.evaluate(baseline=>{
   const current=[PixelMapIllustratedGeometry,PixelMapIllustratedSurfaces,PixelMapIllustratedRenderer];
   const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
   const road=(id,points,props={})=>({id,layer:'transportation',type:2,props:{class:'minor',...props},geometry:[points]});
   const building=(id,x,y,w,h)=>({id,layer:'building',type:3,props:{},geometry:[rect(x,y,w,h)]});
   const features=[road(1,[[-50,80],[85,80],[160,88],[250,64]]),road(2,[[85,80],[83,160],[260,230]],{class:'path'}),
    road(3,[[-20,200],[100,210],[230,175]]),building(11,35,84.5,32,23),building(12,131,53,24,26),
    building(13,108,138,26,25),building(14,180,182,28,24),building(15,35,180,30,23),
    {id:20,layer:'water',type:3,props:{class:'pond'},geometry:[[[0,239],[35,222],[59,235],[68,285],[0,285],[0,239]]]},
    {id:21,layer:'landcover',type:3,props:{class:'forest'},geometry:[rect(174,100,90,40)]}];
   document.body.innerHTML='';document.body.style.cssText='padding:20px;background:#f4efda;position:static;overflow:visible;font:15px sans-serif';
   const h=document.createElement('h1');h.textContent='道幅と道端の描画比較 · 検証用の架空配置';h.style.cssText='font-size:20px;margin:0 0 8px';document.body.append(h);
   const note=document.createElement('p');note.textContent='同じ道路中心線と建物配置。空きのある道端に太細・砂利・土の薄い陰影を加える。';document.body.append(note);
   const main=document.createElement('main');main.style.cssText='display:flex;gap:20px';document.body.append(main);
   const result=[];
   for(const phase of ['before','after']) {
    if(phase==='before')for(const script of baseline)(0,eval)(script);
    else [window.PixelMapIllustratedGeometry,window.PixelMapIllustratedSurfaces,window.PixelMapIllustratedRenderer]=current;
    const G=PixelMapIllustratedGeometry,R=PixelMapIllustratedRenderer;
    const scene=G.compose(G.mergeFeatures(features),{centerX:115,centerY:130,width:500,height:620,scale:2.2});
    const section=document.createElement('section'),label=document.createElement('p'),canvas=document.createElement('canvas');
    label.textContent=phase==='before'?'道幅変更前 V9':'現在の描画';canvas.width=1000;canvas.height=1240;canvas.style.cssText='width:500px;height:620px';
    const ctx=canvas.getContext('2d');ctx.scale(2,2);R.paint(ctx,scene);section.append(label,canvas);main.append(section);
    result.push({phase,roadsideMarks:scene.roadside?.length||0});
   }
   return result;
  },baseline);
  await page.screenshot({path:path.join(output,'roadside-comparison.png')});
  assert.ok(comparison[1].roadsideMarks>20);
  const checks=[];
  for(const [name,query] of [['city','lat=35.531&lon=139.702'],['river','lat=35.5536&lon=139.7013'],['green','lat=35.611&lon=139.573']]) {
   await page.setViewportSize({width:736,height:952});
   await page.goto(base+'/variants/map-12-illustrated-landscape.html?'+query);
   await page.waitForFunction(()=>document.documentElement.dataset.mapReady==='1');
   const check=await page.evaluate(()=>{
    const scene=PixelMapIllustratedApp.getScene(),G=PixelMapIllustratedGeometry,S=PixelMapIllustratedSurfaces;
    const buildings=[...scene.buildings.map(b=>b.polygon),...scene.buildingAreas.flatMap(f=>f.polygons)];
    const protectedPolys=S.union([...buildings,...scene.water.flatMap(f=>f.paintPolygons),...Object.values(scene.roadGroups).flat(),
     ...scene.roads.filter(f=>['rail','transit'].includes(G.kind(f))).flatMap(f=>f.paintPolygons),
     ...scene.land.filter(f=>['farmland','farm','vineyard'].includes(G.kind(f))).flatMap(f=>f.polygons)]);
    const q=S.query(protectedPolys);let overlap=0,canopyOverlap=0;
    for(const m of scene.roadside) {
     const p=[m.x,m.y];if(q.inside(p)||q.nearest(p,m.radius).distance<m.radius)overlap++;
     if(scene.trees.some(t=>Math.hypot(m.x-t.x,m.y-t.y)<m.radius+t.radius*1.08))canopyOverlap++;
    }
    return {marks:scene.roadside.length,washes:scene.roadside.filter(m=>m.wash).length,overlap,canopyOverlap,
     painted:PixelMapIllustratedStudy.paintedRoadsideMarks};
   });
   assert.ok(check.marks>20);assert.equal(check.overlap,0);assert.equal(check.canopyOverlap,0);assert.equal(check.painted,check.marks);
   checks.push({name,...check});
   if(name==='green'){
    await page.locator('[data-zoom-in]').click();
    await page.waitForFunction(()=>!PixelMapIllustratedStudy.interacting&&!PixelMapIllustratedStudy.loading&&PixelMapIllustratedStudy.zoom>1.4);
    await page.locator('[data-zoom-in]').click();
    await page.waitForFunction(()=>!PixelMapIllustratedStudy.interacting&&!PixelMapIllustratedStudy.loading&&PixelMapIllustratedStudy.zoom>1.9)
     .catch(async e=>{throw new Error(`${e.message}: ${JSON.stringify(await page.evaluate(()=>({diagnostics:PixelMapIllustratedStudy,error:document.documentElement.dataset.geometryError})))}`)});
    await page.screenshot({path:path.join(output,'green-roadside-detail.png')});
   }
  }
  await fs.writeFile(path.join(output,'roadside-checks.json'),JSON.stringify({comparison,checks},null,2));console.log(JSON.stringify({comparison,checks}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
