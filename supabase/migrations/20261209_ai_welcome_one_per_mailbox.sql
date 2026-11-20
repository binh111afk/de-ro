-- Quà chào mừng điểm AI: mỗi hộp thư chỉ nhận một lần.
-- Địa chỉ có dấu "+" (a+1@gmail.com) và Gmail có dấu chấm (a.b@gmail.com = ab@gmail.com) là cùng một hộp thư;
-- trước đây mỗi biến thể là một tài khoản mới nên nhận thêm 120 điểm.

create table if not exists public.ai_welcome_claims (
  mailbox text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table public.ai_welcome_claims enable row level security;
revoke all on public.ai_welcome_claims from public, anon, authenticated;
grant all on public.ai_welcome_claims to service_role;

-- Chuẩn hoá email về tên hộp thư: chữ thường, bỏ phần sau "+"; Gmail thì bỏ thêm dấu chấm và coi googlemail.com = gmail.com.
create or replace function public.ai_mailbox_key(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_email is null or position('@' in p_email) < 2 then null
    else (
      select case
        when d in ('gmail.com', 'googlemail.com') then replace(split_part(l, '+', 1), '.', '') || '@gmail.com'
        else split_part(l, '+', 1) || '@' || d
      end
      from (
        select split_part(lower(btrim(p_email)), '@', 1) as l, split_part(lower(btrim(p_email)), '@', 2) as d
      ) s
    )
  end;
$$;
revoke all on function public.ai_mailbox_key(text) from public, anon, authenticated;

-- Tài khoản đã nhận quà từ trước: ghi nhận hộp thư (trùng hộp thư thì giữ tài khoản cũ nhất, các tài khoản đã nhận rồi giữ nguyên điểm).
insert into public.ai_welcome_claims (mailbox, user_id, claimed_at)
select public.ai_mailbox_key(u.email), u.id, c.updated_at
from public.ai_credits c
join auth.users u on u.id = c.user_id
where public.ai_mailbox_key(u.email) is not null
order by c.updated_at, u.id
on conflict (mailbox) do nothing;

-- Tặng nếu chưa có dòng số dư và hộp thư chưa nhận quà. Hộp thư đã nhận qua tài khoản khác: tạo số dư 0
-- (để lượt sau không xét lại), không tặng. Trả số dư hiện tại.
create or replace function public.claim_ai_welcome(p_user uuid, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bal bigint;
  v_box text;
  v_grant bigint := greatest(p_tokens, 0);
  v_owner uuid;
begin
  if not exists (select 1 from public.ai_credits c where c.user_id = p_user) and v_grant > 0 then
    select public.ai_mailbox_key(u.email) into v_box from auth.users u where u.id = p_user;
    if v_box is not null then
      insert into public.ai_welcome_claims (mailbox, user_id) values (v_box, p_user)
      on conflict (mailbox) do nothing;
      select w.user_id into v_owner from public.ai_welcome_claims w where w.mailbox = v_box;
      if v_owner <> p_user then v_grant := 0; end if;
    end if;
  end if;

  insert into public.ai_credits (user_id, balance) values (p_user, v_grant)
  on conflict (user_id) do nothing;
  if found and v_grant > 0 then
    -- mới nhận quà: token đã dùng trước đó (theo hạn mức tháng cũ) không trừ vào điểm
    update public.ai_usage a set tokens = 0, updated_at = now() where a.user_id = p_user;
  end if;
  select c.balance into v_bal from public.ai_credits c where c.user_id = p_user;
  return coalesce(v_bal, 0);
end;
$$;
revoke all on function public.claim_ai_welcome(uuid, bigint) from public, anon, authenticated;
grant execute on function public.claim_ai_welcome(uuid, bigint) to service_role;
