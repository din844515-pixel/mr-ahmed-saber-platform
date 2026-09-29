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
        showCreateForm(); return;
      }
      el=el.parentElement;
    }
  }

  document.addEventListener('click',handleClick,true);
})();
