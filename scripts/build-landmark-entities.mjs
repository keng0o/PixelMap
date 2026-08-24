#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(argument => {
  const [key, ...value] = argument.replace(/^--/, '').split('=');
  return [key, value.join('=') || true];
}));
const areaName = typeof args.area === 'string' ? args.area.trim() : '';
const bbox = areaName ? null : String(args.bbox || '35.5265,139.6955,35.5296,139.6994')
  .split(',').map(Number);
if (!areaName && (bbox.length !== 4 || bbox.some(value => !Number.isFinite(value))))
  throw new Error('--bbox=south,west,north,east の形式で指定してください');
const output = resolve(String(args.output || 'data/landmarks/region.generated.geojson'));
const baseGeneratedPath = typeof args['base-generated'] === 'string'
  ? resolve(args['base-generated']) : null;
const minParentArea = Number(args['min-parent-area'] || 3000);
const minHighriseHeight = Number(args['min-highrise-height'] || 30);
const minHighriseLevels = Number(args['min-highrise-levels'] || 8);
const endpoint = String(args.endpoint || 'https://overpass-api.de/api/interpreter');
const scopePrefix = areaName
  ? `area["name"="${areaName.replaceAll('"', '\\"')}"]["boundary"="administrative"]->.searchArea;`
  : '';
const scope = areaName ? '(area.searchArea)' : `(${bbox.join(',')})`;

const collectionQuery = statements => `[out:json][timeout:180];${scopePrefix}(
${statements}
);out body center geom;`;
const standardQueries = [
  collectionQuery(`
  nwr["name"]["landuse"="retail"]${scope};
  nwr["name"]["shop"~"^(mall|department_store|shopping_centre|supermarket|wholesale)$"]${scope};
  nwr["name"]["building"="retail"]${scope};
  `),
  collectionQuery(`
  nwr["name"]["building"="commercial"]${scope};
  nwr["name"]["landuse"="commercial"]${scope};
  `),
  collectionQuery(`
  nwr["name"]["leisure"="park"]${scope};
  `),
  collectionQuery(`
  nwr["name"]["landuse"="religious"]["religion"~"^(buddhist|shinto)$"]${scope};
  nwr["name"]["amenity"="place_of_worship"]["religion"~"^(buddhist|shinto)$"]${scope};
  nwr["name"]["building"~"^(temple|shrine)$"]${scope};
  `),
  collectionQuery(`
  nwr["name"]["amenity"~"^(theatre|cinema|arts_centre)$"]${scope};
  `),
];
const highriseQuery = `[out:json][timeout:180];${scopePrefix}
  wr${scope}["name"]["building"](if:
    (is_number(t["height"]) && number(t["height"]) >= ${minHighriseHeight}) ||
    (is_number(t["building:levels"]) && number(t["building:levels"]) >= ${minHighriseLevels})
  );
out body center geom;`;
const queries = baseGeneratedPath ? [highriseQuery] : [...standardQueries, highriseQuery];
const wait = milliseconds => new Promise(resolveWait => setTimeout(resolveWait, milliseconds));
async function fetchOverpass(query){
  for (let attempt = 0; attempt < 4; attempt++){
    const response = await fetch(endpoint, {
      method:'POST',
      headers:{
        'content-type':'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent':'PixelMap landmark builder/1',
      },
      body:new URLSearchParams({ data:query }),
    });
    if (response.ok){
      const result = await response.json();
      if (result.remark) throw new Error(`Overpass API: ${result.remark}`);
      return result.elements || [];
    }
    const detail = await response.text();
    if (![429,502,503,504].includes(response.status) || attempt === 3)
      throw new Error(`Overpass API ${response.status}: ${detail}`);
    await wait(5000 * 2 ** attempt);
  }
  return [];
}
const osmElementsById = new Map();
for (let index = 0; index < queries.length; index++){
  const elements = await fetchOverpass(queries[index]);
  console.log(`Fetched query ${index + 1}/${queries.length}: ${elements.length} OSM elements`);
  for (const element of elements)
    osmElementsById.set(`${element.type}/${element.id}`, element);
  if (index + 1 < queries.length) await wait(1500);
}
const osmElements = [...osmElementsById.values()];

