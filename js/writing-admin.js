(() => {
  "use strict";

  const categories = ["Essays", "Horse Racing", "Observation", "Making / Learning"];
  const fields = ["id", "title", "category", "excerpt", "trigger", "theme", "image", "noteUrl", "publishedAt"];
  const refs = {
    file: document.querySelector("#json-file"), reset: document.querySelector("#reset-button"), downloadJson: document.querySelector("#download-json"),
    downloadFallback: document.querySelector("#download-fallback"), add: document.querySelector("#add-button"), remove: document.querySelector("#delete-button"),
    loadStatus: document.querySelector("#load-status"), dirtyStatus: document.querySelector("#dirty-status"), workflowCurrent: document.querySelector("#workflow-current"),
    workflowSteps: [...document.querySelectorAll("[data-step]")], total: document.querySelector("#summary-total"), visible: document.querySelector("#summary-visible"),
    featured: document.querySelector("#summary-featured"), changed: document.querySelector("#summary-changed"), search: document.querySelector("#search-filter"),
    categoryFilter: document.querySelector("#category-filter"), visibleFilter: document.querySelector("#visible-filter"), featuredFilter: document.querySelector("#featured-filter"),
    tagFilter: document.querySelector("#tag-filter"), list: document.querySelector("#article-list"), listNote: document.querySelector("#list-note"),
    form: document.querySelector("#article-form"), editorMessage: document.querySelector("#editor-message"), formErrors: document.querySelector("#form-errors"),
    tagChips: document.querySelector("#tag-chips"), tagInput: document.querySelector("#tag-input"), tagSuggestions: document.querySelector("#tag-suggestions"),
    fetchMetadata: document.querySelector("#fetch-note-metadata"), metadataStatus: document.querySelector("#metadata-status"),
    previewSort: document.querySelector("#preview-sort"), preview: document.querySelector("#preview-content")
  };

  let articles = [];
  let baseline = [];
  let selectedId = "";
  let draggedId = "";
  let workflowStage = "loading";

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const unique = (values) => [...new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];
  const byOrder = (items) => [...items].sort((a, b) => Number(a.order) - Number(b.order));
  const featuredSorted = (items = articles) => items.filter((item) => item.featured).sort((a, b) => Number(a.featuredOrder) - Number(b.featuredOrder));
  const selected = () => articles.find((article) => article.id === selectedId);
  const snapshot = (items = articles) => JSON.stringify(items);

  function normalize(raw, index) {
    return {
      id: typeof raw.id === "string" ? raw.id : "",
      title: typeof raw.title === "string" ? raw.title : "",
      category: typeof raw.category === "string" ? raw.category : categories[0],
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
      trigger: typeof raw.trigger === "string" ? raw.trigger : "",
      theme: typeof raw.theme === "string" ? raw.theme : "",
      tags: Array.isArray(raw.tags) ? unique(raw.tags) : [],
      image: typeof raw.image === "string" ? raw.image : "",
      noteUrl: typeof raw.noteUrl === "string" ? raw.noteUrl : "",
      featured: typeof raw.featured === "boolean" ? raw.featured : false,
      featuredOrder: raw.featuredOrder === "" || raw.featuredOrder == null ? "" : Number(raw.featuredOrder),
      visible: typeof raw.visible === "boolean" ? raw.visible : true,
      order: Number.isInteger(Number(raw.order)) && Number(raw.order) > 0 ? Number(raw.order) : index + 1,
      views: raw.views === "" || raw.views == null ? "" : Number(raw.views),
      likes: raw.likes === "" || raw.likes == null ? "" : Number(raw.likes),
      publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : ""
    };
  }

  function assignMissingFeaturedOrder(items) {
    const featured = byOrder(items.filter((item) => item.featured));
    const used = new Set(featured.map((item) => item.featuredOrder).filter((value) => Number.isInteger(value) && value >= 1 && value <= 3));
    featured.forEach((item) => {
      if (Number.isInteger(item.featuredOrder) && item.featuredOrder >= 1 && item.featuredOrder <= 3) return;
      item.featuredOrder = [1, 2, 3].find((rank) => !used.has(rank)) || "";
      if (item.featuredOrder) used.add(item.featuredOrder);
    });
  }

  function normalizeCollection(data) {
    const normalized = data.map(normalize).sort((a, b) => a.order - b.order);
    assignMissingFeaturedOrder(normalized);
    return normalized;
  }

  function validate(data) {
    const errors = [];
    if (!Array.isArray(data)) return ["データ全体は配列である必要があります。"];
    const ids = new Set();
    const featuredRanks = new Map();
    let featuredCount = 0;
    data.forEach((article, index) => {
      const label = `${index + 1}件目`;
      if (!article || typeof article !== "object" || Array.isArray(article)) { errors.push(`${label}: オブジェクトではありません。`); return; }
      if (typeof article.id !== "string" || !article.id.trim()) errors.push(`${label}: idが未入力です。`);
      else if (ids.has(article.id)) errors.push(`${label}: id「${article.id}」が重複しています。`);
      else ids.add(article.id);
      if (typeof article.title !== "string" || !article.title.trim()) errors.push(`${label}: titleが未入力です。`);
      if (typeof article.noteUrl !== "string" || !article.noteUrl.trim()) errors.push(`${label}: note URLが未入力です。`);
      else { try { const url = new URL(article.noteUrl); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { errors.push(`${label}: note URLの形式が正しくありません。`); } }
      if (!categories.includes(article.category)) errors.push(`${label}: categoryが既存4種類に含まれていません。`);
      if (typeof article.visible !== "boolean") errors.push(`${label}: visibleは真偽値である必要があります。`);
      if (typeof article.featured !== "boolean") errors.push(`${label}: featuredは真偽値である必要があります。`);
      if (!Number.isInteger(Number(article.order)) || Number(article.order) < 1) errors.push(`${label}: orderは1以上の整数にしてください。`);
      ["views", "likes"].forEach((name) => { if (article[name] !== "" && article[name] != null && (!Number.isInteger(Number(article[name])) || Number(article[name]) < 0)) errors.push(`${label}: ${name}は0以上の整数にしてください。`); });
      if (!Array.isArray(article.tags) || article.tags.some((tag) => typeof tag !== "string" || !tag.trim())) errors.push(`${label}: tagsは空文字を含まない文字列配列にしてください。`);
      if (article.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)) errors.push(`${label}: publishedAtはYYYY-MM-DD形式にしてください。`);
      if (article.featured) {
        featuredCount += 1;
        if (!article.visible) errors.push(`${label}: 非公開記事を代表記事にはできません。`);
        const rank = Number(article.featuredOrder);
        if (!Number.isInteger(rank) || rank < 1 || rank > 3) errors.push(`${label}: featuredOrderは1〜3の整数にしてください。`);
        else if (featuredRanks.has(rank)) errors.push(`${label}: featuredOrder ${rank}が「${featuredRanks.get(rank)}」と重複しています。`);
        else featuredRanks.set(rank, article.title || article.id);
      }
    });
    if (featuredCount > 3) errors.push(`代表記事は最大3件です。現在${featuredCount}件あります。`);
    return errors;
  }

  function validateImportedData(data) {
    if (!Array.isArray(data)) return ["データ全体は配列である必要があります。"];
    const errors = [];
    const ids = new Set();
    let featuredCount = 0;
    data.forEach((article, index) => {
      const label = `${index + 1}件目`;
      if (!article || typeof article !== "object" || Array.isArray(article)) { errors.push(`${label}: オブジェクトではありません。`); return; }
      if (typeof article.id !== "string" || !article.id.trim()) errors.push(`${label}: idが未入力です。`);
      else if (ids.has(article.id)) errors.push(`${label}: id「${article.id}」が重複しています。`); else ids.add(article.id);
      if (typeof article.title !== "string" || !article.title.trim()) errors.push(`${label}: titleが未入力です。`);
      if (typeof article.noteUrl !== "string" || !article.noteUrl.trim()) errors.push(`${label}: note URLが未入力です。`);
      if (!categories.includes(article.category)) errors.push(`${label}: categoryが既存4種類に含まれていません。`);
      if (typeof article.visible !== "boolean") errors.push(`${label}: visibleは真偽値である必要があります。`);
      if (typeof article.featured !== "boolean") errors.push(`${label}: featuredは真偽値である必要があります。`);
      if (!Number.isInteger(article.order) || article.order < 1) errors.push(`${label}: orderは1以上の整数にしてください。`);
      if (!Array.isArray(article.tags) || article.tags.some((tag) => typeof tag !== "string" || !tag.trim())) errors.push(`${label}: tagsは空文字を含まない文字列配列にしてください。`);
      ["views", "likes"].forEach((name) => { if (article[name] !== undefined && article[name] !== "" && article[name] !== null && (!Number.isInteger(article[name]) || article[name] < 0)) errors.push(`${label}: ${name}は0以上の整数にしてください。`); });
      if (article.featured === true) { featuredCount += 1; if (article.visible === false) errors.push(`${label}: 非公開記事を代表記事にはできません。`); }
    });
    if (featuredCount > 3) errors.push(`代表記事は最大3件です。現在${featuredCount}件あります。`);
    return errors;
  }

  function changedCount() {
    const base = new Map(baseline.map((item) => [item.id, JSON.stringify(item)]));
    let count = articles.filter((item) => base.get(item.id) !== JSON.stringify(item)).length;
    count += baseline.filter((item) => !articles.some((article) => article.id === item.id)).length;
    return count;
  }
  const isDirty = () => snapshot() !== snapshot(baseline);
  const setStatus = (message, error = false) => { refs.loadStatus.textContent = message; refs.loadStatus.style.color = error ? "#a23f46" : ""; };
  function setMetadataStatus(message, state = "") { refs.metadataStatus.textContent = message; refs.metadataStatus.classList.toggle("is-success", state === "success"); refs.metadataStatus.classList.toggle("is-error", state === "error"); }

  function updateWorkflow() {
    const current = isDirty() ? "select" : workflowStage;
    const labels = { loading: "データを読み込み中", load: "読み込み完了・編集できます", select: "編集中・JSON書き出しが必要です", export: "書き出し済み・data内を差し替えてください" };
    refs.workflowCurrent.textContent = `現在：${labels[current] || labels.load}`;
    const order = ["load", "select", "export", "replace", "check", "publish"];
    refs.workflowSteps.forEach((step) => {
      const stepIndex = order.indexOf(step.dataset.step);
      const currentIndex = order.indexOf(current === "loading" ? "load" : current);
      step.classList.toggle("is-current", step.dataset.step === current);
      step.classList.toggle("is-complete", stepIndex < currentIndex);
    });
  }

  function updateSummary() {
    const dirty = isDirty();
    refs.total.textContent = articles.length;
    refs.visible.textContent = articles.filter((article) => article.visible).length;
    refs.featured.textContent = `${articles.filter((article) => article.featured).length} / 3`;
    refs.changed.textContent = changedCount();
    refs.dirtyStatus.textContent = dirty ? "⚠ 編集内容はまだWritingページへ反映されていません。\nJSONを書き出し、data/writing-articles.jsonを置き換えてください。" : workflowStage === "export" ? "✓ JSONを書き出しました。次はdata内の同名ファイルを置き換えてください。" : "✓ 読み込み済みです。編集を始められます。";
    refs.dirtyStatus.classList.toggle("is-dirty", dirty);
    refs.dirtyStatus.classList.toggle("is-exported", !dirty && workflowStage === "export");
    updateWorkflow();
  }

  function filtersActive() { return Boolean(refs.search.value || refs.categoryFilter.value || refs.visibleFilter.value || refs.featuredFilter.value || refs.tagFilter.value); }
  function filteredArticles() {
    const query = refs.search.value.trim().toLowerCase();
    return byOrder(articles).filter((article) => (!query || article.title.toLowerCase().includes(query)) && (!refs.categoryFilter.value || article.category === refs.categoryFilter.value) && (!refs.visibleFilter.value || (refs.visibleFilter.value === "visible" ? article.visible : !article.visible)) && (!refs.featuredFilter.value || (refs.featuredFilter.value === "featured" ? article.featured : !article.featured)) && (!refs.tagFilter.value || article.tags.includes(refs.tagFilter.value)));
  }

  function updateOptions() {
    const categoryFilterValue = refs.categoryFilter.value;
    refs.categoryFilter.replaceChildren(new Option("すべて", ""), ...categories.map((value) => new Option(value, value)));
    refs.categoryFilter.value = categoryFilterValue;
    const tagFilterValue = refs.tagFilter.value;
    const tags = unique(articles.flatMap((article) => article.tags)).sort();
    refs.tagFilter.replaceChildren(new Option("すべて", ""), ...tags.map((value) => new Option(value, value)));
    refs.tagFilter.value = tagFilterValue;
    refs.tagSuggestions.replaceChildren(...tags.map((value) => new Option(value)));
  }

  function badge(text, featured = false) { const item = document.createElement("span"); item.textContent = text; if (featured) item.className = "is-featured"; return item; }
  function makeThumb(article) {
    const thumb = document.createElement("div"); thumb.className = "admin-thumb";
    if (article.image) { const image = document.createElement("img"); image.src = article.image; image.alt = ""; image.addEventListener("error", () => { thumb.replaceChildren(document.createTextNode("NO IMAGE")); }); thumb.append(image); }
    else thumb.textContent = "NOTE";
    return thumb;
  }

  function renderList() {
    const filtered = filtersActive();
    refs.listNote.textContent = filtered ? "絞り込み中はドラッグを無効化しています。上下ボタンは全体順または代表順位だけを変更します。" : "全体の表示順です。ドラッグまたは上下ボタンで変更できます。";
    refs.list.replaceChildren();
    filteredArticles().forEach((article) => {
      const item = document.createElement("article"); item.className = "admin-article-item"; item.tabIndex = 0; item.dataset.id = article.id; item.draggable = !filtered; item.classList.toggle("is-selected", article.id === selectedId); item.classList.toggle("is-hidden", !article.visible);
      const copy = document.createElement("div"); copy.className = "admin-item-copy";
      const title = document.createElement("strong"); title.textContent = article.title || "タイトル未設定";
      const meta = document.createElement("small"); meta.textContent = `#${article.order} / ${article.category} / View ${article.views === "" ? "—" : article.views} / スキ ${article.likes === "" ? "—" : article.likes}`;
      const badges = document.createElement("div"); badges.className = "admin-badges"; if (article.featured) badges.append(badge(`代表 ${article.featuredOrder || "?"}`, true)); if (!article.visible) badges.append(badge("非公開")); article.tags.slice(0, 2).forEach((tag) => badges.append(badge(tag)));
      copy.append(title, meta, badges);
      const actions = document.createElement("div"); actions.className = "admin-order-actions";
      [["up", "↑", "表示順を上へ"], ["down", "↓", "表示順を下へ"]].forEach(([move, text, label]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = text; button.dataset.move = move; button.setAttribute("aria-label", `${title.textContent}の${label}`); actions.append(button); });
      if (article.featured) [["featured-up", "★↑", "代表順位を上へ"], ["featured-down", "★↓", "代表順位を下へ"]].forEach(([move, text, label]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = text; button.dataset.move = move; button.setAttribute("aria-label", `${title.textContent}の${label}`); actions.append(button); });
      item.append(makeThumb(article), copy, actions); refs.list.append(item);
    });
  }

  function chip(text) { const item = document.createElement("span"); item.className = "admin-chip"; item.append(document.createTextNode(text)); const button = document.createElement("button"); button.type = "button"; button.textContent = "×"; button.dataset.removeTag = text; button.setAttribute("aria-label", `${text}を削除`); item.append(button); return item; }
  function articleErrors(article) { return validate([article]).filter((error) => !error.includes("代表記事は最大3件")); }
  function renderFormErrors(extra = "") {
    const article = selected(); if (!article) return;
    const errors = articleErrors(article);
    if (articles.filter((item) => item.id === article.id).length > 1) errors.unshift(`id「${article.id}」が重複しています。`);
    if (article.featured && articles.some((item) => item !== article && item.featured && Number(item.featuredOrder) === Number(article.featuredOrder))) errors.unshift(`代表順位${article.featuredOrder}が別の記事と重複しています。`);
    if (extra) errors.unshift(extra);
    refs.formErrors.hidden = !errors.length; refs.formErrors.textContent = errors.join("\n");
  }

  function renderEditor() {
    const article = selected();
    if (!article) { refs.form.hidden = true; refs.remove.disabled = true; refs.editorMessage.textContent = "一覧から記事を選択してください。"; return; }
    refs.form.hidden = false; refs.remove.disabled = false; refs.editorMessage.textContent = article.title || article.id;
    fields.forEach((name) => { refs.form.elements[name].value = article[name] ?? ""; });
    ["order", "featuredOrder", "views", "likes"].forEach((name) => { refs.form.elements[name].value = article[name] === "" ? "" : article[name]; });
    refs.form.elements.visible.checked = article.visible; refs.form.elements.featured.checked = article.featured; refs.form.elements.featuredOrder.disabled = !article.featured;
    refs.tagChips.replaceChildren(...article.tags.map(chip)); renderFormErrors();
  }

  function previewCard(article) {
    const card = document.createElement("article"); card.className = "admin-preview-card";
    const title = document.createElement("strong"); title.textContent = article.title || "タイトル未設定";
    const category = document.createElement("small"); category.textContent = article.category;
    const meta = document.createElement("div"); meta.className = "admin-preview-meta";
    if (article.featured) meta.append(badge(`代表 ${article.featuredOrder}`));
    if (article.views !== "") meta.append(badge(`View ${article.views}`));
    if (article.likes !== "") meta.append(badge(`スキ ${article.likes}`));
    if (article.publishedAt) meta.append(badge(article.publishedAt));
    card.append(title, category); if (meta.children.length) card.append(meta); return card;
  }
  function appendPreview(title, items) {
    const section = document.createElement("section"); section.className = "admin-preview-section";
    const heading = document.createElement("h3"); heading.textContent = `${title}（${items.length}件）`;
    const grid = document.createElement("div"); grid.className = "admin-preview-grid"; items.forEach((article) => grid.append(previewCard(article)));
    section.append(heading, grid); refs.preview.append(section);
  }
  function renderPreview() {
    refs.preview.replaceChildren(); const visible = byOrder(articles.filter((article) => article.visible)); const featured = featuredSorted(visible); const normal = visible.filter((article) => !article.featured); const mode = refs.previewSort.value;
    if (mode === "representative") appendPreview("代表記事", featured);
    else if (mode === "normal") appendPreview("通常記事", normal);
    else if (mode === "category") { appendPreview("代表記事", featured); categories.forEach((category) => appendPreview(category, normal.filter((article) => article.category === category))); }
    else {
      const sorters = { views: (a, b) => Number(b.views || 0) - Number(a.views || 0) || a.order - b.order, likes: (a, b) => Number(b.likes || 0) - Number(a.likes || 0) || a.order - b.order, latest: (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")) || a.order - b.order };
      const labels = { views: "ビュー数順", likes: "スキ数順", latest: "最新順" }; appendPreview(labels[mode], [...visible].sort(sorters[mode]));
    }
  }

  function renderAll() { updateOptions(); renderList(); renderEditor(); renderPreview(); updateSummary(); }
  function selectArticle(id) { selectedId = id; renderList(); renderEditor(); }
  function updateOrder() { articles.forEach((article, index) => { article.order = index + 1; }); }
  function moveArticle(id, direction) { const index = articles.findIndex((article) => article.id === id); const next = index + (direction === "up" ? -1 : 1); if (index < 0 || next < 0 || next >= articles.length) return; [articles[index], articles[next]] = [articles[next], articles[index]]; updateOrder(); renderAll(); }
  function moveFeatured(id, direction) { const list = featuredSorted(); const index = list.findIndex((article) => article.id === id); const next = index + (direction === "featured-up" ? -1 : 1); if (index < 0 || next < 0 || next >= list.length) return; const currentRank = list[index].featuredOrder; list[index].featuredOrder = list[next].featuredOrder; list[next].featuredOrder = currentRank; renderAll(); }

  function commitLoaded(data, message) { articles = normalizeCollection(data); baseline = clone(articles); selectedId = articles[0]?.id || ""; workflowStage = "load"; renderAll(); setStatus(`${message} ${articles.length}件を読み込みました。`); }
  function download(name, text, type = "application/json") { const blob = new Blob([text], { type: `${type};charset=utf-8` }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
  function exportData(fallback = false) {
    updateOrder(); const errors = validate(articles); if (errors.length) { refs.formErrors.hidden = false; refs.formErrors.textContent = `書き出せません。\n${errors.join("\n")}`; setStatus(`検証エラー${errors.length}件。書き出しを中止しました。`, true); return; }
    const json = JSON.stringify(byOrder(articles), null, 2);
    if (fallback) download("writing-articles-fallback.js", `// Generated from data/writing-articles.json for file:// use. JSON remains the source of truth.\nwindow.WRITING_ARTICLES_FALLBACK = ${json};\n`, "text/javascript");
    else download("writing-articles.json", `${json}\n`);
    baseline = clone(articles); workflowStage = "export"; renderAll(); setStatus(`${fallback ? "フォールバック" : "JSON"}を書き出しました。${articles.length}件・代表記事${articles.filter((article) => article.featured).length}件。`);
  }

  async function fetchNoteMetadata() {
    const article = selected(); if (!article) { setMetadataStatus("記事を選択してください。", "error"); return; }
    const inputUrl = refs.form.elements.noteUrl.value.trim();
    if (!inputUrl) { setMetadataStatus("note URLを入力してください。", "error"); refs.form.elements.noteUrl.focus(); return; }
    if (location.protocol === "file:") { setMetadataStatus("file://では自動取得できません。npm run writing-adminで開いてください。", "error"); return; }
    refs.fetchMetadata.disabled = true; refs.fetchMetadata.textContent = "取得中…"; setMetadataStatus("noteの記事情報を取得しています。");
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`/api/note-metadata?url=${encodeURIComponent(inputUrl)}`, { signal: controller.signal, headers: { Accept: "application/json" } });
      let payload = null; try { payload = await response.json(); } catch { /* A regular static server returns a non-JSON 404. */ }
      if (!response.ok || !payload?.ok || !payload.metadata) {
        if (response.status === 404 || response.status === 405 || !payload) throw new Error("自動取得APIが起動していません。npm run writing-adminで開いてください。");
        throw new Error(payload.error || `記事情報を取得できませんでした（HTTP ${response.status}）。`);
      }
      const metadata = payload.metadata; const updated = [];
      const fillEmpty = (field, value, label) => { if (value && !String(article[field] ?? "").trim()) { article[field] = value; updated.push(label); } };
      if (metadata.noteUrl && article.noteUrl !== metadata.noteUrl) { article.noteUrl = metadata.noteUrl; updated.push("note URL"); }
      fillEmpty("title", metadata.title, "タイトル"); fillEmpty("publishedAt", metadata.publishedAt, "公開日"); fillEmpty("image", metadata.image, "画像"); fillEmpty("excerpt", metadata.description, "紹介文");
      if (selected() === article) { ["noteUrl", "title", "publishedAt", "image", "excerpt"].forEach((field) => { refs.form.elements[field].value = article[field] || ""; }); }
      updateOptions(); renderList(); renderPreview(); updateSummary(); renderFormErrors();
      setMetadataStatus(updated.length ? `取得成功：${updated.join("、")}を更新しました。` : "取得成功：既存値は上書きせず、そのまま維持しました。", "success");
    } catch (error) {
      setMetadataStatus(error.name === "AbortError" ? "取得がタイムアウトしました。手入力は引き続き利用できます。" : `${error.message} 手入力は引き続き利用できます。`, "error");
    } finally { clearTimeout(timeout); refs.fetchMetadata.disabled = false; refs.fetchMetadata.textContent = "noteから記事情報を取得"; }
  }

  refs.list.addEventListener("click", (event) => { const item = event.target.closest(".admin-article-item"); if (!item) return; const move = event.target.dataset.move; if (move) { event.stopPropagation(); if (move.startsWith("featured")) moveFeatured(item.dataset.id, move); else moveArticle(item.dataset.id, move); return; } selectArticle(item.dataset.id); });
  refs.list.addEventListener("keydown", (event) => { const item = event.target.closest(".admin-article-item"); if (item && event.target === item && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectArticle(item.dataset.id); } });
  refs.list.addEventListener("dragstart", (event) => { const item = event.target.closest(".admin-article-item"); if (!item || filtersActive()) { event.preventDefault(); return; } draggedId = item.dataset.id; event.dataTransfer.effectAllowed = "move"; });
  refs.list.addEventListener("dragover", (event) => { if (draggedId) event.preventDefault(); });
  refs.list.addEventListener("drop", (event) => { event.preventDefault(); const target = event.target.closest(".admin-article-item"); if (!target || !draggedId || target.dataset.id === draggedId) return; const from = articles.findIndex((article) => article.id === draggedId); const to = articles.findIndex((article) => article.id === target.dataset.id); const [moved] = articles.splice(from, 1); articles.splice(to, 0, moved); draggedId = ""; updateOrder(); renderAll(); });

  refs.form.addEventListener("submit", (event) => event.preventDefault());
  refs.form.addEventListener("input", (event) => {
    const article = selected(); if (!article || !event.target.name) return; const name = event.target.name;
    if (name === "featured") {
      if (event.target.checked && !article.visible) { event.target.checked = false; renderFormErrors("非公開記事は代表記事にできません。先に公開をONにしてください。"); return; }
      if (event.target.checked && articles.filter((item) => item.featured && item !== article).length >= 3) { event.target.checked = false; renderFormErrors("代表記事は最大3件です。4件目の指定は受け付けませんでした。"); return; }
      article.featured = event.target.checked;
      if (article.featured) { const used = new Set(featuredSorted().filter((item) => item !== article).map((item) => item.featuredOrder)); article.featuredOrder = [1, 2, 3].find((rank) => !used.has(rank)) || ""; }
      else article.featuredOrder = "";
    } else if (name === "visible") {
      article.visible = event.target.checked; if (!article.visible) { article.featured = false; article.featuredOrder = ""; refs.form.elements.featured.checked = false; }
    } else if (["order", "featuredOrder", "views", "likes"].includes(name)) {
      if (name === "order") { const desired = Math.max(1, Math.min(articles.length, Number(event.target.value) || 1)); const current = articles.indexOf(article); articles.splice(current, 1); articles.splice(desired - 1, 0, article); updateOrder(); }
      else article[name] = event.target.value === "" ? "" : Number(event.target.value);
    } else {
      article[name] = event.target.value; if (name === "id") selectedId = article.id;
    }
    refs.form.elements.featured.checked = article.featured;
    refs.form.elements.featuredOrder.value = article.featuredOrder === "" ? "" : article.featuredOrder;
    refs.form.elements.featuredOrder.disabled = !article.featured;
    updateOptions(); renderList(); renderPreview(); updateSummary(); renderFormErrors();
  });

  refs.tagInput.addEventListener("keydown", (event) => { if (event.key !== "Enter") return; event.preventDefault(); const article = selected(); const value = refs.tagInput.value.trim(); if (!article || !value) return; if (!article.tags.includes(value)) article.tags.push(value); refs.tagInput.value = ""; renderAll(); });
  refs.form.addEventListener("click", (event) => { const value = event.target.dataset.removeTag; if (!value) return; const article = selected(); article.tags = article.tags.filter((tag) => tag !== value); renderAll(); });
  refs.add.addEventListener("click", () => { let number = 1; let id = "new-writing-article"; while (articles.some((article) => article.id === id)) id = `new-writing-article-${++number}`; const article = normalize({ id, category: categories[0], visible: true, featured: false, order: articles.length + 1 }, articles.length); articles.push(article); selectedId = id; renderAll(); refs.form.elements.title.focus(); });
  refs.remove.addEventListener("click", () => { const article = selected(); if (!article) return; const name = article.title || article.id; if (!window.confirm(`「${name}」を削除しますか？`)) return; articles = articles.filter((item) => item !== article); updateOrder(); selectedId = articles[0]?.id || ""; renderAll(); });
  [refs.search, refs.categoryFilter, refs.visibleFilter, refs.featuredFilter, refs.tagFilter].forEach((control) => control.addEventListener("input", renderList));
  refs.previewSort.addEventListener("input", renderPreview);
  refs.fetchMetadata.addEventListener("click", fetchNoteMetadata);
  refs.reset.addEventListener("click", () => { if (isDirty() && !window.confirm("未書き出しの変更を破棄して、最後に読み込んだ状態へ戻しますか？")) return; articles = clone(baseline); selectedId = articles[0]?.id || ""; workflowStage = "load"; renderAll(); setStatus("最後に読み込んだ状態へ戻しました。"); });
  refs.downloadJson.addEventListener("click", () => exportData(false)); refs.downloadFallback.addEventListener("click", () => exportData(true));
  refs.file.addEventListener("change", async () => { const file = refs.file.files[0]; if (!file) return; if (isDirty() && !window.confirm("未書き出しの変更があります。別のJSONを読み込みますか？")) { refs.file.value = ""; return; } try { const parsed = JSON.parse(await file.text()); const importErrors = validateImportedData(parsed); if (importErrors.length) throw new Error(importErrors.join("\n")); const normalized = normalizeCollection(parsed); const errors = validate(normalized); if (errors.length) throw new Error(errors.join("\n")); commitLoaded(parsed, `${file.name}から`); } catch (error) { setStatus(`読み込み失敗: ${error.message}`, true); } finally { refs.file.value = ""; } });
  window.addEventListener("beforeunload", (event) => { if (!isDirty()) return; event.preventDefault(); event.returnValue = ""; });

  async function init() {
    categories.forEach((category) => refs.form.elements.category.append(new Option(category, category)));
    refs.previewSort.replaceChildren(new Option("代表記事3件", "representative"), new Option("通常記事", "normal"), new Option("カテゴリ別", "category"), new Option("ビュー数順", "views"), new Option("スキ数順", "likes"), new Option("最新順", "latest")); refs.previewSort.value = "category";
    if (location.protocol === "file:") { refs.fetchMetadata.disabled = true; setMetadataStatus("file://では自動取得できません。npm run writing-adminで開いてください。", "error"); }
    try {
      let data;
      if (location.protocol === "file:") { data = window.WRITING_ARTICLES_FALLBACK; if (!Array.isArray(data)) throw new Error("file://用フォールバックがありません。"); }
      else { const response = await fetch("data/writing-articles.json"); if (!response.ok) throw new Error(`HTTP ${response.status}`); data = await response.json(); }
      const importErrors = validateImportedData(data); if (importErrors.length) throw new Error(importErrors.join(" ")); const normalized = normalizeCollection(data); const errors = validate(normalized); if (errors.length) throw new Error(errors.join(" ")); commitLoaded(data, location.protocol === "file:" ? "フォールバックから" : "writing-articles.jsonから");
    } catch (error) { setStatus(`初期データの読み込みに失敗しました: ${error.message}`, true); articles = []; baseline = []; workflowStage = "load"; renderAll(); }
  }
  init();
})();
