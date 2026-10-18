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
- The approved teacher photo is the exact user-supplied original PNG (736×1307; 1,037,820 bytes; SHA-1 `83e0b28fdcd33fdf352124788433eccfe45ef0fc`). Do not re-encode, compress, crop, or substitute it. It is used in the homepage hero, About section, student dashboard, and teacher dashboard.

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
- The approved original teacher portrait is referenced through the verified original PNG deployment; the current repository's `new-platform/teacher.png` is only a 1,506-byte placeholder, not the approved photo. Do not use that placeholder as a substitute or change the original image bytes.
- Acceptance requires checking the portrait in the homepage hero, homepage About, student dashboard, teacher dashboard, plus video playback on mobile and desktop.


## Homepage intro video and teacher photo — 15 Oct 2026
- The homepage contains an introductory-video section immediately after the hero and before courses, but it must not play any fixed/default clip. Until the teacher has saved a real promo video through secure storage, the section displays an explicit empty state.
- The original teacher portrait is referenced through the verified original PNG deployment using a shareable access URL; preserve exact bytes and do not re-encode. The repository's 1,506-byte `new-platform/teacher.png` placeholder is not the approved photo.
- Acceptance checklist: homepage hero photo, About photo, teacher dashboard portrait, student dashboard portrait, promo video playback.

## Execution checkpoint — 15 Oct 2026
- On 18 Oct 2026, updated the homepage hero/About and both student-dashboard portraits plus the teacher-dashboard portrait to reference the verified original PNG (SHA-1 `83e0b28fdcd33fdf352124788433eccfe45ef0fc`; 1,037,820 bytes). The source is served from the original immutable image deployment via a shareable access URL; no image bytes or display settings were changed. The 1,506-byte `new-platform/teacher.png` in this branch is a placeholder and must not be treated as the approved photo.
- The homepage reference, About reference, student sidebar/header portraits, and teacher sidebar portrait must all use the same approved original image URL. Confirm each in the preview on mobile and desktop before considering the image task complete. complete.
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


## Deferred issue — teacher portrait images (resolve at end)
- User explicitly requested on 16 Oct 2026 to defer the teacher-photo issue together with student-code generation until the end. Do not change image URLs, teacher portrait files, image quality, crops, page layout, or approved design while implementing other features.
- Reported symptom: the approved teacher photo is still not appearing correctly/consistently in the intended locations. A previous source URL returned HTTP 200, but that alone did not prove that the image renders visibly in the app.
- At the end, visually inspect the approved original portrait on the homepage hero and About section, student dashboard, and teacher dashboard on mobile and desktop. Confirm the exact approved image, keep its original quality, and do not substitute the tiny `new-platform/teacher.png` file.
- Treat the portrait issue as unresolved until it is visually verified; HTTP 200 or a matching URL is not enough. Keep this issue paired with the deferred student-code-generator issue below.


## Execution checkpoint — 16 Oct 2026 (PDF files and notes preview)
- Recorded the teacher-photo display problem as deferred until the final pass, paired with the already-deferred student-code generator. Do not change the approved portrait or code generator while progressing through other features.
- Replaced the files/notes placeholder with a separate PDF manager preview: select a stage, optionally group under course and unit, set access to the whole stage or a specific student, save a PDF, edit metadata, replace the PDF, download it locally, search/filter, and delete it.
- PDF bytes and metadata are stored in a dedicated IndexedDB database on the current browser/device. This is a local preview only, NOT shared storage and NOT live access control for students; do not enter sensitive/private documents until an isolated backend, authentication and storage policies are connected.
- The PDF file module uses a separate store and code path. The exam/question area was not edited, the old Supabase project was not touched, and no PDF-import-to-exam function was added.
- Before claiming release, run JavaScript syntax checks, deploy the latest branch head, verify the three platform routes return HTTP 200, and request mobile interaction confirmation for file add/edit/replace/download/delete and stage/student access controls.


