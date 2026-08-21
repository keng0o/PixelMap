((global) => {
  'use strict';

  /*
    PixelMap Asset Family Registry v3
    ---------------------------------
    MVTのclass/subclassを直接sprite idへ結び付けず、
    asset pack → semantic family → variant → asset の順で解決する正本。
    source geometry・座標・表示密度には関与しない。
  */
  const VERSION = 'pixelmap-asset-family-registry/3';
  const LEGACY_PACK = 'legacy';
  const REFERENCE_PACK = 'retro-jrpg-reference-v1';

  const families = Object.freeze({
    transitFacility:Object.freeze({id:'transitFacility',label:'交通施設',category:'transit'}),
    commerce:Object.freeze({id:'commerce',label:'商業施設',category:'commerce'}),
    food:Object.freeze({id:'food',label:'飲食施設',category:'food'}),
    lodging:Object.freeze({id:'lodging',label:'宿泊施設',category:'stay'}),
    healthcare:Object.freeze({id:'healthcare',label:'医療施設',category:'health'}),
    education:Object.freeze({id:'education',label:'教育施設',category:'civic'}),
    finance:Object.freeze({id:'finance',label:'金融施設',category:'civic'}),
    civic:Object.freeze({id:'civic',label:'公共施設',category:'civic'}),
    worship:Object.freeze({id:'worship',label:'宗教施設',category:'landmark'}),
    culture:Object.freeze({id:'culture',label:'文化・観光施設',category:'landmark'}),
    parkLeisure:Object.freeze({id:'parkLeisure',label:'公園・レジャー施設',category:'nature'}),
    mobilityService:Object.freeze({id:'mobilityService',label:'移動サービス',category:'service'}),
    generic:Object.freeze({id:'generic',label:'その他施設',category:'generic'}),
  });
  const corridorFamilies = Object.freeze({
    road:Object.freeze({id:'road',label:'道路',category:'transport'}),
    path:Object.freeze({id:'path',label:'歩行・作業路',category:'transport'}),
    rail:Object.freeze({id:'rail',label:'軌道交通',category:'transport'}),
    waterTransit:Object.freeze({id:'waterTransit',label:'水上交通',category:'transport'}),
    other:Object.freeze({id:'other',label:'その他交通',category:'transport'}),
  });

  const bindingSpecs = Object.freeze([
    ['transitFacility','station','station',['railway']],
    ['transitFacility','busStop','bus',['bus']],
    ['transitFacility','tramStop','station',['tram']],
    ['transitFacility','ferryTerminal','station',['ferry']],
    ['transitFacility','aerialwayStation','station',['aerialway']],
    ['transitFacility','harbor','station',['harbor']],
    ['commerce','shop','shop',['shop','clothing_store','alcohol_shop']],
    ['commerce','mall','mall',['mall','department_store','shopping_centre']],
    ['food','grocery','grocery',['convenience','bakery','grocery']],
    ['food','restaurant','restaurant',['restaurant']],
    ['food','fastFood','fast_food',['fast_food']],
    ['food','cafe','cafe',['cafe','ice_cream']],
    ['food','bar','bar',['bar','beer']],
    ['lodging','hotel','hotel',['lodging','hotel']],
    ['healthcare','hospital','hospital',['hospital']],
    ['healthcare','doctor','hospital',['doctors']],
    ['healthcare','dentist','hospital',['dentist']],
    ['healthcare','veterinary','hospital',['veterinary']],
    ['healthcare','pharmacy','pharmacy',['pharmacy']],
    ['education','school','school',['school']],
    ['education','college','school',['college']],
    ['education','university','school',['university']],
    ['education','kindergarten','school',['kindergarten']],
    ['education','library','library',['library']],
    ['finance','bank','bank',['bank','atm','money']],
    ['civic','post','post',['post']],
    ['civic','police','police',['police']],
    ['civic','fireStation','fire_station',['fire_station']],
    ['civic','townHall','townhall',['town_hall','townhall']],
    ['worship','placeOfWorship','place_of_worship',['place_of_worship']],
    ['culture','attraction','attraction',['attraction']],
    ['culture','monument','monument',['monument']],
    ['culture','castle','castle',['castle']],
    ['culture','gallery','gallery',['art_gallery']],
    ['culture','museum','museum',['museum']],
    ['culture','theatre','theatre',['theatre']],
    ['culture','cinema','cinema',['cinema','music','entertainment']],
    ['parkLeisure','park','park',['park','garden','playground','dog_park','pitch','stadium','golf','swimming']],
    ['parkLeisure','zoo','zoo',['zoo']],
    ['mobilityService','parking','parking',['parking','fuel']],
    ['mobilityService','chargeHub','charge_hub',['charging_station']],
  ]);
  const referenceBindingSpecs = Object.freeze([
    ...bindingSpecs,
    ['commerce','office','office',['office']],
  ]);
  const referenceAssetOverrides = Object.freeze({
    'transitFacility.station':'grand_station',
    'food.fastFood':'burger_stand',
    'education.college':'college',
    'education.university':'university',
    'education.library':'owl_library',
    'civic.post':'wing_post',
    'civic.townHall':'civic_hall',
    'culture.museum':'art_museum',
    'parkLeisure.zoo':'menagerie',
  });
  // 並び順はOpenMapTiles属性が複数ある場合の意味優先度でもある。
  const corridorBindingSpecs = Object.freeze([
    ['rail','subway','subway',['subway']],
    ['rail','aerialway','aerialways',[
      'aerialway','cable_car','gondola','chair_lift','mixed_lift','drag_lift','t-bar','j-bar',
      'platter','rope_tow','zip_line','magic_carpet',
    ]],
    ['waterTransit','ferry','ferries',['ferry']],
    ['road','raceway','raceways',['raceway']],
    ['path','track','tracks',['track']],
    ['path','footpath','paths',['path','pedestrian','footway','cycleway','steps','bridleway','corridor','platform']],
    ['rail','mainline','rail',['rail','railway','narrow_gauge','preserved','funicular']],
    ['rail','lightRail','rail',['light_rail','tram']],
    ['rail','monorail','rail',['monorail']],
    ['rail','undergroundTransit','subway',['transit']],
    ['path','pier','piers',['pier']],
    ['road','motorway','motorways',['motorway']],
    ['road','major','majorRoads',['trunk','primary']],
    ['road','regional','regionalRoads',['secondary','tertiary']],
    ['road','local','localRoads',['minor','service','busway','bus_guideway']],
  ]);

  function buildBindings(specs, assetOverrides = {}){
    const bindings = {};
    for (const [familyId, variantId, defaultAssetId, types] of specs){
      if (!families[familyId]) throw new Error(`Unknown asset family: ${familyId}`);
      const assetId = assetOverrides[`${familyId}.${variantId}`] || defaultAssetId;
      for (const type of types){
        if (bindings[type]) throw new Error(`Duplicate asset family type: ${type}`);
        bindings[type] = Object.freeze({type,familyId,variantId,assetId});
      }
    }
    return Object.freeze(bindings);
  }
  function buildCorridorBindings(specs){
    const bindings={};
    const priority=[];
    for(const [familyId,variantId,assetId,types] of specs){
      if(!corridorFamilies[familyId]) throw new Error(`Unknown corridor family: ${familyId}`);
      for(const type of types){
        if(bindings[type]) throw new Error(`Duplicate corridor family type: ${type}`);
        bindings[type]=Object.freeze({type,familyId,variantId,assetId});
        priority.push(type);
      }
    }
    return Object.freeze({bindings:Object.freeze(bindings),priority:Object.freeze(priority)});
  }

  const legacyBindings = buildBindings(bindingSpecs);
  const sharedCorridorBindings = buildCorridorBindings(corridorBindingSpecs);
  const packs = Object.freeze({
    [LEGACY_PACK]:Object.freeze({
      id:LEGACY_PACK,label:'従来互換',extends:null,bindings:legacyBindings,
      corridorBindings:sharedCorridorBindings.bindings,
      corridorPriority:sharedCorridorBindings.priority,
    }),
    [REFERENCE_PACK]:Object.freeze({
      id:REFERENCE_PACK,label:'レトロJRPG参照テイスト',extends:LEGACY_PACK,
      bindings:buildBindings(referenceBindingSpecs,referenceAssetOverrides),
      corridorBindings:sharedCorridorBindings.bindings,
      corridorPriority:sharedCorridorBindings.priority,
    }),
  });
  const genericBinding = Object.freeze({
    type:'generic',familyId:'generic',variantId:'generic',assetId:'generic',
  });
  const genericCorridorBinding = Object.freeze({
    type:'other',familyId:'other',variantId:'other',assetId:'transportationOther',
  });

  function packFor(packId){
    return packs[packId] || packs[LEGACY_PACK];
  }
  function bindingForType(type, packId = LEGACY_PACK){
    if (!type) return null;
    return packFor(packId).bindings[String(type)] || null;
  }
  function resolvePoi(props = {}, packId = LEGACY_PACK){
    const pack = packFor(packId);
    const candidates = [props.subclass,props.class].filter(Boolean);
    let binding = null, matchedType = null;
    for (const type of candidates){
      binding = pack.bindings[type] || null;
      if (binding){ matchedType=String(type); break; }
    }
    const selected = binding || genericBinding;
    return Object.freeze({
      version:VERSION,
      packId:pack.id,
      familyId:selected.familyId,
      variantId:selected.variantId,
      assetId:selected.assetId,
      matchedType,
      fallback:!binding,
    });
  }
  const normalizeCorridorType = value => String(value || '').replace(/_construction$/, '');
  function resolveCorridor(props = {}, packId = LEGACY_PACK){
    const pack=packFor(packId);
    const rawClass=String(props.class || '');
    const rawSubclass=String(props.subclass || '');
    const rawTypes=rawClass === 'bridge' ? [rawSubclass] : [rawClass,rawSubclass];
    const candidates=new Set(rawTypes.filter(Boolean).map(normalizeCorridorType));
    let binding=null,matchedType=null;
    for(const type of pack.corridorPriority){
      if(!candidates.has(type)) continue;
      binding=pack.corridorBindings[type];matchedType=type;break;
    }
    const selected=binding || genericCorridorBinding;
    const tunnel=props.brunnel === 'tunnel';
    const construction=rawTypes.some(type=>/_construction$/.test(type));
    const underground=tunnel || selected.assetId === 'subway' || Number(props.layer) < 0;
    const service=matchedType === 'service' || Boolean(props.service);
    let stateAssetId=selected.assetId;
    if(tunnel && selected.assetId !== 'subway'){
      if(selected.familyId === 'road' || selected.familyId === 'other') stateAssetId='roadTunnels';
      else if(selected.familyId === 'path') stateAssetId='pathTunnels';
      else if(selected.familyId === 'rail') stateAssetId='railTunnels';
    }
    const modifiers=Object.freeze({construction,tunnel,underground,service});
    return Object.freeze({
      version:VERSION,packId:pack.id,familyId:selected.familyId,variantId:selected.variantId,
      assetId:selected.assetId,stateAssetId,matchedType,modifiers,fallback:!binding,
    });
  }
  function typesForAsset(assetId, packId = null){
    const selectedPacks = packId ? [packFor(packId)] : Object.values(packs);
    const types = new Set();
    for (const pack of selectedPacks)
      for (const binding of Object.values(pack.bindings))
        if (binding.assetId === assetId) types.add(binding.type);
    return Object.freeze([...types].sort());
  }
  function assetsForPack(packId = LEGACY_PACK){
    return Object.freeze([...new Set(Object.values(packFor(packId).bindings)
      .map(binding => binding.assetId).concat('generic'))].sort());
  }
  function corridorTypesForAsset(assetId, packId = null){
    const selectedPacks=packId ? [packFor(packId)] : Object.values(packs);
    const types=new Set();
    for(const pack of selectedPacks)
      for(const binding of Object.values(pack.corridorBindings))
        if(binding.assetId === assetId) types.add(binding.type);
    return Object.freeze([...types].sort());
  }
  function corridorAssetsForPack(packId = LEGACY_PACK){
    const pack=packFor(packId);
    return Object.freeze([...new Set(Object.values(pack.corridorBindings)
      .map(binding=>binding.assetId).concat('transportationOther','roadTunnels','pathTunnels','railTunnels'))].sort());
  }
  function corridorFamilyIdsForAsset(assetId, packId = LEGACY_PACK){
    const stateFamilies={
      transportationOther:['other'],roadTunnels:['road','other'],pathTunnels:['path'],railTunnels:['rail'],
    };
    if(stateFamilies[assetId]) return Object.freeze([...stateFamilies[assetId]]);
    const familiesForAsset=new Set();
    for(const binding of Object.values(packFor(packId).corridorBindings))
      if(binding.assetId === assetId) familiesForAsset.add(binding.familyId);
    return Object.freeze([...familiesForAsset].sort());
  }

  global.PixelMapAssetFamilyRegistry = Object.freeze({
    version:VERSION,
    defaultPack:LEGACY_PACK,
    referencePack:REFERENCE_PACK,
    families,
    corridorFamilies,
    packs,
    packFor,
    bindingForType,
    resolvePoi,
    resolveCorridor,
    typesForAsset,
    assetsForPack,
    corridorTypesForAsset,
    corridorAssetsForPack,
    corridorFamilyIdsForAsset,
  });
})(typeof window !== 'undefined' ? window : globalThis);
