import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPECTED_KEY_SHA256 = "5c23b5f970c3d551469c8c917e1a53b0d2a2e19d86353117089896f60d6e5763";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV";
const STAGES = new Set(["تأسيس","أولى إعدادي","ثانية إعدادي","ثالثة إعدادي","أولى ثانوي","ثانية ثانوي","ثالثة ثانوي","كورسات شاملة"]);
const TABLE = "platform_student_registry";
const cors = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "Access-Control-Allow-Origin": "https://mr-ahmed-saber-new.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-teacher-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: cors }); }
function norm(value: unknown) { return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ar"); }
function paymentToDb(value: unknown) {
  if (value === "exempt" || value === "معفى") return "معفى";
  if (value === "unpaid" || value === "لم يتم السداد") return "لم يتم السداد";
  if (value === "expired" || value === "منتهي") return "منتهي";
  return "تم السداد";
}
function rowToClient(row: any) {
  const p = row.payment_status === "معفى" ? "exempt" : row.payment_status === "لم يتم السداد" ? "unpaid" : row.payment_status === "منتهي" ? "expired" : "paid";
  return { id: row.id, code: row.student_code, name: row.full_name, stage: row.education_stage, phone: row.student_phone, guardian: row.guardian_phone, email: row.email || "", payment: p, start: row.subscription_start || "", end: row.subscription_end || "", archived: !!row.archived, createdAt: row.created_at };
}
function validate(raw: any) {
  const name = String(raw?.name ?? raw?.full_name ?? "").trim().replace(/\s+/g, " ");
  const code = String(raw?.code ?? raw?.student_code ?? "").trim();
  const stage = String(raw?.stage ?? raw?.education_stage ?? "").trim();
  const studentPhone = String(raw?.phone ?? raw?.student_phone ?? "").replace(/[^0-9+]/g, "");
  const guardianPhone = String(raw?.guardian ?? raw?.guardian_phone ?? "").replace(/[^0-9+]/g, "");
  if (!name || name.length > 120) throw new Error("اسم الطالب غير صالح.");
  if (!/^MAS-\d{4}-\d{5,}$/.test(code)) throw new Error("كود الطالب غير صالح.");
  if (!STAGES.has(stage)) throw new Error("المرحلة الدراسية غير صالحة.");
  if (studentPhone.replace(/\D/g, "").length < 8 || studentPhone.length > 20) throw new Error("رقم الطالب غير صالح.");
  if (guardianPhone.replace(/\D/g, "").length < 8 || guardianPhone.length > 20) throw new Error("رقم ولي الأمر غير صالح.");
  const start = String(raw?.start ?? raw?.subscription_start ?? "").trim() || null;
  const end = String(raw?.end ?? raw?.subscription_end ?? "").trim() || null;
  for (const date of [start, end]) if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("تاريخ الاشتراك غير صالح.");
  return { student_code: code, full_name: name, student_phone: studentPhone, guardian_phone: guardianPhone, email: String(raw?.email ?? "").trim().slice(0, 250) || null, education_stage: stage, payment_status: paymentToDb(raw?.payment ?? raw?.payment_status), subscription_start: start, subscription_end: end, archived: !!raw?.archived, updated_at: new Date().toISOString() };
}
async function authorized(req: Request) {
  const authorization = String(req.headers.get("authorization") || "");
  const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (token && token.length <= 12000) {
    try {
      const response = await fetch((Deno.env.get("SUPABASE_URL") || "") + "/auth/v1/user", {
        method: "GET",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: "Bearer " + token, accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(6000)
      });
      if (response.ok) {
        const user = await response.json();
        const metadata = user?.app_metadata || user?.raw_app_meta_data || {};
        const roles = Array.isArray(metadata.roles) ? metadata.roles : [];
        if (metadata.role === "teacher" || metadata.role === "admin" || roles.includes("teacher") || roles.includes("admin")) return true;
      }
    } catch (_) { /* Preserve legacy-key compatibility during migration. */ }
  }
  const key = req.headers.get("x-teacher-key") || "";
  if (!key || key.length > 200) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hex = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ EXPECTED_KEY_SHA256.charCodeAt(i);
  return diff === 0 && hex.length === EXPECTED_KEY_SHA256.length;
}
function sameStudent(a: any, b: any) {
  return norm(a.full_name) === norm(b.full_name) && ((a.education_stage === b.education_stage && String(a.guardian_phone || "") === String(b.guardian_phone || "")) || String(a.student_phone || "") === String(b.student_phone || ""));
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (!(await authorized(req))) return json({ error: "رمز المزامنة غير صحيح." }, 401);
  if (!["GET", "POST"].includes(req.method)) return json({ error: "طريقة الطلب غير مسموحة." }, 405);
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !serviceKey) return json({ error: "إعداد قاعدة البيانات غير مكتمل." }, 503);
  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  if (req.method === "GET") {
    try {
      const all: any[] = [];
      for (let from = 0; from < 50000; from += 1000) {
        const { data, error } = await db.from(TABLE).select("*").order("created_at", { ascending: true }).range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      return json({ ok: true, students: all.map(rowToClient) });
    } catch (e) { console.error("student registry read failed", e?.message || e); return json({ error: "تعذر تحميل قائمة الطلاب المشتركة." }, 500); }
  }
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "بيانات الطلب غير صالحة." }, 400); }
  if (body?.action !== "next-code" && (!Array.isArray(body?.students) || body.students.length > 2000)) return json({ error: "قائمة الطلاب غير صالحة." }, 400);
  try {
    if (body?.action === "next-code") {
      const { data: code, error } = await db.rpc("platform_next_student_code");
      if (error) throw error;
      return json({ ok: true, code });
    }
    const { data: current, error: readError } = await db.from(TABLE).select("*").limit(50000);
    if (readError) throw readError;
    const existing = current || [];
    const rows: any[] = [];
    let skippedDuplicates = 0;
    for (const raw of body.students) {
      let row: any; try { row = validate(raw); } catch (e) { return json({ error: e?.message || "بيانات طالب غير صالحة." }, 400); }
      const sameCode = existing.find(x => x.student_code === row.student_code) || rows.find(x => x.student_code === row.student_code);
      const duplicate = [...existing, ...rows].find(x => x.student_code !== row.student_code && sameStudent(x, row));
      if (duplicate) { skippedDuplicates++; continue; }
      const prior = rows.findIndex(x => x.student_code === row.student_code);
      if (prior >= 0) rows[prior] = row; else rows.push(row);
    }
    if (rows.length) { const { error } = await db.from(TABLE).upsert(rows, { onConflict: "student_code" }); if (error) throw error; }
    const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds.filter((v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) : [];
    if (deletedIds.length) { const { error } = await db.from(TABLE).delete().in("id", deletedIds); if (error) throw error; }
    const { data: saved, error: finalError } = await db.from(TABLE).select("*").order("created_at", { ascending: true }).limit(50000);
    if (finalError) throw finalError;
    return json({ ok: true, students: (saved || []).map(rowToClient), skippedDuplicates });
  } catch (e) { console.error("student registry save failed", e?.message || e); return json({ error: "تعذر حفظ قائمة الطلاب المشتركة. حاولي مرة أخرى." }, 500); }
});
