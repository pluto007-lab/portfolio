# Portfolio Cafe Design System

この文書は、Portfolio Cafe Home（`index.html`、`css/style.css`、Homeが参照する `img/portfolio-cafe/` 内の画像）を基準実装として抽出したルールである。想像上の完成形ではなく、現在の実装を下層ページへ展開するための判断基準として使う。

> CSSには制作過程の旧ルールと最終上書きが共存している。数値は原則として、同じ詳細度で後に宣言される最終カスケードの実効値を優先して記載する。将来の実装時も、宣言を単独で読むのではなく実ブラウザの計算済みスタイルを確認すること。

## 1. Brand Concept

Portfolio Cafeは、完成作品、制作途中のもの、学習、実験、文章を「いつでも新しいものが並ぶ架空のカフェ」として見せるポートフォリオである。核となる表現は次の3つ。

- `PORTFOLIO CAFE`
- `MADE FRESH, BUILT DAILY.`
- 「毎日考えて、つくって、更新していく。」

作品を「商品」として扱うのは、カテゴリと状態をパッケージラベルのように整理し、採用担当者が内容と導線をすぐ理解できるようにするためである。カフェ用語は意味を置き換えるものではなく、通常の作品名・説明・リンクを補助するブランド言語として使う。

| ブランド言語 | Homeでの意味 |
|---|---|
| `OPEN DAILY` | 継続的に公開・更新している場所 |
| `FRESHLY SERVED` | 公開済み、または新しく提供した作品・更新 |
| `TEST BATCH` | 実験、試作、検証中のアイデア |
| `NOW BREWING` | 現在取り組んでいる制作・学習・改善 |
| `SIGNATURE ITEMS` | 現在の代表作品 |

## 2. Design Principles

- Whiteを大きく使い、Blackの文字を情報の主軸にする。
- Label Blueはラベル、細線、番号、状態、リンク下線、小さな面に限定する。
- 太い枠や均一なカードの反復ではなく、細線、小さな英字、写真、余白で階層を作る。
- 商品パッケージや管理ラベルのように、コード、カテゴリ、状態、説明を整然と並べる。
- Editorial Designの余白を使うが、意味のない空白は作らない。
- 自由配置より「余白のある整列」を優先する。
- 装飾情報は作品名、本文、主要リンクより目立たせない。
- 写真と正式なブランド画像を主役として扱い、CSSによる擬似ロゴ・擬似スタンプを増やさない。
- Cafeの比喩だけで内容を曖昧にせず、Web制作・デザイン・開発の情報を明示する。

## 3. Color System

Homeの基本変数は `.cafe-home-v2` に定義されている。

| 名称 | HEX | 主な用途 |
|---|---|---|
| White | `#FFFFFF` | ページ背景、レシート、商品陳列の余白、Footer |
| Black | `#111111`（`--pc-black: #111`） | 見出し、本文の主軸、主要情報 |
| Label Blue | `#78BCE8`（`--pc-blue`） | 細線、リンク下線、ブランド画像、番号、状態、アクセント |
| Light Gray | `#E5E8EB`（`--pc-gray`） | 区切り線、補助面、作品行の境界 |

実装上の補助色：

- 薄いBlue面：`#F2F9FD`（Now Brewing背景）
- 薄いBlueラベル面：`#EFF8FD`、`#EAF6FC`
- Blue文字：`#257AA9`、`#2C83B2`、`#3985B0` など
- 本文・補助文字：`#505960`、`#596168`、`#6B747A`、`#798187`
- 薄い背景：`#FAFAFA`、`#FBFBFB`、`#F4F5F5`

補助色は可読性と階層のための派生色であり、新しい主役色として増やさない。

## 4. Typography

HomeはGoogle Fontsから次を読み込む。

- Archivo: `400 / 500 / 600 / 700`
- Manrope: `400 / 500 / 600 / 700 / 800`
- Noto Sans JP: `400 / 500 / 600 / 700`

