const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("game-status");
const muteBtn = document.getElementById("mute-btn");
const pauseBtn = document.getElementById("pause-btn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// 石器テーマの配色（サイトと統一）
const C = {
  bg: "#E6E1D8",
  text: "#3A3530",
  sub: "#5E5851",
  paddle: "#3A3530",
  ball: "#7D3520",
  brick: ["#A8987F", "#8B7045", "#9B4F38", "#6E6A5E"],
  brickHard: "#5A4018",
  itemExpand: "#7B5D2E",
  itemMulti: "#9B4F38",
};

const BRICK_COLS = 8;
const BRICK_PADDING = 6;
const BRICK_TOP = 46;
const BRICK_HEIGHT = 18;
const BRICK_WIDTH = (WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;

const HS_KEY = "neoyuki-breakout-highscore";

let mode = "title"; // title | playing | paused | gameover
let bricks = [];
let balls = [];
let items = [];
let particles = [];
let score = 0;
let lives = 3;
let stage = 1;
let highScore = Number(localStorage.getItem(HS_KEY) || 0);
let leftPressed = false;
let rightPressed = false;
let soundOn = true;

const paddle = {
  baseWidth: 90,
  width: 90,
  height: 12,
  x: (WIDTH - 90) / 2,
  speed: 6,
  expandUntil: 0,
};

// ---- 効果音（Web Audio API・外部ファイル不要） ----

let audioCtx = null;

function beep(freq, dur = 0.08, type = "square", vol = 0.06) {
  if (!soundOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

const se = {
  paddle: () => beep(220, 0.06),
  brick: () => beep(440, 0.05),
  breakBrick: () => beep(560, 0.08),
  item: () => { beep(660, 0.07); setTimeout(() => beep(880, 0.09), 70); },
  lose: () => beep(140, 0.3, "sawtooth"),
  clear: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.08), i * 110)),
  gameover: () => [330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.2, "sawtooth"), i * 180)),
};

muteBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  muteBtn.textContent = soundOn ? "音：ON" : "音：OFF";
});

// ---- ステージ構成 ----
// 各パターンは「ブロックを置くか」「硬さ(hp)」を行・列から決める

const STAGE_PATTERNS = [
  (r, c) => ({ place: r < 4, hp: 1 }),                                   // 1: 全面
  (r, c) => ({ place: r < 4 && (r + c) % 2 === 0, hp: r === 0 ? 2 : 1 }), // 2: 市松
  (r, c) => ({ place: r < 5 && c >= r && c < BRICK_COLS - r, hp: r < 2 ? 2 : 1 }), // 3: ピラミッド
  (r, c) => ({ place: r < 5 && (c < 2 || c >= BRICK_COLS - 2 || r === 2), hp: 2 }), // 4: 砦
  (r, c) => ({ place: r < 5 && Math.abs(c - 3.5) + Math.abs(r - 2) <= 3.5, hp: (r + c) % 2 === 0 ? 2 : 1 }), // 5: ひし形
];

function buildBricks(stg) {
  bricks = [];
  const pattern = STAGE_PATTERNS[(stg - 1) % STAGE_PATTERNS.length];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const { place, hp } = pattern(r, c);
      if (!place) continue;
      bricks.push({
        x: BRICK_PADDING + c * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
        hp,
        maxHp: hp,
        color: hp === 2 ? C.brickHard : C.brick[r % C.brick.length],
      });
    }
  }
}

function ballSpeed() {
  return Math.min(3 + (stage - 1) * 0.4, 6.5);
}

function spawnBall() {
  const s = ballSpeed();
  balls.push({
    x: paddle.x + paddle.width / 2,
    y: HEIGHT - 40,
    radius: 7,
    dx: s * 0.5 * (Math.random() < 0.5 ? 1 : -1),
    dy: -s,
  });
}

function startGame() {
  score = 0;
  lives = 3;
  stage = 1;
  items = [];
  particles = [];
  balls = [];
  paddle.width = paddle.baseWidth;
  paddle.expandUntil = 0;
  paddle.x = (WIDTH - paddle.width) / 2;
  buildBricks(stage);
  spawnBall();
  mode = "playing";
  updateStatus();
}

function nextStage() {
  stage += 1;
  items = [];
  balls = [];
  paddle.width = paddle.baseWidth;
  paddle.expandUntil = 0;
  buildBricks(stage);
  spawnBall();
  se.clear();
  updateStatus();
}

function updateStatus() {
  if (mode === "playing") {
    statusEl.textContent = `ステージ ${stage} ｜ マウス・タッチ・← →キーでバーを操作 ｜ スペースキーで一時停止`;
  }
}

// ---- 一時停止 ----

let pausedAt = 0;

