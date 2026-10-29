/* Block: vault-intake  v1.1.0   (task #16 front-end)
 * "Secure file upload (new)" card: the company makes a one-off upload link, uploads on a separate page/domain,
 * then converts the uploaded files into draft offers here. Sits BESIDE the existing upload; replaces nothing.
 *
 * Slots:  dash.vault     ctx {companyId, staff:false}   company dashboard in index.html (#/company)
 *         intake.vault   ctx {companyId, staff}          "add an offer" screen in admin.html
 * Talks only to the main Supabase through the page's helpers (api.x):
 *   x.bridge(body)      -> Promise<{status, body}>   POST functions/v1/wijha-vault-bridge (never throws; status 0 = no connection)
 *   x.extract(importId) -> Promise<{status, body}>   the EXISTING functions/v1/wijha-extract call of the page
 *   x.review(offerId)   open the created draft in the page's review screen
 *   x.reloadList()      (optional) let the page reload its own import list
 * The upload page itself lives on another domain and is only shown as text (never fetched from here).
 * Failure: a bridge error stays INSIDE the card (message + Retry); the rest of the page is untouched.
 */
(function () {
  const POLL_MS = 15000;
  const byCo = {};                       // company id -> {link, files, loaded, loading, err, linkErr, linkBusy, conv, copied}
  let cur = '', API = null, timer = null, staff = false;
  const st = co => byCo[co] || (byCo[co] = { link: null, files: [], loaded: false, loading: false, err: null, linkErr: null, linkBusy: false, conv: {}, copied: false });
  const S = x => x == null ? '' : String(x);

  /* ── text ── */
  const OFF_MSG = () => API.t('خدمة رفع الملفات الآمنة غير مفعّلة بعد — تواصل مع وجهة', 'The secure file upload service is not enabled yet — contact Wijha');
  function mapErr(res, what) {
    const s = res && res.status, e = S(res && res.body && (res.body.error || res.body.message));
    const t = API.t;
    if (s === 503 && (/vault not configured/i.test(e) || !e)) return { kind: 'off', msg: OFF_MSG() };
    if (s === 0) return { kind: 'net', msg: t('تعذّر الاتصال بالخادم — تحقق من الإنترنت ثم أعد المحاولة', 'Could not reach the server — check your connection and retry') };
    if (s === 401) return { kind: 'auth', msg: t('انتهت جلسة الدخول — سجّل الدخول من جديد', 'Your session expired — please sign in again') };
    if (s === 403) return { kind: 'auth', msg: t('ليس لديك صلاحية لهذا الإجراء، أو لم تُحدَّد الشركة', 'You are not allowed to do this, or no company is selected') };
    if (s === 404) return { kind: 'gone', msg: what === 'extract' ? t('القراءة التلقائية لم تُفعّل بعد — حُفظ الملف وسيراجعه فريق وجهة', 'Automatic reading is not enabled yet — the file is saved and the Wijha team will review it') : t('لم يُعثر على الملف أو انتهت صلاحيته', 'The file was not found or has expired') };
    if (s === 422) return { kind: 'rejected', msg: /flagged|security/i.test(e) ? t('رفض الفحص الأمني هذا الملف — لا يمكن تحويله', 'The security check flagged this file — it cannot be converted') : (e ? e.slice(0, 160) : t('تعذّرت معالجة الملف', 'The file could not be processed')) };
    if (s === 502) return { kind: 'net', msg: t('تعذّر الاتصال بمخزن الملفات الآمن — حاول بعد قليل', 'The secure store is unreachable — try again shortly') };
    return { kind: 'other', msg: t('حدث خطأ غير متوقع — أعد المحاولة', 'Something went wrong — please retry') + (s ? ' (' + s + ')' : '') };
  }
  const IMP = {
    queued: ['بانتظار التحويل', 'Waiting to convert', 'warn'], processing: ['جارٍ القراءة…', 'Reading…', 'warn'], extracted: ['جاهز للمراجعة', 'Ready to review', 'ok'],
    imported: ['تم', 'Done', 'ok'], failed: ['تعذّر', 'Failed', 'bad'], rejected: ['مرفوض', 'Rejected', 'bad']
  };
  const FST = { clean: ['سليم', 'Clean', 'ok'], flagged: ['مرفوض أمنياً', 'Flagged', 'bad'] };
  function chip(map, v) {
    const k = S(v).toLowerCase(), m = map[k];
    if (m) return `<span class="vi-chip ${m[2]}">${API.esc(API.lang === 'ar' ? m[0] : m[1])}</span>`;
    return `<span class="vi-chip">${API.esc(k || '—')}</span>`;
  }
  function size(n) { n = Number(n); if (!isFinite(n) || n < 0) return '—'; return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function when(v) {
    const t = Date.parse(S(v)); if (isNaN(t)) return '—';
    try { return new Date(t).toLocaleString(API.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return new Date(t).toISOString().slice(0, 16).replace('T', ' '); }
  }
  function left(v) {
    const t = Date.parse(S(v)); if (isNaN(t)) return '';
    const h = Math.round((t - Date.now()) / 36e5);
    if (h <= 0) return API.t('انتهت صلاحيته', 'expired');
    return h < 48 ? API.t('بعد ' + h + ' ساعة', 'in ' + h + ' h') : API.t('بعد ' + Math.round(h / 24) + ' أيام', 'in ' + Math.round(h / 24) + ' days');
  }

  /* ── rendering (everything through esc) ── */
  function css() {
    if (document.getElementById('vi-css')) return;
    const s = document.createElement('style'); s.id = 'vi-css';
    s.textContent = `.vi-card{background:var(--surface,#fff);border:1px solid var(--line,#e8e4dc);border-radius:14px;padding:16px;margin:0 0 16px;color:var(--ink,#1b1b1f);min-width:0}
.vi-card h3{margin:0;font-size:16px}.vi-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.vi-new{font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#8a5a00)}
.vi-note{font-size:12.5px;color:var(--muted,#6b6a72);line-height:1.7;margin:6px 0}
.vi-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 14px;border-radius:10px;border:1px solid var(--line,#e8e4dc);background:var(--surface,#fff);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;min-height:38px}
a.vi-btn{text-decoration:none}.vi-btn:disabled{opacity:.5;cursor:default}.vi-btn.pri{background:var(--amber,#e29a1a);border-color:transparent;color:#1b1b1f}.vi-btn.bad{color:var(--red,#c23b3b)}.vi-btn.sm{padding:5px 10px;min-height:32px;font-size:12px}
.vi-link{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.vi-link input{flex:1 1 220px;min-width:0;padding:9px 10px;border:1px solid var(--line,#e8e4dc);border-radius:10px;font:12px/1.4 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;background:var(--bg,#fbfaf7);color:inherit}
.vi-err{background:var(--red-soft,#fdeaea);color:var(--red,#c23b3b);padding:10px 12px;border-radius:10px;font-size:13px;margin:8px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.vi-err.off{background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#8a5a00)}
.vi-list{margin-top:12px;border-top:1px solid var(--line,#e8e4dc)}.vi-row{display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center;padding:10px 0;border-bottom:1px solid var(--line,#e8e4dc)}
.vi-main{flex:1 1 180px;min-width:0}.vi-name{font-weight:700;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;unicode-bidi:plaintext}
.vi-meta{font-size:11.5px;color:var(--muted,#6b6a72);display:flex;gap:6px 10px;flex-wrap:wrap}.vi-meta span{direction:ltr;unicode-bidi:isolate}
.vi-act{display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:100%}
.vi-chip{display:inline-block;font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;background:var(--bg,#fbfaf7);color:var(--muted,#6b6a72);border:1px solid var(--line,#e8e4dc);white-space:nowrap}
.vi-chip.ok{background:var(--green-soft,#e4f5ec);color:var(--green,#1f8a5b);border-color:transparent}.vi-chip.warn{background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#8a5a00);border-color:transparent}.vi-chip.bad{background:var(--red-soft,#fdeaea);color:var(--red,#c23b3b);border-color:transparent}
.vi-prog{font-size:12.5px;color:var(--muted,#6b6a72)}.vi-sub{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:14px}.vi-sub b{font-size:13.5px}
@media(max-width:600px){.vi-card{padding:14px}.vi-act{width:100%}.vi-btn{flex:0 0 auto}}`;
    document.head.appendChild(s);
  }
  function errBox(e, retryAct) {
    if (!e) return '';
    return `<div class="vi-err ${e.kind === 'off' ? 'off' : ''}" role="alert"><span>${API.esc(e.msg)}</span>${e.kind === 'off' ? '' : `<button class="vi-btn sm" data-wb-click="vault-intake.${retryAct}">${API.esc(API.t('إعادة المحاولة', 'Retry'))}</button>`}</div>`;
  }
  function linkPart(s) {
    const t = API.t, esc = API.esc;
    if (s.link) {
      return `<div class="vi-note"><b>${esc(t('ينتهي الرابط', 'Link expires'))}:</b> ${esc(when(s.link.expires_at))} ${esc(left(s.link.expires_at) ? '(' + left(s.link.expires_at) + ')' : '')}</div>
      <div class="vi-link"><input data-vi-url readonly dir="ltr" aria-label="${esc(t('رابط الرفع', 'Upload link'))}" value="${esc(s.link.url)}" onfocus="this.select()">
        <button class="vi-btn pri" data-wb-click="vault-intake.copy">${esc(s.copied ? t('تم النسخ ✓', 'Copied ✓') : t('نسخ', 'Copy'))}</button>
        <button class="vi-btn bad" data-wb-click="vault-intake.revoke" ${s.linkBusy ? 'disabled' : ''}>${esc(t('إلغاء الرابط', 'Revoke'))}</button></div>`;
    }
    return `<button class="vi-btn pri" data-wb-click="vault-intake.issue" ${s.linkBusy ? 'disabled' : ''}>${esc(s.linkBusy ? t('جارٍ الإنشاء…', 'Creating…') : t('إنشاء رابط رفع آمن', 'Create a secure upload link'))}</button>`;
  }
  function convCell(f, s) {
    const t = API.t, esc = API.esc, c = s.conv[f.id];
    if (c) {
      if (c.phase === 'import' || c.phase === 'extract')
        return `<span class="vi-prog" role="status">⏳ ${esc(c.phase === 'import' ? t('جارٍ تجهيز الملف…', 'Preparing the file…') : t('جارٍ قراءة العرض… قد يستغرق دقيقة', 'Reading the offer… this can take a minute'))}</span>`;
      if (c.phase === 'error')
        return `<span class="vi-chip bad">${esc(c.msg)}</span>${c.final ? '' : `<button class="vi-btn sm" data-wb-click="vault-intake.convert|${esc(f.id)}">${esc(t('إعادة المحاولة', 'Retry'))}</button>`}`;
      if (c.phase === 'saved') return `<span class="vi-chip warn">${esc(c.msg)}</span>`;
      if (c.phase === 'done') {
        const list = c.created || [];
        return `<span class="vi-chip ok">${esc(list.length > 1 ? t('تم إنشاء ' + list.length + ' عروض', list.length + ' offers created') : list.length === 1 ? t('تم إنشاء العرض', 'Offer created') : t('تمت القراءة', 'Read'))}</span>` +
          list.map(o => `<button class="vi-btn sm" data-wb-click="vault-intake.review|${esc(o.offer_id)}">${esc(t('راجع: ', 'Review: ') + S(o.title_ar).slice(0, 28))}${o.checks && o.checks.length ? ' (' + Number(o.checks.length) + ' ⚠)' : ''}</button>` +
            (API.x && API.x.previewHref && S(o.offer_id) ? `<a class="vi-btn sm pri" data-vi-preview="${esc(o.offer_id)}" href="${esc(API.x.previewHref(S(o.offer_id)))}" target="_blank" rel="noopener">${esc(t('معاينة كما يراها العميل', 'Preview as the client sees it'))} ↗</a>` : '')).join('');
      }
    }
    if (f.import_id) {
      const k = S(f.import_status).toLowerCase();
      let extra = '';
      if (k === 'queued') extra = `<button class="vi-btn sm" data-wb-click="vault-intake.resume|${esc(f.id)}">${esc(t('تابع التحويل', 'Continue'))}</button>`;
      else if (k === 'extracted' || k === 'imported') extra = `<button class="vi-btn sm" data-wb-click="vault-intake.result|${esc(f.id)}">${esc(t('عرض النتيجة', 'Show result'))}</button>`;
      else if (k === 'failed') extra = `<button class="vi-btn sm pri" data-wb-click="vault-intake.convert|${esc(f.id)}">${esc(t('حوّل إلى عرض', 'Convert to offer'))}</button>`;
      return chip(IMP, k) + extra;
    }
    if (S(f.status).toLowerCase() === 'flagged') return '';
    return `<button class="vi-btn sm pri" data-wb-click="vault-intake.convert|${esc(f.id)}">${esc(t('حوّل إلى عرض', 'Convert to offer'))}</button>`;
  }
  function rows(s) {
    const t = API.t, esc = API.esc;
    if (!s.loaded) return `<p class="vi-note" role="status">${esc(s.loading ? t('جارٍ التحميل…', 'Loading…') : '')}</p>`;
    if (!s.files.length) return `<p class="vi-note">${esc(t('لم يُرفع شيء عبر الرابط بعد.', 'Nothing has been uploaded through the link yet.'))}</p>`;
    return s.files.map(f => `<div class="vi-row" data-vi-file="${esc(f.id)}">
      <div class="vi-main"><div class="vi-name" dir="auto" title="${esc(f.original_name)}">${esc(S(f.original_name) || '—')}</div>
        <div class="vi-meta"><span>${esc(S(f.ext).toUpperCase() || '—')}</span><span>${esc(size(f.size_bytes))}</span><span>${esc(when(f.uploaded_at))}</span></div></div>
      <div class="vi-act">${chip(FST, f.status)}${convCell(f, s)}</div></div>`).join('');
  }
  function body() {
    const t = API.t, esc = API.esc;
    if (!cur) return `<div class="vi-head"><h3>${esc(t('رفع آمن للملفات (جديد)', 'Secure file upload (new)'))}</h3></div><p class="vi-note">${esc(t('اختر الشركة أولاً لإنشاء رابط رفع.', 'Pick a company first to create an upload link.'))}</p>`;
    const s = st(cur), off = (s.err && s.err.kind === 'off') || (s.linkErr && s.linkErr.kind === 'off');
    return `<div class="vi-head"><h3>${esc(t('رفع آمن للملفات (جديد)', 'Secure file upload (new)'))}</h3><span class="vi-new">${esc(t('جديد', 'New'))}</span></div>
      <p class="vi-note">${esc(t('صالح 72 ساعة، حتى 5 ملفات. تُحفظ الملفات في مخزن آمن منفصل وليس في قاعدة بيانات الموقع. ارفع من الرابط ثم حوّل الملف إلى عرض من هنا.', 'Valid for 72 hours, up to 5 files. Files go to a separate secure store, not the website database. Upload through the link, then convert the file to an offer here.'))}</p>
      ${off ? errBox({ kind: 'off', msg: OFF_MSG() }) : `${s.linkErr ? errBox(s.linkErr, 'issue') : ''}${linkPart(s)}
      <div class="vi-sub"><b>${esc(t('الملفات المرفوعة عبر الرابط', 'Files uploaded through the link'))}</b>
        <button class="vi-btn sm" data-wb-click="vault-intake.refresh" ${s.loading ? 'disabled' : ''} aria-label="${esc(t('تحديث', 'Refresh'))}">↻ ${esc(t('تحديث', 'Refresh'))}</button></div>
      ${s.err ? errBox(s.err, 'refresh') : ''}<div class="vi-list" role="list">${rows(s)}</div>`}`;
  }
  function paint() {
    const el = document.querySelector('[data-vi-body]'); if (!el) return;
    try { el.innerHTML = body(); }
    catch (e) {
      try { console.error('[wijha-block:vault-intake] paint failed:', e); } catch (_) {}
      el.innerHTML = `<div class="vi-err" role="alert"><span>${API.esc(API.t('هذا القسم غير متاح مؤقتاً.', 'This section is temporarily unavailable.'))}</span><button class="vi-btn sm" data-wb-click="vault-intake.refresh">${API.esc(API.t('إعادة المحاولة', 'Retry'))}</button></div>`;
    }
  }

  /* ── bridge ── */
  async function call(body) {
    if (!API.x || !API.x.bridge) return { status: 0, body: {} };
    if (staff && cur) body.company_id = cur;            // staff act for the company they picked; for company users the server ignores it
    try { const r = await API.x.bridge(body); return r && typeof r.status === 'number' ? r : { status: 0, body: {} }; } catch (e) { return { status: 0, body: {} }; }
  }
  async function load(silent) {
    if (!cur) return;
    const co = cur, s = st(co); if (s.loading) return;
    s.loading = true; if (!silent) paint();
    const r = await call({ action: 'list' });
    s.loading = false;
    if (r.status === 200 && r.body && Array.isArray(r.body.files)) { s.files = r.body.files.filter(f => f && f.id); s.loaded = true; s.err = null; }
    else if (!silent || !s.loaded) { s.err = mapErr(r, 'list'); s.loaded = true; }
    if (co === cur) paint();
  }
  async function extractFor(f, importId, co) {
    const s = st(co), id = f.id;
    s.conv[id] = { phase: 'extract', importId }; paint();
    let r; try { r = await API.x.extract(importId); } catch (e) { r = { status: 0, body: {} }; }
    if (!r) r = { status: 0, body: {} };
    if (r.status === 200 && r.body && !r.body.error) { s.conv[id] = { phase: 'done', created: Array.isArray(r.body.created) ? r.body.created : [] }; try { API.x.reloadList && API.x.reloadList(); } catch (e) {} }
    else {
      const m = mapErr(r, 'extract');
      s.conv[id] = m.kind === 'gone' ? { phase: 'saved', msg: m.msg, importId } : { phase: 'error', msg: (r.status && r.body && r.body.error && r.status !== 503) ? S(r.body.error).slice(0, 160) : m.msg, importId };
    }
    paint(); load(true);
  }
  function tick() {
    try {
      if (document.visibilityState !== 'visible') return;
      const el = document.querySelector('[data-vi-card]'); if (!el || !el.offsetParent) return;      // card not on screen
      const s = cur && st(cur);
      if (!s || s.loading || (s.err && s.err.kind === 'off') || Object.values(s.conv).some(c => c.phase === 'import' || c.phase === 'extract')) return;
      load(true);
    } catch (e) {}
  }

  Wijha.block('vault-intake', {
    version: '1.1.0',
    init(api) { API = api; css(); if (!timer) timer = setInterval(tick, POLL_MS); },
    expose: {
      companyChanged(co) { cur = S(co); if (API) { paint(); if (cur && !st(cur).loaded) load(); } },
      _tick: () => tick()
    },
    slots: {
      'dash.vault': (ctx, api) => render(ctx, api),
      'intake.vault': (ctx, api) => render(ctx, api)
    },
    actions: {
      issue: async (a, el, ev, api) => {
        const s = st(cur); if (!cur || s.linkBusy) return;
        s.linkBusy = true; s.linkErr = null; paint();
        const r = await call({ action: 'issue_link', max_files: 5, ttl_hours: 72 });
        s.linkBusy = false;
        if (r.status === 200 && r.body && /^https:\/\//.test(S(r.body.url))) { s.link = { url: r.body.url, expires_at: r.body.expires_at, token_id: r.body.token_id }; s.copied = false; }
        else s.linkErr = r.status === 200 ? { kind: 'other', msg: api.t('وصلت استجابة غير مكتملة — أعد المحاولة', 'Incomplete response — please retry') } : mapErr(r, 'issue');
        paint(); if (!s.loaded) load(true);
      },
      copy: async (a, el, ev, api) => {
        const s = st(cur); if (!s.link) return; let ok = false;
        try { await navigator.clipboard.writeText(s.link.url); ok = true; } catch (e) {}
        if (!ok) { try { const i = document.querySelector('[data-vi-url]'); i.select(); ok = document.execCommand('copy'); } catch (e) {} }
        s.copied = ok; api.toast(ok ? api.t('تم نسخ الرابط', 'Link copied') : api.t('تعذّر النسخ — حدّد الرابط وانسخه يدوياً', 'Could not copy — select the link and copy it manually'), !ok);
        paint(); if (ok) setTimeout(() => { s.copied = false; paint(); }, 2500);
      },
      revoke: async (a, el, ev, api) => {
        const s = st(cur); if (!s.link || s.linkBusy) return;
        if (!confirm(api.t('إلغاء الرابط؟ لن يعمل بعد الآن (الملفات المرفوعة تبقى).', 'Revoke this link? It will stop working (files already uploaded stay).'))) return;
        s.linkBusy = true; paint();
        const r = await call({ action: 'revoke_link', token_id: s.link.token_id });
        s.linkBusy = false;
        if (r.status === 200) { s.link = null; s.linkErr = null; api.toast(api.t('أُلغي الرابط', 'Link revoked')); } else s.linkErr = mapErr(r, 'revoke');
        paint();
      },
      refresh: async () => { if (cur) { st(cur).err = null; await load(false); } },
      convert: async (id, el, ev, api) => {
        const co = cur, s = st(co), f = s.files.find(x => x.id === id); if (!f) return;
        const c = s.conv[id]; if (c && (c.phase === 'import' || c.phase === 'extract')) return;
        if (c && c.importId) return extractFor(f, c.importId, co);
        s.conv[id] = { phase: 'import' }; paint();
        const r = await call({ action: 'import', file_id: id });
        if (r.status === 200 && r.body && r.body.import_id) return extractFor(f, r.body.import_id, co);
        const m = mapErr(r, 'import');
        s.conv[id] = { phase: 'error', msg: m.msg, final: m.kind === 'rejected' || m.kind === 'off' || m.kind === 'gone' }; paint();
      },
      resume: async (id) => { const co = cur, s = st(co), f = s.files.find(x => x.id === id); if (f && f.import_id) return extractFor(f, f.import_id, co); },
      result: async (id, el, ev, api) => {
        const co = cur, s = st(co), f = s.files.find(x => x.id === id); if (!f || !f.import_id) return;
        try {
          const rows = await api.get('wijha_imports?select=payload&id=eq.' + encodeURIComponent(f.import_id));
          const created = rows && rows[0] && rows[0].payload && Array.isArray(rows[0].payload.created) ? rows[0].payload.created : [];
          if (!created.length) { api.toast(api.t('لا توجد عروض مرتبطة بهذا الملف بعد', 'No offers linked to this file yet'), true); return; }
          s.conv[id] = { phase: 'done', created }; paint();
        } catch (e) { api.toast(api.t('تعذّر تحميل النتيجة', 'Could not load the result'), true); }
      },
      review: (offerId, el, ev, api) => { if (api.x && api.x.review) api.x.review(offerId); }
    }
  });

  function render(ctx, api) {
    API = api; staff = !!(ctx && ctx.staff);
    if (ctx && ctx.companyId !== undefined) cur = S(ctx.companyId);
    css();
    if (cur) { const s = st(cur); if (!s.loaded && !s.loading) setTimeout(() => load(false), 0); }
    return `<section class="vi-card" data-vi-card aria-label="${api.esc(api.t('رفع آمن للملفات', 'Secure file upload'))}"><div data-vi-body>${body()}</div></section>`;
  }
})();
