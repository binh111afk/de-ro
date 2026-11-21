-- Chống tạo hàng loạt tài khoản lấy quà chào mừng (sáng 21/11: 30 tài khoản từ một IP).
-- 1) Gmail không phân biệt dấu chấm và phần sau dấu "+": a.b+1@gmail.com và ab@gmail.com là một hộp thư.
--    Mỗi hộp thư chỉ một tài khoản (so theo dạng chuẩn hoá). Chỉ chặn khi tạo tài khoản hoặc đổi email.
-- 2) Hook "Before User Created" của Supabase Auth: một IP đăng ký quá nhiều lần trong 1 giờ / 1 ngày thì từ chối.
--    Hook phải được bật trong dashboard: Authentication → Hooks → Before User Created → Postgres function
--    public.hook_before_user_created. Chưa bật thì hàm nằm yên, không ảnh hưởng gì.

create or replace function public.canonical_email(e text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when t.d in ('gmail.com', 'googlemail.com') then replace(split_part(t.l, '+', 1), '.', '') || '@gmail.com'
    else lower(e)
  end
  from (select lower(split_part(e, '@', 1)) as l, lower(split_part(e, '@', 2)) as d) t
$$;

create table if not exists public.signup_guard (
  user_id uuid primary key,
  canonical text not null unique,
  created_at timestamptz not null default now()
);
alter table public.signup_guard enable row level security;
revoke all on public.signup_guard from public, anon, authenticated;

insert into public.signup_guard (user_id, canonical)
select id, public.canonical_email(email) from auth.users where email is not null
on conflict do nothing;

create or replace function public.guard_signup_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c text;
begin
  if new.email is null then
    return new;
  end if;
  c := public.canonical_email(new.email);
  if exists (select 1 from public.signup_guard g where g.canonical = c and g.user_id <> new.id) then
    raise exception 'Hộp thư này đã có tài khoản (Gmail không phân biệt dấu chấm và phần sau dấu +). Hãy đăng nhập.' using errcode = 'P0001';
  end if;
  insert into public.signup_guard (user_id, canonical) values (new.id, c)
  on conflict (user_id) do update set canonical = excluded.canonical;
  return new;
end;
$$;
revoke all on function public.guard_signup_email() from public, anon, authenticated;

create or replace function public.forget_signup_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.signup_guard where user_id = old.id;
  return old;
end;
$$;
revoke all on function public.forget_signup_email() from public, anon, authenticated;

drop trigger if exists guard_signup_email_ins on auth.users;
create trigger guard_signup_email_ins
  before insert on auth.users
  for each row execute function public.guard_signup_email();

drop trigger if exists guard_signup_email_upd on auth.users;
create trigger guard_signup_email_upd
  before update of email on auth.users
  for each row when (new.email is distinct from old.email)
  execute function public.guard_signup_email();

drop trigger if exists forget_signup_email_del on auth.users;
create trigger forget_signup_email_del
  after delete on auth.users
  for each row execute function public.forget_signup_email();

-- Giới hạn theo IP -------------------------------------------------------------------------------------
create table if not exists public.signup_ip_log (
  id bigint generated always as identity primary key,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists signup_ip_log_ip_idx on public.signup_ip_log (ip, created_at desc);
alter table public.signup_ip_log enable row level security;
revoke all on public.signup_ip_log from public, anon, authenticated;

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := nullif(event -> 'metadata' ->> 'ip_address', '');
  per_hour int;
  per_day int;
begin
  -- không biết IP (hiếm) thì không giới hạn được: cho qua
  if v_ip is null then
    return '{}'::jsonb;
  end if;
  delete from public.signup_ip_log where created_at < now() - interval '2 days';
  select count(*) filter (where created_at > now() - interval '1 hour'), count(*)
    into per_hour, per_day
    from public.signup_ip_log
   where ip = v_ip and created_at > now() - interval '1 day';
  -- 8 / giờ, 20 / ngày mỗi IP (nhiều giáo viên cùng mạng trường vẫn đăng ký được)
  if per_hour >= 8 or per_day >= 20 then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 429,
      'message', 'Có quá nhiều tài khoản được tạo từ mạng này. Thử lại sau hoặc liên hệ hỗ trợ.'
    ));
  end if;
  insert into public.signup_ip_log (ip) values (v_ip);
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
