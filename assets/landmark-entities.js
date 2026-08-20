(function (global) {
  'use strict';

  /*
   * 名前付き敷地と、その内側にある独立施設を親子の施設エンティティへ変換する。
   * 描画処理やビューポートには依存せず、地域別GeoJSONの事前生成結果と
   * ブラウザ描画のどちらからも利用できる純粋な幾何・選択モジュール。
   */
  const ALGORITHM_VERSION = 'landmark-entities/1';

  const featureId = feature => String(
    feature?.properties?.id || feature?.id ||
    `${feature?.properties?.osm_type || 'feature'}/${feature?.properties?.osm_id || ''}`
  );
  const activeAtZoom = (feature, zoom) => {
    const props = feature.properties || {};
    const minzoom = Number(props.minzoom ?? 0);
    const maxzoom = Number(props.maxzoom ?? 24);
    return zoom >= minzoom && zoom <= maxzoom;
  };
  const anchorOf = feature => {
    const props = feature.properties || {};
    const configured = props.icon_anchor || props.anchor;
    if (Array.isArray(configured) && configured.length >= 2)
      return [Number(configured[0]), Number(configured[1])];
    if (feature.geometry?.type === 'Point') return feature.geometry.coordinates.slice(0, 2);
    const polygons = geometryPolygons(feature.geometry);
    const outer = polygons[0]?.[0] || [];
    if (!outer.length) return null;
    const average = outer.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
      .map(value => value / outer.length);
    return geometryContains(feature.geometry, average) ? average : outer[0].slice(0, 2);
  };

  function geometryPolygons(geometry){
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return [geometry.coordinates];
    if (geometry.type === 'MultiPolygon') return geometry.coordinates;
    return [];
  }
  function ringContains(ring, point){
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  }
  function geometryContains(geometry, point){
    if (!geometry || !point) return false;
    if (geometry.type === 'Point')
      return geometry.coordinates[0] === point[0] && geometry.coordinates[1] === point[1];
    for (const polygon of geometryPolygons(geometry)){
      if (!polygon.length || !ringContains(polygon[0], point)) continue;
      if (polygon.slice(1).some(hole => ringContains(hole, point))) continue;
      return true;
    }
    return false;
  }

  function deriveHierarchy(collection){
    const source = Array.isArray(collection?.features) ? collection.features : [];
    const features = source.map(feature => ({
      ...feature,
      properties:{ ...(feature.properties || {}), id:featureId(feature) },
    }));
    const parents = features.filter(feature => feature.properties.role === 'complex' && geometryPolygons(feature.geometry).length);
    for (const child of features){
      if (child.properties.role === 'complex' || child.properties.parent_id) continue;
      const anchor = anchorOf(child);
      if (!anchor) continue;
      const candidates = parents
        .filter(parent => geometryContains(parent.geometry, anchor))
        .sort((a, b) => Number(a.properties.area_m2 || Infinity) - Number(b.properties.area_m2 || Infinity) ||
          featureId(a).localeCompare(featureId(b)));
      if (candidates[0]) child.properties.parent_id = featureId(candidates[0]);
    }
    return { type:'FeatureCollection', features };
  }

  function mergeOverrides(collection, overrideDocument){
    const patches = overrideDocument?.overrides || {};
    const removed = new Set(Array.isArray(overrideDocument?.remove) ? overrideDocument.remove.map(String) : []);
    const features = (collection?.features || [])
      .filter(feature => !removed.has(featureId(feature)))
      .map(feature => {
        const patch = patches[featureId(feature)] || {};
        const { geometry, properties, ...propertyPatch } = patch;
        return {
          ...feature,
          ...(geometry ? { geometry } : {}),
          properties:{ ...(feature.properties || {}), ...(properties || propertyPatch) },
        };
      });
    for (const feature of overrideDocument?.add || []){
      const id = featureId(feature);
      const index = features.findIndex(existing => featureId(existing) === id);
      if (index >= 0) features[index] = feature;
      else features.push(feature);
    }
    return {
      ...(collection || {}),
      type:'FeatureCollection',
      properties:{
        ...(collection?.properties || {}),
        overrides_schema:overrideDocument?.schema || null,
      },
      features,
    };
  }

  function compareSignatureChildren(a, b){
    const ap = a.properties || {}, bp = b.properties || {};
    const aIndependent = (ap.independent_building || geometryPolygons(a.geometry).length) ? 1 : 0;
    const bIndependent = (bp.independent_building || geometryPolygons(b.geometry).length) ? 1 : 0;
    return bIndependent - aIndependent ||
      Number(bp.area_m2 || 0) - Number(ap.area_m2 || 0) ||
      Number(ap.rank ?? 999) - Number(bp.rank ?? 999) ||
      featureId(a).localeCompare(featureId(b));
  }

  function selectForZoom(collection, zoom){
    const compiled = deriveHierarchy(collection);
    const active = compiled.features.filter(feature => activeAtZoom(feature, zoom));
    const parents = active.filter(feature => feature.properties.role === 'complex');
    const selected = [...parents];
    const signatureByParent = new Map();
    for (const parent of parents){
      const parentId = featureId(parent);
      const children = active
        .filter(feature => feature.properties.parent_id === parentId)
        .sort(compareSignatureChildren);
      const detailZoom = Number(parent.properties.detail_zoom ?? 16);
      const limit = zoom >= detailZoom
        ? children.length
        : Math.max(0, Number(parent.properties.max_signature_children ?? 1));
      const signatures = children.slice(0, limit);
      signatureByParent.set(parentId, signatures.map(featureId));
      selected.push(...signatures);
    }
    selected.push(...active.filter(feature => feature.properties.role === 'standalone'));
    return {
      algorithmVersion:ALGORITHM_VERSION,
      collection:compiled,
      features:selected,
      parentIds:parents.map(featureId),
      signatureByParent,
    };
  }

  function comparableNames(feature){
    const props = feature.properties || {};
    const values = [props.name, props['name:ja'], props['name:en'], ...(props.aliases || [])].filter(Boolean);
    return [...new Set(values.map(value => String(value).normalize('NFKC').toLowerCase()
      .replace(/[\s・'’`\-_.]/g, '')))];
  }

  global.PixelMapLandmarkEntities = {
    ALGORITHM_VERSION,
    featureId,
    anchorOf,
    geometryContains,
    deriveHierarchy,
    mergeOverrides,
    selectForZoom,
    comparableNames,
    compareSignatureChildren,
  };
})(typeof window !== 'undefined' ? window : globalThis);
