/* voice-reading-exam-v1 */
(function(){
  const esc=v=>window.escapeHtml?escapeHtml(v==null?'':String(v)):String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ar=()=>((localStorage.getItem('platformLanguage')||'en')==='ar');
  const tr=(en,arv)=>ar()?arv:en;

  function recognitionCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null}

  function ensureStudentVoiceMenu(){
    const side=document.querySelector('#studentDashboard .dash-side');
    if(!side || side.querySelector('[data-voice-reading-menu]')) return;
    const btn=document.createElement('button');
    btn.className='side-btn';
    btn.setAttribute('data-voice-reading-menu','1');
    btn.innerHTML='🎙️ '+tr('Reading Aloud','القراءة بالصوت');
    btn.onclick=()=>window.studentVoiceReadingExam&&window.studentVoiceReadingExam();
    const examBtn=Array.from(side.querySelectorAll('.side-btn')).find(b=>/Exams|الامتحانات/i.test(b.textContent));
    if(examBtn) examBtn.after(btn); else side.appendChild(btn);
  }

  window.studentVoiceReadingExam=function(){
    const d=window.__studentPortalData||{};
    const items=Array.isArray(d.pronunciation)?d.pronunciation:[];
    if(!items.length){
      return show('<h2>'+tr('Reading Aloud Exam','امتحان القراءة بالصوت')+'</h2><p class="sub">'+tr('There are no reading exercises available yet.','لا توجد تدريبات قراءة صوتية متاحة حاليًا.')+'</p><button class="submit" onclick="closeModal()">'+tr('Close','إغلاق')+'</button>');
    }
    const cards=items.map(x=>{
      const target=esc(x.target_text||'');
      return '<div class="v9-card" style="margin:9px 0;padding:12px"><h3>'+esc(x.title||tr('Reading Exercise','تدريب قراءة'))+'</h3><p class="sub">'+esc(x.course_name||'')+' '+(x.level?('• '+esc(x.level)):'')+'</p><div class="result" style="text-align:left;line-height:1.8">'+target+'</div><div class="dash-toolbar" style="margin-top:8px"><button class="dash-action" onclick="voiceListenV1('+Number(x.id)+')">🔊 '+tr('Listen','اسمع')+'</button><button class="dash-action gold" onclick="voiceStartV1('+Number(x.id)+')">🎙️ '+tr('Start Reading','ابدأ القراءة')+'</button></div></div>';
    }).join('');
    show('<h2>'+tr('Reading Aloud Exam','امتحان القراءة بالصوت')+'</h2><p class="sub">'+tr('Listen to the sentence, then read it aloud. Your browser converts your voice to text and compares it with the target sentence.','اسمعي الجملة ثم اقرئيها بصوتك. المتصفح يحول صوتك إلى نص ويقارنه بالجملة المطلوبة.')+'</p><div style="max-height:65vh;overflow:auto">'+cards+'</div>');
  };

  window.voiceListenV1=function(id){
    const items=window.__studentPortalData?.pronunciation||[];
    const x=items.find(a=>Number(a.id)===Number(id));
    if(!x || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(x.target_text||''));
    u.lang='en-US'; u.rate=.86; u.pitch=1;
    speechSynthesis.speak(u);
  };

  window.voiceStartV1=function(id){
    const items=window.__studentPortalData?.pronunciation||[];
    const x=items.find(a=>Number(a.id)===Number(id));
    if(!x) return;
    const RC=recognitionCtor();
    if(!RC){
      return show('<h2>'+tr('Microphone Not Supported','الميكروفون غير مدعوم')+'</h2><p class="sub">'+tr('Use the latest Chrome or Edge browser and allow microphone access.','استخدمي أحدث إصدار من Chrome أو Edge واسمحي للموقع باستخدام الميكروفون.')+'</p><button class="submit" onclick="studentVoiceReadingExam()">'+tr('Back','رجوع')+'</button>');
    }

    const target=String(x.target_text||'').trim();
    const rec=new RC();
    rec.lang='en-US';
    rec.continuous=false;
    rec.interimResults=true;
    rec.maxAlternatives=1;
    let started=Date.now(),finalText='',interim='';
    let running=true;

    rec.onresult=function(e){
      finalText='';
      interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const txt=e.results[i][0]?.transcript||'';
        if(e.results[i].isFinal) finalText+=txt+' ';
        else interim+=txt+' ';
      }
      const live=document.getElementById('voiceLiveV1');
      if(live) live.textContent=(finalText+interim).trim()||tr('Listening…','جاري الاستماع…');
    };
    rec.onerror=function(e){
      running=false;
      const msg=e.error==='not-allowed'
        ?tr('Microphone permission was denied.','تم رفض إذن الميكروفون.')
        :tr('Voice recognition error: ','حدث خطأ في التعرف على الصوت: ')+e.error;
      const st=document.getElementById('voiceStatusV1');if(st)st.textContent=msg;
    };
    rec.onend=async function(){
      if(!running)return;
      running=false;
      const transcript=finalText.trim();
      const seconds=((Date.now()-started)/1000).toFixed(1);
      const st=document.getElementById('voiceStatusV1');if(st)st.textContent=tr('Checking your reading…','جاري تقييم قراءتك…');
      const {data,error}=await sb.rpc('student_submit_pronunciation',{p_code:localStorage.getItem('student_code')||'',p_assignment_id:Number(id),p_transcript:transcript,p_duration_seconds:Number(seconds)});
      if(error||!data?.success){
        if(st)st.textContent=data?.message||error?.message||tr('Could not save the attempt.','تعذر حفظ المحاولة.');
        return;
      }
      document.getElementById('voiceResultV1').innerHTML='<div class="result"><div class="sub">'+tr('Reading Score','درجة القراءة')+'</div><div class="levelresult">'+Number(data.score||0).toFixed(0)+'%</div><p>'+esc(data.feedback||'')+'</p><p><b>'+tr('What the browser heard:','ما التقطه الميكروفون:')+'</b> '+esc(transcript||tr('No clear speech detected','لم يتم التقاط قراءة واضحة'))+'</p></div><button class="submit" onclick="studentVoiceReadingExam()">'+tr('Continue','متابعة')+' →</button>';
    };

    show('<h2>'+tr('Reading Aloud','القراءة بالصوت')+'</h2><p class="sub">'+tr('Read this sentence clearly and at a natural speed.','اقرئي الجملة بوضوح وبسرعة طبيعية.')+'</p><div class="result" style="text-align:left;font-size:16px;line-height:1.9">'+esc(target)+'</div><div class="dash-toolbar" style="margin-top:10px"><button class="dash-action" onclick="voiceListenV1('+Number(id)+')">🔊 '+tr('Listen First','اسمع أولًا')+'</button><button class="dash-action gold" id="voiceStopV1">⏹️ '+tr('Stop Reading','إيقاف القراءة')+'</button></div><div id="voiceLiveV1" class="sub" style="min-height:46px;margin-top:12px;padding:10px;background:#f7f9fc;border-radius:9px">'+tr('Listening…','جاري الاستماع…')+'</div><div id="voiceStatusV1" class="sub" style="margin-top:8px">'+tr('Speak after pressing Start.','ابدئي الكلام بعد الضغط على ابدأ.')+'</div><div id="voiceResultV1" style="margin-top:8px"></div>');
    const stop=document.getElementById('voiceStopV1');
    if(stop)stop.onclick=()=>{try{running=false;rec.stop()}catch(e){}};
    try{rec.start();}catch(e){}
  };

  // Make the existing teacher pronunciation practice explicitly a voice-reading exam.
  const oldOpen=window.openPronunciationAssignment;
  window.openPronunciationAssignment=function(){
    if(oldOpen){oldOpen();}
    setTimeout(()=>{
      const h=document.querySelector('#modalBox h2');
      if(h)h.textContent=tr('New Voice Reading Exam','إنشاء امتحان قراءة بالصوت');
      const p=document.querySelector('#modalBox .sub'); if(p)p.textContent=tr('Add a sentence that students will listen to and read aloud using the microphone.','أضيفي جملة يسمعها الطالب ثم يقرأها بصوته باستخدام الميكروفون.');
      const btn=document.querySelector('#modalBox .submit'); if(btn)btn.textContent=tr('Create Voice Reading Exam →','إنشاء امتحان القراءة بالصوت ←');
    },30);
  };

  const oldStudentRender=window.renderStudentSection;
  if(oldStudentRender && !window.__voiceRenderWrappedV1){
    window.__voiceRenderWrappedV1=true;
    window.renderStudentSection=function(section){
      const r=oldStudentRender(section);
      setTimeout(ensureStudentVoiceMenu,20);
      return r;
    };
  }

  const oldLoad=window.loadStudentPortalV2;
  if(oldLoad && !window.__voiceLoadWrappedV1){
    window.__voiceLoadWrappedV1=true;
    window.loadStudentPortalV2=async function(){
      const r=await oldLoad();
      setTimeout(ensureStudentVoiceMenu,80);
      return r;
    };
  }

  setTimeout(ensureStudentVoiceMenu,500);
})();

