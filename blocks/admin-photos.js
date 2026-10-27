/* Block: admin-photos  v1.0.0
 * "صور" tab of the offer editor (admin.html): multi-upload, caption, "from a previous trip" flag, delete.
 * Slots:  editor.photos  ctx {ED}     ED.photos = rows of wijha_photos; ED.id / ED.full.company_id identify the offer.
 * Needs from the page (api.x): prepImage(file,'gallery') -> Blob, putPhoto(blob,'gallery') -> {path,url}, removeFile(path), me() -> profile.
 * Database: wijha_photos (insert / patch / delete) through api.post / api.patch / api.del.
 */
(function(){
let ED=null;
const redraw=api=>api.refresh('editor');
Wijha.block('admin-photos',{
  version:'1.0.0',
  slots:{
    'editor.photos':(ctx,api)=>{
      ED=ctx.ED; const esc=api.esc;
      return !ED.id?`<div class="note">احفظ العرض أولاً ثم أضف الصور.</div>`:`<div class="bar"><label class="btn sm" style="cursor:pointer">+ أضف صوراً<input type="file" accept="image/jpeg,image/png,image/webp" multiple style="display:none" data-wb-change="admin-photos.add"></label>
     <span class="note">صور حقيقية من رحلات الشركة السابقة. تُضغط تلقائياً وتُزال منها بيانات الموقع الجغرافي. لا ترفع صور أشخاص دون إذنهم.</span></div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px">${(ED.photos||[]).map((ph,i)=>`<div style="border:1px solid var(--line);border-radius:12px;padding:8px">
       <img src="${esc(ph.external_url||'')}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block">
       <input style="width:100%;margin-top:6px" placeholder="وصف (مثال: الفيوردات · يوليو ٢٠٢٥)" value="${esc(ph.caption_ar||'')}" data-wb-change="admin-photos.caption|${i}">
       <label style="display:flex;gap:6px;align-items:center;font-size:12px;margin-top:4px"><input type="checkbox" ${ph.service_kind==='past_trip'?'checked':''} data-wb-change="admin-photos.kind|${i}"> من رحلة سابقة</label>
       <button class="btn sm danger" style="margin-top:6px" data-wb-click="admin-photos.del|${i}">حذف</button></div>`).join('')||'<div class="note">لا توجد صور بعد.</div>'}</div>`;
    }
  },
  actions:{
    add:async(a,el,ev,api)=>{
      const files=el.files; if(!ED?.id||!files?.length) return; let n=0;
      for(const f of [...files].slice(0,12)){
        try{ const {path,url}=await api.x.putPhoto(await api.x.prepImage(f,'gallery'),'gallery');
          const [row]=await api.post('wijha_photos',{offer_id:ED.id,company_id:ED.full.company_id,storage_path:path,external_url:url,service_kind:'past_trip',sort_order:(ED.photos||[]).length,uploaded_by:api.x.me().id});
          (ED.photos=ED.photos||[]).push(row); n++; }catch(e){ api.toast(f.name+': '+e.message,true); }
      }
      if(n) api.toast('تم رفع '+n+' صورة'); redraw(api);
    },
    caption:async(a,el,ev,api)=>{ const ph=ED.photos[+a]; try{ await api.patch('wijha_photos?id=eq.'+ph.id,{caption_ar:el.value||null}); ph.caption_ar=el.value; }catch(e){ api.toast(e.message,true); } },
    kind:async(a,el,ev,api)=>{ const ph=ED.photos[+a], on=el.checked; try{ await api.patch('wijha_photos?id=eq.'+ph.id,{service_kind:on?'past_trip':'offer'}); ph.service_kind=on?'past_trip':'offer'; }catch(e){ api.toast(e.message,true); } },
    del:async(a,el,ev,api)=>{ const i=+a, ph=ED.photos[i]; if(!confirm('حذف هذه الصورة؟')) return;
      try{ await api.del('wijha_photos?id=eq.'+ph.id); if(ph.storage_path) api.x.removeFile(ph.storage_path); ED.photos.splice(i,1); redraw(api); }catch(e){ api.toast(e.message,true); } }
  }
});
})();
