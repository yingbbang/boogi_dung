<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
  <title>부기 피하기</title>
  <style>
    html, body {
      margin: 0; padding: 0; height: 100%; background: #f7f7fb; touch-action: none;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    }
    #wrap {
      height: 100%; display: grid; grid-template-rows: 1fr auto; place-items: center; gap: 8px;
    }
    #stage {
      display: grid; place-items: center; width: 100%; height: 100%;
    }
    canvas {
      background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08);
      touch-action: none;
    }
    /* 모바일 컨트롤 */
    #controls {
      position: sticky; bottom: 0; width: 100%;
      display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px;
      padding: env(safe-area-inset-bottom) 12px 12px 12px;
      box-sizing: border-box; background: linear-gradient(180deg, rgba(247,247,251,.0), rgba(247,247,251,.85) 40%, rgba(247,247,251,1));
      backdrop-filter: saturate(1.2) blur(6px);
    }
    .btn {
      -webkit-tap-highlight-color: transparent;
      user-select: none; text-align: center; border-radius: 14px; padding: 14px 12px; font-weight: 700; font-size: 18px;
      background: #eef1ff; box-shadow: inset 0 -2px 0 rgba(0,0,0,.06); border: 2px solid #dde3ff;
    }
    .btn:active, .btn.active { transform: translateY(1px); background:#e1e6ff; }
    .btn.primary { background: #e6fff2; border-color: #c9f9df; }
    .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }
  </style>
</head>
<body>
<div id="wrap">
  <div id="stage">
    <!-- 고정 해상도 캔버스: 내부 논리크기 400x600, CSS로 반응형 스케일 -->
    <canvas id="gameCanvas" width="400" height="600" aria-label="game canvas"></canvas>
  </div>

  <div id="controls">
    <button id="btnLeft"  class="btn" aria-label="왼쪽"><span aria-hidden="true">◀ 왼쪽</span></button>
    <button id="btnRight" class="btn" aria-label="오른쪽"><span aria-hidden="true">오른쪽 ▶</span></button>
    <button id="btnRestart" class="btn primary" aria-label="다시하기"><span aria-hidden="true">⟳ 다시</span></button>
  </div>
</div>

<script>
/* ====== 유틸: 화면 리사이즈(고정 비율 2:3, 최대 96vh) ====== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function fitCanvas() {
  const pad = 12;
  const vw = document.getElementById('stage').clientWidth - pad*2;
  const vh = document.getElementById('stage').clientHeight - pad*2 - document.getElementById('controls').offsetHeight;
  // 400x600 기준 비율 유지
  const scale = Math.min(vw / 400, vh / 600, 1.0);
  canvas.style.width  = (400 * scale) + "px";
  canvas.style.height = (600 * scale) + "px";
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 200));
document.addEventListener('DOMContentLoaded', fitCanvas);

/* ====== 원본 게임 로직 ====== */
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

// ===== 입력(키보드 + 모바일 가상키/스와이프/기울기) =====
const keys = { ArrowLeft: false, ArrowRight: false };
document.addEventListener("keydown", e => {
  if (e.code in keys) {
    keys[e.code] = true;
    if (e.code === "ArrowLeft") player.facing = "left";
    if (e.code === "ArrowRight") player.facing = "right";
  }
  if (gameOver && e.code === "KeyR") restartGame();
}, {passive:false});
document.addEventListener("keyup", e => { if (e.code in keys) keys[e.code] = false; }, {passive:false});

/* --- 모바일: 터치 버튼 --- */
function bindHoldButton(el, onDown, onUp) {
  const down = () => { el.classList.add('active'); onDown(); };
  const up   = () => { el.classList.remove('active'); onUp(); };

  el.addEventListener('pointerdown', (e)=>{ e.preventDefault(); down(); }, {passive:false});
  el.addEventListener('pointerup',   (e)=>{ e.preventDefault(); up(); },   {passive:false});
  el.addEventListener('pointercancel',(e)=>{ e.preventDefault(); up(); },  {passive:false});
  el.addEventListener('pointerleave',(e)=>{ e.preventDefault(); up(); },   {passive:false});

  // 멀티터치 지원
  el.addEventListener('touchstart', (e)=>{ e.preventDefault(); down(); }, {passive:false});
  el.addEventListener('touchend',   (e)=>{ e.preventDefault(); up(); },   {passive:false});
}

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnRestart = document.getElementById('btnRestart');

bindHoldButton(btnLeft,
  () => { keys.ArrowLeft = true;  player.facing = "left";  },
  () => { keys.ArrowLeft = false; }
);
bindHoldButton(btnRight,
  () => { keys.ArrowRight = true; player.facing = "right"; },
  () => { keys.ArrowRight = false; }
);
btnRestart.addEventListener('click', (e)=>{ e.preventDefault(); if (gameOver) restartGame(); }, {passive:false});

/* --- 모바일: 스와이프 제스처(왼/오) --- */
let touchStartX = null;
document.addEventListener('touchstart', (e)=>{
  if (!e.touches || e.touches.length===0) return;
  touchStartX = e.touches[0].clientX;
}, {passive:false});
document.addEventListener('touchmove', (e)=>{
  if (touchStartX==null) return;
  const dx = e.touches[0].clientX - touchStartX;
  const dead = 12; // 데드존
  if (dx < -dead) { keys.ArrowLeft = true; keys.ArrowRight = false; player.facing="left"; }
  else if (dx > dead) { keys.ArrowRight = true; keys.ArrowLeft = false; player.facing="right"; }
  e.preventDefault();
}, {passive:false});
document.addEventListener('touchend', ()=>{
  touchStartX = null;
  // 손 떼면 멈춤
  keys.ArrowLeft = false; keys.ArrowRight = false;
}, {passive:false});

/* --- 모바일: 기울기(선택적) --- */
let tiltEnabled = false;
function enableTiltOnce() {
  if (tiltEnabled) return;
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS: 사용자 제스처 후 권한 요청
    btnLeft.addEventListener('click', ()=>DeviceOrientationEvent.requestPermission().then(state=>{
      if (state === 'granted') tiltEnabled = true;
    }).catch(()=>{}), {once:true});
  } else {
    // 안드/데스크탑: 바로 사용 가능
    tiltEnabled = true;
  }
}
enableTiltOnce();

