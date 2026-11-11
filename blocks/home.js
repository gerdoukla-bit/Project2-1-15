/* Block: home  v1.0.0
 * The home page: hero + search, trip-type cards, tailored-trips section, featured trips, "why us", companies, how it works, company call-to-action.
 * Slot  page.home   ctx = { trips, cos, cats, cmp, hasCo, t(key), nf, esc, card(trip), art(kind,seed), priceRows, egpOf, pickFeatured(), ar }
 * Page extras (api.x.home): search(q, cat)  q(term)      The page keeps its own fallback if this block is off.
 * Own copy: every h_* text below belongs to this block (edit or translate it here). Shared texts come from ctx.t().
 * Look: css/home.css (+ css/categories.css, css/cards.css).   Test: node tests/home-test.js
 */
(function () {
  var OWN = { ar: {

 h_title:'رحلتك القادمة، بسعر واضح وتواصل مباشر مع المنظّم',
 h_sub:'قارن رحلات الحج والعمرة والرحلات الخارجية، ثم تواصل مع الجهة المنظّمة مباشرة. وجهة لا تأخذ أي نسبة من سعر الرحلة.',
 h_q_lbl:'ابحث عن رحلة',h_q_ph:'وجهة أو اسم شركة',h_type_lbl:'نوع الرحلة',h_go:'ابحث',h_pop:'وجهات شائعة',
 h_live:'رحلة متاحة الآن',h_lic:'جهة موثّقة',
 h_cats:'اختر نوع رحلتك',h_from:'تبدأ من',h_egp:'ج.م',h_nocat:'لا توجد رحلات منشورة حالياً',h_open:'تصفّح',
 h_feat_sub:'عروض منشورة من جهات مختلفة.',
 h_empty_t:'لا توجد رحلات منشورة الآن',h_empty_p:'الشركات تضيف عروضها تباعاً. يمكنك تصفّح كل الرحلات أو العودة لاحقاً.',
 h_trust:'لماذا وجهة؟',
 h_t1:'أسعار واضحة وبلا عمولة',h_t1p:'السعر المعروض هو سعر الجهة المنظّمة، ووجهة لا تأخذ أي نسبة منه.',
 h_t2:'شارة «موثّقة» عند التحقق فقط',h_t2p:'نعرض الشارة على صفحة الجهة حين نتحقق من بياناتها، وتبقى بقية العروض كما نشرها أصحابها. الحجز والدفع مع الجهة مباشرة.',
 h_t3:'قارن جنباً إلى جنب',h_t3p:'أضف حتى ٣ رحلات وقارن السعر والمواعيد والفنادق والطيران في جدول واحد.',
 h_t3c:'ابدأ المقارنة',h_t3o:'افتح المقارنة',
 h_t_of:'من',h_t_cos:'شركة موثّقة',
 h_cos_sub:'الشركات التي لديها رحلات منشورة الآن.',h_lic_no:'ترخيص',
 h_co_t:'هل تنظّم رحلات؟',h_co_c:'سجّل شركتك',h_co_d:'افتح لوحة الشركة',
 h_how_sub:'أربع خطوات من المقارنة إلى الحجز.',
  }, en: {

 h_title:'Your next trip, at a clear price, straight from the organiser',
 h_sub:'Compare Hajj, Umrah and trips abroad, then contact the organiser directly. Wijha takes no percentage of the trip price.',
 h_q_lbl:'Find a trip',h_q_ph:'Destination or company name',h_type_lbl:'Trip type',h_go:'Search',h_pop:'Popular destinations',
 h_live:'trips available now',h_lic:'verified publishers',
 h_cats:'Choose your kind of trip',h_from:'From',h_egp:'EGP',h_nocat:'No trips published right now',h_open:'Browse',
 h_feat_sub:'Offers published by different organisers.',
 h_empty_t:'No trips are published right now',h_empty_p:'Companies add their offers as they are approved. Browse all trips or check back soon.',
 h_trust:'Why Wijha',
 h_t1:'Clear prices, no commission',h_t1p:'The price shown is the organiser\'s own price, and Wijha takes no percentage of it.',
 h_t2:'"Verified" only where checked',h_t2p:'The badge appears on a publisher\'s page only when we have verified its details; other offers stay as published by their owners. You book and pay the organiser directly.',
 h_t3:'Compare side by side',h_t3p:'Add up to 3 trips and compare price, dates, hotels and flights in one table.',
 h_t3c:'Start comparing',h_t3o:'Open comparison',
 h_t_of:'of',h_t_cos:'verified',
 h_cos_sub:'Companies with trips published right now.',h_lic_no:'Licence',
 h_co_t:'Do you organise trips?',h_co_c:'Register your company',h_co_d:'Open company dashboard',
 h_how_sub:'Four steps from comparing to booking.',
  } };
  var HI={
 search:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
 shield:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><path d="M8.8 12l2.4 2.4 4.2-4.6"/></svg>',
 tag:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/><path d="M14 8l-4 4"/></svg>',
 cmp:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5"/><path d="M5.5 9h2.5M5.5 13h2.5M16 9h2.5M16 13h2.5"/></svg>',
 arr:'<svg class="h-arr" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'};

  function render(ctx) {
    var ar = !!ctx.ar, TRIPS = ctx.trips || [], COS = ctx.cos || [], CATS = ctx.cats || {}, CMP = ctx.cmp || [], CO = ctx.hasCo,
        nf = ctx.nf, esc = ctx.esc, card = ctx.card, art = ctx.art, priceRows = ctx.priceRows, egpOf = ctx.egpOf, pickFeatured = ctx.pickFeatured;
    var t = function (k) { return /^h_/.test(k) ? ((OWN[ar ? 'ar' : 'en'][k]) != null ? OWN[ar ? 'ar' : 'en'][k] : k) : ctx.t(k); };
    var L = ar ? 'ar' : 'en';
 const live=TRIPS.filter(x=>!x.expired);
 const tn=n=>`${nf(n)} ${ar?'رحلة':(n===1?'trip':'trips')}`;
 const minEgp=arr=>{ const v=arr.map(x=>{const k=priceRows(x)[0];return k?egpOf(x,k[0]):null}).filter(v=>v!=null&&isFinite(v)&&v>0); return v.length?Math.min(...v):null; };
 const verified=COS.filter(c=>c.verified).length;
 const feat=pickFeatured();
 /* popular destinations: computed from live trips abroad, most offers first */
 const dc={}; live.filter(x=>x.cat==='abroad').forEach(x=>{const d=(ar?x.destAr:x.dest)||''; if(d&&d.length<=26) dc[d]=(dc[d]||0)+1;});
 const pops=Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]);
 const kinds={abroad:['fjord',201],umrah:['haram',202],hajj:['madinah',203]};
 const coRows=COS.map(c=>({c,n:live.filter(x=>x.co===c.id).length})).filter(r=>r.n>0).sort((a,b)=>b.n-a.n||(b.c.verified-a.c.verified)).slice(0,8);
 const cmpN=CMP.length;
 
    return `<div class="wrap h-page">
  <section class="h-hero" aria-labelledby="hTitle">
   <div class="h-hero-art" aria-hidden="true">${art('fjord',99)}</div>
   <div class="h-hero-in">
    <h1 id="hTitle">${t('h_title')}</h1>
    <p class="h-sub">${t('h_sub')}</p>
    <form class="h-search" data-home-search role="search" aria-label="${t('h_q_lbl')}">
     <label class="h-f h-f-q"><span class="sr">${t('h_q_lbl')}</span>${HI.search}<input name="q" type="search" autocomplete="off" placeholder="${t('h_q_ph')}"></label>
     <label class="h-f h-f-t"><span class="sr">${t('h_type_lbl')}</span><select name="cat"><option value="">${t('h_type_lbl')}: ${t('all')}</option>${Object.keys(CATS).map(k=>`<option value="${k}">${ar?CATS[k].ar:CATS[k].en}</option>`).join('')}</select></label>
     <button class="btn btn-primary h-go" type="submit">${t('h_go')}</button>
    </form>
    ${pops.length?`<div class="h-pops"><span>${t('h_pop')}</span>${pops.map(p=>`<button type="button" data-wb-click="home.q|${esc(p)}">${esc(p)}</button>`).join('')}</div>`:''}
    ${live.length?`<p class="h-facts"><b>${nf(live.length)}</b> ${ar?t('h_live'):(live.length===1?'trip available now':t('h_live'))}${verified?` <i></i> <b>${nf(verified)}</b> ${t('h_lic')}`:''}</p>`:''}
   </div>
  </section>

  <section class="h-sec" aria-labelledby="hCats"><h2 id="hCats" class="h-h2">${t('h_cats')}</h2>
   <div class="h-cats">${Object.entries(CATS).map(([k,c])=>{ const rows=live.filter(x=>x.cat===k), m=minEgp(rows), [ak,as]=kinds[k]||['metro',204];
    return `<a class="h-cat" href="#/trips/${k}" onclick="F.q=''">
     <span class="h-cat-art" aria-hidden="true">${art(ak,as)}</span>
     <span class="h-cat-body"><b>${ar?c.ar:c.en}</b>
      <small>${rows.length?`${tn(rows.length)}${m?` · ${t('h_from')} ${nf(m)} ${t('h_egp')}`:''}`:t('h_nocat')}</small></span>
     <span class="h-cat-go" aria-hidden="true">${HI.arr}</span></a>`;}).join('')}</div></section>

  <section class="h-sec h-tailor" aria-labelledby="hTail"><div class="h-tailor-in">
   <div><span class="h-tailor-k">✨ ${ar?'رحلات حسب الطلب':'Tailored trips'}</span>
    <h2 id="hTail" class="h-h2">${ar?'لم تجد رحلتك؟ اطلبها كما تحلم بها':"Can't find your trip? Ask for it your way"}</h2>
    <p>${ar?'اكتب الوجهة والتاريخ وعدد الأشخاص والميزانية في دقيقة، وسنعرض عليك أقرب الرحلات المناسبة، ثم تصلك عروض الشركات التي تنظّم رحلات مشابهة. تقارنها وتختار، بدون أي التزام.':'Tell us the destination, dates, travellers and budget in a minute. We show you the closest matching trips, then companies that run similar trips send you offers. Compare and choose — no commitment.'}</p>
    <ul><li>${ar?'نموذج بسيط من خطوة واحدة':'One simple form'}</li><li>${ar?'أقرب رحلات متاحة فوراً':'Closest available trips straight away'}</li><li>${ar?'بياناتك لا تُشارَك إلا بموافقتك':'Your details are shared only with your consent'}</li></ul></div>
   <div class="h-tailor-cta">${Wijha.html('trips.request-cta',{},{quiet:true})}</div>
  </div></section>

  <section class="h-sec" aria-labelledby="hFeat">
   <div class="h-head"><div><h2 id="hFeat" class="h-h2">${t('featured')}</h2><p class="h-lead">${t('h_feat_sub')}</p></div><a class="h-more" href="#/trips">${t('viewall')} ${HI.arr}</a></div>
   ${feat.length?`<div class="grid h-feat">${feat.map(card).join('')}</div>`:
   `<div class="h-empty"><b>${t('h_empty_t')}</b><p>${t('h_empty_p')}</p><a class="btn btn-ghost" href="#/trips">${t('nav_offers')}</a></div>`}
  </section>

  <section class="h-trust" aria-labelledby="hTrust"><h2 id="hTrust" class="h-h2">${t('h_trust')}</h2>
   <div class="h-pillars">
    <div><span class="h-ic">${HI.shield}</span><h3>${t('h_t1')}</h3><p>${t('h_t1p')}</p></div>
    <div><span class="h-ic">${HI.tag}</span><h3>${t('h_t2')}</h3><p>${t('h_t2p')}</p>${verified?`<p class="h-calc"><b>${nf(verified)}</b> ${t('h_t_of')} <b>${nf(COS.length)}</b> ${t('h_t_cos')}</p>`:''}</div>
    <div><span class="h-ic">${HI.cmp}</span><h3>${t('h_t3')}</h3><p>${t('h_t3p')}</p>
     <a class="h-link" href="${cmpN>=2?'#/compare':'#/trips'}">${cmpN>=2?`${t('h_t3o')} (${cmpN})`:t('h_t3c')} ${HI.arr}</a></div>
   </div></section>

  ${coRows.length?`<section class="h-sec" aria-labelledby="hCos"><h2 id="hCos" class="h-h2">${t('cos_title')}</h2><p class="h-lead">${t('h_cos_sub')}</p>
   <ul class="h-cos">${coRows.map(({c,n})=>`<li><a href="#/trips?co=${esc(c.id)}"><span class="lg" aria-hidden="true">${esc((ar?c.ar:c.en).slice(0,1))}</span>
     <span><b>${esc(ar?c.ar:c.en)}</b><small>${tn(n)}</small>${c.verified?`<em>✓ ${t('verified')}${c.lic&&c.lic!=='—'?` · <bdi>${esc(c.lic)}</bdi>`:''}</em>`:''}</span></a></li>`).join('')}</ul></section>`:''}

  <section class="h-sec" aria-labelledby="hHow"><h2 id="hHow" class="h-h2">${t('how_title')}</h2><p class="h-lead">${t('h_how_sub')}</p>
   <ol class="h-how">${[1,2,3,4].map(i=>`<li><span class="h-n" aria-hidden="true">${ar?['١','٢','٣','٤'][i-1]:i}</span><b>${t('how'+i)}</b><small>${t('how'+i+'s')}</small></li>`).join('')}</ol></section>

  <section class="h-co" aria-labelledby="hCo"><div><h2 id="hCo">${t('h_co_t')}</h2><p>${t('su_co_p')}</p></div>
   <a class="btn btn-primary" href="${CO?'#/company':'#/company/signup'}">${CO?t('h_co_d'):t('h_co_c')}</a></section>
 </div>`;
  }

  Wijha.block('home', {
    version: '1.0.0',
    slots: { 'page.home': function (ctx) { return render(ctx || {}); } },
    actions: { q: function (a, el, ev, api) { if (api.x && api.x.home) api.x.home.q(a); } },
    init: function (api) {
      document.addEventListener('submit', function (ev) {
        var f = ev.target; if (!f || !f.hasAttribute || !f.hasAttribute('data-home-search')) return;
        ev.preventDefault(); if (api.x && api.x.home) api.x.home.search((f.q && f.q.value || '').trim(), f.cat ? f.cat.value : '');
      });
    }
  });
})();