function togglePause() {
  if (mode === "playing") {
    mode = "paused";
    pausedAt = performance.now();
    pauseBtn.textContent = "再開";
    statusEl.textContent = "一時停止中 ｜ スペースキーまたは再開ボタンで続きから";
  } else if (mode === "paused") {
    // 停止していた時間ぶん、アイテム効果の期限を延長する
    if (paddle.expandUntil) paddle.expandUntil += performance.now() - pausedAt;
    mode = "playing";
    pauseBtn.textContent = "一時停止";
    updateStatus();
  }
}

// ---- パワーアップアイテム ----

function maybeDropItem(x, y) {
  if (Math.random() > 0.16) return;
  const type = Math.random() < 0.5 ? "expand" : "multi";
  items.push({ x, y, w: 34, h: 16, dy: 2.2, type });
}

function applyItem(type) {
  se.item();
  if (type === "expand") {
    paddle.width = 140;
    paddle.expandUntil = performance.now() + 12000;
  } else if (type === "multi") {
    const current = balls.slice(0, 3);
    for (const b of current) {
      if (balls.length >= 6) break;
      const speed = Math.hypot(b.dx, b.dy);
      const angle = Math.atan2(b.dx, -b.dy) + (Math.random() * 0.8 - 0.4) + 0.5;
      balls.push({ x: b.x, y: b.y, radius: b.radius, dx: speed * Math.sin(angle), dy: -speed * Math.cos(angle) });
    }
  }
}

// ---- パーティクル ----

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 1 + Math.random() * 2;
    particles.push({ x, y, dx: Math.cos(a) * v, dy: Math.sin(a) * v - 1, life: 28, color });
  }
}

// ---- 更新処理 ----

function update() {
  const now = performance.now();

  if (leftPressed) paddle.x -= paddle.speed;
  if (rightPressed) paddle.x += paddle.speed;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));

  if (paddle.expandUntil && now > paddle.expandUntil) {
    paddle.width = paddle.baseWidth;
    paddle.expandUntil = 0;
    paddle.x = Math.min(paddle.x, WIDTH - paddle.width);
  }

  // ボール
  for (const ball of balls) {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x < ball.radius) { ball.x = ball.radius; ball.dx = Math.abs(ball.dx); }
    if (ball.x > WIDTH - ball.radius) { ball.x = WIDTH - ball.radius; ball.dx = -Math.abs(ball.dx); }
    if (ball.y < ball.radius) { ball.y = ball.radius; ball.dy = Math.abs(ball.dy); }

    // パドル反射（当たり位置で角度が変わる）
    if (
      ball.dy > 0 &&
      ball.y > HEIGHT - paddle.height - 6 - ball.radius &&
      ball.y < HEIGHT - 6 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPos * (Math.PI / 3);
      const speed = Math.hypot(ball.dx, ball.dy);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
      se.paddle();
    }

    // ブロック衝突
    for (const b of bricks) {
      if (b.hp <= 0) continue;
      if (
        ball.x > b.x - ball.radius &&
        ball.x < b.x + BRICK_WIDTH + ball.radius &&
        ball.y > b.y - ball.radius &&
        ball.y < b.y + BRICK_HEIGHT + ball.radius
      ) {
        // どの面に当たったかで反射方向を決める
        const overlapX = Math.min(ball.x - (b.x - ball.radius), b.x + BRICK_WIDTH + ball.radius - ball.x);
        const overlapY = Math.min(ball.y - (b.y - ball.radius), b.y + BRICK_HEIGHT + ball.radius - ball.y);
        if (overlapX < overlapY) ball.dx *= -1;
        else ball.dy *= -1;

        b.hp -= 1;
        if (b.hp <= 0) {
          score += b.maxHp === 2 ? 20 : 10;
          spawnParticles(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2, b.color);
          maybeDropItem(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2);
          se.breakBrick();
        } else {
          score += 5;
          se.brick();
        }
        break;
      }
    }
  }

  // 落ちたボールを除去
  balls = balls.filter((b) => b.y < HEIGHT + b.radius);

  if (balls.length === 0) {
    lives -= 1;
    se.lose();
    if (lives <= 0) {
      mode = "gameover";
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HS_KEY, String(highScore));
      }
      se.gameover();
      statusEl.textContent = "ゲームオーバー ｜ クリックまたはタップで再スタート";
      return;
    }
    paddle.x = (WIDTH - paddle.width) / 2;
    spawnBall();
  }

  // アイテム落下とキャッチ
  for (const it of items) it.y += it.dy;
  items = items.filter((it) => {
    if (
      it.y + it.h / 2 > HEIGHT - paddle.height - 6 &&
      it.y - it.h / 2 < HEIGHT - 6 &&
      it.x + it.w / 2 > paddle.x &&
      it.x - it.w / 2 < paddle.x + paddle.width
    ) {
      applyItem(it.type);
      return false;
    }
    return it.y < HEIGHT + 20;
  });

  // パーティクル
  for (const p of particles) {
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.08;
    p.life -= 1;
  }
  particles = particles.filter((p) => p.life > 0);

  // ステージクリア
  if (bricks.every((b) => b.hp <= 0)) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, String(highScore));
    }
    nextStage();
  }
}

