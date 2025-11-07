// Space Love Countdown — 手账可爱卡通风格（纯 Canvas + CSS）
// 技术栈：HTML5 Canvas 动画 + CSS3 翻牌样式 + YouTube IFrame 控制

// =============================
// 配置与常量
// =============================
const TARGET_DATE = new Date('2025-11-10T21:00:00+02:00'); // 开罗时间 (UTC+2)
const FLIGHT_PERIOD = 10_000; // 每 10 秒单程飞行
const CANVAS_ID = 'scene';
const BUBBLE_LAYER_ID = 'bubble-layer';
const DANMU_LAYER_ID = 'danmu-layer';

const LOVE_LINES = [
  '我把你的名字存进闹钟里，每跳一秒，都把你从安曼往我这边推近一毫米',
  '回来时，把一路的辛苦像沙尘轻轻拍落，我们继续在开罗喧嚣街头穿行',
  '我不催风，只把房间收拾成你熟悉的样子：杯沿的薄痕、窗台的小猫、炉子上的番茄汤',
  '倒计时在走，我的心也在走，一步一步向你',
  '等你回来，我要你听听我的心脏，每一下都在说喜欢你',
  '猜你在返程机场路上，开车会不会有微笑，到家后是先抱我还是leo？',
  '杨田菲，吴当当想你啦！',
];

// =============================
// Canvas 初始化
// =============================
const canvas = document.getElementById(CANVAS_ID);
const ctx = canvas.getContext('2d');
// 依据窗口尺寸重算画布与城市/路径/星空
let stars = [];
let milkyStars = [];
let amman, cairo;
let ctrl1, ctrl2;
// 弹幕车道（防重叠）
let danmuLanes = [];

function regenStars(){
  stars = Array.from({length: 160}, () => ({
    x: rand(0, canvas.width), y: rand(0, canvas.height*0.8), r: rand(0.9, 2.4), rot: rand(0, Math.PI)
  }));
  // 银河：沿对角带状分布的小星点
  milkyStars = Array.from({length: 220}, () => {
    const t = Math.random();
    const x = canvas.width * (0.06 + 0.88 * t);
    const yCenter = canvas.height * (0.16 + 0.14 * t);
    const y = yCenter + rand(-28, 28);
    return { x, y, r: rand(0.5, 1.6), a: rand(0.4, 0.85) };
  });
}

function updateCities(){
  amman = { x: canvas.width * 0.30, y: canvas.height * 0.66 };
  cairo = { x: canvas.width * 0.70, y: canvas.height * 0.58 };
}

function updateControls(){
  ctrl1 = { x: (amman.x + cairo.x)/2 - 90, y: Math.min(amman.y, cairo.y) - 140 };
  ctrl2 = { x: (amman.x + cairo.x)/2 + 70, y: Math.min(amman.y, cairo.y) - 120 };
}