const samePoint = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
function joinMemberRings(members, acceptedRoles){
  const segments = members.filter(member => member.type === 'way' &&
    acceptedRoles.has(member.role || '') && Array.isArray(member.geometry) && member.geometry.length >= 2)
    .map(member => member.geometry.map(point => [point.lon, point.lat]));
  const rings = [];
  while (segments.length){
    const ring = segments.shift().slice();
    let joined = true;
    while (!samePoint(ring[0], ring[ring.length - 1]) && joined){
      joined = false;
      for (let index = 0; index < segments.length; index++){
        const segment = segments[index];
        if (samePoint(ring[ring.length - 1], segment[0])) ring.push(...segment.slice(1));
        else if (samePoint(ring[ring.length - 1], segment[segment.length - 1]))
          ring.push(...segment.slice(0, -1).reverse());
        else continue;
        segments.splice(index, 1);
        joined = true;
        break;
      }
    }
    if (ring.length >= 4 && samePoint(ring[0], ring[ring.length - 1])) rings.push(ring);
  }
  return rings;
}
function relationGeometry(element){
  const members = Array.isArray(element.members) ? element.members : [];
  const outers = joinMemberRings(members, new Set(['outer','outline','']));
  const inners = joinMemberRings(members, new Set(['inner']));
  if (!outers.length) return null;
  const polygons = outers.map(outer => [outer]);
  for (const inner of inners){
    const point = inner[0];
    const container = polygons.find(polygon => ringContains(polygon[0], point));
    if (container) container.push(inner);
  }
  return polygons.length === 1
    ? { type:'Polygon', coordinates:polygons[0] }
    : { type:'MultiPolygon', coordinates:polygons };
}
const elementId = element => `${element.type}/${element.id}`;
const elementGeometry = element => {
  if (element.type === 'node') return { type:'Point', coordinates:[element.lon, element.lat] };
  if (element.type === 'relation') return relationGeometry(element);
  const coordinates = (element.geometry || []).map(point => [point.lon, point.lat]);
  if (coordinates.length < 4) return null;
  const first = coordinates[0], last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push(first.slice());
  return { type:'Polygon', coordinates:[coordinates] };
};
const polygons = geometry => geometry?.type === 'Polygon' ? [geometry.coordinates]
  : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
const ringContains = (ring, point) => {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const contains = (geometry, point) => polygons(geometry).some(polygon =>
  polygon.length && ringContains(polygon[0], point) && !polygon.slice(1).some(ring => ringContains(ring, point)));
const projection = latitude => {
  const sx = 111320 * Math.cos(latitude * Math.PI / 180), sy = 110574;
  return point => [point[0] * sx, point[1] * sy];
};
const ringAreaM2 = ring => {
  if (!ring.length) return 0;
  const project = projection(ring.reduce((sum, point) => sum + point[1], 0) / ring.length);
  const points = ring.map(project);
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++)
    area += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  return Math.abs(area / 2);
};
const areaM2 = geometry => polygons(geometry).reduce((total, polygon) =>
  total + ringAreaM2(polygon[0] || []) - polygon.slice(1).reduce((sum, ring) => sum + ringAreaM2(ring), 0), 0);
function heightMeters(value){
  const text = String(value ?? '').trim().toLowerCase().replace(',', '.');
  let match = text.match(/^(\d+(?:\.\d+)?)\s*(?:m|meter|meters|metre|metres)?$/);
  if (match) return Number(match[1]);
  match = text.match(/^(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)$/);
  if (match) return Number(match[1]) * .3048;
  match = text.match(/^(\d+)'(?:(\d+(?:\.\d+)?)")?$/);
  if (match) return Number(match[1]) * .3048 + Number(match[2] || 0) * .0254;
  return null;
}
function buildingLevels(value){
  const text = String(value ?? '').trim();
  return /^\d+(?:\.0+)?$/.test(text) ? Number(text) : null;
}
const anchorOf = geometry => {
  if (geometry?.type === 'Point') return geometry.coordinates.slice(0, 2);
  const outer = polygons(geometry)[0]?.[0] || [];
  if (!outer.length) return null;
  const average = outer.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map(value => value / outer.length);
  return contains(geometry, average) ? average : outer[0].slice();
};
const segmentDistance = (point, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1,
    ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length2)) : 0;
  return Math.hypot(a[0] + t * dx - point[0], a[1] + t * dy - point[1]);
};
function parentAnchor(parent, signatureChildren){
  const ring = polygons(parent.geometry)[0]?.[0] || [];
  if (!ring.length) return anchorOf(parent.geometry);
  if (!signatureChildren.length) return anchorOf(parent.geometry);
  const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const project = projection(latitude);
  const projectedRing = ring.map(project);
  const childPoints = signatureChildren.map(child => project(child.anchor));
  const xs = ring.map(point => point[0]), ys = ring.map(point => point[1]);
  let best = null;
  for (let xi = 0; xi <= 30; xi++){
    for (let yi = 0; yi <= 30; yi++){
      const candidate = [
        Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * xi / 30,
        Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * yi / 30,
      ];
      if (!contains(parent.geometry, candidate)) continue;
      const point = project(candidate);
      const boundary = Math.min(...projectedRing.slice(1).map((next, index) =>
        segmentDistance(point, projectedRing[index], next)));
      if (boundary < 8) continue;
      const childDistance = childPoints.length
        ? Math.min(...childPoints.map(child => Math.hypot(point[0] - child[0], point[1] - child[1])))
        : 0;
      const score = childDistance + Math.min(30, boundary) * 1.5;
      if (!best || score > best.score) best = { score, candidate };
    }
  }
  return best?.candidate || anchorOf(parent.geometry);
}