| 役割 | 実装フォント | 実装上の使い方 |
|---|---|---|
| Display / Latin brand support | Manrope | ページ全体のLatin、ナビ、コード、ラベル |
| Section heading | Archivo + Noto Sans JP | `h2`、`h3`、Today’s Menu、Selected Work、About、Now Brewing |
| Body / Japanese | Noto Sans JP + Manrope | 本文、説明、リスト |
| Micro label | Manrope + Noto Sans JP | eyebrow、状態、番号、商品コード、リンクラベル |
| Official logo | PNG画像 | メインロゴとSignature Logo。フォントで再現しない |

重要な実装値：

- Section heading: 基本 `clamp(38px, 5vw, 62px)`、`font-weight: 600`、`line-height: 1`、`letter-spacing: -0.045em`
- Now Brewing heading: `clamp(46px, 5.5vw, 70px)`、`line-height: .82`
- About heading: `clamp(48px, 5vw, 64px)`、`line-height: .9`
- Hero説明: `13px / line-height: 2`、`max-width: 560px`
- Section説明: `13px / line-height: 1.9`、`max-width: 720px`
- 商品説明: `11px / line-height: 1.8`
- Micro label: 主に `8–10px`、`font-weight: 700–800`、`letter-spacing: .1em–.2em`
- Desktopレシートリンク: `9px / 1.2`、`font-weight: 600`、`letter-spacing: .055em`

## 5. Layout System

### Breakpoints

- Desktop: `min-width: 1200px`
- Tablet / compact desktop navigation: `max-width: 1199px`
- TabletのMenu 2列・関連調整: `max-width: 900px`
- Mobile: `max-width: 600px`
- 検証基準幅: `1200px / 768px / 390px`

### Desktop

- レシートナビ: `position: fixed`、`top: 18px`、`bottom: 18px`、`left: 40px`、`width: 190px`
- レシート内側: `padding: 24px 18px 20px`
- main / Footer: `width: min(1120px, calc(100% - 272px))`、viewport中央から `left: 108px` 補正
- 1200px検証時の実測軸: mainは概ね `left: 244px / right: 1157px / width: 913px`（スクロールバー込みの環境差あり）
- レシートと本文の実測間隔: 約14px。Home固有の最終調整値であり、下層ページでは同じ軸を基準に実ブラウザで確認する。

### Hero（Home固有）

- 2カラム: `minmax(0, 1.08fr) minmax(360px, .92fr)`
- `gap: 48px`
- `min-height: 0`
- `margin-top: 18px`
- `padding: 36px 0 32px`
- `align-items: start`
- 商品画像側: `min-height: 500px`
- メインブランド領域: `width: min(100%, 680px)`、Desktop最終値 `margin-top: 14px`

このHero構造はHome固有。下層ページは同じ色・文字・ラベル思想を使い、内容に合わせて構造を変えてよい。

### Section / component layout

- Hero → Menu: Menu側 `margin-top: 32px`、`padding-top: 36px`。リンク下端から見出しまで実測約100px。
- Product Grid: Desktop 4列、`gap: 68px 28px`、各画像枠 `aspect-ratio: 1 / 1`
- Selected Work開始: `margin-top: 56px`、`padding-top: 124px`
- Editorial work row: `grid-template-columns: 90px minmax(230px, .72fr) minmax(0, 1fr)`、`gap: 48px`、上下 `padding: 70px`
- Now Brewing: `margin-top: 100px`、内部 `padding: 68px 54px`、2カラム `minmax(270px, .75fr) minmax(0, 1.25fr)`、`gap: 72px`
- About開始: `margin-top: 56px`。内部はHome固有の2カラム。
- Footer: `border-top: 2px solid var(--pc-blue)`、`padding: 54px 0 24px`、Homeではブランドタグ用に右 `padding: 235px`、`min-height: 310px`

下層ページへ共通化するのはコンテンツ軸、余白の考え方、4/2/1列の切替、細線による区切り。Heroの比率、Selected Workの作品行数、Now Brewing、Aboutの具体構造はHome固有。

## 6. Navigation System

### Desktop: Receipt / Order Sheet navigation

