((global) => {
  'use strict';
  const EPS = 1e-5;
  const hash = value => {
    let n = 2166136261;
    for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const unit = (seed, salt = 0) => hash(`${seed}:${salt}`) / 4294967296;
  function detailRandom(seed, salt = 0) {
    let n = hash(`${seed}:${salt}`);
    n = Math.imul(n ^ n >>> 16, 0x7feb352d);
    n = Math.imul(n ^ n >>> 15, 0x846ca68b);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  }
  function bounds(paths) {
    const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const path of paths) for (const [x, y] of path) {
      b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
      b.top = Math.min(b.top, y); b.bottom = Math.max(b.bottom, y);
    }
    return b;
  }
  const overlaps = (a, b, pad = 0) => a.right + pad >= b.left && a.left - pad <= b.right &&
    a.bottom + pad >= b.top && a.top - pad <= b.bottom;
  function area(ring) {
    if (!ring.length) return 0;
    const [ox, oy] = ring[0];
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length];
      a += (p[0] - ox) * (q[1] - oy) - (q[0] - ox) * (p[1] - oy);
    }
    return a / 2;
  }
  function parts(rings) {
    const sign = Math.sign(rings.map(area).find(a => Math.abs(a) > EPS) || 1);
    const polygons = [];
    for (const ring of rings) {
      if (ring.length < 4 || Math.abs(area(ring)) < EPS) continue;
      if (Math.sign(area(ring)) === sign) polygons.push([ring]);
      else if (polygons.length) polygons[polygons.length - 1].push(ring);
    }
    return polygons;
  }
  function inRing([x, y], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  const inPolygon = (p, polygon) => inRing(p, polygon[0]) && !polygon.slice(1).some(r => inRing(p, r));
  const inside = (p, polygons) => polygons.some(polygon => inPolygon(p, polygon));
  function segmentDistance(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function edgeDistance(p, paths) {
    let d = Infinity;
    for (const ring of paths) for (let i = 1; i < ring.length; i++) d = Math.min(d, segmentDistance(p, ring[i - 1], ring[i]));
    return d;
  }
  const containsDisc = (p, r, polygons) => polygons.some(poly => inPolygon(p, poly) && edgeDistance(p, poly) >= r);
  const kind = f => String(f.props?.class || f.props?.landuse || f.props?.subclass || 'unknown');
  const isForest = k => ['forest', 'wood'].includes(k);
  const isVegetated = k => isForest(k) || ['park', 'garden', 'recreation_ground', 'grass', 'meadow'].includes(k);
  const shapeKey = geometry => geometry.map(path => path.map(p => p.map(n => n.toFixed(3)).join(',')).join(';')).join('|');

  // Merge MVT fragments in world coordinates before outlines, crowns, or roof structures are assigned.
  function mergeFeatures(features) {
    const groups = new Map();
    for (const feature of features) {
      if (!feature.geometry.length) continue;
      const id = feature.id === null || feature.id === undefined ? `shape:${hash(shapeKey(feature.geometry))}` : feature.id;
      const region = feature.type === 3 && ['landcover', 'landuse', 'park', 'water'].includes(feature.layer);
      const key = `${feature.layer}:${feature.type}:${kind(feature)}:${region ? 'region' : id}:${feature.props?.brunnel || ''}`;
      let group = groups.get(key);
      if (!group) {
        group = { ...feature, key, fragments: [], keys: new Set() };
        groups.set(key, group);
      }
      const geometryKey = shapeKey(feature.geometry);
      if (!group.keys.has(geometryKey)) {
        group.fragments.push(feature.geometry);
        group.keys.add(geometryKey);
      }
    }
    return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)).map(group => {
      const { fragments, keys, ...feature } = group;
      if (feature.type === 3) {
        const polygons = fragments.flatMap(parts);
        feature.polygons = fragments.length > 1 ? global.polygonClipping.union(polygons) : polygons;
        feature.geometry = feature.polygons.flat();
      } else {
        // Repeated buffered line fragments are harmless with opaque, world-anchored strokes.
        feature.geometry = fragments.flat();
      }
      feature.bounds = bounds(feature.geometry);
      return feature;
    });
  }

  function featuresNear(features, b) {
    return features.flatMap(f => {
      if (f.type === 2) return overlaps(bounds(f.geometry), b) ? [f] : [];
      const selected = parts(f.geometry).filter(poly => overlaps(bounds(poly), b));
      return selected.length ? [{ ...f, geometry: selected.flat() }] : [];
    });
  }

  function frame(polygon) {
    const ring = polygon[0], origin = ring[0];
    let best = null;
    for (let i = 1; i < ring.length; i++) {
      const dx = ring[i][0] - ring[i - 1][0], dy = ring[i][1] - ring[i - 1][1];
      if (Math.hypot(dx, dy) < EPS) continue;
      const angle = Math.atan2(dy, dx), c = Math.cos(angle), s = Math.sin(angle);
      const local = ring.map(([x, y]) => [(x - origin[0]) * c + (y - origin[1]) * s, -(x - origin[0]) * s + (y - origin[1]) * c]);
      const b = bounds([local]), size = (b.right - b.left) * (b.bottom - b.top);
      if (!best || size < best.size - EPS) best = { c, s, b, size };
    }
    if (!best) return null;
    let angle = Math.atan2(best.s, best.c);
    if (best.b.bottom - best.b.top > best.b.right - best.b.left) angle += Math.PI / 2;
    // Canonical orientation prevents lighting/roof variation flips on reversed rings.
    angle = ((angle % Math.PI) + Math.PI) % Math.PI;
    if (angle > Math.PI / 2) angle -= Math.PI;
    const c = Math.cos(angle), s = Math.sin(angle);
    const local = polygon.map(r => r.map(([x, y]) => [(x - origin[0]) * c + (y - origin[1]) * s, -(x - origin[0]) * s + (y - origin[1]) * c]));
    const b = bounds([local[0]]);
    return { c, s, origin, local, ...b, width: b.right - b.left, height: b.bottom - b.top,
      point: (x, y) => [origin[0] + c * x - s * y, origin[1] + s * x + c * y] };
  }

  function roofPanels(polygon, f) {
    const occupied = polygon.reduce((sum, r, i) => sum + Math.abs(area(r)) * (i ? -1 : 1), 0);
    if (polygon.length === 1 && occupied / (f.width * f.height) > .86) return [[f.left, f.top, f.right, f.bottom]];
    const xs = [...new Set(f.local.flat().map(p => Math.round(p[0] * 4) / 4))].sort((a, b) => a - b);
    if (xs.length > 34) return [[f.left, f.top, f.right, f.bottom]];
    const panels = [];
    for (let k = 1; k < xs.length; k++) {
      const left = xs[k - 1], right = xs[k], x = (left + right) / 2;
      if (right - left < .25) continue;
      const ys = [];
      for (const ring of f.local) for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], b = ring[i];
        if ((a[0] > x) !== (b[0] > x)) ys.push(a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]));
      }
      ys.sort((a, b) => a - b);
      for (let j = 1; j < ys.length; j += 2) {
        const top = ys[j - 1], bottom = ys[j];
        const adjacent = panels.find(p => Math.abs(p[2] - left) < .3 && Math.abs(p[1] - top) < .5 && Math.abs(p[3] - bottom) < .5);
        if (adjacent) adjacent[2] = right;
        else panels.push([left, top, right, bottom]);
      }
    }
    return panels.length ? panels : [[f.left, f.top, f.right, f.bottom]];
  }

  function roadWidth(f) {
    const widths = { motorway: 23, trunk: 19, primary: 15, secondary: 12, tertiary: 10,
      minor: 7, residential: 7, service: 4.5, track: 3, path: 2.6, footway: 2.6, cycleway: 2.8, pedestrian: 6, rail: 3.4, transit: 3.4 };
    return widths[kind(f)] || 6;
  }
  class SpatialIndex {
    constructor(items, size = 96) {
      this.cells = new Map(); this.size = size;
      for (const item of items) {
        const b = item.bounds;
        for (let y = Math.floor(b.top / size); y <= Math.floor(b.bottom / size); y++) {
          for (let x = Math.floor(b.left / size); x <= Math.floor(b.right / size); x++) {
            const key = `${x}:${y}`;
            if (!this.cells.has(key)) this.cells.set(key, []);
            this.cells.get(key).push(item);
          }
        }
      }
    }
    near([x, y], radius) {
      const found = new Set();
      for (let gy = Math.floor((y - radius) / this.size); gy <= Math.floor((y + radius) / this.size); gy++) {
        for (let gx = Math.floor((x - radius) / this.size); gx <= Math.floor((x + radius) / this.size); gx++) {
          for (const item of this.cells.get(`${gx}:${gy}`) || []) found.add(item);
        }
      }
      return [...found];
    }
  }
  function blocked(p, radius, obstacles) {
    return obstacles.some(f => {
      if (f.type === 3) return inside(p, f.polygons) || edgeDistance(p, f.geometry) < radius;
      return edgeDistance(p, f.geometry) < radius + (f.width || roadWidth(f)) / 2 + 1.5;
    });
  }

  function groundDetails(visible, b, vegetationIndex, obstacles) {
    const edges = [];
    for (const f of visible) {
      if (f.props.brunnel === 'tunnel') continue;
      const type = f.layer === 'building' ? 'building' : ['water', 'waterway'].includes(f.layer) ? 'water' :
        f.layer === 'transportation' ? 'road' : isForest(kind(f)) ? 'forest' : null;
      if (!type) continue;
      for (const ring of f.geometry) for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], q = ring[i], box = bounds([[a, q]]);
        if (!overlaps(box, b, 20)) continue;
        edges.push({type, geometry:[[a,q]], bounds:box, width:type === 'road' ? roadWidth(f) / 2 : 0,
          angle:Math.atan2(q[1] - a[1], q[0] - a[0])});
      }
    }
    const index = new SpatialIndex(edges, 32), marks = [];
    for (let gy = Math.floor(b.top / 12); gy < b.bottom / 12; gy++) for (let gx = Math.floor(b.left / 12); gx < b.right / 12; gx++) {
      const seed = hash(`margin:${gx}:${gy}`);
      const p = [(gx + detailRandom(seed, 1)) * 12, (gy + detailRandom(seed, 2)) * 12];
      let distance = 24, nearest = null;
      for (const edge of index.near(p, 20)) {
        const d = edgeDistance(p, edge.geometry) - edge.width;
        if (d < distance) { distance = d; nearest = edge; }
      }
      const density = nearest ? .015 + .68 * Math.exp(-Math.max(0, distance - 2) / 8) : .015;
      if (detailRandom(seed) > density || blocked(p, 2.2, obstacles.near(p, 16))) continue;
      const green = vegetationIndex.near(p, 5).some(f => containsDisc(p, 3, f.polygons));
      marks.push({key:`margin:${gx}:${gy}`, x:p[0], y:p[1], seed,
        type:green && detailRandom(seed, 4) > .2 ? 'grass' : 'earth',
        edgeType:nearest?.type || null, distance, angle:nearest?.angle || 0});
    }
    return marks;
  }

  function compose(features, viewport) {
    const b = { left: viewport.centerX - viewport.width / 2 / viewport.scale - 64,
      right: viewport.centerX + viewport.width / 2 / viewport.scale + 64,
      top: viewport.centerY - viewport.height / 2 / viewport.scale - 64,
      bottom: viewport.centerY + viewport.height / 2 / viewport.scale + 64 };
    const visible = features.filter(f => overlaps(f.bounds, b)).flatMap(f => {
      if (f.type !== 3) return [f];
      return f.polygons.map(poly => ({ ...f, polygons: [poly], geometry: poly, bounds: bounds(poly) }))
        .filter(part => overlaps(part.bounds, b));
    });
    const roads = visible.filter(f => f.layer === 'transportation' && f.type === 2).map(f => ({ ...f, width: roadWidth(f) }));
    const water = visible.filter(f => ['water', 'waterway'].includes(f.layer));
    const land = visible.filter(f => ['landcover', 'landuse', 'park'].includes(f.layer) && f.type === 3);
    const buildings = visible.filter(f => f.layer === 'building' && f.type === 3).flatMap(f => f.polygons.map((polygon, index) => {
      const roofFrame = frame(polygon);
      const footprintKey = shapeKey([polygon[0]]);
      const seed = hash(footprintKey), panels = roofFrame ? roofPanels(polygon, roofFrame) : [];
      const usage = String(f.props.subclass || f.props.class || f.props.building || '');
      const flat = f.props['roof:shape'] === 'flat' || /industrial|warehouse|commercial/.test(usage) ||
        Number(f.props.render_height || f.props.height) > 24;
      const style = flat ? 'flat' : polygon.length > 1 ? 'courtyard' : panels.length > 1 ? 'multi-wing' :
        roofFrame && roofFrame.width / roofFrame.height > 3.3 ? 'longhouse' : seed % 3 === 0 ? 'gable' : 'hipped';
      return { key: `roof:${seed}`, seed, polygon, frame: roofFrame, style, panels, props: f.props };
    })).filter(f => f.frame);
    const obstacles = new SpatialIndex(visible.filter(f => f.props.brunnel !== 'tunnel' &&
      (f.layer === 'building' || f.layer === 'water' || f.layer === 'waterway' || f.layer === 'transportation' ||
        ['farmland', 'farm', 'vineyard'].includes(kind(f)))));
    const vegetation = land.filter(f => isVegetated(kind(f)) || f.layer === 'park');
    const vegetationIndex = new SpatialIndex(vegetation);
    const trees = [];
    // One global lattice, independent of viewport and MVT feature ordering. Crowns fully fit their land polygon.
    const step = 13;
    for (let gy = Math.floor(b.top / step); gy <= Math.ceil(b.bottom / step); gy++) {
      for (let gx = Math.floor(b.left / step); gx <= Math.ceil(b.right / step); gx++) {
        const seed = hash(`canopy:${gx}:${gy}`);
        const p = [(gx + .12 + unit(seed, 1) * .76) * step, (gy + .12 + unit(seed, 2) * .76) * step];
        const eligible = vegetationIndex.near(p, 15).filter(f => inside(p, f.polygons));
        if (!eligible.length) continue;
        const forest = eligible.some(f => isForest(kind(f)));
        const density = forest ? .95 : eligible.some(f => ['grass', 'meadow'].includes(kind(f))) ? .065 : .34;
        if (unit(seed, 3) > density) continue;
        const baseRadius = forest ? 7 + unit(seed, 4) * 4.5 : 5.5 + unit(seed, 4) * 4.8;
        const cluster = .5 + .5 * Math.sin(p[0] / 49 + Math.cos(p[1] / 61));
        const candidates = forest ? [baseRadius * (1.18 + cluster * .28 + detailRandom(seed, 9) * .16), baseRadius, baseRadius * .55] :
          [baseRadius, baseRadius * .55];
        const radius = candidates.find(r => eligible.some(f => containsDisc(p, r * 1.07 + 2, f.polygons)) &&
          !blocked(p, r * 1.07 + 2, obstacles.near(p, r + 20)));
        if (!radius) continue;
        const edge = !forest || !eligible.some(f => containsDisc(p, radius * 2.3, f.polygons));
        trees.push({ key: `${gx}:${gy}`, x: p[0], y: p[1], radius, seed, forest, edge });
      }
    }
    // Small plantings belong only to mapped vegetation next to a real building.
    // Nothing here invents parcels, fences, entrances or connecting paths.
    for (const roof of buildings) {
      const ring = roof.polygon[0];
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], q = ring[i], length = Math.hypot(q[0] - a[0], q[1] - a[1]);
        const seed = hash(`garden:${roof.seed}:${i}`);
        if (length < 10 || detailRandom(seed) > .62) continue;
        const t = .2 + detailRandom(seed, 1) * .6, r = 2 + detailRandom(seed, 2) * 1.5;
        let nx = -(q[1] - a[1]) / length, ny = (q[0] - a[0]) / length;
        const mid = [a[0] + (q[0] - a[0]) * t, a[1] + (q[1] - a[1]) * t];
        if (inside([mid[0] + nx, mid[1] + ny], [roof.polygon])) { nx *= -1; ny *= -1; }
        const p = [mid[0] + nx * (r + 3.5), mid[1] + ny * (r + 3.5)];
        if (!vegetationIndex.near(p, 6).some(f => containsDisc(p, r * 1.07 + 2, f.polygons)) ||
          blocked(p, r * 1.07 + 2, obstacles.near(p, r + 20))) continue;
        trees.push({key:`garden:${roof.seed}:${i}`, x:p[0], y:p[1], radius:r, seed, forest:false, edge:true, garden:true});
      }
    }
    trees.sort((a, b) => a.y - b.y || a.x - b.x);
    const groundMarks = groundDetails(visible, b, vegetationIndex, obstacles);
    return { viewport, bounds: b, land, roads, water, buildings, trees, groundMarks,
      stats: { sourceBuildingCount: buildings.length, roofCount: buildings.length, roadCount: roads.length,
        sourceRoadCount: roads.length, waterCount: water.length, treeCount: trees.length,
        gardenCount:trees.filter(t => t.garden).length, groundMarkCount:groundMarks.length,
        courtyardCount: buildings.filter(f => f.polygon.length > 1).length, labelCount: 0, poiMarkerCount: 0,
        buildingExtrusionEnabled: false, geometryErrors: 0,
        placementFingerprint: hash(trees.map(t => `${t.key}:${t.radius.toFixed(3)}`).join('|')).toString(16) } };
  }
  global.PixelMapIllustratedGeometry = Object.freeze({ hash, unit, bounds, overlaps, area, parts, inRing,
    inPolygon, inside, edgeDistance, containsDisc, mergeFeatures, featuresNear, kind, isForest, frame, roofPanels,
    roadWidth, blocked, compose });
})(typeof window !== 'undefined' ? window : globalThis);
