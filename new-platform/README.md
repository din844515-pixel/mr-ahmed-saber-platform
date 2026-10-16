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
- Important correction: `new-platform/teacher.png` is only 1,506 bytes and is NOT the approved original portrait. Do not use that local file as the teacher image. The approved original is available from the existing immutable deployment asset at `https://mr-ahmed-saber-f2j274lv3-mr-ahmed-saber.vercel.app/teacher.png` (verified HTTP 200, `image/png`, content-length 1,037,820 bytes).


## Execution checkpoint — 16 Oct 2026
- Corrected the previous mistaken local-image switch. Restored all five portrait references across `new-platform/index.html`, `new-platform/student-dashboard.html`, and `new-platform/teacher-dashboard.html` to the approved original source URL: `https://mr-ahmed-saber-f2j274lv3-mr-ahmed-saber.vercel.app/teacher.png`.
- New staging deployment `dpl_C6xdKuVGFfDbCyFXTtDzxPUuL9BS` reached `READY` at `https://mr-ahmed-saber-mc44er554-mr-ahmed-saber.vercel.app`. Verified all three HTML routes return HTTP 200, each contains the original source URL (2 references on homepage, 2 in student dashboard, 1 in teacher dashboard), and none contains the mistaken `/new-platform/teacher.png` reference.
- Verified the original image URL returns HTTP 200 with `image/png` and content-length `1,037,820` bytes. The local `new-platform/teacher.png` file is only 1,506 bytes and is not the approved original. This was a source/path and HTTP check, not a manual visual browser review.
- Verified the deployed receipt picker uses `type="file"` and `accept="image/*"` with no `capture` attribute.
- Student management remains a preview with no live database/authentication. No student data, Supabase schema, legacy project, or exam/question code was modified in this step.
- Next safe step: review current student-management markup and handlers in isolation before implementing student CRUD; do not connect to or mutate the legacy database.


## Execution checkpoint — 16 Oct 2026 (student-management preview)
- The teacher dashboard now contains a browser-local student-management preview: add/edit records, generated student codes, duplicate checks, the 8 agreed stages, search/status filters, manual payment approval/one-month renewal, exemption/unexemption, archive/restore, and confirmed permanent deletion from this browser's local store.
- Student rows show student name, code, student mobile, guardian phone, stage, payment/subscription status, and subscription start/end dates. Monthly dates clamp to the final valid day when the following month is shorter.
- The UI explicitly warns that this is local-browser storage only; records do not sync to another device or the teacher/student accounts. Do not enter real student data or treat this as a live production student system.
- Safety choice: the only connected Supabase project currently visible is named `Mr. Ahmed Saber`; it was not altered because it may be the legacy database. Do not connect the rebuild or modify that project without explicit direction. A separate backend is still required for cross-device student records, authentication/approval, receipt uploads, payment requests, access blocking, WhatsApp notifications, exams, files, and course content.
- The existing exam/assignment UI and exam-question code were left unchanged. The PDF-import-to-exam mention was removed from the teacher dashboard's file-section copy; no PDF-import feature was added.
- The project branch remains `rebuild/new-platform-from-note-2026-10-13`. Student-dashboard and homepage files were not edited in this step. The latest teacher-dashboard change is commit `82f7b3d83b978e45da953d704d93bcc06f5a81b5`; staging deployment `dpl_ABSWBpBdjbeaFaiNg7PAQUr6kBgX` reached `READY`. Verified all three public routes returned HTTP 200; the teacher dashboard includes the student form/table/renewal controls, has no PDF-import text, and still contains the exam section. JavaScript syntax and preflight checks passed; no interactive browser-level click test was available.
- Teacher portrait is deliberately deferred as requested. It still requires a confirmed working origin/source before being considered fixed. Do not claim the portrait appears until visually verified.


## Execution checkpoint — 16 Oct 2026 (safe backend preparation)
- Added a manual WhatsApp reminder shortcut to each active student row. It opens a prefilled WhatsApp compose window for the guardian; it does not send automatically and it does not replace a future authenticated notification service.
- Added `new-platform/supabase/migrations/20261016_initial_schema.sql` as a **draft only** for a new isolated Supabase project. It covers student/subscription records, courses/units/lessons, lesson comments, stage/specific-student file access, exam questions with answer keys kept separately, one-attempt constraints, results publication, assignments, grade-change history, teacher audit logs, and row-level-security policies.
- The migration has not been executed or validated by a live PostgreSQL instance. It must be reviewed and tested on a newly approved isolated project before use. No SQL has been run against the existing `Mr. Ahmed Saber` Supabase project.
- The student CRUD screen remains a local-browser prototype until the separate backend, authenticated teacher operations, and private Storage buckets/policies are in place. Do not use it for real student records yet.
- The portrait remains intentionally last and unresolved. Keep the agreed image/design fixed, and do not claim success without a visual check.


## Execution checkpoint — 16 Oct 2026 (subscription follow-up UI)
- Added a local-preview subscription follow-up queue on the teacher's subscriptions page for unpaid students, expired subscriptions, and subscriptions ending within 7 days. It shares the same local student records as the stage lists.
- The queue exposes manual payment approval/renewal and a WhatsApp compose shortcut for guardians. WhatsApp is opened with prefilled text after a click; messages are not sent automatically.
- Latest teacher dashboard commit: `0fb8ff613bc6870c8744c64ece510e5bc87e0dd9`. Before calling it live, redeploy the latest branch head and verify the student/renewal/WhatsApp UI again. The earlier READY deployment predates this last queue update.


