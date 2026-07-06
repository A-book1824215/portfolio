const boardEl = document.getElementById("ms-board");
const minesEl = document.getElementById("ms-mines");
const timeEl = document.getElementById("ms-time");
const statusEl = document.getElementById("ms-status");
const resetBtn = document.getElementById("ms-reset");
const flagModeBtn = document.getElementById("ms-flag-mode");
const levelBtns = document.querySelectorAll(".ms-level-btn");

const LEVELS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  normal: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};
const BEST_KEY = "neoyuki-minesweeper-best-";

let level = "easy";
let rows, cols, mineCount;
let grid = []; // { mine, revealed, flagged, count, el }
let started = false;
let finished = false;
let flagMode = false;
let flagsLeft = 0;
let revealedCount = 0;
let seconds = 0;
let timerId = null;
let longPressId = null;
let longPressFired = false;

function forEachNeighbor(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
    }
  }
}

function newGame() {
  const cfg = LEVELS[level];
  rows = cfg.rows;
  cols = cfg.cols;
  mineCount = cfg.mines;
  started = false;
  finished = false;
  flagsLeft = mineCount;
  revealedCount = 0;
  seconds = 0;
  clearInterval(timerId);
  timerId = null;
  timeEl.textContent = "0";
  minesEl.textContent = String(flagsLeft);
  resetBtn.textContent = "🙂";
  statusEl.textContent = "マスをタップ（クリック）して開始 ｜ 最初の1マスは必ず安全です";

  grid = [];
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${cols}, var(--ms-cell))`;
  boardEl.classList.toggle("ms-small", cols > 16);

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ms-cell";
      el.dataset.r = r;
      el.dataset.c = c;
      el.setAttribute("aria-label", `${r + 1}行${c + 1}列 未開封`);
      boardEl.appendChild(el);
      row.push({ mine: false, revealed: false, flagged: false, count: 0, el });
    }
    grid.push(row);
  }
  updateBestLabels();
}

// 最初に開けたマスとその周囲には地雷を置かない（初手で必ず安全）
function placeMines(safeR, safeC) {
  const banned = new Set([safeR * cols + safeC]);
  forEachNeighbor(safeR, safeC, (r, c) => banned.add(r * cols + c));

  let placed = 0;
  while (placed < mineCount) {
    const idx = Math.floor(Math.random() * rows * cols);
    if (banned.has(idx)) continue;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    if (grid[r][c].mine) continue;
    grid[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      forEachNeighbor(r, c, (nr, nc) => { if (grid[nr][nc].mine) n++; });
      grid[r][c].count = n;
    }
  }
}

function startTimer() {
  timerId = setInterval(() => {
    seconds++;
    timeEl.textContent = String(seconds);
  }, 1000);
}

function revealCell(r, c) {
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop();
    const cell = grid[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    revealedCount++;
    const el = cell.el;
    el.classList.add("open");
    el.setAttribute("aria-label", `${cr + 1}行${cc + 1}列 ${cell.count === 0 ? "空き" : "数字" + cell.count}`);
    if (cell.count > 0) {
      el.textContent = String(cell.count);
      el.classList.add(`n${cell.count}`);
    } else {
      forEachNeighbor(cr, cc, (nr, nc) => {
        if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) stack.push([nr, nc]);
      });
    }
  }
}

function toggleFlag(r, c) {
  const cell = grid[r][c];
  if (cell.revealed || finished) return;
  cell.flagged = !cell.flagged;
  cell.el.textContent = cell.flagged ? "🚩" : "";
  cell.el.classList.toggle("flagged", cell.flagged);
  flagsLeft += cell.flagged ? -1 : 1;
  minesEl.textContent = String(flagsLeft);
}

function loseGame(r, c) {
  finished = true;
  clearInterval(timerId);
  resetBtn.textContent = "😵";
  for (let rr = 0; rr < rows; rr++) {
    for (let cc = 0; cc < cols; cc++) {
      const cell = grid[rr][cc];
      if (cell.mine) {
        cell.el.textContent = "💣";
        cell.el.classList.add("open", "mine");
      } else if (cell.flagged) {
        cell.el.textContent = "❌";
      }
    }
  }
  grid[r][c].el.classList.add("boom");
  statusEl.textContent = "ゲームオーバー…　🙂ボタンでもう一度";
}

function winGame() {
  finished = true;
  clearInterval(timerId);
  resetBtn.textContent = "😎";
  minesEl.textContent = "0";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.mine && !cell.flagged) {
        cell.el.textContent = "🚩";
        cell.el.classList.add("flagged");
      }
    }
  }
  const key = BEST_KEY + level;
  const best = Number(localStorage.getItem(key) || 0);
  if (!best || seconds < best) {
    localStorage.setItem(key, String(seconds));
    statusEl.textContent = `クリア！ ${seconds}秒 — ベストタイム更新！🎉`;
  } else {
    statusEl.textContent = `クリア！ ${seconds}秒（ベスト: ${best}秒）`;
  }
  updateBestLabels();
}

function openCell(r, c) {
  const cell = grid[r][c];
  if (finished || cell.flagged) return;

  if (!started) {
    started = true;
    placeMines(r, c);
    startTimer();
    statusEl.textContent = "数字のまわりに地雷が隠れています";
  }

  if (cell.revealed) {
    // 開いた数字をもう一度押すと、旗の数が合っていれば周囲をまとめて開く
    if (cell.count > 0) {
      let flags = 0;
      forEachNeighbor(r, c, (nr, nc) => { if (grid[nr][nc].flagged) flags++; });
      if (flags === cell.count) {
        let hitMine = null;
        forEachNeighbor(r, c, (nr, nc) => {
          const n = grid[nr][nc];
          if (!n.flagged && !n.revealed) {
            if (n.mine) hitMine = [nr, nc];
            else revealCell(nr, nc);
          }
        });
        if (hitMine) { loseGame(hitMine[0], hitMine[1]); return; }
      }
    }
  } else if (cell.mine) {
    loseGame(r, c);
    return;
  } else {
    revealCell(r, c);
  }

  if (revealedCount === rows * cols - mineCount) winGame();
}

function updateBestLabels() {
  for (const lv of Object.keys(LEVELS)) {
    const el = document.getElementById(`ms-best-${lv}`);
    const best = localStorage.getItem(BEST_KEY + lv);
    el.textContent = best ? best : "--";
  }
}

// ---- 操作イベント ----

boardEl.addEventListener("click", (e) => {
  const el = e.target.closest(".ms-cell");
  if (!el) return;
  if (longPressFired) { longPressFired = false; return; }
  const r = Number(el.dataset.r);
  const c = Number(el.dataset.c);
  if (flagMode && !grid[r][c].revealed) toggleFlag(r, c);
  else openCell(r, c);
});

boardEl.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const el = e.target.closest(".ms-cell");
  if (!el) return;
  toggleFlag(Number(el.dataset.r), Number(el.dataset.c));
});

// スマホ向け：長押しで旗を立てる
boardEl.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  const el = e.target.closest(".ms-cell");
  if (!el) return;
  longPressFired = false;
  longPressId = setTimeout(() => {
    longPressFired = true;
    toggleFlag(Number(el.dataset.r), Number(el.dataset.c));
    if (navigator.vibrate) navigator.vibrate(30);
  }, 450);
});
["pointerup", "pointercancel", "pointerleave"].forEach((ev) => {
  boardEl.addEventListener(ev, () => clearTimeout(longPressId), true);
});

flagModeBtn.addEventListener("click", () => {
  flagMode = !flagMode;
  flagModeBtn.textContent = flagMode ? "🚩モード：ON" : "🚩モード：OFF";
  flagModeBtn.classList.toggle("ms-flag-on", flagMode);
});

resetBtn.addEventListener("click", newGame);

levelBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    levelBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    level = btn.dataset.level;
    newGame();
  });
});

newGame();
