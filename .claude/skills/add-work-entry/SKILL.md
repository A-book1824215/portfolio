---
name: add-work-entry
description: portfolioサイトのworks.html（実績ページ）に新しい制作実績を追加するときに使う。「実績を追加して」「works.htmlに新しい仕事を載せて」「サイトに新しい実績を反映して」「ポートフォリオに載せて」といった指示のときに使う。既存の台帳グリッド調デザイン（.workカード形式）の書き方・トーンを踏襲して追加し、Playwright MCPで見た目を確認してから公開する手順まで含む。
---

## カードのテンプレート

`works.html` の `<section>` 内、`.work` divが実績1件ぶんの単位。この形をそのまま踏襲する:

```html
<div class="work">
  <h3>{{実績のタイトル}}</h3>
  <div class="tags"><span>{{技術1}}</span><span>{{技術2}}</span><span>{{任意: 公開中 など}}</span></div>
  <p>
    {{何のためのシステム/ツールか。誰の・どんな困りごとを解決したかを2〜3文で}}
  </p>
  <a class="link" href="{{デモページのURL}}">→ 実際に動くツールを試す</a>
</div>
```

- `<a class="link">` は、CSV整形ツールやQRツールのように実際に触れるデモページがある場合だけ入れる。デモがない場合は省略する（寮費管理システムや売上・日報集計の実績を参照）。
- タグは2〜3個。技術名（JavaScript, Python, Streamlit など）＋ 状態（公開中 など）の組み合わせが既存パターン。
- 文章のトーンは既存のカードに合わせる: 専門用語より「何ができるか」「誰が助かるか」を先に書く。データを扱うツールでは「サーバーに送信されない」のような安心材料があれば触れる。

## 挿入位置

既存カードは新しいもの・目立たせたいものが上に来る並び。特に指示がなければ `<section>` の一番上（最初の`.work`の前）に追加する。位置の希望があればそれに従う。

## 追加後の確認手順

portfolioはHTML/CSS/JSのみの静的サイト。claude-in-chrome拡張はlocalhostに権限がなく使えないため、**Playwright MCP**で確認する:

1. PowerShellでローカルサーバーを起動する（Bashの`&`はシェル終了で死ぬので使わない）。`-PassThru`でPIDを控えておくと後で止めやすい:
   ```powershell
   Start-Process -WindowStyle Hidden python -ArgumentList "-m","http.server","8000" -WorkingDirectory "C:\dev\portfolio" -PassThru | Select-Object Id
   ```
2. `mcp__plugin_playwright_playwright__browser_navigate` で `http://localhost:8000/works.html` を開く
3. `browser_take_screenshot` で新しいカードが崩れず表示されているか確認（配色・フォント・カード間の余白）
   - スクリーンショットとログは**カレントディレクトリ**（通常 `C:\dev`）に `works-*.png` と `.playwright-mcp\` として出力される。portfolio配下ではないので、確認後に忘れず削除する
   - 読み込み時の `favicon.ico` 404 コンソールエラーは既知・無害（ローカルサーバーのみ）
4. 確認後、PIDを指定して `Stop-Process` でサーバーを止め、上記の一時ファイルも削除する
5. CSSを一緒に変更した場合はブラウザキャッシュに注意（`style.css?v=2` のようにクエリを付けてキャッシュバストする）

## 注意点

`tools.html` / `game.html` / `minesweeper.html` のJSはHTML側のid・class名に依存している。works.htmlへの実績追加自体はこれらに影響しないが、他ページを一緒に触る場合はid・classを変えないこと。
