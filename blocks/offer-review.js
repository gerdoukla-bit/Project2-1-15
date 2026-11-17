/* Offer review workspace: read-only source, editable fields via existing editor. */
(function(){
'use strict';
let objectUrl=null, sequence=0;
const groups=[
 ['البيانات الأساسية',['title_ar','title_en','category','sub_category','dest_ar','dest_en','brief_ar','brief_en']],
 ['التواريخ والمدة',['starts_on','ends_on','dates_text_ar','days','nights','expires_on']],
 ['الأسعار',['currency','price_quad','price_triple','price_double','price_single','deposit']],
 ['النقل والطيران',['flights_included','flight_out_ar','flight_back_ar']],
 ['معلومات إضافية',['note_ar','source_url']]
];
function clear(){sequence++;if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}}
function render(ctx){
 const esc=ctx.esc, imp=ctx.imp, offer=ctx.offer, fld=ctx.field, definitions=ctx.fields;
 const path=(imp&&imp.file_path)||offer.source_file;
 const checks=((imp&&imp.payload&&imp.payload.created)||[]).find(x=>x.offer_id===offer.id)?.checks||[];
 const fields=groups.map(([name,keys])=>'<details open class="rv-group"><summary>'+esc(name)+'</summary><div class="form">'+
 definitions.filter(f=>keys.includes(f[0])).map(f=>fld(f[0],f[1],f[2],f[3])).join('')+'</div></details>').join('');
 return '<div class="rv-layout"><section><h3>📄 المستند الأصلي</h3>'+
 (path?'<div id="rv-document" role="status">جارٍ تحميل الملف…</div>':'<p>لا يوجد ملف مرتبط بهذا العرض</p>')+
 '</section><section><h3>البيانات المستخرجة</h3>'+
 (checks.length?'<div class="note-box"><b>نقاط للمراجعة</b><ul>'+checks.map(x=>'<li>'+esc(x.problem_ar||x.problem_en||'مراجعة مطلوبة')+'</li>').join('')+'</ul></div>':'')+
 fields+'<p class="note">الفنادق والبرنامج ويشمل/لا يشمل في التبويبات الأصلية. استخدم زر الحفظ الموجود أسفل النافذة.</p></section></div>';
}
async function load(ctx){
 clear();
 const seq=sequence, node=document.getElementById('rv-document');
 if(!node)return;
 const path=(ctx.imp&&ctx.imp.file_path)||ctx.offer.source_file;
 if(!path)return;
 try{
 const token=await ctx.token();
 const r=await fetch(ctx.base+'/storage/v1/object/sign/offer-intake/'+path,{method:'POST',
 headers:{apikey:ctx.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300})});
 if(!r.ok)throw Error('Access denied or document unavailable');
 const signed=await r.json();
 const url=new URL(signed.signedURL,ctx.base+'/storage/v1/');
 if(url.origin!==new URL(ctx.base).origin)throw Error('Unexpected document origin');
 const res=await fetch(url.toString());if(!res.ok)throw Error('Document unavailable');
 const blob=await res.blob();
 if(seq!==sequence||!node.isConnected)return;
 if(!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(blob.type)){
 node.textContent='هذا النوع من الملفات لا يدعم المعاينة المدمجة';return;
 }
 objectUrl=URL.createObjectURL(blob);
 node.textContent='';
 const view=document.createElement(blob.type.startsWith('image/')?'img':'iframe');
 view.src=objectUrl;view.title='Original offer document';
 view.style.cssText='width:100%;height:65vh;border:0;object-fit:contain';
 node.appendChild(view);
 }catch(e){if(seq===sequence&&node.isConnected)node.textContent='تعذّر فتح المستند: '+e.message;}
}
function style(){
 if(document.getElementById('rv-style'))return;
 const el=document.createElement('style');el.id='rv-style';
 el.textContent='.rv-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.rv-layout>section{min-width:0}.rv-group{border:1px solid var(--line,#ddd);border-radius:10px;padding:10px;margin:8px 0}.rv-group summary{cursor:pointer;font-weight:700}.rv-group .form{margin-top:10px}@media(max-width:850px){.rv-layout{grid-template-columns:1fr}}';
 document.head.appendChild(el);
}
window.WijhaOfferReview={render(ctx){style();return render(ctx);},load,clear};
})();