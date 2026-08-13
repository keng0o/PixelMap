(() => {
  'use strict';

  const shadow = (p, x, y, w) => p.poly([[x,y],[x+w-5,y],[x+w,y+3],[x+5,y+3]],p.c.shadow);
  const rail = (p, x, y, w) => {
    p.rect(x,y,w,2,p.c.outline);
    p.rect(x+1,y,w-2,1,p.c.stoneDark);
    for(let i=x+2;i<x+w-2;i+=6)p.rect(i,y-2,2,5,p.c.trunk);
  };
  const pane = (p,x,y,w=4,h=4) => {
    p.rect(x-1,y-1,w+2,h+2,p.c.outline);
    p.rect(x,y,w,h,p.c.glass);
    p.rect(x,y,w,1,p.c.white);
  };
  const door = (p,x,y,w=5,h=8) => {
    p.rect(x-1,y-1,w+2,h+1,p.c.outline);
    p.rect(x,y,w,h,p.c.door);
    p.dot(x+w-2,y+4,p.c.gold);
  };
  const sign = (p,x,y,w) => {
    p.rect(x-1,y-1,w+2,5,p.c.outline);
    p.rect(x,y,w,3,p.c.cream);
    p.line(x+2,y+1,x+w-3,y+1,p.c.stoneDark,1);
  };

  window.PIXEL_ASSET_GROUPS=window.PIXEL_ASSET_GROUPS||[];
  window.PIXEL_ASSET_GROUPS.push({
    id:'stations',
    label:'駅',
    description:'ホーム構成・階層・屋根・改札位置が異なる駅舎10種。',
    assets:[
      {
        id:'station-rural-halt',name:'田園の無人駅',category:'駅',
        keywords:['駅','無人駅','田園','待合所','ホーム'],shape:'tiny-open-shelter-side-platform',
        draw(p){const c=p.c;
          shadow(p,7,40,34);rail(p,5,39,38);
          p.rect(10,23,2,15,c.outline);p.rect(36,23,2,15,c.outline);
          p.poly([[7,23],[13,17],[35,17],[41,23]],c.outline);
          p.poly([[11,22],[15,19],[33,19],[37,22]],c.roof);
          p.rect(12,24,24,3,c.wallShade);p.rect(14,27,3,10,c.trunk);p.rect(31,27,3,10,c.trunk);
          p.rect(18,28,12,7,c.outline);p.rect(20,30,8,3,c.cream);
          sign(p,20,20,8);
        }
      },
      {
        id:'station-village-gable',name:'村の切妻駅',category:'駅',
        keywords:['駅','駅舎','村','切妻屋根','時計'],shape:'front-gable-clock-short-platform',
        draw(p){const c=p.c;
          shadow(p,4,40,40);p.rect(7,25,34,14,c.outline);p.rect(9,26,30,11,c.wall);
          p.poly([[4,25],[15,14],[28,14],[43,25]],c.outline);
          p.poly([[8,24],[16,17],[27,17],[39,24]],c.roof);
          p.poly([[22,16],[28,16],[39,24],[32,24]],c.roofDark);
          pane(p,11,29,5,4);pane(p,32,29,4,4);door(p,20,28,7,9);
          p.rect(18,17,8,6,c.cream);p.rect(18,17,8,1,c.outline);p.dot(22,20,c.outline);
          rail(p,3,39,42);
        }
      },
      {
        id:'station-island-platform',name:'島式ホーム駅',category:'駅',
        keywords:['駅','島式ホーム','上屋','線路','ホーム'],shape:'long-island-canopy-double-track',
        draw(p){const c=p.c;
          rail(p,2,16,44);rail(p,2,42,44);
          p.poly([[5,37],[39,37],[44,40],[10,40]],c.outline);p.poly([[8,36],[39,36],[42,38],[9,38]],c.stone);
          for(const x of [11,22,33]){p.rect(x,23,2,13,c.outline);p.rect(x+1,24,1,11,c.stoneDark)}
          p.poly([[6,23],[12,17],[36,17],[43,23]],c.outline);p.poly([[10,22],[14,19],[35,19],[39,22]],c.roof);
          p.line(15,19,34,19,c.roofLight,1);sign(p,20,25,9);
          p.rect(7,32,8,3,c.outline);p.rect(9,32,4,2,c.trunk);
        }
      },
      {
        id:'station-bridge-concourse',name:'橋上駅',category:'駅',
        keywords:['駅','橋上駅','跨線橋','改札','線路'],shape:'upper-concourse-two-stair-towers',
        draw(p){const c=p.c;
          rail(p,2,42,44);shadow(p,4,39,40);
          p.rect(6,12,36,17,c.outline);p.rect(8,14,32,12,c.wall);
          p.poly([[4,12],[10,7],[37,7],[44,12]],c.outline);p.poly([[8,11],[12,9],[36,9],[40,11]],c.roof);
          for(const x of [11,18,26,33])pane(p,x,17,4,4);
          sign(p,20,10,8);
          p.poly([[7,28],[16,28],[12,40],[3,40]],c.outline);p.poly([[9,29],[14,29],[10,38],[6,38]],c.stone);
          p.poly([[32,28],[41,28],[46,40],[37,40]],c.outline);p.poly([[34,29],[39,29],[43,38],[39,38]],c.stone);
          p.rect(16,26,16,4,c.outline);p.rect(18,27,12,2,c.wallShade);
        }
      },
      {
        id:'station-elevated-urban',name:'高架駅',category:'駅',
        keywords:['駅','高架駅','都市','高架線','ガラス'],shape:'elevated-glass-hall-pier-viaduct',
        draw(p){const c=p.c;
          shadow(p,4,42,40);p.rect(3,28,42,6,c.outline);p.rect(5,29,38,3,c.stone);
          for(const x of [8,19,30,40]){p.rect(x,33,4,10,c.outline);p.rect(x+1,34,2,8,c.stoneDark)}
          p.rect(8,14,32,15,c.outline);p.rect(10,16,28,11,c.glass);
          for(const x of [16,23,30])p.rect(x,16,1,11,c.outline);
          p.poly([[6,14],[12,8],[36,8],[43,14]],c.outline);p.poly([[10,13],[14,10],[34,10],[39,13]],c.roof);
          p.rect(19,21,10,7,c.outline);p.rect(21,22,6,5,c.cream);sign(p,20,10,8);
          rail(p,2,31,44);
        }
      },
      {
        id:'station-terminus-hall',name:'終着駅',category:'駅',
        keywords:['駅','終着駅','頭端式ホーム','大屋根','ターミナル'],shape:'arched-train-shed-terminal-front',
        draw(p){const c=p.c;
          shadow(p,3,41,42);
          p.poly([[3,38],[3,20],[8,12],[16,7],[32,7],[40,12],[45,20],[45,38]],c.outline);
          p.poly([[6,37],[6,21],[11,14],[18,10],[30,10],[37,14],[42,21],[42,37]],c.wall);
          p.poly([[10,36],[10,22],[15,16],[20,13],[28,13],[33,16],[38,22],[38,36]],c.glass);
          p.line(24,13,24,36,c.outline,2);p.line(12,25,36,25,c.outline,2);
          p.rect(8,35,32,4,c.outline);p.rect(11,35,26,2,c.stone);
          for(const x of [15,31])rail(p,x,39,3);
          sign(p,19,29,10);
        }
      },
      {
        id:'station-mountain-chalet',name:'山あいの駅',category:'駅',
        keywords:['駅','山岳','山小屋','ローカル線','雪国'],shape:'steep-chalet-roof-low-platform',
        draw(p){const c=p.c;
          shadow(p,5,41,38);p.rect(9,25,30,15,c.outline);p.rect(11,27,26,11,c.wallShade);
          p.poly([[4,26],[19,9],[29,9],[44,26]],c.outline);p.poly([[9,24],[20,12],[28,12],[39,24]],c.roof);
          p.poly([[24,12],[28,12],[39,24],[34,24]],c.roofDark);
          pane(p,13,29,5,5);pane(p,31,29,4,5);door(p,21,28,7,10);
          p.line(12,19,36,19,c.cream,2);p.rect(35,12,4,8,c.outline);p.rect(36,13,2,6,c.stoneDark);
          rail(p,4,40,40);
        }
      },
      {
        id:'station-seaside-deck',name:'海辺の展望駅',category:'駅',
        keywords:['駅','海辺','展望デッキ','桟橋','観光'],shape:'asymmetric-observation-deck-stilt-station',
        draw(p){const c=p.c;
          p.rect(4,42,40,2,c.water);p.line(7,45,22,45,c.glass,1);
          shadow(p,5,39,38);p.rect(8,24,26,15,c.outline);p.rect(10,26,22,11,c.wall);
          p.poly([[5,24],[13,16],[31,16],[37,24]],c.outline);p.poly([[9,23],[15,18],[29,18],[33,23]],c.roof);
          pane(p,12,28,5,4);door(p,22,28,6,9);
          p.rect(32,28,13,3,c.outline);p.rect(34,31,2,9,c.trunk);p.rect(42,31,2,9,c.trunk);
          p.line(34,34,43,34,c.outline,1);p.line(34,37,43,37,c.outline,1);
          p.rect(15,12,14,5,c.outline);p.rect(17,13,10,3,c.glass);
          rail(p,4,39,40);
        }
      },
      {
        id:'station-brick-industrial',name:'煉瓦の工業駅',category:'駅',
        keywords:['駅','煉瓦','工業地帯','貨物線','鋸屋根'],shape:'brick-sawtooth-hall-freight-siding',
        draw(p){const c=p.c;
          shadow(p,3,41,42);p.rect(5,23,38,17,c.outline);p.rect(7,25,34,13,c.roofDark);
          p.poly([[4,23],[12,15],[19,23],[27,13],[34,23],[42,16],[46,23]],c.outline);
          p.poly([[8,22],[12,18],[19,25],[27,16],[34,25],[42,19],[44,22]],c.roof);
          p.line(9,29,39,29,c.roofLight,1);p.line(9,34,39,34,c.roofLight,1);
          pane(p,9,27,5,5);pane(p,34,27,4,5);door(p,20,29,8,9);
          p.rect(37,8,5,10,c.outline);p.rect(38,9,3,9,c.stoneDark);
          rail(p,2,40,44);
        }
      },
      {
        id:'station-grand-central',name:'中央大駅舎',category:'駅',
        keywords:['駅','中央駅','大駅舎','時計塔','ターミナル'],shape:'monumental-wings-clock-dome-arcade',
        draw(p){const c=p.c;
          shadow(p,2,42,44);p.rect(3,23,42,18,c.outline);p.rect(5,25,38,14,c.wall);
          p.rect(16,14,16,26,c.outline);p.rect(18,16,12,22,c.wallShade);
          p.poly([[2,23],[9,17],[16,17],[18,23]],c.outline);p.poly([[5,22],[10,19],[16,19],[17,22]],c.roof);
          p.poly([[30,23],[32,17],[39,17],[46,23]],c.outline);p.poly([[31,22],[33,19],[38,19],[43,22]],c.roof);
          p.poly([[15,14],[19,9],[29,9],[33,14]],c.outline);p.poly([[19,13],[21,11],[27,11],[29,13]],c.roofDark);
          p.rect(21,5,6,5,c.outline);p.rect(22,6,4,3,c.cream);p.dot(24,7,c.outline);
          for(const x of [7,12,34,39])pane(p,x,27,3,4);
          p.rect(19,25,10,13,c.outline);p.poly([[20,37],[20,29],[24,25],[28,29],[28,37]],c.glass);
          p.line(24,26,24,37,c.outline,1);p.rect(3,40,42,3,c.stoneDark);sign(p,20,17,8);
        }
      }
    ]
  });
})();
