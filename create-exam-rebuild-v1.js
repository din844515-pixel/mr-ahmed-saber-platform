/* Mr. Ahmed Saber — Create Exam rebuilt from first principles */
(function(){
  'use strict';

  const TYPES = [
    {id:'mcq', ar:'اختيار من متعدد', en:'Multiple Choice', auto:true},
    {id:'true_false', ar:'صح / خطأ', en:'True / False', auto:true},
    {id:'multi_mcq', ar:'اختيارات متعددة', en:'Multiple Answers', auto:true},
    {id:'fill_blank', ar:'أكمل الفراغ', en:'Fill in the Blank', auto:true},
    {id:'short_answer', ar:'إجابة قصيرة', en:'Short Answer', auto:false},
    {id:'essay', ar:'سؤال مقالي', en:'Essay', auto:false},
    {id:'translation_mcq', ar:'ترجمة - اختيار من متعدد', en:'Translation MCQ', auto:true}
  ];

  function isAr(){
    return (localStorage.getItem('platformLanguage') || 'en') === 'ar';
  }
  function t(ar,en){ return isAr() ? ar : en; }
  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
  function close(){
    const m=document.getElementById('examBuilderRoot');
    if(m) m.remove();
    document.body.classList.remove('exam-builder-open');
  }
  function notify(msg,ok){
    const el=document.getElementById('examBuilderMsg');
    if(!el) return;
    el.textContent=msg||'';
    el.className='exam-builder-msg '+(ok?'ok':'error');
  }

  function typeButtons(selected){
    return TYPES.map(x =>
      '<button type="button" class="eb-type '+(selected===x.id?'selected':'')+'" data-type="'+x.id+'">'+
      '<span>'+esc(isAr()?x.ar:x.en)+'</span></button>'
    ).join('');
  }

  function questionCard(index){
    const d=document.createElement('section');
    d.className='eb-question';
    d.dataset.type='';
    d.innerHTML=
      '<div class="eb-qhead"><strong>'+esc(t('السؤال ','Question ')+(index+1))+'</strong>'+
      '<button type="button" class="eb-remove" aria-label="'+esc(t('حذف السؤال','Remove question'))+'">×</button></div>'+
      '<div class="eb-label">'+esc(t('اختاري نوع السؤال أولًا','Choose the question type first'))+'</div>'+
      '<div class="eb-types">'+typeButtons('')+'</div>'+
      '<div class="eb-qbody"></div>';
    d.querySelector('.eb-remove').addEventListener('click',()=>{d.remove();renumber();});
    d.querySelectorAll('.eb-type').forEach(b=>b.addEventListener('click',()=>{
      d.dataset.type=b.dataset.type;
      d.querySelectorAll('.eb-type').forEach(x=>x.classList.toggle('selected',x===b));
      renderQuestionBody(d);
    }));
    return d;
  }

  function renumber(){
    document.querySelectorAll('#examBuilderQuestions .eb-question').forEach((d,i)=>{
      const h=d.querySelector('.eb-qhead strong');
      if(h) h.textContent=t('السؤال ','Question ')+(i+1);
    });
  }

  function input(cls,placeholder){
    return '<input type="text" class="'+cls+'" placeholder="'+esc(placeholder)+'">';
  }

  function renderQuestionBody(d){
    const type=d.dataset.type;
    const body=d.querySelector('.eb-qbody');
    if(!body) return;
    if(!type){ body.innerHTML=''; return; }

    let h='<label class="eb-label">'+esc(t('نص السؤال','Question text'))+'</label>'+
          '<textarea class="eb-text" rows="3" placeholder="'+esc(t('اكتبي السؤال هنا','Write the question here'))+'"></textarea>';

    if(type==='mcq'||type==='translation_mcq'){
      h+='<div class="eb-options">'+['A','B','C','D'].map((x)=>
        input('eb-opt','Option '+x)
      ).join('')+'</div>'+
      '<label class="eb-label">'+esc(t('الإجابة الصحيحة','Correct answer'))+'</label>'+
      '<select class="eb-correct"><option value="">'+esc(t('اختاري الإجابة الصحيحة','Choose correct answer'))+'</option>'+
      ['A','B','C','D'].map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select>';
    }else if(type==='true_false'){
      h+='<label class="eb-label">'+esc(t('الإجابة الصحيحة','Correct answer'))+'</label>'+
        '<select class="eb-correct"><option value="">'+esc(t('اختاري الإجابة الصحيحة','Choose correct answer'))+'</option>'+
        '<option value="True">'+esc(t('صح','True'))+'</option><option value="False">'+esc(t('خطأ','False'))+'</option></select>';
    }else if(type==='multi_mcq'){
      h+='<div class="eb-options">'+['A','B','C','D'].map((x)=>
        input('eb-opt','Option '+x)
      ).join('')+'</div>'+
      '<label class="eb-label">'+esc(t('الإجابات الصحيحة (مثال: A,C)','Correct answers (example: A,C)'))+'</label>'+
      input('eb-correct','A,C');
    }else if(type==='fill_blank'){
      h+='<label class="eb-label">'+esc(t('الإجابة الصحيحة','Correct answer'))+'</label>'+
        input('eb-correct',t('اكتبي الإجابة الصحيحة','Enter the correct answer'));
    }else{
      h+='<label class="eb-label">'+esc(t('الإجابة النموذجية (اختياري)','Model answer (optional)'))+'</label>'+
        '<textarea class="eb-correct" rows="3" placeholder="'+esc(t('يمكن تركها فارغة','Can be left blank'))+'"></textarea>';
    }
    body.innerHTML=h;
  }

  function getValue(el){return (el?.value||'').trim();}

  function collect(){
    const rows=[...document.querySelectorAll('#examBuilderQuestions .eb-question')];
    const questions=[];
    for(let i=0;i<rows.length;i++){
      const row=rows[i], type=row.dataset.type;
      if(!type) return {error:t('اختاري نوع السؤال رقم ','Choose a type for question ')+(i+1)};
      const text=getValue(row.querySelector('.eb-text'));
      if(!text) return {error:t('اكتبي السؤال رقم ','Write question ')+(i+1)};
      const opts=[...row.querySelectorAll('.eb-opt')].map(getValue);
      let correct=getValue(row.querySelector('.eb-correct'));
      let options=opts;

      if(type==='mcq'||type==='translation_mcq'||type==='multi_mcq'){
        if(opts.length!==4 || opts.some(x=>!x))
          return {error:t('أكملي الاختيارات في السؤال ','Complete all options in question ')+(i+1)};
        if(!correct)
          return {error:t('حددي الإجابة الصحيحة في السؤال ','Choose the correct answer for question ')+(i+1)};
        if(type==='multi_mcq'){
          correct=correct.toUpperCase().replace(/\s+/g,'');
          if(!/^[ABCD](,[ABCD])*$/.test(correct))
            return {error:t('الإجابات الصحيحة في السؤال '+(i+1)+' يجب أن تكون مثل A,C','Correct answers for question '+(i+1)+' must look like A,C')};
        }
      }else if(type==='true_false'){
        options=['True','False'];
        if(!correct) return {error:t('حددي صح أو خطأ في السؤال ','Choose True or False for question ')+(i+1)};
      }else if(type==='fill_blank'){
        options=[];
        if(!correct) return {error:t('اكتبي الإجابة الصحيحة في السؤال ','Enter the correct answer for question ')+(i+1)};
      }else{
        options=[];
      }

      questions.push({
        question_text:text,
        question_type:type,
        points:1,
        correct_answer:correct||null,
        options,
        grading_mode:(type==='short_answer'||type==='essay')?'manual':'auto'
      });
    }
    return {questions};
  }

  async function save(){
    const title=getValue(document.getElementById('examBuilderTitle'));
    const grade=getValue(document.getElementById('examBuilderGrade'));
    const duration=Number(document.getElementById('examBuilderDuration')?.value||30);
    const showAnswers=document.getElementById('examBuilderAnswers')?.value==='true';
    if(!title){notify(t('اكتبي عنوان الامتحان.','Enter the exam title.'));return;}
    if(!grade){notify(t('اختاري المرحلة.','Select the stage.'));return;}
    if(!Number.isFinite(duration)||duration<1){notify(t('اكتبي مدة صحيحة بالدقائق.','Enter a valid duration in minutes.'));return;}

    const data=collect();
    if(data.error){notify(data.error);return;}

    const db=window.sb;
    if(!db || typeof db.rpc!=='function'){
      notify(t('اتصال قاعدة البيانات غير متاح. أعيدي تحميل الصفحة.','Database connection is unavailable. Reload the page.'));
      return;
    }

    const btn=document.getElementById('examBuilderSave');
    if(btn) btn.disabled=true;
    notify(t('جاري إنشاء الامتحان وحفظ كل الأسئلة...','Creating the exam and saving all questions...'));

    try{
      const res=await db.rpc('teacher_create_exam_full',{
        p_title:title,
        p_grade:grade,
        p_duration_minutes:duration,
        p_show_answers:showAnswers,
        p_questions:data.questions
      });

      if(res.error) throw new Error(res.error.message||'Database error');
      const result=res.data;
      if(!result || result.success!==true)
        throw new Error(result?.message||t('تعذر إنشاء الامتحان.','Could not create the exam.'));

      close();
      if(typeof window.refreshTeacher==='function') await window.refreshTeacher();
      if(typeof window.refreshV9==='function') await window.refreshV9();
      alert(t('تم إنشاء الامتحان وحفظ '+result.question_count+' سؤال بنجاح ✅','Exam created and '+result.question_count+' questions saved successfully ✅'));
    }catch(err){
      console.error('exam-builder-v1',err);
      notify(t('حدث خطأ: ','Error: ')+(err?.message||err));
      if(btn) btn.disabled=false;
    }
  }

  function open(){
    close();
    const root=document.createElement('div');
    root.id='examBuilderRoot';
    root.innerHTML=
      '<div class="eb-overlay">'+
      '<div class="eb-modal" role="dialog" aria-modal="true">'+
        '<div class="eb-header"><div><h2>📝 '+esc(t('إنشاء امتحان','Create Exam'))+'</h2>'+
          '<p>'+esc(t('ابني الامتحان خطوة بخطوة، ثم احفظيه مرة واحدة.','Build the exam step by step, then save it once.'))+'</p></div>'+
          '<button type="button" class="eb-close">×</button></div>'+
        '<div class="eb-meta">'+
          '<input id="examBuilderTitle" placeholder="'+esc(t('عنوان الامتحان','Exam title'))+'">'+
          '<select id="examBuilderGrade"><option value="">'+esc(t('اختاري المرحلة','Select stage'))+'</option>'+
            ['أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات'].map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+
          '</select>'+
          '<input id="examBuilderDuration" type="number" min="1" value="30" placeholder="'+esc(t('المدة بالدقائق','Duration in minutes'))+'">'+
          '<select id="examBuilderAnswers"><option value="false">'+esc(t('إخفاء الإجابات','Hide answers'))+'</option><option value="true">'+esc(t('إظهار الإجابات','Show answers'))+'</option></select>'+
        '</div>'+
        '<div class="eb-section-head"><strong>'+esc(t('الأسئلة','Questions'))+'</strong>'+
          '<button type="button" id="examBuilderAdd" class="eb-add">+ '+esc(t('إضافة سؤال','Add question'))+'</button></div>'+
        '<div id="examBuilderQuestions"></div>'+
        '<div id="examBuilderMsg" class="exam-builder-msg"></div>'+
        '<button type="button" id="examBuilderSave" class="eb-save">'+esc(t('إنشاء الامتحان وحفظه','Create Exam & Save'))+'</button>'+
      '</div></div>';

    document.body.appendChild(root);
    document.body.classList.add('exam-builder-open');

    root.querySelector('.eb-close').onclick=close;
    root.querySelector('.eb-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)close();});
    root.querySelector('#examBuilderAdd').onclick=()=>{
      const q=questionCard(document.querySelectorAll('#examBuilderQuestions .eb-question').length);
      document.getElementById('examBuilderQuestions').appendChild(q);
      q.scrollIntoView({behavior:'smooth',block:'nearest'});
    };
    root.querySelector('#examBuilderSave').onclick=save;

    root.querySelector('#examBuilderAdd').click();
  }

  function bind(){
    const candidates=document.querySelectorAll('#directCreateExamBtn,button,a,[role="button"],.dash-action');
    candidates.forEach(el=>{
      const label=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const match=el.id==='directCreateExamBtn'||label==='create exam'||label==='إنشاء امتحان'||label.includes('create exam');
      if(!match || el.dataset.examBuilderBound==='1') return;
      el.dataset.examBuilderBound='1';
      el.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        open();
      },true);
    });
  }

  window.openCreateExam=open;
  window.__examCreateButton=open;
  window.__examCreateRebuilt=true;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind);
  else bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(bind,250);
  setTimeout(bind,1000);
  setTimeout(bind,2500);
})();
