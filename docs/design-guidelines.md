# Design Page Guidelines

## 1. Designページの目的

Photoshop、Illustrator、Canvaなどを使用したデザインを、用途や目的に合わせた配色・余白・構成とともに紹介するページです。

Web AppsやWebsitesのようなケーススタディ中心のページにはせず、制作物を見て選べるカテゴリ入口とギャラリーを提供します。

## 2. ギャラリー中心の構成

- 画像を主役にする
- 見出しや説明文を大きくしすぎない
- 作品説明は短くする
- 実在する画像だけを使用する
- 画像が不足する場合は、架空作品で枠を埋めない
- 画像比率が異なっても崩れにくい構造にする
- クリック拡大は、安全に追加できる場合だけ対応する

Designページの基本構成は次のとおりです。

1. ページタイトル・短い導入
2. Design Categories
3. Featured Works
4. Design Approach
5. Tools
6. CTA

## 3. フォルダ構成

確定している画像保存先は次のとおりです。

```text
img/
└── design-works/
    ├── adobe/
    └── canva/
```

- Adobe作品は`img/design-works/adobe/`へ保存する
- Canva作品は`img/design-works/canva/`へ保存する
- Designページには、この配下に実在する画像だけを掲載する
- Logo / SNS Design用の保存先は未決定

## 4. タグ設計

将来のタグ検索・タグ絞り込みに対応できる構造にします。

現在のカテゴリ区分は次のとおりです。

- Photoshop
- Illustrator
- Canva
- Logo / SNS Design

タグの正式な名称、分類軸、複数タグの扱い、HTML属性、JSONの項目名は未決定です。カテゴリ区分と検索タグを同一にするかどうかも未決定です。

## 5. 今後追加予定の機能

### タグ検索

作品に設定したタグを検索できるようにする予定です。検索対象と入力仕様は未決定です。

### タグ絞り込み

タグを選択して作品を絞り込めるようにする予定です。複数選択時の動作は未決定です。

### JSON管理

作品数が増えた段階で、作品情報をJSONで管理することを検討します。JSONのスキーマと移行時期は未決定です。

## 6. デザイン方針

- サイト共通のヘッダー、フッター、基本配色、フォント、余白ルールを維持する
- Design固有の見せ方は、展示室・ポートフォリオギャラリーのような軽い雰囲気とする
- Aboutのような左右分割の巨大見出しは使用しない
- Web Apps、Websitesのケーススタディ型レイアウトをそのまま流用しない
- Photoshop、Illustrator、Canvaは説明と使用ツールを分けて表示する
- PhotoshopとIllustratorは同じ`adobe-works.html`へ接続する
- Canvaは`canva-works.html`へ接続する
- Logo / SNS Designは独立ページができるまで架空URLを設定しない
- Design Approachは短いキーワードまたは小さなカードで表示する
- 使用ツールは実績を確認できるものだけ掲載する
- PC、タブレット、390px幅に対応する
- キーボードフォーカスと`prefers-reduced-motion`へ対応する
