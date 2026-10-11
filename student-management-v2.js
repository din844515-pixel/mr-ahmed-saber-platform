/* Student management V2 — additive, guarded enhancement for Mr. Ahmed Saber. */
(function () {
  'use strict';
  if (window.__studentManagementV2Loaded) return;
  window.__studentManagementV2Loaded = true;

  const oldRenderTeacherSection = window.renderTeacherSection;
  const state = { query: '', saving: false, deleting: false, renewing: false };
  const FIXED_STAGES = [
    { value: 'أولى إعدادي', en: '1st Preparatory', ar: 'الأول الإعدادي' },
    { value: 'ثانية إعدادي', en: '2nd Preparatory', ar: 'الثاني الإعدادي' },
    { value: 'ثالثة إعدادي', en: '3rd Preparatory', ar: 'الثالث الإعدادي' },
    { value: 'أولى ثانوي', en: '1st Secondary', ar: 'الأول الثانوي' },
    { value: 'ثانية ثانوي', en: '2nd Secondary', ar: 'الثاني الثانوي' },
    { value: 'ثالثة ثانوي', en: '3rd Secondary', ar: 'الثالث الثانوي' }
  ];
  const FILTERS = [
    { key: 'all', en: 'All Students', ar: 'كل الطلاب' },
    { key: 'أولى إعدادي', en: '1st Preparatory', ar: 'الأول الإعدادي' },
    { key: 'ثانية إعدادي', en: '2nd Preparatory', ar: 'الثاني الإعدادي' },
    { key: 'ثالثة إعدادي', en: '3rd Preparatory', ar: 'الثالث الإعدادي' },
    { key: 'أولى ثانوي', en: '1st Secondary', ar: 'الأول الثانوي' },
    { key: 'ثانية ثانوي', en: '2nd Secondary', ar: 'الثاني الثانوي' },
    { key: 'ثالثة ثانوي', en: '3rd Secondary', ar: 'الثالث الثانوي' },
    { key: '__foundation__', en: 'Foundation', ar: 'التأسيس' },
    { key: '__courses__', en: 'Courses', ar: 'الكورسات' },
    { key: '__blank__', en: 'Unassigned', ar: 'غير محدد' }
  ];

  function isArabic() {
    try { return (localStorage.getItem('platformLanguage') || 'en').toLowerCase().startsWith('ar'); }
    catch (_) { return false; }
  }
  function t(en, ar) { return isArabic() ? ar : en; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }
  function students() {
    const data = window.__teacherData || {};
    return Array.isArray(data.students) ? data.students : [];
  }
  function norm(value) { return String(value || '').trim().toLocaleLowerCase(); }
  function gradeGroup(value) {
    const v = norm(value);
    if (!v) return '__blank__';
    if (v === 'التأسيس' || v === 'تأسيس' || v.startsWith('تأسيس ') || v.startsWith('تأسيس:') || v.startsWith('التأسيس -') || v.startsWith('foundation')) return '__foundation__';
    if (v === 'كورسات' || v === 'الكورسات' || v.startsWith('كورس ') || v.startsWith('كورس:') || v.startsWith('الكورسات -') || v.startsWith('course ') || v.startsWith('courses')) return '__courses__';
    return String(value || '').trim();
  }
  function filterMatches(student, key) {
    if (key === 'all') return true;
    return gradeGroup(student.grade) === key;
  }
  function displayStage(value) {
    const raw = String(value || '').trim();
    if (!raw) return t('Unassigned', 'غير محدد');
    const known = FIXED_STAGES.find(s => s.value === raw);
    if (known) return t(known.en, known.ar);
    if (gradeGroup(raw) === '__foundation__') return raw === 'التأسيس' || raw === 'تأسيس' ? t('Foundation', 'التأسيس') : raw;
    if (gradeGroup(raw) === '__courses__') return raw === 'كورسات' || raw === 'الكورسات' ? t('Courses', 'الكورسات') : raw;
    return raw;
  }
  function studentCodeOf(s) { return String(s && (s.student_code || s.code) || '').trim(); }
  function uniqueCode(excludeId) {
    const used = new Set(students().filter(s => String(s.id) !== String(excludeId || '')).map(s => studentCodeOf(s).toUpperCase()).filter(Boolean));
    for (let i = 0; i < 100; i++) {
      const rand = (() => {
        try { const n = new Uint32Array(1); crypto.getRandomValues(n); return n[0].toString(36).toUpperCase(); }
        catch (_) { return Math.random().toString(36).slice(2).toUpperCase(); }
      })();
      const stamp = Date.now().toString(36).toUpperCase();
      const code = ('MS' + stamp.slice(-6) + rand.slice(0, 4)).slice(0, 14);
      if (!used.has(code.toUpperCase())) return code;
    }
    throw new Error(t('Could not generate a unique student code. Try again.', 'تعذر إنشاء كود فريد للطالب. حاول مرة أخرى.'));
  }
  function validPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }
  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }
  function toast(message) {
    // Keep the editor open on validation errors so the teacher does not lose entered data.
    window.alert(message);
  }
  function categoryFilter() { return window.__studentStageFilter || 'all'; }

  function renderStudents() {
    const main = document.getElementById('teacherMain');
    if (!main) return;
    const all = students().slice().sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    const active = categoryFilter();
    const visible = all.filter(s => filterMatches(s, active));
    const searched = visible;
    const activeLabel = FILTERS.find(f => f.key === active);
    const stageButtons = FILTERS.map(f => {
      const count = all.filter(s => filterMatches(s, f.key)).length;
      return `<button type="button" class="stage-tab ${active === f.key ? 'active' : ''}" data-student-stage="${esc(f.key)}" onclick="setStudentStageFilter(${JSON.stringify(f.key).replace(/</g, '\\u003c')})">${esc(isArabic() ? f.ar : f.en)}<span>${count}</span></button>`;
    }).join('');
    const rows = searched.map((s, i) => {
      const parent = String(s.parent_phone || '').trim();
      const code = studentCodeOf(s);
      const paid = s.paid === true || norm(s.payment_status) === 'تم السداد';
      const isExempt = s.exempt === true;
      const enabled = s.active !== false;
      const studentJson = JSON.stringify({
        id: s.id, name: s.name || '', student_code: code, code,
        grade: s.grade || '', parent_phone: s.parent_phone || '', phone: s.phone || '',
        email: s.email || '', gender: s.gender || 'male', paid: s.paid === true,
        exempt: isExempt, active: enabled, notes: s.notes || ''
      }).replace(/</g, '\\u003c');
      const searchable = [s.name, code, s.grade, s.parent_phone, s.phone, s.email].map(v => String(v || '')).join(' ');
      return `<tr data-student-row="1" data-student-search="${esc(searchable)}">
        <td>${i + 1}</td>
        <td><strong>${esc(s.name || '')}</strong>${parent ? '' : `<div class="parent-phone-badge">${esc(t('Guardian phone missing', 'رقم ولي الأمر غير مسجل'))}</div>`}</td>
        <td><code>${esc(code || '—')}</code></td>
        <td>${esc(displayStage(s.grade))}</td>
        <td>${esc(parent || '—')}</td>
        <td><span class="pill ${isExempt ? '' : paid ? '' : 'wait'}">${esc(isExempt ? t('Exempt', 'معفى') : paid ? t('Paid', 'تم السداد') : t('Unpaid', 'لم يتم السداد'))}</span></td>
        <td><span class="pill ${enabled ? '' : 'fail'}">${esc(enabled ? t('Active', 'فعال') : t('Suspended', 'موقوف'))}</span></td>
        <td class="student-actions">
          <button type="button" class="dash-action" onclick='openStudentEditor(${studentJson.replace(/'/g, "&#39;")})'>${esc(t('Edit', 'تعديل البيانات'))}</button>
          <button type="button" class="dash-action" onclick="renewStudentV2(${Number(s.id)})">${esc(t('Renew', 'إعادة الاشتراك يدويًا'))}</button>
          <button type="button" class="dash-action student-delete-action" onclick="deleteStudent(${Number(s.id)})">${esc(t('Delete', 'حذف الطالب'))}</button>
        </td>
      </tr>`;
    }).join('');

    main.innerHTML = `
      <style id="student-management-v2-styles">
        #teacherMain .student-v2-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}
        #teacherMain .student-v2-summary .metric{min-width:0}
        #teacherMain .student-v2-summary strong{font-size:22px;display:block;margin-top:7px}
        #teacherMain .student-v2-search{max-width:390px;min-width:220px;flex:1}
        #teacherMain .student-v2-table-wrap{overflow:auto;max-width:100%}
        #teacherMain .student-v2-table{min-width:900px;width:100%}
        #teacherMain .student-v2-table td,#teacherMain .student-v2-table th{vertical-align:middle}
        #teacherMain .student-actions{display:flex;gap:5px;flex-wrap:wrap}
        #teacherMain .student-actions .dash-action{white-space:nowrap}
        #teacherMain .student-delete-action{background:#a83232;color:#fff}
        #teacherMain .student-v2-note{font-size:12px;opacity:.8;margin-top:6px}
        #teacherMain .student-v2-empty{padding:22px;text-align:center;color:var(--muted,#66788d)}
        #teacherMain .student-v2-code-note{font-size:12px;color:#66788d;margin-top:-5px}
        #teacherMain .student-v2-required{color:#b33a3a}
        @media(max-width:700px){#teacherMain .student-v2-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#teacherMain .student-v2-search{max-width:none;min-width:100%}#teacherMain .student-actions{min-width:180px}}
      </style>
      <div class="welcome"><div><h1>${esc(t('Student Management', 'إدارة الطلاب'))}</h1><p>${esc(t('Add, search, edit, renew, and manage each student from one place. Existing student codes are preserved when editing.', 'أضف الطلاب وابحث عنهم وعدّل بياناتهم وجدّد اشتراكاتهم من مكان واحد. كود الطالب الحالي يظل ثابتًا عند تعديل البيانات.'))}</p></div><div class="dash-toolbar"><button type="button" class="dash-action gold" onclick="openStudentEditor()">+ ${esc(t('Add Student', 'إضافة طالب'))}</button></div></div>
      <div class="student-v2-summary">
        <section class="metric"><b>${esc(t('Total Students', 'إجمالي الطلاب'))}</b><strong>${all.length}</strong></section>
        <section class="metric"><b>${esc(t('Active Access', 'حسابات فعالة'))}</b><strong>${all.filter(s => s.active !== false).length}</strong></section>
        <section class="metric"><b>${esc(t('Missing Guardian Phone', 'بدون رقم ولي أمر'))}</b><strong>${all.filter(s => !String(s.parent_phone || '').trim()).length}</strong></section>
      </div>
      <section class="panel"><div class="stage-tabs">${stageButtons}</div>
        <div class="dash-toolbar"><input type="search" class="dash-input student-v2-search" id="studentSearch" value="${esc(state.query)}" placeholder="${esc(t('Search name, code, or guardian phone', 'ابحث بالاسم أو الكود أو رقم ولي الأمر'))}" oninput="filterStudents()"><span class="badge-soft" id="studentV2Count">${searched.length} / ${visible.length}</span></div>
        <div class="stage-list-title"><b>${esc(activeLabel ? (isArabic() ? activeLabel.ar : activeLabel.en) : t('Students', 'الطلاب'))}</b><span id="studentV2StageCount">${searched.length}</span><button type="button" class="dash-action" onclick='openStudentEditor({grade:${JSON.stringify(gradeForFilter(active)).replace(/'/g, "&#39;").replace(/</g, '\\u003c')}})'>+ ${esc(t('Add to this list', 'إضافة طالب لهذه القائمة'))}</button></div>
        <div class="student-v2-table-wrap"><table class="dash-table student-v2-table" id="studentsTable"><thead><tr><th>${esc(t('No.', 'م'))}</th><th>${esc(t('Student Name', 'اسم الطالب'))}</th><th>${esc(t('Student Code', 'كود الطالب'))}</th><th>${esc(t('Stage / Course', 'المرحلة / الكورس'))}</th><th>${esc(t('Guardian Phone', 'رقم ولي الأمر'))}</th><th>${esc(t('Subscription Status', 'حالة الاشتراك'))}</th><th>${esc(t('Account Status', 'حالة الحساب'))}</th><th>${esc(t('Actions', 'الإجراءات'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="8" class="student-v2-empty">${esc(t('No students in this list yet.', 'لا يوجد طلاب في هذه القائمة حتى الآن.'))}</td></tr>`}</tbody></table></div>
        <p class="student-v2-note">${esc(t('Paid status is read-only here. Renewals are handled through the renewal workflow; there are no bulk paid/unpaid controls.', 'حالة السداد للعرض فقط هنا. يتم التجديد من خلال إجراء إعادة الاشتراك، ولا توجد أزرار سداد جماعي.'))}</p>
      </section>`;
    applyStudentSearch(state.query);
  }

  function stageOptionsForForm() {
    const dynamic = new Set();
    students().forEach(s => {
      const g = String(s.grade || '').trim();
      if (/^(تأسيس|التأسيس)\s*[-:：]/i.test(g) || /^(كورس|الكورسات|كورسات|course|courses)\s*[-:：]/i.test(g)) dynamic.add(g);
    });
    return [
      { value: '', label: t('Choose a stage/course', 'اختر المرحلة أو الكورس') },
      ...FIXED_STAGES.map(s => ({ value: s.value, label: t(s.en, s.ar) })),
      { value: 'التأسيس', label: t('Foundation — general', 'التأسيس — مستوى عام') },
      { value: 'كورسات', label: t('Courses — general', 'الكورسات — مستوى عام') },
      ...Array.from(dynamic).sort((a, b) => a.localeCompare(b, 'ar')).map(g => ({ value: g, label: g }))
    ];
  }
  function openStudentEditor(student) {
    const s = student ? { ...student } : {};
    const isEdit = !!s.id;
    window.__studentManagementV2Original = s;
    const currentCode = studentCodeOf(s);
    const opts = stageOptionsForForm().map(o => `<option value="${esc(o.value)}" ${String(s.grade || '') === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
    const gender = String(s.gender || 'male').toLowerCase();
    const content = `<h2>${esc(isEdit ? t('Edit Student', 'تعديل بيانات الطالب') : t('Add Student', 'إضافة طالب'))}</h2>
      <p class="sub">${esc(isEdit ? t('Update the student data. The existing login code and account/payment state will stay unchanged.', 'عدّل بيانات الطالب. سيظل كود الدخول وحالة الحساب والسداد كما هي.') : t('Enter the required details. Leave the code empty to create a unique code automatically.', 'أدخل البيانات المطلوبة. اترك خانة الكود فارغة لإنشاء كود فريد تلقائيًا.'))}</p>
      <div class="form-grid">
        <label>${esc(t('Student Name', 'اسم الطالب'))} <span class="student-v2-required">*</span><input id="st_name" class="input" required maxlength="160" autocomplete="name" placeholder="${esc(t('Student Name', 'اسم الطالب'))}" value="${esc(s.name || '')}"></label>
        <label>${esc(t('Student Code', 'كود الطالب'))}${isEdit ? '' : ''}<input id="st_code" class="input" maxlength="40" autocomplete="off" placeholder="${esc(isEdit ? currentCode : t('Optional — auto-generate if blank', 'اختياري — يُنشأ تلقائيًا إذا تُرك فارغًا'))}" value="${esc(currentCode)}" ${isEdit && currentCode ? 'readonly' : ''}></label>
        ${!isEdit ? `<p class="student-v2-code-note">${esc(t('The code must be unique. It will be displayed after the student is saved.', 'يجب أن يكون الكود فريدًا، وسيظهر بعد حفظ الطالب.'))}</p>` : `<p class="student-v2-code-note">${esc(t('This code is kept unchanged so the student can continue using the same login.', 'لن يتغير هذا الكود حتى يظل الطالب يستخدم نفس بيانات الدخول.'))}</p>`}
        <label>${esc(t('Stage / Course', 'المرحلة / الكورس'))} <span class="student-v2-required">*</span><select id="st_grade" class="input" required>${opts}</select></label>
        <label>${esc(t('Guardian Phone', 'رقم ولي الأمر'))} <span class="student-v2-required">*</span><input id="st_parent" class="input" required inputmode="tel" maxlength="24" autocomplete="tel" placeholder="${esc(t('Guardian Phone', 'رقم ولي الأمر'))}" value="${esc(s.parent_phone || '')}"></label>
        <label>${esc(t('Student Phone', 'رقم الطالب'))}<input id="st_phone" class="input" inputmode="tel" maxlength="24" autocomplete="tel" placeholder="${esc(t('Student Phone (optional)', 'رقم الطالب (اختياري)'))}" value="${esc(s.phone || '')}"></label>
        <label>${esc(t('Email Address', 'البريد الإلكتروني'))} <span class="student-v2-required">*</span><input id="st_email" class="input" type="email" maxlength="254" autocomplete="email" placeholder="${esc(t('Email Address', 'البريد الإلكتروني'))}" value="${esc(s.email || '')}" ${isEdit ? '' : 'required'}></label>
        <label>${esc(t('Gender', 'النوع'))}<select id="st_gender" class="input"><option value="male" ${gender === 'male' ? 'selected' : ''}>${esc(t('Male', 'ذكر'))}</option><option value="female" ${gender === 'female' ? 'selected' : ''}>${esc(t('Female', 'أنثى'))}</option></select></label>
        <label>${esc(t('Access Type', 'نوع الدخول'))}<select id="st_exempt" class="input"><option value="false" ${!s.exempt ? 'selected' : ''}>${esc(t('Normal student (subscription required)', 'طالب عادي (الاشتراك مطلوب)'))}</option><option value="true" ${s.exempt ? 'selected' : ''}>${esc(t('Exempt (free access)', 'معفى (دخول مجاني)'))}</option></select></label>
        <label class="full">${esc(t('Notes', 'ملاحظات'))}<textarea id="st_notes" class="input full" maxlength="2000" style="height:80px" placeholder="${esc(t('Notes', 'ملاحظات'))}">${esc(s.notes || '')}</textarea></label>
      </div><button id="student-save-btn" class="submit" type="button" onclick="saveStudent(${Number(s.id || 0)})">${esc(t('Save Student', 'حفظ بيانات الطالب'))} →</button>`;
    if (typeof window.show === 'function') window.show(content);
    else window.alert(t('The student form is unavailable.', 'نموذج الطالب غير متاح حاليًا.'));
  }

  async function saveStudent(id) {
    if (state.saving) return;
    const original = window.__studentManagementV2Original || {};
    const input = key => document.getElementById(key);
    const name = (input('st_name')?.value || '').trim();
    const grade = (input('st_grade')?.value || '').trim();
    const parentPhone = (input('st_parent')?.value || '').trim();
    const phone = (input('st_phone')?.value || '').trim();
    const email = (input('st_email')?.value || '').trim();
    let code = (input('st_code')?.value || '').trim();
    const gender = input('st_gender')?.value || 'male';
    const exempt = input('st_exempt')?.value === 'true';
    const notes = (input('st_notes')?.value || '').trim();

    if (!name) return toast(t('Enter the student name.', 'اكتب اسم الطالب.'));
    if (!grade) return toast(t('Choose the student stage/course.', 'اختر المرحلة أو الكورس.'));
    if (!parentPhone) return toast(t('Enter the guardian phone number.', 'اكتب رقم ولي الأمر.'));
    if (!validPhone(parentPhone)) return toast(t('Enter a valid guardian phone number (8–15 digits).', 'اكتب رقم ولي أمر صحيحًا من 8 إلى 15 رقمًا.'));
    if (!id && !email) return toast(t('Enter the student email address.', 'اكتب البريد الإلكتروني للطالب.'));
    if (email && !validEmail(email)) return toast(t('Enter a valid email address.', 'اكتب بريدًا إلكترونيًا صحيحًا.'));
    if (phone && !validPhone(phone)) return toast(t('Enter a valid student phone number.', 'اكتب رقم هاتف صحيحًا للطالب.'));

    if (id && original.id && !code) code = studentCodeOf(original);
    if (!code) {
      try { code = uniqueCode(id); }
      catch (e) { return toast(e.message || t('Unable to generate a unique code.', 'تعذر إنشاء كود فريد.')); }
    }
    const used = new Set(students().filter(s => String(s.id) !== String(id || '')).map(s => studentCodeOf(s).toUpperCase()).filter(Boolean));
    if (used.has(code.toUpperCase())) return toast(t('This student code already exists. Enter a different code.', 'كود الطالب مستخدم بالفعل. أدخل كودًا مختلفًا.'));

    const button = input('student-save-btn');
    state.saving = true;
    if (button) { button.disabled = true; button.textContent = t('Saving…', 'جارٍ الحفظ…'); }
    try {
      const payload = {
        p_name: name,
        p_student_code: code,
        p_grade: grade,
        p_parent_phone: parentPhone,
        p_phone: phone,
        p_email: email,
        p_gender: gender,
        p_paid: id ? original.paid === true : false,
        p_exempt: exempt,
        p_active: id ? original.active !== false : true,
        p_notes: notes
      };
      const response = id
        ? await sb.rpc('teacher_update_student', { p_student_id: Number(id), ...payload })
        : await sb.rpc('teacher_create_student', payload);
      const data = response && response.data;
      const error = response && response.error;
      if (error || !data || data.success !== true) {
        const message = (data && data.message) || (error && error.message) || t('The student could not be saved. No changes were confirmed.', 'تعذر حفظ الطالب. لم يتم تأكيد أي تغيير.');
        toast(message);
        return;
      }
      if (typeof window.closeModal === 'function') window.closeModal();
      window.__studentStageFilter = categoryFromGrade(grade);
      state.query = '';
      try { await window.refreshTeacher(); }
      catch (refreshError) { console.error('Student saved; dashboard refresh failed', refreshError); }
      const msg = t('Student saved successfully. Login code: ', 'تم حفظ بيانات الطالب بنجاح. كود الدخول: ') + code;
      window.alert(msg);
    } catch (error) {
      console.error('Student save error', error);
      toast(error && error.message ? error.message : t('A connection error occurred. Please try again.', 'حدث خطأ في الاتصال. حاول مرة أخرى.'));
    } finally {
      state.saving = false;
      if (button && button.isConnected) { button.disabled = false; button.textContent = t('Save Student', 'حفظ بيانات الطالب') + ' →'; }
    }
  }
  function gradeForFilter(filter) {
    if (filter === '__foundation__') return 'التأسيس';
    if (filter === '__courses__') return 'كورسات';
    if (filter === 'all' || filter === '__blank__') return '';
    return filter;
  }
  function categoryFromGrade(grade) {
    const group = gradeGroup(grade);
    if (group === '__foundation__' || group === '__courses__') return group;
    return grade || 'all';
  }

  async function deleteStudent(id) {
    if (state.deleting) return;
    const student = students().find(s => Number(s.id) === Number(id));
    if (!student) return toast(t('The student record was not found. Refresh and try again.', 'لم يتم العثور على بيانات الطالب. حدّث القائمة وحاول مرة أخرى.'));
    const ask = t('Delete ', 'هل تريد حذف الطالب ') + (student.name || '') + t(' and its related records? This cannot be undone.', ' وكل السجلات المرتبطة به؟ لا يمكن التراجع عن الحذف.');
    if (!window.confirm(ask)) return;
    state.deleting = true;
    try {
      const { data, error } = await sb.rpc('teacher_delete_student', { p_student_id: Number(id) });
      if (error || !data || data.success !== true) {
        toast((data && data.message) || (error && error.message) || t('The student could not be deleted.', 'تعذر حذف الطالب.'));
        return;
      }
      await window.refreshTeacher();
    } catch (error) {
      console.error('Student delete error', error);
      toast(error && error.message ? error.message : t('A connection error occurred.', 'حدث خطأ في الاتصال.'));
    } finally { state.deleting = false; }
  }

  async function renewStudentV2(id) {
    if (state.renewing) return;
    const student = students().find(s => Number(s.id) === Number(id));
    if (!student) return toast(t('The student record was not found. Refresh and try again.', 'لم يتم العثور على بيانات الطالب. حدّث القائمة وحاول مرة أخرى.'));
    const ask = t('Renew the monthly subscription for ', 'هل تريد إعادة الاشتراك الشهري للطالب ') + (student.name || '') + t('? The existing login code will remain unchanged.', '؟ سيظل كود الدخول الحالي كما هو.');
    if (!window.confirm(ask)) return;
    state.renewing = true;
    try {
      const { data, error } = await sb.rpc('teacher_renew_student', { p_student_id: Number(id) });
      if (error || !data || data.success !== true) {
        toast((data && data.message) || (error && error.message) || t('The subscription could not be renewed.', 'تعذر تجديد الاشتراك.'));
        return;
      }
      await window.refreshTeacher();
      toast(t('Subscription renewal completed. Student code unchanged.', 'تم تجديد الاشتراك مع الحفاظ على كود الطالب.'));
    } catch (error) {
      console.error('Student renewal error', error);
      toast(error && error.message ? error.message : t('A connection error occurred.', 'حدث خطأ في الاتصال.'));
    } finally { state.renewing = false; }
  }

  function setStudentStageFilter(stage) {
    window.__studentStageFilter = stage;
    state.query = '';
    renderStudents();
  }
  function applyStudentSearch(value) {
    const query = norm(value);
    const rows = Array.from(document.querySelectorAll('#studentsTable tbody tr[data-student-row]'));
    let count = 0;
    rows.forEach(row => {
      const match = !query || norm(row.getAttribute('data-student-search')).includes(query);
      row.style.display = match ? '' : 'none';
      if (match) {
        count++;
        const numberCell = row.querySelector('td');
        if (numberCell) numberCell.textContent = String(count);
      }
    });
    const badge = document.getElementById('studentV2Count');
    const stageCount = document.getElementById('studentV2StageCount');
    if (badge) badge.textContent = `${count} / ${rows.length}`;
    if (stageCount) stageCount.textContent = String(count);
  }
  function filterStudents() {
    const input = document.getElementById('studentSearch');
    state.query = input ? input.value : '';
    applyStudentSearch(state.query);
  }

  window.renderTeacherSection = function (sec) {
    if (sec === 'students') { renderStudents(); return; }
    if (typeof oldRenderTeacherSection === 'function') return oldRenderTeacherSection.apply(this, arguments);
  };
  window.showTeacherSection = function (sec) { return window.renderTeacherSection(sec); };
  window.setStudentStageFilter = setStudentStageFilter;
  window.filterStudents = filterStudents;
  window.openStudentEditor = openStudentEditor;
  window.saveStudent = saveStudent;
  window.deleteStudent = deleteStudent;
  window.renewStudentV2 = renewStudentV2;
  window.__studentManagementV2Ready = true;
})();