/* pronunciation-exam-v12-completion */
(function(){
  const tr=(en,ar)=>((localStorage.getItem('platformLanguage')||'en')==='ar'?ar:en);
  const esc=v=>window.escapeHtml?escapeHtml(v==null?'':String(v)):String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const RC=()=>window.SpeechRecognition||window.webkitSpeechRecognition||null;

  window.openPronunciationExamV12=function(){
    const cats=window.CATS||[['prep1','أولى إعدادي','1st Preparatory'],['prep2','ثانية إعدادي','2nd Preparatory'],['prep3','ثالثة إعدادي','3rd Preparatory'],['sec1','أولى ثانوي','1st Secondary'],['sec2','ثانية ثانوي','2nd Secondary'],['sec3','ثالثة ثانوي','3rd Secondary'],['courses','كورسات','Courses']];
    const opts=cats.map(c=>'<option value="'+esc(c[1])+'">'+esc(tr(c[2],c[1]))+'</option>').join('');
    show('<h2>🎙️ '+tr('Create Pronunciation Exam','إنشاء امتحان قراءة ونطق')+'</h2><p class="sub">'+tr('Each non-empty line becomes one reading question. Students will listen and then read it aloud.','كل سطر مكتوب يصبح سؤال قراءة. الطالب سيسمع الجملة ثم يقرأها بصوته.')+'</p><div class="form-grid"><input id="pv12_title" class="input" placeholder="'+tr('Exam Title','عنوان الامتحان')+'"><select id="pv12_grade" class="input">'+opts+'</select><input id="pv12_dur" class="input" type="number" min="1" value="15" placeholder="'+tr('Minutes','الدقائق')+'"><textarea id="pv12_text" class="input full" style="height:180px" placeholder="'+tr('Write one sentence per line...','اكتبي جملة واحدة في كل سطر...')+'"></textarea></div><button class="submit" onclick="savePronunciationExamV12()">'+tr('Create Exam','إنشاء الامتحان')+' →</button>');
  };

  window.savePronunciationExamV12=async function(){
    const title=document.getElementById('pv12_title')?.value.trim()||tr('Voice Reading Exam','امتحان القراءة بالصوت');
    const grade=document.getElementById('pv12_grade')?.value.trim()||'كورسات';
    const dur=Number(document.getElementById('pv12_dur')?.value||15);
    const lines=(document.getElementById('pv12_text')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length){alert(tr('Add at least one sentence.','أضيفي جملة واحدة على الأقل.'));return}
    const ce=await sb.rpc('teacher_create_exam',{p_title:title.includes('Pronunciation')?title:'🎙️ Pronunciation — '+title,p_grade:grade,p_duration_minutes:dur,p_show_answers:false});
    if(ce.error||!ce.data?.success){alert(ce.data?.message||ce.error?.message||tr('Could not create the exam.','تعذر إنشاء الامتحان.'));return}
    for(const line of lines){
      const q=await sb.rpc('teacher_add_exam_question',{p_exam_id:ce.data.exam_id,p_question_text:line,p_question_type:'pronunciation',p_points:10,p_correct_answer:null,p_options:[],p_grading_mode:'auto'});
      if(q.error||!q.data?.success){alert(q.data?.message||q.error?.message||tr('Could not save a reading question.','تعذر حفظ أحد أسئلة القراءة.'));return}
    }
    closeModal();
    if(typeof window.refreshTeacher==='function')await window.refreshTeacher();
    if(typeof window.showTeacherSection==='function')window.showTeacherSection('exams');
  };

  function renderPronunciationQuestionV12(q){
    return '<div class="v9-question" id="pv12_q_'+q.id+'"><div class="v9-qtype">🎙️ '+tr('Reading aloud','قراءة بصوت')+' • 10 pt</div><div style="font-size:15px;line-height:1.9"><b>'+esc(q.question||q.question_text||'')+'</b></div><div class="dash-toolbar" style="margin-top:8px"><button class="dash-action" onclick="pronListenV12('+q.id+')">🔊 '+tr('Listen','اسمع')+'</button><button class="dash-action gold" onclick="pronRecordV12('+q.id+')">🎙️ '+tr('Read Aloud','اقرأ بصوت')+'</button><button class="dash-action" style="display:none" id="pv12_stop_'+q.id+'">⏹️ '+tr('Stop','إيقاف')+'</button></div><div id="pv12_live_'+q.id+'" class="sub" style="margin-top:8px;padding:8px;background:#f7f9fc;border-radius:8px">'+tr('Not recorded yet','لم تتم القراءة بعد')+'</div></div>';
  }
  window.renderPronunciationQuestionV12=renderPronunciationQuestionV12;

  window.pronListenV12=function(qid){
    const q=window.__pronExamV12?.questions?.find(x=>Number(x.id)===Number(qid)); if(!q||!('speechSynthesis' in window))return;
    speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(q.question||q.question_text||''));u.lang='en-US';u.rate=.84;speechSynthesis.speak(u);
  };

  window.pronRecordV12=function(qid){
    const RCtor=RC(); if(!RCtor){alert(tr('Use Chrome or Edge for microphone reading.','استخدمي Chrome أو Edge لقراءة الصوت من الميكروفون.'));return}
    const q=window.__pronExamV12?.questions?.find(x=>Number(x.id)===Number(qid)); if(!q)return;
    if(window.__pronRecV12){try{window.__pronRecV12.stop()}catch(e){}}
    const rec=new RCtor(); rec.lang='en-US';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;
    let finalText='',interim=''; window.__pronRecV12=rec;
    const live=document.getElementById('pv12_live_'+qid),stop=document.getElementById('pv12_stop_'+qid);
    if(stop)stop.style.display='';
    rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=t+' ';else interim+=t+' ';}if(live)live.textContent=(finalText+interim).trim()||tr('Listening…','جاري الاستماع…')};
    rec.onerror=e=>{if(live)live.textContent=tr('Voice error: ','خطأ في الصوت: ')+e.error;if(stop)stop.style.display='none'};
    rec.onend=()=>{window.__pronAnswersV12=window.__pronAnswersV12||{};window.__pronAnswersV12[qid]=finalText.trim();if(live)live.textContent=finalText.trim()||tr('No clear speech detected','لم يتم التقاط قراءة واضحة');if(stop)stop.style.display='none'};
    if(stop)stop.onclick=()=>{try{rec.stop()}catch(e){}};
    try{rec.start()}catch(e){}
  };

  window.startStudentPronunciationExamV12=async function(examId,title){
    const code=localStorage.getItem('student_code')||'';
    const d=await sb.rpc('student_exam',{p_code:code,p_exam_id:examId});
    if(d.error||!d.data?.success){alert(d.error?.message||d.data?.message||tr('Could not open exam.','تعذر فتح الامتحان.'));return}
    const qs=(d.data.questions||[]).filter(q=>String(q.question_type||'')==='pronunciation');
    if(!qs.length){alert(tr('No pronunciation questions found.','لا توجد أسئلة قراءة بالصوت في هذا الامتحان.'));return}
    window.__pronExamV12={attempt_id:d.data.attempt_id,questions:qs};window.__pronAnswersV12={};
    show('<h2>🎙️ '+esc(title)+'</h2><p class="sub">'+tr('Listen first, then read each sentence aloud. The score measures how closely the browser transcript matches the target text.','اسمع الجملة ثم اقرأها بصوتك. الدرجة تقيس مدى تطابق النص الذي التقطه الميكروفون مع النص المطلوب.')+'</p><div style="max-height:58vh;overflow:auto">'+qs.map(renderPronunciationQuestionV12).join('')+'</div><button class="submit" onclick="submitPronunciationExamV12()">'+tr('Submit Reading Exam','تسليم امتحان القراءة')+' ✅</button>');
  };

  window.submitPronunciationExamV12=async function(){
    const x=window.__pronExamV12;if(!x)return;
    const answers=window.__pronAnswersV12||{};
    const {data,error}=await sb.rpc('student_submit_pronunciation_exam',{p_code:localStorage.getItem('student_code')||'',p_attempt_id:x.attempt_id,p_answers:answers});
    if(error||!data?.success){alert(data?.message||error?.message||tr('Could not submit the reading exam.','تعذر تسليم امتحان القراءة.'));return}
    closeModal();alert(tr('Reading exam submitted successfully.\nScore: ','تم تسليم امتحان القراءة بنجاح.\nالدرجة: ')+Number(data.score||0).toFixed(1)+'/'+Number(data.total_score||0).toFixed(1)+' ('+Number(data.percentage||0).toFixed(0)+'%)');
    if(typeof window.loadStudentPortalV2==='function')await window.loadStudentPortalV2();
  };
})();
