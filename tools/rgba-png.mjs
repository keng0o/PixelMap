import {constants,deflateSync,inflateSync} from 'node:zlib';

const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const CRC_TABLE=new Uint32Array(256);
for(let index=0;index<256;index++){
  let value=index;
  for(let bit=0;bit<8;bit++) value=(value&1)?0xedb88320^(value>>>1):value>>>1;
  CRC_TABLE[index]=value>>>0;
}

function crc32(buffer){
  let value=0xffffffff;
  for(const byte of buffer) value=CRC_TABLE[(value^byte)&0xff]^(value>>>8);
  return (value^0xffffffff)>>>0;
}

function chunk(type,data){
  const typeBuffer=Buffer.from(type,'ascii');
  const length=Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer,data])));
  return Buffer.concat([length,typeBuffer,data,crc]);
}

function assertImage({width,height,data}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)
    throw new Error('PNGの幅と高さは正の整数である必要があります');
  if(!(data instanceof Uint8Array)||data.length!==width*height*4)
    throw new Error('PNGのRGBA長が寸法と一致しません');
}

export function encodePng(image){
  assertImage(image);
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width,0);
  ihdr.writeUInt32BE(image.height,4);
  ihdr[8]=8;
  ihdr[9]=6;
  const rowLength=image.width*4;
  const raw=Buffer.alloc((rowLength+1)*image.height);
  for(let y=0;y<image.height;y++){
    const rowOffset=y*(rowLength+1);
    raw[rowOffset]=0;
    raw.set(image.data.subarray(y*rowLength,(y+1)*rowLength),rowOffset+1);
  }
  const compressed=deflateSync(raw,{level:9,strategy:constants.Z_DEFAULT_STRATEGY});
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR',ihdr),
    chunk('IDAT',compressed),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

export function decodePng(input){
  const buffer=Buffer.from(input);
  if(buffer.length<8||!buffer.subarray(0,8).equals(SIGNATURE)) throw new Error('PNG signatureが不正です');
  let offset=8;
  let width=null;
  let height=null;
  const idat=[];
  let sawEnd=false;
  while(offset<buffer.length){
    if(offset+12>buffer.length) throw new Error('PNG chunkが途中で終了しています');
    const length=buffer.readUInt32BE(offset);
    const type=buffer.subarray(offset+4,offset+8).toString('ascii');
    const dataStart=offset+8;
    const dataEnd=dataStart+length;
    if(dataEnd+4>buffer.length) throw new Error('PNG chunk長が不正です');
    const data=buffer.subarray(dataStart,dataEnd);
    const expected=buffer.readUInt32BE(dataEnd);
    const actual=crc32(Buffer.concat([Buffer.from(type,'ascii'),data]));
    if(actual!==expected) throw new Error(`${type} chunkのCRCが不正です`);
    if(type==='IHDR'){
      if(length!==13||data[8]!==8||data[9]!==6||data[10]!==0||data[11]!==0||data[12]!==0)
        throw new Error('対応していないPNG形式です');
      width=data.readUInt32BE(0);
      height=data.readUInt32BE(4);
    }else if(type==='IDAT') idat.push(data);
    else if(type==='IEND'){sawEnd=true;break;}
    offset=dataEnd+4;
  }
  if(!sawEnd||!Number.isInteger(width)||!Number.isInteger(height)||idat.length===0)
    throw new Error('PNG必須chunkがありません');
  const raw=inflateSync(Buffer.concat(idat));
  const rowLength=width*4;
  if(raw.length!==(rowLength+1)*height) throw new Error('PNG展開長が不正です');
  const result=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++){
    const rowOffset=y*(rowLength+1);
    if(raw[rowOffset]!==0) throw new Error('filter type 0以外は対応していません');
    result.set(raw.subarray(rowOffset+1,rowOffset+1+rowLength),y*rowLength);
  }
  return {width,height,data:result};
}
