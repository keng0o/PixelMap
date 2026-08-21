((global) => {
  'use strict';

  /*
    PixelMap Asset Family Registry v2
    ---------------------------------
    MVTのclass/subclassを直接sprite idへ結び付けず、
    asset pack → semantic family → variant → asset の順で解決する正本。
    source geometry・座標・表示密度には関与しない。
  */
  const VERSION = 'pixelmap-asset-family-registry/2';
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

  const legacyBindings = buildBindings(bindingSpecs);
  const packs = Object.freeze({
    [LEGACY_PACK]:Object.freeze({
      id:LEGACY_PACK,label:'従来互換',extends:null,bindings:legacyBindings,
    }),
    [REFERENCE_PACK]:Object.freeze({
      id:REFERENCE_PACK,label:'レトロJRPG参照テイスト',extends:LEGACY_PACK,
      bindings:buildBindings(referenceBindingSpecs,referenceAssetOverrides),
    }),
  });
  const genericBinding = Object.freeze({
    type:'generic',familyId:'generic',variantId:'generic',assetId:'generic',
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

  global.PixelMapAssetFamilyRegistry = Object.freeze({
    version:VERSION,
    defaultPack:LEGACY_PACK,
    referencePack:REFERENCE_PACK,
    families,
    packs,
    packFor,
    bindingForType,
    resolvePoi,
    typesForAsset,
    assetsForPack,
  });
})(typeof window !== 'undefined' ? window : globalThis);
