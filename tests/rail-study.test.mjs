import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/rail-wiggle-study.html', import.meta.url), 'utf8');
const map = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('線路スタディはstandalone cell2と同じ正本・マスク・描画順を使う', () => {
  assert.match(html, /layer-assets\.js\?v=5/);
  assert.match(html, /continuous-rail-skin\.js\?v=1/);
  assert.match(html, /transportRules\.rail/);
  assert.match(html, /outputCellSize=2,gridSize=W\/outputCellSize,detailCellSpan=4/);
  assert.match(html, /walkFourConnectedGridLine/);
  assert.match(html, /finalizeContinuousRailSkin\(skin,\{offsetCells:1,tiePeriodCells:3,tieHalfSpanCells:2/);
  assert.match(html, /boundary\?railRule\.bedDark:railRule\.bed/);
  assert.match(html, /skin\.ties[\s\S]*?\[skin\.leftRail,skin\.rightRail\]/);
  assert.doesNotMatch(html, /ctx\.stroke\(|lineJoin|offsetRoute/);
  assert.match(map, /const RAIL_TIES = false/);
  assert.match(map, /\['bed','left-rail','right-rail'\]/);
});

test('共有線路マスクは斜め区間を4連結の左右レールへ変換する', async () => {
  globalThis.window = globalThis;
  await import('../assets/continuous-rail-skin.js');
  const api = globalThis.PixelMapContinuousRailSkin;
  assert.equal(api.version, 'pixelmap-continuous-rail-skin/1');
  const path=[];
  api.walkFourConnectedGridLine(32,4,4,18,18,(x,y)=>path.push([x,y]));
  const skin=api.createContinuousRailSkin(32);skin.sourcePaths.push(path);
  api.finalizeContinuousRailSkin(skin,{offsetCells:1,tiePeriodCells:3,tieHalfSpanCells:2,phaseAt:()=>0});
  const components=mask=>{
    const seen=new Uint8Array(mask.length);let count=0;
    for(let start=0;start<mask.length;start++)if(mask[start]&&!seen[start]){count++;const stack=[start];seen[start]=1;while(stack.length){const index=stack.pop(),x=index%32,y=Math.floor(index/32);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,next=ny*32+nx;if(nx>=0&&ny>=0&&nx<32&&ny<32&&mask[next]&&!seen[next]){seen[next]=1;stack.push(next)}}}}
    return count;
  };
  assert.equal(components(skin.leftRail),1);assert.equal(components(skin.rightRail),1);assert.ok(skin.tieCount>0);
});
