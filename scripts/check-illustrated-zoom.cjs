// Browser zoom, multi-touch, and asynchronous camera regression checks.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = (process.env.PIXELMAP_BASE_URL || 'http://127.0.0.1:8766').replace(/\/$/,'');
const output = process.env.PIXELMAP_QA_OUTPUT || '/tmp/pixelmap-illustrated-zoom';
const route = '/variants/map-12-illustrated-landscape.html';
const read = p => p.evaluate(()=>({...PixelMapIllustratedStudy,transform:document.querySelector('canvas').style.transform,
  paintedScale:PixelMapIllustratedApp.getScene().viewport.scale}));
const settle = p => p.waitForFunction(()=>window.PixelMapIllustratedApp && PixelMapIllustratedStudy.mapReady &&
  !PixelMapIllustratedStudy.loading && !PixelMapIllustratedStudy.interacting,null,{timeout:60000});
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const world = (v,p,w=736,h=952) => ({x:v.centerX+(p.x-w/2)/v.scale,y:v.centerY+(p.y-h/2)/v.scale});
async function run() {
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const report = {base,checks:[],screenshots:[]};
  const errors = [];
  const open = async (query='?scene=fixture',mobile=false) => {
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:736,height:952},
      deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base+route+query);await settle(page);return page;
  };
  const snap = async (p,name) => {
    await settle(p); const d=await read(p);near(d.scale,d.paintedScale);assert.equal(d.transform,'');assert.equal(d.failedTileCount,0);
    await p.screenshot({path:path.join(output,name+'.png')});report.screenshots.push({name,diagnostics:d});
  };
  const button = async (p,inward) => {await p.locator(inward?'[data-zoom-in]':'[data-zoom-out]').click();await settle(p);};
  const limit = async (p,inward) => {for(let i=0;i<8;i++){if(await p.locator(inward?'[data-zoom-in]':'[data-zoom-out]').isDisabled())return;await button(p,inward);}throw Error('Zoom limit did not disable button');};
  try {
    const p=await open();let a=await read(p);const anchor={x:103,y:229};const fixed=world(a,anchor);
    await p.mouse.move(anchor.x,anchor.y);await p.mouse.wheel(0,-240);await settle(p);let b=await read(p);
    near(b.zoom,Math.exp(.48));near(world(b,anchor).x,fixed.x);near(world(b,anchor).y,fixed.y);
    await p.mouse.wheel(0,240);await settle(p);b=await read(p);near(b.zoom,1);near(b.centerX,a.centerX);near(b.centerY,a.centerY);
    report.checks.push('wheel-anchor-and-inverse');
    await p.locator('canvas').focus();await p.keyboard.press('=');await settle(p);near((await read(p)).zoom,Math.SQRT2);
    await p.keyboard.press('-');await settle(p);near((await read(p)).zoom,1);
    await limit(p,true);a=await read(p);near(a.zoom,4);await snap(p,'fixture-zoom-4');
    await p.mouse.move(103,229);await p.mouse.wheel(0,-500);await settle(p);b=await read(p);near(b.centerX,a.centerX);near(b.centerY,a.centerY);
    await limit(p,false);near((await read(p)).zoom,.5);await snap(p,'fixture-zoom-05');
    report.checks.push('buttons-keyboard-limits-no-drift');
    await button(p,true);a=await read(p);await p.mouse.move(300,400);await p.mouse.down();await p.mouse.move(340,430,{steps:5});await p.mouse.up();await settle(p);b=await read(p);
    near(b.centerX,a.centerX-40/a.scale);near(b.centerY,a.centerY-30/a.scale);near(b.zoom,a.zoom);
    await p.setViewportSize({width:600,height:800});await settle(p);b=await read(p);near(b.zoom,a.zoom);near(b.centerX,a.centerX-40/a.scale);
    report.checks.push('zoomed-pan-and-fixture-resize');await p.close();

    const mobile=await open('?lat=35.611&lon=139.573',true);const cdp=await mobile.context().newCDPSession(mobile);
    const point=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2,force:1});
    const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
    a=await read(mobile);const touchWorld=world(a,{x:190,y:400},390,844);
    await touch('touchStart',[point(1,150,400),point(2,230,400)]);
    await touch('touchMove',[point(1,140,410),point(2,280,410)]);
    b=await read(mobile);near(b.zoom,1.75);near(world(b,{x:210,y:410},390,844).x,touchWorld.x);near(world(b,{x:210,y:410},390,844).y,touchWorld.y);
    assert.notEqual(b.transform,'');
    // Chrome emits pointerup for the point supplied to this partial touchEnd;
    // keep finger 2 down, then end the entire sequence with an empty array.
    await touch('touchEnd',[point(1,140,410)]);a=await read(mobile);near(a.centerX,b.centerX);
    await touch('touchMove',[point(2,310,430)]);await touch('touchEnd',[]);await settle(mobile);b=await read(mobile);
    near(b.zoom,1.75);near(b.centerX,a.centerX-30/a.scale);near(b.centerY,a.centerY-20/a.scale);
    await snap(mobile,'green-mobile-pinch');report.checks.push('cdp-pinch-anchor-and-single-finger-continuation');
    await touch('touchStart',[point(1,150,400),point(2,230,400)]);await touch('touchMove',[point(1,140,400),point(2,240,400)]);
    await touch('touchCancel',[]);await settle(mobile);assert.equal((await read(mobile)).transform,'');
    await button(mobile,false);report.checks.push('touch-cancel-and-subsequent-button');
    await limit(mobile,false);await snap(mobile,'green-mobile-zoom-05');
    await limit(mobile,true);await snap(mobile,'green-mobile-zoom-4');
    const controls=await mobile.locator('[data-map-zoom] button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));
    assert.ok(controls.every(r=>r.width>=44 && r.height>=44 && r.x>=0 && r.x+r.width<=390 && r.y+r.height<844));
    await mobile.context().grantPermissions(['geolocation']);await mobile.context().setGeolocation({latitude:35.531,longitude:139.702});
    await mobile.locator('[data-current-location]').click();await mobile.waitForFunction(()=>!document.querySelector('[data-current-location]').disabled);await settle(mobile);
    b=await read(mobile);near(b.zoom,4);const expected=await mobile.evaluate(()=>PixelMapTopDownMap.lonLatToWorld(139.702,35.531));near(b.centerX,expected.x);near(b.centerY,expected.y);
    report.checks.push('mobile-controls-and-location-preserves-zoom');await mobile.close();

    for(const [name,query] of [['city','?lat=35.531&lon=139.702'],['river','?lat=35.5536&lon=139.7013']]) {
      const p=await open(query);await limit(p,false);await snap(p,name+'-zoom-05');await limit(p,true);await snap(p,name+'-zoom-4');await p.close();
    }

    const race=await open('?lat=35.611&lon=139.573');await race.evaluate(()=>PixelMapIllustratedApp.cache.clear());
    let release;const gate=new Promise(r=>release=r);let blocked=0;
    await race.route('**/*.pbf',async r=>{blocked++;await gate;await r.continue();});
    await race.locator('[data-zoom-out]').click();await race.waitForFunction(()=>PixelMapIllustratedStudy.loading);
    // Interrupt a pending load with a click that does not move the camera.
    await race.mouse.move(150,300);await race.mouse.down();await race.mouse.up();
    await race.locator('[data-zoom-in]').click();await race.waitForFunction(()=>PixelMapIllustratedStudy.loading);
    assert.ok(blocked>0);release();await settle(race);b=await read(race);near(b.zoom,1);near(b.scale,b.paintedScale);assert.equal(b.failedTileCount,0);
    report.checks.push('pending-tiles-click-and-newer-zoom-wins');await race.unroute('**/*.pbf');
    a=await read(race);await race.evaluate(()=>PixelMapIllustratedApp.cache.clear());await race.route('**/*.pbf',r=>r.fulfill({status:503,body:'unavailable'}));
    await button(race,false);await race.locator('[data-map-retry]').waitFor({state:'visible'});b=await read(race);
    near(b.scale,a.scale);near(b.centerX,a.centerX);near(b.centerY,a.centerY);assert.ok(b.mapReady);assert.equal(b.transform,'');
    await race.unroute('**/*.pbf');await race.locator('[data-map-retry]').click();await settle(race);assert.equal((await read(race)).failedTileCount,0);
    report.checks.push('zoom-network-failure-restores-last-good-and-retry');await race.close();
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'zoom-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({checks:report.checks,screenshots:report.screenshots.length,output},null,2));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
