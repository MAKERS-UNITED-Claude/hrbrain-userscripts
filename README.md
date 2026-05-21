# HRBrain Userscripts

iPad / iPhone の Safari で [HRBrain Tripath](https://tripath.evaluation.hrbrain.jp) のレイアウト崩れを補正するための userscript / userstyle 集。

主に **iPad 6 世代等の古い iPadOS Safari** で発生するレイアウト崩れを直すためのものです。iPad 9 世代以降や PC 版 Safari / Chrome では既に問題なく表示されているので、適用しなくても OK です。

## ファイル一覧

| ファイル | 種類 | 役割 |
|---|---|---|
| `HRBrain-Fix-Loader.js` | UserScript（推奨） | GitHub から最新の `HRBrain-Fix.js` を取得して実行する薄い loader |
| `HRBrain-Fix.js` | UserScript | 修正ロジック本体（loader が裏で取りに行く先） |

**配布の運用**：エンドユーザーは `HRBrain-Fix-Loader.js` を 1 回だけ iPad にインストールします。以降は GitHub の `HRBrain-Fix.js` を更新 → push するだけで、全ユーザーに自動配布されます（次回ページ読込時から反映）。Loader は仕組み上ほぼ変更する必要がありません。

## `HRBrain-Fix.js` が直すもの

- **シート編集ページ（`#/customize_usersheets/...`）の KPI 評価表 / スキル評価表**で、行が `100dvh`（≒1003px）に膨れ上がるバグ
- **自己PR / ミッション / 備考の textarea** を内容の行数に合わせて自動リサイズ（旧版は 200px に固定キャップしていたため入力量が増えると枠からあふれる問題があった。`scrollHeight` 追従、上限 800px の安全弁付き）
- 古い Safari の `position: sticky` 二重描画バグ
- 1280px 固定幅レイアウトを iPad で正しく縮小フィットさせる viewport 設定

クラス名（styled-components の `sc-XXX` ハッシュ）には依存せず、**バグの症状そのもの**（`grid-template-rows` に異常値が含まれる grid を検出する等）で判定するため、HRBrain 側のデプロイで効力を失いません。

適用範囲は **`#/customize_usersheets/...` ページのみ**に限定されています。

## インストール手順（iPad / iPhone）

### 1. Userscripts アプリの準備（初回のみ）

1. App Store から **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)**（Justin Wasack 作、無料・OSS）をインストール
2. **設定 > Safari > 機能拡張 > Userscripts** を ON
3. Userscripts アプリを開いて、スクリプトを置くディレクトリを設定（iCloud Drive 推奨）

### 2. Loader をインストール

Safari で以下の raw URL を開く：

```
https://raw.githubusercontent.com/MAKERS-UNITED-Claude/hrbrain-userscripts/main/HRBrain-Fix-Loader.js
```

ソースコードがテキスト表示されたら、**共有ボタン → 「ファイルに保存」** を押し、Userscripts のディレクトリに `HRBrain-Fix-Loader.js` という名前で保存します。

> 「ファイルに保存」が出てこないときは、ページを長押し → 「すべて選択」→「コピー」してから、Userscripts アプリで「+」→「New JavaScript」を選び、ペーストして保存してください。

### 3. 有効化

1. Userscripts アプリを開いて `HRBrain-Fix-Loader.js` のトグルを ON（緑）
2. Safari で `https://tripath.evaluation.hrbrain.jp/#/customize_usersheets/...` にアクセス
3. アドレスバーの「ぁあ」→ 機能拡張 → Userscripts で**このサイトを許可**

### Raw URL 一覧

**推奨（loader 経由・自動更新）**:
```
https://raw.githubusercontent.com/MAKERS-UNITED-Claude/hrbrain-userscripts/main/HRBrain-Fix-Loader.js
```

**直接インストール（手動更新）**:
```
https://raw.githubusercontent.com/MAKERS-UNITED-Claude/hrbrain-userscripts/main/HRBrain-Fix.js
```

### 更新方法

- **Loader 経由でインストールしている場合**：何もしなくて OK。GitHub の `HRBrain-Fix.js` を編集して push すれば、各ユーザーの次回ページ読込時から自動的に新版が適用されます（仕組み：localStorage にキャッシュした前回コードを即実行 → 裏で最新版を fetch → 次回起動から反映）。
- **直接インストールの場合**：raw URL から `.js` ファイルを再ダウンロードして上書きするか、Userscripts アプリ内で再インストールしてください。

## トラブルシューティング

- **iPad 9 世代等で、適用しても何も変わらない** → 仕様通り。元から崩れていないページでは何もしません。
- **自己PR / ミッション / 備考の入力枠の最大サイズを変えたい** → `HRBrain-Fix.js` 内の定数 `TEXTAREA_MIN_PX` / `TEXTAREA_MAX_PX` を好みの値に調整してください（既定: min 120 / max 800）。`TEXTAREA_MAX_PX` は古い Safari のバグ由来の異常膨張を防ぐ安全弁です。

## 開発メモ

- iPad 6 portrait（CSS 幅 768px）で `100dvh` ≒ 1003px となるのを症状判定の指紋として利用
- React + styled-components で組まれた SPA なので、`MutationObserver` で動的描画への追従が必要
- 適用は `#/customize_usersheets/...` パスにのみ限定（hash routing なので JS 側で `location.hash` を見て判定。`@match` は hash にマッチできない仕様のため）
