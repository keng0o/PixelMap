// Verify real z/x/y network requests and atomic source zoom changes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const base=(process.env.PIXELMAP_BASE_URL||'http://127.0.0.1:8766').replace(/\/$/,'');
const output=process.env.PIXELMAP_QA_OUTPUT||'/tmp/illustrated-data-zoom';
const route='/variants/map-12-illustrated-landscape.html?lat=35.531&lon=139.702';
const tileZ=url=>Number(url.match(/\/(\d+)\/\d+\/\d+\.pbf(?:\?|$)/)?.[1]);
const settled=page=>page.waitForFunction(()=>window.PixelMapIllustratedApp&&PixelMapIllustratedStudy.mapReady&&
  !PixelMapIllustratedStudy.loading&&!PixelMapIllustratedStudy.interacting,null,{timeout:60000});
const read=page=>page.evaluate(()=>({d:PixelMapIllustratedStudy,
  featureZooms:[...new Set(PixelMapIllustratedApp.getFeatures().map(f=>f.sourceZoom))],
  cacheKeys:[...PixelMapIllustratedApp.cache.keys()],pending:PixelMapIllustratedApp.pending.size}));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
async function run(){
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const report={base,checks:[],requests:[],frames:[]},errors=[];
 const open=async()=>{
  const p=await browser.newPage({viewport:{width:736,height:952}});
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('request',r=>{const z=tileZ(r.url());if(Number.isFinite(z))report.requests.push({z,path:new URL(r.url()).pathname});});
  await p.goto(base+route);await settled(p);return p;
 };
 const checkFrame=async(p,z)=>{const s=await read(p);assert.equal(s.d.dataZoom,z);assert.equal(s.d.requestedDataZoom,z);
  assert.deepEqual(s.featureZooms,[z]);assert.equal(s.d.failedTileCount,0);report.frames.push(s);return s;};
 const click=async(p,inward)=>{await p.locator(inward?'[data-zoom-in]':'[data-zoom-out]').click();await settled(p);};
 try{
  const p=await open();const first=await checkFrame(p,14);assert.equal(first.d.sourceMaxZoom,14);
  // Move barely below the source threshold so the pictures show the same place
  // and almost the same scale, but are built from different source tile zooms.
  await p.screenshot({path:path.join(output,'city-source-z14.png')});
  const count=report.requests.length;await p.mouse.move(368,476);await p.mouse.wheel(0,.1);await settled(p);
  const low=await checkFrame(p,13);assert.ok(report.requests.slice(count).some(r=>r.z===13));
  assert.equal(low.d.roofCount,0);assert.ok(low.d.generalizedBuildingAreaCount>0);
  assert.equal(low.d.paintedBuildingAreas,low.d.generalizedBuildingAreaCount);
  near(low.d.centerX,first.d.centerX);near(low.d.centerY,first.d.centerY);
  await p.screenshot({path:path.join(output,'city-source-z13.png')});
  const lowCount=report.requests.length;await p.mouse.wheel(0,-.1);await settled(p);const restored=await checkFrame(p,14);
  assert.equal(report.requests.length,lowCount,'return to cached z14 must not download z13 or alias its cache');
  near(restored.d.scale,first.d.scale);assert.equal(restored.d.placementFingerprint,first.d.placementFingerprint);
  assert.ok(restored.cacheKeys.some(k=>k.startsWith('13/'))&&restored.cacheKeys.some(k=>k.startsWith('14/')));
  report.checks.push('real-z14-z13-z14-requests-canonical-coordinates-and-separated-cache');
  for(let i=0;i<4;i++)await click(p,true);const high=await checkFrame(p,14);near(high.d.zoom,4);
  assert.ok(report.requests.every(r=>r.z<=14));report.checks.push('provider-maximum-no-z15-requests');await p.close();

  const race=await open();await race.evaluate(()=>PixelMapIllustratedApp.cache.clear());
  let release,entered;const gate=new Promise(r=>release=r),seen=new Promise(r=>entered=r);
  await race.route('**/*.pbf',async r=>{if(tileZ(r.request().url())===13){entered();await gate;}await r.continue();});
  await race.locator('[data-zoom-out]').click();await seen;await race.waitForFunction(()=>PixelMapIllustratedStudy.loading);
  const during=await read(race);assert.equal(during.d.dataZoom,14);assert.equal(during.d.requestedDataZoom,13);assert.deepEqual(during.featureZooms,[14]);
  await click(race,true);await checkFrame(race,14);release();
  await race.waitForFunction(()=>PixelMapIllustratedApp.pending.size===0);await checkFrame(race,14);
  report.checks.push('late-z13-response-cannot-replace-newer-z14-frame');await race.unroute('**/*.pbf');

  // Fail just one of several z13 tiles. The completed z13 tiles must not replace
  // any part of the old z14 scene; a source change is committed atomically.
  await race.evaluate(()=>PixelMapIllustratedApp.cache.clear());let failedOne=false;
  await race.route('**/*.pbf',r=>{if(tileZ(r.request().url())===13&&!failedOne){failedOne=true;return r.fulfill({status:503,body:'unavailable'});}return r.continue();});
  const old=await read(race);await click(race,false);await race.locator('[data-map-retry]').waitFor({state:'visible'});
  const failed=await read(race);assert.ok(failedOne&&failed.d.failedTileCount===1);assert.ok(failed.d.tileCount>1);
  assert.equal(failed.d.dataZoom,14);assert.deepEqual(failed.featureZooms,[14]);near(failed.d.scale,old.d.scale);
  assert.equal(failed.d.placementFingerprint,old.d.placementFingerprint);
  await race.unroute('**/*.pbf');await click(race,false);await checkFrame(race,13);
  report.checks.push('partial-new-zoom-failure-preserves-old-frame-then-recovers');await race.close();
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(output,'source-zoom-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checks:report.checks,requestedZooms:[...new Set(report.requests.map(r=>r.z))],frames:report.frames.length,output},null,2));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
