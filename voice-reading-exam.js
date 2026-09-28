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
