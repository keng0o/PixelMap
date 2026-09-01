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

function drawWallCourses(surface,from,to,depth){
  for(const course of [3,6]){
    if(course>=depth) continue;
    drawSupercoverLine(surface,{x:from.x,y:from.y+course},{x:to.x,y:to.y+course},PALETTE.stoneDark);
  }
}

function drawLongWallDetails(surface,angle,edge,openingPixels){
  const v=edge.side*GEOMETRY.masonryWidth/2;
  for(const joint of [-20,-12,-4,4,12,20]){
    const base=projectLocal(angle,joint,v);
    const start=2+Math.abs(joint/8)%2;
    for(let depth=start;depth<GEOMETRY.wallDepth;depth+=4)
      putPixel(surface,base.x,base.y+Math.floor(depth),PALETTE.stoneDark);
  }
  for(const center of LOCAL.archCenters){
    const columns=[];
    for(let relative=-GEOMETRY.archWidth/2;relative<=GEOMETRY.archWidth/2;relative++){
      const radius=GEOMETRY.archWidth/2;
      const curve=Math.sqrt(Math.max(0,radius*radius-relative*relative));
      const top=Math.min(GEOMETRY.wallDepth-1,
        1+Math.round(GEOMETRY.archHeight-curve));
      const base=projectLocal(angle,center+relative,v);
      columns.push({base,top});
      if(top>0) putPixel(surface,base.x,base.y+top-1,PALETTE.stoneLight);
    }
    for(const {base,top} of columns){
      const points=drawSupercoverLine(surface,
        {x:base.x,y:base.y+top},
        {x:base.x,y:base.y+GEOMETRY.wallDepth-1},PALETTE.opening);
      for(const point of points) openingPixels.add(`${point.x},${point.y}`);
    }
  }
}

function drawEndWallDetails(surface,angle,edge){
  const u=edge.side*GEOMETRY.length/2;
  for(const v of [-7,0,7]){
    const base=projectLocal(angle,u,v);
    for(let depth=2+(Math.abs(v/7)%2);depth<GEOMETRY.wallDepth;depth+=4)
      putPixel(surface,base.x,base.y+Math.floor(depth),PALETTE.stoneDark);
  }
}

function drawBridgeWalls(surface,angle){
  const visibleEdges=[];
  const openingPixels=new Set();
  for(const edge of LOCAL.edges){
    const outward=rotateVector(angle,edge.outward.u,edge.outward.v);
    if(outward.y<=1e-7) continue;
    const from=projectLocal(angle,edge.a.u,edge.a.v);
    const to=projectLocal(angle,edge.b.u,edge.b.v);
    const quad=[from,to,{x:to.x,y:to.y+GEOMETRY.wallDepth},{x:from.x,y:from.y+GEOMETRY.wallDepth}];
    const faceColor=outward.x>0.15?PALETTE.stoneDark:PALETTE.stoneMid;
    fillPolygon(surface,quad,faceColor);
    drawWallCourses(surface,from,to,GEOMETRY.wallDepth);
    if(edge.kind==='long') drawLongWallDetails(surface,angle,edge,openingPixels);
    else drawEndWallDetails(surface,angle,edge);
    drawPolygonOutline(surface,quad);
    visibleEdges.push({id:edge.id,kind:edge.kind,exposure:Number(outward.y.toFixed(6))});
  }
  return {visibleEdges,archPixels:openingPixels.size};
}

function drawRoadTexture(surface,angle){
  const rows=[-4,0,4];
  for(let rowIndex=0;rowIndex<rows.length;rowIndex++){
    const offset=rowIndex%2===0?0:4;
    for(let u=-22+offset;u<=22;u+=8){
      const point=projectLocal(angle,u,rows[rowIndex]);
      putPixel(surface,point.x,point.y,PALETTE.roadLight);
      if((Math.abs(u)+rowIndex)%3===0){
        const next=projectLocal(angle,u+1,rows[rowIndex]);
        putPixel(surface,next.x,next.y,PALETTE.roadLight);
      }
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

function drawParapet(surface,angle,localPoints){
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
  drawRoadTexture(surface,model.angle);

  const parapets=LOCAL.parapets.map(points=>({
    points,
    averageY:projectPoints(model.angle,points).reduce((sum,point)=>sum+point.y,0)/points.length,
  })).sort((left,right)=>left.averageY-right.averageY);
  for(const parapet of parapets) drawParapet(surface,model.angle,parapet.points);

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
      stats:{opaquePixels:result.opaquePixels,archPixels:wall.archPixels},
    },
  };
}

validateBridgeContract({angles:ANGLES,geometry:GEOMETRY});
