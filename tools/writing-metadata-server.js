"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 8787;
const ROOT = path.resolve(__dirname, "..");
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon"
};

function validateNoteArticleUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("NOTE_URL_INVALID"); }
  if (url.protocol !== "https:" || url.hostname !== "note.com" || url.username || url.password || url.port) throw new Error("NOTE_URL_NOT_ALLOWED");
  if (!/^\/[A-Za-z0-9_-]+\/n\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) throw new Error("NOTE_ARTICLE_URL_REQUIRED");
  url.hash = "";
  return url;
}

function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") { const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
    return Object.prototype.hasOwnProperty.call(named, entity.toLowerCase()) ? named[entity.toLowerCase()] : match;
  }).replace(/\s+/g, " ").trim();
}

function readTagAttributes(tag) {
  const attributes = {};
  tag.replace(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_, name, doubleQuoted, singleQuoted) => { attributes[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? ""; return ""; });
  return attributes;
}

function extractMeta(html) {
  const meta = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = readTagAttributes(tag);
    const key = (attributes.property || attributes.name || "").toLowerCase();
    if (key && attributes.content != null && meta[key] == null) meta[key] = decodeHtml(attributes.content);
  }
  return meta;
}

function findJsonLdValue(value, key) {
  if (!value || typeof value !== "object") return "";
  if (typeof value[key] === "string") return value[key];
  if (Array.isArray(value)) { for (const item of value) { const found = findJsonLdValue(item, key); if (found) return found; } }
  else { for (const child of Object.values(value)) { const found = findJsonLdValue(child, key); if (found) return found; } }
  return "";
}

function extractJsonLdValue(html, key) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const found = findJsonLdValue(JSON.parse(decodeHtml(match[1])), key); if (found) return found; } catch { /* Ignore malformed unrelated JSON-LD blocks. */ }
  }
  return "";
}

function findJsonLdArticle(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.headline === "string") return value;
  const children = Array.isArray(value) ? value : Object.values(value);
  for (const child of children) { const found = findJsonLdArticle(child); if (found) return found; }
  return null;
}

function extractJsonLdArticle(html) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const found = findJsonLdArticle(JSON.parse(decodeHtml(match[1]))); if (found) return found; } catch { /* Ignore malformed unrelated JSON-LD blocks. */ }
  }
  return null;
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function normalizeTitle(value) {
  return decodeHtml(value).replace(/\s*[｜|]\s*note\s*$/i, "").trim();
}

function parseMetadata(html, finalUrl) {
  const meta = extractMeta(html);
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const articleData = extractJsonLdArticle(html);
  let canonicalUrl = finalUrl;
  if (meta["og:url"]) { try { canonicalUrl = validateNoteArticleUrl(meta["og:url"]).href; } catch { canonicalUrl = finalUrl; } }
  const normalizedUrl = validateNoteArticleUrl(canonicalUrl);
  normalizedUrl.search = "";
  let title = normalizeTitle(articleData?.headline || meta["og:title"] || (titleMatch ? titleMatch[1] : ""));
  const author = Array.isArray(articleData?.author) ? articleData.author[0] : articleData?.author;
  const authorName = decodeHtml(typeof author === "string" ? author : author?.name || "");
  if (authorName && title.endsWith(`｜${authorName}`)) title = title.slice(0, -(`｜${authorName}`.length)).trim();
  return {
    title,
    publishedAt: normalizeDate(meta["article:published_time"] || extractJsonLdValue(html, "datePublished")),
    image: meta["og:image"] || "",
    description: meta["og:description"] || "",
    noteUrl: normalizedUrl.href.replace(/\/$/, "")
  };
}

async function readLimitedBody(response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new Error("NOTE_RESPONSE_TOO_LARGE");
  const reader = response.body.getReader();
  const chunks = []; let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength; if (total > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error("NOTE_RESPONSE_TOO_LARGE"); }
    chunks.push(value);
  }
  const body = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(body);
}

async function fetchNoteMetadata(inputUrl) {
  let currentUrl = validateNoteArticleUrl(inputUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const response = await fetch(currentUrl, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": "PortfolioWritingAdmin/1.0", Accept: "text/html,application/xhtml+xml" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirect === MAX_REDIRECTS) throw new Error("NOTE_TOO_MANY_REDIRECTS");
        const location = response.headers.get("location"); if (!location) throw new Error("NOTE_REDIRECT_INVALID");
        currentUrl = validateNoteArticleUrl(new URL(location, currentUrl).href); continue;
      }
      if (!response.ok) throw new Error(`NOTE_HTTP_${response.status}`);
      const type = response.headers.get("content-type") || ""; if (!type.toLowerCase().includes("text/html")) throw new Error("NOTE_CONTENT_TYPE_INVALID");
      return parseMetadata(await readLimitedBody(response), currentUrl.href);
    }
    throw new Error("NOTE_TOO_MANY_REDIRECTS");
  } catch (error) {
    if (error.name === "AbortError") throw new Error("NOTE_TIMEOUT");
    throw error;
  } finally { clearTimeout(timeout); }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(payload));
}

function publicError(error) {
  const messages = {
    NOTE_URL_INVALID: "URLの形式が正しくありません。", NOTE_URL_NOT_ALLOWED: "note.comのHTTPS記事URLだけを指定してください。",
    NOTE_ARTICLE_URL_REQUIRED: "noteの記事URLを指定してください。プロフィールURLは使用できません。", NOTE_TIMEOUT: "noteからの取得がタイムアウトしました。",
    NOTE_RESPONSE_TOO_LARGE: "記事ページのサイズが上限を超えました。", NOTE_CONTENT_TYPE_INVALID: "note記事のHTMLを取得できませんでした。",
    NOTE_TOO_MANY_REDIRECTS: "リダイレクト回数が上限を超えました。", NOTE_REDIRECT_INVALID: "note記事の転送先を確認できませんでした。"
  };
  if (/^NOTE_HTTP_\d+$/.test(error.message)) return { status: 502, message: `note記事を取得できませんでした（HTTP ${error.message.slice(10)}）。` };
  if (error.message === "NOTE_TIMEOUT") return { status: 504, message: messages.NOTE_TIMEOUT };
  if (messages[error.message]) return { status: error.message.startsWith("NOTE_URL") || error.message === "NOTE_ARTICLE_URL_REQUIRED" ? 400 : 502, message: messages[error.message] };
  return { status: 502, message: "note記事情報を取得できませんでした。時間を置いて再試行してください。" };
}

async function handleApi(requestUrl, response) {
  const value = requestUrl.searchParams.get("url") || "";
  try { sendJson(response, 200, { ok: true, metadata: await fetchNoteMetadata(value) }); }
  catch (error) { const result = publicError(error); sendJson(response, result.status, { ok: false, error: result.message }); }
}

function serveStatic(requestUrl, response) {
  let pathname;
  try { pathname = decodeURIComponent(requestUrl.pathname); } catch { response.writeHead(400); response.end("Bad Request"); return; }
  if (pathname === "/") pathname = "/writing-admin.html";
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not Found"); return; }
    response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${HOST}:${PORT}`);
  if (request.method !== "GET") { sendJson(response, 405, { ok: false, error: "GETリクエストだけを受け付けます。" }); return; }
  if (requestUrl.pathname === "/api/note-metadata") { await handleApi(requestUrl, response); return; }
  serveStatic(requestUrl, response);
});

if (require.main === module) server.listen(PORT, HOST, () => { console.log(`Writing Admin: http://${HOST}:${PORT}/writing-admin.html`); });

module.exports = { validateNoteArticleUrl, parseMetadata, fetchNoteMetadata };
