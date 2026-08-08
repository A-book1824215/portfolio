# IME顔文字・絵文字辞書メーカー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portfolioサイトに `ime-dict.html` を追加し、カテゴリ・種類・形式を選んでIMEユーザー辞書ファイル（MS-IME用UTF-16LE / Google日本語入力用UTF-8）をその場で生成・ダウンロードできるツールにする。

**Architecture:** 既存の `qr.html`/`qr.js` と同じ1ページ1JSの静的サイト構成。語彙データ（193件）を `ime-dict.js` 先頭に配列で持ち、チェックボックス/ラジオの選択状態から `Array.filter` で絞り込み、テキストを組み立てて `Blob` + `<a download>` でファイル化する。サーバー処理・外部データ取得なし。

**Tech Stack:** 素のHTML/CSS/JavaScript（フレームワーク・ビルドツールなし）。既存の `style.css` を拡張。動作確認はPlaywright MCP（ブラウザ操作・ダウンロードファイルのバイト検証）、純粋関数の検証はNode.js（`node -v` で v24.16.0 を確認済み。リポジトリに package.json は無く、今回も追加しない）。

## Global Constraints

- フレームワーク・ビルドツール・npm依存を追加しない（既存サイトが素のHTML/CSS/JSのみのため）
- 新規ページは既存の `qr.html`/`tools.html` と同じヘッダー・フッター・`skip-nav`・`<main id="main-content">` 構成に従う
- 新しい配色・フォントは追加しない（既存CSS変数のみ使用）
- 語彙データは193件、全件を欠落・改変なく `ime-dict.js` に移植する（読み・変換文字は `C:\dev\ime-emoji-dict\ime_emoji_dict.txt` の内容を正とする）
- 品詞は出力時に全件固定で `顔文字` とする
- ダウンロードファイルはMS-IME用がUTF-16LE（BOM付き）、Google日本語入力用がUTF-8

---

## File Structure

- Create: `ime-dict.js` — 語彙データ・カテゴリ定義・絞り込み/エンコード関数（Task 1）＋ UI操作（Task 3）
- Create: `ime-dict.html` — ページ本体（Task 2）
- Modify: `style.css` — fieldset/legend・カテゴリチェックボックスのスタイル追加（Task 2）
- Modify: `works.html` — 既存の実績カードにデモリンクを追加（Task 5）
- Modify: `README.md` — ページ構成表にツールを追記（Task 5）

---

### Task 1: 語彙データと純粋ロジック（ime-dict.js の前半）

**Files:**
- Create: `ime-dict.js`

**Interfaces:**
- Produces: `DICT`（配列。各要素 `{ yomi: string, word: string, type: "emoji"|"kaomoji", cat: string }`）、`CATEGORIES`（配列。各要素 `{ key: string, label: string }`）、`filterEntries(entries, cats, type)`（`cats`: 選択中カテゴリkeyの配列、`type`: `"both"|"emoji"|"kaomoji"`。戻り値: `DICT` と同じ形の配列）、`buildTsv(entries)`（戻り値: string）、`toUtf16LEBytes(str)`（戻り値: `Uint8Array`。先頭2バイトがBOM `0xFF,0xFE`）

- [ ] **Step 1: 純粋関数の失敗するテストを書く**

`_verify_encoder.mjs` という一時ファイルをリポジトリ直下に作成する（コミットしない検証用ファイル）:

```js
// _verify_encoder.mjs （一時ファイル・コミットしない）
const bytes = toUtf16LEBytes("A");
console.log("test ran");
```

- [ ] **Step 2: 実行して失敗を確認する**

Run: `node C:/dev/portfolio/_verify_encoder.mjs`
Expected: `ReferenceError: toUtf16LEBytes is not defined` で終了（exit code 1）

- [ ] **Step 3: `_verify_encoder.mjs` に実装とアサーションを書く**

ファイル内容を以下に置き換える（このステップで実装本体を書き、検証もこのファイル内で完結させる）:

```js
// _verify_encoder.mjs （一時ファイル・コミットしない）

function toUtf16LEBytes(str) {
  const bytes = new Uint8Array(2 + str.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[2 + i * 2] = code & 0xff;
    bytes[2 + i * 2 + 1] = (code >> 8) & 0xff;
  }
  return bytes;
}

function buildTsv(entries) {
  return entries.map((e) => `${e.yomi}\t${e.word}\t顔文字`).join("\r\n");
}

function filterEntries(entries, cats, type) {
  return entries.filter((e) => {
    if (!cats.includes(e.cat)) return false;
    if (type === "both") return true;
    return e.type === type;
  });
}

// --- アサーション ---
let failures = 0;
function check(label, cond) {
  if (!cond) {
    failures++;
    console.error("FAIL: " + label);
  }
}

// BOMが正しい
const a = toUtf16LEBytes("A");
check("BOM先頭2バイトが FF FE", a[0] === 0xff && a[1] === 0xfe);
check("Aが2バイト(0x41,0x00)で続く", a[2] === 0x41 && a[3] === 0x00);
check("配列長がBOM2 + 文字数*2", a.length === 2 + 1 * 2);

// サロゲートペア（絵文字）を含む文字列が正しく往復できる
const emoji = "😊"; // U+1F60A、UTF-16ではサロゲートペア2コードユニット
const emojiBytes = toUtf16LEBytes(emoji);
const decoded = Buffer.from(emojiBytes.slice(2)).toString("utf16le");
check("絵文字のサロゲートペアが往復一致", decoded === emoji);

// buildTsv: 読み\t単語\t品詞 を \r\n 区切りで結合
const tsv = buildTsv([
  { yomi: "うれしい", word: "😊", type: "emoji", cat: "emotion" },
  { yomi: "たのしい", word: "😄", type: "emoji", cat: "emotion" },
]);
check(
  "buildTsvの出力形式",
  tsv === "うれしい\t😊\t顔文字\r\nたのしい\t😄\t顔文字"
);

// filterEntries: カテゴリと種類で絞り込み
const sample = [
  { yomi: "a", word: "1", type: "emoji", cat: "x" },
  { yomi: "b", word: "2", type: "kaomoji", cat: "x" },
  { yomi: "c", word: "3", type: "emoji", cat: "y" },
];
check(
  "カテゴリxのみ・両方",
  filterEntries(sample, ["x"], "both").length === 2
);
check(
  "カテゴリx・emojiのみ",
  filterEntries(sample, ["x"], "emoji").length === 1
);
check(
  "カテゴリx,y・kaomojiのみ",
  filterEntries(sample, ["x", "y"], "kaomoji").length === 1
);

if (failures > 0) {
  console.error(`${failures}件失敗`);
  process.exit(1);
}
console.log("ALL PASS");
```

