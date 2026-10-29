/* Block: chat  v1.0.0
 * ONE inbox ("Messages / المحادثات") for clients and companies: a Messenger-style floating button + docked panel
 * (conversation list -> thread -> composer). Replaces the separate "my enquiries" and "my chats" lists.
 *
 * The block owns only the widget. Every piece of data comes through the page adapter  api.x.chat  (index.html):
 *   me()                  -> {id, role:'client'|'company'} | null        (null = signed out / admin: no button)
 *   list()                -> Promise<thread rows>                        (wijha_threads, newest first)
 *   who(th) sub(th) tripId(th) unread(th) lastFrom(th)                   (display helpers, current language)
 *   offer(offerId)        -> {who, sub, tripId}                          (header of a thread that does not exist yet)
 *   messages(threadId)    -> Promise<rows>                               (wijha_messages, oldest first)
 *   send(threadId, body)  -> Promise<row>                                (row.blocked = contact details were blocked)
 *   ensure(offerId)       -> Promise<threadId>                           (find or create the client<->company thread)
 *   markRead(threadId)    -> Promise                                     (RPC wijha_mark_read)
 *   warn()                -> the contact-details blocking message
 *   signIn()              -> sends the visitor to the sign-in page
 *   showFab()             -> optional: false hides the floating button (demo mode without a login)
 *
 * Behaviour: a thread for an offer is only created when the first message is sent. Sending is optimistic; a failed
 * message stays in the thread with "Retry" / "Remove". Polling: every 10 s only while the panel is open, every 45 s
 * for the badge while it is closed, never while the tab is hidden. All text is escaped.
 * Button side: the END side of the screen (left in Arabic / right in English), lifted above the cookie notice,
 * the compare bar and the mobile price bar when those are on screen.
 * Expose (Wijha.use('chat')): open(threadId), openOffer(offerId), close(), sync(), relang(), unread(), state()
 */
