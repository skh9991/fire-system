// 화면 렌더링과 입력 처리. 데이터는 src/data, 문제 생성과 채점은 src/engine에 있습니다.
import { SYS, SYSTAB, MODES, LEVELS } from '../data';
import { BUNDLED_PHOTOS } from '../data/photos';
import { randSeed, plain, key, problemRand, makePuzzle, makeDraw, scorePuzzle, scoreDraw, scoreOrder, shuffled } from '../engine/engine';
import { allPhotos, putPhoto, delPhoto as removePhoto, shrink } from './photoStore';

const $ = (id: string): any => document.getElementById(id);
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let teacher = false;
try { teacher = localStorage.getItem('teacher') === '1'; } catch { /* 저장소를 쓸 수 없으면 꺼 둠 */ }

const S: any = {
  photos: {}, local: {}, canEdit: teacher, photoMsg: '', sys: 'hydrant', mode: 'explore', level: 'normal', seed: randSeed(), sel: 'pump', step: -1, timer: null,
  blanks: [], chips: [], placed: {}, chip: null, checked: false, mirror: false, reveal: false,
  todo: [], given: [], lines: [], from: null, shuffle: true, pos: {}, live: new Set(), flatVB: null, group: 0,
  cards: [], pick: [],
};

function setup() {
  stopPlay();
  const d = SYS[S.sys], rand = problemRand(S.sys, S.mode, S.level, S.seed);
  Object.assign(S, { checked: false, reveal: false, placed: {}, chip: null, from: null, lines: [], pick: [], mirror: false, pos: {}, step: -1 });
  if (S.mode === 'puzzle') Object.assign(S, makePuzzle(d, S.level, rand));
  if (S.mode === 'draw') Object.assign(S, makeDraw(d, S.level, rand, S.group || 0, S.shuffle));
  if (S.mode === 'order') S.cards = shuffled(d.steps.map((s, i) => ({ ...s, i })), rand);
  render();
}

/* 실물 사진: 앱에 포함된 사진 위에 이 기기에서 넣은 사진을 덮어 씁니다 */
async function loadPhotos() {
  const base = import.meta.env.BASE_URL;
  const m: Record<string, string> = {};
  for (const [k, f] of Object.entries(BUNDLED_PHOTOS)) m[k] = base + 'photos/' + f;
  Object.values(S.local).forEach((u: any) => URL.revokeObjectURL(u));
  S.local = {};
  try {
    for (const [k, b] of Object.entries(await allPhotos())) { S.local[k] = URL.createObjectURL(b); m[k] = S.local[k]; }
  } catch { S.photoMsg = '이 기기에서는 사진 저장소를 쓸 수 없습니다.'; }
  S.photos = m;
}
const selName = () => plain(SYS[S.sys].nodes.find((n: any) => n.id === S.sel).label);
async function addPhoto(file: File) {
  const nm = selName();
  try { await putPhoto(nm, await shrink(file)); S.photoMsg = ''; await loadPhotos(); }
  catch { S.photoMsg = '사진을 저장하지 못했습니다. 다른 파일로 다시 시도하세요.'; }
  render();
}
async function delPhoto() {
  try { await removePhoto(selName()); S.photoMsg = ''; await loadPhotos(); }
  catch { S.photoMsg = '사진을 삭제하지 못했습니다. 다시 시도하세요.'; }
  render();
}

