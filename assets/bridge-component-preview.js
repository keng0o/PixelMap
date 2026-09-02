(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./bridge-component-core.js'));
  }else{
    root.PixelMapBridgeComponentPreview=factory(root.PixelMapBridgeComponents);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
  'use strict';

  const VERSION='pixelmap-bridge-component-preview/2';
  const DEFAULT_STATE=Object.freeze({
    angle:45,length:52,masonryWidth:22,roadWidth:14,debug:'none',detail:'auto',background:'water',
  });
  const DEBUG_COLORS=Object.freeze([
    '#f06048','#f8d038','#58a8d8','#68b860','#b078d0','#e89050','#50c8b0','#d86890',
  ]);

  const freeze=value=>Object.freeze(value);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const integer=(value,fallback)=>Number.isFinite(Number(value))?Math.round(Number(value)):fallback;

  function isRequested(search=''){
    return new URLSearchParams(String(search).replace(/^\?/, '')).get('render')==='bridge-components';
  }

  function normalizeState(input={}){
    const rawAngle=Number(input.angle);
    const angle=Number.isFinite(rawAngle)?core.quantizeAngle(rawAngle):DEFAULT_STATE.angle;
    const length=clamp(integer(input.length,DEFAULT_STATE.length),22,120);
    const masonryWidth=clamp(integer(input.masonryWidth,DEFAULT_STATE.masonryWidth),10,50);
    const roadWidth=clamp(integer(input.roadWidth,DEFAULT_STATE.roadWidth),1,masonryWidth-6);
    const debug=input.debug==='components'?'components':'none';
    const detail=['auto','small','medium','large'].includes(input.detail)?input.detail:DEFAULT_STATE.detail;
    const background=['water','ground','checker'].includes(input.background)?input.background:DEFAULT_STATE.background;
    return freeze({angle,length,masonryWidth,roadWidth,debug,detail,background});
  }

  function parseState(search=''){
    const params=new URLSearchParams(String(search).replace(/^\?/, ''));
    return normalizeState({
      angle:params.get('angle'),length:params.get('length'),masonryWidth:params.get('width'),
      roadWidth:params.get('roadWidth'),debug:params.get('debug'),detail:params.get('detail'),
      background:params.get('background'),
    });
  }

  function stepAngle(angle,direction){
    return core.quantizeAngle(core.normalizeAngle(angle)+Math.sign(direction||1)*5);
  }

  function stateSearch(input){
    const state=normalizeState(input);
    const params=new URLSearchParams();
    params.set('render','bridge-components');
    params.set('angle',String(state.angle));
    params.set('length',String(state.length));
    params.set('width',String(state.masonryWidth));
    params.set('roadWidth',String(state.roadWidth));
    if(state.debug==='components') params.set('debug','components');
    if(state.detail!=='auto') params.set('detail',state.detail);
    if(state.background!=='water') params.set('background',state.background);
    return `?${params.toString()}`;
  }

  function componentColor(componentId){
    let hash=0;
    for(const character of String(componentId)) hash=(Math.imul(hash,31)+character.charCodeAt(0))>>>0;
    return DEBUG_COLORS[hash%DEBUG_COLORS.length];
  }

  function paintComposition(canvas,composition,{debug='none',scale=4}={}){
    const padding=3;
    canvas.width=composition.bounds.width+padding*2;
    canvas.height=composition.bounds.height+padding*2;
    const context=canvas.getContext('2d',{alpha:true});
    context.imageSmoothingEnabled=false;
    context.clearRect(0,0,canvas.width,canvas.height);
    const offsetX=padding-composition.bounds.x;
    const offsetY=padding-composition.bounds.y;
    for(const operation of [...composition.underlay,...composition.surface,...composition.overlay]){
      context.fillStyle=debug==='components'?componentColor(operation.componentId):operation.color;
      context.fillRect(operation.x+offsetX,operation.y+offsetY,1,1);
    }
    canvas.style.width=`${Math.max(1,canvas.width*scale)}px`;
    canvas.style.maxWidth='100%';
    canvas.style.height='auto';
    canvas.dataset.logicalWidth=String(canvas.width);
    canvas.dataset.logicalHeight=String(canvas.height);
  }

  function canvasCard(document,label,composition,debug,scale=3,background='water'){
    const figure=document.createElement('figure');
    figure.className=`bridge-component-card bridge-component-background bridge-background-${background}`;
    figure.dataset.background=background;
    const canvas=document.createElement('canvas');
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',label);
    paintComposition(canvas,composition,{debug,scale});
    const caption=document.createElement('figcaption');
    caption.textContent=label;
    figure.append(canvas,caption);
    return figure;
  }

  function markup(){
    return `
      <header class="bridge-component-header rpg-window">
        <p class="bridge-component-kicker">BRIDGE COMPONENT STUDY / TEST ONLY</p>
        <h1>判読性優先 石造アーチ橋 V2</h1>
        <p>透明なアーチ開口、張り出す橋脚、厚い笠石を、3段階LODと5°刻みの共通部品から組み立てます。</p>
      </header>
      <section class="bridge-component-controls rpg-window" aria-label="橋の形状設定">
        <div class="bridge-angle-control">
          <button type="button" data-angle-step="-1" aria-label="角度を5度戻す">−5°</button>
          <label>角度 <input id="bridgeComponentAngle" type="number" min="0" max="175" step="5"></label>
          <button type="button" data-angle-step="1" aria-label="角度を5度進める">＋5°</button>
        </div>
        <label>長さ <input id="bridgeComponentLength" type="number" min="22" max="120" step="1"></label>
        <label>石造部幅 <input id="bridgeComponentWidth" type="number" min="10" max="50" step="1"></label>
        <label>路面幅 <input id="bridgeComponentRoadWidth" type="number" min="1" max="44" step="1"></label>
        <label>LOD <select id="bridgeComponentDetail"><option value="auto">自動</option><option value="small">小</option><option value="medium">中</option><option value="large">大</option></select></label>
        <label>背景 <select id="bridgeComponentBackground"><option value="water">水面</option><option value="ground">地面</option><option value="checker">透明確認</option></select></label>
        <label>表示 <select id="bridgeComponentDebug"><option value="none">通常</option><option value="components">部品境界</option></select></label>
      </section>
      <section class="bridge-component-hero rpg-window" aria-labelledby="bridgeComponentCurrentTitle">
        <div>
          <p class="bridge-component-kicker">CURRENT COMPOSITION</p>
          <h2 id="bridgeComponentCurrentTitle">選択中の橋</h2>
          <div id="bridgeComponentMain" class="bridge-component-main"></div>
          <pre id="bridgeComponentDiagnostics" aria-label="橋の診断値"></pre>
        </div>
        <figure class="bridge-component-reference">
          <img src="../assets/bridge-study/bridge-reference-pixel-art-v1.png" alt="デザイン参照元の石造アーチ橋">
          <figcaption>参照目標：大きな2連アーチ・張り出し橋脚・厚い笠石・太い端柱</figcaption>
        </figure>
      </section>
      <section class="bridge-component-section rpg-window" aria-labelledby="bridgeDirectionTitle">
        <p class="bridge-component-kicker">36 DIRECTIONS / 5° STEP</p>
        <h2 id="bridgeDirectionTitle">同じ部品から作る36方向</h2>
        <div id="bridgeComponentDirections" class="bridge-component-grid bridge-direction-grid"></div>
      </section>
      <section class="bridge-component-section rpg-window" aria-labelledby="bridgeSizeTitle">
        <p class="bridge-component-kicker">3 LENGTHS × 3 WIDTHS</p>
        <h2 id="bridgeSizeTitle">同じ角度の9サイズ</h2>
        <div id="bridgeComponentSizes" class="bridge-component-grid bridge-size-grid"></div>
      </section>`;
  }

  function boot({document:documentObject,window:windowObject}={}){
    const document=documentObject||globalThis.document;
    const window=windowObject||globalThis.window;
    if(!document||!window||!core) throw new Error('橋単体previewの実行環境がありません');
    const container=document.getElementById('bridgeComponentStudy')||document.createElement('main');
    container.id='bridgeComponentStudy';
    container.className='bridge-component-study';
    container.innerHTML=markup();
    if(!container.isConnected) document.body.prepend(container);
    container.hidden=false;
    document.body.classList.add('bridge-component-mode');
    document.documentElement.dataset.bridgeStudy='test-only';
    document.documentElement.dataset.mapReady='not-applicable';

    const renderer=core.createRenderer({cacheLimit:128});
    let state=parseState(window.location.search);
    const controls={
      angle:document.getElementById('bridgeComponentAngle'),
      length:document.getElementById('bridgeComponentLength'),
      masonryWidth:document.getElementById('bridgeComponentWidth'),
      roadWidth:document.getElementById('bridgeComponentRoadWidth'),
      detail:document.getElementById('bridgeComponentDetail'),
      background:document.getElementById('bridgeComponentBackground'),
      debug:document.getElementById('bridgeComponentDebug'),
    };
    const main=document.getElementById('bridgeComponentMain');
    const directions=document.getElementById('bridgeComponentDirections');
    const sizes=document.getElementById('bridgeComponentSizes');
    const diagnostics=document.getElementById('bridgeComponentDiagnostics');

    const syncControls=()=>{
      for(const [key,control] of Object.entries(controls)) control.value=String(state[key]);
      controls.roadWidth.max=String(state.masonryWidth-6);
    };
    const compositionFor=(input,seed)=>renderer.composeSafe({
      family:'stoneArch',material:'stone',carry:'road',crossing:'water',
      classificationSource:'explicit',detailLevel:state.detail,...input,patternSeed:seed,
    });
    const renderDirections=()=>{
      directions.replaceChildren();
      for(const angle of core.angles){
        const composition=compositionFor({screenAngle:angle,length:52,masonryWidth:22,roadWidth:14},'directions');
        directions.append(canvasCard(document,`${String(angle).padStart(3,'0')}°`,composition,
          state.debug,2,state.background));
      }
    };
    const renderSizes=()=>{
      sizes.replaceChildren();
      for(const preset of core.presets){
        const composition=compositionFor({...preset,screenAngle:state.angle},'sizes');
        sizes.append(canvasCard(document,
          `${preset.id} / ${preset.length}×${preset.masonryWidth} / road ${preset.roadWidth}`,
          composition,state.debug,3,state.background));
      }
    };
    const redraw=({replaceUrl=true}={})=>{
      state=normalizeState(state);
      syncControls();
      container.dataset.background=state.background;
      const composition=compositionFor({
        id:'interactive',screenAngle:state.angle,length:state.length,
        masonryWidth:state.masonryWidth,roadWidth:state.roadWidth,
      },'interactive');
      main.replaceChildren(canvasCard(document,
        `${state.angle}度 長さ${state.length} 幅${state.masonryWidth} 路面${state.roadWidth} LOD ${composition.stats.lod}`,
        composition,state.debug,6,state.background));
      renderDirections();
      renderSizes();
      const rendererStats=renderer.stats();
      diagnostics.textContent=JSON.stringify({
        rendererVersion:core.version,previewVersion:VERSION,angle:state.angle,length:state.length,
        masonryWidth:state.masonryWidth,roadWidth:state.roadWidth,family:composition.model.family,
        material:composition.model.material,arches:composition.model.spans.length,lod:composition.stats.lod,
        openings:composition.stats.openingPixels,innerShadow:composition.stats.innerShadowPixels,
        piers:composition.stats.pierPixels,capstones:composition.stats.capstonePixels,
        exaggeration:composition.stats.exaggerationPixels,maxExaggeration:composition.stats.maxExaggeration,
        bounds:composition.bounds,details:composition.stats.details,
        suppressed:composition.diagnostics.suppressed,fallback:composition.diagnostics.fallback,
        cache:rendererStats,
      },null,2);
      if(replaceUrl) window.history.replaceState(null,'',stateSearch(state));
      window.PixelMapBridgeComponentStudy=freeze({
        ready:true,state,angles:core.angles.length,sizes:core.presets.length,
        composition:{bounds:composition.bounds,stats:composition.stats,diagnostics:composition.diagnostics},
        cache:rendererStats,
      });
      document.documentElement.dataset.bridgeComponentReady='1';
    };

    for(const [key,control] of Object.entries(controls)) control.addEventListener('change',()=>{
      state=normalizeState({...state,[key]:control.value});
      redraw();
    });
    for(const button of container.querySelectorAll('[data-angle-step]')) button.addEventListener('click',()=>{
      state=normalizeState({...state,angle:stepAngle(state.angle,Number(button.dataset.angleStep))});
      redraw();
    });
    try{redraw();}
    catch(error){
      document.documentElement.dataset.bridgeComponentReady='0';
      container.dataset.error=String(error?.message||error);
      diagnostics.textContent=`描画に失敗しました: ${error?.message||error}`;
      throw error;
    }
    return window.PixelMapBridgeComponentStudy;
  }

  return freeze({version:VERSION,isRequested,normalizeState,parseState,stepAngle,stateSearch,paintComposition,boot});
});