- [ ] **Step 4: 実行して成功を確認する**

Run: `node C:/dev/portfolio/_verify_encoder.mjs`
Expected: `ALL PASS`（exit code 0）

- [ ] **Step 5: `ime-dict.js` を作成し、検証済みの関数と全193件のデータを書き込む**

`C:\dev\portfolio\ime-dict.js` を新規作成:

```js
// ================= 語彙データ =================
// 「今後の語彙追加はこの配列に対して行う」— 原本は C:\dev\ime-emoji-dict\ime_emoji_dict.txt
// yomi: IME変換の読み（ひらがな） / word: 変換で出したい絵文字・顔文字
// type: "emoji" | "kaomoji" / cat: カテゴリkey（CATEGORIES参照）

const CATEGORIES = [
  { key: "emotion", label: "感情・気分" },
  { key: "greeting", label: "あいさつ・リアクション" },
  { key: "business", label: "ビジネス・敬語" },
  { key: "nature", label: "天気・季節・自然" },
  { key: "animal", label: "動物" },
  { key: "food", label: "食べ物・飲み物" },
  { key: "health", label: "体調・健康" },
  { key: "event", label: "イベント・趣味・移動" },
  { key: "emphasis", label: "記号・強調" },
];

const DICT = [
  // ---- 感情・気分 (emotion) ----
  { yomi: "うれしい", word: "😊", type: "emoji", cat: "emotion" },
  { yomi: "うれしい", word: "(*^^*)", type: "kaomoji", cat: "emotion" },
  { yomi: "たのしい", word: "😄", type: "emoji", cat: "emotion" },
  { yomi: "たのしい", word: "(^o^)", type: "kaomoji", cat: "emotion" },
  { yomi: "かなしい", word: "😢", type: "emoji", cat: "emotion" },
  { yomi: "かなしい", word: "(T_T)", type: "kaomoji", cat: "emotion" },
  { yomi: "さみしい", word: "😔", type: "emoji", cat: "emotion" },
  { yomi: "さみしい", word: "(´;ω;`)", type: "kaomoji", cat: "emotion" },
  { yomi: "こまった", word: "😅", type: "emoji", cat: "emotion" },
  { yomi: "こまった", word: "(^^;", type: "kaomoji", cat: "emotion" },
  { yomi: "つかれた", word: "😩", type: "emoji", cat: "emotion" },
  { yomi: "つかれた", word: "(-_-)", type: "kaomoji", cat: "emotion" },
  { yomi: "ねむい", word: "😴", type: "emoji", cat: "emotion" },
  { yomi: "ねむい", word: "(-_-)zzz", type: "kaomoji", cat: "emotion" },
  { yomi: "びっくり", word: "😲", type: "emoji", cat: "emotion" },
  { yomi: "びっくり", word: "(゚Д゚)", type: "kaomoji", cat: "emotion" },
  { yomi: "おこる", word: "😠", type: "emoji", cat: "emotion" },
  { yomi: "おこる", word: "(*`ε´*)", type: "kaomoji", cat: "emotion" },
  { yomi: "いらいら", word: "😤", type: "emoji", cat: "emotion" },
  { yomi: "なやむ", word: "🤔", type: "emoji", cat: "emotion" },
  { yomi: "なやむ", word: "(・_・;)", type: "kaomoji", cat: "emotion" },
  { yomi: "なく", word: "😭", type: "emoji", cat: "emotion" },
  { yomi: "なく", word: "(T▽T)", type: "kaomoji", cat: "emotion" },
  { yomi: "わらう", word: "😂", type: "emoji", cat: "emotion" },
  { yomi: "わらう", word: "(^▽^)", type: "kaomoji", cat: "emotion" },
  { yomi: "にこにこ", word: "😊", type: "emoji", cat: "emotion" },
  { yomi: "にこにこ", word: "(*´▽`*)", type: "kaomoji", cat: "emotion" },
  { yomi: "てれる", word: "☺️", type: "emoji", cat: "emotion" },
  { yomi: "てれる", word: "(*ノωノ)", type: "kaomoji", cat: "emotion" },
  { yomi: "あせる", word: "😰", type: "emoji", cat: "emotion" },
  { yomi: "あせる", word: "(;´Д`)", type: "kaomoji", cat: "emotion" },
  { yomi: "ふまん", word: "😒", type: "emoji", cat: "emotion" },
  { yomi: "あんしん", word: "😌", type: "emoji", cat: "emotion" },
  { yomi: "しんぱい", word: "😟", type: "emoji", cat: "emotion" },
  { yomi: "どきどき", word: "💓", type: "emoji", cat: "emotion" },
  { yomi: "わくわく", word: "🤩", type: "emoji", cat: "emotion" },
  { yomi: "きらきら", word: "✨", type: "emoji", cat: "emotion" },
  { yomi: "ぐっすり", word: "😴", type: "emoji", cat: "emotion" },
  { yomi: "だいすき", word: "❤️", type: "emoji", cat: "emotion" },
  { yomi: "だいすき", word: "💕", type: "emoji", cat: "emotion" },
  { yomi: "らぶ", word: "❤️", type: "emoji", cat: "emotion" },
  { yomi: "ふまん", word: "(-“-)", type: "kaomoji", cat: "emotion" },
  { yomi: "あんしん", word: "(*^^*)", type: "kaomoji", cat: "emotion" },
  { yomi: "しんぱい", word: "(´・ω・`)", type: "kaomoji", cat: "emotion" },
  { yomi: "どきどき", word: "(*´∀`*)", type: "kaomoji", cat: "emotion" },
  { yomi: "わくわく", word: "(≧▽≦)", type: "kaomoji", cat: "emotion" },
  { yomi: "きらきら", word: "(*ˊᗜˋ*)", type: "kaomoji", cat: "emotion" },
  { yomi: "ぐっすり", word: "(-_-)zzz", type: "kaomoji", cat: "emotion" },

  // ---- あいさつ・リアクション (greeting) ----
  { yomi: "ありがとう", word: "🙏", type: "emoji", cat: "greeting" },
  { yomi: "ごめん", word: "🙏", type: "emoji", cat: "greeting" },
  { yomi: "ごめん", word: "m(_ _)m", type: "kaomoji", cat: "greeting" },
  { yomi: "おつかれ", word: "🙇", type: "emoji", cat: "greeting" },
  { yomi: "おつかれ", word: "m(_ _)m", type: "kaomoji", cat: "greeting" },
  { yomi: "がんばる", word: "💪", type: "emoji", cat: "greeting" },
  { yomi: "かんぱい", word: "🍻", type: "emoji", cat: "greeting" },
  { yomi: "おめでとう", word: "🎉", type: "emoji", cat: "greeting" },
  { yomi: "おいわい", word: "🎉", type: "emoji", cat: "greeting" },
  { yomi: "りょうかい", word: "👌", type: "emoji", cat: "greeting" },
  { yomi: "いいね", word: "👍", type: "emoji", cat: "greeting" },
  { yomi: "だめ", word: "👎", type: "emoji", cat: "greeting" },
  { yomi: "はてな", word: "❓", type: "emoji", cat: "greeting" },
  { yomi: "おどろき", word: "❗", type: "emoji", cat: "greeting" },
  { yomi: "がんばる", word: "(`・ω・´)", type: "kaomoji", cat: "greeting" },
  { yomi: "りょうかい", word: "(・∀・)", type: "kaomoji", cat: "greeting" },
  { yomi: "いいね", word: "b(^_^)", type: "kaomoji", cat: "greeting" },
  { yomi: "だめ", word: "(>_<)", type: "kaomoji", cat: "greeting" },
  { yomi: "はてな", word: "(・・?", type: "kaomoji", cat: "greeting" },
  { yomi: "おどろき", word: "(゚д゚)", type: "kaomoji", cat: "greeting" },
  { yomi: "ありがとう", word: "m(_ _)m", type: "kaomoji", cat: "greeting" },
  { yomi: "かんぱい", word: "\\(^o^)/", type: "kaomoji", cat: "greeting" },
  { yomi: "おめでとう", word: "\\(^o^)/", type: "kaomoji", cat: "greeting" },
  { yomi: "おいわい", word: "\\(^o^)/", type: "kaomoji", cat: "greeting" },

  // ---- ビジネス・敬語 (business) ----
  { yomi: "しょうちしました", word: "🙆", type: "emoji", cat: "business" },
  { yomi: "かしこまりました", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "よろしく", word: "🙏", type: "emoji", cat: "business" },
  { yomi: "おせわになります", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "かくにん", word: "🔍", type: "emoji", cat: "business" },
  { yomi: "いそがしい", word: "😵", type: "emoji", cat: "business" },
  { yomi: "ひま", word: "😌", type: "emoji", cat: "business" },
  { yomi: "かいぎ", word: "📅", type: "emoji", cat: "business" },
  { yomi: "しめきり", word: "⏰", type: "emoji", cat: "business" },
  { yomi: "だいじょうぶ", word: "👌", type: "emoji", cat: "business" },
  { yomi: "もうしわけございません", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "もうしわけございません", word: "m(_ _)m", type: "kaomoji", cat: "business" },
  { yomi: "たいへんもうしわけありません", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "たいへんもうしわけありません", word: "m(_ _)m", type: "kaomoji", cat: "business" },
  { yomi: "しつれいいたします", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "おまたせしました", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "おまたせしました", word: "m(_ _)m", type: "kaomoji", cat: "business" },
  { yomi: "ごくろうさまです", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "おつかれさまです", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "きょうしゅくです", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "ごめいわくをおかけしました", word: "🙇", type: "emoji", cat: "business" },
  { yomi: "ごめいわくをおかけしました", word: "m(_ _)m", type: "kaomoji", cat: "business" },
  { yomi: "おそれいります", word: "🙏", type: "emoji", cat: "business" },
  { yomi: "うけたまわりました", word: "🙆", type: "emoji", cat: "business" },
  { yomi: "しょうしょうおまちください", word: "⏳", type: "emoji", cat: "business" },
  { yomi: "ごりかいのほど", word: "🙏", type: "emoji", cat: "business" },
  { yomi: "おいそがしいところ", word: "🙏", type: "emoji", cat: "business" },
  { yomi: "よろしくおねがいいたします", word: "🙏", type: "emoji", cat: "business" },
  { yomi: "ごれんらく", word: "📩", type: "emoji", cat: "business" },
  { yomi: "ごへんしん", word: "📩", type: "emoji", cat: "business" },
  { yomi: "いそがしい", word: "(;´Д`)", type: "kaomoji", cat: "business" },
  { yomi: "ひま", word: "(・∀・)", type: "kaomoji", cat: "business" },
  { yomi: "だいじょうぶ", word: "(^_-)-☆", type: "kaomoji", cat: "business" },

  // ---- 天気・季節・自然 (nature) ----
  { yomi: "はれ", word: "☀️", type: "emoji", cat: "nature" },
  { yomi: "あめ", word: "☔", type: "emoji", cat: "nature" },
  { yomi: "ゆき", word: "❄️", type: "emoji", cat: "nature" },
  { yomi: "くもり", word: "☁️", type: "emoji", cat: "nature" },
  { yomi: "はる", word: "🌸", type: "emoji", cat: "nature" },
  { yomi: "なつ", word: "🌻", type: "emoji", cat: "nature" },
  { yomi: "あき", word: "🍁", type: "emoji", cat: "nature" },
  { yomi: "ふゆ", word: "⛄", type: "emoji", cat: "nature" },
  { yomi: "たいふう", word: "🌀", type: "emoji", cat: "nature" },
  { yomi: "つゆ", word: "☔", type: "emoji", cat: "nature" },
  { yomi: "あさ", word: "🌅", type: "emoji", cat: "nature" },
  { yomi: "ひる", word: "🌞", type: "emoji", cat: "nature" },
  { yomi: "よる", word: "🌙", type: "emoji", cat: "nature" },
  { yomi: "しんや", word: "🌃", type: "emoji", cat: "nature" },
  { yomi: "そら", word: "🌤️", type: "emoji", cat: "nature" },
  { yomi: "つき", word: "🌕", type: "emoji", cat: "nature" },
  { yomi: "ほし", word: "🌟", type: "emoji", cat: "nature" },
  { yomi: "うみ", word: "🌊", type: "emoji", cat: "nature" },
  { yomi: "やま", word: "⛰️", type: "emoji", cat: "nature" },

  // ---- 動物 (animal) ----
  { yomi: "いぬ", word: "🐶", type: "emoji", cat: "animal" },
  { yomi: "ねこ", word: "🐱", type: "emoji", cat: "animal" },
  { yomi: "うさぎ", word: "🐰", type: "emoji", cat: "animal" },
  { yomi: "ぱんだ", word: "🐼", type: "emoji", cat: "animal" },
  { yomi: "とり", word: "🐦", type: "emoji", cat: "animal" },
  { yomi: "さかな", word: "🐟", type: "emoji", cat: "animal" },
  { yomi: "くま", word: "🐻", type: "emoji", cat: "animal" },
  { yomi: "ぞう", word: "🐘", type: "emoji", cat: "animal" },
  { yomi: "ねこ", word: "(=^・ω・^=)", type: "kaomoji", cat: "animal" },
  { yomi: "いぬ", word: "U・ᴥ・U", type: "kaomoji", cat: "animal" },
  { yomi: "うさぎ", word: "(U^ω^)", type: "kaomoji", cat: "animal" },
  { yomi: "くま", word: "( ˘ω˘ )", type: "kaomoji", cat: "animal" },
  { yomi: "ぱんだ", word: "(・ω・)", type: "kaomoji", cat: "animal" },

  // ---- 食べ物・飲み物 (food) ----
  { yomi: "ぱん", word: "🍞", type: "emoji", cat: "food" },
  { yomi: "らーめん", word: "🍜", type: "emoji", cat: "food" },
  { yomi: "けーき", word: "🍰", type: "emoji", cat: "food" },
  { yomi: "こーひー", word: "☕", type: "emoji", cat: "food" },
  { yomi: "びーる", word: "🍺", type: "emoji", cat: "food" },
  { yomi: "すし", word: "🍣", type: "emoji", cat: "food" },
  { yomi: "ぴざ", word: "🍕", type: "emoji", cat: "food" },
  { yomi: "あいす", word: "🍦", type: "emoji", cat: "food" },
  { yomi: "やさい", word: "🥦", type: "emoji", cat: "food" },
  { yomi: "くだもの", word: "🍎", type: "emoji", cat: "food" },

  // ---- 体調・健康 (health) ----
  { yomi: "げんき", word: "😃", type: "emoji", cat: "health" },
  { yomi: "びょうき", word: "🤒", type: "emoji", cat: "health" },
  { yomi: "あつい", word: "🥵", type: "emoji", cat: "health" },
  { yomi: "さむい", word: "🥶", type: "emoji", cat: "health" },
  { yomi: "おいしい", word: "😋", type: "emoji", cat: "health" },
  { yomi: "ないしょ", word: "🤫", type: "emoji", cat: "health" },
  { yomi: "ひみつ", word: "🤫", type: "emoji", cat: "health" },
  { yomi: "いたい", word: "😣", type: "emoji", cat: "health" },
  { yomi: "けが", word: "🩹", type: "emoji", cat: "health" },
  { yomi: "ねつ", word: "🤒", type: "emoji", cat: "health" },
  { yomi: "いたい", word: "(>_<)", type: "kaomoji", cat: "health" },
  { yomi: "けが", word: "(´;ω;`)", type: "kaomoji", cat: "health" },
  { yomi: "げんき", word: "(^o^)", type: "kaomoji", cat: "health" },
  { yomi: "びょうき", word: "(´д`)", type: "kaomoji", cat: "health" },
  { yomi: "あつい", word: "(´Д`;)", type: "kaomoji", cat: "health" },
  { yomi: "さむい", word: "(((( ;゚Д゚)))", type: "kaomoji", cat: "health" },
  { yomi: "おいしい", word: "(^q^)", type: "kaomoji", cat: "health" },
  { yomi: "ないしょ", word: "(・ω・)", type: "kaomoji", cat: "health" },
  { yomi: "ひみつ", word: "(-ω-)", type: "kaomoji", cat: "health" },

  // ---- イベント・趣味・移動 (event) ----
  { yomi: "たんじょうび", word: "🎂", type: "emoji", cat: "event" },
  { yomi: "くりすます", word: "🎄", type: "emoji", cat: "event" },
  { yomi: "しんねん", word: "🎍", type: "emoji", cat: "event" },
  { yomi: "はなび", word: "🎆", type: "emoji", cat: "event" },
  { yomi: "さっかー", word: "⚽", type: "emoji", cat: "event" },
  { yomi: "やきゅう", word: "⚾", type: "emoji", cat: "event" },
  { yomi: "おんがく", word: "🎵", type: "emoji", cat: "event" },
  { yomi: "ほん", word: "📖", type: "emoji", cat: "event" },
  { yomi: "えいが", word: "🎬", type: "emoji", cat: "event" },
  { yomi: "げーむ", word: "🎮", type: "emoji", cat: "event" },
  { yomi: "くるま", word: "🚗", type: "emoji", cat: "event" },
  { yomi: "でんしゃ", word: "🚃", type: "emoji", cat: "event" },
  { yomi: "ひこうき", word: "✈️", type: "emoji", cat: "event" },
  { yomi: "あるく", word: "🚶", type: "emoji", cat: "event" },
  { yomi: "おかね", word: "💰", type: "emoji", cat: "event" },
  { yomi: "かいもの", word: "🛒", type: "emoji", cat: "event" },
  { yomi: "たんじょうび", word: "\\(^o^)/", type: "kaomoji", cat: "event" },
  { yomi: "くりすます", word: "\\(^o^)/", type: "kaomoji", cat: "event" },

  // ---- 記号・強調 (emphasis) ----
  { yomi: "だいじ", word: "❗", type: "emoji", cat: "emphasis" },
  { yomi: "ちゅうい", word: "⚠️", type: "emoji", cat: "emphasis" },
  { yomi: "おすすめ", word: "⭐", type: "emoji", cat: "emphasis" },
  { yomi: "さいこう", word: "💯", type: "emoji", cat: "emphasis" },
  { yomi: "きけん", word: "☠️", type: "emoji", cat: "emphasis" },
  { yomi: "さいこう", word: "\\(^o^)/", type: "kaomoji", cat: "emphasis" },
  { yomi: "だいじ", word: "(`・ω・´)", type: "kaomoji", cat: "emphasis" },
  { yomi: "きけん", word: "(゚Д゚;)", type: "kaomoji", cat: "emphasis" },
  { yomi: "おすすめ", word: "(σ・∀・)σ", type: "kaomoji", cat: "emphasis" },
];

