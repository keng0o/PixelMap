import {mkdir,mkdtemp,readFile,readdir,rename,rm,writeFile} from 'node:fs/promises';
import {basename,dirname,parse,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

import {ANGLES,GEOMETRY,PALETTE,renderBridge} from './bridge-direction-core.mjs';
import {blit,createSurface,fillRect,scaleNearest} from './pixel-raster.mjs';
import {decodePng,encodePng} from './rgba-png.mjs';

const SHEET={columns:6,rows:2,cellWidth:500,cellHeight:412,width:3000,height:824};
const SHEET_COLORS={background:'#edf0f2',checkerLight:'#ffffff',checkerDark:'#dfe3e6',line:'#c6ccd2',label:'#2b292e'};
const DIGITS={
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],
  '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'],
  '5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'],
  '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'],
  '9':['01110','10001','10001','01111','00001','00001','01110'],
};

const spriteName=angle=>`bridge-${String(angle).padStart(3,'0')}.png`;

export function assetFileNames(){
  return [...ANGLES.map(spriteName),'bridge-direction-sheet.png','bridge-direction-manifest.json'];
}

function drawChecker(surface,x,y,width,height,size){
  fillRect(surface,x,y,width,height,SHEET_COLORS.checkerLight);
  for(let py=0;py<height;py+=size){
    for(let px=0;px<width;px+=size){
      if((Math.floor(px/size)+Math.floor(py/size))%2===0) continue;
      fillRect(surface,x+px,y+py,Math.min(size,width-px),Math.min(size,height-py),SHEET_COLORS.checkerDark);
    }
  }
}

function drawDigits(surface,text,x,y,scale=2){
  let cursor=x;
  for(const character of text){
    const glyph=DIGITS[character];
    if(!glyph) throw new Error(`角度ラベルに未対応の文字です: ${character}`);
    for(let row=0;row<glyph.length;row++){
      for(let column=0;column<glyph[row].length;column++){
        if(glyph[row][column]==='1') fillRect(surface,cursor+column*scale,y+row*scale,scale,scale,SHEET_COLORS.label);
      }
    }
    cursor+=(5+1)*scale;
  }
}

function buildSheet(images){
  const sheet=createSurface(SHEET.width,SHEET.height,SHEET_COLORS.background);
  for(let index=0;index<images.length;index++){
    const column=index%SHEET.columns;
    const row=Math.floor(index/SHEET.columns);
    const cellX=column*SHEET.cellWidth;
    const cellY=row*SHEET.cellHeight;
    if(column>0) fillRect(sheet,cellX,cellY,1,SHEET.cellHeight,SHEET_COLORS.line);
    if(row>0) fillRect(sheet,cellX,cellY,SHEET.cellWidth,1,SHEET_COLORS.line);
    drawDigits(sheet,String(images[index].meta.angle).padStart(3,'0'),cellX+8,cellY+3,2);
    drawChecker(sheet,cellX+8,cellY+20,96,96,8);
    drawChecker(sheet,cellX+108,cellY+20,384,384,16);
    blit(sheet,images[index],cellX+8,cellY+20);
    blit(sheet,scaleNearest(images[index],4),cellX+108,cellY+20);
  }
  return sheet;
}

function validateSprite(image,file){
  if(image.width!==GEOMETRY.canvas.width||image.height!==GEOMETRY.canvas.height)
    throw new Error(`${file}の寸法が契約と一致しません`);
  const allowed=new Set(Object.values(PALETTE).map(color=>color.slice(1)));
  for(let index=0;index<image.data.length;index+=4){
    const alpha=image.data[index+3];
    if(alpha!==0&&alpha!==255) throw new Error(`${file}に半透明画素があります`);
    if(alpha===0) continue;
    const color=[image.data[index],image.data[index+1],image.data[index+2]]
      .map(value=>value.toString(16).padStart(2,'0')).join('');
    if(!allowed.has(color)) throw new Error(`${file}に未定義色があります: #${color}`);
  }
  if(image.meta.bounds.width<=0||image.meta.bounds.height<=0)
    throw new Error(`${file}に不透明画素がありません`);
  if(image.meta.bounds.x<0||image.meta.bounds.y<0||
      image.meta.bounds.x+image.meta.bounds.width>image.width||
      image.meta.bounds.y+image.meta.bounds.height>image.height)
    throw new Error(`${file}の不透明画素がキャンバス外です`);
}

