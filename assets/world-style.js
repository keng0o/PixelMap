((global) => {
  'use strict';

  /*
    PixelMap World Style v3
    -----------------------
    z14 POCの「地理データをどう見せるか」を一箇所へ集約する。
    MVTのsource geometryは変更せず、既定レイヤー、色、corridor skin、
    POI密度、合成順だけを世界観として固定する。
  */
  const VERSION = 'pixelmap-world-style/3';

  const retroJrpgZ14 = Object.freeze({
    version:VERSION,
    id:'retro-jrpg-z14',
    label:'レトロJRPG z14 POC',
    assetPack:'retro-jrpg-reference-v1',
    tileZoom:14,
    sourceGeometryImmutable:true,
    patternId:'01',
    defaultLayers:Object.freeze([
      'grass','forest','woods','farmland','landcoverGrass','parks',
      'waterAreas','rivers','streams',
      'landuseResidential','landuseCommercial','landuseRetail',
      'landuseSchool','landuseHigherEducation','landuseMedical','landuseCivic',
      'landuseIndustrial','landuseRailway','landuseStadium','landusePitchTrack',
      'localRoads','regionalRoads','majorRoads','motorways','rail',
      'buildings','poi','stationNames',
    ]),
    palette:Object.freeze({
      outline:'#302838',
      grass:'#86bd5f',
      grassDark:'#679b48',
      grassLight:'#a3d579',
      residential:'#c8c7ba',
      residentialDark:'#aaa99d',
      commercial:'#bfc2c3',
      commercialDark:'#999da1',
      roadLocal:'#d8c58b',
      roadRegional:'#ddc991',
      roadMajor:'#e2c77f',
      roadEdge:'#7f6747',
      railBed:'#a89472',
      railBedDark:'#6f5d4e',
      rail:'#302838',
      railTie:'#76543d',
      water:'#4d91d7',
      waterEdge:'#c6e4ed',
    }),
    poiPalette:Object.freeze({
      transit:'#526bb0', health:'#c65349', civic:'#765ca1', food:'#c38a3e',
      commerce:'#b85a72', landmark:'#d2aa3d', nature:'#3f8949', stay:'#76609b',
      service:'#59636c', generic:'#6b625d',
    }),
    density:Object.freeze({
      maxIcons:64,
      roleCaps:Object.freeze({structure:44,object:12,marker:8}),
      categoryCaps:Object.freeze({
        transit:6,health:8,civic:10,food:8,commerce:8,
        landmark:8,nature:6,stay:4,service:4,generic:2,
      }),
      drawDotsByDefault:false,
      drawClustersByDefault:false,
    }),
    symbol:Object.freeze({
      decorateStructures:false,
      auxiliaryStructures:true,
      minimumAssetSize:'S',
      minimumAssetSizeByRole:Object.freeze({structure:'M',object:'S',marker:'S'}),
    }),
    building:Object.freeze({
      mode:'semantic-lod',
      sourceGeometryImmutable:true,
      detailedSmallModulo:8,
      sampledMinimumArea:4,
      minimumTallDetailedArea:8,
      quietMinimumArea:2,
      quietFills:Object.freeze(['#d8c99e','#cfbf91','#dccda5']),
    }),
    compositor:Object.freeze([
      'area','ground-corridor','building','structure','bridge','object','marker','dot-cluster',
    ]),
    corridor:Object.freeze({
      rivers:Object.freeze({width:4,edgeWidth:1,fill:'#4d91d7',edge:'#c6e4ed'}),
      streams:Object.freeze({width:1,edgeWidth:0,fill:'#62a6df'}),
      localRoads:Object.freeze({width:1,edgeWidth:0,fill:'#d8c58b'}),
      regionalRoads:Object.freeze({width:6,edgeWidth:1,fill:'#ddc991',edge:'#7f6747',center:null}),
      majorRoads:Object.freeze({width:8,edgeWidth:1,fill:'#e2c77f',edge:'#7f6747',center:null}),
      motorways:Object.freeze({width:10,edgeWidth:1,fill:'#e2c77f',edge:'#6d5840',center:'#f5dda0',centerPeriod:18,centerOn:9}),
      paths:Object.freeze({width:1,edgeWidth:0,fill:'#d8bd78'}),
      tracks:Object.freeze({width:2,edgeWidth:0,fill:'#b79d70',center:'#8b704d',centerPeriod:7,centerOn:2}),
      rail:Object.freeze({width:6,edgeWidth:1,fill:'#a89472',edge:'#6f5d4e',pattern:'rail',rail:'#302838',tie:'#76543d',railOffset:2,tiePeriod:6}),
      subway:Object.freeze({width:2,edgeWidth:0,fill:'#302838',alpha:.28,dashPeriod:10,dashOn:5}),
      aerialways:Object.freeze({width:2,edgeWidth:0,fill:'#76543d',pattern:'rail',rail:'#302838',tie:'#76543d',railOffset:1,tiePeriod:8}),
    }),
    corridorModifiers:Object.freeze({
      bridge:Object.freeze({minimumEdgeWidth:1,edge:'#302838'}),
      levelCrossing:Object.freeze({outline:'#302838',light:'#f0d788',dark:'#76543d',minimumSpacing:7}),
    }),
  });

  global.PixelMapWorldStyles = Object.freeze({
    version:VERSION,
    retroJrpgZ14,
  });
})(typeof window !== 'undefined' ? window : globalThis);
