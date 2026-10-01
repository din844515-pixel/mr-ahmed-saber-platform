from pathlib import Path
import re

p = Path("index.html")
s = p.read_text(encoding="utf-8")

patterns = [
    r'<script id="robust-create-exam-builder-v1">.*?</script>',
    r'<script id="robust-create-exam-builder-v2">.*?</script>',
    r'<script id="standalone-create-exam-v1">.*?</script>',
    r'<script id="standalone-create-exam-direct-v2">.*?</script>',
    r'<script id="create-exam-direct-final-fix">.*?</script>',
    r'<script id="create-exam-final-v[0-9]+">.*?</script>',
    r'<script id="create-exam-final-clean(?:-v[0-9]+)?">.*?</script>',
    r'<script id="create-exam-window-clean">.*?</script>',
    r'<script id="create-exam-force-clean-v1">.*?</script>',
]
for pat in patterns:
    s = re.sub(pat, "", s, flags=re.S)

s = re.sub(r'إنشاء الامتحان غير جاهز[^<]*', '', s)

if 'id="create-exam-force-clean-v2"' not in s:
    js = r'''<script id="create-exam-force-clean-v2">
(function(){
  'use strict';
  function ar(){return (localStorage.getItem('platformLanguage')||'en')==='ar';}
  function closeBox(){var x=document.getElementById('ceForce2Modal');if(x)x.remove();}
  function addQ(){
    var c=document.getElementById('ceForce2Qs');if(!c)return;
    var n=c.children.length+1,d=document.createElement('div');
    d.style='border:1px solid #e3e8ef;border-radius:12px;padding:12px;margin:10px 0;background:#fff';
    d.innerHTML='<b>'+(ar()?'السؤال ':'Question ')+n+'</b>'+
      '<input class="cef2-q input" style="width:100%;margin:5px 0" placeholder="'+(ar()?'نص السؤال':'Question text')+'">'+
      '<input class="cef2-o input" style="width:100%;margin:4px 0" placeholder="A">'+
      '<input class="cef2-o input" style="width:100%;margin:4px 0" placeholder="B">'+
      '<input class="cef2-o input" style="width:100%;margin:4px 0" placeholder="C">'+
      '<input class="cef2-o input" style="width:100%;margin:4px 0" placeholder="D">'+
      '<select class="cef2-c input" style="width:100%;margin:5px 0"><option value="">'+(ar()?'الإجابة الصحيحة':'Correct answer')+'</option><option>A</option><option>B</option><option>C</option><option>D</option></select>'+
      '<button type="button" class="btn cef2-rm">'+(ar()?'حذف السؤال':'Remove question')+'</button>';
    c.appendChild(d);
    d.querySelector('.cef2-rm').onclick=function(){d.remove();};
  }
  async function save(){
    var m=document.getElementById('ceForce2Msg');
    var title=(document.getElementById('ceForce2Title')?.value||'').trim();
    var grade=document.getElementById('ceForce2Grade')?.value||'';
    var dur=Number(document.getElementById('ceForce2Dur')?.value||30);
    var show=document.getElementById('ceForce2Show')?.value==='true';
    var rows=[...document.querySelectorAll('#ceForce2Qs>div')];
    if(!title){m.textContent=ar()?'اكتبي عنوان الامتحان.':'Enter the exam title.';return;}
    if(!grade){m.textContent=ar()?'اختاري المرحلة.':'Select the stage.';return;}
    if(!rows.length){m.textContent=ar()?'أضيفي سؤالًا واحدًا على الأقل.':'Add at least one question.';return;}
    if(!window.sb){m.textContent=ar()?'قاعدة البيانات غير متاحة.':'Database connection unavailable.';return;}
    m.textContent=ar()?'جاري إنشاء الامتحان...':'Creating exam...';
    try{
      var ex=await window.sb.rpc('teacher_create_exam',{p_title:title,p_grade:grade,p_duration_minutes:dur,p_show_answers:show});
      if(ex.error||!ex.data?.success)throw(ex.error||new Error(ex.data?.message||'Failed to create exam'));
      for(var i=0;i<rows.length;i++){
        var row=rows[i],q=(row.querySelector('.cef2-q')?.value||'').trim();
        var opts=[...row.querySelectorAll('.cef2-o')].map(function(x){return (x.value||'').trim();});
        var correct=row.querySelector('.cef2-c')?.value||null;
        if(!q)throw new Error((ar()?'السؤال رقم ':'Question ')+(i+1)+(ar()?' فارغ.':' is empty.'));
        var rr=await window.sb.rpc('teacher_add_exam_question',{
          p_exam_id:ex.data.exam_id,p_question_text:q,p_question_type:'mcq',p_points:1,
          p_correct_answer:correct,p_options:opts,p_grading_mode:'auto'
        });
        if(rr.error)throw rr.error;
      }
      closeBox();
      if(typeof window.refreshTeacher==='function')await window.refreshTeacher();
      alert(ar()?'تم إنشاء الامتحان بنجاح ✅':'Exam created successfully ✅');
    }catch(err){
      console.error('create-exam-force-clean-v2',err);
      m.textContent=(ar()?'حدث خطأ: ':'Error: ')+(err?.message||err);
    }
  }
  function open(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();}
    closeBox();
    var b=document.createElement('div');b.id='ceForce2Modal';
    b.style='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:14px';
    b.innerHTML='<div style="background:#fff;border-radius:18px;width:min(760px,100%);max-height:94vh;overflow:auto;padding:18px;direction:'+(ar()?'rtl':'ltr')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;color:#062b57">📝 '+(ar()?'إنشاء امتحان':'Create Exam')+'</h2><button id="ceForce2Close" type="button" class="btn">✕</button></div>'+
      '<div class="form-grid" style="margin-top:12px"><input id="ceForce2Title" class="input" placeholder="'+(ar()?'عنوان الامتحان':'Exam Title')+'">'+
      '<select id="ceForce2Grade" class="input"><option value="">'+(ar()?'اختاري المرحلة':'Select Stage')+'</option><option>أولى إعدادي</option><option>ثانية إعدادي</option><option>ثالثة إعدادي</option><option>أولى ثانوي</option><option>ثانية ثانوي</option><option>ثالثة ثانوي</option><option>كورسات</option></select>'+
      '<input id="ceForce2Dur" class="input" type="number" min="1" value="30">'+
      '<select id="ceForce2Show" class="input"><option value="false">'+(ar()?'إخفاء الإجابات':'Hide Answers')+'</option><option value="true">'+(ar()?'إظهار الإجابات':'Show Answers')+'</option></select></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><b>'+(ar()?'الأسئلة':'Questions')+'</b><button id="ceForce2Add" type="button" class="btn gold">+ '+(ar()?'إضافة سؤال':'Add Question')+'</button></div>'+
      '<div id="ceForce2Qs"></div><div id="ceForce2Msg" class="sub" style="margin-top:8px"></div>'+
      '<button id="ceForce2Save" type="button" class="submit" style="width:100%;margin-top:10px">✅ '+(ar()?'إنشاء الامتحان وحفظه':'Create Exam & Save')+'</button></div>';
    document.body.appendChild(b);
    document.getElementById('ceForce2Close').onclick=closeBox;
    document.getElementById('ceForce2Add').onclick=addQ;
    document.getElementById('ceForce2Save').onclick=save;
    addQ();
  }
  window.__createExamForceCleanV2=open;
  window.__examCreateButton=open;
  function isCreate(el){
    if(!el)return false;
    var t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    return t.includes('create exam')||t.includes('إنشاء امتحان');
  }
  function wire(){
    document.querySelectorAll('button,a,[role="button"],.dash-action').forEach(function(el){
      if(!isCreate(el))return;
      el.disabled=false;
      el.style.pointerEvents='auto';
      el.onclick=function(e){return open(e);};
    });
  }
  window.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('button,a,[role="button"],.dash-action'):null;
    if(isCreate(el))open(e);
  },true);
  window.addEventListener('pointerup',function(e){
    var el=e.target&&e.target.closest?e.target.closest('button,a,[role="button"],.dash-action'):null;
    if(isCreate(el)&&!document.getElementById('ceForce2Modal'))open(e);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(wire,300);setTimeout(wire,1000);setTimeout(wire,2500);
})();
</script>'''
    s=s.replace('</body>',js+'</body>') if '</body>' in s else s+js

# Make the dashboard's inline Create Exam button call the clean handler directly.
s = re.sub(r'onclick="return window\.__examCreateButton && window\.__examCreateButton\(event\)"',
           'onclick="return window.__createExamForceCleanV2(event)"', s)
s = re.sub(r'onclick="openCreateExam\(\)"',
           'onclick="return window.__createExamForceCleanV2(event)"', s)

p.write_text(s,encoding='utf-8')
