/* Block: login-drop  v1.0.0
 * Sign-in panel that drops down from the top of the page (under the header). Only email + password, a big sign-in button, and two small
 * links: "forgot password?" and "create an account". Opens from the header sign-in button while the visitor is signed out; once signed in the
 * button goes to the account page as before. No slots: it mounts itself and listens for clicks on #acctBtn.
 * Page extras (api.x.auth): signedIn() login(email,password) recover(email)    login() throws an Error with a readable message.
 * Expose: open(), close(), isOpen()
 */
(function () {
  var S = x => x == null ? '' : String(x);
  var panel = null, open_ = false, mode = 'login', busy = false, A = null, api_ = null;

  function t(ar, en) { return api_ ? api_.t(ar, en) : ar; }
  function esc(s) { return api_ ? api_.esc(s) : S(s); }

  function css() {
    if (document.getElementById('ld-css')) return;
    var st = document.createElement('style'); st.id = 'ld-css';
    st.textContent =
      '.ld{position:fixed;inset-inline:0;top:0;z-index:9000;display:flex;justify-content:center;padding:70px 14px 0;pointer-events:none}' +
      '.ld[hidden]{display:none}.ld-bd{position:fixed;inset:0;background:rgba(20,18,14,.35);z-index:8999;opacity:0;transition:opacity .2s}.ld-bd.on{opacity:1}' +
      '.ld-card{pointer-events:auto;width:100%;max-width:400px;background:var(--surface,#fff);border:1px solid var(--line,#e6e0d4);border-radius:0 0 18px 18px;box-shadow:0 24px 50px -20px rgba(0,0,0,.45);padding:18px 18px 14px;transform:translateY(-24px);opacity:0;transition:transform .22s ease,opacity .22s}' +
      '.ld.on .ld-card{transform:none;opacity:1}' +
      '.ld-card h2{margin:0 0 12px;font-size:18px}.ld-card label{display:block;font-size:12px;font-weight:700;color:var(--muted,#777);margin:8px 0 4px}' +
      '.ld-card input{width:100%;border:1px solid var(--line,#e6e0d4);border-radius:10px;padding:11px 12px;font-size:15px;background:var(--bg,#faf8f3);color:inherit;box-sizing:border-box}' +
      '.ld-card input:focus{outline:2px solid var(--amber,#e09b1a);outline-offset:1px}' +
      '.ld-go{width:100%;margin-top:12px}.ld-small{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:12px}' +
      '.ld-small a,.ld-small button{background:none;border:0;padding:0;color:var(--muted,#777);text-decoration:underline;cursor:pointer;font:inherit}' +
      '.ld-err{color:#b3261e;font-size:13px;min-height:18px;margin-top:8px}.ld-ok{color:#1d7a46;font-size:13px;margin-top:8px}' +
      '@media(max-width:600px){.ld{padding:60px 0 0}.ld-card{max-width:none;border-radius:0 0 18px 18px}}';
    document.head.appendChild(st);
  }

  function html() {
    var inp = function (id, type, ac, ph) { return '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '" placeholder="' + esc(ph || '') + '">'; };
    if (mode === 'forgot') {
      return '<h2>' + esc(t('استعادة كلمة المرور', 'Reset your password')) + '</h2>' +
        '<label for="ldEmail">' + esc(t('البريد الإلكتروني', 'Email')) + '</label>' + inp('ldEmail', 'email', 'email', 'name@example.com') +
        '<div class="ld-err" id="ldMsg" role="alert"></div>' +
        '<button class="btn btn-primary ld-go" id="ldGo" data-ld="recover">' + esc(t('أرسل رابط الاستعادة', 'Send reset link')) + '</button>' +
        '<div class="ld-small"><button type="button" data-ld="back">' + esc(t('رجوع لتسجيل الدخول', 'Back to sign in')) + '</button></div>';
    }
    return '<h2>' + esc(t('تسجيل الدخول', 'Sign in')) + '</h2>' +
      '<label for="ldEmail">' + esc(t('البريد الإلكتروني', 'Email')) + '</label>' + inp('ldEmail', 'email', 'email', 'name@example.com') +
      '<label for="ldPass">' + esc(t('كلمة المرور', 'Password')) + '</label>' + inp('ldPass', 'password', 'current-password', '••••••••') +
      '<div class="ld-err" id="ldMsg" role="alert"></div>' +
      '<button class="btn btn-primary ld-go" id="ldGo" data-ld="login">' + esc(t('دخول', 'Sign in')) + '</button>' +
      '<div class="ld-small"><button type="button" data-ld="forgot">' + esc(t('نسيت كلمة المرور؟', 'Forgot password?')) + '</button>' +
      '<a href="#/signup" data-ld="signup">' + esc(t('حساب جديد', 'Create account')) + '</a></div>';
  }

  function paint() { if (!panel) return; var c = panel.querySelector('.ld-card'); c.innerHTML = html(); var f = panel.querySelector('#ldEmail'); if (f && open_) { try { f.focus(); } catch (e) {} } }
  function msg(text, ok) { var m = panel && panel.querySelector('#ldMsg'); if (m) { m.className = ok ? 'ld-ok' : 'ld-err'; m.textContent = text; } }

  function build() {
    if (panel) return;
    css();
    var bd = document.createElement('div'); bd.className = 'ld-bd'; bd.id = 'ldBd'; bd.hidden = true;
    panel = document.createElement('div'); panel.className = 'ld'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Sign in');
    panel.innerHTML = '<div class="ld-card"></div>';
    document.body.appendChild(bd); document.body.appendChild(panel);
    bd.addEventListener('click', close);
    panel.addEventListener('click', function (e) {
      if (e.target === panel) return close();
      var el = e.target.closest ? e.target.closest('[data-ld]') : null; if (!el) return;
      var k = el.getAttribute('data-ld');
      if (k === 'signup') { close(); return; }          // normal link to #/signup
      e.preventDefault();
      if (k === 'forgot') { mode = 'forgot'; paint(); }
      else if (k === 'back') { mode = 'login'; paint(); }
      else if (k === 'login') submit();
      else if (k === 'recover') recover();
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Enter' && !e.isComposing && e.target && e.target.tagName === 'INPUT') { e.preventDefault(); if (mode === 'forgot') recover(); else submit(); }
    });
  }

  function openIt() {
    if (!A) return false; build(); mode = 'login'; open_ = true;
    panel.hidden = false; document.getElementById('ldBd').hidden = false; paint();
    requestAnimationFrame(function () { panel.classList.add('on'); document.getElementById('ldBd').classList.add('on'); });
    return true;
  }
  function close() {
    if (!panel || !open_) return; open_ = false; panel.classList.remove('on'); var bd = document.getElementById('ldBd'); bd.classList.remove('on');
    setTimeout(function () { if (!open_) { panel.hidden = true; bd.hidden = true; } }, 220);
    try { var b = document.getElementById('acctBtn'); if (b && b.focus) b.focus({ preventScroll: true }); } catch (e) {}
  }

  async function submit() {
    if (busy) return; var em = S(panel.querySelector('#ldEmail').value).trim(), pw = S(panel.querySelector('#ldPass').value);
    if (!em || !pw) return msg(t('اكتب البريد وكلمة المرور', 'Enter your email and password'));
    busy = true; var go = panel.querySelector('#ldGo'); if (go) go.disabled = true; msg('');
    try { await A.login(em, pw); busy = false; close(); }
    catch (e) { busy = false; if (go) go.disabled = false; msg(S(e && e.message) || t('تعذّر تسجيل الدخول', 'Could not sign in')); }
  }
  async function recover() {
    if (busy) return; var em = S(panel.querySelector('#ldEmail').value).trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return msg(t('اكتب بريداً إلكترونياً صحيحاً', 'Enter a valid email'));
    busy = true; var go = panel.querySelector('#ldGo'); if (go) go.disabled = true; msg('');
    try { await A.recover(em); busy = false; msg(t('إن كان البريد مسجّلاً ستصلك رسالة بها رابط الاستعادة.', 'If that email is registered, a reset link is on its way.'), true); if (go) go.disabled = false; }
    catch (e) { busy = false; if (go) go.disabled = false; msg(S(e && e.message) || t('تعذّر الإرسال', 'Could not send')); }
  }

  Wijha.block('login-drop', {
    version: '1.0.0',
    expose: { open: function () { return openIt(); }, close: function () { close(); }, isOpen: function () { return open_; } },
    init: function (api) {
      api_ = api; A = api.x && api.x.auth || null;
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open_) close(); });
      document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
        var b = e.target && e.target.closest ? e.target.closest('#acctBtn') : null; if (!b) return;
        if (!A || A.signedIn()) return;                  // signed in: the button is a normal link to the account page
        if (openIt()) e.preventDefault();
      }, true);
    }
  });
})();