export function buildDirectionalAssets(){
  const assets=new Map();
  const images=[];
  const sprites=[];
  for(const angle of ANGLES){
    const image=renderBridge(angle);
    const file=spriteName(angle);
    validateSprite(image,file);
    const png=encodePng(image);
    const decoded=decodePng(png);
    if(decoded.width!==image.width||decoded.height!==image.height||
        !Buffer.from(decoded.data).equals(Buffer.from(image.data)))
      throw new Error(`${file}のPNG読み戻し結果が一致しません`);
    assets.set(file,png);
    images.push(image);
    sprites.push({
      angle,
      file,
      bounds:image.meta.bounds,
      opaquePixels:image.meta.stats.opaquePixels,
      archPixels:image.meta.stats.archPixels,
      details:image.meta.stats.details,
      visibleEdges:image.meta.visibleEdges,
    });
  }
  assets.set('bridge-direction-sheet.png',encodePng(buildSheet(images)));
  const manifest={
    schema:'pixelmap-directional-bridge/1',
    canvas:{...GEOMETRY.canvas},
    anchor:{...GEOMETRY.anchor},
    geometry:{
      length:GEOMETRY.length,
      masonryWidth:GEOMETRY.masonryWidth,
      roadWidth:GEOMETRY.roadWidth,
      parapetThickness:GEOMETRY.parapetThickness,
      parapetHeight:GEOMETRY.parapetHeight,
      wallDepth:GEOMETRY.wallDepth,
      archCount:GEOMETRY.archCount,
      archWidth:GEOMETRY.archWidth,
      archHeight:GEOMETRY.archHeight,
      abutmentLength:GEOMETRY.abutmentLength,
    },
    projection:'screen-vertical',
    lighting:'screen-top-left',
    palette:{...PALETTE},
    sprites,
  };
  assets.set('bridge-direction-manifest.json',Buffer.from(`${JSON.stringify(manifest,null,2)}\n`));
  return assets;
}

function outputPath(value){
  const path=value instanceof URL?fileURLToPath(value):resolve(String(value));
  if(path===parse(path).root) throw new Error('filesystem rootは出力先に指定できません');
  return path;
}

export async function checkDirectionalAssets(value){
  const output=outputPath(value);
  const expected=buildDirectionalAssets();
  let names;
  try{names=(await readdir(output)).sort();}
  catch(error){throw new Error(`方向別素材の出力先を読めません: ${error.message}`);}
  const expectedNames=assetFileNames().slice().sort();
  if(names.length!==expectedNames.length||names.some((name,index)=>name!==expectedNames[index]))
    throw new Error('方向別素材のファイル集合がgeneratorと一致しません');
  for(const [name,content] of expected){
    const actual=await readFile(resolve(output,name));
    if(!actual.equals(content)) throw new Error(`${name}がgeneratorの出力と一致しません`);
  }
  return true;
}

export async function writeDirectionalAssets(value){
  const output=outputPath(value);
  const parent=dirname(output);
  await mkdir(parent,{recursive:true});
  const staging=await mkdtemp(resolve(parent,`.${basename(output)}-build-`));
  const backup=resolve(parent,`.${basename(output)}-backup-${process.pid}`);
  let movedExisting=false;
  try{
    for(const [name,content] of buildDirectionalAssets()) await writeFile(resolve(staging,name),content);
    await checkDirectionalAssets(staging);
    try{
      await rename(output,backup);
      movedExisting=true;
    }catch(error){
      if(error.code!=='ENOENT') throw error;
    }
    try{await rename(staging,output);}
    catch(error){
      if(movedExisting) await rename(backup,output);
      throw error;
    }
    if(movedExisting) await rm(backup,{recursive:true,force:true});
  }catch(error){
    await rm(staging,{recursive:true,force:true});
    throw error;
  }
  return output;
}

async function main(){
  const args=process.argv.slice(2);
  let output=fileURLToPath(new URL('../assets/bridge-study/directional/',import.meta.url));
  let check=false;
  for(let index=0;index<args.length;index++){
    if(args[index]==='--check') check=true;
    else if(args[index]==='--output'){
      if(!args[index+1]) throw new Error('--outputには出力先が必要です');
      output=args[++index];
    }else throw new Error(`未知の引数です: ${args[index]}`);
  }
  if(check){
    await checkDirectionalAssets(output);
    console.log(`Directional bridge assets are current: ${outputPath(output)}`);
  }else{
    await writeDirectionalAssets(output);
    console.log(`Generated ${ANGLES.length} directional bridge sprites: ${outputPath(output)}`);
  }
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
