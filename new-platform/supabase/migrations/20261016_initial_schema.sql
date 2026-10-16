-- Mr. Ahmed Saber platform: isolated rebuild schema draft.
-- IMPORTANT: This file is intentionally NOT applied to any Supabase project.
-- Apply only to a newly approved, isolated project after review and testing.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher','student')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  student_code text not null unique,
  full_name text not null,
  student_phone text not null,
  guardian_phone text not null,
  email text,
  stage text not null check (stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  payment_status text not null default 'unpaid' check (payment_status in ('paid','unpaid','exempt')),
  subscription_start date,
  subscription_end date,
  account_status text not null default 'pending' check (account_status in ('pending','approved','blocked')),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (payment_status = 'paid' and subscription_start is not null and subscription_end is not null)
    or payment_status in ('unpaid','exempt')
  )
);

create index if not exists students_stage_status_idx on public.students(stage, payment_status, account_status);
create index if not exists students_guardian_phone_idx on public.students(guardian_phone);
create unique index if not exists students_name_student_phone_unique
  on public.students (lower(full_name), regexp_replace(student_phone, '\D', '', 'g'))
  where archived_at is null;

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  payment_method text not null default 'vodafone_cash' check (payment_method = 'vodafone_cash'),
  amount numeric(10,2),
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text
);
create index if not exists subscription_payments_status_date_idx on public.subscription_payments(status, submitted_at desc);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  stage text check (stage is null or stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  thumbnail_path text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id, sort_order)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.course_units(id) on delete cascade,
  title text not null,
  description text not null default '',
  video_path text,
  video_url text,
  notes text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(unit_id, sort_order)
);

