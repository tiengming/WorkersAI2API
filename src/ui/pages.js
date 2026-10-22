import { hasAdminPassword, isAdmin } from '../auth.js';
import { clientDictionary, resolveLang, t } from './i18n.js';

const BASE_CSS = `
:root{color-scheme:light dark;--bg:#eef1f4;--bg-2:#e7ebef;--panel:#ffffff;--panel-2:#f5f7f9;--ink:#0b0e13;--muted:#5b6572;--line:#d6dce3;--accent:#e8590c;--accent-2:#ff9a5c;--accent-ink:#ffffff;--ok:#0b7a53;--warn:#9a5b00;--bad:#b42318;--shadow:0 1px 2px rgba(8,12,20,.05),0 14px 40px rgba(8,12,20,.07);--display:"Bahnschrift","DIN Alternate","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif;--mono:"Cascadia Code","SFMono-Regular",Consolas,"Liberation Mono",monospace}
@media (prefers-color-scheme:dark){:root{--bg:#080a0d;--bg-2:#0c0f13;--panel:#11151a;--panel-2:#171c22;--ink:#eef1f4;--muted:#98a2ae;--line:#242c36;--accent:#ff7a1a;--accent-2:#ffb066;--accent-ink:#120b05;--ok:#4ade80;--warn:#fbbf24;--bad:#f87171;--shadow:0 1px 2px rgba(0,0,0,.5),0 22px 60px rgba(0,0,0,.35)}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 "Segoe UI",ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
h1,h2,h3,.brand,.ledger-big b,.kpi b,.stat b{font-family:var(--display);font-weight:700}
code,pre,.mono,.price,.rank,.tier,.stamp,.pill{font-family:var(--mono)}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;gap:14px;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-size:15px;letter-spacing:-.02em;text-decoration:none;white-space:nowrap}
.brand .mark{width:28px;height:28px;border-radius:8px;background:var(--accent);display:grid;place-items:center;color:var(--accent-ink);font:800 15px/1 var(--display)}
.nav .spacer{flex:1}
.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-size:11px;color:var(--muted);background:var(--panel);white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--ok) 18%,transparent)}
.dot.off{background:var(--bad);box-shadow:none}\n.dot.warn{background:var(--warn);box-shadow:none}
.lang-switch{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel)}
.lang-switch a{padding:6px 10px;font:600 11px/1 var(--mono);color:var(--muted);text-decoration:none}
.lang-switch a+a{border-left:1px solid var(--line)}
.lang-switch a.active{background:var(--ink);color:var(--bg)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:9px;padding:9px 14px;font:600 13px/1 inherit;cursor:pointer;text-decoration:none;transition:border-color .15s,background .15s,transform .15s;white-space:nowrap}
.btn:hover{border-color:var(--muted)}
.btn:active{transform:translateY(1px)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.primary:hover{filter:brightness(1.06)}
.btn.danger{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 35%,var(--line))}
.btn.sm{padding:6px 10px;font-size:11.5px;border-radius:7px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.hero{position:relative;border-bottom:1px solid var(--line);overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;opacity:.27;mask-image:linear-gradient(180deg,#000 0%,transparent 84%);pointer-events:none}
.hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,1.22fr) minmax(330px,.78fr);gap:44px;align-items:center;padding:74px 0 60px}
.eyebrow{display:flex;align-items:center;gap:10px;font:700 10.5px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 18px}
.eyebrow::before{content:"";width:26px;height:1px;background:var(--accent)}
h1{font-size:clamp(38px,4.8vw,58px);line-height:1.04;letter-spacing:-.045em;margin:0 0 20px;max-width:820px}
html[lang^="zh"] h1{font-size:clamp(32px,3.3vw,46px);line-height:1.14;letter-spacing:-.01em;max-width:820px;word-break:keep-all}
.hero p.lead{font-size:17.5px;color:var(--muted);max-width:640px;margin:0 0 28px}
.endpoint{display:flex;align-items:stretch;max-width:640px;border:1px solid var(--line);border-radius:11px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)}
.endpoint code{flex:1;padding:14px 16px;font-size:12.5px;overflow:auto;white-space:nowrap;display:flex;align-items:center}
.endpoint button{border:0;border-left:1px solid var(--line);background:var(--panel-2);padding:0 16px;font:700 11px/1 var(--mono);letter-spacing:.04em;cursor:pointer;color:var(--ink);text-transform:uppercase}
.endpoint button:hover{color:var(--accent)}
.hero-meta{margin:16px 0 0;font:600 11px/1.5 var(--mono);color:var(--muted);letter-spacing:.01em}
.ledger{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:var(--shadow);overflow:hidden}
.ledger::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 7%,transparent),transparent 46%)}
.ledger-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
.ledger-head>span:first-child{font:700 10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.stamp{border:2px solid var(--accent);color:var(--accent);font:800 10px/1 var(--mono);letter-spacing:.14em;padding:6px 7px;border-radius:4px;transform:rotate(-6deg)}
.ledger-big{display:flex;flex-direction:column;gap:7px}
.ledger-big b{font-size:clamp(46px,5.6vw,64px);line-height:.95;letter-spacing:-.055em}
.ledger-big span{font-size:11.5px;color:var(--muted)}
.meter{position:relative;height:14px;margin:20px 0 8px;border:1px solid var(--line);border-radius:4px;background:var(--panel-2);overflow:hidden}
.meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .5s ease}
.meter::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),var(--panel) calc(10% - 1px) 10%)}
.meter-labels{display:flex;justify-content:space-between;gap:10px;font:600 10.5px/1.2 var(--mono);color:var(--muted);margin-bottom:18px}
.ledger-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 14px;padding:0}
.ledger-grid div{border-top:1px solid var(--line);padding-top:10px;min-width:0}
.ledger-grid dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.ledger-grid dd{margin:5px 0 0;font:700 14px/1.2 var(--mono);overflow:hidden;text-overflow:ellipsis}
.block{padding:56px 0}
.block-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:18px}
.block-head h2{font-size:clamp(24px,3vw,32px);letter-spacing:-.03em;margin:0}
.block-head p{margin:6px 0 0;color:var(--muted);font-size:13px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
input,select,textarea{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:9px 11px;min-width:0}
input:focus,select:focus,textarea:focus,button:focus-visible,a:focus-visible{outline:2px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:2px}
textarea{width:100%;min-height:100px;resize:vertical;font-family:var(--mono);font-size:12.5px}
.table-wrap{border:1px solid var(--line);border-radius:14px;overflow:auto;background:var(--panel);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:920px}
th{text-align:left;font:700 10px/1.2 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);padding:13px 14px;border-bottom:1px solid var(--line);background:var(--panel-2);position:sticky;top:0;z-index:1;white-space:nowrap}
td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
tbody tr.model-row{cursor:pointer}
tbody tr.model-row:hover td{background:color-mix(in srgb,var(--accent) 5%,transparent)}
.model-name{font-weight:650;letter-spacing:-.01em}
.model-id{font-size:11px;color:var(--muted);word-break:break-all}
.badge{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:5px;padding:2px 6px;font:600 10px/1.35 var(--mono);color:var(--muted);margin:1px 3px 1px 0;white-space:nowrap}
.badge.hot{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.badge.paid{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,var(--line))}
.rank{display:inline-grid;place-items:center;width:27px;height:27px;border-radius:7px;background:var(--panel-2);font:700 10.5px/1 var(--mono);color:var(--muted)}
.tier{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font:800 11px/1 var(--mono)}
.tier.S{background:var(--ink);color:var(--bg)}
.tier.A{background:var(--accent);color:var(--accent-ink)}
.tier.B{background:color-mix(in srgb,var(--accent) 24%,var(--panel-2))}
.tier.C{background:var(--panel-2);color:var(--muted)}
.tier.D{background:transparent;border:1px solid var(--line);color:var(--muted)}
.price{font-size:11.5px;white-space:normal;overflow-wrap:anywhere}
.muted{color:var(--muted)}
.small{font-size:12px}
.tiny{font-size:11.5px;color:var(--muted)}
.nowrap{white-space:nowrap}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;box-shadow:var(--shadow)}
.card h3{margin:0 0 8px;font-size:16px;letter-spacing:-.01em}
.card p{margin:0 0 14px;color:var(--muted);font-size:13px}
.card a{font-weight:600;text-decoration:none;color:var(--accent);font-size:12.5px}
.usage-bar{height:9px;border-radius:99px;background:var(--panel-2);overflow:hidden;border:1px solid var(--line)}
.usage-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));width:0;transition:width .4s}
.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.list{list-style:none;margin:0;padding:0}
.list li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
.list li:last-child{border-bottom:0}
.note{border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--panel);border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;color:var(--muted)}
footer{border-top:1px solid var(--line);padding:30px 0 52px;color:var(--muted);font-size:12px}
.login{min-height:100vh;display:grid;place-items:center;padding:24px}
.login .card{width:100%;max-width:410px}
.field{display:block;margin-bottom:14px}
.field span{display:block;font-size:11px;font-weight:700;letter-spacing:.03em;color:var(--muted);margin-bottom:6px}
.field input{width:100%}
.msg{font-size:12.5px;padding:9px 11px;border-radius:8px;margin:10px 0;display:none}
.msg.show{display:block}
.msg.ok{background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--ok)}
.msg.err{background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad)}
.app{display:grid;grid-template-columns:216px 1fr;min-height:calc(100vh - 64px)}
.side{border-right:1px solid var(--line);padding:22px 14px;background:var(--panel)}
.side button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:9px 11px;font:600 12.5px/1 inherit;color:var(--muted);cursor:pointer;margin-bottom:2px}
.side button:hover{background:var(--panel-2);color:var(--ink)}
.side button.active{background:var(--panel-2);color:var(--ink);box-shadow:inset 2px 0 0 var(--accent)}
.main{padding:28px 30px 64px;min-width:0}
.tab{display:none}
.tab.active{display:block}
.main h2{font-size:24px;letter-spacing:-.03em;margin:0 0 4px}
.main .sub{color:var(--muted);font-size:12.5px;margin:0 0 22px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:15px}
.kpi b{display:block;font-size:22px;letter-spacing:-.03em}
.kpi span{font-size:11px;color:var(--muted)}
.form{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;align-items:end}\n.form.inline{grid-template-columns:1fr auto}
.form .wide{grid-column:1/-1}
.row-actions{display:flex;gap:6px;flex-wrap:wrap}
.kv{display:grid;grid-template-columns:130px 1fr;gap:8px;font-size:12.5px;margin:0}
.kv dt{color:var(--muted)}
.kv dd{margin:0;word-break:break-all}
pre.code{background:var(--panel-2);border:1px solid var(--line);border-radius:9px;padding:12px;overflow:auto;font-size:12px}
details summary{cursor:pointer;font-weight:600;font-size:13px}
dialog{border:1px solid var(--line);border-radius:16px;padding:0;background:var(--panel);color:var(--ink);width:min(640px,calc(100% - 28px));max-height:min(86vh,820px);box-shadow:0 30px 90px rgba(0,0,0,.4)}
dialog::backdrop{background:rgba(4,6,9,.58);backdrop-filter:blur(4px)}
.dlg-head{display:flex;align-items:flex-start;gap:14px;padding:20px 22px 14px;border-bottom:1px solid var(--line)}
.dlg-head h3{margin:0 0 4px;font-size:19px;letter-spacing:-.02em}
.dlg-head .model-id{font-size:11px}
.dlg-head .btn{margin-left:auto}
.dlg-body{padding:18px 22px 24px;overflow:auto}
.dlg-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 16px}
.dlg-grid div{border-top:1px solid var(--line);padding-top:9px;min-width:0}
.dlg-grid dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.dlg-grid dd{margin:4px 0 0;font-size:12.5px;word-break:break-word}
.dlg-section{margin:16px 0 0}
.dlg-section h4{font:700 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
.docs{max-width:880px;padding:52px 0 80px}
.docs h1{font-size:38px;margin-bottom:10px}
.docs h2{font-size:22px;letter-spacing:-.02em;margin:34px 0 10px}
.docs h3{font-size:16px;margin:22px 0 8px}
.docs p,.docs li{color:var(--muted);font-size:14.5px}
.docs strong{color:var(--ink)}
.docs code{background:var(--panel-2);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:12.5px}
.docs pre{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;overflow:auto;font-size:12.5px;line-height:1.55}
.docs pre code{background:none;border:0;padding:0}
.docs code{overflow-wrap:anywhere}
.docs table{min-width:0;font-size:13px;margin:12px 0}
.docs .table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px;margin:12px 0;background:var(--panel)}
.docs .table-scroll table{margin:0;min-width:560px}
.docs th,.docs td{padding:9px 11px}
.docs table td:first-child,.docs table th:first-child{white-space:nowrap}
.docs ul,.docs ol{padding-left:20px}
.docs .callout{border-left:3px solid var(--accent);background:var(--panel);padding:12px 15px;border-radius:0 8px 8px 0;margin:18px 0;font-size:13.5px;color:var(--muted)}
@media(max-width:980px){.hero-grid{grid-template-columns:1fr;gap:30px;padding:54px 0 48px}.ledger{max-width:560px}.cards{grid-template-columns:1fr}.app{grid-template-columns:1fr}.side{border-right:0;border-bottom:1px solid var(--line);display:flex;gap:6px;overflow:auto;padding:12px}.side button{width:auto;white-space:nowrap}.main{padding:20px 18px 52px}.split,.form,.kpis{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.cards,.split,.form,.dlg-grid{grid-template-columns:1fr}.wrap{padding:0 16px}.hero{padding:0}.endpoint code{font-size:10.5px}.main{padding:18px 14px 48px}.block{padding:42px 0}h1{font-size:36px}.nav .wrap{height:56px;gap:8px}.nav .pill{display:none}.brand{font-size:13px}.brand .mark{width:24px;height:24px}.lang-switch a{padding:6px 8px}.nav .btn.sm{padding:6px 9px}.models-table{border:0;background:transparent;box-shadow:none;overflow:visible}.models-table table{min-width:0;display:block}.models-table thead{display:none}.models-table tbody{display:block}.models-table tbody tr{display:block;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-bottom:10px;padding:10px 12px}.models-table tbody td{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:4px 10px;min-width:0;border:0;padding:4px 0;font-size:12.5px}.models-table tbody td::before{content:attr(data-label);font:700 9.5px/1.5 var(--mono);text-transform:uppercase;letter-spacing:.07em;color:var(--muted);flex:0 0 84px;padding-top:1px}.models-table tbody td:first-child{display:none}.models-table tbody td:nth-child(2){display:block;padding-bottom:8px;margin-bottom:4px;border-bottom:1px solid var(--line)}.models-table tbody td:nth-child(2)::before{display:none}.models-table tbody tr.model-row:hover td{background:transparent}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

const CLIENT_HELPERS = `
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const I=window.__I18N__||{};
const T=(k,v={})=>String(I[k]??k).replace(/\\{(\\w+)\\}/g,(_,n)=>v[n]==null?'':String(v[n]));
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||d.error||('HTTP '+r.status));return d}
function nf(n){return Number(n||0).toLocaleString(window.__LANG__==='zh'?'zh-CN':'en-US')}
function money(v){return Number(v)<0.01?'$'+Number(v).toFixed(4):'$'+Number(v).toFixed(3)}
function setMsg(el,text,ok=true){el.textContent=text;el.className='msg show '+(ok?'ok':'err')}
function copyText(text){return navigator.clipboard.writeText(text)}
function taskLabel(t){return T('task.'+t)}
function caps(m){const c=m.capabilities||{};return [c.reasoning&&T('cap.reasoning'),c.function_calling&&T('cap.tools'),c.vision&&T('cap.vision'),c.audio_input&&T('cap.audio_in'),c.audio_output&&T('cap.audio_out'),c.structured_output&&T('cap.json'),c.streaming&&T('cap.streaming')].filter(Boolean)}
function tier(m){return m.performance?.tier||'C'}
function priceKind(k){const key='price.'+k;return I[key]?T(key):k}
function priceOf(m){const t=m.pricing?.tokens||{};if(t.input_usd_per_million!=null||t.output_usd_per_million!=null){const i=t.input_usd_per_million!=null?money(t.input_usd_per_million):'—';const o=t.output_usd_per_million!=null?money(t.output_usd_per_million):'—';return i+' / '+o+' /M'}return m.pricing?.display||'—'}
`;

function escapeAttr(value) {
	return String(value || '').replace(/[&<>"']/g, (char) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	}[char]));
}

function shell({ title, description = '', body, script = '', authenticated = null, lang = 'zh' }) {
	const dictionary = JSON.stringify(clientDictionary(lang)).replace(/</g, '\\u003c');
	const authScript = authenticated === null ? '' : `window.__AUTHENTICATED__=${authenticated ? 'true' : 'false'};`;
	return `<!doctype html><html lang="${lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeAttr(title)}</title><meta name="description" content="${escapeAttr(description)}">
