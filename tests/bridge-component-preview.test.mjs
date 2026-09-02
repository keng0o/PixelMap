import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const preview=require('../assets/bridge-component-preview.js');

test('preview APIはV2である',()=>{
  assert.equal(preview.version,'pixelmap-bridge-component-preview/2');
});

test('bridge-componentsだけを単体研究modeとして認識する',()=>{
  assert.equal(preview.isRequested('?render=bridge-components'),true);
  assert.equal(preview.isRequested('?render=cell2'),false);
  assert.equal(preview.isRequested('?render=cell3'),false);
  assert.equal(preview.isRequested('?render=unknown'),false);
});

test('URLから5度角度・整数寸法・LOD・背景を読み正規化する',()=>{
  assert.deepEqual(preview.parseState('?render=bridge-components&angle=47&length=76&width=30&roadWidth=20&debug=components&detail=large&background=checker'),{
    angle:45,length:76,masonryWidth:30,roadWidth:20,debug:'components',detail:'large',background:'checker',
  });
  assert.deepEqual(preview.parseState('?render=bridge-components&angle=no&length=8&width=4&roadWidth=99&detail=bad&background=bad'),{
    angle:45,length:22,masonryWidth:10,roadWidth:4,debug:'none',detail:'auto',background:'water',
  });
});

test('角度stepは5度で0から175度を循環する',()=>{
  assert.equal(preview.stepAngle(45,1),50);
  assert.equal(preview.stepAngle(0,-1),175);
  assert.equal(preview.stepAngle(175,1),0);
});

test('正規化状態を再現可能なqueryへ保存する',()=>{
  const search=preview.stateSearch({
    angle:135,length:52,masonryWidth:22,roadWidth:14,debug:'none',detail:'medium',background:'ground',
  });
  assert.equal(search,'?render=bridge-components&angle=135&length=52&width=22&roadWidth=14&detail=medium&background=ground');
  assert.deepEqual(preview.parseState(search),{
    angle:135,length:52,masonryWidth:22,roadWidth:14,debug:'none',detail:'medium',background:'ground',
  });
});

test('幅変更時も路面を左右欄干の内側へclampする',()=>{
  assert.deepEqual(preview.normalizeState({angle:10,length:52,masonryWidth:16,roadWidth:20,debug:'none'}),{
    angle:10,length:52,masonryWidth:16,roadWidth:10,debug:'none',detail:'auto',background:'water',
  });
});
