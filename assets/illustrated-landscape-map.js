((global) => {
  'use strict';
  const MapData = global.PixelMapTopDownMap;
  const G = global.PixelMapIllustratedGeometry;
  const Renderer = global.PixelMapIllustratedRenderer;
  const styleId = 'illustrated-landscape-hand-drawn-v11';
  const defaultScale = 1.05;
  const zoomRange = Object.freeze({ min: .5, max: 4, step: Math.SQRT2 });
  const fallbackSourceRange = Object.freeze({ min: 0, max: 14 });
  function sourceZoomRange(tileJSON = {}) {
    const min = Number.isInteger(tileJSON.minzoom) ? Math.max(0, Math.min(22,tileJSON.minzoom)) : fallbackSourceRange.min;
    const max = Number.isInteger(tileJSON.maxzoom) ? Math.max(min, Math.min(22,tileJSON.maxzoom)) : Math.max(min,fallbackSourceRange.max);
    return Object.freeze({min,max});
  }
  function dataZoomForScale(scale, range = fallbackSourceRange) {
    // Match the existing initial view to z14, then step the source down on zoom
    // out. Beyond the provider's maximum, keep its most detailed source tile.
    return Math.max(range.min,Math.min(range.max,
      Math.floor(MapData.tileZoom + Math.log2(scale/defaultScale) + 1e-9)));
  }
  const tileKey = tile => `${tile.z}/${tile.worldX}/${tile.y}`;
  function requiredTiles({centerX,centerY,width,height,scale,buffer = 512}, z) {
    const span = MapData.worldTileExtent * 2 ** (MapData.tileZoom-z), count = 2 ** z;
    const dx = (width/2+buffer)/scale, dy = (height/2+buffer)/scale, tiles = [];
    const minY = Math.max(0,Math.floor((centerY-dy)/span)), maxY = Math.min(count-1,Math.floor((centerY+dy)/span));
    for(let y=minY;y<=maxY;y++) for(let x=Math.floor((centerX-dx)/span);x<=Math.floor((centerX+dx)/span);x++) {
      tiles.push(Object.freeze({z,worldX:x,requestX:((x%count)+count)%count,y}));
    }
    return Object.freeze(tiles);
  }
  function transformView(view, viewport, from, to, factor = 1, baseScale = defaultScale) {
    const scale = Math.max(baseScale * zoomRange.min, Math.min(baseScale * zoomRange.max,
      view.scale * (Number.isFinite(factor) && factor > 0 ? factor : 1)));
    if (scale === view.scale && from.x === to.x && from.y === to.y) return view;
    return MapData.createNavigationState({ scale,
      centerX: view.centerX + (from.x - viewport.width / 2) / view.scale - (to.x - viewport.width / 2) / scale,
      centerY: view.centerY + (from.y - viewport.height / 2) / view.scale - (to.y - viewport.height / 2) / scale });
  }
  function previewTransform(painted, view, viewport) {
    const scale = view.scale / painted.scale;
    return { scale,
      x: viewport.width / 2 - painted.width / 2 * scale + (painted.centerX - view.centerX) * view.scale,
      y: viewport.height / 2 - painted.height / 2 * scale + (painted.centerY - view.centerY) * view.scale };
  }
  const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';
  const FALLBACK_TILE_URL = 'https://tiles.openfreemap.org/planet/20260802_080001_pt/{z}/{x}/{y}.pbf';
  function normalize(layers, tile) {
    const features = MapData.normalizeTileLayers(layers, tile.worldX, tile.y);
    // Surface map: tunnels remain part of the source contract, but are never painted as surface paths.
    const tunnels = (layers.transportation?.features || []).filter(f =>
      ['tunnel', 'true', '1'].includes(String(f.props?.brunnel || f.props?.tunnel || '').toLowerCase()));
    const extra = tunnels.flatMap(f => MapData.normalizeTileLayers({ transportation: { ...layers.transportation,
      features: [{ ...f, props: { ...f.props, brunnel: '', tunnel: '' } }] } }, tile.worldX, tile.y))
      .map(f => ({ ...f, props: { ...f.props, brunnel: 'tunnel' } }));
    // All renderer geometry stays in the original z14 world. Only the source
    // tile grid changes; heights and other attributes retain their own units.
    const z = tile.z ?? MapData.tileZoom, factor = 2 ** (MapData.tileZoom-z);
    return [...features, ...extra].map(f => ({...f, sourceZoom:z,
      geometry: factor === 1 ? f.geometry : f.geometry.map(path=>path.map(p=>p.map(n=>n*factor))) }));
  }
  async function boot(options = {}) {
    const canvas = document.querySelector('[data-illustrated-map]');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    const panel = document.querySelector('[data-map-status]');
    const message = document.querySelector('[data-map-message]');
    const retry = document.querySelector('[data-map-retry]');
    const locate = document.querySelector('[data-current-location]');
    const zoomIn = document.querySelector('[data-zoom-in]'), zoomOut = document.querySelector('[data-zoom-out]');
    const query = new URLSearchParams(global.location.search);
    const isFixture = query.get('scene') === 'fixture';
    const fixture = global.PixelMapIllustratedFixture;
    const start = MapData.parseInitialCoordinates(global.location.search) || { latitude: 35.531, longitude: 139.702 };
    const point = MapData.lonLatToWorld(start.longitude, start.latitude);
    const fitScale = () => isFixture ? Math.max(canvas.clientWidth / fixture.width, canvas.clientHeight / fixture.height) : defaultScale;
    let baseScale = fitScale();
    let navigation = MapData.createNavigationState({ centerX: isFixture ? fixture.centerX : point.x,
      centerY: isFixture ? fixture.centerY : point.y, scale: baseScale });
    const cache = new Map(), pending = new Map();
    const fetcher = options.fetch || global.fetch.bind(global);
    let template = FALLBACK_TILE_URL, generation = 0, merged = [], lastScene = null, locationPoint = null, renderCount = 0;
    let failedCount = 0, tileCount = 0, dataReady = false, lastGoodView = null, loading = false;
    let sourceRange = fallbackSourceRange, dataZoom = null, lastPaint = {};
    const pointers = new Map();
    let gesture = null, commitTimer = 0, dirty = false;
    const status = (text, canRetry = false) => {
      message.textContent = text; panel.hidden = !text; retry.hidden = !canRetry;
    };
    function size() {
      const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
      const ratio = Math.min(2, Math.max(1, global.devicePixelRatio || 1));
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width, height, ratio };
    }
    function publish(paint) {
      if (paint) lastPaint = paint;
      const diagnostics = { styleId, mapReady: dataReady, sceneType: isFixture ? 'fictional-fixture' : 'geographic',
        renderCount, tileCount, failedTileCount: failedCount, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: navigation.scale, zoom: navigation.scale / baseScale, zoomMin: zoomRange.min, zoomMax: zoomRange.max,
        dataZoom, requestedDataZoom:isFixture ? null : dataZoomForScale(navigation.scale,sourceRange),
        sourceMinZoom:sourceRange.min, sourceMaxZoom:sourceRange.max,
        loading, interacting: pointers.size > 0 || Boolean(commitTimer), bearing: 0, ...lastScene?.stats, ...lastPaint };
      global.PixelMapIllustratedStudy = Object.freeze(diagnostics);
      root.dataset.mapReady = dataReady ? '1' : '0'; root.dataset.styleId = styleId;
      root.dataset.sceneType = diagnostics.sceneType;
      root.dataset.renderCount = String(renderCount);
      zoomIn.disabled = !dataReady || navigation.scale >= baseScale * zoomRange.max - 1e-9;
      zoomOut.disabled = !dataReady || navigation.scale <= baseScale * zoomRange.min + 1e-9;
    }
    function render() {
      const dimensions = size();
      const viewport = { ...dimensions, geographic: !isFixture, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: navigation.scale };
      lastScene = G.compose(merged, viewport);
      const painted = Renderer.paint(ctx, lastScene, locationPoint);
      canvas.style.transform = '';
      renderCount++; publish(painted);
      return lastScene;
    }
    async function fetchTile(tile) {
      const key = tileKey(tile);
      if (cache.has(key)) return cache.get(key);
      if (pending.has(key)) return pending.get(key);
      const promise = (async () => {
        const url = template.replace('{z}', tile.z).replace('{x}', tile.requestX).replace('{y}', tile.y);
        const response = await fetcher(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Tile request failed: ${response.status}`);
        const decoded = MapData.decodeTile(await MapData.maybeGunzip(await response.arrayBuffer()));
        const features = normalize(decoded, tile);
        cache.set(key, features);
        return features;
      })().finally(() => pending.delete(key));
      pending.set(key, promise); return promise;
    }
    function restoreLastGood() {
      if (!lastGoodView) { dataZoom = null; return; }
      navigation = lastGoodView.navigation; merged = lastGoodView.features; locationPoint = lastGoodView.location;
      dataZoom = lastGoodView.dataZoom; render();
    }
    async function loadViewport() {
      if (isFixture) {
        merged = G.mergeFeatures(fixture.features); dataReady = true; render(); return true;
      }
      const request = ++generation;
      loading = true; publish();
      const dimensions = size();
      const z = dataZoomForScale(navigation.scale,sourceRange);
      const tiles = requiredTiles({ ...dimensions, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: navigation.scale, buffer: 512 },z);
      if (!dataReady) status('地図を描いています…');
      const settled = await Promise.allSettled(tiles.map(fetchTile));
      if (request !== generation) return null;
      loading = false;
      const failed = settled.filter(r => r.status === 'rejected').length;
      const successful = settled.filter(r => r.status === 'fulfilled');
      tileCount = tiles.length; failedCount = failed;
      // A new source zoom is swapped as one complete frame. Never fill holes
      // with polygons from another zoom, which can duplicate roads/buildings.
      if (!successful.length || (failed && dataZoom !== null && dataZoom !== z)) {
        restoreLastGood();
        status('地図を読み込めませんでした。再試行できます。', true); publish(); return false;
      }
      const available = tiles.flatMap(t => cache.get(tileKey(t)) || []);
      const area = { left: navigation.centerX - dimensions.width / 2 / navigation.scale - 256,
        right: navigation.centerX + dimensions.width / 2 / navigation.scale + 256,
        top: navigation.centerY - dimensions.height / 2 / navigation.scale - 256,
        bottom: navigation.centerY + dimensions.height / 2 / navigation.scale + 256 };
      try {
        merged = G.mergeFeatures(G.featuresNear(available, area)); dataZoom = z;
        render();
      }
      catch (error) {
        restoreLastGood();
        status('地形を描けませんでした。再試行できます。', true);
        root.dataset.geometryError = String(error.message); publish(); return false;
      }
      dataReady = true; delete root.dataset.geometryError;
      lastGoodView = { navigation: MapData.createNavigationState({ centerX: navigation.centerX,
        centerY: navigation.centerY, scale: navigation.scale }), features: merged, location: locationPoint, dataZoom };
      publish();
      status(failed ? '一部の地図を読み込めませんでした。' : '', failed > 0);
      const current = new Set(tiles.map(tileKey));
      for (const key of cache.keys()) if (cache.size > 36 && !current.has(key)) cache.delete(key);
      return true;
    }
    function position(event) {
      // The bitmap transforms during interaction, so measure against its fixed
      // parent rather than the moving canvas bounding rectangle.
      const rect = canvas.parentElement.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    function pointerFrame() {
      const points = [...pointers.values()];
      return { center: { x: points.reduce((n,p) => n+p.x,0)/points.length,
        y: points.reduce((n,p) => n+p.y,0)/points.length },
        span: points.length === 2 ? Math.max(16,Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)) : 1 };
    }
    function showPreview() {
      if (!lastScene) return;
      const t = previewTransform(lastScene.viewport, navigation, size());
      canvas.style.transform = `matrix(${t.scale},0,0,${t.scale},${t.x},${t.y})`;
      publish();
    }
    function changeView(next) {
      if (next === navigation) return false;
      navigation = next; dirty = true;
      generation++; loading = false; // Ignore fetches for an earlier camera.
      showPreview(); return true;
    }
    function commitView() {
      clearTimeout(commitTimer); commitTimer = 0;
      if (!dirty) { publish(); return; }
      dirty = false; render(); void loadViewport();
    }
    function releaseInputs() {
      clearTimeout(commitTimer); commitTimer = 0;
      const ids = [...pointers.keys()]; pointers.clear(); gesture = null;
      for (const id of ids) if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
      canvas.classList.remove('is-dragging');
    }
    function zoomBy(factor, anchor) {
      if (!dataReady) return;
      releaseInputs();
      const dimensions = size(), p = anchor || {x: dimensions.width/2, y: dimensions.height/2};
      changeView(transformView(navigation, dimensions, p, p, factor, baseScale));
      commitTimer = setTimeout(commitView, 120); publish();
    }
    canvas.addEventListener('pointerdown', event => {
      if (!dataReady || event.button !== 0 || pointers.size >= 2) return;
      if (loading) dirty = true;
      clearTimeout(commitTimer); commitTimer = 0;
      generation++; loading = false;
      pointers.set(event.pointerId, position(event));
      gesture = {view: navigation, ...pointerFrame()};
      canvas.setPointerCapture?.(event.pointerId); canvas.classList.add('is-dragging'); publish();
    });
    canvas.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, position(event));
      const frame = pointerFrame();
      changeView(transformView(gesture.view, size(), gesture.center, frame.center,
        frame.span/gesture.span, baseScale));
    });
    function endPointer(event) {
      if (!pointers.delete(event.pointerId)) return;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (pointers.size) gesture = {view: navigation, ...pointerFrame()};
      else { gesture = null; canvas.classList.remove('is-dragging'); commitView(); }
    }
    for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type,endPointer);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      if (!dataReady || pointers.size) return;
      const dimensions = size(), p = position(event);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? dimensions.height : 1;
      const delta = Math.max(-500,Math.min(500,event.deltaY*unit));
      const factor = Math.exp(-delta*(event.ctrlKey ? .008 : .002));
      changeView(transformView(navigation,dimensions,p,p,factor,baseScale));
      clearTimeout(commitTimer); commitTimer = setTimeout(commitView,180); publish();
    }, {passive:false});
    zoomIn.addEventListener('click', () => zoomBy(zoomRange.step));
    zoomOut.addEventListener('click', () => zoomBy(1/zoomRange.step));
    canvas.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (['+','=','-','_'].includes(event.key)) {
        event.preventDefault(); zoomBy(['+','='].includes(event.key)?zoomRange.step:1/zoomRange.step);
      }
    });
    global.addEventListener('blur', () => { releaseInputs(); commitView(); });
    locate.addEventListener('click', async () => {
      if (!global.isSecureContext || !global.navigator?.geolocation) {
        status('現在地を利用できません。HTTPSと位置情報の設定を確認してください。'); return;
      }
      if (isFixture) return;
      locate.disabled = true;
      status('現在地を探しています…');
      const previous = navigation, previousLocation = locationPoint;
      try {
        const position = await new Promise((resolve, reject) => global.navigator.geolocation.getCurrentPosition(resolve, reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }));
        const p = MapData.lonLatToWorld(position.coords.longitude, position.coords.latitude);
        releaseInputs(); dirty = false;
        const target = MapData.createNavigationState({ centerX: p.x, centerY: p.y, scale: navigation.scale });
        navigation = target;
        locationPoint = [p.x, p.y];
        if (await loadViewport() === false && navigation === target) { navigation = previous; locationPoint = previousLocation; render(); }
      } catch (error) { status(MapData.geolocationErrorMessage(error)); }
      finally { locate.disabled = false; }
    });
    retry.addEventListener('click', () => { void loadViewport(); });
    global.addEventListener('resize', () => {
      if (!canvas.isConnected) return;
      releaseInputs(); generation++; loading = false; dirty = false;
      const zoom = navigation.scale / baseScale; baseScale = fitScale();
      navigation = MapData.createNavigationState({...navigation,scale:baseScale*zoom});
      render(); void loadViewport();
    });
    if (isFixture) {
      document.querySelector('[data-fixture-label]').hidden = false; locate.hidden = true;
    } else {
      try {
        const response = await fetcher(TILEJSON_URL, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          const data = await response.json();
          if (data.tiles?.[0]) { template = data.tiles[0]; sourceRange = sourceZoomRange(data); }
        }
      } catch { /* The known fallback is retried through the same visible error flow. */ }
    }
    await loadViewport();
    return Object.freeze({ render, loadViewport, getScene: () => lastScene, getFeatures: () => merged,
      getView: () => navigation, cache, pending });
  }
  global.PixelMapIllustratedMap = Object.freeze({ styleId, defaultScale, zoomRange, sourceZoomRange,
    dataZoomForScale, requiredTiles, tileKey, transformView, previewTransform, normalize, boot });
  if (typeof document !== 'undefined') {
    const start = () => { void boot().then(app => { global.PixelMapIllustratedApp = app; }).catch(error => {
      document.documentElement.dataset.bootError = String(error.message);
      const panel = document.querySelector('[data-map-status]');
      if (panel) { panel.hidden = false; document.querySelector('[data-map-message]').textContent = '地図を開始できませんでした。'; }
      console.error(error);
    }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
