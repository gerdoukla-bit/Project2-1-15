/* Block: admin-faq  v1.0.0
 * "أسئلة شائعة" tab of the offer editor (admin.html).
 * Slots:  editor.faq  ctx {ED}      ED.notes is the editor's own array; this block only edits rows with kind 'faq'.
 * Saving stays in the page (saveOffer writes ED.notes to offer_notes), so this block never talks to the database.
 */
(function(){
let ED=null;
const redraw=api=>api.refresh('editor');
Wijha.block('admin-faq',{
  version:'1.0.0',
  slots:{
    'editor.faq':(ctx,api)=>{
      ED=ctx.ED; const esc=api.esc;
      return `<div class="bar"><button class="btn sm" data-wb-click="admin-faq.add">+ سؤال شائع</button><span class="note">يظهر للعملاء في صفحة العرض تحت "أسئلة شائعة". حدّثه كلما تكرر سؤال من العملاء.</span></div>
     ${ED.notes.map((n,i)=>n.kind!=='faq'?'':`<div class="form" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px">
       <div><label>السؤال<input value="${esc(n.label_ar||'')}" data-wb-input="admin-faq.q|${i}"></label></div>
       <div><label>الإجابة<textarea rows="2" style="width:100%" data-wb-input="admin-faq.a|${i}">${esc(n.text_ar||'')}</textarea></label></div>
       <div><label>Question (EN, optional)<input dir="ltr" value="${esc(n.label_en||'')}" data-wb-input="admin-faq.qe|${i}"></label></div>
       <div><label>Answer (EN, optional)<textarea rows="2" dir="ltr" style="width:100%" data-wb-input="admin-faq.ae|${i}">${esc(n.text_en||'')}</textarea></label></div>
       <button class="btn sm danger" data-wb-click="admin-faq.del|${i}">حذف السؤال</button></div>`).join('')||'<div class="note">لا توجد أسئلة بعد.</div>'}`;
    }
  },
  actions:{
    add:(a,el,ev,api)=>{ ED.notes.push({kind:'faq',label_ar:'',text_ar:'',label_en:'',text_en:'',sort_order:ED.notes.length,_new:1}); redraw(api); },
    del:(a,el,ev,api)=>{ ED.notes.splice(+a,1); redraw(api); },
    q:(a,el)=>{ ED.notes[+a].label_ar=el.value; },
    a:(a,el)=>{ ED.notes[+a].text_ar=el.value; },
    qe:(a,el)=>{ ED.notes[+a].label_en=el.value; },
    ae:(a,el)=>{ ED.notes[+a].text_en=el.value; }
  }
});
})();