// ================= 純粋関数 =================

function toUtf16LEBytes(str) {
  const bytes = new Uint8Array(2 + str.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[2 + i * 2] = code & 0xff;
    bytes[2 + i * 2 + 1] = (code >> 8) & 0xff;
  }
  return bytes;
}

function buildTsv(entries) {
  return entries.map((e) => `${e.yomi}\t${e.word}\t顔文字`).join("\r\n");
}

function filterEntries(entries, cats, type) {
  return entries.filter((e) => {
    if (!cats.includes(e.cat)) return false;
    if (type === "both") return true;
    return e.type === type;
  });
}
```

- [ ] **Step 6: データ件数を検証する**

`_verify_encoder.mjs` の内容を、`ime-dict.js` から `DICT` を読み込んで件数を検証する内容に置き換える。`ime-dict.js` は `const` 宣言のみで `module.exports` が無いため、`fs`で読み込んで `eval` する:

```js
// _verify_encoder.mjs （一時ファイル・コミットしない）
import { readFileSync } from "node:fs";

const code = readFileSync("C:/dev/portfolio/ime-dict.js", "utf8");
eval(code);

let failures = 0;
function check(label, cond) {
  if (!cond) {
    failures++;
    console.error("FAIL: " + label);
  }
}

check("総件数が193件", DICT.length === 193);

