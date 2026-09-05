((global) => {
  'use strict';
  const G = global.PixelMapIllustratedGeometry;
  const palette = Object.freeze({ ground: '#e1e2be', residential: '#e5e2c2', grass: '#d5ddb1',
    park: '#cfdaad', forest: '#93ae80', forestEdge: '#738d67', field: '#daddb0', fieldLine: '#929e70',
    soil: '#dfd5b5', plaza: '#e5dec5', road: '#efead2', roadEdge: '#96967b', path: '#e8e3c5',
    rail: '#6f7567', water: '#b6ccca', waterEdge: '#627e77', ripple: '#849f99',
    ink: '#4a4c38', roofInk: '#654a38', roof: '#cd8766', roofLight: '#e1a07c', roofDark: '#b47156',
    roofShadow: '#b7b597', roofSeam: '#95684c', tree: '#89a97b', treeLight: '#a6bf8e',
    treeDark: '#6d916b', treeDeep: '#526f51', treeInk: '#4e694b', treeShadow: '#adb594' });
  function project(scene, [x, y]) {
    const v = scene.viewport;
    return [(x - v.centerX) * v.scale + v.width / 2, (y - v.centerY) * v.scale + v.height / 2];
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
            line(ctx, [project(scene, frame.point(frame.left, y)), project(scene, frame.point(frame.right, y))], palette.fieldLine, .65);
          }
          ctx.restore();
        }
      }
    }
    // Sparse botanical marks on known grass only. Their world phase survives pan and tile loading.
    for (const f of scene.land.filter(f => ['grass', 'meadow', 'park'].includes(G.kind(f)) || f.layer === 'park')) {
      const b = { left: Math.max(f.bounds.left, scene.bounds.left), right: Math.min(f.bounds.right, scene.bounds.right),
        top: Math.max(f.bounds.top, scene.bounds.top), bottom: Math.min(f.bounds.bottom, scene.bounds.bottom) };
      for (let gy = Math.floor(b.top / 31); gy < b.bottom / 31; gy++) for (let gx = Math.floor(b.left / 31); gx < b.right / 31; gx++) {
        const seed = G.hash(`grass:${gx}:${gy}`);
        if (G.unit(seed) > .34) continue;
        const p = [(gx + G.unit(seed, 1)) * 31, (gy + G.unit(seed, 2)) * 31];
        if (!G.containsDisc(p, 4, f.polygons)) continue;
        const [x, y] = project(scene, p), s = Math.min(1.2, scene.viewport.scale);
        line(ctx, [[x - 2 * s, y], [x - 3 * s, y - 2 * s]], '#a3b083', .55);
        line(ctx, [[x + s, y], [x + 2 * s, y - 3 * s]], '#a3b083', .55);
      }
    }
  }

  function drawWater(ctx, scene) {
    // River polygons cover the duplicate MVT centerlines; uncovered streams remain visible.
    for (const f of [...scene.water].sort((a, b) => a.type - b.type)) {
      if (f.type === 3) fillFeature(ctx, scene, f, palette.water, palette.waterEdge, .85);
      else {
        trace(ctx, scene, f.geometry, false); ctx.strokeStyle = palette.waterEdge;
        ctx.lineWidth = (G.kind(f) === 'river' ? 10 : 3) * scene.viewport.scale + 1; ctx.stroke();
        ctx.strokeStyle = palette.water; ctx.lineWidth -= 1.2; ctx.stroke();
      }
    }
    const waterAreas = scene.water.filter(f => f.type === 3);
    const b = scene.bounds;
    for (let gy = Math.floor(b.top / 34); gy < b.bottom / 34; gy++) for (let gx = Math.floor(b.left / 34); gx < b.right / 34; gx++) {
      const seed = G.hash(`water:${gx}:${gy}`);
      if (G.unit(seed) > .58) continue;
      const p = [(gx + G.unit(seed, 1)) * 34, (gy + G.unit(seed, 2)) * 34];
      if (!waterAreas.some(f => G.containsDisc(p, 9, f.polygons))) continue;
      const [x, y] = project(scene, p), s = scene.viewport.scale;
      ctx.beginPath(); ctx.moveTo(x - 5 * s, y + s);
      ctx.bezierCurveTo(x - 3 * s, y - 1.5 * s, x + 2 * s, y + 1.5 * s, x + 5 * s, y - s);
      ctx.strokeStyle = palette.ripple; ctx.lineWidth = .65; ctx.stroke();
      if (G.unit(seed, 3) > .55) line(ctx, [[x - 2 * s, y + 3 * s], [x + 2 * s, y + 3 * s]], '#d4e0d6', .75);
    }
  }

  function roadPass(ctx, scene, roads, edge) {
    for (const f of roads) {
      const width = f.width * scene.viewport.scale;
      trace(ctx, scene, f.geometry, false);
      ctx.strokeStyle = edge ? palette.roadEdge : (width < 4 ? palette.path : palette.road);
      ctx.lineWidth = width + (edge ? 1.2 : 0); ctx.stroke();
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
    const n = 60, phase = G.unit(seed, 3) * Math.PI * 2;
    return Array.from({ length: n }, (_, i) => {
      const a = i / n * Math.PI * 2;
      const radius = r * (.9 + .065 * Math.sin(a * 11 + phase) + .047 * Math.sin(a * 7 + phase * 2) + .05 * Math.sin(a * 3 + phase));
      return [x + Math.cos(a) * radius, y + Math.sin(a) * radius * (.89 + G.unit(seed, 4) * .13)];
    });
  }
  function drawTree(ctx, scene, tree) {
    const [x, y] = project(scene, [tree.x, tree.y]), r = tree.radius * scene.viewport.scale;
    const pts = crownPoints(x, y, r, tree.seed);
    const base = ['#89a97b', '#91ad80', '#83a47a', '#9ab587'][tree.seed % 4];
    polygon(ctx, pts.map(([px, py]) => [px + 1.3 * scene.viewport.scale, py + 1.7 * scene.viewport.scale]), palette.treeShadow);
    polygon(ctx, pts, base);
    ctx.save(); polygon(ctx, pts); ctx.clip();
    // Three broad botanical masses; no glossy concentric highlight rings.
    polygon(ctx, crownPoints(x + r * .28, y + r * .37, r * .78, tree.seed + 70), palette.treeDark);
    polygon(ctx, crownPoints(x - r * .28, y - r * .24, r * .65, tree.seed + 31), palette.treeLight);
    polygon(ctx, crownPoints(x + r * .05, y + r * .02, r * .45, tree.seed + 54), base);
    ctx.restore();
    polygon(ctx, pts, null, tree.edge ? palette.treeInk : '#66875f', tree.edge ? .8 : .55);
    if (r > 5.5) {
      for (let j = 0; j < 4; j++) {
        const a = G.unit(tree.seed, 20 + j) * Math.PI * 2;
        const d = r * (.25 + G.unit(tree.seed, 30 + j) * .3);
        const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d;
        line(ctx, [[cx - 1.3, cy + .8], [cx - 1.7, cy - .8], [cx + .2, cy - 1.5]], '#708b60', .6);
      }
    }
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
      polygon(ctx, [point(rim,rim),point(1-rim,rim),point(1-rim,1-rim),point(rim,1-rim)], '#d2af8e', '#ad896b', .65);
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
        line(ctx, [a, r1, d], palette.roofSeam, .6);
        line(ctx, [b, r2, c], palette.roofSeam, .6);
      }
    }
    if (short > 5) line(ctx, [r1, r2], palette.roofInk, .75);
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
    trace(ctx, scene, roof.polygon); ctx.strokeStyle = palette.roofInk;
    ctx.lineWidth = min < 4 ? .45 : min < 9 ? .65 : .95; ctx.stroke();
  }
  function paint(ctx, scene, location = null) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    drawGround(ctx, scene); drawWater(ctx, scene); drawRoads(ctx, scene);
    for (const tree of scene.trees) drawTree(ctx, scene, tree);
    for (const roof of scene.buildings) drawRoof(ctx, scene, roof);
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
  global.PixelMapIllustratedRenderer = Object.freeze({ palette, project, paint, crownPoints });
})(typeof window !== 'undefined' ? window : globalThis);
