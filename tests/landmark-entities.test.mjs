import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../assets/landmark-entities.js';

const API = globalThis.PixelMapLandmarkEntities;
const generated = JSON.parse(await readFile(
  new URL('../data/landmarks/kanagawa.generated.geojson', import.meta.url), 'utf8'));
const overrides = JSON.parse(await readFile(
  new URL('../data/landmarks/kanagawa.overrides.json', import.meta.url), 'utf8'));
const collection = API.mergeOverrides(generated, overrides);
const mapHtml = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const builderSource = await readFile(new URL('../scripts/build-landmark-entities.mjs', import.meta.url), 'utf8');

test('神奈川県ランドマークGeoJSONは県域と川崎の対象施設を保持する', () => {
  assert.deepEqual(collection.properties.scope, { type:'administrative_area', name:'神奈川県' });
  assert.equal(collection.properties.min_parent_area_m2, 1000);
  assert.ok(collection.features.length >= 100);
  const parent = collection.features.find(feature => feature.properties.id === 'way/690489941');
  const club = collection.features.find(feature => feature.properties.name === "CLUB CITTA'");
  const cinema = collection.features.find(feature => feature.properties['name:ja'] === 'チネチッタ');
  const lazona = collection.features.find(feature => feature.properties.id === 'way/689642930');
  assert.equal(parent.properties.id, 'way/690489941');
  assert.equal(parent.geometry.type, 'Polygon');
  assert.equal(lazona.properties.name, 'ラゾーナ川崎プラザ');
  assert.ok(lazona.properties.area_m2 > 70000);
  assert.equal(club.properties.parent_id, parent.properties.id);
  assert.equal(club.properties.independent_building, true);
  assert.equal(cinema.geometry.type, 'Point');
  assert.equal(API.geometryContains(parent.geometry, API.anchorOf(club)), true);
  assert.equal(API.geometryContains(parent.geometry, API.anchorOf(cinema)), true);
});

