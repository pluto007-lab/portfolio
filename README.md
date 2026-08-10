# Portfolio v2

Webアプリ開発を中心に、Webサイト、デザイン、開発基盤、企画、文章、実験的な取り組みをカテゴリごとに紹介するポートフォリオサイトです。

縦長の1ページ構成だった旧版を、作品や活動が増えても整理・更新しやすい複数ページ構成へリニューアルしています。

## 公開URL

https://pluto007-lab.github.io/portfolio/

## 主なページ

- `index.html` — Home。各カテゴリと代表作品への入口
- `about.html` — 制作姿勢、強み、経験、資格
- `web-apps.html` — Webアプリ作品
- `websites.html` — Webサイト作品
- `design.html` — JSONで管理するデザイン作品ギャラリー
- `development.html` — 設計・実装・運用改善を紹介する開発ケーススタディ
- `planning.html` — 企画立案、役割設計、進行・ディレクション
- `writing.html` — note記事とWriting管理・分析システムの紹介
- `lab.html` — 実験、アイデア、試作、研究ログ
- `contact.html` — EmailとGitHubへの連絡導線

詳細な制作事例として、`writing-system.html`も用意しています。

## 代表的な制作物

- **Career Track** — 企業情報、応募状況、面接予定を管理する就職活動管理Webアプリ
- **シニア向けスマホ教室「若葉」** — 読みやすさ、操作性、アクセシビリティを意識したサービス紹介サイト
- **pale table** — カートやお気に入りなどを実装したECサイト風のWebサイト
- **Writing管理・分析システム** — note記事の管理、アクセス状況の半自動取得、指標計算、時系列履歴を扱うローカル管理ツール
- **Design Works Admin** — デザイン作品の追加・編集・並べ替え・公開設定とJSON書き出しを行う管理画面

## 使用技術

ポートフォリオ本体：

- HTML
- CSS
- Vanilla JavaScript
- JSON
- Git / GitHub
- GitHub Pages

ローカル管理ツール：

- Node.js
- File API
- Bookmarklet

掲載作品では、React、TypeScript、Vite、Tailwind CSSなども使用しています。各作品の技術構成は、それぞれの掲載ページで確認できます。

## ローカルで確認する方法

JSONを`fetch`するページがあるため、`file://`ではなくローカルサーバー経由で確認します。

Node.jsが利用できる環境で、リポジトリのルートから次を実行してください。

```bash
npm run writing-admin
```

起動後、以下へアクセスします。

```text
http://127.0.0.1:8787/
```

通常の公開ページ確認にも利用できます。Writing管理画面でnote記事情報を取得するローカルAPIも同じサーバーから提供されます。

## リポジトリ構成

```text
portfolio/
├── index.html                  # Home
├── about.html                  # About
├── web-apps.html               # Web Apps
├── websites.html               # Websites
├── design.html                 # Design
├── development.html            # Development
├── planning.html               # Planning & Direction
├── writing.html                # Writing
├── writing-system.html         # Writing管理・分析システム詳細
├── lab.html                    # Lab
├── contact.html                # Contact
├── css/                        # 共通・ページ固有スタイル
├── js/                         # 共通UI、ギャラリー、管理画面処理
├── data/                       # Design・Writingの公開データと履歴
├── img/                        # 作品画像とスクリーンショット
├── docs/                       # Portfolio v2の設計書
└── tools/                      # ローカルサーバー、ブックマークレット
```

## データ管理

- Design作品：`data/design-works.json`
- Writing記事：`data/writing-articles.json`
- Writingアクセス履歴：`data/writing-stats-history.json`

管理画面は静的サイト上のファイルを直接更新しません。編集結果をJSONまたはfallbackファイルとしてダウンロードし、対象ファイルを差し替えてからGitで反映する運用です。

`design-admin.html`と`writing-admin.html`には認証機能やサーバー保存機能を実装していません。
