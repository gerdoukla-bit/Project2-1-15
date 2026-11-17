/* Block: offer-popup  v1.0.0
 * Opens an offer as a POP-UP over the current page, showing it exactly as the client will see it (the #/preview/<id> page in a frame),
 * so a company employee can check every detail in its place right after uploading, without leaving the dashboard.
 * Use:  <a href="#/preview/ID" data-wb-click="offer-popup.open|ID">…</a>   or   Wijha.use('offer-popup').open(ID)
 * Off / broken: the link simply opens the full preview page (nothing is lost).
 * Test: node tests/offer-popup-test.js
 */
(function () {
  var ID = /^[A-Za-z0-9_-]{1,64}$/, API = null, lastFocus = null;
  /* when THIS page is the one shown inside the pop-up: hide the site header, footer and chat button so only the offer shows */
  if (/[?&]popup=1/.test(location.search) && window.self !== window.top) {
    var h = document.createElement('style'); h.textContent = 'header.nav,body>footer,.wc-fab,#mbar{display:none!important}'; document.head.appendChild(h);
  }
  function css() {
    if (document.getElementById('op-css')) return;
    var s = document.createElement('style'); s.id = 'op-css';
    s.textContent = '.op-ov{position:fixed;inset:0;z-index:150;background:rgba(20,18,14,.6);display:flex;align-items:stretch;justify-content:center;padding:18px}' +
      '.op-box{background:var(--bg,#fff);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;width:100%;max-width:1180px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
      '.op-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line,#ddd);background:var(--surface,#fff)}' +
      '.op-head b{flex:1;font-size:15px}.op-box iframe{border:0;flex:1;width:100%;background:var(--bg,#fff)}' +
      '@media(max-width:640px){.op-ov{padding:0}.op-box{border-radius:0}.op-head b{font-size:13px}}';
    document.head.appendChild(s);
  }
  function close() {
    var o = document.getElementById('op-ov'); if (!o) return;
    o.remove(); document.removeEventListener('keydown', onKey, true); document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    if (API && API.x && API.x.popupClosed) API.x.popupClosed();     // let the page refresh its lists (the offer may have been sent for review)
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function open(id) {
    if (!ID.test(String(id || '')) || !API) return false;
    css(); close(); lastFocus = document.activeElement;
    var t = API.t, o = document.createElement('div'); o.id = 'op-ov'; o.className = 'op-ov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', t('معاينة العرض كما يراه العميل', 'Offer preview as the client sees it'));
    o.innerHTML = '<div class="op-box"><div class="op-head"><b>👁 ' + API.esc(t('هكذا سيرى العميل عرضك — راجع كل تفصيلة في مكانها', 'This is how clients will see your offer — check every detail in its place')) + '</b>' +
      '<a class="btn btn-ghost" href="#/preview/' + id + '" data-wb-click="offer-popup.full">' + API.esc(t('فتح في صفحة كاملة', 'Open full page')) + '</a>' +
      '<button class="btn btn-primary" data-wb-click="offer-popup.close" id="op-close">' + API.esc(t('إغلاق', 'Close')) + '</button></div>' +
      '<iframe title="' + API.esc(t('معاينة العرض', 'Offer preview')) + '" src="./index.html?popup=1#/preview/' + id + '"></iframe></div>';
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    document.body.appendChild(o); document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);
    var c = document.getElementById('op-close'); if (c) c.focus();
    return true;
  }
  Wijha.block('offer-popup', {
    version: '1.0.0',
    init: function (api) { API = api; },
    actions: {
      open: function (id, el, ev, api) { API = api; if (open(id) && ev && ev.preventDefault) ev.preventDefault(); },
      close: function () { close(); },
      full: function () { var o = document.getElementById('op-ov'); if (o) { o.remove(); document.documentElement.style.overflow = ''; } }
    },
    expose: { open: function (id) { return open(id); }, close: close }
  });
})();