const records = osmElements.map(element => ({
  element,
  geometry:elementGeometry(element),
  tags:element.tags || {},
})).filter(record => record.geometry);
const isRetailParent = record => record.geometry.type !== 'Point' && record.tags.name && (
  record.tags.landuse === 'retail' ||
  ['mall','department_store','shopping_centre','supermarket','wholesale'].includes(record.tags.shop) ||
  record.tags.building === 'retail'
);
const isCommercialParent = record => record.geometry.type !== 'Point' && record.tags.name && (
  record.tags.building === 'commercial' || record.tags.landuse === 'commercial'
);
const isParkParent = record => record.geometry.type !== 'Point' && record.tags.name &&
  record.tags.leisure === 'park';
const isReligiousParent = record => record.geometry.type !== 'Point' && record.tags.name && (
  (record.tags.landuse === 'religious' && ['buddhist','shinto'].includes(record.tags.religion)) ||
  (record.tags.amenity === 'place_of_worship' && ['buddhist','shinto'].includes(record.tags.religion)) ||
  ['temple','shrine'].includes(record.tags.building)
);
const isHighriseParent = record => record.geometry.type !== 'Point' && record.tags.name &&
  Boolean(record.tags.building) && (
    Number(record.heightM) >= minHighriseHeight || Number(record.levels) >= minHighriseLevels
  );
const isParent = record => isRetailParent(record) || isCommercialParent(record) ||
  isParkParent(record) || isReligiousParent(record) || isHighriseParent(record);
const isVenue = record => record.tags.name && ['theatre','cinema','arts_centre'].includes(record.tags.amenity);
for (const record of records){
  record.heightM = heightMeters(record.tags.height);
  record.levels = buildingLevels(record.tags['building:levels']);
}
const parentCandidates = records.filter(isParent).map(record => ({
  ...record,
  id:elementId(record.element),
  area:areaM2(record.geometry),
  collectionGroup:isHighriseParent(record) ? 'highrise'
    : isRetailParent(record) ? 'retail'
      : isCommercialParent(record) ? 'commercial'
        : isParkParent(record) ? 'park' : 'religious',
})).filter(parent => parent.collectionGroup === 'highrise' || parent.area >= minParentArea);
const collectedParentIds = new Set(parentCandidates.map(parent => parent.id));
const parentsByFingerprint = new Map();
for (const parent of parentCandidates){
  if (parent.collectionGroup !== 'highrise'){
    parentsByFingerprint.set(parent.id, parent);
    continue;
  }
  const anchor = anchorOf(parent.geometry) || [0, 0];
  const fingerprint = [
    parent.tags.name.trim().toLocaleLowerCase('ja'),
    Math.round(parent.area),
    anchor[0].toFixed(6), anchor[1].toFixed(6),
  ].join('|');
  const current = parentsByFingerprint.get(fingerprint);
  if (!current || (current.element.type !== 'relation' && parent.element.type === 'relation'))
    parentsByFingerprint.set(fingerprint, parent);
}
const parents = [...parentsByFingerprint.values()];
const children = (baseGeneratedPath ? [] : records.filter(isVenue)).map(record => ({
  ...record,
  id:elementId(record.element),
  area:areaM2(record.geometry),
  anchor:anchorOf(record.geometry),
}));

for (const child of children){
  child.parent = parents.filter(parent => contains(parent.geometry, child.anchor))
    .sort((a, b) => a.area - b.area || a.id.localeCompare(b.id))[0] || null;
}
const childOrder = (a, b) => Number(b.geometry.type !== 'Point') - Number(a.geometry.type !== 'Point') ||
  b.area - a.area || a.id.localeCompare(b.id);