const expectedByCat = {
  emotion: 48,
  greeting: 24,
  business: 33,
  nature: 19,
  animal: 13,
  food: 10,
  health: 19,
  event: 18,
  emphasis: 9,
};
for (const [cat, expected] of Object.entries(expectedByCat)) {
  const actual = DICT.filter((e) => e.cat === cat).length;
  check(`カテゴリ ${cat} が${expected}件`, actual === expected);
}

check("CATEGORIESが9件", CATEGORIES.length === 9);
check(
  "全カテゴリkeyがCATEGORIESに存在する",
  DICT.every((e) => CATEGORIES.some((c) => c.key === e.cat))
);

const emojiCount = DICT.filter((e) => e.type === "emoji").length;
const kaomojiCount = DICT.filter((e) => e.type === "kaomoji").length;
check("emoji件数が132件", emojiCount === 132);
check("kaomoji件数が61件", kaomojiCount === 61);
check("emoji+kaomoji=193件", emojiCount + kaomojiCount === 193);

check(
  "yomiが空文字の要素が無い",
  DICT.every((e) => typeof e.yomi === "string" && e.yomi.length > 0)
);
check(
  "wordが空文字の要素が無い",
  DICT.every((e) => typeof e.word === "string" && e.word.length > 0)
);

if (failures > 0) {
  console.error(`${failures}件失敗`);
  process.exit(1);
}
console.log("ALL PASS");
```

- [ ] **Step 7: 実行して成功を確認する**

Run: `node C:/dev/portfolio/_verify_encoder.mjs`
Expected: `ALL PASS`（失敗があれば該当カテゴリの誤分類や転記ミスなので、`ime-dict.js` の該当行を修正して再実行する）

- [ ] **Step 8: 一時ファイルを削除してコミット**

```bash
rm C:/dev/portfolio/_verify_encoder.mjs
cd C:/dev/portfolio
git add ime-dict.js
git commit -m "feat: IME辞書メーカーの語彙データと絞り込み・エンコード関数を追加"
```

---

### Task 2: ページ骨格とスタイル（ime-dict.html / style.css）

**Files:**
- Create: `ime-dict.html`
- Modify: `style.css:551-565`（既存セレクタ拡張）、`style.css` 末尾（新規ルール追加）

**Interfaces:**
- Consumes: なし（Task 1の `ime-dict.js` は `<script>` タグで読み込むが、この時点ではDOM操作コードが無いため実行時エラーは起きない）
- Produces: DOM要素ID群 — `category-list`（div）、`select-all-btn`／`deselect-all-btn`（button）、`dict-count`（p）、`dict-preview-body`（tbody）、`dict-download`（button）、`dict-error`（section, hidden）、`instructions-msime`／`instructions-google`（div）。Task 3はこれらのIDを使ってDOM操作する。

- [ ] **Step 1: style.css の既存セレクタを拡張する**

`C:\dev\portfolio\style.css:551-565` を以下に置き換える:

```css
.option-row label,
.column-picker label,
#category-list label {
  font-family: var(--font-body);
  font-size: 0.95rem;
  cursor: pointer;
}

