// Real Canvas checks and a labelled synthetic comparison of the production test renderer.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.PIXELMAP_BASE_URL || 'http://127.0.0.1:8766';
const output = process.env.PIXELMAP_QA_OUTPUT || '/tmp/pixelmap-shadow-check';
async function run() {
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:760,height:1050},deviceScaleFactor:2});
    await page.goto(base+'/variants/map-12-illustrated-landscape.html?scene=fixture');
    await page.waitForFunction(()=>window.PixelMapIllustratedApp && document.documentElement.dataset.mapReady==='1');
    const results = await page.evaluate(()=>{
      const G=PixelMapIllustratedGeometry,R=PixelMapIllustratedRenderer;
      const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
      const roof=(id,x,y,w,h,height)=>({id,layer:'building',type:3,
        props:{class:'residential','roof:shape':'flat',height},geometry:[rect(x,y,w,h)]});
      const water={id:8,layer:'water',type:3,props:{class:'river'},geometry:[rect(0,0,130,100)]};
      const bridge={id:9,layer:'transportation',type:2,props:{class:'path',brunnel:'bridge',min_height:22},geometry:[[[15,44],[115,44]]]};
      const scenes=[
        ['建物 6m',[roof(1,20,20,30,30,6)]],
        ['建物 28m',[roof(1,20,20,30,30,28)]],
        ['低い屋根 4m が影を受ける',[roof(1,20,20,30,30,28),roof(2,50,30,30,45,4)]],
        ['高い屋根 40m は遮られない',[roof(1,20,20,30,30,28),roof(2,50,30,30,45,40)]],
        ['橋桁 22m · 水面との隙間',[water,bridge]],
        ['樹冠 · 葉の塊と投影影',[]],
      ];
      const samples=[], images=[];
      for(const [title,features] of scenes) {
        const scene=G.compose(G.mergeFeatures(features),{centerX:65,centerY:50,width:130,height:100,scale:1,metersPerWorld:1});
        if(!features.length) scene.trees=[
          {key:'qa:1',seed:31,x:30,y:30,radius:10,forest:false,props:{height:18}},
          {key:'qa:2',seed:17,x:62,y:48,radius:14,forest:true,props:{height:24}},
          {key:'qa:3',seed:52,x:78,y:56,radius:12,forest:true,props:{height:14}},
        ];
        const c=document.createElement('canvas');c.width=130;c.height=100;
        const ctx=c.getContext('2d',{willReadFrequently:true});const diagnostics=R.paint(ctx,scene);
        const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
        samples.push({title,ground:pixel(53,57),roof:pixel(53,48),water:pixel(80,51),gap:pixel(80,47),deck:pixel(80,44),diagnostics});
        const large=document.createElement('canvas');large.width=780;large.height=600;
        const largeCtx=large.getContext('2d');largeCtx.scale(2,2);
        R.paint(largeCtx,{...scene,viewport:{...scene.viewport,width:390,height:300,scale:3}});
        images.push({title,url:large.toDataURL('image/png')});
      }
      return {samples,images};
    });
    const [low,tall,lowRoof,highRoof,bridge] = results.samples;
    assert.ok(low.ground[1]-tall.ground[1]>10,JSON.stringify({low,tall}));
    assert.ok(highRoof.roof[1]-lowRoof.roof[1]>7,JSON.stringify({lowRoof,highRoof}));
    assert.ok(bridge.gap[1]-bridge.water[1]>10,JSON.stringify(bridge));
    // Thin deck pixels include the irregular edge ink. Check their separation
    // from shaded water and the actual receiver mask, not a fixed paper RGB.
    assert.ok(bridge.deck[0]-bridge.water[0]>40 && bridge.deck[1]-bridge.water[1]>25,JSON.stringify(bridge));
    assert.equal(bridge.diagnostics.shadowPixels[4],0,'the raised deck must stay lit');
    assert.equal(tall.diagnostics.shadowCasterCount,1);
    assert.ok(tall.diagnostics.heightFromDataCount>0);
    assert.ok(bridge.diagnostics.shadowPixels[1]>0);
    await page.evaluate(images=>{
      document.documentElement.style.cssText='overflow:auto;background:#f4efda';
      document.body.style.cssText='position:static;overflow:visible;height:auto;padding:18px;margin:0;font:15px sans-serif;color:#454837';
      document.body.innerHTML='<h1 style="font-size:20px;margin:0 0 6px">自動陰影の検証 · 架空の配置</h1><p style="margin:0 0 16px">同じ光源（左上・仰角68°）で形と高さから計算。比較用に拡大表示。</p><main style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></main>';
      for(const item of images) {
        const section=document.createElement('section'),title=document.createElement('div'),img=document.createElement('img');
        section.style.cssText='border:1px solid #b3b49c;padding:8px;background:#eee9cc';
        title.textContent=item.title;title.style.marginBottom='7px';
        img.src=item.url;img.style.cssText='display:block;width:100%;height:auto';
        section.append(title,img);document.querySelector('main').append(section);
      }
    },results.images);
    await page.screenshot({path:path.join(output,'height-comparison.png'),fullPage:true});
    await fs.writeFile(path.join(output,'height-pixels.json'),JSON.stringify({base,samples:results.samples},null,2));
    console.log(JSON.stringify({checks:4,output,samples:results.samples.map(({title,ground,roof,water,gap,deck})=>({title,ground,roof,water,gap,deck}))}));
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
