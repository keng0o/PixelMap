(function(global){
  'use strict';

  const VERSION = 'pixelmap-steampunk-map-assets/1';
  const PALETTE_TOKENS = Object.freeze([
    'outline','iron','ironLight','ironDark','rust','rustDark','copper','copperLight',
    'brass','brick','brickDark','steam','steamShade','glass','warning',
  ]);

  const freezeCells = cells => Object.freeze(cells.map(cell => Object.freeze([...cell])));
  const makeSprite = (id, kind, draw) => {
    const pixels = new Map();
    const put = (x, y, token) => pixels.set(`${x},${y}`, [x, y, token]);
    const rect = (x, y, width, height, token) => {
      for (let py = y; py < y + height; py++)
        for (let px = x; px < x + width; px++) put(px, py, token);
    };
    const frame = (x, y, width, height, token) => {
      rect(x, y, width, 1, token); rect(x, y + height - 1, width, 1, token);
      rect(x, y, 1, height, token); rect(x + width - 1, y, 1, height, token);
    };
    const line = (x0, y0, x1, y1, token) => {
      const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
      let x = x0, y = y0;
      while (true){
        put(x, y, token);
        if (x === x1 && y === y1) break;
        if (x !== x1) x += dx;
        if (y !== y1) y += dy;
      }
    };
    draw({put,rect,frame,line});
    const cells = [...pixels.values()];
    const xs = cells.map(cell => cell[0]), ys = cells.map(cell => cell[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return Object.freeze({
      id,kind,semantic:false,anchor:Object.freeze([0,0]),cells:freezeCells(cells),
      bounds:Object.freeze({minX,maxX,minY,maxY,width:maxX-minX+1,height:maxY-minY+1}),
    });
  };

  const sprites = Object.freeze({
    'boiler-stack':makeSprite('boiler-stack','roof',({put,rect,frame}) => {
      frame(-5,-7,11,7,'outline'); rect(-4,-6,9,5,'brick');
      rect(-4,-3,9,2,'brickDark'); rect(-2,-11,4,4,'outline'); rect(-1,-12,2,5,'rustDark');
      rect(-1,-13,2,1,'rust'); put(-3,-4,'brass'); put(3,-4,'brass'); put(0,-2,'ironDark');
    }),
    'gas-holder':makeSprite('gas-holder','roof',({put,rect,line}) => {
      const spans = [[-3,7],[-5,11],[-6,13],[-6,13],[-5,11],[-3,7]];
      spans.forEach(([x,width], row) => rect(x,-9+row,width,1,row < 2 ? 'ironLight' : 'iron'));
      for (const x of [-5,0,5]) line(x,-7,x,0,'outline');
      rect(-5,-1,11,1,'ironDark'); put(-6,-5,'brass'); put(6,-5,'brass');
    }),
    'gear-tower':makeSprite('gear-tower','roof',({put,rect,frame,line}) => {
      frame(-3,-9,7,9,'outline'); rect(-2,-8,5,7,'ironDark');
      for (const [x,y] of [[0,-13],[-3,-12],[3,-12],[-5,-9],[5,-9],[-3,-6],[3,-6],[0,-5]]) put(x,y,'brass');
      rect(-2,-11,5,5,'rustDark'); put(0,-9,'brass');
      line(-4,-5,-4,0,'iron'); line(4,-5,4,0,'iron');
    }),
    'water-tank':makeSprite('water-tank','roof',({put,rect,frame,line}) => {
      frame(-5,-10,11,5,'outline'); rect(-4,-9,9,3,'copper');
      rect(-3,-10,7,1,'copperLight'); rect(-2,-5,5,1,'rustDark');
      for (const x of [-3,3]) line(x,-4,x,0,'ironDark');
      line(-3,-3,3,0,'iron'); line(3,-3,-3,0,'iron'); put(0,-7,'brass');
    }),
    'pipe-organ':makeSprite('pipe-organ','facade',({put,rect,line}) => {
      const heights = [6,10,8,13,9,11];
      heights.forEach((height,index) => {
        const x = -6 + index * 2;
        rect(x,-height,2,height,'outline'); rect(x+1,-height+1,1,height-2,index % 2 ? 'copper' : 'rust');
        put(x,-height-1,'brass'); put(x+1,-height-1,'brass');
      });
      line(-6,-2,5,-2,'ironLight');
    }),
    'duct-crown':makeSprite('duct-crown','roof',({put,rect,frame,line}) => {
      frame(-7,-6,15,4,'outline'); rect(-6,-5,13,2,'iron');
      rect(-7,-9,4,3,'outline'); rect(-6,-8,2,2,'copper');
      rect(4,-8,4,2,'outline'); rect(5,-7,2,1,'rust');
      line(-5,-2,-5,0,'ironDark'); line(5,-2,5,0,'ironDark'); put(0,-4,'brass');
    }),
    'turbine-hall':makeSprite('turbine-hall','roof',({put,rect,line}) => {
      rect(-8,-2,17,3,'outline'); rect(-7,-4,15,2,'brickDark');
      for (let x = -7; x <= 5; x += 4){
        line(x,-4,x+2,-7,'ironLight'); line(x+2,-7,x+4,-4,'outline');
        put(x+2,-6,'glass');
      }
      rect(-6,-1,13,1,'rust');
    }),
    'steam-plume':makeSprite('steam-plume','steam',({put,rect}) => {
      rect(-1,-3,3,3,'steamShade'); rect(-3,-6,5,3,'steam');
      rect(0,-8,5,3,'steam'); rect(-4,-10,5,3,'steam');
      put(-5,-9,'steamShade'); put(5,-7,'steamShade'); put(2,-11,'steamShade');
    }),
    'pipe-bridge':makeSprite('pipe-bridge','corridor',({put,rect,line}) => {
      for (const x of [-7,7]){
        rect(x,-8,2,9,'outline'); rect(x+1,-7,1,7,'iron');
        line(x,-5,x+(x < 0 ? 4 : -4),-1,'ironDark');
      }
      rect(-7,-9,16,3,'outline'); rect(-6,-8,14,1,'copper');
      rect(-6,-6,14,1,'rustDark'); put(0,-8,'brass'); put(0,-6,'brass');
    }),
    'valve-station':makeSprite('valve-station','corridor',({put,rect,line}) => {
      rect(-4,-3,9,4,'outline'); rect(-3,-2,7,2,'ironDark');
      for (const [x,y] of [[0,-8],[-3,-7],[3,-7],[-4,-4],[4,-4],[-3,-1],[3,-1],[0,0]]) put(x,y,'brass');
      rect(-2,-6,5,5,'rustDark'); put(0,-4,'ironLight');
      line(0,-3,0,0,'copper');
    }),
    'rail-gantry':makeSprite('rail-gantry','rail',({put,rect,line}) => {
      for (const x of [-7,7]){
        rect(x,-11,2,12,'outline'); rect(x+1,-10,1,10,'iron');
      }
      rect(-7,-12,16,3,'outline'); rect(-6,-11,14,1,'ironLight');
      line(-5,-9,5,-1,'ironDark'); line(5,-9,-5,-1,'ironDark');
      rect(-3,-10,3,3,'rustDark'); put(-2,-9,'warning');
      rect(2,-10,3,3,'rustDark'); put(3,-9,'glass');
    }),
    'cooling-outlet':makeSprite('cooling-outlet','surface',({put,rect,frame,line}) => {
      frame(-6,-5,12,5,'outline'); rect(-5,-4,10,3,'ironDark');
      rect(-3,-7,7,3,'outline'); rect(-2,-6,5,2,'copper');
      line(0,-4,0,0,'rust'); put(-4,-2,'glass'); put(4,-2,'glass');
      rect(-6,0,13,1,'steamShade');
    }),
  });

  const roofPools = Object.freeze({
    band1:Object.freeze(['boiler-stack','duct-crown','pipe-organ']),
    band2:Object.freeze(['boiler-stack','gas-holder','water-tank','duct-crown','turbine-hall']),
    band3:Object.freeze(['gas-holder','gear-tower','water-tank','pipe-organ','turbine-hall']),
    band4:Object.freeze(['gear-tower','boiler-stack','gas-holder','water-tank','pipe-organ','turbine-hall']),
  });
  const facadePool = Object.freeze(['pipe-organ','duct-crown','valve-station']);
  const steamPool = Object.freeze(['steam-plume']);
  const protectedKinds = new Set(['religious_shinto','religious_buddhist','racecourse']);
  const stableSeed = value => ((Number(value) || 0) % 0x7fffffff + 0x7fffffff) % 0x7fffffff;
  const pick = (pool, seed, index) => pool[(stableSeed(seed) + index * 17) % pool.length];

  function compositionFor({ seed = 0, band = 1, areaClass = 'S', kind = 'normal' } = {}){
    if (protectedKinds.has(kind)) return Object.freeze({
      enabled:false,semantic:false,sourceGeometryImmutable:true,complexity:0,
      roof:Object.freeze([]),facade:Object.freeze([]),steam:Object.freeze([]),
    });
    const areaBonus = areaClass === 'L' ? 2 : areaClass === 'M' ? 1 : 0;
    const complexity = Math.max(1, Math.min(7, Number(band) + areaBonus));
    const roofPool = roofPools[`band${Math.max(1, Math.min(4, Number(band) || 1))}`];
    const roofCount = Math.max(1, complexity);
    const facadeCount = Math.max(1, Math.floor((complexity + 1) / 2));
    const steamCount = Math.max(1, Math.floor(complexity / 2));
    return Object.freeze({
      enabled:true,semantic:false,sourceGeometryImmutable:true,complexity,
      roof:Object.freeze(Array.from({length:roofCount}, (_, index) => pick(roofPool, seed, index))),
      facade:Object.freeze(Array.from({length:facadeCount}, (_, index) => pick(facadePool, seed + 31, index))),
      steam:Object.freeze(Array.from({length:steamCount}, (_, index) => pick(steamPool, seed + 67, index))),
    });
  }

  const corridorPools = Object.freeze({
    rail:Object.freeze(['rail-gantry','pipe-bridge']),
    majorRoads:Object.freeze(['pipe-bridge','valve-station']),
    regionalRoads:Object.freeze(['pipe-bridge','valve-station']),
    localRoads:Object.freeze(['valve-station','pipe-bridge']),
    paths:Object.freeze(['valve-station']),
  });
  const surfacePools = Object.freeze({
    water:Object.freeze(['cooling-outlet','steam-plume']),
    industrial:Object.freeze(['gas-holder','cooling-outlet','pipe-organ']),
  });

  global.PixelMapSteampunkMapAssets = Object.freeze({
    version:VERSION,semantic:false,sourceGeometryImmutable:true,
    paletteTokens:PALETTE_TOKENS,sprites,roofPools,corridorPools,surfacePools,compositionFor,
  });
})(typeof window !== 'undefined' ? window : globalThis);