function resizeCanvas(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  updateCities();
  updateControls();
  regenStars();
  computeDanmuLanes();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// =============================
// 手绘背景元素（星星/月亮/云朵/地球剪影）
// =============================
function rand(min, max){ return Math.random() * (max - min) + min; }
function drawStar(x, y, r, rot){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const outer = r;
    const inner = r * 0.45;
    ctx.lineTo(Math.cos((18 + i*72) * Math.PI/180) * outer,
               -Math.sin((18 + i*72) * Math.PI/180) * outer);
    ctx.lineTo(Math.cos((54 + i*72) * Math.PI/180) * inner,
               -Math.sin((54 + i*72) * Math.PI/180) * inner);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 230, 170, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 200, 200, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// 月牙：两圆叠加形成“缺口”，并加入柔光
function drawMoon(x, y){
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(255, 236, 190, 0.55)'; ctx.shadowBlur = 16;
  // 外圆
  const R = 26;
  const grad = ctx.createRadialGradient(0,0,R*0.2, 0,0,R);
  grad.addColorStop(0, '#fff6e5');
  grad.addColorStop(1, 'rgba(255,226,170,0.20)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();
  // 叠加“挖空”的圆，制造月牙
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(8,0,R*0.92,0,Math.PI*2); ctx.fill();
  // 外描边
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255,226,170,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawCloud(x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fillG = ctx.createLinearGradient(0,-10,0,40);
  fillG.addColorStop(0, 'rgba(248,252,255,0.78)');
  fillG.addColorStop(1, 'rgba(210,226,245,0.55)');
  ctx.fillStyle = fillG; ctx.strokeStyle = 'rgba(110,130,160,0.45)'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0,0,22,0,Math.PI*2);
  ctx.arc(22,-8,18,0,Math.PI*2);
  ctx.arc(46,0,20,0,Math.PI*2);
  ctx.arc(68,-6,16,0,Math.PI*2);
  ctx.arc(86,2,14,0,Math.PI*2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

let cityLights = null;
function drawEarthWatercolor(){
  // 位置靠左下，形成画面层次
  const cx = canvas.width * 0.28; const cy = canvas.height * 0.70; const r = Math.min(canvas.width, canvas.height) * 0.33;
  ctx.save();
  // 外圈柔光
  ctx.shadowColor = 'rgba(210,230,255,0.35)'; ctx.shadowBlur = 18;
  // 主体水彩渐变
  const grad = ctx.createRadialGradient(cx, cy, r*0.18, cx, cy, r);
  grad.addColorStop(0, 'rgba(186,206,246,0.85)');
  grad.addColorStop(0.5, 'rgba(146,176,226,0.78)');
  grad.addColorStop(1, 'rgba(98,126,196,0.72)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  // 云层纹理（简单水彩云块叠加）
  ctx.save(); ctx.clip();
  for(let i=0;i<6;i++){
    const ox = rand(-r*0.6, r*0.6); const oy = rand(-r*0.4, r*0.4);
    const g2 = ctx.createRadialGradient(cx+ox, cy+oy, r*0.05, cx+ox, cy+oy, r*0.22);
    g2.addColorStop(0, 'rgba(250,248,255,0.55)');
    g2.addColorStop(1, 'rgba(180,198,238,0.15)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx+ox, cy+oy, r*0.24, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
  // 城市灯光（暖黄）
  if(!cityLights || cityLights.w!==canvas.width || cityLights.h!==canvas.height){
    cityLights = { w: canvas.width, h: canvas.height, pts: [] };
    for(let i=0;i<160;i++){
      const ang = rand(Math.PI*0.15, Math.PI*0.85);
      const rr = r * rand(0.40, 0.95);
      const px = cx + Math.cos(ang) * rr;
      const py = cy + Math.sin(ang) * rr;
      cityLights.pts.push({ x: px, y: py });
    }
  }
  ctx.shadowColor = 'rgba(255,200,140,0.50)'; ctx.shadowBlur = 10;
  for(const p of cityLights.pts){ ctx.fillStyle = 'rgba(255,210,150,0.88)'; ctx.fillRect(p.x, p.y, 2, 2); }
  // 外圈轻描边
  ctx.strokeStyle = 'rgba(210,230,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

// 生成星空
regenStars();

// =============================
// 城市与手写标签
// =============================
updateCities();

function drawCityLabel(pt, text){
  ctx.save();
  ctx.translate(pt.x, pt.y);
  ctx.fillStyle = '#fff7f0';
  ctx.strokeStyle = 'rgba(255,220,180,0.6)';
  ctx.lineWidth = 2;
  // 标记点
  ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
  // 小心心
  ctx.fillStyle = '#ffb6c1';
  ctx.beginPath(); ctx.moveTo(12, -10);
  ctx.bezierCurveTo(8,-16, 0,-12, 12,-4);
  ctx.bezierCurveTo(24,-12, 16,-16, 12,-10);
  ctx.fill();
  // 文本
  ctx.font = '22px "Patrick Hand", "Baloo 2", cursive';
  ctx.fillStyle = '#ffe9d3';
  ctx.strokeStyle = '#e3bfa3'; ctx.lineWidth = 1.2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.strokeText(text, 0, 10);
  ctx.fillText(text, 0, 10);
  ctx.restore();
}

// =============================
// 弧线飞行路径与飞机/小猫
// =============================
function cubicBezier(p0, p1, p2, p3, t){
  const u = 1 - t;
  const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
  const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
  return {x,y};
}

updateControls();

function drawFlightPath(){
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 179, 107, 0.85)';
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 6]);
  ctx.shadowColor = 'rgba(255, 179, 107, 0.45)'; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(amman.x, amman.y);
  for(let i=1;i<=40;i++){
    const t = i/40;
    const p = cubicBezier(amman, ctrl1, ctrl2, cairo, t);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCutePlaneWithCat(x, y, heading){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  // 机身（更圆润的双翼机）
  ctx.fillStyle = '#fdf7ef';
  ctx.strokeStyle = '#5e748a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-10, -10, 26, 0);
  ctx.quadraticCurveTo(-10, 10, -26, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 上下机翼
  ctx.fillStyle = '#eec7b8';
  ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(12, -10); ctx.lineTo(14, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(16, 12); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
  // 舱窗
  ctx.fillStyle = '#cfe8ff'; ctx.beginPath(); ctx.arc(-12, -2, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4, -1, 3, 0, Math.PI*2); ctx.fill();
  // 灯笼（底部暖光）
  ctx.save(); ctx.translate(0, 16); ctx.fillStyle = '#ffcd8a';
  const gLan = ctx.createRadialGradient(0,0,2, 0,0,8); gLan.addColorStop(0,'#ffd9a6'); gLan.addColorStop(1,'rgba(255,179,107,0.35)');
  ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = gLan; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); ctx.restore();
  // 小猫（黑色剪影，绿眼睛）
  ctx.save(); ctx.translate(6, -10);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill(); // 头
  ctx.beginPath(); ctx.moveTo(-6,-2); ctx.lineTo(-2,-8); ctx.lineTo(0,-2); ctx.closePath(); ctx.fill(); // 左耳
  ctx.beginPath(); ctx.moveTo(6,-2); ctx.lineTo(2,-8); ctx.lineTo(0,-2); ctx.closePath(); ctx.fill(); // 右耳
  ctx.fillStyle = '#7bd48b'; ctx.beginPath(); ctx.arc(-2,0,1.3,0,Math.PI*2); ctx.arc(2,0,1.3,0,Math.PI*2); ctx.fill(); // 眼睛
  ctx.restore();
  // 暖色尾迹光晕
  ctx.shadowColor = 'rgba(255, 179, 107, 0.35)'; ctx.shadowBlur = 10;
  ctx.restore();
}

// 飞机动画状态
let startTime = performance.now();
function resetFlight(){ startTime = performance.now(); }

function drawPlaneAlongPath(time){
  const t = Math.min(1, (time - startTime) / FLIGHT_PERIOD);
  const p = cubicBezier(amman, ctrl1, ctrl2, cairo, t);
  const p2 = cubicBezier(amman, ctrl1, ctrl2, cairo, Math.min(1, t + 0.01));
  const heading = Math.atan2(p2.y - p.y, p2.x - p.x);
  drawCutePlaneWithCat(p.x, p.y, heading);
  if(t >= 1){ resetFlight(); spawnLoveBubble(); }
}

// =============================
// 情话气泡（DOM 叠加）
// =============================
function spawnLoveBubble(){
  const layer = document.getElementById(BUBBLE_LAYER_ID);
  const el = document.createElement('div');
  el.className = 'bubble show';
  el.textContent = LOVE_LINES[Math.floor(Math.random() * LOVE_LINES.length)];
  el.style.left = (cairo.x - 140) + 'px';
  el.style.top  = (cairo.y - 90) + 'px';
  layer.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-8px)'; }, 4800);
  setTimeout(()=>{ layer.removeChild(el); }, 5600);
}

// =============================
// 弹幕（DOM 滑动）
// =============================
function computeDanmuLanes(){
  // 全屏范围（略避边缘），让弹幕在视觉上遍布屏幕
  const top = Math.floor(canvas.height * 0.08);
  const bottom = Math.floor(canvas.height * 0.92);
  const spacing = 28; // 行距
  const lanes = [];
  for(let y = top; y <= bottom; y += spacing){ lanes.push({ y, availableAt: 0 }); }
  danmuLanes = lanes;
}

function spawnDanmu(){
  const layer = document.getElementById(DANMU_LAYER_ID);
  if(!layer) return;
  const el = document.createElement('div');
  el.className = 'danmu';
  el.textContent = LOVE_LINES[Math.floor(Math.random() * LOVE_LINES.length)];
  // 选择可用车道，避免重叠；弹幕仅出现在中央区域
  const now = performance.now();
  const free = danmuLanes.filter(l => l.availableAt <= now);
  if(free.length === 0) return; // 无可用行则跳过本次
  const lane = free[Math.floor(Math.random() * free.length)];
  const dur = rand(20, 30); // 更慢更平滑，保证在中段缓慢漂移
  const delay = rand(0, 1);
  el.style.top = lane.y + 'px';
  el.style.animationDuration = dur + 's';
  el.style.animationDelay = delay + 's';
  // 随机透明与色彩微变
  el.style.opacity = String(rand(0.82, 1));
  el.style.color = Math.random() < 0.5 ? '#fff6e0' : '#ffebb7';
  layer.appendChild(el);
  const total = (dur + delay) * 1000;
  setTimeout(()=>{ if(el.parentNode===layer) layer.removeChild(el); }, total + 100);
  lane.availableAt = now + total; // 标记占用时长
}
// 循环出现弹幕（随机 3-5 秒）
function scheduleNextDanmu(){
  const next = rand(3000, 5000);
  setTimeout(()=>{ spawnDanmu(); scheduleNextDanmu(); }, next);
}
scheduleNextDanmu();

// =============================
// 动画主循环（停用画布背景，保留弹幕与UI）
// =============================
function drawBackground(){
  // 不再绘制 Canvas 背景，直接使用用户图片作为 body 背景
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // 不再绘制路径与飞机，只保留空循环以预留将来需要
  requestAnimationFrame(animate);
}
animate();

// =============================
// 简洁分段倒计时（不翻牌）
// =============================
function pad2(n){ return n < 10 ? '0'+n : String(n); }
const dNum = document.getElementById('dNum');
const hNum = document.getElementById('hNum');
const mNum = document.getElementById('mNum');
const sNum = document.getElementById('sNum');
function updateCountdown(){
  const now = Date.now();
  const remainMs = Math.max(0, TARGET_DATE.getTime() - now);
  const totalSec = Math.floor(remainMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hour = Math.floor(totalSec / 3600) % 24;
  if(dNum) dNum.textContent = String(days);
  if(hNum) hNum.textContent = pad2(hour);
  if(mNum) mNum.textContent = pad2(min);
  if(sNum) sNum.textContent = pad2(sec);
}
updateCountdown(); setInterval(updateCountdown, 1000);

// =============================
// YouTube 音乐控制（Chosen Family）
// =============================
let ytPlayer=null, ytReady=false, playing=false;
function onYouTubeIframeAPIReady(){
  const holder=document.getElementById('yt-holder'); const id='yt-player'; const iframe=document.createElement('div'); iframe.id=id; holder.appendChild(iframe);
  ytPlayer=new YT.Player(id,{ width:320,height:180, videoId:'i6YenwEUuXI', playerVars:{ enablejsapi:1, rel:0, showinfo:0, list:'RDi6YenwEUuXI', start_radio:1 }, events:{ onReady:()=>{ ytReady=true; ytPlayer.setVolume(25); }, onStateChange:(e)=>{ playing=e.data===YT.PlayerState.PLAYING; } }});
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
const btnPlay=document.getElementById('btnPlay'); const vol=document.getElementById('vol');
btnPlay.addEventListener('click', ()=>{ if(!ytReady) return; if(playing){ ytPlayer.pauseVideo(); } else { ytPlayer.playVideo(); } });
vol.addEventListener('input', ()=>{ if(!ytReady) return; ytPlayer.setVolume(parseInt(vol.value,10)); });