// === 부팅 ===
(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if(!ctx){ const e=document.getElementById('bootErr'); e.style.display='grid'; e.firstChild.textContent='Canvas 2D 실패'; return; }
  ctx.fillStyle='#000'; ctx.font='18px Arial'; ctx.fillText('Loading...',160,300);
  window.__game = { canvas, ctx };
  init();
})();

// === 게임 ===
function init(){
  const canvas = __game.canvas, ctx = __game.ctx;
  const titleEl = document.getElementById('titleImg');

  // 반응형: 타이틀+캔버스가 함께 화면에 들어가도록 스케일
  function titleRatio(){ return (titleEl && titleEl.naturalWidth>0) ? (titleEl.naturalHeight/titleEl.naturalWidth) : 0.25; }
  function fitCanvas(){
    const stage = document.getElementById('stage');
    const vw = Math.max(320, stage.clientWidth - 24);
    const vh = Math.max(520, stage.clientHeight - 24);
    const baseW=400, baseH=600;
    const r = titleRatio();          // 타이틀 h = r * w
    const byH = vh / (baseH + r*baseW + 8); // 8px gap 포함
    const byW = vw / baseW;
    const s = Math.min(byW, byH, 1);
    const w = (baseW*s)+'px', h=(baseH*s)+'px';
    canvas.style.width=w; canvas.style.height=h;
    if(titleEl){ titleEl.style.width=w; } // 높이는 비율 유지
  }
  addEventListener('resize', fitCanvas);
  addEventListener('orientationchange', ()=>setTimeout(fitCanvas,200));
  if(titleEl && !titleEl.complete){ titleEl.addEventListener('load', fitCanvas); titleEl.addEventListener('error', fitCanvas); }
  fitCanvas();

  // 상태
  const player = { x:160, y:520, width:80, height:80, speed:5, facing:'right' };
  let poops=[], coins=[], dongbaks=[];
  let poopAvoided=0, coinsCollected=0, dongbakCollected=0;
  let score=0, level=1, gameOver=false;
  let spawnInterval=700, poopSpeed=3, coinSpeed=2.6, dongbakSpeed=2.4;
  const SHIELD_DURATION=4000; let shieldUntil=0;
  const isShield=()=>Date.now()<shieldUntil;

  // 입력
  const keys={ArrowLeft:false, ArrowRight:false};
  const resetInputs=()=>{ keys.ArrowLeft=false; keys.ArrowRight=false; };
  addEventListener('keydown',e=>{ if(e.code in keys){ keys[e.code]=true; player.facing=(e.code==='ArrowLeft')?'left':'right'; } if(gameOver&&e.code==='KeyR') start(); });
  addEventListener('keyup',e=>{ if(e.code in keys) keys[e.code]=false; });

  function bindHold(el, down, up){
    const d=()=>{ el.classList.add('active'); down(); };
    const u=()=>{ el.classList.remove('active'); up(); };
    el.addEventListener('pointerdown',e=>{e.preventDefault(); d();},{passive:false});
    el.addEventListener('pointerup',e=>{e.preventDefault(); u();},{passive:false});
    el.addEventListener('pointercancel',e=>{e.preventDefault(); u();},{passive:false});
    el.addEventListener('pointerleave',e=>{e.preventDefault(); u();},{passive:false});
    el.addEventListener('touchstart',e=>{e.preventDefault(); d();},{passive:false});
    el.addEventListener('touchend',e=>{e.preventDefault(); u();},{passive:false});
  }
  bindHold(document.getElementById('btnLeft'),
    ()=>{keys.ArrowLeft=true; keys.ArrowRight=false; player.facing='left';},
    ()=>{keys.ArrowLeft=false;}
  );
  bindHold(document.getElementById('btnRight'),
    ()=>{keys.ArrowRight=true; keys.ArrowLeft=false; player.facing='right';},
    ()=>{keys.ArrowRight=false;}
  );

  let touchX=null;
  addEventListener('touchstart',e=>{ if(e.touches&&e.touches.length){ touchX=e.touches[0].clientX; } }, {passive:false});
  addEventListener('touchmove',e=>{
    if(touchX==null) return;
    const dx=e.touches[0].clientX-touchX, dead=14;
    if(dx<-dead){ keys.ArrowLeft=true; keys.ArrowRight=false; player.facing='left'; }
    else if(dx>dead){ keys.ArrowRight=true; keys.ArrowLeft=false; player.facing='right'; }
    e.preventDefault();
  }, {passive:false});
  addEventListener('touchend',()=>{ touchX=null; resetInputs(); }, {passive:false});
  addEventListener('visibilitychange',()=>{ if(document.hidden) resetInputs(); });
  addEventListener('blur', resetInputs);

  // 이미지
  const playerImg=new Image(); playerImg.src='player.png';
  const poopImg  =new Image(); poopImg.src  ='poop.png';
  const coinImg  =new Image(); coinImg.src  ='coin.png';
  const dongImg  =new Image(); dongImg.src  ='dongbak.png';
  const ready=i=>i&&i.complete&&i.naturalWidth>0;
  const drawSafe=(img,x,y,w,h,c)=> ready(img)?ctx.drawImage(img,x,y,w,h):(ctx.fillStyle=c,ctx.fillRect(x,y,w,h));

  // 스폰
  const MAX_DROPS=6;
  function spawn(){
    const tot=poops.length+coins.length+dongbaks.length;
    if(tot>=MAX_DROPS) return;
    const size=30, x=Math.random()*(canvas.width-size), r=Math.random();
    if(r<0.60)      poops.push({x,y:-size,width:size,height:size,speed:poopSpeed+Math.random()*1.5});
    else if(r<0.88) coins.push({x,y:-size,width:size,height:size,speed:coinSpeed+Math.random()*1.2});
    else            dongbaks.push({x,y:-size,width:size,height:size,speed:dongbakSpeed+Math.random()*1.0});
  }
  const hit=(a,b)=>!(a.x>b.x+b.width||a.x+a.width<b.x||a.y>b.y+b.height||a.y+a.height<b.y);

  // 난이도
  function harder(){
    if(gameOver) return;
    level++; poopSpeed+=0.35; coinSpeed+=0.25; dongbakSpeed+=0.20;
    spawnInterval=Math.max(220,spawnInterval-60);
    clearInterval(spawnTimer); spawnTimer=setInterval(spawn,spawnInterval);
  }

  // HUD DOM 업데이트
  function hud(){
    document.getElementById('hudScore').textContent=`Score: ${score}`;
    document.getElementById('hudLevel').textContent=`Level: ${level}`;
    document.getElementById('hudPoop').textContent=poopAvoided;
    document.getElementById('hudCoin').textContent=coinsCollected;
    document.getElementById('hudDongbak').textContent=dongbakCollected;
  }

  // 렌더
  function drawPlayer(){
    if(isShield()){
      ctx.save(); ctx.globalAlpha=.5; ctx.beginPath();
      const cx=player.x+player.width/2, cy=player.y+player.height/2, r=Math.max(player.width,player.height)*.75;
      ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='rgba(0,200,255,.25)'; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='rgba(0,160,255,.8)'; ctx.stroke(); ctx.restore();
    }
    if(player.facing==='right') drawSafe(playerImg,player.x,player.y,player.width,player.height,'#4a90e2');
    else { ctx.save(); ctx.scale(-1,1);
      if(ready(playerImg)) ctx.drawImage(playerImg, -player.x-player.width, player.y, player.width, player.height);
      else { ctx.fillStyle='#4a90e2'; ctx.fillRect(-player.x-player.width, player.y, player.width, player.height); }
      ctx.restore();
    }
  }

  function loop(){
    if(gameOver){ hud(); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(keys.ArrowLeft && player.x>0) player.x-=player.speed;
    if(keys.ArrowRight && player.x<canvas.width-player.width) player.x+=player.speed;

    drawPlayer();

    for(let i=0;i<poops.length;i++){
      const p=poops[i]; p.y+=p.speed; drawSafe(poopImg,p.x,p.y,p.width,p.height,'#6b4e16');
      if(hit(player,p)){ if(isShield()){ poops.splice(i,1); i--; } else { end(); break; } }
      else if(p.y>canvas.height){ poops.splice(i,1); i--; poopAvoided++; score+=1; }
    }
    for(let i=0;i<coins.length;i++){
      const c=coins[i]; c.y+=c.speed; drawSafe(coinImg,c.x,c.y,c.width,c.height,'#d4af37');
      if(hit(player,c)){ coins.splice(i,1); i--; coinsCollected++; score+=10; }
      else if(c.y>canvas.height){ coins.splice(i,1); i--; }
    }
    for(let i=0;i<dongbaks.length;i++){
      const d=dongbaks[i]; d.y+=d.speed; drawSafe(dongImg,d.x,d.y,d.width,d.height,'#e8475b');
      if(hit(player,d)){ dongbaks.splice(i,1); i--; dongbakCollected++; score+=50; shieldUntil=Date.now()+SHIELD_DURATION; }
      else if(d.y>canvas.height){ dongbaks.splice(i,1); i--; }
    }

    hud();
    requestAnimationFrame(loop);
  }

  // 플로우
  let spawnTimer=null, levelTimer=null;
  function centerPlayer(){ player.x=Math.round((canvas.width-player.width)/2); player.y=520; player.facing='right'; }
  function start(){
    hideOverlay(); resetInputs();
    poops=[]; coins=[]; dongbaks=[];
    poopAvoided=0; coinsCollected=0; dongbakCollected=0; score=0; level=1;
    spawnInterval=700; poopSpeed=3; coinSpeed=2.6; dongbakSpeed=2.4; shieldUntil=0; gameOver=false;
    centerPlayer(); hud();
    clearInterval(spawnTimer); clearInterval(levelTimer);
    spawnTimer=setInterval(spawn,spawnInterval); levelTimer=setInterval(harder,5000);
    requestAnimationFrame(loop);
  }
  function end(){ gameOver=true; clearInterval(spawnTimer); clearInterval(levelTimer); resetInputs(); showOver(); }

  // 오버레이
  const overlay=document.getElementById('overlay');
  const title=document.getElementById('overlayTitle');
  const msg=document.getElementById('overlayMsg');
  const stats=document.getElementById('stats');
  const btn=document.getElementById('startBtn');

  function showStart(){ title.textContent='게임 시작'; msg.textContent='왼쪽/오른쪽 버튼으로 이동하세요.'; stats.style.display='none'; btn.textContent='게임 시작'; overlay.style.display='flex'; }
  function showOver(){ title.textContent='게임 오버'; msg.textContent='다시 도전!'; stats.innerHTML=`Score: ${score}<br/>Dodged: ${poopAvoided} | Coins: ${coinsCollected} | Dongbak: ${dongbakCollected}`; stats.style.display='block'; btn.textContent='게임 시작'; overlay.style.display='flex'; }
  function hideOverlay(){ overlay.style.display='none'; }
  btn.addEventListener('click', e=>{ e.preventDefault(); start(); });

  showStart();

  // 게임 중 스크롤 방지
  ['touchstart','touchmove','touchend','gesturestart'].forEach(t=>addEventListener(t, e=>{ if(overlay.style.display!=='flex') e.preventDefault(); }, {passive:false}));
}
