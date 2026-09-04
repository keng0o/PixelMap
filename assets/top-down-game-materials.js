((global) => {
  'use strict';

  const version = 'pixelmap-top-down-materials/1';

  function freeze(value) {
    if (Array.isArray(value)) return Object.freeze(value.map(freeze));
    if (value && typeof value === 'object') {
      return Object.freeze(Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, freeze(item)]),
      ));
    }
    return value;
  }

  const catalog = freeze({
    'building-blue-gable-01': {
      family: 'building',
      nativeSize: [50, 32],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 584, y: 702, width: 50, height: 32 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(24% 22%, 94% 4%, 100% 36%, 86% 62%, 38% 76%, 24% 52%)',
      fitBounds: { minX: 12, minY: 2, maxX: 50, maxY: 25 },
      palette: {
        ink: '#203642',
        inkSoft: '#355466',
        shade: '#587596',
        shadeDark: '#3f5b76',
        light: '#568fb8',
        highlight: '#7cabc2',
        shadow: '#28413e',
      },
      silhouette: [[12, 8], [46, 2], [50, 11], [43, 20], [19, 25], [12, 17]],
      facets: [
        { role: 'shade', points: [[12, 8], [46, 2], [49, 8], [14, 15]] },
        { role: 'light', points: [[14, 14], [49, 7], [50, 11], [43, 20], [19, 25], [12, 17]] },
      ],
      shadowHalf: 'lower-right',
      inkSegments: [
        { axis: 'longest-edge', from: [14, 14], to: [48, 7], width: 2.1, role: 'ridge' },
        { axis: 'longest-edge', from: [19, 10], to: [38, 6], width: 1.05, role: 'shade-seam' },
        { axis: 'longest-edge', from: [18, 18], to: [31, 15], width: 1.1, role: 'light-seam' },
        { axis: 'longest-edge', from: [34, 13], to: [45, 11], width: 1.15, role: 'light-seam' },
        { axis: 'longest-edge', from: [27, 13], to: [34, 11.5], width: 2.1, role: 'weather-mark' },
        { axis: 'longest-edge', from: [21, 22], to: [28, 20.5], width: .85, role: 'highlight' },
      ],
    },
    'tree-round-crown-01': {
      family: 'tree',
      nativeSize: [48, 48],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 590, y: 110, width: 48, height: 48 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(50% 29%, 65% 31%, 77% 42%, 81% 56%, 75% 71%, 65% 81%, 50% 85%, 38% 79%, 31% 69%, 31% 56%, 37% 42%)',
      center: [24, 29],
      outline: [[24, 14], [31, 15], [36, 19], [38, 24], [37, 28], [38, 32], [35, 36],
        [31, 39], [27, 38], [24, 41], [19, 38], [16, 34], [15, 29], [17, 24], [18, 20]],
      palette: {
        ink: '#263a35',
        shadow: '#2a4534',
        dark: '#304b35',
        main: '#456745',
        light: '#708d5b',
        highlight: '#93aa6c',
        detailDark: '#3f5f40',
      },
      crowns: [
        { role: 'shadow', x: 19, y: 31, rx: 8, ry: 8, seed: 11 },
        { role: 'shadow', x: 28, y: 31, rx: 8, ry: 7, seed: 12 },
        { role: 'dark', x: 18, y: 24, rx: 7, ry: 7, seed: 21 },
        { role: 'dark', x: 25, y: 22, rx: 8, ry: 7, seed: 22 },
        { role: 'dark', x: 31, y: 27, rx: 6, ry: 7, seed: 23 },
        { role: 'main', x: 20, y: 29, rx: 9, ry: 9, seed: 31 },
        { role: 'main', x: 28, y: 29, rx: 9, ry: 9, seed: 32 },
        { role: 'main', x: 23, y: 24, rx: 8, ry: 7, seed: 33 },
        { role: 'highlight', x: 21, y: 23, rx: 5, ry: 4, seed: 41 },
        { role: 'highlight', x: 28, y: 25, rx: 4, ry: 5, seed: 42 },
        { role: 'highlight', x: 20, y: 31, rx: 4, ry: 4, seed: 43 },
        { role: 'highlight', x: 28, y: 32, rx: 3, ry: 3, seed: 44 },
        { role: 'detail', x: 24, y: 28, rx: 3, ry: 3, seed: 45 },
        { role: 'detail', x: 31, y: 29, rx: 2, ry: 3, seed: 46 },
      ],
      inkMarks: [
        [[14, 18], [18, 16]], [[29, 17], [33, 20]], [[13, 29], [17, 32]],
        [[30, 34], [34, 31]], [[22, 25], [25, 23]], [[20, 35], [23, 36]],
      ],
    },
  });

  function hashString(value) {
    const string = String(value ?? '');
    let hash = 0x811c9dc5;
    for (let index = 0; index < string.length; index += 1) {
      hash ^= string.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function unit(seed, salt = 0) {
    return (hashString(`${seed}:${salt}`) & 0xffff) / 0xffff;
  }

  function tracePolygon(ctx, points, mapper = point => point) {
    if (!points.length) return;
    const first = mapper(points[0]);
    ctx.beginPath();
    ctx.moveTo(first[0], first[1]);
    for (let index = 1; index < points.length; index += 1) {
      const point = mapper(points[index]);
      ctx.lineTo(point[0], point[1]);
    }
    ctx.closePath();
  }

  function traceBlob(ctx, crown, mapper, seedOffset = 0) {
    const points = [];
    const lobes = 10;
    for (let index = 0; index < lobes; index += 1) {
      const angle = Math.PI * 2 * index / lobes;
      const wobble = .78 + unit(crown.seed + seedOffset, index + 1) * .28;
      points.push(mapper([
        crown.x + Math.cos(angle) * crown.rx * wobble,
        crown.y + Math.sin(angle) * crown.ry * wobble,
      ]));
    }
    ctx.beginPath();
    const last = points.at(-1);
    ctx.moveTo((points[0][0] + last[0]) / 2, (points[0][1] + last[1]) / 2);
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const next = points[(index + 1) % points.length];
      ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
    }
    ctx.closePath();
  }

  function paintBuilding(ctx, asset, mapper, seed = 0) {
    const palette = asset.palette;
    const shadowMapper = point => {
      const mapped = mapper(point);
      const origin = mapper([0, 0]);
      const diagonal = mapper([1.8, 1.8]);
      return [mapped[0] + diagonal[0] - origin[0], mapped[1] + diagonal[1] - origin[1]];
    };
    tracePolygon(ctx, asset.silhouette, shadowMapper);
    ctx.fillStyle = palette.shadow;
    ctx.globalAlpha = .58;
    ctx.fill();
    ctx.globalAlpha = 1;

    tracePolygon(ctx, asset.silhouette, mapper);
    ctx.fillStyle = palette.shade;
    ctx.fill();
    for (const facet of asset.facets) {
      tracePolygon(ctx, facet.points, mapper);
      ctx.fillStyle = facet.role === 'light' ? palette.light : palette.shade;
      ctx.fill();
    }

    tracePolygon(ctx, asset.silhouette, mapper);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = .45;
    ctx.translate((unit(seed, 1) - .5) * .65, (unit(seed, 2) - .5) * .65);
    tracePolygon(ctx, asset.silhouette, mapper);
    ctx.strokeStyle = palette.inkSoft;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (let index = 0; index < asset.inkSegments.length; index += 1) {
      const segment = asset.inkSegments[index];
      const from = mapper(segment.from);
      const to = mapper(segment.to);
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.strokeStyle = segment.role === 'highlight' ? palette.highlight :
        segment.role === 'weather-mark' ? palette.ink : palette.shadeDark;
      ctx.lineWidth = segment.width;
      ctx.lineCap = 'round';
      ctx.globalAlpha = segment.role === 'highlight' ? .82 : .9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function paintTree(ctx, asset, mapper, seed = 0) {
    const palette = asset.palette;
    const colors = {
      shadow: palette.shadow,
      dark: palette.dark,
      main: palette.main,
      highlight: palette.light,
      detail: palette.detailDark,
    };
    tracePolygon(ctx, asset.outline, mapper);
    ctx.fillStyle = palette.shadow;
    ctx.fill();
    ctx.save();
    tracePolygon(ctx, asset.outline, mapper);
    ctx.clip();
    for (const crown of asset.crowns) {
      traceBlob(ctx, crown, mapper, seed);
      ctx.fillStyle = colors[crown.role];
      ctx.globalAlpha = crown.role === 'shadow' ? .82 : crown.role === 'highlight' ? .9 : 1;
      ctx.fill();
      if (crown.role === 'dark' || crown.role === 'main') {
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = crown.role === 'main' ? 1.15 : .8;
        ctx.globalAlpha = .74;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = .9;
    ctx.lineCap = 'round';
    for (const mark of asset.inkMarks) {
      const from = mapper(mark[0]);
      const to = mapper(mark[1]);
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
    }
    const glint = mapper([18.5, 20]);
    const glintRadius = Math.max(.65, Math.hypot(...mapper([1, 0]).map((value, index) => value - mapper([0, 0])[index])) * 1.1);
    ctx.fillStyle = palette.highlight;
    ctx.globalAlpha = .65;
    ctx.beginPath();
    ctx.arc(glint[0], glint[1], glintRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    tracePolygon(ctx, asset.outline, mapper);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.globalAlpha = .88;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function paintAsset(ctx, assetId, { x = 0, y = 0, scale = 1, seed = 0 } = {}) {
    const asset = catalog[assetId];
    if (!asset) return false;
    ctx.save();
    const mapper = point => [x + point[0] * scale, y + point[1] * scale];
    if (asset.family === 'building') paintBuilding(ctx, asset, mapper, seed);
    else paintTree(ctx, asset, mapper, seed);
    ctx.restore();
    return true;
  }

  function paintRoofInFrame(ctx, assetId, frame, { seed = 0 } = {}) {
    const asset = catalog[assetId];
    if (!asset || asset.family !== 'building' || !frame) return false;
    const bounds = asset.fitBounds;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const mapper = point => {
      const along = ((point[0] - bounds.minX) / width * 2 - 1) * frame.halfU;
      const across = ((point[1] - bounds.minY) / height * 2 - 1) * frame.halfV;
      return [
        frame.center[0] + frame.u[0] * along + frame.v[0] * across,
        frame.center[1] + frame.u[1] * along + frame.v[1] * across,
      ];
    };
    ctx.save();
    paintBuilding(ctx, asset, mapper, seed);
    ctx.restore();
    return true;
  }

  function paintTreeAt(ctx, assetId, { x = 0, y = 0, radius = 18, seed = 0 } = {}) {
    const asset = catalog[assetId];
    if (!asset || asset.family !== 'tree') return false;
    const scale = radius / 18;
    const mapper = point => [x + (point[0] - asset.center[0]) * scale, y + (point[1] - asset.center[1]) * scale];
    ctx.save();
    paintTree(ctx, asset, mapper, seed);
    ctx.restore();
    return true;
  }

  global.PixelMapTopDownMaterials = Object.freeze({
    version, catalog, paintAsset, paintRoofInFrame, paintTreeAt,
  });
})(typeof window !== 'undefined' ? window : globalThis);
