// === 부팅 가드 ===
(function boot() {
  try {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return fatal('canvas 요소를 찾지 못했습니다. id="gameCanvas" 확인');
    const ctx = canvas.getContext('2d');
    if (!ctx) return fatal('2D 컨텍스트를 생성하지 못했습니다.');

    // 전역 노출
    window.__game = { canvas, ctx };
    // 초기 프레임(로딩 표시) — 화면 흰색 방지
    ctx.fillStyle = '#000';
    ctx.font = '18px Arial';
    ctx.fillText('Loading...', 160, 300);

    // 실제 게임 초기화
    init();
  } catch (e) {
    fatal('부팅 중 예외: ' + (e && e.message ? e.message : e));
  }

  function fatal(msg) {
    const layer = document.getElementById('bootError');
    if (layer) {
      layer.style.display = 'grid';
      layer.querySelector('pre').textContent = msg;
    } else {
      alert(msg);
    }
  }
})();

// === 실제 게임 ===
function init() {
  const canvas = __game.canvas;
  const ctx = __game.ctx;

  // 리사이즈
  function fitCanvas() {
    const controls = document.getElementById('controls');
    const pad = 12;
    const vw = Math.max(320, document.getElementById('stage').clientWidth - pad*2);
    const availH = Math.max(520, window.innerHeight - controls.offsetHeight - pad*2);
    const scale = Math.min(vw / 400, availH / 600, 1.0);
    canvas.style.width  = (400 * scale) + "px";
    canvas.style.height = (600 * scale) + "px";
  }
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 200));
  document.addEventListener('DOMContentLoaded', fitCanvas);
  fitCanvas();

  // 상태
  const player = { x: 160, y: 520, width: 80, height: 80, speed: 5, facing: "right" };
  let poops=[], coins=[], dongbaks=[];
  let poopAvoided=0, coinsCollected=0, dongbakCollected=0;
  let score=0, gameOver=false, level=1;
  let spawnInterval=700, poopSpeed=3, coinSpeed=2.6, dongbakSpeed=2.4;
  const SHIELD_DURATION=4000; let shieldUntil=0;
  const isShieldActive = ()=> Date.now() < shieldUntil;

  // 입력
  const keys = { ArrowLeft:false, ArrowRight:false };
  const resetInputs = ()=>{ keys.ArrowLeft=false; keys.ArrowRight=false; };
  document.addEventListener("keydown", e => {
    if (e.code in keys) {
      keys[e.code]=true;
      player.facing = (e.code === "ArrowLeft") ? "left" : "right";
    }
    if (gameOver && e.code === "KeyR") startGame();
  });
  document.addEventListener("keyup", e => { if (e.code in keys) keys[e.code]=false; });

  // 가상 버튼
  function bindHoldButton(el, onDown, onUp) {
    const down = () => { el.classList.add('active'); onDown(); };
    const up   = () => { el.classList.remove('active'); onUp(); };
    el.addEventListener('pointerdown', e=>{ e.preventDefault(); down(); }, {passive:false});
    el.addEventListener('pointerup',   e=>{ e.preventDefault(); up(); },   {passive:false});
    el.addEventListener('pointercancel', e=>{ e.preventDefault(); up(); }, {passive:false});
    el.addEventListener('pointerleave',  e=>{ e.preventDefault(); up(); }, {passive:false});
    el.addEventListener('touchstart', e=>{ e.preventDefault(); down(); }, {passive:false});
    el.addEventListener('touchend',   e=>{ e.preventDefault(); up(); },   {passive:false});
  }
  const btnLeft  = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  bindHoldButton(btnLeft,  ()=>{ keys.ArrowLeft=true; keys.ArrowRight=false; player.facing="left";  }, ()=>{ keys.ArrowLeft=false; });
  bindHoldButton(btnRight, ()=>{ keys.ArrowRight=true;keys.ArrowLeft=false; player.facing="right"; }, ()=>{ keys.ArrowRight=false; });

  // 스와이프
  let touchStartX=null;
  document.addEventListener('touchstart', e=>{
    if (!e.touches || e.touches.length===0) return;
    touchStartX = e.touches[0].clientX;
  }, {passive:false});
  document.addEventListener('touchmove', e=>{
    if (touchStartX==null) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dead = 14;
    if (dx < -dead) { keys.ArrowLeft=true; keys.ArrowRight=false; player.facing="left";  }
    else if (dx > dead) { keys.ArrowRight=true; keys.ArrowLeft=false; player.facing="right"; }
    e.preventDefault();
  }, {passive:false});
  document.addEventListener('touchend', ()=>{ touchStartX=null; resetInputs(); }, {passive:false});

  document.addEventListener('visibilitychange', ()=>{ if (document.hidden) resetInputs(); });
  window.addEventListener('blur', resetInputs);

  // 이미지
  const playerImg  = new Image(); playerImg.src  = "player.png";
  const poopImg    = new Image(); poopImg.src    = "poop.png";
  const coinImg    = new Image(); coinImg.src    = "coin.png";
  const dongbakImg = new Image(); dongbakImg.src = "dongbak.png";
  const ready = (img)=> img && img.complete && img.naturalWidth>0;
  const drawSafe = (img,x,y,w,h,color)=> ready(img) ? ctx.drawImage(img,x,y,w,h) : (ctx.fillStyle=color, ctx.fillRect(x,y,w,h));

  // 스폰
  const MAX_DROPS=6;
  function spawnDrop(){
    const total = poops.length + coins.length + dongbaks.length;
    if (total >= MAX_DROPS) return;
    const size=30, x=Math.random()*(canvas.width-size), roll=Math.random();
    if (roll<0.60) poops.push({x,y:-size,width:size,height:size,speed:poopSpeed+Math.random()*1.5});
    else if (roll<0.88) coins.push({x,y:-size,width:size,height:size,speed:coinSpeed+Math.random()*1.2});
    else dongbaks.push({x,y:-size,width:size,height:size,speed:dongbakSpeed+Math.random()*1.0});
  }

  // 충돌
  const isColliding=(a,b)=> !(a.x>b.x+b.width || a.x+a.width<b.x || a.y>b.y+b.height || a.y+a.height<b.y);

  // 난이도
  function increaseDifficulty(){
    if (gameOver) return;
    level++;
    poopSpeed+=0.35; coinSpeed+=0.25; dongbakSpeed+=0.20;
    spawnInterval = Math.max(220, spawnInterval-60);
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnDrop, spawnInterval);
  }

  // 그리기
  function drawPlayer(){
    if (isShieldActive()){
      ctx.save(); ctx.globalAlpha=0.5; ctx.beginPath();
      const cx=player.x+player.width/2, cy=player.y+player.height/2;
      const r=Math.max(player.width,player.height)*0.75;
      ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fillStyle="rgba(0, 200, 255, 0.25)"; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle="rgba(0,160,255,0.8)"; ctx.stroke();
      ctx.restore();
    }
    if (player.facing==="right") drawSafe(playerImg, player.x, player.y, player.width, player.height, "#4a90e2");
    else { ctx.save(); ctx.scale(-1,1);
      if (ready(playerImg)) ctx.drawImage(playerImg, -player.x-player.width, player.y, player.width, player.height);
      else { ctx.fillStyle="#4a90e2"; ctx.fillRect(-player.x-player.width, player.y, player.width, player.height); }
      ctx.restore();
    }
  }
  function drawHUD(){
    ctx.fillStyle="black"; ctx.textAlign="left";
    ctx.font="22px Arial"; ctx.fillText(`Score: ${score}`,10,26);
    ctx.font="18px Arial"; ctx.fillText(`Level: ${level}`,10,50);
    const m=10, icon=20, gap=6; let y=62;
    drawSafe(poopImg, m,y,icon,icon,"#6b4e16"); ctx.fillText(`${poopAvoided}`, m+icon+gap, y+icon-2);
    y+=icon+4;
    drawSafe(coinImg, m,y,icon,icon,"#d4af37"); ctx.fillText(`${coinsCollected}`, m+icon+gap, y+icon-2);
    y+=icon+4;
    drawSafe(dongbakImg, m,y,icon,icon,"#e8475b"); ctx.fillText(`${dongbakCollected}`, m+icon+gap, y+icon-2);
  }

  // 루프
  function gameLoop(){
    if (gameOver) { drawHUD(); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (keys.ArrowLeft && player.x>0) player.x -= player.speed;
    if (keys.ArrowRight && player.x<canvas.width-player.width) player.x += player.speed;

    drawPlayer();

    for (let i=0;i<poops.length;i++){
      const p=poops[i]; p.y+=p.speed; drawSafe(poopImg,p.x,p.y,p.width,p.height,"#6b4e16");
      if (isColliding(player,p)) { if (isShieldActive()) { poops.splice(i,1); i--; } else { endGame(); break; } }
      else if (p.y>canvas.height){ poops.splice(i,1); i--; poopAvoided++; score+=1; }
    }
    for (let i=0;i<coins.length;i++){
      const c=coins[i]; c.y+=c.speed; drawSafe(coinImg,c.x,c.y,c.width,c.height,"#d4af37");
      if (isColliding(player,c)) { coins.splice(i,1); i--; coinsCollected++; score+=10; }
      else if (c.y>canvas.height){ coins.splice(i,1); i--; }
    }
    for (let i=0;i<dongbaks.length;i++){
      const d=dongbaks[i]; d.y+=d.speed; drawSafe(dongbakImg,d.x,d.y,d.width,d.height,"#e8475b");
      if (isColliding(player,d)) { dongbaks.splice(i,1); i--; dongbakCollected++; score+=50; shieldUntil=Date.now()+SHIELD_DURATION; }
      else if (d.y>canvas.height){ dongbaks.splice(i,1); i--; }
    }

    drawHUD();
    requestAnimationFrame(gameLoop);
  }

  // 타이머
  let spawnTimer=null, levelTimer=null;

  // 중앙 배치 + 시작/종료
  function centerPlayer(){
    player.x = Math.round((canvas.width - player.width)/2);
    player.y = 520;
    player.facing = "right";
  }
  function startGame(){
    hideOverlay();
    resetInputs();
    poops=[]; coins=[]; dongbaks=[];
    poopAvoided=0; coinsCollected=0; dongbakCollected=0;
    score=0; gameOver=false; level=1;
    spawnInterval=700; poopSpeed=3; coinSpeed=2.6; dongbakSpeed=2.4; shieldUntil=0;
    centerPlayer();
    clearInterval(spawnTimer); clearInterval(levelTimer);
    spawnTimer=setInterval(spawnDrop, spawnInterval);
    levelTimer=setInterval(increaseDifficulty, 5000);
    requestAnimationFrame(gameLoop);
  }
  function endGame(){
    gameOver=true;
    clearInterval(spawnTimer); clearInterval(levelTimer);
    resetInputs();
    showGameOverScreen();
  }

  // 오버레이
  const overlay=document.getElementById('overlay');
  const overlayMsg=document.getElementById('overlayMsg');
  const overlayTitle=document.getElementById('overlayTitle');
  const statsBox=document.getElementById('stats');
  const startBtn=document.getElementById('startBtn');
  function showStartScreen(){
    overlayTitle.textContent="게임 시작";
    overlayMsg.textContent="왼쪽/오른쪽 버튼을 눌러 부기를 움직이세요.";
    statsBox.style.display="none";
    startBtn.textContent="게임 시작";
    overlay.style.display="flex";
  }
  function showGameOverScreen(){
    overlayTitle.textContent="게임 오버";
    overlayMsg.textContent="다시 도전해 보세요!";
    statsBox.innerHTML = `Score: ${score}<br/>Dodged: ${poopAvoided} | Coins: ${coinsCollected} | Dongbak: ${dongbakCollected}`;
    statsBox.style.display="block";
    startBtn.textContent="게임 시작";
    overlay.style.display="flex";
  }
  function hideOverlay(){ overlay.style.display="none"; }
  startBtn.addEventListener('click', e=>{ e.preventDefault(); startGame(); });

  // 첫 진입 오버레이 표시
  showStartScreen();

  // 스크롤 방지(게임 중에만)
  ['touchstart','touchmove','touchend','gesturestart'].forEach(t =>
    document.addEventListener(t, e=>{ if (overlay.style.display!=="flex") e.preventDefault(); }, {passive:false})
  );
}
