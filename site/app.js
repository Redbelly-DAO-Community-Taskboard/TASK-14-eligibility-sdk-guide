const $ = (s) => document.querySelector(s);
const cache = {};
const I = {
  overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  guide:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  react:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
  code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/></svg>',
  patterns:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M12 12H5v5M12 12h7v5"/></svg>',
  errors:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
  downloads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg>',
  server:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
};
const HERO_ART = `<svg class="heroart" viewBox="0 0 240 240">
  <g class="ring" stroke="#FF5050" stroke-width="1" fill="none" opacity=".5"><circle cx="120" cy="120" r="92" stroke-dasharray="4 7"/></g>
  <circle cx="120" cy="120" r="40" fill="rgba(255,80,80,.14)" stroke="#FF5050" stroke-width="1.5"/>
  <path d="M108 120l9 9 18-18" stroke="#ff9b9b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="120" cy="28" r="5" fill="#16c0c8"/><circle cx="212" cy="120" r="5" fill="#f5a623"/><circle cx="120" cy="212" r="5" fill="#7c6cf2"/><circle cx="28" cy="120" r="5" fill="#7db0ff"/>
  <image href="mascot.png" class="mascot" x="150" y="150" width="86" height="86"/>
</svg>`;
const NAVI=[["overview","Overview"],["guide","Integration guide"],["code","Code examples"],["patterns","Patterns and tree"],["errors","Error reference"],["downloads","Downloads"]];
$("#nav").innerHTML=NAVI.map(([s,l],i)=>`<a data-s="${s}" class="${i===0?'active':''}">${I[s]||''}<span>${l}</span></a>`).join("");

async function md(file){ if(!cache[file]) cache[file]=await (await fetch("content/"+file,{cache:"no-cache"})).text(); const h=marked.parse(cache[file]); return window.DOMPurify?DOMPurify.sanitize(h):h; }
async function raw(file){ if(!cache[file]) cache[file]=await (await fetch(file,{cache:"no-cache"})).text(); return cache[file]; }
function highlight(r){ r.querySelectorAll("pre code").forEach(c=>{try{hljs.highlightElement(c)}catch{}}); }

const CODE_FILES = [
  ["EligibilityComponents.jsx","jsx","code/EligibilityComponents.jsx.txt"],
  ["App.jsx","jsx","code/App.jsx.txt"],
  ["wallet.jsx","jsx","code/wallet.jsx.txt"],
  ["redbelly-chain.js","js","code/redbelly-chain.js.txt"],
  ["provider.tsx","tsx","code/provider.tsx.txt"],
  ["sdk-route.ts","ts","code/sdk-route.ts.txt"],
  ["session-route.ts","ts","code/session-route.ts.txt"],
  ["middleware.ts","ts","code/middleware.ts.txt"],
  ["verifier.js","js","code/verifier.js.txt"],
];

const HTML_SECTIONS = {
  overview: () => `
    <div class="hero reveal">${HERO_ART}<div class="htext">
      <h1>Redbelly EligibilitySDK · Integration Guide</h1>
      <p class="lead">Everything to add Redbelly eligibility checks to a dApp: React 18 hooks and widgets, Next.js 14 App Router server-side verification, an Iden3 backend, a complete error reference, and a visual decision tree.</p>
      <div class="meta"><span class="chip">React 18</span><span class="chip">Next.js 14 App Router</span><span class="chip">Chain 153</span><span class="chip">Iden3 verify</span></div></div>
    </div>
    <div class="stats">
      <div class="stat reveal">${I.react}<div class="n" data-count="2">0</div><div class="l">Hooks covered</div></div>
      <div class="stat reveal">${I.server}<div class="n" data-count="3">0</div><div class="l">Backend routes</div></div>
      <div class="stat reveal">${I.errors}<div class="n" data-count="20">0</div><div class="l">Error surfaces mapped</div></div>
      <div class="stat reveal">${I.bolt}<div class="n">&lt;4h</div><div class="l">Target integration time</div></div>
    </div>
    <div class="section reveal"><h2 class="sech">Explore</h2>
    <div class="fcards">
      <div class="fcard" data-go="guide"><div class="ic">${I.guide}</div><h3>Integration guide</h3><p>Install through production, step by step.</p><div class="go">Read &rsaquo;</div></div>
      <div class="fcard" data-go="code"><div class="ic">${I.code}</div><h3>Code examples</h3><p>React 18 and Next.js 14 App Router files, ready to copy.</p><div class="go">View &rsaquo;</div></div>
      <div class="fcard" data-go="patterns"><div class="ic">${I.patterns}</div><h3>Patterns and tree</h3><p>Which SDK pieces to combine, as a visual decision tree.</p><div class="go">Open &rsaquo;</div></div>
      <div class="fcard" data-go="errors"><div class="ic">${I.errors}</div><h3>Error reference</h3><p>Every documented error surface and its fix.</p><div class="go">Open &rsaquo;</div></div>
    </div></div>`,
  code: () => `
    <div class="hero reveal">${HERO_ART}<div class="htext"><h1>Code examples</h1><p class="lead">React 18 components (built on the official DAO boilerplate) and Next.js 14 App Router server-side files. Pick a file.</p></div></div>
    <div class="codetabs reveal">${CODE_FILES.map((c,i)=>`<span class="codetab ${i===0?'on':''}" data-cf="${c[2]}" data-lang="${c[1]}">${c[0]}</span>`).join("")}</div>
    <div id="codeview"></div>`,
  patterns: async () => `
    <div class="hero reveal">${HERO_ART}<div class="htext"><h1>Integration patterns and decision tree</h1><p class="lead">Choose the right combination of hooks and widgets for your dApp.</p></div></div>
    <div class="diagram reveal"><img data-zoom="diagram/decision-tree.png" src="diagram/decision-tree.png" alt="EligibilitySDK decision tree"></div>
    <div class="md reveal">${await md("patterns.md")}</div>`,
  downloads: () => `
    <div class="hero reveal">${HERO_ART}<div class="htext"><h1>Downloads</h1><p class="lead">Raw deliverable files.</p></div></div>
    <div class="dl reveal">
      <a class="btn" href="content/guide.md" download>Guide</a><a class="btn" href="content/errors.md" download>Error reference</a>
      <a class="btn" href="content/patterns.md" download>Patterns</a><a class="btn" href="diagram/decision-tree.png" download>Decision tree</a>
      ${CODE_FILES.map(c=>`<a class="btn" href="${c[2]}" download>${c[0]}</a>`).join("")}
    </div>`,
};
const MD_SECTIONS = { guide:"guide.md", errors:"errors.md" };

