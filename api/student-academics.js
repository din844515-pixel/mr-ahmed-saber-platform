const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';

const STUDENT_ACTIONS = new Set([
  'studentLogin',
  'studentListExams',
  'studentStartExam',
  'studentSaveAnswer',
  'studentSubmitExam',
  'studentListAssignments',
  'studentSubmitAssignment',
  'studentListResults'
]);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const action = String(body.action || '');
  const studentUpload = action === 'createUploadUrl' &&
    ['pronunciation_answer', 'assignment_submission'].includes(String(body.file_kind || ''));

  if (!STUDENT_ACTIONS.has(action) && !studentUpload) {
    return res.status(403).json({ error: 'العملية غير متاحة من بوابة الطالب.' });
  }

  const authorization = String(req.headers.authorization || '');
  if (action !== 'studentLogin' && !/^Bearer\\s+[^\\s]+$/i.test(authorization)) {
    return res.status(401).json({ error: 'سجلي الدخول بحساب الطالب أولًا.' });
  }

  try {
    const headers = {
      'content-type': 'application/json',
      'apikey': PUBLISHABLE_KEY,
      'accept': 'application/json'
    };
    if (authorization) headers.authorization = authorization;
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { data = { error: 'استجابة غير صالحة من خدمة الطالب.' }; }
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('student academic proxy failed', error && error.message);
    return res.status(502).json({ error: 'تعذر الاتصال بخدمة الطالب. حاولي مرة أخرى.' });
  }
};
