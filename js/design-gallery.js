(() => {
  const gallery = document.querySelector('[data-gallery-source]');
  const toggle = document.getElementById('design-gallery-toggle');
  const status = document.getElementById('design-gallery-status');
  if (!gallery || !toggle || !status) return;

  const categoryOrder = ['Adobe', 'Canva', 'AI Image Design', 'SNS Design'];
  const categoryLabels = { Adobe:'Adobe作品', Canva:'Canva作品', 'AI Image Design':'AI画像デザイン', 'SNS Design':'SNSデザイン' };
  let works = [];
  let showingOthers = false;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const addMeta = (list, label, value) => {
    if (!value) return;
    const row = document.createElement('div');
    row.append(element('dt', '', label), element('dd', '', value));
    list.append(row);
  };
  const createCard = (work, index, featured = false) => {
    const card = element('article', `design-gallery-card${featured ? ' design-gallery-card-featured' : ''}`);
    card.dataset.id = work.id;
    card.dataset.category = work.category;
    card.dataset.tags = work.tags.join(' ');
    card.dataset.series = work.series || '';
    card.dataset.visible = String(work.visible);
    card.dataset.featured = String(work.featured);
    card.dataset.order = String(work.order);

    const imageWrap = element('div', 'design-gallery-image');
    const image = document.createElement('img');
    image.src = work.src;
    image.alt = work.alt || (work.title ? `${work.title}の作品画像` : `${work.category}のデザイン作品`);
    image.decoding = 'async';
    image.loading = index < 3 ? 'eager' : 'lazy';
    imageWrap.append(image);

    const content = element('div', 'design-gallery-content');
    content.append(element('p', 'design-gallery-category', work.category));
    if (work.title) content.append(element('h3', '', work.title));
    const meta = document.createElement('dl');
    addMeta(meta, '使用ツール', work.tool);
    addMeta(meta, '用途', work.usage);
    if (meta.children.length) content.append(meta);
    if (work.description) content.append(element('p', 'design-gallery-description', work.description));
    if (work.tags.length) {
      const tags = element('ul', 'design-gallery-tags');
      tags.setAttribute('aria-label', 'タグ');
      work.tags.forEach((tag) => tags.append(element('li', '', tag)));
      content.append(tags);
    }
    card.append(imageWrap, content);
    return card;
  };
  const createFeaturedSection = (items) => {
    const section = element('section', 'design-featured-works');
    section.id = 'design-gallery-featured';
    section.setAttribute('aria-labelledby', 'design-gallery-featured-title');
    const heading = element('div', 'design-gallery-group-heading');
    const copy = document.createElement('div');
    copy.append(element('p', 'design-gallery-group-label', 'Featured'), element('h3', '', '代表作品'));
    copy.querySelector('h3').id = 'design-gallery-featured-title';
    heading.append(copy, element('p', 'design-gallery-group-count', `${items.length} / 3`));
    const grid = element('div', 'design-featured-grid');
    items.forEach((work, index) => grid.append(createCard(work, index, true)));
    section.append(heading, grid);
    return section;
  };
  const createCategorySection = (category, items, offset) => {
    const slug = category.toLowerCase().replaceAll(' ', '-');
    const section = element('section', `design-gallery-group design-gallery-group-${slug}`);
    section.id = `design-gallery-${slug}`;
    section.tabIndex = -1;
    const titleId = `${section.id}-title`;
    section.setAttribute('aria-labelledby', titleId);
    const heading = element('div', 'design-gallery-group-heading');
    const copy = document.createElement('div');
    const title = element('h3', '', categoryLabels[category]);
    title.id = titleId;
    copy.append(element('p', 'design-gallery-group-label', category), title);
    heading.append(copy, element('p', 'design-gallery-group-count', `${items.length}点`));
    const grid = element('div', 'design-gallery-group-grid');
    items.forEach((work, index) => grid.append(createCard(work, offset + index)));
    if (!items.length) grid.append(element('p', 'design-gallery-empty-category', '現在、その他の公開作品はありません。'));
    section.append(heading, grid);
    return section;
  };
  const render = () => {
    const visible = works.filter((work) => work.visible).sort((a,b) => a.order - b.order);
    const featured = visible.filter((work) => work.featured).slice(0,3);
    const featuredIds = new Set(featured.map((work) => work.id));
    const others = visible.filter((work) => !featuredIds.has(work.id));
    const fragment = document.createDocumentFragment();
    fragment.append(createFeaturedSection(featured));
    const otherWrap = element('div', 'design-other-works');
    otherWrap.id = 'design-other-works';
    otherWrap.hidden = !showingOthers;
    let offset = 3;
    categoryOrder.forEach((category) => {
      const categoryWorks = others.filter((work) => work.category === category);
      otherWrap.append(createCategorySection(category, categoryWorks, offset));
      offset += categoryWorks.length;
    });
    fragment.append(otherWrap);
    gallery.replaceChildren(fragment);
    status.textContent = showingOthers ? `代表作品${featured.length}点と、その他の公開作品${others.length}点を表示しています。` : `代表作品${featured.length}点を表示しています。その他の公開作品は${others.length}点あります。`;
    toggle.textContent = showingOthers ? 'その他の作品を閉じる' : `その他の作品${others.length}点を見る`;
    toggle.hidden = others.length === 0;
    toggle.setAttribute('aria-expanded', String(showingOthers));
    toggle.setAttribute('aria-controls', 'design-other-works');
  };
  const moveToCategory = (hash = location.hash) => {
    if (!hash.startsWith('#design-gallery-') || hash === '#design-gallery-featured') return false;
    const target = document.getElementById(hash.slice(1));
    if (!target) { console.warn(`[Design gallery] 移動先 ${hash} がDOMに存在しません。`); return false; }
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
    target.focus({preventScroll:true});
    return true;
  };
  const revealHashTarget = () => {
    if (!location.hash.startsWith('#design-gallery-') || location.hash === '#design-gallery-featured') return;
    if (!showingOthers) { showingOthers = true; render(); }
    moveToCategory();
  };
  toggle.addEventListener('click', () => { showingOthers = !showingOthers; render(); if (!showingOthers) document.getElementById('design-gallery-featured')?.scrollIntoView({block:'start'}); });
  window.addEventListener('hashchange', revealHashTarget);
  const loadWorks = () => location.protocol === 'file:' ? (Array.isArray(window.DESIGN_WORKS_FALLBACK) ? Promise.resolve(window.DESIGN_WORKS_FALLBACK) : Promise.reject(new Error('file://表示用の作品データを読み込めませんでした。'))) : fetch(gallery.dataset.gallerySource).then((response) => { if(!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); });
  loadWorks().then((data) => { works = Array.isArray(data) ? data : []; render(); revealHashTarget(); }).catch((error) => { works=[];render();status.textContent='作品データを読み込めませんでした。';console.error('[Design gallery] 作品データの読み込みに失敗しました。',error); });
})();