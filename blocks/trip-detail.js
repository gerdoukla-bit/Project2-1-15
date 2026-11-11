/* Block: trip-detail  v1.0.0
 * The TRIP PAGE (#/trip/<id> and the owner preview): header, gallery, facts, summary, day-by-day, hotels, inclusions, extra details, flights, visa, notes,
 * cancellation / payment, FAQ + photos (other blocks), company box, similar trips, and the price / rooms panel with the mobile sheet.
 * Slot  page.trip  ctx {trip}   (a trip mapped by the page: public route or preview route)
 * The booking logic (room counts, totals, enquiry) still lives in the page; this block only draws the page and forwards the clicks (api.x.detail).
 * Page extras (api.x.detail): L() t esc nf CATS ITEM_CATS HOTELS SAWA_PAY CURSYM FX co nextSeed pic art similar priceRows egpOf priceBlock durTxt tripName
 *   isSoon soonDays byWijha LISTED_TXT inCmp saved threadFor pvE pvS card  and actions: toggleCmp toggleSave share allDays sheet qty sendEnq after(trip)
 * Look: css/trip-detail.css.   Tests: node tests/trip-detail-test.js ; preview-test.js (owner preview uses this page too)
 * Off / broken: the page shows a short plain version of the trip (see detailFallback in index.html).
 */
