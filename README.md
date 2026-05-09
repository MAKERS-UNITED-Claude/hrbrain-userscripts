# HRBrain Userscripts

iPad / iPhone の Safari で [HRBrain Tripath](https://tripath.evaluation.hrbrain.jp) のレイアウト崩れを補正するための userscript / userstyle 集。

主に **iPad 6 世代等の古い iPadOS Safari** で発生するレイアウト崩れを直すためのものです。iPad 9 世代以降や PC 版 Safari / Chrome では既に問題なく表示されているので、適用しなくても OK です。

## ファイル一覧

| ファイル | 種類 | 役割 |
|---|---|---|
| `HRBrain-Fix.js` | UserScript | 本体。レイアウト崩れの修正ロジック |

## `HRBrain-Fix.js` が直すもの

- **シート編集ページ（`#/customize_usersheets/...`）の KPI 評価表 / スキル評価表**で、行が `100dvh`（≒1003px）に膨れ上がるバグ
- **ミッション / 備考の textarea セクション**が画面の高さいっぱいに広がるバグ
- 古い Safari の `position: sticky` 二重描画バグ
- 1280px 固定幅レイアウトを iPad で正しく縮小フィットさせる viewport 設定

クラス名（styled-components の `sc-XXX` ハッシュ）には依存せず、**バグの症状そのもの**（`grid-template-rows` に異常値が含まれる grid を検出する等）で判定するため、HRBrain 側のデプロイで効力を失いません。

適用範囲は **`#/customize_usersheets/...` ページのみ**に限定されています。

## インストール手順（iPad / iPhone）

1. App Store から **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)**（Justin Wasack 作、無料・OSS）をインストール
2. **設定 > Safari > 機能拡張 > Userscripts** を ON
3. Safari でこのページのファイル（例：`HRBrain-Fix.js`）を開き、「Raw」ボタンを押す
4. URL バーの URL をコピー
5. Userscripts アプリを開き、**「+」→「New Remote」**をタップ
6. コピーした URL を貼り付けて保存
7. Safari で `https://tripath.evaluation.hrbrain.jp/` にアクセス → アドレスバー左の「ぁあ」→ 機能拡張 → Userscripts でこのスクリプトを **enable**

### Raw URL（直接コピー用）

```
https://raw.githubusercontent.com/MAKERS-UNITED-Claude/hrbrain-userscripts/main/HRBrain-Fix.js
```

### 更新方法

スクリプトに修正があったときは Userscripts アプリの該当スクリプトの **Update** ボタンを押すだけで最新版に置き換わります。

## トラブルシューティング

- **iPad 9 世代等で、適用しても何も変わらない** → 仕様通り。元から崩れていないページでは何もしません。
- **ミッション / 備考が小さくなりすぎる** → `HRBrain-Fix.js` 内の `capTextareaAncestors` 関数の `'200px'` / `'250px'` を好みの値に調整してください。

## 開発メモ

- iPad 6 portrait（CSS 幅 768px）で `100dvh` ≒ 1003px となるのを症状判定の指紋として利用
- React + styled-components で組まれた SPA なので、`MutationObserver` で動的描画への追従が必要
- 適用は `#/customize_usersheets/...` パスにのみ限定（hash routing なので JS 側で `location.hash` を見て判定。`@match` は hash にマッチできない仕様のため）