.option-row input[type="checkbox"],
.option-row input[type="radio"],
.column-picker input[type="checkbox"],
#category-list input[type="checkbox"] {
  width: 1.1rem;
  height: 1.1rem;
  margin-right: 0.4rem;
  vertical-align: -0.15rem;
  accent-color: var(--accent);
}
```

- [ ] **Step 2: style.css 末尾にIME辞書メーカー用のルールを追加する**

`C:\dev\portfolio\style.css` の末尾（878行目以降）に追記:

```css

/* IME辞書メーカー */
fieldset.option-group {
  border: none;
  padding: 0;
  margin: 0 0 1.2rem;
}

fieldset.option-group legend {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink);
  padding: 0;
  margin-bottom: 0.6rem;
}

#category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.4rem;
  margin-bottom: 0.8rem;
}
```

- [ ] **Step 3: `ime-dict.html` を作成する**

`C:\dev\portfolio\ime-dict.html` を新規作成:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IME顔文字・絵文字辞書メーカー | Neoyuki Dev</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700&family=Zen+Maru+Gothic:wght@400;500&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip-nav" href="#main-content">メインコンテンツへスキップ</a>
<header>
  <div class="logo">Neoyuki Dev</div>
  <nav>
    <a href="index.html">トップ</a>
    <a href="works.html">実績</a>
    <a href="tools.html" class="active">ツール</a>
    <a href="game.html">ゲーム</a>
  </nav>
</header>

<main id="main-content">
  <section class="hero hero-center" style="padding-top:1rem">
    <p class="cell-tag">SHEET 07 — IME辞書作成</p>
    <h1>IME顔文字・絵文字辞書メーカー</h1>
    <p class="lead">
      「うれしい」「もうしわけございません」のように感情や挨拶をそのまま入力すると、
      対応する絵文字・顔文字が変換候補に出るIMEユーザー辞書を作成できます。
      すべてブラウザ内で処理され、<strong>入力内容はサーバーには送信されません</strong>。
    </p>
  </section>

  <section class="tool-panel">
    <h2>1. 収録する内容を選ぶ</h2>
    <fieldset class="option-group">
      <legend>カテゴリ</legend>
      <div id="category-list"></div>
      <div class="result-actions">
        <button type="button" class="cta cta-sub" id="select-all-btn">すべて選択</button>
        <button type="button" class="cta cta-sub" id="deselect-all-btn">すべて解除</button>
      </div>
    </fieldset>
    <fieldset class="option-group">
      <legend>種類</legend>
      <div class="option-row">
        <label><input type="radio" name="dict-type" value="both" checked> 両方</label>
        <label><input type="radio" name="dict-type" value="emoji"> 絵文字のみ</label>
        <label><input type="radio" name="dict-type" value="kaomoji"> 顔文字のみ</label>
      </div>
    </fieldset>
    <p class="stats" id="dict-count" role="status"></p>
  </section>

  <section class="tool-panel">
    <h2>2. 形式を選んでダウンロード</h2>
    <fieldset class="option-group">
      <legend>形式</legend>
      <div class="option-row">
        <label><input type="radio" name="dict-format" value="msime" checked> MS-IME用（UTF-16LE・BOM付き）</label>
        <label><input type="radio" name="dict-format" value="google"> Google日本語入力用（UTF-8）</label>
      </div>
    </fieldset>
    <div class="column-picker">
      <p class="picker-note">プレビュー（先頭10件）</p>
      <div class="table-scroll">
        <table class="preview-table" id="dict-preview">
          <thead><tr><th>読み</th><th>変換される文字</th></tr></thead>
          <tbody id="dict-preview-body"></tbody>
        </table>
      </div>
    </div>
    <div class="result-actions">
      <button type="button" class="cta" id="dict-download">ファイルをダウンロード</button>
    </div>
  </section>

  <section class="tool-panel" id="dict-error" hidden>
    <h2>⚠ ダウンロードできません</h2>
    <p class="picker-note">1件以上選んでください。</p>
  </section>

  <section class="tool-panel">
    <h2>3. 取り込み手順</h2>
    <div id="instructions-msime">
      <ol class="picker-note">
        <li>タスクバーの入力方式アイコン（「あ」または「A」）を右クリック</li>
        <li>「ユーザー辞書ツール」を選択</li>
        <li>メニューの「辞書」→「テキストファイルからの登録」</li>
        <li>ダウンロードしたファイルを選んで開く</li>
        <li>「うれしい」などと入力して変換し、絵文字・顔文字が候補に出ることを確認</li>
      </ol>
    </div>
    <div id="instructions-google" hidden>
      <ol class="picker-note">
        <li>タスクバーのIMEアイコンを右クリック（または「Google 日本語入力 辞書ツール」を検索して起動）</li>
        <li>メニューの「管理」→「新規辞書にインポート」（または「選択した辞書にインポート」）</li>
        <li>ダウンロードしたファイルを選んで開く</li>
        <li>「うれしい」などと入力して変換し、絵文字・顔文字が候補に出ることを確認</li>
      </ol>
    </div>
  </section>

  <section>
    <h2>ほかのツール</h2>
    <div class="cards">
      <div class="card">
        <h3>QRコード生成ツール</h3>
        <p>URLや文字をその場でQRコードに。<a class="link" href="qr.html">使ってみる →</a></p>
      </div>
      <div class="card">
        <h3>CSV整形ツール</h3>
        <p>重複削除・空行削除・列の絞り込みをブラウザだけで。<a class="link" href="tools.html">使ってみる →</a></p>
      </div>
    </div>
  </section>
</main>

<footer>
  &copy; 2026 Neoyuki Dev — <a href="index.html#contact">お問い合わせはこちら</a>
</footer>

<script src="ime-dict.js"></script>
</body>
</html>
```

