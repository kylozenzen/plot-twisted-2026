let QUESTIONS = window.PLOT_TWISTED_QUESTIONS || {};

async function loadQuestions() {
  if (Object.keys(QUESTIONS).length) return;
  const response = await fetch('/questions.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Question library failed to load (${response.status})`);
  QUESTIONS = await response.json();
}

const CAT_META = {
  Family:          {name:"Family",           flick:"🧸", rated:"G",    blurb:"The ones the whole row can sing along to."},
  Superhero:       {name:"Superhero",        flick:"🦸", rated:"PG13", blurb:"Capes, quips, and post-credit scenes."},
  SciFi:           {name:"SciFi",            flick:"🚀", rated:"PG13", blurb:"Space, robots, and reality that won't sit still."},
  Fantasy:         {name:"Fantasy",          flick:"🐉", rated:"PG13", blurb:"Rings, wizards, and doors to other worlds."},
  EmotionalDamage: {name:"Emotional Damage", flick:"💔", rated:"R",    blurb:"Bring tissues. You were warned."},
  StreamingHits:   {name:"Streaming Hits",   flick:"📱", rated:"NEW",  blurb:"Whatever you binged last weekend."}
};
const CAT_ORDER = ["Family","Superhero","SciFi","Fantasy","EmotionalDamage","StreamingHits"];
const SETTINGS = { layout:'qwerty', sound:true };
const LAYOUTS = { qwerty:["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"], abc:["ABCDEFGHI","JKLMNOPQR","STUVWXYZ"] };
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(_){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(_){}}};
Object.assign(SETTINGS, LS.get('pt_settings',{}));
let BEST = LS.get('pt_best',{});
function saveSettings(){ LS.set('pt_settings', SETTINGS); }
function toggleLayout(){ SETTINGS.layout = SETTINGS.layout==='qwerty'?'abc':'qwerty'; saveSettings(); document.getElementById('setLayout').textContent = SETTINGS.layout==='qwerty'?'QWERTY':'A\u2013Z'; }
function toggleSound(){ SETTINGS.sound=!SETTINGS.sound; saveSettings(); const b=document.getElementById('setSound'); b.textContent=SETTINGS.sound?'ON':'OFF'; b.classList.toggle('off',!SETTINGS.sound); }

const ROUND_SIZE = 5;
const S = { cat:null, qs:[], i:0, score:0, correct:0, typed:"", hintUsed:false, locked:false, results:[], eggBusy:false };
function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function norm(s){ return s.toLowerCase().replace(/[^a-z0-9]/g,""); }
function stripArticle(s){ return s.replace(/^(the|a|an)/,""); }
let actx;
function tone(f,d,t,v){ if(!SETTINGS.sound)return; try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended')actx.resume(); const o=actx.createOscillator(),g=actx.createGain(); o.type=t||'sine'; o.frequency.value=f; o.connect(g); g.connect(actx.destination); const s=actx.currentTime; g.gain.setValueAtTime(v||0.05,s); g.gain.exponentialRampToValueAtTime(0.0001,s+d); o.start(s); o.stop(s+d);}catch(_){}}
function sfxType(){ tone(300,0.03,'square',0.02); }
function sfxCorrect(){ tone(660,0.09,'sine',0.06); setTimeout(()=>tone(990,0.13,'sine',0.06),85); }
function sfxWrong(){ tone(150,0.16,'sawtooth',0.05); }
function buzz(p){ try{ navigator.vibrate&&navigator.vibrate(p); }catch(_){} }
function buildPips(){ const w=document.getElementById('pips'); if(!w)return; w.innerHTML=S.qs.map((_,i)=>'<span class="pip" data-i="'+i+'"></span>').join(''); }
function renderPips(){ const w=document.getElementById('pips'); if(!w)return; [...w.children].forEach((el,i)=>{ el.className='pip'+(S.results[i]===true?' ok':S.results[i]===false?' miss':'')+(i===S.i?' now':''); }); }
function surpriseMe(){ startRound(CAT_ORDER[Math.random()*CAT_ORDER.length|0]); }
function applySettingsUI(){ const a=document.getElementById('setLayout'); if(a)a.textContent=SETTINGS.layout==='qwerty'?'QWERTY':'A\u2013Z'; const b=document.getElementById('setSound'); if(b){ b.textContent=SETTINGS.sound?'ON':'OFF'; b.classList.toggle('off',!SETTINGS.sound);} }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }
function goLobby(){ showScreen('lobby'); }
function goBoxOffice(){ showScreen('boxoffice'); }
function quitGame(){ document.getElementById('exitOverlay').classList.add('show'); }
function closeExit(){ document.getElementById('exitOverlay').classList.remove('show'); }
function leaveTheater(){ closeExit(); if('speechSynthesis' in window) speechSynthesis.cancel(); goLobby(); }