(function () {
  var X = function (api) { return api.x && api.x.detail; };

  function view(ctx, api) {
    var X_ = X(api), x = ctx.trip;
    var L = X_.L(), t = X_.t, esc = X_.esc, nf = X_.nf, CATS = X_.CATS, ITEM_CATS = X_.ITEM_CATS, HOTELS = X_.HOTELS, SAWA_PAY = X_.SAWA_PAY, CURSYM = X_.CURSYM, FX = X_.FX,
        co = X_.co, nextSeed = X_.nextSeed, pic = X_.pic, art = X_.art, similar = X_.similar, priceRows = X_.priceRows, egpOf = X_.egpOf, priceBlock = X_.priceBlock,
        durTxt = X_.durTxt, tripName = X_.tripName, isSoon = X_.isSoon, soonDays = X_.soonDays, byWijha = X_.byWijha, LISTED_TXT = X_.LISTED_TXT, inCmp = X_.inCmp,
        threadFor = X_.threadFor, pvE = X_.pvE, pvS = X_.pvS, card = X_.card;

 const id=x.id, rows=priceRows(x);
 const c=co(x.co), s=nextSeed(), sims=similar(x);
 const total=x.seats||0, taken=x.taken||0, pct=total?Math.round(taken/total*100):0;
    var html = `<div class="wrap">
  <div class="head">
   <div class="crumbs">
     <span class="tag t-${x.cat}">${CATS[x.cat].icon} ${L==='ar'?CATS[x.cat].ar:CATS[x.cat].en}</span>
     <span class="tag">${L==='ar'?CATS[x.cat].subs[x.sub].ar:CATS[x.cat].subs[x.sub].en}</span>
     <span class="tag">${esc(L==='ar'?x.regionAr:x.region)}</span>
     ${durTxt(x).length?`<span class="tag">${durTxt(x).join(' / ')}</span>`:pvE(true,'المدة','Duration')}
     ${x.flightsIncluded?`<span class="tag ok">✈ ${t('inc_yes')}</span>`:''}
   </div>
   ${x.sample?`<div class="note-box">🧪 ${x.expired?(L==='ar'?'عرض تجريبي انتهى موعده — معروض كمثال فقط ولا يمكن الاستفسار عنه.':'Sample offer whose dates have passed — shown as an example only, enquiries are closed.'):(L==='ar'?'هذا عرض تجريبي لعرض شكل الصفحة — الأسعار والمواعيد غير مؤكدة وقد لا يكون متاحاً للحجز.':'This is a sample offer shown to demonstrate the page — prices and dates are not confirmed and it may not be bookable.')}</div>`:''}
   ${byWijha(x)?`<div class="note-box by-w-box">ℹ️ ${esc(LISTED_TXT())}</div>`:''}
   <h1>${esc(tripName(x,L))}</h1>
   <div class="head-row"><div class="sub">
     <a href="#/trips?co=${c.id}">${esc(L==='ar'?c.ar:c.en)}</a>
     ${c.verified?`<span class="vf-pill">✓ ${t('verified')}${c.lic&&c.lic!=='—'?' · '+esc(c.lic):''}</span>`:''}
     ${c.reviews>0&&c.rating?`<span class="rating"><b>★</b> ${c.rating} · ${c.reviews} ${t('reviews')}</span>`:''}
     ${isSoon(x)?`<span class="scarce">${t('soon')} · ${soonDays(x)} ${L==='ar'?'يوم':'days'}</span>`:''}
   </div>
   <div class="sub"><button class="tag" data-wb-click="trip-detail.save|${x.id}" id="saveBtn">${X_.saved(x.id)?'★ '+t('saved'):'☆ '+t('save')}</button>
     <button class="tag" data-wb-click="trip-detail.cmp|${x.id}">${inCmp(x.id)?'✓ '+(L==='ar'?'في المقارنة':'In compare'):'⇄ '+(L==='ar'?'قارن':'Compare')}</button>
     <button class="tag" data-wb-click="trip-detail.share">↗ ${L==='ar'?'مشاركة':'Share'}</button></div></div>
  </div>
  <div class="gallery">
    <div class="g1">${pic(x.cover||(x.photos&&x.photos[0]&&x.photos[0].url),x.art,s)}</div>
    ${[1,2,3,4].map(n=>`<div class="g${n+1}">${pic(x.itin[n]?.photo||(x.photos&&x.photos[x.cover?n-1:n]&&x.photos[x.cover?n-1:n].url),n===4?'plane':(x.itin[n]?.art||x.art),s+n)}</div>`).join('')}</div>

  <div class="layout"><div class="main">
   <section><div class="facts">
     ${durTxt(x).length?`<div class="fact"><div class="k">${t('d_duration')}</div><div class="v">${durTxt(x)[0]||''}<small>${durTxt(x)[1]||''}</small></div></div>`:(window.__preview?`<div class="fact"><div class="k">${t('d_duration')}</div><div class="v">${pvE(true,'المدة','Duration')}</div></div>`:'')}
     <div class="fact"><div class="k">${t('d_dates')}</div><div class="v">${pvE(x.dates.ar==='—','التواريخ','Dates')||esc(L==='ar'?x.dates.ar:x.dates.en)}</div></div>
     <div class="fact"><div class="k">${t('d_region')}</div><div class="v">${esc(L==='ar'?x.destAr:x.dest)}<small>${esc(L==='ar'?x.regionAr:x.region)}</small></div></div>
     <div class="fact"><div class="k">${t('d_flights')}</div><div class="v">${x.flightsIncluded?t('inc_yes'):t('inc_no')}${x.arrival?`<small>${L==='ar'?'الوصول':'Arrival'}: ${esc(x.arrival)}</small>`:''}</div></div>
     <div class="fact"><div class="k">${t('d_from')}</div>${pvE(!rows.length,'السعر','Price')||priceBlock(x,'v')}${Wijha.html('trip.fresh',{trip:x,variant:'mini',hasPrice:!!priceRows(x)[0]},{quiet:true})}</div>
   </div></section>

   <section><div class="eyebrow">${t('d_brief')}</div>
     ${pvE(!(L==='ar'?x.briefAr:x.briefEn),'النبذة التعريفية','Summary')||`<p class="brief">${esc(L==='ar'?x.briefAr:x.briefEn)}</p>`}
     ${x.seats?`<div class="fillbar"><div class="bar"><i style="width:${pct}%"></i></div>
       <div class="ft"><span>${taken} ${t('seats')} ${total}</span><b>${pct}%</b></div></div>`:''}
   </section>

   <section><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
     <h2 style="margin:0">${t('d_journey')}</h2>
     <div style="display:flex;gap:6px"><button class="tag" data-wb-click="trip-detail.days|1">${L==='ar'?'توسيع الكل':'Expand all'}</button>
      <button class="tag" data-wb-click="trip-detail.days|0">${L==='ar'?'طيّ الكل':'Collapse all'}</button></div></div>
    ${x.detail==='outline'||(window.__preview&&!x.itin.length)?`<div class="note-box">📄 ${t('outline')}</div>`:''}
    <div class="days">${pvE(!x.itin.length,'لم يُعثر على برنامج يوم بيوم في الملف','No day-by-day program was found in the file',true)}${x.itin.map((d,i)=>`
     <div class="day ${i===0?'open':''}">
      <button class="day-head" data-wb-click="trip-detail.day">
        <div class="day-n">${L==='ar'?'يوم':'Day'}<b>${i+1}</b></div>
        <div class="day-main"><div class="day-title">${esc(L==='ar'?d.ar:d.en)}</div>${d.label?`<div class="day-meta">${esc(d.label)}</div>`:''}
          <div class="day-tags">${[...new Set(d.blocks.flatMap(b=>b.items.map(it=>it.cat)))].map(k=>
            `<span class="mini" style="--c:${ITEM_CATS[k].c}">${ITEM_CATS[k].icon} ${L==='ar'?ITEM_CATS[k].ar:ITEM_CATS[k].en}</span>`).join('')}</div></div>
        <div class="chev">⌄</div></button>
      <div class="day-body">${d.blocks.map(b=>`
        <div class="blk"><h4>${esc(L==='ar'?b.ar:b.en)}</h4>
        <ul>${b.items.map(it=>`<li><span class="pin" style="--c:${ITEM_CATS[it.cat].c}" title="${L==='ar'?ITEM_CATS[it.cat].ar:ITEM_CATS[it.cat].en}">${ITEM_CATS[it.cat].icon}</span>
          <span class="txt">${esc(L==='ar'?it.ar:it.en)}<em class="ic-lbl">${L==='ar'?ITEM_CATS[it.cat].ar:ITEM_CATS[it.cat].en}</em></span></li>`).join('')}</ul></div>`).join('')}
      </div></div>`).join('')}</div></section>

   ${pvS(!(x.hotels&&x.hotels.length),t('d_hotels'),'الفنادق','Hotels')}${x.hotels&&x.hotels.length?`<section><h2>${t('d_hotels')}</h2><div class="hotels">${x.hotels.map(hh=>{
     const h=HOTELS[hh.h]; return `<a class="hotel" href="#/hotel/${hh.h}">
      <div class="hart">${art(h.art,nextSeed())}</div>
      <div class="hbody"><b>${esc(h.name)}</b>
        <small>${esc(L==='ar'?h.cityAr:h.city)} · ${'★'.repeat(h.stars)} · ${hh.nights} ${t('nights')}</small>
        <small class="dim">${esc(L==='ar'?hh.note.ar:hh.note.en)}</small>
        ${h.noReviews?`<div class="hrev"><span class="tag sm">${L==='ar'?'لا توجد مراجعات بعد':'No reviews yet'}</span></div>`:`<div class="hrev"><span class="score">${h.rating}</span><span>${nf(h.count)} ${t('reviews')}</span><span class="more">${L==='ar'?'اقرأ الخلاصة →':'Read the summary →'}</span></div>`}
      </div></a>`}).join('')}</div></section>`:''}

   <section><h2>${t('d_incl')}</h2><div class="two">
     <div class="incl"><h3 class="yes">✓ ${t('inc_yes')}</h3><ul>${x.inc.map(i=>
       `<li><span class="pin" style="--c:${ITEM_CATS[i.cat].c}">${ITEM_CATS[i.cat].icon}</span><span class="txt">${esc(L==='ar'?i.ar:i.en)}<em class="ic-lbl">${L==='ar'?ITEM_CATS[i.cat].ar:ITEM_CATS[i.cat].en}</em></span></li>`).join('')||pvLi(true,'ما يشمله السعر','What is included')}</ul></div>
     <div class="incl"><h3 class="no">− ${t('inc_no')}</h3><ul>${x.exc.map(i=>
       `<li><span class="pin" style="--c:${ITEM_CATS[i.cat].c}">${ITEM_CATS[i.cat].icon}</span><span class="txt">${esc(L==='ar'?i.ar:i.en)}<em class="ic-lbl">${L==='ar'?ITEM_CATS[i.cat].ar:ITEM_CATS[i.cat].en}</em></span></li>`).join('')||pvLi(true,'ما لا يشمله السعر','What is not included')}</ul></div>
   </div></section>

   ${(x.mealsAr||x.minaAr||x.track||x.deposit||x.regDeadline||x.validUntil||x.priceBasis||x.addons?.length)?`<section><h2>${L==='ar'?'تفاصيل إضافية':'Additional details'}</h2><div class="facts" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
     ${x.mealsAr?`<div class="fact"><div class="k">${L==='ar'?'الوجبات':'Meals'}</div><div class="v">${esc(L==='ar'?x.mealsAr:(x.mealsEn||x.mealsAr))}</div></div>`:''}
     ${x.minaAr?`<div class="fact"><div class="k">${L==='ar'?'الإقامة في منى':'Mina accommodation'}</div><div class="v">${esc(L==='ar'?x.minaAr:(x.minaEn||x.minaAr))}</div></div>`:''}
     ${x.track?`<div class="fact"><div class="k">${L==='ar'?'المسار':'Track'}</div><div class="v">${esc(x.track)}</div></div>`:''}
     ${x.deposit?`<div class="fact"><div class="k">${t('dep')}</div><div class="v">${nf(x.deposit)} ج.م<small>${t('person')}</small></div></div>`:''}
     ${x.ferry?`<div class="fact"><div class="k">${t('ferry')}</div><div class="v">${nf(x.ferry)} ج.م<small>${t('person')}</small></div></div>`:''}
     ${x.regDeadline?`<div class="fact"><div class="k">${L==='ar'?'آخر موعد للتسجيل':'Registration deadline'}</div><div class="v">${esc(x.regDeadline)}</div></div>`:''}
     ${x.validUntil?`<div class="fact"><div class="k">${L==='ar'?'السعر ساري حتى':'Price valid until'}</div><div class="v">${esc(x.validUntil)}</div></div>`:''}
     ${x.priceBasis?`<div class="fact"><div class="k">${L==='ar'?'أساس السعر':'Price basis'}</div><div class="v">${esc(x.priceBasis)}</div></div>`:''}
     ${x.season?`<div class="fact"><div class="k">${L==='ar'?'الموسم':'Season'}</div><div class="v">${esc(x.season)}</div></div>`:''}
   </div>${x.addons?.length?`<h3 style="margin-top:16px">${L==='ar'?'إضافات اختيارية':'Optional add-ons'}</h3><div class="incl"><ul>${x.addons.map(i=>`<li><span class="pin" style="--c:${ITEM_CATS[i.cat].c}">${ITEM_CATS[i.cat].icon}</span><span class="txt">${esc(L==='ar'?i.ar:i.en)}${i.price?` <b class="mono">${esc(i.price)}</b>`:''}</span></li>`).join('')}</ul></div>`:''}
   ${x.sourceUrl?`<p class="note">${L==='ar'?'المصدر':'Source'}: <a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener" class="mono">${esc(x.sourceUrl.replace(/^https?:\/\//,'').slice(0,60))}</a>${x.sourceType?` · ${esc(x.sourceType)}`:''}</p>`:''}</section>`:''}
   ${x.flights?`<section><h2>${t('d_flightinfo')}</h2><div class="two">
     <div class="fl"><div class="k">${L==='ar'?'الذهاب':'Outbound'}</div><p>${esc(L==='ar'?x.flights.outAr:x.flights.outEn)}</p></div>
     <div class="fl"><div class="k">${L==='ar'?'العودة':'Return'}</div><p>${esc(L==='ar'?x.flights.backAr:x.flights.backEn)}</p></div></div></section>`:''}

   ${x.visa?`<section><h2>${t('d_visa')} — ${esc(L==='ar'?x.visa.countryAr:x.visa.country)}</h2>
     <ul class="docs">${(L==='ar'?x.visa.docsAr:x.visa.docsEn).map(d=>`<li>📄 ${esc(d)}</li>`).join('')}</ul></section>`:''}

   ${x.notes?`<section><h2>${t('d_notes')}</h2><ul class="docs">${(L==='ar'?x.notes.ar:x.notes.en).map(n=>`<li>ℹ️ ${esc(n)}</li>`).join('')}</ul></section>`:''}

   ${x.co!=='sawa'?pvS(!x.cancel,t('d_pay'),'سياسة الإلغاء','Cancellation policy'):''}${(x.cancel&&x.co!=='sawa')?`<section><h2>${t('d_pay')}</h2><h3>${L==='ar'?'سياسة الإلغاء':'Cancellation'}</h3>
     <div class="pol">${(L==='ar'?x.cancel.ar:x.cancel.en).map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></section>`:''}
   ${Wijha.html('detail.faq',{trip:x})}
   ${Wijha.html('detail.photos',{trip:x})}
   ${x.co==='sawa'?`<section><h2>${t('d_pay')}</h2>
     <h3>${L==='ar'?'طرق الدفع':'Payment methods'}</h3>
     <div class="pays">${(L==='ar'?c.pay:c.payEn).map(p=>`<span class="tag">${esc(p)}</span>`).join('')}</div>
     <h3 style="margin-top:16px">${L==='ar'?'سياسة الحجز':'Reservation'}</h3>
     <p class="lead">${esc(L==='ar'?SAWA_PAY.reserveAr:SAWA_PAY.reserveEn)}</p>
     <h3 style="margin-top:16px">${L==='ar'?'سياسة الإلغاء':'Cancellation'}</h3>
     <div class="pol">${(L==='ar'?SAWA_PAY.cancelAr:SAWA_PAY.cancelEn).map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></section>`:''}

   <section><h2>${t('d_about')}</h2><div class="co-box">
     <div class="lg">${esc((L==='ar'?c.ar:c.en).slice(0,1))}</div>
     <div><b>${esc(L==='ar'?c.ar:c.en)}</b>${c.verified?`<span class="vf-pill">✓ ${t('verified')}${c.lic&&c.lic!=='—'?' · '+esc(c.lic):''}</span>`:''}
       <small>${esc(L==='ar'?c.aboutAr:c.aboutEn)}</small>
       ${c.addr?`<small class="dim">📍 ${esc(L==='ar'?c.addr:c.addrEn)}</small>`:''}
       ${c.hours?`<small class="dim">🕐 ${esc(L==='ar'?c.hours:c.hoursEn)}</small>`:''}
       <small class="dim">${t('hotline')}: <span class="mono">${esc(c.hotline)}</span></small></div></div></section>

   ${sims.length?`<section class="sims"><h2>${t('d_similar')}</h2>
     <div class="grid">${sims.map(r=>`<div class="simwrap">${card(r.x)}
       <div class="why">${r.why.map(w=>`<span>${esc(w)}</span>`).join('')}${r.x.co===x.co?`<span class="same">${L==='ar'?'نفس الشركة':'same company'}</span>`:''}</div></div>`).join('')}</div></section>`:''}
  </div>

  <aside class="side" id="side" data-wb-click="trip-detail.shade"><div class="bcard">
    <button class="sheet-x" aria-label="${L==='ar'?'إغلاق':'Close'}" data-wb-click="trip-detail.close">✕</button>
    <div class="pl">${pvE(!rows.length,'السعر','Price')}${rows.length?priceBlock(x):`<div class="pr-egp" style="font-size:20px">${L==='ar'?'السعر عند الاستفسار':'Price on enquiry'}</div>`}${rows.length?Wijha.html('trip.fresh',{trip:x,variant:'detail',hasPrice:true},{quiet:true}):''}</div>
    <div class="gst">${pvE(x.dates.ar==='—','التواريخ','Dates')||esc(L==='ar'?x.dates.ar:x.dates.en)}${x.priceNote?` · ${esc(L==='ar'?x.priceNote.ar:x.priceNote.en)}`:''}</div>
    ${rows.length?`<div class="field"><div class="k">${L==='ar'?'اختر الغرف وعدد المسافرين':'Choose rooms & travellers'}</div>
      <div class="rooms">${rows.map(([k,v])=>
      `<div class="room" data-k="${k}">
        <span class="n">${t(k)}</span>
        <span class="rp">${nf(egpOf(x,k))} <em>ج.م ${L==='ar'?'للفرد':'/ person'}</em></span>
        <span class="o">${x.cur!=='EGP'?nf(v)+' '+CURSYM[x.cur]:''}</span>
        <div class="rs"><button aria-label="${L==='ar'?'إنقاص':'Remove'} ${t(k)}" data-wb-click="trip-detail.qty|${k}|-1">−</button><b id="q_${k}">0</b><button aria-label="${L==='ar'?'إضافة':'Add'} ${t(k)}" data-wb-click="trip-detail.qty|${k}|1">+</button></div>
        <span class="rh" id="rh_${k}"></span>
      </div>`).join('')}</div>
      <div class="paxsum" id="paxL"></div></div>
    <div class="total"><span class="k">${t('total')}</span><span class="v" id="tot"></span></div>
    <details class="mini"><summary>${t('breakdown')}</summary><div class="breakdown" id="bd"></div></details>`:`<div class="note-box" style="margin:10px 0">${L==='ar'?'لم تنشر الشركة سعراً لهذا العرض بعد — اسألها مباشرة عبر المحادثة.':'The company has not published a price for this offer yet. Ask it directly through the chat.'}</div><span id="paxL" hidden></span><span id="tot" hidden></span><div id="bd" hidden></div>`}
    ${x.expired?`<div class="note-box">${L==='ar'?'انتهى موعد هذا العرض':'This offer has ended'}</div>`:(rows.length?`<button class="btn btn-primary" data-wb-click="trip-detail.enq">${t('enquire')}</button>`:'')}
    <a class="btn btn-ghost" href="#/chat/${threadFor(x.id)}">💬 ${t('chat')}</a>
    <p class="note">${t('pricenote')}</p>
  </div></aside></div></div>`;
    setTimeout(function () { try { X_.after(x); } catch (e) { try { console.error('[trip-detail] after', e); } catch (_) {} } }, 0);   // mobile bar + totals, once the markup is on screen
    return html;
  }

  Wijha.block('trip-detail', {
    version: '1.0.0',
    slots: { 'page.trip': function (ctx, api) { return view(ctx || {}, api); } },
    actions: {
      days: function (a, el, ev, api) { X(api).allDays(a === '1'); },
      day: function (a, el) { el.parentElement.classList.toggle('open'); },
      shade: function (a, el, ev, api) { if (ev.target === el) X(api).sheet(false); },
      close: function (a, el, ev, api) { X(api).sheet(false); },
      qty: function (a, el, ev, api) { var p = String(a).split('|'); X(api).qty(p[0], Number(p[1])); },
      enq: function (a, el, ev, api) { X(api).sendEnq(); },
      share: function (a, el, ev, api) { X(api).share(); },
      cmp: function (a, el, ev, api) { X(api).toggleCmp(a, ev); },
      save: function (a, el, ev, api) { X(api).toggleSave(a); }
    }
  });
})();
