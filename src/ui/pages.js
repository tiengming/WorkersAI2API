import { hasAdminPassword, isAdmin } from '../auth.js';

const BASE_CSS = `
:root{color-scheme:light dark;--bg:#f7f7f5;--panel:#ffffff;--panel-2:#f1f1ee;--ink:#141518;--muted:#6b6f76;--line:#deded8;--accent:#e85d04;--accent-ink:#fff;--ok:#0f7b4f;--warn:#a15c00;--bad:#b42318;--shadow:0 1px 2px rgba(0,0,0,.05),0 12px 32px rgba(0,0,0,.06)}
@media (prefers-color-scheme:dark){:root{--bg:#0c0d0f;--panel:#141619;--panel-2:#1b1e22;--ink:#eceef0;--muted:#9aa0a8;--line:#2a2e34;--accent:#ff7a1a;--accent-ink:#141518;--ok:#4ade80;--warn:#fbbf24;--bad:#f87171;--shadow:0 1px 2px rgba(0,0,0,.4),0 18px 48px rgba(0,0,0,.28)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}code,pre,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;gap:16px;height:62px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-.02em;text-decoration:none}
.brand .mark{width:26px;height:26px;border-radius:7px;background:var(--accent);display:grid;place-items:center;color:var(--accent-ink);font-size:15px;font-weight:800}
.nav .spacer{flex:1}
.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:12px;color:var(--muted);background:var(--panel)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok) 18%,transparent)}
.dot.off{background:var(--bad);box-shadow:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px;padding:9px 14px;font:600 13px/1 inherit;cursor:pointer;text-decoration:none;transition:.15s}
.btn:hover{border-color:var(--muted)}.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.btn.primary:hover{filter:brightness(1.06)}
.btn.danger{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 35%,var(--line))}
.btn.sm{padding:6px 10px;font-size:12px;border-radius:7px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.hero{padding:74px 0 48px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 16px}
h1{font-size:clamp(38px,6vw,68px);line-height:1.02;letter-spacing:-.045em;margin:0 0 18px;max-width:900px;font-weight:750}
.hero p.lead{font-size:18px;color:var(--muted);max-width:660px;margin:0 0 28px}
.endpoint{display:flex;align-items:stretch;gap:0;max-width:660px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)}
.endpoint code{flex:1;padding:14px 16px;font-size:13px;overflow:auto;white-space:nowrap;display:flex;align-items:center}
.endpoint button{border:0;border-left:1px solid var(--line);border-radius:0;background:var(--panel-2);padding:0 16px;font-weight:600;font-size:12px;cursor:pointer;color:var(--ink)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:34px}
.stat{background:var(--panel);padding:18px 20px}.stat b{display:block;font-size:26px;letter-spacing:-.03em}.stat span{font-size:12px;color:var(--muted)}
section.block{padding:54px 0}
.block-head{display:flex;align-items:end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px}
.block-head h2{font-size:28px;letter-spacing:-.03em;margin:0}.block-head p{margin:6px 0 0;color:var(--muted);font-size:14px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
input,select,textarea{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:9px 11px;min-width:0}
input:focus,select:focus,textarea:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);outline-offset:1px}
textarea{width:100%;min-height:90px;resize:vertical;font-family:ui-monospace,monospace;font-size:12.5px}
.table-wrap{border:1px solid var(--line);border-radius:14px;overflow:auto;background:var(--panel);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:900px}
th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:12px 14px;border-bottom:1px solid var(--line);background:var(--panel-2);position:sticky;top:0}
td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}tbody tr:hover{background:color-mix(in srgb,var(--accent) 5%,transparent)}
.model-name{font-weight:650;letter-spacing:-.01em}.model-id{font-size:11.5px;color:var(--muted);word-break:break-all}
.badge{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:600;color:var(--muted);margin:1px 3px 1px 0;white-space:nowrap}
.badge.hot{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.badge.paid{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,var(--line))}
.rank{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--panel-2);font:700 11px/1 ui-monospace,monospace;color:var(--muted)}
.tier{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font:800 11px/1 ui-monospace,monospace}
.tier.S{background:#111;color:#fff}.tier.A{background:var(--accent);color:var(--accent-ink)}.tier.B{background:color-mix(in srgb,var(--accent) 25%,var(--panel-2))}.tier.C{background:var(--panel-2);color:var(--muted)}.tier.D{background:transparent;border:1px solid var(--line);color:var(--muted)}
.price{font-family:ui-monospace,monospace;font-size:12px;white-space:nowrap}
.muted{color:var(--muted)}.small{font-size:12px}.nowrap{white-space:nowrap}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:var(--shadow)}
.card h3{margin:0 0 8px;font-size:16px;letter-spacing:-.01em}.card p{margin:0 0 14px;color:var(--muted);font-size:13.5px}
.card a{font-weight:600;text-decoration:none;color:var(--accent);font-size:13px}
.usage-bar{height:9px;border-radius:99px;background:var(--panel-2);overflow:hidden;border:1px solid var(--line)}
.usage-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),#f0a35e);width:0;transition:width .4s}
.grid2{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}
.list{list-style:none;margin:0;padding:0}.list li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}.list li:last-child{border-bottom:0}
.note{border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--panel);border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;color:var(--muted)}
footer{border-top:1px solid var(--line);padding:28px 0 48px;color:var(--muted);font-size:12.5px}
.login{min-height:100vh;display:grid;place-items:center;padding:24px}
.login .card{width:100%;max-width:400px}
.field{display:block;margin-bottom:14px}.field span{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px}
.field input{width:100%}
.msg{font-size:12.5px;padding:9px 11px;border-radius:8px;margin:10px 0;display:none}.msg.show{display:block}
.msg.ok{background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--ok)}.msg.err{background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad)}
.app{display:grid;grid-template-columns:210px 1fr;min-height:calc(100vh - 62px)}
.side{border-right:1px solid var(--line);padding:22px 14px;background:var(--panel)}
.side button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:9px 11px;font:600 13px/1 inherit;color:var(--muted);cursor:pointer;margin-bottom:2px}
.side button:hover{background:var(--panel-2);color:var(--ink)}.side button.active{background:var(--panel-2);color:var(--ink);box-shadow:inset 2px 0 0 var(--accent)}
.main{padding:28px 30px 60px;min-width:0}
.tab{display:none}.tab.active{display:block}
.main h2{font-size:24px;letter-spacing:-.03em;margin:0 0 4px}.main .sub{color:var(--muted);font-size:13px;margin:0 0 22px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:15px}.kpi b{display:block;font-size:22px;letter-spacing:-.03em}.kpi span{font-size:11.5px;color:var(--muted)}
.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.form{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;align-items:end}
.form .wide{grid-column:1/-1}
.row-actions{display:flex;gap:6px;flex-wrap:wrap}
.tiny{font-size:11.5px;color:var(--muted)}
.kv{display:grid;grid-template-columns:120px 1fr;gap:8px;font-size:13px}.kv dt{color:var(--muted)}.kv dd{margin:0;word-break:break-all}
pre.code{background:var(--panel-2);border:1px solid var(--line);border-radius:9px;padding:12px;overflow:auto;font-size:12px}
details summary{cursor:pointer;font-weight:600;font-size:13px}
@media(max-width:900px){.stats,.cards,.kpis{grid-template-columns:1fr 1fr}.app{grid-template-columns:1fr}.side{border-right:0;border-bottom:1px solid var(--line);display:flex;gap:6px;overflow:auto;padding:12px}.side button{width:auto;white-space:nowrap}.main{padding:20px 18px 48px}.split,.grid2,.form{grid-template-columns:1fr}h1{font-size:42px}}
@media(max-width:560px){.stats,.cards,.kpis{grid-template-columns:1fr}.wrap{padding:0 16px}.hero{padding:48px 0 34px}.endpoint code{font-size:11px}}
.docs{max-width:860px;padding:52px 0 72px}
.docs h1{font-size:38px;margin-bottom:10px}
.docs h2{font-size:22px;letter-spacing:-.02em;margin:34px 0 10px}
.docs h3{font-size:16px;margin:22px 0 8px}
.docs p,.docs li{color:var(--muted);font-size:14.5px}
.docs strong{color:var(--ink)}
.docs code{background:var(--panel-2);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:12.5px}
.docs pre{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto;font-size:12.5px;line-height:1.55}
.docs pre code{background:none;border:0;padding:0}
.docs table{min-width:0;font-size:13px;margin:12px 0}
.docs th,.docs td{padding:9px 11px}
.docs ul{padding-left:20px}
.docs .callout{border-left:3px solid var(--accent);background:var(--panel);padding:12px 15px;border-radius:0 8px 8px 0;margin:18px 0;font-size:13.5px;color:var(--muted)}
`;

