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
  { yomi: "ふまん", word: "(-\"-)", type: "kaomoji", cat: "emotion" },
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
