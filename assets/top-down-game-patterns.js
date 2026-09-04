((global) => {
  'use strict';

  const version = 'pixelmap-top-down-patterns/9';
  const styleId = 'top-down-hand-drawn-game-v9';

  function freeze(value) {
    if (Array.isArray(value)) return Object.freeze(value.map(freeze));
    if (value && typeof value === 'object') {
      return Object.freeze(Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, freeze(item)]),
      ));
    }
    return value;
  }

  const palette = freeze({
    ink: '#263a35',
    inkSoft: '#466052',
    ground: '#91bb70',
    groundLight: '#b1cf83',
    groundDark: '#6f995d',
    forest: '#3f704d',
    forestDark: '#294d3a',
    forestLight: '#79a85f',
    park: '#9bc77a',
    field: '#aecb78',
    soil: '#c9b985',
    plaza: '#dfce9f',
    water: '#63c4c3',
    waterLight: '#a6ded4',
    waterDark: '#397f80',
    road: '#ead9ac',
    roadLight: '#f5e9c6',
    roadDark: '#9a8767',
    railBed: '#8a8b75',
    rail: '#34443f',
    roof: '#4f7893',
    roofLight: '#7396a6',
    roofDark: '#2f5068',
    roofSlate: '#607784',
    roofStone: '#8b938c',
    roofEarth: '#8e6956',
    shadow: '#49664f',
    location: '#ffef78',
    locationDark: '#263a35',
  });

  function pattern(id, family, primitive, extra = {}) {
    return freeze({ id, family, primitive, ...extra });
  }

  const catalogs = freeze({
    roof: [
      pattern('building-cottage-gable', 'roof', 'broken-single-ridge', {
        structure: 'gable', palette: 'blue', lineDirection: 'longest-edge-only', handDrawn: true,
        referenceAsset: 'building-blue-gable-01',
      }),
      pattern('building-longhouse', 'roof', 'parallel-weatherboards', {
        structure: 'longhouse', palette: 'blue-dark', lineDirection: 'longest-edge-only', handDrawn: true,
        referenceAsset: 'building-blue-longhouse-03',
      }),
      pattern('building-hipped', 'roof', 'tapered-parallel-ridges', {
        structure: 'hipped', palette: 'blue', lineDirection: 'longest-edge-only', handDrawn: true,
        referenceAsset: 'building-blue-hipped-02',
      }),
      pattern('building-flat-workshop', 'roof', 'offset-long-seams', {
        structure: 'flat', palette: 'slate', lineDirection: 'longest-edge-only', handDrawn: true,
        referenceAsset: 'building-harbor-workshop-04',
      }),
      pattern('building-weathered-gable', 'roof', 'weathered-long-strokes', {
        structure: 'weathered-gable', palette: 'blue-dark', lineDirection: 'longest-edge-only', handDrawn: true,
        referenceAsset: 'building-blue-weathered-05',
      }),
    ],
    tree: [
      pattern('tree-light-crown', 'tree', 'scalloped-layered-crown', {
        crown: 'light', radius: 13, handDrawn: true, referenceAsset: 'tree-round-crown-01',
      }),
      pattern('tree-dark-crown', 'tree', 'scalloped-layered-crown', {
        crown: 'dark', radius: 14, handDrawn: true, referenceAsset: 'tree-dark-crown-03',
      }),
      pattern('tree-small', 'tree', 'scalloped-layered-crown', {
        crown: 'small', radius: 9, handDrawn: true, referenceAsset: 'tree-small-crown-02',
      }),
      pattern('tree-multi-crown', 'tree', 'scalloped-layered-crown', {
        crown: 'multi', radius: 15, handDrawn: true, referenceAsset: 'tree-multi-crown-04',
      }),
      pattern('tree-underbrush', 'tree', 'scalloped-layered-crown', {
        crown: 'underbrush', radius: 8, handDrawn: true, referenceAsset: 'tree-underbrush-cluster-05',
      }),
    ],
    road: [
      pattern('road-sandy-local', 'road', 'layered-line', { classes: ['minor', 'service', 'residential', 'street'] }),
      pattern('road-worn-regional', 'road', 'layered-line', { classes: ['secondary', 'tertiary'] }),
      pattern('road-cobbled-major', 'road', 'layered-line', { classes: ['motorway', 'trunk', 'primary'] }),
      pattern('road-narrow-path', 'road', 'layered-line', { classes: ['path', 'track', 'footway', 'cycleway', 'pedestrian'] }),
    ],
    water: [
      pattern('water-open', 'water', 'area-ripples', { classes: ['ocean', 'lake', 'river'] }),
      pattern('water-current', 'water', 'corridor-ripples', { classes: ['river', 'canal'] }),
      pattern('water-shore-stones', 'water', 'edge-stamps', { classes: ['ocean', 'lake', 'river'] }),
      pattern('water-shallows', 'water', 'area-stamps', { classes: ['lake', 'river', 'pond'] }),
    ],
    ground: [
      pattern('ground-neutral-grass', 'ground', 'area-grain', { classes: ['grass', 'meadow', 'unknown'] }),
      pattern('ground-deep-undergrowth', 'ground', 'area-grain', { classes: ['forest', 'wood'] }),
      pattern('ground-warm-soil', 'ground', 'area-grain', { classes: ['residential', 'construction', 'brownfield'] }),
      pattern('ground-field-furrows', 'ground', 'area-lines', { classes: ['farmland', 'farm', 'orchard'] }),
      pattern('ground-park-sprigs', 'ground', 'area-stamps', { classes: ['park', 'garden', 'recreation_ground'] }),
      pattern('ground-pale-plaza', 'ground', 'area-grain', { classes: ['commercial', 'retail', 'school', 'hospital'] }),
    ],
  });

  const byId = new Map(Object.values(catalogs).flat().map(item => [item.id, item]));
  const groundFallback = byId.get('ground-neutral-grass');

  function hashString(value) {
    const string = String(value ?? '');
    let hash = 0x811c9dc5;
    for (let index = 0; index < string.length; index += 1) {
      hash ^= string.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function stableProps(props = {}) {
    return Object.entries(props)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${String(value)}`)
      .join(',');
  }

  function roundedBounds(bounds = {}) {
    const values = ['minX', 'minY', 'maxX', 'maxY'].map(key => {
      const value = Number(bounds[key]);
      return Number.isFinite(value) ? value.toFixed(3) : '0.000';
    });
    return values.join(',');
  }

  function featureKey({ layer = 'unknown', id = '', props = {}, bounds = {} } = {}) {
    const identity = id !== '' && id !== null && id !== undefined ? `id:${id}` : `bounds:${roundedBounds(bounds)}`;
    return `${layer}|${identity}|${stableProps(props)}|${roundedBounds(bounds)}`;
  }

  function ringArea(ring = []) {
    let area = 0;
    for (let index = 0; index + 1 < ring.length; index += 1) {
      area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
    }
    return area / 2;
  }

  function geometryMetrics(rings = []) {
    const points = rings.flat().filter(point => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    const bounds = points.length ? {
      minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys),
    } : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const area = Math.abs(rings.reduce((sum, ring) => sum + ringArea(ring), 0));
    const complexity = rings.reduce((sum, ring) => sum + Math.max(0, ring.length - 1), 0);
    return freeze({
      bounds, width, height, area, complexity,
      aspect: Math.max(width, height) / Math.max(0.000001, Math.min(width, height)),
      axis: width >= height ? 'horizontal' : 'vertical',
    });
  }

  function normalizedClass(props = {}) {
    return String(props.subclass || props.class || props.landuse || props.building || 'unknown').toLowerCase();
  }

  function choose(list, seed) {
    return list[positiveModulo(seed, list.length)];
  }

  function eligibleRoofPatterns(input) {
    const metrics = input.metrics || {};
    const type = normalizedClass(input.props);
    if ((metrics.aspect || 1) >= 2.35) {
      return [byId.get('building-longhouse'), byId.get('building-cottage-gable'), byId.get('building-flat-workshop')];
    }
    if ((metrics.area || 0) >= 1600 || (metrics.complexity || 0) >= 14) {
      return [byId.get('building-weathered-gable'), byId.get('building-flat-workshop'), byId.get('building-hipped')];
    }
    if (['commercial', 'industrial', 'warehouse', 'retail'].includes(type)) {
      return [byId.get('building-flat-workshop'), byId.get('building-longhouse'), byId.get('building-weathered-gable')];
    }
    return [
      byId.get('building-cottage-gable'), byId.get('building-hipped'), byId.get('building-weathered-gable'),
      byId.get('building-flat-workshop'),
    ];
  }

  function roadPattern(props = {}) {
    const type = normalizedClass(props);
    return catalogs.road.find(item => item.classes.includes(type)) || byId.get('road-sandy-local');
  }

  function groundPattern(props = {}) {
    const type = normalizedClass(props);
    return catalogs.ground.find(item => item.classes.includes(type)) || groundFallback;
  }

  function selectPattern(family, input = {}) {
    const seed = hashString(input.key || featureKey(input));
    let choices;
    if (family === 'roof') choices = eligibleRoofPatterns(input);
    else if (family === 'tree') choices = catalogs.tree;
    else if (family === 'road') return freeze({ pattern: roadPattern(input.props), seed, fallback: false, reason: null });
    else if (family === 'water') choices = catalogs.water;
    else if (family === 'ground') return freeze({ pattern: groundPattern(input.props), seed, fallback: false, reason: null });
    else return freeze({ pattern: groundFallback, seed, fallback: true, reason: `unknown-family:${family}` });
    return freeze({ pattern: choose(choices, seed), seed, fallback: false, reason: null });
  }

  global.PixelMapTopDownPatterns = freeze({
    version, styleId, palette, catalogs, hashString, featureKey, geometryMetrics, selectPattern,
  });
})(typeof window !== 'undefined' ? window : globalThis);
