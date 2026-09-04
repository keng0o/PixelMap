((global) => {
  'use strict';

  const PATTERNS = global.PixelMapTopDownPatterns;
  if (!PATTERNS) throw new Error('PixelMapTopDownPatterns is required');
  const MATERIALS = global.PixelMapTopDownMaterials;
  if (!MATERIALS) throw new Error('PixelMapTopDownMaterials is required');
  const COMPOSER = global.PixelMapTopDownComposer;
  if (!COMPOSER) throw new Error('PixelMapTopDownComposer is required');

  const version = 'pixelmap-top-down-renderer/12';
  const compositor = Object.freeze([
    'ground', 'landcover', 'water', 'transport', 'bridge',
    'story-route', 'vegetation', 'building-shadow', 'building-roof',
    'structure', 'traveler', 'location',
  ]);
  const layerRank = new Map(compositor.map((layer, index) => [layer, index]));
  const commandRank = new Map([
    ['rail-bed', 0],
    ['road-edge', 1],
    ['road-fill', 2],
    ['road-texture', 3],
    ['rail-lines', 4],
    ['story-route', 0],
    ['roof-fill', 0],
    ['roof-detail', 1],
    ['roof-outline-rough', 2],
    ['settlement-house', 0],
    ['landmark-house', 0],
    ['traveler', 0],
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
      stroke: P.groundDark, strokeAlpha: .24, roughStroke: P.inkSoft, roughAlpha: .32, lineWidth: .8,
      roughOutline: ['ground-deep-undergrowth', 'ground-field-furrows'].includes(selected.pattern.id),
      roughMode: 'jittered-contour', seed: selected.seed,
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
    const referenceAsset = selected.pattern.referenceAsset;
    const material = referenceAsset ? MATERIALS.catalog[referenceAsset] : null;
    const colors = material?.palette;
    const openReferenceWater = selected.pattern.id === 'water-open' && material?.family === 'water';
    if (feature.type === 3) {
      commands.push({ layer: 'water', kind: 'water-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, referenceAsset, paths, fill: colors?.base || P.water,
        stroke: openReferenceWater ? null : (colors?.ripple || P.waterDark),
        roughStroke: P.ink, lineWidth: 2.2, roughOutline: !openReferenceWater,
        roughMode: 'jittered-contour', seed: selected.seed });
      if (!openReferenceWater) {
        commands.push({ layer: 'water', kind: 'water-shore', sourceId: feature.id, sourceKey: key,
          patternId: 'water-shore-stones', paths, stroke: colors?.light || P.waterLight,
          roughStroke: colors?.ripple || P.waterDark,
          lineWidth: 4.5, inset: true, roughOutline: true,
          roughMode: 'jittered-contour', seed: selected.seed });
      }
      commands.push({ layer: 'water', kind: 'water-ripples', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, referenceAsset, paths,
        fill: colors?.light || P.waterLight, stroke: colors?.ripple || P.waterDark,
        seed: selected.seed, textureOrigin: projectPoint([0, 0], input),
        worldAnchored: Boolean(referenceAsset), sparseMotif: openReferenceWater,
        motifSpacing: openReferenceWater ? [96, 88] : undefined });
    } else {
      commands.push({ layer: 'water', kind: 'waterway-edge', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, stroke: P.waterDark, lineWidth: 8 });
      commands.push({ layer: 'water', kind: 'waterway-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, stroke: P.water, lineWidth: 5.2 });
    }
  }

  function pushRoad(commands, assignments, feature, input, { subdued = false } = {}) {
    const key = featureKey(feature);
    const selected = PATTERNS.selectPattern('road', { key, props: feature.props });
    assignments.set(key, selected.pattern.id);
    const referenceAsset = selected.pattern.referenceAsset;
    const material = referenceAsset ? MATERIALS.catalog[referenceAsset] : null;
    const colors = material?.palette;
    const baseWidth = roadWidth(feature);
    const width = subdued ? Math.max(3, baseWidth * .56) : baseWidth;
    const paths = projectedPaths(feature, input);
    const layer = isBridge(feature) ? 'bridge' : 'transport';
    commands.push({ layer, kind: 'road-edge', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, referenceAsset, paths,
      stroke: colors?.wear || P.roadDark, lineWidth: width + 2.2,
      alpha: subdued ? .2 : .5, edgeTexture: 'soft-broken-verge', roadWidth: width,
      subdued,
      roughOutline: false, seed: selected.seed,
      textureOrigin: projectPoint([0, 0], input), worldAnchored: true });
    commands.push({ layer, kind: 'road-fill', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, referenceAsset, paths,
      stroke: colors?.base || P.road, lineWidth: width, alpha: subdued ? .46 : 1, subdued });
    commands.push({ layer, kind: 'road-texture', sourceId: feature.id, sourceKey: key,
      patternId: selected.pattern.id, referenceAsset, paths,
      stroke: colors?.light || P.roadLight, lineWidth: Math.max(1, width * 0.13),
      roadWidth: width, subdued,
      surfaceWear: 'edge-gravel-clusters',
      dash: selected.pattern.id === 'road-cobbled-major' ? [2, 6] :
        selected.pattern.id === 'road-narrow-path' ? [3, 5] : [1, 8],
      dashOffset: selected.seed % 11, seed: selected.seed,
      textureOrigin: projectPoint([0, 0], input), worldAnchored: true });
  }

  function pushRail(commands, assignments, feature, input) {
    const key = featureKey(feature);
    assignments.set(key, 'rail-double-line');
    const paths = projectedPaths(feature, input);
    const layer = isBridge(feature) ? 'bridge' : 'transport';
    commands.push({ layer, kind: 'rail-bed', sourceId: feature.id, sourceKey: key,
      patternId: 'rail-double-line', paths, stroke: P.railBed, lineWidth: 6.4, alpha: .7 });
    commands.push({ layer, kind: 'rail-lines', sourceId: feature.id, sourceKey: key,
      patternId: 'rail-double-line', paths, stroke: P.rail, lineWidth: .9, railOffset: 1.8, alpha: .68 });
  }

  function roofColors(patternId, seed) {
    if (patternId === 'building-flat-workshop') return ['#6f909e', '#4c6876', '#3a5664', '#93aeb4'];
    if (patternId === 'building-weathered-gable') return ['#7396a6', '#496a7c', '#35566a', '#94b0b7'];
    if (patternId === 'building-longhouse') return ['#6c91a4', '#45657a', '#34546a', '#8dabb5'];
    if (patternId === 'building-hipped') return ['#82a3ad', '#567785', '#3d5d6c', '#a0b9bd'];
    return seed % 3 === 0
      ? ['#789dab', '#4d6d80', '#36566a', '#9ab5bb']
      : [seed % 3 === 1 ? '#7397a8' : '#83a3ad', '#4b6a7b', '#3a596b', '#9ab3ba'];
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
      const displayFill = minScreenDimension < 5 ? highlight : fill;
      const outlineWidth = minScreenDimension < 5 ? .65 : minScreenDimension < 10 ? .95 : 1.3;
      const strokeAlpha = minScreenDimension < 3 ? .26 : minScreenDimension < 5 ? .36 :
        minScreenDimension < 9 ? .5 : maxScreenDimension >= 48 ? .56 : .66;
      const detailLevel = minScreenDimension >= 10.5 && maxScreenDimension >= 18
        ? 'full'
        : minScreenDimension >= 7 && maxScreenDimension >= 12 ? 'ridge' : null;
      const largeRoof = minScreenDimension >= 18 && maxScreenDimension >= 48;
      const roofPlaneCount = largeRoof ? Math.max(3, Math.min(4, Math.round(maxScreenDimension / 72) + 2)) : 2;
      const usage = buildingUsage(feature.props);
      const referenceDetailEligible = selected.pattern.id !== 'building-flat-workshop' ||
        shouldUseHarborWorkshop(roofFrame(paths), usage);
      commands.push({ layer: 'building-shadow', kind: 'roof-shadow', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: P.shadow, fillAlpha: minScreenDimension < 3 ? .06 :
          minScreenDimension < 5 ? .12 : .4,
        translate: minScreenDimension < 5 ? [1.2, 1.2] : [2.2, 2.2] });
      commands.push({ layer: 'building-roof', kind: 'roof-fill', sourceId: feature.id, sourceKey: key,
        patternId: selected.pattern.id, paths, fill: displayFill, stroke: minScreenDimension < 9 ? dark : P.ink, roughStroke: dark,
        lineWidth: outlineWidth, strokeAlpha, roughAlpha: .42,
        brokenOutline: minScreenDimension < 5 || largeRoof,
        roughOutline: minScreenDimension >= 9,
        roughMode: 'jittered-contour', seed: selected.seed });
      if (detailLevel) {
        commands.push({ layer: 'building-roof', kind: 'roof-detail', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, baseFill: displayFill, shade, stroke: dark, highlight,
          lineWidth: Math.min(1.35, outlineWidth), seed: selected.seed,
          detailPrimitive: selected.pattern.primitive, detailLevel, hardEdge: true,
          lineDirection: selected.pattern.lineDirection, lightDirection: 'upper-left', shadowHalf: 'lower-right',
          buildingUsage: usage, referenceDetailEligible, largeRoof, roofPlaneCount,
          textureDensity: largeRoof ? 'sparse' : detailLevel,
          planeLayout: largeRoof ? 'asymmetric-jagged' : 'half-shadow' });
      }
      if (detailLevel === 'full') {
        commands.push({ layer: 'building-roof', kind: 'roof-outline-rough', sourceId: feature.id, sourceKey: key,
          patternId: selected.pattern.id, paths, stroke: dark, highlight, seed: selected.seed,
          hardEdge: true, handDrawn: true, minScreenDimension, largeRoof,
          outlineAlpha: largeRoof ? .52 : .72 });
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

  function pointBlockedBySettlements(point, settlements, clearance, input) {
    const clusterClearance = (32 + clearance) / input.viewport.scale;
    return settlements.some(cluster => Math.hypot(point[0] - cluster.worldX, point[1] - cluster.worldY) <= clusterClearance);
  }

  function pushVegetation(commands, assignments, features, input, settlements = []) {
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
          if (pointBlocked(point, blockers, clearance / input.viewport.scale) ||
              pointBlockedBySettlements(point, settlements, clearance, input)) continue;
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

  const cottageOffsets = Object.freeze([
    Object.freeze([0, 0]), Object.freeze([-16, 10]), Object.freeze([16, 12]), Object.freeze([-4, -12]),
  ]);

  function pushCottageCluster(commands, assignments, cluster, landmark = false) {
    const houseCount = Math.max(landmark ? 3 : 1, Math.min(4, cluster.houseCount || 1));
    for (let index = 0; index < houseCount; index += 1) {
      const offset = cottageOffsets[index];
      const seed = PATTERNS.hashString(`${cluster.key}|cottage|${index}`);
      const primary = landmark && index === 0;
      const width = primary ? 28 : 16 + (seed % 2) * 4;
      const height = primary ? 24 : 12 + ((seed >> 2) % 2) * 4;
      commands.push({
        layer: 'structure',
        kind: primary ? 'landmark-house' : 'settlement-house',
        sourceKey: cluster.sourceKeys?.[Math.min(index, cluster.sourceKeys.length - 1)] || cluster.key,
        sourceId: cluster.sourceIds?.[Math.min(index, cluster.sourceIds.length - 1)] || null,
        clusterKey: cluster.key,
        sourceX: cluster.sourceX ?? cluster.x,
        sourceY: cluster.sourceY ?? cluster.y,
        x: cluster.x + offset[0],
        y: cluster.y + offset[1],
        width,
        height,
        seed,
        sortY: cluster.y + offset[1],
        patternId: primary ? 'landmark-village' : 'settlement-cottage',
        primary,
      });
    }
    assignments.set(`settlement|${cluster.key}`, landmark ? 'landmark-village' : 'settlement-cottage');
  }

  function pushSemanticComposition(commands, assignments, composition) {
    if (composition.storyRoute) {
      commands.push({
        layer: 'story-route', kind: 'story-route', patternId: 'story-stepping-stones',
        sourceId: composition.storyRoute.sourceId, sourceKey: composition.storyRoute.sourceKey,
        paths: composition.storyRoute.paths, stroke: P.route, shadow: P.routeShadow,
      });
      assignments.set(`story-route|${composition.storyRoute.sourceKey}`, 'story-stepping-stones');
    }
    for (const cluster of composition.settlements) pushCottageCluster(commands, assignments, cluster, false);
    for (const landmark of composition.landmarks) pushCottageCluster(commands, assignments, landmark, true);
    if (composition.traveler) {
      commands.push({
        layer: 'traveler', kind: 'traveler', patternId: 'traveler-scout',
        sourceKey: composition.traveler.sourceKey,
        x: composition.traveler.x, y: composition.traveler.y,
        source: composition.traveler.source,
      });
      assignments.set(`traveler|${composition.traveler.sourceKey}`, 'traveler-scout');
    }
  }

  function buildScene(input) {
    const commands = [
      { layer: 'ground', kind: 'background', fill: P.ground, width: input.width, height: input.height },
      { layer: 'ground', kind: 'ground-wash', width: input.width, height: input.height,
        light: P.groundLight, dark: P.groundDark, seed: PATTERNS.hashString('ground-wash'),
        textureOrigin: projectPoint([0, 0], input), worldAnchored: true },
      { layer: 'ground', kind: 'ground-texture', width: input.width, height: input.height,
        light: P.groundLight, dark: P.groundDark, seed: PATTERNS.hashString('ground-texture'),
        textureOrigin: projectPoint([0, 0], input), worldAnchored: true, sparse: true },
    ];
    const assignments = new Map();
    const sourceFeatures = [...input.features].sort((a, b) => featureKey(a).localeCompare(featureKey(b)));
    const composition = input.semanticMode ? COMPOSER.compose(input) : null;
    const features = composition ? [...composition.renderFeatures] : sourceFeatures;
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
      else pushRoad(commands, assignments, feature, input, {
        subdued: Boolean(composition && featureKey(feature) !== composition.storyRoute?.sourceKey),
      });
    }
    const semanticSettlements = composition ? [...composition.settlements, ...composition.landmarks] : [];
    pushVegetation(commands, assignments, features, input, semanticSettlements);
    if (composition) pushSemanticComposition(commands, assignments, composition);
    else for (const feature of features) if (feature.layer === 'building' && feature.type === 3) pushRoof(commands, assignments, feature, input);
    if (input.location && !composition) {
      const [x, y] = projectPoint(input.location, input);
      commands.push({ layer: 'location', kind: 'location-marker', x, y, radius: 7 });
    }
    commands.sort((a, b) => (layerRank.get(a.layer) - layerRank.get(b.layer)) ||
      ((commandRank.get(a.kind) ?? 50) - (commandRank.get(b.kind) ?? 50)) ||
      ((a.sortY ?? 0) - (b.sortY ?? 0)) ||
      String(a.sourceKey || '').localeCompare(String(b.sourceKey || '')) || String(a.kind).localeCompare(String(b.kind)));
    const familySets = { ground: new Set(), water: new Set(), road: new Set(), rail: new Set(), roof: new Set(), tree: new Set() };
    for (const command of commands) {
      const family = command.kind === 'tree' ? 'tree' :
        ['building-roof', 'structure'].includes(command.layer) ? 'roof' :
        command.patternId?.startsWith('rail-') ? 'rail' :
          command.layer === 'transport' || command.layer === 'bridge' ? 'road' :
          command.layer === 'water' ? 'water' : command.layer === 'landcover' ? 'ground' : null;
      if (family && command.patternId) familySets[family].add(command.patternId);
    }
    const sortedAssignments = [...assignments].sort(([a], [b]) => a.localeCompare(b));
    const semanticHouses = commands.filter(command =>
      command.kind === 'settlement-house' || command.kind === 'landmark-house');
    return Object.freeze({
      version, commands: Object.freeze(commands),
      patternFingerprint: PATTERNS.hashString(`${composition?.fingerprint || 'raw'}|${sortedAssignments.map(entry => entry.join('=')).join('|')}`).toString(16),
      assignments: Object.freeze(Object.fromEntries(sortedAssignments)),
      stats: Object.freeze({
        patternFamilies: Object.freeze(Object.fromEntries(Object.entries(familySets).map(([key, set]) => [key, set.size]))),
        labelCount: 0, poiMarkerCount: 0,
        buildingExtrusionEnabled: semanticHouses.length > 0,
        wallCommands: semanticHouses.length,
        windowCommands: semanticHouses.filter(command => command.width >= 16).length * 2,
        treeCount: commands.filter(command => command.kind === 'tree').length,
        roofCount: composition?.stats.renderedHouseCount ?? commands.filter(command => command.kind === 'roof-fill').length,
        ...(composition?.stats || {}),
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

  function paintBrokenPolygonOutline(ctx, command) {
    ctx.save();
    ctx.strokeStyle = command.stroke;
    ctx.lineWidth = command.lineWidth || .7;
    ctx.lineCap = 'round';
    for (let pathIndex = 0; pathIndex < command.paths.length; pathIndex += 1) {
      const path = command.paths[pathIndex];
      for (let index = 0; index + 1 < path.length; index += 1) {
        const seed = PATTERNS.hashString(`${command.seed}:small-roof-edge:${pathIndex}:${index}`);
        if (seed % 4 === 0) continue;
        const from = path[index];
        const to = path[index + 1];
        const start = .06 + stableUnit(seed, 1) * .24;
        const end = Math.min(.94, start + .32 + stableUnit(seed, 2) * .38);
        ctx.beginPath();
        ctx.moveTo(from[0] + (to[0] - from[0]) * start, from[1] + (to[1] - from[1]) * start);
        ctx.lineTo(from[0] + (to[0] - from[0]) * end, from[1] + (to[1] - from[1]) * end);
        ctx.globalAlpha = (command.strokeAlpha ?? .4) * (.72 + stableUnit(seed, 3) * .28);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function fillPolygon(ctx, command) {
    tracePaths(ctx, command.paths);
    if (command.fill) {
      ctx.save();
      ctx.fillStyle = command.fill;
      ctx.globalAlpha = command.fillAlpha ?? 1;
      ctx.fill('evenodd');
      ctx.restore();
    }
    if (command.stroke && !command.brokenOutline) {
      ctx.save();
      ctx.strokeStyle = command.stroke; ctx.lineWidth = command.lineWidth || 1;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = command.strokeAlpha ?? 1;
      ctx.stroke();
      ctx.restore();
    }
    if (command.stroke && command.brokenOutline) paintBrokenPolygonOutline(ctx, command);
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
      ctx.globalAlpha = (pass ? .17 : .24) * (command.roughAlpha ?? 1);
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
    ctx.globalAlpha = command.alpha ?? 1;
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
    const step = command.kind === 'ground-wash' ? 86 : 64;
    const firstX = originX + Math.floor((minX - originX) / step) * step;
    const firstY = originY + Math.floor((minY - originY) / step) * step;
    for (let y = firstY; y <= maxY; y += step) {
      for (let x = firstX; x <= maxX; x += step) {
        const gridX = Math.round((x - originX) / step);
        const gridY = Math.round((y - originY) / step);
        const seed = PATTERNS.hashString(`${command.seed}:wash:${gridX}:${gridY}`);
        if (seed % 5 < 2) continue;
        const centerX = x + (stableUnit(seed, 2) - .5) * step * .9;
        const centerY = y + (stableUnit(seed, 3) - .5) * step * .9;
        const radius = 24 + stableUnit(seed, 4) * 30;
        const color = seed % 2 ? command.light : command.dark;
        paintWashBlob(ctx, centerX, centerY, radius, seed, color, .045 + stableUnit(seed, 5) * .055);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function paintGroundTexture(ctx, command) {
    ctx.save();
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    const step = 27;
    const firstX = originX + Math.floor(-originX / step) * step;
    const firstY = originY + Math.floor(-originY / step) * step;
    for (let y = firstY; y <= command.height + step; y += step) {
      for (let x = firstX; x <= command.width + step; x += step) {
        const gridX = Math.round((x - originX) / step);
        const gridY = Math.round((y - originY) / step);
        const seed = PATTERNS.hashString(`${command.seed}:ground-mark:${gridX}:${gridY}`);
        if (seed % 7 !== 0) continue;
        const px = x + stableUnit(seed, 1) * step;
        const py = y + stableUnit(seed, 2) * step;
        const length = 2 + stableUnit(seed, 3) * 4;
        const angle = -.65 + stableUnit(seed, 4) * 1.3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(angle) * length, py + Math.sin(angle) * length);
        if ((seed >>> 6) % 3 === 0) {
          ctx.moveTo(px + 1, py + 1);
          ctx.lineTo(px + Math.cos(angle + .75) * length * .65, py + Math.sin(angle + .75) * length * .65);
        }
        ctx.strokeStyle = seed & 1 ? command.light : command.dark;
        ctx.globalAlpha = .12 + stableUnit(seed, 5) * .12;
        ctx.lineWidth = .65 + stableUnit(seed, 6) * .45;
        ctx.lineCap = 'round';
        ctx.stroke();
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
    const step = command.patternId === 'ground-field-furrows' ? 20 : 18;
    const minX = originX + Math.floor((Math.min(...xs) - originX) / step) * step;
    const maxX = Math.max(...xs);
    const minY = originY + Math.floor((Math.min(...ys) - originY) / step) * step;
    const maxY = Math.max(...ys);
    for (let y = minY; y <= maxY; y += step) for (let x = minX; x <= maxX; x += step) {
      const gridX = Math.round((x - originX) / step);
      const gridY = Math.round((y - originY) / step);
      const seed = PATTERNS.hashString(`${command.seed}:${gridX}:${gridY}`);
      if (seed % 5 > 1) continue;
      const px = x + stableUnit(seed, 1) * step;
      const py = y + stableUnit(seed, 2) * step;
      ctx.strokeStyle = command.fill;
      ctx.globalAlpha = .16 + stableUnit(seed, 3) * .14;
      ctx.lineWidth = .65;
      ctx.lineCap = 'round';
      const length = command.patternId === 'ground-field-furrows' ? 5 + stableUnit(seed, 4) * 6 : 2 + stableUnit(seed, 4) * 3;
      const angle = command.patternId === 'ground-field-furrows' ? -.18 : (stableUnit(seed, 5) - .5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * length, py + Math.sin(angle) * length);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function traceReferenceStroke(ctx, stroke, offsetX, offsetY, scaleX = 1, scaleY = 1) {
    const points = stroke.points.map(point => [point[0] * scaleX + offsetX, point[1] * scaleY + offsetY]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    if (points.length === 4) {
      ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
      return;
    }
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index];
      const next = points[index + 1];
      ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
    }
    const last = points.at(-1);
    ctx.lineTo(last[0], last[1]);
  }

  function paintReferenceWaterMaterial(ctx, command, asset) {
    ctx.save();
    tracePaths(ctx, command.paths);
    ctx.clip('evenodd');
    const points = command.paths.flat();
    if (!points.length) { ctx.restore(); return; }
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    const [spacingX, spacingY] = command.motifSpacing || [96, 88];
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    const firstX = originX + Math.floor((Math.min(...xs) - originX) / spacingX) * spacingX;
    const firstY = originY + Math.floor((Math.min(...ys) - originY) / spacingY) * spacingY;
    for (let cellY = firstY; cellY <= Math.max(...ys); cellY += spacingY) {
      for (let cellX = firstX; cellX <= Math.max(...xs); cellX += spacingX) {
        const gridX = Math.round((cellX - originX) / spacingX);
        const gridY = Math.round((cellY - originY) / spacingY);
        const seed = PATTERNS.hashString(`${command.seed}:water-material:${gridX}:${gridY}`);
        if (seed % 5 !== 0) continue;
        const mode = (seed >>> 4) % 5;
        const anchorX = cellX + (stableUnit(seed, 1) * .9 + .05) * spacingX;
        const anchorY = cellY + (stableUnit(seed, 2) * .9 + .05) * spacingY;
        if (mode === 3) {
          const wash = asset.washes[(seed >>> 8) % asset.washes.length];
          ctx.beginPath();
          ctx.ellipse(anchorX, anchorY,
            wash.rx * (.55 + stableUnit(seed, 3) * .5),
            wash.ry * (.55 + stableUnit(seed, 4) * .5),
            (stableUnit(seed, 5) - .5) * .34, 0, Math.PI * 2);
          ctx.fillStyle = asset.palette[wash.role] || asset.palette.wash;
          ctx.globalAlpha = wash.alpha * (.35 + stableUnit(seed, 6) * .5);
          ctx.fill();
        }
        if (mode === 0 || mode === 4) {
          const stroke = asset.rippleStrokes[(seed >>> 7) % asset.rippleStrokes.length];
          const flipX = (seed >>> 11) & 1 ? -1 : 1;
          const scaleX = .65 + stableUnit(seed, 7) * .8;
          const scaleY = .65 + stableUnit(seed, 8) * .75;
          const centerX = stroke.points.reduce((sum, point) => sum + point[0], 0) / stroke.points.length;
          const centerY = stroke.points.reduce((sum, point) => sum + point[1], 0) / stroke.points.length;
          ctx.save();
          ctx.translate(anchorX, anchorY);
          ctx.rotate((stableUnit(seed, 9) - .5) * .48);
          traceReferenceStroke(ctx, stroke, -centerX * flipX * scaleX, -centerY * scaleY,
            flipX * scaleX, scaleY);
          ctx.strokeStyle = asset.palette[stroke.role] || asset.palette.ripple;
          ctx.lineWidth = stroke.width * (.78 + stableUnit(seed, 10) * .45);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash(stroke.parts ? [9 + stableUnit(seed, 11) * 5, 3, 2, 5] : []);
          ctx.globalAlpha = stroke.alpha * (.32 + stableUnit(seed, 12) * .58);
          ctx.stroke();
          ctx.restore();
        }
        ctx.setLineDash([]);
        if (mode === 1 || mode === 4) {
          const mark = asset.currentMarks[(seed >>> 8) % asset.currentMarks.length];
          const x = anchorX + (stableUnit(seed, 31) - .5) * 18;
          const y = anchorY + (stableUnit(seed, 32) - .5) * 14;
          ctx.strokeStyle = asset.palette.current;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + mark.dx, y + mark.dy);
          ctx.lineWidth = mark.width || .8;
          ctx.globalAlpha = (mark.alpha ?? .25) * (.42 + stableUnit(seed, 33) * .45);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function offsetPolyline(path, distance) {
    return path.map((point, index) => {
      const previous = path[Math.max(0, index - 1)];
      const next = path[Math.min(path.length - 1, index + 1)];
      const dx = next[0] - previous[0];
      const dy = next[1] - previous[1];
      const length = Math.hypot(dx, dy) || 1;
      return [point[0] - dy / length * distance, point[1] + dx / length * distance];
    });
  }

  function pointAlongPolyline(path, targetDistance) {
    let walked = 0;
    for (let index = 0; index + 1 < path.length; index += 1) {
      const from = path[index];
      const to = path[index + 1];
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const length = Math.hypot(dx, dy);
      if (!length) continue;
      if (walked + length >= targetDistance) {
        const t = (targetDistance - walked) / length;
        return { x: from[0] + dx * t, y: from[1] + dy * t,
          tx: dx / length, ty: dy / length, nx: -dy / length, ny: dx / length };
      }
      walked += length;
    }
    return null;
  }

  function polylineLength(path) {
    let length = 0;
    for (let index = 0; index + 1 < path.length; index += 1) {
      length += Math.hypot(path[index + 1][0] - path[index][0], path[index + 1][1] - path[index][1]);
    }
    return length;
  }

  function paintSoftRoadEdge(ctx, command) {
    strokePaths(ctx, command);
    const roadWidth = command.roadWidth || 6.5;
    for (const [pathIndex, path] of command.paths.entries()) {
      if (path.length < 2) continue;
      const length = polylineLength(path);
      let distance = 8 + stableUnit(command.seed, pathIndex + 90) * 18;
      let candidate = 0;
      while (distance < length) {
        const point = pointAlongPolyline(path, distance);
        if (!point) break;
        const markSeed = PATTERNS.hashString(`${command.seed}:road-verge:${pathIndex}:${candidate}`);
        if (markSeed % 5 < 2) {
          const side = (markSeed >>> 5) & 1 ? 1 : -1;
          const offset = side * roadWidth * (.5 + stableUnit(markSeed, 1) * .08);
          const segmentLength = 5 + stableUnit(markSeed, 2) * 9;
          const x = point.x + point.nx * offset;
          const y = point.y + point.ny * offset;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x - point.tx * segmentLength * .5, y - point.ty * segmentLength * .5);
          ctx.quadraticCurveTo(x + point.nx * (stableUnit(markSeed, 3) - .5) * 2.5,
            y + point.ny * (stableUnit(markSeed, 3) - .5) * 2.5,
            x + point.tx * segmentLength * .5, y + point.ty * segmentLength * .5);
          ctx.strokeStyle = command.stroke;
          ctx.globalAlpha = .2 + stableUnit(markSeed, 4) * .18;
          ctx.lineWidth = .65 + stableUnit(markSeed, 5) * .55;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
        distance += 19 + stableUnit(markSeed, 6) * 18;
        candidate += 1;
      }
    }
  }

  function paintRailLines(ctx, command) {
    ctx.save();
    ctx.strokeStyle = command.stroke;
    ctx.lineWidth = command.lineWidth || 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = command.alpha ?? 1;
    for (const path of command.paths) {
      if (path.length < 2) continue;
      for (const offset of [-command.railOffset, command.railOffset]) {
        tracePaths(ctx, [offsetPolyline(path, offset)]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function paintRoadGravelCluster(ctx, point, side, roadWidth, seed, color) {
    const edgeOffset = side * roadWidth * (.38 + stableUnit(seed, 1) * .1);
    const centerX = point.x + point.nx * edgeOffset;
    const centerY = point.y + point.ny * edgeOffset;
    const count = 4 + seed % 4;
    ctx.fillStyle = color;
    for (let index = 0; index < count; index += 1) {
      const markSeed = PATTERNS.hashString(`${seed}:gravel:${index}`);
      const along = (stableUnit(markSeed, 1) - .5) * (5 + roadWidth * .35);
      const across = (stableUnit(markSeed, 2) - .5) * 2.8;
      const x = centerX + point.tx * along + point.nx * across;
      const y = centerY + point.ty * along + point.ny * across;
      const radiusX = .45 + stableUnit(markSeed, 3) * .85;
      const radiusY = .35 + stableUnit(markSeed, 4) * .5;
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX, radiusY, (stableUnit(markSeed, 5) - .5) * .7, 0, Math.PI * 2);
      ctx.globalAlpha = .31 + stableUnit(markSeed, 6) * .23;
      ctx.fill();
    }
  }

  function paintRoadSurfaceTexture(ctx, command, asset = null) {
    ctx.save();
    const roadWidth = command.roadWidth || 6.5;
    const palette = asset?.palette || { light: P.roadLight, wear: P.roadDark, wearDark: P.inkSoft };
    const originX = command.textureOrigin?.[0] || 0;
    const originY = command.textureOrigin?.[1] || 0;
    for (const [pathIndex, path] of command.paths.entries()) {
      if (path.length < 2) continue;
      const length = polylineLength(path);
      let candidate = 0;
      let distance = 4 + stableUnit(command.seed, pathIndex + 1) * 15;
      while (distance < length) {
        const point = pointAlongPolyline(path, distance);
        if (!point) break;
        const worldX = Math.round(point.x - originX);
        const worldY = Math.round(point.y - originY);
        const markSeed = PATTERNS.hashString(`${command.seed}:road-wear:${worldX}:${worldY}:${candidate}`);
        if (markSeed % 9 >= 4) {
          const side = (markSeed >>> 4) & 1 ? 1 : -1;
          const awayFromCenter = .15 + stableUnit(markSeed, 1) * .22;
          const offset = side * roadWidth * awayFromCenter;
          const segmentLength = 4.5 + stableUnit(markSeed, 2) * Math.min(11, roadWidth * 1.15);
          const x = point.x + point.nx * offset;
          const y = point.y + point.ny * offset;
          const bend = (stableUnit(markSeed, 3) - .5) * 2.2;
          ctx.beginPath();
          ctx.moveTo(x - point.tx * segmentLength * .5, y - point.ty * segmentLength * .5);
          ctx.quadraticCurveTo(x + point.nx * bend, y + point.ny * bend,
            x + point.tx * segmentLength * .5, y + point.ty * segmentLength * .5);
          ctx.strokeStyle = (markSeed >>> 8) & 1 ? palette.wear : palette.light;
          ctx.lineWidth = .7 + stableUnit(markSeed, 4) * .7;
          ctx.lineCap = 'round';
          ctx.globalAlpha = .28 + stableUnit(markSeed, 5) * .27;
          ctx.stroke();

          if ((markSeed >>> 10) % 4 === 0) {
            const across = Math.min(roadWidth * .28, 3 + stableUnit(markSeed, 6) * 3);
            ctx.beginPath();
            ctx.moveTo(x - point.nx * across, y - point.ny * across);
            ctx.lineTo(x + point.nx * across * .7, y + point.ny * across * .7);
            ctx.strokeStyle = palette.wearDark;
            ctx.lineWidth = .55;
            ctx.globalAlpha = .16 + stableUnit(markSeed, 7) * .14;
            ctx.stroke();
          }
        }
        if ((markSeed >>> 12) % 5 === 0) {
          ctx.beginPath();
          const washOffset = (stableUnit(markSeed, 12) - .5) * roadWidth * .28;
          const washLength = 8 + stableUnit(markSeed, 13) * 15;
          const washX = point.x + point.nx * washOffset;
          const washY = point.y + point.ny * washOffset;
          ctx.moveTo(washX - point.tx * washLength * .5, washY - point.ty * washLength * .5);
          ctx.lineTo(washX + point.tx * washLength * .5, washY + point.ty * washLength * .5);
          ctx.strokeStyle = palette.wear;
          ctx.lineWidth = Math.max(1.4, roadWidth * (.28 + stableUnit(markSeed, 14) * .18));
          ctx.globalAlpha = .09 + stableUnit(markSeed, 15) * .06;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        if ((markSeed >>> 13) % 2 === 0) {
          const edgeSide = (markSeed >>> 17) & 1 ? 1 : -1;
          paintRoadGravelCluster(ctx, point, edgeSide, roadWidth, markSeed, palette.wearDark);
        }
        distance += 18 + stableUnit(markSeed, 11) * 14;
        candidate += 1;
      }
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.restore();
  }

  function paintReferenceRoadTexture(ctx, command, asset) {
    paintRoadSurfaceTexture(ctx, command, asset);
  }

  function paintWaterRipples(ctx, command) {
    const reference = command.referenceAsset ? MATERIALS.catalog[command.referenceAsset] : null;
    if (reference?.family === 'water') {
      paintReferenceWaterMaterial(ctx, command, reference);
      return;
    }
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

  function paintLargeRoofPlanes(ctx, command, frame) {
    const minU = -frame.halfU - 2;
    const maxU = frame.halfU + 2;
    const minV = -frame.halfV - 2;
    const maxV = frame.halfV + 2;
    const ridgeLeft = (stableUnit(command.seed, 201) - .5) * frame.halfV * .22;
    const ridgeRight = (stableUnit(command.seed, 202) - .5) * frame.halfV * .22;
    const ridgeMiddle = (stableUnit(command.seed, 205) - .5) * frame.halfV * .34;
    const brightSide = (command.seed >>> 3) & 1 ? 1 : -1;
    const upper = [roofPoint(frame, minU, minV), roofPoint(frame, maxU, minV),
      roofPoint(frame, maxU, ridgeRight), roofPoint(frame, 0, ridgeMiddle), roofPoint(frame, minU, ridgeLeft)];
    const lower = [roofPoint(frame, minU, ridgeLeft), roofPoint(frame, 0, ridgeMiddle), roofPoint(frame, maxU, ridgeRight),
      roofPoint(frame, maxU, maxV), roofPoint(frame, minU, maxV)];
    for (const [index, points] of [upper, lower].entries()) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        ctx.lineTo(points[pointIndex][0], points[pointIndex][1]);
      }
      ctx.closePath();
      ctx.fillStyle = index === (roofShadowSide(frame) > 0 ? 1 : 0) ? command.shade : command.highlight;
      ctx.globalAlpha = index === (roofShadowSide(frame) > 0 ? 1 : 0) ? .4 : .1;
      ctx.fill();
    }

    const capStart = brightSide < 0
      ? minU + (maxU - minU) * (.16 + stableUnit(command.seed, 203) * .11)
      : maxU - (maxU - minU) * (.18 + stableUnit(command.seed, 203) * .13);
    const capInner = brightSide < 0 ? capStart : capStart;
    const capOuter = brightSide < 0 ? minU : maxU;
    const skew = (stableUnit(command.seed, 204) - .5) * frame.halfV * .25;
    const cap = [roofPoint(frame, capOuter, minV), roofPoint(frame, capInner, minV + skew),
      roofPoint(frame, capInner, maxV - skew), roofPoint(frame, capOuter, maxV)];
    ctx.beginPath();
    ctx.moveTo(cap[0][0], cap[0][1]);
    for (let index = 1; index < cap.length; index += 1) ctx.lineTo(cap[index][0], cap[index][1]);
    ctx.closePath();
    ctx.fillStyle = brightSide < 0 ? command.highlight : command.shade;
    ctx.globalAlpha = .16;
    ctx.fill();

    for (let index = 0; index < 2; index += 1) {
      const washSeed = PATTERNS.hashString(`${command.seed}:large-roof-wash:${index}`);
      const washPoint = roofPoint(frame,
        (stableUnit(washSeed, 1) - .5) * frame.halfU * 1.35,
        (stableUnit(washSeed, 2) - .5) * frame.halfV * 1.15);
      const washRadius = Math.max(10, Math.min(frame.halfU, frame.halfV) * (.42 + stableUnit(washSeed, 3) * .38));
      paintWashBlob(ctx, washPoint[0], washPoint[1], washRadius, washSeed,
        index ? command.shade : command.highlight, .055 + stableUnit(washSeed, 4) * .04);
    }
    ctx.globalAlpha = 1;
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

  function roofStrokePlan(frame, { patternId, seed = 0, detailLevel = 'full', largeRoof = false } = {}) {
    const tracks = largeRoof ? [
      { across: -.52 + stableUnit(seed, 210) * .32, start: -.88 + stableUnit(seed, 211) * .18,
        end: .52 + stableUnit(seed, 212) * .35, thickness: 1, pieces: 2 },
      { across: .18 + stableUnit(seed, 213) * .42, start: -.64 + stableUnit(seed, 214) * .22,
        end: .7 + stableUnit(seed, 215) * .2, thickness: 1, pieces: 2 },
    ] : roofTrackDefinitions(patternId, detailLevel);
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
    const step = command.largeRoof ? 15 : command.patternId === 'building-flat-workshop' ? 5 : 7;
    ctx.fillStyle = command.highlight;
    ctx.globalAlpha = command.largeRoof ? .2 : .42;
    for (let v = -frame.halfV + 2; v < frame.halfV - 1; v += step) {
      for (let u = -frame.halfU + 2; u < frame.halfU - 1; u += step) {
        const gridU = Math.round(u / step), gridV = Math.round(v / step);
        const seed = PATTERNS.hashString(`${command.seed}:roof:${gridU}:${gridV}`);
        if (seed % (command.largeRoof ? 7 : 4) !== 0) continue;
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
    if (command.largeRoof) {
      paintLargeRoofPlanes(ctx, command, frame);
    }
    if (!command.largeRoof && command.patternId === 'building-cottage-gable') {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-gable-01', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (!command.largeRoof && command.patternId === 'building-longhouse' &&
        shouldUseReferenceRoof(frame, 'building-blue-longhouse-03')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-longhouse-03', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (!command.largeRoof && command.patternId === 'building-hipped' &&
        shouldUseReferenceRoof(frame, 'building-blue-hipped-02')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-hipped-02', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (!command.largeRoof && command.patternId === 'building-flat-workshop' && command.referenceDetailEligible &&
        shouldUseReferenceRoof(frame, 'building-harbor-workshop-04')) {
      MATERIALS.paintRoofInFrame(ctx, 'building-harbor-workshop-04', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (!command.largeRoof && command.patternId === 'building-weathered-gable' && shouldUseWeatheredGable(frame)) {
      MATERIALS.paintRoofInFrame(ctx, 'building-blue-weathered-05', frame, { seed: command.seed });
      ctx.restore();
      return;
    }
    if (!command.largeRoof) paintRoofFacet(ctx, frame, roofShadowSide(frame), command.shade);
    const strokes = roofStrokePlan(frame, command);
    ctx.globalAlpha = command.largeRoof ? .52 : .82;
    for (const stroke of strokes) {
      const color = stroke.trackIndex % 3 === 2 ? command.highlight : command.stroke;
      paintPixelLine(ctx, stroke.from, stroke.to, color, stroke.thickness, stroke.salt);
    }
    ctx.globalAlpha = 1;

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
          ctx.globalAlpha = (variation % 5 === 0 ? .45 : .82) * (command.outlineAlpha ?? 1);
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

  function routeSamples(paths, spacing = 18) {
    const samples = [];
    for (const path of paths || []) {
      let carry = 0;
      for (let index = 0; index + 1 < path.length; index += 1) {
        const from = path[index];
        const to = path[index + 1];
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const length = Math.hypot(dx, dy);
        if (!length) continue;
        for (let distance = carry ? spacing - carry : 0; distance <= length; distance += spacing) {
          const ratio = distance / length;
          samples.push([from[0] + dx * ratio, from[1] + dy * ratio]);
        }
        carry = (carry + length) % spacing;
      }
    }
    return samples;
  }

  function paintStoryRoute(ctx, command) {
    const samples = routeSamples(command.paths, 18);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = command.shadow;
    ctx.globalAlpha = .58;
    ctx.lineWidth = 8;
    tracePaths(ctx, command.paths);
    ctx.stroke();
    ctx.strokeStyle = command.stroke;
    ctx.globalAlpha = .38;
    ctx.lineWidth = 4;
    tracePaths(ctx, command.paths);
    ctx.stroke();
    for (let index = 0; index < samples.length; index += 1) {
      const [x, y] = samples[index];
      const seed = PATTERNS.hashString(`${command.sourceKey}:step:${index}`);
      const width = seed % 3 === 0 ? 12 : 8;
      const height = seed % 4 === 0 ? 8 : 4;
      const px = Math.round(x / 2) * 2;
      const py = Math.round(y / 2) * 2;
      ctx.globalAlpha = .72;
      ctx.fillStyle = command.shadow;
      ctx.fillRect(px - width / 2 + 2, py - height / 2 + 2, width, height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = command.stroke;
      ctx.fillRect(px - width / 2, py - height / 2, width, height);
      if (seed % 5 === 0) {
        ctx.fillStyle = P.groundLight;
        ctx.fillRect(px - width / 2 + 2, py - height / 2, 2, 2);
      }
    }
    ctx.restore();
  }

  function paintCottage(ctx, command) {
    const x = Math.round(command.x / 2) * 2;
    const y = Math.round(command.y / 2) * 2;
    const width = Math.max(12, Math.round(command.width / 2) * 2);
    const height = Math.max(12, Math.round(command.height / 2) * 2);
    const primary = command.kind === 'landmark-house';
    const wallTop = y - Math.round(height * .16);
    const wallHeight = Math.max(6, Math.round(height * .38 / 2) * 2);
    const roofTop = y - height;
    const roofBottom = wallTop + 2;
    const roofOverhang = primary ? 4 : 2;
    const ridgeX = x + (command.seed % 3 - 1) * 2;
    ctx.save();
    ctx.fillStyle = P.shadow;
    ctx.globalAlpha = .48;
    ctx.fillRect(x - width / 2 + 4, y - wallHeight + 4, width + 2, wallHeight + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.cottageWall;
    ctx.fillRect(x - width / 2, wallTop, width, wallHeight);
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width / 2, wallTop, width, wallHeight);

    ctx.beginPath();
    ctx.moveTo(x - width / 2 - roofOverhang, roofBottom);
    ctx.lineTo(ridgeX, roofTop);
    ctx.lineTo(x + width / 2 + roofOverhang, roofBottom);
    ctx.closePath();
    ctx.fillStyle = primary ? P.landmarkRoof : P.cottageRoof;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ridgeX, roofTop);
    ctx.lineTo(x + width / 2 + roofOverhang, roofBottom);
    ctx.lineTo(x + 2, roofBottom);
    ctx.closePath();
    ctx.fillStyle = primary ? P.landmarkRoofDark : P.cottageRoofDark;
    ctx.globalAlpha = .72;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = P.ink;
    ctx.fillRect(x - 2, y - 6, 4, 6);
    if (width >= 16) {
      ctx.fillStyle = P.windowLight;
      ctx.fillRect(x - width / 2 + 4, wallTop + 4, 4, 4);
      ctx.fillRect(x + width / 2 - 8, wallTop + 4, 4, 4);
    }
    if (primary) {
      ctx.fillStyle = P.ink;
      ctx.fillRect(x + width / 2 - 2, roofTop - 12, 2, 14);
      ctx.fillStyle = P.landmarkFlag;
      ctx.fillRect(x + width / 2, roofTop - 12, 10, 6);
      ctx.fillStyle = P.landmarkFlagLight;
      ctx.fillRect(x + width / 2, roofTop - 12, 4, 2);
    }
    ctx.restore();
  }

  function paintTraveler(ctx, command) {
    const x = Math.round(command.x / 2) * 2;
    const y = Math.round(command.y / 2) * 2;
    ctx.save();
    ctx.fillStyle = P.shadow;
    ctx.globalAlpha = .52;
    ctx.fillRect(x - 8, y + 2, 18, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.ink;
    ctx.fillRect(x - 6, y - 22, 12, 18);
    ctx.fillRect(x - 6, y - 4, 4, 8);
    ctx.fillRect(x + 2, y - 4, 4, 8);
    ctx.fillStyle = P.travelerCoat;
    ctx.fillRect(x - 4, y - 16, 8, 12);
    ctx.fillRect(x - 6, y - 14, 2, 8);
    ctx.fillRect(x + 4, y - 14, 2, 8);
    ctx.fillStyle = P.travelerFace;
    ctx.fillRect(x - 4, y - 24, 8, 8);
    ctx.fillStyle = P.travelerHair;
    ctx.fillRect(x - 6, y - 26, 12, 6);
    ctx.fillRect(x - 6, y - 22, 2, 4);
    ctx.fillStyle = P.windowLight;
    ctx.fillRect(x + 2, y - 14, 2, 4);
    ctx.restore();
  }

  function paintCommand(ctx, command) {
    if (command.kind === 'background') { ctx.fillStyle = command.fill; ctx.fillRect(0, 0, command.width, command.height); return; }
    if (command.kind === 'ground-wash' || command.kind === 'area-wash') { paintSurfaceWash(ctx, command); return; }
    if (command.kind === 'ground-texture') { paintGroundTexture(ctx, command); return; }
    if (command.kind === 'area-fill' || command.kind === 'water-fill' || command.kind === 'roof-fill') { fillPolygon(ctx, command); return; }
    if (command.kind === 'roof-shadow') {
      ctx.save(); ctx.translate(...command.translate); fillPolygon(ctx, command); ctx.restore(); return;
    }
    if (command.kind === 'area-texture') { paintAreaTexture(ctx, command); return; }
    if (command.kind === 'water-ripples') { paintWaterRipples(ctx, command); return; }
    if (command.kind === 'water-shore') {
      ctx.save(); tracePaths(ctx, command.paths); ctx.clip('evenodd'); strokePaths(ctx, command); ctx.restore(); return;
    }
    if (command.kind === 'rail-lines') { paintRailLines(ctx, command); return; }
    if (command.kind === 'road-edge' && command.edgeTexture === 'soft-broken-verge') {
      paintSoftRoadEdge(ctx, command); return;
    }
    if (command.kind === 'road-texture') {
      if (command.subdued) return;
      const reference = command.referenceAsset ? MATERIALS.catalog[command.referenceAsset] : null;
      if (reference?.family === 'road') paintReferenceRoadTexture(ctx, command, reference);
      else paintRoadSurfaceTexture(ctx, command);
      return;
    }
    if (['road-edge', 'road-fill', 'rail-bed', 'waterway-edge', 'waterway-fill'].includes(command.kind)) {
      strokePaths(ctx, command); return;
    }
    if (command.kind === 'roof-detail') { paintRoofDetail(ctx, command); return; }
    if (command.kind === 'roof-outline-rough') { paintRoofOutlineRough(ctx, command); return; }
    if (command.kind === 'tree') { paintTree(ctx, command); return; }
    if (command.kind === 'story-route') { paintStoryRoute(ctx, command); return; }
    if (command.kind === 'settlement-house' || command.kind === 'landmark-house') {
      paintCottage(ctx, command); return;
    }
    if (command.kind === 'traveler') { paintTraveler(ctx, command); return; }
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
    version, compositor, buildScene, paintScene, paintCommand, patternAssignments, pointInFeature, distanceToFeature,
    roofFrame, roofShadowSide, roofStrokePlan, shouldUseReferenceRoof, shouldUseHarborWorkshop,
    shouldUseWeatheredGable,
  });
})(typeof window !== 'undefined' ? window : globalThis);
