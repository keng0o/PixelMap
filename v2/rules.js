(function initPixelMapV2(root, factory){
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.PixelMapV2 = rules;
})(typeof globalThis === 'object' ? globalThis : this, function createPixelMapV2Rules(){
  'use strict';

  const DISPLAY = Object.freeze({
    terrain: Object.freeze({
      water: Object.freeze(['natural=water', 'waterway=riverbank']),
      forest: Object.freeze(['natural=wood', 'landuse=forest']),
      farmland: Object.freeze([
        'landuse=farmland', 'landuse=farmyard', 'landuse=orchard',
        'landuse=vineyard', 'landuse=greenhouse_horticulture',
      ]),
      sand: Object.freeze(['natural=beach', 'natural=sand']),
      grass: Object.freeze([
        'default', 'landuse=grass', 'landuse=meadow', 'landuse=village_green',
        'landuse=recreation_ground', 'landuse=allotments', 'landuse=cemetery',
        'natural=grassland', 'natural=heath', 'natural=scrub', 'leisure=garden',
      ]),
    }),
    skeleton: Object.freeze({
      railway: Object.freeze(['rail', 'light_rail', 'tram', 'monorail']),
      road: Object.freeze(['trunk', 'primary']),
    }),
    place: Object.freeze({
      settlement: Object.freeze(['city', 'town', 'suburb']),
      landmark: Object.freeze(['station', 'worship', 'school', 'castle', 'lighthouse']),
    }),
  });

  const REFERENCE = Object.freeze([
    'bridge', 'level_crossing', 'tunnel', 'ferry', 'river',
    'administrative_boundary', 'park', 'island',
  ]);
  const AGGREGATE = Object.freeze([
    'residential_area', 'commercial_area', 'industrial_area', 'port', 'station_count',
  ]);
  const SURFACE_PRIORITY = Object.freeze(['grass', 'sand', 'farmland', 'forest', 'water']);

  const value = (props, key) => String((props && props[key]) || '').toLowerCase();
  const classValues = props => [value(props, 'class'), value(props, 'subclass')].filter(Boolean);

  function isVisibleRailFeature(props){
    if (value(props, 'brunnel') === 'tunnel') return false;
    const values = classValues(props);
    if (values.includes('subway') || values.includes('transit')) return false;
    return values.some(v => DISPLAY.skeleton.railway.includes(v));
  }

  function isVisibleRoadFeature(props){
    if (value(props, 'brunnel') === 'tunnel') return false;
    return DISPLAY.skeleton.road.includes(value(props, 'class'));
  }

  function poiKind(props){
    const klass = value(props, 'class');
    const subclass = value(props, 'subclass');
    const values = classValues(props);
    if (klass === 'station' || ['station', 'train_station'].includes(subclass)) return 'station';
    if (values.includes('place_of_worship')) return 'worship';
    if (values.some(v => ['school', 'university', 'college', 'kindergarten'].includes(v))) return 'school';
    if (values.includes('castle')) return 'castle';
    if (values.includes('lighthouse')) return 'lighthouse';
    return null;
  }

  function spriteKey(props){
    const kind = poiKind(props);
    if (kind !== 'worship') return kind;
    const subclass = value(props, 'subclass');
    const religion = value(props, 'religion') ||
      (['shinto', 'buddhist', 'taoist', 'christian'].includes(subclass) ? subclass : '');
    if (religion === 'shinto') return 'worship_shinto';
    if (['buddhist', 'taoist'].includes(religion)) return 'worship_buddhist';
    if (religion === 'christian') return 'worship_christian';
    return 'place_of_worship';
  }

  function importance(props, fallbackArea = 0){
    const taggedArea = Number(props && (props.area_m2 ?? props.area));
    const area = Number.isFinite(taggedArea) ? Math.max(0, taggedArea) : Math.max(0, Number(fallbackArea) || 0);
    const sourceRank = Number(props && props.rank);
    let score = 0;
    if (props && props.wikidata) score += 4;
    if (props && props.heritage) score += 3;
    if (area >= 20000) score += 4;
    else if (area >= 5000) score += 3;
    else if (area >= 1000) score += 2;
    else if (area >= 250) score += 1;
    if (Number.isFinite(sourceRank)){
      if (sourceRank <= 5) score += 3;
      else if (sourceRank <= 10) score += 2;
      else if (sourceRank <= 20) score += 1;
    }
    return Object.freeze({
      score,
      size: score >= 6 ? 'L' : score >= 3 ? 'M' : 'S',
      label: score >= 6 ? 'always' : score >= 3 ? 'auto' : 'hover',
    });
  }

  function selectPlaces(features, extent = 4096){
    const priority = { city:0, town:1, suburb:2 };
    const candidates = features
      .filter(f => f && f.type === 1 && f.geom && f.geom[0] && f.geom[0][0])
      .filter(f => Object.hasOwn(priority, value(f.props, 'class')))
      .sort((a, b) => priority[value(a.props, 'class')] - priority[value(b.props, 'class')] ||
        Number(a.props.rank ?? 30) - Number(b.props.rank ?? 30));
    const suburbCount = new Map();
    const seen = new Set();
    return candidates.filter(feature => {
      const props = feature.props || {};
      const kind = value(props, 'class');
      const point = feature.geom[0][0];
      const name = props['name:ja'] || props.name || '';
      const duplicateKey = `${kind}:${name}:${Math.round(point[0] / 32)}:${Math.round(point[1] / 32)}`;
      if (seen.has(duplicateKey)) return false;
      seen.add(duplicateKey);
      if (kind !== 'suburb') return true;
      const tile = `${Math.floor(point[0] / extent)}/${Math.floor(point[1] / extent)}`;
      const count = suburbCount.get(tile) || 0;
      if (count >= 2) return false;
      suburbCount.set(tile, count + 1);
      return true;
    });
  }

  return Object.freeze({
    DISPLAY, REFERENCE, AGGREGATE, SURFACE_PRIORITY,
    isVisibleRailFeature, isVisibleRoadFeature, poiKind, spriteKey, importance, selectPlaces,
  });
});
