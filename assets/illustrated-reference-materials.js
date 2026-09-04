((global) => {
  'use strict';

  const version = 'pixelmap-illustrated-reference-materials/7';

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
        lower: '#b1816c',
        left: '#ca8669',
        right: '#a47763',
        annexLeft: '#e09370',
        annexRight: '#a76f5a',
        equipment: '#62614c',
        equipmentLight: '#93977c',
        shadow: '#7f806a',
      },
      shadowShapes: [
        { role: 'shadow',
          points: [[3, 37], [11, 41], [29, 41], [48, 44], [43, 47], [35, 46], [29, 48], [18, 46], [9, 47], [1, 41]] },
        { role: 'shadow',
          points: [[53, 7], [59, 9], [61, 16], [60, 37], [56, 44], [53, 39], [57, 30]] },
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
      equipment: {
        outer: [[7, 20], [12, 19], [14, 21], [14, 26], [8, 26], [7, 24]],
        inner: [[9, 21], [12, 21], [12, 25], [9, 25]],
      },
    },
    'tree-round-canopy-01': {
      family: 'tree',
      structure: 'round-irregular-canopy',
      renderMode: 'flat-mask',
      nativeSize: [36, 34],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 195, y: 539, width: 36, height: 34 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(17% 38%, 22% 23%, 31% 9%, 62% 8%, 73% 17%, 84% 31%, 87% 57%, 100% 67%, 100% 85%, 73% 91%, 37% 88%, 22% 72%)',
      fitBounds: { minX: 5, minY: 2, maxX: 36, maxY: 32 },
      flatPalette: {
        outline: '#14200e',
        base: '#7f9e78',
        light: '#aac79e',
        shade: '#5f7657',
        shadow: '#8a927a',
      },
      flatFacets: [
        { role: 'light', points: [[8, 14], [11, 6], [17, 3], [24, 5], [29, 11], [26, 16], [19, 15], [13, 19]] },
        { role: 'shade', points: [[15, 18], [24, 15], [30, 18], [26, 25], [20, 28], [12, 25], [10, 22]] },
      ],
      crownOutline: [[9, 9], [11, 5], [14, 3], [18, 3], [20, 4], [22, 3], [24, 6],
        [27, 6], [29, 9], [30, 13], [30, 18], [28, 21], [27, 24], [24, 26],
        [20, 28], [14, 27], [11, 25], [8, 23], [7, 19], [7, 14]],
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
      renderMode: 'flat-mask',
      nativeSize: [40, 52],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 82, y: 420, width: 40, height: 52 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(0% 38%, 65% 11%, 76% 14%, 96% 33%, 96% 52%, 85% 58%, 85% 71%, 73% 79%, 58% 77%, 48% 71%, 30% 83%, 17% 77%, 7% 67%, 5% 54%, 0% 46%)',
      fitBounds: { minX: 0, minY: 6, maxX: 39, maxY: 48 },
      flatPalette: {
        outline: '#231002',
        base: '#c98b72',
        light: '#ef9f82',
        shade: '#ad7563',
        shadow: '#8a8d73',
      },
      flatFacets: [
        { role: 'light', points: [[0, 18], [26, 6], [37, 15], [17, 28], [4, 25]] },
        { role: 'shade', points: [[4, 25], [17, 28], [20, 39], [13, 44], [6, 39], [2, 31]] },
        { role: 'base', points: [[17, 28], [37, 15], [39, 29], [29, 33], [25, 39], [20, 39]] },
        { role: 'light', points: [[25, 30], [34, 31], [36, 37], [29, 40], [25, 37]] },
        { role: 'shade', points: [[18, 29], [26, 34], [26, 42], [22, 44], [19, 39]] },
      ],
      flatLines: [
        { role: 'outline', points: [[0, 18], [26, 6], [37, 15]], width: 1 },
        { role: 'outline', points: [[17, 28], [37, 15]], width: 1 },
        { role: 'outline', points: [[17, 28], [26, 34], [34, 31]], width: 1 },
        { role: 'outline', points: [[26, 34], [26, 42]], width: 1 },
      ],
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
      renderMode: 'flat-mask',
      nativeSize: [54, 50],
      source: {
        reference: 'image-1.jpg (d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa)',
        imageSize: [736, 952],
        crop: { x: 345, y: 112, width: 54, height: 50 },
        usage: 'local-visual-qa-only',
      },
      referenceClipPath: 'polygon(50% 14%, 72% 14%, 85% 24%, 89% 36%, 87% 48%, 81% 54%, 87% 62%, 87% 72%, 80% 78%, 69% 78%, 61% 70%, 57% 58%, 50% 60%, 37% 60%, 28% 54%, 24% 44%, 28% 36%, 39% 30%, 43% 20%)',
      fitBounds: { minX: 13, minY: 7, maxX: 51, maxY: 43 },
      flatPalette: {
        outline: '#14200e',
        base: '#7f9e78',
        light: '#aac79e',
        shade: '#5f7657',
        shadow: '#8a927a',
      },
      flatFacets: [
        { role: 'base', stroke: true, points: [[13, 18], [18, 14], [26, 15], [30, 21], [27, 28], [22, 31], [16, 27]] },
        { role: 'light', stroke: true, points: [[25, 14], [28, 8], [39, 7], [47, 13], [49, 23], [44, 30], [35, 29], [29, 24]] },
        { role: 'shade', stroke: true, points: [[29, 27], [37, 24], [46, 28], [49, 36], [43, 43], [36, 43], [30, 37]] },
      ],
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

  function paintBuilding(ctx, asset, mapper) {
    const palette = asset.palette;
    for (const shadow of asset.shadowShapes) {
      paintPolygon(ctx, shadow.points, mapper, palette[shadow.role]);
    }

    paintPolygon(ctx, asset.mainOutline, mapper, palette.lower, palette.inkDeep, 2.35);
    ctx.save();
    tracePolygon(ctx, asset.mainOutline, mapper);
    ctx.clip();
    for (const facet of asset.mainFacets) paintPolygon(ctx, facet.points, mapper, palette[facet.role]);
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

  function forEachMaskRun(rows, callback) {
    rows.forEach((row, rowIndex) => {
      let runStart = 0;
      while (runStart < row.length) {
        while (runStart < row.length && row[runStart] === '.') runStart += 1;
        if (runStart === row.length) break;
        let runEnd = runStart + 1;
        while (runEnd < row.length && row[runEnd] !== '.') runEnd += 1;
        callback(runStart, runEnd, rowIndex);
        runStart = runEnd;
      }
    });
  }

  function tracePixelMask(ctx, rows, mapper) {
    ctx.beginPath();
    forEachMaskRun(rows, (runStart, runEnd, rowIndex) => {
      const from = mapper([runStart, rowIndex]);
      const to = mapper([runEnd, rowIndex + 1]);
      ctx.rect(from[0], from[1], to[0] - from[0], to[1] - from[1]);
    });
  }

  function paintPixelMask(ctx, rows, fill, mapper) {
    tracePixelMask(ctx, rows, mapper);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function paintPixelOutline(ctx, rows, fill, mapper) {
    ctx.fillStyle = fill;
    rows.forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column += 1) {
        if (row[column] === '.') continue;
        const outside = rowIndex === 0 || rowIndex === rows.length - 1 || column === 0 || column === row.length - 1 ||
          rows[rowIndex - 1][column] === '.' || rows[rowIndex + 1][column] === '.' ||
          row[column - 1] === '.' || row[column + 1] === '.';
        if (!outside) continue;
        const from = mapper([column, rowIndex]);
        const to = mapper([column + 1, rowIndex + 1]);
        ctx.fillRect(from[0], from[1], to[0] - from[0], to[1] - from[1]);
      }
    });
  }

  function paintFlatLine(ctx, line, mapper, palette) {
    const points = line.points.map(mapper);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index][0], points[index][1]);
    }
    ctx.strokeStyle = palette[line.role];
    ctx.lineWidth = line.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function paintFlatPixelMaterial(ctx, asset, mapper) {
    const palette = asset.flatPalette;
    paintPixelMask(ctx, asset.shadowPixelRows, palette.shadow, mapper);
    ctx.save();
    tracePixelMask(ctx, asset.pixelRows, mapper);
    ctx.clip();
    paintPixelMask(ctx, asset.pixelRows, palette.base, mapper);
    for (const facet of asset.flatFacets) {
      paintPolygon(ctx, facet.points, mapper, palette[facet.role], facet.stroke ? palette.outline : null, facet.stroke ? 1.1 : 1);
    }
    for (const line of asset.flatLines || []) paintFlatLine(ctx, line, mapper, palette);
    ctx.restore();
    paintPixelOutline(ctx, asset.pixelRows, palette.outline, mapper);
  }

  function paintTree(ctx, asset, mapper) {
    paintFlatPixelMaterial(ctx, asset, mapper);
  }

  function paintAsset(ctx, assetId, { x = 0, y = 0, scale = 1 } = {}) {
    const asset = catalog[assetId];
    if (!asset) return false;
    const mapper = point => [x + point[0] * scale, y + point[1] * scale];
    ctx.save();
    if (asset.renderMode === 'flat-mask') paintFlatPixelMaterial(ctx, asset, mapper);
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
