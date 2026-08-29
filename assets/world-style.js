((global) => {
  'use strict';

  /*
    PixelMap World Style v5
    -----------------------
    productionの描画値を直接共有せず、z14比較用snapshotへ値コピーして保持する。
    production-copyは見た目の基準、retroJrpgZ14は意図的な実験用profileとして分離する。
  */
  const VERSION = 'pixelmap-world-style/5';
  const PRODUCTION_SNAPSHOT_VERSION = 'pixelmap-production-visual-snapshot/1';

  function frozenCopy(value){
    if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
    if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key,item]) => [key,frozenCopy(item)])
    ));
    return value;
  }

  /* production embeddedの現在値を、testから変更できない独立snapshotとして列挙する。 */
  const productionZ14Snapshot = Object.freeze({
    version:PRODUCTION_SNAPSHOT_VERSION,
    source:'embedded-pattern-07',
    tileZoom:14,
    patternId:'07',
    defaultLayers:frozenCopy([
      'grass','forest','woods','farmland','landcoverGrass','sand','rock','wetland','ice','landcoverOther',
      'parks','waterAreas','rivers','streams',
      'landuseCommercial','landuseRetail','landuseSchool','landuseHigherEducation',
      'landuseMedical','landuseCivic','landuseIndustrial','landuseGarages','landuseMilitary',
      'landuseBusStation','landuseRailway','landuseCemetery','landuseStadium','landusePitchTrack',
      'landusePlayground','landuseAmusement','landuseZoo','landuseAirport','landuseHelipad','landuseOther',
      'regionalRoads','majorRoads','motorways','tracks','raceways','ferries','piers',
      'rail','subway','aerialways','transportationOther','poi',
    ]),
    palette:frozenCopy({
      outline:'#302838',
      grass:'#7cbc54',grassDark:'#619c42',grassLight:'#98d470',
      residential:'#d0b078',residentialDark:'#b09058',
      commercial:'#c0c0c8',commercialDark:'#989ca8',
      roadLocal:'#c6c6c0',roadRegional:'#d0d0ca',roadMajor:'#d8c890',roadEdge:'#9e9e98',
      railBed:'#a8a098',railBedDark:'#888078',railBedLight:'#c0b8b0',
      rail:'#404048',railTie:'#786048',
      water:'#4890e0',waterLight:'#88c0f0',waterDark:'#3068b8',waterEdge:'#c8e8f8',
    }),
    poiPalette:frozenCopy({
      transit:'#2563eb',health:'#ef4444',civic:'#7c3aed',food:'#f59e0b',
      commerce:'#db2777',landmark:'#facc15',nature:'#16a34a',stay:'#8b5cf6',
      service:'#475569',generic:'#64748b',
    }),
    density:frozenCopy({
      maxIcons:Infinity,roleCaps:{},categoryCaps:{},
      drawDotsByDefault:true,drawClustersByDefault:true,
    }),
    buildingSkin:frozenCopy({
      version:'pixelmap-building-skin-production-copy/1',
      legacyRoofPalettes:[
        ['#e05038','#b03828','#f87858'],['#5078d8','#3858b0','#88a0f0'],
        ['#48a058','#357f42','#70c078'],['#e08038','#b06028','#f8a860'],
        ['#8890a0','#687080','#a8b0c0'],['#a07850','#805838','#c09868'],
        ['#707c90','#525c70','#8a96ac'],['#3c4454','#2a3040','#546078'],
        ['#b4b4b0','#909090','#d0d0cc'],['#c8a878','#a08858','#e0c898'],
      ],
      flatPalettes:[
        ['#9aa0a8','#787e88','#b8bec6'],['#b8ac94','#948a74','#d4c8ac'],
        ['#8c98a8','#6c7888','#aab6c4'],
      ],
      categoryAccents:{
        transit:'#2563eb',health:'#ef4444',civic:'#7c3aed',food:'#f59e0b',
        commerce:'#db2777',landmark:'#facc15',nature:'#16a34a',stay:'#8b5cf6',
        service:'#475569',generic:'#64748b',
      },
    }),
    corridor:frozenCopy({
      rivers:{source:'waterway',classes:['river'],width:4,edgeWidth:1,fill:'#4890e0',edge:'#c8e8f8'},
      streams:{source:'waterway',classes:['stream'],width:1,edgeWidth:0,fill:'#5aa2e8'},
      canals:{source:'waterway',classes:['canal'],width:2,edgeWidth:0,fill:'#4890e0'},
      drains:{source:'waterway',classes:['ditch','drain'],width:1,edgeWidth:0,fill:'#6aa8d8'},
      waterwayOther:{source:'waterway',fallback:true,width:1,edgeWidth:0,fill:'#4890e0'},
      localRoads:{width:1,edgeWidth:0,fill:'#c6c6c0'},
      regionalRoads:{width:8,edgeWidth:1,fill:'#d0d0ca',edge:'#9e9e98',center:'#f8f0d8',centerPeriod:13,centerOn:7},
      majorRoads:{width:10,edgeWidth:1,fill:'#d8c890',edge:'#a89058',center:'#e8b840',centerPeriod:17,centerOn:10},
      motorways:{width:14,edgeWidth:2,fill:'#d8c890',edge:'#8f7848',center:'#f8d878',centerPeriod:17,centerOn:10},
      paths:{width:1,edgeWidth:0,fill:'#dcc890'},
      tracks:{width:2,edgeWidth:0,fill:'#b8a47c',center:'#888078',centerPeriod:7,centerOn:3},
      raceways:{width:8,edgeWidth:0,fill:'#c99868',edge:'#8e6848'},
      ferries:{width:2,edgeWidth:0,fill:'#c8e8f8',dashPeriod:10,dashOn:6},
      piers:{width:2,edgeWidth:0,fill:'#d0b078'},
      rail:{
        width:8,edgeWidth:0,fill:'#a8a098',pattern:'rail',rail:'#404048',tie:'#786048',railOffset:2,railThickness:2,tiePeriod:4,sourceCellWidth:8,
        bedTexture:{
          period:8,dark:'#888078',light:'#c0b8b0',
          darkPixels:[[1,2],[5,4],[3,6]],lightPixels:[[6,1],[0,5]],
        },
      },
      subway:{width:3,edgeWidth:0,fill:'#282838',alpha:.3,dashPeriod:10,dashOn:5},
      aerialways:{width:3,edgeWidth:0,fill:'#a8a098',pattern:'rail',rail:'#404048',tie:'#786048',railOffset:1,tiePeriod:4},
      transportationOther:{width:2,edgeWidth:0,fill:'#dcc890',center:'#c4ac70',centerPeriod:1,centerOn:1},
      roadTunnels:{width:3,edgeWidth:0,fill:'#282838',alpha:.3,dashPeriod:10,dashOn:5,tunnelGroup:'road'},
      pathTunnels:{width:3,edgeWidth:0,fill:'#282838',alpha:.3,dashPeriod:10,dashOn:5,tunnelGroup:'path'},
      railTunnels:{width:3,edgeWidth:0,fill:'#282838',alpha:.3,dashPeriod:10,dashOn:5,tunnelGroup:'rail'},
    }),
    surfaceFamilies:frozenCopy({
      waterSurface:{primitive:'area',assets:['waterAreas'],skin:'water-ripple',fill:'#4890e0',light:'#88c0f0',dark:'#3068b8',edge:'#c8e8f8'},
      parkSurface:{primitive:'area',assets:['parks','landusePlayground'],skin:'park-garden',small:'#92ce69',medium:'#88c764',large:'#7fbb61',edge:'#4e833f'},
      sportsSurface:{primitive:'area',assets:['landuseStadium','landusePitchTrack'],skin:'field-stripes',fill:'#68b058',alternate:'#5ca050',edge:'#506c3f'},
    }),
  });

  const productionComparisonZ14 = Object.freeze({
    version:VERSION,id:'production-comparison-z14',label:'本番コピー比較 z14',
    profileKind:'production-copy',snapshotVersion:PRODUCTION_SNAPSHOT_VERSION,
    assetPack:'retro-jrpg-production-copy-v1',tileZoom:14,sourceGeometryImmutable:true,
    landmarksEnabled:false,patternId:productionZ14Snapshot.patternId,
    defaultLayers:frozenCopy(productionZ14Snapshot.defaultLayers),
    palette:frozenCopy(productionZ14Snapshot.palette),
    poiPalette:frozenCopy(productionZ14Snapshot.poiPalette),
    density:frozenCopy(productionZ14Snapshot.density),
    symbol:frozenCopy({
      decorateStructures:true,auxiliaryStructures:true,minimumAssetSize:'S',
      minimumAssetSizeByRole:{structure:'S',object:'S',marker:'S'},
      sourceAnchored:false,collisionBounds:'legacy-radius',
    }),
    building:frozenCopy({
      mode:'production-skin-copy',renderer:'production-cell-copy',cellSize:8,sourceGeometryImmutable:true,
      detailedSmallModulo:1,sampledMinimumArea:0,minimumTallDetailedArea:0,
      quietMinimumArea:0,quietFills:['#d0b078'],skin:productionZ14Snapshot.buildingSkin,
    }),
    compositor:frozenCopy([
      'area','ground-corridor','building','structure','bridge','object','marker','dot-cluster',
    ]),
    corridor:frozenCopy(productionZ14Snapshot.corridor),
    corridorModifiers:frozenCopy({
      bridge:{minimumEdgeWidth:0,edge:null},
      levelCrossing:{enabled:false,outline:'#302838',light:'#f0d788',dark:'#76543d',minimumSpacing:7},
    }),
    surfaceFamilies:frozenCopy(productionZ14Snapshot.surfaceFamilies),
  });

  /* production-copyが揃った後にだけ調整する、既存の参照テイストprofile。 */
  const retroJrpgZ14 = Object.freeze({
    version:VERSION,id:'retro-jrpg-z14',label:'レトロJRPG z14 POC',profileKind:'reference',
    assetPack:'retro-jrpg-reference-v1',tileZoom:14,sourceGeometryImmutable:true,
    landmarksEnabled:true,patternId:'01',
    defaultLayers:frozenCopy([
      'grass','forest','woods','farmland','landcoverGrass','parks',
      'waterAreas','rivers','streams','landuseResidential','landuseCommercial','landuseRetail',
      'landuseSchool','landuseHigherEducation','landuseMedical','landuseCivic',
      'landuseIndustrial','landuseRailway','landuseStadium','landusePitchTrack',
      'localRoads','regionalRoads','majorRoads','motorways','rail','buildings','poi','stationNames',
    ]),
    palette:frozenCopy({
      outline:'#302838',grass:'#86bd5f',grassDark:'#679b48',grassLight:'#a3d579',
      residential:'#c8c7ba',residentialDark:'#aaa99d',commercial:'#bfc2c3',commercialDark:'#999da1',
      roadLocal:'#d8c58b',roadRegional:'#ddc991',roadMajor:'#e2c77f',roadEdge:'#7f6747',
      railBed:'#a89472',railBedDark:'#6f5d4e',rail:'#302838',railTie:'#76543d',
      water:'#4d91d7',waterEdge:'#c6e4ed',
    }),
    poiPalette:frozenCopy({
      transit:'#526bb0',health:'#c65349',civic:'#765ca1',food:'#c38a3e',commerce:'#b85a72',
      landmark:'#d2aa3d',nature:'#3f8949',stay:'#76609b',service:'#59636c',generic:'#6b625d',
    }),
    density:frozenCopy({
      maxIcons:64,roleCaps:{structure:44,object:12,marker:8},
      categoryCaps:{transit:6,health:8,civic:10,food:8,commerce:8,landmark:8,nature:6,stay:4,service:4,generic:2},
      drawDotsByDefault:false,drawClustersByDefault:false,
    }),
    symbol:frozenCopy({
      decorateStructures:false,auxiliaryStructures:true,minimumAssetSize:'S',
      minimumAssetSizeByRole:{structure:'M',object:'S',marker:'S'},sourceAnchored:true,
      collisionBounds:'poi-asset-measured-bounds',
    }),
    building:frozenCopy({
      mode:'semantic-lod',sourceGeometryImmutable:true,detailedSmallModulo:8,
      sampledMinimumArea:4,minimumTallDetailedArea:8,quietMinimumArea:2,
      quietFills:['#d8c99e','#cfbf91','#dccda5'],
    }),
    compositor:frozenCopy([
      'area','ground-corridor','building','structure','bridge','object','marker','dot-cluster',
    ]),
    corridor:frozenCopy({
      rivers:{width:4,edgeWidth:1,fill:'#4d91d7',edge:'#c6e4ed'},streams:{width:1,edgeWidth:0,fill:'#62a6df'},
      localRoads:{width:1,edgeWidth:0,fill:'#d8c58b'},regionalRoads:{width:6,edgeWidth:1,fill:'#ddc991',edge:'#7f6747',center:null},
      majorRoads:{width:8,edgeWidth:1,fill:'#e2c77f',edge:'#7f6747',center:null},
      motorways:{width:10,edgeWidth:1,fill:'#e2c77f',edge:'#6d5840',center:'#f5dda0',centerPeriod:18,centerOn:9},
      paths:{width:1,edgeWidth:0,fill:'#d8bd78'},tracks:{width:2,edgeWidth:0,fill:'#b79d70',center:'#8b704d',centerPeriod:7,centerOn:2},
      rail:{width:6,edgeWidth:1,fill:'#a89472',edge:'#6f5d4e',pattern:'rail',rail:'#302838',tie:'#76543d',railOffset:2,tiePeriod:6},
      subway:{width:2,edgeWidth:0,fill:'#302838',alpha:.28,dashPeriod:10,dashOn:5},
      aerialways:{width:2,edgeWidth:0,fill:'#76543d',pattern:'rail',rail:'#302838',tie:'#76543d',railOffset:1,tiePeriod:8},
    }),
    corridorModifiers:frozenCopy({
      bridge:{minimumEdgeWidth:1,edge:'#302838'},
      levelCrossing:{enabled:true,outline:'#302838',light:'#f0d788',dark:'#76543d',minimumSpacing:7},
    }),
    surfaceFamilies:frozenCopy({
      waterSurface:{primitive:'area',assets:['waterAreas'],skin:'water-ripple',fill:'#4d91d7',light:'#8bc1e5',dark:'#326aa5',edge:'#c6e4ed'},
      parkSurface:{primitive:'area',assets:['parks','landusePlayground'],skin:'park-garden',small:'#92ce69',medium:'#88c764',large:'#7fbb61',edge:'#4e833f'},
      sportsSurface:{primitive:'area',assets:['landuseStadium','landusePitchTrack'],skin:'field-stripes',fill:'#68b058',alternate:'#5ca050',edge:'#506c3f'},
    }),
  });

  global.PixelMapWorldStyles = Object.freeze({
    version:VERSION,productionZ14Snapshot,productionComparisonZ14,retroJrpgZ14,
  });
})(typeof window !== 'undefined' ? window : globalThis);
