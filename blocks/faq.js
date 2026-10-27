/* Block: faq  v1.0.0
 * Offer FAQ accordion on the trip page.
 * Slots:  detail.faq  ctx {trip}   trip.faq = [{q:{ar,en}, a:{ar,en}}]  (mapped from offer_notes kind 'faq' by hydrate())
 * Empty list -> renders nothing.
 */
Wijha.block('faq',{
  version:'1.0.0',
  slots:{
    'detail.faq':({trip:x},api)=>{
      const L=api.lang, esc=api.esc;
      return (x&&x.faq&&x.faq.length)?`<section class="faq"><h2>${L==='ar'?'أسئلة شائعة':'Frequently asked questions'}</h2>${x.faq.map(f=>`<details style="border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 0 8px;background:var(--surface)"><summary style="cursor:pointer;font-weight:700">${esc(f.q[L])}</summary><p style="margin:8px 0 0;line-height:1.8">${esc(f.a[L])}</p></details>`).join('')}</section>`:'';
    }
  }
});