- [ ] **Step 4: Playwright MCPで表示を確認する**

PowerShellでローカルサーバーを起動:

```powershell
Start-Process -WindowStyle Hidden python -ArgumentList "-m","http.server","8000" -WorkingDirectory "C:\dev\portfolio" -PassThru | Select-Object Id
```

`mcp__plugin_playwright_playwright__browser_navigate` で `http://localhost:8000/ime-dict.html` を開き、`browser_take_screenshot` で確認する。

Expected: 3つのパネル（収録内容選択／形式選択・ダウンロード／取り込み手順）とカテゴリ一覧見出しが表示され、レイアウト崩れがない。この時点では `category-list` が空・件数表示が空でも正常（Task 3で実装するため）。

`Stop-Process` でサーバーを止める。

- [ ] **Step 5: コミット**

```bash
cd C:/dev/portfolio
git add ime-dict.html style.css
git commit -m "feat: IME辞書メーカーのページ骨格とスタイルを追加"
```

---

### Task 3: UI操作の実装（ime-dict.js の後半）— カテゴリ絞り込み・プレビュー・ダウンロード

**Files:**
- Modify: `ime-dict.js`（Task 1の末尾に追記）

**Interfaces:**
- Consumes: Task 1の `DICT`, `CATEGORIES`, `filterEntries`, `buildTsv`, `toUtf16LEBytes`。Task 2の DOM ID群（`category-list`, `select-all-btn`, `deselect-all-btn`, `dict-count`, `dict-preview-body`, `dict-download`, `dict-error`, `instructions-msime`, `instructions-google`, ラジオ `name="dict-type"` / `name="dict-format"`）
- Produces: なし（末端の画面挙動）

- [ ] **Step 1: `ime-dict.js` の末尾に以下を追記する**

