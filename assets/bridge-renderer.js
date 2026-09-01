(function(global){
  'use strict';

  const VERSION='pixelmap-bridge-renderer/1';
  const STYLES=Object.freeze({
    smallRoadWater:Object.freeze({
      deckEdge:'#51483e',wall:'#a19786',wallDark:'#625b50',highlight:'#d0c5b1',shadow:'#33404b',span:6,depth:3,arches:true,
    }),
    largeRoadWater:Object.freeze({
      deckEdge:'#48443f',wall:'#b9b09f',wallDark:'#6b6459',highlight:'#e0d7c7',shadow:'#303b46',span:9,depth:4,arches:true,
    }),
    roadOverpass:Object.freeze({
      deckEdge:'#55545a',wall:'#8e8e92',wallDark:'#606066',highlight:'#c5c4c0',shadow:'#34343b',span:10,depth:2,arches:false,
    }),
    railBridge:Object.freeze({
      deckEdge:'#35343c',wall:'#595b62',wallDark:'#363841',highlight:'#8b8e94',shadow:'#282a31',span:7,depth:2,arches:false,
    }),
    footBridge:Object.freeze({
      deckEdge:'#51483c',wall:'#887158',wallDark:'#594838',highlight:'#b99e79',shadow:'#34343b',span:5,depth:1,arches:false,
    }),
    genericBridge:Object.freeze({
      deckEdge:'#4b4850',wall:'#77747a',wallDark:'#515057',highlight:'#aaa7aa',shadow:'#34343b',span:8,depth:1,arches:false,
    }),
  });

  const mod=(value,period)=>((value%period)+period)%period;
  const freeze=value=>Object.freeze(value);
  const position=(index,width)=>[index%width,Math.floor(index/width)];

  function projectionAt(descriptor,x,y){
    return (x-descriptor.geometry.centroid.x)*descriptor.geometry.tangent.x+
      (y-descriptor.geometry.centroid.y)*descriptor.geometry.tangent.y-
      descriptor.geometry.minProjection;
  }

  function prepare({descriptors,width,height}){
    const underlay=new Map(),overlay=new Map();
    const put=(target,index,color,kind,descriptor)=>{
      if(index<0||index>=width*height) return;
      target.set(index,freeze({index,color,kind,descriptorId:descriptor.id,styleKey:descriptor.styleKey}));
    };
    let archOpenings=0,pierCells=0,wallCells=0,detailCells=0;
    for(const descriptor of descriptors){
      const style=STYLES[descriptor.styleKey]||STYLES.genericBridge;
      const deck=new Uint8Array(width*height);
      for(const index of descriptor.cells) deck[index]=1;
      const depth=descriptor.scale==='tiny'?1:style.depth;

      for(const index of descriptor.cells){
        const [x,y]=position(index,width);
        const phase=mod(Math.round(projectionAt(descriptor,x,y)),style.span);
        const southBoundary=y===height-1||!deck[index+width];
        const northBoundary=y===0||!deck[index-width];
        const sideBoundary=x===0||x===width-1||!deck[index-1]||!deck[index+1];

        if(southBoundary){
          for(let offset=1;offset<=depth;offset++){
            const wallY=y+offset;
            if(wallY>=height) continue;
            const wallIndex=wallY*width+x;
            if(deck[wallIndex]) continue;
            const archCenter=(style.span-1)/2;
            const archRadius=Math.max(0,offset-Math.ceil(depth/2)+1);
            const arch=style.arches&&descriptor.crossing==='water'&&descriptor.scale!=='tiny'&&
              offset>=Math.ceil(depth/2)&&Math.abs(phase-archCenter)<=archRadius;
            put(underlay,wallIndex,arch?style.shadow:(offset===depth?style.wallDark:style.wall),arch?'arch-opening':'wall',descriptor);
            if(arch) archOpenings++; else wallCells++;
          }
          const shadowY=y+depth+1;
          if(shadowY<height){
            const shadowIndex=shadowY*width+x;
            if(!deck[shadowIndex]&&!underlay.has(shadowIndex))
              put(underlay,shadowIndex,style.shadow,'shadow',descriptor);
          }
          if(descriptor.scale!=='tiny'&&phase===0){
            for(let offset=depth+1;offset<=depth+2;offset++){
              const pierY=y+offset;
              if(pierY>=height) continue;
              const pierIndex=pierY*width+x;
              if(deck[pierIndex]) continue;
              put(underlay,pierIndex,style.wallDark,'pier',descriptor);pierCells++;
            }
          }
        }

        if((northBoundary||sideBoundary)&&phase===0){
          put(overlay,index,style.highlight,'parapet-highlight',descriptor);detailCells++;
        }else if(southBoundary&&phase===style.span-1){
          put(overlay,index,style.deckEdge,'deck-joint',descriptor);detailCells++;
        }
      }
    }
    const sort=map=>freeze([...map.values()].sort((a,b)=>a.index-b.index));
    return freeze({
      version:VERSION,underlay:sort(underlay),overlay:sort(overlay),
      stats:freeze({components:descriptors.length,archOpenings,pierCells,wallCells,detailCells}),
    });
  }

  function paint(operations,width,paintCell){
    for(const operation of operations){
      const [x,y]=position(operation.index,width);
      paintCell(x,y,operation.color,operation);
    }
  }

  global.PixelMapBridgeRenderer=freeze({version:VERSION,styles:STYLES,prepare,paint});
})(typeof window!=='undefined'?window:globalThis);
