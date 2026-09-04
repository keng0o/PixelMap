((global) => {
  'use strict';

  const PATTERNS = global.PixelMapTopDownPatterns;
  if (!PATTERNS) throw new Error('PixelMapTopDownPatterns is required');

  const version = 'pixelmap-top-down-composer/1';
  const artPixelSize = 2;
  const maxMinorRoadRatio = .35;
  const maxRenderedHouses = 170;
  const clusterRange = Object.freeze([8, 24]);
  const landmarkRange = Object.freeze([1, 3]);
  const majorRoadClasses = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'rail']);

  function freeze(value) {
    if (Array.isArray(value)) return Object.freeze(value.map(freeze));
    if (value && typeof value === 'object') {
      return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, freeze(item)])));
    }
    return value;
  }

  function semanticClass(feature) {
    return String(feature?.props?.subclass || feature?.props?.class || feature?.props?.landuse || 'unknown')
      .trim().toLowerCase();
  }

  function featureKey(feature) {
    const metrics = PATTERNS.geometryMetrics(feature?.geometry || []);
    return PATTERNS.featureKey({
      layer: feature?.layer,
      id: feature?.id,
      props: feature?.props || {},
      bounds: metrics.bounds,
    });
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

  function explodeBuilding(feature) {
    return polygonParts(feature.geometry).map((geometry, partIndex) => ({
      ...feature,
      geometry,
      sourceFeatureId: feature.id,
      sourcePartIndex: partIndex,
    }));
  }

  function projectPoint(point, input) {
    return [
      (point[0] - input.viewport.centerX) * input.viewport.scale + input.width / 2,
      (point[1] - input.viewport.centerY) * input.viewport.scale + input.height / 2,
    ];
  }

  function geometryVisible(geometry, input, padding = 18) {
    const bounds = PATTERNS.geometryMetrics(geometry).bounds;
    const topLeft = projectPoint([bounds.minX, bounds.minY], input);
    const bottomRight = projectPoint([bounds.maxX, bounds.maxY], input);
    return bottomRight[0] >= -padding && topLeft[0] <= input.width + padding &&
      bottomRight[1] >= -padding && topLeft[1] <= input.height + padding;
  }

  function snap(value) {
    return Math.round(value / artPixelSize) * artPixelSize;
  }

  function pathLength(path = []) {
    let total = 0;
    for (let index = 0; index + 1 < path.length; index += 1) {
      total += Math.hypot(path[index + 1][0] - path[index][0], path[index + 1][1] - path[index][1]);
    }
    return total;
  }

  function projectedFeaturePaths(feature, input) {
    return (feature.geometry || []).map(path => path.map(point => projectPoint(point, input)));
  }

  function normalizedPathKey(path) {
    const forward = path.map(point => point.join(',')).join(';');
    const reverse = [...path].reverse().map(point => point.join(',')).join(';');
    return forward < reverse ? forward : reverse;
  }

  function routePathScore(path, feature, input) {
    const points = visibleRoutePoints([path], input);
    if (points.length < 2) return -Infinity;
    const ys = points.map(point => point[1]);
    const xs = points.map(point => point[0]);
    const spanY = Math.max(...ys) - Math.min(...ys);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const length = Math.hypot(spanX, spanY);
    const centerDistance = Math.abs(xs.reduce((sum, value) => sum + value, 0) / xs.length - input.width / 2);
    const roadBonus = majorRoadClasses.has(semanticClass(feature)) ? 140 : 0;
    return spanY * 2.4 + Math.min(length, input.height * 2) * .35 + roadBonus - centerDistance * .45;
  }

  function bestRoutePart(feature, input) {
    return projectedFeaturePaths(feature, input).map(path => ({
      path,
      pathKey: normalizedPathKey(path),
      score: routePathScore(path, feature, input),
    })).filter(candidate => Number.isFinite(candidate.score))
      .sort((a, b) => b.score - a.score || a.pathKey.localeCompare(b.pathKey))[0] || null;
  }

  function visibleRoutePoints(paths, input) {
    const points = [];
    const marginX = 28;
    const marginY = 36;
    for (const path of paths) {
      for (let index = 0; index + 1 < path.length; index += 1) {
        const from = path[index];
        const to = path[index + 1];
        const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
        const steps = Math.max(1, Math.ceil(length / 12));
        for (let step = 0; step <= steps; step += 1) {
          const ratio = step / steps;
          const point = [
            from[0] + (to[0] - from[0]) * ratio,
            from[1] + (to[1] - from[1]) * ratio,
          ];
          if (point[0] >= marginX && point[0] <= input.width - marginX &&
              point[1] >= marginY && point[1] <= input.height - marginY) points.push(point);
        }
      }
    }
    return points;
  }

  function chooseStoryRoute(roads, input) {
    const candidates = roads.filter(feature => semanticClass(feature) !== 'rail')
      .map(feature => ({ feature, key: featureKey(feature), part: bestRoutePart(feature, input) }))
      .filter(candidate => candidate.part)
      .sort((a, b) => b.part.score - a.part.score || a.key.localeCompare(b.key) ||
        a.part.pathKey.localeCompare(b.part.pathKey));
    if (!candidates.length) return null;
    const selectedCandidate = candidates[0];
    const selected = selectedCandidate.feature;
    const paths = [selectedCandidate.part.path.map(([x, y]) => [snap(x), snap(y)])];
    const visible = visibleRoutePoints(paths, input);
    const longest = [...paths].sort((a, b) => pathLength(b) - pathLength(a))[0] || [];
    const endpoints = visible.length ? visible : [
      longest[0] || [input.width / 2, input.height * .78],
      longest[longest.length - 1] || [input.width / 2, input.height * .22],
    ];
    const start = [...endpoints].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const destination = [...endpoints].sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
    return freeze({
      sourceId: selected.id,
      sourceKey: featureKey(selected),
      pathKey: selectedCandidate.part.pathKey,
      className: semanticClass(selected),
      paths,
      start: [snap(start[0]), snap(start[1])],
      destination: [snap(destination[0]), snap(destination[1])],
    });
  }

  function retainRoads(roads, storyRoute) {
    const major = roads.filter(feature => majorRoadClasses.has(semanticClass(feature)))
      .sort((a, b) => featureKey(a).localeCompare(featureKey(b)));
    const minor = roads.filter(feature => !majorRoadClasses.has(semanticClass(feature)))
      .sort((a, b) => {
        const aKey = featureKey(a), bKey = featureKey(b);
        return PATTERNS.hashString(aKey) - PATTERNS.hashString(bKey) || aKey.localeCompare(bKey);
      });
    const quota = minor.length ? Math.max(1, Math.floor(minor.length * maxMinorRoadRatio)) : 0;
    const selected = minor.slice(0, quota);
    if (storyRoute && !major.some(feature => featureKey(feature) === storyRoute.sourceKey) &&
        !selected.some(feature => featureKey(feature) === storyRoute.sourceKey)) {
      const routeFeature = minor.find(feature => featureKey(feature) === storyRoute.sourceKey);
      if (routeFeature) {
        if (selected.length >= quota && selected.length) selected[selected.length - 1] = routeFeature;
        else selected.push(routeFeature);
      }
    }
    return freeze({ major, minor, selectedMinor: [...new Map(selected.map(item => [featureKey(item), item])).values()] });
  }

  function clusterBuildings(buildings, input) {
    if (!buildings.length) return [];
    const clusterStep = 120 / input.viewport.scale;
    const buckets = new Map();
    for (const feature of [...buildings].sort((a, b) => featureKey(a).localeCompare(featureKey(b)))) {
      const metrics = PATTERNS.geometryMetrics(feature.geometry);
      const worldX = (metrics.bounds.minX + metrics.bounds.maxX) / 2;
      const worldY = (metrics.bounds.minY + metrics.bounds.maxY) / 2;
      const bucketKey = `${Math.floor(worldX / clusterStep)}/${Math.floor(worldY / clusterStep)}`;
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
      buckets.get(bucketKey).push({ feature, key: featureKey(feature), worldX, worldY, area: metrics.area });
    }
    const clusters = [...buckets.entries()].map(([key, members]) => {
      const ordered = [...members].sort((a, b) => a.key.localeCompare(b.key));
      const weight = ordered.reduce((sum, member) => sum + Math.max(1, Math.sqrt(member.area || 1)), 0);
      const worldX = ordered.reduce((sum, member) => sum + member.worldX * Math.max(1, Math.sqrt(member.area || 1)), 0) / weight;
      const worldY = ordered.reduce((sum, member) => sum + member.worldY * Math.max(1, Math.sqrt(member.area || 1)), 0) / weight;
      const [x, y] = projectPoint([worldX, worldY], input);
      const seed = PATTERNS.hashString(`${key}|${ordered.map(member => member.key).join('|')}`);
      return {
        key,
        sourceKeys: ordered.map(member => member.key),
        sourceIds: ordered.map(member => member.feature.id),
        memberCount: ordered.length,
        houseCount: Math.min(4, ordered.length, 1 + seed % 4),
        x: snap(x),
        y: snap(y),
        worldX,
        worldY,
        seed,
      };
    }).filter(cluster => cluster.x >= -48 && cluster.x <= input.width + 48 &&
      cluster.y >= -48 && cluster.y <= input.height + 48);
    const selected = clusters.sort((a, b) => b.memberCount - a.memberCount || a.key.localeCompare(b.key))
      .slice(0, clusterRange[1]);
    return selected.sort((a, b) => a.key.localeCompare(b.key));
  }

  function chooseLandmarks(settlements, storyRoute, input) {
    if (!settlements.length) return [];
    const target = storyRoute?.destination || [input.width / 2, input.height * .2];
    const inset = settlements.filter(item => item.x >= 38 && item.x <= input.width - 52 &&
      item.y >= -24 && item.y <= input.height - 70);
    const visible = inset.length ? inset : settlements;
    const upper = visible.filter(item => item.y <= input.height * .58);
    const pool = upper.length ? upper : visible;
    const chosen = [...pool].sort((a, b) => {
      const aDistance = Math.hypot(a.x - target[0], a.y - target[1]) - a.memberCount * 4;
      const bDistance = Math.hypot(b.x - target[0], b.y - target[1]) - b.memberCount * 4;
      return aDistance - bDistance || a.key.localeCompare(b.key);
    })[0];
    return [freeze({
      ...chosen,
      role: 'primary',
      sourceX: chosen.x,
      sourceY: chosen.y,
      x: snap(Math.max(38, Math.min(input.width - 52, chosen.x))),
      y: snap(Math.max(36, Math.min(input.height - 70, chosen.y))),
    })];
  }

  function compose(input) {
    const orderedFeatures = [...(input.features || [])].sort((a, b) => featureKey(a).localeCompare(featureKey(b)));
    const rawBuildings = orderedFeatures.filter(feature => feature.layer === 'building' && feature.type === 3);
    const buildings = rawBuildings.flatMap(explodeBuilding)
      .filter(feature => geometryVisible(feature.geometry, input))
      .sort((a, b) => featureKey(a).localeCompare(featureKey(b)));
    const roads = orderedFeatures.filter(feature => feature.layer === 'transportation' && feature.type === 2);
    const water = orderedFeatures.filter(feature => feature.layer === 'water' || feature.layer === 'waterway');
    const storyRoute = chooseStoryRoute(roads, input);
    const retainedRoads = retainRoads(roads, storyRoute);
    const retainedRoadKeys = new Set([...retainedRoads.major, ...retainedRoads.selectedMinor].map(featureKey));
    const renderFeatures = orderedFeatures.filter(feature => feature.layer !== 'building' &&
      (feature.layer !== 'transportation' || retainedRoadKeys.has(featureKey(feature))));
    const settlements = clusterBuildings(buildings, input);
    const landmarks = chooseLandmarks(settlements, storyRoute, input);
    const landmarkKeys = new Set(landmarks.map(item => item.key));
    const ordinarySettlements = settlements.filter(item => !landmarkKeys.has(item.key));
    const fallbackTraveler = storyRoute?.start || [input.width / 2, input.height * .78];
    const locationScreen = input.location ? projectPoint(input.location, input) : fallbackTraveler;
    const traveler = freeze({
      x: snap(locationScreen[0]),
      y: snap(locationScreen[1]),
      source: input.location ? 'current-location' : 'scene-start',
      sourceKey: storyRoute?.sourceKey || 'viewport-focus',
    });
    const renderedHouseCount = ordinarySettlements.reduce((sum, item) => sum + item.houseCount, 0) +
      landmarks.reduce((sum, item) => sum + Math.max(3, item.houseCount), 0);
    const primaryLandmark = landmarks[0] || null;
    const stats = freeze({
      sourceBuildingCount: buildings.length,
      sourceBuildingFeatureCount: rawBuildings.length,
      renderedHouseCount: Math.min(maxRenderedHouses, renderedHouseCount),
      settlementClusterCount: settlements.length,
      landmarkCount: landmarks.length,
      storyRouteCount: storyRoute ? 1 : 0,
      travelerCount: 1,
      sourceMajorRoadCount: retainedRoads.major.length,
      retainedMajorRoadCount: retainedRoads.major.length,
      sourceMinorRoadCount: retainedRoads.minor.length,
      retainedMinorRoadCount: retainedRoads.selectedMinor.length,
      sourceWaterCount: water.length,
      retainedWaterCount: water.length,
      routeStartX: storyRoute?.start[0] ?? null,
      routeStartY: storyRoute?.start[1] ?? null,
      routeDestinationX: storyRoute?.destination[0] ?? null,
      routeDestinationY: storyRoute?.destination[1] ?? null,
      routeSpanY: storyRoute ? Math.abs(storyRoute.start[1] - storyRoute.destination[1]) : 0,
      travelerX: traveler.x,
      travelerY: traveler.y,
      landmarkX: primaryLandmark?.x ?? null,
      landmarkY: primaryLandmark?.y ?? null,
    });
    const fingerprint = PATTERNS.hashString([
      ...renderFeatures.map(featureKey),
      ...settlements.map(item => `${item.key}:${item.x}:${item.y}:${item.houseCount}`),
      storyRoute ? `${storyRoute.sourceKey}:${storyRoute.pathKey}` : 'no-route',
      `traveler:${traveler.x}:${traveler.y}`,
    ].sort().join('|')).toString(16);
    return freeze({
      version,
      renderFeatures,
      settlements: ordinarySettlements,
      landmarks,
      storyRoute,
      traveler,
      stats,
      fingerprint,
    });
  }

  global.PixelMapTopDownComposer = freeze({
    version,
    artPixelSize,
    maxMinorRoadRatio,
    maxRenderedHouses,
    clusterRange,
    landmarkRange,
    compose,
  });
})(typeof window !== 'undefined' ? window : globalThis);
