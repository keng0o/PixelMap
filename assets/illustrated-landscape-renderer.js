((global) => {
  'use strict';
  const G = global.PixelMapIllustratedGeometry;
  // Avalanche the hash so neighbouring stroke salts do not produce clustered leaves.
  function random(seed, salt = 0) {
    let n = G.hash(`${seed}:${salt}`);
    n = Math.imul(n ^ n >>> 16, 0x7feb352d);
    n = Math.imul(n ^ n >>> 15, 0x846ca68b);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  }
  const palette = Object.freeze({ ground: '#e1e2be', residential: '#e5e2c2', grass: '#d5ddb1',
    park: '#cfdaad', forest: '#93ae80', forestEdge: '#738d67', field: '#daddb0', fieldLine: '#929e70',
    soil: '#dfd5b5', plaza: '#e5dec5', road: '#efead2', roadEdge: '#96967b', path: '#e8e3c5',
    rail: '#6f7567', water: '#b6ccca', waterEdge: '#485e55', ripple: '#738f88',
    ink: '#4a4c38', roofInk: '#473c2b', roof: '#cd8766', roofLight: '#e1a07c', roofDark: '#b47156',
    roofShadow: '#b7b597', roofSeam: '#95684c', tree: '#89a97b', treeLight: '#a6bf8e',
    treeDark: '#789b72', treeDeep: '#526f51', treeInk: '#3e5539', treeShadow: '#adb594' });
  function project(scene, [x, y]) {
    const v = scene.viewport;
    // A subpixel grid prevents tiny floating point changes from changing pen sampling
    // when the same geographic edge moves by an integer number of screen pixels.
    return [Math.round(((x - v.centerX) * v.scale + v.width / 2) * 256) / 256,
      Math.round(((y - v.centerY) * v.scale + v.height / 2) * 256) / 256];
  }
  function trace(ctx, scene, paths, close = true, offset = [0, 0]) {
    ctx.beginPath();
    for (const path of paths) {
      path.forEach((p, i) => {
        const [x, y] = project(scene, p);
        if (i) ctx.lineTo(x + offset[0], y + offset[1]); else ctx.moveTo(x + offset[0], y + offset[1]);
      });
      if (close) ctx.closePath();
    }
  }
  function polygon(ctx, points, fill, stroke, width = .7) {
    if (!points.length) return;
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function line(ctx, points, color, width = .7) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  // The pen is seeded by the object, never by its screen position. Corners stay fixed;
  // a bounded wobble and changing pressure affect only the drawing between them.
  function penPoints(points, seed, amplitude = .35, spacing = 3) {
    const result = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], dx = b[0] - a[0], dy = b[1] - a[1];
      const length = Math.hypot(dx, dy);
      if (!length) continue;
      const count = Math.max(1, Math.ceil(length / spacing));
      const phase = random(seed, i) * Math.PI * 2;
      if (!result.length) result.push(a);
      for (let j = 1; j <= count; j++) {
        const t = j / count;
        const n = Math.sin(t * Math.PI) * amplitude *
          (.62 * Math.sin(t * length / 5 + phase) + .38 * Math.sin(t * length / 2.3 + phase * 2));
        result.push([a[0] + dx * t - dy / length * n, a[1] + dy * t + dx / length * n]);
      }
    }
    return result;
  }
  function penLine(ctx, points, color, width, seed, amplitude = .35, scale = 1) {
    const pts = penPoints(points, seed, amplitude * scale, 3 * scale);
    line(ctx, pts, color, width * .83);
    // Batch pressure accents into one path; hundreds of roofs must remain cheap to pan.
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i += 5) {
      if (random(seed, i + 71) < .55) continue;
      pts.slice(i, i + 6).forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    }
    ctx.strokeStyle = color; ctx.lineWidth = width * 1.15; ctx.stroke();
  }
  function featureInk(ctx, scene, paths, color, width, amplitude = .35) {
    for (const path of paths) {
      const seed = G.hash(path.slice(0, 2).flat().map(n => n.toFixed(3)).join(':'));
      penLine(ctx, path.map(p => project(scene, p)), color, width, seed, amplitude, scene.viewport.scale);
    }
  }
  function fillFeature(ctx, scene, feature, color, stroke = null, width = .6) {
    for (const poly of feature.polygons || []) {
      trace(ctx, scene, poly);
      ctx.fillStyle = color; ctx.fill('evenodd');
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    }
  }
  const landColor = feature => {
    const kind = G.kind(feature);
    if (G.isForest(kind)) return palette.forest;
    if (['farmland', 'farm', 'orchard', 'vineyard'].includes(kind)) return palette.field;
    if (feature.layer === 'park' || ['park', 'garden', 'recreation_ground'].includes(kind)) return palette.park;
    if (['grass', 'meadow', 'scrub'].includes(kind)) return palette.grass;
    if (['industrial', 'commercial', 'retail', 'school', 'hospital', 'cemetery'].includes(kind)) return palette.plaza;
    if (['sand', 'bare_rock', 'construction', 'brownfield'].includes(kind)) return palette.soil;
    if (kind === 'residential') return palette.residential;
    return palette.ground;
  };

  function drawGround(ctx, scene) {
    ctx.fillStyle = palette.ground; ctx.fillRect(0, 0, scene.viewport.width, scene.viewport.height);
    const order = f => ['farmland', 'farm', 'orchard', 'vineyard'].includes(G.kind(f)) ? 5 :
      G.isForest(G.kind(f)) ? 4 : f.layer === 'park' ? 3 : ['grass', 'meadow'].includes(G.kind(f)) ? 2 : 1;
    for (const f of [...scene.land].sort((a, b) => order(a) - order(b))) {
      // The woodland silhouette belongs to the overlapping crowns, not the straight MVT boundary.
      if (G.isForest(G.kind(f))) continue;
      fillFeature(ctx, scene, f, landColor(f));
      if (['farmland', 'farm', 'orchard', 'vineyard'].includes(G.kind(f))) {
        for (const poly of f.polygons) {
          ctx.save(); trace(ctx, scene, poly); ctx.clip('evenodd');
          const frame = G.frame(poly);
          if (frame) for (let y = Math.ceil(frame.top / 6) * 6; y < frame.bottom; y += 6) {
            const seed = G.hash(`crop:${frame.point(frame.left, y)}`);
            const row = [project(scene, frame.point(frame.left, y)), project(scene, frame.point(frame.right, y))];
            penLine(ctx, row, '#8b9668', .75, seed, .55, scene.viewport.scale);
            for (let x = frame.left + 2; x < frame.right; x += 4) {
              if (random(seed, Math.floor(x * 10)) < .23) continue;
              const p = project(scene, frame.point(x, y));
              const q = project(scene, frame.point(x + .7, y - 1.5 - random(seed, x) * 1.5));
              line(ctx, [p, q], '#647750', .75);
            }
          }
          ctx.restore();
        }
      }
    }
    // Sparse ink stipples describe the open ground; roads, water and roofs cover them later.
    const groundBounds = scene.bounds;
    for (let gy = Math.floor(groundBounds.top / 16); gy < groundBounds.bottom / 16; gy++) {
      for (let gx = Math.floor(groundBounds.left / 16); gx < groundBounds.right / 16; gx++) {
        const seed = G.hash(`earth:${gx}:${gy}`);
        if (random(seed) > .3) continue;
        const [x, y] = project(scene, [(gx + random(seed, 1)) * 16, (gy + random(seed, 2)) * 16]);
        const s = scene.viewport.scale;
        line(ctx, [[x, y], [x + (1 + random(seed, 3)) * s, y - .4 * s]], '#a0a07c', .5);
        if (random(seed, 4) > .5) {
          line(ctx, [[x - 2 * s, y + s], [x - 1.5 * s, y + .7 * s]], '#8c9169', .65);
        }
      }
    }
    // Botanical marks on known grass only. Their world phase survives pan and tile loading.
    for (const f of scene.land.filter(f => ['grass', 'meadow', 'park'].includes(G.kind(f)) || f.layer === 'park')) {
      const b = { left: Math.max(f.bounds.left, scene.bounds.left), right: Math.min(f.bounds.right, scene.bounds.right),
        top: Math.max(f.bounds.top, scene.bounds.top), bottom: Math.min(f.bounds.bottom, scene.bounds.bottom) };
      for (let gy = Math.floor(b.top / 19); gy < b.bottom / 19; gy++) for (let gx = Math.floor(b.left / 19); gx < b.right / 19; gx++) {
        const seed = G.hash(`grass:${gx}:${gy}`);
        if (random(seed) > .52) continue;
        const p = [(gx + random(seed, 1)) * 19, (gy + random(seed, 2)) * 19];
        if (!G.containsDisc(p, 4, f.polygons)) continue;
        const [x, y] = project(scene, p), s = Math.min(1.2, scene.viewport.scale);
        line(ctx, [[x - 2 * s, y], [x - 3 * s, y - 2 * s]], '#90976a', .55);
        line(ctx, [[x, y], [x + .3 * s, y - 2.8 * s]], '#90976a', .55);
        line(ctx, [[x + s, y], [x + 2 * s, y - 2 * s]], '#90976a', .5);
        if (random(seed, 8) > .5) line(ctx, [[x + 4 * s, y + s], [x + 5 * s, y + .5 * s]], '#949471', .65);
      }
    }
  }

  function drawWater(ctx, scene) {
    // River polygons cover the duplicate MVT centerlines; uncovered streams remain visible.
    for (const f of [...scene.water].sort((a, b) => a.type - b.type)) {
      if (f.type === 3) {
        fillFeature(ctx, scene, f, palette.water);
        featureInk(ctx, scene, f.polygons.flat(), palette.waterEdge, 1.05, .45);
        // Short offset bank strokes are clipped to the water, never a river centerline.
        ctx.save(); trace(ctx, scene, f.polygons.flat()); ctx.clip('evenodd');
        for (const poly of f.polygons) for (const path of poly) for (let i = 1; i < path.length; i++) {
          const a = path[i - 1], b = path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (length < 6) continue;
          const ux = (b[0] - a[0]) / length, uy = (b[1] - a[1]) / length;
          const seed = G.hash(`bank:${a}`);
          for (let d = 3 + random(seed) * 5; d < length - 3; d += 15) for (const side of [-1, 1]) {
            const pts = [d, Math.min(d + 8 + random(seed, d) * 5, length - 2)].map(t =>
              project(scene, [a[0] + ux * t - uy * 2.6 * side, a[1] + uy * t + ux * 2.6 * side]));
            penLine(ctx, pts, '#80978c', .5, seed, .3, scene.viewport.scale);
          }
        }
        ctx.restore();
      }
      else {
        trace(ctx, scene, f.geometry, false); ctx.strokeStyle = palette.waterEdge;
        ctx.lineWidth = (G.kind(f) === 'river' ? 10 : 3) * scene.viewport.scale + 1; ctx.stroke();
        ctx.strokeStyle = palette.water; ctx.lineWidth -= 1.2; ctx.stroke();
      }
    }
    const waterAreas = scene.water.filter(f => f.type === 3);
    const b = scene.bounds;
    for (let gy = Math.floor(b.top / 27); gy < b.bottom / 27; gy++) for (let gx = Math.floor(b.left / 27); gx < b.right / 27; gx++) {
      const seed = G.hash(`water:${gx}:${gy}`);
      const p = [(gx + random(seed, 1)) * 27, (gy + random(seed, 2)) * 27];
      // Broad quiet patches alternate with small current clusters, all fixed to the world.
      const drift = Math.sin(p[0] / 71 + Math.sin(p[1] / 97)) * Math.cos(p[1] / 53);
      if (random(seed) > .28 + Math.max(0, drift) * .5) continue;
      const half = 2 + random(seed, 4) * 8, bend = .5 + random(seed, 5) * 2;
      const angle = -.7 + random(seed, 6) * 1.1;
      if (!waterAreas.some(f => G.containsDisc(p, half + 4, f.polygons))) continue;
      const [x, y] = project(scene, p), s = scene.viewport.scale;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(-half * s, bend * s);
      ctx.bezierCurveTo(-half * .4 * s, -bend * s, half * .3 * s, bend * s, half * s, -bend * s);
      ctx.strokeStyle = random(seed, 7) > .6 ? '#66847d' : '#8ca39b';
      ctx.lineWidth = .4 + random(seed, 8) * .3; ctx.stroke();
      if (random(seed, 3) > .57) {
        ctx.beginPath(); ctx.moveTo(-half * .6 * s, 3 * s);
        ctx.quadraticCurveTo(0, 2 * s, half * .4 * s, 2.5 * s);
        ctx.strokeStyle = '#d2ded3'; ctx.lineWidth = .75; ctx.stroke();
      }
      ctx.restore();
    }
  }

  function roadPass(ctx, scene, roads, edge) {
    for (const f of roads) {
      const width = f.width * scene.viewport.scale;
      trace(ctx, scene, f.geometry, false);
      ctx.strokeStyle = edge ? palette.roadEdge : (width < 4 ? palette.path : palette.road);
      ctx.lineWidth = width + (edge ? 1.2 : 0); ctx.stroke();
      if (edge) for (const path of f.geometry) for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!length) continue;
        // A visible MVT line feature may contain kilometres of offscreen segments.
        // Cull detail per segment while retaining the source road and its base stroke.
        if (!G.overlaps({left:Math.min(a[0],b[0]),right:Math.max(a[0],b[0]),
          top:Math.min(a[1],b[1]),bottom:Math.max(a[1],b[1])}, scene.bounds, f.width)) continue;
        const nx = -(b[1] - a[1]) / length, ny = (b[0] - a[0]) / length;
        const seed = G.hash(`verge:${a}:${b}`);
        for (const side of [-1, 1]) {
          const offset = (f.width / 2 + .25) * side;
          const pts = [a, b].map(p => project(scene, [p[0] + nx * offset, p[1] + ny * offset]));
          penLine(ctx, pts, '#7e8063', .65, seed, .45, scene.viewport.scale);
        }
      }
    }
  }
  function drawRails(ctx, scene, roads) {
    for (const f of roads) {
      trace(ctx, scene, f.geometry, false); ctx.strokeStyle = '#c9cbb2';
      ctx.lineWidth = Math.max(3, f.width * scene.viewport.scale); ctx.stroke();
      ctx.strokeStyle = palette.rail; ctx.lineWidth = 2.1; ctx.stroke();
      ctx.strokeStyle = '#e2dfc4'; ctx.lineWidth = .9; ctx.stroke();
      // Cross ties are anchored along geographic line distance, never a screen-space dash.
      for (const path of f.geometry) {
        let distance = 0;
        for (let i = 1; i < path.length; i++) {
          const a = path[i - 1], p = path[i], length = Math.hypot(p[0] - a[0], p[1] - a[1]);
          if (!length) continue;
          const ux = (p[0] - a[0]) / length, uy = (p[1] - a[1]) / length;
          for (let d = Math.ceil(distance / 7) * 7; d < distance + length; d += 7) {
            const q = [a[0] + ux * (d - distance), a[1] + uy * (d - distance)];
            const [x, y] = project(scene, q);
            line(ctx, [[x + uy * 1.8, y - ux * 1.8], [x - uy * 1.8, y + ux * 1.8]], palette.rail, .6);
          }
          distance += length;
        }
      }
    }
  }
  function drawRoads(ctx, scene) {
    const rail = f => ['rail', 'transit'].includes(G.kind(f));
    const bridges = scene.roads.filter(f => f.props.brunnel === 'bridge');
    const ground = scene.roads.filter(f => f.props.brunnel !== 'bridge' && f.props.brunnel !== 'tunnel');
    // All edges before all fills: joins stay open, even across separate road features.
    roadPass(ctx, scene, ground.filter(f => !rail(f)), true);
    roadPass(ctx, scene, ground.filter(f => !rail(f)), false);
    drawRails(ctx, scene, ground.filter(rail));
    roadPass(ctx, scene, bridges.filter(f => !rail(f)), true);
    roadPass(ctx, scene, bridges.filter(f => !rail(f)), false);
    drawRails(ctx, scene, bridges.filter(rail));
  }

  function crownPoints(x, y, r, seed) {
    const n = 60, phase = random(seed, 3) * Math.PI * 2;
    return Array.from({ length: n }, (_, i) => {
      const a = i / n * Math.PI * 2;
      const radius = r * (.9 + .065 * Math.sin(a * 11 + phase) + .047 * Math.sin(a * 7 + phase * 2) + .05 * Math.sin(a * 3 + phase));
      return [x + Math.cos(a) * radius, y + Math.sin(a) * radius * (.89 + random(seed, 4) * .13)];
    });
  }
  function drawTree(ctx, scene, tree) {
    const [tx, ty] = project(scene, [tree.x, tree.y]), x = 0, y = 0, r = tree.radius * scene.viewport.scale;
    // Build the same local pen path on every frame, then translate it. This also avoids
    // floating point resampling changes when a crown crosses a screen coordinate.
    ctx.save(); ctx.translate(tx, ty);
    const pts = crownPoints(x, y, r, tree.seed);
    const base = ['#89a97b', '#91ad80', '#83a47a', '#9ab587'][tree.seed % 4];
    polygon(ctx, pts.map(([px, py]) => [px + 1.3 * scene.viewport.scale, py + 1.7 * scene.viewport.scale]), palette.treeShadow);
    polygon(ctx, pts, base);
    ctx.save(); polygon(ctx, pts); ctx.clip();
    // Three broad botanical masses; no glossy concentric highlight rings.
    polygon(ctx, crownPoints(x + r * .28, y + r * .37, r * .78, tree.seed + 70), palette.treeDark);
    polygon(ctx, crownPoints(x - r * .28, y - r * .24, r * .65, tree.seed + 31), '#9fb98c');
    polygon(ctx, crownPoints(x + r * .05, y + r * .02, r * .45, tree.seed + 54), base);
    if (r > 4) {
      const count = Math.min(25, Math.floor(tree.radius * 1.8));
      for (let j = 0; j < count; j++) {
        const a = random(tree.seed, 20 + j) * Math.PI * 2;
        const d = r * (.14 + Math.sqrt(random(tree.seed, 80 + j)) * .68);
        const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
        const s = scene.viewport.scale * (.65 + random(tree.seed, j + 100) * .7);
        ctx.beginPath(); ctx.moveTo(cx - 1.5 * s, cy + .8 * s);
        ctx.quadraticCurveTo(cx - 2 * s, cy - 1.7 * s, cx - .2 * s, cy - 1.2 * s);
        ctx.quadraticCurveTo(cx + .2 * s, cy - 2.2 * s, cx + 1.2 * s, cy - .9 * s);
        ctx.strokeStyle = j % 4 === 0 ? '#527249' : '#47643f';
        ctx.lineWidth = j % 3 === 0 ? .65 : .48; ctx.stroke();
        if (j % 3 === 1) line(ctx, [[cx + s, cy + 1.5 * s], [cx + 1.5 * s, cy + 1.7 * s]], '#47643f', .7);
      }
    }
    ctx.restore();
    penLine(ctx, [...pts, pts[0]], tree.edge ? palette.treeInk : '#4d6945', tree.edge ? 1.05 : .8,
      tree.seed, .12, scene.viewport.scale);
    ctx.restore();
  }

  function panelRoof(ctx, scene, roof, panel) {
    let [left, top, right, bottom] = panel;
    const f = roof.frame;
    const vertical = bottom - top > right - left;
    const point = (u, v) => project(scene, f.point(vertical ? left + v * (right - left) : left + u * (right - left),
      vertical ? top + u * (bottom - top) : top + v * (bottom - top)));
    const short = Math.min(right - left, bottom - top) * scene.viewport.scale;
    const long = Math.max(right - left, bottom - top) * scene.viewport.scale;
    if (short < 3.7 || long < 6) return;
    if (roof.style === 'flat') {
      polygon(ctx, [point(0,0),point(1,0),point(1,1),point(0,1)], '#c19b7d');
      const rim = Math.min(.14, 2.3 / short);
      const insetPoints = [point(rim,rim),point(1-rim,rim),point(1-rim,1-rim),point(rim,1-rim),point(rim,rim)];
      polygon(ctx, insetPoints, '#d2af8e');
      penLine(ctx, insetPoints, '#947354', .65, roof.seed, .23, scene.viewport.scale);
      if (short > 12 && long > 24) {
        const [x,y] = point(.3,.3);
        ctx.fillStyle = '#9d9279'; ctx.fillRect(x,y,4,2.5);
        ctx.fillStyle = '#e2ceb1'; ctx.fillRect(x+.6,y+.4,2.5,1);
      }
      return;
    }
    const hip = !['gable', 'longhouse'].includes(roof.style);
    const inset = hip ? Math.min(.26, short / Math.max(long, 1) * .55) : 0;
    const a = point(0, 0), b = point(1, 0), c = point(1, 1), d = point(0, 1);
    const r1 = point(inset, .5), r2 = point(1 - inset, .5);
    const mid = point(.5, .5), upper = point(.5, 0);
    const lightTop = (upper[0] - mid[0]) * -.55 + (upper[1] - mid[1]) * -.83 > 0;
    const warm = roof.seed % 5;
    const light = ['#dfa07b', '#d99a76', '#e4a380', '#dca17e', '#d69979'][warm];
    const shade = ['#be7d5d', '#b7795d', '#c18464', '#ba8062', '#b87c61'][warm];
    polygon(ctx, [a, b, r2, r1], lightTop ? light : shade);
    polygon(ctx, [d, c, r2, r1], lightTop ? shade : light);
    if (hip) {
      polygon(ctx, [a, d, r1], '#c68a68'); polygon(ctx, [b, c, r2], '#c28a69');
      if (short > 7) {
        penLine(ctx, [a, r1, d], '#81563c', .65, roof.seed, .2, scene.viewport.scale);
        penLine(ctx, [b, r2, c], '#81563c', .65, roof.seed + 1, .2, scene.viewport.scale);
      }
    }
    // A few uneven wash strokes and broken tile marks leave the roof planes readable.
    if (short > 8 && long > 13) {
      ctx.save();
      for (let j = 0; j < 7; j++) {
        const v = .08 + random(roof.seed, j + 200) * .84;
        const start = .07 + random(roof.seed, j + 220) * .12;
        ctx.globalAlpha = j % 2 ? .16 : .12;
        penLine(ctx, [point(start, v), point(.78 + random(roof.seed, j + 240) * .15, v)],
          j % 2 ? '#f1c394' : '#8c563b', .55 + random(roof.seed, j + 260), roof.seed + j, .3, scene.viewport.scale);
      }
      ctx.globalAlpha = .42;
      for (let j = 0; j < Math.min(10, long / 8); j++) {
        const u = .12 + random(roof.seed, j + 280) * .76;
        const v = .12 + random(roof.seed, j + 300) * .7;
        penLine(ctx, [point(u, v), point(u, Math.min(.92, v + 2.4 / short))], '#86543b', .5, roof.seed + j, .13, scene.viewport.scale);
      }
      ctx.restore();
    }
    if (short > 5) penLine(ctx, [r1, r2], palette.roofInk, .9, roof.seed + 2, .23, scene.viewport.scale);
    if (short > 15 && long > 25 && roof.seed % 3 !== 1) {
      const [cx, cy] = point(.32, .27);
      ctx.fillStyle = '#82674d'; ctx.fillRect(cx - 1.2, cy - 1.5, 2.7, 3.2);
      ctx.fillStyle = '#bca785'; ctx.fillRect(cx - .6, cy - 1.1, 1.5, 1.1);
    }
  }
  function drawRoof(ctx, scene, roof) {
    const min = Math.min(roof.frame.width, roof.frame.height) * scene.viewport.scale;
    trace(ctx, scene, roof.polygon, true, [1.3, 1.7]);
    ctx.fillStyle = palette.roofShadow; ctx.fill('evenodd');
    trace(ctx, scene, roof.polygon); ctx.fillStyle = palette.roof; ctx.fill('evenodd');
    ctx.save(); trace(ctx, scene, roof.polygon); ctx.clip('evenodd');
    for (const panel of roof.panels) panelRoof(ctx, scene, roof, panel);
    ctx.restore();
    featureInk(ctx, scene, roof.polygon, palette.roofInk, min < 4 ? .55 : min < 9 ? .8 : 1.2, .3);
  }
  function drawPaper(ctx, scene) {
    const b = scene.bounds, s = scene.viewport.scale;
    ctx.save();
    // World-anchored paper fibres cross the pigments very lightly, with no screen overlay
    // or repeating bitmap that would slide independently when the map is dragged.
    for (let gy = Math.floor(b.top / 6); gy < b.bottom / 6; gy++) for (let gx = Math.floor(b.left / 6); gx < b.right / 6; gx++) {
      const seed = G.hash(`paper:${gx}:${gy}`);
      const [x, y] = project(scene, [(gx + random(seed, 1)) * 6, (gy + random(seed, 2)) * 6]);
      ctx.globalAlpha = .07 + random(seed, 3) * .06;
      ctx.fillStyle = seed % 3 === 0 ? '#fff4d5' : '#7d7954';
      ctx.fillRect(x, y, (.4 + random(seed, 4) * .7) * s, (.25 + random(seed, 5) * .5) * s);
    }
    ctx.restore();
  }
  function paint(ctx, scene, location = null) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    drawGround(ctx, scene); drawWater(ctx, scene); drawRoads(ctx, scene);
    for (const tree of scene.trees) drawTree(ctx, scene, tree);
    for (const roof of scene.buildings) drawRoof(ctx, scene, roof);
    drawPaper(ctx, scene);
    if (location) {
      const [x, y] = project(scene, location);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = '#f5f0d8'; ctx.fill();
      ctx.strokeStyle = '#4b6155'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = '#456f71'; ctx.fill();
    }
    ctx.restore();
    return { paintedRoofs: scene.buildings.length, paintedTrees: scene.trees.length,
      paintedRoads: scene.roads.filter(f => f.props.brunnel !== 'tunnel').length };
  }
  global.PixelMapIllustratedRenderer = Object.freeze({ palette, project, paint, crownPoints, penPoints });
})(typeof window !== 'undefined' ? window : globalThis);
