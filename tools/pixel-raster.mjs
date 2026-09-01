export function hexToRgba(color){
  if(Array.isArray(color)||ArrayBuffer.isView(color)){
    const values=Array.from(color);
    if(values.length!==4||values.some(value=>!Number.isInteger(value)||value<0||value>255))
      throw new Error('RGBA色は0から255の4整数で指定してください');
    return values;
  }
  const match=String(color).trim().match(/^#([0-9a-f]{6})$/i);
  if(!match) throw new Error(`未対応の色です: ${color}`);
  return [0,2,4].map(index=>Number.parseInt(match[1].slice(index,index+2),16)).concat(255);
}

function assertSurface(surface){
  if(!surface||!Number.isInteger(surface.width)||!Number.isInteger(surface.height)||
      surface.width<=0||surface.height<=0)
    throw new Error('surfaceの幅と高さは正の整数である必要があります');
  if(!(surface.data instanceof Uint8Array)||surface.data.length!==surface.width*surface.height*4)
    throw new Error('surfaceのRGBA長が寸法と一致しません');
}

export function createSurface(width,height,background=null){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)
    throw new Error('surfaceの幅と高さは正の整数である必要があります');
  const surface={width,height,data:new Uint8Array(width*height*4)};
  if(background!==null) fillRect(surface,0,0,width,height,background);
  return surface;
}

export function putPixel(surface,x,y,color){
  assertSurface(surface);
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=surface.width||y>=surface.height)
    throw new Error(`描画座標が範囲外です: ${x},${y}`);
  const rgba=hexToRgba(color);
  surface.data.set(rgba,(y*surface.width+x)*4);
}

export function fillRect(surface,x,y,width,height,color){
  assertSurface(surface);
  if(![x,y,width,height].every(Number.isInteger)||width<0||height<0||
      x<0||y<0||x+width>surface.width||y+height>surface.height)
    throw new Error('矩形がsurface範囲外です');
  const rgba=hexToRgba(color);
  for(let py=y;py<y+height;py++){
    for(let px=x;px<x+width;px++) surface.data.set(rgba,(py*surface.width+px)*4);
  }
}

function pointInsidePolygon(x,y,points){
  let inside=false;
  for(let current=0,previous=points.length-1;current<points.length;previous=current++){
    const a=points[current];
    const b=points[previous];
    const crosses=(a.y>y)!==(b.y>y);
    if(crosses&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}

export function fillPolygon(surface,points,color){
  assertSurface(surface);
  if(!Array.isArray(points)||points.length<3||points.some(point=>
    !Number.isInteger(point?.x)||!Number.isInteger(point?.y)))
    throw new Error('ポリゴンは3点以上の整数座標で指定してください');
  const minX=Math.max(0,Math.min(...points.map(point=>point.x)));
  const maxX=Math.min(surface.width-1,Math.max(...points.map(point=>point.x)));
  const minY=Math.max(0,Math.min(...points.map(point=>point.y)));
  const maxY=Math.min(surface.height-1,Math.max(...points.map(point=>point.y)));
  const rgba=hexToRgba(color);
  for(let y=minY;y<=maxY;y++){
    for(let x=minX;x<=maxX;x++){
      if(pointInsidePolygon(x+0.5,y+0.5,points)) surface.data.set(rgba,(y*surface.width+x)*4);
    }
  }
}

export function supercoverPoints(from,to){
  if(!Number.isInteger(from?.x)||!Number.isInteger(from?.y)||
      !Number.isInteger(to?.x)||!Number.isInteger(to?.y))
    throw new Error('線分端点は整数座標で指定してください');
  const points=[];
  let x=from.x;
  let y=from.y;
  const dx=to.x-from.x;
  const dy=to.y-from.y;
  const nx=Math.abs(dx);
  const ny=Math.abs(dy);
  const signX=Math.sign(dx);
  const signY=Math.sign(dy);
  let ix=0;
  let iy=0;
  points.push({x,y});
  while(ix<nx||iy<ny){
    const decision=(1+2*ix)*ny-(1+2*iy)*nx;
    if(decision===0){x+=signX;y+=signY;ix++;iy++;}
    else if(decision<0){x+=signX;ix++;}
    else {y+=signY;iy++;}
    points.push({x,y});
  }
  return points;
}

export function drawSupercoverLine(surface,from,to,color){
  const points=supercoverPoints(from,to);
  for(const point of points) putPixel(surface,point.x,point.y,color);
  return points;
}

export function blit(target,source,offsetX,offsetY,{copyTransparent=false}={}){
  assertSurface(target);
  assertSurface(source);
  if(!Number.isInteger(offsetX)||!Number.isInteger(offsetY)||offsetX<0||offsetY<0||
      offsetX+source.width>target.width||offsetY+source.height>target.height)
    throw new Error('blit先がsurface範囲外です');
  for(let y=0;y<source.height;y++){
    for(let x=0;x<source.width;x++){
      const sourceIndex=(y*source.width+x)*4;
      if(!copyTransparent&&source.data[sourceIndex+3]===0) continue;
      const targetIndex=((offsetY+y)*target.width+offsetX+x)*4;
      target.data.set(source.data.subarray(sourceIndex,sourceIndex+4),targetIndex);
    }
  }
}

export function scaleNearest(source,factor){
  assertSurface(source);
  if(!Number.isInteger(factor)||factor<=0) throw new Error('拡大率は正の整数である必要があります');
  const target=createSurface(source.width*factor,source.height*factor);
  for(let y=0;y<target.height;y++){
    for(let x=0;x<target.width;x++){
      const sourceIndex=(Math.floor(y/factor)*source.width+Math.floor(x/factor))*4;
      const targetIndex=(y*target.width+x)*4;
      target.data.set(source.data.subarray(sourceIndex,sourceIndex+4),targetIndex);
    }
  }
  return target;
}
