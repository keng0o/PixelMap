import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {decodePng} from '../tools/rgba-png.mjs';
import {
  outputFileNames,
  buildBridgeImage,
  buildComponentSheet,
  writeComponentSheet,
  checkComponentSheet,
} from '../tools/generate-bridge-component-sheet.mjs';

test('V2原寸橋は透明画素と不透明構造を両方持つ',()=>{
  for(const angle of [0,30,45,60,135]){
    const image=buildBridgeImage(angle);
    let transparent=0,opaque=0;
    for(let index=3;index<image.data.length;index+=4){
      if(image.data[index]===0) transparent++;
      if(image.data[index]===255) opaque++;
    }
    assert.ok(transparent>0,`${angle}: transparent`);
    assert.ok(opaque>100,`${angle}: opaque`);
  }
});

test('生成対象は36方向をまとめた比較シート1枚だけである',()=>{
  assert.deepEqual(outputFileNames(),['bridge-component-sheet.png']);
  assert.equal(outputFileNames().some(name=>/^bridge-\d{3}\.png$/.test(name)),false);
  assert.equal(outputFileNames().some(name=>name.endsWith('.json')),false);
});

test('比較シートは6列6行・3000×2472pxで決定的に生成する',()=>{
  const first=buildComponentSheet();
  const second=buildComponentSheet();
  assert.deepEqual(first,second);
  const decoded=decodePng(first);
  assert.deepEqual({width:decoded.width,height:decoded.height},{width:3000,height:2472});
  for(let index=3;index<decoded.data.length;index+=4) assert.equal(decoded.data[index],255);
});

test('一時出力をcheckでき1px差分を検出する',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pixelmap-bridge-component-sheet-'));
  const file=join(root,'sheet.png');
  try{
    await writeComponentSheet(file);
    assert.equal(await checkComponentSheet(file),true);
    const bytes=Buffer.from(await readFile(file));
    bytes[bytes.length-1]^=1;
    await writeFile(file,bytes);
    await assert.rejects(()=>checkComponentSheet(file),/一致しません/);
  }finally{
    await rm(root,{recursive:true,force:true});
  }
});

test('repositoryの単一比較シートがgeneratorと同期する',async()=>{
  const file=new URL('../assets/bridge-study/bridge-component-sheet.png',import.meta.url);
  assert.equal(await checkComponentSheet(file),true);
});
