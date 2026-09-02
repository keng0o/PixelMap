(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PixelMapBridgeComponents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='pixelmap-bridge-components/1';
  const ANGLES=Object.freeze(Array.from({length:36},(_,index)=>index*5));
  const PALETTE=Object.freeze({
    outline:'#2b292e',road:'#7a7478',roadLight:'#999295',stoneLight:'#d8d0c0',
    stoneMid:'#aaa397',stoneDark:'#6b6459',opening:'#303b46',shadow:'#222a33',
  });
  const STYLES=Object.freeze({
    stoneArchReference:Object.freeze({
      key:'stoneArchReference',abutmentLength:6,preferredSpanLength:20,minimumSpanLength:10,
      pierWidth:4,parapetThickness:3,parapetHeight:4,wallDepth:9,
    }),
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
    if(input.detailLevel!==undefined&&!['auto','full','quiet'].includes(input.detailLevel))
      issues.push({code:'detailLevel',field:'detailLevel',message:'未対応のdetailLevelです'});
    return freeze({valid:issues.length===0,issues});
  }

  function symmetricSpanLayout(length,style){
    const usableLength=length-2*style.abutmentLength;
    let count=Math.max(1,Math.round(
      (usableLength+style.pierWidth)/(style.preferredSpanLength+style.pierWidth)));
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
    const layout=symmetricSpanLayout(length,style);
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
      wallDepth:Number.isInteger(input.wallDepth)?input.wallDepth:style.wallDepth,
      parapetHeight:Number.isInteger(input.parapetHeight)?input.parapetHeight:style.parapetHeight,
      detailLevel:input.detailLevel??'auto',patternSeed:input.patternSeed??input.id??0,
      anchor:{x:0,y:0},halfLength,halfWidth,halfRoad,
      widthLayout:{leftParapet:style.parapetThickness,leftShoulder:shoulder,road:roadWidth,
        rightShoulder:shoulder,rightParapet:style.parapetThickness},
      usableLength:layout.usableLength,spans:layout.spans,piers:layout.piers,abutments,components,
    });
  }

  const pixelKey=(x,y)=>`${x},${y}`;
  const parsePixelKey=key=>key.split(',').map(Number);

  function rotateVector(angle,u,v){
    const radians=normalizeAngle(angle)*Math.PI/180;
    const cosine=Math.cos(radians);
    const sine=Math.sin(radians);
    return {x:u*cosine-v*sine,y:u*sine+v*cosine};
  }

  function projectLocal(model,u,v,z=0){
    if(!model||!Number.isFinite(u)||!Number.isFinite(v)||!Number.isFinite(z))
      throw new BridgeValidationError([{code:'coordinate',message:'局所座標は有限数で指定してください'}]);
    const rotated=rotateVector(model.screenAngle,u,v);
    return {x:model.anchor.x+Math.round(rotated.x),y:model.anchor.y+Math.round(rotated.y)-Math.round(z)};
  }

  function supercoverPoints(from,to){
    const points=[];
    let x=from.x,y=from.y;
    const dx=to.x-from.x,dy=to.y-from.y;
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
    const minX=Math.min(...points.map(point=>point.x));
    const maxX=Math.max(...points.map(point=>point.x));
    const minY=Math.min(...points.map(point=>point.y));
    const maxY=Math.max(...points.map(point=>point.y));
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

  function operationMap(layer){
    const map=new Map();
    return {
      layer,map,
      put(x,y,color,kind,componentId){
        if(!Number.isInteger(x)||!Number.isInteger(y)) return;
        map.set(pixelKey(x,y),{x,y,color,kind,componentId,layer});
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
    return polygon.map(({u,v})=>projectLocal(model,u,v,z));
  }

  function localEdges(points){
    return points.map((from,index)=>({from,to:points[(index+1)%points.length]}));
  }

  function visible(outward,angle){
    // A face seen within one 5-degree step of edge-on collapses to disconnected-looking
    // one-pixel end fragments after integer projection. Merge that sliver into the end face.
    return rotateVector(angle,outward.u,outward.v).y>0.1;
  }

  function composeStrict(input){
    const model=input&&Array.isArray(input.components)?input:createModel(input);
    const underlay=operationMap('underlay');
    const surface=operationMap('surface');
    const overlay=operationMap('overlay');
    const roadMask=new Set();
    const structureMask=new Set();
    const detailSets={
      masonryJointPixels:new Set(),voussoirPixels:new Set(),keystonePixels:new Set(),
      pierDetailPixels:new Set(),capstoneJointPixels:new Set(),parapetPostPixels:new Set(),
      roadPavingPixels:new Set(),
    };
    const mark=(tracker,point)=>tracker.add(pixelKey(point.x,point.y));
    const trackedPut=(target,point,color,kind,componentId,tracker)=>{
      target.put(point.x,point.y,color,kind,componentId);
      if(tracker) mark(tracker,point);
    };
    const seed=hashSeed(model.patternSeed);

    const halfLength=model.halfLength;
    const halfWidth=model.halfWidth;
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
      projectedFrom:projectLocal(model,edge.from.u,edge.from.v),
      projectedTo:projectLocal(model,edge.to.u,edge.to.v),
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
      const rotatedOutward=rotateVector(model.screenAngle,edge.outward.u,edge.outward.v);
      const faceColor=rotatedOutward.x>0.15?PALETTE.stoneDark:PALETTE.stoneMid;
      for(const point of facePixels){
        underlay.put(point.x,point.y,faceColor,'wall',edge.id);
        structureMask.add(pixelKey(point.x,point.y));
      }
      underlay.line(from,to,PALETTE.outline,'wall-top-edge',edge.id);
      underlay.line(bottomFrom,bottomTo,PALETTE.outline,'wall-bottom-edge',edge.id);

      for(let course=3;course<model.wallDepth;course+=3){
        const a={x:from.x,y:from.y+course};
        const b={x:to.x,y:to.y+course};
        for(const point of supercoverPoints(a,b)){
          if(!faceMask.has(pixelKey(point.x,point.y))) continue;
          trackedPut(underlay,point,PALETTE.stoneDark,'masonry-course',edge.id,
            detailSets.masonryJointPixels);
        }
      }

      if(edge.kind==='long'){
        const v=edge.side*halfWidth;
        for(const span of model.spans){
          const openingWidth=Math.max(6,Math.floor(span.width-4));
          const radius=openingWidth/2;
          const archHeight=Math.min(model.wallDepth-2,Math.max(4,Math.round(openingWidth*.5)));
          for(let localU=Math.ceil(span.center-radius);localU<=Math.floor(span.center+radius);localU++){
            const relative=(localU-span.center)/radius;
            if(Math.abs(relative)>1) continue;
            const curve=Math.sqrt(Math.max(0,1-relative*relative));
            const top=1+Math.round(archHeight*(1-curve));
            const base=projectLocal(model,localU,v);
            for(let offset=top;offset<model.wallDepth;offset++){
              const point={x:base.x,y:base.y+offset};
              if(!faceMask.has(pixelKey(point.x,point.y))) continue;
              underlay.put(point.x,point.y,PALETTE.opening,'arch-opening',span.id);
            }
            const rim={x:base.x,y:base.y+Math.max(1,top-1)};
            if(faceMask.has(pixelKey(rim.x,rim.y))) trackedPut(underlay,rim,
              Math.abs(relative)<.18?PALETTE.stoneLight:PALETTE.stoneMid,
              'arch-voussoir',span.id,detailSets.voussoirPixels);
          }
          const keyBase=projectLocal(model,span.center,v);
          const keystone={x:keyBase.x,y:keyBase.y+1};
          if(faceMask.has(pixelKey(keystone.x,keystone.y))) trackedPut(underlay,keystone,
            PALETTE.stoneLight,'arch-keystone',span.id,detailSets.keystonePixels);
        }
        for(const pier of model.piers){
          const center=projectLocal(model,pier.center,v);
          for(let offset=Math.max(3,Math.floor(model.wallDepth/2));offset<model.wallDepth;offset++){
            const point={x:center.x,y:center.y+offset};
            if(faceMask.has(pixelKey(point.x,point.y))) trackedPut(underlay,point,
              PALETTE.stoneDark,'pier-detail',pier.id,detailSets.pierDetailPixels);
          }
        }
        const jointStart=-halfLength+model.style.abutmentLength;
        const jointEnd=halfLength-model.style.abutmentLength;
        for(let row=0;row<3;row++){
          const phase=(seed+row*5)%8;
          for(let u=Math.ceil(jointStart)+phase;u<jointEnd;u+=8){
            const base=projectLocal(model,u,v);
            for(let offset=row*3+1;offset<Math.min(model.wallDepth,row*3+3);offset++){
              const point={x:base.x,y:base.y+offset};
              if(faceMask.has(pixelKey(point.x,point.y))) trackedPut(underlay,point,
                PALETTE.stoneDark,'masonry-joint',edge.id,detailSets.masonryJointPixels);
            }
          }
        }
      }
    }

    const deckComponent=model.components.find(component=>component.kind==='deck');
    const roadComponent=model.components.find(component=>component.kind==='road');
    const deckPoints=projectedPolygon(model,deckComponent.polygon);
    const roadPoints=projectedPolygon(model,roadComponent.polygon);
    for(const point of polygonPixels(deckPoints)){
      surface.put(point.x,point.y,PALETTE.stoneLight,'deck','deck');
      structureMask.add(pixelKey(point.x,point.y));
    }
    for(const point of polygonPixels(roadPoints)){
      surface.put(point.x,point.y,PALETTE.road,'road','road');
      roadMask.add(pixelKey(point.x,point.y));
      structureMask.add(pixelKey(point.x,point.y));
    }
    for(const edge of localEdges(roadPoints)) surface.line(edge.from,edge.to,PALETTE.roadLight,'road-edge','road');
    const roadPhase=seed%8;
    for(let u=Math.ceil(-halfLength)+roadPhase;u<halfLength;u+=8){
      const from=projectLocal(model,u,-model.halfRoad);
      const to=projectLocal(model,u,model.halfRoad);
      for(const point of supercoverPoints(from,to)){
        if(!roadMask.has(pixelKey(point.x,point.y))) continue;
        trackedPut(surface,point,PALETTE.roadLight,'road-paving','road',detailSets.roadPavingPixels);
      }
    }

    const parapets=model.components.filter(component=>component.kind==='parapet')
      .map(component=>({component,points:projectedPolygon(model,component.polygon)}))
      .sort((a,b)=>a.points.reduce((sum,p)=>sum+p.y,0)-b.points.reduce((sum,p)=>sum+p.y,0));
    for(const {component,points} of parapets){
      for(const edge of localEdges(component.polygon)){
        const outward={u:edge.to.v-edge.from.v,v:-(edge.to.u-edge.from.u)};
        if(!visible(outward,model.screenAngle)) continue;
        const from=projectLocal(model,edge.from.u,edge.from.v);
        const to=projectLocal(model,edge.to.u,edge.to.v);
        const topFrom={x:from.x,y:from.y-model.parapetHeight};
        const topTo={x:to.x,y:to.y-model.parapetHeight};
        overlay.polygon([from,to,topTo,topFrom],PALETTE.stoneMid,'parapet-face',component.id);
      }
      const top=points.map(point=>({x:point.x,y:point.y-model.parapetHeight}));
      overlay.polygon(top,PALETTE.stoneLight,'parapet-top',component.id);
      for(const edge of localEdges(top)) overlay.line(edge.from,edge.to,PALETTE.outline,'parapet-outline',component.id);
      const v=component.side*halfWidth;
      const postPhase=(seed+component.side+16)%8;
      for(let u=Math.ceil(-halfLength)+postPhase;u<=halfLength;u+=8){
        const base=projectLocal(model,u,v);
        const topPoint={x:base.x,y:base.y-model.parapetHeight};
        for(const point of supercoverPoints(base,topPoint)) trackedPut(overlay,point,
          PALETTE.stoneDark,'parapet-post',component.id,detailSets.parapetPostPixels);
        trackedPut(overlay,topPoint,PALETTE.stoneMid,'capstone-joint',component.id,
          detailSets.capstoneJointPixels);
      }
      for(const point of [...overlay.map.values()]) if(point.componentId===component.id)
        structureMask.add(pixelKey(point.x,point.y));
    }

    const allBeforeOutline=new Set([
      ...[...underlay.map.values()].filter(operation=>operation.kind!=='shadow').map(({x,y})=>pixelKey(x,y)),
      ...[...surface.map.values()].map(({x,y})=>pixelKey(x,y)),
      ...[...overlay.map.values()].map(({x,y})=>pixelKey(x,y)),
    ]);
    const neighborOffsets=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const key of allBeforeOutline){
      const [x,y]=parsePixelKey(key);
      if(neighborOffsets.some(([dx,dy])=>!allBeforeOutline.has(pixelKey(x+dx,y+dy))))
        overlay.put(x,y,PALETTE.outline,'outer-outline','bridge-outline');
    }

    const underlayOperations=stableOperations(underlay.map);
    const surfaceOperations=stableOperations(surface.map);
    const overlayOperations=stableOperations(overlay.map);
    const all=[...underlayOperations,...surfaceOperations,...overlayOperations];
    const xs=all.map(operation=>operation.x),ys=all.map(operation=>operation.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const archPixels=new Set(underlayOperations.filter(operation=>operation.kind==='arch-opening')
      .map(({x,y})=>pixelKey(x,y))).size;
    return freeze({
      version:VERSION,model,underlay:underlayOperations,
      surfaceMask:[...roadMask].map(key=>{const [x,y]=parsePixelKey(key);return {x,y};})
        .sort((a,b)=>a.y-b.y||a.x-b.x),
      surface:surfaceOperations,overlay:overlayOperations,
      bounds:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1},
      stats:{
        archPixels,wallPixels:new Set(underlayOperations.filter(operation=>operation.kind==='wall')
          .map(({x,y})=>pixelKey(x,y))).size,
        opaquePixels:new Set(all.map(({x,y})=>pixelKey(x,y))).size,
        extrusion:{parapet:{x:0,y:-model.parapetHeight},wall:{x:0,y:model.wallDepth}},
        details:Object.fromEntries(Object.entries(detailSets).map(([name,set])=>[name,set.size])),
      },
      diagnostics:{fallback:false,issues:[]},
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
      screenAngle:Number.isFinite(input?.screenAngle)?input.screenAngle:0,
      length:Math.max(2*style.abutmentLength+style.minimumSpanLength,
        Number.isInteger(input?.length)?input.length:22),
      masonryWidth,roadWidth,wallDepth:1,parapetHeight:1,detailLevel:'quiet',
      patternSeed:input?.patternSeed??'fallback',
    };
    const base=composeStrict(sanitized);
    const rejectedKinds=new Set([
      'arch-opening','arch-voussoir','arch-keystone','pier-detail','masonry-course','masonry-joint',
      'road-paving','parapet-post','capstone-joint',
    ]);
    const filter=operations=>operations.filter(operation=>!rejectedKinds.has(operation.kind));
    const underlay=filter(base.underlay);
    const surface=filter(base.surface);
    const overlay=filter(base.overlay);
    return freeze({
      ...base,underlay,surface,overlay,
      stats:{...base.stats,archPixels:0,details:Object.fromEntries(
        Object.keys(base.stats.details).map(key=>[key,0]))},
      diagnostics:{fallback:true,issues:issues.map(issue=>({...issue}))},
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
      VERSION,model.styleKey,model.screenAngle,model.length,model.masonryWidth,model.roadWidth,
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
    const all=[...underlay,...surface,...overlay];
    const bounds=all.length?{
      x:Math.min(...all.map(item=>item.x)),y:Math.min(...all.map(item=>item.y)),
      width:Math.max(...all.map(item=>item.x))-Math.min(...all.map(item=>item.x))+1,
      height:Math.max(...all.map(item=>item.y))-Math.min(...all.map(item=>item.y))+1,
    }:{x:0,y:0,width:0,height:0};
    return freeze({
      ...composition,underlay,surfaceMask,surface,overlay,bounds,anchor:{x:offsetX,y:offsetY},
      diagnostics:{...composition.diagnostics,clippedPixels},
    });
  }

  return freeze({
    version:VERSION,angles:ANGLES,palette:PALETTE,styles:STYLES,presets:PRESETS,
    BridgeValidationError,normalizeAngle,quantizeAngle,validateInput,createModel,projectLocal,
    composeStrict,composeSafe,createRenderer,placeComposition,
  });
});