```js
// ================= DOM操作 =================

const categoryListEl = document.getElementById("category-list");
const selectAllBtn = document.getElementById("select-all-btn");
const deselectAllBtn = document.getElementById("deselect-all-btn");
const countEl = document.getElementById("dict-count");
const previewBodyEl = document.getElementById("dict-preview-body");
const downloadBtn = document.getElementById("dict-download");
const errorPanel = document.getElementById("dict-error");
const instructionsMsime = document.getElementById("instructions-msime");
const instructionsGoogle = document.getElementById("instructions-google");

const PREVIEW_ROWS = 10;

// カテゴリチェックボックスを生成（初期状態：全選択）
CATEGORIES.forEach((c) => {
  const label = document.createElement("label");
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = c.key;
  cb.checked = true;
  cb.className = "cat-checkbox";
  label.appendChild(cb);
  label.appendChild(document.createTextNode(" " + c.label));
  categoryListEl.appendChild(label);
});

function selectedCategories() {
  return Array.from(document.querySelectorAll(".cat-checkbox"))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function selectedType() {
  return document.querySelector('input[name="dict-type"]:checked').value;
}

function selectedFormat() {
  return document.querySelector('input[name="dict-format"]:checked').value;
}

function currentEntries() {
  return filterEntries(DICT, selectedCategories(), selectedType());
}

function renderPreview(entries) {
  previewBodyEl.innerHTML = "";
  entries.slice(0, PREVIEW_ROWS).forEach((e) => {
    const tr = document.createElement("tr");
    const tdYomi = document.createElement("td");
    tdYomi.textContent = e.yomi;
    const tdWord = document.createElement("td");
    tdWord.textContent = e.word;
    tr.appendChild(tdYomi);
    tr.appendChild(tdWord);
    previewBodyEl.appendChild(tr);
  });
}

function update() {
  const entries = currentEntries();
  countEl.textContent = `選択中: ${entries.length}件`;
  renderPreview(entries);
  downloadBtn.disabled = entries.length === 0;
  errorPanel.hidden = true;
}

function updateInstructions() {
  const format = selectedFormat();
  instructionsMsime.hidden = format !== "msime";
  instructionsGoogle.hidden = format !== "google";
}

categoryListEl.addEventListener("change", update);
document
  .querySelectorAll('input[name="dict-type"]')
  .forEach((r) => r.addEventListener("change", update));
document
  .querySelectorAll('input[name="dict-format"]')
  .forEach((r) => r.addEventListener("change", updateInstructions));

selectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".cat-checkbox").forEach((cb) => (cb.checked = true));
  update();
});

deselectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".cat-checkbox").forEach((cb) => (cb.checked = false));
  update();
});

function pad2(n) {
  return String(n).padStart(2, "0");
}

downloadBtn.addEventListener("click", () => {
  const entries = currentEntries();
  if (entries.length === 0) {
    errorPanel.hidden = false;
    return;
  }
  const format = selectedFormat();
  const text = buildTsv(entries);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const filename = `ime_dict_${entries.length}件_${dateStr}.txt`;

  let blob;
  if (format === "msime") {
    blob = new Blob([toUtf16LEBytes(text)], { type: "text/plain" });
  } else {
    blob = new Blob([new TextEncoder().encode(text)], { type: "text/plain" });
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
});

// 初期表示
update();
updateInstructions();
```

- [ ] **Step 2: Playwright MCPで画面操作を確認する**

ローカルサーバーを起動し（Task 2 Step 4と同じ手順）、`http://localhost:8000/ime-dict.html` を開く。

`mcp__plugin_playwright_playwright__browser_evaluate` で以下を確認する:

```js
() => {
  const count = document.getElementById("dict-count").textContent;
  const previewRows = document.getElementById("dict-preview-body").children.length;
  const categoryBoxes = document.querySelectorAll(".cat-checkbox").length;
  return { count, previewRows, categoryBoxes };
}
```

Expected: `count` が `"選択中: 193件"`、`previewRows` が `10`、`categoryBoxes` が `9`

続けて「すべて解除」ボタンをクリックし、同じ評価を実行する。

Expected: `count` が `"選択中: 0件"`、`previewRows` が `0`、ダウンロードボタンが `disabled`

- [ ] **Step 3: ダウンロード用に生成されるBlobの中身をページ内で直接検証する**

実際のファイルダウンロード（保存先パスの取得はPlaywright MCPの挙動に依存し不確実なため）ではなく、ダウンロードボタンと同じ関数呼び出し経路をページ内で再現し、`browser_evaluate` でBlobの中身を直接読み取って検証する。「すべて選択」を押して全選択に戻した状態で実行する:

```js
async () => {
  const entries = currentEntries();
  const text = buildTsv(entries);

  // MS-IME用（UTF-16LE・BOM付き）
  const msimeBlob = new Blob([toUtf16LEBytes(text)], { type: "text/plain" });
  const msimeBuf = new Uint8Array(await msimeBlob.arrayBuffer());
  const bomOk = msimeBuf[0] === 0xff && msimeBuf[1] === 0xfe;

  // Google日本語入力用（UTF-8）
  const googleBlob = new Blob([new TextEncoder().encode(text)], { type: "text/plain" });
  const googleText = await googleBlob.text();
  const lines = googleText.split("\r\n");

  return {
    entryCount: entries.length,
    bomOk,
    msimeByteLength: msimeBuf.length,
    expectedByteLength: 2 + text.length * 2,
    googleLineCount: lines.length,
    firstLine: lines[0],
    googleHasNoBom: googleText.charCodeAt(0) !== 0xfeff,
  };
}
```

Expected: `entryCount` が `193`、`bomOk` が `true`、`msimeByteLength === expectedByteLength`、`googleLineCount` が `193`、`firstLine` が `"うれしい\t😊\t顔文字"`、`googleHasNoBom` が `true`

続けて、絵文字のサロゲートペアが壊れていないことも確認する:

```js
async () => {
  const entries = currentEntries().filter((e) => e.yomi === "うれしい" && e.type === "emoji");
  const text = buildTsv(entries);
  const bytes = toUtf16LEBytes(text);
  const decoded = new TextDecoder("utf-16le").decode(bytes.slice(2));
  return { original: text, decoded, matches: decoded === text };
}
```

Expected: `matches` が `true`（😊のサロゲートペアが2バイト×2コードユニットとして壊れずに復元される）

- [ ] **Step 4: サーバーを止めて一時ファイルを削除**

Task 2 Step 4と同様に `Stop-Process`。Playwrightが生成したダウンロードファイル・スクリーンショット・`.playwright-mcp` フォルダを削除する。

- [ ] **Step 5: コミット**

```bash
cd C:/dev/portfolio
git add ime-dict.js
git commit -m "feat: IME辞書メーカーの絞り込み・プレビュー・ダウンロード操作を実装"
```

---

### Task 4: アクセシビリティ・レスポンシブ確認

**Files:**
- Modify: `ime-dict.html`（必要に応じて微調整。事前定義なし — 検証結果に応じて対応）

**Interfaces:**
- Consumes: Task 2/3で完成した `ime-dict.html` / `ime-dict.js`
- Produces: なし

- [ ] **Step 1: フォーカス順序とスキップナビを確認する**

ローカルサーバーを起動し `http://localhost:8000/ime-dict.html` を開く。`mcp__plugin_playwright_playwright__browser_press_key` で `Tab` を1回押し、`browser_evaluate` で `document.activeElement` のclassとhref先の存在を確認する（[works.html](portfolio/works.html) 追加時と同じ手法）。

```js
() => {
  const el = document.activeElement;
  const target = document.querySelector(el.getAttribute("href") || "");
  return { class: el.className, targetExists: !!target, targetTag: target?.tagName };
}
```

