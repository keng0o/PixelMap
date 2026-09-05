((global) => {
  'use strict';
  const MapData = global.PixelMapTopDownMap;
  const G = global.PixelMapIllustratedGeometry;
  const Renderer = global.PixelMapIllustratedRenderer;
  const styleId = 'illustrated-landscape-hand-drawn-v2';
  const defaultScale = 1.05;
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
    return [...features, ...extra];
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
    const query = new URLSearchParams(global.location.search);
    const isFixture = query.get('scene') === 'fixture';
    const fixture = global.PixelMapIllustratedFixture;
    const start = MapData.parseInitialCoordinates(global.location.search) || { latitude: 35.531, longitude: 139.702 };
    const point = MapData.lonLatToWorld(start.longitude, start.latitude);
    let navigation = MapData.createNavigationState({ centerX: isFixture ? fixture.centerX : point.x,
      centerY: isFixture ? fixture.centerY : point.y, scale: isFixture ? 1 : defaultScale });
    const cache = new Map(), pending = new Map();
    const fetcher = options.fetch || global.fetch.bind(global);
    let template = FALLBACK_TILE_URL, generation = 0, merged = [], lastScene = null, locationPoint = null, renderCount = 0;
    let failedCount = 0, tileCount = 0, dataReady = false, lastGoodView = null;
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
    function publish(paint = {}) {
      const diagnostics = { styleId, mapReady: dataReady, sceneType: isFixture ? 'fictional-fixture' : 'geographic',
        renderCount, tileCount, failedTileCount: failedCount, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: navigation.scale, bearing: 0, ...lastScene?.stats, ...paint };
      global.PixelMapIllustratedStudy = Object.freeze(diagnostics);
      root.dataset.mapReady = dataReady ? '1' : '0'; root.dataset.styleId = styleId;
      root.dataset.sceneType = diagnostics.sceneType;
      root.dataset.renderCount = String(renderCount);
    }
    function render() {
      const dimensions = size();
      const viewport = { ...dimensions, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: isFixture ? Math.max(dimensions.width / fixture.width, dimensions.height / fixture.height) : navigation.scale };
      if (isFixture) navigation = { ...navigation, scale: viewport.scale };
      lastScene = G.compose(merged, viewport);
      const painted = Renderer.paint(ctx, lastScene, locationPoint);
      renderCount++; publish(painted);
      return lastScene;
    }
    async function fetchTile(tile) {
      const key = `${tile.worldX}/${tile.y}`;
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
    async function loadViewport() {
      if (isFixture) {
        merged = G.mergeFeatures(fixture.features); dataReady = true; render(); return true;
      }
      const request = ++generation;
      const dimensions = size();
      const tiles = MapData.requiredTiles({ ...dimensions, centerX: navigation.centerX, centerY: navigation.centerY,
        scale: navigation.scale, buffer: 512 });
      if (!dataReady) status('地図を描いています…');
      const settled = await Promise.allSettled(tiles.map(fetchTile));
      if (request !== generation) return null;
      const failed = settled.filter(r => r.status === 'rejected').length;
      const successful = settled.filter(r => r.status === 'fulfilled');
      tileCount = tiles.length; failedCount = failed;
      if (!successful.length) {
        if (lastGoodView) {
          navigation = lastGoodView.navigation; merged = lastGoodView.features; locationPoint = lastGoodView.location;
          canvas.style.transform = ''; render();
        }
        status('地図を読み込めませんでした。再試行できます。', true); publish(); return false;
      }
      // Keep cached geometry under missing tiles; never replace a usable map with an empty image.
      const available = tiles.flatMap(t => cache.get(`${t.worldX}/${t.y}`) || []);
      const area = { left: navigation.centerX - dimensions.width / 2 / navigation.scale - 256,
        right: navigation.centerX + dimensions.width / 2 / navigation.scale + 256,
        top: navigation.centerY - dimensions.height / 2 / navigation.scale - 256,
        bottom: navigation.centerY + dimensions.height / 2 / navigation.scale + 256 };
      try { merged = G.mergeFeatures(G.featuresNear(available, area)); }
      catch (error) {
        status('地形を描けませんでした。再試行できます。', true);
        root.dataset.geometryError = String(error.message); return false;
      }
      dataReady = true; render();
      lastGoodView = { navigation: MapData.createNavigationState({ centerX: navigation.centerX,
        centerY: navigation.centerY, scale: navigation.scale }), features: merged, location: locationPoint };
      status(failed ? '一部の地図を読み込めませんでした。' : '', failed > 0);
      const current = new Set(tiles.map(t => `${t.worldX}/${t.y}`));
      for (const key of cache.keys()) if (cache.size > 36 && !current.has(key)) cache.delete(key);
      return true;
    }
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || navigation.drag) return;
      navigation = MapData.reduceNavigation(navigation, { type: 'drag-start', pointerId: event.pointerId, x: event.clientX, y: event.clientY });
      canvas.setPointerCapture?.(event.pointerId); canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', event => {
      if (navigation.drag?.pointerId !== event.pointerId) return;
      navigation = MapData.reduceNavigation(navigation, { type: 'drag-move', pointerId: event.pointerId, x: event.clientX, y: event.clientY });
      canvas.style.transform = `translate(${navigation.preview.x}px, ${navigation.preview.y}px)`;
    });
    function endDrag(event, cancelled) {
      if (navigation.drag?.pointerId !== event.pointerId) return;
      navigation = MapData.reduceNavigation(navigation, { type: cancelled ? 'drag-cancel' : 'drag-end', pointerId: event.pointerId });
      canvas.style.transform = ''; canvas.classList.remove('is-dragging'); canvas.releasePointerCapture?.(event.pointerId);
      render(); if (!cancelled) void loadViewport();
    }
    canvas.addEventListener('pointerup', e => endDrag(e, false));
    canvas.addEventListener('pointercancel', e => endDrag(e, true));
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
        const target = MapData.createNavigationState({ centerX: p.x, centerY: p.y, scale: defaultScale });
        navigation = target;
        locationPoint = [p.x, p.y];
        if (await loadViewport() === false && navigation === target) { navigation = previous; locationPoint = previousLocation; render(); }
      } catch (error) { status(MapData.geolocationErrorMessage(error)); }
      finally { locate.disabled = false; }
    });
    retry.addEventListener('click', () => { void loadViewport(); });
    global.addEventListener('resize', () => { render(); void loadViewport(); });
    if (isFixture) {
      document.querySelector('[data-fixture-label]').hidden = false; locate.hidden = true;
    } else {
      try {
        const response = await fetcher(TILEJSON_URL, { signal: AbortSignal.timeout(8000) });
        if (response.ok) { const data = await response.json(); if (data.tiles?.[0]) template = data.tiles[0]; }
      } catch { /* The known fallback is retried through the same visible error flow. */ }
    }
    await loadViewport();
    return Object.freeze({ render, loadViewport, getScene: () => lastScene, cache });
  }
  global.PixelMapIllustratedMap = Object.freeze({ styleId, defaultScale, normalize, boot });
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
