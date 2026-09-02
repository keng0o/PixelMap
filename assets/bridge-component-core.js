(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PixelMapBridgeComponents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='pixelmap-bridge-components/2';
  const ANGLES=Object.freeze(Array.from({length:36},(_,index)=>index*5));
  const ANGLE_BASES=Object.freeze(ANGLES.map(angle=>{
    const radians=angle*Math.PI/180;
    return Object.freeze({
      angle,
      cos:Number(Math.cos(radians).toFixed(15)),
      sin:Number(Math.sin(radians).toFixed(15)),
    });
  }));
  const PALETTE=Object.freeze({
    outline:'#2b292e',road:'#7a7478',roadLight:'#999295',stoneLight:'#d8d0c0',
    stoneMid:'#aaa397',stoneDark:'#6b6459',opening:'#303b46',shadow:'#222a33',
  });
  const STYLES=Object.freeze({
    stoneArchReference:Object.freeze({
      key:'stoneArchReference',abutmentLength:6,preferredSpanLength:20,minimumSpanLength:10,
      pierWidth:4,parapetThickness:3,parapetHeight:4,wallDepth:9,maxSpanCount:5,
    }),
  });
  const ENUMS=Object.freeze({
    family:Object.freeze(['stoneArch']),material:Object.freeze(['stone']),
    carry:Object.freeze(['road','rail','foot','other']),
    crossing:Object.freeze(['water','road','rail','mixed','unknown']),
    classificationSource:Object.freeze(['explicit','inferred','fallback']),
    detailLevel:Object.freeze(['auto','small','medium','large']),
  });
  const PRESETS=Object.freeze([
    ['short-narrow',36,16,8],['short-standard',36,22,14],['short-wide',36,30,20],
    ['standard-narrow',52,16,8],['standard-standard',52,22,14],['standard-wide',52,30,20],
    ['long-narrow',76,16,8],['long-standard',76,22,14],['long-wide',76,30,20],
  ].map(([id,length,masonryWidth,roadWidth])=>Object.freeze({id,length,masonryWidth,roadWidth})));

  const freeze=value=>{
    if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
    for(const child of Object.values(value)) freeze(child);
    return Object.freeze(value);
  };
  const roundHalf=value=>Math.round(value*2)/2;

  class BridgeValidationError extends Error{
    constructor(issues){
      super(issues.map(issue=>issue.message).join(' / '));
      this.name='BridgeValidationError';
      this.issues=freeze(issues.map(issue=>({...issue})));
    }
  }

  function normalizeAngle(angle){
    if(!Number.isFinite(angle)) throw new BridgeValidationError([{code:'angle',message:'角度は有限数で指定してください'}]);
    return ((angle%180)+180)%180;
  }

  function quantizeAngle(angle){
    return (Math.floor((normalizeAngle(angle)+2.5)/5)*5)%180;
  }

  function validateInput(input={}){
    const issues=[];
    const styleKey=input.styleKey??'stoneArchReference';
    const style=STYLES[styleKey];
    const rulesStyle=style||STYLES.stoneArchReference;
    if(!style) issues.push({code:'styleKey',field:'styleKey',message:`未知の橋styleです: ${styleKey}`});
    if(!Number.isFinite(input.screenAngle??0))
      issues.push({code:'angle',field:'screenAngle',message:'角度は有限数で指定してください'});
    for(const field of ['length','masonryWidth','roadWidth']){
      if(!Number.isInteger(input[field]))
        issues.push({code:'integer',field,message:`${field}は整数で指定してください`});
    }
    if(Number.isInteger(input.roadWidth)&&input.roadWidth<=0)
      issues.push({code:'roadWidth',field:'roadWidth',message:'路面幅は正の整数で指定してください'});
    if(Number.isInteger(input.length)&&
      input.length<2*rulesStyle.abutmentLength+rulesStyle.minimumSpanLength)
      issues.push({code:'length',field:'length',message:'橋長が最小径間を収められません'});
    if(Number.isInteger(input.masonryWidth)&&Number.isInteger(input.roadWidth)&&
      input.masonryWidth<input.roadWidth+2*rulesStyle.parapetThickness)
      issues.push({code:'width',field:'masonryWidth',message:'石造部幅に路面と左右欄干が収まりません'});
    const semanticDefaults={
      family:'stoneArch',material:'stone',carry:'road',crossing:'water',
      classificationSource:'explicit',detailLevel:'auto',
    };
    for(const [field,allowed] of Object.entries(ENUMS)){
      const value=input[field]??semanticDefaults[field];
      if(!allowed.includes(value))
        issues.push({code:field,field,message:`未対応の${field}です: ${value}`});
    }
    const spanCount=input.spanCount??'auto';
    if(spanCount!=='auto'&&(!Number.isInteger(spanCount)||spanCount<1||spanCount>rulesStyle.maxSpanCount))
      issues.push({code:'spanCount',field:'spanCount',message:'spanCountはautoまたは1から5の整数で指定してください'});
    if(Number.isInteger(spanCount)&&Number.isInteger(input.length)){
      const usableLength=input.length-2*rulesStyle.abutmentLength;
      const required=spanCount*rulesStyle.minimumSpanLength+(spanCount-1)*rulesStyle.pierWidth;
      if(required>usableLength)
        issues.push({code:'spanCount',field:'spanCount',message:'指定径間数が橋長へ収まりません'});
    }
    return freeze({valid:issues.length===0,issues});
  }

  function symmetricSpanLayout(length,style,requestedCount='auto'){
    const usableLength=length-2*style.abutmentLength;
    let count=requestedCount==='auto'?Math.max(1,Math.round(
      (usableLength+style.pierWidth)/(style.preferredSpanLength+style.pierWidth))):requestedCount;
    count=Math.min(style.maxSpanCount,count);
    const minimumFor=value=>value*style.minimumSpanLength+(value-1)*style.pierWidth;
    while(count>1&&minimumFor(count)>usableLength) count--;

    const pierWidths=Array(Math.max(0,count-1)).fill(style.pierWidth);
    let spanSpace=usableLength-pierWidths.reduce((sum,width)=>sum+width,0);
    if(count%2===0&&spanSpace%2!==0){
      pierWidths[count/2-1]++;
      spanSpace--;
    }
    const spanWidths=Array(count).fill(Math.floor(spanSpace/count));
    let remainder=spanSpace-spanWidths[0]*count;
    if(count%2===1&&remainder%2===1){
      spanWidths[Math.floor(count/2)]++;
      remainder--;
    }
    for(let offset=0;remainder>0;offset++){
      const left=offset;
      const right=count-1-offset;
      if(left>right) break;
      spanWidths[left]++;
      spanWidths[right]++;
      remainder-=2;
    }

    const spans=[];
    const piers=[];
    let cursor=-usableLength/2;
    for(let index=0;index<count;index++){
      const width=spanWidths[index];
      const uMin=roundHalf(cursor);
      const uMax=roundHalf(cursor+width);
      spans.push({id:`span-${index}`,index,width,uMin,uMax,center:roundHalf((uMin+uMax)/2)});
      cursor+=width;
      if(index<pierWidths.length){
        const pierWidth=pierWidths[index];
        const pierMin=roundHalf(cursor);
        const pierMax=roundHalf(cursor+pierWidth);
        piers.push({id:`pier-${index}`,index,width:pierWidth,uMin:pierMin,uMax:pierMax,
          center:roundHalf((pierMin+pierMax)/2)});
        cursor+=pierWidth;
      }
    }
    return {usableLength,spans,piers};
  }

  function rect(uMin,uMax,vMin,vMax){
    return freeze([
      {u:uMin,v:vMin},{u:uMax,v:vMin},{u:uMax,v:vMax},{u:uMin,v:vMax},
    ]);
  }

  function createModel(input={}){
    const validation=validateInput(input);
    if(!validation.valid) throw new BridgeValidationError(validation.issues);
    const style=STYLES[input.styleKey??'stoneArchReference'];
    const screenAngle=quantizeAngle(input.screenAngle??0);
    const length=input.length;
    const masonryWidth=input.masonryWidth;
    const roadWidth=input.roadWidth;
    const halfLength=length/2;
    const halfWidth=masonryWidth/2;
    const halfRoad=roadWidth/2;
    const shoulder=(masonryWidth-roadWidth-2*style.parapetThickness)/2;
    const parapetInner=halfWidth-style.parapetThickness;
    const family=input.family??'stoneArch';
    const material=input.material??'stone';
    const carry=input.carry??'road';
    const crossing=input.crossing??'water';
    const classificationSource=input.classificationSource??'explicit';
    const spanCount=input.spanCount??'auto';
    const detailLevel=input.detailLevel??'auto';
    const layout=symmetricSpanLayout(length,style,spanCount);
    const abutments=[
      {id:'abutment-left',kind:'abutment',uMin:-halfLength,uMax:-halfLength+style.abutmentLength},
      {id:'abutment-right',kind:'abutment',uMin:halfLength-style.abutmentLength,uMax:halfLength},
    ];
    const components=[
      {id:'deck',kind:'deck',polygon:rect(-halfLength,halfLength,-halfWidth,halfWidth)},
      {id:'road',kind:'road',polygon:rect(-halfLength,halfLength,-halfRoad,halfRoad)},
      {id:'parapet-negative',kind:'parapet',side:-1,
        polygon:rect(-halfLength,halfLength,-halfWidth,-parapetInner)},
      {id:'parapet-positive',kind:'parapet',side:1,
        polygon:rect(-halfLength,halfLength,parapetInner,halfWidth)},
      ...abutments,
      ...layout.spans.map(span=>({...span,kind:'span'})),
      ...layout.piers.map(pier=>({...pier,kind:'pier'})),
    ];
    return freeze({
      id:String(input.id??'bridge'),styleKey:style.key,style,screenAngle,length,masonryWidth,roadWidth,
      family,material,carry,crossing,classificationSource,spanCount,
      wallDepth:Number.isInteger(input.wallDepth)?input.wallDepth:style.wallDepth,
      parapetHeight:Number.isInteger(input.parapetHeight)?input.parapetHeight:style.parapetHeight,
      detailLevel,patternSeed:input.patternSeed??input.id??0,
      anchor:{x:0,y:0},halfLength,halfWidth,halfRoad,
      widthLayout:{leftParapet:style.parapetThickness,leftShoulder:shoulder,road:roadWidth,
        rightShoulder:shoulder,rightParapet:style.parapetThickness},
      usableLength:layout.usableLength,spans:layout.spans,piers:layout.piers,abutments,components,
    });
  }

  const pixelKey=(x,y)=>`${x},${y}`;
  const parsePixelKey=key=>key.split(',').map(Number);

  function rotateVector(angle,u,v){
    const basis=ANGLE_BASES[quantizeAngle(angle)/5];
    return {x:u*basis.cos-v*basis.sin,y:u*basis.sin+v*basis.cos};
  }

  function projectLocalFloat(model,u,v,z=0){
    if(!model||!Number.isFinite(u)||!Number.isFinite(v)||!Number.isFinite(z))
      throw new BridgeValidationError([{code:'coordinate',message:'局所座標は有限数で指定してください'}]);
    const rotated=rotateVector(model.screenAngle,u,v);
    return {x:model.anchor.x+rotated.x,y:model.anchor.y+rotated.y-z};
  }

  function projectLocal(model,u,v,z=0){
    const point=projectLocalFloat(model,u,v,z);
    return {x:Math.round(point.x),y:Math.round(point.y)};
  }

  function supercoverPoints(from,to){
    const points=[];
    let x=Math.round(from.x),y=Math.round(from.y);
    const targetX=Math.round(to.x),targetY=Math.round(to.y);
    const dx=targetX-x,dy=targetY-y;
    const nx=Math.abs(dx),ny=Math.abs(dy);
    const signX=Math.sign(dx),signY=Math.sign(dy);
    let ix=0,iy=0;
    points.push({x,y});
    while(ix<nx||iy<ny){
      const decision=(1+2*ix)*ny-(1+2*iy)*nx;
      if(decision===0){x+=signX;y+=signY;ix++;iy++;}
      else if(decision<0){x+=signX;ix++;}
      else{y+=signY;iy++;}
      points.push({x,y});
    }
    return points;
  }

  function pointInsidePolygon(x,y,points){
    let inside=false;
    for(let current=0,previous=points.length-1;current<points.length;previous=current++){
      const a=points[current],b=points[previous];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside=!inside;
    }
    return inside;
  }

  function polygonPixels(points){
    const pixels=[];
    const minX=Math.floor(Math.min(...points.map(point=>point.x)));
    const maxX=Math.ceil(Math.max(...points.map(point=>point.x)))-1;
    const minY=Math.floor(Math.min(...points.map(point=>point.y)));
    const maxY=Math.ceil(Math.max(...points.map(point=>point.y)))-1;
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++)
      if(pointInsidePolygon(x+0.5,y+0.5,points)) pixels.push({x,y});
    return pixels;
  }

  function hashSeed(value){
    const text=String(value);
    let hash=2166136261;
    for(let index=0;index<text.length;index++){
      hash^=text.charCodeAt(index);
      hash=Math.imul(hash,16777619);
    }
    return hash>>>0;
  }

  function operationMap(layer,lod='medium'){
    const map=new Map();
    return {
      layer,map,
      put(x,y,color,kind,componentId){
        if(!Number.isInteger(x)||!Number.isInteger(y)) return;
        map.set(pixelKey(x,y),{x,y,color,kind,componentId,layer,lod});
      },
      polygon(points,color,kind,componentId){
        for(const point of polygonPixels(points)) this.put(point.x,point.y,color,kind,componentId);
      },
      line(from,to,color,kind,componentId,clip=null){
        for(const point of supercoverPoints(from,to)){
          if(clip&&!clip.has(pixelKey(point.x,point.y))) continue;
          this.put(point.x,point.y,color,kind,componentId);
        }
      },
    };
  }

  const stableOperations=map=>freeze([...map.values()].sort((a,b)=>
    a.y-b.y||a.x-b.x||a.kind.localeCompare(b.kind)||a.componentId.localeCompare(b.componentId)||
    a.color.localeCompare(b.color)));

  function projectedPolygon(model,polygon,z=0){
    return polygon.map(({u,v})=>projectLocalFloat(model,u,v,z));
  }

  function localEdges(points){
    return points.map((from,index)=>({from,to:points[(index+1)%points.length]}));
  }

  function visible(outward,angle){
    // A face seen within one 5-degree step of edge-on collapses to disconnected-looking
    // one-pixel end fragments after integer projection. Merge that sliver into the end face.
    return rotateVector(angle,outward.u,outward.v).y>0.1;
  }

  const LOD_NAMES=Object.freeze(['small','medium','large']);
  const NEIGHBORS_4=Object.freeze([[1,0],[-1,0],[0,1],[0,-1]]);

  function resolveLod(model){
    if(model.detailLevel!=='auto') return model.detailLevel;
    let index=model.length<44?0:model.length<68?1:2;
    const minimumOpening=Math.min(...model.spans.map(span=>Math.max(0,span.width-2)));
    if(minimumOpening<6||model.wallDepth<3) index=Math.max(0,index-1);
    return LOD_NAMES[index];
  }

  function pointsForSet(set){
    return [...set].map(key=>{const [x,y]=parsePixelKey(key);return {x,y};})
      .sort((a,b)=>a.y-b.y||a.x-b.x);
  }

  function boundaryOutside(source,allowed,blocked=new Set()){
    const result=new Set();
    for(const key of allowed){
      if(source.has(key)||blocked.has(key)) continue;
      const [x,y]=parsePixelKey(key);
      if(NEIGHBORS_4.some(([dx,dy])=>source.has(pixelKey(x+dx,y+dy)))) result.add(key);
    }
    return result;
  }

  function connectedPixels(pixels,connectedMask,blocked=new Set()){
    const pending=new Map();
    for(const point of pixels){
      const key=pixelKey(point.x,point.y);
      if(!blocked.has(key)) pending.set(key,point);
    }
    const result=[];
    let changed=true;
    while(changed&&pending.size){
      changed=false;
      for(const [key,point] of pending){
        let touches=false;
        for(let dy=-1;dy<=1&&!touches;dy++) for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dy) continue;
          if(connectedMask.has(pixelKey(point.x+dx,point.y+dy))){touches=true;break;}
        }
        if(!touches) continue;
        pending.delete(key);connectedMask.add(key);result.push(point);changed=true;
      }
    }
    return result;
  }

  function composeStrict(input){
    const model=input&&Array.isArray(input.components)?input:createModel(input);
    const lod=resolveLod(model);
    const underlay=operationMap('underlay',lod);
    const surface=operationMap('surface',lod);
    const overlay=operationMap('overlay',lod);
    const roadMask=new Set();
    const openingMask=new Set();
    const reservedStructureMask=new Set();
    const structureMask=new Set();
    const innerShadowPixels=new Set();
    const pierPixels=new Set();
    const capstonePixels=new Set();
    const exaggerationPixels=new Set();
    const detailSets={
      masonryJointPixels:new Set(),voussoirPixels:new Set(),keystonePixels:new Set(),
      pierDetailPixels:new Set(),capstoneJointPixels:new Set(),parapetPostPixels:new Set(),
      roadPavingPixels:new Set(),
    };
    const seed=hashSeed(model.patternSeed);
    const halfLength=model.halfLength;
    const halfWidth=model.halfWidth;
    const lodIndex=LOD_NAMES.indexOf(lod);
    const pierExtra=lod==='large'?0:1;
    const capExtra=1;
    const terminalWidth=lod==='small'?2:lod==='medium'?1.5:1;
    const mark=(tracker,point)=>tracker.add(pixelKey(point.x,point.y));
    const trackedPut=(target,point,color,kind,componentId,tracker)=>{
      target.put(point.x,point.y,color,kind,componentId);
      if(tracker) mark(tracker,point);
    };
    const putMask=(target,pixels,color,kind,componentId,tracker=null,skip=openingMask)=>{
      for(const point of pixels){
        const key=pixelKey(point.x,point.y);
        if(skip?.has(key)) continue;
        target.put(point.x,point.y,color,kind,componentId);
        structureMask.add(key);
        if(tracker) tracker.add(key);
      }
    };

    const edgeDefinitions=[
      {id:'wall-long-negative',kind:'long',side:-1,
        from:{u:-halfLength,v:-halfWidth},to:{u:halfLength,v:-halfWidth},outward:{u:0,v:-1}},
      {id:'wall-end-positive',kind:'end',side:1,
        from:{u:halfLength,v:-halfWidth},to:{u:halfLength,v:halfWidth},outward:{u:1,v:0}},
      {id:'wall-long-positive',kind:'long',side:1,
        from:{u:halfLength,v:halfWidth},to:{u:-halfLength,v:halfWidth},outward:{u:0,v:1}},
      {id:'wall-end-negative',kind:'end',side:-1,
        from:{u:-halfLength,v:halfWidth},to:{u:-halfLength,v:-halfWidth},outward:{u:-1,v:0}},
    ];
    const visibleEdges=edgeDefinitions.filter(edge=>visible(edge.outward,model.screenAngle)).map(edge=>({
      ...edge,
      projectedFrom:projectLocalFloat(model,edge.from.u,edge.from.v),
      projectedTo:projectLocalFloat(model,edge.to.u,edge.to.v),
    })).sort((a,b)=>{
      const ay=(a.projectedFrom.y+a.projectedTo.y)/2;
      const by=(b.projectedFrom.y+b.projectedTo.y)/2;
      return ay-by||a.id.localeCompare(b.id);
    });

    for(const edge of visibleEdges){
      const from=edge.projectedFrom,to=edge.projectedTo;
      const bottomFrom={x:from.x,y:from.y+model.wallDepth};
      const bottomTo={x:to.x,y:to.y+model.wallDepth};
      underlay.line({x:bottomFrom.x,y:bottomFrom.y+1},{x:bottomTo.x,y:bottomTo.y+1},
        PALETTE.shadow,'shadow',`${edge.id}-shadow`);
      const face=[from,to,bottomTo,bottomFrom];
      const facePixels=polygonPixels(face);
      const faceMask=new Set(facePixels.map(({x,y})=>pixelKey(x,y)));
      const edgeOpenings=new Set();
      const rotatedOutward=rotateVector(model.screenAngle,edge.outward.u,edge.outward.v);
      const faceColor=rotatedOutward.x>0.15?PALETTE.stoneDark:PALETTE.stoneMid;

      if(edge.kind==='long'){
        const v=edge.side*halfWidth;
        for(const span of model.spans){
          const radius=Math.max(3,(span.width-2)/2);
          const archHeight=Math.min(model.wallDepth-1,Math.max(3,Math.round(radius*1.15)));
          const spanOpening=new Set();
          for(let localU=span.center-radius;localU<=span.center+radius;localU+=.25){
            const relative=(localU-span.center)/radius;
            if(Math.abs(relative)>1) continue;
            const curve=Math.sqrt(Math.max(0,1-relative*relative));
            const top=1+archHeight*(1-curve);
            const base=projectLocalFloat(model,localU,v);
            for(let offset=top;offset<model.wallDepth;offset+=.25){
              const point={x:Math.round(base.x),y:Math.round(base.y+offset)};
              const key=pixelKey(point.x,point.y);
              if(faceMask.has(key)) spanOpening.add(key);
            }
          }
          for(const key of spanOpening){edgeOpenings.add(key);openingMask.add(key);}
          const inner=boundaryOutside(spanOpening,faceMask);
          const blocked=new Set([...spanOpening,...inner]);
          const ring=boundaryOutside(inner,faceMask,blocked);
          for(const key of inner){
            const [x,y]=parsePixelKey(key);
            trackedPut(underlay,{x,y},PALETTE.stoneDark,'arch-inner-shadow',span.id,innerShadowPixels);
            reservedStructureMask.add(key);
          }
          for(const key of ring){
            const [x,y]=parsePixelKey(key);
            trackedPut(underlay,{x,y},PALETTE.stoneLight,'arch-ring',span.id,detailSets.voussoirPixels);
            reservedStructureMask.add(key);
          }
          if(lod!=='small'&&ring.size){
            const target=projectLocalFloat(model,span.center,v);
            let best=null,bestDistance=Infinity;
            for(const key of ring){
              const [x,y]=parsePixelKey(key);
              const distance=Math.abs(x-target.x)+Math.abs(y-(target.y+1));
              if(distance<bestDistance){best={x,y};bestDistance=distance;}
            }
            if(best) trackedPut(underlay,best,PALETTE.stoneLight,'arch-keystone',span.id,
              detailSets.keystonePixels);
          }
        }

        for(const point of facePixels){
          const key=pixelKey(point.x,point.y);
          if(edgeOpenings.has(key)||reservedStructureMask.has(key)) continue;
          underlay.put(point.x,point.y,faceColor,'wall',edge.id);
          structureMask.add(key);
        }

        for(const pier of model.piers){
          const uMin=pier.uMin-pierExtra,uMax=pier.uMax+pierExtra;
          const topA=projectLocalFloat(model,uMin,v),topB=projectLocalFloat(model,uMax,v);
          const pierFace=[topA,topB,{x:topB.x,y:topB.y+model.wallDepth+2},
            {x:topA.x,y:topA.y+model.wallDepth+2}];
          const pixels=connectedPixels(polygonPixels(pierFace),structureMask,openingMask);
          putMask(underlay,pixels,PALETTE.stoneDark,'projecting-pier',pier.id,pierPixels);
          for(const point of pixels){
            const key=pixelKey(point.x,point.y);reservedStructureMask.add(key);
            if(pierExtra||point.y>Math.max(topA.y,topB.y)+model.wallDepth) exaggerationPixels.add(key);
          }
          const capA={x:topA.x,y:topA.y+2},capB={x:topB.x,y:topB.y+2};
          for(const point of supercoverPoints(capA,capB)){
            const key=pixelKey(point.x,point.y);
            if(openingMask.has(key)) continue;
            trackedPut(underlay,point,PALETTE.stoneLight,'pier-cap',pier.id,detailSets.pierDetailPixels);
            reservedStructureMask.add(key);
          }
        }

        for(const abutment of model.abutments){
          const a=projectLocalFloat(model,abutment.uMin,v);
          const b=projectLocalFloat(model,abutment.uMax,v);
          const pixels=connectedPixels(
            polygonPixels([a,b,{x:b.x,y:b.y+model.wallDepth+1},{x:a.x,y:a.y+model.wallDepth+1}]),
            structureMask,openingMask);
          putMask(underlay,pixels,PALETTE.stoneMid,'stepped-abutment',abutment.id,reservedStructureMask);
          const lower=pixels.filter(point=>point.y>=Math.max(a.y,b.y)+model.wallDepth-1);
          putMask(underlay,lower,PALETTE.stoneDark,'abutment-step',abutment.id,reservedStructureMask);
        }

        if(lod==='large'){
          for(let course=3;course<model.wallDepth;course+=3){
            const a={x:from.x,y:from.y+course};
            const b={x:to.x,y:to.y+course};
            for(const point of supercoverPoints(a,b)){
              const key=pixelKey(point.x,point.y);
              if(!faceMask.has(key)||openingMask.has(key)||reservedStructureMask.has(key)) continue;
              trackedPut(underlay,point,PALETTE.stoneDark,'masonry-course',edge.id,
                detailSets.masonryJointPixels);
            }
          }
          const jointStart=-halfLength+model.style.abutmentLength;
          const jointEnd=halfLength-model.style.abutmentLength;
          for(let row=0;row<3;row++){
            const phase=(seed+row*5)%8;
            for(let u=Math.ceil(jointStart)+phase;u<jointEnd;u+=8){
              const base=projectLocalFloat(model,u,v);
              for(let offset=row*3+1;offset<Math.min(model.wallDepth,row*3+3);offset++){
                const point={x:Math.round(base.x),y:Math.round(base.y+offset)};
                const key=pixelKey(point.x,point.y);
                if(!faceMask.has(key)||openingMask.has(key)||reservedStructureMask.has(key)) continue;
                trackedPut(underlay,point,PALETTE.stoneDark,'masonry-joint',edge.id,
                  detailSets.masonryJointPixels);
              }
            }
          }
        }
      }else{
        putMask(underlay,facePixels,faceColor,'wall',edge.id);
      }

      underlay.line(from,to,PALETTE.outline,'wall-top-edge',edge.id);
      if(edge.kind!=='long')
        underlay.line(bottomFrom,bottomTo,PALETTE.outline,'wall-bottom-edge',edge.id);
    }

    const deckComponent=model.components.find(component=>component.kind==='deck');
    const roadComponent=model.components.find(component=>component.kind==='road');
    const deckPoints=projectedPolygon(model,deckComponent.polygon);
    const roadPoints=projectedPolygon(model,roadComponent.polygon);
    for(const point of polygonPixels(deckPoints)){
      const key=pixelKey(point.x,point.y);
      if(openingMask.has(key)) continue;
      surface.put(point.x,point.y,PALETTE.stoneLight,'deck','deck');
      structureMask.add(key);
    }
    for(const point of polygonPixels(roadPoints)){
      const key=pixelKey(point.x,point.y);
      if(openingMask.has(key)) continue;
      surface.put(point.x,point.y,PALETTE.road,'road','road');
      roadMask.add(key);structureMask.add(key);
    }
    for(const edge of localEdges(roadPoints)) surface.line(edge.from,edge.to,PALETTE.roadLight,'road-edge','road');
    if(lod==='large'){
      const roadPhase=seed%11;
      for(let u=Math.ceil(-halfLength)+roadPhase;u<halfLength;u+=11){
        const from=projectLocalFloat(model,u,-model.halfRoad);
        const to=projectLocalFloat(model,u,model.halfRoad);
        const middle={x:(from.x+to.x)/2,y:(from.y+to.y)/2};
        for(const point of supercoverPoints(from,middle)){
          const key=pixelKey(point.x,point.y);
          if(!roadMask.has(key)||reservedStructureMask.has(key)) continue;
          trackedPut(surface,point,PALETTE.roadLight,'road-paving','road',detailSets.roadPavingPixels);
        }
      }
    }

    const parapets=model.components.filter(component=>component.kind==='parapet')
      .map(component=>({component,points:projectedPolygon(model,component.polygon)}))
      .sort((a,b)=>a.points.reduce((sum,p)=>sum+p.y,0)-b.points.reduce((sum,p)=>sum+p.y,0));
    for(const {component,points} of parapets){
      const height=model.parapetHeight+capExtra;
      for(const edge of localEdges(component.polygon)){
        const outward={u:edge.to.v-edge.from.v,v:-(edge.to.u-edge.from.u)};
        if(!visible(outward,model.screenAngle)) continue;
        const from=projectLocalFloat(model,edge.from.u,edge.from.v);
        const to=projectLocalFloat(model,edge.to.u,edge.to.v);
        const topFrom={x:from.x,y:from.y-height};
        const topTo={x:to.x,y:to.y-height};
        putMask(overlay,polygonPixels([from,to,topTo,topFrom]),PALETTE.stoneMid,
          'parapet-face',component.id,reservedStructureMask);
      }
      const top=points.map(point=>({x:point.x,y:point.y-height}));
      const topPixels=polygonPixels(top);
      putMask(overlay,topPixels,PALETTE.stoneLight,'capstone-top',component.id,capstonePixels);
      for(const key of capstonePixels) reservedStructureMask.add(key);
      for(const edge of localEdges(top)) overlay.line(edge.from,edge.to,PALETTE.outline,'parapet-outline',component.id);

      const v=component.side*halfWidth;
      for(const end of [-1,1]){
        const u=end*halfLength;
        const innerU=u-end*terminalWidth;
        const baseA=projectLocalFloat(model,u,v),baseB=projectLocalFloat(model,innerU,v);
        const postPixels=polygonPixels([baseA,baseB,{x:baseB.x,y:baseB.y-height-1},
          {x:baseA.x,y:baseA.y-height-1}]);
        putMask(overlay,postPixels,PALETTE.stoneDark,'terminal-post',component.id,
          detailSets.parapetPostPixels);
        for(const point of postPixels){
          const key=pixelKey(point.x,point.y);reservedStructureMask.add(key);
          if(terminalWidth>1||point.y<Math.min(baseA.y,baseB.y)-height) exaggerationPixels.add(key);
        }
        const capLine=supercoverPoints(
          {x:baseA.x,y:baseA.y-height-1},{x:baseB.x,y:baseB.y-height-1});
        for(const point of capLine){
          trackedPut(overlay,point,PALETTE.stoneLight,'terminal-cap',component.id,capstonePixels);
          reservedStructureMask.add(pixelKey(point.x,point.y));
        }
      }

      if(lod==='large'){
        const phase=(seed+component.side+16)%10;
        for(let u=Math.ceil(-halfLength)+phase;u<=halfLength;u+=10){
          const point=projectLocalFloat(model,u,v,model.parapetHeight+capExtra);
          const raster={x:Math.round(point.x),y:Math.round(point.y)};
          const key=pixelKey(raster.x,raster.y);
          if(openingMask.has(key)||reservedStructureMask.has(key)) continue;
          trackedPut(overlay,raster,PALETTE.stoneMid,'capstone-joint',component.id,
            detailSets.capstoneJointPixels);
        }
      }
      for(const point of [...overlay.map.values()]) if(point.componentId===component.id)
        structureMask.add(pixelKey(point.x,point.y));
    }

    const allBeforeOutline=new Set([
      ...[...underlay.map.values()].filter(operation=>operation.kind!=='shadow').map(({x,y})=>pixelKey(x,y)),
      ...[...surface.map.values()].map(({x,y})=>pixelKey(x,y)),
      ...[...overlay.map.values()].map(({x,y})=>pixelKey(x,y)),
    ]);
    for(const key of allBeforeOutline){
      const [x,y]=parsePixelKey(key);
      if(NEIGHBORS_4.some(([dx,dy])=>!allBeforeOutline.has(pixelKey(x+dx,y+dy))))
        overlay.put(x,y,PALETTE.outline,'outer-outline','bridge-outline');
    }

    for(const key of openingMask){
      underlay.map.delete(key);surface.map.delete(key);overlay.map.delete(key);roadMask.delete(key);
    }
    const underlayOperations=stableOperations(underlay.map);
    const surfaceOperations=stableOperations(surface.map);
    const overlayOperations=stableOperations(overlay.map);
    const all=[...underlayOperations,...surfaceOperations,...overlayOperations];
    const xs=all.map(operation=>operation.x),ys=all.map(operation=>operation.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    return freeze({
      version:VERSION,model,underlay:underlayOperations,
      surfaceMask:pointsForSet(roadMask),surface:surfaceOperations,overlay:overlayOperations,
      openingMask:pointsForSet(openingMask),reservedStructureMask:pointsForSet(reservedStructureMask),
      bounds:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1},
      stats:{
        lod,archPixels:openingMask.size,openingPixels:openingMask.size,
        innerShadowPixels:innerShadowPixels.size,pierPixels:pierPixels.size,
        capstonePixels:capstonePixels.size,exaggerationPixels:exaggerationPixels.size,
        maxExaggeration:lod==='large'?1:2,
        wallPixels:new Set(underlayOperations.filter(operation=>operation.kind==='wall')
          .map(({x,y})=>pixelKey(x,y))).size,
        opaquePixels:new Set(all.map(({x,y})=>pixelKey(x,y))).size,
        extrusion:{parapet:{x:0,y:-model.parapetHeight},wall:{x:0,y:model.wallDepth}},
        details:Object.fromEntries(Object.entries(detailSets).map(([name,set])=>[name,set.size])),
      },
      diagnostics:{fallback:false,issues:[],suppressed:[],lod,lodIndex},
    });
  }

  function fallbackComposition(input,issues){
    const style=STYLES.stoneArchReference;
    const masonryCandidate=Number.isInteger(input?.masonryWidth)?input.masonryWidth:14;
    const masonryWidth=Math.max(10,masonryCandidate);
    const roadCandidate=Number.isInteger(input?.roadWidth)?input.roadWidth:Math.max(4,masonryWidth-8);
    const roadWidth=Math.max(1,Math.min(roadCandidate,masonryWidth-2*style.parapetThickness));
    const sanitized={
      id:input?.id??'fallback',styleKey:'stoneArchReference',
      family:'stoneArch',material:'stone',carry:'other',crossing:'unknown',classificationSource:'fallback',
      screenAngle:Number.isFinite(input?.screenAngle)?input.screenAngle:0,
      length:Math.max(2*style.abutmentLength+style.minimumSpanLength,
        Number.isInteger(input?.length)?input.length:22),
      masonryWidth,roadWidth,wallDepth:1,parapetHeight:1,detailLevel:'small',
      patternSeed:input?.patternSeed??'fallback',
    };
    const base=composeStrict(sanitized);
    const rejectedKinds=new Set([
      'arch-opening','arch-voussoir','arch-keystone','arch-inner-shadow','arch-ring',
      'projecting-pier','pier-cap','pier-detail','stepped-abutment','abutment-step',
      'masonry-course','masonry-joint','road-paving','parapet-post','terminal-post',
      'terminal-cap','capstone-joint',
    ]);
    const filter=operations=>operations.filter(operation=>!rejectedKinds.has(operation.kind));
    const underlay=filter(base.underlay);
    const surface=filter(base.surface);
    const overlay=filter(base.overlay);
    const fallbackModel=freeze({
      ...base.model,family:'generic',material:'unknown',carry:'other',crossing:'unknown',
      classificationSource:'fallback',spanCount:'auto',detailLevel:'small',
    });
    return freeze({
      ...base,model:fallbackModel,underlay,surface,overlay,openingMask:freeze([]),
      reservedStructureMask:freeze([]),
      stats:{...base.stats,archPixels:0,openingPixels:0,innerShadowPixels:0,pierPixels:0,
        exaggerationPixels:0,details:Object.fromEntries(
        Object.keys(base.stats.details).map(key=>[key,0]))},
      diagnostics:{
        fallback:true,issues:issues.map(issue=>({...issue})),lod:'small',
        suppressed:['stone-arch-structure','masonry','paving'],
        normalized:{
          screenAngle:fallbackModel.screenAngle,length:fallbackModel.length,
          masonryWidth:fallbackModel.masonryWidth,roadWidth:fallbackModel.roadWidth,
          family:fallbackModel.family,material:fallbackModel.material,
        },
      },
    });
  }

  function composeSafe(input){
    try{return composeStrict(input);}
    catch(error){
      if(!(error instanceof BridgeValidationError)) throw error;
      return fallbackComposition(input,error.issues);
    }
  }

  function cacheKey(model){
    return JSON.stringify([
      VERSION,model.styleKey,model.family,model.material,model.carry,model.crossing,
      model.classificationSource,model.spanCount,model.screenAngle,model.length,
      model.masonryWidth,model.roadWidth,
      model.wallDepth,model.parapetHeight,model.spans.map(span=>span.width),
      model.piers.map(pier=>pier.width),model.detailLevel,Object.values(PALETTE),String(model.patternSeed),
    ]);
  }

  function compositionWithModel(composition,model){
    if(composition.model===model) return composition;
    return freeze({...composition,model});
  }

  function createRenderer({cacheLimit=128}={}){
    if(!Number.isInteger(cacheLimit)||cacheLimit<=0)
      throw new BridgeValidationError([{code:'cacheLimit',message:'cacheLimitは正の整数で指定してください'}]);
    const cache=new Map();
    let hits=0,misses=0,evictions=0;
    const strict=input=>{
      const model=input&&Array.isArray(input.components)?input:createModel(input);
      const key=cacheKey(model);
      if(cache.has(key)){
        const cached=cache.get(key);
        cache.delete(key);
        cache.set(key,cached);
        hits++;
        return compositionWithModel(cached,model);
      }
      misses++;
      const composition=composeStrict(model);
      cache.set(key,composition);
      if(cache.size>cacheLimit){
        cache.delete(cache.keys().next().value);
        evictions++;
      }
      return composition;
    };
    const safe=input=>{
      try{return strict(input);}
      catch(error){
        if(!(error instanceof BridgeValidationError)) throw error;
        return fallbackComposition(input,error.issues);
      }
    };
    return freeze({
      composeStrict:strict,composeSafe:safe,
      clear(){cache.clear();},
      stats(){return freeze({limit:cacheLimit,size:cache.size,hits,misses,evictions});},
    });
  }

  function placeComposition(composition,offsetX,offsetY,clip=null){
    if(!Number.isInteger(offsetX)||!Number.isInteger(offsetY))
      throw new BridgeValidationError([{code:'placement',message:'配置座標は整数で指定してください'}]);
    if(clip&&(!Number.isInteger(clip.x)||!Number.isInteger(clip.y)||!Number.isInteger(clip.width)||
      !Number.isInteger(clip.height)||clip.width<=0||clip.height<=0))
      throw new BridgeValidationError([{code:'clip',message:'clip範囲が不正です'}]);
    let clippedPixels=0;
    const inside=(x,y)=>!clip||(x>=clip.x&&y>=clip.y&&x<clip.x+clip.width&&y<clip.y+clip.height);
    const moveOperations=operations=>{
      const result=[];
      for(const operation of operations){
        const x=operation.x+offsetX,y=operation.y+offsetY;
        if(!inside(x,y)){clippedPixels++;continue;}
        result.push({...operation,x,y});
      }
      return freeze(result);
    };
    const moveMask=points=>{
      const result=[];
      for(const point of points){
        const x=point.x+offsetX,y=point.y+offsetY;
        if(!inside(x,y)){clippedPixels++;continue;}
        result.push({x,y});
      }
      return freeze(result);
    };
    const underlay=moveOperations(composition.underlay);
    const surface=moveOperations(composition.surface);
    const overlay=moveOperations(composition.overlay);
    const surfaceMask=moveMask(composition.surfaceMask);
    const openingMask=moveMask(composition.openingMask||[]);
    const reservedStructureMask=moveMask(composition.reservedStructureMask||[]);
    const all=[...underlay,...surface,...overlay];
    const bounds=all.length?{
      x:Math.min(...all.map(item=>item.x)),y:Math.min(...all.map(item=>item.y)),
      width:Math.max(...all.map(item=>item.x))-Math.min(...all.map(item=>item.x))+1,
      height:Math.max(...all.map(item=>item.y))-Math.min(...all.map(item=>item.y))+1,
    }:{x:0,y:0,width:0,height:0};
    return freeze({
      ...composition,underlay,surfaceMask,surface,overlay,openingMask,reservedStructureMask,
      bounds,anchor:{x:offsetX,y:offsetY},
      diagnostics:{...composition.diagnostics,clippedPixels},
    });
  }

  return freeze({
    version:VERSION,angles:ANGLES,angleBases:ANGLE_BASES,palette:PALETTE,styles:STYLES,presets:PRESETS,
    BridgeValidationError,normalizeAngle,quantizeAngle,validateInput,createModel,projectLocalFloat,projectLocal,
    composeStrict,composeSafe,createRenderer,placeComposition,
  });
});
