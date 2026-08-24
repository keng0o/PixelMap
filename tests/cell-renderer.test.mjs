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

test('standalone testだけ設定を閉じて地図を全画面表示できる', () => {
  assert.match(html, /id="settingsCloseBtn"[\s\S]*?aria-label="設定を閉じる"[\s\S]*?hidden>－<\/button>/);
  assert.match(html, /id="settingsOpenBtn"[\s\S]*?aria-label="設定を開く"[\s\S]*?>＋<\/button>/);
  assert.match(html, /\.settings-toggle\{[\s\S]*?position:fixed;[\s\S]*?top:max\(14px,[\s\S]*?right:max\(14px,[\s\S]*?width:44px;[\s\S]*?height:44px/);
  assert.match(html, /function setStandaloneSettingsCollapsed\(collapsed\)/);
  assert.match(html, /if \(EMBEDDED \|\| CAPTURE_MODE\) return/);
  assert.match(html, /if \(!EMBEDDED && !CAPTURE_MODE\)/);
  assert.match(html, /classList\.toggle\('settings-collapsed', collapsed\)/);
  assert.match(html, /settingsToolbar\.inert = collapsed/);
  assert.match(html, /body\.settings-collapsed \.map-frame\{[\s\S]*?position:fixed;[\s\S]*?width:100vw;[\s\S]*?height:100dvh/);
  assert.match(html, /body\.settings-collapsed canvas\{[\s\S]*?width:max\(100dvw, 100dvh\)/);
  assert.match(html, /body\.settings-collapsed #settingsOpenBtn\{ display:block; \}/);
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
  assert.match(oneMapHtml, /v=20260823-1/);
  assert.equal((twoMapHtml.match(/v=20260823-1/g) || []).length, 2);
  assert.equal((fourMapHtml.match(/v=20260823-1/g) || []).length, 4);
  assert.match(fourMapShellHtml, /height-stack-four-map\.html\?v=20260823-2/);
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
  assert.match(html, /function paintSolidMapCell\(gx, gy, color, layer, stats\)/);
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
  assert.match(html, /styleProfile:CELL_ONLY_MODE \? 'standard-pixel-art' : 'standard'/);
});

test('細分化しても公園・建物の意味分類は96セル基準を維持する', () => {
  assert.match(html, /const semanticS = STANDARD_GRID \/ extent/);
  assert.match(html, /return Math\.abs\(twiceArea\) \* \.5 \* semanticS \* semanticS/);
  assert.match(html, /geomAreaCells:Math\.abs\(unit\.signed\) \* \(STANDARD_GRID \/ buildingExtent\) \*\* 2/);
});

test('セルモードの地形・交通・建物は専用ピクセルアート経路を使う', () => {
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawCellPixelArtSurfaceGrid\(grid, option, cellRenderingStats/);
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawCellPixelArtTransportGrid\([\s\S]*?transportCenters\.get\(option\), transportRailNormals\.get\(option\)/);
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
  assert.match(html, /function traverse\(x0, y0, x1, y1, visit\)/);
  assert.match(html, /const transportCenters = new Map\(\)/);
  assert.match(html, /setCell\(center, cx, cy, 1\)/);
  assert.match(html, /minimumMinorRoute \? 1 : detailCellSpan\(thick \? 2 : 1\)/);
  assert.match(html, /c\.lineWidth = lineWidth \* CELL_DETAIL_SCALE/);
});

test('交通線のセル走査はセル角の終点を越えて架空の線を延長しない', () => {
  const source = html.match(/  function traverse\(x0, y0, x1, y1, visit\)\{[\s\S]*?\n  \}\n  function lineStamp/)?.[0]
    .replace(/\n  function lineStamp[\s\S]*$/u, '');
  assert.ok(source, 'traverse実装を取得できる');
  const traverse = Function('RG', 'EMBEDDED', `'use strict';\n${source}\nreturn traverse;`)(258, false);
  const cells = [];
  // 川崎駅南西の線路で架空線を発生させていた、セル角が終点になる実座標。
  traverse(2.875, 218.125, 5, 215, (x, y) => cells.push([x, y]));
  assert.deepEqual(cells.at(-1), [5, 215]);
  assert.ok(cells.every(([x, y]) => x >= 2 && x <= 5 && y >= 215 && y <= 218));
  assert.ok(cells.slice(1).every(([x, y], index) =>
    Math.abs(x - cells[index][0]) + Math.abs(y - cells[index][1]) === 1));
  assert.match(source, /!EMBEDDED && cx === ex/);
  assert.match(source, /!EMBEDDED && cy === ey/);
});

test('交通を縁・面・中央線と鉄道路盤・レール・枕木へ分ける', () => {
  assert.match(html, /function drawCellPixelArtTransportGrid\([\s\S]*?railNormalGrid = null, bridge = false/);
  assert.match(html, /const color = minimumMinorRoute[\s\S]*?: boundary \? edge : fill/);
  assert.match(html, /paintSolidMapCell\(x, y, color, option, stats\)/);
  assert.match(html, /paintSolidMapCell\(x, y, roadStyle\.center/);
  assert.match(html, /for \(const offset of \[-1,1\]\)/);
  assert.match(html, /paintSolidMapCell\(tx, ty, P\.tie/);
  assert.match(html, /positiveModulo\(wx \+ wy \* 3, span\)/);
});

test('standalone testの鉄道は全種別を合成して側面2線だけ描く', () => {
  const source = html.match(/function quantizedRailNormal\(x0, y0, x1, y1\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(source, '線路法線の量子化実装を取得できる');
  const normalFor = Function(`'use strict';\n${source}\nreturn quantizedRailNormal;`)();
  assert.deepEqual(normalFor(0, 0, 4, 0), [0, 1]);
  assert.deepEqual(normalFor(0, 0, 0, 4), [-1, 0]);
  assert.deepEqual(normalFor(0, 0, 4, 4), [-1, 1]);
  assert.deepEqual(normalFor(0, 4, 4, 0), [1, 1]);
  assert.match(html, /const transportRailNormals = new Map\(\)/);
  assert.match(html, /CELL_ONLY_MODE && !EMBEDDED && id === ID\.RAIL/);
  assert.match(html, /const tangentRadius = 4/);
  assert.match(html, /const continuity = normal\[0\] \* previousNormal\[0\] \+ normal\[1\] \* previousNormal\[1\]/);
  assert.match(html, /if \(continuity < 0\) normal = \[-normal\[0\], -normal\[1\]\]/);
  assert.match(html, /else if \(continuity === 0\) normal = previousNormal/);
  assert.match(html, /railNormals\.x\[centerIndex\] = normalX/);
  assert.match(html, /const hasSourceNormal = normalX !== 0 \|\| normalY !== 0/);
  assert.match(html, /x \+ normalX \* offset/);
  assert.match(html, /y \+ normalY \* offset/);
  assert.match(html, /const standaloneParallelRails = rail && !EMBEDDED && railNormalGrid/);
  assert.match(html, /const standaloneRailLayerKeys = !EMBEDDED && CELL_ONLY_MODE/);
  assert.match(html, /o\.rail \? \['rail', 'bridge:rail'\] : \[\]/);
  assert.match(html, /o\.railTunnels \? \['railTunnels'\] : \[\]/);
  assert.match(html, /standaloneRailComposite\.grid, 'rail', cellRenderingStats/);
  assert.match(html, /option === 'rail' \|\| option === 'railTunnels'/);
  assert.match(html, /standaloneRailComposite && option === 'rail'/);
  assert.match(html, /if \(!standaloneParallelRails\)\{[\s\S]*?paintSolidMapCell\(x, y, color, option, stats\)/);
  assert.match(html, /if \(!sourceNormalRails\)\{[\s\S]*?paintSolidMapCell\(tx, ty, P\.tie[\s\S]*?paintRailPair\(x, y, useHorizontal\)/);
  assert.match(html, /const parallelSideBoundary = \(x, y\) => \{[\s\S]*?normalProjection >= 1 && tangentProjection <= \.25/);
  assert.match(html, /if \(sourceNormalRails\)\{[\s\S]*?const boundary = !has\(x-1,y\) \|\| !has\(x\+1,y\) \|\| !has\(x,y-1\) \|\| !has\(x,y\+1\)[\s\S]*?!parallelSideBoundary\(x, y\)[\s\S]*?paintSolidMapCell\(x, y, P\.rail/);
  assert.doesNotMatch(html, /transportCenterPhases|standaloneTiePeriod|tieAnchor/);
});

test('standalone testの地区幹線道路は中央線を描かない', () => {
  assert.match(html, /const hideRegionalRoadCenter = !EMBEDDED && option === 'regionalRoads'/);
  assert.match(html, /if \(roadStyle\?\.center && !hideRegionalRoadCenter\)/);
  assert.doesNotMatch(html, /function boundaryAlignedRoadCenter/);
});

test('建物は棟ごとの屋根・壁・影・施設記号を原子セルで描く', () => {
  assert.match(html, /function drawCellPixelArtBuildingGrid\(grid, bldGrid, buildingKinds, buildingDescs, buildingAnchors, layer, stats\)/);
  assert.match(html, /paintDarkenedMapCell\(x, y, \.68/);
  assert.match(html, /if \(!below\)[\s\S]*?P\.wall/);
  assert.match(html, /kind === 'hospital'/);
  assert.match(html, /kind === 'convenience'/);
  assert.match(html, /kind === 'mixed'/);
  assert.match(html, /kind === 'poi' && desc\?\.glyph/);
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
    'buildingDetailCells','spriteCells','layerCells',
  ])
    assert.match(html, new RegExp(`${field}:`), field);
  assert.match(html, /cellLogicalPixels:CELL_ONLY_MODE \? MAP_CELL_LOGICAL_SIZE : null/);
  assert.match(html, /cellScenePixels:CELL_ONLY_MODE \? CPX : null/);
});