window.addEventListener('deviceorientation', (e)=>{
  if (!tiltEnabled || gameOver) return;
  const gamma = e.gamma; // 좌우 기울기 (-90 ~ 90)
  if (gamma == null) return;
  const threshold = 5; // 민감도
  if (gamma < -threshold) { keys.ArrowLeft = true; keys.ArrowRight = false; player.facing="left"; }
  else if (gamma > threshold) { keys.ArrowRight = true; keys.ArrowLeft = false; player.facing="right"; }
  else { keys.ArrowLeft = keys.ArrowRight = false; }
});

/* ===== 이미지 ===== */
const playerImg  = new Image(); playerImg.src  = "player.png";
const poopImg    = new Image(); poopImg.src    = "poop.png";
const coinImg    = new Image(); coinImg.src    = "coin.png";
const dongbakImg = new Image(); dongbakImg.src = "dongbak.png";

/* ===== 스폰 ===== */
/** 드롭 1개 스폰: 똥 60% / 코인 28% / 동백 12% — 동시 상한 */
const MAX_DROPS = 6;
function spawnDrop() {
  const totalDrops = poops.length + coins.length + dongbaks.length;
  if (totalDrops >= MAX_DROPS) return;

  const size = 30;
  const x = Math.random() * (canvas.width - size);
  const roll = Math.random();

  if (roll < 0.60) {
    poops.push({ x, y: -size, width: size, height: size, speed: poopSpeed + Math.random() * 1.5 });
  } else if (roll < 0.88) {
    coins.push({ x, y: -size, width: size, height: size, speed: coinSpeed + Math.random() * 1.2 });
  } else {
    dongbaks.push({ x, y: -size, width: size, height: size, speed: dongbakSpeed + Math.random() * 1.0 });
  }
}

/* ===== 충돌 ===== */
function isColliding(a, b) {
  return !(a.x > b.x + b.width ||
           a.x + a.width < b.x ||
           a.y > b.y + b.height ||
           a.y + a.height < b.y);
}

/* ===== 난이도 곡선 ===== */
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

