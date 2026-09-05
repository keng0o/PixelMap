// Compare identical geography with the V6 baseline and measure actual pen pixels.
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const base=(process.env.PIXELMAP_BASE_URL||'http://127.0.0.1:8766').replace(/\/$/,'');
const output=process.env.PIXELMAP_QA_OUTPUT||'/tmp/pixelmap-illustrated-ink';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const before=execFileSync('git',['show','1dcffc00b71347ac38455031517bf1dafbbc6787:assets/illustrated-landscape-renderer.js'],{encoding:'utf8'});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:760,height:940},deviceScaleFactor:2});
  await page.goto(base+'/variants/map-12-illustrated-landscape.html?scene=fixture');
  await page.waitForFunction(()=>window.PixelMapIllustratedApp&&document.documentElement.dataset.mapReady==='1');
  const result=await page.evaluate(oldSource=>{
   const G=PixelMapIllustratedGeometry,current=PixelMapIllustratedRenderer;
   (0,eval)(oldSource);const previous=PixelMapIllustratedRenderer;window.PixelMapIllustratedRenderer=current;
   const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
   const poly=(id,layer,rings,props={})=>({id,layer,type:3,props,geometry:rings});
   const features=[
    ['屋根の外周と細い内部線',[
     poly(1,'building',[rect(20,30,50,35)],{class:'residential'}),
     poly(2,'building',[rect(110,20,65,55),rect(130,37,25,22).reverse()],{class:'residential'})]],
    ['林縁と単木',[]],
    ['川岸・道・橋',[
     poly(3,'water',[[[120,-20],[160,-20],[150,40],[175,70],[165,130],[120,130],[130,70],[110,40],[120,-20]]],{class:'river'}),
     {id:4,layer:'transportation',type:2,props:{class:'minor'},geometry:[[[45,-10],[40,40],[55,70],[40,130]]]},
     {id:5,layer:'transportation',type:2,props:{class:'minor',brunnel:'bridge'},geometry:[[[43,55],[170,55]]]}]],
   ];
   const images=[];
   for(const [title,featuresForScene] of features)for(const [label,renderer]of [['変更前 V6',previous],['変更後 V7',current]]) {
    const scene=G.compose(G.mergeFeatures(featuresForScene),{centerX:100,centerY:55,width:320,height:176,scale:1.5});
    if(!featuresForScene.length)scene.trees=[
     {x:30,y:42,radius:24,seed:5,forest:true},{x:55,y:46,radius:22,seed:12,forest:true},
     {x:75,y:44,radius:24,seed:21,forest:true},{x:145,y:50,radius:16,seed:52,forest:false},
    ];
    const c=document.createElement('canvas');c.width=640;c.height=352;const ctx=c.getContext('2d');ctx.scale(2,2);renderer.paint(ctx,scene);
    images.push({title,label,url:c.toDataURL('image/png')});
   }
   const c=document.createElement('canvas');c.width=1080;c.height=240;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.scale(4,4);
   current.inkPenLine(ctx,[[10,30],[250,30]],'#111111',1.65,304,.22,1);
   const rgba=ctx.getImageData(0,0,c.width,c.height).data,widths=[];
   for(let x=20;x<=240;x++) {let alpha=0;for(let y=0;y<c.height;y++)alpha+=rgba[(y*c.width+x*4)*4+3]/255;widths.push(alpha/4);}
   const lineCanvas=document.createElement('canvas');lineCanvas.width=1080;lineCanvas.height=240;
   const lineCtx=lineCanvas.getContext('2d');lineCtx.fillStyle='#f4efda';lineCtx.fillRect(0,0,1080,240);lineCtx.drawImage(c,0,0);
   return {images,line:lineCanvas.toDataURL('image/png'),widths,min:Math.min(...widths),max:Math.max(...widths)};
  },before);
  assert.ok(result.min>.7 && result.min<1.3 && result.max>2 && result.max<2.8,JSON.stringify({min:result.min,max:result.max}));
  assert.ok(result.max/result.min>1.8);
  await page.evaluate(({images,line})=>{
   document.body.innerHTML='';document.body.style.cssText='position:static;overflow:visible;height:auto;padding:18px;background:#f4efda;color:#434635;font:14px sans-serif';
   document.documentElement.style.cssText='overflow:auto;height:auto;background:#f4efda';
   const h=document.createElement('h1');h.textContent='輪郭の筆圧 · 同じ形で比較';h.style.fontSize='21px';document.body.append(h);
   const p=document.createElement('p');p.textContent='架空の配置。外周に太細をつけ、内部の細線を残す。';document.body.append(p);
   const main=document.createElement('main');main.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px';document.body.append(main);
   for(const item of images) {const section=document.createElement('section'),label=document.createElement('p'),img=document.createElement('img');label.textContent=item.label+' · '+item.title;img.src=item.url;img.style.cssText='width:100%;display:block;border:1px solid #bab99d';section.append(label,img);main.append(section);}
   const label=document.createElement('p'),img=document.createElement('img');label.textContent='一本の線の太細（拡大）';img.src=line;img.style.cssText='width:100%;height:95px;object-fit:contain';document.body.append(label,img);
  },result);
  await page.screenshot({path:path.join(output,'ink-comparison.png'),fullPage:true});
  await fs.writeFile(path.join(output,'ink-pixels.json'),JSON.stringify({base,minWidth:result.min,maxWidth:result.max,ratio:result.max/result.min,widths:result.widths},null,2));
  console.log(JSON.stringify({minWidth:result.min,maxWidth:result.max,ratio:result.max/result.min,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
