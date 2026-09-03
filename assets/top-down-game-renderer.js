((global) => {
  'use strict';

  const PATTERNS = global.PixelMapTopDownPatterns;
  if (!PATTERNS) throw new Error('PixelMapTopDownPatterns is required');

  const version = 'pixelmap-top-down-renderer/1';
  const compositor = Object.freeze([
    'ground', 'landcover', 'water', 'transport', 'bridge',
    'vegetation', 'building-shadow', 'building-roof', 'location',
  ]);
  const layerRank = new Map(compositor.map((layer, index) => [layer, index]));
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
    if (patternId === 'roof-earth-accent') return [P.roofEarth, '#b18b6f', '#674b42'];
    if (patternId === 'roof-flat-vents') return [P.roofSlate, '#8fa1a4', '#405663'];
    if (patternId === 'roof-landmark') return [P.roofStone, '#b0b8ae', '#566765'];
    return seed % 3 === 0
      ? [P.roof, P.roofLight, P.roofDark]
      : [seed % 3 === 1 ? '#416b88' : '#5d8097', '#86a9b8', '#2e4b61'];
  }

  function pushRoof(commands, assignments, feature, input) {
    const key = featureKey(feature);
    const metrics = PATTERNS.geometryMetrics(feature.geometry);
    const selected = PATTERNS.selectPattern('roof', { key, props: feature.props, metrics });
    assignments.set(key, selected.pattern.id);
    const paths = projectedPaths(feature, input);
    const [fill, light, dark] = roofColors(selected.pattern.id, selected.seed);
    commands.push({ layer: 'building-shadow', kind: 'roof-shadow', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, fill: P.shadow, translate: [3, 3] });
    commands.push({ layer: 'building-roof', kind: 'roof-fill', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, fill, stroke: P.ink, lineWidth: 2.1 });
    commands.push({ layer: 'building-roof', kind: 'roof-detail', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, paths, fill: light, stroke: dark, lineWidth: 1.35,
      seed: selected.seed, axis: metrics.axis });
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
      String(a.sourceKey || '').localeCompare(String(b.sourceKey || '')) || String(a.kind).localeCompare(String(b.kind)));
    const familySets = { ground: new Set(), water: new Set(), road: new Set(), roof: new Set(), tree: new Set() };
    for (const command of commands) {
      const family = command.kind === 'tree' ? 'tree' : command.layer === 'building-roof' ? 'roof' :
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

  function paintRoofDetail(ctx, command) {
    ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd');
    const points = command.paths.flat();
    const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    ctx.strokeStyle = command.stroke; ctx.fillStyle = command.fill; ctx.lineWidth = command.lineWidth;
    if (command.patternId === 'roof-flat-vents') {
      for (let y = minY + 5; y < maxY - 3; y += 9) for (let x = minX + 5; x < maxX - 3; x += 11) {
        if (PATTERNS.hashString(`${command.seed}:${x}:${y}`) % 3 === 0) ctx.fillRect(x, y, 3, 2);
      }
    } else if (command.patternId === 'roof-hipped') {
      ctx.beginPath(); ctx.moveTo(minX, cy); ctx.lineTo(cx, minY); ctx.lineTo(maxX, cy); ctx.lineTo(cx, maxY); ctx.closePath(); ctx.stroke();
    } else if (command.patternId === 'roof-compound' || command.patternId === 'roof-landmark') {
      ctx.beginPath(); ctx.moveTo(minX, cy); ctx.lineTo(maxX, cy); ctx.moveTo(cx, minY); ctx.lineTo(cx, maxY); ctx.stroke();
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    } else if (command.axis === 'horizontal') {
      ctx.beginPath(); ctx.moveTo(minX, cy); ctx.lineTo(maxX, cy); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(cx, minY); ctx.lineTo(cx, maxY); ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    ctx.fillRect(minX + 3, minY + 3, Math.max(2, (maxX - minX) * 0.35), 2);
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
