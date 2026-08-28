((global) => {
  'use strict';

  // map-02-refined.html のstandalone cell2線路と同じ4連結マスク生成器。
  // 斜め区間でも一度に片方の軸だけを進め、上下左右で必ず連続する階段状の経路を作る。
  function walkFourConnectedGridLine(size, x0, y0, x1, y1, visit){
    let cx = Math.floor(x0), cy = Math.floor(y0);
    const ex = Math.floor(x1), ey = Math.floor(y1);
    const dx = x1 - x0, dy = y1 - y0;
    const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
    const tDX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tMX = dx !== 0 ? (dx > 0 ? (cx + 1 - x0) : (x0 - cx)) * tDX : Infinity;
    let tMY = dy !== 0 ? (dy > 0 ? (cy + 1 - y0) : (y0 - cy)) * tDY : Infinity;
    visit(cx, cy);
    let guard = 0;
    while ((cx !== ex || cy !== ey) && guard++ < size * 4){
      if (cx === ex){ cy += stepY; tMY += tDY; }
      else if (cy === ey){ cx += stepX; tMX += tDX; }
      else if (tMX < tMY){ cx += stepX; tMX += tDX; }
      else               { cy += stepY; tMY += tDY; }
      visit(cx, cy);
    }
  }

  function createContinuousRailSkin(size){
    // 左右レールと枕木を別マスクに分け、描画側で正しい重ね順を選べるようにする。
    // sourcePaths は LOD 判定前の元経路、後続の数値は比較・診断用。
    return {
      size,
      leftRail:new Uint8Array(size * size),
      rightRail:new Uint8Array(size * size),
      ties:new Uint8Array(size * size),
      sourcePaths:[],sourcePathCount:0,pathCount:0,lodSuppressedPathCount:0,tieCount:0,
    };
  }

  function appendContinuousRailSkinPath(path, skin, {
    offsetCells = 1,tiePeriodCells = 3,tieHalfSpanCells = 2,tangentRadius = 4,phaseAt = () => 0,
  } = {}){
    if (!skin || !Array.isArray(path) || path.length < 2) return;
    const size = skin.size;
    const setMaskCell = (mask, x, y) => {
      if (x >= 0 && y >= 0 && x < size && y < size) mask[y * size + x] = 1;
    };
    const connect = (mask, from, to) => {
      walkFourConnectedGridLine(size, from[0], from[1], to[0], to[1],
        (x, y) => setMaskCell(mask, x, y));
    };
    // 前後の点から接線を平滑化し、その法線方向をレールと枕木の向きに使う。
    const tangents = path.map((point, index) => {
      const before = path[Math.max(0, index - tangentRadius)];
      const after = path[Math.min(path.length - 1, index + tangentRadius)];
      const dx = after[0] - before[0], dy = after[1] - before[1];
      const length = Math.hypot(dx, dy) || 1;
      return [dx / length, dy / length];
    });
    const offsetPoint = (point, tangent, side, amount = offsetCells) => [
      point[0] + .5 - tangent[1] * amount * side,
      point[1] + .5 + tangent[0] * amount * side,
    ];
    // 中心経路から左右へ offsetCells ずつ離した2本のレールを、4連結で描く。
    for (const [side, mask] of [[-1, skin.leftRail], [1, skin.rightRail]]){
      let previous = offsetPoint(path[0], tangents[0], side);
      setMaskCell(mask, Math.floor(previous[0]), Math.floor(previous[1]));
      for (let index = 1; index < path.length; index++){
        const current = offsetPoint(path[index], tangents[index], side);
        connect(mask, previous, current);previous = current;
      }
    }
    // 経路の先頭を基準に位相を固定し、曲線でも枕木を一定周期に並べる。
    const period = Math.max(2, Math.round(tiePeriodCells));
    const phase = Math.round(phaseAt(path[0], tangents[0]));
    for (let index = 0; index < path.length; index++){
      if (((phase + index) % period + period) % period !== 0) continue;
      const start = offsetPoint(path[index], tangents[index], -1, tieHalfSpanCells);
      const end = offsetPoint(path[index], tangents[index], 1, tieHalfSpanCells);
      connect(skin.ties, start, end);skin.tieCount++;
    }
    skin.pathCount++;
  }

  function finalizeContinuousRailSkin(skin, options = {}){
    if (!skin || !skin.sourcePaths.length) return;
    const lodDistanceCells = Math.max(1, Math.round(options.lodDistanceCells || 2));
    const overlapThreshold = Math.max(.5, Math.min(1, options.overlapThreshold || .6));
    const keyFor = (x, y) => `${x},${y}`;
    const pathIndex = path => new Set(path.map(([x, y]) => keyFor(x, y)));
    const pointNear = (point, index) => {
      for (let dy = -lodDistanceCells; dy <= lodDistanceCells; dy++) for (let dx = -lodDistanceCells; dx <= lodDistanceCells; dx++){
        if (dx * dx + dy * dy <= lodDistanceCells * lodDistanceCells && index.has(keyFor(point[0] + dx, point[1] + dy))) return true;
      }
      return false;
    };
    const overallTangent = path => {
      const first = path[0], last = path[path.length - 1];
      const dx = last[0] - first[0], dy = last[1] - first[1], length = Math.hypot(dx, dy) || 1;
      return [dx / length, dy / length];
    };
    const pathsAreLodCoincident = (path, tangent, representative) => {
      const alignment = Math.abs(tangent[0] * representative.tangent[0] + tangent[1] * representative.tangent[1]);
      if (alignment < .8 || !pointNear(path[0], representative.index) || !pointNear(path[path.length - 1], representative.index)) return false;
      const step = Math.max(1, Math.floor(path.length / 64));
      let samples = 0, overlaps = 0;
      for (let index = 0; index < path.length; index += step){ samples++;if (pointNear(path[index], representative.index)) overlaps++; }
      return samples > 0 && overlaps / samples >= overlapThreshold;
    };
    // LODでは近接して平行な重複線路だけを代表経路へ統合する。
    // 交差・分岐は方向が異なるため、それぞれのレール画素を残す。
    const ordered = [...skin.sourcePaths].sort((first, second) => second.length - first.length || first[0][1] - second[0][1] || first[0][0] - second[0][0]);
    const representatives = [];
    for (const path of ordered){
      const tangent = overallTangent(path);
      if (representatives.some(item => pathsAreLodCoincident(path, tangent, item))){ skin.lodSuppressedPathCount++;continue; }
      representatives.push({path,tangent,index:pathIndex(path)});
    }
    skin.sourcePathCount = ordered.length;
    for (const {path} of representatives) appendContinuousRailSkinPath(path, skin, options);
  }

  // スタディページと map-02-refined.html が共有する cell2 線路描画API。
  global.PixelMapContinuousRailSkin = Object.freeze({
    version:'pixelmap-continuous-rail-skin/1',walkFourConnectedGridLine,createContinuousRailSkin,
    appendContinuousRailSkinPath,finalizeContinuousRailSkin,
  });
})(typeof window !== 'undefined' ? window : globalThis);