/* ─── 도면 그리기 ─── */
const VB=()=>SYS[S.sys].vb||[1200,760];
const X=x=>S.mirror?VB()[0]-x:x;
function P(n){return S.pos[n.id]?{x:S.pos[n.id][0],y:S.pos[n.id][1]}:{x:X(n.x),y:n.y}}
function sym(n){
  const c=n.code||'',w=n.w||40;
  switch(n.kind){
   case 'tank':{const fl=S.mode==='draw'&&S.shuffle,W=fl?120:(n.W||150),H=fl?60:(n.H||76);return `<rect class="sym" x="${-W/2}" y="${-H/2}" width="${W}" height="${H}"/><rect class="sym wf" x="${-W/2}" y="${-H/2+12}" width="${W}" height="${H-12}"/>`}
   case 'pump':{const r2=n.small?17:23;return `<circle class="sym" r="${r2}"/><path class="sym f" d="M${-r2*.45} ${-r2*.6}L${r2*.7} 0L${-r2*.45} ${r2*.6}Z"/>`}
   case 'gate':return `<path class="sym ${n.fill?'f':''}" d="M-15 -11L15 11V-11L-15 11Z"/>`;
   case 'check':return `<path class="sym" d="M-15 -11L0 0L-15 11Z"/><path class="sym f" d="M15 -11L0 0L15 11Z"/><path class="sym nf" d="M-15 12L15 -12"/>`;
   case 'gauge':return n.side?`<path class="sym" d="M0 0H22"/><circle class="sym" cx="37" r="15"/><text class="st" x="37">${c}</text>`:`<path class="sym" d="M0 0V-22"/><circle class="sym" cy="-36" r="15"/><text class="st" y="-36">${c}</text>`;
   case 'gauge2':return `<circle class="sym" r="15"/><text class="st">${c}</text>`;
   case 'flex':return `<rect class="sym wf" x="-12" y="-18" width="24" height="36"/><path class="sym nf" d="M-12 -9H12M-12 0H12M-12 9H12"/>`;
   case 'strainer':return `<path class="sym nf" d="M-14 0H14M-4 0L14 18M-10 8V-8"/>`;
   case 'float':return `<path class="sym nf" d="M0 -12V30"/><path class="sym" d="M-16 -2A16 12 0 0 1 16 -2Z"/><circle class="sym" cy="-16" r="4"/>`;
   case 'ori':return `<path class="sym nf" d="M-4 -14V14M4 -14V14"/>`;
   case 'cup':return `<path class="sym" d="M-20 -14H20L8 2H-8Z"/>`;
   case 'angle':return `<path class="sym f" d="M-16 -16L0 0L-16 8Z"/><path class="sym" d="M0 0L-9 14H9Z"/>`;
   case 'relief':return `<path class="sym" d="M-15 -11L15 11V-11L-15 11Z"/><path class="sym nf" d="M0 0V-6L8 -10L-8 -15L8 -20L-8 -25L0 -28"/>`;
   case 'foot':return `<path class="sym f" d="M-12 -8H12L0 10Z"/><path class="sym nf" d="M-16 16H16"/>`;
   case 'tag':return `<rect class="sym" x="${-w/2}" y="-15" width="${w}" height="30"/><text class="st">${c}</text>`;
   case 'panel':{const W=n.w||90;return `<rect class="sym" x="${-W/2}" y="-26" width="${W}" height="52"/><text class="st">${c}</text>`}
   case 'cham':return n.small?`<rect class="sym wf" x="-36" y="-52" width="72" height="104" rx="30"/>`:`<rect class="sym wf" x="-20" y="-32" width="40" height="64" rx="19"/>`;
   case 'hub':return `<circle class="j" r="8"/>`;
   case 'j':return `<circle class="sym" r="9"/>`;
   case 'hc':return `<rect class="sym" x="-34" y="-24" width="68" height="48"/><circle class="sym nf" cx="-8" r="12"/><circle class="sym nf" cx="-8" r="5"/><path class="sym nf" d="M14 -14V14"/>`;
   case 'head':return `<path class="sym" d="M0 -20V0"/><path class="sym f" d="M-7 0H7L0 10Z"/><path class="sym nf" d="M-13 15H13"/>`;
   case 'ohead':return `<path class="sym" d="M0 -20V0"/><path class="sym" d="M-7 0H7L0 10Z"/><path class="sym nf" d="M-13 15H13"/>`;
   case 'av':return `<circle class="sym" r="24"/><text class="st">${c}</text>`;
   case 'fdc':return `<path class="sym nf" d="M-18 -14L0 0L-18 14M0 0H18"/><circle class="sym" cx="-18" cy="-14" r="5"/><circle class="sym" cx="-18" cy="14" r="5"/>`;
   case 'bell':return `<path class="sym" d="M-17 12V-1A17 17 0 0 1 17 -1V12Z"/><path class="sym nf" d="M-22 12H22"/>`;
   case 'det':return `<rect class="sym" x="-22" y="-22" width="44" height="44"/><text class="st">${c}</text>`;
   case 'res':return `<path class="sym nf" d="M-26 0H-16L-11 -10L-3 10L5 -10L13 10L18 0H26"/>`;
   case 'lamp':return `<circle class="sym" r="16"/><path class="sym nf" d="M-11 -11L11 11M-11 11L11 -11"/>`;
   case 'batt':return `<path class="sym nf" d="M-24 0H-7M7 0H24M-7 -18V18M7 -9V9"/>`;
   case 'drain':return `<path class="sym nf" d="M-12 0H12M-7 7H7M-3 14H3"/>`;
  }
  return '';
}
function halfBox(n){
  switch(n.kind){case 'tank':return n.small?36:46;case 'panel':return 34;case 'cham':return 40;case 'hc':return 32;case 'av':return 32;case 'gauge':return 12;case 'pump':return n.small?25:31;default:return 26}
}
function labelSvg(n,p,forceB?){
  if(!n.label)return '';
  const lines=((forceB||S.mode==='draw')&&n.dl||n.label).split('\n');let lp=forceB?'b':n.lp,ax='middle',dx=0,dy=0,h=halfBox(n);
  const code=lp;
  if(code==='b'||code==='b0')dy=h+15;
  else if(code==='t'||code==='t0'||code==='t5')dy=-h-2-(lines.length-1)*19;
  else if(code==='t2')dy=-66;
  else if(code==='t3')dy=-54;
  else if(code==='l'||code==='l2'||code==='l3'||code==='l4'){dx=-(code==='l'?h+14:code==='l2'?62:code==='l4'?56:34);ax='end';dy=5-(lines.length-1)*9}
  else if(code==='r'||code==='r2'){dx=code==='r2'?54:h+14;ax='start';dy=5-(lines.length-1)*9}
  if(n.at&&!forceB){dx=n.at[0];dy=n.at[1];ax=n.at[2]}
  if(S.mirror&&dx){dx=-dx;ax=ax==='end'?'start':'end'}
  return `<text class="lbl" style="text-anchor:${ax}" x="${dx}" y="${dy}">${lines.map((l,i)=>`<tspan x="${dx}" dy="${i?19:0}">${esc(l)}</tspan>`).join('')}</text>`;
}
function pathD(pts){return 'M'+pts.map(p=>p[0]+' '+p[1]).join('L')}
function ePts(e,byId){
  const a=P(byId[e.f]),b=P(byId[e.t]);
  if(S.mode==='draw'&&S.shuffle)return [[a.x,a.y],[b.x,b.y]];
  if(e.pts)return e.pts.map(p=>[X(p[0]),p[1]]);
  if(a.x===b.x||a.y===b.y)return [[a.x,a.y],[b.x,b.y]];
  return [[a.x,a.y],[b.x,a.y],[b.x,b.y]];
}
function arrow(pts,ty){
  let best=0,bi=0;for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);if(l>best){best=l;bi=i}}
  if(best<36)return '';
  const [a,b]=[pts[bi],pts[bi+1]],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,an=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
  return `<path class="ar ${ty}" d="M7 0L-5 -6V6Z" transform="translate(${mx} ${my}) rotate(${an})"/>`;
}
function render(){
  const d=SYS[S.sys],byId=Object.fromEntries(d.nodes.map(n=>[n.id,n]));
  const hideDeco=S.mode==='draw';
  const blankSet=new Set(S.mode==='puzzle'?S.blanks:[]);
  const flat=S.mode==='draw'&&S.shuffle;
  let o='';
  $('stage').setAttribute('viewBox','0 0 '+(flat?S.flatVB:VB()).join(' '));
  if(!flat)for(const z of d.zones){const x=S.mirror?VB()[0]-z[0]-z[2]:z[0];o+=`<g class="zone"><rect x="${x}" y="${z[1]}" width="${z[2]}" height="${z[3]}"/><text x="${x+z[2]-10}" y="${z[1]+22}" style="text-anchor:end">${z[4]}</text></g>`}
  if(!flat)for(const t of d.notes||[]){const x=X(t[0]);o+=t[3]?`<text class="note" transform="translate(${x} ${t[1]})" style="text-anchor:middle">${esc(t[2])}</text>`:`<text class="note" x="${x}" y="${t[1]}" style="text-anchor:${S.mirror?'end':'start'}">${esc(t[2])}</text>`}
  // 재생 상태
  const cur=S.step>=0?d.steps[S.step]:null;
  const litNow=new Set<string>(cur?cur.e:[]),litPast=new Set<string>();
  if(cur)d.steps.slice(0,S.step).forEach(s=>s.e.forEach(k=>litPast.add(k)));
  const pickedNodes=new Set();
  if(S.mode==='order'){S.pick.forEach(i=>d.steps[i].n.forEach(x=>pickedNodes.add(x)))}
  const nbrSel=new Set();
  o+=`<g class="${cur?'dim':''}">`;
  for(const e of d.edges){
    if(hideDeco&&e.deco)continue;
    if(S.mode==='draw'&&!S.given.includes(e))continue;
    const pts=ePts(e,byId);
    const cls=litNow.has(e.id)?'lit':litPast.has(e.id)?'past':'';
    o+=`<path class="e ${e.ty} ${cls}" d="${pathD(pts)}"/>`;
    if(!flat)o+=arrow(pts,e.ty);
  }
  o+='</g>';
  // 학생 선
  if(S.mode==='draw'){
    const need=new Set(S.todo.map(e=>key(e.f,e.t)));
    for(const l of S.lines){
      const a=P(byId[l[0]]),b=P(byId[l[1]]),k=key(l[0],l[1]);
      const st=S.checked?(need.has(k)?'ok':'no'):'';
      const dd=pathD([[a.x,a.y],[b.x,b.y]]);
      o+=`<path class="e u ${st}" d="${dd}"/><path class="hit" data-line="${k}" d="${dd}"/>`;
    }
    if(S.reveal)for(const e of S.todo){if(S.lines.some(l=>key(l[0],l[1])===key(e.f,e.t)))continue;const a=P(byId[e.f]),b=P(byId[e.t]);o+=`<path class="e u ans" d="${pathD([[a.x,a.y],[b.x,b.y]])}"/>`}
  }
  // 노드
  for(const n of d.nodes){
    if(hideDeco&&(n.deco||!S.live.has(n.id)))continue;
    const p=P(n);
    const isBlank=blankSet.has(n.id);
    const focusable=!n.deco||S.mode==='explore';
     const rotSym=n.rot&&!(S.mode==='draw'&&S.shuffle);
    o+=`<g data-n="${n.id}" transform="translate(${p.x} ${p.y})" ${focusable&&n.label?'tabindex="0" role="button"':''} aria-label="${esc(plain(n.label)||'')}">`;
    {const fl=S.mode==='draw'&&S.shuffle,pw=!fl&&n.W?n.W/2:44,ph=!fl&&n.H?n.H/2:40;o+=`<rect class="pad" x="${-pw}" y="${-ph}" width="${2*pw}" height="${2*ph}"/>`}
    if(isBlank){
      const val=S.reveal?plain(n.label):S.placed[n.id];
      const st=S.checked||S.reveal?(val===plain(n.label)?'right':'wrong'):'';
      const W=val?Math.max(96,val.length*15+16):64;
      if(S.level!=='hard'&&!val&&!n.W)o+=`<g opacity=".35">${sym(n)}</g>`;
      o+=`<rect class="blank ${S.chip!=null&&!val?'tgt':''} ${st}" data-blank="${n.id}" x="${-W/2}" y="-20" width="${W}" height="40"/>`;
      o+=val?`<text class="fill">${esc(val)}</text>`:(S.level==='hard'?`<text class="q">?</text>`:'');
    }else{
      o+=rotSym?`<g transform="rotate(90)">${sym(n)}</g>`:sym(n);
      const hideLabel=(n.kind==='j'&&S.mode!=='draw')||(n.deco&&S.mode==='puzzle');
      if(n.kind==='j'&&S.mode==='explore'&&S.sel===n.id)o+=labelSvg({...n,lp:'t'},p);
      else if(!hideLabel)o+=labelSvg(n,p,flat);
    }
    const on=(S.mode==='explore'&&!cur&&S.sel===n.id)||(cur&&cur.n.includes(n.id))||(S.mode==='draw'&&S.from===n.id)||pickedNodes.has(n.id);
    if(on&&n.W&&!(S.mode==='draw'&&S.shuffle))o+=`<rect class="ring" x="${-n.W/2-6}" y="${-n.H/2-6}" width="${n.W+12}" height="${n.H+12}"/>`;
    else if(on){const h=n.kind==='j'?16:n.kind==='gauge'?0:halfBox(n)+6;o+=`<rect class="ring" x="${-h-8}" y="${n.kind==='gauge'?-60:-h-2}" width="${2*h+16}" height="${n.kind==='gauge'?68:2*h+4}"/>`}
    o+='</g>';
  }
  $('stage').innerHTML=o;
  renderBars();renderPanel(d,byId);
}
function renderBars(){
  $('sysSeg').innerHTML=SYSTAB.map(([k,t])=>`<button type="button" data-v="${k}" aria-pressed="${S.sys===k}">${t}</button>`).join('');
  $('modeSeg').innerHTML=MODES.map(([k,t])=>`<button type="button" data-v="${k}" aria-pressed="${S.mode===k}">${t}</button>`).join('');
  $('levelSeg').innerHTML=LEVELS.map(([k,t])=>`<button type="button" data-v="${k}" aria-pressed="${S.level===k}">${t}</button>`).join('');
  const g=S.mode==='puzzle'||S.mode==='draw',ord=S.mode==='order';
  $('levelGroup').hidden=!g;$('seedGroup').hidden=!(g||ord);$('newBtn').hidden=!(g||ord);
  if(document.activeElement!==$('seedInput'))$('seedInput').value=S.seed;
  $('teachBtn').textContent=S.canEdit?'교수 모드 끄기':'교수 모드';
  $('tbName').textContent=SYS[S.sys].name;$('tbMode').textContent=MODES.find(m=>m[0]===S.mode)[1];
  $('tbSeed').textContent=g||ord?S.seed:'-';$('tbCode').textContent=SYS[S.sys].code;
}

