/* Wijha blocks · core registry · v1.0.0
 * Plain JS, no build, same-origin. Loaded with a normal <script src="blocks/core.js"> BEFORE the page's inline
 * scripts (so the registry exists), then each block file is loaded with <script defer src="blocks/<name>.js">.
 *
 * What it gives a block:
 *   - a registry:           Wijha.block(name, {version, deps, slots, actions, expose, init})
 *   - an error boundary:    every init / render / action runs inside try/catch (+ promise rejection); a failure
 *                           becomes a small localized note in that block's place and a console.error with the
 *                           block name. Nothing is ever re-thrown to the page.
 *   - a disable switch:     window.BLOCKS_OFF=['faq'], localStorage 'wijha_blocks_off' ("faq,photos"), or ?blocks_off=faq
 *   - a shared API object:  passed to the block explicitly (lang, esc, toast, get, post, patch, rpc, go, ...)
 *                           so blocks never reach into the page's globals.
 *   - delegated events:     data-wb-click / data-wb-input / data-wb-change = "block.action|arg" (no inline JS needed)
 *
 * The page calls blocks through:  Wijha.html(slot, ctx, opts)  /  Wijha.mount(slot, el, ctx, opts)
 * and registers its own helpers once with:  Wijha.host({...})
 */
(function (w) {
  'use strict';
  if (w.Wijha && w.Wijha.__core) return;               // loaded twice: keep the first one
  var VERSION = '1.0.0';
  var blocks = {};                                     // name -> {def, state, error, api, version}
  var slots = {};                                      // slot id -> block name
  var waiting = [];                                    // blocks waiting for deps
  var pendingSlots = {};                               // placeholder id -> {slot, ctx, opts}
  var seq = 0;
  var H = {};                                          // host helpers registered by the page

  function lsGet(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }

  /* ── disable switch ── */
  function offList() {
    var out = [];
    function add(v) { String(v || '').split(/[,\s]+/).forEach(function (x) { if (x) out.push(x); }); }
    try { if (Array.isArray(w.BLOCKS_OFF)) w.BLOCKS_OFF.forEach(add); else add(w.BLOCKS_OFF); } catch (e) {}
    add(lsGet('wijha_blocks_off'));
    try { var m = /[?&#]blocks_off=([^&#]*)/.exec((w.location.search || '') + (w.location.hash || '')); if (m) add(decodeURIComponent(m[1])); } catch (e) {}
    return out;
  }
  function isOff(name) { var l = offList(); return l.indexOf(name) > -1 || l.indexOf('*') > -1; }

  /* ── helpers ── */
  function lang() { try { return (H.lang && H.lang()) || 'ar'; } catch (e) { return 'ar'; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fail(name, where, err) {
    var b = blocks[name]; if (b) { b.state = b.state === 'ready' ? 'ready' : 'failed'; b.error = String((err && err.message) || err); b.lastError = where + ': ' + b.error; }
    try { console.error('[wijha-block:' + name + '] ' + where + ' failed:', err); } catch (e) {}
  }
  function note(name) {
    var ar = lang() === 'ar';
    return '<div class="note wb-note" role="status" data-wb-failed="' + esc(name) + '" style="margin:12px 0;padding:10px 14px;border:1px dashed var(--line,#ccc);border-radius:10px;color:var(--muted,#666);font-size:13px">' +
      (ar ? 'هذا القسم غير متاح مؤقتاً.' : 'This section is temporarily unavailable.') + '</div>';
  }
  function isThenable(x) { return x && typeof x.then === 'function'; }

  /* run fn inside the boundary. Returns {ok, value} for sync, or a promise-shaped marker for async. */
  function guard(name, where, fn) {
    try {
      var v = fn();
      if (isThenable(v)) return { ok: true, async: true, value: v.then(null, function (e) { fail(name, where, e); throw e; }) };
      return { ok: true, value: v };
    } catch (e) { fail(name, where, e); return { ok: false, error: e }; }
  }

  /* ── the API object each block receives ── */
  function makeApi(name, def) {
    var api = {
      name: name, version: def.version || 'unversioned', core: VERSION,
      esc: H.esc || esc,
      t: function (ar, en) { return lang() === 'ar' ? ar : en; },
      toast: function (m, bad) { try { H.toast && H.toast(m, bad); } catch (e) {} },
      go: function (h) { try { H.go && H.go(h); } catch (e) {} },
      setTitle: function (t) { try { document.title = t; } catch (e) {} },
      refresh: function (scope) { try { H.refresh && H.refresh(name, scope); } catch (e) { fail(name, 'refresh', e); } },
      log: function () { try { console.log.apply(console, ['[wijha-block:' + name + ']'].concat([].slice.call(arguments))); } catch (e) {} },
      use: function (n) { return W.use(n); },
      x: H.extras || {}                                 // page-specific extras (e.g. admin image helpers)
    };
    Object.defineProperty(api, 'lang', { get: lang, enumerable: true });
    ['get', 'post', 'patch', 'del', 'rpc'].forEach(function (m) {
      api[m] = function () {
        if (!H[m]) return Promise.reject(new Error('host.' + m + ' not provided'));
        try { return Promise.resolve(H[m].apply(null, arguments)); } catch (e) { return Promise.reject(e); }
      };
    });
    api.x = H.extras || {};
    return api;
  }

  /* ── registry ── */
  function depsReady(def) {
    return (def.deps || []).every(function (d) { return blocks[d] && blocks[d].state === 'ready'; });
  }
  function start(name) {
    var b = blocks[name]; if (!b || b.state !== 'pending') return;
    b.api = b.api || makeApi(name, b.def);
    b.state = 'starting';
    var r = guard(name, 'init', function () { return b.def.init ? b.def.init(b.api) : undefined; });
    function done() { b.state = 'ready'; b.error = null; fillPending(name); settleWaiting(); }
    if (!r.ok) { b.state = 'failed'; fillPending(name); return; }
    if (r.async) { r.value.then(done, function () { b.state = 'failed'; fillPending(name); }); }
    else done();
  }
  function settleWaiting() {
    var again = true;
    while (again) {
      again = false;
      waiting.slice().forEach(function (n) {
        var b = blocks[n]; if (!b) return;
        if (depsReady(b.def)) { waiting.splice(waiting.indexOf(n), 1); start(n); again = true; }
      });
    }
  }

  var W = w.Wijha = {
    __core: true, version: VERSION,

    /* page registers its helpers once: {lang, toast, go, get, post, patch, del, rpc, refresh, extras} */
    host: function (h) { H = h || {}; return W; },

    /* register a block. Never throws. */
    block: function (name, def) {
      try {
        def = def || {};
        if (!name || blocks[name]) { console.error('[wijha-block] duplicate or empty block name:', name); return W; }
        blocks[name] = { def: def, state: 'pending', error: null, version: def.version || 'unversioned' };
        var s = def.slots || {};
        Object.keys(s).forEach(function (k) {
          if (slots[k] && slots[k] !== name) console.error('[wijha-block:' + name + '] slot "' + k + '" already owned by "' + slots[k] + '"');
          else slots[k] = name;
        });
        if (isOff(name)) { blocks[name].state = 'off'; fillPending(name); return W; }
        if (depsReady(def)) start(name);
        else { var missing = (def.deps || []).filter(function (d) { return !blocks[d] || blocks[d].state === 'off' || blocks[d].state === 'failed'; });
          if (missing.some(function (d) { return blocks[d] && (blocks[d].state === 'off' || blocks[d].state === 'failed'); })) { blocks[name].state = 'blocked'; blocks[name].error = 'dependency unavailable: ' + missing.join(','); fillPending(name); }
          else waiting.push(name); }
        settleWaiting();
      } catch (e) { try { console.error('[wijha-block:' + name + '] register failed:', e); } catch (_) {} }
      return W;
    },

    /* HTML string for a slot. Always returns a string. opts.quiet: show nothing (instead of the note) on failure. */
    html: function (slot, ctx, opts) {
      try {
        var name = slots[slot], b = name && blocks[name];
        if (!b) {
          // block not loaded (yet): leave a placeholder that is filled when it registers. If it is switched off, say nothing.
          if (slotOffByList(slot)) return '';
          var id = 'wb' + (++seq); pendingSlots[id] = { slot: slot, ctx: ctx, opts: opts || {} };
          return '<span id="' + id + '" data-wb-slot="' + esc(slot) + '" hidden></span>';
        }
        if (b.state === 'off') return '';
        if (b.state === 'pending' || b.state === 'starting') {
          var id2 = 'wb' + (++seq); pendingSlots[id2] = { slot: slot, ctx: ctx, opts: opts || {} };
          return '<span id="' + id2 + '" data-wb-slot="' + esc(slot) + '" hidden></span>';
        }
        if (b.state === 'failed' || b.state === 'blocked') return (opts && opts.quiet) ? '' : note(name);
        var fn = b.def.slots[slot];
        var r = guard(name, 'render ' + slot, function () { return fn(ctx || {}, b.api); });
        if (!r.ok) return (opts && opts.quiet) ? '' : note(name);
        if (r.async) {            // async render: placeholder now, content when it resolves
          var id3 = 'wb' + (++seq);
          r.value.then(function (h) { var el = document.getElementById(id3); if (el) el.outerHTML = String(h == null ? '' : h); },
                       function () { var el = document.getElementById(id3); if (el) el.outerHTML = (opts && opts.quiet) ? '' : note(name); });
          return '<span id="' + id3 + '" data-wb-slot="' + esc(slot) + '" hidden></span>';
        }
        return String(r.value == null ? '' : r.value);
      } catch (e) { try { console.error('[wijha-block] html(' + slot + ') failed:', e); } catch (_) {} return ''; }
    },

    /* render a slot into an element (page-level blocks such as legal pages) */
    mount: function (slot, el, ctx, opts) {
      try { if (el) el.innerHTML = W.html(slot, ctx, opts); } catch (e) { try { console.error('[wijha-block] mount(' + slot + ') failed:', e); } catch (_) {} }
    },

    /* a block's public methods (its `expose` object), or null when missing / off / failed */
    use: function (name) { var b = blocks[name]; return (b && b.state === 'ready' && b.def.expose) ? b.def.expose : null; },

    isOff: isOff,
    /* debugging: Wijha.status() */
    status: function () {
      var o = {}; Object.keys(blocks).forEach(function (n) { o[n] = { version: blocks[n].version, state: blocks[n].state, error: blocks[n].error }; }); return o;
    }
  };

  function slotOffByList(slot) {
    // slot ids are "<block>.<something>" by convention; if no block owns it we can still tell the block is switched off by name
    var pre = String(slot).split('.')[0]; return isOff(pre) || offList().some(function (n) { return slot.indexOf(n + '.') === 0; });
  }

  /* blocks that registered after the page asked for a slot: fill the placeholders now */
  function fillPending(name) {
    Object.keys(pendingSlots).forEach(function (id) {
      var p = pendingSlots[id]; if (slots[p.slot] !== name) return;
      delete pendingSlots[id];
      var el = document.getElementById(id); if (!el) return;
      var h = ''; try { h = W.html(p.slot, p.ctx, p.opts); } catch (e) { h = ''; }
      el.outerHTML = h;
    });
  }
  /* a block file that never arrives (404, blocked): after the page has loaded, turn leftover placeholders into the note */
  w.addEventListener('load', function () {
    setTimeout(function () {
      Object.keys(pendingSlots).forEach(function (id) {
        var p = pendingSlots[id]; delete pendingSlots[id];
        var el = document.getElementById(id); if (!el) return;
        el.outerHTML = (p.opts && p.opts.quiet) ? '' : note(String(p.slot).split('.')[0]);
      });
    }, 4000);
  });

  /* ── delegated events: data-wb-click="block.action|arg" ── */
  ['click', 'input', 'change'].forEach(function (type) {
    document.addEventListener(type, function (ev) {
      var t = ev.target; var el = t && t.closest ? t.closest('[data-wb-' + type + ']') : null;
      if (!el) return;
      var spec = el.getAttribute('data-wb-' + type) || '';
      var bar = spec.indexOf('|'), path = bar < 0 ? spec : spec.slice(0, bar), arg = bar < 0 ? '' : spec.slice(bar + 1);
      var dot = path.indexOf('.'), name = path.slice(0, dot), act = path.slice(dot + 1);
      var b = blocks[name]; if (!b || b.state !== 'ready' || !b.def.actions || !b.def.actions[act]) return;
      var r = guard(name, 'action ' + act, function () { return b.def.actions[act](arg, el, ev, b.api); });
      if (r.ok && r.async) r.value.then(null, function () { b.api.toast(b.api.t('تعذّر تنفيذ الإجراء', 'Action failed'), true); });
      if (!r.ok) b.api.toast(b.api.t('تعذّر تنفيذ الإجراء', 'Action failed'), true);
    }, false);
  });
})(window);