function renderBoard(){
  const board=document.getElementById('board');
  board.innerHTML = CAT_ORDER.map(key=>{
    const m=CAT_META[key];
    return `<button class="poster" onclick="startRound('${key}')" aria-label="Buy ticket to ${esc(m.name)}"><span class="rated">${m.rated}</span><span class="flick" aria-hidden="true">${m.flick}</span><h3>${esc(m.name)}</h3><p>${esc(m.blurb)}</p><div class="runtime">&nbsp;\u00b7 ${ROUND_SIZE} questions</div>${BEST[key]?`<div class="pbest">★ Best ${BEST[key]}</div>`:''}</button>`;
  }).join('');
}
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a; }
function startRound(key){
  const pool=QUESTIONS[key]||[];
  if(!pool.length){ toast('That reel is missing. Refresh and try again.'); return; }
  S.cat = Object.assign({key}, CAT_META[key]);
  S.qs = shuffle(pool).slice(0,ROUND_SIZE);
  S.i=0; S.score=0; S.correct=0; S.results=new Array(S.qs.length).fill(null);
  document.getElementById('hudCat').textContent=S.cat.name;
  document.getElementById('hudTotal').textContent=S.qs.length;
  buildSeats(); buildPips(); showScreen('theater'); loadQuestion();
}
function loadQuestion(){
  const q=S.qs[S.i];
  S.typed=""; S.hintUsed=false; S.locked=false;
  const ms=document.getElementById('movieScreen'); ms.classList.remove('correct');
  ms.innerHTML='<div class="clue" id="clue"></div>';
  document.getElementById('clue').textContent=q.clue;
  document.getElementById('subtitle').innerHTML=""; document.getElementById('subtitle').classList.remove('wrong');
  document.getElementById('hintBtn').disabled=false;
  document.getElementById('hudQ').textContent=S.i+1;
  document.getElementById('hudScore').textContent=S.score;
  renderPips(); renderTyped();
}
let seatMap={},seatBound=false;
function onSeatDown(e){ const seat=e.target.closest('.seat'); if(!seat) return; e.preventDefault(); if(S.locked) return; const k=seat.dataset.key; if(k==='Enter') submitAnswer(); else if(k==='Backspace') backspace(); else typeChar(k); }
function buildSeats(){
  const wrap=document.getElementById('seating');
  const rows=LAYOUTS[SETTINGS.layout].map(r=>r.split(""));
  let html="";
  rows.forEach(row=>{ html+='<div class="seat-row">'+row.map(l=>'<button class="seat" data-key="'+l+'" aria-label="Letter '+l+'">'+l+'</button>').join("")+'</div>'; });
  html+='<div class="seat-row"><button class="seat wide" data-key=" " aria-label="Space">SPACE</button><button class="seat wide" data-key="Backspace" aria-label="Delete">\u232b DEL</button><button class="seat wide enter" data-key="Enter" aria-label="Submit answer">\u21b5 ENTER</button></div>';
  wrap.innerHTML=html;
  seatMap={}; wrap.querySelectorAll('.seat').forEach(el=>{ seatMap[el.dataset.key]=el; });
  if(!seatBound){ seatBound=true; wrap.addEventListener('pointerdown', onSeatDown); }
}
function flashSeat(key){ const el=seatMap[key]; if(!el) return; el.classList.add('hit'); setTimeout(()=>el.classList.remove('hit'),90); }
function typeChar(ch){ if(S.locked)return; if(S.typed.length>=40)return; S.typed+=ch; sfxType(); flashSeat(ch===" "?" ":ch.toUpperCase()); renderTyped(); }
function backspace(){ if(S.locked)return; S.typed=S.typed.slice(0,-1); flashSeat("Backspace"); renderTyped(); }
function renderTyped(){ document.getElementById('typed').innerHTML=esc(S.typed)+`<span class="cur">\u258a</span>`; }
function editDistance(a,b){
  const m=a.length,n=b.length; if(!m)return n; if(!n)return m;
  let prev=Array.from({length:n+1},(_,j)=>j), curr=new Array(n+1).fill(0);
  for(let i=1;i<=m;i++){ curr[0]=i; for(let j=1;j<=n;j++){ const c=a[i-1]===b[j-1]?0:1; curr[j]=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+c);} const t=prev; prev=curr; curr=t; }
  return prev[n];
}
function variants(t){
  const set=new Set();
  [t, t.replace(/&/g,' and '), t.replace(/\band\b/gi,' ')].forEach(b=>{
    const n=norm(b); if(n){ set.add(n); const s=stripArticle(n); if(s&&s.length>2) set.add(s); }
  });
  return [...set];
}
function words(t){ return t.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function baseTitle(w){ let s=w,p; do{ p=s; s=s.replace(/\s+(part|volume|vol|chapter|episode|ch|pt)\s+(\d+|[ivxlc]+)$/,'').trim(); s=s.replace(/\s+\d+$/,'').trim(); s=s.replace(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x)$/,'').trim(); }while(s!==p&&s.length>0); return s; }
function buildPool(q){
  const out=new Set();
  variants(q.title).forEach(v=>out.add(v));
  variants(baseTitle(words(q.title))).forEach(v=>out.add(v));
  const seg=q.title.split(/[:(]/)[0].trim();
  if(seg && seg.length>3 && seg!==q.title) variants(seg).forEach(v=>out.add(v));
  return [...out];
}
function isMatch(guess,pool){
  const gv=[guess]; const gs=stripArticle(guess); if(gs!==guess&&gs.length>2) gv.push(gs);
  for(const p of pool){ for(const g of gv){
    if(g===p) return true;
    const len=Math.max(g.length,p.length);
    if(len<4) continue;
    const tol=len<=8?1:2;
    if(Math.abs(g.length-p.length)<=tol && editDistance(g,p)<=tol) return true;
  }}
  return false;
}
function isPrefixMatch(g,a){ if(g.length<5) return false; if(g===a) return true; if(a.startsWith(g+' ')) return true; const b=baseTitle(a); if(b.length>=5 && (g===b || b.startsWith(g+' '))) return true; return false; }
function submitAnswer(){ if(S.locked)return; const raw=S.typed.trim(); const g=norm(raw); if(!g){bump();return;} const q=S.qs[S.i];
  const correct = isMatch(g,buildPool(q)) || isPrefixMatch(words(raw),words(q.title));
  const titleN=norm(q.title);
  if(!correct){ if((g==='matrix'||g==='thematrix')&&!titleN.includes('matrix')){ eggMatrix(); return; } if(g==='mortalkombat'&&!titleN.includes('mortalkombat')){ eggFatality(); return; } }
  if(correct) win(q); else wrong(); }
let eggRaf=null;
function endEgg(layer){ if(eggRaf){cancelAnimationFrame(eggRaf);eggRaf=null;} layer.classList.remove('show'); setTimeout(()=>{ layer.className='egg-layer'; layer.innerHTML=''; S.eggBusy=false; S.locked=false; S.typed=''; renderTyped(); }, 400); }
function eggMatrix(){ if(S.eggBusy) return; S.eggBusy=true; S.locked=true;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const layer=document.getElementById('eggLayer');
  layer.innerHTML='<canvas id="mtxCanvas"></canvas><div class="mtx-text">Wake up, Neo...</div>';
  layer.className='egg-layer show mtx';
  const cv=document.getElementById('mtxCanvas'), ctx=cv.getContext('2d');
  const dpr=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr;
  const fsz=16*dpr, cols=Math.max(1,Math.floor(cv.width/fsz)), y=new Array(cols).fill(0);
  const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789Z:.=*+-<>';
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cv.width,cv.height);
  const t0=performance.now(), dur=reduce?1200:4200;
  function draw(now){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,0,cv.width,cv.height); ctx.fillStyle='#3bff6a'; ctx.font=fsz+'px monospace'; for(let i=0;i<cols;i++){ const ch=chars[Math.random()*chars.length|0]; ctx.fillText(ch,i*fsz,y[i]*fsz); if(y[i]*fsz>cv.height && Math.random()>0.975) y[i]=0; y[i]++; } if(now-t0<dur) eggRaf=requestAnimationFrame(draw); else endEgg(layer); }
  if(reduce){ setTimeout(()=>endEgg(layer),1200); } else { eggRaf=requestAnimationFrame(draw); } }
