(function(global){
  'use strict';

  const VERSION='pixelmap-bridge-classifier/1';
  const ROAD_OPTIONS=new Set(['localRoads','regionalRoads','majorRoads','motorways','raceways']);
  const FOOT_OPTIONS=new Set(['paths','tracks','piers']);
  const RAIL_OPTIONS=new Set(['rail','subway','aerialways']);

  const freeze=value=>Object.freeze(value);
  const maskFromGrid=grid=>{
    const mask=new Uint8Array(grid?.length||0);
    if(grid) for(let index=0;index<grid.length;index++) mask[index]=grid[index]?1:0;
    return mask;
  };

  function unionMasks(masks,size){
    const union=new Uint8Array(size);
    for(const mask of masks){
      if(!mask) continue;
      if(mask.length!==size) throw new Error('bridge context masks must share one size');
      for(let index=0;index<size;index++) if(mask[index]) union[index]=1;
    }
    return union;
  }

  function carryForOption(option){
    if(ROAD_OPTIONS.has(option)) return 'road';
    if(FOOT_OPTIONS.has(option)) return option==='tracks'?'other':'foot';
    if(RAIL_OPTIONS.has(option)) return 'rail';
    return 'other';
  }

  function componentsForMask(mask,width,height){
    if(mask.length!==width*height) throw new Error('bridge mask must match width x height');
    const visited=new Uint8Array(mask.length),components=[];
    for(let start=0;start<mask.length;start++){
      if(!mask[start]||visited[start]) continue;
      const stack=[start],cells=[];visited[start]=1;
      while(stack.length){
        const index=stack.pop(),x=index%width,y=Math.floor(index/width);
        cells.push(index);
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dy) continue;
          const nx=x+dx,ny=y+dy;
          if(nx<0||ny<0||nx>=width||ny>=height) continue;
          const next=ny*width+nx;
          if(mask[next]&&!visited[next]){visited[next]=1;stack.push(next);}
        }
      }
      components.push(cells);
    }
    return components;
  }

  function geometryForCells(cells,width){
    let sumX=0,sumY=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const index of cells){
      const x=index%width,y=Math.floor(index/width);
      sumX+=x;sumY+=y;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    const cx=sumX/cells.length,cy=sumY/cells.length;
    let xx=0,xy=0,yy=0;
    for(const index of cells){
      const x=index%width-cx,y=Math.floor(index/width)-cy;
      xx+=x*x;xy+=x*y;yy+=y*y;
    }
    const angle=.5*Math.atan2(2*xy,xx-yy);
    let tx=Math.cos(angle),ty=Math.sin(angle);
    if(tx<0||(Math.abs(tx)<1e-9&&ty<0)){tx=-tx;ty=-ty;}
    let minProjection=Infinity,maxProjection=-Infinity;
    for(const index of cells){
      const projection=(index%width-cx)*tx+(Math.floor(index/width)-cy)*ty;
      minProjection=Math.min(minProjection,projection);maxProjection=Math.max(maxProjection,projection);
    }
    const length=maxProjection-minProjection+1;
    const scale=length<=4?'tiny':length<=12?'small':length<=32?'medium':'large';
    return freeze({
      centroid:freeze({x:cx,y:cy}),
      bounds:freeze({minX,minY,maxX,maxY}),
      tangent:freeze({x:tx,y:ty}),
      minProjection,maxProjection,length,scale,
    });
  }

  function crossingForCounts(counts){
    // Water determines the visible bridge body even when the same span also
    // passes a riverside road or rail line. Preserve those secondary overlaps
    // in overlapCounts rather than downgrading the visual class to "mixed".
    if(counts.water>0) return 'water';
    const present=['water','road','rail'].filter(key=>counts[key]>0);
    if(present.length>1) return 'mixed';
    return present[0]||'unknown';
  }

  function styleFor({carry,crossing,scale}){
    if(carry==='rail') return 'railBridge';
    if(carry==='foot') return 'footBridge';
    if(carry==='road'&&crossing==='water')
      return scale==='tiny'||scale==='small'?'smallRoadWater':'largeRoadWater';
    if(carry==='road'&&['road','rail','mixed'].includes(crossing)) return 'roadOverpass';
    return 'genericBridge';
  }

  function classifyLayer({
    option,bridgeMask,centerMask,outlineMask,waterMask,roadMask,railMask,width,height,
  }){
    const carry=carryForOption(option),descriptors=[];
    for(const cells of componentsForMask(bridgeMask,width,height)){
      if(centerMask&&!cells.some(index=>centerMask[index])) continue;
      const geometry=geometryForCells(cells,width);
      const interiorMargin=Math.min(2,Math.max(0,(geometry.length-1)*.2));
      const counts={water:0,road:0,rail:0},evidence=[];
      let outlineCells=0,centerCells=0;
      for(const index of cells){
        const x=index%width,y=Math.floor(index/width);
        const projection=(x-geometry.centroid.x)*geometry.tangent.x+(y-geometry.centroid.y)*geometry.tangent.y;
        const interior=projection>=geometry.minProjection+interiorMargin&&
          projection<=geometry.maxProjection-interiorMargin;
        if(centerMask?.[index]) centerCells++;
        if(outlineMask?.[index]) outlineCells++;
        if(waterMask?.[index]) counts.water++;
        if(interior&&roadMask?.[index]) counts.road++;
        if(interior&&railMask?.[index]) counts.rail++;
      }
      const crossing=crossingForCounts(counts);
      evidence.push(`bridge-option:${option}`);
      if(outlineCells) evidence.push('outline-mask-overlap');
      for(const key of ['water','road','rail']) if(counts[key]) evidence.push(`${key}-mask-overlap`);
      const descriptor={
        id:`${option}:${descriptors.length}`,
        option,carry,crossing,scale:geometry.scale,
        bridgeType:'generic',structure:'unknown',material:'unknown',
        styleKey:styleFor({carry,crossing,scale:geometry.scale}),
        cells:freeze([...cells]),centerCells,outlineCells,overlapCounts:freeze({...counts}),
        geometry,
        confidence:freeze({
          carry:'explicit',
          crossing:crossing==='unknown'?'unknown':'inferred',
          scale:'inferred',
          structure:'unknown',
        }),
        evidence:freeze(evidence),
      };
      descriptors.push(freeze(descriptor));
    }
    return freeze(descriptors);
  }

  function analyzeLayers({
    grids,transportCenters,bridgeOptions,waterOptions,roadOptions,railOptions,
    outlineOption='bridge:transportationOther',width,height,
  }){
    const size=width*height;
    // The style catalogue is broader than the layers present in one tile. Keep
    // absent layers absent instead of turning them into a zero-length mask.
    const gridMask=option=>grids.has(option)?maskFromGrid(grids.get(option)):null;
    const unionFor=options=>unionMasks(options.map(gridMask),size);
    const outlineMask=gridMask(outlineOption);
    const waterMask=unionFor(waterOptions);
    const byOption=new Map(),descriptors=[];
    for(const option of bridgeOptions){
      const layer=`bridge:${option}`;
      const grid=grids.get(layer),center=transportCenters.get(layer);
      if(!grid||!center||!center.some(Boolean)) continue;
      // The normal transportation grid also contains the bridge carrier. Do
      // not mistake that self-overlap for a road/rail crossing. Crossings of a
      // different class remain inferable from the other option masks.
      const roadMask=unionFor(roadOptions.filter(candidate=>candidate!==option));
      const railMask=unionFor(railOptions.filter(candidate=>candidate!==option));
      const classified=classifyLayer({
        option,bridgeMask:maskFromGrid(grid),centerMask:maskFromGrid(center),outlineMask,
        waterMask,roadMask,railMask,width,height,
      });
      if(classified.length){byOption.set(option,classified);descriptors.push(...classified);}
    }
    return freeze({
      version:VERSION,descriptors:freeze(descriptors),byOption,
      counts:freeze({
        total:descriptors.length,
        byCarry:freeze(countBy(descriptors,item=>item.carry)),
        byCrossing:freeze(countBy(descriptors,item=>item.crossing)),
        byScale:freeze(countBy(descriptors,item=>item.scale)),
        byStyle:freeze(countBy(descriptors,item=>item.styleKey)),
        outlineMatched:descriptors.filter(item=>item.outlineCells>0).length,
        inferred:descriptors.filter(item=>item.confidence.crossing==='inferred').length,
        fallback:descriptors.filter(item=>item.styleKey==='genericBridge').length,
      }),
    });
  }

  function countBy(items,keyFor){
    const counts={};
    for(const item of items){const key=keyFor(item);counts[key]=(counts[key]||0)+1;}
    return counts;
  }

  global.PixelMapBridgeClassifier=freeze({
    version:VERSION,maskFromGrid,unionMasks,carryForOption,componentsForMask,
    classifyLayer,analyzeLayers,
  });
})(typeof window!=='undefined'?window:globalThis);
