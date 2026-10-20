const isTeacherRequest = require('../lib/teacher-auth');

const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';

function clean(v, max = 180) { return String(v == null ? '' : v).trim().slice(0, max); }
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const authorization = String(req.headers.authorization || '');
  if (!/^Bearer\s+[^\s]+$/i.test(authorization)) {
    return res.status(401).json({ error: 'سجّل الدخول أولًا لعرض التعليقات.' });
  }
  try {
    const teacher = await isTeacherRequest(req);
    let body = req.body && typeof req.body === 'object' ? req.body : {};
    let payload;
    if (req.method === 'GET' && teacher) {
      payload = { action: 'teacherListLessonComments' };
    } else if (req.method === 'GET') {
      payload = {
        action: 'studentListLessonComments',
        course_id: clean(req.query.courseId),
        unit_id: clean(req.query.unitId),
        lesson_id: clean(req.query.lessonId)
      };
    } else if (req.method === 'POST') {
      if (teacher) return res.status(403).json({ error: 'إضافة التعليقات متاحة من حساب الطالب فقط.' });
      payload = {
        action: 'studentCreateLessonComment',
        course_id: clean(body.courseId),
        unit_id: clean(body.unitId),
        lesson_id: clean(body.lessonId),
        body: clean(body.body, 2000)
      };
    } else if (req.method === 'PATCH') {
      if (!teacher) return res.status(403).json({ error: 'ردود المحاضرات متاحة لحساب المستر فقط.' });
      payload = {
        action: 'teacherReplyLessonComment',
        comment_id: clean(body.commentId, 64),
        body: clean(body.body, 2000)
      };
    } else {
      payload = {
        action: teacher ? 'teacherDeleteLessonComment' : 'studentDeleteLessonComment',
        comment_id: clean(body.commentId, 64)
      };
    }
    const upstreamHeaders = {
      'content-type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      authorization,
      accept: 'application/json'
    };
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
      cache: 'no-store'
    });
    const raw = await upstream.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { error: 'استجابة غير صالحة من خدمة التعليقات.' }; }
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('lesson comments request failed', error && error.message);
    return res.status(503).json({ error: 'تعذر تحميل أو حفظ تعليقات المحاضرة حاليًا.' });
  }
};