const CLIENT_HELPERS = `
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||d.error||('HTTP '+r.status));return d}
function nf(n){return Number(n||0).toLocaleString('en-US')}
function money(v){return Number(v)<0.01?'$'+Number(v).toFixed(4):'$'+Number(v).toFixed(3)}
function priceOf(m){const t=m.pricing?.tokens||{};if(t.input_usd_per_million!=null||t.output_usd_per_million!=null){const inP=t.input_usd_per_million!=null?money(t.input_usd_per_million):'—';const outP=t.output_usd_per_million!=null?money(t.output_usd_per_million):'—';return inP+' in · '+outP+' out /M'}return m.pricing?.display||'—'}
function taskLabel(t){return {'text-generation':'Text','text-embeddings':'Embeddings','text-to-image':'Image','automatic-speech-recognition':'Speech → text','text-to-speech':'Text → speech','text-classification':'Classification','image-to-text':'Image → text','translation':'Translation','summarization':'Summarization','image-classification':'Image classification','object-detection':'Object detection'}[t]||t}
function caps(m){const c=m.capabilities||{};return [c.reasoning&&'reasoning',c.function_calling&&'tools',c.vision&&'vision',c.audio_input&&'audio in',c.audio_output&&'audio out',c.structured_output&&'JSON'].filter(Boolean)}
function tier(m){return m.performance?.tier||'C'}
function setMsg(el,text,ok=true){el.textContent=text;el.className='msg show '+(ok?'ok':'err')}
function copyText(text){return navigator.clipboard.writeText(text)}
`;

