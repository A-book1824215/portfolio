const fileInput = document.getElementById("csv-file");
const textInput = document.getElementById("csv-text");
const optHeader = document.getElementById("opt-header");
const optEmpty = document.getElementById("opt-empty");
const optDup = document.getElementById("opt-dup");
const optTrim = document.getElementById("opt-trim");
const columnPicker = document.getElementById("column-picker");
const columnList = document.getElementById("column-list");
const runBtn = document.getElementById("run-btn");
const resultPanel = document.getElementById("result-panel");
const statsEl = document.getElementById("stats");
const previewTable = document.getElementById("preview-table");
const previewNote = document.getElementById("preview-note");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");

const PREVIEW_ROWS = 20;
let resultRows = [];

// ---- CSVの読み書き ----

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function escapeField(v) {
  if (/[",\r\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function toCSV(rows) {
  return rows.map((r) => r.map(escapeField).join(",")).join("\r\n");
}

// ---- ファイル読み込み（文字コード自動判定） ----

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const buf = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder("shift_jis").decode(buf);
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  textInput.value = text;
  buildColumnPicker();
});

textInput.addEventListener("change", buildColumnPicker);
optHeader.addEventListener("change", buildColumnPicker);

// ---- 列の選択UI ----

function buildColumnPicker() {
  const rows = parseCSV(textInput.value);
  if (rows.length === 0 || rows[0].length <= 1) {
    columnPicker.hidden = true;
    columnList.innerHTML = "";
    return;
  }
  const first = rows[0];
  columnList.innerHTML = "";
  first.forEach((name, i) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.col = i;
    label.appendChild(cb);
    const shown = optHeader.checked && name.trim() !== "" ? name : `${i + 1}列目`;
    label.appendChild(document.createTextNode(" " + shown));
    columnList.appendChild(label);
  });
  columnPicker.hidden = false;
}

function selectedColumns() {
  const boxes = columnList.querySelectorAll("input[type=checkbox]");
  if (boxes.length === 0) return null;
  const cols = [];
  boxes.forEach((cb) => {
    if (cb.checked) cols.push(Number(cb.dataset.col));
  });
  return cols.length === boxes.length ? null : cols;
}

// ---- 処理の実行 ----

runBtn.addEventListener("click", () => {
  const raw = textInput.value;
  if (raw.trim() === "") {
    alertResult("データが入力されていません。ファイルを選ぶか、テキストを貼り付けてください。");
    return;
  }

  let rows = parseCSV(raw);
  const originalCount = rows.length;

  let header = null;
  if (optHeader.checked && rows.length > 0) {
    header = rows.shift();
  }

  if (optTrim.checked) {
    rows = rows.map((r) => r.map((v) => v.trim()));
    if (header) header = header.map((v) => v.trim());
  }

  let emptyRemoved = 0;
  if (optEmpty.checked) {
    const before = rows.length;
    rows = rows.filter((r) => r.some((v) => v.trim() !== ""));
    emptyRemoved = before - rows.length;
  }

  let dupRemoved = 0;
  if (optDup.checked) {
    const seen = new Set();
    const before = rows.length;
    rows = rows.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    dupRemoved = before - rows.length;
  }

  const cols = selectedColumns();
  if (cols) {
    rows = rows.map((r) => cols.map((i) => r[i] ?? ""));
    if (header) header = cols.map((i) => header[i] ?? "");
  }

  resultRows = header ? [header, ...rows] : rows;

  const parts = [`${originalCount}行 → ${resultRows.length}行`];
  if (emptyRemoved > 0) parts.push(`空行 ${emptyRemoved}行を削除`);
  if (dupRemoved > 0) parts.push(`重複 ${dupRemoved}行を削除`);
  if (cols) parts.push(`${cols.length}列に絞り込み`);
  statsEl.textContent = "処理完了： " + parts.join(" ／ ");

  renderPreview();
  resultPanel.hidden = false;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

function alertResult(msg) {
  statsEl.textContent = msg;
  previewTable.innerHTML = "";
  previewNote.textContent = "";
  resultPanel.hidden = false;
}

function renderPreview() {
  previewTable.innerHTML = "";
  const shown = resultRows.slice(0, PREVIEW_ROWS);
  shown.forEach((r, idx) => {
    const tr = document.createElement("tr");
    const cellTag = optHeader.checked && idx === 0 ? "th" : "td";
    r.forEach((v) => {
      const cell = document.createElement(cellTag);
      cell.textContent = v;
      tr.appendChild(cell);
    });
    previewTable.appendChild(tr);
  });
  previewNote.textContent =
    resultRows.length > PREVIEW_ROWS
      ? `プレビューは先頭${PREVIEW_ROWS}行のみ表示しています（全${resultRows.length}行はダウンロードで取得できます）`
      : "";
}

// ---- 出力 ----

downloadBtn.addEventListener("click", () => {
  if (resultRows.length === 0) return;
  // BOM付きUTF-8にするとExcelで文字化けせずに開ける
  const blob = new Blob(["﻿" + toCSV(resultRows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "整形済みデータ.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

copyBtn.addEventListener("click", async () => {
  if (resultRows.length === 0) return;
  await navigator.clipboard.writeText(toCSV(resultRows));
  const original = copyBtn.textContent;
  copyBtn.textContent = "コピーしました！";
  setTimeout(() => (copyBtn.textContent = original), 1500);
});