(function () {
  'use strict';
  var OPEN_MS = 10000, BADGE_MS = 45000, MAXLEN = 2000;
  var api = null, H = null, root = null, fab = null, panel = null, timer = null, seq = 0, mq = null;
  var S = { open: false, view: 'list', threads: null, tErr: null, tLoading: false, cur: null, msgs: {}, mErr: null, mLoading: false,
            pending: {}, drafts: {}, unread: 0, busy: false, incoming: {} };

  function esc(s) { return api.esc(s); }
  function t(ar, en) { return api.t(ar, en); }
  function me() { try { return H && H.me ? H.me() : null; } catch (e) { return null; } }
  function mobile() { return !!(mq && mq.matches); }
  function isNew(k) { return typeof k === 'string' && k.indexOf('new:') === 0; }
  function initial(s) { var a = Array.from(String(s || '').trim()); return a.length ? a[0] : '?'; }
  function arr(x) { return Array.isArray(x) ? x : []; }

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.8L3 21l1.9-5.1A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>'
  };

  var CSS = '' +
    '.wc-fab{position:fixed;inset-inline-end:16px;bottom:calc(16px + var(--wc-b,0px));z-index:105;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--amber,#e0961d);color:#1b1b1f;border:0;box-shadow:0 10px 26px -8px rgba(0,0,0,.45);cursor:pointer;font:inherit}' +
    '.wc-fab:hover{filter:brightness(.95)} .wc-fab:focus-visible,.wc-panel button:focus-visible,.wc-panel textarea:focus-visible,.wc-panel a:focus-visible{outline:2px solid var(--ink,#1b1b1f);outline-offset:2px}' +
    '.wc-fab[hidden],.wc-panel[hidden]{display:none!important}' +
    '.wc-badge{position:absolute;top:-4px;inset-inline-end:-4px;min-width:21px;height:21px;padding:0 6px;border-radius:11px;background:var(--red,#c23b3b);color:#fff;font:800 12px/21px var(--sans,system-ui);text-align:center;box-shadow:0 0 0 2px var(--bg,#fff)}' +
    '.wc-panel{position:fixed;inset-inline-end:16px;bottom:calc(84px + var(--wc-b,0px));z-index:125;width:360px;max-width:calc(100vw - 24px);height:min(520px,calc(100vh - 110px - var(--wc-b,0px)));display:flex;flex-direction:column;background:var(--surface,#fff);color:var(--ink,#1b1b1f);border:1px solid var(--line,#e8e4dc);border-radius:16px;box-shadow:0 24px 60px -16px rgba(0,0,0,.45);overflow:hidden;font-size:14px}' +
    '.wc-head{display:flex;align-items:center;gap:10px;padding:12px 12px;background:var(--dark,#1f1e22);color:#fff;flex:none;min-height:56px}' +
    '.wc-head b{display:block;font-size:14.5px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .wc-head small{display:block;font-size:12px;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.wc-head .wc-ti{flex:1;min-width:0}' +
    '.wc-ib{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#fff;border:0;cursor:pointer}' +
    '.wc-ib:hover{background:rgba(255,255,255,.22)} [dir=rtl] .wc-back svg{transform:scaleX(-1)}' +
    '.wc-av{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#8a5a05);font-weight:800}' +
    '.wc-tl{flex:none;color:#fff;font-size:12px;text-decoration:underline;opacity:.9}' +
    '.wc-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;background:var(--bg,#fbfaf7)}' +
    '.wc-list{list-style:none;margin:0;padding:0} .wc-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:0;border-bottom:1px solid var(--line,#e8e4dc);background:var(--surface,#fff);text-align:start;cursor:pointer;color:inherit;font:inherit}' +
    '.wc-row:hover{background:var(--bg,#fbfaf7)} .wc-row .wc-tx{flex:1;min-width:0} .wc-row b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.wc-row small{display:block;font-size:12px;color:var(--muted,#6b6a72);overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .wc-row.un b{font-weight:800}' +
    '.wc-pill{flex:none;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--amber,#e0961d);color:#1b1b1f;font:800 12px/22px var(--sans,system-ui);text-align:center}' +
    '.wc-empty,.wc-state{padding:28px 20px;text-align:center;color:var(--muted,#6b6a72);line-height:1.8}' +
    '.wc-err{margin:14px;padding:12px 14px;border-radius:12px;background:var(--red-soft,#fdeaea);color:var(--red,#c23b3b);font-weight:700;font-size:13px}' +
    '.wc-btn{display:inline-block;margin-top:10px;padding:9px 18px;border-radius:12px;border:0;background:var(--amber,#e0961d);color:#1b1b1f;font:inherit;font-weight:800;cursor:pointer}' +
    '.wc-btn.ghost{background:transparent;border:1px solid var(--line,#e8e4dc);margin-inline-start:6px}' +
    '.wc-msgs{display:flex;flex-direction:column;gap:8px;padding:14px}' +
    '.wc-msg{max-width:80%;padding:8px 12px;border-radius:14px;font-size:13.5px;line-height:1.6;word-break:break-word;overflow-wrap:anywhere}' +
    '.wc-msg p{margin:0;white-space:pre-wrap} .wc-msg time{display:block;margin-top:2px;font-size:10.5px;color:var(--dim,#95939c);font-family:var(--mono,monospace)}' +
    '.wc-msg.them{align-self:flex-start;background:var(--surface,#fff);border:1px solid var(--line,#e8e4dc);border-start-start-radius:4px}' +
    '.wc-msg.me{align-self:flex-end;background:var(--amber-soft,#fff4dd);border-start-end-radius:4px}' +
    '.wc-msg.sending{opacity:.6} .wc-msg.failed{background:var(--red-soft,#fdeaea);border:1px solid var(--red,#c23b3b)}' +
    '.wc-msg.blocked p{opacity:.55;text-decoration:line-through;text-decoration-color:var(--red,#c23b3b)}' +
    '.wc-sys{align-self:center;max-width:90%;text-align:center;background:var(--red-soft,#fdeaea);color:var(--red,#c23b3b);font-size:12px;font-weight:700;padding:6px 12px;border-radius:10px}' +
    '.wc-fail{margin-top:4px;font-size:12px;color:var(--red,#c23b3b);font-weight:700} .wc-fail button{border:0;background:none;color:inherit;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer;padding:0 6px}' +
    '.wc-foot{flex:none;border-top:1px solid var(--line,#e8e4dc);background:var(--surface,#fff);padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px))}' +
    '.wc-form{display:flex;gap:8px;align-items:flex-end}' +
    '.wc-form textarea{flex:1;resize:none;border:1px solid var(--line,#e8e4dc);border-radius:12px;padding:9px 12px;font:inherit;font-size:14px;line-height:1.5;background:var(--bg,#fbfaf7);color:inherit;max-height:110px;min-height:40px}' +
    '.wc-send{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:var(--amber,#e0961d);color:#1b1b1f;display:grid;place-items:center;cursor:pointer} [dir=rtl] .wc-send svg{transform:scaleX(-1)}' +
    '.wc-note{margin:6px 2px 0;font-size:11px;color:var(--dim,#95939c);line-height:1.5}' +
    '@media(max-width:600px){.wc-panel{inset:0;width:auto;max-width:none;height:100%;height:100dvh;border-radius:0;border:0;z-index:130}.wc-msg{max-width:86%}.wc-form textarea{font-size:16px}}';

  /* ───────── time ───────── */
  function fmt(v, short) {
    if (!v) return '';
    var d = new Date(v); if (isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 16);
    var loc = api.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', now = new Date();
    var same = d.toDateString() === now.toDateString();
    try {
      var hm = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
      if (same) return hm;
      var dm = d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
      return short ? dm : dm + ' ' + hm;
    } catch (e) { return d.toISOString().slice(0, 16).replace('T', ' '); }
  }

  /* ───────── data ───────── */
  function recount() {
    var n = 0; arr(S.threads).forEach(function (th) { n += un(th); });
    S.unread = n;
  }
  function un(th) { if (!th || th._wcRead) return 0; try { return Number(H.unread(th)) || 0; } catch (e) { return 0; } }
  function row(id) { return arr(S.threads).filter(function (x) { return String(x.id) === String(id); })[0] || null; }

  async function loadThreads(quiet) {
    if (!me()) { S.threads = []; recount(); return; }
    if (!quiet) { S.tLoading = true; S.tErr = null; if (S.open && S.view === 'list') renderBody(); }
    try { S.threads = arr(await H.list()); S.tErr = null; }
    catch (e) { if (!quiet || S.threads == null) { S.tErr = (e && e.message) || 'error'; if (S.threads == null) S.threads = null; } }
    S.tLoading = false; recount(); renderFab();
    if (S.open) { if (S.view === 'list') renderBody(); else if (S.view === 'thread') renderHead(); }
  }

  function serverMsgs(k) { return arr(S.msgs[k]); }
  function allMsgs(k) { return serverMsgs(k).concat(arr(S.pending[k])); }
  function hasSending(k) { return arr(S.pending[k]).some(function (m) { return m.state === 'sending'; }); }
  function incomingCount(k) { var r = me() && me().role; return serverMsgs(k).filter(function (m) { return m.sender_role !== r && m.sender_role !== 'system'; }).length; }

  async function loadMsgs(k, o) {
    o = o || {}; if (isNew(k)) return;
    if (!o.quiet) { S.mLoading = true; S.mErr = null; renderBody(); }
    var ok = false, before = incomingCount(k);
    try { S.msgs[k] = arr(await H.messages(k)); S.mErr = null; ok = true; }
    catch (e) { if (!o.quiet) S.mErr = (e && e.message) || 'error'; }
    S.mLoading = false;
    if (S.cur === k) renderBody(o.stick);
    if (ok && S.open && S.cur === k && S.view === 'thread') {
      var th = row(k), pu = th ? un(th) : 0;
      if (!o.quiet || pu > 0 || incomingCount(k) > before) {
        try { await H.markRead(k); if (th) th._wcRead = true; recount(); renderFab(); if (S.view === 'list') renderBody(); } catch (e) { api.log('mark_read failed', e && e.message); }
      }
    }
  }

  async function tick() {
    if (!me()) return;
    try { if (document.visibilityState === 'hidden') return; } catch (e) {}
    if (S.busy) return; S.busy = true;
    try {
      if (S.open && S.view === 'thread' && S.cur && !isNew(S.cur) && !hasSending(S.cur)) await loadMsgs(S.cur, { quiet: true });
      await loadThreads(true);
    } catch (e) {} finally { S.busy = false; }
  }
  function schedule() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!me()) return;
    timer = setInterval(tick, S.open ? OPEN_MS : BADGE_MS);
  }

  /* ───────── actions on the widget ───────── */
  function show(open) { S.open = !!open; panel.hidden = !S.open; schedule(); if (S.open) renderAll(); else renderFab(); place(); }

  async function openList() {
    S.view = 'list'; S.cur = null; show(true);
    if (me()) await loadThreads(false);
  }
  async function openThread(id) {
    id = String(id);
    S.cur = id; S.view = me() ? 'thread' : 'prompt'; show(true);
    if (!me()) return;
    if (S.threads == null) await loadThreads(false);
    if (S.cur !== id) return;
    if (!row(id) && !isNew(id)) { await loadThreads(true); }
    if (!row(id) && !isNew(id)) { S.view = 'list'; S.cur = null; renderAll(); return; }
    renderHead();
    await loadMsgs(id, { stick: true });
    var ta = $('#wcIn'); if (ta && !mobile()) { try { ta.focus(); } catch (e) {} }
  }
  async function openOffer(offerId) {
    offerId = String(offerId == null ? '' : offerId); if (!offerId) return openList();
    if (!me()) { S.view = 'prompt'; S.cur = null; show(true); return; }
    S.view = 'thread'; S.cur = 'new:' + offerId; show(true);
    if (S.threads == null) await loadThreads(false);
    var ex = arr(S.threads).filter(function (x) { return String(x.offer_id) === offerId; })[0];
    if (ex) return openThread(ex.id);
    if (S.cur === 'new:' + offerId) { renderAll(); var ta = $('#wcIn'); if (ta && !mobile()) { try { ta.focus(); } catch (e) {} } }
  }
  function close() { S.open = false; show(false); try { fab && fab.focus && !fab.hidden && fab.focus({ preventScroll: true }); } catch (e) {} }

  async function deliver(m, key) {
    m.state = 'sending'; if (S.cur === key || S.view === 'thread') renderBody(true);
    var k = key;
    try {
      var id = k;
      if (isNew(k)) {
        id = await H.ensure(k.slice(4));
        if (!id) throw new Error('no thread');
        S.pending[id] = arr(S.pending[id]).concat(arr(S.pending[k])); delete S.pending[k];
        if (S.drafts[k] != null) { S.drafts[id] = S.drafts[k]; delete S.drafts[k]; }
        if (S.cur === k) S.cur = id; k = id;
      }
      var r = await H.send(id, m.body);
      S.pending[k] = arr(S.pending[k]).filter(function (x) { return x !== m; });
      if (r && typeof r === 'object') { r.sender_role = r.sender_role || m.sender_role; if (r.body == null) r.body = m.body; S.msgs[k] = serverMsgs(k).concat([r]); }
      if (r && r.blocked) api.toast(H.warn(), true);
      if (S.cur === k) renderBody(true);
      loadThreads(true);
    } catch (e) {
      m.state = 'failed'; m.err = (e && e.message) || 'error';
      if (S.cur === k || S.cur === id) renderBody(true);
    }
  }
  function curKey() { return S.cur; }
  function send() {
    var ta = $('#wcIn'), k = curKey(); if (!ta || !k || !me()) return;
    var body = ta.value.trim(); if (!body) return;
    if (body.length > MAXLEN) body = body.slice(0, MAXLEN);
    ta.value = ''; ta.style.height = ''; delete S.drafts[k];
    var m = { tmp: 't' + (++seq), sender_role: me().role, body: body, created_at: new Date().toISOString(), state: 'sending' };
    S.pending[k] = arr(S.pending[k]).concat([m]);
    renderBody(true); deliver(m, k);
  }
  function findPending(tmp) {
    var out = null;
    Object.keys(S.pending).forEach(function (k) { arr(S.pending[k]).forEach(function (m) { if (m.tmp === tmp) out = { m: m, k: k }; }); });
    return out;
  }

  /* ───────── rendering ───────── */
  function $(s) { return panel ? panel.querySelector(s) : null; }

  function renderFab() {
    if (!fab) return;
    var m = me(), show_ = !!m && !(S.open && mobile());
    try { if (H.showFab && !H.showFab()) show_ = false; } catch (e) {}
    fab.hidden = !show_;
    var label = t('المحادثات', 'Messages') + (S.unread ? ' (' + S.unread + ')' : '');
    fab.setAttribute('aria-label', label); fab.setAttribute('title', t('المحادثات', 'Messages'));
    fab.setAttribute('aria-expanded', S.open ? 'true' : 'false');
    fab.innerHTML = ICON.chat + (S.unread > 0 ? '<span class="wc-badge" data-wc="badge">' + (S.unread > 99 ? '99+' : S.unread) + '</span>' : '');
  }

  function headInfo() {
    var k = S.cur, th = k && !isNew(k) ? row(k) : null, info = { who: '', sub: '', trip: '' };
    try {
      if (th) { info.who = H.who(th); info.sub = H.sub(th); info.trip = H.tripId(th) || ''; }
      else if (isNew(k)) { var o = H.offer(k.slice(4)) || {}; info.who = o.who || ''; info.sub = o.sub || ''; info.trip = o.tripId || ''; }
    } catch (e) {}
    return info;
  }
  function renderHead() {
    var h = $('#wcHead'); if (!h) return;
    var close_ = '<button class="wc-ib" data-wb-click="chat.close" aria-label="' + esc(t('إغلاق', 'Close')) + '">' + ICON.x + '</button>';
    if (S.view === 'thread') {
      var i = headInfo();
      h.innerHTML = '<button class="wc-ib wc-back" data-wb-click="chat.back" aria-label="' + esc(t('رجوع', 'Back')) + '">' + ICON.back + '</button>' +
        '<span class="wc-av" aria-hidden="true">' + esc(initial(i.who)) + '</span>' +
        '<div class="wc-ti"><b>' + esc(i.who || '—') + '</b><small>' + esc(i.sub || '') + '</small></div>' +
        (i.trip ? '<a class="wc-tl" href="#/trip/' + encodeURIComponent(i.trip) + '" data-wc-trip>' + esc(t('الرحلة', 'Trip')) + '</a>' : '') + close_;
    } else {
      h.innerHTML = '<div class="wc-ti"><b>' + esc(t('المحادثات', 'Messages')) + '</b></div>' + close_;
    }
  }

  function listHtml() {
    if (S.tLoading && S.threads == null) return '<div class="wc-state" role="status">' + esc(t('جارٍ التحميل…', 'Loading…')) + '</div>';
    if (S.tErr && !arr(S.threads).length) return '<div class="wc-err" role="alert">' + esc(t('تعذّر تحميل المحادثات.', 'Could not load your messages.')) + ' <button class="wc-btn ghost" data-wb-click="chat.reload">' + esc(t('إعادة المحاولة', 'Retry')) + '</button></div>';
    var ths = arr(S.threads);
    if (!ths.length) return '<div class="wc-empty">' + esc(t('لا محادثات بعد. افتح أي رحلة واضغط «محادثة مع الشركة» لتبدأ.', 'No messages yet. Open any trip and press "Chat with the company" to start.')) + '</div>';
    var role = me() && me().role;
    return '<ul class="wc-list">' + ths.map(function (th) {
      var who = '', sub = '', n = un(th), from = '';
      try { who = H.who(th); sub = H.sub(th); from = H.lastFrom ? H.lastFrom(th) : (th.last_message_from || ''); } catch (e) {}
      var st = !from ? '' : (from === role ? t('بانتظار الرد', 'Awaiting reply') : t('رسالة جديدة', 'New message'));
      var when = fmt(th.last_message_at, true);
      return '<li><button class="wc-row' + (n ? ' un' : '') + '" data-wb-click="chat.thread|' + esc(th.id) + '"><span class="wc-av" aria-hidden="true">' + esc(initial(who)) + '</span>' +
        '<span class="wc-tx"><b>' + esc(who || '—') + '</b><small>' + esc(sub || '—') + '</small><small>' + esc([st, when].filter(Boolean).join(' · ')) + '</small></span>' +
        (n ? '<span class="wc-pill">' + esc(n) + '</span>' : '') + '</button></li>';
    }).join('') + '</ul>';
  }

  function msgsHtml() {
    var k = S.cur, role = me() && me().role;
    if (S.mLoading && !serverMsgs(k).length && !arr(S.pending[k]).length) return '<div class="wc-state" role="status">' + esc(t('جارٍ التحميل…', 'Loading…')) + '</div>';
    if (S.mErr && !serverMsgs(k).length) return '<div class="wc-err" role="alert">' + esc(t('تعذّر تحميل الرسائل.', 'Could not load the messages.')) + ' <button class="wc-btn ghost" data-wb-click="chat.reloadMsgs">' + esc(t('إعادة المحاولة', 'Retry')) + '</button></div>';
    var list = allMsgs(k);
    if (!list.length) return '<div class="wc-empty">' + esc(isNew(k) ? t('اكتب رسالتك الأولى، وستصل إلى الجهة المنظّمة داخل المنصة.', 'Write your first message. It reaches the organiser inside the platform.') : t('ابدأ المحادثة', 'Start the conversation')) + '</div>';
    var out = '';
    list.forEach(function (m, i) {
      if (m.sender_role === 'system') { out += '<div class="wc-sys">' + esc(m.body) + '</div>'; return; }
      var mine = m.sender_role === role, st = m.state || '';
      var id = m.id != null ? m.id : m.tmp;
      var time = st === 'sending' ? '…' : (m.created_at ? fmt(m.created_at) : (m.time || ''));
      out += '<div class="wc-msg ' + (mine ? 'me' : 'them') + (m.blocked ? ' blocked' : '') + (st ? ' ' + st : '') + '" data-mid="' + esc(id) + '"><p dir="auto">' + esc(m.body) + '</p>' +
        (st === 'failed' ? '<div class="wc-fail" role="alert">' + esc(t('لم تُرسل', 'Not sent')) + '<button data-wb-click="chat.retry|' + esc(m.tmp) + '">' + esc(t('إعادة المحاولة', 'Retry')) + '</button><button data-wb-click="chat.drop|' + esc(m.tmp) + '">' + esc(t('حذف', 'Remove')) + '</button></div>'
          : '<time>' + (m.sender_role === 'admin' ? 'Wijha · ' : '') + esc(time) + '</time>') + '</div>';
      var nx = list[i + 1];
      if (m.blocked && mine && !(nx && nx.sender_role === 'system')) out += '<div class="wc-sys">' + esc(H.warn()) + '</div>';
    });
    return '<div class="wc-msgs" role="log" aria-live="polite">' + out + '</div>';
  }

  function promptHtml() {
    return '<div class="wc-empty"><p>' + esc(t('سجّل الدخول لتبدأ محادثة مع الجهة المنظّمة داخل وجهة.', 'Sign in to start a conversation with the organiser on Wijha.')) + '</p>' +
      '<button class="wc-btn" data-wb-click="chat.signin">' + esc(t('تسجيل الدخول', 'Sign in')) + '</button></div>';
  }

  function renderBody(stick) {
    var b = $('#wcBody'); if (!b) return;
    if (S.view === 'prompt') { b.innerHTML = promptHtml(); return; }
    if (S.view === 'list') { b.innerHTML = listHtml(); return; }
    var near = b.scrollHeight - b.scrollTop - b.clientHeight < 90, first = !b.firstChild || !b.querySelector('.wc-msgs');
    b.innerHTML = msgsHtml();
    if (stick || near || first) b.scrollTop = b.scrollHeight;
  }

  function renderFoot() {
    var f = $('#wcFoot'); if (!f) return;
    if (S.view !== 'thread') { f.innerHTML = ''; f.hidden = true; return; }
    f.hidden = false;
    f.innerHTML = '<div class="wc-form"><textarea id="wcIn" rows="1" maxlength="' + MAXLEN + '" placeholder="' + esc(t('اكتب رسالتك…', 'Write a message…')) + '" aria-label="' + esc(t('رسالة', 'Message')) + '"></textarea>' +
      '<button class="wc-send" data-wb-click="chat.send" aria-label="' + esc(t('إرسال', 'Send')) + '">' + ICON.send + '</button></div>' +
      '<p class="wc-note">' + esc(t('المحادثة مؤرشفة. تُحجب أرقام الهاتف والبريد تلقائياً.', 'Chats are archived. Phone numbers and emails are blocked automatically.')) + '</p>';
    var ta = f.querySelector('#wcIn'); if (ta && S.drafts[S.cur]) ta.value = S.drafts[S.cur];
  }

  function renderAll() {
    if (!panel) return;
    panel.setAttribute('aria-label', t('المحادثات', 'Messages'));
    panel.innerHTML = '<div class="wc-head" id="wcHead"></div><div class="wc-body" id="wcBody"></div><div class="wc-foot" id="wcFoot"></div>';
    renderHead(); renderBody(true); renderFoot(); renderFab();
  }

  /* keep clear of the cookie notice, the compare bar and the mobile price bar */
  function place() {
    if (!root) return;
    var b = 0;
    try {
      var vw = window.innerWidth, vh = window.innerHeight, rtl = document.documentElement.dir === 'rtl';
      var f0 = rtl ? 16 : vw - 72, f1 = rtl ? 72 : vw - 16;               /* horizontal span of the button */
      ['#cookieBar', '.cmpbar', '.mbar'].forEach(function (sel) {
        var e = document.querySelector(sel); if (!e) return;
        var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.classList.contains('hidden')) return;
        var r = e.getBoundingClientRect();
        if (r.height > 0 && r.bottom > vh - 40 && r.right > f0 && r.left < f1) b = Math.max(b, Math.ceil(vh - r.top));
      });
    } catch (e) {}
    root.style.setProperty('--wc-b', b + 'px');
  }

  /* ───────── block ───────── */
  Wijha.block('chat', {
    version: '1.0.0',
    expose: {
      open: function (id) { return id ? openThread(id) : openList(); },
      openOffer: function (id) { return openOffer(id); },
      close: function () { close(); },
      sync: function () {
        if (!root) return Promise.resolve();
        S.threads = null; S.msgs = {}; S.tErr = null;
        if (!me()) { if (S.open && S.view !== 'prompt') { S.open = false; panel.hidden = true; } S.unread = 0; renderFab(); schedule(); return Promise.resolve(); }
        schedule(); renderFab();
        return loadThreads(true);
      },
      relang: function () { if (!root) return; renderFab(); if (S.open) { renderAll(); } },
      unread: function () { return S.unread; },
      state: function () { return { open: S.open, view: S.view, cur: S.cur, unread: S.unread }; }
    },
    actions: {
      toggle: function () { if (S.open) close(); else openList(); },
      close: function () { close(); },
      back: function () { S.view = 'list'; S.cur = null; renderAll(); loadThreads(true); },
      thread: function (id) { return openThread(id); },
      reload: function () { return loadThreads(false); },
      reloadMsgs: function () { return loadMsgs(S.cur, { stick: true }); },
      send: function () { send(); },
      retry: function (tmp) { var f = findPending(tmp); if (f) deliver(f.m, f.k); },
      drop: function (tmp) { var f = findPending(tmp); if (!f) return; S.pending[f.k] = arr(S.pending[f.k]).filter(function (x) { return x !== f.m; }); renderBody(); },
      signin: function () { close(); try { H.signIn(); } catch (e) {} }
    },
    init: function (a) {
      api = a; H = a.x && a.x.chat;
      if (!H) { api.log('no page adapter (api.x.chat): widget not shown'); return; }
      var st = document.createElement('style'); st.id = 'wcStyle'; st.textContent = CSS; document.head.appendChild(st);
      root = document.createElement('div'); root.id = 'wjChat';
      fab = document.createElement('button'); fab.className = 'wc-fab'; fab.type = 'button'; fab.setAttribute('data-wb-click', 'chat.toggle'); fab.hidden = true;
      panel = document.createElement('div'); panel.className = 'wc-panel'; panel.setAttribute('role', 'dialog'); panel.hidden = true;
      root.appendChild(fab); root.appendChild(panel); document.body.appendChild(root);
      try { mq = window.matchMedia('(max-width:600px)'); (mq.addEventListener || mq.addListener).call(mq, 'change', function () { renderFab(); }); } catch (e) { mq = null; }

      /* keyboard: Enter sends (Shift+Enter = new line), Escape closes; the textarea grows up to ~4 lines */
      panel.addEventListener('keydown', function (ev) {
        if (ev.target && ev.target.id === 'wcIn' && ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); send(); }
      });
      panel.addEventListener('input', function (ev) {
        var ta = ev.target; if (!ta || ta.id !== 'wcIn') return;
        S.drafts[S.cur] = ta.value; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
      });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.open) close(); });
      panel.addEventListener('click', function (ev) { var a2 = ev.target && ev.target.closest ? ev.target.closest('[data-wc-trip]') : null; if (a2 && mobile()) close(); });
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') tick(); });
      window.addEventListener('resize', place); window.addEventListener('hashchange', function () { setTimeout(place, 60); });
      document.addEventListener('click', function () { setTimeout(place, 120); }, true);
      try {
        var pend = 0; new MutationObserver(function (list) {
          if (list.every(function (m) { return root.contains(m.target); })) return;
          clearTimeout(pend); pend = setTimeout(place, 80);
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
      } catch (e) {}
      place(); renderFab(); schedule();
      if (me()) loadThreads(true);
    }
  });
})();