test('1,000㎡以上の施設敷地と面積制限なしの高層建物を収集する', () => {
  const retailBuilding = collection.features.find(feature => feature.properties.id === 'relation/12409962');
  const supermarket = collection.features.find(feature => feature.properties.id === 'way/500438995');
  const wholesale = collection.features.find(feature => feature.properties.id === 'way/255221083');
  const commercial = collection.features.find(feature => feature.properties.id === 'way/819656084');
  const park = collection.features.find(feature => feature.properties.id === 'way/29178626');
  const temple = collection.features.find(feature => feature.properties.id === 'way/29178625');
  const newlyEligible = collection.features.find(feature => feature.properties.id === 'way/494991675');
  const highrise = collection.features.find(feature => feature.properties.id === 'way/936707032');
  const jrKawasakiTowerCommercial = collection.features.find(feature => feature.properties.id === 'way/936707031');
  const levelsHighrise = collection.features.find(feature => feature.properties.id === 'way/220991441');
  const smallHighrise = collection.features.find(feature => feature.properties.id === 'way/1107873562');
  const kawasakiSubstation = collection.features.find(feature => feature.properties.id === 'way/81844460');
  const wataridaSubstation = collection.features.find(feature => feature.properties.id === 'way/86220796');
  const unnamedFacility = collection.features.find(feature =>
    feature.properties.collection_group === 'facility' && !feature.properties.name);
  assert.equal(retailBuilding.properties.building, 'retail');
  assert.equal(retailBuilding.properties.collection_group, 'retail');
  assert.equal(supermarket.properties.shop, 'supermarket');
  assert.equal(supermarket.properties.collection_group, 'retail');
  assert.equal(wholesale.properties.shop, 'wholesale');
  assert.equal(wholesale.properties.collection_group, 'retail');
  assert.equal(commercial.properties.landuse, 'commercial');
  assert.equal(commercial.properties.collection_group, 'commercial');
  assert.equal(park.properties.name, '大師公園');
  assert.equal(park.properties.leisure, 'park');
  assert.equal(park.properties.collection_group, 'park');
  assert.equal(park.properties.display_mode, 'symbol');
  assert.equal(temple.properties.name, '川崎大師');
  assert.equal(temple.properties.amenity, 'place_of_worship');
  assert.equal(temple.properties.religion, 'buddhist');
  assert.equal(temple.properties.collection_group, 'religious');
  assert.equal(temple.properties.display_mode, 'symbol');
  assert.ok(newlyEligible.properties.area_m2 >= 3000 && newlyEligible.properties.area_m2 < 5000);
  assert.equal(highrise.properties.name, 'JR川崎タワー オフィス棟');
  assert.equal(highrise.properties.collection_group, 'highrise');
  assert.equal(highrise.properties.area_m2 >= 1000, true);
  assert.equal(highrise.properties.height_m, 135);
  assert.equal(highrise.properties.highrise_rule, 'height');
  assert.equal(highrise.properties.minzoom, 12);
  assert.equal(jrKawasakiTowerCommercial.properties.name, 'JR川崎タワー 商業棟');
  assert.equal(jrKawasakiTowerCommercial.properties.collection_group, 'commercial');
  assert.ok(jrKawasakiTowerCommercial.properties.area_m2 >= 2000 &&
    jrKawasakiTowerCommercial.properties.area_m2 < 3000);
  assert.equal(levelsHighrise.properties.area_m2 >= 1000, true);
  assert.equal(levelsHighrise.properties.height_m < 30, true);
  assert.equal(levelsHighrise.properties.building_levels, 9);
  assert.equal(levelsHighrise.properties.highrise_rule, 'building:levels');
  assert.equal(smallHighrise.properties.name, 'イセザキカザマビル');
  assert.equal(smallHighrise.properties.area_m2 < 1000, true);
  assert.equal(smallHighrise.properties.height_m >= 30, true);
  assert.equal(smallHighrise.properties.collection_group, 'highrise');
  assert.equal(kawasakiSubstation.properties.name, '川崎変電所');
  assert.equal(kawasakiSubstation.properties.collection_group, 'facility');
  assert.equal(kawasakiSubstation.properties.power, 'substation');
  assert.equal(kawasakiSubstation.properties.facility_tag_key, 'power');
  assert.equal(kawasakiSubstation.properties.facility_tag_value, 'substation');
  assert.equal(kawasakiSubstation.properties.label_enabled, false);
  assert.ok(kawasakiSubstation.properties.area_m2 > 48000);
  assert.equal(wataridaSubstation.properties.collection_group, 'facility');
  assert.ok(wataridaSubstation.properties.area_m2 >= 1000 &&
    wataridaSubstation.properties.area_m2 < 2000);
  assert.ok(unnamedFacility.properties.area_m2 >= 1000);
  assert.equal(unnamedFacility.properties.label_enabled, false);
  assert.ok(collection.features
    .filter(feature => feature.properties.role === 'complex')
    .filter(feature => feature.properties.collection_group !== 'highrise')
    .every(feature => feature.properties.area_m2 >= 1000));
  assert.deepEqual(collection.properties.highrise_thresholds, {
    min_height_m:30,
    min_building_levels:8,
  });
  assert.ok(collection.features.filter(feature =>
    feature.properties.collection_group === 'highrise').length >= 1000);
  assert.equal(collection.features.filter(feature =>
    feature.properties['name:ja'] === '川崎市役所本庁舎').length, 1);
  assert.match(builderSource, /args\['min-parent-area'\] \|\| 1000/);
  assert.doesNotMatch(builderSource, /min-highrise-area/);
  assert.match(builderSource, /args\['min-highrise-height'\] \|\| 30/);
  assert.match(builderSource, /args\['min-highrise-levels'\] \|\| 8/);
  assert.match(builderSource, /shopping_centre\|supermarket\|wholesale/);
  assert.match(builderSource, /building"="retail/);
  assert.match(builderSource, /building"="commercial/);
  assert.match(builderSource, /landuse"="commercial/);
  assert.match(builderSource, /leisure"="park/);
  assert.match(builderSource, /landuse"="religious/);
  assert.match(builderSource, /amenity"="place_of_worship/);
  assert.match(builderSource, /building"~"\^\(temple\|shrine\)\$/);
  assert.match(builderSource, /is_number\(t\["height"\]\)/);
  assert.match(builderSource, /is_number\(t\["building:levels"\]\)/);
  assert.match(builderSource, /function heightMeters\(value\)/);
  assert.match(builderSource, /const baseGeneratedPath/);
  assert.match(builderSource, /const genericFacilityKeys/);
  assert.match(builderSource, /power:\['substation','plant','generator'\]/);
  assert.match(builderSource, /if \(first\[0\] !== last\[0\] \|\| first\[1\] !== last\[1\]\) return null/);
  assert.match(builderSource, /isFacilityParent/);
  assert.match(builderSource, /facility_tag_key/);
});

