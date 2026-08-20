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

  /*
    交通レイヤーの唯一の正典。
    - 寸法は768×768の完成画像上の論理pxで記述する。
    - map-02-refined.html の単体表示と、このカタログの見本は同じ定義を参照する。
    - gridKind / polygonKind はマップ内部の意味セルへ変換するための抽象名。
  */
  const transportRules = Object.freeze({
    localRoads:Object.freeze({
      renderer:'direct', gridKind:'road', polygonKind:'road', thick:false,
      logicalWidth:1, casing:0, fill:'#c6c6c0', edge:'#8e8e88', center:null,
    }),
    regionalRoads:Object.freeze({
      renderer:'direct', gridKind:'roadMajor', polygonKind:'roadMajor', thick:false,
      logicalWidth:8, casing:1, fill:'#d0d0ca', edge:'#9e9e98', center:'#f8f0d8',
      centerWidth:1, dash:[7,6],
    }),
    majorRoads:Object.freeze({
      renderer:'direct', gridKind:'highway', polygonKind:'highway', thick:true,
      logicalWidth:10, casing:1, fill:'#d8c890', edge:'#a89058', center:'#e8b840',
      centerWidth:1, dash:[10,7],
    }),
    motorways:Object.freeze({
      renderer:'direct', gridKind:'highway', polygonKind:'highway', thick:true,
      logicalWidth:14, casing:1.5, fill:'#d8c890', edge:'#8f7848', center:'#f8d878',
      centerWidth:1, dash:[10,7],
    }),
    paths:Object.freeze({
      renderer:'cell', gridKind:'path', polygonKind:'pave', thick:false,
      cellSize:8, logicalWidth:1, fill:'#dcc890', detail:'#c4ac70',
    }),
    tracks:Object.freeze({
      renderer:'cell', gridKind:'path', polygonKind:'gravel', thick:false,
      cellSize:8, logicalWidth:2, fill:'#b8a47c', detail:'#888078',
    }),
    raceways:Object.freeze({
      renderer:'cell', gridKind:'roadMajor', polygonKind:'roadMajor', thick:true,
      cellSize:8, logicalWidth:8, fill:'#c99868', edge:'#8e6848',
    }),
    ferries:Object.freeze({
      renderer:'cell', gridKind:'path', polygonKind:'path', thick:false,
      cellSize:8, logicalWidth:2, fill:'#c8e8f8', dashed:true,
    }),
    piers:Object.freeze({
      renderer:'cell', gridKind:'path', polygonKind:'pave', thick:false,
      cellSize:8, logicalWidth:2, fill:'#d0b078',
    }),
    rail:Object.freeze({
      renderer:'rail-cell', gridKind:'rail', polygonKind:'gravel', thick:false,
      cellSize:8, bedWidth:8, railWidth:1, railCount:2,
      fill:'#404048', tie:'#786048', bed:'#a8a098', bedDark:'#888078', bedLight:'#c0b8b0',
    }),
    subway:Object.freeze({
      renderer:'direct-dash', gridKind:'rail', polygonKind:'gravel', thick:false,
      logicalWidth:2.5, fill:'#282838', alpha:.3, dash:[5,5],
    }),
    aerialways:Object.freeze({
      renderer:'rail-cell', gridKind:'rail', polygonKind:'gravel', thick:false,
      cellSize:8, bedWidth:8, railWidth:1, railCount:2,
      fill:'#404048', tie:'#786048', bed:'#a8a098', bedDark:'#888078', bedLight:'#c0b8b0',
    }),
    transportationOther:Object.freeze({
      renderer:'cell', gridKind:'path', polygonKind:'pave', thick:false,
      cellSize:8, logicalWidth:2, fill:'#dcc890', detail:'#c4ac70',
    }),
    roadTunnels:Object.freeze({
      renderer:'direct-dash', logicalWidth:2.5, fill:'#282838', alpha:.3, dash:[5,5],
    }),
    pathTunnels:Object.freeze({
      renderer:'direct-dash', logicalWidth:2.5, fill:'#282838', alpha:.3, dash:[5,5],
    }),
    railTunnels:Object.freeze({
      renderer:'direct-dash', logicalWidth:2.5, fill:'#282838', alpha:.3, dash:[5,5],
    }),
  });

  function metricForTransport(id){
    const rule=transportRules[id];
    if(!rule) return Object.freeze({kind:'line',label:'1 px LINE',lineWidth:1,width:32,height:16});
    if(rule.renderer==='rail-cell'){
      return Object.freeze({
        kind:'cell-route',
        label:`${rule.cellSize}×${rule.cellSize} px CELL / ${rule.railWidth} px × ${rule.railCount} RAILS`,
        width:rule.cellSize,height:rule.cellSize,cellSize:rule.cellSize,
        railWidth:rule.railWidth,railCount:rule.railCount,
      });
    }
    if(rule.renderer==='cell'){
      return Object.freeze({
        kind:'cell-route',
        label:`${rule.cellSize}×${rule.cellSize} px CELL / ${rule.logicalWidth} px LINE`,
        width:rule.cellSize,height:rule.cellSize,cellSize:rule.cellSize,lineWidth:rule.logicalWidth,
      });
    }
    return Object.freeze({
      kind:'line',label:`${rule.logicalWidth} px LINE / DIRECT TRACE`,lineWidth:rule.logicalWidth,
      width:32,height:Math.max(16,Math.ceil(rule.logicalWidth)+8),
    });
  }

  const LINE_WIDTHS = Object.freeze({
    river:1.4, stream:.65, canal:1.4, drain:1.1, other:1,
    local:14, regional:16, major:20, motorway:28,
    path:2, track:4, raceway:8, ferry:2, pier:4,
    rail:4, subway:4, aerialway:2,
    roadTunnel:5, pathTunnel:5, railTunnel:5,
  });

  function metricFor(kind,variant,id){
    if(kind==='surface' || (kind==='water' && variant==='area')){
      return Object.freeze({kind:'tile',label:'16×16 px TILE',width:16,height:16});
    }
    if(kind==='route') return metricForTransport(id);
    if(kind==='water' || kind==='route'){
      const lineWidth=LINE_WIDTHS[variant] ?? 1;
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
    id:item[0], label:item[1], kind:item[2],
    color:item[2]==='route' && transportRules[item[0]] ? transportRules[item[0]].fill : item[3],
    variant:item[4], group:group.id, groupLabel:group.label,
    metric:metricFor(item[2],item[4],item[0]),
  }))));

  const P = Object.freeze({
    outline:'#302838', grass:'#7cbc54', grassDark:'#619c42', grassLight:'#98d470',
    treeDark:'#2c6030', tree:'#3e8840', treeLight:'#5cb050', trunk:'#785030',
    water:'#4890e0', waterLight:'#88c0f0', waterDark:'#3068b8', foam:'#c8e8f8',
    wall:'#f0e4c8', wallDark:'#c8b490', roof:'#e05038', roofBlue:'#5078d8', window:'#3868a0',
  });

  function rect(ctx,x,y,w,h,color){ ctx.fillStyle=color;ctx.fillRect(x,y,w,h); }

  function connectedOrDefault(connections){
    const value={L:false,R:false,U:false,D:false,...connections};
    if(!value.L && !value.R && !value.U && !value.D) value.L=value.R=true;
    return value;
  }

  /* 標準表示の8論理px交通セル。assetsと単体マップが同じ関数を使う。 */
  function drawStandardTransportCell(ctx,option,x=0,y=0,connections=null,settings={}){
    const rule=transportRules[option];
    if(!rule || !['cell','rail-cell'].includes(rule.renderer)) return false;
    const scale=settings.scale || 1;
    const con=connectedOrDefault(connections);
    const r=(rx,ry,rw,rh,color)=>rect(ctx,x+rx*scale,y+ry*scale,rw*scale,rh*scale,color);
    const size=rule.cellSize || 8;
    if(settings.background){
      r(0,0,size,size,settings.background);
    }
    if(rule.renderer==='rail-cell'){
      r(0,0,size,size,rule.bed);
      r(1,2,1,1,rule.bedDark);r(5,4,1,1,rule.bedDark);r(3,6,1,1,rule.bedDark);
      r(6,1,1,1,rule.bedLight);r(0,5,1,1,rule.bedLight);
      if(con.L) r(1,1,1,6,rule.tie);
      if(con.R) r(6,1,1,6,rule.tie);
      if(con.U) r(1,1,6,1,rule.tie);
      if(con.D) r(1,6,6,1,rule.tie);
      if(con.L){r(0,2,6,1,rule.fill);r(0,5,6,1,rule.fill);}
      if(con.R){r(2,2,6,1,rule.fill);r(2,5,6,1,rule.fill);}
      if(con.U){r(2,0,1,6,rule.fill);r(5,0,1,6,rule.fill);}
      if(con.D){r(2,2,1,6,rule.fill);r(5,2,1,6,rule.fill);}
      return true;
    }
    const width=Math.max(1,rule.logicalWidth || 1);
    const center=Math.floor(size/2);
    const half=Math.floor(width/2);
    const start=center-half;
    if(rule.dashed && settings.dashOff) return true;
    if(con.L) r(0,start,center+Math.ceil(width/2),width,rule.fill);
    if(con.R) r(center,start,size-center,width,rule.fill);
    if(con.U) r(start,0,width,center+Math.ceil(width/2),rule.fill);
    if(con.D) r(start,center,width,size-center,rule.fill);
    r(start,start,width,width,rule.fill);
    return true;
  }

  function previewRouteCells(ctx,asset){
    const rule=transportRules[asset.id];
    const size=rule.cellSize || 8;
    const cells=[];
    let cx=-1,cy=14;
    while(cx*size<ctx.canvas.width+size){
      for(let run=0;run<5 && cx*size<ctx.canvas.width+size;run++) cells.push([++cx,cy]);
      cells.push([cx,--cy]);
    }
    const occupied=new Set(cells.map(([x,y])=>`${x},${y}`));
    for(const [x,y] of cells){
      drawStandardTransportCell(ctx,asset.id,x*size,y*size,{
        L:occupied.has(`${x-1},${y}`),R:occupied.has(`${x+1},${y}`),
        U:occupied.has(`${x},${y-1}`),D:occupied.has(`${x},${y+1}`),
      },{dashOff:rule.dashed && (x+y)%3===0});
    }
  }
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
    const rule=transportRules[asset.id];
    if(!rule) return;
    if(asset.id==='ferries') rect(ctx,0,0,288,180,P.water);
    if(rule.renderer==='cell' || rule.renderer==='rail-cell'){
      previewRouteCells(ctx,asset);
      return;
    }
    const dashed=rule.renderer==='direct-dash';
    const casing=(rule.casing || 0)*2;
    if(casing>0) steppedLine(ctx,rule.edge,rule.logicalWidth+casing,dashed);
    steppedLine(ctx,rule.fill,rule.logicalWidth,dashed);
    if(rule.center) steppedLine(ctx,rule.center,rule.centerWidth || 1,true);
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
  }

  function renderCellRouteDetail(ctx,asset){
    const rule=transportRules[asset.id];
    const background=asset.id==='ferries' ? P.water : P.grass;
    drawStandardTransportCell(ctx,asset.id,0,0,{L:true,R:true},{background});
  }

  function canvasHeight(ctx){ return ctx.canvas?.height || 16; }

  function renderDetail(canvas,asset){
    const metric=asset.metric;
    canvas.width=metric.width;canvas.height=metric.height;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
    if(metric.kind==='tile') renderTileDetail(ctx,asset);
    else if(metric.kind==='line') renderLineDetail(ctx,asset);
    else if(metric.kind==='cell-route') renderCellRouteDetail(ctx,asset);
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

  global.PixelMapLayerAssets=Object.freeze({
    groups,layers,transportRules,render,renderDetail,drawStandardTransportCell,
  });
})(window);
