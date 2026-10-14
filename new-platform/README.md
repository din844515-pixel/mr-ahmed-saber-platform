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
