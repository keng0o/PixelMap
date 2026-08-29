import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const fourMapHtml = await readFile(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');
const fourMapShellHtml = await readFile(new URL('../four-maps.html', import.meta.url), 'utf8');
const twoMapHtml = await readFile(new URL('../compare.html', import.meta.url), 'utf8');
const oneMapHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('全ページでcell2を既定にしcell3だけを明示指定として受け付ける', () => {
  assert.match(html, /const REQUESTED_RENDER_MODE = PAGE_PARAMS\.get\('render'\)/);
  assert.match(html, /const RENDER_MODE = REQUESTED_RENDER_MODE === 'cell3' \? 'cell3' : 'cell2'/);
  assert.match(html, /const CELL_RENDER_LOGICAL_SIZE = Number\(RENDER_MODE\.slice\(4\)\)/);
  assert.match(html, /const CELL_ONLY_MODE = \['cell2','cell3'\]\.includes\(RENDER_MODE\)/);
  assert.doesNotMatch(html, /!EMBEDDED && \['cell2','cell3'\]\.includes\(REQUESTED_RENDER_MODE\)/);
  assert.doesNotMatch(html, /PAGE_PARAMS\.get\('render'\) === 'cell8'/);
  assert.match(html, /: CELL_ONLY_MODE[\s\S]*\? PAGE_PARAMS\.get\('layers'\) !== 'manual'/);
  assert.match(html, /dataset\.renderMode = RENDER_MODE/);
  assert.match(html, /renderMode:RENDER_MODE/);
});

test('共有マップのチェックはURLを保ったままcell2とcell3を切り替える', () => {
  assert.match(html, /id="tglCell3">3×3セル（cell3）/);
  assert.match(html, /renderModeToggle\.checked = RENDER_MODE === 'cell3'/);
  assert.match(html, /function renderModeUrl\(mode, source = location\.href\)/);
  assert.match(html, /url\.searchParams\.set\('render', mode === 'cell3' \? 'cell3' : 'cell2'\)/);
  assert.match(html, /location\.assign\(renderModeUrl\(renderModeToggle\.checked \? 'cell3' : 'cell2'\)\.href\)/);
});

test('standaloneと1・2マップは設定を閉じて地図を全画面表示できる', () => {
  assert.match(html, /id="settingsCloseBtn"[\s\S]*?aria-label="設定を閉じる"[\s\S]*?hidden>－<\/button>/);
  assert.match(html, /id="settingsOpenBtn"[\s\S]*?aria-label="設定を開く"[\s\S]*?>＋<\/button>/);
  assert.match(html, /\.settings-toggle\{[\s\S]*?position:fixed;[\s\S]*?top:max\(14px,[\s\S]*?right:max\(14px,[\s\S]*?width:44px;[\s\S]*?height:44px/);
  assert.match(html, /function setStandaloneSettingsCollapsed\(collapsed\)/);
  assert.match(html, /const SETTINGS_COLLAPSIBLE = !SHARED_CONTROLS && !CAPTURE_MODE/);
  assert.match(html, /const SETTINGS_DEFAULT_COLLAPSED = SETTINGS_COLLAPSIBLE/);
  assert.match(html, /if \(!SETTINGS_COLLAPSIBLE\) return/);
  assert.match(html, /if \(SETTINGS_COLLAPSIBLE\)/);
  assert.match(html, /classList\.toggle\('settings-collapsed', collapsed\)/);
  assert.match(html, /settingsToolbar\.inert = collapsed/);
  assert.match(html, /body\.settings-collapsed \.map-frame\{[\s\S]*?position:fixed;[\s\S]*?width:100vw;[\s\S]*?height:100dvh/);
  assert.match(html, /body\.settings-collapsed canvas\{[\s\S]*?width:max\(100dvw, 100dvh\)/);
  assert.match(html, /body\.settings-collapsed #settingsOpenBtn\{ display:block; \}/);
  assert.match(html, /if \(SETTINGS_DEFAULT_COLLAPSED\) setStandaloneSettingsCollapsed\(true\)/);
  assert.match(html, /!document\.body\.classList\.contains\('settings-collapsed'\)/);
});

test('2マップは左右別、4マップは共通チェックでcell2とcell3を切り替える', () => {
  assert.equal((twoMapHtml.match(/map-02-refined\.html\?embedded=1/g) || []).length, 2);
  assert.doesNotMatch(twoMapHtml, /cell3Mode|pixelmap:set-render/);
  assert.match(fourMapHtml, /id="cell3Mode" type="checkbox">3×3セル（cell3）/);
  assert.match(fourMapHtml, /function applyFourMapRenderMode\(mode\)/);
  assert.match(fourMapHtml, /const currentMode = frame\.dataset\.renderMode \|\| renderModeFromUrl\(frame\.src\)/);
  assert.match(fourMapHtml, /frame\.dataset\.renderMode = nextMode/);
  assert.match(fourMapHtml, /url\.searchParams\.set\('render', nextMode\)/);
  assert.match(fourMapHtml, /frame\.contentWindow\.location\.replace\(url\.href\)/);
  assert.match(fourMapHtml, /window\.parent === window \? 'pushState' : 'replaceState'/);
  assert.match(fourMapHtml, /window\.addEventListener\('popstate'/);
  assert.match(fourMapHtml, /pixelmap:render-mode/);
  assert.match(fourMapHtml, /pixelmap:set-render-mode/);
  assert.match(fourMapShellHtml, /id="fourMapFrame"/);
  assert.match(fourMapShellHtml, /function updateTopRenderUrl\(mode\)/);
  assert.match(fourMapShellHtml, /pixelmap:render-mode/);
  assert.match(fourMapShellHtml, /pixelmap:set-render-mode/);
  assert.match(oneMapHtml, /v=20260829-current-test-production-1/);
  assert.equal((twoMapHtml.match(/v=20260829-current-test-production-1/g) || []).length, 2);
  assert.equal((fourMapHtml.match(/v=20260829-current-test-production-1/g) || []).length, 4);
  assert.match(fourMapShellHtml, /height-stack-four-map\.html\?v=20260829-current-test-production-1/);
});

test('cell2は384×4、cell3は256×6の原子セルグリッドを使う', () => {
  assert.match(html, /const STANDARD_GRID = 96, STANDARD_CPX = 16/);
  assert.match(html, /CELL_RENDER_LOGICAL_SIZE \* SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /const GRID = SCENE_SIZE \/ CPX/);
  assert.match(html, /const CELL_DETAIL_SCALE = GRID \/ STANDARD_GRID/);
  assert.match(html, /const detailCellSpan = standardCells => Math\.max\(1, Math\.round\(standardCells \* CELL_DETAIL_SCALE\)\)/);
  assert.match(html, /const MAP_CELL_LOGICAL_SIZE = CPX \/ SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /gridCellsPerSide:CELL_ONLY_MODE \? GRID : null/);
});

test('意味セルバッファを不透明色で合成し最近傍でセル全面へ展開する', () => {
  assert.match(html, /function paintSolidMapCell\(gx, gy, color, layer, stats(?:, worldDepth = null, depthTest = false)?\)/);
  assert.match(html, /stats\.pixelData\[pixelIndex \+ 3\] = rgba\[3\]/);
  assert.match(html, /\[0, 0, 0, 255\]/);
  assert.match(html, /function flushSolidCellBuffer\(stats\)/);
  assert.match(html, /new ImageData\(stats\.pixelData, size, size\)/);
  assert.match(html, /ctx\.imageSmoothingEnabled = false/);
  assert.match(html, /ctx\.drawImage\(cellCompositeCanvas, originX, originY, size \* CPX, size \* CPX\)/);
  assert.match(html, /function drawCellPixelArtSurfaceGrid\(grid, option, stats, transparent = true\)/);
  assert.match(html, /singleColorCells:CELL_ONLY_MODE/);
  assert.match(html, /semanticCellBuffer:CELL_ONLY_MODE/);
});

test('標準16シーンpxマップチップをcell2/cell3の世界座標固定テンプレートへ変換する', () => {
  assert.match(html, /c\.width = c\.height = STANDARD_CPX/);
  assert.match(html, /function leastCommonMultiple|const leastCommonMultiple/);
  assert.match(html, /leastCommonMultiple\(canvas\.width, CPX\) \/ CPX/);
  assert.match(html, /positiveModulo\(cx \* CPX \+ cellX, canvas\.width\)/);
  assert.match(html, /function cellTemplateForCanvas\(canvas, cacheKey, priorityColors = \[\]\)/);
  assert.match(html, /count >= CPX \* CPX \* \.25/);
  assert.match(html, /function cellMapChipColor\(name, gx, gy\)/);
  assert.match(html, /positiveModulo\(wx, template\.width\)/);
  assert.match(html, /styleProfile:CELL_ONLY_MODE \? \(ACTIVE_MAP_SKIN\?\.id \|\| 'standard-pixel-art'\) : 'standard'/);
});

test('細分化しても公園・建物の意味分類は96セル基準を維持する', () => {
  assert.match(html, /const semanticS = STANDARD_GRID \/ extent/);
  assert.match(html, /return Math\.abs\(twiceArea\) \* \.5 \* semanticS \* semanticS/);
  assert.match(html, /geomAreaCells:Math\.abs\(unit\.signed\) \* \(STANDARD_GRID \/ buildingExtent\) \*\* 2/);
});

test('セルモードの地形・交通・建物は専用ピクセルアート経路を使う', () => {
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawCellPixelArtSurfaceGrid\(grid, option, cellRenderingStats/);
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawCellPixelArtTransportGrid\(\s*grid, option, cellRenderingStats, transportCenters\.get\(option\)/);
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawCellPixelArtBuildingGrid\(normalBuildingGrid/);
  assert.match(html, /else if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option\)/);
  assert.match(html, /else if \(tunnelOptions\.has\(option\)\) drawTunnelLayer\(option\)/);
});

test('地表模様と水際・林縁・公園境界を世界座標固定でセル描画する', () => {
  assert.match(html, /function standardCellCoordinates\(gx, gy\)/);
  assert.match(html, /Math\.floor\(wx \/ CELL_DETAIL_SCALE\)/);
  assert.match(html, /function surfaceChipName\(id, gx, gy\)/);
  for (const chip of ['forestBroad0','woodsCopse0','parkPocket0','farm','pave','sand','rock','wetland','water0'])
    assert.match(html, new RegExp(`'${chip}'`), chip);
  assert.match(html, /function cellSurfaceBoundary\(grid, x, y, id\)/);
  assert.match(html, /id === ID\.WATER[\s\S]*?P\.foam/);
  assert.match(html, /id === ID\.PARK_RESERVE[\s\S]*?neighbors\.every/);
});

test('地下交通もセルモード用グリッドへ分類する', () => {
  assert.match(html, /if \(!isBridgeFeature && option === 'subway'\)[\s\S]*?layer = 'subway'/);
  assert.match(html, /binding\.modifiers\.tunnel && binding\.stateAssetId !== option/);
  assert.match(html, /layer = binding\.stateAssetId/);
});

test('交通線は4連結を保ち、原子セルモードでは細街路だけ最小1セル・他は従来幅へ展開する', () => {
  assert.match(html, /function walkFourConnectedGridLine\(size, x0, y0, x1, y1, visit\)/);
  assert.match(html, /walkFourConnectedGridLine\(RG, x0, y0, x1, y1, visit\)/);
  assert.match(html, /const transportCenters = new Map\(\)/);
  assert.match(html, /setCell\(center, cx, cy, 1\)/);
  assert.match(html, /minimumMinorRoute \? 1 : detailCellSpan\(thick \? 2 : 1\)/);
  assert.match(html, /c\.lineWidth = lineWidth \* CELL_DETAIL_SCALE/);
});

test('交通線のセル走査はセル角の終点を越えて架空の線を延長しない', () => {
  const source = html.match(/function walkFourConnectedGridLine\(size, x0, y0, x1, y1, visit\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(source, '4連結走査を取得できる');
  const traverse = Function(`'use strict';\n${source}\nreturn walkFourConnectedGridLine;`)();
  const cells = [];
  // 川崎駅南西の線路で架空線を発生させていた、セル角が終点になる実座標。
  traverse(258, 2.875, 218.125, 5, 215, (x, y) => cells.push([x, y]));
  assert.deepEqual(cells.at(-1), [5, 215]);
  assert.ok(cells.every(([x, y]) => x >= 2 && x <= 5 && y >= 215 && y <= 218));
  assert.ok(cells.slice(1).every(([x, y], index) =>
    Math.abs(x - cells[index][0]) + Math.abs(y - cells[index][1]) === 1));
  assert.match(source, /if \(cx === ex\)/);
  assert.match(source, /else if \(cy === ey\)/);
  assert.doesNotMatch(source, /EMBEDDED/);
});

test('交通を縁・面・中央線と鉄道路盤・レール・枕木へ分ける', () => {
  assert.match(html, /function drawCellPixelArtTransportGrid\([\s\S]*?continuousRailSkin = null/);
  assert.match(html, /const baseColor = minimumMinorRoute[\s\S]*?: boundary \? edge : fill/);
  assert.match(html, /const color = steampunkMegacityRoadColor\(option, x, y, baseColor, boundary\)/);
  assert.match(html, /paintSolidMapCell\(x, y, color, option, stats\)/);
  assert.match(html, /paintSolidMapCell\(x, y, roadStyle\.center/);
  assert.match(html, /for \(const offset of \[-1,1\]\)/);
  assert.match(html, /paintSolidMapCell\(tx, ty, P\.tie/);
  assert.match(html, /positiveModulo\(wx \+ wy \* 3, span\)/);
});

test('全Webマップの地上鉄道は枕木を描かず左右レールを40px描画・5px空白にする', () => {
  const source = html.match(/function walkFourConnectedGridLine[\s\S]*?\nconst isRoad/)?.[0]
    .replace(/\nconst isRoad[\s\S]*$/u, '');
  assert.ok(source, '連続レール生成器を取得できる');
  const { createContinuousRailSkin, appendContinuousRailSkinPath, finalizeContinuousRailSkin } = Function(
    `'use strict';\n${source}\nreturn {createContinuousRailSkin,appendContinuousRailSkinPath,finalizeContinuousRailSkin};`
  )();
  const skin = createContinuousRailSkin(24);
  const diagonal = [[4,4],[5,4],[5,5],[6,5],[6,6],[7,6],[7,7],[8,7],[8,8],[9,8],[9,9]];
  appendContinuousRailSkinPath(diagonal, skin, { phaseAt:() => 0 });
  const componentCount = (mask, size = skin.size) => {
    const visited = new Uint8Array(mask.length);
    let components = 0;
    for (let start = 0; start < mask.length; start++){
      if (!mask[start] || visited[start]) continue;
      components++;
      const stack = [start]; visited[start] = 1;
      while (stack.length){
        const index = stack.pop(), x = index % size, y = Math.floor(index / size);
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const next = ny * size + nx;
          if (mask[next] && !visited[next]){ visited[next] = 1; stack.push(next); }
        }
      }
    }
    return components;
  };
  assert.equal(componentCount(skin.leftRail), 1);
  assert.equal(componentCount(skin.rightRail), 1);
  assert.equal(skin.pathCount, 1);
  assert.ok(skin.tieCount > 0);

  const dashedSkin = createContinuousRailSkin(72);
  appendContinuousRailSkinPath(
    Array.from({length:60}, (_, index) => [4 + index, 20]), dashedSkin,
    { railOnCells:20, railGapCells:3, phaseAt:() => 0 }
  );
  assert.ok(componentCount(dashedSkin.leftRail, dashedSkin.size) >= 3);
  assert.ok(componentCount(dashedSkin.rightRail, dashedSkin.size) >= 3);

  const lodSkin = createContinuousRailSkin(24);
  lodSkin.sourcePaths.push(
    Array.from({length:11}, (_, index) => [2 + index, 4]),
    Array.from({length:11}, (_, index) => [2 + index, 5]),
    Array.from({length:10}, (_, index) => [7, 1 + index]),
  );
  finalizeContinuousRailSkin(lodSkin, { phaseAt:() => 0, lodDistanceCells:2 });
  assert.equal(lodSkin.sourcePathCount, 3);
  assert.equal(lodSkin.pathCount, 2, '並走線だけをLOD代表へまとめ、交差線を残す');
  assert.equal(lodSkin.lodSuppressedPathCount, 1);

  assert.match(html, /const CONTINUOUS_RAIL_SKIN = CELL_ONLY_MODE/);
  assert.match(html, /const RAIL_TIES = false/);
  assert.match(html, /railOnCells:Math\.max\(1, Math\.round\(40 \/ MAP_CELL_LOGICAL_SIZE\)\)/);
  assert.match(html, /railGapCells:Math\.max\(1, Math\.round\(5 \/ MAP_CELL_LOGICAL_SIZE\)\)/);
  assert.match(html, /routeOption === 'rail'[\s\S]*?continuousRailSkinGrid\(layer\)/);
  assert.match(html, /continuousRailSkin\.sourcePaths\.push\(railPath\)/);
  assert.match(html, /finalizeContinuousRailSkin\(continuousRailSkin/);
  assert.match(html, /if \(RAIL_TIES\)\{[\s\S]*?continuousRailSkin\.ties[\s\S]*?for \(const mask of \[continuousRailSkin\.leftRail, continuousRailSkin\.rightRail\]\)/);
  assert.match(html, /railTopologyPaths \+= continuousRailSkin\.pathCount/);
  assert.match(html, /railLodSuppressedPaths \+= continuousRailSkin\.lodSuppressedPathCount/);
  assert.match(html, /railRenderer:CONTINUOUS_RAIL_SKIN[\s\S]*?'source-track-connected-masks'/);
  assert.match(html, /railPassOrder:CONTINUOUS_RAIL_SKIN[\s\S]*?\['bed','left-rail','right-rail'\]/);
});

test('全Webマップの地区幹線道路は中央線を描かない', () => {
  assert.match(html, /const hideRegionalRoadCenter = option === 'regionalRoads'/);
  assert.match(html, /if \(roadStyle\?\.center && !hideRegionalRoadCenter\)/);
  assert.doesNotMatch(html, /function boundaryAlignedRoadCenter/);
});

test('全Webマップは細街路を既定表示し主要道路を手前へ重ねる', () => {
  assert.match(html, /const minorRoadDefaults = new Set\(\['localRoads','paths'\]\)/);
  assert.match(html, /STUDY_LAYER_OPTIONS\.has\(option\) \|\| minorRoadDefaults\.has\(option\)/);
  assert.match(html, /\['tglMajorRoads','tglRegionalRoads','tglLocalRoads','tglPaths'\]/);
  assert.match(html, /const ranked = \['paths','localRoads','regionalRoads','majorRoads'\]/);
  assert.match(html, /for \(const option of roadStackOrder\(layerOrder\)\)/);
  assert.doesNotMatch(html, /if \(EMBEDDED\) return options/);
});

test('建物は棟ごとの屋根・壁・影・施設記号を原子セルで描く', () => {
  assert.match(html, /function drawCellPixelArtBuildingGrid\(grid, bldGrid, buildingKinds, buildingDescs, buildingAnchors, layer, stats\)/);
  assert.match(html, /const CELL_HEIGHT_EXTRUSION = CELL_ONLY_MODE/);
  assert.match(html, /const CONTINUOUS_BUILDING_STRUCTURE_OUTLINE = CELL_ONLY_MODE/);
  assert.match(html, /function drawCellHeightExtrudedBuildingGrid\(/);
  assert.match(html, /BUILDING_STYLES\.heightRiseLogicalPixels\(buildingDescs\[bi\]\?\.heightM \|\| 0\)/);
  assert.match(html, /shiftX:SCREEN_VERTICAL_BUILDING_EXTRUSION[\s\S]*?Math\.max\(0, Math\.round\(riseCells \* \.34\)\)/);
  assert.match(html, /paintProjected\(group, x, y, roofOffsetX, roofOffsetY, color, `\$\{layer\}:height-roof`\)/);
  assert.match(html, /paintProjected\(group, anchor\.ex, anchor\.ey, 0, 0, P\.door/);
  assert.match(html, /paintDarkenedMapCell\(x, y, \.68/);
  assert.match(html, /if \(!below\)[\s\S]*?P\.wall/);
  assert.match(html, /kind === 'hospital'/);
  assert.match(html, /kind === 'convenience'/);
  assert.match(html, /kind === 'mixed'/);
  assert.match(html, /kind === 'poi' && desc\?\.glyph/);
});

test('点登録の神社仏閣は実建物のセル奥行きで手前の建物に遮蔽される', () => {
  assert.match(html, /worldStructureDepth:CELL_ONLY_MODE/);
  assert.match(html, /function mapCellScreenDepth\(gx, gy\)/);
  assert.match(html, /function paintSolidMapCell\(gx, gy, color, layer, stats, worldDepth = null, depthTest = false\)/);
  assert.match(html, /depthTest && existingDepth > worldDepth[\s\S]*?depthRejectedCells\+\+/);
  assert.match(html, /paintSolidMapCell\([\s\S]*?sourceX \+ offsetX, sourceY \+ offsetY,[\s\S]*?mapCellScreenDepth\(sourceX, sourceY\)/);
  assert.match(html, /kind\.startsWith\('religious_'\)/);
  assert.match(html, /stats\.worldStructureDepth \? mapCellScreenDepth\(sourceX, sourceY\) : null,[\s\S]*?group\.religious/);
  assert.match(html, /'religiousStructures:fallback'[\s\S]*?structureDepth, true/);
  assert.match(html, /religiousDepthRejectedCells\+\+/);
});

test('点登録の神社仏閣は実建物の輪郭・軸・道路側正面を使い、未一致だけ小型記号へ戻す', () => {
  assert.match(html, /const RELIGIOUS_BUILDING_MATCH_LOGICAL_PX = 12/);
  assert.match(html, /const RELIGIOUS_BUILDING_RISE_LOGICAL_PX = Object\.freeze\(/);
  assert.match(html, /const RELIGIOUS_FALLBACK_SIZE_LOGICAL_PX = Object\.freeze\(/);
  assert.match(html, /function resolveReligiousStructurePlacements\(/);
  assert.match(html, /const matchLimitCells = Math\.max\(1, Math\.ceil\([\s\S]*?\/ MAP_CELL_LOGICAL_SIZE\)\)/);
  assert.match(html, /const containingBuildingId = inGrid[\s\S]*?sourceBldGrid\[anchorCellY \* gridSize \+ anchorCellX\]/);
  assert.match(html, /function religiousBuildingAxis\(cells\)/);
  assert.match(html, /const approach = nearestReligiousApproachCell\(/);
  assert.match(html, /const claimedBuildingIds = new Set\(\)/);
  assert.match(html, /reason:'building-claimed'/);
  assert.match(html, /const religiousBuildingGrid = new Uint8Array\(RG \* RG\)/);
  assert.match(html, /riseLogicalPixels:RELIGIOUS_BUILDING_RISE_LOGICAL_PX\[placement\.religion\]/);
  assert.match(html, /item\.religiousPlacement\?\.buildingId/);
  assert.match(html, /RELIGIOUS_FALLBACK_SIZE_LOGICAL_PX\[religion\] \/ MAP_CELL_LOGICAL_SIZE/);
  assert.doesNotMatch(html, /minX:-3, maxX:3, minY:-2, maxY:0/);
  assert.doesNotMatch(html, /minX:-4, maxX:4, minY:-2, maxY:0/);
  assert.match(html, /religiousMatchedBuildings/);
  assert.match(html, /religiousFallbackSymbols/);
});

test('全Webマップの建物は構造輪郭を連続させ、窓に見える黒い点を除く', () => {
  assert.match(html, /const BUILDING_WINDOW_CELLS = false/);
  assert.match(html, /sideEdge && \(CONTINUOUS_BUILDING_STRUCTURE_OUTLINE \|\| outlinePhase !== 1\)/);
  assert.match(html, /CONTINUOUS_BUILDING_STRUCTURE_OUTLINE && outlinePhase === 1 \? pal\[1\] : P\.outline/);
  assert.match(html, /const structuralOutline = SCREEN_VERTICAL_BUILDING_EXTRUSION[\s\S]*?: west && !south/);
  assert.match(html, /BUILDING_WINDOW_CELLS && above && positiveModulo\(wx, 4\) === 1/);
  assert.match(html, /if \(BUILDING_WINDOW_CELLS &&\s*\(!CONTINUOUS_BUILDING_STRUCTURE_OUTLINE \|\| !structuralOutline\)/);
  assert.match(html, /\(!CONTINUOUS_BUILDING_STRUCTURE_OUTLINE \|\| !structuralOutline\)/);
  assert.match(html, /positiveModulo\(wx \* 3 \+ wy \* 5 \+ buildingIndex, 17\) === 0/);
  assert.match(html, /positiveModulo\(wx \+ step, 3\) === 1/);
  assert.match(html, /buildingLineContinuity:CONTINUOUS_BUILDING_STRUCTURE_OUTLINE/);
});

test('全Webマップの高さ建物は画面垂直に押し出し壁面と影を投影方向へ合わせる', () => {
  assert.match(html, /const SCREEN_VERTICAL_BUILDING_EXTRUSION = CELL_ONLY_MODE/);
  assert.match(html, /function buildingProjectionScreenCellVector\([\s\S]*?return \[0, -riseCells\]/);
  assert.match(html, /const screenDirectionToSource = \(dx, dy\) => BEARING_STUDY_MODE/);
  assert.match(html, /const exposedToward = \(group, x, y, direction\)/);
  assert.match(html, /const frontFace = SCREEN_VERTICAL_BUILDING_EXTRUSION/);
  assert.match(html, /Math\.min\(2, Math\.max\(1, Math\.ceil\(group\.riseCells \/ 4\)\)\)/);
  assert.match(html, /buildingProjectionMode:SCREEN_VERTICAL_BUILDING_EXTRUSION[\s\S]*?'screen-vertical'/);
  assert.match(html, /heightProportionalHorizontalOffset:!SCREEN_VERTICAL_BUILDING_EXTRUSION/);
  assert.match(html, /heightShadowMaxCells:SCREEN_VERTICAL_BUILDING_EXTRUSION \? 2 : 3/);
  assert.doesNotMatch(html, /const SCREEN_VERTICAL_BUILDING_EXTRUSION = !EMBEDDED/);
  assert.doesNotMatch(html, /const CONTINUOUS_BUILDING_STRUCTURE_OUTLINE = !EMBEDDED/);
});

test('POIは既存スプライトを原子セルテンプレートへ変換しクリック領域を維持する', () => {
  assert.match(html, /let spritePaintContext = ctx/);
  assert.match(html, /function cellSpriteTemplateFor\(item\)/);
  assert.match(html, /spriteFor\(item\.props, assetSize, item\.variant, item\.spriteKey\)\.draw\(0, 0\)/);
  assert.match(html, /function drawCellSprite\(item, layer\)/);
  assert.match(html, /drawCellPatternMarker\(item, gx, gy/);
  assert.match(html, /const \[x, y\] = drawCellSprite\(p, 'poi'\)/);
  assert.match(html, /w:radius\*2, h:radius\*2\.1/);
});

test('東京ランドマークはcell3 studyを含むマップへ固定配置しない', () => {
  assert.doesNotMatch(html, /CELL3_STUDY_LANDMARK_MODE/);
  assert.doesNotMatch(html, /spriteKey:'tokyo_tower'/);
  assert.doesNotMatch(html, /spriteKey:'tokyo_metropolitan_government'/);
  assert.doesNotMatch(html, /study-landmark:/);
  assert.match(html, /const resolvedView = applyStandaloneLandmarks\(collectResolvedFacilities\(\)\)/);
  assert.match(html, /drawCellPatternMarker\(item, gx, gy/);
});

test('点とクラスターも輪郭・カテゴリ色・ピップを原子セルで描く', () => {
  assert.match(html, /function drawCellFacilityMarker\(item, size, layer\)/);
  assert.match(html, /const radius = size === 'L'/);
  assert.match(html, /edge \? OUT : tone/);
  assert.match(html, /paintSolidMapCell\(gx \+ dx, gy \+ dy, GLYPH_WHITE/);
  assert.match(html, /function drawCellPoi\(\)/);
  assert.match(html, /drawCellFacilityMarker\(c, 'L', 'clusters'\)/);
  assert.match(html, /w:STANDARD_CPX \* 3, h:STANDARD_CPX \* 3/);
});

test('地形記号をセル化してから名称と現在地を重ねる', () => {
  const cellBranch = html.match(/if \(CELL_ONLY_MODE\)\{\n    if \(o\.dots[\s\S]*?\n  \} else \{/u)?.[0] || '';
  assert.match(cellBranch, /drawCellTerrainSymbols\(\)/);
  assert.match(cellBranch, /cellLabelDrawers\[option\]\(\)/);
  assert.ok(cellBranch.indexOf('drawCellTerrainSymbols()') < cellBranch.indexOf('cellLabelDrawers[option]()'));
  assert.ok(cellBranch.indexOf('flushSolidCellBuffer(cellRenderingStats)') < cellBranch.indexOf('cellLabelDrawers[option]()'));
  assert.ok(html.indexOf('drawCurrentLocation();') > html.indexOf('cellLabelDrawers[option]();'));
  assert.match(html, /terrainNames:drawCellTerrainNames/);
  assert.match(html, /paintSolidMapCell\(x, y, pointOutline \? OUT : color, 'terrainSymbols', cellRenderingStats\)/);
  assert.match(html, /kind === 'volcano'[\s\S]*?'#f8d038'/);
});

test('セル描画の件数を診断情報へ公開する', () => {
  for (const field of [
    'gridCellsPerSide','cellizedFeatures','facilitySymbols','terrainSymbols','paintedCells','occupiedCells',
    'groundPatternCells','boundaryCells','roadCasingCells','roadCenterCells','railTieCells',
    'buildingDetailCells','heightExtrusionEnabled','extrudedBuildings','maxBuildingRiseCells',
    'maxBuildingRiseLogicalPixels','spriteCells','layerCells',
  ])
    assert.match(html, new RegExp(`${field}:`), field);
  assert.match(html, /cellLogicalPixels:CELL_ONLY_MODE \? MAP_CELL_LOGICAL_SIZE : null/);
  assert.match(html, /cellScenePixels:CELL_ONLY_MODE \? CPX : null/);
});

test('standalone cellだけが強度3の機械都市素材と非意味装飾を描く', () => {
  assert.match(html, /const STANDALONE_STEAMPUNK_MEGACITY = !EMBEDDED && CELL_ONLY_MODE/);
  assert.match(html, /const STEAMPUNK_ASSETS = window\.PixelMapSteampunkMapAssets/);
  assert.match(html, /function drawSteampunkBuildingAssemblies\(/);
  assert.match(html, /function drawSteampunkCorridorFixtures\(/);
  assert.match(html, /function drawSteampunkSurfaceFixtures\(/);
  assert.match(html, /function steampunkMegacityRoadColor\(/);
  assert.match(html, /desc\?\.shape\?\.enabled/);
  assert.match(html, /shape\.sourceFootprintImmutable/);
  assert.match(html, /STEAMPUNK_ASSETS\.compositionFor/);
  assert.match(html, /const currentLayerCell = detailAnchor\.gy \* RG \+ detailAnchor\.gx/);
  assert.match(html, /if \(grid\[currentLayerCell\] !== ID\.BLD \|\| bldGrid\[currentLayerCell\] !== bi\) continue/);
  assert.match(html, /composition\.facade\.forEach\(\(assetId, index\) =>/);
  assert.match(html, /steampunkAssetStamps:/);
  assert.match(html, /steampunkSteamCells:/);
  assert.match(html, /steampunkPipeCells:/);
  assert.match(html, /steampunkGearCells:/);
  assert.match(html, /steampunkGantryCells:/);
  assert.match(html, /mapSkin:ACTIVE_MAP_SKIN \? ACTIVE_MAP_SKIN\.id : 'legacy'/);
});
