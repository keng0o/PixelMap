(() => {
  'use strict';

  const groups = window.PIXEL_ASSET_GROUPS || [];
  const colors = Object.freeze({
    outline:'#302838', shadow:'#263326',
    grass:'#78b850', grassDark:'#4e8c3e',
    leaf:'#3e8840', leafDark:'#245c30', leafLight:'#70b850', trunk:'#785030',
    roof:'#d8583f', roofDark:'#913226', roofLight:'#f07a56',
    wall:'#f0e4c8', wallShade:'#c8b490', window:'#3868a0', glass:'#87bed7', door:'#805028',
    stone:'#a9a8a0', stoneDark:'#686b70', water:'#4890d8',
    gold:'#e8b848', cream:'#f8f0d8', white:'#fffaf0'
  });

  /*
   * index.htmlの座標系に合わせる。マップは1マス=16px、POIは建物面積でS/M/Lに分けている。
   * 48×48は各制作者が使うソース用紙であり、表示サイズではない。
   * 下の値はマップ上で占有する [横マス, 縦マス] を示す。
   */
  const footprints = Object.freeze({
    homes: [
      [2,2],[2,2],[2.5,2],[3,2],[2,2.5],
      [2,2.5],[2.5,2],[3,2],[2.5,2],[2,2],
      [2.5,2],[2.5,2],[2.5,2],[3,2],[3.5,2.5],
      [2.5,2],[2,2.5],[2.5,2],[3,2.5],[3,2]
    ],
    civic: [
      [4,2.5],[3,2.5],[3,2.5],[2.5,2],[4,2.5],
      [3,2.5],[2.5,4],[2.5,2],[3,2.5],[3,2.5],
      [2,2],[2.5,2],[2.5,2.5],[3,2.5],[3,2],
      [2.5,3],[3,3],[3,3],[3,3],[1.5,4]
    ],
    nature: [
      [1.5,2],[1.25,2],[2,2],[3,2.5],[1.5,2],
      [1,2],[1,1],[1.5,1.25],[2,1.5],[2.5,2],
      [3,2],[2.5,2],[2,2],[2.5,2],[3,2],
      [3,2],[2,2],[2,1.5],[1.5,1.5],[1.5,1.5]
    ],
    transport: [
      [3,2],[2,3],[3,3],[3,3],[4,2],
      [2,3],[2.5,1.5],[2.5,1.5],[3,2],[3,2.5],
      [2,3],[2,3],[2.5,2],[3,2.5],[1,2.5],
      [1.5,2.5],[3,1.5],[3,2.5],[2.5,3],[3,3]
    ],
    landmarks: [
      [2,2.5],[2.5,4],[2,2],[2.5,2.5],[2,2.5],
      [2.5,1.5],[2,1.25],[1.5,2.5],[1.5,3],[1.5,2.5],
      [2.5,2.5],[1.5,1.5],[1,1.75],[1.5,2.5],[3,1.5],
      [2,1.5],[1.5,1.5],[2.5,2.25],[2,2.5],[2,3]
    ]
  });
  const TILE_PX=16;
  const STAGE={width:96,height:80,groundY:70};

  function painter(ctx) {
    const put = (x,y,color) => {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && x < 48 && y >= 0 && y < 48) {
        ctx.fillStyle = color;
        ctx.fillRect(x,y,1,1);
      }
    };
    const rect = (x,y,w,h,color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    };
    const line = (x0,y0,x1,y1,color,width=1) => {
      x0=Math.round(x0); y0=Math.round(y0); x1=Math.round(x1); y1=Math.round(y1);
      const dx=Math.abs(x1-x0), sx=x0<x1?1:-1, dy=-Math.abs(y1-y0), sy=y0<y1?1:-1;
      let err=dx+dy;
      while(true){
        const half=Math.floor(width/2);
        rect(x0-half,y0-half,width,width,color);
        if(x0===x1&&y0===y1) break;
        const e2=2*err;
        if(e2>=dy){err+=dy;x0+=sx}
        if(e2<=dx){err+=dx;y0+=sy}
      }
    };
    const poly = (points,color) => {
      const ys=points.map(point=>point[1]);
      const minY=Math.max(0,Math.floor(Math.min(...ys)));
      const maxY=Math.min(47,Math.ceil(Math.max(...ys)));
      for(let y=minY;y<=maxY;y++){
        const scan=y+.5, hits=[];
        for(let i=0,j=points.length-1;i<points.length;j=i++){
          const [xi,yi]=points[i],[xj,yj]=points[j];
          if((yi>scan)!==(yj>scan)) hits.push(xi+(scan-yi)*(xj-xi)/(yj-yi));
        }
        hits.sort((a,b)=>a-b);
        for(let i=0;i+1<hits.length;i+=2){
          const start=Math.ceil(hits[i]-.5), end=Math.floor(hits[i+1]-.5);
          if(end>=start) rect(start,y,end-start+1,1,color);
        }
      }
    };
    return {c:colors,rect,poly,line,dot:put};
  }

  function makeLogical(asset) {
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=48;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    asset.draw(painter(ctx));
    return canvas;
  }

  function opaqueBounds(canvas) {
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
    for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){
      if(data[(y*canvas.width+x)*4+3]===0) continue;
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    return maxX<0?{x:0,y:0,w:1,h:1}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  }

  function makeMapAsset(asset,outputScale=1) {
    const source=makeLogical(asset),bounds=opaqueBounds(source);
    const width=Math.round(asset.footprint[0]*TILE_PX),height=Math.round(asset.footprint[1]*TILE_PX);
    const canvas=document.createElement('canvas');canvas.width=width*outputScale;canvas.height=height*outputScale;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const inset=2;
    const fit=Math.min((width-inset*2)/bounds.w,(height-inset*2)/bounds.h);
    const drawW=Math.max(1,Math.round(bounds.w*fit));
    const drawH=Math.max(1,Math.round(bounds.h*fit));
    const x=Math.floor((width-drawW)/2),y=height-drawH-inset;
    ctx.drawImage(source,bounds.x,bounds.y,bounds.w,bounds.h,x*outputScale,y*outputScale,drawW*outputScale,drawH*outputScale);
    return canvas;
  }

  function paintBackdrop(ctx,scale) {
    ctx.fillStyle='#b8cb82';ctx.fillRect(0,0,STAGE.width*scale,STAGE.height*scale);
    for(let ty=0;ty<STAGE.height/TILE_PX;ty++) for(let tx=0;tx<STAGE.width/TILE_PX;tx++){
      if((tx+ty)%2===0){ctx.fillStyle='#b4c77d';ctx.fillRect(tx*TILE_PX*scale,ty*TILE_PX*scale,TILE_PX*scale,TILE_PX*scale)}
    }
    ctx.fillStyle='#a0b570';
    [[7,12],[87,8],[10,65],[82,61],[26,17],[72,35]].forEach(([x,y])=>ctx.fillRect(x*scale,y*scale,scale,scale));
    ctx.fillStyle='#c8d995';
    [[17,7],[88,25],[5,43],[58,10],[75,55]].forEach(([x,y])=>ctx.fillRect(x*scale,y*scale,scale,scale));
    ctx.fillStyle='rgba(48,40,56,.11)';
    for(let x=TILE_PX;x<STAGE.width;x+=TILE_PX)ctx.fillRect(x*scale,0,scale,STAGE.height*scale);
    for(let y=TILE_PX;y<STAGE.height;y+=TILE_PX)ctx.fillRect(0,y*scale,STAGE.width*scale,scale);
  }

  function render(asset,target,scale=3,withBackdrop=true) {
    target.width=STAGE.width*scale;target.height=STAGE.height*scale;
    const ctx=target.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,target.width,target.height);
    if(withBackdrop) paintBackdrop(ctx,scale);
    const sprite=makeMapAsset(asset,scale);
    const x=Math.round((STAGE.width*scale-sprite.width)/2);
    const y=Math.round(STAGE.groundY*scale-sprite.height);
    ctx.drawImage(sprite,x,y);
  }

  const allAssets=groups.flatMap(group=>group.assets.map((asset,index)=>({
    ...asset,groupId:group.id,groupLabel:group.label,footprint:footprints[group.id][index]
  })));
  const state={group:'all',query:'',selected:null};
  const grid=document.getElementById('assetGrid');
  const filters=document.getElementById('filters');
  const resultCount=document.getElementById('resultCount');
  const totalCount=document.getElementById('totalCount');
  const empty=document.getElementById('emptyState');
  const search=document.getElementById('searchInput');
  const dialog=document.getElementById('assetDialog');

  function normalize(value){return value.toLocaleLowerCase('ja').normalize('NFKC')}
  function visibleAssets(){
    const q=normalize(state.query.trim());
    return allAssets.filter(asset=>{
      const inGroup=state.group==='all'||asset.groupId===state.group;
      const haystack=normalize([asset.name,asset.id,asset.category,...asset.keywords].join(' '));
      return inGroup&&(!q||haystack.includes(q));
    });
  }

  function makeFilter(id,label,count){
    const button=document.createElement('button');
    button.type='button';button.className='filter';button.dataset.group=id;
    button.textContent=`${label} ${count}`;
    button.setAttribute('aria-pressed',String(state.group===id));
    button.addEventListener('click',()=>{state.group=id;renderFilters();renderGrid()});
    return button;
  }
  function renderFilters(){
    filters.replaceChildren(makeFilter('all','すべて',allAssets.length),...groups.map(group=>makeFilter(group.id,group.label,group.assets.length)));
  }

  function openAsset(asset){
    state.selected=asset;
    document.getElementById('detailCategory').textContent=asset.groupLabel;
    document.getElementById('detailName').textContent=asset.name;
    document.getElementById('detailId').textContent=asset.id;
    const pxW=Math.round(asset.footprint[0]*TILE_PX),pxH=Math.round(asset.footprint[1]*TILE_PX);
    document.getElementById('detailScale').textContent=`占有 ${formatFootprint(asset.footprint)} ／ マップ実寸 ${pxW}×${pxH}px`;
    document.getElementById('detailKeywords').textContent=asset.keywords.map(word=>`#${word}`).join('  ');
    document.getElementById('downloadButton').textContent=`マップ実寸PNG ${pxW}×${pxH} を保存 ↓`;
    render(asset,document.getElementById('detailCanvas'),6,true);
    dialog.showModal();
  }

  function formatFootprint(footprint){
    return `${footprint[0]}×${footprint[1]}マス`;
  }

  function renderGrid(){
    const items=visibleAssets();
    const fragment=document.createDocumentFragment();
    items.forEach(asset=>{
      const card=document.createElement('button');
      card.type='button';card.className='asset-card';card.dataset.number=String(allAssets.indexOf(asset)+1).padStart(3,'0');
      card.dataset.footprint=formatFootprint(asset.footprint);
      card.setAttribute('aria-label',`${asset.name}（${formatFootprint(asset.footprint)}）を拡大`);
      const canvas=document.createElement('canvas');
      render(asset,canvas,3,true);
      const copy=document.createElement('span');copy.className='card-copy';
      const name=document.createElement('strong');name.textContent=asset.name;
      const category=document.createElement('small');category.textContent=`${asset.groupLabel} · ${formatFootprint(asset.footprint)}`;
      copy.append(name,category);card.append(canvas,copy);
      card.addEventListener('click',()=>openAsset(asset));
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
    resultCount.textContent=String(items.length);empty.hidden=items.length!==0;
  }

  search.addEventListener('input',()=>{state.query=search.value;renderGrid()});
  document.addEventListener('keydown',event=>{
    if(event.key==='/'&&document.activeElement!==search){event.preventDefault();search.focus()}
    if(event.key==='Escape'&&dialog.open) dialog.close();
  });
  dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  document.getElementById('downloadButton').addEventListener('click',()=>{
    if(!state.selected)return;
    const canvas=makeMapAsset(state.selected,1);
    const link=document.createElement('a');link.download=`${state.selected.id}-${canvas.width}x${canvas.height}.png`;link.href=canvas.toDataURL('image/png');link.click();
  });

  totalCount.textContent=String(allAssets.length);
  renderFilters();renderGrid();
  window.PixelAssetCatalog={groups,assets:allAssets,colors,render,makeMapAsset};
})();