test('高層建物は高さに応じて表示開始ズームを分ける', () => {
  const highrises = collection.features.filter(feature =>
    feature.properties.collection_group === 'highrise');
  assert.ok(highrises.every(feature => [12,13,14].includes(feature.properties.minzoom)));
  assert.ok(highrises.filter(feature => feature.properties.minzoom === 12).length >= 100);
  assert.ok(highrises.filter(feature => feature.properties.minzoom === 14).length >= 100);
  const z12 = new Set(API.selectForZoom(collection, 12).features.map(feature => feature.properties.id));
  const z14 = new Set(API.selectForZoom(collection, 14).features.map(feature => feature.properties.id));
  assert.equal(z12.has('way/936707032'), true);
  assert.equal(z12.has('way/220991441'), false);
  assert.equal(z14.has('way/220991441'), true);
});

test('公園と神社仏閣はz13から敷地全体を建物化せず施設記号で選ばれる', () => {
  const z13 = API.selectForZoom(collection, 13).features;
  const park = z13.find(feature => feature.properties.id === 'way/29178626');
  const temple = z13.find(feature => feature.properties.id === 'way/29178625');
  assert.equal(park.properties.render_class, 'park');
  assert.equal(park.properties.category, 'nature');
  assert.equal(park.properties.display_mode, 'symbol');
  assert.equal(temple.properties.render_class, 'place_of_worship');
  assert.equal(temple.properties.category, 'landmark');
  assert.equal(temple.properties.display_mode, 'symbol');
});

test('親子関係は子施設の代表点を含む最小の複合施設から導出できる', () => {
  const targetIds = new Set(['way/690489941','way/158883031','node/995971596']);
  const withoutParentIds = {
    type:'FeatureCollection',
    features:structuredClone(collection.features.filter(feature => targetIds.has(feature.properties.id))),
  };
  for (const feature of withoutParentIds.features){
    if (feature.properties.role !== 'complex') delete feature.properties.parent_id;
  }
  const compiled = API.deriveHierarchy(withoutParentIds);
  const children = compiled.features.filter(feature => feature.properties.role === 'venue_candidate');
  assert.ok(children.length >= 2);
  assert.ok(children.every(feature => feature.properties.parent_id === 'way/690489941'));
});

test('z14では1,000㎡以上の親ごとに代表館内施設を選ぶ', () => {
  const result = API.selectForZoom(collection, 14);
  const selected = new Set(result.features.map(feature => feature.properties.name));
  assert.equal(selected.has('ラゾーナ川崎プラザ'), true);
  assert.equal(selected.has('ラチッタデッラ'), true);
  assert.equal(selected.has("CLUB CITTA'"), true);
  assert.equal(result.features.some(feature => feature.properties['name:ja'] === 'チネチッタ'), true);
  assert.equal(result.features.find(feature => feature.properties['name:ja'] === 'チネチッタ')
    .properties.parent_id, 'way/85798570');
});

test('ズーム別に親施設、代表子施設、詳細施設を段階表示する', () => {
  const z13 = new Set(API.selectForZoom(collection, 13).features.map(feature => feature.properties.name));
  const z16 = new Set(API.selectForZoom(collection, 16).features.map(feature => feature.properties.name));
  assert.equal(z13.has('ラゾーナ川崎プラザ'), true);
  assert.equal(z13.has('ラチッタデッラ'), true);
  assert.equal(z13.has("CLUB CITTA'"), false);
  assert.equal(z16.has("CLUB CITTA'"), true);
  assert.equal(z16.has('Cinecittà'), true);
});

