const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== 플레이어 =====
const player = { x: 180, y: 520, width: 80, height: 80, speed: 5, facing: "right" };

// ===== 상태 =====
let poops = [];
let coins = [];
let dongbaks = [];
let poopAvoided = 0;        // 아래로 빠진 똥 개수(회피 점수)
let coinsCollected = 0;     // 먹은 코인 개수
let dongbakCollected = 0;   // 먹은 동백 개수
let score = 0;              // 스코어
let gameOver = false;
let spawnInterval = 700;    // ms, 초기 스폰 주기
let poopSpeed = 3;
let coinSpeed = 2.6;
let dongbakSpeed = 2.4;
let level = 1;

// ===== 보너스/특수효과 =====
const SHIELD_DURATION = 4000; // 동백 먹으면 4초 무적
let shieldUntil = 0;
function isShieldActive() {
  return Date.now() < shieldUntil;
}

// ===== 입력 =====
const keys = { ArrowLeft: false, ArrowRight: false };
document.addEventListener("keydown", e => {
  if (e.code in keys) {
    keys[e.code] = true;
    if (e.code === "ArrowLeft") player.facing = "left";
    if (e.code === "ArrowRight") player.facing = "right";
  }
  if (gameOver && e.code === "KeyR") restartGame();
});
document.addEventListener("keyup", e => { if (e.code in keys) keys[e.code] = false; });

// ===== 이미지 =====
const playerImg  = new Image(); playerImg.src  = "player.png";
const poopImg    = new Image(); poopImg.src    = "poop.png";
const coinImg    = new Image(); coinImg.src    = "coin.png";
const dongbakImg = new Image(); dongbakImg.src = "dongbak.png";

// ===== 스폰 =====
/**
 * 드롭 1개 스폰: 똥 60% / 코인 28% / 동백 12%
 * 동시에 너무 많아지지 않도록 상한(cap) 적용
 */
const MAX_DROPS = 6; // 화면 동시 드롭 최대
function spawnDrop() {
  const totalDrops = poops.length + coins.length + dongbaks.length;
  if (totalDrops >= MAX_DROPS) return;

  const size = 30;
  const x = Math.random() * (canvas.width - size);
  const roll = Math.random();

  if (roll < 0.60) {
    // 똥
    poops.push({
      x, y: -size, width: size, height: size,
      speed: poopSpeed + Math.random() * 1.5
    });
  } else if (roll < 0.88) {
    // 코인
    coins.push({
      x, y: -size, width: size, height: size,
      speed: coinSpeed + Math.random() * 1.2
    });
  } else {
    // 동백
    dongbaks.push({
      x, y: -size, width: size, height: size,
      speed: dongbakSpeed + Math.random() * 1.0
    });
  }
}

// ===== 충돌 =====
function isColliding(a, b) {
  return !(a.x > b.x + b.width ||
           a.x + a.width < b.x ||
           a.y > b.y + b.height ||
           a.y + a.height < b.y);
}

// ===== 난이도 곡선 =====
function increaseDifficulty() {
  if (gameOver) return;
  level++;
  poopSpeed += 0.35;
  coinSpeed += 0.25;
  dongbakSpeed += 0.20;

  // 스폰 주기 최소 220ms까지 단축
  spawnInterval = Math.max(220, spawnInterval - 60);

  clearInterval(spawnTimer);
  spawnTimer = setInterval(spawnDrop, spawnInterval);
}

// ===== 재시작 =====
function restartGame() {
  poops = [];
  coins = [];
  dongbaks = [];
  poopAvoided = 0;
  coinsCollected = 0;
  dongbakCollected = 0;
  score = 0;
  gameOver = false;
  level = 1;
  spawnInterval = 700;
  poopSpeed = 3;
  coinSpeed = 2.6;
  dongbakSpeed = 2.4;
  shieldUntil = 0;
  player.x = 180; player.facing = "right";

  clearInterval(spawnTimer);
  clearInterval(levelTimer);
  spawnTimer = setInterval(spawnDrop, spawnInterval);
  levelTimer = setInterval(increaseDifficulty, 5000);
  gameLoop();
}

