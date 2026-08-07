const writingFeatured = document.querySelector("#writing-featured-list");
const writingArchive = document.querySelector("#writing-archive-list");
const writingStatus = document.querySelector("#writing-load-status");

const writingCategories = [
  { name: "Essays", id: "writing-category-essays", label: "エッセイ" },
  { name: "Horse Racing", id: "writing-category-horse-racing", label: "競馬" },
  { name: "Observation", id: "writing-category-observation", label: "人や出来事の観察" },
  { name: "Making / Learning", id: "writing-category-making-learning", label: "制作・学び" },
];

const addTextBlock = (parent, label, value) => {
  if (!value) return;

  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);
  parent.append(wrapper);
};

const createArticleCard = (article, featured = false) => {
  const card = document.createElement("article");
  const titleId = `writing-${article.id}-title`;
  card.className = featured ? "writing-article-card writing-article-card-featured" : "writing-article-card";
  card.setAttribute("aria-labelledby", titleId);

  const marker = document.createElement("p");
  marker.className = "writing-article-category";
  marker.textContent = article.category || "記事情報準備中";

  const title = document.createElement("h3");
  title.id = titleId;
  title.textContent = article.title;
  card.append(marker, title);

  if (article.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.className = "writing-article-excerpt";
    excerpt.textContent = article.excerpt;
    card.append(excerpt);
  }

  const details = document.createElement("dl");
  details.className = "writing-article-details";
  addTextBlock(details, "書いたきっかけ", article.trigger);
  addTextBlock(details, "記事で考えたこと", article.theme);
  if (details.children.length) card.append(details);

  if (Array.isArray(article.tags) && article.tags.length) {
    const tags = document.createElement("ul");
    tags.className = "writing-article-tags";
    tags.setAttribute("aria-label", "タグ");
    article.tags.forEach((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      tags.append(item);
    });
    card.append(tags);
  }

  if (article.noteUrl) {
    const link = document.createElement("a");
    link.className = "writing-note-link";
    link.href = article.noteUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "noteで読む →";
    card.append(link);
  } else {
    const pending = document.createElement("p");
    pending.className = "writing-article-pending";
    pending.textContent = "記事情報準備中";
    card.append(pending);
  }

  return card;
};

const renderWriting = (articles) => {
  const visibleArticles = articles
    .filter((article) => article.visible !== false)
    .sort((a, b) => Number(a.order) - Number(b.order));
  const featuredArticles = visibleArticles
    .filter((article) => article.featured === true && article.noteUrl)
    .slice(0, 3);
  const featuredIds = new Set(featuredArticles.map((article) => article.id));
  const archiveArticles = visibleArticles.filter((article) => !featuredIds.has(article.id));

  writingFeatured.replaceChildren();
  writingArchive.replaceChildren();

  if (featuredArticles.length) {
    featuredArticles.forEach((article) => writingFeatured.append(createArticleCard(article, true)));
  } else {
    const empty = document.createElement("p");
    empty.className = "writing-empty-state";
    empty.textContent = "代表記事は、記事情報とnoteリンクの確認後に掲載します。";
    writingFeatured.append(empty);
  }

  writingCategories.forEach((category) => {
    const categoryArticles = archiveArticles.filter((article) => article.category === category.name);
    if (!categoryArticles.length) return;

    const section = document.createElement("section");
    section.id = category.id;
    section.className = "writing-archive-group";
    section.setAttribute("aria-labelledby", `${category.id}-title`);

    const heading = document.createElement("div");
    heading.className = "writing-archive-group-heading";
    const spine = document.createElement("span");
    spine.textContent = category.name;
    const title = document.createElement("h3");
    title.id = `${category.id}-title`;
    title.textContent = category.label;
    const count = document.createElement("small");
    count.textContent = `${categoryArticles.length}記事`;
    heading.append(spine, title, count);

    const grid = document.createElement("div");
    grid.className = "writing-archive-grid";
    categoryArticles.forEach((article) => grid.append(createArticleCard(article)));
    section.append(heading, grid);
    writingArchive.append(section);
  });

  writingStatus.textContent = `代表3件と、カテゴリ別の記事${archiveArticles.length}件を掲載しています。`;
};

fetch("data/writing-articles.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((articles) => {
    if (!Array.isArray(articles)) throw new Error("記事データが配列ではありません。");
    renderWriting(articles);
  })
  .catch(() => {
    writingStatus.textContent = "記事データを読み込めませんでした。ローカルサーバーから開いてください。";
    writingFeatured.innerHTML = '<p class="writing-empty-state">代表記事を読み込めませんでした。</p>';
    writingArchive.innerHTML = '<p class="writing-empty-state">記事一覧を読み込めませんでした。</p>';
  });
