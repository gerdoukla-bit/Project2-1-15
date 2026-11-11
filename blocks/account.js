/* Block: account  v1.0.0
 * The signed-in TRAVELLER's account page (#/account): greeting, quick actions, my requests + quotes, chats, saved trips, "my details", sign out.
 * Slot  page.account  ctx {prof, threads, saved:[offer ids], loaderr}
 * Page extras (api.x.account): L() t esc CATS cName coName tripName trip card threadsErr unread() signout() openMessages()
 * Look: css/account.css (or the shared panels).   Test: node tests/account-test.js
 * Off / broken: the page shows the plain fallback (links to trips and requests + sign out).
 */
(function () {
  var X = function (api) { return api.x && api.x.account; };
  function view(ctx, api) {
    var x = X(api), L = x.L(), t = x.t, esc = x.esc, P = ctx.prof || {}, TH = ctx.threads || [], unread = x.unread();
    var saved = (ctx.saved || []).map(x.trip).filter(Boolean);
    var first = (P.name || '').split(' ')[0] || '';
    var ar = L === 'ar';
    var chats = TH.slice(0, 5).map(function (th) {
      var o = x.trip(th.offer_id);
      return '<a class="rowitem" href="#/chat/' + th.id + '"><div><b>' + esc(x.coName(th.company_id)) + '</b><small>' + (o ? esc(x.tripName(o, L)) : '—') + '</small><small class="dim">' +
        (th.last_message_from === 'client' ? (ar ? 'بانتظار رد الشركة' : 'Awaiting company reply') : (ar ? 'ردّت الشركة' : 'Company replied')) + ' · ' + (th.last_message_at || '').replace('T', ' ').slice(0, 16) + '</small></div>' +
        (th.client_unread ? '<span class="pillnum">' + th.client_unread + '</span>' : '') + '</a>';
    }).join('') || (ctx.loaderr ? x.threadsErr() : '<p class="lead">' + (ar ? 'لا محادثات بعد — أرسل استفساراً من أي رحلة.' : 'No chats yet — send an enquiry from any trip.') + '</p>');
    var ints = (P.interests || []).map(function (i) { return '<span class="tag sm">' + esc(x.CATS[i] ? (ar ? x.CATS[i].ar : x.CATS[i].en) : i) + '</span>'; }).join(' ') || '—';
    return '<div class="wrap">' +
      '<div class="panel acc-hero"><div><h1>' + (ar ? 'أهلاً' : 'Hello') + ' ' + esc(first) + ' 👋</h1><p class="lead">' + (ar ? 'ماذا تريد أن تفعل اليوم؟' : 'What would you like to do today?') + '</p></div>' +
      '<div class="acts"><a class="btn btn-primary" href="#/request">✨ ' + (ar ? 'اطلب رحلة مخصّصة' : 'Request a tailored trip') + '</a><a class="btn btn-ghost" href="#/trips">' + (ar ? 'تصفّح الرحلات' : 'Browse trips') + '</a>' +
      '<button class="btn btn-ghost" data-wb-click="account.messages">💬 ' + (ar ? 'رسائلي' : 'My messages') + (unread ? ' <span class="pillnum">' + unread + '</span>' : '') + '</button></div></div>' +
      Wijha.html('account.requests', {}, { quiet: true }) +
      '<div class="panel"><h3>' + t('acc_chats') + ' <span class="pillnum">' + unread + '</span></h3>' + chats + '</div>' +
      '<section class="sec"><h2>' + t('acc_saved') + ' <span class="pillnum">' + saved.length + '</span></h2>' +
      (saved.length ? '<div class="grid">' + saved.map(x.card).join('') + '</div>' : '<p class="lead">' + (ar ? 'لا توجد رحلات محفوظة بعد — احفظ أي رحلة لتجدها هنا.' : 'Nothing saved yet — save any trip to find it here.') + '</p>') + '</section>' +
      '<details class="panel acc-me"><summary>' + (ar ? 'بياناتي' : 'My details') + '</summary>' +
      '<div class="kv"><span>' + t('f_name') + '</span><b>' + esc(P.name || '—') + '</b></div><div class="kv"><span>' + t('f_email') + '</span><b class="mono">' + esc(P.email || '') + '</b></div>' +
      '<div class="kv"><span>' + t('f_phone') + '</span><b class="mono">' + esc(P.phone || '—') + '</b></div>' +
      '<div class="kv"><span>' + (ar ? 'الجنسية' : 'Nationality') + '</span><b>' + esc(x.cName(P.nationality, L)) + '</b></div>' +
      '<div class="kv"><span>' + t('f_interests') + '</span><b>' + ints + '</b></div>' +
      '<p class="note">' + (ar ? 'بياناتك لا تصل لأي شركة إلا بعد أن تقبل عرضها.' : 'Your details only reach a company after you accept its quote.') + '</p>' +
      '<button class="btn btn-ghost" data-wb-click="account.signout">' + t('signout') + '</button></details></div>';
  }
  Wijha.block('account', {
    version: '1.0.0',
    slots: { 'page.account': function (ctx, api) { return view(ctx, api); } },
    actions: {
      messages: function (a, el, ev, api) { return X(api).openMessages(); },
      signout: function (a, el, ev, api) { return X(api).signout(); }
    }
  });
})();
