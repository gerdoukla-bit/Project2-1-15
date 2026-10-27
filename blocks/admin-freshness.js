/* Block: admin-freshness  v1.0.0
 * Company / admin console side of "price confirmed". Public side: blocks/freshness.js.
 * Slots:  offers.fresh.panel  ctx {offers, co, isAdmin, canConfirm, myCo, coName(id)}  -> panel above the offers table:
 *                               counts, "confirm all my live offers" (with a confirm dialog) and the "needs update" list (live, older than 14 days or never confirmed)
 *         offers.fresh.cell   ctx {offer, canConfirm}                                    -> one table cell: age pill + "Confirm still valid" button
 * Data:   reads offers.price_confirmed_at itself (select id,price_confirmed_at) because the admin_offers view may not expose the column.
 *         writes only through the RPC wijha_confirm_offer(p_offer uuid) -> new timestamp. Direct updates of the column are never made.
 * Needs from the page: api.get, api.rpc, api.refresh('page').
 */
(function(){
const DAY=864e5, LIMIT=14;
let map={}, st='idle', err=null, busy=false;      // st: idle | loading | ready | error
const today=()=>new Date().toISOString().slice(0,10);
const live=o=>o.status==='published'&&(o.review_state||'approved')==='approved'&&!o.internal_only&&o.visibility!=='internal'&&(!o.expires_on||o.expires_on>=today());
const tsOf=o=>{ const v=Object.prototype.hasOwnProperty.call(map,o.id)?map[o.id]:o.price_confirmed_at; return v==null||v===''||isNaN(Date.parse(v))?null:Date.parse(v); };
const ageOf=o=>{ const t=tsOf(o); return t==null?null:Math.max(0,Math.floor((Date.now()-t)/DAY)); };
const needs=o=>{ const a=ageOf(o); return a===null||a>LIMIT; };
function ageTxt(a){ if(a===null) return 'لم يُؤكَّد بعد'; if(a===0) return 'اليوم'; if(a===1) return 'أمس'; if(a===2) return 'منذ يومين'; if(a<=10) return 'منذ '+a+' أيام'; return 'منذ '+a+' يوماً'; }
const cls=a=>a===null?'bad':a>30?'bad':a>LIMIT?'warn':'ok';

function load(api){
  if(st==='loading'||st==='ready') return;
  st='loading';
  api.get('offers?select=id,price_confirmed_at&status=eq.published').then(rows=>{
    map={}; (rows||[]).forEach(r=>{ map[r.id]=r.price_confirmed_at||null; }); st='ready'; err=null; api.refresh('page');
  },e=>{ st='error'; err=String((e&&e.message)||e).slice(0,140); api.refresh('page'); });
}
function scope(ctx){
  return (ctx.offers||[]).filter(o=>live(o)&&(ctx.isAdmin?(!ctx.co||o.company_id===ctx.co):o.company_id===ctx.myCo));
}
async function confirmIds(ids,api){
  let ok=0,bad=0,lastErr='';
  for(let i=0;i<ids.length;i+=4){
    await Promise.all(ids.slice(i,i+4).map(async id=>{
      try{ const r=await api.rpc('wijha_confirm_offer',{p_offer:id}); map[id]=(typeof r==='string'&&!isNaN(Date.parse(r)))?r:new Date().toISOString(); ok++; }
      catch(e){ bad++; lastErr=String((e&&e.message)||e).slice(0,100); }
    }));
  }
  return {ok,bad,lastErr};
}
let LAST=null;
Wijha.block('admin-freshness',{
  version:'1.0.0',
  slots:{
    'offers.fresh.panel':(ctx,api)=>{
      LAST=ctx; const esc=api.esc;
      if(!ctx.canConfirm) return '';
      load(api);
      if(st==='error') return `<div class="note-box" style="background:var(--amber-soft,#fff4dd);border-radius:12px;padding:12px 16px;margin:12px 0">تعذّر قراءة تاريخ تأكيد الأسعار (${esc(err||'')}). باقي الصفحة تعمل بشكل طبيعي.</div>`;
      const mine=scope(ctx), old=mine.filter(needs).sort((a,b)=>(ageOf(b)??9999)-(ageOf(a)??9999));
      const head=`<b>صلاحية الأسعار</b> — ${mine.length} عرض منشور${ctx.isAdmin&&!ctx.co?' (كل الشركات)':''} · `+(st==='loading'?'جارٍ التحميل…':old.length?`<span style="color:var(--red,#c23b3b);font-weight:700">${old.length} يحتاج تحديثاً</span> (أقدم من ${LIMIT} يوماً أو لم يُؤكَّد)`:'<span style="color:var(--green,#1f8a5b);font-weight:700">كل الأسعار مؤكدة حديثاً</span>');
      return `<div class="note-box fresh-panel" style="background:var(--amber-soft,#fff4dd);border-radius:12px;padding:12px 16px;margin:12px 0">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${head}
          <button class="btn sm ok" ${mine.length&&!busy?'':'disabled'} data-wb-click="admin-freshness.all">✓ تأكيد كل عروضي المنشورة (${mine.length})</button></div>
        <p class="note" style="margin:6px 0 0">اضغط التأكيد فقط إذا كانت الأسعار والتواريخ في العرض ما زالت سارية. يظهر للعملاء على الموقع "السعر مؤكد منذ …"، وتتحول الشارة إلى تحذير بعد ${LIMIT} يوماً.</p>
        ${old.length?`<div class="tw" style="margin-top:10px"><table style="min-width:0"><thead><tr><th>العرض</th><th>الشركة</th><th>آخر تأكيد</th><th></th></tr></thead><tbody>${old.slice(0,20).map(o=>`<tr><td><b>${esc(o.title_ar)}</b></td><td>${esc(ctx.coName?ctx.coName(o.company_id):'')}</td><td><span class="pill ${cls(ageOf(o))}">${ageTxt(ageOf(o))}</span></td><td><button class="btn sm" data-wb-click="admin-freshness.one|${esc(o.id)}">✓ ما زال ساري</button></td></tr>`).join('')}</tbody></table></div>${old.length>20?`<p class="note">وعروض أخرى (${old.length-20}) — أكّدها من الجدول أدناه.</p>`:''}`:''}
      </div>`;
    },
    'offers.fresh.cell':(ctx,api)=>{
      LAST=LAST||{}; const o=ctx.offer; if(!o) return '';
      const a=ageOf(o);
      const pill=st==='ready'||o.price_confirmed_at!==undefined?`<span class="pill ${cls(a)}">${ageTxt(a)}</span>`:'<span class="pill">—</span>';
      return `${pill}${ctx.canConfirm?` <button class="btn sm" title="أؤكد أن الأسعار والتواريخ ما زالت سارية" data-wb-click="admin-freshness.one|${api.esc(o.id)}">✓ ما زال ساري</button>`:''}`;
    }
  },
  actions:{
    one:async(id,el,ev,api)=>{
      if(busy) return; busy=true; el.disabled=true;
      try{ const r=await confirmIds([id],api); if(r.ok) api.toast('تم تأكيد السعر'); else api.toast('تعذّر التأكيد: '+r.lastErr,true); }
      finally{ busy=false; api.refresh('page'); }
    },
    all:async(a,el,ev,api)=>{
      if(busy||!LAST) return; const ids=scope(LAST).map(o=>o.id); if(!ids.length) return;
      if(!confirm(`تأكيد أن أسعار وتواريخ ${ids.length} عرض منشور ما زالت سارية؟`)) return;
      busy=true; el.disabled=true;
      try{ const r=await confirmIds(ids,api); api.toast(r.bad?`تم تأكيد ${r.ok} وتعذّر ${r.bad}: ${r.lastErr}`:`تم تأكيد ${r.ok} عرض`,!!r.bad); }
      finally{ busy=false; api.refresh('page'); }
    }
  }
});
})();
