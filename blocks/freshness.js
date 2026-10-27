/* Block: freshness  v1.0.0
 * "Price confirmed <relative date>" stamp on trip cards and the trip page.
 * Slots:  trip.fresh  ctx {trip, variant:'card'|'detail'|'mini', hasPrice}   (mini = short text for the narrow facts cell)
 *           trip.confirmedAt = offers.price_confirmed_at (ISO string or null), mapped by mapOffer() from public_offers.
 * Levels: up to 14 days = calm; 15-30 days = "may be outdated" (amber); over 30 days = "likely outdated" (red, bold).
 * Missing / unparsable date: cards show nothing, the trip page shows a muted "date not available" line. Never prints null/undefined.
 * Expose: Wijha.use('freshness').describe(iso, lang, nowMs)  -> {level, days, text, date} | null   (used by tests)
 */
(function(){
const DAY=864e5;
function parse(iso){ if(iso==null||iso==='') return null; const t=Date.parse(iso); return isNaN(t)?null:t; }
function ageDays(iso,now){ const t=parse(iso); if(t==null) return null; return Math.max(0,Math.floor(((now==null?Date.now():now)-t)/DAY)); }
function level(d){ return d<=14?'ok':d<=30?'warn':'old'; }
function rel(d,L){
  if(L==='ar'){
    if(d===0) return 'اليوم'; if(d===1) return 'أمس';
    const mk=(n,one,two,few,many)=>n===1?'منذ '+one:n===2?'منذ '+two:'منذ '+n+' '+(n<=10?few:many);
    if(d<7) return mk(d,'يوم','يومين','أيام','يوماً');
    if(d<30) return mk(Math.floor(d/7),'أسبوع','أسبوعين','أسابيع','أسبوعاً');
    if(d<365) return mk(Math.floor(d/30),'شهر','شهرين','أشهر','شهراً');
    return 'منذ أكثر من سنة';
  }
  const pl=(n,w)=>n+' '+w+(n===1?'':'s')+' ago';
  if(d===0) return 'today'; if(d===1) return 'yesterday';
  if(d<7) return pl(d,'day'); if(d<30) return pl(Math.floor(d/7),'week');
  if(d<365) return pl(Math.floor(d/30),'month'); return 'over a year ago';
}
function describe(iso,L,now,mini){
  const d=ageDays(iso,now); if(d===null) return null;
  const lv=level(d), r=rel(d,L);
  const base=L==='ar'?(mini?'مؤكد ':'السعر مؤكد ')+r:(mini?'Confirmed ':'Price confirmed ')+r;
  const tail=lv==='ok'?'':mini?(L==='ar'?' · قد يكون قديماً':' · may be outdated'):lv==='warn'?(L==='ar'?' · قد يكون قديماً':' · may be outdated'):(L==='ar'?' · غالباً قديم، تأكد من الشركة':' · likely outdated, confirm with the company');
  return {level:lv,days:d,text:base+tail,date:new Date(parse(iso)).toISOString().slice(0,10)};
}
const STYLE={
  ok:'color:var(--muted,#6b6a72)',
  warn:'background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#8a5a05)',
  old:'background:var(--red-soft,#fdeaea);color:var(--red,#c23b3b);font-weight:700'
};
Wijha.block('freshness',{
  version:'1.0.0',
  expose:{ describe, ageDays },
  slots:{
    'trip.fresh':(ctx,api)=>{
      const x=ctx.trip||{}, L=api.lang, esc=api.esc, card=ctx.variant==='card', mini=ctx.variant==='mini';
      if(ctx.hasPrice===false) return '';
      const d=describe(x.confirmedAt,L,undefined,mini);
      const size=card||mini?'font-size:11px;padding:2px 8px;margin-top:6px':'font-size:12.5px;padding:4px 10px;margin-top:8px';
      const base='display:inline-block;border-radius:10px;line-height:1.5;'+size;
      if(!d){
        if(card||mini) return '';
        return `<div class="fresh fresh-na" data-fresh="na" style="${base};color:var(--dim,#95939c)">${L==='ar'?'تاريخ تأكيد السعر غير متوفر، تأكد من الشركة':'Price confirmation date not available, check with the company'}</div>`;
      }
      return `<div class="fresh fresh-${d.level}" data-fresh="${d.level}" title="${esc(d.date)}" style="${base};${STYLE[d.level]}">${esc(d.text)}</div>`;
    }
  }
});
})();
