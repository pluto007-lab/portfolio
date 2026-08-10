(() => {
  const fail = (message) => window.alert(`noteアクセス状況を取得できませんでした。\n${message}\n画面構造が変更された可能性があります。`);
  const parseCount = (element, label) => {
    if (!element) throw new Error(`${label}の列が見つかりません。`);
    const value = Number(element.textContent.replace(/[^0-9]/g, ""));
    if (!Number.isInteger(value) || value < 0) throw new Error(`${label}を数値として取得できません。`);
    return value;
  };

  try {
    if (location.hostname !== "note.com" || location.pathname !== "/sitesettings/stats") {
      throw new Error("noteのアクセス状況ページで実行してください。");
    }

    const articles = [...document.querySelectorAll(".o-statsContent__tableTitleLink")].map((link) => {
      const row = link.closest("tr");
      if (!row) throw new Error("記事行が見つかりません。");
      const url = new URL(link.getAttribute("href"), "https://note.com");
      const articleId = url.pathname.match(/\/n\/([^/?#]+)/)?.[1];
      if (!articleId) throw new Error("記事IDをURLから取得できません。");
      return {
        articleId,
        url: url.origin + url.pathname,
        title: link.textContent.trim(),
        views: parseCount(row.querySelector(".o-statsContent__tableStat--type_view"), "PV"),
        comments: parseCount(row.querySelector(".o-statsContent__tableStat--type_comment"), "コメント"),
        likes: parseCount(row.querySelector(".o-statsContent__tableStat--type_suki"), "スキ")
      };
    });

    if (!articles.length) throw new Error("記事データが1件も見つかりません。");
    const json = JSON.stringify({ source: "note-stats", capturedAt: new Date().toISOString(), articles }, null, 2);
    navigator.clipboard.writeText(json)
      .then(() => window.alert(`${articles.length}件の記事データをコピーしました`))
      .catch(() => window.prompt("クリップボードへ自動コピーできませんでした。以下をコピーしてください。", json));
  } catch (error) {
    fail(error.message);
  }
})();
