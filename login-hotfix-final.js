(()=>{\n  'use strict';\n  let busy=false;\n  const byId=id=>document.getElementById(id);\n  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));\n  function err(title,msg,type){\n    if(typeof window.show==='function') window.show('<h2>'+esc(title)+'</h2><p class="sub">'+esc(msg)+'</p><button class="submit" onclick="closeModal()">رجوع ←</button>');\n    else alert(msg);\n  }\n  window.studentLogin=async function(){\n    if(busy)return; busy=true;\n    try{\n      const code=(byId('loginCode')?.value||'').trim();\n      if(!code){err('دخول الطالب','الرجاء إدخال كود الطالب.','student');return;}\n      let data,error;\n      ({data,error}=await sb.rpc('student_login',{p_code:code}));\n      if(error){\n        const fallback=await sb.rpc('student_portal',{p_code:code});\n        data=fallback.data; error=fallback.error;\n      }\n      if(error)throw error;\n      if(!data?.success){\n        err(data?.payment_required?'لم يتم اعتماد الاشتراك':'كود الطالب غير صحيح',data?.message||'تأكدي من الكود وحاولي مرة أخرى.','student');return;\n      }\n      const row=data.student||{};\n      localStorage.setItem('student_code',code); sessionStorage.setItem('student_code',code);\n      if(row.name){localStorage.setItem('student_name',row.name);sessionStorage.setItem('student_name',row.name);}\n      if(typeof window.loadStudentPortal==='function') await window.loadStudentPortal();\n      else if(typeof window.closeModal==='function') window.closeModal();\n    }catch(e){console.error('FINAL student login',e);err('تعذر تسجيل الدخول',e?.message||'حدث خطأ أثناء الاتصال بالمنصة.','student');}\n    finally{busy=false;}\n  };\n  window.teacherLogin=async function(){\n    if(busy)return; busy=true;\n    try{\n      const email=(byId('teacherEmail')?.value||'').trim(), password=byId('teacherPassword')?.value||'';\n      if(!email||!password){err('دخول المستر','الرجاء إدخال البريد الإلكتروني وكلمة المرور.','teacher');return;}\n      const {data,error}=await sb.auth.signInWithPassword({email,password});\n      if(error||!data?.user)throw(error||new Error('تعذر تسجيل الدخول.'));\n      if(data.user.app_metadata?.role!=='teacher'){await sb.auth.signOut({scope:'local'}).catch(()=>{});throw new Error('هذا الحساب ليس حساب مستر.');}\n      localStorage.setItem('teacher_session','1');\n      if(typeof window.loadTeacherDashboard==='function') await window.loadTeacherDashboard();\n      else if(typeof window.closeModal==='function') window.closeModal();\n    }catch(e){\n      console.error('FINAL teacher login',e);\n      try{const {data}=await sb.auth.getSession();if(data?.session?.user?.app_metadata?.role==='teacher'&&typeof window.loadTeacherDashboard==='function'){await window.loadTeacherDashboard();return;}}catch(_){}\n      err('تعذر تسجيل الدخول',e?.message||'حدث خطأ أثناء الاتصال بالمنصة.','teacher');\n    }finally{busy=false;}\n  };\n  async function restore(){try{const {data}=await sb.auth.getSession();if(data?.session?.user?.app_metadata?.role==='teacher'&&!byId('teacherDashboard')&&typeof window.loadTeacherDashboard==='function')await window.loadTeacherDashboard();}catch(e){console.error('FINAL restore',e)}}\n  if(window.sb?.auth){sb.auth.onAuthStateChange((ev,s)=>{if((ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED')&&s?.user?.app_metadata?.role==='teacher')setTimeout(restore,0)});}\n  window.addEventListener('pageshow',()=>setTimeout(restore,100));\n})();\n

/* exams-buttons-hotfix-v1 */
(function(){
  'use strict';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const isImport=t=>{t=norm(t);return t.includes('استيراد')&&t.includes('pdf') || t.includes('import')&&t.includes('pdf');};
  const isCreate=t=>{t=norm(t);return (t==='إنشاء امتحان'||t==='انشاء امتحان'||t==='create exam'||t.includes('create exam'))&&!t.includes('قراءة')&&!t.includes('pronunciation');};
  const get=(id)=>document.getElementById(id);
  const tr=(en,ar)=>((localStorage.getItem('platformLanguage')||'en')==='ar'?ar:en);

  function showCreateForm(prefill){
    const p=prefill||{};
    if(typeof window.show!=='function'){ alert(tr('Create Exam is ready, but the platform modal is unavailable.','زر إنشاء الامتحان يعمل لكن نافذة المنصة غير متاحة حاليًا.')); return; }
    const grades=[
      ['1st Preparatory','أولى إعدادي'],['2nd Preparatory','ثانية إعدادي'],['3rd Preparatory','ثالثة إعدادي'],
      ['1st Secondary','أولى ثانوي'],['2nd Secondary','ثانية ثانوي'],['3rd Secondary','ثالثة ثانوي'],['Courses','كورسات']
    ];
    const opts=grades.map(([en,ar])=>'<option value="'+ar+'">'+tr(en,ar)+'</option>').join('');
    show('<h2>📝 '+tr('Create Exam','إنشاء امتحان')+'</h2>'+
      '<p class="sub">'+tr('Write one question per line.','اكتبي سؤالًا واحدًا في كل سطر.')+'</p>'+
      '<div class="form-grid">'+
      '<input id="hf_exam_title" class="input" placeholder="'+tr('Exam title','عنوان الامتحان')+'" value="'+String(p.title||'').replace(/"/g,'&quot;')+'">'+
      '<select id="hf_exam_grade" class="input">'+opts+'</select>'+
      '<input id="hf_exam_dur" class="input" type="number" min="1" value="'+Number(p.duration||15)+'" placeholder="'+tr('Minutes','الدقائق')+'">'+
      '<textarea id="hf_exam_questions" class="input full" style="height:220px" placeholder="'+tr('One question per line...','سؤال واحد في كل سطر...')+'">'+String(p.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</textarea>'+
      '</div>'+
      '<button class="submit" onclick="window.__hfCreateExamSave()">✅ '+tr('Create Exam','إنشاء الامتحان')+'</button>');
    const grade=get('hf_exam_grade'); if(grade)grade.value=p.grade||grade.value;
  }

  window.__hfCreateExamSave=async function(){
    const title=(get('hf_exam_title')?.value||'').trim()||tr('New Exam','امتحان جديد');
    const grade=(get('hf_exam_grade')?.value||'كورسات').trim();
    const duration=Math.max(1,Number(get('hf_exam_dur')?.value||15));
    const lines=(get('hf_exam_questions')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length){alert(tr('Add at least one question.','أضيفي سؤالًا واحدًا على الأقل.'));return;}
    try{
      const ce=await sb.rpc('teacher_create_exam',{p_title:title,p_grade:grade,p_duration_minutes:duration,p_show_answers:false});
      if(ce.error||!ce.data?.success)throw(ce.error||new Error(ce.data?.message||'تعذر إنشاء الامتحان.'));
      for(const line of lines){
        const q=await sb.rpc('teacher_add_exam_question',{
          p_exam_id:ce.data.exam_id,
          p_question_text:line,
          p_question_type:'text',
          p_points:1,
          p_correct_answer:null,
          p_options:[],
          p_grading_mode:'manual'
        });
        if(q.error||!q.data?.success)throw(q.error||new Error(q.data?.message||'تعذر حفظ أحد الأسئلة.'));
      }
      if(typeof window.closeModal==='function')window.closeModal();
      if(typeof window.refreshTeacher==='function')await window.refreshTeacher();
      if(typeof window.showTeacherSection==='function')window.showTeacherSection('exams');
      else if(typeof window.loadTeacherDashboard==='function')await window.loadTeacherDashboard();
      alert(tr('Exam created successfully.','تم إنشاء الامتحان بنجاح.'));
    }catch(e){
      console.error('EXAMS HOTFIX',e);
      alert(e?.message||tr('Could not create the exam.','تعذر إنشاء الامتحان.'));
    }
  };

  async function loadPdfJs(){
    if(window.pdfjsLib)return window.pdfjsLib;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
    if(window.pdfjsLib)window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return window.pdfjsLib;
  }

  async function importPdf(file){
    try{
      const pdfjs=await loadPdfJs();
      const buf=await file.arrayBuffer();
      const pdf=await pdfjs.getDocument({data:buf}).promise;
      const lines=[];
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n);
        const tc=await page.getTextContent();
        let line='';
        for(const it of tc.items){
          if(it.hasEOL){line+=(line?' ':'')+(it.str||''); if(line.trim()){lines.push(line.trim());line='';}}
          else line+=(line?' ':'')+(it.str||'');
        }
        if(line.trim())lines.push(line.trim());
      }
      const cleaned=lines.map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>1);
      showCreateForm({title:file.name.replace(/\.pdf$/i,''),text:cleaned.join('\n\n')});
    }catch(e){
      console.error('PDF IMPORT HOTFIX',e);
      alert(tr('Could not read this PDF. Please try another PDF.','تعذر قراءة ملف الـ PDF. جرّبي ملفًا آخر.'));
    }
  }

  function handleClick(e){
    let el=e.target;
    while(el&&el!==document.body){
      const text=el.innerText||el.textContent||'';
      if(isImport(text)){
        e.preventDefault(); e.stopPropagation();
        let input=get('hf_pdf_input');
        if(!input){
          input=document.createElement('input'); input.type='file'; input.accept='application/pdf,.pdf'; input.id='hf_pdf_input';
          input.style.display='none'; document.body.appendChild(input);
          input.onchange=()=>{const f=input.files?.[0]; if(f)importPdf(f); input.value='';};
        }
        input.click(); return;
      }
      if(isCreate(text)){
        e.preventDefault(); e.stopPropagation();
        if(typeof window.__standaloneOpenExamDirect==='function') window.__standaloneOpenExamDirect(e); else if(typeof window.__robustOpenCreateExam==='function') window.__robustOpenCreateExam(e); else window.openCreateExam(e); return;
      }
      el=el.parentElement;
    }
  }

  document.addEventListener('click',handleClick,true);
})();

/* exams-buttons-final-v2 */
(function(){
  function ar(){return (localStorage.getItem('platformLanguage')||'en')==='ar';}
  function close(){var x=document.getElementById('examFinalBox');if(x)x.remove();}
  function addQuestion(){
    var c=document.getElementById('efQuestions'), n=c.children.length+1, d=document.createElement('div');
    d.style='border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin:8px 0;background:#fff';
    d.innerHTML='<b>'+(ar()?'السؤال ':'Question ')+n+'</b><input class="input efq" style="width:100%;margin:7px 0" placeholder="'+(ar()?'نص السؤال':'Question text')+'">'+
      '<input class="input efo" style="width:100%;margin:4px 0" placeholder="A"><input class="input efo" style="width:100%;margin:4px 0" placeholder="B"><input class="input efo" style="width:100%;margin:4px 0" placeholder="C"><input class="input efo" style="width:100%;margin:4px 0" placeholder="D">'+
      '<select class="input efc" style="width:100%;margin-top:5px"><option value="">'+(ar()?'الإجابة الصحيحة':'Correct answer')+'</option><option>A</option><option>B</option><option>C</option><option>D</option></select>'+
      '<button type="button" class="btn efremove" style="margin-top:7px">'+(ar()?'حذف السؤال':'Remove question')+'</button>';
    c.appendChild(d);d.querySelector('.efremove').onclick=function(){d.remove();};
  }
  async function save(){
    var msg=document.getElementById('efmsg'), title=document.getElementById('efTitle').value.trim(), grade=document.getElementById('efGrade').value, dur=Number(document.getElementById('efDur').value||30), show=document.getElementById('efShow').value==='true', rows=[...document.querySelectorAll('#efQuestions>div')];
    if(!title){msg.textContent=ar()?'اكتبي عنوان الامتحان.':'Enter the exam title.';return;}
    if(!rows.length){msg.textContent=ar()?'أضيفي سؤالًا واحدًا على الأقل.':'Add at least one question.';return;}
    if(!window.sb){msg.textContent=ar()?'اتصال قاعدة البيانات غير متاح.':'Database connection unavailable.';return;}
    msg.textContent=ar()?'جاري الحفظ...':'Saving...';
    try{
      var ex=await window.sb.rpc('teacher_create_exam',{p_title:title,p_grade:grade,p_duration_minutes:dur,p_show_answers:show});
      if(ex.error||!ex.data?.success)throw(ex.error||new Error(ex.data?.message||'Create exam failed'));
      for(var i=0;i<rows.length;i++){
        var r=rows[i], q=(r.querySelector('.efq').value||'').trim(), opts=[...r.querySelectorAll('.efo')].map(x=>(x.value||'').trim()), c=r.querySelector('.efc').value||null;
        if(!q)throw new Error((ar()?'السؤال رقم ':'Question ')+(i+1)+(ar()?' فارغ':' is empty'));
        var rr=await window.sb.rpc('teacher_add_exam_question',{p_exam_id:ex.data.exam_id,p_question_text:q,p_question_type:'mcq',p_points:1,p_correct_answer:c,p_options:opts,p_grading_mode:'auto'});
        if(rr.error)throw rr.error;
      }
      close();if(typeof window.refreshTeacher==='function')await window.refreshTeacher();
      alert(ar()?'تم إنشاء الامتحان بنجاح ✅':'Exam created successfully ✅');
    }catch(e){msg.textContent=(ar()?'حدث خطأ: ':'Error: ')+(e?.message||e);}
  }
  window.__finalOpenExam=function(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    close();var b=document.createElement('div');b.id='examFinalBox';
    b.style='position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:14px';
    b.innerHTML='<div style="background:#fff;border-radius:18px;width:min(760px,100%);max-height:94vh;overflow:auto;padding:18px;direction:'+(ar()?'rtl':'ltr')+'"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;color:#062b57">📝 '+(ar()?'إنشاء امتحان':'Create Exam')+'</h2><button id="efx" type="button" class="btn">✕</button></div><div class="form-grid" style="margin-top:12px"><input id="efTitle" class="input" placeholder="'+(ar()?'عنوان الامتحان':'Exam Title')+'"><select id="efGrade" class="input"><option value="">'+(ar()?'اختاري المرحلة':'Select Stage')+'</option><option>أولى إعدادي</option><option>ثانية إعدادي</option><option>ثالثة إعدادي</option><option>أولى ثانوي</option><option>ثانية ثانوي</option><option>ثالثة ثانوي</option><option>كورسات</option></select><input id="efDur" class="input" type="number" min="1" value="30"><select id="efShow" class="input"><option value="false">'+(ar()?'إخفاء الإجابات':'Hide Answers')+'</option><option value="true">'+(ar()?'إظهار الإجابات':'Show Answers')+'</option></select></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><b>'+(ar()?'الأسئلة':'Questions')+'</b><button id="efadd" type="button" class="btn gold">+ '+(ar()?'إضافة سؤال':'Add Question')+'</button></div><div id="efQuestions"></div><div id="efmsg" class="sub" style="margin-top:8px"></div><button id="efsave" type="button" class="submit" style="width:100%;margin-top:10px">✅ '+(ar()?'إنشاء الامتحان وحفظه':'Create Exam & Save')+'</button></div>';
    document.body.appendChild(b);document.getElementById('efx').onclick=close;document.getElementById('efadd').onclick=addQuestion;document.getElementById('efsave').onclick=save;addQuestion();
  };
  window.__examCreateButton=window.__finalOpenExam;
  window.openCreateExam=window.__finalOpenExam;
})();
