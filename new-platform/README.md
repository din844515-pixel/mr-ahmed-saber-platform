# Mr. Ahmed Saber — New Platform

This is the isolated rebuild based on the approved reference note. The legacy site and its Supabase database remain untouched.

## Completed UI milestone
- Public landing page with the approved navy/gold/beige/brown visual direction, RTL layout, course cards, all eight learning stages, placement-test UI, subscription/payment UI, testimonials placeholder, about/contact.
- Vodafone Cash details appear only when selected: 01064443212, recipient أحمد صابر غريب, and the reminder to save a screenshot after transfer.
- A 15-question placement test renders all questions in one page, shows a local advisory score, and clearly says the result is not saved.
- The main page and student dashboard use three embedded, subject-appropriate course illustrations for Foundation, Grammar/Vocabulary, and Revision/Practice to avoid blank cards when external image hosts fail.
- Responsive student dashboard preview: sidebar/navigation, student welcome, course cards/progress placeholders, lessons, exams, assignments, files, results, and contact.
- Responsive teacher dashboard preview: right-hand navigation, overview, stage lists, student management UI, courses, exams/assignments, files, results, subscriptions, and settings.
- Dashboard previews explicitly indicate that there are no live student records or connected management functions yet. No fictitious student data is presented as real data.
- The approved teacher photo supplied in this conversation is included as `teacher.webp` and used on the public homepage and teacher dashboard.

## Preview URLs
- Landing page: /
- Student dashboard UI preview: /student-dashboard.html
- Teacher dashboard UI preview: /teacher-dashboard.html

## Not production-ready yet
No separate database or secure authentication is connected. Login and registration do not create accounts or authenticate users. Student management actions, subscription approval/renewal, course content, comments, files, exams, assignments, grading, result publication, audit history and notifications need database/API implementation and end-to-end tests. Do not enter real student information in these previews.

## Next milestones
1. Create an isolated Supabase project without modifying the legacy project.
2. Implement a fresh schema with row-level security and role checks; use server-side/Edge Function operations for privileged changes.
3. Connect secure teacher/student authentication and approval flows.
4. Implement the eight student lists, duplicate prevention, code generation, guardian phone requirement, payment review, monthly subscriptions, renewals, exemptions, and access blocking.
5. Implement courses/units/lessons/videos/files with access controls and course-visible comments/replies.
6. Implement question builder, exams, timers/attempt limits, assignment submission, grading, result publication and grade-change audit trail.
7. Verify each feature on mobile and desktop with test accounts before any production deployment.

## Safety and acceptance
- Do not modify the old project or database as part of this rebuild.
- Never expose a Supabase service-role/secret key in browser code.
- Enable RLS for every exposed table and test access with student and teacher accounts separately.
- Do not claim a function works until the saved data survives reload and authorization tests pass.
- No PDF-import-to-exam feature is included unless its status is explicitly re-approved.

## Fixed UI decisions (do not change without approval)
- The registration/payment form layout shown in the approved user screenshot is fixed. Preserve its existing colors, spacing, field order, typography, and visual design; do not redesign this form without explicit approval.
- The payment-receipt field must use `type="file"` with `accept="image/*"` and must not include a `capture` attribute. On mobile, let the operating system/browser open the image/photo picker rather than forcing direct camera capture.
- The receipt attachment is required, and the registration remains pending until the teacher reviews the payment and approves the account.


## Approved homepage media — 15 Oct 2026
- A dedicated introductory/promotional video section is placed immediately after the hero and before courses, linked from a `شاهد فيديو تعريفي` hero button.
- Do not use the existing media-library clip as a default or hardcoded advertisement. The teacher-selected video must only appear after a real successful save.
- The approved original teacher portrait is referenced through an immutable deployment containing `new-platform/teacher.png`; preserve its exact bytes and do not re-encode or substitute it.
- Acceptance requires checking the portrait in the homepage hero, homepage About, student dashboard, teacher dashboard, plus video playback on mobile and desktop.


## Homepage intro video and teacher photo — 15 Oct 2026
- The homepage contains an introductory-video section immediately after the hero and before courses, but it must not play any fixed/default clip. Until the teacher has saved a real promo video through secure storage, the section displays an explicit empty state.
- The original teacher portrait is referenced through the same immutable static deployment that contains `new-platform/teacher.png`; preserve exact bytes and do not re-encode.
- Acceptance checklist: homepage hero photo, About photo, teacher dashboard portrait, student dashboard portrait, promo video playback.

## Execution checkpoint — 15 Oct 2026
- Fixed all five teacher portrait references in the new platform pages to use the approved image at `/new-platform/teacher.png` on the new deployment origin. This keeps the original deployed PNG asset and does not re-encode, compress, crop, or replace the source file.
- Acceptance check from the Vercel deployment file manifest confirms `new-platform/teacher.png` is present in the deployed asset tree. The new HTML source changes must still be deployed and visually checked at the preview URL before calling the image fix complete.
- The teacher promo video picker currently supports selecting a local `video/*` file, previewing it, and cancelling the selection only. It does not upload, persist, hide, or publish a saved video yet; local preview is not a save.
- No isolated Supabase project is available in the connected project list; the one visible project is named `Mr. Ahmed Saber`, so it is not assumed safe to modify. Do not attach the new platform to it or change its schema, buckets, RLS, student data, or secrets. Secure persistent video upload remains blocked until an isolated backend/storage and teacher authentication are available. Never expose a storage token in browser code or enable an unauthenticated upload endpoint.
- Keep the old site/database untouched, keep the exam/question system unchanged, and continue using small edits with deployment and browser checks. Student management actions remain UI previews, not live database operations.
- The exact original `teacher.png` bytes were restored into the new-platform branch from the last Vercel deployment artifact (PNG signature verified; no image re-encoding or compression was performed). The image is now committed as `new-platform/teacher.png` so future Git-based deployments retain the asset.
