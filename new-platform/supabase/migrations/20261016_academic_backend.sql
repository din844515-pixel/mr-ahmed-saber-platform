-- Isolated academic content backend for Mr. Ahmed Saber platform.
-- Uses the already-active platform_student_registry as the canonical student record.
-- All direct anon/authenticated table access is revoked; access must go through an authenticated server function.
create table if not exists public.platform_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 180),
  instructions text not null default '',
  stage text not null check (stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  course_title text not null default '',
  duration_minutes integer not null default 30 check (duration_minutes between 1 and 600),
  is_published boolean not null default false,
  results_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_exams_stage_published_idx on public.platform_exams(stage, is_published, created_at desc);

create table if not exists public.platform_exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.platform_exams(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice','multiple_choice','true_false','short_text','fill_blanks','long_answer','listening','speaking')),
  prompt text not null check (length(trim(prompt)) between 1 and 10000),
  options jsonb not null default '[]'::jsonb,
  points numeric(8,2) not null default 1 check (points >= 0 and points <= 10000),
  media_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, sort_order)
);
create index if not exists platform_exam_questions_exam_order_idx on public.platform_exam_questions(exam_id, sort_order);

-- Kept separate from the question records returned to students.
create table if not exists public.platform_exam_answer_keys (
  question_id uuid primary key references public.platform_exam_questions(id) on delete cascade,
  answer_key jsonb not null,
  scoring_notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.platform_exams(id) on delete cascade,
  student_registry_id uuid not null references public.platform_student_registry(id) on delete restrict,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','awaiting_review','graded')),
  created_at timestamptz not null default now(),
  unique(exam_id, student_registry_id)
);
create index if not exists platform_exam_attempts_student_idx on public.platform_exam_attempts(student_registry_id, created_at desc);

create table if not exists public.platform_exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.platform_exam_attempts(id) on delete cascade,
  question_id uuid not null references public.platform_exam_questions(id) on delete cascade,
  answer_value jsonb,
  audio_path text,
  awarded_points numeric(8,2),
  teacher_feedback text not null default '',
  reviewed_at timestamptz,
  unique(attempt_id, question_id)
);

create table if not exists public.platform_exam_results (
  attempt_id uuid primary key references public.platform_exam_attempts(id) on delete cascade,
  score numeric(9,2) not null default 0,
  max_score numeric(9,2) not null default 0,
  published_at timestamptz,
  teacher_feedback text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 180),
  instructions text not null default '',
  stage text not null check (stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  course_title text not null default '',
  due_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_assignments_stage_published_idx on public.platform_assignments(stage, is_published, created_at desc);

create table if not exists public.platform_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.platform_assignments(id) on delete cascade,
  student_registry_id uuid not null references public.platform_student_registry(id) on delete restrict,
  response_text text not null default '',
  attachment_path text,
  status text not null default 'not_reviewed' check (status in ('not_reviewed','reviewed','needs_rework')),
  teacher_feedback text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(assignment_id, student_registry_id)
);

create table if not exists public.platform_grade_change_log (
  id uuid primary key default gen_random_uuid(),
  student_registry_id uuid not null references public.platform_student_registry(id) on delete restrict,
  attempt_id uuid references public.platform_exam_attempts(id) on delete set null,
  old_score numeric(9,2),
  new_score numeric(9,2) not null,
  reason text not null default '',
  changed_at timestamptz not null default now()
);

alter table public.platform_exams enable row level security;
alter table public.platform_exam_questions enable row level security;
alter table public.platform_exam_answer_keys enable row level security;
alter table public.platform_exam_attempts enable row level security;
alter table public.platform_exam_answers enable row level security;
alter table public.platform_exam_results enable row level security;
alter table public.platform_assignments enable row level security;
alter table public.platform_assignment_submissions enable row level security;
alter table public.platform_grade_change_log enable row level security;

revoke all on public.platform_exams, public.platform_exam_questions, public.platform_exam_answer_keys,
  public.platform_exam_attempts, public.platform_exam_answers, public.platform_exam_results,
  public.platform_assignments, public.platform_assignment_submissions, public.platform_grade_change_log
  from anon, authenticated;
