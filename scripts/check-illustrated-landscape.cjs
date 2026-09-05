// Run against a local server or Pages. Requires playwright on Node's module path.
// PIXELMAP_BASE_URL=http://127.0.0.1:8766 PIXELMAP_QA_OUTPUT=/tmp/illustrated-qa node scripts/check-illustrated-landscape.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = (process.env.PIXELMAP_BASE_URL || 'http://127.0.0.1:8766').replace(/\/$/, '');
const output = process.env.PIXELMAP_QA_OUTPUT || '/tmp/pixelmap-illustrated-check';
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const route = '/variants/map-12-illustrated-landscape.html';
const cases = [
  ['fixture', '?scene=fixture', 736, 952], ['fixture-mobile', '?scene=fixture', 390, 844],
  ['city', '?lat=35.531&lon=139.702', 736, 952], ['city-mobile', '?lat=35.531&lon=139.702', 390, 844],
  ['river', '?lat=35.5536&lon=139.7013', 736, 952], ['river-mobile', '?lat=35.5536&lon=139.7013', 390, 844],
  ['green', '?lat=35.611&lon=139.573', 736, 952], ['green-mobile', '?lat=35.611&lon=139.573', 390, 844],
  ['city-mobile-dpr2', '?lat=35.531&lon=139.702', 390, 844, 2],
  ['river-mobile-dpr2', '?lat=35.5536&lon=139.7013', 390, 844, 2],
  ['green-mobile-dpr2', '?lat=35.611&lon=139.573', 390, 844, 2],
];
const ready = page => page.waitForFunction(() => document.documentElement.dataset.mapReady === '1' && window.PixelMapIllustratedApp, null, {timeout:60000});
async function run() {
  await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({executablePath:chrome, headless:true});
  const report = { base, screenshots:[], interactions:[] };
  try {
    for(const [name, query, width, height, deviceScaleFactor=1] of cases) {
      const page = await browser.newPage({viewport:{width,height},deviceScaleFactor});
      const errors = []; page.on('pageerror',e=>errors.push(String(e)));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto(base+route+query); await ready(page);
      const d = await page.evaluate(()=>window.PixelMapIllustratedStudy);
      assert.equal(d.styleId,'illustrated-landscape-hand-drawn-v6'); assert.equal(d.failedTileCount,0);
      assert.equal(d.paintedRoofs,d.roofCount); assert.equal(d.paintedTrees,d.treeCount);
      assert.equal(d.buildingExtrusionEnabled,false); assert.equal(d.labelCount,0);
      assert.equal(d.shadowSolver,'height-intervals-v1');
      assert.equal(d.heightFromDataCount+d.heightEstimatedCount,d.shadowCasterCount);
      assert.ok(d.shadowCasterCount>0 && d.shadowPixels.some(n=>n>0));
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(output,`${name}.png`)});
      report.screenshots.push({name,query,width,height,deviceScaleFactor,diagnostics:d});
      await page.close();
    }
    const page = await browser.newPage({viewport:{width:736,height:952},deviceScaleFactor:1});
    await page.goto(base+route+'?lat=35.611&lon=139.573'); await ready(page);
    const before = await page.evaluate(()=>({d:window.PixelMapIllustratedStudy,trees:window.PixelMapIllustratedApp.getScene().trees}));
    await page.mouse.move(350,450); await page.mouse.down(); await page.mouse.move(395,480,{steps:6}); await page.mouse.up();
    await page.waitForFunction(n=>window.PixelMapIllustratedStudy.renderCount>n+1,before.d.renderCount);
    const after = await page.evaluate(()=>({d:window.PixelMapIllustratedStudy,trees:window.PixelMapIllustratedApp.getScene().trees}));
    assert.ok(Math.abs(after.d.centerX-(before.d.centerX-45/1.05))<.001);
    const later = new Map(after.trees.map(t=>[t.key,t]));
    const common = before.trees.filter(t=>Math.abs(t.x-before.d.centerX)<220 && Math.abs(t.y-before.d.centerY)<290);
    assert.ok(common.length>0);
    for(const tree of common) assert.deepEqual(later.get(tree.key),tree);
    report.interactions.push({name:'pan-world-stability',comparedTrees:common.length});

    const inkPan = await page.evaluate(()=>{
      const features=PixelMapIllustratedGeometry.mergeFeatures(PixelMapIllustratedFixture.features);
      const draw=centerX=>{
        const c=document.createElement('canvas');c.width=360;c.height=360;
        const ctx=c.getContext('2d');
        const scene=PixelMapIllustratedGeometry.compose(features,{centerX,centerY:650,width:360,height:360,scale:1});
        const start=performance.now();PixelMapIllustratedRenderer.paint(ctx,scene);
        return {ctx,ms:performance.now()-start};
      };
      const a=draw(245),b=draw(269),repeat=draw(245);
      const first=a.ctx.getImageData(48,24,264,312).data,second=b.ctx.getImageData(24,24,264,312).data;
      const again=repeat.ctx.getImageData(48,24,264,312).data;
      let different=0,maxChannelDifference=0,totalDifference=0,significantPixels=0,repeatedDifferences=0;
      for(let i=0;i<first.length;i+=4) {
        const d=Math.max(...[0,1,2].map(c=>Math.abs(first[i+c]-second[i+c])));
        if(d>0)different++; maxChannelDifference=Math.max(maxChannelDifference,d);
        totalDifference+=d;if(d>2)significantPixels++;
        if([0,1,2].some(c=>first[i+c]!==again[i+c]))repeatedDifferences++;
      }
      return {comparedPixels:first.length/4,different,maxChannelDifference,significantPixels,
        meanChannelDifference:totalDifference/(first.length/4),repeatedDifferences,paintMs:[a.ms,b.ms]};
    });
    // Identical frames are pixel-exact. Translation can round GPU antialiasing at
    // overlapping pen contours; bound both the affected area and the mean RGB error.
    assert.equal(inkPan.repeatedDifferences,0,JSON.stringify(inkPan));
    assert.ok(inkPan.different/inkPan.comparedPixels<.03,JSON.stringify(inkPan));
    assert.ok(inkPan.significantPixels/inkPan.comparedPixels<.001,JSON.stringify(inkPan));
    assert.ok(inkPan.meanChannelDifference<.05 && inkPan.maxChannelDifference<=20,JSON.stringify(inkPan));
    report.interactions.push({name:'ink-paper-pan-pixels',...inkPan});

    const pixels = await page.evaluate(()=>{
      const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
      const f=[{id:1,layer:'water',type:3,props:{class:'river'},geometry:[rect(80,0,40,200)]},
        {id:2,layer:'waterway',type:2,props:{class:'river'},geometry:[[[100,0],[100,200]]]},
        {id:3,layer:'transportation',type:2,props:{class:'minor',brunnel:'bridge'},geometry:[[[0,100],[200,100]]]},
        {id:4,layer:'building',type:3,props:{class:'residential'},geometry:[rect(20,20,40,40),rect(30,30,20,20).reverse()]}];
      const scene=PixelMapIllustratedGeometry.compose(PixelMapIllustratedGeometry.mergeFeatures(f),{centerX:100,centerY:100,width:200,height:200,scale:1});
      const c=document.createElement('canvas');c.width=200;c.height=200;const ctx=c.getContext('2d');
      PixelMapIllustratedRenderer.paint(ctx,scene);
      const get=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
      return {bridge:get(100,100),water:get(100,80),courtyard:get(40,40),roof:get(25,25),palette:PixelMapIllustratedRenderer.palette};
    });
    const rgb=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
    // Paper fibres can tint a sampled pigment by at most 12 RGB steps. A wrong
    // water/road layer or a filled courtyard remains outside this narrow tolerance.
    const pigment = (actual, expected) => actual.every((n,i)=>Math.abs(n-expected[i])<=12);
    assert.ok(pigment(pixels.bridge,rgb(pixels.palette.road)),JSON.stringify(pixels.bridge));
    assert.ok(pigment(pixels.water,rgb(pixels.palette.water)),JSON.stringify(pixels.water));
    assert.ok(pigment(pixels.courtyard,rgb(pixels.palette.ground)),JSON.stringify(pixels.courtyard));
    assert.ok(pixels.roof[0]>pixels.roof[1]);
    report.interactions.push({name:'paint-pixels-bridge-water-courtyard',pixels});

    const shoreMask = await page.evaluate(()=>{
      const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
      const feature={id:10,layer:'water',type:3,props:{class:'river'},
        geometry:[rect(30,25,180,190),rect(80,80,80,80).reverse()]};
      const scene=PixelMapIllustratedGeometry.compose(PixelMapIllustratedGeometry.mergeFeatures([feature]),
        {centerX:120,centerY:120,width:240,height:240,scale:1});
      // Isolate the actual water paint from nearby ground decoration. Comparing
      // every dry pixel catches bank-wash leaks, including polygon island holes.
      Object.assign(scene,{land:[],roads:[],buildings:[],trees:[],groundMarks:[]});
      const draw=water=>{
        const c=document.createElement('canvas');c.width=240;c.height=240;
        const ctx=c.getContext('2d',{willReadFrequently:true});PixelMapIllustratedRenderer.paint(ctx,{...scene,water});
        return ctx.getImageData(0,0,240,240).data;
      };
      const water=draw(scene.water),dry=draw([]);
      let dryPixels=0,leakedPixels=0,bank=0,center=0,samples=0;
      for(let y=0;y<240;y++) for(let x=0;x<240;x++) {
        const i=(y*240+x)*4;
        if(x<26 || x>214 || y<21 || y>219 || (x>84 && x<156 && y>84 && y<156)) {
          dryPixels++;
          if([0,1,2].some(c=>water[i+c]!==dry[i+c]))leakedPixels++;
        }
      }
      for(let y=35;y<205;y++) for(let x=33;x<38;x++) {
        bank+=water[(y*240+x)*4+1];center+=water[(y*240+x+25)*4+1];samples++;
      }
      return {dryPixels,leakedPixels,meanBankGreen:bank/samples,meanCenterGreen:center/samples};
    });
    assert.equal(shoreMask.leakedPixels,0,JSON.stringify(shoreMask));
    assert.ok(shoreMask.meanCenterGreen-shoreMask.meanBankGreen>3,JSON.stringify(shoreMask));
    report.interactions.push({name:'shore-shading-preserves-land-and-islands',...shoreMask});

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({latitude:35.531,longitude:139.702});
    await page.locator('[data-current-location]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-current-location]').disabled &&
      Math.abs(window.PixelMapIllustratedStudy.centerX-59596772.32924444)<.001);
    report.interactions.push({name:'geolocation-success-mocked',passed:true});
    const initialLocation = await page.evaluate(()=>window.PixelMapIllustratedStudy.centerX);
    await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=(_success,failure)=>failure({code:1});});
    await page.locator('[data-current-location]').click();
    assert.match(await page.locator('[data-map-message]').innerText(),/許可されていません/);
    assert.equal(await page.evaluate(()=>window.PixelMapIllustratedStudy.centerX),initialLocation);
    assert.equal(await page.locator('[data-current-location]').isDisabled(),false);
    report.interactions.push({name:'geolocation-denied-mocked',passed:true});
    await page.close();

    const failed = await browser.newPage({viewport:{width:390,height:844}});
    await failed.route('**/*.pbf',r=>r.fulfill({status:503,body:''}));
    await failed.goto(base+route+'?lat=35.531&lon=139.702');
    await failed.locator('[data-map-retry]').waitFor({state:'visible',timeout:60000});
    assert.equal(await failed.getAttribute('html','data-map-ready'),'0');
    await failed.unroute('**/*.pbf'); await failed.locator('[data-map-retry]').click(); await ready(failed);
    const saved = await failed.evaluate(()=>window.PixelMapIllustratedStudy);
    // Force a distant, uncached request; total failure restores the last successful geographic view.
    await failed.route('**/*.pbf',r=>r.fulfill({status:503,body:''}));
    await failed.mouse.move(180,400);await failed.mouse.down();await failed.mouse.move(-6000,400,{steps:3});await failed.mouse.up();
    await failed.locator('[data-map-retry]').waitFor({state:'visible',timeout:60000});
    assert.equal(await failed.evaluate(()=>window.PixelMapIllustratedStudy.centerX),saved.centerX);
    assert.equal(await failed.getAttribute('html','data-map-ready'),'1');
    report.interactions.push({name:'tile-failure-retry-and-last-map-preservation',passed:true});
    await failed.close();

    const entry=await browser.newPage();
    await entry.goto(base+'/variants/map-02-refined.html?profile=illustrated-landscape&presentation=art&scene=fixture');
    await ready(entry); assert.match(entry.url(),/map-12-illustrated-landscape/);
    assert.equal(await entry.getAttribute('html','data-scene-type'),'fictional-fixture');
    report.interactions.push({name:'standalone-entry',passed:true});await entry.close();
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({screenshots:report.screenshots.length,checks:report.interactions,output}));
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
