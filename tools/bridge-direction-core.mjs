import {
  createSurface,
  drawSupercoverLine,
  fillPolygon,
  putPixel,
} from './pixel-raster.mjs';

export const ANGLES=Object.freeze([0,15,30,45,60,75,90,105,120,135,150,165]);

export const PALETTE=Object.freeze({
  outline:'#2b292e',
  road:'#7a7478',
  roadLight:'#999295',
  stoneLight:'#d8d0c0',
  stoneMid:'#aaa397',
  stoneDark:'#6b6459',
  opening:'#303b46',
});

export const GEOMETRY=Object.freeze({
  canvas:Object.freeze({width:96,height:96}),
  anchor:Object.freeze({x:48,y:40}),
  length:52,
  masonryWidth:22,
  roadWidth:14,
  parapetThickness:3,
  parapetHeight:4,
  wallDepth:9,
  archCount:2,
  archWidth:14,
  archHeight:7,
  abutmentLength:6,
});

const freezePoints=points=>Object.freeze(points.map(point=>Object.freeze(point)));
const halfLength=GEOMETRY.length/2;
const halfWidth=GEOMETRY.masonryWidth/2;
const halfRoad=GEOMETRY.roadWidth/2;
const parapetInner=halfWidth-GEOMETRY.parapetThickness;

const LOCAL=Object.freeze({
  deck:freezePoints([
    {u:-halfLength,v:-halfWidth},{u:halfLength,v:-halfWidth},
    {u:halfLength,v:halfWidth},{u:-halfLength,v:halfWidth},
  ]),
  road:freezePoints([
    {u:-halfLength,v:-halfRoad},{u:halfLength,v:-halfRoad},
    {u:halfLength,v:halfRoad},{u:-halfLength,v:halfRoad},
  ]),
  parapets:Object.freeze([
    freezePoints([
      {u:-halfLength,v:-halfWidth},{u:halfLength,v:-halfWidth},
      {u:halfLength,v:-parapetInner},{u:-halfLength,v:-parapetInner},
    ]),
    freezePoints([
      {u:-halfLength,v:parapetInner},{u:halfLength,v:parapetInner},
      {u:halfLength,v:halfWidth},{u:-halfLength,v:halfWidth},
    ]),
  ]),
  edges:Object.freeze([
    Object.freeze({id:'long-negative',kind:'long',side:-1,
      a:Object.freeze({u:-halfLength,v:-halfWidth}),b:Object.freeze({u:halfLength,v:-halfWidth}),
      outward:Object.freeze({u:0,v:-1})}),
    Object.freeze({id:'end-positive',kind:'end',side:1,
      a:Object.freeze({u:halfLength,v:-halfWidth}),b:Object.freeze({u:halfLength,v:halfWidth}),
      outward:Object.freeze({u:1,v:0})}),
    Object.freeze({id:'long-positive',kind:'long',side:1,
      a:Object.freeze({u:halfLength,v:halfWidth}),b:Object.freeze({u:-halfLength,v:halfWidth}),
      outward:Object.freeze({u:0,v:1})}),
    Object.freeze({id:'end-negative',kind:'end',side:-1,
      a:Object.freeze({u:-halfLength,v:halfWidth}),b:Object.freeze({u:-halfLength,v:-halfWidth}),
      outward:Object.freeze({u:-1,v:0})}),
  ]),
  archCenters:Object.freeze([-10,10]),
  abutments:Object.freeze([
    Object.freeze({uMin:-halfLength,uMax:-halfLength+GEOMETRY.abutmentLength}),
    Object.freeze({uMin:halfLength-GEOMETRY.abutmentLength,uMax:halfLength}),
  ]),
});

export function normalizeAngle(angle){
  if(!Number.isFinite(angle)) throw new Error('角度は有限数である必要があります');
  return ((angle%180)+180)%180;
}

