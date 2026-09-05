((global) => {
  'use strict';
  const G = global.PixelMapIllustratedGeometry;
  const directionLength = Math.hypot(.55, .83);
  const lighting = Object.freeze({ direction: Object.freeze([.55 / directionLength, .83 / directionLength]),
    altitude: 68 * Math.PI / 180, maxReach: 72, step: 1 });
  const material = Object.freeze({ ground: 0, water: 1, roof: 2, canopy: 3, bridge: 4 });
  const pigments = [[87, 94, 68, 55], [59, 91, 85, 59], [94, 65, 46, 46], [43, 72, 39, 43], [87, 88, 67, 49]];
  const cache = new WeakMap();

  function meters(value) {
    if (value === null || value === undefined || value === '') return null;
    const text = String(value).trim();
    if (!/^\d+(?:\.\d+)?\s*(?:m|metres?|meters?|ft|feet|')?$/i.test(text)) return null;
    const n = parseFloat(text) * (/ft|feet|'$/i.test(text) ? .3048 : 1);
    return Number.isFinite(n) && n > 0 && n <= 1000 ? n : null;
  }
  function metersPerWorld(scene, y) {
    if (scene.viewport.metersPerWorld > 0) return scene.viewport.metersPerWorld;
    if (!scene.viewport.geographic) return .55;
    const size = 4096 * 2 ** 14;
    return 40075016.68557849 / size / Math.cosh(Math.PI * (1 - 2 * y / size));
  }
  function heightInfo(scene, object, type, light = lighting) {
    const tree = type === 'canopy', bridge = type === 'bridge';
    const props = object.props || {}, y = tree ? object.y : bridge ? object.geometry[0][0][1] : object.polygon[0][0][1];
    const units = metersPerWorld(scene, y);
    let height = meters(props.render_height) ?? meters(props.height), source = 'attribute';
    if (bridge) {
      // Road "height" is not reliably a deck clearance. Use explicit clearance
      // metadata only; layer indicates ordering, never a number of metres.
      height = meters(props.min_height) ?? meters(props['bridge:height']);
    }
    if (!height && !tree && !bridge) {
      const levels = Number(props['building:levels']);
      if (Number.isFinite(levels) && levels > 0 && levels <= 150) {
        height = levels * 3 + (object.style === 'flat' ? .6 : 2); source = 'levels';
      }
    }
    if (!height) {
      source = 'estimated';
      if (tree) height = object.radius * units * (object.garden ? 1.05 : 1.35 + (G.hash(object.key) % 23) / 100);
      else if (bridge) height = ['motorway', 'trunk', 'rail', 'transit'].includes(G.kind(object)) ? 6 : 3.5;
      else height = /industrial|warehouse/.test(G.kind(object)) ? 8 : object.style === 'flat' ? 10 : 6.5;
    }
    const rawWorld = height / units, world = Math.min(rawWorld, light.maxReach * Math.tan(light.altitude));
    return { meters: height, world, source, capped: world < rawWorld, units };
  }
  function roofRise(roof, info) {
    if (roof.style === 'flat') return 0;
    const measured = meters(roof.props?.['roof:height']);
    return Math.min(info.world * .35, measured ? measured / info.units : 2 / info.units);
  }
  function roofHeight(roof, x, y, info) {
    const rise = roofRise(roof, info);
    if (!rise) return info.world;
    const f = roof.frame, dx = x - f.origin[0], dy = y - f.origin[1];
    const u = dx * f.c + dy * f.s, v = -dx * f.s + dy * f.c;
    let ridge = 0;
    for (const [left, top, right, bottom] of roof.panels) {
      if (u < left || u > right || v < top || v > bottom) continue;
      const vertical = bottom - top > right - left;
      const short = vertical ? right - left : bottom - top;
      const across = vertical ? Math.min(u - left, right - u) : Math.min(v - top, bottom - v);
      let t = Math.min(1, across * 2 / short);
      if (!['gable', 'longhouse'].includes(roof.style)) {
        const along = vertical ? Math.min(v - top, bottom - v) : Math.min(u - left, right - u);
        t = Math.min(t, along / Math.max(.1, short * .55));
      }
      ridge = Math.max(ridge, t);
    }
    return info.world - rise + rise * ridge;
  }

  // World-anchored scan conversion preserves polygon holes and does not depend
  // on Canvas readbacks, device pixel ratio, or the visible feature order.
  function raster(field, rings, visit) {
    const b = G.bounds(rings), step = field.step;
    const first = Math.max(field.gy, Math.ceil(b.top / step - .5));
    const last = Math.min(field.gy + field.height - 1, Math.floor(b.bottom / step - .5));
    for (let gy = first; gy <= last; gy++) {
      const y = (gy + .5) * step, intersections = [];
      for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j], b = ring[i];
        if ((a[1] > y) !== (b[1] > y)) intersections.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      intersections.sort((a, b) => a - b);
      for (let k = 1; k < intersections.length; k += 2) {
        const left = Math.max(field.gx, Math.ceil(intersections[k - 1] / step - .5));
        const right = Math.min(field.gx + field.width - 1, Math.floor(intersections[k] / step - .5));
        for (let gx = left; gx <= right; gx++) visit((gy - field.gy) * field.width + gx - field.gx, (gx + .5) * step, y);
      }
    }
  }
  function linePolygons(paths, width) {
    const polygons = [];
    for (const path of paths) for (let j = 1; j < path.length; j++) {
      const a = path[j - 1], b = path[j], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!length) continue;
      const nx = -(b[1] - a[1]) / length * width / 2, ny = (b[0] - a[0]) / length * width / 2;
      polygons.push([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
        [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
    }
    return polygons;
  }
  function build(scene, crownPoints, options = {}) {
    const light = { ...lighting, ...options }, v = scene.viewport, step = light.step;
    const pad = light.maxReach + 5;
    const gx = Math.floor((v.centerX - v.width / v.scale / 2 - pad) / step);
    const gy = Math.floor((v.centerY - v.height / v.scale / 2 - pad) / step);
    const width = Math.ceil((v.centerX + v.width / v.scale / 2 + pad) / step) - gx;
    const height = Math.ceil((v.centerY + v.height / v.scale / 2 + pad) / step) - gy;
    const count = width * height;
    const field = { gx, gy, width, height, step, top: new Float32Array(count), bottom: new Float32Array(count),
      surface: new Uint8Array(count), shadow: new Uint8Array(count), light,
      stats: { shadowSolver: 'height-intervals-v1', shadowCasterCount: 0, heightFromDataCount: 0,
        heightEstimatedCount: 0, shadowHeightCappedCount: 0, shadowPixels: [0, 0, 0, 0, 0] } };
    for (const water of scene.water) {
      const polygons = water.type === 3 ? water.polygons : linePolygons(water.geometry, G.kind(water) === 'river' ? 10 : 3).map(p => [p]);
      for (const poly of polygons) raster(field, poly, i => { field.surface[i] = material.water; });
    }
    // Surface roads paint over water; bridge decks receive a separate height below.
    for (const road of scene.roads.filter(r => r.props.brunnel !== 'tunnel')) {
      for (const poly of linePolygons(road.geometry, road.width)) raster(field, [poly], i => { field.surface[i] = material.ground; });
    }
    function addInfo(object, type) {
      const info = heightInfo(scene, object, type, light);
      field.stats.shadowCasterCount++;
      field.stats[info.source === 'estimated' ? 'heightEstimatedCount' : 'heightFromDataCount']++;
      if (info.capped) field.stats.shadowHeightCappedCount++;
      return info;
    }
    function solid(i, top, bottom, surface) {
      if (top >= field.top[i]) { field.top[i] = top; field.bottom[i] = bottom; field.surface[i] = surface; }
    }
    for (const bridge of scene.roads.filter(r => r.props.brunnel === 'bridge')) {
      const info = addInfo(bridge, 'bridge'), thickness = Math.min(info.world * .3, .8 / info.units);
      for (const poly of linePolygons(bridge.geometry, bridge.width)) raster(field, [poly], i => solid(i, info.world,
        Math.max(.1, info.world - thickness), material.bridge));
    }
    for (const tree of scene.trees) {
      const info = addInfo(tree, 'canopy');
      const ring = crownPoints(tree.x, tree.y, tree.radius, tree.seed);
      raster(field, [ring], (i, x, y) => {
        const dome = Math.sqrt(Math.max(0, 1 - ((x - tree.x) ** 2 + (y - tree.y) ** 2) / tree.radius ** 2));
        solid(i, info.world * (.58 + .42 * dome), info.world * (.58 - .3 * dome), material.canopy);
      });
    }
    for (const roof of scene.buildings) {
      const info = addInfo(roof, 'roof');
      raster(field, roof.polygon, (i, x, y) => solid(i, roofHeight(roof, x, y, info), 0, material.roof));
    }
    cast(field);
    return field;
  }

  function cast(field) {
    const { width, height, gx, gy, step, light, top, bottom, shadow, surface } = field;
    const [dx, dy] = light.direction, vertical = Math.abs(dy) >= Math.abs(dx);
    const major = vertical ? dy : dx, minor = vertical ? dx : dy, sign = Math.sign(major) || 1;
    const ratio = minor / major, rise = Math.tan(light.altitude) * step / Math.abs(major);
    const start = vertical ? gy : gx, rows = vertical ? height : width;
    const crossStart = vertical ? gx : gy, columns = vertical ? width : height;
    const rays = new Map();
    for (let row = 0; row < rows; row++) {
      const worldRow = start + (sign > 0 ? row : rows - 1 - row);
      const shift = Math.floor(worldRow * ratio), z = worldRow * sign * rise;
      for (let col = 0; col < columns; col++) {
        const cross = crossStart + col, key = cross - shift;
        const i = vertical ? (worldRow - gy) * width + col : col * width + worldRow - gx;
        let intervals = rays.get(key);
        if (!intervals) { intervals = []; rays.set(key, intervals); }
        // Each interval is a vertical slice of actual opaque matter. A raised
        // bridge is a thin slab, so it can cast a detached shadow across water.
        let keep = 0, occluded = false;
        const receiver = z + top[i] + .22 * step;
        for (let n = 0; n < intervals.length; n += 2) {
          const lo = intervals[n], hi = intervals[n + 1];
          if (hi < z) continue;
          if (lo <= receiver && hi > receiver) occluded = true;
          intervals[keep++] = lo; intervals[keep++] = hi;
        }
        intervals.length = keep;
        if (occluded) { shadow[i] = 1; field.stats.shadowPixels[surface[i]]++; }
        if (!top[i]) continue;
        // A cell occupies a full scan step. Keeping its near/far extent avoids
        // sampling completely through a thin raised slab at a high sun angle.
        let lo = z + bottom[i] - rise * .5, hi = z + top[i] + rise * .5;
        keep = 0;
        for (let n = 0; n < intervals.length; n += 2) {
          if (intervals[n] <= hi && intervals[n + 1] >= lo) {
            lo = Math.min(lo, intervals[n]); hi = Math.max(hi, intervals[n + 1]);
          } else { intervals[keep++] = intervals[n]; intervals[keep++] = intervals[n + 1]; }
        }
        intervals.length = keep; intervals.push(lo, hi);
      }
    }
  }
  function sample(field, x, y) {
    const px = Math.floor(x / field.step) - field.gx, py = Math.floor(y / field.step) - field.gy;
    if (px < 0 || py < 0 || px >= field.width || py >= field.height) return null;
    const i = py * field.width + px;
    return { height: field.top[i], bottom: field.bottom[i], material: field.surface[i], shadow: !!field.shadow[i] };
  }
  function rgba(field) {
    const { width, height, gx, gy, shadow, surface } = field;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!shadow[i] && !shadow[i - 1] && !shadow[i + 1] && !shadow[i - width] && !shadow[i + width] &&
        !shadow[i - width - 1] && !shadow[i - width + 1] && !shadow[i + width - 1] && !shadow[i + width + 1]) continue;
      const color = pigments[surface[i]], j = i * 4;
      // Edge coverage and a broad, world-fixed pigment variation soften the
      // computed silhouette without piling alpha up under overlapping casters.
      const neighbor = n => surface[n] === surface[i] && Math.abs(field.top[n] - field.top[i]) < 2 ? shadow[n] : shadow[i];
      const coverage = (4 * shadow[i] + 2 * (neighbor(i - 1) + neighbor(i + 1) + neighbor(i - width) + neighbor(i + width)) +
        neighbor(i - width - 1) + neighbor(i - width + 1) + neighbor(i + width - 1) + neighbor(i + width + 1)) / 16;
      const wave = .88 + .12 * Math.sin((gx + x) / 8 + Math.sin((gy + y) / 13));
      pixels[j] = color[0]; pixels[j + 1] = color[1]; pixels[j + 2] = color[2];
      pixels[j + 3] = Math.round(color[3] * coverage * wave);
    }
    return pixels;
  }
  function paint(ctx, scene, crownPoints) {
    let entry = cache.get(scene);
    if (!entry) {
      const field = build(scene, crownPoints), pixels = rgba(field);
      const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(field.width, field.height) :
        global.document?.createElement('canvas');
      if (canvas) {
        canvas.width = field.width; canvas.height = field.height;
        const mask = canvas.getContext('2d'), data = mask.createImageData(field.width, field.height);
        data.data.set(pixels); mask.putImageData(data, 0, 0);
      }
      entry = { field, pixels, canvas }; cache.set(scene, entry);
    }
    const { field, pixels, canvas } = entry, v = scene.viewport;
    const x = (field.gx * field.step - v.centerX) * v.scale + v.width / 2;
    const y = (field.gy * field.step - v.centerY) * v.scale + v.height / 2;
    ctx.save();ctx.globalAlpha = 1;
    if (canvas) { ctx.imageSmoothingEnabled = true; ctx.drawImage(canvas, x, y, field.width * field.step * v.scale, field.height * field.step * v.scale); }
    else {
      // Node paint-contract tests use a recording context instead of a browser.
      for (let row = 0; row < field.height; row++) for (let col = 0; col < field.width; col++) {
        const i = (row * field.width + col) * 4;
        if (!pixels[i + 3]) continue;
        ctx.fillStyle = `rgba(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]},${pixels[i + 3] / 255})`;
        ctx.fillRect(x + col * field.step * v.scale, y + row * field.step * v.scale, field.step * v.scale, field.step * v.scale);
      }
    }
    ctx.restore();
    return { ...field.stats, shadowLightDirection: lighting.direction, shadowSunAltitude: lighting.altitude * 180 / Math.PI };
  }
  global.PixelMapIllustratedShadows = Object.freeze({ lighting, material, meters, metersPerWorld,
    heightInfo, roofHeight, build, sample, paint });
})(typeof window !== 'undefined' ? window : globalThis);
