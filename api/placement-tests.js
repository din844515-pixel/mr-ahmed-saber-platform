const SUPABASE_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
const TABLE_URL = SUPABASE_URL + '/rest/v1/platform_placement_tests';
const FUNCTION_URL = SUPABASE_URL + '/functions/v1/platform-academics';
const isTeacherRequest = require('../lib/teacher-auth');

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\\s+/g, ' ').trim().slice(0, max);
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'GET') {
    if (!(await isTeacherRequest(req))) return res.status(401).json({ ok: false, error: 'سجّل الدخول بحساب المستر لعرض نتائج اختبار المستوى.' });
    try {
      const upstream = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { apikey: PUBLISHABLE_KEY, authorization: String(req.headers.authorization || ''), 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ action: 'listPlacementTests' }),
        cache: 'no-store'
      });
      const raw = await upstream.text(); let data;
      try { data = JSON.parse(raw); } catch { data = {}; }
      if (!upstream.ok) return res.status(upstream.status).json({ ok: false, error: data.error || 'تعذر تحميل نتائج اختبار المستوى.' });
      return res.status(200).json({ ok: true, tests: Array.isArray(data) ? data : (data.tests || data.result || []) });
    } catch (error) {
      console.error('placement test lead listing failed', error && error.message);
      return res.status(502).json({ ok: false, error: 'تعذر تحميل نتائج اختبار المستوى.' });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const student_name = clean(body.student_name, 120);
  const education_stage = clean(body.education_stage, 80);
  const guardian_phone = clean(body.guardian_phone, 24);
  const email = clean(body.email, 254).toLowerCase();
  const answers = Array.isArray(body.answers) ? body.answers : null;
  if (student_name.length < 2 || !education_stage || !/^[+0-9 ()-]{8,24}$/.test(guardian_phone) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !answers || answers.length !== 15 ||
      body.contact_consent !== true || answers.some(v => !Number.isInteger(v) || v < 0 || v > 3)) {
    return res.status(400).json({ ok: false, error: 'راجع البيانات والإجابات ووافق على حفظ النتيجة والتواصل قبل الإرسال.' });
  }
  try {
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, authorization: 'Bearer ' + PUBLISHABLE_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action: 'submitPlacementTest', student_name, education_stage, guardian_phone, email, answers, contact_consent: true }),
      cache: 'no-store'
    });
    const raw = await upstream.text(); let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = {}; }
    if (!upstream.ok || !data.ok) return res.status(upstream.status || 502).json({ ok: false, error: data.error || 'تعذر حفظ نتيجة الاختبار. حاول مرة أخرى.' });
    return res.status(201).json(data);
  } catch (error) {
    console.error('placement test save failed', error && error.message);
    return res.status(502).json({ ok: false, error: 'تعذر الاتصال لحفظ النتيجة.' });
  }
};