const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");if(e.target.classList.contains("stat"))countup(e.target);io.unobserve(e.target);}}),{threshold:.15});
function observe(root){root.querySelectorAll(".reveal").forEach(el=>io.observe(el));}
function countup(stat){const el=stat.querySelector("[data-count]");if(!el)return;const to=parseFloat(el.dataset.count);let s=null;function step(t){if(!s)s=t;const p=Math.min(1,(t-s)/900);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function staggerReveal(root){const k=root.querySelectorAll(".md > *");k.forEach((el,i)=>{if(i<24){el.style.animation="fadeup .5s both";el.style.animationDelay=(i*0.03)+"s";}});}

async function loadCode(path,lang){
  const t=await raw(path);
  const view=$("#codeview");
  view.innerHTML=`<div class="md"><pre><code class="language-${lang}"></code></pre></div>`;
  view.querySelector("code").textContent=t;
  highlight(view);
}
async function show(s){
  const c=$("#content");
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("active",a.dataset.s===s));
  c.classList.remove("swap");void c.offsetWidth;c.classList.add("swap");
  if(HTML_SECTIONS[s]){ c.innerHTML=`<div class="md">${await HTML_SECTIONS[s]()}</div>`; observe(c);
    if(s==="code"){ loadCode(CODE_FILES[0][2],CODE_FILES[0][1]);
      c.querySelectorAll(".codetab").forEach(t=>t.addEventListener("click",()=>{c.querySelectorAll(".codetab").forEach(x=>x.classList.remove("on"));t.classList.add("on");loadCode(t.dataset.cf,t.dataset.lang);})); }
    if(s==="patterns") highlight(c);
  } else if(MD_SECTIONS[s]){ c.innerHTML=`<div class="md">${await md(MD_SECTIONS[s])}</div>`; highlight(c); staggerReveal(c); }
  location.hash=s; window.scrollTo(0,0); $("#sidebar").classList.remove("open");
}
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>show(a.dataset.s)));
document.addEventListener("click",(e)=>{const g=e.target.closest("[data-go]");if(g){show(g.dataset.go);return;}const z=e.target.closest("[data-zoom]");if(z){$("#modalimg").src=z.dataset.zoom;$("#modal").classList.add("open");}});
const modal=$("#modal");
function closeModal(){modal.classList.remove("open");$("#modalimg").src="";}
$("#modalx").addEventListener("click",closeModal);
modal.addEventListener("click",(e)=>{if(e.target===modal)closeModal();});
document.addEventListener("keydown",(e)=>{if(e.key==="Escape")closeModal();});
const prog=$("#prog");
window.addEventListener("scroll",()=>{const h=document.documentElement;prog.style.width=(h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight)*100)+"%";},{passive:true});
$("#menubtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
(function particles(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv=$("#particles"),x=cv.getContext("2d");let w,h,pts;
  function size(){w=cv.width=innerWidth;h=cv.height=innerHeight;pts=Array.from({length:Math.min(70,Math.floor(w/22))},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25}));}
  size();addEventListener("resize",size);
  (function loop(){x.clearRect(0,0,w,h);
    for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;}
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){x.strokeStyle="rgba(255,80,80,"+(0.09*(1-d/120))+")";x.lineWidth=1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();}}
    for(const p of pts){x.fillStyle="rgba(125,176,255,.5)";x.beginPath();x.arc(p.x,p.y,1.4,0,7);x.fill();}
    requestAnimationFrame(loop);})();
})();
const start=(location.hash||"#overview").slice(1);
show(start in {...HTML_SECTIONS,...MD_SECTIONS}?start:"overview");
