/* Block: signup  v1.0.0
 * Sign-up pages: traveller account (#/signup) and company account (#/company/signup), including the visa list, IATA fields, registry upload and the
 * "already have an account" box. Validation + submit live here; the session core (signUp, login, profile) stays in the page (api.x.auth).
 * Slots  page.signup-client   page.signup-company   (ctx {})
 * Page extras (api.x.auth): L() t esc COUNTRIES AGE_RANGES VISA_TARGETS signUp apatch apost loadProfile prof() userId() setMe(o) setCo(o) syncNav startPoll go loadCatalogue
 *   slugOf checkRegistry uploadRegistry login(email,pass) rerender()
 * Look: css/forms.css.   Test: node tests/signup-test.js
 * Off / broken: the page shows a short notice with a link to the sign-in drop-down.
 */
(function () {
  var st = { hasVisa: false, visas: [{ country: '', expiry: '' }], iata: false };
  var X = function (api) { return api.x && api.x.auth; };
  var errBox = function (id) { return '<div id="' + id + '"></div>'; };
  var inp = function (id, label, type, ph, val) { return '<label class="fl-lbl">' + label + '<input id="' + id + '" type="' + (type || 'text') + '" placeholder="' + (ph || '') + '" value="' + (val || '') + '"></label>'; };
  var $ = function (id) { return document.getElementById(id); };
  var v = function (id) { var e = $(id); return (e && e.value && e.value.trim()) || ''; };

  function clientView(api) {
    var x = X(api), L = x.L(), t = x.t, esc = x.esc, COUNTRIES = x.COUNTRIES, AGE_RANGES = x.AGE_RANGES, VISA_TARGETS = x.VISA_TARGETS;
    var hasVisa = st.hasVisa, visas = st.visas;
    var opt = function (arr, sel, val, lab) { return arr.map(function (y) { return `<option value="${y[val]}" ${sel === y[val] ? 'selected' : ''}>${L === 'ar' ? y[lab[0]] : y[lab[1]]}</option>`; }).join(''); };
    return `<div class="wrap narrow"><div class="panel">
  <div class="eyebrow">👤 ${L==='ar'?'حساب مسافر':'Traveller account'}</div>
  <h1>${t('su_client')}</h1><p class="lead">${t('su_client_p')}</p>
  <div class="form2">
   ${inp('cName',L==='ar'?'الاسم':'Name','text')}
   ${inp('cEmail',L==='ar'?'البريد الإلكتروني':'Email','email','name@example.com')}
   <label class="fl-lbl">${L==='ar'?'رقم الهاتف':'Phone number'}
     <div style="display:flex;gap:6px">
       <select id="cDial" style="flex:0 0 130px;border:1px solid var(--line);border-radius:10px;padding:10px 8px;background:var(--bg);font-size:13px">
         ${COUNTRIES.map(c=>`<option value="${c[3]}" ${c[0]==='EG'?'selected':''}>${c[3]} ${L==='ar'?c[1]:c[2]}</option>`).join('')}
       </select>
       <input id="cPhone" type="tel" placeholder="1xxxxxxxxx" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--bg);font-size:14px">
     </div></label>
   <label class="fl-lbl">${L==='ar'?'الفئة العمرية':'Age range'}<select id="cAge"><option value="">—</option>${opt(AGE_RANGES,'',0,[1,2])}</select></label>
   <label class="fl-lbl">${L==='ar'?'الجنسية':'Nationality'}<select id="cNat">${opt(COUNTRIES,'EG',0,[1,2])}</select></label>
   <label class="fl-lbl">${L==='ar'?'هل لديك تأشيرة سفر سارية؟':'Do you hold a current travel visa?'}
     <select id="cHasVisa" data-wb-change="signup.hasvisa">
       <option value="no" ${hasVisa?'':'selected'}>${L==='ar'?'لا':'No'}</option>
       <option value="yes" ${hasVisa?'selected':''}>${L==='ar'?'نعم':'Yes'}</option></select></label>
  </div>
  ${hasVisa?`<div class="panel" style="margin:12px 0;padding:14px;background:var(--bg)">
    <h3 style="margin-bottom:8px">${L==='ar'?'التأشيرات السارية':'Current visas'}</h3>
    ${visas.map((v,i)=>`<div class="form2" style="margin-bottom:8px">
      <label class="fl-lbl">${L==='ar'?'الدولة':'Country'}<select data-wb-change="signup.vcountry|${i}">
        <option value="">—</option>${VISA_TARGETS.map(x=>`<option value="${x[0]}" ${v.country===x[0]?'selected':''}>${L==='ar'?x[1]:x[2]}</option>`).join('')}</select></label>
      <label class="fl-lbl">${L==='ar'?'تاريخ انتهاء التأشيرة':'Visa expiry date'}
        <div style="display:flex;gap:6px"><input type="date" value="${esc(v.expiry||'')}" data-wb-change="signup.vexpiry|${i}" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface);font-size:14px">
        ${visas.length>1?`<button class="btn btn-ghost" data-wb-click="signup.vdel|${i}">×</button>`:''}</div></label>
    </div>`).join('')}
    <button class="btn btn-ghost" data-wb-click="signup.vadd">+ ${L==='ar'?'تأشيرة أخرى':'Another visa'}</button>
   </div>`:''}
  <div class="form2">${inp('cPass',L==='ar'?'كلمة المرور':'Password','password','••••••••')}</div>
  <div class="acts"><button class="btn btn-primary" data-wb-click="signup.client">${t('create')}</button></div>${errBox('cErr')}
  <p class="note">${L==='ar'?'بياناتك تُستخدم لترشيح رحلات تناسبك فقط. لا تُشارك مع الشركات إلا عند إرسال استفسار.':'Your details are used only to suggest suitable trips. They are shared with a company only when you send an enquiry.'}</p>
  <div class="sec" style="border-top:1px solid var(--line);margin-top:22px;padding-top:18px"><h3>${t('haveacc')}</h3>
   <div class="form2">${inp('lEmail',t('f_email'),'email')}${inp('lPass',t('f_pass'),'password')}</div>
   <div class="acts"><button class="btn btn-ghost" data-wb-click="signup.login">${L==='ar'?'دخول':'Sign in'}</button></div>${errBox('lErr')}</div>
 </div></div>`;
  }
  function companyView(api) {
    var x = X(api), L = x.L(), t = x.t, iata = st.iata;
    return `<div class="wrap narrow"><div class="panel">
  <div class="eyebrow">🏢 ${L==='ar'?'بوابة الشركات':'Company portal'}</div><h1>${t('su_co')}</h1><p class="lead">${t('su_co_p')}</p>
  <div class="form2">
   ${inp('oName',L==='ar'?'اسم الشركة':'Company name','text')}
   ${inp('oEmail',L==='ar'?'البريد الإلكتروني':'Email','email','name@example.com')}
   ${inp('oPhone',L==='ar'?'رقم الهاتف':'Phone number','tel','01xxxxxxxxx')}
   <label class="fl-lbl">${L==='ar'?'عضوية IATA':'IATA membership'}<select id="oIata" data-wb-change="signup.iata">
     <option value="no" ${iata?'':'selected'}>${L==='ar'?'لا':'No'}</option>
     <option value="yes" ${iata?'selected':''}>${L==='ar'?'نعم':'Yes'}</option></select></label>
   ${iata?inp('oLic',L==='ar'?'رقم الترخيص':'Registration number','text','ETAA-A-0000'):''}
   ${iata?`<label class="fl-lbl">${L==='ar'?'الفئة':'Category'}<select id="oCat"><option value="">—</option>${['أ','ب','ج','د','هـ'].map(x=>`<option>${x}</option>`).join('')}</select></label>`:''}
  </div>
  <label class="fl-lbl">${L==='ar'?'السجل التجاري':'Commercial registry'}<input id="oDoc" type="file" accept="application/pdf,image/*"></label>
  <p class="note">${L==='ar'?'PDF أو صورة حتى ١٠ ميجابايت. يُحفظ في مخزن خاص ولا يظهر للعملاء.':'PDF or image up to 10 MB. Stored privately, never shown to travellers.'}</p>
  ${inp('oPass',L==='ar'?'كلمة مرور الحساب':'Account password','password','••••••••')}
  <div class="acts"><button class="btn btn-primary" data-wb-click="signup.company">${t('create')}</button></div>${errBox('oErr')}
  <p class="note">${L==='ar'?'تُراجع وجهة الطلب وتظهر رحلاتك بعد الاعتماد. تجد حالة الطلب في لوحة الشركة عند تسجيل الدخول.':'Wijha reviews your application; your trips go live once approved. You will see the status on your company dashboard when you sign in.'}</p>
  <div class="sec" style="border-top:1px solid var(--line);margin-top:22px;padding-top:18px"><h3>${t('haveacc')}</h3><div class="form2">${inp('lEmail',t('f_email'),'email')}${inp('lPass',t('f_pass'),'password')}</div><div class="acts"><button class="btn btn-ghost" data-wb-click="signup.login">${L==='ar'?'دخول':'Sign in'}</button></div>${errBox('lErr')}</div>
 </div></div>`;
  }
  function note(id, ar, en, api) { var e = $(id); if (e) e.innerHTML = '<div class="note-box">' + (X(api).L() === 'ar' ? ar : en) + '</div>'; }
  function showErr(id, m, api) { var e = $(id); if (e) e.innerHTML = '<div class="note-box" style="background:var(--red-soft);color:var(--red)">' + X(api).esc(m) + '</div>'; }

  async function submitClient(api) {
    var x = X(api), L = x.L(), E = function (ar, en) { return L === 'ar' ? ar : en; };
    var email = v('cEmail'), pass = v('cPass');
    if (!email || !pass) { showErr('cErr', E('البريد وكلمة المرور مطلوبان.', 'Email and password are required.'), api); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showErr('cErr', E('صيغة البريد الإلكتروني غير صحيحة.', 'The email address looks wrong.'), api); return; }
    if (pass.length < 6) { showErr('cErr', E('كلمة المرور يجب ألا تقل عن ٦ أحرف.', 'The password must be at least 6 characters.'), api); return; }
    var dial = ($('cDial') && $('cDial').value) || '';
    var localNum = v('cPhone').replace(/^0+/, '');
    var hasVisa = ($('cHasVisa') && $('cHasVisa').value) === 'yes';
    var visas = hasVisa ? st.visas.filter(function (y) { return y.country && y.expiry; }) : [];
    try {
      var pdata = { name: v('cName') || null, dial_code: dial || null, phone: localNum ? dial + localNum : null,
        age_range: ($('cAge') && $('cAge').value) || null, nationality: ($('cNat') && $('cNat').value) || null, has_visa: hasVisa, travel_visas: visas };
      /* every profile field travels in the signup metadata, so nothing is lost when email confirmation delays the session */
      var r = await x.signUp(email, pass, { name: v('cName'), phone: dial + localNum, dial_code: dial, age_range: pdata.age_range, nationality: pdata.nationality, has_visa: hasVisa, travel_visas: visas });
      if (!r.session) {
        try { localStorage.setItem('wijha_pending_profile', JSON.stringify({ email: email.toLowerCase(), data: pdata })); } catch (e) {}
        note('cErr', 'تم إنشاء الحساب — افتح بريدك وأكّد الرابط ثم سجّل الدخول.', 'Account created — confirm the link in your email, then sign in.', api); return;
      }
      await x.apatch('profiles?id=eq.' + x.userId(), pdata);
      await x.loadProfile();
      var p = x.prof(); x.setMe({ name: (p && p.name) || email });
      st.visas = [{ country: '', expiry: '' }]; st.hasVisa = false;
      x.syncNav(); x.startPoll(); x.go('#/account');
    } catch (e) { showErr('cErr', e.message, api); }
  }

  async function submitCompany(api) {
    var x = X(api), L = x.L(), E = function (ar, en) { return L === 'ar' ? ar : en; };
    var email = v('oEmail'), pass = v('oPass'), name = v('oName');
    if (!email || !pass || !name) { showErr('oErr', E('اسم الشركة والبريد وكلمة المرور مطلوبة.', 'Company name, email and password are required.'), api); return; }
    try {
      var f = $('oDoc') && $('oDoc').files && $('oDoc').files[0]; x.checkRegistry(f);      /* validate before the account exists */
      var iata = ($('oIata') && $('oIata').value) === 'yes';
      var r = await x.signUp(email, pass, { name: name });
      if (!r.session) {
        try { localStorage.setItem('wijha_pending_co', JSON.stringify({ email: email.toLowerCase(), name: name, phone: v('oPhone'), iata: iata, lic: v('oLic'), cat: ($('oCat') && $('oCat').value) || '' })); } catch (e) {}
        note('oErr', 'أكّد بريدك ثم سجّل الدخول — يكتمل تسجيل الشركة تلقائياً عند أول دخول.', 'Confirm your email, then sign in — the company registration completes automatically on your first sign-in.', api); return;
      }
      var doc = null; if (f) doc = await x.uploadRegistry(f);
      var slug = x.slugOf(name);
      /* the server creates the company as "pending" and links this user; role/status can't be chosen from the browser */
      var cid = await x.apost('rpc/wijha_register_company', { p_name: name, p_slug: slug, p_email: email, p_phone: v('oPhone') || null, p_iata: iata,
        p_license: iata ? (v('oLic') || null) : null, p_category: iata ? (($('oCat') && $('oCat').value) || null) : null, p_registry_path: doc });
      await x.loadProfile(); await x.loadCatalogue();
      x.setCo({ id: cid, name: name, emp: name, role: 'company', verified: false });
      x.syncNav(); x.startPoll(); x.go('#/company');
    } catch (e) { showErr('oErr', e.message, api); }
  }

  Wijha.block('signup', {
    version: '1.0.0',
    slots: {
      'page.signup-client': function (ctx, api) { return clientView(api); },
      'page.signup-company': function (ctx, api) { return companyView(api); }
    },
    actions: {
      hasvisa: function (a, el, ev, api) { st.hasVisa = el.value === 'yes'; X(api).rerender(); },
      vcountry: function (a, el) { var i = Number(a); if (st.visas[i]) st.visas[i].country = el.value; },
      vexpiry: function (a, el) { var i = Number(a); if (st.visas[i]) st.visas[i].expiry = el.value; },
      vdel: function (a, el, ev, api) { st.visas.splice(Number(a), 1); X(api).rerender(); },
      vadd: function (a, el, ev, api) { st.visas.push({ country: '', expiry: '' }); X(api).rerender(); },
      iata: function (a, el, ev, api) { st.iata = el.value === 'yes'; X(api).rerender(); },
      client: function (a, el, ev, api) { return submitClient(api); },
      company: function (a, el, ev, api) { return submitCompany(api); },
      login: async function (a, el, ev, api) { try { await X(api).login(v('lEmail'), v('lPass')); } catch (e) { showErr('lErr', e.message, api); } }
    }
  });
})();
