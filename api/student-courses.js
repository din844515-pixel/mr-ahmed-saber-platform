const { list } = require('@vercel/blob');

const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
const COURSE_PATH = 'platform/course-index-v1.json';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorization = String(req.headers.authorization || '');
  if (!/^Bearer\s+[^\s]+$/i.test(authorization)) {
    return res.status(401).json({ error: 'سجّلي الدخول بحساب الطالب أولًا.' });
  }

  try {
    // Validate the signed student session and obtain the stage from the trusted backend.
    const profileResponse = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: PUBLISHABLE_KEY,
        authorization,
        accept: 'application/json'
      },
      body: JSON.stringify({ action: 'studentListExams' }),
      cache: 'no-store'
    });
    const profile = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok || !profile.ok || !profile.student) {
      return res.status(profileResponse.status || 401).json({
        error: profile.error || 'تعذر التحقق من حساب الطالب.'
      });
    }

    const result = await list({ prefix: COURSE_PATH, limit: 20 });
    const blob = (result.blobs || []).find(item => item.pathname === COURSE_PATH);
    if (!blob) return res.status(200).json({ ok: true, exists: false, courses: [] });

    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to read shared course index');
    const data = await response.json();
    const stage = String(profile.student.stage || '').trim();
    const allCourses = Array.isArray(data.courses) ? data.courses : [];
    const courses = allCourses.filter(course => {
      const courseStage = String(course.stage || course.education_stage || '').trim();
      return courseStage === stage || courseStage === 'كورسات شاملة' || stage === 'كورسات شاملة';
    });
    return res.status(200).json({
      ok: true,
      exists: true,
      stage,
      courses,
      updatedAt: data.updatedAt || null
    });
  } catch (error) {
    console.error('student course index read failed', error && error.message);
    return res.status(503).json({ error: 'تعذر تحميل كورسات مرحلتك حاليًا. حاولي تحديث القائمة.' });
  }
};