- 1200px以上で固定サイドナビを表示する。
- Whiteの紙面、`1px solid #DFE3E6`、角丸なし、薄い影 `8px 12px 30px rgba(17,17,17,.06)`。
- 上部に `PORTFOLIO CAFE`、`ORDER / NAV-01`、`10 ITEMS`、破線区切り。
- 各リンクに `01–10` の番号を付ける。
- 現在ページはBlue文字と右端の5px Blueドットで示す。
- グループ間は薄い線で分ける。
- 上部情報からナビまで `24px`。リンクは `min-height: 32px` を維持する。
- 下部に `OPEN DAILY`、`MADE FRESH, BUILT DAILY.`、`THANK YOU / 2026` を置く。`margin-top: auto` で下端へ寄せる。

### Tablet / Mobile: Drawer navigation

- 1199px以下ではレシート固有のhead/tailを非表示にし、既存のハンバーガーとDrawerを使用する。
- JavaScriptは現在の開閉・ARIA・スクロール制御を共通利用する前提。文書化時点では変更しない。
- 下層ページでも同じナビ項目と番号体系を使い、`aria-current="page"` の対象だけをページに合わせる。

## 7. Category System

| Code | ページ名 | Cafeメタファー |
|---|---|---|
| APP-01 | Web Apps | Drinks |
| WEB-02 | Websites | Takeout |
| DES-03 | Design | Sweets |
| DEV-04 | Development | Beans |
| WRT-05 | Writing | Zine |
| PLN-06 | Planning & Direction | Order Sheet |
| LAB-07 | Lab | Test Batch |

コードと通常のページ名を主情報とし、Cafeメタファーは小さな副情報として添える。

カテゴリコードと個別作品コードは別体系として扱う。

## 8. Graphic Assets

| Asset | 実ファイル寸法 | Homeでの用途・場所 | 使用上の注意 |
|---|---:|---|---|
| `portfolio-cafe-main-logo.png` | 1307×487 | Heroのメインブランド | タグラインを含む。HTMLで重複表示しない |
| `portfolio-cafe-signature-logo.png` | 980×447 | Footerの人の気配を出す補助ロゴ | メインロゴの代用にしない |
| `portfolio-cafe-open-daily-stamp.png` | 913×924 | Hero商品画像上のOPEN DAILY印 | 小さなアクセントとして使用 |
| `portfolio-cafe-test-batch-stamp.png` | 919×904 | Now Brewing | 実験・仕込み中の文脈に限定 |
| `portfolio-cafe-ticket-label.png` | 1342×722 | Selected Work導入 | 作品名より目立たせない |
| `portfolio-cafe-thank-you-tag.png` | 740×1482 | Desktop Footer右側 | Mobileでは非表示。本文・リンクと重ねない |

共通ルール：

- 正式画像を優先し、CSSでロゴやスタンプを無理に再現しない。
- `portfolio` の `i` のBlueドットをCSSで追加・重ね合わせしない。
- 縦横比を維持し、基本は `width: 100%; height: auto; object-fit: contain`。
- Logoには読み込み失敗時だけ文字fallbackを許可する。
- HTMLのwidth/height属性と実ファイル寸法に差がある画像があるため、差し替え時は実画像を確認し、CSSで比率を固定しない。

## 9. Product Image System

実使用画像は次の7点で、すべて実ファイル寸法は1254×1254。

- `app-01-web-apps.png`
- `web-02-websites.png`
- `des-03-design.png`
- `dev-04-development.png`
- `wrt-05-writing.png`
- `pln-06-planning.png`
- `lab-07-lab.png`

画像ルール：

- White〜ごく薄い背景に商品単体を置く。
- 商品の周囲に十分な余白を残す。
- パッケージラベルと少量のLabel Blueでカテゴリを表現する。
- 木目・茶色・クラフト紙ではなく、洗練された商品パッケージでCafe感を出す。
- Homeの画像枠は正方形で、画像は `object-fit: contain`。過度にトリミング・変形しない。
- 画像には内容とカテゴリが伝わるaltを付ける。

## 10. UI Components

