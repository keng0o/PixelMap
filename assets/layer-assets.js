((global) => {
  'use strict';

  const groups = Object.freeze([
    {
      id:'nature', label:'自然・水域', items:[
        ['grass','草地(背景)','surface','#7cbc54','grass'],
        ['forest','森','surface','#355d38','forest'],
        ['woods','林','surface','#80b564','woods'],
        ['farmland','農地','surface','#d8c078','farmland'],
        ['landcoverGrass','草原','surface','#68b058','meadow'],
        ['sand','砂地','surface','#e8d8a0','sand'],
        ['rock','岩場','surface','#8d8790','rock'],
        ['wetland','湿地','surface','#669c68','wetland'],
        ['ice','雪・氷','surface','#dcecf0','ice'],
        ['landcoverOther','その他地表','surface','#d0b078','other'],
        ['parks','公園','surface','#88c764','park'],
        ['waterAreas','水面','water','#4890e0','area'],
        ['rivers','河川','water','#4890e0','river'],
        ['streams','小川','water','#5aa2e8','stream'],
        ['canals','運河','water','#4890e0','canal'],
        ['drains','排水路','water','#6aa8d8','drain'],
        ['waterwayOther','その他水路','water','#4890e0','other'],
      ],
    },
    {
      id:'landuse', label:'土地利用', items:[
        ['landuseResidential','住宅地','surface','#d0b078','residential'],
        ['landuseCommercial','業務・商業用地','surface','#c0c0c8','commercial'],
        ['landuseRetail','小売用地','surface','#c0c0c8','retail'],
        ['landuseSchool','学校・幼稚園用地','surface','#c0c0c8','school'],
        ['landuseHigherEducation','大学・高等教育用地','surface','#c0c0c8','higherEducation'],
        ['landuseMedical','病院・医療用地','surface','#c0c0c8','medical'],
        ['landuseCivic','公共施設用地','surface','#c0c0c8','civic'],
        ['landuseIndustrial','工業用地','surface','#a8a098','industrial'],
        ['landuseGarages','車庫・ガレージ用地','surface','#a8a098','garages'],
        ['landuseMilitary','軍事用地','surface','#a8a098','military'],
        ['landuseBusStation','バスターミナル用地','surface','#c0c0c8','busStation'],
        ['landuseRailway','鉄道用地','surface','#a8a098','railway'],
        ['landuseCemetery','墓地','surface','#92ce69','cemetery'],
        ['landuseStadium','スタジアム','surface','#68b058','stadium'],
        ['landusePitchTrack','球技場・競技トラック','surface','#68b058','pitch'],
        ['landusePlayground','遊び場','surface','#68b058','playground'],
        ['landuseAmusement','遊園地','surface','#68b058','amusement'],
        ['landuseZoo','動物園','surface','#68b058','zoo'],
        ['landuseAirport','空港施設','surface','#a8a098','airport'],
        ['landuseHelipad','ヘリポート','surface','#c0c0c8','helipad'],
        ['landuseOther','その他','surface','#d0b078','other'],
      ],
    },
    {
      id:'transport', label:'交通', items:[
        ['localRoads','生活道路','route','#c6c6c0','local'],
        ['regionalRoads','地区幹線道路','route','#aaa9a2','regional'],
        ['majorRoads','主要道路','route','#d5bd78','major'],
        ['motorways','高速道路','route','#d5bd78','motorway'],
        ['paths','歩道・小径','route','#dcc890','path'],
        ['tracks','作業道・未舗装路','route','#b8a47c','track'],
        ['raceways','競走路','route','#c99868','raceway'],
        ['ferries','フェリー航路','route','#c8e8f8','ferry'],
        ['piers','桟橋','route','#d0b078','pier'],
        ['rail','鉄道','route','#404048','rail'],
        ['subway','地下鉄(破線)','route','#404048','subway'],
        ['aerialways','索道・ロープウェイ','route','#50505c','aerialway'],
        ['transportationOther','その他交通','route','#dcc890','other'],
        ['roadTunnels','道路トンネル(破線)','route','#8e8e88','roadTunnel'],
        ['pathTunnels','歩道トンネル(破線)','route','#b09a6c','pathTunnel'],
        ['railTunnels','鉄道トンネル(破線)','route','#404048','railTunnel'],
      ],
    },
    {
      id:'facilities', label:'建物・施設', items:[
        ['buildings','たてもの','object','#f0e4c8','buildings'],
        ['poi','施設アイコン','object','#ffffff','poi'],
        ['dots','小さな施設(点)','object','#f8d038','dots'],
      ],
    },
    {
      id:'information', label:'情報', items:[
        ['stationNames','駅名','label','#f8f0d8','station'],
        ['parkNames','公園名','label','#f8f0d8','park'],
        ['poiNames','施設名','label','#f8f0d8','poi'],
        ['placeNames','地名・地域','label','#f8e8a8','place'],
        ['terrainNames','山・地形','label','#f8f0d8','terrain'],
      ],
    },
  ]);

  const LINE_WIDTHS = Object.freeze({
    river:1.4, stream:.65, canal:1.4, drain:1.1, other:1,
    local:14, regional:16, major:20, motorway:28,
    path:2, track:4, raceway:8, ferry:2, pier:4,
    rail:4, subway:4, aerialway:2,
    roadTunnel:5, pathTunnel:5, railTunnel:5,
  });

  function metricFor(kind,variant){
    if(kind==='surface' || (kind==='water' && variant==='area')){
      return Object.freeze({kind:'tile',label:'16×16 px TILE',width:16,height:16});
    }
    if(kind==='water' || kind==='route'){
      const lineWidth=kind==='route' && variant==='other' ? 2 : LINE_WIDTHS[variant] ?? 1;
      return Object.freeze({
        kind:'line',label:`${lineWidth} px LINE`,lineWidth,
        width:32,height:Math.max(16,Math.ceil(lineWidth)+8),
      });
    }
    if(kind==='object' && variant==='buildings'){
      return Object.freeze({kind:'variable',label:'可変 / 48×36 px SAMPLE',width:48,height:36});
    }
    if(kind==='object' && variant==='poi'){
      return Object.freeze({kind:'variable',label:'可変 / POI別',width:32,height:32});
    }
    if(kind==='object'){
      return Object.freeze({kind:'object',label:'7×7 px DOT',width:7,height:7});
    }
    const fontSize=variant==='place'?26:22;
    return Object.freeze({kind:'variable',label:`可変 / ${fontSize} px TYPE`,width:96,height:32,fontSize});
  }

  const layers = Object.freeze(groups.flatMap(group => group.items.map(item => Object.freeze({
    id:item[0], label:item[1], kind:item[2], color:item[3], variant:item[4],
    group:group.id, groupLabel:group.label, metric:metricFor(item[2],item[4]),
  }))));

  const P = Object.freeze({
    outline:'#302838', grass:'#7cbc54', grassDark:'#619c42', grassLight:'#98d470',
    treeDark:'#2c6030', tree:'#3e8840', treeLight:'#5cb050', trunk:'#785030',
    water:'#4890e0', waterLight:'#88c0f0', waterDark:'#3068b8', foam:'#c8e8f8',
    wall:'#f0e4c8', wallDark:'#c8b490', roof:'#e05038', roofBlue:'#5078d8', window:'#3868a0',
  });

  function rect(ctx,x,y,w,h,color){ ctx.fillStyle=color;ctx.fillRect(x,y,w,h); }
  function grass(ctx){
    rect(ctx,0,0,288,180,P.grass);
    for(let y=8;y<180;y+=24) for(let x=(y/24%2)*12+8;x<288;x+=32){
      rect(ctx,x,y,5,2,P.grassDark);rect(ctx,x+3,y-3,2,4,P.grassLight);
    }
  }
  function tree(ctx,x,y,small=false){
    const s=small?1:2;
    rect(ctx,x-8*s,y-9*s,16*s,13*s,P.outline);
    rect(ctx,x-6*s,y-11*s,12*s,12*s,P.tree);
    rect(ctx,x-4*s,y-11*s,6*s,4*s,P.treeLight);
    rect(ctx,x+2*s,y-4*s,5*s,5*s,P.treeDark);
    rect(ctx,x-2*s,y+1*s,4*s,8*s,P.trunk);
  }
  function panel(ctx,color){
    rect(ctx,30,22,228,136,P.outline);
    rect(ctx,34,26,220,128,color);
  }
  function mark(ctx,x,y,color='#302838'){ rect(ctx,x,y,4,4,color); }

  function surface(ctx,asset){
    if(asset.variant==='grass') return;
    panel(ctx,asset.color);
    if(asset.variant==='forest' || asset.variant==='woods'){
      const sparse=asset.variant==='woods';
      for(let y=56;y<145;y+=sparse?43:34) for(let x=58+(y%3)*11;x<244;x+=sparse?58:43) tree(ctx,x,y,sparse);
      return;
    }
    if(asset.variant==='farmland'){
      for(let y=36;y<150;y+=18){rect(ctx,35,y,218,5,'#b09850');for(let x=44;x<250;x+=24)mark(ctx,x,y+7,'#f0d98b');}
      return;
    }
    if(asset.variant==='meadow' || asset.variant==='park'){
      for(let y=40;y<145;y+=30) for(let x=48+(y%4)*7;x<248;x+=38){mark(ctx,x,y,P.grassDark);mark(ctx,x+5,y-3,P.grassLight);}
      if(asset.variant==='park'){tree(ctx,73,118,true);tree(ctx,222,72,true);rect(ctx,37,88,214,8,'#d8bd78');}
      return;
    }
    if(asset.variant==='sand'){
      for(let i=0;i<34;i++) mark(ctx,42+(i*47)%200,34+(i*29)%108,i%3?'#c8b478':'#f2e5b5');
      return;
    }
    if(asset.variant==='rock'){
      for(let i=0;i<12;i++){const x=42+(i*61)%194,y=38+(i*37)%100;rect(ctx,x,y,20,12,'#625f69');rect(ctx,x+5,y-6,12,7,'#b7b1b8');}
      return;
    }
    if(asset.variant==='wetland'){
      for(let y=47;y<145;y+=38)rect(ctx,35,y,218,8,'#5fa7b2');
      for(let x=48;x<245;x+=28){rect(ctx,x,35+(x%4)*22,3,28,'#39775c');rect(ctx,x+3,37+(x%4)*22,4,3,'#8ec47f');}
      return;
    }
    if(asset.variant==='ice'){
      rect(ctx,48,48,72,4,'#f7ffff');rect(ctx,116,48,4,44,'#a8cad8');rect(ctx,116,88,56,4,'#a8cad8');
      rect(ctx,178,104,60,4,'#f7ffff');rect(ctx,178,108,4,32,'#a8cad8');
      return;
    }
    const dark=asset.color==='#c0c0c8'?'#989ca8':asset.color==='#a8a098'?'#888078':'#b09058';
    for(let y=34;y<150;y+=24) for(let x=42+(y%5)*5;x<248;x+=32)mark(ctx,x,y,dark);
    const icons={medical:'＋',school:'校',higherEducation:'大',civic:'公',industrial:'工',military:'◆',busStation:'BUS',railway:'線',cemetery:'＋',stadium:'ST',pitch:'◎',playground:'△',amusement:'☆',zoo:'ZOO',airport:'✈',helipad:'H',commercial:'OFFICE',retail:'SHOP',residential:'HOME',garages:'P'};
    if(icons[asset.variant]){
      ctx.fillStyle=P.outline;ctx.font='20px DotGothic16,monospace';ctx.textAlign='center';ctx.fillText(icons[asset.variant],144,98);
    }
  }

  function water(ctx,asset){
    if(asset.variant==='area'){
      panel(ctx,P.water);
      for(let y=44;y<146;y+=30){rect(ctx,50,y,48,4,P.waterLight);rect(ctx,168,y+12,62,4,P.waterDark);}
      return;
    }
    const widths={river:34,stream:12,canal:22,drain:8,other:10};
    const w=widths[asset.variant]||10;
    for(let x=0;x<288;x+=6){const y=108+Math.round(Math.sin(x/45)*22);rect(ctx,x,y-w/2,7,w,asset.color);if(w>15)rect(ctx,x,y-w/2,7,3,P.foam);}
  }

  function steppedLine(ctx,color,width,dashed=false){
    for(let x=0;x<288;x+=6){
      if(dashed && Math.floor(x/24)%2)continue;
      const y=112-Math.floor(x/36)*7+(Math.floor(x/60)%2)*12;
      rect(ctx,x,y-width/2,7,width,color);
    }
  }
  function route(ctx,asset){
    if(asset.variant==='ferry'){rect(ctx,0,30,288,120,P.water);steppedLine(ctx,P.foam,5,true);return;}
    if(asset.variant==='pier'){rect(ctx,0,96,288,84,P.water);rect(ctx,118,18,52,132,P.outline);rect(ctx,124,18,40,126,asset.color);return;}
    const tunnel=asset.variant.endsWith('Tunnel') || asset.variant==='subway';
    const widths={local:18,regional:24,major:32,motorway:38,path:10,track:12,raceway:26,rail:9,subway:9,aerialway:6,other:10,roadTunnel:22,pathTunnel:10,railTunnel:9};
    const width=widths[asset.variant]||10;
    if(['local','regional','major','motorway','roadTunnel'].includes(asset.variant)) steppedLine(ctx,P.outline,width+6,tunnel);
    steppedLine(ctx,asset.color,width,tunnel);
    if(['rail','subway','railTunnel'].includes(asset.variant)) for(let x=18;x<280;x+=20){const y=112-Math.floor(x/36)*7+(Math.floor(x/60)%2)*12;rect(ctx,x,y-10,4,20,'#786048');}
    if(asset.variant==='aerialway') for(let x=38;x<280;x+=62){const y=112-Math.floor(x/36)*7+(Math.floor(x/60)%2)*12;rect(ctx,x-3,y-20,6,38,P.outline);rect(ctx,x-10,y-20,20,5,'#786048');}
    if(asset.variant==='motorway') steppedLine(ctx,'#f8f0d8',4,false);
  }

  function building(ctx,x,y,roof){
    rect(ctx,x-22,y-18,44,30,P.outline);rect(ctx,x-18,y-14,36,26,P.wall);rect(ctx,x-24,y-24,48,10,P.outline);rect(ctx,x-20,y-20,40,7,roof);
    rect(ctx,x-12,y-8,9,9,P.window);rect(ctx,x+4,y-8,9,9,P.window);rect(ctx,x-3,y+2,8,10,'#805028');
  }
  function object(ctx,asset){
    if(asset.variant==='buildings'){building(ctx,82,92,P.roof);building(ctx,151,72,P.roofBlue);building(ctx,222,112,'#b09058');return;}
    if(asset.variant==='poi'){
      global.PixelMapPoiSprites?.draw(ctx,'pop_station',76,126,'M');
      global.PixelMapPoiSprites?.draw(ctx,'pop_library',148,104,'M');
      global.PixelMapPoiSprites?.draw(ctx,'pop_townhall',222,126,'M');
      return;
    }
    const colors=['#2563eb','#ef4444','#7c3aed','#f59e0b','#db2777','#16a34a'];
    for(let y=48;y<145;y+=30)for(let x=48+(y%3)*8;x<250;x+=42){const c=colors[(x+y)%colors.length];rect(ctx,x,y,7,7,P.outline);rect(ctx,x+2,y+2,3,3,c);}
  }

  function label(ctx,asset){
    const labels={station:'川崎駅',park:'みどり公園',poi:'まちの図書館',place:'川崎・駅前',terrain:'富士見の丘'};
    if(asset.variant==='terrain'){rect(ctx,92,115,104,4,'#625f69');rect(ctx,112,91,64,26,'#8d8790');}
    ctx.font=asset.variant==='place'?'26px DotGothic16,monospace':'22px DotGothic16,monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=8;ctx.strokeStyle=P.outline;ctx.strokeText(labels[asset.variant],144,90);ctx.fillStyle=asset.color;ctx.fillText(labels[asset.variant],144,90);
  }

  function render(canvas,asset){
    canvas.width=288;canvas.height=180;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;grass(ctx);
    if(asset.kind==='surface')surface(ctx,asset);
    else if(asset.kind==='water')water(ctx,asset);
    else if(asset.kind==='route')route(ctx,asset);
    else if(asset.kind==='object')object(ctx,asset);
    else label(ctx,asset);
  }

  function renderTileDetail(ctx,asset){
    rect(ctx,0,0,16,16,asset.color);
    if(asset.variant==='grass'){
      rect(ctx,3,5,1,2,P.grassDark);rect(ctx,4,4,1,3,P.grassLight);
      rect(ctx,11,11,2,1,P.grassDark);return;
    }
    if(asset.variant==='forest' || asset.variant==='woods'){
      rect(ctx,2,7,12,6,P.treeDark);rect(ctx,4,3,8,8,P.tree);
      rect(ctx,6,3,3,3,P.treeLight);rect(ctx,7,11,2,5,P.trunk);return;
    }
    if(asset.variant==='farmland'){
      for(let y=2;y<16;y+=4)rect(ctx,0,y,16,1,'#b09850');return;
    }
    if(asset.variant==='water' || asset.variant==='area'){
      rect(ctx,0,0,16,16,P.water);rect(ctx,2,5,6,1,P.waterLight);rect(ctx,9,11,5,1,P.waterDark);return;
    }
    const detailTone=asset.color==='#c0c0c8'?'#989ca8':asset.color==='#a8a098'?'#888078':P.outline;
    for(const [x,y] of [[3,4],[11,3],[6,11],[13,13]])rect(ctx,x,y,2,2,detailTone);
  }

  function renderLineDetail(ctx,asset){
    const metric=asset.metric;
    const lineWidth=Math.max(1,Math.round(metric.lineWidth));
    const y=Math.floor((canvasHeight(ctx)-lineWidth)/2);
    const dashed=asset.variant.endsWith('Tunnel') || asset.variant==='subway' || asset.variant==='ferry' || asset.variant==='aerialway';
    const background=asset.variant==='ferry' || asset.variant==='pier' ? P.water : P.grass;
    rect(ctx,0,0,ctx.canvas.width,ctx.canvas.height,background);
    for(let x=0;x<ctx.canvas.width;x+=dashed?10:ctx.canvas.width){
      const segmentWidth=dashed?6:ctx.canvas.width;
      rect(ctx,x,y,segmentWidth,lineWidth,asset.color);
    }
    if(['rail','subway','railTunnel'].includes(asset.variant)){
      for(let x=2;x<ctx.canvas.width;x+=5)rect(ctx,x,y-2,1,lineWidth+4,'#786048');
    }
  }

  function canvasHeight(ctx){ return ctx.canvas?.height || 16; }

  function renderDetail(canvas,asset){
    const metric=asset.metric;
    canvas.width=metric.width;canvas.height=metric.height;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
    if(metric.kind==='tile') renderTileDetail(ctx,asset);
    else if(metric.kind==='line') renderLineDetail(ctx,asset);
    else if(asset.variant==='buildings') building(ctx,24,24,P.roof);
    else if(asset.variant==='poi'){
      const poiCatalog=global.PixelMapPoiSprites;
      const measurement=poiCatalog?.measure('pop_station','M');
      if(measurement){
        canvas.width=measurement.width;canvas.height=measurement.height;
        const poiCtx=canvas.getContext('2d');poiCtx.imageSmoothingEnabled=false;
        poiCatalog.draw(poiCtx,'pop_station',-measurement.left,-measurement.top,'M');
      }
    }
    else if(asset.variant==='dots'){
      rect(ctx,0,0,7,7,P.outline);rect(ctx,2,2,3,3,'#f8d038');
    }
    else{
      const labels={station:'駅名',park:'公園名',poi:'施設名',place:'地名',terrain:'山名'};
      ctx.font=`${metric.fontSize}px DotGothic16,monospace`;
      ctx.textBaseline='top';ctx.fillStyle=asset.color;ctx.fillText(labels[asset.variant],1,1);
    }
  }

  global.PixelMapLayerAssets=Object.freeze({groups,layers,render,renderDetail});
})(window);