## PDF manager follow-up — 16 Oct 2026
- Updated the local PDF file manager to list courses across all stages (showing each course's stage in the option) instead of limiting the course dropdown to the currently selected stage. Units populate from the selected course, listing every unit configured under that course.
- Changed file access from one student to multi-select. A file can be assigned to multiple selected students; selected student IDs/names are stored in the local IndexedDB record and shown in the saved-file summary. Legacy records with one student remain readable.
- JavaScript syntax was checked successfully after this change. Still local-only; no shared student permissions are enforced until a backend is connected.


## PDF file manager correction — 16 Oct 2026
- Reworked the student-specific access picker from a native multi-select to a mobile-friendly checkbox list with name/code search. Multiple checked student IDs are preserved while searching and saved together in the PDF record.
- Fixed the save handler's compatibility reference so the form can submit after the picker changed from a native select to checkboxes.
- The unit dropdown now explains its empty state: choose a course first, or it will say if no units are registered for the selected course. All units defined for the selected course are listed.
- Verified the current teacher-dashboard JavaScript parses successfully. The latest source still requires deployment verification and user confirmation of mobile form submission. Local-only storage/access caveat remains unchanged.


## Frozen approved checkpoint — PDF manager on mobile — 16 Oct 2026
- User approved the current PDF manager behavior and explicitly instructed not to change it again. Preserve the course selector showing courses across all stages, all units belonging to the selected course, the mobile-friendly student checkbox list/search, multi-student selection persistence while searching, and save/replace/edit behavior.
- Recovery branch: `checkpoint/pdf-manager-final-approved-2026-10-16` anchored at commit `961548cf593f8b57e9f336e64009738434484c3c`. Also retained `checkpoint/pdf-manager-mobile-working-2026-10-16` at `aa4d297161831d9d4023aba41ce8c159f9a8a702`.
- Last deployment checked: `dpl_5nAS7qC7ti8qKo5F7J4RxnPaEHqE`, URL `https://mr-ahmed-saber-new-611emzut8-mr-ahmed-saber.vercel.app` (READY). Teacher dashboard, student dashboard, and homepage returned HTTP 200; teacher HTML includes the checkbox list, search handlers, explicit unit empty-state messages and unchanged exam section. JavaScript syntax check passed. Note: HTTP/syntax checks are not an end-to-end mobile file-save test; user is asked to confirm saving on her phone.
- Do not overwrite or reset either student recovery checkpoint. Do not modify the approved PDF section when working on the next feature unless the user specifically requests it.
- Next safe UI milestone: student-facing course/unit/lesson browsing and lesson comment/reply presentation, still clearly marked local preview until a newly approved isolated backend exists. Do not modify the legacy Supabase project or exam/question code.


## Execution checkpoint — 16 Oct 2026 (teacher replies to lesson comments)
- Added a teacher-side comment/reply panel beneath the teacher course manager. It reads the same localStorage key as the student-dashboard comment preview (`mas.teacher.lessonComments.v1`), displays the course/unit/lesson and student comment, and allows Mr. Ahmed Saber to add replies.
- Replies are stored on the same browser under each comment and are rendered by the student lesson view as “رد المستر” entries. This is a same-browser preview only; students on other devices will not see them until the approved isolated backend and authenticated API/storage are connected.
- JavaScript syntax passed. The teacher dashboard still contains the exam section and the frozen PDF manager. Do not edit the PDF manager or exam/question system during subsequent work.
- Next backend-dependent steps remain blocked until a separate Supabase project is approved and provisioned. Do not modify the existing legacy Supabase project; draft schema is not deployed.


## Execution checkpoint — 16 Oct 2026 (isolated exam/assignment management foundation)
- Applied `20261016_academic_backend.sql` and `20261016_exam_save_rpc.sql` only to the isolated Supabase project `umffvtnujqjmgrrfmsdk`; the legacy Supabase project remains untouched.
- Added separate tables for exams, questions, answer keys, attempts, answers, results, assignments, assignment submissions, and score-change history. RLS is enabled and direct `anon`/`authenticated` table grants are revoked; privileged access is through the server-side `platform-academics` Edge Function.
- Added transactional `platform_save_exam` RPC so the exam and all questions/answer keys save as one transaction. Database smoke test created a temporary exam/question/key, verified persistence, then removed the temporary record.
- Added `api/exams.js` server proxy and tracked Edge Function source at `new-platform/supabase/functions/platform-academics/index.ts`; function version 2 is ACTIVE. The teacher-side exams area can now create/edit/delete exams, save the eight supported question types, set per-question scores, set duration/stage/course/instructions, and publish/unpublish. Assignment create/edit/delete and publish/unpublish are also connected.
- Results publication is blocked until at least one graded result exists. This prevents marking empty results as published.
- Preview deployment `dpl_6WQKH46fMydj4X3bgQnwTdKpH8fA` reached READY for commit `e2557ad50a45744fb7a8cbad13a57396a2b3aeb2`; teacher, student, and homepage routes returned HTTP 200. Teacher-dashboard JS and `api/exams.js` syntax checks passed; GET on `/api/exams` returned expected 405 because that route accepts POST only.
- This is **not end-to-end complete**: student login/authentication, student-side published exam delivery, server-enforced timed attempt creation/submission, automatic/manual grading UI, publishing actual grades, assignment submission, and mobile click/save testing remain. Do not claim these are live until tested. The student list still lives in `platform_student_registry`; academic tables reference that same registry.
- Preserve the approved design, the user's confirmed student-management checkpoint, the old exam/question code, the legacy Supabase project, and the frozen PDF manager. Do not deploy this preview to production until interaction tests confirm create/edit/publish from the teacher's phone.


## Execution checkpoint — 16 Oct 2026 (pronunciation audio and assignment workflow)
- Added private bucket `platform-academic-media` on the isolated Supabase project; confirmed the bucket is non-public and all nine academic tables have RLS enabled. Storage supports teacher source audio/video, assignment resources, student pronunciation audio, and assignment-submission files, with signed upload/read URLs rather than public objects.
- Teacher dashboard now supports selecting an MP3/MP4 or compatible audio/video file for a question, recording teacher audio with the browser microphone when allowed, previewing the saved prompt file, and attaching a PDF/image/document/audio/video resource to an assignment.
- Added teacher-side exam-attempt review, playback of student voice answers, per-question manual marks/feedback, score-change audit, and assignment-submission review statuses.
- Student dashboard now requires a code/mobile login using the isolated student registry, loads published exams/assignments/results for the student's stage, enforces a server-side timed one-attempt exam flow, lets students record or upload pronunciation responses, submits assignments once (text or file), and only displays results after publication.
- Isolated Edge Function `platform-academics` is ACTIVE version 5. Results publishing now requires every exam attempt to be submitted, graded, and have a saved result row.
- Latest edits include teacher/student dashboard JavaScript syntax checks and the student-only proxy syntax check. Database/RLS/private-bucket checks passed. **End-to-end mobile interactions still require testing with an approved test account**, including student sign-in, microphone permissions, file upload, teacher playback/marking, and result publication. Do not use real student records or promote this branch to production until those tests pass.
- The approved design, legacy database, old exam/question implementation, student recovery checkpoint, and frozen PDF manager remain out of scope and must stay unchanged.


- Follow-up safety pass: student can also choose an existing voice recording from the phone if browser microphone recording is unavailable; saved recordings are restored on a resumed attempt, and the final-submit button blocks while recording is still active. Teacher exam save now blocks while source audio upload/recording is still in progress.
- Current test deployment is still a preview; no production alias has been promoted. The visual/mobile workflow must be tested using a dedicated, approved test student before real use.


## Follow-up checkpoint — 16 Oct 2026 (pronunciation and assignment UX)
- Confirmed the isolated academic storage bucket `platform-academic-media` exists, is private, and has a 50 MiB file-size limit with the approved audio/video/document/image MIME types.
- Confirmed the existing academic backend already includes secure signed uploads for teacher MP3/MP4/audio recording, student pronunciation recordings, assignment resources/submissions, private signed read URLs, student-side timed exam attempts, one-attempt enforcement, and assignment review states.
- Updated the teacher question editor so the MP3/MP4 upload and teacher microphone-recording controls are shown specifically for the Listening and Speaking/Pronunciation question types, instead of crowding every question type. The media path field accepts the internal private-storage path as well as an external URL; JavaScript syntax check passed.
- Assignment workflow already includes teacher attachment upload, student written/file submission, one-final-submission enforcement, teacher access to submission attachments, and review states (not reviewed / reviewed / needs rework).
- Preview deployment `dpl_2kmUtPmt2uFvgqy7ic4wqXAhdaw8` was triggered for commit `3464789ca4dcfd317d2d07cf98dc052a4e046ffa`. This checkpoint is **not yet verified end-to-end on a phone**; do not claim the upload, microphone permission, student recording, or assignment submission works in production until these interactions are tested.
- Preserve the approved design and PDF manager, and do not publish this preview to production without a successful teacher upload → save exam → student playback/record → teacher review flow.


## Pricing and assessment media checkpoint — 16 Oct 2026
- Added `platform_pricing` in the isolated Supabase project only. It supports one active/inactive price per stage or course+stage; direct writes are revoked from browser roles. Public reads expose active price fields only.
- Added teacher price controls under Subscriptions: set a stage subscription price or a separate course price, edit via the existing key, and hide/show prices. Homepage now reads active prices from `/api/pricing`, shows prices on stage cards and a course-price list, and reflects the selected stage/course price in the subscription panel. No price has been invented or prefilled; the teacher must set actual prices.
- Teacher exam audio and assignment-resource uploads use the isolated academic Edge Function's signed storage URLs and storage bucket, separate from the existing course-video upload route. Audio upload requires the teacher key and supports media selection from the phone; the exam UI also contains a browser microphone recording workflow. Student pronunciation recording and playback need final end-to-end verification. The existing `api/videos.js` route was restored unchanged to avoid disturbing course-video upload.
- The assignment form already supports attaching a resource file; the backend stores its storage path/name. The schema also has a nullable `attachment_url` field for compatibility. Assignment submission/teacher review APIs exist, but the mobile student submission path still needs verification.
- Syntax checks passed for teacher dashboard JavaScript, homepage JavaScript, `api/pricing.js`, and `api/videos.js`.
- Preview deployment started for commit `27458cdc36d9d9ed3ddc989dc9fbc4c07ae2eaf8`; do not call it complete until the deployment reaches READY and the public pricing GET and teacher price save/list are tested. Do not publish to production until phone-based end-to-end tests pass.


## Checkpoint — 17 Oct 2026 (pricing review and deployment verification)
- Reviewed the latest note and current branch head. Stage/course pricing UI is present in the teacher dashboard; the homepage fetches active prices from `/api/pricing`, renders stage prices, lists separate course prices, and updates the subscription panel based on the selected stage/course.
- Live preview check on deployment `dpl_9w2s3mZBtezVjb2GEYtn1BusBF36` (`0aa49c171f55939f103abfae299032be01f64e14`) returned HTTP 200 for the teacher dashboard, student dashboard, homepage, and `/api/pricing`. Public pricing endpoint returned `{"ok":true,"pricing":[]}`; no prices have been invented or configured. The teacher must enter the real amounts in Subscriptions → أسعار المراحل والكورسات before students see numeric prices.
- Teacher/student/homepage JavaScript syntax checks passed. The isolated academic function includes pricing list/save/activate actions, student exam attempts, pronunciation responses, assignment submissions, teacher review, grading and results publication.
- Corrected course-price key normalization so repeated/extra whitespace is normalized consistently; redeployed isolated `platform-academics` Edge Function as ACTIVE version 9. This changes only the new isolated project, not the legacy database.
- Remaining release blockers from the note: run a full phone workflow with a dedicated test student (teacher MP3/MP4 upload or microphone recording → save/publish speaking exam → student playback and voice submission → teacher playback/grading → results publication; plus assignment resource → student final submission → teacher review); verify actual teacher price save/edit/hide/show using the existing teacher session; verify student add/edit/renew sync; and perform the deferred final checks for unique student-code generation and the approved original teacher portrait. Keep the PDF manager, old exam implementation, legacy Supabase, and approved V25 design frozen. Do not promote preview to production until these tests pass.


## Mobile recording and teacher-key persistence — 17 Oct 2026
- Teacher sync key now migrates from the old session-only store to `localStorage`, so the teacher should not need to re-enter it after every tab/session on the same browser/device. It remains device/browser-specific; clearing site data or using another browser/device can require reconnecting. Do not use this on a shared/public device.
- Teacher and student voice-recording handlers now reset the Start/Stop controls when microphone permission is denied or capture fails, check secure-context/browser support, report permission/device errors, and reject empty recordings before attempting upload.
- Deployed preview `dpl_6jtnxYzRKXPJFGeZeNSsrKKQjoeC` (`https://mr-ahmed-saber-4wiquzfgu-mr-ahmed-saber.vercel.app`) reached READY for commit `85522dc480caadde0d196bac32bf49ccf21cca3c`. Teacher and student dashboard URLs both returned HTTP 200; fetched HTML contains the new persistent-key and recorder recovery logic. JavaScript syntax checks passed for both dashboards.
- These checks do not simulate the Android microphone permission or complete a real audio upload on the user's phone. If direct recording is blocked in an in-app browser, open the preview in Chrome and allow microphone access, or use the file picker. Keep production unchanged until the real phone test passes.


## Execution checkpoint — 17 Oct 2026 (exam audio download and save fix)
- Removed the native audio player's download and playback-speed controls in the teacher exam-question preview using `controlsList="nodownload noplaybackrate"`; blocked the audio element's context menu as an additional UI measure. This discourages casual downloading but is not DRM and cannot prevent every browser/device from saving media.
- Fixed the exam form's pre-save pending-media check: it previously called `.some()` on the single-element helper `$` (which returns one Element), causing a JavaScript TypeError before the save request. It now uses `$$` to collect question rows before checking pending uploads/recordings.
- Latest teacher-dashboard commit: `9ff058edca7d2a404b218abba3ed958e59c80c1f`. Inline dashboard JavaScript syntax check passes; source checks confirm the corrected selector and hidden download controls.
- Still required before considering complete: verify the preview deployment is READY, confirm exam create/edit/save with a test exam from the phone, and check the native audio menu on Android. No production promotion and no database schema changes were made in this step.

## Current audit — 17 Oct 2026 (note reconciled with latest implementation)
This section supersedes older status statements above where they conflict with later dated checkpoints. Historical checkpoints are retained as an audit trail.

### Current state
- The isolated academic Supabase project is `umffvtnujqjmgrrfmsdk`; its `platform-academics` Edge Function and private `platform-academic-media` bucket are already configured. The legacy `Mr. Ahmed Saber` Supabase project remains untouched.
- Teacher exam/assignment management and student academic flows are implemented against the isolated backend in source. The teacher dashboard also has browser-local student/course/file/comment previews alongside connected academic APIs; do not assume every dashboard section is shared/persistent just because the exam API is connected.
- Latest known teacher-dashboard source fix: commit `9ff058edca7d2a404b218abba3ed958e59c80c1f` fixes the pre-save pending-audio check and hides native audio download/speed controls. Source syntax passed, but this commit has not yet been confirmed on a READY deployment and has not been tested in the user's mobile browser.
- Last documented end-to-end-related preview before this fix is older than the current commit. Vercel refused a fresh deployment due to the daily deployment quota; do not treat an older READY URL as containing the latest fix.
- The approved design, teacher photo source/quality, existing exam/question builder, and frozen PDF manager remain protected. Do not use the incorrect 1,506-byte `new-platform/teacher.png` asset.

### Remaining work — ordered release checklist
1. **Current blocker: exam save regression test.** Once Preview deployment is available, use a dedicated test exam to create, edit, save, reload, and confirm question count/types/points/audio path persist. On Android, inspect the audio player menu. Do not use real student records.
2. **Pronunciation end-to-end test.** Teacher uploads MP3/MP4 or records a prompt; waits for upload; saves and publishes a speaking/listening exam; test student signs in, plays the prompt, records or picks a voice file, submits once; teacher plays the answer, grades it, saves feedback, publishes results; student sees results only after publication. Test microphone-denied, empty recording, interrupted upload, and retry paths.
3. **Assignment end-to-end test.** Teacher creates/publishes an assignment with attachment and due date; student opens it, submits text or a file once; submission locks; teacher opens attachment and marks Not Reviewed / Reviewed / Needs Rework. Confirm the state survives refresh and appears to the correct test accounts.
4. **Student synchronization and subscription test.** Verify add/edit/delete, duplicate prevention, guardian phone, stage, approval, monthly renewal, expired-access blocking, exemption, and the subscription follow-up queue across a teacher reload and student login. Current student CRUD UI has browser-local fallback; only actions actually confirmed through the shared API count as cross-device functionality.
5. **Pricing test.** Using the existing authorized teacher session, set/edit/hide/show a test stage/course price; confirm public pricing reflects active values and that blank pricing stays blank. No prices should be invented.
6. **Files, lessons, and comments.** Verify access by stage/specific student, private signed links, and that lesson comments/replies are visible to all students in the same course only after backend integration. Current comment/course previews may remain browser-local.
7. **Deferred final fixes.** Reproduce student-code generation on mobile; each new form must show a fresh unused code, including cancel/reopen and save cases. Then visually verify the approved original teacher portrait in homepage hero/About and both dashboards without compressing, replacing, cropping, or changing its quality.
8. **Release gate.** Run syntax and API checks, deploy Preview only after quota resets, verify the exact current commit/READY deployment, then complete phone interaction tests. Promote to production only after all critical flows above pass; never claim a fix is live based only on source checks or HTTP 200.

### Documentation corrections / caution
- Earlier opening sections describing the dashboards as UI-only were accurate at the time they were written but are stale for the later exam/assignment/pricing integrations. Read the dated checkpoints and this audit together.
- A deployed page returning HTTP 200 confirms route availability only; it does not prove that save, recording, storage permissions, student authorization, or cross-device synchronization work.
- The daily Vercel deployment quota is a deployment/build limit, not a site-visitor limit. Continue source review and safe edits while waiting, but avoid repeated deployment attempts until the quota resets.

## Follow-up checkpoint — 17 Oct 2026 (second exam-save selector defect)
- A second use of the single-element helper `$` was found immediately after the pending-audio check: the question collection used `$('#examQuestionList [data-question-row]').map(...)`. Since `$` returns only one Element, this would still throw before the exam save request even after fixing the pending-upload check.
- Changed the question collection to `$$('#examQuestionList [data-question-row]').map(...)` so all question rows are collected before serialization.
- Latest teacher-dashboard commit: `4b85e760b90a6fedf183d12977f3be1f6c6ff1a9`. Fetched the updated branch source and confirmed the corrected selector; inline JavaScript syntax check passes.
- Source/syntax verification only. The new commit has not yet been deployed or tested by creating/editing an exam in the phone browser. Keep the production site unchanged until the preview test passes.

## User-confirmed checkpoint — 17 Oct 2026 (student code generation)
- User confirmed that the student-code generator is now working.
- Mark the deferred student-code-generator issue as resolved by user confirmation. Do not continue patching or refactoring code generation while it is working; preserve the current behavior and avoid unrelated edits to the student form.
- This confirmation covers the user's observed behavior, not a global uniqueness guarantee across devices. Cross-device uniqueness still ultimately requires a database constraint/sequence in the approved isolated backend.
- Continue with the remaining deferred item: visually verify the approved original teacher portrait in the homepage hero/About and both dashboards, preserving its original bytes and quality. Do not claim the image is fixed until visually checked.


## Follow-up checkpoint — 17 Oct 2026 (Preview deployment retry)
- Retried a Preview deployment after the earlier daily-deployment-quota rejection. Vercel accepted it and the build completed successfully.
- Preview deployment ID: `dpl_6wY2iJWZ5xVxLqyquSjC56cSBCRy`; state verified as `READY`.
- Deployed branch: `rebuild/new-platform-from-note-2026-10-13`; deployed commit: `4d5ad469e40134ac46098bc32c099342cd36df09` (includes the teacher exam-save selector fixes and the user-confirmed student-code checkpoint).
- Preview URL: `https://mr-ahmed-saber-2zew42i5c-mr-ahmed-saber.vercel.app/new-platform/teacher-dashboard.html`; student dashboard: `https://mr-ahmed-saber-2zew42i5c-mr-ahmed-saber.vercel.app/new-platform/student-dashboard.html`.
- Build logs report `Build Completed in /vercel/output [4s]`; Vercel state is READY. A web retrieval attempt could not access the dashboard URLs, so this is not proof that page interactions work.
- Required next step: open this exact Preview on Android and test teacher exam create/edit/save/reload and student recording/assignment flows. Do not promote to production until real phone interaction tests pass. No production deployment was triggered.


## Security checkpoint — 17 Oct 2026 (teacher email/password gate)
- User clarified the intended access flow: clicking “لوحة المستر” should require the teacher's email and password; a valid teacher session persists across refresh/reopening until explicit logout or normal session expiry; students continue using the student entry point.
- Added a sign-in gate to `new-platform/teacher-dashboard.html` using Supabase Auth on the isolated project `umffvtnujqjmgrrfmsdk`. It persists the session in localStorage, checks the authenticated user's `app_metadata.role` for `teacher` or `admin` (or matching `roles`), denies other authenticated accounts, and provides explicit logout and return-to-home actions. The public homepage's existing “لوحة المستر” link already points to this dashboard.
- Latest teacher-dashboard source commit: `147a087341b5f2d4031ba64005a47e447432f408`. Inline JavaScript syntax checks passed for all three inline scripts.
- IMPORTANT: this is a source-level first step, not a fully verified security release. The teacher's Supabase Auth account must exist and have teacher/admin role in app metadata; that account has not been provisioned/verified in this workflow. Existing `platform-academics` teacher API actions still require the existing sync key, so Auth login does not yet replace that key or secure every backend operation. The Edge Function must be updated to validate the Supabase Auth JWT and teacher role server-side, and the dashboard API calls must send the session token before this is considered complete.
- Do not deploy this as a finished access-control fix or claim that student access is blocked end-to-end yet. Next steps: implement server-side JWT/role enforcement for teacher actions while preserving the student API and existing exam/question behavior; configure/verify the teacher account without exposing credentials in chat; then test unauthenticated access, wrong password, non-teacher account denial, refresh/session persistence, logout, and all teacher exam/assignment operations on Preview. No production deployment was triggered.

## Security checkpoint — 17 Oct 2026 (JWT-backed teacher operations)
- Added `lib/teacher-auth.js`, which validates the Supabase access token against the Auth `/auth/v1/user` endpoint and accepts only server-managed `app_metadata.role` / `app_metadata.roles` values of `teacher` or `admin`. It does not trust user-editable profile metadata.
- Updated the teacher dashboard so a valid persisted Supabase Auth session is the preferred authorization method for shared student-registry operations, exams/assignments, price management, course publishing, and course-video uploads. The session token is passed in the Authorization header or the Blob upload's client payload; the password is not embedded in source code.
- Updated the Vercel API proxies for exams, students, prices, courses, and course-video uploads to validate teacher access tokens server-side. Updated isolated Supabase Edge Functions `platform-academics` to ACTIVE version 10 and `platform-students` to ACTIVE version 2 so their teacher operations also validate the signed-in user's server-managed teacher/admin role.
- Compatibility safeguard: legacy sync-key authorization is still accepted by these paths during migration to avoid unexpectedly breaking existing previews. This is temporary compatibility, so do not describe every management route as strictly email/password-only until the legacy fallback and remaining legacy file-management paths are intentionally retired after testing.
- Verification finding: querying the isolated Auth user table for `din844515@gmail.com` returned no matching account. That email is present in the old design reference, but an Auth account has not yet been provisioned in isolated project `umffvtnujqjmgrrfmsdk`. A correct password cannot authenticate until the account exists and its server-managed app metadata includes `role: teacher` (or `admin`). The provided password was not written to GitHub or function source.
- Source commits for the auth migration include the shared verifier, API proxy updates, dashboard token wiring, and mirrored Edge Function source under `supabase/functions/`. JavaScript syntax and live teacher login still need verification. The user-facing deployment should remain Preview-only until the approved teacher account is configured and these tests pass: unauthenticated/wrong-password denial, non-teacher role denial, session persistence and logout, loading/saving students and subscriptions, exam create/edit/save/reload, assignment review, pricing edits, course publishing and video upload. Existing design, teacher image, PDF manager, and question-builder behavior remain protected.
- No production promotion was requested or performed in this checkpoint.

## Follow-up — 17 Oct 2026 (homepage teacher-login routing)
- Changed the homepage hero and footer “دخول المستر” controls to navigate directly to `teacher-dashboard.html`, where the authenticated Supabase email/password gate is shown. The main navigation already pointed there. This removes the homepage demo login modal from the teacher entry path; student entry controls are unchanged.
- Homepage source commit: `c6d173d9fea7044991acbbffd8d0101e83e9a886`. Teacher dashboard retains the approved navy/gold and beige styling and the current exam/question builder.
- Auth migration and API proxy JavaScript syntax checks passed before this route-only homepage change. The next Preview build must include this homepage commit plus the JWT proxy changes.
- Confirmed blocker remains: `din844515@gmail.com` has no user row in the isolated Supabase Auth project yet, so password login cannot succeed until an authorized admin creates/confirms the account and assigns server-managed `app_metadata.role = teacher` (or `admin`). Do not place the password in source code, commit history, or README. The password supplied in chat has not been tested against an Auth account.
- Keep the existing sync-key fallback only as a temporary compatibility bridge; this means the migration should not yet be described as fully email/password-only for every API. No production alias/promotion was changed.

## Follow-up — 17 Oct 2026 (auth initialization guard)
- Added an idempotency guard to `showDashboard()` so Supabase's initial-session event and the login form response cannot trigger duplicate student/exam/pricing loads on the same transition into the authenticated dashboard. This is a small auth-lifecycle fix; no exam/question markup or design was changed.
- Source commit: `8a92936fa3fd1892a943741225cc7a164fdfaee6`. JavaScript syntax is to be rechecked before the next Preview deployment.

## Permanent content-language rule — 17 Oct 2026
- **All Arabic wording across the entire platform must use masculine grammatical forms only.** This applies to student and teacher dashboards, login/registration, buttons, labels, validation, success/error messages, exam and assignment instructions, subscription/payment flows, notifications, and any dynamically generated text.
- Examples: use “اختر المرحلة”، “أجب عن السؤال”، and “أنت مسجل دخولك”; do not use feminine-address forms such as “اختاري”، “أجيبي”، or “أنتِ مسجلة دخولك”.
- Preserve this rule in every future content/UI edit and check newly added or changed Arabic strings for feminine forms. Do not change the approved visual design or unrelated functionality while applying the rule.


## Execution checkpoint — 17 Oct 2026 (authenticated student course loading)

- Added `api/student-courses.js`, which requires the signed-in student bearer session, validates it through the existing student academics function, and only returns shared courses matching the student's education stage (or the agreed comprehensive-course stage).
- Updated the student dashboard course list to load from this authenticated endpoint instead of reading cached course records from the browser's localStorage. Course cards, units, and lessons still use the approved existing visual layout.
- The teacher's existing `/api/courses` publish flow remains unchanged. This feature depends on the teacher publishing course records successfully to the shared Vercel Blob course index.
- Lesson comments/replies and actual completion tracking are still local preview behavior and are not represented as cross-device persistent features yet. Do not claim shared comments or accurate course progress until their authenticated storage and write paths are implemented and tested.
- Student dashboard design, student login, and exam/question-builder files outside the course-loading integration were not redesigned or rewritten in this step.


## Execution checkpoint — 17 Oct 2026 (shared lesson comments)

- Added `api/lesson-comments.js` with signed student-session validation through the isolated `platform-academics` function. Comment reads and writes require a valid student session and are restricted to a course/lesson in the shared course index and the student's stage.
- Student lesson comments now use the shared Vercel Blob comment index instead of localStorage, so comments can be read across devices. The API includes a teacher-authenticated PATCH path for replies; the teacher dashboard reply UI remains a follow-up and must be added before claiming teacher replies are ready to use.
- Comment storage currently uses a read/modify/write JSON document. This is suitable for an initial preview but may lose simultaneous writes under concurrent submissions; move to a transactional database table before high-volume/production use.
- Student dashboard visual structure, login form, exam tabs and exam builder were not redesigned in this step. Deployment is preview-only; validate comments on two separate student sessions and verify stage restrictions before production.


## Execution checkpoint — 17 Oct 2026 (submitted exam lock + home course cards)

- Updated student exam cards so any attempt with a submission timestamp or a non-`in_progress` status is treated as closed. Closed exams no longer render a start/resume button; the card explicitly says the exam was submitted and cannot be retaken. The existing server-side `studentStartExam` guard still rejects attempts to restart a submitted exam.
- Replaced the three hardcoded home-page course placeholders (“كورس التأسيس”, “القواعد والمفردات”, and “المراجعات والامتحانات”) with cards rendered from the authenticated student's actual published courses. Each card shows its real course name, stage, unit count and lesson count; “متابعة الكورس” opens that course's content view.
- This does not fabricate course enrollment or lesson-completion percentages. Only courses in the shared published course index and matching the student's stage will appear; if none are published/assigned in that shared index, the dashboard shows an explicit empty state instead of “بانتظار الربط”.
- Preserved the existing visual theme and exam/question-builder implementation. Preview-only deployment; must test submitted attempts and stage-filtered course display with real accounts before production.


## Execution checkpoint — 17 Oct 2026 (teacher shared lesson comments)

- Teacher dashboard lesson comments now load from `GET /api/lesson-comments` using the signed-in teacher's Supabase Auth token; teacher can see comments across published lessons, including student name/stage, course/unit/lesson context and existing replies.
- Teacher replies now use `PATCH /api/lesson-comments` with the comment's course/unit/lesson IDs and are persisted in the same shared comments index students read. Student and teacher UI notices were updated to stop claiming comments are only local.
- The API allows an authenticated teacher to list all comments without a lesson filter. Student requests still require a valid student session and stage authorization; teacher-only replies require the teacher auth gate.
- Remaining validation: test with a real student account and teacher account in separate sessions, confirm comment/reply round trip, verify the comment appears for a second student in the same lesson, and verify another stage cannot read it. Shared comments still use a JSON read/modify/write store; concurrent writes may race, so migrate to transactional database storage before high-volume production.


## UI correction — 17 Oct 2026 (subscription promotion cards restored)

- Restored a separate “كورسات متاحة للاشتراك” section on the student dashboard with promotional cards for foundation, grammar/vocabulary, and revision/exams. These cards are intentionally visible even when the student has no active enrollment, so they can discover and consider subscribing.
- Each promotion card links to the public site's existing subscription section (`index.html#subscribe`). These are promotional cards, not falsely represented as already enrolled/active courses. Actual enrolled/published courses remain in the separate “كورساتي الحالية” section and continue to load from the shared course API.
- Preserve these promotional cards in future course-data fixes; do not remove them when no published/enrolled courses are returned.


## Execution checkpoint — 17 Oct 2026 (database-backed lesson comments and progress)

- Added and applied `20261017_student_comments_progress.sql` to the isolated Supabase project `umffvtnujqjmgrrfmsdk`. It creates `platform_lesson_comments` and `platform_student_lesson_progress`, enables RLS, and restricts direct table privileges to the service role; do not apply this schema to the legacy project.
- Extended the existing `platform-academics` Edge Function with student comment list/create actions, teacher comment list/reply actions, student progress read/mark-complete actions, and lookup of the matching course/unit/lesson from the shared published course index. Supabase function deployment version 11 is active.
- Replaced `api/lesson-comments.js` JSON-Blob storage with the authenticated Edge Function and database flow. This keeps student comments and teacher replies in a database table rather than a public JSON object. Replies currently update a JSON array on the comment record; very high concurrency should eventually move replies into their own table/transaction.
- Added a student “mark lesson complete” action and progress percentages calculated from stored per-student completion records. A completion is explicitly student-marked (not inferred from video playback), and no progress is fabricated if the course/lesson list is empty.
- Updated teacher sign-in handling to load the shared comments panel automatically after authentication.
- Source commits: function actions `e33939ec084c49da1ceae4fdd291e93a44ad32a8`; comments API `bad0b9f9c9765b3df5e4ba3b44def3f76601b809`; student API allowlist `d63b5d994b19a85ce6a8d1eb361b1c29ad040ffd`; student progress UI `3e733e9f480f18b9016d09aba9d3f4d828f1d81b`; teacher comments auto-load `7741983cf76110f5ffbcd736fbaec3d4218e83ef`.
- Remaining acceptance tests: use a student with an actually published course, mark one lesson complete, verify the percentage persists after re-login, add a comment, see it from the teacher account, reply, and verify the response at the student end. Keep preview-only until these tests pass.


## Deployment blocker — 17 Oct 2026 (Vercel preview quota)

- Latest source checkpoint is commit `1a66f3f835cb4ece59ffa55eb589a62929e335d9`; the newest READY Vercel preview is still commit `9c92de3318e675de0554bdb3ebf46a5f61039b9b` at `https://mr-ahmed-saber-5so9hagta-mr-ahmed-saber.vercel.app`.
- A new preview deployment request was rejected by Vercel with HTTP 402, resource `api-deployments-free-per-day`, over 100 deployments in the daily quota, with retry-after 86400 seconds. Do not keep retrying the deployment API. The new comment/progress UI source has not been served by the current preview yet.
- Supabase `platform-academics` Edge Function version 11 is ACTIVE and the two new tables exist with RLS enabled. The new comments/progress round-trip still needs end-to-end tests with valid student and teacher sessions after the frontend preview can be redeployed.
- Resume by deploying the current branch head after the Vercel quota resets or after the account owner resolves the stated deployment quota; continue to keep the target as Preview, not Production.


## Follow-up — 17 Oct 2026 (course authorization endpoint hardening)

- Updated the shared lesson context lookup in `platform-academics` to use the stable project domain `https://mr-ahmed-saber-new.vercel.app/api/courses` rather than a one-off preview deployment URL. This is necessary so lesson-comment and progress actions do not depend on an expiring deployment hostname.
- Redeployed `platform-academics` successfully; active version is now 12. Source commit: `d8057a4645ef232002e0590468b367d085082fbb`.
- Current source branch head is `d8057a4645ef232002e0590468b367d085082fbb`; Vercel preview quota is still the only confirmed blocker to packaging the frontend changes into a new Preview deployment. No production promotion was made.


## Follow-up fix — 17 Oct 2026 (lesson-comments authorization header)

- Fixed an escaping error in `api/lesson-comments.js` where the Bearer-token regex had literal doubled backslashes and would reject valid authorization headers. The route now parses standard `Authorization: Bearer <token>` headers correctly.
- This fixes the API gateway source for both student comment requests and teacher comment listing/replies. It still requires a new Preview deployment and end-to-end checks; the currently deployed preview does not contain this fix yet.
- Source commit: `a8525903ded6e36137b3bca6f2599a50cabecb5f`.


## Deferred final fixes — 17 Oct 2026 (teacher photo + student-code generation review)

- Restored the approved original teacher portrait URL in all 5 current references across the homepage hero/About section, student dashboard, and teacher dashboard: `https://mr-ahmed-saber-f2j274lv3-mr-ahmed-saber.vercel.app/teacher.png`. The URL was previously verified in this project history as HTTP 200, `image/png`, 1,037,820 bytes. Do not use `https://saber.vercel.app/teacher.png` or the tiny local `new-platform/teacher.png` (1,506 bytes).
- No image bytes were changed, compressed, replaced, or re-encoded. Only the HTML image source URL was corrected; the exact layout, image sizing, cropping rules, and mobile breakpoints remain unchanged.
- The source fix is committed in the current branch across homepage `8318943f60d37e1b188a5d05cb5e05476d53a1e7`, student dashboard `b140f1f099ca6a53b3e0ea158e5344abfb92129f`, and teacher dashboard `2be61447e66ea47f07ed90b6c891753e8df8f30c`.
- Deferred student-code generator was reviewed but not changed in this pass: the teacher dashboard's `makeCode()` currently derives sequence state from the browser's `localStorage` plus the locally loaded student array, so it is not yet a database-authoritative, race-safe generator across multiple devices. Fix this through a server-side atomic sequence / unique constraint before claiming it is fully fixed.
- Visual acceptance still pending: because Vercel's daily deployment quota blocked new previews, the corrected photo URL has not yet been visually checked on the live preview across desktop/mobile. Do not claim this image issue fully closed until the new preview is deployed and inspected.

## Batch fix — 17 Oct 2026 (atomic student-code allocation)

- Added migration `20261017_student_code_sequence.sql` and applied it to the isolated Supabase project `umffvtnujqjmgrrfmsdk`. It adds a unique index on `platform_student_registry.student_code`, a per-year sequence table with RLS/service-role-only access, and a transaction-locked database function that reserves the next `MAS-YYYY-NNNNN` code safely across devices.
- Updated `platform-students` so authenticated teacher requests can request `{ "action": "next-code" }`; it calls the database function and returns the reserved code. Supabase Edge Function `platform-students` is ACTIVE version 3.
- Updated the teacher student form to reserve a code from the shared database only when saving a new student. The client-side/localStorage sequence is no longer used to decide new student codes; if the server cannot reserve a code, the form shows an error and does not create a local-only student with a guessed code. Editing an existing student keeps its existing code.
- Verified the SQL allocator directly returned `MAS-2026-00003` after the current registry's highest code. This tested the database function, not the full browser-to-API flow; the reserved test code is intentionally consumed and will not be reused.
- Source commits: migration `74d87b8c1ab3bd52ecb11ae426d05fda23e34bdc`, Edge Function source `8b2455c97b50b03029dab9f13a9606778257b75d`, teacher form `fa9500a70fee14c5a4f799b95f84189f5e26ecee` and validation correction `c268febdce404e5d0418c5a9a39fe34f99bfc9a5`.
- **Still required before the single Vercel Preview deployment:** verify the deployed browser flow reserves/saves/edits/deletes/renews students; visually confirm the approved original teacher image on desktop and mobile; run the exam/question-builder regression tests without changing its UI; test shared lesson comments/replies and saved progress with real student/teacher sessions; confirm teacher Auth account and role. The current Preview still does not include the source changes because Vercel's daily deployment quota blocked the previous request. Keep the next deployment Preview-only and do not promote Production until the checklist passes.

- Follow-up source validation: corrected a literal newline escape introduced while wiring the reservation helper. Parsed all three inline scripts in `teacher-dashboard.html` and the `api/students.js` route with JavaScript syntax checks; all passed at source checkpoint `6e830655ef0436142e193f95e96099b11d852827`.

## Final pre-deployment batch — 17 Oct 2026

- Replaced the stale warning that implied assignments were not connected with brief teacher instructions for creating, publishing, and reviewing assignments. Renamed the action to «عرض تسليمات الطلاب» so the teacher can identify where to review student responses. The existing create/upload/publish/submit/review backend actions were left intact.
- Pronunciation/listening question source already uses browser `MediaRecorder`, a separate stop-recording control, microphone permission handling, upload to the student's answer path, and saved-answer persistence. The previous Preview was created before these source fixes; do not mark the mobile recording issue closed until a new Preview is available and the record → stop → upload → submit flow is physically tested on an Android phone. If the browser denies microphone support, the UI should show the fallback message rather than imply recording succeeded.
- Last completed source checkpoint: see the latest branch head after this README update. JavaScript inline-script syntax checks and approved teacher-photo source checks are being repeated before the single Preview deployment. No Vercel deployment was triggered because the daily quota was the explicit blocker.


## Approved WhatsApp contact — 18 Oct 2026
- Support/contact number: `01553438138`.
- WhatsApp direct link (international form): `https://wa.me/201553438138`.
- Official channel subscribe link: `https://whatsapp.com/channel/0029VbEB6wYIHphCcWMBTi26`.
- Show both actions in the homepage contact strip and the student dashboard contact section. Keep their visual style consistent with the approved design.


## Follow-up checkpoint — 18 Oct 2026 (homepage polish and access audit)
- Kept the approved teacher photo, page layout, pricing backend, and exam/question builder unchanged.
- Homepage student-entry links now navigate to `student-dashboard.html` instead of leaving the visitor in the login modal on the homepage.
- WhatsApp contact button explicitly displays `01553438138` and links to `https://wa.me/201553438138`; the channel button links to `https://whatsapp.com/channel/0029VbEB6wYIHphCcWMBTi26`.
- Replaced empty testimonial placeholders with clearly-labelled illustrative examples. They must not be represented as real student testimonials; replace them only with approved genuine feedback.
- Confirmed the stage/course price editor and public pricing reader already exist. The database `public.platform_pricing` is currently empty, so no actual price should be invented; the teacher must save real prices before students can see them.
- Access audit found the existing teacher account in the original `Mr. Ahmed Saber` identity project (`gfzzuxzrvysuodehjkyq`), while the isolated backend project (`umffvtnujqjmgrrfmsdk`) intentionally has no teacher Auth users. The teacher dashboard now signs in through the existing identity project. Server routes and the two isolated backend functions validate teacher bearer tokens against the same identity project and still store new platform student/academic data only in the isolated backend. Do not move legacy academic tables or student records, weaken the teacher gate, or allow arbitrary signup. Student sign-in still requires a valid active code and registered phone number.
- Source commit: `b49eee544d493457679c8c31845dca4f20fa14eb`. A Preview deployment was initiated for this commit and reached READY at `mr-ahmed-saber-9xf52tim3-mr-ahmed-saber.vercel.app`; this is a preview, not a production release. Manual browser testing of authentication, price saving, and account flows remains pending.


## IMMUTABLE APPROVED ASSETS & DECISIONS — 18 Oct 2026
This section is a hard constraint for all future changes. Do not replace, edit, crop, compress, recolor, retouch, regenerate, or change the quality of the approved teacher portrait. The user re-uploaded the exact approved portrait on 18 Oct 2026 (736 × 1307 PNG): teacher in a dark formal suit in front of Big Ben at sunset. Treat that uploaded original as the source of truth. Keep it unchanged and use the same bytes in the homepage hero, About section, teacher dashboard, and student dashboard where the portrait is shown. The current repository's `new-platform/teacher.png` must not be assumed to be the approved original merely because the filename matches; verify file dimensions/content before release. Do not publish until the approved original is actually deployed and visually checked.

The following decisions are also locked unless the user explicitly requests a change:
- Keep the existing navy/gold/beige/brown academic visual design.
- Preserve the three existing sample student review texts and names; do not rewrite or remove them. They are illustrative examples, not genuine testimonials.
- Keep the user-provided WhatsApp contact number 01553438138 and channel URL https://whatsapp.com/channel/0029VbEB6wYIHphCcWMBTi26.
- Keep the existing exam/question creation and grading workflow intact; do not refactor it while fixing unrelated homepage, image, login, pricing, or reviews issues.
- Preserve all previously approved stage/subscription requirements and the eight student categories.
- Make small, isolated changes only; test before claiming completion or publishing.


## Teacher login repair — 18 Oct 2026
- Root cause: the dashboard's Auth client was pointed at the isolated backend project, but the teacher's existing, verified `teacher` account is in the original identity project.
- Updated the dashboard Auth client, the shared Vercel teacher-token verifier, and the `platform-students` / `platform-academics` Edge Functions to validate against the original identity project.
- The isolated project's service-role DB access and tables are unchanged. The original project's student/exam tables are not queried or modified by this fix.
- The teacher form displays the Auth error text if sign-in still fails, without exposing access tokens or secrets.
- Manual sign-in from the published Preview still needs user verification using the existing email/password.


## User-confirmed checkpoint — 19 Oct 2026
- User confirmed teacher login is now working. Do not reset the password or change Supabase Auth settings unless the user requests it.
- The approved teacher portrait source is the original immutable image URL recorded above. A relative `teacher.png` reference caused a 404 on the new deployment; the current deployed homepage, student dashboard, and teacher dashboard have now been verified by fetching their HTML to reference the approved original image URL (two homepage references, two student dashboard references, one teacher dashboard reference). This confirms source paths, not visual rendering; the user must confirm the image appears correctly on their phone.
- Current READY preview deployment: `dpl_DH8U41Vba6SBXLwKcbogLveASevN`, URL `https://mr-ahmed-saber-fj6iqqnce-mr-ahmed-saber.vercel.app`, commit `630b9f23ad5fdb7d217b4e1617a54250ff6083ce`.
- The deployed `/api/testimonials` GET endpoint responds HTTP 200 with an empty list. The student review form is present on the homepage; no fake review was inserted to test submission. User should test by submitting a real review and confirming it appears after reload.
- `/teacher.png` at the new deployment root returns 404, so never use that path. The approved photo is hosted at the original immutable source URL above.
- The current public pricing table has not been populated with real prices. Do not invent or seed prices; verify the teacher can save prices and the homepage displays them before marking pricing complete.
- Continue one feature at a time, preserve the approved photo, existing review copy, login behavior, visual design, and exam/question system. No production release has been made.


## Requested corrections — 19 Oct 2026 (current work)
- Homepage WhatsApp support now uses a chat link with the prefilled Arabic message “ممكن مساعده بخصوص المنصه”; the contact button no longer shows the phone number as its visible label. Student-dashboard support uses the same prefilled chat. The official channel link and number remain unchanged.
- The subscription action is now labeled “تم”. After the visitor selects a stage and Vodafone Cash, it opens the existing “إنشاء حساب جديد” / registration modal and transfers the selected stage. Other payment methods still show “غير متاحة الآن”.
- Hardened the level-test start interaction: the visible button now calls an explicit start handler and reports missing/invalid fields. Questions remain browser-local and results remain explicitly advisory; do not claim the test saves to the student's backend record.
- Teacher can delete an exam even after attempts, and delete an assignment even after submissions. Database foreign keys cascade associated questions/attempts/answers/results or assignment submissions. The confirmation warns that associated records are deleted.
- Added “السماح بإعادة الامتحان” next to each student attempt in the teacher attempt panel. Granting another try deletes that student's previous attempt, answers, and result so the existing one-attempt-per-exam constraint can allow a fresh attempt. The interface confirms this destructive effect before proceeding.
- The database RPC `public.platform_save_exam(jsonb,jsonb)` was updated on isolated project `umffvtnujqjmgrrfmsdk`: editing an exam with past student attempts creates a new version, unpublishes and labels the previous version, and preserves its questions/attempts/results. Editing an exam without attempts continues updating the existing record. Migration source: `20261019_exam_edit_versioning_and_retake.sql`.
- Supabase Edge Function `platform-academics` deployed active version 14, including teacher-authorized `allowExamRetake` and updated delete operations.
- Source changes are committed on `rebuild/new-platform-from-note-2026-10-13`. Must create/inspect the next Vercel Preview and test the browser flow on mobile before claiming that all four requested items work end to end. Do not promote Production. Keep the teacher portrait byte-for-byte unchanged, preserve the visual design and question-builder types, and do not reset the teacher's working login.


## LOCKED portrait asset — permanent public URL (19 Oct 2026)
- The exact approved original file **`الصورة المعتمدة للمستر - لندن وبيج بن.png`** was copied into the public Supabase Storage bucket `teacher-assets/teacher.png`.
- Permanent asset URL: `https://umffvtnujqjmgrrfmsdk.supabase.co/storage/v1/object/public/teacher-assets/teacher.png`
- Verified after upload: HTTP HEAD succeeded; `image/png`; size **1,037,820 bytes**; SHA-256 `369c4b2fbbab181f5204d4d10f40484b1e69a38c70930e2643ed021844f4f7eb`, exactly matching the approved source-file fingerprint.
- Homepage (hero and About section), student dashboard and teacher dashboard now reference this public stable URL. No image compression, conversion, crop, or redraw was performed.
- Do not restore `_vercel_share` URLs, the protected one-off deployment hostname, or the tiny `new-platform/teacher.png` (1,506 bytes). Never edit image URLs in individual pages independently; use the locked public storage URL above.
- Temporary `api/photo-import-once.js` was removed after the successful transfer, and the one-time `photo-import-once` Edge Function was replaced with a closed 410 response. The old photo-only deployment's temporary protection override was revoked.
- Search indexing metadata is present in the homepage: `robots=index,follow`, canonical homepage URL `https://mr-ahmed-saber-new.vercel.app/new-platform/index.html`, Open Graph metadata and `og:image` pointing to the stable public photo. The root `robots.txt` and `sitemap.xml` exist; verify them on the final production deployment before marking public SEO complete.
- This source-asset fix is committed on the active branch. Final gate: deploy the current branch head, verify all three page routes and the public image URL, then confirm visually on mobile before claiming the portrait is visibly correct. Keep the visual design and image sizing/crop CSS unchanged.
