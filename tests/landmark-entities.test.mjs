import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../assets/landmark-entities.js';

const API = globalThis.PixelMapLandmarkEntities;
const collection = JSON.parse(await readFile(
  new URL('../data/landmarks/kawasaki.geojson', import.meta.url), 'utf8'));
const mapHtml = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('ランドマークGeoJSONはラチッタデッラの敷地と候補施設を保持する', () => {
  const parent = collection.features.find(feature => feature.properties.role === 'complex');
  const club = collection.features.find(feature => feature.properties.name === "CLUB CITTA'");
  const cinema = collection.features.find(feature => feature.properties['name:ja'] === 'チネチッタ');
  assert.equal(parent.properties.id, 'way/690489941');
  assert.equal(parent.geometry.type, 'Polygon');
  assert.equal(club.properties.parent_id, parent.properties.id);
  assert.equal(club.properties.independent_building, true);
  assert.equal(cinema.geometry.type, 'Point');
  assert.equal(API.geometryContains(parent.geometry, API.anchorOf(club)), true);
  assert.equal(API.geometryContains(parent.geometry, API.anchorOf(cinema)), true);
});

test('親子関係は子施設の代表点を含む最小の複合施設から導出できる', () => {
  const withoutParentIds = structuredClone(collection);
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
  assert.deepEqual(result.features.map(feature => feature.properties.name).sort(),
    ["CLUB CITTA'", 'ラチッタデッラ'].sort());
  assert.equal(result.features.some(feature => feature.properties['name:ja'] === 'チネチッタ'), false);
});

test('ズーム別に親施設、代表子施設、詳細施設を段階表示する', () => {
  assert.deepEqual(API.selectForZoom(collection, 13).features.map(feature => feature.properties.name),
    ['ラチッタデッラ']);
  assert.equal(API.selectForZoom(collection, 16).features.length, 3);
});

test('ランドマーク処理は単体ページだけで有効になり共有iframeを変えない', () => {
  assert.match(mapHtml, /const STANDALONE_LANDMARK_MODE = !EMBEDDED/);
  assert.match(mapHtml, /data\/landmarks\/kawasaki\.geojson/);
  assert.match(mapHtml, /applyStandaloneLandmarks\(collectResolvedFacilities\(\)\)/);
  assert.match(mapHtml, /if \(!STANDALONE_LANDMARK_MODE\)/);
  assert.match(mapHtml, /landmarks:resolvedView\.landmarks/);
});