create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  parent_comment_id uuid references public.lesson_comments(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_comments_thread_idx on public.lesson_comments(lesson_id, created_at);

create table if not exists public.study_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  storage_path text not null,
  stage text check (stage is null or stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  course_id uuid references public.courses(id) on delete cascade,
  unit_id uuid references public.course_units(id) on delete cascade,
  is_published boolean not null default false,
  restricted_to_selected_students boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_file_student_access (
  file_id uuid not null references public.study_files(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(file_id, student_id)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null default '',
  course_id uuid not null references public.courses(id) on delete cascade,
  duration_minutes integer not null check (duration_minutes > 0),
  is_published boolean not null default false,
  results_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice','multiple_choice','true_false','short_text','fill_blanks','long_answer','listening','speaking')),
  prompt text not null,
  media_path text,
  options jsonb not null default '[]'::jsonb,
  points numeric(8,2) not null default 1 check (points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(exam_id, sort_order)
);

-- Correct answers are kept in a separate teacher-only table, never returned with student question payloads.
create table if not exists public.exam_answer_keys (
  question_id uuid primary key references public.exam_questions(id) on delete cascade,
  answer_key jsonb not null,
  scoring_notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','awaiting_review','graded')),
  created_at timestamptz not null default now(),
  unique(exam_id, student_id)
);

create table if not exists public.exam_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.exam_questions(id) on delete cascade,
  answer_value jsonb,
  audio_path text,
  awarded_points numeric(8,2),
  teacher_feedback text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  unique(attempt_id, question_id)
);

-- Scores are separate so they can be withheld until the teacher publishes results.
create table if not exists public.exam_attempt_results (
  attempt_id uuid primary key references public.exam_attempts(id) on delete cascade,
  score numeric(9,2) not null default 0,
  max_score numeric(9,2) not null default 0,
  published_at timestamptz,
  teacher_feedback text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null default '',
  course_id uuid not null references public.courses(id) on delete cascade,
  due_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete restrict,
  response_text text not null default '',
  attachment_path text,
  status text not null default 'not_reviewed' check (status in ('not_reviewed','reviewed','needs_rework')),
  teacher_feedback text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  unique(assignment_id, student_id)
);

create table if not exists public.grade_change_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  attempt_id uuid references public.exam_attempts(id) on delete set null,
  old_score numeric(9,2),
  new_score numeric(9,2) not null,
  reason text not null default '',
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.teacher_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Role/access helpers. Creation of teacher profiles and privileged subscription/exam operations must be server-side.
create or replace function public.is_platform_teacher()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher');
$$;

create or replace function public.current_student_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select s.id from public.students s where s.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.can_access_course(target_course uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.courses c
    join public.students s on s.auth_user_id = auth.uid()
    where c.id = target_course
      and c.is_published
      and s.account_status = 'approved'
      and (s.payment_status = 'exempt' or (s.payment_status = 'paid' and s.subscription_end > current_date))
      and (c.stage is null or c.stage = s.stage or s.stage = 'كورسات شاملة')
  );
$$;

create or replace function public.can_access_lesson(target_lesson uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.lessons l
    join public.course_units u on u.id = l.unit_id
    where l.id = target_lesson and l.is_published and public.can_access_course(u.course_id)
  );
$$;

create or replace function public.can_access_study_file(target_file uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.study_files f
    join public.students s on s.auth_user_id = auth.uid()
    where f.id = target_file
      and f.is_published
      and s.account_status = 'approved'
      and (s.payment_status = 'exempt' or (s.payment_status = 'paid' and s.subscription_end > current_date))
      and (f.stage is null or f.stage = s.stage or s.stage = 'كورسات شاملة')
      and (f.course_id is null or public.can_access_course(f.course_id))
      and (
        not f.restricted_to_selected_students
        or exists(select 1 from public.study_file_student_access a where a.file_id = f.id and a.student_id = s.id)
      )
  );
$$;

-- Enable RLS on every exposed table.
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.courses enable row level security;
alter table public.course_units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_comments enable row level security;
alter table public.study_files enable row level security;
alter table public.study_file_student_access enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_answer_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_attempt_answers enable row level security;
alter table public.exam_attempt_results enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.grade_change_log enable row level security;
alter table public.teacher_audit_log enable row level security;

-- Teacher full-management policies.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','students','subscription_payments','courses','course_units','lessons',
    'lesson_comments','study_files','study_file_student_access','exams','exam_questions',
    'exam_answer_keys','exam_attempts','exam_attempt_answers','exam_attempt_results',
    'assignments','assignment_submissions','grade_change_log','teacher_audit_log'
  ] loop
    execute format('drop policy if exists teacher_manage_all on public.%I', t);
    execute format('create policy teacher_manage_all on public.%I for all to authenticated using (public.is_platform_teacher()) with check (public.is_platform_teacher())', t);
  end loop;
end $$;

-- Students may read their own profile/subscription row; they cannot self-approve or modify payment status.
drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists student_read_self on public.students;
create policy student_read_self on public.students for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists student_read_own_payments on public.subscription_payments;
create policy student_read_own_payments on public.subscription_payments for select to authenticated
using (student_id = public.current_student_id());

drop policy if exists student_submit_payment_request on public.subscription_payments;
create policy student_submit_payment_request on public.subscription_payments for insert to authenticated
with check (student_id = public.current_student_id() and status = 'pending' and receipt_path <> '');

drop policy if exists student_read_published_courses on public.courses;
create policy student_read_published_courses on public.courses for select to authenticated using (public.can_access_course(id));

drop policy if exists student_read_course_units on public.course_units;
create policy student_read_course_units on public.course_units for select to authenticated using (public.can_access_course(course_id));

drop policy if exists student_read_lessons on public.lessons;
create policy student_read_lessons on public.lessons for select to authenticated using (
  is_published and exists(select 1 from public.course_units u where u.id = unit_id and public.can_access_course(u.course_id))
);

drop policy if exists student_read_course_comments on public.lesson_comments;
create policy student_read_course_comments on public.lesson_comments for select to authenticated using (public.can_access_lesson(lesson_id));

drop policy if exists student_write_own_comment on public.lesson_comments;
create policy student_write_own_comment on public.lesson_comments for insert to authenticated
with check (author_user_id = auth.uid() and public.can_access_lesson(lesson_id));

drop policy if exists student_read_allowed_files on public.study_files;
create policy student_read_allowed_files on public.study_files for select to authenticated using (public.can_access_study_file(id));

drop policy if exists student_read_own_file_access on public.study_file_student_access;
create policy student_read_own_file_access on public.study_file_student_access for select to authenticated
using (student_id = public.current_student_id());

drop policy if exists student_read_published_exams on public.exams;
create policy student_read_published_exams on public.exams for select to authenticated
using (is_published and public.can_access_course(course_id));

drop policy if exists student_read_exam_questions on public.exam_questions;
create policy student_read_exam_questions on public.exam_questions for select to authenticated
using (exists(select 1 from public.exams e where e.id = exam_id and e.is_published and public.can_access_course(e.course_id)));

drop policy if exists student_read_own_attempts on public.exam_attempts;
create policy student_read_own_attempts on public.exam_attempts for select to authenticated
using (student_id = public.current_student_id());

drop policy if exists student_start_one_exam_attempt on public.exam_attempts;
create policy student_start_one_exam_attempt on public.exam_attempts for insert to authenticated
with check (
  student_id = public.current_student_id()
  and status = 'in_progress'
  and submitted_at is null
  and exists(select 1 from public.exams e where e.id = exam_id and e.is_published and public.can_access_course(e.course_id))
);

drop policy if exists student_read_own_attempt_answers on public.exam_attempt_answers;
create policy student_read_own_attempt_answers on public.exam_attempt_answers for select to authenticated
using (exists(select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = public.current_student_id()));

drop policy if exists student_write_active_attempt_answers on public.exam_attempt_answers;
create policy student_write_active_attempt_answers on public.exam_attempt_answers for insert to authenticated
with check (
  exists(select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = public.current_student_id() and a.submitted_at is null and now() < a.expires_at)
);

drop policy if exists student_update_active_attempt_answers on public.exam_attempt_answers;
create policy student_update_active_attempt_answers on public.exam_attempt_answers for update to authenticated
using (
  exists(select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = public.current_student_id() and a.submitted_at is null and now() < a.expires_at)
)
with check (
  exists(select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = public.current_student_id() and a.submitted_at is null and now() < a.expires_at)
);

drop policy if exists student_read_published_exam_results on public.exam_attempt_results;
create policy student_read_published_exam_results on public.exam_attempt_results for select to authenticated
using (
  exists(
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where a.id = attempt_id and a.student_id = public.current_student_id() and e.results_published
  )
);

drop policy if exists student_read_published_assignments on public.assignments;
create policy student_read_published_assignments on public.assignments for select to authenticated
using (is_published and public.can_access_course(course_id));

drop policy if exists student_read_own_assignment_submissions on public.assignment_submissions;
create policy student_read_own_assignment_submissions on public.assignment_submissions for select to authenticated
using (student_id = public.current_student_id());

drop policy if exists student_submit_assignment_once on public.assignment_submissions;
create policy student_submit_assignment_once on public.assignment_submissions for insert to authenticated
with check (
  student_id = public.current_student_id()
  and exists(select 1 from public.assignments a where a.id = assignment_id and a.is_published and public.can_access_course(a.course_id))
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_platform_teacher() to authenticated;
grant execute on function public.current_student_id() to authenticated;
grant execute on function public.can_access_course(uuid) to authenticated;
grant execute on function public.can_access_lesson(uuid) to authenticated;
grant execute on function public.can_access_study_file(uuid) to authenticated;

-- Privileged workflows are intentionally not client-side:
-- * create teacher/student auth accounts and profiles
-- * approve/reject payments and update subscription start/end
-- * submit/grade/publish exams and write score-change audit entries
-- * enforce hard timers and one-attempt submission at the server boundary
-- * validate and store uploaded receipt/video/file bytes in private Storage buckets
-- Do not put a service-role key in browser code. Test this migration on an isolated project first.