export function quantizeAngle(angle){
  return (Math.floor((normalizeAngle(angle)+7.5)/15)*15)%180;
}

export function projectLocal(angle,u,v,geometry=GEOMETRY){
  if(!Number.isFinite(u)||!Number.isFinite(v)) throw new Error('局所座標は有限数である必要があります');
  const radians=normalizeAngle(angle)*Math.PI/180;
  const cosine=Math.cos(radians);
  const sine=Math.sin(radians);
  return {
    x:geometry.anchor.x+Math.round(u*cosine-v*sine),
    y:geometry.anchor.y+Math.round(u*sine+v*cosine),
  };
}

export function validateBridgeContract({angles,geometry}){
  if(!Array.isArray(angles)||angles.length===0) throw new Error('方向集合が必要です');
  if(new Set(angles).size!==angles.length) throw new Error('方向集合に重複があります');
  for(const angle of angles){
    if(!Number.isInteger(angle)||angle<0||angle>=180||angle%15!==0)
      throw new Error('方向は0以上180未満の15度刻みで指定してください');
  }
  const integerValues=[
    geometry?.canvas?.width,geometry?.canvas?.height,
    geometry?.anchor?.x,geometry?.anchor?.y,
    geometry?.length,geometry?.masonryWidth,geometry?.roadWidth,
    geometry?.parapetThickness,geometry?.parapetHeight,geometry?.wallDepth,
    geometry?.archCount,geometry?.archWidth,geometry?.archHeight,geometry?.abutmentLength,
  ];
  if(integerValues.some(value=>!Number.isInteger(value)))
    throw new Error('共通幾何寸法はすべて整数である必要があります');
  if(geometry.canvas.width<=0||geometry.canvas.height<=0)
    throw new Error('キャンバス寸法は正の整数である必要があります');
  if(geometry.anchor.x<0||geometry.anchor.x>=geometry.canvas.width||
      geometry.anchor.y<0||geometry.anchor.y>=geometry.canvas.height)
    throw new Error('接地点がキャンバス範囲外です');
  if(geometry.roadWidth>=geometry.masonryWidth)
    throw new Error('車道幅は石造部の全幅より小さくする必要があります');
  return true;
}

export function bridgeModel(angle){
  const normalized=normalizeAngle(angle);
  if(!ANGLES.includes(normalized)) throw new Error('生成方向は定義済みの15度刻みで指定してください');
  return Object.freeze({
    angle:normalized,
    geometry:GEOMETRY,
    anchor:GEOMETRY.anchor,
    local:LOCAL,
  });
}

function rotateVector(angle,u,v){
  const radians=normalizeAngle(angle)*Math.PI/180;
  const cosine=Math.cos(radians);
  const sine=Math.sin(radians);
  return {x:u*cosine-v*sine,y:u*sine+v*cosine};
}

function projectPoints(angle,points){
  return points.map(({u,v})=>projectLocal(angle,u,v));
}

function translatePoints(points,x,y){
  return points.map(point=>({x:point.x+x,y:point.y+y}));
}

function drawPolygonOutline(surface,points,color=PALETTE.outline){
  for(let index=0;index<points.length;index++)
    drawSupercoverLine(surface,points[index],points[(index+1)%points.length],color);
}

function detailTracker(){
  return {
    masonryJointPixels:new Set(),
    voussoirPixels:new Set(),
    keystonePixels:new Set(),
    centralPierPixels:new Set(),
    abutmentPixels:new Set(),
    capstoneJointPixels:new Set(),
    parapetPostPixels:new Set(),
    roadPavingPixels:new Set(),
  };
}

function trackPoint(set,point){
  set.add(`${point.x},${point.y}`);
}

function trackedPixel(surface,point,color,set){
  putPixel(surface,point.x,point.y,color);
  trackPoint(set,point);
}

function trackedLine(surface,from,to,color,set){
  const points=drawSupercoverLine(surface,from,to,color);
  for(const point of points) trackPoint(set,point);
  return points;
}