function shell({ title, body, script = '', authenticated = null }) {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="OpenAI-compatible gateway for every free Cloudflare Workers AI model.">
<style>${BASE_CSS}</style></head><body>${body}
${authenticated === null ? '' : `<script>window.__AUTHENTICATED__=${authenticated ? 'true' : 'false'};</script>`}
<script>${CLIENT_HELPERS}${script}</script></body></html>`;
}

const NAV = `<header class="nav"><div class="wrap">
<a class="brand" href="/"><span class="mark">W</span> Workers AI2API</a>
<span class="pill"><span class="dot" id="health-dot"></span><span id="health-text">checking</span></span>
<span class="spacer"></span>
<a class="btn sm" href="/admin">Admin</a>
</div></header>`;

const LANDING_SCRIPT = `
const state={models:[],meta:{},task:''};
async function load(){
  try{
    const [cat,stats]=await Promise.all([api('/api/catalog?include_paid=0'),api('/api/stats').catch(()=>({}))]);
    state.models=cat.data||[];state.meta=cat.meta||{};
    $('#health-text').textContent=state.meta.stale?'catalog cached':'catalog live';
    $('#health-dot').className='dot'+(state.meta.stale?' off':'');
    $('#stat-models').textContent=nf(state.meta.free_models??state.models.length);
    $('#stat-neurons').textContent=nf(state.meta.free_daily_neurons||10000);
    $('#stat-accounts').textContent=nf(stats.total_accounts||0);
    $('#stat-usage').textContent=(stats.usage_percentage??0)+'%';
    const tasks=[...new Set(state.models.map(m=>m.task))].sort();
    $('#task-filter').innerHTML='<option value="">All tasks</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    render();
  }catch(e){$('#health-text').textContent='offline';$('#error').textContent=e.message;$('#error').className='msg show err'}
}
function render(){
  const q=($('#search').value||'').toLowerCase();const task=$('#task-filter').value;
  let rows=state.models.filter(m=>(!task||m.task===task)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  const sort=$('#sort').value;
  const cmp={performance:(a,b)=>(b.performance?.score||0)-(a.performance?.score||0),price:(a,b)=>{const av=a.pricing?.tokens?.output_usd_per_million??a.pricing?.items?.[0]?.usd??Infinity;const bv=b.pricing?.tokens?.output_usd_per_million??b.pricing?.items?.[0]?.usd??Infinity;return av-bv},context:(a,b)=>(b.context_window||0)-(a.context_window||0),name:(a,b)=>a.name.localeCompare(b.name)};
  rows=[...rows].sort(cmp[sort]||cmp.performance);
  $('#model-rows').innerHTML=rows.map((m,i)=>{
    const t=m.performance||{};const c=caps(m);
    return '<tr><td><span class="rank">'+(t.rank||i+1)+'</span></td>'+
      '<td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div></td>'+
      '<td><span class="badge">'+esc(taskLabel(m.task))+'</span></td>'+
      '<td class="nowrap">'+(m.context_window?nf(m.context_window)+' tok':'—')+'</td>'+
      '<td>'+(c.length?c.map(x=>'<span class="badge">'+esc(x)+'</span>').join(''):'<span class="muted">—</span>')+'</td>'+
      '<td class="price">'+esc(priceOf(m))+'</td>'+
      '<td class="nowrap">'+(m.free_daily_output_tokens?nf(m.free_daily_output_tokens)+' tok/day':'—')+'</td>'+
      '<td><span class="tier '+tier(m)+'">'+tier(m)+'</span> <span class="tiny">'+(t.score??'—')+'</span></td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:24px">No models match this filter.</td></tr>';
  $('#model-count').textContent=rows.length+' of '+state.models.length+' free models';
}
$('#task-filter').addEventListener('change',render);$('#sort').addEventListener('change',render);$('#search').addEventListener('input',render);
$('#copy').addEventListener('click',async()=>{try{await copyText($('#endpoint').textContent.trim());$('#copy').textContent='Copied';setTimeout(()=>$('#copy').textContent='Copy',1400)}catch{}});
$('#endpoint').textContent=location.origin+'/v1';
load();
`;

export async function handleLandingPage() {
	const body = `${NAV}
<main>
<section class="hero"><div class="wrap">
<p class="eyebrow">Independent · Cloudflare Workers AI</p>
<h1>Every free Workers AI model.<br>One OpenAI-compatible endpoint.</h1>
<p class="lead">A dynamic model catalog, per-account free-neuron accounting, and streaming chat, embeddings, images, audio and Anthropic Messages — deployed at the edge.</p>
<div class="endpoint"><code id="endpoint">/v1</code><button id="copy">Copy</button></div>
<div class="stats">
<div class="stat"><b id="stat-models">—</b><span>free models, live catalog</span></div>
<div class="stat"><b id="stat-neurons">10,000</b><span>free neurons / account / day</span></div>
<div class="stat"><b id="stat-accounts">—</b><span>accounts connected</span></div>
<div class="stat"><b id="stat-usage">—</b><span>of daily quota used</span></div>
</div>
<div id="error" class="msg err"></div>
</div></section>
<section class="block" id="models"><div class="wrap">
<div class="block-head"><div><h2>Free model catalog</h2><p id="model-count">Loading…</p></div>
<div class="toolbar"><input id="search" placeholder="Search models…" style="width:210px"><select id="task-filter"><option value="">All tasks</option></select><select id="sort"><option value="performance">Performance</option><option value="price">Price</option><option value="context">Context</option><option value="name">Name</option></select></div></div>
<div class="table-wrap"><table><thead><tr><th>#</th><th>Model</th><th>Task</th><th>Context</th><th>Capabilities</th><th>Price (USD)</th><th>Free daily output</th><th>Tier</th></tr></thead><tbody id="model-rows"><tr><td colspan="8" style="padding:24px" class="muted">Loading live catalog…</td></tr></tbody></table></div>
<p class="tiny" style="margin-top:10px">Ranking is a transparent estimate from parameters, capabilities, context, recency and price. Paid-only models are hidden. Prices come from Cloudflare's live pricing page; the free allowance is 10,000 neurons per account per UTC day.</p>
</div></section>
<section class="block"><div class="wrap"><div class="cards">
<div class="card"><h3>Workers AI vs AI Gateway</h3><p>One runs models and bills neurons. The other is a control layer for caching, logs, retries and unified billing.</p><a href="/docs/workers-ai-vs-ai-gateway">Read the analysis →</a></div>
<div class="card"><h3>OpenAI-compatible API</h3><p><code>/v1/chat/completions</code>, embeddings, images, audio, rerank, Anthropic Messages and a generic <code>/v1/run</code>.</p><a href="/docs/api">Endpoint reference →</a></div>
<div class="card"><h3>Hard free-tier guard</h3><p>Atomic per-account reservations stop requests before the 10,000-neuron daily allocation is exceeded.</p><a href="/docs/free-tier">How accounting works →</a></div>
</div></div></section>
</main>
<footer><div class="wrap">Workers AI2API v2 · Independent project, not affiliated with Cloudflare. Model data and prices belong to Cloudflare.</div></footer>`;
	return shell({ title: 'Workers AI2API — OpenAI-compatible Workers AI gateway', body, script: LANDING_SCRIPT });
}

const ADMIN_LOGIN = `<div class="login"><div class="card">
<div class="brand" style="margin-bottom:18px"><span class="mark">W</span> Workers AI2API</div>
<h2 style="font-size:22px;letter-spacing:-.03em;margin:0 0 4px">Admin sign in</h2>
<p class="sub" style="margin:0 0 18px">Use the <code>ADMIN_PASSWORD</code> configured on this deployment.</p>
<form id="login-form"><label class="field"><span>Password</span><input type="password" id="password" autocomplete="current-password" required autofocus></label>
<button class="btn primary" style="width:100%" type="submit">Sign in</button></form>
<div id="login-msg" class="msg"></div>
<p class="tiny" style="margin-top:16px"><a href="/">← Back to public site</a></p>
</div></div>`;

const ADMIN_SCRIPT = `
const state={overview:null,catalog:null,tab:'overview'};
function showLogin(){bindLogin()}
function bindLogin(){$('#login-form')?.addEventListener('submit',async(e)=>{e.preventDefault();try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});location.reload()}catch(err){setMsg($('#login-msg'),err.message,false)}})}
async function boot(){
  if(!window.__AUTHENTICATED__){showLogin();return}
  $('#logout').addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()});
  $$('.side button').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  bindOverview();bindModels();bindAccounts();bindKeys();bindSettings();
  await Promise.all([loadOverview(),loadModels()]);
}
function switchTab(tab){state.tab=tab;$$('.side button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.tab').forEach(t=>t.classList.toggle('active',t.id==='tab-'+tab));if(tab==='usage')loadOverview();if(tab==='models')loadModels();if(tab==='accounts')loadAccounts();if(tab==='keys')loadKeys();if(tab==='settings')loadSettings()}
async function loadOverview(){
  try{const d=await api('/api/admin/overview');state.overview=d;const u=d.usage;
    $('#kpi-used').textContent=nf(u.totalNeuronsToday);$('#kpi-limit').textContent=nf(u.totalLimit);$('#kpi-remaining').textContent=nf(u.remainingNeurons);$('#kpi-accounts').textContent=nf(u.totalAccounts);
    $('#usage-pct').textContent=(u.usagePercentage||0)+'%';$('#usage-bar').style.width=Math.min(100,u.usagePercentage||0)+'%';
    $('#usage-note').textContent='Local atomic accounting: '+nf(u.totalNeuronsToday)+' used + '+nf(u.reservedNeurons)+' reserved. Cloud analytics: '+nf(u.cloudNeuronsToday)+'. Backend: '+u.quotaBackend+'.';
    $('#account-usage').innerHTML=(u.accounts||[]).map(a=>'<li><span>'+esc(a.name)+'<br><span class="tiny mono">'+esc(a.accountId)+'</span></span><span class="price">'+nf(a.used)+' / '+nf(a.limit)+(a.error?' <span class="badge paid">error</span>':'')+'</span></li>').join('')||'<li class="muted">No active accounts.</li>';
    $('#model-usage').innerHTML=(u.modelsToday||[]).slice(0,8).map(m=>'<li><span class="mono small">'+esc(m.model)+'</span><span class="price">'+nf(m.neurons)+' n</span></li>').join('')||'<li class="muted">No cloud usage data yet.</li>';
    $('#env-info').innerHTML='<dt>Version</dt><dd>'+esc(d.version)+'</dd><dt>KV</dt><dd>'+(d.environment.kv?'bound':'missing')+'</dd><dt>Quota</dt><dd>'+esc(d.environment.quota)+'</dd><dt>Max daily</dt><dd>'+nf(d.environment.maxDailyNeurons)+'</dd><dt>Admin password</dt><dd>'+(d.environment.adminPassword?'set':'missing')+'</dd>';
  }catch(e){location.reload()}
}
function bindOverview(){$('#refresh-usage').addEventListener('click',async(e)=>{e.target.disabled=true;e.target.textContent='Refreshing…';try{const d=await api('/api/admin/usage?force=1');$('#usage-note').textContent='Refreshed. Local '+nf(d.totalNeuronsToday)+' n; cloud '+nf(d.cloudNeuronsToday)+' n.';await loadOverview()}catch(err){alert(err.message)}finally{e.target.disabled=false;e.target.textContent='Refresh analytics'}})}
async function loadModels(){
  try{const cat=await api('/api/admin/catalog');state.catalog=cat;
    $('#catalog-meta').textContent='Source: '+(cat.meta.source||'?')+' · '+(cat.meta.free_models||0)+' free / '+(cat.meta.paid_models||0)+' paid · updated '+new Date(cat.meta.fetched_at).toLocaleString();
    const tasks=[...new Set(cat.data.map(m=>m.task))].sort();
    $('#model-task').innerHTML='<option value="">All tasks</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    renderAdminModels();
  }catch(e){$('#catalog-meta').textContent=e.message}
}
function renderAdminModels(){
  const cat=state.catalog;if(!cat)return;const q=($('#model-search').value||'').toLowerCase();const task=$('#model-task').value;const paid=$('#model-paid').checked;
  let models=cat.data.filter(m=>(!task||m.task===task)&&(paid||m.free)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  $('#admin-model-rows').innerHTML=models.map(m=>{
    const t=m.performance||{};
    return '<tr><td><span class="rank">'+(t.rank||'—')+'</span></td><td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div>'+(m.requires_paid?'<span class="badge paid">paid plan</span>':'')+'</td>'+
    '<td><span class="badge">'+esc(taskLabel(m.task))+'</span></td><td class="nowrap">'+(m.context_window?nf(m.context_window):'—')+'</td><td>'+caps(m).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</td>'+
    '<td class="price">'+esc(priceOf(m))+'</td><td class="nowrap">'+nf(m.pricing?.tokens?.output_neurons_per_million)+' n/M</td><td><span class="tier '+tier(m)+'">'+tier(m)+'</span> '+(t.score??'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:20px">No models.</td></tr>';
  $('#admin-model-count').textContent=models.length+' models';
}
function bindModels(){
  ['#model-search','#model-task','#model-paid'].forEach(s=>$(s)?.addEventListener('input',renderAdminModels));
  $('#refresh-catalog').addEventListener('click',async(e)=>{e.target.disabled=true;e.target.textContent='Refreshing…';try{state.catalog=await api('/api/admin/catalog/refresh',{method:'POST'});renderAdminModels();$('#catalog-meta').textContent='Source: '+state.catalog.meta.source+' · updated '+new Date(state.catalog.meta.fetched_at).toLocaleString()}catch(err){alert(err.message)}finally{e.target.disabled=false;e.target.textContent='Refresh catalog'}});
}
async function loadAccounts(){
  try{const d=await api('/api/admin/accounts');$('#account-rows').innerHTML=d.accounts.map(a=>'<tr><td><div class="model-name">'+esc(a.name)+'</div><div class="model-id">'+esc(a.accountId)+'</div></td><td class="mono tiny">'+esc(a.tokenPreview)+'</td><td><span class="badge '+(a.status==='active'?'':'paid')+'">'+esc(a.status)+'</span></td><td>'+new Date(a.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-account="'+esc(a.id)+'" data-status="'+(a.status==='active'?'disabled':'active')+'">'+(a.status==='active'?'Disable':'Enable')+'</button><button class="btn sm danger" data-del-account="'+esc(a.id)+'">Delete</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">No accounts yet.</td></tr>';
    $$('[data-del-account]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this account?'))return;await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.delAccount),{method:'DELETE'});loadAccounts();loadOverview()});
    $$('[data-toggle-account]').forEach(b=>b.onclick=async()=>{await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.toggleAccount),{method:'PATCH',body:JSON.stringify({status:b.dataset.status})});loadAccounts()});
  }catch(e){alert(e.message)}
}
function bindAccounts(){
  $('#account-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{await api('/api/admin/accounts',{method:'POST',body:JSON.stringify({name:f.get('name'),accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),'Account added.',true);e.target.reset();loadAccounts();loadOverview()}catch(err){setMsg($('#account-msg'),err.message,false)}});
  $('#test-account').addEventListener('click',async()=>{const f=new FormData($('#account-form'));try{const d=await api('/api/admin/accounts/test',{method:'POST',body:JSON.stringify({accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),d.ok?'Token works. Models visible: '+d.models:(d.error||'Token failed'),d.ok)}catch(err){setMsg($('#account-msg'),err.message,false)}});
}
async function loadKeys(){
  try{const d=await api('/api/admin/keys');$('#key-rows').innerHTML=d.keys.map(k=>'<tr><td><div class="model-name">'+esc(k.name)+'</div><div class="model-id">'+esc(k.prefix)+'…'+esc(k.last4)+'</div></td><td><span class="badge '+(k.enabled?'':'paid')+'">'+(k.enabled?'active':'disabled')+'</span></td><td class="tiny">'+(k.lastUsedAt?new Date(k.lastUsedAt).toLocaleString():'never')+'</td><td>'+new Date(k.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-key="'+esc(k.id)+'" data-enabled="'+(!k.enabled)+'">'+(k.enabled?'Disable':'Enable')+'</button><button class="btn sm danger" data-del-key="'+esc(k.id)+'">Delete</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">No API keys yet.</td></tr>';
    $$('[data-del-key]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this key?'))return;await api('/api/admin/keys/'+encodeURIComponent(b.dataset.delKey),{method:'DELETE'});loadKeys()});
    $$('[data-toggle-key]').forEach(b=>b.onclick=async()=>{await api('/api/admin/keys/'+encodeURIComponent(b.dataset.toggleKey),{method:'PATCH',body:JSON.stringify({enabled:b.dataset.enabled==='true'})});loadKeys()});
  }catch(e){alert(e.message)}
}
function bindKeys(){
  $('#key-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api('/api/admin/keys',{method:'POST',body:JSON.stringify({name:f.get('name')})});e.target.reset();$('#new-key').style.display='block';$('#new-key-value').textContent=d.plaintext;setMsg($('#key-msg'),'Key created. Copy it now; it is not shown again.',true);loadKeys()}catch(err){setMsg($('#key-msg'),err.message,false)}});
  $('#copy-key').addEventListener('click',async()=>{await copyText($('#new-key-value').textContent);$('#copy-key').textContent='Copied';setTimeout(()=>$('#copy-key').textContent='Copy',1200)});
}
async function loadSettings(){
  try{const d=await api('/api/admin/settings');const s=d.settings;
    $('#gateway-id').value=s.gatewayId||'';$('#allow-public').checked=!!s.allowPublic;$('#daily-neurons').value=s.dailyNeurons||10000;$('#default-max').value=s.defaultMaxOutputTokens||1024;
    $('#aliases').value=JSON.stringify(s.aliases||{},null,2);$('#benchmarks').value=JSON.stringify(s.benchmarks||{},null,2);
  }catch(e){alert(e.message)}
}
function bindSettings(){
  $('#settings-form').addEventListener('submit',async(e)=>{e.preventDefault();
    let aliases,benchmarks;try{aliases=JSON.parse($('#aliases').value||'{}');benchmarks=JSON.parse($('#benchmarks').value||'{}')}catch(err){setMsg($('#settings-msg'),'Invalid JSON: '+err.message,false);return}
    try{await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({gatewayId:$('#gateway-id').value,allowPublic:$('#allow-public').checked,dailyNeurons:Number($('#daily-neurons').value),defaultMaxOutputTokens:Number($('#default-max').value),aliases,benchmarks})});setMsg($('#settings-msg'),'Settings saved.',true);loadOverview()}catch(err){setMsg($('#settings-msg'),err.message,false)}});
}
boot();
`;

function adminBody(authenticated) {
	if (!authenticated) return ADMIN_LOGIN;
	return `${NAV}
<div class="app">
<aside class="side">
<button data-tab="overview" class="active">Overview</button>
<button data-tab="models">Models</button>
<button data-tab="accounts">Accounts</button>
<button data-tab="keys">API keys</button>
<button data-tab="settings">Settings</button>
<button id="logout" style="margin-top:14px;color:var(--bad)">Sign out</button>
</aside>
<main class="main">
<section id="tab-overview" class="tab active">
<h2>Overview</h2><p class="sub">Free-neuron accounting, connected accounts and live usage.</p>
<div class="kpis"><div class="kpi"><b id="kpi-used">—</b><span>neurons used today</span></div><div class="kpi"><b id="kpi-limit">—</b><span>daily free allowance</span></div><div class="kpi"><b id="kpi-remaining">—</b><span>neurons remaining</span></div><div class="kpi"><b id="kpi-accounts">—</b><span>active accounts</span></div></div>
<div class="split">
<div class="card"><h3>Daily quota <span id="usage-pct" class="muted"></span></h3><div class="usage-bar"><i id="usage-bar"></i></div><p class="tiny" id="usage-note" style="margin-top:10px"></p><button class="btn sm" id="refresh-usage" style="margin-top:10px">Refresh analytics</button></div>
<div class="card"><h3>Environment</h3><dl class="kv" id="env-info"></dl></div>
</div>
<div class="split" style="margin-top:16px">
<div class="card"><h3>Per account</h3><ul class="list" id="account-usage"><li class="muted">Loading…</li></ul></div>
<div class="card"><h3>Top models today</h3><ul class="list" id="model-usage"><li class="muted">Loading…</li></ul></div>
</div>
</section>

<section id="tab-models" class="tab">
<h2>Models</h2><p class="sub" id="catalog-meta">Loading…</p>
<div class="toolbar"><input id="model-search" placeholder="Search models…" style="width:220px"><select id="model-task"><option value="">All tasks</option></select><label class="pill"><input type="checkbox" id="model-paid" style="width:auto;margin-right:4px"> include paid-only</label><button class="btn sm" id="refresh-catalog">Refresh catalog</button><span class="tiny" id="admin-model-count"></span></div>
<div class="table-wrap"><table><thead><tr><th>#</th><th>Model</th><th>Task</th><th>Context</th><th>Capabilities</th><th>Price (USD)</th><th>Neurons/M output</th><th>Tier</th></tr></thead><tbody id="admin-model-rows"></tbody></table></div>
<p class="tiny" style="margin-top:10px">Free models are the only ones accepted by <code>/v1</code>. Paid-only models are shown for visibility and excluded by default. Prices and capabilities are refreshed from Cloudflare docs and the models API.</p>
</section>

<section id="tab-accounts" class="tab">
<h2>Accounts</h2><p class="sub">Each Cloudflare account contributes 10,000 free neurons per UTC day. Requests fail over between accounts.</p>
<div class="card" style="margin-bottom:16px"><h3>Add account</h3>
<form class="form" id="account-form">
<label class="field"><span>Name</span><input name="name" placeholder="Personal" required></label>
<label class="field"><span>Account ID</span><input name="accountId" placeholder="32 hex characters" required></label>
<label class="field wide"><span>API token (Workers AI Read &amp; Edit)</span><input name="apiToken" type="password" autocomplete="off" required></label>
<div class="row-actions wide"><button class="btn primary" type="submit">Add account</button><button class="btn" type="button" id="test-account">Test token</button></div>
</form><div id="account-msg" class="msg"></div>
<p class="tiny">Create a token at Cloudflare Dashboard → My Profile → API Tokens → Workers AI template. Add “Account Analytics Read” if you want cloud usage reconciliation.</p></div>
<div class="table-wrap"><table><thead><tr><th>Account</th><th>Token</th><th>Status</th><th>Added</th><th>Actions</th></tr></thead><tbody id="account-rows"></tbody></table></div>
</section>

<section id="tab-keys" class="tab">
<h2>API keys</h2><p class="sub">Keys are stored as SHA-256 hashes. The plaintext is shown once.</p>
<div class="card" style="margin-bottom:16px"><form class="form" id="key-form"><label class="field"><span>Key name</span><input name="name" placeholder="LobeChat" required></label><button class="btn primary" type="submit">Create key</button></form><div id="key-msg" class="msg"></div>
<div id="new-key" style="display:none;margin-top:8px"><div class="note"><div class="tiny" style="margin-bottom:6px">Copy this key now:</div><div style="display:flex;gap:8px;align-items:center"><code id="new-key-value" style="word-break:break-all;flex:1"></code><button class="btn sm" id="copy-key">Copy</button></div></div></div></div>
<div class="table-wrap"><table><thead><tr><th>Key</th><th>Status</th><th>Last used</th><th>Created</th><th>Actions</th></tr></thead><tbody id="key-rows"></tbody></table></div>
</section>

<section id="tab-settings" class="tab">
<h2>Settings</h2><p class="sub">AI Gateway is optional; the free-neuron guard remains authoritative.</p>
<form id="settings-form">
<div class="card" style="margin-bottom:16px"><h3>Runtime</h3><div class="form">
<label class="field"><span>AI Gateway ID (optional)</span><input id="gateway-id" placeholder="default"></label>
<label class="field"><span>Daily neurons per account</span><input id="daily-neurons" type="number" min="1" max="10000"></label>
<label class="field"><span>Default max output tokens</span><input id="default-max" type="number" min="1" max="131072"></label>
<label class="field"><span>Public access (no API keys)</span><input id="allow-public" type="checkbox" style="width:auto"></label>
</div><p class="tiny">The daily cap is clamped by <code>MAX_DAILY_NEURONS</code> (default 10,000). Do not raise it on a free plan: Cloudflare will start returning error 3036.</p></div>
<div class="card" style="margin-bottom:16px"><h3>Model aliases</h3><p class="tiny">JSON object mapping a client-facing name to an <code>@cf/</code> model id.</p><textarea id="aliases"></textarea></div>
<div class="card" style="margin-bottom:16px"><h3>Performance overrides</h3><p class="tiny">JSON object mapping model id to a 0-100 score from your own evals. Overrides drive the performance sort.</p><textarea id="benchmarks"></textarea></div>
<div class="row-actions"><button class="btn primary" type="submit">Save settings</button></div><div id="settings-msg" class="msg"></div>
</form>
</section>
</main></div>`;
}

export async function handleAdminPage(request, env) {
	const authenticated = await isAdmin(request, env);
	const setupWarning = hasAdminPassword(env) ? '' : '<div class="note" style="margin:16px 24px">Set the <code>ADMIN_PASSWORD</code> environment variable before using the admin panel.</div>';
	const body = adminBody(authenticated) + setupWarning;
	return shell({
		title: authenticated ? 'Admin — Workers AI2API' : 'Sign in — Workers AI2API',
		body,
		script: ADMIN_SCRIPT,
		authenticated,
	});
}

export { shell, NAV };