/* ─── 패널 ─── */
function renderPanel(d,byId){
  const p=$('panel');
  if(S.mode==='explore'){
    const cur=S.step>=0?d.steps[S.step]:null;
    let h=`<div class="player"><button class="btn primary" id="playBtn" type="button">${S.timer?'멈춤':'화재 시나리오 재생'}</button><button class="btn" id="prevBtn" type="button" ${S.step<=0?'disabled':''}>이전</button><button class="btn" id="nextBtn" type="button" ${S.step>=d.steps.length-1?'disabled':''}>다음</button><span class="count">${S.step+1}/${d.steps.length}</span></div>`;
    if(cur){
      h+=`<div><div class="eyebrow">${S.step+1}단계</div><h2>${esc(cur.t)}</h2></div><p>${esc(cur.d)}</p>`;
      h+=`<button class="btn" id="endBtn" type="button">재생 끝내고 부품 보기</button>`;
    }else{
      const n=byId[S.sel]||d.nodes.find(x=>x.kind==='pump'||x.kind==='panel');S.sel=n.id;
      const nb=d.edges.filter(e=>!e.deco&&(e.f===n.id||e.t===n.id)).map(e=>e.f===n.id?{to:e.t,dir:'다음'}:{to:e.f,dir:'이전'});
      const pv=nb.filter(x=>x.dir==='이전').map(x=>plain(byId[x.to].label)),nx=nb.filter(x=>x.dir==='다음').map(x=>plain(byId[x.to].label));
      const nm=plain(n.label),ph=S.photos[nm];
      h+=`<div><div class="eyebrow">선택한 부품</div><h2>${esc(nm)}</h2></div>`;
      h+=`<figure class="photo">${ph?`<img src="${esc(ph)}" alt="${esc(nm)} 실물 사진">`:`<figcaption>${S.canEdit?'아직 실물 사진이 없습니다. 아래에서 사진을 넣어 주세요.':'아직 실물 사진이 없습니다.'}</figcaption>`}</figure>`;
      h+=`<div class="row"><a class="btn" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent('소방 '+nm)}" target="_blank" rel="noopener">사진 검색</a>${S.canEdit?`<label class="btn" for="photoFile">${ph?'사진 바꾸기':'사진 넣기'}</label><input id="photoFile" type="file" accept="image/*" hidden>${S.local[nm]?'<button class="btn" id="photoDel" type="button">사진 삭제</button>':''}`:''}</div>${S.photoMsg?`<p class="help">${esc(S.photoMsg)}</p>`:''}`;
      h+=`<p>${esc(n.role)}</p>`;
      if(n.tip)h+=`<p class="tip"><b>확인할 점</b> ${esc(n.tip)}</p>`;
      if(pv.length||nx.length)h+=`<p class="nbrs">${pv.length?`앞: ${esc(pv.join(', '))}`:''}${pv.length&&nx.length?'<br>':''}${nx.length?`뒤: ${esc(nx.join(', '))}`:''}</p>`;
      h+=`<p class="help">도면의 부품을 누르면 역할과 연결 위치가 나옵니다.</p>`;
    }
    p.innerHTML=h;return;
  }
  if(S.mode==='puzzle'){
    const used=Object.values(S.placed);const pool=[...S.chips];
    const remain=[];const cnt={};used.forEach((u:any)=>cnt[u]=(cnt[u]||0)+1);
    for(const c of pool){if(cnt[c.t]){cnt[c.t]--;continue}remain.push(c)}
    let res='';
    if(S.checked){const ok=scorePuzzle(d,S.blanks,S.placed);res=`<p class="result ${ok===S.blanks.length?'ok':'no'}">${ok===S.blanks.length?'모두 맞았습니다':`${S.blanks.length}칸 중 ${ok}칸 정답`}</p>`}
    p.innerHTML=`<div><div class="eyebrow">빈칸 ${S.blanks.length}개</div><h2>부품을 제자리에 넣으세요</h2></div>
     <p class="help">부품을 빈칸으로 끌어 놓거나, 부품을 누른 뒤 빈칸을 누르세요. 넣은 부품을 누르면 다시 빠집니다.${S.mirror?' 이번 도면은 좌우가 뒤집혀 있습니다.':''}${S.level==='hard'?' 쓰이지 않는 부품도 섞여 있습니다.':''}</p>
     <div class="chips" id="chips">${remain.map(c=>`<button type="button" class="chip" data-chip="${c.i}" aria-pressed="${S.chip===c.i}">${esc(c.t)}</button>`).join('')||'<span class="help">부품을 모두 넣었습니다.</span>'}</div>
     ${res}<div class="row"><button class="btn primary" id="checkBtn" type="button">채점</button><button class="btn" id="ansBtn" type="button">정답 보기</button><button class="btn" id="resetBtn" type="button">다시 하기</button></div>`;
    return;
  }
  if(S.mode==='draw'){
    let res='';
    if(S.checked){const {ok,bad}=scoreDraw(S.todo,S.lines);res=`<p class="result ${ok===S.todo.length&&!bad?'ok':'no'}">${ok===S.todo.length&&!bad?'모든 연결이 맞습니다':`${S.todo.length}개 중 ${ok}개 정답, 잘못된 선 ${bad}개`}</p>`}
    p.innerHTML=`<div><div class="eyebrow">그릴 연결 ${S.todo.length}개</div><h2>끊어진 배관과 신호선을 이으세요</h2></div>
     <p class="help">부품 두 개를 차례로 누르면 선이 그어집니다. 그은 선을 누르면 지워집니다. 분기점도 하나의 부품처럼 연결하세요.</p>
     ${d.groups?`<div class="chips">${d.groups.map((g,i)=>`<button type="button" class="btn" data-g="${i}" style="${(S.group||0)===i?'background:var(--ink);color:var(--sheet)':''}" aria-pressed="${(S.group||0)===i}">${g[0]}</button>`).join('')}</div>`:''}
     <div class="row"><button class="btn" id="shufBtn" type="button" aria-pressed="${S.shuffle}">${S.shuffle?'원래 도면 위치로':'부품 배치 섞기'}</button></div>
     <p class="count">그은 선 ${S.lines.length}개</p>${res}
     <div class="row"><button class="btn primary" id="checkBtn" type="button">채점</button><button class="btn" id="ansBtn" type="button">정답 보기</button><button class="btn" id="resetBtn" type="button">다시 하기</button></div>`;
    return;
  }
  // order
  const allPicked=S.pick.length===S.cards.length;
  let res='';
  if(S.checked){const ok=scoreOrder(S.pick);res=`<p class="result ${ok===S.cards.length?'ok':'no'}">${ok===S.cards.length?'순서가 모두 맞습니다':`${S.cards.length}단계 중 ${ok}단계 정답`}</p>`}
  p.innerHTML=`<div><div class="eyebrow">동작 ${S.cards.length}단계</div><h2>먼저 일어나는 일부터 누르세요</h2></div>
   <p class="help">누른 순서대로 번호가 붙습니다. 번호가 붙은 카드를 다시 누르면 빠집니다.</p>
   <ol class="steps">${S.cards.map(c=>{const ix=S.pick.indexOf(c.i);const st=S.checked&&ix>=0?(ix===c.i?'right':'wrong'):ix>=0?'sel':'';return `<li><button type="button" class="${st}" data-card="${c.i}"><span class="no">${S.reveal?c.i+1:ix>=0?ix+1:'·'}</span><span>${esc(c.t)}</span></button></li>`}).join('')}</ol>
   ${res}<div class="row"><button class="btn primary" id="checkBtn" type="button" ${allPicked?'':'disabled'}>채점</button><button class="btn" id="ansBtn" type="button">정답 보기</button><button class="btn" id="resetBtn" type="button">다시 하기</button></div>`;
}

