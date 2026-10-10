(()=>{
  'use strict';
  let busy=false;
  const byId=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function err(title,msg,type){
    if(typeof window.show==='function') window.show('<h2>'+esc(title)+'</h2><p class="sub">'+esc(msg)+'</p><button class="submit" onclick="closeModal()">رجوع ←</button>');
    else alert(msg);
  }
  window.studentLogin=async function(){
    if(busy)return; busy=true;
    try{
      const code=(byId('loginCode')?.value||'').trim();
      if(!code){err('دخول الطالب','الرجاء إدخال كود الطالب.','student');return;}
      let data,error;
      ({data,error}=await sb.rpc('student_login',{p_code:code}));
      if(error){
        const fallback=await sb.rpc('student_portal',{p_code:code});
        data=fallback.data; error=fallback.error;
      }
      if(error)throw error;
      if(!data?.success){
        err(data?.payment_required?'لم يتم اعتماد الاشتراك':'كود الطالب غير صحيح',data?.message||'تأكدي من الكود وحاولي مرة أخرى.','student');return;
      }
      const row=data.student||{};
      localStorage.setItem('student_code',code); sessionStorage.setItem('student_code',code);
      if(row.name){localStorage.setItem('student_name',row.name);sessionStorage.setItem('student_name',row.name);}
      if(typeof window.loadStudentPortal==='function') await window.loadStudentPortal();
      else if(typeof window.closeModal==='function') window.closeModal();
    }catch(e){console.error('FINAL student login',e);err('تعذر تسجيل الدخول',e?.message||'حدث خطأ أثناء الاتصال بالمنصة.','student');}
    finally{busy=false;}
  };
  window.teacherLogin=async function(){
    if(busy)return; busy=true;
    try{
      const email=(byId('teacherEmail')?.value||'').trim(), password=byId('teacherPassword')?.value||'';
      if(!email||!password){err('دخول المستر','الرجاء إدخال البريد الإلكتروني وكلمة المرور.','teacher');return;}
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error||!data?.user)throw(error||new Error('تعذر تسجيل الدخول.'));
      if(data.user.app_metadata?.role!=='teacher'){await sb.auth.signOut({scope:'local'}).catch(()=>{});throw new Error('هذا الحساب ليس حساب مستر.');}
      localStorage.setItem('teacher_session','1');
      if(typeof window.loadTeacherDashboard==='function') await window.loadTeacherDashboard();
      else if(typeof window.closeModal==='function') window.closeModal();
    }catch(e){
      console.error('FINAL teacher login',e);
      try{const {data}=await sb.auth.getSession();if(data?.session?.user?.app_metadata?.role==='teacher'&&typeof window.loadTeacherDashboard==='function'){await window.loadTeacherDashboard();return;}}catch(_){}
      err('تعذر تسجيل الدخول',e?.message||'حدث خطأ أثناء الاتصال بالمنصة.','teacher');
    }finally{busy=false;}
  };
  async function restore(){try{const {data}=await sb.auth.getSession();if(data?.session?.user?.app_metadata?.role==='teacher'&&!byId('teacherDashboard')&&typeof window.loadTeacherDashboard==='function')await window.loadTeacherDashboard();}catch(e){console.error('FINAL restore',e)}}
  if(window.sb?.auth){sb.auth.onAuthStateChange((ev,s)=>{if((ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED')&&s?.user?.app_metadata?.role==='teacher')setTimeout(restore,0)});}
  window.addEventListener('pageshow',()=>setTimeout(restore,100));

  // PDF import was explicitly removed from the platform. Keep the rebuilt exam creator as the single exam workflow.
  window.openPdfImport=function(){
    document.querySelectorAll('#teacherDashboard [onclick]').forEach(el=>{
      if(/\bopenPdfImport\s*\(/.test(el.getAttribute('onclick')||'')) el.remove();
    });
  };
  window.parsePdfToExam=function(){return false;};
  function removePdfImportButton(){
    document.querySelectorAll('#teacherDashboard [onclick]').forEach(el=>{
      if(/\bopenPdfImport\s*\(/.test(el.getAttribute('onclick')||'')) el.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removePdfImportButton);
  else removePdfImportButton();
  if(document.body){
    new MutationObserver(removePdfImportButton).observe(document.body,{childList:true,subtree:true});
  }
})();
