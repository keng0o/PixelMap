import { writeFile } from 'node:fs/promises';

globalThis.window=globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/facility-resolver.js');
await import('../assets/poi-sprites.js');
await import('../assets/corridor-renderer.js');
await import('../assets/layer-assets.js');

const poi=globalThis.PixelMapPoiSprites;
const layers=globalThis.PixelMapLayerAssets;
const corridorRenderer=globalThis.PixelMapCorridorRenderer;

function rgba(color){
  const value=String(color).trim().toLowerCase();
  if(value.startsWith('#')){
    const hex=value.slice(1);
    if(hex.length===3) return [...hex].map(char=>parseInt(char+char,16)).concat(255);
    if(hex.length===6) return [0,2,4].map(index=>parseInt(hex.slice(index,index+2),16)).concat(255);
  }
  const match=value.match(/^rgba?\(([^)]+)\)$/);
  if(match){
    const parts=match[1].split(',').map(part=>Number(part.trim()));
    return [Math.round(parts[0]),Math.round(parts[1]),Math.round(parts[2]),
      parts.length>3?Math.round(parts[3]*255):255];
  }
  throw new Error(`Unsupported sprite color: ${color}`);
}

const poiAssets=poi.assets.map(asset=>({
  id:asset.id,
  label:asset.label,
  category:asset.category,
  semanticRole:asset.semanticRole,
  renderer:asset.renderer,
  ...(asset.cellGrid ? {cellGrid:asset.cellGrid} : {}),
  availableSizes:asset.sizes,
  previewSize:asset.previewSize,
  sizes:Object.fromEntries(asset.sizes.map(size=>{
    const contract=poi.contract(asset.id,size);
    return [size,{
      anchor:contract.anchor,
      bounds:contract.bounds,
      assetPixelScale:contract.assetPixelScale,
      rectangles:poi.commands(asset.id,size).map(command=>({
        x:command.x,y:command.y,width:command.width,height:command.height,rgba:rgba(command.color),
      })),
    }];
  })),
}));

const manifest={
  schema:'pixelmap-mobile-asset-manifest/1',
  coordinateSystem:{unit:'logical-pixel',xAxis:'right',yAxis:'down',anchor:'ground-center'},
  contracts:{
    poi:poi.contractVersion,
    corridor:layers.corridorContractVersion,
    corridorRenderer:corridorRenderer.version,
  },
  compositor:['area','structure','corridor','bridge','object','marker','dot-cluster'],
  poiAssets,
  corridors:Object.fromEntries(Object.entries(layers.corridorRules).map(([id,contract])=>[id,contract])),
};

const output=new URL('../assets/mobile-asset-manifest.json',import.meta.url);
await writeFile(output,`${JSON.stringify(manifest)}\n`);
console.log(`Generated ${poiAssets.length} POI assets and ${Object.keys(manifest.corridors).length} corridors into assets/mobile-asset-manifest.json`);
