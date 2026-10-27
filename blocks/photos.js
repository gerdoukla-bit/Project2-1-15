/* Block: photos  v1.0.0
 * "Photos from the company's previous trips" section on the trip page.
 * Slots:  detail.photos  ctx {trip}   trip.photos = [{url, cap:{ar,en}, past:boolean}]  (mapped from wijha_photos by hydrate())
 * Only photos flagged past:true are shown; none -> renders nothing.
 */
Wijha.block('photos',{
  version:'1.0.0',
  slots:{
    'detail.photos':({trip:x},api)=>{
      const L=api.lang, esc=api.esc;
      return (x&&x.photos&&x.photos.some(p=>p.past))?`<section class="past"><h2>${L==='ar'?'صور من رحلات سابقة للشركة':'Photos from the company\'s previous trips'}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${x.photos.filter(p=>p.past).map(p=>`<figure style="margin:0"><img src="${esc(p.url)}" alt="${esc(p.cap[L])}" loading="lazy" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block">${p.cap[L]?`<figcaption class="note" style="margin-top:4px">${esc(p.cap[L])}</figcaption>`:''}</figure>`).join('')}</div><p class="note">${L==='ar'?'صور حقيقية من رحلات الشركة السابقة، وقد تختلف الفنادق والبرنامج عن هذا العرض.':'Real photos from the company\'s earlier trips; hotels and programme may differ from this offer.'}</p></section>`:'';
    }
  }
});
