(() => {
  'use strict';

  const catalog = window.PixelMapPoiSprites;
  const layerCatalog = window.PixelMapLayerAssets;
  const assets = catalog.assets;
  const categories = catalog.categories;
  const tastes = catalog.tastes || [];
  const tasteIds = new Set(tastes.map(taste => taste.id));
  const state = { category:'all', query:'' };
  const PIXEL_SCALE = 8;
  let expandedCard = null;
  let expandedButton = null;
  const grid = document.getElementById('assetGrid');
  const filters = document.getElementById('filters');
  const resultCount = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  const search = document.getElementById('searchInput');
  const layerGroupsRoot = document.getElementById('layerGroups');

  const normalize = value => String(value).toLocaleLowerCase('ja').normalize('NFKC');

  function visibleAssets(){
    const query = normalize(state.query.trim());
    return assets.filter(asset => {
      const inCategory = state.category === 'all'
        || (tasteIds.has(state.category) ? asset.taste === state.category : asset.category === state.category);
      const haystack = normalize([
        asset.id, asset.label, asset.categoryLabel, ...asset.poiTypes,
        asset.inspired ? `新作 候補 ${asset.tasteLabel}` : '',
      ].join(' '));
      return inCategory && (!query || haystack.includes(query));
    });
  }

  function makeFilter(id, label, count){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter';
    button.textContent = `${label} ${count}`;
    button.setAttribute('aria-pressed', String(state.category === id));
    button.addEventListener('click', () => {
      state.category = id;
      renderFilters();
      renderGrid();
    });
    return button;
  }

  function renderFilters(){
    filters.replaceChildren(
      makeFilter('all', 'すべて', assets.length),
      ...tastes.map(taste => makeFilter(
        taste.id,
        taste.label,
        assets.filter(asset => asset.taste === taste.id).length,
      )),
      ...categories.map(category => makeFilter(
        category.id,
        category.label,
        assets.filter(asset => asset.category === category.id).length,
      )),
    );
  }

  function makeSizeChips(asset){
    const list = document.createElement('span');
    list.className = 'size-chips';
    for (const size of asset.sizes){
      const chip = document.createElement('span');
      chip.className = 'size-chip';
      const measurement = catalog.measure(asset.id,size);
      const name = document.createElement('b');
      name.textContent = size;
      const dimensions = document.createElement('small');
      dimensions.textContent = `${measurement.width}×${measurement.height}`;
      chip.append(name,dimensions);
      chip.title = `${size}: ${measurement.width}×${measurement.height} px`;
      list.appendChild(chip);
    }
    if(asset.cellGrid){
      const chip = document.createElement('span');
      chip.className = 'size-chip cell-size-chip';
      const name = document.createElement('b');
      name.textContent = 'CELL';
      const dimensions = document.createElement('small');
      dimensions.textContent = `${asset.cellGrid.width}×${asset.cellGrid.height}`;
      chip.append(name,dimensions);
      chip.title = `1セル: ${asset.cellGrid.width}×${asset.cellGrid.height} 論理px / 単色`;
      list.appendChild(chip);
    }
    return list;
  }

  function closeExpanded(){
    if(!expandedCard) return;
    expandedCard.classList.remove('is-expanded');
    expandedCard.querySelector(':scope > .pixel-detail')?.remove();
    expandedButton?.setAttribute('aria-expanded','false');
    expandedButton?.removeAttribute('aria-controls');
    expandedCard=null;
    expandedButton=null;
  }

  function makeRuler(axis,length,cssLength){
    const ruler=document.createElement('div');
    ruler.className=`pixel-ruler pixel-ruler-${axis}`;
    ruler.style[axis==='x'?'width':'height']=`${cssLength}px`;
    const start=document.createElement('span');
    start.textContent='0';
    const end=document.createElement('span');
    end.textContent=String(length);
    ruler.append(start,end);
    return ruler;
  }

  function makePixelStage(canvas,label){
    const cssWidth=canvas.width*PIXEL_SCALE;
    const cssHeight=canvas.height*PIXEL_SCALE;
    canvas.className='pixel-detail-canvas';
    canvas.style.width=`${cssWidth}px`;
    canvas.style.height=`${cssHeight}px`;
    canvas.setAttribute('aria-label',label);

    const scroll=document.createElement('div');
    scroll.className='pixel-detail-scroll';
    const stage=document.createElement('div');
    stage.className='pixel-stage';
    stage.style.width=`${cssWidth+24}px`;
    stage.style.height=`${cssHeight+24}px`;
    const corner=document.createElement('div');
    corner.className='pixel-ruler-corner';
    corner.textContent='px';
    const grid=document.createElement('div');
    grid.className='pixel-grid';
    grid.style.width=`${cssWidth}px`;
    grid.style.height=`${cssHeight}px`;
    grid.style.setProperty('--pixel-scale',`${PIXEL_SCALE}px`);
    grid.appendChild(canvas);
    stage.append(corner,makeRuler('x',canvas.width,cssWidth),makeRuler('y',canvas.height,cssHeight),grid);
    scroll.appendChild(stage);
    return scroll;
  }

  function makePreviewScaleGrid(canvas){
    const grid=document.createElement('span');
    grid.className='preview-scale-grid';
    grid.setAttribute('aria-hidden','true');
    grid.style.setProperty('--grid-8-x',`${8/canvas.width*100}%`);
    grid.style.setProperty('--grid-8-y',`${8/canvas.height*100}%`);
    grid.style.setProperty('--grid-16-x',`${16/canvas.width*100}%`);
    grid.style.setProperty('--grid-16-y',`${16/canvas.height*100}%`);
    const key=document.createElement('span');
    key.className='preview-grid-key';
    key.textContent='8 / 16 px GRID';
    grid.appendChild(key);
    return grid;
  }

  function makeDetailHeading(titleText,metricText,legendText='1マス = 1 px / 8× ZOOM'){
    const heading=document.createElement('div');
    heading.className='pixel-detail-heading';
    const title=document.createElement('strong');
    title.textContent=titleText;
    const metric=document.createElement('code');
    metric.textContent=metricText;
    const legend=document.createElement('span');
    legend.textContent=legendText;
    heading.append(title,metric,legend);
    return {heading,metric};
  }

  function makeLayerDetail(asset){
    const panel=document.createElement('section');
    panel.className='pixel-detail';
    panel.setAttribute('aria-label',`${asset.label}のピクセル拡大表示`);
    const {heading}=makeDetailHeading(asset.label,asset.metric.label);
    const canvas=document.createElement('canvas');
    layerCatalog.renderDetail(canvas,asset);
    panel.append(heading,makePixelStage(
      canvas,
      `${asset.label}の${canvas.width}×${canvas.height}ピクセル拡大見本`,
    ));
    return panel;
  }

  function makePoiDetail(asset){
    const panel=document.createElement('section');
    panel.className='pixel-detail';
    panel.setAttribute('aria-label',`${asset.label}のピクセル拡大表示`);
    const detailLegend = asset.cellGrid
      ? `1セル = ${asset.cellGrid.width}×${asset.cellGrid.height} 論理px / 単色 / 8× ZOOM`
      : '1マス = 1 px / 8× ZOOM';
    const {heading,metric}=makeDetailHeading(asset.label,'',detailLegend);
    const controls=document.createElement('div');
    controls.className='detail-size-controls';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','アセットサイズ');
    const stageHost=document.createElement('div');
    let selectedSize=asset.previewSize;

    const renderSize=()=>{
      const measurement=catalog.measure(asset.id,selectedSize);
      metric.textContent=`${selectedSize} / ${measurement.width}×${measurement.height} px`;
      const canvas=document.createElement('canvas');
      canvas.width=measurement.width;
      canvas.height=measurement.height;
      const target=canvas.getContext('2d');
      target.imageSmoothingEnabled=false;
      catalog.draw(target,asset.id,-measurement.left,-measurement.top,selectedSize);
      stageHost.replaceChildren(makePixelStage(
        canvas,
        `${asset.label} ${selectedSize}の${measurement.width}×${measurement.height}ピクセル拡大表示`,
      ));
      for(const button of controls.children){
        button.setAttribute('aria-pressed',String(button.dataset.size===selectedSize));
      }
    };

    for(const size of asset.sizes){
      const button=document.createElement('button');
      button.type='button';
      button.className='detail-size-button';
      button.dataset.size=size;
      button.textContent=size;
      button.addEventListener('click',()=>{selectedSize=size;renderSize();});
      controls.appendChild(button);
    }
    panel.append(heading,controls,stageHost);
    renderSize();
    return panel;
  }

  function toggleExpanded(card,button,makePanel){
    if(expandedCard===card){closeExpanded();return;}
    closeExpanded();
    const panel=makePanel();
    panel.id=`pixelDetail-${card.dataset.layerId || card.dataset.assetId}`;
    card.appendChild(panel);
    card.classList.add('is-expanded');
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-controls',panel.id);
    expandedCard=card;
    expandedButton=button;
  }

  function makeCard(asset, index){
    const article = document.createElement('article');
    article.className = `asset-card${asset.inspired ? ' is-inspired' : ''}`;
    article.dataset.assetId = asset.id;
    if(asset.taste) article.dataset.taste = asset.taste;
    article.dataset.number = String(index + 1).padStart(2, '0');

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'asset-preview';
    preview.setAttribute('aria-expanded','false');
    preview.setAttribute('aria-label',`${asset.label}のピクセル拡大表示を開く`);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', `${asset.label}のマップ表示`);
    catalog.render(canvas, asset.id, asset.previewSize);
    preview.append(canvas,makePreviewScaleGrid(canvas));
    if(asset.inspired){
      const badge = document.createElement('span');
      badge.className = 'reference-badge';
      badge.textContent = asset.tasteLabel;
      preview.appendChild(badge);
    }

    const copy = document.createElement('div');
    copy.className = 'card-copy';
    const heading = document.createElement('div');
    heading.className = 'card-heading';
    const text = document.createElement('div');
    const category = document.createElement('small');
    category.textContent = asset.categoryLabel;
    const name = document.createElement('h2');
    name.textContent = asset.label;
    const id = document.createElement('code');
    id.textContent = asset.id;
    text.append(category, name, id);
    heading.append(text, makeSizeChips(asset));

    const mapping = document.createElement('p');
    mapping.className = 'poi-mapping';
    const mappingLabel = document.createElement('span');
    mappingLabel.textContent = 'POI';
    const mappingValue = document.createElement('code');
    mappingValue.textContent = asset.poiTypes.length ? asset.poiTypes.join(' / ')
      : asset.catalogOnly ? '未接続（アセットページ専用）'
      : asset.id === 'generic' ? '未対応属性のフォールバック' : '未接続（新テイスト候補）';
    mapping.append(mappingLabel, mappingValue);

    copy.append(heading, mapping);
    article.append(preview, copy);
    preview.addEventListener('click',()=>toggleExpanded(article,preview,()=>makePoiDetail(asset)));
    return article;
  }

  function makeLayerCard(asset, index){
    const article = document.createElement('article');
    article.className = 'layer-card';
    article.dataset.layerId = asset.id;
    article.dataset.number = String(index + 1).padStart(2, '0');

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'layer-preview';
    preview.setAttribute('aria-expanded','false');
    preview.setAttribute('aria-label',`${asset.label}のピクセル拡大表示を開く`);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', `${asset.label}レイヤーの表示見本`);
    layerCatalog.render(canvas, asset);
    preview.append(canvas,makePreviewScaleGrid(canvas));

    const copy = document.createElement('div');
    copy.className = 'layer-copy';
    const name = document.createElement('h3');
    name.textContent = asset.label;
    const id = document.createElement('code');
    id.textContent = asset.id;
    const metric = document.createElement('span');
    metric.className = 'pixel-metric';
    metric.textContent = asset.metric.label;
    copy.append(name,id,metric);
    article.append(preview,copy);
    preview.addEventListener('click',()=>toggleExpanded(article,preview,()=>makeLayerDetail(asset)));
    return article;
  }

  function renderLayerGroups(){
    const fragment = document.createDocumentFragment();
    for(const group of layerCatalog.groups){
      const section = document.createElement('section');
      section.className = 'layer-group';
      section.dataset.group = group.id;
      const heading = document.createElement('div');
      heading.className = 'layer-group-heading';
      const title = document.createElement('h3');
      title.textContent = group.label;
      const count = document.createElement('span');
      const groupAssets = layerCatalog.layers.filter(asset => asset.group === group.id);
      count.textContent = `${groupAssets.length} LAYERS`;
      heading.append(title,count);

      const grid = document.createElement('div');
      grid.className = 'layer-grid';
      for(const asset of groupAssets) grid.appendChild(makeLayerCard(asset,layerCatalog.layers.indexOf(asset)));
      section.append(heading,grid);
      fragment.appendChild(section);
    }
    layerGroupsRoot.replaceChildren(fragment);
  }

  function renderGrid(){
    closeExpanded();
    const items = visibleAssets();
    const fragment = document.createDocumentFragment();
    items.forEach(asset => fragment.appendChild(makeCard(asset, assets.indexOf(asset))));
    grid.replaceChildren(fragment);
    resultCount.textContent = String(items.length);
    empty.hidden = items.length !== 0;
  }

  search.addEventListener('input', () => {
    state.query = search.value;
    renderGrid();
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== search){
      event.preventDefault();
      search.focus();
    }
  });

  document.getElementById('totalCount').textContent = String(assets.length);
  document.getElementById('layerCount').textContent = String(layerCatalog.layers.length);
  document.getElementById('categoryCount').textContent = String(categories.length);
  document.getElementById('referenceCount').textContent = String(assets.filter(asset => asset.inspired).length);
  renderLayerGroups();
  renderFilters();
  renderGrid();
})();