## Verified checkpoint — 16 Oct 2026 (student tools confirmed by user)
- User manually confirmed on mobile that the teacher student section is working: opening the Add Student form, auto-generated student code field, close (×), Cancel, the eight stage cards, and the student search/filter area.
- Last known-good teacher dashboard commit: `db8d49751080dce7b4bcab9b415f92397a3f21b0`.
- Last known-good staging deployment: `dpl_GhrMZVqyuAWyrfaM4JpWsnXeq3QT`, URL: https://mr-ahmed-saber-n4dxwlmk2-mr-ahmed-saber.vercel.app/new-platform/teacher-dashboard.html (READY; HTTP 200).
- Created immutable recovery branch `checkpoint/student-management-working-2026-10-16` at that exact commit. If a future change regresses student tools, restore only the teacher dashboard from this checkpoint; do not reset other platform files indiscriminately.
- Technical reason for the recent breakage: code used the single-element helper `$` where a multi-element collection helper `$$` was required, interrupting script initialization. The stage-card binding and modal close-control binding now use `$$`. Do not change those bindings without testing.
- Student code field shows the next available local code in the form and assigns a code on save. This remains localStorage preview behavior, not persistent/shared student accounts.
- Freeze this working checkpoint: no redesign, no changes to the student form markup/handlers, student rendering, search/filter, or exam/question section while implementing the next milestone. Keep changes isolated and deploy/test after each distinct feature.
- Next milestone to work on separately: course/unit/lesson administration UI (local preview only while the isolated backend is unavailable). Do not label it production-ready or store real student records. Before any real course/video/file persistence, obtain and validate an isolated backend without modifying the legacy Supabase project.


## Execution checkpoint — 16 Oct 2026 (course management preview)
- Added isolated course administration UI to `new-platform/teacher-dashboard.html`: create/edit/delete courses, stage selection, course descriptions, nested units, and lesson/content records with types video, note, assignment, or external link. Unit and content records can be added, edited, and deleted.
- Course records use a separate browser-local key (`mas.teacher.courses.v1`), independent of student records (`mas.teacher.students.v1`). Course content is local to this browser and is not shared or production-persistent. The UI explicitly warns that video upload, shared storage/database, and shared comments/replies are not connected.
- The confirmed student-management bindings and student form remain in place, including the critical multi-element selectors `$$('[data-stage]')` and `$$('#studentModalClose, #studentFormCancel')`. The exam/assignment section remains present and was not modified by the course UI work.
- Staging deployment `dpl_EGgNDm3RTyZfTc5vmBj6kKTdH4BB` reached READY at https://mr-ahmed-saber-ajcilea8y-mr-ahmed-saber.vercel.app/new-platform/teacher-dashboard.html. HTTP 200 and presence of course/unit/lesson forms, the student selectors, student code field, course initialization, and exam section were verified in the deployed HTML. Interactive testing of the new course controls still needs user confirmation on mobile.
- Stable student-only recovery branch remains `checkpoint/student-management-working-2026-10-16` at commit `db8d49751080dce7b4bcab9b415f92397a3f21b0`. Do not merge changes back into that checkpoint or overwrite it.


## Verified checkpoint — 16 Oct 2026 (dashboard controls restored)
- User confirmed the teacher dashboard buttons work again after the course-rendering JavaScript syntax error was corrected.
- Confirmed working deployment: `dpl_75r8YJmqVoKdjijS343VS2FwXiJR`, URL https://mr-ahmed-saber-od7xwyvhp-mr-ahmed-saber.vercel.app/new-platform/teacher-dashboard.html, READY.
- Corrected `renderCourses()` by rewriting the nested course/unit/lesson rendering with balanced template-string concatenation. JavaScript syntax check via `new Function(script)` passes. Deployed HTML returns HTTP 200 and includes student-stage controls, course management, and the exam section.
- Treat this deployment as the current known-good dashboard state. Preserve the separate recovery branch `checkpoint/student-management-working-2026-10-16` and do not overwrite it. Do not change the exam/question builder or the student form/event handlers while proceeding.
- Next work should proceed only after a fresh fetch of the latest branch head and be isolated to one feature. Run a full JavaScript syntax check before every deployment and verify the deployed route returns HTTP 200. Ask the user to confirm mobile interactions after each new feature. Do not claim browser-level interactions are tested when only source/HTTP checks were performed.


## Deferred issue — student code generator (resolve at end)
- User explicitly requested on 16 Oct 2026 to defer fixing the auto-generated student code until the end; do not keep patching it during other work.
- Reported symptom: opening “إضافة طالب” repeatedly shows the same student code instead of generating a new unique code. Several fixes have been attempted; the latest code adds an in-session counter fallback and localStorage sequence reservation, but the user has not confirmed it works.
- Latest code/deployment to reproduce later: commit `198a15b44a11126265057615a1b214a77a2da722`, deployment `dpl_9PgQmkE5jMDUXYuyMCfv8oY9gpb2`, URL https://mr-ahmed-saber-bopucuive-mr-ahmed-saber.vercel.app/new-platform/teacher-dashboard.html.
- At the end, reproduce the behavior on mobile, inspect whether the Add Student click invokes `openStudent(null)` and whether `makeCode()` runs each time. Verify visible code changes on each new form open, cancel, and save; ensure no duplicates with existing saved students. Do not alter the verified student CRUD, stage lists/search, visual design, or exam builder while investigating.
- Important: browser localStorage-only codes are not globally unique across devices. For a real multi-device platform, unique code generation should eventually be enforced by a database sequence/constraint in an isolated, approved backend; do not modify the legacy Supabase project.
