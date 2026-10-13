# Mr. Ahmed Saber — New Platform

This directory is the isolated rebuild based on the approved reference note. It is intentionally separate from the legacy root site.

## Current milestone: public UI foundation
- Arabic RTL layout with the approved navy/gold/beige/brown direction.
- Public landing sections: courses, eight learning stages, placement-test UI, subscription/payment UI, testimonials placeholder, about/contact.
- Vodafone Cash details appear only after selecting Vodafone Cash.
- Placement test has 15 questions and calculates a local, advisory score.
- Student/teacher entry and student registration are clearly marked as not connected until secure authentication and database work is implemented.
- Teacher portrait is deliberately a placeholder; replace it only with the owner's approved image.

## Not production-ready yet
No database or authentication is connected. The registration/login forms do not create accounts or authenticate users. Placement-test results are not saved. Course cards and testimonials are placeholders rather than live content. Do not collect real student information through this static prototype.

## Next implementation milestones
1. Review/approve the UI and insert the approved teacher image.
2. Design a fresh database schema and RLS policies in an isolated Supabase project; do not touch the legacy database.
3. Implement secure student registration/approval, student and teacher authentication, and role-based access.
4. Implement student lists, payment review, monthly subscriptions, renewals, and exemption/block controls.
5. Implement course/unit/lesson/video/files and shared lesson comments/replies.
6. Implement exam/assignment authoring, attempts, grading, publication, audit history, and results.
7. Add dashboards, activity summaries, notifications and reporting.
8. Run acceptance tests on mobile/desktop and against test accounts before a separate production deployment.

## Safety
Never place Supabase service-role credentials in browser code. Use environment variables and server-side/Edge Function operations for privileged actions. Do not connect this rebuild to production data until schema, access policies, and migration/backup plans have been reviewed.
