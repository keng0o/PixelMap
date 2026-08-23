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

test('神奈川県ランドマークGeoJSONは県域と川崎の対象施設を保持する', () => {
  assert.deepEqual(collection.properties.scope, { type:'administrative_area', name:'神奈川県' });
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

test('z14では複合施設と最大の独立建物CLUB CITTAだけを選ぶ', () => {
  const result = API.selectForZoom(collection, 14);
  const selected = new Set(result.features.map(feature => feature.properties.name));
  assert.equal(selected.has('ラゾーナ川崎プラザ'), true);
  assert.equal(selected.has('ラチッタデッラ'), true);
  assert.equal(selected.has("CLUB CITTA'"), true);
  assert.equal(result.features.some(feature => feature.properties['name:ja'] === 'チネチッタ'), false);
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

test('ランドマーク処理は単体ページだけで有効になり共有iframeを変えない', () => {
  assert.match(mapHtml, /const STANDALONE_LANDMARK_MODE = !EMBEDDED;/);
  assert.match(mapHtml, /data\/landmarks\/kanagawa\.generated\.geojson/);
  assert.match(mapHtml, /data\/landmarks\/kanagawa\.overrides\.json/);
  assert.match(mapHtml, /LANDMARK_ENTITY_API\.mergeOverrides\(generated, overrides\)/);
  assert.match(mapHtml, /applyStandaloneLandmarks\(collectResolvedFacilities\(\)\)/);
  assert.match(mapHtml, /if \(!STANDALONE_LANDMARK_MODE\)/);
  assert.match(mapHtml, /landmarks:resolvedView\.landmarks/);
});

test('施設アイコンは収集ランドマークだけを建物デザインで描く', () => {
  assert.match(mapHtml, /const poiSourceFacilities = STANDALONE_LANDMARK_MODE[\s\S]*item\.landmarkEntity/);
  assert.match(mapHtml, /const activeFeatures = selection\.collection\.features\.filter\(activeLandmarkAtZoom\)/);
  assert.match(mapHtml, /if \(feature\.properties\.parent_id\)[\s\S]*contextParentIds\.has\(feature\.properties\.parent_id\)/);
  assert.match(mapHtml, /function rasterizeStandaloneLandmarkBuildings\(features, worldToGridPoint, gridSize\)/);
  assert.match(mapHtml, /function drawStandaloneLandmarkBuildings\(\)/);
  assert.match(mapHtml, /drawCellPixelArtBuildingGrid\([\s\S]*landmark\.grid, landmark\.bldGrid/);
  assert.match(mapHtml, /renderer:'building-footprint'/);
  assert.match(mapHtml, /'precollected-landmark-building'/);
  assert.match(mapHtml, /if \(STANDALONE_UNIFIED_STYLE && o\.poi && !STANDALONE_LANDMARK_MODE\)/);
});
