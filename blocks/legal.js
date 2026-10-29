/* Block: legal  v1.0.0
 * Terms / privacy / cookies / refund pages (route #/legal/<k>) and the cookie notice.
 * Slots:   page.legal  ctx {k}  -> full page body, mounted into #app by the router
 * Expose:  Wijha.use('legal').resetConsent()   (reopens the cookie notice)
 * Shared contract with the page: localStorage keys 'wijha_consent' ('essential'|'all') and 'wijha_sid' (read by the page's sid()).
 * Not part of this block: the captcha, which belongs to the sign-in code.
 */
(function(){
const LEGAL_UPDATED={ar:'آخر تحديث: ٢٥ أكتوبر ٢٠٢٦',en:'Last updated: 25 October 2026'};
const LEGAL={
terms:{ar:['الشروط والأحكام',[
 ['من نحن','وجهة منصة إلكترونية تعرض رحلات الحج والعمرة والرحلات الخارجية التي ينشرها أطراف ثالثة، مثل شركات السياحة والوكلاء والمنظّمين، وتتيح لك المقارنة والتواصل مع الجهة الناشرة. تظهر شارة «موثّقة» فقط على صفحات الجهات التي تحققنا من بياناتها، ولا يعني غياب الشارة أو وجودها ضماناً لتنفيذ الرحلة. وجهة ليست شركة سياحة ولا وكيل سفر، ولا تبيع الرحلات بنفسها.'],
 ['العلاقة التعاقدية','عقد الرحلة يكون بينك وبين الشركة المنظِّمة مباشرة وفق شروطها المعلنة في العرض. وجهة ليست طرفاً في هذا العقد ولا تتقاضى أي نسبة من سعر الرحلة، ولا تستلم أموال الحجز.'],
 ['دقة العروض','الأسعار والبرامج والتواريخ كما نشرتها الشركات. قد تعرض وجهة عروضاً جمعتها من المواد المنشورة علناً للشركة، وتُعلَّم بوضوح بعبارة "جمعته وجهة" إلى أن تتبناها الشركة. تأكّد دائماً من التفاصيل ومن توفر المقاعد مع الشركة قبل الدفع.'],
 ['حسابك','أنت مسؤول عن صحة بياناتك وعن سرية كلمة المرور. يجوز لنا إيقاف أي حساب يسيء استخدام المنصة أو يرسل محتوى مخالفاً أو مضللاً.'],
 ['المراسلات','تُحجب أرقام الهواتف والبريد الإلكتروني تلقائياً داخل المحادثة بين العميل والشركة. لا تُرسل عبر المحادثة صور جواز السفر أو بيانات البطاقات المصرفية.'],
 ['حدود المسؤولية','لا تتحمل وجهة مسؤولية التزام الشركة بتنفيذ الرحلة أو الاسترداد؛ تواصل مع الشركة أولاً عبر المحادثة في صفحة عرضها. وشارة «موثّقة» تظهر فقط عند تحققنا من بيانات الجهة، وهي تعكس المعلومات المتوفرة لدينا وقت التحقق ولا تُعد ضماناً.'],
 ['القانون واختصاص القضاء','تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص محاكم القاهرة بالنظر في أي نزاع، مع عدم الإخلال بحقوقك كمستهلك.'],
 ['التعديل','قد نحدّث هذه الشروط، وتاريخ آخر تحديث مذكور أعلاه. استمرار استخدامك للموقع بعد التحديث يعني قبوله.']]],
 en:['Terms of use',[
 ['Who we are','Wijha is an online platform that lists Hajj, Umrah and outbound trip offers published by third parties, such as travel companies, agents and organisers, so you can compare them and contact the publisher. A "Verified" badge is shown only on the pages of publishers whose details we have checked; the presence or absence of the badge is not a guarantee that a trip will run. Wijha is not a travel agency and does not sell trips itself.'],
 ['The contract','Your trip contract is directly between you and the organising company, on the terms shown in the offer. Wijha is not a party to it, takes no percentage of the trip price and does not receive booking money.'],
 ['Accuracy of offers','Prices, programmes and dates are as published by the companies. Wijha may list offers it collected from a company\'s public material; these are clearly labelled "collected by Wijha" until the company adopts them. Always confirm details and availability with the company before paying.'],
 ['Your account','You are responsible for the accuracy of your details and the secrecy of your password. We may suspend accounts that abuse the platform or post misleading or unlawful content.'],
 ['Messages','Phone numbers and emails are blocked automatically in the chat between a client and a company. Do not send passport images or bank-card details through chat.'],
 ['Limits of responsibility','Wijha is not responsible for a company delivering the trip or issuing refunds; raise any problem with the company first, through the chat on its offer page. The "Verified" badge is shown only where we have verified the publisher\'s details; it reflects the information we held at the time of checking and is not a guarantee.'],
 ['Governing law','These terms are governed by the laws of the Arab Republic of Egypt and the Cairo courts have jurisdiction, without affecting your rights as a consumer.'],
 ['Changes','We may update these terms; the date of the latest update is shown above. Continuing to use the site after an update means you accept it.']]]},
privacy:{ar:['سياسة الخصوصية',[
 ['ما الذي نجمعه','بيانات الحساب (الاسم، البريد الإلكتروني، رقم الهاتف)، وما تحفظه أو تقارنه من رحلات، ورسائلك للشركات، وإحصاءات استخدام مجهولة الهوية إذا وافقت عليها.'],
 ['من يرى بياناتك','بيانات تسجيلك لا يطّلع عليها موظفو وجهة. عندما ترسل استفساراً أو رسالة لشركة، تصل بياناتك اللازمة للتواصل (الاسم ورقم الهاتف ومحتوى الرسالة) إلى تلك الشركة وحدها. لا نبيع بياناتك ولا نشاركها لأغراض إعلانية.'],
 ['المستندات','إن طلبت منك شركة مستندات للسفر (جواز، هوية، كشف حساب…) فستُرفع عبر رابط خاص بعيد عن الموقع الرئيسي، وتُخزَّن مشفّرة في مساحة منفصلة، ولا يراها إلا من تتولى حجزك، وتُحذف تلقائياً بعد ٣٠ يوماً من انتهاء الرحلة. كل فتح أو تنزيل لمستند يُسجَّل.'],
 ['مدة الاحتفاظ','نحتفظ ببيانات الحساب ما دام الحساب قائماً، ويحق لك طلب حذفه (انظر «حقوقك»). المحادثات والاستفسارات تُحفظ للمدة اللازمة لمتابعة الحجز والشكاوى.'],
 ['حقوقك','وفق قانون حماية البيانات الشخصية المصري رقم ١٥١ لسنة ٢٠٢٠ يحق لك الاطلاع على بياناتك وتصحيحها وطلب حذفها أو الاعتراض على معالجتها. قناة تقديم هذه الطلبات قيد الإعداد وستُعلَن في هذه الصفحة.'],
 ['الأمان','نستخدم اتصالاً مشفراً، وقواعد صلاحيات صارمة على قاعدة البيانات، وفصلاً بين المستندات وبقية بيانات الموقع. لا يوجد نظام آمن بنسبة ١٠٠٪؛ نبلغك ونبلغ الجهات المختصة عند أي حادث يمس بياناتك وفق القانون.'],
 ['مزودو الخدمة','نستخدم مزودي بنية تحتية موثوقين لاستضافة الموقع وقاعدة البيانات، وأدوات حماية من الإساءة (كابتشا). قد تُعالج أدوات ذكاء اصطناعي محتوى العروض التي ترفعها الشركات، ولا تُرسل إليها مستندات العملاء الشخصية.']]],
 en:['Privacy policy',[
 ['What we collect','Account details (name, email, phone), the trips you save or compare, your messages to companies, and anonymous usage statistics if you accept them.'],
 ['Who sees your data','Wijha staff do not see your sign-up details. When you send an enquiry or message to a company, the details needed to reach you (name, phone, message) go to that company only. We do not sell your data or share it for advertising.'],
 ['Documents','If a company asks you for travel documents (passport, ID, bank statement…), you upload them through a private link on a separate site, stored in a separate vault, visible only to the person handling your booking, and deleted automatically 30 days after the trip ends. Every opening or download is logged.'],
 ['Retention','We keep account data while the account exists, and you have the right to ask for deletion (see "Your rights"). Chats and enquiries are kept as long as needed to follow up bookings and complaints.'],
 ['Your rights','Under Egypt\'s Personal Data Protection Law No. 151 of 2020 you may access, correct, request deletion of, or object to processing of your data. The channel for submitting these requests is being set up and will be announced on this page.'],
 ['Security','We use encrypted connections, strict database access rules, and keep documents apart from the rest of the site data. No system is 100% secure; we notify you and the authorities of any incident affecting your data as the law requires.'],
 ['Service providers','We use trusted infrastructure providers for hosting and the database, and abuse-protection tools (captcha). AI tools may process the offer material that companies upload; clients\' personal documents are never sent to them.']]]},
cookies:{ar:['ملفات تعريف الارتباط والتخزين',[
 ['ما نستخدمه','نستخدم تخزين المتصفح الضروري فقط لتشغيل الموقع: اللغة، وجلسة الدخول، وقائمة المقارنة والمحفوظات. لا نستخدم كوكيز إعلانية ولا نتتبعك عبر مواقع أخرى.'],
 ['الإحصاءات','إذا ضغطت "قبول الكل" نحفظ معرّفاً مجهولاً على جهازك لنعرف عدد الزوار الفريدين وأي العروض تثير الاهتمام. إن اخترت "الضروري فقط" نستخدم معرّفاً مؤقتاً يزول بإغلاق الصفحة.'],
 ['تغيير اختيارك','يمكنك تغيير اختيارك في أي وقت من الزر أدناه أو بمسح بيانات الموقع من إعدادات المتصفح.']]],
 en:['Cookies & storage',[
 ['What we use','Only the browser storage needed to run the site: language, sign-in session, comparison list and saved trips. We use no advertising cookies and do not track you across other sites.'],
 ['Statistics','If you press "Accept all" we keep an anonymous id on your device to count unique visitors and see which offers get interest. If you choose "Essential only" we use a temporary id that disappears when you close the page.'],
 ['Changing your mind','You can change your choice any time with the button below or by clearing the site data in your browser settings.']]]},
refund:{ar:['الاسترداد والإلغاء',[
 ['من يحدد الشروط','الاسترداد والإلغاء تحكمهما شروط الشركة المنظِّمة المعلنة في العرض (قسم "الإلغاء والاسترداد") وعقدك معها، لأن الدفع يتم لها مباشرة.'],
 ['قبل أن تدفع','اقرأ قسم الإلغاء في العرض، واطلب من الشركة توضيح أي نقطة كتابةً عبر المحادثة، واحتفظ بإيصال الدفع وعقد الحجز.'],
 ['إن حدثت مشكلة','تواصل مع الشركة أولاً. إن لم تصلا إلى حل فاحتفظ بالإيصال والعقد والمراسلات، ويمكنك اللجوء إلى جهاز حماية المستهلك.']]],
 en:['Cancellation & refunds',[
 ['Who sets the terms','Cancellation and refunds follow the organising company\'s terms shown in the offer ("Cancellation & refund" section) and your contract with it, because payment is made directly to the company.'],
 ['Before you pay','Read the cancellation section of the offer, ask the company in writing via chat to clarify anything unclear, and keep your payment receipt and booking contract.'],
 ['If something goes wrong','Contact the company first. If you cannot agree, keep your receipt, contract and messages; you may also turn to the Consumer Protection Agency.']]]}
};

function page(k,api){
  const L=api.lang;
  const pg=LEGAL[k]||LEGAL.terms, d=pg[L]||pg.ar, esc=api.esc;
  const tabs=[['terms',L==='ar'?'الشروط':'Terms'],['privacy',L==='ar'?'الخصوصية':'Privacy'],['cookies',L==='ar'?'الكوكيز':'Cookies'],['refund',L==='ar'?'الاسترداد':'Refunds']];
  const html=`<div class="wrap" style="max-width:780px;padding:28px 16px 56px">
   <nav style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px" aria-label="legal">${tabs.map(([id,n])=>`<a class="chip ${id===k?'on':''}" href="#/legal/${id}">${n}</a>`).join('')}</nav>
   <h1 style="margin:0 0 4px">${esc(d[0])}</h1><p class="note" style="margin:0 0 18px">${LEGAL_UPDATED[L]}</p>
   ${d[1].map(([h,b],i)=>`<section style="margin:0 0 16px"><h2 style="font-size:17px;margin:0 0 4px">${i+1}. ${esc(h)}</h2><p style="margin:0;line-height:1.9">${esc(b)}</p></section>`).join('')}
   ${k==='cookies'?`<button class="btn" data-wb-click="legal.reset">${L==='ar'?'تغيير اختياري':'Change my choice'}</button>`:''}</div>`;
  api.setTitle(d[0]+' — '+(L==='ar'?'وجهة':'Wijha'));
  return html;
}
/* ── cookie / storage notice ── */
function consentBanner(api){
  const L=api.lang;
  let c=null; try{ c=localStorage.getItem('wijha_consent'); }catch(e){}
  if(c||document.getElementById('cookieBar')) return;
  const b=document.createElement('div'); b.id='cookieBar'; b.setAttribute('role','dialog'); b.setAttribute('aria-label',L==='ar'?'ملفات تعريف الارتباط':'Cookies');
  b.style.cssText='position:fixed;inset:auto 12px 12px 12px;z-index:120;background:var(--surface,#fff);color:var(--ink,#1f1b16);border:1px solid var(--line,#e6e0d4);border-radius:14px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.18);display:flex;gap:12px;flex-wrap:wrap;align-items:center;max-width:720px;margin:0 auto';
  b.innerHTML=`<p style="margin:0;flex:1;min-width:220px;font-size:14px;line-height:1.7">${L==='ar'?'نستخدم التخزين الضروري لتشغيل الموقع، ويمكنك السماح بإحصاءات مجهولة تساعدنا على تحسين العروض.':'We use only the storage needed to run the site, and you can allow anonymous statistics that help us improve offers.'} <a href="#/legal/cookies">${L==='ar'?'التفاصيل':'Details'}</a></p>
   <button class="btn" id="ckEss">${L==='ar'?'الضروري فقط':'Essential only'}</button><button class="btn btn-primary" id="ckAll">${L==='ar'?'قبول الكل':'Accept all'}</button>`;
  document.body.appendChild(b);
  const set=v=>{ try{localStorage.setItem('wijha_consent',v); if(v!=='all') localStorage.removeItem('wijha_sid');}catch(e){} b.remove(); };
  b.querySelector('#ckEss').onclick=()=>set('essential'); b.querySelector('#ckAll').onclick=()=>set('all');
}
function resetConsent(api){ try{localStorage.removeItem('wijha_consent');}catch(e){} consentBanner(api); }

let API_=null;
Wijha.block('legal',{
  version:'1.1.0',
  slots:{ 'page.legal':(ctx,api)=>page(ctx.k,api) },
  actions:{ reset:(arg,el,ev,api)=>resetConsent(api) },
  expose:{ resetConsent:()=>resetConsent(API_) },
  init(api){
    API_=api;
    const show=()=>setTimeout(()=>consentBanner(api),600);
    if(document.readyState==='complete') show(); else window.addEventListener('load',show);
  }
});
})();
