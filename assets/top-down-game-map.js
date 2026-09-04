((global) => {
  'use strict';

  const version = 'pixelmap-top-down-map/2';
  const tileZoom = 14;
  const worldTileExtent = 4096;
  const displayTileSize = 2560;
  const defaultScale = displayTileSize / worldTileExtent;
  const bearing = 0;
  const bearingLocked = true;
  const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';
  const FALLBACK_TILE_URL = 'https://tiles.openfreemap.org/planet/20260802_080001_pt/{z}/{x}/{y}.pbf';
  const retainedLayers = Object.freeze([
    'landcover', 'landuse', 'park', 'water', 'waterway', 'transportation', 'building',
  ]);
  const retainedLayerSet = new Set(retainedLayers);
  const defaultCenter = Object.freeze({
    x: 14548.875 * worldTileExtent,
    y: 6460.65 * worldTileExtent,
  });
  const textDecoder = new TextDecoder();

  class Pbf {
    constructor(buffer) {
      this.bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
      this.position = 0;
    }

    varint() {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        if (this.position >= this.bytes.length) throw new Error('Unexpected end of PBF varint');
        byte = this.bytes[this.position++];
        result += shift < 28 ? (byte & 0x7f) << shift : (byte & 0x7f) * 2 ** shift;
        shift += 7;
      } while (byte >= 0x80);
      return result;
    }

    signedVarint() {
      const value = this.varint();
      return value % 2 === 1 ? -(value + 1) / 2 : value / 2;
    }

    string() {
      const length = this.varint();
      const end = this.position + length;
      if (end > this.bytes.length) throw new Error('Unexpected end of PBF string');
      const value = textDecoder.decode(this.bytes.subarray(this.position, end));
      this.position = end;
      return value;
    }

    float() {
      const value = this.view.getFloat32(this.position, true);
      this.position += 4;
      return value;
    }

    double() {
      const value = this.view.getFloat64(this.position, true);
      this.position += 8;
      return value;
    }

    packedVarints() {
      const length = this.varint();
      const end = this.position + length;
      const values = [];
      while (this.position < end) values.push(this.varint());
      return values;
    }

    skip(wireType) {
      if (wireType === 0) this.varint();
      else if (wireType === 1) this.position += 8;
      else if (wireType === 2) this.position += this.varint();
      else if (wireType === 5) this.position += 4;
      else throw new Error(`Unsupported PBF wire type: ${wireType}`);
    }
  }

  function parseValue(reader) {
    const length = reader.varint();
    const end = reader.position + length;
    let value = null;
    while (reader.position < end) {
      const tag = reader.varint();
      const field = tag >> 3;
      const wireType = tag & 7;
      if (field === 1) value = reader.string();
      else if (field === 2) value = reader.float();
      else if (field === 3) value = reader.double();
      else if (field === 4 || field === 5) value = reader.varint();
      else if (field === 6) value = reader.signedVarint();
      else if (field === 7) value = Boolean(reader.varint());
      else reader.skip(wireType);
    }
    return value;
  }

  function zigzag(value) {
    return (value >> 1) ^ -(value & 1);
  }

  function decodeGeometry(commands) {
    let x = 0;
    let y = 0;
    let index = 0;
    let path = null;
    const paths = [];
    while (index < commands.length) {
      const packed = commands[index++];
      const command = packed & 7;
      const count = packed >> 3;
      if (command === 1) {
        for (let item = 0; item < count; item += 1) {
          x += zigzag(commands[index++]);
          y += zigzag(commands[index++]);
          path = [[x, y]];
          paths.push(path);
        }
      } else if (command === 2) {
        if (!path) throw new Error('MVT line command precedes move command');
        for (let item = 0; item < count; item += 1) {
          x += zigzag(commands[index++]);
          y += zigzag(commands[index++]);
          path.push([x, y]);
        }
      } else if (command === 7) {
        if (path?.length) path.push(path[0].slice());
      } else {
        throw new Error(`Unsupported MVT geometry command: ${command}`);
      }
    }
    return paths;
  }

  function decodeTile(buffer) {
    const reader = new Pbf(buffer);
    const layers = {};
    while (reader.position < reader.bytes.length) {
      const tag = reader.varint();
      const field = tag >> 3;
      const wireType = tag & 7;
      if (field !== 3) {
        reader.skip(wireType);
        continue;
      }
      const layerLength = reader.varint();
      const layerEnd = reader.position + layerLength;
      const layer = { name: '', extent: worldTileExtent, keys: [], values: [], ranges: [], features: [] };
      while (reader.position < layerEnd) {
        const layerTag = reader.varint();
        const layerField = layerTag >> 3;
        const layerWireType = layerTag & 7;
        if (layerField === 1) layer.name = reader.string();
        else if (layerField === 2) {
          const length = reader.varint();
          layer.ranges.push([reader.position, reader.position + length]);
          reader.position += length;
        } else if (layerField === 3) layer.keys.push(reader.string());
        else if (layerField === 4) layer.values.push(parseValue(reader));
        else if (layerField === 5) layer.extent = reader.varint();
        else reader.skip(layerWireType);
      }
      for (const [start, end] of layer.ranges) {
        const featureReader = new Pbf(reader.bytes.subarray(start, end));
        const feature = { id: null, props: {}, type: 0, geom: [] };
        let tags = [];
        while (featureReader.position < featureReader.bytes.length) {
          const featureTag = featureReader.varint();
          const featureField = featureTag >> 3;
          const featureWireType = featureTag & 7;
          if (featureField === 1) feature.id = featureReader.varint();
          else if (featureField === 2) tags = featureReader.packedVarints();
          else if (featureField === 3) feature.type = featureReader.varint();
          else if (featureField === 4) feature.geom = decodeGeometry(featureReader.packedVarints());
          else featureReader.skip(featureWireType);
        }
        for (let index = 0; index + 1 < tags.length; index += 2) {
          feature.props[layer.keys[tags[index]]] = layer.values[tags[index + 1]];
        }
        layer.features.push(feature);
      }
      delete layer.ranges;
      if (layer.name) layers[layer.name] = layer;
    }
    return layers;
  }

  async function maybeGunzip(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return buffer;
    if (typeof DecompressionStream === 'undefined') throw new Error('gzip decompression is unavailable');
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  function lonLatToWorld(longitude, latitude) {
    const maxLatitude = 85.05112878;
    const safeLatitude = Math.max(-maxLatitude, Math.min(maxLatitude, Number(latitude)));
    const wrappedLongitude = ((Number(longitude) + 180) % 360 + 360) % 360 - 180;
    const worldSize = (2 ** tileZoom) * worldTileExtent;
    const radians = safeLatitude * Math.PI / 180;
    return Object.freeze({
      x: (wrappedLongitude + 180) / 360 * worldSize,
      y: (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * worldSize,
    });
  }

  function worldToLonLat(x, y) {
    const worldSize = (2 ** tileZoom) * worldTileExtent;
    const longitude = Number(x) / worldSize * 360 - 180;
    const mercator = Math.PI * (1 - 2 * Number(y) / worldSize);
    const latitude = Math.atan(Math.sinh(mercator)) * 180 / Math.PI;
    return Object.freeze({ latitude, longitude });
  }

  function requiredTiles({ centerX, centerY, width, height, scale = defaultScale, buffer = 96 }) {
    const tileCount = 2 ** tileZoom;
    const halfWorldWidth = (width / 2 + buffer) / scale;
    const halfWorldHeight = (height / 2 + buffer) / scale;
    const minX = Math.floor((centerX - halfWorldWidth) / worldTileExtent);
    const maxX = Math.floor((centerX + halfWorldWidth) / worldTileExtent);
    const minY = Math.max(0, Math.floor((centerY - halfWorldHeight) / worldTileExtent));
    const maxY = Math.min(tileCount - 1, Math.floor((centerY + halfWorldHeight) / worldTileExtent));
    const result = [];
    for (let y = minY; y <= maxY; y += 1) {
      for (let worldX = minX; worldX <= maxX; worldX += 1) {
        const requestX = ((worldX % tileCount) + tileCount) % tileCount;
        result.push(Object.freeze({ worldX, requestX, y, z: tileZoom }));
      }
    }
    return Object.freeze(result);
  }

  function visibleProps(props = {}) {
    return Object.fromEntries(Object.entries(props).filter(([key]) =>
      !key.startsWith('name') && !['ref', 'network', 'shield', 'route_1'].includes(key)));
  }

  function normalizeTileLayers(layers, tileX, tileY) {
    const features = [];
    for (const [layerName, layer] of Object.entries(layers || {})) {
      if (!retainedLayerSet.has(layerName)) continue;
      const extent = Number(layer.extent) || worldTileExtent;
      const factor = worldTileExtent / extent;
      for (const source of layer.features || []) {
        if (![2, 3].includes(source.type)) continue;
        const props = visibleProps(source.props);
        const tunnel = String(props.brunnel || props.tunnel || '').toLowerCase();
        if (layerName === 'transportation' && ['tunnel', 'true', '1'].includes(tunnel)) continue;
        features.push(Object.freeze({
          layer: layerName,
          id: source.id,
          type: source.type,
          props: Object.freeze(props),
          geometry: Object.freeze((source.geom || []).map(path => Object.freeze(path.map(point => Object.freeze([
            tileX * worldTileExtent + point[0] * factor,
            tileY * worldTileExtent + point[1] * factor,
          ]))))),
        }));
      }
    }
    return Object.freeze(features);
  }

  function featureMergeKey(feature) {
    const points = feature.geometry.flat();
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    const bounds = points.length
      ? `${Math.min(...xs).toFixed(3)},${Math.min(...ys).toFixed(3)},${Math.max(...xs).toFixed(3)},${Math.max(...ys).toFixed(3)}`
      : '0.000,0.000,0.000,0.000';
    const identity = feature.id !== null && feature.id !== undefined ? `id:${feature.id}` : 'no-id';
    return `${feature.layer}|${feature.type}|${identity}|${bounds}`;
  }

  function mergeFeatures(featureGroups) {
    const merged = new Map();
    for (const feature of featureGroups.flat()) {
      const key = featureMergeKey(feature);
      if (!merged.has(key)) merged.set(key, { ...feature, geometry: [...feature.geometry] });
    }
    return [...merged.values()].map(feature => Object.freeze({ ...feature, geometry: Object.freeze(feature.geometry) }));
  }

  function featuresInViewport(features, { centerX, centerY, width, height, scale = defaultScale, buffer = 80 }) {
    const halfWidth = (width / 2 + buffer) / scale;
    const halfHeight = (height / 2 + buffer) / scale;
    const left = centerX - halfWidth;
    const right = centerX + halfWidth;
    const top = centerY - halfHeight;
    const bottom = centerY + halfHeight;
    return features.filter(feature => {
      const points = feature.geometry.flat();
      if (!points.length) return false;
      const xs = points.map(point => point[0]);
      const ys = points.map(point => point[1]);
      return Math.max(...xs) >= left && Math.min(...xs) <= right && Math.max(...ys) >= top && Math.min(...ys) <= bottom;
    });
  }

  function parseInitialCoordinates(search = '') {
    const params = new URLSearchParams(search);
    const latitudeText = params.get('lat');
    const longitudeText = params.get('lon');
    if (!latitudeText?.trim() || !longitudeText?.trim()) return null;
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 85.05112878 || Math.abs(longitude) > 180) return null;
    return Object.freeze({ latitude, longitude });
  }

  function createNavigationState({ centerX = defaultCenter.x, centerY = defaultCenter.y, scale = defaultScale } = {}) {
    return Object.freeze({ centerX, centerY, scale, bearing, bearingLocked, drag: null, preview: Object.freeze({ x: 0, y: 0 }) });
  }

  function reduceNavigation(state, action) {
    if (action.type === 'drag-start' && state.drag === null) {
      return Object.freeze({ ...state, drag: Object.freeze({ pointerId: action.pointerId, x: action.x, y: action.y }), preview: Object.freeze({ x: 0, y: 0 }) });
    }
    if (action.type === 'drag-move' && state.drag?.pointerId === action.pointerId) {
      return Object.freeze({ ...state, preview: Object.freeze({ x: action.x - state.drag.x, y: action.y - state.drag.y }) });
    }
    if ((action.type === 'drag-end' || action.type === 'drag-cancel') && state.drag?.pointerId === action.pointerId) {
      const commit = action.type === 'drag-end';
      return Object.freeze({
        ...state,
        centerX: commit ? state.centerX - state.preview.x / state.scale : state.centerX,
        centerY: commit ? state.centerY - state.preview.y / state.scale : state.centerY,
        drag: null,
        preview: Object.freeze({ x: 0, y: 0 }),
        bearing,
        bearingLocked,
      });
    }
    return state;
  }

  function geolocationErrorMessage(error) {
    if (error?.code === 1) return '現在地の使用が許可されていません。ブラウザの設定を確認してください。';
    if (error?.code === 2) return '現在地を見つけられませんでした。電波のよい場所でもう一度お試しください。';
    if (error?.code === 3) return '現在地の取得がタイムアウトしました。もう一度お試しください。';
    return '現在地を取得できませんでした。';
  }

  function createTileStore({ fetchTile }) {
    let generation = 0;
    const cache = new Map();
    const inflight = new Map();
    const keyOf = tile => `${tile.worldX}/${tile.y}`;
    return Object.freeze({
      cache,
      inflight,
      setGeneration(value) { generation = value; },
      load(tile, requestGeneration) {
        const key = keyOf(tile);
        if (cache.has(key)) return Promise.resolve(cache.get(key));
        const requestKey = `${requestGeneration}:${key}`;
        if (inflight.has(requestKey)) return inflight.get(requestKey);
        const request = Promise.resolve(fetchTile(tile, requestGeneration)).then(features => {
          if (requestGeneration !== generation) return null;
          cache.set(key, features);
          return features;
        }).finally(() => inflight.delete(requestKey));
        inflight.set(requestKey, request);
        return request;
      },
      featuresFor(tiles) {
        return mergeFeatures(tiles.map(tile => cache.get(keyOf(tile)) || []));
      },
    });
  }

  function templateUrl(template, tile) {
    return template.replace('{z}', String(tileZoom)).replace('{x}', String(tile.requestX)).replace('{y}', String(tile.y));
  }

  async function bootPage(options = {}) {
    if (typeof document === 'undefined') return null;
    const Renderer = global.PixelMapTopDownRenderer;
    const Patterns = global.PixelMapTopDownPatterns;
    if (!Renderer || !Patterns) throw new Error('Top-down renderer modules are required');

    const root = document.documentElement;
    const canvas = document.querySelector('[data-top-down-map]');
    const locateButton = document.querySelector('[data-current-location]');
    const statusPanel = document.querySelector('[data-map-status]');
    const statusText = document.querySelector('[data-map-status-text]');
    const retryButton = document.querySelector('[data-map-retry]');
    if (!canvas || !locateButton || !statusPanel || !statusText || !retryButton) {
      throw new Error('Top-down map page elements are missing');
    }

    const context = canvas.getContext('2d');
    let navigation = createNavigationState();
    const queryCoordinates = parseInitialCoordinates(global.location?.search || '');
    if (queryCoordinates) {
      const point = lonLatToWorld(queryCoordinates.longitude, queryCoordinates.latitude);
      navigation = createNavigationState({ centerX: point.x, centerY: point.y });
    }
    let locationPoint = null;
    let generation = 0;
    let renderCount = 0;
    let tileTemplate = FALLBACK_TILE_URL;
    let tileTemplateSource = 'fallback';
    let lastScene = null;
    let lastTiles = [];
    let loading = false;

    const fetchImplementation = options.fetch || global.fetch?.bind(global);
    if (!fetchImplementation) throw new Error('Fetch API is unavailable');

    async function fetchTile(tile) {
      const response = await fetchImplementation(templateUrl(tileTemplate, tile));
      if (!response.ok) throw new Error(`Tile request failed: ${response.status}`);
      const decoded = decodeTile(await maybeGunzip(await response.arrayBuffer()));
      return normalizeTileLayers(decoded, tile.worldX, tile.y);
    }

    const store = createTileStore({ fetchTile });

    function setStatus(message = '', canRetry = false) {
      statusText.textContent = message;
      retryButton.hidden = !canRetry;
      statusPanel.hidden = !message;
    }

    function resizeCanvas() {
      const width = Math.max(1, Math.round(canvas.clientWidth || global.innerWidth || 1));
      const height = Math.max(1, Math.round(canvas.clientHeight || global.innerHeight || 1));
      const ratio = Math.min(2, Math.max(1, global.devicePixelRatio || 1));
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width, height, ratio };
    }

    function publishDiagnostics(scene, tiles, failedCount = 0) {
      const stats = scene?.stats || {};
      const diagnostics = Object.freeze({
        version,
        styleId: Patterns.styleId,
        mapReady: Boolean(scene),
        bearing,
        bearingLocked,
        labelCount: stats.labelCount ?? 0,
        poiMarkerCount: stats.poiMarkerCount ?? 0,
        buildingExtrusionEnabled: stats.buildingExtrusionEnabled ?? false,
        patternFamilies: stats.patternFamilies || {},
        patternFingerprint: scene?.patternFingerprint || null,
        roofCount: stats.roofCount || 0,
        treeCount: stats.treeCount || 0,
        tileCount: tiles.length,
        cachedTileCount: store.cache.size,
        failedTileCount: failedCount,
        renderCount,
        tileTemplateSource,
      });
      global.PixelMapTopDownStudy = diagnostics;
      root.dataset.mapReady = scene ? '1' : '0';
      root.dataset.styleId = Patterns.styleId;
      root.dataset.bearing = '0';
      root.dataset.bearingLocked = 'true';
      root.dataset.labelCount = String(diagnostics.labelCount);
      root.dataset.poiMarkerCount = String(diagnostics.poiMarkerCount);
      root.dataset.buildingExtrusionEnabled = String(diagnostics.buildingExtrusionEnabled);
      root.dataset.renderCount = String(renderCount);
      root.dataset.patternFingerprint = diagnostics.patternFingerprint || '';
      root.dataset.roofCount = String(diagnostics.roofCount);
      root.dataset.treeCount = String(diagnostics.treeCount);
      for (const [family, count] of Object.entries(diagnostics.patternFamilies)) {
        root.dataset[`pattern${family[0].toUpperCase()}${family.slice(1)}`] = String(count);
      }
    }

    function render(tiles = lastTiles, failedCount = 0) {
      const { width, height } = resizeCanvas();
      const allFeatures = store.featuresFor(tiles);
      const features = featuresInViewport(allFeatures, {
        centerX: navigation.centerX,
        centerY: navigation.centerY,
        width,
        height,
        scale: navigation.scale,
      });
      if (!features.length) return null;
      const scene = Renderer.buildScene({
        width,
        height,
        viewport: { centerX: navigation.centerX, centerY: navigation.centerY, scale: navigation.scale },
        features,
        location: locationPoint ? [locationPoint.x, locationPoint.y] : null,
      });
      context.clearRect(0, 0, width, height);
      Renderer.paintScene(context, scene);
      renderCount += 1;
      lastScene = scene;
      publishDiagnostics(scene, tiles, failedCount);
      return scene;
    }

    async function resolveTileTemplate() {
      try {
        const response = await fetchImplementation(TILEJSON_URL);
        if (!response.ok) return;
        const tileJson = await response.json();
        if (Array.isArray(tileJson.tiles) && tileJson.tiles[0]) {
          tileTemplate = tileJson.tiles[0];
          tileTemplateSource = 'tilejson';
        }
      } catch (error) {
        tileTemplateSource = 'fallback';
      }
    }

    async function loadViewport({ preserveMessage = false } = {}) {
      if (loading) return false;
      loading = true;
      generation += 1;
      store.setGeneration(generation);
      const { width, height } = resizeCanvas();
      const tiles = requiredTiles({ centerX: navigation.centerX, centerY: navigation.centerY, width, height, scale: navigation.scale });
      lastTiles = tiles;
      if (!lastScene && !preserveMessage) setStatus('地図を読み込んでいます…');
      const settled = await Promise.allSettled(tiles.map(tile => store.load(tile, generation)));
      const failed = settled.filter(result => result.status === 'rejected').length;
      loading = false;
      const scene = render(tiles, failed);
      if (!scene) {
        setStatus('地図データを読み込めませんでした。', true);
        publishDiagnostics(null, tiles, failed);
        return false;
      }
      if (failed) setStatus('一部の地図データを読み込めませんでした。', true);
      else setStatus('');
      return true;
    }

    function pointerPosition(event) {
      return { x: event.clientX, y: event.clientY };
    }

    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || navigation.drag) return;
      const point = pointerPosition(event);
      navigation = reduceNavigation(navigation, { type: 'drag-start', pointerId: event.pointerId, ...point });
      canvas.setPointerCapture?.(event.pointerId);
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', event => {
      if (navigation.drag?.pointerId !== event.pointerId) return;
      const point = pointerPosition(event);
      navigation = reduceNavigation(navigation, { type: 'drag-move', pointerId: event.pointerId, ...point });
      canvas.style.transform = `translate(${navigation.preview.x}px, ${navigation.preview.y}px)`;
    });

    async function endDrag(event, cancelled = false) {
      if (navigation.drag?.pointerId !== event.pointerId) return;
      navigation = reduceNavigation(navigation, { type: cancelled ? 'drag-cancel' : 'drag-end', pointerId: event.pointerId });
      canvas.style.transform = '';
      canvas.classList.remove('is-dragging');
      canvas.releasePointerCapture?.(event.pointerId);
      render();
      if (!cancelled) await loadViewport();
    }
    canvas.addEventListener('pointerup', event => { void endDrag(event); });
    canvas.addEventListener('pointercancel', event => { void endDrag(event, true); });

    function getCurrentPosition() {
      return new Promise((resolve, reject) => global.navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }));
    }

    locateButton.addEventListener('click', async () => {
      if (!global.isSecureContext) {
        setStatus('現在地にはHTTPSまたはlocalhostが必要です。');
        return;
      }
      if (!global.navigator?.geolocation) {
        setStatus('このブラウザでは現在地を利用できません。');
        return;
      }
      const previousNavigation = navigation;
      const previousLocation = locationPoint;
      const previousTiles = lastTiles;
      locateButton.disabled = true;
      setStatus('現在地を探しています…');
      try {
        const position = await getCurrentPosition();
        const point = lonLatToWorld(position.coords.longitude, position.coords.latitude);
        navigation = createNavigationState({ centerX: point.x, centerY: point.y, scale: previousNavigation.scale });
        locationPoint = point;
        setStatus('現在地の地図を読み込んでいます…');
        if (!await loadViewport({ preserveMessage: true })) {
          navigation = previousNavigation;
          locationPoint = previousLocation;
          lastTiles = previousTiles;
          render();
          setStatus('現在地は取得できましたが、地図を読み込めませんでした。', true);
        }
      } catch (error) {
        navigation = previousNavigation;
        locationPoint = previousLocation;
        lastTiles = previousTiles;
        render();
        setStatus(geolocationErrorMessage(error));
      } finally {
        locateButton.disabled = false;
      }
    });

    retryButton.addEventListener('click', () => { void loadViewport(); });
    global.addEventListener?.('resize', () => { render(); void loadViewport(); });

    root.dataset.mapReady = '0';
    root.dataset.bearing = '0';
    root.dataset.bearingLocked = 'true';
    await resolveTileTemplate();
    await loadViewport();
    return Object.freeze({ loadViewport, render, store });
  }

  const api = Object.freeze({
    version,
    tileZoom,
    worldTileExtent,
    defaultScale,
    defaultCenter,
    bearing,
    bearingLocked,
    retainedLayers,
    decodeGeometry,
    decodeTile,
    maybeGunzip,
    lonLatToWorld,
    worldToLonLat,
    requiredTiles,
    normalizeTileLayers,
    mergeFeatures,
    featuresInViewport,
    parseInitialCoordinates,
    createNavigationState,
    reduceNavigation,
    geolocationErrorMessage,
    createTileStore,
    bootPage,
  });

  global.PixelMapTopDownMap = api;
  if (typeof document !== 'undefined') {
    const start = () => {
      if (!document.querySelector('[data-top-down-map]')) return;
      bootPage().catch(error => {
        console.error(error);
        document.documentElement.dataset.bootError = String(error?.message || error);
        const statusPanel = document.querySelector('[data-map-status]');
        const statusText = document.querySelector('[data-map-status-text]');
        if (statusPanel && statusText) {
          statusText.textContent = '地図を開始できませんでした。';
          statusPanel.hidden = false;
        }
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
