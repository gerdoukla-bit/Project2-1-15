/* Block: company-team  v1.0.0
 * Two company roles only: ADMIN (company_admin) and AGENT (company_staff). The admin creates agent accounts, switches them on/off, resets
 * their password, or deletes them. Everything goes through the edge function wijha-team (api.x.team.call(body) -> {status, body}).
 * Slots:   dash.team   ctx {role, companyId?}   (company dashboard on the site, and the company console)
 * Renders nothing for an agent (agents do not manage agents). A temporary password is shown once, with a copy button; it is never stored.
 */
(function () {
  var S = function (x) { return x == null ? '' : String(x); };
  var st = { rows: null, err: null, busy: false, form: false, shown: null, company: null };

  function T(api) { return api.x && api.x.team || null; }
  function errText(api, r) {
    var e = S(r && r.body && r.body.error);
    if (r.status === 409 && /already|registered|exists|duplicate/i.test(e)) return api.t('هذا البريد مسجّل مسبقاً', 'This email is already registered');
    if (r.status === 409 && /limit/.test(e)) return api.t('وصلت للحد الأقصى من الموظفين', 'Agent limit reached');
    if (r.status === 400) return api.t('تحقق من الاسم والبريد', 'Check the name and email');
    if (r.status === 403) return api.t('هذه الصلاحية لمدير الشركة فقط', 'Only the company admin can do this');
    if (r.status === 404) return api.t('هذا الموظف غير تابع لشركتك', 'That agent is not in your company');
    if (r.status === 0) return api.t('تعذّر الاتصال — حاول مرة أخرى', 'Could not connect — try again');
    return api.t('حدث خطأ غير متوقع — أعد المحاولة', 'Something went wrong — please retry') + (r.status ? ' (' + r.status + ')' : '');
  }
  async function load(api, force) {
    var X = T(api); if (!X) return;
    if (st.rows && !force) return;
    var r = await X.call({ action: 'list' });
    if (r.status === 200 && r.body && Array.isArray(r.body.members)) { st.rows = r.body.members; st.err = null; } else { st.err = errText(api, r); if (!st.rows) st.rows = []; }
  }
  function paint(api) { if (api.refresh) api.refresh(); }

  function view(api) {
    var e = api.esc, t = api.t, rows = st.rows || [];
    var agents = rows.filter(function (m) { return m.role === 'company_staff'; });
    var admins = rows.filter(function (m) { return m.role === 'company_admin'; });
    var h = '<div class="panel" data-ct><h3>' + e(t('فريق الشركة', 'Company team')) + ' <span class="pillnum">' + rows.length + '</span></h3>' +
      '<p class="note">' + e(t('دوران فقط: المدير (يدير الفريق والعروض) والموظف (يضيف العروض ويردّ على العملاء).', 'Two roles: Admin (manages the team and offers) and Agent (adds offers and answers clients).')) + '</p>';
    if (st.err) h += '<div class="note-box" role="alert" style="background:var(--red-soft);color:var(--red)">' + e(st.err) + '</div>';
    if (st.shown) {
      h += '<div class="note-box" data-ct-shown style="background:var(--amber-soft);border:1px solid var(--amber)"><b>' + e(t('حساب الموظف جاهز', 'Agent account created')) + '</b><br>' +
        '<span class="mono">' + e(st.shown.email) + '</span><br>' + e(t('كلمة المرور المؤقتة (تظهر مرة واحدة فقط):', 'Temporary password (shown only once):')) + ' <b class="mono" data-ct-pw>' + e(st.shown.pw) + '</b><br>' +
        '<button class="btn btn-ghost sm" data-wb-click="company-team.copy">' + e(t('نسخ', 'Copy')) + '</button> <button class="btn btn-ghost sm" data-wb-click="company-team.hide">' + e(t('تم', 'Done')) + '</button>' +
        '<small style="display:block;margin-top:6px">' + e(t('أرسلها للموظف بطريقة آمنة. يمكنه تغييرها من «نسيت كلمة المرور».', 'Send it to the agent privately. They can change it with "Forgot password".')) + '</small></div>';
    }
    h += admins.map(function (m) { return row(api, m, false); }).join('') + agents.map(function (m) { return row(api, m, true); }).join('');
    if (!agents.length && !st.err) h += '<p class="lead" style="font-size:13px">' + e(t('لا يوجد موظفون بعد.', 'No agents yet.')) + '</p>';
    if (st.form) {
      var inp = 'style="width:100%;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:14px;background:var(--surface);color:inherit;margin-top:6px"';
      h += '<div data-ct-form style="margin-top:10px"><input name="name" maxlength="80" placeholder="' + e(t('اسم الموظف', 'Agent name')) + '" ' + inp + '>' +
        '<input name="email" type="email" placeholder="' + e(t('بريد الموظف', 'Agent email')) + '" ' + inp + '>' +
        '<div class="acts" style="margin-top:8px"><button class="btn btn-primary sm" data-wb-click="company-team.create">' + e(t('إنشاء الحساب', 'Create account')) + '</button>' +
        '<button class="btn btn-ghost sm" data-wb-click="company-team.cancel">' + e(t('إلغاء', 'Cancel')) + '</button></div></div>';
    } else {
      h += '<div class="acts" style="margin-top:10px"><button class="btn btn-primary sm" data-wb-click="company-team.add">+ ' + e(t('إضافة موظف', 'Add an agent')) + '</button></div>';
    }
    return h + '</div>';
  }
  function row(api, m, isAgent) {
    var e = api.esc, t = api.t, off = m.is_active === false;
    return '<div class="rowitem" data-ct-row="' + e(m.id) + '"><div><b>' + e(m.name || m.email || '—') + '</b> <span class="tag sm">' + e(isAgent ? t('موظف', 'Agent') : t('مدير', 'Admin')) + '</span>' +
      '<small class="mono">' + e(m.email || '') + '</small></div>' +
      (isAgent ? '<div class="acts"><span class="tag ' + (off ? 'warn' : 'ok') + '">' + e(off ? t('موقوف', 'Inactive') : t('نشط', 'Active')) + '</span>' +
        '<button class="btn btn-ghost sm" data-wb-click="company-team.toggle|' + e(m.id) + '|' + (off ? '1' : '0') + '">' + e(off ? t('تفعيل', 'Activate') : t('إيقاف', 'Deactivate')) + '</button>' +
        '<button class="btn btn-ghost sm" data-wb-click="company-team.reset|' + e(m.id) + '">' + e(t('كلمة مرور جديدة', 'New password')) + '</button>' +
        '<button class="btn btn-ghost sm" data-wb-click="company-team.del|' + e(m.id) + '">' + e(t('حذف', 'Delete')) + '</button></div>' : '') + '</div>';
  }

  Wijha.block('company-team', {
    version: '1.0.0',
    slots: {
      'dash.team': function (ctx, api) {
        if (!T(api) || (ctx && ctx.role && ctx.role !== 'company_admin' && ctx.role !== 'company' && ctx.role !== 'admin' && ctx.role !== 'wijha_admin')) return '';
        st.company = ctx && ctx.companyId || null;
        return load(api, false).then(function () { return view(api); });
      }
    },
    actions: {
      add: function (a, el, ev, api) { st.form = true; paint(api); },
      cancel: function (a, el, ev, api) { st.form = false; paint(api); },
      hide: function (a, el, ev, api) { st.shown = null; paint(api); },
      copy: function (a, el, ev, api) {
        var pw = S(st.shown && st.shown.pw); if (!pw) return;
        try { navigator.clipboard.writeText(pw).then(function () { api.toast(api.t('تم النسخ', 'Copied')); }); } catch (e) { api.toast(pw); }
      },
      create: async function (a, el, ev, api) {
        var box = el.closest('[data-ct-form]'); if (!box || st.busy) return;
        var name = S(box.querySelector('[name=name]').value).trim(), email = S(box.querySelector('[name=email]').value).trim();
        if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) { api.toast(api.t('اكتب الاسم وبريداً صحيحاً', 'Enter a name and a valid email'), true); return; }
        st.busy = true; el.disabled = true;
        var body = { action: 'create_agent', name: name, email: email }; if (st.company) body.company_id = st.company;
        var r = await T(api).call(body); st.busy = false;
        if (r.status === 200 && r.body && r.body.ok) { st.form = false; st.shown = { email: r.body.email, pw: r.body.temp_password }; st.rows = null; await load(api, true); paint(api); }
        else { el.disabled = false; api.toast(errText(api, r), true); }
      },
      toggle: async function (a, el, ev, api) {
        var p = S(a).split('|'); var r = await T(api).call({ action: 'set_active', profile_id: p[0], active: p[1] === '1', company_id: st.company || undefined });
        if (r.status === 200) { await load(api, true); paint(api); } else api.toast(errText(api, r), true);
      },
      reset: async function (a, el, ev, api) {
        var id = S(a); if (typeof confirm === 'function' && !confirm(api.t('إنشاء كلمة مرور جديدة لهذا الموظف؟', 'Create a new password for this agent?'))) return;
        var r = await T(api).call({ action: 'reset_password', profile_id: id, company_id: st.company || undefined });
        if (r.status === 200 && r.body.ok) { var m = (st.rows || []).filter(function (x) { return x.id === id; })[0]; st.shown = { email: m && m.email || '', pw: r.body.temp_password }; paint(api); } else api.toast(errText(api, r), true);
      },
      del: async function (a, el, ev, api) {
        var id = S(a); if (typeof confirm === 'function' && !confirm(api.t('حذف هذا الموظف نهائياً؟ سيفقد الدخول فوراً.', 'Delete this agent for good? They lose access immediately.'))) return;
        var r = await T(api).call({ action: 'delete_agent', profile_id: id, company_id: st.company || undefined });
        if (r.status === 200) { api.toast(api.t('تم الحذف', 'Deleted')); await load(api, true); paint(api); } else api.toast(errText(api, r), true);
      }
    },
    expose: { reset: function () { st = { rows: null, err: null, busy: false, form: false, shown: null, company: null }; } }
  });
})();