<style>${BASE_CSS}</style></head><body>${body}
<script>window.__LANG__=${JSON.stringify(lang)};window.__I18N__=${dictionary};${authScript}</script>
<script>${CLIENT_HELPERS}${script}</script></body></html>`;
}

function nav(lang, { status = false } = {}) {
	return `<header class="nav"><div class="wrap">
<a class="brand" href="/?lang=${lang}"><span class="mark">W</span> ${t(lang, 'brand.name')}</a>
${status ? `<span class="pill"><span class="dot" id="health-dot"></span><span id="health-text">${t(lang, 'nav.status.checking')}</span></span>` : ''}
<span class="spacer"></span>
<div class="lang-switch" role="group" aria-label="Language">
<a href="?lang=zh" hreflang="zh" class="${lang === 'zh' ? 'active' : ''}">${t(lang, 'nav.lang.zh')}</a>
<a href="?lang=en" hreflang="en" class="${lang === 'en' ? 'active' : ''}">${t(lang, 'nav.lang.en')}</a>
</div>
<a class="btn sm" href="/admin?lang=${lang}">${t(lang, 'nav.admin')}</a>
</div></header>`;
}

const LANDING_SCRIPT = `
const state={models:[],meta:{}};
async function load(){
  try{
    const [cat,stats]=await Promise.all([api('/api/catalog?include_paid=0'),api('/api/stats').catch(()=>({}))]);
    state.models=cat.data||[];state.meta=cat.meta||{};
    $('#health-text').textContent=state.meta.stale?T('nav.status.cached'):T('nav.status.live');
    $('#health-dot').className='dot'+(state.meta.stale?' warn':'');
    $('#stat-models').textContent=nf(state.meta.free_models??state.models.length);
    $('#stat-neurons').textContent=nf(state.meta.free_daily_neurons||10000);
    $('#stat-accounts').textContent=nf(stats.total_accounts||0);
    const pct=Number(stats.usage_percentage)||0;
    $('#stat-usage').textContent=pct.toFixed(pct>=10?0:1)+'%';
    $('#usage-fill').style.width=Math.min(100,pct)+'%';
    const daily=Number(stats.free_daily_neurons)||10000;
    const total=daily*(Number(stats.total_accounts)||0);
    $('#stat-remaining').textContent=total?nf(Math.max(0,Math.round(total*(1-pct/100)))):'—';
    $('#stat-backend').textContent=stats.quota_backend||'—';
    const authors=Object.keys(state.meta.authors||{}).length;
    $('#coverage').textContent=T('landing.coverage',{free:state.meta.free_models??state.models.length,partners:state.meta.partner_models??0,authors});
    const tasks=[...new Set(state.models.map(m=>m.task))].sort();
    $('#task-filter').innerHTML='<option value="">'+esc(T('common.allTasks'))+'</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    render();
  }catch(e){
    $('#health-text').textContent=T('nav.status.offline');
    $('#health-dot').className='dot off';
    const el=$('#error');el.textContent=e.message;el.className='msg show err';
  }
}
function render(){
  const q=($('#search').value||'').toLowerCase();const task=$('#task-filter').value;
  let rows=state.models.filter(m=>(!task||m.task===task)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  const sort=$('#sort').value;
  const cmp={performance:(a,b)=>(b.performance?.score||0)-(a.performance?.score||0),price:(a,b)=>{const av=a.pricing?.tokens?.output_usd_per_million??a.pricing?.items?.[0]?.usd??Infinity;const bv=b.pricing?.tokens?.output_usd_per_million??b.pricing?.items?.[0]?.usd??Infinity;return av-bv},context:(a,b)=>(b.context_window||0)-(a.context_window||0),name:(a,b)=>a.name.localeCompare(b.name),updated:(a,b)=>(Date.parse(b.created_at||0)||0)-(Date.parse(a.created_at||0)||0)};
  rows=[...rows].sort(cmp[sort]||cmp.performance);
  $('#model-rows').innerHTML=rows.map((m,i)=>{
    const t=m.performance||{};const c=caps(m);
    return '<tr class="model-row" data-id="'+esc(m.id)+'" tabindex="0">'+
      '<td><span class="rank">'+(t.rank||i+1)+'</span></td>'+
      '<td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div>'+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'</td>'+
      '<td data-label="'+esc(T('landing.table.task'))+'"><span class="badge">'+esc(taskLabel(m.task))+'</span></td>'+
      '<td data-label="'+esc(T('landing.table.context'))+'" class="nowrap">'+(m.context_window?nf(m.context_window)+' tok':'—')+'</td>'+
      '<td data-label="'+esc(T('landing.table.caps'))+'">'+(c.length?c.map(x=>'<span class="badge">'+esc(x)+'</span>').join(''):'<span class="muted">—</span>')+'</td>'+
      '<td data-label="'+esc(T('landing.table.price'))+'" class="price">'+esc(priceOf(m))+'</td>'+
      '<td data-label="'+esc(T('landing.table.daily'))+'" class="nowrap">'+(m.free_daily_output_tokens?nf(m.free_daily_output_tokens)+' tok/day':'—')+'</td>'+
      '<td data-label="'+esc(T('landing.table.tier'))+'"><span class="tier '+tier(m)+'">'+tier(m)+'</span> <span class="tiny">'+(t.score??'—')+'</span></td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:24px">'+esc(T('landing.noMatch'))+'</td></tr>';
  $('#model-count').textContent=T('landing.count',{shown:rows.length,total:state.models.length});
}
function openModel(id){
  const m=state.models.find(x=>x.id===id);if(!m)return;
  const t=m.performance||{};const c=caps(m);
  const items=(m.pricing?.items||[]).map(it=>'<li><span class="mono small">'+esc(priceKind(it.kind))+'</span><span class="price">'+(it.usd!=null?'$'+it.usd:'')+(it.neurons!=null?' · '+nf(it.neurons)+' n':'')+'</span></li>').join('')||'<li class="muted">—</li>';
  const rows=[
    [T('detail.id'),'<span class="mono">'+esc(m.id)+'</span> <button class="btn sm" data-copy-id="'+esc(m.id)+'">'+esc(T('common.copy'))+'</button>'],
    [T('detail.author'),esc(m.owned_by||m.author||'—')],
    [T('detail.task'),esc(taskLabel(m.task))],
    [T('detail.context'),m.context_window?nf(m.context_window)+' tok':'—'],
    [T('detail.maxOutput'),m.max_output_tokens?nf(m.max_output_tokens)+' tok':'—'],
    [T('detail.daily'),m.free_daily_output_tokens?nf(m.free_daily_output_tokens)+' tok/day':'—'],
    [T('detail.rank'),'#'+(t.rank||'—')+' · '+T('detail.score')+' '+(t.score??'—')+' ('+tier(m)+')'],
    [T('detail.released'),m.created?new Date(m.created*1000).toLocaleDateString(window.__LANG__==='zh'?'zh-CN':'en-US'):'—'],
  ];
  $('#dlg-head').innerHTML='<div><h3>'+esc(m.name)+'</h3><div class="model-id">'+esc(m.id)+'</div></div>'+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'<button class="btn sm" data-close="1">'+esc(T('common.close'))+'</button>';
  $('#dlg-body').innerHTML='<dl class="dlg-grid">'+rows.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.caps'))+'</h4>'+(c.length?c.map(x=>'<span class="badge">'+esc(x)+'</span>').join(''):'<span class="muted">—</span>')+'</div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.price'))+'</h4><ul class="list">'+items+'</ul></div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.endpoints'))+'</h4>'+(m.endpoints||[]).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</div>'+
    '<div class="dlg-section"><h4>'+esc(T('detail.aliases'))+'</h4>'+(m.aliases||[]).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</div>'+
    '<div class="dlg-section"><a class="btn sm" href="'+esc(m.docs_url||'https://developers.cloudflare.com/workers-ai/models/')+'" target="_blank" rel="noopener">'+esc(T('detail.docs'))+'</a></div>';
  const d=$('#model-dialog');
  if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
}
$('#task-filter').addEventListener('change',render);$('#sort').addEventListener('change',render);$('#search').addEventListener('input',render);
$('#copy').addEventListener('click',async()=>{try{await copyText($('#endpoint').textContent.trim());$('#copy').textContent=T('common.copied');setTimeout(()=>$('#copy').textContent=T('common.copy'),1400)}catch{}});
$('#model-rows').addEventListener('click',e=>{const tr=e.target.closest('tr[data-id]');if(tr)openModel(tr.dataset.id)});
$('#model-rows').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr[data-id]');if(tr){e.preventDefault();openModel(tr.dataset.id)}}});
$('#model-dialog').addEventListener('click',async(e)=>{
  if(e.target===$('#model-dialog')){e.target.close();return}
  const close=e.target.closest('[data-close]');if(close){$('#model-dialog').close();return}
  const copy=e.target.closest('[data-copy-id]');if(copy){try{await copyText(copy.dataset.copyId);copy.textContent=T('common.copied')}catch{}}
});
$('#endpoint').textContent=location.origin+'/v1';
load();
`;

export async function handleLandingPage(request) {
	const lang = resolveLang(request);
	const body = `${nav(lang, { status: true })}
<main>
<section class="hero"><div class="wrap hero-grid">
<div class="hero-copy">
<p class="eyebrow">${t(lang, 'landing.eyebrow')}</p>
<h1>${t(lang, 'landing.h1')}</h1>
<p class="lead">${t(lang, 'landing.lead')}</p>
<div class="endpoint"><code id="endpoint">/v1</code><button id="copy">${t(lang, 'common.copy')}</button></div>
<p class="hero-meta" id="coverage">—</p>
<div id="error" class="msg err"></div>
</div>
<aside class="ledger" aria-label="${t(lang, 'landing.ledger.title')}">
<div class="ledger-head"><span>${t(lang, 'landing.ledger.title')}</span><span class="stamp">FREE</span></div>
<div class="ledger-big"><b id="stat-neurons">10,000</b><span>${t(lang, 'landing.stat.neurons')}</span></div>
<div class="meter" role="img" aria-label="${t(lang, 'landing.stat.usage')}"><i id="usage-fill"></i></div>
<div class="meter-labels"><span id="stat-usage">0%</span><span>${t(lang, 'landing.ledger.caption')}</span></div>
<dl class="ledger-grid">
<div><dt>${t(lang, 'landing.stat.freeModels')}</dt><dd id="stat-models">—</dd></div>
<div><dt>${t(lang, 'landing.stat.accounts')}</dt><dd id="stat-accounts">—</dd></div>
<div><dt>${t(lang, 'landing.ledger.backend')}</dt><dd id="stat-backend">—</dd></div>
<div><dt>${t(lang, 'landing.ledger.remaining')}</dt><dd id="stat-remaining">—</dd></div>
</dl>
<p class="tiny">${t(lang, 'landing.ledger.note')}</p>
</aside>
</div></section>

<section class="block" id="models"><div class="wrap">
<div class="block-head"><div><h2>${t(lang, 'landing.catalog.title')}</h2><p id="model-count">${t(lang, 'common.loading')}</p></div>
<div class="toolbar">
<input id="search" aria-label="${t(lang, 'common.search')}" placeholder="${t(lang, 'common.search')}" style="width:210px">
<select id="task-filter" aria-label="${t(lang, 'landing.table.task')}"><option value="">${t(lang, 'common.allTasks')}</option></select>
<select id="sort" aria-label="${t(lang, 'landing.table.tier')}"><option value="performance">${t(lang, 'landing.sort.performance')}</option><option value="price">${t(lang, 'landing.sort.price')}</option><option value="context">${t(lang, 'landing.sort.context')}</option><option value="updated">${t(lang, 'landing.sort.updated')}</option><option value="name">${t(lang, 'landing.sort.name')}</option></select>
</div></div>
<div class="table-wrap models-table"><table><thead><tr><th>#</th><th>${t(lang, 'landing.table.model')}</th><th>${t(lang, 'landing.table.task')}</th><th>${t(lang, 'landing.table.context')}</th><th>${t(lang, 'landing.table.caps')}</th><th>${t(lang, 'landing.table.price')}</th><th>${t(lang, 'landing.table.daily')}</th><th>${t(lang, 'landing.table.tier')}</th></tr></thead><tbody id="model-rows"><tr><td colspan="8" style="padding:24px" class="muted">${t(lang, 'common.loading')}</td></tr></tbody></table></div>
<p class="tiny" style="margin-top:10px">${t(lang, 'landing.footnote')}</p>
<p class="tiny">${t(lang, 'landing.paidNote')}</p>
</div></section>

<section class="block"><div class="wrap"><div class="cards">
<div class="card"><h3>${t(lang, 'landing.cards.vs.title')}</h3><p>${t(lang, 'landing.cards.vs.body')}</p><a href="/docs/workers-ai-vs-ai-gateway?lang=${lang}">${t(lang, 'landing.cards.vs.link')}</a></div>
<div class="card"><h3>${t(lang, 'landing.cards.api.title')}</h3><p>${t(lang, 'landing.cards.api.body')}</p><a href="/docs/api?lang=${lang}">${t(lang, 'landing.cards.api.link')}</a></div>
<div class="card"><h3>${t(lang, 'landing.cards.quota.title')}</h3><p>${t(lang, 'landing.cards.quota.body')}</p><a href="/docs/free-tier?lang=${lang}">${t(lang, 'landing.cards.quota.link')}</a></div>
</div></div></section>
</main>
<dialog id="model-dialog"><div class="dlg-head" id="dlg-head"></div><div class="dlg-body" id="dlg-body"></div></dialog>
<footer><div class="wrap">${t(lang, 'landing.footer')}</div></footer>`;
	return shell({
		title: t(lang, 'landing.title'),
		description: t(lang, 'landing.metaDesc'),
		body,
		script: LANDING_SCRIPT,
		lang,
	});
}

const ADMIN_LOGIN_SCRIPT = `
$('#login-form').addEventListener('submit',async(e)=>{e.preventDefault();try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});location.reload()}catch(err){const m=$('#login-msg');m.textContent=err.message;m.className='msg show err'}});
`;

const ADMIN_SCRIPT = `
const state={overview:null,catalog:null,tab:'overview'};
async function boot(){
  if(!window.__AUTHENTICATED__)return;
  $('#logout').addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST'});location.reload()});
  $$('.side button[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  bindOverview();bindModels();bindAccounts();bindKeys();bindSettings();
  await Promise.all([loadOverview(),loadModels()]);
}
function switchTab(tab){state.tab=tab;$$('.side button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.tab').forEach(t=>t.classList.toggle('active',t.id==='tab-'+tab));if(tab==='usage')loadOverview();if(tab==='models')loadModels();if(tab==='accounts')loadAccounts();if(tab==='keys')loadKeys();if(tab==='settings')loadSettings()}
async function loadOverview(){
  try{const d=await api('/api/admin/overview');state.overview=d;const u=d.usage;
    $('#kpi-used').textContent=nf(u.totalNeuronsToday);$('#kpi-limit').textContent=nf(u.totalLimit);$('#kpi-remaining').textContent=nf(u.remainingNeurons);$('#kpi-accounts').textContent=nf(u.totalAccounts);
    $('#usage-pct').textContent=(u.usagePercentage||0)+'%';$('#usage-bar').style.width=Math.min(100,u.usagePercentage||0)+'%';
    $('#usage-note').textContent=T('admin.quota.note',{used:nf(u.totalNeuronsToday),reserved:nf(u.reservedNeurons),cloud:nf(u.cloudNeuronsToday),backend:u.quotaBackend});
    $('#account-usage').innerHTML=(u.accounts||[]).map(a=>'<li><span>'+esc(a.name)+'<br><span class="tiny mono">'+esc(a.accountId)+'</span></span><span class="price">'+nf(a.used)+' / '+nf(a.limit)+(a.error?' <span class="badge paid">error</span>':'')+'</span></li>').join('')||'<li class="muted">'+esc(T('admin.noAccounts'))+'</li>';
    $('#model-usage').innerHTML=(u.modelsToday||[]).slice(0,8).map(m=>'<li><span class="mono small">'+esc(m.model)+'</span><span class="price">'+nf(m.neurons)+' n</span></li>').join('')||'<li class="muted">'+esc(T('admin.noUsage'))+'</li>';
    $('#env-info').innerHTML='<dt>'+T('admin.env.version')+'</dt><dd>'+esc(d.version)+'</dd><dt>'+T('admin.env.kv')+'</dt><dd>'+(d.environment.kv?T('common.bound'):T('common.missing'))+'</dd><dt>'+T('admin.env.quota')+'</dt><dd>'+esc(d.environment.quota)+'</dd><dt>'+T('admin.env.maxDaily')+'</dt><dd>'+nf(d.environment.maxDailyNeurons)+'</dd><dt>'+T('admin.env.adminPassword')+'</dt><dd>'+(d.environment.adminPassword?T('common.set'):T('common.missing'))+'</dd>';
  }catch(e){location.reload()}
}
function bindOverview(){$('#refresh-usage').addEventListener('click',async(e)=>{const btn=e.target;btn.disabled=true;btn.textContent=T('common.refreshing');try{const d=await api('/api/admin/usage?force=1');$('#usage-note').textContent=T('admin.quota.refreshed',{local:nf(d.totalNeuronsToday),cloud:nf(d.cloudNeuronsToday)});await loadOverview()}catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent=T('admin.quota.refresh')}})}
async function loadModels(){
  try{const cat=await api('/api/admin/catalog');state.catalog=cat;
    $('#catalog-meta').textContent=T('admin.models.source',{source:cat.meta.source||'?',free:cat.meta.free_models||0,paid:cat.meta.paid_models||0,deprecated:cat.meta.deprecated_models||0,time:new Date(cat.meta.fetched_at).toLocaleString()});
    $('#catalog-coverage').textContent=T('admin.models.coverage',{partner:cat.meta.partner_models||0,authors:Object.keys(cat.meta.authors||{}).length,tasks:Object.keys(cat.meta.tasks||{}).length});
    const tasks=[...new Set(cat.data.map(m=>m.task))].sort();
    $('#model-task').innerHTML='<option value="">'+esc(T('common.allTasks'))+'</option>'+tasks.map(t=>'<option value="'+esc(t)+'">'+esc(taskLabel(t))+'</option>').join('');
    renderAdminModels();
  }catch(e){$('#catalog-meta').textContent=e.message}
}
function renderAdminModels(){
  const cat=state.catalog;if(!cat)return;const q=($('#model-search').value||'').toLowerCase();const task=$('#model-task').value;const paid=$('#model-paid').checked;
  let models=cat.data.filter(m=>(!task||m.task===task)&&(paid||m.free)&&(!q||(m.id+' '+m.name+' '+m.description).toLowerCase().includes(q)));
  models=models.map((m,i)=>({...m,performance:{...(m.performance||{}),rank:i+1}}));
  $('#admin-model-rows').innerHTML=models.map(m=>{
    const t=m.performance||{};
    return '<tr><td><span class="rank">'+(t.rank||'—')+'</span></td><td><div class="model-name">'+esc(m.name)+'</div><div class="model-id">'+esc(m.id)+'</div>'+(m.requires_paid?'<span class="badge paid">'+esc(T('common.paidOnly'))+'</span>':'')+(m.deprecated?'<span class="badge paid">'+esc(T('common.deprecated'))+'</span>':'')+'</td>'+
    '<td data-label="'+esc(T('landing.table.task'))+'"><span class="badge">'+esc(taskLabel(m.task))+'</span></td><td data-label="'+esc(T('landing.table.context'))+'" class="nowrap">'+(m.context_window?nf(m.context_window):'—')+'</td><td data-label="'+esc(T('landing.table.caps'))+'">'+caps(m).map(x=>'<span class="badge">'+esc(x)+'</span>').join('')+'</td>'+
    '<td data-label="'+esc(T('landing.table.price'))+'" class="price">'+esc(priceOf(m))+'</td><td data-label="'+esc(T('landing.table.neurons'))+'" class="nowrap">'+nf(m.pricing?.tokens?.output_neurons_per_million)+' n/M</td><td data-label="'+esc(T('landing.table.tier'))+'"><span class="tier '+tier(m)+'">'+tier(m)+'</span> '+(t.score??'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" class="muted" style="padding:20px">'+esc(T('admin.models.noMatch'))+'</td></tr>';
  $('#admin-model-count').textContent=T('admin.models.count',{n:models.length});
}
function bindModels(){
  ['#model-search','#model-task','#model-paid'].forEach(s=>$(s)?.addEventListener('input',renderAdminModels));
  $('#refresh-catalog').addEventListener('click',async(e)=>{const btn=e.target;btn.disabled=true;btn.textContent=T('common.refreshing');try{state.catalog=await api('/api/admin/catalog/refresh',{method:'POST'});renderAdminModels();$('#catalog-meta').textContent=T('admin.models.source',{source:state.catalog.meta.source,free:state.catalog.meta.free_models||0,paid:state.catalog.meta.paid_models||0,deprecated:state.catalog.meta.deprecated_models||0,time:new Date(state.catalog.meta.fetched_at).toLocaleString()});$('#catalog-coverage').textContent=T('admin.models.coverage',{partner:state.catalog.meta.partner_models||0,authors:Object.keys(state.catalog.meta.authors||{}).length,tasks:Object.keys(state.catalog.meta.tasks||{}).length})}catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent=T('admin.models.refresh')}});
}
async function loadAccounts(){
  try{const d=await api('/api/admin/accounts');$('#account-rows').innerHTML=d.accounts.map(a=>'<tr><td><div class="model-name">'+esc(a.name)+'</div><div class="model-id">'+esc(a.accountId)+'</div></td><td class="mono tiny">'+esc(a.tokenPreview)+'</td><td><span class="badge '+(a.status==='active'?'':'paid')+'">'+esc(a.status==='active'?T('common.active'):T('common.disabled'))+'</span></td><td>'+new Date(a.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-account="'+esc(a.id)+'" data-status="'+(a.status==='active'?'disabled':'active')+'">'+(a.status==='active'?T('common.disable'):T('common.enable'))+'</button><button class="btn sm danger" data-del-account="'+esc(a.id)+'">'+T('common.delete')+'</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">'+esc(T('admin.accounts.noAccounts'))+'</td></tr>';
    $$('[data-del-account]').forEach(b=>b.onclick=async()=>{if(!confirm(T('admin.accounts.confirm')))return;await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.delAccount),{method:'DELETE'});loadAccounts();loadOverview()});
    $$('[data-toggle-account]').forEach(b=>b.onclick=async()=>{await api('/api/admin/accounts/'+encodeURIComponent(b.dataset.toggleAccount),{method:'PATCH',body:JSON.stringify({status:b.dataset.status})});loadAccounts()});
  }catch(e){alert(e.message)}
}
function bindAccounts(){
  $('#account-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{await api('/api/admin/accounts',{method:'POST',body:JSON.stringify({name:f.get('name'),accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),T('admin.accounts.added'),true);e.target.reset();loadAccounts();loadOverview()}catch(err){setMsg($('#account-msg'),err.message,false)}});
  $('#test-account').addEventListener('click',async()=>{const f=new FormData($('#account-form'));try{const d=await api('/api/admin/accounts/test',{method:'POST',body:JSON.stringify({accountId:f.get('accountId'),apiToken:f.get('apiToken')})});setMsg($('#account-msg'),d.ok?T('admin.accounts.tokenWorks',{n:d.models}):(d.error||'Token failed'),d.ok)}catch(err){setMsg($('#account-msg'),err.message,false)}});
}
async function loadKeys(){
  try{const d=await api('/api/admin/keys');$('#key-rows').innerHTML=d.keys.map(k=>'<tr><td><div class="model-name">'+esc(k.name)+'</div><div class="model-id">'+esc(k.prefix)+'…'+esc(k.last4)+'</div></td><td><span class="badge '+(k.enabled?'':'paid')+'">'+(k.enabled?T('common.active'):T('common.disabled'))+'</span></td><td class="tiny">'+(k.lastUsedAt?new Date(k.lastUsedAt).toLocaleString():T('common.never'))+'</td><td>'+new Date(k.createdAt).toLocaleDateString()+'</td><td class="row-actions"><button class="btn sm" data-toggle-key="'+esc(k.id)+'" data-enabled="'+(!k.enabled)+'">'+(k.enabled?T('common.disable'):T('common.enable'))+'</button><button class="btn sm danger" data-del-key="'+esc(k.id)+'">'+T('common.delete')+'</button></td></tr>').join('')||'<tr><td colspan="5" class="muted" style="padding:20px">'+esc(T('admin.keys.noKeys'))+'</td></tr>';
    $$('[data-del-key]').forEach(b=>b.onclick=async()=>{if(!confirm(T('admin.keys.confirm')))return;await api('/api/admin/keys/'+encodeURIComponent(b.dataset.delKey),{method:'DELETE'});loadKeys()});
    $$('[data-toggle-key]').forEach(b=>b.onclick=async()=>{await api('/api/admin/keys/'+encodeURIComponent(b.dataset.toggleKey),{method:'PATCH',body:JSON.stringify({enabled:b.dataset.enabled==='true'})});loadKeys()});
  }catch(e){alert(e.message)}
}
function bindKeys(){
  $('#key-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);try{const d=await api('/api/admin/keys',{method:'POST',body:JSON.stringify({name:f.get('name')})});e.target.reset();$('#new-key').style.display='block';$('#new-key-value').textContent=d.plaintext;setMsg($('#key-msg'),T('admin.keys.created'),true);loadKeys()}catch(err){setMsg($('#key-msg'),err.message,false)}});
  $('#copy-key').addEventListener('click',async()=>{await copyText($('#new-key-value').textContent);$('#copy-key').textContent=T('common.copied');setTimeout(()=>$('#copy-key').textContent=T('common.copy'),1200)});
}
async function loadSettings(){
  try{const d=await api('/api/admin/settings');const s=d.settings;
    $('#gateway-id').value=s.gatewayId||'';$('#allow-public').checked=!!s.allowPublic;$('#daily-neurons').value=s.dailyNeurons||10000;$('#default-max').value=s.defaultMaxOutputTokens||1024;
    $('#aliases').value=JSON.stringify(s.aliases||{},null,2);$('#benchmarks').value=JSON.stringify(s.benchmarks||{},null,2);
  }catch(e){alert(e.message)}
}
function bindSettings(){
  $('#settings-form').addEventListener('submit',async(e)=>{e.preventDefault();
    let aliases,benchmarks;try{aliases=JSON.parse($('#aliases').value||'{}');benchmarks=JSON.parse($('#benchmarks').value||'{}')}catch(err){setMsg($('#settings-msg'),T('admin.settings.invalidJson',{error:err.message}),false);return}
    try{await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({gatewayId:$('#gateway-id').value,allowPublic:$('#allow-public').checked,dailyNeurons:Number($('#daily-neurons').value),defaultMaxOutputTokens:Number($('#default-max').value),aliases,benchmarks})});setMsg($('#settings-msg'),T('admin.settings.saved'),true);loadOverview()}catch(err){setMsg($('#settings-msg'),err.message,false)}});
}
boot();
`;

function loginBody(lang) {
	return `<div class="login"><div class="card">
<div class="brand" style="margin-bottom:18px"><span class="mark">W</span> ${t(lang, 'brand.name')}</div>
<h2 style="font-size:22px;letter-spacing:-.03em;margin:0 0 4px">${t(lang, 'admin.login.title')}</h2>
<p class="sub" style="margin:0 0 18px">${t(lang, 'admin.login.sub')}</p>
<form id="login-form"><label class="field"><span>${t(lang, 'admin.login.password')}</span><input type="password" id="password" autocomplete="current-password" required autofocus></label>
<button class="btn primary" style="width:100%" type="submit">${t(lang, 'admin.login.submit')}</button></form>
<div id="login-msg" class="msg"></div>
<p class="tiny" style="margin-top:16px"><a href="/?lang=${lang}">${t(lang, 'admin.login.back')}</a></p>
</div></div>`;
}

function adminBody(lang) {
	return `${nav(lang)}
<div class="app">
<aside class="side">
<button data-tab="overview" class="active">${t(lang, 'admin.nav.overview')}</button>
<button data-tab="models">${t(lang, 'admin.nav.models')}</button>
<button data-tab="accounts">${t(lang, 'admin.nav.accounts')}</button>
<button data-tab="keys">${t(lang, 'admin.nav.keys')}</button>
<button data-tab="settings">${t(lang, 'admin.nav.settings')}</button>
<button id="logout" style="margin-top:14px;color:var(--bad)">${t(lang, 'admin.nav.logout')}</button>
</aside>
<main class="main">
<section id="tab-overview" class="tab active">
<h2>${t(lang, 'admin.overview.title')}</h2><p class="sub">${t(lang, 'admin.overview.sub')}</p>
<div class="kpis"><div class="kpi"><b id="kpi-used">—</b><span>${t(lang, 'admin.kpi.used')}</span></div><div class="kpi"><b id="kpi-limit">—</b><span>${t(lang, 'admin.kpi.limit')}</span></div><div class="kpi"><b id="kpi-remaining">—</b><span>${t(lang, 'admin.kpi.remaining')}</span></div><div class="kpi"><b id="kpi-accounts">—</b><span>${t(lang, 'admin.kpi.accounts')}</span></div></div>
<div class="split">
<div class="card"><h3>${t(lang, 'admin.quota.title')} <span id="usage-pct" class="muted"></span></h3><div class="usage-bar"><i id="usage-bar"></i></div><p class="tiny" id="usage-note" style="margin-top:10px"></p><button class="btn sm" id="refresh-usage" style="margin-top:10px">${t(lang, 'admin.quota.refresh')}</button></div>
<div class="card"><h3>${t(lang, 'admin.env.title')}</h3><dl class="kv" id="env-info"></dl></div>
</div>
<div class="split" style="margin-top:16px">
<div class="card"><h3>${t(lang, 'admin.perAccount.title')}</h3><ul class="list" id="account-usage"><li class="muted">${t(lang, 'common.loading')}</li></ul></div>
<div class="card"><h3>${t(lang, 'admin.topModels.title')}</h3><ul class="list" id="model-usage"><li class="muted">${t(lang, 'common.loading')}</li></ul></div>
</div>
</section>

<section id="tab-models" class="tab">
<h2>${t(lang, 'admin.nav.models')}</h2><p class="sub" id="catalog-meta">${t(lang, 'common.loading')}</p>
<div class="toolbar"><input id="model-search" placeholder="${t(lang, 'common.search')}" style="width:220px"><select id="model-task"><option value="">${t(lang, 'common.allTasks')}</option></select><label class="pill"><input type="checkbox" id="model-paid" style="width:auto;margin-right:4px"> ${t(lang, 'admin.models.includePaid')}</label><button class="btn sm" id="refresh-catalog">${t(lang, 'admin.models.refresh')}</button><span class="tiny" id="admin-model-count"></span></div>
<p class="tiny" id="catalog-coverage" style="margin:10px 0 0"></p>
<div class="table-wrap models-table" style="margin-top:12px"><table><thead><tr><th>#</th><th>${t(lang, 'landing.table.model')}</th><th>${t(lang, 'landing.table.task')}</th><th>${t(lang, 'landing.table.context')}</th><th>${t(lang, 'landing.table.caps')}</th><th>${t(lang, 'landing.table.price')}</th><th>${t(lang, 'landing.table.neurons')}</th><th>${t(lang, 'landing.table.tier')}</th></tr></thead><tbody id="admin-model-rows"></tbody></table></div>
<p class="tiny" style="margin-top:10px">${t(lang, 'admin.models.footnote')}</p>
</section>

<section id="tab-accounts" class="tab">
<h2>${t(lang, 'admin.nav.accounts')}</h2><p class="sub">${t(lang, 'admin.accounts.sub')}</p>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, 'admin.accounts.addTitle')}</h3>
<form class="form" id="account-form">
<label class="field"><span>${t(lang, 'admin.accounts.name')}</span><input name="name" placeholder="Personal" required></label>
<label class="field"><span>${t(lang, 'admin.accounts.accountId')}</span><input name="accountId" placeholder="32 hex characters" required></label>
<label class="field wide"><span>${t(lang, 'admin.accounts.token')}</span><input name="apiToken" type="password" autocomplete="off" required></label>
<div class="row-actions wide"><button class="btn primary" type="submit">${t(lang, 'admin.accounts.add')}</button><button class="btn" type="button" id="test-account">${t(lang, 'admin.accounts.test')}</button></div>
</form><div id="account-msg" class="msg"></div>
<p class="tiny">${t(lang, 'admin.accounts.hint')}</p></div>
<div class="table-wrap"><table><thead><tr><th>${t(lang, 'admin.accounts.table.account')}</th><th>${t(lang, 'admin.accounts.table.token')}</th><th>${t(lang, 'admin.accounts.table.status')}</th><th>${t(lang, 'admin.accounts.table.added')}</th><th>${t(lang, 'admin.accounts.table.actions')}</th></tr></thead><tbody id="account-rows"></tbody></table></div>
</section>

