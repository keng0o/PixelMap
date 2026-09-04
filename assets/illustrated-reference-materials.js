((global) => {
  'use strict';

  const version = 'pixelmap-illustrated-reference-materials/6';

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
    'building-red-hipped-annex-01': {
      family: 'building',
      structure: 'hipped-with-annex',
      nativeSize: [61, 52],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 51, y: 498, width: 61, height: 52 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(0% 8%, 87% 8%, 98% 17%, 99% 69%, 89% 80%, 87% 96%, 63% 96%, 59% 85%, 10% 85%, 2% 76%)',
      fitBounds: { minX: 1, minY: 4, maxX: 60, maxY: 49 },
      palette: {
        ink: '#221003',
        inkDeep: '#110300',
        inkSoft: '#623a28',
        upper: '#ee9a7a',
        upperLight: '#e79f77',
        upperHighlight: '#e7b28e',
        upperWash: '#e69776',
        lower: '#b1816c',
        lowerShade: '#a47763',
        lowerLight: '#ca8669',
        left: '#ca8669',
        right: '#a47763',
        annexLeft: '#e09370',
        annexRight: '#a76f5a',
        equipment: '#62614c',
        equipmentLight: '#93977c',
        shadow: '#7f806a',
        shadowLight: '#93977c',
        shadowDark: '#4a4732',
      },
      shadowShapes: [
        { role: 'shadowLight', alpha: .7, blur: 1.05,
          points: [[3, 37], [11, 41], [29, 41], [48, 44], [43, 47], [35, 46], [29, 48], [18, 46], [9, 47], [1, 41]] },
        { role: 'shadow', alpha: .66, blur: 1.25,
          points: [[53, 7], [59, 9], [61, 16], [60, 37], [56, 44], [53, 39], [57, 30]] },
        { role: 'shadowDark', alpha: .28, blur: .8,
          points: [[7, 40], [42, 40], [48, 43], [38, 44], [9, 43]] },
      ],
      shadowMarks: [
        { x: 7, y: 43, w: 4, h: 2, role: 'shadowDark', alpha: .28 },
        { x: 14, y: 45, w: 3, h: 1.4, role: 'shadow', alpha: .52 },
        { x: 21, y: 43, w: 4, h: 2, role: 'shadowDark', alpha: .24 },
        { x: 29, y: 46, w: 3, h: 1.3, role: 'shadow', alpha: .5 },
        { x: 36, y: 44, w: 4, h: 1.5, role: 'shadowDark', alpha: .24 },
        { x: 56, y: 14, w: 3, h: 3, role: 'shadowDark', alpha: .33 },
        { x: 58, y: 23, w: 3, h: 2, role: 'shadowLight', alpha: .52 },
        { x: 56, y: 34, w: 4, h: 3, role: 'shadowDark', alpha: .3 },
      ],
      mainOutline: [[2, 5], [53, 5], [57, 10], [57, 34], [52, 40], [49, 42],
        [7, 42], [2, 36], [1, 10]],
      mainFacets: [
        { role: 'upper', points: [[3, 6], [53, 6], [48, 23.5], [9.5, 23.5]] },
        { role: 'lower', points: [[9.5, 23.5], [48, 23.5], [49, 36], [40, 41], [7, 41], [3, 35]] },
        { role: 'left', points: [[3, 6], [9.5, 23.5], [3, 35], [1, 33], [1, 10]] },
        { role: 'right', points: [[53, 6], [57, 10], [57, 34], [52, 40], [48, 23.5]] },
      ],
      annexOutline: [[38, 42], [44, 33], [52, 40], [52, 49], [39, 49]],
      annexFacets: [
        { role: 'annexLeft', points: [[38, 42], [44, 33], [45, 42], [39, 49]] },
        { role: 'annexRight', points: [[44, 33], [52, 40], [52, 49], [45, 42]] },
      ],
      ridgeSegments: [
        { role: 'ridge', from: [9.5, 23.5], to: [48, 23.5], width: 1.3,
          points: [[9.5, 23.5], [20, 23.1], [31, 23.7], [40, 23.2], [48, 23.5]] },
        { role: 'hip', from: [3, 6], to: [9.5, 23.5], width: .9,
          points: [[3, 6], [5.5, 12], [7.7, 18.2], [9.5, 23.5]] },
        { role: 'hip', from: [53, 6], to: [48, 23.5], width: .9,
          points: [[53, 6], [51.2, 12.5], [49.4, 18.2], [48, 23.5]] },
        { role: 'hip', from: [3, 35], to: [9.5, 23.5], width: .85,
          points: [[3, 35], [5.3, 31.2], [7.6, 27], [9.5, 23.5]] },
        { role: 'hip', from: [52, 40], to: [48, 23.5], width: .9,
          points: [[52, 40], [50.8, 34], [49.4, 28], [48, 23.5]] },
        { role: 'annex-ridge', from: [44, 33], to: [45, 48], width: .85,
          points: [[44, 33], [44.7, 39], [45, 48]] },
      ],
      washes: [
        { role: 'upperHighlight', x: 26, y: 12, rx: 21, ry: 5, alpha: .24 },
        { role: 'upperWash', x: 40, y: 18, rx: 11, ry: 4, alpha: .18 },
        { role: 'lowerLight', x: 19, y: 31, rx: 12, ry: 7, alpha: .14 },
        { role: 'lowerShade', x: 38, y: 34, rx: 10, ry: 5, alpha: .17 },
        { role: 'equipmentLight', x: 55, y: 18, rx: 4, ry: 9, alpha: .12 },
      ],
      textureMarks: [
        { from: [18, 11], to: [34, 11], role: 'upperLight', alpha: .28, width: .55 },
        { from: [31, 16], to: [45, 16], role: 'upperWash', alpha: .24, width: .65 },
        { from: [14, 28], to: [25, 29], role: 'lowerLight', alpha: .22, width: .7 },
        { from: [29, 34], to: [42, 34], role: 'lowerShade', alpha: .17, width: .65 },
        { from: [6, 17], to: [7, 28], role: 'upperLight', alpha: .22, width: .65 },
        { from: [54, 16], to: [55, 28], role: 'inkSoft', alpha: .18, width: .7 },
      ],
      grainMarks: [
        { x: 13, y: 8, w: 7, h: 1.2, role: 'upperHighlight', alpha: .18 },
        { x: 24, y: 10, w: 12, h: 1.1, role: 'upperHighlight', alpha: .14 },
        { x: 39, y: 8, w: 8, h: 1.3, role: 'upperWash', alpha: .13 },
        { x: 17, y: 16, w: 9, h: 1, role: 'upperWash', alpha: .12 },
        { x: 31, y: 19, w: 10, h: 1.2, role: 'upperHighlight', alpha: .13 },
        { x: 12, y: 27, w: 8, h: 1.2, role: 'lowerLight', alpha: .13 },
        { x: 23, y: 31, w: 12, h: 1, role: 'lowerShade', alpha: .12 },
        { x: 35, y: 37, w: 8, h: 1.2, role: 'lowerLight', alpha: .1 },
        { x: 5, y: 15, w: 1.2, h: 7, role: 'upperHighlight', alpha: .12 },
        { x: 55, y: 13, w: 1.2, h: 7, role: 'equipmentLight', alpha: .13 },
      ],
      equipment: {
        outer: [[7, 20], [12, 19], [14, 21], [14, 26], [8, 26], [7, 24]],
        inner: [[9, 21], [12, 21], [12, 25], [9, 25]],
      },
    },
    'tree-round-canopy-01': {
      family: 'tree',
      structure: 'round-irregular-canopy',
      nativeSize: [36, 34],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 195, y: 539, width: 36, height: 34 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(17% 38%, 22% 23%, 31% 9%, 62% 8%, 73% 17%, 84% 31%, 87% 57%, 100% 67%, 100% 85%, 73% 91%, 37% 88%, 22% 72%)',
      fitBounds: { minX: 5, minY: 2, maxX: 36, maxY: 32 },
      pixelHaloAlpha: .25,
      palette: {
        ink: '#14200e',
        inkDeep: '#030a00',
        inkSoft: '#303d25',
        crown: '#8baa82',
        crownLight: '#aac79e',
        crownPale: '#adc99f',
        crownMid: '#7f9e78',
        crownShade: '#5f7657',
        crownDark: '#394b31',
        shadow: '#8a927a',
        shadowLight: '#adb095',
        shadowDark: '#68705c',
      },
      crownOutline: [[9, 9], [11, 5], [14, 3], [18, 3], [20, 4], [22, 3], [24, 6],
        [27, 6], [29, 9], [30, 13], [30, 18], [28, 21], [27, 24], [24, 26],
        [20, 28], [14, 27], [11, 25], [8, 23], [7, 19], [7, 14]],
      pixelPalette: {
        0: '#040e00', 1: '#121a03', 2: '#212d09', 3: '#353512',
        4: '#273a1b', 5: '#36472a', 6: '#484323', 7: '#3d5834',
        8: '#55502e', 9: '#545d40', A: '#516f48', B: '#63644e',
        C: '#647958', D: '#727551', E: '#768a67', F: '#8c886b',
        G: '#859473', H: '#7d9f78', I: '#979b78', J: '#a5a581',
        K: '#94b289', L: '#afb38f', M: '#a7c59c', N: '#bebe97',
        O: '#b5d3ab', P: '#cacaa0', Q: '#d1d2ad', R: '#ddd8aa',
        S: '#dbe1b4', T: '#e8ddb8', U: '#e5e9b9', V: '#efecc5',
      },
      shadowPixelRows: [
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '..............................JINRS.',
        '..............................JINQRS',
        '..............................JINSSS',
        '..............................JJPSSS',
        '.............................KMLNVRT',
        '.............................LMMPSV.',
        '.............................NPNTT..',
        '............................LNQJP...',
        '............................MMSG....',
        '...........................KOMS.....',
        '..........................EGPI......',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
      ],
      shadowAlphaRows: {
        18: .1, 19: .14, 20: .2, 21: .26, 22: .3, 23: .27,
        24: .23, 25: .19, 26: .15, 27: .1, 28: .06,
      },
      pixelRows: [
        '....................................',
        '....................................',
        '....................................',
        '...........LLNDB6JTF86..............',
        '..........E623151550209.............',
        '..........0DJ25OF41BN2B.............',
        '.........F0EOKKMMKKMM7154...........',
        '........B04JOMKEAKEKHA2522..........',
        '.......J19IOC5AAE27KAAKOMA0.........',
        '.......I1DMO57HMMAKMEAACKE2.........',
        '........E0COE5KOMOMMKCA4GE40........',
        '........C0AL91HMMMKHKKK7HKC0........',
        '........07KE5KKOMKM7EM74KM90........',
        '.......0EMMKOMMMMMMEAHA7EE11........',
        '.......1HMMACMKKKCE77E55GG25J.......',
        '........HOA0797MH422CKEGGC47GL......',
        '........4KECC05MHC5GGBBE5119FE......',
        '........0EKOK574HKGG5195049DFF......',
        '........0855EE7AKA0725C91BGFFI......',
        '.........3207KHHH4215GGE14EGEF......',
        '..........41HHHKHHCCEEE507GGE.......',
        '..........414CHEEH72A9404EGGI.......',
        '..........I911C54B110119EIGG........',
        '............B10100599CEEEGGG........',
        '............LB6DD8FFFFFFIFII........',
        '.............JFIIFFFFFFFIFF.........',
        '..............IEEIEGGGGGGG..........',
        '..............GIGGGGEEGGG...........',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
        '....................................',
      ],
    },
    'building-gabled-side-wing-02': {
      family: 'building',
      structure: 'gabled-with-side-wing',
      renderMode: 'pixel-runs',
      nativeSize: [40, 52],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 82, y: 420, width: 40, height: 52 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(0% 38%, 65% 11%, 76% 14%, 96% 33%, 96% 52%, 85% 58%, 85% 71%, 73% 79%, 58% 77%, 48% 71%, 30% 83%, 17% 77%, 7% 67%, 5% 54%, 0% 46%)',
      fitBounds: { minX: 0, minY: 6, maxX: 39, maxY: 48 },
      pixelHaloAlpha: .2,
      pixelPalette: {
        0: '#0f0500', 1: '#231002', 2: '#411604', 3: '#2a250e',
        4: '#412f1a', 5: '#363c25', 6: '#5f2f1c', 7: '#464621',
        8: '#4e4331', 9: '#56523a', A: '#784834', B: '#685c45',
        C: '#707154', D: '#8f614f', E: '#828067', F: '#a2725c',
        G: '#ad7c68', H: '#928f79', I: '#a2a284', J: '#c6907a',
        K: '#e2916d', L: '#b1b08f', M: '#df9c7e', N: '#ef9875',
        O: '#d6a58e', P: '#f29f86', Q: '#bfc09b', R: '#cfcfa9',
        S: '#daddb2', T: '#e2e5ba', U: '#eaebc4', V: '#f6f3d8',
      },
      shadowPixelRows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '..................................H.....',
        '...............................30HQR....',
        '............................62018HLQC...',
        '.........................C800399IIIRQB..',
        '....QL.................EB101BH55EHIQSRQ.',
        '....RLQRH1..........0193005EHH83CHLLRSS.',
        '....QQTQQB04D4...HHH80005CHHEHC5CLLQQB3.',
        '....QQRQSQ80008EIEHIE85CC59HHHI84ILQ50..',
        '....QQTTRRQB8BCHEBCHHHEHH95EHIL94QQE0E..',
        '....RQTTTRRQIC53359ELIHIIH39ILQH7QSECQ..',
        '....TRVRUTRQQEECBCEILIELIH5EQQRL7QSQCI..',
        '....SRLCQUTRLEELHHQQLQ7CILEIRRSE9UTL1E..',
        '.....R97SQHQSEIQQQQQRR34QI39STTCESUSC...',
        '......QRU94RRRQQQQSRRT8CTE0CUVQ4IUTTS...',
        '.......UTCCTSSRRSRRUTI5LU53LVU89RVT.....',
        '........VUSTUSUSSUUQC5EVE0CUVC..........',
        '................CIQIIRLI3...............',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
      ],
      shadowAlphaRows: {
        31: .08, 32: .12, 33: .18, 34: .24, 35: .3, 36: .32,
        37: .34, 38: .34, 39: .32, 40: .3, 41: .27, 42: .24,
        43: .2, 44: .16, 45: .12, 46: .08, 47: .05,
      },
      pixelRows: [
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '.........................UTS............',
        '.......................01ISUVV..........',
        '.....................16G22TULQS.........',
        '...................02FJOF0HE05LT........',
        '..................2DJOJOJ21053CSS.......',
        '................09JOOOJMOD02EE7ITU......',
        '..............16FMMMNNKPJMA1BE1BTU......',
        '............01DGJMKKKKKKJMG2111HIER.....',
        '..........12DOMMMMKNNKMMMMOB11LI15QS....',
        '........11AJJOMMMMNPPNKMOMJD10IH09BLS...',
        '......306GMPPPNNNNNNNKMMOJD211BH335LRR..',
        '.....03EOOPMKPNNNNKNPNJMG61AE80EQILSRR..',
        '...01BJOMMNNKNNKKNMPPMJA26DGGD13IRRRRR..',
        '.313FJOOKMNNNNNNKNMMJG66DGGGFG809QRRRR..',
        '81AJMMPNNNNKKKMKMPMJA2AFGFFGFGF41ERRRR..',
        '17OJMMNPNNKNNNMMMMFAADFFFGGFFGGF13ISQR..',
        'B1FOPNNNNNMMMMOOJGADGGFGGFFFFFGG609QRR..',
        'Q12JKNPPNNKMMMGDAFFFGFFGFDFGGFFFD23IRL..',
        'UH0AJMMPMMOOGAAAAGGFGFFFFGGFFFFGB03IRR..',
        '.RA2FJPMMPJD62AGGGFGFA66AAADFGB410BLQT..',
        '.SL14OOOJF626DGGFFGFA6AAA41484103CILLQ..',
        '..SE1DOGA26DGGGGFFGGAAADFGB41008HHHIL...',
        '..SQ44D12AFGGGFGGFGF6DF6DJJFD60BEHH.....',
        '..VRH018DGGGGFGGFGGFAFFD6JJJMF03EH......',
        '..IRQ30BGFFFFGFFFFGA6FFF6AJJJJ909E......',
        '..5QLE13DFFGFGFGFFG66GFFD2FJMMH31E......',
        '...TSQB08HGGFGGGFGF26GFFG62JOF930H......',
        '...TQIQ41BFFJFGFGG61AGFFGF2662018H......',
        '...RLLQC03FFJFGGDB108EEHEC800399II......',
        '...SQLRQ40ADDGGG400009EEB101BH55EH......',
        '....RLQRH10BFGB305C80193005EHH83C.......',
        '.....QTQQB04D413BH..80005CHHEHC5........',
        '......RQSQ80008EI....85CC59HHHI.........',
        '.......TRRQB8BCH......EHH95EHI..........',
        '........TRRQIC5.........................',
        '.........TRQQE..........................',
        '...........RL...........................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
        '........................................',
      ],
    },
    'tree-overlapping-trio-02': {
      family: 'tree',
      structure: 'overlapping-trio',
      renderMode: 'pixel-runs',
      nativeSize: [54, 50],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 345, y: 112, width: 54, height: 50 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(50% 14%, 72% 14%, 85% 24%, 89% 36%, 87% 48%, 81% 54%, 87% 62%, 87% 72%, 80% 78%, 69% 78%, 61% 70%, 57% 58%, 50% 60%, 37% 60%, 28% 54%, 24% 44%, 28% 36%, 39% 30%, 43% 20%)',
      fitBounds: { minX: 13, minY: 7, maxX: 51, maxY: 43 },
      pixelHaloAlpha: .25,
      pixelPalette: {
        0: '#030e00', 1: '#0a1b02', 2: '#1b2308', 3: '#1a3b15',
        4: '#273015', 5: '#363e1e', 6: '#2a4d24', 7: '#424b2c',
        8: '#42563c', 9: '#555c36', A: '#446d39', B: '#556547',
        C: '#686e4a', D: '#5b7e53', E: '#6e7f64', F: '#7a805c',
        G: '#74976c', H: '#868d6f', I: '#859d7c', J: '#989f7c',
        K: '#8db783', L: '#a8b089', M: '#96b992', N: '#b8bf97',
        O: '#a6ce9b', P: '#c5cca4', Q: '#aedbb5', R: '#d0d7ae',
        S: '#d6dbbc', T: '#dce3b5', U: '#e5e9c5', V: '#efedd5',
      },
      shadowPixelRows: [
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '.......................................D6EK...........',
        '.................................OKGGGKGAIIE..........',
        '............................HEMEDKGAA6DDDIJ60H........',
        '......................QM8DGG802DIMK663AD38818HE.......',
        '...................MOQQME181447044GGKID30118IEH4F.....',
        '...................MIIGD381115I200DKII60478IHIH2FP....',
        '...................E6333DE41BHHF118GB8B1011BHHH4FNS...',
        '..................DIDD66GI818HHB08G631ADE7207JE4H8F...',
        '..................4CHI78E802CEHC4CE3DBBGEBB10CE4C5C...',
        '..................724700138EHHHB177BGIEGE2572HH0HNR...',
        '..................J7124748HHHHF2BHBGGEEGD3B50IE2JVU...',
        '..................PH79EJLHHHHJH2BH6BIGGGEB810HE0JSS...',
        '.................PLHCJIHHHJHFHH26GBDIEEGE7384BE1HSU...',
        '.................NPJIEEEHHJHHJI22B8EBB8E618H4EJ2CSS...',
        '.................RNNJF7555BHHJJC200485257EH55HJ57SS...',
        '..................PPHNJHF97HLJNNIH70BE758HB1BHH92LP...',
        '...................SJPLLJLLJLLNPRNH05HE50444EIJE2JS...',
        '....................FNNPNLLLNPJHRNLC14415117HEHH4HU...',
        '.....................NRPNPPPRRJ9JPJJ7108EEEEE7CL7C....',
        '......................PF7NPRPPTF9NLLJCCIIEHHIHHJB.....',
        '.......................9HPPRTRTNHNPLJHJEHEHHFHHJ......',
        '.........................UPJNTPTTLLNLHHIHHFFHH8.......',
        '............................CPRRRFFPNLJLHHHFJJ........',
        '...............................RTL9NRCHNJJJ...........',
        '..................................CJRF................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
      ],
      shadowAlphaRows: {
        18: .08, 19: .1, 20: .14, 21: .18, 22: .22, 23: .26,
        24: .28, 25: .3, 26: .3, 27: .3, 28: .28, 29: .27,
        30: .26, 31: .24, 32: .22, 33: .2, 34: .18, 35: .16,
        36: .14, 37: .12, 38: .1, 39: .08, 40: .06, 41: .04, 42: .03,
      },
      pixelRows: [
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '..........................NPRRLB275511JB..............',
        '.........................NCJN950EOBDD3110.............',
        '........................PFCRF4EEKOMDIG17I7............',
        '.......................UVNPSN1GPOD617GEIOI29..........',
        '......................TTSSSNB1AODAAGE3AADM57R.........',
        '......................VUURSC09IMAKOOKADD6G18PP........',
        '......................NLPRP7DSG36IQOOKOAAD10FR........',
        '.....................7209VP5DOAGKKOOKGMGGKI17PN.......',
        '....................207C4FF1EPMMADOOOODADDOB1BL.......',
        '..................521EMO84B0IO6DAKOOOI3KK6KK33I.......',
        '................40210KUM20G06KGKKOKAGGAGAAOA0BLJ......',
        '...............57IOEDGDG8701BOOKKOG366DD6EKB18LH......',
        '..............PB7NI8IGAM8B8GMOO3DOKGGGKGAIIE1BLE......',
        '..............NB1ED38MQI6BIIHEMEDKGAA6DDDIJ60HJ7......',
        '.............RE18IKOMKQM8DGG802DIMK663AD38818HE.......',
        '.............RN76OMMOQQME181447044GGKID30118IEH.......',
        '..............N28IIMIIGD381115I200DKII60478IHIH.......',
        '..............P7424E6333DE41BHHF118GB8B1011BHH........',
        '..............FRJ1DIDD66GI818HHB08G631ADE7207.........',
        '...............HN74CHI78E802CEHC4CE3DBBGEBB1..........',
        '................FL724700138EHHHB177BGIEGE257..........',
        '.................FJ7124748HHHHF2BHBGGEEGD3B50.........',
        '...................H79EJLHHHH..2BH6BIGGGEB810H........',
        '...............................26GBDIEEGE7384BE.......',
        '................................2B8EBB8E618H4EJ.......',
        '................................200485257EH55HJ.......',
        '................................IH70BE758HB1BHH.......',
        '.................................NH05HE50444EIJ.......',
        '.................................NLC14415117HEH.......',
        '..................................JJ7108EEEEE7........',
        '...................................LJCCIIEHHI.........',
        '....................................JHJEHEHH..........',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
        '......................................................',
      ],
    },
  });

  function tracePolygon(ctx, points, mapper) {
    const first = mapper(points[0]);
    ctx.beginPath();
    ctx.moveTo(first[0], first[1]);
    for (let index = 1; index < points.length; index += 1) {
      const point = mapper(points[index]);
      ctx.lineTo(point[0], point[1]);
    }
    ctx.closePath();
  }

  function paintPolygon(ctx, points, mapper, fill, stroke = null, width = 1) {
    tracePolygon(ctx, points, mapper);
    ctx.fillStyle = fill;
    ctx.fill();
    if (!stroke) return;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function paintWash(ctx, wash, mapper, palette) {
    const center = mapper([wash.x, wash.y]);
    const edgeX = mapper([wash.x + wash.rx, wash.y]);
    const edgeY = mapper([wash.x, wash.y + wash.ry]);
    ctx.beginPath();
    ctx.ellipse(center[0], center[1], Math.abs(edgeX[0] - center[0]), Math.abs(edgeY[1] - center[1]), 0, 0, Math.PI * 2);
    ctx.fillStyle = palette[wash.role];
    ctx.globalAlpha = wash.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function paintBuilding(ctx, asset, mapper) {
    const palette = asset.palette;
    for (const shadow of asset.shadowShapes) {
      ctx.save();
      ctx.filter = `blur(${shadow.blur}px)`;
      ctx.globalAlpha = shadow.alpha;
      paintPolygon(ctx, shadow.points, mapper, palette[shadow.role]);
      ctx.restore();
    }
    for (const mark of asset.shadowMarks) {
      const point = mapper([mark.x, mark.y]);
      const size = mapper([mark.x + mark.w, mark.y + mark.h]);
      ctx.fillStyle = palette[mark.role];
      ctx.globalAlpha = mark.alpha;
      ctx.fillRect(point[0], point[1], size[0] - point[0], size[1] - point[1]);
    }
    ctx.globalAlpha = 1;

    paintPolygon(ctx, asset.mainOutline, mapper, palette.lower, palette.inkDeep, 2.35);
    ctx.save();
    tracePolygon(ctx, asset.mainOutline, mapper);
    ctx.clip();
    for (const facet of asset.mainFacets) paintPolygon(ctx, facet.points, mapper, palette[facet.role]);
    for (const wash of asset.washes) paintWash(ctx, wash, mapper, palette);
    for (const mark of asset.textureMarks) {
      const from = mapper(mark.from);
      const to = mapper(mark.to);
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.strokeStyle = palette[mark.role];
      ctx.lineWidth = mark.width;
      ctx.globalAlpha = mark.alpha;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    for (const grain of asset.grainMarks) {
      const point = mapper([grain.x, grain.y]);
      const size = mapper([grain.x + grain.w, grain.y + grain.h]);
      ctx.fillStyle = palette[grain.role];
      ctx.globalAlpha = grain.alpha;
      ctx.fillRect(point[0], point[1], size[0] - point[0], size[1] - point[1]);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    tracePolygon(ctx, asset.mainOutline, mapper);
    ctx.strokeStyle = palette.inkDeep;
    ctx.lineWidth = 2.35;
    ctx.lineJoin = 'round';
    ctx.stroke();

    for (const segment of asset.ridgeSegments.filter(segment => segment.role !== 'annex-ridge')) {
      const points = (segment.points || [segment.from, segment.to]).map(mapper);
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let index = 1; index < points.length - 1; index += 1) {
        const point = points[index];
        const next = points[index + 1];
        ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
      }
      const last = points.at(-1);
      ctx.lineTo(last[0], last[1]);
      ctx.strokeStyle = segment.role === 'ridge' ? palette.ink : palette.inkSoft;
      ctx.lineWidth = segment.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    paintPolygon(ctx, asset.annexOutline, mapper, palette.annexRight, palette.inkDeep, 2.15);
    for (const facet of asset.annexFacets) paintPolygon(ctx, facet.points, mapper, palette[facet.role]);
    const annexRidge = asset.ridgeSegments.find(segment => segment.role === 'annex-ridge');
    const annexPoints = annexRidge.points.map(mapper);
    ctx.beginPath();
    ctx.moveTo(annexPoints[0][0], annexPoints[0][1]);
    ctx.quadraticCurveTo(annexPoints[1][0], annexPoints[1][1], annexPoints[2][0], annexPoints[2][1]);
    ctx.strokeStyle = palette.inkSoft;
    ctx.lineWidth = annexRidge.width;
    ctx.lineCap = 'round';
    ctx.stroke();
    tracePolygon(ctx, asset.annexOutline, mapper);
    ctx.strokeStyle = palette.inkDeep;
    ctx.lineWidth = 2.15;
    ctx.stroke();

    paintPolygon(ctx, asset.equipment.outer, mapper, palette.ink, palette.inkDeep, .8);
    paintPolygon(ctx, asset.equipment.inner, mapper, palette.equipmentLight, palette.equipment, .6);
  }

  function paintPixelRows(ctx, rows, palette, mapper, rowAlphas = null) {
    rows.forEach((row, rowIndex) => {
      ctx.globalAlpha = rowAlphas?.[rowIndex] ?? 1;
      let runStart = 0;
      while (runStart < row.length) {
        const symbol = row[runStart];
        let runEnd = runStart + 1;
        while (runEnd < row.length && row[runEnd] === symbol) runEnd += 1;
        if (symbol !== '.') {
          const from = mapper([runStart, rowIndex]);
          const to = mapper([runEnd, rowIndex + 1]);
          ctx.fillStyle = palette[symbol];
          ctx.fillRect(from[0], from[1], to[0] - from[0], to[1] - from[1]);
        }
        runStart = runEnd;
      }
    });
    ctx.globalAlpha = 1;
  }

  function paintPixelMaterial(ctx, asset, mapper) {
    paintPixelRows(ctx, asset.shadowPixelRows, asset.pixelPalette, mapper, asset.shadowAlphaRows);
    ctx.save();
    ctx.filter = 'blur(.55px)';
    ctx.globalAlpha = asset.pixelHaloAlpha;
    paintPixelRows(ctx, asset.pixelRows, asset.pixelPalette, mapper);
    ctx.restore();
    paintPixelRows(ctx, asset.pixelRows, asset.pixelPalette, mapper);
  }

  function paintTree(ctx, asset, mapper) {
    paintPixelMaterial(ctx, asset, mapper);
  }

  function paintAsset(ctx, assetId, { x = 0, y = 0, scale = 1 } = {}) {
    const asset = catalog[assetId];
    if (!asset) return false;
    const mapper = point => [x + point[0] * scale, y + point[1] * scale];
    ctx.save();
    if (asset.renderMode === 'pixel-runs') paintPixelMaterial(ctx, asset, mapper);
    else if (asset.family === 'building') paintBuilding(ctx, asset, mapper);
    else if (asset.family === 'tree') paintTree(ctx, asset, mapper);
    ctx.restore();
    return true;
  }

  global.PixelMapIllustratedReferenceMaterials = Object.freeze({
    version,
    catalog,
    paintAsset,
  });
})(typeof window !== 'undefined' ? window : globalThis);
