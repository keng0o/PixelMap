((global) => {
  'use strict';

  const PATTERNS = global.PixelMapTopDownPatterns;
  if (!PATTERNS) throw new Error('PixelMapTopDownPatterns is required');
  const MATERIALS = global.PixelMapTopDownMaterials;
  if (!MATERIALS) throw new Error('PixelMapTopDownMaterials is required');

  const version = 'pixelmap-top-down-renderer/9';
  const compositor = Object.freeze([
    'ground', 'landcover', 'water', 'transport', 'bridge',
    'vegetation', 'building-shadow', 'building-roof', 'location',
  ]);
  const layerRank = new Map(compositor.map((layer, index) => [layer, index]));
  const commandRank = new Map([
    ['roof-fill', 0],
    ['roof-detail', 1],
    ['roof-outline-rough', 2],
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

  function buildingUsage(props = {}) {
    const values = [props.subclass, props.class, props.building, props.landuse]
      .map(value => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(values)].join('|') || 'unknown';
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
      stroke: P.inkSoft, roughStroke: P.ink, lineWidth: 1.1,
      roughOutline: true, roughMode: 'jittered-contour', seed: selected.seed,
    });
    commands.push({
      layer: 'landcover', kind: 'area-texture', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths: projectedPaths(feature, input), fill: P.groundLight,
      seed: selected.seed, textureOrigin: projectPoint([0, 0], input),
    });
    commands.push({
      layer: 'landcover', kind: 'area-wash', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths: projectedPaths(feature, input),
      light: P.groundLight, dark: P.groundDark, seed: selected.seed,
      textureOrigin: projectPoint([0, 0], input), worldAnchored: true,
    });
  }

  function pushWater(commands, assignments, feature, input) {
    const key = featureKey(feature);
    const selected = PATTERNS.selectPattern('water', { key, props: feature.props });
    assignments.set(key, selected.pattern.id);
    const paths = projectedPaths(feature, input);
    if (feature.type === 3) {
      commands.push({ layer: 'water', kind: 'water-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.water, stroke: P.waterDark,
        roughStroke: P.ink, lineWidth: 2.2, roughOutline: true,
        roughMode: 'jittered-contour', seed: selected.seed });
      commands.push({ layer: 'water', kind: 'water-shore', sourceId: feature.id, sourceKey: key,
        patternId: 'water-shore-stones', paths, stroke: P.waterLight, roughStroke: P.waterDark,
        lineWidth: 4.5, inset: true, roughOutline: true,
        roughMode: 'jittered-contour', seed: selected.seed });
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
      patternId: selected.pattern.id, paths, stroke: P.roadDark, roughStroke: P.inkSoft,
      lineWidth: width + 3.2, roughOutline: true,
      roughMode: 'jittered-contour', seed: selected.seed });
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
    if (patternId === 'building-flat-workshop') return ['#758a91', '#4a5f67', '#354b53', '#91a4a8'];
    if (patternId === 'building-weathered-gable') return ['#698b9d', '#3a596d', '#284759', '#88a6af'];
    if (patternId === 'building-longhouse') return ['#5e8398', '#344f63', '#253f51', '#7d9ca8'];
    if (patternId === 'building-hipped') return ['#7899a5', '#486979', '#2e4c5d', '#94afb5'];
    return seed % 3 === 0
      ? ['#7096a6', '#426479', '#294a5e', '#91afb8']
      : [seed % 3 === 1 ? '#668da1' : '#799aa7', '#405f74', '#2e4b61', '#91acb5'];
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
      const [fill, shade, dark, highlight] = roofColors(selected.pattern.id, selected.seed);
      const minScreenDimension = Math.min(metrics.width, metrics.height) * input.viewport.scale;
      const maxScreenDimension = Math.max(metrics.width, metrics.height) * input.viewport.scale;
      const outlineWidth = minScreenDimension < 6 ? 1.05 : minScreenDimension < 12 ? 1.5 : 2.1;
      const detailLevel = minScreenDimension >= 6 && maxScreenDimension >= 12
        ? 'full'
        : minScreenDimension >= 4 && maxScreenDimension >= 8 ? 'ridge' : null;
      const usage = buildingUsage(feature.props);
      const referenceDetailEligible = selected.pattern.id !== 'building-flat-workshop' ||
        shouldUseHarborWorkshop(roofFrame(paths), usage);
      commands.push({ layer: 'building-shadow', kind: 'roof-shadow', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.shadow, translate: [3, 3] });
      commands.push({ layer: 'building-roof', kind: 'roof-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill, stroke: P.ink, roughStroke: dark,
        lineWidth: outlineWidth, roughOutline: minScreenDimension >= 4,
        roughMode: 'jittered-contour', seed: selected.seed });
      if (detailLevel) {
        commands.push({ layer: 'building-roof', kind: 'roof-detail', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, shade, stroke: dark, highlight,
          lineWidth: Math.min(1.35, outlineWidth), seed: selected.seed,
          detailPrimitive: selected.pattern.primitive, detailLevel, hardEdge: true,
          lineDirection: selected.pattern.lineDirection, lightDirection: 'upper-left', shadowHalf: 'lower-right',
          buildingUsage: usage, referenceDetailEligible });
      }
      if (detailLevel === 'full') {
        commands.push({ layer: 'building-roof', kind: 'roof-outline-rough', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, stroke: dark, highlight, seed: selected.seed,
          hardEdge: true, handDrawn: true, minScreenDimension });
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
      const stepScreen = ['forest', 'wood'].includes(kind) ? 17 : kind === 'grass' ? 34 : 24;
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
            clearance, seed: selected.seed, crownPrimitive: selected.pattern.primitive,
            crownLayers: 3, handDrawn: selected.pattern.handDrawn,
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
    const commands = [
      { layer: 'ground', kind: 'background', fill: P.ground, width: input.width, height: input.height },
      { layer: 'ground', kind: 'ground-wash', width: input.width, height: input.height,
        light: P.groundLight, dark: P.groundDark, seed: PATTERNS.hashString('ground-wash'),
        textureOrigin: projectPoint([0, 0], input), worldAnchored: true },
    ];
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
    if (command.roughOutline) paintRoughPath(ctx, command);
  }

  function traceJitteredPaths(ctx, paths, seed, pass) {
    ctx.beginPath();
    for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
      const path = paths[pathIndex];
      if (!path.length) continue;
      const pointSeed = PATTERNS.hashString(`${seed}:rough:${pass}:${pathIndex}:start`);
      const start = [
        path[0][0] + (stableUnit(pointSeed, 1) - .5) * 1.15,
        path[0][1] + (stableUnit(pointSeed, 2) - .5) * 1.15,
      ];
      ctx.moveTo(start[0], start[1]);
      for (let index = 0; index + 1 < path.length; index += 1) {
        const from = path[index];
        const to = path[index + 1];
        const dx = to[0] - from[0], dy = to[1] - from[1];
        const length = Math.hypot(dx, dy);
        const sections = Math.max(1, Math.ceil(length / 14));
        const normalX = length ? -dy / length : 0;
        const normalY = length ? dx / length : 0;
        for (let section = 1; section <= sections; section += 1) {
          const t = section / sections;
          const sectionSeed = PATTERNS.hashString(`${seed}:rough:${pass}:${pathIndex}:${index}:${section}`);
          const normalJitter = (stableUnit(sectionSeed, 1) - .5) * (pass ? 1.8 : 1.25);
          const alongJitter = section < sections ? (stableUnit(sectionSeed, 2) - .5) * .9 : 0;
          ctx.lineTo(
            from[0] + dx * t + normalX * normalJitter + dx / Math.max(1, length) * alongJitter,
            from[1] + dy * t + normalY * normalJitter + dy / Math.max(1, length) * alongJitter,
          );
        }
      }
    }
  }

  function paintRoughPath(ctx, command, offset = 0) {
    const baseSeed = Number(command.seed) || PATTERNS.hashString(command.sourceKey || command.kind || 'rough');
    for (let pass = 0; pass < 2; pass += 1) {
      ctx.save();
      if (offset) ctx.translate(offset, 0);
      traceJitteredPaths(ctx, command.paths, baseSeed, pass);
      ctx.strokeStyle = command.roughStroke || command.stroke || P.ink;
      ctx.lineWidth = Math.max(.75, (command.lineWidth || 1) + (pass ? .9 : .35));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = pass ? .17 : .24;
      ctx.stroke();
      ctx.restore();
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
    if (command.roughOutline) paintRoughPath(ctx, command, offset);
  }

  function paintWashBlob(ctx, x, y, radius, seed, color, alpha) {
    const points = 9;
    ctx.beginPath();
    for (let index = 0; index < points; index += 1) {
      const angle = Math.PI * 2 * index / points;
      const localRadius = radius * (.64 + stableUnit(seed, index + 1) * .42);
      const px = x + Math.cos(angle) * localRadius;
      const py = y + Math.sin(angle) * localRadius * (.58 + stableUnit(seed, index + 30) * .22);
      if (!index) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }

  function paintSurfaceWash(ctx, command) {
    ctx.save();
    let minX = 0, minY = 0, maxX = command.width || 0, maxY = command.height || 0;
    if (command.paths?.length) {
      tracePaths(ctx, command.paths);
      ctx.clip('evenodd');
      const points = command.paths.flat();
      if (!points.length) { ctx.restore(); return; }
      const xs = points.map(point => point[0]);
      const ys = points.map(point => point[1]);
      minX = Math.min(...xs); minY = Math.min(...ys);
      maxX = Math.max(...xs); maxY = Math.max(...ys);
    }
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    const step = command.kind === 'ground-wash' ? 62 : 50;
    const firstX = originX + Math.floor((minX - originX) / step) * step;
    const firstY = originY + Math.floor((minY - originY) / step) * step;
    for (let y = firstY; y <= maxY; y += step) {
      for (let x = firstX; x <= maxX; x += step) {
        const gridX = Math.round((x - originX) / step);
        const gridY = Math.round((y - originY) / step);
        const seed = PATTERNS.hashString(`${command.seed}:wash:${gridX}:${gridY}`);
        if (seed % 3 === 0) continue;
        const centerX = x + (stableUnit(seed, 2) - .5) * step * .72;
        const centerY = y + (stableUnit(seed, 3) - .5) * step * .72;
        const radius = 15 + stableUnit(seed, 4) * 17;
        const color = seed % 2 ? command.light : command.dark;
        paintWashBlob(ctx, centerX, centerY, radius, seed, color, .1 + stableUnit(seed, 5) * .08);
      }
    }
    ctx.globalAlpha = 1;
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

  function shouldUseReferenceRoof(frame, assetId, maxScale = 1.65) {
    const asset = MATERIALS.catalog[assetId];
    if (!frame || !asset?.fitBounds) return false;
    const nativeWidth = asset.fitBounds.maxX - asset.fitBounds.minX;
    const nativeHeight = asset.fitBounds.maxY - asset.fitBounds.minY;
    if (!(nativeWidth > 0) || !(nativeHeight > 0)) return false;
    const alongScale = frame.halfU * 2 / nativeWidth;
    const acrossScale = frame.halfV * 2 / nativeHeight;
    return Number.isFinite(alongScale) && Number.isFinite(acrossScale) &&
      Math.max(alongScale, acrossScale) <= maxScale;
  }

  function shouldUseHarborWorkshop(frame, usage) {
    if (!frame) return false;
    const allowed = new Set([
      'industrial', 'warehouse', 'manufacture', 'factory', 'works', 'depot',
      'storage', 'storage_tank', 'silo',
    ]);
    const kinds = String(usage || '').toLowerCase().split('|');
    if (!kinds.some(kind => allowed.has(kind))) return false;
    const width = frame.halfU * 2;
    const height = frame.halfV * 2;
    const shortEdge = Math.min(width, height);
    const longEdge = Math.max(width, height);
    if (shortEdge < 12 || longEdge > 50) return false;
    const asset = MATERIALS.catalog['building-harbor-workshop-04'];
    const nativeWidth = asset.fitBounds.maxX - asset.fitBounds.minX;
    const nativeHeight = asset.fitBounds.maxY - asset.fitBounds.minY;
    const alongScale = width / nativeWidth;
    const acrossScale = height / nativeHeight;
    const distortion = Math.max(alongScale, acrossScale) / Math.max(.000001, Math.min(alongScale, acrossScale));
    return distortion <= 1.45 && shouldUseReferenceRoof(frame, 'building-harbor-workshop-04');
  }

  function shouldUseWeatheredGable(frame) {
    if (!frame || !shouldUseReferenceRoof(frame, 'building-blue-weathered-05')) return false;
    const asset = MATERIALS.catalog['building-blue-weathered-05'];
    const width = frame.halfU * 2;
    const height = frame.halfV * 2;
    const shortEdge = Math.min(width, height);
    const longEdge = Math.max(width, height);
    const nativeWidth = asset.fitBounds.maxX - asset.fitBounds.minX;
    const nativeHeight = asset.fitBounds.maxY - asset.fitBounds.minY;
    const alongScale = width / nativeWidth;
    const acrossScale = height / nativeHeight;
    const distortion = Math.max(alongScale, acrossScale) / Math.max(.000001, Math.min(alongScale, acrossScale));
    return shortEdge >= 8 && longEdge <= 52 && distortion <= 1.6;
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

  function roofShadowSide(frame) {
    const lowerRightProjection = frame.v[0] + frame.v[1];
    if (Math.abs(lowerRightProjection) > 0.000001) return lowerRightProjection > 0 ? 1 : -1;
    if (Math.abs(frame.v[1]) > 0.000001) return frame.v[1] > 0 ? 1 : -1;
    return frame.v[0] > 0 ? 1 : -1;
  }

  function roofTrackDefinitions(patternId, detailLevel) {
    if (detailLevel === 'ridge') return [{ across: 0, start: -.72, end: .72, thickness: 1, pieces: 2 }];
    if (patternId === 'building-cottage-gable') return [
      { across: 0, start: -.9, end: .9, thickness: 2, pieces: 3 },
      { across: -.48, start: -.68, end: .24, thickness: 1, pieces: 2 },
    ];
    if (patternId === 'building-longhouse') return [
      { across: -.54, start: -.88, end: .86, thickness: 1, pieces: 3 },
      { across: -.17, start: -.92, end: .9, thickness: 2, pieces: 3 },
      { across: .18, start: -.86, end: .92, thickness: 1, pieces: 3 },
      { across: .54, start: -.82, end: .84, thickness: 1, pieces: 2 },
    ];
    if (patternId === 'building-hipped') return [
      { across: 0, start: -.72, end: .72, thickness: 2, pieces: 3 },
      { across: -.42, start: -.5, end: .48, thickness: 1, pieces: 2 },
      { across: .42, start: -.48, end: .52, thickness: 1, pieces: 2 },
    ];
    if (patternId === 'building-flat-workshop') return [
      { across: -.34, start: -.82, end: .86, thickness: 1, pieces: 3 },
      { across: .34, start: -.86, end: .8, thickness: 1, pieces: 3 },
    ];
    return [
      { across: -.5, start: -.78, end: .66, thickness: 1, pieces: 3 },
      { across: -.12, start: -.9, end: .88, thickness: 2, pieces: 3 },
      { across: .3, start: -.68, end: .82, thickness: 1, pieces: 3 },
      { across: .62, start: -.52, end: .48, thickness: 1, pieces: 2 },
    ];
  }

  function roofStrokePlan(frame, { patternId, seed = 0, detailLevel = 'full' } = {}) {
    const tracks = roofTrackDefinitions(patternId, detailLevel);
    const hu = Math.max(2, frame.halfU - 1);
    const hv = Math.max(2, frame.halfV - 1);
    const segments = [];
    tracks.forEach((track, trackIndex) => {
      const start = track.start * hu;
      const end = track.end * hu;
      const span = end - start;
      const pieces = Math.max(1, track.pieces || 1);
      const gap = Math.min(2.5, Math.max(.75, Math.abs(span) * .045));
      const acrossJitter = (stableUnit(seed, 40 + trackIndex) - .5) * Math.min(.9, hv * .09);
      for (let pieceIndex = 0; pieceIndex < pieces; pieceIndex += 1) {
        const cellStart = start + span * pieceIndex / pieces;
        const cellEnd = start + span * (pieceIndex + 1) / pieces;
        const leadingJitter = (stableUnit(seed, 70 + trackIndex * 9 + pieceIndex) - .5) * .8;
        const trailingJitter = (stableUnit(seed, 90 + trackIndex * 9 + pieceIndex) - .5) * .8;
        const segmentStart = cellStart + (pieceIndex ? gap : 0) + leadingJitter;
        const segmentEnd = cellEnd - (pieceIndex + 1 < pieces ? gap : 0) + trailingJitter;
        if (segmentEnd <= segmentStart + .35) continue;
        const across = track.across * hv + acrossJitter;
        segments.push(Object.freeze({
          from: Object.freeze(roofPoint(frame, segmentStart, across)),
          to: Object.freeze(roofPoint(frame, segmentEnd, across)),
          thickness: track.thickness,
          salt: (seed + trackIndex * 3 + pieceIndex + 1) % 7,
          trackIndex,
        }));
      }
    });
    return Object.freeze(segments);
  }

  function paintRoofFlecks(ctx, command, frame) {
    const step = command.patternId === 'building-flat-workshop' ? 5 : 7;
    ctx.fillStyle = command.highlight;
    ctx.globalAlpha = 0.42;
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
    if (command.patternId === 'building-cottage-gable') {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-gable-01', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (command.patternId === 'building-longhouse' &&
        shouldUseReferenceRoof(frame, 'building-blue-longhouse-03')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-longhouse-03', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (command.patternId === 'building-hipped' &&
        shouldUseReferenceRoof(frame, 'building-blue-hipped-02')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-hipped-02', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (command.patternId === 'building-flat-workshop' && command.referenceDetailEligible &&
        shouldUseReferenceRoof(frame, 'building-harbor-workshop-04')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-harbor-workshop-04', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (command.patternId === 'building-weathered-gable' && shouldUseWeatheredGable(frame)) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-weathered-05', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    paintRoofFacet(ctx, frame, roofShadowSide(frame), command.shade);
    const strokes = roofStrokePlan(frame, command);
    for (const stroke of strokes) {
      const color = stroke.trackIndex % 3 === 2 ? command.highlight : command.stroke;
      paintPixelLine(ctx, stroke.from, stroke.to, color, stroke.thickness, stroke.salt);
    }

    if (command.detailLevel === 'ridge') {
      ctx.restore();
      return;
    }
    if (command.patternId === 'building-flat-workshop') {
      const hu = Math.max(2, frame.halfU - 1);
      for (const position of [-.38, .28]) {
        const vent = roofPoint(frame, hu * position, 0);
        ctx.fillStyle = command.stroke;
        ctx.fillRect(Math.round(vent[0]) - 1, Math.round(vent[1]) - 1, 3, 3);
        ctx.fillStyle = command.highlight;
        ctx.fillRect(Math.round(vent[0]), Math.round(vent[1]) - 1, 2, 1);
      }
    }
    paintRoofFlecks(ctx, command, frame);
    ctx.restore();
  }

  function paintRoofOutlineRough(ctx, command) {
    if (command.minScreenDimension < 2.5) return;
    ctx.save();
    for (let pathIndex = 0; pathIndex < command.paths.length; pathIndex += 1) {
      const path = command.paths[pathIndex];
      for (let index = 0; index + 1 < path.length; index += 1) {
        const from = path[index], to = path[index + 1];
        const dx = to[0] - from[0], dy = to[1] - from[1];
        const length = Math.hypot(dx, dy);
        if (!length) continue;
        const normal = [-dy / length, dx / length];
        const segmentSeed = PATTERNS.hashString(`${command.seed}:edge:${pathIndex}:${index}`);
        const spacing = 5 + segmentSeed % 6;
        const phase = segmentSeed % spacing;
        for (let distance = phase; distance < length; distance += spacing) {
          const variation = PATTERNS.hashString(`${segmentSeed}:${Math.floor(distance)}`);
          const start = distance / length;
          const end = Math.min(length, distance + 2 + variation % 4) / length;
          const normalJitter = (stableUnit(variation, 1) - .5) * 1.5;
          ctx.beginPath();
          ctx.moveTo(from[0] + dx * start + normal[0] * normalJitter,
            from[1] + dy * start + normal[1] * normalJitter);
          ctx.lineTo(from[0] + dx * end + normal[0] * normalJitter,
            from[1] + dy * end + normal[1] * normalJitter);
          ctx.globalAlpha = variation % 5 === 0 ? .45 : .82;
          ctx.strokeStyle = variation % 6 === 0 ? command.highlight : command.stroke;
          ctx.lineWidth = variation % 4 === 0 ? 1.6 : .85;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function traceScallopedCrown(ctx, x, y, radius, seed, lobes = 11) {
    const points = [];
    for (let index = 0; index < lobes; index += 1) {
      const angle = Math.PI * 2 * index / lobes;
      const localRadius = radius * (.78 + stableUnit(seed, index + 1) * .3);
      points.push([
        x + Math.cos(angle) * localRadius,
        y + Math.sin(angle) * localRadius,
      ]);
    }
    const firstMidpoint = [
      (points[0][0] + points.at(-1)[0]) / 2,
      (points[0][1] + points.at(-1)[1]) / 2,
    ];
    ctx.beginPath();
    ctx.moveTo(firstMidpoint[0], firstMidpoint[1]);
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const next = points[(index + 1) % points.length];
      ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
    }
    ctx.closePath();
  }

  function paintTree(ctx, command) {
    const r = command.radius;
    if (command.patternId === 'tree-light-crown') {
      MATERIALS.paintTreeAt(ctx, 'tree-round-crown-01', {
        x: command.x, y: command.y, radius: r, seed: command.seed,
      });
      return;
    }
    if (command.patternId === 'tree-dark-crown') {
      MATERIALS.paintTreeAt(ctx, 'tree-dark-crown-03', {
        x: command.x, y: command.y, radius: r, seed: command.seed,
      });
      return;
    }
    if (command.patternId === 'tree-small') {
      MATERIALS.paintTreeAt(ctx, 'tree-small-crown-02', {
        x: command.x, y: command.y, radius: r, seed: command.seed,
      });
      return;
    }
    if (command.patternId === 'tree-multi-crown') {
      MATERIALS.paintTreeAt(ctx, 'tree-multi-crown-04', {
        x: command.x, y: command.y, radius: r, seed: command.seed,
      });
      return;
    }
    if (command.patternId === 'tree-underbrush') {
      MATERIALS.paintTreeAt(ctx, 'tree-underbrush-cluster-05', {
        x: command.x, y: command.y, radius: r, seed: command.seed,
      });
      return;
    }
    ctx.save();
    ctx.translate(command.x, command.y);
    const crowns = command.patternId === 'tree-multi-crown'
      ? [[-r * .38, 1, r * .76], [r * .34, 0, r * .78], [0, -r * .32, r * .82]]
      : command.patternId === 'tree-underbrush'
        ? [[-r * .35, 1, r * .7], [r * .34, -1, r * .66], [0, r * .22, r * .64]]
        : [[0, 0, r], [-r * .32, r * .15, r * .68], [r * .3, r * .2, r * .65]];
    for (let index = 0; index < crowns.length; index += 1) {
      const [x, y, radius] = crowns[index];
      const crownSeed = PATTERNS.hashString(`${command.seed}:crown:${index}`);
      traceScallopedCrown(ctx, x + 1.3, y + 1.7, radius * 1.03, crownSeed + 1, 10 + crownSeed % 4);
      ctx.fillStyle = P.forestDark;
      ctx.globalAlpha = .68;
      ctx.fill();

      traceScallopedCrown(ctx, x, y, radius, crownSeed + 2, 10 + (crownSeed >>> 3) % 4);
      ctx.fillStyle = command.patternId === 'tree-dark-crown' ? P.forestDark : P.forest;
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = index ? 1 : 1.35;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.stroke();

      traceScallopedCrown(ctx, x - radius * .14, y - radius * .2, radius * .68,
        crownSeed + 3, 8 + (crownSeed >>> 6) % 3);
      ctx.fillStyle = command.patternId === 'tree-dark-crown' ? P.forest : P.forestLight;
      ctx.globalAlpha = .9;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const highlightCount = command.patternId === 'tree-dark-crown' ? 2 : 3;
    for (let index = 0; index < highlightCount; index += 1) {
      const seed = PATTERNS.hashString(`${command.seed}:leaf-light:${index}`);
      const x = -r * .5 + stableUnit(seed, 1) * r * .72;
      const y = -r * .58 + stableUnit(seed, 2) * r * .55;
      traceScallopedCrown(ctx, x, y, Math.max(1.2, r * (.12 + stableUnit(seed, 3) * .11)), seed, 7);
      ctx.fillStyle = P.groundLight;
      ctx.globalAlpha = .68;
      ctx.fill();
    }
    ctx.globalAlpha = .72;
    ctx.fillStyle = P.inkSoft;
    for (let index = 0; index < 3; index += 1) {
      const seed = PATTERNS.hashString(`${command.seed}:leaf-mark:${index}`);
      const x = Math.round((stableUnit(seed, 1) - .5) * r * .85);
      const y = Math.round((stableUnit(seed, 2) - .5) * r * .72);
      ctx.fillRect(x, y, 1 + seed % 2, 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function paintCommand(ctx, command) {
    if (command.kind === 'background') { ctx.fillStyle = command.fill; ctx.fillRect(0, 0, command.width, command.height); return; }
    if (command.kind === 'ground-wash' || command.kind === 'area-wash') { paintSurfaceWash(ctx, command); return; }
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
    if (command.kind === 'roof-outline-rough') { paintRoofOutlineRough(ctx, command); return; }
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
    roofFrame, roofShadowSide, roofStrokePlan, shouldUseReferenceRoof, shouldUseHarborWorkshop,
    shouldUseWeatheredGable,
  });
})(typeof window !== 'undefined' ? window : globalThis);
