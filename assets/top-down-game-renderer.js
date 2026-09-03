((global) => {
  'use strict';

  const PATTERNS = global.PixelMapTopDownPatterns;
  if (!PATTERNS) throw new Error('PixelMapTopDownPatterns is required');

  const version = 'pixelmap-top-down-renderer/2';
  const compositor = Object.freeze([
    'ground', 'landcover', 'water', 'transport', 'bridge',
    'vegetation', 'building-shadow', 'building-roof', 'location',
  ]);
  const layerRank = new Map(compositor.map((layer, index) => [layer, index]));
  const commandRank = new Map([
    ['roof-fill', 0],
    ['roof-detail', 1],
    ['roof-edge-pixels', 2],
  ]);
  const P = PATTERNS.palette;

  function projectPoint(point, input) {
    const { width, height, viewport } = input;
    return [
      (point[0] - viewport.centerX) * viewport.scale + width / 2,
      (point[1] - viewport.centerY) * viewport.scale + height / 2,
    ];
  }

  function projectedPaths(feature, input) {
    return feature.geometry.map(path => path.map(point => projectPoint(point, input)));
  }

  function signedRingArea(ring = []) {
    let area = 0;
    for (let index = 0; index + 1 < ring.length; index += 1) {
      area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
    }
    return area / 2;
  }

  function polygonParts(geometry = []) {
    const firstArea = geometry.map(signedRingArea).find(area => area !== 0) || 1;
    const exteriorSign = Math.sign(firstArea);
    const parts = [];
    for (const ring of geometry) {
      if (!parts.length || Math.sign(signedRingArea(ring) || firstArea) === exteriorSign) parts.push([ring]);
      else parts[parts.length - 1].push(ring);
    }
    return parts;
  }

  function geometryVisible(geometry, input, padding = 18) {
    const bounds = PATTERNS.geometryMetrics(geometry).bounds;
    const topLeft = projectPoint([bounds.minX, bounds.minY], input);
    const bottomRight = projectPoint([bounds.maxX, bounds.maxY], input);
    return bottomRight[0] >= -padding && topLeft[0] <= input.width + padding &&
      bottomRight[1] >= -padding && topLeft[1] <= input.height + padding;
  }

  function boundsOfGeometry(geometry = []) {
    const metrics = PATTERNS.geometryMetrics(geometry);
    return metrics.bounds;
  }

  function pointInRing(point, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersects = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointInFeature(point, feature) {
    if (!feature || feature.type !== 3) return false;
    let inside = false;
    for (const ring of feature.geometry) if (pointInRing(point, ring)) inside = !inside;
    return inside;
  }

  function distanceToSegment(point, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return Math.hypot(point[0] - a[0], point[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
    return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
  }

  function distanceToFeature(point, feature) {
    let distance = Infinity;
    for (const path of feature?.geometry || []) {
      for (let index = 0; index + 1 < path.length; index += 1) {
        distance = Math.min(distance, distanceToSegment(point, path[index], path[index + 1]));
      }
    }
    return distance;
  }

  function featureKey(feature) {
    const metrics = PATTERNS.geometryMetrics(feature.geometry);
    return PATTERNS.featureKey({
      layer: feature.layer, id: feature.id, props: feature.props, bounds: metrics.bounds,
    });
  }

  function semanticClass(feature) {
    return String(feature.props?.subclass || feature.props?.class || feature.props?.landuse || 'unknown').toLowerCase();
  }

  function groundFill(feature) {
    const kind = semanticClass(feature);
    if (['forest', 'wood'].includes(kind)) return P.forest;
    if (['farmland', 'farm', 'orchard'].includes(kind)) return P.field;
    if (['park', 'garden', 'recreation_ground'].includes(kind) || feature.layer === 'park') return P.park;
    if (['commercial', 'retail', 'school', 'hospital'].includes(kind)) return P.plaza;
    if (['residential', 'construction', 'brownfield'].includes(kind)) return P.soil;
    return P.ground;
  }

  function roadWidth(feature) {
    const kind = semanticClass(feature);
    if (['motorway', 'trunk'].includes(kind)) return 21;
    if (kind === 'primary') return 17;
    if (kind === 'secondary') return 13;
    if (kind === 'tertiary') return 10;
    if (['path', 'track', 'footway', 'cycleway', 'pedestrian'].includes(kind)) return 3.5;
    return 6.5;
  }

  function isBridge(feature) {
    const value = String(feature.props?.brunnel || feature.props?.bridge || '').toLowerCase();
    return value === 'bridge' || value === 'true' || value === '1';
  }

  function stableUnit(seed, salt = 0) {
    return (PATTERNS.hashString(`${seed}:${salt}`) & 0xffff) / 0xffff;
  }

  function pushGround(commands, assignments, feature, input) {
    const key = featureKey(feature);
    const selected = PATTERNS.selectPattern('ground', { key, props: feature.props });
    assignments.set(key, selected.pattern.id);
    commands.push({
      layer: 'landcover', kind: 'area-fill', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths: projectedPaths(feature, input), fill: groundFill(feature),
      stroke: P.inkSoft, lineWidth: 1.1,
    });
    commands.push({
      layer: 'landcover', kind: 'area-texture', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths: projectedPaths(feature, input), fill: P.groundLight,
      seed: selected.seed, textureOrigin: projectPoint([0, 0], input),
    });
  }

  function pushWater(commands, assignments, feature, input) {
    const key = featureKey(feature);
    const selected = PATTERNS.selectPattern('water', { key, props: feature.props });
    assignments.set(key, selected.pattern.id);
    const paths = projectedPaths(feature, input);
    if (feature.type === 3) {
      commands.push({ layer: 'water', kind: 'water-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.water, stroke: P.waterDark, lineWidth: 2.2 });
      commands.push({ layer: 'water', kind: 'water-shore', sourceId: feature.id, sourceKey: key,
        patternId: 'water-shore-stones', paths, stroke: P.waterLight, lineWidth: 4.5, inset: true });
      commands.push({ layer: 'water', kind: 'water-ripples', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.waterLight, seed: selected.seed,
        textureOrigin: projectPoint([0, 0], input) });
    } else {
      commands.push({ layer: 'water', kind: 'waterway-edge', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, stroke: P.waterDark, lineWidth: 8 });
      commands.push({ layer: 'water', kind: 'waterway-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, stroke: P.water, lineWidth: 5.2 });
    }
  }

  function pushRoad(commands, assignments, feature, input) {
    const key = featureKey(feature);
    const selected = PATTERNS.selectPattern('road', { key, props: feature.props });
    assignments.set(key, selected.pattern.id);
    const width = roadWidth(feature);
    const paths = projectedPaths(feature, input);
    const layer = isBridge(feature) ? 'bridge' : 'transport';
    commands.push({ layer, kind: 'road-edge', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, stroke: P.roadDark, lineWidth: width + 3.2 });
    commands.push({ layer, kind: 'road-fill', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, stroke: P.road, lineWidth: width });
    commands.push({ layer, kind: 'road-texture', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, stroke: P.roadLight, lineWidth: Math.max(1, width * 0.13),
      dash: selected.pattern.id === 'road-cobbled-major' ? [2, 6] :
        selected.pattern.id === 'road-narrow-path' ? [3, 5] : [1, 8], dashOffset: selected.seed % 11 });
  }

  function pushRail(commands, assignments, feature, input) {
    const key = featureKey(feature);
    assignments.set(key, 'rail-double-line');
    const paths = projectedPaths(feature, input);
    const layer = isBridge(feature) ? 'bridge' : 'transport';
    commands.push({ layer, kind: 'rail-bed', sourceId: feature.id, sourceKey: key,
      patternId: 'rail-double-line', paths, stroke: P.railBed, lineWidth: 8 });
    commands.push({ layer, kind: 'rail-lines', sourceId: feature.id, sourceKey: key,
      patternId: 'rail-double-line', paths, stroke: P.rail, lineWidth: 1.3, railOffset: 2.2 });
  }

  function roofColors(patternId, seed) {
    if (patternId === 'building-flat-workshop') return [P.roofSlate, '#83999d', '#405663'];
    if (patternId === 'building-cross-gable') return ['#466f8e', '#7398a7', '#29485f'];
    if (patternId === 'building-longhouse') return ['#3f6885', '#6f91a0', '#29495f'];
    if (patternId === 'building-hipped') return ['#587f96', '#789aa6', '#34566a'];
    return seed % 3 === 0
      ? [P.roof, P.roofLight, P.roofDark]
      : [seed % 3 === 1 ? '#416b88' : '#5d8097', '#7396a6', '#2e4b61'];
  }

  function pushRoof(commands, assignments, feature, input) {
    for (const geometry of polygonParts(feature.geometry)) {
      if (!geometryVisible(geometry, input)) continue;
      const part = { ...feature, geometry };
      const key = featureKey(part);
      const metrics = PATTERNS.geometryMetrics(part.geometry);
      const selected = PATTERNS.selectPattern('roof', { key, props: feature.props, metrics });
      assignments.set(key, selected.pattern.id);
      const paths = projectedPaths(part, input);
      const [fill, light, dark] = roofColors(selected.pattern.id, selected.seed);
      const minScreenDimension = Math.min(metrics.width, metrics.height) * input.viewport.scale;
      const maxScreenDimension = Math.max(metrics.width, metrics.height) * input.viewport.scale;
      const outlineWidth = minScreenDimension < 6 ? 1.05 : minScreenDimension < 12 ? 1.5 : 2.1;
      const detailLevel = minScreenDimension >= 6 && maxScreenDimension >= 12
        ? 'full'
        : minScreenDimension >= 4 && maxScreenDimension >= 8 ? 'ridge' : null;
      commands.push({ layer: 'building-shadow', kind: 'roof-shadow', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.shadow, translate: [3, 3] });
      commands.push({ layer: 'building-roof', kind: 'roof-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill, stroke: P.ink, lineWidth: outlineWidth });
      if (detailLevel) {
        commands.push({ layer: 'building-roof', kind: 'roof-detail', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, fill: light, stroke: dark, lineWidth: Math.min(1.35, outlineWidth),
          seed: selected.seed, detailPrimitive: selected.pattern.primitive, detailLevel, hardEdge: true });
      }
      if (detailLevel === 'full') {
        commands.push({ layer: 'building-roof', kind: 'roof-edge-pixels', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, fill: dark, highlight: light, seed: selected.seed,
          hardEdge: true, minScreenDimension });
      }
    }
  }

  function treeEligibleAreas(features) {
    return features.filter(feature => feature.type === 3 &&
      (feature.layer === 'park' || ['forest', 'wood', 'park', 'garden', 'recreation_ground', 'grass', 'meadow']
        .includes(semanticClass(feature))));
  }

  function pointBlocked(point, features, clearance) {
    for (const feature of features) {
      if (feature.type === 3 && pointInFeature(point, feature)) return true;
      if (feature.type === 2 && distanceToFeature(point, feature) <= clearance) return true;
    }
    return false;
  }

  function pushVegetation(commands, assignments, features, input) {
    const areas = treeEligibleAreas(features);
    const blockers = features.filter(feature => feature.layer === 'water' || feature.layer === 'building' ||
      feature.layer === 'transportation' || feature.layer === 'transportation_name');
    const seen = new Set();
    for (const area of areas) {
      const areaKey = featureKey(area);
      const kind = semanticClass(area);
      const stepScreen = ['forest', 'wood'].includes(kind) ? 19 : kind === 'grass' ? 34 : 27;
      const step = stepScreen / input.viewport.scale;
      const bounds = boundsOfGeometry(area.geometry);
      const minX = Math.floor(bounds.minX / step) - 1;
      const maxX = Math.ceil(bounds.maxX / step) + 1;
      const minY = Math.floor(bounds.minY / step) - 1;
      const maxY = Math.ceil(bounds.maxY / step) + 1;
      for (let gy = minY; gy <= maxY; gy += 1) {
        for (let gx = minX; gx <= maxX; gx += 1) {
          const cellKey = `${gx}/${gy}`;
          if (seen.has(cellKey)) continue;
          const seed = PATTERNS.hashString(`${areaKey}|tree|${cellKey}`);
          if (kind === 'grass' && seed % 4 !== 0) continue;
          const point = [
            (gx + 0.18 + stableUnit(seed, 1) * 0.64) * step,
            (gy + 0.18 + stableUnit(seed, 2) * 0.64) * step,
          ];
          if (!pointInFeature(point, area)) continue;
          const selected = PATTERNS.selectPattern('tree', { key: `${areaKey}|${cellKey}`, props: area.props });
          const clearance = selected.pattern.radius + 4;
          if (pointBlocked(point, blockers, clearance / input.viewport.scale)) continue;
          seen.add(cellKey);
          const screen = projectPoint(point, input);
          commands.push({
            layer: 'vegetation', kind: 'tree', sourceId: area.id, sourceKey: areaKey,
            patternId: selected.pattern.id, worldX: point[0], worldY: point[1],
            x: screen[0], y: screen[1], radius: selected.pattern.radius,
            clearance, seed: selected.seed,
          });
          assignments.set(`${areaKey}|tree:${cellKey}`, selected.pattern.id);
        }
      }
    }
  }

  function patternAssignments(input) {
    const assignments = new Map();
    for (const feature of [...input.features].sort((a, b) => featureKey(a).localeCompare(featureKey(b)))) {
      const key = featureKey(feature);
      if (feature.layer === 'building') {
        const metrics = PATTERNS.geometryMetrics(feature.geometry);
        assignments.set(key, PATTERNS.selectPattern('roof', { key, props: feature.props, metrics }).pattern.id);
      } else if (feature.layer === 'transportation') {
        assignments.set(key, PATTERNS.selectPattern('road', { key, props: feature.props }).pattern.id);
      } else if (feature.layer === 'water' || feature.layer === 'waterway') {
        assignments.set(key, PATTERNS.selectPattern('water', { key, props: feature.props }).pattern.id);
      } else if (feature.type === 3) {
        assignments.set(key, PATTERNS.selectPattern('ground', { key, props: feature.props }).pattern.id);
      }
    }
    return Object.freeze(Object.fromEntries([...assignments].sort(([a], [b]) => a.localeCompare(b))));
  }

  function buildScene(input) {
    const commands = [{ layer: 'ground', kind: 'background', fill: P.ground, width: input.width, height: input.height }];
    const assignments = new Map();
    const features = [...input.features].sort((a, b) => featureKey(a).localeCompare(featureKey(b)));
    for (const feature of features) {
      if ((feature.layer === 'landcover' || feature.layer === 'landuse' || feature.layer === 'park') && feature.type === 3) {
        pushGround(commands, assignments, feature, input);
      }
    }
    for (const feature of features) {
      if (feature.layer === 'water' || feature.layer === 'waterway') pushWater(commands, assignments, feature, input);
    }
    for (const feature of features) {
      if (feature.layer !== 'transportation' || feature.type !== 2) continue;
      if (String(feature.props?.class || '').toLowerCase() === 'rail') pushRail(commands, assignments, feature, input);
      else pushRoad(commands, assignments, feature, input);
    }
    pushVegetation(commands, assignments, features, input);
    for (const feature of features) if (feature.layer === 'building' && feature.type === 3) pushRoof(commands, assignments, feature, input);
    if (input.location) {
      const [x, y] = projectPoint(input.location, input);
      commands.push({ layer: 'location', kind: 'location-marker', x, y, radius: 7 });
    }
    commands.sort((a, b) => (layerRank.get(a.layer) - layerRank.get(b.layer)) ||
      String(a.sourceKey || '').localeCompare(String(b.sourceKey || '')) ||
      ((commandRank.get(a.kind) ?? 50) - (commandRank.get(b.kind) ?? 50)) || String(a.kind).localeCompare(String(b.kind)));
    const familySets = { ground: new Set(), water: new Set(), road: new Set(), rail: new Set(), roof: new Set(), tree: new Set() };
    for (const command of commands) {
      const family = command.kind === 'tree' ? 'tree' : command.layer === 'building-roof' ? 'roof' :
        command.patternId?.startsWith('rail-') ? 'rail' :
          command.layer === 'transport' || command.layer === 'bridge' ? 'road' :
          command.layer === 'water' ? 'water' : command.layer === 'landcover' ? 'ground' : null;
      if (family && command.patternId) familySets[family].add(command.patternId);
    }
    const sortedAssignments = [...assignments].sort(([a], [b]) => a.localeCompare(b));
    return Object.freeze({
      version, commands: Object.freeze(commands),
      patternFingerprint: PATTERNS.hashString(sortedAssignments.map(entry => entry.join('=')).join('|')).toString(16),
      assignments: Object.freeze(Object.fromEntries(sortedAssignments)),
      stats: Object.freeze({
        patternFamilies: Object.freeze(Object.fromEntries(Object.entries(familySets).map(([key, set]) => [key, set.size]))),
        labelCount: 0, poiMarkerCount: 0, buildingExtrusionEnabled: false, wallCommands: 0, windowCommands: 0,
        treeCount: commands.filter(command => command.kind === 'tree').length,
        roofCount: commands.filter(command => command.kind === 'roof-fill').length,
      }),
    });
  }

  function tracePaths(ctx, paths) {
    ctx.beginPath();
    for (const path of paths) {
      if (!path.length) continue;
      ctx.moveTo(path[0][0], path[0][1]);
      for (let index = 1; index < path.length; index += 1) ctx.lineTo(path[index][0], path[index][1]);
    }
  }

  function fillPolygon(ctx, command) {
    tracePaths(ctx, command.paths);
    if (command.fill) { ctx.fillStyle = command.fill; ctx.fill('evenodd'); }
    if (command.stroke) {
      ctx.strokeStyle = command.stroke; ctx.lineWidth = command.lineWidth || 1;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    }
  }

  function strokePaths(ctx, command, offset = 0) {
    ctx.save();
    if (offset) ctx.translate(offset, 0);
    tracePaths(ctx, command.paths);
    ctx.strokeStyle = command.stroke;
    ctx.lineWidth = command.lineWidth || 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.setLineDash(command.dash || []);
    ctx.lineDashOffset = command.dashOffset || 0;
    ctx.stroke();
    ctx.restore();
  }

  function paintAreaTexture(ctx, command) {
    ctx.save();
    tracePaths(ctx, command.paths); ctx.clip('evenodd');
    const points = command.paths.flat();
    if (!points.length) { ctx.restore(); return; }
    const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    const minX = originX + Math.floor((Math.min(...xs) - originX) / 14) * 14;
    const maxX = Math.max(...xs);
    const minY = originY + Math.floor((Math.min(...ys) - originY) / 14) * 14;
    const maxY = Math.max(...ys);
    ctx.fillStyle = command.fill;
    for (let y = minY; y <= maxY; y += 14) for (let x = minX; x <= maxX; x += 14) {
      const gridX = Math.round((x - originX) / 14);
      const gridY = Math.round((y - originY) / 14);
      const seed = PATTERNS.hashString(`${command.seed}:${gridX}:${gridY}`);
      if (seed % 3 === 0) ctx.fillRect(x + seed % 5, y + (seed >>> 4) % 5, 2, 1);
    }
    ctx.restore();
  }

  function paintWaterRipples(ctx, command) {
    ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd');
    const points = command.paths.flat();
    if (!points.length) { ctx.restore(); return; }
    const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
    ctx.strokeStyle = command.fill; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    const firstX = originX + Math.floor((Math.min(...xs) - originX) / 31) * 31;
    const firstY = originY + Math.floor((Math.min(...ys) - originY) / 27) * 27;
    for (let y = firstY; y <= Math.max(...ys); y += 27) {
      for (let x = firstX; x <= Math.max(...xs); x += 31) {
        const gridX = Math.round((x - originX) / 31);
        const gridY = Math.round((y - originY) / 27);
        const seed = PATTERNS.hashString(`${command.seed}:${gridX}:${gridY}`);
        if (seed % 3 !== 0) continue;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5 + seed % 6, y); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function roofFrame(paths) {
    const ring = paths.find(path => path.length >= 2) || [];
    if (ring.length < 2) return null;
    let longest = [1, 0];
    let longestLength = 0;
    for (let index = 0; index + 1 < ring.length; index += 1) {
      const dx = ring[index + 1][0] - ring[index][0];
      const dy = ring[index + 1][1] - ring[index][1];
      const length = Math.hypot(dx, dy);
      if (length > longestLength) { longest = [dx / length, dy / length]; longestLength = length; }
    }
    if (longest[0] < 0 || (longest[0] === 0 && longest[1] < 0)) longest = [-longest[0], -longest[1]];
    const normal = [-longest[1], longest[0]];
    const points = ring.slice(0, -1).length ? ring.slice(0, -1) : ring;
    const along = points.map(point => point[0] * longest[0] + point[1] * longest[1]);
    const across = points.map(point => point[0] * normal[0] + point[1] * normal[1]);
    const minU = Math.min(...along), maxU = Math.max(...along);
    const minV = Math.min(...across), maxV = Math.max(...across);
    const centerU = (minU + maxU) / 2, centerV = (minV + maxV) / 2;
    return {
      center: [longest[0] * centerU + normal[0] * centerV, longest[1] * centerU + normal[1] * centerV],
      u: longest,
      v: normal,
      halfU: Math.max(1, (maxU - minU) / 2),
      halfV: Math.max(1, (maxV - minV) / 2),
    };
  }

  function roofPoint(frame, along, across) {
    return [
      frame.center[0] + frame.u[0] * along + frame.v[0] * across,
      frame.center[1] + frame.u[1] * along + frame.v[1] * across,
    ];
  }

  function paintPixelLine(ctx, from, to, color, size = 1, salt = 0) {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(length / Math.max(1, size)));
    ctx.fillStyle = color;
    for (let index = 0; index <= steps; index += 1) {
      if (salt && index % 7 === salt % 7) continue;
      const x = Math.round(from[0] + dx * index / steps);
      const y = Math.round(from[1] + dy * index / steps);
      ctx.fillRect(x, y, size, size);
    }
  }

  function paintRoofFacet(ctx, frame, side, color) {
    const u = frame.halfU + 2;
    const v = frame.halfV + 2;
    const points = side < 0
      ? [roofPoint(frame, -u, -v), roofPoint(frame, u, -v), roofPoint(frame, u, 0), roofPoint(frame, -u, 0)]
      : [roofPoint(frame, -u, 0), roofPoint(frame, u, 0), roofPoint(frame, u, v), roofPoint(frame, -u, v)];
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index][0], points[index][1]);
    ctx.closePath(); ctx.fill();
  }

  function paintRoofFlecks(ctx, command, frame) {
    const step = command.patternId === 'building-flat-workshop' ? 5 : 7;
    ctx.fillStyle = command.fill;
    ctx.globalAlpha = 0.7;
    for (let v = -frame.halfV + 2; v < frame.halfV - 1; v += step) {
      for (let u = -frame.halfU + 2; u < frame.halfU - 1; u += step) {
        const gridU = Math.round(u / step), gridV = Math.round(v / step);
        const seed = PATTERNS.hashString(`${command.seed}:roof:${gridU}:${gridV}`);
        if (seed % 4 !== 0) continue;
        const point = roofPoint(frame, u + seed % 2, v + (seed >>> 3) % 2);
        ctx.fillRect(Math.round(point[0]), Math.round(point[1]), seed % 3 === 0 ? 2 : 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function paintRoofDetail(ctx, command) {
    ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd');
    const frame = roofFrame(command.paths);
    if (!frame) { ctx.restore(); return; }
    const hu = Math.max(2, frame.halfU - 1), hv = Math.max(2, frame.halfV - 1);
    const ridgeFrom = roofPoint(frame, -hu, 0), ridgeTo = roofPoint(frame, hu, 0);
    if (command.detailLevel === 'ridge') {
      paintPixelLine(ctx, roofPoint(frame, -hu * .72, 0), roofPoint(frame, hu * .72, 0), command.stroke, 1);
      ctx.restore();
      return;
    }
    paintRoofFacet(ctx, frame, command.seed % 2 ? -1 : 1, command.fill);

    if (command.patternId === 'building-cottage-gable') {
      paintPixelLine(ctx, ridgeFrom, ridgeTo, command.stroke, 2, command.seed);
      paintPixelLine(ctx, roofPoint(frame, -hu * .7, -hv * .55), roofPoint(frame, hu * .2, -hv * .55), command.fill, 1);
    } else if (command.patternId === 'building-longhouse') {
      paintPixelLine(ctx, ridgeFrom, ridgeTo, command.stroke, 2, command.seed);
      for (const position of [-.55, 0, .55]) {
        paintPixelLine(ctx, roofPoint(frame, hu * position, -hv * .72), roofPoint(frame, hu * position, hv * .72), command.stroke, 1, command.seed + 2);
      }
    } else if (command.patternId === 'building-hipped') {
      const center = roofPoint(frame, 0, 0);
      for (const corner of [[-hu, 0], [hu, 0], [0, -hv], [0, hv]]) {
        paintPixelLine(ctx, center, roofPoint(frame, corner[0], corner[1]), command.stroke, 1, command.seed + 3);
      }
      ctx.fillStyle = command.fill; ctx.fillRect(Math.round(center[0]) - 1, Math.round(center[1]) - 1, 3, 2);
    } else if (command.patternId === 'building-flat-workshop') {
      const insetU = hu * .72, insetV = hv * .62;
      const corners = [
        roofPoint(frame, -insetU, -insetV), roofPoint(frame, insetU, -insetV),
        roofPoint(frame, insetU, insetV), roofPoint(frame, -insetU, insetV),
      ];
      for (let index = 0; index < corners.length; index += 1) {
        paintPixelLine(ctx, corners[index], corners[(index + 1) % corners.length], command.stroke, 1, command.seed + index);
      }
      for (const position of [-.38, .28]) {
        const vent = roofPoint(frame, hu * position, 0);
        ctx.fillStyle = command.stroke;
        ctx.fillRect(Math.round(vent[0]) - 1, Math.round(vent[1]) - 1, 3, 3);
        ctx.fillStyle = command.fill;
        ctx.fillRect(Math.round(vent[0]), Math.round(vent[1]) - 1, 2, 1);
      }
    } else if (command.patternId === 'building-cross-gable') {
      paintPixelLine(ctx, ridgeFrom, ridgeTo, command.stroke, 2, command.seed);
      paintPixelLine(ctx, roofPoint(frame, 0, -hv), roofPoint(frame, 0, hv), command.stroke, 2, command.seed + 1);
      const center = roofPoint(frame, 0, 0);
      ctx.fillStyle = command.fill; ctx.fillRect(Math.round(center[0]) - 2, Math.round(center[1]) - 2, 4, 3);
    }
    paintRoofFlecks(ctx, command, frame);
    ctx.restore();
  }

  function paintRoofEdgePixels(ctx, command) {
    if (command.minScreenDimension < 2.5) return;
    ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd');
    for (let pathIndex = 0; pathIndex < command.paths.length; pathIndex += 1) {
      const path = command.paths[pathIndex];
      for (let index = 0; index + 1 < path.length; index += 1) {
        const from = path[index], to = path[index + 1];
        const dx = to[0] - from[0], dy = to[1] - from[1];
        const length = Math.hypot(dx, dy);
        const segmentSeed = PATTERNS.hashString(`${command.seed}:edge:${pathIndex}:${index}`);
        const spacing = 5 + segmentSeed % 4;
        const phase = segmentSeed % spacing;
        for (let distance = phase; distance < length; distance += spacing) {
          const x = Math.round(from[0] + dx * distance / Math.max(1, length));
          const y = Math.round(from[1] + dy * distance / Math.max(1, length));
          ctx.fillStyle = (segmentSeed + distance) % 3 ? command.fill : command.highlight;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  function paintTree(ctx, command) {
    const r = command.radius;
    ctx.save(); ctx.translate(command.x, command.y);
    ctx.fillStyle = P.forestDark; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.4;
    const crowns = command.patternId === 'tree-multi-crown'
      ? [[-r * .42, 1, r * .7], [r * .35, 0, r * .72], [0, -r * .35, r * .76]]
      : command.patternId === 'tree-underbrush'
        ? [[-2, 1, r * .7], [2, -1, r * .65], [0, 2, r * .6]]
        : [[0, 0, r], [-r * .3, r * .14, r * .65], [r * .28, r * .18, r * .62]];
    for (const [x, y, radius] of crowns) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = command.patternId === 'tree-dark-crown' ? P.forest : P.forestLight;
    ctx.beginPath(); ctx.arc(-r * .18, -r * .24, Math.max(1.8, r * .42), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.groundLight; ctx.fillRect(-r * .26, -r * .5, Math.max(1, r * .3), Math.max(1, r * .2));
    ctx.restore();
  }

  function paintCommand(ctx, command) {
    if (command.kind === 'background') { ctx.fillStyle = command.fill; ctx.fillRect(0, 0, command.width, command.height); return; }
    if (command.kind === 'area-fill' || command.kind === 'water-fill' || command.kind === 'roof-fill') { fillPolygon(ctx, command); return; }
    if (command.kind === 'roof-shadow') {
      ctx.save(); ctx.translate(...command.translate); fillPolygon(ctx, command); ctx.restore(); return;
    }
    if (command.kind === 'area-texture') { paintAreaTexture(ctx, command); return; }
    if (command.kind === 'water-ripples') { paintWaterRipples(ctx, command); return; }
    if (command.kind === 'water-shore') {
      ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd'); strokePaths(ctx, command); ctx.restore(); return;
    }
    if (command.kind === 'rail-lines') { strokePaths(ctx, command, -command.railOffset); strokePaths(ctx, command, command.railOffset); return; }
    if (['road-edge', 'road-fill', 'road-texture', 'rail-bed', 'waterway-edge', 'waterway-fill'].includes(command.kind)) {
      strokePaths(ctx, command); return;
    }
    if (command.kind === 'roof-detail') { paintRoofDetail(ctx, command); return; }
    if (command.kind === 'roof-edge-pixels') { paintRoofEdgePixels(ctx, command); return; }
    if (command.kind === 'tree') { paintTree(ctx, command); return; }
    if (command.kind === 'location-marker') {
      ctx.save(); ctx.translate(command.x, command.y);
      ctx.fillStyle = P.locationDark; ctx.beginPath(); ctx.arc(0, 0, command.radius + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.location; ctx.beginPath(); ctx.arc(0, 0, command.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -2, 4, 4); ctx.restore();
    }
  }

  function paintScene(ctx, scene) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const command of scene.commands) paintCommand(ctx, command);
    ctx.restore();
  }

  global.PixelMapTopDownRenderer = Object.freeze({
    version, compositor, buildScene, paintScene, patternAssignments, pointInFeature, distanceToFeature,
  });
})(typeof window !== 'undefined' ? window : globalThis);