test('overrideは生成データを変更せず別名とOSM形状中心を実行時に重ねる', () => {
  const source = generated.features.find(feature => feature.properties.id === 'way/690489941');
  const merged = collection.features.find(feature => feature.properties.id === 'way/690489941');
  const club = collection.features.find(feature => feature.properties.id === 'way/158883031');
  assert.equal(source.properties.aliases, undefined);
  assert.ok(merged.properties.aliases.includes('ラ チッタデッラ'));
  assert.deepEqual(merged.properties.icon_anchor, [139.6977663, 35.5281594]);
  assert.deepEqual(club.properties.icon_anchor, [139.6972369, 35.5278097]);
  assert.equal(API.geometryContains(merged.geometry, merged.properties.icon_anchor), true);
  assert.equal(API.geometryContains(club.geometry, club.properties.icon_anchor), true);
  assert.equal(merged.properties.icon_anchor_candidates, undefined);
  assert.equal(collection.properties.overrides_schema, 'pixelmap-landmark-overrides/1');
});

test('ランドマーク処理はstandaloneと1・2・4マップの全Webページで有効になる', () => {
  assert.match(mapHtml, /const STANDALONE_LANDMARK_MODE = true;/);
  assert.match(mapHtml, /data\/landmarks\/kanagawa\.generated\.geojson/);
  assert.match(mapHtml, /data\/landmarks\/kanagawa\.overrides\.json/);
  assert.match(mapHtml, /LANDMARK_ENTITY_API\.mergeOverrides\(generated, overrides\)/);
  assert.match(mapHtml, /applyStandaloneLandmarks\(collectResolvedFacilities\(\)\)/);
  assert.match(mapHtml, /if \(!STANDALONE_LANDMARK_MODE\)/);
  assert.match(mapHtml, /landmarks:resolvedView\.landmarks/);
  assert.match(mapHtml, /id="tglCommercialLandmarks" data-category-item/);
  assert.match(mapHtml, /commercialLandmarkControl\.hidden = !STANDALONE_LANDMARK_MODE/);
  assert.match(mapHtml, /feature\.properties\.collection_group !== 'commercial' \|\| commercialEnabled/);
  assert.match(mapHtml, /dataset\.commercialLandmarks = commercialLandmarkToggle\.checked \? 'on' : 'off'/);
  assert.match(mapHtml, /feature\.properties\?\.display_mode !== 'symbol'/);
  assert.match(mapHtml, /landmarkDisplay:props\.display_mode \|\| 'building'/);
  assert.match(mapHtml, /labelEnabled:props\.label_enabled !== false/);
  assert.match(mapHtml, /p\.labelEnabled !== false && featureName\(p\.props\)/);
  assert.match(mapHtml, /renderer:facility\.landmarkDisplay === 'symbol' \? 'solid-facility-marker'/);
  assert.match(mapHtml, /geometrySource:facility\.collectionGroup === 'facility'[\s\S]*'precollected-facility-footprint'/);
  assert.match(mapHtml, /drawnIcons\.filter\(item => item\.landmarkDisplay === 'symbol'\)/);
});

