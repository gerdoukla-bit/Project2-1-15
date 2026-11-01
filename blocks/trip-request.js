/* Block: trip-request  v1.0.0
 * "Tailored trip request" - a client describes a honeymoon / group / family / company trip; the database routes it to the best 1-2
 * companies (wijha_submit_request); companies answer with a price quote; the client compares and accepts.
 * Slots:   trips.request-cta  ctx {}                 - the button shown beside the three category buttons
 *          page.request       ctx {}                 - the request form (route #/request)
 *          account.requests   ctx {}                 - client: my requests and the quotes received
 *          dash.requests      ctx {}                 - company: incoming requests + quote / decline
 * Data:    only through api.x.tr (adapter given by index.html): authed() signin() currency() coName(id)
 *          mine() quotesFor(ids) submit(p) cancel(id) answer(qid,status) incoming() quote(a) decline(id) openChat(companyId)
 * Privacy: the company never receives the client's name, phone or e-mail with the request (the database function omits them).
 */
(function () {
  var KINDS = [
    ['honeymoon', '💍', 'شهر عسل', 'Honeymoon'],
    ['family', '👨‍👩‍👧', 'رحلة عائلية', 'Family trip'],
    ['group', '👥', 'مجموعة / أصدقاء', 'Group of friends'],
    ['corporate', '🏢', 'شركة / جهة', 'Company / organisation'],
    ['other', '✨', 'أخرى', 'Other']
  ];
  var COUNTRIES = [['EG', 'مصر', 'Egypt'], ['SA', 'السعودية', 'Saudi Arabia'], ['AE', 'الإمارات', 'UAE'], ['KW', 'الكويت', 'Kuwait'], ['QA', 'قطر', 'Qatar'], ['BH', 'البحرين', 'Bahrain'], ['OM', 'عُمان', 'Oman']];
  var CUR = ['EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR'];
  var KIND_AR = {}, KIND_EN = {};
  KINDS.forEach(function (k) { KIND_AR[k[0]] = k[2]; KIND_EN[k[0]] = k[3]; });

  var cache = { mine: null, quotes: {}, inbox: null };

  function S(v) { return v == null ? '' : String(v); }
  function kindName(k, L) { return (L === 'ar' ? KIND_AR[k] : KIND_EN[k]) || S(k); }
  function money(n, c) { var v = Number(n); return (isFinite(v) ? v.toLocaleString('en-US') : '—') + ' ' + S(c); }
  function day(d) { return S(d).slice(0, 10); }
  function stLabel(s, L) {
    var m = { open: ['بانتظار العروض', 'Waiting for quotes'], quoted: ['وصلتك عروض', 'Quotes received'], closed: ['مغلق', 'Closed'], cancelled: ['ملغي', 'Cancelled'] };
    return (m[s] || [s, s])[L === 'ar' ? 0 : 1];
  }
  function tr(api) { return (api.x && api.x.tr) || null; }

  Wijha.block('trip-request', {
    version: '1.0.0',
    slots: {
      /* button beside the category buttons */
      'trips.request-cta': function (ctx, api) {
        var a = api.esc;
        return '<button class="chip tr-cta" data-wb-click="trip-request.start" style="border-color:var(--amber);color:var(--amber-ink);background:var(--amber-soft)">✨ ' +
          a(api.t('اطلب رحلة مخصّصة', 'Request a tailored trip')) + '</button>';
      },

      /* the form */
      'page.request': function (ctx, api) {
        var e = api.esc, L = api.lang, T = tr(api);
        if (!T) return '<div class="wrap narrow"><div class="panel">' + e(api.t('الخدمة غير متاحة الآن', 'Not available right now')) + '</div></div>';
        if (!T.authed()) {
          return '<div class="wrap narrow"><div class="panel" style="text-align:center;padding:34px 18px"><h1>' + e(api.t('اطلب رحلة مخصّصة', 'Request a tailored trip')) + '</h1>' +
            '<p class="lead">' + e(api.t('سجّل الدخول أو أنشئ حساباً مجانياً لإرسال طلبك.', 'Sign in or create a free account to send your request.')) + '</p>' +
            '<div class="acts" style="justify-content:center"><button class="btn btn-primary" data-wb-click="trip-request.signin">' + e(api.t('تسجيل الدخول / حساب جديد', 'Sign in / create account')) + '</button></div></div></div>';
        }
        var cur = S(T.currency && T.currency()) || 'EGP';
        var kinds = KINDS.map(function (k, i) {
          return '<label class="tr-kind"><input type="radio" name="kind" value="' + k[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + k[1] + ' ' + e(L === 'ar' ? k[2] : k[3]) + '</span></label>';
        }).join('');
        var cs = COUNTRIES.map(function (c) { return '<option value="' + c[0] + '">' + e(L === 'ar' ? c[1] : c[2]) + '</option>'; }).join('');
        var cu = CUR.map(function (c) { return '<option' + (c === cur ? ' selected' : '') + '>' + c + '</option>'; }).join('');
        var inp = 'style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14px;background:var(--surface);color:inherit"';
        return '<div class="wrap narrow"><style>.tr-kinds{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 14px}.tr-kind input{position:absolute;opacity:0}' +
          '.tr-kind span{display:inline-block;border:1.5px solid var(--line);border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;cursor:pointer}' +
          '.tr-kind input:checked+span{border-color:var(--amber);background:var(--amber-soft);color:var(--amber-ink)}' +
          '.tr-kind input:focus-visible+span{outline:2px solid var(--amber)}.tr-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}' +
          '.tr-f label{display:block;font-size:12px;font-weight:700;color:var(--muted);margin:10px 0 4px}</style>' +
          '<div class="panel" data-tr-form><h1>✨ ' + e(api.t('اطلب رحلة مخصّصة', 'Request a tailored trip')) + '</h1>' +
          '<p class="lead">' + e(api.t('احكِ لنا عن رحلتك، وسنرسل طلبك إلى أنسب شركة أو اثنتين لتقديم أفضل سعر. بياناتك الشخصية لا تصل للشركة قبل أن تقبل عرضاً.',
            'Tell us about your trip. We send it to the one or two best-suited companies for their best price. Your personal details are not shared until you accept a quote.')) + '</p>' +
          '<div class="tr-kinds" role="radiogroup">' + kinds + '</div><div class="tr-f">' +
          '<label>' + e(api.t('الوجهة', 'Destination')) + '<input name="destination" maxlength="120" placeholder="' + e(api.t('مثال: المالديف، تركيا، أوروبا', 'e.g. Maldives, Turkey, Europe')) + '" ' + inp + '></label>' +
          '<div class="tr-g"><label>' + e(api.t('السفر من (دولة)', 'Departing from')) + '<select name="departure_country" ' + inp + '>' + cs + '</select></label>' +
          '<label>' + e(api.t('مدينة السفر', 'Departure city')) + '<input name="departure_city" maxlength="60" ' + inp + '></label></div>' +
          '<div class="tr-g"><label>' + e(api.t('من تاريخ', 'From')) + '<input name="date_from" type="date" ' + inp + '></label>' +
          '<label>' + e(api.t('إلى تاريخ', 'To')) + '<input name="date_to" type="date" ' + inp + '></label></div>' +
          '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="flexible" checked> ' + e(api.t('مواعيدي مرنة', 'My dates are flexible')) + '</label>' +
          '<div class="tr-g"><label>' + e(api.t('بالغون', 'Adults')) + '<input name="adults" type="number" min="1" max="500" value="2" ' + inp + '></label>' +
          '<label>' + e(api.t('أطفال', 'Children')) + '<input name="children" type="number" min="0" max="500" value="0" ' + inp + '></label>' +
          '<label>' + e(api.t('غرف', 'Rooms')) + '<input name="rooms" type="number" min="1" max="250" ' + inp + '></label></div>' +
          '<div class="tr-g"><label>' + e(api.t('الميزانية من', 'Budget from')) + '<input name="budget_min" type="number" min="0" ' + inp + '></label>' +
          '<label>' + e(api.t('إلى', 'to')) + '<input name="budget_max" type="number" min="0" ' + inp + '></label>' +
          '<label>' + e(api.t('العملة', 'Currency')) + '<select name="currency" ' + inp + '>' + cu + '</select></label></div>' +
          '<label>' + e(api.t('تفاصيل أخرى (الفنادق، الاهتمامات، مناسبة خاصة…)', 'Anything else (hotels, interests, special occasion…)')) + '<textarea name="notes" maxlength="1500" rows="4" ' + inp + '></textarea></label></div>' +
          '<div data-tr-err role="alert" style="color:#b3261e;font-size:13px;min-height:18px;margin-top:8px"></div>' +
          '<div class="acts" style="margin-top:6px"><button class="btn btn-primary" data-wb-click="trip-request.submit">' + e(api.t('إرسال الطلب', 'Send request')) + '</button>' +
          '<a class="btn btn-ghost" href="#/trips">' + e(api.t('إلغاء', 'Cancel')) + '</a></div></div></div>';
      },

      /* client: my requests + quotes */
      'account.requests': function (ctx, api) {
        var T = tr(api); if (!T || !T.authed()) return '';
        var e = api.esc, L = api.lang;
        return T.mine().then(function (rows) {
          cache.mine = rows || [];
          var ids = cache.mine.map(function (r) { return r.id; });
          return (ids.length ? T.quotesFor(ids) : Promise.resolve([])).then(function (qs) {
            qs = qs || []; cache.quotes = {};
            qs.forEach(function (q) { (cache.quotes[q.request_id] = cache.quotes[q.request_id] || []).push(q); });
            var head = '<div class="panel" data-tr-mine><h3>✨ ' + e(api.t('طلباتي المخصّصة', 'My tailored requests')) + ' <span class="pillnum">' + cache.mine.length + '</span></h3>';
            if (!cache.mine.length) {
              return head + '<p class="note">' + e(api.t('لم ترسل طلباً بعد.', 'You have not sent a request yet.')) + '</p><button class="btn btn-primary" data-wb-click="trip-request.start">' + e(api.t('اطلب رحلة مخصّصة', 'Request a tailored trip')) + '</button></div>';
            }
            return head + cache.mine.map(function (r) {
              var list = (cache.quotes[r.id] || []).slice().sort(function (a, b) { return Number(a.total_price) - Number(b.total_price); });
              var best = list.length ? Number(list[0].total_price) : null;
              var quotes = list.map(function (q) {
                var tag = q.status === 'accepted' ? '<span class="tag ok">' + e(api.t('مقبول', 'Accepted')) + '</span>' : q.status === 'declined' ? '<span class="tag">' + e(api.t('مرفوض', 'Declined')) + '</span>' : '';
                var acts = q.status === 'sent' && r.status !== 'cancelled'
                  ? '<div class="acts"><button class="btn btn-primary sm" data-wb-click="trip-request.accept|' + e(q.id) + '">' + e(api.t('قبول والتواصل', 'Accept & chat')) + '</button>' +
                    '<button class="btn btn-ghost sm" data-wb-click="trip-request.reject|' + e(q.id) + '">' + e(api.t('رفض', 'Decline')) + '</button></div>' : '';
                return '<div class="rowitem" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + e(T.coName(q.company_id)) + '</b>' +
                  '<span class="mono"><b>' + e(money(q.total_price, q.currency)) + '</b>' + (Number(q.total_price) === best && list.length > 1 ? ' ⭐' : '') + '</span></div>' +
                  (q.details ? '<small style="white-space:pre-wrap;display:block;margin-top:4px">' + e(q.details) + '</small>' : '') +
                  (q.valid_until ? '<small class="dim">' + e(api.t('صالح حتى ', 'Valid until ')) + e(day(q.valid_until)) + '</small> ' : '') + tag + acts + '</div>';
              }).join('');
              return '<div style="border-top:1px solid var(--line);padding:12px 0"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + e(kindName(r.kind, L)) + ' · ' + e(r.destination) + '</b>' +
                '<span class="tag">' + e(stLabel(r.status, L)) + '</span></div>' +
                '<small class="dim">' + e(day(r.date_from)) + (r.date_to ? ' → ' + e(day(r.date_to)) : '') + ' · ' + e(S(r.adults)) + ' ' + e(api.t('بالغ', 'adults')) + (r.children ? ' + ' + e(S(r.children)) + ' ' + e(api.t('طفل', 'children')) : '') + '</small>' +
                (quotes || '<small class="dim" style="display:block;margin-top:4px">' + e(api.t('لم تصل عروض بعد — نرسل لك إشعاراً عند وصولها.', 'No quotes yet.')) + '</small>') +
                (r.status === 'open' || r.status === 'quoted' ? '<div class="acts" style="margin-top:6px"><button class="btn btn-ghost sm" data-wb-click="trip-request.cancel|' + e(r.id) + '">' + e(api.t('إلغاء الطلب', 'Cancel request')) + '</button></div>' : '') + '</div>';
            }).join('') + '</div>';
          });
        });
      },

      /* company: incoming requests */
      'dash.requests': function (ctx, api) {
        var T = tr(api); if (!T || !T.authed()) return '';
        var e = api.esc, L = api.lang;
        return T.incoming().then(function (rows) {
          cache.inbox = rows || [];
          if (!cache.inbox.length) return '<div class="panel" data-tr-inbox><h3>✨ ' + e(api.t('طلبات رحلات مخصّصة', 'Tailored trip requests')) + ' <span class="pillnum">0</span></h3><p class="note">' + e(api.t('لا توجد طلبات حالياً. تصلك هنا الطلبات المناسبة لوجهاتك.', 'No requests right now. Requests that match your destinations arrive here.')) + '</p></div>';
          var open = cache.inbox.filter(function (r) { return r.target_status === 'sent' || r.target_status === 'viewed'; }).length;
          var inp = 'style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:inherit"';
          return '<div class="panel" data-tr-inbox><h3>✨ ' + e(api.t('طلبات رحلات مخصّصة', 'Tailored trip requests')) + ' <span class="pillnum">' + open + '</span></h3>' +
            '<p class="note">' + e(api.t('لا تظهر بيانات العميل الشخصية قبل قبوله عرضك.', 'The client\'s personal details are hidden until they accept your quote.')) + '</p>' +
            cache.inbox.map(function (r) {
              var done = r.target_status === 'quoted' || r.target_status === 'declined';
              var budget = (r.budget_min || r.budget_max) ? ' · ' + e(api.t('الميزانية ', 'Budget ')) + e(money(r.budget_min || r.budget_max, r.currency)) + (r.budget_max && r.budget_min ? ' – ' + e(S(r.budget_max)) : '') : '';
              return '<div style="border-top:1px solid var(--line);padding:12px 0" data-tr-req="' + e(r.id) + '"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + e(kindName(r.kind, L)) + ' · ' + e(r.destination) + '</b>' +
                '<span class="tag' + (done ? '' : ' warn') + '">' + e(r.target_status === 'quoted' ? api.t('أرسلت عرضاً', 'Quoted') : r.target_status === 'declined' ? api.t('اعتذرت', 'Declined') : api.t('جديد', 'New')) + '</span></div>' +
                '<small class="dim">' + e(S(r.departure_country)) + (r.departure_city ? ' / ' + e(r.departure_city) : '') + ' · ' + e(day(r.date_from)) + (r.date_to ? ' → ' + e(day(r.date_to)) : '') + (r.flexible ? ' (' + e(api.t('مرن', 'flexible')) + ')' : '') +
                ' · ' + e(S(r.adults)) + '+' + e(S(r.children || 0)) + (r.rooms ? ' · ' + e(S(r.rooms)) + ' ' + e(api.t('غرف', 'rooms')) : '') + budget + '</small>' +
                (r.notes ? '<small style="display:block;white-space:pre-wrap;margin-top:4px">' + e(r.notes) + '</small>' : '') +
                (done ? (r.quote_total ? '<small class="mono">' + e(money(r.quote_total, r.currency)) + '</small>' : '') :
                  '<div class="tr-q" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:8px">' +
                  '<input name="total" type="number" min="1" placeholder="' + e(api.t('السعر الإجمالي', 'Total price')) + '" ' + inp + '>' +
                  '<input name="currency" value="' + e(S(r.currency || 'EGP')) + '" maxlength="3" ' + inp + '>' +
                  '<input name="valid" type="date" ' + inp + '>' +
                  '<textarea name="details" rows="2" maxlength="3000" placeholder="' + e(api.t('ما يشمله العرض: الفنادق، الطيران، البرنامج…', 'What the quote includes: hotels, flights, programme…')) + '" style="grid-column:1/-1;' + 'border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--surface);color:inherit"></textarea></div>' +
                  '<div class="acts" style="margin-top:6px"><button class="btn btn-primary sm" data-wb-click="trip-request.sendquote|' + e(r.id) + '">' + e(api.t('إرسال العرض', 'Send quote')) + '</button>' +
                  '<button class="btn btn-ghost sm" data-wb-click="trip-request.decline|' + e(r.id) + '">' + e(api.t('اعتذار', 'Decline')) + '</button></div>') + '</div>';
            }).join('') + '</div>';
        });
      }
    },

    actions: {
      start: function (a, el, ev, api) { api.go('#/request'); },
      signin: function (a, el, ev, api) { var T = tr(api); if (T && T.signin) T.signin(); else api.go('#/signup'); },

      submit: async function (a, el, ev, api) {
        var T = tr(api); var box = el.closest('[data-tr-form]'); if (!T || !box) return;
        var err = box.querySelector('[data-tr-err]'); var q = function (n) { var x = box.querySelector('[name="' + n + '"]'); return x ? x.value : ''; };
        var kind = (box.querySelector('[name="kind"]:checked') || {}).value || 'other';
        var p = {
          kind: kind, destination: q('destination').trim(), departure_country: q('departure_country'), departure_city: q('departure_city').trim(),
          date_from: q('date_from'), date_to: q('date_to'), flexible: !!(box.querySelector('[name="flexible"]') || {}).checked,
          adults: q('adults'), children: q('children'), rooms: q('rooms'), budget_min: q('budget_min'), budget_max: q('budget_max'), currency: q('currency'), notes: q('notes').trim()
        };
        var bad = null;
        if (p.destination.length < 2) bad = api.t('اكتب الوجهة', 'Enter a destination');
        else if (p.date_from && p.date_to && p.date_to < p.date_from) bad = api.t('تاريخ العودة قبل تاريخ السفر', 'The end date is before the start date');
        else if (p.budget_min && p.budget_max && Number(p.budget_max) < Number(p.budget_min)) bad = api.t('الحد الأعلى للميزانية أقل من الأدنى', 'Maximum budget is below the minimum');
        else if (!(Number(p.adults) >= 1)) bad = api.t('عدد البالغين غير صحيح', 'Invalid number of adults');
        if (bad) { if (err) err.textContent = bad; return; }
        if (err) err.textContent = ''; el.disabled = true;
        try { await T.submit(p); cache.mine = null; api.toast(api.t('تم إرسال طلبك — سنوافيك بالعروض', 'Request sent — quotes will appear in your account')); api.go('#/account'); }
        catch (e) {
          el.disabled = false; var m = S(e && e.message);
          if (err) err.textContent = /daily limit/.test(m) ? api.t('وصلت للحد اليومي (٥ طلبات). حاول غداً.', 'Daily limit reached (5 requests). Try tomorrow.') : /sign in/.test(m) ? api.t('سجّل الدخول أولاً', 'Please sign in first') : api.t('تعذّر إرسال الطلب، حاول مرة أخرى', 'Could not send the request, please try again');
        }
      },

      cancel: async function (id, el, ev, api) {
        var T = tr(api); if (!T || !id) return;
        if (typeof confirm === 'function' && !confirm(api.t('إلغاء هذا الطلب؟', 'Cancel this request?'))) return;
        try { await T.cancel(id); api.toast(api.t('تم إلغاء الطلب', 'Request cancelled')); api.refresh(); } catch (e) { api.toast(api.t('تعذّر الإلغاء', 'Could not cancel'), true); }
      },
      accept: async function (qid, el, ev, api) {
        var T = tr(api); if (!T || !qid) return; el.disabled = true;
        try {
          await T.answer(qid, 'accepted');
          var q = null; Object.keys(cache.quotes).forEach(function (k) { (cache.quotes[k] || []).forEach(function (x) { if (x.id === qid) q = x; }); });
          api.toast(api.t('تم قبول العرض', 'Quote accepted'));
          if (q && T.openChat) { try { await T.openChat(q.company_id); return; } catch (e) { /* chat is optional */ } }
          api.refresh();
        } catch (e) { el.disabled = false; api.toast(api.t('تعذّر قبول العرض', 'Could not accept'), true); }
      },
      reject: async function (qid, el, ev, api) {
        var T = tr(api); if (!T || !qid) return; el.disabled = true;
        try { await T.answer(qid, 'declined'); api.refresh(); } catch (e) { el.disabled = false; api.toast(api.t('تعذّر التنفيذ', 'Failed'), true); }
      },

      sendquote: async function (rid, el, ev, api) {
        var T = tr(api); var box = el.closest('[data-tr-req]'); if (!T || !box) return;
        var g = function (n) { var x = box.querySelector('[name="' + n + '"]'); return x ? x.value : ''; };
        var total = Number(g('total')), cur = g('currency').trim().toUpperCase();
        if (!(total > 0)) { api.toast(api.t('اكتب السعر الإجمالي', 'Enter the total price'), true); return; }
        if (!/^[A-Z]{3}$/.test(cur)) { api.toast(api.t('رمز العملة من ٣ أحرف', 'Currency must be a 3-letter code'), true); return; }
        el.disabled = true;
        try { await T.quote({ request: rid, total: total, currency: cur, details: g('details').trim(), valid: g('valid') || null }); api.toast(api.t('أُرسل العرض للعميل', 'Quote sent')); api.refresh(); }
        catch (e) { el.disabled = false; api.toast(api.t('تعذّر إرسال العرض', 'Could not send the quote'), true); }
      },
      decline: async function (rid, el, ev, api) {
        var T = tr(api); if (!T || !rid) return; el.disabled = true;
        try { await T.decline(rid); api.refresh(); } catch (e) { el.disabled = false; api.toast(api.t('تعذّر التنفيذ', 'Failed'), true); }
      }
    }
  });
})();
