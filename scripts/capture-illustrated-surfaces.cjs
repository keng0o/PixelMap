// Capture a labelled topology example and time fresh surface/paint passes.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path');
const base=(process.env.PIXELMAP_BASE_URL||'http://127.0.0.1:8766').replace(/\/$/,'');
const output=process.env.PIXELMAP_QA_OUTPUT||'/tmp/pixelmap-illustrated-check';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:760,height:550},deviceScaleFactor:2});
  await page.goto(base+'/variants/map-12-illustrated-landscape.html?scene=fixture');
  await page.waitForFunction(()=>window.PixelMapIllustratedApp);
  await page.evaluate(()=>{
   const G=PixelMapIllustratedGeometry,R=PixelMapIllustratedRenderer;
   const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
   const road=(id,points,props={})=>({id,layer:'transportation',type:2,props:{class:'minor',...props},geometry:[points]});
   const water={id:8,layer:'water',type:3,props:{class:'river'},geometry:[[[20,0],[200,0],[180,50],[210,110],[190,180],[205,240],[10,240],[30,180],[15,90],[20,0]],rect(80,90,65,65).reverse()]};
   const examples=[['中洲・川岸・橋', [water,road(9,[[0,55],[230,55]],{brunnel:'bridge'})]], ['道の合流・細道', [road(1,[[0,100],[90,95],[170,120],[230,105]]),road(2,[[60,0],[65,100]]),road(3,[[115,230],[125,105]],{class:'path'}),road(4,[[185,0],[190,230]],{class:'service'})]]];
   document.body.innerHTML='';document.body.style.cssText='padding:18px;background:#f4efda;position:static;overflow:visible;font:15px sans-serif';
   const h=document.createElement('h1');h.textContent='道と川の描画検証 · 架空の配置';h.style.fontSize='20px';document.body.append(h);
   const main=document.createElement('main');main.style.cssText='display:flex;gap:14px';document.body.append(main);
   for(const [title,features]of examples){
    const section=document.createElement('section'),label=document.createElement('p'),c=document.createElement('canvas');label.textContent=title;
    c.width=690;c.height=720;c.style.cssText='width:345px;height:360px';const ctx=c.getContext('2d');ctx.scale(2,2);
    R.paint(ctx,G.compose(G.mergeFeatures(features),{centerX:115,centerY:120,width:345,height:360,scale:1.5}));
    section.append(label,c);main.append(section);
   }
  });
  await page.screenshot({path:path.join(output,'surface-topology.png')});
  const times=[];
  for(const [name,query]of [['city','lat=35.531&lon=139.702'],['river','lat=35.5536&lon=139.7013'],['green','lat=35.611&lon=139.573']]){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/variants/map-12-illustrated-landscape.html?'+query);
   await page.waitForFunction(()=>window.PixelMapIllustratedApp&&document.documentElement.dataset.mapReady==='1');
   const timing=await page.evaluate(()=>{
    const app=PixelMapIllustratedApp,old=app.getScene(),G=PixelMapIllustratedGeometry,R=PixelMapIllustratedRenderer;
    const features=[...old.land,...old.roads,...old.water,...old.buildings.map(b=>({type:3,layer:'building',props:b.props,geometry:b.polygon,polygons:[b.polygon],bounds:G.bounds(b.polygon)}))];
    const canvas=document.createElement('canvas');canvas.width=780;canvas.height=1688;const ctx=canvas.getContext('2d');ctx.scale(2,2);
    const times=[];for(let i=0;i<4;i++){
     const start=performance.now(),scene=G.compose(features,old.viewport),prepared=performance.now();R.paint(ctx,scene);
     times.push({composeMs:prepared-start,paintMs:performance.now()-prepared});
    }
    return times.slice(1);
   });times.push({name,samples:timing});
  }
  await fs.writeFile(path.join(output,'performance.json'),JSON.stringify(times,null,2));console.log(JSON.stringify(times));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