function eggFatality(){ if(S.eggBusy) return; S.eggBusy=true; S.locked=true;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const layer=document.getElementById('eggLayer'); layer.innerHTML='<div class="fatal-flash"></div><div class="fatal-text">FATALITY</div>'; layer.className='egg-layer show fatal';
  if(SETTINGS.sound){ tone(60,0.5,'sawtooth',0.09); setTimeout(()=>tone(38,0.7,'sawtooth',0.08),120); } buzz([0,60,40,120]); setTimeout(()=>endEgg(layer), reduce?900:2400); }
function win(q){
  S.locked=true; const gained=S.hintUsed?50:100; S.score+=gained; S.correct++; S.results[S.i]=true; sfxCorrect(); buzz(20); renderPips();
  const ms=document.getElementById('movieScreen'); ms.classList.add('correct'); ms.innerHTML='<div class="verdict">CORRECT!</div>';
  const sub=document.getElementById('subtitle'); sub.classList.remove('wrong'); sub.innerHTML=`<span class="lbl">+${gained}</span>${esc(q.title)}`;
  document.getElementById('hudScore').textContent=S.score; setTimeout(next,1150);
}
function wrong(){ sfxWrong(); buzz([0,30,40,30]); const line=document.getElementById('answerLine'); line.classList.add('shake'); setTimeout(()=>line.classList.remove('shake'),350); const sub=document.getElementById('subtitle'); sub.classList.add('wrong'); sub.innerHTML=`<span class="lbl">cut!</span>Not that one. Roll it again.`; S.typed=""; renderTyped(); }
function letterReveal(title){ return title.split(/\s+/).map(w=>[...w].map((ch,i)=>{ if(!/[a-z0-9]/i.test(ch))return ch; return i===0?ch.toUpperCase():'_'; }).join('')).join(' '); }
function useHint(){ if(S.locked||S.hintUsed)return; S.hintUsed=true; document.getElementById('hintBtn').disabled=true; const q=S.qs[S.i]; const sub=document.getElementById('subtitle'); sub.classList.remove('wrong'); if(q.hint) sub.innerHTML=`<span class="lbl">subtitle</span>${esc(q.hint)}`; else sub.innerHTML=`<span class="lbl">on the marquee</span><span style="font-family:'Space Mono';letter-spacing:.22em">${esc(letterReveal(q.title))}</span>`; }
function speakClue(){ if(!SETTINGS.sound){ toast("Sound is off \u2014 check Settings"); return; } const q=S.qs[S.i]; if(!('speechSynthesis' in window)){ toast("Audio not supported"); return; } speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(q.clue); u.rate=.96; u.pitch=1; speechSynthesis.speak(u); }
function skipQuestion(){ if(S.locked)return; S.locked=true; const q=S.qs[S.i]; const sub=document.getElementById('subtitle'); sub.classList.remove('wrong'); sub.innerHTML=`<span class="lbl">the answer was</span>${esc(q.title)}`; S.results[S.i]=false; renderPips(); setTimeout(next,1100); }
function next(){ if('speechSynthesis' in window) speechSynthesis.cancel(); S.i++; if(S.i>=S.qs.length) endRound(); else loadQuestion(); }
function bump(){ const line=document.getElementById('answerLine'); line.classList.add('shake'); setTimeout(()=>line.classList.remove('shake'),350); }
function ratingFor(c){ switch(c){ case 5:return{stars:"\u2605\u2605\u2605\u2605\u2605",crit:"Critic's Choice"}; case 4:return{stars:"\u2605\u2605\u2605\u2605\u2606",crit:"Standing Ovation"}; case 3:return{stars:"\u2605\u2605\u2605\u2606\u2606",crit:"Solid Showing"}; case 2:return{stars:"\u2605\u2605\u2606\u2606\u2606",crit:"Mixed Reviews"}; case 1:return{stars:"\u2605\u2606\u2606\u2606\u2606",crit:"Straight to DVD"}; default:return{stars:"\u2606\u2606\u2606\u2606\u2606",crit:"Box Office Bomb"}; } }
function serial(){ return Array.from({length:12},()=>Math.random().toString(36)[2]||"0").join("").toUpperCase(); }
function endRound(){
  const r=ratingFor(S.correct); const now=new Date();
  const bkey=S.cat.key, prev=BEST[bkey]||0, isBest=S.score>prev&&S.score>0; if(isBest){ BEST[bkey]=S.score; LS.set('pt_best',BEST); }
  const when=now.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+" \u00b7 "+now.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
  document.getElementById('ticket').innerHTML=`<div class="t-brand"><div class="cinema">PLOT TWISTED CINEMAS</div><div class="admit">ADMIT ONE</div></div><div class="t-row"><span class="k">SHOWING</span><span class="v">${esc(S.cat.name)}</span></div><div class="t-row"><span class="k">DATE</span><span class="v">${when}</span></div><div class="t-row"><span class="k">SEATS PLAYED</span><span class="v">${S.correct}/${S.qs.length} correct</span></div><div class="t-score"><div class="num">${S.score}</div><div class="lbl">FINAL SCORE</div></div><div class="t-rating"><div class="stars">${r.stars}</div><div class="crit">${r.crit}</div></div>${isBest?'<div class="t-best">★ NEW HIGH SCORE ★</div>':''}<div class="barcode" aria-hidden="true"></div><div class="t-serial">NO. ${serial()} \u00b7 NOBODY CREATIVE</div>`;
  showScreen('receipt');
}
async function shareScoreCard(){
  try{
    const blob=await renderCard(); const file=new File([blob],'plot-twisted.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], text:'Plot Twisted — Movie Trivia'}); }catch(_){} return; }
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='plot-twisted.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000); toast("Score card saved");
  }catch(err){ toast("Couldn't make image"); }
}
function roundRect(x,X,Y,w,h,r){ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+w,Y,X+w,Y+h,r); x.arcTo(X+w,Y+h,X,Y+h,r); x.arcTo(X,Y+h,X,Y,r); x.arcTo(X,Y,X+w,Y,r); x.closePath(); }
function cdot(x,X,Y,r){ x.beginPath(); x.arc(X,Y,r,0,7); x.fill(); }
async function renderCard(){
  if(document.fonts){ try{ await document.fonts.load('92px "Bungee"'); await document.fonts.load('700 210px "Barlow Condensed"'); await document.fonts.load('700 34px "Barlow Condensed"'); await document.fonts.load('italic 30px "Barlow"'); await document.fonts.load('500 40px "Space Mono"'); await document.fonts.ready; }catch(_){} }
  const W=1080,H=1350,cx=W/2,r=ratingFor(S.correct); const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a1013'); g.addColorStop(.5,'#160b0d'); g.addColorStop(1,'#0e0708'); x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='#e4b34c'; x.lineWidth=8; roundRect(x,40,40,W-80,H-80,26); x.stroke(); x.textAlign='center'; x.fillStyle='#fcebc0'; for(let i=0;i<15;i++){ const bx=95+i*(W-190)/14; cdot(x,bx,96,8); cdot(x,bx,H-96,8); }
  x.fillStyle='#e4b34c'; x.font='700 34px "Barlow Condensed",sans-serif'; x.fillText('★  NOW SHOWING  ★', cx,178); x.font='92px "Bungee",sans-serif'; x.fillStyle='#fcebc0'; x.fillText('PLOT', cx,300); x.save(); x.shadowColor='rgba(255,77,141,.75)'; x.shadowBlur=40; x.fillStyle='#ff4d8d'; x.fillText('TWISTED', cx,406); x.restore();
  const px=110,pw=W-220,py=470,ph=420; const sg=x.createLinearGradient(0,py,0,py+ph); sg.addColorStop(0,'#0a0f14'); sg.addColorStop(1,'#050708'); x.fillStyle=sg; roundRect(x,px,py,pw,ph,18); x.fill(); x.strokeStyle='#33404a'; x.lineWidth=3; roundRect(x,px,py,pw,ph,18); x.stroke();
  x.fillStyle='#c9a978'; x.font='500 36px "Barlow",sans-serif'; x.fillText('Showing: '+S.cat.name, cx,py+72); x.fillStyle='#fcebc0'; x.font='700 200px "Barlow Condensed",sans-serif'; x.fillText(String(S.score), cx,py+262); x.fillStyle='#a97f2e'; x.font='700 30px "Barlow Condensed",sans-serif'; x.fillText('FINAL SCORE', cx,py+312); x.fillStyle='#f4e6cf'; x.font='500 40px "Space Mono",monospace'; x.fillText(S.correct+' / '+S.qs.length+' correct', cx,py+382);
  x.fillStyle='#e4b34c'; x.font='74px "Barlow",sans-serif'; x.fillText(r.stars, cx,1005); x.fillStyle='#fcebc0'; x.font='700 50px "Barlow Condensed",sans-serif'; x.fillText(r.crit.toUpperCase(), cx,1076);
  const n=S.results.length||5,sw=70,gap=16,tot=n*sw+(n-1)*gap,sx=cx-tot/2,sy=1120; for(let i=0;i<n;i++){ const bx=sx+i*(sw+gap),res=S.results[i]; x.fillStyle=res===true?'#5ee08a':res===false?'#a3434a':'#7a1e22'; roundRect(x,bx,sy,sw,60,12); x.fill(); x.fillStyle='#2c0a0d'; roundRect(x,bx,sy+60,sw,8,3); x.fill(); }
  x.fillStyle='#c9a978'; x.font='italic 30px "Barlow",sans-serif'; x.fillText('Trust nobody. Especially the hints.', cx,1258); x.fillStyle='#6b4c3a'; x.font='700 24px "Barlow Condensed",sans-serif'; x.fillText('A NOBODY CREATIVE PRODUCTION', cx,1300); return await new Promise(res=>c.toBlob(res,'image/png'));
}
function fallbackCopy(t){ navigator.clipboard?.writeText(t).then(()=>toast("Score card copied"),()=>toast("Copy failed")); }
function replay(){ startRound(S.cat.key); }
let toastT;
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),1900); }
document.addEventListener('keydown',e=>{ if(!document.getElementById('theater').classList.contains('active'))return; if(S.locked)return; const k=e.key; if(k==="Enter"){ e.preventDefault(); flashSeat("Enter"); submitAnswer(); } else if(k==="Backspace"){ e.preventDefault(); backspace(); } else if(k===" "){ e.preventDefault(); typeChar(" "); } else if(/^[a-zA-Z]$/.test(k)){ typeChar(k.toUpperCase()); } });
function onFbType(){ document.getElementById('fbClue').hidden = (document.getElementById('fbType').value!=='Submit a clue'); }
function submitFeedback(e){ e.preventDefault(); const form=document.getElementById('fbForm'); const body=new URLSearchParams(new FormData(form)).toString(); fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body}).then(r=>{ if(!r.ok) throw 0; fbSuccess(false); }).catch(()=>fbSuccess(true)); return false; }
function fbSuccess(preview){ document.getElementById('fbForm').style.display='none'; document.getElementById('fbDone').hidden=false; document.getElementById('fbDoneMsg').textContent = preview ? 'Saved. This sends for real once the game is live on Netlify.' : 'Thanks for helping run the theater. I read every one.'; }
function fbReset(){ const f=document.getElementById('fbForm'); f.reset(); f.style.display=''; document.getElementById('fbDone').hidden=true; document.getElementById('fbClue').hidden=true; }
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; maybeShowInstall('android'); });
function isStandalone(){ try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }catch(_){ return false; } }
function maybeShowInstall(kind){ if(isStandalone()||LS.get('pt_install_dismissed',false)) return; const bar=document.getElementById('installBar'),txt=document.getElementById('installText'),btn=document.getElementById('installBtn'); if(kind==='android'){ txt.textContent='Add Plot Twisted to your home screen'; btn.style.display=''; } else { txt.innerHTML='Install: tap Share, then “Add to Home Screen”'; btn.style.display='none'; } bar.classList.add('show'); }
function doInstall(){ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt.userChoice.finally(()=>{ deferredPrompt=null; dismissInstall(); }); } }
function dismissInstall(){ document.getElementById('installBar').classList.remove('show'); LS.set('pt_install_dismissed',true); }
function initInstall(){ if(isStandalone()) return; const ua=navigator.userAgent||''; const iOS=/iphone|ipad|ipod/i.test(ua)&&!/crios|fxios/i.test(ua); if(iOS) setTimeout(()=>maybeShowInstall('ios'),1600); }

