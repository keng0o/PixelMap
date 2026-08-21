((global) => {
  'use strict';

  const P = Object.freeze({
    outline:'#302838', treeDk:'#2c6030', treeMd:'#3e8840', treeLt:'#5cb050', trunk:'#785030',
    dirt:'#d0b078', dirtDk:'#b09058', roofA:'#e05038', roofADk:'#b03828', roofB:'#5078d8',
    wall:'#f0e4c8', win:'#3868a0',
  });
  let ctx = null;
  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const sh = (hex, factor = .72) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.round(((n>>16)&255)*factor)},${Math.round(((n>>8)&255)*factor)},${Math.round((n&255)*factor)})`;
  };
  const hi = (hex, factor = 1.28) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.min(255,Math.round(((n>>16)&255)*factor))},${Math.min(255,Math.round(((n>>8)&255)*factor))},${Math.min(255,Math.round((n&255)*factor))})`;
  };

  function block(x, y, width, height, color){
    px(x,y,width,height,color);
    px(x+width-1,y,1,height,sh(color,.85));
    px(x,y+height-2,width,2,sh(color,.82));
    px(x,y+height-1,width,1,sh(color,.5));
  }
  function roofBar(x, y, width, height, color){
    px(x,y,width,height,color);
    px(x,y,width,1,hi(color));
    px(x,y+height-1,width,1,sh(color,.7));
  }
  function win(x, y, width, height){
    px(x,y,width,height,P.win);
    px(x,y,width,1,'#c8e4f4');
  }
  function sign(x, y, width){
    px(x,y,width,2,'#f8f0d8');
    px(x,y+2,width,1,sh('#f8f0d8',.65));
  }
  function yard(cx, cy, width){
    px(cx-width,cy-2,width*2,5,'#8cc864');
    px(cx-width,cy+2,width*2,1,'#78b452');
    for(let i=-width;i<width-1;i+=3) px(cx+i,cy+1,2,2,P.treeMd);
    px(cx-width+2,cy-1,1,1,'#f87890');
    px(cx+width-4,cy-1,1,1,'#f8f8f8');
    px(cx-1,cy+3,2,1,'#f8d038');
  }
  function house(cx, cy, roof, wall = P.wall, wide = false){
    const half = wide ? 9 : 7, x = cx-half, y = cy-15;
    yard(cx,cy,half+5);
    block(x+2,y+5,half*2-4,10,wall);
    roofBar(x,y+1,half*2,4,roof);
    px(x-1,y+2,1,2,roof); px(x+half*2,y+2,1,2,roof);
    px(x+2,y+5,half*2-4,1,sh(wall,.7));
    win(x+3,y+7,3,3); win(x+half*2-6,y+7,3,3); win(x+half-2,y+8,4,4);
    return {x,y,w:half*2,h:15};
  }
  function stall(cx, cy, awning, deco){
    const x=cx-7,y=cy-13;
    yard(cx,cy,10); block(x+2,y+5,10,8,P.wall); roofBar(x,y+1,14,4,awning);
    px(x-1,y+2,1,2,awning); px(x+14,y+2,1,2,awning); px(x+2,y+5,10,1,sh(P.wall,.7));
    deco?.(x,y);
  }
  function signPost(cx, cy, plate, deco){
    px(cx-1,cy-9,2,9,P.trunk); px(cx-1,cy-1,2,1,sh(P.trunk,.55));
    px(cx-5,cy-14,10,6,plate); px(cx-5,cy-14,10,1,hi(plate));
    px(cx+4,cy-14,1,6,sh(plate,.8)); px(cx-5,cy-9,10,1,sh(plate,.7));
    deco?.(cx,cy);
  }

  /* --- しろポップ系ヘルパー: 白地＋インク輪郭＋原色アクセント --- */
  const POP = Object.freeze({
    ink:'#2c3452', white:'#ffffff', shade:'#e2e8f2',
    red:'#e8474f', yellow:'#f7c948', blue:'#3fb5e5', green:'#8bc53f',
  });
  function popPad(cx, cy, half){
    px(cx-half,cy-2,half*2,4,POP.ink);
    px(cx-half+1,cy-1,half*2-2,2,POP.white);
    px(cx-half+3,cy,2,1,POP.green); px(cx+half-6,cy,2,1,POP.blue); px(cx-1,cy,2,1,POP.yellow);
  }
  function popBox(x, y, w, h, fill = POP.white){
    px(x,y,w,h,POP.ink);
    px(x+1,y+1,w-2,h-2,fill);
    if (fill === POP.white) px(x+w-2,y+1,1,h-2,POP.shade);
  }
  function popWin(x, y, w = 4, h = 4){ px(x,y,w,h,POP.ink); px(x+1,y+1,w-2,h-2,POP.blue); }
  function popDoor(x, y, color = POP.yellow){ px(x,y,4,6,POP.ink); px(x+1,y+1,2,5,color); }

  const SPRITES = {
    station:{ label:'鉄道駅',
      S:(x,y)=>{ yard(x,y,14);block(x-7,y-10,14,10,P.wall);roofBar(x-9,y-14,18,4,P.roofA);px(x-7,y-10,14,1,sh(P.wall,.7));sign(x-4,y-9,8);win(x-5,y-6,3,3);win(x-1,y-6,3,4);win(x+3,y-6,3,3); },
      M:(x,y)=>{ yard(x,y,18);block(x-12,y-12,24,12,P.wall);roofBar(x-14,y-18,28,5,P.roofA);roofBar(x-4,y-23,8,2,P.roofA);px(x-3,y-21,6,4,'#f8f0d8');px(x+2,y-21,1,4,sh('#f8f0d8',.8));px(x-1,y-20,2,2,P.outline);for(let i=0;i<7;i++)px(x-14+i*4,y-13,4,2,i%2?'#f8f0d8':P.roofA);px(x-12,y-11,24,1,sh(P.wall,.7));sign(x-5,y-10,10);win(x-10,y-7,4,4);win(x+6,y-7,4,4);win(x-4,y-7,8,5);px(x-1,y-7,2,5,P.wall); },
      L:(x,y)=>{ yard(x,y,24);block(x-18,y-15,36,15,P.wall);roofBar(x-20,y-21,40,6,P.roofA);roofBar(x-5,y-28,10,2,P.roofA);px(x-4,y-26,8,5,'#f8f0d8');px(x+3,y-26,1,5,sh('#f8f0d8',.8));px(x-1,y-25,2,3,P.outline);for(let i=0;i<10;i++)px(x-20+i*4,y-15,4,2,i%2?'#f8f0d8':P.roofA);px(x-18,y-13,36,1,sh(P.wall,.7));sign(x-8,y-12,16);win(x-14,y-9,28,6);for(let i=1;i<=3;i++)px(x-14+i*7,y-9,1,6,P.wall);px(x-14,y-3,28,1,sh(P.wall,.8)); },
    },
    bus:{label:'バス停',draw:(x,y)=>signPost(x,y,P.roofB,(cx,cy)=>px(cx-2,cy-12,4,2,'#f8f0d8'))},
    shop:{label:'お店',
      S:(x,y)=>stall(x,y,P.roofB,(sx,sy)=>{for(let i=0;i<5;i++)px(sx+i*3,sy+1,1,3,'#f8f0d8');}),
      L:(x,y)=>{const r=house(x,y,P.roofB,P.wall,true);for(let i=0;i<6;i++)px(r.x+i*3,r.y+1,1,3,'#f8f0d8');},
    },
    mall:{label:'モール',
      M:(x,y)=>{const r=house(x,y,P.roofB,P.wall,true);for(let i=0;i<6;i++)px(r.x+i*3,r.y+1,1,3,'#f8f0d8');},
      L:(x,y)=>{yard(x,y,23);block(x-17,y-17,34,17,P.wall);px(x-8,y-23,16,5,'#f8d038');px(x-8,y-23,16,1,hi('#f8d038'));px(x+7,y-23,1,5,sh('#f8d038',.8));px(x-6,y-21,12,2,P.outline);for(let i=0;i<9;i++)px(x-17+i*4,y-14,4,3,i%2?'#f8f0d8':P.roofB);px(x-17,y-11,34,1,sh(P.wall,.7));win(x-14,y-9,10,6);win(x-3,y-9,6,6);win(x+4,y-9,10,6);},
    },
    grocery:{label:'食料品店',draw:(x,y)=>stall(x,y,'#58a048',(sx,sy)=>px(sx+5,sy+8,4,3,'#f89040'))},
    restaurant:{label:'レストラン',draw:(x,y)=>stall(x,y,'#f89040',(sx,sy)=>{px(sx+4,sy+7,6,2,'#f8f0d8');px(sx+6,sy+7,1,2,P.roofADk);})},
    fast_food:{label:'ファストフード',draw:(x,y)=>stall(x,y,'#e8b048',(sx,sy)=>{px(sx+4,sy+8,6,2,'#f8d038');px(sx+4,sy+7,6,1,P.dirt);})},
    cafe:{label:'カフェ',draw:(x,y)=>stall(x,y,P.trunk,(sx,sy)=>{px(sx+4,sy+7,5,4,'#f8f0d8');px(sx+9,sy+8,1,2,'#f8f0d8');px(sx+5,sy+5,1,2,'#c8c8d0');px(sx+7,sy+5,1,2,'#c8c8d0');})},
    bar:{label:'酒場',draw:(x,y)=>stall(x,y,'#a04878',(sx,sy)=>{px(sx+5,sy+7,4,3,'#f8d038');px(sx+6,sy+10,2,1,'#f8f0d8');})},
    hotel:{label:'宿屋',
      S:(x,y)=>{const r=house(x,y,'#8860c8');px(r.x+r.w/2-2,r.y-3,4,3,'#f8d038');px(r.x+r.w/2-2,r.y-3,4,1,hi('#f8d038'));},
      L:(x,y)=>{yard(x,y,16);block(x-10,y-27,20,27,'#e8e0d0');px(x-11,y-29,22,2,'#8860c8');px(x-11,y-29,22,1,hi('#8860c8'));for(let row=0;row<4;row++)for(let i=0;i<4;i++){const lit=(row*4+i)%3===0;px(x-8+i*5,y-25+row*5,3,3,lit?'#f8d038':P.win);px(x-8+i*5,y-25+row*5,3,1,lit?'#fce88a':'#c8e4f4');}win(x-3,y-5,6,4);px(x-2,y-32,4,3,'#f8d038');px(x-2,y-32,4,1,hi('#f8d038'));},
    },
    hospital:{label:'病院',
      S:(x,y)=>{house(x,y,'#e8e0d0','#f8f8f0');px(x+10,y-15,6,6,'#f8f8f0');px(x+10,y-15,6,1,hi('#f8f8f0'));px(x+15,y-15,1,6,sh('#f8f8f0',.8));px(x+12,y-14,2,4,'#48a050');px(x+11,y-13,4,2,'#48a050');px(x+10,y-9,6,1,sh('#f8f8f0',.6));},
      L:(x,y)=>{yard(x,y,18);block(x-12,y-26,24,26,'#f8f8f0');px(x-13,y-28,26,2,'#c8c8c0');px(x-13,y-28,26,1,hi('#c8c8c0'));px(x-1,y-25,3,9,P.roofA);px(x-4,y-22,9,3,P.roofA);px(x-1,y-25,3,1,hi(P.roofA));for(let i=0;i<5;i++){win(x-10+i*5,y-16,3,3);win(x-10+i*5,y-11,3,3);}win(x-4,y-6,8,4);},
    },
    pharmacy:{label:'薬屋',draw:(x,y)=>signPost(x,y,'#f8f8f0',(cx,cy)=>{px(cx-1,cy-13,2,4,'#48a050');px(cx-2,cy-12,4,2,'#48a050');})},
    school:{label:'学校',
      S:(x,y)=>{yard(x,y,16);px(x-11,y-14,22,2,'#8890a0');px(x-11,y-14,22,1,hi('#8890a0'));block(x-10,y-12,20,12,P.wall);px(x-10,y-12,20,1,sh(P.wall,.7));win(x-7,y-9,3,3);win(x-2,y-9,3,3);win(x+4,y-9,3,3);px(x+12,y-19,1,19,'#a8a8b0');px(x+13,y-19,5,3,P.roofA);px(x+13,y-19,5,1,hi(P.roofA));},
      M:(x,y)=>{yard(x,y,21);px(x-15,y-16,30,2,'#8890a0');px(x-15,y-16,30,1,hi('#8890a0'));block(x-14,y-14,28,14,P.wall);px(x-14,y-14,28,1,sh(P.wall,.7));for(let i=0;i<6;i++)win(x-13+i*5,y-12,3,3);for(let i=0;i<6;i++)win(x-13+i*5,y-7,3,3);roofBar(x-3,y-23,7,2,P.roofA);px(x-2,y-21,5,5,'#f8f0d8');px(x+2,y-21,1,5,sh('#f8f0d8',.8));px(x-1,y-19,2,2,P.outline);px(x+17,y-24,1,24,'#a8a8b0');px(x+18,y-24,6,4,P.roofA);px(x+18,y-24,6,1,hi(P.roofA));},
      L:(x,y)=>{yard(x,y,27);px(x-20,y-21,40,2,'#8890a0');px(x-20,y-21,40,1,hi('#8890a0'));block(x-19,y-19,38,19,P.wall);px(x-19,y-19,38,1,sh(P.wall,.7));for(let row=0;row<3;row++)for(let i=0;i<8;i++)win(x-18+i*5,y-17+row*5,3,3);roofBar(x-5,y-28,11,2,P.roofA);px(x-4,y-26,9,5,'#f8f0d8');px(x+4,y-26,1,5,sh('#f8f0d8',.8));px(x-1,y-25,2,3,P.outline);px(x+22,y-30,1,30,'#a8a8b0');px(x+23,y-30,7,4,P.roofA);px(x+23,y-30,7,1,hi(P.roofA));},
    },
    library:{label:'図書館',draw:(x,y)=>{const r=house(x,y,'#786048');px(r.x+4,r.y+7,3,5,'#8860c8');px(r.x+8,r.y+7,3,5,P.roofB);}},
    bank:{label:'銀行',draw:(x,y)=>signPost(x,y,'#f8d038',(cx,cy)=>{px(cx-2,cy-13,4,4,'#b89020');px(cx-1,cy-12,2,2,'#f8d038');})},
    post:{label:'郵便',draw:(x,y)=>{px(x-2,y-11,4,11,P.roofA);px(x-2,y-11,4,1,hi(P.roofA));px(x+1,y-11,1,11,sh(P.roofA,.8));px(x-2,y-9,4,1,'#f8f0d8');px(x-2,y-1,4,1,sh(P.roofA,.5));}},
    police:{label:'交番',draw:(x,y)=>{const r=house(x,y,'#4058a8');px(r.x+r.w/2-1,r.y+1,2,2,'#f8d038');}},
    fire_station:{label:'消防署',draw:(x,y)=>house(x,y,P.roofADk)},
    townhall:{label:'役所',draw:(x,y)=>{const r=house(x,y,'#687078',P.wall,true);px(r.x+r.w/2,r.y-4,1,4,P.trunk);px(r.x+r.w/2+1,r.y-4,4,2,'#f8d038');}},
    place_of_worship:{label:'神社・寺',draw:(x,y)=>{px(x-8,y-14,16,2,P.roofA);px(x-8,y-14,16,1,hi(P.roofA));px(x-8,y-12,16,1,sh(P.roofA,.7));px(x-6,y-10,12,2,P.roofADk);px(x-6,y-8,2,8,P.roofADk);px(x+4,y-8,2,8,P.roofADk);px(x-5,y-8,1,8,sh(P.roofADk,.8));px(x+5,y-8,1,8,sh(P.roofADk,.8));px(x-6,y-1,2,1,sh(P.roofADk,.5));px(x+4,y-1,2,1,sh(P.roofADk,.5));}},
    attraction:{label:'名所',draw:(x,y)=>signPost(x,y,'#f8d038',(cx,cy)=>{px(cx-1,cy-13,2,2,P.roofA);px(cx-3,cy-11,6,1,P.roofA);})},
    monument:{label:'トロフィー記念塔',draw:(x,y)=>{yard(x,y,12);px(x-9,y-22,3,7,'#d6a93f');px(x+6,y-22,3,7,'#d6a93f');px(x-11,y-22,3,3,'#f0cf5a');px(x+8,y-22,3,3,'#f0cf5a');px(x-8,y-25,16,5,'#f0cf5a');px(x-6,y-20,12,6,'#e6bd4d');px(x-3,y-14,6,7,'#d6a93f');px(x-7,y-7,14,3,'#6fa7a2');px(x-10,y-4,20,4,'#456b6b');px(x-1,y-23,2,2,'#d95072');}},
    castle:{label:'宝箱の城塞',draw:(x,y)=>{yard(x,y,20);block(x-16,y-14,32,14,'#d6a88f');px(x-18,y-17,8,17,'#a45f58');px(x+10,y-17,8,17,'#a45f58');px(x-17,y-20,6,4,'#f0d1bd');px(x+11,y-20,6,4,'#f0d1bd');px(x-8,y-17,16,4,'#f0d1bd');px(x-6,y-24,12,8,'#70507f');px(x-4,y-27,8,4,'#a882c5');px(x-14,y-10,28,3,'#f0d1bd');px(x-2,y-11,5,7,'#6f3f46');px(x-1,y-9,3,3,'#f0cf5a');px(x-1,y-8,1,3,'#70507f');}},
    gallery:{label:'ブックギャラリー',draw:(x,y)=>{yard(x,y,17);block(x-13,y-12,26,12,'#a45f58');px(x-3,y-9,6,9,'#6f3f46');px(x-16,y-22,15,5,'#f8eee5');px(x-15,y-25,13,4,'#f8eee5');px(x-12,y-27,10,3,'#f8eee5');px(x+1,y-22,15,5,'#f8eee5');px(x+2,y-25,13,4,'#f8eee5');px(x+2,y-27,10,3,'#f8eee5');px(x-1,y-24,2,9,'#d6a88f');for(let i=0;i<3;i++){px(x-12,y-23+i*3,8,1,'#d6a88f');px(x+4,y-23+i*3,8,1,'#d6a88f');}px(x-14,y-16,28,3,'#6f3f46');}},
    museum:{label:'博物館',draw:(x,y)=>{const r=house(x,y,'#a0a070');px(r.x+3,r.y+6,2,8,'#e0d8c0');px(r.x+7,r.y+6,2,8,'#e0d8c0');px(r.x+11,r.y+6,2,8,'#e0d8c0');}},
    theatre:{label:'仮面劇場',draw:(x,y)=>{yard(x,y,18);block(x-14,y-12,28,12,'#a45f58');roofBar(x-16,y-17,32,5,'#f0d1bd');px(x-5,y-11,10,11,'#6f3f46');px(x-11,y-27,9,9,'#f8eee5');px(x+2,y-27,9,9,'#f8eee5');px(x-9,y-24,2,2,'#70507f');px(x-5,y-24,2,2,'#70507f');px(x+4,y-24,2,2,'#70507f');px(x+8,y-24,2,2,'#70507f');px(x-8,y-21,5,1,'#d95072');px(x+4,y-20,5,1,'#d95072');px(x-1,y-29,2,6,'#f0cf5a');px(x-4,y-28,8,2,'#f0cf5a');}},
    cinema:{label:'劇場・映画館',draw:(x,y)=>stall(x,y,'#a04878',(sx,sy)=>{px(sx+4,sy+7,2,2,'#f8d038');px(sx+8,sy+8,2,2,'#f8d038');})},
    park:{label:'公園',draw:(x,y)=>{px(x-6,y-2,12,2,'rgba(24,40,16,.3)');px(x-5,y-17,10,1,P.treeMd);px(x-6,y-16,12,2,P.treeMd);px(x-7,y-15,14,6,P.treeMd);px(x-4,y-17,5,1,hi(P.treeMd));px(x-4,y-16,5,3,P.treeLt);px(x+1,y-12,5,3,P.treeDk);px(x-6,y-10,12,1,P.treeDk);px(x-1,y-8,2,6,P.trunk);px(x-1,y-3,2,1,sh(P.trunk,.55));px(x-10,y-4,5,4,P.treeMd);px(x-10,y-1,5,1,P.treeDk);px(x-9,y-4,2,1,P.treeLt);px(x+6,y-4,5,4,P.treeMd);px(x+6,y-1,5,1,P.treeDk);px(x+7,y-4,2,1,P.treeLt);}},
    zoo:{label:'クリーチャー塔',draw:(x,y)=>{yard(x,y,14);block(x-9,y-20,18,20,'#6fa7a2');px(x-11,y-30,22,10,'#a45f58');px(x-8,y-33,16,4,'#a45f58');px(x-1,y-37,2,4,'#6f3f46');px(x-7,y-27,3,3,'#f0cf5a');px(x+4,y-27,3,3,'#f0cf5a');px(x-4,y-22,8,2,'#6f3f46');px(x-3,y-15,2,3,'#456b6b');px(x+2,y-15,2,3,'#456b6b');px(x-4,y-7,8,7,'#456b6b');px(x-11,y-19,3,7,'#d95072');px(x+8,y-19,3,7,'#d95072');}},
    parking:{label:'駐車場',draw:(x,y)=>signPost(x,y,P.roofB,(cx,cy)=>{px(cx-1,cy-13,1,4,'#f8f0d8');px(cx,cy-13,2,2,'#f8f0d8');})},
    charge_hub:{label:'ギア充電工房',draw:(x,y)=>{yard(x,y,19);block(x-16,y-14,32,14,'#6fa7a2');px(x-13,y-19,7,6,'#456b6b');px(x-11,y-24,3,6,'#a882c5');px(x+5,y-20,8,7,'#456b6b');px(x+7,y-25,3,6,'#a882c5');px(x-6,y-11,12,11,'#456b6b');px(x-10,y-10,3,3,'#f0d1bd');px(x+7,y-10,3,3,'#f0d1bd');px(x-3,y-8,6,6,'#a882c5');px(x-1,y-7,2,2,'#f0cf5a');px(x-2,y-5,2,3,'#f0cf5a');px(x,y-5,2,1,'#f0cf5a');px(x-17,y-16,34,3,'#6f3f46');}},
    /* --- 新テイスト候補（未接続・カタログのみ） --- */
    office:{label:'クリスタル商会',draw:(x,y)=>{yard(x,y,15);block(x-9,y-24,18,24,'#6fa7a2');px(x-10,y-27,20,3,'#456b6b');px(x-10,y-27,20,1,hi('#456b6b'));px(x-1,y-32,2,2,'#f0cf5a');px(x-2,y-30,4,3,'#e6bd4d');px(x-1,y-30,2,1,hi('#f0cf5a'));for(let row=0;row<2;row++)for(let i=0;i<3;i++){px(x-7+i*5,y-22+row*6,4,4,'#a882c5');px(x-7+i*5,y-22+row*6,4,1,hi('#a882c5'));}px(x-7,y-10,4,4,'#a882c5');px(x+3,y-10,4,4,'#a882c5');px(x-3,y-7,6,7,'#456b6b');px(x-2,y-6,4,6,'#6f3f46');px(x,y-4,1,2,'#f0cf5a');}},
    civic_hall:{label:'王章の役場',draw:(x,y)=>{yard(x,y,19);block(x-14,y-13,28,13,'#f0d1bd');px(x-16,y-16,32,3,'#a45f58');px(x-16,y-16,32,1,hi('#a45f58'));px(x-6,y-23,12,7,'#f8eee5');px(x-4,y-24,8,1,'#a45f58');px(x-7,y-16,14,1,sh('#f8eee5',.8));px(x-2,y-21,4,4,'#f0cf5a');px(x-1,y-20,2,2,'#d6a93f');px(x-15,y-23,1,7,'#6f3f46');px(x-14,y-23,3,4,'#d95072');px(x+14,y-23,1,7,'#6f3f46');px(x+11,y-23,3,4,'#d95072');px(x-11,y-10,2,10,'#f8eee5');px(x+9,y-10,2,10,'#f8eee5');px(x-7,y-9,3,3,'#a882c5');px(x+4,y-9,3,3,'#a882c5');px(x-2,y-6,4,6,'#6f3f46');px(x,y-4,1,1,'#f0cf5a');}},
    burger_stand:{label:'ジャンボバーガー屋台',draw:(x,y)=>{yard(x,y,13);block(x-9,y-8,18,8,'#d6a88f');px(x-9,y-8,18,1,sh('#d6a88f',.7));px(x-7,y-19,14,3,'#f0cf5a');px(x-5,y-20,10,1,'#f0cf5a');px(x-5,y-20,10,1,hi('#f0cf5a'));px(x-8,y-16,16,2,'#e6bd4d');px(x-4,y-19,1,1,'#f8eee5');px(x+1,y-18,1,1,'#f8eee5');px(x-1,y-17,1,1,'#f8eee5');px(x-8,y-14,16,2,'#6fa7a2');px(x-7,y-12,14,2,'#6f3f46');px(x-9,y-10,18,2,'#f0cf5a');px(x-5,y-6,10,4,'#456b6b');px(x-4,y-5,8,3,'#f8eee5');px(x+1,y-5,2,2,'#d95072');}},
    grand_station:{label:'大時計の停車場',draw:(x,y)=>{yard(x,y,20);block(x-15,y-12,30,12,'#f0d1bd');px(x-17,y-17,34,3,'#a45f58');px(x-17,y-17,34,1,hi('#a45f58'));px(x-14,y-20,28,3,'#a45f58');px(x-10,y-23,20,3,'#a45f58');px(x-10,y-23,20,1,hi('#a45f58'));px(x-4,y-22,8,8,'#f8eee5');px(x-4,y-22,8,1,hi('#f8eee5'));px(x-2,y-20,4,4,'#f0cf5a');px(x-1,y-19,1,2,'#6f3f46');px(x,y-18,1,1,'#6f3f46');for(let i=0;i<8;i++)px(x-15+i*4,y-12,4,2,i%2?'#f8eee5':'#6fa7a2');px(x-3,y-8,6,8,'#6f3f46');px(x-2,y-7,4,7,'#456b6b');px(x-11,y-8,4,4,'#a882c5');px(x+7,y-8,4,4,'#a882c5');}},
    owl_library:{label:'フクロウ文庫',draw:(x,y)=>{yard(x,y,14);block(x-9,y-18,18,18,'#d6a88f');px(x-10,y-21,20,3,'#a45f58');px(x-10,y-21,20,1,hi('#a45f58'));px(x-3,y-24,6,3,'#a45f58');px(x-3,y-26,2,2,'#6f3f46');px(x+1,y-26,2,2,'#6f3f46');px(x-7,y-17,6,6,'#f8eee5');px(x+1,y-17,6,6,'#f8eee5');px(x-5,y-15,2,2,'#f0cf5a');px(x+3,y-15,2,2,'#f0cf5a');px(x-1,y-13,2,2,'#e6bd4d');px(x-7,y-6,3,6,'#70507f');px(x-3,y-6,3,6,'#d95072');px(x+1,y-6,3,6,'#6fa7a2');px(x+5,y-6,3,6,'#e6bd4d');px(x-7,y-6,11,1,hi('#f8eee5'));}},
    university:{label:'賢者の学府',draw:(x,y)=>{yard(x,y,24);block(x-19,y-13,38,13,'#f8eee5');px(x-20,y-15,40,2,'#d6a88f');px(x-20,y-15,40,1,hi('#d6a88f'));px(x-6,y-22,12,7,'#6fa7a2');px(x-4,y-24,8,2,'#6fa7a2');px(x-4,y-24,8,1,hi('#6fa7a2'));px(x-1,y-28,2,4,'#f0cf5a');px(x-2,y-26,4,1,'#f0cf5a');px(x-19,y-21,5,8,'#a45f58');px(x-20,y-23,7,2,'#6f3f46');px(x+14,y-21,5,8,'#a45f58');px(x+13,y-23,7,2,'#6f3f46');for(let i=0;i<7;i++)px(x-16+i*5,y-10,3,3,'#a882c5');px(x-3,y-7,6,7,'#6f3f46');px(x-2,y-6,4,6,'#70507f');}},
    college:{label:'魔導カレッジ',draw:(x,y)=>{yard(x,y,17);block(x-12,y-14,24,14,'#f0d1bd');px(x-13,y-18,26,4,'#70507f');px(x-13,y-18,26,1,hi('#70507f'));px(x-1,y-26,2,8,'#456b6b');px(x-3,y-27,6,2,'#a882c5');px(x,y-31,1,4,'#f0cf5a');px(x+1,y-30,2,1,'#f0cf5a');px(x-9,y-12,3,4,'#a882c5');px(x-3,y-12,3,4,'#a882c5');px(x+3,y-12,3,4,'#a882c5');px(x+8,y-14,3,6,'#d95072');px(x+9,y-8,1,1,'#d95072');px(x-2,y-6,5,6,'#6f3f46');px(x-1,y-4,1,1,'#f0cf5a');}},
    wing_post:{label:'翼の郵便小屋',draw:(x,y)=>{yard(x,y,13);block(x-8,y-11,16,11,'#f8eee5');px(x-9,y-14,18,3,'#d95072');px(x-9,y-14,18,1,hi('#d95072'));px(x-4,y-21,8,5,'#f0d1bd');px(x-4,y-21,8,1,hi('#f0d1bd'));px(x-3,y-20,2,1,'#d6a88f');px(x+1,y-20,2,1,'#d6a88f');px(x-1,y-19,2,1,'#d6a88f');px(x-8,y-20,4,2,'#f0cf5a');px(x-11,y-21,3,2,'#e6bd4d');px(x+4,y-20,4,2,'#f0cf5a');px(x+8,y-21,3,2,'#e6bd4d');px(x-5,y-8,4,3,'#a882c5');px(x+1,y-8,4,8,'#6f3f46');px(x+2,y-6,2,1,'#f0cf5a');}},
    art_museum:{label:'額縁美術館',draw:(x,y)=>{yard(x,y,18);block(x-13,y-11,26,11,'#f8eee5');px(x-11,y-9,2,9,'#f0d1bd');px(x-5,y-9,2,9,'#f0d1bd');px(x+3,y-9,2,9,'#f0d1bd');px(x+9,y-9,2,9,'#f0d1bd');px(x-12,y-27,24,16,'#e6bd4d');px(x-12,y-27,24,1,hi('#f0cf5a'));px(x-10,y-25,20,12,'#d6a93f');px(x-9,y-24,18,10,'#6fa7a2');px(x+3,y-23,3,3,'#f0cf5a');px(x-9,y-18,8,4,'#70507f');px(x-3,y-16,12,2,'#456b6b');px(x-2,y-6,4,6,'#6f3f46');}},
    menagerie:{label:'モンスター牧場',draw:(x,y)=>{yard(x,y,20);for(let i=0;i<5;i++)px(x-16+i*8,y-9,2,5,'#456b6b');px(x-16,y-6,32,2,'#456b6b');px(x-16,y-6,32,1,hi('#456b6b'));block(x-9,y-16,18,10,'#a45f58');px(x-10,y-19,20,3,'#6f3f46');px(x-10,y-19,20,1,hi('#a45f58'));px(x-9,y-23,3,4,'#f0d1bd');px(x+6,y-23,3,4,'#f0d1bd');px(x-3,y-11,6,5,'#6f3f46');px(x-2,y-10,4,4,'#70507f');px(x+8,y-14,7,7,'#a882c5');px(x+9,y-16,2,2,'#70507f');px(x+12,y-16,2,2,'#70507f');px(x+9,y-12,2,2,'#f0cf5a');px(x+12,y-12,2,2,'#f0cf5a');px(x+10,y-9,3,1,'#6f3f46');}},
    /* --- しろポップ（テスト用マップで接続）: 白地×インク輪郭×原色 --- */
    pop_office:{label:'しろいオフィス',draw:(x,y)=>{popPad(x,y,13);popBox(x-7,y-26,14,26);popBox(x-8,y-29,16,4,POP.blue);px(x,y-33,1,4,POP.ink);px(x-1,y-35,3,2,POP.red);for(let row=0;row<3;row++){popWin(x-5,y-24+row*6);popWin(x+1,y-24+row*6);}popDoor(x-2,y-6);}},
    pop_townhall:{label:'まちの役所',draw:(x,y)=>{popPad(x,y,17);popBox(x-13,y-13,26,13);popBox(x-14,y-17,28,4,POP.green);popBox(x-4,y-24,8,7);px(x-2,y-22,4,4,POP.ink);px(x-1,y-21,2,2,POP.yellow);px(x+3,y-28,1,4,POP.ink);px(x+4,y-28,4,3,POP.red);px(x-10,y-11,1,11,POP.ink);px(x+9,y-11,1,11,POP.ink);popWin(x-8,y-10);popWin(x+4,y-10);popDoor(x-2,y-6,POP.red);}},
    pop_fastfood:{label:'バーガーキオスク',draw:(x,y)=>{popPad(x,y,12);popBox(x-8,y-10,16,10);px(x-9,y-14,18,4,POP.ink);for(let i=0;i<4;i++)px(x-8+i*4,y-13,4,2,i%2?POP.white:POP.red);popBox(x-5,y-22,10,8);px(x-4,y-21,8,2,POP.yellow);px(x-4,y-19,8,1,POP.green);px(x-4,y-18,8,2,POP.red);px(x-4,y-16,8,1,POP.yellow);px(x-4,y-8,8,4,POP.ink);px(x-3,y-7,6,2,POP.blue);}},
    pop_station:{label:'しろい停車場',draw:(x,y)=>{popPad(x,y,16);popBox(x-12,y-12,24,12);popBox(x-14,y-16,28,4,POP.blue);px(x-3,y-23,6,6,POP.ink);px(x-2,y-22,4,4,POP.white);px(x-1,y-21,1,2,POP.ink);px(x,y-19,1,1,POP.ink);popWin(x-9,y-9);popWin(x+5,y-9);px(x-3,y-9,6,9,POP.ink);px(x-2,y-8,4,8,POP.yellow);for(let i=0;i<6;i++)px(x-12+i*4,y-2,4,1,i%2?POP.white:POP.red);}},
    pop_library:{label:'ひらいた図書館',draw:(x,y)=>{popPad(x,y,14);popBox(x-10,y-14,20,14);popBox(x-11,y-18,22,4,POP.blue);px(x-6,y-24,12,5,POP.ink);px(x-5,y-23,5,3,POP.white);px(x,y-23,5,3,POP.white);px(x-1,y-19,2,2,POP.red);popWin(x-8,y-11);popWin(x-2,y-11);popWin(x+4,y-11);popDoor(x-2,y-6,POP.green);}},
    pop_university:{label:'ドームの大学',draw:(x,y)=>{popPad(x,y,20);popBox(x-16,y-12,32,12);px(x-8,y-17,16,5,POP.ink);px(x-7,y-16,14,3,POP.white);px(x-2,y-15,4,2,POP.yellow);px(x-4,y-21,8,4,POP.ink);px(x-3,y-20,6,2,POP.green);px(x-1,y-23,2,2,POP.ink);px(x-16,y-16,1,4,POP.ink);px(x-15,y-16,3,2,POP.red);px(x+15,y-16,1,4,POP.ink);px(x+12,y-16,3,2,POP.red);px(x-12,y-10,1,10,POP.ink);px(x-6,y-10,1,10,POP.ink);px(x+5,y-10,1,10,POP.ink);px(x+11,y-10,1,10,POP.ink);popDoor(x-2,y-6,POP.blue);}},
    pop_college:{label:'ペナントカレッジ',draw:(x,y)=>{popPad(x,y,15);popBox(x-11,y-16,22,16);popBox(x-12,y-19,24,4,POP.yellow);px(x-1,y-27,1,8,POP.ink);px(x,y-27,5,2,POP.blue);px(x,y-25,3,1,POP.blue);popWin(x-8,y-14);popWin(x-2,y-14);popWin(x+4,y-14);popWin(x-8,y-8);popWin(x+4,y-8);popDoor(x-2,y-6,POP.red);}},
    pop_post:{label:'ふうとう郵便局',draw:(x,y)=>{popPad(x,y,14);popBox(x-8,y-11,16,11);popBox(x-9,y-14,18,4,POP.red);px(x-5,y-21,10,6,POP.ink);px(x-4,y-20,8,4,POP.white);px(x-3,y-19,2,1,POP.ink);px(x+1,y-19,2,1,POP.ink);px(x-1,y-18,2,1,POP.ink);px(x+2,y-17,2,1,POP.yellow);popWin(x-5,y-8);popDoor(x,y-6,POP.blue);px(x+10,y-8,4,8,POP.ink);px(x+11,y-7,2,6,POP.red);px(x+11,y-5,2,1,POP.ink);}},
    pop_art_museum:{label:'バナー美術館',draw:(x,y)=>{popPad(x,y,17);popBox(x-13,y-13,26,13);popBox(x-14,y-16,28,4,POP.blue);px(x-10,y-15,2,2,POP.white);px(x-4,y-15,2,2,POP.white);px(x+2,y-15,2,2,POP.white);px(x+8,y-15,2,2,POP.white);px(x-9,y-12,7,9,POP.ink);px(x-8,y-11,5,7,POP.red);px(x-6,y-9,1,3,POP.yellow);px(x-7,y-8,3,1,POP.yellow);popWin(x+6,y-10);popDoor(x+1,y-6,POP.green);px(x-13,y-11,1,11,POP.ink);px(x+12,y-11,1,11,POP.ink);}},
    pop_zoo:{label:'どうぶつゲート',draw:(x,y)=>{popPad(x,y,18);popBox(x-13,y-14,5,14);popBox(x+8,y-14,5,14);px(x-13,y-19,26,5,POP.ink);px(x-12,y-18,24,3,POP.yellow);px(x-2,y-17,3,2,POP.ink);px(x-4,y-18,1,1,POP.ink);px(x,y-18,1,1,POP.ink);px(x+2,y-18,1,1,POP.ink);px(x-8,y-7,16,1,POP.ink);px(x-8,y-3,16,1,POP.ink);for(let i=0;i<5;i++)px(x-7+i*4,y-7,1,4,POP.ink);px(x-18,y-8,5,5,POP.ink);px(x-17,y-7,3,3,POP.green);px(x+13,y-8,5,5,POP.ink);px(x+14,y-7,3,3,POP.green);px(x+5,y-22,3,2,POP.blue);px(x+7,y-23,1,1,POP.blue);}},
    generic:{label:'施設',draw:(x,y)=>signPost(x,y,P.dirt)},
  };

  const categories = Object.freeze([
    {id:'transit',label:'交通'}, {id:'commerce',label:'商業'}, {id:'food',label:'飲食'},
    {id:'stay',label:'宿泊'}, {id:'health',label:'医療'}, {id:'civic',label:'公共'},
    {id:'landmark',label:'観光'}, {id:'nature',label:'自然'}, {id:'service',label:'サービス'},
    {id:'generic',label:'その他'},
  ]);
  const categoryBySprite = {
    station:'transit',bus:'transit',shop:'commerce',mall:'commerce',grocery:'food',restaurant:'food',
    fast_food:'food',cafe:'food',bar:'food',hotel:'stay',hospital:'health',pharmacy:'health',school:'civic',
    library:'civic',bank:'civic',post:'civic',police:'civic',fire_station:'civic',townhall:'civic',
    place_of_worship:'landmark',attraction:'landmark',monument:'landmark',castle:'landmark',gallery:'landmark',
    museum:'landmark',theatre:'landmark',cinema:'landmark',park:'nature',zoo:'nature',
    parking:'service',charge_hub:'service',generic:'generic',
    office:'commerce',civic_hall:'civic',burger_stand:'food',grand_station:'transit',owl_library:'civic',
    university:'civic',college:'civic',wing_post:'civic',art_museum:'landmark',menagerie:'nature',
    pop_office:'commerce',pop_townhall:'civic',pop_fastfood:'food',pop_station:'transit',pop_library:'civic',
    pop_university:'civic',pop_college:'civic',pop_post:'civic',pop_art_museum:'landmark',pop_zoo:'nature',
  };
  const categoryLabels = Object.fromEntries(categories.map(category => [category.id,category.label]));
  const assetFamilies = global.PixelMapAssetFamilyRegistry;
  if (!assetFamilies)
    throw new Error('PixelMapAssetFamilyRegistry must load before poi-sprites.js');
  const typesBySprite = {};
  for(const sprite of Object.keys(SPRITES))
    typesBySprite[sprite] = [...assetFamilies.typesForAsset(sprite)];

  /* テイスト系列: reference=参照イメージ由来の暖色ファンタジー / pop=白地×原色のプロセスイラスト調 */
  const tastes = Object.freeze([
    {id:'reference',label:'参照テイスト'},
    {id:'pop',label:'しろポップ'},
  ]);
  const tasteBySprite = {
    monument:'reference',castle:'reference',gallery:'reference',theatre:'reference',zoo:'reference',charge_hub:'reference',
    office:'reference',civic_hall:'reference',burger_stand:'reference',grand_station:'reference',owl_library:'reference',
    university:'reference',college:'reference',wing_post:'reference',art_museum:'reference',menagerie:'reference',
    pop_office:'pop',pop_townhall:'pop',pop_fastfood:'pop',pop_station:'pop',pop_library:'pop',
    pop_university:'pop',pop_college:'pop',pop_post:'pop',pop_art_museum:'pop',pop_zoo:'pop',
  };
  const tasteLabels = Object.fromEntries(tastes.map(taste => [taste.id,taste.label]));
  /*
    POI Asset Contract v1
    ---------------------
    地物の座標や道路形状をアセットに合わせて動かさない。すべてのPOIは
    「地面中央のsource point」を共通anchorにし、実際の占有範囲はdraw結果から
    sizeごとにmeasureする。semanticRoleだけが合成順と衝突余白の意味を決める。
    このデータはWeb描画だけでなく、将来のExpo / Flutter用manifestの正本になる。
  */
  const ASSET_CONTRACT_VERSION = 'pixelmap-poi-asset/1';
  const GROUND_CENTER_ANCHOR = Object.freeze({kind:'ground-center',x:0,y:0});
  const roleBySprite = Object.freeze({
    station:'structure',bus:'marker',shop:'structure',mall:'structure',grocery:'structure',
    restaurant:'structure',fast_food:'structure',cafe:'structure',bar:'structure',hotel:'structure',
    hospital:'structure',pharmacy:'marker',school:'structure',library:'structure',bank:'marker',
    post:'marker',police:'structure',fire_station:'structure',townhall:'structure',
    place_of_worship:'object',attraction:'marker',monument:'object',castle:'structure',
    gallery:'structure',museum:'structure',theatre:'structure',cinema:'structure',park:'object',
    zoo:'structure',parking:'marker',charge_hub:'structure',office:'structure',civic_hall:'structure',
    burger_stand:'structure',grand_station:'structure',owl_library:'structure',university:'structure',
    college:'structure',wing_post:'structure',art_museum:'structure',menagerie:'structure',
    pop_office:'structure',pop_townhall:'structure',pop_fastfood:'structure',pop_station:'structure',
    pop_library:'structure',pop_university:'structure',pop_college:'structure',pop_post:'marker',
    pop_art_museum:'structure',pop_zoo:'structure',generic:'marker',
  });
  const assets = Object.freeze(Object.entries(SPRITES).map(([id,entry]) => {
    const category = categoryBySprite[id];
    const sizes = ['S','M','L'].filter(size => typeof entry[size] === 'function');
    const taste = tasteBySprite[id] || null;
    return Object.freeze({
      id,
      label:entry.label,
      category,
      categoryLabel:categoryLabels[category],
      poiTypes:Object.freeze(typesBySprite[id] || []),
      sizes:Object.freeze(sizes.length ? sizes : ['M']),
      previewSize:entry.M ? 'M' : entry.S ? 'S' : entry.L ? 'L' : 'M',
      taste,
      tasteLabel:taste ? tasteLabels[taste] : null,
      inspired:Boolean(taste),
      contractVersion:ASSET_CONTRACT_VERSION,
      semanticRole:roleBySprite[id],
      renderer:'pixel-procedural',
      assetPixelScale:2,
      anchor:GROUND_CENTER_ANCHOR,
      boundsSource:'measured-draw-output',
    });
  }));
  const assetsById = new Map(assets.map(asset => [asset.id,asset]));

  function paintBackdrop(target){
    target.fillStyle='#b8cb82';target.fillRect(0,0,288,240);
    for(let y=0;y<5;y++)for(let x=0;x<6;x++)if((x+y)%2===0){target.fillStyle='#b4c77d';target.fillRect(x*48,y*48,48,48);}
    target.fillStyle='#a0b570';
    [[21,36],[261,24],[30,195],[246,183],[78,51],[216,105]].forEach(([x,y])=>target.fillRect(x,y,3,3));
    target.fillStyle='#c8d995';
    [[51,21],[264,75],[15,129],[174,30],[225,165]].forEach(([x,y])=>target.fillRect(x,y,3,3));
    target.fillStyle='rgba(48,40,56,.11)';
    for(let x=48;x<288;x+=48)target.fillRect(x,0,3,240);
    for(let y=48;y<240;y+=48)target.fillRect(0,y,288,3);
  }

  function render(canvas, id, size='M'){
    const entry = SPRITES[id] || SPRITES.generic;
    const draw = entry[size] || entry.M || entry.S || entry.L || entry.draw;
    canvas.width=288;canvas.height=240;
    const target=canvas.getContext('2d');
    target.imageSmoothingEnabled=false;
    paintBackdrop(target);
    target.save();target.translate(144,207);target.scale(3,3);
    target.fillStyle='rgba(24,40,16,.3)';target.fillRect(-7,-1,14,3);
    ctx=target;
    draw(0,0);
    ctx=null;
    target.restore();
  }

  function draw(target, id, x, y, size='M'){
    const entry = SPRITES[id] || SPRITES.generic;
    const drawSprite = entry[size] || entry.M || entry.S || entry.L || entry.draw;
    ctx=target;
    try { drawSprite(x,y); }
    finally { ctx=null; }
  }

  const measurementCache = new Map();
  function measure(id, size='M'){
    const cacheKey = `${id}:${size}`;
    if(measurementCache.has(cacheKey)) return measurementCache.get(cacheKey);
    let left=Infinity, top=Infinity, right=-Infinity, bottom=-Infinity;
    const measurementTarget = {
      fillStyle:'#000000',
      fillRect(x,y,width,height){
        if(!Number.isFinite(x+y+width+height) || width<=0 || height<=0) return;
        left=Math.min(left,Math.floor(x));
        top=Math.min(top,Math.floor(y));
        right=Math.max(right,Math.ceil(x+width));
        bottom=Math.max(bottom,Math.ceil(y+height));
      },
    };
    draw(measurementTarget,id,0,0,size);
    const measurement = Object.freeze(Number.isFinite(left)
      ? {left,top,right,bottom,width:right-left,height:bottom-top}
      : {left:0,top:0,right:0,bottom:0,width:0,height:0});
    measurementCache.set(cacheKey,measurement);
    return measurement;
  }

  function contract(id, size='M'){
    const asset = assetsById.get(id) || assetsById.get('generic');
    const resolvedSize = asset.sizes.includes(size) ? size : asset.previewSize;
    return Object.freeze({
      version:ASSET_CONTRACT_VERSION,
      id:asset.id,
      semanticRole:asset.semanticRole,
      renderer:asset.renderer,
      assetPixelScale:asset.assetPixelScale,
      size:resolvedSize,
      anchor:asset.anchor,
      bounds:measure(asset.id,resolvedSize),
    });
  }

  const commandCache=new Map();
  function commands(id,size='M'){
    const assetContract=contract(id,size);
    const cacheKey=`${assetContract.id}:${assetContract.size}`;
    if(commandCache.has(cacheKey)) return commandCache.get(cacheKey);
    const operations=[];
    const commandTarget={
      fillStyle:'#000000',
      fillRect(x,y,width,height){
        if(!Number.isFinite(x+y+width+height) || width<=0 || height<=0) return;
        operations.push(Object.freeze({x,y,width,height,color:String(this.fillStyle)}));
      },
    };
    draw(commandTarget,assetContract.id,0,0,assetContract.size);
    const result=Object.freeze(operations);
    commandCache.set(cacheKey,result);
    return result;
  }

  global.PixelMapPoiSprites = Object.freeze({
    contractVersion:ASSET_CONTRACT_VERSION,
    assets,categories,tastes,draw,render,measure,contract,commands,
  });
})(window);
