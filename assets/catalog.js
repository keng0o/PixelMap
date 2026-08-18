(() => {
  'use strict';

  const catalog = window.PixelMapPoiSprites;
  const layerCatalog = window.PixelMapLayerAssets;
  const assets = catalog.assets;
  const categories = catalog.categories;
  const tastes = catalog.tastes || [];
  const tasteIds = new Set(tastes.map(taste => taste.id));
  const state = { category:'all', query:'' };
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
      chip.textContent = size;
      list.appendChild(chip);
    }
    return list;
  }

  function makeCard(asset, index){
    const article = document.createElement('article');
    article.className = `asset-card${asset.inspired ? ' is-inspired' : ''}`;
    article.dataset.number = String(index + 1).padStart(2, '0');

    const preview = document.createElement('div');
    preview.className = 'asset-preview';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', `${asset.label}のマップ表示`);
    catalog.render(canvas, asset.id, asset.previewSize);
    preview.appendChild(canvas);
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
      : asset.id === 'generic' ? '未対応属性のフォールバック' : '未接続（新テイスト候補）';
    mapping.append(mappingLabel, mappingValue);

    copy.append(heading, mapping);
    article.append(preview, copy);
    return article;
  }

  function makeLayerCard(asset, index){
    const article = document.createElement('article');
    article.className = 'layer-card';
    article.dataset.layerId = asset.id;
    article.dataset.number = String(index + 1).padStart(2, '0');

    const preview = document.createElement('div');
    preview.className = 'layer-preview';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', `${asset.label}レイヤーの表示見本`);
    layerCatalog.render(canvas, asset);
    preview.appendChild(canvas);

    const copy = document.createElement('div');
    copy.className = 'layer-copy';
    const name = document.createElement('h3');
    name.textContent = asset.label;
    const id = document.createElement('code');
    id.textContent = asset.id;
    copy.append(name,id);
    article.append(preview,copy);
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
