((global) => {
  'use strict';

  const version = 'pixelmap-top-down-materials/6';

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
    'building-blue-hipped-02': {
      family: 'building',
      nativeSize: [72, 64],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 510, y: 592, width: 72, height: 64 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(22% 27%, 74% 19%, 85% 33%, 82% 61%, 92% 68%, 86% 81%, 71% 77%, 25% 83%, 14% 63%)',
      fitBounds: { minX: 10, minY: 12, maxX: 66, maxY: 53 },
      palette: {
        ink: '#233747',
        inkSoft: '#40596a',
        shade: '#425f79',
        shadeDark: '#2b455e',
        light: '#5a89a6',
        highlight: '#8d9fa3',
        shadow: '#344b43',
      },
      silhouette: [[16, 17], [53, 12], [61, 21], [59, 39], [66, 43], [62, 51],
        [51, 49], [18, 53], [10, 40]],
      facets: [
        { role: 'highlight', points: [[16, 17], [53, 12], [57, 21], [15, 28]] },
        { role: 'shadeDark', points: [[15, 28], [57, 21], [59, 39], [18, 46], [10, 40]] },
        { role: 'light', points: [[18, 46], [59, 39], [66, 43], [62, 51], [51, 49], [18, 53], [10, 40]] },
        { role: 'shade', points: [[53, 12], [61, 21], [59, 39], [57, 21]] },
      ],
      shadowHalf: 'lower-right',
      inkSegments: [
        { axis: 'longest-edge', from: [15, 28], to: [57, 21], width: 2.1, role: 'ridge',
          parts: [[0, .4], [.49, 1]] },
        { axis: 'longest-edge', from: [21, 22], to: [49, 17], width: 1, role: 'shade-seam',
          parts: [[0, .55], [.67, 1]] },
        { axis: 'longest-edge', from: [23, 32], to: [49, 28], width: .9, role: 'shade-seam',
          parts: [[0, .37], [.49, .73], [.82, 1]] },
        { axis: 'longest-edge', from: [19, 38], to: [50, 33], width: 1.1, role: 'weather-mark',
          parts: [[0, .46], [.57, 1]] },
        { axis: 'longest-edge', from: [22, 48], to: [48, 44], width: 1, role: 'light-seam',
          parts: [[0, .62], [.74, 1]] },
        { axis: 'longest-edge', from: [54, 44], to: [63, 45], width: .9, role: 'highlight' },
      ],
    },
    'building-blue-longhouse-03': {
      family: 'building',
      nativeSize: [60, 50],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 728, y: 490, width: 60, height: 50 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(10% 54%, 70% 30%, 83% 40%, 82% 78%, 23% 94%, 12% 78%)',
      fitBounds: { minX: 6, minY: 15, maxX: 50, maxY: 47 },
      palette: {
        ink: '#203543',
        inkSoft: '#3b5265',
        shade: '#455b78',
        shadeDark: '#293d59',
        light: '#5790b7',
        highlight: '#8eb3c5',
        shadow: '#2c443c',
      },
      silhouette: [[6, 27], [42, 15], [50, 20], [49, 39], [14, 47], [7, 39]],
      facets: [
        { role: 'shade', points: [[6, 27], [42, 15], [47, 21], [10, 33]] },
        { role: 'light', points: [[10, 33], [47, 21], [50, 20], [49, 39], [14, 47], [7, 39]] },
      ],
      shadowHalf: 'lower-right',
      inkSegments: [
        { axis: 'longest-edge', from: [10, 33], to: [47, 21], width: 2.15, role: 'ridge',
          parts: [[0, .43], [.51, 1]] },
        { axis: 'longest-edge', from: [11, 28], to: [40, 18], width: .9, role: 'shade-seam-soft',
          parts: [[0, .32], [.43, .73], [.81, 1]] },
        { axis: 'longest-edge', from: [20, 24], to: [37, 18], width: .75, role: 'highlight',
          parts: [[0, .56], [.69, 1]] },
        { axis: 'longest-edge', from: [13, 37], to: [46, 27], width: .8, role: 'light-seam-soft',
          parts: [[0, .2], [.43, .56], [.82, 1]] },
        { axis: 'longest-edge', from: [15, 43], to: [44, 35], width: .75, role: 'highlight',
          parts: [[0, .3], [.72, .91]] },
        { axis: 'longest-edge', from: [27, 34], to: [37, 31], width: 1.9, role: 'weather-mark',
          parts: [[0, .34], [.48, 1]] },
      ],
    },
    'building-harbor-workshop-04': {
      family: 'building',
      nativeSize: [78, 78],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 500, y: 855, width: 78, height: 78 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(27% 5%, 65% 9%, 83% 23%, 78% 46%, 67% 74%, 63% 90%, 39% 90%, 9% 65%, 10% 31%)',
      fitBounds: { minX: 7, minY: 4, maxX: 65, maxY: 70 },
      palette: {
        ink: '#1d3342',
        inkSoft: '#415666',
        shade: '#394f66',
        shadeDark: '#263b53',
        light: '#415f78',
        highlight: '#86a5b2',
        shadow: '#2d443e',
        tankDark: '#273b55',
        tank: '#446d8f',
        tankLight: '#78a0b5',
        equipment: '#9c765e',
        equipmentLight: '#c19b72',
        roofStrip: '#537e9e',
        roofStripLight: '#7ca2b6',
      },
      silhouette: [[21, 4], [51, 7], [65, 18], [61, 36], [52, 58], [49, 70],
        [30, 70], [7, 51], [8, 24]],
      facets: [
        { role: 'shadeDark', points: [[21, 4], [51, 7], [65, 18], [40, 27], [8, 24]] },
        { role: 'shade', points: [[8, 24], [40, 27], [38, 51], [7, 51]] },
        { role: 'light', points: [[40, 27], [65, 18], [61, 36], [52, 58], [49, 70], [38, 51]] },
        { role: 'shadeDark', points: [[7, 51], [38, 51], [49, 70], [30, 70]] },
      ],
      shadowHalf: 'lower-right',
      inkSegments: [
        { axis: 'longest-edge', from: [10, 24], to: [38, 27], width: 1.2, role: 'shade-seam-soft',
          parts: [[0, .38], [.51, 1]] },
        { axis: 'longest-edge', from: [9, 34], to: [35, 38], width: .9, role: 'shade-seam-soft',
          parts: [[0, .26], [.4, .65], [.78, 1]] },
        { axis: 'longest-edge', from: [10, 46], to: [35, 50], width: 1.05, role: 'weather-mark',
          parts: [[0, .31], [.45, .7], [.82, 1]] },
        { axis: 'longest-edge', from: [37, 54], to: [50, 58], width: .9, role: 'light-seam-soft',
          parts: [[0, .35], [.55, 1]] },
        { axis: 'longest-edge', from: [30, 65], to: [47, 69], width: .9, role: 'highlight',
          parts: [[0, .29], [.49, .73], [.86, 1]] },
        { axis: 'longest-edge', from: [18, 15], to: [40, 18], width: .8, role: 'highlight',
          parts: [[0, .33], [.49, .82]] },
      ],
      fixtures: [
        {
          shape: 'polygon', role: 'roof-strip',
          points: [[12, 20], [24, 12], [31, 17], [25, 43], [14, 52], [8, 44]],
          fill: 'roofStrip', stroke: 'ink',
          inset: [[16, 22], [23, 17], [26, 20], [21, 39], [15, 44], [12, 41]],
          insetFill: 'roofStripLight',
        },
        {
          shape: 'circle', role: 'tank', center: [44, 29], radius: 16,
          fill: 'tankDark', stroke: 'ink', rings: [
            { radius: 12, fill: 'tank' },
            { radius: 7, fill: 'tankLight' },
            { radius: 3.2, fill: 'highlight' },
          ],
        },
        {
          shape: 'polygon', role: 'equipment',
          points: [[27, 45], [43, 47], [46, 61], [29, 60], [25, 53]],
          fill: 'equipment', stroke: 'ink',
          inset: [[30, 48], [40, 49], [42, 57], [30, 56]], insetFill: 'equipmentLight',
        },
      ],
    },
    'building-blue-weathered-05': {
      family: 'building',
      nativeSize: [58, 52],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 726, y: 500, width: 58, height: 52 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(16% 46%, 67% 13%, 85% 31%, 88% 69%, 31% 85%, 16% 60%)',
      fitBounds: { minX: 9, minY: 7, maxX: 51, maxY: 44 },
      palette: {
        ink: '#1d3040',
        inkSoft: '#40556b',
        shade: '#465f7e',
        shadeDark: '#293f5b',
        light: '#5691b9',
        highlight: '#83b3c8',
        shadow: '#30473f',
      },
      silhouette: [[9, 24], [39, 7], [49, 16], [51, 36], [18, 44], [9, 31]],
      facets: [
        { role: 'shade', points: [[9, 24], [39, 7], [49, 16], [47, 20], [12, 31]] },
        { role: 'light', points: [[12, 31], [47, 20], [51, 36], [18, 44], [9, 31]] },
      ],
      shadowHalf: 'lower-right',
      inkSegments: [
        { axis: 'longest-edge', from: [12, 31], to: [47, 20], width: 2.15, role: 'ridge',
          parts: [[0, .38], [.48, .72], [.81, 1]] },
        { axis: 'longest-edge', from: [16, 25], to: [38, 12], width: .85, role: 'shade-seam-soft',
          parts: [[0, .34], [.48, .71], [.82, 1]] },
        { axis: 'longest-edge', from: [21, 20], to: [36, 11], width: .75, role: 'highlight',
          parts: [[0, .43], [.63, 1]] },
        { axis: 'longest-edge', from: [17, 35], to: [48, 26], width: 1.05, role: 'light-seam-soft',
          parts: [[0, .24], [.39, .68], [.79, 1]] },
        { axis: 'longest-edge', from: [20, 41], to: [46, 34], width: .85, role: 'highlight',
          parts: [[0, .28], [.43, .63], [.76, 1]] },
        { axis: 'longest-edge', from: [30, 28], to: [35, 26.5], width: 2.1, role: 'weather-mark',
          parts: [[0, .37], [.53, 1]] },
        { axis: 'longest-edge', from: [38, 25.5], to: [43, 24], width: 1.9, role: 'weather-mark',
          parts: [[0, .44], [.6, 1]] },
      ],
    },
    'road-sandy-local-06': {
      family: 'road',
      nativeSize: [104, 60],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 690, y: 445, width: 104, height: 60 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(4% 23%, 12% 13%, 27% 7%, 31% 2%, 48% 2%, 55% 22%, 59% 35%, 77% 38%, 88% 42%, 94% 48%, 100% 47%, 100% 98%, 0% 98%, 0% 33%)',
      sampleMask: [[4, 14], [12, 8], [28, 4], [32, 1], [50, 1], [57, 13], [61, 21],
        [80, 23], [92, 25], [98, 29], [104, 28], [104, 59], [0, 59], [0, 20]],
      orientation: 'vertical',
      palette: {
        base: '#ede5d3',
        light: '#f7efde',
        wash: '#d7cdbb',
        wear: '#b8aa91',
        wearDark: '#958875',
        edge: '#807663',
      },
      washes: [
        { x: 18, y: 33, rx: 25, ry: 15, role: 'light', alpha: .34 },
        { x: 52, y: 18, rx: 17, ry: 24, role: 'wash', alpha: .2 },
        { x: 74, y: 42, rx: 31, ry: 16, role: 'light', alpha: .24 },
        { x: 96, y: 23, rx: 15, ry: 20, role: 'wash', alpha: .18 },
        { x: 84, y: 58, rx: 27, ry: 8, role: 'wearDark', alpha: .15 },
        { x: 22, y: 58, rx: 23, ry: 7, role: 'wear', alpha: .1 },
      ],
      wearStrokes: [
        { axis: 'along', role: 'wearDark', width: .72, alpha: .24,
          points: [[18, 11], [16, 24], [20, 38], [17, 53]], parts: [[0, .27], [.42, .65], [.78, 1]] },
        { axis: 'along', role: 'light', width: .82, alpha: .34,
          points: [[27, 5], [29, 18], [26, 31], [30, 48]], parts: [[0, .35], [.51, .76], [.88, 1]] },
        { axis: 'along', role: 'wear', width: 1.05, alpha: .34,
          points: [[35, 2], [37, 17], [36, 33], [39, 58]], parts: [[0, .43], [.52, 1]] },
        { axis: 'along', role: 'wear', width: .75, alpha: .25,
          points: [[42, 1], [43, 15], [41, 29], [43, 56]], parts: [[0, .33], [.45, .72], [.82, 1]] },
        { axis: 'along', role: 'light', width: 1.25, alpha: .4,
          points: [[48, 3], [49, 19], [47, 37], [49, 60]], parts: [[0, .39], [.5, 1]] },
        { axis: 'along', role: 'wear', width: .9, alpha: .28,
          points: [[55, 6], [56, 21], [55, 38], [57, 59]], parts: [[0, .29], [.42, .78], [.87, 1]] },
        { axis: 'along', role: 'light', width: .65, alpha: .38,
          points: [[63, 18], [62, 30], [64, 46], [65, 60]], parts: [[0, .47], [.58, 1]] },
        { axis: 'along', role: 'wearDark', width: .9, alpha: .3,
          points: [[73, 3], [70, 16], [74, 32], [72, 51]], parts: [[0, .23], [.38, .7], [.86, 1]] },
        { axis: 'along', role: 'light', width: .68, alpha: .31,
          points: [[88, 18], [91, 29], [87, 42], [90, 57]], parts: [[0, .31], [.47, .69], [.82, 1]] },
        { axis: 'across', role: 'wearDark', width: 1.05, alpha: .31,
          points: [[24, 29], [45, 30], [68, 29], [91, 31]], parts: [[0, .44], [.53, 1]] },
        { axis: 'across', role: 'light', width: 1, alpha: .38,
          points: [[18, 34], [42, 35], [64, 34], [88, 35]], parts: [[0, .38], [.5, .75], [.84, 1]] },
        { axis: 'across', role: 'wearDark', width: .8, alpha: .28,
          points: [[12, 41], [34, 40], [59, 42], [82, 41]], parts: [[0, .25], [.39, .58], [.72, 1]] },
      ],
      specks: [
        { x: 5, y: 24, w: 2, h: 1, edge: 'left' }, { x: 10, y: 29, w: 1, h: 2, edge: 'left' },
        { x: 3, y: 37, w: 1, h: 1, edge: 'left' }, { x: 14, y: 42, w: 2, h: 1, edge: 'left' },
        { x: 7, y: 49, w: 1, h: 2, edge: 'left' }, { x: 18, y: 55, w: 2, h: 1, edge: 'left' },
        { x: 23, y: 50, w: 1, h: 1, edge: 'left' }, { x: 28, y: 57, w: 1, h: 1, edge: 'left' },
        { x: 82, y: 27, w: 1, h: 2, edge: 'right' }, { x: 91, y: 31, w: 2, h: 1, edge: 'right' },
        { x: 99, y: 37, w: 1, h: 2, edge: 'right' }, { x: 88, y: 42, w: 1, h: 1, edge: 'right' },
        { x: 96, y: 48, w: 2, h: 1, edge: 'right' }, { x: 78, y: 52, w: 1, h: 1, edge: 'right' },
        { x: 86, y: 57, w: 1, h: 2, edge: 'right' }, { x: 101, y: 55, w: 1, h: 1, edge: 'right' },
        { x: 31, y: 41, w: 1, h: 1, edge: 'left' }, { x: 72, y: 38, w: 1, h: 1, edge: 'right' },
        { x: 24, y: 22, w: 1, h: 1, edge: 'left' }, { x: 75, y: 31, w: 2, h: 1, edge: 'right' },
        { x: 61, y: 55, w: 2, h: 1, edge: 'right' }, { x: 66, y: 58, w: 1, h: 1, edge: 'right' },
        { x: 71, y: 53, w: 1, h: 2, edge: 'right' }, { x: 76, y: 57, w: 2, h: 1, edge: 'right' },
        { x: 81, y: 54, w: 2, h: 2, edge: 'right' }, { x: 88, y: 56, w: 2, h: 1, edge: 'right' },
        { x: 93, y: 53, w: 1, h: 2, edge: 'right' }, { x: 98, y: 58, w: 2, h: 1, edge: 'right' },
      ],
      gravelClusters: [
        { x: 5, y: 55, marks: [
          { dx: 0, dy: 0, rx: 1.5, ry: .7 }, { dx: 3, dy: -1, rx: .8, ry: .8 },
          { dx: 5, dy: 1, rx: 1.1, ry: .55 }, { dx: 7, dy: -2, rx: .65, ry: .5 },
        ] },
        { x: 16, y: 58, marks: [
          { dx: 0, dy: -1, rx: 1.1, ry: .6 }, { dx: 2, dy: -3, rx: .7, ry: .7 },
          { dx: 4, dy: 0, rx: 1.5, ry: .6 },
        ] },
        { x: 29, y: 55, marks: [
          { dx: 0, dy: 1, rx: 1.4, ry: .7 }, { dx: 2, dy: -1, rx: .65, ry: .5 },
          { dx: 5, dy: 0, rx: .9, ry: .8 }, { dx: 7, dy: 2, rx: .7, ry: .5 },
        ] },
        { x: 43, y: 58, marks: [
          { dx: 0, dy: -2, rx: .8, ry: .6 }, { dx: 2, dy: 0, rx: 1.5, ry: .6 },
          { dx: 5, dy: -1, rx: .7, ry: .8 },
        ] },
        { x: 57, y: 55, marks: [
          { dx: 0, dy: 1, rx: 1.2, ry: .6 }, { dx: 3, dy: -1, rx: .7, ry: .55 },
          { dx: 5, dy: 1, rx: 1.5, ry: .7 }, { dx: 8, dy: -2, rx: .7, ry: .5 },
        ] },
        { x: 71, y: 58, marks: [
          { dx: 0, dy: -1, rx: 1.4, ry: .65 }, { dx: 3, dy: -3, rx: .8, ry: .7 },
          { dx: 5, dy: 0, rx: 1, ry: .55 },
        ] },
        { x: 83, y: 55, marks: [
          { dx: 0, dy: 1, rx: .8, ry: .7 }, { dx: 2, dy: -1, rx: 1.4, ry: .6 },
          { dx: 5, dy: 1, rx: .7, ry: .55 }, { dx: 7, dy: -2, rx: 1.1, ry: .7 },
        ] },
        { x: 96, y: 58, marks: [
          { dx: 0, dy: -2, rx: 1.4, ry: .7 }, { dx: 2, dy: 0, rx: .75, ry: .65 },
          { dx: 5, dy: -1, rx: 1.1, ry: .55 },
        ] },
      ],
    },
    'water-open-ripples-06': {
      family: 'water',
      nativeSize: [120, 90],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 720, y: 850, width: 120, height: 90 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'inset(0)',
      palette: {
        base: '#80c9c5',
        light: '#9dd8d2',
        wash: '#69b9b7',
        ripple: '#397f7d',
        current: '#2f7372',
      },
      washes: [
        { x: 19, y: 22, rx: 27, ry: 18, role: 'light', alpha: .08 },
        { x: 55, y: 18, rx: 21, ry: 31, role: 'wash', alpha: .02 },
        { x: 89, y: 38, rx: 34, ry: 22, role: 'light', alpha: .07 },
        { x: 42, y: 71, rx: 38, ry: 17, role: 'wash', alpha: .06 },
      ],
      rippleStrokes: [
        { role: 'ripple', width: 1.15, alpha: .3,
          points: [[18, 0], [13, 17], [2, 31], [17, 44]], parts: [[0, .43], [.54, 1]] },
        { role: 'ripple', width: .8, alpha: .17,
          points: [[29, 2], [27, 17], [22, 29], [38, 41]], parts: [[0, .32], [.45, .72], [.82, 1]] },
        { role: 'ripple', width: 1.05, alpha: .12,
          points: [[70, 0], [66, 18], [66, 36], [72, 53]], parts: [[0, .38], [.52, 1]] },
        { role: 'ripple', width: .65, alpha: .08,
          points: [[79, 4], [76, 20], [76, 38], [81, 52]], parts: [[0, .31], [.46, .72], [.84, 1]] },
        { role: 'ripple', width: 1.55, alpha: .52,
          points: [[118, 0], [114, 18], [112, 34], [119, 48]], parts: [[0, .45], [.57, 1]] },
        { role: 'light', width: .7, alpha: .23,
          points: [[43, 4], [38, 18], [39, 31], [48, 43]], parts: [[0, .36], [.49, .7], [.82, 1]] },
      ],
      currentMarks: [
        { x: 2, y: 19, dx: 4, dy: -2, width: .8, alpha: .2 },
        { x: 9, y: 25, dx: 4, dy: -3, width: 1, alpha: .25 },
        { x: 18, y: 19, dx: 2, dy: -5, width: .8, alpha: .2 },
        { x: 61, y: 4, dx: 0, dy: 9, width: 1.5, alpha: .42 },
        { x: 53, y: 34, dx: -7, dy: 10, width: 1.4, alpha: .45 },
        { x: 4, y: 58, dx: 1, dy: 3, width: .8, alpha: .18 },
        { x: 35, y: 49, dx: 3, dy: -2, width: .8, alpha: .16 },
        { x: 117, y: 14, dx: -2, dy: 11, width: 1, alpha: .25 },
        { x: 90, y: 62, dx: 1, dy: 3, width: .8, alpha: .12 },
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
    'tree-dark-crown-03': {
      family: 'tree',
      nativeSize: [52, 50],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 528, y: 342, width: 52, height: 50 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(25% 20%, 40% 12%, 58% 14%, 75% 20%, 88% 32%, 92% 50%, 79% 62%, 70% 68%, 55% 76%, 40% 74%, 26% 68%, 21% 58%, 23% 42%)',
      center: [28, 25],
      outline: [[13, 10], [20, 6], [30, 7], [39, 10], [46, 16], [48, 25], [44, 31], [41, 34],
        [36, 35], [29, 38], [21, 37], [14, 34], [11, 29], [12, 21]],
      palette: {
        ink: '#293d35',
        shadow: '#304a39',
        dark: '#3a573d',
        main: '#55764c',
        light: '#7c955f',
        highlight: '#97a96b',
        detailDark: '#38563c',
      },
      crowns: [
        { role: 'shadow', x: 28, y: 27, rx: 20, ry: 18, seed: 201 },
        { role: 'dark', x: 14, y: 24, rx: 8, ry: 12, seed: 211, stroke: false },
        { role: 'dark', x: 22, y: 13, rx: 11, ry: 8, seed: 212, stroke: false },
        { role: 'dark', x: 37, y: 16, rx: 10, ry: 9, seed: 213, stroke: false },
        { role: 'dark', x: 43, y: 27, rx: 7, ry: 11, seed: 214, stroke: false },
        { role: 'dark', x: 34, y: 39, rx: 11, ry: 7, seed: 215, stroke: false },
        { role: 'dark', x: 18, y: 37, rx: 9, ry: 8, seed: 216, stroke: false },
        { role: 'main', x: 22, y: 23, rx: 11, ry: 11, seed: 221, stroke: false },
        { role: 'main', x: 34, y: 20, rx: 12, ry: 10, seed: 222, stroke: false },
        { role: 'main', x: 39, y: 29, rx: 9, ry: 10, seed: 223, stroke: false },
        { role: 'main', x: 30, y: 34, rx: 12, ry: 9, seed: 224, stroke: false },
        { role: 'highlight', x: 30, y: 19, rx: 8, ry: 6, seed: 231 },
        { role: 'highlight', x: 38, y: 26, rx: 6, ry: 5, seed: 232 },
        { role: 'detail', x: 18, y: 26, rx: 5, ry: 7, seed: 241 },
        { role: 'detail', x: 33, y: 34, rx: 5, ry: 4, seed: 242 },
        { role: 'detail', x: 27, y: 39, rx: 4, ry: 3, seed: 243 },
        { role: 'detail', x: 41, y: 22, rx: 3, ry: 5, seed: 244 },
      ],
      inkMarks: [
        [[13, 19], [17, 16]], [[31, 10], [35, 13]], [[42, 19], [46, 23]],
        [[42, 33], [38, 36]], [[26, 40], [30, 42]], [[13, 33], [18, 36]],
        [[21, 26], [25, 30]],
      ],
      glint: false,
    },
    'tree-multi-crown-04': {
      family: 'tree',
      nativeSize: [76, 76],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 100, y: 378, width: 76, height: 76 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(10% 18%, 23% 8%, 40% 5%, 54% 11%, 68% 6%, 82% 15%, 88% 29%, 86% 41%, 97% 60%, 90% 76%, 74% 89%, 54% 93%, 39% 87%, 23% 93%, 9% 82%, 3% 64%, 10% 49%, 2% 35%)',
      center: [38, 40],
      baseRadius: 36,
      outline: [[7, 14], [17, 6], [30, 4], [41, 8], [52, 4], [62, 11], [67, 22],
        [65, 31], [75, 45], [69, 58], [56, 68], [41, 71], [29, 66], [17, 71],
        [6, 62], [2, 48], [7, 37], [1, 26]],
      palette: {
        ink: '#263c35',
        shadow: '#294638',
        dark: '#35533d',
        main: '#557648',
        light: '#87a861',
        highlight: '#a8ba74',
        detailDark: '#34513a',
      },
      crowns: [
        { role: 'shadow', cluster: 'upper', x: 38, y: 20, rx: 34, ry: 17, seed: 301, stroke: false },
        { role: 'dark', cluster: 'upper', x: 21, y: 15, rx: 15, ry: 11, seed: 302 },
        { role: 'dark', cluster: 'upper', x: 40, y: 13, rx: 15, ry: 10, seed: 303 },
        { role: 'main', cluster: 'upper', x: 60, y: 18, rx: 15, ry: 12, seed: 304 },
        { role: 'shadow', cluster: 'left', x: 13, y: 42, rx: 15, ry: 21, seed: 311, stroke: false },
        { role: 'dark', cluster: 'left', x: 8, y: 31, rx: 10, ry: 12, seed: 312 },
        { role: 'main', cluster: 'left', x: 14, y: 48, rx: 15, ry: 16, seed: 313 },
        { role: 'shadow', cluster: 'center', x: 40, y: 46, rx: 34, ry: 26, seed: 321, stroke: false },
        { role: 'dark', cluster: 'center', x: 54, y: 49, rx: 22, ry: 19, seed: 322, stroke: false },
        { role: 'main', cluster: 'center', x: 38, y: 43, rx: 32, ry: 24, seed: 323 },
        { role: 'highlight', cluster: 'center', x: 37, y: 39, rx: 24, ry: 18, seed: 324, stroke: false },
        { role: 'highlight', cluster: 'center', x: 30, y: 34, rx: 13, ry: 9, seed: 325, stroke: false },
        { role: 'detail', cluster: 'center', x: 26, y: 48, rx: 8, ry: 10, seed: 326 },
        { role: 'detail', cluster: 'center', x: 52, y: 35, rx: 7, ry: 8, seed: 327 },
        { role: 'detail', cluster: 'center', x: 46, y: 56, rx: 8, ry: 6, seed: 328 },
      ],
      inkMarks: [
        [[14, 20], [19, 16]], [[35, 9], [40, 12]], [[55, 11], [61, 15]],
        [[7, 35], [12, 40]], [[19, 52], [24, 48]], [[30, 25], [35, 29]],
        [[50, 28], [55, 32]], [[55, 49], [60, 45]], [[35, 56], [40, 52]],
      ],
      glint: false,
    },
    'tree-underbrush-cluster-05': {
      family: 'tree',
      nativeSize: [54, 46],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 207, y: 594, width: 54, height: 46 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(4% 54%, 11% 46%, 20% 50%, 28% 39%, 37% 43%, 44% 35%, 54% 43%, 61% 33%, 70% 43%, 78% 41%, 82% 50%, 83% 56%, 80% 62%, 74% 66%, 70% 74%, 63% 67%, 54% 76%, 44% 67%, 33% 76%, 24% 70%, 13% 74%, 6% 67%)',
      center: [27, 27],
      baseRadius: 23,
      drawScale: [.87, .9],
      outline: [[2, 25], [6, 21], [11, 23], [15, 18], [20, 20], [24, 16], [29, 20],
        [33, 15], [38, 20], [42, 19], [46, 23], [48, 22], [48, 28], [46, 31],
        [43, 29], [39, 35], [34, 31], [29, 35], [24, 31], [18, 35], [13, 32],
        [7, 34], [3, 31]],
      palette: {
        ink: '#334435',
        shadow: '#3d573e',
        dark: '#587348',
        main: '#82a756',
        light: '#a9c76a',
        highlight: '#c2d888',
        detailDark: '#4c6b40',
      },
      crowns: [
        { role: 'shadow', cluster: 'base', x: 27, y: 29, rx: 25, ry: 7, seed: 401, stroke: false },
        { role: 'dark', cluster: 'left', x: 10, y: 27, rx: 9, ry: 7, seed: 411 },
        { role: 'dark', cluster: 'center', x: 26, y: 26, rx: 12, ry: 8, seed: 412 },
        { role: 'dark', cluster: 'right', x: 42, y: 27, rx: 6.5, ry: 6, seed: 413 },
        { role: 'main', cluster: 'left', x: 9, y: 24, rx: 9, ry: 6, seed: 421 },
        { role: 'main', cluster: 'left', x: 20, y: 23, rx: 10, ry: 7, seed: 422 },
        { role: 'main', cluster: 'center', x: 31, y: 22, rx: 10, ry: 7, seed: 423 },
        { role: 'main', cluster: 'right', x: 42, y: 24, rx: 6, ry: 5.5, seed: 424 },
        { role: 'highlight', cluster: 'left', x: 15, y: 21, rx: 7, ry: 4, seed: 431 },
        { role: 'highlight', cluster: 'center', x: 30, y: 20, rx: 8, ry: 4, seed: 432 },
        { role: 'highlight', cluster: 'right', x: 42, y: 22, rx: 3.5, ry: 2.5, seed: 433 },
        { role: 'detail', cluster: 'center', x: 25, y: 28, rx: 5, ry: 3, seed: 441 },
      ],
      inkMarks: [
        [[5, 25], [9, 22]], [[16, 20], [20, 18]], [[27, 21], [31, 18]],
        [[38, 21], [42, 19]], [[12, 30], [17, 32]], [[29, 31], [34, 29]],
        [[42, 29], [46, 27]],
      ],
      glint: false,
    },
    'tree-small-crown-02': {
      family: 'tree',
      nativeSize: [48, 48],
      source: {
        reference: 'Photo 1.jpg',
        crop: { x: 270, y: 344, width: 48, height: 48 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(48% 10%, 65% 14%, 79% 25%, 89% 42%, 91% 58%, 83% 75%, 67% 87%, 49% 92%, 31% 85%, 16% 77%, 9% 62%, 11% 45%, 20% 28%, 33% 17%)',
      center: [24, 25],
      outline: [[23, 5], [31, 7], [38, 12], [42, 18], [44, 25], [41, 32], [37, 38],
        [31, 42], [24, 44], [17, 41], [10, 37], [6, 30], [5, 23], [9, 16], [15, 9]],
      palette: {
        ink: '#2b4038',
        shadow: '#31493c',
        dark: '#415940',
        main: '#637a50',
        light: '#81945d',
        highlight: '#9dab6c',
        detailDark: '#354e3b',
      },
      crowns: [
        { role: 'shadow', x: 26, y: 28, rx: 17, ry: 15, seed: 102 },
        { role: 'main', x: 23, y: 24, rx: 19, ry: 18, seed: 111 },
        { role: 'main', x: 29, y: 26, rx: 11, ry: 12, seed: 112 },
        { role: 'dark', x: 14, y: 24, rx: 6, ry: 6, seed: 121 },
        { role: 'dark', x: 22, y: 12, rx: 5, ry: 4, seed: 122 },
        { role: 'dark', x: 35, y: 26, rx: 6, ry: 7, seed: 123 },
        { role: 'dark', x: 26, y: 37, rx: 5, ry: 5, seed: 124 },
        { role: 'highlight', x: 23, y: 24, rx: 10, ry: 9, seed: 131 },
        { role: 'highlight', x: 14, y: 15, rx: 5, ry: 5, seed: 132 },
        { role: 'highlight', x: 31, y: 15, rx: 5, ry: 4, seed: 133 },
        { role: 'highlight', x: 12, y: 32, rx: 4, ry: 5, seed: 134 },
        { role: 'detail', x: 19, y: 23, rx: 3, ry: 3, seed: 141 },
        { role: 'detail', x: 28, y: 27, rx: 3, ry: 4, seed: 142 },
      ],
      inkMarks: [
        [[10, 18], [14, 15]], [[30, 10], [34, 13]], [[37, 23], [40, 27]],
        [[12, 34], [17, 37]], [[23, 26], [27, 24]],
      ],
      glint: [14.5, 13],
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

  function traceFixtureCircle(ctx, fixture, mapper, seedOffset = 0, radius = fixture.radius) {
    const points = [];
    const count = 18;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * 2 * index / count;
      const wobble = .965 + unit(seedOffset + fixture.radius, index + 31) * .07;
      points.push(mapper([
        fixture.center[0] + Math.cos(angle) * radius * wobble,
        fixture.center[1] + Math.sin(angle) * radius * wobble,
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

  function paintBuildingFixtures(ctx, asset, mapper, seed) {
    const palette = asset.palette;
    for (const fixture of asset.fixtures || []) {
      if (fixture.shape === 'circle') {
        traceFixtureCircle(ctx, fixture, mapper, seed);
        ctx.fillStyle = palette[fixture.fill];
        ctx.fill();
        ctx.strokeStyle = palette[fixture.stroke];
        ctx.lineWidth = 1.65;
        ctx.stroke();
        for (const ring of fixture.rings || []) {
          traceFixtureCircle(ctx, fixture, mapper, seed + ring.radius * 11, ring.radius);
          ctx.fillStyle = palette[ring.fill];
          ctx.globalAlpha = ring.radius < 5 ? .82 : .94;
          ctx.fill();
          ctx.strokeStyle = ring.radius < 5 ? palette.highlight : palette.inkSoft;
          ctx.lineWidth = ring.radius < 5 ? .65 : .9;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        continue;
      }
      if (fixture.shape === 'polygon') {
        tracePolygon(ctx, fixture.points, mapper);
        ctx.fillStyle = palette[fixture.fill];
        ctx.fill();
        ctx.strokeStyle = palette[fixture.stroke];
        ctx.lineWidth = 1.4;
        ctx.stroke();
        if (fixture.inset) {
          tracePolygon(ctx, fixture.inset, mapper);
          ctx.fillStyle = palette[fixture.insetFill];
          ctx.globalAlpha = .78;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
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
      ctx.fillStyle = palette[facet.role] || (facet.role === 'light' ? palette.light : palette.shade);
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
      const parts = segment.parts || [[0, 1]];
      for (const [start, end] of parts) {
        const interpolate = ratio => [
          segment.from[0] + (segment.to[0] - segment.from[0]) * ratio,
          segment.from[1] + (segment.to[1] - segment.from[1]) * ratio,
        ];
        const from = mapper(interpolate(start));
        const to = mapper(interpolate(end));
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(to[0], to[1]);
        const soft = segment.role.endsWith('-soft');
        ctx.strokeStyle = segment.role === 'highlight' ? palette.highlight :
          segment.role === 'weather-mark' ? palette.ink : soft ? palette.inkSoft : palette.shadeDark;
        ctx.lineWidth = segment.width;
        ctx.lineCap = 'round';
        ctx.globalAlpha = segment.role === 'highlight' ? .72 : soft ? .58 : .9;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    paintBuildingFixtures(ctx, asset, mapper, seed);
  }

  function paintTree(ctx, asset, mapper, seed = 0) {
    const palette = asset.palette;
    const pointMapper = asset.drawScale
      ? point => mapper([
        asset.center[0] + (point[0] - asset.center[0]) * asset.drawScale[0],
        asset.center[1] + (point[1] - asset.center[1]) * asset.drawScale[1],
      ])
      : mapper;
    const colors = {
      shadow: palette.shadow,
      dark: palette.dark,
      main: palette.main,
      highlight: palette.light,
      detail: palette.detailDark,
    };
    tracePolygon(ctx, asset.outline, pointMapper);
    ctx.fillStyle = palette.shadow;
    ctx.fill();
    ctx.save();
    tracePolygon(ctx, asset.outline, pointMapper);
    ctx.clip();
    for (const crown of asset.crowns) {
      traceBlob(ctx, crown, pointMapper, seed);
      ctx.fillStyle = colors[crown.role];
      ctx.globalAlpha = crown.role === 'shadow' ? .82 : crown.role === 'highlight' ? .9 : 1;
      ctx.fill();
      if (crown.stroke !== false && (crown.role === 'dark' || crown.role === 'main')) {
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
      const from = pointMapper(mark[0]);
      const to = pointMapper(mark[1]);
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
    }
    if (asset.glint !== false) {
      const glint = pointMapper(asset.glint || [18.5, 20]);
      const glintRadius = Math.max(.65,
        Math.hypot(...pointMapper([1, 0]).map((value, index) => value - pointMapper([0, 0])[index])) * 1.1);
      ctx.fillStyle = palette.highlight;
      ctx.globalAlpha = .65;
      ctx.beginPath();
      ctx.arc(glint[0], glint[1], glintRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    tracePolygon(ctx, asset.outline, pointMapper);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.globalAlpha = .88;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function mappedLength(mapper, length) {
    const origin = mapper([0, 0]);
    const mapped = mapper([length, 0]);
    return Math.max(.4, Math.hypot(mapped[0] - origin[0], mapped[1] - origin[1]));
  }

  function paintMaterialWash(ctx, wash, palette, mapper) {
    const center = mapper([wash.x, wash.y]);
    const radiusX = mappedLength(mapper, wash.rx);
    const origin = mapper([0, 0]);
    const vertical = mapper([0, wash.ry]);
    const radiusY = Math.max(.4, Math.hypot(vertical[0] - origin[0], vertical[1] - origin[1]));
    ctx.beginPath();
    ctx.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = palette[wash.role] || palette.wash;
    ctx.globalAlpha = wash.alpha;
    ctx.fill();
  }

  function traceMaterialStroke(ctx, stroke, mapper) {
    const points = stroke.points.map(mapper);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    if (points.length === 4) {
      ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
      return;
    }
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index];
      const next = points[index + 1];
      ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
    }
    const last = points.at(-1);
    ctx.lineTo(last[0], last[1]);
  }

  function paintMaterialStroke(ctx, stroke, palette, mapper) {
    traceMaterialStroke(ctx, stroke, mapper);
    ctx.strokeStyle = palette[stroke.role] || palette.wear || palette.ripple;
    ctx.lineWidth = mappedLength(mapper, stroke.width || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.alpha ?? .35;
    ctx.setLineDash(stroke.parts ? [mappedLength(mapper, 11), mappedLength(mapper, 2.5),
      mappedLength(mapper, 3), mappedLength(mapper, 4)] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function paintRoadMaterial(ctx, asset, mapper) {
    const palette = asset.palette;
    tracePolygon(ctx, asset.sampleMask, mapper);
    ctx.save();
    ctx.clip();
    const topLeft = mapper([0, 0]);
    const bottomRight = mapper(asset.nativeSize);
    ctx.fillStyle = palette.base;
    ctx.fillRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
    for (const wash of asset.washes) paintMaterialWash(ctx, wash, palette, mapper);
    for (const stroke of asset.wearStrokes) paintMaterialStroke(ctx, stroke, palette, mapper);
    for (const [clusterIndex, cluster] of asset.gravelClusters.entries()) {
      for (const [markIndex, mark] of cluster.marks.entries()) {
        const center = mapper([cluster.x + mark.dx, cluster.y + mark.dy]);
        const radiusX = mappedLength(mapper, mark.rx);
        const origin = mapper([0, 0]);
        const vertical = mapper([0, mark.ry]);
        const radiusY = Math.max(.35, Math.hypot(vertical[0] - origin[0], vertical[1] - origin[1]));
        ctx.beginPath();
        ctx.ellipse(center[0], center[1], radiusX, radiusY,
          (clusterIndex + markIndex) % 3 === 0 ? -.18 : .12, 0, Math.PI * 2);
        ctx.fillStyle = markIndex % 3 === 0 ? palette.edge : palette.wearDark;
        ctx.globalAlpha = mark.alpha ?? (.35 + ((clusterIndex + markIndex) % 3) * .08);
        ctx.fill();
      }
    }
    ctx.fillStyle = palette.wearDark;
    for (const speck of asset.specks) {
      const point = mapper([speck.x, speck.y]);
      ctx.globalAlpha = speck.edge === 'right' ? .37 : .31;
      ctx.fillRect(point[0], point[1], mappedLength(mapper, speck.w), mappedLength(mapper, speck.h));
    }
    ctx.restore();
    tracePolygon(ctx, asset.sampleMask, mapper);
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = mappedLength(mapper, .7);
    ctx.globalAlpha = .32;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function paintWaterMaterial(ctx, asset, mapper) {
    const palette = asset.palette;
    const topLeft = mapper([0, 0]);
    const bottomRight = mapper(asset.nativeSize);
    ctx.fillStyle = palette.base;
    ctx.fillRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
    for (const wash of asset.washes) paintMaterialWash(ctx, wash, palette, mapper);
    for (const stroke of asset.rippleStrokes) paintMaterialStroke(ctx, stroke, palette, mapper);
    ctx.strokeStyle = palette.current;
    ctx.lineCap = 'round';
    for (const mark of asset.currentMarks) {
      const from = mapper([mark.x, mark.y]);
      const to = mapper([mark.x + mark.dx, mark.y + mark.dy]);
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.lineWidth = mappedLength(mapper, mark.width || .8);
      ctx.globalAlpha = mark.alpha ?? .25;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function paintAsset(ctx, assetId, { x = 0, y = 0, scale = 1, seed = 0 } = {}) {
    const asset = catalog[assetId];
    if (!asset) return false;
    ctx.save();
    const mapper = point => [x + point[0] * scale, y + point[1] * scale];
    if (asset.family === 'building') paintBuilding(ctx, asset, mapper, seed);
    else if (asset.family === 'tree') paintTree(ctx, asset, mapper, seed);
    else if (asset.family === 'road') paintRoadMaterial(ctx, asset, mapper, seed);
    else if (asset.family === 'water') paintWaterMaterial(ctx, asset, mapper, seed);
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
    const scale = radius / (asset.baseRadius || 18);
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
