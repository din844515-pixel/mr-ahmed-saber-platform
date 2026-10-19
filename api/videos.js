const { handleUpload } = require('@vercel/blob/client');
const crypto = require('node:crypto');
const isTeacherRequest = require('../lib/teacher-auth');

async function authorizedClientPayload(clientPayload) {
  if (!clientPayload) return false;
  let data = {};
  try { data = JSON.parse(clientPayload); } catch (_) { return false; }
  if (data.accessToken && await isTeacherRequest({ headers: { authorization: 'Bearer ' + String(data.accessToken) } })) return true;
  const expected = process.env.TEACHER_UPLOAD_KEY || '';
  const supplied = String(data.teacherKey || '');
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await authorizedClientPayload(clientPayload))) {
          throw new Error('رمز الرفع غير صحيح. اكتبه من جديد.');
        }
        if (!String(pathname || '').startsWith('course-videos/')) {
          throw new Error('مسار رفع الفيديو غير صالح.');
        }
        return {
          allowedContentTypes: [
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
            'video/3gpp', 'video/3gpp2', 'video/mpeg', 'video/ogg',
            'video/x-matroska', 'video/avi'
          ],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ purpose: 'course-lesson-video' })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let info = {};
        try { info = JSON.parse(tokenPayload || '{}'); } catch (error) {}
        if (info.purpose === 'course-lesson-video') {
          console.log('Course lesson video uploaded', blob.pathname);
        }
      }
    });
    return res.status(200).json(response);
  } catch (error) {
    const message = error && error.message ? error.message : 'Upload authorization failed';
    console.error('course video upload failed', message);
    const status = message.includes('رمز الرفع') ? 401 : 400;
    return res.status(status).json({ error: message });
  }
};
