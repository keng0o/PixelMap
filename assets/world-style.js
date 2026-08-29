((global) => {
  'use strict';

  /*
    PixelMap World Style v7
    -----------------------
    productionの描画値を直接共有せず、z14比較用snapshotへ値コピーして保持する。
    production-copyは見た目の基準、retroJrpgZ14は意図的な実験用profileとして分離する。
  */
  const VERSION = 'pixelmap-world-style/7';
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

  /*
    standalone cell2/cell3だけで使う、強度3のスチームパンク機械都市skin。
    元の道路中心線・建物footprint・水域境界は変えず、画面上へ伸びる大型の
    非意味機械素材を重ねる。production embeddedからは選択しない。
  */
  const steampunkMegacityDayZ14 = Object.freeze({
    version:VERSION,id:'steampunk-megacity-day-z14',label:'曇天のスチームパンク機械都市 z14',
    profileKind:'standalone-test-skin',assetPack:'steampunk-megacity-pixel-v1',
    assetSystem:'pixelmap-steampunk-map-assets/1',intensity:3,
    tileZoom:14,sourceGeometryImmutable:true,
    palette:frozenCopy({
      outline:'#202729',
      grass:'#566157',grassDark:'#424d45',grassLight:'#6f796a',
      treeDark:'#31443a',tree:'#405647',treeLight:'#5f7059',trunk:'#563d31',
      forestFloor:'#3f4d42',forestDeep:'#293931',forestMid:'#465b49',
      forestLight:'#637260',forestMoss:'#737659',
      woodsFloor:'#596555',woodsDeep:'#384b40',woodsMid:'#4c6150',woodsLight:'#71806a',
      parkSmall:'#626e5a',parkMedium:'#5c6855',parkLarge:'#53614f',parkPath:'#8e8064',
      residential:'#817561',residentialDark:'#5e5549',
      commercial:'#737874',commercialDark:'#515858',
      roadLocal:'#918a77',roadRegional:'#a49a82',roadMajor:'#ad915f',motorway:'#b19761',
      roadEdge:'#55524a',roadPatch:'#6b6253',roadDrain:'#394345',
      trail:'#8c775a',trailDark:'#5a4e40',
      gravel:'#63635d',gravelDark:'#454947',gravelLight:'#85847a',
      farm:'#80714f',farmDark:'#5d533c',sand:'#998a68',sandDark:'#746449',
      rock:'#626568',rockDark:'#42484c',rockLight:'#848789',
      wetland:'#4d6962',wetlandDark:'#344f4a',wetlandWater:'#496b70',
      ice:'#aebbb8',iceDark:'#748989',iceLight:'#d0d7cf',
      field:'#52664e',fieldAlt:'#475b44',
      water:'#456b73',waterLight:'#6f8d92',waterDark:'#304f57',waterEdge:'#9eaaa3',
      roofA:'#914430',roofADark:'#5f2c29',roofALight:'#b5613e',roofAEdge:'#431f22',
      roofB:'#46616a',roofBDark:'#30454d',roofBLight:'#688087',roofBEdge:'#223339',
      wall:'#8f8a79',wallDark:'#5b5d58',window:'#314f58',door:'#62402f',
      railBed:'#5c5e59',railBedDark:'#414542',railBedLight:'#777a73',
      rail:'#252c2f',railTie:'#554336',
      rust:'#a84f32',rustDark:'#642d28',metal:'#666d6a',metalDark:'#3d4647',
      pipe:'#334e54',warning:'#c29542',conduit:'#475b5d',
      copper:'#4f8176',copperLight:'#76a092',brass:'#c39a4b',
      brick:'#8f4737',brickDark:'#5c302d',steam:'#d8d4c3',steamShade:'#aaa99f',glass:'#79a5a5',
    }),
    poiPalette:frozenCopy({
      transit:'#536f86',health:'#a94e43',civic:'#6f617f',food:'#a87a43',
      commerce:'#965d69',landmark:'#b08c48',nature:'#55765b',stay:'#6e647e',
      service:'#56656a',generic:'#68706c',
    }),
    building:frozenCopy({
      mode:'steampunk-megacity-shape-grammar',sourceGeometryImmutable:true,
      skin:{
        version:'pixelmap-building-skin-steampunk-megacity/2',
        legacyRoofPalettes:[
          ['#914430','#5f2c29','#b5613e'],['#46616a','#30454d','#688087'],
          ['#53614f','#39453b','#71806a'],['#946039','#603e31','#b27b4a'],
          ['#666d6a','#444c4d','#868d86'],['#765443','#503a34','#936f54'],
          ['#515c5e','#343f43','#737d7a'],['#343d42','#232b30','#566166'],
          ['#76766f','#515550','#98968a'],['#827257','#5a5042','#a08d6c'],
        ],
        flatPalettes:[
          ['#666d6a','#444c4d','#868d86'],['#7c6d59','#564b3f','#988771'],
          ['#53686c','#394c51','#758185'],
        ],
        categoryAccents:{
          transit:'#536f86',health:'#a94e43',civic:'#6f617f',food:'#a87a43',
          commerce:'#965d69',landmark:'#b08c48',nature:'#55765b',stay:'#6e647e',
          service:'#56656a',generic:'#68706c',
        },
      },
      shapeGrammar:{
        version:'steampunk-megacity-shape/2',sourceFootprintImmutable:true,
        decorationsSemantic:false,protectedKinds:['religious_shinto','religious_buddhist','racecourse'],
        mechanicalDensity:'maximal',assetBudgetByBand:{1:1,2:2,3:3,4:4},
        steamBudgetByBand:{1:1,2:1,3:2,4:3},pipeSpanByBand:{1:3,2:4,3:6,4:8},
        roofForms:{
          band1:['pipe-crawl-roof','patched-boiler-roof'],
          band2:['sawtooth-turbine-roof','tank-deck-complex'],
          band3:['stacked-duct-quarter','gas-holder-roof-city'],
          band4:['stacked-boiler-city','gear-spire-complex'],
        },
        equipmentByBand:{1:2,2:3,3:4,4:5},
        equipment:['boiler','gas-holder','gear-tower','water-tank','pipe-organ','steam-plume'],
        raisedDeckMinimumCells:3,
      },
    }),
    corridor:frozenCopy({
      rivers:{fill:'#456b73',edge:'#9eaaa3'},streams:{fill:'#52777d'},
      canals:{fill:'#456b73'},drains:{fill:'#527278'},waterwayOther:{fill:'#456b73'},
      localRoads:{fill:'#918a77'},regionalRoads:{fill:'#a49a82',edge:'#55524a',center:'#c5bda9'},
      majorRoads:{fill:'#ad915f',edge:'#665641',center:'#d0ad5d'},
      motorways:{fill:'#b19761',edge:'#5d513f',center:'#d5b967'},
      paths:{fill:'#8c775a'},tracks:{fill:'#756952',center:'#4b4e4b'},
      raceways:{fill:'#835c48',edge:'#4e4038'},ferries:{fill:'#9eaaa3'},piers:{fill:'#817561'},
      rail:{fill:'#5c5e59',edge:'#414542',rail:'#252c2f',tie:'#554336'},
      subway:{fill:'#30383a'},aerialways:{fill:'#666d6a',rail:'#252c2f',tie:'#554336'},
      transportationOther:{fill:'#8c775a',center:'#625640'},
      roadTunnels:{fill:'#30383a'},pathTunnels:{fill:'#30383a'},railTunnels:{fill:'#30383a'},
    }),
    surfaceFamilies:frozenCopy({
      waterSurface:{primitive:'area',assets:['waterAreas'],skin:'cooling-channel',fill:'#456b73',light:'#6f8d92',dark:'#304f57',edge:'#9eaaa3'},
      parkSurface:{primitive:'area',assets:['parks','landusePlayground'],skin:'soot-stained-common',small:'#626e5a',medium:'#5c6855',large:'#53614f',edge:'#31443a'},
      sportsSurface:{primitive:'area',assets:['landuseStadium','landusePitchTrack'],skin:'faded-industrial-field',fill:'#52664e',alternate:'#475b44',edge:'#394a38'},
    }),
  });

  // 前版の参照名は外部比較用に同じ凍結objectへ残す。
  const weatheredIndustrialDayZ14 = steampunkMegacityDayZ14;

  global.PixelMapWorldStyles = Object.freeze({
    version:VERSION,productionZ14Snapshot,productionComparisonZ14,retroJrpgZ14,
    steampunkMegacityDayZ14,weatheredIndustrialDayZ14,
  });
})(typeof window !== 'undefined' ? window : globalThis);
