import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window=globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/facility-resolver.js');
await import('../assets/poi-sprites.js');

const registry=globalThis.PixelMapAssetFamilyRegistry;
const resolver=globalThis.PixelMapFacilityResolver;
const catalog=globalThis.PixelMapPoiSprites;

const legacyExpected={
  railway:'station',bus:'bus',tram:'station',ferry:'station',aerialway:'station',harbor:'station',
  shop:'shop',mall:'mall',department_store:'mall',shopping_centre:'mall',clothing_store:'shop',alcohol_shop:'shop',convenience:'grocery',bakery:'grocery',grocery:'grocery',
  restaurant:'restaurant',fast_food:'fast_food',cafe:'cafe',bar:'bar',beer:'bar',ice_cream:'cafe',
  lodging:'hotel',hotel:'hotel',hospital:'hospital',doctors:'hospital',dentist:'hospital',veterinary:'hospital',pharmacy:'pharmacy',
  school:'school',college:'school',university:'school',kindergarten:'school',library:'library',
  bank:'bank',atm:'bank',money:'bank',post:'post',police:'police',fire_station:'fire_station',town_hall:'townhall',townhall:'townhall',
  place_of_worship:'place_of_worship',attraction:'attraction',monument:'monument',castle:'castle',art_gallery:'gallery',museum:'museum',
  theatre:'theatre',cinema:'cinema',music:'cinema',entertainment:'cinema',park:'park',garden:'park',playground:'park',dog_park:'park',pitch:'park',stadium:'park',golf:'park',swimming:'park',zoo:'zoo',
  parking:'parking',fuel:'parking',charging_station:'charge_hub',
};

test('AssetFamilyRegistryがpack→family→variant→assetを唯一の正本として公開する',()=>{
  assert.equal(registry.version,'pixelmap-asset-family-registry/6');
  assert.equal(registry.defaultPack,'legacy');
  assert.equal(registry.referencePack,'retro-jrpg-reference-v1');
  assert.ok(Object.isFrozen(registry.families));
  assert.ok(Object.isFrozen(registry.packs));
  for(const [type,assetId] of Object.entries(legacyExpected)){
    const binding=registry.bindingForType(type,'legacy');
    assert.equal(binding.assetId,assetId,type);
    assert.ok(registry.families[binding.familyId],`${type} family`);
    assert.equal(typeof binding.variantId,'string',`${type} variant`);
    assert.ok(Object.isFrozen(binding),`${type} frozen`);
  }
  assert.equal(Object.keys(registry.packFor('legacy').bindings).length,Object.keys(legacyExpected).length);
});

test('reference packは参照テイスト10点を意味variantへ接続し、未知packはlegacyへ安全に戻る',()=>{
  const referenceExpected={
    office:'office',town_hall:'civic_hall',fast_food:'burger_stand',railway:'grand_station',
    library:'owl_library',university:'university',college:'college',post:'wing_post',
    museum:'art_museum',zoo:'menagerie',
  };
  for(const [type,assetId] of Object.entries(referenceExpected))
    assert.equal(registry.bindingForType(type,registry.referencePack).assetId,assetId,type);
  assert.equal(registry.packFor('unknown').id,'legacy');
  assert.deepEqual(
    registry.resolvePoi({class:'shop',subclass:'bakery'},'unknown'),
    registry.resolvePoi({class:'shop',subclass:'bakery'},'legacy'),
  );
});

test('subclass優先・class fallback・generic fallbackが解決メタデータに残る',()=>{
  assert.deepEqual(registry.resolvePoi({class:'shop',subclass:'bakery'}),{
    version:registry.version,packId:'legacy',familyId:'food',variantId:'grocery',
    assetId:'grocery',matchedType:'bakery',fallback:false,
    fallbackKey:null,fallbackAllowed:false,fallbackReason:null,
  });
  assert.equal(registry.resolvePoi({class:'shop',subclass:'unknown'}).matchedType,'shop');
  assert.deepEqual(registry.resolvePoi({class:'unknown'}),{
    version:registry.version,packId:'legacy',familyId:'generic',variantId:'generic',
    assetId:'generic',matchedType:null,fallback:true,
    fallbackKey:'unknown',fallbackAllowed:false,fallbackReason:'unexpected-generic',
  });
});

test('resolverはfamily情報を保持し、全packのasset idは正本カタログに存在する',()=>{
  assert.equal(resolver.assetFamilyRegistryVersion,registry.version);
  assert.equal(resolver.spriteKeyFor({class:'railway'},registry.referencePack),'grand_station');
  const assetIds=new Set(catalog.assets.map(asset=>asset.id));
  for(const packId of Object.keys(registry.packs))
    for(const id of registry.assetsForPack(packId)) assert.ok(assetIds.has(id),`${packId}:${id}`);
});

