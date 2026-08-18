(() => {
  'use strict';

  const catalog = window.PixelMapPoiSprites;
  const assets = catalog.assets;
  const categories = catalog.categories;
  const state = { category:'all', query:'' };
  const grid = document.getElementById('assetGrid');
  const filters = document.getElementById('filters');
  const resultCount = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  const search = document.getElementById('searchInput');

  const normalize = value => String(value).toLocaleLowerCase('ja').normalize('NFKC');

  function visibleAssets(){
    const query = normalize(state.query.trim());
    return assets.filter(asset => {
      const inCategory = state.category === 'all'
        || (state.category === 'reference' ? asset.inspired : asset.category === state.category);
      const haystack = normalize([
        asset.id, asset.label, asset.categoryLabel, ...asset.poiTypes,
        asset.inspired ? 'reference mix 新作 参照テイスト' : '',
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
      makeFilter('reference', '参照テイスト', assets.filter(asset => asset.inspired).length),
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
      badge.textContent = 'REFERENCE MIX';
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
    mappingValue.textContent = asset.poiTypes.length ? asset.poiTypes.join(' / ') : '未対応属性のフォールバック';
    mapping.append(mappingLabel, mappingValue);

    copy.append(heading, mapping);
    article.append(preview, copy);
    return article;
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
  document.getElementById('categoryCount').textContent = String(categories.length);
  document.getElementById('referenceCount').textContent = String(assets.filter(asset => asset.inspired).length);
  renderFilters();
  renderGrid();
})();
