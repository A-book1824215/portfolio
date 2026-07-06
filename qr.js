const inputEl = document.getElementById("qr-input");
const sizeEl = document.getElementById("qr-size");
const canvasEl = document.getElementById("qr-canvas");
const resultPanel = document.getElementById("qr-result");
const errorPanel = document.getElementById("qr-error");
const errorMsgEl = document.getElementById("qr-error-msg");
const statusEl = document.getElementById("qr-status");
const downloadBtn = document.getElementById("qr-download");
const copyBtn = document.getElementById("qr-copy");

// 日本語を正しく変換するため、文字コードをUTF-8に設定（初期値は日本語非対応）
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

const PREVIEW_SIZE = 256;
let currentQR = null;
let debounceId = null;

function buildQR(text) {
  const qr = qrcode(0, "M"); // 型番自動・誤り訂正レベルM（標準）
  qr.addData(text);
  qr.make();
  return qr;
}

// 白い余白（クワイエットゾーン4マス）付きでキャンバスに描画
function drawQR(canvas, qr, targetSize) {
  const modules = qr.getModuleCount();
  const cell = Math.max(2, Math.floor(targetSize / (modules + 8)));
  const size = cell * (modules + 8);
  const offset = cell * 4;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
      }
    }
  }
  return size;
}

function update() {
  const text = inputEl.value.trim();
  if (!text) {
    resultPanel.hidden = true;
    errorPanel.hidden = true;
    currentQR = null;
    return;
  }
  try {
    currentQR = buildQR(text);
    drawQR(canvasEl, currentQR, PREVIEW_SIZE);
    statusEl.textContent = `${text.length}文字を変換しました（マス目: ${currentQR.getModuleCount()}×${currentQR.getModuleCount()}）`;
    resultPanel.hidden = false;
    errorPanel.hidden = true;
  } catch (e) {
    currentQR = null;
    resultPanel.hidden = true;
    errorMsgEl.textContent =
      "文字数が多すぎる可能性があります。目安として、半角なら約2,300文字・日本語なら約780文字までです。内容を短くしてお試しください。";
    errorPanel.hidden = false;
  }
}

inputEl.addEventListener("input", () => {
  clearTimeout(debounceId);
  debounceId = setTimeout(update, 250);
});

downloadBtn.addEventListener("click", () => {
  if (!currentQR) return;
  const off = document.createElement("canvas");
  drawQR(off, currentQR, Number(sizeEl.value));
  const a = document.createElement("a");
  a.href = off.toDataURL("image/png");
  a.download = "qrcode.png";
  a.click();
});

copyBtn.addEventListener("click", () => {
  if (!currentQR) return;
  const off = document.createElement("canvas");
  drawQR(off, currentQR, Number(sizeEl.value));
  off.toBlob((blob) => {
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": blob })])
      .then(() => { statusEl.textContent = "画像をコピーしました。そのまま資料などに貼り付けできます。"; })
      .catch(() => { statusEl.textContent = "コピーできませんでした。ダウンロードをご利用ください。"; });
  }, "image/png");
});

// 画像コピー非対応のブラウザではコピーボタンを隠す
if (!navigator.clipboard || !window.ClipboardItem) {
  copyBtn.hidden = true;
}
