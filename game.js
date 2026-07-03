const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("game-status");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const paddle = { width: 90, height: 12, x: (WIDTH - 90) / 2, speed: 6 };
const ball = { x: WIDTH / 2, y: HEIGHT - 30, radius: 7, dx: 3, dy: -3 };

const BRICK_ROWS = 4;
const BRICK_COLS = 8;
const BRICK_PADDING = 6;
const BRICK_TOP = 40;
const BRICK_HEIGHT = 18;
const BRICK_WIDTH = (WIDTH - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
const COLORS = ["#5fd0ff", "#7fe0c0", "#ffd166", "#ff7a5f"];

let bricks = [];
let score = 0;
let lives = 3;
let running = true;
let leftPressed = false;
let rightPressed = false;

function buildBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_PADDING + c * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
        color: COLORS[r % COLORS.length],
      });
    }
  }
}

function resetBall() {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT - 30;
  ball.dx = 3 * (Math.random() < 0.5 ? 1 : -1);
  ball.dy = -3;
  paddle.x = (WIDTH - paddle.width) / 2;
}

function drawPaddle() {
  ctx.fillStyle = "#e8e8ec";
  ctx.fillRect(paddle.x, HEIGHT - paddle.height - 6, paddle.width, paddle.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ff7a5f";
  ctx.fill();
}

function drawBricks() {
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
  }
}

function drawScore() {
  ctx.fillStyle = "#9aa0ab";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, WIDTH - 70, 20);
}

function collideBricks() {
  for (const b of bricks) {
    if (!b.alive) continue;
    if (
      ball.x > b.x &&
      ball.x < b.x + BRICK_WIDTH &&
      ball.y > b.y &&
      ball.y < b.y + BRICK_HEIGHT
    ) {
      b.alive = false;
      ball.dy *= -1;
      score += 10;
    }
  }
  if (bricks.every((b) => !b.alive)) {
    running = false;
    statusEl.textContent = `クリア！ Score: ${score}（リロードで再プレイ）`;
  }
}

function update() {
  if (leftPressed) paddle.x -= paddle.speed;
  if (rightPressed) paddle.x += paddle.speed;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.radius || ball.x > WIDTH - ball.radius) ball.dx *= -1;
  if (ball.y < ball.radius) ball.dy *= -1;

  if (
    ball.y > HEIGHT - paddle.height - 6 - ball.radius &&
    ball.y < HEIGHT - 6 &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = hitPos * (Math.PI / 3);
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -speed * Math.cos(angle);
  }

  if (ball.y > HEIGHT) {
    lives -= 1;
    if (lives <= 0) {
      running = false;
      statusEl.textContent = `ゲームオーバー Score: ${score}（リロードで再プレイ）`;
    } else {
      resetBall();
    }
  }

  collideBricks();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBricks();
  drawPaddle();
  drawBall();
  drawScore();
}

function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === "ArrowRight") rightPressed = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") leftPressed = false;
  if (e.key === "ArrowRight") rightPressed = false;
});
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, mouseX - paddle.width / 2));
});

buildBricks();
draw();
loop();
