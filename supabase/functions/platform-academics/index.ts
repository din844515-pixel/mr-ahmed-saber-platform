import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EXPECTED_KEY_HASH = "5c23b5f970c3d551469c8c917e1a53b0d2a2e19d86353117089896f60d6e5763";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV";
const STAGES = ["تأسيس","أولى إعدادي","ثانية إعدادي","ثالثة إعدادي","أولى ثانوي","ثانية ثانوي","ثالثة ثانوي","كورسات شاملة"];
const TYPES = ["single_choice","multiple_choice","true_false","short_text","fill_blanks","long_answer","listening","speaking"];
const enc = new TextEncoder();

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
function escFilter(value: string) { return value.replace(/[^0-9a-f-]/gi, ""); }
class ApiError extends Error { status: number; constructor(message: string, status = 400) { super(message); this.status = status; } }

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function db(path: string, opts: { method?: string; body?: unknown; prefer?: string } = {}) {
  if (!supabaseUrl || !serviceKey) throw new ApiError("إعدادات قاعدة البيانات غير مكتملة في الخدمة.", 500);
  const headers: Record<string, string> = { apikey: serviceKey, authorization: "Bearer " + serviceKey, accept: "application/json" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.prefer) headers["prefer"] = opts.prefer;
  const res = await fetch(supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, { method: opts.method || "GET", headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  const raw = await res.text();
  let data: any = null;
  if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }
  if (!res.ok) {
    const message = typeof data === "object" && data ? (data.message || data.details || data.hint || data.error) : "";
    throw new ApiError(String(message || "تعذر تنفيذ العملية في قاعدة البيانات."), res.status >= 500 ? 502 : res.status);
  }
  return data;
}
function needString(v: unknown, label: string, max = 180) {
  const s = String(v ?? "").trim();
  if (!s || s.length > max) throw new ApiError(label + " مطلوب.");
  return s;
}
function needStage(v: unknown) {
  const s = String(v ?? "");
  if (!STAGES.includes(s)) throw new ApiError("اختاري مرحلة دراسية صحيحة.");
  return s;
}
async function listExams() {
  const exams = await db("platform_exams?select=*&order=created_at.desc") as any[];
  if (!exams.length) return { ok: true, exams: [] };
  const questions = await db("platform_exam_questions?select=exam_id,points") as any[];
  const counts: Record<string, { count: number; points: number }> = {};
  for (const q of questions) { const v = counts[q.exam_id] || (counts[q.exam_id] = { count: 0, points: 0 }); v.count++; v.points += Number(q.points) || 0; }
  return { ok: true, exams: exams.map(e => ({ ...e, question_count: counts[e.id]?.count || 0, total_points: counts[e.id]?.points || 0 })) };
}
async function getExam(idValue: unknown) {
  const id = escFilter(String(idValue || ""));
  if (!id) throw new ApiError("معرّف الامتحان غير صحيح.");
  const exams = await db("platform_exams?select=*&id=eq." + id + "&limit=1") as any[];
  if (!exams.length) throw new ApiError("الامتحان غير موجود.", 404);
  const questions = await db("platform_exam_questions?select=*&exam_id=eq." + id + "&order=sort_order.asc") as any[];
  if (!questions.length) return { ok: true, exam: exams[0], questions: [] };
  const ids = questions.map(q => q.id).filter(Boolean);
  const keys = await db("platform_exam_answer_keys?select=question_id,answer_key,scoring_notes&question_id=in.(" + ids.map(escFilter).join(",") + ")") as any[];
  const byId: Record<string, any> = {}; for (const k of keys) byId[k.question_id] = k;
  const mapped=[];
  for (const q of questions) mapped.push({ ...q, media_preview_url: await signAcademicReadUrl(q.media_url), answer_key: byId[q.id]?.answer_key ?? null, scoring_notes: byId[q.id]?.scoring_notes ?? "" });
  return { ok: true, exam: exams[0], questions: mapped };
}
async function saveExam(body: any) {
  const exam = body.exam && typeof body.exam === "object" ? body.exam : {};
  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (questions.length > 300) throw new ApiError("الحد الأقصى 300 سؤال في الامتحان.");
  const normalized = questions.map((q: any, i: number) => {
    const question_type = String(q.question_type || "single_choice");
    if (!TYPES.includes(question_type)) throw new ApiError("نوع سؤال غير مدعوم في السؤال " + (i + 1) + ".");
    const prompt = needString(q.prompt, "نص السؤال رقم " + (i + 1), 10000);
    const points = Number(q.points ?? 1);
    if (!Number.isFinite(points) || points < 0 || points > 10000) throw new ApiError("راجعي درجة السؤال رقم " + (i + 1) + ".");
    return { question_type, prompt, options: Array.isArray(q.options) ? q.options.slice(0, 30).map((v: any) => String(v).slice(0, 500)) : [], points, media_url: String(q.media_url || "").slice(0, 2000), answer_key: q.answer_key ?? null, scoring_notes: String(q.scoring_notes || "").slice(0, 5000) };
  });
  const p_exam: any = {
    title: needString(exam.title, "اسم الامتحان"),
    instructions: String(exam.instructions || "").slice(0, 5000),
    stage: needStage(exam.stage),
    course_title: String(exam.course_title || "").slice(0, 180),
    duration_minutes: Number(exam.duration_minutes || 30),
    is_published: Boolean(exam.is_published)
  };
  if (!Number.isInteger(p_exam.duration_minutes) || p_exam.duration_minutes < 1 || p_exam.duration_minutes > 600) throw new ApiError("مدة الامتحان يجب أن تكون من دقيقة إلى 600 دقيقة.");
  if (exam.id) p_exam.id = escFilter(String(exam.id));
  const saved = await db("rpc/platform_save_exam", { method: "POST", body: { p_exam, p_questions: normalized } });
  const id = typeof saved === "object" && saved ? String(saved.id || "") : "";
  if (!id) throw new ApiError("لم تصل هوية الامتحان بعد الحفظ. راجعي قاعدة البيانات.", 502);
  return { ok: true, id, questions_saved: Number(saved.questions_saved) || normalized.length };
}
async function deleteExam(body: any) {
  const id = escFilter(String(body.id || ""));
  if (!id) throw new ApiError("معرّف الامتحان غير صحيح.");
  const attempts = await db("platform_exam_attempts?select=id&exam_id=eq." + id + "&limit=1") as any[];
  if (attempts.length) throw new ApiError("لا يمكن حذف امتحان بدأه طالب؛ احتفظي بسجل المحاولات.");
  await db("platform_exams?id=eq." + id, { method: "DELETE" });
  return { ok: true };
}
async function setExamFlag(body: any, field: "is_published" | "results_published") {
  const id = escFilter(String(body.id || ""));
  if (!id) throw new ApiError("معرّف الامتحان غير صحيح.");
  if (field === "results_published" && Boolean(body.value)) {
    const attempts = await db("platform_exam_attempts?select=id,status,submitted_at&exam_id=eq." + id) as any[];
    if (!attempts.length) throw new ApiError("لا توجد محاولات أو درجات لهذا الامتحان حتى الآن.");
    if (attempts.some((a: any) => !a.submitted_at || a.status !== "graded")) {
      throw new ApiError("لا يمكن نشر النتائج قبل تسليم وتصحيح جميع المحاولات. راجعي قسم محاولات الطلاب.");
    }
    const ids = attempts.map((a: any) => escFilter(String(a.id || ""))).filter(Boolean);
    const grades = ids.length ? await db("platform_exam_results?select=attempt_id,max_score,published_at&attempt_id=in.(" + ids.join(",") + ")") as any[] : [];
    const byAttempt: Record<string, any> = {};
    for (const g of grades) byAttempt[String(g.attempt_id)] = g;
    if (attempts.some((a: any) => !byAttempt[String(a.id)] || byAttempt[String(a.id)].max_score === null || byAttempt[String(a.id)].max_score === undefined)) {
      throw new ApiError("توجد محاولات بدون نتيجة محفوظة. افتحي التصحيح واحفظي الدرجات أولًا.");
    }
  }
  const rows = await db("platform_exams?id=eq." + id, { method: "PATCH", body: { [field]: Boolean(body.value), updated_at: new Date().toISOString() }, prefer: "return=representation" }) as any[];
  if (!rows.length) throw new ApiError("الامتحان غير موجود.", 404);
  if (field === "results_published") {
    const attempts = await db("platform_exam_attempts?select=id&exam_id=eq." + id) as any[];
    for (const a of attempts) {
      await db("platform_exam_results?attempt_id=eq." + escFilter(a.id), { method: "PATCH", body: { published_at: body.value ? new Date().toISOString() : null, updated_at: new Date().toISOString() } });
    }
  }
  return { ok: true, exam: rows[0] };
}
async function listPricing() {
  const rows = await db("platform_pricing?select=*&order=item_type.asc,education_stage.asc,item_name.asc") as any[];
  return { ok: true, pricing: rows };
}
function pricingKey(type: string, name: string, stage: string) {
  const normalize = (s: string) => s.trim().toLocaleLowerCase("ar").replace(/\s+/g, " ");
  return type === "stage" ? "stage:" + stage : "course:" + normalize(name) + "|stage:" + stage;
}
async function savePricing(body: any) {
  const p = body.pricing && typeof body.pricing === "object" ? body.pricing : {};
  const item_type = String(p.item_type || "");
  if (!["stage","course"].includes(item_type)) throw new ApiError("اختاري نوع السعر.");
  const education_stage = needStage(p.education_stage);
  const item_name = item_type === "stage" ? education_stage : needString(p.item_name, "اسم الكورس", 180);
  const price_egp = Number(p.price_egp);
  if (!Number.isFinite(price_egp) || price_egp < 0 || price_egp > 1000000) throw new ApiError("اكتبي سعرًا صحيحًا بالجنيه المصري.");
  const item_key = pricingKey(item_type, item_name, education_stage);
  const value = { item_type, item_key, item_name, education_stage, price_egp, is_active: p.is_active !== false, updated_at: new Date().toISOString() };
  let rows: any[];
  if (p.id) {
    const id = escFilter(String(p.id));
    rows = await db("platform_pricing?id=eq." + id, { method: "PATCH", body: value, prefer: "return=representation" }) as any[];
    if (!rows.length) throw new ApiError("السعر المطلوب تعديله غير موجود.",404);
  } else {
    rows = await db("platform_pricing?on_conflict=item_key", { method: "POST", body: value, prefer: "resolution=merge-duplicates,return=representation" }) as any[];
  }
  return { ok: true, pricing: rows[0] };
}
async function setPricingActive(body: any) {
  const id = escFilter(String(body.id || ""));
  if (!id) throw new ApiError("معرّف السعر غير صحيح.");
  const rows = await db("platform_pricing?id=eq." + id, { method: "PATCH", body: { is_active: Boolean(body.value), updated_at: new Date().toISOString() }, prefer: "return=representation" }) as any[];
  if (!rows.length) throw new ApiError("السعر غير موجود.",404);
  return { ok: true, pricing: rows[0] };
}
async function listAssignments() {
  const assignments = await db("platform_assignments?select=*&order=created_at.desc") as any[];
  const mapped=[];
  for (const a of assignments) mapped.push({...a,resource_url:await signAcademicReadUrl(a.resource_path)});
  return { ok: true, assignments:mapped };
}
async function saveAssignment(body: any) {
  const a = body.assignment && typeof body.assignment === "object" ? body.assignment : {};
  const value: any = { title: needString(a.title, "اسم الواجب"), instructions: String(a.instructions || "").slice(0, 5000), stage: needStage(a.stage), course_title: String(a.course_title || "").slice(0, 180), due_at: a.due_at || null, resource_path:String(a.resource_path||"").slice(0,1000)||null, resource_name:String(a.resource_name||"").slice(0,240)||null, is_published: Boolean(a.is_published), updated_at: new Date().toISOString() };
  if (a.id) value.id = escFilter(String(a.id));
  const rows = await db("platform_assignments?on_conflict=id", { method: "POST", body: value, prefer: "resolution=merge-duplicates,return=representation" }) as any[];
  return { ok: true, assignment: rows[0] };
}
async function deleteAssignment(body: any) {
  const id = escFilter(String(body.id || ""));
  if (!id) throw new ApiError("معرّف الواجب غير صحيح.");
  const submissions = await db("platform_assignment_submissions?select=id&assignment_id=eq." + id + "&limit=1") as any[];
  if (submissions.length) throw new ApiError("لا يمكن حذف واجب تم تسليمه؛ احتفظي بسجل التسليم.");
  await db("platform_assignments?id=eq." + id, { method: "DELETE" });
  return { ok: true };
}
async function setAssignmentPublished(body: any) {
  const id = escFilter(String(body.id || ""));
  if (!id) throw new ApiError("معرّف الواجب غير صحيح.");
  const rows = await db("platform_assignments?id=eq." + id, { method: "PATCH", body: { is_published: Boolean(body.value), updated_at: new Date().toISOString() }, prefer: "return=representation" }) as any[];
  if (!rows.length) throw new ApiError("الواجب غير موجود.", 404);
  return { ok: true, assignment: rows[0] };
}
async function listSubmissions(body: any) {
  const assignmentId = escFilter(String(body.assignment_id || ""));
  if (!assignmentId) throw new ApiError("اختاري الواجب أولًا.");
  const submissions = await db("platform_assignment_submissions?select=*&assignment_id=eq." + assignmentId + "&order=submitted_at.desc") as any[];
  if (!submissions.length) return { ok: true, submissions: [] };
  const ids = submissions.map(s => escFilter(String(s.student_registry_id || ""))).filter(Boolean);
  const students = await db("platform_student_registry?select=id,student_code,full_name,guardian_phone,education_stage&id=in.(" + ids.join(",") + ")") as any[];
  const byId: Record<string, any> = {}; for (const s of students) byId[s.id] = s;
  const mapped=[];
  for(const s of submissions) mapped.push({...s,attachment_url:await signAcademicReadUrl(s.attachment_path),student:byId[s.student_registry_id]||null});
  return { ok: true, submissions:mapped };
}
async function reviewSubmission(body: any) {
  const id = escFilter(String(body.id || ""));
  const status = String(body.status || "");
  if (!id || !["not_reviewed", "reviewed", "needs_rework"].includes(status)) throw new ApiError("بيانات المراجعة غير صحيحة.");
  const rows = await db("platform_assignment_submissions?id=eq." + id, { method: "PATCH", body: { status, teacher_feedback: String(body.teacher_feedback || "").slice(0, 5000), reviewed_at: new Date().toISOString() }, prefer: "return=representation" }) as any[];
  if (!rows.length) throw new ApiError("التسليم غير موجود.", 404);
  return { ok: true, submission: rows[0] };
}


const ACADEMIC_BUCKET = "platform-academic-media";
const TEACHER_ACTIONS = new Set(["listExams","getExam","saveExam","deleteExam","setExamPublished","setResultsPublished","listPricing","savePricing","setPricingActive","listAssignments","saveAssignment","deleteAssignment","setAssignmentPublished","listSubmissions","reviewSubmission","listAttempts","getAttemptReview","gradeAttempt"]);
async function authorizedTeacherSession(req: Request): Promise<boolean> {
  const authorization = String(req.headers.get("authorization") || "");
  const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (!token || token.length > 12000 || !supabaseUrl) return false;
  try {
    const response = await fetch(supabaseUrl + "/auth/v1/user", {
      method: "GET",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: "Bearer " + token, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return false;
    const user = await response.json();
    const metadata = user?.app_metadata || user?.raw_app_meta_data || {};
    const roles = Array.isArray(metadata.roles) ? metadata.roles : [];
    return metadata.role === "teacher" || metadata.role === "admin" || roles.includes("teacher") || roles.includes("admin");
  } catch (_) { return false; }
}
const AUDIO_MIME = new Set(["audio/mpeg","audio/mp3","audio/mp4","audio/aac","audio/wav","audio/webm","audio/ogg","video/mp4","video/quicktime","video/webm","video/x-m4v"]);
const ASSIGNMENT_MIME = new Set([...AUDIO_MIME,"application/pdf","image/jpeg","image/png","image/webp","image/heic","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","text/plain"]);
function cairoToday(){const a=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),p:Record<string,string>={};for(const x of a)if(x.type!=="literal")p[x.type]=x.value;return p.year+"-"+p.month+"-"+p.day}
function normPhone(v:unknown){return String(v??"").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g,"")}
function safePath(p:string){return p.split("/").map(encodeURIComponent).join("/")}
function fullStorageUrl(v:unknown){const s=String(v||"");if(!s)return "";if(/^https?:\/\//i.test(s))return s;if(s.startsWith("/storage/v1/"))return supabaseUrl.replace(/\/$/,"")+s;if(s.startsWith("/object/"))return supabaseUrl.replace(/\/$/,"")+"/storage/v1"+s;if(s.startsWith("object/"))return supabaseUrl.replace(/\/$/,"")+"/storage/v1/"+s;return ""}
function managedPath(v:unknown){const p=String(v||"");return ["exam-audio/","assignment-resources/","student-audio/","assignment-submissions/"].some(x=>p.startsWith(x))}
async function storageReq(path:string,body?:unknown){if(!supabaseUrl||!serviceKey)throw new ApiError("إعدادات التخزين غير مكتملة.",500);const r=await fetch(supabaseUrl.replace(/\/$/,"")+"/storage/v1/"+path,{method:"POST",headers:{apikey:serviceKey,authorization:"Bearer "+serviceKey,accept:"application/json","content-type":"application/json"},body:JSON.stringify(body??{})});const raw=await r.text();let d:any={};if(raw){try{d=JSON.parse(raw)}catch{d={message:raw}}}if(!r.ok)throw new ApiError(String(d.message||d.error||"تعذر إنشاء رابط ملف آمن."),r.status>=500?502:r.status);return d}
async function signAcademicReadUrl(v:unknown){const path=String(v||"");if(!path)return "";if(/^https?:\/\//i.test(path))return path;if(!managedPath(path))return "";const d=await storageReq("object/sign/"+ACADEMIC_BUCKET+"/"+safePath(path),{expiresIn:900});return fullStorageUrl(d.signedURL||d.signedUrl||d.url)}
function fileExt(name:string,mime:string){const x=String(name||"").toLowerCase().match(/\.([a-z0-9]{1,8})$/);if(x)return x[1];const m:Record<string,string>={"audio/mpeg":"mp3","audio/mp3":"mp3","audio/mp4":"m4a","audio/aac":"aac","audio/wav":"wav","audio/webm":"webm","audio/ogg":"ogg","video/mp4":"mp4","video/quicktime":"mov","video/webm":"webm","application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/heic":"heic","text/plain":"txt"};return m[mime]||"bin"}
async function createUploadUrl(body:any,student:any|null){
  const kind=String(body.file_kind||"");const teacher=!student;
  if(teacher?!(kind==="exam_audio"||kind==="assignment_resource"):!(kind==="pronunciation_answer"||kind==="assignment_submission"))throw new ApiError("نوع الملف غير مسموح لهذه العملية.");
  const mime=String(body.content_type||"application/octet-stream").toLowerCase().split(";")[0].trim(),allowed=teacher&&kind==="exam_audio"?AUDIO_MIME:teacher?ASSIGNMENT_MIME:kind==="pronunciation_answer"?AUDIO_MIME:ASSIGNMENT_MIME;
  if(!allowed.has(mime))throw new ApiError("نوع الملف غير مدعوم. اختاري صوتًا أو فيديو أو ملفًا مناسبًا.");
  const size=Number(body.file_size||0);if(!Number.isFinite(size)||size<1||size>52428800)throw new ApiError("حجم الملف يجب ألا يتجاوز 50 ميجابايت.");
  const ext=fileExt(String(body.file_name||""),mime).replace(/[^a-z0-9]/g,"").slice(0,8)||"bin",id=crypto.randomUUID();
  const folder=teacher?(kind==="exam_audio"?"exam-audio/":"assignment-resources/"):(kind==="pronunciation_answer"?"student-audio/"+student.id+"/":"assignment-submissions/"+student.id+"/");
  const path=folder+id+"."+ext,d=await storageReq("object/upload/sign/"+ACADEMIC_BUCKET+"/"+safePath(path),{upsert:false});
  let uploadUrl=fullStorageUrl(d.signedURL||d.signedUrl||d.url);if(!uploadUrl&&d.token)uploadUrl=supabaseUrl.replace(/\/$/,"")+"/storage/v1/object/upload/sign/"+ACADEMIC_BUCKET+"/"+safePath(path)+"?token="+encodeURIComponent(d.token);
  if(!uploadUrl)throw new ApiError("لم يصل رابط الرفع الآمن من التخزين.",502);
  return {ok:true,path,upload_url:uploadUrl,expires_in:7200,file_name:String(body.file_name||"").slice(0,240),content_type:mime}
}
function assertStudentActive(s:any){if(!s||s.archived)throw new ApiError("بيانات الدخول غير صالحة أو الحساب غير نشط.",401);if(String(s.payment_status)==="معفى")return;if(String(s.payment_status)!=="تم السداد"||!s.subscription_end||String(s.subscription_end)<=cairoToday())throw new ApiError("انتهى الاشتراك أو لم يتم اعتماده. برجاء مراجعة المستر لتجديد الاشتراك.",403)}
function b64url(s:string){return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function toB64Utf8(s:string){let b="";for(const c of enc.encode(s))b+=String.fromCharCode(c);return b64url(b)}
function fromB64Utf8(s:string){s=s.replace(/-/g,"+").replace(/_/g,"/");const b=atob(s+"=".repeat((4-s.length%4)%4)),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new TextDecoder().decode(u)}
async function signToken(s:string){const k=await crypto.subtle.importKey("raw",enc.encode(serviceKey),{name:"HMAC",hash:"SHA-256"},false,["sign"]),v=await crypto.subtle.sign("HMAC",k,enc.encode(s));let b="";for(const c of new Uint8Array(v))b+=String.fromCharCode(c);return b64url(b)}
async function issueToken(s:any){const p=toB64Utf8(JSON.stringify({sid:s.id,exp:Math.floor(Date.now()/1000)+43200,nonce:crypto.randomUUID()}));return p+"."+await signToken(p)}
async function currentStudent(req:Request){const t=String(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim(),parts=t.split(".");if(parts.length!==2||!parts[0]||!serviceKey)throw new ApiError("سجلي الدخول من جديد لفتح هذه الصفحة.",401);if(await signToken(parts[0])!==parts[1])throw new ApiError("جلسة الطالب غير صالحة. سجلي الدخول مرة أخرى.",401);let claims:any;try{claims=JSON.parse(fromB64Utf8(parts[0]))}catch{throw new ApiError("جلسة الطالب غير صالحة.",401)}if(!claims.sid||Number(claims.exp)<=Math.floor(Date.now()/1000))throw new ApiError("انتهت صلاحية جلسة الطالب. سجلي الدخول مرة أخرى.",401);const rows=await db("platform_student_registry?select=*&id=eq."+escFilter(String(claims.sid))+"&limit=1") as any[];if(!rows.length)throw new ApiError("حساب الطالب غير موجود.",401);assertStudentActive(rows[0]);return rows[0]}
async function studentLogin(body:any){const code=String(body.student_code||"").trim().toUpperCase(),phone=normPhone(body.student_phone);if(!code||!phone)throw new ApiError("اكتبي كود الطالب ورقم الموبايل المسجل.");const rows=await db("platform_student_registry?select=*&student_code=eq."+encodeURIComponent(code)+"&limit=1") as any[];if(!rows.length||normPhone(rows[0].student_phone)!==phone||rows[0].archived)throw new ApiError("كود الطالب أو رقم الموبايل غير صحيح.",401);assertStudentActive(rows[0]);return {ok:true,token:await issueToken(rows[0]),student:{id:rows[0].id,code:rows[0].student_code,name:rows[0].full_name,stage:rows[0].education_stage,subscription_end:rows[0].subscription_end,payment_status:rows[0].payment_status},expires_in:43200}}
function studentStageOk(s:any,stage:string){return stage===s.education_stage||stage==="كورسات شاملة"||s.education_stage==="كورسات شاملة"}
async function studentListExams(s:any){const all=await db("platform_exams?select=id,title,instructions,stage,course_title,duration_minutes,is_published,created_at&is_published=eq.true&order=created_at.desc") as any[];const exams=all.filter(e=>studentStageOk(s,String(e.stage)));const attempts=await db("platform_exam_attempts?select=id,exam_id,started_at,expires_at,submitted_at,status&student_registry_id=eq."+escFilter(String(s.id))) as any[];const byId:Record<string,any>={};for(const a of attempts)byId[a.exam_id]=a;const mapped=[];for(const e of exams){const qs=await db("platform_exam_questions?select=id,points&exam_id=eq."+escFilter(String(e.id))) as any[];mapped.push({...e,question_count:qs.length,total_points:qs.reduce((n,q)=>n+(Number(q.points)||0),0),attempt:byId[e.id]||null})}return {ok:true,student:{name:s.full_name,stage:s.education_stage},exams:mapped}}
async function studentQuestions(examId:string){const qs=await db("platform_exam_questions?select=id,exam_id,question_type,prompt,options,points,media_url,sort_order&exam_id=eq."+escFilter(examId)+"&order=sort_order.asc") as any[];const out=[];for(const q of qs)out.push({...q,media_url:await signAcademicReadUrl(q.media_url)});return out}
async function studentStartExam(body:any,s:any){const id=escFilter(String(body.exam_id||""));if(!id)throw new ApiError("الامتحان غير صحيح.");const exams=await db("platform_exams?select=*&id=eq."+id+"&is_published=eq.true&limit=1") as any[];const exam=exams[0];if(!exam||!studentStageOk(s,String(exam.stage)))throw new ApiError("الامتحان غير متاح لمرحلتك.",404);let old=await db("platform_exam_attempts?select=*&exam_id=eq."+id+"&student_registry_id=eq."+escFilter(String(s.id))+"&limit=1") as any[];let attempt=old[0];if(attempt&&attempt.submitted_at)throw new ApiError("تم تسليم هذا الامتحان من قبل، ولا يمكن إعادته.",409);if(attempt&&new Date(attempt.expires_at).getTime()<=Date.now()){await finalizeAttempt(attempt);throw new ApiError("انتهى وقت المحاولة السابقة ولا يمكن إعادة الامتحان.",409)}if(!attempt){const v=await db("platform_exam_attempts",{method:"POST",body:{exam_id:id,student_registry_id:s.id,expires_at:new Date(Date.now()+Number(exam.duration_minutes)*60000).toISOString(),status:"in_progress"},prefer:"return=representation"}) as any[];attempt=v?.[0];if(!attempt){old=await db("platform_exam_attempts?select=*&exam_id=eq."+id+"&student_registry_id=eq."+escFilter(String(s.id))+"&limit=1") as any[];attempt=old[0]}if(!attempt)throw new ApiError("تعذر بدء المحاولة. حدّثي الصفحة وحاولي مرة أخرى.",409)}const answers=await db("platform_exam_answers?select=question_id,answer_value,audio_path,answer_audio_name&attempt_id=eq."+escFilter(String(attempt.id))) as any[];const mappedAnswers=[];for(const a of answers)mappedAnswers.push({...a,audio_url:await signAcademicReadUrl(a.audio_path)});return {ok:true,exam,attempt,questions:await studentQuestions(id),answers:mappedAnswers}}
function normAnswer(v:any):string{if(v==null)return "";if(typeof v==="object"&&"value" in v)return String(v.value??"").trim().toLocaleLowerCase("en").replace(/\s+/g," ");if(typeof v==="object"&&"index" in v)return String(v.index);return String(v).trim().toLocaleLowerCase("en").replace(/\s+/g," ")}
function autoGrade(q:any,key:any,answer:any):number|null{if(!key||answer===null||answer===undefined)return null;const t=String(q.question_type);if(t==="single_choice"){const n=answer&&typeof answer==="object"&&Number.isInteger(answer.index)?Number(answer.index):Number(answer);return Number.isInteger(n)&&n===Number(key.index)?Number(q.points):0}if(t==="multiple_choice"){const a=answer&&typeof answer==="object"&&Array.isArray(answer.indices)?answer.indices.map(Number).sort((x:number,y:number)=>x-y):Array.isArray(answer)?answer.map(Number).sort((x:number,y:number)=>x-y):[];const k=Array.isArray(key.indices)?key.indices.map(Number).sort((x:number,y:number)=>x-y):[];return JSON.stringify(a)===JSON.stringify(k)?Number(q.points):0}const v=normAnswer(answer);if(t==="true_false")return v===normAnswer(key.value)?Number(q.points):0;if(["short_text","fill_blanks","listening"].includes(t)){const accepted=Array.isArray(key.accepted)?key.accepted.map((x:any)=>normAnswer(x)):[normAnswer(key.value??key.expected??"")];return accepted.filter(Boolean).includes(v)?Number(q.points):0}return null}
async function finalizeAttempt(attempt:any){const aid=escFilter(String(attempt.id)),qs=await db("platform_exam_questions?select=id,exam_id,question_type,points&exam_id=eq."+escFilter(String(attempt.exam_id))+"&order=sort_order.asc") as any[],ids=qs.map(q=>escFilter(String(q.id))),keys=ids.length?await db("platform_exam_answer_keys?select=question_id,answer_key&question_id=in.("+ids.join(",")+")") as any[]:[],keyMap:Record<string,any>={};for(const k of keys)keyMap[k.question_id]=k.answer_key;const got=await db("platform_exam_answers?select=*&attempt_id=eq."+aid) as any[],aMap:Record<string,any>={};for(const a of got)aMap[a.question_id]=a;let score=0,max=0,review=false;for(const q of qs){max+=Number(q.points)||0;let a=aMap[q.id];if(!a){const v=await db("platform_exam_answers",{method:"POST",body:{attempt_id:aid,question_id:q.id,answer_value:null,awarded_points:0},prefer:"return=representation"}) as any[];a=v?.[0]||{answer_value:null,awarded_points:0,question_id:q.id};}const has=Boolean(a.audio_path)||(a.answer_value!==null&&a.answer_value!==undefined&&normAnswer(a.answer_value)!=="");if((["long_answer","speaking"].includes(String(q.question_type))||(q.question_type==="listening"&&a.audio_path))&&has&&a.awarded_points==null){review=true;continue}let pts=autoGrade(q,keyMap[q.id],a.answer_value);if(pts!==null&&a.awarded_points==null){await db("platform_exam_answers?id=eq."+escFilter(String(a.id)),{method:"PATCH",body:{awarded_points:pts,reviewed_at:new Date().toISOString()}});a.awarded_points=pts}else if(a.awarded_points==null&&!has){await db("platform_exam_answers?id=eq."+escFilter(String(a.id)),{method:"PATCH",body:{awarded_points:0}});a.awarded_points=0}if(a.awarded_points!=null)score+=Number(a.awarded_points)||0}const status=review?"awaiting_review":"graded";await db("platform_exam_attempts?id=eq."+aid,{method:"PATCH",body:{submitted_at:attempt.submitted_at||new Date().toISOString(),status}});await db("platform_exam_results?on_conflict=attempt_id",{method:"POST",body:{attempt_id:aid,score,max_score:max,published_at:null,updated_at:new Date().toISOString()},prefer:"resolution=merge-duplicates,return=minimal"});return {ok:true,status,score,max_score:max,needs_review:review}}
async function studentSaveAnswer(body:any,s:any){const aid=escFilter(String(body.attempt_id||"")),qid=escFilter(String(body.question_id||""));if(!aid||!qid)throw new ApiError("بيانات الإجابة غير مكتملة.");const got=await db("platform_exam_attempts?select=*&id=eq."+aid+"&student_registry_id=eq."+escFilter(String(s.id))+"&limit=1") as any[],a=got[0];if(!a)throw new ApiError("المحاولة غير موجودة.",404);if(a.submitted_at||a.status!=="in_progress")throw new ApiError("تم إغلاق الامتحان ولا يمكن تغيير الإجابة.");if(new Date(a.expires_at).getTime()<=Date.now())throw new ApiError("انتهى وقت الامتحان.");const q=await db("platform_exam_questions?select=id&exam_id=eq."+escFilter(String(a.exam_id))+"&id=eq."+qid+"&limit=1") as any[];if(!q.length)throw new ApiError("السؤال لا ينتمي لهذا الامتحان.");const path=String(body.audio_path||"");if(path&&!path.startsWith("student-audio/"+s.id+"/"))throw new ApiError("ملف الصوت لا يخص حساب الطالب.");await db("platform_exam_answers?on_conflict=attempt_id,question_id",{method:"POST",body:{attempt_id:aid,question_id:qid,answer_value:body.answer_value??null,audio_path:path||null,answer_audio_name:String(body.answer_audio_name||"").slice(0,240)},prefer:"resolution=merge-duplicates,return=minimal"});return {ok:true}}
async function studentSubmitExam(body:any,s:any){const id=escFilter(String(body.attempt_id||"")),got=await db("platform_exam_attempts?select=*&id=eq."+id+"&student_registry_id=eq."+escFilter(String(s.id))+"&limit=1") as any[],a=got[0];if(!a)throw new ApiError("المحاولة غير موجودة.",404);if(a.submitted_at)return {ok:true,already_submitted:true,status:a.status};return await finalizeAttempt(a)}
async function studentListAssignments(s:any){const all=await db("platform_assignments?select=*&is_published=eq.true&order=created_at.desc") as any[],rows=all.filter(a=>studentStageOk(s,String(a.stage))),ids=rows.map(a=>escFilter(String(a.id))),subs=ids.length?await db("platform_assignment_submissions?select=*&student_registry_id=eq."+escFilter(String(s.id))+"&assignment_id=in.("+ids.join(",")+")") as any[]:[],by:Record<string,any>={};for(const x of subs)by[x.assignment_id]=x;const mapped=[];for(const a of rows){const sub=by[a.id]||null;mapped.push({...a,resource_url:await signAcademicReadUrl(a.resource_path),submission:sub?{...sub,attachment_url:await signAcademicReadUrl(sub.attachment_path)}:null})}return {ok:true,assignments:mapped}}
async function studentSubmitAssignment(body:any,s:any){const id=escFilter(String(body.assignment_id||"")),aRows=await db("platform_assignments?select=*&id=eq."+id+"&is_published=eq.true&limit=1") as any[],a=aRows[0];if(!a||!studentStageOk(s,String(a.stage)))throw new ApiError("الواجب غير متاح لحسابك.",404);if(a.due_at&&new Date(a.due_at).getTime()<Date.now())throw new ApiError("انتهى موعد تسليم الواجب.");const exist=await db("platform_assignment_submissions?select=id&assignment_id=eq."+id+"&student_registry_id=eq."+escFilter(String(s.id))+"&limit=1") as any[];if(exist.length)throw new ApiError("تم تسليم هذا الواجب من قبل؛ لا يسمح بإعادة الإرسال.",409);const text=String(body.response_text||"").trim().slice(0,20000),path=String(body.attachment_path||"");if(!text&&!path)throw new ApiError("اكتبي الإجابة أو أرفقي ملف الواجب.");if(path&&!path.startsWith("assignment-submissions/"+s.id+"/"))throw new ApiError("الملف المرفق لا يخص حسابك.");const v=await db("platform_assignment_submissions",{method:"POST",body:{assignment_id:id,student_registry_id:s.id,response_text:text,attachment_path:path||null,attachment_name:String(body.attachment_name||"").slice(0,240),status:"not_reviewed"},prefer:"return=representation"}) as any[];return {ok:true,submission:v?.[0]||{status:"not_reviewed",submitted_at:new Date().toISOString()}}}
async function studentListResults(s:any){const ats=await db("platform_exam_attempts?select=id,exam_id,started_at,submitted_at,status&student_registry_id=eq."+escFilter(String(s.id))+"&submitted_at=not.is.null&order=submitted_at.desc") as any[];if(!ats.length)return {ok:true,results:[]};const ids=[...new Set(ats.map(a=>escFilter(String(a.exam_id))))],exs=await db("platform_exams?select=id,title,stage,results_published&id=in.("+ids.join(",")+")") as any[],by:Record<string,any>={};for(const e of exs)by[e.id]=e;const shown=ats.filter(a=>by[a.exam_id]?.results_published);if(!shown.length)return {ok:true,results:[]};const aids=shown.map(a=>escFilter(String(a.id))),grades=await db("platform_exam_results?select=*&attempt_id=in.("+aids.join(",")+")&published_at=not.is.null") as any[],g:Record<string,any>={};for(const x of grades)g[x.attempt_id]=x;return {ok:true,results:shown.filter(a=>g[a.id]).map(a=>({attempt:a,exam:by[a.exam_id],result:g[a.id]}))}}
async function listAttempts(body:any){const id=escFilter(String(body.exam_id||""));if(!id)throw new ApiError("اختاري الامتحان أولًا.");const ats=await db("platform_exam_attempts?select=*&exam_id=eq."+id+"&order=created_at.desc") as any[];if(!ats.length)return {ok:true,attempts:[]};const ids=ats.map(a=>escFilter(String(a.student_registry_id))),ss=await db("platform_student_registry?select=id,student_code,full_name,guardian_phone,education_stage&id=in.("+ids.join(",")+")") as any[],students:Record<string,any>={};for(const s of ss)students[s.id]=s;const aids=ats.map(a=>escFilter(String(a.id))),gs=await db("platform_exam_results?select=*&attempt_id=in.("+aids.join(",")+")") as any[],results:Record<string,any>={};for(const g of gs)results[g.attempt_id]=g;return {ok:true,attempts:ats.map(a=>({...a,student:students[a.student_registry_id]||null,result:results[a.id]||null}))}}
async function getAttemptReview(body:any){const id=escFilter(String(body.attempt_id||"")),ats=await db("platform_exam_attempts?select=*&id=eq."+id+"&limit=1") as any[],attempt=ats[0];if(!attempt)throw new ApiError("المحاولة غير موجودة.",404);const ss=await db("platform_student_registry?select=id,student_code,full_name,guardian_phone,education_stage&id=eq."+escFilter(String(attempt.student_registry_id))+"&limit=1") as any[],ee=await db("platform_exams?select=id,title,stage,duration_minutes&id=eq."+escFilter(String(attempt.exam_id))+"&limit=1") as any[],qs=await db("platform_exam_questions?select=*&exam_id=eq."+escFilter(String(attempt.exam_id))+"&order=sort_order.asc") as any[],ids=qs.map(q=>escFilter(String(q.id))),as=await db("platform_exam_answers?select=*&attempt_id=eq."+id) as any[],ks=ids.length?await db("platform_exam_answer_keys?select=question_id,answer_key,scoring_notes&question_id=in.("+ids.join(",")+")") as any[]:[],keyMap:Record<string,any>={},ansMap:Record<string,any>={};for(const k of ks)keyMap[k.question_id]=k;for(const a of as)ansMap[a.question_id]=a;const mapped=[];for(const q of qs){const a=ansMap[q.id]||null;mapped.push({...q,media_preview_url:await signAcademicReadUrl(q.media_url),answer_key:keyMap[q.id]?.answer_key??null,scoring_notes:keyMap[q.id]?.scoring_notes||"",answer:a?{...a,audio_url:await signAcademicReadUrl(a.audio_path)}:null})}const gs=await db("platform_exam_results?select=*&attempt_id=eq."+id+"&limit=1") as any[];return {ok:true,attempt,student:ss[0]||null,exam:ee[0]||null,questions:mapped,result:gs[0]||null}}
async function gradeAttempt(body:any){const id=escFilter(String(body.attempt_id||"")),ats=await db("platform_exam_attempts?select=*&id=eq."+id+"&limit=1") as any[],attempt=ats[0];if(!attempt||!attempt.submitted_at)throw new ApiError("يجب أن يسلّم الطالب الامتحان أولًا.");const qs=await db("platform_exam_questions?select=id,points&exam_id=eq."+escFilter(String(attempt.exam_id))) as any[],valid:Record<string,number>={};for(const q of qs)valid[q.id]=Number(q.points)||0;for(const a of (Array.isArray(body.answers)?body.answers:[])){const qid=escFilter(String(a.question_id||""));if(!(qid in valid))throw new ApiError("سؤال غير صحيح.");const pts=Number(a.awarded_points);if(!Number.isFinite(pts)||pts<0||pts>valid[qid])throw new ApiError("الدرجة خارج حدود السؤال.");const answerId=escFilter(String(a.id||""));if(!answerId)throw new ApiError("الإجابة غير صحيحة.");await db("platform_exam_answers?id=eq."+answerId+"&attempt_id=eq."+id,{method:"PATCH",body:{awarded_points:pts,teacher_feedback:String(a.teacher_feedback||"").slice(0,5000),reviewed_at:new Date().toISOString()}})}const ans=await db("platform_exam_answers?select=id,awarded_points&attempt_id=eq."+id) as any[],score=ans.reduce((n,a)=>n+(a.awarded_points==null?0:Number(a.awarded_points)||0),0),max=qs.reduce((n,q)=>n+(Number(q.points)||0),0),pending=ans.some(a=>a.awarded_points==null),old=await db("platform_exam_results?select=score,published_at&attempt_id=eq."+id+"&limit=1") as any[];await db("platform_exam_results?on_conflict=attempt_id",{method:"POST",body:{attempt_id:id,score,max_score:max,published_at:old[0]?.published_at||null,updated_at:new Date().toISOString()},prefer:"resolution=merge-duplicates,return=minimal"});if(old.length&&Number(old[0].score)!==score)await db("platform_grade_change_log",{method:"POST",body:{student_registry_id:attempt.student_registry_id,attempt_id:id,old_score:Number(old[0].score)||0,new_score:score,reason:String(body.reason||"تعديل درجة من لوحة المستر").slice(0,1000)},prefer:"return=minimal"});await db("platform_exam_attempts?id=eq."+id,{method:"PATCH",body:{status:pending?"awaiting_review":"graded"}});return {ok:true,score,max_score:max,status:pending?"awaiting_review":"graded"}}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,x-teacher-key,apikey", "access-control-allow-methods": "POST,OPTIONS", "cache-control": "no-store" } });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const action = String(body?.action || "");
    let student:any=null;
    if(action==="studentLogin"){return json(await studentLogin(body))}
    const teacherUpload=action==="createUploadUrl"&&(body.file_kind==="exam_audio"||body.file_kind==="assignment_resource");
    if(TEACHER_ACTIONS.has(action)||teacherUpload){
      const supplied=String(req.headers.get("x-teacher-key")||"");
      const tokenAuthorized = await authorizedTeacherSession(req);
      const legacyAuthorized = !!supplied && await sha256(supplied)===EXPECTED_KEY_HASH;
      if(!tokenAuthorized&&!legacyAuthorized)return json({error:"سجّلي الدخول بحساب المستر لإكمال العملية."},401);
    } else { student=await currentStudent(req); }
    let result: unknown;
    switch (action) {
      case "listExams": result = await listExams(); break;
      case "getExam": result = await getExam(body.id); break;
      case "saveExam": result = await saveExam(body); break;
      case "deleteExam": result = await deleteExam(body); break;
      case "setExamPublished": result = await setExamFlag(body, "is_published"); break;
      case "setResultsPublished": result = await setExamFlag(body, "results_published"); break;
      case "listPricing": result = await listPricing(); break;
      case "savePricing": result = await savePricing(body); break;
      case "setPricingActive": result = await setPricingActive(body); break;
      case "listAssignments": result = await listAssignments(); break;
      case "saveAssignment": result = await saveAssignment(body); break;
      case "deleteAssignment": result = await deleteAssignment(body); break;
      case "setAssignmentPublished": result = await setAssignmentPublished(body); break;
      case "listSubmissions": result = await listSubmissions(body); break;
      case "reviewSubmission": result = await reviewSubmission(body); break;
      case "createUploadUrl": result = await createUploadUrl(body,student); break;
      case "studentListExams": result = await studentListExams(student); break;
      case "studentStartExam": result = await studentStartExam(body,student); break;
      case "studentSaveAnswer": result = await studentSaveAnswer(body,student); break;
      case "studentSubmitExam": result = await studentSubmitExam(body,student); break;
      case "studentListAssignments": result = await studentListAssignments(student); break;
      case "studentSubmitAssignment": result = await studentSubmitAssignment(body,student); break;
      case "studentListResults": result = await studentListResults(student); break;
      case "listAttempts": result = await listAttempts(body); break;
      case "getAttemptReview": result = await getAttemptReview(body); break;
      case "gradeAttempt": result = await gradeAttempt(body); break;
      default: throw new ApiError("العملية المطلوبة غير مدعومة.");
    }
    return json(result);
  } catch (error) {
    const e = error as Error;
    console.error("platform-academics error", e.message);
    const status = error instanceof ApiError ? error.status : 500;
    return json({ error: e.message || "تعذر تنفيذ العملية." }, status);
  }
});
