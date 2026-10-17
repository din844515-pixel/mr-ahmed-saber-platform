const { list, put } = require('@vercel/blob');
const crypto = require('node:crypto');
const isTeacherRequest = require('../lib/teacher-auth');

const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
const COURSE_PATH = 'platform/course-index-v1.json';
const COMMENTS_PATH = 'platform/lesson-comments-v1.json';

function clean(v, max = 2000) { return String(v == null ? '' : v).trim().slice(0, max); }
async function studentProfile(req) {
  const authorization = String(req.headers.authorization || '');
  if (!/^Bearer\s+[^\s]+$/i.test(authorization)) return { error: 'سجّلي الدخول بحساب الطالب أولًا.', status: 401 };
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: PUBLISHABLE_KEY, authorization, accept: 'application/json' },
    body: JSON.stringify({ action: 'studentListExams' }), cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !data.student) return { error: data.error || 'تعذر التحقق من حساب الطالب.', status: response.status || 401 };
  return { student: data.student };
}
async function readJson(path, fallback) {
  const result = await list({ prefix: path, limit: 20 });
  const blob = (result.blobs || []).find(x => x.pathname === path);
  if (!blob) return fallback;
  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to read shared platform data');
  return await response.json();
}
async function getLesson(courseId, unitId, lessonId) {
  const data = await readJson(COURSE_PATH, { courses: [] });
  for (const course of (Array.isArray(data.courses) ? data.courses : [])) {
    if (String(course.id) !== courseId) continue;
    const unit = (Array.isArray(course.units) ? course.units : []).find(x => String(x.id) === unitId);
    const lesson = unit && (Array.isArray(unit.lessons) ? unit.lessons : []).find(x => String(x.id) === lessonId);
    if (lesson) return { course, unit, lesson };
  }
  return null;
}
async function saveComments(comments) {
  const payload = JSON.stringify({ comments, updatedAt: new Date().toISOString() });
  if (Buffer.byteLength(payload, 'utf8') > 4 * 1024 * 1024) throw new Error('تعليقات المحاضرات تجاوزت الحد المسموح.');
  await put(COMMENTS_PATH, payload, { access: 'public', contentType: 'application/json; charset=utf-8', addRandomSuffix: false, allowOverwrite: true });
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const teacher = (req.method === 'PATCH' || req.method === 'GET') && await isTeacherRequest(req);
    let profile = null;
    if (!teacher) {
      const verified = await studentProfile(req);
      if (verified.error) return res.status(verified.status).json({ error: verified.error });
      profile = verified.student;
    }
    const courseId = clean(req.method === 'GET' ? req.query.courseId : body.courseId, 180);
    const unitId = clean(req.method === 'GET' ? req.query.unitId : body.unitId, 180);
    const lessonId = clean(req.method === 'GET' ? req.query.lessonId : body.lessonId, 180);
    if (req.method === 'GET' && teacher && !courseId && !unitId && !lessonId) {
      const data = await readJson(COMMENTS_PATH, { comments: [] });
      const comments = Array.isArray(data.comments) ? data.comments : [];
      return res.status(200).json({ ok: true, comments: comments.slice().sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))) });
    }
    if (!courseId || !unitId || !lessonId) return res.status(400).json({ error: 'بيانات المحاضرة غير مكتملة.' });
    const found = await getLesson(courseId, unitId, lessonId);
    if (!found) return res.status(404).json({ error: 'المحاضرة غير موجودة ضمن الكورسات المنشورة.' });
    if (!teacher) {
      const stage = String(profile.stage || '').trim();
      const courseStage = String(found.course.stage || found.course.education_stage || '').trim();
      if (!(stage === courseStage || courseStage === 'كورسات شاملة' || stage === 'كورسات شاملة')) {
        return res.status(403).json({ error: 'المحاضرة غير متاحة لمرحلتك الدراسية.' });
      }
    }
    const data = await readJson(COMMENTS_PATH, { comments: [] });
    const comments = Array.isArray(data.comments) ? data.comments : [];
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, comments: comments.filter(c => c.courseId === courseId && c.lessonId === lessonId) });
    }
    if (req.method === 'POST') {
      const text = clean(body.body, 2000);
      if (!text) return res.status(400).json({ error: 'اكتبي التعليق أولًا.' });
      const item = {
        id: crypto.randomUUID(), courseId, unitId, lessonId,
        courseName: clean(found.course.name, 180), unitName: clean(found.unit.name, 180),
        lessonTitle: clean(found.lesson.title, 180), studentName: clean(profile.name || 'طالب', 100),
        studentStage: clean(profile.stage, 80), body: text, createdAt: new Date().toISOString(), replies: []
      };
      comments.push(item);
      await saveComments(comments);
      return res.status(201).json({ ok: true, comment: item });
    }
    if (!teacher) return res.status(403).json({ error: 'رد المستر يحتاج تسجيل دخول المستر.' });
    const commentId = clean(body.commentId, 100), reply = clean(body.body, 2000);
    if (!commentId || !reply) return res.status(400).json({ error: 'بيانات الرد غير مكتملة.' });
    const item = comments.find(c => c.id === commentId && c.courseId === courseId && c.lessonId === lessonId);
    if (!item) return res.status(404).json({ error: 'التعليق غير موجود.' });
    item.replies = Array.isArray(item.replies) ? item.replies : [];
    item.replies.push({ id: crypto.randomUUID(), body: reply, createdAt: new Date().toISOString(), author: 'Mr. Ahmed Saber' });
    await saveComments(comments);
    return res.status(200).json({ ok: true, comment: item });
  } catch (error) {
    console.error('lesson comments request failed', error && error.message);
    return res.status(503).json({ error: 'تعذر تحميل أو حفظ تعليقات المحاضرة حاليًا.' });
  }
};