// ---- 描画処理 ----

function drawBackground() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawHud() {
  ctx.fillStyle = C.sub;
  ctx.font = "13px 'BIZ UDPGothic', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`スコア ${score}`, 10, 20);
  ctx.textAlign = "center";
  ctx.fillText(`ステージ ${stage} ｜ 残り ${"●".repeat(Math.max(lives, 0))}`, WIDTH / 2, 20);
  ctx.textAlign = "right";
  ctx.fillText(`ハイスコア ${highScore}`, WIDTH - 10, 20);
  ctx.textAlign = "left";
}

function drawPaddle() {
  ctx.fillStyle = C.paddle;
  ctx.fillRect(paddle.x, HEIGHT - paddle.height - 6, paddle.width, paddle.height);
}

function drawBalls() {
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = C.ball;
    ctx.fill();
  }
}

function drawBricks() {
  for (const b of bricks) {
    if (b.hp <= 0) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
    ctx.strokeStyle = "rgba(58,53,48,0.35)";
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, BRICK_WIDTH - 1, BRICK_HEIGHT - 1);
    // ダメージを受けた硬ブロックにヒビを描く
    if (b.maxHp === 2 && b.hp === 1) {
      ctx.strokeStyle = "rgba(230,225,216,0.9)";
      ctx.beginPath();
      ctx.moveTo(b.x + BRICK_WIDTH * 0.25, b.y + 3);
      ctx.lineTo(b.x + BRICK_WIDTH * 0.45, b.y + BRICK_HEIGHT * 0.55);
      ctx.lineTo(b.x + BRICK_WIDTH * 0.35, b.y + BRICK_HEIGHT - 3);
      ctx.moveTo(b.x + BRICK_WIDTH * 0.45, b.y + BRICK_HEIGHT * 0.55);
      ctx.lineTo(b.x + BRICK_WIDTH * 0.7, b.y + BRICK_HEIGHT * 0.7);
      ctx.stroke();
    }
  }
}

function drawItems() {
  ctx.font = "bold 11px 'BIZ UDPGothic', sans-serif";
  ctx.textAlign = "center";
  for (const it of items) {
    ctx.fillStyle = it.type === "expand" ? C.itemExpand : C.itemMulti;
    ctx.beginPath();
    ctx.roundRect(it.x - it.w / 2, it.y - it.h / 2, it.w, it.h, 8);
    ctx.fill();
    ctx.fillStyle = "#FDFAF5";
    ctx.fillText(it.type === "expand" ? "wide" : "×2", it.x, it.y + 4);
  }
  ctx.textAlign = "left";
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / 28;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function drawCenterText(title, sub) {
  ctx.fillStyle = C.text;
  ctx.font = "bold 28px 'BIZ UDPGothic', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 20);
  ctx.font = "14px 'BIZ UDPGothic', sans-serif";
  ctx.fillStyle = C.sub;
  ctx.fillText(sub, WIDTH / 2, HEIGHT / 2 + 14);
  ctx.fillText(`ハイスコア ${highScore}`, WIDTH / 2, HEIGHT / 2 + 40);
  ctx.textAlign = "left";
}

function draw() {
  drawBackground();
  if (mode === "title") {
    drawCenterText("ブロック崩し", "クリックまたはタップでスタート");
    return;
  }
  drawBricks();
  drawItems();
  drawParticles();
  drawPaddle();
  drawBalls();
  drawHud();
  if (mode === "gameover") {
    drawCenterText("ゲームオーバー", `スコア ${score} ｜ クリックまたはタップで再スタート`);
  }
  if (mode === "paused") {
    ctx.fillStyle = "rgba(230, 225, 216, 0.75)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawCenterText("一時停止中", "スペースキーまたは再開ボタンで続きから");
  }
}

function loop() {
  if (mode === "playing") update();
  draw();
  requestAnimationFrame(loop);
}

// ---- 操作 ----

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "Enter" || e.key === " ") {
    if (mode === "title" || mode === "gameover") {
      e.preventDefault();
      startGame();
    } else {
      e.preventDefault();
      togglePause();
    }
  }
  if (e.key === "p" || e.key === "P") togglePause();
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") leftPressed = false;
  if (e.key === "ArrowRight") rightPressed = false;
});

function movePaddleTo(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scale = WIDTH / rect.width;
  const x = (clientX - rect.left) * scale;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, x - paddle.width / 2));
}

canvas.addEventListener("mousemove", (e) => movePaddleTo(e.clientX));
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  movePaddleTo(e.touches[0].clientX);
}, { passive: false });

canvas.addEventListener("click", () => {
  if (mode === "title" || mode === "gameover") startGame();
});
canvas.addEventListener("touchstart", (e) => {
  if (mode === "title" || mode === "gameover") {
    e.preventDefault();
    startGame();
  }
}, { passive: false });

pauseBtn.addEventListener("click", togglePause);

loop();
