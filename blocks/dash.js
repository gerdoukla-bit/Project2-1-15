/* Block: dash  v1.0.0
 * The COMPANY dashboard (#/company): header + verified badge, key numbers, offers not yet visible, live trips, add-a-trip-by-URL, inbox,
 * and the sub-blocks (requests, team, vault) which keep their own slots. The page loads the data; this block only draws it.
 * Slot  page.dash  ctx {cid, c, rev, mine, imports, pending, threads, prof}
 * Page extras (api.x.dash): L() t esc nf tripName egpOf priceRows trip coName0() submitImport(cid) signout()
 * Test: node tests/dash-test.js.   Off / broken: the page shows a plain fallback (links + sign out).
 */
(function () {
  var X = function (api) { return api.x && api.x.dash; };
  function view(ctx, api) {
    var x = X(api), L = x.L(), t = x.t, esc = x.esc, nf = x.nf, tripName = x.tripName, egpOf = x.egpOf, priceRows = x.priceRows, trip = x.trip;
    var cid = ctx.cid, c = ctx.c || {}, rev = ctx.rev, mine = ctx.mine || [], imports = ctx.imports || [], pending = ctx.pending || [], threads = ctx.threads || [], prof = ctx.prof || {};
    const pvChip=o=>o.status==='draft'?(L==='ar'?'مسودة':'Draft'):o.status==='pending_review'?(L==='ar'?'بانتظار المراجعة':'Pending review'):(L==='ar'?'مخفي عن العملاء':'Hidden');
 return `<div class="wrap">
  <div class="head"><div class="crumbs"><span class="tag">🏢 ${esc(c.ar||x.coName0()||'')}</span>${c.verified?`<span class="vf-pill">✓ ${t('verified')}${c.lic?' · '+esc(c.lic):''}</span>`:`<span class="tag warn">${rev?.wijha_review==='rejected'?(L==='ar'?'الطلب مرفوض':'Application rejected'):(L==='ar'?'الطلب قيد المراجعة — رحلاتك تظهر بعد الاعتماد':'Under review — your trips go live once approved')}</span>${rev?.wijha_review_note?`<span class="tag">${esc(rev.wijha_review_note)}</span>`:''}`}<span class="tag">${esc(prof.name||prof.email)}</span><button class="tag" data-wb-click="dash.signout">${t('signout')}</button></div><h1>${t('dash')}</h1></div>
  <div class="kpis"><div class="kpi"><b>${mine.length}</b><small>${L==='ar'?'رحلة منشورة':'live trips'}</small></div><div class="kpi"><b>${threads.length}</b><small>${L==='ar'?'محادثة':'conversations'}</small></div><div class="kpi"><b>${threads.reduce((a,x)=>a+(x.company_unread||0),0)}</b><small>${L==='ar'?'بانتظار ردّك':'awaiting your reply'}</small></div><div class="kpi"><b>${imports.filter(i=>i.status!=='imported').length}</b><small>${L==='ar'?'رابط قيد الاستيراد':'URLs importing'}</small></div></div>
  <div class="cocols">
  <div class="cocol">
   ${pending.length?`<div class="panel" data-pv-list><h3>${L==='ar'?'عروض غير ظاهرة للعملاء':'Offers not visible to clients'} <span class="pillnum">${pending.length}</span></h3>${pending.slice(0,12).map(o=>`<a class="rowitem" href="#/preview/${esc(o.id)}" data-wb-click="offer-popup.open|${esc(o.id)}"><div><b>${esc(o.title_ar||o.title_en||'—')}</b><small>${L==='ar'?'افتح العرض وعدّله':'Open and edit the offer'}</small></div><span class="tag warn">${esc(pvChip(o))}</span></a>`).join('')}</div>`:''}
   <div class="panel"><h3>${t('dash_trips')} <span class="pillnum">${mine.length}</span></h3>${mine.slice(0,12).map(x=>`<a class="rowitem" href="#/trip/${x.id}"><div><b>${esc(tripName(x,L))}</b><small>${nf(egpOf(x,priceRows(x)[0]?.[0]))} ج.م · ${x.taken||0}/${x.seats||'—'}</small></div><span class="tag ${x.detail==='full'?'ok':'warn'}">${x.detail==='full'?(L==='ar'?'مكتملة':'Complete'):(L==='ar'?'ناقصة':'Pending')}</span></a>`).join('')||`<p class="lead">${L==='ar'?'لم تُنشر رحلات بعد.':'No trips published yet.'}</p>`}
    <a href="./emails.html" target="_blank" rel="noopener" class="note" style="display:block;margin-top:10px;text-decoration:underline">✉ ${t('dash_emails')} →</a></div>
   <div class="panel"><h3>${L==='ar'?'أضف رحلة من رابط':'Add a trip from a URL'}</h3><p class="lead" style="font-size:13px">${L==='ar'?'الصق رابط صفحة الرحلة على موقعك أو النشرة. تُستخرج البيانات وتُراجع ثم تُنشر باسمك.':'Paste the trip page or brochure link. We extract the data, review it, and publish under your name.'}</p>
    <input id="impUrl" placeholder="https://…" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:10px 0;font-size:14px"><input id="impNote" placeholder="${L==='ar'?'ملاحظة (اختياري)':'Note (optional)'}" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:14px">
    <button class="btn btn-primary" data-wb-click="dash.import|${cid}">${L==='ar'?'إرسال الرابط':'Submit URL'}</button><div id="impErr"></div>
    <div style="margin-top:14px">${imports.map(i=>`<div class="rowitem"><div><b class="mono" style="font-size:11px">${esc(String(i.url||i.file_path||i.kind||'').slice(0,48))}</b><small>${(i.created_at||'').slice(0,10)}</small>${((i.payload&&i.payload.created)||[]).map(c=>c&&PV_ID.test(String(c.offer_id||''))?`<a class="btn btn-ghost" style="margin-top:4px;padding:4px 10px;font-size:12px" href="#/preview/${esc(c.offer_id)}" target="_blank" rel="noopener">${L==='ar'?'معاينة كما يراها العميل':'Preview as the client sees it'} ↗</a>`:'').join('')}</div><span class="tag ${i.status==='imported'?'ok':i.status==='failed'?'':'warn'}">${esc(i.status)}</span></div>`).join('')}</div>
    <p class="note" style="margin-top:12px"><a href="./admin.html" target="_blank" rel="noopener" style="text-decoration:underline">${L==='ar'?'تعديل رحلاتك يدوياً (لوحة الشركة) ↗':'Edit your trips manually (company console) ↗'}</a></p></div>
  </div>
  <div class="cocol">
   <div class="panel"><h3>${t('dash_inbox')} <span class="pillnum">${threads.reduce((a,x)=>a+(x.company_unread||0),0)}</span></h3>
    ${threads.map(th=>{const x=trip(th.offer_id);return `<a class="rowitem" href="#/chat/${th.id}"><div><b>${esc(L==='ar'?'عميل':'Client')}</b><small>${x?esc(tripName(x,L)):'—'}</small><small class="dim">${(th.last_message_at||'').replace('T',' ').slice(0,16)}</small></div>${th.company_unread?`<span class="pillnum">${th.company_unread}</span>`:`<span class="tag">✓</span>`}</a>`}).join('')||(LOADERR?threadsErr():`<p class="lead">${L==='ar'?'لا استفسارات بعد.':'No enquiries yet.'}</p>`)}</div>
   ${Wijha.html('dash.requests',{companyId:cid},{quiet:true})}
   ${Wijha.html('dash.team',{role:prof.role,companyId:cid},{quiet:true})}
   ${Wijha.html('dash.vault',{companyId:cid,staff:false})}
  </div></div>
  </div></div>`;
  }
  Wijha.block('dash', {
    version: '1.0.0',
    slots: { 'page.dash': function (ctx, api) { return view(ctx, api); } },
    actions: {
      signout: function (a, el, ev, api) { return X(api).signout(); },
      'import': function (a, el, ev, api) { return X(api).submitImport(a); }
    }
  });
})();
