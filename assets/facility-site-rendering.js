(function(root){
  'use strict';

  const MODES = Object.freeze(['current','surface','precise','clean','none']);
  const MODE_SET = new Set(MODES);

  function comparisonMode(params, embedded){
    const requested = params?.get?.('facility-site-mode');
    const enabled = Boolean(embedded) && params?.get?.('facility-site-compare') === '1' &&
      MODE_SET.has(requested);
    return Object.freeze({ enabled, mode:enabled ? requested : 'current' });
  }

  function effectiveMode(comparison){
    if (comparison?.enabled && MODE_SET.has(comparison.mode)) return comparison.mode;
    return 'surface';
  }

  function cleanAtomicFootprint(grid, buildingGrid, size){
    const cleanedGrid = grid.slice();
    const cleanedBuildingGrid = buildingGrid.slice();
    let changedCells = 0;
    const indexOf = (x, y) => y * size + x;

    for (let y = 1; y < size - 1; y++){
      for (let x = 1; x < size - 1; x++){
        const index = indexOf(x, y);
        const featureId = buildingGrid[index];
        const neighborCounts = new Map();
        const cardinalCounts = new Map();
        for (let dy = -1; dy <= 1; dy++){
          for (let dx = -1; dx <= 1; dx++){
            if (!dx && !dy) continue;
            const neighborId = buildingGrid[indexOf(x + dx, y + dy)];
            if (!neighborId || grid[indexOf(x + dx, y + dy)] === 0) continue;
            neighborCounts.set(neighborId, (neighborCounts.get(neighborId) || 0) + 1);
            if (!dx || !dy)
              cardinalCounts.set(neighborId, (cardinalCounts.get(neighborId) || 0) + 1);
          }
        }

        if (grid[index] !== 0 && featureId){
          const neighbors = neighborCounts.get(featureId) || 0;
          const cardinal = cardinalCounts.get(featureId) || 0;
          if (neighbors <= 2 && cardinal <= 1){
            cleanedGrid[index] = 0;
            cleanedBuildingGrid[index] = 0;
            changedCells++;
          }
          continue;
        }

        const ranked = [...neighborCounts].sort((a, b) =>
          b[1] - a[1] || (cardinalCounts.get(b[0]) || 0) - (cardinalCounts.get(a[0]) || 0) || a[0] - b[0]);
        const [fillId, neighborCount] = ranked[0] || [0, 0];
        const cardinalCount = cardinalCounts.get(fillId) || 0;
        if (fillId && (neighborCount >= 5 || cardinalCount >= 3)){
          let fillValue = 0;
          for (let dy = -1; dy <= 1 && !fillValue; dy++){
            for (let dx = -1; dx <= 1; dx++){
              if (!dx && !dy) continue;
              const neighborIndex = indexOf(x + dx, y + dy);
              if (buildingGrid[neighborIndex] === fillId && grid[neighborIndex]){
                fillValue = grid[neighborIndex];
                break;
              }
            }
          }
          cleanedGrid[index] = fillValue;
          cleanedBuildingGrid[index] = fillId;
          changedCells++;
        }
      }
    }

    return { grid:cleanedGrid, buildingGrid:cleanedBuildingGrid, changedCells };
  }

  const DEFAULT_SURFACE_PALETTE = Object.freeze(['#aaa287','#9a937c','#b8b096']);

  function surfaceColor(worldLogicalX, worldLogicalY, palette = null){
    const colors = Array.isArray(palette) && palette.length >= 3
      ? palette : DEFAULT_SURFACE_PALETTE;
    const phase = ((worldLogicalX * 17 + worldLogicalY * 29) % 43 + 43) % 43;
    if (phase === 0) return colors[2];
    if (phase === 19) return colors[1];
    return colors[0];
  }

  root.PixelMapFacilitySiteRendering = Object.freeze({
    version:'facility-site-rendering/2',
    modes:MODES,
    comparisonMode,
    effectiveMode,
    cleanAtomicFootprint,
    surfaceColor,
  });
})(typeof window !== 'undefined' ? window : globalThis);
