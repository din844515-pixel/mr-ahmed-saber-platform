const isTeacherRequest = require('../lib/teacher-auth');

const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return res.status(204).end();
  }
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const tokenAuthorized = await isTeacherRequest(req);
  if (!tokenAuthorized) {
    return res.status(401).json({ ok: false, error: 'سجّل الدخول بحساب المستر لعرض طلبات التسجيل.' });
  }

  const requestBody = req.method === 'GET'
    ? { action: 'listRegistrationRequests' }
    : {
        action: 'reviewRegistrationRequest',
        requestId: String((req.body && req.body.requestId) || ''),
        decision: String((req.body && req.body.decision) || ''),
        note: String((req.body && req.body.note) || '')
      };

  try {
    const headers = {
      'content-type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      authorization: String(req.headers.authorization || ''),
      accept: 'application/json'
    };
    // Server-side compatibility while the edge function finishes the same-project
    // teacher JWT validation rollout. Never expose this key to the browser.
    const teacherKey = String(process.env.TEACHER_UPLOAD_KEY || '');
    if (teacherKey) headers['x-teacher-key'] = teacherKey;
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });
    const raw = await upstream.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { error: 'استجابة غير صالحة من خدمة التسجيل.' }; }
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('registration request service failed', error && error.message);
    return res.status(502).json({ ok: false, error: 'تعذر الاتصال بطلبات التسجيل. حاول مرة أخرى.' });
  }
};
