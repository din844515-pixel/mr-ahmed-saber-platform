create table if not exists public.platform_pricing (
 id uuid primary key default gen_random_uuid(),
 item_type text not null check (item_type in ('stage','course')),
 item_key text not null unique,
 item_name text not null,
 education_stage text not null check (education_stage in ('تأسيس','أولى إعدادي','ثانية إعدادي','ثالثة إعدادي','أولى ثانوي','ثانية ثانوي','ثالثة ثانوي','كورسات شاملة')),
 price_egp numeric(10,2) not null check (price_egp >= 0 and price_egp <= 1000000),
 is_active boolean not null default true,
 updated_at timestamptz not null default now()
);
create index if not exists platform_pricing_active_idx on public.platform_pricing(is_active,item_type,education_stage);
alter table public.platform_pricing enable row level security;
revoke all on public.platform_pricing from anon, authenticated;
create policy "public can read active platform prices" on public.platform_pricing for select to anon, authenticated using (is_active = true);
grant select on public.platform_pricing to anon, authenticated;