import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {ANGLES,GEOMETRY,PALETTE} from '../tools/bridge-direction-core.mjs';
import {
  assetFileNames,
  buildDirectionalAssets,
  checkDirectionalAssets,
  writeDirectionalAssets,
} from '../tools/generate-bridge-directions.mjs';
import {decodePng} from '../tools/rgba-png.mjs';

const expectedSprites=ANGLES.map(angle=>`bridge-${String(angle).padStart(3,'0')}.png`);

test('asset bundleは12方向・sheet・manifestだけを決定的に生成する',()=>{
  const first=buildDirectionalAssets();
  const second=buildDirectionalAssets();
  assert.deepEqual(assetFileNames(),[
    ...expectedSprites,'bridge-direction-sheet.png','bridge-direction-manifest.json',
  ]);
  assert.deepEqual([...first.keys()],assetFileNames());
  for(const name of assetFileNames()) assert.deepEqual(first.get(name),second.get(name),name);
});

test('個別PNGとmanifestが寸法・alpha・パレット・接地点契約を満たす',()=>{
  const assets=buildDirectionalAssets();
  const manifest=JSON.parse(assets.get('bridge-direction-manifest.json').toString('utf8'));
  assert.equal(manifest.schema,'pixelmap-directional-bridge/1');
  assert.deepEqual(manifest.canvas,GEOMETRY.canvas);
  assert.deepEqual(manifest.anchor,GEOMETRY.anchor);
  assert.equal(manifest.projection,'screen-vertical');
  assert.equal(manifest.lighting,'screen-top-left');
  assert.deepEqual(manifest.sprites.map(sprite=>sprite.angle),ANGLES);
  const paletteRgb=new Set(Object.values(PALETTE).map(color=>color.slice(1)));
  for(const sprite of manifest.sprites){
    assert.ok(sprite.details.masonryJointPixels>=6);
    assert.ok(sprite.details.capstoneJointPixels>=6);
    assert.ok(sprite.details.parapetPostPixels>=8);
    assert.ok(sprite.details.roadPavingPixels>=20);
    const decoded=decodePng(assets.get(sprite.file));
    assert.deepEqual({width:decoded.width,height:decoded.height},GEOMETRY.canvas);
    const seen=new Set();
    for(let index=0;index<decoded.data.length;index+=4){
      const alpha=decoded.data[index+3];
      assert.ok(alpha===0||alpha===255);
      if(alpha===255) seen.add([decoded.data[index],decoded.data[index+1],decoded.data[index+2]]
        .map(value=>value.toString(16).padStart(2,'0')).join(''));
    }
    for(const color of seen) assert.ok(paletteRgb.has(color),`${sprite.file}: ${color}`);
    assert.ok(sprite.bounds.width>0&&sprite.bounds.height>0);
  }
});

test('比較シートは6列2行の原寸・4倍確認領域を持つ',()=>{
  const assets=buildDirectionalAssets();
  const sheet=decodePng(assets.get('bridge-direction-sheet.png'));
  assert.deepEqual({width:sheet.width,height:sheet.height},{width:3000,height:824});
});

test('一時出力は全件生成後にcheckでき差分を検出する',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pixelmap-bridge-assets-'));
  const output=join(root,'directional');
  try{
    await writeDirectionalAssets(output);
    assert.equal(await checkDirectionalAssets(output),true);
    await writeFile(join(output,'bridge-000.png'),Buffer.from('stale'));
    await assert.rejects(()=>checkDirectionalAssets(output),/一致しません/);
  }finally{
    await rm(root,{recursive:true,force:true});
  }
});

test('repositoryの生成物がgeneratorと同期している',async()=>{
  const output=new URL('../assets/bridge-study/directional/',import.meta.url);
  assert.equal(await checkDirectionalAssets(output),true);
  const manifest=JSON.parse(await readFile(new URL('bridge-direction-manifest.json',output),'utf8'));
  assert.equal(manifest.sprites.length,12);
});