function drawWallCourses(surface,from,to,depth){
  for(const course of [3,6]){
    if(course>=depth) continue;
    drawSupercoverLine(surface,{x:from.x,y:from.y+course},{x:to.x,y:to.y+course},PALETTE.stoneDark);
  }
}

function drawLongWallDetails(surface,angle,edge,openingPixels,details){
  const v=edge.side*GEOMETRY.masonryWidth/2;
  const courses=[
    {from:0,to:2,joints:[-20,-8,4,16]},
    {from:3,to:5,joints:[-14,-2,10,22]},
    {from:6,to:8,joints:[-20,-8,4,16]},
  ];
  for(const course of courses){
    for(const joint of course.joints){
      const base=projectLocal(angle,joint,v);
      trackedLine(surface,{x:base.x,y:base.y+course.from},{x:base.x,y:base.y+course.to},
        PALETTE.stoneDark,details.masonryJointPixels);
    }
  }
  for(const boundary of [-20,20]){
    const base=projectLocal(angle,boundary,v);
    trackedLine(surface,{x:base.x,y:base.y+1},{x:base.x,y:base.y+GEOMETRY.wallDepth-1},
      PALETTE.stoneDark,details.abutmentPixels);
  }
  for(const [fromU,toU] of [[-25,-20],[20,25]]){
    const from=projectLocal(angle,fromU,v);
    const to=projectLocal(angle,toU,v);
    trackedLine(surface,{x:from.x,y:from.y+5},{x:to.x,y:to.y+5},
      PALETTE.stoneLight,details.abutmentPixels);
  }
  for(const center of LOCAL.archCenters){
    const columns=[];
    for(let relative=-GEOMETRY.archWidth/2;relative<=GEOMETRY.archWidth/2;relative++){
      const radius=GEOMETRY.archWidth/2;
      const curve=Math.sqrt(Math.max(0,radius*radius-relative*relative));
      const top=Math.min(GEOMETRY.wallDepth-1,
        1+Math.round(GEOMETRY.archHeight-curve));
      const base=projectLocal(angle,center+relative,v);
      columns.push({base,top,relative});
      if(top>0) trackedPixel(surface,{x:base.x,y:base.y+top-1},
        PALETTE.stoneLight,details.voussoirPixels);
      if(top>1) trackedPixel(surface,{x:base.x,y:base.y+top-2},
        PALETTE.stoneMid,details.voussoirPixels);
      if([-6,-3,3,6].includes(relative)&&top>0)
        trackedPixel(surface,{x:base.x,y:base.y+top-1},PALETTE.stoneDark,details.voussoirPixels);
    }
    for(const {base,top} of columns){
      const points=drawSupercoverLine(surface,
        {x:base.x,y:base.y+top},
        {x:base.x,y:base.y+GEOMETRY.wallDepth-1},PALETTE.opening);
      for(const point of points) openingPixels.add(`${point.x},${point.y}`);
    }
    const keystone=columns.find(column=>column.relative===0);
    for(const relative of [-1,0,1]){
      const column=columns.find(candidate=>candidate.relative===relative);
      if(!column) continue;
      const y=column.base.y+Math.max(0,column.top-1);
      trackedPixel(surface,{x:column.base.x,y},
        relative===0?PALETTE.stoneLight:PALETTE.stoneMid,details.keystonePixels);
    }
    if(keystone&&keystone.top>1)
      trackedPixel(surface,{x:keystone.base.x,y:keystone.base.y+keystone.top-2},
        PALETTE.stoneLight,details.keystonePixels);
  }
  const pierTopLeft=projectLocal(angle,-2,v);
  const pierTopRight=projectLocal(angle,2,v);
  trackedLine(surface,{x:pierTopLeft.x,y:pierTopLeft.y+5},{x:pierTopRight.x,y:pierTopRight.y+5},
    PALETTE.stoneLight,details.centralPierPixels);
  const pierCenter=projectLocal(angle,0,v);
  trackedLine(surface,{x:pierCenter.x,y:pierCenter.y+6},
    {x:pierCenter.x,y:pierCenter.y+GEOMETRY.wallDepth-1},
    PALETTE.stoneDark,details.centralPierPixels);
}