<section id="tab-keys" class="tab">
<h2>${t(lang, 'admin.nav.keys')}</h2><p class="sub">${t(lang, 'admin.keys.sub')}</p>
<div class="card" style="margin-bottom:16px"><form class="form inline" id="key-form"><label class="field"><span>${t(lang, 'admin.keys.name')}</span><input name="name" placeholder="LobeChat" required></label><button class="btn primary" type="submit">${t(lang, 'admin.keys.create')}</button></form><div id="key-msg" class="msg"></div>
<div id="new-key" style="display:none;margin-top:8px"><div class="note"><div class="tiny" style="margin-bottom:6px">${t(lang, 'admin.keys.copyNow')}</div><div style="display:flex;gap:8px;align-items:center"><code id="new-key-value" style="word-break:break-all;flex:1"></code><button class="btn sm" id="copy-key">${t(lang, 'common.copy')}</button></div></div></div></div>
<div class="table-wrap"><table><thead><tr><th>${t(lang, 'admin.keys.table.key')}</th><th>${t(lang, 'admin.keys.table.status')}</th><th>${t(lang, 'admin.keys.table.lastUsed')}</th><th>${t(lang, 'admin.keys.table.created')}</th><th>${t(lang, 'admin.keys.table.actions')}</th></tr></thead><tbody id="key-rows"></tbody></table></div>
</section>

