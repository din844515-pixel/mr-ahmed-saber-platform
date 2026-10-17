-- Shared lesson comments and per-student lesson completion.
-- Access is mediated by the platform-academics Edge Function (service role only).
create table if not exists public.platform_lesson_comments (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  unit_id text not null,
  lesson_id text not null,
  course_name text not null default '',
  unit_name text not null default '',
  lesson_title text not null default '',
  student_registry_id uuid not null references public.platform_student_registry(id) on delete cascade,
  student_name text not null default '',
  student_stage text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  replies jsonb not null default '[]'::jsonb check (jsonb_typeof(replies) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_lesson_comments_thread_idx
  on public.platform_lesson_comments(course_id, unit_id, lesson_id, created_at);
create index if not exists platform_lesson_comments_student_idx
  on public.platform_lesson_comments(student_registry_id, created_at desc);
alter table public.platform_lesson_comments enable row level security;
revoke all on public.platform_lesson_comments from anon, authenticated;
grant all on public.platform_lesson_comments to service_role;

create table if not exists public.platform_student_lesson_progress (
  student_registry_id uuid not null references public.platform_student_registry(id) on delete cascade,
  course_id text not null,
  unit_id text not null,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key(student_registry_id, course_id, unit_id, lesson_id)
);
create index if not exists platform_student_lesson_progress_course_idx
  on public.platform_student_lesson_progress(student_registry_id, course_id);
alter table public.platform_student_lesson_progress enable row level security;
revoke all on public.platform_student_lesson_progress from anon, authenticated;
grant all on public.platform_student_lesson_progress to service_role;
