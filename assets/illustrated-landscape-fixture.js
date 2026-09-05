((global) => {
  'use strict';
  // Art-direction fixture only: a fictional landscape, never returned as real geographic data.
  const features = [];
  const polygon = (id, layer, kind, rings) => features.push({ id, layer, type: 3, props: { class: kind }, geometry: rings });
  const line = (id, kind, points, extra = {}) => features.push({ id, layer: 'transportation', type: 2, props: { class: kind, ...extra }, geometry: [points] });
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  polygon(1, 'landcover', 'forest', [[[-160,-160],[165,-160],[155,30],[110,80],[132,150],[76,236],[96,318],[45,382],[62,475],[17,540],[60,649],[130,760],[200,870],[160,1110],[-160,1110],[-160,-160]]]);
  polygon(2, 'landcover', 'forest', [[[518,-160],[900,-160],[900,1110],[567,1110],[601,912],[664,792],[624,726],[686,631],[664,543],[726,422],[681,360],[720,253],[639,198],[596,122],[527,109],[518,-160]]]);
  polygon(3, 'landcover', 'grass', [rect(62, 10, 575, 950)]);
  polygon(4, 'water', 'river', [[[404,-150],[443,-150],[424,72],[469,169],[443,258],[460,360],[420,443],[430,510],[396,577],[422,640],[489,676],[533,704],[650,735],[900,830],[900,875],[636,769],[508,742],[473,713],[404,675],[363,603],[389,519],[382,442],[423,353],[405,258],[430,173],[387,80],[404,-150]]]);
  polygon(5, 'landuse', 'farmland', [rect(128, 108, 104, 114)]);
  polygon(6, 'landuse', 'farmland', [rect(100, 290, 117, 132)]);
  polygon(7, 'landuse', 'farmland', [rect(481, 370, 119, 94)]);
  polygon(8, 'landuse', 'farmland', [rect(246, 809, 135, 130)]);
  polygon(9, 'landuse', 'farmland', [rect(465, 802, 121, 116)]);
  line(10, 'minor', [[272,-90],[270,87],[289,182],[266,289],[269,372],[244,456],[230,561],[216,661],[244,763],[267,891],[318,1040]]);
  line(11, 'minor', [[270,88],[344,149],[369,250],[344,345],[309,439],[230,561]]);
  line(12, 'minor', [[216,661],[286,642],[360,632]]);
  line(13, 'minor', [[359,632],[421,609]], { brunnel: 'bridge' });
  line(14, 'minor', [[422,609],[496,580],[565,515],[613,420],[622,322],[603,215],[555,160]]);
  line(15, 'minor', [[245,764],[353,759],[459,787],[520,877],[556,1025]]);
  line(16, 'path', [[271,370],[331,374],[354,399]]);
  line(17, 'path', [[565,515],[528,478],[479,469]]);
  line(18, 'path', [[244,456],[171,487],[143,556]]);
  const houses = [[240,75,18,39],[288,114,35,21],[235,236,28,18],[289,272,22,37],[303,334,37,21],
    [275,396,23,33],[189,439,28,21],[245,485,32,23],[168,563,30,22],[257,581,20,40],
    [177,715,38,22],[301,776,30,22],[339,863,22,32],[560,249,37,25],[641,334,27,19],
    [565,448,24,29],[485,522,36,23],[500,602,30,20],[557,626,29,23],[527,658,43,19],
    [438,856,20,31],[566,931,31,23]];
  houses.forEach(([x,y,w,h], i) => {
    const angle = (i % 5 - 2) * .13, c = Math.cos(angle), s = Math.sin(angle);
    const ring = rect(0, 0, w, h).map(([px, py]) => [x + c * px - s * py, y + s * px + c * py]);
    polygon(100 + i, 'building', 'residential', [ring]);
  });
  polygon(150, 'building', 'residential', [rect(282, 663, 84, 59), rect(300, 677, 49, 29).reverse()]);
  polygon(151, 'building', 'residential', [[[469,216],[529,216],[529,186],[554,186],[554,244],[469,244],[469,216]]]);
  polygon(152, 'building', 'industrial', [rect(468, 304, 103, 20)]);
  global.PixelMapIllustratedFixture = Object.freeze({ features, centerX: 368, centerY: 476,
    description: '構成見本・架空の地形', width: 736, height: 952 });
})(typeof window !== 'undefined' ? window : globalThis);
