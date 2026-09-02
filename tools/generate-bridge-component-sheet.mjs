import {createRequire} from 'node:module';
import {mkdir,mkdtemp,readFile,rename,rm,writeFile} from 'node:fs/promises';
import {basename,dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

import {blit,createSurface,fillRect,putPixel,scaleNearest} from './pixel-raster.mjs';
import {encodePng} from './rgba-png.mjs';

const require=createRequire(import.meta.url);
const core=require('../assets/bridge-component-core.js');

const SHEET=Object.freeze({columns:6,rows:6,cellWidth:500,cellHeight:412,width:3000,height:2472});
const COLORS=Object.freeze({
  background:'#edf0f2',checkerLight:'#ffffff',checkerDark:'#dfe3e6',line:'#c6ccd2',label:'#2b292e',
});
const DIGITS=Object.freeze({
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
});
const DEFAULT_OUTPUT=new URL('../assets/bridge-study/bridge-component-sheet.png',import.meta.url);

export function outputFileNames(){
  return ['bridge-component-sheet.png'];
}

function drawChecker(surface,x,y,width,height,size){
  fillRect(surface,x,y,width,height,COLORS.checkerLight);
  for(let py=0;py<height;py+=size) for(let px=0;px<width;px+=size){
    if((Math.floor(px/size)+Math.floor(py/size))%2===0) continue;
    fillRect(surface,x+px,y+py,Math.min(size,width-px),Math.min(size,height-py),COLORS.checkerDark);
  }
}

function drawDigits(surface,text,x,y,scale=2){
  let cursor=x;
  for(const character of text){
    const glyph=DIGITS[character];
    if(!glyph) throw new Error(`角度ラベルに未対応の文字です: ${character}`);
    for(let row=0;row<glyph.length;row++) for(let column=0;column<glyph[row].length;column++){
      if(glyph[row][column]==='1') fillRect(surface,cursor+column*scale,y+row*scale,scale,scale,COLORS.label);
    }
    cursor+=6*scale;
  }
}

export function buildBridgeImage(angle){
  const composition=core.composeStrict({
    id:`sheet-${angle}`,screenAngle:angle,length:48,masonryWidth:28,roadWidth:18,
    family:'stoneArch',material:'stone',carry:'road',crossing:'water',
    classificationSource:'explicit',detailLevel:'medium',patternSeed:'sheet-v3-canonical',
  });
  const centerX=composition.bounds.x+(composition.bounds.width-1)/2;
  const centerY=composition.bounds.y+(composition.bounds.height-1)/2;
  const placed=core.placeComposition(composition,Math.round(47.5-centerX),Math.round(47.5-centerY),
    {x:0,y:0,width:96,height:96});
  if(placed.diagnostics.clippedPixels!==0) throw new Error(`${angle}度の橋が96px確認領域から切れています`);
  const image=createSurface(96,96);
  for(const operation of [...placed.underlay,...placed.surface,...placed.overlay])
    putPixel(image,operation.x,operation.y,operation.color);
  for(const point of placed.openingMask){
    const alpha=image.data[(point.y*image.width+point.x)*4+3];
    if(alpha!==0) throw new Error(`${angle}度の透明アーチ開口が不透明画素で埋まっています`);
  }
  return image;
}

function sheetSurface(){
  const sheet=createSurface(SHEET.width,SHEET.height,COLORS.background);
  for(let index=0;index<core.angles.length;index++){
    const angle=core.angles[index];
    const column=index%SHEET.columns;
    const row=Math.floor(index/SHEET.columns);
    const cellX=column*SHEET.cellWidth;
    const cellY=row*SHEET.cellHeight;
    if(column>0) fillRect(sheet,cellX,cellY,1,SHEET.cellHeight,COLORS.line);
    if(row>0) fillRect(sheet,cellX,cellY,SHEET.cellWidth,1,COLORS.line);
    drawDigits(sheet,String(angle).padStart(3,'0'),cellX+8,cellY+3,2);
    drawChecker(sheet,cellX+8,cellY+20,96,96,8);
    drawChecker(sheet,cellX+108,cellY+20,384,384,16);
    const image=buildBridgeImage(angle);
    blit(sheet,image,cellX+8,cellY+20);
    blit(sheet,scaleNearest(image,4),cellX+108,cellY+20);
  }
  return sheet;
}

export function buildComponentSheet(){
  return encodePng(sheetSurface());
}

function destinationPath(destination=DEFAULT_OUTPUT){
  if(destination instanceof URL) return fileURLToPath(destination);
  return resolve(String(destination));
}

export async function writeComponentSheet(destination=DEFAULT_OUTPUT){
  const target=destinationPath(destination);
  await mkdir(dirname(target),{recursive:true});
  const temporaryDirectory=await mkdtemp(join(dirname(target),'.bridge-component-sheet-'));
  const temporaryFile=join(temporaryDirectory,basename(target));
  try{
    await writeFile(temporaryFile,buildComponentSheet());
    await rename(temporaryFile,target);
  }finally{
    await rm(temporaryDirectory,{recursive:true,force:true});
  }
  return target;
}

export async function checkComponentSheet(destination=DEFAULT_OUTPUT){
  const target=destinationPath(destination);
  let actual;
  try{actual=await readFile(target);}
  catch{throw new Error(`比較シートがありません: ${target}`);}
  const expected=buildComponentSheet();
  if(!actual.equals(expected)) throw new Error(`比較シートがgeneratorと一致しません: ${target}`);
  return true;
}

function parseArgs(args){
  let output=DEFAULT_OUTPUT;
  let check=false;
  for(let index=0;index<args.length;index++){
    if(args[index]==='--check') check=true;
    else if(args[index]==='--output'){
      if(!args[index+1]) throw new Error('--outputにはファイルパスが必要です');
      output=args[++index];
    }else throw new Error(`未知の引数です: ${args[index]}`);
  }
  return {output,check};
}

const isMain=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(isMain){
  const {output,check}=parseArgs(process.argv.slice(2));
  if(check){
    await checkComponentSheet(output);
    console.log(`Bridge component sheet is current: ${destinationPath(output)}`);
  }else{
    const target=await writeComponentSheet(output);
    console.log(`Generated one 36-direction bridge component sheet: ${target}`);
  }
}