/* ─── 재생 ─── */
function stopPlay(){if(S.timer){clearInterval(S.timer);S.timer=null}}
function play(){
  if(S.timer){stopPlay();render();return}
  const d=SYS[S.sys];if(S.step>=d.steps.length-1||S.step<0)S.step=0;
  S.timer=setInterval(()=>{if(S.step>=d.steps.length-1){stopPlay();render();return}S.step++;render()},3200);render();
}

/* ─── 입력 ─── */
function nodeTap(id){
  const d=SYS[S.sys],n=d.nodes.find(x=>x.id===id);
  if(S.mode==='explore'){if(S.step>=0)return;if(n.label){S.sel=id;render()}return}
  if(S.mode==='puzzle'){
    if(!S.blanks.includes(id)||S.reveal)return;
    if(S.placed[id]){delete S.placed[id];S.checked=false;render();return}
    if(S.chip!=null){S.placed[id]=S.chips.find(c=>c.i===S.chip).t;S.chip=null;S.checked=false;render()}
    return;
  }
  if(S.mode==='draw'){
    if(n.deco)return;
    if(!S.from){S.from=id;render();return}
    if(S.from===id){S.from=null;render();return}
    const k=key(S.from,id);
    const given=S.given.some(e=>key(e.f,e.t)===k);
    if(!given&&!S.lines.some(l=>key(l[0],l[1])===k))S.lines.push([S.from,id]);
    S.from=null;S.checked=false;render();
  }
}
$('stage').addEventListener('click',e=>{
  const l=e.target.closest('[data-line]');
  if(l){S.lines=S.lines.filter(x=>key(x[0],x[1])!==l.dataset.line);S.checked=false;render();return}
  const g:any=(e.target as any).closest('[data-n]');if(g)nodeTap(g.dataset.n);
});
$('stage').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g:any=(e.target as any).closest('[data-n]');if(g){e.preventDefault();nodeTap(g.dataset.n)}});
$('sysSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.sys=b.dataset.v;S.group=0;S.sel=SYS[S.sys].nodes.find(n=>n.kind==='pump'||n.kind==='panel').id;setup()});
$('modeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.v;setup()});
$('levelSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.level=b.dataset.v;setup()});
$('newBtn').addEventListener('click',()=>{S.seed=randSeed();$('seedInput').value=S.seed;setup()});
$('seedInput').addEventListener('change',e=>{const v=parseInt(e.target.value,10);if(v>=0&&v<=9999){S.seed=v;setup()}else e.target.value=S.seed});
$('teachBtn').addEventListener('click',()=>{S.canEdit=!S.canEdit;try{localStorage.setItem('teacher',S.canEdit?'1':'0')}catch{}render()});
$('fitBtn').addEventListener('click',e=>{const on=$('stage').classList.toggle('fit');e.target.textContent=on?'도면 크게 보기':'도면 전체 보기'});
$('fullBtn').addEventListener('click',()=>{const a=$('app');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else a.requestFullscreen?.().catch(()=>{})});
$('panel').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;const d=SYS[S.sys];
  if(t.id==='playBtn')play();
  else if(t.id==='prevBtn'){stopPlay();S.step=Math.max(0,S.step-1);render()}
  else if(t.id==='nextBtn'){stopPlay();S.step=Math.min(d.steps.length-1,S.step+1);render()}
  else if(t.id==='endBtn'){stopPlay();S.step=-1;render()}
  else if(t.id==='photoDel')delPhoto();
  else if(t.id==='checkBtn'){S.checked=true;render()}
  else if(t.id==='ansBtn'){S.reveal=true;if(S.mode==='order'){S.pick=d.steps.map((_,i)=>i);S.checked=true}render()}
  else if(t.id==='resetBtn')setup();
  else if(t.id==='shufBtn'){S.shuffle=!S.shuffle;setup()}
  else if(t.dataset.g!=null){S.group=+t.dataset.g;setup()}
  else if(t.dataset.card!=null){const i=+t.dataset.card,ix=S.pick.indexOf(i);if(ix>=0)S.pick.splice(ix,1);else S.pick.push(i);S.checked=false;S.reveal=false;render()}
});
/* 부품 끌기: 마우스와 터치 공통 */
let drag=null;
$('panel').addEventListener('change',e=>{if(e.target.id==='photoFile'&&e.target.files[0])addPhoto(e.target.files[0])});
$('panel').addEventListener('pointerdown',e=>{
  const c=e.target.closest('[data-chip]');if(!c)return;
  drag={i:+c.dataset.chip,x:e.clientX,y:e.clientY,moved:false,ghost:null,pid:e.pointerId};
});
window.addEventListener('pointermove',e=>{
  if(!drag)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  if(!drag.moved){drag.moved=true;drag.ghost=document.createElement('div');drag.ghost.className='ghost';drag.ghost.textContent=S.chips.find(c=>c.i===drag.i).t;$('app').appendChild(drag.ghost)}
  drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
});
window.addEventListener('pointerup',e=>{
  if(!drag)return;const dr=drag;drag=null;
  if(dr.ghost)dr.ghost.remove();
  if(!dr.moved){S.chip=S.chip===dr.i?null:dr.i;render();return}
  const el=document.elementFromPoint(e.clientX,e.clientY),g:any=el&&el.closest('[data-n]');
  if(g&&S.blanks.includes(g.dataset.n)&&!S.placed[g.dataset.n]){S.placed[g.dataset.n]=S.chips.find(c=>c.i===dr.i).t;S.chip=null;S.checked=false;render()}
});
window.addEventListener('pointercancel',()=>{if(drag&&drag.ghost)drag.ghost.remove();drag=null});


setup();
loadPhotos().then(render);
