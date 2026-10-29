/* Block: preview  v1.0.0
 * "See exactly how the client will see this offer", for offers that are not published yet (drafts made by the upload / extractor).
 * The page (index.html, route #/preview/<offer_id>) loads the offer with the signed-in USER's token (RLS decides) and renders it through the
 * same mapper + trip template as the public page. This block draws the three things that only exist in preview:
 *   preview.banner  ctx {offer, trip, checks, role}   sticky bar: status chip, "needs your attention" list, Edit / Send for review
 *   preview.gate    ctx {state:'signin'|'denied'|'error', id, msg}   sign-in prompt / not found-or-not-allowed / load error
 *   preview.ph      ctx {ar, en, full}                 dashed "not entered" placeholder (used by the trip template ONLY in preview mode)
 * Page extras used: x.pvPatch(id, body) (PATCH offers with the user's token, throws when nothing was saved), x.pvReload().
 * Nothing is stored in the browser. Never prints null/undefined; every dynamic value goes through api.esc.
 * Expose (tests): stateOf(offer), missingOf(offer, trip), canSend(offer, role)
 */
(function () {
  const S = x => x == null ? '' : String(x);
  const ADMIN = ['admin', 'wijha_admin'];

  function stateOf(o) {
    o = o || {};
    if (o.status === 'published' && o.review_state === 'approved' && o.visibility !== 'internal') return 'published';
    if (o.status === 'draft') return 'draft';
    if (o.status === 'pending_review') return 'pending';
    return 'hidden';                                   // rejected / archived / published-but-not-approved / internal
  }
  const CHIP = { draft: ['مسودة', 'Draft', 'draft'], pending: ['بانتظار المراجعة', 'Pending review', 'pending'], published: ['منشور', 'Published', 'live'], hidden: ['مخفي عن العملاء', 'Hidden from clients', 'hidden'] };
  const hasPrice = o => [o.price_quad, o.price_triple, o.price_double, o.price_single].some(v => Number(v) > 0);
  function missingOf(o, x) {
    o = o || {}; x = x || {}; const m = [];
    if (!hasPrice(o)) m.push({ k: 'prices', ar: 'لا يوجد سعر — السعر غير مُدخل', en: 'No price entered' });
    if (!S(o.dates_text_ar).trim() && !S(o.season).trim() && !o.starts_on) m.push({ k: 'dates', ar: 'لا توجد تواريخ سفر', en: 'No travel dates entered' });
    if (!o.expires_on) m.push({ k: 'expiry', ar: 'لا يوجد تاريخ انتهاء للعرض (مطلوب قبل الحفظ)', en: 'No offer expiry date (required before saving)' });
    if (!S(o.brief_ar).trim() && !S(o.brief_en).trim()) m.push({ k: 'brief', ar: 'لا توجد نبذة تعريفية', en: 'No summary text' });
    if (!(x.itin && x.itin.length)) m.push({ k: 'program', ar: 'لا يوجد برنامج يوم بيوم', en: 'No day-by-day program' });
    if (!(x.hotels && x.hotels.length)) m.push({ k: 'hotels', ar: 'لا توجد فنادق', en: 'No hotels' });
    if (!(x.inc && x.inc.length)) m.push({ k: 'includes', ar: 'لا توجد بنود «يشمل»', en: 'No "included" items' });
    return m;
  }
  function canSend(o, role) {
    o = o || {};
    if (ADMIN.indexOf(role) > -1) return { show: false };
    if (o.status !== 'draft' && o.status !== 'rejected') return { show: false };
    if (!S(o.title_ar).trim()) return { show: true, ok: false, ar: 'أضف عنواناً للعرض أولاً', en: 'Add a title first' };
    if (!hasPrice(o)) return { show: true, ok: false, ar: 'أضف سعراً واحداً على الأقل أولاً', en: 'Add at least one price first' };
    return { show: true, ok: true };
  }

  function css() {
    if (document.getElementById('pv-css')) return;
    const s = document.createElement('style'); s.id = 'pv-css';
    s.textContent = `.pv-ph{display:inline-block;border:1.5px dashed var(--amber,#e29a1a);border-radius:8px;padding:2px 10px;margin:2px 0;color:var(--muted,#6b6a72);background:transparent;font-size:.8em;font-weight:600;line-height:1.6;font-family:inherit}
.pv-ph small{font-weight:500;opacity:.85;margin-inline-start:6px}
.pv-row{position:sticky;top:60px;z-index:45;background:var(--amber-soft,#fff4dd);color:var(--amber-ink,#6b4700);border-bottom:2px solid var(--amber,#e29a1a);padding:8px 0}
.pv-row .in{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center}
.pv-row b{font-size:14px;flex:1 1 260px;min-width:0}
.pv-chip{display:inline-block;font-size:11.5px;font-weight:800;padding:2px 10px;border-radius:999px;border:1px solid currentColor;white-space:nowrap;background:var(--surface,#fff)}
.pv-chip.live{color:var(--green,#1f8a5b)}.pv-chip.pending{color:#2b5fb8}.pv-chip.hidden{color:var(--red,#c23b3b)}.pv-chip.draft{color:var(--amber-ink,#8a5a00)}
.pv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:10px;border:1px solid var(--line,#d8d2c4);background:var(--surface,#fff);color:var(--ink,#1b1b1f);font:inherit;font-size:13px;font-weight:700;cursor:pointer;min-height:36px;text-decoration:none}
.pv-btn.pri{background:var(--amber,#e29a1a);border-color:transparent;color:#1b1b1f}.pv-btn:disabled{opacity:.55;cursor:not-allowed}
.pv-why{flex:1 1 100%;font-size:12.5px;color:var(--red,#c23b3b);font-weight:600}
.pv-att{max-width:1180px;margin:0 auto;padding:10px 16px 0}
.pv-att .box{background:var(--surface,#fff);border:1px solid var(--line,#e8e4dc);border-radius:12px;padding:12px 16px;font-size:13.5px}
.pv-att h3{margin:0 0 6px;font-size:14px}.pv-att ul{margin:6px 0 0;padding-inline-start:20px;line-height:1.9}.pv-att .n{color:var(--muted,#6b6a72);font-size:12.5px;margin:6px 0 0}
.pv-att li.chk{color:var(--ink,#1b1b1f)}.pv-att li.miss{color:var(--red,#c23b3b)}
@media(max-width:600px){.pv-row{padding:6px 0}.pv-row .in{padding:0 12px;gap:6px 8px}.pv-row b{font-size:13px;flex-basis:100%}.pv-att{padding:8px 12px 0}}`;
    document.head.appendChild(s);
  }

  Wijha.block('preview', {
    version: '1.0.0',
    init() { css(); },
    expose: { stateOf, missingOf, canSend },
    slots: {
      'preview.ph': (ctx, api) => {
        const lab = api.lang === 'ar' ? ctx.ar : ctx.en;
        if (ctx.full) return `<span class="pv-ph" data-pv-ph>${api.esc(lab)}</span>`;
        return `<span class="pv-ph" data-pv-ph>${api.esc(api.t('غير مُدخل', 'Not entered'))}${lab ? `<small>${api.esc(lab)}</small>` : ''}</span>`;
      },

      'preview.banner': (ctx, api) => {
        const o = ctx.offer || {}, x = ctx.trip || {}, esc = api.esc, t = api.t, id = S(o.id);
        const st = stateOf(o), chip = CHIP[st];
        const live = st === 'published';
        const checks = (ctx.checks || []).filter(c => c && S(c.problem_ar).trim());
        const have = {}; checks.forEach(c => { have[S(c.field)] = 1; });
        const miss = missingOf(o, x).filter(m => !have[m.k]);
        const cs = canSend(o, ctx.role);
        const title = live ? t('معاينة — هذا العرض ظاهر للعملاء بالفعل', 'Preview — this offer is already visible to clients')
                           : t('معاينة — هذا العرض غير ظاهر للعملاء بعد', 'Preview — this offer is not visible to clients yet');
        const send = cs.show
          ? `<button class="pv-btn pri" data-pv-send data-wb-click="preview.send|${esc(id)}" ${cs.ok ? '' : 'disabled aria-disabled="true"'}>${esc(t('إرسال للمراجعة', 'Send for review'))}</button>`
          : (st === 'pending' ? `<span class="pv-chip pending" data-pv-note>${esc(t('أُرسل للمراجعة', 'Sent for review'))}</span>` : '');
        const why = cs.show && !cs.ok ? `<div class="pv-why" data-pv-why role="status">${esc(t(cs.ar, cs.en))}</div>` : '';
        const n = checks.length + miss.length;
        const list = n
          ? `<ul>${checks.map(c => `<li class="chk" data-pv-check dir="auto">${esc(c.problem_ar)}</li>`).join('')}${miss.map(m => `<li class="miss" data-pv-miss="${esc(m.k)}">${esc(t(m.ar, m.en))}</li>`).join('')}</ul>`
          : `<p class="n">${esc(t('لم يُبلّغ عن نقاط ناقصة.', 'No missing points were reported.'))}</p>`;
        return `<div class="pv-row" data-pv-bar role="region" aria-label="${esc(t('شريط المعاينة', 'Preview bar'))}"><div class="in">
          <b data-pv-title>${esc(title)}</b><span class="pv-chip ${esc(chip[2])}" data-pv-status="${esc(st)}">${esc(t(chip[0], chip[1]))}</span>
          <a class="pv-btn" data-pv-edit href="./admin.html?edit=${esc(encodeURIComponent(id))}" target="_blank" rel="noopener">${esc(t('تعديل', 'Edit'))}</a>
          ${send}${live ? `<a class="pv-btn" href="./index.html#/trip/${esc(encodeURIComponent(id))}" target="_blank" rel="noopener">${esc(t('الصفحة العامة', 'Public page'))} ↗</a>` : ''}${why}</div></div>
          <div class="pv-att" data-pv-att><div class="box"><h3>${esc(t('تحتاج انتباهك', 'Needs your attention'))}${n ? ` (${Number(n)})` : ''}</h3>${list}
          <p class="n">${esc(t('الحقول الناقصة تظهر في الصفحة بإطار منقّط، ولن تظهر هكذا للعميل.', 'Missing fields show with a dashed frame below; clients will not see this frame.'))}</p></div></div>`;
      },

      'preview.gate': (ctx, api) => {
        const t = api.t, esc = api.esc, st = ctx.state, id = S(ctx.id);
        let h, p, acts = '';
        if (st === 'signin') {
          h = t('سجّل الدخول كشركة لمعاينة العرض', 'Sign in as the company to preview this offer');
          p = ctx.expired ? t('انتهت جلستك. سجّل الدخول من جديد للمتابعة.', 'Your session expired. Sign in again to continue.')
                          : t('المعاينة متاحة لموظفي الشركة صاحبة العرض ولفريق وجهة فقط.', 'The preview is only for the staff of the company that owns the offer, and the Wijha team.');
          acts = `<button class="btn btn-primary" data-pv-signin data-wb-click="preview.signin|${esc(id)}">${esc(t('تسجيل الدخول', 'Sign in'))}</button> <a class="btn btn-ghost" href="./admin.html">${esc(t('دخول لوحة الإدارة', 'Admin console'))}</a>`;
        } else if (st === 'error') {
          h = t('تعذّر تحميل المعاينة', 'Could not load the preview');
          p = t('حدث خطأ أثناء قراءة العرض. أعد المحاولة.', 'Something went wrong while reading the offer. Please retry.');
          acts = `<button class="btn btn-primary" data-wb-click="preview.retry">${esc(t('إعادة المحاولة', 'Retry'))}</button>`;
        } else {
          h = t('العرض غير موجود أو غير مسموح لك بمعاينته', 'Offer not found, or you are not allowed to preview it');
          p = t('قد يكون الرابط خاطئاً أو أن العرض يتبع شركة أخرى. سجّل الدخول بحساب الشركة صاحبة العرض.', 'The link may be wrong, or the offer belongs to another company. Sign in with the account of the company that owns it.');
          acts = `<a class="btn btn-primary" href="#/">${esc(t('الرئيسية', 'Home'))}</a>`;
        }
        return `<div class="wrap narrow" data-pv-gate="${esc(st)}"><div class="panel" style="text-align:center;padding:40px 20px" role="alert"><h1>${esc(h)}</h1><p class="lead">${esc(p)}</p><div class="acts" style="justify-content:center">${acts}</div></div></div>`;
      }
    },
    actions: {
      signin: (id, el, ev, api) => {
        try { if (/^[A-Za-z0-9_-]{1,64}$/.test(id)) sessionStorage.setItem('wijha_return', '#/preview/' + id); } catch (e) {}
        api.go('#/signup');
      },
      retry: (a, el, ev, api) => { api.refresh(); },
      send: async (id, el, ev, api) => {
        if (!api.x.pvPatch || el.disabled) return;
        el.disabled = true;
        try {
          await api.x.pvPatch(id, { status: 'pending_review', review_state: 'pending' });
          api.toast(api.t('أُرسل العرض للمراجعة', 'Offer sent for review'));
          if (api.x.pvReload) await api.x.pvReload();
        } catch (e) {
          el.disabled = false;
          api.toast(S(e && e.message).slice(0, 160) || api.t('تعذّر الإرسال', 'Could not send'), true);
        }
      }
    }
  });
})();
