# Portfolio v2 Roadmap

## 1. Portfolio v2のコンセプト

Portfolio v2は、従来の縦長1ページ構成を、制作分野ごとの複数ページ構成へ整理するリニューアルです。

- Homeは全作品を並べる場所ではなく、各カテゴリへの入口とする
- 既存コンテンツを失わず、内容に応じたページへ整理する
- 作品が増えても管理しやすい構造にする
- ページごとに世界観と見せ方を変える
- 実際に確認できる制作内容だけを掲載し、未確認情報や架空の成果を追加しない

### 共通コピー

> Building, learning, and experimenting.
>
> <small>つくり、学び、実験する。</small>

- 英語を主表示とする
- 日本語は英語より少し小さく、薄い色で添える

## 2. サイトマップ

```text
Home
├── About
├── Web Apps
├── Websites
├── Design
│   ├── Adobe Works
│   └── Canva Works
├── Development
├── Planning & Direction
├── Writing
├── Lab
└── Contact
```

### 現在の実装状況

| ページ | ファイル | 状況 |
| --- | --- | --- |
| Home | `index.html` | 実装済み |
| About | `about.html` | 実装済み |
| Web Apps | `web-apps.html` | 実装済み |
| Websites | `websites.html` | 実装済み |
| Design | `design.html` | 実装済み |
| Adobe Works | `adobe-works.html` | 既存ページあり |
| Canva Works | `canva-works.html` | 既存ページあり |
| Development | `development.html` | 実装対象 |
| Planning & Direction | 未定 | 未実装 |
| Writing | 未定 | 未実装 |
| Lab | 未定 | 未実装 |
| Contact | 未定 | 未実装 |

## 3. 各ページの役割

### Home

- 各カテゴリへの入口
- Featured Projectsとして代表作品だけを掲載する
- 現在取り組んでいることをNowで伝える
- Aboutは短縮版を掲載し、詳細ページへつなぐ

### About

- 経歴の羅列ではなく、考え方と作り方を伝える
- 強み、制作・活動スタイル、Experience、Qualificationsを整理する
- 既存情報以上の経歴を推測で追加しない

### Web Apps

- Webアプリの設計、改善、技術選定を伝える
- Career Trackを代表作として強調する
- その他のアプリは共通カードで整理する

### Websites

- 想定ユーザー、情報設計、デザイン、アクセシビリティ、レスポンシブ対応を伝える
- シニア向けスマホ教室「若葉」を代表事例として強調する
- pale tableは若葉より軽い見せ方にする

### Design

- 制作物を主役にしたギャラリー型ページとする
- 制作物そのものを見せる
- 実在する作品画像だけを掲載する

### Development

- どのような開発をしてきたか、どのような考え方で開発しているかを伝える
- 開発者としてのポートフォリオに位置付ける
- 設計図・開発ノート・プロジェクト一覧のように見せる
- Career Track、Design Works Admin、勤務シフト管理アプリを掲載する
- Web App Template v1.0を共通開発基盤として掲載する

### Planning & Direction

- 企画全体と担当範囲を見せる
- 学校公式SNS企画を掲載予定とする
- 次の役割を扱う
  - 企画立案
  - アンケート設計
  - 参加者募集
  - 役割分担
  - コンテンツ設計
  - 資料作成
  - 進行・ディレクション
- Designページでは制作物を見せ、Planning & Directionでは企画全体と担当範囲を見せる

### Writing

- 書斎の世界観で構成する

### Lab

- 実験室・研究ログの世界観で構成する

### Contact

- Contactへの導線を担う

## 4. ページごとの世界観

| ページ | 世界観・デザインコンセプト |
| --- | --- |
| Home | カテゴリへの入口 |
| About | 考え方と制作スタイルを読みやすく伝える構成 |
| Web Apps | 作業机・日常の課題解決 |
| Websites | 情報設計・読みやすさ |
| Design | ギャラリー |
| Development | 研究室・設計室 |
| Planning & Direction | 企画会議室 |
| Writing | 書斎 |
| Lab | 実験室・研究ログ |

ページごとに見た目を変える一方、次の要素は共通化する。

- ヘッダー
- フッター
- 基本配色
- フォント体系
- ボタン
- フォーカス表示
- レスポンシブ基準

## 5. Developmentページの方向性

Developmentページは、開発者としてのポートフォリオです。「どんな開発をしてきたか」「どんな考え方で開発しているか」を伝えます。

### Web App Template v1.0

個人開発を素早く始めるための共通開発基盤として掲載する。

掲載内容は次のとおり。

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- GitHub Template Repository
- GitHub Actions
- Xserver自動デプロイ
- 共通フォルダ構成

## 6. Designページのタグ設計

- Design作品はJSONで管理する
- 各作品の`visible`、`featured`、`order`、`series`を維持する
- 将来、タグ検索・タグ絞り込みへ対応する
- タグ検索・タグ絞り込みを追加しやすいデータ構造を維持する
- タグの正式な分類軸と検索仕様は未決定とする

## 7. Tiny Experimentsとの住み分け

- Tiny Experimentsは構想中として扱う
- Labとの詳細な役割分担は未決定とする

## 8. 制作原則

今後は、各要素について次の理由を説明できる状態を目指す。

- なぜこのフォントなのか
- なぜこの色なのか
- なぜこの余白なのか
- なぜこの順番なのか
- なぜここにこの要素があるのか
- 誰に向けたページなのか

「なんとなく」で決めない。

詳細な確認項目は[`design-principles.md`](design-principles.md)に記載する。

## 9. 改善タスク

- スマホヘッダーをハンバーガー式の左スライドメニューへ変更する
- スマホの見出し・改行・余白崩れを修正する
- Web App TemplateをDevelopmentへ追加する
- Planning & Directionページを作成する
- Writingページを書斎の世界観で作成する
- Labページを実験室の世界観で作成する
- 全ページのフォント・余白・改行を見直す

## 10. 開発ルール

### コンテンツ

- 実ファイルや既存情報で確認できる内容だけを掲載する
- 架空の作品、機能、成果数値、使用技術を追加しない
- 未作成ページには架空URLを設定せず、「準備中」として扱う
- 既存の画像、Demo、GitHub、メールなどのリンクを壊さない

### 構造とデザイン

- ページごとの目的と世界観に合わせて見せ方を変える
- 共通化対象は、ヘッダー、フッター、基本配色、フォント体系、ボタン、フォーカス表示、レスポンシブ基準とする
- 相対パスを使用する
- 見出し階層を適切にする
- Homeは全作品一覧ではなく、各カテゴリへの入口として保つ
- 制作前に対象ユーザー、目的、情報の順序とデザインの理由を確認する

### アクセシビリティとレスポンシブ

- スキップリンクを設ける
- 現在ページに`aria-current="page"`を設定する
- キーボードフォーカスを視認できるようにする
- `prefers-reduced-motion`へ対応する
- PC、タブレット、390px幅で確認する
- 横方向のはみ出しを発生させない

### Gitと確認

- 公開中の`main`を直接変更せず、`portfolio-v2`で作業する
- 変更後に`git diff --check`を実行する
- commit・pushは、作業指示に含まれる場合だけ実行する
