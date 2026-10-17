-- Atomic student-code allocation for the shared registry.
-- The RPC is callable only by service_role through the authenticated Edge Function.
create unique index if not exists platform_student_registry_student_code_uidx
  on public.platform_student_registry (student_code);

create table if not exists public.platform_student_code_sequences (
  code_year integer primary key,
  last_number bigint not null default 0 check (last_number >= 0),
  updated_at timestamptz not null default now()
);
alter table public.platform_student_code_sequences enable row level security;
revoke all on public.platform_student_code_sequences from anon, authenticated;
grant all on public.platform_student_code_sequences to service_role;

create or replace function public.platform_next_student_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_existing bigint := 0;
  v_last bigint := 0;
begin
  perform pg_advisory_xact_lock(42026, v_year);

  select coalesce(max(substring(student_code from 10)::bigint), 0)
    into v_existing
    from public.platform_student_registry
   where student_code ~ ('^MAS-' || v_year::text || '-[0-9]{5,}$');

  select coalesce(last_number, 0)
    into v_last
    from public.platform_student_code_sequences
   where code_year = v_year
   for update;

  v_last := greatest(v_existing, v_last) + 1;

  insert into public.platform_student_code_sequences(code_year, last_number, updated_at)
  values (v_year, v_last, now())
  on conflict (code_year) do update
    set last_number = excluded.last_number,
        updated_at = now();

  return 'MAS-' || v_year::text || '-' || lpad(v_last::text, 5, '0');
end;
$$;

revoke all on function public.platform_next_student_code() from public, anon, authenticated;
grant execute on function public.platform_next_student_code() to service_role;
