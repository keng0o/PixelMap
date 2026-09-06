// Small art-direction rounds; use the full regression suite for the final release.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PIXELMAP_BASE_URL||'http://127.0.0.1:8766',out=process.env.PIXELMAP_QA_OUTPUT||'/tmp/illustrated-world';
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const report=[];
 try {
  for(const [name,query,mobile] of [['fixture','scene=fixture'],['green','lat=35.611&lon=139.573'],['river','lat=35.5536&lon=139.7013'],['city','lat=35.531&lon=139.702'],['fixture-mobile','scene=fixture',true],['green-mobile','lat=35.611&lon=139.573',true]]){
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:736,height:952},deviceScaleFactor:mobile?2:1});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'/variants/map-12-illustrated-landscape.html?'+query);
   await page.waitForFunction(()=>window.PixelMapIllustratedApp&&PixelMapIllustratedStudy.mapReady,null,{timeout:60000});
   const d=await page.evaluate(()=>PixelMapIllustratedStudy);assert.equal(d.failedTileCount,0);assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(out,name+'.png')});report.push({name,diagnostics:d});await page.close();
  }
  await fs.writeFile(path.join(out,'art-round.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({screenshots:report.length,output:out}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