| Component | 使用する場面 |
|---|---|
| Section eyebrow | セクション種別や管理情報を小さく先に示す |
| Section heading | ページの主要区切り。通常名を明確にする |
| Micro label | コード、媒体、年、状態などの補助情報 |
| Product card | カテゴリ入口。商品画像＋コード＋ページ名＋説明＋リンク |
| Receipt navigation | 全ページ共通のDesktopナビゲーション |
| Status label | `FRESHLY SERVED`、`IN OPERATION` など作品状態 |
| Ticket | Selected Workやコンセプト情報を商品票として補助する |
| Stamp | OPEN、試作、仕込み中など限定された状態表現 |
| Thin blue underline | テキストリンクやブランド上の小さな強調 |
| Editorial work row | 代表作品を番号・ビジュアル・説明の横並びで見せる |
| Now Brewing panel | 現在進行中の制作・学習をまとめる |
| Footer brand area | Signature Logo、謝意、連絡先、ブランドタグをまとめる |

同一ページでTicketやStampを重ねて多用しない。通常の見出し・本文・導線を先に設計し、ブランド部品は意味がある場所だけに置く。

## 11. Spacing Rules

- 余白は大きければ良いわけではなく、情報の区切りと視線移動を説明できる量にする。
- 複数の `margin` / `padding` / `min-height` が同じ境界に積み重ならないよう、隣接要素の両側を確認する。
- セクション外側の間隔と、セクション内部の導入paddingを区別する。
- 全ページ縮小スクリーンショットだけで細かな余白を判断しない。
- Desktopは実ブラウザのファーストビューで、直前要素の下端から次の見出しまでを確認する。
- 1200pxだけでなく768px・390pxでも横方向のはみ出しと縦のテンポを確認する。

注意事例：Hero → Today’s Menuでは、過去にHero `padding-bottom: 72px`、Menu `margin-top: 56px`、Menu `padding-top: 96px` が重なり、リンク下端から見出しまで224pxになった。現在は順に `32px / 32px / 36px` とし、実測約100px。negative marginではなく、重複している原因側を整理する。

## 12. Responsive Rules

| 基準幅 | Navigation | Product Menu | Homeで確認できる主な変化 |
|---:|---|---|---|
| 1200px | 固定レシートサイドナビ | 4列＋3列 | Hero 2カラム、Selected Work横並び、Now Brewing 2カラム、Footerタグ表示 |
| 768px | ハンバーガー / Drawer | 2列 | レシートhead/tail非表示、Heroは縮小した2カラム、Selected導入とAboutのカラムを圧縮 |
| 390px | ハンバーガー / Drawer | 1列 | Hero縦積み、Selected導入1列、Now Brewing 1列、About 1列、THANK YOUタグ非表示 |

実装上、2列への切替は `max-width: 900px`、1列への切替は `max-width: 600px`。768pxと390pxは検証幅であり、CSS breakpointそのものではない。

レスポンシブで未確認の新規コンポーネント挙動は推測せず、下層ページ実装時に各基準幅で決める。

## 13. Lower Page Guidelines

目標はHomeの複製ではなく、「同じ店の別メニュー／別ページ」に見せること。

### 共通化するもの

- Color System
- Manrope / Archivo / Noto Sans JPの役割
- Desktopレシート、Tablet / Mobile DrawerのNavigation System
- カテゴリコードとCafeメタファー
- eyebrow、micro label、status、細いBlue線
- 正式ブランドアセットの扱い
- 整列と意味のある余白
- Footerのブランド言語と主要リンク
- 1200px / 768px / 390pxでの検証思想

### ページごとに変更してよいもの

- Heroの構造、比率、情報量
- 商品写真・作品画像
- 一覧、ケーススタディ、記事などの情報レイアウト
- ページ固有のUIコンポーネント
- カテゴリごとのCafeメタファーの具体表現

### ページ別メタファー

| Page | Direction |
|---|---|
| About | Maker / About the Maker |
| Web Apps | Drinks |
| Websites | Takeout |
| Design | Sweets |
| Development | Beans |
| Writing | Zine |
| Planning & Direction | Order Sheet |
| Lab | Test Batch |
| Contact | Counter / Order / Contact |

### 現時点で未定

- 各下層ページ固有Heroの具体的な高さ・カラム比率
- 各ページで使う商品写真・追加ブランド画像
- 一覧件数に応じたカード／行の具体構成
- ContactのCounter / Order表現の具体UI
- 下層ページ固有のTicket・Stampの配置数と位置

これらはHomeから確定できないため、推測で固定せず、各ページの情報目的と実ブラウザ検証に基づいて決める。
