import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EXPECTED_KEY_HASH = "5c23b5f970c3d551469c8c917e1a53b0d2a2e19d86353117089896f60d6e5763";
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
  return { ok: true, exam: exams[0], questions: questions.map(q => ({ ...q, answer_key: byId[q.id]?.answer_key ?? null, scoring_notes: byId[q.id]?.scoring_notes ?? "" })) };
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
    const attempts = await db("platform_exam_attempts?select=id&exam_id=eq." + id) as any[];
    if (!attempts.length) throw new ApiError("لا توجد محاولات أو درجات لهذا الامتحان حتى الآن.");
    const ids = attempts.map((a: any) => escFilter(String(a.id || ""))).filter(Boolean);
    const grades = ids.length ? await db("platform_exam_results?select=attempt_id,max_score&attempt_id=in.(" + ids.join(",") + ")") as any[] : [];
    if (!grades.some((g: any) => Number(g.max_score) > 0)) throw new ApiError("لا توجد درجات معتمدة للنشر. استكملي التصحيح أولًا.");
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
async function listAssignments() {
  const assignments = await db("platform_assignments?select=*&order=created_at.desc") as any[];
  return { ok: true, assignments };
}
async function saveAssignment(body: any) {
  const a = body.assignment && typeof body.assignment === "object" ? body.assignment : {};
  const value: any = { title: needString(a.title, "اسم الواجب"), instructions: String(a.instructions || "").slice(0, 5000), stage: needStage(a.stage), course_title: String(a.course_title || "").slice(0, 180), due_at: a.due_at || null, is_published: Boolean(a.is_published), updated_at: new Date().toISOString() };
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
  return { ok: true, submissions: submissions.map(s => ({ ...s, student: byId[s.student_registry_id] || null })) };
}
async function reviewSubmission(body: any) {
  const id = escFilter(String(body.id || ""));
  const status = String(body.status || "");
  if (!id || !["not_reviewed", "reviewed", "needs_rework"].includes(status)) throw new ApiError("بيانات المراجعة غير صحيحة.");
  const rows = await db("platform_assignment_submissions?id=eq." + id, { method: "PATCH", body: { status, teacher_feedback: String(body.teacher_feedback || "").slice(0, 5000), reviewed_at: new Date().toISOString() }, prefer: "return=representation" }) as any[];
  if (!rows.length) throw new ApiError("التسليم غير موجود.", 404);
  return { ok: true, submission: rows[0] };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,x-teacher-key,apikey", "access-control-allow-methods": "POST,OPTIONS", "cache-control": "no-store" } });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const supplied = String(req.headers.get("x-teacher-key") || "");
  if (!supplied || await sha256(supplied) !== EXPECTED_KEY_HASH) return json({ error: "رمز المزامنة غير صحيح." }, 401);
  try {
    const body = await req.json();
    const action = String(body?.action || "");
    let result: unknown;
    switch (action) {
      case "listExams": result = await listExams(); break;
      case "getExam": result = await getExam(body.id); break;
      case "saveExam": result = await saveExam(body); break;
      case "deleteExam": result = await deleteExam(body); break;
      case "setExamPublished": result = await setExamFlag(body, "is_published"); break;
      case "setResultsPublished": result = await setExamFlag(body, "results_published"); break;
      case "listAssignments": result = await listAssignments(); break;
      case "saveAssignment": result = await saveAssignment(body); break;
      case "deleteAssignment": result = await deleteAssignment(body); break;
      case "setAssignmentPublished": result = await setAssignmentPublished(body); break;
      case "listSubmissions": result = await listSubmissions(body); break;
      case "reviewSubmission": result = await reviewSubmission(body); break;
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
