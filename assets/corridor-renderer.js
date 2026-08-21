((global) => {
  'use strict';

  /*
    PixelMap Corridor Renderer v2
    ----------------------------
    道路・鉄道・水路を同じ連続距離マスクへ変換する、表示先に依存しない正本。
    地物差はstyleのskin fieldだけで表し、source geometryは変更しない。
    map・assets catalog・将来のExpo/Flutter移植時の参照実装が共有する。
  */
  const VERSION='pixelmap-corridor-renderer/2';
  const positiveModulo=(value,period)=>((value%period)+period)%period;

  function setMaskPixel(mask,width,height,x,y){
    if(x<0 || y<0 || x>=width || y>=height) return;
    mask[y*width+x]=1;
  }

  function stampMask(mask,width,height,centerX,centerY,lineWidth){
    const size=Math.max(1,Math.round(lineWidth));
    const radius=Math.max(0,(size-1)/2);
    const extent=Math.ceil(radius);
    for(let dy=-extent;dy<=extent;dy++) for(let dx=-extent;dx<=extent;dx++){
      if(dx*dx+dy*dy<=radius*radius+.01)
        setMaskPixel(mask,width,height,centerX+dx,centerY+dy);
    }
  }

  function expandMask(source,width,height,radius){
    const amount=Math.max(0,Math.round(radius));
    if(!amount) return source.slice();
    const expanded=new Uint8Array(source.length);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      if(!source[y*width+x]) continue;
      for(let dy=-amount;dy<=amount;dy++) for(let dx=-amount;dx<=amount;dx++){
        if(dx*dx+dy*dy<=amount*amount)
          setMaskPixel(expanded,width,height,x+dx,y+dy);
      }
    }
    return expanded;
  }

  function walkPixelLine(x0,y0,x1,y1,visit){
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1;
    const dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
    let error=dx+dy;
    while(true){
      visit(x0,y0);
      if(x0===x1 && y0===y1) break;
      const twice=2*error;
      if(twice>=dy){error+=dy;x0+=sx;}
      if(twice<=dx){error+=dx;y0+=sy;}
    }
  }

  function featureType(feature){
    if(feature.type===1 || feature.type==='point') return 'point';
    if(feature.type===2 || feature.type==='line') return 'line';
    if(feature.type===3 || feature.type==='polygon') return 'polygon';
    return 'unknown';
  }

  function createMaskContext(width,height){
    const canvas=global.document?.createElement('canvas');
    if(!canvas) throw new Error('corridor renderer requires a Canvas2D mask context');
    canvas.width=width;canvas.height=height;
    return canvas.getContext('2d');
  }

  function alphaMask(context,width,height){
    const rgba=context.getImageData(0,0,width,height).data;
    const mask=new Uint8Array(width*height);
    for(let index=0;index<mask.length;index++) mask[index]=rgba[index*4+3]>=128?1:0;
    return mask;
  }

  function rasterizeAreas(context,width,height,features,pointFor){
    context.save();
    context.setTransform(1,0,0,1,0,0);
    context.clearRect(0,0,width,height);
    context.fillStyle='#fff';
    for(const feature of features){
      if(featureType(feature)!=='polygon') continue;
      context.beginPath();
      for(const ring of feature.geom || []){
        ring.forEach((point,index)=>{
          const [x,y]=pointFor(point);
          index?context.lineTo(x,y):context.moveTo(x,y);
        });
        context.closePath();
      }
      context.fill('evenodd');
    }
    context.restore();
    return alphaMask(context,width,height);
  }

  function rasterizeLines(context,width,height,features,lineWidth,pointFor){
    context.save();
    context.setTransform(1,0,0,1,0,0);
    context.clearRect(0,0,width,height);
    context.strokeStyle='#fff';context.fillStyle='#fff';
    context.lineWidth=Math.max(1,lineWidth);context.lineCap='round';context.lineJoin='round';
    for(const feature of features){
      const type=featureType(feature);
      if(type==='point'){
        for(const line of feature.geom || []) for(const point of line){
          const [x,y]=pointFor(point);
          context.beginPath();context.arc(x,y,Math.max(.5,lineWidth/2),0,Math.PI*2);context.fill();
        }
        continue;
      }
      if(type!=='line') continue;
      for(const line of feature.geom || []){
        if(!line.length) continue;
        context.beginPath();
        line.forEach((point,index)=>{
          const [x,y]=pointFor(point);
          index?context.lineTo(x,y):context.moveTo(x,y);
        });
        context.stroke();
      }
    }
    context.restore();
    return alphaMask(context,width,height);
  }

  function buildMasks({width,height,features,style,pointFor=point=>point,phaseAt=(x,y)=>x+y*3,maskContext=null}){
    const context=maskContext || createMaskContext(width,height);
    const fullCenter=new Uint8Array(width*height);
    const centerPhase=new Uint32Array(width*height);
    const phaseAssigned=new Uint8Array(width*height);
    const assignCenter=(x,y,phase)=>{
      x=Math.round(x);y=Math.round(y);
      if(x<0 || y<0 || x>=width || y>=height) return;
      const index=y*width+x;
      fullCenter[index]=1;
      if(!phaseAssigned[index]){
        phaseAssigned[index]=1;
        centerPhase[index]=positiveModulo(Math.round(phase),65521);
      }
    };
    for(const feature of features){
      const type=featureType(feature);
      if(type==='point'){
        for(const line of feature.geom || []) for(const point of line){
          const [x,y]=pointFor(point);assignCenter(x,y,phaseAt(x,y));
        }
        continue;
      }
      if(type!=='line') continue;
      for(const line of feature.geom || []){
        if(!line.length) continue;
        const [startX,startY]=pointFor(line[0]);
        let phaseCursor=positiveModulo(Math.round(phaseAt(startX,startY)),65521);
        let previousX=NaN,previousY=NaN;
        if(line.length===1) assignCenter(startX,startY,phaseCursor);
        for(let index=1;index<line.length;index++){
          const [x0,y0]=pointFor(line[index-1]);
          const [x1,y1]=pointFor(line[index]);
          walkPixelLine(x0,y0,x1,y1,(x,y)=>{
            if(x===previousX && y===previousY) return;
            assignCenter(x,y,phaseCursor++);previousX=x;previousY=y;
          });
        }
      }
    }
    const activeCenter=fullCenter.slice();
    if(style.dashPeriod){
      for(let index=0;index<activeCenter.length;index++){
        if(activeCenter[index] && centerPhase[index]%style.dashPeriod>=style.dashOn)
          activeCenter[index]=0;
      }
    }
    const body=rasterizeAreas(context,width,height,features,pointFor);
    if(style.dashPeriod){
      for(let y=0;y<height;y++) for(let x=0;x<width;x++){
        if(activeCenter[y*width+x]) stampMask(body,width,height,x,y,style.width);
      }
    } else {
      const lineBody=rasterizeLines(context,width,height,features,style.width,pointFor);
      for(let index=0;index<body.length;index++) body[index] ||= lineBody[index];
    }
    return {center:fullCenter,centerPhase,activeCenter,body,outer:expandMask(body,width,height,style.edgeWidth||0)};
  }

  function rgbaFor(color){
    const hex=String(color || '#000000').replace('#','');
    if(hex.length===3) return hex.split('').map(value=>parseInt(value+value,16));
    return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  }

  function paintPixel(image,index,color,alpha=1){
    const rgba=rgbaFor(color),pixel=index*4;
    image.data[pixel]=rgba[0];image.data[pixel+1]=rgba[1];image.data[pixel+2]=rgba[2];
    image.data[pixel+3]=Math.round(255*alpha);
  }

  function paintRail(image,masks,style,width,height){
    const body=masks.body,center=masks.center,phase=masks.centerPhase;
    const nearestCenter=new Int32Array(body.length);nearestCenter.fill(-1);
    const nearestDistance=new Uint16Array(body.length);nearestDistance.fill(65535);
    const searchRadius=Math.ceil(style.width/2)+1;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      const centerIndex=y*width+x;
      if(!center[centerIndex]) continue;
      for(let dy=-searchRadius;dy<=searchRadius;dy++) for(let dx=-searchRadius;dx<=searchRadius;dx++){
        const px=x+dx,py=y+dy;
        if(px<0 || py<0 || px>=width || py>=height) continue;
        const candidate=py*width+px;
        if(!body[candidate]) continue;
        const distance=dx*dx+dy*dy;
        if(distance<nearestDistance[candidate]){
          nearestDistance[candidate]=distance;nearestCenter[candidate]=centerIndex;
        }
      }
    }
    const tiePeriod=style.tiePeriod||4;
    for(let index=0;index<body.length;index++){
      const centerIndex=nearestCenter[index];
      if(centerIndex>=0 && phase[centerIndex]%tiePeriod===0) paintPixel(image,index,style.tie);
    }
    const railOffset=style.railOffset||Math.max(1,Math.floor(style.width/3));
    const targetDistance=railOffset*railOffset;
    const tolerance=railOffset===1?0:railOffset-1;
    for(let index=0;index<body.length;index++){
      if(nearestCenter[index]>=0 && Math.abs(nearestDistance[index]-targetDistance)<=tolerance)
        paintPixel(image,index,style.rail);
    }
  }

  function render(target,{width=target.canvas.width,height=target.canvas.height,features,style,
    pointFor=point=>point,phaseAt=(x,y)=>x+y*3,maskContext=null,preparedMasks=null}){
    const masks=preparedMasks || buildMasks({width,height,features,style,pointFor,phaseAt,maskContext});
    const image=target.createImageData(width,height);
    const alpha=style.alpha ?? 1;
    for(let index=0;index<masks.outer.length;index++){
      if(masks.outer[index]) paintPixel(image,index,style.edge || style.fill,alpha);
      if(masks.body[index]) paintPixel(image,index,style.fill,alpha);
    }
    if(style.center){
      for(let index=0;index<masks.center.length;index++){
        if(!masks.center[index]) continue;
        if(masks.centerPhase[index]%style.centerPeriod>=style.centerOn) continue;
        paintPixel(image,index,style.center,alpha);
      }
    }
    if(style.pattern==='rail') paintRail(image,masks,style,width,height);
    target.putImageData(image,0,0);
    return masks;
  }

  function findMaskIntersections(first,second,width,height,{minimumSpacing=6}={}){
    if(first.length!==second.length || first.length!==width*height)
      throw new Error('intersection masks must match width × height');
    const overlap=new Uint8Array(first.length);
    for(let index=0;index<overlap.length;index++) overlap[index]=first[index]&&second[index]?1:0;
    const visited=new Uint8Array(overlap.length);
    const components=[];
    for(let start=0;start<overlap.length;start++){
      if(!overlap[start] || visited[start]) continue;
      const stack=[start];visited[start]=1;
      let sumX=0,sumY=0,count=0;
      while(stack.length){
        const index=stack.pop(),x=index%width,y=Math.floor(index/width);
        sumX+=x;sumY+=y;count++;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=x+dx,ny=y+dy;
          if(nx<0||ny<0||nx>=width||ny>=height) continue;
          const next=ny*width+nx;
          if(overlap[next]&&!visited[next]){visited[next]=1;stack.push(next);}
        }
      }
      components.push({x:Math.round(sumX/count),y:Math.round(sumY/count),pixels:count});
    }
    const spacing=Math.max(0,Number(minimumSpacing)||0);
    const selected=[];
    for(const point of components.sort((a,b)=>b.pixels-a.pixels||a.y-b.y||a.x-b.x)){
      if(selected.some(other=>(point.x-other.x)**2+(point.y-other.y)**2<spacing**2)) continue;
      selected.push(Object.freeze(point));
    }
    return Object.freeze(selected.sort((a,b)=>a.y-b.y||a.x-b.x));
  }

  global.PixelMapCorridorRenderer=Object.freeze({version:VERSION,buildMasks,render,findMaskIntersections});
})(typeof window!=='undefined'?window:globalThis);
