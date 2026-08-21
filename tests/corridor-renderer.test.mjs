import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window=globalThis;
await import('../assets/corridor-renderer.js');

const renderer=globalThis.PixelMapCorridorRenderer;
const set=(mask,width,x,y)=>{mask[y*width+x]=1;};

test('mask交差は太い重なりを1つのlevel crossing pointへ集約する',()=>{
  assert.equal(renderer.version,'pixelmap-corridor-renderer/3');
  const width=12,height=12,road=new Uint8Array(width*height),rail=new Uint8Array(width*height);
  for(let x=1;x<11;x++) for(const y of [5,6]) set(road,width,x,y);
  for(let y=1;y<11;y++) for(const x of [5,6]) set(rail,width,x,y);
  assert.deepEqual(renderer.findMaskIntersections(road,rail,width,height),[
    {x:6,y:6,pixels:4},
  ]);
});

test('RailSkinの8px路盤テクスチャをcontinuous mask内部だけへ描く',()=>{
  const width=8,height=8,size=width*height;
  const body=new Uint8Array(size).fill(1);
  const target={
    canvas:{width,height},image:null,
    createImageData:()=>({data:new Uint8ClampedArray(size*4)}),
    putImageData(image){this.image=image;},
  };
  renderer.render(target,{
    width,height,features:[],preparedMasks:{
      body,outer:body.slice(),center:new Uint8Array(size),centerPhase:new Uint32Array(size),
    },
    style:{
      width:8,edgeWidth:0,fill:'#a8a098',pattern:'rail',rail:'#404048',tie:'#786048',
      bedTexture:{
        period:8,dark:'#888078',light:'#c0b8b0',
        darkPixels:[[1,2]],lightPixels:[[6,1]],
      },
    },
  });
  const rgb=(x,y)=>[...target.image.data.slice((y*width+x)*4,(y*width+x)*4+3)];
  assert.deepEqual(rgb(0,0),[168,160,152]);
  assert.deepEqual(rgb(1,2),[136,128,120]);
  assert.deepEqual(rgb(6,1),[192,184,176]);
});

test('離れた交差は別点、近すぎる交差componentはminimumSpacingで安定統合する',()=>{
  const width=20,height=8,road=new Uint8Array(width*height),rail=new Uint8Array(width*height);
  for(let x=0;x<width;x++) set(road,width,x,4);
  for(const x of [3,7,16]) for(let y=0;y<height;y++) set(rail,width,x,y);
  assert.deepEqual(renderer.findMaskIntersections(road,rail,width,height,{minimumSpacing:6}),[
    {x:3,y:4,pixels:1},{x:16,y:4,pixels:1},
  ]);
  assert.throws(()=>renderer.findMaskIntersections(road,new Uint8Array(3),width,height),/must match/);
});
