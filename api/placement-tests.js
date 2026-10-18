const SUPABASE_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
const TABLE_URL = SUPABASE_URL + '/rest/v1/platform_placement_tests';

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\\s+/g, ' ').trim().slice(0, max);
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const student_name = clean(body.student_name, 120);
  const education_stage = clean(body.education_stage, 80);
  const guardian_phone = clean(body.guardian_phone, 24);
  const email = clean(body.email, 254).toLowerCase();
  const level_band = clean(body.level_band, 100);
  const score = Number(body.score);
  const answers = Array.isArray(body.answers) ? body.answers : null;
  if (student_name.length < 2 || !education_stage || !/^[+0-9 ()-]{8,24}$/.test(guardian_phone) ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || !Number.isInteger(score) || score < 0 || score > 15 ||
      !level_band || !answers || answers.length !== 15 || body.contact_consent !== true ||
      answers.some(v => !Number.isInteger(v) || v < 0 || v > 3)) {
    return res.status(400).json({ ok: false, error: 'تأكد من البيانات والإجابات والموافقة على التواصل.' });
  }
  try {
    const response = await fetch(TABLE_URL, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, authorization: 'Bearer ' + PUBLISHABLE_KEY, 'content-type': 'application/json', prefer: 'return=minimal' },
      body: JSON.stringify({ student_name, education_stage, guardian_phone, email, score, total_questions: 15, level_band, answers, contact_consent: true }),
      cache: 'no-store'
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('placement test save failed', response.status, text.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'تعذر حفظ النتيجة الآن. حاول مرة أخرى.' });
    }
    return res.status(201).json({ ok: true, message: 'تم حفظ نتيجة الاختبار.' });
  } catch (error) {
    console.error('placement test save failed', error && error.message);
    return res.status(502).json({ ok: false, error: 'تعذر الاتصال لحفظ النتيجة.' });
  }
};