// ===== 그리기 =====
function drawPlayer() {
  // 무적 효과 비주얼(오라)
  if (isShieldActive()) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const r = Math.max(player.width, player.height) * 0.75;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 200, 255, 0.25)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 160, 255, 0.8)";
    ctx.stroke();
    ctx.restore();
  }

  if (player.facing === "right") {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(playerImg, -player.x - player.width, player.y, player.width, player.height);
    ctx.restore();
  }
}

function drawHUD() {
  // 좌상단: 스코어, 레벨, 아이콘 카운트(똥/코인/동백)
  ctx.fillStyle = "black";
  ctx.textAlign = "left";

  ctx.font = "22px Arial";
  ctx.fillText(`Score: ${score}`, 10, 26);

  ctx.font = "18px Arial";
  ctx.fillText(`Level: ${level}`, 10, 50);

  const marginLeft = 10;
  const icon = 20;
  const gap = 6;

  // 줄 간격 베이스
  let y = 56;

  // poop
  y += 6;
  ctx.drawImage(poopImg, marginLeft, y, icon, icon);
  ctx.fillText(`${poopAvoided}`, marginLeft + icon + gap, y + icon - 2);

  // coin
  y += icon + 4;
  ctx.drawImage(coinImg, marginLeft, y, icon, icon);
  ctx.fillText(`${coinsCollected}`, marginLeft + icon + gap, y + icon - 2);

  // dongbak
  y += icon + 4;
  ctx.drawImage(dongbakImg, marginLeft, y, icon, icon);
  ctx.fillText(`${dongbakCollected}`, marginLeft + icon + gap, y + icon - 2);

  // 게임오버 메시지
  if (gameOver) {
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width/2, 280);
    ctx.font = "18px Arial";
    ctx.fillText(
      `Score: ${score} | Dodged: ${poopAvoided} | Coins: ${coinsCollected} | Dongbak: ${dongbakCollected}`,
      canvas.width/2, 314
    );
    ctx.fillText("Press R to Restart", canvas.width/2, 345);
  }
}

// ===== 루프 =====
function gameLoop() {
  if (gameOver) { drawHUD(); return; }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 이동
  if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
  if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

  // 플레이어
  drawPlayer();

  // 똥 업데이트
  for (let i = 0; i < poops.length; i++) {
    const p = poops[i];
    p.y += p.speed;
    ctx.drawImage(poopImg, p.x, p.y, p.width, p.height);

    if (isColliding(player, p)) {
      if (isShieldActive()) {
        // 무적이면 똥 제거, 게임 지속
        poops.splice(i, 1);
        i--;
        continue;
      } else {
        gameOver = true;
      }
    }
    if (p.y > canvas.height) {
      poops.splice(i, 1);
      i--;
      poopAvoided++;
      score += 1; // 회피 보상
    }
  }

  // 코인 업데이트
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    c.y += c.speed;
    ctx.drawImage(coinImg, c.x, c.y, c.width, c.height);

    if (isColliding(player, c)) {
      coins.splice(i, 1);
      i--;
      coinsCollected++;
      score += 10; // 코인 보상
      continue;
    }
    if (c.y > canvas.height) {
      coins.splice(i, 1);
      i--;
    }
  }

  // 동백 업데이트
  for (let i = 0; i < dongbaks.length; i++) {
    const d = dongbaks[i];
    d.y += d.speed;
    ctx.drawImage(dongbakImg, d.x, d.y, d.width, d.height);

    if (isColliding(player, d)) {
      dongbaks.splice(i, 1);
      i--;
      dongbakCollected++;
      score += 50;                 // 동백 보상
      shieldUntil = Date.now() + SHIELD_DURATION; // 무적 부여
      continue;
    }
    if (d.y > canvas.height) {
      dongbaks.splice(i, 1);
      i--;
    }
  }

  // HUD
  drawHUD();

  requestAnimationFrame(gameLoop);
}

// ===== 타이머 =====
let spawnTimer;
let levelTimer;

// ===== 이미지 로드 동기화 =====
let imagesLoaded = 0;
function imageLoaded() {
  imagesLoaded++;
  if (imagesLoaded === 4) {
    spawnTimer = setInterval(spawnDrop, spawnInterval);
    levelTimer = setInterval(increaseDifficulty, 5000);
    gameLoop();
  }
}
[playerImg, poopImg, coinImg, dongbakImg].forEach(img => {
  img.onload = imageLoaded;
  if (img.complete) imageLoaded();
});
