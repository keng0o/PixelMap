((global) => {
  'use strict';
  const G = global.PixelMapIllustratedGeometry, clip = global.polygonClipping;
  function random(x, y, salt = 0) {
    let n = G.hash(`${x}:${y}:${salt}`);
    n = Math.imul(n ^ n >>> 16, 0x7feb352d); n = Math.imul(n ^ n >>> 15, 0x846ca68b);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  }
  function noise(x, y, size = 24, salt = 0) {
    const gx = Math.floor(x / size), gy = Math.floor(y / size);
    const smooth = t => t * t * (3 - 2 * t), tx = smooth(x / size - gx), ty = smooth(y / size - gy);
    return (1 - ty) * ((1 - tx) * random(gx, gy, salt) + tx * random(gx + 1, gy, salt)) +
      ty * ((1 - tx) * random(gx, gy + 1, salt) + tx * random(gx + 1, gy + 1, salt));
  }
  const rect = b => [[[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom],[b.left,b.top]]];
  function union(polygons) {
    // Subpixel quantization avoids almost-coincident cap/strip intersections.
    return polygons.length ? clip.union(polygons.map(poly=>poly.map(ring=>
      ring.map(p=>p.map(n=>Math.round(n*1024)/1024))))) : [];
  }
  // Sample on a world lattice, including when clipping changes a segment's ends.
  function samples(a, b, spacing) {
    const axis=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1])?0:1, delta=b[axis]-a[axis];
    const ts=[0,1];
    for(let n=Math.ceil(Math.min(a[axis],b[axis])/spacing);n*spacing<Math.max(a[axis],b[axis]);n++) {
      const t=(n*spacing-a[axis])/delta;if(t>0&&t<1)ts.push(t);
    }
    return ts.sort((x,y)=>x-y).map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
  }
  function disk(p, radius) {
    const ring=Array.from({length:16},(_,i)=>[p[0]+Math.cos(i/16*Math.PI*2)*radius,p[1]+Math.sin(i/16*Math.PI*2)*radius]);
    return [...ring,ring[0]];
  }
  function trim(a, b, box) {
    const dx=b[0]-a[0],dy=b[1]-a[1];let lo=0,hi=1;
    for(const [p,q] of [[-dx,a[0]-box.left],[dx,box.right-a[0]],[-dy,a[1]-box.top],[dy,box.bottom-a[1]]]) {
      if(!p) { if(q<0)return null;continue; }
      const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
      if(lo>hi)return null;
    }
    return [[a[0]+dx*lo,a[1]+dy*lo],[a[0]+dx*hi,a[1]+dy*hi]];
  }
  function roadPolygons(road, box, nodes) {
    const fixed = road.props.brunnel === 'bridge' || ['rail','transit'].includes(G.kind(road));
    const major = ['motorway','trunk','primary','secondary','tertiary'].includes(G.kind(road));
    const radius = road.width / 2, strips=[];
    function halfWidth(p, nx, ny) {
      if(fixed)return radius;
      const nearby=nodes.get(`${Math.floor(p[0]/16)}:${Math.floor(p[1]/16)}`)||[];
      const distance=nearby.reduce((d,q)=>Math.min(d,Math.hypot(p[0]-q[0],p[1]-q[1])),10);
      const taper=Math.min(1,distance/10), x=p[0]+nx*radius,y=p[1]+ny*radius;
      const broad=(noise(x,y,27,11)-.5)*2*radius*(major?.045:.095);
      const fine=(noise(x,y,5,29)-.5)*2*Math.min(major?.22:.42,radius*.15);
      return radius+(broad+fine)*taper;
    }
    for(const path of road.geometry) {
      for(let i=1;i<path.length;i++) {
        const pair=trim(path[i-1],path[i],box);if(!pair)continue;
        const [a,b]=pair,length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!length)continue;
        const nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length,left=[],right=[];
        for(const p of samples(a,b,2.5)) {
          const l=halfWidth(p,nx,ny),r=halfWidth(p,-nx,-ny);
          left.push([p[0]+nx*l,p[1]+ny*l]);right.push([p[0]-nx*r,p[1]-ny*r]);
        }
        strips.push([[...left,...right.reverse(),left[0]]]);
      }
      for(const p of path) if(G.overlaps({left:p[0],right:p[0],top:p[1],bottom:p[1]},box)) strips.push([disk(p,radius)]);
    }
    return union(strips);
  }
  function waterPolygons(water, box) {
    const source=clip.intersection(water.polygons,[rect(box)]);
    if(!source.length)return [];
    const displaced=source.map(poly=>poly.map(ring=>{
      const result=[];
      for(let i=1;i<ring.length;i++) {
        const a=ring[i-1],b=ring[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(!length)continue;
        const nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length;
        for(const p of samples(a,b,3).slice(0,-1)) {
          const end=Math.min(1,Math.hypot(p[0]-a[0],p[1]-a[1])/4,Math.hypot(p[0]-b[0],p[1]-b[1])/4);
          const d=((noise(p[0],p[1],17,7)-.5)*.5+(noise(p[0],p[1],4,2)-.5)*.3)*end;
          result.push([p[0]+nx*d,p[1]+ny*d]);
        }
      }
      if(result.length)result.push(result[0]);return result;
    }));
    // Keep the ink footprint inside the mapped water. Islands cannot acquire
    // blue paint; a narrow neck falls back intact if the small inset splits it.
    const result=clip.intersection(displaced,source);
    const holes=p=>p.reduce((n,r)=>n+r.length-1,0);
    return result.length===source.length && holes(result)===holes(source) ? result : source;
  }
  function query(polygons) {
    const rows=new Map(),cells=new Map();
    for(const ring of polygons.flat())for(let i=1;i<ring.length;i++) {
      const a=ring[i-1],b=ring[i],edge={a,b},top=Math.min(a[1],b[1]),bottom=Math.max(a[1],b[1]);
      for(let y=Math.floor(top/16);y<=Math.floor(bottom/16);y++) {
        if(!rows.has(y))rows.set(y,[]);rows.get(y).push(edge);
      }
      for(let y=Math.floor(top/32);y<=Math.floor(bottom/32);y++)
        for(let x=Math.floor(Math.min(a[0],b[0])/32);x<=Math.floor(Math.max(a[0],b[0])/32);x++) {
          const key=`${x}:${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(edge);
        }
    }
    const inside=([x,y])=>{
      let hit=false;
      for(const {a,b} of rows.get(Math.floor(y/16))||[])if((a[1]>y)!==(b[1]>y) &&
        x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
      return hit;
    };
    const nearest=(p,radius)=>{
      let distance=Infinity,angle=0;const seen=new Set();
      for(let y=Math.floor((p[1]-radius)/32);y<=Math.floor((p[1]+radius)/32);y++)
        for(let x=Math.floor((p[0]-radius)/32);x<=Math.floor((p[0]+radius)/32);x++)
          for(const edge of cells.get(`${x}:${y}`)||[]) {
            if(seen.has(edge))continue;seen.add(edge);
            const {a,b}=edge,dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;if(!l2)continue;
            const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2));
            const d=Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);
            if(d<distance){distance=d;angle=Math.atan2(dy,dx);}
          }
      return {distance,angle};
    };
    return {inside,nearest,containsDisc:(p,r)=>inside(p)&&nearest(p,r).distance>=r};
  }
  function prepare(roads, water, bounds) {
    const box={left:bounds.left-32,top:bounds.top-32,right:bounds.right+32,bottom:bounds.bottom+32};
    const nodes=new Map();
    for(const road of roads) for(const path of road.geometry) for(const p of [path[0],path[path.length-1]]) {
      if(!p)continue;
      const gx=Math.floor(p[0]/16),gy=Math.floor(p[1]/16);
      for(let y=gy-1;y<=gy+1;y++)for(let x=gx-1;x<=gx+1;x++) {
        const key=`${x}:${y}`;if(!nodes.has(key))nodes.set(key,[]);nodes.get(key).push(p);
      }
    }
    const drawnRoads=roads.map(f=>({...f,paintPolygons:f.props.brunnel==='tunnel'?[]:roadPolygons(f,box,nodes)}));
    const drawnWater=water.map(f=>({...f,paintPolygons:f.type===3?waterPolygons(f,box):
      roadPolygons({...f,width:G.kind(f)==='river'?10:3,props:{...f.props,brunnel:''}},box,nodes)}));
    for(const f of [...drawnRoads,...drawnWater])f.paintQuery=query(f.paintPolygons);
    const roadGroups={};
    for(const mode of ['ground','bridge']) roadGroups[mode]=union(drawnRoads.filter(f=>
      f.props.brunnel!=='tunnel' && !['rail','transit'].includes(G.kind(f)) &&
      (f.props.brunnel==='bridge')===(mode==='bridge')).flatMap(f=>f.paintPolygons));
    return {roads:drawnRoads,water:drawnWater,roadGroups};
  }
  // Orientations are averaged modulo 180 degrees so opposite banks reinforce
  // each other rather than cancelling. Grid samples are fixed to the world.
  function flowField(scene, water) {
    const segments=[];
    for(const [paths,priority] of [[water.geometry,1],
      [scene.water.filter(f=>f.type===2).flatMap(f=>f.geometry),3]]) {
      for(const path of paths)for(let i=1;i<path.length;i++) {
        const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
        if(!length)continue;
        segments.push({a,b,dx,dy,length,priority,xx:(dx*dx-dy*dy)/(length*length),xy:2*dx*dy/(length*length)});
      }
    }
    const values=new Map();
    function grid(gx,gy) {
      const key=`${gx}:${gy}`;if(values.has(key))return values.get(key);
      const x=gx*24,y=gy*24;let xx=0,xy=0,weight=0,nearest=Infinity,closest=null;
      for(const e of segments) {
        const t=Math.max(0,Math.min(1,((x-e.a[0])*e.dx+(y-e.a[1])*e.dy)/(e.length*e.length)));
        const d=Math.hypot(x-e.a[0]-t*e.dx,y-e.a[1]-t*e.dy);
        if(d<nearest){nearest=d;closest=e;}
        if(d>120)continue;
        const w=e.priority*Math.min(e.length,32)/(d*d+24*24);
        xx+=e.xx*w;xy+=e.xy*w;weight+=w;
      }
      if(!weight&&closest){xx=closest.xx;xy=closest.xy;weight=1;}
      const value=weight?[xx/weight,xy/weight]:[1,0];values.set(key,value);return value;
    }
    return p=>{
      const gx=Math.floor(p[0]/24),gy=Math.floor(p[1]/24),tx=p[0]/24-gx,ty=p[1]/24-gy;
      let xx=0,xy=0;
      for(const [x,y,w] of [[gx,gy,(1-tx)*(1-ty)],[gx+1,gy,tx*(1-ty)],[gx,gy+1,(1-tx)*ty],[gx+1,gy+1,tx*ty]]) {
        const v=grid(x,y);xx+=v[0]*w;xy+=v[1]*w;
      }
      return Math.atan2(xy,xx)/2;
    };
  }
  function flowPath(point, length, angleAt) {
    const direction=angleAt(point), halves=[];
    for(const sign of [-1,1]) {
      const points=[point];let previous=direction;
      for(let d=0;d<length/2;d+=4) {
        const p=points[points.length-1];let angle=angleAt(p);
        if(Math.cos(angle-previous)<0)angle+=Math.PI;
        const step=Math.min(4,length/2-d);
        points.push([p[0]+Math.cos(angle)*step*sign,p[1]+Math.sin(angle)*step*sign]);previous=angle;
      }
      halves.push(points);
    }
    return [...halves[0].reverse(),...halves[1].slice(1)];
  }
  global.PixelMapIllustratedSurfaces=Object.freeze({noise,prepare,query,flowField,flowPath});
})(typeof window!=='undefined'?window:globalThis);
