/* Block: trips-list  v1.0.0
 * The trip CARD and the TRIPS LIST page (filters, sort, search, results grid).
 * Slots   trips.card  ctx {trip}            one trip card (used by the list, the home page, "similar trips", the account page)
 *         page.trips  ctx {cat}             the whole list page, #/trips and #/trips/<category>
 * Page extras (api.x.trips): L() t esc CATS F(shared filter state) trips() cos() co nextSeed pic isSoon isFull soonDays tripName durTxt priceBlock priceRows egpOf inCmp toggleCmp byWijha LISTED_TXT go logSearch
 * Look: css/cards.css, css/filters.css.   Tests: node tests/trips-list-test.js ; REF=<older index.html> HASHES='#/trips,#/trips/umrah' node tests/same-render-test.js
 * If this block is off, the page shows a plain list of links (see listFallback in index.html).
 */
(function () {
  var X = function (api) { return api.x && api.x.trips; };

  function card(ctx, api) {
    var x = X(api), t_ = ctx.trip, L = x.L(), t = x.t, esc = x.esc, CATS = x.CATS, co = x.co, nextSeed = x.nextSeed, pic = x.pic, isSoon = x.isSoon, isFull = x.isFull,
        tripName = x.tripName, durTxt = x.durTxt, priceBlock = x.priceBlock, priceRows = x.priceRows, inCmp = x.inCmp, byWijha = x.byWijha, LISTED_TXT = x.LISTED_TXT;
 const c=co(t_.co)||{ar:'—',en:'—',verified:false}; const s=nextSeed();
 return `<a class="card" href="#/trip/${t_.id}">
  <div class="img">${pic(t_.cover,t_.art,s)}
    <span class="cat">${CATS[t_.cat].icon} ${L==='ar'?CATS[t_.cat].ar:CATS[t_.cat].en}</span>
    ${(L==='ar'?t_.destAr:t_.dest)?`<span class="cityname">📍 ${esc(L==='ar'?t_.destAr:t_.dest)}</span>`:''}
    ${t_.sample?`<span class="flag sample">${t_.expired?(L==='ar'?'تجريبي · منتهي':'Sample · expired'):(L==='ar'?'عرض تجريبي':'Sample offer')}</span>`:''}
    ${!t_.expired&&isSoon(t_)?`<span class="flag soon">${t('soon')}</span>`:isFull(t_)?`<span class="flag full">${t('full')}</span>`:''}
    <button class="cmpbtn ${inCmp(t_.id)?'on':''}" data-wb-click="trips-list.cmp|${t_.id}" title="${L==='ar'?'أضف للمقارنة':'Add to compare'}">${inCmp(t_.id)?'✓':'⇄'}</button></div>
  <div class="body">
    <div class="ttl">${esc(tripName(t_,L))}</div>
    <div class="co">${esc(L==='ar'?c.ar:c.en)}${c.verified?' <span class="vf">✓</span>':''}${byWijha(t_)?` <span class="by-w" title="${esc(LISTED_TXT())}">${L==='ar'?'· جمعته وجهة':'· listed by Wijha'}</span>`:''}</div>
    <div class="meta">${durTxt(t_)[0]?`<span>🗓 ${durTxt(t_)[0]}</span>`:''}<span>📍 ${esc(L==='ar'?t_.regionAr:t_.region)}</span>${t_.flightsIncluded?`<span>✈ ${t('inc_yes')}</span>`:''}</div>
    <div class="pr">${priceBlock(t_)}<span class="cta">${t('view')} →</span></div>${Wijha.html('trip.fresh',{trip:t_,variant:'card',hasPrice:!!priceRows(t_)[0]},{quiet:true})}
  </div></a>`;

  }

  function page(ctx, api) {
    var x = X(api), L = x.L(), t = x.t, esc = x.esc, CATS = x.CATS, F = x.F, COS = x.cos(), rows0 = rowsFor(api);
 const subs=F.cat?CATS[F.cat].subs:null;
 return `<div class="wrap">
  <div class="head"><h1>${F.cat?(L==='ar'?CATS[F.cat].ar:CATS[F.cat].en):t('nav_offers')}</h1></div>
  <div class="filters">
   ${['','abroad','umrah','hajj'].map(c=>`<button class="chip ${F.cat===c?'on':''}" data-wb-click="trips-list.go|#/trips${c?'/'+c:''}">${c?(L==='ar'?CATS[c].ar:CATS[c].en):t('all')}</button>`).join('')}${Wijha.html('trips.request-cta',{},{quiet:true})}
   <span class="divider"></span>
   <select data-wb-change="trips-list.co"><option value="">${t('company')}: ${t('all')}</option>${COS.map(c=>`<option value="${c.id}" ${F.co===c.id?'selected':''}>${esc(L==='ar'?c.ar:c.en)}</option>`).join('')}</select>
   <select data-wb-change="trips-list.sort"><option value="asc">${t('sort_low')}</option><option value="desc">${t('sort_high')}</option><option value="soon">${t('sort_soon')}</option></select>
   <input value="${esc(F.q)}" placeholder="${t('search')}" data-wb-input="trips-list.q">
   <span class="count" id="cnt">${countText(api, rows0)}</span>
  </div>
  ${subs?`<div class="filters subrow"><button class="chip sm ${!F.sub?'on':''}" data-wb-click="trips-list.sub|">${t('all')}</button>
   ${Object.entries(subs).map(([k,v])=>`<button class="chip sm" data-wb-click="trips-list.sub|${k}">${L==='ar'?v.ar:v.en}</button>`).join('')}</div>`:''}
  <div class="grid" id="grid">${gridHtml(api, rows0)}</div></div>`;
  }

  /* the filtered + sorted rows for the current filter state F */
  function rowsFor(api) {
    var X_ = X(api), F = X_.F, TRIPS = X_.trips(), co = X_.co, tripName = X_.tripName, soonDays = X_.soonDays, egpOf = X_.egpOf, priceRows = X_.priceRows;
    var norm = function (s) { return String(s || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).toLowerCase(); };
    var rows = TRIPS.filter(function (x) { return (!F.cat || x.cat === F.cat) && (!F.sub || x.sub === F.sub) && (!F.co || x.co === F.co); });
    if (F.q) { var q = norm(F.q); rows = rows.filter(function (x) { return norm(tripName(x, 'ar') + tripName(x, 'en') + x.dest + x.destAr + co(x.co).ar + co(x.co).en).includes(q); }); }
    var first = function (x) { var r = priceRows(x)[0]; return r ? egpOf(x, r[0]) : null; };
    rows.sort(function (a, b) {
      return (!!a.expired - !!b.expired) || (F.sort === 'soon' ? soonDays(a) - soonDays(b)
        : F.sort === 'asc' ? ((first(a) == null ? 9e9 : first(a)) - (first(b) == null ? 9e9 : first(b)))
        : ((first(b) == null ? 0 : first(b)) - (first(a) == null ? 0 : first(a))));
    });
    window.__rowsN = rows.length; return rows;
  }
  function gridHtml(api, rows) {
    return rows.map(function (r) { return Wijha.html('trips.card', { trip: r }, { quiet: true }); }).join('') || '<p class="lead">' + X(api).t('nores') + '</p>';
  }
  function countText(api, rows) { return rows.length + ' ' + X(api).t('results'); }
  function draw(api) {
    var rows = rowsFor(api), g = document.getElementById('grid'), c = document.getElementById('cnt');
    if (g) g.innerHTML = gridHtml(api, rows); if (c) c.textContent = countText(api, rows);
  }

  Wijha.block('trips-list', {
    version: '1.0.0',
    slots: {
      'trips.card': function (ctx, api) { return card(ctx || {}, api); },
      'page.trips': function (ctx, api) { return page(ctx || {}, api); }
    },
    actions: {
      cmp: function (a, el, ev, api) { X(api).toggleCmp(a, ev); },
      go: function (a, el, ev, api) { X(api).go(a); },
      co: function (a, el, ev, api) { X(api).F.co = el.value; draw(api); },
      sort: function (a, el, ev, api) { X(api).F.sort = el.value; draw(api); },
      q: function (a, el, ev, api) { X(api).F.q = el.value; draw(api); X(api).logSearch(); },
      sub: function (a, el, ev, api) { X(api).F.sub = a; draw(api); document.querySelectorAll('.chip.sm').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on'); }
    }
  });
})();