const features = [];
for (const parent of parents){
  const members = children.filter(child => child.parent?.id === parent.id).sort(childOrder);
  const entertainment = members.some(child => ['theatre','cinema'].includes(child.tags.amenity));
  const anchor = parentAnchor(parent, members.slice(0, 1));
  const symbolicLandmark = ['park','religious'].includes(parent.collectionGroup);
  const renderClass = parent.collectionGroup === 'park' ? 'park'
    : parent.collectionGroup === 'religious' ? 'place_of_worship'
      : parent.collectionGroup === 'highrise' ? 'building' : 'mall';
  const category = parent.collectionGroup === 'park' ? 'nature' : 'landmark';
  const estimatedHeightM = parent.heightM ?? (parent.levels == null ? null : parent.levels * 3);
  const minzoom = parent.collectionGroup !== 'highrise' ? 13
    : estimatedHeightM >= 60 || parent.levels >= 20 ? 12
      : estimatedHeightM >= 45 || parent.levels >= 15 ? 13 : 14;
  features.push({
    type:'Feature', id:parent.id, geometry:parent.geometry,
    properties:{
      id:parent.id, osm_type:parent.element.type, osm_id:parent.element.id,
      name:parent.tags.name, 'name:ja':parent.tags['name:ja'] || parent.tags.name,
      'name:en':parent.tags['name:en'] || parent.tags['name:it'],
      role:'complex', collection_group:parent.collectionGroup,
      class:entertainment ? 'entertainment_complex'
        : parent.collectionGroup === 'commercial' ? 'commercial_complex'
          : parent.collectionGroup === 'highrise' ? 'highrise_building'
          : parent.collectionGroup === 'park' ? 'park_complex'
            : parent.collectionGroup === 'religious' ? 'religious_complex' : 'retail_complex',
      render_class:renderClass, category, display_mode:symbolicLandmark ? 'symbol' : 'building',
      area_m2:Math.round(parent.area),
      height_m:estimatedHeightM == null ? undefined : Math.round(estimatedHeightM * 10) / 10,
      height_estimated:parent.heightM == null && parent.levels != null ? true : undefined,
      building_levels:parent.levels ?? undefined,
      highrise_rule:parent.collectionGroup === 'highrise'
        ? parent.heightM >= minHighriseHeight ? 'height' : 'building:levels'
        : undefined,
      minzoom, detail_zoom:16, max_signature_children:1, icon_size:'L', icon_anchor:anchor,
      building:parent.tags.building, landuse:parent.tags.landuse, shop:parent.tags.shop,
      leisure:parent.tags.leisure, amenity:parent.tags.amenity, religion:parent.tags.religion,
    },
  });
  for (const child of members){
    const renderClass = child.tags.amenity === 'theatre' ? 'theatre'
      : child.tags.amenity === 'cinema' ? 'cinema' : 'attraction';
    features.push({
      type:'Feature', id:child.id, geometry:child.geometry,
      properties:{
        id:child.id, osm_type:child.element.type, osm_id:child.element.id,
        name:child.tags.name, 'name:ja':child.tags['name:ja'] || child.tags.name,
        'name:en':child.tags['name:en'], role:'venue_candidate', parent_id:parent.id,
        class:child.tags.amenity === 'theatre' ? 'live_venue' : child.tags.amenity,
        render_class:renderClass, category:'landmark', amenity:child.tags.amenity,
        building:child.tags.building, independent_building:child.geometry.type !== 'Point',
        area_m2:Math.round(child.area), minzoom:14, icon_size:'M', icon_anchor:child.anchor,
      },
    });
  }
}

const baseGenerated = baseGeneratedPath
  ? JSON.parse(await readFile(baseGeneratedPath, 'utf8')) : null;
const refreshedIds = new Set([
  ...features.map(feature => feature.properties.id),
  ...(baseGenerated ? collectedParentIds : []),
]);
const outputFeatures = baseGenerated
  ? [
      ...baseGenerated.features.filter(feature => !refreshedIds.has(feature.properties.id)),
      ...features,
    ]
  : features;
const collectionGroups = {
  ...(baseGenerated?.properties?.collection_groups || {}),
  retail:['landuse=retail','shop=mall','shop=department_store','shop=shopping_centre',
    'shop=supermarket','shop=wholesale','building=retail'],
  commercial:['building=commercial','landuse=commercial'],
  park:['leisure=park'],
  religious:['landuse=religious + religion=buddhist|shinto',
    'amenity=place_of_worship + religion=buddhist|shinto','building=temple|shrine'],
  highrise:[`building=* + height>=${minHighriseHeight}m`,
    `building=* + building:levels>=${minHighriseLevels}`],
};
const outputData = {
  type:'FeatureCollection',
  name:'PixelMap generated landmark entities',
  properties:{
    ...(baseGenerated?.properties || {}),
    schema:'pixelmap-landmark-entities/1', source:'OpenStreetMap',
    generated_at:new Date().toISOString(),
    scope:areaName ? { type:'administrative_area', name:areaName } : { type:'bbox', bbox },
    min_parent_area_m2:minParentArea,
    highrise_thresholds:{
      min_height_m:minHighriseHeight,
      min_building_levels:minHighriseLevels,
    },
    collection_groups:collectionGroups,
  },
  features:outputFeatures,
};
await mkdir(dirname(output), { recursive:true });
await writeFile(output, `${JSON.stringify(outputData, null, 2)}\n`);
const outputParents = outputFeatures.filter(feature => feature.properties.role === 'complex');
console.log(`Generated ${outputParents.length} complexes and ${outputFeatures.length - outputParents.length} children: ${output}`);
