(() => {
  const gallery = document.querySelector('[data-gallery-source]');
  const toggle = document.getElementById('design-gallery-toggle');
  const status = document.getElementById('design-gallery-status');

  if (!gallery || !toggle || !status) return;

  let works = [];
  let showingAll = false;
  const categoryOrder = ['Adobe', 'Canva', 'AI Image Design', 'SNS Design'];
  const categoryLabels = {
    Adobe: 'Adobe作品',
    Canva: 'Canva作品',
    'AI Image Design': 'AI画像デザイン',
    'SNS Design': 'SNSデザイン'
  };

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

  const createCard = (work, index) => {
    const card = element('article', 'design-gallery-card');
    card.dataset.id = work.id;
    card.dataset.category = work.category;
    card.dataset.tags = work.tags.join(' ');
    card.dataset.series = work.series || '';
    card.dataset.visible = String(work.visible);
    card.dataset.featured = String(work.featured);
    card.dataset.order = String(work.order);

    const image = document.createElement('img');
    image.src = work.src;
    image.alt = work.alt || `${work.category}作品 ${work.fileName}`;
    image.decoding = 'async';
    image.loading = index < 3 ? 'eager' : 'lazy';

    const content = element('div', 'design-gallery-content');
    content.append(element('p', 'design-gallery-category', work.category));

    if (work.title) content.append(element('h3', '', work.title));
    else content.append(element('p', 'design-gallery-file', work.fileName));

    const meta = document.createElement('dl');
    addMeta(meta, '使用ツール', work.tool);
    addMeta(meta, '用途', work.usage);
    addMeta(meta, 'ファイル', work.fileName);
    if (work.series) addMeta(meta, 'シリーズ', work.series);
    if (meta.children.length) content.append(meta);

    if (work.description) content.append(element('p', 'design-gallery-description', work.description));

    if (work.tags.length) {
      const tags = element('ul', 'design-gallery-tags');
      tags.setAttribute('aria-label', 'タグ');
      work.tags.forEach((tag) => tags.append(element('li', '', tag)));
      content.append(tags);
    }

    card.append(image, content);
    return card;
  };

  const createCategorySection = (category, categoryWorks, imageOffset) => {
    const slug = category.toLowerCase().replaceAll(' ', '-');
    const section = element('section', `design-gallery-group design-gallery-group-${slug}`);
    const titleId = `design-gallery-${slug}`;
    section.setAttribute('aria-labelledby', titleId);

    const heading = element('div', 'design-gallery-group-heading');
    const headingText = document.createElement('div');
    const title = element('h3', '', categoryLabels[category] || category);
    title.id = titleId;
    headingText.append(element('p', 'design-gallery-group-label', category), title);
    heading.append(headingText, element('p', 'design-gallery-group-count', `${categoryWorks.length}点`));

    const grid = element('div', 'design-gallery-group-grid');
    categoryWorks.forEach((work, index) => grid.append(createCard(work, imageOffset + index)));
    section.append(heading, grid);
    return section;
  };

  const render = () => {
    const visibleWorks = works.filter((work) => work.visible).sort((a, b) => a.order - b.order);
    const featuredWorks = visibleWorks.filter((work) => work.featured);
    const selectedWorks = showingAll ? visibleWorks : featuredWorks;
    const fragment = document.createDocumentFragment();
    let imageOffset = 0;
    categoryOrder.forEach((category) => {
      const categoryWorks = selectedWorks.filter((work) => work.category === category);
      if (!categoryWorks.length) return;
      fragment.append(createCategorySection(category, categoryWorks, imageOffset));
      imageOffset += categoryWorks.length;
    });
    gallery.replaceChildren(fragment);

    status.textContent = showingAll
      ? `全${visibleWorks.length}点を表示しています。`
      : `全${visibleWorks.length}点のうち、代表${featuredWorks.length}点を表示しています。`;
    toggle.textContent = showingAll ? '代表作品に戻す' : 'すべて見る';
    toggle.hidden = visibleWorks.length === featuredWorks.length;
    toggle.setAttribute('aria-expanded', String(showingAll));
  };

  toggle.addEventListener('click', () => {
    showingAll = !showingAll;
    render();
    status.focus?.();
  });

  fetch(gallery.dataset.gallerySource)
    .then((response) => {
      if (!response.ok) throw new Error('作品データを読み込めませんでした。');
      return response.json();
    })
    .then((data) => {
      works = Array.isArray(data) ? data : [];
      render();
    })
    .catch(() => {
      gallery.replaceChildren();
      status.textContent = '作品データを読み込めませんでした。';
    });
})();
