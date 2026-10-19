create table if not exists public.platform_registration_requests (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(btrim(student_name)) between 2 and 120),
  education_stage text not null check (education_stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
  guardian_phone text not null check (char_length(regexp_replace(guardian_phone, '[^0-9+]', '', 'g')) between 8 and 16),
  student_phone text not null check (char_length(regexp_replace(student_phone, '[^0-9+]', '', 'g')) between 8 and 16),
  email text not null check (char_length(email) between 5 and 254),
  receipt_path text not null,
  receipt_mime_type text not null check (receipt_mime_type in ('image/jpeg','image/png','image/webp','image/heic','image/heif')),
  receipt_size bigint not null check (receipt_size > 0 and receipt_size <= 5242880),
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  review_note text not null default '',
  student_registry_id uuid null references public.platform_student_registry(id) on delete set null,
  student_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz null
);

alter table public.platform_registration_requests enable row level security;
revoke all on table public.platform_registration_requests from anon, authenticated;
grant all on table public.platform_registration_requests to service_role;

create index if not exists platform_registration_requests_status_created_idx
  on public.platform_registration_requests(status, created_at desc);
create index if not exists platform_registration_requests_phone_created_idx
  on public.platform_registration_requests(student_phone, created_at desc);

create or replace function public.platform_approve_registration_request(p_request_id uuid)
returns table(student_code text, student_registry_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.platform_registration_requests%rowtype;
  v_student_code text;
  v_student_id uuid;
  v_start date;
  v_end date;
begin
  select * into v_request
  from public.platform_registration_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'طلب التسجيل غير موجود.';
  end if;

  if v_request.status = 'approved' then
    return query select v_request.student_code, v_request.student_registry_id;
    return;
  end if;

  if v_request.status <> 'pending_review' then
    raise exception 'لا يمكن اعتماد هذا الطلب في حالته الحالية.';
  end if;

  if exists (
    select 1 from public.platform_student_registry s
    where s.student_phone = v_request.student_phone
       or lower(coalesce(s.email, '')) = lower(v_request.email)
  ) then
    raise exception 'يوجد حساب مسجل بنفس رقم الهاتف أو البريد الإلكتروني.';
  end if;

  v_student_code := public.platform_next_student_code();
  v_start := (now() at time zone 'Africa/Cairo')::date;
  v_end := (v_start + interval '1 month')::date;

  insert into public.platform_student_registry (
    student_code, full_name, student_phone, guardian_phone, email,
    education_stage, payment_status, subscription_start, subscription_end, archived
  ) values (
    v_student_code, v_request.student_name, v_request.student_phone,
    v_request.guardian_phone, v_request.email, v_request.education_stage,
    'تم السداد', v_start, v_end, false
  ) returning id into v_student_id;

  update public.platform_registration_requests
  set status = 'approved',
      student_registry_id = v_student_id,
      student_code = v_student_code,
      updated_at = now(),
      reviewed_at = now()
  where id = v_request.id;

  return query select v_student_code, v_student_id;
end;
$$;

revoke all on function public.platform_approve_registration_request(uuid) from public, anon, authenticated;
grant execute on function public.platform_approve_registration_request(uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('platform-registration-receipts', 'platform-registration-receipts', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