/* ===== 재시작 ===== */
function restartGame() {
  poops = []; coins = []; dongbaks = [];
  poopAvoided = 0; coinsCollected = 0; dongbakCollected = 0; score = 0;
  gameOver = false; level = 1;
  spawnInterval = 700; poopSpeed = 3; coinSpeed = 2.6; dongbakSpeed = 2.4; shieldUntil = 0;
  player.x = 180; player.facing = "right";

  clearInterval(spawnTimer); clearInterval(levelTimer);
  spawnTimer = setInterval(spawnDrop, spawnInterval);
  levelTimer = setInterval(increaseDifficulty, 5000);
  gameLoop();
}

/* ===== 그리기 ===== */
function drawPlayer() {
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
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.font = "22px Arial";
  ctx.fillText(`Score: ${score}`, 10, 26);

  ctx.font = "18px Arial";
  ctx.fillText(`Level: ${level}`, 10, 50);

  const marginLeft = 10, icon = 20, gap = 6;
  let y = 56;

  y += 6;
  ctx.drawImage(poopImg, marginLeft, y, icon, icon);
  ctx.fillText(`${poopAvoided}`, marginLeft + icon + gap, y + icon - 2);

  y += icon + 4;
  ctx.drawImage(coinImg, marginLeft, y, icon, icon);
  ctx.fillText(`${coinsCollected}`, marginLeft + icon + gap, y + icon - 2);

  y += icon + 4;
  ctx.drawImage(dongbakImg, marginLeft, y, icon, icon);
  ctx.fillText(`${dongbakCollected}`, marginLeft + icon + gap, y + icon - 2);

  if (gameOver) {
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width/2, 280);
    ctx.font = "18px Arial";
    ctx.fillText(
      `Score: ${score} | Dodged: ${poopAvoided} | Coins: ${coinsCollected} | Dongbak: ${dongbakCollected}`,
      canvas.width/2, 314
    );
    ctx.fillText("Press R or Tap ⟳", canvas.width/2, 345);
  }
}

/* ===== 루프 ===== */
function gameLoop() {
  if (gameOver) { drawHUD(); return; }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 이동
  if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
  if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

  // 플레이어
  drawPlayer();

  // 똥
  for (let i = 0; i < poops.length; i++) {
    const p = poops[i];
    p.y += p.speed;
    ctx.drawImage(poopImg, p.x, p.y, p.width, p.height);

    if (isColliding(player, p)) {
      if (isShieldActive()) { poops.splice(i, 1); i--; continue; }
      else { gameOver = true; }
    }
    if (p.y > canvas.height) {
      poops.splice(i, 1); i--; poopAvoided++; score += 1;
    }
  }

  // 코인
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    c.y += c.speed;
    ctx.drawImage(coinImg, c.x, c.y, c.width, c.height);

    if (isColliding(player, c)) {
      coins.splice(i, 1); i--; coinsCollected++; score += 10; continue;
    }
    if (c.y > canvas.height) { coins.splice(i, 1); i--; }
  }

  // 동백
  for (let i = 0; i < dongbaks.length; i++) {
    const d = dongbaks[i];
    d.y += d.speed;
    ctx.drawImage(dongbakImg, d.x, d.y, d.width, d.height);

    if (isColliding(player, d)) {
      dongbaks.splice(i, 1); i--; dongbakCollected++; score += 50;
      shieldUntil = Date.now() + SHIELD_DURATION; continue;
    }
    if (d.y > canvas.height) { dongbaks.splice(i, 1); i--; }
  }

  drawHUD();
  requestAnimationFrame(gameLoop);
}

/* ===== 타이머 ===== */
let spawnTimer;
let levelTimer;

/* ===== 이미지 로드 동기화 ===== */
let imagesLoaded = 0;
function imageLoaded() {
  imagesLoaded++;
  if (imagesLoaded === 4) {
    clearInterval(spawnTimer); clearInterval(levelTimer);
    spawnTimer = setInterval(spawnDrop, spawnInterval);
    levelTimer = setInterval(increaseDifficulty, 5000);
    gameLoop();
  }
}
[playerImg, poopImg, coinImg, dongbakImg].forEach(img => {
  img.onload = imageLoaded;
  if (img.complete) imageLoaded();
});

/* 스크롤 방지(게임 중 제스처) */
['touchstart','touchmove','touchend','gesturestart'].forEach(t =>
  document.addEventListener(t, (e)=>{ e.preventDefault(); }, {passive:false})
);
</script>
</body>
</html>