test('resolveTile結果は既知subclass・class fallback・generic fallbackのfamily根拠を保持する',()=>{
  const pattern={
    scale:1,categoryScale:{},priority:['food','commerce','generic'],snap:16,offset:'none',
    areaM:10,areaL:50,heightM:10,heightL:30,maxAssets:1,gapScale:1,sameGapScale:1,
  };
  const poiFeature=(id,props,x,y)=>({id,type:1,props:{...props,rank:10},geom:[[[x,y]]]});
  const center={poi:{extent:4096,features:[
    poiFeature(1,{class:'shop',subclass:'bakery',name:'subclass'},400,400),
    poiFeature(2,{class:'shop',subclass:'unknown-shop',name:'class'},2000,2000),
    poiFeature(3,{class:'unknown',subclass:'unknown-poi',name:'generic'},3600,3600),
    poiFeature(4,{class:'office',name:'family-category'},400,3600),
    poiFeature(5,{class:'clinic',name:'fallback-category'},3600,400),
  ]}};
  const result=resolver.resolveTile({
    tileX:10,tileY:10,pattern,assetPack:registry.referencePack,
    getTile:(x,y)=>x===10&&y===10?{layers:center,baseX:10,baseY:10}:{empty:true},
  });
  const byName=Object.fromEntries(result.facilities.map(facility=>[facility.name,facility]));
  assert.deepEqual({
    assetPack:byName.subclass.assetPack,assetFamily:byName.subclass.assetFamily,
    assetVariant:byName.subclass.assetVariant,assetMatchedType:byName.subclass.assetMatchedType,
    assetFallback:byName.subclass.assetFallback,spriteKey:byName.subclass.spriteKey,
  },{
    assetPack:registry.referencePack,assetFamily:'food',assetVariant:'grocery',
    assetMatchedType:'bakery',assetFallback:false,spriteKey:'grocery',
  });
  assert.deepEqual({
    assetFamily:byName.class.assetFamily,assetVariant:byName.class.assetVariant,
    assetMatchedType:byName.class.assetMatchedType,assetFallback:byName.class.assetFallback,
    spriteKey:byName.class.spriteKey,
  },{
    assetFamily:'commerce',assetVariant:'shop',assetMatchedType:'shop',
    assetFallback:false,spriteKey:'shop',
  });
  assert.deepEqual({
    assetFamily:byName.generic.assetFamily,assetVariant:byName.generic.assetVariant,
    assetMatchedType:byName.generic.assetMatchedType,assetFallback:byName.generic.assetFallback,
    spriteKey:byName.generic.spriteKey,
  },{
    assetFamily:'generic',assetVariant:'generic',assetMatchedType:null,
    assetFallback:true,spriteKey:'generic',
  });
  assert.deepEqual({
    assetFamily:byName['family-category'].assetFamily,
    category:byName['family-category'].category,
    spriteKey:byName['family-category'].spriteKey,
    assetFallback:byName['family-category'].assetFallback,
  },{
    assetFamily:'commerce',category:'commerce',spriteKey:'office',assetFallback:false,
  });
  assert.deepEqual({
    assetFamily:byName['fallback-category'].assetFamily,
    category:byName['fallback-category'].category,
    spriteKey:byName['fallback-category'].spriteKey,
    assetFallback:byName['fallback-category'].assetFallback,
  },{
    assetFamily:'generic',category:'health',spriteKey:'generic',assetFallback:true,
  });
  const legacyResult=resolver.resolveTile({
    tileX:10,tileY:10,pattern,assetPack:'legacy',
    getTile:(x,y)=>x===10&&y===10?{layers:center,baseX:10,baseY:10}:{empty:true},
  });
  const legacyByName=Object.fromEntries(legacyResult.facilities.map(facility=>[facility.name,facility]));
  assert.deepEqual({
    assetFamily:legacyByName.subclass.assetFamily,
    category:legacyByName.subclass.category,
    spriteKey:legacyByName.subclass.spriteKey,
  },{assetFamily:'food',category:'food',spriteKey:'grocery'});
});

test('現行の共有実装はflatなCLASS2SPRITEを持たない',async()=>{
  const paths=['assets/facility-resolver.js','assets/poi-sprites.js','variants/map-02-refined.html'];
  for(const path of paths){
    const source=await readFile(new URL(`../${path}`,import.meta.url),'utf8');
    assert.doesNotMatch(source,/CLASS2SPRITE/,path);
  }
});

test('standaloneはACTIVE_ASSET_PACKをresolverへ渡し、map-03はlegacyを明示する',async()=>{
  const [map02,map03]=await Promise.all([
    readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8'),
    readFile(new URL('../variants/map-03-refined.html',import.meta.url),'utf8'),
  ]);
  assert.match(map02,/asset-family-registry\.js\?v=6/);
  assert.match(map02,/facility-resolver\.js\?v=7/);
  assert.match(map02,/const ACTIVE_ASSET_PACK = document\.documentElement\.dataset\.assetPack/);
  assert.match(map02,/RESOLVER\.resolveTile\(\{[\s\S]*?assetPack:ACTIVE_ASSET_PACK,[\s\S]*?\}\)/);
  assert.match(map03,/RESOLVER\.resolveTile\(\{[\s\S]*?assetPack:'legacy',[\s\S]*?\}\)/);
});

test('map診断はregistry versionとpack・family・variant・sprite・fallback集計を公開する',async()=>{
  const map02=await readFile(new URL('../variants/map-02-refined.html',import.meta.url),'utf8');
  assert.match(map02,/assetFamilyRegistryVersion:RESOLVER\.assetFamilyRegistryVersion/);
  assert.match(map02,/assetPacks:countBy\(facilitiesInView, item => item\.assetPack/);
  assert.match(map02,/assetFamilies:countBy\(facilitiesInView, item => item\.assetFamily/);
  assert.match(map02,/assetVariants:countBy\(facilitiesInView, item => item\.assetVariant/);
  assert.match(map02,/spriteAssets:countBy\(facilitiesInView, item => item\.spriteKey/);
  assert.match(map02,/assetFallbacks:poiFallbackFacilities\.length/);
});