function drawEndWallDetails(surface,angle,edge,details){
  const u=edge.side*GEOMETRY.length/2;
  const courses=[
    {from:0,to:2,joints:[-6,6]},
    {from:3,to:5,joints:[-9,0,9]},
    {from:6,to:8,joints:[-6,6]},
  ];
  for(const course of courses){
    for(const v of course.joints){
      const base=projectLocal(angle,u,v);
      trackedLine(surface,{x:base.x,y:base.y+course.from},{x:base.x,y:base.y+course.to},
        PALETTE.stoneDark,details.masonryJointPixels);
    }
  }
  const left=projectLocal(angle,u,-9);
  const right=projectLocal(angle,u,9);
  trackedLine(surface,{x:left.x,y:left.y+5},{x:right.x,y:right.y+5},
    PALETTE.stoneLight,details.abutmentPixels);
}

function drawBridgeWalls(surface,angle){
  const visibleEdges=[];
  const openingPixels=new Set();
  const details=detailTracker();
  for(const edge of LOCAL.edges){
    const outward=rotateVector(angle,edge.outward.u,edge.outward.v);
    if(outward.y<=1e-7) continue;
    const from=projectLocal(angle,edge.a.u,edge.a.v);
    const to=projectLocal(angle,edge.b.u,edge.b.v);
    const quad=[from,to,{x:to.x,y:to.y+GEOMETRY.wallDepth},{x:from.x,y:from.y+GEOMETRY.wallDepth}];
    const faceColor=outward.x>0.15?PALETTE.stoneDark:PALETTE.stoneMid;
    fillPolygon(surface,quad,faceColor);
    drawWallCourses(surface,from,to,GEOMETRY.wallDepth);
    if(edge.kind==='long') drawLongWallDetails(surface,angle,edge,openingPixels,details);
    else drawEndWallDetails(surface,angle,edge,details);
    drawPolygonOutline(surface,quad);
    visibleEdges.push({id:edge.id,kind:edge.kind,exposure:Number(outward.y.toFixed(6))});
  }
  return {visibleEdges,archPixels:openingPixels.size,details};
}

function drawRoadTexture(surface,angle,details){
  const rows=[-5,-2,1,4];
  for(let rowIndex=0;rowIndex<rows.length;rowIndex++){
    const offset=rowIndex%2===0?0:3;
    for(let u=-22+offset;u<=20;u+=7){
      const from=projectLocal(angle,u,rows[rowIndex]);
      const to=projectLocal(angle,u+2,rows[rowIndex]);
      trackedLine(surface,from,to,PALETTE.roadLight,details.roadPavingPixels);
    }
  }
}

function localPolygonEdges(points){
  return points.map((point,index)=>{
    const next=points[(index+1)%points.length];
    const du=next.u-point.u;
    const dv=next.v-point.v;
    return {a:point,b:next,outward:{u:dv,v:-du}};
  });
}