<section id="tab-settings" class="tab">
<h2>${t(lang, 'admin.nav.settings')}</h2><p class="sub">${t(lang, 'admin.settings.sub')}</p>
<form id="settings-form">
<div class="card" style="margin-bottom:16px"><h3>${t(lang, 'admin.settings.runtime')}</h3><div class="form">
<label class="field"><span>${t(lang, 'admin.settings.gateway')}</span><input id="gateway-id" placeholder="default"></label>
<label class="field"><span>${t(lang, 'admin.settings.daily')}</span><input id="daily-neurons" type="number" min="1" max="10000"></label>
<label class="field"><span>${t(lang, 'admin.settings.defaultMax')}</span><input id="default-max" type="number" min="1" max="131072"></label>
<label class="field"><span>${t(lang, 'admin.settings.public')}</span><input id="allow-public" type="checkbox" style="width:auto"></label>
</div><p class="tiny">${t(lang, 'admin.settings.quotaHint')}</p></div>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, 'admin.settings.aliases')}</h3><p class="tiny">${t(lang, 'admin.settings.aliasesHint')}</p><textarea id="aliases"></textarea></div>
<div class="card" style="margin-bottom:16px"><h3>${t(lang, 'admin.settings.benchmarks')}</h3><p class="tiny">${t(lang, 'admin.settings.benchmarksHint')}</p><textarea id="benchmarks"></textarea></div>
<div class="row-actions"><button class="btn primary" type="submit">${t(lang, 'common.save')}</button></div><div id="settings-msg" class="msg"></div>
</form>
</section>
</main></div>`;
}

export async function handleAdminPage(request, env) {
	const lang = resolveLang(request);
	const authenticated = await isAdmin(request, env);
	const setupWarning = hasAdminPassword(env)
		? ''
		: `<div class="note" style="margin:16px 24px">${t(lang, 'admin.setupWarning')}</div>`;
	const body = authenticated
		? `${adminBody(lang)}${setupWarning}`
		: loginBody(lang);
	return shell({
		title: t(lang, authenticated ? 'admin.title' : 'admin.signinTitle'),
		body,
		script: authenticated ? ADMIN_SCRIPT : ADMIN_LOGIN_SCRIPT,
		authenticated,
		lang,
	});
}

export { shell, nav };