test('施設はランドマークと汎用施設敷地の全棟を既存建物と同じ見た目で描く', () => {
  assert.match(mapHtml, /const NON_FACILITY_SITE_CLASSES = new Set/);
  assert.match(mapHtml, /function facilityMatchesSite\(facility, site\)[\s\S]*facility\.assetFamily === family/);
  assert.match(mapHtml, /function facilitySiteContainsGridPoint\(site, point\)/);
  assert.match(mapHtml, /const splitPolygonUnits = feature =>/);
  assert.match(mapHtml, /if \(STANDALONE_LANDMARK_MODE\)\{[\s\S]*const facilitySiteGroups = new Map\(\)/);
  assert.match(mapHtml, /count >= Math\.max\(1, Math\.ceil\(bldArea\[buildingId\] \* \.5\)\)/);
  assert.match(mapHtml, /matchedStandaloneFacilities\.has\(item\)/);
  assert.match(mapHtml, /const poiSourceFacilities = STANDALONE_LANDMARK_MODE[\s\S]*facilitiesInView\.filter\(isStandaloneBuildingFacility\)/);
  assert.match(mapHtml, /const facilityBuildingTargets = STANDALONE_LANDMARK_MODE[\s\S]*facilitiesInView\.filter\(item => !item\.landmarkEntity\)/);
  assert.match(mapHtml, /const activeFeatures = selection\.collection\.features\.filter\(activeLandmarkAtZoom\)/);
  assert.match(mapHtml, /if \(feature\.properties\.parent_id\)[\s\S]*contextParentIds\.has\(feature\.properties\.parent_id\)/);
  assert.match(mapHtml, /function rasterizeStandaloneLandmarkBuildings\(features, worldToGridPoint, gridSize\)/);
  assert.match(mapHtml, /featureCollectionGroups\[bi\] = props\.collection_group \|\| null/);
  assert.match(mapHtml, /function matchStandaloneLandmarksToSourceBuildings\([\s\S]*sourceBuildingGrid, sourceBldGrid/);
  assert.match(mapHtml, /buildingKinds:sourceBuildingKinds[\s\S]*buildingDescs:sourceBuildingDescs[\s\S]*bldStyle:sourceBldStyle/);
  assert.match(mapHtml, /facilityBuildingTargets, unitByRingKey,[\s\S]*facility => worldToGridPoint\(facility\.worldX, facility\.worldY\),[\s\S]*facilitySites/);
  assert.match(mapHtml, /owners\.sort\(\(a, b\) => compareFacilitySiteOwners\(a, b, site\)\)/);
  assert.match(mapHtml, /siteBuildingIds\.has\(facilitySourceBuildingIds\.get\(facility\)\)/);
  assert.match(mapHtml, /for \(const buildingId of site\.buildingIds\)/);
  assert.match(mapHtml, /featureCollectionGroups\?\.\[featureId\] === 'facility'[\s\S]*facilityFootprintGrid\[index\] = ID\.BLD/);
  const facilityFootprintLayer = mapHtml.indexOf("source:'facility-site-footprints'");
  const matchedBuildingLayer = mapHtml.indexOf("source:'map-buildings'", facilityFootprintLayer);
  assert.ok(facilityFootprintLayer >= 0 && matchedBuildingLayer > facilityFootprintLayer,
    '施設敷地を先に描き、MVT建物を後から重ねる');
  assert.match(mapHtml, /function drawStandaloneLandmarkBuildings\(\)/);
  assert.match(mapHtml, /for \(const layer of landmark\.layers\)[\s\S]*drawCellPixelArtBuildingGrid\([\s\S]*layer\.grid, layer\.bldGrid/);
  assert.match(mapHtml, /source:STANDALONE_LANDMARK_MODE \? 'landmarks-facility-sites'/);
  assert.match(mapHtml, /matchedFacilitySiteClasses:landmarkBuildingRaster\?\.matchedFacilitySiteClasses/);
  assert.match(mapHtml, /facilityFootprintFeatures:landmarkBuildingRaster\?\.facilityFootprintFeatures/);
  assert.match(mapHtml, /renderer:STANDALONE_LANDMARK_MODE \? 'matched-map-building'/);
  assert.match(mapHtml, /'building-footprint'/);
  assert.match(mapHtml, /'precollected-landmark-building'/);
  assert.match(mapHtml, /if \(STANDALONE_UNIFIED_STYLE && o\.poi && !STANDALONE_LANDMARK_MODE\)/);
});

test('事前収集施設はPOIアセットを使わず建物形状または単色マーカーで描く', () => {
  const makeStart = mapHtml.indexOf('function makeLandmarkFacility');
  const makeEnd = mapHtml.indexOf('\nfunction applyStandaloneLandmarks', makeStart);
  const makeLandmarkSource = mapHtml.slice(makeStart, makeEnd);
  assert.doesNotMatch(makeLandmarkSource, /RESOLVER\.resolveAsset|assetCollisionGeometry|spriteKey/);
  assert.match(makeLandmarkSource, /symbolSource:'solid-facility-marker'/);
  assert.match(makeLandmarkSource, /semanticRole:'marker'/);

  const drawStart = mapHtml.indexOf('function drawStandaloneLandmarkBuildings');
  const drawEnd = mapHtml.indexOf('\n  const labelPoint', drawStart);
  const drawLandmarkSource = mapHtml.slice(drawStart, drawEnd);
  assert.match(mapHtml, /function drawStandaloneFacilityMarker\(item\)/);
  assert.match(drawLandmarkSource, /drawStandaloneFacilityMarker\(p\)/);
  assert.doesNotMatch(drawLandmarkSource, /drawSprite\(|spriteFor\(|drawCellSprite\(/);
});