function drawParapet(surface,angle,localPoints,details){
  const base=projectPoints(angle,localPoints);
  for(const edge of localPolygonEdges(localPoints)){
    const outward=rotateVector(angle,edge.outward.u,edge.outward.v);
    if(outward.y<=1e-7) continue;
    const from=projectLocal(angle,edge.a.u,edge.a.v);
    const to=projectLocal(angle,edge.b.u,edge.b.v);
    const topFrom={x:from.x,y:from.y-GEOMETRY.parapetHeight};
    const topTo={x:to.x,y:to.y-GEOMETRY.parapetHeight};
    const face=[from,to,topTo,topFrom];
    fillPolygon(surface,face,outward.x>0.15?PALETTE.stoneDark:PALETTE.stoneMid);
    drawPolygonOutline(surface,face);
  }
  const top=translatePoints(base,0,-GEOMETRY.parapetHeight);
  fillPolygon(surface,top,PALETTE.stoneLight);
  drawPolygonOutline(surface,top);
  const vValues=localPoints.map(point=>point.v);
  const vMin=Math.min(...vValues);
  const vMax=Math.max(...vValues);
  for(const u of [-18,-9,0,9,18]){
    const from=projectLocal(angle,u,vMin);
    const to=projectLocal(angle,u,vMax);
    trackedLine(surface,{x:from.x,y:from.y-GEOMETRY.parapetHeight},
      {x:to.x,y:to.y-GEOMETRY.parapetHeight},
      PALETTE.stoneMid,details.capstoneJointPixels);
  }
  for(const u of [-24,-12,0,12,24]){
    const candidates=[projectLocal(angle,u,vMin),projectLocal(angle,u,vMax)];
    const basePoint=candidates.sort((left,right)=>right.y-left.y||right.x-left.x)[0];
    trackedLine(surface,basePoint,{x:basePoint.x,y:basePoint.y-GEOMETRY.parapetHeight},
      PALETTE.stoneDark,details.parapetPostPixels);
  }
  for(const point of base)
    drawSupercoverLine(surface,point,{x:point.x,y:point.y-GEOMETRY.parapetHeight},PALETTE.outline);
}

function opaqueBounds(surface){
  let minX=surface.width;
  let minY=surface.height;
  let maxX=-1;
  let maxY=-1;
  let opaquePixels=0;
  for(let y=0;y<surface.height;y++){
    for(let x=0;x<surface.width;x++){
      if(surface.data[(y*surface.width+x)*4+3]===0) continue;
      opaquePixels++;
      minX=Math.min(minX,x);minY=Math.min(minY,y);
      maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
  }
  if(maxX<0) return {bounds:{x:0,y:0,width:0,height:0},opaquePixels:0};
  return {bounds:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1},opaquePixels};
}

export function renderBridge(angle){
  const model=bridgeModel(angle);
  const surface=createSurface(GEOMETRY.canvas.width,GEOMETRY.canvas.height);
  const wall=drawBridgeWalls(surface,model.angle);

  const deck=projectPoints(model.angle,LOCAL.deck);
  fillPolygon(surface,deck,PALETTE.stoneLight);
  drawPolygonOutline(surface,deck);

  const road=projectPoints(model.angle,LOCAL.road);
  fillPolygon(surface,road,PALETTE.road);
  drawPolygonOutline(surface,road,PALETTE.roadLight);
  drawRoadTexture(surface,model.angle,wall.details);

  const parapets=LOCAL.parapets.map(points=>({
    points,
    averageY:projectPoints(model.angle,points).reduce((sum,point)=>sum+point.y,0)/points.length,
  })).sort((left,right)=>left.averageY-right.averageY);
  for(const parapet of parapets) drawParapet(surface,model.angle,parapet.points,wall.details);

  const result=opaqueBounds(surface);
  return {
    ...surface,
    meta:{
      angle:model.angle,
      anchor:{...GEOMETRY.anchor},
      bounds:result.bounds,
      extrusion:{
        parapet:{x:0,y:-GEOMETRY.parapetHeight},
        wall:{x:0,y:GEOMETRY.wallDepth},
      },
      visibleEdges:wall.visibleEdges,
      stats:{
        opaquePixels:result.opaquePixels,
        archPixels:wall.archPixels,
        details:Object.fromEntries(Object.entries(wall.details).map(([name,set])=>[name,set.size])),
      },
    },
  };
}

validateBridgeContract({angles:ANGLES,geometry:GEOMETRY});