Expected: `class` が `"skip-nav"`、`targetExists` が `true`、`targetTag` が `"MAIN"`

- [ ] **Step 2: 320px幅でチェックボックス9個+ラジオのレイアウトを確認する**

`mcp__plugin_playwright_playwright__browser_resize` で幅320pxに変更し、`browser_take_screenshot` で確認する。あわせて横スクロールが発生していないかを評価する:

```js
() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
})
```

Expected: `scrollWidth <= clientWidth`（横スクロールなし）。カテゴリのチェックボックスが折り返して表示され、テキストが切れていないことをスクリーンショットで確認する。崩れがあれば `#category-list` の `gap` や `.tool-panel` の左右パディングを調整する。

- [ ] **Step 3: fieldset/legendがスクリーンリーダー的に正しく機能するか確認する**

```js
() => {
  const fieldsets = document.querySelectorAll("fieldset.option-group");
  return Array.from(fieldsets).map((f) => ({
    legend: f.querySelector("legend")?.textContent,
    inputCount: f.querySelectorAll("input").length,
  }));
}
```

Expected: 3つのfieldset（カテゴリ／種類／形式）それぞれに `legend` があり、`inputCount` がカテゴリ=9、種類=3、形式=2であること

- [ ] **Step 4: サーバー停止・一時ファイル削除、コミット（変更があれば）**

Task 2 Step 4と同様に後片付け。Step 2で調整が必要だった場合のみ、修正をコミットする:

```bash
cd C:/dev/portfolio
git add ime-dict.html style.css
git commit -m "fix: IME辞書メーカーの320px幅でのレイアウトを調整"
```

（調整不要だった場合はこのタスクはコミット無しで完了とする）

---

### Task 5: サイト内導線の整備と最終確認

**Files:**
- Modify: `works.html`（既存の実績カードにデモリンクを追加）
- Modify: `README.md`（ページ構成表を更新）

**Interfaces:**
- Consumes: Task 1〜4で完成した `ime-dict.html`
- Produces: なし

- [ ] **Step 1: works.html の実績カードにデモリンクを追加する**

`C:\dev\portfolio\works.html` の該当カード（「顔文字・絵文字 変換辞書（IMEユーザー辞書）」）の `</p>` の直後に1行追加する。既存:

```html
      <p>
        「うれしい」「もうしわけございません」のように感情や挨拶をそのまま入力すると、
        対応する絵文字・顔文字が変換候補に出るようにするユーザー辞書です。
        一覧やパネルから探して選ぶ手間をなくし、文章を書く流れを止めずに入力できます。
        日常会話からビジネスメールの敬語表現まで193件を収録し、
        MS-IMEとGoogle日本語入力のどちらにも同じファイルで取り込めます。
      </p>
    </div>
```

変更後:

```html
      <p>
        「うれしい」「もうしわけございません」のように感情や挨拶をそのまま入力すると、
        対応する絵文字・顔文字が変換候補に出るようにするユーザー辞書です。
        一覧やパネルから探して選ぶ手間をなくし、文章を書く流れを止めずに入力できます。
        日常会話からビジネスメールの敬語表現まで193件を収録し、
        MS-IMEとGoogle日本語入力のどちらにも同じファイルで取り込めます。
      </p>
      <a class="link" href="ime-dict.html">→ 実際に動くツールを試す</a>
    </div>
```

- [ ] **Step 2: README.md のページ構成表を更新する**

`C:\dev\portfolio\README.md` の「ページ構成」表、`ツール` の行を以下のように変更する。既存:

```
| [ツール](https://a-book1824215.github.io/portfolio/tools.html) | ブラウザ上で動くCSV整形ツール・[QRコード生成ツール](https://a-book1824215.github.io/portfolio/qr.html) |
```

変更後:

```
| [ツール](https://a-book1824215.github.io/portfolio/tools.html) | ブラウザ上で動くCSV整形ツール・[QRコード生成ツール](https://a-book1824215.github.io/portfolio/qr.html)・[IME顔文字・絵文字辞書メーカー](https://a-book1824215.github.io/portfolio/ime-dict.html) |
```

- [ ] **Step 3: works.html からの導線を含めた全体を通しで確認する**

ローカルサーバーを起動し、`http://localhost:8000/works.html` を開く。Playwright MCPで新しく追加したリンク（「→ 実際に動くツールを試す」、works.htmlの2件目のカード）をクリックし、`ime-dict.html` に正しく遷移することを確認する。

続けて `ime-dict.html` 上で以下を一通り操作する:
1. カテゴリを1つだけ選択 → 件数・プレビューが該当カテゴリの件数に変わる
2. 種類を「絵文字のみ」に変更 → 件数がさらに絞られる
3. 形式を「Google日本語入力用」に変更 → 手順パネルがGoogle用の文言に切り替わる
4. ダウンロードして、Task 3 Step 3と同じ方法でファイル内容を確認する

Expected: すべて設計どおりに動作し、コンソールエラーが出ていないこと（`mcp__plugin_playwright_playwright__browser_console_messages` で確認）

- [ ] **Step 4: サーバー停止・一時ファイル削除**

Task 2 Step 4と同様。

- [ ] **Step 5: コミット**

```bash
cd C:/dev/portfolio
git add works.html README.md
git commit -m "docs: works.htmlとREADMEにIME辞書メーカーへの導線を追加"
```

---

## 完了条件

- `https://a-book1824215.github.io/portfolio/ime-dict.html`（公開後）で、カテゴリ・種類・形式を選んでファイルをダウンロードできる
- MS-IME用ファイルがUTF-16LE・BOM付きで、Google日本語入力用がUTF-8で正しく出力される（Task 3 Step 3でBlobの中身を直接検証）
- 193件全件が欠落なく収録されている（Task 1 Step 7のNode検証で保証）
- works.html・READMEからこのツールに到達できる
- 320px幅で横スクロールが発生せず、スキップナビ・フォーカス順序が他ページと同様に機能する

**注意（ユーザーへの申し送り事項）:** 本プランの確認はすべてバイト列レベルの検証（BOM・エンコーディング・行数）に留まる。実際にMS-IME／Google日本語入力のユーザー辞書ツールに読み込ませて変換候補に絵文字・顔文字が出ることの確認は、実装完了後にユーザー自身の環境で行ってもらう必要がある（開発環境にIMEの対話操作を検証する手段が無いため）。実装完了時にこの点を明示的に伝えること。