const PLAYED_KEY = 'pt_has_played';
const HOME_BYPASS_KEY = 'pt_home_bypass';
const SHARE_URL = `${window.location.origin}/`;
function track(name, parameters = {}) { window.ptAnalytics?.track?.(name, parameters); }
function notify(message) { if (typeof window.toast === 'function') window.toast(message); }
function makeBetaChip(label = 'Now in beta') { const chip=document.createElement('span'); chip.className='game-beta-chip'; chip.textContent=label; return chip; }
function addBetaLabels(){ const lobbyMarquee=document.querySelector('#lobby .marquee'); if(lobbyMarquee&&!lobbyMarquee.querySelector('.game-beta-chip')) lobbyMarquee.appendChild(makeBetaChip('Beta')); const settings=document.getElementById('settings'); const settingsEyebrow=settings?.querySelector(':scope > .eyebrow'); if(settings&&settingsEyebrow&&!settings.querySelector('.settings-beta-wrap')){ const wrap=document.createElement('div'); wrap.className='settings-beta-wrap'; settingsEyebrow.before(wrap); wrap.append(settingsEyebrow,makeBetaChip()); } const foot=document.querySelector('#lobby .foot'); if(foot) foot.textContent='A Nobody Creative Production · 5 Questions · Beta Build'; }
function goHome(){ track('select_content',{content_type:'navigation',content_id:'game_home_screen'}); try{sessionStorage.setItem(HOME_BYPASS_KEY,'1');}catch(_){} window.location.assign('/?home=1'); }
async function copyShareLink(button){ try{ if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(SHARE_URL); } else { const input=document.createElement('textarea'); input.value=SHARE_URL; input.setAttribute('readonly',''); input.style.position='fixed'; input.style.opacity='0'; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); } const original=button.textContent; button.textContent='COPIED'; notify('Game link copied'); track('share',{method:'clipboard',content_type:'game',item_id:'plot_twisted'}); setTimeout(()=>{button.textContent=original;},1600); }catch(_){ notify('Could not copy the link'); } }
function settingsRow(title,description,buttonText,handler){ const row=document.createElement('div'); row.className='set-row settings-action-row'; row.innerHTML=`<div><div class="set-name">${title}</div><div class="set-sub">${description}</div></div>`; const button=document.createElement('button'); button.className='toggle'; button.type='button'; button.textContent=buttonText; button.addEventListener('click',()=>handler(button)); row.appendChild(button); return row; }
function addSettingsTools(){ const settingsList=document.querySelector('#settings .settings-list'); if(!settingsList||settingsList.querySelector('.settings-action-row')) return; settingsList.append(settingsRow('Home Screen','Return to the Plot Twisted landing page','HOME',goHome),settingsRow('Share Game','Copy a clean link to send to another movie nerd','COPY LINK',copyShareLink)); }
function currentCategory(){ try{return S?.cat?.name||S?.cat?.key||'Unknown';}catch(_){return'Unknown';} }
function instrumentGameEvents(){ if(window.__ptAnalyticsInstrumented)return; window.__ptAnalyticsInstrumented=true; const originalStartRound=startRound; startRound=function trackedStartRound(key){ const result=originalStartRound.apply(this,arguments); track('level_start',{level_name:CAT_META?.[key]?.name||key}); return result; }; const originalEndRound=endRound; endRound=function trackedEndRound(){ const result=originalEndRound.apply(this,arguments); const category=currentCategory(); track('level_end',{level_name:category,success:true}); track('post_score',{score:Number(S.score||0),game_category:category,correct_answers:Number(S.correct||0),question_count:Number(S.qs?.length||0)}); return result; }; const originalShareScoreCard=shareScoreCard; shareScoreCard=function trackedShareScoreCard(){ track('share',{method:navigator.share?'web_share_or_download':'download',content_type:'score_card',item_id:currentCategory().toLowerCase().replace(/\s+/g,'_')}); return originalShareScoreCard.apply(this,arguments); }; document.getElementById('fbForm')?.addEventListener('submit',()=>{ track('feedback_submit',{feedback_type:document.getElementById('fbType')?.value||'Unknown'}); },{capture:true}); }
function rememberCompletedRound(){ const receipt=document.getElementById('receipt'); if(!receipt)return; const remember=()=>{ if(receipt.classList.contains('active')){ try{localStorage.setItem(PLAYED_KEY,'true');}catch(_){} } }; remember(); new MutationObserver(remember).observe(receipt,{attributes:true,attributeFilter:['class']}); }

async function bootGame(){
  try { await loadQuestions(); } catch (error) { console.error(error); const tagline=document.querySelector('#lobby .tagline'); if(tagline) tagline.textContent='The projection booth lost the film reel. Refresh to retry.'; }
  renderBoard(); applySettingsUI(); initInstall(); addBetaLabels(); addSettingsTools(); instrumentGameEvents(); rememberCompletedRound();
  if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
  document.getElementById('exitOverlay').addEventListener('click',e=>{ if(e.target.id==='exitOverlay') closeExit(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeExit(); });
  window.addEventListener('load',()=>{ const ident=document.getElementById('ident'); const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches; setTimeout(()=>{ ident.style.opacity='0'; setTimeout(()=>{ ident.style.display='none'; showScreen('lobby'); },reduce?50:800); },reduce?400:2600); });
}
bootGame();
